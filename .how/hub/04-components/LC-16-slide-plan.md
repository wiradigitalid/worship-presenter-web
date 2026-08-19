---
type: lc
id: LC-16
name: Slide plan builder
lc_type: service
container: api
component: hub
created: 2026-08-18
---

# LC-16 — Slide plan builder

## Responsibility

Single source of order and hydrated layout (AD-7, AD-12). Used by preview, PPTX, Presenter. A persisted Service reads `service_registry_snapshots`; preview (no Service) still reads the live registry.

## Depends on

LC-15 (read templates) logically; code `buildSlidePlan`.

## Interface

Plan AST. Renderer does not look up Registry.

Lyric slides (FR-5, BR-6): `src/lib/lyrics.ts`. Verse lines join into continuous prose — terminal punctuation (`. , ! ? ; :`) then space, otherwise `"; "`. Budget `CONTINUOUS_CHAR_BUDGET = 320`; long text splits preferring `"; "` and sentence ends. A song with ≥1 verse and ≥1 refrain always emits Verse→Chorus after every verse. Verse-only or refrain-only: `expandTrailingRefrain` returns the sections unchanged. `skipTitle` is gone (AD-20).

## Notes

Registered on Hub because Hub generate/preview is the on-request write-time caller. Presenter only consumes.
