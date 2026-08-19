---
type: c4
level: l1
status: draft
created: 2026-08-18
updated: 2026-08-19
---

# C4 L1 — System context

Provenance: as-built `src/` + EXPERIENCE IA. Amended DEC-003 (not regenerated from scratch).

```mermaid
C4Context
    Person(operator, "Operator", "Multimedia team")
    Person(events, "Events", "Later Rundown sender")
    Person(admin, "Admin", "Accounts and Registry")
    Person_Ext(congregation, "Congregation", "Never opens the system")
    System(wpw, "Worship Presenter Web", "Hub, Deck generate, presenter")
    System_Ext(telegram, "Telegram", "Rundown channel")
    System_Ext(picoclaw, "picoclaw", "Interpreting agent")
    System_Ext(ppt, "Presentation app", "Plays offline PPTX")
    Rel(operator, wpw, "enters Rundown, review, download, present")
    Rel(admin, wpw, "accounts, Registry")
    Rel(events, telegram, "later: sends Rundown")
    Rel(picoclaw, telegram, "later: reads")
    Rel(picoclaw, wpw, "later: POST /api/webhook")
    Rel(wpw, ppt, "PPTX file")
    Rel(congregation, ppt, "watches the screen")
```

This phase: Operator enters the Rundown in Hub. Telegram and picoclaw remain on the diagram as last-phase intake (CAP-11). External systems: Telegram, picoclaw, PPTX player. Inside the boundary (L2): `api`, `spa`, `pptx-worker` (DEC-003 / AD-30).
