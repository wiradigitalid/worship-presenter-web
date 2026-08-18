---
type: sdd
component: hub
status: draft
created: 2026-08-18
updated: 2026-08-18
realizes: [UC-1, UC-2, UC-3, UC-4, UC-5, UC-6, UC-7, UC-8, UC-9, UC-10, UC-17, UC-18, UC-19, UC-21, UC-22, UC-23]
binds: [AD-1, AD-2, AD-3, AD-4, AD-5, AD-6, AD-7, AD-8, AD-9, AD-23, AD-24, AD-25, AD-26, AD-28]
reviewed:
  date: ''
  sha: ''
  lenses: []
---

# SDD — Hub

As-built in the `web` container. Not a Go+SPA design.

## Decision Summary · [outline]

Hub is the App Router Operator surface: Service list, form, Run-Sheet, generate/download PPTX, announcements, accounts, settings. Telegram intake enters through `POST /api/webhook` in the same process (AD-3: JSON agnostic of picoclaw).

Two expensive choices reversed: (1) one authorization gate in `src/proxy.ts` plus a SQLite check per request (AD-5); (2) PPTX as the Sabbath guarantee, not the slideshow (AD-1).

## Structure · [outline]

| LC | type | Responsibility |
| --- | --- | --- |
| LC-1 | gateway | login / logout / change password |
| LC-2 | gateway | Service CRUD, preview, PPTX |
| LC-3 | gateway | announcement list |
| LC-4 | gateway | upload and read images |
| LC-5 | gateway | Admin accounts |
| LC-6 | gateway | settings (transition, locale, default corpus) |
| LC-7 | gateway | search hymns |
| LC-8 | gateway | picoclaw webhook |
| LC-12 | service | parse Rundown + write Service |
| LC-13 | job | generate PPTX |
| LC-16 | service | `buildSlidePlan` (also used by Presenter) |

Direction: Hub screens → LC-1…LC-7 → LC-12/LC-16/LC-13; picoclaw → LC-8 → LC-12. All SQLite is in `web`.

Screens (`inventory-screen` 1–6) are not yet `LC` `ui-screen`: that is a `wdi-ux` slot, skipped at the owner's request.

## Inherited Constraints · [guarded]

Quotes are the spine **Rule** sentences. Full text in `.how/_platform/ARCHITECTURE-SPINE.md`.

| AD | Quoted rule | How it lands here |
| --- | --- | --- |
| AD-1 | Operators use a zero-install **Web Hub** for review/run-sheet. **Phase 1** presents on Sabbath from a downloadable offline **PPTX**. | PPTX download is the guarantee; the slideshow is a complementary link. |
| AD-2 | The picoclaw skill integration logic, API backend, and App Router web UI must reside in a single repository and be deployable as a cohesive unit. | One repo, one `web` container. |
| AD-3 | The API must expose a standard JSON interface for service generation that is agnostic to the input mechanism (Telegram/picoclaw). | LC-8 and the Hub form write the same Service. |
| AD-4 | Production is deployed as one Docker/standalone unit on the home-PC LiveServer (`presenter.example.org` via Cloudflare Tunnel). | `DB_PATH`, PPTX cache, `UPLOADS_DIR` durable. |
| AD-5 | `src/proxy.ts` is the one request gate, and its `config.matcher` regex **is** the authorization boundary — anything it does not match is served with no session check at all, so a new exclusion ships together with its assertion in `tests/proxy-matcher.test.mjs` in the same change set. | `/api/webhook` is `WEBHOOK_SECRET` only. |
| AD-6 | every service mutation carries the client's `updated_at` as a precondition; a stale value is rejected with HTTP 409 and the client re-reads before retrying. | PUT Service; half of the agent paths are not yet closed (deferred-work). |
| AD-7 | `buildSlidePlan` is the single source of slide order and content for every surface. | Preview and PPTX do not re-order from Service fields. |
| AD-8 | image references resolve only through the shared helpers in `src/lib` — allowlisted remote http(s) and hub-local `/api/uploads/<32-hex>.(jpg|jpeg|png|gif|webp)` for announcements, and registry `/assets/...` refs for Artifact templates. | LC-4 and announcements. |
| AD-9 | schema changes go through the app's startup DDL on the `getDb` path. | No Prisma. |
| AD-23 | transition style is **one app-wide value** in `settings` (`slide_transition`), and each style is described **exactly once**, in `src/lib/transitions.ts`, carrying both its PowerPoint element and its browser animation parameters. | LC-6 writes; PPTX reads. |
| AD-24 | **application state reaches one of three homes and *who must agree on it* picks which.** | `ui_locale` in settings, not a chrome cookie. |
| AD-25 | A **shipped reference corpus** — a committed data file the product carries so that a fresh clone resolves a verse and a hymn offline — is **developer-owned data with exactly one writer**, and the committed file is authoritative. | Hub Song Book. |
| AD-26 | Every installed corpus is a **registered entity** — one row in `bible_translations` or `song_books`, carrying its code, display name, **locale**, licence and provenance. | Hymn picker / default book. |
| AD-28 | there is **one matcher implementation and the scope is an argument to it, never a fork**. | Rundown: every installed translation. |

## Failure Behaviour · [guarded]

Process timeout: Next/Node default. The Hub does not retry to the client unless the Operator presses again. [PARTIAL] — not every route was read line by line.

