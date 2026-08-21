/**
 * DEC-004 Story 6: Background Library CRUD, song_set_inputs.background_id wiring,
 * live presenter background override (AD-34), and blank Verse/Reff canvas rule (AD-33).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'story-6-test-'));
process.env.DB_PATH = path.join(tmp, 'test.db');
delete process.env.IMAGE_URL_ALLOWLIST;
process.env.WPW_USE_SHIPPED_REGISTRY = '1';

const { getDb } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'db', 'index.ts')).href
);
const {
  liveBackgroundOf,
  adoptsSharedState,
} = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'present-channel.ts')).href
);
const { validateSongSetLayout, RegistryValidationError } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'registry', 'validate.ts')).href
);
const { songSetsToPayload } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'worship-form-fields.ts')).href
);

test('1. background_library_images table supports CRUD and single default invariant', () => {
  const db = getDb();
  const now = new Date().toISOString();

  // Insert two images
  const res1 = db
    .prepare(
      `INSERT INTO background_library_images (url, is_default, created_at, updated_at)
       VALUES (?, 1, ?, ?)`
    )
    .run('/assets/welcome-bg.png', now, now);
  const id1 = Number(res1.lastInsertRowid);

  const res2 = db
    .prepare(
      `INSERT INTO background_library_images (url, is_default, created_at, updated_at)
       VALUES (?, 0, ?, ?)`
    )
    .run('/assets/closing-prayer-bg.png', now, now);
  const id2 = Number(res2.lastInsertRowid);

  const rows = db
    .prepare(`SELECT id, url, is_default FROM background_library_images ORDER BY id ASC`)
    .all();
  assert.equal(rows.length >= 2, true);

  const img1 = rows.find((r) => r.id === id1);
  const img2 = rows.find((r) => r.id === id2);
  assert.equal(img1.is_default, 1);
  assert.equal(img2.is_default, 0);

  // Set img2 as default, unsetting img1
  db.prepare(`UPDATE background_library_images SET is_default = 0 WHERE id != ?`).run(id2);
  db.prepare(`UPDATE background_library_images SET is_default = 1 WHERE id = ?`).run(id2);

  const updatedImg1 = db.prepare(`SELECT is_default FROM background_library_images WHERE id = ?`).get(id1);
  const updatedImg2 = db.prepare(`SELECT is_default FROM background_library_images WHERE id = ?`).get(id2);
  assert.equal(updatedImg1.is_default, 0);
  assert.equal(updatedImg2.is_default, 1);
});

test('2. song_set_inputs wiring serializes background field', () => {
  const payload = songSetsToPayload({
    opening_song_bt: {
      songNumber: '123',
      songBookCode: 'SDAH',
      background: '/assets/welcome-bg.png',
      lyricText: '',
    },
    closing_song_bt: {
      songNumber: '456',
      songBookCode: 'SDAH',
      background: '',
      lyricText: '',
    },
  });

  assert.equal(payload.opening_song_bt.background, '/assets/welcome-bg.png');
  assert.equal(payload.closing_song_bt.background, null);
});

test('3. Live presenter background override wire contract (AD-34)', () => {
  // sync message with background override
  const syncMsg = {
    type: 'sync',
    index: 5,
    blank: false,
    transition: 'fade',
    background: '/assets/custom-bg.jpg',
    planIdentity: 'plan-123',
  };
  assert.equal(liveBackgroundOf(syncMsg), '/assets/custom-bg.jpg');
  assert.equal(adoptsSharedState(syncMsg, 'plan-123'), true);

  // live background message
  const bgMsg = {
    type: 'background',
    background: '/assets/live-bg.jpg',
    planIdentity: 'plan-123',
  };
  assert.equal(liveBackgroundOf(bgMsg), '/assets/live-bg.jpg');
  assert.equal(adoptsSharedState(bgMsg, 'plan-123'), true);
  assert.equal(adoptsSharedState(bgMsg, 'other-plan'), false);

  // message without background says undefined
  const blankMsg = {
    type: 'blank',
    blank: true,
    planIdentity: 'plan-123',
  };
  assert.equal(liveBackgroundOf(blankMsg), undefined);
});

test('4. AD-33 blank Verse/Reff canvas rule enforcement', () => {
  // Title layout allows background image
  const validTitle = validateSongSetLayout(
    {
      aspectRatio: '16:9',
      backgroundColor: '#000000',
      backgroundImage: '/assets/welcome-bg.png',
      elements: [],
    },
    'title'
  );
  assert.equal(validTitle.backgroundImage, '/assets/welcome-bg.png');

  // Verse layout with backgroundImage throws
  assert.throws(
    () => {
      validateSongSetLayout(
        {
          aspectRatio: '16:9',
          backgroundColor: '#000000',
          backgroundImage: '/assets/welcome-bg.png',
          elements: [],
        },
        'verse'
      );
    },
    (err) => err instanceof RegistryValidationError && err.message.includes('must not set a background image')
  );

  // Reff layout with image element throws
  assert.throws(
    () => {
      validateSongSetLayout(
        {
          aspectRatio: '16:9',
          backgroundColor: '#000000',
          elements: [
            {
              id: 'el-img',
              type: 'image',
              x: 0,
              y: 0,
              w: 10,
              h: 10,
              zIndex: 1,
              required: false,
              imageRef: '/assets/welcome-bg.png',
            },
          ],
        },
        'reff'
      );
    },
    (err) => err instanceof RegistryValidationError && err.message.includes('must not set a background image')
  );

  // Valid blank verse canvas
  const validVerse = validateSongSetLayout(
    {
      aspectRatio: '16:9',
      backgroundColor: '#000000',
      elements: [
        {
          id: 'v1',
          type: 'text',
          x: 10,
          y: 10,
          w: 80,
          h: 40,
          zIndex: 1,
          required: true,
          content: 'Verse lyrics',
        },
      ],
    },
    'verse'
  );
  assert.equal(validVerse.backgroundColor, '#000000');
  assert.equal(validVerse.backgroundImage, undefined);
});
