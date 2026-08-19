---
type: model
component: hub
layer: physical
created: 2026-08-19
updated: 2026-08-19
---

# Form fields — Hub create and edit

As-built in `CreateForm.tsx` and `EditForm.tsx`. Same field set and card order on `/services/new` and `/services/[id]` (Hub SRS Constraints). Not copied from `_bmad-output` specs.

Parse fills overlays from **Raw Rundown Text**. The Operator may then change overlays; save writes `raw_payload` plus `applyStructuredFields()`.

## Cards (order)

Bible Talk → Divine Worship → Sermon → Family of the Week → Youth of the Week → Announcement Flyers.

## Fields

| Control | Form name | Lands in |
| --- | --- | --- |
| Raw Rundown Text | `payload` | `services.raw_payload` |
| Opening / closing songs (Bible Talk) | `song1Number`, `song2Number` | first two hymn overlays |
| Verse reading | `verseReference`, `verseText` | `parsed_data` verse reading. Resolve calls `GET /api/scripture`. On miss: form error; `verseText` unchanged; save still allowed |
| Opening / closing songs (Divine Worship) | `song3Number`, `song4Number` | next two hymn overlays |
| Special Song | `specialSong` | `parsed_data`; empty or `-` → null |
| Sermon speaker / closing prayer | `sermonSpeaker`, `closingPrayerPerson` | `parsed_data`; closing auto-fills from speaker until edited |
| Sermon graphic | `sermonGraphicUrl` | `images_payload` |
| Family photo / prayer | `familyPhotoUrl`, `familyPrayerRequest` | images + `parsed_data` |
| Youth photo / prayer | `youthPhotoUrl`, `youthPrayerRequest` | images + `parsed_data` |
| Announcement flyers | `announcements[]` (`image_url`, `is_recurring`) | `announcement_items`; recurring = master (`service_id` null); one-off = this Service. Empty master does not clear global master unless `clearMaster` |

## Edit-only chrome (`/services/[id]`)

Kept: Preview (slideshow), Present, Delete Service, Download PPTX, Live Slide Preview, read-only announcement strip with **Manage list**. There is no separate Order of Service card.

Create has Live Slide Preview and does not include those service actions.
