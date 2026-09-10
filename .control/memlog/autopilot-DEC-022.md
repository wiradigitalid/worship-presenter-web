---
artifact: .control/decisions/DEC-022-autopilot-mandate-artifacts-canvas-wysiwyg-and-controls.md
---

## Resume

Iteration: 0
Run branch: autopilot/DEC-022 (PR: not yet opened)
Stopped at: Preflight — tickets authored, test plan prepared, mandate registered; awaiting autopilot session launch
Blocked: —
Parked: [ad-n]
Next: wdi-autopilot execution in separate session

## Decisions

| When | Where | Decided | Instead of | Cost if wrong | Landed in |
|---|---|---|---|---|---|
| Preflight | wdi-autopilot preflight | Mandate DEC-022 accepted by owner kodesh87 for Artifacts Canvas WYSIWYG Auto-Sync, Live Drag Rubberband, Layout Stability & Combobox Font Picker (SPEC-20) | Interactive approval at each ticket | Autonomous execution under ledger recording | DEC-022, decisions.yaml |
| Preflight | SPEC-20-01 | Refactor Font Family picker to Combobox pattern using Popover primitive from @base-ui/react/popover | Hacking input inside Base UI Select listbox | Focus continues to be stolen by typeahead navigation | popover.tsx, ArtifactEditor.tsx |
| Preflight | SPEC-20-02 | Add mouse:move listener with live dashed preview shape (rubberband) during drawingTool mode | Only handling mouse:down and mouse:up | No visual feedback during drag drawing | ArtifactEditor.tsx |
| Preflight | SPEC-20-03 | Preserve 16:9 aspect-video stage viewport card for non-editable slides (song-set-entry, ann-set-marker) | Collapsing right column into 100px banner | Deck Sequence sidebar height collapsing and jumping | ArtifactEditor.tsx |
| Preflight | SPEC-20-04 | Auto-sync bounding box height h = Math.max(source.h, measuredTextHeightPct) in serializeCanvas and editor | Locking h = source.h and showing manual warning badge | Presentation and PPTX aggressively downscaling font | canvas-utils.ts, ArtifactEditor.tsx |
| Preflight | Review Follow-up | Decouple SPEC-20-01 through SPEC-20-04 dependencies (all blocked_by: []) | Strict serial execution chain (01->02->03->04) | Artificial serialization of independent UI and serialization features | SPEC.md, specs.yaml, issues/*.md |
| Preflight | Review Follow-up | Explicitly supersede SPEC-19-05 manual overflow badge in favor of auto-sync h; plan regression refactoring for smoke-spec-19 and artifact-editor-layout | Leaving conflicting test assertions in smoke-spec-19 and layout tests | Autopilot failing G5 release gate on regression test conflicts | TEST-PLAN.md, issues/01, issues/04 |
