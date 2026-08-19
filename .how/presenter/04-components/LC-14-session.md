---
type: lc
id: LC-14
name: Presenter session
lc_type: service
container: web
component: presenter
created: 2026-08-18
updated: 2026-08-19
---

# LC-14 — Presenter session

## Responsibility

Coordinate index, blank, overlay, and liveness between the controls and the projector.

## Depends on

LC-10 (channel) · LC-9 (verse) · LC-16 (plan, owned by Hub)

## Interface

State in window memory + channel messages. Not a table.

Blank covers overlay without clearing it. Required (OQ-25): `request-sync` answers with index, overlay, and blank. Required (OQ-26): verse lookup is refused while liveness is not `live`. As-built: overlay-on-sync and no-projector refuse are [MISSING] — see SDD Evidence. Plan identity is not on the message (AD-10, OQ-26).

## Notes

`src/lib/present-channel.ts`, AD-29 liveness evaluator. Overlay-on-sync and no-projector refuse are [MISSING] in code; see SDD Evidence.
