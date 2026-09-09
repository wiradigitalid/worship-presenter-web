---
type: mandate
id: DEC-019
status: accepted
accepted_by: 'kodesh87 (2026-09-09)'
touches:
  - .control/registry/specs.yaml
  - .control/registry/decisions.yaml
  - src/lib/registry/font-catalog.ts
  - src/components/admin/ArtifactEditor.tsx
  - src/lib/artifacts/render-model.ts
  - src/lib/pptx-draw.ts
  - spa/index.html
  - spa/projected.html
  - tests/artifact-font-catalog.test.mjs
  - tests/artifact-editor-layout.test.mjs
  - tests/artifact-editor-controls.test.mjs
supersedes: null
superseded_by: null
created: '2026-09-09'
---

# DEC-019 — Autopilot mandate for Artifacts Canvas Font Selector & Two-Row Fixed Toolbar (SPEC-17)

## Decision

> The owner grants an autonomous execution mandate to implement the Artifacts Canvas Font Selector
> (45 curated presentation fonts across 5 categories) and the Two-Row Fixed Height Toolbar
> (`h-[88px] min-h-[88px] max-h-[88px]`) under SPEC-17 (tickets SPEC-17-01 through SPEC-17-03),
> carrying implementation through G5 Release with autonomous code execution, double review,
> and automated testing under `wdi-autopilot` in a separate session.

## Why

1. **Rich Presentation Typography (45 Curated Fonts / SPEC-17-01 & SPEC-17-03)**:
   Slides in worship environments require varied visual styles depending on content type (lyrics, sermon title,
   Bible verse readings, fellowship announcements). Providing 45 curated fonts (10 universal PowerPoint/system fonts,
   12 modern sans-serifs, 8 dignified serifs, 8 bold display headers, and 7 scripts/handwriting fonts) with web font
   embedding and PPTX export synchronization delivers professional visual versatility without performance lag.
2. **Fixed Two-Row Ergonomic Toolbar (`h-[88px]` / SPEC-17-02)**:
   The current single-row toolbar is congested. Splitting controls across 2 structured rows inside a strictly
   fixed-height container (`h-[88px]`) ensures all controls (font family, size, color, B/I/U, align, line-height,
   shadow, shape fill, image properties) remain clean, accessible, and completely eliminate vertical layout shifts
   on the canvas workspace below.

Autonomous delivery under this mandate enables executing these 3 tickets end-to-end in a separate
session via `wdi-autopilot` without requiring interactive approvals on routine code modifications.

## Cost

Operational decisions are recorded in the autopilot ledger (`.control/memlog/autopilot-DEC-019.md`).
Architectural invariants (AD-N) and public repo data cleanliness remain strictly preserved.
