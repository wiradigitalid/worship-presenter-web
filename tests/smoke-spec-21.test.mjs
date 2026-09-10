import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { validateArtifactTemplate } from '../src/lib/registry/validate.ts';
import {
  serializeCanvas,
  serializeTextStyle,
  pctToPx,
  pxToPct,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  parseFontSizeDraft,
  commitFontSizeFromDraft,
  TEXT_LINE_HEIGHT,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
} from '../src/lib/registry/canvas-utils.ts';
import { getFontStack, resolveCatalogFontFamily } from '../src/lib/registry/font-catalog.ts';

class MockFabricText {
  constructor(options = {}) {
    this.type = 'textbox';
    this.text = options.text || 'Sample text';
    this.data = options.data || {};
    this.left = options.left ?? 0;
    this.top = options.top ?? 0;
    this.width = options.width ?? 100;
    this.height = options.height ?? 50;
    this.scaleX = options.scaleX ?? 1;
    this.scaleY = options.scaleY ?? 1;
    this.fill = options.fill ?? '#FFFFFF';
    this.fontSize = options.fontSize ?? 32;
    this.fontFamily = options.fontFamily ?? 'Arial';
    this.fontWeight = options.fontWeight ?? 'normal';
    this.fontStyle = options.fontStyle ?? 'normal';
    this.underline = options.underline ?? false;
    this.textAlign = options.textAlign ?? 'left';
    this.lineHeight = options.lineHeight ?? TEXT_LINE_HEIGHT;
    this.shadow = options.shadow ?? null;
  }

  get(key) {
    return this[key];
  }

  set(props) {
    Object.assign(this, props);
  }
}

class MockCanvas {
  constructor(objects = []) {
    this.objects = objects;
  }

  getObjects() {
    return this.objects;
  }
}

test('T-21-01: Pure Helper Functions for Font Size Commit', () => {
  // 1. parseFontSizeDraft tests
  assert.equal(parseFontSizeDraft('1'), 1);
  assert.equal(parseFontSizeDraft('12'), 12);
  assert.equal(parseFontSizeDraft('20'), 20);
  assert.equal(parseFontSizeDraft(' 36 '), 36);
  assert.equal(parseFontSizeDraft(''), null);
  assert.equal(parseFontSizeDraft('   '), null);
  assert.equal(parseFontSizeDraft('abc'), null);
  assert.equal(parseFontSizeDraft('0'), null);
  assert.equal(parseFontSizeDraft('-10'), null);

  // 2. commitFontSizeFromDraft tests
  // Draft '1' clamped to MIN_FONT_SIZE (8) upon commit
  assert.deepEqual(commitFontSizeFromDraft('1', 32), { fontSize: 8, inputValue: '8' });
  // Draft '12' committed cleanly
  assert.deepEqual(commitFontSizeFromDraft('12', 32), { fontSize: 12, inputValue: '12' });
  // Draft '20' committed cleanly
  assert.deepEqual(commitFontSizeFromDraft('20', 32), { fontSize: 20, inputValue: '20' });
  // Empty field reverts to last committed font size
  assert.deepEqual(commitFontSizeFromDraft('', 32), { fontSize: 32, inputValue: '32' });
  // Non-numeric text reverts to last committed font size
  assert.deepEqual(commitFontSizeFromDraft('xyz', 48), { fontSize: 48, inputValue: '48' });
  // Overly large font size clamped to MAX_FONT_SIZE (200)
  assert.deepEqual(commitFontSizeFromDraft('999', 32), { fontSize: 200, inputValue: '200' });
});

