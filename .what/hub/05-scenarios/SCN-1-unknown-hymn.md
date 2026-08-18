---
type: scn
id: SCN-1
component: hub
attaches_to: UC-1
created: 2026-08-18
---

# SCN-1 — Hymn number is not in the Song Book

## Where it branches

UC-1 step 3.

## Condition

Events send a number that is not in the shipped book.

## Flow

1. The system still saves the Service.
2. That song block is marked incomplete.
3. The read-back to chat names the failed title / failed number, not silence.

## Outcome

The Service exists; the Operator sees the gap in Hub before Friday. The Service is not rejected as a whole.

## Why it is not in the UC

A partial-success branch that happens most weeks; spelling out the read-back would fatten the main flow.
