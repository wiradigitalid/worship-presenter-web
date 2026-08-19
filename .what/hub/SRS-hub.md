---
type: srs
component: hub
status: draft
created: 2026-08-18
updated: 2026-08-19
satisfies: [FR-1, FR-2, FR-3, FR-7, FR-8, FR-9, FR-10, FR-11, FR-12, FR-13, FR-14, FR-17, FR-18, FR-23, FR-24, FR-25, FR-27, FR-28]
reviewed:
  date: '2026-08-19'
  sha: '9ab09960cff59de97da9214a24d3c9d5c39db050'
  lenses: [structure, prose, edge-case-hunter]
---

# SRS — Hub

## Decision Summary · [G3]

Hub is the Operator's door: sign in, create a Service from this week's Rundown, list, Run-Sheet, edit, generate, download PPTX, announcements, accounts, language settings. Telegram via picoclaw (UC-1, UC-17) is last-phase intake, not this phase's handover.

## Why · [G3]

Without Hub, the multimedia turn falls back to one person assembling files. This component is the surface Operators call "the app".

## Actor Register · [G3]

| Actor | Who they are | What they may do |
| --- | --- | --- |
| Operator | Multimedia team | List, create, edit, generate, download, delete, Run-Sheet, announcements |
| Events | Later: Rundown sender on Telegram | Not a Hub user this phase |
| Admin | Account and settings manager | Accounts, transitions, locale |

## UC Catalogue · [G3]

| id | Use case | Actor | Satisfies | critical |
| --- | --- | --- | --- | --- |
| UC-1 | Events send a Rundown on Telegram and its Service appears | Events | FR-1, FR-2 | yes |
| UC-2 | I paste a Rundown in Hub and a new Service is saved | Operator | FR-27, FR-2 | yes |
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

UC-1 and UC-17 realise CAP-11 (Telegram, last phase). This phase's create path is UC-2.

## Constraints · [G3]

- Hub is not public — brief Constraints. Source: brief.
- Congregation data does not enter git — brief. Source: `.constitution/project/public-repository.md`.
- Create and edit share one field set and card order. Weekly values (hymn numbers, names, verses, flyers) are entered in Hub, not on the Artifact Registry. Source: as-built forms; FR-27 · FR-11.

## Non-Goals · [G3]

- Assemble slide order — Registry.
- Projector / two-screen presenter — Presenter.
- Be a congregation website.

## Prerequisite · [G3]

Song Book is shipped. `WEBHOOK_SECRET` is for the later Telegram path (CAP-11, OQ-4).

## Success Signal · [G3]

Friday review ≤ 10 minutes; the Operator creates this week's Service in Hub without assembling PowerPoint.

## Assumptions, Risks, and To Be Confirmed · [G3]

### Assumptions

- OQ-17 — The Operator has this week's Rundown content in time to enter it in Hub. Wrong: no Service that week.
- OQ-2 — One church, one worship flow, for this product's scope. Wrong: Scope In is not enough.
- OQ-1 is parked on CAP-11 (Events parseable Rundown when Telegram ships).

### Risks

Payload holds photos and prayers until manual delete.

### To Be Confirmed

OQ-4 — When will the production host set `AUTH_SECRET`, `WEBHOOK_SECRET`, and a durable path for the database? External; not G3.

## Gate Checklist · [G3]

★ UC titles are user sentences: yes. ★ FR without a UC: FR-26 `no_uc`.

## Design Reference · [G3]

`.how/hub/SDD-hub.md`

## Slots

`mode: deep`. Rules: `02-rules/rules-hub.md`. Domain: `03-domain/domain-model.md`, `state-machines.md`. Full flow of each critical UC: `04-usecases/UC-1-events-send-rundown.md`, `UC-2-paste-rundown-hub.md`, `UC-5-edit-service-fields.md`, `UC-7-delete-service.md`, `UC-17-telegram-correction.md`. Branches: `05-scenarios/SCN-1-unknown-hymn.md`, `SCN-2-save-conflict.md`, `SCN-3-correction-without-target.md`. Physical field names: `.how/hub/05-model/form-fields.md`.

## Open Items

OQ-17 · OQ-2 · OQ-4 · OQ-6. OQ-1 is parked on CAP-11. Taken and encoded here: OQ-20 (generate is not a payload edit; BR-4 is UC-5) · OQ-21 (no readable date → no row; named date with no Service rejects, no nearest-Sabbath fallback) · OQ-22 (unparseable Hub body with a date still saves what was readable; Telegram images attach or fail visibly) · OQ-23 (gone on re-read is UC-7 not-found; session expiry at save/delete rejects with no partial write).
