---
type: contract
component: hub
lc: LC-5
direction: exposed
created: 2026-08-18
updated: 2026-08-18
---

# Contract — Accounts

## Source of truth

`none`. `src/app/api/admin/accounts/**/route.ts`.

## Purpose

UC-9, FR-18.

## Operations

| Operation | Purpose | Realizes |
| --- | --- | --- |
| GET `/api/admin/accounts` | List | UC-9 |
| POST `/api/admin/accounts` | Create | UC-9 |
| PATCH `/api/admin/accounts/[id]` | Update | UC-9 |
| DELETE `/api/admin/accounts/[id]` | Delete | UC-9 |

## Five lanes

| Lane | Answer |
| --- | --- |
| Authentication | `requireAdminSession` + AD-5 gate |
| Validation | unique username ≤64; role `admin`\|`operator`; password not empty |
| Error handling | 400 client message (username/role/last admin); 404; 403 not Admin |
| Rate limiting | `none` — Admin-only on one host; not a login surface. |
| Idempotency | DELETE again 404. POST same username → 400 |

## Error behaviour

| Condition | Response | Caller should |
| --- | --- | --- |
| Delete / demote the last admin | 400 | Leave one Admin |
| Username taken | 400 | Pick another |

## Compatibility

Adding a new role without an AD-18 migration is breaking.

## Constraints

Deleting an account bumps `token_version` / revokes the session so privilege does not survive (AD-5).
