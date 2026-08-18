---
type: structure
scope: document
verified: 2026-08-18
commit: 8701fb8
---

# Document Structure

Written and refreshed only by `wdi-init` intent `structure`, never by hand. Rules live in
`.constitution/structure-guide.md`. Placement test: `document/corpus-guide.md`.

## Verified

2026-08-18, commit `8701fb8`, tree read from disk honouring `.gitignore`.

## Top level

```text
.constitution/                # how we work — populated (method kit)
.control/                     # what currently holds — registries scaffolded, empty of rows
.what/                        # what was promised — empty (no files)
.how/                         # how it is built — empty (no files)
_bmad-output/                 # work in progress, not curated — populated (pre-method corpus)
docs/                         # leftover inventory — not a method layer
```

## Per layer

### `.constitution/`

```text
.constitution/
├── constitution.md           # ★ repo constitution
├── public-repository.md      # ★ public-repo gate
├── language-guide.md
├── repo-guide.md
├── method-glossary.md
├── structure-guide.md
├── method/                   # Reference — explains, does not bind
│   └── README.md             # ★ orientation
├── document/                 # guides + templates
│   ├── corpus-guide.md       # ★ where a file lives
│   ├── delivery-flow-guide.md # ★ gates, mode, risk_accepted
│   └── templates/
├── codebase/                 # Draft until Accepted
└── scripts/                  # validate.py · timeline.py · inventory.py
```

### `.control/`

```text
.control/
├── registry/
│   └── index.yaml            # ★ product.name, global mode, gates_passed
├── questions/                # four files, all empty of items
├── generated/                # generator output — .gitkeep only
├── structure-document.md     # this map
├── structure-codebase.md
├── product-glossary.md
├── project-non-technical-log.md
└── wdi-method.yaml           # install trace
```

### `.what/` · `.how/`

Empty. No Product Component folder exists.

### `_bmad-output/`

Pre-method planning and implementation artifacts. They enter the corpus only through the skill that
owns the slot. Not expanded here.

## Product Components

| Product Component | `.what/<pc>/` | `.how/<pc>/` | Slots split out |
| --- | --- | --- | --- |

None.

## Registries and generated

| File | State |
| --- | --- |
| `registry/index.yaml` | product.name *Worship Presenter Web*; client *Church Name*; `mode: catalog` (owner, 2026-08-18); `gates_passed: []` |
| `registry/components.yaml` | empty (`product_components` · `containers` · `logical_components`) |
| `registry/requirements.yaml` | empty (BG · CAP · FR · NFR · UJ) |
| `registry/usecases.yaml` | empty |
| `registry/decisions.yaml` | empty |
| `registry/waves.yaml` | empty |
| `registry/risks.yaml` | empty |
| `registry/defects.yaml` | empty |
| `generated/` | no tables yet |

## Findings

- `docs/` sits outside the five method roots. `AGENTS.md` names leftover `docs/` as inventory to sort, not a second home.
- `_bmad-output/planning-artifacts/` still holds the living BMad brief, PRD, spine, UX, epics. Authority until G1–G3 land replacements; then retire.
- `.what/` and `.how/` exist on disk with no tracked files — empty dirs are not in git until a skill writes a skeleton.
- No `generated/status` yet. `wdi-help` cannot answer from a generated status file.

---

★ = key document: single-copy, referenced from elsewhere, or the first thing a reader must find.
