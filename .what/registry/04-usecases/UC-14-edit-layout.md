---
type: uc
id: UC-14
component: registry
satisfies: [FR-20]
critical: false
created: 2026-08-18
---

# UC-14 — I change a slide's layout

## Trigger

Admin opens Artifact Registry and edits one entry's layout.

## Precondition

Admin is signed in.

## Main Flow

1. Admin selects one entry.
2. Admin changes the layout within that kind's authority.
3. Admin saves.
4. The next generate for a new Service (or after Sync) uses the new layout.

## Alternate Flows

| From step | Condition | What happens |
| --- | --- | --- |
| 2 | SongSet entry | Only limited configuration, not a free canvas |

## Failure Flows

| From step | Failure | What the system does | What the user is left with |
| --- | --- | --- | --- |
| 3 | Layout or image reference is invalid | Rejects the save | Old layout remains; no half-write |
| 3 | Not Admin | Rejects | Registry does not change |

## Outcome

That entry in the live Registry holds the new layout. Existing Services do not change until Sync.

## Business Rules

BR-8
