/**
 * DEC-004 Story 8: Copy/paste share-by-reference (BR-12).
 *
 * 1. Deep copies text/shape/style/geometry/tokens verbatim into a new row in target list.
 * 2. Image URLs are shared byte-for-byte by reference without duplication or re-upload.
 * 3. Deleting a slide (source or copy) never cascades or deletes shared images.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'copy-paste-test-'));
process.env.DB_PATH = path.join(tmp, 'test.db');
process.env.WPW_USE_SHIPPED_REGISTRY = '1';

const { getDb } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'db', 'index.ts')).href
);
const {
  getArtifactTemplate,
  copySlideTemplate,
  deleteArtifactTemplate,
} = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'registry', 'store.ts')).href
);
const { deleteService } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'services', 'queries.ts')).href
);

test('BR-12: Copying a slide within Main duplicates text/shapes and shares image references', () => {
  const db = getDb();

  // Create a template with text, shape, and image reference
  const sourcePayload = {
    schemaVersion: 1,
    id: 'source-welcome-slide',
    label: 'Source Welcome Slide',
    baseType: 'general',
    placeholders: [],
    layouts: {
      default: {
        aspectRatio: '16:9',
        backgroundColor: '#123456',
        backgroundImage: '/api/uploads/0123456789abcdef0123456789abcdef.jpg',
        elements: [
          {
            id: 'e1',
            type: 'text',
            required: false,
            x: 10,
            y: 20,
            w: 80,
            h: 30,
            zIndex: 0,
            content: 'Welcome {date}',
            style: {
              fontFamily: 'Arial',
              fontSize: 32,
              fontColor: '#FFFFFF',
              fontWeight: 'bold',
              textAlign: 'center',
            },
          },
          {
            id: 'e2',
            type: 'shape',
            required: false,
            x: 5,
            y: 5,
            w: 90,
            h: 90,
            zIndex: 1,
            style: {
              fillColor: '#FF0000',
              opacity: 0.5,
            },
          },
          {
            id: 'e3',
            type: 'image',
            required: false,
            x: 50,
            y: 50,
            w: 40,
            h: 40,
            zIndex: 2,
            imageRef: '/api/uploads/fedcba9876543210fedcba9876543210.png',
          },
        ],
      },
    },
  };

  const count = (
    db.prepare(`SELECT COUNT(*) AS n FROM artifact_templates`).get()
  ).n;

  db.prepare(
    `INSERT INTO artifact_templates (id, label, base_type, payload, updated_at, seed_hash, position)
     VALUES (?, ?, 'general', ?, datetime('now'), NULL, ?)`
  ).run(
    sourcePayload.id,
    sourcePayload.label,
    JSON.stringify(sourcePayload),
    count
  );

  // Copy within main
  const copied = copySlideTemplate(
    db,
    { kind: 'main', id: 'source-welcome-slide' },
    { kind: 'main' }
  );

  assert.ok(copied && 'id' in copied);
  assert.notEqual(copied.id, 'source-welcome-slide');
  assert.equal(copied.label, 'Source Welcome Slide');

  // Verify elements & image reference sharing
  const copiedLayout = copied.layouts.default;
  assert.equal(copiedLayout.backgroundColor, '#123456');
  assert.equal(copiedLayout.backgroundImage, '/api/uploads/0123456789abcdef0123456789abcdef.jpg');

  // Elements fully copied
  assert.equal(copiedLayout.elements.length, 3);
  assert.equal(copiedLayout.elements[0].content, 'Welcome {date}');
  assert.equal(copiedLayout.elements[0].style.fontColor, '#FFFFFF');
  assert.equal(copiedLayout.elements[1].style.fillColor, '#FF0000');
  assert.equal(
    copiedLayout.elements[2].imageRef,
    '/api/uploads/fedcba9876543210fedcba9876543210.png'
  );
});

test('BR-12: Copying between Main and Announcement Set shares image references across boundaries', () => {
  const db = getDb();

  // Create announcement set
  const setRes = db
    .prepare(`INSERT INTO announcement_sets (label, updated_at) VALUES (?, datetime('now'))`)
    .run('Test Ann Set');
  const setId = Number(setRes.lastInsertRowid);

  // 1. Copy from Main into Announcement Set
  const copiedToAnn = copySlideTemplate(
    db,
    { kind: 'main', id: 'source-welcome-slide' },
    { kind: 'announcement_set', setId }
  );

  assert.ok(copiedToAnn && 'annSetId' in copiedToAnn);
  assert.equal(copiedToAnn.annSetId, setId);
  assert.equal(copiedToAnn.payload.layouts.default.backgroundImage, '/api/uploads/0123456789abcdef0123456789abcdef.jpg');
  assert.equal(
    copiedToAnn.payload.layouts.default.elements[2].imageRef,
    '/api/uploads/fedcba9876543210fedcba9876543210.png'
  );

  // 2. Copy from Announcement Set back into Main
  const copiedBackToMain = copySlideTemplate(
    db,
    { kind: 'announcement_set', setId, slideId: copiedToAnn.id },
    { kind: 'main' }
  );

  assert.ok(copiedBackToMain && 'id' in copiedBackToMain && typeof copiedBackToMain.id === 'string');
  assert.equal(copiedBackToMain.layouts.default.backgroundImage, '/api/uploads/0123456789abcdef0123456789abcdef.jpg');
  assert.equal(
    copiedBackToMain.layouts.default.elements[2].imageRef,
    '/api/uploads/fedcba9876543210fedcba9876543210.png'
  );
});

test('BR-12: Deleting a slide never deletes or unlinks shared images referenced elsewhere', () => {
  const db = getDb();

  const source = getArtifactTemplate(db, 'source-welcome-slide');
  assert.ok(source);

  // Deleting source slide
  deleteArtifactTemplate(db, source.id, source.updatedAt);
  assert.equal(getArtifactTemplate(db, 'source-welcome-slide'), null);

  // Verify Announcement Set slide still exists and still holds the shared image URL
  const annSlide = db
    .prepare(`SELECT payload FROM announcement_set_slides WHERE payload LIKE '%0123456789abcdef0123456789abcdef%'`)
    .get();
  assert.ok(annSlide);
  assert.ok(annSlide.payload.includes('/api/uploads/0123456789abcdef0123456789abcdef.jpg'));
  assert.ok(annSlide.payload.includes('/api/uploads/fedcba9876543210fedcba9876543210.png'));
});
