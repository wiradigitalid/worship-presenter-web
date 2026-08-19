---
baseline_commit: a74190329d93c36b60e2cd70f640bda426d294e4
---

# Story 17.7: The Room-Facing Shell Belongs to the Route, Not to the App

Status: done

<intent-contract>

## Intent

**Problem:** Both room-facing routes inherit the operator-themed root shell, so server first paint, `notFound()`, uncaught failures, and future route shells can expose theme-dependent background and scrollbar gutter around projected content.

**Approach:** Split URL-transparent operator and projected root route groups. Make the projected root server-render a literal-black document shell before first paint, keep projected fallbacks inside that boundary, and derive closure guards from the route structure instead of leaf-file lists.

## Boundaries & Constraints

**Always:** Preserve `/services/[id]/slideshow` and `/services/[id]/present/projector`, proxy/auth behavior, slide-plan semantics, projector synchronization, slideshow controls, and PPTX output. Keep `src/app/(operator)/layout.tsx` a Server Component with the existing `ThemeProvider`; keep all projected special files and their transitive tree free of operator providers and theme-dependent paint. Use literal `#000000`/`#FFFFFF` for room-facing shell/fallback paint. Read installed Next 16.2.10 guidance before route edits. Update IA, AD-24 through `bmad-architecture` Update, delivery tracking, project context, and Story-17.7 debt in the same change set. Prove every new/changed absence guard by injecting each claimed defect form, observing failure, and reverting it.

**Block If:** The installed framework cannot build the two-root split without changing a public URL or authorization boundary; a required error boundary cannot remain non-sensitive and room-facing; or implementation requires a structural decision beyond closing the already-adopted AD-24 shell invariant.

**Never:** Treat `useEffect`/`useLayoutEffect` as first-paint protection; use a route stylesheet whose reset survives navigation; add toast wiring or `<Toaster />`; introduce theme tokens, operator chrome, or recovery links in projector fallbacks; claim `global-error.tsx` coverage without implementing and proving it; reopen Story 17.8 guard work; or weaken public-repository/privacy guards.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Projected success | Either room URL under any operator theme | First server frame and hydrated surface have literal-black shell, no reserved gutter, unchanged slides | No error expected |
| Missing or malformed service | Any of six current `notFound()` paths | Projected 404 remains full-viewport black/white and reveals no operator chrome | No sensitive record or server detail is rendered |
| Runtime/plan failure | Server or client failure below projected root | Scroll-safe literal fallback; slideshow's existing recoverable plan error may retain its operator exit, projector exposes no operator link | Log server detail; render generic recovery copy |
| Cross-root navigation | Slideshow exits to an operator URL | Full document navigation restores the operator theme with no projected-shell residue | Build/guard fails if roots conflict or URL changes |

</intent-contract>

## Story

As a congregation viewing a projected service,
I want each room-facing URL to own a literal-black document shell and safe fallbacks,
so that operator theme and chrome never appear before hydration or during failures.

## Acceptance Criteria

1. Given either projected URL and any persisted operator theme, when the document is hard-loaded before hydration, then `<html>` and `<body>` paint literal black, hide overflow, use `scrollbar-gutter: auto`, and render no operator provider or theme-derived shell state.
2. Given the six current `notFound()` branches or an uncaught descendant error, when a projected route fails, then its framework fallback is full-viewport, black/white, scroll-safe, generic, and contains no operator chrome or projector recovery link.
3. Given navigation between operator and projected routes, when the route crosses root groups, then public URLs and auth behavior remain unchanged and the destination document owns its shell without leaked prior inline state.
4. Given a new projected `page`, `layout`, `not-found`, `error`, `loading`, `template`, or `default` file, when it enters the route group, then the guard discovers it without editing an inventory and rejects theme-dependent paint; claimed forms have recorded red/green mutation evidence.
5. Given sync and async default-exported projected components, when their props, body, or full-screen shell violates an applicable closure criterion, then the guard reaches the substantive assertion rather than failing to parse the export.
6. Given two distinct document objects and nested claims, when projected shell claims release in any valid order, then each document restores only its own five snapshotted properties exactly once.
7. Given the completed change set, when authoritative artifacts are read, then Story 17.7, AD-24, IA, deferred work, sprint status, and project context describe the same implemented route boundary with no claim that toast wiring shipped.

