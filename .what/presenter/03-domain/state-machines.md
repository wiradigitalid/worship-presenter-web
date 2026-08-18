---
type: lifecycle
component: presenter
status: draft
created: 2026-08-18
updated: 2026-08-18
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
| live | lost | `closed` handle or no ack within the freshness window | System | single-evaluator predicate | lost verdict |
| lost | live | New ack | System | — | live verdict |
| * | * | Blank | Operator | BR-6 | Deck position unchanged |

`none` is not an alarm. False `live` is forbidden; uncertainty becomes `lost` (AD-29).

### What is deliberately not modelled

Slide index is not stored state; it is ephemeral on the channel (AD-10). Plan identity in the message is **not yet** present.
