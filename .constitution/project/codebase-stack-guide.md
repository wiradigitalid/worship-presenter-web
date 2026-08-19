---
status: Draft            # Article 4: Draft MAY be read as guidance, MUST NOT reject a change
ratified_by: null        # stamped when W1 close commit is known
---

# stack — codebase guide

**Loaded when:** writing or reviewing code.

Filled at W1 close from `_bmad-output/specs/spec-w1-registry/stack.md` plus the as-built tree. While `draft`, MAY be read as guidance and MUST NOT reject a change.

Every version below is `package.json` as read at distillation. **Read `package.json` rather than trusting a number here** if the two disagree.

## Runtime and framework

| Thing | Value | Where it is fixed |
|---|---|---|
| Framework | Go API + React SPA (Vite). Next.js App Router is removed | `go.mod`, `package.json`, `spa/vite.config.ts` |
| React | `19.2.4` | `package.json` |
| Language | Go for `api`; TypeScript `^5` for `spa` / worker | `go.mod` / `tsconfig.json` |
| Import alias | `@/*` → `./src/*` while as-built Next remains | `tsconfig.json` `paths` |
| Database | SQLite; as-built `better-sqlite3` `^12.11.1`; target Go driver on the API process | AD-9, AD-30 |
| Deck output | `pptxgenjs` `^4.0.1` in `pptx-worker` only | AD-30 |
| Canvas editor | `fabric` `^6.6.1` | `AD-13` uncontrolled wrapper |
| UI | Tailwind `^4`, `shadcn`, `@base-ui/react` on the SPA | `package.json` |
| Node — CI / worker | `22` in image only to exec PPTX child; not a 24/7 app server | AD-30, `.github/workflows/test.yml` |

**This is not the Next.js in your training data.** After DEC-003 the live API is Go and the operator UI is the Vite SPA. Do not add Next.js route handlers.

## Commands, and the directory each runs from

All of these run from the repository root.

| Purpose | Command |
|---|---|
| Install exactly the lockfile | `npm ci` |
| Build | `npm run build` |
| Full test suite | `npm test` |
| One test file | `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/<name>.test.mjs` |
| Lint | `npm run lint` |
| Public-repo guard alone | `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/public-repo-guard.test.mjs` |
| Dev server | `npm run dev` |

`npm test` does **not** glob `tests/`. It names every file explicitly in the `test` script, so **a new test file is not run until it is added to that list**. `.github/workflows/test.yml` runs `npm ci`, then `npm run build`, then `npm test`, in that order; `tests/auth-http.test.mjs` throws without `.next`.

## How a test is written here

`node:test` plus `node:assert/strict`. TypeScript under `src/` loads through `--experimental-strip-types` behind `tests/register-ts-resolve.mjs`.

Set `process.env.DB_PATH` to a temp file **before** the first dynamic import of `src/lib/db/index.ts`. `getDb()` memoizes. Import `src/` with `await import(pathToFileURL(...).href)`.

`tests/register-ts-resolve.mjs` sets `WPW_USE_SHIPPED_REGISTRY=1`. Do not defeat that.

A test asserting something is **absent** is worth nothing until it has been seen to fail (`AGENTS.md`).

`node:test` parallelizes top-level `test()`. Shared `getDb()` plus the same service date needs `describe(..., { concurrency: false })`.

`--experimental-strip-types` forbids TypeScript constructor parameter properties.

## Where registry and snapshot code lives

| Concern | Path |
|---|---|
| Request gate and the authorization matcher | Go API (AD-5). As-built: `src/proxy.ts` + `tests/proxy-matcher.test.mjs` until cutover |
| Admin session re-check in a route | `requireAdminSession` from `@/lib/auth/require` |
| Startup DDL, `data_version`, AD-17 bootstrap, AD-16 table | `src/lib/db/index.ts` |
| Registry store (`LC-15`) | `src/lib/registry/store.ts` |
| Service-bound freeze clone / Sync | `src/lib/registry/service-snapshot.ts` |
| Live-registry map per plan build | `src/lib/artifacts/registry-snapshot.ts` |
| Registry HTTP (`LC-11`) | `src/app/api/admin/artifacts/**/route.ts` |
| Sync Artifact (`LC-2`) | `src/app/api/services/[id]/sync-artifact/route.ts` |
| Admin Registry screen | `/admin/artifacts` |
| Admin Sync control | `/services/[id]` (`SyncArtifactButton.tsx`) |

`.work/` is committed scratch. It MUST NOT be imported by `src/`.
