---
type: flow
component: registry
realizes: [UC-15]
risky: true
created: 2026-08-18
updated: 2026-08-19
---

# Flow — Delete a Registry entry

## Realizes

UC-15 delete. Irreversible except Reset only for a row that is still `live` and has a seed — delete is not Reset.

## Participants

LC-11 → LC-15 → `artifact_templates`.

## Happy path

1. Admin deletes the entry. The LC-11 HTTP verb is [MISSING] — planned FR-21 / UC-15. Today the proof path is a SQL delete (`tests/registry-reseed.test.mjs`).
2. LC-15 would delete the row and close up `position`. Store function [MISSING]; same disposition.
3. The next boot does not insert that id (AD-17, SCN-5). This half is verified.

## Sequence diagram

```mermaid
sequenceDiagram
  participant A as Admin
  participant G as LC-11
  participant S as LC-15
  participant D as SQLite
  A->>G: delete id
  Note over G: LC-11 DELETE [MISSING]
  G->>S: delete row
  S->>D: DELETE artifact_templates
  Note over D: seeder does not fill the gap (verified)
```

## Failure modes

| Hop | Failure | System does | Safe to retry |
| --- | --- | --- | --- |
| LC-11 hop | no DELETE route | does not write; Admin has no HTTP verb | n/a — [MISSING] planned FR-21 |
| id | 404 | does not write | yes |
| Boot | seeder fills the gap | **defect** AD-17 | not a user retry |

## Guarantees

Delete + restart = still gone. Plan does not substitute seed for a missing id.
