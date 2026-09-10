import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { validateArtifactTemplate } from '../src/lib/registry/validate.ts';
import { serializeCanvas, pctToPx, pxToPct, CANVAS_WIDTH, CANVAS_HEIGHT } from '../src/lib/registry/canvas-utils.ts';

test('SPEC-19-01: Searchable font dropdown keyboard isolation & popper alignment', () => {
  const editorPath = path.resolve('src/components/admin/ArtifactEditor.tsx');
  const code = fs.readFileSync(editorPath, 'utf8');

  // 1. alignItemWithTrigger={false} or PopoverContent, side="bottom", align="start", sideOffset={4}
  assert.ok(
    code.includes('alignItemWithTrigger={false}') || code.includes('PopoverContent'),
    'Font dropdown must configure alignment or PopoverContent'
  );
  assert.ok(
    code.includes('side="bottom"') && code.includes('align="start"'),
    'SelectContent must anchor to bottom start'
  );
  assert.ok(
    code.includes('sideOffset={4}'),
    'SelectContent must set sideOffset={4}'
  );

  // 2. Keyboard & pointer event propagation isolation
  assert.ok(
    code.includes("if (e.key !== 'Escape') e.stopPropagation();"),
    'Search input and container must stop keydown propagation for all keys except Escape'
  );
  assert.ok(
    code.includes('onKeyUp={(e) => e.stopPropagation()}'),
    'Search input and container must stop keyup propagation'
  );
  assert.ok(
    code.includes('onPointerDown={(e) => e.stopPropagation()}'),
    'Search input and container must stop pointerdown propagation'
  );

  // 3. Search input autofocus / focus on open and reset on close
  assert.ok(
    code.includes('fontSearchInputRef.current?.focus()'),
    'onOpenChange must focus the search input upon opening'
  );
  assert.ok(
    code.includes("setFontSearchQuery('')"),
    'onOpenChange must reset search query when dropdown closes'
  );
});

test('SPEC-19-02: Live element duplication styling & geometry fidelity', () => {
  const editorPath = path.resolve('src/components/admin/ArtifactEditor.tsx');
  const code = fs.readFileSync(editorPath, 'utf8');

  // 1. Live styling extraction in handleDuplicateSelected
  assert.ok(
    code.includes('clonedStyle.fontFamily = resolveCatalogFontFamily(obj.fontFamily)') ||
      code.includes('clonedStyle.fontFamily = obj.fontFamily'),
    'handleDuplicateSelected must extract live fontFamily from active Fabric text object'
  );
  assert.ok(
    code.includes('clonedStyle.fontSize = normalizeFontSize(obj.fontSize)'),
    'handleDuplicateSelected must extract live fontSize from active Fabric text object'
  );
  assert.ok(
    code.includes('clonedStyle.fontColor = fillHex'),
    'handleDuplicateSelected must extract live font color from active Fabric text object'
  );
  assert.ok(
    code.includes('clonedStyle.textShadowBlur ='),
    'handleDuplicateSelected must extract live text shadow blur from active Fabric text object'
  );
  assert.ok(
    code.includes('clonedStyle.fillColor = shapeFillHex'),
    'handleDuplicateSelected must extract live shape fill color from active Fabric shape object'
  );

  // 2. Live position and dimensions extraction
  assert.ok(
    code.includes('const leftPx = typeof obj.left === \'number\' ? obj.left : pctToPx(source.x, CANVAS_WIDTH)'),
    'handleDuplicateSelected must read live obj.left position'
  );
  assert.ok(
    code.includes('const topPx = typeof obj.top === \'number\' ? obj.top : pctToPx(source.y, CANVAS_HEIGHT)'),
    'handleDuplicateSelected must read live obj.top position'
  );
  assert.ok(
    code.includes('const objW = Math.abs(obj.width ?? 0) * (obj.scaleX ?? 1)'),
    'handleDuplicateSelected must compute live element width from scaleX'
  );
  assert.ok(
    code.includes('const objH = Math.abs(obj.height ?? 0) * (obj.scaleY ?? 1)'),
    'handleDuplicateSelected must compute live element height from scaleY'
  );
});

test('SPEC-19-03: Canvas add element tool mode isolation (skipTargetFind)', () => {
  const editorPath = path.resolve('src/components/admin/ArtifactEditor.tsx');
  const code = fs.readFileSync(editorPath, 'utf8');

  // 1. Canvas isolation flags when drawingTool is active
  assert.ok(
    code.includes('canvas.skipTargetFind = true'),
    'ArtifactEditor must set canvas.skipTargetFind = true when drawingTool is active'
  );
  assert.ok(
    code.includes('canvas.selection = false'),
    'ArtifactEditor must set canvas.selection = false when drawingTool is active'
  );
  assert.ok(
    code.includes("canvas.hoverCursor = 'crosshair'"),
    'ArtifactEditor must set canvas.hoverCursor = crosshair when drawingTool is active'
  );

  // 2. Restoration of normal canvas state when drawingTool is inactive
  assert.ok(
    code.includes('canvas.skipTargetFind = false'),
    'ArtifactEditor must restore canvas.skipTargetFind = false when drawingTool is inactive'
  );
  assert.ok(
    code.includes('canvas.selection = true'),
    'ArtifactEditor must restore canvas.selection = true when drawingTool is inactive'
  );
  assert.ok(
    code.includes("canvas.hoverCursor = 'move'"),
    'ArtifactEditor must restore canvas.hoverCursor = move when drawingTool is inactive'
  );

  // 3. Escape key cancels active drawing tool
  assert.ok(
    code.includes("e.key === 'Escape' && drawingToolRef.current"),
    'Pressing Escape must cancel active drawing tool'
  );
});

