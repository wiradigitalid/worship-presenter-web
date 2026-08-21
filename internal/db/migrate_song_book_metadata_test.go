package db

import (
	"database/sql"
	"path/filepath"
	"testing"
)

func TestMigrateSongBookMetadata(t *testing.T) {
	t.Setenv("WPW_USE_SHIPPED_REGISTRY", "1")
	dbPath := filepath.Join(t.TempDir(), "v8.db")
	handle, err := Open(dbPath)
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer handle.Close()

	// 1. Create a schema at v8 shape (song_books without locale, licence, provenance)
	// We run raw DDL mimicking v8
	_, err = handle.Exec(`
		CREATE TABLE IF NOT EXISTS settings (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);
		CREATE TABLE IF NOT EXISTS song_books (
			book_code TEXT PRIMARY KEY,
			name TEXT,
			is_default INTEGER NOT NULL DEFAULT 0,
			updated_at TEXT
		);
		INSERT INTO settings (key, value) VALUES ('data_version', '8');
		INSERT INTO song_books (book_code, name, is_default, updated_at) VALUES ('SDAH', 'The Seventh-day Adventist Hymnal', 1, '2026-08-20T00:00:00Z');
		INSERT INTO song_books (book_code, name, is_default, updated_at) VALUES ('CUSTOM', 'Custom Book', 0, '2026-08-20T00:00:00Z');
	`)
	if err != nil {
		t.Fatalf("setup v8 db: %v", err)
	}

	// 2. Run migration
	root := "../../"
	if err := migrateSongBookMetadata(handle, root); err != nil {
		t.Fatalf("migrateSongBookMetadata: %v", err)
	}

	// 3. Assert columns exist and version is 9
	var ver string
	if err := handle.QueryRow(`SELECT value FROM settings WHERE key = ?`, dataVersionKey).Scan(&ver); err != nil {
		t.Fatalf("read version: %v", err)
	}
	if ver != "9" {
		t.Fatalf("data_version = %q, want 9", ver)
	}

	// 4. Assert SDAH locale backfilled from corpus (or fallback "en") and CUSTOM has non-NULL locale
	var sdahLocale, customLocale sql.NullString
	if err := handle.QueryRow(`SELECT locale FROM song_books WHERE book_code = 'SDAH'`).Scan(&sdahLocale); err != nil {
		t.Fatalf("read SDAH locale: %v", err)
	}
	if !sdahLocale.Valid || sdahLocale.String == "" {
		t.Fatalf("SDAH locale is invalid or empty: %v", sdahLocale)
	}
	if sdahLocale.String != "en" {
		t.Fatalf("SDAH locale = %q, want en", sdahLocale.String)
	}

	if err := handle.QueryRow(`SELECT locale FROM song_books WHERE book_code = 'CUSTOM'`).Scan(&customLocale); err != nil {
		t.Fatalf("read CUSTOM locale: %v", err)
	}
	if !customLocale.Valid || customLocale.String == "" {
		t.Fatalf("CUSTOM locale is invalid or empty: %v", customLocale)
	}

	// 5. Assert idempotency: second run is a no-op
	if err := migrateSongBookMetadata(handle, root); err != nil {
		t.Fatalf("second run migrateSongBookMetadata: %v", err)
	}
}
