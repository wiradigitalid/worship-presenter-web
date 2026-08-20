---
type: srs
component: registry
status: draft
created: 2026-08-18
updated: 2026-08-20
satisfies: [FR-4, FR-5, FR-6, FR-20, FR-21, FR-29, FR-30, FR-31]
reviewed:
  date: '2026-08-20'
  sha: 'ea54cdb3f80610648510ed95120b3c1b1afcbd30'
  lenses: [structure, prose, edge-case-hunter]
---

# SRS — Registry

## Decision Summary · [G3]

Registry owns Deck layout, order, and all announcement/flyer composition (Announcement Sets, DEC-004). Weekly content stays on the Service (Hub). A Snapshot protects a Service that has already been reviewed.

## Why · [G3]

Changing the worship order must not wait for a deploy, and must not overwrite a Service already reviewed on Friday.

## Actor Register · [G3]

| Actor | Who they are | What they may do |
| --- | --- | --- |
| Admin | Structure editor | Layout, order, add, rename, delete, Sync Artifact |
| Operator | Sees the result | Sees the Deck matching the payload; does not edit Registry |

## UC Catalogue · [G3]

| id | Use case | Actor | Satisfies | critical |
| --- | --- | --- | --- | --- |
| UC-14 | I change a slide's layout | Admin | FR-20 | no |
| UC-15 | I change slide order and a delete stays deleted | Admin | FR-21 | yes |
| UC-16 | I Sync Artifact to a Service already reviewed | Admin | FR-21 | no |
| UC-20 | I see a Deck that matches this week's payload | Operator | FR-4, FR-5, FR-6 | no |
| UC-24 | I add, rename, or remove a song-set entry | Admin | FR-29 | no |
| UC-25 | I maintain the background library and set the global default | Admin | FR-31 | no |

## Constraints · [G3]

Not per-church configuration. Source: brief Scope Out; glossary Artifact Registry (one Registry, not per-church). AD-14 admin-only global templates.

Two surfaces: the Artifact Registry owns order, labels, layout, and announcement/flyer composition (each Announcement Set is its own ordered list of General slides, DEC-004); Hub owns weekly values only — song numbers/books/backgrounds per song-set entry, lyric overrides, names, verses, Family/Youth text and photos. Hub does not compose or reorder any announcement list any more (FR-3 retired). Neither surface does the other's job.

## Non-Goals · [G3]

- Fill weekly payload — Hub.
- Live control — Presenter.

## Prerequisite · [G3]

Predefined Field catalog is closed; expanding it = development. An unrecognised `{token}` never blocks generation (FR-30) — it renders empty and is flagged at save time, not at generate time.

## Success Signal · [G3]

A deleted entry stays deleted after restart. An old Service does not change until Sync.

## Assumptions, Risks, and To Be Confirmed · [G3]

### Assumptions

- OQ-24 — Registry `gone` is terminal. Reset is live→live only and does not undelete. Wrong: Admin ships undelete, or Reset on a gone id is undefined.
- OQ-15 — Reset restores the shipped label (including a rename), and an authored row exposes no Reset (`seed_hash` NULL; Story 20.3). Wrong: two rows in one list keep offering Reset on an authored General.
- OQ-14 — Until AD-16 ships, a stale snapshot has no extra operator affordance. Wrong: Story 20.8 must add a badge.
- OQ-32 — A corrupt live Registry row is omitted and logged at Sync, the same as a plan read; it is not frozen into the snapshot. Wrong: Sync fails closed with no recovery, or freezes a corrupt row into the snapshot.

### Risks

A Registry edit that makes lyrics unreadable (NFR-3).

### To Be Confirmed

—

## Gate Checklist · [G3]

★ UC titles are user sentences: yes. critical 1/6.

## Design Reference · [G3]

`.how/registry/SDD-registry.md`

## Slots

`mode: deep`. Rules: `02-rules/rules-registry.md` (BR-8…BR-13; BR-11 retired, superseded by DEC-004). Domain: `03-domain/domain-model.md`, `state-machines.md`, `deck-frame.md`. Flows: `04-usecases/UC-14-edit-layout.md` (amended DEC-004), `UC-15-reorder-and-delete.md` (critical, amended DEC-004), `UC-16-sync-artifact.md` (amended DEC-004), `UC-20-deck-matches-payload.md`, `UC-24-song-set-entries.md`, `UC-25-background-library.md`. Branches: `05-scenarios/SCN-5-delete-survives-restart.md`.

## Open Items

OQ-24 · OQ-15 · OQ-14 · OQ-32.
