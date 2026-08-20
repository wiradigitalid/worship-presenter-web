---
type: course-correction
id: DEC-004
status: applied
touches:
  - .what/_prd/offline-deck/addendum.md
  - .what/_prd/offline-deck/prd.md
  - .what/_prd/operator-turn/addendum.md
  - .what/_prd/operator-turn/prd.md
  - .what/_prd/rundown-to-service/addendum.md
  - .what/_prd/rundown-to-service/prd.md
  - .what/business-rules.md
  - .what/hub/02-rules/rules-hub.md
  - .what/hub/03-domain/domain-model.md
  - .what/hub/03-domain/state-machines.md
  - .what/hub/SRS-hub.md
  - .what/presenter/02-rules/rules-presenter.md
  - .what/presenter/03-domain/state-machines.md
  - .what/presenter/04-usecases/UC-12-two-screen-presenter.md
  - .what/presenter/04-usecases/UC-27-live-background-switch.md
  - .what/presenter/SRS-presenter.md
  - .what/registry/02-rules/rules-registry.md
  - .what/registry/03-domain/deck-frame.md
  - .what/registry/03-domain/domain-model.md
  - .what/registry/03-domain/state-machines.md
  - .what/registry/04-usecases/UC-14-edit-layout.md
  - .what/registry/04-usecases/UC-15-reorder-and-delete.md
  - .what/registry/04-usecases/UC-16-sync-artifact.md
  - .what/registry/04-usecases/UC-20-deck-matches-payload.md
  - .what/registry/04-usecases/UC-24-song-set-entries.md
  - .what/registry/04-usecases/UC-25-background-library.md
  - .what/registry/SRS-registry.md
  - .how/_platform/ARCHITECTURE-SPINE.md
  - .how/_platform/inventory-api.md
  - .how/_platform/inventory-db.md
  - .how/_platform/inventory-screen.md
  - .how/hub/02-contracts/00-inventory.md
  - .how/hub/02-contracts/02-services.md
  - .how/hub/02-contracts/03-announcements.md
  - .how/hub/02-contracts/07-settings.md
  - .how/hub/04-components/LC-12-service-write.md
  - .how/hub/04-components/LC-16-slide-plan.md
  - .how/hub/05-model/data-model.md
  - .how/hub/05-model/form-fields.md
  - .how/hub/06-flows/delete-service.md
  - .how/hub/SDD-hub.md
  - .how/presenter/02-contracts/02-present-channel.md
  - .how/presenter/04-components/LC-14-session.md
  - .how/presenter/SDD-presenter.md
  - .how/registry/02-contracts/00-inventory.md
  - .how/registry/02-contracts/02-song-set-entries.md
  - .how/registry/02-contracts/03-announcement-sets.md
  - .how/registry/02-contracts/04-background-library.md
  - .how/registry/02-contracts/05-song-books.md
  - .how/registry/04-components/LC-15-store.md
  - .how/registry/05-model/data-model.md
  - .how/registry/06-flows/copy-paste-share-by-reference.md
  - .how/registry/06-flows/delete-template.md
  - .how/registry/06-flows/predefined-field-migration.md
  - .how/registry/SDD-registry.md
  - .control/product-glossary.md
  - .control/registry/components.yaml
  - .control/registry/requirements.yaml
  - .control/registry/usecases.yaml
supersedes: null
superseded_by: null
created: '2026-08-20'
---

# DEC-004 — Nested artifact registries, shared Song Set layouts, inline predefined fields

## Decision

> **Read the Supplement at the end of this file first.** It carries the latest owner answers
> (2026-08-20, rounds 2-4) and supersedes parts of the text below.


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
| Song-set layouts | Exactly **3** shared templates: Title · Verse · Reff. One trio for **all** song-set entries. Not per-entry skins. Supplement S4 adds the blank Verse/Reff canvas and live background; S13/R4 freezes the trio per service. |
| Song-set slots | **Superseded by Supplement S2** — an admin-configurable list of N song-set entries, each with its own variable name and title. |
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

