---
type: course-correction
id: DEC-004
status: draft
touches: []
supersedes: null
superseded_by: null
created: '2026-08-20'
---

# DEC-004 — Nested artifact registries, shared Song Set layouts, inline predefined fields

## Decision

The Artifact Registry is a **main ordered spine** of general slides, four Song Set slot markers, and zero-or-more Announcement Set markers; Song Set expansion uses **one shared trio** of layouts (Title, Verse, Reff) for all four slots; each Announcement Set is its own ordered list of general canvases; weekly text bindings are **inline `{catalog_key}` tokens** inside one styled text element; announcement composition is authored only in the Registry; the Service form supplies weekly fields (including Family/Youth) and shows deck preview only — it does not edit announcement/flyer lists.

## Why

**Void assumption:** Announcement is a single special kind that expands the Hub flyer list as full-bleed images (BR-11 / UC-14), and a predefined field is a whole canvas element bound by `placeholderKey` rather than a token mixed into authored text.

Owner ratified the model below on 2026-08-20. This `DEC-` is the sole authority for that outcome.

This contradicts living rules AD-19, AD-22, BR-11, and UC-14’s Announcement alternate flow. Those MUST be amended on apply — not patched only in code.

### As-built contrast (what this voids)

| Fact today | Where |
| --- | --- |
| Three kinds: `general` · `song-set` · `announcement` | AD-19, `types.ts` |
| Free canvas = General only | AD-22, UC-14 |
| SongSet: bounded surface (bg + fonts), not free canvas; four `songset-*` slots are target (Story 20.7), code still has a single `song-set` key | AD-19 / AD-22 |
| Announcement registry row = expander of Hub flyer list (full-bleed images), not free canvas; may repeat | UC-14, BR-11, FR-21 |
| Placeholder Catalog insertable on General; weekly fields fill bindings via whole-element `placeholderKey` | AD-19, `placeholder-catalog.ts` |
| Ordered registry list + delete/reorder already shipped | UC-15, ArtifactEditor |
| Canvas: add text/shape, insert catalog placeholder, font color/size; **no** bold/italic/underline UI; **no** explicit insert-image / layer panel | ArtifactEditor |
| Live Preview badge = `previewLabel`; title line often legacy `slide.title` or **Untitled Slide** | `preview-model.ts`, `SlidePreviewList.tsx` |

## Cost

Registry storage and APIs grow from one ordered table to a spine plus nested list membership (`ann-set-N`) and a shared `song-set-sequence` of three layouts. Hydration and validation must parse inline tokens and reject unknown keys. FR-3 / Hub announcement composition UI shrink or retire. Existing services that relied on flyer-list expansion need a migration or Sync story. Copy/paste with shared image refs requires a later orphan-asset Admin tool so deletes do not remove binaries still referenced elsewhere.

---

## Normative model

### Registry shape — three levels

```
Main artifact registry          ← deck spine (ordered; Admin-authored)
├── general rows                ← free canvas each
├── song-set rows ×4            ← slot markers; expand via song-set-sequence
└── ann-set-N markers           ← 0..N; each expands via that set’s registry

song-set-sequence (shared)      ← exactly 3 layout templates for every song-set slot
├── Title
├── Verse n   (× many from lyrics)
└── Reff n    (× many from lyrics)

ann-set-N-sequence              ← each set: ordered list of general slides
```

Section headers such as “Bible Talk” / “Divine Worship” / “song-set-sequence” / “ann-set-*-sequence” are **operator chrome / documentation only** — not slides and not registry rows.

### Main spine

- The primary ordered list Admin reorders is the deck skeleton.
- Most rows are **general** (free canvas + optional predefined fields + manual text/image/shape).
- Exactly **four Song Set slot identities** may appear (each at most once; each may be absent):
  - Opening Song (Bible Talk)
  - Closing Song (Bible Talk)
  - Opening Song (Divine Worship)
  - Closing Song (Divine Worship)
- **Announcement Set markers** are optional: Admin may insert 0, 1, 2, 3, … sets, or remove them all. Not mandatory on the spine.
- Intercessory / fixed sung responses (e.g. Hope) are **general** slides with manual text — not Song Set.

### Song Set

