---
type: uc
id: UC-13
component: presenter
satisfies: [FR-19, FR-22]
critical: false
created: 2026-08-18
---

# UC-13 — I display an on-demand verse on the projector

## Trigger

The speaker asks for a verse outside what is already on the slides; the Operator types a reference in the presenter.

## Precondition

UC-12 is running or the projector screen is open. A translation is selected.

## Main Flow

1. The Operator enters a verse reference.
2. The system displays the text in the selected translation on the Jemaat screen.
3. The Operator closes the overlay.
4. The Deck slide at the original position returns; the Service payload does not change.

## Alternate Flows

| From step | Condition | What happens |
| --- | --- | --- |
| 1 | Operator chooses another translation for this lookup | Verse from that translation; the default setting need not change |

## Failure Flows

| From step | Failure | What the system does | What the user is left with |
| --- | --- | --- | --- |
| 2 | Reference is unclear or corpus is absent | Does not guess; failure is visible | Overlay does not show a wrong verse; Deck is unchanged |
| 2 | Translation is not installed | Reports absent | Default setting is not rewritten silently |

## Outcome

The verse appears temporarily. This week's content in Hub is the same as before the overlay.

## Business Rules

BR-7
