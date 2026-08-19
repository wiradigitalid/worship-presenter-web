# Domain model — Hub

Conceptual. Database column types belong in `.how/`.

| Entity | Meaning | Relations |
| --- | --- | --- |
| Service | One dated worship gathering | 1 weekly payload, 0..1 Snapshot (owned by Registry), 0..N images |
| AnnouncementItem | Announcement list item | recurring or one-off to one Service |
| Account | Per-person account | Admin or Operator role |
| AppSetting | Application settings | transition, ui_locale, default corpus |
| Rundown | Text the Operator enters in Hub this phase; later Events may send it on Telegram | becomes Service payload |
| Hymn | One Song Book entry, identified by book + number | resolved into a Service song block (BR-3) |

The Operator form is one raw Rundown plus structured overlays. Physical field names: `.how/hub/05-model/form-fields.md`.
