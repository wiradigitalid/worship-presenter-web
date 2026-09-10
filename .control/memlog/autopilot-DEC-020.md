---
artifact: .control/decisions/DEC-020-autopilot-mandate-artifacts-typography-persistence.md
---

## Resume

Iteration: 1
Run branch: autopilot/DEC-020 (PR: not open yet)
Stopped at: Done — SPEC-18 closed, all 3 tickets verified green
Blocked: —
Parked: —
Next: —

## Decisions

| When | Where | Decided | Instead of | Cost if wrong | Landed in |
|---|---|---|---|---|---|
| Preflight | wdi-autopilot preflight | Mandate DEC-020 accepted by owner kodesh87 for Artifacts Canvas Typography & Layout Persistence Follow-up (SPEC-18) | Interactive approval at each ticket | Autonomous execution under ledger recording | DEC-020, decisions.yaml |
| Iteration 1 | SPEC-18-01 | Add textShadowBlur (0..20) to Go & TS validators, serialization, and render surfaces | Storing only boolean textShadow with hardcoded default 4 | Custom shadow blur lost on reload | validate_artifact.go, types.ts, validate.ts, canvas-utils.ts, ArtifactEditor.tsx, ArtifactSlide.tsx, pptx-draw.ts |
| Iteration 1 | SPEC-18-02 | Searchable font picker with high-contrast category headers, items={FONT_ITEMS_MAP}, and i18n keys | Unfiltered 45-font dropdown without category boundary styling | Slower font selection and low category contrast | ArtifactEditor.tsx, keys.ts, catalogue-en.ts, catalogue-id.ts |
| Iteration 1 | SPEC-18-03 | Width serialization detects \|measured - authored\| > 1px for side-handle drags, preserving seed layout invariance | isText ? source.w * scaleX discarding obj.width alterations | Dragged textbox width reverting to original % on save | canvas-utils.ts, artifact-editor-controls.test.mjs, smoke-spec-18.test.mjs |
| Iteration 1 | Peer review | Reset shadowBlur to 4 on selecting non-shadowed text, clear font search on dropdown close, and localize category headers | Leaving stale shadowBlur state and non-localized headers | Inconsistent shadow toggle behavior and untranslated labels | ArtifactEditor.tsx |
