/**
 * Next.js must not return as the live runtime.
 *
 * Surfaces this guard actually protects (and only these):
 * - `package.json` dependency / devDependency / optionalDependency /
 *   peerDependency names `next` and `eslint-config-next` (JSON keys — tsc
 *   does not constrain them)
 * - `package-lock.json` `packages` paths `node_modules/next` and
 *   `node_modules/next/*` (JSON — not `node_modules/next-themes`)
 * - import / `import()` / `require()` of `next` or `next/<anything except
 *   themes>` in `src/`, `spa/src/`, `tests/`, `scripts/` (untyped `.mjs`
 *   included; tsc only covers `.ts`/`.tsx`)
 * - `node_modules/next/` spawn paths in `scripts/`
 * - App Router special basenames under `src/` and `spa/src/` (`page`,
 *   `layout`, `loading`, `template`, `default`, `not-found`, `error`, `route`)
 * - repo-root `next.config.*` and `next-env.d.ts`
 *
 * It does NOT cover `next-themes` (a separate theme library AD-24 rests on),
 * historical `_bmad-output/` prose, or TypeScript's `esnext` lib name.
 *
 * Proof (re-runnable; inject, watch fail, revert — 2026-08-19):
 * 1. JSON dep: `"next": "16.2.10"` under package.json dependencies →
 *    "package.json must not depend on Next.js" fails.
 * 2. JSON dep: `"eslint-config-next": "16.2.10"` under devDependencies →
 *    same assertion fails.
 * 3. JSON lock: packages key `node_modules/next` →
 *    "package-lock.json must not install Next.js" fails.
 * 4. JSON lock: packages key `node_modules/next/dist` → same assertion fails.
 * 5. TS import: `import x from 'next/link'` in src/components/Link.tsx →
 *    "source must not import Next.js modules" fails.
 * 6. mjs import: `import x from 'next/navigation'` in scripts/dev.mjs →
 *    same assertion fails.
 * 7. mjs require: `require('next/server')` in scripts/dev.mjs → same.
 * 8. mjs dynamic import: `import('next/headers')` in scripts/dev.mjs → same.
 * 9. spawn path: `node_modules/next/dist/bin/next` in scripts/dev.mjs →
 *    "scripts must not spawn the Next.js binary" fails.
 * 10. App Router page: `src/operator/page.tsx` →
 *    "source must not contain App Router special files" fails.
 * 11. App Router layout: `spa/src/layout.tsx` → same.
 * 12. App Router API route: `src/lib/route.ts` → same.
 * 13. App Router fallback: `spa/src/pages/not-found.tsx` → same.
 * 14. Config: `next.config.ts` at repo root → same.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const THIS_FILE = path.basename(fileURLToPath(import.meta.url));

const FORBIDDEN_DEP_NAMES = new Set(['next', 'eslint-config-next']);
const IMPORT_RE =
  /^[ \t]*(?:import(?:\s+type)?[\s\S]*?\sfrom\s+|import\s+)\s*['"]next(?:\/(?!themes\b)[^'"]*)?['"]/m;
const DYNAMIC_IMPORT_RE =
  /import\s*\(\s*['"]next(?:\/(?!themes\b)[^'"]*)?['"]\s*\)/;
const REQUIRE_RE =
  /require\s*\(\s*['"]next(?:\/(?!themes\b)[^'"]*)?['"]\s*\)/;
const NEXT_BIN_RE = /node_modules[/\\]next(?:\/|['"])/;

function isNextLockPath(pkgPath) {
  return pkgPath === 'node_modules/next' || pkgPath.startsWith('node_modules/next/');
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

function sourceFiles() {
  const files = [];
  for (const rel of ['src', path.join('spa', 'src'), 'tests', 'scripts']) {
    walk(path.join(root, rel), files);
  }
  return files.filter((file) => {
    if (path.basename(file) === THIS_FILE) return false;
    return /\.(ts|tsx|mts|js|mjs|cjs)$/.test(file);
  });
}

test('package.json must not depend on Next.js', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const hits = [];
  for (const field of [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
  ]) {
    for (const name of Object.keys(pkg[field] ?? {})) {
      if (FORBIDDEN_DEP_NAMES.has(name)) hits.push(`${field}.${name}`);
    }
  }
  assert.deepEqual(hits, [], `Next.js returned as a package.json dependency: ${hits.join(', ')}`);
});

test('package-lock.json must not install Next.js', () => {
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  const hits = Object.keys(lock.packages ?? {}).filter(isNextLockPath);
  assert.deepEqual(hits, [], `Next.js returned in the lockfile: ${hits.join(', ')}`);
});

test('source must not import Next.js modules', () => {
  const hits = [];
  for (const file of sourceFiles()) {
    const text = fs.readFileSync(file, 'utf8');
    if (IMPORT_RE.test(text) || DYNAMIC_IMPORT_RE.test(text) || REQUIRE_RE.test(text)) {
      hits.push(path.relative(root, file).replaceAll('\\', '/'));
    }
  }
  assert.deepEqual(hits, [], `Next.js import specifier returned in: ${hits.join(', ')}`);
});

test('scripts must not spawn the Next.js binary', () => {
  const hits = [];
  const dir = path.join(root, 'scripts');
  for (const file of walk(dir)) {
    if (!/\.(mjs|js|cjs)$/.test(file)) continue;
    const text = fs.readFileSync(file, 'utf8');
    if (NEXT_BIN_RE.test(text)) {
      hits.push(path.relative(root, file).replaceAll('\\', '/'));
    }
  }
  assert.deepEqual(hits, [], `scripts still spawn node_modules/next: ${hits.join(', ')}`);
});

const APP_ROUTER_BASENAMES = new Set([
  'page.tsx',
  'page.ts',
  'page.jsx',
  'page.js',
  'layout.tsx',
  'layout.ts',
  'layout.jsx',
  'layout.js',
  'loading.tsx',
  'loading.ts',
  'template.tsx',
  'template.ts',
  'default.tsx',
  'default.ts',
  'not-found.tsx',
  'not-found.ts',
  'error.tsx',
  'error.ts',
  'route.ts',
  'route.js',
]);

const APP_ROUTER_CONFIG = ['next.config.ts', 'next.config.js', 'next.config.mjs', 'next-env.d.ts'];

test('source must not contain App Router special files', () => {
  const hits = [];
  for (const rel of ['src', path.join('spa', 'src')]) {
    for (const file of walk(path.join(root, rel))) {
      if (APP_ROUTER_BASENAMES.has(path.basename(file))) {
        hits.push(path.relative(root, file).replaceAll('\\', '/'));
      }
    }
  }
  for (const name of APP_ROUTER_CONFIG) {
    if (fs.existsSync(path.join(root, name))) hits.push(name);
  }
  assert.deepEqual(hits, [], `App Router special file returned: ${hits.join(', ')}`);
});
