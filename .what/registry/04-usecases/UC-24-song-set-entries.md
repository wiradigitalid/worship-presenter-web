---
type: uc
id: UC-24
component: registry
satisfies: [FR-29]
critical: false
created: 2026-08-20
---

# UC-24 — I add, rename, or remove a song-set entry

## Trigger

Admin adds, renames, or removes a Song Set entry on the main spine.

## Precondition

Admin is signed in.

## Main Flow

1. Admin clicks "New Song Set" in the 2-column Song Sets view; the system automatically creates a new entry with default name and selects it.
2. Admin places the song set onto the main spine using the "New Slide" dropdown selector as many times as needed (multiple insertion supported).
3. The system generates that entry's weekly inputs on the Hub form (song number, Song Book choice, background — FR-32) under its own name, without a deploy.
4. Admin edits the shared Title, Verse, or Reff layout directly in the side-by-side canvas workspace.
5. Admin saves.

## Alternate Flows

| From step | Condition | What happens |
| --- | --- | --- |
| 1 | Admin renames an existing entry's title | Title changes via the card rename pattern (`[Rename][Reset]` ⇄ `[Cancel][Save]`); `variable_name` stays attached |
| 1 | Admin removes an entry | Delete is allowed via the hover action button; Hub's stored weekly values for that `variable_name` stay stored and inert |
| 2 | Admin inserts the same Song Set multiple times in Main Spine | Allowed; each placement references the same slot, expanding the same weekly song at different positions in the presentation (DEC-008) |
| 4 | Admin authors that entry's Title/Verse/Reff appearance | Every Song Set entry shares the one Title/Verse/Reff trio (UC-14, AD-33); Verse/Reff follows the 2/3 screen height formula for automated lyric layout |

## Failure Flows

| From step | Failure | What the system does | What the user is left with |
| --- | --- | --- | --- |
| 1 | `variable_name` collides with a **live** entry | Rejects the add/rename | Existing entry unchanged; the identity rule holds the same way AD-19 held slot uniqueness. A `gone` entry's former name does not collide — reuse is allowed (owner ruling, 2026-08-20) |
| 4 | Not Admin | Rejects | Registry does not change |
| 4 | Save fails | Does not claim the new entry | Prior list of entries remains after restart |

## Outcome

The live Registry's Song Set entry list is what Admin left in place. The Hub weekly form always shows exactly the entries currently on the spine (FR-32). An existing Service's frozen list of entries does not change until Sync (BR-8).

## Business Rules

BR-8 · BR-9 · BR-12
