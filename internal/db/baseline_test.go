package db

import (
	"path/filepath"
	"testing"
)

// TestServiceDeleteAnnouncementItemsPreservation asserts that deleting a Service
// leaves announcement_items in place with service_id intact.
func TestServiceDeleteAnnouncementItemsPreservation(t *testing.T) {
	dbPath := filepath.Join(t.TempDir(), "preserve.db")
	handle, err := Open(dbPath)
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer handle.Close()

	if err := Bootstrap(handle, "../../"); err != nil {
		t.Fatalf("bootstrap: %v", err)
	}

	res, err := handle.Exec(`INSERT INTO services (date, raw_payload) VALUES ('2026-08-22', 'raw')`)
	if err != nil {
		t.Fatalf("insert service: %v", err)
	}
	svcID, _ := res.LastInsertId()

	_, err = handle.Exec(`
		INSERT INTO announcement_items (id, image_url, service_id, sort_order)
		VALUES (1, '/api/uploads/flyer1.png', ?, 1);
	`, svcID)
	if err != nil {
		t.Fatalf("insert item: %v", err)
	}

	// Delete service
	_, err = handle.Exec(`DELETE FROM services WHERE id = ?`, svcID)
	if err != nil {
		t.Fatalf("delete service: %v", err)
	}

	// Assert rows are preserved with service_id intact
	var count int
	var storedSvcID int64
	err = handle.QueryRow(`SELECT COUNT(*), COALESCE(service_id, -1) FROM announcement_items WHERE id = 1`).Scan(&count, &storedSvcID)
	if err != nil {
		t.Fatalf("query items: %v", err)
	}
	if count != 1 || storedSvcID != svcID {
		t.Fatalf("expected 1 announcement_item with service_id=%d, got count=%d service_id=%d", svcID, count, storedSvcID)
	}
}


