---
title: "Addendum: Worship Presenter Web"
status: draft
created: 2026-08-18
updated: 2026-08-19
note: "Detail that does not fit the 1–2 page brief. Technical constraints and path references only."
---

# Addendum

## Source material

DEC-001 retired the pre-method archive. Live promises sit in the three area PRDs and `requirements.yaml`. Deck frame: `.what/registry/03-domain/deck-frame.md`. Spine: `.how/_platform/ARCHITECTURE-SPINE.md`. Old → new IDs: `.what/_prd/operator-turn/addendum.md`.

## Technical constraints (they only shape implementation)

Owner direction, 2026-08-18, for the *next* architecture — not a G1 problem:

- The production API is a **Go** process that stays up.
- The Operator UI and projector are a **React SPA** (not Next.js in live).
- **Node is installed** on the host, but **not** as a 24/7 server. PptxGenJS runs as a child process when the Operator downloads PPTX, then exits.
- The slide plan is assembled on the Go server; the Node worker only draws an already-finished plan. The worker does not open SQLite.
- SQLite remains one process / one file.
- Today's Next.js is as-built, not the shape this brief locks.

This becomes `AD-N` in the spine at G3, not a Constraints row in the brief.

## What has already shipped (context, not a new promise)

The as-built in `src/` already covers Hub, webhook, PPTX generate, slideshow, presenter/projector, scripture, Song Book, canvas registry, dark mode. This brief **locks why the product exists**, not a catalogue of features already coded. Features still in backlog (registry authoring Epic 20, concurrency, etc.) are handled by PRD/wave, not here.
