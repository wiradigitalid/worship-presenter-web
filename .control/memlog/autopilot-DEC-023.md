---
artifact: .control/decisions/DEC-023-autopilot-mandate-artifacts-canvas-parity-and-input-ux.md
---

## Resume

Iteration: 1
Run branch: autopilot/DEC-023 (PR: ready for review)
Stopped at: Done — all 4 tickets under SPEC-21 implemented, dual-reviewed with cursor-agent composer-2.5, full suite (785 tests) green
Blocked: —
Parked: [ad-n]
Next: Conclude mandate DEC-023 and prepare PR for owner merge

## Decisions

| When | Where | Decided | Instead of | Cost if wrong | Landed in |
|---|---|---|---|---|---|
| Preflight | wdi-autopilot preflight | Mandate DEC-023 accepted by owner kodesh87 for Artifacts Canvas Input UX, Off-Canvas Geometry Preservation & Cross-Renderer Text Parity (SPEC-21) | Interactive approval at each ticket | Autonomous execution under ledger recording | DEC-023, decisions.yaml |
| Iteration 1 | SPEC-21-01 | Decoupled font size draft state from canvas commit via commitFontSizeFromDraft on blur/Enter with focus protection in syncSelection | Clamping on onChange and mid-keystroke reverts | Operators blocked from typing multi-digit font sizes | ArtifactEditor.tsx, canvas-utils.ts |
| Iteration 1 | SPEC-21-02 | Removed slide boundary upper clamping in serializeCanvas while preserving minimum element floor, height auto-sync, and intentional handle narrowing | Clamping elements to 100 - x and 100 - y | Truncated off-canvas bleed boxes and layout shifts | canvas-utils.ts, canvas-authoring-controls.md |
| Iteration 1 | SPEC-21-03 | Configured Fabric Textbox with splitByGrapheme: false (whole-word wrapping), getFontStack font fallback stacks, and standardized TEXT_LINE_HEIGHT = 1.2 | Grapheme mid-word breaks and mismatched 1.16 line height | Canvas editor text wrap divergence from Presenter and PPTX | ArtifactEditor.tsx, canvas-utils.ts |
| Iteration 1 | Peer Review | Incorporated cursor-agent composer-2.5 recommendation: added resolveCatalogFontFamily to eliminate CSS font-stack leakage into persisted JSON and font picker highlight breakage | Writing raw CSS font stacks into stored slide JSON | Font picker highlight broken and PPTX font fallback degraded | font-catalog.ts, canvas-utils.ts, ArtifactEditor.tsx, smoke-spec-21.test.mjs |
| Iteration 1 | SPEC-21-04 | Added automated test suite tests/smoke-spec-21.test.mjs (T-21-01..T-21-11) and updated smoke-spec-20, artifact-editor-controls, package.json | Unverified changes and broken regression tests | Silent regression during release gate | smoke-spec-21.test.mjs, smoke-spec-20.test.mjs, artifact-editor-controls.test.mjs, package.json |
