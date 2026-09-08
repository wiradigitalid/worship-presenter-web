---
id: DEC-009
status: applied
accepted_by: 'kodesh87 (2026-09-08)'
touches:
  - .how/_platform/design-system.md
  - .control/registry/defects.yaml
  - .scratch/SPEC-12-artifacts-qa-followup/issues/06-main-spine-toolbar-title-consistency.md
  - .scratch/SPEC-12-artifacts-qa-followup/issues/07-song-sets-consistency.md
  - .scratch/SPEC-12-artifacts-qa-followup/issues/08-announcement-sets-consistency.md
supersedes: null
superseded_by: null
created: '2026-09-08'
---

# DEC-009 — Every primary create-action button uses the `default` (primary) Button variant

## Decision

> **Every button whose sole job is to create a new entity or insert a new item — "New Song Set",
> "New Announcement Set", the Artifacts "New Slide" `+ Add`, "Add Slide", "Add Placeholder" — MUST
> render with shadcn `Button` `variant="default"` (the primary token), never `secondary`,
> `outline`, or a bespoke muted style.** A disabled state is the only excuse for a muted look, and
> it MUST use the `Button` `disabled` prop, not a manually chosen gray.

## Why

Manual QA after the W11 Artifacts overhaul (`.work/requirements/prompt-04-artifacts-main-spine-qa-followup.md`
point "NEW SLIDE AREA" #3, `prompt-06-artifacts-announcement-sets-qa-followup.md` point "NEW SONG
SET AREA" #3) found the Main Spine "+ Add", Song Sets "+ New Song Set", and Announcement Sets
"+ Add New Announcement Set" buttons rendered gray with white text — low contrast, and only turning
primary-colored on hover.

**Exact mechanism, confirmed by reading the code (2026-09-08):** all three (plus a fourth found in
the same-day codebase sweep — see below) pass a hand-written
`className="bg-primary hover:bg-blue-600 text-white ..."`, instead of using the `Button`
component's own `default` variant (`src/components/ui/button.tsx:11,37` —
`"bg-primary text-primary-foreground hover:bg-primary/80"`, already the fallback when no `variant`
prop is given at all). In dark mode `primary` is `oklch(0.922 0 0)` — a near-white token
(`.how/_platform/design-system.md`, dark palette) — meant to pair with `primary-foreground`
(near-black) for the 14.23:1 contrast the design system measures. Hardcoding `text-white` instead
pairs near-white text with a near-white background: exactly "abu2 dengan tulisan putih, sulit
dibaca." The `hover:bg-blue-600` override (a literal blue, unrelated to the design system's tokens)
is why hover suddenly looks "primary." This is not a missing token — the correct pairing already
exists in the `default` variant; these buttons override it with a broken one.

## Cost

- Any create-action button currently styled with a custom class or `variant="secondary"` must be
  touched to switch to `variant="default"`, even where no other behaviour changes. Confirmed sites
  (full `src/`/`spa/src/` sweep, 2026-09-08): `AnnouncementSetsPanel.tsx:542`,
  `ArtifactEditor.tsx:1730` (Main Spine "New Slide" panel) and `:1751` (Toolbar "+ Add Placeholder"
  — found only in this sweep, filed as `BUG-17`, not in the original 16), `SongSetEntriesPanel.tsx:213`.
  The rest of the app (e.g. `CreateForm.tsx:971-976`) already uses a bare `<Button>` correctly —
  this bug is confined to the Artifacts admin components authored fresh during W11.
- `tests/operator-shadcn-guard.test.mjs` already forbids hand-rolled `<button>`; this decision adds
  a narrower expectation on top (which *variant* a create-action button uses) that a future guard
  test may need to check for, so the rule does not silently rot back to a muted custom style.
