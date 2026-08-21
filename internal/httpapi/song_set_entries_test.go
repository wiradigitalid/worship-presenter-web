package httpapi

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"github.com/wiradigitalid/worship-presenter-web/internal/db"
)

// newSongSetTestServer boots a real server over a scratch SQLite database
// seeded through db.Bootstrap with the shipped registry and song-set layout
// seeds, plus one admin account for the AD-5 gate.
func newSongSetTestServer(t *testing.T) (*httptest.Server, *sql.DB, string) {
	t.Helper()
	root, err := filepath.Abs(filepath.Join("..", ".."))
	if err != nil {
		t.Fatal(err)
	}
	t.Setenv("WPW_USE_SHIPPED_REGISTRY", "1")
	t.Setenv("AUTH_SECRET", "this-is-a-valid-auth-secret-for-testing")
	t.Setenv("AUTH_BOOTSTRAP_USER", "admin")
	t.Setenv("AUTH_BOOTSTRAP_PASSWORD", "test-password-123")

	handle, err := db.Open(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { handle.Close() })
	if err := db.Bootstrap(handle, root); err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer((&Server{DB: handle, Root: root}).Handler())
	t.Cleanup(ts.Close)
	return ts, handle, root
}

func songSetLogin(t *testing.T, ts *httptest.Server) *http.Cookie {
	t.Helper()
	res := songSetRequest(t, ts, "POST", "/api/auth/login", `{"username":"admin","password":"test-password-123"}`, nil)
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(res.Body)
		t.Fatalf("login failed: %d %s", res.StatusCode, b)
	}
	for _, c := range res.Cookies() {
		if c.Name == "wpw_session" || strings.Contains(c.Name, "session") {
			return c
		}
	}
	t.Fatal("no session cookie returned")
	return nil
}

func songSetRequest(t *testing.T, ts *httptest.Server, method, path, body string, cookie *http.Cookie) *http.Response {
	t.Helper()
	var reader io.Reader
	if body != "" {
		reader = strings.NewReader(body)
	}
	req, err := http.NewRequest(method, ts.URL+path, reader)
	if err != nil {
		t.Fatal(err)
	}
	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	if cookie != nil {
		req.AddCookie(cookie)
	}
	res, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	return res
}

func songSetJSON(t *testing.T, res *http.Response) map[string]any {
	t.Helper()
	defer res.Body.Close()
	var out map[string]any
	if err := json.NewDecoder(res.Body).Decode(&out); err != nil {
		t.Fatalf("response is not a JSON object: %v", err)
	}
	return out
}

func TestSongSetLayoutSeedsInstalled(t *testing.T) {
	ts, handle, root := newSongSetTestServer(t)
	_ = ts
	rows, err := handle.Query(`SELECT role, seed_hash FROM song_set_layouts ORDER BY role`)
	if err != nil {
		t.Fatal(err)
	}
	defer rows.Close()
	seen := map[string]bool{}
	for rows.Next() {
		var role, hash string
		if err := rows.Scan(&role, &hash); err != nil {
			t.Fatal(err)
		}
		if hash == "" {
			t.Fatalf("role %s was seeded without a seed_hash", role)
		}
		seen[role] = true
	}
	if err := rows.Err(); err != nil {
		t.Fatal(err)
	}
	for _, role := range []string{"title", "verse", "reff"} {
		if !seen[role] {
			t.Errorf("song_set_layouts missing role %s after bootstrap", role)
		}
	}
	seeds, err := db.LoadSongSetLayoutSeeds(root)
	if err != nil {
		t.Fatal(err)
	}
	var payload string
	if err := handle.QueryRow(`SELECT payload FROM song_set_layouts WHERE role = 'verse'`).Scan(&payload); err != nil {
		t.Fatal(err)
	}
	if payload != string(seeds["verse"]) {
		t.Error("seeded verse payload does not match the shipped seed bytes")
	}
}

