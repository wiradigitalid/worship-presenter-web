---
type: sdd
component: hub
status: draft
created: 2026-08-18
updated: 2026-08-19
realizes: [UC-1, UC-2, UC-3, UC-4, UC-5, UC-6, UC-7, UC-8, UC-9, UC-10, UC-16, UC-17, UC-18, UC-19, UC-21, UC-22, UC-23]
binds: [AD-1, AD-2, AD-3, AD-4, AD-5, AD-6, AD-7, AD-8, AD-9, AD-12, AD-16, AD-23, AD-24, AD-25, AD-26, AD-28]
reviewed:
  date: '2026-08-19'
  sha: 'a2bf8b0dbdda61810be611576e31ec120e54d96d'
  lenses: [structure, prose, edge-case-hunter]
---

# SDD — Hub

As-built in the `web` container. Not a Go+SPA design.

## Decision Summary · [outline]

Hub is the App Router Operator surface: Service list, form, Run-Sheet, generate/download PPTX, announcements, accounts, settings. This phase's intake is the Operator Hub form (`/services/new`, UC-2). `POST /api/webhook` / LC-8 remains in-process as last-phase CAP-11 intake (AD-3: JSON agnostic of picoclaw); it is as-built, not this phase's handover.

Two expensive choices reversed: (1) one authorization gate in `src/proxy.ts` plus a SQLite check per request (AD-5); (2) PPTX as the Sabbath guarantee, not the slideshow (AD-1).

## Structure · [outline]

| LC | type | Responsibility |
| --- | --- | --- |
| LC-1 | gateway | login / logout / change password |
| LC-2 | gateway | Service CRUD, preview, PPTX, Sync Artifact |
| LC-3 | gateway | announcement list |
| LC-4 | gateway | upload and read images |
| LC-5 | gateway | Admin accounts |
| LC-6 | gateway | settings (transition, locale, default corpus) |
| LC-7 | gateway | search hymns |
| LC-8 | gateway | picoclaw webhook — CAP-11 later; as-built, still specified |
| LC-12 | service | parse Rundown + write Service |
| LC-13 | job | generate PPTX |
| LC-16 | service | `buildSlidePlan` (also used by Presenter) |

Direction: Hub screens → LC-1…LC-7 → LC-12…; picoclaw → LC-8 is later (CAP-11). All SQLite is in `web`.

Screens (`inventory-screen` 1–6) are not yet `LC` `ui-screen`: that is a `wdi-ux` slot, skipped at the owner's request.

## Inherited Constraints · [guarded]

Quotes are the spine **Rule** sentences. Full text in `.how/_platform/ARCHITECTURE-SPINE.md`. ADs that do not bind Hub (AD-10, AD-11, AD-13–AD-15, AD-17–AD-22, AD-27, AD-29) are not listed.

