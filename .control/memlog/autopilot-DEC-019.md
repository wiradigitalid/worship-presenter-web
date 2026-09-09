---
artifact: .control/decisions/DEC-019-autopilot-mandate-artifacts-font-selector-two-row-toolbar.md
---

## Resume

Iteration: 1
Run branch: autopilot/DEC-019 (PR: ready for owner merge)
Stopped at: Done — SPEC-17 completed, all tickets closed, smoke and test suite green, peer review approved
Blocked: —
Parked: —
Next: § Finish — owner review and merge

## Decisions

| When | Where | Decided | Instead of | Cost if wrong | Landed in |
|---|---|---|---|---|---|
| Preflight | wdi-autopilot preflight | Mandate DEC-019 accepted by owner kodesh87 for Artifacts Canvas Font Selector & Two-Row Fixed Toolbar (SPEC-17) | Interactive approval at each ticket | Autonomous execution under ledger recording | DEC-019, decisions.yaml |
| Iteration 1 | SPEC-17-01 | Deduplicate DEFAULT_FONT_FAMILY canonically in font-catalog.ts and embed Google Fonts in spa/index.html & projected.html | Duplicated string constants across render-model and canvas-utils | Clean single source of truth | font-catalog.ts, render-model.ts, canvas-utils.ts |
| Iteration 1 | SPEC-17-02 | Refactor toolbar to fixed h-[88px] two-row container with 5-category grouped font selector and live canvas update | Single-row 44px overflow or variable jumpy height | Stable viewport height and seamless font selection | ArtifactEditor.tsx, layout and controls tests |
| Iteration 1 | SPEC-17-03 | Apply getFontStack in ArtifactSlide for robust CSS font fallback chains across web presentation and projector | Bare fontFamily or unstacked font declarations | Universal fallback to system fonts if web font fails | ArtifactSlide.tsx, controls test |
| Iteration 1 | Peer Review | Address composer-2.5 findings: move imports to file top, remove unused resolveFontFamily, and add syncSelection guard | Leaving hygiene items unpolished | High code quality and zero dead imports | ArtifactSlide.tsx, render-model.ts, canvas-utils.ts, controls test, smoke-spec-17 |
