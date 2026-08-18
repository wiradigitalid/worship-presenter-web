---
type: inventory
kind: endpoint
scope: registry
status: draft
created: '2026-08-18'
updated: '2026-08-18'
derived_from: code
verified: '84db8e7'
---

# Inventory — endpoints of Registry

## Rows

| No | Method | Path | Spec file | Status |
| --- | --- | --- | --- | --- |
| 25 | GET | `/api/admin/artifacts` | `01-artifacts.md` | published |
| 26 | GET | `/api/admin/artifacts/[id]` | `01-artifacts.md` | published |
| 27 | PUT | `/api/admin/artifacts/[id]` | `01-artifacts.md` | published |
| 28 | POST | `/api/admin/artifacts/[id]/reset` | `01-artifacts.md` | published |

## Findings

- Sync Artifact (UC-16) is not yet an HTTP row in the platform inventory if the route does not exist — see SDD Registry `[MISSING]` AD-16.
