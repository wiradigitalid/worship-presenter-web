/** SQLite "now" at sub-second grain (Story 25.2 / AD-6). */
export const STAMP_NOW_SQL = `strftime('%Y-%m-%d %H:%M:%f','now')`;
