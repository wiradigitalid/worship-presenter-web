---
type: inventory
kind: db
scope: _platform
status: draft
created: '2026-08-18'
updated: '2026-08-19'
derived_from: code
verified: '96dfd61'
---

# Inventory — tables

Derived by `inventory.py` from `CREATE TABLE IF NOT EXISTS` in `src/lib/db/index.ts`. Numbers are stable; new rows take the next number. Numbers 12–13 were never live tables (one-shot rebuild names) and MUST NOT be reused.

## Rows

| No | Table | Owning component | What it holds | Key columns | Status |
| --- | --- | --- | --- | --- | --- |
| 4 | accounts | hub | Per-person accounts | id | published |
| 3 | announcement_items | hub | Announcement list | id | published |
| 11 | artifact_templates | registry | Slide order and layout | id | published |
| 9 | bible_books | presenter | Book names per translation | id | published |
| 8 | bible_translations | presenter | Translation corpora | code | published |
| 10 | bible_verses | presenter | Verse text | id, book_id, chapter, verse, translation_code | published |
| 2 | hymns | hub | Song Book entries | id, book_code, number | published |
| 5 | login_attempts | hub | Login trail | id | published |
| 6 | revoked_sessions | hub | Revoked sessions | sid | published |
| 14 | service_registry_snapshots | registry | Per-Service frozen registry clone (AD-16) | service_id, template_id | published |
| 1 | services | hub | One dated Service and the week's payload | id | published |
| 7 | settings | hub | Application settings | key | published |

## Findings

- Rows 12 (`hymns_with_book_code`) and 13 (`bible_verses_with_translation_code`) were catalogued as live tables. They are one-shot rebuild names in the same DDL file, then `RENAME TO` the live tables. Dropped from the rows; those numbers MUST NOT be reused. W1's freeze table is therefore **14**.
- `service_registry_snapshots` is Registry-owned (AD-16). `services.registry_snapshot_at` is a Hub column on table 1, not a separate table.
