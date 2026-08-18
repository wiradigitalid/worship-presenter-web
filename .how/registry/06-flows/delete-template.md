---
type: flow
component: registry
realizes: [UC-15]
risky: true
created: 2026-08-18
---

# Flow — Delete a Registry entry

## Realizes

UC-15 delete. Irreversible except Reset only for a row that is still `live` and has a seed — delete is not Reset.

## Participants

LC-11 → LC-15 → `artifact_templates`.

## Happy path

1. Admin deletes the entry (store / UI).
2. LC-15 deletes the row and closes up `position`.
3. The next boot does not insert that id (AD-17, SCN-5).

## Sequence diagram

```mermaid
sequenceDiagram
  participant A as Admin
  participant G as LC-11
  participant S as LC-15
  participant D as SQLite
  A->>G: delete id
  G->>S: delete row
  S->>D: DELETE artifact_templates
  Note over D: seeder does not fill the gap
```

## Failure modes

| Hop | Failure | System does | Safe to retry |
| --- | --- | --- | --- |
| id | 404 | does not write | yes |
| Boot | seeder fills the gap | **defect** AD-17 | not a user retry |

## Guarantees

Delete + restart = still gone. Plan does not substitute seed for a missing id.
