import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log('=== Running SPEC-16 Automated Smoke Test ===');

// 1. Deck Sequence desktop height containment (SPEC-16-01)
const editorPath = path.resolve('src/components/admin/ArtifactEditor.tsx');
const editorContent = fs.readFileSync(editorPath, 'utf8');

assert.ok(
  editorContent.includes('lg:h-0 lg:min-h-full'),
  'FAIL: aside missing lg:h-0 lg:min-h-full'
);
assert.ok(
  editorContent.includes('lg:max-h-full'),
  'FAIL: Deck Sequence missing lg:max-h-full'
);
assert.ok(
  !editorContent.includes('lg:max-h-none'),
  'FAIL: Deck Sequence still contains unconstrained lg:max-h-none'
);
assert.ok(
  editorContent.includes('overflow-y-auto pr-1 flex-1 min-h-0'),
  'FAIL: Deck Sequence missing internal scrolling flex-1 min-h-0 overflow-y-auto'
);
console.log('  [PASS] SPEC-16-01: Deck Sequence desktop height strictly bounded, internal scrolling intact');

// 2. Song Set top card edit header compactness (SPEC-16-02)
const panelPath = path.resolve('src/components/admin/SongSetEntriesPanel.tsx');
const panelContent = fs.readFileSync(panelPath, 'utf8');

const topCardHeaderStart = panelContent.indexOf('{/* New / Edit Song Set creation/edit panel');
assert.ok(topCardHeaderStart !== -1, 'FAIL: Top card header start not found');
const topCardHeaderEnd = panelContent.indexOf('{editingVarName ? (', topCardHeaderStart);
assert.ok(topCardHeaderEnd !== -1, 'FAIL: Top card header end not found');
const topCardHeader = panelContent.slice(topCardHeaderStart, topCardHeaderEnd);

assert.ok(
  topCardHeader.includes('truncate min-w-0 mr-2'),
  'FAIL: Song Set top card header missing truncate min-w-0 mr-2'
);
assert.ok(
  topCardHeader.includes('shrink-0'),
  'FAIL: Song Set top card badge missing shrink-0'
);
assert.ok(
  !topCardHeader.includes(".replace('{title}'") && !topCardHeader.includes('.replace("{title}"'),
  'FAIL: Song Set top card header interpolates dynamic {title}'
);
console.log('  [PASS] SPEC-16-02: Song Set top card edit header compact with truncate, min-w-0, shrink-0');

// 3. i18n dictionaries
const catEn = fs.readFileSync(path.resolve('src/lib/i18n/catalogue-en.ts'), 'utf8');
const catId = fs.readFileSync(path.resolve('src/lib/i18n/catalogue-id.ts'), 'utf8');

assert.ok(catEn.includes("'admin.songSets.editTitle': 'Edit Song Set'"), 'FAIL: EN catalogue missing Edit Song Set');
assert.ok(catId.includes("'admin.songSets.editTitle': 'Edit Set Lagu'"), 'FAIL: ID catalogue missing Edit Set Lagu');
assert.ok(!catEn.includes("'admin.songSets.editTitle': 'Edit Song Set: {title}'"), 'FAIL: EN catalogue still has {title}');
assert.ok(!catId.includes("'admin.songSets.editTitle': 'Edit Song Set: {title}'"), 'FAIL: ID catalogue still has {title}');
console.log('  [PASS] i18n: EN and ID dictionaries clean, translated, and free of {title}');

// 4. Build output sanity
assert.ok(fs.existsSync(path.resolve('spa/dist/index.html')), 'FAIL: spa/dist/index.html missing');
assert.ok(fs.existsSync(path.resolve('spa/dist/projected.html')), 'FAIL: spa/dist/projected.html missing');
console.log('  [PASS] Build: spa/dist/index.html and spa/dist/projected.html verified');

console.log('=== ALL SPEC-16 AUTOMATED SMOKE TESTS PASSED ===');
