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
| OQ-13 | Accessibility floor is out of v1 scope; the canvas editor stays pointer-first with no keyboard equivalent. | A later NFR or owner decision needs a story the current corpus does not promise. | 2026-08-19 | agent |
| OQ-14 | Until AD-16 ships, a stale snapshot has no extra operator affordance — "nothing" is the chosen answer, not an omission. | Story 20.8 must add a badge or line; the spine already records the three constraints. | 2026-08-19 | agent |
| OQ-15 | Reset restores the shipped label (including a rename), and an authored row exposes no Reset; that as-built pair stands until Story 20.3 designs otherwise. | Two rows in one list will keep offering different verbs and surprise the administrator. | 2026-08-19 | agent |
| OQ-16 | An unmapped rundown line stays NFR-5's visible miss; no extra explanation names the colliding books when a second translation makes a former hit ambiguous. | The operator reads a typo; Stories 21.4 / 21.5 are not blocked (spine). | 2026-08-19 | agent |
