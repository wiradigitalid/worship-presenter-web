---
artifact: .control/decisions/DEC-013-autopilot-mandate-artifacts-qa-followup.md
---

## Resume

Iteration: 1 (boundary: complete SPEC-12-03 image aspect ratio contain-fit)
Run branch: autopilot/DEC-013 (PR: not open yet)
Stopped at: Finished SPEC-12-03; ready for SPEC-12-04
Blocked: —
Parked: —
Next: SPEC-12-04: Select dropdown label lookup (BUG-8)

## Decisions

| When | Where | Decided | Instead of | Cost if wrong | Landed in |
|---|---|---|---|---|---|
| It 1 (autopilot/DEC-013) | wdi-autopilot preflight | Mandate DEC-013 accepted by owner kodesh87 for Artifacts QA Follow-up (SPEC-12) | Interactive approval at each ticket | Full autonomous recording | DEC-013, decisions.yaml |
| It 1 (autopilot/DEC-013) | SPEC-12-01 | Add textDecoration underline to validators/render-model/Fabric and wire realtime font/shape handlers | Manual apply button or missing underline round-trip | Discarded styling on reopen | ArtifactEditor.tsx, validate_artifact.go, validate.ts, canvas-utils.ts, render-model.ts, pptx-draw.ts |
| It 1 (autopilot/DEC-013) | SPEC-12-02 | Wire context menu on canvasShellRef right-click, add scoped Delete/Backspace listener per DEC-012, and add drag visual feedback | Missing openers and unhandled keyboard events | Non-functional context menu & trapped delete | ArtifactEditor.tsx, DEC-012 |
| It 1 (autopilot/DEC-013) | SPEC-12-03 | Implement calculateImageFit with natural dimensions, uniform contain scaling, centering, and element bounding clipBox | Independent axis stretching (squashed image) | Distorted image display on canvas | ArtifactEditor.tsx, canvas-utils.ts, artifact-preview.test.mjs, artifact-editor-controls.test.mjs |
