# Brief — make the badge translator required, delete the second translation table

## Goal

`resolvePreviewBadge` in `src/lib/artifacts/preview-model.ts` takes its
translator `t` as an optional last parameter, and when it is absent falls back to
a hardcoded English table defined inside the function:

    const translate =
      t ??
      ((key, params) => {
        if (key === 'form.preview.role.title') return 'title';
        if (key === 'form.preview.role.verse') return `verse ${params?.n ?? ''}`.trim();
        if (key === 'form.preview.role.reff') return 'reff';
        if (key === 'form.preview.role.chorus') return 'chorus';
        return key;
      });

Two problems, and the second is the one that matters.

It is a second home for strings the i18n catalogues already own. It currently
hurts nobody in production because `SlidePreviewList.tsx:163` always passes `t` —
but a future caller that forgets it would silently serve English to an Indonesian
operator, with no test and no type error to catch it. The i18n guard does not see
this file because the guard scans components and this lives in `src/lib/`.

Worse, the tests call the function without `t`, so they assert against the shim
rather than against the catalogue. A wrong Indonesian string in
`catalogue-id.ts` would pass every one of them.

## What to do

Make `t` a required parameter and delete the fallback table entirely. There must
be exactly one place a preview role string comes from, and that is the i18n
catalogue.

## Files in scope

- `src/lib/artifacts/preview-model.ts` — the signature and the deleted fallback
- `tests/artifact-preview.test.mjs` — the call sites that relied on the default
- Any other caller the compiler names once the parameter is required

Do not add the parameter to `resolvePreviewTitle`; it already takes its
last-resort string from the caller. Do not touch the i18n catalogues, the keys
file, or `SlidePreviewList.tsx` beyond what a required parameter forces.

## Tests

The tests must stop asserting against a shim and start asserting against the real
catalogues. Build the translator in the test from the actual catalogue modules —
`src/lib/i18n/catalogue-en.ts` and `src/lib/i18n/catalogue-id.ts` — resolving the
key and substituting `{n}`, the way the application does.

Then assert both languages on the lyric-role rows, at minimum: the English
catalogue yields `verse 1` and the Indonesian catalogue yields `bait 1` for the
same slide. That assertion is the whole point of the change — it is what makes a
wrong catalogue value fail a test instead of passing one.

Keep every existing badge assertion passing: `general` for standalone rows of any
kind, `song-set-N`, `ann-set-N`, and the empty title cell for a lyric child whose
badge already carries its role.

## Constraints

- Do not edit anything under `.what/`, `.how/`, or any `DEC-` file.
- Do not run any git command that discards work: no restore, checkout, stash or
  reset. Never push.
- Run `npm test` and `npm run typecheck`, and report failures with their output.
  A type error is the expected signal here for a caller you have not updated
  yet, not something to silence with a cast or an optional marker.
