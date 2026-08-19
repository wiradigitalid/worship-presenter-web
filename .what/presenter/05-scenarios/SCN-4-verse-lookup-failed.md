---
type: scn
id: SCN-4
component: presenter
attaches_to: UC-13
created: 2026-08-18
updated: 2026-08-19
---

# SCN-4 — Verse lookup fails closed

## Where it branches

UC-13 step 1 (empty reference) and step 2 (timeout, unclear, missing, translation not installed).

## Condition

The reference is empty, matches more than one book, matches none, the requested translation is not installed, or the lookup does not return before timeout.

Empty is a fail-closed miss here. It is not a silent success and not a no-op on UC-13.

## Flow

1. The system does not pick a guess.
2. The overlay does not display a verse.
3. The Deck slide at the original position remains; the Service payload does not change.
4. The Operator sees that lookup failed, then corrects the typing, chooses another translation, or waits and retries.

## Outcome

The Congregation does not see a wrong verse mid-worship.

## Why it is not in the UC

Fail-closed failure plus translation choice would fatten the eight main steps.
