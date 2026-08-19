# Assumptions

**Loaded when:** swept once per gate; MAY be skipped.

The **default** class of a question. The agent takes the answer itself and records it here, one
line: the assumption, plus the cost if it is wrong. This file **holds nothing**.

A row here MUST move to `blocking.md` as soon as it passes one of the three tests that file
states.

## Open

| id | Assumption | If wrong | Taken | By |
|---|---|---|---|---|
| OQ-17 | The Operator has this week's Rundown content in time to enter it in Hub. | No Service that week. | 2026-08-19 | user |
| OQ-2 | One church, one worship flow, for this product's scope. | Scope In is not enough; that is a second product or a new PRD. | 2026-08-18 | agent |
| OQ-3 | The venue has a laptop that can play PPTX (PowerPoint or equivalent). | The offline guarantee (BG-3) is not fulfilled. | 2026-08-18 | agent |
| OQ-5 | PPTX remains the offline guarantee; the browser slideshow is best-effort after one Service is loaded. | BG-3 is read as if the slideshow must be offline. | 2026-08-18 | agent |
| OQ-8 | Same date: webhook overwrites (upsert); the Hub form does not create a second row without confirmation. | If both last-write, Hub fields vanish silently; if both hold, Telegram fails. | 2026-08-18 | agent |
| OQ-10 | An empty `WEBHOOK_SECRET` string is treated the same as unset (reject intake). | 401 vs 503 confuses OQ-4 go-live. | 2026-08-18 | agent |
| OQ-12 | "Nearest Sabbath" = the next Sabbath or today in the venue time zone, not the previous one. | A Telegram correction changes the wrong week. | 2026-08-18 | agent |
| OQ-13 | Accessibility floor is out of v1 scope; the canvas editor stays pointer-first with no keyboard equivalent. | A later NFR or owner decision needs a story the current corpus does not promise. | 2026-08-19 | agent |
| OQ-14 | A stale snapshot has no extra operator affordance beyond Admin Sync on the Run-Sheet — "nothing extra" is the chosen answer, not an omission. (AD-16 table shipped W1.) | A later story must add a badge or line; the spine already records the three constraints. | 2026-08-19 | agent |
| OQ-15 | Reset restores the shipped label (including a rename), and an authored row exposes no Reset; that as-built pair stands until Story 20.3 designs otherwise. | Two rows in one list will keep offering different verbs and surprise the administrator. | 2026-08-19 | agent |
| OQ-16 | An unmapped rundown line stays NFR-5's visible miss; no extra explanation names the colliding books when a second translation makes a former hit ambiguous. | The operator reads a typo; Stories 21.4 / 21.5 are not blocked (spine). | 2026-08-19 | agent |
| OQ-18 | As-built AD essays in the spine stay until a dedicated condensing pass; this review does not rewrite them. | Builders skip the spine; G4 still has the Rule sentences. | 2026-08-19 | agent |
| OQ-19 | Frontmatter `binds:` is the FR/NFR range; NFR-7 (fonts) stays the Deferred exception, not a decided invariant. | A gate reader treats the font licence as closed. | 2026-08-19 | agent |
| OQ-20 | Generate is not a Hub payload edit; BR-4's stale-precondition applies to field save (UC-5), not generate. | Operator save is rejected after their own regenerate. | 2026-08-19 | agent |
| OQ-21 | No readable date → no Service row (Hub and Telegram). A named date with no Service rejects (SCN-3); it does not fall back to nearest Sabbath (OQ-12). | Dateless rows, or a correction that edits the wrong week. | 2026-08-19 | agent |
| OQ-22 | Unparseable Hub body with a date still saves what was readable (NFR-5). Telegram images attach or fail visibly; they are not dropped. | Hub create silently differs from Telegram; photos never appear. | 2026-08-19 | agent |
| OQ-23 | After a rejected save: if the Service is gone, that is UC-7 not-found (do not recreate). Session expiry at save or delete rejects with no partial write. | Operator recreates a deleted Service, or the UI looks saved. | 2026-08-19 | agent |
| OQ-24 | Registry `gone` is terminal. Reset is live→live only and does not undelete. UC-15/SCN-5 "way back to seed" means a still-live seed row (OQ-15). | Admin ships undelete, or Reset on a gone id is undefined. | 2026-08-19 | agent |
| OQ-25 | Blank covers an open overlay; unblank reveals that overlay if it is still open. Reload of control or projector resends index, overlay, and blank. | Congregation loses the overlay or a reloaded window drifts. | 2026-08-19 | agent |
| OQ-26 | Plan identity travels on presenter shared-state messages (AD-10). Empty verse reference and lookup timeout fail closed (SCN-4). No projector → refuse lookup. Missing plan → return to Hub as UC-11. | Overlay hangs or has no screen. | 2026-08-20 | agent |
| OQ-27 | CAP-11 webhook mismatches (dateless insert; silent image filter) stay `[MISSING]` on Hub SDD until that phase; they are not `BUG-` rows in `defects.yaml` this wave. | G5 can look green while Telegram still writes a dateless Service. | 2026-08-19 | agent |
| OQ-28 | AD-16 is listed on Hub Inherited Constraints now that the snapshot table ships (W1). Presenter still consumes the plan, not the freeze table directly. | Create/present would be documented as live-registry if this were reversed. | 2026-08-19 | agent |
| OQ-29 | Overlay-on-sync and no-projector refuse stay planned (OQ-25 / OQ-26), not `BUG-` this wave. Control remount cannot recover overlay from the projector (AD-29). Caller-omitted `translation` and miss-as-`notFound()` stay `[PARTIAL]`. | Control reload loses overlay; a late verse or Hub-redirect story waits. | 2026-08-19 | agent |
| OQ-30 | Registry Inherited Constraints lists ADs that change Registry rows or plan input (AD-5…22 as already quoted). AD-1, AD-2, AD-4, AD-10, AD-24 stay on the spine / container, not copied here. | A later G4 review treats those five as missing quotes. | 2026-08-19 | agent |
| OQ-31 | Admin delete HTTP compacts `position` to `0..N-1` in the same transaction (W1). The old SQL-delete proof path is no longer the product verb. | A future raw-SQL delete in a test could still leave gaps; production delete does not. | 2026-08-19 | agent |
| OQ-32 | When Sync Artifact ships, a corrupt live Registry row is omitted and logged like plan read; it is not frozen into the snapshot. | An unrenderable snapshot, or Sync fails closed with no recovery. | 2026-08-19 | agent |
| OQ-33 | PUT `/api/announcements` with `items: []` is a total replace and wipes recurring rows. A confirm or 400 is a later story. | Operator loses the master flyer list with no extra prompt. | 2026-08-19 | agent |
| OQ-34 | Announcement PUT/PATCH are last-write-wins; AD-6 does not apply to this resource. | Two Operators silently overwrite flyer order or URLs. | 2026-08-19 | agent |
| OQ-35 | The production image includes a Node binary solely to exec the PPTX worker; it is not a 24/7 Node server. | PPTX download fails in Docker, or a Node HTTP server is left running “for convenience”. | 2026-08-19 | agent |
| OQ-36 | Development uses a SPA bundler plus the Go API on another origin; production Go serves the SPA same-origin. | Session cookies fail across origins, or Next.js is kept as a BFF. | 2026-08-19 | agent |
| OQ-37 | Presenter sync stays in the SPA (`BroadcastChannel`, AD-10); Go is not the sync bus. | A WebSocket story appears and AD-10 must be reopened. | 2026-08-19 | agent |
