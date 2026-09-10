---
type: flow
component: registry
lc: LC-15
created: 2026-08-21
---

# Flow — Canvas authoring controls

## Source of truth

As-built, shipped in wave W3. DEC-004 § *Registry UI (product expectations)* named these three as gaps
against the as-built canvas: *"insert image, explicit layer order, bold/italic/(underline) controls."*
The persistence for all of them already existed — `imageRef` and `zIndex` in `allowedElementKeys`,
`fontWeight` and `fontStyle` in `allowedStyleKeys` (`internal/plan/validate_artifact.go`). Only the UI
was missing, so nothing here widens the payload.

The canvas surface itself is `01-ux/`'s to describe and is not written here. This flow records the three
behaviours that reach persistence, because that is LC-15's boundary.

## Insert image

An image element is added with its own geometry box carrying `imageRef`, placed with the same cascade
offset the existing text and shape inserts use. The file arrives through the existing upload path
(`src/components/ImageUploadField.tsx`, `POST /api/upload`); no new endpoint exists.

**Deleting the element never deletes the file.** Images are shared by reference (DEC-004 § *Copy /
paste*), so one binary may back an element on the spine, an element inside an Announcement Set, and a
copy of either. `tests/copy-paste-share-by-reference.test.mjs` pins this.

The consequence, recorded rather than solved: an upload whose slide is never saved leaves an
unreferenced file, and nothing reclaims it. DEC-004 defers the orphan-purge Admin tool, so there is no
owner for that file today — **OQ-43**.

## Explicit layer order

Bring forward, send backward, bring to front, send to back, on the selected element. They rewrite
`zIndex`, and the rule governing when that write happens is LC-15's persistence invariant, stated there
rather than repeated here: `zIndex` persists **only on a real reorder of existing elements**.

## Bold and italic

Toggles writing `fontWeight` and `fontStyle`, and both are written **only when the operator sets them**.
`ArtifactEditor.tsx` records why at the construction defaults: Fabric dies in `Cache.getFontCache` when
`fontStyle` is undefined, and every shipped seed element omits it — so writing the key unconditionally
would rewrite every seed layout's payload on first save. `serializeTextStyle`'s `setIfMeaningful`
discipline governs, and AC-04 in `tests/artifact-editor-controls.test.mjs` pins it: a seed layout opened
and saved without touching a style control produces no new style keys.

**Underline is not available**, and this is a deliberate absence rather than an oversight.
`textDecoration` is absent from `allowedStyleKeys`, so a control for it could not survive a save — the
server would reject the payload. Adding it is a spine-level change to the allowed style keys plus both
render paths (PPTX and projector), which no wave has taken. **OQ-41**.

## Presentation view auto-shrink and PPTX 0.75 pt/px equivalence

### Typography scale and PPTX equivalence (0.75 pt/px)

The web reference canvas is authored in CSS pixels on a 960 × 540 viewport (16:9 aspect ratio). PowerPoint and Office Open XML decks measure slide dimensions in inches and typography in typographic points (`1 in = 72 pt`). Standard 16:9 presentation slides are 10 in × 5.625 in (720 pt × 405 pt).

The exact conversion factor is:
$$\text{Ratio} = \frac{405\text{ pt}}{540\text{ px}} = 0.75\text{ pt/px}$$

A font size authored as 50px on canvas maps to $50 \times 0.75 = 37.5\text{ pt}$ in PowerPoint. In both coordinate spaces, the text glyphs occupy exactly $50 / 540 = 9.259\%$ of the total slide height. Visual proportions are 100% physically identical.

### Auto-shrink policy in presentation and export

To guarantee that worship lyrics and titles never spill outside the projector frame during live services, presentation and export maintain an automated shrink-to-fit safeguard:
- **Web presentation view (`ArtifactSlide.tsx`)**: Uses `largestFittingTextScale` with CSS container queries (`cqh`) and `ResizeObserver`. If rendered text content height exceeds its bounding box (`w` × `h`), the slide renderer auto-scales `--fit-scale` downwards (quantized by 0.05 steps) so all lines fit within the box.
- **PPTX export (`src/lib/pptx-draw.ts`)**: Runs `estimateTextFitScale(element)` from `render-model.ts`, reducing font point size when line breaks or text length exceed the container.

This auto-shrink safeguard remains active as a projection floor for un-resaved legacy templates, pre-save states, or intentionally constrained text boxes. For newly authored or saved templates, save-time auto-sync ensures the container accommodates the text directly.

Under SPEC-21, off-canvas element geometry (bleeding past the right or bottom edges, e.g. `x + w > 100`) is permitted and preserved without bounding box boundary clamping, matching PowerPoint and Presentation View behavior where off-canvas content is naturally clipped by the 16:9 stage's `overflow: hidden`.

