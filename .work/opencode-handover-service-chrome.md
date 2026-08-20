# Task — OpenCode MiniMax M3: restore Service action chrome

Repo: this working tree. Branch: main. Public repo.

Do NOT commit `.env*`, `data/*.db*`, `data.db*`, congregation data. Do NOT invoke WDI/BMad skills. Do NOT revive Next.js. Do NOT push. Do NOT deploy.

Owner authorizes edits and tests. You MAY commit on main with a short message after tests pass; do NOT push.

Model context: restore missing Present / Preview (slideshow) / Download PPTX on the worship Service edit page after SPA cutover.

## Bug

Routes still exist in `spa/src/App.tsx`:

- `/services/:id/present` → Presenter Mode (`PresentPage` → `PresenterOperator`)
- `/services/:id/present/projector` → Projection (opened from Presenter)
- `/services/:id/slideshow` → web slideshow Preview
- `GET /api/services/{id}/pptx` → Download PPTX (Go API in `internal/httpapi`)

But `spa/src/pages/RunSheetPage.tsx` only mounts `Header` + `EditForm`. `EditForm` has Live Slide Preview (right pane) and `DeleteButton`, and **no** links/buttons for Present, Slideshow Preview, or Download PPTX.

Corpus expectation: `.how/hub/05-model/form-fields.md` § Edit-only chrome — Preview (slideshow), Present, Delete Service, Download PPTX, Live Slide Preview.

## Required fix

1. On the **edit** Service surface (`/services/:id` via `RunSheetPage` / `EditForm`), restore visible actions:
   - **Present** → navigate or link to `/services/{id}/present`
   - **Preview** (slideshow) → `/services/{id}/slideshow` (new tab is fine)
   - **Download PPTX** → `GET /api/services/{id}/pptx` with credentials; trigger file download (check existing smoke/tests for Content-Disposition / filename)
   - Keep **Delete Service** and **Live Slide Preview**
   - If Admin: keep/wire **Sync Artifact** (`src/operator/SyncArtifactButton.tsx`) when that control belonged on edit before — only if it was part of the edit chrome; do not invent new Admin-only flows beyond restoring the cutover gap

2. Placement: a clear action row near the top of the edit page and/or with the footer actions — match existing Card / Button / Link + `buttonVariants` patterns (shadcn). Do **not** use `Button render={<Link />}` without `nativeButton={false}`; prefer `Link` + `buttonVariants` or plain `<a>`.

3. i18n: add keys to `src/lib/i18n/keys.ts`, `catalogue-en.ts`, `catalogue-id.ts` for any new visible strings.

4. Create (`/services/new`) MUST NOT gain Present / PPTX / slideshow (no service id yet). Live Slide Preview on create stays.

5. Do not implement DEC-004 nested registries in this pass — chrome restore only.

## Verify

- `npm test` or at least public-repo-guard + any touched-file tests
- SPA still builds (`npm run spa:build` or project equivalent)
- Manually reason that Present / slideshow / pptx URLs are reachable from EditForm

## Done when

Edit Service page shows Present, Preview (slideshow), Download PPTX again; Create does not; tests green; short commit message if you commit.
