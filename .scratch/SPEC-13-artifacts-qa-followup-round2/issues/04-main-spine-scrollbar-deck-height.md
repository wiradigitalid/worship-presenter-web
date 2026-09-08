# 04: No window scrollbar, and Deck Sequence's height stops at the editor's edge

**What to build:** The Main Spine editor page shows no vertical browser-window scrollbar, and the
Deck Sequence list's own height stops exactly at the editor layer's edge (scrolling internally past
that point), instead of overshooting it.

**Blocked by:** 03

**Status:** open

- [ ] Ordinary layout work, no debugging pass needed — SPEC-12 already fixed the canvas fitting the
      viewport; this is the residual container-height chain.
- [ ] Find where the Deck Sequence list container's height is still content-sized (unbounded)
      instead of clamped to its share of the available flex space, from the route shell down.
- [ ] Fix so the Deck Sequence list scrolls internally within a fixed height, and confirm via the
      `run` skill (manual check — no browser-layout test harness exists in this repo) that the
      window itself no longer scrolls.
- [ ] Add a static structural guard for the height-clamp classes, following
      `tests/operator-shadcn-guard.test.mjs`'s class-string-assertion pattern, so a future edit
      that drops the clamp is at least flagged even without a rendering harness.
