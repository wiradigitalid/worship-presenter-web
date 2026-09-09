---
type: mandate
id: DEC-016
status: accepted
accepted_by: 'kodesh87 (2026-09-09)'
touches:
  - .control/memlog/autopilot-DEC-016.md
  - .control/registry/specs.yaml
  - .control/registry/decisions.yaml
  - .control/registry/defects.yaml
  - .how/_platform/ARCHITECTURE-SPINE.md
  - src/components/admin/ArtifactEditor.tsx
  - src/components/admin/SongSetEntriesPanel.tsx
  - src/components/admin/AnnouncementSetsPanel.tsx
  - src/lib/registry/canvas-utils.ts
  - src/lib/registry/store.ts
  - internal/plan/validate_artifact.go
  - tests/artifact-editor-controls.test.mjs
  - tests/artifact-editor-layout.test.mjs
  - tests/registry.test.mjs
  - tests/announcement-sets.test.mjs
  - tests/operator-shadcn-guard.test.mjs
supersedes: null
superseded_by: null
created: '2026-09-09'
---

# DEC-016 — Autopilot mandate for Artifacts QA Follow-up Round 3 (SPEC-14)

## Decision

> The owner grants an autonomous execution mandate to resolve all residual defects, refinements,
> and layout stability improvements identified in Artifacts QA Follow-up Round 3 (SPEC-14: tickets
> SPEC-14-01 through SPEC-14-09, covering residuals on BUG-7, BUG-11, BUG-18, BUG-21, BUG-22, BUG-24
> and new defects BUG-25..BUG-27), carrying implementation through G5 Release with autonomous code
> execution, double review, and automated testing under `wdi-autopilot`.

## Why

Following the completion of SPEC-13, a third manual QA pass by the Administrator confirmed major
stabilizations (auto-select on mount, context menu trigger, song set banner height, code rename,
Reset discard in-memory, background replacement, inline status container, text shadow persistence)
while identifying focused residuals and refinements:
1. Canvas image drag clipBox synchronisation during active movement (`BUG-7`).
2. Deck Sequence container and sidebar viewport height clamping (`BUG-11`).
3. Alignment of Go backend and client store save validation with `DEC-014` to allow saving layouts
   with deleted/modified seed elements (`BUG-18`).
4. Announcement Set select value text contrast on initial load (`BUG-21`).
5. Simplification of text shadow toggle and conditional slider controls (`BUG-22`).
6. Relocation of Song Set rename inline into configured list rows and removal of the redundant top
   card above the shared canvas trio (`BUG-24`).
7. Locking properties toolbar vertical height to prevent downward canvas shifts on selection (`BUG-25`).
8. Enabling `preserveObjectStacking: true` in Fabric.js so selected canvas objects preserve their
   true layer depth (`BUG-26`).
9. Realtime layer advance on "Bring forward" (+1) actions (`BUG-27`).

Autonomous delivery under mandate enables executing these 9 focused tickets end-to-end in a separate
session via `wdi-autopilot` without requiring interactive approvals on routine code modifications.

## Cost

Operational decisions and bug fixes are recorded in the autopilot ledger (`.control/memlog/autopilot-DEC-016.md`)
rather than prompting the owner interactively. Architectural invariants (AD-N) remain preserved.
