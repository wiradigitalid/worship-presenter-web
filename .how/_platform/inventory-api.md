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

Derived by `inventory.py` from `export async function GET|POST|PUT|PATCH|DELETE` in `src/app/api/**/route.ts` (as-built until cutover). Host `api` is the Go container (DEC-003). Numbers are stable; new rows take the next number.

## Rows

| No | Host | Method | Path | Owning component | Description | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 22 | api | DELETE | `/api/admin/accounts/[id]` | hub | Delete account | published |
| 21 | api | PATCH | `/api/admin/accounts/[id]` | hub | Update account | published |
| 19 | api | GET | `/api/admin/accounts` | hub | List accounts | published |
| 20 | api | POST | `/api/admin/accounts` | hub | Create account | published |
| 28 | api | POST | `/api/admin/artifacts/[id]/reset` | registry | Restore seed | published |
| 31 | api | DELETE | `/api/admin/artifacts/[id]` | registry | Delete template | published |
| 26 | api | GET | `/api/admin/artifacts/[id]` | registry | One template | published |
| 27 | api | PUT | `/api/admin/artifacts/[id]` | registry | Save layout | published |
| 32 | api | PUT | `/api/admin/artifacts/order` | registry | Reorder templates | published |
| 25 | api | GET | `/api/admin/artifacts` | registry | List templates | published |
| 23 | api | GET | `/api/admin/settings` | hub | Settings | published |
| 24 | api | PUT | `/api/admin/settings` | hub | Update settings | published |
| 14 | api | DELETE | `/api/announcements/[id]` | hub | Delete one item | published |
| 13 | api | PATCH | `/api/announcements/[id]` | hub | Update one item | published |
| 10 | api | GET | `/api/announcements` | hub | List announcements | published |
| 11 | api | POST | `/api/announcements` | hub | Add announcement item | published |
| 12 | api | PUT | `/api/announcements` | hub | Reorder list | published |
| 3 | api | POST | `/api/auth/change-password` | hub | Change password | published |
| 1 | api | POST | `/api/auth/login` | hub | Log in | published |
| 2 | api | POST | `/api/auth/logout` | hub | Log out | published |
| 18 | api | GET | `/api/hymns` | hub | Search hymns | published |
| 29 | api | GET | `/api/scripture` | presenter | Verse lookup | published |
| 8 | api | GET | `/api/services/[id]/pptx` | hub | Download PPTX | published |
| 33 | api | POST | `/api/services/[id]/sync-artifact` | hub | Sync Artifact (AD-16) | published |
| 7 | api | DELETE | `/api/services/[id]` | hub | Delete Service | published |
| 6 | api | PUT | `/api/services/[id]` | hub | Update Service (AD-6) | published |
| 9 | api | POST | `/api/services/preview` | hub | Preview | published |
| 4 | api | GET | `/api/services` | hub | List Services | published |
| 5 | api | POST | `/api/services` | hub | Create Service | published |
| 16 | api | POST | `/api/upload/from-url` | hub | Fetch image from URL | published |
| 15 | api | POST | `/api/upload` | hub | Upload image | published |
| 17 | api | GET | `/api/uploads/[filename]` | hub | Read upload | published |
| 30 | api | POST | `/api/webhook` | hub | picoclaw intake / correction | published |

## Findings

- There is no `GET /api/services/[id]`. The Run-Sheet reads the Service through the SPA page `/services/[id]` (inventory-screen row 4); after cutover that page calls the Go API rather than a Server Component.
- Plan vs code: `POST /api/webhook` is published in `src/` (FR-1 / FR-12), while this phase's intake promise is Hub form (FR-27). The row stays — as-built — and CAP-11 is the later product phase. Do not treat the shipped webhook as this phase's handover.
- Plan vs code (DEC-003): Host is `api` (Go target). Routes are still implemented in Next.js `src/app/api` until the cutover wave. Do not treat Host `api` as proof the Go server exists.
- W1 added 31 `DELETE /api/admin/artifacts/[id]`, 32 `PUT /api/admin/artifacts/order`, 33 `POST /api/services/[id]/sync-artifact`. Numbers kept; Host renamed `web` → `api` without renumbering.
