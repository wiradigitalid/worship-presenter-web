---
type: scenario
id: SCN-4
component: hub
realizes: [UC-28]
created: 2026-08-20
---

# SCN-4 — Save-to-Book races a changed song number

## Setup

The Operator opens Song Set entry `opening_song_bt` for this Service. It currently resolves to Hymn
`SDAH 159`. The Operator edits the lyric text in the editor, meaning to fix a line break, then before
saving, either:

- (a) the Operator themselves changes the entry's weekly song number to a different hymn, or
- (b) another Operator/Admin edits this same Service concurrently and changes that song number first.

The Operator then presses the separate "Save to Song Book" action, still looking at the lyric text
they typed against `159`.

## Branch (a) — same Operator changed the number first

The editor's own displayed hymn number has already moved to the new number by the time "Save to Book"
is pressed — the UI carries one current song number for that entry, not two. The save writes the
edited text against whichever hymn number is showing at the moment of the press. There is no race:
the Operator sees which hymn they are about to correct before confirming.

## Branch (b) — a concurrent edit changed the number first

This is the real race. The Operator's screen still shows `159` because they have not refreshed since
someone else's save landed.

- The regular Service save (BR-4) already refuses this on `updated_at` staleness — so if the Operator
  saves the Service fields first, they hit the ordinary conflict (SCN-2) before "Save to Book" is even
  reachable against stale state.
- If "Save to Book" is a separate action reachable without a fresh Service save (e.g. it fires
  immediately, independent of the Service's own save cycle), it MUST carry the same precondition: the
  hymn number it is about to write against is re-read at the moment of the press, not trusted from the
  stale screen. A mismatch refuses the corpus write with "song changed under you" and leaves the
  Service-level override (this Service's own text) unaffected, since that already saved separately.

## Outcome

The Song Book is never corrected against the wrong hymn number. Refusing on a stale hymn number, not
guessing which one the Operator meant, is the same fail-closed posture BR-4 and AD-25 already take
elsewhere in this component.

## Open note

This scenario assumes "Save to Book" is its own request distinct from the Service PUT, since typing
alone must never trigger it (S12) and it needs its own precondition check against the corpus write it
performs into `hymns` — a write path AD-25 once forbade outright and DEC-005/AD-36 now sanctions for
the song book half only (see UC-28's routed drift note). The exact request shape is a design choice for
`wdi-decision`/build, not fixed here.
