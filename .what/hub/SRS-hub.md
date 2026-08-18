---
type: srs
component: hub
status: draft
created: 2026-08-18
updated: 2026-08-18
satisfies: [FR-1, FR-2, FR-3, FR-7, FR-8, FR-9, FR-10, FR-11, FR-12, FR-13, FR-14, FR-17, FR-18, FR-23, FR-24, FR-25, FR-27, FR-28]
reviewed:
  date: ''
  sha: ''
  lenses: []
---

# SRS — Hub

## Decision Summary · [G3]

Hub is the Operator's door: Service list, create from Rundown, Run-Sheet, edit, generate, download PPTX, announcements, accounts, language settings. Events need not open it — they send Telegram.

## Why · [G3]

Without Hub, the multimedia turn falls back to one person assembling files. This component is the surface Operators call "the app".

## Actor Register · [G3]

| Actor | Who they are | What they may do |
| --- | --- | --- |
| Operator | Multimedia team | List, create, edit, generate, download, delete, Run-Sheet, announcements |
| Events | Rundown sender | Send Telegram (need not open Hub) |
| Admin | Account and settings manager | Accounts, transitions, locale |

## UC Catalogue · [G3]

| id | Use case | Actor | Satisfies | critical |
| --- | --- | --- | --- | --- |
| UC-1 | Events send a Rundown on Telegram and its Service appears | Events | FR-1, FR-2 | yes |
| UC-2 | I paste a Rundown in Hub and a new Service is saved | Operator | FR-27 | yes |
| UC-3 | I open the dated Service list | Operator | FR-8 | no |
| UC-4 | I follow the worship order from the Run-Sheet | Operator | FR-17 | no |
| UC-5 | I edit Service fields in Hub | Operator | FR-11 | yes |
| UC-6 | I regenerate this Service's Deck | Operator | FR-13 | no |
| UC-7 | I delete this Service and its assets | Operator | FR-10 | yes |
| UC-8 | I preview this Service's slides in the browser | Operator | FR-9 | no |
| UC-9 | I manage Operator and Admin accounts | Admin | FR-18 | no |
| UC-10 | I read Hub in my language | Operator | FR-25 | no |
| UC-17 | Events correct one song via Telegram | Events | FR-12 | yes |
| UC-18 | I download the PPTX for Sabbath | Operator | FR-14 | no |
| UC-19 | I choose one transition for the whole Deck | Admin | FR-7 | no |
| UC-21 | I manage the announcement list that persists across weeks | Operator | FR-3 | no |
| UC-22 | I browse the Song Book and translations by language | Admin | FR-23, FR-24 | no |
| UC-23 | My edit is rejected because someone else already saved | Operator | FR-28 | no |

## Constraints · [G3]

- Hub is not public — brief Constraints. Source: brief.
- Jemaat data does not enter git — brief. Source: constitution public-repository.

## Non-Goals · [G3]

- Assemble slide order — Registry.
- Projector / two-screen presenter — Presenter.
- Be a congregation website.

## Prerequisite · [G3]

Song Book is shipped. WEBHOOK_SECRET for the Telegram path (OQ-4, go-live).

## Success Signal · [G3]

Friday review ≤ 10 minutes; Events need not open Hub to hand over a Rundown.

## Assumptions, Risks, and To Be Confirmed · [G3]

### Assumptions

OQ-1, OQ-2.

### Risks

Payload holds photos and prayers until manual delete.

### To Be Confirmed

OQ-4 host secrets — external, not G3.

## Gate Checklist · [G3]

★ UC titles are user sentences: yes. ★ FR without a UC: FR-26 `no_uc`.

## Design Reference · [G3]

`.how/hub/SDD-hub.md`

## Slots

`mode: deep`. Rules: `02-rules/rules-hub.md`. Domain: `03-domain/domain-model.md`, `state-machines.md`. Full flow of each critical UC: `04-usecases/UC-1-events-send-rundown.md`, `UC-2-paste-rundown-hub.md`, `UC-5-edit-service-fields.md`, `UC-7-delete-service.md`, `UC-17-telegram-correction.md`. Branches: `05-scenarios/SCN-1-unknown-hymn.md`, `SCN-2-save-conflict.md`, `SCN-3-correction-without-target.md`.

## Open Items

OQ-1 · OQ-2 · OQ-4 · OQ-6
