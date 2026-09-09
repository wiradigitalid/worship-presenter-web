---
artifact: .control/decisions/DEC-017-autopilot-mandate-artifacts-qa-followup-round4.md
---

## Resume

Iteration: 1
Run branch: autopilot/DEC-017 (PR: draft)
Stopped at: —
Blocked: —
Parked: —
Next: Smoke testing and SPEC-15 close

## Decisions

| When | Where | Decided | Instead of | Cost if wrong | Landed in |
|---|---|---|---|---|---|
| Preflight | wdi-autopilot preflight | Mandate DEC-017 accepted by owner kodesh87 for Artifacts QA Follow-up Round 4 (SPEC-15) | Interactive approval at each ticket | Autonomous execution under ledger recording | DEC-017, decisions.yaml |
| Iteration 1 | SPEC-15-01 (BUG-7) | Synchronize image clipPath position and proportional dimensions on active object:scaling with scale-ratio preserved across contain/cover fit and mouse release | Static clipPath window causing visual image cutoff during active resize handle dragging | Proportional scaling mask tracking image handles in real time with zero release jump | canvas-utils.ts, ArtifactEditor.tsx, artifact-editor-controls.test.mjs |
| Iteration 1 | SPEC-15-02 (BUG-11) | Set left aside to lg:flex lg:flex-col and Deck Sequence container to flex-1 with lg:max-h-none while retaining max-h-[calc(100vh-380px)] on mobile | Hardcoded 380px max-height cutting Deck Sequence short on desktop displays | Deck Sequence card bottom edge stretches and aligns with Canvas card bottom on desktop with zero mobile regressions | ArtifactEditor.tsx, artifact-editor-layout.test.mjs |
| Iteration 1 | SPEC-15-03 (BUG-28) | Remove redundant Apply Style button from text properties toolbar while preserving internal helper and individual real-time property handlers | Legacy explicit apply button needlessly consuming toolbar space and causing operator confusion | Cleaner 44px fixed-height toolbar with immediate real-time canvas updates | ArtifactEditor.tsx, artifact-editor-controls.test.mjs |
| Iteration 1 | SPEC-15-04 (BUG-29) | Switch top form card to Edit mode on row pencil click with rigid h-[48px] single-row height and i18n support | Expanding list row to 86px with inline input stack causing abrupt sidebar layout shift | Zero layout shift in list rows with comfortable top form editing, save/cancel controls, and delete cleanup | SongSetEntriesPanel.tsx, keys.ts, catalogue-en.ts, catalogue-id.ts, operator-shadcn-guard.test.mjs |
