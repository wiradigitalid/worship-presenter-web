---
type: rules
scope: component
component: registry
status: draft
created: 2026-08-18
updated: 2026-08-19
---

# Business Rules — Registry

## Rules

| id | Rule | Binds | Source | Status |
| --- | --- | --- | --- | --- |
| BR-8 | Edits to the live Registry do not change an existing Service until Sync Artifact. | registry | FR-21 · UC-14 · UC-15 | active |
| BR-9 | An entry Admin deleted does not reappear after restart. | registry | FR-21 · UC-15 | active |
| BR-10 | Sync Artifact replaces the structure that is rendered; Operator fields remain. | registry | FR-21 · UC-16 | active |
| BR-11 | Each Announcement registry row expands the whole live Hub announcement list. Repeating that row in the order is intended; no row selects a subset. | registry | FR-21 · UC-16 · UC-20 | active |
