# Deferred Work — the project's open debt register

**This file is the single authoritative list of open implementation debt.** `AGENTS.md`'s authority
map names it. Two neighbours deliberately hold no debt list of their own and point here instead:

- `ARCHITECTURE-SPINE.md` → *Deferred* carries only **deferred decisions** and dimensions that spine
  does not own yet — never work items.
- Behavioural and affordance questions that used to live in EXPERIENCE *Open Items* live in
  `.control/questions/assumptions.md` (OQ-13..OQ-16). `wdi-ux` was not run (DEC-001).

One entry per open debt: what it is, who owns it, why it can wait. An entry with no owner says so —
that is a real state, not an omission. Closed work is **not** kept here; git holds the prior text.

---

## Architecture decision gaps

The unclosed half of seven adopted decisions. Each `AD` states its own gap in one line; this is where
the owner and the reason it can wait live.

| Debt | Owner | Why it can wait |
| --- | --- | --- |
| **AD-18** — the derived-index rule has no guard. The Rule requires that *"a migration that writes a column alone is refused by a test asserting column and payload agree for every row"*. Every shipped write does set both in one statement (`src/lib/registry/store.ts:268-291`, `:341-349`), so the rule holds in code — but no such test exists; `tests/artifact-kinds.test.mjs:155-171` pins the `artifact_templates` DDL column list, which is a different assertion. | unassigned — route to whichever story next writes a value migration | Nothing can violate it today: the only writers are the two statements above and both maintain the pair, so the guard protects a future migration rather than present code. It belongs with the first migration that rewrites `base_type`, on the AD-25 precedent that a guard ships with the thing it guards, and per the standing rule it must be proved to react — write a column-only row and watch the suite go red. Until then the rule is honour-system, which is exactly what this entry exists to say out loud. |
| **AD-20** — five handlers in `src/lib/slide-plan.ts` are keyed on hardcoded row ids and still decide which hymn fills each slot: `bt-opening-song` (`:357`), `bt-closing-song` (`:413`), `ds-opening-song` (`:478`), `song-set` (`:514`) and `ds-closing-song` (`:578`). Adding a fifth song position is a code change and a deploy. | **Story 20.7** | AD-19's ordered-entry model arriving late rather than a defect: the `songset-*` slot identities appear nowhere in `src/` yet, so the slot→rundown-position mapping lives in this handler table instead of the one table AD-19 requires. 20.7 lands the identities, the mapping table and the deletion of `song1Number..song4Number` in one change set. |
| **AD-25** — the reconcile exists for the bible family and not the song book. `upsertHymns` (`src/lib/db/index.ts:63-81`) re-applies title and lyrics every boot and removes nothing; no song-book registry table exists; it loads the default song book rather than what is installed. | **Story 22.3** | Story 21.2 discharged the bible side. **A consequence to decide rather than discover:** rows stamped `SDAH` by Story 22.1's boot migration that are not among the corpus's 695 disappear at the next boot — correct under AD-25, and free only under the pre-first-deploy licence. **For whoever writes the guard: prove it reacts.** A reconcile test that only checks the 695 expected rows are present passes on a table holding 700. |

---

## Security and auth

