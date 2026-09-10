---
type: mandate
id: DEC-024
status: accepted
accepted_by: 'kodesh87 (2026-09-10)'
touches:
  - .control/memlog/autopilot-DEC-024.md
  - .control/registry/specs.yaml
  - .control/registry/decisions.yaml
  - src/lib/pptx-draw.ts
  - src/lib/artifacts/render-model.ts
  - src/lib/registry/canvas-utils.ts
  - tests/smoke-spec-22.test.mjs
  - tests/artifact-render-model.test.mjs
  - .scratch/SPEC-22-pptx-text-wrap-parity/SPEC.md
supersedes: null
superseded_by: null
created: '2026-09-10'
---

# DEC-024 — Autopilot mandate for PPTX Text Wrap Parity (Canvas / Presenter / LibreOffice) (SPEC-22)

## Decision

> The owner grants an autonomous execution mandate to implement PPTX Text Wrap Parity under SPEC-22 (tickets SPEC-22-01 through SPEC-22-04), covering:
> 1) Setting zero-margin text box container in PPTX export (`margin: 0` in `pptx-draw.ts`), removing PowerPoint's default 0.2" horizontal insets so text box effective wrap width matches the web Canvas/Presenter 100% element width,
> 2) Persisting canvas soft-wrap lines (`wrapLines`) in the registry schema and Fabric canvas serializer, establishing Canvas layout as the single source of truth for line breaks across all renderers,
> 3) Introducing a shared export text fit contract and descender safety (`estimateTextFitScale` accounting for soft-wrapped lines, descender padding, and overflow protection) in PPTX and LibreOffice export, and
> 4) Creating comprehensive automated test suite `tests/smoke-spec-22.test.mjs` (covering T-22-01..T-22-10) and updating documentation,
> carrying implementation through G5 Release with autonomous code execution, double review (self review + cursor-agent composer-2.5),
> and automated smoke testing in the dedicated run branch `autopilot/DEC-024`.

## Why

1. **Zero-Margin Text Box Container in PPTX Export (SPEC-22-01)**:
   In `pptx-draw.ts`, `slide.addText` was called without an explicit `margin`, triggering PowerPoint's default "Normal" margin `[0.05", 0.1", 0.05", 0.1"]` (0.2in horizontal insets ≈ 19.2px). This caused words that fit comfortably on Canvas and Presenter (such as "international" in "Bandung international community") to wrap prematurely into character-split fragments in LibreOffice Impress / MS PowerPoint.
2. **Persist Canvas Soft-Wrap Lines in Registry (SPEC-22-02)**:
   Fabric calculates precise text wrap lines based on canvas width, font metrics, and word boundaries. By capturing and serializing `wrapLines` alongside the raw text, downstream renderers (PPTX generator, Presenter, PDF) can honor the exact line breaks determined interactively by the user, eliminating cross-engine line-break divergence.
3. **Shared Export Text Fit Contract & Descender Safety (SPEC-22-03)**:
   `estimateTextFitScale` in `render-model.ts` previously split only on explicit `\n`, under-counting lines when soft-wrapping occurs and failing to apply necessary font-scaling shrink. Adding soft-wrap awareness and descender safety padding prevents glyph clipping on letters with descenders (g, j, p, q, y).
4. **Automated Smoke Test Suite & Regressions Prevention (SPEC-22-04)**:
   A dedicated smoke test suite `tests/smoke-spec-22.test.mjs` validates zero-margin export, line preservation, fit scaling, and visual parity without breaking existing test suites.

## Cost

Operational decisions are recorded in the autopilot ledger (`.control/memlog/autopilot-DEC-024.md`).
Architectural invariants (AD-N) and public repo data cleanliness remain strictly preserved.
