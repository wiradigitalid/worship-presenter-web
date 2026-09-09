import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log('=== Running SPEC-17 Automated Smoke Test ===');

// 1. Font catalog completeness (SPEC-17-01)
const fontCatalogPath = path.resolve('src/lib/registry/font-catalog.ts');
const fontCatalogContent = fs.readFileSync(fontCatalogPath, 'utf8');

assert.ok(fontCatalogContent.includes('export const FONT_CATALOG: FontDefinition[] = ['), 'FAIL: FONT_CATALOG missing');
assert.ok(fontCatalogContent.includes("export const DEFAULT_FONT_FAMILY = 'Arial';"), 'FAIL: DEFAULT_FONT_FAMILY missing');
assert.ok(fontCatalogContent.includes('getGoogleFontsStylesheetUrl'), 'FAIL: getGoogleFontsStylesheetUrl missing');
console.log('  [PASS] SPEC-17-01: Font catalog module structure verified');

// 2. Embed links in SPA HTML templates (SPEC-17-01)
const indexHtml = fs.readFileSync(path.resolve('spa/index.html'), 'utf8');
const projectedHtml = fs.readFileSync(path.resolve('spa/projected.html'), 'utf8');

for (const [name, content] of [['index.html', indexHtml], ['projected.html', projectedHtml]]) {
  assert.ok(content.includes('fonts.googleapis.com'), `FAIL: ${name} missing fonts.googleapis.com`);
  assert.ok(content.includes('fonts.gstatic.com'), `FAIL: ${name} missing fonts.gstatic.com`);
  assert.ok(content.includes('display=swap'), `FAIL: ${name} missing display=swap`);
}
console.log('  [PASS] SPEC-17-01: HTML templates include Google Fonts stylesheet links');

// 3. Toolbar fixed 88px two-row container (SPEC-17-02)
const editorPath = path.resolve('src/components/admin/ArtifactEditor.tsx');
const editorContent = fs.readFileSync(editorPath, 'utf8');

assert.ok(
  editorContent.includes('h-[88px] min-h-[88px] max-h-[88px]'),
  'FAIL: Toolbar missing fixed h-[88px] min-h-[88px] max-h-[88px]'
);
assert.ok(
  !editorContent.includes('h-11 min-h-[44px] max-h-[44px]'),
  'FAIL: Toolbar still carries old 44px container'
);
assert.ok(
  editorContent.includes('handleFontFamilyChange'),
  'FAIL: ArtifactEditor missing handleFontFamilyChange'
);
console.log('  [PASS] SPEC-17-02: Two-row properties toolbar locked at 88px fixed height with font selector');

// 4. Render and Export font synchronization (SPEC-17-03)
const pptxDrawContent = fs.readFileSync(path.resolve('src/lib/pptx-draw.ts'), 'utf8');
const artifactSlideContent = fs.readFileSync(path.resolve('src/components/artifacts/ArtifactSlide.tsx'), 'utf8');

assert.ok(
  pptxDrawContent.includes('fontFace: resolveFontFamily(style)'),
  'FAIL: pptx-draw.ts missing fontFace: resolveFontFamily(style)'
);
assert.ok(
  artifactSlideContent.includes('fontFamily: getFontStack(style.fontFamily)'),
  'FAIL: ArtifactSlide.tsx missing fontFamily: getFontStack(style.fontFamily)'
);
console.log('  [PASS] SPEC-17-03: PPTX fontFace and Web Slide getFontStack synchronized');

console.log('=== ALL SPEC-17 AUTOMATED SMOKE TESTS PASSED ===');
