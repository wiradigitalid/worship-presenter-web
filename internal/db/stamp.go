package db

// StampNowSQL is SQLite "now" at sub-second grain (Story 25.2 / AD-6).
// CURRENT_TIMESTAMP is second grain and lets two edits in the same second both
// pass the optimistic guard.
const StampNowSQL = `strftime('%Y-%m-%d %H:%M:%f','now')`
