---
type: contract
component: hub
lc: LC-4
direction: exposed
created: 2026-08-18
updated: 2026-08-18
---

# Contract — Upload

## Source of truth

`none`. `src/app/api/upload/**/route.ts`, `src/lib` image helpers.

## Purpose

Store announcement/asset images in `UPLOADS_DIR` (AD-4, AD-8).

## Operations

| Operation | Purpose | Realizes |
| --- | --- | --- |
| POST `/api/upload` | Upload file | UC-21 · Service form |
| POST `/api/upload/from-url` | Fetch remote URL | UC-1 images |
| GET `/api/uploads/[filename]` | Read 32-hex | PPTX / Hub |

## Five lanes

| Lane | Answer |
| --- | --- |
| Authentication | POST: session. GET filename: per AD-5 matcher (not webhook). |
| Validation | jpeg/png/gif/webp; GET name = 32 hex; remote URL SSRF allowlist |
| Error handling | 400 type/URL; 404 name; 500 disk |
| Rate limiting | `none` — session + home PC; uploads limited by type/size in validation, not a per-minute quota. |
| Idempotency | GET is safe. POST upload always a new object |

## Error behaviour

| Condition | Response | Caller should |
| --- | --- | --- |
| SSRF / host not allowed | 400 | Do not feed an internal URL |
| Name not 32-hex | 400 | Do not guess the path |

## Compatibility

A new inline resolver on this route is forbidden by AD-8.

## Constraints

Durable path `UPLOADS_DIR`. Deleting a Service (FR-10 / UC-7) unlinks local refs that are no longer used. Not age-based retention like the PPTX cache (FR-26).
