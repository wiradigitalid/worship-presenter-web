# Task — CommandCode MiniMax-M3: fix Dashboard icon blow-up + visible logout

Repo is this working tree. Branch: main. Public repo. Do NOT commit `.env*`, `data/*.db*`, `.commandcode/`. Do NOT invoke WDI/BMad skills. Do NOT revive Next.js.

Owner authorizes you to edit files and run tests. Do NOT git commit or git push unless the change is complete and tests pass — then you MAY commit on main with a short message, but do NOT push. Do NOT deploy.

## Why this pass exists

A previous MiniMax pass restored SPA shell + Settings/Login Card rows (commit `4d307b3`). Owner still sees a broken Dashboard: a giant magnifying-glass icon stacked above a giant plus icon; no Log out. MiniMax did not touch `ServicesList.tsx` and was forbidden from touching `Header.tsx`. Those two files are now in scope.

Do not add more Tailwind to paper over layout. Cap SVG size and surface logout.

## Bug 1 — Giant icons — `src/operator/ServicesList.tsx`

Search row (~L73–107): wrapper `relative max-w-md w-full` + `span.absolute.inset-y-0` wrapping a raw `<svg className="w-4 h-4">`. Clear button is `Button size="icon-xs"` with another raw svg and `className="absolute inset-y-0 right-0"` which can override `size-6` via tailwind-merge.

New Service (~L102–107):

```tsx
<Button render={<Link href="/services/new" />} variant="default" className="... w-full sm:w-auto">
  <svg className="size-4 mr-1 ...">...</svg>
  {t('dashboard.newService')}
</Button>
```

`Button` is Base UI (`render` swaps the host to React Router `Link` = `<a>`). Combined with `w-full` under `flex-col` (viewport < sm), an SVG flex child of a full-width `<a>` scales to the anchor width. That is the screenshot.

Required fix:
- Replace inline SVGs with lucide-react (`Search`, `Plus`, `X`) and always `className="size-4 shrink-0"` (or wrap in `span className="inline-flex size-4 shrink-0"`).
- Do NOT use `Button render={<Link />}`. Keep New Service as h-8, icon 16px, text beside icon, `w-auto`, `whitespace-nowrap`. Prefer `Link` + `buttonVariants()` via `cn`, or a Button that does not become a full-width `<a>` wrapping an unconstrained SVG.
- Search: Input default nova h-8, icon `absolute left-2 top-1/2 -translate-y-1/2` + `size-4`. No `inset-y-0` on an unconstrained axis.
- Empty-state SVG stays inside the existing `w-12 h-12` box.
- Every svg/Lucide icon in this file MUST include `size-4` or sit in a `size-4`/`size-6`/`w-12 h-12` box. No `w-full` on a control that contains an svg.

## Bug 2 — Logout not visible — `src/components/Header.tsx` + `LogoutButton.tsx`

Logout exists only inside `DropdownMenu` (`<LogoutButton variant="menu" />`). Owner does not see it. ThemeToggle uses `MonitorIcon` next to nav; it is not Admin/logout.

Required fix:
- Keep the username dropdown (change password + logout) AND put a visible Log out control on the header row: `<LogoutButton />` default `variant="button"` (or compact ghost Button calling the same POST `/api/auth/logout`). Must be visible on a stacked/narrow header without opening a menu.
- Do not restyle nav pills (`header-chrome.ts`) except `shrink-0` on the logout control if wrap hides it.
- Leave `ThemeToggle.tsx` as-is unless it eats the row.

## Out of scope

Settings cards already changed. LoginPage MiniMax rewrite. `src/globals.css` tokens. Go API. i18n unless a label is missing (`chrome.logout` exists). `.constitution/method/`.

## Constraints

- shadcn primitives: `tests/operator-shadcn-guard.test.mjs` (Header + ThemeToggle remain allowlisted). ServicesList is scanned — no raw `<button>`/`<select>`/text `<input>`.
- `npm run spa:build` must pass. Run the guard test and `tests/theme-chrome.test.mjs`.
- Do not commit local db files.

## Done when

Dashboard search is a normal h-8 input with a 16px icon; New Service is a normal h-8 button with a 16px plus. Header: Log out readable without opening the profile menu. Report files touched.
