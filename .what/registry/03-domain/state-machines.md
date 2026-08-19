---
type: lifecycle
component: registry
status: draft
created: 2026-08-18
updated: 2026-08-19
entities: [ArtifactTemplate]
---

# State Lifecycle — Registry

## ArtifactTemplate

**States:** `live` · `gone`
**Initial:** `live` — AD-17 bootstrap writes seed rows
**Terminal:** `gone` — delete; Restart does not restore (BR-9, SCN-5). There is no `gone` → `live` transition. Reset does not undelete (OQ-24).

| From | To | Trigger | Who may | Guard | Side effect |
| --- | --- | --- | --- | --- | --- |
| — | live | First bootstrap | System | settings marker | N seed rows |
| live | live | Save layout / order | Admin | AD-15 validation | `updated_at` |
| live | live | Reset to seed | Admin | row is still live and has a seed origin | seed layout; AD-22 override remains |
| live | gone | Delete | Admin | Allowed on a SongSet slot (Hub hymn binding stays stored and inert, AD-19) and on the last live row (N=0 Deck, AD-17). HTTP verb [MISSING] | id is not filled by the seeder |

Existing Services do not change state here until Sync (BR-8). Sync itself is an action on the Service (Hub), Admin-only.

### What is deliberately not modelled

`ServiceRegistrySnapshot` as state — its table is [MISSING]. Disposition: planned AD-16 / FR-21. Today a new Service always reads the `live` Registry.
