---
type: mandate
id: DEC-023
status: applied
accepted_by: 'kodesh87 (2026-09-10)'
touches:
  - .control/memlog/autopilot-DEC-023.md
  - .control/registry/specs.yaml
  - .control/registry/decisions.yaml
  - src/components/admin/ArtifactEditor.tsx
  - src/lib/registry/canvas-utils.ts
  - src/lib/registry/font-catalog.ts
  - package.json
  - tests/smoke-spec-21.test.mjs
  - tests/smoke-spec-20.test.mjs
  - tests/artifact-editor-controls.test.mjs
  - .how/registry/06-flows/canvas-authoring-controls.md
supersedes: null
superseded_by: null
created: '2026-09-10'
---

# DEC-023 — Autopilot mandate for Artifacts Canvas Input UX, Off-Canvas Geometry Preservation & Cross-Renderer Text Parity (SPEC-21)

## Decision

> The owner grants an autonomous execution mandate to implement Canvas Editor Input UX, Off-Canvas Geometry Preservation & Cross-Renderer Text Parity under SPEC-21 (tickets SPEC-21-01 through SPEC-21-04), covering:
> 1) Font size input deferred commit on blur and Enter key, decoupling draft text state from canvas clamping so multi-digit numbers (e.g. 12, 20) can be typed without mid-keystroke reverts,
> 2) Preserving off-canvas geometry in `serializeCanvas` without clipping bounding boxes at 100% width/height, aligning with the architecture contract and PowerPoint off-canvas design practice,
> 3) Fabric text rendering alignment with presenter mode and PPTX export by disabling `splitByGrapheme` (whole-word wrapping), applying `getFontStack` font fallbacks, and standardizing default line-height to `TEXT_LINE_HEIGHT = 1.2`, and
> 4) Comprehensive automated test suite `tests/smoke-spec-21.test.mjs` (T-21-01..T-21-11) and documentation updates,
> carrying implementation through G5 Release with autonomous code execution, double review (self review + cursor-agent composer-2.5),
> and automated smoke testing in the dedicated run branch `autopilot/DEC-023`.

## Why

1. **Font Size Input Deferred Commit (SPEC-21-01)**:
   In `ArtifactEditor.tsx`, `handleFontSizeInput` was executing `clampFontSize` immediately on every keystroke, forcing `1` -> `8` and instantly syncing `fontSizeInput` back to `"8"`. Operators were unable to type `"12"` or `"20"`. Deferring commit to blur/Enter decouples draft editing from canvas mutation.
2. **Preserve Off-Canvas Geometry in `serializeCanvas` (SPEC-21-02)**:
   Lines 338-339 of `canvas-utils.ts` forcibly clamped `w <= 100 - x` and `h <= 100 - y`. In presentations and PPTX, off-canvas bleed is standard practice, and slide overflow is naturally hidden by presentation stage `overflow: hidden`. Clamping truncated boxes and caused unintended text wraps.
3. **Fabric Text Rendering Parity (SPEC-21-03)**:
   Fabric's `splitByGrapheme: true` broke words mid-syllable, disagreeing with CSS `pre-wrap` and PPTX word wrapping. Furthermore, bare font family strings lacked fallback stacks, and mismatched line-height defaults caused vertical layout drift. Unifying word wrapping, font stacks, and line height resolves cross-surface divergence.
4. **Automated Test Suite & Regression Prevention (SPEC-21-04)**:
   A dedicated smoke suite verifies that font size editing, off-canvas coordinates, and text wrapping remain identical across canvas, DOM presenter, and PPTX export.

## Cost

Operational decisions are recorded in the autopilot ledger (`.control/memlog/autopilot-DEC-023.md`).
Architectural invariants (AD-N) and public repo data cleanliness remain strictly preserved.
