# Sprint Status — narrative record (compacted)

Selected from the verbatim record, which is committed at **`e61de4b`** and
recoverable in full with:

```
git show e61de4b:_bmad-output/implementation-artifacts/sprint-status-history.md
```

Every sentence below is the original author's, unedited. Sentences were
**selected, never rewritten** — nothing here is a paraphrase or a summary.
What was dropped is narration the contract layer already carries: a harvest
scan over every still-live section found no binding decision that lives only
here (`epics.md`, `ARCHITECTURE-SPINE.md` and the SPECs carry all of them).

This file is a record, not a contract. Nothing here binds an implementer.

---

## Story and epic rows

### `epic-14` — done

*2026-07-29*

- _no caveat, gate or evidence recorded; see git for the full narration_

### `epic-16-retrospective` — done

*2026-07-29*

- The four keys are retired here rather than backfilled with AC written to match already-shipped code (AC that cannot fail is not a verification instrument).

### `epic-17` — in-progress

*2026-07-29 → 2026-08-06*

- _no caveat, gate or evidence recorded; see git for the full narration_

### `17-1-reachable-dark-mode` — done

*2026-07-29 → 2026-08-01*

- 2026-08-01 CLOSED by the owner.
- Repaired to the registry's authentic value; guard still 4/4; integrity checking never disabled.
- The owner resolved all 3 decision-needed items the same day: (1) the AC-4 shell holes are FOUR, not one — first paint on every projected load (a `useEffect` cannot fix it; the leaked paint is the server's), the two Server-Component error branches, `notFound()` at six reachable sites with NO not-found.tsx/error.tsx anywhere in `src/`, and `PROJECTED` never being closed upward — and they close with ONE route-group […]
- Suite 365/364 pass/0 fail/1 skipped, tsc clean, guard 4/4.

### `17-2-muted-foreground-contrast` — done

*2026-08-03*

- 2026-08-03 Reviewed: fresh browser measurement and Node 22.23.2 full suite pass; oklch(0.543 0 0) clears all three light hosts; theme-chrome 57/57; DESIGN.md Open Item 1 closed.

### `17-3-app-metadata` — done

*2026-08-05*

- _no caveat, gate or evidence recorded; see git for the full narration_

### `17-4-canvas-dirty-state-guard` — done

*2026-07-19 → 2026-08-04*

- 14 raised / 13 unique: 10 DISMISSED each against the source, not waved off — four were reviewer errors (inline text editing needs IText/Textbox and this editor builds FabricText; Ctrl/middle-click never reaches onNavigate because Next returns at isModifiedEvent first; the diff DOES contain EXPERIENCE.md and epics.md, the layer cited a path that does not exist; no async canvas.add exists so a seed image cannot […]
- Verified: suite 28/28, four new injected-defect probes all red-on-break, browser re-verification 7/7 holding the PUT open via CDP Fetch interception with a self-validating idle-drag control.
- Verified: npm test 468/467 pass 0 fail, tsc clean, public-repo-guard 5/5, lint 32 problems = re-measured clean-tree baseline.
- ALSO VERIFIED IN A REAL BROWSER (16/16): headless Chrome over the DevTools Protocol against next dev on a scratch DB_PATH, covering the half node:test cannot reach — Fabric object:added/object:modified raising the indicator, the native beforeunload prompt, and both confirm-gated exits declined AND accepted, plus the negative cases (clean canvas prompts nothing, re-clicking the active row prompts nothing, a read-only […]

### `17-5-projector-liveness` — done

*2026-07-31 → 2026-08-06*

- 2026-08-06 CLOSED by the owner.
- Implemented, TWO CODE-REVIEW ROUNDS CLOSED, and MERGED to main as PR #33 with Node 22 CI green (run 31011350874, v22.23.1, 495/496 pass) — every AC has its evidence.
- PresenterOperator.tsx: every inbound message (heartbeat + request-sync) dispatched as `ack` evidence in the existing listener without changing how request-sync answers; a 200ms poll feeds `handle-closed` only when the ref is truthy AND closed (never on null), else `tick`; the verdict renders as a persistent role="status" line in the header, independent of projectorBlocked, silent in never-opened, clearing on the […]
- AC-9 CLOSED ON EVIDENCE in the same pass, not left outstanding: the Node 22 CI run this story deferred to already existed and was read — PR #33 (merged 2026-08-05T13:47:48Z), Node.js CI run 31011350874, step "Use Node.js 22" reporting node v22.23.1, npm test 496 tests / 495 pass / 0 fail / 1 skipped — the same four numbers as the local Node 24 run, so both supported versions agree.

### `17-6-toast-channel-decision` — done

*2026-07-31 → 2026-08-06*

- Shipped as a `docs:` change set: ba222af, PR #35, `test` and `Greptile Review` both green; 496 tests / 495 pass / 0 fail / 1 pre-existing skip and public-repo guard 5/5, re-run by the coordinator rather than quoted; zero paths under src/, tests/, package.json or package-lock.json; AD heading census 29 before and after.
- **THE CLOSE IS RECORDED WITH ITS ONE GAP STATED RATHER THAN HIDDEN: the final state of this change set was never read by an independent reviewer.** The trio (codex gpt-5.6-terra high, agy gemini-3.1-pro-low, agy gemini-3.6-flash-high) reviewed the PRE-FIX tree and split badly — codex filed five blocking findings, Gemini Flash one should-fix, Gemini Pro ZERO on a tree that had four real defects, and both agy […]
- **The coordinator recommended one further independent pass over the fixed state, citing this project's own record that round-3 fixes produced round-4 headline findings; the owner elected to close instead.** If a later round finds something in this change set, that is the reason, and it was known at closing time.
- NOT SWEPT, stated so it is not read as a clean bill of health: `stories/**` was not audited for sentences AC-9 falsified; `24-1-string-catalogue-switcher-and-lang.md:180` surfaced incidentally and is deliberately left as a `done` story's dated record, on the same reasoning applied to two 2026-07-31 architecture-review files, and needs re-reading against the repaired spine if Epic 24 work resumes.

### `17-8-guard-criteria-encoding` — done

*2026-08-03 → 2026-08-05*

- 2026-08-03 bmad-code-review: all six patch findings fixed; seventh combined injection compiled under tsc and made the fixed guard fail, then reverted; focused 54/54, public guard 5/5, tsc clean, lint 31 unchanged.

### `epic-18` — backlog

- Kept separate from Epic 17 deliberately: one epic is what an operator sees, this one is what a visitor must never see.

### `epic-19` — retired

*2026-07-29 → 2026-07-30*

- RETIRED 2026-07-30 by owner decision (AD-20).

### `epic-19-retrospective` — n/a

- _no caveat, gate or evidence recorded; see git for the full narration_

### `epic-20` — in-progress

*2026-07-29 → 2026-08-08*

- Story 20.8 must not ship before the epic-16 architecture spine carries a new AD-n superseding AD-14 — never renumber — and EXPERIENCE.md Venue & Projection Constraints + Flow 5 are reconciled.
- 20.2's collapse rewrites base_type and payload in one statement per AD-18 and must not touch the position, which it cannot — the position has one home and no payload copy.

### `20-1-ordered-registry` — done

*2026-08-07*

- Merged as PR #37 (merge commit bc487b3), both checks green.
- ONE THING THE CLOSE DOES NOT COVER, recorded because the owner closed with it stated rather than hidden: the FINAL state after fix round 2 was verified only by the coordinator (492 tests / 491 passed / 0 failed / 1 skipped, public-repo guard 9/9, forbidden-path audit clean) and was never read by an independent reviewer.
- DEBT THIS STORY HANDS FORWARD: AD-20 is NOT closed (see the block above) — Story 20.7 owns replacing the five transitional SongSet rows with AD-19's four identities AND deleting song1Number..song4Number, in one change set.
- GATE — the story must not edit ARCHITECTURE-SPINE.md.

### `20-2-three-slide-kinds` — in-progress

*2026-08-08*

- TWO FINDINGS DECIDED THE STORY AND NEITHER WAS IN THE ARTIFACTS: `TEMPLATE_LABELS` above, and that all eight rows moving onto `general` declare placeholders while the General case of `enforceBaseTypeRules` forbade exactly that (`validate.ts:366-368` AT THE 553a4c5 BASELINE — that branch is deleted by this story, so the citation is historical, not current) — a naive collapse throws inside the first-boot bootstrap.
- GATE — ARCHITECTURE-SPINE.md was NOT edited from inside this change set and no [TARGET] tag was flipped.

### `20-9-readability-guarantee` — backlog

*2026-07-29 → 2026-08-08*

- AC-1 (build-time fit assertion over the shipped seed) is NOT gated on 20.10: the seed carries zero fontFamily overrides, so every element is Arial and the check runs today.
- Measured defect: estimateTextFitScale pins contentWidth: 0 and counts only authored newlines, so wrapping can never force a PPTX shrink — intercessory-671-lyric-1 (305 chars, zero line breaks) bakes scale 1.0 against a web-measured ~0.77.

### `20-10-font-set-is-closed` — backlog

*2026-08-08*

- CARRIES A GATE of the same shape Story 20.1 had — it fixes what data may exist, so ARCHITECTURE-SPINE.md must NOT be edited from inside its change set; AD-30 is written by a bmad-architecture Update run.

### `epic-21` — in-progress

*2026-08-01*

- _no caveat, gate or evidence recorded; see git for the full narration_

### `21-1-verse-database-ships` — done

*2026-08-01*

- PATH SUPERSEDED 2026-08-01 by FR-24, after this story closed: the corpus moves to data/en/bible-translation/kjv.json.
- Superseded in writing (story file + epics.md), never silently rewritten.

### `21-2-translation-is-a-parameter` — done

*2026-08-01*

- Two things the epic text understates and the story now owns, both assigned by the spine's Deferred by story number: the AD-25 RECONCILE for the bible family (the seed's early return goes, removal arrives, a bad file reconciles nothing) and the GUARD that AD-25's closure and AD-26's never-filter rule both rest on.

### `21-3-default-translation-and-presenter-choice` — backlog

*2026-08-01*

- _no caveat, gate or evidence recorded; see git for the full narration_

### `21-4-book-names-belong-to-the-translation` — backlog

*2026-08-01*

- SUPERSEDED THE SAME DAY by the input-model Correct Course (third run of the day): input is NOT generous.
- BOOK_ALIASES is REPLACED, not deleted: non-prefix aliases (Jn, Mt) live in the matcher and BELONG TO A TRANSLATION, so Kej must not resolve under KJV. shortName dropped - 6 sites, measured.
- Crosses an epic boundary: parser.ts:152/:162 carry a second copy of scripture.ts:42's regex, and one rule may not have two implementations (spine Boundaries convention).

### `21-5-one-field-inline-autocomplete` — backlog

*2026-08-01*

- _no caveat, gate or evidence recorded; see git for the full narration_

### `epic-22` — in-progress

- It also needs the owner-supplied number-to-title list — see action_items.

### `22-1-song-book-ships-with-book-code` — done

*2026-08-01*

- done 2026-08-01: corpus moved to data/song-book/sdah.json carrying book.code, book.attribution and the takedown statement; hymns rebuilt as UNIQUE(book_code, number) with a one-time boot migration recording existing rows as SDAH; import:hymnal RETIRED (its .work/lirik-lagu.json source does not exist), replaced by corpus:verify.
- PATH + COLUMN SUPERSEDED 2026-08-01 by FR-24, after this story closed: corpus moves to data/en/song-book/sdah.json and book_code is renamed song_book_code.
- The UNIQUE(..., number) constraint, the attribution and the retired importer are unaffected.

### `22-2-hymn-title-is-a-title` — done

*2026-08-01*

- done 2026-08-01: all 695 titles replaced from the owner-supplied index, which arrived the same day and cleared the blocker action_items recorded.
- The architecture gate was NOT bypassed and is NOT closed.

### `22-3-default-song-book-and-per-song-override` — backlog

*2026-08-01*

- _no caveat, gate or evidence recorded; see git for the full narration_

### `epic-23` — in-progress

- Story 22.3 remains gated on Story 20.7.

### `23-2-fresh-clone-verified` — backlog

*2026-08-01*

- Partial work delivered 2026-08-01: tests/corpus.test.mjs rejects retired import commands, data/hymns.json, and data/bible/ in reader-facing tracked files.
- The FR-24 data/song-book/ criterion remains open until Story 22.3 performs that path move.
- The fresh-clone end-to-end assertion also remains open until Story 23.1 supplies npm run seed:demo.

### `epic-24` — in-progress

*2026-08-01*

- Deliberately separate from Epics 21/22, which carry the DATA half (FR-24) of the same day's locale work: the two halves share a word and nothing else — no table, no module, no test, no file.

### `24-1-string-catalogue-switcher-and-lang` — done

*2026-08-01*

- An UNRESOLVED KEY MUST BE VISIBLE AS A DEFECT, never rendered blank. ui_locale is the fourth of FR-24's four settings keys and the only one this epic owns.
- Four mechanism decisions 24.2 inherits 100-150 times, so they are ACs: the catalogue is CODE not database rows (AD-25 excludes it from the corpus channel by name); NO second root-level client provider (server-read state travels as an initial* prop, and AD-24's Deferred already holds that question open for Story 17.6); a missing key never falls back to English, with key-set parity asserted so the sweep adds keys in […]
- Own component, not a shared language card: EXPERIENCE.md:73 says per-concern, and a shared card is a file Stories 21.3/22.3 would each have to rewrite.

### `24-2-the-strings-move` — backlog

*2026-08-01*

- _no caveat, gate or evidence recorded; see git for the full narration_

---

## Action items

### Epic 16 — Inspect a generated deck and the projector BEFORE FIRST USE (registry now owns layout; only order/content are machine-verified).

- **owner:** "kodesh87"  |  **status:** `open`

*2026-07-29*

- _no caveat, gate or evidence recorded; see git for the full narration_

### Epic 16 — Reset welcome, verse-reading, special-song, family-youth, bible-verse-contemplation on the FIRST DEPLOYED DB, if its rows predate the current seed.

- **owner:** "kodesh87"  |  **status:** `open`

*2026-07-29*

- _no caveat, gate or evidence recorded; see git for the full narration_

### Epic 16 — Add a seed conformance test: every declared placeholder bound to exactly one element, every planner template id present

- **owner:** "Developer"  |  **status:** `done`

*2026-07-29*

- 2026-07-29 tests/registry-seed-conformance.test.mjs (6 assertions).
- Covers the direction validate.ts does not: a declared-but-unbound placeholder, whose value is computed then never rendered — the failure pptx-content.test.mjs records for the verse-reading citation, special-song performer and welcome date.

### Epic 16 — Add a ceiling assertion for deck bytes / generation time

- **owner:** "Developer"  |  **status:** `done`

*2026-07-29*

- 2026-07-29 tests/pptx-ceiling.test.mjs.

### Epic 16 — Repair the two pre-existing stale checks in scripts/smoke-deck-fidelity.mjs left from the Epic 14 field renames

- **owner:** "Developer"  |  **status:** `not-reproducible`

*2026-07-29*

- _no caveat, gate or evidence recorded; see git for the full narration_

### Epic 15 — Consider moving the hardcoded song-title skip rules out of slide-plan.ts now that the Artifact Registry exists

- **owner:** "Developer"  |  **status:** `done`

*2026-07-30*

- _no caveat, gate or evidence recorded; see git for the full narration_

### Epic 16 — Operator tooling: scripts/registry-doctor.mjs (npm run registry:doctor) reports what the seeder would do to every template on a given DB_PATH, and applies only the resets startup will not do itself.

- **owner:** "Developer"  |  **status:** `done`

*2026-07-29*

- Exists because the 'reset five template rows' item was written against insert-missing-only seeding and could not tell an admin-edited row (must not be reset blindly) from an untouched one (startup fixes it)

### Epic 14 — Assert that the create/edit form preserves operator-chosen Announcement List order (FR-11b). The date-collision override is already covered by tests/services-lib.test.mjs:161

- **owner:** "Developer"  |  **status:** `done`

*2026-07-29*

- 2026-07-29 tests/services-create.test.mjs — 'announcement sync preserves operator-chosen order, including a reorder'.

### Epic null — Route UX findings F4-1 (protagonists contradict PRD: Sari/Bimo/Elen are authoritative), F4-3 (UJ-3 has no flow), F4-4 (UJ-5 demoted to a branch), F4-5 (FR-16 blanking / NFR-5 unmapped-input channel / …

- **owner:** "kodesh87"  |  **status:** `done`

*2026-07-29 → 2026-07-30*

- _no caveat, gate or evidence recorded; see git for the full narration_

### Epic null — Close or waive the three unrecorded Phase-1 go/no-go spikes (PRD §6): font proven on a clean machine, church fidelity sign-off on a sample slide set, 5-10 historical Rundown corpus

- **owner:** "kodesh87"  |  **status:** `partially-done`

*2026-07-29*

- 2026-07-29 owner decision: the two gates requiring the church are WAIVED and will not be sought.
- The font-on-a-clean-machine gate is technical and remains open with the maintainer

### Epic null — Create the epic and stories for the readiness-report product defects

- **owner:** "kodesh87"  |  **status:** `done`

*2026-07-29*

- Delivered as TWO epics rather than one, because C5-1's remediation applies the user-value standard to new epics: Epic 17 is what an operator sees (dark mode, muted-foreground contrast, app metadata, canvas dirty-state guard), Epic 18 is what a visitor must never see (in-route authorization for the nine proxy-only routes; FR-18 + NFR-6).

### Epic null — SUPERSEDED 2026-07-29 — merged into the single purge item below. The history rewrite covered the F4-2 names and the second-instance names in one operation, and one Support ticket covering all eight pre-rewrite SHAs settles both.

- **owner:** "kodesh87"  |  **status:** `done`

*2026-07-29*

- SUPERSEDED 2026-07-29 — merged into the single purge item below.

### Epic null — SECOND PII instance, found 2026-07-29 by widening the F4-2 sweep from _bmad-output/** to the whole tracked tree: ten real names across data/asset-map.json (slide-56 evidence — a family surname, three …

- **owner:** "kodesh87"  |  **status:** `done`

*2026-07-29*

- Three names are deliberately left unblocked, for the reason the guard already documents: one is a word in 182 hymns and in 'Amazing Grace', one is a figure in the Bible, and one predecessor's given name is also a book of the Bible — that person's surname is what identified them, and the surname is blocked.
- Verified: git grep -w finds none, guard 4/4, npm test 332 pass / 0 fail, smoke 30/30

### Epic null — RESIDUAL of the second PII instance: history rewrite.

- **owner:** "kodesh87"  |  **status:** `done`

*2026-07-29*

- DONE 2026-07-29 — all 12 commits rewritten with git filter-branch (filter-repo is not installed and no external tool was downloaded) and force-pushed with --force-with-lease. origin/main moved 2dd8069 -> a9277ff; every SHA changed.

### Epic null — Residual of the history rewrite: GitHub keeps the pre-rewrite objects and serves them by direct SHA until it garbage-collects on its own schedule

- **owner:** "kodesh87"  |  **status:** `waived`

*2026-07-29*

- 2026-07-29 owner decision: no Support purge ticket will be filed; GitHub's own garbage collection is accepted as sufficient.

### Epic null — Re-infection vector: scripts/extract-pptx-assets.mjs build-map regenerates data/asset-map.json from the real deck, and its `evidence` field is the slide's own text runs — so re-running it reintroduced real member names and prayer requests.

- **owner:** "Developer"  |  **status:** `done`

*2026-07-29*

- Asserted by tests/asset-map-evidence.test.mjs (4 assertions, stated independently of the generator so it cannot agree with the bug).

### Epic 20 — BLOCKS Story 20.8.

- **owner:** "kodesh87"  |  **status:** `partially-done`

*2026-07-30*

- SPINE HALF DONE, EXPERIENCE.md HALF STILL OPEN — the item asked for both in one change set and only one landed, so it is not closed.
- Whether the slot identities live in the base_type column or a discriminator beside it is DELIBERATELY LEFT to Story 20.2/20.7 — the spine fixes the invariant, not the schema.
- ARCHITECTURE CONSOLIDATED 2026-07-30 by owner directive, after these notes were written: BMad's default is one spine per project, so the Epic 16 child spine was FOLDED INTO the project spine and its AD-1..AD-9 renumbered to AD-11..AD-19 (AD map published in both files; AGENTS.md never-renumber rule waived once by the owner, recorded as a non-precedent in all three gate files; 36 live citations repaired).
- SUPERSEDED IN ONE DETAIL 2026-07-30 (later the same day): where this note says AD-18 makes value migrations "marker-gated, precedent artifact_seed_hash_backfilled", that mechanism is gone.

### Epic 20 — Decide Epic 19's fate when Story 20.1 is planned: deliver story 19-1 inside 20.1 or retire Epic 19.

- **owner:** "kodesh87"  |  **status:** `done`

*2026-07-30*

- 2026-07-30 RETIRED — and by a route neither option in this item anticipated.
- A General generates no title slide, so skipTitle is REMOVED not migrated: there is no flag left to store anywhere, so there was never a second implementation to avoid.
- Epic 19 goal met, method discarded; epic-19 and 19-1 set to retired.

### Epic 20 — Gap 4 — bmad-spec Update.

- **owner:** "kodesh87"  |  **status:** `done`

*2026-07-30 → 2026-07-31*

- Landed: authoring-boundaries.md drops the editable baseType from the inspector step and gains a "What the administrator may not edit at all" section — kind, slot identity and catalog key are server-owned, set at creation, closed at six keys over three kinds; slide-kinds.md now leads with the four slot IDENTITIES as the binding key and names the three consequences (reorder and rename cannot touch a binding, delete […]
- STILL OPEN and now the blocking pair for the same corpus, both outside this spec folder: review findings F-4 and F-10 against ../spec-slide-artifact-model/SPEC.md — an ADOPTED COMPANION of the spec just fixed, which Stories 20.1 and 20.3 read — where :64 still presents the missing-only seed as live (AD-17 reversed it), :65 still presents templates as global across services (AD-16 reversed it), CAP-8 still requires a […]
- TWO MORE for the same pass, added by the 2026-07-30 owner session: AD-19 now states the recognized entry set is CLOSED at six keys over three kinds (general, songset-bt-open, songset-bt-close, songset-ds-open, songset-ds-close, announcement) and that bare song-set names the kind but is never an entry key — so any SPEC text implying a single SongSet row needs reconciling, and the seed's one song-set row becomes four; […]

### Epic 20 — Gap 4b — bmad-spec Update on spec-slide-artifact-model, opened 2026-07-31 by the Gap 4 pass because the findings had a fix route and no tracker.

- **owner:** "kodesh87"  |  **status:** `done`

*2026-07-10 → 2026-07-31*

- Fix: extend :16 from two reversals to four naming AD-17 against :64 and AD-16 against :65, mark both constraint bullets superseded in place, extend the note to CAP-8 and state the successor (a General carrying a Placeholder Catalog text element)

### Epic 20 — Gap 3 — one finding to fold into the bmad-ux pass, NOT the whole gap-3 scope (see the 2026-07-30 handover for that): CAP-5 shows a registry entry as '[kind] label', and AD-19 now fixes six recognized …

- **owner:** "kodesh87"  |  **status:** `done`

*2026-07-30 → 2026-07-31*

- Decided in EXPERIENCE.md (Inside /admin/artifacts, 'Row display'): the chip reads the KIND, never the entry key.
- Recorded with its consequence rather than as a bare verdict: four SongSet rows share one chip and are told apart by editable labels, so the bounded-configuration surface must state the row's slot identity read-only in worship vocabulary — a rename must not orphan the row's liturgical identity.
- Gap 3 — one finding to fold into the bmad-ux pass, NOT the whole gap-3 scope (see the 2026-07-30 handover for that): CAP-5 shows a registry entry as '[kind] label', and AD-19 now fixes six recognized keys over three kinds with song-set naming the kind but never an entry.
- Raised by the rubric-walker lens (R9) in reviews/review-rubric-walker-2026-07-30-post-trim.md and deliberately routed rather than decided in the spine

### Epic 20 — Story 20.1 seed authoring — the SongSet layout specification the owner gave on 2026-07-30.

- **owner:** "Developer"  |  **status:** `open`

*2026-07-30*

- Recorded here rather than in the architecture spine deliberately: it is one seed with one answer, so no two units can choose it incompatibly, and AD-22 fixes only that the layout is developer-owned seed data.
- What the owner's description did not cover and the seed author must handle: src/lib/lyrics.ts emits 'n/total' for a verse (line 384), 'Reff' (386) AND 'Chorus' (388), and for lyrics with no headers it emits an EMPTY label (413) or '1/1' (452) — so the label element must tolerate an empty value.

### Epic null — COLLATERAL DAMAGE of the 2026-07-29 PII remediation, in a class none of the items above anticipated: the text substitution that replaced real names with invented ones ran over the whole tracked tree, …

- **owner:** "kodesh87"  |  **status:** `done`

*2026-07-29*

- Nothing caught it because npm is the only thing in this repository that verifies a checksum, and npm only speaks when someone installs — `npm test` never looked at a derived value at all.
- FIXED in 488eb19 by restoring the registry's authentic digest (an upstream checksum, not congregation data; the substring is not fingerprinted and the public-repo guard passes 4/4 with it).

### Epic null — RESIDUAL of the lockfile corruption: measure the real blast radius.

- **owner:** "kodesh87"  |  **status:** `done`

*2026-07-28 → 2026-07-31*

- (4) data/asset-map.json has zero invented-name hits in any field, consistent with acc8df0 having withheld payload runs, and tests/fixtures/ contains only the prose rundown.

### Epic null — RESIDUAL of the lockfile corruption: recover the substitution pairs the 2026-07-29 pass applied, so the sweep above could be aimed.

- **owner:** "kodesh87"  |  **status:** `done`

*2026-07-29*

- It is deliberately not fingerprinted

### Epic null — Close the recurrence gap the lockfile corruption exposed: nothing in `npm test` verified any derived value, so a rewritten checksum could only be found by installing

- **owner:** "kodesh87"  |  **status:** `done`

*2026-07-29 → 2026-07-31*

- _no caveat, gate or evidence recorded; see git for the full narration_

### Epic 22 — STILL OPEN, and re-scoped 2026-08-01: Story 22.2 shipped without waiting on this, which needs stating precisely so the gate is not quietly treated as closed.

- **owner:** "kodesh87"  |  **status:** `done`

*2026-08-01*

- So correcting 695 titles was never AD-21's case, and the counter's landing story stays unassigned at Epic 20's first release (spine Deferred amended to say so).
- STILL OPEN, and re-scoped 2026-08-01: Story 22.2 shipped without waiting on this, which needs stating precisely so the gate is not quietly treated as closed.
- Note the new bible seeder deliberately does NOT use that channel: seedBibleCorpus only fills a translation holding zero verses, so it never overwrites a persisted value — one precedent for the decision, not the decision itself.
- Add the next AD-n — never renumber — settling whether the shipped corpora ride the boot upsert or the counter arrives here.

### Epic 21 — bmad-ux Update: EXPERIENCE.md:143 states, as a shipped state, that lookup is unavailable when the corpus was never imported (an ops step). Once the corpus ships the default flips, and that message survives only as the unreadable-file path.

- **owner:** "kodesh87"  |  **status:** `done`

*2026-08-01*

- bmad-ux Update: EXPERIENCE.md:143 states, as a shipped state, that lookup is unavailable when the corpus was never imported (an ops step).

### Epic 22 — Supply the number-to-title list for the 695 SDAH hymns.

- **owner:** "kodesh87"  |  **status:** `done`

*2026-08-01*

- _no caveat, gate or evidence recorded; see git for the full narration_

### Epic 22 — Decide four SDAH titles the owner index spells differently from the lyrics beneath them, left VERBATIM rather than silently corrected: #81 'Thou I Speak With Tongues' (lyric: 'Though I speak with …

- **owner:** "kodesh87"  |  **status:** `dropped`

*2026-08-01*

- 2026-08-01 raised to the owner and EXPLICITLY DROPPED.
- The owner-supplied index is authoritative and stays verbatim; all four project as written.

### Epic 21 — Delete .work/tp_bible_book_translations_*.json and .work/tp_bible_verses_*.json from the main checkout AFTER Story 21.1 completeness assertion is green (66 books / 1,189 chapters / 31,102 verses).

- **owner:** "kodesh87"  |  **status:** `done`

*2026-08-01*

- _no caveat, gate or evidence recorded; see git for the full narration_

### Epic 21 — bmad-architecture Update — SCOPE WIDENED 2026-08-01 by the second Correct Course of the day; this EXTENDS the still-open epic-22 architecture item above rather than replacing it, and both should be settled in ONE run.

- **owner:** "Developer"  |  **status:** `done`

*2026-08-01*

- The corpus CODE is globally unique across locales and is the cross-boundary key (AD-19's class); LOCALE IS AN ATTRIBUTE, never part of a key and never a predicate — which is what makes FR-24's never-filter rule STRUCTURAL rather than disciplinary, since no key holds a locale so no read path can need one.
- The target shape was deliberately NOT decided by Correct Course; it is named there only so the stories can cite something.

### Epic 24 — bmad-ux Update — EXPERIENCE.md is now stale in TWO ways and one run should close both.

- **owner:** "Developer"  |  **status:** `done`

*2026-07-30 → 2026-08-01*

- Corpus picker added as a Component Patterns row whose stated job is making the never-filter rule VISIBLE, because the failure is silent: an operator cannot tell a view filter from a data filter, and one who believes the English hymnal is unreachable never asks for it.
- It gained three bounds the item did not have: the ambiguity is INTRA-translation and live on the single corpus shipping today (Phil, Jo), so an explanation written only for the cross-translation case is missing where it is already needed; the colliding candidates are known at the moment of refusal, so naming them is cheap; and the operator cannot act on the corpus, so it must not read as an instruction to fix an […]
- (1) The pre-existing item: the State Patterns row at EXPERIENCE.md:143 states, as a shipped state, that lookup is unavailable when the corpus was never imported (an ops step).
- The never-filter rule is what the picker must make visible: an Operator has to be able to SEE that other locales are reachable, or a default that only filters the view will read to them as one that filters the data.

### Epic 21 — bmad-architecture Update — the owner direction REVERSES a clause AD-27 shipped hours earlier, so it needs a NEW AD rather than an edit to that one. NEVER RENUMBER: add AD-28. What it must settle.

- **owner:** "Developer"  |  **status:** `done`

*2026-08-01*

- Now a required, registry-validated corpus code; absent or unrecognised is REFUSED; all-installed is a property of the rundown surface, never a fallback.
- (1) AD-27's 'input tolerance is the matcher's concern, never the corpus's' SURVIVES, but its 'one SHARED server-side matcher' does not: the matcher is one implementation carrying a SCOPE — the chosen translation on operator surfaces, all installed translations on the rundown, because a Telegram sender picks none.
- (5) The Boundaries convention is ALREADY violated on shipped code — scripture.ts:42 and parser.ts:152/:162 carry the same regex — and the one-matcher rule is what closes it, which also means Story 21.4 legitimately reaches into Epic 2/5 code.
- What SURVIVES of AD-27 and must not be re-litigated: the canonical translation-independent identity, names owned by the translation, output exact, and refusal with the book named

### Epic 20 — Gap 3 CLOSE-OUT — bmad-spec Update on spec-artifact-registry-authoring, opened 2026-08-07 by the owner.

- **owner:** "kodesh87"  |  **status:** `done`

*2026-07-31 → 2026-08-07*

- NAMED: slide-kinds.md Badge display now records the decision — the chip names the KIND, never the entry key, so a songset-bt-open row shows [song-set] — with the three standing grounds (AD-19 server-owned binding vocabulary, CAP-5 label-only, EXPERIENCE.md's voice rule) and owner Story 20.3; the stale "Tracked as Gap 3" pointer is dropped, since aiming a builder at a closed tracker row is worse than silence.
- COHERENCE 2, the one that was a build defect rather than wording — the decision's SECOND half (the AD-22 bounded surface must state the row's slot read-only in worship vocabulary, because four SongSet rows share one chip and labels are renameable) was FORBIDDEN by three standing statements: CAP-5's success said "no surface exposes the row's kind or its SongSet slot identity", a DISPLAY ban where AD-19 says only […]
- Gap 3 CLOSE-OUT — bmad-spec Update on spec-artifact-registry-authoring, opened 2026-08-07 by the owner.
- Pure ordering artifact: the Gap 4 bmad-spec pass ran FIRST that day and deliberately flagged the question open with its owner named; the bmad-ux pass answered it hours later and nothing came back to close the loop in the spec folder.

### Epic 20 — OWNER RATIFICATION of the CAP-2 add-verb assumption, given 2026-08-07 in the same session as the Gap 3 close-out.

- **owner:** "kodesh87"  |  **status:** `done`

*2026-07-31 → 2026-08-07*

- RATIFIED, and the owner sharpened it with a distinction the spec never made: TWO LEVELS, not one.
- That corrects three statements that read as an enforced cap and were only ever describing the common case — CAP-7's "a single registry entry", slide-kinds.md's "One row [Announcement]" and its "Insert one Announcement entry" — and it is consistent with AD-19, which states at-most-one for SLOT IDENTITIES and never for announcement.
- Assumptions 4 -> 3, the ratified one retired with a visible marker rather than dropped.
- A builder must not invent a subset mechanism to give the second row meaning.

### Epic 20 — The Open Question the ratification above opened — what a SECOND Announcement row is for, given each row expands the whole live list. Routed to Story 20.6

- **owner:** "kodesh87"  |  **status:** `done`

*2026-08-07*

- 2026-08-07, answered by the owner the same day, hours after it was opened.
- Several Announcement rows mean REPEATING the identical set at the start, middle and end of one service — never splitting the list across positions.
- CAP-7 success and slide-kinds.md now state that repetition is the intended use and that nothing deduplicates, collapses, or warns; per-row membership stays explicitly unwanted, so Story 20.6 must not build one.