func TestSongSetEntryLifecycle(t *testing.T) {
	ts, _, _ := newSongSetTestServer(t)

	res := songSetRequest(t, ts, "GET", "/api/admin/song-set-entries", "", nil)
	if res.StatusCode != http.StatusUnauthorized {
		t.Errorf("unauthenticated list = %d, want 401", res.StatusCode)
	}
	res.Body.Close()

	cookie := songSetLogin(t, ts)

	res = songSetRequest(t, ts, "GET", "/api/admin/song-set-entries", "", cookie)
	body := songSetJSON(t, res)
	if res.StatusCode != http.StatusOK {
		t.Fatalf("list entries = %d, want 200", res.StatusCode)
	}
	entries, _ := body["entries"].([]any)
	if len(entries) < 4 {
		t.Fatalf("expected the four seed entries, got %d", len(entries))
	}

	// Create.
	res = songSetRequest(t, ts, "POST", "/api/admin/song-set-entries",
		`{"variableName":"special_anthem","title":"Anthem of Praise"}`, cookie)
	body = songSetJSON(t, res)
	if res.StatusCode != http.StatusCreated {
		t.Fatalf("create entry = %d (%v), want 201", res.StatusCode, body)
	}
	created, _ := body["updatedAt"].(string)
	if created == "" {
		t.Fatal("create response missing updatedAt")
	}

	// Duplicate and invalid names.
	res = songSetRequest(t, ts, "POST", "/api/admin/song-set-entries",
		`{"variableName":"special_anthem","title":"Again"}`, cookie)
	if res.StatusCode != http.StatusConflict {
		t.Errorf("duplicate create = %d, want 409", res.StatusCode)
	}
	res.Body.Close()
	res = songSetRequest(t, ts, "POST", "/api/admin/song-set-entries",
		`{"variableName":"Bad Name!","title":"X"}`, cookie)
	if res.StatusCode != http.StatusBadRequest {
		t.Errorf("invalid variableName = %d, want 400", res.StatusCode)
	}
	res.Body.Close()

	// PATCH: immutable, stale, unknown, then a real rename.
	res = songSetRequest(t, ts, "PATCH", "/api/admin/song-set-entries/special_anthem",
		fmt.Sprintf(`{"title":"Renamed","updatedAt":%q,"variableName":"other"}`, created), cookie)
	if res.StatusCode != http.StatusBadRequest {
		t.Errorf("immutable variableName patch = %d, want 400", res.StatusCode)
	}
	res.Body.Close()
	res = songSetRequest(t, ts, "PATCH", "/api/admin/song-set-entries/special_anthem",
		`{"title":"Renamed","updatedAt":"2000-01-01T00:00:00Z"}`, cookie)
	if res.StatusCode != http.StatusConflict {
		t.Errorf("stale patch = %d, want 409", res.StatusCode)
	}
	res.Body.Close()
	res = songSetRequest(t, ts, "PATCH", "/api/admin/song-set-entries/missing_entry",
		fmt.Sprintf(`{"title":"X","updatedAt":%q}`, created), cookie)
	if res.StatusCode != http.StatusNotFound {
		t.Errorf("unknown entry patch = %d, want 404", res.StatusCode)
	}
	res.Body.Close()
	res = songSetRequest(t, ts, "PATCH", "/api/admin/song-set-entries/special_anthem",
		fmt.Sprintf(`{"title":"Anthem Renamed","updatedAt":%q}`, created), cookie)
	body = songSetJSON(t, res)
	if res.StatusCode != http.StatusOK {
		t.Fatalf("rename patch = %d (%v), want 200", res.StatusCode, body)
	}
	renamed, _ := body["updatedAt"].(string)

	// DELETE: missing token, stale token, then success.
	res = songSetRequest(t, ts, "DELETE", "/api/admin/song-set-entries/special_anthem", `{}`, cookie)
	if res.StatusCode != http.StatusBadRequest {
		t.Errorf("delete without updatedAt = %d, want 400", res.StatusCode)
	}
	res.Body.Close()
	res = songSetRequest(t, ts, "DELETE", "/api/admin/song-set-entries/special_anthem",
		fmt.Sprintf(`{"updatedAt":%q}`, renamed), cookie)
	body = songSetJSON(t, res)
	if res.StatusCode != http.StatusOK {
		t.Fatalf("delete = %d (%v), want 200", res.StatusCode, body)
	}
	res = songSetRequest(t, ts, "GET", "/api/admin/song-set-entries", "", cookie)
	body = songSetJSON(t, res)
	for _, raw := range body["entries"].([]any) {
		if e := raw.(map[string]any); e["variableName"] == "special_anthem" {
			t.Error("deleted entry still listed")
		}
	}
}

