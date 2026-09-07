---
type: mandate
id: DEC-007
status: applied
accepted_by: 'kodesh87 (2026-09-07)'
touches:
  - .control/memlog/autopilot-DEC-007.md
  - .control/registry/specs.yaml
supersedes: null
superseded_by: null
created: '2026-09-07'
---

# DEC-007 — Autopilot mandate for G5 release execution

## Decision

> The owner grants an autonomous execution mandate to deliver all open functional requirements
> from G5 Release, using claude-byok for coding and smoke testing, with coordinator oversight, review,
> and testing.

## Why

All prior gates G1 through G4 have passed with deep mode and medium risk accepted across all product
components. Work progresses through G5 Release to deliver open functional requirements safely and
systematically.

## Cost

Operational decisions within agreed parameters are taken autonomously and recorded in the autopilot
ledger instead of pausing for interactive owner input at every step. Changes contradicting architectural
invariants (AD-N) remain strictly parked for owner confirmation.