- One spine row expands to many slides from the weekly hymn for that slot.
- Admin authors **three shared layouts** only (Title, Verse, Reff) — each like a general canvas: background, where number/title/verse/reff sit, fonts, other fixed chrome.
- **One shared trio** for all four slots — not per-slot skins.
- At generate time: parse hymnal lyrics; fill Title once; emit Verse/Reff slides (same or different reff bodies; long sections may chunk to multiple slides).

#### Lyric parse (as-built `src/lib/lyrics.ts` / `splitLyricsLabeled`)

Headers recognised: `Verse`, `Verse N`, `Chorus`, `Reff`, `Refrain`.

Behaviour the expander MUST preserve:

- Empty Reff/Chorus lines inherit the first non-empty refrain text.
- If ≥1 verse and ≥1 refrain → emit **Verse → Reff after every verse** (same reff text reused), or keep distinct reff bodies when the dump has them.
- Verse label → `n/total`; refrain label → `Reff` / `Chorus`.
- Long sections chunk across multiple slides (`maxLinesPerSlide`, default 4).

Binding names in the reference deck (`verse_content`, `reff`, `verse_list`, `verse_total`) MUST map onto that parser output when hydrate lands.

### Announcement sets

- Each set is its own ordered list of **general** slides (canvas + predefined fields).
- A spine marker splices that subsequence into the deck at that position.
- Family & Youth (name, photo, request) are **predefined fields on a general slide** inside a set (reference seed places them in set 2); the same keys MAY be used on other slides later.
- Weekly values for those fields are entered on the **Service form** (Family/Youth cards), not by editing the Registry canvas content.
- This replaces BR-11’s “one registry row → whole Hub flyer list as full-bleed images” with “N set registries of authored generals.”

### Predefined fields (inline tokens)

- Vocabulary: **predefined field** (catalog of weekly keys) — not “placeholder box”.
- A text predefined field is a **token inside one text element’s content**, e.g. `Family: {family_name}` — mix fixed prose + tokens in the same box.
- Insert via typing `{key}` or an Insert control that drops the token at the caret. Exact delimiter is implementation detail; MUST be parseable and catalog-validated.
- One element = one style set (font, size, weight, style, color, alignment). No per-token styling inside the same box.
- Image predefined fields remain their own geometry box (not inline in a text string) — e.g. `{family_photo}` is an image element with its own box.
- Hydrate substitutes catalog values; unknown keys fail closed / surface in editor.
- The authored string *is* the template; weekly Service fills tokens only — no separate “edit placeholder content vs weekly value” mode.
- Replaces the as-built model where `placeholderKey` binds an entire element.

### Copy / paste

Needed across Main ↔ ann-set-N and between announcement sets:

- Text / shape / style / geometry / tokens: **full copy** into the target list (new ids); becomes a new reorderable row there.
- Image binaries: **share by reference** (do not duplicate files).
- Deleting a slide does **not** delete the shared file. Later Admin: find/delete orphan (unreferenced) assets.

### Service form vs Registry

- **Compose** announcement / flyer slides only in Artifact Registry (ann-set sequences).
- **Remove** Announcement Flyers list editing from Create/Edit Service (and the Hub manage-list-as-deck-composition path for that purpose).
- Service keeps weekly fields (hymns, scripture, sermon, Family/Youth photos & text, etc.).
- Service / Live Slide Preview: **preview only** for how sets expand — no edit of announcement composition there.

### Live Preview / Presenter chrome

- Groups (Song Set, Announcement Set) MAY appear as operator chrome.
- Group title / marker is **not** a projected slide — only children reach the congregation (same organisational rule as today’s Song Set nesting; children carry `#` slide numbers).
- Preview titles prefer registry label / kind; avoid meaningless “Untitled Slide” when a label exists.
- Desired operator vocabulary shape: `[General] …`, `[Song Set] …` with nested Title/Verse/Reff children, Announcement Set as group chrome over its generals.

### Registry UI (product expectations; detail lands via UX on apply)

- Templates list: one horizontal row; move up / move down / delete as icons.
- Clearer naming: registry label is what preview shows as the title; show predefined-field key label on canvas; edit style/geometry; clarify fixed text vs binding.
- Canvas gaps vs as-built: insert image, explicit layer order, bold/italic/(underline) controls.