---

# Supplement — owner rounds 2-4 (2026-08-20)

This section is the **latest state of the decision**. Where it disagrees with anything above, this
section wins. It is written to stay valid across further discussion rounds: new answers amend the
tables here in place, they are not appended as a running log. Two rows in *Locked answers* above are
superseded here and are marked as such. Sections S1-S8 came from round 2, S9-S12 from
round 3, S13-S15 from round 4.

## S1 — Predefined field vocabulary: old → new translation

The reference-deck names become the normative catalog. Migration is per key, not a bulk rename.

| Key today (`placeholder-catalog.ts:15-28`) | New key | Translation |
| --- | --- | --- |
| `date` | `service_date` | rename only |
| `reference` | `scripture_reference` **+** `theme_reference` | **split.** Today one key serves two sources by fallback (`verseReference` / `themeReference`, `plan.go:213-225`), so one General cannot carry both |
| `text` | `scripture_text` **+** `theme_text` | split, same reason |
| — | `scripture_bible_version` | **new**; no Service field exists yet |
| `performer` | `special_song` | rename |
| `title` | `sermon_title` | rename |
| `speaker` | `sermon_speaker_name` | rename |
| `imageUrl` | `sermon_poster` | rename |
| `person` | `closing_prayer_person` | stays a **separate** field — see S6 |
| `familyText` | `family_name` **+** `family_request` | **split.** Old value is request text only; `family_name` never existed in form or DB |
| `youthText` | `youth_name` **+** `youth_request` | split, same |
| `familyPhoto` | `family_photo` | rename |
| `youthPhoto` | `youth_photo` | rename |

Song-set keys are not in today's shared catalog — they are a template-level list with different
spellings (`data/default-registry.json:206-221`). Translation: `hymnNumber` -> `song_number`,
`songTitle` -> `song_title`, `label` -> `verse_number` / `verse_total`, `lyrics` ->
`verse_content[]` / `reff[]`.

**Two scriptures, two purposes.** `scripture_*` is the Bible Talk verse reading; `theme_*` is the
Divine Worship contemplation verse. They are independent weekly inputs, both authorable on the same
slide if wanted.

**Data migration.** Existing `familyText` / `youthText` values move whole into `family_request` /
`youth_request`; the new name fields start empty and are filled once by hand. The legacy combined
`familyYouth` text (`internal/parse/fields.go:48-57`) cannot be split automatically — it lands in
`family_request` as-is and is cleaned up manually.

## S2 — Song sets are an admin-configurable list, not four fixed slots

**Supersedes** the *Locked answers* row "Song-set slots — four fixed identities".

- Admin creates **N song-set entries** in the Artifact Registry. Each entry has a `variable_name`
  and a title (e.g. `opening_song_bt`, `closing_song_bt`, `opening_song_dw`, `closing_song_dw`,
  `song_service_1`). The four names above are the default seed, not a ceiling.
- Each entry **auto-generates its weekly inputs** on the Service form:
  `<var>_song_number`, `<var>_song_book_name`, `<var>_song_background`.
- More than four songs in one rundown is a supported shape, not an exception.

### Hardcodes that block this (all must become list-driven)

| Layer | Where |
| --- | --- |
| Weekly form fields `song1Number`..`song4Number` | `src/lib/worship-form-fields.ts:6-9`, `src/operator/CreateForm.tsx:569-656`, `src/operator/EditForm.tsx:601-688` |
| Structured-field key list | `internal/parse/fields.go:11-16` |
| Service API defaults | `internal/httpapi/services.go:745-748` |
| Slot index map 0..3 | `src/lib/parsed-fields.ts:20-23` |
| Four named PPTX plan paths (`bt-opening-song`, `bt-closing-song`, `ds-opening-song`, `ds-closing-song`) | `internal/plan/plan.go:295,320,345,395` |
| Singular `song-set` entry key | `src/lib/registry/types.ts:11` |

