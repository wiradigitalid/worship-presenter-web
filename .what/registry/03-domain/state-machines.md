---
type: lifecycle
component: registry
status: draft
created: 2026-08-18
updated: 2026-08-18
entities: [ArtifactTemplate]
---

# State Lifecycle — Registry

## ArtifactTemplate

**States:** `live` · `gone`
**Initial:** `live` — AD-17 bootstrap writes seed rows
**Terminal:** `gone` — delete; Restart does not restore (BR-9, SCN-5)

| From | To | Trigger | Who may | Guard | Side effect |
| --- | --- | --- | --- | --- | --- |
| — | live | First bootstrap | System | settings marker | N seed rows |
| live | live | Save layout / order | Admin | AD-15 validation | `updated_at` |
| live | live | Reset to seed | Admin | row has a seed origin | seed layout; AD-22 override remains |
| live | gone | Delete | Admin | — | id is not filled by the seeder |

Existing Services do not change state here until Sync (BR-8). Sync itself is an action on the Service (Hub), Admin-only.

### What is deliberately not modelled

`ServiceRegistrySnapshot` as state — its table is [MISSING]. Today a new Service always reads the `live` Registry.
