---
type: flow
component: registry
realizes: [UC-24, UC-14]
risky: true
created: 2026-08-20
---

# Flow — Song Set physical-shape migration (DEC-004, AD-31/AD-33)

## Realizes

AD-31's collapse of the four fixed `songset-*` slots into an Admin-configurable list of
`song-set-entry` rows, and AD-33's extraction of one shared Title/Verse/Reff canvas trio out of
those rows and into its own table (`song_set_layouts`). A **numbered, one-time migration on the
startup path** (AD-18), gated by `data_version` (AD-21) — never a reseed (AD-17 forbids overwriting
authored content). This is the migration the kernel's Evidence table and AD-18 compliance row
already assert exists; until this document, nothing designed it.

## Scope — what this migration owns, and what it does not

This migration rewrites **Registry-owned rows in `artifact_templates`** whose `base_type` is the
old singular `'song-set'` (`src/lib/registry/types.ts:2-11`), and populates the new
`song_set_layouts` table (AD-33, `05-model/data-model.md`). It does not touch
`service_registry_snapshots` — per AD-18's own governing rule ("a migration operates on the live
registry and does not rewrite service snapshots... an older snapshot may therefore stop being
renderable, which AD-16 accepts") — a pre-existing service's frozen rows are left exactly as they
are; see *Existing service snapshots*, below. It does not touch Hub's `internal/plan/plan.go`
`case "song-set":` loop over `c.dsMiddle` — that Go-side retirement of the old "repeat one generic
template N times for the Divine Service's middle songs" mechanism is Hub-owned (`.how/hub/**` is
out of this component's scope fence) and is **reported, not designed here**: see this component's
G4 handover.

## What exists today — verified, not assumed

Verified against `src/lib/registry/types.ts:2-29`, `data/default-registry.json`, and
`internal/plan/plan.go:354-359` (2026-08-20):

- `ARTIFACT_BASE_TYPES` / `ARTIFACT_ENTRY_KEYS` carry a **singular** `'song-set'` — not the
  `songset-*` per-slot identities the code's own comment anticipates ("Story 20.7 extends this
  with `songset-*` slot identities"); that extension was never built. Every song-set row's
  `base_type` in the shipped seed reads literally `"song-set"`, distinguished only by its `id`.
- The shipped seed carries **five** `base_type: "song-set"` rows, not four:

  | Spine position | `id` | `label` | Fixed slot in `plan.go`? |
  | --- | --- | --- | --- |
  | 4 | `bt-opening-song` | Bible Talk Opening Song | Yes — `case "bt-opening-song"`, `c.bibleTalkHymns[0]` |
  | 9 | `bt-closing-song` | Bible Talk Closing Song | Yes — `case "bt-closing-song"`, `c.bibleTalkHymns[1]` |
  | 15 | `ds-opening-song` | Divine Service Opening Song | Yes — `case "ds-opening-song"`, `c.dsOpening` |
  | 20 | `song-set` | Divine Service Song Set | **No** — `case "song-set"` loops `c.dsMiddle` (0..N hymns), reusing this one template id per iteration (`plan.go:354-359`) |
  | 25 | `ds-closing-song` | Divine Service Closing Song | Yes — `case "ds-closing-song"`, `c.dsClosing` |

  The task brief that opened this design names "four fixed slots"; the fifth (`id: "song-set"`) is
  a genuine finding, not an oversight to fold silently into the four — DEC-004 S2 itself hints at
  it, naming `song_service_1` beside the four defaults as an example of an entry beyond the
  default seed. This migration treats it on its own terms (see *Migration steps*, step 4).
- Every one of the five rows' `title` and `lyric` layouts is **byte-identical** to the others
  (verified by hashing each row's serialised `layouts.title` and `layouts.lyric`,
  2026-08-20) — there is no divergence to reconcile in the shipped seed. A live database an
  administrator has since customised may differ; the algorithm below does not assume identity, it
  verifies it (*The hardest question*, step 1).
- Today's layout has exactly two authored surfaces per row — `title` (`hymnNumber` +
  `songTitle` placeholders) and `lyric` (`label` + `lyrics` placeholders, one canvas reused for
  every verse and refrain slide by swapping the values, not the layout). There is **no** third,
  independently-authored `reff` surface today — AD-33's three-way Title/Verse/Reff split is new.
