# Domain model — Hub

Conceptual. Database column types belong in `.how/`.

| Entity | Meaning | Relations |
| --- | --- | --- |
| Service | One dated worship gathering | 1 weekly payload, 0..1 Snapshot (owned by Registry), 0..N images |
| Account | Per-person account | Admin or Operator role |
| AppSetting | Application settings | transition, ui_locale, default corpus, default Song Book, Background Library default |
| Rundown | Text the Operator enters in Hub this phase; later Events may send it on Telegram | becomes Service payload |
| Hymn | One Song Book entry, identified by book + number | resolved into a Service song block (BR-3) |
| Song Set Weekly Input | One Song Set entry's weekly values for this Service — `<var>_song_number`, `<var>_song_book_name`, `<var>_song_background` | one per Song Set entry the Registry has configured (FR-32); the entry itself is Registry-owned |
| Lyric Override | This Service's edited lyric text for one Song Set entry | scoped to this Service only by default; an explicit save-back action writes it into the Song Book instead (FR-34, DEC-004) |

**AnnouncementItem is retired from Hub (DEC-004).** Announcement composition moved entirely to the Registry's Announcement Set (`.what/registry/03-domain/domain-model.md`); Hub owns no announcement-list entity any more (FR-3 retired, superseded by FR-21).

The Operator form is one raw Rundown plus structured overlays. Physical field names: `.how/hub/05-model/form-fields.md`.