| AD | Quoted rule | How it lands here |
| --- | --- | --- |
| AD-1 | Operators use a zero-install **Web Hub** for review/run-sheet. **Phase 1** presents on Sabbath from a downloadable offline **PPTX**. | PPTX download is the guarantee; the slideshow is a complementary link. |
| AD-2 | The picoclaw skill integration logic, API backend, and App Router web UI must reside in a single repository and be deployable as a cohesive unit. | One repo, one `web` container. |
| AD-3 | The API must expose a standard JSON interface for service generation that is agnostic to the input mechanism (Telegram/picoclaw). | Hub form writes Service now; LC-8 writes the same Service later (CAP-11). |
| AD-4 | Production is deployed as one Docker/standalone unit on the home-PC LiveServer (`presenter.example.org` via Cloudflare Tunnel). | `DB_PATH`, PPTX cache, `UPLOADS_DIR` durable. |
| AD-5 | `src/proxy.ts` is the one request gate, and its `config.matcher` regex **is** the authorization boundary — anything it does not match is served with no session check at all, so a new exclusion ships together with its assertion in `tests/proxy-matcher.test.mjs` in the same change set. | `/api/webhook` is `WEBHOOK_SECRET` only. Session expiry at save/delete is this gate's 401 before the handler (OQ-23). |
| AD-6 | every service mutation carries the client's `updated_at` as a precondition; a stale value is rejected with HTTP 409 and the client re-reads before retrying. | PUT Service (UC-5). POST sync-artifact (UC-16). GET pptx / POST preview are not mutations (OQ-20). Half of the agent paths are not yet closed (deferred-work). |
| AD-7 | `buildSlidePlan` is the single source of slide order and content for every surface. | Preview and PPTX do not re-order from Service fields. |
| AD-12 | `buildSlidePlan` outputs a fully hydrated AST (Fat Payload) with exact rendering coordinates, fonts, colors, and resolved text content. | Preview and PPTX consume the fat plan; they do not look up Registry. |
| AD-8 | image references resolve only through the shared helpers in `src/lib` — allowlisted remote http(s) and hub-local `/api/uploads/<32-hex>.(jpg|jpeg|png|gif|webp)` for announcements, and registry `/assets/...` refs for Artifact templates. | LC-4 and announcements. |
| AD-9 | schema changes go through the app's startup DDL on the `getDb` path. | No Prisma. `services.registry_snapshot_at` is Hub; the freeze table is Registry. |
| AD-16 | Creating a worship service **clones** the ordered live registry … into a **service-bound snapshot** | Create clones in the same transaction. Sync is `POST /api/services/[id]/sync-artifact`, Admin-only. Preview stays live. |
| AD-23 | transition style is **one app-wide value** in `settings` (`slide_transition`), and each style is described **exactly once**, in `src/lib/transitions.ts`, carrying both its PowerPoint element and its browser animation parameters. | LC-6 writes; PPTX reads. |
| AD-24 | **application state reaches one of three homes and *who must agree on it* picks which.** | `ui_locale` in settings, not a chrome cookie. |
| AD-25 | A **shipped reference corpus** — a committed data file the product carries so that a fresh clone resolves a verse and a hymn offline — is **developer-owned data with exactly one writer**, and the committed file is authoritative. | Hub Song Book. |
| AD-26 | Every installed corpus is a **registered entity** — one row in `bible_translations` or `song_books`, carrying its code, display name, **locale**, licence and provenance. | Hymn picker / default book. |
| AD-28 | there is **one matcher implementation and the scope is an argument to it, never a fork**. | Rundown: every installed translation. |

## Failure Behaviour · [guarded]

Hub does not retry a failed call; the Operator (or picoclaw) must press again. Process timeout is the Node/Next default — [ASSUMED]: no `maxDuration` in Hub `route.ts` files (grep 2026-08-19). The one named timeout is `POST /api/upload/from-url`: `REMOTE_IMAGE_TIMEOUT_MS = 8000` in `src/lib/remote-image.ts`.

This phase's create boundary is `/services/new` (UC-2). `POST /api/webhook` is as-built CAP-11 later; do not treat it as this phase's handover.

Every Hub-owned row from `inventory-api.md` (1–24, 30, 33) and `inventory-screen.md` (1–6).

