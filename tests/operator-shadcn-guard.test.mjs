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

test('SPEC-13-10: Inline status text occupies fixed-height slot above toolbar (BUG-20, DEC-011)', () => {
  const editorPath = path.join(ROOT, 'src', 'components', 'admin', 'ArtifactEditor.tsx');
  const code = readFileSync(editorPath, 'utf8').replace(/\r\n/g, '\n');

  // Must wrap message in fixed-height slot with overflow-hidden
  assert.ok(
    code.includes('min-h-[24px]') && code.includes('overflow-hidden'),
    'Inline status container must have fixed height (min-h-[24px]) and overflow-hidden'
  );

  // Both message render sites (when !template and when template) must be inside fixed-height container
  const fixedSlots = [...code.matchAll(/<div[^>]*min-h-\[24px\][^>]*>[\s\S]*?\{message\s*\?[\s\S]*?<\/div>/g)];
  assert.equal(
    fixedSlots.length,
    2,
    'Both template states (!template and template) must enclose inline message inside fixed-height slot'
  );
});

test('SPEC-13-13: Song Set shared trio clarity and visual indicator (BUG-24)', () => {
  const panelPath = path.join(ROOT, 'src', 'components', 'admin', 'SongSetEntriesPanel.tsx');
  const code = readFileSync(panelPath, 'utf8').replace(/\r\n/g, '\n');

  // 1. Prominent persistent badge indicating the trio is shared across all song sets
  assert.ok(
    code.includes('Shared across all song sets') && code.includes('Shared Canvas Trio'),
    'SongSetEntriesPanel must include clear shared-scope indicator for the canvas trio'
  );

  // 2. Banner notes identify roles as shared across song sets
  assert.ok(
    code.includes('(Shared)') && code.includes('SHARED TITLE'),
    'Banner notes must indicate that layout applies across all song sets'
  );

  // 3. Left panel clarifies that entries share the canvas trio
  assert.ok(
    code.includes('share the canvas trio') || (code.includes('share') && code.includes('trio')),
    'Configured song sets list must clarify that entries share the canvas trio on the right'
  );
});

test('SPEC-14-06 / BUG-24: Song Set inline rename in list rows and removal of redundant header card', () => {
  const panelPath = path.join(ROOT, 'src', 'components', 'admin', 'SongSetEntriesPanel.tsx');
  const code = readFileSync(panelPath, 'utf8');

  // 1. Redundant header card removed
  assert.ok(
    !code.includes('min-h-[58px]'),
    'Redundant rename header card above canvas trio must be removed'
  );

  // 2. Inline rename triggers exist inside list items
  assert.ok(
    code.includes('editingVarName') && code.includes('Pencil'),
    'Configured song sets list must provide inline rename trigger per item'
  );

  // 3. Inline rename inputs have fixed height constraint (h-8)
  assert.ok(
    code.includes('className="text-xs font-semibold h-8 w-full"') &&
    code.includes('className="text-xs font-mono h-8 flex-1 min-w-0"'),
    'Inline rename inputs must enforce compact h-8 height constraint'
  );
});

test('guard proof: redundant header card presence fails absence-guard', () => {
  const defectiveCode = '<div className="rounded-xl min-h-[58px]">Rename Card</div>';
  assert.throws(() => {
    assert.ok(
      !defectiveCode.includes('min-h-[58px]'),
      'Redundant rename header card above canvas trio must be removed'
    );
  }, /Redundant rename header card/);
});

test('SPEC-15-04 / BUG-29: Song Set Entry edit mode uses top card form switching with zero layout shift in list', () => {
  const panelPath = path.join(ROOT, 'src', 'components', 'admin', 'SongSetEntriesPanel.tsx');
  const code = readFileSync(panelPath, 'utf8');

  // 1. Zero layout shift: Bounded check that no Input components exist anywhere inside the List Song Sets section
  const listStart = code.indexOf('{/* List Song Sets */}');
  assert.ok(listStart !== -1, 'Must find List Song Sets section');
  const listEnd = code.indexOf('</aside>', listStart);
  assert.ok(listEnd !== -1, 'Must find matching </aside>');
  const listBlock = code.slice(listStart, listEnd);
  assert.ok(
    !listBlock.includes('<Input'),
    'List container must not render any Input components; all editing occurs in top form card with zero layout shift'
  );

  // 2. Rigid single-row height stability: List item rows enforce h-[48px] min-h-[48px] in both normal and editing states
  assert.ok(
    listBlock.includes('h-[48px] min-h-[48px]'),
    'List item rows must enforce fixed h-[48px] min-h-[48px] height'
  );

  // 3. Top card dynamically switches to Edit mode using i18n keys
  assert.ok(
    code.includes("t('admin.songSets.editTitle')") &&
      code.includes("t('admin.songSets.editingBadge')") &&
      code.includes("t('admin.songSets.badge')"),
    'Top form card must dynamically transition between New Song Set and Edit Song Set modes via i18n'
  );

  // 4. Edit mode in top card provides both Save and Cancel controls
  assert.ok(
    code.includes('handleSaveRename()') &&
      code.includes('handleCancelEdit') &&
      code.includes("t('admin.songSets.save')") &&
      code.includes("t('admin.songSets.cancel')"),
    'Top form card must provide explicit Save and Cancel actions in edit mode'
  );

  // 5. List item displays active editing badge when isItemEditing is true
  assert.ok(
    code.includes('isItemEditing') && code.includes("t('admin.songSets.editingBadge')") && code.includes('border-amber-500'),
    'List item must display visual Editing indicator while preserving single-row height'
  );

  // 6. Switching edit between rows triggers handleStartEdit cleanly
  assert.ok(
    code.includes('handleStartEdit(entry)'),
    'SongSetEntriesPanel must provide handleStartEdit to cleanly transition between target rows'
  );

  // 7. Cancel and Delete cleanup: handleCancelEdit clears inputs, handleDelete resets edit state if target deleted
  assert.ok(
    code.includes('if (editingVarName === entry.variableName)') &&
      code.includes('handleCancelEdit();'),
    'handleDelete must invoke handleCancelEdit when deleting the currently edited entry'
  );

  // 8. Rename persistence: handleSaveRename calls PATCH with updated fields
  assert.ok(
    code.includes("method: 'PATCH'") &&
      code.includes('title: trimmedTitle') &&
      code.includes('variableName: trimmedVar') &&
      code.includes('updatedAt: targetEntry.updatedAt'),
    'handleSaveRename must persist updated title and variableName via PATCH'
  );
});

test('guard proof: list item input presence fails zero-layout-shift absence-guard', () => {
  const panelPath = path.join(ROOT, 'src', 'components', 'admin', 'SongSetEntriesPanel.tsx');
  const realCode = readFileSync(panelPath, 'utf8');
  // Inject defect directly into real component's list section
  const defectiveRealCode = realCode.replace(
    '{/* List Song Sets */}',
    '{/* List Song Sets */}\n<Input value="defective" />'
  );
  const listStart = defectiveRealCode.indexOf('{/* List Song Sets */}');
  const listEnd = defectiveRealCode.indexOf('</aside>', listStart);
  const listBlock = defectiveRealCode.slice(listStart, listEnd);
  assert.throws(() => {
    assert.ok(
      !listBlock.includes('<Input'),
      'List container must not render any Input components'
    );
  }, /List container must not render any Input components/);
});
