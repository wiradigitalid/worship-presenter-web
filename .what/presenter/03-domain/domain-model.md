# Domain model — Presenter

Has no **persisted** write entities. Reads Service and renders the slide plan owned by Registry.

One piece of state is written and it is deliberately not in this table: a **RemotePairing** (UC-29,
AD-37) — which remote device may drive which presenting client, and until when. It lives in the Go
process's memory and in **no table**, so it needs no schema change and no `data_version` bump, and an
API restart ends every pairing rather than resurrecting one nobody remembers granting. Its lifecycle is
in `state-machines.md`; whether it should survive a page reload is **OQ-55**. It is session state, not
domain data, which is why it claims nothing in `owns:`.

| Entity | Meaning | Relations |
| --- | --- | --- |
| (read) Service | Worship gathering being shown | Hub writes |
| BibleTranslation | Registered translation corpus | 1 : N BibleVerse, 1 : N book names |
| BibleBook | Canonical book identity | N names per translation (AD-27) |
| BibleVerse | Verse text | points at book identity |
