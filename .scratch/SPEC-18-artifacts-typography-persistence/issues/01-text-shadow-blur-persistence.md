# Ticket SPEC-18-01 — Text Shadow Blur Schema, Serialization, and Multi-Surface Persistence

**Status:** ready-for-agent

## Description

Add end-to-end persistence for the `shadowBlur` value (0–20). Currently, only boolean `textShadow` is stored, causing any customized blur value to revert to the default (4) upon reload.

## Requirements

1. **Go Schema & Validator (`internal/plan/validate_artifact.go`)**:
   - Add `"textShadowBlur"` to `allowedStyleKeys`.
   - In `parseStyle`:
     ```go
     if v, ok := obj["textShadowBlur"]; ok {
         n, err := asNumber(v, label+".textShadowBlur")
         if err != nil {
             return nil, err
         }
         if n < 0 || n > 20 {
             return nil, failf("%s.textShadowBlur must be 0..20", label)
         }
         style["textShadowBlur"] = math.Round(n)
     }
     ```

2. **TypeScript Types (`src/lib/registry/types.ts`)**:
   - In `TextStyle`, add `textShadowBlur?: number;`.

3. **Serialization & Deserialization (`src/lib/registry/canvas-utils.ts` & `ArtifactEditor.tsx`)**:
   - In `src/lib/registry/canvas-utils.ts` `serializeTextStyle`:
     When `textObj.shadow` is truthy, serialize `style.textShadowBlur = Math.max(0, Math.min(20, Math.round(shadowBlur)))`.
   - In `src/components/admin/ArtifactEditor.tsx`:
     - In `elementToFabricObject`:
       ```typescript
       const blur = typeof style?.textShadowBlur === 'number' ? style.textShadowBlur : 4;
       ...(style?.textShadow ? { shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.8)', blur, offsetX: 2, offsetY: 2 }) } : {}),
       ```
     - In `syncSelection`: sync `setShadowBlur` from `selectedText.shadow.blur`.

4. **Multi-Surface Rendering (`ArtifactSlide.tsx` & `pptx-draw.ts`)**:
   - In `ArtifactSlide.tsx`: use `textShadow: style?.textShadow ? `2px 2px ${style.textShadowBlur ?? 4}px rgba(0, 0, 0, 0.8)` : undefined`.
   - In `pptx-draw.ts`: use `blur: typeof style?.textShadowBlur === 'number' ? style.textShadowBlur : 3`.

5. **Automated Tests**:
   - Add unit tests in `tests/artifact-editor-controls.test.mjs` verifying blur serialization and Go validation.

## Acceptance Criteria
- Setting shadow blur to custom values (e.g. 10 or 18) persists through Save and reload.
- Slideshow proyektor and PPTX export reflect the stored blur value.
- Unit and backend validation tests pass.
