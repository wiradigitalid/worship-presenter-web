package auth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"
)

const CookieName = "auth_session"
const SessionTTLSeconds = 60 * 60 * 24 * 7

var sidPattern = regexp.MustCompile(`^[A-Za-z0-9_-]{8,128}$`)

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

func SecretOK() (string, bool) {
	return secret()
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
	if !sidPattern.MatchString(s.SID) || s.TV < 1 || s.Exp <= time.Now().Unix() {
		return nil
	}
	return &s
}

func GenerateSID() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func Sign(uid int, role string, tv int) (string, error) {
	if role != "admin" && role != "operator" {
		return "", fmt.Errorf("signSession: invalid role")
	}
	if tv < 1 {
		return "", fmt.Errorf("signSession: tv must be an integer >= 1")
	}
	sid, err := GenerateSID()
	if err != nil {
		return "", err
	}
	return SignPayload(Session{
		UID:  uid,
		Role: role,
		SID:  sid,
		TV:   tv,
		Exp:  time.Now().Unix() + SessionTTLSeconds,
	})
}

func SignPayload(s Session) (string, error) {
	if !sidPattern.MatchString(s.SID) {
		return "", fmt.Errorf("signSession: sid is not a valid session id")
	}
	if s.TV < 1 {
		return "", fmt.Errorf("signSession: tv must be an integer >= 1")
	}
	sec, ok := secret()
	if !ok {
		return "", fmt.Errorf("AUTH_SECRET is not configured")
	}
	raw, err := json.Marshal(s)
	if err != nil {
		return "", err
	}
	payloadB64 := base64.RawURLEncoding.EncodeToString(raw)
	mac := hmac.New(sha256.New, []byte(sec))
	mac.Write([]byte(payloadB64))
	sigB64 := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	return payloadB64 + "." + sigB64, nil
}

func CookieSecure() bool {
	return os.Getenv("NODE_ENV") == "production"
}

func SetSessionCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     CookieName,
		Value:    token,
		Path:     "/",
		MaxAge:   SessionTTLSeconds,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   CookieSecure(),
	})
}

func ClearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     CookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   CookieSecure(),
	})
}
