---
type: sdd
component: presenter
status: draft
created: 2026-08-18
updated: 2026-08-22
realizes: [UC-11, UC-12, UC-13, UC-27]
binds: [AD-1, AD-5, AD-7, AD-10, AD-12, AD-23, AD-24, AD-25, AD-26, AD-27, AD-28, AD-29, AD-30, AD-33, AD-34]
reviewed:
  date: '2026-08-20'
  sha: 'ea54cdb3f80610648510ed95120b3c1b1afcbd30'
  lenses: [structure, prose, edge-case-hunter]
---

# SDD — Presenter

As-built. Offline guarantee is not this component's responsibility (AD-1).

## Decision Summary · [outline]

Presenter is three URLs: slideshow and projector on the projected SPA shell, plus presenter controls on the operator shell. Presenter↔projector sync is client `BroadcastChannel`, no WebSocket (AD-10); slideshow does not join the channel. On-demand verses use the local corpus via the Go API.

Expensive choice: one channel module `@/lib/present-channel`; Operator chrome does not paint the room screen (AD-24).

A live Verse/Reff background choice (UC-27, FR-33, AD-34) rides the same channel and the same shape as the
existing live transition override (AD-23): a session-only value, never persisted, resolved fresh from AD-33's
normal order on every new generate or Sync. No new boundary, no new table — LC-10 carries one more message
variant and LC-14 holds one more piece of session state.

## Structure · [outline]

| LC | type | Responsibility |
| --- | --- | --- |
| LC-9 | gateway | `GET /api/scripture` |
| LC-10 | gateway | presenter↔projector `BroadcastChannel` |
| LC-14 | service | index / blank / overlay / liveness session |

Direction: Operator controls → LC-14 → LC-10 → projector. Slideshow is a separate projected page; it does not join LC-10 and must not ack. LC-9 from the controls. Plan from LC-16 (Hub), which for a persisted Service reads the AD-16 snapshot and is served to both shells on `GET /api/services/[id]` (inventory row 35). Does not write Registry.

## Inherited Constraints · [guarded]

| AD | Quoted rule | How it lands here |
| --- | --- | --- |
| AD-1 | In-browser Web Slideshow / Presenter Mode are **shipped** (FR-15 / FR-16) but are **not** the hard offline Sabbath guarantee; PPTX download remains primary for venue reliability. | Slideshow is best-effort (OQ-5). |
| AD-5 | The Go API has one request gate, and its path matcher **is** the authorization boundary — anything it does not match is served with no session check at all | Scripture GET and the three screens are inside the matcher; no session → 401 / login, Deck unchanged. As-built until cutover: `internal/gate`. |
| AD-7 | `buildSlidePlan` is the single source of slide order and content for every surface. | Slideshow and projector do not order themselves. |
| AD-10 | presenter↔projector sync goes through the single `@/lib/present-channel` `BroadcastChannel` module; no surface opens its own channel name or message shape. | LC-10. Plan-identity clause not yet built (OQ-26, deferred-work). |
| AD-12 | `buildSlidePlan` outputs a fully hydrated AST (Fat Payload) with exact rendering coordinates, fonts, colors, and resolved text content. | Dumb renderer. |
| AD-23 | transition style is **one app-wide value** in `settings` (`slide_transition`), and each style is described **exactly once**, in `src/lib/transitions.ts` | Live-session override may travel on the channel; PPTX does not follow. |
| AD-24 | The room-facing surface is closed to operator chrome, in any form, under any setting: the projector, the web slideshow and the PPTX never read it. | Projected SPA shell. |
| AD-25 | A **shipped reference corpus** … is **developer-owned data with exactly one writer**, and the committed file is authoritative. | Verse tables. |
| AD-26 | **The corpus code is globally unique across locales, and it is the cross-boundary key** | Verse lookup. |
| AD-27 | A book has **one canonical identity, stable across every translation, carrying no display text at all.** | [PARTIAL] — the AD names book-name debt. |
| AD-28 | On an **operator surface** the scope is the **chosen translation alone** | Verse overlay. |
| AD-29 | a projector→presenter message may report **the sender's own condition and nothing else, ever** | Liveness. |
| AD-30 | The Operator UI and projector are a React SPA that MUST NOT open SQLite. | Screens and LC-10/LC-14 on `spa`; LC-9 on `api`. |
| AD-33 | Every Song Set entry, however many exist, shares one authored trio: **Title** is a free canvas with its own background, the same authority as `general`. **Verse** and **Reff** are free canvases too, but authored on a **blank** canvas — no background is chosen at authoring time; background resolves at hydrate/live time through AD-34's order. | Presenter renders whatever background AD-33's resolution order (plus this component's own live override, AD-34) hands it for the current Verse/Reff slide; it authors nothing (Registry's lane). |
| AD-34 | FR-33 lets the Operator change the background of the projected Verse/Reff slide during a live service … it travels over AD-10's channel carrying the same plan-identity discipline, is visible immediately on the projector, and touches neither the Service payload nor the Registry nor any table. It does not survive past that session … Ownership follows Supplement S11: Admin owns the Background Library and its global default; the Operator owns the moment. | LC-10 carries the override; LC-14 holds it in window memory only, for the length of one presenter session (UC-27). |

