package httpapi

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
)

type errorBody struct {
	Error string `json:"error"`
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	w.WriteHeader(status)
	if err := enc.Encode(v); err != nil {
		log.Printf("writeJSON: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, errorBody{Error: msg})
}

func readJSONObject(r *http.Request, maxBytes int64) (map[string]any, error, int, string) {
	if maxBytes <= 0 {
		maxBytes = 1 << 20
	}
	r.Body = http.MaxBytesReader(nil, r.Body, maxBytes)
	raw, err := io.ReadAll(r.Body)
	if err != nil {
		return nil, err, http.StatusBadRequest, "Invalid JSON"
	}
	if len(raw) == 0 {
		return nil, errEmptyJSON, http.StatusBadRequest, "Invalid JSON"
	}
	var v any
	if err := json.Unmarshal(raw, &v); err != nil {
		return nil, err, http.StatusBadRequest, "Invalid JSON"
	}
	obj, ok := v.(map[string]any)
	if !ok {
		return nil, errNotObject, http.StatusBadRequest, "Invalid body"
	}
	return obj, nil, 0, ""
}

// readJSONObjectOptional accepts an empty body as {}. DELETE carries the
// AD-6 token in JSON or as ?updated_at=.
func readJSONObjectOptional(r *http.Request, maxBytes int64) (map[string]any, error, int, string) {
	if maxBytes <= 0 {
		maxBytes = 1 << 20
	}
	r.Body = http.MaxBytesReader(nil, r.Body, maxBytes)
	raw, err := io.ReadAll(r.Body)
	if err != nil {
		return nil, err, http.StatusBadRequest, "Invalid JSON"
	}
	if len(bytes.TrimSpace(raw)) == 0 {
		return map[string]any{}, nil, 0, ""
	}
	var v any
	if err := json.Unmarshal(raw, &v); err != nil {
		return nil, err, http.StatusBadRequest, "Invalid JSON"
	}
	obj, ok := v.(map[string]any)
	if !ok {
		return nil, errNotObject, http.StatusBadRequest, "Invalid body"
	}
	return obj, nil, 0, ""
}

var errEmptyJSON = io.EOF
var errNotObject = io.ErrUnexpectedEOF

func asString(v any) string {
	if v == nil {
		return ""
	}
	s, ok := v.(string)
	if ok {
		return s
	}
	b, err := json.Marshal(v)
	if err != nil {
		return ""
	}
	// Match TS String(value): numbers/bools become their JSON text without quotes.
	if len(b) >= 2 && b[0] == '"' {
		var out string
		if json.Unmarshal(b, &out) == nil {
			return out
		}
	}
	return string(b)
}
