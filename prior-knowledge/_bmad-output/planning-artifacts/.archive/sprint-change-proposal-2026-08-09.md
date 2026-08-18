# Sprint Change Proposal — 2026-08-09

**Trigger:** two adopted architecture decisions with a shipped, live gap and **no owning story** — `AD-6` and `AD-10`, both carried in `deferred-work.md` as *"unassigned — needs a story"*
**Scope classification:** **Moderate** — backlog reorganization, no replan
**Path forward:** Option 1 — Direct Adjustment (two new epics, three new stories)
**Mode:** Batch
**MVP impact:** None. Both FRs are already committed and both epics close the unclosed half of one
**Scope boundary:** exactly these two. `AD-17`, `AD-18`, `AD-20`, `AD-24`, `AD-25`, `AD-26`, `AD-27` were **not** touched
**Owner decisions taken during this run:** none. One was found and routed to the owner rather than answered — see §5

---

## 1. Issue Summary

`deferred-work.md` → *Architecture decision gaps* is the register of the unclosed half of
adopted decisions. Every row names an owner, and *"unassigned"* is recorded there as a real
state rather than an omission. Two rows carried no owner at all, and they are the two whose
hazard is reachable in production today:

- **`AD-6` — optimistic concurrency on service edits.** The Rule reads *"No write path may
  bypass the precondition."* Four shipped paths do.
- **`AD-10` — one presenter sync channel.** The Rule reads *"Every message carries a plan
  identity."* `PresentMessage` carries none.

Neither is an open decision. Both are `[ADOPTED]`, both state their own gap, and neither had a
delivery unit that would ever close it. That is the defect this run corrects: an adopted rule
with a live counter-example and no story is indistinguishable, from inside the sprint, from a
rule nobody has got to yet.

## 2. Evidence

Measured against the working tree on 2026-08-09. Every citation below was opened and confirmed
to resolve.

### 2.1 `AD-6` — the four unguarded writes

| Path | Site | What it does |
| --- | --- | --- |
| Webhook correction | `src/app/api/webhook/route.ts:122-127` | `UPDATE services … updated_at = CURRENT_TIMESTAMP WHERE id = ?` with no precondition read |
| Webhook intake, update branch | `:227-232` | same, inside the intake transaction |
| Webhook intake, insert branch | `:236-241` | `INSERT … updated_at = CURRENT_TIMESTAMP` |
| `DELETE /api/services/[id]` | `src/app/api/services/[id]/route.ts:9-33` | `deleteService` on a bare id |
| `PATCH` / `DELETE /api/announcements/[id]` | `src/app/api/announcements/[id]/route.ts:22-56`, `:58-82` | `updateAnnouncementItem` / `deleteAnnouncementItem` on a bare id |

`announcement_items` has no `updated_at` column at all (`src/lib/db/index.ts:421-428`), so that
table cannot carry a precondition without a schema change.

The guarded shape exists twice and is the reference for whatever lands: the services layer
returns `{ ok: false, kind: 'conflict' }` (`src/lib/services/update-service.ts:77-78`), the
registry layer throws (`src/lib/registry/store.ts:237`). `AD-6` records that these are two
signalling shapes for two layers and that **a third must not appear**.

**The unguarded path is the agent path.** `AD-6`'s *Prevents* is *"an operator's edit silently
erased by a late correction"* — a description of the webhook. The decision refuses to narrow
itself to cookie-authenticated mutations for exactly that reason, so the gap is not a scoping
oversight that could be closed by rewording the rule.

**Compounded, and by something inside the same decision's own entry.** `updated_at` is
`CURRENT_TIMESTAMP` at second granularity, so two edits landing in the same second both pass the
guard. This weakens even the paths `AD-6` already guards, which means the precondition Story 25.1
adds is only as sharp as Story 25.2 makes the stamp.

### 2.2 `AD-10` — no plan identity, and the hazard is live

`PresentMessage` (`src/lib/present-channel.ts:19-53`) declares seven variants and no identity
field. Presenter and projector are two independent `force-dynamic` renders that each call
`buildSlidePlan` at their own moment — `src/app/services/[id]/present/page.tsx:72` and
`src/app/services/[id]/present/projector/page.tsx:62` — so a bare `index` on the wire means
whatever each render happened to build.

The trigger is an admin saving a template while a projector window is open. Every slide after
the structural change is offset, silently, on the screen the congregation is watching.

**This was not waiting on anything, and reading it as sequenced is what kept it unowned.** The
*full* identity `AD-10` describes is defined partly over `AD-16`'s per-service snapshot, which
does not exist. Fingerprinting the **resolved plan** needs no snapshot and closes the live case
today.

