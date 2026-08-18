---
type: c4
level: 3
container: web
created: 2026-08-18
updated: 2026-08-18
---

# C4 L3 — web

Boxes = Product Component. One `web` container holds all three, so L3 is required.

```mermaid
C4Component
    Container_Boundary(web, "web") {
        Component(hub, "Hub", "Service, accounts, announcements, webhook, generate/download")
        Component(registry, "Registry", "Artifact Template, Sync, canvas")
        Component(presenter, "Presenter", "slideshow, two screens, verse")
    }
    Rel(hub, registry, "reads order/layout via plan; Sync")
    Rel(hub, presenter, "Operator opens the same Service URL")
    Rel(presenter, registry, "hydrated plan; does not write Registry")
```

## Elements

| Element | What it is | Notes |
| --- | --- | --- |
| Hub | Operator door + Events intake | rundown-to-service FRs + operator-turn Hub |
| Registry | Deck structure | Not the week's payload |
| Presenter | In-browser present | Offline guarantee remains PPTX on Hub |

## Relationships

| From | To | Purpose | Over |
| --- | --- | --- | --- |
| Hub | Registry | `buildSlidePlan` + Sync Artifact | Server modules in the same process |
| Hub | Presenter | Operator moves to slideshow/presenter | URL navigation |
| Presenter | Registry | Hydrated slide plan | `buildSlidePlan` (AD-7, AD-12); Presenter does not write templates |

## What is deliberately not shown

- Gateway LCs (`LC-1`…`LC-11`) — listed in `components.yaml` and the SDD.
- PptxGenJS — called by Hub on download, still in the `web` process.
