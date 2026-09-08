---
id: DEC-010
status: applied
accepted_by: 'kodesh87 (2026-09-08)'
touches:
  - .how/_platform/design-system.md
  - .scratch/SPEC-12-artifacts-qa-followup/issues/06-main-spine-toolbar-title-consistency.md
  - .scratch/SPEC-12-artifacts-qa-followup/issues/07-song-sets-consistency.md
  - .scratch/SPEC-12-artifacts-qa-followup/issues/08-announcement-sets-consistency.md
supersedes: null
superseded_by: null
created: '2026-09-08'
---

# DEC-010 — "New" starts a top-level entity that needs identity first; "Add" inserts into an already-open context; "Insert" is retired from the vocabulary

## Decision

> **A create-action button is labelled "New" when it starts a top-level entity that needs its own
> identity (name/code) filled in before it exists — "New Song Set", "New Announcement Set". It is
> labelled "Add" when it inserts one more item into a collection whose context is already open and
> named — "Add Slide" (into Deck Sequence or Slides in Set), "Add Placeholder" (into the open
> canvas), the Main Spine "New Slide" panel's `+ Add` button (the slide *kind* is already chosen by
> the dropdown next to it). The word "Insert" is retired from the product vocabulary — nothing is
> relabelled to it, and any existing use is renamed to "New" or "Add" per this rule.**

## Why

Manual QA (`.work/requirements/prompt-05-artifacts-song-sets-qa-followup.md` and
`prompt-06-artifacts-announcement-sets-qa-followup.md`, both "NEW SONG SET AREA" point 2) asked
for a standardised rule, having noticed "New", "Add", and "Insert" used inconsistently across
Artifacts screens with no written convention. `.how/_platform/design-system.md` had no rule for
this. The chosen split follows the pattern already present in the shipped W11 UI (Main Spine's
"New Slide" panel already reads as *choose a kind, then Add*; Song Sets and Announcement Sets
create a named top-level entity first) rather than inventing a new pattern.

## Cost

- Every button currently labelled "Insert" must be relabelled. Confirmed by a full `src/`/`spa/src/`
  sweep (2026-09-08, at owner request when accepting this decision): no user-visible "Insert" label
  exists anywhere today — the only matches are internal variable names
  (`insertPlaceholderKey`, `ArtifactEditor.tsx:298,2072`), which are not user-facing and are
  unaffected. This cost item is precautionary, not a fix already owed.
- One real mislabel found by the same sweep: `AnnouncementSetsPanel.tsx:545` reads "Add New
  Announcement Set" — mixing both words in one label. Per this rule it is a top-level entity
  needing identity first (name filled in before it exists), so it relabels to "New Announcement
  Set", matching `SongSetEntriesPanel.tsx:216`'s "New Song Set".
- A future screen that genuinely does not fit either case (starts a top-level entity but from an
  already-open context, or vice versa) has no third label to fall back on and must be judged
  against this rule rather than reach for "Insert" as an escape hatch.
