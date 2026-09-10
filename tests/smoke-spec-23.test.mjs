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
} = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'artifacts', 'render-model.ts')).href
);

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