test('T-21-02: Keystroke Isolation Source Guard in ArtifactEditor.tsx', () => {
  const editorPath = path.resolve('src/components/admin/ArtifactEditor.tsx');
  const code = fs.readFileSync(editorPath, 'utf8');

  // 1. handleFontSizeInput only updates draft state and does not call syncSelection or mutate canvas
  const inputHandlerStart = code.indexOf('const handleFontSizeInput');
  assert.ok(inputHandlerStart !== -1, 'Must define handleFontSizeInput');
  const inputHandlerBody = code.slice(inputHandlerStart, inputHandlerStart + 300);
  assert.ok(
    inputHandlerBody.includes('setFontSizeInput(raw)'),
    'handleFontSizeInput must set draft input'
  );
  assert.ok(
    !inputHandlerBody.includes('syncSelection'),
    'handleFontSizeInput must NOT call syncSelection'
  );
  assert.ok(
    !inputHandlerBody.includes('markDirty'),
    'handleFontSizeInput must NOT call markDirty'
  );
  assert.ok(
    !inputHandlerBody.includes('clampFontSize'),
    'handleFontSizeInput must NOT clamp font size during keystroke'
  );

  // 2. handleFontSizeCommit exists, commits from draft, updates canvas text, and calls markDirty
  const commitHandlerStart = code.indexOf('const handleFontSizeCommit');
  assert.ok(commitHandlerStart !== -1, 'Must define handleFontSizeCommit');
  const commitHandlerBody = code.slice(commitHandlerStart, commitHandlerStart + 700);
  assert.ok(
    commitHandlerBody.includes('commitFontSizeFromDraft'),
    'handleFontSizeCommit must use commitFontSizeFromDraft'
  );
  assert.ok(
    commitHandlerBody.includes('markDirty()'),
    'handleFontSizeCommit must call markDirty()'
  );

  // 3. Focus protection in syncSelection
  assert.ok(
    code.includes('document.activeElement !== fontSizeInputRef.current'),
    'syncSelection must protect focused fontSizeInput from mid-typing overwrite'
  );

  // 4. Input wiring in JSX: onBlur={handleFontSizeCommit} and Enter key handler
  assert.ok(
    code.includes('onBlur={handleFontSizeCommit}'),
    'Input must trigger handleFontSizeCommit on blur'
  );
  assert.ok(
    code.includes("e.key === 'Enter'") && code.includes('e.currentTarget.blur()'),
    'Input must blur on Enter key to commit'
  );
});

test('T-21-03: Off-Canvas Width Preservation in serializeCanvas', () => {
  const layout = {
    elements: [
      {
        id: 'bleed-right-text',
        type: 'text',
        x: 70,
        y: 20,
        w: 50, // Extends to 120% (off-canvas bleed)
        h: 20,
        zIndex: 1,
        content: 'Bleed Right Title',
        style: { fontSize: 32 },
      },
    ],
  };

  const bleedText = new MockFabricText({
    data: { elementId: 'bleed-right-text' },
    left: (70 / 100) * 960,
    top: (20 / 100) * 540,
    width: (50 / 100) * 960,
    height: (20 / 100) * 540,
    scaleX: 1,
    scaleY: 1,
  });

  const serialized = serializeCanvas(
    new MockCanvas([bleedText]),
    layout,
    new Map()
  );

  assert.equal(serialized.length, 1);
  assert.equal(serialized[0].x, 70);
  // Must preserve 50% width without clamping to 30% (100 - x)
  assert.equal(serialized[0].w, 50, `Width must be preserved at 50%, got ${serialized[0].w}`);

  // Resulting template must validate cleanly
  const template = {
    schemaVersion: 1,
    id: 'test-off-canvas-w',
    label: 'Test Off Canvas W',
    baseType: 'general',
    placeholders: [],
    layouts: {
      default: {
        aspectRatio: '16:9',
        backgroundColor: '#000000',
        elements: serialized,
      },
    },
  };
  const validated = validateArtifactTemplate(template);
  assert.ok(validated && validated.id === 'test-off-canvas-w');
});

