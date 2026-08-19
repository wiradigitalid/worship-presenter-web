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

Interpret the Rundown, resolve hymns, write `services` rows (Hub create with date-collision 409 unless explicit second row; webhook date upsert later CAP-11; correction; edit with `updated_at`). Hub create refuses when no date is readable (OQ-21). Generate is not this LC (OQ-20). Delete Service: cascade one-off + unlink unreferenced local uploads.

## Depends on

LC-7 (Song Book)

## Called from

LC-2 (Hub HTTP, this phase) · LC-8 (webhook in, CAP-11 later)

## Interface

`parseRundown` + `updateService` / insert. Not slide order.

## Notes

As-built: `src/lib/parser.ts`, `src/lib/services/create-service.ts`, `src/lib/services/update-service.ts`. Webhook rundown still falls back to `localIsoDate()` when the parse has no date — specified OQ-21 forbids that (SDD Evidence, OQ-27).
