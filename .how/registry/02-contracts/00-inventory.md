---
type: inventory
kind: endpoint
scope: registry
status: draft
created: '2026-08-18'
updated: '2026-08-19'
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

## Findings

- Sync Artifact (UC-16) is not a Registry HTTP row. It is Hub `POST /api/services/[id]/sync-artifact` (platform 33). Do not invent a Registry Sync path.
- POST reset is live→live only. A gone id is 404 `Template not found` and does not undelete (OQ-24).
- Numbers 31–32 match `.how/_platform/inventory-api.md` after W1. 29 is Presenter scripture; 30 is Hub webhook.
