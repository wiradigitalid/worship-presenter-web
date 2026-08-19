---
type: model
component: registry
layer: conceptual
created: 2026-08-18
updated: 2026-08-19
---

# Domain model — Registry

Conceptual. Database column types belong in `.how/`.

| Entity | Identified by | Meaning | Relations |
| --- | --- | --- | --- |
| ArtifactTemplate | template id | One Deck-order entry | kind General / SongSet / Announcement; 0..N per Registry |
| ServiceRegistrySnapshot | Service id (planned) | Copy of Registry when the Service is created | 1 Service : 1 Snapshot after FR-21 |
| Placeholder Catalog | catalog key | Closed set of weekly-content bindings | many Templates may use the same entry |
| SongSet Slot | slot identity | Four fixed song-block positions | identity belongs to the system; at most one row per slot |

One Registry holds zero or more ArtifactTemplates. After FR-21, one Service has one Snapshot. A SongSet slot may have at most one live row.
