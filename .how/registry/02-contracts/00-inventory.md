---
type: inventory
kind: endpoint
scope: registry
status: draft
created: '2026-08-18'
updated: '2026-08-19'
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

- Sync Artifact (UC-16) is not an HTTP row. Checked: no route. SDD `[MISSING]` AD-16 / FR-21; Hub surface — do not invent a Registry path.
- Admin delete and reorder HTTP are [MISSING] on LC-11. AD-17 non-revival is verified by SQL delete in `tests/registry-reseed.test.mjs`. Planned FR-21 / UC-15; not inventory rows until they exist.
