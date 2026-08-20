# Handover — DEC-004 + DEC-005 (nested artifact registries, N-configurable Song Set, Announcement Sets, inline predefined fields, background library, song-book bootstrap)

Repo: `worship-presenter-web` (public repo). Branch: `main`. Target implementer: a coding agent picking
this up cold.

**This handover was rewritten from the restored source.** An earlier version of this file was written
while `.control/decisions/DEC-004-nested-artifact-registries.md` was accidentally missing its
`# Supplement — owner rounds 2-4` section from disk (a stray `git checkout` had reverted it). That
earlier agent correctly noticed the gap but then reconstructed guessed content for it from downstream
citations. The file is now fully restored — S1 through S15 (S8 intentionally does not exist; the
numbering runs S1-S7, S9-S15 because S8 was a round-2 open-questions list that rounds 3-4 answered and
retired) — and every claim below has been re-verified directly against that restored file and the
current code tree. Nothing here is reconstructed from citations.

## 1. Orientation

The product is moving off a hardcoded four-song, single-Announcement-list liturgy model into an
Admin-authored one: any number of Song Set entries (not exactly four), zero-or-more independent
Announcement Sets nested inside the Artifact Registry, predefined weekly values as `{token}`s mixed
into authored text (not whole-element bindings), an Admin-maintained image background library with
live in-service switching, and an inline lyric editor that can save a correction back to the shared
Song Book. DEC-005 is a second, narrower decision forced open by the first: once an operator can write
into `hymns.lyrics` (Save to Song Book), the song-book corpus can no longer be a boot-time projection of
`data/song-book/<code>.json` the way the bible corpus still is — it bootstraps once per book code and is
then administrator-owned data, exactly like the Artifact Registry already is under AD-17.

**This is a large multi-story change, not one commit.** Six product components move together
(`registry`, `hub`, `presenter`, plus the Go `api`/`internal` layer, the shared `src/` TypeScript, and
the SPA). Land it as a sequence of small, independently green PRs (§2), never as one sweeping change.
Every PR must pass `npm test` and the public-repo guard before it merges (§6).

**Authoritative documents — read them, never invent past them:**

- `.control/decisions/DEC-004-nested-artifact-registries.md` — the ratifying decision. Read the
  `# Supplement — owner rounds 2-4` section at the bottom of the file first; it is the latest state
  and overrides the body above it wherever they disagree (the file itself says so at the top of its
  Decision section).
- `.control/decisions/DEC-005-song-book-authored-after-bootstrap.md` — song-book bootstrap-once.
- `.how/_platform/ARCHITECTURE-SPINE.md` — AD-31 through AD-36 are the living rules this change set
  builds toward. AD-31/32/33/34/35 are DEC-004; AD-36 is DEC-005.
- `.how/registry/**` — `SDD-registry.md`, `05-model/data-model.md`, contracts
  `02-song-set-entries.md` / `03-announcement-sets.md` / `04-background-library.md` /
  `05-song-books.md`, flows `06-flows/predefined-field-migration.md` and
  `06-flows/copy-paste-share-by-reference.md`. This is the deepest, most concrete design — read it
  first when a schema or endpoint question comes up.
- `.how/hub/**` — `SDD-hub.md`, `05-model/data-model.md`, `05-model/form-fields.md`,
  `02-contracts/02-services.md`, flow `06-flows/lyric-save-to-book.md`.
- `.how/presenter/**` — `SDD-presenter.md`, `02-contracts/02-present-channel.md`.
- `.what/registry/04-usecases/UC-24-song-set-entries.md`, `UC-25-background-library.md`;
  `.what/hub/04-usecases/UC-28-correct-song-lyrics.md`; `.what/presenter/04-usecases/UC-27-live-background-switch.md`.
- `.control/product-glossary.md` — already updated for DEC-004 terms (Announcement Set, Predefined
  Field, Song Set, Background Library, Lyric Override). Use this vocabulary; do not reintroduce
  "Placeholder Catalog" or "SongSet Slot" language in new code or docs.
