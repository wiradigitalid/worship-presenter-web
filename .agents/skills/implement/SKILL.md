---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
---

> **Driven by `wdi-build` and `wdi-autopilot`.** `wdi-method` unlocked model invocation for this engine in this repo so those two can drive it unattended. Invoked from anywhere else — a stray session, a subagent that thought this looked relevant — stop and say so: this engine publishes to the tracker and writes code.

Implement the work described by the user in the spec or tickets.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review to review the work.

Commit your work to the current branch.
