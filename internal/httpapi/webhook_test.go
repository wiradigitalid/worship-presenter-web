package httpapi

import (
	"net/http"
	"strings"
	"testing"
)

func TestWebhook_AnnouncementsIgnoredNoAnnouncementItemsWritten(t *testing.T) {
	ts, handle, _ := newSongSetTestServer(t)

	// Clean out any existing announcement_items
	if _, err := handle.Exec(`DELETE FROM announcement_items`); err != nil {
		t.Fatalf("delete announcement_items: %v", err)
	}

	secret := "test-webhook-secret-value"
	t.Setenv("WEBHOOK_SECRET", secret)

	payload := `{
		"text": "SABBATH, JULY 25, 2026\nDIVINE SERVICE\nSermon: Pastor Test",
		"announcements": [
			"https://example.com/flyer1.png",
			"https://example.com/flyer2.png"
		]
	}`

	req, err := http.NewRequest("POST", ts.URL+"/api/webhook", strings.NewReader(payload))
	if err != nil {
		t.Fatalf("create request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Webhook-Secret", secret)

	res, err := ts.Client().Do(req)
	if err != nil {
		t.Fatalf("execute request: %v", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusCreated {
		t.Fatalf("expected 201 Created, got %d", res.StatusCode)
	}

	body := songSetJSON(t, res)
	var count int
	if err := handle.QueryRow(`SELECT COUNT(*) FROM announcement_items`).Scan(&count); err != nil {
		t.Fatalf("query announcement_items: %v", err)
	}
	if count != 0 {
		t.Fatalf("expected 0 announcement_items after webhook with announcements[], got %d", count)
	}

	if added, ok := body["announcementsAdded"]; ok {
		if addedFloat, isNum := added.(float64); isNum && int(addedFloat) != 0 {
			t.Fatalf("expected announcementsAdded to be 0, got %v", added)
		}
	}
}
