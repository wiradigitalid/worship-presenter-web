---
type: uc
id: UC-2
component: hub
satisfies: [FR-27, FR-2]
critical: true
created: 2026-08-18
---

# UC-2 — I paste a Rundown in Hub and a new Service is saved

## Trigger

The Operator opens the create-Service form and pastes Rundown text.

## Precondition

This is **this phase's** create path. The Operator is signed in. Song Book is shipped.

## Main Flow

1. The Operator pastes a Rundown for one date.
2. The system interprets the text into a weekly payload.
3. The system resolves hymn numbers against the Song Book.
4. The system saves a new Service for that date.
5. The Operator sees that Service in the list.

## Alternate Flows

| From step | Condition | What happens |
| --- | --- | --- |
| 3 | Number is unknown | Service is saved; the song block is marked incomplete |
| 4 | Date already exists | Not duplicated without override; the Operator sees the existing Service. After an explicit override, a second Service for that date is saved |

## Failure Flows

| From step | Failure | What the system does | What the user is left with |
| --- | --- | --- | --- |
| 2 | Text is not parseable | Failure is visible (NFR-5) | Form does not claim silent success |
| 2 | Empty or whitespace-only paste, or no date can be read | Rejects; no row | Form shows the miss; no Service |
| 1 | Session expired | Rejects | Operator signs in again; no new Service |

## Outcome

One dated Service from the Hub form, without Telegram.

## Business Rules

BR-3
