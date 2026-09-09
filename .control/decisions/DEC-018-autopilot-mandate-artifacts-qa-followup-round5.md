---
type: mandate
id: DEC-018
status: applied
accepted_by: 'kodesh87 (2026-09-09)'
touches:
  - .control/memlog/autopilot-DEC-018.md
  - .control/registry/specs.yaml
  - .control/registry/decisions.yaml
  - .control/registry/defects.yaml
  - src/components/admin/ArtifactEditor.tsx
  - src/components/admin/SongSetEntriesPanel.tsx
  - src/lib/i18n/catalogue-en.ts
  - src/lib/i18n/catalogue-id.ts
  - tests/artifact-editor-layout.test.mjs
  - tests/operator-shadcn-guard.test.mjs
supersedes: null
superseded_by: null
created: '2026-09-09'
---

# DEC-018 — Autopilot mandate for Artifacts QA Follow-up Round 5 (SPEC-16)

## Decision

> The owner grants an autonomous execution mandate to resolve residual defects and regressions
> identified in Artifacts QA Follow-up Round 5 (SPEC-16: tickets SPEC-16-01 and SPEC-16-02,
> covering reopened defect BUG-11 and new defect BUG-30), carrying implementation
> through G5 Release with autonomous code execution, double review, and automated testing under
> `wdi-autopilot` in a separate session.

## Why

Following the deployment and manual testing of SPEC-15 on `presenter-dev.bic.my.id`, manual QA
confirmed that real-time clipPath scaling (BUG-7) and the removal of the redundant "Apply Style"
button (BUG-28) work as expected and are fully resolved.

However, two residual defects require resolution to achieve a flawless editing experience:
1. **Deck Sequence Desktop Height Containment and Canvas Bottom Alignment (`BUG-11` / SPEC-16-01)**:
   In SPEC-15-02, removing the maximum height constraint via `lg:max-h-none` inside an unconstrained
   CSS grid row allowed Deck Sequence to expand to fit all slide cards. This eliminated the card's internal
   scroll, caused it to overshoot the bottom of the canvas card, and pushed down the entire page, creating
   an undesirable full-page window scrollbar. Deck Sequence must have a strict height constraint or container
   clamping on desktop (e.g. aligning with the canvas bottom boundary or viewport calculation) so that
   its slide list scrolls internally without page scrolling.
2. **Song Set Top Card Edit Header Compactness (`BUG-30` / SPEC-16-02)**:
   In SPEC-15-04, switching edit mode to the top card eliminated list item layout shifts. However,
   rendering `Edit Song Set: {title}` in the card header causes long titles (e.g. `Edit Song Set: Bible Talk Opening Song`)
   to wrap onto multiple lines in the 330px column alongside the editing badge. This expands the top card
   and shifts the list downward. Using a clean, compact header (e.g. `Edit Song Set` / `Edit Set Lagu` without
   the dynamic title, or with strict single-line truncation) keeps the top card height identical to create mode
   with zero vertical layout shift.

Autonomous delivery under this mandate enables executing these 2 tickets end-to-end in a separate
session via `wdi-autopilot` without requiring interactive approvals on routine code modifications.

## Cost

Operational decisions and bug fixes are recorded in the autopilot ledger rather than prompting
the owner interactively. Architectural invariants (AD-N) remain preserved.
