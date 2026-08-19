---
type: uc
id: UC-5
component: hub
satisfies: [FR-11]
critical: true
created: 2026-08-18
---

# UC-5 — I edit Service fields in Hub

## Trigger

The Operator opens an existing Service and changes fields (song numbers, names, verses, and the like).

## Precondition

The Operator is signed in. That Service exists.

## Main Flow

1. The Operator opens the Service fields.
2. The Operator changes one or more values.
3. The Operator saves.
4. The system accepts the save because the fields are still the last ones the Operator knew (BR-4). Generate (UC-6) is not this step (OQ-20).
5. The next generate uses the new values.

## Alternate Flows

| From step | Condition | What happens |
| --- | --- | --- |
| 2 | New hymn number is not in the Song Book | The Service is saved; the song block is marked incomplete (FR-2, BR-3) |

## Failure Flows

| From step | Failure | What the system does | What the user is left with |
| --- | --- | --- | --- |
| 3 | Someone else already saved first | Rejects; Operator must re-read (SCN-2) | On-screen fields do not overwrite silently (FR-28, BR-4) |
| 3 | After that reject, the Service is gone on re-read | Treats as UC-7 not-found; does not create a replacement (OQ-23, SCN-2) | List already lacks that row |
| 3 | Session expired | Rejects; no partial write (OQ-23) | Operator signs in again; on-screen fields are not stored |
| 1 | Session expired or account deleted | No fields shown | Operator signs in again; server data intact |

## Outcome

This Service's weekly payload matches the last save that won.

## Business Rules

BR-4
