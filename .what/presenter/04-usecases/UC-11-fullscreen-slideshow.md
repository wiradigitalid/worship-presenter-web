---
type: uc
id: UC-11
component: presenter
satisfies: [FR-15]
critical: false
created: 2026-08-18
updated: 2026-08-19
---

# UC-11 — I present a fullscreen slideshow

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
| 2 | Song block is incomplete | Existing slides are still shown. Hub already shows the incomplete song; Presenter does not hide that gap |
| 3 | Last slide | Index holds; no wrap-around |
| 3 | Previous slide | Allowed; index stays inside the plan |

## Failure Flows

| From step | Failure | What the system does | What the user is left with |
| --- | --- | --- | --- |
| 1 | Network drops after the page has loaded | The show already in browser memory may continue | This is not the Sabbath guarantee; PPTX remains the fallback path (OQ-5) |
| 1 | Service does not exist | Slideshow does not open; Operator is returned to Hub | Hub; no projected show |
| 2 | Slide plan cannot be built | Slideshow does not open; Operator is returned to Hub | Hub; PPTX remains the guarantee (OQ-26) |

## Outcome

The Congregation sees the same order as the PPTX for this Service, for as long as the browser session lives.

## Business Rules

—
