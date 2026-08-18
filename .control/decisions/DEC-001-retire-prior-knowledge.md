---
type: decision
id: DEC-001
status: applied
touches:
  - _bmad-output/implementation-artifacts/deferred-work.md
  - .constitution/project/deployment.md
  - .constitution/project/private-data.md
  - .constitution/public-repository.md
  - .control/questions/assumptions.md
  - .control/registry/decisions.yaml
  - .control/structure-codebase.md
  - .control/structure-document.md
  - .how/_platform/ARCHITECTURE-SPINE.md
  - .how/_platform/design-system.md
  - .how/hub/SDD-hub.md
  - .what/_prd/offline-deck/addendum.md
  - .what/_prd/offline-deck/prd.md
  - .what/_prd/operator-turn/addendum.md
  - .what/_prd/operator-turn/prd.md
  - .what/_prd/rundown-to-service/addendum.md
  - .what/_prd/rundown-to-service/prd.md
  - .what/_product-brief/addendum.md
  - .what/registry/03-domain/deck-frame.md
  - .what/registry/SRS-registry.md
  - README.md
  - CONTRIBUTING.md
  - SECURITY.md
  - tests/doc-citations.test.mjs
  - tests/theme-chrome.test.mjs
  - tests/canvas-dirty-guard.test.mjs
supersedes: null
superseded_by: null
created: '2026-08-19'
---

# DEC-001 — The pre-method archive is retired; live facts live in corpus rooms

## Decision

`prior-knowledge/` is retired. Facts that still hold live in `.what/` · `.how/` · `.control/` · `_bmad-output/implementation-artifacts/deferred-work.md` · `.constitution/project/`. `wdi-ux` is not run; operator chrome tokens live in `.how/_platform/design-system.md` and screens live in `inventory-screen.md`.

## Why

The Product Owner instructed the retirement on 2026-08-19 (extract into rooms, then delete; unattended). The archive was input. Copying it into `.what/` or `.how/` is forbidden. What still binds — open implementation debt, private-data how-to, deploy durable paths, deck frame, measured contrast pairs — is extracted into the slot that owns it. Old epic/story/SPEC/review files are delivery history, not live promises; those promises already sit in the three area PRDs and `requirements.yaml`. The owner had already skipped `wdi-ux`; landing a full EXPERIENCE/DESIGN rewrite is out of scope for this retirement.

## Cost

Git history of the archive is gone from the working tree (it remains in git until a commit). Readers looking for old epic numbers must use the FR map in the operator-turn addendum. A later `wdi-ux` run starts from as-built code and `design-system.md`, not from the retired EXPERIENCE/DESIGN files.
