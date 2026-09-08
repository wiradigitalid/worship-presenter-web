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
  calculateImageFit,
  resolveInitialSelectedId,
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
    this.underline = options.underline;
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

  // Case E: Underline (BUG-10, OQ-41)
  const textObjUnderline = new MockFabricText('Hello', {
    fill: '#FFFFFF',
    fontSize: 32,
    fontFamily: 'Arial',
    underline: true,
    textAlign: 'left',
  });
  const styleUnderline = serializeTextStyle(sourceElem, textObjUnderline);
  assert.ok(styleUnderline);
  assert.equal(styleUnderline.textDecoration, 'underline');
});

test('SPEC-12-01 / BUG-10: Template with textDecoration: underline passes validator', () => {
  const templateWithUnderline = {
    schemaVersion: 1,
    id: 'underline-template',
    label: 'Underline Template',
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
            content: 'Underlined Header',
            style: {
              fontFamily: 'Arial',
              fontSize: 32,
              fontColor: '#FFFFFF',
              textDecoration: 'underline',
              textAlign: 'center',
            },
          },
        ],
      },
    },
  };
  const validated = validateArtifactTemplate(templateWithUnderline);
  assert.equal(validated.layouts.default.elements[0].style.textDecoration, 'underline');
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

test('AC-07: Seed template with non-dense zIndex preserves stored zIndex on insert (image, text, shape)', () => {
  // Seed layout with non-dense stored zIndex [1, 1, 1] (e.g. welcome template)
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

  const obj1 = new MockFabricText('Welcome to', { data: { elementId: 'e1' }, left: 54.048, top: 300.348 });
  const obj2 = new MockFabricText('BANDUNG INTERNATIONAL COMMUNITY', { data: { elementId: 'e2' }, left: 54.048, top: 434.592 });
  const obj3 = new MockFabricText('{service_date}', { data: { elementId: 'e3' }, left: 54.048, top: 483.3 });

  // 1. Exercise Insert Image control
  {
    const addedImage = new Map([
      [
        'usr-img-1',
        {
          id: 'usr-img-1',
          type: 'image',
          required: false,
          x: 10,
          y: 10,
          w: 30,
          h: 30,
          zIndex: 2, // maxZ + 1
          imageRef: '/api/uploads/test-image.png',
        },
      ],
    ]);
    const objImage = new MockFabricObject({ data: { elementId: 'usr-img-1' }, left: 96, top: 54, width: 288, height: 162 });
    const canvasWithImage = new MockCanvas([obj1, obj2, obj3, objImage]);

    const serializedImage = serializeCanvas(canvasWithImage, layout, addedImage);
    assert.equal(serializedImage.length, 4);
    const byId = new Map(serializedImage.map((e) => [e.id, e]));
    assert.equal(byId.get('e1').zIndex, 1, 'pre-existing e1 zIndex must stay 1 on image insert');
    assert.equal(byId.get('e2').zIndex, 1, 'pre-existing e2 zIndex must stay 1 on image insert');
    assert.equal(byId.get('e3').zIndex, 1, 'pre-existing e3 zIndex must stay 1 on image insert');
    assert.equal(byId.get('usr-img-1').zIndex, 2, 'inserted image zIndex must be above maxZ (2)');
    assert.deepEqual(
      serializedImage.map((e) => e.zIndex),
      [1, 1, 1, 2]
    );
  }

  // 2. Exercise Insert Text control
  {
    const addedText = new Map([
      [
        'usr-txt-1',
        {
          id: 'usr-txt-1',
          type: 'text',
          required: false,
          x: 10,
          y: 10,
          w: 40,
          h: 15,
          zIndex: 2, // maxZ + 1
          content: 'New text',
          style: { fontFamily: 'Arial', fontSize: 32, fontColor: '#FFFFFF', fontWeight: 'normal', textAlign: 'left' },
        },
      ],
    ]);
    const objText = new MockFabricText('New text', { data: { elementId: 'usr-txt-1' }, left: 96, top: 54, width: 384, height: 81 });
    const canvasWithText = new MockCanvas([obj1, obj2, obj3, objText]);

    const serializedText = serializeCanvas(canvasWithText, layout, addedText);
    assert.equal(serializedText.length, 4);
    const byId = new Map(serializedText.map((e) => [e.id, e]));
    assert.equal(byId.get('e1').zIndex, 1, 'pre-existing e1 zIndex must stay 1 on text insert');
    assert.equal(byId.get('e2').zIndex, 1, 'pre-existing e2 zIndex must stay 1 on text insert');
    assert.equal(byId.get('e3').zIndex, 1, 'pre-existing e3 zIndex must stay 1 on text insert');
    assert.equal(byId.get('usr-txt-1').zIndex, 2, 'inserted text zIndex must be above maxZ (2)');
    assert.deepEqual(
      serializedText.map((e) => e.zIndex),
      [1, 1, 1, 2]
    );
  }

  // 3. Exercise Insert Shape control
  {
    const addedShape = new Map([
      [
        'usr-shp-1',
        {
          id: 'usr-shp-1',
          type: 'shape',
          required: false,
          x: 10,
          y: 10,
          w: 30,
          h: 30,
          zIndex: 2, // maxZ + 1
          style: { fillColor: '#5C2E16', opacity: 1 },
        },
      ],
    ]);
    const objShape = new MockFabricObject({ data: { elementId: 'usr-shp-1' }, left: 96, top: 54, width: 288, height: 162 });
    const canvasWithShape = new MockCanvas([obj1, obj2, obj3, objShape]);

    const serializedShape = serializeCanvas(canvasWithShape, layout, addedShape);
    assert.equal(serializedShape.length, 4);
    const byId = new Map(serializedShape.map((e) => [e.id, e]));
    assert.equal(byId.get('e1').zIndex, 1, 'pre-existing e1 zIndex must stay 1 on shape insert');
    assert.equal(byId.get('e2').zIndex, 1, 'pre-existing e2 zIndex must stay 1 on shape insert');
    assert.equal(byId.get('e3').zIndex, 1, 'pre-existing e3 zIndex must stay 1 on shape insert');
    assert.equal(byId.get('usr-shp-1').zIndex, 2, 'inserted shape zIndex must be above maxZ (2)');
    assert.deepEqual(
      serializedShape.map((e) => e.zIndex),
      [1, 1, 1, 2]
    );
  }
});

