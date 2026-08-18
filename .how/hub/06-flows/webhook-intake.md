---
type: flow
component: hub
realizes: [UC-1, UC-17]
risky: true
created: 2026-08-18
---

# Flow — Webhook intake and correction

## Realizes

UC-1 new rundown/upsert; UC-17 `action: correct`. Third party: picoclaw.

## Participants

LC-8 → LC-12 → SQLite. Read-back to picoclaw.

## Happy path

1. picoclaw POST LC-8 with the secret.
2. LC-8 refuses 503/401 if the secret fails.
3. LC-12 parse + resolve hymns.
4. LC-12 upserts `services` by date, or corrects an existing row.
5. JSON read-back (titles, `failedHymnNumbers`).

## Sequence diagram

```mermaid
sequenceDiagram
  participant P as picoclaw
  participant G as LC-8 webhook
  participant W as LC-12 write
  participant D as SQLite
  P->>G: POST JSON
  G->>G: WEBHOOK_SECRET
  G->>W: rundown or correct
  W->>D: upsert / update
  W-->>P: 200 read-back
```

## Failure modes

| Hop | Failure | System does | Safe to retry |
| --- | --- | --- | --- |
| Secret | wrong / unset | 401 / 503 | yes after the secret is correct |
| Parse | bad text | failure visible | yes |
| Write | 500 mid-way | does not claim success | yes for same-date upsert |
| Correction | target missing | error, not insert | no as correct |

## Guarantees

Per-date upsert is safe at-least-once. Correction is not create. No Hub timeout toward picoclaw.
