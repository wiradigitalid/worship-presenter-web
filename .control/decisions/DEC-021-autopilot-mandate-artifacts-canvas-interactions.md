---
type: mandate
id: DEC-021
status: accepted
accepted_by: 'kodesh87 (2026-09-10)'
touches:
  - .control/memlog/autopilot-DEC-021.md
  - .control/registry/specs.yaml
  - .control/registry/decisions.yaml
  - src/components/ui/select.tsx
  - src/components/admin/ArtifactEditor.tsx
  - src/components/artifacts/ArtifactSlide.tsx
  - src/lib/registry/canvas-utils.ts
  - src/lib/artifacts/render-model.ts
  - tests/smoke-spec-19.test.mjs
  - tests/artifact-editor-controls.test.mjs
  - tests/artifact-editor-layout.test.mjs
supersedes: null
superseded_by: null
created: '2026-09-10'
---

# DEC-021 — Autopilot mandate for Artifacts Canvas Interactions, Shape Persistence & Typography Refinement (SPEC-19)

## Decision

> The owner grants an autonomous execution mandate to implement the Artifacts Canvas Interactions,
> Shape Persistence & Typography Refinement under SPEC-19 (tickets SPEC-19-01 through SPEC-19-05), covering:
> 1) Font search dropdown keyboard isolation and popper positioning (`alignItemWithTrigger={false}`),
> 2) Live element duplication styling and geometry fidelity,
> 3) Canvas element isolation during Add Element tool mode (`skipTargetFind`),
> 4) Shape fill color and opacity serialization persistence, and
> 5) Presentation view auto-shrink synchronization and canvas overflow feedback,
> carrying implementation through G5 Release with autonomous code execution, double review,
> and automated testing under `wdi-autopilot` in a separate session.

## Why

1. **Font Search Keyboard Isolation & Popper Positioning (SPEC-19-01)**:
   During manual testing of SPEC-18-02, the search input inside `<SelectContent>` could not be typed into
   because Base UI Select captures keyboard events for typeahead navigation. Furthermore, `alignItemWithTrigger`
   displaces the popup downward over 45 items. Disabling trigger item alignment and stopping event propagation
   ensures natural typing and neat dropdown positioning directly beneath the trigger button.
2. **Live Element Duplication Fidelity (SPEC-19-02)**:
   Duplicating an element on the canvas previously copied stale template data rather than in-progress
   live Fabric object styles (font family, size, color, text shadow blur, shape fill, and dimensions).
   Extracting live properties directly from the active Fabric object guarantees complete WYSIWYG parity.
3. **Canvas Drawing Tool Mode Isolation (SPEC-19-03)**:
   When activating the Add Text or Add Rectangle tool, clicking over an existing shape on canvas selects
   or drags the underlying shape instead of placing the new element on top. Setting `canvas.skipTargetFind = true`
   while drawing tools are active isolates mouse events directly to placement handlers.
4. **Shape Fill Color Persistence (SPEC-19-04)**:
   `serializeCanvas` in `canvas-utils.ts` only serialized styles for `isText`, completely dropping shape
   `fill` and `opacity`. Serializing shape styles ensures custom colors persist permanently across saves.
5. **Presentation View Auto-Shrink Sync (SPEC-19-05)**:
   Standardize documentation and provide visual feedback for text that exceeds its authored bounding box,
   clarifying why large text (e.g. 180px) downscales in presentation view (`largestFittingTextScale`) and
   confirming the exact mathematical 0.75 pt/px ratio for PPTX export.

Autonomous delivery under this mandate enables executing these 5 tickets end-to-end in a separate
session via `wdi-autopilot` without requiring interactive approvals on routine code modifications.

## Cost

Operational decisions are recorded in the autopilot ledger (`.control/memlog/autopilot-DEC-021.md`).
Architectural invariants (AD-N) and public repo data cleanliness remain strictly preserved.
