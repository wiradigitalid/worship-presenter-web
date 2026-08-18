# Agent Rules — worship-presenter-web

This repository is **public**. Congregation data never enters it. The WDI method applies; method
files arrive from the public WDI Method package via `npx wdi-method install` / `update`. This file
is loaded every session; everything else is loaded **lazily**, only when the task matches.

## Public repository

Full rule: `.constitution/public-repository.md`. Before **every** `git commit` and **every** `git push`:

1. Refuse to stage `.env*`, `data/local/`, `data/uploads/`, `data.db*`, `slides*/`, `*.pptx` /
   `*.potx`, or any real congregation / payment / production-host data.
2. Run `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/public-repo-guard.test.mjs`
   (or `npm test`).
3. On failure, fix the tracked content. Never weaken the guard.

Never commit real names, photographs, prayer requests, phones, addresses, bank accounts, payment QR
codes, uploaded flyers, rendered slides, or source decks. Example content uses a **synthetic
congregation**. Invent a name — do not reach for a real member's. Real data lives in
`data/local/default-registry.json` (gitignored). The legacy repo `bic-pptx-workflow` is frozen.

## Language

Prose in this repo is Bahasa Indonesia; a technical term the industry writes in English MUST be left
in English. Names — code identifiers, files, database columns — follow `.constitution/language-guide.md`.

`AGENTS.md`, `CLAUDE.md`, and `.constitution/` are agent-instruction files (English). `.control/`,
`.what/`, and `.how/` are product content and MUST stay Bahasa Indonesia. Registry values are
English keys: `mode: catalog`, `status: applied`, `risk_accepted: low`.

## The thing in your hand → its folder

| The thing in your hand | Its folder |
|---|---|
| A rule, a guide, a template — how we work | `.constitution/` |
| The explanation of a rule, never a rule itself | `.constitution/method/` |
| A decision, an open question, a registry, a structure map, minutes | `.control/` |
| The brief, a PRD, a use case, a business rule — what is promised | `.what/` |
| The spine, C4, an inventory, an SDD, a contract — how it is built | `.how/` |
| A skill run's working output, and documents that predate the method | `_bmad-output/` |
| Scratch that empties when the task closes. **Gitignored here** — this repo is public | `.work/` |
| The application | `src/` · `public/` · `scripts/` · `tests/` |

Existing planning, UX, spine, specs, and stories live in `_bmad-output/` until they enter the corpus
through the skill that owns each slot. They MUST NOT be copied into `.what/` or `.how/` by hand.
`docs/` is leftover operator material — inventory, not a second corpus.

The placement test: **is this file still correct after its wave has passed?** Yes → the corpus. No →
`_bmad-output/`. In doubt → `document/corpus-guide.md`.

## Depth, gates, skills

| Field | Where | Controls |
|---|---|---|
| `mode` | `index.yaml` globally, `components.yaml` per component | **Document depth** only. `catalog` · `outline` · `guarded` · `deep`; default `catalog` |
| `risk_accepted` | `components.yaml` per component | **Review intensity** only. `low` · `medium` · `high` |

Per-component `mode` wins. No third scope. A component at `catalog` **skips G4**. Neither field MUST
be derived from the other. `document/delivery-flow-guide.md` owns both.

| Gate | Decides | Skill |
|---|---|---|
| **G1 Problem** | What the problem is, whose it is, why it earns work | `wdi-problem` |
| **G2 Product** | What is built, and how it feels to use | `wdi-product` · optional `wdi-ux` |
| **G3 Blueprint** | The whole portrait, once per product | `wdi-blueprint` |
| **G4 Component** | How one component is built — **skipped at `catalog`** | `wdi-component` |
| **G5 Release** | Whether it is done and proven | `wdi-build` |

Before G1 and at the tail of G2: `wdi-init` (`setup` · `component` · `mode` · `risk` · `structure`).
Any time: `wdi-decision` · `wdi-question` · `wdi-log` · `wdi-help` · `wdi-reconcile` · `wdi-review` ·
`wdi-report` · `wdi-systematic-debugging`.

