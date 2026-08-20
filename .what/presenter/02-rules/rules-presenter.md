---
type: rules
scope: component
component: presenter
status: draft
created: 2026-08-18
updated: 2026-08-20
---

# Business Rules — Presenter

## Rules

| id | Rule | Binds | Source | Status |
| --- | --- | --- | --- | --- |
| BR-6 | Blank blacks the Congregation screen without changing Deck position, and covers an open overlay without clearing it. | presenter | FR-16 · UC-12 · OQ-25 | active |
| BR-7 | A verse overlay does not write the Service payload. | presenter | FR-19 · UC-13 | active |
| BR-8 | A live background override lasts for the rest of the presenter session only, applies to every Verse/Reff slide shown during it, and never writes the Service payload or the Registry; the next generate or Sync resolves through the normal order (entry's own weekly choice → Admin global default → blank). | presenter | FR-33 · UC-27 · AD-34 | active |
| BR-9 | A group marker (Song Set or Announcement Set) may appear as operator chrome in the Presenter's own control list; it is never a projected slide and never carries a slide number — only its children do. | presenter | UC-12 · AD-24 · AD-33 · AD-35 | active |
