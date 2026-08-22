---
type: contract
component: presenter
lc: LC-17
direction: exposed
created: 2026-08-22
updated: 2026-08-22
---

# Contract — Remote control relay

## Source of truth

Nothing yet. **Every row below is `[MISSING]`** — FR-35 is promised and unbuilt, and this file is a
design, not an as-built record. The transport is this document's choice to make (G4); DEC-006 left it
open on purpose and `.what/_prd/operator-turn/addendum.md` § *FR-35* carries the candidate.

## Purpose

UC-29, FR-35, AD-37. Carries an Operator's control intents from a remote device to **the presenting
client**, which stays the only sender the projector follows. It is **not** a second presenter channel:
the remote never joins `BroadcastChannel`, and AD-10's laptop-to-projector leg is untouched by
everything here.

## The shape chosen, and why

**Server-Sent Events for server-to-client, ordinary POST for client-to-server.** Two streams, one per
role, both bounded by AD-37:

- The **presenting client** holds an open `GET` stream and receives intents.
- The **remote** POSTs an intent, and holds its own `GET` stream to receive the mirrored session state
  so the phone shows the same presenter view.

Chosen over WebSocket because it needs nothing beyond the Go standard library, survives nginx and
Cloudflare without upgrade configuration, and is one-directional per stream — which is the same shape
as a topology with exactly one controller. WebSocket remains available if bidirectional low latency is
ever shown to be needed; that would be a new decision, not a refactor.

Rejected: polling. An Operator advancing a slide expects the room to follow now, and an interval short
enough to feel immediate is a stream with extra steps.

## Operations

| Operation | Purpose | Realizes |
| --- | --- | --- |
| `POST /api/present/{id}/remote/pair` | The presenting client opens a pairing window and receives a short-lived code to display | UC-29 |
| `POST /api/present/{id}/remote/claim` | The remote presents that code and is bound to **one** presenting client | UC-29 · AD-37 |
| `GET /api/present/{id}/remote/stream` | The role-scoped SSE stream: intents to the presenting client, mirrored state to the remote | UC-29 |
| `POST /api/present/{id}/remote/intent` | The remote sends one intent: index, `blank`, `transition`, `background`, `scripture`, `clear-scripture` | UC-29 |
| `DELETE /api/present/{id}/remote/pair` | Either side ends the pairing deliberately | UC-29 |

**No new intent vocabulary is minted.** Those six are exactly the `PresentMessage` variants that
already exist (`src/lib/present-channel.ts`); the relay carries them, it does not extend them. A
seventh intent is a change to that module first, under AD-10, and only then to this contract.

## Five lanes

| Lane | Answer |
| --- | --- |
| Authentication | AD-5's gate matcher covers all five paths, and the assertion test ships in the same change set. Signed in as Operator is **necessary and not sufficient**: an intent is accepted only from a remote that holds a live pairing for that presenting client. AD-37 states this — reaching a screen is a deliberate act, never a consequence of authentication. |
| Validation | The intent body must be one of the six existing variants, shape-checked against the shared module's union. An unknown `type` is 400, not ignored — a silently dropped intent looks to the Operator like a dead remote. `planIdentity` travels with every intent and a mismatch is refused (AD-10, unchanged): the remote may be looking at a deck the laptop no longer has. |
| Error handling | **The room screen is never a casualty.** A relay that is slow, down, or restarted changes nothing about the laptop-to-projector path (AD-37): the presenting client keeps its `BroadcastChannel` and keeps driving. The remote shows its own connection as lost and stops accepting input rather than queueing intents to replay later — a slide advanced three minutes ago is not an instruction any more. A pairing whose presenting stream has gone is refused with 409 and the remote is told to pair again. |
| Rate limiting | One pairing per presenting client at a time; a second claim on a live pairing is refused rather than silently taking over, because two remotes is two controllers by another route. Pairing codes are single-use and expire; the window is short and exported once so both ends agree on one number, the same discipline AD-29 sets for the heartbeat pair. |
| Idempotency | Intents are **intended values**, not deltas — `blank: true`, an absolute index — so a duplicate POST is harmless and a lost one is corrected by the next. This is the property that makes an unreliable phone network survivable without a queue, and it is why no sequence number or ack pairing is layered on (AD-29's reasoning, applied to this leg). |

## Where the pairing lives

In the Go process's **memory**, in no table. It needs no startup DDL (AD-9) and no `data_version` bump
(AD-21), and an API restart ends every pairing rather than resurrecting one nobody remembers granting.
That is a deliberate trade: a restart mid-service costs the Operator a walk to the laptop, and the
alternative — a durable pairing table — buys convenience with a migration and a row that outlives the
session it describes. Whether a pairing should survive the presenting client's own page reload is a
narrower question and is open: **OQ-55**.

## What this contract MUST NOT become

- A path from the remote to the projector. The projector follows the presenting client and nothing else
  (AD-10 *Prevents*, AD-29).
- A way to edit a Service, the Registry, or a weekly value. It carries live control intents only.
- A dependency of the venue. If this whole file were deleted at runtime the service would continue.

## Evidence

| Claim | Label | Read to decide | Disposition |
| --- | --- | --- | --- |
| Every path, handler, stream and pairing store above | `[MISSING]` | `internal/httpapi/server.go` — no `/api/present/*` route exists; no SSE anywhere in the tree | FR-35 is promised and unbuilt. Planned work, not a `BUG-` |
| The six intents already exist as `PresentMessage` variants | verified | `src/lib/present-channel.ts` | Nothing new is minted; the relay carries them |
| No realtime transport exists in the repository today | verified | no match for `text/event-stream`, WebSocket, or `EventSource` under `internal/`, `src/`, `spa/` | DEC-006 admits the first one |