- `artifact_templates` (SQLite, `src/lib/db/index.ts`) is the only live store today; no
  `song_set_layouts`, `service_song_set_layouts`, or any of the other four AD-33/AD-35 tables
  exist yet (`[MISSING]` throughout the SDD Evidence table).

## Target shape (05-model/data-model.md, restated for this migration's own logic)

- `artifact_templates` rows that were `base_type = 'song-set'` and are **kept** become
  `base_type = 'song-set-entry'`, gain a `variable_name`, and their `payload` column is set to
  `NULL` — a `song-set-entry` row carries no canvas of its own (AD-33; the data dictionary is
  explicit that `payload` is `NULL` for this kind).
- One shared `song_set_layouts` table holds exactly three rows (`title` / `verse` / `reff`),
  authored once, referenced by every `song-set-entry` regardless of how many exist (AD-33).
- Every Service gets its own frozen copy in `service_song_set_layouts`, cloned at creation /
  Sync exactly as `service_registry_snapshots` already clones the spine (AD-16, reversed
  2026-08-20 — the trio is frozen, not read live).

## Default seed variable names (owner-fixed, DEC-004 S2)

| Existing `id` | New `base_type` | `variable_name` |
| --- | --- | --- |
| `bt-opening-song` | `song-set-entry` | `opening_song_bt` |
| `bt-closing-song` | `song-set-entry` | `closing_song_bt` |
| `ds-opening-song` | `song-set-entry` | `opening_song_dw` |
| `ds-closing-song` | `song-set-entry` | `closing_song_dw` |

These four are the mapping for rows the migration recognises by fixed `id` — the shipped, unmoved
identities DEC-004 S2 names directly. Any other live `base_type = 'song-set'` row (an
administrator's own copy-pasted song-set row, `06-flows/copy-paste-share-by-reference.md`; or the
seed's own fifth row, `id: "song-set"`) is handled by the general rule in *Migration steps*, step 4,
never folded into this table.

## The hardest question — how the shared trio is derived from what exists

Today every song-set row carries its **own** `title` and `lyric` layout content; the new model has
**one** shared trio for every entry. The candidates are not equal by convenience alone — the
migration must pick one deterministically, verify the others agree, and flag rather than guess
where they do not.

**Rule: the live `base_type = 'song-set'` row with the lowest spine `position` is the trio's
source.** In the shipped seed that is `bt-opening-song` (position 4) — this is a property of spine
order, not a hardcoded id, so it holds however an administrator has since reordered, added, or
deleted song-set rows before this migration runs.

1. **Divergence check, before any write.** For every *other* row in the snapshot, compare its
   `layouts.title` against the source row's `layouts.title` (structural equality, not byte
   equality — coordinates and styles, ignoring nothing), and the same for `layouts.lyric`. A row
   in the snapshot with **no** `layouts.title` or no `layouts.lyric` at all counts as diverging on
   that layout, exactly like one whose content differs — a missing layout is not silently treated
   as "nothing to compare" and skipped. In the shipped seed every row agrees and none is missing
   either layout (verified, above), so this check passes silently on a fresh install. On a live
   database where it does **not** agree, the migration does not silently prefer the lowest-position
   row and discard the rest: it still writes the lowest-position row's content as the trio (a
   decision has to land somewhere, and "lowest spine position" is stated and stable), but every
   disagreeing row's `id` and which layout (`title`/`lyric`) diverged is logged with
   `needs-review: true`, in the same spirit as the sibling S1 migration's `reference`/`text`
   disambiguation flag — an administrator is told exactly which entry's authored content did not
   survive verbatim into the new trio and can re-author Verse/Reff/Title by hand afterward if the
   lost divergence mattered.
2. `song_set_layouts.title.payload` ← the source row's `layouts.title` (no shape conversion needed
   today — `title`'s only placeholders, `hymnNumber` and `songTitle`, are song-set expansion keys,
   out of S1's scope, and AD-33 makes Title a free canvas exactly as before), with its bindings
   renamed per *Vocabulary carried into the trio*, below.
