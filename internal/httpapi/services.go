package httpapi

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/wiradigitalid/worship-presenter-web/internal/db"
	"github.com/wiradigitalid/worship-presenter-web/internal/parse"
	"github.com/wiradigitalid/worship-presenter-web/internal/plan"
)

type serviceListItem struct {
	ID         int             `json:"id"`
	Date       string          `json:"date"`
	CreatedAt  string          `json:"created_at"`
	UpdatedAt  string          `json:"updated_at"`
	RawPayload string          `json:"raw_payload"`
	ParsedData json.RawMessage `json:"parsed_data"`
}

func (s *Server) listServices(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	var rows *sql.Rows
	var err error
	const cols = `id, date, raw_payload, parsed_data, created_at, COALESCE(updated_at, created_at) AS updated_at`
	if q != "" {
		like := "%" + q + "%"
		rows, err = s.DB.Query(
			`SELECT `+cols+` FROM services
			  WHERE date LIKE ? OR raw_payload LIKE ? OR IFNULL(parsed_data, '') LIKE ?
			  ORDER BY date DESC, id DESC`,
			like, like, like,
		)
	} else {
		rows, err = s.DB.Query(`SELECT ` + cols + ` FROM services ORDER BY date DESC, id DESC`)
	}
	if err != nil {
		log.Printf("Error listing services: %v", err)
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	defer rows.Close()
	list := []serviceListItem{}
	for rows.Next() {
		var it serviceListItem
		var parsed sql.NullString
		if err := rows.Scan(&it.ID, &it.Date, &it.RawPayload, &parsed, &it.CreatedAt, &it.UpdatedAt); err != nil {
			log.Printf("Error listing services: %v", err)
			writeError(w, http.StatusInternalServerError, "Internal Server Error")
			return
		}
		if parsed.Valid && parsed.String != "" {
			it.ParsedData = json.RawMessage(parsed.String)
		} else {
			it.ParsedData = []byte("null")
		}
		it.CreatedAt = formatTimestamp(it.CreatedAt)
		it.UpdatedAt = formatTimestamp(it.UpdatedAt)
		list = append(list, it)
	}
	qOut := any(nil)
	if q != "" {
		qOut = q
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"services": list,
		"q":        qOut,
		"count":    len(list),
	})
}

