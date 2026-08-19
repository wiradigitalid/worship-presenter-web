package httpapi

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

var slideTransitions = map[string]struct{}{
	"none": {}, "cut": {}, "fade": {}, "dissolve": {}, "push": {},
}
var uiLocales = map[string]struct{}{"en": {}, "id": {}}

func (s *Server) getSettings(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"pptx_retention_days": s.pptxRetentionDays(),
		"slide_transition":    s.slideTransition(),
		"ui_locale":           s.uiLocale(),
	})
}

func (s *Server) putSettings(w http.ResponseWriter, r *http.Request) {
	body, err, status, msg := readJSONObject(r, 1<<20)
	if err != nil {
		writeError(w, status, msg)
		return
	}
	_, hasDays := body["pptx_retention_days"]
	_, hasTransition := body["slide_transition"]
	_, hasLocale := body["ui_locale"]
	if !hasDays && !hasTransition && !hasLocale {
		writeError(w, http.StatusBadRequest, "Invalid body")
		return
	}
	var days *int
	if hasDays {
		n, ok := asInt(body["pptx_retention_days"])
		if !ok || n < 0 {
			writeError(w, http.StatusBadRequest, "pptx_retention_days must be a non-negative integer")
			return
		}
		days = &n
	}
	var transition *string
	if hasTransition {
		v, _ := body["slide_transition"].(string)
		if _, ok := slideTransitions[v]; !ok {
			writeError(w, http.StatusBadRequest, "slide_transition must be one of: none, cut, fade, dissolve, push")
			return
		}
		transition = &v
	}
	var locale *string
	if hasLocale {
		v, _ := body["ui_locale"].(string)
		if _, ok := uiLocales[v]; !ok {
			writeError(w, http.StatusBadRequest, "ui_locale must be one of: en, id")
			return
		}
		locale = &v
	}
	removed := 0
	if days != nil {
		s.setSetting("pptx_retention_days", strconv.Itoa(*days))
		removed = s.cleanupPptxCache(*days)
	}
	if transition != nil {
		s.setSetting("slide_transition", *transition)
	}
	if locale != nil {
		s.setSetting("ui_locale", *locale)
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"pptx_retention_days": s.pptxRetentionDays(),
		"slide_transition":    s.slideTransition(),
		"ui_locale":           s.uiLocale(),
		"cache_files_removed": removed,
	})
}

func (s *Server) setting(key string) string {
	var v string
	err := s.DB.QueryRow(`SELECT value FROM settings WHERE key = ?`, key).Scan(&v)
	if err != nil {
		return ""
	}
	return v
}

func (s *Server) setSetting(key, value string) {
	_, _ = s.DB.Exec(
		`INSERT INTO settings (key, value) VALUES (?, ?)
		 ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
		key, value,
	)
}

func (s *Server) pptxRetentionDays() int {
	if v := s.setting("pptx_retention_days"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 0 {
			return n
		}
	}
	if v := strings.TrimSpace(os.Getenv("PPTX_RETENTION_DAYS")); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 0 {
			return n
		}
	}
	return 60
}

func (s *Server) slideTransition() string {
	v := s.setting("slide_transition")
	if _, ok := slideTransitions[v]; ok {
		return v
	}
	if v != "" {
		log.Printf(`[settings] ignoring unknown slide_transition %q; falling back to "fade"`, v)
	}
	return "fade"
}

func (s *Server) uiLocale() string {
	v := s.setting("ui_locale")
	if _, ok := uiLocales[v]; ok {
		return v
	}
	if v != "" {
		log.Printf(`[settings] ignoring unknown ui_locale %q; falling back to "en"`, v)
	}
	return "en"
}

func (s *Server) cleanupPptxCache(days int) int {
	if days == 0 {
		return 0
	}
	dir := os.Getenv("PPTX_CACHE_DIR")
	if strings.TrimSpace(dir) == "" {
		dir = filepath.Join(".cache", "pptx")
	}
	entries, err := os.ReadDir(dir)
	if err != nil {
		return 0
	}
	cutoff := time.Now().Add(-time.Duration(days) * 24 * time.Hour)
	removed := 0
	for _, e := range entries {
		if !strings.HasSuffix(e.Name(), ".pptx") {
			continue
		}
		info, err := e.Info()
		if err != nil {
			continue
		}
		if info.ModTime().Before(cutoff) {
			if os.Remove(filepath.Join(dir, e.Name())) == nil {
				removed++
			}
		}
	}
	return removed
}
