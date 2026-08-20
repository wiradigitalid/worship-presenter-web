---
type: flow
component: registry
realizes: [UC-14]
risky: true
created: 2026-08-20
---

# Flow — Predefined Field vocabulary migration (Supplement S1)

## Realizes

The old→new predefined-field key translation (DEC-004 Supplement S1) and AD-32's shape change
(whole-element `placeholderKey` binding → inline `{key}` token in text content). A **numbered,
one-time migration on the startup path** (AD-18), gated by `data_version` (AD-21) — never a
reseed (AD-17 forbids overwriting authored content). Runs **second**, `data_version` 4→5, after
`06-flows/song-set-physical-shape-migration.md` (3→4) — that document's *Sequencing* section
states why the order is fixed this way.

## Scope — what this migration owns, and what it does not

This migration rewrites **Registry-owned canvas payloads** (`artifact_templates.payload`) that
still carry the as-built whole-element `placeholderKey` binding shape. It does **not** touch any
Hub-owned stored value (`services` table / `internal/parse` structured fields — e.g. the persisted
`familyYouth`, `familyPrayerRequest`, `youthPrayerRequest` values a Service already has entered).
That is a separate, Hub-owned migration this design cannot write (`.how/hub/**` is out of this
component's scope fence) — **reported, not designed here**: see this component's G4 handover.

## Per-key mapping (S1, restated for the migration's own logic)

| Old key | Old shape | New key(s) | Migration action |
| --- | --- | --- | --- |
| `date` | element bound via `placeholderKey` | `service_date` | Rename the key; convert the element to a text element whose `content` is `{service_date}` |
| `reference` | element bound via `placeholderKey` | `scripture_reference` **or** `theme_reference` **or** `scripture_reference` + `needs-review` | Resolved **per slide identity** — see Disambiguation below |
| `text` | element bound via `placeholderKey` | `scripture_text` **or** `theme_text` **or** `scripture_text` + `needs-review` | Same per-slide resolution as `reference` |
| `performer` | element bound via `placeholderKey` | `special_song` | Rename + shape-convert, as `date` |
| `title` | element bound via `placeholderKey` | `sermon_title` | Rename + shape-convert |
| `speaker` | element bound via `placeholderKey` | `sermon_speaker_name` | Rename + shape-convert |
| `imageUrl` | image element, own geometry box | `sermon_poster` | Rename only — image elements keep their own box (AD-32 unchanged for images) |
| `person` | element bound via `placeholderKey` | `closing_prayer_person` | Rename + shape-convert |
| `familyText` | element bound via `placeholderKey` | `family_request` | Rename + shape-convert. `family_name` is **not** created — it never existed as a bound element; Admin authors a new element for it separately (new authoring, not a migration concern) |
| `youthText` | element bound via `placeholderKey` | `youth_request` | Same as `familyText` → `family_request` |
| `familyPhoto` | image element | `family_photo` | Rename only |
| `youthPhoto` | image element | `youth_photo` | Rename only |

Song-set expansion keys (`hymnNumber`→`song_number`, `songTitle`→`song_title`, `label`→
`verse_number`/`verse_total`, `lyrics`→`verse_content[]`/`reff[]`) are not Predefined Field Catalog
keys (domain-model.md) and are not migrated by this flow — they belong to the new
`song_set_layouts` trio, which is migrated (`title`/`verse`) or seeded (`reff`, which never had an
authored equivalent) from an existing song-set row's payload by the sibling migration this one
runs after: `06-flows/song-set-physical-shape-migration.md` — see that document's *Vocabulary
carried into the trio* for the key rename and *The hardest question* for which row's payload is
kept. An earlier draft of this sentence said the whole trio was seeded fresh with no migrated
content at all; that was written before the sibling migration existed and is corrected here.

## Disambiguation — `reference` / `text` split (owner ruling, 2026-08-20)

S1 identifies the split (one key served two purposes by fallback) but the payload alone carries no
field recording "this was the Bible Talk scripture reading" vs "this was the Divine Worship theme
verse." The owner ruled this is **not** a blanket default — it is **determinable per slide
identity**, because the shipped seed (`data/default-registry.json`) carries exactly two General
slides that bind these keys, and each one's purpose is unambiguous from its own `id`/`label`:

| Slide identity (`artifact_templates.id` / seed `label`) | `reference` becomes | `text` becomes |
| --- | --- | --- |
| `verse-reading` / "Verse Reading" (seed line ~331) | `scripture_reference` | `scripture_text` |
| `bible-verse-contemplation` / "Theme Verse", the Call For Scripture Contemplation slide (seed line ~804) | `theme_reference` | `theme_text` |
| Any other slide bound to `reference`/`text` — i.e. an admin-authored custom slide that is neither of the two above | `scripture_reference` | `scripture_text` — **and** the row is flagged `needs-review: true` |

The blanket "default to `scripture_*` plus a review flag for every row" design is dropped. The flag
now applies **only** to the third case — a custom slide the migration cannot identify by name — not
to the two known shipped slides, which resolve with certainty and are never flagged.

- The migration log records, per affected `artifact_templates.id`: old key, slide identity matched
  (`verse-reading` / `bible-verse-contemplation` / "unmatched"), new key chosen, and whether
  `needs-review` was set.
- A flagged row still generates correctly in the meantime — `scripture_reference`/`scripture_text`
  are valid catalog keys; the row simply may be pointing at the wrong one of the two purposes until
  Admin confirms it (or corrects it to `theme_reference`/`theme_text` by hand, an ordinary UC-14
  edit).
- The identity match is by the row's own template `id` (not label text, which Admin may have
  renamed) — if a future custom slide happens to reuse the id `verse-reading` or
  `bible-verse-contemplation`, it is treated as that slide for migration purposes; this is accepted
  as the smallest reasonable choice, since template `id` is otherwise treated as a stable identity
  throughout this component's design.

