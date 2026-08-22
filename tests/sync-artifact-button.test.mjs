import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const BUTTON_FILE = path.join(ROOT, 'src', 'operator', 'SyncArtifactButton.tsx');

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

export function scanSyncArtifactSource(source, rel = 'SyncArtifactButton.tsx') {
  const findings = [];
  const clean = stripComments(source);
  const lines = clean.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;

    // Absence check 1: Announcement flyers / legacy confirm copy
    if (/announcement\s+flyers/i.test(line)) {
      findings.push({
        rel,
        lineNo,
        kind: 'legacy-announcement-flyers-copy',
        line: line.trim(),
      });
    }

    // Absence check 2: Hardcoded unlocalized strings in JSX/handlers
    if (/['"]Sync Artifact['"]/.test(line) || /['"]Syncing…['"]/.test(line)) {
      findings.push({
        rel,
        lineNo,
        kind: 'unlocalized-button-label',
        line: line.trim(),
      });
    }

    if (/window\.confirm\s*\(\s*['"`]Replace/.test(line)) {
      findings.push({
        rel,
        lineNo,
        kind: 'hardcoded-confirm-dialog',
        line: line.trim(),
      });
    }
  }
  return findings;
}

test('SyncArtifactButton contains no legacy announcement copy and no hardcoded English literals', () => {
  const content = readFileSync(BUTTON_FILE, 'utf8');
  const findings = scanSyncArtifactSource(content);
  assert.deepEqual(
    findings,
    [],
    findings.length
      ? `Found forbidden copy in SyncArtifactButton.tsx:\n${findings
          .map((f) => `  ${f.rel}:${f.lineNo} [${f.kind}] ${f.line}`)
          .join('\n')}`
      : undefined
  );
});

test('SyncArtifactButton uses i18n useT, sonner toast, and supports onSuccess callback', () => {
  const content = readFileSync(BUTTON_FILE, 'utf8');
  assert.match(content, /import\s*\{[^}]*useT[^}]*\}\s*from\s*['"]@\/lib\/i18n\/operator['"]/);
  assert.match(content, /import\s*\{[^}]*toast[^}]*\}\s*from\s*['"]sonner['"]/);
  assert.match(content, /toast\.success\s*\(\s*t\(\s*['"]sync\.success['"]\s*\)\s*\)/);
  assert.match(content, /toast\.error\s*\(/);
  assert.match(content, /onSuccess\?:/);
  assert.match(content, /if\s*\(\s*onSuccess\s*\)\s*\{\s*await\s+onSuccess\(/);
  assert.match(content, /t\(\s*['"]sync\.confirm['"]\s*\)/);
  assert.match(content, /t\(\s*['"]sync\.label['"]\s*\)/);
  assert.match(content, /t\(\s*['"]sync\.syncing['"]\s*\)/);
});

test('guard proof: absence guard detects legacy announcement copy and unlocalized strings when injected', () => {
  const probeLegacy = `
    if (!window.confirm('Replace frozen structure? Announcement flyers stay this Service’s list.')) return;
  `;
  const probeUnlocalized = `
    <Button>{busy ? 'Syncing…' : 'Sync Artifact'}</Button>
  `;
  const probeHardcodedConfirm = `
    if (!window.confirm('Replace this Service’s frozen deck structure with the live Artifact Registry?')) return;
  `;

  assert.deepEqual(
    scanSyncArtifactSource(probeLegacy, 'probeLegacy.tsx'),
    [
      {
        rel: 'probeLegacy.tsx',
        lineNo: 2,
        kind: 'legacy-announcement-flyers-copy',
        line: "if (!window.confirm('Replace frozen structure? Announcement flyers stay this Service’s list.')) return;",
      },
      {
        rel: 'probeLegacy.tsx',
        lineNo: 2,
        kind: 'hardcoded-confirm-dialog',
        line: "if (!window.confirm('Replace frozen structure? Announcement flyers stay this Service’s list.')) return;",
      },
    ]
  );

  assert.deepEqual(
    scanSyncArtifactSource(probeUnlocalized, 'probeUnlocalized.tsx'),
    [
      {
        rel: 'probeUnlocalized.tsx',
        lineNo: 2,
        kind: 'unlocalized-button-label',
        line: "<Button>{busy ? 'Syncing…' : 'Sync Artifact'}</Button>",
      },
    ]
  );

  assert.deepEqual(
    scanSyncArtifactSource(probeHardcodedConfirm, 'probeHardcodedConfirm.tsx'),
    [
      {
        rel: 'probeHardcodedConfirm.tsx',
        lineNo: 2,
        kind: 'hardcoded-confirm-dialog',
        line: "if (!window.confirm('Replace this Service’s frozen deck structure with the live Artifact Registry?')) return;",
      },
    ]
  );
});