## Tasks/Subtasks

- [x] Create and maintain this delivery artifact from the approved intent contract and ACs.
- [x] Split non-API pages into URL-transparent `(operator)` and `(projected)` root groups; preserve URLs, auth, and first-paint ownership.
- [x] Add projected `not-found.tsx` and `error.tsx` fallbacks while preserving both existing plan-error behaviours.
- [x] Make `claimProjectedShell` state per-document and keep nested/StrictMode release safe.
- [x] Derive projected pages, layouts, special files, and public URLs from `tests/helpers/projected-routes.mjs`; remove duplicate leaf inventories.
- [x] Repoint path-sensitive tests and documentation without changing behaviour.
- [x] Update IA, AD-24 through headless `bmad-architecture` Update, deferred work, epics, sprint status, and project context.
- [x] Record and pass every required mutation proof, focused suite, typecheck, build, full suite, privacy guard, and whitespace check.

## Dev Agent Record

### Implementation Plan

- Follow strict RED/GREEN cycles for each production behaviour and guard change.
- Prove absence guards against every claimed syntax/form before final verification.
- Use the existing single architecture spine and append-only memlog for the AD-24 update.

### Debug Log

- RED (initial route/shell cycle): `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/projected-shell.test.mjs tests/theme-chrome.test.mjs` produced 8 expected failures: second-document state leaked, projected routes/layout/fallbacks were absent, closure roots were empty, and async default exports did not parse. GREEN after the per-document implementation, route split, fallbacks, structural discovery, and AST export parsing.
- RED (non-TypeScript closure): the new stylesheet-reachability assertion failed because `projected.css` was absent from `projectedTree`. GREEN after resolving explicit and extensionless TS/TSX/JS/JSX/JSON/CSS files and index modules while refusing directories.
- Full-suite RED after route moves exposed one missed path in `tests/presenter-model.test.mjs` and stale planning citations. The test import and authoritative current citations were repointed; `tests/doc-citations.test.mjs` and the full suite then passed.

#### Mutation-proof record

Every mutation below was applied with `apply_patch`, the named command was observed RED with the stated assertion, and the same patch was reverted before a focused GREEN run.

| Claimed surface | Injected defect | RED command and observed failure |
| --- | --- | --- |
| All seven special-file forms | Added `bg-background` to existing `page`, `layout`, `not-found`, `error` files and temporary `loading`, `template`, `default` files | `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types --test-name-pattern "carries no theme token" tests/theme-chrome.test.mjs` — 7 failures, each naming its structurally discovered file and `bg-background`; temporary files deleted on revert |
| Five server shell claims | Mutated both backgrounds to `#FFFFFF`, both overflows to `auto`, and gutter to `stable` in one injection | `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types --test-name-pattern "projected root server-renders" tests/theme-chrome.test.mjs` — 5 failures, one for each exact `htmlStyle` / `bodyStyle` property |
| Direct operator provider | Imported and mounted `ThemeProvider` in projected layout | `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types --test-name-pattern "projected root excludes operator providers" tests/theme-chrome.test.mjs` — failed on the provider import/mount |
| Operator locale/hydration state | Separately imported `getUiLocale`, then added `suppressHydrationWarning` to projected `<html>` | `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types --test-name-pattern "projected root excludes operator shell state getUiLocale" tests/theme-chrome.test.mjs` and `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types --test-name-pattern "projected root excludes operator shell state suppressHydrationWarning" tests/theme-chrome.test.mjs` — each failed on its exact identifier |
| Indirect operator provider | Imported `@/components/ThemeProvider` under alias from projected `not-found.tsx` | `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types --test-name-pattern "no operator theme provider is reachable indirectly" tests/theme-chrome.test.mjs` — failed because the transitive graph reached `ThemeProvider.tsx` |
| Projected stylesheet | Added `background: var(--background)` to `projected.css` | `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types --test-name-pattern "projected tree stays closed" tests/theme-chrome.test.mjs` — failed with `layout.tsx -> ./projected.css ... carries var(--background)` |
| Projected fallback navigation | Separately added `<a href="/admin">` to `not-found.tsx`, then `<Link>` to `error.tsx` | `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types --test-name-pattern "projected not-found and error fallbacks" tests/theme-chrome.test.mjs` — failed first on `href=`, then after that revert on `<Link>` |
| Route ownership | Added duplicate `src/app/services/[id]/slideshow/page.tsx` outside the group | `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types --test-name-pattern "owns both unchanged public URLs" tests/theme-chrome.test.mjs` — failed with both owners in the actual list; duplicate file deleted on revert |
| Sync component body | Replaced the slideshow client's full-screen `text-white` with `text-black` | `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types --test-name-pattern "SlideshowClient.tsx sets its own text colour" tests/theme-chrome.test.mjs` — substantive root-colour assertion failed |
| Async component body | Replaced projector failure `overflow-y-auto` with `overflow-hidden` | `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types --test-name-pattern "room-facing failure branches" tests/theme-chrome.test.mjs` — substantive async-return branch assertion failed |
| Async component props | Added `className?: string` to async `ProjectorPage` props | `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types --test-name-pattern "projected components cannot accept" tests/theme-chrome.test.mjs` — substantive props assertion named the async page |

