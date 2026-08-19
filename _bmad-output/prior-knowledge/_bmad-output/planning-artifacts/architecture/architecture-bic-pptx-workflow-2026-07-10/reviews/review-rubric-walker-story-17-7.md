# Architecture Reviewer Gate — Rubric Walker (Story 17.7)

**Verdict: CHANGES REQUIRED.** AD-24's Story 17.7 amendment accurately binds the implemented sibling-root mechanism and covers the delivery spec, but the full spine is not yet internally consistent: three authoritative projections still describe the just-closed server-first-paint gap as open. One enforcement claim also exceeds what the structural guard proves.

## Review scope and evidence

- Reviewed the complete `ARCHITECTURE-SPINE.md` against the Reviewer Gate good-spine checklist, with focused reconciliation against the Story 17.7 spec and current worktree.
- Deterministic lint: `uv run .agents/skills/bmad-architecture/scripts/lint_spine.py --workspace _bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10` → `ok: true`, zero findings.
- Brownfield reality checked in `src/app/(operator)/**`, `src/app/(projected)/**`, `src/lib/projected-shell.ts`, `src/lib/use-projected-shell.ts`, `tests/helpers/projected-routes.mjs`, and `tests/theme-chrome.test.mjs`.
- The implemented route split ratifies the amended decision: the operator root owns metadata/fonts/`ui_locale`/`ThemeProvider`; the projected root owns both unchanged URLs, literal server-rendered shell claims, and literal generic `not-found`/`error` fallbacks. The shared hydrated shell claim is per-document and remains below the server-first-paint owner.
- Stack rows were compared with `package.json`, `Dockerfile`, and `.github/workflows/test.yml`; the pinned package versions and Node 22 deployment/CI seed match those files.

## Findings

### HIGH — The spine simultaneously declares AD-24 closed and open

**Disposition: autofix.** Reconcile all three stale projections before finalizing this Update:

1. The **Client state** convention says, “The closure is not complete: the server's first paint on a projected route still carries the operator's theme, and Story 17.7 owns it.”
2. The first structural diagram labels the theme-to-projector edge `PARTIAL: server first paint still leaks`.
3. The structural tree calls the React binding `AD-24 partial`.

These claims contradict the Design Paradigm and AD-24's adopted Story 17.7 closure paragraph, and they contradict current code. They are load-bearing, not editorial: a builder reading the convention or structural seed can reasonably reintroduce a second first-paint mechanism or leave Story 17.7 debt open. Replace them with the closed two-layer ownership: projected root layout owns server first paint; `projected-shell.ts`/`use-projected-shell.ts` is hydrated defence only. The diagram should express that theme-to-projected paint is forbidden/absent, not draw an apparent dependency while calling it closed.

### MEDIUM — AD-24 assigns source-tree writes to the registry validator

**Disposition: autofix.** Remove or restate the sentence, “Every write into the projected tree validates under AD-15 like any other.” AD-15 binds writes into the **Artifact Registry**, hydration, and renderers; it cannot validate a source-file write under `src/app/(projected)`. If the intended claim is that registry-derived data reaching a projected renderer remains governed by AD-15, state that direction explicitly. As written, the Rule is not enforceable and conflates two boundaries.

### MEDIUM — Future-special-file protection is broader in AD-24 than in its cited guard

**Disposition: discuss, then either strengthen the guard or narrow the enforcement claim without weakening the invariant.** AD-24 says every later projected framework special file renders **generic literal-colour output** and then cites structural discovery as the enforcement boundary. `discoverProjectedRoutes` does correctly discover `page`, `layout`, `not-found`, `error`, `loading`, `template`, and `default`; the generic/literal-black-white/scroll-safe assertions, however, are explicit only for today's `not-found.tsx` and `error.tsx`. A future `loading.tsx` or `template.tsx` with arbitrary literal colours or sensitive copy can enter the discovered tree and pass the theme-token/edge/import guards. Structural discovery therefore proves inclusion and rejection of theme-dependent paint, not the whole generic black/white fallback rule. Preserve the product invariant, but make the test/documented enforcement boundary honest.

## Good-spine checklist

| Criterion | Result | Notes |
| --- | --- | --- |
| Fixes the real divergence points for the level below | Pass | AD-24 fixes root ownership, storage tiers, provider placement, literal room-facing paint, fallback ownership, and hydrated defence. |
| Every Rule is enforceable and prevents its stated divergence | Needs change | AD-24 is enforceable in its core; the AD-15 source-tree sentence is a category error and future-special-file enforcement is overstated. |
| Deferred contains no silent divergence point | Pass | Operational/environmental gaps and story-owned implementation choices have owners and revisit conditions; Story 17.7's closed shell debt should remain removed. |
| Named technology is current/reality-checked | Pass | Story 17.7 binds installed Next 16.2.10 and the successful build; stack pins mirror current repository declarations. |
| Ratifies brownfield code rather than contradicting it | Needs change | AD-24 itself ratifies the worktree; the Client-state convention and Structural Seed contradict that reality. |
| Covers the driving spec capabilities | Pass | Both unchanged URLs, sibling roots, literal shell, scoped fallbacks, provider isolation, structural discovery, and per-document hydrated defence are represented. |
| Does not weaken an inherited spine | Pass | This is the single initiative spine; AD-24 was amended in place with stable ID and does not weaken AD-5, AD-7, AD-10, AD-15, or AD-23. |
| Every initiative-altitude dimension is decided/deferred/open | Pass | Deployment, operations, recovery, performance, secrets, fonts, tenancy, accessibility, and pushed-down schema/UX calls are explicitly covered. |

## Gate recommendation

Apply the two clear documentation fixes, choose a truthful future-special-file enforcement boundary, rerun deterministic lint, and send the corrected full spine through the configured reviewer lenses. No new AD is needed; this is reconciliation within stable AD-24.
