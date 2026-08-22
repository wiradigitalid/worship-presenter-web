---
type: scn
id: SCN-6
component: presenter
attaches_to: UC-29
created: 2026-08-22
updated: 2026-08-22
---

# SCN-6 — The remote drops mid-service and the room screen does not notice

## Where it branches

UC-29, at every step after the remote is paired. This branch is not an edge case in the usual sense —
on a phone, on a hall's wifi, during a two-hour service, it is the expected case at least once.

## Condition

Any of: the phone loses signal, the screen sleeps, the browser tab is discarded to reclaim memory, the
Operator walks out of range, the battery dies, or the Go API restarts.

## What must happen

1. **The room screen changes nothing.** Whatever slide was showing keeps showing. Blank stays blank if
   it was blank. The projector is following the presenting client, and the presenting client did not
   move (AD-37).
2. **The Operator at the laptop keeps full control**, unaware anything happened unless they look.
3. **The remote shows its own connection as lost and refuses input.** It does not accept a tap and
   hold it. A control that looks alive while nothing reaches the room is worse than one that plainly
   says it is dark.
4. **No intent is queued for replay.** When the remote returns it re-reads the current session state
   and shows that. A slide advanced three minutes ago is not an instruction any more, and replaying it
   would move the congregation backwards for a reason nobody in the room could see.
5. **The projector's liveness verdict does not move.** AD-29 owns that predicate and a remote is not one
   of its inputs. A dead remote and a dead projector are different facts, and reporting the first as the
   second would send the Operator hunting for a second screen that is working fine.
6. **On return, no re-pairing is needed** as long as the pairing itself is still live — the drop was the
   stream, not the grant. If the pairing has ended, because the presenting client reloaded or the API
   restarted, the remote is told to pair again rather than silently reconnecting to nothing.

## Why it is written down

The whole feature is safe only because of step 1, and step 1 is the property most easily lost while
making the rest work well. A queue for reliability (step 4), a shared liveness indicator for tidiness
(step 5), or an intent buffer that flushes on reconnect all look like improvements and each one breaks
the service in front of a congregation. This scenario exists so a builder reads them as forbidden rather
than as clever.

**A test for FR-35 that never disconnects the remote mid-service has not tested FR-35.**

## Open

Whether a pairing survives the presenting client's own page reload: **OQ-55**. Whether a second remote
may ever be admitted: **OQ-54**. The code lifetime and freshness window: **OQ-53**.