| Debt | Owner | Why it can wait |
| --- | --- | --- |
| Nine API routes carry no in-route authorization and rely entirely on the AD-5 Go gate: `/api/services*`, `/api/hymns`, `/api/scripture`, `/api/announcements`, `/api/upload`, `/api/uploads/[filename]` — none contains a `requireSession` call. | **Epic 18** | `tests/go-http-gate.test.mjs` pins the matcher and the six gated pages were moved onto the DB-checked path, so there is one working layer. The spine records it as a standing waiver with its expiry condition. |
| `/api/webhook` has no throttling. Go compares the secret with `crypto/subtle.ConstantTimeCompare`. | unassigned | The route is exempt from the gate by design. Same class of gap the login hardening closed, but changing the webhook auth mechanism was forbidden by that spec's scope. |
| The client address used for IP rate limiting is read from forgeable headers (`cf-connecting-ip`, leftmost `x-forwarded-for`, `x-real-ip`), so the 20-per-IP threshold is evadable by header rotation. | unassigned | Documented best-effort in `src/lib/auth/client-ip.ts`. Only values parsing as a real IPv4/IPv6 address become keys and the shared unknown bucket is never counted, so the failure mode is **extra attempts, not a lockout of third parties**. Closing it properly needs a trusted hop count in front of the origin. |
| A distributed attacker gets 5 attempts per source address against one username rather than 5 in total, because the lockout is scoped to the `(username, address)` pair. | — accepted trade | Deliberate, made during review. The global per-username counter it replaced let any single host deny the admin account permanently at one request per 2.5 minutes — the worse outcome for a hub that must work at a fixed hour on Sabbath morning. Cloudflare is the volumetric layer in front. |
| Reaching a 429 is a weak activity oracle: an attacker parked at the threshold infers from an early 401 that the real owner just signed in and cleared the ledger. | — accepted | Inherent to any lockout that clears on success, and much narrower after pair scoping, since an attacker can only observe pairs on their own address. |
| A rotating-key flood (fresh username *and* fresh forwarded address per request) trips neither threshold, so each request still runs a synchronous scrypt plus several SQLite statements on the single Node thread. | unassigned | Not a regression in reachability — the login route was entirely unthrottled before. `login_attempts` is capped at 5000 rows so the table cannot grow without bound. |
| Concurrent first-boot hymn seed UNIQUE race. | unassigned | Rare under a single Go API process; harden if a multi-instance deploy ever happens. |

---

## Concurrency and data integrity

| Debt | Owner | Why it can wait |
| --- | --- | --- |
| `readUpdatedAt` returns `''` when both `updated_at` and `created_at` are NULL, and its `||` fallback diverges from the SQL `COALESCE` when `updated_at` is the empty string — a row in that state can never be updated. | unassigned | Reachable only through direct DB manipulation today; `tests/services-lib.test.mjs` exploits the same seam deliberately to reach the in-transaction conflict branch. |
| A `PUT` does not invalidate a cached generated PPTX for that service. | unassigned | The Go download path generates each request (`internal/httpapi/server.go` `getPptx`) and does not read `src/lib/pptx-cache.ts`. The Node cache helper remains for tests and retention cleanup only. |
| A 409 in the artifact editor discards unsaved authored elements; the message is explicit but there is no merge or recovery path. | unassigned | Reloading the server version remounts the canvas and clears added-element tracking. A full merge was always out of scope. |
| `nextRegistryUpdatedAt` (`src/lib/registry/store.ts`) has no guard if a stored `updated_at` fails `Date.parse` (`NaN` → `RangeError` inside the delete/reorder transaction). | unassigned — W1 1-1 panel follow-up | Not reachable through current writers (`toISOString()`). Defensive check is a later hardening, not a story AC miss. |
| Reorder `400` (concurrent membership change) does not `loadList()` the way `409` already does (`ArtifactEditor.tsx` `handleMoveTemplate`). | unassigned — W1 1-1 panel follow-up | The Up/Down buttons stay wired to a stale local array until an unrelated reload. Same class of problem as the 409 branch; not an AC miss. |

---

## API surface and client payloads

