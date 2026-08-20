---
type: uc
id: UC-14
component: registry
satisfies: [FR-20, FR-30]
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
| 2 | General entry (including any slide inside an Announcement Set) | Free canvas within AD-15 (as-built editor) |
| 2 | Song Set entry — Title layout | Free canvas with its own background, shared by every Song Set entry (DEC-004) |
| 2 | Song Set entry — Verse/Reff layout | Free canvas authored on a **blank** canvas; background is supplied at hydrate/live time, not authored here (DEC-004, FR-20, FR-33) |
| 2 | ann-set marker | The marker itself is not a canvas; Admin edits the General slides *inside* that Announcement Set the same way as any other General (DEC-004; BR-11 retired, superseded by BR-12) |
| 2 | Predefined field on any General canvas | Typed as a `{key}` token inside a text element's content, not a whole-element `placeholderKey` binding (DEC-004, AD-32) |

## Failure Flows

| From step | Failure | What the system does | What the user is left with |
| --- | --- | --- | --- |
| 3 | Layout or image reference is invalid | Rejects the save | Old layout remains; no half-write |
| 3 | Not Admin | Rejects | Registry does not change |
| 3 | Text element carries a `{key}` the Predefined Field catalog does not recognise | Save succeeds; the editor flags the unknown key at save time (FR-30) | Layout persists with the flagged token; generation later renders it empty rather than failing |

## Outcome

That entry in the live Registry holds the new layout. Existing Services do not change until Sync.

## Business Rules

BR-8 · BR-12 · BR-13
