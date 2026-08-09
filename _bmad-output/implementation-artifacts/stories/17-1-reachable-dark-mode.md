---
baseline_commit: acc8df04c4139fdd0f37a80b23030c15dbb124df
---

# Story 17.1: Reachable Dark Mode

Status: done

## Story

As an operator running a service in a dim sanctuary,
I want to choose a dark theme for the hub and have it remembered,
so that a full-brightness white screen in my hands does not light up the room, and the `.dark` palette the app already ships stops being reachable only where it was hardcoded.

## Correction to the finding this story came from

The readiness assessment recorded *"Dark mode is unreachable … the entire dark palette is dead code"*, and `DESIGN.md` repeated it. **Verified against the code on 2026-07-29: that is wrong.** Two surfaces already pin the class themselves, and they are the two used while a service is running:

- `src/app/services/[id]/present/PresenterOperator.tsx:449` — `className="dark flex min-h-dvh …"`
- `src/app/services/[id]/present/SlideGridDialog.tsx:176` — `className="dark flex max-h-[85dvh] …"`

`@custom-variant dark (&:is(.dark *))` (`src/app/globals.css:5`) matches any descendant of a `.dark` element, so both subtrees render the dark palette today with no provider involved. What is actually missing is a **choosable** theme for the rest of the hub.

This matters for scope: the job is not to introduce dark mode, it is to make it selectable **without disturbing two surfaces that deliberately opt out of the choice.**

**Update 2026-07-30 — `DESIGN.md` now carries this correction.** The `bmad-ux` Update run applied it at source: the frontmatter comment, the `Colors` note on `--sidebar-primary`, and Open Item 2 all state that the palette renders today and that what is missing is *operator choice*. AC-7 below is adjusted accordingly — correcting that claim is no longer your job. `EXPERIENCE.md` → *Accessibility Floor* additionally records that **the dark palette's contrast has never been measured on any pair**, which is what AC-6 exists to fix.

## Acceptance Criteria

1. **Given** an operator on any hub surface, **When** they use the theme control, **Then** the chrome switches between light and dark and the choice survives a reload and a new tab. `next-themes` is already a dependency; no new theming library.

2. **Given** a first visit with no stored preference, **When** the page loads, **Then** the theme follows the operating system, **And** no wrong-theme flash appears before hydration. `<html>` carries `suppressHydrationWarning` (`src/app/layout.tsx:32`), because next-themes writes the class before React hydrates and the attribute mismatch is expected.

3. **Given** the presenter operator view or the slide-grid dialog, **When** the operator's chosen theme is light, **Then** both still render dark — their local `.dark` wrapper wins for its own subtree. Neither file's wrapper is removed by this story.

