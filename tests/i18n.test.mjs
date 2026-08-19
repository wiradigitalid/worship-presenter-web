/**
 * Story 24.1 — UI string catalogue, `ui_locale` setting, and room-facing closure.
 *
 * The resolver and settings coercion are pure/server logic. HTTP validate-before-write
 * for settings lives in `tests/hub-go-http.test.mjs`. The projected-tree walk reuses
 * the same roots as `tests/theme-chrome.test.mjs` and asserts no module in that
 * tree imports the catalogue or reads `ui_locale` / `getUiLocale`.
 *
 * `<html lang>` in the operator root is the deliberate document-level use.
 * Story 17.7's sibling projected root does not read `ui_locale` at all.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import {
  discoverLocalModuleImports,
  discoverModuleGraph,
  discoverProjectedRoutes,
} from './helpers/projected-routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const repoRoot = root;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-test-'));
const previousDbPath = process.env.DB_PATH;
const previousAuthSecret = process.env.AUTH_SECRET;
process.env.DB_PATH = path.join(tmp, 'test.db');
process.env.AUTH_SECRET = 'i18n-test-secret-0123456789';

const srcUrl = (...parts) => pathToFileURL(path.join(root, 'src', ...parts)).href;

const {
  asUiLocale,
  catalogueKeys,
  missingKeyMarker,
  resolveString,
  UI_LOCALE_ORDER,
} = await import(srcUrl('lib', 'i18n', 'index.ts'));
const { I18N_KEYS } = await import(srcUrl('lib', 'i18n', 'keys.ts'));
const {
  setSetting,
  getUiLocale,
  setUiLocale,
} = await import(srcUrl('lib', 'settings.ts'));

after(() => {
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

const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

/** Same structurally discovered roots as `tests/theme-chrome.test.mjs`. */
const PROJECTED = discoverProjectedRoutes(repoRoot).specialFiles;

const ROOM_FACING_LIB = ['src/lib/pptx.ts'];

function moduleImports(file) {
  return discoverLocalModuleImports(repoRoot, file).map(({ resolved }) => resolved);
}

function projectedTree() {
  return discoverModuleGraph(repoRoot, PROJECTED).map(({ file }) => file);
}

/**
 * Catalogue text lives in every i18n module except the two that carry none:
 * `locale.ts` is the locale vocabulary and coercion, which `settings.ts`
 * legitimately reaches for, and `keys.ts` is the key list. Derived from the
 * directory rather than hand-listed, so a catalogue module added by Story 24.2
 * is covered the moment it exists.
 */
const I18N_TEXT_FREE = new Set(['locale.ts', 'keys.ts']);
const CATALOGUE_MODULES = new Set(
  fs
    .readdirSync(path.join(repoRoot, 'src', 'lib', 'i18n'))
    .filter((entry) => entry.endsWith('.ts') && !I18N_TEXT_FREE.has(entry))
    .map((entry) => `src/lib/i18n/${entry}`)
);

const UI_LOCALE_READ = /\bgetUiLocale\b/;

/**
 * `src/lib/settings.ts` is in the projected tree — the projector reads
 * `slide_transition` through it — and it is also where `getUiLocale` is
 * *defined*. Strip the declaration so the guard still catches a *call* from
 * anywhere in that file, rather than skipping the file wholesale: skipping it
 * is what let the catalogue reach the projector's module graph once already.
 */
function callSites(file, source) {
  return file === 'src/lib/settings.ts'
    ? source.replace(/export function getUiLocale\b/g, '')
    : source;
}

test('catalogue key sets match across locales', () => {
  assert.deepEqual(catalogueKeys('en'), catalogueKeys('id'));
  assert.ok(catalogueKeys('en').length > 0);
});

test('I18N_KEYS matches each shipped catalogue table', () => {
  const expected = [...I18N_KEYS].sort();
  assert.deepEqual(catalogueKeys('en'), expected);
  assert.deepEqual(catalogueKeys('id'), expected);
});

