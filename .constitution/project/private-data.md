---
scope: project
purpose: Where congregation data lives on disk, and what to do if it reaches git
overrides: null
decision: null
---

# Private data — this product

The hard gate is `.constitution/public-repository.md`. This file is the how-to that used to live next to the operator manuals.

## Where your own data goes

| Kind | Path | Notes |
| --- | --- | --- |
| Private registry override | `data/local/default-registry.json` | Git-ignored. The seeder prefers it over the shipped example and logs which file it used. Same shape and validation as `data/default-registry.json`. |
| Uploads | `data/uploads/` | Runtime flyers and photographs. Do not move them into `public/`. |
| Source decks | `*.pptx` / `*.potx` | Extraction inputs. Keep them outside the repo or at the root, where ignore rules catch them. |
| Secrets | `.env` | `npm run setup` generates it. `.env.example` carries placeholders only. |
| Local DB | `data.db` / `DB_PATH` | Runtime only. |

Automated tests and fidelity smokes set `WPW_USE_SHIPPED_REGISTRY=1` so a developer's gitignored override cannot change asserted PPTX copy.

## If something private has already been committed

A delete in a new commit does not un-publish history.

1. Stop. Do not push, and do not make the repository public.
2. If it was never pushed, rewrite the history that contains it.
3. If it was pushed, assume it is already copied and indexed. Rotate secrets and payment codes. For personal data, a fresh repository is often the honest answer — that is how this one came to exist.
