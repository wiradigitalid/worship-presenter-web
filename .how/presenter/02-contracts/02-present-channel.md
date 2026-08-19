---
type: contract
component: presenter
lc: LC-10
direction: exposed
created: 2026-08-18
updated: 2026-08-19
---

# Contract — Present channel

## Source of truth

`src/lib/present-channel.ts` — `PresentMessage` union. Not HTTP.

## Purpose

UC-12, UC-13, AD-10, AD-29. Session display: showing / blanked / overlay (OQ-25). Slideshow (UC-11) does not use this channel.

## Operations

| Operation | Purpose | Realizes |
| --- | --- | --- |
| index / blank / overlay | Controls → projector | UC-12 · UC-13 |
| transition | Live-session override of app-wide style (AD-23); PPTX does not follow | UC-12 |
| clear-scripture | Dismiss overlay | UC-13 |
| request-sync | Projector asks for state; answer resends index, overlay, and blank (OQ-25) | UC-12 |
| liveness ack | Projector → presenter, own condition only | AD-29 |

## Five lanes

| Lane | Answer |
| --- | --- |
| Authentication | Same-origin BroadcastChannel; not a server session |
| Validation | Only the shape in the shared module; a surface may not open another channel name (AD-10) |
| Error handling | Plan identity: **not yet** on the message — receiver does not reject a slide offset [MISSING]. Overlay on `sync`: **not yet** on the message — a projector reload clears overlay [MISSING] (OQ-25) |
| Rate limiting | Heartbeat interval exported once from the liveness evaluator (`PROJECTOR_HEARTBEAT_INTERVAL_MS`); not unbounded and not silent. No HTTP quota — this is not an HTTP API. |
| Idempotency | Intended values on the wire (`blank`, `index`, `transition`, overlay text). Ack idempotent by construction (AD-29). `request-sync` may be answered twice with the same triple. |

## Error behaviour

| Condition | Response | Caller should |
| --- | --- | --- |
| Projector closed | `lost` verdict | Re-open from the controls |
| Slideshow tab ack | Forbidden — projector window only | Do not add a sender |
| Second projector window | Forbidden — one projector on the channel | Close the extra window |
| Control or projector reload | Resend index, overlay, and blank (OQ-25) | Do not treat reload as a new index |

## Compatibility

A new variant outside `@/lib/present-channel` is an AD-10 violation.

## Constraints

Ephemeral; not `localStorage` (AD-24). No liveness notice on the Congregation screen. Plan identity stays deferred (AD-10, OQ-26); the [MISSING] on `PresentMessage` is not deleted.
