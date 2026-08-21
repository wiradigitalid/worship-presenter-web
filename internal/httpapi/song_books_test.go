package httpapi

import (
	"fmt"
	"net/http"
	"testing"
)

func TestSongBooks_AdminCRUDAndOperatorList(t *testing.T) {
	ts, handle, _ := newSongSetTestServer(t)
	cookie := songSetLogin(t, ts)

	// 1. Unauthenticated / non-admin access -> 401 / 403
	res := songSetRequest(t, ts, "GET", "/api/admin/song-books", "", nil)
	if res.StatusCode != http.StatusUnauthorized {
		t.Fatalf("unauth admin GET = %d, want 401", res.StatusCode)
	}
	res.Body.Close()

	res = songSetRequest(t, ts, "POST", "/api/admin/song-books", `{"book_code":"TEST","name":"Test","locale":"en"}`, nil)
	if res.StatusCode != http.StatusUnauthorized {
		t.Fatalf("unauth admin POST = %d, want 401", res.StatusCode)
	}
	res.Body.Close()

	res = songSetRequest(t, ts, "PATCH", "/api/admin/song-books/TEST", `{"updatedAt":"now"}`, nil)
	if res.StatusCode != http.StatusUnauthorized {
		t.Fatalf("unauth admin PATCH = %d, want 401", res.StatusCode)
	}
	res.Body.Close()

	res = songSetRequest(t, ts, "DELETE", "/api/admin/song-books/TEST", `{"updatedAt":"now"}`, nil)
	if res.StatusCode != http.StatusUnauthorized {
		t.Fatalf("unauth admin DELETE = %d, want 401", res.StatusCode)
	}
	res.Body.Close()

	// Operator list unauthenticated -> 401
	res = songSetRequest(t, ts, "GET", "/api/song-books", "", nil)
	if res.StatusCode != http.StatusUnauthorized {
		t.Fatalf("unauth operator GET = %d, want 401", res.StatusCode)
	}
	res.Body.Close()

	// 2. Initial list
	res = songSetRequest(t, ts, "GET", "/api/admin/song-books", "", cookie)
	if res.StatusCode != http.StatusOK {
		t.Fatalf("admin GET = %d, want 200", res.StatusCode)
	}
	var listBody map[string]any
	_ = jsonDecode(res.Body, &listBody)
	res.Body.Close()
	_, ok := listBody["books"].([]any)
	if !ok {
		t.Fatalf("initial books invalid payload: %v", listBody)
	}

	// 3. Validation: locale required, book_code <= 20 chars, name <= 120 chars
	res = songSetRequest(t, ts, "POST", "/api/admin/song-books", `{"book_code":"TEST","name":"Test"}`, cookie)
	if res.StatusCode != http.StatusBadRequest {
		t.Fatalf("POST without locale = %d, want 400", res.StatusCode)
	}
	res.Body.Close()

	res = songSetRequest(t, ts, "POST", "/api/admin/song-books", `{"book_code":"THIS_BOOK_CODE_IS_TOO_LONG","name":"Test","locale":"en"}`, cookie)
	if res.StatusCode != http.StatusBadRequest {
		t.Fatalf("POST with >20 char book_code = %d, want 400", res.StatusCode)
	}
	res.Body.Close()

	res = songSetRequest(t, ts, "POST", "/api/admin/song-books", `{"book_code":"","name":"Test","locale":"en"}`, cookie)
	if res.StatusCode != http.StatusBadRequest {
		t.Fatalf("POST with empty book_code = %d, want 400", res.StatusCode)
	}
	res.Body.Close()

	// 4. Create book 1 (isDefault: true) -> 201 and sets bootstrap marker
	res = songSetRequest(t, ts, "POST", "/api/admin/song-books", `{"book_code":"BOOK1","name":"Book One","locale":"en","licence":"CC-BY","provenance":"Test Prov","is_default":true}`, cookie)
	if res.StatusCode != http.StatusCreated {
		t.Fatalf("POST BOOK1 = %d, want 201", res.StatusCode)
	}
	var created1 map[string]any
	_ = jsonDecode(res.Body, &created1)
	res.Body.Close()
	if created1["bookCode"] != "BOOK1" || created1["name"] != "Book One" || created1["locale"] != "en" || created1["licence"] != "CC-BY" || created1["provenance"] != "Test Prov" || !created1["isDefault"].(bool) {
		t.Fatalf("created BOOK1 = %v", created1)
	}
	_ = created1["updatedAt"].(string)

	// Assert persisted values directly in DB
	var storedLocale, storedLicence, storedProv string
	err := handle.QueryRow(`SELECT locale, licence, provenance FROM song_books WHERE book_code = ?`, "BOOK1").Scan(&storedLocale, &storedLicence, &storedProv)
	if err != nil || storedLocale != "en" || storedLicence != "CC-BY" || storedProv != "Test Prov" {
		t.Fatalf("DB values for BOOK1 = (%q, %q, %q), err = %v", storedLocale, storedLicence, storedProv, err)
	}

	// Check bootstrap marker for BOOK1 in settings
	var markerVal string
	err = handle.QueryRow(`SELECT value FROM settings WHERE key = ?`, "song_book_bootstrapped_BOOK1").Scan(&markerVal)
	if err != nil || markerVal != "1" {
		t.Fatalf("bootstrap marker for BOOK1 = %q, err = %v, want 1", markerVal, err)
	}

	// 5. 409 on duplicate book_code
	res = songSetRequest(t, ts, "POST", "/api/admin/song-books", `{"book_code":"BOOK1","name":"Duplicate Book","locale":"en"}`, cookie)
	if res.StatusCode != http.StatusConflict {
		t.Fatalf("POST duplicate BOOK1 = %d, want 409", res.StatusCode)
	}
	res.Body.Close()

	// 6. Create book 2 (not default)
	res = songSetRequest(t, ts, "POST", "/api/admin/song-books", `{"book_code":"BOOK2","name":"Book Two","locale":"id","is_default":false}`, cookie)
	if res.StatusCode != http.StatusCreated {
		t.Fatalf("POST BOOK2 = %d, want 201", res.StatusCode)
	}
	var created2 map[string]any
	_ = jsonDecode(res.Body, &created2)
	res.Body.Close()
	if created2["locale"] != "id" {
		t.Fatalf("created BOOK2 locale = %v, want id", created2["locale"])
	}
	updatedAt2 := created2["updatedAt"].(string)

	// Admin list returns locale, licence, provenance
	res = songSetRequest(t, ts, "GET", "/api/admin/song-books", "", cookie)
	if res.StatusCode != http.StatusOK {
		t.Fatalf("admin GET = %d, want 200", res.StatusCode)
	}
	var adminListBody map[string]any
	_ = jsonDecode(res.Body, &adminListBody)
	res.Body.Close()
	adminBooks, ok := adminListBody["books"].([]any)
	if !ok || len(adminBooks) < 2 {
		t.Fatalf("admin books = %v", adminListBody)
	}
	foundB1 := false
	for _, b := range adminBooks {
		bm, _ := b.(map[string]any)
		if bm["bookCode"] == "BOOK1" {
			foundB1 = true
			if bm["locale"] != "en" || bm["licence"] != "CC-BY" || bm["provenance"] != "Test Prov" {
				t.Fatalf("admin GET BOOK1 item = %v", bm)
			}
		}
	}
	if !foundB1 {
		t.Fatalf("BOOK1 not found in admin list: %v", adminBooks)
	}

	// Check operator list
	res = songSetRequest(t, ts, "GET", "/api/song-books", "", cookie)
	if res.StatusCode != http.StatusOK {
		t.Fatalf("operator GET = %d, want 200", res.StatusCode)
	}
	var opList map[string]any
	_ = jsonDecode(res.Body, &opList)
	res.Body.Close()
	opBooks, ok := opList["books"].([]any)
	if !ok || len(opBooks) < 2 {
		t.Fatalf("operator books count = %d, want >= 2", len(opBooks))
	}

	// 7. PATCH missing updatedAt -> 400
	res = songSetRequest(t, ts, "PATCH", "/api/admin/song-books/BOOK2", `{"name":"Book Two Renamed"}`, cookie)
	if res.StatusCode != http.StatusBadRequest {
		t.Fatalf("PATCH missing updatedAt = %d, want 400", res.StatusCode)
	}
	res.Body.Close()

	// 8. PATCH stale updatedAt -> 409
	res = songSetRequest(t, ts, "PATCH", "/api/admin/song-books/BOOK2", `{"name":"Book Two Renamed","updatedAt":"stale-time"}`, cookie)
	if res.StatusCode != http.StatusConflict {
		t.Fatalf("PATCH stale updatedAt = %d, want 409", res.StatusCode)
	}
	res.Body.Close()

	// 9. PATCH unknown book_code -> 404
	res = songSetRequest(t, ts, "PATCH", "/api/admin/song-books/UNKNOWN", fmt.Sprintf(`{"updatedAt":%q}`, updatedAt2), cookie)
	if res.StatusCode != http.StatusNotFound {
		t.Fatalf("PATCH unknown book = %d, want 404", res.StatusCode)
	}
	res.Body.Close()

	// 10. PATCH BOOK2 to be default and rename (must clear BOOK1 default) and test field-selectivity
	// PATCH licence alone on BOOK1 leaves name, locale, provenance untouched
	res = songSetRequest(t, ts, "PATCH", "/api/admin/song-books/BOOK1", fmt.Sprintf(`{"licence":"Updated Licence","updatedAt":%q}`, created1["updatedAt"]), cookie)
	if res.StatusCode != http.StatusOK {
		t.Fatalf("PATCH BOOK1 licence alone = %d, want 200", res.StatusCode)
	}
	var patchB1 map[string]any
	_ = jsonDecode(res.Body, &patchB1)
	res.Body.Close()
	if patchB1["licence"] != "Updated Licence" || patchB1["name"] != "Book One" || patchB1["locale"] != "en" || patchB1["provenance"] != "Test Prov" {
		t.Fatalf("selective PATCH BOOK1 = %v", patchB1)
	}

	res = songSetRequest(t, ts, "PATCH", "/api/admin/song-books/BOOK2", fmt.Sprintf(`{"name":"Book Two Updated","is_default":true,"updatedAt":%q}`, updatedAt2), cookie)
	if res.StatusCode != http.StatusOK {
		t.Fatalf("PATCH BOOK2 = %d, want 200", res.StatusCode)
	}
	var patchBody map[string]any
	_ = jsonDecode(res.Body, &patchBody)
	res.Body.Close()
	if !patchBody["isDefault"].(bool) || patchBody["name"] != "Book Two Updated" || patchBody["locale"] != "id" {
		t.Fatalf("patched BOOK2 = %v", patchBody)
	}

	// Assert BOOK1 default is actually cleared in DB
	var b1Def int
	_ = handle.QueryRow(`SELECT is_default FROM song_books WHERE book_code = ?`, "BOOK1").Scan(&b1Def)
	if b1Def != 0 {
		t.Fatalf("BOOK1 is_default = %d, want 0 after BOOK2 set as default", b1Def)
	}

	// 11. DELETE missing updatedAt -> 400
	res = songSetRequest(t, ts, "DELETE", "/api/admin/song-books/BOOK1", "", cookie)
	if res.StatusCode != http.StatusBadRequest {
		t.Fatalf("DELETE missing updatedAt = %d, want 400", res.StatusCode)
	}
	res.Body.Close()

	// 12. DELETE stale updatedAt -> 409
	res = songSetRequest(t, ts, "DELETE", "/api/admin/song-books/BOOK1", `{"updatedAt":"stale"}`, cookie)
	if res.StatusCode != http.StatusConflict {
		t.Fatalf("DELETE stale updatedAt = %d, want 409", res.StatusCode)
	}
	res.Body.Close()

	// Refresh BOOK1 updatedAt because clearing its default updated its timestamp
	var freshUpdatedAt1 string
	_ = handle.QueryRow(`SELECT updated_at FROM song_books WHERE book_code = ?`, "BOOK1").Scan(&freshUpdatedAt1)

	// 13. DELETE refused while a hymns row carries the code -> 409
	_, err = handle.Exec(`INSERT INTO hymns (book_code, number, title, lyrics) VALUES (?, ?, ?, ?)`, "BOOK1", 101, "Test Hymn", "Verse 1")
	if err != nil {
		t.Fatal(err)
	}

	res = songSetRequest(t, ts, "DELETE", "/api/admin/song-books/BOOK1", fmt.Sprintf(`{"updatedAt":%q}`, freshUpdatedAt1), cookie)
	if res.StatusCode != http.StatusConflict {
		t.Fatalf("DELETE BOOK1 with hymn = %d, want 409", res.StatusCode)
	}
	res.Body.Close()

	// Clean up hymn row
	_, _ = handle.Exec(`DELETE FROM hymns WHERE book_code = ?`, "BOOK1")

	// 14. DELETE refused while a song_set_inputs.song_book_code references the code -> 409
	// Insert service and song_set_inputs row referencing BOOK1
	var serviceID int64
	sRes, err := handle.Exec(`INSERT INTO services (date, raw_payload) VALUES ('2026-08-23', '{}')`)
	if err != nil {
		t.Fatal(err)
	}
	serviceID, _ = sRes.LastInsertId()
	_, err = handle.Exec(`INSERT INTO song_set_inputs (service_id, variable_name, song_book_code) VALUES (?, 'song1', ?)`, serviceID, "BOOK1")
	if err != nil {
		t.Fatal(err)
	}

	res = songSetRequest(t, ts, "DELETE", "/api/admin/song-books/BOOK1", fmt.Sprintf(`{"updatedAt":%q}`, freshUpdatedAt1), cookie)
	if res.StatusCode != http.StatusConflict {
		t.Fatalf("DELETE BOOK1 with song_set_input reference = %d, want 409", res.StatusCode)
	}
	res.Body.Close()

	// Clean up song_set_inputs row
	_, _ = handle.Exec(`DELETE FROM song_set_inputs WHERE song_book_code = ?`, "BOOK1")
	_, _ = handle.Exec(`DELETE FROM services WHERE id = ?`, serviceID)

	// 15. DELETE BOOK1 succeeds when nothing references it -> 200
	res = songSetRequest(t, ts, "DELETE", "/api/admin/song-books/BOOK1", fmt.Sprintf(`{"updatedAt":%q}`, freshUpdatedAt1), cookie)
	if res.StatusCode != http.StatusOK {
		t.Fatalf("DELETE BOOK1 = %d, want 200", res.StatusCode)
	}
	res.Body.Close()

	var b1Count int
	_ = handle.QueryRow(`SELECT COUNT(*) FROM song_books WHERE book_code = ?`, "BOOK1").Scan(&b1Count)
	if b1Count != 0 {
		t.Fatalf("BOOK1 count in DB = %d, want 0", b1Count)
	}

	// 16. DELETE default book (BOOK2) succeeds when unreferenced and leaves no default
	var freshUpdatedAt2 string
	_ = handle.QueryRow(`SELECT updated_at FROM song_books WHERE book_code = ?`, "BOOK2").Scan(&freshUpdatedAt2)

	res = songSetRequest(t, ts, "DELETE", "/api/admin/song-books/BOOK2", fmt.Sprintf(`{"updatedAt":%q}`, freshUpdatedAt2), cookie)
	if res.StatusCode != http.StatusOK {
		t.Fatalf("DELETE BOOK2 (default) = %d, want 200", res.StatusCode)
	}
	res.Body.Close()

	var defaultCount int
	_ = handle.QueryRow(`SELECT COUNT(*) FROM song_books WHERE is_default = 1`).Scan(&defaultCount)
	if defaultCount != 0 {
		t.Fatalf("default books count after deleting default = %d, want 0", defaultCount)
	}

	// 17. DELETE unknown book -> 404
	res = songSetRequest(t, ts, "DELETE", "/api/admin/song-books/BOOK2", fmt.Sprintf(`{"updatedAt":%q}`, freshUpdatedAt2), cookie)
	if res.StatusCode != http.StatusNotFound {
		t.Fatalf("DELETE already deleted BOOK2 = %d, want 404", res.StatusCode)
	}
	res.Body.Close()
}
