---
type: srs
component: registry
status: draft
created: 2026-08-18
updated: 2026-08-18
satisfies: [FR-4, FR-5, FR-6, FR-20, FR-21]
reviewed:
  date: ''
  sha: ''
  lenses: []
---

# SRS — Registry

## Decision Summary · [G3]

Registry owns Deck layout and order. Weekly content stays on the Service (Hub). A Snapshot protects a Service that has already been reviewed.

## Why · [G3]

Changing the worship order must not wait for a deploy, and must not overwrite a Service already reviewed on Friday.

## Actor Register · [G3]

| Actor | Who they are | What they may do |
| --- | --- | --- |
| Admin | Structure editor | Layout, order, delete, Sync Artifact |
| Operator | Sees the result | Sees the Deck matching the payload; does not edit Registry |

## UC Catalogue · [G3]

| id | Use case | Actor | Satisfies | critical |
| --- | --- | --- | --- | --- |
| UC-14 | I change a slide's layout | Admin | FR-20 | no |
| UC-15 | I change slide order and a delete stays deleted | Admin | FR-21 | yes |
| UC-16 | I Sync Artifact to a Service that has already been reviewed | Admin | FR-21 | no |
| UC-20 | I see a Deck that matches this week's payload | Operator | FR-4, FR-5, FR-6 | no |

## Constraints · [G3]

Not per-church configuration. Registry holds structure, not family names or prayers.

## Non-Goals · [G3]

- Fill weekly payload — Hub.
- Live control — brief.

## Prerequisite · [G3]

Placeholder Catalog is closed; expanding it = development.

## Success Signal · [G3]

A deleted entry stays deleted after restart. An old Service does not change until Sync.

## Assumptions, Risks, and To Be Confirmed · [G3]

### Assumptions

—

### Risks

A Registry edit that makes lyrics unreadable (NFR-3).

### To Be Confirmed

—

## Gate Checklist · [G3]

★ UC titles are user sentences: yes. critical 1/4.

## Design Reference · [G3]

`.how/registry/SDD-registry.md`

## Slots

`mode: deep`. Rules: `02-rules/rules-registry.md`. Domain: `03-domain/domain-model.md`, `state-machines.md`. Flows: `04-usecases/UC-14-edit-layout.md`, `UC-15-reorder-and-delete.md` (critical), `UC-16-sync-artifact.md`. Branches: `05-scenarios/SCN-5-delete-survives-restart.md`.

## Open Items

—