func TestSongSetLayoutTrioEndpoints(t *testing.T) {
	ts, _, root := newSongSetTestServer(t)
	cookie := songSetLogin(t, ts)

	res := songSetRequest(t, ts, "GET", "/api/admin/song-set-layouts/bogus", "", cookie)
	if res.StatusCode != http.StatusNotFound {
		t.Errorf("unknown role = %d, want 404", res.StatusCode)
	}
	res.Body.Close()

	res = songSetRequest(t, ts, "GET", "/api/admin/song-set-layouts/verse", "", cookie)
	body := songSetJSON(t, res)
	if res.StatusCode != http.StatusOK {
		t.Fatalf("get verse layout = %d, want 200", res.StatusCode)
	}
	layout, _ := body["layout"].(map[string]any)
	if layout == nil || layout["elements"] == nil {
		t.Fatal("verse layout response missing elements")
	}
	current, _ := body["updatedAt"].(string)

	// AD-33 blank-canvas rule: no background image, no image element.
	res = songSetRequest(t, ts, "PUT", "/api/admin/song-set-layouts/verse",
		fmt.Sprintf(`{"updatedAt":%q,"layout":{"aspectRatio":"16:9","backgroundColor":"#101010","backgroundImage":"/assets/x.png","elements":[]}}`, current), cookie)
	body = songSetJSON(t, res)
	if res.StatusCode != http.StatusBadRequest || !strings.Contains(fmt.Sprint(body["error"]), "must not set a background image") {
		t.Errorf("verse backgroundImage PUT = %d %v, want 400 naming background image", res.StatusCode, body)
	}
	res = songSetRequest(t, ts, "PUT", "/api/admin/song-set-layouts/verse",
		fmt.Sprintf(`{"updatedAt":%q,"layout":{"aspectRatio":"16:9","backgroundColor":"#101010","elements":[{"id":"pic","type":"image","x":0,"y":0,"w":1,"h":1,"zIndex":0}]}}`, current), cookie)
	body = songSetJSON(t, res)
	if res.StatusCode != http.StatusBadRequest || !strings.Contains(fmt.Sprint(body["error"]), "elements[0]") {
		t.Errorf("verse image element PUT = %d %v, want 400 naming elements[0]", res.StatusCode, body)
	}

	// Valid save, stale conflict, then reset restores shipped bytes.
	validVerse := `{"aspectRatio":"16:9","backgroundColor":"#202020","elements":[{"id":"v","type":"text","required":true,"x":10,"y":10,"w":100,"h":20,"zIndex":1,"placeholderKey":"verse_number"}]}`
	res = songSetRequest(t, ts, "PUT", "/api/admin/song-set-layouts/verse",
		fmt.Sprintf(`{"updatedAt":%q,"layout":%s}`, current, validVerse), cookie)
	body = songSetJSON(t, res)
	if res.StatusCode != http.StatusOK {
		t.Fatalf("valid verse PUT = %d (%v), want 200", res.StatusCode, body)
	}
	saved, _ := body["updatedAt"].(string)
	if saved == "" || saved == current {
		t.Fatal("valid verse PUT did not advance updatedAt")
	}
	res = songSetRequest(t, ts, "PUT", "/api/admin/song-set-layouts/verse",
		fmt.Sprintf(`{"updatedAt":%q,"layout":%s}`, current, validVerse), cookie)
	if res.StatusCode != http.StatusConflict {
		t.Errorf("stale verse PUT = %d, want 409", res.StatusCode)
	}
	res.Body.Close()

	res = songSetRequest(t, ts, "POST", "/api/admin/song-set-layouts/verse/reset", "", cookie)
	body = songSetJSON(t, res)
	if res.StatusCode != http.StatusOK {
		t.Fatalf("reset verse = %d (%v), want 200", res.StatusCode, body)
	}
	seeds, err := db.LoadSongSetLayoutSeeds(root)
	if err != nil {
		t.Fatal(err)
	}
	stored := songSetJSON(t, songSetRequest(t, ts, "GET", "/api/admin/song-set-layouts/verse", "", cookie))
	raw, _ := json.Marshal(stored["layout"])
	if string(raw) != string(seeds["verse"]) {
		t.Error("reset did not restore the shipped verse payload")
	}
}
