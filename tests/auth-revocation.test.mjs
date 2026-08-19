/**
 * Session revocation contract against the Go API gate, plus lib checks for
 * prune / signSession.
 */
import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, createHmac } from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { fetchRaw, parseCookie, spawnGoApi, stopProcess } from './helpers/go-api.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-revocation-test-'));
const previousDbPath = process.env.DB_PATH;
const previousAuthSecret = process.env.AUTH_SECRET;
process.env.DB_PATH = path.join(tmp, 'test.db');
const AUTH_SECRET = createHash('sha256').update('revocation-test-secret-0123456789').digest('hex');
process.env.AUTH_SECRET = AUTH_SECRET;

const srcUrl = (...parts) => pathToFileURL(path.join(root, 'src', ...parts)).href;

const {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  generateSessionId,
  signSession,
  verifySession,
} = await import(srcUrl('lib', 'auth', 'session.ts'));
const {
  isSessionRevoked,
  pruneExpiredRevocations,
  revokeSession,
} = await import(srcUrl('lib', 'auth', 'revocation.ts'));
const { createAccount, deleteAccount, getAccountByUsername, updateAccount } =
  await import(srcUrl('lib', 'auth', 'accounts.ts'));
const { getDb } = await import(srcUrl('lib', 'db', 'index.ts'));

const BOOTSTRAP_USER = 'admin';
const BOOTSTRAP_PASS = 'bootstrap-pass-99';

let child;
let base;

before(async () => {
  ({ child, base } = await spawnGoApi({
    dbPath: process.env.DB_PATH,
    root,
    env: {
      AUTH_SECRET,
      AUTH_BOOTSTRAP_USER: BOOTSTRAP_USER,
      AUTH_BOOTSTRAP_PASSWORD: BOOTSTRAP_PASS,
    },
  }));
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
    // ignore
  }
});

function cookieValue(setCookie, name) {
  const list = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  for (const raw of list) {
    const first = String(raw).split(';')[0];
    const eq = first.indexOf('=');
    if (eq === -1) continue;
    if (first.slice(0, eq) === name) {
      const value = first.slice(eq + 1);
      const attrs = String(raw).toLowerCase();
      const maxAge = /max-age=(\d+)/.exec(attrs);
      return { value, maxAge: maxAge ? Number(maxAge[1]) : undefined };
    }
  }
  return undefined;
}

function wrap(res) {
  const parsed = (() => {
    try {
      return JSON.parse(res.body);
    } catch {
      return null;
    }
  })();
  return {
    status: res.status,
    headers: {
      get(name) {
        const v = res.headers[String(name).toLowerCase()];
        if (v == null) return null;
        return Array.isArray(v) ? v[0] : v;
      },
    },
    cookies: {
      get(name) {
        return cookieValue(res.headers['set-cookie'], name);
      },
    },
    json: async () => parsed,
    text: async () => res.body,
    clone() {
      return wrap(res);
    },
  };
}

const PASSWORD = 'original-pass-99';

function makeAccount(username, role = 'operator') {
  createAccount({ username, password: PASSWORD, role });
  return username;
}

