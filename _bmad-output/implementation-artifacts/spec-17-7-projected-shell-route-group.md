---
title: 'Story 17.7: Projected shell route group'
type: 'feature'
created: '2026-08-09'
status: 'in-review'
baseline_revision: 'a74190329d93c36b60e2cd70f640bda426d294e4'
review_loop_iteration: 1
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/project-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-17-context.md'
warnings:
  - oversized
---

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

## Code Map

- `src/app/layout.tsx` -- current themed root to replace with scoped roots.
- `src/app/(operator)/layout.tsx` -- new owner of fonts, metadata, locale, global CSS, and `ThemeProvider` for operator routes only.
- `src/app/(projected)/layout.tsx` -- new first-paint owner of literal projected `<html>`/`<body>` shell.
- `src/app/(projected)/services/[id]/{slideshow,present/projector}/**` -- moved room-facing routes; URLs stay unchanged.
- `src/app/(projected)/{not-found,error}.tsx` -- framework-owned room-facing fallbacks.
- `src/lib/projected-shell.ts` -- hydrated defence; make reference counting correct per document and correct its Server-Component claim.
- `tests/helpers/projected-routes.mjs` -- single structural discovery source for projected route roots and normalized URLs.
- `tests/theme-chrome.test.mjs` -- upward/downward closure, first-paint shell, async default-export, and fallback guards.
- `tests/i18n.test.mjs` -- reuse structural projected roots rather than a duplicate list.
- `tests/{projector-liveness,canvas-dirty-guard,projected-shell}.test.mjs` -- moved-path and per-document regression coverage.
- `_bmad-output/{planning-artifacts,implementation-artifacts}/**` -- story, IA, AD-24, debt, sprint, and project-context synchronization.

## Tasks & Acceptance

**Execution:**
- [x] `_bmad-output/implementation-artifacts/stories/17-7-projected-shell-route-group.md` -- create the delivery artifact from this intent contract and ACs before production code; keep it aligned through completion.
- [x] `src/app/(operator)/**`, `src/app/(projected)/**`, `src/app/layout.tsx` -- move all non-API pages into URL-transparent root groups, retain APIs/static assets at top level, scope `ThemeProvider` to operator routes, and give the projected root literal inline `html`/`body` background, overflow, and gutter values at server render.
- [x] `src/app/(projected)/{not-found,error}.tsx` and room-facing pages -- add generic projected fallbacks while preserving both existing plan-error behaviors and all public URLs.
- [x] `src/lib/projected-shell.ts`, `tests/projected-shell.test.mjs` -- replace process-global claim state with per-document state, retain nested/StrictMode safety, and document the hook as hydrated defence rather than Server-Component reach.
- [x] `tests/helpers/projected-routes.mjs`, `tests/theme-chrome.test.mjs`, `tests/i18n.test.mjs` -- derive pages, layouts, and framework special files from `(projected)`, normalize route-group-free URLs, walk imports downward, parse sync/async default exports through TypeScript AST, and eliminate the five duplicated leaf inventories.
- [x] `tests/projector-liveness.test.mjs`, `tests/canvas-dirty-guard.test.mjs`, and any path-sensitive tests/docs found by `rg` -- repoint moved source paths without broadening behavior.
- [x] `EXPERIENCE.md`, `ARCHITECTURE-SPINE.md`, `deferred-work.md`, `epics.md`, `sprint-status.yaml`, `_bmad-output/project-context.md` -- record the route ownership, close AD-24 through `bmad-architecture` Update, resolve only Story-17.7 debt, and synchronize status/citations.
- [x] Story/spec verification record -- run and record mutation proofs for route ownership, every discovered special-file form, each literal shell property, provider/theme-token rejection, and substantive sync/async export failures; revert every injected defect before final verification.

