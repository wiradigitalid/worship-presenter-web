package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"fmt"
	"strings"

	"golang.org/x/crypto/scrypt"
)

// Node crypto.scryptSync defaults: N=16384, r=8, p=1, keylen=64.
const (
	scryptN      = 16384
	scryptR      = 8
	scryptP      = 1
	scryptKeyLen = 64
	saltLen      = 16
	MaxPassword  = 128
	MinPassword  = 8
)

// DummyHash is a well-formed saltHex$hashHex so a missing username still runs scrypt.
const DummyHash = "00000000000000000000000000000000$" +
	"0000000000000000000000000000000000000000000000000000000000000000" +
	"0000000000000000000000000000000000000000000000000000000000000000"

func HashPassword(password string) (string, error) {
	if password == "" {
		return "", fmt.Errorf("Password must be non-empty")
	}
	salt := make([]byte, saltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	hash, err := scrypt.Key([]byte(password), salt, scryptN, scryptR, scryptP, scryptKeyLen)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(salt) + "$" + hex.EncodeToString(hash), nil
}

func VerifyPassword(password, stored string) bool {
	if password == "" || stored == "" {
		return false
	}
	saltHex, hashHex, ok := strings.Cut(stored, "$")
	if !ok || saltHex == "" || hashHex == "" {
		return false
	}
	salt, err := hex.DecodeString(saltHex)
	if err != nil || len(salt) == 0 {
		return false
	}
	expected, err := hex.DecodeString(hashHex)
	if err != nil || len(expected) == 0 {
		return false
	}
	actual, err := scrypt.Key([]byte(password), salt, scryptN, scryptR, scryptP, len(expected))
	if err != nil {
		return false
	}
	return subtle.ConstantTimeCompare(actual, expected) == 1
}
