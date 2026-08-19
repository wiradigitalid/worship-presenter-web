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

This use case realises **CAP-11 (last phase)**. This phase's create path is UC-2.

Webhook channel is ready. Song Book is shipped.

## Main Flow

1. Events send a Rundown for one date (text, and images if any).
2. The system interprets the text into a weekly payload.
3. The system resolves hymn numbers against the Song Book.
4. The system attaches any images, or the attach fails visibly — images are not dropped in silence (OQ-22).
5. The system saves or updates the one Service for that date.
6. The system returns a read-back of hymn titles to the same channel.
7. The Operator sees that Service in the Hub list.

## Alternate Flows

| From step | Condition | What happens |
| --- | --- | --- |
| 3 | Hymn number is unknown | Service is still saved; the song block is marked incomplete; the read-back names the failure |
| 5 | That date already exists | The existing Service is updated, not duplicated (OQ-8) |

## Failure Flows

| From step | Failure | What the system does | What the user is left with |
| --- | --- | --- | --- |
| 1 | Webhook secret is absent or wrong | Rejects the send | Rundown does not enter; Events do not see a new Service |
| 2 | No readable date | Rejects; no Service row (OQ-21) | Events see the miss; Operator sees no new row |
| 2 | Text is not parseable, but a date was read | Saves what was readable; the failure is visible (NFR-5) | Operator sees an incomplete Service, not silence |
| 4 | An image cannot be attached | Fails visibly; that image is not omitted in silence (OQ-22) | Events see the miss; photos are not quietly absent |
| 5 | Fails mid-write | Does not claim success | Events can resend; no silent duplicate Service |

## Outcome

Later (CAP-11): one dated Service holds that week's payload. Events need not open Hub.

## Business Rules

BR-3
