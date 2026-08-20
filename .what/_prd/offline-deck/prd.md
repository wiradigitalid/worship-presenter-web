---
title: "Offline Deck"
initiative: offline-deck
status: draft
created: 2026-08-18
updated: 2026-08-20
---

# PRD: Offline Deck

## Revision History

| Date | What changed | Why | Releases affected |
|---|---|---|---|
| 2026-08-18 | This initiative was born from the `weekly-sabbath` split. Area: assemble the Deck, download PPTX, file retention, Artifact Registry. FR-4…7, FR-14, FR-20, FR-21, FR-26. | A reader looking for “the Sabbath file” or “change slide order” does not open the intake PRD. | as-built |
| 2026-08-19 | FR-5 proof names the shipped lyric join and chorus repeat. FR-21 proof names that each Announcement registry row expands the whole live list and that repeats are intended. | Those rules lived only in a G5-era spec; a later wave must project them, not invent them. | as-built · later |
| 2026-08-20 | FR-21 no longer promises that an Announcement row expands the whole live Hub list. The Registry spine may now carry any number of independent Announcement Sets, each its own authored slide sequence Admin composes directly in the Registry; copied images share one file by reference so deleting a slide never deletes an asset still used elsewhere. FR-20's shared Title/Verse/Reff trio is confirmed to cover every song-set entry, however many Admin defines — there is no fixed count of song-set rows any more. Three new promises are born: Admin defines the song-set list itself here (FR-29), an unrecognised `{token}` in authored text never stops a Deck from generating (FR-30), and Admin now maintains an image-only background library with one global default for the blank Verse/Reff canvas (FR-31). | Owner ratified DEC-004: Announcement composition and the song-set count both moved from a Hub-owned, code-fixed shape to Admin-authored structure inside the Artifact Registry. | as-built · later |

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

`.control/product-glossary.md` — Artifact Registry, Snapshot, Sync Artifact, Slide Kind, Song Set, Announcement Set, Predefined Field.

## 4. Features

### 4.1 Assemble Deck

**Capability:** CAP-2 — serves BG-1.

#### FR-4: Assemble a Deck from the fixed frame plus the weekly payload

**Proof of done:** This worship's three macro sections are present; conditional slides disappear when the payload is empty; metadata = this Service's date.

#### FR-5: Render a song block into readable lyric slides

**Proof of done:** From the pew, verse and chorus are readable; not cramped. NFR-3. Verse lines join into continuous prose (terminal punctuation → space; otherwise `"; "`). A song with at least one verse and one refrain emits Verse then Chorus after every verse. A long verse still splits when it exceeds the plan's character budget.

#### FR-6: Render non-song variable content

**Proof of done:** That week's names, verses, photos, flyers land on the right slides, in the order the Registry's Announcement Sets and Song Set entries define.

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

**Proof of done:** Change one kind's layout — including the shared Title/Verse/Reff trio that every Song Set entry uses, however many entries Admin has defined — and the next generate (new Service / after Sync) shows the new layout in PPTX and slideshow.

#### FR-21: Admin changes slide order and membership

**Proof of done:** A deleted entry is no longer live after restart; an already-created Service does not change until Sync Artifact; Sync replaces structure, Operator fields stay. Admin may add, remove, and reorder Song Set rows and Announcement Set markers on the spine like any other row — neither has a fixed count. An Announcement Set marker splices in that set's own ordered sequence of authored slides; composing, reordering, and deleting within a set happens only in the Registry, never on the Service form. A slide's image, copied between the Main spine and any Announcement Set, shares the same file by reference — deleting the slide never deletes an image another slide still uses.

#### FR-29: Admin configures the song-set list

**Proof of done:** Admin adds, renames, or removes a song-set entry (its own name and title) directly in the Artifact Registry; a Service rundown with more than four songs is a normal shape the Registry accepts, not a limit the Admin has to work around.

#### FR-30: An unrecognised predefined-field token never blocks generation

**Proof of done:** A slide authored with a `{key}` token the catalog does not recognise still generates; the token prints as empty text rather than failing the Deck. The Registry editor flags the unknown key when the slide is saved, so the typo is visible before it reaches a Service.

#### FR-31: Admin maintains the background library for Verse/Reff

**Proof of done:** Admin adds and removes images (no colours, no gradients) in a background library and names one of them the global default. A Verse or Reff slide with no background chosen for that week falls back to the global default, and with neither set renders on a blank canvas.

## 5. Non-Goals

- Not live control / reorder on stage.
- Not per-church configuration.
- Not a flyer generator.
- Browser slideshow as an offline *guarantee* (that is best-effort in `operator-turn`).

## 6. Success Metrics

Song swap + generate + download ≤ 5 minutes. Zero leftover last-week metadata.

## 7. Constraints and Guardrails

PPTX is the guarantee, not a fallback. Public repo: no congregation data in git. An image predefined field (e.g. a photo) stays its own slide element with its own box — it is never a token mixed into text. No other delta beyond the brief.

## 8. Cross-Cutting NFRs

NFR-1, NFR-2, NFR-3, NFR-4, NFR-7, NFR-8, NFR-9 — `enforced_by` in `requirements.yaml`.

## 9. Assumptions

- [ASSUMED] OQ-3 — the venue has a PPTX player.
