import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = (...parts) => pathToFileURL(path.join(repoRoot, ...parts)).href;
const { claimProjectedShell, resetProjectedShellForTest } = await import(
  source('src', 'lib', 'projected-shell.ts')
);

afterEach(() => resetProjectedShellForTest());

function documentStub(label) {
  return {
    documentElement: {
      style: {
        overflow: `${label}-root-overflow`,
        scrollbarGutter: `${label}-gutter`,
        backgroundColor: `${label}-root-background`,
      },
    },
    body: {
      style: {
        overflow: `${label}-body-overflow`,
        scrollbarGutter: '',
        backgroundColor: `${label}-body-background`,
      },
    },
  };
}

function assertClaimed(doc) {
  assert.equal(doc.documentElement.style.overflow, 'hidden');
  assert.equal(doc.body.style.overflow, 'hidden');
  assert.equal(doc.documentElement.style.scrollbarGutter, 'auto');
  assert.equal(doc.documentElement.style.backgroundColor, '#000000');
  assert.equal(doc.body.style.backgroundColor, '#000000');
}

function assertRestored(doc, label) {
  assert.equal(doc.documentElement.style.overflow, `${label}-root-overflow`);
  assert.equal(doc.body.style.overflow, `${label}-body-overflow`);
  assert.equal(doc.documentElement.style.scrollbarGutter, `${label}-gutter`);
  assert.equal(doc.documentElement.style.backgroundColor, `${label}-root-background`);
  assert.equal(doc.body.style.backgroundColor, `${label}-body-background`);
}

test('Story 17.7: distinct documents keep independent nested claims and restores', () => {
  const first = documentStub('first');
  const second = documentStub('second');

  const releaseFirstOuter = claimProjectedShell(first);
  const releaseFirstInner = claimProjectedShell(first);
  const releaseSecond = claimProjectedShell(second);

  assertClaimed(first);
  assertClaimed(second);

  releaseFirstOuter();
  assertClaimed(first);
  assertClaimed(second);

  releaseSecond();
  assertRestored(second, 'second');
  assertClaimed(first);

  releaseFirstInner();
  assertRestored(first, 'first');
  assertRestored(second, 'second');
});

test('Story 17.7: reset restores every claimed document exactly once', () => {
  const first = documentStub('first');
  const second = documentStub('second');
  const staleFirst = claimProjectedShell(first);
  const staleSecond = claimProjectedShell(second);

  resetProjectedShellForTest();
  assertRestored(first, 'first');
  assertRestored(second, 'second');

  staleFirst();
  staleSecond();
  assertRestored(first, 'first');
  assertRestored(second, 'second');
});
