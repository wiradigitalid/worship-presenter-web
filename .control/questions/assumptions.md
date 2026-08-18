# Assumptions

**Loaded when:** swept once per gate; MAY be skipped.

The **default** class of a question. The agent takes the answer itself and records it here, one
line: the assumption, plus the cost if it is wrong. This file **holds nothing**.

A row here MUST move to `blocking.md` as soon as it passes one of the three tests that file
states.

## Open

| id | Assumption | If wrong | Taken | By |
|---|---|---|---|---|
| OQ-1 | Events will keep sending Rundowns in a parseable form like today. | Intake breaks; the Operator is forced to type the form every week. | 2026-08-18 | agent |
| OQ-2 | One church, one worship flow, for this product's scope. | Scope In is not enough; that is a second product or a new PRD. | 2026-08-18 | agent |
| OQ-3 | The venue has a laptop that can play PPTX (PowerPoint or equivalent). | The offline guarantee (BG-3) is not fulfilled. | 2026-08-18 | agent |
| OQ-5 | PPTX remains the offline guarantee; the browser slideshow is best-effort after one Service is loaded. | BG-3 is read as if the slideshow must be offline. | 2026-08-18 | agent |
| OQ-6 | The G3 portrait is as-built one `web` container (AD-2/AD-4). The Go+SPA direction in the brief addendum has not yet reversed an AD. | If the owner treats Go+SPA as binding now, the spine is wrong until a `DEC-` exists. | 2026-08-18 | agent |
| OQ-8 | Same date: webhook overwrites (upsert); the Hub form does not create a second row without confirmation. | If both last-write, Hub fields vanish silently; if both hold, Telegram fails. | 2026-08-18 | agent |
| OQ-9 | Registry delete/reorder today is via the store, not DELETE/reorder HTTP on LC-11. | A UI that calls a missing route gets 404 or writes without an Admin gate. | 2026-08-18 | agent |
| OQ-10 | An empty `WEBHOOK_SECRET` string is treated the same as unset (reject intake). | 401 vs 503 confuses OQ-4 go-live. | 2026-08-18 | agent |
| OQ-11 | BR-6 wins: linear advance during blank does not shift the Deck index. | Blank is mistaken for shifting the slide on the projector. | 2026-08-18 | agent |
| OQ-12 | "Nearest Sabbath" = the next Sabbath or today in the venue time zone, not the previous one. | A Telegram correction changes the wrong week. | 2026-08-18 | agent |
