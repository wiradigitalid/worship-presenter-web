# Manual acceptance checklist — one entry per FR

**Written:** 2026-08-22 · **Against:** `kodesh87/auto1`, deployed to dev · **Source of truth for the
promises:** `.control/registry/requirements.yaml`

This is the list of things a **person** has to check, because a test suite cannot. Everything here is
built and deployed unless the entry says otherwise. Where an entry says a promise is only partly built,
that is recorded rather than dressed up — testing something unbuilt wastes your time and teaches you
nothing.

Three FRs are **not** yours to test and are listed anyway so the list is complete: FR-3 is retired and
what you verify is its *absence*; FR-26 is automatic with no user action; FR-1 and FR-12 depend on the
Telegram sender, which is outside this team's release cycle.

**How to read an entry.** The bullet is the behaviour. The *fail* line is what going wrong looks like —
included because "it worked" is easy to say and easy to be wrong about.

---

## Getting in

### FR-18 — Per-person authentication with Admin and Operator roles

- Sign in as an Operator. Confirm you cannot reach `/admin` — it must refuse, not show an empty page.
- Sign in as an Admin. Confirm `/admin` opens and shows accounts, transition, language, retention.
- Sign out. Confirm going back in the browser does not show a signed-in page.
- Ask an Admin to change your password while you are signed in elsewhere, then act on the old session.
- **Fail looks like:** an Operator seeing any admin surface; a signed-out browser still rendering data.

### FR-25 — The Operator interface in the Operator's language

- Switch the interface language in `/admin`. Confirm the operator surfaces change — the Service form,
  the run sheet, the presenter controls, the remote screen.
- Look for any English text left behind on an otherwise Indonesian screen, and vice versa.
- **Fail looks like:** a stray untranslated label, or a literal `{n}` / `{label}` appearing on screen
  instead of a number or a name. That second one shipped once before.

---

## Making a Service

### FR-27 — Create a new Service from the Hub form

- Paste this week's Rundown into `/services/new`. Confirm a Service is saved and appears in the list.
- Paste something with no readable date. Confirm it refuses and says so — **no row is created.**
- Paste a partly unreadable Rundown that *does* have a date. Confirm it saves what it could read and
  names what it missed, rather than silently dropping it.
- Create a second Service for a date that already has one. Confirm it offers you the existing Service
  instead of quietly making a duplicate.
- **Fail looks like:** a dateless Service in the list; a silent duplicate; a parse miss you were not told
  about.

### FR-2 — Validate and resolve hymns by Song Book number

- Enter a hymn number that exists. Confirm the title resolves.
- Enter a number that does not exist in the selected book. Confirm you are told, at save time, which
  numbers failed.
- **Fail looks like:** a wrong hymn silently substituted, or a failure you only discover in the deck.

### FR-32 — Weekly song inputs match the configured song-set list

- In `/admin/artifacts` → Song Sets, add a song-set entry. Return to the Service form.
- Confirm the form now shows a group for that new entry, **without a redeploy**.
- Remove an entry in the Registry and confirm the form stops showing it.
- Create a Service with **more than four** songs. Confirm this is normal, not a limit you have to work
  around.
- **Fail looks like:** four fixed song slots; a new entry that needs a restart to appear.

### FR-23 — Resolve hymns from the selected Song Book, default SDAH

- Confirm the song-book picker offers SDAH and that it is the default.
- Set one song-set entry to a different book and leave another on the default. Confirm **two books in
  one Service** works and each song resolves from its own.
- **Fail looks like:** an empty picker; a book choice that is ignored at render time.

### FR-34 — Edit a song's lyrics for this Service only, and optionally save back to the Song Book

- Edit the lyric text of one song on the Service form. Generate. Confirm the deck shows your edit.
- Open a **different** Service using the same hymn. Confirm it still shows the original lyrics.
- Now press the separate save-to-book action. Confirm the correction reaches the song book, and a
  **newly created** Service starts from the corrected text.
- **Fail looks like:** an edit leaking into another Service, or a save-to-book that happens as a side
  effect of typing rather than by pressing the button.

### FR-6 — Non-song variable content on its slide kinds

- Fill the Family and Youth **names** and their requests. Generate. Confirm both names appear on the
  Family & Youth slide, in the preview and in the PPTX.
- Tick the closing-prayer checkbox. Confirm it copies the sermon speaker **once**.
- Now correct the sermon speaker's spelling. Confirm the closing-prayer name **stays what it was** —
  it must not follow.
