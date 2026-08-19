package auth

import "testing"

func TestHashVerifyRoundTrip(t *testing.T) {
	hash, err := HashPassword("bootstrap-pass-99")
	if err != nil {
		t.Fatal(err)
	}
	if !VerifyPassword("bootstrap-pass-99", hash) {
		t.Fatal("expected match")
	}
	if VerifyPassword("wrong-password", hash) {
		t.Fatal("expected mismatch")
	}
}

func TestVerifyDummyHashFails(t *testing.T) {
	if VerifyPassword("anything-long-enough", DummyHash) {
		t.Fatal("dummy hash must never verify")
	}
}
