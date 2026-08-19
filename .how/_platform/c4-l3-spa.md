---
type: c4
level: 3
container: spa
created: 2026-08-19
updated: 2026-08-19
---

# C4 L3 — spa

Boxes = Product Component. Container `spa` holds all three, so L3 is required. DEC-003.

```mermaid
C4Component
    Container_Boundary(spa, "spa") {
        Component(hub, "Hub", "Operator chrome: list, form, Run-Sheet, admin")
        Component(registry, "Registry", "canvas editor, ordered list")
        Component(presenter, "Presenter", "slideshow, two screens, verse overlay")
    }
    Rel(hub, presenter, "Operator opens the same Service URL")
    Rel(hub, registry, "Admin opens /admin/artifacts")
    Rel(presenter, hub, "missing Service → Hub")
```

## Elements

| Element | What it is | Notes |
| --- | --- | --- |
| Hub | Operator shell | AD-24 theme / `ui_locale` |
| Registry | Admin editor | Fabric in the browser (AD-13) |
| Presenter | Operator controls + projected shell | LC-10 / LC-14 live here; projected URLs closed to chrome (AD-24) |

## Relationships

| From | To | Purpose | Over |
| --- | --- | --- | --- |
| Hub | Presenter | Present this Service | client navigation |
| Hub | Registry | Author templates | client navigation |
| Presenter | Hub | UC-11 missing Service | client navigation |

## What is deliberately not shown

- JSON calls to `api` — L2.
- BroadcastChannel internals — LC-10 in the SDD.
