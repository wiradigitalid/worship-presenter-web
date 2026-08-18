---
type: rules
scope: component
component: hub
status: draft
created: 2026-08-18
updated: 2026-08-18
---

# Business Rules — Hub

## Rules

| id | Rule | Binds | Source | Status |
| --- | --- | --- | --- | --- |
| BR-3 | Hymn numbers are resolved only against the shipped Song Book; an unknown number does not reject the Service. | hub | FR-2 · UC-1 | active |
| BR-4 | A Service save that carries a stale precondition is rejected; the Operator must re-read before trying again. | hub | FR-28 · UC-5 · UC-23 | active |
| BR-5 | Deleting a Service does not delete announcement items marked recurring, and does not unlink `UPLOADS_DIR` files still referenced by those items. | hub | FR-10 · UC-7 | active |
