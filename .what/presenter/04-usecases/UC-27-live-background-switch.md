---
type: uc
id: UC-27
component: presenter
satisfies: [FR-33]
critical: false
created: 2026-08-20
updated: 2026-08-20
---

# UC-27 — I switch the live Verse/Reff background during the service

## Trigger

The Operator, mid-service, wants the projected Verse or Reff slide to show a different background than
the one that resolved for this song.

## Precondition

The Service exists. One slide plan can already be built. The two-screen presenter is open (UC-12).

## Main Flow

1. The Operator opens the Background Library on presenter control.
2. The Operator picks an image.
3. Every open projector window currently showing a Verse or Reff slide switches to it immediately.
4. The choice stays in force, for every Verse and Reff slide, for the rest of this presenter session.
5. The Service payload and the Registry are untouched.

## Alternate Flows

| From step | Condition | What happens |
| --- | --- | --- |
| 3 | A second projector window opens after the choice was made | It receives the same override on its first sync, exactly as index / blank / transition already do (AD-10) |
| 3 | Control or projector reloads mid-session | Reload resends the override again; nothing is lost, and nothing was ever written anywhere durable in the meantime |
| 1 | Background Library holds no images | Resolution falls through to the normal order — the entry's own weekly choice, then the Admin global default, then blank (AD-33); no error |

## Failure Flows

| From step | Failure | What the system does | What the user is left with |
| --- | --- | --- | --- |
| 3 | Projector is not live | Choice is recorded for the session and takes effect once a projector acknowledges (AD-29) | No visible change until a projector is live |

## Outcome

The Congregation sees the picked image behind the current Verse/Reff text. Nothing durable changed: the
next generate, and any Sync, resolves the background through the normal order exactly as if the live
choice had never happened (AD-34).

## Business Rules

BR-8
