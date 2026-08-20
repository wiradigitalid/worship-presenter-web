---
type: lifecycle
component: hub
status: draft
created: 2026-08-18
updated: 2026-08-19
entities: [Service, Account]
---

# State Lifecycle — Hub

## Service

**States:** `absent` · `present`
**Initial:** `absent` — no row yet for that date
**Terminal:** `absent` after delete — there is no `archived` status; delete is terminal (UC-7)

| From | To | Trigger | Who may | Guard | Side effect |
| --- | --- | --- | --- | --- | --- |
| absent | present | Hub form (this phase); Telegram Rundown received (CAP-11 later) | Operator now; Events later | date parseable | weekly payload + images |
| present | present | Hub field save (this phase); Telegram correction (CAP-11 later) | Operator now; Events later | BR-4 on Hub field save only — not generate / UC-6 (OQ-20) | payload write time advances |
| present | absent | Delete | Operator | — | that week's assets go too, including local image files no longer referenced; recurring announcements remain (BR-5) |

There is no `draft` state. What is saved is what is shown. Generate / UC-6 reads the present Service and produces a Deck; it is not a payload edit and does not move this machine (OQ-20).

### What is deliberately not modelled

Registry Snapshot per Service (AD-16) — not yet in the DDL, so not a state here.

Song Set Weekly Input and Lyric Override (FR-32, FR-34) do not get their own lifecycle: each is a
value written and overwritten by the Service's own save (UC-5), the same as any other overlay field
— there is no separate draft/committed state. The one departure is the Lyric Override's explicit
"save to Song Book" action (UC-28, BR-7), which is a second, deliberate write beyond the normal
Service save and moves `hymns.lyrics`, not this state machine.

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
