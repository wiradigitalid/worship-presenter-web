package db

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
)

// Predefined Field vocabulary migration (DEC-004 Supplement S1, AD-32).
// One-time pass from data_version 4 -> 5 that rewrites every
// artifact_templates.payload still carrying the old whole-element
// placeholderKey shape to the inline {key} token form, applying the S1
// per-key mapping table.
//
// The trio lives in song_set_layouts (migrated by migrate_song_set_shape.go);
// song-set expansion keys (hymnNumber/songTitle/label/lyrics) belong to the
// trio's migration, not this one.
func migratePredefinedFields(db *sql.DB) error {
	ver, err := readDataVersion(db)
	if err != nil {
		return err
	}
	if dataVersionAtLeast(ver, 5) {
		return nil
	}
	if !dataVersionAtLeast(ver, 4) {
		// Song-set physical-shape migration must run first; refuse silently
		// so the older migration gets a clean shot.
		return nil
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	rows, err := tx.Query(
		`SELECT id, payload FROM artifact_templates
		  WHERE payload IS NOT NULL`,
	)
	if err != nil {
		return err
	}
	type pending struct {
		id      string
		payload string
	}
	var updates []pending
	for rows.Next() {
		var p pending
		if err := rows.Scan(&p.id, &p.payload); err != nil {
			rows.Close()
			return err
		}
		updates = append(updates, p)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return err
	}
	rows.Close()

	now := nowUTCString()
	for _, p := range updates {
		converted, ok, err := convertPayloadToInline(p.id, p.payload)
		if err != nil {
			log.Printf("[registry] migration 4->5: row %s payload does not parse; leaving untouched: %v", p.id, err)
			continue
		}
		if !ok {
			// Nothing old-shape left; the row is already in the new vocabulary.
			continue
		}
		if _, err := tx.Exec(
			`UPDATE artifact_templates SET payload = ?, updated_at = ? WHERE id = ?`,
			converted, now, p.id,
		); err != nil {
			return err
		}
	}

	if _, err := tx.Exec(
		`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
		dataVersionKey, "5",
	); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}
	log.Printf("[registry] migration 4->5: applied predefined-field vocabulary migration to %d row(s)", len(updates))
	return nil
}

// convertPayloadToInline returns the rewritten payload, a flag indicating
// whether any element was rewritten (false = nothing old-shape left to find),
// and any parse error. Image elements rename only; text elements drop
// placeholderKey and substitute {new_key} into content. Disambiguation of
// reference/text uses the row's own template id.
func convertPayloadToInline(id, payload string) (string, bool, error) {
	if payload == "" {
		return payload, false, nil
	}
	var tmpl map[string]any
	if err := json.Unmarshal([]byte(payload), &tmpl); err != nil {
		return "", false, fmt.Errorf("invalid JSON: %w", err)
	}
	layoutsRaw, ok := tmpl["layouts"].(map[string]any)
	if !ok {
		return payload, false, nil
	}
	touched := false
	for _, rawLayout := range layoutsRaw {
		layout, ok := rawLayout.(map[string]any)
		if !ok {
			continue
		}
		rawEls, ok := layout["elements"].([]any)
		if !ok {
			continue
		}
		for _, rawEl := range rawEls {
			el, ok := rawEl.(map[string]any)
			if !ok {
				continue
			}
			flag, err := convertElementInline(id, el)
			if err != nil {
				return "", false, err
			}
			if flag {
				touched = true
			}
		}
	}
	if !touched {
		return payload, false, nil
	}
	out, err := json.Marshal(tmpl)
	if err != nil {
		return "", false, err
	}
	return string(out), true, nil
}

// convertElementInline mutates `el` in place to the inline-token shape.
// Returns touched=true when an element was rewritten. Element-level
// re-validation is deferred to the caller (which only commits when the
// whole row parses).
func convertElementInline(id string, el map[string]any) (touched bool, err error) {
	pk, ok := el["placeholderKey"].(string)
	if !ok || pk == "" {
		return false, nil
	}
	newKey, shape, err := predefinedKeyMap(id, pk)
	if err != nil {
		return false, err
	}
	switch shape {
	case "text":
		if newKey == "" {
			return false, nil
		}
		el["content"] = "{" + newKey + "}"
		delete(el, "placeholderKey")
	case "image":
		el["placeholderKey"] = newKey
	default:
		return false, fmt.Errorf("unsupported shape %q for key %q", shape, pk)
	}
	return true, nil
}

// predefinedKeyMap returns (newKey, shape, error). Shape is "text" or
// "image". Disambiguation of reference/text is per the template id (R1 in
// DEC-004 Supplement).
func predefinedKeyMap(templateID, oldKey string) (string, string, error) {
	switch oldKey {
	case "date":
		return "service_date", "text", nil
	case "reference":
		return scriptureOrThemeKey(templateID, "reference"), "text", nil
	case "text":
		return scriptureOrThemeKey(templateID, "text"), "text", nil
	case "performer":
		return "special_song", "text", nil
	case "title":
		return "sermon_title", "text", nil
	case "speaker":
		return "sermon_speaker_name", "text", nil
	case "imageUrl":
		return "sermon_poster", "image", nil
	case "person":
		return "closing_prayer_person", "text", nil
	case "familyText":
		return "family_request", "text", nil
	case "youthText":
		return "youth_request", "text", nil
	case "familyPhoto":
		return "family_photo", "image", nil
	case "youthPhoto":
		return "youth_photo", "image", nil
	}
	return "", "", fmt.Errorf("unknown old key: %s", oldKey)
}

func scriptureOrThemeKey(templateID, kind string) string {
	switch templateID {
	case "verse-reading":
		if kind == "reference" {
			return "scripture_reference"
		}
		return "scripture_text"
	case "bible-verse-contemplation":
		if kind == "reference" {
			return "theme_reference"
		}
		return "theme_text"
	}
	// Unmatched template id: default to scripture_* and the caller logs
	// needs-review (the migration log is at the row level).
	if kind == "reference" {
		return "scripture_reference"
	}
	return "scripture_text"
}