test('T-21-04: Off-Canvas Height Preservation in serializeCanvas', () => {
  const layout = {
    elements: [
      {
        id: 'bleed-bottom-text',
        type: 'text',
        x: 10,
        y: 85,
        w: 60,
        h: 30, // Extends to 115% (off-canvas bleed)
        zIndex: 1,
        content: 'Bleed Bottom Lyrics',
        style: { fontSize: 24 },
      },
    ],
  };

  const bleedBottom = new MockFabricText({
    data: { elementId: 'bleed-bottom-text' },
    left: (10 / 100) * 960,
    top: (85 / 100) * 540,
    width: (60 / 100) * 960,
    height: (30 / 100) * 540,
    scaleX: 1,
    scaleY: 1,
  });

  const serialized = serializeCanvas(
    new MockCanvas([bleedBottom]),
    layout,
    new Map()
  );

  assert.equal(serialized.length, 1);
  assert.equal(serialized[0].y, 85);
  // Must preserve 30% height without clamping to 15% (100 - y)
  assert.equal(serialized[0].h, 30, `Height must be preserved at 30%, got ${serialized[0].h}`);

  const template = {
    schemaVersion: 1,
    id: 'test-off-canvas-h',
    label: 'Test Off Canvas H',
    baseType: 'general',
    placeholders: [],
    layouts: {
      default: {
        aspectRatio: '16:9',
        backgroundColor: '#000000',
        elements: serialized,
      },
    },
  };
  const validated = validateArtifactTemplate(template);
  assert.ok(validated && validated.id === 'test-off-canvas-h');
});

test('T-21-05: Height Auto-Sync Regression Guard', () => {
  const layout = {
    elements: [
      {
        id: 'auto-sync-text',
        type: 'text',
        x: 10,
        y: 10,
        w: 50,
        h: 5, // Stale tiny authored height
        content: 'Multi-line expanded text',
        style: { fontSize: 32 },
      },
    ],
  };

  // Measured rendered height is 108px (20% of 540)
  const expandedText = new MockFabricText({
    data: { elementId: 'auto-sync-text' },
    left: (10 / 100) * 960,
    top: (10 / 100) * 540,
    width: (50 / 100) * 960,
    height: 108,
    scaleX: 1,
    scaleY: 1,
  });

  const serialized = serializeCanvas(
    new MockCanvas([expandedText]),
    layout,
    new Map()
  );

  assert.equal(serialized.length, 1);
  assert.equal(serialized[0].h, 20, 'Height must auto-sync to 20%');
});

test('T-21-06: Handle Narrowing Regression Guard', () => {
  const layout = {
    elements: [
      {
        id: 'narrowed-text',
        type: 'text',
        x: 10,
        y: 10,
        w: 50, // Authored 480px
        h: 20,
        content: 'Intentionally narrowed text',
        style: { fontSize: 32 },
      },
    ],
  };

  // Operator dragged handle inward: measured width is now 240px (25%)
  const narrowedText = new MockFabricText({
    data: { elementId: 'narrowed-text' },
    left: (10 / 100) * 960,
    top: (10 / 100) * 540,
    width: 240,
    height: (20 / 100) * 540,
    scaleX: 1,
    scaleY: 1,
  });

  const serialized = serializeCanvas(
    new MockCanvas([narrowedText]),
    layout,
    new Map()
  );

  assert.equal(serialized.length, 1);
  assert.equal(serialized[0].w, 25, 'Narrowed width (25%) must persist');
});

test('T-21-07: Absence of splitByGrapheme in ArtifactEditor.tsx', () => {
  const editorPath = path.resolve('src/components/admin/ArtifactEditor.tsx');
  const code = fs.readFileSync(editorPath, 'utf8');

  assert.ok(
    !code.includes('splitByGrapheme: true'),
    'splitByGrapheme: true must NOT be present in ArtifactEditor.tsx'
  );
  assert.ok(
    code.includes('splitByGrapheme: false'),
    'splitByGrapheme: false must be explicitly configured for word-boundary wrapping'
  );
});

