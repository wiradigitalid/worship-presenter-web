# Handover — 2026-08-22, session close

Written for a **fresh session starting from `main`**. The worktree this was written in
(`C:\Users\kodes\orca\workspaces\worship-presenter-web\auto1`) is being deleted; the Orca workspace
root has moved to `D:\Developer\orca\workspaces`. Do not reference the old path.

**Start from:** `main` at `cdf983a` or later. Everything from the previous session is merged — PR #44
and PR #45 are both in. `git log origin/main..HEAD` on the old branch was empty at close.

---

## Where the product stands

`validate.py` **GREEN**. `npm test`: **702 tests, 699 pass, 0 fail, 3 skipped**. Deployed to
`presenter-dev.bic.my.id`. Waves W1–W5 all closed.

Shipped this cycle: DEC-004/DEC-005 completion (5-tab Registry admin, N song-set entries, announcement
sets, background library, song books), the Family/Youth name inputs and the S6 closing-prayer checkbox,
CI restored to green for the first time in its visible history, the `song_books` bootstrap seed, and
**FR-35 — the Operator controls the presenting laptop from a phone** (wave W5, `DEC-006`, `AD-37`).

Three browser acceptance suites now exist (`tests/acceptance-fr35-remote.test.mjs`,
`acceptance-fr09-slide-preview.test.mjs`, `acceptance-fr16-fr19-fr28.test.mjs`) driving real Chromium
through Playwright against a locally spawned Go API.

---

## Do this first — OQ-57, and it is a defect in the previous session's work

**The owner's original request is still unmet.** The Live Slide Preview renders `Song Set` and `lyric`
where the owner asked for `song-set-1` / `song-set-2` and the child's lyric role (`bait 1`, `reff`).

Cause, already located:

- `src/components/SlidePreviewList.tsx:140` builds the group header row with
  `label: entry.groupLabel || 'Song Set'` and renders **that label** as the badge. `groupOrdinal` is
  computed on the same row and never reaches `resolvePreviewBadge`.
- Lyric children arrive at `resolvePreviewBadge` with an empty `slide.title`, so they fall to the
  unlabelled-lyric fallback (`form.preview.role.lyric`) instead of showing `bait N`.

`resolvePreviewBadge` itself is correct. The component that calls it is not.

**Why it hid:** the previous session verified `resolvePreviewBadge` in isolation by calling it with
hand-made inputs and declared FR-9 done. The real data flow was never exercised. The browser suite
surfaced it in a console log while its own assertion was too loose to fail on it.

**After the fix**, tighten `tests/acceptance-fr09-slide-preview.test.mjs`: its `allowedBadgePattern`
admits `lagu`, `khotbah` and `ayat`, which are content words rather than badge vocabulary — that reads
as a regex widened until the test passed. Remove them, then prove the tightened guard **fails** when
the group badge is reverted to `entry.label`, then revert. It does not fail today.

---

## Decisions waiting on the owner

Each is filed in `.control/questions/assumptions.md` with a stated assumption; the build followed the
assumption rather than blocking.

| | |
|---|---|
| **OQ-56** | Playwright entered `devDependencies` with **no decision recorded anywhere**, while the spine says: *no second runner without a decision recorded in this spine*. The suites are kept because one caught a real defect the same day. The decision is owed, not waived. |
| **OQ-56b** | Whether CI should carry `npx playwright install --with-deps chromium` on every run. Getting green needed it. |
| **OQ-57** | The badge defect above — a defect to fix, not a design change. |
| **OQ-41** | Underline is not persistable (`textDecoration` absent from `allowedStyleKeys`). |
| **OQ-42** | The Telegram webhook still accepts an `announcements[]` field and ignores it after FR-3's retirement. |
| **OQ-43** | Orphan uploads. |
| **OQ-44** | Emphasis on token-bound elements. |
| **OQ-45** | A preview refresh that fails after a successful Sync is swallowed. |
| **OQ-46** | No length bound on the Family/Youth name fields while siblings are bounded 1–120. |
| **OQ-48** | Admin CRUD of Song Books is served but **no `FR` or `UC` promises it** — including whether an Admin may delete a book, the endpoint that made the AD-17 resurrection defect reachable. |
| **OQ-49** | Three Operator-facing registry reads (platform rows 66, 68, 69) have no failure behaviour. |
| **OQ-50** | The spine's `until first deploy` hinge has tripped — dev deployed 2026-08-20 — so whether AD-18's total-replacement licence and AD-21's version freeze still apply is the owner's call. |
| **OQ-51** | Two `wdi-build` gaps: an isolation override disarms Step 5, and nothing flags a wave left open. Method-package changes; this repo may not patch them. |
| **OQ-52** | `AD-36` restates cost in the spine, which `wdi-blueprint` check 5 forbids. Trim on its next edit. |
| **OQ-53–55** | The remote's pairing: code lifetime, whether a second remote may ever be admitted, whether a pairing survives a page reload. |

