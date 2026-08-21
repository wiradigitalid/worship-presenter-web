/**
 * DEC-004 Story 4: Nested Announcement Sets and spine markers.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'announcement-sets-test-'));
process.env.DB_PATH = path.join(tmp, 'test.db');
delete process.env.IMAGE_URL_ALLOWLIST;
process.env.WPW_USE_SHIPPED_REGISTRY = '1';

const { getDb } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'db', 'index.ts')).href
);
const { buildSlidePlan } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'slide-plan.ts')).href
);
const { parseRundown } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'parser.ts')).href
);

const sample = fs.readFileSync(
  path.join(__dirname, 'fixtures', 'sample-rundown.txt'),
  'utf8'
);

test('Announcement Sets and slides can be inserted and spliced into slide plan via ann-set-marker', () => {
  const db = getDb();
  const now = new Date().toISOString();

  // 1. Create announcement set
  const setRes = db
    .prepare(`INSERT INTO announcement_sets (label, updated_at) VALUES (?, ?)`)
    .run('Community Announcements', now);
  const setId = Number(setRes.lastInsertRowid);

  // 2. Insert two slides into announcement set
  const slidePayload1 = JSON.stringify({
    schemaVersion: 1,
    label: 'Youth Camp Flyer',
    baseType: 'general',
    placeholders: [],
    layouts: {
      default: {
        aspectRatio: '16:9',
        backgroundColor: '#123456',
        elements: [],
      },
    },
  });
  const slidePayload2 = JSON.stringify({
    schemaVersion: 1,
    label: 'Prayer Night Flyer',
    baseType: 'general',
    placeholders: [],
    layouts: {
      default: {
        aspectRatio: '16:9',
        backgroundColor: '#654321',
        elements: [],
      },
    },
  });

  const s1Res = db
    .prepare(
      `INSERT INTO announcement_set_slides (ann_set_id, label, payload, updated_at, position)
       VALUES (?, ?, ?, ?, 0)`
    )
    .run(setId, 'Youth Camp Flyer', slidePayload1, now);
  const s1Id = Number(s1Res.lastInsertRowid);

  const s2Res = db
    .prepare(
      `INSERT INTO announcement_set_slides (ann_set_id, label, payload, updated_at, position)
       VALUES (?, ?, ?, ?, 1)`
    )
    .run(setId, 'Prayer Night Flyer', slidePayload2, now);
  const s2Id = Number(s2Res.lastInsertRowid);

  // 3. Insert ann-set-marker into artifact_templates
  db.prepare(
    `INSERT INTO artifact_templates (id, label, base_type, payload, updated_at, position, ann_set_id)
     VALUES (?, ?, 'ann-set-marker', NULL, ?, 25, ?)`
  ).run('ann-marker-test', 'Announcements Block', now, setId);

  // 4. Build slide plan and verify both slides are spliced at the marker position
  const parsed = parseRundown(sample);
  const plan = buildSlidePlan('2026-08-22', parsed, []);

  const slide1Instance = plan.find((s) => s.id === `ann-slide-${s1Id}`);
  const slide2Instance = plan.find((s) => s.id === `ann-slide-${s2Id}`);

  assert.ok(slide1Instance, 'first announcement set slide must be spliced in plan');
  assert.ok(slide2Instance, 'second announcement set slide must be spliced in plan');
  assert.equal(slide1Instance?.title, 'Youth Camp Flyer');
  assert.equal(slide2Instance?.title, 'Prayer Night Flyer');

  // Verify slide order in plan: slide 1 comes before slide 2
  const idx1 = plan.findIndex((s) => s.id === `ann-slide-${s1Id}`);
  const idx2 = plan.findIndex((s) => s.id === `ann-slide-${s2Id}`);
  assert.ok(idx1 < idx2, 'slides in set must follow position order');
});
