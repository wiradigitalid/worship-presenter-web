---
type: lifecycle
component: hub
status: draft
created: 2026-08-18
updated: 2026-08-18
entities: [Service, Account]
---

# State Lifecycle — Hub

## Service

**States:** `absent` · `present`
**Initial:** `absent` — no row yet for that date
**Terminal:** `absent` after delete — there is no `archived` status; delete is terminal (UC-7)

| From | To | Trigger | Who may | Guard | Side effect |
| --- | --- | --- | --- | --- | --- |
| absent | present | Rundown received or Hub form | Events · Operator | date parseable | weekly payload + images |
| present | present | Correction / edit / generate | Events · Operator | BR-4 on Hub edit | `updated_at` advances |
| present | absent | Delete | Operator | — | that week's assets go too, including `UPLOADS_DIR` files no longer referenced; recurring announcements remain (BR-5) |

There is no `draft` state. What is saved is what is shown.

### What is deliberately not modelled

Registry Snapshot per Service (AD-16) — not yet in the DDL, so not a state here.

## Account

**States:** `active` · `gone`
**Initial:** `active` — created by Admin
**Terminal:** `gone` — account deleted; sessions revoked via `token_version` / `revoked_sessions`

| From | To | Trigger | Who may | Guard | Side effect |
| --- | --- | --- | --- | --- | --- |
| — | active | Create account | Admin | unique username | password hash |
| active | active | Change role / password | Admin · self (password) | last admin is not demoted | `token_version` rises if needed |
| active | gone | Delete account | Admin | not the last admin | session fails the AD-5 gate |

### What is deliberately not modelled

Login lockout is a time window in `login_attempts`, not an account state.
