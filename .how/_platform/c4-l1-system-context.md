---
type: c4
level: l1
status: draft
created: 2026-08-18
updated: 2026-08-18
---

# C4 L1 — System context

Provenance: as-built `src/` + EXPERIENCE IA. Not regenerated from scratch.

```mermaid
C4Context
    Person(operator, "Operator", "Multimedia team")
    Person(events, "Events", "Rundown sender")
    Person(admin, "Admin", "Accounts and Registry")
    Person_Ext(congregation, "Congregation", "Never opens the system")
    System(wpw, "Worship Presenter Web", "Hub, Deck generate, presenter")
    System_Ext(telegram, "Telegram", "Rundown channel")
    System_Ext(picoclaw, "picoclaw", "Interpreting agent")
    System_Ext(ppt, "Presentation app", "Plays offline PPTX")
    Rel(events, telegram, "sends Rundown")
    Rel(picoclaw, telegram, "reads")
    Rel(picoclaw, wpw, "POST /api/webhook")
    Rel(operator, wpw, "review, download, present")
    Rel(admin, wpw, "accounts, Registry")
    Rel(wpw, ppt, "PPTX file")
    Rel(congregation, ppt, "watches the screen")
```

External systems: Telegram, picoclaw, PPTX player. Our one container: `web` (Next.js). The Go+SPA direction is in the brief addendum, not yet an AD (OQ-6).
