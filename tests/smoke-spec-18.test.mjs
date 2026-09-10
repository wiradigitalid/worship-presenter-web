import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { validateArtifactTemplate } from '../src/lib/registry/validate.ts';
import { serializeCanvas, serializeTextStyle } from '../src/lib/registry/canvas-utils.ts';

test('SPEC-18-01: Text shadow blur persistence across surfaces and validators', () => {
  const goValidator = fs.readFileSync(path.resolve('internal/plan/validate_artifact.go'), 'utf8');
  assert.ok(goValidator.includes('"textShadowBlur": {}'), 'Go validator must allow textShadowBlur key');
  assert.ok(goValidator.includes('style["textShadowBlur"] = math.Round(n)'), 'Go validator must parse textShadowBlur');

  const tsValidator = fs.readFileSync(path.resolve('src/lib/registry/validate.ts'), 'utf8');
  assert.ok(tsValidator.includes("'textShadowBlur'"), 'TS validator must allow textShadowBlur');
  assert.ok(tsValidator.includes('textShadowBlur must be 0..20'), 'TS validator must validate range 0..20');

  const pptxDraw = fs.readFileSync(path.resolve('src/lib/pptx-draw.ts'), 'utf8');
  assert.ok(
    pptxDraw.includes("blur: typeof style.textShadowBlur === 'number' ? style.textShadowBlur : 4"),
    'pptx-draw must standardize fallback blur to 4'
  );

  const artifactSlide = fs.readFileSync(path.resolve('src/components/artifacts/ArtifactSlide.tsx'), 'utf8');
  assert.ok(
    artifactSlide.includes("typeof style.textShadowBlur === 'number' ? style.textShadowBlur : 4"),
    'ArtifactSlide must standardize fallback blur to 4'
  );

  const editor = fs.readFileSync(path.resolve('src/components/admin/ArtifactEditor.tsx'), 'utf8');
  assert.ok(
    editor.includes("blur: typeof style.textShadowBlur === 'number' ? style.textShadowBlur : 4"),
    'ArtifactEditor must initialize shadow blur from style.textShadowBlur with fallback 4'
  );

  // Behavioral test: serialization with blur
  const serialized = serializeTextStyle({ id: 'e1', type: 'text', x: 0, y: 0, w: 10, h: 10, zIndex: 0 }, {
    shadow: { blur: 14, color: 'rgba(0,0,0,0.8)' },
  });
  assert.equal(serialized?.textShadow, true);
  assert.equal(serialized?.textShadowBlur, 14);

  // Behavioral test: validation round-trip
  const template = {
    schemaVersion: 1,
    id: 'smoke-18-shadow',
    label: 'Smoke',
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
            h: 30,
            zIndex: 0,
            content: 'Smoke Test',
            style: { fontSize: 32, textShadow: true, textShadowBlur: 14 },
          },
        ],
      },
    },
  };
  const validated = validateArtifactTemplate(template);
  assert.equal(validated.layouts.default.elements[0].style.textShadowBlur, 14);
});

test('SPEC-18-02: Searchable font picker with high-contrast category headers and i18n', () => {
  const keysContent = fs.readFileSync(path.resolve('src/lib/i18n/keys.ts'), 'utf8');
  const enContent = fs.readFileSync(path.resolve('src/lib/i18n/catalogue-en.ts'), 'utf8');
  const idContent = fs.readFileSync(path.resolve('src/lib/i18n/catalogue-id.ts'), 'utf8');

  assert.ok(keysContent.includes("'admin.artifacts.searchFonts'"), 'keys.ts must contain searchFonts key');
  assert.ok(enContent.includes("'admin.artifacts.searchFonts': 'Search fonts...'"), 'catalogue-en must have searchFonts');
  assert.ok(idContent.includes("'admin.artifacts.searchFonts': 'Cari font...'"), 'catalogue-id must have searchFonts');

  const editorContent = fs.readFileSync(path.resolve('src/components/admin/ArtifactEditor.tsx'), 'utf8');
  assert.ok(
    editorContent.includes('bg-muted/90') &&
      editorContent.includes('border-primary') &&
      editorContent.includes('text-foreground font-bold'),
    'Category headers must have high-contrast styling'
  );
  assert.ok(
    editorContent.includes('admin.artifacts.searchFonts'),
    'Editor must render search input for font filtering'
  );
  assert.ok(
    editorContent.includes('h-[88px] min-h-[88px] max-h-[88px]'),
    'Toolbar must retain 88px fixed height'
  );
});

test('SPEC-18-03: Textbox width drag-resize serialization and seed conformance', () => {
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
        w: 56.42,
        h: 20,
        zIndex: 0,
        content: 'Welcome to',
        style: { fontSize: 114 },
      },
    ],
  };

  class MockFabricText {
    constructor(text, opts = {}) {
      this.type = 'textbox';
      this.text = text;
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

  // Widened text box (side handle dragged to 750px = 78.125%)
  const widenedText = new MockFabricText('Welcome to', {
    data: { elementId: 'e1' },
    left: 96,
    top: 54,
    width: 750,
    height: 108,
    scaleX: 1,
    scaleY: 1,
  });
  const serializedWidened = serializeCanvas(new MockCanvas([widenedText]), layout, new Map());
  assert.ok(
    Math.abs(serializedWidened[0].w - 78.125) < 0.01,
    `Widened text box width must update to ~78.125%, got ${serializedWidened[0].w}`
  );

  // Untouched element retains exact 56.42
  const untouchedText = new MockFabricText('Welcome to', {
    data: { elementId: 'e1' },
    left: 96,
    top: 54,
    width: (56.42 / 100) * 960,
    height: 108,
    scaleX: 1,
    scaleY: 1,
  });
  const serializedUntouched = serializeCanvas(new MockCanvas([untouchedText]), layout, new Map());
  assert.equal(serializedUntouched[0].w, 56.42, 'Untouched element must retain exact authored w');

  // Integration test: round-trip welcome template directly from default-registry.json
  const seedRaw = JSON.parse(fs.readFileSync(path.resolve('data/default-registry.json'), 'utf8'));
  const welcomeTemplate = seedRaw.find((t) => t.id === 'welcome');
  assert.ok(welcomeTemplate, 'welcome template must exist in default-registry.json');
  const welcomeLayout = welcomeTemplate.layouts.default;
  const fabricObjects = welcomeLayout.elements.map((el) => {
    return new MockFabricText(el.content ?? '', {
      data: { elementId: el.id },
      left: (el.x / 100) * 960,
      top: (el.y / 100) * 540,
      width: (el.w / 100) * 960,
      height: (el.h / 100) * 540,
      scaleX: 1,
      scaleY: 1,
    });
  });
  const roundTripElements = serializeCanvas(new MockCanvas(fabricObjects), welcomeLayout, new Map());
  const e1RoundTrip = roundTripElements.find((el) => el.id === 'e1');
  assert.equal(e1RoundTrip?.w, 56.42, 'Live welcome e1 w must stay exactly 56.42 on untouched serialization');
});