| Boundary | Slow | Absent | Lying | What the user sees | What is logged |
| --- | --- | --- | --- | --- | --- |
| POST /api/auth/login | Spinner until browser timeout | 500 | Wrong credentials → 401 | Sign-in failed message | Server error if 500 |
| POST /api/auth/logout | Session may linger on the client | Cookie cleared as far as possible | — | Back to login | — |
| POST /api/auth/change-password | Timeout | 500 | Old password wrong → 400/401 | Form error | console.error |
| GET /api/services | List does not appear | 500 | Corrupt payload → page error | Hub empty or error | console |
| POST /api/services | Timeout; Service may already be saved | 500 | Bad Rundown → Service looks incomplete | Form error or incomplete Service | parser / NFR-5 |
| PUT /api/services/[id] | Timeout | 404 | Stale `updated_at` → 409 | Operator re-reads | — |
| DELETE /api/services/[id] | Timeout; delete may already have run | 404 | Fake id → 400 | Not-found message; files may already be unlinked | console.error |
| GET /api/services/[id]/pptx | Slow generate | 404 / 500 | Plan failed → 500 | Download failed; Sabbath uses the old file if one exists | console |
| POST /api/services/preview | Slow | 500 | Bad body → 400 | Empty preview | console |
| GET/POST/PUT /api/announcements | Slow | 500 | Bad body → 400 | List unchanged | console |
| PATCH/DELETE /api/announcements/[id] | Slow | 404 | Fake id → 400 | Item stays | console |
| POST /api/upload | Large upload | 500 | Type not allowed → 400 | Upload failed | console |
| POST /api/upload/from-url | SSRF-hardened; slow | 400/500 | URL outside allowlist → 400 | Fetch failed | console |
| GET /api/uploads/[filename] | Slow | 404 | Name not 32-hex → 400 | Broken image | — |
| GET /api/hymns | Slow | 500 | Empty query → list as the route specifies | No results | — |
| GET/POST /api/admin/accounts | Slow | 403/500 | Duplicate username → 400 | Form error | console |
| PATCH/DELETE /api/admin/accounts/[id] | Slow | 404 | Deleting the last admin is refused | Message | console |
| GET/PUT /api/admin/settings | Slow | 403 | Bad body → 400 | Previous settings | console |
| POST /api/webhook | Timeout at picoclaw | 503 if secret unset; silent if the agent is down | Wrong secret → 401; other JSON → 400 / parse visible | Events get no read-back; Operator sees Hub | does not log the secret |
| /login | — | — | — | Login form | — |
| / | Slow list | 500 page | — | Empty list | — |
| /services/new | — | — | Parse failure visible | Form | — |
| /services/[id] | Slow RSC | 404 | Save conflict → 409 on the action | Run-Sheet | — |
| /announcements | — | — | — | List | — |
| /admin | — | 403 | — | Settings | — |

## Robustness Analysis · [deep]

`critical` UCs only. Objects are not repeated in the SRS.

| UC | Boundary in | Control | Entity | Boundary out |
| --- | --- | --- | --- | --- |
| UC-1 | LC-8 webhook | LC-12 | Service, Hymn | JSON to picoclaw |
| UC-2 | `/services/new` + LC-2 POST | LC-12 | Service | Hub list |
| UC-5 | Run-Sheet + LC-2 PUT | LC-12 | Service | 200 or 409 |
| UC-7 | LC-2 DELETE | LC-12 | Service → absent; local files unreferenced | list without the row |
| UC-17 | LC-8 `correct` | LC-12 | Service | read-back |

`01-ux/` is not written: the owner skipped `wdi-ux`. Contracts: `02-contracts/`. Integration: picoclaw. Risky technical flows: `06-flows/webhook-intake.md`, `delete-service.md`.

## Evidence

| Claim | Label | Read to decide | Disposition |
| --- | --- | --- | --- |
| Hub route verbs match the inventory | verified | `src/app/api/**/route.ts` 2026-08-18 | — |
| No GET `/api/services/[id]` | verified | no GET export in `services/[id]/route.ts` | RSC page |
| Not all four Service mutation paths have 409 | [PARTIAL] | spine AD-6 *Not yet closed*; `prior-knowledge/_bmad-output/implementation-artifacts/deferred-work.md` | debt, not a G4 fix |
| Numeric timeout per route | [ASSUMED] | did not read `maxDuration` | platform default |
| LC-12 parse+write | verified | `src/lib/parser.ts`, `src/lib/services/update-service.ts` | — |
| LC-13 PPTX on-demand | verified | `src/lib/pptx.ts` | — |
| LC-16 `buildSlidePlan` | verified | `src/lib/slide-plan.ts` | — |
| Deleting a Service unlinks unreferenced local uploads | verified | `src/lib/services/queries.ts` `deleteService`; `tests/services-lib.test.mjs` | OQ-7 |

---

## Slots

`01-ux/` is not written — belongs to `wdi-ux`, skipped. `02-contracts/` (00-inventory + 01–08). `03-integrations/picoclaw.md`. `04-components/` LC-12, LC-13, LC-16. `05-model/data-model.md`. `06-flows/webhook-intake.md`, `delete-service.md`.

## Open Items

OQ-1 · OQ-2 · OQ-4 · OQ-6
