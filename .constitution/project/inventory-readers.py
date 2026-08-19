"""inventory readers — how THIS product's code is read. Owned by the product, not the method.

Stack confirmed on disk (wdi-init intent `readers`, 2026-08-19; Host/Screen containers
amended DEC-003 — still derived from Next.js as-built until the cutover wave):

    db      SQLite DDL inside `src/lib/db/index.ts` (`CREATE TABLE IF NOT EXISTS`, better-sqlite3)
    api     Next.js App Router `src/app/api/**/route.ts` (`export async function GET|POST|…`)
            Host cell is container `api` (Go target), not the as-built process name
    screen  Next.js App Router `src/app/**/page.tsx` (route groups `(operator)` / `(projected)`
            are not in the URL). Screen identity prefix is container `spa`

The whole file is yours. `wdi-method update` never writes over it and `promote` never publishes it.

WHAT THE ENGINE EXPECTS. Three functions, each taking the repo root and returning a `Derived`:

    derive_db(root)      -> Derived    the tables this product stores
    derive_api(root)     -> Derived    the endpoints it serves
    derive_screen(root)  -> Derived    the screens it renders

Three names are INJECTED before this module executes, so import nothing for them:

    Row(key, cells, source)
    Derived(rows, unread)
    decisions(path)

THE COLUMN ORDER `cells` MUST FOLLOW:

    db      Table · Owning component · What it holds · Key columns · Status
    api     Host · Method · Path · Owning component · Description · Status
    screen  Screen · Route · States · Owning component · UC served

(The leading `No` is the engine's; a reader MUST NOT supply it.)

Whatever a pattern cannot read is appended to `unread`. It MUST NOT be guessed.
"""

from __future__ import annotations

import re
from pathlib import Path

# API Host / SPA screen prefix: C4 containers after DEC-003 (not the as-built Next process).
API_HOST = "api"
SPA_HOST = "spa"

DEFAULT_API_DESC = {
    "POST /api/auth/login": "Log in",
    "POST /api/auth/logout": "Log out",
    "POST /api/auth/change-password": "Change password",
    "GET /api/services": "List Services",
    "POST /api/services": "Create Service",
    "PUT /api/services/[id]": "Update Service (AD-6)",
    "DELETE /api/services/[id]": "Delete Service",
    "GET /api/services/[id]/pptx": "Download PPTX",
    "POST /api/services/preview": "Preview",
    "POST /api/services/[id]/sync-artifact": "Sync Artifact (AD-16)",
    "GET /api/announcements": "List announcements",
    "POST /api/announcements": "Add announcement item",
    "PUT /api/announcements": "Reorder list",
    "PATCH /api/announcements/[id]": "Update one item",
    "DELETE /api/announcements/[id]": "Delete one item",
    "POST /api/upload": "Upload image",
    "POST /api/upload/from-url": "Fetch image from URL",
    "GET /api/uploads/[filename]": "Read upload",
    "GET /api/hymns": "Search hymns",
    "GET /api/admin/accounts": "List accounts",
    "POST /api/admin/accounts": "Create account",
    "PATCH /api/admin/accounts/[id]": "Update account",
    "DELETE /api/admin/accounts/[id]": "Delete account",
    "GET /api/admin/settings": "Settings",
    "PUT /api/admin/settings": "Update settings",
    "GET /api/admin/artifacts": "List templates",
    "GET /api/admin/artifacts/[id]": "One template",
    "PUT /api/admin/artifacts/[id]": "Save layout",
    "POST /api/admin/artifacts/[id]/reset": "Restore seed",
    "DELETE /api/admin/artifacts/[id]": "Delete template",
    "PUT /api/admin/artifacts/order": "Reorder templates",
    "GET /api/scripture": "Verse lookup",
    "POST /api/webhook": "picoclaw intake / correction",
}

DEFAULT_DB_HOLDS = {
    "services": "One dated Service and the week's payload",
    "hymns": "Song Book entries",
    "announcement_items": "Announcement list",
    "accounts": "Per-person accounts",
    "login_attempts": "Login trail",
    "revoked_sessions": "Revoked sessions",
    "settings": "Application settings",
    "bible_translations": "Translation corpora",
    "bible_books": "Book names per translation",
    "bible_verses": "Verse text",
    "artifact_templates": "Slide order and layout",
    "service_registry_snapshots": "Per-Service frozen registry clone (AD-16)",
}

# Table → PC: from `owns:` in components.yaml against the DDL names in db/index.ts.
# hymns is Hub's Song Book (FR-23/24, `/api/hymns`), not a Presenter corpus table.
TABLE_PC = {
    "services": "hub",
    "hymns": "hub",
    "announcement_items": "hub",
    "accounts": "hub",
    "login_attempts": "hub",
    "revoked_sessions": "hub",
    "settings": "hub",
    "bible_translations": "presenter",
    "bible_books": "presenter",
    "bible_verses": "presenter",
    "artifact_templates": "registry",
    "service_registry_snapshots": "registry",
}

