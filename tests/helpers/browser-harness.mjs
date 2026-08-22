import { spawn } from 'child_process';
import { createHash } from 'crypto';
import fs from 'fs';
import http from 'http';
import net from 'net';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { stopProcess } from './go-api.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '../..');

export const DEFAULT_ADMIN_USER = 'admin';
export const DEFAULT_ADMIN_PASS = 'admin-pass-123';
export const DEFAULT_OPERATOR_USER = 'operator1';
export const DEFAULT_OPERATOR_PASS = 'operator-pass-123';

export function fetchRaw(url, opts = {}) {
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

export function reservePort() {
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

export function cookieFrom(headers) {
  const raw = headers['set-cookie'];
  if (!raw) return '';
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((c) => String(c).split(';')[0]).join('; ');
}

export async function startBrowserEnvironment({
  dbName = 'test.db',
  authUser = DEFAULT_ADMIN_USER,
  authPass = DEFAULT_ADMIN_PASS,
  headless = true,
} = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wpw-browser-test-'));
  const dbPath = path.join(tmpDir, dbName);
  const authSecret = createHash('sha256').update(tmpDir).digest('hex');
  const port = await reservePort();
  const output = [];

  const proc = spawn('go', ['run', './cmd/api'], {
    cwd: repoRoot,
    detached: process.platform !== 'win32',
    env: {
      ...process.env,
      PORT: String(port),
      DB_PATH: dbPath,
      AUTH_SECRET: authSecret,
      AUTH_BOOTSTRAP_USER: authUser,
      AUTH_BOOTSTRAP_PASSWORD: authPass,
      REPO_ROOT: repoRoot,
      NODE_ENV: 'test',
      WPW_USE_SHIPPED_REGISTRY: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  proc.stdout.on('data', (c) => { output.push(c.toString()); console.log('[GO API]', c.toString().trim()); });
  proc.stderr.on('data', (c) => output.push(c.toString()));

  const baseUrl = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let i = 0; i < 80; i++) {
    try {
      const res = await fetchRaw(`${baseUrl}/login`);
      if (res.status && res.status < 500) {
        ready = true;
        break;
      }
    } catch {
      // polling
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  if (!ready) {
    stopProcess(proc);
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
    throw new Error(`Go API did not become ready at ${baseUrl}\nOutput:\n${output.join('')}`);
  }

  // Ensure SPA dist exists so Go serves index.html and assets
  const distIndex = path.join(repoRoot, 'spa', 'dist', 'index.html');
  if (!fs.existsSync(distIndex)) {
    throw new Error(`SPA dist not found at ${distIndex}. Run 'npm run spa:build' before running browser acceptance tests.`);
  }

  const browser = await chromium.launch({
    headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  return {
    proc,
    baseUrl,
    port,
    dbPath,
    tmpDir,
    browser,
  };
}

export async function stopBrowserEnvironment(env) {
  if (!env) return;
  if (env.browser) {
    try {
      await env.browser.close();
    } catch {}
  }
  if (env.proc) {
    stopProcess(env.proc);
  }
  if (env.tmpDir) {
    try {
      fs.rmSync(env.tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

export async function loginViaUi(page, baseUrl, username, password) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('#login-username', username);
  await page.fill('#login-password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
}

export async function createServiceViaApi(baseUrl, cookie, rawPayload) {
  const res = await fetchRaw(`${baseUrl}/api/services`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      raw_payload: rawPayload,
    }),
  });
  if (res.status !== 201) {
    throw new Error(`Failed to create service (${res.status}): ${res.body}`);
  }
  return JSON.parse(res.body);
}

export async function loginAndGetCookie(baseUrl, username, password) {
  const res = await fetchRaw(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (res.status !== 200) {
    throw new Error(`Failed to login via API (${res.status}): ${res.body}`);
  }
  return cookieFrom(res.headers);
}

export async function createOperatorAccount(baseUrl, adminCookie, username, password) {
  const res = await fetchRaw(`${baseUrl}/api/admin/accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      username,
      password,
      role: 'operator',
    }),
  });
  if (res.status !== 201) {
    throw new Error(`Failed to create operator account (${res.status}): ${res.body}`);
  }
  return JSON.parse(res.body);
}