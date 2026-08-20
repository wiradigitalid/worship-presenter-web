---
type: inventory
kind: endpoint
scope: registry
status: draft
created: '2026-08-18'
updated: '2026-08-20'
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
| pending | GET/POST/PATCH/DELETE | `/api/admin/song-set-entries*` | `02-song-set-entries.md` | designed (DEC-004, G4) |
| pending | GET/PUT/POST | `/api/admin/song-set-layouts/[role]*` | `02-song-set-entries.md` | designed (DEC-004, G4) |
| pending | GET/POST/DELETE | `/api/admin/announcement-sets*` | `03-announcement-sets.md` | designed (DEC-004, G4) |
| pending | GET/POST/PUT/PATCH/DELETE | `/api/admin/announcement-sets/[id]/slides*` | `03-announcement-sets.md` | designed (DEC-004, G4) |
| pending | GET/POST/PATCH/DELETE | `/api/admin/background-library*` | `04-background-library.md` | designed (DEC-004, G4) |
| pending | GET/POST/PATCH/DELETE | `/api/admin/song-books*` | `05-song-books.md` | designed (DEC-004, G4) |

## Findings

- Sync Artifact (UC-16) is not a Registry HTTP row. It is Hub `POST /api/services/[id]/sync-artifact` (platform 33). Do not invent a Registry Sync path.
- POST reset is live→live only. A gone id is 404 `Template not found` and does not undelete (OQ-24).
- Numbers 31–32 and 37–38 match `.how/_platform/inventory-api.md`. 29 is Presenter scripture; 30 is Hub webhook; 36 is bible translations.
- **New rows (DEC-004, G4-registry, this pass):** six resource families designed in `02-song-set-entries.md`
  through `05-song-books.md`. None has a platform inventory number yet — `.how/_platform/inventory-api.md`
  already anticipated this ("no new rows are added here yet ... once that G4 work ships") and its numbering
  belongs to `wdi-blueprint`, not this component. Until numbered there, this table carries them as `pending`
  so the design is traceable without inventing platform-owned numbers. Reported at G4 close (see this
  component's memlog / handover report).
- `.how/_platform/inventory-api.md` rows 10–14 (`/api/announcements*`, the as-built Hub live list) are expected
  to be **removed** once the above ships, per that file's own finding. This component does not remove them —
  they are Hub-owned rows; reported, not edited.
