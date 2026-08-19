---
title: "Worship Presenter Web"
status: draft
created: 2026-08-18
updated: 2026-08-19
---

# Product Brief: Worship Presenter Web

Client: **Church Name**. Structured identity: `.control/registry/index.yaml`.

## Executive Summary

Every Sabbath, an Operator presents a worship Deck of ~68 slides. Today one person assembles it by hand: copy last week's file, swap songs, names, posters, announcements. Roughly one hour a week — ~52 hours a year — from a volunteer who could otherwise be used for something else. Only that person can do the work. Last-minute changes almost never make it in. Off-the-shelf worship software that was tried failed because it had to be installed on the Operator's laptop, and then only one person understood it.

This product turns the weekly Deck into a **generated artifact**. The Operator (multimedia team) logs into a Hub, enters this week's Rundown, and the application assembles the presentation from a fixed frame plus that week's content. Friday review stays in that Hub. An **offline PPTX** means Sabbath does not depend on venue internet.

Telegram intake via picoclaw is the intended later channel — cheaper and more familiar for Events — and is **out of this phase**. Web first, because it is cheaper to land and easier to stabilize on the system we already run.

The promise is narrow and honest: assembly hours disappear, the Operator turn widens to anyone on the multimedia team, and the tool is **used every week** — not a trial that gets abandoned.

## The Problem

One volunteer rebuilds the Sabbath Deck every week. That work is fragile at four points:

- **Lyrics are a time sink and an error sink.** Four hymns become dozens of slides typed by hand. A typo has appeared in front of the congregation.
- **Last-minute changes are almost impossible.** Swapping a song on Saturday morning, in a copy-paste workflow, practically never happens.
- **Last week's leftovers leak through.** A new Deck starts from the old file; stale content sometimes reaches the screen.
- **Continuity sits with one person.** Only the current builder can produce a Deck. Every time the person changes, the setup is lost and the tool is replaced.

The status quo works, but it consumes ~52 hours a year, parks skilled people in data-entry, refuses late changes, and breaks when the person rotates.

Events handing a Rundown on Telegram is **not** this phase's problem. This phase is: the multimedia Operator can generate a Deck without PowerPoint assembly.

## The Solution

A web application that assembles a Deck from a Rundown the Operator enters in Hub, not from last week's PowerPoint file.

1. **Gather.** The Operator logs in and enters this week's participants, hymn numbers, posters, and announcement instructions in Hub.
2. **Interpret.** The application fills that week's payload and resolves lyrics from the Song Book by number (not free web search).
3. **Assemble.** The fixed frame (opening, dividers, liturgy, offering, closing) combines with variable content (songs, verses, sermon, family/youth, flyers). Each week is one dated **Service**.
4. **Friday review.** The Operator matches the Run-Sheet and data, edits if wrong, regenerates, downloads the PPTX to the presentation laptop.
5. **Sabbath.** The Operator presents the already-downloaded file. The projector is clean; the Operator laptop shows presenter view (current/next slide + Run-Sheet). Venue internet may be down.
6. **Clean.** A Service and its assets can be deleted per week so storage does not grow without bound.

The Hub is a logged-in Service list — not a public site. The in-browser slideshow is a complement; **the Sabbath guarantee is the offline PPTX**.

## What Makes This Different

Not because it can generate slides — FreeWorship, OpenLP, ProPresenter already can. The difference is *how people get there*:

- **Zero install on the Operator laptop.** The reason desktop trials were abandoned.
- **The Operator works in a browser Hub**, not in last week's PowerPoint file.
- **No single gatekeeper.** Knowledge lives in the flow, not on one laptop.
- **The Deck follows this congregation's pattern**, rather than forcing worship into a generic tool's structure.
- **Fast revision.** Change the fields, regenerate.

Telegram-where-Events-already-talk is the later channel, not a current differentiator. Another honest reason: **ownership** — a solo developer masters the frame. That is not a technical moat.

