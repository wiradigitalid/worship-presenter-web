---
title: "Offline Deck"
initiative: offline-deck
status: draft
created: 2026-08-18
updated: 2026-08-18
---

# PRD: Offline Deck

## Revision History

| Date | What changed | Why | Releases affected |
|---|---|---|---|
| 2026-08-18 | This initiative was born from the `weekly-sabbath` split. Area: assemble the Deck, download PPTX, file retention, Artifact Registry. FR-4…7, FR-14, FR-20, FR-21, FR-26. | A reader looking for “the Sabbath file” or “change slide order” does not open the intake PRD. | as-built |

## 0. Document Purpose

For the Operator who needs the file, and the Admin who owns layout. **The Sabbath guarantee is the offline PPTX** (BG-3).

**Not here** — how a Rundown enters: `rundown-to-service`. How the Operator reviews and presents in the browser: `operator-turn`.

Source material: three area PRDs and `requirements.yaml`. Old epic/PRD numbers map in the `operator-turn` addendum (DEC-001).

## 1. Vision

A Deck is no longer a copy of last week's file. It is generated from the frame plus the Service payload, can be downloaded, and presents without venue internet. An Admin changes layout and order without waiting for a deploy — structure, not this week's content.

## 2. Target User

Primary: **Operator** (downloads). Secondary: **Admin** (Registry).

### 2.1 Jobs To Be Done

- Operator: have a complete PPTX on the laptop before Sabbath.
- Admin: change slide layout/order; a Service already reviewed does not change underneath them.

### 2.3 Key User Journeys

Does not add a new UJ. UJ-4 (brief) for *presenting* the PPTX; UJ-2 for the review that uses this file.

## 3. Glossary

`.control/product-glossary.md` — Artifact Registry, Snapshot, Sync Artifact, Slide Kind, SongSet Slot.

## 4. Features

### 4.1 Assemble Deck

**Capability:** CAP-2 — serves BG-1.

#### FR-4: Assemble a Deck from the fixed frame plus the weekly payload

**Proof of done:** This worship's three macro sections are present; conditional slides disappear when the payload is empty; metadata = this Service's date.

#### FR-5: Render a song block into readable lyric slides

**Proof of done:** From the pew, verse and chorus are readable; not cramped. NFR-3.

#### FR-6: Render non-song variable content

**Proof of done:** That week's names, verses, photos, flyers on the right slides, announcement-list order.

#### FR-7: One transition chosen by Admin

**Proof of done:** All text/graphic slides one transition; flyers with no transition.

### 4.2 Offline PPTX

**Capability:** CAP-5 — serves BG-3.

#### FR-14: Download a PPTX that presents offline

**Proof of done:** Opened with no internet, the Service is complete; the presentation app's native presenter view works. NFR-1, NFR-7.

#### FR-26: Auto-delete only expired PPTX

**Proof of done:** A Service older than the retention window (default 2 months) loses its PPTX; the row and payload remain; regenerate is still possible.

### 4.3 Artifact Registry

**Capability:** CAP-9 — serves BG-1.

#### FR-20: Admin changes slide layout

**Proof of done:** Change one kind's layout; the next generate (new Service / after Sync) shows the new layout in PPTX and slideshow.

#### FR-21: Admin changes slide order and membership

**Proof of done:** A deleted entry is no longer live after restart; an already-created Service does not change until Sync Artifact; Sync replaces structure, Operator fields stay.

## 5. Non-Goals

- Not live control / reorder on stage.
- Not per-church configuration.
- Not a flyer generator.
- Browser slideshow as an offline *guarantee* (that is best-effort in `operator-turn`).

## 6. Success Metrics

Song swap + generate + download ≤ 5 minutes. Zero leftover last-week metadata.

## 7. Constraints and Guardrails

PPTX is the guarantee, not a fallback. Public repo: no congregation data in git. No other delta beyond the brief.

## 8. Cross-Cutting NFRs

NFR-1, NFR-2, NFR-3, NFR-4, NFR-7, NFR-8, NFR-9 — `enforced_by` in `requirements.yaml`.

## 9. Assumptions

- [ASSUMED] OQ-3 — the venue has a PPTX player.
