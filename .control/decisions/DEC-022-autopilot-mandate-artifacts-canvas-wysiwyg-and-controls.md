---
type: mandate
id: DEC-022
status: applied
accepted_by: 'kodesh87 (2026-09-10)'
touches:
  - .control/memlog/autopilot-DEC-022.md
  - .control/registry/specs.yaml
  - .control/registry/decisions.yaml
  - src/components/ui/popover.tsx
  - src/components/admin/ArtifactEditor.tsx
  - src/components/artifacts/ArtifactSlide.tsx
  - src/lib/registry/canvas-utils.ts
  - src/lib/pptx-draw.ts
  - tests/smoke-spec-20.test.mjs
  - tests/artifact-editor-controls.test.mjs
  - tests/artifact-editor-layout.test.mjs
supersedes: null
superseded_by: null
created: '2026-09-10'
---

# DEC-022 — Autopilot mandate for Artifacts Canvas WYSIWYG Auto-Sync, Live Drag Rubberband, Layout Stability & Combobox Font Picker (SPEC-20)

## Decision

> The owner grants an autonomous execution mandate to implement the Artifacts Canvas WYSIWYG Auto-Sync,
> Live Drag Rubberband, Layout Stability & Combobox Font Picker under SPEC-20 (tickets SPEC-20-01 through SPEC-20-04), covering:
> 1) Font search combobox refactoring using Popover primitive to permanently eliminate Base UI select typeahead focus theft,
> 2) Real-time shape and text drag-to-draw rubberband preview on canvas via `mouse:move`,
> 3) Stable 16:9 stage viewport layout preserving Deck Sequence sidebar height across non-canvas slides without window scrollbar conflicts, and
> 4) Auto-syncing textbox bounding box height (`h`) in `serializeCanvas` and editor to achieve 100% WYSIWYG parity between canvas, presentation view, and PPTX export without requiring manual box stretching,
> carrying implementation through G5 Release with autonomous code execution, double review,
> and automated testing under `wdi-autopilot` in a separate session.

## Why

1. **Combobox Font Picker via Popover (SPEC-20-01)**:
   During manual testing of SPEC-19-01, typing in the font search input was interrupted because Base UI's
   Select component captures alphanumeric keystrokes for typeahead item navigation and shifts focus away
   from the `<Input>` to the `<SelectItem>`. Migrating the font picker to a Combobox pattern using `@base-ui/react/popover`
   gives the search input unconstrained native focus, resolving the recurring search focus defect permanently.
2. **Real-time Drag-to-Draw Rubberband Preview (SPEC-20-02)**:
   Canvas drawing previously only hooked `mouse:down` and `mouse:up`, rendering nothing during drag until mouse
   release. Adding a `mouse:move` handler with a temporary dashed preview shape provides instant visual feedback.
3. **Stable 16:9 Stage Viewport for Non-Canvas Slides (SPEC-20-03)**:
   Selecting a song set or announcement marker collapsed the right column into a 100px banner, shrinking the left
   sidebar and Deck Sequence list. Rendering a 16:9 aspect-video placeholder stage keeps sidebar height stable
   without introducing double window scrollbars.
4. **Auto-Sync Textbox Bounding Box Height for True WYSIWYG Parity (SPEC-20-04)**:
   `serializeCanvas` previously locked `h = source.h` for text elements, ignoring vertical text expansion.
   When presented in `ArtifactSlide.tsx` or exported to PPTX, `largestFittingTextScale` auto-shrunk the font to
   fit the stale tiny box, surprising operators. Auto-syncing `h` to the measured text height guarantees true
   WYSIWYG parity across canvas, presentation view, and PPTX downloads, eliminating manual box resizing.

Autonomous delivery under this mandate enables executing these 4 tickets end-to-end in a separate
session via `wdi-autopilot` without requiring interactive approvals on routine code modifications.

## Cost

Operational decisions are recorded in the autopilot ledger (`.control/memlog/autopilot-DEC-022.md`).
Architectural invariants (AD-N) and public repo data cleanliness remain strictly preserved.
