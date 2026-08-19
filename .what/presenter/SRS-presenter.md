---
type: srs
component: presenter
status: draft
created: 2026-08-18
updated: 2026-08-19
satisfies: [FR-15, FR-16, FR-19, FR-22]
reviewed:
  date: '2026-08-19'
  sha: '02f8d3a124a8c4d4e266ec005f8fc0495879914e'
  lenses: [structure, prose, edge-case-hunter]
---

# SRS — Presenter

## Decision Summary · [G3]

Presenter is the Sabbath turn in the browser: slideshow, two screens, on-demand verse. The offline guarantee remains PPTX (Hub UC-18).

## Why · [G3]

The Operator needs a control screen separate from what the Congregation sees. That is not Hub (prep) and not Registry (structure).

## Actor Register · [G3]

| Actor | Who they are | What they may do |
| --- | --- | --- |
| Operator | On-duty at the venue laptop | Slideshow, presenter, projector, verse |
| Congregation | Screen audience | Do not open this surface |

## UC Catalogue · [G3]

| id | Use case | Actor | Satisfies | critical |
| --- | --- | --- | --- | --- |
| UC-11 | I present a fullscreen slideshow | Operator | FR-15 | no |
| UC-12 | I run the two-screen presenter | Operator | FR-16 | no |
| UC-13 | I display an on-demand verse on the projector | Operator | FR-19, FR-22 | no |

## Constraints · [G3]

Operator Chrome does not reach the room screen. Source: AD-24 (adopted) in the spine.

## Non-Goals · [G3]

- Edit weekly payload — Hub.
- Change slide order live — brief Scope Out.
- Offline guarantee — Hub FR-14.

## Prerequisite · [G3]

A Service already exists. Verse overlay (FR-19) requires the two-screen presenter (FR-16).

## Success Signal · [G3]

Projector shows only slides. Blank does not itself shift Deck position. Slideshow order matches the Deck/PPTX. A verse overlay leaves the Service payload unchanged.

## Assumptions, Risks, and To Be Confirmed · [G3]

### Assumptions

PPTX remains the offline guarantee; the browser slideshow is best-effort after one Service is loaded (OQ-5).

Blank covers an open overlay; unblank reveals that overlay if it is still open. Reload of control or projector resends index, overlay, and blank (OQ-25).

Plan identity on the presenter channel stays deferred (AD-10). Empty verse reference and lookup timeout fail closed (SCN-4). No projector → refuse lookup. Missing Service or plan → return to Hub as UC-11; presenter does not open (OQ-26).

### Risks

Slideshow is mistaken for the Sabbath guarantee.

### To Be Confirmed

—

## Gate Checklist · [G3]

★ UC titles are user sentences: yes.

## Design Reference · [G3]

`.how/presenter/SDD-presenter.md`

## Slots

`mode: deep`. No `critical` UC. Rules: `02-rules/rules-presenter.md`. Domain: `03-domain/domain-model.md`, `state-machines.md`. Component flows: `04-usecases/UC-11-fullscreen-slideshow.md`, `UC-12-two-screen-presenter.md`, `UC-13-on-demand-verse.md`. Branches: `05-scenarios/SCN-4-verse-lookup-failed.md`.

## Open Items

OQ-5 · OQ-25 · OQ-26
