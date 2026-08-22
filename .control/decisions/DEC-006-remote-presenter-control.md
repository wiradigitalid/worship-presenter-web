---
type: course-correction
id: DEC-006
status: applied
touches:
  - .how/_platform/ARCHITECTURE-SPINE.md
  - .control/registry/usecases.yaml
  - .what/presenter/SRS-presenter.md
supersedes: AD-10
superseded_by: null
created: '2026-08-22'
---

# DEC-006 — A server realtime channel is admitted, for the remote-to-laptop direction only

## Decision

> **A server realtime channel is admitted between a remote control device and the presenting
> laptop, and only there.** The laptop-to-projector path stays exactly as AD-10 built it: a
> client-side `BroadcastChannel`, on one device, with no server in it. The phone sends **intents to
> the laptop**; the laptop remains the only sender the projector follows. This decision
> **supersedes AD-10 in part — its "no server realtime channel" clause only, and only for the
> remote-to-laptop leg.** Every other clause of AD-10 stands unqualified: the single channel module,
> the ban on a surface inventing its own message shape, plan identity on every message, and a
> receiver refusing an index it cannot vouch for.

## Why

FR-35 promises the Operator can control the presenting laptop from a phone. `BroadcastChannel`
reaches only tabs of the same browser on the same device, so the promise is unreachable without a
transport that crosses devices. There is no way to keep the clause and keep the promise.

AD-10 anticipated this exact moment and wrote its own exit: *"No server realtime channel
(WebSocket/SSE) is introduced **unless product direction changes**."* The owner asking for a phone
remote on 2026-08-22 is that change of direction. This decision records it rather than letting a
future wave read the clause as still absolute.

## What is deliberately not changed, and why that matters more than what is

AD-10's *Prevents* is **"a split sync topology where the projector follows one controller and
ignores another"**, and AD-29 adds that admitting a second sender on that channel **"is a new
decision, not an implementation choice"**. Both survive intact, because the remote is an **input to
the single controller**, not a second controller:

- The projector follows the laptop, and nothing else, exactly as before.
- The phone never opens the presenter channel. It has no `BroadcastChannel` peer to talk to.
- No new message variant is minted. The intents already exist — index (inside `sync`), `blank`,
  `transition`, `background`, `scripture`, `clear-scripture`.

The owner was offered the alternative — a phone that drives the projector with the laptop off — and
chose against it. That shape would have required overturning AD-10's *Prevents* and AD-29's
one-sender rule, which is a far larger decision than this one.

## The invariant this decision is bounded by

**The venue path does not acquire a connectivity dependency.** The laptop keeps driving the room
screen when the remote is closed, asleep, or off the network. This is not a quality target; it is
the boundary that makes the change safe:

- AD-1 makes the offline PPTX the Sabbath guarantee.
- AD-10's stated reason for staying client-side was *"keeping the venue path independent of hub
  connectivity"* — and that reason is preserved for the leg it was written about.

A design that puts the server in the laptop-to-projector path has not implemented this decision; it
has replaced it.

## Cost, accepted

- **The remote needs the network; the service does not.** If the hub is unreachable the phone stops
  controlling and the laptop carries on. That asymmetry is the point, and it is also the cost: the
  remote is the first feature in this product that simply does not work offline.
- **A new always-on responsibility in the Go API.** AD-30 already makes it the only always-on
  server, so this adds surface rather than a process — but a long-lived stream is a shape this API
  has never carried, and idle connections, restarts and reconnection all become its problem.
- **A new authorization surface.** AD-5 makes the path matcher the authorization boundary, so every
  new path ships inside it with its assertion test in the same change set. Being signed in cannot be
  what selects which laptop a remote drives; that selection is a deliberate act, per FR-35.

## Alternatives considered

- **Keep `BroadcastChannel` and pair devices peer-to-peer (WebRTC).** Rejected: it needs a signalling
  server anyway, so the connectivity cost is not avoided, and it adds NAT traversal and a second
  realtime stack for no gain.
- **WebSocket instead of SSE plus POST.** Not rejected on merit, and not decided here — the transport
  belongs to G4, where this component's design is written. Recorded so the mechanism argument is not mistaken for this decision's content:
  SSE plus POST needs nothing beyond the Go standard library, survives proxies without upgrade
  configuration, and is one-directional per stream, which matches a one-controller topology.
- **Poll the API instead of streaming.** Rejected: an Operator advancing a slide expects the room to
  follow now, and a poll interval short enough to feel immediate is a stream with extra steps.

## Trace

- Promise: **FR-35** (`.what/_prd/operator-turn/prd.md` § 4.4), capability **CAP-6**.
- Supersedes in part: **AD-10** — the "no server realtime channel" clause, remote-to-laptop leg only.
- Untouched and still binding: **AD-1**, **AD-24**, **AD-29**, **AD-30**, and every other clause of
  AD-10.
- Mechanism notes, deliberately outside the PRD: `.what/_prd/operator-turn/addendum.md` § *FR-35*.
- Owner accepted the shape and this decision on 2026-08-22, and it was applied the same day:
  AD-10 carries the supersession note, **AD-37** states the invariant, UC-29 is catalogued against
  FR-35, and the presenter SRS carries the constraint a reader of that component meets first.
- Endpoint and screen rows are **not** part of applying this decision. Those inventories are derived
  from code in this product, and nothing is built yet; they land with the wave that builds it.
