---
review: two-compliant-units
scope: entire-architecture-spine
focus: Story 17.7 / AD-24 route-group closure
date: '2026-08-09'
verdict: needs-fixes
---

# Reviewer Gate — Two Compliant Units

## Verdict

**Needs fixes.** AD-24 now fixes the main route-group boundary, but the spine still contains one direct lifecycle contradiction and four places where two builders could make incompatible choices while reasonably believing they followed the document.

## Findings

### HIGH — The convention table still says the shell closure is unbuilt

**Evidence:** AD-24 is `[ADOPTED]` and its closing note says Story 17.7 closed server first paint, Server-Component branches, framework fallbacks, and future special files. The structural graph and source tree also describe the projected root as the first-paint owner. The **Client state** convention still says: “The closure is not complete: the server's first paint on a projected route still carries the operator's theme, and Story 17.7 owns it.”

**Divergence:** A builder following AD-24 will place new room-facing work under `(projected)` and treat first paint as structurally closed. A builder following the convention table can reasonably preserve the old hook-first model or reopen Story 17.7 as unfinished. Both passages are normative summaries in the same spine.

**Disposition:** **Autofix.** Replace the final Client-state sentence with the adopted rule: projected first paint belongs to the sibling projected root; client shell claims are hydrated defence only.

### HIGH — “Supported route special file” has no closed meaning, while the asserted guard does

**Evidence:** AD-24 says any later “supported route special file” enters the guard structurally and that adding a projected special file needs no leaf-inventory edit. The actual authority in `tests/helpers/projected-routes.mjs` recognizes exactly `page`, `layout`, `not-found`, `error`, `loading`, `template`, and `default`. Installed Next 16.2.10 also documents `global-error`, `forbidden`, `unauthorized`, and `route` special files. AD-24 explicitly excludes only `global-error`; it neither includes nor excludes the other names. The Story 17.7 contract is narrower and explicitly names the seven guarded forms.

**Divergence:** One builder can read “supported” as the seven Story 17.7 forms and add `forbidden.tsx` outside the guard. Another can read it as every Next-recognized special file and modify the helper before adding the same file. Both obey a plausible reading of the spine, but only one change set is actually guarded.

**Disposition:** **Autofix.** Name the seven structurally guarded forms in AD-24, state that another framework basename requires a same-change guard extension, and retain the explicit `global-error.tsx` non-claim. Do not broaden Story 17.7 retroactively.

### MEDIUM — The first-paint and fallback invariants name properties, not their values

**Evidence:** AD-24 requires literal `html`/`body` background, overflow, and scrollbar-gutter “claims,” and generic literal-colour fallbacks. It does not bind the five adopted values or the scroll-safe fallback behavior. The implemented contract is stricter: `html` background `#000000`, overflow `hidden`, scrollbar gutter `auto`; `body` background `#000000`, overflow `hidden`; fallbacks use `#000000`/`#FFFFFF` and vertical scrolling.

**Divergence:** Two new projected shells can choose `overflow: clip` versus `hidden`, `scrollbar-gutter: stable` versus `auto`, or a fixed non-scrollable error card versus a scroll-safe fallback. Each satisfies the spine's current wording (“literal” and “generic”) but produces materially different first-paint and failure behavior.

**Disposition:** **Autofix.** Bind the five shell values and the fallback's literal-white, vertical-scroll requirement in AD-24, or explicitly make the corresponding structural guard the named executable authority for those exact values.

### MEDIUM — The structural graph still draws the dependency AD-24 forbids

**Evidence:** AD-24 states that projector, slideshow, and PPTX never read persisted-local theme state. The Structural Seed still contains a directed edge `Theme -.-> Projector`, labelled as “closed.” A labelled edge remains a dependency in the diagram even when its prose says the dependency is neutralized.

**Divergence:** One builder can implement strict non-reachability from theme to projected output. Another can retain a theme read and normalize the resulting paint, citing the diagram's Theme-to-Projector path and its “closed” label. Those architectures differ on the exact structural channel AD-24 exists to eliminate.

**Disposition:** **Autofix.** Remove the Theme-to-Projector edge. Draw operator theme only into the operator root, and show the projected root as an independent literal shell with no incoming theme edge.

### MEDIUM — Future room-facing route ownership is implied but not stated as a classification rule

**Evidence:** AD-24 says the projected root owns the two current room-facing URLs and binds every full-screen room-facing surface. It does not directly say that every future browser room-facing route must be placed under `(projected)`. The guard starts its closure walk from files already under `(projected)`, so it cannot identify a new room-facing page mistakenly created under `(operator)`.

**Divergence:** One feature team can classify a new congregation-facing browser surface into `(projected)`. Another can place it under `(operator)` and locally apply literal paint/use the shell hook. The latter can satisfy the leaf-level paint language while losing the route group's server-first-paint guarantee.

**Disposition:** **Autofix.** Add the classification rule: every browser route whose primary audience is the room/congregation belongs to `(projected)`; operator controls and previews belong to `(operator)`. A new exception requires an architecture update.

## Whole-spine pass

The remaining ADs expose their deliberate gaps as “Not yet closed,” Deferred items, or story-owned physical choices. I found no additional unacknowledged cross-unit fork at initiative altitude that outranks the five findings above. AD-5/AD-14 authorization, AD-7/AD-12 plan ownership, AD-10/AD-29 sync direction, AD-17/AD-21 bootstrap and migration order, and AD-25..AD-28 corpus ownership remain mutually discriminating rather than silently optional.