---

## Rules and lessons that cost real time. Do not re-learn them.

**Dispatch has changed.** The owner's Agent Rules were updated mid-session: every agent must be
launched **through Orca as a supervised worker**, never a headless CLI call. The previous session used
`opencode run --auto` — that pattern is now against the rules. Cursor is an equal substitute for
OpenCode. Load Orca's own guide (`orca skills get orchestration`, `orca skills get orca-cli`) rather
than recalling subcommands.

**A guard is proved by injecting the defect into the real file.** A test that feeds a synthetic string
to its own scanner function proves the scanner, not the file walk. This shape was found **four times in
one day**: `translator-guard` scanning `src/` while the violation was in `spa/src/`; a liveness guard
reading a type union while the violation was a condition on an existing call; the FR-9 badge guard; and
the gate assertion that passes with the paths exempted because a handler also answers 401.

**Do not verify a component by calling its helper with inputs you invented.** That is how OQ-57 hid.

**This project's `t` takes exactly one argument.** `t(key, {params})` compiles, drops the object, and
ships a literal `{n}` to the screen. `tests/translator-guard.test.mjs` guards it across `src/` and
`spa/src/`. Substitute with `.replace()` at the call site.

**"Component" is method vocabulary here.** `method-glossary.md` defines Product Component and Logical
Component. Say "renders a React component in a test", never "component testing".

**CI only triggers on push-to-`main` and pull_request-to-`main`.** A branch with no open PR has **no
CI at all**. That is what made W1/W2's main-branch isolation override disarm `wdi-build` Step 5.

**Public repository.** Images are tracked only under `public/` — a committed screenshot fails the
guard, and the reason is congregation data. The **dev** hostname is permitted and already tracked; the
**production** hostname is forbidden and the spine uses `presenter.example.org` as its placeholder.

**The inventory owner columns are derived, never read back from the table.** Fix
`.constitution/project/inventory-readers.py`, not the row — a hand-patched owner is silently lost on the
next `inventory --write`. Three heuristics were wrong this cycle: `/api/present` → hub,
`/services/[id]/remote` → hub, `/api/bible-translations` → hub.

**Ordering around `migrateSnapshots`.** It stamps `currentDataVersion`, so any migration whose gate
reads that counter must run **before** it, or the pass silently never runs. That shipped once and was
found only by reading `journalctl` on the deployed server.

**`data_version` is 11.** The `song_books` registry row is seeded by two paths — a fresh install inside
`upsertHymns`' bootstrap-once transaction, and an existing install by one numbered migration 10→11.
A boot-time reconcile is forbidden (AD-17, AD-36) and one shipped and had to be replaced the same day.

---

## What only a person can check

`.control/reports/manual-acceptance-checklist.md` — one entry per FR, 35 covered, with a *fail looks
like* line on each. Also published for phone use:
https://claude.ai/code/artifact/ed0974cc-9d60-4468-abe8-622e09c62db2

The two most valuable are **FR-14** (disconnect a laptop from the network entirely and present the
PPTX) and **FR-35** (pair a phone, drive the service, then lock the phone and confirm the laptop keeps
going). This project renders no React component in a test, so no suite here can stand in for either.
