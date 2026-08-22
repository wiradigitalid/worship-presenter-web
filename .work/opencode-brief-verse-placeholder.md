# Brief — VERSE {N} renders literally: t takes no params in this codebase

## The defect, as the owner sees it

A song-set verse row's badge reads `VERSE {N}` on screen instead of `VERSE 1`.
The `{n}` placeholder is never substituted.

## Root cause

`src/lib/artifacts/preview-model.ts` lines 140 and 145 call the translator with a
params object:

    return t('form.preview.role.verse', { n: match[1] });
    return t('form.preview.role.verse', { n: 1 });

No such translator exists in this codebase. `LocaleApi.t` in
`src/lib/i18n/operator.tsx:22` is `(key: I18nKey) => string` and its
implementations are `(key) => resolveString(key, locale)`. The second argument is
silently dropped and the catalogue template `verse {n}` reaches the screen
verbatim.

Two reasons nothing caught it, and both must be closed:

1. `resolvePreviewBadge` declares its own `t` parameter as
   `(key, params?) => string`. TypeScript lets a function with fewer parameters
   satisfy that type, so passing the real one-argument `t` typechecks cleanly.
   The signature invites a translator that does not exist.
2. `tests/artifact-preview.test.mjs` builds `enT` and `idT` itself and those
   helpers *do* substitute `{n}`. The tests assert against a translator shape the
   application never uses, so they pass while the screen is wrong.

## What to do

**1. Make the fiction unrepresentable.** Change the `t` parameter of
`resolvePreviewBadge` to `(key: I18nKey) => string` — exactly `LocaleApi.t`. After
this change, passing a params object must not compile.

**2. Substitute inside the model.** Replace `{n}` with the verse number using
`.replace()` on the resolved string, the way the rest of this codebase already
handles placeholder keys. Substitute every occurrence, not just the first.

**3. Fix the tests to use the real shape.** `enT` and `idT` become exactly
`(key) => resolveString(key, 'en')` and `(key) => resolveString(key, 'id')`, with
no params handling of their own. Then assert the rendered badge is `verse 1` in
English and `bait 1` in Indonesian. Those assertions now prove the substitution,
because nothing in the test can perform it any more.

**4. Add a guard.** A new test that scans `src/` for any call passing a second
argument to a translator — `t('some.key', {` — and fails when one exists. This
defect has now shipped twice in this codebase from the same misunderstanding, so
the rule that this project's `t` takes exactly one argument needs a guard rather
than a memory.

Prove the guard: inject `t('form.preview.role.verse', { n: 1 })` somewhere under
`src/`, watch the guard fail, then revert. Prove the badge assertions the same
way: remove the `.replace()` and watch `verse 1` and `bait 1` fail.

Register the new test file in the `test` script in `package.json` — that script
names every file explicitly and does not glob, so an unregistered file never runs.

## Files in scope

- `src/lib/artifacts/preview-model.ts`
- `tests/artifact-preview.test.mjs`
- a new guard test under `tests/`
- `package.json` — registration only

Do not touch the i18n catalogues: `verse {n}` and `bait {n}` are correct as
written, and the placeholder is the right way to express it. Do not change
`LocaleApi` or add params support to the application's `t`.

## Constraints

- Do not edit anything under `.what/`, `.how/`, or any `DEC-` file.
- Do not run any git command that discards work: no restore, checkout, stash or
  reset. Never push.
- Run `npm test`, `npm run typecheck`, and `npm run spa:build`, and report
  failures with their output.