# One-shot rebuild names in the same file: created, copied, dropped, renamed. Not live tables.
MIGRATE_ONLY = {
    "hymns_with_book_code": "hymns",
    "bible_verses_with_translation_code": "bible_verses",
}


def read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def _posix(root: Path, path: Path) -> str:
    return path.relative_to(root).as_posix()


def _paren_body(text: str, open_idx: int) -> str | None:
    """Body inside the '(' at open_idx, or None if unbalanced."""
    depth = 0
    for i, ch in enumerate(text[open_idx:], start=open_idx):
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
            if depth == 0:
                return text[open_idx + 1 : i]
    return None


def _key_columns(body: str) -> str:
    keys: list[str] = []
    for m in re.finditer(
        r"^\s*(\w+)\s+[^,\n]+PRIMARY KEY\b", body, re.I | re.M
    ):
        keys.append(m.group(1))
    for m in re.finditer(r"PRIMARY KEY\s*\(([^)]+)\)", body, re.I):
        keys.append(", ".join(p.strip() for p in m.group(1).split(",")))
    for m in re.finditer(r"UNIQUE\s*\(([^)]+)\)", body, re.I):
        keys.append(", ".join(p.strip() for p in m.group(1).split(",")))
    # Preserve order, drop duplicates.
    seen: list[str] = []
    for k in keys:
        if k not in seen:
            seen.append(k)
    return ", ".join(seen) if seen else "—"


LIVE_TABLE_RE = re.compile(r"CREATE TABLE IF NOT EXISTS (\w+)\s*\(", re.I)
ANY_TABLE_RE = re.compile(r"CREATE TABLE (\w+)\s*\(", re.I)
ROW_RE = re.compile(r"^\|\s*\d+\s*\|(.*)\|\s*$")


def _recorded_cell_lists(path: Path) -> list[list[str]]:
    if not path.exists():
        return []
    out: list[list[str]] = []
    inside = False
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        if line.startswith("## "):
            inside = line[3:].strip().lower().startswith("rows")
            continue
        if not inside:
            continue
        match = ROW_RE.match(line.strip())
        if match:
            out.append([c.strip() for c in match.group(1).split("|")])
    return out


def _recorded_cells(path: Path) -> dict[str, list[str]]:
    """Judgement columns keyed by the first cell (table name)."""
    return {cells[0].strip("`"): cells for cells in _recorded_cell_lists(path) if cells}


def derive_db(root: Path) -> "Derived":  # noqa: F821
    """Tables from the SQLite DDL in `src/lib/db/index.ts`."""
    source = root / "src" / "lib" / "db" / "index.ts"
    text = read(source)
    unread: list[str] = []
    if not text:
        return Derived(unread=[f"{_posix(root, source)} could not be read"])

    rel = _posix(root, source)
    live: dict[str, tuple[str, str]] = {}
    for m in LIVE_TABLE_RE.finditer(text):
        name = m.group(1)
        body = _paren_body(text, m.end() - 1)
        if body is None:
            unread.append(f"{rel}: unbalanced CREATE TABLE IF NOT EXISTS {name}")
            continue
        live[name] = (_key_columns(body), rel)

    for m in ANY_TABLE_RE.finditer(text):
        name = m.group(1)
        if name in live:
            continue
        dest = MIGRATE_ONLY.get(name)
        if dest:
            unread.append(
                f"{rel}: CREATE TABLE {name} is a one-shot rebuild, then RENAME TO {dest} "
                f"— not a live table"
            )
        else:
            unread.append(f"{rel}: CREATE TABLE {name} is not IF NOT EXISTS — unread")

    recorded = _recorded_cells(root / ".how" / "_platform" / "inventory-db.md")
    rows = []
    for name in sorted(live):
        keys, src = live[name]
        owner = TABLE_PC.get(name)
        if owner is None:
            unread.append(f"{rel}: table {name} has no owns: mapping — owner left `_platform`")
            owner = "_platform"
        prior = recorded.get(name) or []
        holds = prior[2] if len(prior) > 2 and prior[2] not in ("", "—") else "—"
        if holds == "—":
            holds = DEFAULT_DB_HOLDS.get(name, "—")
        rows.append(Row(
            key=name,
            cells=[name, owner, holds, keys, "published"],
            source=src,
        ))
    return Derived(rows=rows, unread=unread)


METHOD_RE = re.compile(
    r"^export async function (GET|POST|PUT|PATCH|DELETE)\b", re.M
)


def _api_path(root: Path, route_file: Path) -> str:
    rel = route_file.relative_to(root / "src" / "app").as_posix()
    parts = [p for p in rel.split("/") if p != "route.ts"]
    return "/" + "/".join(parts)