- `.control/structure-codebase.md` — where code lives (`cmd/api` + `internal/` = Go API;
  `spa/` = Vite SPA; `src/` = shared React UI + PPTX worker; verified: `cmd/api/`, `internal/`,
  `spa/`, `src/` all exist at repo root as described).

**Resolve ambiguity by reading further into these documents, never by guessing a product answer.**
Several are marked `status: draft` and carry `[MISSING]` / `[ASSUMED]` / `[NEEDS CONFIRMATION]` markers
in their own Evidence tables — those markers are the corpus telling you it does not know yet. Where a
marker says `[ASSUMED]`, that assumption is provisional design, not settled fact; treat it as the
current best answer, but if implementing it forces a real product choice, stop and ask (§8) rather
than harden the assumption further. Per the restored DEC-004 Supplement itself: **S15 states nothing
is left open** — every question raised across rounds 1-4 is answered in S1-S14. Do not go looking for
an unresolved Supplement item; there is none.

## 2. Story sequence

Derived from what blocks what in the documents above, cross-checked against the restored Supplement
and the current code. Land each as its own PR; each should leave `npm test` green.

1. **Predefined-field vocabulary rename + migration (Supplement S1, `06-flows/predefined-field-migration.md`).**
   Rewrite `src/lib/registry/placeholder-catalog.ts`'s 12-key closed catalog (verified: `PLACEHOLDER_CATALOG`
   at `placeholder-catalog.ts:15-28`, `catalogValuesFromWeekly` at `:71`) into the new key names per
   the per-key mapping table in the flow doc, and write the one-time, numbered migration (gated by
   `settings.data_version`, AD-18/AD-21) that rewrites persisted `artifact_templates.payload` from old
   whole-element `placeholderKey` bindings to the new inline-token shape (AD-32) — the flow doc treats
   the vocabulary rename and the whole-element→inline-token shape change as **one migration**, not two;
   do not split it further than the doc does. The `reference`/`text` split is resolved **per slide
   identity** (`artifact_templates.id`), not by label — see §5. Do not invent `family_name` as a
   migration target — it never existed as a bound element; it is authored fresh (flow doc's explicit
   note). This migration touches Registry-owned canvas payloads only; the Hub-owned `familyYouth` /
   `familyPrayerRequest` / `youthPrayerRequest` normalize-on-read change (§5) is a separate, Hub-owned
   migration reported but not designed by the Registry corpus.
   Independent of everything else here — lands first because nothing downstream needs the old key
   names.