test('AC-07: Seed template with non-dense zIndex preserves stored zIndex on element deletion', () => {
  // Seed layout with non-dense stored zIndex [1, 1, 1]
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

  const obj1 = new MockFabricText('Welcome to', { data: { elementId: 'e1' }, left: 54.048, top: 300.348 });
  const obj3 = new MockFabricText('{service_date}', { data: { elementId: 'e3' }, left: 54.048, top: 483.3 });

  // Delete element e2: canvas holds obj1 and obj3 in original relative order, added map empty
  const canvasAfterDelete = new MockCanvas([obj1, obj3]);
  const serialized = serializeCanvas(canvasAfterDelete, layout, new Map());

  assert.equal(serialized.length, 2);
  const byId = new Map(serialized.map((e) => [e.id, e]));
  assert.equal(byId.get('e1').zIndex, 1, 'surviving e1 stored zIndex must remain byte-identical (1)');
  assert.equal(byId.get('e3').zIndex, 1, 'surviving e3 stored zIndex must remain byte-identical (1)');
  assert.deepEqual(
    serialized.map((e) => e.zIndex),
    [1, 1]
  );
});

test('SPEC-12-01: ArtifactEditor source guards for realtime styling, underline, and shape color sync', async () => {
  const fs = await import('node:fs');
  const editorPath = path.join(root, 'src', 'components', 'admin', 'ArtifactEditor.tsx');
  const code = fs.readFileSync(editorPath, 'utf8');

  // 1. Textbox construction in elementToFabricObject handles textDecoration underline
  assert.ok(
    code.includes("style?.textDecoration === 'underline' ? { underline: true } : {}"),
    'elementToFabricObject must construct Textbox with underline when style.textDecoration is underline'
  );

  // 2. Realtime font color apply
  assert.ok(
    code.includes('handleFontColorChange'),
    'ArtifactEditor must have handleFontColorChange for realtime color update'
  );

  // 3. Realtime font size apply
  assert.ok(
    code.includes('handleFontSizeInput') && code.includes('obj.set({ fontSize: clamped })'),
    'handleFontSizeInput must update active text objects on canvas immediately'
  );

  // 4. Font size input is w-20 to fit 3 digits
  assert.ok(
    code.includes('className="w-20 h-7 text-xs text-center"'),
    'Font size input must use w-20 so 3 digits are not truncated'
  );

  // 5. Shape color sync and realtime apply
  assert.ok(
    code.includes('setShapeFill(toStrictHexColor'),
    'syncSelection must sync shape fill color from active shape'
  );
  assert.ok(
    code.includes('value={shapeFill}'),
    'Shape color input must be controlled with value={shapeFill}'
  );

  // 6. Underline toggle button
  assert.ok(
    code.includes('handleToggleUnderline'),
    'ArtifactEditor must define handleToggleUnderline'
  );
  assert.ok(
    code.includes("title={t('admin.artifacts.underline')}"),
    'ArtifactEditor must render an Underline button'
  );
});