| Debt | Owner | Why it can wait |
| --- | --- | --- |
| `GET /api/hymns?all=1` is dead code and still returns an unbounded ~40 KB hymn dump. | unassigned | Nothing in `src/` calls it. Revisit once a legacy caller is confirmed absent. |
| The full hymn index (~695 entries) is embedded in the create/edit page HTML. | unassigned | Follows decision 5a; lazy-load or chunk if payload size starts to matter. |
| In the hymn autocomplete, a `?numbers=` lookup returning no row (typo hymn 9999) and one that fails are both rendered as a bare number, and neither is retried. | unassigned | Cosmetic today, because the seed covers every stored value on the edit page; only the create-page Parse-hydrate path can reach it. |
| A PUT edit can move a service onto another service's date with no collision check. | unassigned | Create-path CAP-4 is primary; warn-on-edit is an optional follow-up. |
| Fat `internal/httpapi` handlers and leftover `any` typing in the SPA. | unassigned | Style debt; extract to `src/lib/*` in a follow-up refactor. |
| ArtifactEditor delete/reorder request bodies and swap direction are asserted only through route-handler tests, not through the client AST (`tests/canvas-dirty-guard.test.mjs`). | unassigned — W1 1-1 panel follow-up | An inverted Up/Down swap or a wrong delete field name would leave HTTP tests green. |
| `RegistryNotFoundError` and reorder unknown-id validation share the message `Unknown template: ${id}` at 404 vs 400. | unassigned — W1 1-1 panel follow-up | Cosmetic: the client dispatches on status, not text. |
| `ArtifactTemplateOrderItem` is exported from `store.ts` and unused by the order route (items stay `unknown` until `reorderArtifactTemplates`). | unassigned — W1 1-1 panel follow-up | Type-only; no behaviour delta. |

---

## Registry, seed and deck fidelity

