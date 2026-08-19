"""inventory readers — how THIS product's code is read. Owned by the product, not the method.

Stack confirmed on disk (wdi-init intent `readers`, 2026-08-19):

    db      SQLite DDL inside `src/lib/db/index.ts` (`CREATE TABLE IF NOT EXISTS`, better-sqlite3)
    api     Next.js App Router `src/app/api/**/route.ts` (`export async function GET|POST|…`)
    screen  Next.js App Router `src/app/**/page.tsx` (route groups `(operator)` / `(projected)`
            are not in the URL)

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

# One as-built container (`components.yaml` `built: true`). Host / spa identity.
HOST = "web"

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
    for m in re.finditer(r"UNIQUE\s*\(([^)]+)\)", body, re.I):
        keys.append(", ".join(p.strip() for p in m.group(1).split(",")))
    return ", ".join(keys) if keys else "—"


LIVE_TABLE_RE = re.compile(r"CREATE TABLE IF NOT EXISTS (\w+)\s*\(", re.I)
ANY_TABLE_RE = re.compile(r"CREATE TABLE (\w+)\s*\(", re.I)


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

    rows = []
    for name in sorted(live):
        keys, src = live[name]
        owner = TABLE_PC.get(name)
        if owner is None:
            unread.append(f"{rel}: table {name} has no owns: mapping — owner left `_platform`")
            owner = "_platform"
        rows.append(Row(
            key=name,
            cells=[name, owner, "—", keys, "published"],
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
            rows.append(Row(
                key=f"{HOST} {method} {path}",
                cells=[HOST, method, f"`{path}`", owner, "—", "published"],
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
        rows.append(Row(
            key=f"{HOST}:{route}",
            cells=[f"{HOST}/{name}", f"`{route}`", states, owner, "—"],
            source=rel,
        ))

    unread.append(
        "UC served is not declared in page.tsx — left `—`; do not invent from the plan"
    )
    rows.sort(key=lambda r: r.cells[1])
    return Derived(rows=rows, unread=unread)
