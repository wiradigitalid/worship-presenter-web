---
id: DEC-009
status: draft
touches: []
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
primary-colored on hover. `.how/_platform/design-system.md` already tokenizes `primary` /
`primary-foreground` with measured contrast of 17.18:1 (light) and 14.23:1 (dark) through the
installed shadcn `Button` component (§ Tokens, § Contrast on load-bearing combinations) — the
problem is not a missing token, it is these three buttons not using the variant the design system
already provides for exactly this purpose.

## Cost

- Any create-action button currently styled with a custom class or `variant="secondary"` must be
  touched to switch to `variant="default"`, even where no other behaviour changes.
- `tests/operator-shadcn-guard.test.mjs` already forbids hand-rolled `<button>`; this decision adds
  a narrower expectation on top (which *variant* a create-action button uses) that a future guard
  test may need to check for, so the rule does not silently rot back to a muted custom style.
