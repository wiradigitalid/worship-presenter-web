package httpapi

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/wiradigitalid/worship-presenter-web/internal/plan"
)

type artifactSummary struct {
	ID        string `json:"id"`
	Label     string `json:"label"`
	BaseType  string `json:"baseType"`
	UpdatedAt string `json:"updatedAt"`
	Editable  bool   `json:"editable"`
}

func (s *Server) listArtifacts(w http.ResponseWriter, r *http.Request) {
	rows, err := s.DB.Query(
		`SELECT id, label, base_type, updated_at FROM artifact_templates ORDER BY position`,
	)
	if err != nil {
		log.Printf("Error listing artifact templates: %v", err)
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	defer rows.Close()
	list := []artifactSummary{}
	for rows.Next() {
		var it artifactSummary
		if err := rows.Scan(&it.ID, &it.Label, &it.BaseType, &it.UpdatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "Internal Server Error")
			return
		}
		it.Editable = it.BaseType == "general"
		list = append(list, it)
	}
	writeJSON(w, http.StatusOK, map[string]any{"templates": list})
}

func (s *Server) getArtifact(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	raw, err := s.loadArtifactJSON(id)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "Template not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(raw)
}

func (s *Server) loadArtifactJSON(id string) ([]byte, error) {
	var payload, updatedAt string
	err := s.DB.QueryRow(
		`SELECT payload, updated_at FROM artifact_templates WHERE id = ?`, id,
	).Scan(&payload, &updatedAt)
	if err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal([]byte(payload), &obj); err != nil {
		return nil, err
	}
	obj["updatedAt"] = updatedAt
	return json.Marshal(obj)
}

func (s *Server) putArtifact(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	body, err, status, msg := readJSONObject(r, 8<<20)
	if err != nil {
		if msg == "Invalid body" {
			writeError(w, http.StatusBadRequest, "Invalid JSON")
			return
		}
		writeError(w, status, msg)
		return
	}
	updatedAt, _ := body["updatedAt"].(string)
	if strings.TrimSpace(updatedAt) == "" {
		writeError(w, http.StatusBadRequest, "updatedAt is required")
		return
	}
	var storedUpdated, payload, baseType, label string
	err = s.DB.QueryRow(
		`SELECT updated_at, payload, base_type, label FROM artifact_templates WHERE id = ?`, id,
	).Scan(&storedUpdated, &payload, &baseType, &label)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "Unknown template: "+id)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if storedUpdated != updatedAt {
		writeError(w, http.StatusConflict, "Template was modified by another session")
		return
	}
	if baseType != "general" {
		writeError(w, http.StatusBadRequest, "Template base type is read-only")
		return
	}
	if v, has := body["baseType"]; has {
		if bt, _ := v.(string); bt != "" && bt != baseType {
			writeError(w, http.StatusBadRequest, "baseType cannot be changed")
			return
		}
	}
	delete(body, "updatedAt")
	if pid, _ := body["id"].(string); pid != "" && pid != id {
		writeError(w, http.StatusBadRequest, "Template id in payload must match route id")
		return
	}
	body["id"] = id
	next, err := json.Marshal(body)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}
	newLabel, _ := body["label"].(string)
	if newLabel == "" {
		newLabel = label
	}
	now := time.Now().UTC().Format(time.RFC3339Nano)
	res, err := s.DB.Exec(
		`UPDATE artifact_templates SET label = ?, payload = ?, updated_at = ? WHERE id = ? AND updated_at = ?`,
		newLabel, string(next), now, id, updatedAt,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		writeError(w, http.StatusConflict, "Template was modified by another session")
		return
	}
	raw, err := s.loadArtifactJSON(id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(raw)
}

