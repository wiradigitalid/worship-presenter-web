---
artifact: .control/decisions/DEC-013-autopilot-mandate-artifacts-qa-followup.md
---

## Resume

Iteration: 1 (boundary: complete SPEC-12-07 song sets UX & button consistency)
Run branch: autopilot/DEC-013 (PR: not open yet)
Stopped at: Finished SPEC-12-07; ready for SPEC-12-08
Blocked: —
Parked: —
Next: SPEC-12-08: Announcement Sets duplicate title & concurrency fix (BUG-9, BUG-17, DEC-009, DEC-010, DEC-011)

## Decisions

| When | Where | Decided | Instead of | Cost if wrong | Landed in |
|---|---|---|---|---|---|
| It 1 (autopilot/DEC-013) | wdi-autopilot preflight | Mandate DEC-013 accepted by owner kodesh87 for Artifacts QA Follow-up (SPEC-12) | Interactive approval at each ticket | Full autonomous recording | DEC-013, decisions.yaml |
| It 1 (autopilot/DEC-013) | SPEC-12-01 | Add textDecoration underline to validators/render-model/Fabric and wire realtime font/shape handlers | Manual apply button or missing underline round-trip | Discarded styling on reopen | ArtifactEditor.tsx, validate_artifact.go, validate.ts, canvas-utils.ts, render-model.ts, pptx-draw.ts |
| It 1 (autopilot/DEC-013) | SPEC-12-02 | Wire context menu on canvasShellRef right-click, add scoped Delete/Backspace listener per DEC-012, and add drag visual feedback | Missing openers and unhandled keyboard events | Non-functional context menu & trapped delete | ArtifactEditor.tsx, DEC-012 |
| It 1 (autopilot/DEC-013) | SPEC-12-03 | Implement calculateImageFit with natural dimensions, uniform contain scaling, centering, and element bounding clipBox | Independent axis stretching (squashed image) | Distorted image display on canvas | ArtifactEditor.tsx, canvas-utils.ts, artifact-preview.test.mjs, artifact-editor-controls.test.mjs |
| It 1 (autopilot/DEC-013) | SPEC-12-04 | Extract Select item labels in select-utils and feed into Base UI native items prop in select.tsx | Touching 15+ call sites or parallel custom context | Stale label resolution on custom dropdowns | select.tsx, select-utils.ts, artifact-editor-controls.test.mjs |
| It 1 (autopilot/DEC-013) | SPEC-12-05 | Add viewport height constraints and min-h floor on editor and canvasShellRef | Outer window scrolling on 1080p laptop displays | Pushing deck sequence & header off screen | ArtifactEditor.tsx, RegistryAdmin.tsx, artifact-editor-layout.test.mjs |
| It 1 (autopilot/DEC-013) | SPEC-12-06 | Make Properties row always mounted with fallback placeholders, group title buttons with Canvas: label per DEC-011, make add buttons icon-only | Conditional render shifting canvas position | Visual layout jumps when selecting elements | ArtifactEditor.tsx, artifact-editor-controls.test.mjs, DEC-009, DEC-011 |
| It 1 (autopilot/DEC-013) | SPEC-12-07 | Mirror Main Spine creation panel with title/code inputs, stable min-h-[42px] banner on all 3 tabs, drop (2/3 Formula) from tab label | Auto-generating song_set_N and jumping canvas | Inconsistent creation UI & shifting canvas | SongSetEntriesPanel.tsx, registry.test.mjs, DEC-009, DEC-010, DEC-011 |
