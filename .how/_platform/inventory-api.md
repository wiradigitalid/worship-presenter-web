---
type: inventory
kind: api
scope: _platform
status: draft
created: '2026-08-18'
updated: '2026-08-19'
derived_from: code
verified: '96dfd61'
platform_rows: []
---

# Inventory — endpoints

Derived by `inventory.py` from `export async function GET|POST|PUT|PATCH|DELETE` in `src/app/api/**/route.ts`. Host `web` is the one `built: true` container. Numbers are stable; new rows take the next number.

## Rows

| No | Host | Method | Path | Owning component | Description | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | web | POST | `/api/auth/login` | hub | Log in | published |
| 2 | web | POST | `/api/auth/logout` | hub | Log out | published |
| 3 | web | POST | `/api/auth/change-password` | hub | Change password | published |
| 4 | web | GET | `/api/services` | hub | List Services | published |
| 5 | web | POST | `/api/services` | hub | Create Service | published |
| 6 | web | PUT | `/api/services/[id]` | hub | Update Service (AD-6) | published |
| 7 | web | DELETE | `/api/services/[id]` | hub | Delete Service | published |
| 8 | web | GET | `/api/services/[id]/pptx` | hub | Download PPTX | published |
| 9 | web | POST | `/api/services/preview` | hub | Preview | published |
| 10 | web | GET | `/api/announcements` | hub | List announcements | published |
| 11 | web | POST | `/api/announcements` | hub | Add announcement item | published |
| 12 | web | PUT | `/api/announcements` | hub | Reorder list | published |
| 13 | web | PATCH | `/api/announcements/[id]` | hub | Update one item | published |
| 14 | web | DELETE | `/api/announcements/[id]` | hub | Delete one item | published |
| 15 | web | POST | `/api/upload` | hub | Upload image | published |
| 16 | web | POST | `/api/upload/from-url` | hub | Fetch image from URL | published |
| 17 | web | GET | `/api/uploads/[filename]` | hub | Read upload | published |
| 18 | web | GET | `/api/hymns` | hub | Search hymns | published |
| 19 | web | GET | `/api/admin/accounts` | hub | List accounts | published |
| 20 | web | POST | `/api/admin/accounts` | hub | Create account | published |
| 21 | web | PATCH | `/api/admin/accounts/[id]` | hub | Update account | published |
| 22 | web | DELETE | `/api/admin/accounts/[id]` | hub | Delete account | published |
| 23 | web | GET | `/api/admin/settings` | hub | Settings | published |
| 24 | web | PUT | `/api/admin/settings` | hub | Update settings | published |
| 25 | web | GET | `/api/admin/artifacts` | registry | List templates | published |
| 26 | web | GET | `/api/admin/artifacts/[id]` | registry | One template | published |
| 27 | web | PUT | `/api/admin/artifacts/[id]` | registry | Save layout | published |
| 28 | web | POST | `/api/admin/artifacts/[id]/reset` | registry | Restore seed | published |
| 29 | web | GET | `/api/scripture` | presenter | Verse lookup | published |
| 30 | web | POST | `/api/webhook` | hub | picoclaw intake / correction | published |

## Findings

- There is no `GET /api/services/[id]`. The Run-Sheet reads SQLite in the Server Component for page `/services/[id]`. Screen inventory row 4.
- Plan vs code: `POST /api/webhook` is published in `src/` (FR-1 / FR-12), while this phase's intake promise is Hub form (FR-27). The row stays — as-built — and CAP-11 is the later product phase. Do not treat the shipped webhook as this phase's handover.
