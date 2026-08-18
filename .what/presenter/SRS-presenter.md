---
type: srs
component: presenter
status: draft
created: 2026-08-18
updated: 2026-08-18
satisfies: [FR-15, FR-16, FR-19, FR-22]
reviewed:
  date: ''
  sha: ''
  lenses: []
---

# SRS — Presenter

## Decision Summary · [G3]

Presenter is the Sabbath turn in the browser: slideshow, two screens, on-demand verse. The offline guarantee remains PPTX (Hub UC-18).

## Why · [G3]

The Operator needs a control screen separate from what Jemaat see. That is not Hub (prep) and not Registry (structure).

## Actor Register · [G3]

| Actor | Who they are | What they may do |
| --- | --- | --- |
| Operator | On-duty at the venue laptop | Slideshow, presenter, projector, verse |
| Jemaat | Screen audience | Do not open this surface |

## UC Catalogue · [G3]

| id | Use case | Actor | Satisfies | critical |
| --- | --- | --- | --- | --- |
| UC-11 | I run a fullscreen slideshow | Operator | FR-15 | no |
| UC-12 | I run a two-screen presenter | Operator | FR-16 | no |
| UC-13 | I display an on-demand verse on the projector | Operator | FR-19, FR-22 | no |

## Constraints · [G3]

Operator Chrome does not reach the room screen. Source: forthcoming AD-24 in the spine.

## Non-Goals · [G3]

- Edit weekly payload — Hub.
- Change slide order live — brief Scope Out.
- Offline guarantee — Hub FR-14.

## Prerequisite · [G3]

Service already exists. FR-16 before FR-19.

## Success Signal · [G3]

Projector shows only slides; blank does not shift Deck position.

## Assumptions, Risks, and To Be Confirmed · [G3]

### Assumptions

OQ-5.

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

OQ-5
