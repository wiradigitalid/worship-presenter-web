/**
 * UC-15's public Admin boundary: deletion and whole-list order are authenticated,
 * token-guarded, atomic, and survive the actual startup path.
 */
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'child_process';
import { register } from 'node:module';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

register(
  'data:text/javascript,' +
    encodeURIComponent(
      `export async function resolve(specifier, context, nextResolve) {
         if (specifier === 'next/server') return nextResolve('next/server.js', context);
         return nextResolve(specifier, context);
       }`
    )
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'registry-reorder-delete-http-'));
const dbPath = path.join(tmp, 'test.db');
const previousDbPath = process.env.DB_PATH;
const previousAuthSecret = process.env.AUTH_SECRET;
process.env.DB_PATH = dbPath;
process.env.AUTH_SECRET = 'registry-reorder-delete-http-test-secret';

const srcUrl = (...parts) => pathToFileURL(path.join(root, 'src', ...parts)).href;
const { NextRequest } = await import('next/server');
const { createAccount } = await import(srcUrl('lib', 'auth', 'accounts.ts'));
const { POST: loginRoute } = await import(srcUrl('app', 'api', 'auth', 'login', 'route.ts'));
const { SESSION_COOKIE } = await import(srcUrl('lib', 'auth', 'session.ts'));
const { DELETE: deleteRoute } = await import(
  srcUrl('app', 'api', 'admin', 'artifacts', '[id]', 'route.ts')
);
const { PUT: orderRoute } = await import(
  srcUrl('app', 'api', 'admin', 'artifacts', 'order', 'route.ts')
);
const { getDb } = await import(srcUrl('lib', 'db', 'index.ts'));
const { listArtifactSummaries, assertContiguousPositions } = await import(
  srcUrl('lib', 'registry', 'store.ts')
);

after(() => {
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

const ADMIN = { username: 'registry-admin', password: 'pw-admin-99', role: 'admin' };
const OPERATOR = { username: 'registry-operator', password: 'pw-operator-99', role: 'operator' };
let accountsCreated = false;

async function tokenFor(account) {
  if (!accountsCreated) {
    createAccount(ADMIN);
    createAccount(OPERATOR);
    accountsCreated = true;
  }
  const response = await loginRoute(
    new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: account.username, password: account.password }),
    })
  );
  assert.equal(response.status, 200);
  const token = response.cookies.get(SESSION_COOKIE)?.value;
  assert.ok(token);
  return token;
}

async function request(url, init = {}, account = ADMIN) {
  const token = await tokenFor(account);
  return new NextRequest(url, {
    ...init,
    headers: {
      cookie: `${SESSION_COOKIE}=${token}`,
      ...(init.headers ?? {}),
    },
  });
}

async function list() {
  return listArtifactSummaries(getDb());
}

function rowRequest(id, init = {}, account) {
  return request(`http://localhost/api/admin/artifacts/${id}`, init, account);
}

function orderRequest(init = {}, account) {
  return request('http://localhost/api/admin/artifacts/order', init, account);
}

function body(updatedAt) {
  return JSON.stringify({ updatedAt });
}

const BOOT_REPORT_SCRIPT = path.join(tmp, 'boot-report.mjs');
fs.writeFileSync(
  BOOT_REPORT_SCRIPT,
  [
    "import fs from 'fs';",
    "import path from 'path';",
    "import { pathToFileURL } from 'url';",
    "const root = process.argv[2];",
    "const { getDb } = await import(pathToFileURL(path.join(root, 'src', 'lib', 'db', 'index.ts')).href);",
    "const { listArtifactSummaries } = await import(pathToFileURL(path.join(root, 'src', 'lib', 'registry', 'store.ts')).href);",
    "const { parseRundown } = await import(pathToFileURL(path.join(root, 'src', 'lib', 'parser.ts')).href);",
    "const { buildArtifactPlan } = await import(pathToFileURL(path.join(root, 'src', 'lib', 'slide-plan.ts')).href);",
    "const parsed = parseRundown(fs.readFileSync(path.join(root, 'tests', 'fixtures', 'sample-rundown.txt'), 'utf8'));",
    "const plan = buildArtifactPlan('2026-07-11', parsed, []);",
    "const planTemplateIds = plan.flatMap((node) => node.kind === 'group' ? node.children.map((child) => child.instance.templateId) : [node.instance.templateId]);",
    "console.log('__REGISTRY_BOOT_REPORT__' + JSON.stringify({ ids: listArtifactSummaries(getDb()).map((row) => row.id), planTemplateIds }));",
  ].join('\n')
);

