---
type: scn
id: SCN-1
component: hub
attaches_to: [UC-2, UC-1]
created: 2026-08-18
updated: 2026-08-19
---

# SCN-1 — Hymn number is not in the Song Book

## Where it branches

UC-2 step 3 (this phase). UC-1 step 3 (CAP-11 later).

## Condition

A hymn number is not in the shipped book. This phase it can come from the Operator Hub form (UC-2), not only from Events.

## Flow

1. The system still saves the Service.
2. That song block is marked incomplete.
3. This phase: the Operator sees the gap in Hub. Later (UC-1, CAP-11): the read-back to chat names the failed title / failed number, not silence.

## Outcome

The Service exists; the Operator sees the gap in Hub before Friday. The Service is not rejected as a whole.

## Why it is not in the UC

A partial-success branch that happens most weeks; spelling out the Hub gap and the later chat read-back would fatten the main flow.
