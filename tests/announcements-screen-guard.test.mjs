/**
 * Guard: no route, nav item, or component references `/announcements` any more.
 * Scans `spa/src/`, `src/components/`, `src/operator/`, and Go files in `internal/`.
 *
 * Excludes `src/operator/CreateForm.tsx` for now;
 * a parallel slice removes that and this exclusion must then be deleted.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const SCAN_DIRS = [
  path.join(ROOT, 'spa', 'src'),
  path.join(ROOT, 'src', 'components'),
  path.join(ROOT, 'src', 'operator'),
  path.join(ROOT, 'internal'),
];

// Excluded: src/operator/CreateForm.tsx is removed by a parallel slice
const EXCLUDED_FILES = new Set([
  path.normalize('src/operator/CreateForm.tsx'),
]);

function listSourceFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listSourceFiles(full, out);
      continue;
    }
    if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (
        ext === '.tsx' ||
        ext === '.ts' ||
        ext === '.jsx' ||
        ext === '.js' ||
        (ext === '.go' && !entry.name.endsWith('_test.go'))
      ) {
        out.push(full);
      }
    }
  }
  return out;
}

function relPosix(absPath) {
  return path.relative(ROOT, absPath).split(path.sep).join('/');
}

export function scanSource(source, rel) {
  if (EXCLUDED_FILES.has(path.normalize(rel))) return [];

  const findings = [];
  const lines = source.split('\n');
  const isGo = rel.endsWith('.go');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;

    if (isGo) {
      // In Go files, check for route matching or SPA path checks on "announcements" or "/announcements".
      // Excludes:
      // - SQL table names like announcement_items, announcement_sets, announcement_set_slides
      // - JSON request fields like "announcements" (e.g., webhook payload)
      // - Plan request IDs or template IDs
      if (
        /(['"`])\/announcements(?:\/|\1)/.test(line) ||
        /\brel\s*==\s*["']announcements["']/.test(line) ||
        /["']\/announcements["']/.test(line)
      ) {
        findings.push({ rel, lineNo, line: line.trim() });
      }
    } else {
      // Check for UI route or navigation/link references or API endpoint calls to /announcements or /api/announcements.
      // Matches href="/announcements", path="/announcements", to="/announcements", "/api/announcements", or exact "/announcements".
      if (/(['"`])(?:\/api)?\/announcements(?:\/|\1)/.test(line)) {
        findings.push({ rel, lineNo, line: line.trim() });
      }
    }
  }
  return findings;
}

function scanFile(absPath) {
  return scanSource(readFileSync(absPath, 'utf8'), relPosix(absPath));
}

export function allAnnouncementsFindings() {
  const files = SCAN_DIRS.flatMap((dir) => listSourceFiles(dir));
  return files.flatMap(scanFile);
}

test('no route, nav item, or component references /announcements', () => {
  const findings = allAnnouncementsFindings();
  assert.deepEqual(
    findings,
    [],
    findings.length
      ? `Found /announcements references:\n${findings
          .map((f) => `  ${f.rel}:${f.lineNo} ${f.line}`)
          .join('\n')}`
      : undefined
  );
});

test('guard proof: injected /announcements reference is detected', () => {
  const probe = '<CustomLink href="/announcements">Announcements</CustomLink>';
  const findings = scanSource(probe, 'src/components/Header.tsx');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].lineNo, 1);
});

test('guard proof: injected /api/announcements fetch reference is detected', () => {
  const probe = 'const res = await fetch(\'/api/announcements\');';
  const findings = scanSource(probe, 'spa/src/pages/RunSheetPage.tsx');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].lineNo, 1);
});

test('guard proof: injected Go route reference is detected', () => {
  const probe = '\tif rel == "announcements" {\n\t\t// fallback\n\t}';
  const findings = scanSource(probe, 'internal/httpapi/server.go');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].lineNo, 1);
});