- **Fail looks like:** a name you typed being overwritten when you edit a different field. That was the
  old behaviour and it destroyed entered data.

### FR-11 · FR-13 — Edit fields, and regenerate in place

- Change a field on an existing Service, save, and regenerate. Confirm the deck reflects the change and
  no other field moved.
- **Fail looks like:** regenerating altering data you did not touch.

### FR-28 — First save wins when edits collide

- Open the same Service in two browser tabs. Save in the first. Then save in the second.
- Confirm the second save is **refused** with a message, and offers you the current version — it must
  not silently overwrite.
- **Fail looks like:** last-write-wins. Your colleague's Friday review disappearing.

### FR-8 · FR-9 — List by date, and preview per slide

- Confirm the Service list is ordered by date and searchable.
- Confirm the Live Slide Preview shows a row per slide with a badge and a title.
- Confirm the badge reads `general`, `song-set-N`, or `ann-set-N` — and for a song-set child, its lyric
  role (`judul`, `bait 1`, `reff`).
- **Fail looks like:** a badge repeating the title; a badge showing an internal word like `song-lyric`;
  a literal `bait {n}`. All three of those shipped and were fixed — worth confirming they stayed fixed.

### FR-10 — Delete a Service and its assets

- Delete a Service that had an uploaded image. Confirm the row is gone after a refresh.
- Confirm an image still used by another Service or by the Registry is **not** deleted.
- **Fail looks like:** a broken image somewhere else after your delete.

---

## The Registry (Admin)

### FR-20 — Change a slide's layout

- Open `/admin/artifacts`, edit a slide's canvas: move a text box, insert an image, change the stacking
  order, make text bold or italic. Save, then reopen.
- Confirm everything came back exactly as you left it.
- Open a shipped seed layout and save it **without touching anything**. Reopen. Confirm nothing moved.
- **Fail looks like:** elements shifting on a save you did not intend to change anything with. That one
  shipped twice.
- **Not available on purpose:** underline. It cannot be saved by the server, so no control offers it
  (OQ-41).

### FR-21 — Change slide order and membership

- Reorder slides, delete one, add one. Restart nothing — just reload. Confirm the order held and the
  deleted slide stayed deleted.
- Press Reset on a shipped slide and confirm it returns to its original.
- Press Reset on a slide you authored yourself. Confirm no Reset is offered — there is no seed to go
  back to.
- **Fail looks like:** a deleted slide reappearing after a restart.

### FR-29 — Configure the song-set list

- Add, rename, and remove song-set entries. Confirm each change reaches the Service form.
- Delete an entry, then create a new one and give it the **same** name as the deleted one. Confirm this
  is allowed.
- **Fail looks like:** a name being permanently reserved after deletion.

### FR-31 — The background library and a global default

- Add images to the background library. Confirm non-images are refused.
- Set one as the global default.
- Generate a deck where a Verse/Reff slide has no weekly background chosen. Confirm it falls back to
  the global default; with neither set, confirm it renders on a blank canvas rather than failing.
- **Fail looks like:** a colour or gradient being accepted; a missing background breaking generation.

### FR-30 — An unrecognised token never blocks generation

- In a slide's text, type a token that does not exist, e.g. `{tidak_ada}`. Save.
- Confirm the editor **flags it at save time**.
- Now generate the deck. Confirm generation **succeeds** and the token renders as nothing.
- **Fail looks like:** a typo stopping the Sabbath deck from being produced.

### FR-7 — One elegant transition chosen by Admin

- Choose a transition in `/admin`. Confirm the downloaded PPTX uses it and the browser slideshow
  matches.
- **Fail looks like:** the PPTX and the slideshow disagreeing.

### FR-24 — Browse installed corpora by language

- In the admin corpora settings, confirm each installed bible translation and song book shows its
  language, and that the default filters what is *displayed* without hiding data you can still choose.
- **Fail looks like:** a language setting that removes a translation from the list entirely.

---

## The Sabbath itself

### FR-14 — Download a PPTX that presents fully offline

- Download the PPTX. Move it to a laptop, **disconnect that laptop from the network entirely**, and
  present it.
- Confirm every slide renders — images included — with no hub, no wifi, nothing.
- **This is the guarantee the whole product is built around.** Everything else is convenience.
- **Fail looks like:** a missing image, a blank slide, or anything that needs a network.

### FR-17 — The full worship order as a Run-Sheet

- Open the run sheet and confirm it shows the whole order in sequence, in a form you could actually
  follow during a service.

### FR-4 · FR-5 — Assemble a Deck; render a song block into readable lyric slides