| Boundary | Slow | Absent | Lying | What the user sees | What is logged |
| --- | --- | --- | --- | --- | --- |
| POST `/api/auth/login` | Browser waits until the process default | 500 `{ error: Internal Server Error }` | Wrong user/password → 401 same `Invalid username or password`; lockout → 429 + `Retry-After`; short `AUTH_SECRET` → 503 | Sign-in form: failed credentials, wait message, or host-not-ready | 500: `Login error:` (`src/app/api/auth/login/route.ts`). 503: `AUTH_SECRET is missing or shorter than 16 characters`. 401/429: not logged |
| POST `/api/auth/logout` | Browser waits | Revocation write fails → 500 `Logout failed`; cookie **kept** so the browser is still signed in | Already signed out: still 200/303 and cookie cleared | JSON `{ ok: true }` or redirect to `/login`. On 500: still on Hub, still signed in | `Logout revocation failed:` (`src/app/api/auth/logout/route.ts`) |
| POST `/api/auth/change-password` | Browser waits | 500 `{ error }` | Wrong current password → 401 `Current password is incorrect`; lockout → 429 + `Retry-After`; no session → 401 from gate | Form shows that message; password hash unchanged | `Password change error:` on 500 (`src/app/api/auth/change-password/route.ts`) |
| GET `/api/services` | List JSON delayed | 500 `{ error: Internal Server Error }` | Search `q` is a substring filter; a corrupt row still appears in the list | Hub list spinner then rows, or a failed fetch — not a silent empty Hub pretending there are no Services | `Error listing services:` (`src/app/api/services/route.ts`) |
| POST `/api/services` | Timeout; a 201 retry may already have inserted | 500 | No date / empty paste → 400, no row (OQ-21). Same date without `allowSecond` → 409 + `existingId` (OQ-8). Unparseable body **with** a date → 201 and `failedHymnNumbers` (NFR-5, OQ-22) | Form: miss named, or existing Service offered, or incomplete Service saved | `Error creating service:` on 500. 400/409: not logged |
| PUT `/api/services/[id]` | Timeout; no write if the gate already 401'd | Row gone → 404 `Service not found` (UC-7; do not recreate, OQ-23) | Stale `updated_at` → 409, no write (BR-4). Bad id → 400 | Run-Sheet: conflict alert then refresh; gone → not-found page after refresh; session expiry → 401, fields not stored | `Error updating service:` on 500. 409/404: not logged |
| DELETE `/api/services/[id]` | Timeout; a successful delete already unlinked files | 404 `Service not found` | Bad id → 400. Session expiry → 401 **before** the handler; no partial write (OQ-23) | Confirm dialog then list without the row, or `Error deleting service` alert | `Error deleting service:` on 500 (`src/app/api/services/[id]/route.ts`). Unlink misses: `Error unlinking service upload:` (`src/lib/services/queries.ts`) |
| GET `/api/services/[id]/pptx` | Generate waits (UC-6 / UC-18); does **not** edit the Service (OQ-20) | 404 `Service not found or not parsed` | Corrupt `parsed_data` → 500 `Corrupt parsed data`. Bad id → 400 | Browser download fails; Sabbath keeps any earlier cached file | `Error generating PPTX:` on 500. Cache write miss: `PPTX cache write/cleanup failed:` (`src/app/api/services/[id]/pptx/route.ts`) |
| POST `/api/services/preview` | Plan build waits; no Service write (OQ-20) | 500 | No date / empty `raw_payload` → 400. Bad image URL → 400 | Preview pane empty or last good preview; form not saved | `Error generating preview:` (`src/app/api/services/preview/route.ts`) |
| GET `/api/announcements` | List delayed | 500 | — (read-only list) | Announcements page empty or spinner; not a fabricated empty master list | `Error listing announcements:` (`src/app/api/announcements/route.ts`) |
| POST `/api/announcements` | Timeout; retry may insert a second item | 500 | Bad JSON / URL → 400; item not added | Form error; list unchanged | `Error adding announcement:` on 500 |
| PUT `/api/announcements` | Timeout; replace may already have committed | 500 | `items` not an array / bad URL → 400; previous order kept. Empty array is 200 and deletes every row including recurring (OQ-33). Concurrent PUT last-write-wins (OQ-34) | List stays as last successful order; empty PUT leaves an empty list | `Error replacing announcements:` on 500 |
| PATCH `/api/announcements/[id]` | Timeout | 404 `Announcement not found` | Bad id → 400; bad URL → 400; item unchanged | Item stays as last saved | `Error updating announcement:` on 500 (`src/app/api/announcements/[id]/route.ts`) |
| DELETE `/api/announcements/[id]` | Timeout; retry after success → 404 | 404 | Bad id → 400 | Item remains if 400/500; gone if 200 | `Error deleting announcement:` on 500 |
| POST `/api/upload` | Large file waits | Disk fail → 500 `Failed to upload image` | No file / not an image / bad ext → 400 | Upload widget shows failed; no new ref | `Upload error:` (`src/app/api/upload/route.ts`) |
| POST `/api/upload/from-url` | Aborts at 8000 ms → 504 `That host took too long to answer.` | Unreachable / HTTP error / empty → 502 with that host message | Allowlist/SSRF/malformed/redirect/not-an-image → 400; too large → 413 | Fetch failed with that sentence; no new ref | `Image fetch refused (reason) for <url>:` (`src/app/api/upload/from-url/route.ts`) |
| GET `/api/uploads/[filename]` | File read waits | Missing file or unresolved name → 404 `Not Found` | Name that is not a local upload ref → 404 (resolver refuses) | Broken image in Hub / PPTX | nothing on 404 (`src/app/api/uploads/[filename]/route.ts`) |
| GET `/api/hymns` | Search waits | 500 | Malformed `limit` / `numbers` tokens ignored; empty `q` returns the first page, not 400 | Picker: no rows, or a page of the index | `Error searching hymns:` on 500 (`src/app/api/hymns/route.ts`). Empty corpus: 200 `{ hymns: [] }` |
| GET `/api/admin/accounts` | List waits | 500 | Not Admin → 403 `Forbidden` (gate or `requireAdminSession`) | Admin page forbidden or failed load | `Error listing accounts:` on 500 (`src/app/api/admin/accounts/route.ts`) |
| POST `/api/admin/accounts` | Timeout | 500 | Duplicate username / bad role / empty password → 400; not Admin → 403 | Form keeps the typed values; no new account | `Error creating account:` on 500 |
| PATCH `/api/admin/accounts/[id]` | Timeout | 404 via client message | Last admin demote refused → 400; bad id → 400; not Admin → 403 | Message on the form; row unchanged | `Error updating account:` on 500 (`src/app/api/admin/accounts/[id]/route.ts`) |
| DELETE `/api/admin/accounts/[id]` | Timeout | 404 | Last admin delete refused → 400 | Account remains if refused; gone if 200 | `Error deleting account:` on 500 |
| GET `/api/admin/settings` | Read waits | 500 if settings helpers throw | Not Admin → 403 | Previous chrome language / transition stay on screen | helper `console.error` in `src/lib/settings.ts` if a read throws |
| PUT `/api/admin/settings` | Timeout | 500 | Unknown transition / locale → 400; `pptx_retention_days` present and not a non-negative integer → 400; not Admin → 403. Keys written: `pptx_retention_days`, `slide_transition`, `ui_locale` | Previous settings remain | `Error updating settings:` (`src/app/api/admin/settings/route.ts`) |
| POST `/api/webhook` | Timeout is on picoclaw; Hub does not retry | Secret unset → 503. Agent down: Hub silent | Wrong secret → 401 (secret not logged). Bad JSON → 400. Specified: no date → no row (OQ-21); images attach or fail visibly (OQ-22) | CAP-11 later: Events get no read-back. Operator sees Hub. Not this phase's handover | `Error processing webhook:` on 500 (`src/app/api/webhook/route.ts`). Does not log the secret |
| `/login` | Waits on POST login | Login API 500 → form error | Wrong credentials → same 401 copy | Login form; never Hub | none on the page (client shows the API body) |
| `/` | RSC list waits on SQLite | Uncaught DB throw → framework error page | Corrupt `parsed_data` still listed by date | Dated list, or error page — not a silent empty Hub | none in `src/app/(operator)/page.tsx`; API list logs as above if the client refetch fails |
| `/services/new` | Preview POST may lag on each paste | Preview 500 → empty preview pane | No date → 400, no row. Partial parse with date → save what was readable (OQ-22) | Form names the miss (UC-2). Cards: Bible Talk → Divine Worship → Sermon → Family → Youth → Announcement Flyers. Live Slide Preview only | `Preview error:` in `src/app/(operator)/services/new/CreateForm.tsx` |
| POST `/api/services/[id]/sync-artifact` | Clone until browser timeout | 403 Operator; 404 missing; 400 missing token | Stale `updated_at` → 409 + current token | Run-Sheet stays on the previous freeze until success; entered fields unchanged | `Error syncing artifact registry:` on 500 |
| `/services/[id]` | RSC + PUT save wait | Missing row → `notFound()` | Stale save → 409 then refresh. Gone after reject → UC-7 not-found (OQ-23). Session expiry at save → 401, no partial write | Same form cards as create. Chrome: Preview, Present, Delete Service, Download PPTX, Live Slide Preview, announcement strip + Manage list. Admin: Sync Artifact. No Order of Service card | `Preview error:` / save `console.error` in `EditForm.tsx`; delete `console.error` in `DeleteButton.tsx` |
| `/announcements` | RSC list waits | DB throw → error page | Bad image URL on mutate → 400; list unchanged | List as last successful load | announcement route `console.error` as above |
| `/admin` | RSC waits | Not Admin → 403 `Forbidden` from the gate | Bad settings body → 400; previous values remain | Accounts, transition, locale, retention | accounts/settings `console.error` as above |

