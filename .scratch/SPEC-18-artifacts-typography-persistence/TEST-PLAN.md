# Test Plan — SPEC-18 (Artifacts Canvas Typography & Layout Persistence Follow-up)

## Test Targets

1. `internal/plan/validate_artifact.go` (Go schema & validator for `textShadowBlur`)
2. `src/lib/registry/types.ts` (`TextStyle.textShadowBlur` type definition)
3. `src/lib/registry/canvas-utils.ts` (`serializeTextStyle` & `serializeCanvas` width persistence)
4. `src/components/admin/ArtifactEditor.tsx` (Shadow blur hydration & Searchable Font Picker UI)
5. `src/components/artifacts/ArtifactSlide.tsx` & `src/lib/pptx-draw.ts` (Multi-surface shadow blur consumption)

## Test Suites

### 1. Text Shadow Blur Validation & Serialization (`tests/artifact-editor-controls.test.mjs` & `tests/registry-go-http.test.mjs`)
- Assert `internal/plan/validate_artifact.go` permits `textShadowBlur` in `allowedStyleKeys`.
- Assert Go validator accepts valid `textShadowBlur` (e.g. `0`, `4`, `15`, `20`) and rejects invalid values (negative numbers, strings, or numbers > 20).
- Assert `serializeTextStyle` saves `textShadowBlur` as a positive integer or 0 when `textShadow` is enabled.
- Assert `elementToFabricObject` passes `blur: element.style.textShadowBlur` into `fabric.Shadow`.
- Assert `ArtifactSlide.tsx` and `pptx-draw.ts` map `textShadowBlur` to CSS and PPTX models.

### 2. Searchable Font Picker & Group Header Contrast (`tests/artifact-editor-layout.test.mjs`)
- Assert font family picker contains an integrated search input for filtering fonts.
- Assert typing a search query filters the displayed font list without breaking category header grouping.
- Assert category headers carry high-contrast background classes (`bg-muted`, `text-foreground`, `font-bold`).
- Assert properties toolbar container remains strictly locked at `h-[88px] min-h-[88px] max-h-[88px]` in all selection states.

### 3. Textbox Width Resize Persistence (`tests/artifact-editor-controls.test.mjs`)
- Assert `serializeCanvas` correctly detects changed `obj.width` when `scaleX = 1` (simulating dragging the side resize handles).
- Assert `serializeCanvas` calculates and writes `pxToPct(measuredWidth, CANVAS_WIDTH)` when `measuredWidth !== authoredWidth`.
- Assert untouched seed templates (like `welcome` slide) preserve their exact original `source.w` percentage when not resized.
- Behavioral test: resizing text box from `w: 56.42%` to `w: 80%` preserves `80%` through serialization, ensuring text remains on one line.

### 4. End-to-End Automated Smoke Test (`tests/smoke-spec-18.test.mjs`)
- Script checking:
  1. `textShadowBlur` in Go validator and TS types.
  2. `serializeCanvas` textbox width update calculation.
  3. Searchable font picker and contrast header markup in `ArtifactEditor.tsx`.
  4. Build and typecheck pass without errors.
