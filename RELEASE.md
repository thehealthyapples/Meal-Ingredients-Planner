# Release Process (THA)

## Overview

- Development happens in Replit
- Code is pushed to GitHub via `./deploy.sh`
- Production deploys from GitHub → Render (auto-deploy on push to `main`)
- Production database is Neon (separate from dev)
- NEVER assume dev DB = prod DB

---

## Release Checklist

Use this every release. Do not skip steps.

### Step 1 — Git clean

```bash
git status          # must be clean or intentionally dirty
npm run build       # confirms it compiles
```

### Step 2 — Push code

```bash
./deploy.sh "release: short description"
```

Check Render dashboard → your service → Logs for deployment completion.

### Step 3 — Schema migrations (auto)

Migrations run automatically at server startup via `server/migrations/runner.ts`.

After deploy, open Render Logs and confirm:

```
[Migrations] Schema at head: 2026-04-19_backfill_shopping_list_null_resolution_state
```

If you see `Schema head mismatch` or a migration failure, paste the printed SQL into the Neon SQL Editor and run it manually, then redeploy.

### Step 4 — Data reconciliation / backfill

After every deploy that adds new runtime-critical fields, run the item resolution backfill against prod:

**Dry run first (preview only):**
```bash
DATABASE_URL="<prod neon url>" npx tsx server/scripts/backfill-item-resolution.ts --dry-run
```

**Apply if output looks correct:**
```bash
DATABASE_URL="<prod neon url>" npx tsx server/scripts/backfill-item-resolution.ts
```

This resolves `shopping_list` rows still in `resolution_state = 'raw'`. It is idempotent and safe to re-run.

> Skip this step if you made no changes to the shopping list add/import paths
> and no new items have been added since last run.

### Step 5 — Verify live paths

Check these exact paths are working in the deployed prod app:

| Path | What to check |
|------|---------------|
| Planner | Week selector shows 6 weeks. Click a day, add a meal. No 500 error. |
| Shopping list | Add an item manually. Add from planner. Both appear on the list. |
| Shopping list — chooser | Add an ambiguous item (e.g. "berries"). Review prompt appears. Select a variant. Item resolves. |
| Pantry | Open pantry. Default items are present. No 500 errors. |
| Pantry knowledge | Click any pantry ingredient. Knowledge card loads (may show "enriching..." on first load). |

---

## Production Data Rules

- NEVER wipe prod data
- NEVER run `DROP TABLE`, `TRUNCATE`, or `DELETE` without a `WHERE` clause
- All migrations must use `IF NOT EXISTS` / `IF EXISTS` — idempotent SQL only
- All backfills must be read-safe (`SELECT` first, then targeted `UPDATE`)
- Migrations run inside transactions — a failure rolls back fully
- If a migration fails with PERMISSION DENIED, the runner prints the raw SQL: paste it into the Neon SQL Editor and run it manually

---

## What auto-runs on deploy

| Step | Where | When |
|------|-------|------|
| Schema migrations | `server/migrations/runner.ts` | Every server start |
| Template migration | `server/template-migration.ts` | Every server start |
| Seed ready meals | `server/lib/seed-ready-meals.ts` | Every server start (idempotent) |
| Seed food knowledge | `server/lib/seed-food-knowledge.ts` | Every server start (idempotent) |
| Sync pantry defaults | `storage.syncAllPantryDefaults()` | Every server start (background, idempotent) |

**What does NOT auto-run:**
- `server/scripts/backfill-item-resolution.ts` — must be run manually per release

---

## Known prod-specific failure modes

| Symptom | Root cause | Fix |
|---------|-----------|-----|
| Planner week selector empty / 500 | `planner_weeks.household_id IS NULL` | Migration `2026-04-19_backfill_planner_weeks_household_id_final` auto-fixes on next deploy |
| Shopping list grouped terms fail chooser | Old items in `raw` state with `needsReview=false` | Run item resolution backfill (Step 4) |
| Pantry knowledge card shows nothing | Table newly created, no data yet | First access triggers async enrichment. Returns `null` then enriches in background. Normal. |
| `getHouseholdForUser` throws | User has no active household_members row | Investigate: check `household_members` for that user_id; may need manual INSERT |

---

## Inspecting prod migration state

Run in Neon SQL Editor:

```sql
SELECT id, applied_at FROM schema_migrations ORDER BY applied_at;
```

Expected head (as of 2026-04-19):
```
2026-04-19_backfill_shopping_list_null_resolution_state
```

---

## Neon / Render quick links

- Neon Console: your project → SQL Editor
- Render: service → Logs tab (search `[Migrations]`)
- One-off commands on Render: service → Shell tab (paid) or one-off job
