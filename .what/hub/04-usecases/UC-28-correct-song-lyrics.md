---
type: uc
id: UC-28
component: hub
satisfies: [FR-34]
critical: true
created: 2026-08-20
---

# UC-28 — I correct a song's lyrics for this Service, and optionally save the fix back to the Song Book

## Trigger

The Operator, filling in or editing this week's Service, opens a Song Set entry and sees the hymn's
lyrics rendered as editable text.

## Precondition

The Operator is signed in. The Service exists (create or edit). The Song Set entry already has a
resolvable song number (its own weekly `<var>_song_number`, or none yet — see Alternate Flows).

## Main Flow

1. The Operator opens a Song Set entry's lyric editor. The text shown is this Service's own override
   if one is stored, otherwise the Song Book's text for that hymn number (BR-7 resolution order).
2. The Operator edits the text — moving a paragraph break, fixing a line, splitting a stanza. A blank
   line the Operator leaves in place becomes a hard slide break at generate time (BR-6 / DEC-004 S7 L5).
3. The Operator saves the Service (the same save as UC-5).
4. The system stores the edited text as this Service's own lyric override. The Song Book's `hymns` row
   is untouched (BR-7).
5. Generate / preview (UC-6, UC-8) reads this Service's override in place of the Song Book text for
   that Song Set entry (LC-16 resolution order).

## Alternate Flows — explicit save to Song Book

| From step | Condition | What happens |
| --- | --- | --- |
| 2 | The Operator presses the separate "Save to Song Book" action beside the editor | The current editor text is written into the Song Book's `hymns` row for that hymn number, in addition to standing as this Service's override; every future Service resolves to the corrected text until edited again (BR-7, DEC-004 S12) |
| 1 | The Song Set entry has no song number yet (weekly input not entered) | No lyrics to show; the editor is empty and disabled until a song number resolves a hymn (FR-32 precondition) |
| 1 | The song number does not resolve in the Song Book (unknown hymn) | The editor is empty; the Operator may still type an override, which stands as this Service's content — there is nothing in the Song Book yet to save back to (SCN-1 applies to the number lookup, not this override) |

## Failure Flows

| From step | Failure | What the system does | What the user is left with |
| --- | --- | --- | --- |
| 3 | Someone else already saved the Service first | Rejects the whole save, lyric override included; Operator must re-read (BR-4, SCN-2) | On-screen lyric edit is not silently lost — it is not stored, and the Operator sees the conflict same as any other field |
| 4 (save to book) | The song number changed (or the entry was retargeted to a different hymn) between opening the editor and pressing "Save to Book" | Refuses the corpus write; the Service-level override still saves normally with the regular save | The Operator sees a "song changed under you" message and re-opens the editor against the new hymn before trying again (SCN-4) |
| 4 (save to book) | The Song Book write itself fails (disk / DB error) | This Service's own override is unaffected — it already saved via the normal Service save path — but the "save to book" attempt reports its own failure | Operator sees a distinct error for the book-write; the week's Deck is correct regardless |

## Outcome

This Service's Song Set entry renders with the Operator's corrected lyrics. The Song Book gains the
correction only when the Operator took the separate, explicit action.

## Business Rules

BR-7

## Note — the AD-25 conflict is resolved (DEC-005 / AD-36)

FR-34 / DEC-004 Supplement S12 requires a write path into the `hymns` table. AD-25 ("A Shipped
Reference Corpus Is a Projection of Its Committed File") used to state plainly that no such path
existed and that adding one "reopens this decision before it ships." That conflict is closed: the
owner ratified that the song book becomes administrator-owned after its one-time bootstrap (DEC-005),
and AD-36 supersedes AD-25 in part — the song-book half only — to say so as a living rule. The bible
family stays fully under AD-25, untouched. This use case's Alternate Flow is no longer blocked; see
`06-flows/lyric-save-to-book.md`.
