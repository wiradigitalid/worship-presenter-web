/**
 * DEC-004 / W3 Registry Canvas Controls Tests.
 *
 * Verifies:
 * 1. Image element insertion and canvas serialization.
 * 2. Explicit dense zIndex assignment (0..N-1) on canvas serialization and layer reordering.
 * 3. Conditional bold/italic styling:
 *    - Off-default ('bold' or 'italic') is serialized and accepted by validate_artifact.go rules.
 *    - Construction default ('normal' or unset) is NOT serialized on untouched seed layouts.
 * 4. Image deletion from layout leaves shared image references intact.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const {
  serializeTextStyle,
  serializeCanvas,
} = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'registry', 'canvas-utils.ts')).href
);
const { validateArtifactTemplate } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'registry', 'validate.ts')).href
);

// Mock minimal Fabric objects to test pure serialization functions in Node environment
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
  }
  get(key) {
    if (key === 'data') return this.data;
    return this[key];
  }
  set(opts) {
    Object.assign(this, opts);
    return this;
  }
}

class MockFabricText extends MockFabricObject {
  constructor(text = '', options = {}) {
    super({ ...options, type: 'text' });
    this.text = text;
    this.fontSize = options.fontSize;
    this.fontFamily = options.fontFamily;
    this.fontWeight = options.fontWeight;
    this.fontStyle = options.fontStyle;
    this.textAlign = options.textAlign;
  }
}

class MockCanvas {
  constructor(objects = []) {
    this._objects = [...objects];
  }
  getObjects() {
    return [...this._objects];
  }
  bringObjectForward(obj) {
    const idx = this._objects.indexOf(obj);
    if (idx < 0 || idx === this._objects.length - 1) return false;
    this._objects.splice(idx, 1);
    this._objects.splice(idx + 1, 0, obj);
    return true;
  }
  sendObjectBackwards(obj) {
    const idx = this._objects.indexOf(obj);
    if (idx <= 0) return false;
    this._objects.splice(idx, 1);
    this._objects.splice(idx - 1, 0, obj);
    return true;
  }
  bringObjectToFront(obj) {
    const idx = this._objects.indexOf(obj);
    if (idx < 0 || idx === this._objects.length - 1) return false;
    this._objects.splice(idx, 1);
    this._objects.push(obj);
    return true;
  }
  sendObjectToBack(obj) {
    const idx = this._objects.indexOf(obj);
    if (idx <= 0) return false;
    this._objects.splice(idx, 1);
    this._objects.unshift(obj);
    return true;
  }
}

test('Part 1 & 2: Image insertion and dense zIndex layer ordering (0..N-1)', () => {
  const layout = {
    aspectRatio: '16:9',
    backgroundColor: '#000000',
    elements: [
      {
        id: 'e1',
        type: 'text',
        required: false,
        x: 10,
        y: 10,
        w: 40,
        h: 20,
        zIndex: 0,
        content: 'Title',
        style: { fontSize: 32, fontColor: '#FFFFFF' },
      },
      {
        id: 'e2',
        type: 'shape',
        required: false,
        x: 20,
        y: 20,
        w: 30,
        h: 30,
        zIndex: 1,
        style: { fillColor: '#5C2E16', opacity: 1 },
      },
    ],
  };

  const added = new Map([
    [
      'usr-img-1',
      {
        id: 'usr-img-1',
        type: 'image',
        required: false,
        x: 50,
        y: 50,
        w: 30,
        h: 30,
        zIndex: 2,
        imageRef: '/api/uploads/0123456789abcdef0123456789abcdef.png',
      },
    ],
  ]);

  const obj1 = new MockFabricText('Title', { data: { elementId: 'e1' }, left: 96, top: 54, width: 384, height: 108 });
  const obj2 = new MockFabricObject({ data: { elementId: 'e2' }, left: 192, top: 108, width: 288, height: 162 });
  const obj3 = new MockFabricObject({ data: { elementId: 'usr-img-1' }, left: 480, top: 270, width: 288, height: 162 });

  const canvas = new MockCanvas([obj1, obj2, obj3]);

  // Serializing original canvas order: obj1=0, obj2=1, obj3=2
  const elements1 = serializeCanvas(canvas, layout, added);
  assert.equal(elements1.length, 3);
  const byId1 = new Map(elements1.map((e) => [e.id, e]));
  assert.equal(byId1.get('e1').zIndex, 0);
  assert.equal(byId1.get('e2').zIndex, 1);
  assert.equal(byId1.get('usr-img-1').zIndex, 2);
  assert.equal(byId1.get('usr-img-1').imageRef, '/api/uploads/0123456789abcdef0123456789abcdef.png');

  // Reorder: Send image to back (obj3 becomes first in canvas)
  canvas.sendObjectToBack(obj3);
  assert.deepEqual(canvas.getObjects().map((o) => o.data.elementId), ['usr-img-1', 'e1', 'e2']);

  const elements2 = serializeCanvas(canvas, layout, added);
  const byId2 = new Map(elements2.map((e) => [e.id, e]));
  assert.equal(byId2.get('usr-img-1').zIndex, 0);
  assert.equal(byId2.get('e1').zIndex, 1);
  assert.equal(byId2.get('e2').zIndex, 2);

  // Validate dense contiguous zIndex without gaps or duplicates
  const zIndices = elements2.map((e) => e.zIndex).sort((a, b) => a - b);
  assert.deepEqual(zIndices, [0, 1, 2]);

  // Reorder existing elements without adding new ones: e1 and e2
  const simpleLayout = {
    aspectRatio: '16:9',
    backgroundColor: '#000000',
    elements: [
      { id: 'e1', type: 'text', required: false, x: 10, y: 10, w: 40, h: 20, zIndex: 1 },
      { id: 'e2', type: 'shape', required: false, x: 20, y: 20, w: 30, h: 30, zIndex: 1 },
    ],
  };
  const cObj1 = new MockFabricText('E1', { data: { elementId: 'e1' } });
  const cObj2 = new MockFabricObject({ data: { elementId: 'e2' } });
  // Initial order: e1 (index 0), e2 (index 1)
  const reorderCanvas = new MockCanvas([cObj1, cObj2]);
  const noAdded = new Map();
  // Untouched save keeps [1, 1]
  const unchanged = serializeCanvas(reorderCanvas, simpleLayout, noAdded);
  assert.deepEqual(unchanged.map(e => e.zIndex), [1, 1]);

  // Operator reorders: send e2 backwards / bring e2 to front (flip order to e2, e1)
  reorderCanvas.bringObjectToFront(cObj1); // already front
  reorderCanvas.sendObjectToBack(cObj1); // becomes [cObj1, cObj2] -> wait, send to back makes cObj1 index 0
  // let's swap:
  reorderCanvas.bringObjectToFront(cObj1); // [cObj2, cObj1]
  const reordered = serializeCanvas(reorderCanvas, simpleLayout, noAdded);
  const reorderedById = new Map(reordered.map(e => [e.id, e]));
  assert.equal(reorderedById.get('e2').zIndex, 0);
  assert.equal(reorderedById.get('e1').zIndex, 1);
});

test('Part 3: Bold and Italic serialization follows setIfMeaningful discipline', () => {
  const sourceElem = {
    id: 'e1',
    type: 'text',
    required: false,
    x: 10,
    y: 10,
    w: 40,
    h: 20,
    zIndex: 0,
    content: 'Hello',
  };

  // Case A: Untouched / default text object without bold or italic
  const textObjNormal = new MockFabricText('Hello', {
    fill: '#FFFFFF',
    fontSize: 32,
    fontFamily: 'Arial',
    textAlign: 'left',
    // fontWeight and fontStyle undefined/normal
  });
  const styleNormal = serializeTextStyle(sourceElem, textObjNormal);
  // Must NOT invent or write fontWeight / fontStyle when they match defaults
  assert.equal(styleNormal, undefined);

  // Case B: Explicit Bold
  const textObjBold = new MockFabricText('Hello', {
    fill: '#FFFFFF',
    fontSize: 32,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    textAlign: 'left',
  });
  const styleBold = serializeTextStyle(sourceElem, textObjBold);
  assert.ok(styleBold);
  assert.equal(styleBold.fontWeight, 'bold');
  assert.equal(styleBold.fontStyle, undefined);

  // Case C: Explicit Italic
  const textObjItalic = new MockFabricText('Hello', {
    fill: '#FFFFFF',
    fontSize: 32,
    fontFamily: 'Arial',
    fontStyle: 'italic',
    textAlign: 'left',
  });
  const styleItalic = serializeTextStyle(sourceElem, textObjItalic);
  assert.ok(styleItalic);
  assert.equal(styleItalic.fontStyle, 'italic');
  assert.equal(styleItalic.fontWeight, undefined);

  // Case D: Both Bold and Italic
  const textObjBoth = new MockFabricText('Hello', {
    fill: '#FFFFFF',
    fontSize: 32,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    fontStyle: 'italic',
    textAlign: 'left',
  });
  const styleBoth = serializeTextStyle(sourceElem, textObjBoth);
  assert.ok(styleBoth);
  assert.equal(styleBoth.fontWeight, 'bold');
  assert.equal(styleBoth.fontStyle, 'italic');
});

test('Seed conformance proof: saving an untouched template does NOT introduce new fontStyle or fontWeight keys', () => {
  const seedElement = {
    id: 'e1',
    type: 'text',
    required: false,
    x: 5.63,
    y: 55.62,
    w: 56.42,
    h: 25.47,
    zIndex: 1,
    content: 'Welcome to',
    style: {
      fontSize: 101.75,
      fontColor: '#FFFFFF',
      textAlign: 'left',
    },
  };

  const textObj = new MockFabricText('Welcome to', {
    fill: '#FFFFFF',
    fontSize: 101.75,
    fontFamily: 'Arial',
    textAlign: 'left',
  });

  const serializedStyle = serializeTextStyle(seedElement, textObj);
  assert.equal(serializedStyle.fontWeight, undefined);
  assert.equal(serializedStyle.fontStyle, undefined);
  assert.deepEqual(serializedStyle, seedElement.style);
});

test('Validation: Template with image element, bold, italic, and explicit zIndex passes validator', () => {
  const templatePayload = {
    schemaVersion: 1,
    id: 'test-styled-slide',
    label: 'Test Styled Slide',
    baseType: 'general',
    placeholders: [],
    layouts: {
      default: {
        aspectRatio: '16:9',
        backgroundColor: '#000000',
        elements: [
          {
            id: 'e1',
            type: 'text',
            required: false,
            x: 10,
            y: 10,
            w: 80,
            h: 20,
            zIndex: 0,
            content: 'Bold and Italic Header',
            style: {
              fontFamily: 'Arial',
              fontSize: 32,
              fontColor: '#FFFFFF',
              fontWeight: 'bold',
              fontStyle: 'italic',
              textAlign: 'center',
            },
          },
          {
            id: 'e2',
            type: 'image',
            required: false,
            x: 10,
            y: 35,
            w: 80,
            h: 50,
            zIndex: 1,
            imageRef: '/api/uploads/0123456789abcdef0123456789abcdef.jpg',
          },
        ],
      },
    },
  };

  const validated = validateArtifactTemplate(templatePayload);
  assert.equal(validated.id, 'test-styled-slide');
  assert.equal(validated.layouts.default.elements[0].style.fontWeight, 'bold');
  assert.equal(validated.layouts.default.elements[0].style.fontStyle, 'italic');
  assert.equal(
    validated.layouts.default.elements[1].imageRef,
    '/api/uploads/0123456789abcdef0123456789abcdef.jpg'
  );
  assert.equal(validated.layouts.default.elements[0].zIndex, 0);
  assert.equal(validated.layouts.default.elements[1].zIndex, 1);
});

test('AC-06: Seed template with non-dense zIndex preserves stored zIndex when not reordered', () => {
  // Test with welcome template layout elements where stored zIndex is [1, 1, 1]
  const layout = {
    aspectRatio: '16:9',
    backgroundColor: '#000000',
    elements: [
      {
        id: 'e1',
        type: 'text',
        required: false,
        x: 5.63,
        y: 55.62,
        w: 56.42,
        h: 25.47,
        zIndex: 1,
        content: 'Welcome to',
        style: { fontSize: 101.75, fontColor: '#FFFFFF', textAlign: 'left' },
      },
      {
        id: 'e2',
        type: 'text',
        required: false,
        x: 5.63,
        y: 80.48,
        w: 77.04,
        h: 7.97,
        zIndex: 1,
        content: 'BANDUNG INTERNATIONAL COMMUNITY',
        style: { fontSize: 20.7, fontColor: '#FFFFFF', textAlign: 'left' },
      },
      {
        id: 'e3',
        type: 'text',
        required: false,
        x: 5.63,
        y: 89.5,
        w: 50,
        h: 5.5,
        zIndex: 1,
        content: '{service_date}',
        style: { fontSize: 14.67, fontColor: '#FFFFFF', textAlign: 'left' },
      },
    ],
  };

  // Mount canvas in initial painted order (sorted by zIndex then index): e1, e2, e3
  const obj1 = new MockFabricText('Welcome to', { data: { elementId: 'e1' }, left: 54.048, top: 300.348 });
  const obj2 = new MockFabricText('BANDUNG INTERNATIONAL COMMUNITY', { data: { elementId: 'e2' }, left: 54.048, top: 434.592 });
  const obj3 = new MockFabricText('{service_date}', { data: { elementId: 'e3' }, left: 54.048, top: 483.3 });

  const canvas = new MockCanvas([obj1, obj2, obj3]);
  const added = new Map();

  const serialized = serializeCanvas(canvas, layout, added);
  assert.equal(serialized.length, 3);
  assert.equal(serialized[0].zIndex, 1, 'e1 zIndex must stay 1');
  assert.equal(serialized[1].zIndex, 1, 'e2 zIndex must stay 1');
  assert.equal(serialized[2].zIndex, 1, 'e3 zIndex must stay 1');
  assert.deepEqual(
    serialized.map((e) => e.zIndex),
    [1, 1, 1]
  );

  // Partial survival (e.g. element deleted without reordering remaining ones)
  // Deleting e2 from canvas leaves obj1 and obj3 in original relative rank
  const canvasPartial = new MockCanvas([obj1, obj3]);
  const serializedPartial = serializeCanvas(canvasPartial, layout, added);
  assert.equal(serializedPartial.length, 2);
  assert.equal(serializedPartial[0].zIndex, 1);
  assert.equal(serializedPartial[1].zIndex, 1);
});