#### Review mutation-proof addendum

The adversarial review widened several guards. Every mutation below was applied separately, observed RED with the named substantive assertion, and reverted before the 89/89 focused GREEN run.

| Claimed surface | Injected defect forms | RED command and observed failure |
| --- | --- | --- |
| Returned root shell ownership | Replaced the returned `<html>` style with a dead helper's style; separately spread an overriding white background after the literal black value | `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types --test-name-pattern "projected root server-renders html.backgroundColor" tests/theme-chrome.test.mjs` — failed because the returned element lacked the bound style, then because `htmlStyle` contained an overriding spread |
| Effective fallback shell | Bound `<main>` to `contentStyle`; separately changed `position: fixed` to `relative` and `inset: 0` to `1` | `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types --test-name-pattern "projected not-found and error fallbacks" tests/theme-chrome.test.mjs` — failed on the rendered root's missing/wrong `position` and `inset` literals |
| Generic fallback detail | Rendered `error.message` in the projected error fallback | The fallback command above failed with `must render no runtime/server detail`, naming `error.message` |
| Declarative fallback navigation | Separately injected `href`, `action`, `onSubmit`, `formAction`, `onClick`, and a JSX spread containing `href` | The fallback command above failed on each exact attribute or `spread attribute`; every form was reverted individually |
| Imperative fallback navigation | Separately injected `useRouter()`, `redirect('/admin')`, `router.push('/admin')`, `location.assign('/admin')`, and `window.location.replace('/admin')` | The fallback command above failed each run with `must not navigate imperatively`; every form was reverted individually |
| Nested CSS closure | Added `projected.css -> @import './guard-nested.css'` with `var(--background)` in the nested file | `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types --test-name-pattern "projected tree stays closed" tests/theme-chrome.test.mjs` — failed and printed the CSS import edge plus `var(--background)` |
| ESM/CommonJS/multi-format closure | Added one chain covering an extensionless side-effect import, explicit `.tsx`, index-module resolution, TypeScript `import = require`, CommonJS `require`, explicit `.jsx`, and explicit `.json`; the JSON leaf carried `bg-background` | The closure command above failed and printed the complete reachable JSON leaf; the layout import and all fixture files were deleted on revert |
| Shared i18n closure | Added projected layout -> explicit `.js` -> explicit `@/lib/i18n/index.ts` | `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types --test-name-pattern "projected tree does not reach catalogue" tests/i18n.test.mjs` — failed with the full catalogue reachability chain |
| Default-export forms | Added temporary special files using a direct arrow default, a const-arrow identifier default, and a declared-function identifier default, each accepting `className` | `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types --test-name-pattern "projected components cannot accept" tests/theme-chrome.test.mjs` — each reached the substantive `must not accept a className` assertion and named the temporary file |
| Structural client-boundary discovery | Reordered the slideshow root utilities from `fixed inset-0` to `inset-0 fixed` | `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types --test-name-pattern "SlideshowClient.tsx neutralises" tests/theme-chrome.test.mjs` — the client remained in the derived boundary set and failed the full-screen assertion instead of disappearing from coverage |

