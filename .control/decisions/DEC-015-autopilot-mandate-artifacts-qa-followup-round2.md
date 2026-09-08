---
type: mandate
id: DEC-015
status: applied
accepted_by: 'kodesh87 (2026-09-08)'
touches:
  - .control/memlog/autopilot-DEC-015.md
  - .control/registry/specs.yaml
  - .control/registry/decisions.yaml
supersedes: null
superseded_by: null
created: '2026-09-08'
---

# DEC-015 — Autopilot mandate for Artifacts QA Follow-up Round 2 (SPEC-13)

## Decision

> The owner grants an autonomous execution mandate to resolve all defects and regressions
> identified in Artifacts QA Follow-up Round 2 (SPEC-13: tickets SPEC-13-01 through SPEC-13-13,
> covering reopened BUG-1..BUG-3, BUG-8, and new BUG-18..BUG-24), carrying implementation through
> G5 Release with autonomous code execution, double code review (self + claude CLI peer review),
> and automated smoke testing.

## Why

Following SPEC-12, a second manual QA pass over shipped fixes identified 4 residual/reopened defects
(BUG-1..BUG-3, BUG-8) and 7 newly discovered defects (BUG-18..BUG-24) across Main Spine, Song Sets,
and Announcement Sets. SPEC-13 decomposes these into 13 focused tickets with concrete test coverage.
Autonomous delivery under mandate delivers these fixes systematically without pausing for interactive
approval on routine implementation steps.

## Cost

Operational decisions, bug fixes, and minor refactorings are recorded in the autopilot ledger
rather than prompting the owner interactively. Changes contradicting architectural invariants (AD-N)
remain strictly parked for owner confirmation.
