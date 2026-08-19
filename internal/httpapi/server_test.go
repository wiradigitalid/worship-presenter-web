package httpapi

import "testing"

func TestSpaIndexName(t *testing.T) {
	cases := []struct {
		path string
		want string
	}{
		{"/", "index.html"},
		{"/login", "index.html"},
		{"/services/1", "index.html"},
		{"/services/1/present", "index.html"},
		{"/services/1/slideshow", "projected.html"},
		{"/services/1/present/projector", "projected.html"},
	}
	for _, tc := range cases {
		if got := spaIndexName(tc.path); got != tc.want {
			t.Errorf("spaIndexName(%q) = %q, want %q", tc.path, got, tc.want)
		}
	}
}
