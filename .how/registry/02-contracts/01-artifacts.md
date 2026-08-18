---
type: contract
component: registry
lc: LC-11
direction: exposed
created: 2026-08-18
updated: 2026-08-18
---

# Contract — Artifacts

## Source of truth

`none`. `src/app/api/admin/artifacts/**/route.ts`, `src/lib/registry/store.ts`.

## Purpose

UC-14, UC-15. Admin-only (AD-14).

## Operations

| Operation | Purpose | Realizes |
| --- | --- | --- |
| GET `/api/admin/artifacts` | Ordered list | UC-15 |
| GET `/api/admin/artifacts/[id]` | One payload | UC-14 |
| PUT `/api/admin/artifacts/[id]` | Save layout | UC-14 |
| POST `.../reset` | Restore seed | UC-15 |

## Five lanes

| Lane | Answer |
| --- | --- |
| Authentication | Admin + AD-5 matcher |
| Validation | AD-15 structure + AD-8 images; kind does not widen (AD-22) |
| Error handling | Fail closed on a corrupt row (AD-17). 400 validation. 404 id. Stale write: `expectedUpdatedAt` / 409 if that path is used |
| Rate limiting | `none` — Admin-only on one host; not a public surface. |
| Idempotency | GET is safe. PUT same value is safe. Repeated Reset to the same seed is safe |

## Error behaviour

| Condition | Response | Caller should |
| --- | --- | --- |
| Payload does not parse | fail closed, not a seed substitute | Fix the row or Reset |
| Placeholder rebound outside authority | 400 | Restore the server-owned set |
| Reset on a row without seed | no Reset | Create/leave authored |

## Compatibility

Adding a kind through the API without a code+test change is breaking AD-19.

## Constraints

Deck render does not call this API (AD-14 server-side read / plan).
