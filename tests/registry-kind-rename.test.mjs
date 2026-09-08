/**
 * Story 20.2 AC-8: a registry label rename reaches every service at the next
 * plan build while no per-service snapshot exists (AD-14 transitional behaviour).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'registry-kind-rename-'));
process.env.DB_PATH = path.join(tmp, 'test.db');
delete process.env.IMAGE_URL_ALLOWLIST;

const srcUrl = (...parts) =>
  pathToFileURL(path.join(root, 'src', ...parts)).href;

const { getDb } = await import(srcUrl('lib', 'db', 'index.ts'));
const { getArtifactTemplate, updateArtifactTemplate } = await import(
  srcUrl('lib', 'registry', 'store.ts')
);
const { buildPreviewEntries } = await import(
  srcUrl('lib', 'artifacts', 'preview-model.ts')
);
const { parseRundown } = await import(srcUrl('lib', 'parser.ts'));
const { buildArtifactPlan } = await import(srcUrl('lib', 'slide-plan.ts'));

const sample = fs.readFileSync(
  path.join(__dirname, 'fixtures', 'sample-rundown.txt'),
  'utf8'
);

test('renaming a general row label updates the next built plan for an existing service', () => {
  const db = getDb();
  const welcome = getArtifactTemplate(db, 'welcome');
  assert.ok(welcome);
  const renamed = 'Renamed Welcome Label';
  const { updatedAt, ...body } = welcome;
  const updated = updateArtifactTemplate(
    db,
    'welcome',
    { ...body, label: renamed },
    updatedAt
  );
  assert.equal(updated.label, renamed);

  const parsed = parseRundown(sample);
  const entries = buildPreviewEntries(
    buildArtifactPlan('2026-07-11', parsed, [])
  );
  const welcomeEntry = entries.find((e) => e.instanceId === 'welcome');
  assert.ok(welcomeEntry, 'welcome slide should be in the plan');
  assert.equal(
    welcomeEntry.label,
    renamed,
    'Presenter/preview must read the live registry label on the next plan build'
  );
});

test('SPEC-13-06 / BUG-15: Song Set code Rename control exists and updates variableName in UI and API', async () => {
  const panelPath = path.join(root, 'src', 'components', 'admin', 'SongSetEntriesPanel.tsx');
  const code = fs.readFileSync(panelPath, 'utf8');

  // 1. Rename UI provides Code editing input bound to draftVarName
  assert.ok(
    code.includes('value={draftVarName}') && code.includes('setDraftVarName'),
    'Code input must bind to draftVarName state with setter'
  );

  // 2. handleSaveRename validates variableName with pattern and sends in payload
  assert.ok(
    code.includes('variableName: trimmedVar'),
    'handleSaveRename must include variableName in PATCH body'
  );

  // 3. Selection updates to new variableName on successful rename and handles duplicate conflict
  assert.ok(
    code.includes('setSelectedVarName(updated.variableName)') &&
    code.includes("data.error && String(data.error).includes('already exists')"),
    'Must update selectedVarName and branch on duplicate conflict error message'
  );
});

