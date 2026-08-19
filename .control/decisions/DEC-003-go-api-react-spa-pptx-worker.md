---
type: course-correction
id: DEC-003
status: applied
touches:
  - _bmad-output/planning-artifacts/sprint-change-proposal-2026-08-19.md
  - .constitution/project/codebase-brownfield-guide.md
  - .constitution/project/codebase-stack-guide.md
  - .constitution/project/deployment.md
  - .constitution/project/inventory-readers.py
  - .control/decisions/DEC-003-go-api-react-spa-pptx-worker.md
  - .control/questions/answered.md
  - .control/questions/assumptions.md
  - .control/registry/components.yaml
  - .control/registry/decisions.yaml
  - .control/structure-codebase.md
  - .control/structure-document.md
  - .how/_platform/ARCHITECTURE-SPINE.md
  - .how/_platform/c4-l1-system-context.md
  - .how/_platform/c4-l2-containers.md
  - .how/_platform/c4-l3-api.md
  - .how/_platform/c4-l3-spa.md
  - .how/_platform/cross-cutting.md
  - .how/_platform/design-system.md
  - .how/_platform/inventory-api.md
  - .how/_platform/inventory-screen.md
  - .how/hub/04-components/LC-12-service-write.md
  - .how/hub/04-components/LC-13-pptx.md
  - .how/hub/04-components/LC-16-slide-plan.md
  - .how/hub/SDD-hub.md
  - .how/presenter/04-components/LC-14-session.md
  - .how/presenter/SDD-presenter.md
  - .how/registry/04-components/LC-15-store.md
  - .how/registry/SDD-registry.md
  - .what/_product-brief/addendum.md
  - .what/hub/SRS-hub.md
supersedes: null
superseded_by: null
created: '2026-08-19'
---

# DEC-003 — Go API, React SPA, on-demand Node PPTX worker

## Decision

The live system is one repository whose always-on process is a Go API that owns SQLite and assembles the slide plan; the Operator UI and projector are a React SPA; PptxGenJS runs only as an on-demand Node child that draws a finished plan and MUST NOT stay up or open SQLite.

## Why

**Void assumption:** OQ-6 assumed G3 remains as-built one Next.js `web` container until the owner treats Go+SPA as binding; the owner now treats it as binding.

The brief addendum already described this shape (2026-08-18) as the next architecture, not a new user problem. W1 closed on the Next.js as-built. On 2026-08-19 the owner ordered G1→G5 with the API in Go, React remaining the frontend, PptxGenJS only to generate PPTX, and no always-on Node server like Next.js.

This contradicts adopted AD-2 (App Router in the same process), AD-4 (one Next standalone unit as the process model), AD-5 (`src/proxy.ts` as the gate), AD-9 (Next `getDb` startup path), and AD-24 (App Router sibling roots as the chrome mechanism). Those ADs are amended in place; AD-30 records the process split. Product promises (FR/NFR) do not change.

W1 stays closed. No `in-progress` story exists. The cutover is a new wave (size L: new container), not a patch inside W1.

## Cost

Two runtimes and two build paths (Go module + SPA bundle + a Node binary in the image) replace one Next.js process. Session cookies, CORS, and same-origin rules must be designed across the SPA origin and the API. Every existing HTTP test that boots Next must move or grow a Go harness. Until the cutover wave ships, code and inventories still describe Next.js — plan versus as-built is a finding, not a licence to keep Next as the live API.

## Alternatives

Keep Next.js App Router as the always-on process (status quo). Rejected: the owner forbade a resident Node application server.

Go API + keep Next.js only as a BFF for React. Rejected: that is still a Node server.

Separate editor microservice. Rejected: AD-2's cohesive unit still holds; only the process roles change.

## Reversal trigger

A production host cannot run a Go binary and a Node child together, or the SPA cannot share the session cookie with the API without a resident Node BFF. Either observable reopens this as a new `DEC-`.

## Trace

Trigger: owner 2026-08-19 after W1 close. Proposal: `_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-19.md`. Closes OQ-6. Product Owner accept: same message (“oke kerjakan semuanya”). Apply lands AD-2/4/5/9/24 amendments and AD-30.
