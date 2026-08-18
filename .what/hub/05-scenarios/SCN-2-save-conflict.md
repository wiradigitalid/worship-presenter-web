---
type: scn
id: SCN-2
component: hub
attaches_to: UC-5
created: 2026-08-18
---

# SCN-2 — Save is rejected because someone else already saved

## Where it branches

UC-5 step 3.

## Condition

The Operator saves with a time precondition that is no longer the latest on the server (FR-28).

## Flow

1. The system rejects the save.
2. The Operator re-reads the latest fields.
3. The Operator merges their own change, then saves again.

## Outcome

No silent overwrite. The first save that arrived still wins.

## Why it is not in the UC

The recovery flow after a 409 is longer than the eight-step UC.