## Robustness Analysis · [deep]

`critical` UCs only. Objects are not repeated in the SRS.

| UC | Boundary in | Control | Entity | Boundary out |
| --- | --- | --- | --- | --- |
| UC-1 | LC-8 webhook — later CAP-11 | LC-12 | Service, Hymn | JSON to picoclaw |
| UC-2 | `/services/new` + LC-2 POST — this phase | LC-12 | Service | Hub list |
| UC-5 | Run-Sheet + LC-2 PUT | LC-12 | Service | 200 or 409; 404 if gone (OQ-23) |
| UC-7 | LC-2 DELETE | LC-12 | Service → absent; local files unreferenced | list without the row |
| UC-17 | LC-8 `correct` — later CAP-11; named date, no nearest-Sabbath fallback (OQ-21) | LC-12 | Service | read-back |

`01-ux/` is not written: the owner skipped `wdi-ux`. Contracts: `02-contracts/`. Integration: picoclaw. Risky technical flows: `06-flows/webhook-intake.md`, `delete-service.md`.

## Evidence

| Claim | Label | Read to decide | Disposition |
| --- | --- | --- | --- |
| Hub route verbs match the inventory | verified | `src/app/api/**/route.ts` 2026-08-18 | — |
| No GET `/api/services/[id]` | verified | no GET export in `src/app/api/services/[id]/route.ts` | RSC page |
| Not all four Service mutation paths have 409 | [PARTIAL] | spine AD-6 *Not yet closed*; `_bmad-output/implementation-artifacts/deferred-work.md` | debt, not a G4 fix |
| Numeric timeout per Hub route (`maxDuration`) | [ASSUMED] | grep 2026-08-19: no `maxDuration` in `src/` | platform default. Do not invent a number |
| Named timeout on remote image fetch | verified | `src/lib/remote-image.ts` `REMOTE_IMAGE_TIMEOUT_MS = 8000` | from-url 504 |
| LC-12 parse+write | verified | `src/lib/parser.ts`, `src/lib/services/create-service.ts`, `src/lib/services/update-service.ts` | Hub POST same date is 409 unless `allowSecond`; webhook upsert is CAP-11 |
| LC-13 PPTX on-demand; does not UPDATE `services` | verified | `src/app/api/services/[id]/pptx/route.ts` GET; `src/lib/pptx.ts` | OQ-20: generate is not a payload edit |
| POST preview does not write Service | verified | `src/app/api/services/preview/route.ts` | OQ-20 |
| Sync Artifact is Admin-only Hub route | verified | `src/app/api/services/[id]/sync-artifact/route.ts`; `tests/proxy-matcher.test.mjs`; `tests/registry-sync-artifact.test.mjs` | UC-16 / AD-16 |
| Create clones a snapshot in the same transaction | verified | `src/lib/services/create-service.ts` → `cloneRegistryToNewService` | AD-16 |
| LC-16 `buildSlidePlan` | verified | `src/lib/slide-plan.ts` | lyric join/chorus: `src/lib/lyrics.ts` (BR-6) |
| Create/edit field set | verified | `CreateForm.tsx` / `EditForm.tsx` | `.how/hub/05-model/form-fields.md` |
| Deleting a Service unlinks unreferenced local uploads | verified | `src/lib/services/queries.ts` `deleteService`; `tests/services-lib.test.mjs` | OQ-7 |
| Session expiry at PUT/DELETE refuses before the handler | verified | `src/proxy.ts` `unauthorized` 401 JSON for `/api/` | OQ-23: no partial write |
| PUT gone → 404, page `notFound()`, EditForm does not POST create | verified | `src/lib/services/update-service.ts`; `src/app/(operator)/services/[id]/page.tsx`; `EditForm.tsx` | OQ-23: UC-7 not-found, do not recreate |
| Hub create refuses when `parsedData.date` is missing | verified | `src/lib/services/create-service.ts` | OQ-21 on UC-2 |
| Webhook rundown with no date still inserts using `localIsoDate()` | [MISSING] specified OQ-21 refuse | `src/app/api/webhook/route.ts` `parsedData.date \|\| localIsoDate()` | planned CAP-11 (OQ-27) — not a `BUG-` row this wave. Sentence kept |
| Telegram correction has no nearest-Sabbath lookup | verified | `src/app/api/webhook/route.ts` `findServiceByDateOrId` / `handleCorrection` | OQ-21: document used to claim nearest Sabbath; code already rejects. Correction of the claim, not a new lookup |
| Telegram images attach or fail visibly | [MISSING] | `src/lib/images.ts` `coerceImageUrls` filters unsafe/non-string entries; webhook stores the filtered array with no per-URL failure in the read-back | planned CAP-11 (OQ-27, OQ-22) — not a `BUG-` row this wave. Sentence kept |
| Hymns empty corpus | verified | `src/app/api/hymns/route.ts` returns 200 `{ hymns: [] }` | Was once specified as a loud miss; contract now matches as-built empty array |

---

## Slots

`01-ux/` is not written — belongs to `wdi-ux`, skipped. `02-contracts/` (00-inventory + 01–08). `03-integrations/picoclaw.md`. `04-components/` LC-12, LC-13, LC-16. `05-model/data-model.md`, `form-fields.md`. `06-flows/webhook-intake.md`, `delete-service.md`.

## Open Items

OQ-17 · OQ-2 · OQ-4 · OQ-6. OQ-1 is parked on CAP-11. Taken and encoded: OQ-20 · OQ-21 · OQ-22 · OQ-23. Parked on this SDD: OQ-27 (CAP-11 `[MISSING]` stay; not `BUG-` this wave) · OQ-33 (empty PUT announcements wipes master) · OQ-34 (announcement last-write-wins).