test('SPEC-19-04: Shape fill color & opacity serialization persistence', () => {
  const utilsPath = path.resolve('src/lib/registry/canvas-utils.ts');
  const utilsCode = fs.readFileSync(utilsPath, 'utf8');

  // Source guard: serializeCanvas contains branch for source.type === 'shape'
  assert.ok(
    utilsCode.includes("if (source.type === 'shape')"),
    'serializeCanvas must have dedicated serialization branch for source.type === shape'
  );

  // Behavioral test: serializeCanvas with modified live shape fill
  const layout = {
    aspectRatio: '16:9',
    backgroundColor: '#000000',
    elements: [
      {
        id: 'shape-1',
        type: 'shape',
        required: false,
        x: 10,
        y: 10,
        w: 30,
        h: 20,
        zIndex: 0,
        style: {
          fillColor: '#5C2E16',
          opacity: 1,
        },
      },
    ],
  };

  class MockFabricShape {
    constructor(opts = {}) {
      this.type = 'rect';
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

  // Operator changed shape fill from #5C2E16 to #2563EB
  const liveShape = new MockFabricShape({
    data: { elementId: 'shape-1' },
    left: (10 / 100) * 960,
    top: (10 / 100) * 540,
    width: (30 / 100) * 960,
    height: (20 / 100) * 540,
    scaleX: 1,
    scaleY: 1,
    fill: '#2563EB',
    opacity: 0.85,
  });

  const serialized = serializeCanvas(new MockCanvas([liveShape]), layout, new Map());
  assert.equal(serialized.length, 1);
  assert.equal(
    serialized[0].style?.fillColor,
    '#2563EB',
    'Custom shape fill color #2563EB must be preserved in serialized style.fillColor'
  );
  assert.equal(
    serialized[0].style?.opacity,
    0.85,
    'Custom shape opacity must be preserved in serialized style.opacity'
  );

  // Validator test: template with custom shape fillColor passes validateArtifactTemplate
  const template = {
    schemaVersion: 1,
    id: 'test-shape-fill-persistence',
    label: 'Shape Fill Persistence Test',
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
  assert.equal(
    validated.layouts.default.elements[0].style?.fillColor,
    '#2563EB',
    'Template with custom shape fillColor #2563EB must pass validation'
  );
});

test('SPEC-19-05: Presentation auto-shrink sync, 0.75 pt/px equivalence & overflow badge', () => {
  // 1. Math invariant: 405 pt / 540 px = 0.75 pt/px
  const CANVAS_HEIGHT_PX = 540;
  const PPTX_SLIDE_HEIGHT_PT = 405;
  const PX_TO_PT = PPTX_SLIDE_HEIGHT_PT / CANVAS_HEIGHT_PX;
  assert.equal(PX_TO_PT, 0.75, 'Canvas px to PPTX pt ratio must be exactly 0.75');

  const FONT_50_PX = 50;
  const FONT_50_PT = FONT_50_PX * PX_TO_PT;
  assert.equal(FONT_50_PT, 37.5, '50px canvas font must equate to 37.5pt in PPTX');
  assert.equal(FONT_50_PX / CANVAS_HEIGHT_PX, FONT_50_PT / PPTX_SLIDE_HEIGHT_PT, 'Height fraction must be identical (9.259%)');

  // 2. Editor overflow handling & WYSIWYG auto-sync
  const editorCode = fs.readFileSync(path.resolve('src/components/admin/ArtifactEditor.tsx'), 'utf8');
  const canvasUtilsCode = fs.readFileSync(path.resolve('src/lib/registry/canvas-utils.ts'), 'utf8');
  assert.ok(
    canvasUtilsCode.includes('measuredTextHeightPct') || editorCode.includes('isTextOverflowing'),
    'ArtifactEditor or canvas-utils must handle text bounding box auto-sync / overflow'
  );
  assert.ok(
    canvasUtilsCode.includes('Math.max(source.h, measuredTextHeightPct)') ||
      editorCode.includes('⚠️ Text exceeds box bounds; presentation and PPTX will auto-shrink text to fit.'),
    'Bounding box must auto-sync height or render warning badge for text sizing parity'
  );

  // 3. Documentation check in .how/registry/06-flows/canvas-authoring-controls.md
  const docPath = path.resolve('.how/registry/06-flows/canvas-authoring-controls.md');
  const docContent = fs.readFileSync(docPath, 'utf8');
  assert.ok(
    docContent.includes('0.75') && docContent.includes('37.5'),
    'Documentation must explain the 0.75 pt/px equivalence and 50px = 37.5pt'
  );
  assert.ok(
    docContent.includes('largestFittingTextScale') && docContent.includes('estimateTextFitScale'),
    'Documentation must explain presentation view and PPTX shrink-to-fit auto-scaling'
  );
  assert.ok(
    docContent.includes('⚠️ Text exceeds box bounds; presentation and PPTX will auto-shrink text to fit.'),
    'Documentation must document the canvas overflow warning badge'
  );
});
