---
title: "Addendum: Worship Presenter Web"
status: draft
created: 2026-08-18
updated: 2026-08-19
note: "Detail that does not fit the 1–2 page brief. Technical constraints and path references only."
---

# Addendum

## Source material

DEC-001 retired the pre-method archive as live authority. DEC-002: each closed G5 wave deletes the `_bmad-output/prior-knowledge/` slice it names. Owner direction 2026-08-19 recut intake: Hub first, Telegram+picoclaw last. Live promises sit in the area PRDs and `requirements.yaml`. Deck frame: `.what/registry/03-domain/deck-frame.md`. Spine: `.how/_platform/ARCHITECTURE-SPINE.md`. Old → new IDs: `.what/_prd/operator-turn/addendum.md`.

## Intake phasing (owner, 2026-08-19)

- **Now:** Operator (multimedia) logs into Hub and enters the Rundown. Events are skipped this phase.
- **Last:** Telegram via picoclaw. Ideal channel; deferred because web is cheaper and easier to stabilize first.
- PicoCloud in that conversation **is** picoclaw.

A separate Telegram PRD was considered and not opened: `FR-N` MUST NOT move between PRDs, and a reader looking for “how a Rundown becomes a Service” still opens `rundown-to-service`. Telegram stays there as a later capability (`CAP-11`).

## Technical constraints (they only shape implementation)

Owner direction, 2026-08-18, locked by **DEC-003** (2026-08-19):

- The production API is a **Go** process that stays up.
- The Operator UI and projector are a **React SPA** (not Next.js in live).
- **Node is installed** on the host, but **not** as a 24/7 server. PptxGenJS runs as a child process when the Operator downloads PPTX, then exits.
- The slide plan is assembled on the Go server; the Node worker only draws an already-finished plan. The worker does not open SQLite.
- SQLite remains one process / one file (the Go API).
- AD-30 is the living rule; AD-2 / AD-4 / AD-5 / AD-9 / AD-24 were amended in the same apply. The Next.js as-built in `src/` remains until the cutover wave ships.

## What has already shipped (context, not a new promise)

The as-built in `src/` already covers Hub, a Telegram webhook, PPTX generate, slideshow, presenter/projector, scripture, Song Book, canvas registry, dark mode. This brief **locks why the product exists**, not a catalogue of features already coded. The webhook existing in code does not make Telegram this phase's promise.
