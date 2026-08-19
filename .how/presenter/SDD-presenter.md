---
type: sdd
component: presenter
status: draft
created: 2026-08-18
updated: 2026-08-19
realizes: [UC-11, UC-12, UC-13]
binds: [AD-1, AD-5, AD-7, AD-10, AD-12, AD-23, AD-24, AD-25, AD-26, AD-27, AD-28, AD-29]
reviewed:
  date: '2026-08-19'
  sha: '02f8d3a124a8c4d4e266ec005f8fc0495879914e'
  lenses: [structure, prose, edge-case-hunter]
---

# SDD — Presenter

As-built. Offline guarantee is not this component's responsibility (AD-1).

## Decision Summary · [outline]

Presenter is three URLs: slideshow and projector at the `(projected)` root, plus presenter controls under `(operator)`. Presenter↔projector sync is client `BroadcastChannel`, no WebSocket (AD-10); slideshow does not join the channel. On-demand verses use the local corpus.

Expensive choice: one channel module `@/lib/present-channel`; Operator chrome does not paint the room screen (AD-24).

## Structure · [outline]

| LC | type | Responsibility |
| --- | --- | --- |
| LC-9 | gateway | `GET /api/scripture` |
| LC-10 | gateway | presenter↔projector `BroadcastChannel` |
| LC-14 | service | index / blank / overlay / liveness session |

Direction: Operator controls → LC-14 → LC-10 → projector. Slideshow is a separate projected page; it does not join LC-10 and must not ack. LC-9 from the controls. Plan from LC-16 (Hub), which for a persisted Service reads the AD-16 snapshot. Does not write Registry.

## Inherited Constraints · [guarded]

| AD | Quoted rule | How it lands here |
| --- | --- | --- |
| AD-1 | In-browser Web Slideshow / Presenter Mode are **shipped** (FR-15 / FR-16) but are **not** the hard offline Sabbath guarantee; PPTX download remains primary for venue reliability. | Slideshow is best-effort (OQ-5). |
| AD-5 | `src/proxy.ts` is the one request gate, and its `config.matcher` regex **is** the authorization boundary — anything it does not match is served with no session check at all | Scripture GET and the three screens are inside the matcher; no session → 401 / login, Deck unchanged. |
| AD-7 | `buildSlidePlan` is the single source of slide order and content for every surface. | Slideshow and projector do not order themselves. |
| AD-10 | presenter↔projector sync goes through the single `@/lib/present-channel` `BroadcastChannel` module; no surface opens its own channel name or message shape. | LC-10. Plan-identity clause not yet built (OQ-26, deferred-work). |
| AD-12 | `buildSlidePlan` outputs a fully hydrated AST (Fat Payload) with exact rendering coordinates, fonts, colors, and resolved text content. | Dumb renderer. |
| AD-23 | transition style is **one app-wide value** in `settings` (`slide_transition`), and each style is described **exactly once**, in `src/lib/transitions.ts` | Live-session override may travel on the channel; PPTX does not follow. |
| AD-24 | The room-facing surface is closed to operator chrome, in any form, under any setting: the projector, the web slideshow and the PPTX never read it. | `(projected)` root. |
| AD-25 | A **shipped reference corpus** … is **developer-owned data with exactly one writer**, and the committed file is authoritative. | Verse tables. |
| AD-26 | **The corpus code is globally unique across locales, and it is the cross-boundary key** | Verse lookup. |
| AD-27 | A book has **one canonical identity, stable across every translation, carrying no display text at all.** | [PARTIAL] — the AD names book-name debt. |
| AD-28 | On an **operator surface** the scope is the **chosen translation alone** | Verse overlay. |
| AD-29 | a projector→presenter message may report **the sender's own condition and nothing else, ever** | Liveness. |

## Failure Behaviour · [guarded]

Process timeout: Next/Node default. Presenter does not retry to the client; the Operator presses again. No numeric per-route timeout was read [ASSUMED].

