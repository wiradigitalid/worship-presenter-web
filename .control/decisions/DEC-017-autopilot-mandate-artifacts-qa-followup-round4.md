---
type: mandate
id: DEC-017
status: applied
accepted_by: 'kodesh87 (2026-09-09)'
touches:
  - .control/memlog/autopilot-DEC-017.md
  - .control/registry/specs.yaml
  - .control/registry/decisions.yaml
  - .control/registry/defects.yaml
  - src/components/admin/ArtifactEditor.tsx
  - src/components/admin/SongSetEntriesPanel.tsx
  - src/lib/registry/canvas-utils.ts
  - tests/artifact-editor-controls.test.mjs
  - tests/artifact-editor-layout.test.mjs
  - tests/operator-shadcn-guard.test.mjs
  - tests/theme-chrome.test.mjs
supersedes: null
superseded_by: null
created: '2026-09-09'
---

# DEC-017 — Autopilot mandate for Artifacts QA Follow-up Round 4 (SPEC-15)

## Decision

> The owner grants an autonomous execution mandate to resolve all residual defects and refinements
> identified in Artifacts QA Follow-up Round 4 (SPEC-15: tickets SPEC-15-01 through SPEC-15-04,
> covering residuals on BUG-7, BUG-11, and new defects BUG-28, BUG-29), carrying implementation
> through G5 Release with autonomous code execution, double review, and automated testing under
> `wdi-autopilot` in a separate session.

## Why

Following the deployment and testing of SPEC-14 on `presenter-dev.bic.my.id`, a fourth manual QA pass
by the Administrator confirmed that 7 of the 9 items work as expected (translation drag is fully
visible, seeded element deletion save validation works, announcement set contrast is fixed, text shadow
controls work cleanly, duplicate header card is removed, toolbar height is stable, and layer z-order
stacking & bring forward function properly).

Four remaining items were identified to complete the Artifacts editing experience:
1. **Real-time Image Scaling ClipPath Synchronisation (`BUG-7` residual / SPEC-15-01)**:
   Corner handle resizing currently clips the image visually against its starting box during active
   drag because `object:scaling` is not wired to update `clipPath` (`clipBox`). Synchronizing `clipBox`
   during scaling eliminates the visual glitch and delivers a seamless real-time resizing simulation.
2. **Deck Sequence Desktop Bottom Alignment (`BUG-11` residual / SPEC-15-02)**:
   In desktop mode, Deck Sequence shrinks excessively (`max-h-[calc(100vh-380px)]`) instead of anchoring
   its bottom boundary to the bottom edge of the canvas. Extending the desktop flex/grid layout allows
   the slide list to utilize the full height down to the canvas bottom line while maintaining zero
   window-level scrollbars.
3. **Removal of Redundant "Apply Style" Button (`BUG-28` / SPEC-15-03)**:
   Since all text styling properties apply immediately and in real time to the canvas selection, the
   legacy "Apply Style" button is obsolete, confusing, and needlessly clutters the toolbar.
4. **Song Set Entry Edit Mode Zero Layout Shift (`BUG-29` / SPEC-15-04)**:
   Clicking edit on a song set row currently expands its height from ~48px to ~86px with two stacked
   inputs, shifting subsequent list items. Transitioning the edit form to re-use the top "New Song Set"
   card (or a compact non-expanding pattern) preserves a stable, non-shifting list layout.

Autonomous delivery under this mandate enables executing these 4 tickets end-to-end in a separate
session via `wdi-autopilot` without requiring interactive approvals on routine code modifications.

## Cost

Operational decisions and bug fixes are recorded in the autopilot ledger rather than prompting
the owner interactively. Architectural invariants (AD-N) remain preserved.
