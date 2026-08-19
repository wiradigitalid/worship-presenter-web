---
type: contract
component: hub
lc: LC-8
direction: exposed
created: 2026-08-18
updated: 2026-08-19
---

# Contract — Webhook

## Source of truth

`none`. `internal/httpapi`. Call shape: picoclaw skill (not copied here).

## Purpose

Later CAP-11: UC-1, UC-17. As-built JSON agnostic of Telegram (AD-3). Not this phase's create path (that is UC-2).

## Operations

| Operation | Purpose | Realizes |
| --- | --- | --- |
| POST `/api/webhook` rundown | Upsert Service by date | UC-1 — CAP-11 later |
| POST `/api/webhook` `action: correct` | Correct an existing Service | UC-17 — CAP-11 later |
| POST `/api/webhook` other `action` | If `text` present: rundown. Else 400 | — |

## Five lanes

| Lane | Answer |
| --- | --- |
| Authentication | `WEBHOOK_SECRET` only; 503 unset, 401 wrong (AD-5). Not a cookie. |
| Validation | If `action === 'correct'` → correction. Else require rundown `text` or 400. Specified: no readable date → no insert (OQ-21). `announcements` URL array or absent. ISO date if present. |
| Error handling | Shared envelope. 400 JSON/text. Specified: no date → no row (OQ-21). Partial parse **with** a date → 200 with failed hymn numbers (NFR-5), not a silent 500. Images: attach or fail visibly (OQ-22) — as-built still filters silently ([MISSING] in SDD Evidence). |
| Rate limiting | `none` on Hub — picoclaw is the caller. Not a public internet API without the secret. |
| Idempotency | POST same date updates (OQ-8). Correction to a missing Service does not create a new row and does not fall back to nearest Sabbath (SCN-3, OQ-21). |

## Error behaviour

| Condition | Response | Caller should |
| --- | --- | --- |
| Secret unset | 503 | Set the host env |
| Wrong secret | 401 | Match the secret |
| No readable date on rundown | specified: no insert (OQ-21) | Send a dated Rundown. As-built still inserts via `localIsoDate()` — SDD Evidence, OQ-27 |
| Correction without a target | visible error; no nearest-Sabbath fallback (OQ-21) | Send a full rundown (UC-1) or name a date that has a Service |
| Image URL unsafe / unusable | specified: fail visibly (OQ-22) | Do not drop in silence. As-built `coerceImageUrls` filters — SDD Evidence, OQ-27 |
| `action` set and not `correct`, and no rundown `text` | 400 | Send a rundown or `action: correct` |
| Hymn number failed | 200 + `failedHymnNumbers` | SCN-1 |

## Compatibility

Binding layout/slot fields to webhook JSON is breaking AD-3.

## Constraints

Timeout is on the caller side. No retry on Hub. See `.how/hub/03-integrations/picoclaw.md`.
