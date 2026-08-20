---
type: domain
component: registry
created: 2026-08-19
updated: 2026-08-20
---

# Deck frame

The Artifact Registry is the source of *which slides exist* and *their order*, and — since DEC-004 — of announcement/flyer **composition** too (each Announcement Set is its own Registry-authored ordered list). This note is the worship-order shape that frame encodes. Weekly names, prayers, hymn choices, and Family/Youth photos are Service payload (Hub), not Registry.

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

**Frame (Registry / standing text):** sequence agendas, dividers, standing liturgy, offering and contact layouts, midweek notice layout, welcome/closing frames, and — since DEC-004 — every Announcement Set's own slide content and order (composed once by Admin, not per week).

**Weekly (Hub Service payload):** song numbers/books/backgrounds for however many Song Set entries Admin has configured, any lyric overrides for this Service only, verse reading, sermon speaker and title graphic, closing-prayer person, family/youth text and photos, optional theme-verse rotation. Which Announcement Sets appear, and in what order, is decided once on the main spine (Registry), not per Service.

**Printed on slides, of the weekly roster:** sermon speaker, closing-prayer person, family/youth of the week. Other rundown roles stay on the Run-Sheet (FR-17), not on the Congregation screen.

## Song Set entries — admin-configurable, not four fixed slots

**Superseded by DEC-004.** Opening/closing of Bible Talk and Divine Service are the default seed of **N** Admin-defined Song Set entries, not a ceiling — Admin adds, renames, or removes entries directly in the Registry (FR-29), and a rundown with more than four songs is a normal shape. Each entry's identity (`variable_name`) still belongs to the system, never a positional `song1` field. Each hymn is one Title slide plus N Verse/Reff slides from the lyrics; every entry shares the one Title/Verse/Reff layout trio (Verse/Reff authored on a blank canvas, background resolved at hydrate/live time). How lyric pages join and split is Hub LC-16 (FR-5, BR-6).

## What this is not

A dump of one week's source deck. Fonts, embedded video, and live payment artwork are implementation and private-data concerns, not frame.
