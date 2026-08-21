---
type: lc
id: LC-15
name: Registry store
lc_type: service
container: api
component: registry
created: 2026-08-18
---

# LC-15 — Registry store

## Responsibility

Read/write `artifact_templates`, Reset, delete, whole-list reorder, `position` compact, AD-15
validation. Service-bound freeze clone lives in `src/lib/registry/service-snapshot.ts` (same store
boundary; Hub LC-2 calls it) — **extended (owner ruling, 2026-08-20, reversing an earlier live-read
draft)** to also clone the shared Title/Verse/Reff trio into `service_song_set_layouts` at the same
create/Sync moment, so the trio freezes exactly like the rest of the structure instead of being
read live at plan-build time.

**Extended (DEC-004, G4-registry — built and shipped 2026-08-21, waves W3/W4):** the same store also owns `song_set_layouts`
(3-row singleton, Reset per role), `announcement_sets` / `announcement_set_slides` (set CRUD,
per-set ordered slide CRUD, referential check before a set delete), `background_library_images`
(single-default enforcement), and `song_books` (single-default enforcement, in-use check against
`hymns.book_code` before delete). `variable_name` uniqueness for `song-set-entry` rows is enforced
here, in code, never by a column constraint (AD-31) — the same pattern this store already uses for
AD-19 slot uniqueness. The predefined-field migration runner (`06-flows/predefined-field-migration.md`)
is also this store's responsibility, gated by `data_version` (AD-21), run once on startup (AD-18).

## Depends on

SQLite in `api`. LC-11 calls this; this does not call LC-11.

## Interface

`src/lib/registry/store.ts`. The plan (LC-16) reads the result, not the Admin API. New table
access is expected to live beside it in the same module family (implementation detail, not
specified further here).

## Persistence invariants

`position` is persisted and asserted contiguous after every delete and reorder, on the spine and
within each Announcement Set.

`zIndex` is different and the difference is load-bearing: it is persisted **only when the operator
actually reorders existing elements**. Inserting an element gives the new one a `zIndex` above the
current maximum and leaves every existing element's stored value untouched; deleting one leaves every
survivor's untouched. Insert, reorder and delete are three separate triggers on layout membership, and
a guard covering one covers neither of the others.

Why it matters here rather than only in a test: both the PPTX exporter and the web slideshow paint in
`zIndex` order, so this rule decides what reaches the congregation — and `data/default-registry.json`
holds 40 layouts whose stored `zIndex` is not dense (`[1,1,1]`, `[0,0,1,1]`). An unconditional rewrite
renumbered all of them on any save. That shipped twice before it was closed, once through the
untouched-save path and once through insert, which is why the invariant is stated where the next agent
reads it. Verified: `src/lib/registry/canvas-utils.ts`; guards AC-06 and AC-07 in
`tests/artifact-editor-controls.test.mjs`.

## Notes

Seed is bootstrap + Reset only (AD-17), extended to every new table's own seed rows (the trio, the
two reference-deck Announcement Sets). `position` is persisted and asserted contiguous after every
delete and reorder, both on the spine and within each Announcement Set. Reset updates a still-live
row; it is not undelete (OQ-24). A set delete is rejected while any live spine marker still
references it — checked here, not left to a DB `FOREIGN KEY` (no cross-table constraint exists;
see data-model.md Invariants).
