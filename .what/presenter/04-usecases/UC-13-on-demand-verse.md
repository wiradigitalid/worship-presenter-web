---
type: uc
id: UC-13
component: presenter
satisfies: [FR-19, FR-22]
critical: false
created: 2026-08-18
updated: 2026-08-19
---

# UC-13 — I display an on-demand verse on the projector

## Trigger

The speaker asks for a verse outside what is already on the slides; the Operator types a reference in the presenter.

## Precondition

UC-12 is running and the projector is live. A translation is selected.

## Main Flow

1. The Operator enters a verse reference.
2. The system displays the text in the selected translation on the Congregation screen.
3. The Operator closes the overlay.
4. The Deck slide at the original position returns; the Service payload does not change.

## Alternate Flows

| From step | Condition | What happens |
| --- | --- | --- |
| 1 | Operator chooses another translation for this lookup | Verse from that translation; the default setting need not change |
| 2 | Operator looks up another verse while an overlay is already open | New text replaces the open overlay (as-built `scripture` broadcast) |
| 2 | Operator advances the Deck while overlay is open | Overlay stays; index may move underneath; closing overlay shows the current Deck slide |
| 2 | Operator blanks while overlay is open | Blank covers the overlay; overlay remains until cleared (BR-6, OQ-25) |

## Failure Flows

| From step | Failure | What the system does | What the user is left with |
| --- | --- | --- | --- |
| 1 | Projector is not open, or liveness is not live | Lookup is refused; no request is sent | Overlay unchanged; Operator opens the projector first (OQ-26) |
| 1–2 | Empty reference, unclear, missing, translation not installed, or lookup times out | SCN-4 — fail closed, visible. If an overlay is already showing, it stays; a failed lookup does not clear it | Overlay does not show a wrong verse; Deck unchanged |
| 2 | Session expired | Gate refuses the lookup | Overlay fails visible; Deck unchanged |

## Outcome

The verse appears temporarily. This week's content in Hub is the same as before the overlay.

## Business Rules

BR-7
