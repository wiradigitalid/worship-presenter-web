---
type: c4
level: 3
container: api
created: 2026-08-18
updated: 2026-08-19
---

# C4 L3 — api

Boxes = Product Component. Container `api` holds all three, so L3 is required. Amended from the retired `web` L3 (DEC-003); that drawing was not regenerated from scratch.

```mermaid
C4Component
    Container_Boundary(api, "api") {
        Component(hub, "Hub", "Service, accounts, announcements, webhook, plan")
        Component(registry, "Registry", "Artifact Template store, snapshot clone")
        Component(presenter, "Presenter", "scripture API")
    }
    Rel(hub, registry, "reads order/layout via plan; Sync")
    Rel(hub, presenter, "Operator opens the same Service URL")
    Rel(presenter, registry, "hydrated plan; does not write Registry")
```

## Elements

| Element | What it is | Notes |
| --- | --- | --- |
| Hub | Operator door; Hub-form intake this phase; webhook later (CAP-11); owns LC-16 plan | rundown-to-service FRs + operator-turn Hub |
| Registry | Deck structure in SQLite | Not the week's payload |
| Presenter | Verse lookup API (LC-9) | Screens live on `spa` |

## Relationships

| From | To | Purpose | Over |
| --- | --- | --- | --- |
| Hub | Registry | `buildSlidePlan` + Sync Artifact | Modules in the Go process |
| Hub | Presenter | Operator moves to slideshow/presenter | URL navigation (SPA) |
| Presenter | Registry | Hydrated slide plan | Plan built in Hub LC-16 (AD-7, AD-12); Presenter does not write templates |

## What is deliberately not shown

- Gateway LCs (`LC-1`…`LC-11` except LC-10) — listed in `components.yaml` and the SDD.
- PptxGenJS — `pptx-worker` (LC-13), not inside `api`.