/** Log in and return the cookie value the route issued. */
async function login(username, password = PASSWORD) {
  const res = await fetchRaw(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  assert.equal(res.status, 200, `login failed for ${username}: ${res.body}`);
  const token = parseCookie(res.headers['set-cookie']).replace(/^auth_session=/, '');
  assert.ok(token, 'login must set the session cookie');
  return token;
}

function cookieHeader(token) {
  return token === undefined ? {} : { cookie: `${SESSION_COOKIE}=${token}` };
}

/** Run the real gate. 200 = allowed through, anything else = rejected. */
function gate(pathname, token, extraHeaders = {}) {
  return fetchRaw(`${base}${pathname}`, {
    headers: { ...cookieHeader(token), ...extraHeaders },
  }).then(wrap);
}

const allowed = async (token, pathname = '/api/services') =>
  (await gate(pathname, token)).status === 200;

function decodePayload(token) {
  return JSON.parse(
    Buffer.from(token.slice(0, token.indexOf('.')), 'base64url').toString('utf8')
  );
}

function changePassword(token, body) {
  return fetchRaw(`${base}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...cookieHeader(token),
    },
    body: JSON.stringify(body),
  }).then(wrap);
}

function logout(token) {
  return fetchRaw(`${base}/api/auth/logout`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...cookieHeader(token),
    },
  }).then(wrap);
}

function logoutForm(token) {
  return fetchRaw(`${base}/api/auth/logout`, {
    method: 'POST',
    headers: cookieHeader(token),
  }).then(wrap);
}

function adminPatchAccount(url, token, body) {
  return fetchRaw(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...cookieHeader(token),
    },
    body: JSON.stringify(body),
  }).then(wrap);
}

test('a fresh cookie carries a random sid and the account token version', async () => {
  const user = makeAccount('sid-user');
  const a = await login(user);
  const b = await login(user);

  const first = decodePayload(a);
  const second = decodePayload(b);

  assert.equal(typeof first.sid, 'string');
  assert.ok(first.sid.length >= 8);
  assert.notEqual(first.sid, second.sid, 'each login gets its own sid');
  assert.equal(first.tv, 1);
  assert.equal(first.uid, getAccountByUsername(user).id);
});

test('a legacy cookie without sid/tv fails closed', async () => {
  const user = makeAccount('legacy-user');
  const uid = getAccountByUsername(user).id;

  const payload = Buffer.from(
    JSON.stringify({
      uid,
      role: 'operator',
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  ).toString('base64url');
  const sig = createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  const legacy = `${payload}.${sig}`;

  // The signature is genuine — only the missing fields make it invalid.
  assert.equal(await verifySession(legacy), null);
  assert.equal((await gate('/api/services', legacy)).status, 401);
  assert.equal((await gate('/services', legacy)).status, 307);
});

test('logout revokes one session and leaves other devices signed in', async () => {
  const user = makeAccount('two-device-user');
  const deviceA = await login(user);
  const deviceB = await login(user);

  assert.ok(await allowed(deviceA));
  assert.ok(await allowed(deviceB));

  const res = await logout(deviceA);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(isSessionRevoked(decodePayload(deviceA).sid), true);
  assert.equal(isSessionRevoked(decodePayload(deviceB).sid), false);

  assert.equal(await allowed(deviceA), false, 'logged-out cookie must be dead');
  assert.equal(await allowed(deviceB), true, 'other device stays signed in');
});

test('a form logout still 303s to /login and clears the cookie', async () => {
  const user = makeAccount('form-logout-user');
  const token = await login(user);

  const res = await logoutForm(token);
  assert.equal(res.status, 303);
  assert.equal(new URL(res.headers.get('location'), 'http://localhost').pathname, '/login');

  const cleared = res.cookies.get(SESSION_COOKIE);
  assert.equal(cleared.value, '');
  assert.equal(cleared.maxAge, 0);
  assert.equal(isSessionRevoked(decodePayload(token).sid), true);
  assert.equal(await allowed(token), false);
});

test('a revoked cookie is 401 on an API route and a redirect on a page', async () => {
  const user = makeAccount('replay-user');
  const token = await login(user);
  await logout(token);

  const api = await gate('/api/services', token);
  assert.equal(api.status, 401);
  assert.deepEqual(await api.json(), { error: 'Unauthorized' });

  const page = await gate('/services', token);
  assert.equal(page.status, 307);
  const location = new URL(page.headers.get('location'), 'http://localhost');
  assert.equal(location.pathname, '/login');
  assert.equal(location.searchParams.get('next'), '/services');
});

test('requireSession rejects the same revoked cookie', async () => {
  const user = makeAccount('require-user');
  const token = await login(user);

  assert.equal((await gate('/api/session', token)).status, 200);
  await logout(token);
  assert.equal((await gate('/api/session', token)).status, 401);
});

test('password change kills every other session and re-issues the caller', async () => {
  const user = makeAccount('rotate-user');
  const deviceA = await login(user);
  const deviceB = await login(user);

  const res = await changePassword(deviceA, {
    currentPassword: PASSWORD,
    newPassword: 'brand-new-pass-99',
  });
  assert.equal(res.status, 200, JSON.stringify(await res.clone().json()));
  assert.deepEqual(await res.json(), { ok: true });

  const fresh = res.cookies.get(SESSION_COOKIE)?.value;
  assert.ok(fresh, 'the caller must receive a fresh cookie');
  assert.equal(decodePayload(fresh).tv, 2, 'token_version is bumped');

  assert.equal(await allowed(deviceA), false, "the caller's old cookie is dead");
  assert.equal(await allowed(deviceB), false, 'other devices are dead');
  assert.equal(await allowed(fresh), true, 'the caller stays signed in');

  // The password really changed.
  await login(user, 'brand-new-pass-99');
});

test('password change without the current password changes nothing', async () => {
  const user = makeAccount('guard-user');
  const token = await login(user);

  const missing = await changePassword(token, { newPassword: 'attacker-pass-99' });
  assert.equal(missing.status, 400);
  assert.deepEqual(await missing.json(), {
    error: 'Current password is required',
  });

  const wrong = await changePassword(token, {
    currentPassword: 'not-the-password',
    newPassword: 'attacker-pass-99',
  });
  assert.equal(wrong.status, 401);
  assert.deepEqual(await wrong.json(), {
    error: 'Current password is incorrect',
  });

  // No revocation happened and the old password still works.
  assert.equal(await allowed(token), true);
  assert.equal(decodePayload(token).tv, 1);
  await login(user, PASSWORD);
});

test('a short new password is still rejected before anything is revoked', async () => {
  const user = makeAccount('short-pass-user');
  const token = await login(user);

  const res = await changePassword(token, {
    currentPassword: PASSWORD,
    newPassword: 'short',
  });
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), {
    error: 'Password must be at least 8 characters long',
  });
  assert.equal(await allowed(token), true);
});

test('a revoked cookie cannot be used to change the password', async () => {
  const user = makeAccount('revoked-changer');
  const token = await login(user);
  await logout(token);

  const res = await changePassword(token, {
    currentPassword: PASSWORD,
    newPassword: 'attacker-pass-99',
  });
  assert.equal(res.status, 401);
  assert.deepEqual(await res.json(), { error: 'Unauthorized' });
  await login(user, PASSWORD);
});

test('a session for a deleted account is rejected at the gate', async () => {
  const user = makeAccount('vanishing-user');
  const token = await login(user);
  assert.ok(await allowed(token));

  deleteAccount(getAccountByUsername(user).id);
  assert.equal(await allowed(token), false);
});

test('a demoted admin cookie is rejected at the gate', async () => {
  makeAccount('keeper-admin', 'admin');
  const user = makeAccount('demoted-admin', 'admin');
  const token = await login(user);

  assert.equal((await gate('/api/admin/accounts', token)).status, 200);

  updateAccount(getAccountByUsername(user).id, { role: 'operator' });
  assert.equal(await allowed(token), false, 'cookie role no longer matches DB');
});

test('an operator is still 403 on admin paths, not 401', async () => {
  const user = makeAccount('plain-operator');
  const token = await login(user);

  const api = await gate('/api/admin/accounts', token);
  assert.equal(api.status, 403);
  assert.deepEqual(await api.json(), { error: 'Forbidden' });

  const page = await gate('/admin', token);
  assert.equal(page.status, 403);
  assert.equal((await page.text()).trim(), 'Forbidden');
});

test('anonymous requests keep the old 401 / redirect behaviour', async () => {
  const api = await gate('/api/services', undefined);
  assert.equal(api.status, 401);
  assert.deepEqual(await api.json(), { error: 'Unauthorized' });

  const page = await gate('/announcements', undefined);
  assert.equal(page.status, 307);
  assert.equal(
    new URL(page.headers.get('location'), 'http://localhost').pathname,
    '/login'
  );
});

test('an admin password reset revokes the target and re-issues on self-reset', async () => {
  const adminUser = makeAccount('reset-admin', 'admin');
  const target = makeAccount('reset-target');
  const adminToken = await login(adminUser);
  const targetToken = await login(target);
  assert.ok(await allowed(targetToken));

  const patchPassword = (id, password, token) =>
    adminPatchAccount(
      `${base}/api/admin/accounts/${id}`,
      token,
      { password }
    );

  const reset = await patchPassword(
    getAccountByUsername(target).id,
    'admin-issued-pass-99',
    adminToken
  );
  assert.equal(reset.status, 200);
  assert.equal(
    await allowed(targetToken),
    false,
    'an admin reset must kick the target out'
  );
  assert.equal(await allowed(adminToken), true, 'the admin is unaffected');
  await login(target, 'admin-issued-pass-99');

  const selfReset = await patchPassword(
    getAccountByUsername(adminUser).id,
    'admin-own-pass-99',
    adminToken
  );
  assert.equal(selfReset.status, 200);
  const fresh = selfReset.cookies.get(SESSION_COOKIE)?.value;
  assert.ok(fresh, 'a self-reset must re-issue the caller cookie');
  assert.equal(await allowed(adminToken), false, 'the old admin cookie is dead');
  assert.equal(await allowed(fresh), true, 'the admin stays signed in');
});

test('expired revocation rows are pruned instead of accumulating', async () => {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  // Well past `exp` *and* past the retention margin below.
  const ancient = now - SESSION_TTL_SECONDS * 3;
  db.prepare(
    `INSERT OR REPLACE INTO revoked_sessions (sid, expires_at) VALUES (?, ?)`
  ).run('stale-sid', ancient);
  assert.equal(isSessionRevoked('stale-sid'), true);

  // Recording any new revocation cleans up whatever is long dead.
  revokeSession('live-sid', now + 3600);
  assert.equal(isSessionRevoked('stale-sid'), false);
  assert.equal(isSessionRevoked('live-sid'), true);

  db.prepare(
    `INSERT OR REPLACE INTO revoked_sessions (sid, expires_at) VALUES (?, ?)`
  ).run('stale-sid-2', ancient);
  pruneExpiredRevocations();
  const row = db
    .prepare(`SELECT COUNT(*) AS n FROM revoked_sessions WHERE expires_at <= ?`)
    .get(now - SESSION_TTL_SECONDS);
  assert.equal(Number(row.n), 0);
});

test('pruning keeps a margin past exp so a clock step cannot un-revoke', async () => {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  // A cookie that expired a minute ago. Its row is useless *if* the clock is
  // right — but if the host clock ran fast and is later corrected, that same
  // row is still protecting a live cookie. Deleting it would silently and
  // permanently bring a logged-out session back to life, so it stays.
  db.prepare(
    `INSERT OR REPLACE INTO revoked_sessions (sid, expires_at) VALUES (?, ?)`
  ).run('just-expired-sid', now - 60);

  pruneExpiredRevocations();
  assert.equal(
    isSessionRevoked('just-expired-sid'),
    true,
    'a just-expired revocation must survive the prune'
  );

  // The margin is finite: one full TTL past exp and the row is really gone.
  db.prepare(`UPDATE revoked_sessions SET expires_at = ? WHERE sid = ?`).run(
    now - SESSION_TTL_SECONDS - 60,
    'just-expired-sid'
  );
  pruneExpiredRevocations();
  assert.equal(isSessionRevoked('just-expired-sid'), false);
});

test('logout fails closed when the revocation write does not land', { skip: 'Go holds its own SQLite connection; query_only on the Node handle cannot fail the Go write' }, async () => {
  const user = makeAccount('unwritable-logout-user');
  const token = await login(user);
  const db = getDb();

  // Stand in for a full disk / read-only volume / SQLITE_BUSY past the busy
  // timeout: the write throws, so nothing is recorded.
  db.pragma('query_only = true');
  let res;
  try {
    res = await logout(token);
  } finally {
    db.pragma('query_only = false');
  }

  assert.equal(res.status, 500, 'a failed revocation must not report success');
  assert.deepEqual(await res.json(), { error: 'Logout failed' });
  assert.equal(
    res.cookies.get(SESSION_COOKIE),
    undefined,
    'the cookie must survive so the browser is not told it signed out'
  );
  assert.equal(isSessionRevoked(decodePayload(token).sid), false);
  // The token is still live, and the user can see that and retry.
  assert.equal(await allowed(token), true);

  const retry = await logout(token);
  assert.equal(retry.status, 200);
  assert.equal(await allowed(token), false);
});

test('a form logout also fails closed, without redirecting to /login', { skip: 'Go holds its own SQLite connection; query_only on the Node handle cannot fail the Go write' }, async () => {
  const user = makeAccount('unwritable-form-logout-user');
  const token = await login(user);
  const db = getDb();

  db.pragma('query_only = true');
  let res;
  try {
    res = await logoutForm(token);
  } finally {
    db.pragma('query_only = false');
  }

  assert.equal(res.status, 500);
  assert.equal(res.headers.get('location'), null, 'no "you are signed out" 303');
  assert.equal(await allowed(token), true);
});

test('signSession refuses a caller-supplied sid it would not verify', async () => {
  // Nothing passes a `sid` today. The signature allows one, so the guard has
  // to live on the signing side too: `parsePayload` enforces `SID_PATTERN` and
  // `tv >= 1` on verify, and a cookie that cannot verify is a cookie nobody
  // can debug.
  await assert.rejects(
    () => signSession({ uid: 1, role: 'operator', tv: 1, sid: 'no spaces!' }),
    /sid is not a valid session id/
  );
  await assert.rejects(
    () => signSession({ uid: 1, role: 'operator', tv: 1, sid: 'short' }),
    /sid is not a valid session id/
  );
  await assert.rejects(
    () => signSession({ uid: 1, role: 'operator', tv: 0 }),
    /tv must be an integer >= 1/
  );
  await assert.rejects(
    () => signSession({ uid: 1, role: 'operator', tv: 1.5 }),
    /tv must be an integer >= 1/
  );

  // A well-formed explicit sid is still allowed and round-trips.
  const sid = generateSessionId();
  const token = await signSession({ uid: 1, role: 'operator', tv: 1, sid });
  assert.equal((await verifySession(token)).sid, sid);
});

test('the gate marks every response uncacheable', async () => {
  const user = makeAccount('cache-header-user');
  const token = await login(user);

  const expectNoStore = (res, label) => {
    assert.equal(res.headers.get('cache-control'), 'private, no-store', label);
    assert.equal(res.headers.get('vary'), 'Cookie', label);
  };

  // Allowed through: without this a Cloudflare "cache everything" rule could
  // store a rendered deck and serve it without the origin — and so without
  // this gate — ever running again.
  expectNoStore(await gate('/services/1', token), 'allowed page');
  expectNoStore(await gate('/api/services', token), 'allowed api');
  expectNoStore(await gate('/api/services', undefined), '401');
  expectNoStore(await gate('/services', undefined), 'redirect');
  expectNoStore(await gate('/api/admin/accounts', token), '403 api');
  expectNoStore(await gate('/admin', token), '403 page');
});
