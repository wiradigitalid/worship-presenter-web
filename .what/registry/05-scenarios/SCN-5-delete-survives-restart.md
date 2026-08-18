---
type: scn
id: SCN-5
component: registry
attaches_to: UC-15
created: 2026-08-18
---

# SCN-5 — Restart does not revive a deleted entry

## Where it branches

UC-15 step 3.

## Condition

The `web` process boots again after Admin deleted an entry.

## Flow

1. The seeder does not fill the gap (AD-17).
2. The plan is built only from rows still in the database.
3. The deleted entry does not appear in a new Service's Deck.

## Outcome

Delete stays deleted. Per-entry Reset remains the only way back to seed.

## Why it is not in the UC

This is a boot guarantee, not an Operator step on screen.
