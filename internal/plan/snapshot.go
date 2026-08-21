package plan

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"strings"
)

// AcceptLivePayload reports whether a live registry row may be cloned into a
// service snapshot. Corrupt JSON is omitted and logged (OQ-32), matching the
// TypeScript cloneValidLiveRows contract.
func AcceptLivePayload(id, payload string) bool {
	var tmpl Template
	if err := json.Unmarshal([]byte(payload), &tmpl); err != nil {
		log.Printf("[registry] template %q: persisted row rejected (not valid JSON); no layout is available: %v", id, err)
		return false
	}
	if tmpl.ID != id {
		log.Printf("[registry] template %q: persisted row rejected (payload id mismatch); no layout is available", id)
		return false
	}
	if tmpl.Layouts == nil {
		log.Printf("[registry] template %q: persisted row rejected (no layouts); no layout is available", id)
		return false
	}
	return true
}

// loadTemplates builds a snapshot from open Rows. trio must be loaded before
// opening rows — never query the DB from here (MaxOpenConns(1) deadlock).
func loadTemplates(rows *sql.Rows, useTemplateID bool, trio *songSetLayoutTrio) Snapshot {
	snap := Snapshot{ByID: map[string]Template{}, SongInputs: map[string]HymnItem{}}
	for rows.Next() {
		var id, label, baseType, updatedAt string
		var varName sql.NullString
		var payloadNull sql.NullString
		if useTemplateID {
			if err := rows.Scan(&id, &label, &baseType, &payloadNull, &updatedAt); err != nil {
				log.Printf("[registry] scan failed: %v", err)
				continue
			}
		} else {
			if err := rows.Scan(&id, &label, &baseType, &payloadNull, &updatedAt, &varName); err != nil {
				log.Printf("[registry] scan failed: %v", err)
				continue
			}
		}
		if baseType == "song-set-entry" && trio != nil {
			tmpl := composeSongSetEntryTemplate(id, label, trio)
			if varName.Valid && varName.String != "" {
				s := varName.String
				tmpl.VariableName = &s
			}
			snap.Order = append(snap.Order, id)
			snap.ByID[id] = tmpl
			continue
		}
		if !payloadNull.Valid || payloadNull.String == "" {
			continue
		}
		payload := payloadNull.String
		if !AcceptLivePayload(id, payload) {
			continue
		}
		var tmpl Template
		_ = json.Unmarshal([]byte(payload), &tmpl)
		if varName.Valid && varName.String != "" {
			s := varName.String
			tmpl.VariableName = &s
		}
		snap.Order = append(snap.Order, id)
		snap.ByID[id] = tmpl
	}
	return snap
}

// loadSongSetLayoutTrioFor prefers the Service's frozen AD-33 trio over the
// live one: once a Service has been cloned (or Sync Artifact has run), its
// song-set-entry payloads must keep rendering against the canvases they were
// frozen with, even after an admin edits the live trio. Services without a
// freeze — and the live preview, serviceID 0 — read the live trio.
func loadSongSetLayoutTrioFor(db *sql.DB, serviceID int) (*songSetLayoutTrio, error) {
	if serviceID > 0 {
		var n int
		err := db.QueryRow(
			`SELECT COUNT(*) FROM service_song_set_layouts WHERE service_id = ?`,
			serviceID,
		).Scan(&n)
		if err == nil && n > 0 {
			return loadSongSetLayoutTrioQuery(
				db,
				`SELECT role, payload FROM service_song_set_layouts WHERE service_id = ?`,
				serviceID,
			)
		}
	}
	return loadSongSetLayoutTrio(db)
}

func LoadSnapshot(db *sql.DB, serviceID int) (Snapshot, error) {
	trio, _ := loadSongSetLayoutTrioFor(db, serviceID)
	var snap Snapshot
	var n int
	if err := db.QueryRow(
		`SELECT COUNT(*) FROM service_registry_snapshots WHERE service_id = ?`,
		serviceID,
	).Scan(&n); err != nil {
		return Snapshot{}, err
	}
	if n > 0 {
		rows, err := db.Query(
			`SELECT template_id, label, base_type, payload, updated_at
			   FROM service_registry_snapshots
			  WHERE service_id = ?
			  ORDER BY position`,
			serviceID,
		)
		if err != nil {
			return Snapshot{}, err
		}
		defer rows.Close()
		snap = loadTemplates(rows, true, trio)
	} else {
		rows, err := db.Query(
			`SELECT id, label, base_type, payload, updated_at, variable_name FROM artifact_templates ORDER BY position`,
		)
		if err != nil {
			return Snapshot{}, err
		}
		defer rows.Close()
		snap = loadTemplates(rows, false, trio)
	}

	if serviceID > 0 && db != nil {
		loadSongSetInputsIntoSnapshot(db, serviceID, &snap)
	}

	return snap, nil
}

func loadSongSetInputsIntoSnapshot(db *sql.DB, serviceID int, snap *Snapshot) {
	if snap.SongInputs == nil {
		snap.SongInputs = map[string]HymnItem{}
	}
	rows, err := db.Query(
		`SELECT ssi.variable_name, ssi.song_number, COALESCE(ssi.song_book_code, ''),
		        COALESCE(h.title, ''), COALESCE(ssi.lyric_override, h.lyrics, '')
		   FROM song_set_inputs ssi
		   LEFT JOIN hymns h ON h.number = ssi.song_number
		  WHERE ssi.service_id = ? AND ssi.song_number IS NOT NULL AND ssi.song_number > 0`,
		serviceID,
	)
	if err != nil {
		return
	}
	defer rows.Close()
	for rows.Next() {
		var vn, book, title, lyrics string
		var num int
		if err := rows.Scan(&vn, &num, &book, &title, &lyrics); err != nil {
			continue
		}
		if title == "" {
			title = fmt.Sprintf("SDAH %d", num)
		}
		snap.SongInputs[vn] = HymnItem{
			Number:     num,
			Title:      title,
			Lyrics:     lyrics,
			Incomplete: strings.TrimSpace(lyrics) == "",
		}
	}
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
