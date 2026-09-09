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

test('SPEC-13-04 / SPEC-14-02: Deck Sequence card flex containment and internal scroll height clamp (BUG-11)', () => {
  const editorPath = path.join(root, 'src', 'components', 'admin', 'ArtifactEditor.tsx');
  const code = fs.readFileSync(editorPath, 'utf8');

  // Deck sequence card must be flex flex-col with max-h clamp tightened to prevent window scroll
  assert.ok(
    code.includes('flex flex-col max-h-[calc(100vh-380px)]'),
    'Deck sequence card must use flex flex-col with tightened viewport max-h constraint (380px)'
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

test('SPEC-13-07: Title area Rename height stability across canvas-bearing editor headers and Song Set trio drops Rename (BUG-16, BUG-23)', () => {
  const artifactEditorPath = path.join(root, 'src', 'components', 'admin', 'ArtifactEditor.tsx');
  const annSetsPath = path.join(root, 'src', 'components', 'admin', 'AnnouncementSetsPanel.tsx');
  const songSetsPath = path.join(root, 'src', 'components', 'admin', 'SongSetEntriesPanel.tsx');
  const adaptersPath = path.join(root, 'src', 'lib', 'registry', 'canvas-adapters.ts');

  const editorCode = fs.readFileSync(artifactEditorPath, 'utf8');
  const annSetsCode = fs.readFileSync(annSetsPath, 'utf8');
  const songSetsCode = fs.readFileSync(songSetsPath, 'utf8');
  const adaptersCode = fs.readFileSync(adaptersPath, 'utf8');

  // Surface 1: Main Spine slide title card in ArtifactEditor enforces min-h-[58px]
  assert.ok(
    editorCode.includes('px-4 py-3 flex items-center justify-between shadow-sm min-h-[58px]'),
    'Surface 1: Main Spine slide header card must enforce min-h-[58px] height stability'
  );
  // Main Spine rename Input must be h-8 (32px), matching py-3 (24px) + border (2px) = 58px total
  assert.ok(
    editorCode.includes('className="text-base font-semibold max-w-sm h-8"'),
    'Surface 1: Main Spine rename input must be explicitly h-8 so height stays 58px in rename state'
  );

  // Surface 2: Announcement Set Active Set row in AnnouncementSetsPanel enforces min-h-[58px] (from SPEC-12-08)
  assert.ok(
    annSetsCode.includes('<div className="min-h-[58px]">'),
    'Surface 2: Announcement Set Active Set row must enforce min-h-[58px] height stability'
  );

  // Surface 3: Song Set inline rename in SongSetEntriesPanel (SPEC-14-06 / BUG-24)
  // Inline rename inputs render inside the list row with fixed h-8 constraint, removing the redundant top card
  assert.ok(
    !songSetsCode.includes('min-h-[58px]'),
    'Surface 3: Redundant Rename Header Card above canvas trio must be removed'
  );
  assert.ok(
    songSetsCode.includes('className="text-xs font-semibold h-8 w-full"') &&
    songSetsCode.includes('className="text-xs font-mono h-8 flex-1 min-w-0"'),
    'Surface 3: Song Set inline rename inputs must use h-8 height constraint'
  );

  // BUG-23: Song Set trio drops Rename control
  // 1. ArtifactEditor accepts allowRename prop defaulting to true and guards Rename button & input branch
  assert.ok(
    editorCode.includes('allowRename = true'),
    'ArtifactEditor must declare allowRename defaulting to true'
  );
  assert.ok(
    editorCode.includes('{allowRename && isRenaming ? ('),
    'ArtifactEditor must guard rename input branch with allowRename'
  );

  // Structural slice assertion: from {allowRename ? ( to the first subsequent ) : null}
  const allowRenameStart = editorCode.indexOf('{allowRename ? (');
  assert.ok(allowRenameStart !== -1, 'Must find {allowRename ? (');
  const allowRenameEnd = editorCode.indexOf(') : null}', allowRenameStart);
  assert.ok(allowRenameEnd !== -1, 'Must find matching ) : null}');
  const allowRenameBlock = editorCode.slice(allowRenameStart, allowRenameEnd);

  assert.ok(
    allowRenameBlock.includes("{t('admin.artifacts.rename')}"),
    'Rename button must be contained strictly inside the allowRename block'
  );
  assert.ok(
    allowRenameBlock.includes('<div className="h-4 w-px bg-border mx-1" />'),
    'Divider must be contained strictly inside the allowRename block so it is omitted when allowRename is false'
  );

  // Negative assertion: outside allowRenameBlock (between allowRenameEnd and Canvas: group), no duplicate divider must exist
  const canvasGroupIndex = editorCode.indexOf('Canvas:', allowRenameEnd);
  assert.ok(canvasGroupIndex !== -1, 'Must find Canvas: group');
  const betweenBlock = editorCode.slice(allowRenameEnd, canvasGroupIndex);
  assert.ok(
    !betweenBlock.includes('<div className="h-4 w-px bg-border mx-1" />'),
    'No duplicate divider must exist outside the allowRename block'
  );

  // 2. SongSetEntriesPanel passes allowRename={false} to ArtifactEditor
  assert.ok(
    songSetsCode.includes('allowRename={false}'),
    'SongSetEntriesPanel must pass allowRename={false} to trio ArtifactEditor'
  );

  // 3. createSongSetTrioAdapter provides static labels 'Title Slide', 'Verse Layout', 'Refrain Layout'
  assert.ok(
    adaptersCode.includes("{ id: 'title', label: 'Title Slide' }") &&
    adaptersCode.includes("{ id: 'verse', label: 'Verse Layout' }") &&
    adaptersCode.includes("{ id: 'reff', label: 'Refrain Layout' }"),
    'createSongSetTrioAdapter must provide static labels Title Slide, Verse Layout, Refrain Layout'
  );

  // 4. SongSetEntriesPanel tab button correctly reads '3. Refrain Layout'
  assert.ok(
    songSetsCode.includes('3. Refrain Layout'),
    'SongSetEntriesPanel tab button must read "3. Refrain Layout"'
  );
});

test('SPEC-14-07 / BUG-25: Toolbar properties bar height stability on selection', () => {
  const editorPath = path.join(root, 'src', 'components', 'admin', 'ArtifactEditor.tsx');
  const code = fs.readFileSync(editorPath, 'utf8');

  // Element properties toolbar must be locked to a fixed 44px height (h-11 min-h-[44px] max-h-[44px]) with flex-nowrap
  assert.ok(
    code.includes('h-11 min-h-[44px] max-h-[44px]') && code.includes('flex-nowrap'),
    'Element Properties toolbar must lock height to 44px with flex-nowrap to prevent downward canvas shifts'
  );

  // Horizontal overflow must be scrollable without vertical expansion
  assert.ok(
    code.includes('overflow-x-auto') && code.includes('overflow-y-hidden'),
    'Element Properties toolbar must enable horizontal scroll and hide vertical overflow'
  );
});



