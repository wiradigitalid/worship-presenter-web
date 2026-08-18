---
type: contract
component: presenter
lc: LC-10
direction: exposed
created: 2026-08-18
updated: 2026-08-18
---

# Contract — Present channel

## Source of truth

`src/lib/present-channel.ts` — `PresentMessage` union. Not HTTP.

## Purpose

UC-11, UC-12, UC-13, AD-10, AD-29.

## Operations

| Operation | Purpose | Realizes |
| --- | --- | --- |
| index / blank / overlay | Controls → projector | UC-12 · UC-13 |
| request-sync | Projector asks for state | UC-12 |
| liveness ack | Projector → presenter, own condition only | AD-29 |

## Five lanes

| Lane | Answer |
| --- | --- |
| Authentication | Same-origin BroadcastChannel; not a server session |
| Validation | Only the shape in the shared module; a surface may not open another channel name (AD-10) |
| Error handling | Plan identity: **not yet** on the message — receiver does not reject a slide offset [MISSING] |
| Rate limiting | Heartbeat interval exported once from the liveness evaluator |
| Idempotency | Ack idempotent by construction (AD-29) |

## Error behaviour

| Condition | Response | Caller should |
| --- | --- | --- |
| Projector closed | `lost` verdict | Re-open from the controls |
| Slideshow tab ack | Forbidden — projector window only | Do not add a sender |

## Compatibility

A new variant outside `@/lib/present-channel` is an AD-10 violation.

## Constraints

Ephemeral; not `localStorage` (AD-24). No liveness notice on the Congregation screen.
