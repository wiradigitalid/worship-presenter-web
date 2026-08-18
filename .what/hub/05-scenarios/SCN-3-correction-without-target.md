---
type: scn
id: SCN-3
component: hub
attaches_to: UC-17
created: 2026-08-18
---

# SCN-3 — Telegram correction without a target Service

## Where it branches

UC-17 step 2.

## Condition

No matching date and no nearest Sabbath Service.

## Flow

1. The system does not create a new Service from a correction command.
2. The caller gets a visible failure.
3. Events send a full Rundown (UC-1) or the Operator pastes in Hub (UC-2).

## Outcome

No empty Service row from a correction.

## Why it is not in the UC

This exits to another UC; folding it into UC-17 mixes two jobs.