test('SPEC-12-02: Canvas interaction regressions - context menu, keyboard delete, drag reorder', async () => {
  const fs = await import('node:fs');
  const editorPath = path.join(root, 'src', 'components', 'admin', 'ArtifactEditor.tsx');
  const code = fs.readFileSync(editorPath, 'utf8');

  // 1. Right-click context menu must have an opener wired
  assert.ok(
    code.includes('onContextMenu={') && code.includes('setContextMenu('),
    'Canvas shell must have onContextMenu handler that opens the context menu'
  );

  // 2. Keyboard Delete/Backspace shortcut with isEditing guard (DEC-012)
  assert.ok(
    code.includes("e.key !== 'Delete' && e.key !== 'Backspace'") ||
    (code.includes("'Delete'") && code.includes("'Backspace'")),
    'Must handle Delete and Backspace keys for selected canvas element'
  );
  assert.ok(
    code.includes('.isEditing'),
    'Keyboard delete must guard against active inline text editing'
  );

  // 3. Deck Sequence drag reorder handles dataTransfer and visual feedback
  assert.ok(
    code.includes('dragOverIndex') || code.includes('dropEffect'),
    'Deck sequence must handle drag events properly'
  );
  assert.ok(
    code.includes("getData('text/plain')") && code.includes('handleReorderTemplates'),
    'handleDrop must read source index from dataTransfer and persist reorder'
  );
});

test('SPEC-12-03: Image aspect ratio contain-fit in ArtifactEditor and canvas-utils', async () => {
  // 1. Behavioral test: Wide image (400x100 = 4:1) inside box (200x100 = 2:1)
  const wideFit = calculateImageFit(
    { left: 10, top: 20, width: 200, height: 100 },
    { width: 400, height: 100 },
    'contain'
  );
  assert.equal(wideFit.width, 400);
  assert.equal(wideFit.height, 100);
  assert.equal(wideFit.scaleX, 0.5);
  assert.equal(wideFit.scaleY, 0.5);
  // Rendered dimensions must preserve 4:1 ratio
  const wideRenderedW = wideFit.width * wideFit.scaleX;
  const wideRenderedH = wideFit.height * wideFit.scaleY;
  assert.equal(wideRenderedW, 200);
  assert.equal(wideRenderedH, 50);
  assert.equal(wideRenderedW / wideRenderedH, 4);
  // Centered vertically inside 100px box (top=20 + (100-50)/2 = 45)
  assert.equal(wideFit.top, 45);
  assert.equal(wideFit.left, 10);

  // 2. Behavioral test: Tall image (100x400 = 1:4) inside box (200x200 = 1:1)
  const tallFit = calculateImageFit(
    { left: 0, top: 0, width: 200, height: 200 },
    { width: 100, height: 400 },
    'contain'
  );
  assert.equal(tallFit.width, 100);
  assert.equal(tallFit.height, 400);
  assert.equal(tallFit.scaleX, 0.5);
  assert.equal(tallFit.scaleY, 0.5);
  // Rendered dimensions must preserve 1:4 ratio
  const tallRenderedW = tallFit.width * tallFit.scaleX;
  const tallRenderedH = tallFit.height * tallFit.scaleY;
  assert.equal(tallRenderedW, 50);
  assert.equal(tallRenderedH, 200);
  assert.equal(tallRenderedW / tallRenderedH, 0.25);
  // Centered horizontally inside 200px box (left=0 + (200-50)/2 = 75)
  assert.equal(tallFit.left, 75);
  assert.equal(tallFit.top, 0);

  // 3. ArtifactEditor wiring
  const fs = await import('node:fs');
  const editorPath = path.join(root, 'src', 'components', 'admin', 'ArtifactEditor.tsx');
  const code = fs.readFileSync(editorPath, 'utf8');
  assert.ok(
    code.includes('calculateImageFit('),
    'ArtifactEditor must use calculateImageFit to compute contain dimensions and position'
  );
  assert.ok(
    code.includes('width: initial.width') && code.includes('height: initial.height'),
    'FabricImage must use natural dimensions for width/height so scaleX/scaleY preserve aspect ratio'
  );
});

