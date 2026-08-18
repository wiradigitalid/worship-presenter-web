---
type: structure
scope: document
verified: 2026-08-18
commit: 84db8e7
---

# Document Structure

Written and refreshed only by `wdi-init` intent `structure`, never by hand. Rules live in
`.constitution/structure-guide.md`. Placement test: `document/corpus-guide.md`.

## Verified

2026-08-18, commit `84db8e7` plus working tree G2–G4 `mode: deep` unpublished, honouring `.gitignore`.

## Top level

```text
.constitution/                # how we work — populated
.control/                     # what currently holds — registries + maps
.what/                        # what was promised — brief, 3 PRD, 3 SRS
.how/                         # how it is built — spine, C4, 3 SDD deep
_bmad-output/                 # BMad workspace — old planning moved
prior-knowledge/              # pre-WDI archive (not a method layer)
```

## Per layer

### `.constitution/`

```text
.constitution/
├── constitution.md
├── public-repository.md      # ★ public-repo gate
├── document/
│   ├── corpus-guide.md       # ★
│   ├── delivery-flow-guide.md
│   └── templates/
└── scripts/                  # validate.py · timeline.py · inventory.py
```

### `.control/`

```text
.control/
├── registry/
│   ├── index.yaml            # ★ product.name, mode, gates_passed
│   ├── components.yaml       # ★ PC · container web · LC
│   ├── requirements.yaml
│   └── usecases.yaml
├── questions/assumptions.md
├── memlog/
├── generated/                # validate.py --generate
├── structure-document.md
├── structure-codebase.md
└── product-glossary.md
```

### `.what/`

```text
.what/
├── _product-brief/           # ★ brief.md
├── _prd/
│   ├── rundown-to-service/
│   ├── offline-deck/
│   └── operator-turn/
├── business-rules.md
├── hub/
├── presenter/
└── registry/
```

### `.how/`

```text
.how/
├── _platform/
│   ├── ARCHITECTURE-SPINE.md # ★
│   ├── c4-l1-system-context.md
│   ├── c4-l2-containers.md
│   ├── c4-l3-web.md
│   └── inventory-*.md
├── hub/
├── presenter/
└── registry/
```

### `prior-knowledge/`

Archive: the old `docs/` and `_bmad-output/` planning/implementation/specs. Not authority. README at that folder's root.

## Product Components

| Product Component | `.what/<pc>/` | `.how/<pc>/` | Slots split out |
| --- | --- | --- | --- |
| hub | SRS-hub.md | SDD-hub.md | 02-rules, 03-domain, 04-usecases, 05-scenarios; 02-contracts, 03-integrations, 04-components, 05-model, 06-flows |
| presenter | SRS-presenter.md | SDD-presenter.md | 02-rules, 03-domain, 04-usecases, 05-scenarios; 02-contracts, 04-components, 05-model |
| registry | SRS-registry.md | SDD-registry.md | 02-rules, 03-domain, 04-usecases, 05-scenarios; 02-contracts, 04-components, 05-model, 06-flows |

## Registries and generated

| File | State |
| --- | --- |
| `registry/index.yaml` | product.name Worship Presenter Web; `mode: deep`; `gates_passed: []` |
| `registry/components.yaml` | 3 PC `mode: deep`, container `web`, LC-1…LC-16 |
| `registry/requirements.yaml` | BG · CAP · FR-1…28 · NFR · UJ |
| `registry/usecases.yaml` | UC-1…UC-23 |
| `registry/decisions.yaml` | empty |
| `registry/waves.yaml` | empty |
| `generated/` | filled by `validate.py --generate` |

## Findings

- `docs/` at the root already moved to `prior-knowledge/docs/`.
- `_bmad-output/planning-artifacts/` no longer lives at the BMad root; its copy is in `prior-knowledge/_bmad-output/`.
- `inventory.py` does not derive a Next.js inventory — written by hand from `src/`.
- `wdi-ux` was not run; `01-ux/` is empty on all three PCs; EXPERIENCE/DESIGN are in the archive.
- The `weekly-sabbath` PRD folder was withdrawn (too global); three area PRDs replace it. History: `.control/memlog/prd-weekly-sabbath.md`.
- `gates_passed` is empty until the owner marks a gate.
- `g4_passed: false` on all three PCs; `wdi-review` has not been run (the owner skipped the gate check).

---

★ = key document: single-copy, referenced from elsewhere, or the first thing a reader must find.
