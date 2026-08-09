/**
 * Hold the app shell at literal black while a full-screen projected surface is
 * on screen, and hand it back when the last one leaves.
 *
 * Both `/services/[id]/present/projector` and `/services/[id]/slideshow` are
 * `fixed inset-0` surfaces that must never scroll, and the app shell paints
 * `body` with the theme background — `globals.css` has `body { bg-background }`.
 * It also sets `scrollbar-gutter: stable` on `html`, which is right for the app
 * (a run sheet growing past the fold must not shift while an operator scans it)
 * and wrong here: the reserved gutter means `fixed inset-0` sizes to the
 * viewport *minus* that gutter, so the page underneath shows as a strip down the
 * edge — on the projector, in front of the congregation.
 *
 * This lived inside `ProjectorClient` until 2026-07-31, and the slideshow — the
 * same `fixed inset-0` pattern at an equally room-facing URL — had no reset at
 * all. That was survivable while the strip was permanently white: it was wrong,
 * but it was not *variable*. Story 17.1 gives the operator a theme, and
 * next-themes syncs across same-origin windows on the `storage` event, so
 * without this the strip would follow the operator's choice live, mid-service.
 *
 * The colour is the literal `#000000` these surfaces already paint themselves,
 * never a theme token — `tests/theme-chrome.test.mjs` asserts that too, because
 * a token here would reintroduce exactly the leak this closes.
 *
 * **It is reference-counted, and that is not speculative.** A snapshot-and-
 * restore that assumes one consumer breaks as soon as there are two: the second
 * claim would snapshot the first claim's `#000000`, and the first release would
 * then restore black to the operator's whole app shell permanently. Story 17.1
 * already doubled the callers from one to two. Story 17.7 put a server-rendered
 * route-group shell over those URLs; this claim remains the hydrated defence.
 * Only the first claim for a document snapshots and only its last release restores.
 *
 * It lives apart from the `useProjectedShell` hook because none of this is
 * React: it is a DOM mutation with a lifetime, so it is testable with a document
 * stub in the `node:test` harness. It is hydrated defence only; a Server
 * Component cannot access `document`, so the projected root layout owns the
 * server-rendered first paint separately.
 */

/**
 * The subset of `document` this needs — so a test can pass a plain object.
 *
 * Named properties rather than `Record<string, string>`: a real
 * `CSSStyleDeclaration` has no index signature, so the broad form made
 * `claimProjectedShell(document)` a type error at the one call site that matters.
 */
type ClaimedProperty = 'overflow' | 'scrollbarGutter' | 'backgroundColor';

type ClaimedStyle = { [K in ClaimedProperty]: string };

export type ShellDocument = {
  documentElement: { style: ClaimedStyle };
  body: { style: ClaimedStyle };
};

/** The five properties claimed, snapshotted and restored as one unit. */
const CLAIMED: ReadonlyArray<
  readonly ['documentElement' | 'body', ClaimedProperty, string]
> = [
  ['documentElement', 'overflow', 'hidden'],
  ['body', 'overflow', 'hidden'],
  ['documentElement', 'scrollbarGutter', 'auto'],
  ['documentElement', 'backgroundColor', '#000000'],
  ['body', 'backgroundColor', '#000000'],
];

type ClaimState = {
  doc: ShellDocument;
  claims: number;
  restore: (() => void) | null;
  generation: number;
};

const claimStates = new WeakMap<ShellDocument, ClaimState>();
const activeStates = new Set<ClaimState>();

/**
 * Each document carries its own generation, captured by each release closure.
 *
 * Without it, `resetProjectedShellForTest()` zeroed claim counts while leaving
 * already-issued releases live, and a stale one then took `claims` to **-1** —
 * after which later claims skipped the whole `claims === 0` block and the
 * shell kept `background: white` and `scrollbar-gutter: stable` for the rest of
 * the process. Driven against the real module, that is exactly what happened.
 * Unreachable from app code, where each closure decrements once behind its own
 * `released` flag; the live exposure was a future test that claims without
 * releasing and silently wedges every test after it — in the module AD-24 names
 * as the room-facing surface's closure mechanism.
 */

/**
 * Claim the shell. Returns the release function; call it exactly once per
 * claim. Safe to nest and to interleave — React's StrictMode double-invoke in
 * development is one such interleaving.
 */
export function claimProjectedShell(doc: ShellDocument): () => void {
  let state = claimStates.get(doc);
  if (!state) {
    state = { doc, claims: 0, restore: null, generation: 0 };
    claimStates.set(doc, state);
  }
  const era = state.generation;
  if (state.claims === 0) {
    const previous = CLAIMED.map(
      ([element, property]) => doc[element].style[property] ?? ''
    );
    for (const [element, property, value] of CLAIMED) {
      doc[element].style[property] = value;
    }
    state.restore = () => {
      CLAIMED.forEach(([element, property], i) => {
        doc[element].style[property] = previous[i];
      });
    };
    activeStates.add(state);
  }
  state.claims += 1;

  let released = false;
  return () => {
    // A release from before a reset belongs to a shell that no longer exists.
    if (released || era !== state.generation) return;
    released = true;
    // Floored so the counter cannot go negative and permanently disable the
    // `claims === 0` block — the state in which a projected surface stops
    // blacking out the shell at all.
    //
    // Belt to the generation token's braces, and stated as such: with `era`
    // checked above there is no longer a public path that reaches a negative
    // count, so removing this line alone keeps the suite green. It is kept
    // because the class of bug is one where the symptom appears in a later,
    // unrelated test and the cause is invisible from there.
    state.claims = Math.max(0, state.claims - 1);
    if (state.claims === 0 && state.restore) {
      state.restore();
      state.restore = null;
      activeStates.delete(state);
      claimStates.delete(doc);
    }
  };
}

/**
 * Test seam: the counter is module state, so a test must be able to zero it.
 *
 * It hands the shell back first. Dropping `restore` without calling it left the
 * document black, so the next claim took the `claims === 0` path and snapshotted
 * `#000000` / `hidden` / `auto` as the state to return to — and the final release
 * then *restored black*. That is the same failure the `generation` token was
 * added for, reached the other way round: the token stops a stale release from
 * miscounting, and this stops a dropped one from poisoning the snapshot. Without
 * it the header comment above still described a reachable state.
 */
export function resetProjectedShellForTest(): void {
  for (const state of activeStates) {
    state.restore?.();
    state.claims = 0;
    state.restore = null;
    state.generation += 1;
    claimStates.delete(state.doc);
  }
  activeStates.clear();
}