func (s *Server) createService(w http.ResponseWriter, r *http.Request) {
	body, err, status, msg := readJSONObject(r, 4<<20)
	if err != nil {
		writeError(w, status, msg)
		return
	}
	rawPayload, _ := body["raw_payload"].(string)
	if strings.TrimSpace(rawPayload) == "" {
		writeError(w, http.StatusBadRequest, "raw_payload is required")
		return
	}
	parsed := parse.Normalize(parse.ParseRundown(s.DB, rawPayload))
	if parse.HasStructuredFields(body) {
		parse.ApplyStructuredFields(s.DB, &parsed, body)
		parsed = parse.Normalize(parsed)
	}
	if parsed.Date == nil || *parsed.Date == "" {
		writeError(w, http.StatusBadRequest, "Could not parse service date from raw_payload")
		return
	}
	serviceDate := *parsed.Date

	images, participants, announcements, errMsg := narrowCreatePayload(body)
	if errMsg != "" {
		writeError(w, http.StatusBadRequest, errMsg)
		return
	}

	allowSecond, _ := body["allowSecond"].(bool)
	var existingID int
	err = s.DB.QueryRow(`SELECT id FROM services WHERE date = ?`, serviceDate).Scan(&existingID)
	if err == nil && !allowSecond {
		writeJSON(w, http.StatusConflict, map[string]any{
			"error":      "Service already exists for this date",
			"existingId": existingID,
			"date":       serviceDate,
		})
		return
	}
	if err != nil && err != sql.ErrNoRows {
		log.Printf("Error creating service: %v", err)
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	parsedJSON, _ := json.Marshal(parsed)
	imagesJSON, _ := json.Marshal(images)
	tx, err := s.DB.Begin()
	if err != nil {
		log.Printf("Error creating service: %v", err)
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	defer tx.Rollback()
	res, err := tx.Exec(
		`INSERT INTO services (date, raw_payload, parsed_data, images_payload, participants_payload, updated_at)
		 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
		serviceDate, rawPayload, string(parsedJSON), string(imagesJSON), participants,
	)
	if err != nil {
		log.Printf("Error creating service: %v", err)
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	id, _ := res.LastInsertId()
	if err := tx.Commit(); err != nil {
		log.Printf("Error creating service: %v", err)
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if announcements != nil {
		if err := syncWorshipAnnouncements(s.DB, int(id), announcements, boolFrom(body["clearMaster"])); err != nil {
			log.Printf("Error creating service: %v", err)
			writeError(w, http.StatusInternalServerError, "Internal Server Error")
			return
		}
	}
	if err := db.CloneRegistryToNewService(s.DB, int(id)); err != nil {
		log.Printf("Error creating service: %v", err)
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{
		"message":           "Service created successfully",
		"id":                id,
		"date":              serviceDate,
		"failedHymnNumbers": parsed.FailedHymnNumbers,
	})
}

func boolFrom(v any) bool {
	b, _ := v.(bool)
	return b
}

func narrowCreatePayload(body map[string]any) (images map[string]any, participants any, announcements []worshipAnnouncement, errMsg string) {
	sermon, err := optionalImage(body, "sermonGraphicUrl")
	if err != nil {
		return nil, nil, nil, err.Error()
	}
	family, err := optionalImage(body, "familyPhotoUrl")
	if err != nil {
		return nil, nil, nil, err.Error()
	}
	youth, err := optionalImage(body, "youthPhotoUrl")
	if err != nil {
		return nil, nil, nil, err.Error()
	}
	var urls []string
	if arr, ok := body["images"].([]any); ok {
		for _, x := range arr {
			if s, ok := x.(string); ok && plan.IsSafeImageURL(s) {
				urls = append(urls, s)
			}
		}
	}
	if urls == nil {
		urls = []string{}
	}
	images = map[string]any{
		"images":           urls,
		"sermonGraphicUrl": sermon,
		"familyPhotoUrl":   family,
		"youthPhotoUrl":    youth,
	}
	if _, has := body["participantsRaw"]; has {
		switch v := body["participantsRaw"].(type) {
		case nil:
			participants = nil
		case string:
			participants = v
		default:
			return nil, nil, nil, "participantsRaw must be a string or null"
		}
	}
	if _, has := body["announcements"]; has {
		items, e := coerceWorshipAnnouncements(body["announcements"])
		if e != nil {
			return nil, nil, nil, e.Error()
		}
		announcements = items
	}
	return images, participants, announcements, ""
}

func optionalImage(body map[string]any, field string) (any, error) {
	v, has := body[field]
	if !has {
		return nil, nil
	}
	_, out, err := plan.CoerceOptionalSafeImageURL(v, field)
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, nil
	}
	return *out, nil
}

func (s *Server) getService(w http.ResponseWriter, r *http.Request) {
	id, ok := parsePositiveID(r.PathValue("id"))
	if !ok {
		writeError(w, http.StatusBadRequest, "Invalid Service ID")
		return
	}
	row := s.DB.QueryRow(
		`SELECT id, date, raw_payload, parsed_data, images_payload, participants_payload,
		        created_at, COALESCE(updated_at, created_at)
		   FROM services WHERE id = ?`,
		id,
	)
	var out struct {
		ID            int             `json:"id"`
		Date          string          `json:"date"`
		RawPayload    string          `json:"raw_payload"`
		ParsedData    json.RawMessage `json:"parsed_data"`
		ImagesPayload json.RawMessage `json:"images_payload"`
		Participants  any             `json:"participants_payload"`
		CreatedAt     string          `json:"created_at"`
		UpdatedAt     string          `json:"updated_at"`
		Plan          any             `json:"plan"`
		PlanIdentity  string          `json:"plan_identity"`
		Transition    string          `json:"transition"`
	}
	var parsed, images, parts sql.NullString
	if err := row.Scan(&out.ID, &out.Date, &out.RawPayload, &parsed, &images, &parts, &out.CreatedAt, &out.UpdatedAt); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusNotFound, "Service not found")
			return
		}
		log.Printf("Error reading service: %v", err)
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	out.ParsedData = nullJSON(parsed)
	out.ImagesPayload = nullJSON(images)
	if parts.Valid {
		out.Participants = parts.String
	}
	out.CreatedAt = formatTimestamp(out.CreatedAt)
	out.UpdatedAt = formatTimestamp(out.UpdatedAt)
	date, items, transition, err := plan.PlanForService(s.DB, id)
	if err == nil {
		out.Plan = items
		out.PlanIdentity = plan.Identity(items)
		out.Transition = transition
		if date != "" {
			out.Date = date
		}
	} else {
		out.Plan = []any{}
		out.PlanIdentity = plan.Identity(nil)
		out.Transition = plan.LoadTransition(s.DB)
	}
	writeJSON(w, http.StatusOK, out)
}

func nullJSON(s sql.NullString) json.RawMessage {
	if s.Valid && s.String != "" {
		return json.RawMessage(s.String)
	}
	return json.RawMessage("null")
}

func (s *Server) deleteService(w http.ResponseWriter, r *http.Request) {
	id, ok := parsePositiveID(r.PathValue("id"))
	if !ok {
		writeError(w, http.StatusBadRequest, "Invalid Service ID")
		return
	}
	res, err := s.DB.Exec(`DELETE FROM services WHERE id = ?`, id)
	if err != nil {
		log.Printf("Error deleting service: %v", err)
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		writeError(w, http.StatusNotFound, "Service not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"message": "Service deleted successfully"})
}

func (s *Server) updateService(w http.ResponseWriter, r *http.Request) {
	id, ok := parsePositiveID(r.PathValue("id"))
	if !ok {
		writeError(w, http.StatusBadRequest, "Invalid Service ID")
		return
	}
	body, err, status, msg := readJSONObject(r, 4<<20)
	if err != nil {
		writeError(w, status, msg)
		return
	}
	clientUpdatedAt, _ := body["updated_at"].(string)
	clientUpdatedAt = strings.TrimSpace(clientUpdatedAt)
	if clientUpdatedAt == "" {
		writeError(w, http.StatusBadRequest, "updated_at is required for concurrent edit protection")
		return
	}
	rawValue, _ := body["raw_payload"].(string)
	var rawPayload *string
	if rawValue != "" {
		rawPayload = &rawValue
	}
	if rawPayload == nil && !parse.HasStructuredFields(body) {
		writeError(w, http.StatusBadRequest, "Missing raw_payload or structured fields")
		return
	}

	var existing struct {
		raw, parsed, images, participants, date, created, updated sql.NullString
	}
	err = s.DB.QueryRow(
		`SELECT raw_payload, parsed_data, images_payload, participants_payload, date, created_at, updated_at
		   FROM services WHERE id = ?`,
		id,
	).Scan(&existing.raw, &existing.parsed, &existing.images, &existing.participants, &existing.date, &existing.created, &existing.updated)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "Service not found")
		return
	}
	if err != nil {
		log.Printf("Error updating service: %v", err)
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	currentUpdatedAt := formatTimestamp(existing.updated.String)
	if currentUpdatedAt == "" {
		currentUpdatedAt = formatTimestamp(existing.created.String)
	}
	clientUpdatedAt = formatTimestamp(clientUpdatedAt)
	if clientUpdatedAt != currentUpdatedAt {
		writeJSON(w, http.StatusConflict, map[string]any{
			"error":      "Conflict: service was modified; refresh and retry",
			"updated_at": currentUpdatedAt,
		})
		return
	}

	imagesJSON, errMsg := mergeImagesPayload(existing.images, body)
	if errMsg != "" {
		writeError(w, http.StatusBadRequest, errMsg)
		return
	}
	participants := existing.participants.String
	participantsSet := false
	if _, has := body["participantsRaw"]; has {
		participantsSet = true
		switch v := body["participantsRaw"].(type) {
		case nil:
			participants = ""
		case string:
			participants = v
		default:
			writeError(w, http.StatusBadRequest, "participantsRaw must be a string or null")
			return
		}
	}
	var announcements []worshipAnnouncement
	if _, has := body["announcements"]; has {
		items, e := coerceWorshipAnnouncements(body["announcements"])
		if e != nil {
			writeError(w, http.StatusBadRequest, e.Error())
			return
		}
		announcements = items
	}

	storedRaw := existing.raw.String
	if rawPayload != nil {
		storedRaw = *rawPayload
	}
	var parsed parse.Rundown
	if rawPayload != nil {
		parsed = parse.Normalize(parse.ParseRundown(s.DB, storedRaw))
	} else if existing.parsed.Valid && existing.parsed.String != "" {
		if json.Unmarshal([]byte(existing.parsed.String), &parsed) != nil {
			parsed = parse.Normalize(parse.ParseRundown(s.DB, storedRaw))
		} else {
			parsed = parse.Normalize(parsed)
		}
	} else {
		parsed = parse.Normalize(parse.ParseRundown(s.DB, storedRaw))
	}
	if parse.HasStructuredFields(body) {
		parse.ApplyStructuredFields(s.DB, &parsed, body)
		parsed = parse.Normalize(parsed)
	}
	parsedJSON, _ := json.Marshal(parsed)
	newDate := existing.date.String
	if parsed.Date != nil && *parsed.Date != "" {
		newDate = *parsed.Date
	}

	tx, err := s.DB.Begin()
	if err != nil {
		log.Printf("Error updating service: %v", err)
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	defer tx.Rollback()
	assignments := []string{`date = ?`, `raw_payload = ?`, `parsed_data = ?`, `updated_at = CURRENT_TIMESTAMP`}
	args := []any{newDate, storedRaw, string(parsedJSON)}
	if imagesJSON != nil {
		assignments = append(assignments, `images_payload = ?`)
		args = append(args, *imagesJSON)
	}
	if participantsSet {
		assignments = append(assignments, `participants_payload = ?`)
		if participants == "" && body["participantsRaw"] == nil {
			args = append(args, nil)
		} else {
			args = append(args, participants)
		}
	}
	args = append(args, id, currentUpdatedAt)
	res, err := tx.Exec(
		`UPDATE services SET `+strings.Join(assignments, ", ")+`
		  WHERE id = ? AND datetime(COALESCE(updated_at, created_at)) = datetime(?)`,
		args...,
	)
	if err != nil {
		log.Printf("Error updating service: %v", err)
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		writeJSON(w, http.StatusConflict, map[string]any{
			"error":      "Conflict: service was modified; refresh and retry",
			"updated_at": currentUpdatedAt,
		})
		return
	}
	if err := tx.Commit(); err != nil {
		log.Printf("Error updating service: %v", err)
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if announcements != nil {
		if err := syncWorshipAnnouncements(s.DB, id, announcements, boolFrom(body["clearMaster"])); err != nil {
			log.Printf("Error updating service: %v", err)
			writeError(w, http.StatusInternalServerError, "Internal Server Error")
			return
		}
	}
	var updatedAt string
	_ = s.DB.QueryRow(`SELECT COALESCE(updated_at, created_at) FROM services WHERE id = ?`, id).Scan(&updatedAt)
	updatedAt = formatTimestamp(updatedAt)
	failed := parsed.FailedHymnNumbers
	if failed == nil {
		failed = []int{}
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"message":           "Service updated successfully",
		"failedHymnNumbers": failed,
		"updated_at":        updatedAt,
	})
}

func mergeImagesPayload(stored sql.NullString, body map[string]any) (*string, string) {
	_, hasImages := body["images"]
	_, hasSermon := body["sermonGraphicUrl"]
	_, hasFamily := body["familyPhotoUrl"]
	_, hasYouth := body["youthPhotoUrl"]
	if !hasImages && !hasSermon && !hasFamily && !hasYouth {
		return nil, ""
	}
	current := map[string]any{
		"images":           []any{},
		"sermonGraphicUrl": nil,
		"familyPhotoUrl":   nil,
		"youthPhotoUrl":    nil,
	}
	if stored.Valid && stored.String != "" {
		var v any
		if json.Unmarshal([]byte(stored.String), &v) == nil {
			if arr, ok := v.([]any); ok {
				current["images"] = arr
			} else if obj, ok := v.(map[string]any); ok {
				if imgs, ok := obj["images"]; ok {
					current["images"] = imgs
				} else if flyers, ok := obj["flyers"]; ok {
					current["images"] = flyers
				}
				if _, ok := obj["sermonGraphicUrl"]; ok {
					current["sermonGraphicUrl"] = obj["sermonGraphicUrl"]
				}
				if _, ok := obj["familyPhotoUrl"]; ok {
					current["familyPhotoUrl"] = obj["familyPhotoUrl"]
				}
				if _, ok := obj["youthPhotoUrl"]; ok {
					current["youthPhotoUrl"] = obj["youthPhotoUrl"]
				}
			}
		}
	}
	if hasImages {
		arr, _ := body["images"].([]any)
		urls := []string{}
		if arr != nil {
			for _, x := range arr {
				if s, ok := x.(string); ok && plan.IsSafeImageURL(s) {
					urls = append(urls, s)
				}
			}
		}
		current["images"] = urls
	}
	if hasSermon {
		_, out, err := plan.CoerceOptionalSafeImageURL(body["sermonGraphicUrl"], "sermonGraphicUrl")
		if err != nil {
			return nil, err.Error()
		}
		if out == nil {
			current["sermonGraphicUrl"] = nil
		} else {
			current["sermonGraphicUrl"] = *out
		}
	}
	if hasFamily {
		_, out, err := plan.CoerceOptionalSafeImageURL(body["familyPhotoUrl"], "familyPhotoUrl")
		if err != nil {
			return nil, err.Error()
		}
		if out == nil {
			current["familyPhotoUrl"] = nil
		} else {
			current["familyPhotoUrl"] = *out
		}
	}
	if hasYouth {
		_, out, err := plan.CoerceOptionalSafeImageURL(body["youthPhotoUrl"], "youthPhotoUrl")
		if err != nil {
			return nil, err.Error()
		}
		if out == nil {
			current["youthPhotoUrl"] = nil
		} else {
			current["youthPhotoUrl"] = *out
		}
	}
	b, _ := json.Marshal(current)
	s := string(b)
	return &s, ""
}

func (s *Server) previewService(w http.ResponseWriter, r *http.Request) {
	body, err, status, msg := readJSONObject(r, 4<<20)
	if err != nil {
		writeError(w, status, msg)
		return
	}
	rawPayload, _ := body["raw_payload"].(string)
	if strings.TrimSpace(rawPayload) == "" {
		writeError(w, http.StatusBadRequest, "raw_payload is required")
		return
	}
	parsed := parse.Normalize(parse.ParseRundown(s.DB, rawPayload))
	if parsed.Date == nil || *parsed.Date == "" {
		writeError(w, http.StatusBadRequest, "Could not parse service date from raw_payload")
		return
	}
	sermon, err := optionalImage(body, "sermonGraphicUrl")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	family, err := optionalImage(body, "familyPhotoUrl")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	youth, err := optionalImage(body, "youthPhotoUrl")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	var flyers []string
	if arr, ok := body["announcements"].([]any); ok {
		for _, item := range arr {
			m, ok := item.(map[string]any)
			if !ok {
				continue
			}
			u, _ := m["image_url"].(string)
			if u, e := plan.AssertAnnouncementImageURL(u); e == nil {
				flyers = append(flyers, u)
			} else if plan.IsAnnouncementImageURL(u) {
				flyers = append(flyers, strings.TrimSpace(u))
			}
		}
	} else if arr, ok := body["images"].([]any); ok {
		for _, x := range arr {
			if u, ok := x.(string); ok && plan.IsAnnouncementImageURL(u) {
				flyers = append(flyers, u)
			}
		}
	}
	media := plan.Media{Flyers: flyers}
	if s, ok := sermon.(string); ok {
		media.SermonGraphicURL = &s
	}
	if s, ok := family.(string); ok {
		media.FamilyPhotoURL = &s
	}
	if s, ok := youth.(string); ok {
		media.YouthPhotoURL = &s
	}
	snap, err := plan.LoadSnapshot(s.DB, 0)
	if err != nil {
		log.Printf("Error generating preview: %v", err)
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	items, err := plan.BuildSlidePlan(*parsed.Date, parsed.ToPlan(), media, snap)
	if err != nil {
		log.Printf("Error generating preview: %v", err)
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	preview := make([]map[string]any, 0, len(items))
	for i, it := range items {
		entry := map[string]any{
			"index":      i,
			"instanceId": it.Artifact.InstanceID,
			"templateId": it.Artifact.TemplateID,
			"label":      it.Artifact.Label,
			"baseType":   it.Artifact.BaseType,
		}
		if it.Artifact.Group != nil {
			entry["groupId"] = it.Artifact.Group.ID
			entry["groupLabel"] = it.Artifact.Group.Label
			entry["role"] = it.Artifact.Group.Role
		}
		preview = append(preview, entry)
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"plan":              items,
		"previewEntries":    preview,
		"date":              *parsed.Date,
		"failedHymnNumbers": parsed.FailedHymnNumbers,
		"fields":            fieldsFromParsed(parsed),
	})
}

func fieldsFromParsed(p parse.Rundown) map[string]string {
	ref, text := "", ""
	if p.VerseReading != nil {
		if p.VerseReading.Reference != nil {
			ref = *p.VerseReading.Reference
		}
		text = p.VerseReading.Text
	}
	speaker, special, closing, family, youth := "", "", "", "", ""
	if p.Sermon != nil {
		speaker = p.Sermon.Speaker
	}
	if p.SpecialSong != nil {
		special = *p.SpecialSong
	}
	if p.ClosingPrayerPerson != nil {
		closing = *p.ClosingPrayerPerson
	}
	if p.FamilyPrayerRequest != nil {
		family = *p.FamilyPrayerRequest
	}
	if p.YouthPrayerRequest != nil {
		youth = *p.YouthPrayerRequest
	}
	return map[string]string{
		"song1Number":         "",
		"song2Number":         "",
		"song3Number":         "",
		"song4Number":         "",
		"verseReference":      ref,
		"verseText":           text,
		"sermonSpeaker":       speaker,
		"specialSong":         special,
		"closingPrayerPerson": closing,
		"familyPrayerRequest": family,
		"youthPrayerRequest":  youth,
	}
}
