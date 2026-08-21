import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const SCAN_ROOTS = [
  path.join(ROOT, 'src', 'operator'),
  path.join(ROOT, 'src', 'components'),
  path.join(ROOT, 'spa', 'src', 'pages'),
];

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

function listTsxFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listTsxFiles(full, out);
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

export function scanSourceForRouterRefresh(source, rel) {
  const findings = [];
  const lines = stripComments(source).split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;

    if (/\brouter\.refresh\s*\(/.test(line)) {
      findings.push({ rel, lineNo, kind: 'router.refresh()', line: line.trim() });
    }
    if (/\bnavigate\s*\(\s*0\s*\)/.test(line)) {
      findings.push({ rel, lineNo, kind: 'navigate(0)', line: line.trim() });
    }
  }
  return findings;
}

function scanFile(absPath) {
  return scanSourceForRouterRefresh(readFileSync(absPath, 'utf8'), relPosix(absPath));
}

function allFindings() {
  const files = SCAN_ROOTS.flatMap((dir) => listTsxFiles(dir));
  return files.flatMap(scanFile);
}

test('no operator surfaces or components call router.refresh() or navigate(0)', () => {
  const findings = allFindings();
  assert.deepEqual(
    findings,
    [],
    findings.length
      ? `Found router.refresh() or navigate(0) calls:\n${findings
          .map((f) => `  ${f.rel}:${f.lineNo} <${f.kind}> ${f.line}`)
          .join('\n')}`
      : undefined
  );
});

test('guard proof: router.refresh() and navigate(0) are detected when injected', () => {
  assert.deepEqual(
    scanSourceForRouterRefresh('router.refresh();', 'probe.tsx'),
    [{ rel: 'probe.tsx', lineNo: 1, kind: 'router.refresh()', line: 'router.refresh();' }]
  );
  assert.deepEqual(
    scanSourceForRouterRefresh('navigate(0);', 'probe.tsx'),
    [{ rel: 'probe.tsx', lineNo: 1, kind: 'navigate(0)', line: 'navigate(0);' }]
  );
  assert.deepEqual(
    scanSourceForRouterRefresh('// router.refresh() in comments\n/* navigate(0) */', 'probe.tsx'),
    []
  );
});