func (s *Server) deleteArtifact(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	body, err, status, msg := readJSONObject(r, 1<<20)
	if err != nil {
		writeError(w, status, msg)
		return
	}
	updatedAt, _ := body["updatedAt"].(string)
	if strings.TrimSpace(updatedAt) == "" {
		writeError(w, http.StatusBadRequest, "updatedAt is required")
		return
	}
	var stored string
	err = s.DB.QueryRow(`SELECT updated_at FROM artifact_templates WHERE id = ?`, id).Scan(&stored)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "Unknown template: "+id)
		return
	}
	if stored != updatedAt {
		writeError(w, http.StatusConflict, "Template was modified by another session")
		return
	}
	tx, err := s.DB.Begin()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	defer tx.Rollback()
	if _, err := tx.Exec(`DELETE FROM artifact_templates WHERE id = ?`, id); err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	now := time.Now().UTC().Format(time.RFC3339Nano)
	rows, err := tx.Query(`SELECT id FROM artifact_templates ORDER BY position`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	var ids []string
	for rows.Next() {
		var sid string
		if err := rows.Scan(&sid); err != nil {
			rows.Close()
			writeError(w, http.StatusInternalServerError, "Internal Server Error")
			return
		}
		ids = append(ids, sid)
	}
	rows.Close()
	for i, sid := range ids {
		if _, err := tx.Exec(`UPDATE artifact_templates SET position = ?, updated_at = ? WHERE id = ?`, i, now, sid); err != nil {
			writeError(w, http.StatusInternalServerError, "Internal Server Error")
			return
		}
	}
	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	s.listArtifacts(w, r)
}

func (s *Server) reorderArtifacts(w http.ResponseWriter, r *http.Request) {
	body, err, status, msg := readJSONObject(r, 1<<20)
	if err != nil {
		writeError(w, status, msg)
		return
	}
	items, ok := body["items"].([]any)
	if !ok {
		writeError(w, http.StatusBadRequest, "items must be an array")
		return
	}
	rows, err := s.DB.Query(`SELECT id, updated_at FROM artifact_templates ORDER BY position`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	type tok struct{ id, at string }
	var live []tok
	for rows.Next() {
		var t tok
		if err := rows.Scan(&t.id, &t.at); err != nil {
			rows.Close()
			writeError(w, http.StatusInternalServerError, "Internal Server Error")
			return
		}
		live = append(live, t)
	}
	rows.Close()
	if len(items) != len(live) {
		writeError(w, http.StatusBadRequest, "items must contain every live template exactly once")
		return
	}
	tokens := map[string]string{}
	for _, t := range live {
		tokens[t.id] = t.at
	}
	seen := map[string]struct{}{}
	var order []string
	for _, raw := range items {
		m, ok := raw.(map[string]any)
		if !ok {
			writeError(w, http.StatusBadRequest, "items must contain id and updatedAt")
			return
		}
		id, _ := m["id"].(string)
		at, _ := m["updatedAt"].(string)
		if strings.TrimSpace(id) == "" {
			writeError(w, http.StatusBadRequest, "item id is required")
			return
		}
		if strings.TrimSpace(at) == "" {
			writeError(w, http.StatusBadRequest, "item updatedAt is required")
			return
		}
		if _, ok := tokens[id]; !ok {
			writeError(w, http.StatusBadRequest, "Unknown template: "+id)
			return
		}
		if _, dup := seen[id]; dup {
			writeError(w, http.StatusBadRequest, "Duplicate template: "+id)
			return
		}
		if tokens[id] != at {
			writeError(w, http.StatusConflict, "Template was modified by another session")
			return
		}
		seen[id] = struct{}{}
		order = append(order, id)
	}
	now := time.Now().UTC().Format(time.RFC3339Nano)
	tx, err := s.DB.Begin()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	defer tx.Rollback()
	for i, id := range order {
		if _, err := tx.Exec(`UPDATE artifact_templates SET position = ?, updated_at = ? WHERE id = ?`, i, now, id); err != nil {
			writeError(w, http.StatusInternalServerError, "Internal Server Error")
			return
		}
	}
	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	s.listArtifacts(w, r)
}

func (s *Server) resetArtifact(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	body, err, status, msg := readJSONObject(r, 1<<20)
	if err != nil {
		writeError(w, status, msg)
		return
	}
	updatedAt, _ := body["updatedAt"].(string)
	if strings.TrimSpace(updatedAt) == "" {
		writeError(w, http.StatusBadRequest, "updatedAt is required")
		return
	}
	var stored string
	err = s.DB.QueryRow(`SELECT updated_at FROM artifact_templates WHERE id = ?`, id).Scan(&stored)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "Template not found")
		return
	}
	if stored != updatedAt {
		writeError(w, http.StatusConflict, "Template was modified by another session")
		return
	}
	seed, err := loadSeedTemplate(s.Root, id)
	if err != nil {
		writeError(w, http.StatusNotFound, "Unknown template: "+id)
		return
	}
	payload, _ := json.Marshal(seed)
	label, _ := seed["label"].(string)
	baseType, _ := seed["baseType"].(string)
	sum := sha256.Sum256(payload)
	hash := hex.EncodeToString(sum[:])
	now := time.Now().UTC().Format(time.RFC3339Nano)
	res, err := s.DB.Exec(
		`UPDATE artifact_templates SET label = ?, base_type = ?, payload = ?, updated_at = ?, seed_hash = ?
		  WHERE id = ? AND updated_at = ?`,
		label, baseType, string(payload), now, hash, id, updatedAt,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		writeError(w, http.StatusConflict, "Template was modified by another session")
		return
	}
	raw, err := s.loadArtifactJSON(id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(raw)
}

