# Brief — the preview badge vocabulary is a closed set

## Goal

`resolvePreviewBadge` in `src/lib/artifacts/preview-model.ts` leaks a slide's
internal kind into the badge. A standalone hymn row badges `song-lyric` and a
standalone sermon row badges `slide`. Both must badge `general`.

The owner defined the badge vocabulary as a closed set of three shapes, and
nothing else may appear in it:

- `general` — a row that is not a member of a song set or an announcement set
- `song-set-N` — a song set row, N being its ordinal
- `ann-set-N` — an announcement set row, N being its ordinal

A song-set child keeps the behaviour it has today and it is already correct: the
badge carries its localized lyric role (`judul`, `bait N`, `reff`, `chorus`) and
the title cell is left empty when the badge already says everything. Do not
change that path.

## The defect

At `src/lib/artifacts/preview-model.ts` around line 167:

    if (chip && chip !== 'unknown') {
      return chip;
    }

    return 'general';

This passthrough returns the raw chip or kind for everything that is not a song
set or an announcement set, so `general` is only ever reached when the chip is
empty or `unknown`. Verified by calling the function directly: a slide of kind
`song-lyric` returns `song-lyric` and a slide of kind `slide` returns `slide`.

Collapse every remaining case to `general`. A kind is not a badge; the specifics
belong in the title cell beside it, which already carries them.

## Files in scope

- `src/lib/artifacts/preview-model.ts`
- `tests/artifact-preview.test.mjs`

Nothing else. Do not touch `SlidePreviewList.tsx`, the i18n catalogues, or the
song-set child path.

## Tests

Extend the existing badge test in `tests/artifact-preview.test.mjs`:

- A standalone slide of kind `slide` badges `general`.
- A standalone slide of kind `song-lyric` badges `general` — this is the row the
  owner actually saw wrong, a hymn outside any song set.
- A standalone slide whose kind is some other non-empty value still badges
  `general`, so the closed set is asserted as closed rather than as two literals.
- The existing song-set, ann-set and lyric-role assertions still pass unchanged.

Prove the new assertions have teeth: restore the passthrough branch, watch them
fail, then revert. A test that cannot fail is worth nothing.

## Constraints

- Do not edit anything under `.what/`, `.how/`, or any `DEC-` file.
- Do not run any git command that discards work: no restore, checkout, stash or
  reset. Never push.
- Run `npm test` and `npm run typecheck` and report failures with their output.
