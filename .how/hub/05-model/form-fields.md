---
type: model
component: hub
layer: physical
created: 2026-08-19
updated: 2026-08-20
---

# Form fields — Hub create and edit

As-built in `CreateForm.tsx` and `EditForm.tsx`. Same field set and card order on `/services/new` and
`/services/[id]` (Hub SRS Constraints). Not copied from `_bmad-output` specs.

Parse fills overlays from **Raw Rundown Text**. The Operator may then change overlays; save writes
`raw_payload` plus `applyStructuredFields()`.

**DEC-004 change from the prior shape:** the four hardcoded song fields
(`song1Number`..`song4Number`) are retired, replaced by one repeating group per Song Set entry the
Registry has configured (FR-32). The Announcement Flyers card and the `announcements[]` field are
retired outright (FR-3 retired) — the Registry composes Announcement Sets; Hub shows a read-only
preview of how they expand, nothing editable. Family/Youth text splits into name + request (DEC-004
Supplement S1). Scripture and Theme become independent inputs. A Closing Prayer copy-from-speaker
checkbox is added (Supplement S6).

## Cards (order)

Bible Talk → Divine Worship → Sermon → Family of the Week → Youth of the Week.

The Announcement Flyers card is removed. The former read-only announcement strip becomes a **Deck
preview strip only** — how the Registry's Announcement Sets expand into this week's Deck — with no
"Manage list" affordance; composing announcement content happens only in the Artifact Registry
(DEC-004 §Service form vs Registry).

## Fields

| Control | Form name | Lands in |
| --- | --- | --- |
| Raw Rundown Text | `payload` | `services.raw_payload` |
| Song Set group — repeated once per configured entry, in the Registry's entry order | `songSets[<variableName>]` → `songNumber`, `songBookCode`, `background`, `lyricText` | `song_set_inputs` row keyed `(service_id, variable_name)` (new table, see `05-model/data-model.md`) |
| Bible Talk scripture reading | `scripture_reference`, `scripture_text`, `scripture_bible_version` | `parsed_data.verseReading` (existing `ParsedScripture` shape; `scripture_bible_version` renames the already-shipped `verseReading.translation` / `verseTranslation` field — DEC-004 Supplement S1 names this as new, but it is already as-built, see Evidence note in `SDD-hub.md`) |
| Divine Worship theme contemplation | `theme_reference`, `theme_text` | `parsed_data.themeVerse` (already independent of `verseReading` as-built; no change) |
| Special Song | `specialSong` | `parsed_data`; empty or `-` → null |
| Sermon speaker | `sermonSpeaker` | `parsed_data.sermon.speaker` |
| Closing prayer person | `closingPrayerPerson` | `parsed_data.closingPrayerPerson` |
| Closing prayer "same as speaker" | `closingPrayerCopiesSpeaker` (checkbox, client-only convenience — not itself persisted) | Checking it copies the current `sermonSpeaker` value into `closingPrayerPerson` once; it is not a live binding — editing the speaker afterward does not retroactively move the checked value (Supplement S6 corrects the reference-deck row 29 authoring slip, which reused `sermon_speaker_name` live) |
| Sermon graphic | `sermonGraphicUrl` | `images_payload` |
| Family name / photo / request | `family_name`, `familyPhotoUrl`, `family_request` | `parsed_data.familyName` (new) / images / `parsed_data.familyPrayerRequest` (renamed target key `family_request`; DEC-004 Supplement S1 splits the old combined `familyText`) |
| Youth name / photo / request | `youth_name`, `youthPhotoUrl`, `youth_request` | `parsed_data.youthName` (new) / images / `parsed_data.youthPrayerRequest` (renamed target key `youth_request`) |

## Song Set group — physical shape

For each Song Set entry the Registry currently has configured (read via the shared `artifact_templates`
table, `base_type = 'song-set-entry'`, ordered by `position` — same-process read, no new HTTP contract to
Registry needed since Hub and Registry share one Go process and one SQLite file per AD-30 / AD-2):

| Sub-field | Control | Lands in |
| --- | --- | --- |
| `songNumber` | Hymn picker (same autocomplete as today's `song1Number`..`song4Number`, generalised); the resolved book (explicitly picked or defaulted) may have zero `hymns` rows — an admin-created book nobody has authored yet, or a default pointed at one — in which case the picker shows an explicit "This book has no hymns yet" state, never a bare empty list with no explanation (`02-contracts/05-hymns.md`) | `song_set_inputs.song_number` |
| `songBookCode` | Song Book picker | `song_set_inputs.song_book_code`; empty → falls back to the global default (`settings.default_song_book`, DEC-004 Supplement S3). A non-empty stored code no longer present in the live `song_books` list is written back unchanged on save (inert, same posture as an unknown `variable_name`, AD-19/AD-31 — see `04-components/LC-12-service-write.md`) and is rendered distinctly as "this book no longer exists" rather than silently replaced by the default — the Operator sees the reference is stale instead of a quiet fallback (`02-contracts/05-song-books.md`) |
| `background` | Background Library picker (image only, Supplement S10) | `song_set_inputs.background_id`; empty → falls back to Admin's global default background (Supplement S4 resolution order); this is the **weekly** choice, distinct from the **live** in-service override (AD-34), which Hub never persists |
| `lyricText` | Editable multi-line text area, prefilled from this Service's override if one exists, else the Song Book's lyrics for the resolved `(songBookCode, songNumber)` | `song_set_inputs.lyric_override` (UC-28, BR-7) |
| "Save to Song Book" | Explicit button beside the lyric text area, never a side effect of typing | writes `lyricText` into `hymns.lyrics` for that `(book_code, number)` — the AD-25 drift note in `SDD-hub.md` is closed by DEC-005/AD-36; this route MUST NOT ship ahead of the AD-36 bootstrap-once migration (`06-flows/lyric-save-to-book.md` § Migration) |

The Registry's live entry list can change between visits (Admin adds/removes an entry) — the form
always renders against whatever list is current when the page loads (FR-32's proof of done: "adding or
removing an entry changes what the form shows without a deploy"). A `song_set_inputs` row for a
`variable_name` no longer present on the Registry's live spine is inert, not an error or a forced
delete — the same posture AD-19/AD-31 already takes for a deleted slot binding.

## Edit-only chrome (`/services/[id]`)

Kept: Preview (slideshow), Present, Delete Service, Download PPTX, Live Slide Preview, a read-only
**Deck preview strip** (renamed from the old announcement strip — shows how every Announcement Set on
this Service's spine snapshot expands; no edit affordance of any kind). There is no separate Order of
Service card.

Create has Live Slide Preview and does not include those service actions.
