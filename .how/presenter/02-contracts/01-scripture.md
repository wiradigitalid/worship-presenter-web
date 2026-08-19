---
type: contract
component: presenter
lc: LC-9
direction: exposed
created: 2026-08-18
updated: 2026-08-19
---

# Contract — Scripture

## Source of truth

No separate OpenAPI file. As-built: `src/app/api/scripture/route.ts`, `src/lib/scripture.ts`.

## Purpose

UC-13, FR-19, FR-22. Verse overlay. Matcher scoped to the chosen translation (AD-28).

## Operations

| Operation | Purpose | Realizes |
| --- | --- | --- |
| GET `/api/scripture` | Reference lookup | UC-13 |

## Five lanes

| Lane | Answer |
| --- | --- |
| Authentication | Operator session (AD-5). Without a session the gate returns 401 `{ error: Unauthorized }` before the route. Overlay fails visible; Deck unchanged. |
| Validation | Translation code required, registry-validated; absent/unrecognised refused (AD-28). Empty `ref` → 400. |
| Error handling | Ambiguous → unmapped, not a guess (NFR-5, SCN-4). Absent corpus reported as absent. Envelope in `cross-cutting.md`. |
| Rate limiting | `none` — Operator session at the venue; local corpus lookup, not a public API. |
| Idempotency | GET is safe; does not write Service |

## Error behaviour

| Condition | Response | Caller should |
| --- | --- | --- |
| Empty `ref` | 400 | Do not push overlay |
| No session | 401 | Sign in again; Deck unchanged |
| Ambiguous / not found | visible error, not a verse | Fix the typing |
| Translation not installed | absent | Pick an installed one; do not rewrite the default |

## Compatibility

A silent fallback to "all translations" on the Operator surface is breaking AD-28.

## Constraints

Does not change the Service payload (BR-7).
