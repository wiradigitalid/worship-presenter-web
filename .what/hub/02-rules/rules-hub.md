---
type: rules
scope: component
component: hub
status: draft
created: 2026-08-18
updated: 2026-08-19
---

# Business Rules — Hub

## Rules

| id | Rule | Binds | Source | Status |
| --- | --- | --- | --- | --- |
| BR-3 | Hymn numbers are resolved only against the shipped Song Book; an unknown number does not reject the Service. | hub | FR-2 · UC-1 · UC-2 | active |
| BR-4 | A Service **field save** (UC-5) that carries a stale precondition is rejected; the Operator must re-read before trying again. Generate / UC-6 is not a payload edit: the stale-precondition does not apply to it (OQ-20). | hub | FR-28 · UC-5 · UC-23 · OQ-20 | active |
| BR-5 | Deleting a Service does not delete announcement items marked recurring, and does not unlink local image files still referenced by those items. | hub | FR-10 · UC-7 | active |
