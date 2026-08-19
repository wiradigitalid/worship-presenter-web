---
type: lc
id: LC-15
name: Registry store
lc_type: service
container: web
component: registry
created: 2026-08-18
---

# LC-15 — Registry store

## Responsibility

Read/write `artifact_templates`, Reset, delete, whole-list reorder, `position` compact, AD-15 validation. Service-bound freeze clone lives in `src/lib/registry/service-snapshot.ts` (same store boundary; Hub LC-2 calls it).

## Depends on

SQLite in `web`. LC-11 calls this; this does not call LC-11.

## Interface

`src/lib/registry/store.ts`. The plan (LC-16) reads the result, not the Admin API.

## Notes

Seed is bootstrap + Reset only (AD-17). `position` is persisted and asserted contiguous after every delete and reorder. Reset updates a still-live row; it is not undelete (OQ-24).
