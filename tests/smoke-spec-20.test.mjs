import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { validateArtifactTemplate } from '../src/lib/registry/validate.ts';
import {
  serializeCanvas,
  pctToPx,
  pxToPct,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from '../src/lib/registry/canvas-utils.ts';
import {
  FONT_CATALOG,
  FONT_CATEGORY_LABELS,
} from '../src/lib/registry/font-catalog.ts';
import { estimateTextFitScale } from '../src/lib/artifacts/render-model.ts';

test('T-20-01 & T-20-02: SPEC-20-01 Font Picker Combobox Structure & Keyboard Isolation', () => {
  const editorPath = path.resolve('src/components/admin/ArtifactEditor.tsx');
  const code = fs.readFileSync(editorPath, 'utf8');

  // 1. Popover and PopoverTrigger used for Font Family
  assert.ok(
    code.includes('Popover') &&
      code.includes('PopoverTrigger') &&
      code.includes('PopoverContent'),
    'ArtifactEditor must import and use Popover, PopoverTrigger, and PopoverContent'
  );

  // 2. PopoverContent anchors side="bottom" and align="start"
  assert.ok(
    code.includes('side="bottom"') && code.includes('align="start"'),
    'PopoverContent must anchor side="bottom" and align="start"'
  );

  // 3. Search input is inside PopoverContent, with stopPropagation to isolate typing
  assert.ok(
    code.includes('placeholder={t(\'admin.artifacts.searchFonts\')}'),
    'Font search input must exist with localized placeholder'
  );
  assert.ok(
    code.includes('onKeyDown={(e) => {') && code.includes("if (e.key !== 'Escape') e.stopPropagation();"),
    'Search input must isolate keydown propagation to prevent parent capture'
  );

  // 4. ChevronDown icon on PopoverTrigger
  assert.ok(
    code.includes('ChevronDown'),
    'Font Family PopoverTrigger must display ChevronDown icon'
  );
});

test('T-20-03: SPEC-20-01 Dynamic Font Catalog Filtering', () => {
  // Verify catalog has categories and font search filtering behaves correctly
  const categories = ['system', 'sans', 'serif', 'display', 'script'];
  for (const cat of categories) {
    const matching = FONT_CATALOG.filter((f) => f.category === cat);
    assert.ok(matching.length > 0, `Category ${cat} must contain at least one font`);
  }

  // Filter "mont" should match Montserrat
  const montMatch = FONT_CATALOG.filter((f) =>
    f.label.toLowerCase().includes('mont')
  );
  assert.ok(
    montMatch.some((f) => f.family.includes('Montserrat')),
    'Filter "mont" must match Montserrat font'
  );
});

test('T-20-04 & T-20-05: SPEC-20-02 Live Drag Rubberband Lifecycle', () => {
  const editorPath = path.resolve('src/components/admin/ArtifactEditor.tsx');
  const code = fs.readFileSync(editorPath, 'utf8');

  // 1. mouse:move listener registered on canvas
  assert.ok(
    code.includes("canvas.on('mouse:move', onMouseMove)"),
    'Canvas must register mouse:move handler for drawing preview'
  );
  assert.ok(
    code.includes("canvas.off('mouse:move', onMouseMove)"),
    'Canvas must unregister mouse:move handler on cleanup'
  );

  // 2. previewShapeRef reference and dashed preview object creation
  assert.ok(
    code.includes('previewShapeRef'),
    'ArtifactEditor must maintain previewShapeRef'
  );
  assert.ok(
    code.includes('strokeDashArray: [4, 4]'),
    'Preview shape must render with dashed border [4, 4]'
  );

  // 3. Clean removal on mouse:up and Escape
  assert.ok(
    code.includes('if (previewShapeRef.current)'),
    'previewShapeRef must be cleaned up on mouse:up or Escape'
  );
});

test('T-20-06 & T-20-07: SPEC-20-03 Stable 16:9 Stage Viewport for Non-Canvas Slides', () => {
  const editorPath = path.resolve('src/components/admin/ArtifactEditor.tsx');
  const code = fs.readFileSync(editorPath, 'utf8');

  // 1. !isEditable branch renders aspect-video container with identical viewport constraints
  assert.ok(
    code.includes('!isEditable ? (') &&
      code.includes('aspect-video w-full max-h-[calc(100vh-310px)] min-h-[320px]'),
    'Non-editable slides must render an aspect-video 16:9 stage container matching editable canvas height constraints'
  );

  // 2. Clear kind chip badge and informative text rendered inside placeholder
  assert.ok(
    code.includes('kindChipLabel(template.baseType)'),
    'Non-editable stage must display kind chip label'
  );
  assert.ok(
    code.includes("t('admin.artifacts.songSetDynamicNote')"),
    'Song set stage placeholder must use localized songSetDynamicNote'
  );
});

test('T-20-08, T-20-09, T-20-12: SPEC-20-04 serializeCanvas Textbox Auto-Sync, Clamping & Width Narrowing', () => {
  const layout = {
    aspectRatio: '16:9',
    backgroundColor: '#000000',
    elements: [
      {
        id: 'text-1',
        type: 'text',
        required: false,
        x: 10,
        y: 10,
        w: 50,
        h: 10, // Originally only 10% height = 54px
        zIndex: 0,
        content: 'Large Headline Title',
        style: {
          fontFamily: 'Inter, sans-serif',
          fontSize: 80, // 80px font rendered height exceeds 54px
        },
      },
    ],
  };

  class MockFabricText {
    constructor(opts = {}) {
      this.type = 'textbox';
      Object.assign(this, opts);
    }
  }

  class MockCanvas {
    constructor(objects) {
      this._objects = objects;
    }
    getObjects() {
      return [...this._objects];
    }
  }

  // Rendered text height is 162px (162 / 540 = 30%)
  const liveText = new MockFabricText({
    data: { elementId: 'text-1' },
    left: (10 / 100) * 960,
    top: (10 / 100) * 540,
    width: (50 / 100) * 960,
    height: 162,
    scaleX: 1,
    scaleY: 1,
    text: 'Large Headline Title',
  });

  const serialized = serializeCanvas(new MockCanvas([liveText]), layout, new Map());
  assert.equal(serialized.length, 1);

  // Height auto-synced from 10% to 30%
  assert.ok(
    Math.abs(serialized[0].h - 30) < 0.01,
    `Textbox height must auto-sync to measured height (30%), got ${serialized[0].h}`
  );
  assert.notEqual(serialized[0].h, 10, 'Textbox height must not stay locked at 10%');

  // Test Boundary Clamping: text element near bottom (y = 85%, rendered height 30% -> clamped to 15%)
  const overflowBottomLayout = {
    aspectRatio: '16:9',
    backgroundColor: '#000000',
    elements: [
      {
        id: 'text-bottom',
        type: 'text',
        required: false,
        x: 10,
        y: 85,
        w: 50,
        h: 10,
        zIndex: 0,
      },
    ],
  };

  const bottomText = new MockFabricText({
    data: { elementId: 'text-bottom' },
    left: (10 / 100) * 960,
    top: (85 / 100) * 540,
    width: (50 / 100) * 960,
    height: 162, // 30%
    scaleX: 1,
    scaleY: 1,
  });

  const serializedBottom = serializeCanvas(
    new MockCanvas([bottomText]),
    overflowBottomLayout,
    new Map()
  );
  assert.equal(serializedBottom.length, 1);
  // SPEC-21-02 supersedes SPEC-20-04 clamping: off-canvas height is preserved (30%)
  assert.equal(
    serializedBottom[0].h,
    30,
    `Height must be preserved for off-canvas bleeding (SPEC-21-02), got ${serializedBottom[0].h}`
  );

  // Test Horizontal Width Expansion: un-resized text whose measured width exceeds authored width
  const liveWidenedText = new MockFabricText({
    data: { elementId: 'text-1' },
    left: (10 / 100) * 960,
    top: (10 / 100) * 540,
    width: (65 / 100) * 960, // Widened to 65%
    height: 162,
    scaleX: 1,
    scaleY: 1,
  });

  const serializedWidened = serializeCanvas(
    new MockCanvas([liveWidenedText]),
    layout,
    new Map()
  );
  assert.ok(
    Math.abs(serializedWidened[0].w - 65) < 0.01,
    `Width must auto-expand to 65%, got ${serializedWidened[0].w}`
  );

  // Test Intentional Width Narrowing (Shrink): operator drags handle to narrow box (50% -> 35%)
  const liveNarrowedText = new MockFabricText({
    data: { elementId: 'text-1' },
    left: (10 / 100) * 960,
    top: (10 / 100) * 540,
    width: (35 / 100) * 960, // Narrowed to 35%
    height: 162,
    scaleX: 1,
    scaleY: 1,
  });

  const serializedNarrowed = serializeCanvas(
    new MockCanvas([liveNarrowedText]),
    layout,
    new Map()
  );
  assert.ok(
    Math.abs(serializedNarrowed[0].w - 35) < 0.01,
    `Narrowed width must persist as 35% when resized by handle, got ${serializedNarrowed[0].w}`
  );
});

test('T-20-10 & T-20-11: Presentation Fit Parity (real estimateTextFitScale returns 1.0)', () => {
  // Before auto-sync: element has tiny h=10% (54px), 80px font, 2 lines. estimateTextFitScale drops < 1.0
  const unSyncedElement = {
    id: 't-unsynced',
    type: 'text',
    required: false,
    x: 10,
    y: 10,
    w: 50,
    h: 10,
    zIndex: 0,
    text: 'Title Text\nSubtitle Line',
    style: { fontSize: 80 },
  };
  const unSyncedFit = estimateTextFitScale(unSyncedElement);
  assert.ok(
    unSyncedFit < 1.0,
    `Un-synced element with tiny bounding box must shrink in estimateTextFitScale, got ${unSyncedFit}`
  );

  // After auto-sync: element has auto-synced h=40% (216px), which accommodates 80px font and 2 lines
  const autoSyncedElement = {
    ...unSyncedElement,
    h: 40,
  };
  const autoSyncedFit = estimateTextFitScale(autoSyncedElement);
  assert.equal(
    autoSyncedFit,
    1.0,
    `Auto-synced element must maintain 1.0 scale (no auto-shrink) in estimateTextFitScale, got ${autoSyncedFit}`
  );
});
