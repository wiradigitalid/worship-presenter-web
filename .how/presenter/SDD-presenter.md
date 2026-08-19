---
type: sdd
component: presenter
status: draft
created: 2026-08-18
updated: 2026-08-19
realizes: [UC-11, UC-12, UC-13]
binds: [AD-1, AD-7, AD-10, AD-12, AD-23, AD-24, AD-25, AD-26, AD-27, AD-28, AD-29]
reviewed:
  date: ''
  sha: ''
  lenses: []
---

# SDD — Presenter

As-built. Offline guarantee is not this component's responsibility (AD-1).

## Decision Summary · [outline]

Presenter is three URLs: slideshow and projector at the `(projected)` root, plus presenter controls under `(operator)`. Sync between windows is client `BroadcastChannel`, no WebSocket (AD-10). On-demand verses use the local corpus.

Expensive choice: one channel module `@/lib/present-channel`; Operator chrome does not paint the room screen (AD-24).

## Structure · [outline]

| LC | type | Responsibility |
| --- | --- | --- |
| LC-9 | gateway | `GET /api/scripture` |
| LC-10 | gateway | presenter↔projector `BroadcastChannel` |
| LC-14 | service | index / blank / liveness session |

Direction: Operator controls → LC-14 → LC-10 → projector. LC-9 from the controls. Plan from LC-16 (Hub). Does not write Registry.

## Inherited Constraints · [guarded]

| AD | Quoted rule | How it lands here |
| --- | --- | --- |
| AD-1 | In-browser Web Slideshow / Presenter Mode are **shipped** (FR-15 / FR-16) but are **not** the hard offline Sabbath guarantee; PPTX download remains primary for venue reliability. | Slideshow is best-effort (OQ-5). |
| AD-7 | `buildSlidePlan` is the single source of slide order and content for every surface. | Slideshow and projector do not order themselves. |
| AD-10 | presenter↔projector sync goes through the single `@/lib/present-channel` `BroadcastChannel` module; no surface opens its own channel name or message shape. | LC-10. Plan-identity clause not yet built (deferred-work). |
| AD-12 | `buildSlidePlan` outputs a fully hydrated AST (Fat Payload) with exact rendering coordinates, fonts, colors, and resolved text content. | Dumb renderer. |
| AD-23 | transition style is **one app-wide value** in `settings` (`slide_transition`), and each style is described **exactly once**, in `src/lib/transitions.ts` | Live-session override may travel on the channel; PPTX does not follow. |
| AD-24 | The room-facing surface is closed to operator chrome, in any form, under any setting: the projector, the web slideshow and the PPTX never read it. | `(projected)` root. |
| AD-25 | A **shipped reference corpus** … is **developer-owned data with exactly one writer**, and the committed file is authoritative. | Verse tables. |
| AD-26 | **The corpus code is globally unique across locales, and it is the cross-boundary key** | Verse lookup. |
| AD-27 | A book has **one canonical identity, stable across every translation, carrying no display text at all.** | [PARTIAL] — the AD names book-name debt. |
| AD-28 | On an **operator surface** the scope is the **chosen translation alone** | Verse overlay. |
| AD-29 | a projector→presenter message may report **the sender's own condition and nothing else, ever** | Liveness. |

## Failure Behaviour · [guarded]

| Boundary | Slow | Absent | Lying | What the user sees | What is logged |
| --- | --- | --- | --- | --- | --- |
| GET /api/scripture | Overlay waits | 500 / absent corpus reported as absent | Ambiguous reference → does not guess (NFR-5). No session → 401 | Verse does not appear; Deck stays | console |
| LC-10 channel | Delayed message | Projector `lost` (AD-29) | Message from another tab / different plan identity | Identity clause **not yet** in code — slide-offset risk [MISSING] on `PresentMessage` | — |
| /services/[id]/slideshow | Slow load | 404 | Plan failed | Black/error projected screen | console |
| /services/[id]/present | — | 404 | — | Controls do not open | — |
| /services/[id]/present/projector | — | Window closed → lost | Slideshow tab answers as if projector | Forbidden by AD-29; only the projector window may ack | — |

No server retry. Operator re-opens the URL.

## Robustness Analysis · [deep]

Presenter has no `critical` UC. ABCE below is for the UCs this component has (presenting), so `deep` is not empty on the design side.

| UC | Boundary in | Control | Entity | Boundary out |
| --- | --- | --- | --- | --- |
| UC-11 | `/slideshow` | LC-14 | (read) Service + plan | projected screen |
| UC-12 | `/present` + projector | LC-14 | ProjectorLiveness | LC-10 |
| UC-13 | verse form | LC-14 | BibleVerse (read) | projector overlay |

Contracts: `02-contracts/`. No `06-flows/` — not money, not delete, not a third party. `01-ux/` skipped with `wdi-ux`.

## Evidence

| Claim | Label | Read to decide | Disposition |
| --- | --- | --- | --- |
| One GET scripture | verified | `src/app/api/scripture/route.ts` | — |
| Plan identity on PresentMessage | [MISSING] | spine AD-10 *Not yet closed*; `src/lib/present-channel.ts` named in the spine | planned: AD-10 / deferred-work; not a BUG until a wave closes it |
| Projected shell is literal black | verified | AD-24; `tests/theme-chrome.test.mjs` guards it | — |
| LC-14 session in window memory | verified | `src/lib/present-channel.ts`; not a table | — |

---

## Slots

`01-ux/` is not written — belongs to `wdi-ux`. `02-contracts/` (00-inventory, scripture, present-channel). No `03-integrations/` (not a third party). `04-components/LC-14-session.md`. `05-model/data-model.md`. No `06-flows/` — not money, delete, or a third party.

## Open Items

OQ-5. Session display (showing / blanked / overlay) is ephemeral on the channel, not a table.
