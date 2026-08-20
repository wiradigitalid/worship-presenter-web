---
type: course-correction
id: DEC-005
status: applied
touches:
  - .how/_platform/ARCHITECTURE-SPINE.md
  - .how/hub/02-contracts/02-services.md
  - .how/hub/02-contracts/05-hymns.md
  - .how/hub/05-model/data-model.md
  - .how/hub/06-flows/lyric-save-to-book.md
  - .how/hub/SDD-hub.md
  - .what/hub/02-rules/rules-hub.md
  - .what/hub/03-domain/state-machines.md
  - .what/hub/04-usecases/UC-28-correct-song-lyrics.md
  - .what/hub/05-scenarios/SCN-4-lyric-save-to-book-race.md
  - .control/registry/requirements.yaml
  - .control/registry/usecases.yaml
supersedes: AD-25
superseded_by: null
created: '2026-08-20'
---

# DEC-005 — Song-book data is administrator-owned after a one-time bootstrap; the corpus file is a seed, not a projection

## Decision

> **The `hymns` table becomes authored data after its one-time bootstrap.** `data/song-book/<code>.json`
> seeds a song book's rows the first time that book is seen and never again; from that moment the table,
> not the file, is authoritative, and a correction to the file no longer reaches an existing install by
> itself. This decision **supersedes AD-25 in part — the song-book half only.** The bible family
> (`bible_verses`, `bible_books`, `bible_translations`, `bible_book_names`) stays fully under AD-25,
> untouched, with its "corrected corpus reaches the table with no operator step" property intact.

## Why

**Void assumption:** the song-book corpus follows the same projection model as the bible corpus — that
`upsertHymns` reconciling `title`/`lyrics` from `data/song-book/sdah.json` on every boot (AD-25) is the
permanent shape, the same as `reconcileBibleCorpus`.

G4 for `hub` surfaced the collision directly: DEC-004 Supplement S9/S12 (FR-34, UC-28, "Save to Song
Book") requires an administrator/operator write path into `hymns.lyrics`. AD-25 states plainly that no
such path exists today and that adding one "reopens this decision before it ships." AD-25 itself already
names the gap at its own tail — *"Not yet closed — the song-book half... `upsertHymns` still re-applies
`title` and `lyrics` from the corpus on every boot — the reconcile without the removal — and no
song-book registry exists."* Hub's G4 output correctly left the save-to-book contract and flow (UC-28,
`06-flows/lyric-save-to-book.md`, `02-contracts/02-services.md`) marked **blocked** rather than
adjudicating an `AD-N` conflict itself, and routed it as drift (`05-model/data-model.md` § Drift note).

**Owner ruling (live session, 2026-08-20), ratified — the decision recorded here, not re-opened:**

> "`data/song-book/sdah.json` is only the initial seeder. A fresh clone still gets all 695 hymns from
> it. But once the product is live, hymns are read from and written to the table, which becomes
> authoritative — not the JSON file any more."

### What changes in code

`upsertHymns` (`src/lib/db/index.ts:63-81`) today runs an unconditional `INSERT ... ON CONFLICT(book_code,
number) DO UPDATE SET title = excluded.title, lyrics = excluded.lyrics` on every boot — a reconcile with
no removal half, exactly as AD-25 already flags. It must become a **bootstrap**: insert only rows absent
from the table (`ON CONFLICT DO NOTHING`, or an existence check before insert), gated by a marker the same
way AD-17 gates the registry bootstrap. Once a hymn row exists, no boot path may overwrite its `title` or
`lyrics` from the file again — that is what lets an operator's saved lyric correction (UC-28) survive a
restart.

### Obligations attached now that `hymns` is authored data, not a projection

- **AD-17 (bootstrap-once, no resurrection).** The song-book bootstrap runs from zero only — first
  install, first sight of a given `book_code` — gated by a marker in `settings` parallel to the registry's.
  After it has run for a book, a gap in that book's rows (a hymn deleted, or never written) is never
  filled by re-reading the corpus file. That is the exact resurrection pattern AD-17 forbids for the
  registry, extended here to hymns: a database that already holds rows for a book does not get "missing"
  rows silently reinserted from the file.
- **AD-18 / AD-21 (versioned value migrations, single `data_version` counter).** Any future change to hymn
  content that must reach an already-live database — a corrected `sdah.json` shipped after go-live — travels
  only as an explicit, numbered data migration under the existing `data_version` counter (AD-21). It is
  never a boot-time reconcile and it does not introduce a second counter or a per-corpus marker scheme
  distinct from AD-21's one counter for the whole database.
- **AD-6 (optimistic concurrency).** The "Save to Song Book" write path into `hymns.lyrics` (UC-28
  alternate flow) carries the same precondition discipline as every other service mutation: it re-reads
  the entry's current resolved hymn `(book_code, number)` at the moment of the write and refuses (409) if
  it moved since the editor opened (SCN-4) — the check already designed in
  `06-flows/lyric-save-to-book.md`. This is the mechanism, not a new one: AD-6 already binds "registry
  template writes" and this is the same class of write against a now-authored table.

## Cost

**Stated plainly, and accepted by the owner.** A corrected `sdah.json` shipped in a later release no
longer reaches an existing, already-provisioned install automatically — it only seeds a **fresh clone**
(a brand-new database with no `hymns` rows yet for that book). Reaching a live install with a
corpus-level correction now requires an explicit numbered data migration (AD-18/AD-21), the same
mechanism used for any other authored-data change; there is no more free "restart and get the fix"
channel for hymns. This is a real, deliberate loss of AD-25's own *Prevents* property — "a corrected
corpus reaches the table with no operator step" — for the song-book half only. The bible family keeps
that property in full; nothing here weakens `reconcileBibleCorpus` or any bible table.

## Alternatives considered

- **Keep `hymns` as a projection (status quo) and drop the "Save to Song Book" feature.** Rejected by
  the owner: DEC-004 Supplement S9/S12 specifically wants operator-saved lyric corrections to persist
  across restarts and to be reusable by future services — a projection model cannot express that without
  either a second override table shadowing every hymn (complexity AD-19/AD-22 already reject for a
  simpler case) or discarding the correction on next boot.
- **A per-row "administrator has touched this" flag, keeping the reconcile for untouched rows.** Rejected
  as unnecessary complexity: the owner's ruling draws the line at the whole table, once bootstrapped,
  rather than per-row — matching how `artifact_templates` already separates bootstrap-owned rows from
  administrator-owned ones only where a Reset-to-seed action is wanted (AD-17), which "Save to Song Book"
  does not ask for here.

## Trace

- Owner ruling quoted above, live session 2026-08-20.
- AD-25 (`.how/_platform/ARCHITECTURE-SPINE.md`), the closure clause it names at its own tail ("Not yet
  closed — the song-book half").
- DEC-004 Supplement S9/S12; FR-34; UC-28 (`.what/hub/04-usecases/UC-28-correct-song-lyrics.md`,
  `.how/hub/04-usecases/UC-28-correct-song-lyrics.md`); `06-flows/lyric-save-to-book.md`;
  `02-contracts/02-services.md`; `05-model/data-model.md` § Drift note.
- `src/lib/db/index.ts:63-84` (`upsertHymns`), `src/lib/db/index.ts:122-268` (`reconcileBibleCorpus`, the
  bible-family mechanism this decision does **not** touch).