`AD-29` bears on this and is a constraint rather than a competitor: it states the plan-identity
clause may not be left half-implemented while a new `PresentMessage` variant is added, so adding
a variant is not progress against this item.

## 3. Impact Analysis

| Artifact | Impact |
| --- | --- |
| **`epics.md`** | Two new epics (25, 26) with three stories; FR Coverage Map rows **FR-13b** and **FR-16** corrected from flat `Done` to `Done … Partial as of 2026-08-09` |
| **`sprint-status.yaml`** | Two epic keys, three story keys, two retrospectives — all `backlog`; one `action_items` entry, owner `kodesh87`, status `open` |
| **`deferred-work.md`** | Three Owner cells: `AD-6` → Story 25.1, `AD-10` → Story 26.1, the `CURRENT_TIMESTAMP` granularity row → Story 25.2 |
| **`ARCHITECTURE-SPINE.md`** | **Untouched.** Both decisions already state their own gap correctly and both already point at `deferred-work.md`. This run assigns ownership; it changes no decision |
| **PRD** | Untouched. Both FRs are committed; neither epic adds a requirement |
| **`EXPERIENCE.md` / `DESIGN.md`** | Untouched. No route, surface or token changes here. Story 26.1 adds a room-facing render state and carries that obligation into its own change set |
| **Code / tests** | None in this change set, by construction |

**The two FR Coverage Map rows are the artifact conflict this run found.** That table is titled
*honest*, and it read `FR-13b … Done (updated_at / 409)` and `FR-16 … Done (presenter +
projector BroadcastChannel)` while the register directly contradicted both. Opening the epics
without repairing those rows would have left the map lying in the same change set that proved it
wrong.

## 4. Path Forward — two epics, and why not fewer

**Option 1, Direct Adjustment, is the only viable one.** There is nothing to roll back (Option 2
— no work has been done on either item) and no MVP to reduce (Option 3 — both FRs are already
committed and shipped-partial). Effort: **Medium**. Risk of *not* doing it: `AD-10`'s hazard is
live in front of a congregation.

**No existing epic fits either item.**

- **Epic 18** is the closest by mechanism — API routes, `services`, `announcements` — and is the
  wrong home. Its preamble draws the line explicitly: *"one epic is what an operator sees, this
  one is what a visitor must never see."* `AD-6` is neither; it is what an operator typed and
  then lost. Folding a concurrency epic into an authorization epic produces the mixed
  technical/UX epic C5-1 flags.
- **Epic 17** is the closest by module for `AD-10` — Story 17.5 is `present-channel` work — and
  its preamble excludes this work in two clauses: the epic covers *the operator chrome's visual
  identity*, and *nothing here alters a Deck, a Slide Type, or any payload contract*. Story 26.1
  alters `PresentMessage`, which is a payload contract, and adds a **room-facing** render state.
  17.5 belongs there because what it added was a line in the presenter's own header.
- **Epic 20** would sequence `AD-10` behind Story 20.8 / `AD-16`. That is the misreading that
  kept it unowned while the hazard was live.
- **Epics 9 and 11**, which delivered FR-13b and FR-16, are `done`. Reopening a closed epic to
  carry new work is the pattern Epic 19's registration note already declined.

**Two epics rather than one.** A single "writes and projections must not silently disagree" epic
is a tempting synthesis and fails the value standard: the beneficiaries are different people
(the operator whose edit survives; the congregation that is not shown the wrong slide), the
surfaces share no module, and — per the coordinator's own constraint on this run — `AD-10` must
not inherit `AD-6`'s open decision. Separate epics make that independence structural rather than
a sentence someone has to remember.

## 5. The one decision this run did not take

`AD-6`'s remaining sub-question is **above a story** and is registered as an owner action item
(`sprint-status.yaml`, epic 25, owner `kodesh87`, status `open`) rather than answered:

> Does the webhook carry an `updated_at` precondition token, or does it get an explicit
> trusted-single-writer carve-out with its cost written down?

**The two options are not symmetric, and the action item records that rather than the bare
question:**

- **(a) Token** — the precondition travels in the webhook payload. This changes an **external**
  contract an outside Telegram bot sends, so it also moves `.claude/skills/picoclaw-webhook/` and
  the intake shape carrying `resolvedHymns` / `failedHymnNumbers`. No spine change.
