---
type: uc
id: UC-11
component: presenter
satisfies: [FR-15]
critical: false
created: 2026-08-18
---

# UC-11 — I run a fullscreen slideshow

## Trigger

The Operator opens the slideshow of an existing Service.

## Precondition

The Service exists. The Operator is signed in. One slide plan can already be built.

## Main Flow

1. The Operator opens this Service's slideshow.
2. The system shows the first slide of the same plan as the Deck.
3. The Operator advances linearly.
4. The system displays the next slide with the transition Admin chose.

## Alternate Flows

| From step | Condition | What happens |
| --- | --- | --- |
| 2 | Song block is incomplete | Existing slides are still shown; the gap is visible in Hub, not guaranteed hidden |

## Failure Flows

| From step | Failure | What the system does | What the user is left with |
| --- | --- | --- | --- |
| 1 | Network drops after the page has loaded | The show already in browser memory may continue | This is not the Sabbath guarantee; PPTX remains the fallback path (OQ-5) |
| 1 | Service does not exist | Does not show | Operator returns to the list |

## Outcome

Jemaat see the same order as the PPTX for this Service, for as long as the browser session lives.

## Business Rules

—