## Migration steps

1. On startup, before serving traffic, the Go API checks `settings.data_version` (AD-21).
2. If this migration's version has not yet run: for every `artifact_templates` row, parse
   `payload`; for every element still carrying the old whole-element `placeholderKey` shape, apply
   the per-key mapping table above — rename the key and convert the element to the new inline-token
   text shape (or rename-only for an image element).
3. Any element bound to `reference` or `text` is resolved by the row's template `id` (see
   Disambiguation): `verse-reading` -> `scripture_*`, `bible-verse-contemplation` -> `theme_*`; any
   other template `id` -> `scripture_*` **and** logged with `needs-review: true`.
4. The row is re-validated against AD-15 after conversion before it is written back; a row that
   fails re-validation is **not** written — it is logged (id + reason) and left in its pre-migration
   shape, surfaced the same way a corrupt row already surfaces at plan-read time (AD-17's
   fail-closed discipline extends to migration failures, not just runtime reads).
5. `settings.data_version` is bumped once, atomically with the writes, so this migration never
   runs twice (AD-21) and never re-touches a row Admin has since re-authored under the new
   vocabulary.

## Sequence diagram

```mermaid
sequenceDiagram
  participant API as Go API (startup)
  participant S as settings
  participant D as artifact_templates
  API->>S: read data_version
  alt migration not yet applied
    API->>D: SELECT all rows
    loop each row with old-shape placeholderKey
      API->>API: map key, convert shape, re-validate (AD-15)
      alt valid
        API->>D: UPDATE payload
      else invalid
        API->>API: log id + reason; leave row untouched
      end
    end
    API->>S: bump data_version
  else already applied
    API->>API: skip
  end
```

## Failure modes

| Hop | Failure | System does | Safe to retry |
| --- | --- | --- | --- |
| A row's payload does not parse at all | Logged, left untouched, `data_version` still bumps once the pass completes | Admin fixes the row by hand afterward; migration does not re-run for it |
| Converted element fails AD-15 re-validation | Same as above — logged, left untouched | Same |
| Process crashes mid-migration | `data_version` has not bumped yet, so the next startup re-runs the whole pass; already-converted rows are idempotent to re-convert **only if** the runner checks for the old shape before converting (it does — a row already in the new shape has no `placeholderKey` left to find) | Yes — restart is safe |
| An element carries `reference`/`text` on template `id` `verse-reading` | Migrated to `scripture_reference`/`scripture_text`, no flag | Not a failure — a certain match |
| An element carries `reference`/`text` on template `id` `bible-verse-contemplation` | Migrated to `theme_reference`/`theme_text`, no flag | Not a failure — a certain match |
| An element carries `reference`/`text` on any other template `id` (admin-authored custom slide) | Migrated to `scripture_reference`/`scripture_text`, flagged `needs-review` (Disambiguation) | Not a failure — a flagged success |

## Guarantees

Every existing authored canvas keeps rendering after this migration — a converted element fills
the same weekly value it always did, under its new name. No Registry row is silently reseeded
(AD-17). The migration runs at most once (AD-21). Hub's own persisted values under the old
structured-field names are **not** touched by this flow and need their own migration, reported
separately (see Scope, above).
