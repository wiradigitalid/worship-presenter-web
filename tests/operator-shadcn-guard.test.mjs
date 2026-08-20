/**
 * Operator chrome uses shadcn/ui primitives from `src/components/ui/`.
 * Hand-rolled `<button>`, `<select>`, and most `<input>` tags drift from the
 * design system and bypass focus/contrast work already encoded in the primitives.
 *
 * Enforced here — not only in DESIGN.md — so a new form field cannot ship as raw
 * HTML by accident. The top navbar (`Header.tsx`, `ThemeToggle.tsx`) is exempt:
 * its pill layout and profile trigger are bespoke chrome, not generic controls.
 */
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

const ALLOWLIST = new Set([
  path.normalize('src/components/Header.tsx'),
  path.normalize('src/components/ThemeToggle.tsx'),
]);

const ALLOWED_INPUT_TYPES = new Set(['file', 'color', 'hidden']);

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

function listTsxFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'ui') continue;
      listTsxFiles(full, out);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.tsx')) out.push(full);
  }
  return out;
}

function relPosix(absPath) {
  return path.relative(ROOT, absPath).split(path.sep).join('/');
}

function scanSource(source, rel) {
  if (ALLOWLIST.has(path.normalize(rel))) return [];
  if (rel.includes('/components/ui/')) return [];

  const findings = [];
  const lines = stripComments(source).split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;

    if (/<button\b/.test(line)) {
      findings.push({ rel, lineNo, kind: 'button', line: line.trim() });
      continue;
    }
    if (/<select\b/.test(line)) {
      findings.push({ rel, lineNo, kind: 'select', line: line.trim() });
      continue;
    }
    const input = line.match(/<input\b([^>/]*)(?:\/>|>)/);
    if (!input) continue;
    const attrs = input[1] ?? '';
    const typeMatch = attrs.match(/type\s*=\s*["']([^"']+)["']/);
    const type = typeMatch?.[1] ?? 'text';
    if (!ALLOWED_INPUT_TYPES.has(type)) {
      findings.push({
        rel,
        lineNo,
        kind: `input type="${type}"`,
        line: line.trim(),
      });
    }
  }
  return findings;
}

function scanFile(absPath) {
  return scanSource(readFileSync(absPath, 'utf8'), relPosix(absPath));
}

function allFindings() {
  const files = SCAN_ROOTS.flatMap((dir) => listTsxFiles(dir));
  return files.flatMap(scanFile);
}

test('operator surfaces use shadcn primitives instead of raw button/select/input', () => {
  const findings = allFindings();
  assert.deepEqual(
    findings,
    [],
    findings.length
      ? `Use @/components/ui/* instead of native controls:\n${findings
          .map((f) => `  ${f.rel}:${f.lineNo} <${f.kind}> ${f.line}`)
          .join('\n')}`
      : undefined
  );
});

test('guard proof: raw button and select are reported; file input is allowed', () => {
  assert.deepEqual(
    scanSource('return <button type="button">Save</button>;', 'probe.tsx'),
    [{ rel: 'probe.tsx', lineNo: 1, kind: 'button', line: 'return <button type="button">Save</button>;' }]
  );
  assert.deepEqual(
    scanSource('<select id="x" />', 'probe.tsx'),
    [{ rel: 'probe.tsx', lineNo: 1, kind: 'select', line: '<select id="x" />' }]
  );
  assert.deepEqual(scanSource('<input type="file" />', 'probe.tsx'), []);
  assert.deepEqual(scanSource('<input type="color" />', 'probe.tsx'), []);
  assert.deepEqual(
    scanSource('<input className="w-full" />', 'probe.tsx'),
    [
      {
        rel: 'probe.tsx',
        lineNo: 1,
        kind: 'input type="text"',
        line: '<input className="w-full" />',
      },
    ]
  );
  assert.deepEqual(scanSource('', 'src/components/Header.tsx'), []);
});
