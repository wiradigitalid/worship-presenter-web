---
type: model
component: registry
layer: conceptual
created: 2026-08-18
updated: 2026-08-20
---

# Domain model — Registry

Conceptual. Database column types belong in `.how/`.

| Entity | Identified by | Meaning | Relations |
| --- | --- | --- | --- |
| ArtifactTemplate | template id | One Deck-order entry on the main spine | kind General / Song Set / ann-set marker; 0..N per Registry |
| ServiceRegistrySnapshot | Service id | Copy of the whole spliced structure (main spine + every Announcement Set it references **+ the shared Title/Verse/Reff trio**) when the Service is created, or re-cloned on Sync | 1 Service : 1 Snapshot. The trio is frozen here, not read live at render time (owner ruling, 2026-08-20 — reverses an earlier live-read draft) |
| Predefined Field Catalog | catalog key | Closed set of weekly-content keys, each an inline `{key}` token inside a text element's content | many text elements may carry the same key; supersedes **Placeholder Catalog**'s whole-element binding (DEC-004) |
| Song Set Entry | `variable_name` | One admin-configured song block on the main spine, with its own name and title; N may exist, no fixed count | identity belongs to the system, never a positional ordinal; at most one row per `variable_name`; every entry shares the one Title/Verse/Reff layout trio; supersedes **SongSet Slot**'s four fixed positions (DEC-004) |
| Announcement Set | ann-set id | An Admin-authored, ordered sequence of General slides, held only in the Registry | 0..N per Registry; a main-spine `ann-set` marker splices exactly one set in at that position; supersedes the row-expands-Hub's-list shape BR-11 used to describe (DEC-004) |
| Background Library | image id | Admin's set of images (no colours, no gradients) selectable as a Verse/Reff background, plus one entry marked the global default | many Song Set entries may reference the same image; one entry per library is the global default |
| Song Book | book code | A selectable lyrics source a Song Set entry may pick, or fall through to the Admin-set global default | many hymns per book; a Song Set entry names at most one book per week (Hub weekly value) |

One Registry holds zero or more ArtifactTemplates (main-spine rows), each Song Set entry shares the one Title/Verse/Reff sequence, and each Announcement Set is its own ordered list independent of every other. After FR-21, one Service has one Snapshot covering the whole spliced structure.

Predefined Field Catalog **coverage floor** (intent, not persisted spelling — Story 20.5 owns the key strings, translated per Supplement S1): `service_date`; `scripture_reference` / `scripture_text` / `scripture_bible_version`; `theme_reference` / `theme_text`; `special_song`; `sermon_title` / `sermon_speaker_name` / `sermon_poster`; `closing_prayer_person`; `family_name` / `family_request` / `family_photo`; `youth_name` / `youth_request` / `youth_photo`. Song Set hymn/lyric values (`song_number`, `song_title`, `verse_number`, `verse_content[]`, `reff[]`) are system expansion from the Song Book, not catalog keys, and are scoped per Song Set entry's `variable_name`.

## Deferred to G4

The exact persisted shape of Song Set Entry (table vs. column), Announcement Set (its own table vs. a `parent_id` on `ArtifactTemplate`), Background Library, and Song Book selection is component-depth design, not this blueprint's job.
