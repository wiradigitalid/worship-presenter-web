---
type: uc
id: UC-16
component: registry
satisfies: [FR-21]
critical: false
created: 2026-08-18
---

# UC-16 — I Sync Artifact to a Service already reviewed

## Trigger

Admin chooses Sync Artifact on a Service.

## Precondition

Admin is signed in. The Service exists. Operator cannot run Sync.

## Main Flow

1. Admin requests Sync on that Service.
2. The system rejects if someone else already changed the Service underneath.
3. The system replaces the structure this Service renders with the live Registry.
4. Operator fields (song numbers, names, verses) remain.

## Alternate Flows

| From step | Condition | What happens |
| --- | --- | --- |
| 1 | Service was created before the Snapshot model | The first Sync is the on-ramp into that model (AD-16) |
| 3 | Live Registry dropped or added entries | Entered fields remain; unused ones stay stored and inert; new slots start empty. Announcement membership stays the Service's live list, not cloned from Registry (AD-16) |

## Failure Flows

| From step | Failure | What the system does | What the user is left with |
| --- | --- | --- | --- |
| 1 | Not Admin | Rejects | Service structure does not change |
| 2 | Save conflict | Rejects; Admin re-reads | Does not overwrite someone else's fields |

## Outcome

This Service renders the new structure. Weekly payload is not replaced by Sync.

## Business Rules

BR-10
