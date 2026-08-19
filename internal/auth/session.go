package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"os"
	"strings"
	"time"
)

const CookieName = "auth_session"

type Session struct {
	UID  int    `json:"uid"`
	Role string `json:"role"`
	SID  string `json:"sid"`
	TV   int    `json:"tv"`
	Exp  int64  `json:"exp"`
}

func secret() (string, bool) {
	s := strings.TrimSpace(os.Getenv("AUTH_SECRET"))
	if len(s) < 16 {
		return "", false
	}
	return s, true
}

func Verify(token string) *Session {
	if token == "" {
		return nil
	}
	dot := strings.IndexByte(token, '.')
	if dot <= 0 || dot == len(token)-1 {
		return nil
	}
	payloadB64 := token[:dot]
	sigB64 := token[dot+1:]
	sec, ok := secret()
	if !ok {
		return nil
	}
	mac := hmac.New(sha256.New, []byte(sec))
	mac.Write([]byte(payloadB64))
	want := mac.Sum(nil)
	got, err := base64.RawURLEncoding.DecodeString(sigB64)
	if err != nil {
		return nil
	}
	if !hmac.Equal(want, got) {
		return nil
	}
	raw, err := base64.RawURLEncoding.DecodeString(payloadB64)
	if err != nil {
		return nil
	}
	var s Session
	if err := json.Unmarshal(raw, &s); err != nil {
		return nil
	}
	if s.UID <= 0 || (s.Role != "admin" && s.Role != "operator") {
		return nil
	}
	if s.SID == "" || s.TV < 1 || s.Exp <= time.Now().Unix() {
		return nil
	}
	return &s
}
