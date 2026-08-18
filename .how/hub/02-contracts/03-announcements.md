---
type: contract
component: hub
lc: LC-3
direction: exposed
created: 2026-08-18
updated: 2026-08-18
---

# Contract — Announcements

## Source of truth

`none`. `src/app/api/announcements/**/route.ts`.

## Purpose

UC-21, FR-3.

## Operations

| Operation | Purpose | Realizes |
| --- | --- | --- |
| GET `/api/announcements` | List | UC-21 |
| POST `/api/announcements` | Add | UC-21 |
| PUT `/api/announcements` | Order | UC-21 |
| PATCH `/api/announcements/[id]` | Update item | UC-21 |
| DELETE `/api/announcements/[id]` | Delete item | UC-21 |

## Five lanes

| Lane | Answer |
| --- | --- |
| Authentication | Session (AD-5) |
| Validation | Image URL through AD-8 helpers; `service_id` nullable = recurring |
| Error handling | Shared envelope. 400 URL; 404 id |
| Rate limiting | `none` — not a public surface |
| Idempotency | DELETE again 404. POST always a new item |

## Error behaviour

| Condition | Response | Caller should |
| --- | --- | --- |
| URL outside allowlist | 400 | Switch to a Hub upload or an allowlisted host |
| Item missing | 404 | Refresh the list |

## Compatibility

Allowing `data:` URIs is breaking against AD-8.

## Constraints

Deleting a Service (UC-7) cascades one-off items; recurring items (`service_id` null) remain (BR-5).
