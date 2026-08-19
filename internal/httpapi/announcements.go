package httpapi

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"strings"

	hubdb "github.com/wiradigitalid/worship-presenter-web/internal/db"
	"github.com/wiradigitalid/worship-presenter-web/internal/plan"
)

type announcementItem struct {
	ID        int     `json:"id"`
	ImageURL  string  `json:"image_url"`
	ServiceID *int    `json:"service_id"`
	SortOrder int     `json:"sort_order"`
	CreatedAt string  `json:"created_at"`
	UpdatedAt string  `json:"updated_at"`
}

type worshipAnnouncement struct {
	ImageURL    string
	IsRecurring bool
}

func (s *Server) listAnnouncements(w http.ResponseWriter, r *http.Request) {
	items, err := listAnnouncementItems(s.DB)
	if err != nil {
		log.Printf("Error listing announcements: %v", err)
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func listAnnouncementItems(db *sql.DB) ([]announcementItem, error) {
	rows, err := db.Query(
		`SELECT id, image_url, service_id, sort_order, created_at,
		        COALESCE(updated_at, created_at) AS updated_at
		   FROM announcement_items ORDER BY sort_order ASC, id ASC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []announcementItem{}
	for rows.Next() {
		var it announcementItem
		var sid sql.NullInt64
		if err := rows.Scan(&it.ID, &it.ImageURL, &sid, &it.SortOrder, &it.CreatedAt, &it.UpdatedAt); err != nil {
			return nil, err
		}
		it.UpdatedAt = formatTimestamp(it.UpdatedAt)
		if sid.Valid {
			v := int(sid.Int64)
			it.ServiceID = &v
		}
		items = append(items, it)
	}
	return items, rows.Err()
}

func coerceWorshipAnnouncements(raw any) ([]worshipAnnouncement, error) {
	arr, ok := raw.([]any)
	if !ok {
		return nil, fmt.Errorf("announcements must be an array")
	}
	out := make([]worshipAnnouncement, 0, len(arr))
	for i, item := range arr {
		m, ok := item.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("announcements[%d] must be an object", i)
		}
		url, err := plan.AssertAnnouncementImageURL(asString(m["image_url"]))
		if err != nil {
			return nil, err
		}
		oneOff, hasOneOff := m["isOneOff"]
		recurring, _ := m["is_recurring"]
		isRecurring := false
		if hasOneOff {
			if b, ok := oneOff.(bool); ok && b {
				isRecurring = false
			} else if b, ok := oneOff.(bool); ok && !b {
				isRecurring = true
			}
		} else if b, ok := recurring.(bool); ok {
			isRecurring = b
		}
		out = append(out, worshipAnnouncement{ImageURL: url, IsRecurring: isRecurring})
	}
	return out, nil
}

func syncWorshipAnnouncements(db *sql.DB, serviceID int, items []worshipAnnouncement, clearMaster bool) error {
	var exists int
	if err := db.QueryRow(`SELECT COUNT(*) FROM services WHERE id = ?`, serviceID).Scan(&exists); err != nil {
		return err
	}
	if exists == 0 {
		return fmt.Errorf("Service %d not found", serviceID)
	}
	rows, err := db.Query(
		`SELECT id, image_url FROM announcement_items WHERE service_id IS NULL ORDER BY sort_order, id`,
	)
	if err != nil {
		return err
	}
	type masterRow struct {
		ID  int
		URL string
	}
	var current []masterRow
	for rows.Next() {
		var r masterRow
		if err := rows.Scan(&r.ID, &r.URL); err != nil {
			rows.Close()
			return err
		}
		current = append(current, r)
	}
	rows.Close()
	var currentURLs []string
	for _, r := range current {
		currentURLs = append(currentURLs, r.URL)
	}
	working := items
	var desired []string
	for _, i := range working {
		if i.IsRecurring {
			desired = append(desired, i.ImageURL)
		}
	}
	if len(desired) == 0 && len(currentURLs) > 0 && !clearMaster {
		var rebuilt []worshipAnnouncement
		for _, u := range currentURLs {
			rebuilt = append(rebuilt, worshipAnnouncement{ImageURL: u, IsRecurring: true})
		}
		for _, i := range working {
			if !i.IsRecurring {
				rebuilt = append(rebuilt, i)
			}
		}
		working = rebuilt
		desired = currentURLs
	}
	masterChanged := len(desired) != len(currentURLs)
	if !masterChanged {
		for i, u := range desired {
			if u != currentURLs[i] {
				masterChanged = true
				break
			}
		}
	}
	if _, err := db.Exec(`DELETE FROM announcement_items WHERE service_id = ?`, serviceID); err != nil {
		return err
	}
	if masterChanged {
		if _, err := db.Exec(`DELETE FROM announcement_items WHERE service_id IS NULL`); err != nil {
			return err
		}
		for i, item := range working {
			var sid any
			if !item.IsRecurring {
				sid = serviceID
			}
			if _, err := db.Exec(
				`INSERT INTO announcement_items (image_url, service_id, sort_order, updated_at) VALUES (?, ?, ?, `+hubdb.StampNowSQL+`)`,
				item.ImageURL, sid, i,
			); err != nil {
				return err
			}
		}
		return nil
	}
	idsByURL := map[string][]int{}
	for _, r := range current {
		idsByURL[r.URL] = append(idsByURL[r.URL], r.ID)
	}
	for i, item := range working {
		if item.IsRecurring {
			ids := idsByURL[item.ImageURL]
			if len(ids) > 0 {
				id := ids[0]
				idsByURL[item.ImageURL] = ids[1:]
				if _, err := db.Exec(`UPDATE announcement_items SET sort_order = ? WHERE id = ?`, i, id); err != nil {
					return err
				}
			}
			continue
		}
		if _, err := db.Exec(
			`INSERT INTO announcement_items (image_url, service_id, sort_order, updated_at) VALUES (?, ?, ?, `+hubdb.StampNowSQL+`)`,
			item.ImageURL, serviceID, i,
		); err != nil {
			return err
		}
	}
	return nil
}

func isClientAnnouncementError(message string) bool {
	return strings.Contains(strings.ToLower(message), "image_url") ||
		strings.Contains(message, "Video/MP4") ||
		strings.Contains(strings.ToLower(message), "service_id") ||
		strings.Contains(strings.ToLower(message), "items") ||
		strings.Contains(strings.ToLower(message), "announcements") ||
		strings.Contains(strings.ToLower(message), "must be") ||
		strings.Contains(strings.ToLower(message), "not found")
}

func (s *Server) addAnnouncement(w http.ResponseWriter, r *http.Request) {
	body, err, status, msg := readJSONObject(r, 1<<20)
	if err != nil {
		writeError(w, status, msg)
		return
	}
	url, err := plan.AssertAnnouncementImageURL(asString(body["image_url"]))
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	var serviceID any
	if v, has := body["service_id"]; has && v != nil {
		n, ok := asPositiveInt(v)
		if !ok {
			writeError(w, http.StatusBadRequest, "service_id must be a positive integer or null")
			return
		}
		var exists int
		if e := s.DB.QueryRow(`SELECT COUNT(*) FROM services WHERE id = ?`, n).Scan(&exists); e != nil || exists == 0 {
			writeError(w, http.StatusBadRequest, fmt.Sprintf("Service %d not found", n))
			return
		}
		serviceID = n
	}
	sortOrder := 0
	if v, has := body["sort_order"]; has {
		n, ok := asInt(v)
		if !ok {
			writeError(w, http.StatusBadRequest, "sort_order must be an integer")
			return
		}
		sortOrder = n
	} else {
		_ = s.DB.QueryRow(`SELECT COALESCE(MAX(sort_order), -1) + 1 FROM announcement_items`).Scan(&sortOrder)
	}
	res, err := s.DB.Exec(
		`INSERT INTO announcement_items (image_url, service_id, sort_order, updated_at) VALUES (?, ?, ?, `+hubdb.StampNowSQL+`)`,
		url, serviceID, sortOrder,
	)
	if err != nil {
		log.Printf("Error adding announcement: %v", err)
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	id, _ := res.LastInsertId()
	item, err := getAnnouncement(s.DB, int(id))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"item": item})
}

func getAnnouncement(db *sql.DB, id int) (*announcementItem, error) {
	var it announcementItem
	var sid sql.NullInt64
	err := db.QueryRow(
		`SELECT id, image_url, service_id, sort_order, created_at,
		        COALESCE(updated_at, created_at)
		   FROM announcement_items WHERE id = ?`,
		id,
	).Scan(&it.ID, &it.ImageURL, &sid, &it.SortOrder, &it.CreatedAt, &it.UpdatedAt)
	if err != nil {
		return nil, err
	}
	it.UpdatedAt = formatTimestamp(it.UpdatedAt)
	if sid.Valid {
		v := int(sid.Int64)
		it.ServiceID = &v
	}
	return &it, nil
}

func (s *Server) replaceAnnouncements(w http.ResponseWriter, r *http.Request) {
	body, err, status, msg := readJSONObject(r, 4<<20)
	if err != nil {
		writeError(w, status, msg)
		return
	}
	raw, ok := body["items"].([]any)
	if !ok {
		writeError(w, http.StatusBadRequest, "items must be an array")
		return
	}
	tx, err := s.DB.Begin()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	defer tx.Rollback()
	if _, err := tx.Exec(`DELETE FROM announcement_items`); err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	for i, item := range raw {
		m, ok := item.(map[string]any)
		if !ok {
			writeError(w, http.StatusBadRequest, fmt.Sprintf("items[%d] must be an object", i))
			return
		}
		url, err := plan.AssertAnnouncementImageURL(asString(m["image_url"]))
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		var sid any
		if v, has := m["service_id"]; has && v != nil {
			n, ok := asPositiveInt(v)
			if !ok {
				writeError(w, http.StatusBadRequest, fmt.Sprintf("items[%d].service_id must be a positive integer or null", i))
				return
			}
			sid = n
		}
		sortOrder := i
		if v, has := m["sort_order"]; has {
			n, ok := asInt(v)
			if !ok {
				writeError(w, http.StatusBadRequest, fmt.Sprintf("items[%d].sort_order must be an integer", i))
				return
			}
			sortOrder = n
		}
		if _, err := tx.Exec(
			`INSERT INTO announcement_items (image_url, service_id, sort_order, updated_at) VALUES (?, ?, ?, `+hubdb.StampNowSQL+`)`,
			url, sid, sortOrder,
		); err != nil {
			log.Printf("Error replacing announcements: %v", err)
			writeError(w, http.StatusInternalServerError, "Internal Server Error")
			return
		}
	}
	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	items, err := listAnnouncementItems(s.DB)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (s *Server) patchAnnouncement(w http.ResponseWriter, r *http.Request) {
	id, ok := parsePositiveID(r.PathValue("id"))
	if !ok {
		writeError(w, http.StatusBadRequest, "Invalid announcement id")
		return
	}
	existing, err := getAnnouncement(s.DB, id)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "Announcement not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	body, err, status, msg := readJSONObject(r, 1<<20)
	if err != nil {
		writeError(w, status, msg)
		return
	}
	token := concurrencyToken(r, body)
	if token == "" {
		writeError(w, http.StatusBadRequest, requiredUpdatedAtMsg)
		return
	}
	if token != existing.UpdatedAt {
		writeStaleToken(w, announcementConflictMsg, existing.UpdatedAt)
		return
	}
	url := existing.ImageURL
	if v, has := body["image_url"]; has {
		u, e := plan.AssertAnnouncementImageURL(asString(v))
		if e != nil {
			writeError(w, http.StatusBadRequest, e.Error())
			return
		}
		url = u
	}
	sid := any(nil)
	if existing.ServiceID != nil {
		sid = *existing.ServiceID
	}
	if _, has := body["service_id"]; has {
		if body["service_id"] == nil {
			sid = nil
		} else {
			n, ok := asPositiveInt(body["service_id"])
			if !ok {
				writeError(w, http.StatusBadRequest, "service_id must be a positive integer or null")
				return
			}
			sid = n
		}
	}
	sortOrder := existing.SortOrder
	if v, has := body["sort_order"]; has {
		n, ok := asInt(v)
		if !ok {
			writeError(w, http.StatusBadRequest, "sort_order must be an integer")
			return
		}
		sortOrder = n
	}
	res, err := s.DB.Exec(
		`UPDATE announcement_items SET image_url = ?, service_id = ?, sort_order = ?, updated_at = `+hubdb.StampNowSQL+`
		  WHERE id = ? AND COALESCE(updated_at, created_at) = ?`,
		url, sid, sortOrder, id, token,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		latest, loadErr := getAnnouncement(s.DB, id)
		if loadErr == sql.ErrNoRows {
			writeError(w, http.StatusNotFound, "Announcement not found")
			return
		}
		if loadErr != nil {
			writeError(w, http.StatusInternalServerError, "Internal Server Error")
			return
		}
		writeStaleToken(w, announcementConflictMsg, latest.UpdatedAt)
		return
	}
	item, err := getAnnouncement(s.DB, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"item": item})
}

func (s *Server) deleteAnnouncement(w http.ResponseWriter, r *http.Request) {
	id, ok := parsePositiveID(r.PathValue("id"))
	if !ok {
		writeError(w, http.StatusBadRequest, "Invalid announcement id")
		return
	}
	body, err, status, msg := readJSONObjectOptional(r, 1<<20)
	if err != nil {
		writeError(w, status, msg)
		return
	}
	token := concurrencyToken(r, body)
	if token == "" {
		writeError(w, http.StatusBadRequest, requiredUpdatedAtMsg)
		return
	}
	existing, err := getAnnouncement(s.DB, id)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "Announcement not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if token != existing.UpdatedAt {
		writeStaleToken(w, announcementConflictMsg, existing.UpdatedAt)
		return
	}
	res, err := s.DB.Exec(
		`DELETE FROM announcement_items WHERE id = ? AND COALESCE(updated_at, created_at) = ?`,
		id, token,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		latest, loadErr := getAnnouncement(s.DB, id)
		if loadErr == sql.ErrNoRows {
			writeError(w, http.StatusNotFound, "Announcement not found")
			return
		}
		if loadErr != nil {
			writeError(w, http.StatusInternalServerError, "Internal Server Error")
			return
		}
		writeStaleToken(w, announcementConflictMsg, latest.UpdatedAt)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"message": "Announcement deleted successfully"})
}

func asPositiveInt(v any) (int, bool) {
	n, ok := asInt(v)
	return n, ok && n > 0
}

func asInt(v any) (int, bool) {
	switch n := v.(type) {
	case float64:
		if n == float64(int(n)) {
			return int(n), true
		}
	case int:
		return n, true
	case jsonNumber:
		return n.Int()
	}
	return 0, false
}

type jsonNumber struct{}

func (jsonNumber) Int() (int, bool) { return 0, false }
