---
artifact: .control/decisions/DEC-025-autopilot-mandate-wysiwyg-parity-wrap-slack.md
---

## Resume

Iteration: 1
Run branch: autopilot/DEC-025 (PR: not open yet)
Stopped at: SPEC-23-01 closed, advancing to SPEC-23-02
Blocked: —
Parked: [ad-n]
Next: SPEC-23-02 (Width-Aware Fit Estimate)

## Decisions

| When | Where | Decided | Instead of | Cost if wrong | Landed in |
|---|---|---|---|---|---|
| Preflight | wdi-autopilot preflight | Mandate DEC-025 accepted by owner kodesh87 for WYSIWYG Parity (Wrap Slack, Fit Width & Font Readiness) (SPEC-23) | Interactive approval at each ticket | Autonomous execution under ledger recording | DEC-025, decisions.yaml |
| Iteration 1 | SPEC-23-01 | Implemented WRAP_SLACK_RATIO (1.02) and applyWrapSlack in render-model.ts, longestWordPx & measuredWith across TS/Go schemas, and slack widening with re-wrap in serializeCanvas | Leaving zero-tolerance box width that breaks words in LibreOffice | Mid-word hyphenation and character-split regressions | render-model.ts, canvas-utils.ts, types.ts, validate.ts, runtime-contract.ts, hydrate.ts, types.go, validate_artifact.go, hydrate.go, validate_artifact_test.go, smoke-spec-23.test.mjs |
| Iteration 1 | Peer Review | Incorporated cursor-agent composer-2.5 findings: cleared measurement fields in Go/TS hydrate on placeholder substitution, normalized font families in isMeasurementValid, stringified fontWeight, added overlong word and Go schema unit tests | Leaking stale measurements onto runtime substituted text | Divergent line calculations and corrupted server exports | hydrate.go, hydrate.ts, canvas-utils.ts, render-model.ts, validate_artifact_test.go, smoke-spec-23.test.mjs |