- **(b) Carve-out** — `AD-6` as written **forbids** it, and refuses deliberately to narrow away
  from the agent path. It therefore needs a **new** `AD-n` through a `bmad-architecture` Update
  run — never a renumber, never an in-place edit to `AD-6`.

Story 25.1 may not settle this itself. It blocks **only** 25.1's webhook AC: the `services`
`DELETE` and both `announcements` verbs are decidable today and ship without waiting.

## 6. Detailed Change Proposals

### 6.1 `epics.md`

**ADD** after Story 24.2:

- `### Epic 25: No edit is erased by a writer that did not look first *(backlog)*` — FR-13b,
  `AD-6`. Carries the four-path evidence table, the Epic-18 separation, and the owner decision
  above as an explicit non-answer.
  - `#### Story 25.1: Every Service Write States What It Expected *(backlog)*`
  - `#### Story 25.2: Two Edits in One Second Are Two Edits *(backlog)*`
- `### Epic 26: The projector never follows an index it cannot vouch for *(backlog)*` — FR-16,
  `AD-10` + `AD-29`. Carries the measurement, the independence statement, and the Epic-17
  separation.
  - `#### Story 26.1: Every Present Message Names the Plan It Came From *(backlog)*`

**EDIT** — FR Coverage Map:

```
OLD: | FR-13b | Epic 9 | Done (`updated_at` / 409) |
NEW: | FR-13b | Epic 9 + Epic 25 | Done on the web edit path … Partial as of 2026-08-09: four
     shipped write paths carry no precondition at all … Epic 25 owns it |

OLD: | FR-16 | Epic 11 | Done (presenter + projector BroadcastChannel) |
NEW: | FR-16 | Epic 11 + Epic 26 | Done … Partial as of 2026-08-09: AD-10 requires every message
     to carry a plan identity and PresentMessage carries none … Epic 26 owns it |
```

**EDIT** — frontmatter: `stepsCompleted` gains `step-10-correct-course-2026-08-09-ad6-ad10`. The
`note` field is left alone; it is process narrative that a contract file should not be accruing,
and this run does not add to it.

### 6.2 `sprint-status.yaml`

```yaml
  epic-25: backlog
  25-1-every-service-write-states-what-it-expected: backlog
  25-2-two-edits-in-one-second: backlog
  epic-25-retrospective: optional

  epic-26: backlog
  26-1-present-message-names-its-plan: backlog
  epic-26-retrospective: optional
```

plus one `action_items` entry (epic 25, owner `kodesh87`, status `open`) carrying the asymmetry
in §5, and `last_updated: 2026-08-09`.

### 6.3 `deferred-work.md`

| Row | Owner: old → new |
| --- | --- |
| `AD-6` | `unassigned — needs a story` → **Story 25.1** |
| `AD-10` | `unassigned — needs a story` → **Story 26.1** |
| `updated_at` second granularity (*Concurrency and data integrity*) | `unassigned` → **Story 25.2** |

The third row is beyond the two `AD` cells and is named here rather than slipped in. It is
assigned because `AD-6`'s own entry calls it *"Compounded by the second-granularity weakness
below"*: it is inside `AD-6`'s stated gap, and leaving it unassigned would have made Story 25.2
an orphan the moment it was written. Nothing else in the register changed owner.

Both `AD` rows also gained resolved line numbers where they previously cited a bare file, and
`AD-10`'s row now states its independence explicitly.

### 6.4 Not changed, deliberately

`ARCHITECTURE-SPINE.md`. Both decisions already describe their own gap accurately and both
already delegate tracking to `deferred-work.md`. This run assigns ownership; it settles no
decision, so there is nothing for an Update run to record. The one thing that *would* require
one — option (b) in §5 — is the decision this run declined to take.

## 7. Implementation Handoff

**Scope: Moderate — Product Owner / Developer.**

| Recipient | Responsibility |
| --- | --- |
| **Owner (`kodesh87`)** | The `AD-6` webhook decision in §5. Until it lands, Story 25.1's webhook AC cannot be written |
| **`bmad-create-story`** | Story 26.1 first — it is independently startable and its hazard is live. Then 25.1 (minus the webhook AC if the decision is still open), then 25.2 |
| **`bmad-architecture`** | Only if the owner picks option (b). A new `AD-n`, never a renumber |

**Success criteria.** `deferred-work.md` → *Architecture decision gaps* holds no `AD` row whose
Rule is contradicted by shipped code and whose Owner cell is `unassigned`. After this change
set, the remaining unassigned row in that table is `AD-18`'s derived-index guard, which is
explicitly routed *"to whichever story next writes a value migration"* and is held for a
separate decision.
