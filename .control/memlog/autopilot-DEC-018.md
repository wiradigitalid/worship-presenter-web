---
artifact: .control/decisions/DEC-018-autopilot-mandate-artifacts-qa-followup-round5.md
---

## Resume

Iteration: 1
Run branch: autopilot/DEC-018 (PR: not open yet)
Stopped at: —
Blocked: —
Parked: —
Next: SPEC-16-02

## Decisions

| When | Where | Decided | Instead of | Cost if wrong | Landed in |
|---|---|---|---|---|---|
| Preflight | wdi-autopilot preflight | Mandate DEC-018 accepted by owner kodesh87 for Artifacts QA Follow-up Round 5 (SPEC-16) | Interactive approval at each ticket | Autonomous execution under ledger recording | DEC-018, decisions.yaml |
| Iteration 1 | SPEC-16-01 (BUG-11) | Set Deck Sequence container to lg:max-h-[calc(100vh-270px)] on desktop while retaining internal overflow-y-auto scrolling and mobile max-h-[calc(100vh-380px)] | lg:max-h-none causing unconstrained vertical growth and window scrollbars on desktop | Deck Sequence bounds align with canvas bottom with internal slide scrolling and zero page scrollbars | ArtifactEditor.tsx, artifact-editor-layout.test.mjs |
