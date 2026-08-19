---
type: uc
id: UC-15
component: registry
satisfies: [FR-21]
critical: true
created: 2026-08-18
---

# UC-15 — I change slide order and a delete stays deleted

## Trigger

Admin deletes or reorders Artifact Registry entries.

## Precondition

Admin is signed in.

## Main Flow

1. Admin deletes or moves an entry's position.
2. The system saves the new order and membership.

## Alternate Flows

| From step | Condition | What happens |
| --- | --- | --- |
| 1 | Reset one still-live entry that still has a seed | That entry's layout returns to seed; other entries unchanged. Override record (backgrounds, fonts) remains; Reset does not clear it (AD-22). Reset does not undelete (OQ-15, OQ-24) |
| 1 | Delete a SongSet slot row | Delete is allowed; Hub hymn binding for that slot stays stored and is inert (AD-19) |
| 1 | Delete every remaining live entry | Allowed; a new Service's Deck has no slides from Registry (AD-17: N rows, including zero) |

## Failure Flows

| From step | Failure | What the system does | What the user is left with |
| --- | --- | --- | --- |
| 2 | Save fails | Does not claim the new order | Old order remains after restart |
| 1 | Reset an id that is gone | Rejects; does not revive | Entry stays gone |
| 1 | Reset a live row with no seed | Rejects; Reset is not available (OQ-15) | Authored row unchanged |

## Outcome

Live Registry = what Admin left in place. Delete is terminal (`gone`). Reset is live→live only on a still-live seed row; it does not undelete (OQ-15, OQ-24). Restart does not revive a deleted entry (BR-9). A new Service's Deck follows that order; an existing Service does not, until Sync (BR-8).

## Business Rules

BR-8 · BR-9