| Debt | Owner | Why it can wait |
| --- | --- | --- |
| **Registry vocabulary the validator does not admit**, blocking three deck-parity gaps: element **rotation** (`family-youth`'s "Prayer Request" label is stored at its unrotated box `[-14.44, 49.56, 42.01, 8.54]`, so it renders horizontally and its negative `x` pushes it off the left edge), **layout-background opacity** and **image-element opacity** (`verse-reading` renders roughly twice as bright as the source deck, which draws its background at `alphaModFix 50%`; `resolveOpacity` is applied only by `ShapeElement` and `ImageElement` ignores `style.opacity` entirely). | unassigned | Each needs a registry-contract change honoured by **both** renderers, not a seed edit. Measured against the source decks in the 2026-07-26 paint-order audit; expensive to re-derive. |
| `family-youth` is missing two translucent scrim panels, and the family/youth **name** lines have no element at all — ids run `e1, e3, e4, e5, e7, e8, e9, e10, e11`, and the absent `e2`/`e6` are exactly those lines, so the `familyText`/`youthText` placeholders bind to the prayer-request bodies instead. | unassigned | The scrim half is expressible today (`shape` + `style.fillColor` + `style.opacity`), so it is scope rather than vocabulary. |
| `offering-tithe` shows the plate's empty gold frame: the source deck's QR has no registry element and its asset was never extracted. | unassigned | Needs an asset-extraction step first, then an `image` element — not a seed edit. When it lands it is a **second writer** into the registry and is bound by AD-15. |
| `thank-you` and `midweek-prayer` carry hand-authored text matching neither source deck, including a literal `[placeholder]` where the midweek day and time belong — **it will be projected verbatim** until someone supplies them. | unassigned — needs a product decision | Changing worship-facing wording the deck does not settle needs the owner, not a developer. |
| Live Preview shows `title`/`subtitle` from hardcoded strings in `src/lib/slide-plan.ts`, so an admin editing a template's text changes the deck and projector but not the operator's preview. | unassigned | The legacy `SlidePlanItem` fields were deliberately preserved for consumer compatibility. |
| Deleting a template id still referenced by `ROW_HANDLERS` (`welcome`, `sermon`, …) silently omits that slide from every future plan; there is no core-vs-extra guard or extra confirm copy. | unassigned — W1 1-1 panel; owner-accepted residual | Story 1-1 AC made deletion uniform, including to zero rows. Do not add a guard unless the owner asks. |
| The `verse-reading` template draws a full-bleed opaque black shape over its own background, so that asset is embedded but never visible. | unassigned | Inherited from the v0 source-deck extraction; harmless after media dedup, but the layout carries a contradiction an admin cannot see. |
| The generated deck is ~10 MB with no automated ceiling on bytes, generation time or peak memory. | unassigned | Dedup + DEFLATE cut 39 MB to ~10 MB, but only structural properties are asserted, so a future seed asset change could regress size unnoticed. |
| Databases created before Epic 16's seed fixes keep the old rows for `welcome`, `verse-reading`, `special-song`, `family-youth` and `bible-verse-contemplation`. | unassigned | Reaches them only through a fresh DB or an admin Reset of those five templates — AD-17 makes that correct behaviour rather than a bug, since the seed is a bootstrap and not a correction channel. |

---

## Corpus and scripture

| Debt | Owner | Why it can wait |
| --- | --- | --- |
| **AD-27's identity row still holds display columns.** `bible_books` remains `(id, name, short_name)` because SQLite cannot drop NOT NULL columns in place; names are written once (`ON CONFLICT DO NOTHING`) and live reads go to `bible_book_names`. Book ids are still supplied by the corpus file. | unassigned — rebuild migration | Display arbitration is closed. Dropping the leftover columns is a rebuild migration, not a second translation hazard. |
| **AD-26 has a registry for one corpus family and none for the other.** `bible_translations` ships with code, name, locale, licence and provenance, but `song_books` does not exist anywhere in `src/` and `hymns.book_code` was never renamed to `song_book_code`, so a song book is not a registered entity and its code is not the cross-boundary key the Rule requires. Three further clauses are unbuilt with it: the boot refusal when two corpus files declare one code, the loader check that a declared locale agrees with its directory, and the inert-not-error behaviour of a `default_*` setting naming an uninstalled corpus. | **Story 22.3** | Free while exactly one song book ships and its code is a constant — nothing can currently declare a duplicate or a mismatched locale. It arms the moment a second corpus of either family is installed, which is also what AD-25's song-book reconcile waits on, so the two land together rather than near each other. |

---

## Theme closure gate (`tests/theme-chrome.test.mjs`)

The gate AD-24 depends on. Live ceilings only; the closures Story 17.8 landed are not repeated here.

| Debt | Owner | Why it can wait |
| --- | --- | --- |
| **Closed props plus a renamed caller can still compose into a `className` leak.** `assertClosedPropsStructure` rejects a rest binding only in the exported function **parameter** (`tests/theme-chrome.test.mjs:1378-1386`). A component can instead accept an identifier typed as `{ slide: SlidePlanItem }`, derive `const { slide, ...rest } = props` **inside its body**, and spread `rest` onto its wrapper; a caller importing it under another name then passes a structurally wider variable carrying `className`. | **unassigned** — route through Correct Course or a new Epic 17 story; do **not** silently reopen Story 17.8 | Neither shipped component has this shape today, which is why it was deferred rather than patched. Both belts miss it by construction: **TypeScript accepts the variable**, the parameter-rest check sees no rest, and the caller belt matches only the literal names — `:1198` for `React.createElement` and `:1237` for JSX. |
| The positive outline classifier is a shallow vocabulary classifier, not a CSS colour parser: `localColour` does not validate function arity or channel grammar, so `focus-visible:outline-[rgb(255)]` passes the guard and is then ignored by CSS, exposing the inherited themed outline. | **unassigned** — same terms as above | No shipped projected focusable uses one. |
| A class name **composed at runtime** (`cn('bg-' + tone)`) is invisible: `themeReferences` is a set of regexes over source text. | unassigned | Latent; no shipped surface composes one. |
| *"Never its own copy"* is asserted by nothing: the `FULL_SCREEN` loop asserts `useProjectedShell()` is **present**, never that a second shell implementation is absent. | unassigned | Convention rather than assertion, and AD-24 says so rather than claiming parity with AD-5. |
| `LogoutButton` standalone variant now uses `ui/button.tsx`; menu variant uses `DropdownMenuItem` destructive. | done | Shadcn sweep 2026-08-20. |

---

## Operator UI wiring

| Debt | Owner | Why it can wait |
| --- | --- | --- |
| **Logout from a dirty canvas is unguarded.** `LogoutButton` navigates with `router.replace()` inside a click handler, so the Story 17.4 `onNavigate` dirty guard never runs for it. Session revocation (demotion, password change, account deletion) likewise lands the next request on `/login` with no mid-edit warning. | unassigned — former EXPERIENCE Open Item 5 | The security behaviour is correct and must not change. Guarding logout needs a second mechanism; designing what a mid-edit interruption owes the operator is still open. |

---

## Stack currency and platform

| Debt | Owner | Why it can wait |
| --- | --- | --- |
| **Four Stack rows sit at least a major behind current stable and the pins mean none moves on its own:** TypeScript `^5` (resolves `5.9.3`, **two** majors behind — `^5` can never resolve 6 or 7); better-sqlite3 12 (13 current, and it requires `node >=22`); fabric 6 (7 current, and `ArtifactEditor.tsx` carries two explicit v6 workarounds, so it is a real migration); ESLint `^9` (resolves the *maintenance* tag). | unassigned | Named so that *"no drift against `package.json`"* is never mistaken for *"current"*. |
| **The Node row will need this again.** Node 22 is *Maintenance* LTS; 24 is *Active*. `package.json` now has `"engines": {"node": ">=22.12.0"}` and `@types/node` is `^22`. | unassigned | The row moved off 20 because EOL made it indefensible and the same argument reaches 22 on a schedule. |
| **`next-themes` — watch the cadence, not the version.** `0.4.6` (2025-03-11) is still the latest, ~16 months without a release, but the repository is not dormant (last push 2026-02-25, not archived, not deprecated), so *unreleased activity* is the accurate reading and "abandoned" would be wrong. | unassigned | Not a defect today; named so nobody re-derives it as one. This is the one row where *undrifted* and *at head* are both true while the newest-commit-to-newest-release gap keeps growing, and AD-24 rests on this package for two contracts. Revisit if a React or Next major breaks it — the AD-24 mechanism survives a replacement, because the decision names the tiers and the closure rather than the library. |

---

## Docs and tooling drift

| Debt | Owner | Why it can wait |
| --- | --- | --- |
| `scripts/smoke-auth.mjs` carries two stale checks that already failed at baseline: a KJV-import regex that can match a legitimate scripture lookup, and an assertion on the literal `Worship Hub`, absent from `src/` at HEAD too. | unassigned | Left unmasked rather than edited to pass. The four session-gate checks in the same script pass. |
| `scripts/smoke-deck-fidelity.mjs` carries two pre-existing stale checks predating the Epic 14 renames — `EditForm has structured fields + raw payload` and `structured family update in PPTX`. | unassigned | Left unmasked rather than edited to pass. |

---

## Accepted, not open

Recorded so nobody files them as debt. The spine's *Deferred* → *Waivers and accepted risks* carries
the architecture-level ones; these are the implementation-level counterparts.

- **The song-book corpus is unreproducible, and that is accepted.** Its only source dump does not
  exist anywhere under the project root, so `import:hymnal` is **retired** rather than repointed and
  the committed corpus is the source of record. `npm run corpus:verify` asserts it is whole instead
  of pretending it can be rebuilt.
- **Multiple service rows may share one date**, by CAP-4 decision 2a. The 409 on create is a
  convenience, not an invariant — see the non-atomic check above for the part that *is* debt.
- **`failedHymnNumbers` is wiped on a preview error** (`src/operator/CreateForm.tsx`).
  Pre-existing and judged acceptable.
- **Service delete unlinks unreferenced local uploads.** Closed 2026-08-18 (OQ-7). Recurring
  announcement files stay. PPTX cache was not part of that answer.
