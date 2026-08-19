---
type: lifecycle
component: presenter
status: draft
created: 2026-08-18
updated: 2026-08-19
entities: [ProjectorLiveness]
---

# State Lifecycle — Presenter

Presenter does not write domain entities. What has state is the browser presentation session.

## ProjectorLiveness

**States:** `none` · `live` · `lost`
**Initial:** `none` — presenter opened without a projector
**Terminal:** none; `lost` can return to `live` on the next ack

| From | To | Trigger | Who may | Guard | Side effect |
| --- | --- | --- | --- | --- | --- |
| none | live | Ack from the projector window | System | only the projector window may send (AD-29) | live verdict |
| none | lost | Projector was opened but no ack within the freshness window | System | `opened` was recorded; `none` with no open attempt is not an alarm | lost verdict |
| live | lost | `closed` handle or no ack within the freshness window | System | single-evaluator predicate | lost verdict |
| lost | live | New ack | System | — | live verdict |

`none` is not an alarm. False `live` is forbidden; uncertainty becomes `lost` (AD-29).

## Session display

Ephemeral on the channel, not a persisted entity. Blank is not a liveness transition (BR-6).

| Mode | Meaning |
| --- | --- |
| showing | Congregation sees the current Deck slide |
| blanked | Black cover; index and any verse overlay stay underneath |
| overlay | Verse text on the Congregation screen; payload unchanged (BR-7) |

Blank covers overlay; it does not clear it (OQ-25). Advance may change index under blank or overlay.

Unblank reveals the overlay if it is still open; otherwise the Congregation sees the current index. Closing overlay reveals the current index (BR-7).

### What is deliberately not modelled

Slide index is not stored state; it is ephemeral on the channel (AD-10). Plan identity in the message is **not yet** present (OQ-26).
