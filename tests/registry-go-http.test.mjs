/**
 * Registry delete/reorder against the Go API (UC-15): Admin-gated, token-guarded, compact 0..N-1.
 */
import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'child_process';
import { createHash } from 'crypto';
import fs from 'fs';
import http from 'http';
import net from 'net';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { stopProcess } from './helpers/go-api.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'registry-go-http-'));
const dbPath = path.join(tmp, 'test.db');
const AUTH_SECRET = createHash('sha256').update('registry-go-http-secret').digest('hex');
const BOOTSTRAP_USER = 'admin';
const BOOTSTRAP_PASS = 'bootstrap-pass-99';

function fetchRaw(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const headers = { ...(opts.headers || {}) };
    if (opts.body) {
      headers['Content-Length'] = String(Buffer.byteLength(opts.body));
    }
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: opts.method || 'GET',
        headers,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () =>
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString('utf8'),
          })
        );
      }
    );
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

function reservePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.unref();
    probe.on('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

function cookieFrom(headers) {
  const raw = headers['set-cookie'];
  if (!raw) return '';
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((c) => String(c).split(';')[0]).join('; ');
}

let child;
let base;
let adminCookie = '';
const output = [];

before(async () => {
  const port = await reservePort();
  child = spawn('go', ['run', './cmd/api'], {
    cwd: root,
    detached: process.platform !== 'win32',
    env: {
      ...process.env,
      PORT: String(port),
      DB_PATH: dbPath,
      AUTH_SECRET,
      AUTH_BOOTSTRAP_USER: BOOTSTRAP_USER,
      AUTH_BOOTSTRAP_PASSWORD: BOOTSTRAP_PASS,
      REPO_ROOT: root,
      NODE_ENV: 'test',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (c) => output.push(c.toString()));
  child.stderr.on('data', (c) => output.push(c.toString()));
  base = `http://127.0.0.1:${port}`;
  let lastErr;
  for (let i = 0; i < 80; i++) {
    try {
      const res = await fetchRaw(`${base}/login`);
      if (res.status && res.status < 500) {
        const login = await fetchRaw(`${base}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: BOOTSTRAP_USER, password: BOOTSTRAP_PASS }),
        });
        assert.equal(login.status, 200, login.body);
        adminCookie = cookieFrom(login.headers);
        return;
      }
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Go API did not become ready: ${lastErr}\n${output.join('')}`);
});

after(() => {
  stopProcess(child);
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

async function json(url, method = 'GET', body, cookie = adminCookie) {
  const headers = { Cookie: cookie };
  const raw = body === undefined ? undefined : JSON.stringify(body);
  if (raw !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetchRaw(url, { method, headers, body: raw });
  let parsed;
  try {
    parsed = JSON.parse(res.body);
  } catch {
    parsed = res.body;
  }
  return { status: res.status, body: parsed };
}

async function list() {
  const res = await json(`${base}/api/admin/artifacts`);
  assert.equal(res.status, 200);
  return res.body.templates;
}

describe('registry against Go', { concurrency: 1 }, () => {
  test('Admin list is the bootstrapped ordered registry', async () => {
    const templates = await list();
    assert.ok(templates.length > 1);
    assert.ok(
      templates.some((t) => t.baseType === 'song-set-entry' && t.id === 'bt-opening-song'),
      'expected a default song-set-entry spine row after migration'
    );
    const welcome = templates.find((t) => t.id === 'welcome');
    assert.equal(welcome?.resettable, true);
  });

  test('Admin create is general, not resettable, and Save works', async () => {
    const created = await json(`${base}/api/admin/artifacts`, 'POST', {
      label: 'Custom board',
      id: 'custom-story-20-3',
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    assert.equal(created.body.baseType, 'general');
    assert.equal(created.body.label, 'Custom board');
    assert.equal(created.body.id, 'custom-story-20-3');
    assert.ok(Array.isArray(created.body.placeholders));
    assert.equal(created.body.layouts?.default?.aspectRatio, '16:9');

    const templates = await list();
    const summary = templates.find((t) => t.id === 'custom-story-20-3');
    assert.equal(summary?.resettable, false);
    assert.equal(summary?.editable, true);

    const saved = await json(
      `${base}/api/admin/artifacts/custom-story-20-3`,
      'PUT',
      {
        ...created.body,
        label: 'Custom board',
        updatedAt: created.body.updatedAt,
      }
    );
    assert.equal(saved.status, 200, JSON.stringify(saved.body));

    const reset = await json(
      `${base}/api/admin/artifacts/custom-story-20-3/reset`,
      'POST',
      { updatedAt: saved.body.updatedAt }
    );
    assert.equal(reset.status, 400);
    assert.match(String(reset.body.error || ''), /Authored templates cannot be reset/);

    const empty = await json(`${base}/api/admin/artifacts`, 'POST', { label: '   ' });
    assert.equal(empty.status, 400);

    const dup = await json(`${base}/api/admin/artifacts`, 'POST', {
      label: 'Again',
      id: 'custom-story-20-3',
    });
    assert.equal(dup.status, 409);
  });

  test('PUT names the failing property and rejects invented General keys', async () => {
    const created = await json(`${base}/api/admin/artifacts`, 'POST', {
      label: 'Validate board',
      id: 'custom-story-20-4',
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));

    const unknown = await json(
      `${base}/api/admin/artifacts/custom-story-20-4`,
      'PUT',
      { ...created.body, extraField: true }
    );
    assert.equal(unknown.status, 400);
    assert.match(String(unknown.body.error || ''), /Unknown field: template.extraField/);

    const badFont = await json(
      `${base}/api/admin/artifacts/custom-story-20-4`,
      'PUT',
      {
        ...created.body,
        layouts: {
          default: {
            aspectRatio: '16:9',
            backgroundColor: '#000000',
            elements: [
              {
                id: 'usr-1',
                type: 'text',
                required: false,
                x: 1,
                y: 1,
                w: 10,
                h: 10,
                zIndex: 0,
                content: 'Hi',
                style: { fontSize: 0, fontColor: '#FFFFFF' },
              },
            ],
          },
        },
      }
    );
    assert.equal(badFont.status, 400);
    assert.match(
      String(badFont.body.error || ''),
      /layouts\.default\.elements\[0\]\.style\.fontSize must be positive/
    );

    const invented = await json(
      `${base}/api/admin/artifacts/custom-story-20-4`,
      'PUT',
      {
        ...created.body,
        placeholders: [{ key: 'inventedWeekly', type: 'text', required: false }],
      }
    );
    assert.equal(invented.status, 400);
    assert.match(
      String(invented.body.error || ''),
      /placeholder key is not in the catalog: inventedWeekly/
    );
  });

  test('Admin rename updates song-set entry title via LC-11', async () => {
    const entries = await json(`${base}/api/admin/song-set-entries`);
    assert.equal(entries.status, 200);
    const opening = entries.body.entries?.find((e) => e.variableName === 'opening_song_bt');
    assert.ok(opening, 'expected opening_song_bt entry');
    const renamed = await json(
      `${base}/api/admin/song-set-entries/opening_song_bt`,
      'PATCH',
      { title: 'Opening song (go)', updatedAt: opening.updatedAt }
    );
    assert.equal(renamed.status, 200, JSON.stringify(renamed.body));
    assert.equal(renamed.body.title, 'Opening song (go)');

    const listed = await json(`${base}/api/admin/song-set-entries`);
    assert.equal(
      listed.body.entries?.find((e) => e.variableName === 'opening_song_bt')?.title,
      'Opening song (go)'
    );

    const stale = await json(
      `${base}/api/admin/song-set-entries/opening_song_bt`,
      'PATCH',
      { title: 'stale', updatedAt: opening.updatedAt }
    );
    assert.equal(stale.status, 409);
  });

  test('Admin reorder reverses the list and refreshes tokens', async () => {
    const before = await list();
    const desired = [...before].reverse();
    const res = await json(`${base}/api/admin/artifacts/order`, 'PUT', {
      items: desired.map(({ id, updatedAt }) => ({ id, updatedAt })),
    });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.deepEqual(
      res.body.templates.map((t) => t.id),
      desired.map((t) => t.id)
    );
    for (const t of res.body.templates) {
      assert.notEqual(
        t.updatedAt,
        before.find((old) => old.id === t.id)?.updatedAt,
        `${t.id} must receive a fresh concurrency token`
      );
    }
  });

  test('Admin delete removes a song-set entry and keeps a compact list', async () => {
    const before = await json(`${base}/api/admin/song-set-entries`);
    assert.equal(before.status, 200);
    const target = before.body.entries?.find((e) => e.variableName === 'closing_song_dw');
    assert.ok(target, 'expected closing_song_dw entry');
    const res = await json(
      `${base}/api/admin/song-set-entries/closing_song_dw`,
      'DELETE',
      { updatedAt: target.updatedAt }
    );
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.ok(
      !res.body.entries?.some((e) => e.variableName === 'closing_song_dw'),
      'deleted entry must leave the list'
    );
    const after = await json(`${base}/api/admin/song-set-entries`);
    assert.equal(after.status, 200);
    assert.ok(!after.body.entries?.some((e) => e.variableName === 'closing_song_dw'));
  });

  test('stale delete token is 409', async () => {
    const before = await list();
    const target = before[0];
    const res = await json(`${base}/api/admin/artifacts/${target.id}`, 'DELETE', {
      updatedAt: '2000-01-01T00:00:00.000Z',
    });
    assert.equal(res.status, 409);
    const after = await list();
    assert.deepEqual(
      after.map((t) => t.id),
      before.map((t) => t.id)
    );
  });

  test('operator cannot hit admin artifacts', async () => {
    const created = await json(`${base}/api/admin/accounts`, 'POST', {
      username: 'registry-operator',
      password: 'pw-operator-99',
      role: 'operator',
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const login = await fetchRaw(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'registry-operator', password: 'pw-operator-99' }),
    });
    assert.equal(login.status, 200);
    const cookie = cookieFrom(login.headers);
    const res = await json(`${base}/api/admin/artifacts`, 'GET', undefined, cookie);
    assert.equal(res.status, 403);
  });
});

