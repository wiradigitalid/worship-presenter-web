package auth

import (
	"database/sql"
)

type Account struct {
	ID            int
	Role          string
	TokenVersion  int
}

func LookupAccount(db *sql.DB, uid int) (*Account, error) {
	row := db.QueryRow(
		`SELECT id, role, token_version FROM accounts WHERE id = ?`,
		uid,
	)
	var a Account
	if err := row.Scan(&a.ID, &a.Role, &a.TokenVersion); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &a, nil
}

func SessionRevoked(db *sql.DB, sid string) (bool, error) {
	var n int
	err := db.QueryRow(`SELECT COUNT(*) FROM revoked_sessions WHERE sid = ?`, sid).Scan(&n)
	if err != nil {
		return false, err
	}
	return n > 0, nil
}

func ValidateAgainstDB(db *sql.DB, s *Session) (*Session, error) {
	acct, err := LookupAccount(db, s.UID)
	if err != nil {
		return nil, err
	}
	if acct == nil {
		return nil, nil
	}
	if acct.Role != s.Role {
		return nil, nil
	}
	if acct.TokenVersion != s.TV {
		return nil, nil
	}
	revoked, err := SessionRevoked(db, s.SID)
	if err != nil {
		return nil, err
	}
	if revoked {
		return nil, nil
	}
	out := *s
	out.Role = acct.Role
	out.TV = acct.TokenVersion
	return &out, nil
}
