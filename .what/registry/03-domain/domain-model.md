# Domain model — Registry

| Entity | Meaning | Relations |
| --- | --- | --- |
| ArtifactTemplate | One Deck-order entry | kind General / SongSet / Announcement |
| ServiceRegistrySnapshot | Copy of Registry when the Service is created | 1 Service : 1 Snapshot after FR-21 |
| Placeholder Catalog | Closed set of weekly-content bindings | many Templates may use the same entry |
| SongSet Slot | Four fixed song-block positions | identity belongs to the system |
