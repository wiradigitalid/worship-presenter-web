---
type: inventory
kind: db
scope: _platform
status: draft
created: '2026-08-18'
updated: '2026-08-18'
derived_from: code
verified: ''
---

# Inventory — tables

Derived from `src/lib/db/index.ts` (SQLite DDL in the same process). `inventory.py` reads Go migrations / standalone `CREATE TABLE` SQL — **a mismatch** with this repo. Findings below.

## Rows

| No | Table | Owning component | What it holds | Key columns | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | services | hub | One dated Service and the week's payload | id, date | published |
| 2 | hymns | hub | Song Book entries | number, book | published |
| 3 | announcement_items | hub | Announcement list | id, order | published |
| 4 | accounts | hub | Per-person accounts | id, username | published |
| 5 | login_attempts | hub | Login trail | — | published |
| 6 | revoked_sessions | hub | Revoked sessions | sid | published |
| 7 | settings | hub | Application settings | key | published |
| 8 | bible_translations | presenter | Translation corpora | code, locale | published |
| 9 | bible_books | presenter | Book names per translation | — | published |
| 10 | bible_verses | presenter | Verse text | — | published |
| 11 | artifact_templates | registry | Slide order and layout | id, order | published |
| 12 | hymns_with_book_code | hub | View/shape hymn + book code | — | published |
| 13 | bible_verses_with_translation_code | presenter | View/shape verse + translation code | — | published |

## Findings

- `inventory.py` does not derive these rows: its pattern is Gin + SQL migrations + React Router, while live code is Next.js App Router and DDL in TypeScript. This inventory is read from `src/lib/db/index.ts`, not from the script.
- The per-Service Registry snapshot (AD-16) **does not yet** have a table. `ServiceRegistrySnapshot` in Registry `owns` is a promise; the code assembles a live map per plan build (`src/lib/artifacts/registry-snapshot.ts`). See SDD Registry, label `[MISSING]`.
