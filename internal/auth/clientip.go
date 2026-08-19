package auth

import (
	"net"
	"net/http"
	"strings"
)

const UnknownClientIP = "unknown"

const (
	maxIPKeyLength            = 64
	maxForwardedHeaderLength  = 1024
)

func ParseClientIP(raw string) string {
	value := strings.TrimSpace(raw)
	if value == "" || len(value) > maxIPKeyLength {
		return ""
	}
	if strings.HasPrefix(value, "[") {
		end := strings.IndexByte(value, ']')
		if end > 1 {
			rest := value[end+1:]
			if rest == "" || strings.HasPrefix(rest, ":") {
				value = value[1:end]
			}
		}
	}
	if host, _, err := net.SplitHostPort(value); err == nil {
		if ip := net.ParseIP(host); ip != nil && ip.To4() != nil {
			value = host
		}
	}
	if i := strings.IndexByte(value, '%'); i != -1 {
		value = value[:i]
	}
	value = strings.ToLower(value)
	ip := net.ParseIP(value)
	if ip == nil {
		return ""
	}
	if v4 := ip.To4(); v4 != nil {
		// Reject leading-zero IPv4 spellings (01.2.3.4) — two buckets for one address.
		parts := strings.Split(value, ".")
		if len(parts) == 4 {
			for _, p := range parts {
				if len(p) > 1 && p[0] == '0' {
					return ""
				}
			}
		}
		return v4.String()
	}
	return ip.String()
}

func ClientIP(r *http.Request) string {
	if cf := ParseClientIP(r.Header.Get("CF-Connecting-IP")); cf != "" {
		return cf
	}
	forwarded := r.Header.Get("X-Forwarded-For")
	if len(forwarded) > maxForwardedHeaderLength {
		forwarded = forwarded[:maxForwardedHeaderLength]
	}
	for _, hop := range strings.Split(forwarded, ",") {
		if parsed := ParseClientIP(hop); parsed != "" {
			return parsed
		}
	}
	if real := ParseClientIP(r.Header.Get("X-Real-IP")); real != "" {
		return real
	}
	return UnknownClientIP
}
