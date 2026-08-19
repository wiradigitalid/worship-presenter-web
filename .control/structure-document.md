---
type: structure
scope: document
verified: 2026-08-19
commit: bfa1dad
---

# Document Structure

Written and refreshed only by `wdi-init` intent `structure`, never by hand. Rules live in
`.constitution/method/structure-guide.md`. Placement test: `.constitution/method/document/corpus-guide.md`.

## Verified

2026-08-19, commit `bfa1dad` plus unpublished working tree (0.5.3 two-folder constitution, `public-repository.md` in `project/`), honouring `.gitignore`.

## Top level

```text
.constitution/                # how we work — populated (method/ + project/)
.control/                     # what currently holds — registries + maps
.what/                        # what was promised — brief, 3 PRD, 3 SRS
.how/                         # how it is built — spine, C4, 3 SDD deep
_bmad-output/                 # BMad workspace — deferred-work register
```

## Per layer

### `.constitution/`

```text
.constitution/
├── method/                   # kit — overwritten by update
│   ├── constitution.md       # Articles 3, 4, 6, 7
│   ├── document/
│   │   └── corpus-guide.md   # ★ placement
│   ├── scripts/              # validate.py · timeline.py · inventory.py
│   └── why/                  # Reference — does not bind
└── project/                  # this product — never overwritten
    ├── constitution.md       # ★ Articles 1, 2, 5
    ├── public-repository.md  # ★ public-repo gate
    ├── private-data.md
    ├── deployment.md
    └── codebase-*-guide.md
```

### `.control/`

```text
.control/
├── registry/
│   ├── index.yaml            # ★ product.name, mode, gates_passed
│   ├── components.yaml       # ★ PC · container web · LC
│   ├── requirements.yaml
│   ├── usecases.yaml
│   └── decisions.yaml        # DEC-001 applied
├── questions/
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
│   ├── design-system.md
│   ├── c4-l1-system-context.md
│   ├── c4-l2-containers.md
│   ├── c4-l3-web.md
│   └── inventory-*.md
├── hub/
├── presenter/
└── registry/
```

### `_bmad-output/`

Live BMad workspace. Open implementation debt: `implementation-artifacts/deferred-work.md`. Prior documents sit in `prior-knowledge/`.

## Product Components

| Product Component | `.what/<pc>/` | `.how/<pc>/` | Slots split out |
| --- | --- | --- | --- |
| hub | SRS-hub.md | SDD-hub.md | 02-rules, 03-domain, 04-usecases, 05-scenarios; 02-contracts, 03-integrations, 04-components, 05-model, 06-flows |
| presenter | SRS-presenter.md | SDD-presenter.md | 02-rules, 03-domain, 04-usecases, 05-scenarios; 02-contracts, 04-components, 05-model |
| registry | SRS-registry.md | SDD-registry.md | 02-rules, 03-domain, 04-usecases, 05-scenarios; 02-contracts, 04-components, 05-model, 06-flows |

## Registries and generated

| File | State |
| --- | --- |
| `registry/index.yaml` | product.name Worship Presenter Web; `mode: deep`; `gates_passed: [G1, G2, G3]` |
| `registry/components.yaml` | 3 PC `mode: deep`, container `web`, LC-1…LC-16 |
| `registry/requirements.yaml` | BG · CAP · FR-1…28 · NFR · UJ |
| `registry/usecases.yaml` | UC-1…UC-23 |
| `registry/decisions.yaml` | DEC-001 applied — pre-method archive retired |
| `registry/waves.yaml` | empty |
| `generated/` | filled by `validate.py --generate` |

## Findings

- `.work/` exists at the repo root (committed scratch) and is not one of the five corpus roots. Purpose is stated in `AGENTS.md`; not unclaimed.
- `01-ux/` is absent on all three PCs; operator chrome tokens live in `.how/_platform/design-system.md` (DEC-001).
- `inventory.py` does not derive a Next.js inventory — inventories in `.how/_platform/` were written from `src/`.
- `g4_passed: false` on all three PCs; `wdi-review` has not stamped a `reviewed:` trace (V13).
- The `weekly-sabbath` PRD folder was withdrawn; history: `.control/memlog/prd-weekly-sabbath.md`.

---

★ = key document: single-copy, referenced from elsewhere, or the first thing a reader must find.
