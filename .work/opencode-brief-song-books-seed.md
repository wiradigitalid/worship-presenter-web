# Brief — seed the SDAH song_books registry row at bootstrap

## Goal

`song_books` is empty on every install. Nothing in the production code path ever
inserts a row: the only INSERT is the admin POST at
`internal/httpapi/song_books.go:199`. So the Song Books admin tab lists nothing,
the Service form book picker has no options, and `ResolveSongBook` always falls
through to the shipped `DefaultSongBook` constant instead of a real default.

This contradicts what the code already claims about itself.
`internal/db/bootstrap.go:211-218` (`upsertHymns`) documents seeding "a book"
from `data/song-book/<code>.json`, and DEC-005 / AD-36 make the whole song
database, the registry row included, a one-time seed from the committed corpus
file. The hymn half was built; the book row half was not.

Done means: a fresh database and an existing database both end up with an SDAH
row in `song_books`, carrying the corpus metadata, marked as the global default
when no other default exists.

## Files in scope

- `internal/db/bootstrap.go`
- `src/lib/db/index.ts` — the hand-mirrored TypeScript pair
- Go and node tests for both

Do not touch `internal/httpapi/song_books.go`, the admin API, or any SPA file.

## The trap — read this before writing anything

Do NOT put the insert inside `upsertHymns`, and do NOT gate it on the per-book
marker `song_book_bootstrapped_SDAH`.

`upsertHymns` returns early when that marker is present, and migration 5 to 6
(`migrateSongBookBootstrapDec005`, mirrored in
`internal/db/migrate_song_book_bootstrap.go`) deliberately stamps the marker for
every book already in `hymns` so an existing install is never re-bootstrapped and
its hymn gaps are never refilled. Every real database therefore already has that
marker. Code placed behind it would look correct, pass a fresh-database test, and
never run on the dev server or on the owner machine.

Write a separate seed step that is idempotent on its own terms, and put a comment
on it saying exactly why it is not gated by the hymn marker, so the next agent
does not helpfully move it inside.

## Behaviour required

1. Read `data/song-book/sdah.json` for the metadata. The `book` object holds
   `code`, `name`, `language`, `attribution` and `licence`. Map `language` to the
   `locale` column and `attribution` to `provenance`; `licence` maps straight
   across. Take nothing from a hardcoded literal that the corpus file already
   carries. Missing corpus file is not an error: return without seeding, the way
   `upsertHymns` already treats a missing file.

2. Insert with conflict on `book_code` doing nothing. An administrator who
   renamed the book, or corrected its licence text, keeps their edit — the same
   administrator-owned rule the hymn rows follow once bootstrapped.

3. `is_default` is 1 only when no existing row already has `is_default = 1`;
   otherwise 0. Never demote or overwrite another book that is already the
   default, and never leave two rows with `is_default = 1`.

4. Run it on every boot, not once. It is a self-repairing seed: the broken state
   this fixes is precisely an install that has hymns and no book row, and that
   state must heal on the next start without a migration bump.

5. `data_version` stays 10. This adds no column and no table, so it is not a
   migration. Do not touch `currentDataVersion` or `currentDataVersionInt`.

6. Log one line when a row is actually inserted, in the existing `[corpus]`
   style, naming the code and whether it became the default. Silence when the row
   was already there.

## Mirroring

Go and TypeScript are a hand-mirrored pair and both must carry the behaviour.
Follow the existing convention: each side's function names the other in a header
comment, the way `migrateSongBookBootstrapDec005` names
`internal/db/migrate_song_book_bootstrap.go`. Call the new step from the same
place in each boot sequence — in TypeScript that is next to the existing
`upsertHymns(db)` call around line 790.

## Tests

Both languages. Cover, at minimum:

- Fresh database: the SDAH row exists after boot, with locale, licence and
  provenance populated from the corpus file, and `is_default = 1`.
- Existing database that already has hymns and the bootstrap marker stamped, and
  no `song_books` row: the row appears anyway. This is the regression that
  matters most; the fix is worthless without it.
- A database where another book is already `is_default = 1`: SDAH is inserted
  with `is_default = 0` and the other book is untouched.
- An administrator-edited SDAH row is not overwritten on the next boot.
- Booting twice produces exactly one SDAH row.

Every new test must be registered in the `test` script in `package.json` for the
node side — that script names every file explicitly and does not glob, so an
unregistered file never runs.

An absence assertion is worth nothing until it has been seen to fail. For any
test asserting something does not happen, inject the defect, watch it fail,
then revert.

## Constraints

- Do not edit anything under `.what/`, `.how/`, or any `DEC-` file. A deviation
  is reported back, not absorbed into code.
- Do not run any git command that discards work: no restore, checkout, stash or
  reset. Commit locally if you wish; never push.
- Verification is run, not assumed: `go build ./...`, `go vet ./...`,
  `go test ./...`, and `npm test`. Report failures with their output.
- If a test or build fails and you do not know why, diagnose before proposing a
  fix. A third failed fix attempt is the signal to stop and report, not to try a
  fourth.
