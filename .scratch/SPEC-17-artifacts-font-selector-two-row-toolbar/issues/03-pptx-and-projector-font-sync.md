# Ticket SPEC-17-03 — PPTX Export & Projected Slideshow Font Synchronization with Automated Regressions Suite

**Status:** ready-for-agent

## Description

Ensure the font family selected in the canvas editor renders accurately in web slideshow views (`ArtifactSlide.tsx`, `ProjectorClient.tsx`) and is faithfully preserved in exported PowerPoint presentations (`pptx-draw.ts`). Run full automated regression suites and smoke tests.

## Requirements

1. **PowerPoint Export (`src/lib/pptx-draw.ts`)**:
   - Verify `resolveFontFamily(style)` in `render-model.ts` maps `style.fontFamily` to pptxgenjs `fontFace`.
   - Ensure clean fallback to `'Arial'` if undefined.

2. **Web Slideshow & Projector (`src/components/artifacts/ArtifactSlide.tsx` & `ProjectorClient.tsx`)**:
   - Ensure inline style `fontFamily: getFontStack(element.style?.fontFamily)` is applied so downloaded web fonts render correctly.

3. **Automated Verification**:
   - Update `tests/artifact-editor-controls.test.mjs` with font family persistence tests.
   - Run full suite: `npm test`, `npm run typecheck`, and `tests/smoke-spec-16.test.mjs` (or new smoke test).

## Acceptance Criteria
- Exported PPTX contains the selected font family name.
- Web projection renders with custom font families.
- All test suites green.
