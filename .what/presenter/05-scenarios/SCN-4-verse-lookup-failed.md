---
type: scn
id: SCN-4
component: presenter
attaches_to: UC-13
created: 2026-08-18
---

# SCN-4 — Verse reference is ambiguous, missing, or the translation is not installed

## Where it branches

UC-13 step 2.

## Condition

The reference is empty, matches more than one book, matches none, or the requested translation is not installed.

## Flow

1. The system does not pick a guess.
2. The overlay does not display a verse.
3. The Deck slide at the original position remains; the Service payload does not change.
4. The Operator sees that lookup failed, then corrects the typing or chooses another translation.

## Outcome

The Congregation does not see a wrong verse mid-worship.

## Why it is not in the UC

Fail-closed failure plus translation choice would fatten the eight main steps.
