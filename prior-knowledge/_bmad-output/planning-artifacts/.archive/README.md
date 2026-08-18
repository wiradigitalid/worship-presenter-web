# Archive — dated run records

Nothing here is a contract. These are records of runs that already happened:
Correct Course proposals, readiness assessments, and the architecture Reviewer
Gate reports. They kept their contemporaneous wording and citations on purpose,
so a line number or a path inside them points at the tree **as it was on their
date**, not as it is now.

They are under `.archive/` so no glob over the planning artifacts reaches them.
An agent preparing to write code should not load any of this — see the reading
order in `_bmad-output/project-context.md`.

## What is here

| | |
|---|---|
| `sprint-change-proposal-*.md` | Correct Course runs. The decisions they reached were folded into `epics.md`, the spine, or a SPEC at the time; this is the reasoning behind them. |
| `implementation-readiness-report-*.md` | Two dated readiness assessments (2026-07-29, 2026-07-30). |
| `architecture/.../.archive/reviews/` | Reviewer Gate reports from `bmad-architecture` runs. |

Live artifacts still mention these documents by name in dated sentences — that
is correct, and the name still finds the file.

## Where the live answers are

| Question | File |
|---|---|
| What still binds the code | `architecture/**/ARCHITECTURE-SPINE.md` |
| What is still owed | `../implementation-artifacts/deferred-work.md` — the single debt register |
| What is being built now | `../implementation-artifacts/sprint-status.yaml` |

Full prior text of anything compacted or moved is in git history.
