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

func TestFormatTimestamp_PreservesZeroMilliseconds(t *testing.T) {
	input := "2026-08-21 15:44:13.000"
	got := formatTimestamp(input)
	if got != "2026-08-21 15:44:13.000" {
		t.Fatalf("got %q, want %q", got, "2026-08-21 15:44:13.000")
	}
}
