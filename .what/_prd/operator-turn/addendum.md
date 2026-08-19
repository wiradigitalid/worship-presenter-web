---
title: "Addendum: Operator Turn"
initiative: operator-turn
status: draft
created: 2026-08-18
updated: 2026-08-19
---

# Addendum

## Old → new ID mapping (complete)

Condition 1 for retiring the pre-method archive (DEC-001). Old PRD numbers are not corpus IDs until this table.

| Old | New | PRD area |
|---|---|---|
| FR-1 · FR-2 · FR-3 · FR-12 | same | rundown-to-service |
| FR-11b | FR-27 | rundown-to-service |
| FR-4 … FR-7 · FR-14 · FR-20 · FR-21 | same | offline-deck |
| FR-10b | FR-26 | offline-deck |
| FR-8 · FR-9 · FR-10 · FR-11 · FR-13 · FR-15 … FR-19 · FR-22 … FR-25 | same | operator-turn |
| FR-13b | FR-28 | operator-turn |
| NFR-1 … NFR-9 | same | enforced in `requirements.yaml` |
| UJ-1 | UJ-1 | rundown-to-service |
| UJ-5 | UJ-5 | rundown-to-service |
| UJ-2 · UJ-3 · UJ-4 | same | operator-turn |
| Phase 1–6 | `target_release: as-built` | old wave not imported |
| BIC as live client | Church Name | `index.yaml` |

## Source material

DEC-001. Old PRD §4.3–4.9, §4.11–4.12 — mapped, not copied. Operator chrome: `.how/_platform/design-system.md`. Screens: `.how/_platform/inventory-screen.md`. `wdi-ux` was not run. DEC-002: slices of `_bmad-output/prior-knowledge/` leave the tree at wave close, not as a single delete.

## `weekly-sabbath` folder

Withdrawn 2026-08-18. FR IDs were not moved and were not restarted; what changed is only *which document states that promise*.
