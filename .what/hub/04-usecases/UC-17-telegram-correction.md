---
type: uc
id: UC-17
component: hub
satisfies: [FR-12]
critical: true
created: 2026-08-18
---

# UC-17 — Events correct one song via Telegram

## Trigger

Events send a correction to the same channel (for example, change the opening song number).

## Precondition

This use case realises **CAP-11 (last phase)**. This phase's create path is UC-2; Hub edit is UC-5.

Webhook is ready. Events name a date (or name the existing Service).

## Main Flow

1. Events send a correction command naming a date.
2. The system finds the Service for that named date.
3. The system applies the change to the existing payload.
4. The system returns a read-back.
5. The Operator sees the new fields in Hub.

## Alternate Flows

| From step | Condition | What happens |
| --- | --- | --- |
| 3 | New number is not in the Song Book | Change is saved; the block is marked incomplete |

## Failure Flows

| From step | Failure | What the system does | What the user is left with |
| --- | --- | --- | --- |
| 2 | No readable date, or named date with no Service | Rejects; not a new Service; does not fall back to nearest Sabbath (OQ-21, SCN-3) | Events must send a full Rundown (UC-1) or name a date that already has a Service |
| 1 | Secret is wrong | Rejects the send | Correction does not enter |
| 3 | Fails mid-write | Does not claim success | Resend is safe if the payload is the same |

## Outcome

The existing Service changes on one field, not a new row.

## Business Rules

BR-3
