package httpapi

import (
	"strings"
	"time"
)

const sqliteTS = "2006-01-02 15:04:05"

func formatTimestamp(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return raw
	}
	layouts := []string{
		time.RFC3339,
		time.RFC3339Nano,
		"2006-01-02 15:04:05",
		"2006-01-02T15:04:05Z",
		"2006-01-02T15:04:05",
	}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, raw); err == nil {
			return t.UTC().Format(sqliteTS)
		}
	}
	s := strings.ReplaceAll(raw, "T", " ")
	s = strings.TrimSuffix(s, "Z")
	if i := strings.Index(s, "."); i >= 0 {
		s = s[:i]
	}
	if len(s) >= 19 {
		return s[:19]
	}
	return raw
}