def _api_owner(path: str) -> str:
    if path.startswith("/api/admin/artifacts"):
        return "registry"
    if path.startswith("/api/scripture"):
        return "presenter"
    return "hub"


def derive_api(root: Path) -> "Derived":  # noqa: F821
    """Endpoints from App Router `route.ts` HTTP exports."""
    api_root = root / "src" / "app" / "api"
    unread: list[str] = []
    rows: list = []
    if not api_root.is_dir():
        return Derived(unread=["src/app/api/ is missing"])

    by_endpoint: dict[str, str] = {}
    for cells in _recorded_cell_lists(root / ".how" / "_platform" / "inventory-api.md"):
        if len(cells) >= 5:
            by_endpoint[f"{cells[1]} {cells[2].strip('`')}"] = cells[4]

    for route_file in sorted(api_root.rglob("route.ts")):
        rel = _posix(root, route_file)
        text = read(route_file)
        methods = METHOD_RE.findall(text)
        if not methods:
            unread.append(f"{rel}: no export async function GET|POST|PUT|PATCH|DELETE")
            continue
        path = _api_path(root, route_file)
        owner = _api_owner(path)
        for method in sorted(set(methods)):
            desc = by_endpoint.get(f"{method} {path}", "—")
            if desc in ("", "—"):
                desc = DEFAULT_API_DESC.get(f"{method} {path}", "—")
            rows.append(Row(
                key=f"{API_HOST} {method} {path}",
                cells=[API_HOST, method, f"`{path}`", owner, desc, "published"],
                source=rel,
            ))

    rows.sort(key=lambda r: (r.cells[2], r.cells[1]))
    return Derived(rows=rows, unread=unread)


PAGE_FN_RE = re.compile(
    r"^export default (?:async )?function (\w+)\b", re.M
)
GROUP_RE = re.compile(r"^\([^/]+\)$")


def _screen_route(root: Path, page: Path) -> str:
    rel = page.relative_to(root / "src" / "app").as_posix()
    parts = [p for p in rel.split("/") if p != "page.tsx" and not GROUP_RE.match(p)]
    if not parts:
        return "/"
    return "/" + "/".join(parts)


DEFAULT_SCREEN_UC = {
    "/login": "UC-9",
    "/": "UC-3",
    "/services/new": "UC-2",
    "/services/[id]": "UC-4, UC-5, UC-6, UC-7, UC-16, UC-18",
    "/announcements": "UC-21",
    "/admin": "UC-9, UC-19, UC-22",
    "/admin/artifacts": "UC-14, UC-15",
    "/services/[id]/slideshow": "UC-11",
    "/services/[id]/present": "UC-12, UC-13",
    "/services/[id]/present/projector": "UC-12",
}


def _screen_owner(route: str) -> str:
    if route.startswith("/admin/artifacts"):
        return "registry"
    if "/slideshow" in route or "/present" in route:
        return "presenter"
    return "hub"


def derive_screen(root: Path) -> "Derived":  # noqa: F821
    """Screens from App Router `page.tsx`. Route groups do not appear in the URL."""
    app = root / "src" / "app"
    unread: list[str] = []
    if not app.is_dir():
        return Derived(unread=["src/app/ is missing"])

    inv = root / ".how" / "_platform" / "inventory-screen.md"
    state_of, _plat = decisions(inv)
    by_parent: dict[str, list[str]] = {}
    for state_route, parent in sorted(state_of.items()):
        by_parent.setdefault(parent, []).append(state_route)

    rows = []
    for page in sorted(app.rglob("page.tsx")):
        rel = _posix(root, page)
        text = read(page)
        fns = PAGE_FN_RE.findall(text)
        if not fns:
            unread.append(f"{rel}: no `export default function`")
            continue
        name = fns[-1]
        route = _screen_route(root, page)
        states = ", ".join(f"`{s}`" for s in by_parent.get(route, [])) or "—"
        owner = _screen_owner(route)
        uc = "—"
        for cells in _recorded_cell_lists(inv):
            if len(cells) >= 5 and cells[1].strip("`") == route:
                uc = cells[4]
                break
        if uc in ("", "—"):
            uc = DEFAULT_SCREEN_UC.get(route, "—")
        elif route == "/services/[id]" and "UC-16" not in uc:
            uc = "UC-4, UC-5, UC-6, UC-7, UC-16, UC-18"
        rows.append(Row(
            key=f"{SPA_HOST}:{route}",
            cells=[f"{SPA_HOST}/{name}", f"`{route}`", states, owner, uc],
            source=rel,
        ))

    unread.append(
        "UC served is not declared in page.tsx — values are kept from this inventory file"
    )
    rows.sort(key=lambda r: r.cells[1])
    return Derived(rows=rows, unread=unread)