### Locked answers (owner, 2026-08-20)

| Topic | Decision |
| --- | --- |
| Song-set layouts | Exactly **3** shared templates: Title · Verse · Reff. One trio for **all four** slots. Not per-slot skins. |
| Song-set slots | Four fixed identities on the main list (may be absent if Admin removes a row). |
| Announcement sets | **0..N**, Admin-creatable. Not mandatory on the main spine. |
| Family / Youth | Predefined catalog fields; weekly values on the **Service** form. |
| Hub / Service announcement editing | **Removed** from Service. Compose only in Artifact Registry. Preview only on Service. |
| Projected group titles | Never — markers/headers do not paint to the room. |
| Predefined field | Inline `{key}` tokens in one text element; one style set; images stay their own box. |
| Copy assets | Text/shape full copy; images share by ref; delete slide ≠ delete file; orphan purge later. |

---

## Reference deck (seed / acceptance shape)

Illustrative ordered spine and nested sequences for a full Sabbath. Used to align seed data and acceptance tests. Helper section titles are not rows. Component columns are seed authoring hints, not a second product contract beyond the normative model above.

### Main spine

| # | Section (chrome only) | Type | Title | Predefined fields | Other components / notes |
| --- | --- | --- | --- | --- | --- |
| — | Bible Talk | — | — | — | section header only |
| 2 | | general | Welcome | | image background; text single line welcome; text single line BIC |
| 3 | | general | Bible Talk Sequence | | image background; text multiple line judul; text multiple line rundown |
| 4 | | general | Prayer Partners | | image background; text multiple line judul |
| 5 | | general | Opening Song Intro | | image background; text multiple line judul; shape rectangle; text single line info |
| 6 | | song-set | Opening Song (Bible Talk) | `song_number`, `song_title`, `verse_list`, `verse_number`, `verse_content[]` | expands via song-set-sequence |
| 7 | | general | Scripture Reading | `scripture_text`, `scripture_reference`, `scripture_bible_version` | image background; text multiple line `{scripture_text}`; text single line `{scripture_reference} {scripture_bible_version}` |
| 8 | | general | Opening Prayer | | image background; text single line title |
| 9 | | general | Bible Talk Sequence | | image background; text single line title; text single line info |
| 10 | | general | Closing Song Intro | `song_number`, `song_title`, `verse_list`, `verse_number`, `verse_content[]` | image background; text multiple line judul; shape rectangle; text single line info |
| 11 | | song-set | Closing Song (Bible Talk) | | expands via song-set-sequence |
| 12 | | general | Closing Prayer | | image background; text single line title |
| 13 | | general | Break Time | | image background; title; info; info2; image QR; bank name; account number; account name |
| 14 | | ann-set | Announcement 1 | | expands via ann-set-1-sequence |
| — | Divine Worship | — | — | — | section header only |
| 16 | | general | Divine Worship Sequence | | image background; text multiple line judul; text multiple line rundown |
| 17 | | general | Call For Scripture Contemplation | | image background; text multiple line scripture text; text single line scripture reference |
| 18 | | general | Opening Song Intro | | image background; text multiple line judul; shape rectangle; text single line info |
| 19 | | song-set | Opening Song (Divine Worship) | `song_number`, `song_title`, `verse_list`, `verse_number`, `verse_content[]` | expands via song-set-sequence |
| 20 | | general | Intercessory Prayer Slide | | image background; text multiple line judul |
| 21 | | general | Intercessory Prayer (Opening Song) | | image background; text multiple line verse 1; text multiple line verse 2; image music icon |
| 22 | | general | Intercessory Prayer Slide | | image background; text multiple line judul |
| 23 | | general | Intercessory Prayer (Closing Song) | | image background; text multiple line verse 1; image music icon |
| 24 | | general | Special Song | `special_song` | image background; text single line title; text single line `{special_song}` |
| 25 | | general | Sermon Intro | `sermon_speaker_name` | image background; text single line title; text single line `{sermon_speaker_name}`; shape |
| 26 | | general | Sermon Poster | `sermon_poster` | image background `{sermon_poster}` |
| 27 | | general | Closing Song Intro | | image background; text multiple line judul; shape rectangle; text single line info |
| 28 | | song-set | Closing Song (Divine Worship) | `song_number`, `song_title`, `verse_list`, `verse_number`, `verse_content[]` | expands via song-set-sequence |
| 29 | | general | Closing Prayer | `sermon_speaker_name` | image background; text single line title; text single line `{sermon_speaker_name}`; shape |
| 30 | | general | We Have This Hope 1/2 | | image background; text multiple line verse 1; image music icon |
| 31 | | general | We Have This Hope 2/2 | | image background; text multiple line verse 2; image music icon |
| 32 | | general | Call For Contemplation | | image background; text multiple line |
| 33 | | general | Welcome | | image background; text single line welcome; text single line BIC |
| 34 | | ann-set | Announcement 2 | | expands via ann-set-2-sequence |

