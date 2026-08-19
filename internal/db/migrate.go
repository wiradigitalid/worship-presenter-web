package db

import "database/sql"

// migrateColumns applies additive schema that CREATE TABLE IF NOT EXISTS cannot
// reach on an existing file (AD-9).
func migrateColumns(handle *sql.DB) error {
	return ensureAnnouncementUpdatedAt(handle)
}

func ensureAnnouncementUpdatedAt(handle *sql.DB) error {
	rows, err := handle.Query(`PRAGMA table_info(announcement_items)`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var cid, notnull, pk int
		var name, ctype string
		var dflt sql.NullString
		if err := rows.Scan(&cid, &name, &ctype, &notnull, &dflt, &pk); err != nil {
			return err
		}
		if name == "updated_at" {
			return rows.Err()
		}
	}
	if err := rows.Err(); err != nil {
		return err
	}
	if _, err := handle.Exec(`ALTER TABLE announcement_items ADD COLUMN updated_at TEXT`); err != nil {
		return err
	}
	_, err = handle.Exec(
		`UPDATE announcement_items
		    SET updated_at = COALESCE(created_at, ` + StampNowSQL + `)
		  WHERE updated_at IS NULL OR updated_at = ''`,
	)
	return err
}
