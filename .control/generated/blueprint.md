# blueprint

> Tergenerate oleh `.constitution/scripts/validate --generate`. MUST NOT diedit tangan.


Ini yang dibaca pemilik di **G3 Blueprint**, bukan tujuh berkas. Isinya tidak dipengaruhi `mode` maupun `risk_accepted`.


## Katalog use case

**23 use case**, 6 bertanda `critical`.

| id | Use case | Komponen | Memenuhi | critical |
| --- | --- | --- | --- | --- |
| `UC-1` | Events send a Rundown on Telegram and its Service appears | `hub` | `FR-1`, `FR-2` | ya |
| `UC-10` | I read Hub in my language | `hub` | `FR-25` | tidak |
| `UC-11` | I present a fullscreen slideshow | `presenter` | `FR-15` | tidak |
| `UC-12` | I run the two-screen presenter | `presenter` | `FR-16` | tidak |
| `UC-13` | I display an on-demand verse on the projector | `presenter` | `FR-19`, `FR-22` | tidak |
| `UC-14` | I change a slide's layout | `registry` | `FR-20` | tidak |
| `UC-15` | I reorder slides and deletions stay deleted | `registry` | `FR-21` | ya |
| `UC-16` | I Sync Artifact to a Service already reviewed | `registry` | `FR-21` | tidak |
| `UC-17` | Events correct one song via Telegram | `hub` | `FR-12` | ya |
| `UC-18` | I download the PPTX for Sabbath | `hub` | `FR-14` | tidak |
| `UC-19` | I choose one transition for the whole Deck | `hub` | `FR-7` | tidak |
| `UC-2` | I paste a Rundown in Hub and a new Service is saved | `hub` | `FR-27` | ya |
| `UC-20` | I see a Deck that matches this week's payload | `registry` | `FR-4`, `FR-5`, `FR-6` | tidak |
| `UC-21` | I manage the announcement list that persists across weeks | `hub` | `FR-3` | tidak |
| `UC-22` | I browse Song Books and translations by language | `hub` | `FR-23`, `FR-24` | tidak |
| `UC-23` | My edit is rejected because someone else already saved | `hub` | `FR-28` | tidak |
| `UC-3` | I open the dated Service list | `hub` | `FR-8` | tidak |
| `UC-4` | I follow the worship order from the Run-Sheet | `hub` | `FR-17` | tidak |
| `UC-5` | I edit Service fields in Hub | `hub` | `FR-11` | ya |
| `UC-6` | I regenerate this Service's Deck | `hub` | `FR-13` | tidak |
| `UC-7` | I delete this Service and its assets | `hub` | `FR-10` | ya |
| `UC-8` | I preview the Service slides in the browser | `hub` | `FR-9` | tidak |
| `UC-9` | I manage Operator and Admin accounts | `hub` | `FR-18` | tidak |

## Daftar aktor


### hub — Hub

| Actor | Who they are | What they may do |
| --- | --- | --- |
| Operator | Multimedia team | List, create, edit, generate, download, delete, Run-Sheet, announcements |
| Events | Rundown sender | Send Telegram (need not open Hub) |
| Admin | Account and settings manager | Accounts, transitions, locale |

### presenter — Presenter

| Actor | Who they are | What they may do |
| --- | --- | --- |
| Operator | On-duty at the venue laptop | Slideshow, presenter, projector, verse |
| Jemaat | Screen audience | Do not open this surface |

### registry — Registry

| Actor | Who they are | What they may do |
| --- | --- | --- |
| Admin | Structure editor | Layout, order, delete, Sync Artifact |
| Operator | Sees the result | Sees the Deck matching the payload; does not edit Registry |

## Model domain


### hub

### Domain model — Hub

Conceptual. Database column types belong in `.how/`.

| Entity | Meaning | Relations |
| --- | --- | --- |
| Service | One dated worship gathering | 1 weekly payload, 0..1 Snapshot (owned by Registry), 0..N images |
| AnnouncementItem | Announcement list item | recurring or one-off to one Service |
| Account | Per-person account | Admin or Operator role |
| AppSetting | Application settings | transition, ui_locale, default corpus |
| Rundown | Events input text | becomes Service payload |

### presenter

### Domain model — Presenter

Has no write entities. Reads Service and renders the slide plan owned by Registry.

| Entity | Meaning | Relations |
| --- | --- | --- |
| (read) Service | Worship gathering being shown | Hub writes |
| BibleTranslation | Registered translation corpus | 1 : N BibleVerse, 1 : N book names |
| BibleBook | Canonical book identity | N names per translation (AD-27) |
| BibleVerse | Verse text | points at book identity |

### registry

### Domain model — Registry

| Entity | Meaning | Relations |
| --- | --- | --- |
| ArtifactTemplate | One Deck-order entry | kind General / SongSet / Announcement |
| ServiceRegistrySnapshot | Copy of Registry when the Service is created | 1 Service : 1 Snapshot after FR-21 |
| Placeholder Catalog | Closed set of weekly-content bindings | many Templates may use the same entry |
| SongSet Slot | Four fixed song-block positions | identity belongs to the system |

## Tiga inventaris


### Daftar tabel — `inventory-db.md`

### Inventory — tables

Derived from `src/lib/db/index.ts` (SQLite DDL in the same process). `inventory.py` reads Go migrations / standalone `CREATE TABLE` SQL — **a mismatch** with this repo. Findings below.

#### Rows

