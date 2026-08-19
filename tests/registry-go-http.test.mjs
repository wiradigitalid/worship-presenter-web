/**
 * Registry delete/reorder against the Go API (UC-15): Admin-gated, token-guarded, compact 0..N-1.
 */
import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'child_process';
import { createHash } from 'crypto';
import fs from 'fs';
import http from 'http';
import net from 'net';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

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

function stop(proc) {
  if (!proc || proc.pid == null) return;
  if (process.platform === 'win32') {
    try {
      execFileSync('taskkill', ['/pid', String(proc.pid), '/T', '/F'], {
        stdio: 'ignore',
      });
    } catch {
      /* already gone */
    }
    return;
  }
  proc.kill('SIGTERM');
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
  stop(child);
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
    assert.ok(templates.some((t) => t.id === 'song-set'));
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

  test('Admin delete removes song-set and keeps a compact list', async () => {
    const before = await list();
    const songSet = before.find((t) => t.id === 'song-set');
    assert.ok(songSet);
    const res = await json(`${base}/api/admin/artifacts/${songSet.id}`, 'DELETE', {
      updatedAt: songSet.updatedAt,
    });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.ok(!res.body.templates.some((t) => t.id === 'song-set'));
    const after = await list();
    assert.deepEqual(
      after.map((t) => t.id),
      res.body.templates.map((t) => t.id)
    );
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

