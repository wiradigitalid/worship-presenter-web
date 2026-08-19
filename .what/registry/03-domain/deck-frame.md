---
type: domain
component: registry
created: 2026-08-19
updated: 2026-08-19
---

# Deck frame

The Artifact Registry is the source of *which slides exist* and *their order*. This note is the worship-order shape that frame encodes. Weekly names, prayers, and flyers are Service payload (Hub), not Registry.

## Geometry

- Widescreen **16:9**. Text sits in free-floating boxes at absolute coordinates — not PowerPoint placeholders.
- A generated Deck is on the order of **~68 slides** for a full Sabbath with four hymns. Hymn length changes the count; announcement flyers change it too.
- Operator chrome never reaches these slides. Projected appearance is the Registry canvas (AD-20).

## Three macro-sections

The shipped seed follows one congregation's order. Admin may reorder (UC-15); the product does not ship a second frame.

| Part | Role in the hour | Typical contents |
| --- | --- | --- |
| Bible Talk | Opening block | Welcome, sequence agenda, two song blocks, verse reading, break/offering divider |
| Divine Service | Main block | Sequence agenda, theme verse, two song blocks, prayer liturgy, special song, sermon, closing prayer, fixed sung response |
| Announcements | Closing block | Repeat welcome, standing offering/contact slides, family/youth of the week, midweek notice, variable flyer slides |

## Fixed frame vs weekly payload

**Frame (Registry / standing text):** sequence agendas, dividers, standing liturgy, offering and contact layouts, midweek notice layout, welcome/closing frames.

**Weekly (Hub Service payload):** four hymn numbers and their lyrics, verse reading, sermon speaker and title graphic, closing-prayer person, family/youth text and photos, announcement flyers (variable count), optional theme-verse rotation.

**Printed on slides, of the weekly roster:** sermon speaker, closing-prayer person, family/youth of the week. Other rundown roles stay on the Run-Sheet (FR-17), not on the Congregation screen.

## Four SongSet slots

Opening and closing of Bible Talk, opening and closing of Divine Service. Slot identity belongs to the system (glossary), not to a positional `song1` field. Each hymn is one title slide plus N lyric slides. Verse lines join into continuous prose; refrain repeats after each verse; a long verse still splits on the plan's character budget (FR-5, BR-6, LC-16).

## What this is not

A dump of one week's source deck. Fonts, embedded video, and live payment artwork are implementation and private-data concerns, not frame.
