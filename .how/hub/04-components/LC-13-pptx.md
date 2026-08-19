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

As-built until cutover: `src/lib/pptx.ts` in the Next.js process. Target (DEC-003 / AD-30): Node child that receives a finished plan from the Go API, draws PPTX, exits. MUST NOT open SQLite.
