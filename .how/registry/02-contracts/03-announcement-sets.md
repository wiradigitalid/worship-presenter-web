---
type: contract
component: registry
lc: LC-11
direction: exposed
created: 2026-08-20
---

# Contract — Announcement Sets and their slides

## Source of truth

None yet — designed at G4, not built. Backing tables: `announcement_sets`,
`announcement_set_slides`, and `artifact_templates` rows with `base_type = 'ann-set-marker'`.

## Purpose

UC-15 (compose/reorder/delete within a set; add/remove a marker on the spine). Admin-only (AD-14).

## Operations

| Operation | Purpose | Realizes |
| --- | --- | --- |
| GET `/api/admin/announcement-sets` | List of sets (id, label, slide count) | UC-15 |
| POST `/api/admin/announcement-sets` | Create an empty set | UC-15 |
| PATCH `/api/admin/announcement-sets/[id]` | Rename the set's label | UC-15 |
| DELETE `/api/admin/announcement-sets/[id]` | Remove the set; **refused** (never cascaded) if a live marker on the main spine still references it — owner ruling, 2026-08-20 | UC-15 |
| GET `/api/admin/announcement-sets/[id]/slides` | Ordered list of that set's slides | UC-15 |
| POST `/api/admin/announcement-sets/[id]/slides` | Add an authored General-shaped slide to the set | UC-15 |
| GET `/api/admin/announcement-sets/[id]/slides/[slideId]` | One slide's payload | UC-14 (General-shaped edit) |
| PUT `/api/admin/announcement-sets/[id]/slides/[slideId]` | Save that slide's layout | UC-14 |
| PATCH `/api/admin/announcement-sets/[id]/slides/[slideId]` | Rename that slide | UC-15 |
| POST `/api/admin/announcement-sets/[id]/slides/[slideId]/reset` | Restore a seeded slide (reference-deck sets) | UC-15 |
| DELETE `/api/admin/announcement-sets/[id]/slides/[slideId]` | Remove a slide; compact `position` | UC-15 |
| PUT `/api/admin/announcement-sets/[id]/slides/order` | Replace the set's whole slide order | UC-15 |

A marker (`ann-set-marker` row on the spine, referencing `ann_set_id`) is created/deleted/reordered
through the existing `/api/admin/artifacts` create/delete/order endpoints (`01-artifacts.md`) — a
marker is still one spine row. This contract's create/delete for the **set itself** is a separate
step: Admin creates the set here, then adds a marker referencing it on the spine (or the UI does
both in one action; that sequencing is a `wdi-ux` concern, not specified here).

## Five lanes

| Lane | Answer |
| --- | --- |
| Authentication | Admin + AD-5 matcher. No session / not Admin → 403 Forbidden. |
| Validation | Set label 1–80 chars. Slide payload: AD-15 structure, same validator as a General, including inline `{key}` token checks against the Predefined Field Catalog (BR-13). Slide `position` unique/sequential per `ann_set_id`. |
| Error handling | Envelope in `cross-cutting.md`. 400 validation. 404 unknown set or slide id. 409 stale `updatedAt`, or set delete refused while a live marker still references it (never cascaded — owner ruling, 2026-08-20). |
| Rate limiting | `none` — Admin-only on one host. |
| Idempotency | GET safe. PUT same slide value is safe. Repeated Reset to the same seed slide is safe. DELETE of an already-gone set or slide is 404. |

## Error behaviour

| Condition | Response | Caller should |
| --- | --- | --- |
| DELETE set while a live spine marker references it | 409 `Announcement set is still referenced by a marker on the main artifact registry — remove the marker first` | Admin removes the marker from the main artifact registry first (`01-artifacts.md` DELETE), then retries the set DELETE. The system never cascades the delete to the marker on the caller's behalf |
| Slide carries a `{key}` the catalog does not recognise | 200 (save succeeds) with a warning list naming the key (BR-13, mirrors `01-artifacts.md`'s Placeholder-authority validation) | Fix the token, or accept it renders empty at generate |
| Reset on a slide with no `seed_hash` (authored, not from the shipped reference sets) | 400 `Slide has no seed to reset to` | Leave the authored slide unchanged |
| Reorder body's ids do not exactly match the set's live slide ids | 400 | Reload the set's slide list (concurrent membership) |
| Stale `updatedAt` anywhere | 409 | Re-read, then retry |

## Compatibility

Removing per-set slide CRUD, or collapsing sets back into one shared list, is breaking BR-12 and
AD-33/AD-35. A set delete that does not check for a referencing marker would silently break a
Service still pointing at it — never ship that shortcut. Making set delete **cascade** into
removing the referencing marker automatically is equally out of bounds — the owner ruled
(2026-08-20) that this path is refused, not cascaded; the Admin must remove the marker first.

## Constraints

Deck render does not call this API; Hub LC-16 reads the frozen snapshot (service-bound) or the
live tables (preview), never this write path (AD-12, AD-14).