2. **Song Book bootstrap-once (DEC-005 / AD-36) together with the Save-to-Book route in the same
   release.** `.how/hub/06-flows/lyric-save-to-book.md` § Migration is explicit: these are **two changes
   that travel together in one numbered `data_version` step**, because the second is unsafe without the
   first — (a) `upsertHymns` (`src/lib/db/index.ts:66-83`, verified) becomes insert-only-if-absent
   (`ON CONFLICT DO NOTHING` or an existence check) gated by a per-book-code marker in `settings`,
   parallel to `ARTIFACT_REGISTRY_BOOTSTRAP_KEY` (AD-17); (b) `POST
   /api/services/[id]/song-sets/[variableName]/save-to-book` ships. The route MUST NOT ship ahead of
   (a): shipping it first, with the old unconditional `ON CONFLICT DO UPDATE SET title=excluded.title,
   lyrics=excluded.lyrics` reconcile still running, would let the very next restart silently discard an
   operator's saved lyric correction. No column change — `hymns(book_code, number, title, lyrics)` is
   unchanged; only write discipline changes.
   This pair has **no hard dependency on step 1 or on step 3** (`upsertHymns` and the `hymns` table are
   independent of `song_set_inputs` or the Registry's `variable_name` vocabulary), but it does gate step
   7 (the inline lyric editor's save-to-book button cannot ship before the bootstrap is live).

3. **N-configurable Song Set entries (AD-31, AD-33, Supplement S2).** The largest story — touches all
   six layers named in §3. Retires the fixed `song1Number..song4Number` model for an Admin-authored list
   of `(variable_name, title)` entries (new `base_type = 'song-set-entry'` rows in `artifact_templates`,
   verified in `.how/registry/05-model/data-model.md`), gives every entry a free-canvas Title/Verse/Reff
   trio shared across all entries (not per-entry skins — confirmed by Supplement S4 and contract
   `02-song-set-entries.md`), and replaces the fixed `internal/plan/plan.go` handlers with a loop over
   the Registry's live entry list. Must land before step 6 (background library) can mean anything, since
   `song_set_inputs.background_id` only exists once Song Set entries are a real list, and before step 7
   (inline lyric editor), which edits one entry's `song_set_inputs.lyric_override`.

4. **Nested Announcement Set storage (AD-35, AD-33).** Independent of step 3's internals but shares the
   same "own tables, not a discriminator on `artifact_templates`" design decision
   (`.how/registry/05-model/data-model.md` line 11-14). Retires the Hub-owned live Announcements master
   list (BR-11) for N Admin-authored, Registry-owned Announcement Sets (`announcement_sets` +
   `announcement_set_slides` tables, spliced into the main spine by an `ann-set-marker` row referencing
   `announcement_sets.id` — not a DB foreign key, code-enforced). Deleting a set still referenced by a
   live marker is **refused**, never cascaded (Supplement S13/R3, confirmed in
   `.how/registry/02-contracts/03-announcement-sets.md`). Can land in parallel with step 3 if the team
   splits work — neither reads the other's new tables — but both touch `src/lib/registry/store.ts`,
   `validate.ts`, and the Registry admin UI, so sequence them to avoid merge-conflict-heavy overlap.

5. **Inline `{token}` predefined fields (AD-32).** Depends on step 1 (the renamed vocabulary must exist
   first) but not on steps 3/4. Changes the canvas editor's text-element model so a `{key}` token can
   sit inside authored prose rather than owning a whole element, and changes hydrate/generate to
   substitute at token positions. An unrecognised token must never block generation (Supplement S5,
   AD-32, FR-30) — render it as empty text at generate time; the editor flags it only when the slide is
   saved, never at generate time.

6. **Background library + live switching (AD-33's blank Verse/Reff canvas, AD-34, S10/S11).** Depends on
   step 3 (Song Set entries must exist so `song_set_inputs.background_id` has something to attach to).
   Two halves: (a) Admin CRUD over an image-only Background Library with one global default
   (`.how/registry/02-contracts/04-background-library.md` — images only, S10; no colour/gradient value
   accepted, ever, not silently coerced); (b) the Operator's live in-session override over the
   presenter/projector channel (AD-10, `.how/presenter/02-contracts/02-present-channel.md` line 26,
   verified `[MISSING]` on `PresentMessage` today) — a new `background` variant mirroring the existing
   `transition`/`slide_transition` override shape (AD-23): resends on `sync`, never written to the
   Service payload, the Registry, or any table, and does not survive past the presenter session.

7. **Inline lyric editor + save-to-book (UC-28, Supplement S9/S12, FR-34).** Depends on step 2 (the
   bootstrap must already be live — `.how/hub/05-model/form-fields.md` line 62 states this route "MUST
   NOT ship ahead of" the AD-36 migration) and step 3 (edits one Song Set entry's
   `song_set_inputs.lyric_override`, which does not exist before step 3). Two levels, both from the same
   place in the UI (Supplement S12): editing the lyric text changes the deck for **this service only**
   by default (writes `song_set_inputs.lyric_override`); a separate, deliberate "Save to Song Book"
   button writes the edited text back to `hymns.lyrics` for every future service. That button MUST be a
   deliberate action, never a side effect of typing. The save-to-book write carries AD-6's precondition
   discipline: re-read the entry's current resolved `(book_code, number)` at the moment of the press and
   refuse with 409 if it moved (SCN-4 — `.what/hub/05-scenarios/SCN-4-lyric-save-to-book-race.md`).

8. **Copy/paste share-by-reference (BR-12, `.how/registry/06-flows/copy-paste-share-by-reference.md`).**
   Depends on steps 3 and 4 existing (there must be more than one list — Main spine, Announcement Sets —
   to copy between). Text/shape/style/geometry/tokens copy fully into the target list with new ids
   (verbatim payload, new id, position appended); image binaries share by reference (`url` string copied
   byte-for-byte, no re-upload); deleting a slide never deletes a still-referenced file. No cascade from
   a slide's delete to the uploads store or the Background Library.

**One ordering point the corpus does not settle and you should not either:** the flow doc for step 1
already treats the vocabulary rename and the inline-token shape change as one migration. If your PR
plan wants to split it into two smaller migrations instead, that is consistent with the documents —
pick whichever produces the smaller diff per PR and say so in the PR description.

## 3. Hardcode inventory

Every one of these must open up to admit an Admin-configurable list instead of a fixed count. Verified
against the current tree (line numbers may drift as you edit — re-grep before trusting a stale number
from this document once earlier stories have landed).

**The fixed four-song-slot model** (`song1Number`..`song4Number`) — hardcodes that must move together
(Supplement S2's own inventory table, re-verified against the tree):

- `src/lib/worship-form-fields.ts:6-9` (`WorshipFormFields` type), `:23-26` (`EMPTY_WORSHIP_FORM_FIELDS`),
  `:42-45,49-52,57-67` (`songNumbersFromParsed` — index mapping `buckets.bibleTalkHymns[0]`→song1,
  `[1]`→song2, `buckets.divineServiceHymns[0]`→song3, `[1]`→song4), `:112-115` (`buildFieldsPayload`),
  `:284-287` (`coerceHydrateFields`) — all enumerate exactly four fields by name.
- `internal/parse/fields.go:11-16` (`structuredKeys` slice, includes `familyYouth`) and the overlay loop
  at `:90` (`applySongOverlay`); `applySongOverlay` itself (`fields.go:260-296`) hardcodes `slot % 2`
  (`:265`) and `slot < 2` (`:266`, `:293`) to split 4 slots into 2-per-section (Bible Talk / Divine
  Worship).
- `internal/httpapi/services.go:744-753` — `fieldsFromParsed`'s response map returns `song1Number`
  through `song4Number` as empty strings unconditionally (verified content, not just line range).
- `src/lib/parsed-fields.ts:10` (`StructuredServiceFields` type), `:419-428` (`songSlots`, an explicit
  four-entry `{ key, slot }` table).
- `src/operator/CreateForm.tsx:569-582` (Bible Talk card, song1/song2) and `:643-656` (Divine Worship
  card, song3/song4); `src/operator/EditForm.tsx:601-614` (song1/song2) and `:675-688` (song3/song4) is
  a hand-duplicated copy of the same structure. These two files are the actual UI that must become a
  rendered list over the Registry's live Song Set entries.

**The three-kind `base_type` enum**, closed and enforced in three independent places — the Registry
corpus's target shape renames the persisted values to `general` / `song-set-entry` / `ann-set-marker`
(AD-31, `.how/registry/05-model/data-model.md` line 108), which is wider than a simple open-up of the
existing enum:

- `src/lib/registry/types.ts:2` (`ARTIFACT_BASE_TYPES`, still `['general', 'song-set', 'announcement']`)
  and `:11` (`ARTIFACT_ENTRY_KEYS`, same three values). `kindOf` (`types.ts:24-28`) already has a
  defensive `entryKey.startsWith('songset-')` branch (line 27) for a slot-identity vocabulary that does
  not exist anywhere else in the codebase yet — its own doc comment (`:8`, `:20-21`) calls this "Story
  20.7", a different, earlier story than this change set; treat it as speculative scaffolding to widen
  or replace, not evidence any part of this model shipped.
- `src/lib/registry/validate.ts:353` (`enforceBaseTypeRules`, exhaustive switch over the three current
  base types), `:417` (validates against `ARTIFACT_ENTRY_KEYS`), `:437` (`layoutKeys = new
  Set(['default','title','lyric'])`, the fixed 3-layout-key vocabulary this story must widen or replace
  for `song_set_layouts`' `role` values `title`/`verse`/`reff`).
- `internal/plan/plan.go:467,480` — two literal `tmpl.BaseType == "general"` checks gating the
  catalog-values hydration path.

**Whole-element `placeholderKey` binding** (AD-32 retires this shape for text elements):

- `src/lib/registry/types.ts` — `CanvasElement.placeholderKey?` field (used by `validate.ts:49` in the
  allowed-keys list).
- `src/lib/registry/validate.ts:241-245` (parses/validates `element.placeholderKey`) and `:336,345-347`
  (`enforceBaseTypeRules`'s placeholder-key-vs-catalog check) — this check's shape changes once a text
  element can carry inline tokens instead of one binding.
- `src/lib/registry/placeholder-catalog.ts` (note the `registry/` segment; the shorter path some
  docs cite does not exist) — `PLACEHOLDER_CATALOG` (`:15-28`, 12 old-vocabulary keys) is the exact target of
  Supplement S1's rename table, and `catalogValuesFromWeekly` (`:71`) is the per-key hand-written
  resolver that must be updated key-by-key alongside it.

**`internal/plan/plan.go`'s hardcoded hymn-choice handlers** — confirmed live at `plan.go:291-295`
(`bt-opening-song`, indexes `c.bibleTalkHymns[0]`), `plan.go:316-320` (`bt-closing-song`,
`c.bibleTalkHymns[1]`), `plan.go:341-345` (`ds-opening-song`, `*c.dsOpening`), `plan.go:391-395`
(`ds-closing-song`, `*c.dsClosing`). One case is already list-driven and needs no change:
`plan.go:354-359` (`case "song-set":` loops over `c.dsMiddle`, populated at `plan.go:194` as everything
between the first and last Divine Worship hymn) — only the four named opening/closing handlers are
fixed; the "middle" slot already tolerates any count. Story 3 replaces the four fixed handlers with one
loop over the Registry's live Song Set entry list; whether `dsMiddle`'s already-generic shape can be
reused or retired is an implementation choice, not a corpus mandate.

**One live cross-document inconsistency, verified, not yet resolved by any document:**
`.how/hub/05-model/form-fields.md:53` still reads `base_type = 'song-set'` for the Song Set group's
physical-shape description, while `.how/registry/05-model/data-model.md:108` and AD-31 give the new
persisted value as `'song-set-entry'`. Follow the Registry documents (they are the deeper,
more-recently-written design, and the Registry component owns `artifact_templates`) and fix the stale
Hub reference in the same PR that touches that file, or flag it to the document owner rather than
silently picking one without a trace.

## 4. The two-parser rule

`src/lib/lyrics.ts` and `internal/plan/lyrics.go` are hand-mirrored ports of the same lyric-splitting
logic — one TypeScript, one Go. Supplement S7 requires **each to carry a header comment naming the
other**, so that an edit to one is visibly incomplete until the other matches. **Verified again just
now: neither file has any such comment** (checked both files' full headers and grepped both files for
"mirror"/"counterpart"/the sibling filename — no hits in either). Add the header comment to both in the
same PR that first touches lyric-parsing logic under this change set; do not treat it as already
satisfied.

Supplement S7's rules L1-L6 are stated in the restored DEC-004 file itself — point at S7 there rather
than restating the rule text in code comments or PR descriptions:

- **L1** — refrain headers `Reff` (Indonesian) or `Chorus` (English), each with or without a trailing
  number, both accepted.
- **L2** — a refrain with its own body is used verbatim for the verse it follows; different refrains per
  verse are preserved, never collapsed to the first one seen.
- **L3** — a refrain header with no body inherits the nearest preceding non-empty refrain.
- **L4** — slide order follows the lyric database's own order; the parser does not rebuild sequence.
- **L5** — a blank line inside a section is a **hard slide break**. Also how the inline lyric editor
  (Supplement S9, UC-28) decides where slides break — no separate slide-splitting control is needed.
- **L6** — character-count splitting is **retired**. `CONTINUOUS_CHAR_BUDGET` (verified:
  `src/lib/lyrics.ts:96`, value `320`) and `maxLinesPerSlide` (verified: used throughout `lyrics.ts` and
  `internal/plan/lyrics.go`, e.g. `lyrics.go:92,226`) no longer govern anything; the lyric text alone
  decides slide breaks.

S7 also notes, and this is worth carrying into the PR description rather than re-deriving: of the 695
hymns in `data/song-book/sdah.json`, none currently use a numbered refrain header and none use a blank
line inside a section, so old hymns render unchanged after L1-L6 land — the new behaviour only appears
where lyrics are re-authored.

**`tests/lyrics.test.mjs` pins today's — soon to be wrong — behaviour.** Verified test names (9 flat
`test()`s at lines 16, 29, 40, 51, 60, 80, 95, 108, 122): `continuous join: terminal punctuation joins
with space`, `continuous join: punctuation before closing quote joins with space`, `continuous join: no
terminal punctuation joins with "; "`, `short verse fits budget as one slide`, `long verse splits into
multiple slides under char budget`, `chorus after every verse when refrain present`, `interleaved
refrain still expands Verse→Chorus for every verse`, `no chorus: verses only`, `preserveLineBreaks keeps
newlines instead of continuous join`. The three "continuous join" tests and the two "budget"/"splits"
tests exercise exactly the char-count/line-join behaviour L6 retires — expect to **rewrite these
assertions**, not extend them alongside the old ones. `chorus after every verse` and `interleaved
refrain` are closer to L2/L3's target shape already; check them against L1-L6 rather than assuming they
survive unchanged.

## 5. Migration boundaries

Every migration in this change set is an **explicit, numbered, one-time transition** under the single
`settings.data_version` counter (AD-21), running on the Go API's startup path, never a boot-time
reconcile (AD-18 forbids reaching persisted rows any other way). None of them may introduce a second
counter or a per-migration marker scheme.

- **Predefined-field key migration (Supplement S1, `.how/registry/06-flows/predefined-field-migration.md`).**
  Rewrites `artifact_templates.payload` from old whole-element `placeholderKey` bindings to the renamed
  key vocabulary in the new inline-token shape. Re-validates every converted row against AD-15 after
  conversion; an invalid row is logged and left in its pre-migration shape, never silently written.
  **The `familyText`/`youthText` split trap:** the legacy combined `familyYouth` Hub-side value (a
  `parsed_data` JSON key, not a Registry payload key) renames to `family_request` as-is, exactly once,
  via Hub's existing normalize-on-read pattern (`normalizeParsedRundown()`, per
  `.how/hub/05-model/data-model.md` § Migration — Family/Youth split); `family_name` starts **empty** —
  it is a new authored field, not a migration target, because no source value for it ever existed. The
  Registry-owned migration (`artifact_templates.payload`) and this Hub-owned `parsed_data` migration are
  two separate changes; the Registry corpus explicitly reports the Hub one without designing it.
- **The `reference`/`text` predefined-field disambiguation is keyed by `artifact_templates.id` — never
  by the editable label.** Confirmed by the flow doc's own Disambiguation section (owner ruling,
  2026-08-20): the `verse-reading` slide (seed line ~331) becomes `scripture_reference`/`scripture_text`;
  the `bible-verse-contemplation` slide (seed line ~804) becomes `theme_reference`/`theme_text`. Any
  other (custom) slide carrying the old `reference`/`text` keys migrates to
  `scripture_reference`/`scripture_text` **and is flagged `needs-review: true`** — this flag applies
  only to the third case, never to the two known shipped slides. Treat the flag as mandatory, not
  optional polish.
- **Song-book bootstrap change (AD-36, DEC-005).** No schema/column change — `hymns(book_code, number,
  title, lyrics)` is unchanged. Only the write discipline around `upsertHymns`
  (`src/lib/db/index.ts:66-83`, verified) changes: unconditional `ON CONFLICT DO UPDATE SET
  title=excluded.title, lyrics=excluded.lyrics` becomes insert-only-if-absent, gated by a per-book-code
  marker in `settings` parallel to `ARTIFACT_REGISTRY_BOOTSTRAP_KEY` (AD-17). Must land in the same
  numbered `data_version` step as the save-to-book route (§2, step 2).
- **New Registry tables — all currently `[MISSING]`, i.e. genuinely new (verified against
  `.how/registry/05-model/data-model.md`):** `song_set_layouts` (`role` TEXT PK ∈
  `title`/`verse`/`reff`, exactly 3 rows forever, seeded once, never added to or removed from),
  `announcement_sets` (`id`, `label`, `updated_at`), `announcement_set_slides` (`id`, `ann_set_id`,
  `label`, `payload`, `updated_at`, `seed_hash`, `position` — no DB FK on `ann_set_id`, code-enforced
  only), `background_library_images` (`id`, `url`, `is_default` with at most one `=1`, `created_at`,
  `updated_at`), `song_books` (`book_code` PK, `name`, `is_default`, `updated_at`). Plus the AD-16-style
  freeze targets: `service_announcement_set_slides` (keyed `(service_id, ann_set_id, slide_id)`) and
  `service_song_set_layouts` (keyed `(service_id, role)`) — **the shared Title/Verse/Reff trio is frozen
  into a per-service snapshot at create/Sync time**, per an explicit owner reversal (2026-08-20, recorded
  in Supplement S13/R4 and in the data-model doc) of an earlier draft that would have read it live at
  generate time. Do not build the live-read version; the frozen-clone version is current design.
- **New Hub table — `song_set_inputs` (planned, genuinely new, per `.how/hub/05-model/data-model.md`):**
  `service_id` FK (cascade), `variable_name` TEXT (soft reference to the Registry's identity — **not a
  DB foreign key**), `song_number` INTEGER NULL, `song_book_code` TEXT NULL, `background_id` TEXT NULL,
  `lyric_override` TEXT NULL, `updated_at`. PK `(service_id, variable_name)`; writes are upsert, never
  insert-only. A one-time migration copies each existing Service's four positional hymn overlays into
  four rows keyed by the seed's default `variable_name`s (`opening_song_bt`, `closing_song_bt`,
  `opening_song_dw`, `closing_song_dw`) — a no-op, never a crash, if the Registry has not seeded exactly
  those four names by the time this runs. The data-model doc itself marks this copy as an **assumption**
  ("smallest reasonable choice, not owner-confirmed") — if your implementation needs to harden this into
  something hard to reverse, ask first (§8).
- **`announcement_items` (the old Hub-owned flyer list table) is retired from the API but the table
  itself must not be dropped in the same change** that retires the endpoint. Its residual role — image
  files on disk some rows may still reference — is an AD-8 concern, not a table-lifecycle one; drop the
  table only in a later, separate numbered migration once nothing reads it, and stop Hub's delete-Service
  cascade from touching it the moment the API retires.
- **AD-17's bootstrap-once discipline extends to the new tables the same way it already governs the
  registry**: nothing may silently resurrect a deleted row by re-reading a seed or a corpus file. A gap
  in `song_set_layouts`, `announcement_sets`, or `hymns` after their bootstrap has run is never
  auto-filled — only an explicit administrator action or a further numbered migration touches it.

## 6. Guardrails from AGENTS.md — non-negotiable

**Public-repository pre-commit ritual** (full text: `.constitution/project/public-repository.md`).
Before every `git commit` and every `git push`:

1. Never stage `.env*`, `data/local/`, `data/uploads/`, `data.db*` / `data.*.db*`, `slides*/`, `*.pptx` /
   `*.potx`, or any real congregation / payment / production-host data. This change set adds new tables
   holding weekly content (`song_set_inputs.lyric_override`, background images, Announcement Set
   slides) — none of it, and none of its seed/fixture data, may carry real names, photos, prayer
   requests, or payment details. Use a synthetic congregation for every example, exactly as the existing
   seed does.
2. Run `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/public-repo-guard.test.mjs`
   (or the full `npm test`) before every commit and push.
3. On failure, fix the tracked content — **never weaken the guard test**.

**Absence-guard proof rule.** A test asserting something is *absent* — a deleted slide does not
reappear, an unused song slot leaves no residue, an old `placeholderKey` binding is gone after
migration, `CONTINUOUS_CHAR_BUDGET` no longer governs anything (L6) — is worth nothing until it has
been seen to fail. For every new or changed absence-guard in this change set: inject the defect the
guard claims to catch, confirm the guard goes red, then revert the injection and confirm it goes green
again. Do this for **every form** the guard claims to cover, not just the first one you think of. Do not
narrow a guard to silence a false positive without re-proving it afterward.

**Testing convention (AD-21).** `node:test` with `--experimental-strip-types`, over the explicit file
list in `package.json`'s `scripts.test`. A new suite must be added to that list **in the same change
set** that introduces it — an unregistered test file never runs, locally or in CI, and nothing detects
the omission.

## 7. Out of scope for this change set

- **The orphan-asset purge Admin tool.** DEC-004's Cost section and
  `.how/registry/06-flows/copy-paste-share-by-reference.md`'s own Guarantees section both defer this
  explicitly: copy/paste shares image binaries by reference, and deleting a slide never deletes a file
  another slide still uses — but finding and deleting genuinely unreferenced ("orphan") assets is a
  later Admin tool, not part of any story above. Do not build a cleanup mechanism as a side effect of the
  copy/paste story (§2, step 8).
- **Endpoint numbering for the two new proposed Hub routes** (`PUT /api/services/[id]/song-sets` and
  `POST .../save-to-book`) has no row yet in `.how/_platform/inventory-api.md` — out of this change
  set's scope, belongs to the platform/blueprint owner.
- **`BR-10`**, referenced alongside BR-11's retirement in `.how/hub/02-contracts/02-services.md`, is a
  cross-component rule Hub does not own and cannot amend on its own — leave it as reported drift.
- **A per-row "administrator has touched this" flag for `hymns`** — DEC-005's own Alternatives
  Considered section explicitly rejects a per-row touched/untouched distinction in favour of a
  whole-table-after-bootstrap rule. Do not build a finer-grained ownership model than the decision asks
  for.
- **A "correct this song book's name" write path** — AD-36 names it as a future write path that would
  carry the same AD-6 precondition discipline "though none ships yet." Not part of this change set.

## 8. How to ask

Do not invent a product answer where the corpus is silent, contradictory, or marked `[ASSUMED]` /
`[NEEDS CONFIRMATION]` in a way that matters to what you are about to build. Concretely:

- Supplement S15 states every question from rounds 1-4 is answered — do not treat a gap you notice
  during implementation as evidence of an unanswered Supplement; re-read S1-S14 first, since the answer
  is very likely already there (e.g. under a section number you did not expect, like S2 covering the
  hardcode inventory or S13 covering the `reference`/`text` split).
- If an Evidence table in one of the SDDs marks something `[ASSUMED]` (e.g. the `song_set_inputs`
  four-row backfill in `.how/hub/05-model/data-model.md` § Migration, explicitly flagged as "not
  owner-confirmed") and your implementation would harden that assumption into something hard to reverse
  (a unique index, a migration that depends on the assumption being true), ask before committing to it.
- If two documents disagree — the `'song-set'` vs `'song-set-entry'` `base_type` value between
  `.how/hub/05-model/form-fields.md:53` and `.how/registry/05-model/data-model.md:108` (§3 above) is the
  one live example found during this rewrite — and the disagreement is not already resolved by a note
  in one document pointing at the other as authoritative, ask rather than picking a side silently.
- Route a genuine open question through `wdi-question` (four lists in `.control/questions/`, default
  class `assumptions.md`) if you are working inside the WDI Method workflow; otherwise raise it directly
  with whoever is supervising this implementation. Do not ship code that encodes a guessed answer to a
  question the corpus explicitly left open.
