---
type: mandate
id: DEC-008
status: applied
accepted_by: 'kodesh87 (2026-09-07)'
touches:
  - .control/memlog/autopilot-DEC-008.md
  - .control/registry/specs.yaml
  - .control/registry/decisions.yaml
supersedes: null
superseded_by: null
created: '2026-09-07'
---

# DEC-008 — Autopilot mandate for Artifacts overhaul (Main Spine, Song Sets, Announcement Sets)

## Decision

> The owner grants an autonomous execution mandate to overhaul the Artifacts interface
> (Main Spine, Song Sets, Announcement Sets), carrying all document updates across G1–G4,
> producing tickets/specs/TDD, and coordinating implementation through G5 Release.
> Claude-byok is designated for coding and automated smoke testing.

## Why

The artifacts registries and canvas authoring experience require an overhaul to support
dynamic multi-insertion of song sets and announcement sets in Main Spine, hover-only list actions,
drag-and-drop reordering, card-encapsulated slide renaming, canvas context menu (z-index/duplicate/delete),
inline text editing, element toolbars with drag-to-create, change background, and unified 2-column
layouts across Song Sets and Announcement Sets.

## Cost

Document updates and operational decisions are performed autonomously and recorded in the autopilot
ledger instead of pausing for interactive owner input at every step. Changes contradicting architectural
invariants (AD-N) remain strictly parked for owner confirmation.
