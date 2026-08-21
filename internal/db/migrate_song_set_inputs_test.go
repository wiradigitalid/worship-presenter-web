package db

import (
	"database/sql"
	"path/filepath"
	"strconv"
	"testing"
)

func openMigratedTestDB(t *testing.T) *sql.DB {
	t.Helper()
	t.Setenv("WPW_USE_SHIPPED_REGISTRY", "1")
	handle, err := Open(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	t.Cleanup(func() { handle.Close() })
	if err := Bootstrap(handle, "../../"); err != nil {
		t.Fatalf("bootstrap: %v", err)
	}
	return handle
}

// A fresh bootstrap runs the whole ladder 3->7; the trio it derives from the
// shipped registry must byte-match data/default-song-set-layouts.json so
// EnsureSongSetLayoutSeeds can stamp seed_hash (Reset stays available).
func TestFreshBootstrapStampsV7AndSeedsTrioHashes(t *testing.T) {
	handle := openMigratedTestDB(t)

	var ver string
	if err := handle.QueryRow(
		`SELECT value FROM settings WHERE key = ?`, dataVersionKey,
	).Scan(&ver); err != nil {
		t.Fatalf("read data_version: %v", err)
	}
	if ver != currentDataVersion {
		t.Fatalf("data_version = %q, want %q", ver, currentDataVersion)
	}

	rows, err := handle.Query(`SELECT role, seed_hash FROM song_set_layouts ORDER BY role`)
	if err != nil {
		t.Fatalf("read trio: %v", err)
	}
	defer rows.Close()
	hashes := map[string]sql.NullString{}
	for rows.Next() {
		var role string
		var hash sql.NullString
		if err := rows.Scan(&role, &hash); err != nil {
			t.Fatalf("scan trio row: %v", err)
		}
		hashes[role] = hash
	}
	if err := rows.Err(); err != nil {
		t.Fatalf("rows: %v", err)
	}
	for _, role := range []string{"title", "verse", "reff"} {
		hash, ok := hashes[role]
		if !ok {
			t.Fatalf("song_set_layouts missing role %q", role)
		}
		if !hash.Valid || hash.String == "" {
			t.Errorf("role %q: seed_hash not stamped — migration-derived payload does not match the shipped seed file", role)
		}
	}
}

func insertBackfillService(t *testing.T, handle *sql.DB, date, parsed string) int64 {
	t.Helper()
	res, err := handle.Exec(
		`INSERT INTO services (date, raw_payload, parsed_data, updated_at) VALUES (?, ?, ?, ?)`,
		date, "raw", parsed, nowUTCString(),
	)
	if err != nil {
		t.Fatalf("insert service: %v", err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		t.Fatalf("last insert id: %v", err)
	}
	return id
}

func TestMigrateSongSetInputsBackfillsFourDefaults(t *testing.T) {
	handle := openMigratedTestDB(t)

	sectioned := `{"items":[
		{"type":"section","title":"BIBLE TALK"},
		{"type":"hymn","number":12,"title":"BT Open"},
		{"type":"hymn","number":34,"title":"BT Close"},
		{"type":"section","title":"DIVINE SERVICE"},
		{"type":"hymn","number":56,"title":"DS Open"},
		{"type":"hymn","number":78,"title":"DS Close"}
	]}`
	flat := `{"items":[
		{"type":"hymn","number":9},{"type":"hymn","number":8},
		{"type":"hymn","number":7},{"type":"hymn","number":6}
	]}`
	svcA := insertBackfillService(t, handle, "2026-08-01", sectioned)
	svcB := insertBackfillService(t, handle, "2026-08-08", flat)

	// Rewind to v6 so the gated pass actually runs.
	if _, err := handle.Exec(
		`INSERT OR REPLACE INTO settings (key, value) VALUES (?, '6')`, dataVersionKey,
	); err != nil {
		t.Fatalf("rewind version: %v", err)
	}
	if err := migrateSongSetInputs(handle); err != nil {
		t.Fatalf("migrateSongSetInputs: %v", err)
	}

	want := map[string]map[string]int64{
		strconv.FormatInt(svcA, 10): {
			"opening_song_bt": 12, "closing_song_bt": 34,
			"opening_song_dw": 56, "closing_song_dw": 78,
		},
		strconv.FormatInt(svcB, 10): {
			"opening_song_bt": 9, "closing_song_bt": 8,
			"opening_song_dw": 7, "closing_song_dw": 6,
		},
	}
	assertInputs(t, handle, want)

	var ver string
	if err := handle.QueryRow(
		`SELECT value FROM settings WHERE key = ?`, dataVersionKey,
	).Scan(&ver); err != nil {
		t.Fatalf("read data_version: %v", err)
	}
	if ver != "7" {
		t.Fatalf("data_version = %q, want 7", ver)
	}

	// Idempotence: rerunning must not duplicate or change anything.
	if err := migrateSongSetInputs(handle); err != nil {
		t.Fatalf("second run: %v", err)
	}
	assertInputs(t, handle, want)
}

func assertInputs(t *testing.T, handle *sql.DB, want map[string]map[string]int64) {
	t.Helper()
	rows, err := handle.Query(
		`SELECT service_id, variable_name, song_number FROM song_set_inputs
		  ORDER BY service_id, variable_name`,
	)
	if err != nil {
		t.Fatalf("read inputs: %v", err)
	}
	defer rows.Close()
	got := map[string]map[string]int64{}
	for rows.Next() {
		var svcID int64
		var vn string
		var num sql.NullInt64
		if err := rows.Scan(&svcID, &vn, &num); err != nil {
			t.Fatalf("scan input: %v", err)
		}
		key := strconv.FormatInt(svcID, 10)
		if got[key] == nil {
			got[key] = map[string]int64{}
		}
		got[key][vn] = num.Int64
	}
	if err := rows.Err(); err != nil {
		t.Fatalf("rows: %v", err)
	}
	if len(got) != len(want) {
		t.Fatalf("services with inputs = %d, want %d (%v)", len(got), len(want), got)
	}
	for svc, entries := range want {
		for vn, num := range entries {
			if got[svc][vn] != num {
				t.Errorf("service %s %s = %d, want %d", svc, vn, got[svc][vn], num)
			}
		}
		if len(got[svc]) != len(entries) {
			t.Errorf("service %s has %d input rows, want %d (%v)", svc, len(got[svc]), len(entries), got[svc])
		}
	}
}
