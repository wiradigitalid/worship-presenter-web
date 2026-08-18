# Architecture Reviewer Gate — Current-Reality Lens (Story 17.7)

**Reviewed:** 2026-08-09
**Artifact:** `ARCHITECTURE-SPINE.md` (entire single project spine, AD-1..AD-29)
**Verdict:** **NEEDS FIXES before the Story 17.7 architecture gate closes.** The sibling-root implementation described by the amended AD-24 exists and the installed Next.js 16.2.10 build model supports it, but the spine overstates the closure guard and still contradicts its own new `[ADOPTED]` status in several surviving sections.

No critical finding was identified. Three high and two medium findings follow.

## High findings

### H1 — AD-24 claims a transitive closure that the guard does not traverse

**Disposition:** autofix in tests, with mutation proof; then keep the architecture claim.

The amended Rule says the projected render tree is closed to theme-dependent paint, operator providers, and future route files through structural discovery. Current implementation is narrower in three independently reachable ways:

1. `src/app/(projected)/layout.tsx` has a live side-effect import of `./projected.css`, but `moduleImports()` in `tests/theme-chrome.test.mjs` resolves only `.tsx`, `.ts`, `/index.tsx`, and `/index.ts`. CSS therefore never enters `projectedTree()`. A local CSS dependency can paint `var(--background)` or import operator global CSS while every claimed transitive test remains green.
2. `discoverProjectedRoutes()` deliberately recognizes `.js` and `.jsx` route special files, but `moduleImports()` cannot resolve a `.js` or `.jsx` dependency. The advertised future-file envelope and the transitive resolver have different extension domains.
3. The operator-provider assertion scans only `src/app/(projected)/layout.tsx` (and two fallback files). A projected page can import a wrapper that mounts `ThemeProvider`/`next-themes`; the dependency enters `projectedTree()`, but provider source contains no theme token the token scanner must reject. This violates the Story/spec's explicit requirement that the **transitive tree** carry no operator provider.

This is a live enforcement hole, not an editorial nuance: AD-24 makes `tests/theme-chrome.test.mjs` the mechanism that turns the rule from prose into a structural invariant. Extend the resolver/policy to cover the local runtime dependency forms it claims, and prove at least an indirect provider import and a theme-painted local stylesheet fail before reverting them. If `.js`/`.jsx` remain accepted route extensions, their local imports need the same closure.

### H2 — Four surviving passages still say AD-24 is partial after the same spine marks it adopted

**Disposition:** autofix the spine.

AD-24's own block now says Story 17.7 closed server first paint and marks the decision `[ADOPTED]`, but the rest of the same deliverable still says otherwise:

- *Consistency Conventions → Client state*: “The closure is not complete: the server's first paint ... still carries the operator's theme.”
- *Structural Seed* diagram: the Theme→Projector edge is labelled “PARTIAL: server first paint still leaks.”
- *Structural Seed* text tree: `use-projected-shell.ts` is labelled “AD-24 partial.”
- *Deferred* preface still includes “the unclosed half of ... AD-24.”

These statements are now false against `src/app/(operator)/layout.tsx`, `src/app/(projected)/layout.tsx`, and the two moved projected route owners. Leaving them makes the build substrate give two opposite answers to the next story. Remove the partial/debt language and redraw the diagram as a blocked dependency or an explicit sibling-root boundary rather than a still-live Theme→Projector leak.

### H3 — “Any later framework special file” overclaims `global-error` despite the governing spec and installed framework

**Disposition:** autofix the spine wording; do not broaden Story 17.7 implementation.

AD-24 currently says projected `not-found.tsx`, `error.tsx`, “and any later framework special file” live under the projected segment, and its closure sentence says future special-file cases are closed. The Story 17.7 contract explicitly says never to claim `global-error.tsx` coverage without implementing and proving it. Installed Next.js 16.2.10 documentation states that `global-error` is located in the root `app` directory and replaces the root layout, so it is not another route-group-local fallback. The structural helper intentionally enumerates only `page`, `layout`, `not-found`, `error`, `loading`, `template`, and `default`.

Name that exact supported set (or say “route-segment special files covered by the Story 17.7 contract”) and explicitly exclude `app/global-error.*` from the claim. This keeps the spine aligned with both the spec's `Never` clause and the installed framework rather than silently expanding the story.

## Medium findings

### M1 — AD-24 ends with an AD-15 rule that applies to registry writes, not source-tree writes

**Disposition:** autofix the spine.

“Every write into the projected tree validates under AD-15 like any other” has no enforceable meaning in the current architecture. AD-15 binds writes into the Artifact Registry and its layout/image contract; writing a route/component/CSS file into `src/app/(projected)` is a source change, not a registry persistence path and does not pass the registry validator. If the intended claim is that every registry layout rendered by projected surfaces was validated before persistence, state that. If the intended claim is test enforcement over source changes, cite the AD-24 closure guard instead. As written, the sentence joins unrelated boundaries and cannot prevent the stated divergence.

