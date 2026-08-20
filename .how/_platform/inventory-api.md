---
type: inventory
kind: api
scope: _platform
status: draft
created: '2026-08-18'
updated: '2026-08-20'
derived_from: code
verified: '96dfd61'
platform_rows: []
---

# Inventory — endpoints

Derived by `inventory.py` from `mux.HandleFunc` in `internal/httpapi/server.go`. Host `api` is the Go container (DEC-003). Numbers are stable; new rows take the next number.

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
| 38 | api | PATCH | `/api/admin/artifacts/[id]` | registry | Rename template | published |
| 32 | api | PUT | `/api/admin/artifacts/order` | registry | Reorder templates | published |
| 25 | api | GET | `/api/admin/artifacts` | registry | List templates | published |
| 37 | api | POST | `/api/admin/artifacts` | registry | Create authored General | published |
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
| 29 | api | GET | `/api/scripture` | presenter | Verse lookup (`ref`) and book suggestions (`q`) | published |
| 36 | api | GET | `/api/bible-translations` | presenter | Installed bible translations (code, name, locale, licence, provenance) plus resolved default | published |
| 34 | api | GET | `/api/session` | hub | Current session | published |
| 8 | api | GET | `/api/services/[id]/pptx` | hub | Download PPTX | published |
| 33 | api | POST | `/api/services/[id]/sync-artifact` | hub | Sync Artifact (AD-16) | published |
| 35 | api | GET | `/api/services/[id]` | hub | One Service plus assembled plan | published |
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

- `GET /api/session` (34) and `GET /api/services/[id]` (35) exist on the Go API so the SPA can read the httpOnly session and consume the assembled plan.
- Plan vs code: `POST /api/webhook` is published (FR-1 / FR-12), while this phase's intake promise is Hub form (FR-27). The row stays — as-built — and CAP-11 is the later product phase. Do not treat the shipped webhook as this phase's handover.
- Plan vs code (DEC-003): Host is `api` (Go). Rows 1–38 are served by `internal/httpapi`.
- W1 added 31 `DELETE /api/admin/artifacts/[id]`, 32 `PUT /api/admin/artifacts/order`, 33 `POST /api/services/[id]/sync-artifact`. Numbers kept; Host renamed `web` → `api` without renumbering.
- `GET /api/bible-translations` (36) lists every installed bible translation with its locale and returns the resolved `default_bible_translation` (Story 21.3). No locale filter on the query (AD-26 / FR-24).
- `GET /api/scripture` (29) accepts `ref` for lookup or `q` for book-name suggestions on the same path (Story 21.5). An omitted `translation` uses `default_bible_translation` (inert if uninstalled). No new row for that query shape.
- `POST /api/admin/artifacts` (37) creates an authored General (`seed_hash` NULL). `PATCH /api/admin/artifacts/[id]` (38) renames any kind, writing column and payload together (AD-18). List summaries include `resettable` from that hash.