| Boundary | Slow | Absent | Lying | User | Logged |
| --- | --- | --- | --- | --- | --- |
| GET /api/scripture | Overlay waits. After timeout, fail closed (SCN-4); no retry | 500; empty corpus → 503 reported as absent (FR-22) | Ambiguous / not found → no guess (NFR-5, SCN-4). Empty `ref` → 400 (SCN-4, not a silent no-op). No session → 401. Unknown translation → 400 | Verse does not appear; Deck stays; Operator sees lookup failed | `console.error` on 500 (`src/app/api/scripture/route.ts`) |
| LC-10 channel | Delayed message; no spinner on the room screen | Projector `lost` (AD-29). `BroadcastChannel` missing → no sync | Another tab on the same name; plan identity not on the wire [MISSING] on `PresentMessage` (AD-10, OQ-26) | Control: `lost` verdict. Congregation: may show a slide the control cannot vouch for until identity ships | — |
| /services/[id]/slideshow | Slow RSC. After load, in-memory show may continue (OQ-5) | Required: missing Service → Hub, slideshow does not open (UC-11). As-built: `notFound()` → projected "Slides unavailable" [PARTIAL] | Plan failed | Required: Hub; PPTX remains the guarantee (OQ-26). As-built: black failure copy on this URL with run-sheet links [PARTIAL] | `console.error` on plan fail (`slideshow/page.tsx`) |
| /services/[id]/present | Slow RSC | Required: missing Service or plan → Hub as UC-11; presenter does not open (OQ-26). As-built: missing Service → `notFound()` [PARTIAL] | Plan failed | Required: Hub. As-built: error card on this URL (run-sheet / PPTX); `PresenterOperator` does not mount [PARTIAL] | `console.error` on plan fail (`present/page.tsx`) |
| /services/[id]/present/projector | Slow RSC | Window closed → `lost`. Presenter open with no projector yet → AD-29 `no evidence yet` (silent), not `lost`. Missing Service → projected not-found | Slideshow tab answering as projector; a second projector window | Forbidden by AD-29; only one projector window may ack. Plan fail: black "Slides unavailable", no Operator chrome | `console.error` on plan fail (`projector/page.tsx`) |

No server retry. Operator re-opens the URL or the projector from control.

## Robustness Analysis · [deep]

Presenter has no `critical` UC. ABCE below is for the UCs this component has (presenting), so `deep` is not empty on the design side.

| UC | Boundary in | Control | Entity | Boundary out |
| --- | --- | --- | --- | --- |
| UC-11 | `/slideshow` | slideshow page (not LC-14) | (read) Service + plan | projected screen; miss → Hub |
| UC-12 | `/present` + projector | LC-14 | ProjectorLiveness | LC-10 (index, overlay, blank) |
| UC-13 | verse form | LC-14 | BibleVerse (read) | projector overlay; refuse if projector not live |

Contracts: `02-contracts/`. No `06-flows/` — not money, not delete, not a third party. `01-ux/` skipped with `wdi-ux`.

## Evidence

| Claim | Label | Read to decide | Disposition |
| --- | --- | --- | --- |
| One GET scripture | verified | `src/app/api/scripture/route.ts` | empty `ref` → 400; 401 is the gate, not this file |
| Plan identity on PresentMessage | [MISSING] | spine AD-10 *Not yet closed*; `src/lib/present-channel.ts` `PresentMessage` union has no identity field | planned: AD-10 / OQ-26 / deferred-work; not a BUG until a wave closes it |
| Overlay on `sync` / request-sync resend of overlay | [MISSING] | `PresentMessage` `sync` is `index`, `blank`, `transition` only; `PresenterOperator` `currentState()` matches; `ProjectorClient` `setOverlay(null)` on `sync` | planned: OQ-25; not a BUG until a wave closes it |
| Unblank reveals overlay if still open | verified | `ProjectorClient.tsx` blank is a covering `z-50` layer; overlay state is not cleared by blank | matches OQ-25 / BR-6 |
| No projector → refuse verse lookup | [MISSING] | `PresenterOperator.pushScripture` fetches and broadcasts with no liveness check | planned: OQ-26 |
| Missing Service/plan → Hub | [PARTIAL] | `present/page.tsx`, `slideshow/page.tsx`: missing Service → `notFound()`; plan fail → error card / black copy, `PresenterOperator` does not mount | required UC-11/OQ-26 is Hub; as-built is not a redirect |
| Presenter scripture fetch omits `translation` | [PARTIAL] | `PresenterOperator.pushScripture` query is `ref` only; route falls back to `DEFAULT_TRANSLATION` | AD-28 required param not yet on this caller |
| Projected shell is literal black | verified | AD-24; `tests/theme-chrome.test.mjs` guards it | — |
| LC-14 session in window memory | verified | `src/lib/present-channel.ts`; `PresenterOperator` refs; not a table | — |

---

## Slots

`01-ux/` is not written — belongs to `wdi-ux`. `02-contracts/` (00-inventory, scripture, present-channel). No `03-integrations/` (not a third party). `04-components/LC-14-session.md`. `05-model/data-model.md`. No `06-flows/` — not money, delete, or a third party.

## Open Items

OQ-5 · OQ-25 · OQ-26 · OQ-28 · OQ-29. Session display (showing / blanked / overlay) is ephemeral on the channel, not a table.