## Failure Behaviour · [guarded]

Process timeout: the Go API default. The "Next/Node default" this line used to name is gone — DEC-003 retired the Next.js shape and these three screens are Vite SPA routes under `spa/src/pages/`. Presenter does not retry to the client; the Operator presses again. No numeric per-route timeout was read [ASSUMED].

| Boundary | Slow | Absent | Lying | User | Logged |
| --- | --- | --- | --- | --- | --- |
| GET /api/scripture | Overlay waits. After timeout, fail closed (SCN-4); no retry | 500; empty corpus → 503 reported as absent (FR-22) | Ambiguous / not found → no guess (NFR-5, SCN-4). Empty `ref` → 400 (SCN-4, not a silent no-op). No session → 401. Unknown translation → 400 | Verse does not appear; Deck stays; Operator sees lookup failed | `console.error` on 500 (`internal/httpapi`) |
| LC-10 channel | Delayed message; no spinner on the room screen | Projector `lost` (AD-29). `BroadcastChannel` missing → no sync | Another tab on the same name; plan identity mismatch refuses the index (AD-10) | Control: `lost` verdict. Congregation: room-facing refuse copy, not an offset slide | — |
| LC-10 background override (UC-27) | Delayed message; projector keeps its last-known background until the message lands | No projector live yet: choice is held in LC-14 session state and applied on the projector's first sync (same shape as index/blank/transition) | Background Library empty → resolution falls through to AD-33's normal order, no error; plan identity mismatch refuses the override exactly as it refuses an index | Congregation: no visible change until a projector is live. Operator: no error — the choice is simply pending | — |
| /services/[id]/slideshow | Slow first load. After load, in-memory show may continue (OQ-5) | Required: missing Service → Hub, slideshow does not open (UC-11). As-built: `notFound()` → projected "Slides unavailable" [PARTIAL] | Plan failed | Required: Hub; PPTX remains the guarantee (OQ-26). As-built: black failure copy on this URL with run-sheet links [PARTIAL] | `console.error` on plan fail (`spa/src/pages/SlideshowPage.tsx`) |
| /services/[id]/present | Slow first load | Required: missing Service or plan → Hub as UC-11; presenter does not open (OQ-26). As-built: missing Service → `notFound()` [PARTIAL] | Plan failed | Required: Hub. As-built: error card on this URL (run-sheet / PPTX); `PresenterOperator` does not mount [PARTIAL] | `console.error` on plan fail (`spa/src/pages/PresentPage.tsx`) |
| /services/[id]/present/projector | Slow first load | Window closed → `lost`. Presenter open with no projector yet → AD-29 `no evidence yet` (silent), not `lost`. Missing Service → projected not-found | Slideshow tab answering as projector; a second projector window | Forbidden by AD-29; only one projector window may ack. Plan fail: black "Slides unavailable", no Operator chrome | `console.error` on plan fail (`spa/src/pages/ProjectorPage.tsx`) |

No server retry. Operator re-opens the URL or the projector from control.

## Robustness Analysis · [deep]

Presenter has no `critical` UC. ABCE below is for the UCs this component has (presenting), so `deep` is not empty on the design side.

