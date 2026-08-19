---
type: inventory
kind: screen
scope: _platform
status: draft
created: '2026-08-18'
updated: '2026-08-19'
derived_from: code
verified: '96dfd61'
platform_rows: []
states: {}
---

# Inventory — screens

Derived by `inventory.py` from `export default function` in `src/app/**/page.tsx`. Route groups `(operator)` / `(projected)` do not appear in the URL. Screen identity is `<spa>/<Component>`. Numbers are stable; new rows take the next number.

## Rows

| No | Screen | Route | States | Owning component | UC served |
| --- | --- | --- | --- | --- | --- |
| 2 | web/Dashboard | `/` | — | hub | UC-3 |
| 7 | web/AdminArtifactsPage | `/admin/artifacts` | — | registry | UC-14, UC-15 |
| 6 | web/AdminPage | `/admin` | — | hub | UC-9, UC-19, UC-22 |
| 5 | web/AnnouncementsPage | `/announcements` | — | hub | UC-21 |
| 1 | web/LoginPage | `/login` | — | hub | UC-9 |
| 10 | web/ProjectorPage | `/services/[id]/present/projector` | — | presenter | UC-12 |
| 9 | web/PresentPage | `/services/[id]/present` | — | presenter | UC-12, UC-13 |
| 8 | web/SlideshowPage | `/services/[id]/slideshow` | — | presenter | UC-11 |
| 4 | web/ServiceRunSheet | `/services/[id]` | — | hub | UC-4, UC-5, UC-6, UC-7, UC-16, UC-18 |
| 3 | web/CreateServicePage | `/services/new` | — | hub | UC-2 |

## Findings

- States are not declared on these pages; the `states:` map in frontmatter is empty, so the column is `—`. Empty and error states demanded by the UX guide are not yet named here.
- UC served is a judgement the reader cannot derive from `page.tsx`; values are the prior catalogue mapping, kept in this file, except where that mapping names a UC the page does not run.
- UC-16 (Sync Artifact) is on row 4 (`/services/[id]`), Admin-only control. It is not on row 7.
