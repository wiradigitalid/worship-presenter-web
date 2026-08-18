---
type: contract
component: hub
lc: LC-2
direction: exposed
created: 2026-08-18
updated: 2026-08-18
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
| GET `/api/services/[id]/pptx` | Download PPTX | UC-18 |
| POST `/api/services/preview` | Preview plan | UC-8 |

## Five lanes

| Lane | Answer |
| --- | --- |
| Authentication | Operator/Admin session (AD-5). Without a session: the gate refuses before the route. |
| Validation | Service id integer; PUT requires the client's `updated_at` (AD-6). |
| Error handling | Envelope in `cross-cutting.md`. 409 stale. 404 missing. 400 id/body. 500 PPTX generate. |
| Rate limiting | `none` — one congregation, home PC; not a public API. |
| Idempotency | GET is safe. DELETE again → 404. POST same date: update, not a duplicate (FR-1/FR-27). Stale PUT does not write. |

## Error behaviour

| Condition | Response | Caller should |
| --- | --- | --- |
| Stale `updated_at` | 409 | GET/RSC again, merge, PUT again (SCN-2) |
| Not found | 404 | Refresh the list |
| Plan/PPTX failed | 500 | Retry; Sabbath uses the old file if one exists |

## Compatibility

Removing `updated_at` from PUT is breaking (AD-6). Changing the parsed payload shape is breaking for the Hub form.

## Constraints

PPTX generate may be slow; no special timeout in the route document. A future Node worker (brief addendum) is not this contract.
