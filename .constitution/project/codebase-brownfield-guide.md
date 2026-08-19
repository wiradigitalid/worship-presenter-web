---
status: Draft
ratified_by: null
---

# brownfield — codebase guide

**Loaded when:** writing or reviewing code.

Filled at W1 close. The spec companion described the tree *before* UC-15/UC-16 shipped; this file is the as-built ground after W1. While `draft`, MAY be read as guidance and MUST NOT reject a change.

## Two different things are called a snapshot

| Name | What it is | Where |
|---|---|---|
| `RegistrySnapshot` | Live registry map assembled for one plan build. Not durable, not per Service. | `src/lib/artifacts/registry-snapshot.ts` |
| `ServiceRegistrySnapshot` | Durable per-Service freeze on `DB_PATH`. | Table `service_registry_snapshots`; clone/sync in `src/lib/registry/service-snapshot.ts` |

Preview (`POST /api/services/preview`) still reads the live map. A persisted Service's plan/PPTX pass `{ serviceId }`.

## Store verbs that now exist

`src/lib/registry/store.ts` exports list/get/update/reset/insertIfMissing **and** `deleteArtifactTemplate` / `reorderArtifactTemplates`. HTTP: `DELETE /api/admin/artifacts/[id]` with `{ updatedAt }`; `PUT /api/admin/artifacts/order` with `{ items: [{ id, updatedAt }, ...] }` covering every live row.

Delete and reorder bump every survivor's token and compact `position` to `0..N-1`.

`updateArtifactTemplate` still never touches `position`.

## `assertStableAgainstSeed` is still seed-first

Unreachable until a create verb exists (W1 Non-goal). Do not route delete or reorder through it.

## Entry-key set is still three, not AD-19's six

`ARTIFACT_ENTRY_KEYS = ['general', 'song-set', 'announcement']`. `songset-*` is Story 20.7.

## `announcement_items.service_id` stays nullable

OQ-D: not this wave. Scoped writes already set it.

## `data_version` is 2

W1's AD-21 1→2 transition cloned a snapshot for every Service that had none. The pre-counter wipe licence still expires at first deploy.

## Tests are named, not globbed

Add the file to `package.json` `test` or it never runs.

## The Go API is the authorization boundary (AD-5)

A new exclusion ships with its assertion test in the same change set. As-built: `internal/gate` + `tests/go-http-gate.test.mjs`. Sync Artifact is on a Service path gated for any signed-in account, so the route re-checks Admin.
