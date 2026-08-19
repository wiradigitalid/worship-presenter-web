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

Read/write `artifact_templates`, Reset, `position` order, AD-15 validation.

## Depends on

SQLite in `web`. LC-11 calls this; this does not call LC-11.

## Interface

`src/lib/registry/store.ts`. The plan (LC-16) reads the result, not the Admin API.

## Notes

Seed is bootstrap + Reset only (AD-17). `position` is persisted and asserted contiguous. Admin delete and reorder functions are [MISSING] (FR-21 / UC-15).
