package auth

import "strings"

// SafeNextPath is the same-origin relative path check used after a gate
// redirect. Blocks protocol-relative and other open redirects.
func SafeNextPath(next string) string {
	if next == "" {
		return "/"
	}
	if !strings.HasPrefix(next, "/") {
		return "/"
	}
	if strings.HasPrefix(next, "//") {
		return "/"
	}
	if strings.ContainsAny(next, "\\\n\r") {
		return "/"
	}
	return next
}
