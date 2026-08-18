---
type: sdd
component: registry
status: draft
created: 2026-08-18
updated: 2026-08-18
realizes: [UC-14, UC-15, UC-16, UC-20]
binds: [AD-7, AD-8, AD-9, AD-11, AD-12, AD-13, AD-14, AD-15, AD-16, AD-17, AD-18, AD-19, AD-20, AD-21, AD-22]
reviewed:
  date: ''
  sha: ''
  lenses: []
---

# SDD — Registry

As-built: global templates in SQLite. Per-Service snapshot (AD-16) **not yet** a table.

## Decision Summary · [outline]

Registry is `/admin/artifacts` plus its API: Deck order, General canvas, SongSet configuration, Reset to seed. The plan reads `artifact_templates` rows (or the map assembled at build), not a JSON file after bootstrap.

Expensive choice: seed is bootstrap + Reset only (AD-17); delete is not revived by restart.

## Structure · [outline]

| LC | type | Responsibility |
| --- | --- | --- |
| LC-11 | gateway | GET/PUT artifacts, POST reset |
| LC-15 | service | SQLite store + validation |

Direction: Admin screen → LC-11 → LC-15 → `artifact_templates`. Hub/Presenter render through LC-16, not this API.

## Inherited Constraints · [guarded]

| AD | Quoted rule | How it lands here |
| --- | --- | --- |
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
| GET /api/admin/artifacts | Slow list | 403/500 | Corrupt row → fail closed (AD-17) | List short one; not a silent seed | id + reason |
| GET /api/admin/artifacts/[id] | Slow | 404 | Payload does not parse → fail closed | Editor does not open a lying layout | log |
| PUT /api/admin/artifacts/[id] | Slow | 404 | AD-15 validation failed → 400; stale → AD-6 shape in the store | Previous layout | console |
| POST …/reset | Slow | 404 | Id without seed → no Reset | Message; Admin override remains (AD-22) | console |
| /admin/artifacts | Heavy canvas | 403 | — | Registry | — |

Sync Artifact (UC-16) is on the Service Hub surface, Admin-only. If the route does not yet exist, that is [MISSING] relative to AD-16.

## Robustness Analysis · [deep]

| UC | Boundary in | Control | Entity | Boundary out |
| --- | --- | --- | --- | --- |
| UC-15 | `/admin/artifacts` + LC-11 | LC-15 | ArtifactTemplate | ordered list; gone survives boot |

UC-14 and UC-16 are not `critical`; their design is in the contract/store. Delete flow: `06-flows/delete-template.md`. `01-ux/` canvas belongs to `wdi-ux` (skipped).

## Evidence

| Claim | Label | Read to decide | Disposition |
| --- | --- | --- | --- |
| `artifact_templates` table exists | verified | `src/lib/db/index.ts` ±500 | — |
| Per-Service snapshot table | [MISSING] | grep `registry_snapshot` / CREATE TABLE in `db/index.ts` | planned: AD-16 / FR-21; not a BUG until a wave closes it |
| `RegistrySnapshot` in code | [PARTIAL] | `src/lib/artifacts/registry-snapshot.ts` = live map per plan, not an AD-16 freeze | do not mix the names |
| Seed does not substitute a missing row at plan time | verified | spine AD-11 closed Story 20.1 | — |
| LC-15 store | verified | `src/lib/registry/store.ts` | — |

---

## Slots

`01-ux/` canvas is not written — belongs to `wdi-ux`. `02-contracts/` (00-inventory, artifacts). No `03-integrations/`. `04-components/LC-15-store.md`. `05-model/data-model.md`. `06-flows/delete-template.md`.

## Open Items

—
