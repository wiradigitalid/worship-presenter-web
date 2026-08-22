---
title: "Addendum: Operator Turn"
initiative: operator-turn
status: draft
created: 2026-08-18
updated: 2026-08-19
---

# Addendum

## Old → new ID mapping (complete)

Condition 1 for retiring the pre-method archive (DEC-001). Old PRD numbers are not corpus IDs until this table.

| Old | New | PRD area |
|---|---|---|
| FR-1 · FR-2 · FR-3 · FR-12 | same | rundown-to-service |
| FR-11b | FR-27 | rundown-to-service |
| FR-3 | retired 2026-08-20 (DEC-004), superseded by `offline-deck` FR-21 | rundown-to-service |
| FR-4 … FR-7 · FR-14 · FR-20 · FR-21 | same | offline-deck |
| FR-10b | FR-26 | offline-deck |
| — | FR-29, FR-30, FR-31 (DEC-004, 2026-08-20) | offline-deck |
| FR-8 · FR-9 · FR-10 · FR-11 · FR-13 · FR-15 … FR-19 · FR-22 … FR-25 | same | operator-turn |
| FR-13b | FR-28 | operator-turn |
| — | FR-32, FR-33, FR-34 (DEC-004, 2026-08-20) | operator-turn |
| NFR-1 … NFR-9 | same | enforced in `requirements.yaml` |
| UJ-1 | UJ-1 | rundown-to-service |
| UJ-5 | UJ-5 | rundown-to-service |
| UJ-2 · UJ-3 · UJ-4 | same | operator-turn |
| Phase 1–6 | `target_release: as-built` | old wave not imported |
| BIC as live client | Church Name | `index.yaml` |

## Source material

DEC-001. Old PRD §4.3–4.9, §4.11–4.12 — mapped, not copied. Operator chrome: `.how/_platform/design-system.md`. Screens: `.how/_platform/inventory-screen.md`. `wdi-ux` was not run. DEC-002: slices of `_bmad-output/prior-knowledge/` leave the tree at wave close, not as a single delete.

## `weekly-sabbath` folder

Withdrawn 2026-08-18. FR IDs were not moved and were not restarted; what changed is only *which document states that promise*.

## FR-35 — mechanism notes, deliberately kept out of the PRD

Recorded here because a promise is not a transport. None of this is decided; the decision record and G3
own it. Captured so the reasoning is not lost between the ask and the design.

**Why a server channel is needed at all.** Presenter and projector sync today through
`BroadcastChannel`, which reaches only tabs in the same browser on the same device. A phone cannot join
it. This is not an obstacle to route around: AD-10 chose it on purpose, "keeping the venue path
independent of hub connectivity". AD-10 also names its own exit — "No server realtime channel
(WebSocket/SSE) is introduced **unless product direction changes**" — and FR-35 is that change.

**Shape considered and preferred: SSE plus POST, not WebSocket.** Server-to-client over
`text/event-stream`, client-to-server as ordinary POSTs. It needs no dependency beyond the Go standard
library, survives nginx and Cloudflare without upgrade configuration, and is one-directional per stream,
which matches a topology with exactly one controller. WebSocket stays available if low-latency
bidirectional traffic is later shown to be needed, and that would be its own decision.

**What must not be admitted.** AD-10's *Prevents* is a projector following one controller while ignoring
another; AD-29 says a second sender on that channel "is a new decision, not an implementation choice".
The phone therefore sends intents to the laptop, and the laptop stays the projector's only sender. No new
message vocabulary is needed: index (inside `sync`), `blank`, `transition`, `background`, `scripture` and
`clear-scripture` already exist.

**Two properties the design owes the promise.** The laptop must keep driving the room screen with the
remote gone — so the remote is an input, never a link in the chain. And a remote must reach one
deliberately chosen laptop: AD-5 puts every new path inside the gate matcher with its assertion test in
the same change set, but signing in cannot by itself be what selects which screen you drive.

