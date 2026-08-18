---
type: lc
id: LC-12
name: Hub rundown parse and service write
lc_type: service
container: web
component: hub
created: 2026-08-18
---

# LC-12 — Hub rundown parse and service write

## Responsibility

Interpret the Rundown, resolve hymns, write `services` rows (create, date upsert, correction, edit with `updated_at`). Delete Service: cascade one-off + unlink unreferenced local uploads.

## Depends on

LC-8 (webhook in) · LC-2 (Hub HTTP) · LC-7 (Song Book)

## Interface

`parseRundown` + `updateService` / insert. Not slide order.

## Notes

As-built: `src/lib/parser.ts`, `src/lib/services/update-service.ts`.
