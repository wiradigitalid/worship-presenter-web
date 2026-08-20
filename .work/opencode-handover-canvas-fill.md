# Task — Fix artifact editor canvas not filling its card

Repo: worship-presenter-web (this working tree). Branch: main. Public repo.

Do NOT commit `.env*`, `data/*.db*`, `.commandcode/`, `.opencode/`. Do NOT invoke WDI/BMad skills.
After tests pass: commit with a short message, push to origin/main, then deploy:
`D:\Developer\devops\applications\presenter.bic.my.id\scripts\deploy-dev.ps1`

## Bug (still broken after bfd20b1)

File: `src/components/admin/ArtifactEditor.tsx`

On the Artifacts page, the Fabric.js canvas renders **tiny in the top-left** of the black preview card. Most of the card is empty black space. Owner expects the 16:9 stage to **fill the card** (letterboxed, no scrollbars).

Screenshot symptom: ~200×100px preview in corner of a large `aspect-video` shell.

## Root cause (likely)

`fitCanvasToShell()` (~L409) uses:

```ts
canvas.setDimensions({ width: CANVAS_WIDTH * scale, height: CANVAS_HEIGHT * scale }, { cssOnly: true });
canvas.setZoom(scale);
```

`cssOnly: true` leaves Fabric's internal backing store and `.canvas-container` wrapper at 960×540 while zoom scales content — the wrapper does not expand to fill the flex shell. Combined with `setZoom`, sizing is wrong.

Also: fit may run before `aspect-video` has a computed height (height=0 → scale=0).

## Required fix

1. **Rewrite `fitCanvasToShell`** so the visible stage fills the shell:
   - Read `shell.getBoundingClientRect()` or `clientWidth`/`clientHeight` (both must be > 0; if height is 0, retry on next frame or ResizeObserver).
   - `scale = Math.min(width / CANVAS_WIDTH, height / CANVAS_HEIGHT)` — allow upscale when the card is larger than 960×540.
   - Prefer **one** scaling mechanism, not double-scale:
     - Option A (preferred): keep logical size 960×540, `canvas.setZoom(scale)`, set the **wrapper** CSS size to `CANVAS_WIDTH * scale` × `CANVAS_HEIGHT * scale` via `canvas.wrapperEl` (Fabric 6) or the `.canvas-container` element.
     - Option B: `canvas.setDimensions({ width: CANVAS_WIDTH * scale, height: CANVAS_HEIGHT * scale })` **without** `cssOnly`, and `canvas.setZoom(1)`.
   - Call `canvas.calcOffset()` after resize so hit-testing matches display.
   - Center the stage in the shell if letterboxing leaves slack (flex or margin auto on wrapper).

2. **Shell markup** (~L1637):
   - Keep `aspect-video w-full overflow-hidden rounded-2xl border bg-black/90`.
   - Ensure Fabric's auto-generated wrapper is a flex child that can be centered (`items-center justify-center` on shell).

3. **Timing**: call `fitCanvasToShell()` after Fabric mount (`mountCanvas` already calls it — keep that) AND on ResizeObserver. Add `requestAnimationFrame` retry once if height was 0 on first pass.

4. **`[general]` label**: must stay **plain bracket text**, NOT a badge/chip. Current code is correct (`<span>[{kindChipLabel(...)}]</span>`). Do not re-add badge styling.

## Do NOT change

- Sidebar compact row layout (already OK).
- Canvas coordinate system (960×540 reference); PPTX export must stay aligned.
- Dirty guard, save, mount/dispose logic.

## Tests

```bash
npm run spa:build
node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/operator-shadcn-guard.test.mjs
node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/public-repo-guard.test.mjs
```

## Done when

- Canvas visually fills the black preview card at all editor widths (no tiny corner preview).
- No horizontal/vertical scrollbars on the card.
- Tests green; committed, pushed, deployed to presenter-dev.
