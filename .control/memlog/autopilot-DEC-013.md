---
artifact: .control/decisions/DEC-013-autopilot-mandate-artifacts-qa-followup.md
---

## Resume

Iteration: 1 (boundary: complete SPEC-12-01 realtime apply, underline, shape sync)
Run branch: autopilot/DEC-013 (PR: not open yet)
Stopped at: Finished SPEC-12-01; ready for SPEC-12-02
Blocked: —
Parked: —
Next: SPEC-12-02: Canvas interaction regressions & shortcuts (BUG-1, BUG-2, BUG-3, DEC-012)

## Decisions

| When | Where | Decided | Instead of | Cost if wrong | Landed in |
|---|---|---|---|---|---|
| It 1 (autopilot/DEC-013) | wdi-autopilot preflight | Mandate DEC-013 accepted by owner kodesh87 for Artifacts QA Follow-up (SPEC-12) | Interactive approval at each ticket | Full autonomous recording | DEC-013, decisions.yaml |
| It 1 (autopilot/DEC-013) | SPEC-12-01 | Add textDecoration underline to validators/render-model/Fabric and wire realtime font/shape handlers | Manual apply button or missing underline round-trip | Discarded styling on reopen | ArtifactEditor.tsx, validate_artifact.go, validate.ts, canvas-utils.ts, render-model.ts, pptx-draw.ts |