| UC | Boundary in | Control | Entity | Boundary out |
| --- | --- | --- | --- | --- |
| UC-11 | `/slideshow` | slideshow page (not LC-14) | (read) Service + plan | projected screen; miss → Hub |
| UC-12 | `/present` + projector | LC-14 | ProjectorLiveness | LC-10 (index, overlay, blank) |
| UC-13 | verse form | LC-14 | BibleVerse (read) | projector overlay; refuse if projector not live |
| UC-27 | Background Library picker on presenter control | LC-14 | (read) session-only background override; no entity — never persisted (AD-34) | LC-10 background message → every live projector window |

Contracts: `02-contracts/`. No `06-flows/` — not money, not delete, not a third party. `01-ux/` skipped with `wdi-ux`.

## Evidence

| Claim | Label | Read to decide | Disposition |
| --- | --- | --- | --- |
| One GET scripture | verified | `internal/httpapi` scripture handler | empty `ref` → 400; 401 is the gate, not this file |
| Plan identity on PresentMessage | [MISSING] | spine AD-10 *Not yet closed*; `src/lib/present-channel.ts` `PresentMessage` union has no identity field | planned: AD-10 / OQ-26 / deferred-work; not a BUG until a wave closes it |
| Overlay on `sync` / request-sync resend of overlay | [MISSING] | `PresentMessage` `sync` is `index`, `blank`, `transition` only; `PresenterOperator` `currentState()` matches; `ProjectorClient` `setOverlay(null)` on `sync` | planned: OQ-25; not a BUG until a wave closes it |
| Unblank reveals overlay if still open | verified | `ProjectorClient.tsx` blank is a covering `z-50` layer; overlay state is not cleared by blank | matches OQ-25 / BR-6 |
| No projector → refuse verse lookup | [MISSING] | `PresenterOperator.pushScripture` fetches and broadcasts with no liveness check | planned: OQ-26 |
| Missing Service/plan → Hub | [PARTIAL] | `spa/src/pages/PresentPage.tsx`, `spa/src/pages/SlideshowPage.tsx`: missing Service → `notFound()`; plan fail → error card / black copy, `PresenterOperator` does not mount | required UC-11/OQ-26 is Hub; as-built is not a redirect |
| Presenter scripture fetch omits `translation` | [PARTIAL] | `PresenterOperator.pushScripture` query is `ref` only; route falls back to `DEFAULT_TRANSLATION` | AD-28 required param not yet on this caller |
| Projected shell is literal black | verified | AD-24; `tests/theme-chrome.test.mjs` guards it | — |
| LC-14 session in window memory | verified | `src/lib/present-channel.ts`; `PresenterOperator` refs; not a table | — |
| Live background override on `PresentMessage` | [MISSING] | `src/lib/present-channel.ts` union has no `background` variant; `transition` is the nearest existing shape it should mirror | planned: UC-27 / FR-33 / AD-34; not a BUG until a wave closes it |
| Background Library read by Presenter | [MISSING] | No Background Library reader exists yet in `src/lib/` at any layer this component can cite | planned: UC-27; Presenter only consumes a resolved image reference, it does not own the library (Admin/Registry's lane, DEC-004 S10/S11) |
| Group markers (Song Set, Announcement Set) never carry a slide number | [MISSING] | `src/operator/present/presenter-model.ts` groups contiguous SongSet children into one row today; an Announcement Set group row does not exist yet on this reader | planned: BR-9 / DEC-004 AD-35. The shared `@/lib/artifacts/preview-model.ts` labelling this reads from is also consumed by Hub's Service-form preview (`src/operator/CreateForm.tsx`, `EditForm.tsx`); a change there is cross-component drift, reported to Hub's G4, not made here |

---

## Slots

`01-ux/` is not written — belongs to `wdi-ux`. `02-contracts/` (00-inventory, scripture, present-channel). No `03-integrations/` (not a third party). `04-components/LC-14-session.md`. `05-model/data-model.md`. No `06-flows/` — not money, delete, or a third party.

## Open Items

OQ-5 · OQ-25 · OQ-26 · OQ-28 · OQ-29. Session display (showing / blanked / overlay) is ephemeral on the channel, not a table.
