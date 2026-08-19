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
4. The next generated Deck for a new Service (or after Sync) uses the new layout.

## Alternate Flows

| From step | Condition | What happens |
| --- | --- | --- |
| 2 | General entry | Free canvas within AD-15 (as-built editor) |
| 2 | SongSet entry | Canvas is read-only. AD-22 bounded surface (two backgrounds, font style/size, override outside layout) is not shipped |
| 2 | Announcement entry | Canvas is read-only; the row expands Hub's live list (BR-11), not a free canvas |

## Failure Flows

| From step | Failure | What the system does | What the user is left with |
| --- | --- | --- | --- |
| 3 | Layout or image reference is invalid | Rejects the save | Old layout remains; no half-write |
| 3 | Not Admin | Rejects | Registry does not change |

## Outcome

That entry in the live Registry holds the new layout. Existing Services do not change until Sync.

## Business Rules

BR-8
