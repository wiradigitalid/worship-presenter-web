---
scope: project
purpose: Single-node deploy constraints and durable paths for this product
overrides: null
decision: null
---

# Deployment — this product

The as-built until the cutover wave is still one Next.js process. The **rule** (DEC-003 / AD-4 / AD-30) is one Docker Compose unit whose always-on process is the Go API, plus a Node binary only to exec the PPTX worker. **Do not run multiple API processes against the same database file.**

## Durable paths

SQLite, the PPTX cache, and uploads must sit on host storage that survives a container replace — never a container layer.

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | Session cookie signature (required in production) |
| `AUTH_BOOTSTRAP_USER` / `AUTH_BOOTSTRAP_PASSWORD` | First-boot admin seed; remove after `accounts` is no longer empty |
| `WEBHOOK_SECRET` | Telegram intake gate; 503 when unset |
| `DB_PATH` | SQLite file. Default `./data.db`. In Docker, a path on the durable volume (for example `/data/data.db`) |
| `PPTX_CACHE_DIR` | Generated deck cache |
| `UPLOADS_DIR` | Local image files (when used) |
| `PPTX_RETENTION_DAYS` | Cache retention; default 60. `0` keeps forever |
| `IMAGE_URL_ALLOWLIST` | Hostnames allowed for remote image fetch (AD-8) |
| `PORT` | Go API listen port (as-built Next: 3000 until cutover) |

`docker-compose.yml` and `Dockerfile` at the repo root are the as-built packaging. A Cloudflare Tunnel in front of `localhost:3000` is the published pattern; there is no public inbound port on the venue router.

picoclaw lives on a separate host and `POST`s `/api/webhook` with `x-webhook-secret`. The webhook is never cookie-gated.

## SQLite

On open the app sets WAL, `busy_timeout = 5000`, and `foreign_keys = ON`. Keep the `-wal` / `-shm` sidecars on the same volume as `DB_PATH`.

**Backup:** stop writes (or briefly stop the process), copy `data.db` plus `-wal`/`-shm` if present, or `sqlite3 "$DB_PATH" ".backup backup.db"`. Losing `DB_PATH` loses the authored registry; the seed is not a recovery channel (AD-17).

## Host

The production shape assumed at G3 is an always-on Windows host with Docker Desktop (WSL2). Sleep and hibernation off. Fonts used by PptxGenJS must be installed on that machine (NFR-7). Phase-1 decks name Arial; if the venue machine lacks it, install a font pack or accept the host’s default sans-serif substitution.

A production image copies shipped corpora. Never bake `data.db`. After cutover the image is Go + SPA assets + a Node binary for the PPTX child (OQ-35).
