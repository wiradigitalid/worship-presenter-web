---
type: contract
component: hub
lc: LC-7
direction: exposed
created: 2026-08-18
updated: 2026-08-18
---

# Contract — Hymns

## Source of truth

`none`. `src/app/api/hymns/route.ts`. Corpus = files in `data/song-book/` (AD-25).

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
| Error handling | Shared envelope. Absent table → 200 `{ hymns: [] }`; the picker shows no rows. Malformed query tokens are ignored, not 400. |
| Rate limiting | `none` — Operator session, one host; not a public API. |
| Idempotency | GET is safe |

## Error behaviour

| Condition | Response | Caller should |
| --- | --- | --- |
| Book not installed / empty table | 200 `{ hymns: [] }` | Picker shows no rows; default setting is not rewritten (AD-26 inert) |

## Compatibility

Silently filtering by locale in `WHERE` is breaking (AD-26 / FR-24).

## Constraints

This API does not write the `hymns` table (AD-25).
