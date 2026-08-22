package db

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
)

// Song-book row migration (AD-17 / AD-21 / data_version 10 -> 11).
// One-time pass that:
//   - inserts the SDAH song_books registry row from data/song-book/sdah.json when absent,
//   - sets is_default = 1 only if no existing song_books row is already marked default,
//   - leaves an existing SDAH row completely untouched (no overwrite, no resurrection),
//   - bumps data_version to 11.
//
// Hand-mirrored port: internal/db/migrate_song_book_row.go <-> src/lib/db/index.ts (migrateSongBookRow).
// Runs once inside a single SQLite transaction, gated by settings.data_version.
func migrateSongBookRow(db *sql.DB, root string) error {
	ver, err := readDataVersion(db)
	if err != nil {
		return err
	}
	if dataVersionAtLeast(ver, 11) {
		return nil
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	path := filepath.Join(root, "data", "song-book", strings.ToLower(DefaultSongBook)+".json")
	raw, err := os.ReadFile(path)
	if err == nil {
		var file struct {
			Book struct {
				Code        string `json:"code"`
				Name        string `json:"name"`
				Language    string `json:"language"`
				Attribution string `json:"attribution"`
				Licence     string `json:"licence"`
			} `json:"book"`
		}
		if err := json.Unmarshal(raw, &file); err != nil {
			return fmt.Errorf("song book corpus metadata in migration 10->11: %w", err)
		}

		code := strings.ToUpper(strings.TrimSpace(file.Book.Code))
		if code == "" {
			code = DefaultSongBook
		}
		name := strings.TrimSpace(file.Book.Name)
		locale := strings.TrimSpace(file.Book.Language)
		licence := strings.TrimSpace(file.Book.Licence)
		provenance := strings.TrimSpace(file.Book.Attribution)

		var defaultCount int
		if err := tx.QueryRow(`SELECT COUNT(*) FROM song_books WHERE is_default = 1`).Scan(&defaultCount); err != nil {
			return err
		}
		isDefault := 0
		if defaultCount == 0 {
			isDefault = 1
		}

		now := nowUTCString()
		res, err := tx.Exec(`
			INSERT INTO song_books (book_code, name, locale, licence, provenance, is_default, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(book_code) DO NOTHING`,
			code, name, locale, licence, provenance, isDefault, now,
		)
		if err != nil {
			return err
		}
		rowsAffected, err := res.RowsAffected()
		if err != nil {
			return err
		}
		if rowsAffected > 0 {
			log.Printf("[corpus] migration 10->11: seeded song book %s (is_default=%d)", code, isDefault)
		}
	} else if !os.IsNotExist(err) {
		return err
	}

	if _, err := tx.Exec(
		`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
		dataVersionKey, "11",
	); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}
	log.Printf("[registry] migration 10->11: song_books row migration complete (data_version=11)")
	return nil
}
