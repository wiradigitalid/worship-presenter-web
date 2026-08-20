---
type: contract
component: hub
lc: LC-3
direction: exposed
created: 2026-08-18
updated: 2026-08-20
status: retired
---

# Contract — Announcements (RETIRED)

## Retirement

**DEC-004** (accepted 2026-08-20) withdraws UC-21 and retires FR-3. Hub no longer composes, orders,
or stores any announcement/flyer list. Composing announcement content — what used to be this
contract's whole job — is now exclusively an Admin action in the Artifact Registry, as N independent
Announcement Sets (`offline-deck` FR-21; see `.how/registry/**`, out of this component's scope).

This file is kept, marked `retired`, rather than deleted outright: it is the record of what a build
must remove, and `00-inventory.md` still needs a Registry/platform-side renumbering pass this
component cannot make (`.how/_platform/inventory-api.md` is out of scope here — reported, not edited).

## What is removed

| Operation | Was | Fate |
| --- | --- | --- |
| GET `/api/announcements` | List | Removed — no Hub-owned announcement list survives to list |
| POST `/api/announcements` | Add | Removed |
| PUT `/api/announcements` | Order | Removed |
| PATCH `/api/announcements/[id]` | Update item | Removed |
| DELETE `/api/announcements/[id]` | Delete item | Removed |

The `/announcements` Hub screen (`inventory-screen.md`) retires with it — see `05-model/form-fields.md`
for the replacement: a read-only Deck preview strip on `/services/[id]`, no edit affordance.

## What survives, and where it actually lives now

The one property of the old contract that mattered to the Operator — **a flyer image is not
re-uploaded every week** — is carried forward, but the responsibility moves:

- The **image files themselves** (`/api/uploads/<32-hex>.(jpg|jpeg|png|gif|webp)`, AD-8) are untouched
  by this retirement. Hub's upload contract (`04-upload.md`) is unaffected.
- **Reuse across weeks** is now a property of how the Registry's Announcement Set canvases reference
  those same URLs — copy/paste with shared image refs (DEC-004 §Copy/paste) — not of anything Hub
  stores. Hub has no ongoing responsibility for announcement asset reuse at all after this retirement;
  it only continues to serve the uploaded files it always served.
- The `announcement_items` table's data-migration and drop timeline is `05-model/data-model.md` §
  *Retirement of `announcement_items`*.

## Constraints carried forward

Deleting a Service (UC-7) MUST stop cascading `announcement_items` rows the moment this contract
retires — that cascade existed to keep one-off items from outliving their Service, and there is no
Hub-owned one-off item left to cascade (`06-flows/delete-service.md`).
