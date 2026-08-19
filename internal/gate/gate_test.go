package gate

import "testing"

func TestGatedPaths(t *testing.T) {
	gated := []string{
		"/",
		"/services",
		"/services/1",
		"/services/1/present",
		"/services/1/present/projector",
		"/services/1/slideshow",
		"/services/new",
		"/admin",
		"/admin/artifacts",
		"/announcements",
		"/api/services",
		"/api/services/1",
		"/api/services/1/sync-artifact",
		"/api/services/1/pptx",
		"/api/admin/accounts",
		"/api/admin/accounts/1",
		"/api/admin/artifacts/template-id",
		"/api/admin/artifacts/order",
		"/api/uploads/x.jpg",
		"/api/uploads/0123456789abcdef0123456789abcdef.jpg",
		"/api/hymns",
		"/api/scripture",
		"/_next/staticfoo",
		"/_next/imagefoo",
		"/loginfoo",
		"/logins",
		"/assetsfoo",
		"/api/webhookfoo",
		"/api/auth/loginfoo",
		"/api/auth/logoutfoo",
		"/favicon.ico.map",
	}
	for _, p := range gated {
		if !IsGated(p) {
			t.Errorf("%s must be gated", p)
		}
	}
}

func TestExemptPaths(t *testing.T) {
	exempt := []string{
		"/api/webhook",
		"/api/webhook/telegram",
		"/api/auth/login",
		"/api/auth/logout",
		"/login",
		"/login/",
		"/_next/static/x.js",
		"/_next/static/chunks/main.js",
		"/_next/image",
		"/favicon.ico",
		"/assets/welcome-bg.jpg",
	}
	for _, p := range exempt {
		if IsGated(p) {
			t.Errorf("%s must be exempt", p)
		}
	}
}
