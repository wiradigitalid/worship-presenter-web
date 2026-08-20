---
type: contract
component: hub
lc: LC-7
direction: exposed
created: 2026-08-18
updated: 2026-08-20
---

# Contract — Hymns

## Source of truth

`none`. `internal/httpapi`. Corpus = files in `data/song-book/`, seeding `hymns` once per book code
(AD-36); the table is administrator-owned data thereafter, not a reconciled projection.

## Purpose

UC-22, FR-2, FR-23, FR-24. Number/title search, not a book-upload machine.

## Operations

| Operation | Purpose | Realizes |
| --- | --- | --- |
| GET `/api/hymns` | Search / list by book | UC-22 |

## Five lanes

| Lane | Answer |
| --- | --- |
| Authentication | Session |
| Validation | Query string; book code is server-owned (AD-26) |
| Error handling | Shared envelope. Unknown `book_code` (not registered in `song_books` at all) → 404, the fail-closed posture `05-song-books.md`'s PATCH/DELETE already use for the same condition — a typo or a stale reference must not look like a book with no hymns. A registered `book_code` with zero rows for it (an admin-created book not yet authored) → 200 `{ hymns: [] }`, and the picker shows an explicit "This book has no hymns yet" state, not a bare empty list. Malformed query tokens are ignored, not 400. |
| Rate limiting | `none` — Operator session, one host; not a public API. |
| Idempotency | GET is safe |

## Error behaviour

| Condition | Response | Caller should |
| --- | --- | --- |
| `book_code` not registered in `song_books` at all | 404 `Song book not found` | Refresh the book list — same fail-closed posture as an unknown `book_code` on PATCH/DELETE (`05-song-books.md`) |
| `book_code` registered, zero `hymns` rows for it | 200 `{ hymns: [] }` | Picker shows "This book has no hymns yet", distinct from a bare empty result; default setting is not rewritten (AD-26 inert) |

## Compatibility

Silently filtering by locale in `WHERE` is breaking (AD-26 / FR-24).

## Constraints

This API (`GET /api/hymns`) does not write the `hymns` table — it is search/list only, same as before.
The table itself is no longer a pure projection of `data/song-book/` for every corpus code: since
DEC-005 / AD-36, `hymns` is bootstrapped once per `book_code` and is administrator-owned thereafter, so
a write path now exists elsewhere — the Services contract's "Save to Song Book" operation
(`02-services.md`, UC-28) — but it is not this endpoint, and this endpoint's own read behaviour is
unchanged. The bible corpus (`bible_verses` etc.) remains a pure projection under AD-25, untouched.