## S3 — Song books

- `hymns` already carries `book_code` (default `SDAH`, `UNIQUE(book_code, number)`,
  `internal/db/schema.sql:13-20`), but **no code reads it**: the API never returns it
  (`internal/httpapi/hymns.go:23-54`), lookup ignores it (`src/lib/lyrics.ts:28`), and the label
  `SDAH %d` is hardcoded (`internal/plan/plan.go:81`).
- A **selectable list of song books** is required — book is chosen first, hymn number second, and
  lookup resolves on the pair `(book_code, number)`.
- Different books MAY be used within one rundown, song by song.
- A **global default song book** is set in Admin; each song-set entry falls back to it.
- The product must support congregations whose books differ, and more than one book in use at once.

## S4 — Song-set layouts: shared trio, live-switchable background

- The **Title / Verse / Reff trio is shared by every song-set entry**, however many exist. Not
  per-entry skins. This confirms the *Locked answers* row.
- **Title** is an authored canvas with its own background.
- **Verse and Reff are authored on a blank canvas** — no baked-in background. Their background is
  supplied at run time and **MAY be changed live during the service**.
- Background resolution order: the song-set entry's own `<var>_song_background` (weekly, optional)
  -> the **global background** set in Admin -> blank.
- Admin maintains a **background library**; its own settings surface adds and removes entries. A
  weekly or live choice picks from that library.

## S5 — Unknown predefined-field token

Owner is indifferent to the failure mode. Chosen: **the editor flags an unknown key when the slide
is saved; at generate time an unknown token renders as nothing (empty), and generation still
succeeds.** Generation MUST NOT be blocked by a typo.

## S6 — Closing prayer person

Stays its own field in the database, separate from the sermon speaker. The Service form adds a
**checkbox that copies the sermon speaker into it**. The reference-deck row 29 above, which reuses
`sermon_speaker_name` for Closing Prayer, is an authoring slip and is corrected by this section.

## S7 — Lyrics: parsing and slide breaks

**Supersedes** the "Lyric parse" subsection above, including its two mis-citations of the as-built
code: `expandTrailingRefrain` has no distinct-refrain path, and the default chunker is a
320-character budget, not `maxLinesPerSlide`.

| Rule | Statement |
| --- | --- |
| L1 | Refrain headers are `Reff` (Indonesian) and `Chorus` (English) — **both accepted**, each with or without a trailing number (`Reff`, `Reff 2`, `Chorus`, `Chorus 3`). Today the regex (`src/lib/lyrics.ts:100`) allows a number only after `Verse`, so `Reff 1` is silently swallowed as lyric text |
| L2 | A refrain **with its own body** is used verbatim for the verse it follows. Different refrains per verse MUST be preserved. Today `expandTrailingRefrain` (`src/lib/lyrics.ts:252-274`) picks the first non-empty refrain and discards the rest — this MUST change |
| L3 | A refrain header with **no body** inherits the nearest preceding non-empty refrain. This is how a song with one repeating refrain is authored |
| L4 | Slide order follows the order written in the lyric database. The parser MUST NOT rebuild the sequence |
| L5 | **A blank line inside a section is a hard slide break.** One paragraph, one slide. Today blank lines are discarded outright (`src/lib/lyrics.ts:222`) |
| L6 | **Splitting by character count is removed.** `CONTINUOUS_CHAR_BUDGET = 320` no longer governs anything; the lyric database alone decides where a slide ends. `maxLinesPerSlide` is already inert on the production path (`src/lib/slide-plan.ts:166`) and is retired with it |

**Two parsers, one behaviour.** `src/lib/lyrics.ts` (operator preview) and `internal/plan/lyrics.go`
(PPTX) are hand-mirrored ports. Keeping both is accepted. Each MUST carry a header comment naming
the other and stating that a change to one is incomplete until the other matches — so an agent
editing the Go file knows to edit the TypeScript file, and the reverse.

