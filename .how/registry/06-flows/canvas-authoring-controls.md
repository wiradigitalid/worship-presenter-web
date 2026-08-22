---
type: flow
component: registry
lc: LC-15
created: 2026-08-21
---

# Flow — Canvas authoring controls

## Source of truth

As-built, shipped in wave W3. DEC-004 § *Registry UI (product expectations)* named these three as gaps
against the as-built canvas: *"insert image, explicit layer order, bold/italic/(underline) controls."*
The persistence for all of them already existed — `imageRef` and `zIndex` in `allowedElementKeys`,
`fontWeight` and `fontStyle` in `allowedStyleKeys` (`internal/plan/validate_artifact.go`). Only the UI
was missing, so nothing here widens the payload.

The canvas surface itself is `01-ux/`'s to describe and is not written here. This flow records the three
behaviours that reach persistence, because that is LC-15's boundary.

## Insert image

An image element is added with its own geometry box carrying `imageRef`, placed with the same cascade
offset the existing text and shape inserts use. The file arrives through the existing upload path
(`src/components/ImageUploadField.tsx`, `POST /api/upload`); no new endpoint exists.

**Deleting the element never deletes the file.** Images are shared by reference (DEC-004 § *Copy /
paste*), so one binary may back an element on the spine, an element inside an Announcement Set, and a
copy of either. `tests/copy-paste-share-by-reference.test.mjs` pins this.

The consequence, recorded rather than solved: an upload whose slide is never saved leaves an
unreferenced file, and nothing reclaims it. DEC-004 defers the orphan-purge Admin tool, so there is no
owner for that file today — **OQ-43**.

## Explicit layer order

Bring forward, send backward, bring to front, send to back, on the selected element. They rewrite
`zIndex`, and the rule governing when that write happens is LC-15's persistence invariant, stated there
rather than repeated here: `zIndex` persists **only on a real reorder of existing elements**.

## Bold and italic

Toggles writing `fontWeight` and `fontStyle`, and both are written **only when the operator sets them**.
`ArtifactEditor.tsx` records why at the construction defaults: Fabric dies in `Cache.getFontCache` when
`fontStyle` is undefined, and every shipped seed element omits it — so writing the key unconditionally
would rewrite every seed layout's payload on first save. `serializeTextStyle`'s `setIfMeaningful`
discipline governs, and AC-04 in `tests/artifact-editor-controls.test.mjs` pins it: a seed layout opened
and saved without touching a style control produces no new style keys.

**Underline is not available**, and this is a deliberate absence rather than an oversight.
`textDecoration` is absent from `allowedStyleKeys`, so a control for it could not survive a save — the
server would reject the payload. Adding it is a spine-level change to the allowed style keys plus both
render paths (PPTX and projector), which no wave has taken. **OQ-41**.

## What an operator sees when a save is refused

The five lanes for the underlying route are `02-contracts/01-artifacts.md`'s, not restated here. The one
canvas-specific case: a payload carrying a key outside `allowedElementKeys` or `allowedStyleKeys` is
rejected whole, and the editor surfaces the server's message against the named element rather than a
bare failure — the same posture the layout trio takes for a background image on `verse`/`reff`
(`02-contracts/02-song-set-entries.md`).
