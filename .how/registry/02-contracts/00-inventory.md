---
type: inventory
kind: endpoint
scope: registry
status: draft
created: '2026-08-18'
updated: '2026-08-22'
derived_from: code
verified: '3b8c3ac'
---

# Inventory — endpoints of Registry

## Rows

| No | Method | Path | Spec file | Status |
| --- | --- | --- | --- | --- |
| 25 | GET | `/api/admin/artifacts` | `01-artifacts.md` | published |
| 26 | GET | `/api/admin/artifacts/[id]` | `01-artifacts.md` | published |
| 27 | PUT | `/api/admin/artifacts/[id]` | `01-artifacts.md` | published |
| 28 | POST | `/api/admin/artifacts/[id]/reset` | `01-artifacts.md` | published |
| 31 | DELETE | `/api/admin/artifacts/[id]` | `01-artifacts.md` | published |
| 32 | PUT | `/api/admin/artifacts/order` | `01-artifacts.md` | published |
| 37 | POST | `/api/admin/artifacts` | `01-artifacts.md` | published |
| 38 | PATCH | `/api/admin/artifacts/[id]` | `01-artifacts.md` | published |
| 61,62,60,59 | GET/POST/PATCH/DELETE | `/api/admin/song-set-entries*` | `02-song-set-entries.md` | published |
| 64,65,63 | GET/PUT/POST | `/api/admin/song-set-layouts/[role]*` | `02-song-set-entries.md` | published |
| 69 | GET | `/api/song-set-entries` | `02-song-set-entries.md` | published |
| 49,50,48,47 | GET/POST/PATCH/DELETE | `/api/admin/announcement-sets*` | `03-announcement-sets.md` | published |
| 45,46,43,42,40,44,39 | GET/POST/PUT/PATCH/DELETE | `/api/admin/announcement-sets/[id]/slides*` | `03-announcement-sets.md` | published |
| 53,54,52,51 | GET/POST/PATCH/DELETE | `/api/admin/background-library*` | `04-background-library.md` | published |
| 66 | GET | `/api/background-library` | `04-background-library.md` | published |
| 57,58,56,55 | GET/POST/PATCH/DELETE | `/api/admin/song-books*` | `05-song-books.md` | published |
| 68 | GET | `/api/song-books` | `05-song-books.md` | published |

## Findings

- Sync Artifact (UC-16) is not a Registry HTTP row. It is Hub `POST /api/services/[id]/sync-artifact` (platform 33). Do not invent a Registry Sync path.
- POST reset is live→live only. A gone id is 404 `Template not found` and does not undelete (OQ-24).
- Numbers 31–32 and 37–38 match `.how/_platform/inventory-api.md`. 29 is Presenter scripture; 30 is Hub webhook; 36 is bible translations.
- **Numbered and published 2026-08-22.** These six families carried `pending` while
  `.how/_platform/inventory-api.md` had no numbers for them. `wdi-blueprint` refreshed the three
  platform inventories from code that day (commit `0b24d5e`) and every row now has its platform
  number, read from that file rather than assigned here — numbering is `wdi-blueprint`'s and stays so.
  Registry owns 38 platform rows: 25–28, 31–32, 37–69.
- Three of those rows are Operator-facing reads whose failure behaviour is still unwritten in
  `SDD-registry.md`: 66, 68 and 69 (**OQ-49**). Admin CRUD of song books is served but no `FR` or
  `UC` promises it (**OQ-48**).
- `.how/_platform/inventory-api.md` rows 10–14 (`/api/announcements*`) **were removed** on 2026-08-22
  and now sit in that file's `## Retired` section with their reason. Their numbers are not reused.
  This component did not remove them; they were Hub-owned rows and `wdi-blueprint` retired them.
