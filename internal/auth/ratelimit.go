package auth

import (
	"database/sql"
	"strings"
	"time"
	"unicode"
)

const (
	RateLimitWindowSeconds = 15 * 60
	PairFailureThreshold   = 5
	IPFailureThreshold     = 20
	MaxLoginAttemptRows    = 5000
	maxKeyLength           = 128
)

const pairSeparator = '\x1f'

type RateLimitResult struct {
	Limited           bool
	RetryAfterSeconds int
}

func nowSeconds() int64 {
	return time.Now().Unix()
}

func usernameKey(username string) string {
	s := strings.ToLower(strings.TrimSpace(username))
	s = strings.Map(func(r rune) rune {
		if r == pairSeparator {
			return -1
		}
		if unicode.IsSpace(r) && r != ' ' {
			return r
		}
		return r
	}, s)
	if len(s) > maxKeyLength {
		s = s[:maxKeyLength]
	}
	return s
}

func pairKey(user, ip string) string {
	return user + string(pairSeparator) + ip
}

func isThrottleable(ip string) bool {
	return ip != "" && ip != UnknownClientIP
}

func PruneLoginAttempts(db *sql.DB) {
	cutoff := nowSeconds() - RateLimitWindowSeconds
	_, _ = db.Exec(`DELETE FROM login_attempts WHERE attempted_at < ?`, cutoff)
	var n int
	if err := db.QueryRow(`SELECT COUNT(*) FROM login_attempts`).Scan(&n); err != nil {
		return
	}
	if n <= MaxLoginAttemptRows {
		return
	}
	_, _ = db.Exec(
		`DELETE FROM login_attempts
		   WHERE id NOT IN (
		     SELECT id FROM login_attempts
		      ORDER BY attempted_at DESC, id DESC
		      LIMIT ?
		   )`,
		MaxLoginAttemptRows,
	)
}

func RecordLoginFailure(db *sql.DB, username, ip string) {
	if !isThrottleable(ip) {
		return
	}
	user := usernameKey(username)
	if user == "" {
		return
	}
	at := nowSeconds()
	tx, err := db.Begin()
	if err != nil {
		return
	}
	defer tx.Rollback()
	_, err = tx.Exec(`INSERT INTO login_attempts (scope, key, attempted_at) VALUES (?, ?, ?)`,
		"user-ip", pairKey(user, ip), at)
	if err != nil {
		return
	}
	_, err = tx.Exec(`INSERT INTO login_attempts (scope, key, attempted_at) VALUES (?, ?, ?)`,
		"ip", ip, at)
	if err != nil {
		return
	}
	_ = tx.Commit()
}

func ClearLoginFailures(db *sql.DB, username, ip string) {
	if !isThrottleable(ip) {
		return
	}
	user := usernameKey(username)
	if user == "" {
		return
	}
	tx, err := db.Begin()
	if err != nil {
		return
	}
	defer tx.Rollback()
	_, _ = tx.Exec(`DELETE FROM login_attempts WHERE scope = 'user-ip' AND key = ?`, pairKey(user, ip))
	_, _ = tx.Exec(`DELETE FROM login_attempts WHERE scope = 'ip' AND key = ?`, ip)
	_ = tx.Commit()
}

func evaluateScope(db *sql.DB, scope, key string, threshold int, now int64) RateLimitResult {
	var n int
	var oldest sql.NullInt64
	err := db.QueryRow(
		`SELECT COUNT(*), MIN(attempted_at)
		   FROM login_attempts
		  WHERE scope = ? AND key = ? AND attempted_at >= ?`,
		scope, key, now-RateLimitWindowSeconds,
	).Scan(&n, &oldest)
	if err != nil || n < threshold || !oldest.Valid {
		return RateLimitResult{}
	}
	retry := RateLimitWindowSeconds
	if v := int(oldest.Int64 + RateLimitWindowSeconds - now); v > retry {
		retry = RateLimitWindowSeconds
	} else if v < 1 {
		retry = 1
	} else {
		retry = v
	}
	return RateLimitResult{Limited: true, RetryAfterSeconds: retry}
}

func CheckLoginRateLimit(db *sql.DB, username, ip string) RateLimitResult {
	PruneLoginAttempts(db)
	if !isThrottleable(ip) {
		return RateLimitResult{}
	}
	now := nowSeconds()
	user := usernameKey(username)
	if user != "" {
		if byPair := evaluateScope(db, "user-ip", pairKey(user, ip), PairFailureThreshold, now); byPair.Limited {
			return byPair
		}
	}
	return evaluateScope(db, "ip", ip, IPFailureThreshold, now)
}
