# GITHUB-TO-RENDER RELEASE MODEL CHECK

_Generated: 2026-06-28 — read-only check. Nothing pushed, deployed, or modified._

## GitHub

- **Push access:** ✅ Yes. `git push --dry-run origin HEAD:main` succeeds cleanly as a fast-forward (`c0ea8d5..556747e`), no rejection, no `+` force. HTTPS `origin` → `github.com/thehealthyapples/Meal-Ingredients-Planner.git`.
- **Current branch:** `safety/preserve-since-last-prod-20260617-1613` (NOT `main`)
- **Current HEAD:** `556747e4d30bc1589eb52f4451e0d1ee350fa218`
- **origin/main:** `c0ea8d5ebc...` — 96 commits behind HEAD, 0 ahead.
- **Local main fast-forward possible:** ✅ Yes. Clean linear chain confirmed:
  `c0ea8d5` (origin/main) → `f384f6a` (local main) → `556747e` (HEAD). Each is an ancestor of the next, so every hop is a true fast-forward — no merge, no rebase, no conflict.

### Safe branch commands (none executed — for approval only)

Direct push (does not require switching branches):

```bash
git push origin 556747e:refs/heads/main      # clean FF, origin/main → HEAD
```

Or, to match the documented `./deploy.sh` flow (it hard-requires being on `main`):

```bash
git branch -f main 556747e                    # FF local main to HEAD (safe: you're not on main)
git checkout main
git push origin main                          # or: ./deploy.sh "release: ..."
```

## Render deployment model

✅ **GitHub-connected auto-deploy, NOT CLI-triggered.** Confirmed in:

- `RELEASE.md:168` — "Production deploys from GitHub → Render (auto-deploy on push to `main`)"
- `deploy.sh:42-46` — pushes to `origin main`, then "Render will now auto-deploy from GitHub"
- `MIGRATIONS.md:282-286` — env vars set in Render dashboard, "Render will trigger a redeploy automatically"
- No `render.yaml` / `render.yml` / `.render*` in repo — config lives in the Render dashboard, not the repo. Consistent with dashboard-managed GitHub auto-deploy.

## Production DB

- **Ownership:** ✅ Render owns it. Neon `DATABASE_URL` is a Render service environment variable (`MIGRATIONS.md:167,282`; `RELEASE.md:169` "Production database is Neon, separate from dev"). Migrations auto-run on every server start in Render (`server/migrations/runner.ts`, `RELEASE.md:195`).
- **Replit needs Neon prod DB:** **No** — for the deploy itself. Code push + schema migrations are fully covered by the Render-side auto-deploy path. **Conditional yes** only for Step 4: the `backfill-item-resolution.ts` reconciliation is the one step that does NOT auto-run (`RELEASE.md:211-216,260`). If that backfill is required this release, it must be run with `DATABASE_URL="<prod neon url>"` from a shell with prod DB access — and per RELEASE.md it can be skipped entirely if no shopping-list add/import paths changed and no new raw items exist.
- **Replit needs Render API:** **No.** Deploy is triggered by the GitHub push alone. No Render API token or CLI is referenced anywhere in the docs; all Render-side actions (logs, env, one-off jobs) are done in the dashboard.

## Remaining manual checks (must happen in Render/Neon — not reachable from this environment)

1. **Render Logs** — confirm deploy completes and `[Migrations] Schema at head: 2026-04-19_backfill_shopping_list_null_resolution_state` appears (`RELEASE.md:197-203`).
2. **Migration failure handling** — if `Schema head mismatch` / PERMISSION DENIED, paste the runner's printed SQL into Neon SQL Editor, run, redeploy (`RELEASE.md:203,245`).
3. **Step 4 backfill** — decide if needed; if so run dry-run then apply against prod `DATABASE_URL` (only place prod data reconciliation happens).
4. **Step 5 live-path smoke test** — Planner, Shopping list, chooser, Pantry, Pantry knowledge in the deployed prod app (`RELEASE.md:226-234`).
5. **Migration state spot-check** (optional) — `SELECT id, applied_at FROM schema_migrations ORDER BY applied_at;` in Neon (`RELEASE.md:280`).

## Blockers

None technical for the push.

- ⚠️ Not on `main` — `./deploy.sh` will refuse (`deploy.sh:13-16`); use the direct-push command or FF local main first.
- ⚠️ Post-push verification (Render logs, migration head, prod smoke test) cannot be done from this environment — it is manual in Render/Neon.

## Ready to approve GitHub push

**Yes** — the push is a clean, non-destructive fast-forward and access is confirmed. Holding per instruction; nothing pushed, deployed, or modified. Awaiting go.