- Generate a deck for a real Rundown. Confirm the slide order matches the worship order.
- Confirm a hymn breaks into slides at sensible points, and that where you put a **blank line** in the
  lyric text is where the slide breaks.
- Confirm a refrain appears where it should, and that a song with different refrains per verse keeps
  each one.
- **Fail looks like:** lyrics running off the slide; every refrain collapsing into the first one.

### FR-15 — Fullscreen slideshow

- Present the slideshow fullscreen. Confirm slides, order and transition match the PPTX and that
  advancing is linear.

### FR-16 — Two-screen presenter

- Open the presenter, open the projector on the second screen.
- Advance on the operator screen and confirm the projector follows.
- Blank the screen. Confirm the projector goes black **and the position is not lost** — unblank returns
  to the same slide.
- Close the projector window. Confirm the operator screen reports it as lost.
- **Fail looks like:** the two screens showing different slides.

### FR-19 — Search and display an on-demand verse

- With the projector live, look up a verse. Confirm it appears on the projector in the chosen
  translation, and that closing it returns to the deck slide.
- Try an ambiguous reference and an empty one. Confirm it refuses rather than guessing.
- **Fail looks like:** a guessed verse. Wrong scripture in front of a congregation.

### FR-22 — Verses from the selected translation, default KJV

- Confirm the default translation is KJV and that choosing another changes what the projector shows.

### FR-33 — Change the live Verse/Reff background during the service

- Mid-service, with the projector live, pick a different background for the Verse/Reff slides.
- Confirm the projector changes **immediately**.
- Confirm the Service payload did not change and you did not have to regenerate.
- Now regenerate or Sync. Confirm the background resolves through the normal order again, as if the live
  override never happened — it is not meant to persist.
- **Fail looks like:** a live choice being written into the Service, or surviving into next week.

### FR-35 — Control the presenting laptop from a phone *(new, needs the most attention)*

- On the laptop: sign in, open a Service, press Present. A pairing code appears.
- On the phone: sign in, open the **Remote** link from the run sheet, enter that code. The presenter view
  appears on the phone.
- Standing away from the laptop, from the phone: advance a slide, blank and unblank, change the live
  background, put a verse up. **The room screen must follow each one.**
- Confirm the phone **shows** the current position and blank state, not just buttons.
- Ask someone else signed in on another device, who has **not** paired, to try to control it. Confirm
  they cannot.
- **Then the one that matters most:** lock the phone, or turn its data off. **Confirm the laptop keeps
  driving the service exactly as before.**
- **Fail looks like:** the room screen freezing, jumping, or going blank because a phone went away. That
  would be a serious defect — the laptop-to-projector path is designed to never depend on the phone.
- **If the remote seems dead while the rest of the app is fine,** suspect proxy buffering first and tell
  me; that is the one failure mode with a known cause and a one-line fix.

---

## Not yours to test

### FR-3 — *(retired)* Manage the announcement list across weeks

Withdrawn and replaced by FR-21. What to verify is its **absence**: there is no Announcements menu, no
Announcement Flyers card on either Service form, and announcement content is composed only in
`/admin/artifacts` → Announcement Sets. If you find a way to compose announcements outside the Registry,
something was not removed.

### FR-26 — Auto-delete expired PPTX files

Automatic, with no user action — its own registry entry says so. If you want to see it, set the
retention days in `/admin` and check that old cached decks disappear; there is nothing to press.

### FR-1 · FR-12 — Telegram intake and Telegram correction

Both depend on the external Telegram sender, which is outside this team's release cycle, and both carry
**known gaps that are recorded rather than fixed**: a Rundown with no readable date is still inserted
using today's date instead of being refused, and an image that fails to attach does so without saying
so. Do not spend your time here expecting it to be finished. Filed under OQ-27.

---

## What this list cannot cover

This project has **no component testing** — every UI test is a source scan — so nothing here was
verified by a machine pressing a button. That is why the list exists.

Seven decisions are waiting on you and each changes what "correct" means for something above:
**OQ-41** underline, **OQ-42** the Telegram webhook still accepting an ignored `announcements[]`,
**OQ-43** orphan uploads, **OQ-44** emphasis on token-bound elements, **OQ-45** a preview refresh that
fails after a successful sync, **OQ-46** name length bounds, **OQ-48** whether an Admin may delete a
song book at all, and **OQ-53** to **OQ-55** on the remote's pairing. They are in
`.control/questions/assumptions.md` with a stated assumption each; the build followed the assumption.