### Completion Notes

- Installed Next 16.2.10 route-group, root-layout, `not-found`, and `error` guides were read before moving routes. The production build proves the sibling roots compile and lists both public projected URLs unchanged; proxy tests prove the auth boundary is unchanged.
- The projected root owns literal server-first-paint claims and generic segment fallbacks. Operator metadata/fonts/locale/theme moved unchanged to the sibling operator root. No toast/`Toaster` wiring shipped.
- `claimProjectedShell` is now independent per `document`, reference-counted per document, restores every active document on test reset, and treats releases from an earlier generation as stale.
- Structural discovery replaces the leaf inventories and follows ESM, CommonJS, dynamic, side-effect, and CSS import edges across TS/TSX/JS/JSX/JSON/CSS modules. The Reviewer Gate and adversarial-review closure findings were mutation-proven before closure.
- `bmad-architecture` Update used the existing spine and append-only memlog; AD-24 stayed stable. Lint plus rubric, current-reality, and two-compliant-units reviewers ran; all clear findings were applied and lint finished with 0 findings.
- Final evidence: review-focused assertions passed 89/89; changed-surface ESLint and `npx tsc --noEmit` passed; `npm run build` passed and listed both public projected URLs unchanged; `npm test` passed 522 tests / 521 pass / 1 skip / 0 fail; architecture lint reported 0 findings; public-repo and citation guards passed in the full suite; `git diff --check` passed. Repo-wide ESLint still reports 15 pre-existing errors in unchanged moved operator files and unrelated shared modules; Story 17.7 did not broaden into that debt. Build retains the pre-existing NFT trace warning through `pptx-cache.ts`; it is unrelated and non-blocking.

## File List

- `src/app/(operator)/**` — all operator pages/components moved under the operator root; layout retains metadata, fonts, locale, globals, and `ThemeProvider`.
- `src/app/(projected)/layout.tsx`, `projected.css`, `not-found.tsx`, `error.tsx` — projected root shell and framework fallbacks.
- `src/app/(projected)/services/[id]/slideshow/**`, `src/app/(projected)/services/[id]/present/projector/**` — moved projected routes; public URLs unchanged.
- `src/lib/projected-shell.ts` — per-document hydrated shell defence.
- `tests/helpers/projected-routes.mjs`, `tests/projected-shell.test.mjs`, `tests/theme-chrome.test.mjs` — structural discovery, per-document coverage, shell/closure/AST guards.
- `tests/i18n.test.mjs`, `tests/projector-liveness.test.mjs`, `tests/canvas-dirty-guard.test.mjs`, `tests/presenter-model.test.mjs`, `package.json` — structural roots, moved paths, and suite registration.
- `_bmad-output/project-context.md`, `deferred-work.md`, `sprint-status.yaml`, `epics.md`, the Story 17.7 spec/story, PRD locale clause, architecture spine/memlog/reviews, `DESIGN.md`, `EXPERIENCE.md` — same-change-set authority synchronization.
- `docs/component-inventory-monolith.md`, `docs/index.md`, `docs/source-tree-analysis.md` — moved-path/source-tree synchronization.

## Change Log

- 2026-08-09: Story created from the Ready-for-Development Story 17.7 spec; status set to `in-progress`.
- 2026-08-09: Implemented sibling operator/projected roots, fallbacks, per-document shell state, structural guards, mutation proofs, architecture Update Reviewer Gate, and full verification; status set to `review`.
- 2026-08-09: Coordinator verification fixed the stale Epic 17 summary status and independently re-ran focused checks (153/153), typecheck, and public/citation guards (7/7) before code review.
- 2026-08-09: Adversarial and edge-case review findings were deduplicated into ten patch groups; guards and current authorities were repaired, 24 review-stage mutation runs were observed RED and reverted, and the widened focused suite passed 89/89.
- 2026-08-09: Final coordinator verification passed typecheck, changed-surface lint, Next production build, all 522 registered tests, architecture lint, and whitespace checks; status set to `done`. Repo-wide lint's unchanged baseline debt is recorded rather than silently folded into this story.