function freshBootReport() {
  const output = execFileSync(
    process.execPath,
    [
      '--import',
      pathToFileURL(path.join(root, 'tests', 'register-ts-resolve.mjs')).href,
      '--experimental-strip-types',
      BOOT_REPORT_SCRIPT,
      root,
    ],
    { cwd: root, env: { ...process.env, DB_PATH: dbPath }, encoding: 'utf8' }
  );
  const line = output
    .split(/\r?\n/)
    .find((value) => value.startsWith('__REGISTRY_BOOT_REPORT__'));
  assert.ok(line, `fresh boot did not report its state: ${output}`);
  return JSON.parse(line.slice('__REGISTRY_BOOT_REPORT__'.length));
}

test('Admin delete removes SongSet and last rows, compacts positions, and survives a fresh process', async () => {
  const before = await list();
  const songSet = before.find((template) => template.id === 'song-set');
  assert.ok(songSet, 'seed contains song-set');

  const response = await deleteRoute(
    await rowRequest(songSet.id, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: body(songSet.updatedAt),
    }),
    { params: Promise.resolve({ id: songSet.id }) }
  );
  assert.equal(response.status, 200);
  const deleted = await response.json();
  assert.ok(!deleted.templates.some((template) => template.id === songSet.id));
  for (const template of deleted.templates) {
    assert.notEqual(
      template.updatedAt,
      before.find((old) => old.id === template.id)?.updatedAt,
      `${template.id} must receive a fresh concurrency token after compaction`
    );
  }
  assert.deepEqual(
    deleted.templates.map((template) => template.id),
    (await list()).map((template) => template.id)
  );
  assertContiguousPositions(getDb());

  const remaining = await list();
  const final = remaining.at(-1);
  assert.ok(final);
  const lastResponse = await deleteRoute(
    await rowRequest(final.id, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: body(final.updatedAt),
    }),
    { params: Promise.resolve({ id: final.id }) }
  );
  assert.equal(lastResponse.status, 200);
  assertContiguousPositions(getDb());

  const persisted = freshBootReport();
  assert.ok(!persisted.ids.includes(songSet.id));
});

test('Admin reorder accepts a complete snapshot and refreshes every token', async () => {
  const before = await list();
  const desired = [...before].reverse();
  const response = await orderRoute(
    await orderRequest({
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        items: desired.map(({ id, updatedAt }) => ({ id, updatedAt })),
      }),
    })
  );
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.deepEqual(result.templates.map((template) => template.id), desired.map((template) => template.id));
  for (const template of result.templates) {
    assert.notEqual(
      template.updatedAt,
      before.find((old) => old.id === template.id)?.updatedAt,
      `${template.id} must receive a fresh concurrency token`
    );
  }
  assertContiguousPositions(getDb());

  const persisted = freshBootReport();
  assert.deepEqual(persisted.ids, desired.map((template) => template.id));
  const desiredIdsPresentInPlan = desired
    .map((template) => template.id)
    .filter((id) => persisted.planTemplateIds.includes(id));
  const firstPlanAppearance = [];
  for (const id of persisted.planTemplateIds) {
    if (desiredIdsPresentInPlan.includes(id) && !firstPlanAppearance.includes(id)) {
      firstPlanAppearance.push(id);
    }
  }
  assert.deepEqual(firstPlanAppearance, desiredIdsPresentInPlan);
});

test('delete and reorder reject invalid JSON and missing tokens without writing', async () => {
  const before = await list();
  const target = before[0];
  const invalidDeleteBodies = ['{', JSON.stringify({}), JSON.stringify({ updatedAt: ' ' })];
  for (const invalidBody of invalidDeleteBodies) {
    const response = await deleteRoute(
      await rowRequest(target.id, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: invalidBody,
      }),
      { params: Promise.resolve({ id: target.id }) }
    );
    assert.equal(response.status, 400);
    assert.deepEqual(await list(), before);
    assert.doesNotThrow(() => assertContiguousPositions(getDb()));
  }

  const invalidOrder = await orderRoute(
    await orderRequest({
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: '{',
    })
  );
  assert.equal(invalidOrder.status, 400);
  assert.deepEqual(await list(), before);
  assert.doesNotThrow(() => assertContiguousPositions(getDb()));
});

