---
title: "Rundown to Service"
initiative: rundown-to-service
status: draft
created: 2026-08-18
updated: 2026-08-18
---

# PRD: Rundown to Service

## Revision History

| Date | What changed | Why | Releases affected |
|---|---|---|---|
| 2026-08-18 | This initiative was born. The `weekly-sabbath` folder was withdrawn: too global — one PRD for the whole product. This area only promises that a **Rundown becomes a Service**. FR-1, FR-2, FR-3, FR-12, FR-27. IDs were not restarted. | BIMA pattern: one PRD per functional area a reader would look for, not per product. | as-built |

## 0. Document Purpose

For the product owner and Events. States how **this week's content** enters the system. Vocabulary: `.control/product-glossary.md`.

**Not here** — Deck and PPTX generate: PRD `offline-deck`. Friday review, Run-Sheet, presenter, accounts: PRD `operator-turn`.

Source material: `prior-knowledge/_bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/prd.md` §4.1 and FR-11b. Not folded in.

UX is not rewritten here; as-built is aligned with the code, citing `prior-knowledge/_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md` (wdi-ux was not run).

## 1. Vision

Events already coordinate on Telegram. They do not want to open presentation software. This area turns that chat message into one dated Service, with lyrics resolved from the Song Book — not typed.

## 2. Target User

Primary in this area: **Events**. Secondary: the Operator who pastes a Rundown in the Hub.

### 2.1 Jobs To Be Done

- Events: send a Rundown and images like an ordinary chat; get a hymn-title read-back.
- Operator: create a Service from a form if Telegram is not used that week.

### 2.2 Non-Users

The congregation. An Admin who edits the Registry. The Operator while *presenting* (that is `operator-turn`).

### 2.3 Key User Journeys

- **UJ-1. Events send a Rundown on Telegram.** Paste text and images; picoclaw interprets; the Service is stored; a hymn-title read-back returns to the chat.

## 3. Glossary

`.control/product-glossary.md`.

## 4. Features

### 4.1 Telegram intake

**Capability:** CAP-1 — serves BG-1.

**Description:** picoclaw interprets the Rundown and calls the API. Lyric resolve is in the API (FR-2), not a web search. Realizes UJ-1. [ASSUMED: Events send text plus images to the same chat (OQ-1).]

#### FR-1: Ingest a Rundown from Telegram into a structured weekly payload

**Proof of done:** After sending a Rundown for one date, the Hub shows one Service with the same roles, times, four hymn numbers, and speaker as the text; sending the same date again updates, rather than duplicating.

#### FR-2: Validate and resolve hymns by number in the Song Book

**Proof of done:** A known number produces a title Events can match in the read-back; an unknown number does not cancel the Service — the song block is marked incomplete.

#### FR-3: Manage an announcement list that persists across weeks

**Proof of done:** Recurring items appear the next week without being uploaded again; an empty list = zero announcement slides.

#### FR-12: Correct an existing Service via Telegram

**Proof of done:** “Change the opening song to number X” updates the nearest Sabbath Service (or the named date), not a new Service.

### 4.2 Hub form

**Capability:** CAP-4 — serves BG-2. Only the promise to *create* a Service; editing an existing one belongs to `operator-turn` (FR-11).

#### FR-27: Create a Service from the Hub form

**Proof of done:** Pasting a valid Rundown produces a new Service; an existing date is not duplicated without override.

## 5. Non-Goals

- Not Deck generate, not PPTX download.
- Not presenter, not accounts.
- Not a song-search engine / Song Book upload.

## 6. Success Metrics

Events do not open the Hub to *hand over* a rundown. The hymn-title read-back catches a wrong number before Friday.

## 7. Constraints and Guardrails

Events input stays on the channel they already use. Lyrics only from the shipped Song Book. No other delta beyond the brief.

## 8. Cross-Cutting NFRs

**NFR-5** (failure is visible) binds FR-1 and FR-2. Other NFRs belong to the area that enforces them.

## 9. Assumptions

- [ASSUMED] OQ-1 — the Rundown is parseable in the same chat as the images.