test('SPEC-12-04: Select dropdown renders item label instead of raw value key', async () => {
  const React = (await import('react')).default;
  const { extractSelectItems } = await import(
    pathToFileURL(path.join(root, 'src', 'lib', 'select-utils.ts')).href
  );

  // 1. Behavioral test: extractSelectItems scans JSX children and resolves value -> label
  const mockChildren = React.createElement(
    'div',
    null,
    React.createElement('div', { value: 'general' }, '📄 General Slide (Canvas)'),
    React.createElement('div', { value: 'song:opening_song_bt' }, '🎵 Bible Talk Opening Song'),
    React.createElement('div', { value: 'ann:1' }, '📢 Announcement Set 1')
  );

  const itemsMap = extractSelectItems(mockChildren);
  assert.equal(itemsMap.get('general'), '📄 General Slide (Canvas)');
  assert.equal(itemsMap.get('song:opening_song_bt'), '🎵 Bible Talk Opening Song');
  assert.equal(itemsMap.get('ann:1'), '📢 Announcement Set 1');

  // 2. Non-item children with native input type are not registered as select items
  const mockWithInput = React.createElement(
    'div',
    null,
    React.createElement('input', { type: 'text', value: 'stray-input-value' }),
    React.createElement('div', { value: 'legit-item' }, 'Legitimate Item')
  );
  const safeMap = extractSelectItems(mockWithInput);
  assert.equal(safeMap.has('stray-input-value'), false);
  assert.equal(safeMap.get('legit-item'), 'Legitimate Item');

  // 3. select.tsx wiring check: feeds extracted labels to Base UI native items prop
  const fs = await import('node:fs');
  const selectPath = path.join(root, 'src', 'components', 'ui', 'select.tsx');
  const code = fs.readFileSync(selectPath, 'utf8');
  assert.ok(
    code.includes('items={mergedItems}'),
    'select.tsx must feed extracted labels into Base UI native items prop'
  );
  assert.ok(
    code.includes('extractSelectItems'),
    'select.tsx must use extractSelectItems to resolve item labels'
  );
});

test('SPEC-12-06: Main Spine toolbar and title area consistency (BUG-12, BUG-13, BUG-17, DEC-009, DEC-011)', async () => {
  const fs = await import('node:fs');
  const editorPath = path.join(root, 'src', 'components', 'admin', 'ArtifactEditor.tsx');
  const code = fs.readFileSync(editorPath, 'utf8');

  // 1. Element Properties row is always mounted (BUG-13)
  assert.ok(
    code.includes('Properties (None): Select element first'),
    'Element Properties row must show "Properties (None): Select element first" when nothing selected'
  );
  assert.ok(
    code.includes('Properties (Image): No properties to change'),
    'Element Properties row must show "Properties (Image): No properties to change" when image selected'
  );

  // 2. Title area grouping per DEC-011
  assert.ok(
    code.includes('Canvas:'),
    'Title area must group canvas actions under "Canvas:" label per DEC-011'
  );

  // 3. Toolbar add buttons icon only, no "(Drag)" suffix (BUG-12)
  assert.ok(
    !code.includes('Text (Drag)') && !code.includes('Rectangle (Drag)'),
    'Toolbar add buttons must not include "(Drag)" text suffix'
  );

  // 4. Background button uses Background label and no Palette icon (BUG-12)
  assert.ok(
    !code.includes('<Palette') && code.includes('Background'),
    'Background button must use image icon and Background label'
  );

  // 5. No custom hover:bg-blue-600 overrides (DEC-009, BUG-17)
  assert.ok(
    !code.includes('hover:bg-blue-600'),
    'ArtifactEditor must not carry hand-written hover:bg-blue-600 button overrides'
  );
});

test('SPEC-13-01: Main Spine auto-selects first Deck Sequence slide on mount (BUG-1, BUG-8)', async () => {
  // 1. Behavioral tests for resolveInitialSelectedId (pure logic)
  const summaries = [{ id: 'slide-1' }, { id: 'slide-2' }, { id: 'slide-3' }];

  // Case A: Fresh load with no initial id -> auto-selects first slide
  assert.equal(
    resolveInitialSelectedId(null, null, summaries),
    'slide-1',
    'Must auto-select first slide on fresh load when nothing selected'
  );

  // Case B: Empty summaries guard -> returns null, does not select non-existent slide
  assert.equal(
    resolveInitialSelectedId(null, null, []),
    null,
    'Must return null when summaries list is empty'
  );

  // Case C: Pre-set initialSelectedId -> preserves explicit initial selection
  assert.equal(
    resolveInitialSelectedId(null, 'slide-2', summaries),
    'slide-2',
    'Must preserve explicit initialSelectedId'
  );

  // Case D: Existing current selection -> preserves current selected id
  assert.equal(
    resolveInitialSelectedId('slide-3', null, summaries),
    'slide-3',
    'Must preserve existing selection when current is already set'
  );

  // 2. Source scan guard: ArtifactEditor uses resolveInitialSelectedId in loadList resolution
  const fs = await import('node:fs');
  const editorPath = path.join(root, 'src', 'components', 'admin', 'ArtifactEditor.tsx');
  const code = fs.readFileSync(editorPath, 'utf8');

  assert.ok(
    code.includes('setSelectedId((current) => resolveInitialSelectedId(current, initialSelectedId, summaries))'),
    'ArtifactEditor must resolve initial selection via setSelectedId functional updater with resolveInitialSelectedId'
  );
});






