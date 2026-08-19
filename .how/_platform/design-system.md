---
type: design-system
scope: _platform
status: draft
created: '2026-08-19'
updated: '2026-08-19'
name: Worship Presenter Web
description: Operator hub for preparing and projecting a worship service.
---

# Design system — operator chrome

Tokens and base components for Hub and Presenter **operator** surfaces. The Congregation screen is the Artifact Registry, not this file.

As-built: shadcn/ui (base-nova) + Tailwind 4. Target UI is the React SPA (DEC-003); tokens stay here. Zero brand hue in `globals.css` tokens. `wdi-ux` was not run; this file is extracted so the archive can retire (DEC-001).

## Tokens (from `src/globals.css`)

Light: background `oklch(1 0 0)`, foreground `oklch(0.145 0 0)`, primary `oklch(0.205 0 0)`, primary-foreground `oklch(0.985 0 0)`, muted `oklch(0.97 0 0)`, muted-foreground `oklch(0.543 0 0)`, border `oklch(0.922 0 0)`, ring `oklch(0.708 0 0)`, destructive `oklch(0.577 0.245 27.325)`.

Dark: background `oklch(0.145 0 0)`, foreground `oklch(0.985 0 0)`, primary `oklch(0.922 0 0)`, destructive `oklch(0.704 0.191 22.216)`.

Typography: Geist Sans / Geist Mono. Radius `--radius: 0.625rem`.

## Contrast on load-bearing combinations

Measured 2026-08-03 (Story 17.2), light theme. Reproduced from `globals.css` in `tests/theme-chrome.test.mjs`.

| Combination | sRGB | Measured | WCAG |
| --- | --- | --- | --- |
| `foreground` on `background` | `#0a0a0a` on `#ffffff` | **19.80:1** | AAA |
| `primary-foreground` on `primary` | `#fafafa` on `#171717` | **17.18:1** | AAA |
| `muted-foreground` on `background` | `#6f6f6f` on `#ffffff` | **5.02:1** | AA |
| `muted-foreground` on `muted` | `#6f6f6f` on `#f5f5f5` | **4.61:1** | AA |

Story 17.2 changed `:root --muted-foreground` from `oklch(0.556 0 0)` to `oklch(0.543 0 0)`.

#### The same four pairs in the dark palette

**Measured 2026-07-30**, same method. Story 17.1 (AC-6).

| Combination | sRGB | Measured | WCAG |
| --- | --- | --- | --- |
| `foreground` on `background` | `#fafafa` on `#0a0a0a` | **18.97:1** | AAA |
| `primary-foreground` on `primary` | `#171717` on `#e5e5e5` | **14.23:1** | AAA |
| `muted-foreground` on `background` | `#a1a1a1` on `#0a0a0a` | **7.66:1** | AAA |
| `muted-foreground` on `muted` | `#a1a1a1` on `#262626` | **5.86:1** | AA (not AAA) |

The dark palette passes all four of these pairs. The two themes hold independent `--muted-foreground` values.

Untokenized hues (amber, leftover red tints, emerald, indigo, sky) and non-text contrast (border 1.4.11) remain open debt — `_bmad-output/implementation-artifacts/deferred-work.md`. The two service forms' light-theme warning banners (`text-amber-200` / `text-red-200` on translucent fills) sit in that register; they are not a palette-token pair.

## Components

Five shadcn primitives, unmodified. Slide geometry is Registry, not a `slide-surface` CSS class.
