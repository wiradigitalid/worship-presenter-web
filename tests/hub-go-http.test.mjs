/**
 * Remaining Hub verbs on the Go API: announcements, hymns, scripture,
 * admin settings/accounts/registry, webhook intake.
 */
import { test, before, after } from 'node:test';
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
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hub-go-http-'));
const dbPath = path.join(tmp, 'test.db');
const AUTH_SECRET = createHash('sha256').update('hub-go-http-secret').digest('hex');
const WEBHOOK_SECRET = 'hub-go-webhook-secret';
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
let cookie = '';
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
      WEBHOOK_SECRET,
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
        cookie = cookieFrom(login.headers);
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

async function json(url, method = 'GET', body, extraHeaders = {}) {
  const headers = { Cookie: cookie, ...extraHeaders };
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

test('GET /api/announcements starts empty; POST then DELETE', async () => {
  const empty = await json(`${base}/api/announcements`);
  assert.equal(empty.status, 200);
  assert.deepEqual(empty.body, { items: [] });

  const created = await json(`${base}/api/announcements`, 'POST', {
    image_url: 'https://example.com/flyer.png',
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.item.image_url, 'https://example.com/flyer.png');
  const id = created.body.item.id;

  const listed = await json(`${base}/api/announcements`);
  assert.equal(listed.status, 200);
  assert.equal(listed.body.items.length, 1);

  const removed = await json(`${base}/api/announcements/${id}`, 'DELETE');
  assert.equal(removed.status, 200);
});

test('GET /api/hymns returns seeded SDAH entries', async () => {
  const res = await json(`${base}/api/hymns?q=159`);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.hymns));
  assert.ok(res.body.hymns.some((h) => h.number === 159));
});

test('GET /api/scripture looks up a KJV verse from the bootstrapped corpus', async () => {
  const res = await json(`${base}/api/scripture?ref=John+3:16&translation=KJV`);
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(typeof res.body.text, 'string');
  assert.ok(res.body.text.length > 0);
});

test('GET /api/admin/settings and accounts and artifacts on a fresh hub', async () => {
  const settings = await json(`${base}/api/admin/settings`);
  assert.equal(settings.status, 200);
  assert.equal(typeof settings.body.pptx_retention_days, 'number');
  assert.ok(['en', 'id'].includes(settings.body.ui_locale));

  const accounts = await json(`${base}/api/admin/accounts`);
  assert.equal(accounts.status, 200);
  assert.ok(accounts.body.accounts.some((a) => a.username === BOOTSTRAP_USER));

  const artifacts = await json(`${base}/api/admin/artifacts`);
  assert.equal(artifacts.status, 200);
  assert.ok(artifacts.body.templates.length > 0);
});

test('POST /api/webhook with secret creates a service', async () => {
  const res = await json(
    `${base}/api/webhook`,
    'POST',
    {
      text: [
        'SABBATH, JUNE 6, 2026',
        'DIVINE SERVICE',
        'Opening Song: SDAH #159',
        'Sermon: Pastor Ada',
      ].join('\n'),
    },
    { 'x-webhook-secret': WEBHOOK_SECRET }
  );
  assert.equal(res.status, 201, JSON.stringify(res.body));
  assert.ok(res.body.id > 0);
  assert.equal(res.body.date, '2026-06-06');
});
