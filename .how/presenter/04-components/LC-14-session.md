---
type: lc
id: LC-14
name: Presenter session
lc_type: service
container: web
component: presenter
created: 2026-08-18
---

# LC-14 — Presenter session

## Responsibility

Coordinate index, blank, overlay, and liveness between the controls and the projector.

## Depends on

LC-10 (channel) · LC-9 (verse) · LC-16 (plan, owned by Hub)

## Interface

State in window memory + channel messages. Not a table.

## Notes

`src/lib/present-channel.ts`, AD-29 liveness evaluator.
