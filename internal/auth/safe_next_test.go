package auth

import "testing"

func TestSafeNextPath(t *testing.T) {
	cases := map[string]string{
		"":           "/",
		"services":   "/",
		"/services":  "/services",
		"//evil":     "/",
		"/ok?x=1":    "/ok?x=1",
		"/a\\b":      "/",
		"/a\nb":      "/",
	}
	for in, want := range cases {
		if got := SafeNextPath(in); got != want {
			t.Errorf("SafeNextPath(%q)=%q want %q", in, got, want)
		}
	}
}
