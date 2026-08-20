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
| 1 | Reset one still-live entry that still has a seed | That entry's layout returns to seed; other entries unchanged. Reset does not undelete (OQ-15, OQ-24). Song Set Title/Verse/Reff layouts are shared free canvases now, so there is no separate AD-22 override record beside them any more — Reset behaves on them exactly as it does on a General |
| 1 | Delete a Song Set entry | Delete is allowed; Hub's stored weekly values for that entry's `variable_name` stay stored and are inert (DEC-004 supersedes AD-19's fixed four-slot reading; the identity rule — server-owned, never a positional ordinal — still binds) |
| 1 | Add, remove, or reorder a Song Set entry or an ann-set marker on the main spine | Allowed like any other row; neither has a fixed count (FR-29, FR-21) |
| 1 | Reorder, add, or delete a General slide **inside** an Announcement Set | Allowed; happens only in the Registry, never on the Service form (BR-12) |
| 1 | Delete every remaining live entry | Allowed; a new Service's Deck has no slides from Registry (AD-17: N rows, including zero) |
| 1 | Copy a slide's image between Main and any Announcement Set | The binary is shared by reference, not duplicated; deleting the slide never deletes the image (BR-12) |

## Failure Flows

| From step | Failure | What the system does | What the user is left with |
| --- | --- | --- | --- |
| 2 | Save fails | Does not claim the new order | Old order remains after restart |
| 1 | Reset an id that is gone | Rejects; does not revive | Entry stays gone |
| 1 | Reset a live row with no seed | Rejects; Reset is not available (OQ-15) | Authored row unchanged |
| 1 | Delete an Announcement Set that a live `ann-set-marker` on the main spine still references | **Refused outright — never cascaded** (owner ruling, 2026-08-20) | Set and marker both unchanged; Admin removes the marker from the main artifact registry first, then deletes the set |

## Outcome

Live Registry = what Admin left in place. Delete is terminal (`gone`). Reset is live→live only on a still-live seed row; it does not undelete (OQ-15, OQ-24). Restart does not revive a deleted entry (BR-9). A new Service's Deck follows that order; an existing Service does not, until Sync (BR-8).

## Business Rules

BR-8 · BR-9 · BR-12
