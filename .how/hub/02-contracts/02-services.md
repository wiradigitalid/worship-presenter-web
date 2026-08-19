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

`none`. `internal/httpapi`, `src/lib/services/*`.

## Purpose

UC-2, UC-3, UC-5, UC-6, UC-7, UC-8, UC-16, UC-18, UC-23.

## Operations

| Operation | Purpose | Realizes |
| --- | --- | --- |
| GET `/api/services` | List | UC-3 |
| POST `/api/services` | Create from rundown/form; clones the live registry into a service-bound snapshot (AD-16) | UC-2 |
| PUT `/api/services/[id]` | Update | UC-5 · UC-23 |
| DELETE `/api/services/[id]` | Delete the row + that week's local files | UC-7 |
| GET `/api/services/[id]/pptx` | Generate on download | UC-6 · UC-18 |
| POST `/api/services/preview` | Preview plan from the **live** registry (no Service id) | UC-8 |
| POST `/api/services/[id]/sync-artifact` | Admin-only destructive re-clone of the live registry onto that Service (AD-16) | UC-16 (OQ-B) |

## Five lanes

| Lane | Answer |
| --- | --- |
| Authentication | Operator/Admin session (AD-5). Without a session: the gate refuses before the route. Sync Artifact re-checks Admin in-route (`requireAdminSession`); Operator → 403. |
| Validation | Service id integer; PUT and POST sync-artifact require the client's `updated_at` (AD-6). GET pptx and POST preview do not take `updated_at` (OQ-20). POST create requires a readable date (OQ-21). |
| Error handling | Envelope in `cross-cutting.md`. 409 stale (UC-5 and UC-16). 404 missing (UC-7 not-found; do not recreate, OQ-23). 400 id/body / no date / missing sync token. 401 gate: session expiry, no partial write (OQ-23). 403 Operator on sync. 500 PPTX generate. |
| Rate limiting | `none` — one congregation, home PC; not a public API. |
| Idempotency | GET list is safe. GET pptx / POST preview generate a Deck/plan and do **not** edit the Service payload (OQ-20, UC-6). DELETE again → 404. POST same date without override → 409 + `existingId` (UC-2, OQ-8); with explicit override a second row is inserted — not an upsert. Webhook upsert is CAP-11 (`08-webhook.md`). Stale PUT or stale Sync does not write. A second Sync with a fresh token re-clones. |

## Error behaviour

| Condition | Response | Caller should |
| --- | --- | --- |
| Stale `updated_at` | 409 | RSC again, merge, PUT or Sync again (SCN-2) |
| Sync: not Admin | 403 | Operator may request; only Admin performs |
| Sync: missing `updated_at` | 400 | Send the Service token |
| Sync: Service gone | 404 | Treat as UC-7 |
| Service gone on PUT | 404 | Treat as UC-7; do not POST a replacement (OQ-23) |
| Date already exists, no override | 409 + `existingId` | Open the existing Service, or confirm a second row |
| No date / empty Rundown | 400 | Fix the paste; no row (OQ-21) |
| Unparseable body with a date | 201 + `failedHymnNumbers` | Show the miss; Service exists (NFR-5, OQ-22) |
| Session expired on PUT/DELETE | 401 from `internal/gate` | Sign in; no partial write (OQ-23) |
| Not found | 404 | Refresh the list |
| Plan/PPTX failed | 500 | Retry; Sabbath uses the old file if one exists |

## Compatibility

Removing `updated_at` from PUT or from POST sync-artifact is breaking (AD-6). Changing the parsed payload shape is breaking for the Hub form. Sync must not rewrite `parsed_data` or announcement membership (BR-10, BR-11).

## Constraints

PPTX generate (GET) may be slow; it does not bump `services.updated_at` (OQ-20). No `maxDuration` in the route [ASSUMED] Node default. A future Node worker (brief addendum) is not this contract.
