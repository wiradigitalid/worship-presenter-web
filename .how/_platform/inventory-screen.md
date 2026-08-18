---
type: inventory
kind: screen
scope: _platform
status: draft
created: '2026-08-18'
updated: '2026-08-18'
derived_from: code
verified: ''
---

# Inventory — screens

Source: `src/app/**/page.tsx`. Route groups `(operator)` / `(projected)` do not appear in the URL.

## Rows

| No | Screen | Route | Owning component | Actor | UC served |
| --- | --- | --- | --- | --- | --- |
| 1 | Login | `/login` | hub | Operator | UC-9 |
| 2 | Worship Hub | `/` | hub | Operator | UC-3 |
| 3 | Create service | `/services/new` | hub | Operator | UC-2 |
| 4 | Run sheet | `/services/[id]` | hub | Operator | UC-4, UC-5, UC-6, UC-7, UC-18 |
| 5 | Announcements | `/announcements` | hub | Operator | UC-21 |
| 6 | Settings | `/admin` | hub | Admin | UC-9, UC-19, UC-22 |
| 7 | Artifact Registry | `/admin/artifacts` | registry | Admin | UC-14, UC-15, UC-16 |
| 8 | Web slideshow | `/services/[id]/slideshow` | presenter | Operator | UC-11 |
| 9 | Presenter | `/services/[id]/present` | presenter | Operator | UC-12, UC-13 |
| 10 | Projector | `/services/[id]/present/projector` | presenter | Congregation (recipient) | UC-12 |

## Findings

- The older EXPERIENCE named the same ten surfaces; aligned with `page.tsx` 2026-08-18.
- `inventory.py` looks for React Router `<Route path>`, not `page.tsx`.
