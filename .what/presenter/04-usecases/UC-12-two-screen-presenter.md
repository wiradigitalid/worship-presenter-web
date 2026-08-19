---
type: uc
id: UC-12
component: presenter
satisfies: [FR-16]
critical: false
created: 2026-08-18
---

# UC-12 — I run the two-screen presenter

## Trigger

The Operator opens the Service presenter and opens the projector screen.

## Precondition

The Service exists. The Operator is signed in. One slide plan can already be built.

## Main Flow

1. The Operator opens presenter control.
2. The Operator opens the screen the Congregation sees.
3. The Operator advances on control.
4. The Congregation screen follows the same slide.
5. The Operator chooses blank; the Congregation screen goes black; Deck position does not shift.
6. The Operator releases blank; the slide at that position returns.

## Alternate Flows

| From step | Condition | What happens |
| --- | --- | --- |
| 2 | Projector is not yet open | Control remains; liveness is not live (AD-29) |
| 3 | Advance while blank is on | Index moves; projector stays black; unblank shows the current slide (OQ-11 answered) |
| 3 | Previous slide, not linear advance | Allowed; index stays inside the plan (AD-7) |
| 3 | Last slide, or the plan is empty | Index holds; empty plan is the same miss as slideshow plan-failed |
| 5 | Verse overlay is open | Blank covers the overlay; overlay stays underneath until cleared |
| 5 | Control or projector reloads while blanked | Current blank and index are sent again; index unchanged by the reload |

## Failure Flows

| From step | Failure | What the system does | What the user is left with |
| --- | --- | --- | --- |
| 4 | Two windows are not on the same channel | Projector does not follow | Operator reopens from the same control |
| 5 | Blank fails | Position is not changed silently | Operator sees the screen still lit |

## Outcome

Two screens: Operator control and Congregation picture. Operator Chrome does not reach the room screen.

## Business Rules

BR-6
