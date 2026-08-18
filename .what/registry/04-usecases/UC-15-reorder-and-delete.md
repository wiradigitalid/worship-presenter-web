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
3. Restart does not revive a deleted entry.
4. A new Service's Deck follows that order; an old Service does not, until Sync.

## Alternate Flows

| From step | Condition | What happens |
| --- | --- | --- |
| 1 | Reset one entry to seed | Only that entry recovers from seed; deleted ones stay gone |

## Failure Flows

| From step | Failure | What the system does | What the user is left with |
| --- | --- | --- | --- |
| 2 | Save fails | Does not claim the new order | Old order remains after restart |
| 3 | Seeder fills the gap | Forbidden (AD-17) | If it happens, that is a defect, not behaviour |

## Outcome

Live Registry = what Admin left in place. Delete is irreversible except Reset per entry that still has a seed.

## Business Rules

BR-9
