---
type: lc
id: LC-13
name: Hub PPTX generate
lc_type: job
container: web
component: hub
created: 2026-08-18
---

# LC-13 — Hub PPTX generate

## Responsibility

Draw the plan into PPTX on-demand at download. Does not invent order itself.

## Depends on

LC-16 (plan) · LC-4 (images)

## Interface

GET pptx → OpenXML file.

## Notes

As-built: `src/lib/pptx.ts` in the `web` process. A separate Node worker = brief addendum, not this LC.
