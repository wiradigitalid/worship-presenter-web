---
status: Draft
ratified_by: null
---

# conventions — codebase guide

**Loaded when:** writing or reviewing code.

Filled at W1 close from `_bmad-output/specs/spec-w1-registry/conventions.md` plus as-built Sync/delete
routes, and at W2 close from `spec-w2-hub/conventions.md`. While `Draft`, MAY be read as guidance and
MUST NOT reject a change.

W2's companion also carried three rules that were true only inside that wave and MUST NOT be revived:
keeping a proxy-matcher suite in step with the gate until the Next.js middleware file was deleted,
not running Next's `getDb()` beside the Go API, and "inventory numbers 1–33 do not change". Next is
gone (DEC-003) and the API inventory reaches 69.

## API handler shape

Go handlers in `internal/httpapi` own the live HTTP surface. Specimens: registry writes in `internal/httpapi/registry.go`; Sync Artifact on `POST /api/services/{id}/sync-artifact`.

1. Session check first (`requireAdmin` / `requireSession` or the AD-5 gate). No session / not Admin → 401/403.
2. Path ids parsed from the mux; invalid → 404.
3. Body validated shape-first: non-object or array → `400 Invalid JSON`.
4. Work inside the handler; map known error classes to status; generic `500` last.

Registry write tokens are camelCase `updatedAt`. Hub Service tokens are snake_case `updated_at`. Do not mix them on one resource.

The client never sees an internal message. Log `console.error` server-side; return `{ error: string }`.

## Gated JSON responses

`{ error: string }` as the body, plus `Cache-Control: private, no-store` and `Vary: Cookie` — a gated
response cached by a shared proxy is one operator's data served to the next. Status map: `401` session
absent, `403` role insufficient, `400` invalid input, `404` row absent, `500` a generic client message
with the real error logged server-side.

## The session cookie is not trusted on its signature alone

Cookie `auth_session`, HMAC-SHA256 over a base64url payload carrying `uid`, `role`, `sid`, `tv`, `exp`.
A valid signature is **not** sufficient: `accounts` and `revoked_sessions` are re-checked in-process on
every gated request, so a revoked session or a demoted role takes effect immediately rather than at
expiry. Specimen: `internal/auth`.

## The PPTX worker is isolated by import, not by convention

The child receives a finished plan as JSON on stdin, draws it, and exits (AD-30). It MUST NOT import
`getDb`, `src/lib/db`, `buildSlidePlan`, or `src/lib/settings.ts`. The transition is a **field on that
JSON**, never a database read — the worker has no database. `internal/pptx` execs it under a deadline
(`DefaultDrawTimeout`); a wedged render must not hold an HTTP handler open forever.

## The planner is the only source of slide order

`buildSlidePlan` / Go `BuildSlidePlan` decides sequence and content for every surface (AD-7). Order comes
from `artifact_templates.position`, or from the AD-16 per-service freeze — never from the order rows
happen to appear in a handler. A missing or invalid template row is **omitted and logged**, never
substituted from seed (AD-17).

## Errors are classes, not status codes, below the route

Registry: `RegistryNotFoundError`, `RegistryStaleError`, `RegistryValidationError`. Snapshot/Sync: `ServiceNotFoundError`, `ServiceStaleError`. The store knows nothing about HTTP.

## Vocabulary lives in one exported list, and kinds are derived

`src/lib/registry/types.ts`: `const` array `as const`, type `(typeof X)[number]`, `kindOf` (throws, writes) vs `kindChipLabel` (render). An enum value never reaches the screen raw.

## Database

- One synchronous `better-sqlite3` handle, memoized in `getDb()`.
- Schema changes are `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE` on the `getDb` path (`AD-9`).
- Value changes are one-time migrations under `data_version` (`AD-18`, `AD-21`).
- `cloneRegistryToNewService` MUST NOT open `transaction.immediate()` when already inside `createService`'s transaction.

## Comments carry the reason, not the mechanism

Cite `AD-n` / `OQ-n` / `BR-n` inline rather than restating the decision.

## Nothing renders a React component in a test, so a UI test is a source scan

Distilled at W5 close from `spec-w5-presenter-remote/SPEC.md`, where it had to be
said before a story could be honest about what its test proved.

**"Component" here means a React component, not a Product Component (`method-glossary.md`) — this
says nothing about how hub, presenter or registry are tested.** No DOM, no renderer, no `@testing-library` — nothing in this repository mounts a component to assert on
it. Every UI test is therefore a **source scan**: `tests/operator-shadcn-guard.test.mjs` is the
specimen, and `tests/remote-screen.test.mjs` the most recent. A scan can prove that only shadcn
primitives are imported, that every rendered string resolves through `t` and exists in all three
catalogues, that a forbidden pattern is absent, and that a union of allowed message types has not
quietly grown. It cannot prove that a control is reachable, legible, or in the right place.

Two consequences, and the second is the one that gets forgotten:

- **A guard is proved by injecting the defect into the real file**, not by feeding a synthetic string to
  the scanner function. A scanner unit test stays green when the file walk is broken or points at the
  wrong path, and that has happened here more than once — a guard scanning `src/` while the violation
  was written in `spa/src/`, and a liveness guard reading a type union while the violation was a
  condition on an existing call.
- **A story whose acceptance is visual names its human smoke test as a deliverable.** Otherwise the
  story closes green on a test that never could have failed, which is the shape this project's whole
  guard discipline exists to prevent.

## Naming

`.constitution/method/language-guide.md` owns naming. `RegistrySnapshot` (live map) and `ServiceRegistrySnapshot` (AD-16 freeze) are two different things. Go packages under `internal/` are lowercase and single-word. JSON field names on the wire stay camelCase to match the as-built Hub contracts, whatever the column is called.
