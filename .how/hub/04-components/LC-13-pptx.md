---
type: lc
id: LC-13
name: Hub PPTX generate
lc_type: job
container: pptx-worker
component: hub
created: 2026-08-18
---

# LC-13 — Hub PPTX generate

## Responsibility

Draw the plan into PPTX on-demand at download (UC-6 / UC-18). Does not invent order itself. Does not edit the Service payload and does not take `updated_at` (OQ-20, BR-4).

## Depends on

LC-16 (plan) · LC-4 (images)

## Interface

GET pptx → OpenXML file.

## Notes

As-built (DEC-003 / AD-30): Node child exec'd by the Go API from `src/lib/pptx.ts` / `workers/pptx/`. Receives a finished plan, draws PPTX, exits. MUST NOT open SQLite.
