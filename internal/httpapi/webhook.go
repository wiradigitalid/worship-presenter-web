package httpapi

import (
	"crypto/subtle"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/wiradigitalid/worship-presenter-web/internal/db"
	"github.com/wiradigitalid/worship-presenter-web/internal/parse"
	"github.com/wiradigitalid/worship-presenter-web/internal/plan"
)

func (s *Server) postWebhook(w http.ResponseWriter, r *http.Request) {
	env := os.Getenv("WEBHOOK_SECRET")
	if env == "" {
		writeError(w, http.StatusServiceUnavailable, "Webhook not configured (WEBHOOK_SECRET missing)")
		return
	}
	provided := r.Header.Get("X-Webhook-Secret")
	if provided == "" {
		authz := r.Header.Get("Authorization")
		provided = regexpReplaceBearer(authz)
	}
	if provided == "" || subtle.ConstantTimeCompare([]byte(provided), []byte(env)) != 1 {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	body, err, status, msg := readJSONObject(r, 4<<20)
	if err != nil {
		writeError(w, status, msg)
		return
	}
	if asString(body["action"]) == "correct" {
		s.handleCorrection(w, body)
		return
	}
	rawPayload := asString(body["text"])
	if rawPayload == "" {
		if msg, ok := body["message"].(map[string]any); ok {
			rawPayload = asString(msg["text"])
		}
	}
	if rawPayload == "" {
		writeError(w, http.StatusBadRequest, "Missing or invalid text payload in request body")
		return
	}
	var announcementURLs []string
	if _, has := body["announcements"]; has {
		raw := body["announcements"]
		arr, ok := raw.([]any)
		if !ok {
			writeError(w, http.StatusBadRequest, "announcements must be an array of image URLs")
			return
		}
		for _, u := range arr {
			url, err := plan.AssertAnnouncementImageURL(asString(u))
			if err != nil {
				writeError(w, http.StatusBadRequest, err.Error())
				return
			}
			announcementURLs = append(announcementURLs, url)
		}
	}
	parsed := parse.ParseRundown(s.DB, rawPayload)
	serviceDate := parse.LocalISODate(time.Now())
	if parsed.Date != nil && *parsed.Date != "" {
		serviceDate = *parsed.Date
	}
	parsedJSON, _ := json.Marshal(parsed)
	imagesJSON := "[]"
	if imgs, ok := body["images"]; ok {
		b, _ := json.Marshal(imgs)
		imagesJSON = string(b)
	}
	tx, err := s.DB.Begin()
	if err != nil {
		log.Printf("Error processing webhook: %v", err)
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	defer tx.Rollback()
	var existingID int
	err = tx.QueryRow(`SELECT id FROM services WHERE date = ?`, serviceDate).Scan(&existingID)
	updated := false
	serviceID := 0
	if err == nil {
		if _, err := tx.Exec(
			`UPDATE services SET raw_payload = ?, parsed_data = ?, images_payload = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
			rawPayload, string(parsedJSON), imagesJSON, existingID,
		); err != nil {
			log.Printf("Error processing webhook: %v", err)
			writeError(w, http.StatusInternalServerError, "Internal Server Error")
			return
		}
		serviceID = existingID
		updated = true
	} else if err == sql.ErrNoRows {
		res, err := tx.Exec(
			`INSERT INTO services (date, raw_payload, parsed_data, images_payload, updated_at)
			 VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
			serviceDate, rawPayload, string(parsedJSON), imagesJSON,
		)
		if err != nil {
			log.Printf("Error processing webhook: %v", err)
			writeError(w, http.StatusInternalServerError, "Internal Server Error")
			return
		}
		id, _ := res.LastInsertId()
		serviceID = int(id)
	} else {
		log.Printf("Error processing webhook: %v", err)
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if !updated {
		if err := db.CloneRegistryToNewService(s.DB, serviceID); err != nil {
			log.Printf("Error cloning registry for webhook service: %v", err)
			writeError(w, http.StatusInternalServerError, "Internal Server Error")
			return
		}
	}
	announcementsAdded := 0
	if announcementURLs != nil {
		if _, err := s.DB.Exec(`DELETE FROM announcement_items WHERE service_id = ?`, serviceID); err == nil {
			var order int
			_ = s.DB.QueryRow(`SELECT COALESCE(MAX(sort_order), -1) + 1 FROM announcement_items`).Scan(&order)
			for _, u := range announcementURLs {
				if _, err := s.DB.Exec(
					`INSERT INTO announcement_items (image_url, service_id, sort_order) VALUES (?, ?, ?)`,
					u, serviceID, order,
				); err == nil {
					announcementsAdded++
					order++
				}
			}
		}
	}
	resolved := []map[string]any{}
	for _, it := range parsed.Items {
		if it.Type == "hymn" {
			resolved = append(resolved, map[string]any{"number": it.Number, "title": it.Title})
		}
	}
	msgOut := "Webhook received and processed successfully"
	statusOut := http.StatusCreated
	if updated {
		msgOut = "Webhook received; existing service for date updated"
		statusOut = http.StatusOK
	}
	writeJSON(w, statusOut, map[string]any{
		"message":           msgOut,
		"id":                serviceID,
		"date":              serviceDate,
		"parsedData":        parsed,
		"resolvedHymns":     resolved,
		"failedHymnNumbers": parsed.FailedHymnNumbers,
		"imagesCount":       0,
		"announcementsAdded": announcementsAdded,
		"updated":           updated,
	})
}

func (s *Server) handleCorrection(w http.ResponseWriter, body map[string]any) {
	text := asString(body["text"])
	if text == "" {
		if msg, ok := body["message"].(map[string]any); ok {
			text = asString(msg["text"])
		}
	}
	if text == "" {
		writeError(w, http.StatusBadRequest, "Correction requires text and/or fields")
		return
	}
	parsed := parse.ParseRundown(s.DB, text)
	var existing struct {
		ID   int
		Date string
	}
	dateRaw := asString(body["date"])
	serviceID, _ := asPositiveInt(body["serviceId"])
	if serviceID == 0 {
		serviceID, _ = asPositiveInt(body["id"])
	}
	var err error
	if serviceID > 0 {
		err = s.DB.QueryRow(`SELECT id, date FROM services WHERE id = ?`, serviceID).Scan(&existing.ID, &existing.Date)
	} else if dateRaw != "" {
		date := dateRaw
		if parsed.Date != nil {
			date = *parsed.Date
		}
		err = s.DB.QueryRow(`SELECT id, date FROM services WHERE date = ?`, date).Scan(&existing.ID, &existing.Date)
	} else {
		writeError(w, http.StatusNotFound, "Service not found for correction")
		return
	}
	if err != nil {
		writeError(w, http.StatusNotFound, "Service not found for correction")
		return
	}
	newDate := existing.Date
	if parsed.Date != nil && *parsed.Date != "" {
		newDate = *parsed.Date
	}
	parsedJSON, _ := json.Marshal(parsed)
	if _, err := s.DB.Exec(
		`UPDATE services SET date = ?, raw_payload = ?, parsed_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
		newDate, text, string(parsedJSON), existing.ID,
	); err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	resolved := []map[string]any{}
	for _, it := range parsed.Items {
		if it.Type == "hymn" {
			resolved = append(resolved, map[string]any{"number": it.Number, "title": it.Title})
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"message":           "Service correction applied",
		"action":            "correct",
		"id":                existing.ID,
		"date":              newDate,
		"parsedData":        parsed,
		"resolvedHymns":     resolved,
		"failedHymnNumbers": parsed.FailedHymnNumbers,
		"updated":           true,
	})
}

func regexpReplaceBearer(authz string) string {
	if authz == "" {
		return ""
	}
	if strings.HasPrefix(strings.ToLower(authz), "bearer ") {
		return strings.TrimSpace(authz[7:])
	}
	return ""
}
