#!/usr/bin/env python3
"""One-shot dev auth recovery: clear login_attempts and reset admin password."""
import os
import sqlite3
import sys

DB_PATH = os.environ.get("DB_PATH", "/var/lib/presenter-dev/data.db")
USERNAME = os.environ.get("AUTH_USERNAME", "admin")
PASSWORD_HASH = os.environ.get("PASSWORD_HASH")
if not PASSWORD_HASH:
    hash_file = os.environ.get("PASSWORD_HASH_FILE")
    if not hash_file:
        print("PASSWORD_HASH or PASSWORD_HASH_FILE required", file=sys.stderr)
        sys.exit(1)
    with open(hash_file, encoding="utf-8") as f:
        PASSWORD_HASH = f.read().strip()

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("SELECT id, username, role FROM accounts WHERE username = ?", (USERNAME,))
row = cur.fetchone()
if not row:
    cur.execute("SELECT username FROM accounts ORDER BY id")
    known = [r[0] for r in cur.fetchall()]
    print(f"No account named {USERNAME!r}. Known: {known}", file=sys.stderr)
    sys.exit(1)

account_id, username, role = row
print(f"Account: {username} ({role})")

cur.execute("DELETE FROM login_attempts")
cleared = cur.rowcount
print(f"Cleared {cleared} login_attempts row(s)")

cur.execute(
    "UPDATE accounts SET password_hash = ?, token_version = token_version + 1 WHERE id = ?",
    (PASSWORD_HASH, account_id),
)
conn.commit()
print("Password hash updated; sessions revoked.")
conn.close()
