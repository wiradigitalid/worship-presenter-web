---
type: sprint-change-proposal
created: 2026-08-19
trigger: OQ-6 void
lands_as: DEC-003
---

# Sprint Change Proposal — Go API, React SPA, Node PPTX worker

`bmad-correct-course` output. This file is the run record. Living rules land through `wdi-decision` as **DEC-003**. This skill MUST NOT edit `.what/` or `.how/`.

Owner direction 2026-08-19: after W1 close, continue G1→G5 with the API in Go, React remaining the frontend, PptxGenJS only to generate PPTX, and no always-on Node/Next.js server.

## 1. Issue summary

**Void assumption (one line):** OQ-6 assumed G3 remains as-built one Next.js `web` container until the owner treats Go+SPA as binding; the owner now treats it as binding.

This is a stakeholder stack pivot, not a bug found in a story. W1 is **closed**. No story is `in-progress`. The correction does not patch W1 and MUST NOT apply into that wave.

Evidence: brief addendum already described this shape as “next architecture, not a G1 problem”; spine line 22 and C4 L2 both defer it to a `DEC-`; `components.yaml` repeats OQ-6.

## 2. Impact analysis (checklist)

| Item | Status | Finding |
|---|---|---|
| 1.1 Triggering story | N/A | Not a story defect. Owner after W1 close. |
| 1.2 Core problem | Done | Strategic pivot: always-on process is Go, not Next.js. |
| 1.3 Evidence | Done | Owner 2026-08-19; addendum; OQ-6 cost clause. |
| 2.x Epics | N/A | Stories route; no `epics.md`. W1 closed. New work is a **new wave**, size **L** (new container). |
| 3.1 PRD | Done | No FR promise change. MVP still Hub rundown + PPTX. Skip `wdi-product` except if wording named Next.js (it does not). |
| 3.2 Architecture | Done | Collides with AD-2, AD-4, AD-5, AD-9, AD-24. New AD-30. C4 L1/L2/L3. Inventories Host/Screen. |
| 3.3 UX | Done | IA routes unchanged. Design-system “on Next.js” wording. No EXPERIENCE.md in corpus (extracted design-system only). |
| 3.4 Secondary | Done | `deployment.md`, Docker/Next standalone, `inventory-readers.py`, stack/brownfield guides, tests on `proxy.ts`. |
| 4.1 Direct adjustment of W1 stories | Not viable | W1 closed; must not apply into a closed wave. |
| 4.2 Rollback W1 | Not viable | Registry HTTP and snapshot stay; this is runtime shape, not FR-21. |
| 4.3 PRD MVP review | Not viable | Promises hold. |
| 4.4 Path | Done | **Hybrid:** course-correction DEC + G3 delta + G4 SDD quotes + **new G5 wave**. Not a patch inside W1. |

**>30% of a wave’s stories:** does not apply (no open wave).

### Scan `bmad-correct-course` cannot see (wrapper)

| Layer | Finding |
|---|---|
| `.what/_prd/` | FR/NFR unchanged. Area PRDs do not name Next.js as a promise. |
| `.what/<pc>/` | UC catalogue and flows unchanged (no solution shape in behaviour). Hub SRS Open Items cites OQ-6. |
| `.how/_platform/` | AD-2/4/5/9/24; Design Paradigm; stack seed; C4 `web`; inventories Host `web`; `c4-l3-web.md`. |
| `.how/<pc>/` | SDD Inherited Constraints quote AD-5 `src/proxy.ts`; LC `container: web`; LC-13 notes worker is addendum-only. |
| `SPEC.md` | W1 SPEC is a closed projection. MUST NOT be edited. Re-derive for W2. |
| `waves.yaml` | W1 closed. Open W2 via `wdi-build`. Size L. |
| Story files | None `in-progress`. |

## 3. Recommended approach

Land DEC-003, amend living ADs in place, add **AD-30**, split containers to `api` / `spa` / `pptx-worker`, then a cutover wave. Do not reopen W1. Do not rewrite UC flows.

## 4. Detailed change proposals (for apply)

Quoted decision lives in DEC-003. Owners:

- Brief addendum: lock the addendum constraints as binding (DEC-003). Problem unchanged — not a full brief rewrite.
- PRDs: no FR edit.
- Blueprint platform: spine, C4, inventories, `containers:`.
- Component design: Hub / Registry / Presenter SDD quotes and LC `container`.
- UX: design-system one line.
- Init: structure maps after C4 files exist; readers Host/Screen constants.
- Question: close OQ-6.

## 5. Implementation handoff

**Scope: Major** — new containers, new always-on process.

Success: production has no Next.js/Node HTTP server; Go serves the API (and SPA files); PptxGenJS is an on-demand child that does not open SQLite; existing FR proofs still hold.

Checklist completion: 1.1 N/A; 2.x N/A (stories route); 6.3 owner approval = “oke kerjakan semuanya” 2026-08-19; 6.4 sprint-status.yaml NOT USED.