**Acceptance Criteria:**
- Given either projected URL and any persisted operator theme, when the document is hard-loaded before hydration, then `<html>` and `<body>` paint literal black, hide overflow, use `scrollbar-gutter: auto`, and render no operator provider or theme-derived shell state.
- Given the six current `notFound()` branches or an uncaught descendant error, when a projected route fails, then its framework fallback is full-viewport, black/white, scroll-safe, generic, and contains no operator chrome or projector recovery link.
- Given navigation between operator and projected routes, when the route crosses root groups, then public URLs and auth behavior remain unchanged and the destination document owns its shell without leaked prior inline state.
- Given a new projected `page`, `layout`, `not-found`, `error`, `loading`, `template`, or `default` file, when it enters the route group, then the guard discovers it without editing an inventory and rejects theme-dependent paint; claimed forms have recorded red/green mutation evidence.
- Given sync and async default-exported projected components, when their props, body, or full-screen shell violates an applicable closure criterion, then the guard reaches the substantive assertion rather than failing to parse the export.
- Given two distinct document objects and nested claims, when projected shell claims release in any valid order, then each document restores only its own five snapshotted properties exactly once.
- Given the completed change set, when authoritative artifacts are read, then Story 17.7, AD-24, IA, deferred work, sprint status, and project context describe the same implemented route boundary with no claim that toast wiring shipped.

## Spec Change Log

- 2026-08-09: Implementation completed; status moved to `review`. Intent contract preserved verbatim.
- 2026-08-09: Architecture Reviewer Gate widened the structural closure to TS/TSX/JS/JSX/JSON/CSS imports and indirect operator-provider reachability; both fixes were mutation-proven before AD-24 closure was retained.
- 2026-08-09: Coordinator acceptance verification repaired the Epic 17 summary, which still listed Story 17.7 as backlog after its story heading and sprint row had moved to review; focused checks then passed 153/153, typecheck passed, and public/citation guards passed 7/7.
- 2026-08-09: Adversarial and edge-case review produced ten deduplicated patch groups. Effective rendered-shell binding, generic fallback isolation, multi-syntax module closure, default-export resolution, client-boundary derivation, and current documentation were repaired and mutation-proven; follow-up review is recommended because structural guard coverage materially widened.

## Review Triage Log

- Rubric walker: 1 high / 2 medium; all clear fixes applied (stale partial projections, AD-15 category boundary, future-special wording).
- Current-reality reviewer: 3 high / 2 medium; all clear fixes applied (CSS/JS graph, indirect provider reachability, stale partials/global-error overclaim, stack reality).
- Two-compliant-units reviewer: 2 high / 3 medium; all clear fixes applied (exact seven forms and five shell values, room-facing placement criterion, graph dependency, scroll-safe fallback wording).
- Final spine lint: 0 findings. No AD renumbered; no user decision or Block If condition triggered.

### 2026-08-09 — Adversarial code-review pass

- `intent_gap`: 0
- `bad_spec`: 0
- `patch`: 10 (6 high, 4 medium)
- `defer`: 0
- `reject`: 0
- Addressed findings:
  - `[high] [patch]` Bound projected `<html>`/`<body>` literal checks to the default export's returned elements and rejected style spreads/overrides.
  - `[high] [patch]` Bound generic fallback paint to the rendered `<main>` and asserted effective fixed/inset/scroll/black/white literals.
  - `[high] [patch]` Rejected rendered runtime detail plus declarative, spread, and imperative navigation from generic projected fallbacks.
  - `[high] [patch]` Unified route closure over ESM, CommonJS, dynamic, side-effect, CSS `@import`, explicit extensions, and index modules across TS/TSX/JS/JSX/JSON/CSS.
  - `[high] [patch]` Derived full-screen projected clients from the page-to-first-client boundary instead of the `fixed inset-0` source substring.
  - `[high] [patch]` Completed mutation evidence for every newly claimed closure, fallback, style-binding, export, and structural-boundary form.
  - `[medium] [patch]` Resolved direct arrow and identifier-based default exports so substantive props/body guards cover those forms.
  - `[medium] [patch]` Reused the shared projected module graph for the i18n isolation guard.
  - `[medium] [patch]` Reconciled the projected locale and literal-colour rules in `EXPERIENCE.md` and project context.
  - `[medium] [patch]` Repaired stale grouped-route paths and repository identity in source-tree documentation, plus the stale Epic 17 summary status.
