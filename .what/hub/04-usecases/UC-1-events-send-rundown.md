---
type: uc
id: UC-1
component: hub
satisfies: [FR-1, FR-2]
critical: true
created: 2026-08-18
---

# UC-1 — Events send a Rundown on Telegram and its Service appears

## Trigger

Events paste a Rundown (text, and images if any) into the Telegram channel picoclaw reads.

## Precondition

Webhook channel is ready. Song Book is shipped.

## Main Flow

1. Events send a Rundown for one date.
2. The system interprets the text into a weekly payload.
3. The system resolves hymn numbers against the Song Book.
4. The system saves or updates the one Service for that date.
5. The system returns a read-back of hymn titles to the same channel.
6. The Operator sees that Service in the Hub list.

## Alternate Flows

| From step | Condition | What happens |
| --- | --- | --- |
| 3 | Hymn number is unknown | Service is still saved; the song block is marked incomplete; the read-back names the failure |
| 4 | That date already exists | The existing Service is updated, not duplicated |

## Failure Flows

| From step | Failure | What the system does | What the user is left with |
| --- | --- | --- | --- |
| 1 | Webhook secret is absent or wrong | Rejects the send | Rundown does not enter; Events do not see a new Service |
| 2 | Text is not parseable | Saves what was readable; the failure is visible (NFR-5) | Operator sees an incomplete Service, not silence |
| 4 | Fails mid-write | Does not claim success | Events can resend; no silent duplicate Service |

## Outcome

One dated Service holds that week's payload. Events need not open Hub.

## Business Rules

BR-3