| No | Table | Owning component | What it holds | Key columns | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | services | hub | One dated Service and the week's payload | id, date | published |
| 2 | hymns | hub | Song Book entries | number, book | published |
| 3 | announcement_items | hub | Announcement list | id, order | published |
| 4 | accounts | hub | Per-person accounts | id, username | published |
| 5 | login_attempts | hub | Login trail | — | published |
| 6 | revoked_sessions | hub | Revoked sessions | sid | published |
| 7 | settings | hub | Application settings | key | published |
| 8 | bible_translations | presenter | Translation corpora | code, locale | published |
| 9 | bible_books | presenter | Book names per translation | — | published |
| 10 | bible_verses | presenter | Verse text | — | published |
| 11 | artifact_templates | registry | Slide order and layout | id, order | published |
| 12 | hymns_with_book_code | hub | View/shape hymn + book code | — | published |
| 13 | bible_verses_with_translation_code | presenter | View/shape verse + translation code | — | published |

#### Findings

- `inventory.py` does not derive these rows: its pattern is Gin + SQL migrations + React Router, while live code is Next.js App Router and DDL in TypeScript. This inventory is read from `src/lib/db/index.ts`, not from the script.
- The per-Service Registry snapshot (AD-16) **does not yet** have a table. `ServiceRegistrySnapshot` in Registry `owns` is a promise; the code assembles a live map per plan build (`src/lib/artifacts/registry-snapshot.ts`). See SDD Registry, label `[MISSING]`.

### Daftar endpoint — `inventory-api.md`

### Inventory — endpoints

Source: `export async function` in `src/app/api/**/route.ts`. Not `inventory.py` output (App Router). Numbers are stable; new rows take the next number.

#### Rows

| No | Method | Path | Owning component | Description | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | POST | `/api/auth/login` | hub | Log in | published |
| 2 | POST | `/api/auth/logout` | hub | Log out | published |
| 3 | POST | `/api/auth/change-password` | hub | Change password | published |
| 4 | GET | `/api/services` | hub | List Services | published |
| 5 | POST | `/api/services` | hub | Create Service | published |
| 6 | PUT | `/api/services/[id]` | hub | Update Service (AD-6) | published |
| 7 | DELETE | `/api/services/[id]` | hub | Delete Service | published |
| 8 | GET | `/api/services/[id]/pptx` | hub | Download PPTX | published |
| 9 | POST | `/api/services/preview` | hub | Preview | published |
| 10 | GET | `/api/announcements` | hub | List announcements | published |
| 11 | POST | `/api/announcements` | hub | Add announcement item | published |
| 12 | PUT | `/api/announcements` | hub | Reorder list | published |
| 13 | PATCH | `/api/announcements/[id]` | hub | Update one item | published |
| 14 | DELETE | `/api/announcements/[id]` | hub | Delete one item | published |
| 15 | POST | `/api/upload` | hub | Upload image | published |
| 16 | POST | `/api/upload/from-url` | hub | Fetch image from URL | published |
| 17 | GET | `/api/uploads/[filename]` | hub | Read upload | published |
| 18 | GET | `/api/hymns` | hub | Search hymns | published |
| 19 | GET | `/api/admin/accounts` | hub | List accounts | published |
| 20 | POST | `/api/admin/accounts` | hub | Create account | published |
| 21 | PATCH | `/api/admin/accounts/[id]` | hub | Update account | published |
| 22 | DELETE | `/api/admin/accounts/[id]` | hub | Delete account | published |
| 23 | GET | `/api/admin/settings` | hub | Settings | published |
| 24 | PUT | `/api/admin/settings` | hub | Update settings | published |
| 25 | GET | `/api/admin/artifacts` | registry | List templates | published |
| 26 | GET | `/api/admin/artifacts/[id]` | registry | One template | published |
| 27 | PUT | `/api/admin/artifacts/[id]` | registry | Save layout | published |
| 28 | POST | `/api/admin/artifacts/[id]/reset` | registry | Restore seed | published |
| 29 | GET | `/api/scripture` | presenter | Verse lookup | published |
| 30 | POST | `/api/webhook` | hub | picoclaw intake / correction | published |

#### Findings

- There is no `GET /api/services/[id]`. The Run-Sheet reads SQLite in the Server Component for page `/services/[id]`. Screen inventory row 4.
- `inventory.py` does not read App Router.
- Verbs above from `route.ts` exports 2026-08-18.

### Daftar layar — `inventory-screen.md`

### Inventory — screens

Source: `src/app/**/page.tsx`. Route groups `(operator)` / `(projected)` do not appear in the URL.

#### Rows

| No | Screen | Route | Owning component | Actor | UC served |
| --- | --- | --- | --- | --- | --- |
| 1 | Login | `/login` | hub | Operator | UC-9 |
| 2 | Worship Hub | `/` | hub | Operator | UC-3 |
| 3 | Create service | `/services/new` | hub | Operator | UC-2 |
| 4 | Run sheet | `/services/[id]` | hub | Operator | UC-4, UC-5, UC-6, UC-7, UC-18 |
| 5 | Announcements | `/announcements` | hub | Operator | UC-21 |
| 6 | Settings | `/admin` | hub | Admin | UC-9, UC-19, UC-22 |
| 7 | Artifact Registry | `/admin/artifacts` | registry | Admin | UC-14, UC-15, UC-16 |
| 8 | Web slideshow | `/services/[id]/slideshow` | presenter | Operator | UC-11 |
| 9 | Presenter | `/services/[id]/present` | presenter | Operator | UC-12, UC-13 |
| 10 | Projector | `/services/[id]/present/projector` | presenter | Congregation (recipient) | UC-12 |

#### Findings

- The older EXPERIENCE named the same ten surfaces; aligned with `page.tsx` 2026-08-18.
- `inventory.py` looks for React Router `<Route path>`, not `page.tsx`.