test('T-21-08: Font Stack Alignment and Round-Trip Catalog Resolution', () => {
  const editorPath = path.resolve('src/components/admin/ArtifactEditor.tsx');
  const code = fs.readFileSync(editorPath, 'utf8');

  assert.ok(
    code.includes('fontFamily: getFontStack(style?.fontFamily)'),
    'ArtifactEditor must pass getFontStack(style?.fontFamily) to Fabric Textbox'
  );
  assert.ok(
    code.includes('resolveCatalogFontFamily'),
    'ArtifactEditor must use resolveCatalogFontFamily to prevent CSS stack leakage'
  );

  // Test font stack resolution
  assert.equal(getFontStack('Arial'), '"Arial", sans-serif');
  assert.equal(getFontStack('Caveat'), '"Caveat", cursive');
  assert.equal(getFontStack('Georgia'), '"Georgia", serif');
  assert.equal(getFontStack(undefined), '"Arial", sans-serif');

  // Test reverse mapping from Fabric stack to catalog name
  assert.equal(resolveCatalogFontFamily('"Caveat", cursive'), 'Caveat');
  assert.equal(resolveCatalogFontFamily('"Arial", sans-serif'), 'Arial');
  assert.equal(resolveCatalogFontFamily('"Playfair Display", serif'), 'Playfair Display');
  assert.equal(resolveCatalogFontFamily('Caveat'), 'Caveat');
  assert.equal(resolveCatalogFontFamily(undefined), 'Arial');

  // Verify serializeTextStyle normalizes CSS font stack back to clean catalog family
  const serialized = serializeTextStyle(
    { id: 't1', type: 'text', x: 0, y: 0, w: 50, h: 20 },
    {
      fill: '#FFFFFF',
      fontSize: 32,
      fontFamily: '"Caveat", cursive',
    }
  );
  assert.equal(serialized?.fontFamily, 'Caveat', 'serializeTextStyle must store catalog name, not CSS stack');
});

test('T-21-09: Line Height Alignment to TEXT_LINE_HEIGHT = 1.2', () => {
  assert.equal(TEXT_LINE_HEIGHT, 1.2, 'TEXT_LINE_HEIGHT must be 1.2');

  const editorPath = path.resolve('src/components/admin/ArtifactEditor.tsx');
  const editorCode = fs.readFileSync(editorPath, 'utf8');

  assert.ok(
    editorCode.includes('lineHeight: style?.lineHeight ?? TEXT_LINE_HEIGHT'),
    'ArtifactEditor elementToFabricObject must default to TEXT_LINE_HEIGHT'
  );
  assert.ok(
    !editorCode.includes('useState<number>(1.16)'),
    'ArtifactEditor must not initialize lineHeight state to 1.16'
  );

  const utilsPath = path.resolve('src/lib/registry/canvas-utils.ts');
  const utilsCode = fs.readFileSync(utilsPath, 'utf8');
  assert.ok(
    utilsCode.includes("setIfMeaningful('lineHeight', Number(textObj.lineHeight.toFixed(2)), TEXT_LINE_HEIGHT)"),
    'serializeTextStyle must compare against TEXT_LINE_HEIGHT as construction default'
  );
});

test('T-21-10: Explicit Line Height Persistence in serializeTextStyle', () => {
  const sourceElement = {
    id: 'el-1',
    type: 'text',
    x: 10,
    y: 10,
    w: 50,
    h: 20,
    style: { fontSize: 32 },
  };

  // 1. Explicit lineHeight (1.5) must be serialized
  const serializedCustom = serializeTextStyle(sourceElement, {
    fill: '#FFFFFF',
    fontSize: 32,
    lineHeight: 1.5,
  });
  assert.equal(serializedCustom?.lineHeight, 1.5, 'Explicit lineHeight 1.5 must persist');

  // 2. Construction default (1.2) must be omitted to keep JSON clean
  const serializedDefault = serializeTextStyle(sourceElement, {
    fill: '#FFFFFF',
    fontSize: 32,
    lineHeight: 1.2,
  });
  assert.equal(serializedDefault?.lineHeight, undefined, 'Default 1.2 lineHeight must be omitted');
});

test('T-21-11: Documentation Policy Guard', () => {
  const docPath = path.resolve('.how/registry/06-flows/canvas-authoring-controls.md');
  const doc = fs.readFileSync(docPath, 'utf8');

  assert.ok(
    doc.includes('Under SPEC-21, off-canvas element geometry (bleeding past the right or bottom edges, e.g. `x + w > 100`) is permitted and preserved without bounding box boundary clamping'),
    'Documentation must explicitly record off-canvas geometry allowance'
  );
  assert.ok(
    doc.includes('splitByGrapheme: false'),
    'Documentation must record splitByGrapheme: false whole-word wrapping'
  );
  assert.ok(
    doc.includes('TEXT_LINE_HEIGHT = 1.2'),
    'Documentation must record TEXT_LINE_HEIGHT = 1.2'
  );
});
