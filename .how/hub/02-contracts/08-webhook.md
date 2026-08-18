---
type: contract
component: hub
lc: LC-8
direction: exposed
created: 2026-08-18
updated: 2026-08-18
---

# Contract — Webhook

## Source of truth

`none`. `src/app/api/webhook/route.ts`. Call shape: picoclaw skill (not copied here).

## Purpose

UC-1, UC-17. JSON agnostic of Telegram (AD-3).

## Operations

| Operation | Purpose | Realizes |
| --- | --- | --- |
| POST `/api/webhook` rundown | Upsert Service by date | UC-1 |
| POST `/api/webhook` `action: correct` | Correct an existing Service | UC-17 |

## Five lanes

| Lane | Answer |
| --- | --- |
| Authentication | `WEBHOOK_SECRET` only; 503 unset, 401 wrong (AD-5). Not a cookie. |
| Validation | `text` string required for rundown; `announcements` URL array or absent; ISO date if present |
| Error handling | Shared envelope. 400 JSON/text; partial parse → 200 with failed hymn numbers (NFR-5), not a silent 500 |
| Rate limiting | `none` on Hub — picoclaw is the caller. Not a public internet API without the secret. |
| Idempotency | POST same date updates. Correction to a missing Service does not create a new row (SCN-3). |

## Error behaviour

| Condition | Response | Caller should |
| --- | --- | --- |
| Secret unset | 503 | Set the host env |
| Wrong secret | 401 | Match the secret |
| Correction without a target | visible error | Send a full rundown |
| Hymn number failed | 200 + `failedHymnNumbers` | SCN-1 |

## Compatibility

Binding layout/slot fields to webhook JSON is breaking AD-3.

## Constraints

Timeout is on the caller side. No retry on Hub. See `.how/hub/03-integrations/picoclaw.md`.
