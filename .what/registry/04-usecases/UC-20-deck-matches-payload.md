---
type: uc
id: UC-20
component: registry
satisfies: [FR-4, FR-5, FR-6]
critical: false
created: 2026-08-20
---

# UC-20 — I see a Deck that matches this week's payload

## Trigger

Operator opens the Slideshow or Presenter view for a Service.

## Precondition

The Service exists and has a snapshot (created or Synced at least once, AD-16).

## Main Flow

1. The system reads the Service's frozen structure — the spliced main spine, every Song Set entry's shared Title/Verse/Reff trio, and every referenced Announcement Set (AD-35).
2. The system hydrates: Song Set entries expand from that week's Song Book lookup; Announcement Set slides render as authored; every text element's inline `{key}` tokens resolve against the weekly payload.
3. Operator sees the Deck in the order the frozen structure defines.

## Alternate Flows

| From step | Condition | What happens |
| --- | --- | --- |
| 2 | A text element carries a `{key}` the Predefined Field catalog does not recognise | The token renders as empty text; the rest of that element's fixed prose still renders; generation is not blocked (BR-13, FR-30) |
| 2 | A Song Set entry has no weekly Song Book chosen | Falls through to the Admin-set global default Song Book (S3) |
| 2 | A Verse/Reff slide has no background resolved yet | Falls through Admin's global default background, then blank (AD-33, AD-34) |
| 1 | Operator changes the live Verse/Reff background during the service | Presenter-session override only; this Deck's frozen structure and Service payload are untouched (AD-34; UC-27 is the Presenter/Hub flow, not this one) |

## Failure Flows

| From step | Failure | What the system does | What the user is left with |
| --- | --- | --- | --- |
| 1 | A frozen row's payload will not parse | Omit that row from the Deck and log id + reason; do not substitute the seed (AD-17, OQ-32) | A Deck missing one slide, not a broken render |
| 2 | A referenced Announcement Set no longer exists (deleted after this Service's snapshot froze) | The snapshot already carries that set's cloned content (AD-35); nothing to resolve at render time | Deck unaffected — clone happened at freeze, not at render |

## Outcome

Operator sees exactly the structure this Service froze, filled with this week's payload. Neither viewing nor a live background change touches the Registry or the Service's stored fields.

## Business Rules

BR-10 · BR-12 · BR-13
