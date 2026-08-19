/**
 * UC-16: Sync Artifact freezes a service-bound AD-16 snapshot. Live registry
 * edits do not shift an already-reviewed Service until Admin syncs; entered
 * weekly fields survive; corrupt live rows are omitted and logged (OQ-32).
 *
 * Domain cases use src/lib against SQLite. HTTP cases hit the Go API.
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { json, parseCookie, spawnGoApi, stopProcess } from './helpers/go-api.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'registry-sync-artifact-'));
const dbPath = path.join(tmp, 'test.db');
const previousDbPath = process.env.DB_PATH;
const previousAuthSecret = process.env.AUTH_SECRET;
const AUTH_SECRET = createHash('sha256').update('registry-sync-artifact-secret').digest('hex');
process.env.DB_PATH = dbPath;
process.env.AUTH_SECRET = AUTH_SECRET;

const srcUrl = (...parts) => pathToFileURL(path.join(root, 'src', ...parts)).href;
const { createAccount } = await import(srcUrl('lib', 'auth', 'accounts.ts'));
const { getDb } = await import(srcUrl('lib', 'db', 'index.ts'));
const { createService } = await import(srcUrl('lib', 'services', 'create-service.ts'));
const { narrowCreateBody } = await import(srcUrl('lib', 'services', 'body.ts'));
const { deleteArtifactTemplate, getArtifactTemplate } = await import(
  srcUrl('lib', 'registry', 'store.ts')
);
const { buildSlidePlan } = await import(srcUrl('lib', 'slide-plan.ts'));
const {
  migrateServiceBoundSnapshots,
  serviceHasRegistrySnapshot,
} = await import(srcUrl('lib', 'registry', 'service-snapshot.ts'));
const { DATA_VERSION_KEY } = await import(srcUrl('lib', 'registry', 'seed.ts'));

const ADMIN = { username: 'sync-admin', password: 'pw-admin-99', role: 'admin' };
const OPERATOR = { username: 'sync-operator', password: 'pw-operator-99', role: 'operator' };
const BOOTSTRAP_USER = 'admin';
const BOOTSTRAP_PASS = 'bootstrap-pass-99';

let child;
let base;
let output = [];
let accountsCreated = false;
let serviceSeq = 0;

before(async () => {
  const spawned = await spawnGoApi({
    dbPath,
    root,
    env: {
      AUTH_SECRET,
      AUTH_BOOTSTRAP_USER: BOOTSTRAP_USER,
      AUTH_BOOTSTRAP_PASSWORD: BOOTSTRAP_PASS,
    },
  });
  child = spawned.child;
  base = spawned.base;
  output = spawned.output;
});

after(() => {
  stopProcess(child);
  if (previousDbPath === undefined) delete process.env.DB_PATH;
  else process.env.DB_PATH = previousDbPath;
  if (previousAuthSecret === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = previousAuthSecret;
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    // better-sqlite3 may still hold the process-local test database on Windows.
  }
});

function createReviewedService() {
  serviceSeq += 1;
  const day = 10 + serviceSeq;
  const raw = `SABBATH, JULY ${day}, 2026
DIVINE SERVICE
Opening Song: SDAH #159
Sermon: Pastor Adam
Closing Prayer: The Speaker`;
  const input = narrowCreateBody({ raw_payload: raw });
  assert.equal(input.ok, true);
  const result = createService(getDb(), input.value);
  assert.equal(result.ok, true);
  return result.id;
}

async function tokenFor(account) {
  if (!accountsCreated) {
    createAccount(ADMIN);
    createAccount(OPERATOR);
    accountsCreated = true;
  }
  const response = await json(`${base}/api/auth/login`, 'POST', {
    username: account.username,
    password: account.password,
  });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  const token = parseCookie(response.headers['set-cookie']);
  assert.ok(token);
  return token;
}

async function syncRequest(serviceId, body, account = ADMIN) {
  const token = await tokenFor(account);
  return json(
    `${base}/api/services/${serviceId}/sync-artifact`,
    'POST',
    body,
    { cookie: token }
  );
}

function serviceRow(id) {
  return getDb()
    .prepare(
      `SELECT date, parsed_data, COALESCE(updated_at, created_at) AS updated_at,
              registry_snapshot_at
         FROM services WHERE id = ?`
    )
    .get(id);
}

function snapshotIds(serviceId) {
  return getDb()
    .prepare(
      `SELECT template_id FROM service_registry_snapshots
        WHERE service_id = ? ORDER BY position`
    )
    .all(serviceId)
    .map((row) => row.template_id);
}

function planIds(serviceId) {
  const row = serviceRow(serviceId);
  const parsed = JSON.parse(row.parsed_data);
  return buildSlidePlan(row.date, parsed, [], { serviceId }).map((slide) => slide.id);
}

describe('registry sync artifact', { concurrency: false }, () => {
test('create clones the live registry onto the new Service', () => {
  const id = createReviewedService();
  assert.equal(serviceHasRegistrySnapshot(getDb(), id), true);
  const live = getDb()
    .prepare(`SELECT id FROM artifact_templates ORDER BY position`)
    .all()
    .map((row) => row.id);
  assert.deepEqual(snapshotIds(id), live);
});

test('a live delete does not shift a Service until Admin syncs; entered fields survive', async () => {
  const id = createReviewedService();
  const beforeParsed = serviceRow(id).parsed_data;
  const welcome = getArtifactTemplate(getDb(), 'welcome');
  assert.ok(welcome);
  deleteArtifactTemplate(getDb(), 'welcome', welcome.updatedAt);

  assert.ok(snapshotIds(id).includes('welcome'));
  assert.ok(planIds(id).includes('welcome'));
  assert.equal(
    getDb().prepare(`SELECT 1 FROM artifact_templates WHERE id = ?`).get('welcome'),
    undefined
  );

  const res = await syncRequest(id, { updated_at: serviceRow(id).updated_at });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(typeof res.body.updated_at, 'string');
  assert.equal(snapshotIds(id).includes('welcome'), false);
  assert.equal(planIds(id).includes('welcome'), false);
  assert.equal(serviceRow(id).parsed_data, beforeParsed);
  assert.match(beforeParsed, /Pastor Adam/);
});

test('Operator cannot Sync; Admin with a stale token is 409', async () => {
  const id = createReviewedService();
  const current = serviceRow(id).updated_at;
  const asOperator = await syncRequest(id, { updated_at: current }, OPERATOR);
  assert.equal(asOperator.status, 403);
  assert.ok(snapshotIds(id).length > 0);

  const stale = await syncRequest(id, { updated_at: '1999-01-01 00:00:00' });
  assert.equal(stale.status, 409);
  assert.equal(stale.body.updated_at, current);
});

test('a corrupt live row is omitted from Sync and logged (OQ-32)', async () => {
  const id = createReviewedService();
  getDb()
    .prepare(`UPDATE artifact_templates SET payload = ? WHERE id = ?`)
    .run('{not-json', 'sermon');
  const before = output.length;
  const res = await syncRequest(id, { updated_at: serviceRow(id).updated_at });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(snapshotIds(id).includes('sermon'), false);
  const logs = output.slice(before).join(' ');
  assert.ok(
    /sermon/.test(logs) && /rejected/i.test(logs),
    `expected omit-and-log for sermon, got: ${logs}`
  );
});

test('AD-21 1→2 clones existing services that have no snapshot', () => {
  const db = getDb();
  const inserted = db
    .prepare(
      `INSERT INTO services (date, raw_payload, parsed_data, updated_at)
       VALUES ('2026-08-01', 'legacy', '{"date":"2026-08-01","items":[]}', CURRENT_TIMESTAMP)`
    )
    .run();
  const id = Number(inserted.lastInsertRowid);
  db.prepare(`UPDATE services SET registry_snapshot_at = NULL WHERE id = ?`).run(id);
  db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`).run(
    DATA_VERSION_KEY,
    '1'
  );
  assert.equal(serviceHasRegistrySnapshot(db, id), false);

  migrateServiceBoundSnapshots(db);

  assert.equal(serviceHasRegistrySnapshot(db, id), true);
  assert.ok(snapshotIds(id).length > 0);
  const version = db
    .prepare(`SELECT value FROM settings WHERE key = ?`)
    .get(DATA_VERSION_KEY).value;
  assert.equal(version, '2');
});
});
