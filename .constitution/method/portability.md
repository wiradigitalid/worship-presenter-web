---
status: Reference
---

# Portability — apa yang metode, apa yang proyek

**Opened when:** carrying this method up to `handbook/method/`, or installing it in another repo.

This file **explains**. It does not bind. Installing is the act, and that act lives in
`handbook/method/README.md` plus `tools/wdi-method.py`. Where this file and that README disagree,
the README wins and the disagreement is a defect.

It exists so that "promote the method, leave the product" is not a fresh re-reading of fifty files
every time.

## The seam

Most of `.constitution/` is portable as it stands. A handful name **this product**, and in most of
them only an *example* does — not a rule.

| File | What is this product's | What to do when carrying it |
|---|---|---|
| `constitution.md` | Articles 1, 2, and 5 | **Rewrite those three.** Articles 3, 4, 6, 7 are the method and travel unchanged. `wdi-method promote` already replaces this file with the kit template |
| `document/architecture-guide.md` | Seed examples of stack and tree shape | Re-point the examples. Every rule around them travels |
| `document/corpus-guide.md` | Worked examples of `_platform` ownership | Re-point the examples. **Keep both kinds**: they teach the trap better than the rule alone |
| `templates/design-system.md` | The pointer to wherever this project keeps its tokens | Re-point at that project's token file |
| `templates/oq.md` | One example of a bad question title | Cosmetic |

Everything else — the five gates, the two fields, the fifteen skills, the templates, `validate.py`,
`inventory.py`, `method-glossary.md`, and the three files beside this one — carries without edit.

## What does NOT travel

| Stays behind | Why |
|---|---|
| `.control/` | This product's state. A new project scaffolds its own through `wdi-init` intent `setup`, or receives empty stubs on first `sync` |
| `.what/` · `.how/` | This product's promises and build |
| `.constitution/codebase/*-guide.md` | Written by the **project**, not the method. They ship as empty `Draft` stubs |
| `_bmad-output/` | Run workspace |
| The `bmad-*` skills themselves | BMad's, installed by BMad. Only `_bmad/custom/*.toml` is ours |

## What travels beside `.constitution/`

The method is not `.constitution/` alone. Three sets move together, and carrying one without the
others leaves a method that cannot run:

| Set | Note |
|---|---|
| `.constitution/` | Minus the product articles; `promote` / `sync` handle the seam |
| `.claude/skills/wdi-*/` (and `.agents/skills/wdi-*/` on Cursor) | Every wrapper. A wrapper without its guide, or a guide without its wrapper, is half a method |
| `_bmad/custom/*.toml` | The one most likely to be forgotten. `*.user.toml` stays behind |
| `AGENTS.md` | The routing table is the method; from `## Code` down is the product. `sync` MUST NOT overwrite an existing `AGENTS.md` |

## Two directions

```
live product repo  --promote-->  handbook/method  --sync-->  other product repos
```

- **Promote** copies the method *up* once it has settled in the live repo.
- **Sync** copies that snapshot *out* to a repo that consumes it.
- The live repo MUST NOT be a `sync` target — it is newer than handbook by construction.
- There is no lockfile, no SHA check, no version bump. The snapshot is the unit.

`wdi-kit.py` and `KIT.yaml` are retired. `tools/wdi-method.py` is the only mover.

## Installing in a fresh repo

There is no numbered install runbook: the steps that a runbook used to carry are now `wdi-init`
intent `setup`. The order the acts come in:

1. `uv run tools/wdi-method.py sync <target>` from `handbook/method/`.
2. Rewrite `constitution.md` Articles 1, 2, 5 for the new product.
3. Merge the method routing into `AGENTS.md` if that file already existed.
4. Run `wdi-init` intent `setup`.
5. Sort what already existed. A file that is already the artifact one slot asks for goes into that
   slot through the skill that owns it; everything else goes to `_bmad-output/prior-knowledge/`.
   `corpus-guide.md` owns that test.
6. Then G1.

**Two things a fresh install MUST NOT do:**

- Set `mode` and `risk_accepted` before the components exist. They are per-component fields, and the
  components are born at the tail of G2.
- Fill `.control/generated/` by hand. It is script output, and a hand-written table there is the one
  lie no validator catches.
