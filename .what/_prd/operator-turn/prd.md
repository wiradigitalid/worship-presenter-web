---
title: "Operator Turn"
initiative: operator-turn
status: draft
created: 2026-08-18
updated: 2026-08-18
---

# PRD: Operator Turn

## Revision History

| Date | What changed | Why | Releases affected |
|---|---|---|---|
| 2026-08-18 | This initiative was born from the `weekly-sabbath` split. Area: logged-in Hub, Friday review, Run-Sheet, slideshow/presenter, on-demand verse, accounts, two language axes. FR-8…11, FR-13, FR-15…19, FR-22…25, FR-28. | A reader looking for “Friday review” or “projector screen” does not open the generate PRD. | as-built |

## 0. Document Purpose

For the **Operator** (brief primary) and account Admin. How a person runs a multimedia turn.

**Not here** — Rundown intake: `rundown-to-service`. PPTX file contents and Registry: `offline-deck`. PPTX download is promised there (FR-14); the Hub here is only the *door* to that action.

Source material: `prior-knowledge/_bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/prd.md` §4.3–4.4, §4.6–4.9, §4.11–4.12. As-built EXPERIENCE: `prior-knowledge/_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md` (cited, not copied; wdi-ux was not run).

## 1. Vision

Anyone on the rotation can review on Friday in ≤ 10 minutes and present on Sabbath, without assembling 68 slides. Logged-in Hub. In-browser Presenter is a complement; the guarantee remains the PPTX in the `offline-deck` PRD.

## 2. Target User

Primary: **Operator**. Secondary: Admin (accounts, `ui_locale`, default corpus).

### 2.1 Jobs To Be Done

- Friday review: match data, edit, regenerate, download.
- Sabbath: presenter view; on-demand verse if the speaker asks.
- Admin: per-person accounts; interface language; default corpus.

### 2.2 Non-Users

Events while *sending* a Rundown. The congregation.

### 2.3 Key User Journeys

- **UJ-2.** Friday review ≤ 10 minutes.
- **UJ-3.** Late song swap, regenerate ≤ 5 minutes.
- **UJ-4.** Presenting — PPTX (guarantee, other PRD) or browser presenter (complement).

## 3. Glossary

`.control/product-glossary.md` — Data Locale, UI Locale.

## 4. Features

### 4.1 Hub

**Capability:** CAP-3 — serves BG-2.

#### FR-8: List Services by date

**Proof of done:** Every Service is a dated entry; opening it shows data, Run-Sheet, and actions matching Role.

#### FR-9: Per-slide preview in the browser

**Proof of done:** Order matches the latest Deck; an incomplete song block is marked.

#### FR-10: Delete a Service manually

**Proof of done:** The Service disappears from the list; that week's local files disappear from `UPLOADS_DIR`; recurring announcement items (and their files) remain.

### 4.2 Edit and regenerate

**Capability:** CAP-4 — serves BG-2.

#### FR-11: Edit fields via the Hub form

**Proof of done:** Change a song number, save, the next generate uses the new number (FR-2).

#### FR-13: Regenerate in place

**Proof of done:** Swap one song, generate, download — ≤ 5 minutes.

#### FR-28: First save wins

**Proof of done:** A second edit from the same state gets a conflict error, not a silent overwrite.

### 4.3 Run-Sheet

**Capability:** CAP-7 — serves BG-2.

#### FR-17: Full worship order

**Proof of done:** The Operator follows the entire order (including roles not on slides) without opening chat.

### 4.4 Slideshow and Presenter

**Capability:** CAP-6 — serves BG-2.

#### FR-15: Full-screen slideshow

**Proof of done:** Slides, order, and transition match the PPTX; advance is linear. [ASSUMED: OQ-5 — slideshow is best-effort offline.]

#### FR-16: Dual-screen Presenter

**Proof of done:** Advancing on the Operator advances the projector; blank blacks the projector without losing position.

#### FR-19: On-demand verse

**Proof of done:** The reference appears on the projector in the chosen translation; closing returns to the Deck slide; the payload does not change.

### 4.5 Accounts

**Capability:** CAP-8 — serves BG-2.

#### FR-18: Per-person authentication, Admin and Operator

**Proof of done:** Without signing in there is no Service; Admin manages accounts; Operator review/edit/generate/download/delete/present. NFR-6.

### 4.6 Corpus and two language axes

**Capability:** CAP-10 — serves BG-2.

#### FR-22: Verses from the chosen translation

**Proof of done:** Lookup = chosen translation; an absent corpus is reported as absent.

#### FR-23: Hymns from the chosen Song Book

**Proof of done:** The same number in two books does not collide; the read-back names the book.

#### FR-24: Browse corpora by language

**Proof of done:** The picker opens the default locale and can always reach another corpus without changing settings; the list API returns all.

#### FR-25: Operator interface in the Operator's language

**Proof of done:** Change `ui_locale`; Hub labels follow; projection slides do not change.

## 5. Non-Goals

- Not a public site.
- Not `projection_locale`.
- Not a materials CMS.

## 6. Success Metrics

13 consecutive Sabbaths (brief). Friday review ≤ 10 minutes. The turn ≠ the person who can do PowerPoint.

## 7. Constraints and Guardrails

The Hub is by account. No other delta beyond the brief.

## 8. Cross-Cutting NFRs

NFR-6 binds FR-18. NFR-5 is visible on Hub edit if the parser fails.

## 9. Assumptions

- [ASSUMED] OQ-2 — one church, one flow.
- [ASSUMED] OQ-5 — slideshow is not the offline guarantee.
