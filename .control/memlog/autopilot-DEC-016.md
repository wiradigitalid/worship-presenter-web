---
artifact: .control/decisions/DEC-016-autopilot-mandate-artifacts-qa-followup-round3.md
---

## Resume

Iteration: 1 (final)
Run branch: autopilot/DEC-016 (PR: open)
Stopped at: Done (All 9 tickets of SPEC-14 completed and verified; SPEC-14 closed)
Blocked: —
Parked: —
Next: Final review and owner merge

## Decisions

| When | Where | Decided | Instead of | Cost if wrong | Landed in |
|---|---|---|---|---|---|
| Preflight | wdi-autopilot preflight | Mandate DEC-016 accepted by owner kodesh87 for Artifacts QA Follow-up Round 3 (SPEC-14) | Interactive approval at each ticket | Autonomous execution under ledger recording | DEC-016, decisions.yaml |
| Iteration 1 | SPEC-14-01 (BUG-7) | Synchronize image clipPath offset on active object:moving and guard fit recalculation on drag/move | Static clipPath window causing visual image cutoff during drag | Continuous tracking during drag; no image clipping | canvas-utils.ts, ArtifactEditor.tsx, artifact-editor-controls.test.mjs |
| Iteration 1 | SPEC-14-02 (BUG-11) | Clamp Deck Sequence card max-height to calc(100vh-380px) and canvas to calc(100vh-310px) | Window-level scrollbar on laptop screens | Viewport containment with internal card scroll | ArtifactEditor.tsx, artifact-editor-layout.test.mjs |
| Iteration 1 | SPEC-14-03 (BUG-18) | Remove seed element deletion lock in Go and client store per DEC-014; enforce nextRegistryUpdatedAt | Rejecting saves when seeded elements are deleted or modified | Seed elements are fully editable/deletable as intended by DEC-014 | validate_artifact.go, store.ts, registry.test.mjs, registry-go-http.test.mjs, ARCHITECTURE-SPINE.md |
| Iteration 1 | SPEC-14-04 (BUG-21) | Enforce text-foreground and override data-placeholder muted contrast when an announcement set is selected | Greyed-out placeholder text color on initial mount | Immediate high-contrast foreground text | AnnouncementSetsPanel.tsx, announcement-sets.test.mjs |
| Iteration 1 | SPEC-14-05 (BUG-22) | Position shadow toggle directly beside blur slider with S glyph; conditionally render slider only when shadow ON | Permanent sparkles icon without slider or separate slider row | Compact, intuitive text shadow controls matching design | ArtifactEditor.tsx, artifact-editor-controls.test.mjs |
| Iteration 1 | SPEC-14-06 (BUG-24) | Remove redundant Rename Header Card above canvas trio; provide inline title/code rename in configured list rows | Separate header card misleadingly suggesting canvas belongs to one entry | Clear shared canvas scope and zero-layout-shift inline rename | SongSetEntriesPanel.tsx, operator-shadcn-guard.test.mjs, artifact-editor-layout.test.mjs |
| Iteration 1 | SPEC-14-07 (BUG-25) | Lock properties toolbar height to h-11 min-h-[44px] max-h-[44px] with flex-nowrap and overflow-x-auto | Multi-line wrapping expanding toolbar to 80px+ and pushing canvas down | Zero vertical canvas shift across unselected/selected states | ArtifactEditor.tsx, artifact-editor-layout.test.mjs |
| Iteration 1 | SPEC-14-08 (BUG-26) | Set preserveObjectStacking: true on Fabric canvas instance | Clicking lower-layer objects popping them to the visual top of the stack | Selected elements stay in their true z-order layer depth | ArtifactEditor.tsx, artifact-editor-controls.test.mjs |
| Iteration 1 | SPEC-14-09 (BUG-27) | Realtime layer advance on Bring forward with index-sorted multi-selection reorder | Layer advance not visibly rendering while selected | Instant visual feedback on +1 layer advance | ArtifactEditor.tsx, artifact-editor-controls.test.mjs |