4. **Given** any chosen theme, **When** a Service is presented, downloaded or projected, **Then** the **projected render tree** is byte-identical. This is the load-bearing constraint: the congregation never sees operator chrome. It holds today and must keep holding —
   - `ProjectorClient.tsx:110,130,131` uses literal `bg-black`, `bg-[#0B1220]`, `text-white`, `text-[#D4A574]`, never theme tokens;
   - `src/components/SlideView.tsx` contains no theme-token class at all, and accepts no `className`;
   - `ArtifactSlide.tsx` colours every element from inline `style` resolved out of the Artifact Registry.
   A regression here is a defect against FR-20 and the Deck Blueprint, not a styling preference.

   **Scoped on two axes, 2026-07-31, at the owner's direction after code-review round 2.** The AC as first written was broader than what this story delivers, and the gap was being covered by a dismissal in a review rather than by the contract. Both narrowings are deliberate and neither weakens the intent — the congregation never sees operator chrome:

   - **WHAT: the projected *tree*, not the *shell behind it*.** The guarantee is that the projected render tree paints in literal colours or registry-resolved inline styles, enforced by `PROJECTED` in `tests/theme-chrome.test.mjs`, plus the shared shell reset on the two full-screen *Clients* (`FULL_SCREEN`). The **shell** — the root layout, the server's first paint before any hook runs, the two Server-Component error branches, and a `notFound()` at a room-facing URL — is **Story 17.7's** contract. Four holes, one root: the shell belongs to the app, not to the route. `AD-24` is `[ADOPTED, partial]` until 17.7 closes it, and now names 17.7 as the key that will.
   - **WHERE: the projected output, not the operator's preview of it.** The word *previewed* is removed. `SlidePreviewList` — the Live Slide Preview in both forms — is hub chrome and follows the operator's theme **deliberately**, which is correct and desirable. It renders no `SlideView` and no `ArtifactSlide` (verified across all nine call sites of both), so there is no projected pixel there to leak. Round 1 settled this in a *Dismissed as noise* line; the reasoning was right and the AC's own sentence still said otherwise, so the sentence is amended rather than left for the next reader to reconcile against a dismissal.

   *(Amending an AC is outside `bmad-dev-story`'s normal edit surface — frontmatter, checkboxes, Dev Agent Record, File List, Change Log, Status. It is done here because the owner directed it explicitly in the two decision items below, and because leaving `:220`/`:266` contradicting `:89` was itself a recorded finding. Flagged rather than done quietly.)*

5. **Given** dark mode active, **When** toast notifications appear, **Then** they follow the theme. `src/components/ui/sonner.tsx:3` already calls `useTheme()`; today it resolves to nothing. Mounting the provider is what makes that call meaningful — no change to `sonner.tsx` should be needed, and needing one is a signal the provider is mounted in the wrong place.

6. **Given** the dark palette in use as chrome, **When** its load-bearing pairs are measured with a real contrast checker, **Then** each result is recorded in `DESIGN.md` as a measurement, not an estimate. The light palette's `muted-foreground` was measured at **4.35:1 on `muted` and fails WCAG AA**; the dark side has never been measured at all. If a dark pair also fails, record it as a known defect rather than silently shipping it — the fix belongs to Story 17.2, which owns that token.

7. **Given** this story ships, **When** the change set is reviewed, **Then** `DESIGN.md` is updated in the same change set — the theme control documented under *Components*, and the AC-6 measurements recorded in the contrast table. `AGENTS.md` requires it: a UI component with a visual delta updates `DESIGN.md`. **Do not** re-correct the "dead code" claim; `bmad-ux` did that on 2026-07-30. **Also** update `DESIGN.md` Open Item 2 to closed and `EXPERIENCE.md` → *Accessibility Floor*, whose second bullet says the dark palette has never been measured — AC-6 is what makes that statement obsolete.

## Tasks / Subtasks

- [x] Mount the provider (AC: #1, #2, #5)
  - [x] Wrap `children` in `src/app/layout.tsx` with next-themes' provider, `attribute="class"`, `defaultTheme="system"`, `enableSystem`
  - [x] Add `suppressHydrationWarning` to the `<html>` element (`layout.tsx:32`)
  - [x] Confirm no `'use client'` leaks into the layout beyond the provider boundary — keep the provider in its own client component
- [x] Theme control in the shared header (AC: #1)
  - [x] Add the control to `src/components/Header.tsx` (Epic 13.2's shared shell), beside the existing profile/logout affordances
  - [x] Keyboard reachable and labelled; use an existing shadcn/Base UI control, no new dependency
  - [x] Render nothing theme-dependent until mounted, so the button does not flip after hydration
- [x] Prove the projected output is untouched (AC: #3, #4)
  - [x] Verify `/services/[id]/present`, its projector window, `/services/[id]/slideshow` and the PPTX download are identical in both themes
  - [x] Confirm `PresenterOperator` and `SlideGridDialog` still render dark while the hub is light
  - [x] Consider a test asserting no theme-token class reaches `SlideView` / `ArtifactSlide` — cheaper than re-checking by eye later
- [x] Measure the dark palette (AC: #6)
  - [x] `foreground`/`background`, `primary-foreground`/`primary`, `muted-foreground`/`background`, `muted-foreground`/`muted`
  - [x] Use a real checker or canvas-resolved sRGB, as the light-side measurement did — not Oklab lightness estimates
- [x] Update `DESIGN.md` in the same change set (AC: #7)
- [x] `npm test` and the public-repo guard green before commit

### Review Findings

- **3 decision-needed (all resolved by the owner the same day → patch), 12 patch, 1 deferred, 3 dismissed as noise.**
- **Patch — resolved from `decision-needed` by the owner, 2026-07-31**
- Left in place rather than deleted, because the finding's own wording is the clearest statement of the mechanism:* — the AC-4 fix extracted the shell reset to `src/lib/use-projected-shell.ts` and called it from both **Clients**, but the two room-facing **route shells** — `projector/page.tsx:71` and `slideshow/page.tsx:76`, the `fixed inset-0` branches a `buildSlidePlan` throw renders — are […]
- Both paint `bg-black` on their own element and carry no theme token, so the token half of AC-4 holds; neither resets `html`/`body`, so the reserved `scrollbar-gutter: stable` still shows the themed `body` as a strip down the edge of the projected screen — the same defect, one layer out, on the surface a registry failure faces the congregation with.
- `FULL_SCREEN` (`tests/theme-chrome.test.mjs:284`) lists only the two Clients, so nothing catches it, and the repaint of these shells to literal colours (patch item above) fixed the element and not the shell behind it.
- Three candidate fixes are recorded in the spine's *Deferred*; the route-segment layout is the only one that also catches a future shell nobody annotates.
- **Deferred — pre-existing, not caused by this change set**
- **Dismissed as noise (3):** a `localStorage.theme` value outside `ORDER` (e.g. hand-edited to `blue`) is reported as `system` and its stale class is never removed — upstream next-themes behaviour, requires editing the origin's storage by hand, negligible consequence; `EXPERIENCE.md`'s new row carrying Tailwind-preflight detail its own header excludes — editorial, and the nuance earns its place; […]

> **Remediation status, 2026-07-31 (`bmad-dev-story`): 11 of 12 patch items closed; AC-4 is now
> met and browser-verified.** The one still open is **AD-24**, which `AGENTS.md` routes through a
> `bmad-architecture` Update run — not something this workflow may substitute for. Each item below
> carries its own resolution, including the two cases where re-verification contradicted the
> finding's own numbers.
>
> **Update, 2026-07-31 (`bmad-architecture` Update run): all 12 closed — AD-24 is in the spine.**
> That run's Reviewer Gate also opened **one new action item against this change set**, and it is
> filed with the AD-24 entry below: AC-4's shell fix reaches the two full-screen *Clients* and not
> the two room-facing *route shells*, which are Server Components and cannot call the hook. AC-4's
> token guarantee holds; its shell guarantee does not, on the branch a registry failure renders.
> **AD-24 is `[ADOPTED, partial]` for exactly that reason.** The item has no owner yet.
- [x] [Review][Patch] **19 previously-dead `dark:` overrides across 9 files go live, unreviewed and unmeasured** (medium) — No `.dark` ancestor existed outside […]
- [x] [Review][Patch] **AC-5 has no trigger, and the gap is filed only in a YAML comment** (medium) — `Toaster` is exported at `src/components/ui/sonner.tsx:49` and mounted nowhere; `toast(` is […]
- [x] [Review][Patch] **First client-side persistence in the codebase, with no spine amendment** (medium) — `grep -rn "localStorage\|sessionStorage" src/` returned **zero** hits before this […]
- [x] [Review][Patch] **AC-4 falsified: the slideshow canvas paints the operator's theme** (high) [src/app/services/[id]/slideshow/SlideshowClient.tsx:52] — `globals.css:124-130` sets `body { […]
- [x] [Review][Patch] **Badge tone shades authored for white go dark-switchable, and the repo already documents that they are unreadable there** (high) [src/components/SlidePreviewList.tsx:26] — […]
- [x] [Review][Patch] **The slideshow's failure branch renders theme tokens at a projected URL; the projector's equivalent uses literals** (medium) [src/app/services/[id]/slideshow/page.tsx:78] — […]
- [x] [Review][Patch] **The edge guard misses the idiomatic width utilities it was written to catch** (medium) [tests/theme-chrome.test.mjs:127] — Executed against the real regex: **MISSED** […]
- [x] [Review][Patch] **The "closed tree" claim is not closed: `className` and non-`@/components` imports** (medium) [tests/theme-chrome.test.mjs:158] — `SlideView.tsx:11-18` accepts `className` […]
- [x] [Review][Patch] **In dark mode the toggle stops matching the siblings `DESIGN.md` says it matches** (medium) [src/components/ThemeToggle.tsx:52] — `shell` sets `border-border bg-card/50`; […]
- [x] [Review][Patch] **The pre-mount placeholder contradicts its own comment on both halves** (medium) [src/components/ThemeToggle.tsx:54] — The comment reads *"the button is present, sized and […]
- [x] [Review][Patch] **Four of the seventeen new tests are satisfied by a substring** (medium) [tests/theme-chrome.test.mjs:225] — `:225-233` (AC-5) asserts only that `useTheme()` appears in […]
- [x] [Review][Patch] **AC-7 doc residue: four statements the change set left inconsistent with itself** (medium) […]
- [x] [Review][Defer] **`DESIGN.md` cites a `slide-surface` class that exists nowhere in the codebase** [_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md:164] […]

### Review Findings — round 2 (`bmad-code-review`, 2026-07-31)

- **3 decision-needed — all resolved by the owner the same day, into 2 patch and 1 specification for the spun-out Story 17.7 — plus 22 patch raised directly (24 patch in total), 3 deferred, 2 dismissed as noise.** No layer failed or returned empty.
- **The baseline question round 1 could not settle is now settled.** The story's own `baseline_commit: acc8df0` was checked against `HEAD`: **16 commits separate them and not one touches `src/`, `tests/` or `package.json`** — all are `docs:`.
- **Verification state at review time:** `npx tsc --noEmit` clean; `tests/theme-chrome.test.mjs` 28/28; full suite 365/364 pass/1 skipped; `npm run lint` reports exactly **one** problem in any changed file (`LogoutButton.tsx:5`, and it is pre-existing).
- Every numeric claim in the round-1 resolutions that was spot-checked reproduced, including the 29/18/8 `dark:` recount, the ported `PRESENTER_TONE_CLASS` shades, and `ArtifactSlide.tsx:128`'s literal `#FFFFFF` fallback.
- **Deferred — pre-existing, not caused by this change set**

- [x] [Review][Decision] **The AC-4 shell guarantee has four holes, not one, and they share a root: the shell belongs to the app, not to the route** (high) — Round 1 closed the shell leak for the […]
- [x] [Review][Decision] **Does 17.1 close with a known-open AC-4 hole, and under whose key?** (high) — The story asserts at :220 *"All seven AC are satisfied"* and at :266 *"AC-4 is now met"*, […]
- [x] [Review][Decision] **AC-4's contract sentence is now false for the preview, and it was narrowed by a dismissal rather than an amendment** (medium) — AC-4 reads *"presented, **previewed**, […]
- [x] [Review][Patch] **The AC-6 sweep stops four sites short of its own criterion** (high) [src/app/announcements/AnnouncementsManager.tsx:337] — Round 1's resolution states the rule it applied: […]
- [x] [Review][Patch] **`LogoutButton`'s hand-rolled red pair *is* `--destructive`, in both themes** (medium) [src/components/LogoutButton.tsx:8] — Verified against […]
- [x] [Review][Patch] **`ArtifactSlide` still accepts the `className` `SlideView` just stopped forwarding** (medium) [src/components/artifacts/ArtifactSlide.tsx:220] — Round 1 removed the […]
- [x] [Review][Patch] **Focus rings on projected surfaces paint from `--ring`, and the guard's own evidence was gathered unfocused** (medium) […]
- [x] [Review][Patch] **The rewritten failure screen cannot scroll, and its parity comment is false in both directions** (medium) [src/app/services/[id]/slideshow/page.tsx:76] — The branch is […]
- [x] [Review][Patch] **`DESIGN.md` Open Item 6 states the opposite of the finding it was filed to own** (medium) […]
- [x] [Review][Patch] **`DESIGN.md` Open Item 4's counted inventory counts doc-comment prose as utilities — including prose this change set added** (medium) […]
- [x] [Review][Patch] **`DESIGN.md`'s Components row still describes the preview list as something it is not** (medium) […]
- [x] [Review][Patch] **The test labelled AC-6 pins nothing AC-6 asks for, and AC-1's persistence clause has no net at all** (medium) [tests/theme-chrome.test.mjs:534] — AC-6 requires the dark […]
- [x] [Review][Patch] **Nothing in the change set tests behaviour, and the untested path is the one that would strand the app shell** (medium) [tests/theme-chrome.test.mjs] — All 28 assertions […]
- [x] [Review][Patch] **The token guard misses Tailwind 4's colour-variable shorthand and arbitrary widths** (medium) [tests/theme-chrome.test.mjs:104] — Run through the shipped […]
- [x] [Review][Patch] **The AC-3 guard reads the first `className` in source order, not the outermost element** (medium) [tests/theme-chrome.test.mjs:344] — It takes `classNameValues(body)[0]` […]
- [x] [Review][Patch] **`PROJECTED` is closed downward but never upward, and `@/lib` is exempt wholesale** (medium) [tests/theme-chrome.test.mjs:233] — The closure test walks imports *out of* […]
- [x] [Review][Patch] **The pre-mount placeholder highlights under the cursor while swallowing every click** (medium) [src/components/ThemeToggle.tsx:82] — `focusableWhenDisabled` makes Base UI […]
- [x] [Review][Patch] **Story-record repairs: five statements the change set left inconsistent with itself** (medium) […]
- [x] [Review][Patch] **Guard robustness: three ways the scanner can be broken or fooled without anyone noticing** (low) [tests/theme-chrome.test.mjs:48] — (a) `stripComments` removes every `/* … […]
- [x] [Review][Patch] **`ThemeToggle` chrome consistency: three deltas from the row it was built to match** (low) [src/components/ThemeToggle.tsx:74] — (a) It is the only control in the header […]
- [x] [Review][Patch] **`ThemeProvider` omits `disableTransitionOnChange`** (low) [src/components/ThemeProvider.tsx:22] — `Header.getLinkClass` puts `transition-all` on every nav pill, and the […]
- [x] [Review][Patch] **`useProjectedShell` is not reference-counted, and this change set doubled its callers** (low) [src/lib/use-projected-shell.ts:32] — It snapshots the live inline styles on […]
- [x] [Review][Patch] **`ProjectorClient` sets no text colour while `SlideshowClient` does** (low) [src/app/services/[id]/present/projector/ProjectorClient.tsx:102] — `body { @apply […]
- [x] [Review][Patch] **`themeTokens()` re-reads and re-parses `globals.css` on every call** (low) [tests/theme-chrome.test.mjs:74] — `themeReferences()` invokes it each time, so a single run […]
- [x] [Review][Patch] **`LogoutButton.tsx:5` imports `Button` and never uses it** (low) [src/components/LogoutButton.tsx:5] — The element is a native `<button>`.
- [x] [Review][Defer] **The contrast audit ran in one direction only, and the light half of the two forms it names is worse than anything it fixed** [src/app/services/new/CreateForm.tsx:444] — […]
- [x] [Review][Defer] **`PresenterOperator` pins `dark` on its own wrapper but never on the shell behind it** [src/app/services/[id]/present/PresenterOperator.tsx] — deferred, pre-existing.
- [x] [Review][Defer] **`LogoutButton` hand-rolls what `ui/button.tsx`'s `destructive` variant already provides** [src/components/LogoutButton.tsx:16] — deferred, pre-existing.

### Review Findings — round 3 (`bmad-code-review`, 2026-07-31)

- **This round reviews the remediation, not the story** — the diff is commit `517f6c1` alone (`488eb19..517f6c1`, 20 files, +1334/−366), merged as `5fae8d8`.
- Rounds 1 and 2 already read `3f210c7`.
- **1 decision-needed, 19 patch, 1 deferred, 6 dismissed as noise.** No layer failed or returned empty.
- **Verification state at review time, re-run rather than accepted:** `npx tsc --noEmit` clean; `tests/theme-chrome.test.mjs` **43/43**; `tests/public-repo-guard.test.mjs` **4/4**; full suite **382 tests / 381 pass / 0 fail / 1 skipped**.
- The story records 380/379 — the difference is the two lockfile tests `b087624` contributed through the merge, so the branch figure was correct when it was taken.
- None is a live leak today; every one was reproduced by injecting a defect and observing 43/43 stay green.
- **Deferred — pre-existing, not caused by this change set**
- **Dismissed as noise (6):** `npm run lint` reporting 14,559 problems rather than 31 — measured in an agent worktree that is untracked and locally excluded, no tracked JS/TS exists under `.claude`, and a clean checkout yields exactly 31 (recorded at the top of this section rather than here, because the layer's evidence was real and only its attribution was wrong); a `localStorage.theme` value […]

- [x] [Review][Decision] **`ARCHITECTURE-SPINE.md` was edited inline by the remediation pass, self-certified as "a citation repair, not an amendment"** (medium) […]
- [x] [Review][Patch] **The transitive closure walk stops at the first `.ts` hop, so the directory exemption it removed came back as an extension exemption over the same directory** (medium) […]
- [x] [Review][Patch] **The `text-white` root guard reads the first return branch — the exact defect `jsxReturnBranches` was written to remove, reintroduced 130 lines above it** (medium) […]
- [x] [Review][Patch] **`jsxReturnBranches` matches only parenthesised returns, so a mixed-style component silently loses a branch** (medium) [tests/theme-chrome.test.mjs:667] — […]
- [x] [Review][Patch] **The focus-ring guard accepts `focus-visible:outline-none`, which deletes the ring it exists to protect** (medium) [tests/theme-chrome.test.mjs:370] — The assertion is […]
- [x] [Review][Patch] **"Every projected focusable" is two hardcoded files and `<Link>` only, and `EXPERIENCE.md` states the broad claim as fact** (medium) [tests/theme-chrome.test.mjs:359] — […]
- [x] [Review][Patch] **The badge guard is a hardcoded 4-file × 3-hue table, and one match satisfies a whole file** (medium) [tests/theme-chrome.test.mjs:1023] — `allTsxFiles()` is defined at […]
- [x] [Review][Patch] **`stripComments` has no regex-literal state, and `\//` deletes the rest of a line from the scanned text** (medium) [tests/theme-chrome.test.mjs:78] — The character scanner […]
- [x] [Review][Patch] **`exportedProps` reads only the inline parameter list, so a named props type defeats it** (low) [tests/theme-chrome.test.mjs:471] — It slices the literal parentheses after […]
- [x] [Review][Patch] **`EDGE_END` misses an edge width followed by a template interpolation or the `!` suffix** (low) [tests/theme-chrome.test.mjs:313] — `(?=["'\s\`}]|$)`.
- [x] [Review][Patch] **The projector's failure branch still cannot scroll, after the same commit declared it and the slideshow's to be one failure** (medium) […]
- [x] [Review][Patch] **The `flex-wrap` assertion checks `<nav>`, not the row whose overflow it describes** (low) [tests/theme-chrome.test.mjs:853] — The slice is `header.slice(indexOf('<nav'), […]
- [x] [Review][Patch] **`header-chrome.ts` claims "every inactive control", but the profile button still hand-rolls the box** (low) [src/components/header-chrome.ts:2] — The doc reads *"The […]
- [x] [Review][Patch] **The shell claim counter has no floor, and the exported test seam can breach it** (low) [src/lib/projected-shell.ts:94] — `claims -= 1` is unguarded, and […]
- [x] [Review][Patch] **`sprint-status.yaml` asserts both "verification is COMPLETE" and "VERIFICATION GAP, the reason this is not `review`" — on the line whose value is `review`** (high) […]
- [x] [Review][Patch] **`epics.md` still carries Story 17.1 as `in-progress` with "24 patch action items from code-review round 2"** (medium) [_bmad-output/planning-artifacts/epics.md:272] — The […]
- [x] [Review][Patch] **`DESIGN.md` still describes `LogoutButton` painting its own `red-600`/`red-400` — the exact code this commit deleted** (medium) […]
- [x] [Review][Patch] **`ARCHITECTURE-SPINE.md` still records the `@/lib` wholesale exemption that round-2 item P13 removed, and cites a function that no longer exists** (medium) […]
- [x] [Review][Patch] **`EXPERIENCE.md` puts both route shells inside 17.1's guarantee and drops one of 17.7's four holes** (medium) […]
- [x] [Review][Patch] **Round-2 item (e)'s citation repair stopped at the AC; the identical stale line survives one section away** (low) […]
- [x] [Review][Defer] **`claimProjectedShell` silently ignores its `doc` argument after the first claim** [src/lib/projected-shell.ts:75] — deferred to Story 17.7.

### Review Findings — round 4 (`bmad-code-review`, 2026-08-01)

- **1 decision-needed, 15 patch, 1 deferred, 2 dismissed as noise.** No layer failed or returned empty.
- The disclosed non-reactor is honest: removing `claims = Math.max(0, claims - 1)` alone does keep the suite at 47/47, exactly as `projected-shell.ts:111-119` says.
- **None is a live leak today**; every one was reproduced by injecting a defect and observing 47/47 stay green, with a matching control that fails.
- (b) A layer reported another process writing to the working tree mid-review; that was the sibling review layers' own injections.
- **Three of the four things this scope note told that run to preserve had gone stale between the note being written and round 4's patches landing**, which is recorded here because a run that followed the instruction literally would have written two fresh falsehoods into the authority artifact: the `exportedProps` clause needed **retracting at the composed-type spelling**, not narrowing (P3 closed […]
- **Five code-owned findings are filed in `deferred-work.md` under a new 2026-08-01 heading**, not patched — an architecture Update run does not touch production code: that focus-ring bypass; the `className` guard's index-signature hole plus its `.tsx`-only call-site belt; the **edge-width guard never receiving the transitive sweep** the token and focusable guards got (`EDGE_UTILITY` consumed at […]
- **Deferred — pre-existing, not caused by this change set**
- **Dismissed as noise (2):** a second `document` claiming while another claim is open is never blacked out, and the shared `restore` closure is bound to the first claimant's document — this is **verbatim** round 3's deferred item (*"`claimProjectedShell` silently ignores its `doc` argument after the first claim"*), already filed and owned by Story 17.7, and still unreachable from app code because […]

> **Remediation status, 2026-08-01 (`bmad-code-review`, same session): all 15 patch items closed.**
> The one still open is the **decision item**, which `AGENTS.md` routes through a
> `bmad-architecture` Update run — not something this workflow may substitute for, and the same
> refusal rounds 1 and 3 made for the same reason. **17.1 does not go to `done` until that run
> lands.**
>
> Verification after remediation: `tests/theme-chrome.test.mjs` **48/48** (47 → 48, the new test is
> the shell-reset behaviour pin); `tests/public-repo-guard.test.mjs` **4/4**; full suite **387 tests
> / 386 pass / 0 fail / 1 skipped**; `npx tsc --noEmit` clean; `npx eslint src tests` **31 problems**,
> unchanged from the pre-remediation baseline, and `npx eslint` over the five changed source/test
> files exits **0**.
>
> Every code patch was reproduced before and after: the defect injected, the suite observed green,
> the fix applied, the suite observed failing, the injection reverted and the tree re-checked. Nine
> injections in total across P1–P10. Two are recorded honestly against this workflow rather than for
> it — the `outline-transparent` run first reported *no* reaction because the replacement landed on a
> mention inside a JSX comment rather than on the link (the test was wrong, not the guard), and P9's
> fix removes a **false positive**, so its evidence is a case that failed before and is green now
> rather than the other way round.
>
> **What this round did NOT do, stated rather than left to be discovered:** it did not re-verify the
> browser measurements rounds 1–3 recorded, and it did not touch `ARCHITECTURE-SPINE.md` — that is
> the open decision item. The `DARK_VARIANT` gap is deferred with an owner note, not fixed.
- [x] [Review][Decision] **`ARCHITECTURE-SPINE.md:392` describes a closure gate that no longer exists, and no owner is filed** (medium) […]
- [x] [Review][Patch] **The `className`/spread guard truncates at the first `>` in a prop — the exact defect `openingTag()` was written in this change set to remove** (medium) […]
- [x] [Review][Patch] **`exportedPropsShape` reads only the first `{…}` block, so `&` or `extends` restores a projected `className` with `tsc` clean** (high) [tests/theme-chrome.test.mjs:843] — […]
- [x] [Review][Patch] **`stripComments` has no JSX awareness, and it fails in both directions** (high) [tests/theme-chrome.test.mjs:141] — This is the input stage of every guard AC-4 rests on, […]
- [x] [Review][Patch] **The focus-ring guard accepts `outline-transparent` and `outline-inherit`** (medium) [tests/theme-chrome.test.mjs:582] — `LITERAL_OUTLINE_COLOUR = […]
- [x] [Review][Patch] **"Every projected focusable" sweeps the tags but not the files** (medium) [tests/theme-chrome.test.mjs:598] — The loop is `for (const file of PROJECTED)`, a six-entry […]
- [x] [Review][Patch] **The AC-6 chromatic sweep's `(?<![-\w:])` excludes every variant-prefixed shade, not just `dark:`** (medium) [tests/theme-chrome.test.mjs:1549] — The `:` in the negative […]
- [x] [Review][Patch] **The AC-6 paired-half lookup is per class *value*, not per site** (medium) [tests/theme-chrome.test.mjs:1610] — `if (new RegExp(\`dark:text-${m[1]}-\`).test(value)) […]
- [x] [Review][Patch] **The AC-3 branch root is the first classed element in *source order*, which can be a sibling rather than an ancestor** (medium) [tests/theme-chrome.test.mjs:1117] — `if […]
- [x] [Review][Patch] **`jsxReturnBranches` treats every `return` after the default export as a surface branch, including helper components** (low) [tests/theme-chrome.test.mjs:1102] — `const […]
- [x] [Review][Patch] **`resetProjectedShellForTest()` drops `restore` without calling it, so the next claim snapshots the already-blacked shell** (medium) [src/lib/projected-shell.ts:129] — The […]
- [x] [Review][Patch] **The pinned exception list is 18 entries, not the 20 claimed in three artifacts** (medium) [tests/theme-chrome.test.mjs:1566] — Counted programmatically: **10** […]
- [x] [Review][Patch] **`DESIGN.md:194` still describes the header box as one constant with two consumers** (low) […]
- [x] [Review][Patch] **`DESIGN.md:99`'s rewritten `red` sentence omits `text-red-200`** (low) [_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md:99] — *"What […]
- [x] [Review][Patch] **`EXPERIENCE.md` documents the room-facing failure branch on the slideshow row only** (low) […]
- [x] [Review][Patch] **The "24 injections, 23 react" figure reads as *the* coverage gap and is not one** (low) [_bmad-output/implementation-artifacts/sprint-status.yaml:148] — The story and […]
- [x] [Review][Defer] **`DARK_VARIANT` misses `dark:!…` and `dark:<digit>…`** [tests/theme-chrome.test.mjs:533] — deferred, pre-existing.

## Dev Notes

### Verified starting state (2026-07-29, at `acc8df0`)

| Fact | Evidence |
|---|---|
| Complete dark palette exists | `src/app/globals.css:86` — `.dark { … }`, 104 token lines in the file |
| Dark variant is wired to a class | `src/app/globals.css:5` — `@custom-variant dark (&:is(.dark *))` |
| No provider anywhere | `grep -rn ThemeProvider src/` → no match |
| `next-themes` used once | `src/components/ui/sonner.tsx:3` — `useTheme()` for toast theming only |
| Two surfaces pin dark themselves | `PresenterOperator.tsx:449`, `SlideGridDialog.tsx:176` |
| Projected output uses literal colours | `ProjectorClient.tsx:125,145,162`; `ArtifactSlide.tsx` inline `style`; `SlideView.tsx` no theme tokens |

### Requirement ancestry

No PRD FR. Per the `AGENTS.md` authority map, operator-chrome visual identity is governed by `DESIGN.md`, and this story changes nothing about a Deck, a Slide Type or a payload contract — see the Epic 17 preamble, where that is recorded as a decision rather than left as a silence. Contrast with FR-20, which was added because Epic 16 changed how every slide is produced.

### Out of scope

- The `--muted-foreground` fix itself (Story 17.2 owns that token).
- Removing the hardcoded `dark` wrappers in the two presenter surfaces.
- Any change to registry-driven slide appearance, PPTX rendering or the projector.
- Theming the projector output, in any form, under any setting.

### References

- Defect source: `_bmad-output/planning-artifacts/implementation-readiness-report-2026-07-29.md` (open item 2 — corrected above). That report still carries the wrong claim in its own text; it is a dated assessment, not a living contract, so it was not rewritten.
- Visual authority: `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md` — reconciled 2026-07-30, `updated: '2026-07-30'`
- Behavioural counterpart: same folder, `EXPERIENCE.md` — same run. Its *Accessibility Floor* and *Open Items* are the two sections this story touches.
- Runtime rules: `_bmad-output/project-context.md`
- Epic: `_bmad-output/planning-artifacts/epics.md` — Epic 17

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (`claude-opus-5`), via `bmad-dev-story`, 2026-07-30.

### Debug Log References


| Check | Method | Result |
| --- | --- | --- |
| AC-2 first visit follows the OS | `localStorage.theme` absent, `prefers-color-scheme: dark` | `<html class="… dark">`, `color-scheme: dark`, body `lab(2.75)` |
| AC-1 persistence | stored `light`, reload | resolved light **against** an OS that prefers dark |
| AC-1 new tab | fresh tab at `/` | stored choice carried; control read `Light theme. Switch to: dark theme` |
| AC-1 the control | clicked it | light → dark in one click, `localStorage` written, label advanced to `Switch to: follow system theme` |
| AC-1 keyboard/labelling | a11y tree | native `<BUTTON>`, `tabIndex 0`, `aria-label` carries state + next state |
| AC-2 no flash / no mismatch | console filtered on `hydrat\|Hydration\|did not match` | zero messages |
| AC-3 presenter | hub set light, opened `/services/2/present` | shell `div.dark …` resolves `--background` `lab(2.75)`, paints dark |
| AC-3 slide grid | opened **All slides** with hub light | portalled to `BODY` (outside the presenter shell), self-declares `dark`, popover `lab(7.78)` on white text |
| AC-4 slideshow | flipped the class on `<html>` in place, fingerprinted all 14 nodes | backgrounds and text byte-identical |
| AC-4 projector | same, 11 nodes | painted output identical |
| AC-6 | each `.dark` token painted to a 1×1 canvas, WCAG 2.1 luminance from the sRGB bytes | four pairs, recorded in `DESIGN.md` |

#### Review remediation, 2026-07-31 — same server, same method

- **The AC-4 row above is the one that failed review, and its wording is why.** *"Flipped the class on `<html>`, fingerprinted all 14 nodes"* enumerated nodes **inside** the client tree; `html` and `body` are not in it, and that is where the theme paints.

| Check | Method | Result |
| --- | --- | --- |
| AC-4 the shell, fixed | `/services/2/slideshow`, both themes | `html` and `body` compute `rgb(0, 0, 0)`, `scrollbar-gutter: auto`, `overflow: hidden` — identical either way |
| AC-4 the shell, defect reproduced | dropped only the hook's five inline styles, in place | `body` → `lab(100 0 0)` light / `lab(2.75 0 0)` dark, gutter back to `stable`. The strip was real and it did follow the choice |
| Toggle vs siblings | dark mode, after a reload | toggle and *Announcements* pill compute **identical** `background-color`, `border-color`, `color` |
| Toggle, pre-fix delta | fresh probe nodes, so nothing is read from a stale style cache | old string `bg-input/30` α 0.045 + `lab(100 0 0 / .15)` border vs pill `--card` α 0.5 + `lab(100 0 0 / .1)` |
| Why the fix works | live class list on the rendered button | `tailwind-merge` **removed** the variant's `dark:border-input`, `dark:bg-input/30`, `dark:hover:bg-input/50` — deleted, not out-specified |
| Badge / affordance shades | each pair painted to a canvas, WCAG 2.1 luminance from the sRGB bytes | emerald 4.23 → 10.56, amber 4.76 → 10.57, indigo 2.54 → 9.72, logout 3.76 → 6.21, success 4.91 → 9.25 |
| `dark:text-red-400` = `--destructive` | painted both | both `#ff6467` |
| The 29 newly-live `dark:` overrides | tokens read from the resolved palette, layers composited on canvas | all pass; figures in `DESIGN.md` |
| Non-text (WCAG 1.4.11) | `--border`, `--input`, `--ring` over `card/50`, both themes | 1.29 / 1.54 / 4.18 dark, 1.26 / — / **2.58** light. Two failures, one of them the light focus ring |
| Console | filtered to errors, every page visited | only the pre-existing `ServicesList.tsx:98` Base UI warning; nothing from this change set |

#### Round-2 remediation, 2026-07-31 — what was verified, and what could not be

- `node_modules` could not be installed: `npm ci` failed with `EINTEGRITY` on `set-function-name@2.0.2`.
- One of those names occurs as an ASCII substring inside that base64 hash, and the pass rewrote it there too.
- Repaired to the registry's authentic value; `tests/public-repo-guard.test.mjs` passes 4/4 with it, so the substring is not fingerprinted and there is no collision with the PII rule.
- This finding is out of scope for Story 17.1 and is filed for its own audit; the open question is what *else* that pass rewrote inside non-prose data.
- And `git status` at the start of this round was **clean** — the 25-file working tree the round-2 review read as uncommitted had in fact been committed as `3f210c7`, and Story 17.7 was already registered by `116ba3d`, so part (b) of the second decision item was half-closed before this pass began.

| Check | Method | Result |
| --- | --- | --- |
| `tests/theme-chrome.test.mjs` | node built-ins plus `--experimental-strip-types`; ran before install too | **43/43 pass** |
| `tests/public-repo-guard.test.mjs` | the mandatory pre-commit gate; re-run after the lockfile repair | **4/4 pass** |
| Every new or widened guard | 18 defects injected one at a time, suite run, file restored | **18/18 behaved as claimed** |
| `npm run build` | required by `auth-http.test.mjs`, which self-reports it | **succeeded** |
| Full suite (`npm test`) | after build | **380 tests / 379 pass / 0 fail / 1 skipped** |
| `tsc --noEmit` | project TypeScript, not `npx tsc` | **clean, exit 0** |
| `npm run lint`, changed files only | `npx eslint` over all 15 | **4 problems, all pre-existing** — verified individually against `HEAD` |
| Browser verification of the four new `dark:` sites | — | **NOT RUN.** No new colour pair enters the product; per-surface confirmation is outstanding |

#### Round-3 remediation, 2026-08-01 — the pattern, and what closing it cost

- Round 3's brief was that its 19 findings share one shape: *a rule applied too narrowly gets closed by widening the list rather than encoding the rule.* Nine were in the AC-4 guard, all latent, all reproduced by injecting a defect and watching **43/43** stay green.
- **One was resolved by inverting the polarity instead of widening anything.** The badge guard's rule is now universal over every `.tsx` and `.ts` under `src/`, per class value and per site, across every chromatic hue at any shade — and its **18** exceptions are a pinned multiset, each with a line citation and an owning key, compared in both directions so an unlisted offender fails *and* a fixed […]
- **Reproduced, then re-reproduced.** A harness applies one defect at a time, runs the suite, restores, and reports whether it reacted — **24 injections, 23 react.** The exception is documented rather than hidden: with the `generation` token on the shell claim there is no public path to a negative counter, so removing the `Math.max(0, …)` floor *alone* keeps the suite green.
- One case in the harness is a **false-positive** test rather than a defect: a correctly written `<Link>` carrying `onClick={() => …}` must stay green, and it does.
- root-only reading of AC-3 failed on it, and the correct rule is the *outermost classed* element per root.

### Completion Notes List

- 2026-07-30/31; AC-5 could not be (see below).
- - `tests/theme-chrome.test.mjs` is new — **48 tests** as of round 4 (five declarations are
- **Every guard was negative-tested — 18 injected defects, each confirmed to make the suite react as claimed**, including two that caught the guard rather than the code: a file-wide `text-white` match passed with the root stripped bare, and a document-wide `DESIGN.md` match passed with the dark figure deleted, because the light table carries the same pair names.
- That sentence used to end *"none of the six changed files appears in the lint output"*, which was wrong twice: the change set touched **13** files by round 2, and one of them did appear — `LogoutButton.tsx:5`'s unused `Button` import, pre-existing, and now deleted.
- **Amended 2026-07-31: "every pair" was four pairs, all of them text on a surface.** Non-text contrast had never been measured and fails in both themes; see below.

#### Review remediation, 2026-07-31

- An inline one-line spine edit would have recorded the decision and skipped the review that found the defect.
- `ProjectorClient` had solved this for itself in a commented effect; the slideshow, the same `fixed inset-0` pattern at an equally room-facing URL, had no reset.
- Extracted to `src/lib/use-projected-shell.ts` and called by both, with the defect reproduced in the browser first so the fix is known to fix something.
- **This note said *two* while three other places in the same change set said three** — the undercount was of the defect this story fixed.
- - **The 29 newly-live `dark:` overrides were reviewed and measured rather than deferred**, per the
- - **AC-5 stays structural, by the owner's decision**, and now has a tracked home instead of a
- - **One more pre-existing defect observed and left alone**, in the spirit of the two already
- recorded above: `src/components/LogoutButton.tsx` imports `Button` and never uses it (the row is a hand-rolled `<button>`), which is one of the repo's 32 standing lint warnings.

#### Round-3 remediation, 2026-08-01

- reasoning went further than the line it flagged: the full-screen root must state `fixed inset-0` as well as `text-white`, and the closure walk asserts a floor of 27 reached modules so it cannot silently shrink to the 12 it was scanning.
- - **Verification.** Full suite **386 tests / 385 pass / 0 fail / 1 skipped** (382/381 before — the
- four new tests are the row-wrap split, the header-box rule, the failure-branch overflow guard and the stale-release behaviour test); `tests/theme-chrome.test.mjs` **43 → 47**; `tests/public-repo-guard.test.mjs` **4/4**; `npx tsc --noEmit` clean; `npx eslint src tests` **31 problems (15 errors, 16 warnings)** — byte-identical to the count at `HEAD` measured by stashing this change set and […]
- 24 defect injections, 23 react; the one that does not is the floor above.
- header row and the projector's failure branch were never seen rendered.

### File List

**Added**

- `src/components/ThemeProvider.tsx`
- `src/components/ThemeToggle.tsx`
- `src/lib/use-projected-shell.ts` *(2026-07-31 — the shared full-screen shell reset)*
- `tests/theme-chrome.test.mjs`

**Modified**

- `src/app/layout.tsx`
- `src/components/Header.tsx`
- `package.json` (new test file registered in the `test` script)
- `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/stories/17-1-reachable-dark-mode.md`

**Modified 2026-07-31, review remediation**

- `src/app/services/[id]/present/projector/ProjectorClient.tsx` (effect extracted to the shared hook)
- `src/app/services/[id]/slideshow/SlideshowClient.tsx` (calls the shared hook — AC-4)
- `src/app/services/[id]/slideshow/page.tsx` (failure branch to literal colours; `Card`/`Button` imports dropped)
- `src/components/SlideView.tsx` (dead `className` pass-through removed)
- `src/components/SlidePreviewList.tsx` (`dark:` halves for the three chromatic badge tones)
- `src/components/LogoutButton.tsx` (`dark:text-red-400`)
- `src/components/ThemeToggle.tsx` (dark box override; focusable, state-free placeholder)
- `src/components/Header.tsx` (`dark:text-emerald-400` on the password-success line)
- `tests/theme-chrome.test.mjs` (widened guards, comment stripping, new guards — 17 → 28 tests)
- `_bmad-output/planning-artifacts/epics.md` (Story 17.6 registered under Epic 17)
- `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`
  *(the `AD-24` amendment — listed because `AGENTS.md` requires the spine to move in the same
  change set, and the round-1 File List omitted it while the Change Log already described it)*

**Added 2026-07-31, round-2 remediation**

- `src/components/header-chrome.ts` — the header row's shared control box, read by both `Header`
  and `ThemeToggle`. A third file rather than an export from `Header`, because `Header` already
  imports `ThemeToggle` and importing back would close a cycle
- `src/lib/projected-shell.ts` — the reference-counted DOM claim, with no React in it so the set
  *and* restore paths are reachable from `node:test` against a document stub
- `src/lib/theme-cycle.ts` — order, wrap-around and labels, extracted so the modulo is a function
  a test can call rather than a regex target inside a component

**Modified 2026-07-31, round-2 remediation**

- `src/app/announcements/AnnouncementsManager.tsx` (two badge tones gain the ported `dark:`
  halves; *Remove* takes `text-destructive`)
- `src/components/admin/ArtifactEditor.tsx` (`dark:text-emerald-400` on the success line)
- `src/components/LogoutButton.tsx` (`text-destructive` replaces the hand-rolled `red-600`/
  `red-400` pair; unused `Button` import deleted)
- `src/components/artifacts/ArtifactSlide.tsx` (`className` parameter deleted — the AC-4
  invariant becomes a compile error)
- `src/app/services/[id]/slideshow/SlideshowClient.tsx` (`focus-visible:outline-white` on the
  projected focusable)
- `src/app/services/[id]/slideshow/page.tsx` (scrollable failure branch; headline unified with the
  projector's; registry sentence restored; literal outline colour on both recovery links)
- `src/app/services/[id]/present/projector/ProjectorClient.tsx` (`text-white` on the root)
- `src/components/ThemeProvider.tsx` (`disableTransitionOnChange`)
- `src/components/ThemeToggle.tsx` (shared box; `aria-disabled:pointer-events-none`; cycle and
  labels imported from `@/lib/theme-cycle`)
- `src/components/Header.tsx` (`<nav>` ends at the links; row is `flex-wrap`; link classes come
  from `header-chrome`)
- `src/lib/use-projected-shell.ts` (reduced to the React binding over `projected-shell.ts`)
- `tests/theme-chrome.test.mjs` (scanner-based comment stripping, brace-balanced extraction,
  widened token and edge guards, transitive closure with no exempt directory, per-branch AC-3,
  behaviour tests for the shell claim and the cycle — 28 → **43 tests**)
- `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md`
  (Open Items 4 and 6 repaired; Components row for the preview list and `ThemeToggle` rewritten;
  the four newly-fixed sites recorded)
- `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md`
  (`ThemeToggle` row scoped to the token guarantee; slideshow failure state updated)
- `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`
  (Story 17.7 named as the key that closes `AD-24`'s partial tag; the gap widened from one hole to
  four — a citation repair, not an amendment: no clause changed, no `AD-n` added)

- `package-lock.json` — **one `integrity` value repaired to the registry's authentic checksum.**
  Not this story's work and not caused by it: `npm ci` had been broken repo-wide since the
  2026-07-29 PII remediation rewrote a name substring inside a base64 sha512. Included because the
  repair is in this change set and because nothing could be verified without it; it wants its own
  audit entry, not attribution to Story 17.1

**Modified 2026-08-01, round-3 remediation**

- `tests/theme-chrome.test.mjs` — regex-literal state and a shared `expressionPosition()` in
  `stripComments`; one `walkJsx()` / `openingTag()` / `enclosingTag()` used by four guards; branch
  roots read as *outermost classed* per root on every branch; the focusables, the badge shades and
  the header row swept instead of listed; `EDGE_END` gains `$`/`!` and an interpolated width; the
  closure walk enqueues every extension, reads `export … from` and bare side-effect imports, and
  asserts a floor of 27 reached modules; `exportedPropsShape()` resolves a named props type; new
  guards for the room-facing overflow, the header box's single source, and the stale-release
  behaviour of the shell claim — **43 → 47 tests**
- `src/app/services/[id]/present/projector/page.tsx` — the failure branch scrolls, matching the
  slideshow's shape as well as its headline
- `src/components/header-chrome.ts` — split into `HEADER_CONTROL_BOX_BASE` (the box) and
  `HEADER_CONTROL_BOX` (box plus the muted tone), and the doc sentence narrowed to what is true
- `src/components/Header.tsx` — the profile dropdown trigger takes `HEADER_CONTROL_BOX_BASE` with
  its own `text-foreground`, retiring the third hand-rolled copy of the box
- `src/lib/projected-shell.ts` — `claims` floored, and a `generation` token so a release issued
  before a reset is inert
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — the superseded *VERIFICATION GAP*
  paragraph deleted from the round-2 entry and replaced by a record of what it claimed
- `_bmad-output/planning-artifacts/epics.md` — Story 17.1 to `review`; Epic 17 heading updated
- `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md` —
  `LogoutButton` at Colors and Components rewritten to the shipped `text-destructive`
- `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md` —
  the guarantee scoped to the shells' own elements, four holes named, the focusable claim restated

**Modified 2026-08-01, round-4 remediation**

- `tests/theme-chrome.test.mjs` — `stripComments` models JSX children as a fourth quoting form
  (tag *stack*, not a flag) and `expressionPosition` reads `<` before `/` as a closing tag;
  `exportedPropsShape` resolves a props type's whole declaration and every locally-declared type it
  composes, failing loudly on anything not declared in the file; one shared `projectedTree()`
  answers *what is projected* for both the token guard and the focusable sweep; `classValues`
  splits a template's arms so AC-6 pairs per site; `CHROMATIC_TEXT` excludes `dark:` by name rather
  than every variant prefix; `LITERAL_OUTLINE_COLOUR` rejects `transparent` and the CSS-wide
  keywords; the `className` guard reads `openingTag`; branch roots descend the single-element chain
  and report ambiguity; `jsxReturnBranches` reads only the exported function's body — **47 → 48
  tests**, the new one pinning that a reset hands the shell back
- `src/lib/projected-shell.ts` — `resetProjectedShellForTest()` calls `restore?.()` before dropping
  it, so a reset cannot leave the shell black for the next claim to snapshot
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — 17.1 to `in-progress` (one open
  decision item); the pinned-exception count corrected to 18; the injection figure narrowed to what
  it measures
- `_bmad-output/planning-artifacts/epics.md` — Story 17.1 heading to `in-progress`
- `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md` — the
  `header-chrome` row records two exports and three consumers; the `red` sentence names
  `text-red-200`
- `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md` — a
  `/services/[id]/present/projector` row in *State Patterns*; the focusable claim resized to the
  assertion
- `_bmad-output/implementation-artifacts/deferred-work.md` — the `DARK_VARIANT` gap filed
  *(listed because round 2 found this file omitted from the File List and the omission was not
  fully repaired then)*

**Not modified by `bmad-code-review`, deliberately — and modified later the same day by the run it was routed to:**
`ARCHITECTURE-SPINE.md` — its `:392` ceiling bullet was stale (round 4's decision item), and
repairing it was routed to a `bmad-architecture` Update run by the owner's call. `bmad-code-review`
does not write the spine, for the same reason it refused to in rounds 1 and 3. **That Update run
landed on 2026-08-01** and rewrote the ceiling bullet and sub-bullet (ii), amended `AD-24`'s rule
clause in place from *"two sets"* to the four hardcoded lists the gate actually has, and repaired the
`projector/page.tsx:71` → `:85` citation at both sites. Nothing renumbered, no `AD-n` added. Recorded
here rather than left as a silence, because this line previously read *"not this workflow's to touch"*
with no note of who touched it.
- `_bmad-output/implementation-artifacts/deferred-work.md` — a new *2026-08-01* heading carrying the
  five code-owned findings that run's Reviewer Gate opened against `tests/theme-chrome.test.mjs`
  *(added by the Update run, not by this workflow)*
- `_bmad-output/implementation-artifacts/stories/17-1-reachable-dark-mode.md` — the drifted
  `layout.tsx:26` citation repaired to `:32`; 18 items closed with their resolutions

**Not modified, deliberately:** `package.json`. The behaviour tests live in the existing
`tests/theme-chrome.test.mjs` rather than a new file, so the `test` script needs no new entry.
`src/app/announcements/AnnouncementsManager.tsx` — its *Replace All…* button wears the same three
box classes but is a page action button, not header chrome; filed as its own concern rather than
pointed at a header constant.
`ARCHITECTURE-SPINE.md` — round 3's spine items were closed by the `bmad-architecture` Update run on
2026-07-31 and are not this workflow's to touch.

### Change Log

- 2026-07-29: Story 17.1 created; Epic 17 added to `epics.md`; sprint keys added.
- 2026-07-30: Implemented. next-themes provider mounted as a client boundary under the
  Server-Component root layout; `ThemeToggle` added to the shared `Header`, cycling
  system → light → dark; `tests/theme-chrome.test.mjs` added (17 assertions) pinning that no
  theme token and no theme-coloured edge reaches the projected render tree. Dark palette
  measured on four pairs via canvas-resolved sRGB and recorded in `DESIGN.md`, which also
  closes its Open Item 2 and scopes Open Item 1 to the light theme; `EXPERIENCE.md`
  *Accessibility Floor* and *Component Patterns* updated in the same change set. Full suite
  354 tests / 353 pass / 0 fail / 1 skipped; public-repo guard 4/4.
- 2026-07-31: `bmad-code-review` returned the story to `in-progress` — AC-4 not met. **Addressed
  11 of the 12 patch findings** (AD-24 excepted; it needs a `bmad-architecture` Update run).
  AC-4 fixed at the layer that was actually leaking: the projector's `html`/`body` reset extracted
  to `src/lib/use-projected-shell.ts` and called by the slideshow too, and the slideshow's route
  shell repainted in literal colours. Three sub-AA chromatic text pairs fixed and re-measured;
  the 29 newly-live `dark:` overrides reviewed and measured; non-text contrast measured for the
  first time and filed as `DESIGN.md` Open Item 6. `tests/theme-chrome.test.mjs` rebuilt — comment
  stripping, widened edge and token guards, closure over relative/aliased/dynamic imports, a
  `className` guard, and every guard negative-tested (17 → 28 tests). AC-5 filed as
  `EXPERIENCE.md` Open Item 4 with owning **Story 17.6**, registered in `epics.md` and
  `sprint-status.yaml`. Full suite **365 tests / 364 pass / 0 fail / 1 skipped**; `tsc --noEmit`
  clean; lint clean on all changed files bar one pre-existing unused import; public-repo guard 4/4.
- 2026-07-31, later: **`bmad-architecture` Update run closed the twelfth item.** `AD-24` added to
  `ARCHITECTURE-SPINE.md` as the next id, nothing renumbered, tagged `[ADOPTED, partial]`;
  `next-themes` and `shadcn` added to the Stack table, a `Client state` row added to *Consistency
  Conventions*, the localStorage channel drawn into the first diagram, and five *Deferred* entries
  filed. Its Reviewer Gate (`lint_spine` 0 findings + four parallel lenses) returned one new high
  finding against story 17.1's change set — the Server-Component route shells keep the themed app
  shell — now filed in *Review Findings* above with no owner. Reports:
  `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/reviews/*-2026-07-31-ad24.md`.
- 2026-07-31, round 2: **`bmad-code-review` round 2 returned the story to `in-progress` with 25
  open items; all 25 are now addressed.** AC-4 is **rescoped in the AC itself, on two axes** at the
  owner's direction — the token guarantee is this story's, the shell guarantee is Story 17.7's, and
  the word *previewed* is removed because the Live Slide Preview is hub chrome. *(Amending an AC is
  outside this workflow's normal edit surface; it is done here because the owner directed it and
  because the contradiction between the AC section and the findings section was itself a finding.)*
  Four AC-6 sites the round-1 sweep missed are fixed (`AnnouncementsManager` ×2,
  `ArtifactEditor`), `LogoutButton`'s hand-rolled `red-600`/`red-400` pair collapses to
  `text-destructive` — the two are byte-identical in both themes — and its unused `Button` import
  is gone. `ArtifactSlide`'s dead `className` parameter is deleted, making the AC-4 invariant a
  compile error. Projected focusables state `focus-visible:outline-white`, closing a ring that
  painted from `--ring`. The slideshow's failure branch scrolls, matches the projector's headline
  and regains the sentence it dropped. `ThemeToggle` takes a shared `HEADER_CONTROL_BOX` (new
  `components/header-chrome.ts`) instead of a copy, gains `cursor-pointer` and
  `aria-disabled:pointer-events-none`, and moves out of the `<nav>` landmark onto a `flex-wrap`
  row. The provider gains `disableTransitionOnChange`. The shell claim is **reference-counted**
  and extracted to `src/lib/projected-shell.ts`; the theme cycle to `src/lib/theme-cycle.ts` — both
  so the restore path and the modulo are exercised as **behaviour** rather than matched as text.
  The guard file is rebuilt: scanner-based comment stripping, brace-balanced extraction, Tailwind 4
  `bg-(--card)` shorthand, arbitrary and inline edge widths, per-branch AC-3, transitive closure
  with **no exempt directory**, hoisted regexes — **28 → 43 tests, and 18 injected defects each
  confirmed to make the suite react.** `DESIGN.md`: Open Item 6 no longer denies its own finding,
  Open Item 4 is recounted with comments stripped and its grep quoted, the preview-list Components
  row stops describing slides it does not render. `ARCHITECTURE-SPINE.md` names **Story 17.7** as
  the key that closes `AD-24`'s `[ADOPTED, partial]` tag, and widens the recorded gap from one hole
  to four.
  **Verification complete → `review`.** `npm run build` succeeds; full suite **380 tests / 379 pass
  / 0 fail / 1 skipped**; `tsc --noEmit` clean; `tests/theme-chrome.test.mjs` **43/43**;
  `tests/public-repo-guard.test.mjs` **4/4**; `npm run lint` **31** problems against 32 before —
  the difference being the unused import this round deleted — with **4** in the 15 touched files,
  all pre-existing and verified individually against `HEAD`. Only a browser pass over the four new
  `dark:` sites is outstanding, and no new colour pair enters the product.
  **`tsc` caught one real defect of mine that 43 green tests did not:** `ShellDocument` typed the
  claimed style as `Record<string, string>`, which a real `CSSStyleDeclaration` cannot satisfy, so
  `claimProjectedShell(document)` failed to compile while every stub-based behaviour test passed.
  Fixed to a mapped type over the three named properties.
- 2026-07-31, **`package-lock.json` repaired — a defect outside this story, found while trying to
  verify it.** `npm ci` had been broken in this repository since 2026-07-29, on every machine: the
  `integrity` value for `set-function-name@2.0.2` did not match the registry, differing in a single
  four-character substring. It is collateral damage from this project's own PII remediation, which
  replaced real names with invented ones across the whole tracked tree and rewrote one of them
  inside a base64 sha512. All 819 integrity values were checked by base64 length (sha512 must be 88
  characters; the corrupt one was 89) — **exactly one** was affected, and that detector cannot see a
  length-preserving rewrite. Restored to the registry's authentic value, which the public-repo guard
  accepts; integrity checking was never disabled. Listed in the File List because the repair is in
  this change set, but it belongs to its own audit rather than to Story 17.1 — the open question is
  what else that pass rewrote in non-prose data.

- 2026-07-31, round 3: **`bmad-code-review` round 3 returned the story to `in-progress` with 19
  patch action items, 1 decision resolved by the owner into a blocking prerequisite, 1 deferred and
  6 dismissed.** This round reviewed the *remediation* — commit `517f6c1` alone — rather than the
  story, because the brief was to verify round 2's 25 items are genuinely closed. **They are: not
  one of the 25 is a checkbox ticked over nothing, and several closures are stronger than the
  finding asked for.** What round 3 found is one recurring pattern rather than a failed
  remediation — *a finding about a rule applied too narrowly gets closed by widening the list
  instead of encoding the rule*. Nine guard items are that pattern: the `@/lib` directory exemption
  came back as a `.ts` extension exemption over the same directory; the badge sweep became a
  four-file table while `allTsxFiles()` sits in the same file; `focusables` became a hardcoded pair.
  Every one was reproduced by injecting a defect and observing the suite stay **43/43 green**, and
  none is a live leak today. The one `high` is not code at all: `sprint-status.yaml:148` asserts
  both *"verification is COMPLETE"* and *"VERIFICATION GAP, the reason this is not `review`"* on the
  line whose value is `review`, with three clauses this same commit retracted elsewhere — the
  defect class round 2's decision item (c) was written to close, relocated from the story to the
  tracker. Four more artifacts contradict the code or the rescope: `DESIGN.md` still describes the
  `red-600`/`red-400` pair this commit deleted, `ARCHITECTURE-SPINE.md:392` still records the `@/lib`
  exemption and cites `componentImports` (`grep -c` → 0), `EXPERIENCE.md:93` puts both route shells
  inside 17.1's guarantee and drops one of 17.7's four holes, and `epics.md:272` still reads
  `in-progress — 24 patch action items`. **Owner's decision, 2026-07-31: the inline
  `ARCHITECTURE-SPINE.md` edit goes through a `bmad-architecture` Update run before 17.1 closes** —
  consistent with the precedent this story set in round 1, and this workflow deliberately did not
  execute it. Verification re-run rather than accepted: `tsc --noEmit` clean, theme-chrome 43/43,
  public-repo guard 4/4, full suite **382/381/0 fail/1 skipped** (the story's 380/379 was correct on
  the branch; the merge brought in two lockfile tests from `b087624`). One subagent claim was
  rejected on re-verification: `npm run lint` really does print 14,559 problems here, but 14,528 come
  from an untracked, locally-excluded agent worktree — a clean checkout yields exactly the **31** the
  record claims. Patch items were left as action items at the owner's direction, as in rounds 1
  and 2.
- 2026-08-01, round-3 remediation: **all 18 remaining round-3 items closed; back to `review`.** The
  nineteenth patch item and the blocking decision were already closed on 2026-07-31 by the
  `bmad-architecture` Update run, the channel `AGENTS.md` requires and one this workflow does not
  substitute for. Round 3's brief was that its findings share one shape — *a rule applied too
  narrowly gets closed by widening the list rather than encoding the rule* — so the remediation was
  written against the shape. Three guard findings collapsed into **one JSX walk** (`walkJsx`,
  `openingTag`, `enclosingTag`) plus **one shared lexical rule** (`expressionPosition`, which answers
  the same question for `/` in `stripComments` and `<` in the walk); the focusables, the branch roots,
  the header row and the failure branches now ask that walk instead of each carrying its own narrower
  regex. The badge guard's **polarity is inverted**: universal over every `.tsx` and `.ts` under
  `src/`, per class value and per site, across every chromatic hue at any shade, with **18** pinned
  exceptions each carrying a line citation and an owning key, compared as a multiset in both
  directions so an unlisted offender fails *and* a fixed entry left behind fails. The closure walk
  enqueues every extension, reads `export … from` and bare side-effect imports, and asserts a floor
  of **27** reached modules against the **12** it was scanning. Two guards are stricter than their
  findings asked (`fixed inset-0` required on the full-screen root; the reach floor). Code: the
  projector's failure branch scrolls — measured, the old shape hid **112px** of error detail with no
  scrollbar and `scrollTop` pinned at 0; `header-chrome` splits into box and tone so the profile
  trigger stops hand-rolling the third copy, verified as **no visual change** by computed-style
  equality in both themes and by running the real `cn()` over the `ThemeToggle` path; the shell claim
  gains a floor and a `generation` token. Record: `sprint-status.yaml`'s superseded *VERIFICATION
  GAP* paragraph deleted and replaced by a record of what it claimed, `epics.md` moved to `review`,
  `DESIGN.md`'s `LogoutButton` rows rewritten to the shipped `text-destructive`, `EXPERIENCE.md`
  scoped to the shells' own elements with all **four** holes named, and the story's own
  `layout.tsx:26` citation repaired. **The rules found three things the lists had not:** an unclassed
  context-provider root in `SlideGridDialog` (which corrected AC-3's rule from *root* to *outermost
  classed*), 15 unwalked modules rather than the estimated 14, and a **fourth** copy of the header box
  at `AnnouncementsManager.tsx:275` — deliberately not absorbed here, because it is a page action
  button and not header chrome. **Verification:** full suite **386 tests / 385 pass / 0 fail / 1
  skipped**; theme-chrome **47/47**; public-repo guard **4/4**; `tsc --noEmit` clean; `eslint src
  tests` **31 problems**, identical to `HEAD` measured by stashing and re-running, so zero introduced;
  **24 defect injections, 23 react** — the one that does not is the shell-claim floor, which has no
  public path to reach once the generation token exists, and that is stated in the source rather than
  covered by a source-text assertion. **Not verified in the running app:** the header row and the
  projector failure branch, both behind the session gate, the latter also needing a forced registry
  failure — so the two measurements above are of the CSS against the real compiled stylesheet, not of
  the rendered pages.

- 2026-08-01, later: **`bmad-architecture` Update run closed the round-4 decision item, and the story
  moves to `review`.** `ARCHITECTURE-SPINE.md`'s AD-24 closure-gate ceiling bullet and sub-bullet (ii)
  rewritten against the shipped gate; AD-24's rule clause amended in place from *"two sets that must
  both be maintained"* to the **four** hardcoded lists the gate actually has; the
  `projector/page.tsx:71` citation repaired to `:85` at both sites. Nothing renumbered, no `AD-n`
  added — 24 AD headings before and after. `lint_spine` 0 findings, `theme-chrome` 48/48,
  `public-repo-guard` 4/4, working tree clean (one measurement probe applied and reverted, verified).
  **Three of the four things the owner's scope note asked that run to preserve had gone stale** in the
  hours between the note and round 4's patches — recorded in the decision item above rather than
  quietly corrected, because a run that obeyed the note literally would have introduced two fresh
  falsehoods. **The run's Reviewer Gate opened new findings for the fourth consecutive time**, and for
  the second run running its headline findings were against the amendment itself: three lenses
  converged on the spine having come to forbid and mandate the same change, and the gate refuted the
  run's claim that round 4 had broken the *widen-the-list* pattern — `LITERAL_OUTLINE_COLOUR` went
  from four excluded spellings to nine, and its arbitrary-value form is accepted by the shipped regex.
  **Five code-owned findings filed in `deferred-work.md`, none patched** (an architecture Update run
  does not touch production code); three are live narrowings of AC-4's own guard, all latent. The
  `done` call is explicitly left to the owner.

- 2026-08-01, close: **Status → `done` by the owner.** The condition was not that no latent
  narrowing remains in `tests/theme-chrome.test.mjs` — four rounds established that a fifth round
  would find a fifth spelling — but that **every finding has an owner**. It now does: the two shell-
  shaped findings belong to Story 17.7, and the four guard narrownesses (the focus-ring subtraction
  list and its arbitrary-value bypass, the `className` guard's index-signature hole plus its
  `.tsx`-only call-site belt, the edge-width guard's missing transitive sweep, and `DARK_VARIANT`'s
  `dark:!…` / `dark:2xl:…` / `dark:*:…` gap) are **Story 17.8**, registered `ready-for-dev` the same
  day. `deferred-work.md` carries no `owner: unassigned` entry. Also repaired at close, both found by
  a fresh-context review of this file: a round-4 item marked resolved with the claim that the pinned
  exception count was corrected *"in all three places"* while `:591`, `:593` and `:1097` still said
  **20** — the shipped `UNPAIRED_CHROMATIC_TEXT` list has **18**, verified; and the Completion Notes'
  *"43 tests"* against a file at **48**. Round 4's deferred entry also cited `DARK_VARIANT` at
  `:436`, which is inside `walkJsx()`; the constant is at `:533`, and that citation had already
  propagated into `deferred-work.md` and into Story 17.8's first draft before being caught.