### Shared song-set-sequence

| Layout | Predefined fields | Other components / notes |
| --- | --- | --- |
| Title | `song_number`, `song_title` | image background; text single line `SDAH #{song_number}`; text single line `{song_title}` — one slide per hymn |
| Verse n | `verse_number`, `verse_content[]` | image background; text single line `{verse_number}/{verse_total}`; text multiple line `{verse_content[]}` — may span multiple slides from the array / chunking |
| Reff n | `reff[]` | image background; text single line `reff`; text multiple line `{reff[]}` — may span multiple slides from the array / chunking |

### ann-set-1-sequence

| Title | Predefined fields | Other components / notes |
| --- | --- | --- |
| Break Time | | image background; title; info; info2; image QR; bank name; account number; account name |
| Keep Our Church Clean | | image background; text single line title; text single line info |
| Please Do Not Touch | | image background |

### ann-set-2-sequence

| Title | Predefined fields | Other components / notes |
| --- | --- | --- |
| Offering & Tithe | | image background; title; info; info2; image QR; bank name; account number; account name |
| Family & Youth Of The Week | `family_name`, `family_photo`, `family_request`, `youth_name`, `youth_photo`, `youth_request` | image background; titles; `{family_name}`; image `{family_photo}`; text multiple line `{family_request}`; `{youth_name}`; image `{youth_photo}`; text multiple line `{youth_request}` |
| Online Midweek Prayer | | image background; text multiple line title; text single line info; text single line info 2 |
| Please Do Not Touch | | image background |
| Keep Our Church Clean | | image background; text single line title; text single line info |
| Welcome | | image background; text single line welcome; text single line BIC |

---

## Landing map (not yet applied)

| Concern | Likely landing | Blocks coding? |
| --- | --- | --- |
| Nested registries: Main + song-set-sequence(3) + ann-set-N (0..N) | this DEC + AD-19/22, UC-14/15, BR-11, FR-21 | Yes |
| Song Set auto-expand from shared Title/Verse/Reff | same + plan/hydrate | Yes |
| Inline `{predefined}` tokens in one text element | same; hydrate + validator + editor | Yes |
| Copy/paste: full for text/shape; share image refs; orphan purge Admin later | FR/UC + build | Medium |
| Live Preview: group chrome, no projected group title; kill Untitled Slide | preview-model + list | No |
| Templates list one-row icons | DESIGN / build | No |
| Insert image + layer + font style | DESIGN + build | No |
| Retire flyer-list edit on Service; preview-only for ann sets | Hub UC/form + FR-3/21 amend | Medium |

### Corpus impact

| Layer | Touched by this decision |
| --- | --- |
| `.what/_prd/offline-deck/` | FR-20, FR-21 proof; FR-3 boundary with Hub |
| `.what/registry/` | UC-14, UC-15, BR-11, deck-frame, SRS catalogue |
| `.what/hub/` | UC-21 / form behaviour; flyer list vs preview-only |
| `.what/business-rules.md` | BR-11 |
| `.how/_platform/ARCHITECTURE-SPINE.md` | AD-19, AD-22 (and hydrate vocabulary) |
| `.how/registry/` | contracts, SDD, editor surface |
| `.how/hub/` | form-fields, announcements contract |
| `.control/product-glossary.md` | Announcement Set, predefined field, Song Set sequence |
| Open waves / SPEC | none in-progress; next wave re-derives SPEC |

Apply MUST run document owners after Product Owner **accept**. Amend the ADs above in place on apply.
