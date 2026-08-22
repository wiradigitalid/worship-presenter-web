/**
 * Guard test against multi-argument translator calls across src/ and spa/src/.
 *
 * `LocaleApi.t` takes exactly one argument `(key: I18nKey) => string`.
 * Any call like `t('some.key', { ... })` drops the params object and leaks
 * raw template placeholders (e.g. `{n}`) to the screen.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SCAN_ROOTS = [path.join(ROOT, 'src'), path.join(ROOT, 'spa', 'src')];

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

function listTsFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listTsFiles(full, out);
      continue;
    }
    if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      out.push(full);
    }
  }
  return out;
}

function relPosix(absPath) {
  return path.relative(ROOT, absPath).split(path.sep).join('/');
}

export function scanTranslatorCalls(source, rel) {
  const findings = [];
  const clean = stripComments(source);
  // Match t('key', or t("key", across multiple lines
  const pattern = /\bt\(\s*['"][^'"]+['"]\s*,/g;
  let match;

  while ((match = pattern.exec(clean)) !== null) {
    const matchIndex = match.index;
    // Derive line number from the match offset in clean
    const lineNo = clean.slice(0, matchIndex).split('\n').length;
    // Find the full line text where the call starts
    const lineStart = clean.lastIndexOf('\n', matchIndex) + 1;
    let lineEnd = clean.indexOf('\n', matchIndex);
    if (lineEnd === -1) lineEnd = clean.length;
    const line = clean.slice(lineStart, lineEnd).trim();

    findings.push({
      rel,
      lineNo,
      line,
    });
  }
  return findings;
}

function scanFile(absPath) {
  return scanTranslatorCalls(readFileSync(absPath, 'utf8'), relPosix(absPath));
}

function allFindings() {
  const files = SCAN_ROOTS.flatMap((dir) => listTsFiles(dir));
  return files.flatMap(scanFile);
}

test('src/ and spa/src/ contain no multi-argument translator calls t(key, params)', () => {
  const findings = allFindings();
  assert.deepEqual(
    findings,
    [],
    findings.length
      ? `Found multi-argument translator calls:\n${findings
          .map((f) => `  ${f.rel}:${f.lineNo} ${f.line}`)
          .join('\n')}`
      : undefined
  );
});

test('guard proof: multi-arg t() call with params object is detected', () => {
  assert.deepEqual(
    scanTranslatorCalls("return t('form.preview.role.verse', { n: 1 });", 'src/lib/artifacts/preview-model.ts'),
    [
      {
        rel: 'src/lib/artifacts/preview-model.ts',
        lineNo: 1,
        line: "return t('form.preview.role.verse', { n: 1 });",
      },
    ]
  );
});

test('guard proof: wrapped multi-line t() call is detected', () => {
  const wrappedCall = `const x = t('form.preview.role.verse',\n  { n: 1 });`;
  assert.deepEqual(
    scanTranslatorCalls(wrappedCall, 'src/example.ts'),
    [
      {
        rel: 'src/example.ts',
        lineNo: 1,
        line: "const x = t('form.preview.role.verse',",
      },
    ]
  );
});
