---
artifact: .control/decisions/DEC-015-autopilot-mandate-artifacts-qa-followup-round2.md
---

## Resume

Iteration: 1 (boundary: completed SPEC-13-09)
Run branch: autopilot/DEC-015 (PR: not open yet)
Stopped at: SPEC-13-09 completed; ready to commence SPEC-13-10
Blocked: —
Parked: —
Next: SPEC-13-10: Inline status fixed slot to eliminate layout jump (BUG-20, DEC-011)

## Decisions

| When | Where | Decided | Instead of | Cost if wrong | Landed in |
|---|---|---|---|---|---|
| It 1 (autopilot/DEC-015) | wdi-autopilot preflight | Mandate DEC-015 accepted by owner kodesh87 for Artifacts QA Follow-up Round 2 (SPEC-13) | Interactive approval at each ticket | Full autonomous recording | DEC-015, decisions.yaml |
| It 1 (autopilot/DEC-015) | SPEC-13-01 | Auto-select first Deck Sequence slide on mount via resolveInitialSelectedId with empty summaries guard | Requiring manual click on fresh load (BUG-1, BUG-8) | Inactive drag reorder and new slide dropdown | ArtifactEditor.tsx, canvas-utils.ts, artifact-editor-controls.test.mjs |
| It 1 (autopilot/DEC-015) | SPEC-13-02 | Wire native contextmenu listener on upperCanvasEl directly and unify trigger logic with multi-select preservation | Attaching only to outer shell which Fabric upper canvas intercepts (BUG-2) | Context menu never opening on canvas elements | ArtifactEditor.tsx, canvas-utils.ts, artifact-editor-controls.test.mjs |
| It 1 (autopilot/DEC-015) | SPEC-13-03 | Recalculate contain/cover aspect fit on object:modified via updateImageElementFit with box-anchored clipBox | Image content remaining small when handles resize (BUG-7) | Distorted or unscaled images on resize | ArtifactEditor.tsx, canvas-utils.ts, artifact-editor-controls.test.mjs |
| It 1 (autopilot/DEC-015) | SPEC-13-04 | Deck Sequence card flex containment with flex-1 min-h-0 overflow-y-auto on list and shrink-0 on header | Unbounded content growth overflowing into window scrollbar (BUG-11) | Vertical window scrollbar on 1080p screens | ArtifactEditor.tsx, artifact-editor-layout.test.mjs |
| It 1 (autopilot/DEC-015) | SPEC-13-05 | Fixed height h-[42px] + overflow-hidden on banner with flex-1 min-w-0 truncate on text and shrink-0 on badge | Variable line wrapping shifting canvas on tab switch (BUG-14) | Canvas height jumping when switching song set tabs | SongSetEntriesPanel.tsx, artifact-editor-layout.test.mjs |
| It 1 (autopilot/DEC-015) | SPEC-13-06 | Song Set code rename in PATCH handler with atomic tx migrating song_set_inputs and purging target inert rows | Keeping variableName immutable or leaving weekly inputs orphaned (BUG-15) | Silently broken hymn bindings on rename | SongSetEntriesPanel.tsx, song_set_entries.go, song_set_entries_test.go, registry-kind-rename.test.mjs, 02-song-set-entries.md |
| It 1 (autopilot/DEC-015) | SPEC-13-07 | Sized rename inputs to h-8 on 58px cards and dropped vestigial Rename on fixed Song Set trio roles | Vertical height shift on entering rename and useless rename on static trio tabs (BUG-16, BUG-23) | Canvas jumping during rename and non-persisted edits | ArtifactEditor.tsx, SongSetEntriesPanel.tsx, canvas-adapters.ts, artifact-editor-layout.test.mjs |
| It 1 (autopilot/DEC-015) | SPEC-13-08 | Canvas Reset discards in-memory edits to last-Saved state with saveSeq guard; drop seed element delete refusal | Restoring template from filesystem seed and refusing to delete seeded elements (DEC-014) | Overwriting user edits with factory seed or inability to delete default elements | ArtifactEditor.tsx, keys.ts, catalogue-en.ts, catalogue-id.ts, ARCHITECTURE-SPINE.md, DEC-014, decisions.yaml, artifact-editor-controls.test.mjs |
| It 1 (autopilot/DEC-015) | SPEC-13-09 | Background replace removes existing background elements with isBackgroundElement; load failure keeps prior bg | Stacking extra background layers on top of existing ones (DEC-014, BUG-19) | Obscured backgrounds and visual clutter on canvas | ArtifactEditor.tsx, canvas-utils.ts, artifact-editor-controls.test.mjs |
