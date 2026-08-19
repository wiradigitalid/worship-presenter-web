---
title: "Rundown to Service"
initiative: rundown-to-service
status: draft
created: 2026-08-18
updated: 2026-08-19
---

# PRD: Rundown to Service

## Revision History

| Date | What changed | Why | Releases affected |
|---|---|---|---|
| 2026-08-18 | This initiative was born. The `weekly-sabbath` folder was withdrawn: too global — one PRD for the whole product. This area only promises that a **Rundown becomes a Service**. FR-1, FR-2, FR-3, FR-12, FR-27. IDs were not restarted. | BIMA pattern: one PRD per functional area a reader would look for, not per product. | as-built |
| 2026-08-19 | Current intake is the Operator in Hub (FR-27), not Events on Telegram. Hymn resolve and the announcement list stay. Telegram via picoclaw (FR-1, FR-12) remains in this PRD as the last-phase capability, not a second PRD. | Web is cheaper and easier to stabilize first; Events are skipped this phase; `FR-N` must not move between PRDs. | as-built · later |

## 0. Document Purpose

For the product owner and the Operator. States how **this week's content** enters the system. Vocabulary: `.control/product-glossary.md`.

**Not here** — Deck and PPTX generate: PRD `offline-deck`. Friday review of an existing Service, Run-Sheet, presenter, accounts: PRD `operator-turn`.

Source material: brief 2026-08-19 intake recut; `requirements.yaml`. Old epic/PRD numbers map in the `operator-turn` addendum (DEC-001).

## 1. Vision

The Operator logs into Hub, enters a Rundown, and gets one dated Service with lyrics resolved from the Song Book — not typed, not copied from last week's file. Later, Events send that Rundown on Telegram and picoclaw fills the same Service; that path is last-phase, not this work.

## 2. Target User

Primary in this area: **Operator**. Secondary (later): Events.

### 2.1 Jobs To Be Done

- Operator: log in, create this week's Service from a Rundown paste or form, see hymn titles resolved from numbers.
- Later — Events: send a Rundown and images like an ordinary chat; get a hymn-title read-back; correct a song without opening Hub.

### 2.2 Non-Users

The congregation. An Admin who edits the Registry. The Operator while *presenting* (that is `operator-turn`). Events **this phase** — they do not hand over a Rundown yet.

### 2.3 Key User Journeys

- **UJ-5. Operator creates a Service in Hub.** Log in; paste or fill a Rundown; a dated Service is stored; hymn numbers show titles from the Song Book.
- **UJ-1. Events send a Rundown on Telegram.** Later. Paste text and images; picoclaw interprets; the Service is stored; a hymn-title read-back returns to the chat.

## 3. Glossary

`.control/product-glossary.md`.

## 4. Features

### 4.1 Hub form — this phase

**Capability:** CAP-1 — serves BG-1.

**Description:** The Operator creates a Service in Hub. Lyric resolve is in the API (FR-2), not a web search. Realizes UJ-5.

#### FR-27: Create a Service from the Hub form

**Proof of done:** After the Operator pastes a valid Rundown for one date, the Hub shows one Service with the same roles, times, four hymn numbers, and speaker as the text; an existing date is not duplicated without override.

#### FR-2: Validate and resolve hymns by number in the Song Book

**Proof of done:** A known number produces a title the Operator can match on the form; an unknown number does not cancel the Service — the song block is marked incomplete.

#### FR-3: Manage an announcement list that persists across weeks

**Proof of done:** Recurring items appear the next week without being uploaded again; an empty list = zero announcement slides.

### 4.2 Telegram intake — last phase

**Capability:** CAP-11 — serves BG-1.

**Description:** picoclaw interprets the Rundown and calls the API. Not this phase's work. Realizes UJ-1.

#### FR-1: Ingest a Rundown from Telegram into a structured weekly payload

**Proof of done:** After sending a Rundown for one date, the Hub shows one Service with the same roles, times, four hymn numbers, and speaker as the text; sending the same date again updates, rather than duplicating.

#### FR-12: Correct an existing Service via Telegram

**Proof of done:** “Change the opening song to number X” updates the nearest Sabbath Service (or the named date), not a new Service.

## 5. Non-Goals

- Not Deck generate, not PPTX download.
- Not presenter, not accounts.
- Not a song-search engine / Song Book upload.
- Not Events using Hub this phase.

## 6. Success Metrics

The Operator creates the week's Service in Hub without assembling PowerPoint. A wrong hymn number is visible on the form before Friday. Events are not required for a Service to exist.

Counter-metric: treating the existing webhook as this phase's handover path.

## 7. Constraints and Guardrails

Current intake is the logged-in Hub. Telegram and picoclaw MUST NOT be scheduled as this phase's work. Lyrics only from the shipped Song Book.

## 8. Cross-Cutting NFRs

**NFR-5** (failure is visible) binds FR-27 and FR-2 this phase, and FR-1 when CAP-11 ships. Other NFRs belong to the area that enforces them.

## 9. Assumptions

- [ASSUMED] OQ-17 — the Operator has this week's Rundown content in time to enter it in Hub.
- [ASSUMED] OQ-1 — when CAP-11 ships, Events still send Rundowns in a parseable form. Parked on the later capability; it does not gate Hub intake.
