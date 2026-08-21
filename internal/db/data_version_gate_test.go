package db

import (
	"path/filepath"
	"testing"
)

func TestDataVersionGateWalkingPastSingleDigit(t *testing.T) {
	t.Setenv("WPW_USE_SHIPPED_REGISTRY", "1")

	// 1. A database stamped "10" must NOT re-run the 8->9 pass and must still read "10" afterwards
	t.Run("version 10 is not downgraded by 8->9 migration", func(t *testing.T) {
		dbPath := filepath.Join(t.TempDir(), "v10.db")
		handle, err := Open(dbPath)
		if err != nil {
			t.Fatalf("open: %v", err)
		}
		defer handle.Close()

		_, err = handle.Exec(`
			CREATE TABLE IF NOT EXISTS settings (
				key TEXT PRIMARY KEY,
				value TEXT NOT NULL
			);
			CREATE TABLE IF NOT EXISTS song_books (
				book_code TEXT PRIMARY KEY,
				name TEXT,
				locale TEXT,
				licence TEXT,
				provenance TEXT,
				is_default INTEGER NOT NULL DEFAULT 0,
				updated_at TEXT
			);
			INSERT INTO settings (key, value) VALUES ('data_version', '10');
		`)
		if err != nil {
			t.Fatalf("setup v10 db: %v", err)
		}

		root := "../../"
		if err := migrateSongBookMetadata(handle, root); err != nil {
			t.Fatalf("migrateSongBookMetadata: %v", err)
		}

		var ver string
		if err := handle.QueryRow(`SELECT value FROM settings WHERE key = ?`, dataVersionKey).Scan(&ver); err != nil {
			t.Fatalf("read version: %v", err)
		}
		if ver != "10" {
			t.Fatalf("data_version after migration = %q, want '10' (got downgraded)", ver)
		}
	})

	// 2. A database stamped "9" must not re-run it either
	t.Run("version 9 is not re-run", func(t *testing.T) {
		dbPath := filepath.Join(t.TempDir(), "v9.db")
		handle, err := Open(dbPath)
		if err != nil {
			t.Fatalf("open: %v", err)
		}
		defer handle.Close()

		_, err = handle.Exec(`
			CREATE TABLE IF NOT EXISTS settings (
				key TEXT PRIMARY KEY,
				value TEXT NOT NULL
			);
			CREATE TABLE IF NOT EXISTS song_books (
				book_code TEXT PRIMARY KEY,
				name TEXT,
				locale TEXT,
				licence TEXT,
				provenance TEXT,
				is_default INTEGER NOT NULL DEFAULT 0,
				updated_at TEXT
			);
			INSERT INTO settings (key, value) VALUES ('data_version', '9');
			INSERT INTO song_books (book_code, name, locale, is_default, updated_at) VALUES ('SDAH', 'SDAH', 'original_locale', 1, '2026-08-20T00:00:00Z');
		`)
		if err != nil {
			t.Fatalf("setup v9 db: %v", err)
		}

		root := "../../"
		if err := migrateSongBookMetadata(handle, root); err != nil {
			t.Fatalf("migrateSongBookMetadata: %v", err)
		}

		var ver string
		if err := handle.QueryRow(`SELECT value FROM settings WHERE key = ?`, dataVersionKey).Scan(&ver); err != nil {
			t.Fatalf("read version: %v", err)
		}
		if ver != "9" {
			t.Fatalf("data_version = %q, want 9", ver)
		}
	})

	// 3. A database stamped "8" must run it and bump to 9
	t.Run("version 8 runs migration and bumps to 9", func(t *testing.T) {
		dbPath := filepath.Join(t.TempDir(), "v8.db")
		handle, err := Open(dbPath)
		if err != nil {
			t.Fatalf("open: %v", err)
		}
		defer handle.Close()

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
			INSERT INTO song_books (book_code, name, is_default, updated_at) VALUES ('SDAH', 'SDAH', 1, '2026-08-20T00:00:00Z');
		`)
		if err != nil {
			t.Fatalf("setup v8 db: %v", err)
		}

		root := "../../"
		if err := migrateSongBookMetadata(handle, root); err != nil {
			t.Fatalf("migrateSongBookMetadata: %v", err)
		}

		var ver string
		if err := handle.QueryRow(`SELECT value FROM settings WHERE key = ?`, dataVersionKey).Scan(&ver); err != nil {
			t.Fatalf("read version: %v", err)
		}
		if ver != "9" {
			t.Fatalf("data_version = %q, want 9", ver)
		}
	})

	// 4. An empty or junk marker must run the ladder, not skip it
	t.Run("empty or junk marker runs the migration", func(t *testing.T) {
		for _, junkVal := range []string{"", "junk", "invalid-0", "-5"} {
			dbPath := filepath.Join(t.TempDir(), "junk.db")
			handle, err := Open(dbPath)
			if err != nil {
				t.Fatalf("open: %v", err)
			}

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
				INSERT INTO settings (key, value) VALUES ('data_version', ?);
				INSERT INTO song_books (book_code, name, is_default, updated_at) VALUES ('SDAH', 'SDAH', 1, '2026-08-20T00:00:00Z');
			`, junkVal)
			if err != nil {
				handle.Close()
				t.Fatalf("setup junk db (%q): %v", junkVal, err)
			}

			root := "../../"
			if err := migrateSongBookMetadata(handle, root); err != nil {
				handle.Close()
				t.Fatalf("migrateSongBookMetadata on junk (%q): %v", junkVal, err)
			}

			var ver string
			if err := handle.QueryRow(`SELECT value FROM settings WHERE key = ?`, dataVersionKey).Scan(&ver); err != nil {
				handle.Close()
				t.Fatalf("read version for junk (%q): %v", junkVal, err)
			}
			if ver != "9" {
				handle.Close()
				t.Fatalf("for junk value %q: data_version = %q, want 9", junkVal, ver)
			}
			handle.Close()
		}
	})
}
