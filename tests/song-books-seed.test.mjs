/**
 * Tests for seedSongBooks (bootstrap seed of song_books registry row).
 *
 * Covers:
 * - Fresh database: SDAH row exists with metadata and is_default = 1
 * - Existing database with hymns and marker stamped, song_books empty: SDAH row appears anyway
 * - Another book is already is_default = 1: SDAH gets is_default = 0, other book untouched
 * - Admin-edited SDAH row survives next boot without overwrite
 * - Booting twice produces exactly 1 SDAH row
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'song-books-seed-test-'));
process.env.DB_PATH = path.join(tmp, 'test.db');
delete process.env.IMAGE_URL_ALLOWLIST;
process.env.WPW_USE_SHIPPED_REGISTRY = '1';

const { getDb, seedSongBooks, songBookBootstrapKey } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'db', 'index.ts')).href
);

const db = getDb();

test('fresh boot creates SDAH song_books row with corpus metadata and is_default = 1', () => {
  const row = db
    .prepare(
      `SELECT book_code, name, locale, licence, provenance, is_default
       FROM song_books
       WHERE book_code = 'SDAH'`
    )
    .get();

  assert.ok(row, 'SDAH row must exist in song_books');
  assert.equal(row.name, 'The Seventh-day Adventist Hymnal');
  assert.equal(row.locale, 'en');
  assert.match(row.licence, /An accepted risk recorded by the repository owner/);
  assert.match(row.provenance, /The Seventh-day Adventist Hymnal © 1985/);
  assert.equal(row.is_default, 1, 'first book must become default');
});

test('existing database with hymns and bootstrap marker stamped heals missing song_books row on boot', () => {
  // Simulate an existing database that has hymns and marker stamped, but song_books empty
  db.prepare(`DELETE FROM song_books`).run();
  db.prepare(
    `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`
  ).run(songBookBootstrapKey('SDAH'), '1');

  const before = db.prepare(`SELECT COUNT(*) AS count FROM song_books`).get();
  assert.equal(before.count, 0);

  // Run seedSongBooks (mirrors boot)
  seedSongBooks(db);

  const after = db
    .prepare(
      `SELECT book_code, name, locale, licence, provenance, is_default
       FROM song_books
       WHERE book_code = 'SDAH'`
    )
    .get();

  assert.ok(after, 'SDAH row must heal and appear on boot despite marker stamped');
  assert.equal(after.name, 'The Seventh-day Adventist Hymnal');
  assert.equal(after.locale, 'en');
  assert.equal(after.is_default, 1);
});

test('when another book is already default, SDAH is seeded with is_default = 0', () => {
  db.prepare(`DELETE FROM song_books`).run();
  db.prepare(`
    INSERT INTO song_books (book_code, name, locale, licence, provenance, is_default, updated_at)
    VALUES ('OTHER', 'Other Book', 'en', 'lic', 'prov', 1, '2026-08-20T00:00:00.000Z')
  `).run();

  seedSongBooks(db);

  const sdah = db
    .prepare(`SELECT is_default FROM song_books WHERE book_code = 'SDAH'`)
    .get();
  const other = db
    .prepare(`SELECT is_default FROM song_books WHERE book_code = 'OTHER'`)
    .get();

  assert.equal(sdah?.is_default, 0, 'SDAH must not take over default if one already exists');
  assert.equal(other?.is_default, 1, 'Existing default must remain untouched');

  const totalDefaults = db
    .prepare(`SELECT COUNT(*) AS count FROM song_books WHERE is_default = 1`)
    .get();
  assert.equal(totalDefaults.count, 1, 'Exactly one default must exist');
});

test('an administrator-edited SDAH row is not overwritten on next boot', () => {
  db.prepare(`
    UPDATE song_books
    SET name = 'Admin Custom Title', licence = 'Custom Licence'
    WHERE book_code = 'SDAH'
  `).run();

  // Run seed again
  seedSongBooks(db);

  const row = db
    .prepare(`SELECT name, licence FROM song_books WHERE book_code = 'SDAH'`)
    .get();

  assert.equal(row?.name, 'Admin Custom Title');
  assert.equal(row?.licence, 'Custom Licence');
});

test('booting / seeding twice produces exactly one SDAH row', () => {
  seedSongBooks(db);
  seedSongBooks(db);

  const row = db
    .prepare(`SELECT COUNT(*) AS count FROM song_books WHERE book_code = 'SDAH'`)
    .get();

  assert.equal(row?.count, 1, 'Exactly one SDAH row must exist');
});
