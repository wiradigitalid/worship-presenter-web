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

Webhook is ready. There is a nearest Sabbath Service, or a named date.

## Main Flow

1. Events send a correction command.
2. The system finds the target Service (named date, or nearest Sabbath).
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
| 2 | Service not found | Rejects; not a new Service | Events must send a full Rundown or name a date |
| 1 | Secret is wrong | 401 | Correction does not enter |
| 3 | Fails mid-write | Does not claim success | Resend is safe if the payload is the same |

## Outcome

The existing Service changes on one field, not a new row.

## Business Rules

BR-3 · BR-4
