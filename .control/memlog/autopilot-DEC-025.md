---
artifact: .control/decisions/DEC-025-autopilot-mandate-wysiwyg-parity-wrap-slack.md
---

## Resume

Iteration: 5
Run branch: autopilot/DEC-025 (PR: not open yet)
Stopped at: SPEC-23-05 closed, advancing to SPEC-23-06
Blocked: —
Parked: [ad-n]
Next: SPEC-23-06 (PPTX-Safe Font Flags & Substitution Rules)

## Decisions

| When | Where | Decided | Instead of | Cost if wrong | Landed in |
|---|---|---|---|---|---|
| Preflight | wdi-autopilot preflight | Mandate DEC-025 accepted by owner kodesh87 for WYSIWYG Parity (Wrap Slack, Fit Width & Font Readiness) (SPEC-23) | Interactive approval at each ticket | Autonomous execution under ledger recording | DEC-025, decisions.yaml |
| Iteration 1 | SPEC-23-01 | Implemented WRAP_SLACK_RATIO (1.02) and applyWrapSlack in render-model.ts, longestWordPx & measuredWith across TS/Go schemas, and slack widening with re-wrap in serializeCanvas | Leaving zero-tolerance box width that breaks words in LibreOffice | Mid-word hyphenation and character-split regressions | render-model.ts, canvas-utils.ts, types.ts, validate.ts, runtime-contract.ts, hydrate.ts, types.go, validate_artifact.go, hydrate.go, validate_artifact_test.go, smoke-spec-23.test.mjs |
| Iteration 1 | Peer Review | Incorporated cursor-agent composer-2.5 findings: cleared measurement fields in Go/TS hydrate on placeholder substitution, normalized font families in isMeasurementValid, stringified fontWeight, added overlong word and Go schema unit tests | Leaking stale measurements onto runtime substituted text | Divergent line calculations and corrupted server exports | hydrate.go, hydrate.ts, canvas-utils.ts, render-model.ts, validate_artifact_test.go, smoke-spec-23.test.mjs |
| Iteration 2 | SPEC-23-02 | Implemented width-aware estimateTextFitScale using longestWordPx as contentWidth, estimateWrappedLineCount for line estimation without wrapLines, and isTextFitScaleMeasured observability | Blindness to width axis in PPTX export (contentWidth: 0) | Overlong words splitting mid-word in LibreOffice Impress | render-model.ts, smoke-spec-23.test.mjs |
| Iteration 2 | Peer Review | Incorporated cursor-agent composer-2.5 review: added tests for comfortable box non-shrinking, placeholder fallback, and sub-floor clamping | Unbounded heuristic line calculation over-shrinking comfortable boxes | Undesired text downscaling on slides that already fit comfortably | render-model.ts, smoke-spec-23.test.mjs |
| Iteration 3 | SPEC-23-04 | Implemented resolveTextRunsForPptx with softBreakBefore runs for soft wraps and breakLine for operator newlines, patchAutofitFontScale post-processor for explicit fontScale="100000", and default lineSpacingMultiple 1.2 | Multi-paragraph wrapping and un-scaled bare normAutofit | Disparate paragraph spacing and divergent layout-time scaling between PowerPoint and LibreOffice | render-model.ts, pptx-draw.ts, smoke-spec-23.test.mjs |
| Iteration 3 | Peer Review | Incorporated cursor-agent composer-2.5 findings: added clean word-partition check across paragraph boundaries in resolveTextRunsForPptx and preserved resolveElementTextForPptx caller check | Malformed wrapLines across newline-split paragraphs | Desynchronized paragraph rendering in PPTX text shapes | render-model.ts, pptx-draw.ts, smoke-spec-22.test.mjs, smoke-spec-23.test.mjs |
| Iteration 4 | SPEC-23-03 | Awaited document.fonts.ready in ArtifactEditor mountCanvas before element paint and in handleSave, gated handleFontFamilyChange behind fonts.load across active font sizes, and re-fitted on loadingdone in ArtifactSlide | Sizing and serializing text boxes against un-rendered fallback fonts | Stale geometry permanently persisted and uncorrected presenter font-swap spills | ArtifactEditor.tsx, ArtifactSlide.tsx, smoke-spec-23.test.mjs |
| Iteration 4 | Peer Review | Incorporated cursor-agent composer-2.5 review: added unmount cancellation to ArtifactSlide font listeners, tightened handleFontFamilyChange to preserve distance guards, and added functional stub injection tests | Detached unmounted DOM mutations and broken assertion guards | Fragile test suites and race conditions during fast font switching | ArtifactEditor.tsx, ArtifactSlide.tsx, smoke-spec-23.test.mjs |
| Iteration 5 | SPEC-23-05 | Implemented healTemplate and isElementUnmeasured in canvas-utils.ts, added isHealingSave mode in serializeCanvas to preserve h/zIndex/x/y, added handleRemeasureAll in ArtifactEditor with i18n, and warning logging on coherence mismatch | Requiring manual re-authoring of all legacy templates or data migration without font engine | Stale geometry mutations on heal or permanent absence of measurements | canvas-utils.ts, ArtifactEditor.tsx, render-model.ts, catalogue-en.ts, catalogue-id.ts, keys.ts, smoke-spec-23.test.mjs |
| Iteration 5 | Peer Review | Incorporated cursor-agent composer-2.5 review: verified idempotency of healTemplate, unmeasured placeholder exclusion at hydrate, and unmeasured PPTX export stability | Unbounded saves and silent geometry modifications on repeated re-measure | Layout shifts and degraded export quality | canvas-utils.ts, smoke-spec-23.test.mjs |





