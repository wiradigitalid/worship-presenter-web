---
type: lc
id: LC-12
name: Hub rundown parse and service write
lc_type: service
container: api
component: hub
created: 2026-08-18
---

# LC-12 — Hub rundown parse and service write

## Responsibility

Interpret the Rundown, resolve hymns, and write `services` rows.

- **Write paths:** Hub create with date-collision 409 unless explicit second row; webhook date upsert later CAP-11; correction; edit with `updated_at`.
- **Create validation:** Hub create refuses when no date is readable (OQ-21).
- **Create snapshot:** clones the live registry spine, plus every Announcement Set it splices in, into that Service's snapshot in the same transaction (AD-16, AD-35 — Announcement Sets are cloned structure now, not a live membership list).
- **Generate:** not this LC (OQ-20).
- **Delete Service:** cascade `song_set_inputs` (planned table, DEC-004) + unlink unreferenced local uploads; no longer cascades `announcement_items` once `03-announcements.md` retires.

**DEC-004 additions (FR-32, FR-34):** this LC also upserts `song_set_inputs` — one row per Song Set entry `variable_name`, keyed `(service_id, variable_name)` — on every Service save, replacing the old positional `song1Number`..`song4Number` overlay-into-`items` mechanism (`applySongOverlay` / `insertHymnInSection`, both slot-indexed 0..3). The entry list itself is read from the Registry's live `artifact_templates` rows (`base_type = 'song-set-entry'`), same-process, no new HTTP boundary. A `variable_name` no longer on the live spine leaves its `song_set_inputs` row inert, never an error (same posture as AD-19/AD-31 for a deleted slot binding); the same inert-not-error posture applies to a `song_book_code` no longer present in `song_books` — LC-12 writes it unchanged, without validating it against the live book list (see `05-model/form-fields.md`).

## Depends on

LC-7 (Song Book)

## Called from

LC-2 (Hub HTTP, this phase) · LC-8 (webhook in, CAP-11 later)

## Interface

`parseRundown` + `updateService` / insert. Not slide order.

## Notes

As-built: `src/lib/parser.ts`, `src/lib/services/create-service.ts`, `src/lib/services/update-service.ts`. Webhook rundown still falls back to `localIsoDate()` when the parse has no date — specified OQ-21 forbids that (SDD Evidence, OQ-27).
