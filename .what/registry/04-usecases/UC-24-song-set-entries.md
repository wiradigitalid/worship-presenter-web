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

1. Admin adds a new Song Set entry, giving it a name (`variable_name`) and a title.
2. The system places it on the main spine as an ordinary reorderable row (FR-21).
3. The system generates that entry's weekly inputs on the Hub form (song number, Song Book choice, background — FR-32) under its own name, without a deploy.
4. Admin saves.

## Alternate Flows

| From step | Condition | What happens |
| --- | --- | --- |
| 1 | Admin renames an existing entry's title | Title changes; `variable_name` (its cross-boundary identity) does not, so weekly values already entered under that name stay attached (AD-19's identity rule survives in the new shape, AD-31) |
| 1 | Admin removes an entry | Delete is allowed like any other row (UC-15); Hub's stored weekly values for that `variable_name` stay stored and inert — they are not deleted with the entry. The `variable_name` itself is freed |
| 1 | Admin adds a fifth (or Nth) entry | Allowed; more than four songs in one rundown is a normal shape, not an exception (FR-29) |
| 1 | Admin names a new entry with a `variable_name` a deleted entry used to hold | Allowed (owner ruling, 2026-08-20) — a freed name MAY be reused by a later entry, no reservation and no tombstone. The new entry is a brand-new spine row; any of Hub's stale weekly values still stored under that name are not claimed by it |
| 2 | Admin authors that entry's Title/Verse/Reff appearance | There is nothing per-entry to author here — every Song Set entry shares the one Title/Verse/Reff trio (UC-14, AD-33); adding an entry never opens a new canvas |

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
