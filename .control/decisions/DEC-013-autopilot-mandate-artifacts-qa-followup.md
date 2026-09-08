---
type: mandate
id: DEC-013
status: accepted
accepted_by: 'kodesh87 (2026-09-08)'
touches:
  - .control/memlog/autopilot-DEC-013.md
  - .control/registry/specs.yaml
  - .control/registry/decisions.yaml
supersedes: null
superseded_by: null
created: '2026-09-08'
---

# DEC-013 — Autopilot mandate for Artifacts QA Follow-up (SPEC-12)

## Decision

> The owner grants an autonomous execution mandate to resolve all defects and consistency
> regressions identified in Artifacts QA Follow-up (SPEC-12: BUG-1 through BUG-16), carrying
> implementation through G5 Release with autonomous code execution, double code review
> (self + claude CLI peer review), and automated smoke testing.

## Why

Following Wave W11 (DEC-008), comprehensive manual QA identified 16 concrete bugs and consistency
regressions across Main Spine, Song Sets, and Announcement Sets in the canvas editor, element
properties, dropdown rendering, and drag-and-drop mechanics. SPEC-12 breaks down these fixes into
8 focused tracer-bullet tickets. Autonomous delivery under mandate delivers these fixes systematically
without pausing for interactive approval on routine implementation steps.

## Cost

Operational decisions, bug fixes, and minor refactorings are recorded in the autopilot ledger
rather than prompting the owner interactively. Changes contradicting architectural invariants (AD-N)
remain strictly parked for owner confirmation.
