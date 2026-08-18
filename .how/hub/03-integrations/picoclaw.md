---
type: integration
component: hub
status: draft
created: 2026-08-18
updated: 2026-08-18
provider: picoclaw (agent outside this repo; Telegram channel)
---

# Integration — picoclaw

## Who owns it

| | |
| --- | --- |
| Provider | Bot / agent operator outside this product team |
| Our contact | Repo owner; a person's name is not recorded here |
| Where credentials live | `WEBHOOK_SECRET` in the host `.env` (not in git) |
| Notice we get before a breaking change | none |

## What we use it for

FR-1, FR-12, UC-1, UC-17. picoclaw reads the Rundown on Telegram and calls our JSON.

## What we send and receive

The surface we publish: `POST /api/webhook`. Call shape is in the picoclaw skill, not a copy of their spec.

| Direction | Operation | Carries | Contains personal data |
| --- | --- | --- | --- |
| inbound | POST rundown / correction | Rundown text, image URLs, structured fields | yes — names, prayer requests, photos |

## When it changes without telling us

| Change | How we notice | Blast radius | What we do |
| --- | --- | --- | --- |
| JSON field added/removed | Hub parser / NFR-5; Events or Operator sees missing fields | That week's intake | Operator pastes in Hub (FR-27) |
| Secret rotated on one side only | Consecutive 401s | All Telegram sends | Set the same secret on host and agent |
| Bot stops | No new Service in Hub | Events | Hub form |

No dedicated watchdog beyond the Operator opening Friday's list. [PARTIAL]

## When it is slow, absent, or lying

| Failure | Timeout | Retry | What the user sees | What is logged |
| --- | --- | --- | --- | --- |
| Slow | HTTP timeout on the caller side (we are not the one retried) | No retry on Hub | Events do not get a timely read-back | Request error in the process log |
| Absent | — | — | No new Service | Silent on our side |
| Lying (other JSON) | — | no | Parse failure visible, or 400 | Console / route log |
| Wrong secret | — | no | 401 to the caller | does not log the secret |
| Secret unset | — | no | 503 to the caller | AD-5 |

## What we would do without them

Intake moves to pasting the Rundown in Hub (FR-27). Events would have to open Hub, which this area's vision rejects — so the Telegram feature stops, the product does not.
