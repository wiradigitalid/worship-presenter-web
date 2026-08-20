---
type: lifecycle
component: registry
status: draft
created: 2026-08-18
updated: 2026-08-20
entities: [ArtifactTemplate, SongSetEntry, AnnouncementSet, BackgroundLibraryImage]
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
| live | live | Reset to seed | Admin | row is still live and has a seed origin | seed layout. Song Set Title/Verse/Reff layouts are free canvases like a General now (DEC-004), so there is no separate override record to preserve here any more |
| live | gone | Delete | Admin | Allowed on a Song Set entry (Hub's stored weekly values for that `variable_name` stay stored and inert — DEC-004 supersedes AD-19's fixed-four-slot reading) and on the last live row (N=0 Deck, AD-17). HTTP verb [MISSING] | id is not filled by the seeder |

Existing Services do not change state here until Sync (BR-8). Sync itself is an action on the Service (Hub), Admin-only.

## SongSetEntry

**States:** `live` · `gone`
**Initial:** `live` — Admin creates the entry (UC-24) or bootstrap seeds the default four
**Terminal:** `gone` — delete; restart does not restore, same discipline as ArtifactTemplate (BR-9)

| From | To | Trigger | Who may | Guard | Side effect |
| --- | --- | --- | --- | --- | --- |
| — | live | First bootstrap, or Admin adds an entry | System / Admin | `variable_name` not already **live** (AD-31 identity rule — a `gone` entry's name does not block a new one) | Entry appears on the main spine at the position Admin chose |
| live | live | Rename title | Admin | — | `variable_name` unchanged; weekly values keyed to it stay attached |
| live | gone | Delete | Admin | Same as any spine row (UC-15) | Hub's stored weekly values for that `variable_name` stay stored and inert (they are not modelled here — Hub owns that table); the name itself is freed |

**`variable_name` reuse (owner ruling, 2026-08-20):** a name freed by deleting a Song Set entry
MAY be picked up by a later entry — no reservation, no tombstone. The AD-31 identity guard checks
only the **currently-live** set of names; a `gone` row's name is invisible to it. A later entry
that reuses a freed name is a brand-new spine row with its own id; Hub's stale weekly values still
stored under that `variable_name` (previous paragraph) are **not** claimed by the new entry — they
remain orphaned and inert unless Hub's own reconciliation later addresses them, which is out of
this component's scope.

## AnnouncementSet

**States:** `live` · `gone`
**Initial:** `live` — Admin creates the set
**Terminal:** `gone` — delete; restart does not restore

| From | To | Trigger | Who may | Guard | Side effect |
| --- | --- | --- | --- | --- | --- |
| — | live | Admin creates a set | Admin | — | Set starts with zero authored General slides |
| live | live | Add / remove / reorder a General slide inside the set | Admin | Same authoring authority as any General (BR-12) | Set's own ordered list changes; no other set is touched |
| live | gone | Delete the set itself | Admin | No live main-spine `ann-set-marker` row may still reference it (owner ruling, 2026-08-20: **refused, never cascaded**) | Delete is rejected outright while a live marker references the set; the marker is never removed as a side effect. Admin must remove the marker from the main artifact registry first, then delete the set |

A slide *inside* a set follows the same `live`/`gone` lifecycle as ArtifactTemplate itself — it is one, just held in that set's ordered list instead of the main spine (BR-12).

## BackgroundLibraryImage

**States:** `live` · `gone`
**Initial:** `live` — Admin adds the image
**Terminal:** `gone` — delete

| From | To | Trigger | Who may | Guard | Side effect |
| --- | --- | --- | --- | --- | --- |
| — | live | Admin adds an image (UC-25) | Admin | Images only, no colours/gradients (S10) | Available to every Song Set entry's weekly choice and the Operator's live switch |
| live | live | Mark as global default | Admin | Exactly one image is default at a time | Prior default stops being default |
| live | gone | Delete | Admin | None — deleting the current default is allowed | Any weekly or live reference to it falls through the resolution order to blank (AD-33) |

### What is deliberately not modelled

`ServiceRegistrySnapshot` as state — its table is [MISSING]. Disposition: planned AD-16 / FR-21. Today a new Service always reads the `live` Registry.