### M2 — The Stack's Node facts and “pins” wording are not current-enforceable facts

**Disposition:** autofix the spine; defer an actual runtime constraint if desired.

- The official Node.js lifecycle now records Node 20 EOL as **2026-03-24**, not 2026-04-30. Node 22 remains supported to 2027-04-30; the architectural choice of major 22 is still viable.
- `Dockerfile` (`node:22-bookworm-slim`) and CI (`node-version: '22'`) select a major line but do not enforce the table's stated `>=22.12`. `package.json` has no `engines`, as the spine itself notes, and this review process is currently running Node 24.18.0. Call 22.x the deploy/CI major instead of presenting an unenforced patch floor as a pin.
- “`package.json` pins every library row” is inaccurate for rows declared with caret ranges. The installed tree does match the listed package versions (`npm ls --depth=0 --json`: Next 16.2.10, React 19.2.4, next-themes 0.4.6, and the other listed packages), but the manifest constrains ranges for most libraries rather than pinning exact versions.
- The sentence “four rows now sit a major behind (see Deferred)” has no matching dependency/runtime entry in the current Deferred tables. Either identify those rows with a revisit owner or remove the dangling reference.

Upstream checks used: the official Node.js release/EOL pages and the npm package page for `next-themes` (which still reports 0.4.6). Installed-package fit was checked from the worktree, not inferred from upstream latest versions.

## Decision-by-decision reality sweep

| Decisions | Current-reality result |
| --- | --- |
| AD-1..AD-5 | Ratified by the monolithic App Router/API tree, PPTX path, Docker/SQLite durable-path configuration, and single `src/proxy.ts` gate. AD-4's “no deployment” statement is an owner-dated operational assertion and cannot be proven from repository contents; it is correctly presented as dated. |
| AD-6 | The `updated_at`/409 mechanism exists in service and registry layers; the spine explicitly discloses the still-bypassing paths. No new contradiction found beyond that registered gap. |
| AD-7..AD-10 | `buildSlidePlan` remains the shared surface input; image resolution, startup DDL, and the single present-channel module match the rules. AD-10 correctly discloses the missing plan identity. |
| AD-11..AD-15 | SQLite registry, two-layer seed, fat payload, uncontrolled Fabric boundary, admin route, and validator boundaries exist. Existing supersessions are stated without renumbering. |
| AD-16 | Correctly untagged as a target: no durable per-service registry snapshot exists yet, and the structural graph marks it as target. |
| AD-17..AD-18 | Implemented mechanisms and the named per-row-origin/agreement-test gaps agree with current code. |
| AD-19 | Correctly untagged/partly prospective: current `types.ts` still says Story 20.7 will widen the three entry keys. |
| AD-20..AD-21 | Ordered registry/data-version mechanisms exist and their remaining planner-choice gap is explicitly disclosed. |
| AD-22 | Correctly untagged as a future authoring/override-record decision. |
| AD-23 | One transition table is consumed by PPTX and browser presentation surfaces; no contrary transition table was found. |
| AD-24 | The sibling operator/projected roots, literal document shell, segment fallbacks, unchanged URL ownership, per-document hydrated defence, and operator-only provider are real. Findings H1-H3 and M1 prevent the architecture claim from closing as written. |
| AD-25 | Bible reconciliation exists; the song-book half is explicitly disclosed as open. No operator/admin corpus writer was found in `src/`. |
| AD-26..AD-28 | Correctly untagged as future corpus/identity/matcher decisions; current code comments and Deferred ownership agree they are not yet a shipped substrate. |
| AD-29 | Shared `PresentMessage`, projector acknowledgement, presenter evaluator, and non-persisted liveness state exist; the spine's adopted status matches current code. |

## Mechanical and installed-framework checks

- `uv run .agents/skills/bmad-architecture/scripts/lint_spine.py --workspace <architecture-workspace>`: **0 findings**.
- `npm ls --depth=0 --json`: installed versions match the package rows that the spine lists.
- Installed Next.js 16.2.10 docs confirm that multiple root layouts are created by removing top-level `app/layout` and placing root layouts in route groups; cross-root navigation is a full page load.
- Installed Next.js 16.2.10 docs also confirm `global-error` belongs in the root app directory and replaces a root layout, supporting H3.
- Current route-tree inspection finds exactly one operator root, one projected root, both unchanged room-facing URLs beneath the projected root, and no top-level `src/app/layout.tsx`.

## Gate recommendation

Apply H2, H3, and M1/M2 directly to the spine. Fix H1 in the Story 17.7 guard and record the required defect-injection RED/revert proof before retaining AD-24's broad closure language. Re-run lint and the focused `theme-chrome` suite after those changes. AD identifiers are stable; no finding requires renumbering or a new architecture decision.
