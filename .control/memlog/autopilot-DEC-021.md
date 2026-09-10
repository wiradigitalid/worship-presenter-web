---
artifact: .control/decisions/DEC-021-autopilot-mandate-artifacts-canvas-interactions.md
---

## Resume

Iteration: 0
Run branch: autopilot/DEC-021 (PR: not open yet)
Stopped at: Preflight — SPEC-19 filed, all 5 tickets planned and ready for implementation
Blocked: —
Parked: [ad-n]
Next: SPEC-19-01 (Searchable font dropdown keyboard isolation & popper positioning)

## Decisions

| When | Where | Decided | Instead of | Cost if wrong | Landed in |
|---|---|---|---|---|---|
| Preflight | wdi-autopilot preflight | Mandate DEC-021 accepted by owner kodesh87 for Artifacts Canvas Interactions, Shape Persistence & Typography Refinement (SPEC-19) | Interactive approval at each ticket | Autonomous execution under ledger recording | DEC-021, decisions.yaml |
| Preflight | SPEC-19-01 | Set alignItemWithTrigger={false} on SelectContent and isolate keyboard/pointer events on search input | Leaving popup aligned to trigger item and typeahead capturing keystrokes | Search input unresponsive to typing and dropdown rendered below canvas | select.tsx, ArtifactEditor.tsx |
| Preflight | SPEC-19-02 | Read live styles and dimensions directly from active Fabric object during element duplication | Reading stale source.style from initial template | Duplicated elements lose customized styles and size | ArtifactEditor.tsx |
| Preflight | SPEC-19-03 | Set canvas.skipTargetFind = true and canvas.selection = false while drawingTool is active | Allowing underlying shapes to intercept hover/click events | Clicking over existing shape drags the shape instead of placing new element | ArtifactEditor.tsx |
| Preflight | SPEC-19-04 | Serialize obj.fill and obj.opacity for source.type === 'shape' in serializeCanvas | Dropping shape style serialization in serializeCanvas | Custom shape fill color reverting to brown #5C2E16 on save | canvas-utils.ts |
| Preflight | SPEC-19-05 | Document 0.75 pt/px equivalence and provide canvas overflow feedback for shrink-to-fit presentation | Leaving presentation auto-shrink undocumented and unexplained | Confusion over text size discrepancy between canvas and live presentation | render-model.ts, ArtifactEditor.tsx |
| Preflight | Peer review | Refine tickets and test plan per cursor-agent composer-2.5: reconcile serial dependency chain for parallel-tickets-blocked, live position in duplicate, hoverCursor in drawing tool, shape fill round-trip test, and lock in non-blocking toolbar overflow indicator | Leaving loose dependencies and ambiguous UX options | Validator failures or inconsistent agent execution in autopilot | SPEC.md, tickets 01-05, TEST-PLAN.md, specs.yaml |

