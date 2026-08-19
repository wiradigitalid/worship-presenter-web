---
type: uc
id: UC-7
component: hub
satisfies: [FR-10]
critical: true
created: 2026-08-18
---

# UC-7 — I delete this Service and its assets

## Trigger

The Operator chooses delete on a Service.

## Precondition

The Operator is signed in. That Service exists.

## Main Flow

1. The Operator requests delete of that dated Service.
2. The system deletes the Service, one-off announcement items, and local image files bound only to that Service.
3. The system leaves recurring announcement items (and their files).
4. The Service disappears from the list.

## Alternate Flows

None.

## Failure Flows

| From step | Failure | What the system does | What the user is left with |
| --- | --- | --- | --- |
| 1 | Session expired | Rejects; no partial write (OQ-23) | Operator signs in again; the Service is still there |
| 1 | Service is already gone | Reports not found | List already lacks that row |
| 2 | Delete fails mid-way | Does not claim success | Operator tries again; no promise of a hidden half-delete |

## Outcome

That Service cannot be opened again. That week's local photo and flyer files that belonged only to it are gone. The recurring announcement list remains for other weeks.

## Business Rules

BR-5
