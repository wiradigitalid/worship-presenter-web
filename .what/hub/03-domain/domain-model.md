# Domain model — Hub

Conceptual. Database column types belong in `.how/`.

| Entity | Meaning | Relations |
| --- | --- | --- |
| Service | One dated worship gathering | 1 weekly payload, 0..1 Snapshot (owned by Registry), 0..N images |
| AnnouncementItem | Announcement list item | recurring or one-off to one Service |
| Account | Per-person account | Admin or Operator role |
| AppSetting | Application settings | transition, ui_locale, default corpus |
| Rundown | Events input text | becomes Service payload |
