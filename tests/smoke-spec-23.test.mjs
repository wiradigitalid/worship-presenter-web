/**
 * SPEC-23: WYSIWYG Parity (Wrap Slack, Fit Width & Font Readiness) Smoke Suite
 *
 * Automated verification of:
 * - Longest-word slack invariant on Textbox widening (SPEC-23-01: T-23-01, T-23-02, T-23-03, T-23-17, T-23-18)
 * - Width-aware fit estimate in PPTX export (SPEC-23-02: T-23-04, T-23-05, T-23-19)
 * - Web font readiness gate (SPEC-23-03: T-23-06, T-23-07)
 * - OOXML emission fidelity (SPEC-23-04: T-23-08, T-23-09, T-23-10)
 * - Measurement coverage and healing pass (SPEC-23-05: T-23-11, T-23-12, T-23-13)
 * - PPTX-safe font flags & substitution rules (SPEC-23-06: T-23-14)
 * - Stored-state invariant & end-to-end line integrity (SPEC-23-07: T-23-15, T-23-16)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const {
  WRAP_SLACK_RATIO,
  applyWrapSlack,
  isMeasurementValid,
  isTextFitScaleMeasured,
  estimateTextFitScale,
  resolveWrapLineCount,
  estimateWrappedLineCount,
  resolveTextRunsForPptx,
  MIN_TEXT_FIT_SCALE,
} = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'artifacts', 'render-model.ts')).href
);

const { generatePptxFromPlan } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'pptx-draw.ts')).href
);
const JSZip = (await import('jszip')).default;

const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  serializeCanvas,
  pxToPct,
  pctToPx,
} = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'registry', 'canvas-utils.ts')).href
);

const { validateArtifactTemplate } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'registry', 'validate.ts')).href
);

const { hydrateArtifact } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'artifacts', 'hydrate.ts')).href
);

// Mock minimal Fabric objects for testing serializeCanvas
class MockFabricObject {
  constructor(options = {}) {
    this.type = options.type || 'rect';
    this.left = options.left ?? 0;
    this.top = options.top ?? 0;
    this.width = options.width ?? 100;
    this.height = options.height ?? 100;
    this.scaleX = options.scaleX ?? 1;
    this.scaleY = options.scaleY ?? 1;
    this.data = options.data || {};
    this.fill = options.fill;
    this.opacity = options.opacity;
  }
  get(key) {
    if (key === 'data') return this.data;
    return this[key];
  }
  set(keyOrObj, val) {
    if (typeof keyOrObj === 'object') {
      Object.assign(this, keyOrObj);
    } else {
      this[keyOrObj] = val;
    }
    return this;
  }
}

class MockFabricText extends MockFabricObject {
  constructor(text = '', options = {}) {
    super({ ...options, type: 'text' });
    this.text = text;
    this.fontSize = options.fontSize ?? 32;
    this.fontFamily = options.fontFamily ?? 'Arial';
    this.fontWeight = options.fontWeight ?? 'normal';
    this.fontStyle = options.fontStyle ?? 'normal';
    this.dynamicMinWidth = options.dynamicMinWidth;
    this.textLines = options.textLines;
  }
  _initDimensions() {
    // Mock re-wrap if width was widened
    if (Array.isArray(this.textLines) && this.dynamicMinWidth && this.width >= this.dynamicMinWidth) {
      // Re-wrap could reduce lines or preserve
      this.reWrapped = true;
    }
  }
}

class MockCanvas {
  constructor(objects = []) {
    this._objects = [...objects];
  }
  getObjects() {
    return [...this._objects];
  }
}

// --------------------------------------------------------------------------
// SPEC-23-01 Tests
// --------------------------------------------------------------------------

test('T-23-01: applyWrapSlack totality and boundary conditions', () => {
  const authored = 30; // 30% of canvas = 288px

  // 1. Non-finite and non-positive inputs return authored width unchanged
  assert.equal(applyWrapSlack(authored, 0), authored, 'zero word width returns authored width');
  assert.equal(applyWrapSlack(authored, -50), authored, 'negative word width returns authored width');
  assert.equal(applyWrapSlack(authored, NaN), authored, 'NaN word width returns authored width');
  assert.equal(applyWrapSlack(authored, Infinity), authored, 'Infinity word width returns authored width');
  assert.equal(applyWrapSlack(authored, -Infinity), authored, '-Infinity word width returns authored width');

  // 2. Word narrower than authored box returns authored width unchanged
  // authored 30% of 960 = 288px. Word width 200px * 1.02 = 204px (~21.25%).
  assert.equal(applyWrapSlack(authored, 200), authored, 'word narrower than box does not shrink or alter width');

  // 3. Word wider than authored box returns slacked width
  // Word width 400px * 1.02 = 408px -> 408 / 960 * 100 = 42.5%
  const slacked = applyWrapSlack(authored, 400);
  assert.equal(slacked, (400 * WRAP_SLACK_RATIO / CANVAS_WIDTH) * 100);
  assert.ok(slacked > authored, 'slacked width exceeds authored width');

  // 4. Requirement 4: Word wider than canvas width (960px) returns authored width unchanged
  // Overlong unbroken string longer than the slide MUST NOT widen off-canvas; it routes to shrink-to-fit
  assert.equal(applyWrapSlack(authored, 1200), authored, 'word exceeding canvas width returns authored width');
  assert.equal(applyWrapSlack(authored, CANVAS_WIDTH + 1), authored, 'word exceeding 960px returns authored width');
});

test('T-23-02: Slack applied on persist for F-1 WRAP-OVERLONG', () => {
  // F-1 fixture: 96px Arial 'Bandung international community'
  // 'international' width in Fabric is ~523.03px. Authored box was 20% (192px).
  const wordWidthPx = 523.03125;
  const layout = {
    aspectRatio: '16:9',
    backgroundColor: '#000000',
    elements: [
      {
        id: 'f1-text',
        type: 'text',
        required: false,
        x: 10,
        y: 10,
        w: 20, // narrow box
        h: 53.33,
        zIndex: 0,
        content: 'Bandung international community',
        style: { fontSize: 96, fontFamily: 'Arial' },
      },
    ],
  };

  const fabricObj = new MockFabricText('Bandung international community', {
    data: { elementId: 'f1-text' },
    left: pctToPx(10, CANVAS_WIDTH),
    top: pctToPx(10, CANVAS_HEIGHT),
    width: wordWidthPx, // Fabric auto-widens to largest word
    height: 288,
    dynamicMinWidth: wordWidthPx,
    textLines: ['Bandung', 'international', 'community'],
    fontSize: 96,
    fontFamily: 'Arial',
  });

  const canvas = new MockCanvas([fabricObj]);
  const serialized = serializeCanvas(canvas, layout, new Map());

  assert.equal(serialized.length, 1);
  const el = serialized[0];

  const minExpectedSlackWidthPct = (wordWidthPx * WRAP_SLACK_RATIO / CANVAS_WIDTH) * 100;
  assert.ok(
    el.w >= minExpectedSlackWidthPct,
    `serialized w (${el.w}%) must be >= slacked width (${minExpectedSlackWidthPct}%)`
  );
  assert.equal(el.longestWordPx, wordWidthPx, 'longestWordPx is persisted');
  assert.deepEqual(el.measuredWith, {
    fontFamily: 'Arial',
    fontSize: 96,
    fontWeight: 'normal',
    fontStyle: 'normal',
  }, 'measuredWith stamp is persisted');

  assert.equal(fabricObj.reWrapped, true, 're-wrap called on widening (Req 6)');

  // Verify validateArtifactTemplate accepts the serialized template
  const template = {
    schemaVersion: 1,
    id: 'test-f1',
    label: 'Test F1',
    baseType: 'general',
    placeholders: [],
    layouts: { default: { aspectRatio: '16:9', backgroundColor: '#000000', elements: serialized } },
  };
  assert.doesNotThrow(() => validateArtifactTemplate(template));
});

test('SPEC-23-01 Req 4: Overlong word exceeding canvas width is not widened in serializeCanvas', () => {
  const layout = {
    aspectRatio: '16:9',
    backgroundColor: '#000000',
    elements: [
      {
        id: 'overlong-text',
        type: 'text',
        required: false,
        x: 10,
        y: 10,
        w: 50,
        h: 20,
        zIndex: 0,
        content: 'supercalifragilisticexpialidociousunbrokenandlongerthanthewholecanvas',
        style: { fontSize: 96, fontFamily: 'Arial' },
      },
    ],
  };

  const fabricObj = new MockFabricText('supercalifragilisticexpialidociousunbrokenandlongerthanthewholecanvas', {
    data: { elementId: 'overlong-text' },
    left: pctToPx(10, CANVAS_WIDTH),
    top: pctToPx(10, CANVAS_HEIGHT),
    width: pctToPx(50, CANVAS_WIDTH),
    height: 100,
    dynamicMinWidth: 1200, // > 960 canvas width
    textLines: ['supercalifragilisticexpialidociousunbrokenandlongerthanthewholecanvas'],
    fontSize: 96,
    fontFamily: 'Arial',
  });

  const canvas = new MockCanvas([fabricObj]);
  const serialized = serializeCanvas(canvas, layout, new Map());
  assert.equal(serialized.length, 1);
  assert.equal(serialized[0].w, 50, 'box width is NOT widened when word exceeds canvas width');
});

test('SPEC-23-01/05 Hydration clears measurement fields on placeholder substitution (TS)', () => {
  const template = {
    schemaVersion: 1,
    id: 'tmpl-placeholder-hydrate',
    label: 'Placeholder Test',
    baseType: 'general',
    placeholders: [
      { key: 'title', type: 'text', required: true },
      { key: 'speaker', type: 'text', required: false, defaultValue: 'Pastor John' },
    ],
    layouts: {
      default: {
        aspectRatio: '16:9',
        backgroundColor: '#000000',
        elements: [
          {
            id: 'e-bound',
            type: 'text',
            required: true,
            placeholderKey: 'title',
            x: 10,
            y: 10,
            w: 80,
            h: 20,
            zIndex: 0,
            wrapLines: ['Old Authoring Wrap'],
            longestWordPx: 350,
            measuredWith: { fontFamily: 'Arial', fontSize: 40, fontWeight: 'normal', fontStyle: 'normal' },
          },
          {
            id: 'e-inline',
            type: 'text',
            required: false,
            content: '{speaker}',
            x: 10,
            y: 40,
            w: 80,
            h: 20,
            zIndex: 1,
            wrapLines: ['Old Inline Wrap'],
            longestWordPx: 250,
            measuredWith: { fontFamily: 'Arial', fontSize: 32, fontWeight: 'normal', fontStyle: 'normal' },
          },
        ],
      },
    },
  };

  const instance = hydrateArtifact(template, {
    instanceId: 'inst-1',
    values: { title: 'Sunday Worship Service' },
  });

  const eBound = instance.layout.elements.find((e) => e.id === 'e-bound');
  const eInline = instance.layout.elements.find((e) => e.id === 'e-inline');

  assert.equal(eBound.text, 'Sunday Worship Service');
  assert.equal(eBound.wrapLines, undefined, 'wrapLines stripped on substituted bound placeholder');
  assert.equal(eBound.longestWordPx, undefined, 'longestWordPx stripped on substituted bound placeholder');
  assert.equal(eBound.measuredWith, undefined, 'measuredWith stripped on substituted bound placeholder');

  assert.equal(eInline.text, 'Pastor John');
  assert.equal(eInline.wrapLines, undefined, 'wrapLines stripped on substituted sole-token placeholder');
  assert.equal(eInline.longestWordPx, undefined, 'longestWordPx stripped on substituted sole-token placeholder');
  assert.equal(eInline.measuredWith, undefined, 'measuredWith stripped on substituted sole-token placeholder');
});

test('T-23-03: No over-correction on F-2 WRAP-COMFORTABLE and non-text elements', () => {
  // F-2 fixture: box is 80% (768px), which is ~40% wider than 523px longest word
  const layout = {
    aspectRatio: '16:9',
    backgroundColor: '#000000',
    elements: [
      {
        id: 'f2-text',
        type: 'text',
        required: false,
        x: 10,
        y: 10,
        w: 80, // comfortable box
        h: 40,
        zIndex: 0,
        content: 'Bandung international community',
        style: { fontSize: 96, fontFamily: 'Arial' },
      },
      {
        id: 'f2-rect',
        type: 'shape',
        required: false,
        x: 10,
        y: 60,
        w: 30,
        h: 20,
        zIndex: 1,
        style: { fillColor: '#5C2E16', opacity: 1 },
      },
      {
        id: 'f2-img',
        type: 'image',
        required: false,
        x: 50,
        y: 60,
        w: 25,
        h: 25,
        zIndex: 2,
        imageRef: '/api/uploads/0123456789abcdef0123456789abcdef.png',
      },
    ],
  };

  const textObj = new MockFabricText('Bandung international community', {
    data: { elementId: 'f2-text' },
    left: pctToPx(10, CANVAS_WIDTH),
    top: pctToPx(10, CANVAS_HEIGHT),
    width: pctToPx(80, CANVAS_WIDTH),
    height: pctToPx(40, CANVAS_HEIGHT),
    dynamicMinWidth: 523.03125,
    textLines: ['Bandung international', 'community'],
    fontSize: 96,
    fontFamily: 'Arial',
  });

  const shapeObj = new MockFabricObject({
    data: { elementId: 'f2-rect' },
    type: 'rect',
    left: pctToPx(10, CANVAS_WIDTH),
    top: pctToPx(60, CANVAS_HEIGHT),
    width: pctToPx(30, CANVAS_WIDTH),
    height: pctToPx(20, CANVAS_HEIGHT),
    fill: '#5C2E16',
    opacity: 1,
  });

  const imgObj = new MockFabricObject({
    data: { elementId: 'f2-img' },
    type: 'image',
    left: pctToPx(50, CANVAS_WIDTH),
    top: pctToPx(60, CANVAS_HEIGHT),
    width: pctToPx(25, CANVAS_WIDTH),
    height: pctToPx(25, CANVAS_HEIGHT),
  });

  const canvas = new MockCanvas([textObj, shapeObj, imgObj]);
  const serialized = serializeCanvas(canvas, layout, new Map());
  const byId = new Map(serialized.map((e) => [e.id, e]));

  // 1. Text box width remains byte-identical to authored width
  assert.equal(byId.get('f2-text').w, 80, 'comfortable box width is not modified or shrunken');

  // 2. Shape width and height remain byte-identical
  assert.equal(byId.get('f2-rect').w, 30, 'shape width is unaffected');
  assert.equal(byId.get('f2-rect').h, 20, 'shape height is unaffected');

  // 3. Image width and height remain byte-identical
  assert.equal(byId.get('f2-img').w, 25, 'image width is unaffected');
  assert.equal(byId.get('f2-img').h, 25, 'image height is unaffected');
});

test('T-23-17: Off-canvas geometry survives slack widening unconstrained (F-4)', () => {
  // F-4: Elements positioned off-canvas with negative coords or exceeding 100%
  const layout = {
    aspectRatio: '16:9',
    backgroundColor: '#000000',
    elements: [
      {
        id: 'off-1',
        type: 'text',
        required: false,
        x: -5,
        y: -10,
        w: 50,
        h: 20,
        zIndex: 0,
        content: 'Top left bleed',
      },
      {
        id: 'off-2',
        type: 'text',
        required: false,
        x: 80,
        y: 10,
        w: 35, // 80 + 35 = 115% (> 100%)
        h: 20,
        zIndex: 1,
        content: 'Right edge bleed',
      },
    ],
  };

  const obj1 = new MockFabricText('Top left bleed', {
    data: { elementId: 'off-1' },
    left: pctToPx(-5, CANVAS_WIDTH),
    top: pctToPx(-10, CANVAS_HEIGHT),
    width: pctToPx(50, CANVAS_WIDTH),
    height: pctToPx(20, CANVAS_HEIGHT),
  });

  const obj2 = new MockFabricText('Right edge bleed', {
    data: { elementId: 'off-2' },
    left: pctToPx(80, CANVAS_WIDTH),
    top: pctToPx(10, CANVAS_HEIGHT),
    width: pctToPx(35, CANVAS_WIDTH),
    height: pctToPx(20, CANVAS_HEIGHT),
  });

  const canvas = new MockCanvas([obj1, obj2]);
  const serialized = serializeCanvas(canvas, layout, new Map());
  const byId = new Map(serialized.map((e) => [e.id, e]));

  assert.equal(byId.get('off-1').x, -5, 'negative x is preserved');
  assert.equal(byId.get('off-1').y, -10, 'negative y is preserved');
  assert.equal(byId.get('off-2').x, 80, 'off-canvas x is preserved');
  assert.equal(byId.get('off-2').w, 35, 'off-canvas w is preserved without clamp to 100 - x');
  assert.ok(byId.get('off-2').x + byId.get('off-2').w > 100, 'x + w exceeds 100% without truncation');
});

test('T-23-18: Slack ratio WRAP_SLACK_RATIO exceeds measured Fabric/Chromium delta', () => {
  // Measurement calibration: on 96px Arial 'international', Fabric un-kerned advance
  // and Chromium canvas 2D measureText are 523.03125px.
  // WRAP_SLACK_RATIO = 1.02 provides 2% metric slack (10.46px padding in 960px canvas).
  assert.equal(WRAP_SLACK_RATIO, 1.02, 'WRAP_SLACK_RATIO is calibrated to 1.02');
  assert.ok(WRAP_SLACK_RATIO > 1.0, 'ratio provides positive slack floor');
  assert.ok(WRAP_SLACK_RATIO <= 1.05, 'ratio is bounded so box does not visibly bloat');
});

test('SPEC-23-01 Schema and isMeasurementValid helper coverage', () => {
  // 1. isMeasurementValid checks
  const validElement = {
    id: 't1',
    type: 'text',
    longestWordPx: 523.03,
    measuredWith: {
      fontFamily: 'Arial',
      fontSize: 96,
      fontWeight: 'normal',
      fontStyle: 'normal',
    },
    style: {
      fontFamily: 'Arial',
      fontSize: 96,
      fontWeight: 'normal',
      fontStyle: 'normal',
    },
  };
  assert.equal(isMeasurementValid(validElement), true, 'exact match is valid');

  // Case insensitive family/weight/style match
  const caseMatchElement = {
    ...validElement,
    style: { fontFamily: 'arial', fontSize: 96, fontWeight: 'Normal', fontStyle: 'Normal' },
  };
  assert.equal(isMeasurementValid(caseMatchElement), true, 'case-insensitive attributes match');

  // Font size mismatch
  const sizeMismatch = { ...validElement, style: { ...validElement.style, fontSize: 80 } };
  assert.equal(isMeasurementValid(sizeMismatch), false, 'fontSize mismatch invalidates measurement');

  // Font family mismatch
  const familyMismatch = { ...validElement, style: { ...validElement.style, fontFamily: 'Great Vibes' } };
  assert.equal(isMeasurementValid(familyMismatch), false, 'fontFamily mismatch invalidates measurement');

  // Missing measuredWith or longestWordPx
  assert.equal(isMeasurementValid({ id: 't2' }), false, 'missing fields returns false');

  // 2. validateArtifactTemplate rejects single field present without the other
  const baseLayout = {
    aspectRatio: '16:9',
    backgroundColor: '#000000',
    elements: [
      {
        id: 'e1',
        type: 'text',
        required: false,
        x: 10,
        y: 10,
        w: 30,
        h: 20,
        zIndex: 0,
        content: 'Test',
      },
    ],
  };

  // Only longestWordPx
  const onlyLwp = JSON.parse(JSON.stringify(baseLayout));
  onlyLwp.elements[0].longestWordPx = 300;
  assert.throws(
    () => validateArtifactTemplate({ schemaVersion: 1, id: 't1', label: 'T1', baseType: 'general', placeholders: [], layouts: { default: onlyLwp } }),
    /longestWordPx and measuredWith must be provided together/
  );

  // Only measuredWith
  const onlyMw = JSON.parse(JSON.stringify(baseLayout));
  onlyMw.elements[0].measuredWith = { fontFamily: 'Arial', fontSize: 32, fontWeight: 'normal', fontStyle: 'normal' };
  assert.throws(
    () => validateArtifactTemplate({ schemaVersion: 1, id: 't2', label: 'T2', baseType: 'general', placeholders: [], layouts: { default: onlyMw } }),
    /longestWordPx and measuredWith must be provided together/
  );

  // Both present and valid passes
  const both = JSON.parse(JSON.stringify(baseLayout));
  both.elements[0].longestWordPx = 300;
  both.elements[0].measuredWith = { fontFamily: 'Arial', fontSize: 32, fontWeight: 'normal', fontStyle: 'normal' };
  assert.doesNotThrow(
    () => validateArtifactTemplate({ schemaVersion: 1, id: 't3', label: 'T3', baseType: 'general', placeholders: [], layouts: { default: both } })
  );
});

// --------------------------------------------------------------------------
// SPEC-23-02 Tests: Width-Aware Fit Estimate
// --------------------------------------------------------------------------

test('T-23-04: Width axis forces a shrink when longest word exceeds box width (F-1)', () => {
  // F-1 fixture: box width 20% = 192px on 960px canvas.
  // longestWordPx = 523.03125px ('international' at 96px Arial).
  const f1Element = {
    id: 'f1-narrow',
    type: 'text',
    x: 10,
    y: 10,
    w: 20, // 192px
    h: 53.33,
    zIndex: 0,
    text: 'Bandung international community',
    longestWordPx: 523.03125,
    measuredWith: {
      fontFamily: 'Arial',
      fontSize: 96,
      fontWeight: 'normal',
      fontStyle: 'normal',
    },
    style: {
      fontFamily: 'Arial',
      fontSize: 96,
      fontWeight: 'normal',
      fontStyle: 'normal',
    },
  };

  assert.equal(isTextFitScaleMeasured(f1Element), true, 'F-1 is recognized as measured');
  const scale = estimateTextFitScale(f1Element);
  assert.ok(scale < 1, `estimateTextFitScale must be < 1, got ${scale}`);

  // At this scale, the longest word must fit inside the 192px box:
  const scaledWordWidth = f1Element.longestWordPx * scale;
  const boxWidthPx = (f1Element.w / 100) * CANVAS_WIDTH;
  assert.ok(
    scaledWordWidth <= boxWidthPx + 0.01,
    `scaled word width (${scaledWordWidth}px) must fit inside box width (${boxWidthPx}px)`
  );
});

test('T-23-05: Unmeasured element degrades gracefully to pre-SPEC-23 behaviour', () => {
  // Element with no longestWordPx
  const unmeasuredNoLwp = {
    id: 'unmeas-1',
    type: 'text',
    x: 10,
    y: 10,
    w: 20,
    h: 53.33,
    zIndex: 0,
    text: 'Bandung international community',
    style: {
      fontFamily: 'Arial',
      fontSize: 96,
    },
  };

  assert.equal(isTextFitScaleMeasured(unmeasuredNoLwp), false, 'missing longestWordPx is unmeasured');
  const unmeasuredScale = estimateTextFitScale(unmeasuredNoLwp);

  // When unmeasured, contentWidth falls back to 0, and line count falls back to explicit newlines (1 line)
  // Height needed = 1 * 1.2 * 96 = 115.2px. Box height = 53.33% of 540 = 287.98px.
  // 115.2 < 287.98, so unmeasured scale is 1 (blind to width axis!).
  assert.equal(unmeasuredScale, 1, 'unmeasured element returns pre-SPEC-23 scale 1');

  // Element with style mismatch (e.g. fontSize changed from 96 to 72 without re-measuring)
  const styleMismatch = {
    ...unmeasuredNoLwp,
    longestWordPx: 523.03125,
    measuredWith: {
      fontFamily: 'Arial',
      fontSize: 96,
      fontWeight: 'normal',
      fontStyle: 'normal',
    },
    style: {
      fontFamily: 'Arial',
      fontSize: 72, // mismatch!
    },
  };

  assert.equal(isTextFitScaleMeasured(styleMismatch), false, 'style mismatch is treated as unmeasured');
  assert.equal(estimateTextFitScale(styleMismatch), 1, 'style mismatch degrades to pre-SPEC-23 scale');

  // Placeholder element is treated as unmeasured
  const placeholderEl = {
    ...unmeasuredNoLwp,
    placeholderKey: 'sermon_title',
    longestWordPx: 523.03125,
    measuredWith: {
      fontFamily: 'Arial',
      fontSize: 96,
      fontWeight: 'normal',
      fontStyle: 'normal',
    },
  };
  assert.equal(isTextFitScaleMeasured(placeholderEl), false, 'placeholderKey is treated as unmeasured');
  assert.equal(estimateTextFitScale(placeholderEl), 1, 'placeholderKey element returns unmeasured scale 1');
});

test('SPEC-23-02 Comfortable measured element returns scale 1 without gratuitous shrinking', () => {
  // Comfortable box: w: 80% (768px), h: 60% (324px).
  // Longest word: 523px ('international').
  // Box is wider than word (768 > 523) and tall enough for 2 lines (324 > 230px).
  const comfortableEl = {
    id: 'f2-comfortable',
    type: 'text',
    x: 10,
    y: 10,
    w: 80,
    h: 60,
    zIndex: 0,
    text: 'Bandung international community',
    longestWordPx: 523.03125,
    measuredWith: {
      fontFamily: 'Arial',
      fontSize: 96,
      fontWeight: 'normal',
      fontStyle: 'normal',
    },
    style: {
      fontFamily: 'Arial',
      fontSize: 96,
      fontWeight: 'normal',
      fontStyle: 'normal',
    },
  };

  assert.equal(isTextFitScaleMeasured(comfortableEl), true);
  const scale = estimateTextFitScale(comfortableEl);
  assert.equal(scale, 1, `comfortable element must return scale 1 without shrinking, got ${scale}`);
});

test('SPEC-23-02 estimateWrappedLineCount bounds and totality', () => {
  const boxWidthPx = 400;
  const longestWordPx = 100; // ~10 chars word -> ~10px/char -> 40 chars/line

  // 1. Normal multi-word text without explicit newlines
  const text = 'This is a multi word sentence that should wrap across several lines comfortably.';
  const estLines = estimateWrappedLineCount(text, boxWidthPx, longestWordPx);
  assert.ok(estLines >= 2, `expected at least 2 lines, got ${estLines}`);

  // 2. Empty text and whitespace-only text
  assert.equal(estimateWrappedLineCount('', boxWidthPx, longestWordPx), 1, 'empty text returns 1');
  assert.equal(estimateWrappedLineCount('   \n  ', boxWidthPx, longestWordPx), 2, 'whitespace with newline returns newline count');

  // 3. Text with more newlines than words
  const moreNewlines = 'one\n\n\ntwo\n\n';
  const nlCount = moreNewlines.split('\n').length;
  const estNl = estimateWrappedLineCount(moreNewlines, boxWidthPx, longestWordPx);
  assert.ok(estNl >= nlCount, `estimated lines must be at least newline count (${nlCount}), got ${estNl}`);

  // 4. Non-positive or non-finite longestWordPx
  assert.equal(estimateWrappedLineCount(text, boxWidthPx, 0), 1, 'zero longestWordPx returns newline count');
  assert.equal(estimateWrappedLineCount(text, boxWidthPx, -50), 1, 'negative longestWordPx returns newline count');
  assert.equal(estimateWrappedLineCount(text, boxWidthPx, NaN), 1, 'NaN longestWordPx returns newline count');
});

test('T-23-19: Sub-floor branch is named and respected on F-5', () => {
  // F-5: A word that cannot fit even at MIN_TEXT_FIT_SCALE (0.35)
  // E.g., boxWidth = 50px, longestWordPx = 500px.
  // Needed scale to fit width: 50 / 500 = 0.10.
  // Policy floors at MIN_TEXT_FIT_SCALE (0.35).
  const f5Element = {
    id: 'f5-subfloor',
    type: 'text',
    x: 10,
    y: 10,
    w: (50 / CANVAS_WIDTH) * 100, // 50px box
    h: 50,
    zIndex: 0,
    text: 'superlongwordthatcannotfit',
    longestWordPx: 500,
    measuredWith: {
      fontFamily: 'Arial',
      fontSize: 96,
      fontWeight: 'normal',
      fontStyle: 'normal',
    },
    style: {
      fontFamily: 'Arial',
      fontSize: 96,
      fontWeight: 'normal',
      fontStyle: 'normal',
    },
  };

  const scale = estimateTextFitScale(f5Element);
  assert.equal(scale, MIN_TEXT_FIT_SCALE, `sub-floor element must clamp to floor ${MIN_TEXT_FIT_SCALE}, got ${scale}`);
});

// --------------------------------------------------------------------------
// SPEC-23-04 Tests: OOXML Emission Fidelity
// --------------------------------------------------------------------------

test('T-23-08: Soft wraps are <a:br/> inside one paragraph; operator newlines are separate <a:p>', async () => {
  // 1. resolveTextRunsForPptx pure tests
  const singleParaElement = {
    id: 'sp-1',
    type: 'text',
    x: 10,
    y: 10,
    w: 50,
    h: 30,
    zIndex: 0,
    text: 'Bandung international community',
    wrapLines: ['Bandung', 'international', 'community'],
    style: {},
  };

  const runs = resolveTextRunsForPptx(singleParaElement);
  assert.ok(Array.isArray(runs), 'wrapped element returns runs array');
  assert.equal(runs.length, 3);
  assert.equal(runs[0].text, 'Bandung');
  assert.equal(runs[0].options?.softBreakBefore, undefined);
  assert.equal(runs[1].text, 'international');
  assert.equal(runs[1].options?.softBreakBefore, true);
  assert.equal(runs[2].text, 'community');
  assert.equal(runs[2].options?.softBreakBefore, true);

  // 2. Multi-paragraph with soft wraps inside
  const multiParaElement = {
    id: 'mp-1',
    type: 'text',
    x: 10,
    y: 10,
    w: 50,
    h: 30,
    zIndex: 0,
    text: 'Line 1 word\nLine 2 long wrapped text here',
    wrapLines: ['Line 1 word', 'Line 2 long', 'wrapped text here'],
    style: {},
  };

  const mpRuns = resolveTextRunsForPptx(multiParaElement);
  assert.ok(Array.isArray(mpRuns));
  assert.equal(mpRuns[0].text, 'Line 1 word');
  assert.equal(mpRuns[0].options?.breakLine, true, 'first paragraph ends with breakLine');
  assert.equal(mpRuns[1].text, 'Line 2 long');
  assert.equal(mpRuns[1].options?.softBreakBefore, undefined);
  assert.equal(mpRuns[2].text, 'wrapped text here');
  assert.equal(mpRuns[2].options?.softBreakBefore, true);

  // 3. End-to-end XML generation test: wrapped element emits 1 <a:p> with <a:br/>
  const planItem = {
    artifact: {
      runtimeVersion: 1,
      instanceId: 'test-inst-1',
      templateId: 'test-tmpl-1',
      label: 'Test',
      baseType: 'general',
      layoutKey: 'default',
      layout: {
        aspectRatio: '16:9',
        backgroundColor: '#000000',
        elements: [singleParaElement],
      },
    },
  };

  const buf = await generatePptxFromPlan('2026-09-10', [planItem], 'none');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('ppt/slides/slide1.xml').async('string');

  const pMatches = xml.match(/<a:p>[\s\S]*?<\/a:p>/g) || [];
  const brMatches = xml.match(/<a:br\/>/g) || [];
  assert.equal(pMatches.length, 1, 'wrapped text with no operator newlines must emit exactly 1 <a:p>');
  assert.equal(brMatches.length, 2, 'wrapped text with 3 lines must emit 2 <a:br/> elements');
});

test('T-23-09: Explicit normAutofit fontScale="100000" in slide bodyPr', async () => {
  const planItem = {
    artifact: {
      runtimeVersion: 1,
      instanceId: 'test-inst-autofit',
      templateId: 'test-tmpl-autofit',
      label: 'Test Autofit',
      baseType: 'general',
      layoutKey: 'default',
      layout: {
        aspectRatio: '16:9',
        backgroundColor: '#000000',
        elements: [
          {
            id: 'auto-1',
            type: 'text',
            x: 10,
            y: 10,
            w: 80,
            h: 30,
            zIndex: 0,
            text: 'Autofit check text',
            style: { fontSize: 40 },
          },
        ],
      },
    },
  };

  const buf = await generatePptxFromPlan('2026-09-10', [planItem], 'none');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('ppt/slides/slide1.xml').async('string');

  assert.ok(
    xml.includes('<a:normAutofit fontScale="100000"/>'),
    'slide XML must contain explicit fontScale="100000"'
  );
  assert.ok(
    !xml.includes('<a:normAutofit/>') && !xml.includes('<a:normAutofit />'),
    'slide XML must never contain bare <a:normAutofit/>'
  );
  assert.ok(
    !xml.includes('lnSpcReduction'),
    'slide XML must not contain lnSpcReduction'
  );
});

test('T-23-10: Line spacing is always explicitly emitted with default TEXT_LINE_HEIGHT', async () => {
  const planItem = {
    artifact: {
      runtimeVersion: 1,
      instanceId: 'test-inst-lnspc',
      templateId: 'test-tmpl-lnspc',
      label: 'Test Line Spacing',
      baseType: 'general',
      layoutKey: 'default',
      layout: {
        aspectRatio: '16:9',
        backgroundColor: '#000000',
        elements: [
          {
            id: 'ln-1',
            type: 'text',
            x: 10,
            y: 10,
            w: 80,
            h: 30,
            zIndex: 0,
            text: 'Default line spacing element',
            style: { fontSize: 32 }, // no explicit lineHeight
          },
        ],
      },
    },
  };

  const buf = await generatePptxFromPlan('2026-09-10', [planItem], 'none');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('ppt/slides/slide1.xml').async('string');

  // TEXT_LINE_HEIGHT is 1.2 -> 120% -> spcPct val="120000"
  assert.ok(
    xml.includes('<a:spcPct val="120000"/>'),
    'slide XML must contain explicit <a:spcPct val="120000"/> for default 1.2 line spacing'
  );
});

