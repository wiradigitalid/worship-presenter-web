package db

import (
	"database/sql"
	"log"
	"strings"
)

// Announcement-items cascade retirement migration (data_version 9 -> 10).
// One-time pass that:
//   - removes foreign key constraint from announcement_items(service_id),
//   - preserves every existing row intact (id, image_url, service_id, sort_order, created_at, updated_at),
//   - bumps data_version to 10.
//
// Note on foreign key: In SQLite with PRAGMA foreign_keys = ON, keeping
// FOREIGN KEY (service_id) REFERENCES services(id) without ON DELETE CASCADE
// defaults to RESTRICT / NO ACTION, which forbids deleting a services row if
// any announcement_items row references it. Since announcement_items must survive
// Service deletion while retaining service_id, the FK constraint itself is dropped.
//
// Runs once inside a single SQLite transaction, gated by settings.data_version.
func migrateAnnouncementItemsCascade(db *sql.DB) error {
	ver, err := readDataVersion(db)
	if err != nil {
		return err
	}
	if dataVersionAtLeast(ver, 10) {
		return nil
	}

	// Check if the foreign key is already gone.
	// PRAGMA foreign_key_list(announcement_items) returns:
	// id, seq, table, from, to, on_update, on_delete, match
	rows, err := db.Query(`PRAGMA foreign_key_list(announcement_items)`)
	if err != nil {
		return err
	}
	hasFK := false
	for rows.Next() {
		var id, seq int
		var table, from, to, onUpdate, onDelete, match string
		if err := rows.Scan(&id, &seq, &table, &from, &to, &onUpdate, &onDelete, &match); err != nil {
			rows.Close()
			return err
		}
		if strings.EqualFold(from, "service_id") {
			hasFK = true
		}
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return err
	}
	rows.Close()

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if hasFK {
		// SQLite cannot drop or alter a foreign key constraint in place;
		// table must be rebuilt while preserving all rows and column values.
		if _, err := tx.Exec(`
			CREATE TABLE announcement_items_new (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				image_url TEXT NOT NULL,
				service_id INTEGER,
				sort_order INTEGER NOT NULL DEFAULT 0,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT
			);
			INSERT INTO announcement_items_new (id, image_url, service_id, sort_order, created_at, updated_at)
				SELECT id, image_url, service_id, sort_order, created_at, updated_at FROM announcement_items;
			DROP TABLE announcement_items;
			ALTER TABLE announcement_items_new RENAME TO announcement_items;
		`); err != nil {
			return err
		}
	}

	if _, err := tx.Exec(
		`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
		dataVersionKey, "10",
	); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}
	log.Printf("[registry] migration 9->10: retired foreign key cascade on announcement_items (data_version=10)")
	return nil
}

