# Ticket SPEC-17-01 — 45-Font Catalog Definition, Web Font Embeds, and Fallback Stacks

**Status:** ready-for-agent

## Description

Define a rich, curated catalog of 45 high-utility presentation fonts across 5 categories in `src/lib/registry/font-catalog.ts`, providing web font loading configurations and CSS fallback chains. Embed Google Fonts stylesheets in `spa/index.html` and `spa/projected.html`.

## Requirements

1. **Create `src/lib/registry/font-catalog.ts`**:
   - Define type `FontCategory`: `'system'` | `'sans'` | `'serif'` | `'display'` | `'script'`.
   - Define interface `FontDefinition`:
     ```typescript
     export interface FontDefinition {
       family: string;
       label: string;
       category: FontCategory;
       fallback: string;
       googleFont?: string; // Query parameter name if loaded from Google Fonts
     }
     ```
   - Export array `FONT_CATALOG: FontDefinition[]` containing all 45 curated fonts:
     - **System Safe (10)**: Arial, Calibri, Aptos, Segoe UI, Verdana, Trebuchet MS, Tahoma, Georgia, Times New Roman, Garamond.
     - **Modern Sans-Serif (12)**: Inter, Roboto, Open Sans, Lato, Montserrat, Poppins, Nunito, Raleway, Oswald, Barlow Condensed, DM Sans, Work Sans.
     - **Dignified Serif (8)**: Merriweather, Playfair Display, Lora, Cinzel, Cormorant Garamond, PT Serif, EB Garamond, Baskervville.
     - **Bold Display (8)**: Bebas Neue, Anton, League Spartan, Righteous, Teko, Abril Fatface, Alfa Slab One, Russo One.
     - **Script & Handwriting (7)**: Great Vibes, Pacifico, Caveat, Dancing Script, Sacramento, Shadows Into Light, Satisfy.
   - Export helper `getFontStack(family: string): string`.
   - Export `DEFAULT_FONT_FAMILY = 'Arial'`.

2. **Web Font Loading**:
   - In `spa/index.html` and `spa/projected.html`, add `<link rel="preconnect" href="https://fonts.googleapis.com">`, `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`, and Google Fonts stylesheet link with `display=swap` covering the non-system fonts.

3. **Automated Unit Tests**:
   - Create `tests/artifact-font-catalog.test.mjs` verifying catalog completeness, count, unique families, categories, and fallback helper.

## Acceptance Criteria
- Exactly 45 fonts declared in catalog.
- Web fonts embedded in SPA HTML templates.
- `tests/artifact-font-catalog.test.mjs` passes.
