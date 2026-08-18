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
| Error handling | Shared envelope. Absent corpus is reported, not a 200 empty that pretends to be the book |
| Rate limiting | `none` — Operator session, one host; not a public API. |
| Idempotency | GET is safe |

## Error behaviour

| Condition | Response | Caller should |
| --- | --- | --- |
| Book not installed | visible error / list without that book | Pick another code; default setting is not rewritten |

## Compatibility

Silently filtering by locale in `WHERE` is breaking (AD-26 / FR-24).

## Constraints

This API does not write the `hymns` table (AD-25).
