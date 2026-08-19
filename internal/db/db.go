package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "embed"
	_ "modernc.org/sqlite"
)

//go:embed schema.sql
var schemaSQL string

func Open(dbPath string) (*sql.DB, error) {
	if dbPath == "" {
		wd, err := os.Getwd()
		if err != nil {
			return nil, err
		}
		dbPath = filepath.Join(wd, "data.db")
	}
	dir := filepath.Dir(dbPath)
	if dir != "." && dir != "" {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return nil, err
		}
	}
	handle, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, err
	}
	handle.SetMaxOpenConns(1)
	if _, err := handle.Exec(`PRAGMA journal_mode = WAL`); err != nil {
		handle.Close()
		return nil, fmt.Errorf("journal_mode: %w", err)
	}
	if _, err := handle.Exec(`PRAGMA busy_timeout = 5000`); err != nil {
		handle.Close()
		return nil, err
	}
	if _, err := handle.Exec(`PRAGMA foreign_keys = ON`); err != nil {
		handle.Close()
		return nil, err
	}
	if _, err := handle.Exec(schemaSQL); err != nil {
		handle.Close()
		return nil, fmt.Errorf("schema: %w", err)
	}
	return handle, nil
}
