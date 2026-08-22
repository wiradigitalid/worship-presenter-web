---
type: inventory
kind: api
scope: _platform
status: draft
created: '2026-08-18'
updated: '2026-08-22'
derived_from: code
verified: 'c9ceae0'
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
| 39 | api | POST | `/api/admin/announcement-sets/[id]/slides/[slideId]/reset` | registry | Restore an Announcement Set slide to its shipped seed | published |
| 40 | api | DELETE | `/api/admin/announcement-sets/[id]/slides/[slideId]` | registry | Delete an Announcement Set slide — the shared image file survives (DEC-004 Copy / paste) | published |
| 41 | api | GET | `/api/admin/announcement-sets/[id]/slides/[slideId]` | registry | One Announcement Set slide | published |
| 42 | api | PATCH | `/api/admin/announcement-sets/[id]/slides/[slideId]` | registry | Rename an Announcement Set slide | published |
| 43 | api | PUT | `/api/admin/announcement-sets/[id]/slides/[slideId]` | registry | Save an Announcement Set slide layout (AD-6) | published |
| 44 | api | PUT | `/api/admin/announcement-sets/[id]/slides/order` | registry | Reorder slides in an Announcement Set | published |
| 45 | api | GET | `/api/admin/announcement-sets/[id]/slides` | registry | List slides in an Announcement Set | published |
| 46 | api | POST | `/api/admin/announcement-sets/[id]/slides` | registry | Create a slide in an Announcement Set | published |
| 47 | api | DELETE | `/api/admin/announcement-sets/[id]` | registry | Delete Announcement Set — refused while a spine marker references it (S13 R3) | published |
| 48 | api | PATCH | `/api/admin/announcement-sets/[id]` | registry | Rename Announcement Set | published |
| 49 | api | GET | `/api/admin/announcement-sets` | registry | List Announcement Sets | published |
| 50 | api | POST | `/api/admin/announcement-sets` | registry | Create Announcement Set | published |
| 28 | api | POST | `/api/admin/artifacts/[id]/reset` | registry | Restore seed | published |
| 31 | api | DELETE | `/api/admin/artifacts/[id]` | registry | Delete template | published |
| 26 | api | GET | `/api/admin/artifacts/[id]` | registry | One template | published |
| 38 | api | PATCH | `/api/admin/artifacts/[id]` | registry | Rename template | published |
| 27 | api | PUT | `/api/admin/artifacts/[id]` | registry | Save layout | published |
| 32 | api | PUT | `/api/admin/artifacts/order` | registry | Reorder templates | published |
| 25 | api | GET | `/api/admin/artifacts` | registry | List templates | published |
| 37 | api | POST | `/api/admin/artifacts` | registry | Create authored General | published |
| 51 | api | DELETE | `/api/admin/background-library/[id]` | registry | Remove a background image from the library | published |
| 52 | api | PATCH | `/api/admin/background-library/[id]` | registry | Rename a background image | published |
| 53 | api | GET | `/api/admin/background-library` | registry | List the background library | published |
| 54 | api | POST | `/api/admin/background-library` | registry | Add a background image (images only, S10) | published |
| 23 | api | GET | `/api/admin/settings` | hub | Settings | published |
| 24 | api | PUT | `/api/admin/settings` | hub | Update settings | published |
| 55 | api | DELETE | `/api/admin/song-books/[bookCode]` | registry | Delete a song book — not resurrected on a later boot (AD-17) | published |
| 56 | api | PATCH | `/api/admin/song-books/[bookCode]` | registry | Update song book metadata (AD-6) | published |
| 57 | api | GET | `/api/admin/song-books` | registry | List song books | published |
| 58 | api | POST | `/api/admin/song-books` | registry | Create a song book | published |
| 59 | api | DELETE | `/api/admin/song-set-entries/[variableName]` | registry | Delete a Song Set entry — its variable_name may be reused (S13 R2) | published |
| 60 | api | PATCH | `/api/admin/song-set-entries/[variableName]` | registry | Rename a Song Set entry | published |
| 61 | api | GET | `/api/admin/song-set-entries` | registry | List Song Set entries | published |
| 62 | api | POST | `/api/admin/song-set-entries` | registry | Create a Song Set entry | published |
| 63 | api | POST | `/api/admin/song-set-layouts/[role]/reset` | registry | Restore a shared trio layout to its shipped seed | published |
| 64 | api | GET | `/api/admin/song-set-layouts/[role]` | registry | One layout of the shared Title / Verse / Reff trio (S4) | published |
| 65 | api | PUT | `/api/admin/song-set-layouts/[role]` | registry | Save a shared trio layout (AD-6) | published |
| 3 | api | POST | `/api/auth/change-password` | hub | Change password | published |
| 1 | api | POST | `/api/auth/login` | hub | Log in | published |
| 2 | api | POST | `/api/auth/logout` | hub | Log out | published |
| 66 | api | GET | `/api/background-library` | registry | Backgrounds the Operator may switch to during the service (S11) | published |
| 36 | api | GET | `/api/bible-translations` | presenter | Installed bible translations (code, name, locale, licence, provenance) plus resolved default | published |
| 18 | api | GET | `/api/hymns` | hub | Search hymns | published |
| 29 | api | GET | `/api/scripture` | presenter | Verse lookup (`ref`) and book suggestions (`q`) | published |
| 8 | api | GET | `/api/services/[id]/pptx` | hub | Download PPTX | published |
| 67 | api | POST | `/api/services/[id]/song-sets/[variableName]/save-to-book` | hub | Write edited lyrics back to the song book (S12, UC-28) | published |
| 33 | api | POST | `/api/services/[id]/sync-artifact` | hub | Sync Artifact (AD-16) | published |
| 7 | api | DELETE | `/api/services/[id]` | hub | Delete Service | published |
| 35 | api | GET | `/api/services/[id]` | hub | One Service plus assembled plan | published |
| 6 | api | PUT | `/api/services/[id]` | hub | Update Service (AD-6) | published |
| 9 | api | POST | `/api/services/preview` | hub | Preview | published |
| 4 | api | GET | `/api/services` | hub | List Services | published |
| 5 | api | POST | `/api/services` | hub | Create Service | published |
| 34 | api | GET | `/api/session` | hub | Current session | published |
| 68 | api | GET | `/api/song-books` | registry | Song books the Operator may choose from | published |
| 69 | api | GET | `/api/song-set-entries` | registry | Song Set entries the Service form renders | published |
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
- `POST /api/admin/artifacts` (37) creates an authored General (`seed_hash` NULL). `PATCH /api/admin/artifacts/[id]` (38) renames any kind, writing column and payload together (AD-18). List summaries include `resettable` from that hash. `PUT /api/admin/artifacts/[id]` (27) validates AD-15 and names the failing property; authored Generals without a planner handler still appear in the deck.
- **Plan vs code (DEC-004, not yet built):** rows 10–14 (`/api/announcements*`) are the as-built Hub announcement-list API and stay published as long as the current code runs; DEC-004 retires the promise behind them (FR-3) and moves announcement composition to the Registry, so these rows are expected to be **removed** and replaced by Registry-side endpoints for Announcement Set / Song Set Entry / Background Library CRUD once that G4 work ships. No new rows are added here yet — none of that code exists, and a plan-only row would be a guess this inventory exists to prevent.

## Retired

Rows removed from `## Rows` because the endpoint no longer exists in code. Their
numbers are **not** reused (`inventory.py` numbers rows stably).

| No | Method | Path | Retired | Why |
| --- | --- | --- | --- | --- |
| 10 | GET | `/api/announcements` | 2026-08-22 | FR-3 retired: announcement composition moved into the Artifact Registry (DEC-004) |
| 11 | POST | `/api/announcements` | 2026-08-22 | same |
| 12 | PUT | `/api/announcements` | 2026-08-22 | same |
| 13 | PATCH | `/api/announcements/[id]` | 2026-08-22 | same |
| 14 | DELETE | `/api/announcements/[id]` | 2026-08-22 | same |

The `announcement_items` table is deliberately **not** dropped, and the Telegram
webhook still accepts an `announcements[]` field and ignores it. That silence is
an owner question (OQ-42), not a decision recorded here.

