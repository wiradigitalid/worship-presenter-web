package httpapi

import "testing"

func TestFormatTimestampKeepsFractionalSeconds(t *testing.T) {
	got := formatTimestamp("2026-08-20 02:38:01.123")
	if got != "2026-08-20 02:38:01.123" {
		t.Fatalf("got %q", got)
	}
}

func TestFormatTimestampSecondGrainUnchanged(t *testing.T) {
	got := formatTimestamp("2026-01-01 00:00:00")
	if got != "2026-01-01 00:00:00" {
		t.Fatalf("got %q", got)
	}
}
