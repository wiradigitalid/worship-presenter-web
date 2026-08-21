---
id: SPEC-w3-registry
companions:
  - ../../../.what/registry/SRS-registry.md
  - ../../../.how/registry/SDD-registry.md
  - ../../../.what/registry/04-usecases/UC-14-edit-layout.md
  - ../../../.what/registry/04-usecases/UC-16-sync-artifact.md
  - ../../../.what/registry/04-usecases/UC-20-deck-matches-payload.md
  - ../../../.how/registry/02-contracts/01-artifacts.md
  - ../../../.how/_platform/ARCHITECTURE-SPINE.md
  - ../../../.control/decisions/DEC-004-nested-artifact-registries.md
  - ../../../.constitution/project/codebase-stack-guide.md
sources:
  - ../../../.control/registry/requirements.yaml
  - ../../../.control/registry/usecases.yaml
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.
>
> **Projection, not authorship.** This file projects `.what/registry/`, `.how/registry/` and DEC-004 onto wave W3. It introduces no `FR`, `UC`, `BR` or `AD`. A gap found while building is landed in the corpus by the skill that owns that layer — never patched in here.

# W3 × Registry — FR-20 / FR-21: the authoring surface DEC-004 promised but did not finish

## Why

**A pain to solve.** DEC-004's admin surfaces shipped, so the Registry is now a real nested registry — spine, song-set entries, a shared layout trio, announcement sets, backgrounds, song books. Three promises in that same decision did not land with them, and each leaves an Admin stuck on a specific gap rather than merely unpolished.

The canvas can add text and a rectangle and nothing else, so a layout needing an image, a deliberate stacking order, or emphasis cannot be authored at all — even though the payload already carries `imageRef`, `zIndex`, `fontWeight` and `fontStyle`. The Live Preview labels a row `Untitled Slide` when the registry knows its label, which is both a meaningless title and the one untranslated string on an otherwise fully translated surface. And Sync Artifact still promises the Operator that "Announcement flyers stay this Service's list" — a sentence that became false earlier today when FR-3 retired and the five `/api/announcements` routes were deleted — then succeeds in silence without refreshing the preview it just changed.

The backdrop that makes it matter now: the deck structure is frozen per Service at creation, so an Admin who cannot author a layout this week cannot fix last week's either. The gap compounds.

## Capabilities

- **CAP-9**
  - **intent:** Admin can author a slide's full layout in the Registry — its images, its stacking order, and its text emphasis — and can see and trust what the Registry says about the deck it produces.
  - **success:** The `FR-20` and `FR-21` proofs of done hold on the as-built canvas. A layout carrying a manually inserted image, a deliberately reordered `zIndex`, and bold or italic text round-trips through save and reload with those values intact and is accepted by the Go validator (`internal/plan/validate_artifact.go`). A seed layout opened and saved without touching a style control produces a payload with **no** new style keys. No preview row reads `Untitled Slide` while a registry label or kind is available, and the last-resort string is translated. Sync Artifact states what it now does, reports success visibly, and refreshes the Live Slide Preview without remounting the route.

## Constraints

- **The payload shape does not change.** Every key written MUST already appear in `allowedElementKeys` or `allowedStyleKeys` in `internal/plan/validate_artifact.go`. A key outside that list is rejected by the server, so wanting one is a finding to report, not a thing to send.
- **Underline is not persistable.** `textDecoration` is absent from `allowedStyleKeys`. It MUST be documented as out of scope rather than faked with a control that cannot survive a save.
- **`fontStyle` is written only when the operator sets it.** `ArtifactEditor.tsx` records at ~line 197 that Fabric dies in `Cache.getFontCache` when `fontStyle` is undefined and that every shipped text element omits it. Writing it unconditionally would rewrite every seed layout's payload on first save. `serializeTextStyle`'s existing `setIfMeaningful` discipline governs.
- **`zIndex` stays a dense, deterministic ordering.** Both the PPTX exporter and the web slideshow paint in `zIndex` order (`ArtifactEditor.tsx` ~line 598), so this control decides what reaches the congregation. Gaps or duplicates that make the next sort non-deterministic are a defect, not a cosmetic detail.
- **Deleting an element never deletes the file.** Images are shared by reference (DEC-004 § *Copy / paste*); `tests/copy-paste-share-by-reference.test.mjs` pins it.
- **A group marker is never a projected slide.** Only children carry `#` slide numbers and reach the room (DEC-004 § *Live Preview / Presenter chrome*).
- **No route remount for a refresh.** `router.refresh()` and `navigate(0)` are forbidden on operator surfaces; `tests/no-router-refresh-guard.test.mjs` enforces it, and it exists because `navigate(0)` blanks and repaints the page.
- **Every new user-facing string is translated in both catalogues.** `keys.ts`, `catalogue-en.ts` and `catalogue-id.ts` change together or `tests/i18n.test.mjs` fails. Indonesian is written as Indonesian, with industry-English technical terms left alone.
- **shadcn primitives only**, from `src/components/ui/` — `tests/operator-shadcn-guard.test.mjs`.
- **Never `return null` while loading.** That is the page-flash defect already reported by the owner.
- **An absence-guard counts only once it has been seen to fail.** Every new or changed guard is proved by injecting the defect it claims to catch, in each form it claims to cover, then reverting.
- **The corpus is not the builder's to change.** No worker edits `.what/`, `.how/`, or an `applied` `DEC-`. A deviation from the SDD or an `AD-N` is reported and becomes a `DEC-` through `wdi-decision`.

## Non-goals

- **Underline.** Named above; out until `textDecoration` is persistable, which is a spine-level change and not this wave's.
- **The Hub half of `dec004-completion`.** The Family/Youth name inputs and the S6 closing-prayer checkbox are W4, against FR-6.
- **Registering the three unrun guards in `package.json`.** It touches no `FR`, so it is fastpath work outside this wave — but every story here inherits it as a precondition for the word "green".
- **Any new predefined-field key.** S1's catalog was completed in `f393bfd`; this wave consumes it and adds nothing.
- **The webhook's `announcements[]` ingestion.** `03-announcements.md` retires the five routes and is silent on the webhook; that silence needs an owner decision, not code.
- **Announcement Set group chrome in the Live Preview.** Checked before writing this: `preview-model.ts` documents grouping as present "only on members of a group (currently SongSets)", and `slide-plan.ts` types `group.role` as `'title' | 'lyric'`, so an Announcement Set expands flat (`slide-plan.ts` ~791) with no group wrapper. Adding it means widening a role union the Presenter also consumes, and DEC-004 says groups **MAY** appear as operator chrome — permissive, not normative. Story C therefore keeps only the normative half: prefer the registry label or kind over `Untitled Slide`.
- **A second independent reviewer.** The owner ruled the coordinator reviews; recorded so its absence is deliberate rather than an oversight.

## Success signal

An Admin authors a slide that needs a background image behind two stacked text boxes with a bold heading, saves it, reopens it unchanged, and sees it render the same way in the projector and in the downloaded PPTX. The same Admin, looking at the Live Preview, can tell what every row is without opening it — and after pressing Sync Artifact, is told plainly that it worked and watches the preview redraw into the structure they just synced.

## Assumptions

- `SlidePreviewList.tsx` is Registry-owned for this wave's purposes: UC-20 is registered `component: registry` and the title it renders comes from the registry label or kind, even though the component is mounted by Hub's Service form.

## Open Questions

- Nothing blocking this wave. The webhook ingestion question and the typecheck-gate question are recorded as non-goals above and belong to the owner, not to a story here.
