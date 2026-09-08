---
id: DEC-014
status: accepted
accepted_by: 'kodesh87 (2026-09-08)'
touches: []
supersedes: null
superseded_by: null
created: '2026-09-08'
---

# DEC-014 — Canvas "Reset" becomes discard-unsaved-changes; shipped/seeded content becomes ordinary editable content

## Decision

> In the Artifact canvas editor, the "Reset" button no longer restores a template from the
> filesystem seed (`AD-11`'s "Reset restores one selected template from that seed"). It discards
> the current unsaved canvas edits back to the last **Saved** state, exactly like any other
> discard-changes control. There is no in-UI way back to the original shipped template once a
> seeded element has been changed or deleted — that restore path is removed from the product
> surface, not merely renamed. Consequently: an element the seeder created is no longer protected
> from deletion (the `"shipped and required elements are part of the template"` refusal is
> removed), and adding a new canvas background replaces the existing one instead of stacking a
> second layer on top of it — both for administrator-added backgrounds and for whatever background
> the seeder shipped.

## Why

The seeder's job is a one-time bootstrap (`AD-17`): fill an empty database on first run. Once the
administrator has touched a template, the owner does not want the seed treated as a fallback
truth the canvas can be silently rolled back to — "Reset" reads to them as "undo my edits", not
"replace my work with the developer's example content", and a seeded element sitting on the canvas
should behave like any other element the administrator is free to remove or replace. Explicitly
chosen over keeping a separate "Restore Default" action alongside a repurposed "Reset" (which
would have preserved `AD-11`'s recovery path under a new name) — the owner's ruling, given a
three-way choice, was to drop the restore-to-seed capability from the product entirely.

## Cost

- **`AD-11`'s safety net is gone.** Today, an administrator who wrecks a template's canvas has one
  explicit, product-supported way back to a known-good state (Reset-from-seed). After this
  decision, there is none in the UI — recovery for a ruined template falls back to whatever the
  admin saved earlier (if anything) or a manual database/reseed operation outside the product.
- **`registry-snapshot.ts`'s no-substitution guarantee and `tests/registry-reseed.test.mjs`'s
  pinned behaviour are about a different mechanism (deleted rows never reappearing in a built
  plan) and are unaffected** — but the *"Reset restores one selected template from that seed"*
  clause of `AD-11` goes stale the moment this ships and must be edited in the same change — not
  left to imply a Reset button that no longer exists. (The `songset-*` override-record mechanism
  this Cost section originally also named as needing an edit does not: `AD-22`'s bounded-surface
  clause, which held that record, was already superseded by `AD-33` (2026-08-20, DEC-004) — Song
  Set layouts are a free canvas now, same as General, and `AD-33`'s own text already says "Reset on
  a Song Set layout behaves exactly as Reset on a General" by cross-reference to `AD-11`, not by
  restating `AD-11`'s definition. Editing `AD-11` alone is sufficient; `AD-33` needs no companion
  edit, only a check that its cross-reference still reads correctly afterward.)
- **The `"shipped and required elements are part of the template"` refusal and its i18n string
  (`admin.artifacts.deleteHintShipped`) lose their reason to exist** and are removed together with
  the code path that computes `refused` in the delete handler, not left dead.

## Trace

Raised from `.work/requirements/prompt-08-artifacts-qa-followup-round2.md` ("Catatan Tambahan" #2
and the BUG-2/BUG-3 sourced note about `Cannot delete e2 — shipped and required elements are part
of the template`), and from the owner's explicit ruling among three options presented in-session
2026-09-08. Lands in `SPEC-13-artifacts-qa-followup-round2` tickets 08 (Reset/delete) and 09
(background replace), which in turn edit `AD-11` in `.how/_platform/ARCHITECTURE-SPINE.md` when
implemented — `touches:` above stays empty until that implementation pass fills it, per this
project's decision-guide.md (`touches` is filled when the decision is *applied*, not when it is
merely *accepted*).
