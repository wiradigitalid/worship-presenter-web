---
type: contract
component: hub
lc: LC-2
direction: exposed
created: 2026-08-18
updated: 2026-08-19
---

# Contract — Services

## Source of truth

`none`. `src/app/api/services/**/route.ts`, `src/lib/services/*`.

## Purpose

UC-2, UC-3, UC-5, UC-6, UC-7, UC-8, UC-18, UC-23.

## Operations

| Operation | Purpose | Realizes |
| --- | --- | --- |
| GET `/api/services` | List | UC-3 |
| POST `/api/services` | Create from rundown/form | UC-2 |
| PUT `/api/services/[id]` | Update | UC-5 · UC-23 |
| DELETE `/api/services/[id]` | Delete the row + that week's local files | UC-7 |
| GET `/api/services/[id]/pptx` | Generate on download | UC-6 · UC-18 |
| POST `/api/services/preview` | Preview plan | UC-8 |

## Five lanes

| Lane | Answer |
| --- | --- |
| Authentication | Operator/Admin session (AD-5). Without a session: the gate refuses before the route. |
| Validation | Service id integer; PUT requires the client's `updated_at` (AD-6). GET pptx and POST preview do not take `updated_at` (OQ-20). POST create requires a readable date (OQ-21). |
| Error handling | Envelope in `cross-cutting.md`. 409 stale (UC-5 only). 404 missing (UC-7 not-found; do not recreate, OQ-23). 400 id/body / no date. 401 gate: session expiry, no partial write (OQ-23). 500 PPTX generate. |
| Rate limiting | `none` — one congregation, home PC; not a public API. |
| Idempotency | GET list is safe. GET pptx / POST preview generate a Deck/plan and do **not** edit the Service payload (OQ-20, UC-6). DELETE again → 404. POST same date without override → 409 + `existingId` (UC-2, OQ-8); with explicit override a second row is inserted — not an upsert. Webhook upsert is CAP-11 (`08-webhook.md`). Stale PUT does not write. |

## Error behaviour

| Condition | Response | Caller should |
| --- | --- | --- |
| Stale `updated_at` | 409 | RSC again, merge, PUT again (SCN-2) |
| Service gone on PUT | 404 | Treat as UC-7; do not POST a replacement (OQ-23) |
| Date already exists, no override | 409 + `existingId` | Open the existing Service, or confirm a second row |
| No date / empty Rundown | 400 | Fix the paste; no row (OQ-21) |
| Unparseable body with a date | 201 + `failedHymnNumbers` | Show the miss; Service exists (NFR-5, OQ-22) |
| Session expired on PUT/DELETE | 401 from `src/proxy.ts` | Sign in; no partial write (OQ-23) |
| Not found | 404 | Refresh the list |
| Plan/PPTX failed | 500 | Retry; Sabbath uses the old file if one exists |

## Compatibility

Removing `updated_at` from PUT is breaking (AD-6). Changing the parsed payload shape is breaking for the Hub form.

## Constraints

PPTX generate (GET) may be slow; it does not bump `services.updated_at` (OQ-20). No `maxDuration` in the route [ASSUMED] Node default. A future Node worker (brief addendum) is not this contract.