test('every shipped locale has its own switcher label and confirmation', () => {
  // The switcher derives these keys from the locale code rather than branching
  // on it, so a locale added to UI_LOCALE_ORDER with no entry of its own is a
  // compile error and a red suite — never a dropdown quietly wearing another
  // language's name.
  const keys = new Set(I18N_KEYS);
  const missing = UI_LOCALE_ORDER.flatMap((code) =>
    [`admin.uiLocale.option.${code}`, `admin.uiLocale.saved.${code}`].filter(
      (key) => !keys.has(key)
    )
  );
  assert.deepEqual(missing, []);
});

test('resolveString returns catalogue text for a known key', () => {
  assert.equal(
    resolveString('admin.uiLocale.title', 'en'),
    'Interface language'
  );
  assert.equal(
    resolveString('admin.uiLocale.title', 'id'),
    'Bahasa antarmuka'
  );
});

test('asUiLocale coerces junk stored values to en', () => {
  assert.equal(asUiLocale('xx'), 'en');
  assert.equal(asUiLocale(undefined), 'en');
  assert.equal(asUiLocale('id'), 'id');
});

test('getUiLocale coerces a junk settings row and logs', () => {
  setSetting('ui_locale', 'not-a-locale');
  const errors = [];
  const original = console.error;
  console.error = (...args) => errors.push(args.join(' '));
  try {
    assert.equal(getUiLocale(), 'en');
    assert.ok(errors.some((line) => line.includes('ui_locale')));
  } finally {
    console.error = original;
    setSetting('ui_locale', 'en');
  }
});

test('missing key is a visible defect, not blank and not English', () => {
  const errors = [];
  const original = console.error;
  console.error = (...args) => errors.push(args.join(' '));
  try {
    const marker = resolveString('admin.uiLocale.__missing__', 'id');
    assert.equal(marker, missingKeyMarker('admin.uiLocale.__missing__'));
    assert.ok(marker.includes('admin.uiLocale.__missing__'));
    assert.notEqual(marker, resolveString('admin.uiLocale.title', 'en'));
    assert.notEqual(marker, '');
    assert.ok(
      errors.some((line) => line.includes('admin.uiLocale.__missing__'))
    );
  } finally {
    console.error = original;
  }
});

test('setUiLocale rejects unknown locales', () => {
  assert.throws(() => setUiLocale('fr'), /ui_locale must be one of/);
});

test('the operator SPA shell applies ui_locale without mounting on projected routes', () => {
  const app = read('spa/src/App.tsx');
  assert.match(app, /OperatorDocumentLang/);
  const block = /if \(projected\) \{[\s\S]*?\n  \}/.exec(app);
  assert.ok(block);
  assert.doesNotMatch(block[0], /OperatorDocumentLang|ui-locale-document|getUiLocale/);
});

test('the projected tree does not reach catalogue text or call getUiLocale', () => {
  const offenders = [];
  for (const file of projectedTree()) {
    for (const imported of moduleImports(file)) {
      if (CATALOGUE_MODULES.has(imported)) {
        offenders.push(`${file}: imports ${imported}`);
      }
    }
    if (UI_LOCALE_READ.test(callSites(file, read(file)))) {
      offenders.push(`${file}: getUiLocale call`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `room-facing modules must not reach catalogue text or call getUiLocale ` +
      `(only the sibling operator root applies ui_locale to document lang). ` +
      `Found: ${offenders.join(' | ')}`
  );
});

test('settings.ts stays out of the catalogue, keeping it off the projector', () => {
  // The projector reaches `settings.ts` for `slide_transition`, so an import of
  // the i18n barrel here pulls both catalogue tables into the room-facing module
  // graph. It did once. `./i18n/locale` — vocabulary and coercion, no text — is
  // the only i18n module this file may import.
  const imported = moduleImports('src/lib/settings.ts');
  assert.deepEqual(
    imported.filter((f) => CATALOGUE_MODULES.has(f)),
    []
  );
  assert.ok(imported.includes('src/lib/i18n/locale.ts'));
});

test('pptx generation does not reach catalogue text or read ui_locale', () => {
  for (const file of ROOM_FACING_LIB) {
    assert.deepEqual(
      moduleImports(file).filter((f) => CATALOGUE_MODULES.has(f)),
      [],
      `${file} must not import catalogue text`
    );
    assert.ok(
      !UI_LOCALE_READ.test(read(file)),
      `${file} must not call getUiLocale`
    );
  }
});
