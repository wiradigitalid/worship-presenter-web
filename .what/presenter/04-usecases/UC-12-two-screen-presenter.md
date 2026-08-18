---
type: uc
id: UC-12
component: presenter
satisfies: [FR-16]
critical: false
created: 2026-08-18
---

# UC-12 — I run a two-screen presenter

## Trigger

The Operator opens the Service presenter and opens the projector screen.

## Precondition

The Service exists. The Operator is signed in.

## Main Flow

1. The Operator opens presenter control.
2. The Operator opens the screen Jemaat see.
3. The Operator advances on control.
4. The Jemaat screen follows the same slide.
5. The Operator chooses blank; the Jemaat screen goes black; Deck position does not shift.
6. The Operator releases blank; the slide at that position returns.

## Alternate Flows

| From step | Condition | What happens |
| --- | --- | --- |
| 2 | Projector is not yet open | Control remains; liveness is not live (AD-29) |

## Failure Flows

| From step | Failure | What the system does | What the user is left with |
| --- | --- | --- | --- |
| 4 | Two windows are not on the same channel | Projector does not follow | Operator reopens from the same control |
| 5 | Blank fails | Position is not changed silently | Operator sees the screen still lit |

## Outcome

Two screens: Operator control and Jemaat picture. Operator Chrome does not reach the room screen.

## Business Rules

BR-6
