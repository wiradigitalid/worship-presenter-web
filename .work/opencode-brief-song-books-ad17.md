# Brief — the song_books seed must obey AD-17 and AD-21, not reconcile on every boot

## What is wrong

`seedSongBooks` (added in commit 929f865, in `internal/db/bootstrap.go` and
mirrored in `src/lib/db/index.ts`) runs on **every boot** and re-reads the corpus
file, inserting the SDAH row whenever it is absent. That is a boot-time reconcile,
and two applied decisions forbid it.

`DELETE /api/admin/song-books/{bookCode}` exists (`internal/httpapi/server.go:87`).
So an administrator who deliberately deletes the SDAH book gets it back on the
next restart. DEC-005 names this exactly:

> After it has run for a book, a gap in that book's rows ... is never filled by
> re-reading the corpus file. That is the exact resurrection pattern AD-17 forbids
> for the registry, extended here to hymns.

and, on reaching an already-live database:

> travels **only** as an explicit, numbered data migration under the existing
> `data_version` counter (AD-21). It is **never** a boot-time reconcile.

The behaviour the owner needed — an existing install healing its missing row — is
right. The mechanism is wrong. Do not revert the feature; move it to the mechanism
the corpus mandates.

## What to build

**Two paths, each running once, and no reconcile anywhere.**

**1. Fresh install → inside the bootstrap-once transaction.** Seed the
`song_books` row inside `upsertHymns`, in the same transaction that inserts the
hymn rows and stamps `song_book_bootstrapped_<code>`. A fresh database then gets
the hymns and the book row atomically, and neither is ever re-seeded.

**2. Existing install → one numbered data migration.** Add a migration that
inserts the SDAH row when it is absent, gated by `data_version`, taking the
counter from 10 to 11. It runs once and never again — so an administrator's
deletion afterwards is permanent, which is the whole point of AD-17.

Then **delete the every-boot `seedSongBooks` call and function.** Its job is now
split between the two paths above and it must not survive as a third writer.

## Traps, all three already paid for in this repository

**a. Version-stamp ordering.** `migrateSnapshots` stamps `currentDataVersion`.
Any migration whose gate reads that counter MUST be called **before** it, or the
gate is already satisfied and the pass silently never runs. This exact defect
shipped once on migration 9 to 10 and was found only by reading `journalctl` on
the deployed server. Look at how `migrateAnnouncementItemsCascade` is ordered in
`bootstrap.go` and follow it.

**b. Both counters.** `currentDataVersion` and `currentDataVersionInt` in
`internal/db/bootstrap.go` both move to 11, and the TypeScript mirror moves with
them. Search for every place the number 10 is written as the current version.

**c. `is_default` stays conditional.** In both paths, claim `is_default = 1` only
when no existing row already holds it. Never demote another book, never leave two
defaults.

Metadata still comes from `data/song-book/sdah.json` — `code`, `name`,
`language` to `locale`, `attribution` to `provenance`, `licence` — never from
literals. A missing corpus file is not an error in either path.

## Mirroring

Go and TypeScript are a hand-mirrored pair; both sides change, and each names the
other in a header comment, the way the existing migrations do.

## Tests

Rework `internal/db/seed_song_books_test.go` and `tests/song-books-seed.test.mjs`
rather than leaving them asserting the deleted behaviour. Cover, in both
languages:

- Fresh database: hymns and the SDAH row both appear, with metadata from the
  corpus file and `is_default = 1`.
- Existing database at `data_version` 10 with the hymn marker stamped and no
  `song_books` row: the migration inserts it once, and the version reaches 11.
- **The AD-17 case, which is the reason for this change:** a database already at
  `data_version` 11 where the administrator has deleted the SDAH row. After a
  boot, the row is **still absent**. It must not come back. Prove this one by
  restoring the every-boot seed and watching it fail.
- Another book already `is_default = 1`: SDAH arrives with 0, the other is
  untouched.
- An administrator-edited SDAH row is never overwritten.
- Booting twice produces exactly one row and stamps the version once.

## Constraints

- Do not edit anything under `.what/`, `.how/`, or any `DEC-` file. This change
  brings the code into line with DEC-005; the decision itself does not move.
- Do not weaken or delete a guard to make something pass.
- Do not run any git command that discards work: no restore, checkout, stash or
  reset. Never push.
- Run `go build ./...`, `go vet ./...`, `go test ./...`, `npm test`, and
  `npm run typecheck`. Report failures with their output.
