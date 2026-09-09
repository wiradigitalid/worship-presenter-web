---
artifact: .control/decisions/DEC-018-autopilot-mandate-artifacts-qa-followup-round5.md
---

## Resume

Iteration: 1
Run branch: autopilot/DEC-018 (PR: not open yet)
Stopped at: —
Blocked: —
Parked: —
Next: Smoke test & close SPEC-16

## Decisions

| When | Where | Decided | Instead of | Cost if wrong | Landed in |
|---|---|---|---|---|---|
| Preflight | wdi-autopilot preflight | Mandate DEC-018 accepted by owner kodesh87 for Artifacts QA Follow-up Round 5 (SPEC-16) | Interactive approval at each ticket | Autonomous execution under ledger recording | DEC-018, decisions.yaml |
| Iteration 1 | SPEC-16-01 (BUG-11) | Set Deck Sequence container to lg:max-h-[calc(100vh-270px)] on desktop while retaining internal overflow-y-auto scrolling and mobile max-h-[calc(100vh-380px)] | lg:max-h-none causing unconstrained vertical growth and window scrollbars on desktop | Deck Sequence bounds align with canvas bottom with internal slide scrolling and zero page scrollbars | ArtifactEditor.tsx, artifact-editor-layout.test.mjs |
| Iteration 1 | SPEC-16-02 (BUG-30) | Simplify top form card edit header to static 'Edit Song Set' (EN) and 'Edit Set Lagu' (ID) with truncate, min-w-0, and shrink-0 badge | Dynamic {title} interpolation in header causing multi-line wrapping in 330px column and shifting list downwards | Stable single-line top card height with zero layout shift in configured song sets list | SongSetEntriesPanel.tsx, catalogue-en.ts, catalogue-id.ts, operator-shadcn-guard.test.mjs |