test('delete and reorder reject stale tokens without a partial write', async () => {
  const beforeDelete = await list();
  const target = beforeDelete[0];
  const staleDelete = await deleteRoute(
    await rowRequest(target.id, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: body('2000-01-01T00:00:00.000Z'),
    }),
    { params: Promise.resolve({ id: target.id }) }
  );
  assert.equal(staleDelete.status, 409);
  assert.deepEqual(await list(), beforeDelete);

  const staleItems = beforeDelete.map(({ id, updatedAt }, index) => ({
    id,
    updatedAt: index === 0 ? '2000-01-01T00:00:00.000Z' : updatedAt,
  }));
  const staleOrder = await orderRoute(
    await orderRequest({
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: staleItems.reverse() }),
    })
  );
  assert.equal(staleOrder.status, 409);
  assert.deepEqual(await list(), beforeDelete);
});

test('reorder rejects every malformed membership or token shape without writing', async () => {
  const before = await list();
  const valid = before.map(({ id, updatedAt }) => ({ id, updatedAt }));
  const invalidBodies = [
    {},
    { items: null },
    { items: 'not-an-array' },
    { items: valid.map((item, index) => (index === 0 ? null : item)) },
    { items: valid.map((item, index) => (index === 0 ? 1 : item)) },
    { items: valid.map((item, index) => (index === 0 ? { updatedAt: item.updatedAt } : item)) },
    { items: valid.map((item, index) => (index === 0 ? { ...item, id: ' ' } : item)) },
    { items: valid.map((item, index) => (index === 0 ? { id: item.id } : item)) },
    { items: valid.map((item, index) => (index === 0 ? { ...item, updatedAt: ' ' } : item)) },
    { items: valid.slice(1) },
    { items: [...valid, { id: 'unknown-template', updatedAt: 'token' }] },
    { items: [...valid.slice(0, -1), valid[0]] },
  ];
  for (const payload of invalidBodies) {
    const response = await orderRoute(
      await orderRequest({
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
    assert.equal(response.status, 400);
    assert.deepEqual(await list(), before);
    assert.doesNotThrow(() => assertContiguousPositions(getDb()));
  }
});

test('unknown delete and non-Admin artifact mutations return their existing error envelopes', async () => {
  const current = await list();
  const unknown = await deleteRoute(
    await rowRequest('unknown-template', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: body(current[0].updatedAt),
    }),
    { params: Promise.resolve({ id: 'unknown-template' }) }
  );
  assert.equal(unknown.status, 404);
  assert.equal(typeof (await unknown.json()).error, 'string');

  const nonAdminDelete = await deleteRoute(
    await rowRequest(current[0].id, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: body(current[0].updatedAt),
    }, OPERATOR),
    { params: Promise.resolve({ id: current[0].id }) }
  );
  assert.equal(nonAdminDelete.status, 403);

  const nonAdminOrder = await orderRoute(
    await orderRequest({
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: current.map(({ id, updatedAt }) => ({ id, updatedAt })) }),
    }, OPERATOR)
  );
  assert.equal(nonAdminOrder.status, 403);

  const anonymousDelete = await deleteRoute(
    new NextRequest(`http://localhost/api/admin/artifacts/${current[0].id}`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: body(current[0].updatedAt),
    }),
    { params: Promise.resolve({ id: current[0].id }) }
  );
  assert.equal(anonymousDelete.status, 403);

  const anonymousOrder = await orderRoute(
    new NextRequest('http://localhost/api/admin/artifacts/order', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: current.map(({ id, updatedAt }) => ({ id, updatedAt })) }),
    })
  );
  assert.equal(anonymousOrder.status, 403);
  assert.deepEqual(await list(), current, 'rejected callers cannot mutate the registry');
});

test('Admin can delete the final live row', async () => {
  for (;;) {
    const template = (await list())[0];
    if (!template) break;
    const response = await deleteRoute(
      await rowRequest(template.id, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: body(template.updatedAt),
      }),
      { params: Promise.resolve({ id: template.id }) }
    );
    assert.equal(response.status, 200);
  }
  const emptyReorder = await orderRoute(
    await orderRequest({
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: [] }),
    })
  );
  assert.equal(emptyReorder.status, 200);
  assert.deepEqual((await emptyReorder.json()).templates, []);
  assert.deepEqual(await list(), []);
  assertContiguousPositions(getDb());
});
