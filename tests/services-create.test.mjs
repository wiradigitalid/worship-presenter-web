import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'services-create-test-'));
process.env.DB_PATH = path.join(tmp, 'test.db');

const { getDb } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'db', 'index.ts')).href
);
const { parseRundown } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'parser.ts')).href
);
const { applyStructuredFields, normalizeParsedRundown } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'parsed-fields.ts')).href
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

test('Parser and structured fields work correctly', () => {
  const raw = `SABBATH, JULY 25, 2026
DIVINE SERVICE
Opening Song: SDAH #159
Sermon: Pastor Adam
Closing Prayer: The Speaker`;

  let parsed = parseRundown(raw);
  assert.equal(parsed.date, '2026-07-25');
  assert.equal(parsed.sermon?.speaker, 'Pastor Adam');

  const overlays = {
    sermon: { speaker: 'Pr. Noah', title: '' },
    familyPrayerRequest: 'Pray for the Smiths',
    youthPrayerRequest: 'Youth retreat',
  };
  parsed = applyStructuredFields(parsed, overlays);
  parsed = normalizeParsedRundown(parsed);

  assert.equal(parsed.sermon?.speaker, 'Pr. Noah');
  assert.equal(parsed.familyPrayerRequest, 'Pray for the Smiths');
  assert.equal(parsed.youthPrayerRequest, 'Youth retreat');
});

test('participants_payload column exists', () => {
  const db = getDb();
  const cols = db.prepare(`PRAGMA table_info(services)`).all();
  assert.ok(cols.some((c) => c.name === 'participants_payload'));
});

test('applyStructuredFields clears legacy familyYouth when split prayers set', () => {
  let parsed = parseRundown('SABBATH, JULY 25, 2026\nDIVINE SERVICE\nSDAH #1');
  parsed.familyYouth = 'Legacy combined';
  parsed = applyStructuredFields(parsed, {
    familyPrayerRequest: null,
    youthPrayerRequest: 'Youth only',
  });
  parsed = normalizeParsedRundown(parsed);
  assert.equal(parsed.familyYouth, null);
  assert.equal(parsed.familyPrayerRequest, null);
  assert.equal(parsed.youthPrayerRequest, 'Youth only');
});