**No BMad skill is invoked directly.** Each has a wrapper.

Until G1–G3 have been run here, the documents that describe this product remain in
`_bmad-output/planning-artifacts/` and `_bmad-output/specs/`. Fast Path (`wdi-build` / a small fix
that touches no `FR`, `UC`, `AD-N`, or domain model) MAY still ship against those.

## What MUST NOT be done

- A method file MUST NOT be invented here. Fix it in the WDI Method package, then `npx wdi-method update`.
- A file in `_bmad-output/prior-knowledge/` MUST NOT be copied into `.what/` or `.how/`.
- `.control/generated/` MUST NOT be written by hand.
- The two structure maps MUST NOT be edited by hand — `wdi-init` intent `structure` re-derives them.
- A `DEC-` with status `applied` MUST NOT be edited except to record supersession.
- A file in `.constitution/method/` MUST NOT be cited to reject a change (`status: Reference`).
- More than the component's `mode` demands MUST NOT be written.
- `.claude/skills/bmad-*/customize.toml` MUST NOT be edited; customise through `_bmad/custom/`.

## Routing — load a guide when the task matches

| Task | Load |
|---|---|
| Wanting the whole method in five minutes | `.constitution/method/README.md` |
| About to change a rule, and needing to know what breaks | `.constitution/method/rationale.md` |
| Asking whether a document exists at this `mode`, or where a file goes | `.constitution/method/artifact-map.md` |
| Unsure whether a file may exist in this repo | `.constitution/repo-guide.md` · `public-repository.md` |
| Unsure where a file lives | `.constitution/document/corpus-guide.md` |
| Unsure what a method term means | `.constitution/method-glossary.md` |
| Unsure about a domain term | `.control/product-glossary.md` |
| Naming anything | `.constitution/language-guide.md` |
| Asking "which gate now, what next" | `.constitution/document/delivery-flow-guide.md` · skill `wdi-help` |
| Setting `mode` or `risk_accepted` | `delivery-flow-guide.md` · skill `wdi-init` |
| Invoking a BMad skill | `.constitution/document/bmad-guide.md` |
| Writing a brief / PRD / UX / SRS / SDD / spine | the matching `document/*-guide.md` |
| Opening a `DEC-` | `.constitution/document/decision-guide.md` |
| Looking for where code or documents live | `.control/structure-codebase.md` · `structure-document.md` |
| Writing or reviewing code | `.constitution/codebase/stack-guide.md` · `conventions-guide.md` · `brownfield-guide.md` |

## Bugs, decisions, questions

- A bug, a failing test, or unexpected behaviour → `wdi-systematic-debugging`, **before** any fix.
- A decision worth remembering → `wdi-decision`. Not mandatory unless it contradicts an `AD-N`.
- Something that cannot be decided now → `wdi-question`. Default class: `assumptions.md`.
- A non-technical fact that constrains the build → `wdi-log` intent `fact`.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Code

Next.js app in `src/`. Package versions: `package.json`. Until `codebase/*-guide.md` are
`Accepted`, they MAY be read as guidance and MUST NOT reject a change.

A test that asserts something is **absent** is worth nothing until it has been seen to fail. Prove
every new or changed absence-guard by injecting the defect, then reverting. Inject every form the
guard claims to cover. Do not narrow a guard to silence a false positive without re-proving it.

## Policy

- A skill MUST NOT be invoked automatically. Name the one that fits and wait for the owner's
  go-ahead. Reading a skill as reference is fine.
- `.work/` is gitignored here. It MUST NOT be imported by `src/`, MUST NOT be committed, and MUST be
  excluded when searching for code.

## Sync rule for this file

`CLAUDE.md` MUST remain `@AGENTS.md`. `.agents/AGENTS.md` and `.cursorrules` MUST be identical to
this file.
