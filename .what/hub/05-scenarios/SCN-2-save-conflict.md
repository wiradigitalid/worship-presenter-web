---
type: scn
id: SCN-2
component: hub
attaches_to: UC-5
created: 2026-08-18
updated: 2026-08-19
---

# SCN-2 — Save is rejected because someone else already saved

## Where it branches

UC-5 step 3.

## Condition

The Operator saves with a time precondition that is no longer the latest on the server (FR-28, BR-4). Generate is not this path (OQ-20).

## Flow

1. The system rejects the save.
2. The Operator re-reads the latest fields.
3. If that Service is gone on re-read, this is UC-7 not-found: the system does not create a replacement (OQ-23).
4. Otherwise the Operator merges their own change, then saves again.
5. If the session expired at save, the system rejects with no partial write (OQ-23); the Operator signs in and starts from a fresh read.

## Outcome

No silent overwrite. The first save that arrived still wins. A deleted Service is not recreated from a stale form.

## Why it is not in the UC

The recovery after a rejected save is longer than the eight-step UC.
