---
type: contract
component: registry
lc: LC-11
direction: exposed
created: 2026-08-20
---

# Contract — Song Books

## Source of truth

None yet — designed at G4, not built. Backing table: `song_books`. Reads `hymns.book_code` and
`song_set_inputs.song_book_code` (both Hub-owned) at delete time only, to refuse orphaning a book
still in use or still referenced by a Service's weekly input.

## Purpose

UC-25 (S3 extends its scope to Song Book selection). Admin-only (AD-14). Read by Hub's weekly
Song Set inputs, which pick a book per entry per Service, falling back to this table's global
default (S3).

## Operations

| Operation | Purpose | Realizes |
| --- | --- | --- |
| GET `/api/admin/song-books` | List of books and which one is default | UC-25 |
| POST `/api/admin/song-books` | Add a book (`{ book_code, name, locale, licence?, provenance? }`) with no corpus file behind it — allowed (owner ruling, 2026-08-20, OQ-38 closed; AD-36 extended, not reversed). AD-26 requires every song book to carry code, name, locale, licence and provenance; for a corpus-backed book those come from the file's declared metadata (AD-26/AD-36), but an admin-created book has no file to declare them from, so this body carries all three itself (owner ruling, 2026-08-20, OQ-39 closed) | UC-25 |
| PATCH `/api/admin/song-books/[book_code]` | Rename, mark this book the global default, or correct its `locale`/`licence`/`provenance` (`{ name?, locale?, licence?, provenance?, is_default? }`) — the same post-bootstrap correction path AD-36 already gives every song-book field, corpus-backed or admin-created alike | UC-25 |
| DELETE `/api/admin/song-books/[book_code]` | Remove a book; rejected if any `hymns` row still carries that `book_code`, or if any `song_set_inputs.song_book_code` (Hub-owned) still references it | UC-25 |

## Five lanes

| Lane | Answer |
| --- | --- |
| Authentication | Admin + AD-5 matcher. No session / not Admin → 403 Forbidden. |
| Validation | `book_code` 1–20 chars, unique among live books (code-checked, mirrors AD-31's discipline — not a bare DB `UNIQUE` alone). Name 1–120 chars. `locale` required, 1–20 chars (AD-26 — every corpus row carries a locale, corpus-backed or admin-created; the field this axis rests on is never optional). `licence` and `provenance` optional/nullable free text — nothing downstream depends on either being present for a song book (OQ-39, closed 2026-08-20). |
| Error handling | Envelope in `cross-cutting.md`. 400 validation. 404 unknown `book_code`. 409 duplicate `book_code` on create, book still referenced by `hymns` or `song_set_inputs.song_book_code` on delete, or stale `updatedAt`. |
| Rate limiting | `none` — Admin-only on one host. |
| Idempotency | GET safe. Re-marking the same book default twice is safe. DELETE of an already-gone `book_code` is 404. |

## Error behaviour

| Condition | Response | Caller should |
| --- | --- | --- |
| `book_code` collides with a live book | 409 `Song book already exists` | Pick another code |
| DELETE a book still used by a `hymns` row | 409 `Song book is still in use` | Reassign or remove the hymn rows first (Hub's hymn corpus, out of this contract's write authority) |
| DELETE a book still referenced by a Service's `song_set_inputs.song_book_code` | 409 `Song book is still in use` | Same posture as an Announcement Set still referenced by a live marker — refuse, never cascade; the Service must stop pointing at this book first (Hub-owned data, out of this contract's write authority) |
| DELETE the current default book (allowed when no `hymns` row and no `song_set_inputs.song_book_code` reference it — including an admin-created book with zero hymns) | 200 — allowed; no default remains until Admin marks a new one | Mark a new default; until then, Hub's weekly form and hymn lookup fall back exactly as they do with no `song_books` row marked default at all (same posture as `04-background-library.md`'s current-default delete) |
| PATCH targets an unknown `book_code` | 404 | Refresh the list |
| Stale `updatedAt` on PATCH/DELETE | 409 | Re-read, then retry |

## Compatibility

Removing the single-default invariant is breaking S3's "falls back to the Admin-set global
default" promise — ambiguity here cascades into hymn lookup resolving on the wrong pair
(`book_code`, `number`). Deleting a book without checking `hymns.book_code` usage would silently
orphan hymn rows — never ship that shortcut. The same shortcut risk applies to
`song_set_inputs.song_book_code`: deleting a book a Service still references would leave that
Service's weekly input pointing at nothing. DELETE MUST check both tables, never one alone.

## Constraints

**General posture.** This contract does not write `hymns` rows. Under AD-36 (DEC-005) a song book's
rows are seeded once from its committed corpus file and are administrator-owned thereafter — the write
authority for lyric text sits with Hub's save-to-book route (UC-28), not here. AD-25 still governs the
bible family, but no longer binds `hymns`. This contract only manages the selectable list of books,
and the one global default that Hub's weekly form and hymn lookup read.

**Admin-created book ruling.** An admin-created book has no corpus file behind it (owner ruling,
2026-08-20, OQ-38 closed; AD-36 extended, not reversed). POST here may create a `song_books` row for a
`book_code` that no committed corpus file declares. That row starts with zero `hymns` rows — there is
nothing to seed from — and is filled only by an administrator authoring hymns into it afterward (one
at a time today; a bulk JSON import is a named-but-undesigned future capability, see the spine's
*Deferred* ledger, not this contract). Creating the row sets AD-36's per-`book_code` bootstrap marker
immediately, exactly as a corpus bootstrap would.

**Admin-created book's remaining fields (owner ruling, 2026-08-20, OQ-39 closed).** AD-26 requires
every song book to carry code, name, locale, licence and provenance, whichever writer creates the row.
`book_code` and `name` are already Admin-supplied at creation (POST body above); this ruling settles
the other three the same way — **locale, licence and provenance are filled in by the Admin**, not
derived from a file, because none exists for this row to declare them from. Nothing about AD-26's
five-field shape is relaxed for an admin-created book; only the source moves from a corpus file's
declared metadata to the Admin's own input. Thereafter those three fields are corrected exactly like
any other post-bootstrap field under AD-36 — PATCH, never re-derived, because there is still nothing
to re-derive them from.

**Marker granularity.** The bootstrap marker gates corpus-seeding only — whether a shipped file's
hymns get bulk-inserted for that `book_code` — and never gates an administrator's own per-row write.
An Admin authoring hymns one at a time into an admin-created book, and the "Save to Song Book" write
(UC-28), both work exactly the same whether the marker is set or not; the marker's only job is
refusing a second bulk seed of the same code.

**Collision.** If a corpus file later ships declaring this same `book_code`, the marker already shows
it seeded, so AD-36's existing rule applies unchanged — the file's hymns are never inserted and the
row's fields are never touched. The `book_code` stays permanently claimed by the admin-created row;
the corpus file is inert for that code from then on.
