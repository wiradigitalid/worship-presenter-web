---
type: scn
id: SCN-5
component: registry
attaches_to: UC-15
created: 2026-08-18
---

# SCN-5 — Restart does not revive a deleted entry

## Where it branches

After UC-15 step 2 (the membership is already saved). Restart is not an Admin screen step.

## Condition

The process starts again after Admin deleted an entry.

## Flow

1. The seeder does not fill the gap (AD-17). If it does, that is a defect, not behaviour.
2. The plan is built only from entries still live.
3. The deleted entry does not appear in a new Service's Deck.

## Outcome

Delete stays `gone`. Restart does not revive it (BR-9). Reset is live→live only on a still-live seed row; it does not undelete (OQ-15, OQ-24). A new Service's Deck follows remaining live entries; an existing Service does not change until Sync (BR-8).

## Why it is not in the UC

This is a restart branch, not a step Admin takes on screen.
