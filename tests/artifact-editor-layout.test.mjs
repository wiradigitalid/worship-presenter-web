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

test('SPEC-13-04: Deck Sequence card flex containment and internal scroll height clamp (BUG-11)', () => {
  const editorPath = path.join(root, 'src', 'components', 'admin', 'ArtifactEditor.tsx');
  const code = fs.readFileSync(editorPath, 'utf8');

  // Deck sequence card must be flex flex-col with max-h clamp
  assert.ok(
    code.includes('flex flex-col max-h-[calc(100vh-320px)]'),
    'Deck sequence card must use flex flex-col with viewport max-h constraint'
  );

  // Deck sequence header must be shrink-0 co-located with layout classes
  assert.ok(
    code.includes('justify-between shrink-0'),
    'Deck sequence header div must carry shrink-0 alongside its layout classes'
  );

  // Deck sequence ul must have flex-1 min-h-0 overflow-y-auto
  assert.ok(
    code.includes('overflow-y-auto pr-1 flex-1 min-h-0'),
    'Deck sequence ul must have flex-1 min-h-0 overflow-y-auto to scroll within bounded card'
  );
});

test('SPEC-13-05: Song Set tab banner height fixed and overflow-hidden (BUG-14)', () => {
  const panelPath = path.join(root, 'src', 'components', 'admin', 'SongSetEntriesPanel.tsx');
  const code = fs.readFileSync(panelPath, 'utf8');

  // Banner must have fixed height and overflow-hidden so text wrapping never shifts canvas
  assert.ok(
    code.includes('min-h-[42px] h-[42px] overflow-hidden'),
    'SongSetEntriesPanel banner must enforce exact height h-[42px] with overflow-hidden'
  );

  // Banner text must have flex-1 min-w-0 truncate to prevent line wrapping and allow shrinking
  assert.ok(
    code.includes('className="flex-1 min-w-0 truncate mr-2"'),
    'Banner descriptive text must carry flex-1 min-w-0 truncate classes'
  );

  // Role badge must have shrink-0
  assert.ok(
    code.includes('rounded border border-blue-500/30 shrink-0'),
    'Role badge must carry shrink-0 so it is never compressed'
  );
});