- Follow-up review is recommended because the review changed high-consequence structural guards over multiple syntax families; all panel findings nevertheless have a verified disposition in this pass.

## Design Notes

Two root layouts are intentional. A nested projected layout would still inherit the root `ThemeProvider` and cannot author `<html>/<body>`; route-imported global CSS may also remain after client navigation. Splitting `(operator)` and `(projected)` lets the server emit the correct shell on the first frame and lets cross-root navigation discard it structurally. `PresenterOperator` remains operator-scoped and does not gain a projected-shell colour parameter; Story 17.9 may reuse the operator segment but is not wired here.

## Verification

**Commands:**
- `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/theme-chrome.test.mjs tests/i18n.test.mjs tests/projector-liveness.test.mjs tests/canvas-dirty-guard.test.mjs tests/projected-shell.test.mjs tests/proxy-matcher.test.mjs` -- expected: focused route/shell suites pass.
- `npx tsc --noEmit` -- expected: strict typecheck passes.
- `npm run build` -- expected: Next accepts both roots and reports the two unchanged room-facing URLs without conflicts.
- `npm test` -- expected: full registered suite passes after the build.
- `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/public-repo-guard.test.mjs` -- expected: public repository guard passes.
- `git diff --check` -- expected: no whitespace errors.

**Manual checks (if no CLI):**
- Hard-load both room-facing URLs with JavaScript disabled or throttled under light/dark/system operator themes; the first visible frame is black with no gutter. Exit slideshow and confirm the operator theme returns.

## Implementation Result

- Result: ready for code review; all tasks and acceptance criteria implemented.
- RED/GREEN and mutation/revert evidence: `_bmad-output/implementation-artifacts/stories/17-7-projected-shell-route-group.md` → Dev Agent Record. Forty-seven mutation runs were observed failing and reverted: 23 implementation-stage forms plus 24 review-stage forms, including a repeated `href` proof after the fallback guard was rewritten.
- Final commands: review-focused assertions 89/89; changed-surface ESLint pass; `npx tsc --noEmit` pass; Next 16.2.10 production build pass with both public projected URLs unchanged; `npm test` 522 total / 521 pass / 1 skip / 0 fail; public-repo and citation guards passed in the full suite; architecture lint 0 findings; `git diff --check` pass.
- Non-blocking known output: the existing Turbopack NFT trace warning through `src/lib/pptx-cache.ts` remains; no new failure or Block If condition occurred.

## Auto Run Result

- Summary: isolated operator and room-facing UI in sibling root route groups, gave projected routes a literal-black server shell and generic fallbacks, made hydrated shell state per-document, and replaced leaf inventories with structural multi-format closure guards.
- Files changed: `src/app/(operator)/**` owns operator pages and theme state; `src/app/(projected)/**` owns both unchanged room URLs and their shell/fallbacks; `src/lib/projected-shell.ts` owns per-document claims; `tests/helpers/projected-routes.mjs` plus route/theme/i18n/liveness tests own structural verification; BMad, architecture, UX, project-context, and source-tree artifacts describe the same boundary.
- Review: 10 patch groups applied (6 high, 4 medium); 0 intent gaps, 0 bad-spec findings, 0 deferred items, and 0 rejected findings. Follow-up review recommendation: `true` because high-consequence guard coverage widened across several syntax families.
- Verification: mutation evidence is recorded in the Story; 89/89 focused assertions, changed-surface ESLint, typecheck, Next build, 522 registered tests, public/citation guards, architecture lint, and whitespace checks passed.
- Residual risks: crossing sibling root layouts intentionally performs a full document navigation; the build retains the existing NFT trace warning through `pptx-cache.ts`; repo-wide ESLint reports 15 pre-existing errors in unchanged moved operator files and unrelated shared modules, while all Story-17.7 changed surfaces pass ESLint.
