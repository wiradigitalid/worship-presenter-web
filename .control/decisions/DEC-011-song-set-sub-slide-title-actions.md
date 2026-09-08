---
id: DEC-011
status: draft
touches: []
supersedes: null
superseded_by: null
created: '2026-09-08'
---

# DEC-011 — A Song Set's Title/Verse/Reff sub-slide keeps its own Rename, grouped under the same "Canvas:" label pattern as Main Spine

## Decision

> **Inside one Song Set, each of the three sub-slides (Title, Verse, Reff) keeps its own Rename
> action — its display name is not the Song Set's name and a reader needs to tell them apart when
> more than one Song Set exists.** Reset and Save stop standing next to Rename as three peer
> buttons; they move under a "Canvas:" label, matching the Main Spine title-area convention
> (`[Rename] | Canvas: [Reset] [Save]`, switching to `[Cancel] [Save] | Canvas: [Reset] [Save]`
> while rename is active). Nothing is removed — the same three actions exist, grouped to show
> which one renames the sub-slide and which two act on its canvas.

## Why

Manual QA (`.work/requirements/prompt-05-artifacts-song-sets-qa-followup.md`, "COMPONENT AREA"
point 3) questioned why Rename/Reset/Save exist at the Title/Verse/Reff level at all. They exist
because each sub-slide is its own template with its own canvas and its own display name — removing
Rename would leave no way to tell "Title" apart from a renamed variant across Song Sets. The
grouping confusion is the same one already resolved for Main Spine's title area (see
`prompt-04-artifacts-main-spine-qa-followup.md`, "TITLE AREA"); this decision applies that same
resolved pattern here instead of inventing a second convention for the same problem.

## Cost

- The Song Sets sub-slide title-area component must be touched to add the "Canvas:" label and the
  rename-active button cycle, mirroring work already scoped for Main Spine — these two call sites
  should land in the same ticket so the pattern does not drift between them.
