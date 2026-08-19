---
type: scn
id: SCN-3
component: hub
attaches_to: UC-17
created: 2026-08-18
updated: 2026-08-19
---

# SCN-3 — Telegram correction without a target Service

Telegram correction (UC-17) is **CAP-11 later**. This phase's recovery is Operator Hub create or edit (UC-2 · UC-5).

## Where it branches

UC-17 step 2 (CAP-11 later).

## Condition

No readable date, or a named date with no Service. The system does not fall back to nearest Sabbath (OQ-12, OQ-21).

## Flow

1. The system does not create a new Service from a correction command.
2. The caller gets a visible failure.
3. This phase: the Operator creates or edits in Hub (UC-2 / UC-5). Later (CAP-11): Events send a full Rundown (UC-1) for that date.

## Outcome

No empty Service row from a correction.

## Why it is not in the UC

This exits to another UC; folding it into UC-17 mixes two jobs.