**Corpus note.** Of the 695 hymns in `data/song-book/sdah.json`, none currently use a numbered
refrain header and none use a blank line inside a section. Old hymns therefore render unchanged
after L1-L6 land; the new behaviour only appears where lyrics are re-authored.

## S9 — Lyrics are edited inline on the Service, not by sweeping the corpus

The 695-hymn corpus is **not** re-authored in a sweep. Instead, when the operator prepares a
worship service, each song-set entry **shows the hymn's lyrics in an editable text area right
there**, and the operator adjusts them for that week — moving a paragraph break, fixing a line,
splitting a long stanza. Because S7/L5 makes a blank line a hard slide break, editing the text is
how the operator decides where slides break. No separate slide-splitting control is needed.

Nothing like this exists today: lyrics are read straight from the `hymns` table at plan time
(`src/lib/lyrics.ts:28`, `internal/plan/plan.go`), and the only per-service overlay is the hymn
*number* (`internal/parse/fields.go:87-94`). There is no lyric override field anywhere in
`internal/db/schema.sql`. So this needs new per-service storage plus a resolution rule: the
service's edited lyrics win over the song book's, and an untouched song falls through to the book.

## S10 — Background library holds images only

No solid colours, no gradients. Images.

## S11 — Live background switching belongs to the operator

The operator changes the background during the service, because the operator is the one running the
day. Admin owns the library and the global default; the operator owns the moment.

## S12 — Scope of an inline lyric edit

Two levels, both reachable from the same place in the UI:

- **Default — this service only.** Editing the lyric text on the Service form changes the deck for
  that service and nothing else. The song book is untouched.
- **Explicit — save to the song book.** A separate button beside the editor writes the edited lyrics
  back to the hymn, so every future service starts from the corrected text.

The button MUST be a deliberate, separate action, never a side effect of typing. The two levels sit
together so the operator can see, in one place, what a save would and would not change.

## S13 — Four rulings that closed the G4 registry questions (owner, 2026-08-20)

| # | Ruling |
| --- | --- |
| R1 | The legacy `reference` / `text` keys do **not** default to the theme keys. The mapping is decided **per slide identity**, keyed off the stable `artifact_templates.id` and never the editable label: the Verse Reading slide (`verse-reading`, `data/default-registry.json` ~line 331) becomes `scripture_reference` / `scripture_text`; the Call For Scripture Contemplation slide (`bible-verse-contemplation`, ~line 804) becomes `theme_reference` / `theme_text`. Those are the only two seeded slides binding these keys. An admin-authored custom slide that is neither falls to `scripture_*` and is flagged `needs-review` |
| R2 | A `variable_name` freed by deleting a Song Set entry **MAY be reused** by a later entry. No reservation, no tombstone |
| R3 | Deleting an Announcement Set still referenced by a marker on the main artifact registry is **refused**. The Admin removes the marker from the main registry first, then deletes the set. Never cascade |
| R4 | **Reversal of the earlier design.** The shared Title / Verse / Reff trio is **frozen per service**, not read live at render time. It joins the per-service snapshot alongside everything else DEC-004 freezes at Service creation, so editing a layout today does not silently change a Service created last week |

## S14 — Song data ownership (owner, 2026-08-20)

Recorded here because it is the reason DEC-005 exists. The committed corpus file `data/song-book/sdah.json` is the **initial seeder only**. A fresh clone still gets all 695 hymns from it. Once seeded, the table **is** the database: hymn lyrics and a song book's own registry row are administrator-owned, correctable when there is a human error, and **never re-read from the file on a later boot**. The same rule covers both — the hymn content rows and the `song_books` registry row.

The cost, accepted by the owner: a corrected `sdah.json` shipped later reaches only fresh clones, never an existing install.

This contradicts AD-25, which is the one case the method makes mandatory to record, so it is carried by its own decision — see `DEC-005-song-book-authored-after-bootstrap.md` and AD-36.

## S15 — Still open

None. Every question raised in rounds 1-4 is answered above.
