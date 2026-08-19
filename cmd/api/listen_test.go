package main

import "testing"

func TestListenAddrDefaultIsLoopback(t *testing.T) {
	t.Setenv("PORT", "")
	t.Setenv("LISTEN_HOST", "")
	if got := listenAddr(); got != "127.0.0.1:3000" {
		t.Fatalf("default listen %q, want 127.0.0.1:3000", got)
	}
}

func TestListenAddrPortOverride(t *testing.T) {
	t.Setenv("PORT", "4000")
	t.Setenv("LISTEN_HOST", "")
	if got := listenAddr(); got != "127.0.0.1:4000" {
		t.Fatalf("got %q", got)
	}
}

func TestListenAddrHostOverride(t *testing.T) {
	t.Setenv("PORT", "3000")
	t.Setenv("LISTEN_HOST", "0.0.0.0")
	if got := listenAddr(); got != "0.0.0.0:3000" {
		t.Fatalf("got %q", got)
	}
}
