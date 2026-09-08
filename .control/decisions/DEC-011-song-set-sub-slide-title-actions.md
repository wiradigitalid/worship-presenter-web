---
id: DEC-011
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

# DEC-011 — Every per-slide title area in the Registry canvas editor keeps its own Rename, grouped under the same "Canvas:" label pattern

## Decision

> **Every per-slide title area in the Registry canvas editor — Main Spine's own slide, a Song Set's
> Title/Verse/Reff sub-slide, and an Announcement Set's individual slide-in-set — keeps its own
> Rename action. Its display name is not its parent's name, and a reader needs to tell them apart.**
> Reset and Save stop standing next to Rename as peer buttons; they move under a "Canvas:" label
> (`[Rename] | Canvas: [Reset] [Save]`, switching to `[Cancel] [Save] | Canvas: [Reset] [Save]`
> while rename is active). Nothing is removed — the same actions exist, grouped to show which one
> renames the slide and which two act on its canvas. This one grouping convention applies
> everywhere this shape occurs in this editor, not as three separate decisions for three screens.

## Why

Manual QA (`.work/requirements/prompt-05-artifacts-song-sets-qa-followup.md`, "COMPONENT AREA"
point 3) questioned why Rename/Reset/Save exist at the Song Set's Title/Verse/Reff level at all.
They exist because each sub-slide is its own template with its own canvas and its own display
name — removing Rename would leave no way to tell "Title" apart from a renamed variant across Song
Sets. The grouping confusion is the same one already resolved for Main Spine's title area (see
`prompt-04-artifacts-main-spine-qa-followup.md`, "TITLE AREA").

Widened 2026-09-08 at the owner's request when accepting this decision ("tegakkan ke semua coding
yang lain, cek ulang"): a full sweep of `src/components/admin/` found `AnnouncementSetsPanel.tsx`
carries a THIRD instance of the identical shape — a per-slide Rename (`handleSaveRenameSlide`,
~L288) alongside a Reset (`slideReset`, ~L805), distinct from the Announcement *Set*'s own
Rename (`handleSaveRenameSet`, ~L175). Writing one decision that names all three instances, rather
than three narrower decisions, is what "tegakkan ke semua coding yang lain" asks for — a rule
someone can check a fourth future screen against, not a patch for the two screens found first.

## Cost

- Three call sites, not one, must be touched: Main Spine's own title area, the Song Set
  Title/Verse/Reff sub-slide, and the Announcement Set's slide-in-set title area — all three should
  land together so the pattern does not drift between them (already the case in `SPEC-12`: tickets
  06, 07, and 08 all cite this decision).
- If BUG-9's investigation (the Announcement Set's *duplicate* title-area question, a separate
  defect) collapses two blocks into one, this decision's grouping applies to whichever single title
  area survives that investigation — the two questions are related but not the same fix.
