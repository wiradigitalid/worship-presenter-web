---
type: mandate
id: DEC-020
status: applied
accepted_by: 'kodesh87 (2026-09-10)'
touches:
  - .control/memlog/autopilot-DEC-020.md
  - .control/registry/specs.yaml
  - .control/registry/decisions.yaml
  - internal/plan/validate_artifact.go
  - internal/plan/validate_artifact_test.go
  - src/lib/registry/types.ts
  - src/lib/registry/validate.ts
  - src/lib/registry/canvas-utils.ts
  - src/lib/artifacts/runtime-contract.ts
  - src/components/admin/ArtifactEditor.tsx
  - src/components/artifacts/ArtifactSlide.tsx
  - src/lib/pptx-draw.ts
  - src/lib/i18n/keys.ts
  - src/lib/i18n/catalogue-en.ts
  - src/lib/i18n/catalogue-id.ts
  - tests/artifact-editor-controls.test.mjs
  - tests/artifact-editor-layout.test.mjs
  - tests/smoke-spec-18.test.mjs
  - package.json
supersedes: null
superseded_by: null
created: '2026-09-10'
---

# DEC-020 — Autopilot mandate for Artifacts Canvas Typography & Layout Persistence Follow-up (SPEC-18)

## Decision

> The owner grants an autonomous execution mandate to implement the Artifacts Canvas Typography & Layout
> Persistence follow-up under SPEC-18 (tickets SPEC-18-01 through SPEC-18-03), covering:
> 1) Text shadow blur schema validation and multi-surface persistence (`textShadowBlur`),
> 2) Searchable grouped font family selector with high-contrast category boundary headers, and
> 3) Textbox width drag-resize serialization persistence in `canvas-utils.ts`,
> carrying implementation through G5 Release with autonomous code execution, double review,
> and automated testing under `wdi-autopilot` in a separate session.

## Why

1. **Text Shadow Blur Persistence (SPEC-18-01)**:
   The UI slider lets operators fine-tune shadow blur (0–20), but because the schema only permitted
   a boolean `textShadow`, blur was never saved to the registry database and reverted to 4 on reload.
   Adding `textShadowBlur` to the Go validator, TypeScript types, and serialization restores full fidelity.
2. **Searchable Grouped Font Picker with High Contrast (SPEC-18-02)**:
   Navigating 45 presentation fonts is greatly accelerated by an inline search filter. Furthermore,
   distinct background styling on the 5 category headers (`SelectLabel`) establishes clear, instant visual
   boundaries for operators.
3. **Textbox Width Resize Persistence (SPEC-18-03)**:
   In Fabric.js, `fabric.Textbox` changes `obj.width` directly while leaving `scaleX = 1` during side-handle
   drags. Serializing `source.w * scaleX` discarded the width adjustments, causing widened text (like "Welcome to"
   at font size 114) to snap back to original narrower widths on reload and wrap into two lines. Comparing
   `measuredWidth` with `authoredWidth` solves this while maintaining untouched seed layout precision.

Autonomous delivery under this mandate enables executing these 3 tickets end-to-end in a separate
session via `wdi-autopilot` without requiring interactive approvals on routine code modifications.

## Cost

Operational decisions are recorded in the autopilot ledger (`.control/memlog/autopilot-DEC-020.md`).
Architectural invariants (AD-N) and public repo data cleanliness remain strictly preserved.
