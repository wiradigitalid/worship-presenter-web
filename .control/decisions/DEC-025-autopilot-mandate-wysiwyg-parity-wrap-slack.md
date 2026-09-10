---
type: mandate
id: DEC-025
status: accepted
accepted_by: 'kodesh87 (2026-09-10)'
touches:
  - .control/memlog/autopilot-DEC-025.md
  - .control/registry/specs.yaml
  - .control/registry/decisions.yaml
  - src/lib/pptx-draw.ts
  - src/lib/artifacts/render-model.ts
  - src/lib/registry/canvas-utils.ts
  - src/lib/registry/font-catalog.ts
  - spa/index.html
  - spa/projected.html
  - tests/smoke-spec-23.test.mjs
  - tests/artifact-render-model.test.mjs
  - tests/artifact-font-catalog.test.mjs
  - .scratch/SPEC-23-wysiwyg-parity-wrap-slack/SPEC.md
supersedes: null
superseded_by: null
created: '2026-09-10'
---

# DEC-025 — Autopilot mandate for WYSIWYG Parity (Wrap Slack, Fit Width & Font Readiness) (SPEC-23)

## Decision

> The owner grants an autonomous execution mandate to implement WYSIWYG Parity under SPEC-23 (tickets SPEC-23-01 through SPEC-23-07), covering:
> 1) Longest-word slack invariant on Textbox widening: ensuring `w` has slack padding when auto-widened by long words in Canvas,
> 2) Width-aware fit estimate: making `estimateTextFitScale` in `render-model.ts` measure longest-word width against box width so overlong words scale down in PPTX,
> 3) Web font readiness gate: guaranteeing fonts are ready before canvas / projected rendering (`document.fonts.ready`),
> 4) OOXML emission fidelity: emitting `<a:normAutofit fontScale="..."/>` with explicit calculated scale matching Canvas/Presenter font metrics,
> 5) Safe fallback flags and font substitution safety in PPTX export,
> 6) Comprehensive automated smoke testing (`tests/smoke-spec-23.test.mjs` covering T-23-01..T-23-14),
> carrying implementation through G5 Release with autonomous code execution, double review (self review + cursor-agent composer-2.5),
> and automated smoke testing in the dedicated run branch `autopilot/DEC-025`.

## Why

1. **Defect Persistence After SPEC-22**:
   SPEC-22 correctly set `margin: 0` and added `wrapLines`, but root-cause analysis (`.scratch/wysiwyg-analysis/analysis-opus-5.md`) demonstrated that `wrapLines` was absent on existing slides and zero tolerance at column boundaries caused LibreOffice to hard-break words at character splits (`internationa` / `l community`).
2. **Width-Aware PPTX Shrink-To-Fit (SPEC-23-02)**:
   In `render-model.ts`, `contentWidth` was hardcoded to `0`, preventing the width axis from ever triggering shrink scaling in PPTX export even when a word exceeds the box width.
3. **Web Font Timing & Measurement Invariance (SPEC-23-03, SPEC-23-05)**:
   Canvas auto-widening on load before web fonts finish loading creates inaccurate zero-slack boundaries.

## Cost

Operational decisions are recorded in the autopilot ledger (`.control/memlog/autopilot-DEC-025.md`).
Architectural invariants (AD-N) and public repo data cleanliness remain strictly preserved.
