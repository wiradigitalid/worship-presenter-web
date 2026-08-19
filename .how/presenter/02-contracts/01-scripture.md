---
type: contract
component: presenter
lc: LC-9
direction: exposed
created: 2026-08-18
updated: 2026-08-20
---

# Contract — Scripture

## Source of truth

No separate OpenAPI file. As-built: `internal/httpapi`, `src/lib/scripture.ts`.

## Purpose

UC-13, FR-19, FR-22. Verse overlay. Matcher scoped to the chosen translation (AD-28).

## Operations

| Operation | Purpose | Realizes |
| --- | --- | --- |
| GET `/api/scripture` | Reference lookup (`ref`) or book suggestions (`q`) | UC-13 |

## Five lanes

| Lane | Answer |
| --- | --- |
| Authentication | Operator session (AD-5). Without a session the gate returns 401 `{ error: Unauthorized }` before the route. Overlay fails visible; Deck unchanged. |
| Validation | Translation code required, registry-validated; absent/unrecognised refused (AD-28). Empty `ref` and empty `q` → 400 (SCN-4). `q` returns `{ suggestions, translation }` and does not look up a verse. [PARTIAL] — `PresenterOperator` currently sends `ref` only on Push; autocomplete uses `q`. The route falls back to `DEFAULT_TRANSLATION` when `translation` is omitted. |
| Error handling | Envelope in `.how/_platform/cross-cutting.md`. Ambiguous / not found → unmapped, not a guess (NFR-5, SCN-4). Absent corpus → 503. Timeout at the caller → fail closed (SCN-4); this route does not retry. |
| Rate limiting | `none` — Operator session at the venue; local corpus lookup, not a public API. |
| Idempotency | GET is safe; same `ref` + translation returns the same passage; does not write Service (BR-7). |

## Error behaviour

| Condition | Response | Caller should |
| --- | --- | --- |
| Empty `ref` and empty `q` | 400 | Fail closed (SCN-4). Do not push overlay. Not a silent no-op. |
| No session | 401 | Sign in again; Deck unchanged |
| Ambiguous / not found | 404, visible error, not a verse | Fix the typing |
| Translation not installed | 400 unknown, or 503 empty corpus | Pick an installed one; do not rewrite the default |
| Lookup timeout | Caller abort; no overlay | SCN-4; Operator retries |
| Projector not live | Caller must not call this | UC-13 refuse (OQ-26) |

## Compatibility

A silent fallback to "all translations" on the Operator surface is breaking AD-28.

## Constraints

Does not change the Service payload (BR-7). Timeout = Node default on the server; the browser fetch has no AbortController today [PARTIAL].
