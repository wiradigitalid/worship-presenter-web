/**
 * SPEC-12-05 / BUG-11: Main Spine layout height and viewport fit guard.
 *
 * Verifies:
 * 1. Main Spine editor container enforces a minimum height floor (min-h-[...]).
 * 2. Canvas shell container defines a viewport-bounded max-height (max-h-[calc(100vh-...)] and min-h-[...])
 *    so canvas fits within the screen and scales via fitCanvasToShell instead of blowing out page height.
 * 3. Deck Sequence list container restricts max-height to viewport and enables internal scroll (overflow-y-auto).
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

test('SPEC-12-05: Main Spine editor layout height and viewport constraints', () => {
  const editorPath = path.join(root, 'src', 'components', 'admin', 'ArtifactEditor.tsx');
  const code = fs.readFileSync(editorPath, 'utf8');

  // 1. Minimum height floor on outer editor container
  assert.ok(
    code.includes('min-h-[560px]') || code.includes('min-h-[580px]') || code.includes('min-h-[600px]'),
    'Outer editor container must declare a minimum height floor (e.g. min-h-[580px])'
  );

  // 2. Canvas shell container has max-height bound to viewport so fitCanvasToShell bounds the canvas
  assert.match(
    code,
    /ref=\{canvasShellRef\}[\s\S]*?max-h-\[calc\(100vh-\d+px\)\]/,
    'canvasShellRef container must bound max-height to viewport (max-h-[calc(100vh-...px)])'
  );
  assert.match(
    code,
    /ref=\{canvasShellRef\}[\s\S]*?min-h-\[\d+px\]/,
    'canvasShellRef container must specify a min-height floor'
  );

  // 3. Deck sequence list container internal scroll
  assert.match(
    code,
    /max-h-\[calc\(100vh-\d+px\)\][\s\S]*?overflow-y-auto/,
    'Deck sequence list must be constrained to viewport with internal overflow-y-auto'
  );
});
