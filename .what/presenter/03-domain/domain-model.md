# Domain model — Presenter

Has no write entities. Reads Service and renders the slide plan owned by Registry.

| Entity | Meaning | Relations |
| --- | --- | --- |
| (read) Service | Worship gathering being shown | Hub writes |
| BibleTranslation | Registered translation corpus | 1 : N BibleVerse, 1 : N book names |
| BibleBook | Canonical book identity | N names per translation (AD-27) |
| BibleVerse | Verse text | points at book identity |
