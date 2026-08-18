---
type: lc
id: LC-16
name: Slide plan builder
lc_type: service
container: web
component: hub
created: 2026-08-18
---

# LC-16 — Slide plan builder

## Responsibility

Single source of order and hydrated layout (AD-7, AD-12). Used by preview, PPTX, Presenter.

## Depends on

LC-15 (read templates) logically; code `buildSlidePlan`.

## Interface

Plan AST. Renderer does not look up Registry.

## Notes

Registered on Hub because Hub generate/preview is the on-request write-time caller. Presenter only consumes.
