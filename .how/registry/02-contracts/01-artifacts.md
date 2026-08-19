---
type: contract
component: registry
lc: LC-11
direction: exposed
created: 2026-08-18
updated: 2026-08-19
---

# Contract — Artifacts

## Source of truth

No separate OpenAPI file. As-built: `src/app/api/admin/artifacts/**/route.ts`, `src/lib/registry/store.ts`.

## Purpose

UC-14, UC-15. Admin-only (AD-14).

## Operations

| Operation | Purpose | Realizes |
| --- | --- | --- |
| GET `/api/admin/artifacts` | Ordered list | UC-15 |
| GET `/api/admin/artifacts/[id]` | One payload | UC-14 |
| PUT `/api/admin/artifacts/[id]` | Save layout | UC-14 |
| POST `/api/admin/artifacts/[id]/reset` | Restore seed on a still-live row | UC-15 |
| DELETE / reorder (not shipped) | Remove or reorder a live entry | UC-15. [MISSING] — `store.ts` exports list/get/update/reset/insertIfMissing only; no DELETE or reorder on LC-11. Planned FR-21 / UC-15. Do not invent a path. |

## Five lanes

| Lane | Answer |
| --- | --- |
| Authentication | Admin + AD-5 matcher. No session / not Admin → 403 Forbidden. |
| Validation | AD-15 structure + AD-8 images; kind does not widen (AD-22). PUT and Reset require `updatedAt`. Reset requires a still-live row and a seed (OQ-24, OQ-15). |
| Error handling | Envelope in `cross-cutting.md`. Fail closed on a corrupt row (AD-17). 400 validation. 404 id. Stale write: `expectedUpdatedAt` / 409. Reset on a gone id: 404, not a revive. |
| Rate limiting | `none` — Admin-only on one host; not a public surface. |
| Idempotency | GET is safe. PUT same value is safe. Repeated Reset to the same seed is safe on a still-live seed row. Reset on a gone id is 404, not undelete. DELETE/reorder: [MISSING], so not applicable until FR-21. |

## Error behaviour

| Condition | Response | Caller should |
| --- | --- | --- |
| Payload does not parse | fail closed, not a seed substitute | Fix the row or Reset (Reset only if the row is still live and has a seed) |
| Placeholder rebound outside authority | 400 | Restore the server-owned set |
| Stale `updatedAt` on PUT or Reset | 409 | Re-read, then retry |
| Reset on a gone id | 404 `Template not found` | Leave gone; do not treat as undelete (OQ-24) |
| Reset on a live row without seed | 404 `Unknown template` (seed lookup); Reset is not available | Leave the authored row (OQ-15) |

## Compatibility

Adding a kind through the API without a code+test change is breaking AD-19.

## Constraints

Deck render does not call this API (AD-14 server-side read / plan). Admin delete and reorder HTTP are [MISSING] (FR-21 / UC-15); not rows here.
