package db

import (
	"database/sql"
	"encoding/json"
	"log"
	"regexp"
)

// Song Set weekly-input backfill (DEC-004 S2 / FR-32). One-time pass from
// data_version 6 -> 7 that seeds song_set_inputs for the four default entries
// from each Service's stored parsed_data hymn buckets:
//
//	bt[0] -> opening_song_bt   bt[1] -> closing_song_bt
//	ds[0] -> opening_song_dw   ds[1] -> closing_song_dw
//
// A bucket slot only lands when its variable_name exists as a live
// song-set-entry row (AD-17 fail-closed); anything else is a silent no-op, so
// a Registry an administrator already reshaped keeps whatever inputs it has.
// The pass runs once per database, gated by settings.data_version.
func migrateSongSetInputs(db *sql.DB) error {
	ver, err := readDataVersion(db)
	if err != nil {
		return err
	}
	if ver >= "7" {
		return nil
	}

	type serviceParsed struct {
		id     int
		parsed string
	}
	rows, err := db.Query(
		`SELECT id, parsed_data FROM services
		  WHERE parsed_data IS NOT NULL AND parsed_data != ''
		  ORDER BY id`,
	)
	if err != nil {
		return err
	}
	var services []serviceParsed
	for rows.Next() {
		var s serviceParsed
		if err := rows.Scan(&s.id, &s.parsed); err != nil {
			rows.Close()
			return err
		}
		services = append(services, s)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return err
	}
	rows.Close()

	live := map[string]bool{}
	entryRows, err := db.Query(
		`SELECT variable_name FROM artifact_templates
		  WHERE base_type = 'song-set-entry' AND variable_name IS NOT NULL`,
	)
	if err != nil {
		return err
	}
	for entryRows.Next() {
		var vn string
		if err := entryRows.Scan(&vn); err != nil {
			entryRows.Close()
			return err
		}
		live[vn] = true
	}
	if err := entryRows.Err(); err != nil {
		entryRows.Close()
		return err
	}
	entryRows.Close()

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	const upsert = `INSERT OR REPLACE INTO song_set_inputs
	  (service_id, variable_name, song_number, song_book_code, background_id, lyric_override, updated_at)
	VALUES (?, ?, ?, '', NULL, NULL, ?)`
	now := nowUTCString()
	migrated := 0
	for _, svc := range services {
		bt, ds := bucketsFromParsedData(svc.parsed)
		pairs := []struct {
			idx int
			vn  string
			num []int
		}{
			{0, "opening_song_bt", bt},
			{1, "closing_song_bt", bt},
			{0, "opening_song_dw", ds},
			{1, "closing_song_dw", ds},
		}
		for _, p := range pairs {
			if p.idx >= len(p.num) || !live[p.vn] {
				continue
			}
			if _, err := tx.Exec(upsert, svc.id, p.vn, p.num[p.idx], now); err != nil {
				return err
			}
			migrated++
		}
	}

	if _, err := tx.Exec(
		`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
		dataVersionKey, "7",
	); err != nil {
		return err
	}
	if err := tx.Commit(); err != nil {
		return err
	}
	log.Printf("[registry] migration 6->7: backfilled %d song_set_inputs row(s)", migrated)
	return nil
}

var (
	btSectionRE = regexp.MustCompile(`(?i)^BIBLE\s+TALK\b`)
	dsSectionRE = regexp.MustCompile(`(?i)^DIVINE\s+SERVICE\b`)
)

type parsedItemJSON struct {
	Type   string `json:"type"`
	Title  string `json:"title"`
	Number int    `json:"number"`
}

type parsedRundownJSON struct {
	Items []parsedItemJSON `json:"items"`
}

// bucketsFromParsedData mirrors the planner's hymn bucketing (section-scoped,
// with the position split-at-two fallback when neither section header is
// present) but extracts numbers only — titles/lyrics stay in parsed_data.
func bucketsFromParsedData(raw string) (bt, ds []int) {
	var pr parsedRundownJSON
	if err := json.Unmarshal([]byte(raw), &pr); err != nil {
		return nil, nil
	}
	hasBT, hasDS := false, false
	var all []int
	for _, it := range pr.Items {
		switch it.Type {
		case "hymn":
			if it.Number > 0 {
				all = append(all, it.Number)
			}
		case "section":
			if btSectionRE.MatchString(it.Title) {
				hasBT = true
			}
			if dsSectionRE.MatchString(it.Title) {
				hasDS = true
			}
		}
	}
	if !hasBT && !hasDS {
		if len(all) > 2 {
			return all[:2], all[2:]
		}
		return all, nil
	}
	section := ""
	for _, it := range pr.Items {
		switch it.Type {
		case "section":
			switch {
			case btSectionRE.MatchString(it.Title):
				section = "bt"
			case dsSectionRE.MatchString(it.Title):
				section = "ds"
			default:
				section = ""
			}
		case "hymn":
			if it.Number <= 0 {
				continue
			}
			switch section {
			case "bt":
				bt = append(bt, it.Number)
			case "ds":
				ds = append(ds, it.Number)
			}
		}
	}
	return bt, ds
}
