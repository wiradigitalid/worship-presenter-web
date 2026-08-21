/**
 * Auth HTTP against the Go API: login, logout, change-password, bootstrap, rate limit.
 */
import { test, before, after } from 'node:test';
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
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-go-http-'));
const dbPath = path.join(tmp, 'test.db');
const AUTH_SECRET = createHash('sha256').update('auth-go-http-secret').digest('hex');
const BOOTSTRAP_USER = 'admin';
const BOOTSTRAP_PASS = 'bootstrap-pass-99';

function fetchRaw(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const headers = { ...(opts.headers || {}) };
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

let child;
let base;
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
      if (res.status && res.status < 500) return;
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

function parseCookie(setCookie) {
  const raw = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  if (!raw) return '';
  return raw.split(';')[0];
}

test('bootstrap admin can log in on a fresh Go DB', async () => {
  const res = await fetchRaw(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: BOOTSTRAP_USER, password: BOOTSTRAP_PASS }),
  });
  assert.equal(res.status, 200, res.body + '\n' + output.join(''));
  const data = JSON.parse(res.body);
  assert.equal(data.ok, true);
  assert.equal(data.role, 'admin');
  assert.equal(data.username, BOOTSTRAP_USER);
  const cookie = parseCookie(res.headers['set-cookie']);
  assert.match(cookie, /^auth_session=/);
  assert.match(String(res.headers['set-cookie'] || ''), /HttpOnly/i);
});

test('wrong password returns the same 401 as an unknown user', async () => {
  const wrong = await fetchRaw(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: BOOTSTRAP_USER, password: 'nope-nope-99' }),
  });
  assert.equal(wrong.status, 401);
  assert.equal(JSON.parse(wrong.body).error, 'Invalid username or password');

  const unknown = await fetchRaw(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'nobody-here', password: 'nope-nope-99' }),
  });
  assert.equal(unknown.status, 401);
  assert.equal(JSON.parse(unknown.body).error, 'Invalid username or password');
});

test('invalid JSON is 400', async () => {
  const res = await fetchRaw(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  });
  assert.equal(res.status, 400);
  assert.equal(JSON.parse(res.body).error, 'Invalid JSON');
});

test('over-long username is 401 and does not lock the pair', async () => {
  const ip = '203.0.113.50';
  for (let i = 0; i < 6; i++) {
    const res = await fetchRaw(`${base}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': ip,
      },
      body: JSON.stringify({
        username: 'x'.repeat(97),
        password: 'short',
      }),
    });
    assert.equal(res.status, 401);
  }
  const ok = await fetchRaw(`${base}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': ip,
    },
    body: JSON.stringify({ username: BOOTSTRAP_USER, password: BOOTSTRAP_PASS }),
  });
  assert.equal(ok.status, 200, ok.body);
});

test('pair-scoped rate limit returns 429 after five failures', async () => {
  const ip = '203.0.113.77';
  for (let i = 0; i < 5; i++) {
    const res = await fetchRaw(`${base}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': ip,
      },
      body: JSON.stringify({ username: BOOTSTRAP_USER, password: 'wrong-password-xx' }),
    });
    assert.equal(res.status, 401);
  }
  const locked = await fetchRaw(`${base}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': ip,
    },
    body: JSON.stringify({ username: BOOTSTRAP_USER, password: BOOTSTRAP_PASS }),
  });
  assert.equal(locked.status, 429);
  assert.equal(
    JSON.parse(locked.body).error,
    'Too many login attempts. Try again later.'
  );
  assert.ok(Number(locked.headers['retry-after']) >= 1);

  const otherIp = await fetchRaw(`${base}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': '203.0.113.78',
    },
    body: JSON.stringify({ username: BOOTSTRAP_USER, password: BOOTSTRAP_PASS }),
  });
  assert.equal(otherIp.status, 200, otherIp.body);
});

test('logout revokes the cookie; gated JSON is then 401', async () => {
  const login = await fetchRaw(`${base}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': '203.0.113.90',
    },
    body: JSON.stringify({ username: BOOTSTRAP_USER, password: BOOTSTRAP_PASS }),
  });
  assert.equal(login.status, 200, login.body);
  const cookie = parseCookie(login.headers['set-cookie']);

  const gated = await fetchRaw(`${base}/api/session`, {
    headers: { cookie },
  });
  assert.equal(gated.status, 200, gated.body);

  const logout = await fetchRaw(`${base}/api/auth/logout`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      cookie,
    },
  });
  assert.equal(logout.status, 200, logout.body);
  assert.equal(JSON.parse(logout.body).ok, true);

  const after = await fetchRaw(`${base}/api/session`, {
    headers: { cookie, Accept: 'application/json' },
  });
  assert.equal(after.status, 401);
});

test('change-password rotates tv and keeps this browser signed in', async () => {
  const login = await fetchRaw(`${base}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': '203.0.113.91',
    },
    body: JSON.stringify({ username: BOOTSTRAP_USER, password: BOOTSTRAP_PASS }),
  });
  assert.equal(login.status, 200, login.body);
  const oldCookie = parseCookie(login.headers['set-cookie']);

  const changed = await fetchRaw(`${base}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: oldCookie,
    },
    body: JSON.stringify({
      currentPassword: BOOTSTRAP_PASS,
      newPassword: 'new-bootstrap-pass-99',
    }),
  });
  assert.equal(changed.status, 200, changed.body);
  const newCookie = parseCookie(changed.headers['set-cookie']);
  assert.match(newCookie, /^auth_session=/);
  assert.notEqual(newCookie, oldCookie);

  const stale = await fetchRaw(`${base}/api/session`, {
    headers: { cookie: oldCookie },
  });
  assert.equal(stale.status, 401);

  const fresh = await fetchRaw(`${base}/api/session`, {
    headers: { cookie: newCookie },
  });
  assert.equal(fresh.status, 200, fresh.body);
  assert.equal(JSON.parse(fresh.body).username, BOOTSTRAP_USER);

  const back = await fetchRaw(`${base}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: newCookie,
    },
    body: JSON.stringify({
      currentPassword: 'new-bootstrap-pass-99',
      newPassword: BOOTSTRAP_PASS,
    }),
  });
  assert.equal(back.status, 200, back.body);
});
