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

No separate OpenAPI file. As-built: `internal/httpapi`, `src/lib/registry/store.ts`.

## Purpose

UC-14, UC-15. Admin-only (AD-14).

## Operations

| Operation | Purpose | Realizes |
| --- | --- | --- |
| GET `/api/admin/artifacts` | Ordered list | UC-15 |
| GET `/api/admin/artifacts/[id]` | One payload | UC-14 |
| PUT `/api/admin/artifacts/[id]` | Save layout | UC-14 |
| POST `/api/admin/artifacts/[id]/reset` | Restore seed on a still-live row | UC-15 |
| DELETE `/api/admin/artifacts/[id]` | Remove a live entry; compact `position` to `0..N-1`; bump every survivor's token | UC-15 (OQ-A) |
| PUT `/api/admin/artifacts/order` | Replace the whole ordered list in one transaction | UC-15 (OQ-A) |

Static `/order` is not a template id (no create verb; the seed does not ship `order`).

## Five lanes

| Lane | Answer |
| --- | --- |
| Authentication | Admin + AD-5 matcher. No session / not Admin → 403 Forbidden. |
| Validation | AD-15 structure + AD-8 images; kind does not widen (AD-22). PUT, Reset, and DELETE require `updatedAt`. Reorder body is `{ items: [{ id, updatedAt }, ...] }` covering every live row exactly once. Reset requires a still-live row and a seed (OQ-24, OQ-15). |
| Error handling | Envelope in `cross-cutting.md`. Fail closed on a corrupt row (AD-17). 400 validation / membership mismatch. 404 id. Stale write: 409. Reset on a gone id: 404, not a revive. |
| Rate limiting | `none` — Admin-only on one host; not a public surface. |
| Idempotency | GET is safe. PUT same value is safe. Repeated Reset to the same seed is safe on a still-live seed row. Reset on a gone id is 404, not undelete. DELETE of a gone id is 404. PUT order with the same membership and tokens is a write that still refreshes tokens. |

## Error behaviour

| Condition | Response | Caller should |
| --- | --- | --- |
| Payload does not parse | fail closed, not a seed substitute | Fix the row or Reset (Reset only if the row is still live and has a seed) |
| Placeholder rebound outside authority | 400 | Restore the server-owned set |
| Stale `updatedAt` on PUT, Reset, DELETE, or order | 409 | Re-read, then retry |
| Reset on a gone id | 404 `Template not found` | Leave gone; do not treat as undelete (OQ-24) |
| Reset on a live row without seed | 404 `Unknown template` (seed lookup); Reset is not available | Leave the authored row (OQ-15) |
| DELETE missing `updatedAt` | 400 `updatedAt is required` | Send the list token |
| DELETE unknown id | 404 | Refresh the list |
| PUT order length ≠ live count, unknown id, or duplicate id | 400 | Reload the list (concurrent membership) |

## Compatibility

Adding a kind through the API without a code+test change is breaking AD-19. Removing DELETE or whole-list reorder is breaking UC-15.

## Constraints

Deck render does not call this API (AD-14 server-side read / plan). Sync Artifact is a Hub route (`02-services.md`), not a Registry path.
