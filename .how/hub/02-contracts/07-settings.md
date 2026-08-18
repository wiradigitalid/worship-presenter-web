---
type: contract
component: hub
lc: LC-6
direction: exposed
created: 2026-08-18
updated: 2026-08-18
---

# Contract — Settings

## Source of truth

`none`. `src/app/api/admin/settings/route.ts`. Keys in the `settings` table.

## Purpose

UC-10, UC-19, UC-22. Transition (AD-23), `ui_locale` (AD-24, FR-25), default corpus (AD-26).

## Operations

| Operation | Purpose | Realizes |
| --- | --- | --- |
| GET `/api/admin/settings` | Read | UC-19 · UC-10 |
| PUT `/api/admin/settings` | Write | UC-19 · FR-25 |

## Five lanes

| Lane | Answer |
| --- | --- |
| Authentication | Admin only |
| Validation | Known keys; `slide_transition` only a `transitions.ts` row |
| Error handling | 400 key/value; 403 |
| Rate limiting | `none` — Admin-only on one host. |
| Idempotency | PUT same value is safe |

## Error behaviour

| Condition | Response | Caller should |
| --- | --- | --- |
| Transition not in the table | 400 | Pick a shipped style |
| Default corpus not installed | inert, not a write error (AD-26) | Do not rewrite silently |

## Compatibility

Adding a key that reaches the room-facing screen is an AD-24 violation, not merely additive.

## Constraints

`ui_locale` is persisted-shared. Theme chrome is not here.
