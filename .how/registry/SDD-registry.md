---
type: sdd
component: registry
status: draft
created: 2026-08-18
updated: 2026-08-19
realizes: [UC-14, UC-15, UC-16, UC-20]
binds: [AD-5, AD-6, AD-7, AD-8, AD-9, AD-11, AD-12, AD-13, AD-14, AD-15, AD-16, AD-17, AD-18, AD-19, AD-20, AD-21, AD-22]
reviewed:
  date: ''
  sha: ''
  lenses: []
---

# SDD — Registry

As-built: global templates in SQLite. Per-Service snapshot (AD-16) **not yet** a table.

## Decision Summary · [outline]

Registry is `/admin/artifacts` plus its API: layout, Reset to seed, ordered list. Admin reorder and delete HTTP are [MISSING] (FR-21 / UC-15). The plan reads `artifact_templates` rows (or the map assembled at build), not a JSON file after bootstrap.

Expensive choice: seed is bootstrap + Reset only (AD-17); a deleted row is not revived by restart (verified; Admin verb still [MISSING]).

## Structure · [outline]

| LC | type | Responsibility |
| --- | --- | --- |
| LC-11 | gateway | GET/PUT artifacts, POST reset |
| LC-15 | service | SQLite store + validation |

Direction: Admin screen → LC-11 → LC-15 → `artifact_templates`. Hub/Presenter render through LC-16, not this API.

## Inherited Constraints · [guarded]

| AD | Quoted rule | How it lands here |
| --- | --- | --- |
| AD-5 | `src/proxy.ts` is the one request gate, and its `config.matcher` regex **is** the authorization boundary — anything it does not match is served with no session check at all, so a new exclusion ships together with its assertion in `tests/proxy-matcher.test.mjs` in the same change set. | `/admin/artifacts` and `/api/admin/artifacts/**` sit inside the matcher (AD-14). |
| AD-6 | every service mutation carries the client's `updated_at` as a precondition; a stale value is rejected with HTTP 409 and the client re-reads before retrying. No write path may bypass the precondition. | PUT artifacts: `updatedAt` / `RegistryStaleError`. Sync Artifact is [MISSING] (AD-16). |
| AD-7 | `buildSlidePlan` is the single source of slide order and content for every surface. | Registry supplies entries; the plan orders. |
| AD-8 | image references resolve only through the shared helpers in `src/lib` | Save canvas. |
| AD-9 | schema changes go through the app's startup DDL on the `getDb` path. | `artifact_templates` table. |
| AD-11 | The live Artifact Registry is stored in SQLite on the durable `DB_PATH` (AD-4). | Not live JSON. |
| AD-12 | a renderer never **reads data from** the registry itself. | Plan only. |
| AD-13 | The Canvas Editor uses an Uncontrolled Wrapper pattern. | Fabric holds state until save. |
| AD-14 | Artifact templates are global across services. | Admin-only UI. Global clause partly superseded by AD-16. |
| AD-15 | Layouts use a fixed 16:9 canvas with normalized percentage coordinates and stable template/layout/element/placeholder IDs. | Validate on every write. |
| AD-16 | Creating a worship service **clones** the ordered live registry … into a **service-bound snapshot** | **Not yet** in DDL. Today a new Service follows the live Registry. |
| AD-17 | The seeder initialises data **from zero only** — first install, first run — and is gated by a marker in `settings`. | Delete stays deleted. |
| AD-18 | A shipped change that must reach rows already persisted travels as an **explicit, one-time migration** on the startup path, versioned per AD-21. | Not a re-seed. |
| AD-19 | a key referenced across a boundary is **server-owned vocabulary, enforced on every write path**, and it is never administrator configuration. | SongSet slots. |
| AD-20 | every slide in the deck originates from an ordered registry entry. | Planner does not inject liturgy slides. Half of *Prevents* is still debt (handler ids). |
| AD-21 | All persisted data shares **one monotonic version number** in `settings` | `data_version`. |
| AD-22 | authoring authority is fixed per kind, and no surface widens it. | General vs SongSet vs Announcement. |

## Failure Behaviour · [guarded]

| Boundary | Slow | Absent | Lying | What the user sees | What is logged |
| --- | --- | --- | --- | --- | --- |
| GET /api/admin/artifacts | Slow list | 403/500 | Summaries do not parse payload; a corrupt row still appears | Full list of labels | console.error on 500 |
| GET /api/admin/artifacts/[id] | Slow | 404 | Payload does not parse → 500; no seed substitute | Editor does not open a lying layout | console.error: id + reason |
| PUT /api/admin/artifacts/[id] | Slow | 404 | AD-15 validation failed → 400; stale → AD-6 shape in the store | Previous layout | console.error: id + reason |
| POST /api/admin/artifacts/[id]/reset | Slow | 404 | Id without seed → 404 `Template not found`; Reset is not available | Layout returns to seed; override record remains (AD-22). Without seed: show that Reset failed | console.error: id + reason |
| /admin/artifacts | Heavy canvas | 403 | — | Editor does not open; last saved layout remains | — |

Process timeout: Next/Node default. Registry does not retry to the client; Admin presses again.

Plan read (`loadRegistrySnapshot`): a corrupt row is omitted from the Deck and logged with id + reason; it is not silently re-seeded (AD-17). Sync Artifact (UC-16) is a Hub surface, Admin-only. Do not invent a Registry route. [MISSING] — Evidence.

## Robustness Analysis · [deep]

| UC | Boundary in | Control | Entity | Boundary out |
| --- | --- | --- | --- | --- |
| UC-15 | `/admin/artifacts` + LC-11 | LC-15 | ArtifactTemplate | ordered list; gone survives boot |

UC-14 and UC-16 are not `critical`. UC-16 is a Hub surface once AD-16 ships; do not invent a Registry Sync route. Delete flow: `06-flows/delete-template.md`. `01-ux/` canvas belongs to `wdi-ux` (skipped).

## Evidence

| Claim | Label | Read to decide | Disposition |
| --- | --- | --- | --- |
| `artifact_templates` table exists | verified | `src/lib/db/index.ts` ±500 | — |
| Per-Service snapshot table | [MISSING] | grep `registry_snapshot` / CREATE TABLE in `db/index.ts` | planned: AD-16 / FR-21; not a BUG until a wave closes it |
| Sync Artifact HTTP route | [MISSING] | grep `syncArtifact` / `src/app/api/**/route.ts` | planned: AD-16 / FR-21; Hub surface, not a Registry inventory row |
| Admin delete / reorder verb | [MISSING] | `store.ts` exports list/get/update/reset/insertIfMissing; no DELETE or reorder on LC-11 | planned: FR-21 / UC-15. AD-17 non-revival is verified by SQL delete in `tests/registry-reseed.test.mjs` |
| `RegistrySnapshot` in code | [PARTIAL] | `src/lib/artifacts/registry-snapshot.ts` = live map per plan, not an AD-16 freeze | do not mix the names |
| Seed does not substitute a missing row at plan time | verified | spine AD-11 closed Story 20.1 | — |
| LC-15 store | verified | `src/lib/registry/store.ts` | — |

---

## Slots

`01-ux/` canvas is not written — belongs to `wdi-ux`. `02-contracts/` (00-inventory, artifacts). No `03-integrations/`. `04-components/LC-15-store.md`. `05-model/data-model.md`. `06-flows/delete-template.md`.

## Open Items

—