func loadSeedTemplate(root, id string) (map[string]any, error) {
	path := filepath.Join(root, "data", "default-registry.json")
	if os.Getenv("WPW_USE_SHIPPED_REGISTRY") != "1" {
		local := filepath.Join(root, "data", "local", "default-registry.json")
		if _, err := os.Stat(local); err == nil {
			path = local
		}
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var templates []map[string]any
	if err := json.Unmarshal(raw, &templates); err != nil {
		return nil, err
	}
	for _, t := range templates {
		if tid, _ := t["id"].(string); tid == id {
			return t, nil
		}
	}
	return nil, fmt.Errorf("missing")
}

func requireAdmin(w http.ResponseWriter, r *http.Request) bool {
	sess := sessionFrom(r)
	if sess == nil || sess.Role != "admin" {
		writeError(w, http.StatusForbidden, "Forbidden")
		return false
	}
	return true
}

func (s *Server) syncArtifact(w http.ResponseWriter, r *http.Request) {
	if !requireAdmin(w, r) {
		return
	}
	id, ok := parsePositiveID(r.PathValue("id"))
	if !ok {
		writeError(w, http.StatusBadRequest, "Invalid Service ID")
		return
	}
	body, err, status, msg := readJSONObject(r, 1<<20)
	if err != nil {
		writeError(w, status, msg)
		return
	}
	updatedAt, _ := body["updated_at"].(string)
	updatedAt = strings.TrimSpace(updatedAt)
	if updatedAt == "" {
		writeError(w, http.StatusBadRequest, "updated_at is required for concurrent edit protection")
		return
	}
	var current string
	err = s.DB.QueryRow(`SELECT COALESCE(updated_at, created_at) FROM services WHERE id = ?`, id).Scan(&current)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "Service not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if current != updatedAt {
		writeJSON(w, http.StatusConflict, map[string]any{
			"error":      "Conflict: service was modified; refresh and retry",
			"updated_at": current,
		})
		return
	}
	tx, err := s.DB.Begin()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	defer tx.Rollback()
	if _, err := tx.Exec(`DELETE FROM service_registry_snapshots WHERE service_id = ?`, id); err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	rows, err := tx.Query(`SELECT id, label, base_type, payload, updated_at FROM artifact_templates ORDER BY position`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	pos := 0
	for rows.Next() {
		var tid, label, baseType, payload, at string
		if err := rows.Scan(&tid, &label, &baseType, &payload, &at); err != nil {
			rows.Close()
			writeError(w, http.StatusInternalServerError, "Internal Server Error")
			return
		}
		if !plan.AcceptLivePayload(tid, payload) {
			continue
		}
		if _, err := tx.Exec(
			`INSERT INTO service_registry_snapshots
			   (service_id, template_id, position, label, base_type, payload, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`,
			id, tid, pos, label, baseType, payload, at,
		); err != nil {
			rows.Close()
			writeError(w, http.StatusInternalServerError, "Internal Server Error")
			return
		}
		pos++
	}
	rows.Close()
	res, err := tx.Exec(
		`UPDATE services SET updated_at = CURRENT_TIMESTAMP, registry_snapshot_at = CURRENT_TIMESTAMP
		  WHERE id = ? AND COALESCE(updated_at, created_at) = ?`,
		id, updatedAt,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	n, _ := res.RowsAffected()
	if n != 1 {
		writeJSON(w, http.StatusConflict, map[string]any{
			"error":      "Conflict: service was modified; refresh and retry",
			"updated_at": current,
		})
		return
	}
	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	var after string
	_ = s.DB.QueryRow(`SELECT COALESCE(updated_at, created_at) FROM services WHERE id = ?`, id).Scan(&after)
	writeJSON(w, http.StatusOK, map[string]any{
		"message":       "Artifact registry synced",
		"updated_at":    after,
		"templateCount": pos,
	})
}
