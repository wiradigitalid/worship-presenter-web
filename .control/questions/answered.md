# Answered

**Loaded when:** looking for a decision already taken through a question, not through a `DEC-`.

Rows move here from the other three lists. MUST NOT be deleted.

## Answered

| id | Question | Answer | Closed |
|---|---|---|---|
| OQ-7 | Must deleting a Service (FR-10) also delete files in `UPLOADS_DIR` and the PPTX cache, or is the SQLite row enough (photos/prayers could remain on disk)? | Yes: deleting a Service deletes local files in `UPLOADS_DIR` bound to that Service. Recurring announcement items (and their files) remain (BR-5). The PPTX cache is not part of this answer. | 2026-08-18 kodesh87 |
| OQ-1 | Events will keep sending Rundowns in a parseable form like today. | Parked on CAP-11 (Telegram last phase). Hub intake (FR-27) is the current path; the Operator entering the form is no longer the failure mode. | 2026-08-19 kodesh87 |
| OQ-9 | Is Registry delete/reorder today via the store, rather than DELETE/reorder HTTP on LC-11? | Neither. `store.ts` exports list/get/update/reset/insertIfMissing only. Admin delete/reorder HTTP is [MISSING] until FR-21 / UC-15. AD-17 non-revival is verified by SQL delete in `tests/registry-reseed.test.mjs`, not by a store method. | 2026-08-19 G4 Registry pass |
| OQ-11 | Does linear advance during blank shift the Deck index? | Yes. Blank itself does not change index (BR-6 / FR-16). Advance while blanked still moves the index; the projector stays black; unblank shows the current index. As-built `PresenterOperator.setIndexAndSync`. | 2026-08-19 G4 Presenter review |
| OQ-6 | The G3 portrait is as-built one `web` container (AD-2/AD-4). The Go+SPA direction in the brief addendum has not yet reversed an AD. | Void. Owner 2026-08-19 treats Go+SPA as binding. DEC-003 accepted; AD-30 plus AD-2/4/5/9/24 amendments. | 2026-08-19 kodesh87 |