### Canvas overflow feedback, typography parity & WYSIWYG auto-sync

In `ArtifactEditor.tsx`, `fabric.Textbox` renders text unconstrained at full authored font size with whole-word wrapping (`splitByGrapheme: false`) and unified `TEXT_LINE_HEIGHT = 1.2`, maintaining parity with CSS `whiteSpace: 'pre-wrap'` and PPTX. Under SPEC-20 and SPEC-21, `serializeCanvas` automatically synchronizes textbox bounding box height `h` (and width `w` expansion if unresized) upon save to encapsulate the rendered text lines (`h = Math.max(source.h, measuredTextHeightPct)`). True WYSIWYG parity is achieved automatically in Presentation View and PPTX export without requiring manual box handle stretching. The legacy manual warning badge (`⚠️ Text exceeds box bounds; presentation and PPTX will auto-shrink text to fit.`) is retired in favor of automatic bounding box synchronization.

### PPTX zero-margin container & Canvas line-break authority (SPEC-22 & SPEC-23)

Under SPEC-22 and SPEC-23, PPTX export and downstream office suites (Microsoft PowerPoint and LibreOffice Impress) achieve exact line-wrap and glyph parity with the Canvas editor and Web Presenter:
- **Zero-margin text container (`margin: 0`)**: `pptx-draw.ts` explicitly sets `margin: 0` on `slide.addText` in all artifact rendering paths. This eliminates PowerPoint's default 0.2" horizontal margin insets (`[0.05", 0.1", 0.05", 0.1"]`), ensuring the effective wrap column width matches the Web Canvas and Presenter 100% element content width.
- **Canvas soft-wrap snapshot (`wrapLines`)**: At save time, `serializeCanvas` inspects Fabric's authoritative word-wrapped layout (`(obj as any).textLines`) and persists the resulting string array as `wrapLines` on `CanvasElement`. Legacy templates without `wrapLines` continue to render with best-effort line wrapping.
- **Longest-word metric slack invariant (`WRAP_SLACK_RATIO = 1.02`) (SPEC-23)**: Fabric calculates width by summing un-kerned character advances. At column boundaries, shaped runs in LibreOffice or Chromium may differ by ~1%. `serializeCanvas` widens textbox `w` to enforce a 2% metric slack floor over `longestWordPx` (`applyWrapSlack`), eliminating character-splitting mid-word breaks (`internationa` / `l community`) at column boundaries.
- **Two enforcement points**:
  1. *Authoring/Persist*: `serializeCanvas` widens `w` to `longestWordPx * WRAP_SLACK_RATIO`.
  2. *Export Fit*: `estimateTextFitScale` in `render-model.ts` checks `contentWidth: longestWordPx`, shrinking any element the operator manually narrowed below its longest word.
- **Web font readiness gate**: `document.fonts.ready` gates Fabric object construction and canvas serialization in `ArtifactEditor.tsx`, while `document.fonts.load()` gates newly selected font families before marking canvas dirty. `ArtifactSlide.tsx` listens to `loadingdone` to re-trigger container fit scaling when web fonts finish downloading.
- **OOXML paragraph break fidelity**: Soft-wrapped lines from `wrapLines` emit as `<a:br/>` inside a single `<a:p>` paragraph with `softBreakBefore: true`, while operator newlines (`\n`) emit separate `<a:p>` paragraphs with `breakLine: true`. An archive post-processor stamps `<a:normAutofit fontScale="100000"/>` and explicit `TEXT_LINE_HEIGHT = 1.2` line spacing.
- **PPTX font naming & substitution rules**: PPTX carries font family names, not embedded binaries. 10 universal system fonts are marked `pptxSafe: true`. The 35 web-hosted fonts declare categorized safe substitutes (sans/display → Arial, serif → Times New Roman, script → Georgia), and the editor presents an inline warning in the font picker.
- **Measurement healing pass**: Unmeasured templates are automatically measured on open in the editor or via bulk re-measure (`admin.artifacts.remeasureAll`). In healing mode, `h`, `zIndex`, `x`, `y`, `content`, and `style` remain byte-identical.



## What an operator sees when a save is refused

The five lanes for the underlying route are `02-contracts/01-artifacts.md`'s, not restated here. The one
canvas-specific case: a payload carrying a key outside `allowedElementKeys` or `allowedStyleKeys` is
rejected whole, and the editor surfaces the server's message against the named element rather than a
bare failure — the same posture the layout trio takes for a background image on `verse`/`reff`
(`02-contracts/02-song-set-entries.md`).
