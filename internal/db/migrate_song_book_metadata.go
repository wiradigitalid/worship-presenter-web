package db

import (
	"database/sql"
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"strings"
)

// Song-book metadata migration (AD-26 / data_version 8 -> 9). One-time pass that:
//   - adds locale, licence, provenance columns to song_books if missing,
//   - backfills existing rows with a non-NULL locale (sourced from corpus file if reachable,
//     falling back to shipped default "en" for SDAH),
//   - bumps data_version to 9.
//
// Runs once inside a single SQLite transaction, gated by settings.data_version.
func migrateSongBookMetadata(db *sql.DB, root string) error {
	ver, err := readDataVersion(db)
	if err != nil {
		return err
	}
	if dataVersionAtLeast(ver, 9) {
		return nil
	}

	// 1. Check and add missing columns idempotently.
	// SQLite ALTER TABLE ADD COLUMN does not support IF NOT EXISTS,
	// so check PRAGMA table_info first.
	rows, err := db.Query(`PRAGMA table_info(song_books)`)
	if err != nil {
		return err
	}
	have := map[string]struct{}{}
	for rows.Next() {
		var cid, notnull, pk int
		var name, ctype string
		var dflt sql.NullString
		if err := rows.Scan(&cid, &name, &ctype, &notnull, &dflt, &pk); err != nil {
			rows.Close()
			return err
		}
		have[name] = struct{}{}
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return err
	}
	rows.Close()

	if _, ok := have["locale"]; !ok {
		if _, err := db.Exec(`ALTER TABLE song_books ADD COLUMN locale TEXT`); err != nil {
			return err
		}
	}
	if _, ok := have["licence"]; !ok {
		if _, err := db.Exec(`ALTER TABLE song_books ADD COLUMN licence TEXT`); err != nil {
			return err
		}
	}
	if _, ok := have["provenance"]; !ok {
		if _, err := db.Exec(`ALTER TABLE song_books ADD COLUMN provenance TEXT`); err != nil {
			return err
		}
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 2. Backfill existing rows where locale IS NULL or empty.
	bookRows, err := tx.Query(`SELECT book_code FROM song_books WHERE locale IS NULL OR locale = ''`)
	if err != nil {
		return err
	}
	var codes []string
	for bookRows.Next() {
		var c string
		if err := bookRows.Scan(&c); err != nil {
			bookRows.Close()
			return err
		}
		codes = append(codes, c)
	}
	if err := bookRows.Err(); err != nil {
		bookRows.Close()
		return err
	}
	bookRows.Close()

	for _, code := range codes {
		locale := resolveCorpusLocale(root, code)
		if _, err := tx.Exec(`UPDATE song_books SET locale = ? WHERE book_code = ?`, locale, code); err != nil {
			return err
		}
	}

	if _, err := tx.Exec(
		`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
		dataVersionKey, "9",
	); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}
	log.Printf("[registry] migration 8->9: migrated song_books metadata columns and backfilled %d row(s)", len(codes))
	return nil
}

func resolveCorpusLocale(root, bookCode string) string {
	if root != "" {
		path := filepath.Join(root, "data", "song-book", strings.ToLower(bookCode)+".json")
		if raw, err := os.ReadFile(path); err == nil {
			var file struct {
				Book struct {
					Locale   string `json:"locale"`
					Language string `json:"language"`
				} `json:"book"`
			}
			if err := json.Unmarshal(raw, &file); err == nil {
				loc := strings.TrimSpace(file.Book.Locale)
				if loc == "" {
					loc = strings.TrimSpace(file.Book.Language)
				}
				if loc != "" {
					return loc
				}
			}
		}
	}
	// Fallback to shipped default for SDAH or generic "en" if corpus file is unreachable
	return "en"
}
