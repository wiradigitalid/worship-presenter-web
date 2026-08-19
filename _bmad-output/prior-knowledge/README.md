# prior-knowledge

Pre-method archive, restored under `_bmad-output/prior-knowledge/` as **input for G5** (`wdi-build` → `bmad-spec`). Not `.what/` · `.how/` · `.control/`. Not authority.

DEC-001 still holds for live facts: those live in corpus rooms and `_bmad-output/implementation-artifacts/deferred-work.md`. This folder is feeding data. A file here MUST NOT be copied into `.what/` or `.how/`; it enters a wave only through `bmad-spec`.

Contents mirror the tree retired from repo-root `prior-knowledge/` at `b2a54f2`: `docs/` and `_bmad-output/` (planning, implementation, specs, brainstorming).

## Retirement queue

Corpus-guide: a slice MAY be deleted only when (1) old → new IDs are in the PRD addenda, (2) live citations are re-pointed, (3) a `DEC-` records the deletion. **DEC-002** is that decision: each closed wave deletes the paths it names.

Do not empty this tree in one commit. Later waves still need the unbuilt contracts.

| Order | Vehicle | FR / debt | Why this slot | Paths removed at close |
| --- | --- | --- | --- | --- |
| 1 | **W1 closed** `registry-order` | FR-21 | done | `authoring-boundaries.md`; fastpath: `spec-worship-web-input/`, `spec-lyrics-and-flow/`, `spec-slide-artifact-model/`, `docs/`, `planning-artifacts/`, `brainstorming/`; stories `1.*`–`17.*` (no `17-9` file existed); `20-1`, `20-2`; nested `deferred-work.md`; `*retro*` |
| 2 | W2 | FR-20 | General canvas + placeholder catalog | `placeholder-catalog.md`, `slide-kinds.md`, rest of `spec-artifact-registry-authoring/` (`stories/20-4-*` / `20-5-*` were never in this tree) |
| 3 | W3 | AD-20 / remaining FR-21 membership | `songset-*` slots | `stories/20-7-*` if present |
| 4 | W4 | AD-10 | Live projector offset | `stories/26-1-*` if present |
| 5 | later | FR-22 remainder | translation default, book names, matcher | remaining `stories/21-*` |
| 6 | later | FR-23 remainder | song-book registry | remaining `stories/22-*` |
| 7 | later | CAP-10 / seed | strings move, fresh-clone verify | remaining `stories/23-*`, `stories/24-*` |
| 8 | later | AD-6 | webhook token vs carve-out; `updated_at` grain | `stories/25-*` if present |
| 9 | later | Epic 18 | in-route auth | `stories/18-*` if present |
| 10 | later | Epic 17 leftover | toast wiring | `stories/17-9-*` if present |

W1 is closed. Later waves still need the remaining SPEC remainder and story files listed above.

Create/add of a new Artifact Template is **not** W1. SRS Non-Goal until the create verb; AD-17 origin must ship in the same change set as create (Story 20.3 add half / 20.4).

Live debt SSOT remains `_bmad-output/implementation-artifacts/deferred-work.md`, not the nested copy in this tree.
