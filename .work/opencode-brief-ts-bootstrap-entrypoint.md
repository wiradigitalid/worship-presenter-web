# Brief — give the TypeScript side a re-bootable entry point, like Go's Bootstrap

## Why

`internal/db/bootstrap.go` exports `Bootstrap(handle, root)`, so a Go test can
boot the same database twice and assert what a **second boot** does. That is how
`TestSeedSongBooks_AD17DeletedSDAHNotResurrectedAtVersion11` proves AD-17: it
boots, deletes the SDAH row, boots again, and asserts the row is still gone.

`src/lib/db/index.ts` exports only `getDb()`, which memoizes a singleton handle.
Calling it twice does not re-run the boot sequence, so the mirrored node test had
to call `upsertHymns` and `migrateSongBookRow` directly instead. It therefore
proves those two functions do not resurrect the row, but it cannot see a
resurrection introduced anywhere else in the boot sequence.

This was measured, not assumed: injecting an unconditional
`INSERT ... ON CONFLICT DO NOTHING` into the boot sequence right after
`upsertHymns(db)` fails the Go test and leaves the whole node suite green.

## What to build

Extract the boot sequence in `src/lib/db/index.ts` into an exported function that
takes an open database handle and runs every migration and seed in the current
order, and have `getDb()` call it. Keep the order byte-for-byte as it is today —
the ordering is load-bearing and one pass already shipped broken because it ran
after the step that stamps the version its gate reads.

Name it to mirror the Go side and say so in a header comment on each, the way the
existing mirrored pairs in this codebase name each other.

Nothing about production behaviour changes: same steps, same order, same single
invocation per process. This is an extraction, not a redesign. Do not make it
idempotent-by-adding-guards, do not reorder, do not add or remove a step.

## Then strengthen the test

Rewrite the AD-17 case in `tests/song-books-seed.test.mjs` to use it, mirroring
the Go test's shape:

1. Boot a fresh temporary database through the new function; assert the SDAH row
   exists and `data_version` is 11.
2. Delete the SDAH row, as an administrator would through
   `DELETE /api/admin/song-books/{bookCode}`.
3. Boot the **same** handle again through the new function.
4. Assert the row is still absent.

Then prove it: inject an unconditional insert into the boot sequence after the
hymn seed, confirm this test now **fails**, and revert. Until it has been seen to
fail on that injection it proves nothing, and that is the entire reason for this
change.

Keep every other test in that file passing. Where another test still calls
`upsertHymns` or `migrateSongBookRow` directly and that is genuinely what it is
testing, leave it alone — this is about the AD-17 case specifically.

## Files in scope

- `src/lib/db/index.ts`
- `internal/db/bootstrap.go` — only to add the header comment naming its
  TypeScript counterpart
- `tests/song-books-seed.test.mjs`

If the extraction forces a change in another test that imported internals, make
the minimum change and report it.

## Constraints

- Do not edit anything under `.what/`, `.how/`, or any `DEC-` file.
- Do not weaken or delete a guard to make something pass.
- Do not run any git command that discards work: no restore, checkout, stash or
  reset. Never push.
- Run `npm test`, `npm run typecheck`, `go build ./...` and `go test ./...`, and
  report failures with their output.