## Who This Serves

| Role | Need | Tier |
|---|---|---|
| Operator (multimedia team) | Log in, enter this week's Rundown, run Sabbath without assembling 68 slides; Friday review ≤ 10 minutes; offline PPTX on the venue laptop | **primary** |
| Admin | Manage accounts and settings without nursing the system every week | secondary |
| Solo developer | Maintain Hub and generate alone; picoclaw later | secondary |
| Client (Church Name) | Worship displayed correctly every Sabbath, without depending on one volunteer | secondary |
| Congregation | Never open the tool; experience a cleaner screen and late changes that still make it in | secondary |
| Events | Later: hand over a Rundown on Telegram without opening Hub or presentation software | secondary |

## Goals

- **BG-1** — The Sabbath Deck is generated from a Rundown, not assembled by hand, every week.
- **BG-2** — Anyone on the multimedia rotation can review and present a Service, without Deck-assembly skill.
- **BG-3** — Sabbath does not depend on venue internet: the PPTX is already on the laptop before worship.

## Success Criteria

Primary measure: the church uses it **every Sabbath for one quarter (~13 consecutive weeks)**.

Supporting: hand assembly of ~1 hour becomes Friday review ≤ 10 minutes; the Operator turn is no longer = the person who can do PowerPoint; a late song swap regenerates in ≤ 5 minutes; no leftover last-week content on screen; lyrics come from the Song Book, not typing.

## Scope

### Scope In

- Operator logs into Hub and creates a Service from this week's Rundown (paste or form).
- Lyrics from the Song Book by number; not free lyric search.
- Generate Deck: song title + lyrics, verses, sermon + graphics, family/youth, finished announcement images. Only names that actually print on the Deck.
- Logged-in Hub: Service list, preview, edit-and-regenerate, download PPTX, delete per week.
- Full worship-order Run-Sheet (roles, names, songs, times) for the Operator.
- Presenter view: clean projector + Operator screen (current/next + Run-Sheet).
- One fade transition.

### Scope Out

- Telegram intake via picoclaw (last phase; same intake PRD, later capability).
- Events handing over a Rundown without opening Hub.
- Multi-church / a per-church flow that can be configured.
- Contemporary songs outside the Song Book.
- Generating flyers from data (flyers are uploaded already finished).
- Printing participant roles that the Deck does not show (that belongs on the Run-Sheet).
- Many transition types.
- Live control in the ProPresenter style (reorder on stage); the product produces a linear Deck.

## Constraints

- The Hub is **not public**; access is by account.
- **Current intake is the logged-in Hub.** Telegram and picoclaw MUST NOT be treated as this phase's handover path.
- The Sabbath presentation **must not** depend on venue internet — the offline PPTX is the guarantee, not an optional fallback.
- This repo is **public**: congregation data, photos, prayers, payments, and source Decks **do not** enter git.
- Lyrics **only** from the shipped Song Book; not free upload or web search.

## Assumptions

- [ASSUMED] The Operator has this week's Rundown content in time to enter it in Hub. Wrong: no Service that week. (OQ-17)
- [ASSUMED] One church, one worship flow, for this product's scope. Wrong: Scope In is not enough; that is a second product or a new PRD. (OQ-2)
- [ASSUMED] The venue has a laptop that can play PPTX (PowerPoint or equivalent). Wrong: the offline guarantee is not fulfilled. (OQ-3)

## Prerequisites

- The Song Book corpus (and the shipped scripture translations) is in the repo — already met.
- `AUTH_SECRET` / `WEBHOOK_SECRET` secrets and a durable path for the database on the host — not yet met; waiting on the production host (OQ-4 in `.control/questions/external.md`). A go-live requirement, not G1. `WEBHOOK_SECRET` is for the later Telegram path.

## Vision

If this sticks, Events send the Rundown on Telegram, picoclaw interprets, and the Operator only reviews. Other churches have other flows; per-congregation configuration is vision, not Scope In.
