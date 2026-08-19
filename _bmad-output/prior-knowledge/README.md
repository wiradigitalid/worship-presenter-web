# prior-knowledge

Pre-method archive, restored under `_bmad-output/prior-knowledge/` as **input for G5** (`wdi-build` → `bmad-spec`). Not `.what/` · `.how/` · `.control/`. Not authority.

DEC-001 still holds for live facts: those live in corpus rooms and `_bmad-output/implementation-artifacts/deferred-work.md`. This folder is feeding data. A file here MUST NOT be copied into `.what/` or `.how/`; it enters a wave only through `bmad-spec`.

Contents mirror the tree retired from repo-root `prior-knowledge/` at `b2a54f2`: `docs/` and `_bmad-output/` (planning, implementation, specs, brainstorming).

## Retirement queue

Corpus-guide: a slice MAY be deleted only when (1) old → new IDs are in the PRD addenda, (2) live citations are re-pointed, (3) a `DEC-` records the deletion. **DEC-002** is that decision: each closed wave deletes the paths it names.

Do not empty this tree in one commit. Later waves still need the unbuilt contracts.

| Order | Vehicle | FR / debt | Why this slot | Paths removed at close |
| --- | --- | --- | --- | --- |
| **1 — now** | **W1** `registry-order` | **FR-21** (UC-15 then UC-16) | Only remaining *unique* SPEC contract: order, delete-stays-deleted, Sync. Largest G5 surface. | `authoring-boundaries.md` (20-3/20-6/20-8 never had story files; keys stay in `sprint-status.yaml` until that file is retired) |
| 1b | Fastpath in W1 close | none | Already written into G1–G4; not feeding W2+ | `specs/spec-worship-web-input/`, `specs/spec-lyrics-and-flow/`, `specs/spec-slide-artifact-model/`, `docs/`, `planning-artifacts/`, `brainstorming/`, done stories `1.*`–`17.*` except `17-9`, retros, nested `deferred-work.md` |
| 2 | W2 | FR-20 | General canvas + placeholder catalog | `stories/20-4-*`, `stories/20-5-*`, `placeholder-catalog.md`, `slide-kinds.md`, rest of `spec-artifact-registry-authoring/` |
| 3 | W3 | AD-20 / remaining FR-21 membership | `songset-*` slots; 20.9/20.10 only if still unbuilt | `stories/20-7-*`, optionally `20-9-*`, `20-10-*` |
| 4 | W4 | AD-10 | Live projector offset; independent of Epic 20 | `stories/26-1-*` |
| 5 | later | FR-22 remainder | translation default, book names, matcher | `stories/21-3-*` … `21-5-*` |
| 6 | later | FR-23 remainder | song-book registry | `stories/22-3-*` |
| 7 | later | CAP-10 / seed | strings move, fresh-clone verify | `stories/24-2-*`, `stories/23-2-*` |
| 8 | later | AD-6 | webhook token vs carve-out; `updated_at` grain | `stories/25-1-*`, `stories/25-2-*` |
| 9 | later | Epic 18 | in-route auth on nine routes | `stories/18-1-*` |
| 10 | later | Epic 17 leftover | toast wiring | `stories/17-9-*` |

W4 MAY run in parallel with W1 (`depends_on: []`). It is not first because it does not empty a SPEC folder.

Create/add of a new Artifact Template is **not** W1. SRS Non-Goal until the create verb; AD-17 origin must ship in the same change set as create (Story 20.3 add half / 20.4).

Live debt SSOT remains `_bmad-output/implementation-artifacts/deferred-work.md`, not the nested copy in this tree.
