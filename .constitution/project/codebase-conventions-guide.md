---
status: Draft
ratified_by: null
---

# conventions — codebase guide

**Loaded when:** writing or reviewing code.

Filled at W1 close from `_bmad-output/specs/spec-w1-registry/conventions.md` plus as-built Sync/delete routes. While `draft`, MAY be read as guidance and MUST NOT reject a change.

## API route shape

Every route under `src/app/api/**/route.ts` follows one order. `src/app/api/admin/artifacts/[id]/route.ts` is the Registry specimen; `src/app/api/services/[id]/sync-artifact/route.ts` is the Hub specimen.

1. Session check first (`requireAdminSession` or the proxy gate). No session / not Admin → 403.
2. `const { id } = await context.params` — params is a `Promise`.
3. Body validated shape-first: non-object or array → `400 Invalid JSON`.
4. Work inside `try`; map known error classes to status; generic `500` last.

Registry write tokens are camelCase `updatedAt`. Hub Service tokens are snake_case `updated_at`. Do not mix them on one resource.

The client never sees an internal message. Log `console.error` server-side; return `{ error: string }`.

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

## Naming

`.constitution/method/language-guide.md` owns naming. `RegistrySnapshot` (live map) and `ServiceRegistrySnapshot` (AD-16 freeze) are two different things.
