# Brief — widen the translator guard, and stop claiming verse 1 for unlabelled lyrics

Two changes in the same area. Both are small and both close a hole found by
review, not by a failing test.

## Change 1 — the guard must cover every place the rule applies

`tests/translator-guard.test.mjs` scans only `src/`. Its own test name says so, so
it is honest, but the rule it protects — this project's `t` is
`(key: I18nKey) => string` and a second argument is silently dropped — applies
everywhere a translator is called. `spa/src/` calls it too, for example
`spa/src/pages/LoginPage.tsx:57`, and a defect there would pass the guard.

Two fixes:

**a. Scan `spa/src/` as well as `src/`.** Report findings with a repo-relative
path so it is obvious which tree a hit is in. Do not scan `tests/`, `node_modules`
or build output.

**b. Make the scan multi-line.** The current implementation walks lines one at a
time, so a call the formatter wrapped escapes it:

    t('form.preview.role.verse',
      { n: 1 })

Strip comments from the whole file, run the pattern over the whole text, and
derive the line number from the match offset. Keep the existing reporting shape.

Prove both: inject a wrapped multi-line call in `src/`, and a single-line call in
`spa/src/`, and confirm the guard fails on each **separately** before reverting.
The existing unit test on the scanner function is not the proof — it exercises the
scanner, not the file walk, so a broken walk would pass it while the guard went
vacuously green. Prove the guard itself, by a real call in a real file, for each
of the two forms it now claims to cover.

## Change 2 — an unlabelled lyric row must not claim to be verse 1

In `src/lib/artifacts/preview-badge` logic inside
`src/lib/artifacts/preview-model.ts`, a lyric child with no label ends at:

    return t('form.preview.role.verse').replace(/\{n\}/g, '1');

That claims verse number 1 for a row whose number is unknown. It is reachable:
`splitLyricsLabeled` in `src/lib/lyrics.ts` assigns a label for `verse`, `reff`
and `chorus` sections only, so a `body` section — lyrics carrying no verse marker
at all — produces an empty label. A hymn written without markers therefore renders
every one of its rows as `verse 1`.

Replace that fallback with an honest badge: a new i18n key
`form.preview.role.lyric`, `lyric` in English and `lirik` in Indonesian, carrying
no number. Register the key in `src/lib/i18n/keys.ts` and both catalogues —
`catalogue-en.ts` and `catalogue-id.ts` — or `tests/i18n.test.mjs` fails.

Do not change `splitLyricsLabeled` and do not start inventing numbers for `body`
sections. A number that was never in the lyrics is not ours to supply.

## Tests

- A lyric child whose slide has no title badges the new lyric string, in both
  languages, and specifically **not** `verse 1` / `bait 1`.
- Every existing badge assertion still passes: `general`, `song-set-N`,
  `ann-set-N`, `verse 1` / `bait 1` from label `1/3`, `verse 2` / `bait 2` from
  `2/3`, `reff`, `chorus`.
- Build the test translators as exactly `(key) => resolveString(key, locale)` —
  one argument, no interpolation of their own. A helper that interpolates would
  hide the very defect this area already shipped once.

Prove the new assertion by restoring the `'1'` fallback and watching it fail.

## Constraints

- Do not edit anything under `.what/`, `.how/`, or any `DEC-` file.
- Do not run any git command that discards work: no restore, checkout, stash or
  reset. Never push.
- Run `npm test`, `npm run typecheck`, and `npm run spa:build`, and report
  failures with their output.
