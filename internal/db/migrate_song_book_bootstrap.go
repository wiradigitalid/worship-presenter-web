package db

import (
	"database/sql"
	"log"
)

// Song-book bootstrap-once migration (DEC-005 / AD-36). One-time pass from
// data_version 5 -> 6 that:
//   - stamps a per-book bootstrap marker (`song_book_bootstrapped_<code>`)
//     for every book_code already present in `hymns`, so an existing install
//     is never re-bootstrapped and its gaps are never refilled from the
//     corpus file (AD-17 extended to hymns),
//   - bumps data_version to 6 — the release that ships the save-to-book
//     route alongside this write-discipline change (AD-18/AD-21).
//
// A fresh database holds no hymn rows, so no marker is stamped here; the
// boot's upsertHymns then seeds the book from zero and stamps the marker
// itself. Runs once, inside a single SQLite transaction, gated by
// settings.data_version.
func migrateSongBookBootstrap(db *sql.DB) error {
	ver, err := readDataVersion(db)
	if err != nil {
		return err
	}
	if dataVersionAtLeast(ver, 6) {
		return nil
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	rows, err := tx.Query(`SELECT DISTINCT book_code FROM hymns ORDER BY book_code`)
	if err != nil {
		return err
	}
	var codes []string
	for rows.Next() {
		var code string
		if err := rows.Scan(&code); err != nil {
			rows.Close()
			return err
		}
		codes = append(codes, code)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return err
	}
	rows.Close()

	for _, code := range codes {
		if _, err := tx.Exec(
			`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
			songBookBootstrapKey(code), "1",
		); err != nil {
			return err
		}
	}
	if _, err := tx.Exec(
		`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
		dataVersionKey, "6",
	); err != nil {
		return err
	}
	if err := tx.Commit(); err != nil {
		return err
	}
	log.Printf("[corpus] migration 5->6: stamped %d song-book bootstrap marker(s) (DEC-005/AD-36)", len(codes))
	return nil
}
