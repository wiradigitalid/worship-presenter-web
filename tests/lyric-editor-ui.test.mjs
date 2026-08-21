import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'story-7-test-'));
process.env.DB_PATH = path.join(tmp, 'test.db');
process.env.WPW_USE_SHIPPED_REGISTRY = '1';

const { getDb } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'db', 'index.ts')).href
);
const { songSetsToPayload, buildFieldsPayload } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'worship-form-fields.ts')).href
);

before(() => {
  getDb();
});

after(() => {
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    // ignore
  }
});

test('1. songSetsToPayload carries lyricText override for service only', () => {
  const inputs = {
    opening_song_bt: {
      songNumber: '159',
      songBookCode: 'SDAH',
      background: '',
      lyricText: 'Custom verse 1\n\nCustom verse 2',
    },
    closing_song_bt: {
      songNumber: '447',
      songBookCode: '',
      background: '/assets/bg.jpg',
      lyricText: '',
    },
  };

  const payload = songSetsToPayload(inputs);
  assert.equal(payload.opening_song_bt.songNumber, 159);
  assert.equal(payload.opening_song_bt.songBookCode, 'SDAH');
  assert.equal(payload.opening_song_bt.lyricText, 'Custom verse 1\n\nCustom verse 2');

  assert.equal(payload.closing_song_bt.songNumber, 447);
  assert.equal(payload.closing_song_bt.songBookCode, null);
  assert.equal(payload.closing_song_bt.background, '/assets/bg.jpg');
  assert.equal(payload.closing_song_bt.lyricText, null);
});

test('2. buildFieldsPayload embeds songSets with lyricText overrides', () => {
  const fields = {
    songSets: {
      opening_song_bt: {
        songNumber: '159',
        songBookCode: 'SDAH',
        background: '',
        lyricText: 'Edited lyrics line 1',
      },
    },
    verseReference: '',
    verseText: '',
    verseTranslation: '',
    sermonSpeaker: '',
    specialSong: '',
    closingPrayerPerson: '',
    familyPrayerRequest: '',
    youthPrayerRequest: '',
  };

  const built = buildFieldsPayload(fields);
  assert.ok(built.songSets.opening_song_bt);
  assert.equal(built.songSets.opening_song_bt.lyricText, 'Edited lyrics line 1');
});

test('3. Service-level override vs Hymns row isolation (BR-7 / UC-28)', () => {
  const db = getDb();
  
  // Hymn 159 lyrics before
  const originalHymn = db
    .prepare(`SELECT lyrics FROM hymns WHERE book_code = 'SDAH' AND number = 159`)
    .get();
  assert.ok(originalHymn?.lyrics);

  // Create a dummy service first to satisfy FK
  const svc = db
    .prepare(`INSERT INTO services (date, raw_payload) VALUES ('2026-08-21', 'test')`)
    .run();
  const serviceId = Number(svc.lastInsertRowid);

  // Inserting service lyric override into song_set_inputs
  db.prepare(`
    INSERT INTO song_set_inputs (service_id, variable_name, song_number, lyric_override, updated_at)
    VALUES (?, 'opening_song_bt', 159, 'Service specific override', '2026-08-21T00:00:00Z')
  `).run(serviceId);

  const serviceRow = db
    .prepare(`SELECT lyric_override FROM song_set_inputs WHERE service_id = ? AND variable_name = 'opening_song_bt'`)
    .get(serviceId);
  assert.equal(serviceRow.lyric_override, 'Service specific override');

  // Verify Song Book table hymns row remains untouched
  const hymnAfter = db
    .prepare(`SELECT lyrics FROM hymns WHERE book_code = 'SDAH' AND number = 159`)
    .get();
  assert.equal(hymnAfter.lyrics, originalHymn.lyrics);
});
