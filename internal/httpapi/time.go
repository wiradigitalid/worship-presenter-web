package httpapi

import (
	"fmt"
	"strings"
	"time"
)

const sqliteSecond = "2006-01-02 15:04:05"

func formatTimestamp(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return raw
	}
	layouts := []string{
		time.RFC3339Nano,
		time.RFC3339,
		"2006-01-02 15:04:05.999999999",
		"2006-01-02 15:04:05",
		"2006-01-02T15:04:05.999999999",
		"2006-01-02T15:04:05",
	}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, raw); err == nil {
			return formatUnixStamp(t.UTC())
		}
	}
	s := strings.ReplaceAll(raw, "T", " ")
	s = strings.TrimSuffix(s, "Z")
	return s
}

func formatUnixStamp(t time.Time) string {
	t = t.UTC()
	if t.Nanosecond() == 0 {
		return t.Format(sqliteSecond)
	}
	ms := t.Nanosecond() / 1e6
	return t.Format(sqliteSecond) + fmt.Sprintf(".%03d", ms)
}