3. `song_set_layouts.verse.payload` ← the source row's `layouts.lyric`, same treatment.
4. `song_set_layouts.reff.payload` — **no independent `reff` layout has ever existed**; today's
   single `lyric` canvas is reused for every verse *and* every refrain slide by swapping the
   `label`/`lyrics` values at generate time, never authored separately. There is nothing in the
   corpus to migrate `reff` from. **Assumption (stated, not hidden):** `reff` is seeded as a copy
   of the just-derived `verse` payload before its own rename — same starting canvas an
   administrator can then diverge from Verse by editing it, which is exactly the capability AD-33
   adds. This is a migration-time *seed*, not a *migrated value* — there is no prior `reff` value
   for AD-17's reseed prohibition to protect.

## Vocabulary carried into the trio

`Song-set expansion keys are not Predefined Field Catalog keys`
(`.what/registry/03-domain/domain-model.md:25`), and S1's own flow explicitly excludes them from
its per-key mapping — nobody's migration renamed them until now. This migration is their only
owner, and does the rename as it writes the trio (DEC-004 S2's translation table,
`.control/decisions/DEC-004-nested-artifact-registries.md:352-354`):

| Old element binding | Trio role | New binding | Note |
| --- | --- | --- | --- |
| `hymnNumber` | `title` | `song_number` | Rename only, same element |
| `songTitle` | `title` | `song_title` | Rename only, same element |
| `label` | `verse` | `verse_number` | Rename only, same element. `verse_total` (DEC-004's other half of the `label` split) has no authored element today and gets none — it is system-computed at hydrate time from the Song Book lookup, not an authored value, so there is nothing for this migration to create or migrate for it |
| `lyrics` | `verse` | `verse_content[]` | Rename only, same element |
| `label` (on the cloned `reff` copy) | `reff` | — | **Dropped, not renamed.** A refrain carries no verse number; the clone's `label` element loses its placeholder binding and becomes plain static text (empty by default), left for the administrator to author or delete — DEC-004's mapping table gives `label` no `reff`-side target, so there is nothing to rename it to |
| `lyrics` (on the cloned `reff` copy) | `reff` | `reff[]` | Rename only, same element |

Every rename above is a key-name change on an existing element's `placeholderKey`, not a shape
change — AD-32's inline-token shape governs the Predefined Field Catalog specifically and song-set
expansion keys are outside that catalog (same domain-model.md line), so the element stays a
whole-element binding exactly as it is today; nothing here reopens AD-32.

## Migration steps

This migration is one step under AD-21's single `data_version` counter (3→4), run in the Go API's
startup sequence after schema DDL (AD-9) creates the five new tables (`song_set_layouts`,
`announcement_sets`, `announcement_set_slides`, `background_library_images`, `song_books`) and
before this migration reads any of them. The numbered list below is this one step's own internal
sequence, not a second counter.

The whole pass — reads, the trio derivation, every row conversion/removal, and the version bump —
runs inside **one** SQLite transaction (`BEGIN`/`COMMIT`), the same discipline AD-6's precondition
writes already use elsewhere in this component, so a crash between any two writes below leaves no
partial state (step 6's `COMMIT` is the only moment any of it becomes durable). Two distinct
failure classes inside that one transaction are **not** treated alike: the trio (step 3) is a hard
dependency for every entry that will ever reference it, so a trio that fails AD-15 re-validation
aborts the **whole** transaction — no `song_set_layouts` half-written, no rows converted against a
trio that does not exist. A single row failing its own re-validation in step 4, by contrast, is a
**controlled skip** — that one row's write is simply omitted from the transaction (logged, left in
its pre-migration shape) while every other row's write and the trio still commit; it is not treated
as a reason to abort the whole step.

1. On startup, before serving traffic, the Go API checks `settings.data_version` (AD-21;
   `src/lib/registry/seed.ts` currently reports `CURRENT_DATA_VERSION = 3`).
2. If this migration's version has not yet run: read every live `artifact_templates` row where
   `base_type = 'song-set'` (old vocabulary), ordered by `position` ascending, into an **in-memory
   snapshot** — every later step reads this snapshot, never a fresh `SELECT`, so a row whose
   `payload` step 4 nulls out later in this same pass is still available in full for the trio
   derivation and the divergence check that read it earlier in program order.

   **Zero live `song-set` rows.** If the snapshot is empty, this migration **refuses** rather than
   guesses: there is no candidate to derive the mandatory `song_set_layouts` trio from, and AD-33's
   invariant ("exactly 3 `song_set_layouts` rows exist at all times") cannot be satisfied by
   invention. The whole transaction is rolled back, `data_version` is **not** bumped, and the
   condition is logged plainly ("no live song-set row to migrate from") so an administrator sees
   why every boot keeps retrying it. This is expected to be unreachable in practice — AD-17's
   bootstrap always seeds at least the shipped five — and is stated here only because "every live
   row was deleted by hand before this ships" is a real, if remote, precondition to close off
   rather than leave undefined.
3. Apply the trio-derivation rule (below) against the **snapshot**: write `song_set_layouts`
   (`title`, `verse`, `reff`). This happens **before** any row in the snapshot is converted or
   removed, precisely so the source row's own conversion (step 4) can never race its own
   derivation — the trio is fixed from the read-only snapshot regardless of what step 4
   subsequently does to that same row, including a conversion that step 5 later rejects.
4. Partition the snapshot and write each row:
   - The (up to four) rows whose `id` matches the Default seed variable names table above →
     convert in place: `base_type = 'song-set-entry'`, `variable_name` set per the table,
     `payload = NULL`, `seed_hash = NULL` (nothing left to Reset — AD-33 retires the per-row Reset
     semantics for this kind), `label` and `position` unchanged. Fewer than four may be present (an
     administrator may already have renamed or deleted one before this migration runs); the
     migration converts whichever of the four it finds and does not manufacture the others —
     **zero surviving `song-set-entry` rows after this step is an accepted end state**, not a
     failure: AD-31 already treats the count of Song Set entries as administrator-owned ("Admin
     adds, renames, and removes entries directly"), and the trio itself was already safely derived
     in step 3 regardless of how many (or how few) entries survive to reference it.
   - The seed's own `id: "song-set"` row, if present in the snapshot — the generic "repeat this
     template once per middle song" mechanism (`plan.go:354-359`, `c.dsMiddle`), not a fixed slot
     with a Service-facing identity of its own. It is **not** converted into a `song-set-entry`: it
     is removed from `artifact_templates`, exactly as AD-17's fail-closed discipline already treats
     a retired kind — an explicit, logged, numbered removal, never a silent drop. Its retirement
     pairs with the Hub-side removal of the `case "song-set":` loop (out of scope, reported above);
     this half — the row disappearing from the live registry — is this migration's to make.
   - Any other live `song-set` row in the snapshot — an administrator-added custom row under a
     self-chosen `id` (a copy-pasted entry, `06-flows/copy-paste-share-by-reference.md`) — is
     treated like the generic row for conversion purposes: it becomes a `song-set-entry`, but has
     no natural default `variable_name`. The migration derives one from its `label`
     (lower-`snake_case`, ASCII-folded, truncated to 40 chars), seeding its de-duplication set with
     the four reserved names above **and** every `variable_name` already live on the spine before
     this pass began — a derived name is never allowed to collide with a reserved default or an
     existing entry, only with another derived name in the same pass (`_2`, `_3`, … on that
     narrower collision). A label that folds to an empty string (no ASCII-representable
     characters — e.g. emoji-only, or a script with no ASCII transliteration) falls back to
     `song_set_entry_<id>` using the row's own stable `id`, so the derivation never produces a
     blank or invalid identifier. Every derived row sets `needs-review: true` so the administrator
     confirms or renames it — a machine-derived identity is not treated as equivalent to DEC-004's
     owner-named four.
5. Every row written in step 3 or step 4 is re-validated under AD-15 before being written; a row
   that fails re-validation is **not** written — it is logged (id + reason) and left in its
   pre-migration shape, the same fail-closed posture the sibling S1 migration and AD-17 already
   take. Because the trio (step 3) is derived from the snapshot rather than from a row's
   post-conversion state, a row conversion (step 4) failing re-validation never invalidates or
   changes the trio already written for it.
6. `settings.data_version` is bumped once, atomically with every write in this step (the same
   transaction), so it never runs twice and never re-touches a row an administrator has since
   re-authored under the new shape.

**Concurrent boot.** Two Go API processes racing this migration against the same SQLite file is
not a new hazard this migration introduces — AD-4 already forbids running multiple API processes
against one `DB_PATH` project-wide, and this migration adds no exception to that rule. It is not
re-solved here.

**Interaction with S1.** After this migration completes, four rows carry `payload = NULL` and one
row is gone. S1's own per-row scan (`06-flows/predefined-field-migration.md`, step 2) parses
`payload` looking for the old whole-element `placeholderKey` shape; a `NULL` payload has nothing to
parse and is treated as **nothing to migrate for that row**, not a parse failure to log — the same
distinction S1 already draws between "does not parse" (logged) and "already in the new shape, or
has no payload at all" (silently skipped, since there is no old shape left to find).

### Existing service snapshots

A `service_registry_snapshots` row cloned before this migration ran still carries the **old**
shape — `base_type = 'song-set'`, its own embedded `title`/`lyric` payload — because AD-18's own
rule forbids a migration from rewriting service snapshots: *"a migration operates on the live
registry and does not rewrite service snapshots... an older snapshot may therefore stop being
renderable, which AD-16 accepts."* This migration honours that literally: it does **not** touch
`service_registry_snapshots`, and it does **not** backfill a `service_song_set_layouts` row for a
pre-existing service either — there is no prior per-service trio to backfill from, and inventing
one would be exactly the kind of migration-time authorship AD-17 forbids.

The consequence, stated rather than left implicit: a service created before this migration keeps
rendering from its own old-shape snapshot rows precisely as it always did — self-consistent, not
broken, because the old shape was always self-sufficient (each entry carried its own layout). It
gains nothing from the new shared trio and needs nothing from it. Only an explicit **Sync
Artifact** on that service (AD-16) reaches the new shape: Sync re-clones the live spine (now
`song-set-entry` rows with `variable_name`s) **and** freezes the live `song_set_layouts` trio into
a fresh `service_song_set_layouts` row for that service, in the same transaction — ordinary
post-migration Sync behaviour (`04-components/LC-15-store.md`), not a special migration-time step.
Hub's plan builder (LC-16) necessarily reads both shapes side by side until every pre-existing
service has been synced; that reconciliation is Hub-owned and reported, not designed, here (Scope,
above).

## Sequencing against the S1 vocabulary migration

**This migration runs first** (`data_version` 3→4); the Predefined Field vocabulary migration
(Supplement S1, `06-flows/predefined-field-migration.md`) runs second (4→5).

Reasoning:

- The two migrations are not textually coupled — S1's own per-key mapping table explicitly
  excludes every song-set expansion key (`hymnNumber`, `songTitle`, `label`, `lyrics`): "Song-set
  expansion keys... are not migrated by this flow." Running either one first leaves the other's
  precondition untouched — no ordering is forced by data dependency.
- Where a tie-break is needed, structural-shape migrations precede vocabulary/content migrations,
  the same ordering AD-9 already gives schema-before-value evolution project-wide (the bible
  corpus reconcile is explicitly placed "after data migrations" for the same reason — a later step
  should not observe a shape a still-pending earlier step has not yet settled).
- Running this migration first also **shrinks** S1's own workload: after this step, four of the
  five former song-set rows carry `payload = NULL` and the fifth is gone, so S1's per-row payload
  scan (`06-flows/predefined-field-migration.md`, step 2 — "for every `artifact_templates` row,
  parse `payload`") has strictly fewer elements to walk, for no cost, since S1 was already skipping
  every song-set key by name.
- Nothing in either flow requires the reverse order; this is a stated design choice, not a
  discovered constraint, and it is recorded here as one so a future migration is sequenced against
  a known, explained order rather than an arbitrary one.

`src/lib/registry/seed.ts`'s `CURRENT_DATA_VERSION` moves from `3` to `5` across both steps, run in
the same startup pass, each bumping the counter once as it completes (AD-21 forbids a version
being claimed before its writes land).

## Sequence diagram

```mermaid
sequenceDiagram
  participant API as Go API (startup)
  participant S as settings
  participant D as artifact_templates
  participant T as song_set_layouts
  API->>S: read data_version
  alt migration (v3->v4) not yet applied
    API->>API: BEGIN transaction
    API->>D: SELECT base_type='song-set' ORDER BY position (in-memory snapshot)
    alt snapshot is empty
      API->>API: ROLLBACK; log "no live song-set row to migrate from"; data_version NOT bumped
    else at least one row
      API->>API: pick lowest-position row as trio source; diff every other row's title/lyric against it (missing layout counts as diverging)
      API->>T: INSERT title, verse (from source); reff (cloned from verse); rename bindings per vocabulary table
    loop each song-set row (from snapshot)
      alt id matches one of the four default seeds
        API->>D: UPDATE base_type='song-set-entry', variable_name=<seed map>, payload=NULL
      else generic "song-set" id (plan.go dsMiddle loop)
        API->>D: DELETE row (retired; layout already consumed as trio source)
      else admin-added custom song-set row
        API->>D: UPDATE base_type='song-set-entry', variable_name=<derived, needs-review>, payload=NULL
      end
      alt re-validation (AD-15) fails
        API->>API: log id + reason; leave row untouched; skip this row's write
      end
    end
    API->>S: bump data_version to 4
    API->>API: COMMIT transaction
    end
  else already applied
    API->>API: skip
  end
```

## Failure modes

| Hop | Failure | System does | Safe to retry |
| --- | --- | --- | --- |
| A song-set row's payload does not parse at all | Logged, left untouched (kept as `base_type='song-set'`, old shape); `data_version` still bumps once the pass completes | Admin fixes or re-authors the row by hand afterward; migration does not re-run for it | Yes |
| Converted `song-set-entry` row fails AD-15 re-validation (e.g. `variable_name` collides with a live entry already assigned in this same pass) | Logged, left as `base_type='song-set'` | An administrator resolves the collision by hand (rename one entry); a future boot does not retry this row automatically | Restart is safe for every other row; this row stays pending |
| Trio write (`title`/`verse`/`reff`) fails AD-15 re-validation | The whole migration step is refused for this data_version transition — a trio with an invalid canvas is worse than no trio, since every song-set-entry depends on the one shared trio existing | Investigate the source row's payload directly; this is expected only if the shipped seed itself were corrupted | Yes — `data_version` has not bumped, next boot retries the whole step |
| Process crashes mid-migration | `data_version` has not bumped yet, so the next startup re-runs the whole pass; a row already converted to `song-set-entry` (`payload=NULL`) is idempotent to re-visit because the runner filters on `base_type='song-set'`, which that row no longer is | Yes — restart is safe |
| Divergence found between the trio source and another live song-set row's `title`/`lyric` | Migration proceeds with the lowest-position row's content (stated rule); the diverging row's `id` and which layout diverged is logged with `needs-review: true` | Not a failure — a flagged, deterministic choice; administrator reviews afterward |
| A custom song-set row's derived `variable_name` collides with another custom row's derived name in the same pass | De-duplicated by appending `_2`, `_3`, … in scan order; both rows get `needs-review: true` | Not a failure — administrator renames either entry afterward, an ordinary UC-24 edit |
| A pre-existing service's `service_registry_snapshots` rows are read by Hub's plan builder before that service has synced | Renders from the old per-entry embedded payload exactly as before — no `service_song_set_layouts` row exists for it and none is expected until Sync | Not a failure — see *Existing service snapshots*, above |
| Zero live `base_type='song-set'` rows exist when this step runs (every one already deleted by hand) | Refused: whole transaction rolls back, `data_version` not bumped, logged "no live song-set row to migrate from" | Yes — every boot retries until at least one live song-set row exists again (e.g. Reset, or an admin re-authors one) |
| A candidate row in the divergence check has no `layouts.title` or no `layouts.lyric` at all | Treated as diverging on that layout, same as differing content — logged with `needs-review: true`, never silently skipped | Not a failure — a flagged, deterministic choice |

## Guarantees

Every song-set entry an administrator relied on before this migration keeps rendering after it —
under its new `song-set-entry` shape if it was one of the four (or a custom) fixed identities, or
via its still-untouched old-shape service snapshot if the service predates the migration. No
authored content is silently discarded: the one row whose content is dropped from the live spine
(the generic `id: "song-set"` row) is verified byte-identical to the trio actually kept, and any
live divergence found elsewhere is flagged, never silently overwritten. The migration runs at most
once (AD-21), in a fixed, stated order relative to S1 (this migration first). Hub's own retirement
of the `case "song-set":` middle-song loop is **not** touched by this flow and needs its own
change, reported separately (see Scope, above).

## Assumptions made

Each is argued in full where it is first made; this list is the index, not a second telling.

- `reff` seeded as a copy of `verse`, not migrated from any prior value (*The hardest question*,
  step 4).
- Trio-source tie-break is "lowest live spine `position`" (*The hardest question*, opening rule).
- A custom row's derived `variable_name` is a `needs-review` placeholder, never presented as
  settled (*Migration steps*, step 4, third bullet).
- This migration precedes S1, `data_version` 3→4 then 4→5 (*Sequencing against the S1 vocabulary
  migration*).
