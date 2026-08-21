/**
 * DEC-005 / AD-36 — song-book bootstrap-once semantics.
 *
 * Proves the write-discipline change around `hymns`: the corpus file seeds a
 * book exactly once (marker-gated, insert-only-if-absent), an existing
 * install's rows are never overwritten or resurrected by a boot, and the
 * 5→6 migration stamps markers for books already present. The save-to-book
 * route that ships in the same data_version step is covered by
 * `tests/save-to-book-go-http.test.mjs`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dec005-song-book-test-'));
process.env.DB_PATH = path.join(tmp, 'test.db');
delete process.env.IMAGE_URL_ALLOWLIST;
process.env.WPW_USE_SHIPPED_REGISTRY = '1';

const { getDb, upsertHymns, migrateSongBookBootstrapDec005, songBookBootstrapKey } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'db', 'index.ts')).href
);
const { DATA_VERSION_KEY, CURRENT_DATA_VERSION } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'registry', 'seed.ts')).href
);

const db = getDb();

function hymnCount() {
  return db.prepare(`SELECT COUNT(*) AS n FROM hymns`).get().n;
}

test('fresh boot reaches data_version 8 with the SDAH book bootstrapped', () => {
  const row = db
    .prepare(`SELECT value FROM settings WHERE key = ?`)
    .get(DATA_VERSION_KEY);
  assert.equal(row?.value, String(CURRENT_DATA_VERSION));
  assert.equal(CURRENT_DATA_VERSION, 8);
  const marker = db
    .prepare(`SELECT 1 AS ok FROM settings WHERE key = ?`)
    .get(songBookBootstrapKey('SDAH'));
  assert.ok(marker, 'SDAH bootstrap marker must be stamped after first seed');
  assert.ok(hymnCount() > 0, 'corpus file must have seeded hymn rows');
});

test('a boot never overwrites an edited lyric once the book is bootstrapped', () => {
  db.prepare(
    `UPDATE hymns SET lyrics = 'operator corrected text' WHERE book_code = 'SDAH' AND number = 1`
  ).run();
  upsertHymns(db);
  const row = db
    .prepare(`SELECT lyrics FROM hymns WHERE book_code = 'SDAH' AND number = 1`)
    .get();
  assert.equal(row.lyrics, 'operator corrected text');
});

test('a boot never resurrects a deleted hymn once the book is bootstrapped', () => {
  const before = hymnCount();
  db.prepare(`DELETE FROM hymns WHERE book_code = 'SDAH' AND number = 2`).run();
  upsertHymns(db);
  assert.equal(hymnCount(), before - 1, 'gap must stay a gap after bootstrap');
});

test('an un-bootstrapped book seeds from zero exactly once, gaps included', () => {
  // Simulate a database that has never seen the corpus: no marker, no rows.
  db.prepare(`DELETE FROM settings WHERE key = ?`).run(
    songBookBootstrapKey('SDAH')
  );
  const before = hymnCount();
  db.prepare(`DELETE FROM hymns WHERE book_code = 'SDAH' AND number = 3`).run();
  upsertHymns(db);
  const marker = db
    .prepare(`SELECT 1 AS ok FROM settings WHERE key = ?`)
    .get(songBookBootstrapKey('SDAH'));
  assert.ok(marker, 'bootstrap must stamp its marker');
  assert.equal(hymnCount(), before + 1, 'bootstrap fills the gap exactly once');
  // And a second pass changes nothing further.
  db.prepare(`DELETE FROM hymns WHERE book_code = 'SDAH' AND number = 4`).run();
  upsertHymns(db);
  assert.equal(
    hymnCount(),
    before,
    'post-bootstrap boots must not refill gaps'
  );
});

test('the 5→6 migration stamps markers for books already present and bumps the counter', () => {
  // Simulate a pre-6 database: version back to 5, markers cleared. The
  // migration must re-stamp a marker per present book and land on 6.
  db.prepare(
    `INSERT OR REPLACE INTO settings (key, value) VALUES ('data_version', '5')`
  ).run();
  db.prepare(`DELETE FROM settings WHERE key LIKE 'song_book_bootstrapped_%'`).run();
  const codesBefore = db
    .prepare(`SELECT DISTINCT book_code FROM hymns ORDER BY book_code`)
    .all()
    .map((r) => r.book_code);
  assert.ok(codesBefore.length > 0, 'precondition: at least one book present');

  migrateSongBookBootstrapDec005(db);

  for (const c of codesBefore) {
    const marker = db
      .prepare(`SELECT 1 AS ok FROM settings WHERE key = ?`)
      .get(songBookBootstrapKey(c));
    assert.ok(marker, `marker for ${c} must exist after migration`);
  }
  const version = db
    .prepare(`SELECT value FROM settings WHERE key = ?`)
    .get(DATA_VERSION_KEY);
  assert.equal(version.value, '6');
});

test('the 5→6 migration is a no-op once data_version has reached 6', () => {
  db.prepare(
    `INSERT OR REPLACE INTO settings (key, value) VALUES ('data_version', '6')`
  ).run();
  db.prepare(`DELETE FROM settings WHERE key LIKE 'song_book_bootstrapped_%'`).run();
  migrateSongBookBootstrapDec005(db);
  const markers = db
    .prepare(`SELECT COUNT(*) AS n FROM settings WHERE key LIKE 'song_book_bootstrapped_%'`)
    .get();
  assert.equal(markers.n, 0, 'migration must not run again at version 6');
});
