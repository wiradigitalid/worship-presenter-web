package plan

import (
	"database/sql"
	"encoding/json"
	"log"
)

func loadTemplates(rows *sql.Rows) Snapshot {
	snap := Snapshot{ByID: map[string]Template{}}
	for rows.Next() {
		var id, payload, updatedAt string
		if err := rows.Scan(&id, &payload, &updatedAt); err != nil {
			log.Printf("[registry] scan failed: %v", err)
			continue
		}
		var tmpl Template
		if err := json.Unmarshal([]byte(payload), &tmpl); err != nil {
			log.Printf("[registry] template %q: persisted row rejected (not valid JSON); no layout is available: %v", id, err)
			continue
		}
		if tmpl.ID != id {
			log.Printf("[registry] template %q: persisted row rejected (payload id mismatch); no layout is available", id)
			continue
		}
		if tmpl.Layouts == nil {
			log.Printf("[registry] template %q: persisted row rejected (no layouts); no layout is available", id)
			continue
		}
		snap.Order = append(snap.Order, id)
		snap.ByID[id] = tmpl
	}
	return snap
}

func LoadSnapshot(db *sql.DB, serviceID int) (Snapshot, error) {
	var n int
	if err := db.QueryRow(
		`SELECT COUNT(*) FROM service_registry_snapshots WHERE service_id = ?`,
		serviceID,
	).Scan(&n); err != nil {
		return Snapshot{}, err
	}
	if n > 0 {
		rows, err := db.Query(
			`SELECT template_id, payload, updated_at
			   FROM service_registry_snapshots
			  WHERE service_id = ?
			  ORDER BY position`,
			serviceID,
		)
		if err != nil {
			return Snapshot{}, err
		}
		defer rows.Close()
		return loadTemplates(rows), rows.Err()
	}
	rows, err := db.Query(
		`SELECT id, payload, updated_at FROM artifact_templates ORDER BY position`,
	)
	if err != nil {
		return Snapshot{}, err
	}
	defer rows.Close()
	return loadTemplates(rows), rows.Err()
}

func LoadMedia(db *sql.DB, serviceID int, imagesPayload sql.NullString) Media {
	var raw json.RawMessage
	if imagesPayload.Valid {
		raw = json.RawMessage(imagesPayload.String)
	}
	extras := parseImagesPayload(raw)

	rows, err := db.Query(
		`SELECT image_url FROM announcement_items
		  WHERE service_id IS NULL OR service_id = ?
		  ORDER BY sort_order ASC, id ASC`,
		serviceID,
	)
	if err != nil {
		return extras
	}
	defer rows.Close()
	var fromList []string
	for rows.Next() {
		var u string
		if err := rows.Scan(&u); err != nil {
			continue
		}
		if isSafeImageURL(u) && !isVideoURL(u) {
			fromList = append(fromList, u)
		}
	}
	if len(fromList) > 0 {
		extras.Flyers = fromList
	} else {
		var filtered []string
		for _, u := range extras.Flyers {
			if !isVideoURL(u) {
				filtered = append(filtered, u)
			}
		}
		extras.Flyers = filtered
	}
	return extras
}

func LoadTransition(db *sql.DB) string {
	var v string
	err := db.QueryRow(`SELECT value FROM settings WHERE key = 'slide_transition'`).Scan(&v)
	if err != nil {
		return "fade"
	}
	switch v {
	case "none", "cut", "fade", "dissolve", "push":
		return v
	default:
		return "fade"
	}
}
