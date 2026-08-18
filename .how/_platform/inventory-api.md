---
type: inventory
kind: api
scope: _platform
status: draft
created: '2026-08-18'
updated: '2026-08-18'
derived_from: code
verified: ''
platform_rows: []
---

# Inventory — endpoints

Source: `export async function` in `src/app/api/**/route.ts`. Not `inventory.py` output (App Router). Numbers are stable; new rows take the next number.

## Rows

| No | Method | Path | Owning component | Description | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | POST | `/api/auth/login` | hub | Log in | published |
| 2 | POST | `/api/auth/logout` | hub | Log out | published |
| 3 | POST | `/api/auth/change-password` | hub | Change password | published |
| 4 | GET | `/api/services` | hub | List Services | published |
| 5 | POST | `/api/services` | hub | Create Service | published |
| 6 | PUT | `/api/services/[id]` | hub | Update Service (AD-6) | published |
| 7 | DELETE | `/api/services/[id]` | hub | Delete Service | published |
| 8 | GET | `/api/services/[id]/pptx` | hub | Download PPTX | published |
| 9 | POST | `/api/services/preview` | hub | Preview | published |
| 10 | GET | `/api/announcements` | hub | List announcements | published |
| 11 | POST | `/api/announcements` | hub | Add announcement item | published |
| 12 | PUT | `/api/announcements` | hub | Reorder list | published |
| 13 | PATCH | `/api/announcements/[id]` | hub | Update one item | published |
| 14 | DELETE | `/api/announcements/[id]` | hub | Delete one item | published |
| 15 | POST | `/api/upload` | hub | Upload image | published |
| 16 | POST | `/api/upload/from-url` | hub | Fetch image from URL | published |
| 17 | GET | `/api/uploads/[filename]` | hub | Read upload | published |
| 18 | GET | `/api/hymns` | hub | Search hymns | published |
| 19 | GET | `/api/admin/accounts` | hub | List accounts | published |
| 20 | POST | `/api/admin/accounts` | hub | Create account | published |
| 21 | PATCH | `/api/admin/accounts/[id]` | hub | Update account | published |
| 22 | DELETE | `/api/admin/accounts/[id]` | hub | Delete account | published |
| 23 | GET | `/api/admin/settings` | hub | Settings | published |
| 24 | PUT | `/api/admin/settings` | hub | Update settings | published |
| 25 | GET | `/api/admin/artifacts` | registry | List templates | published |
| 26 | GET | `/api/admin/artifacts/[id]` | registry | One template | published |
| 27 | PUT | `/api/admin/artifacts/[id]` | registry | Save layout | published |
| 28 | POST | `/api/admin/artifacts/[id]/reset` | registry | Restore seed | published |
| 29 | GET | `/api/scripture` | presenter | Verse lookup | published |
| 30 | POST | `/api/webhook` | hub | picoclaw intake / correction | published |

## Findings

- There is no `GET /api/services/[id]`. The Run-Sheet reads SQLite in the Server Component for page `/services/[id]`. Screen inventory row 4.
- `inventory.py` does not read App Router.
- Verbs above from `route.ts` exports 2026-08-18.
