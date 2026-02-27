# Database Migrations

## Overview

Migrations are managed by a lightweight SQL runner at `server/migrations/runner.ts`.
It runs automatically every time the Express server starts, applying any pending
migrations in order and recording them in a `schema_migrations` tracking table.
Each migration runs inside a transaction so a failure is fully rolled back.

---

## How the runner works

1. On boot, `runMigrations()` is called from `server/index.ts`.
2. It creates the `schema_migrations` table if it doesn't already exist.
3. It compares the ordered `MIGRATIONS` array against the already-applied IDs
   in `schema_migrations`.
4. Any entry not yet in the table is applied sequentially, each statement in a
   single transaction. On success the ID is inserted into `schema_migrations`.
5. If a migration fails, the transaction is rolled back and the server logs the
   raw SQL so you can run it manually if needed.

---

## How to add a new migration

1. Open `server/migrations/runner.ts`.
2. Append a new object to the `MIGRATIONS` array at the bottom — **never remove
   or reorder existing entries**.
3. Pick a unique `id` in the format `YYYY-MM-DD_short_description`:
   ```
   "2026-03-15_add_user_goals_column"
   ```
4. Put all SQL in the `statements` array. Use idempotent SQL wherever possible:
   ```ts
   {
     id: "2026-03-15_add_user_goals_column",
     statements: [
       "ALTER TABLE users ADD COLUMN IF NOT EXISTS goal TEXT",
     ],
   }
   ```
5. Deploy / restart — the runner applies it once and won't touch it again.

---

## Running migrations locally (Replit)

Migrations run **automatically** when you start the dev server:

```
npm run dev
```

Look for these lines in the console:

```
[Migrations] schema_migrations table ready
[Migrations] 1 pending migration(s) to apply
[Migrations] Applying "2026-02-27_meal_plan_templates" …
[Migrations] ✓ Applied "2026-02-27_meal_plan_templates"
```

If you see `Up to date — no pending migrations`, everything is already applied.

**No manual step is ever needed under normal circumstances.**

---

## Running migrations on Render (production)

Migrations also run **automatically** on each deploy because Render starts the
Express server (`npm run start` → `node dist/index.js` or `tsx server/index.ts`),
which triggers `runMigrations()` before accepting requests.

To verify after a deploy:

1. Open your Render service → **Logs** tab.
2. Search for `[Migrations]` — you should see the applied or "up to date" message.

**If a migration fails due to a permission error**, the log prints the raw SQL:

```
[Migrations] ✗ PERMISSION DENIED on "2026-02-27_meal_plan_templates".
Your database user may lack ALTER TABLE privileges.
Run these statements manually on the production database:
  CREATE TABLE IF NOT EXISTS meal_plan_templates (...);
```

In that case, paste the printed SQL into the **Neon SQL Editor**
(Neon Console → your project → SQL Editor) and run it manually, then redeploy.

---

## Inspecting applied migrations

Run this in the Neon SQL Editor or any Postgres client connected to `DATABASE_URL`:

```sql
SELECT id, applied_at
FROM schema_migrations
ORDER BY applied_at;
```

---

## Current migrations

| ID | Description |
|----|-------------|
| `2026-02-27_add_user_diet_fields` | Adds `diet_pattern`, `diet_restrictions`, `eating_schedule` columns to `users` |
| `2026-02-27_backfill_user_diet_fields` | Backfills diet fields from `user_preferences` |
| `2026-02-27_password_reset_tokens` | Adds `password_reset_token` and `password_reset_expires` to `users` |
| `2026-02-27_meal_plan_templates` | Creates `meal_plan_templates` and `meal_plan_template_items` tables (see below) |
| `2026-02-27_add_meals_created_at` | Adds `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` to `meals` (enables stable ordering in the meal lookup endpoint) |

---

## Seed scripts

### family-plan seed (`script/seed-family-plan.ts`)

Populates the `meal_plan_templates` / `meal_plan_template_items` tables with the
default 6-week family dinner plan defined in `seed/family-plan.json`.

**The seed script is fully idempotent** — safe to run any number of times.
It resolves meals using a priority order:

1. `mealId` — direct primary key lookup (fastest, most reliable)
2. `sourceUrl` — looks up by `source_url` column; picks newest on collision and logs a warning
3. `title` — case-insensitive `name` match; picks newest on collision and logs a warning

Slots that cannot be resolved (none of the three keys match) are skipped with a
warning — the script never crashes on a missing meal.

#### Running locally (Replit)

From the Replit Shell tab:

```bash
npx tsx script/seed-family-plan.ts
```

Or, if you add this to `package.json` scripts first:

```json
"seed:family-plan": "tsx script/seed-family-plan.ts"
```

then:

```bash
npm run seed:family-plan
```

#### Running on Render (one-off)

1. Open your Render service dashboard.
2. Click the **Shell** tab (available on paid plans) or use a **one-off job**.
3. Run:

```bash
npx tsx script/seed-family-plan.ts
```

Alternatively, create a Render one-off job with the command above targeting the
same `DATABASE_URL` environment variable already set on the service.

You should see output like:

```
[FamilyPlanSeed] Loaded plan: "The Healthy Apples Family 6 week meal plan" (6 weeks)
[FamilyPlanSeed] Resolved 42 / 42 dinner slots (0 skipped)
[FamilyPlanSeed] Template upserted: "..." (isDefault=true)
[FamilyPlanSeed] Upserted 42 dinner items
[FamilyPlanSeed] ✓ Done
```

#### Updating the plan

Edit `seed/family-plan.json` and re-run the seed. The `upsertTemplateItemsBulk`
helper uses `ON CONFLICT DO UPDATE` on `(template_id, week_number, day_of_week, meal_slot)`,
so existing slots are updated in place and no duplicates are created.

---

## meal_plan_templates migration detail

### Tables created

**`meal_plan_templates`**

| Column | Type | Notes |
|--------|------|-------|
| `id` | `VARCHAR` (UUID) | `DEFAULT gen_random_uuid()` |
| `name` | `TEXT NOT NULL` | |
| `description` | `TEXT` | nullable |
| `is_default` | `BOOLEAN NOT NULL DEFAULT FALSE` | at most one row should be true |
| `is_premium` | `BOOLEAN NOT NULL DEFAULT FALSE` | |
| `created_at` | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` | |

**`meal_plan_template_items`**

| Column | Type | Notes |
|--------|------|-------|
| `id` | `VARCHAR` (UUID) | `DEFAULT gen_random_uuid()` |
| `template_id` | `VARCHAR NOT NULL` | FK → `meal_plan_templates(id) ON DELETE CASCADE` |
| `week_number` | `INTEGER NOT NULL` | CHECK: 1–6 |
| `day_of_week` | `INTEGER NOT NULL` | CHECK: 1–7 (Monday = 1) |
| `meal_slot` | `TEXT NOT NULL` | CHECK: `breakfast`, `lunch`, or `dinner` |
| `meal_id` | `INTEGER NOT NULL` | FK → `meals(id) ON DELETE RESTRICT` |
| `created_at` | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` | |

> **Note on `meal_id` type:** The spec called for `uuid`, but `meals.id` is a
> PostgreSQL `serial` (auto-increment integer). The FK must match the referenced
> column type, so `meal_id` is `INTEGER`. This is correct.

**Unique constraint:** `(template_id, week_number, day_of_week, meal_slot)` —
one meal per slot per day per week per template.

### DB helpers (in `server/storage.ts`)

| Method | Description |
|--------|-------------|
| `createOrUpdateTemplate(name, description, isDefault)` | Upserts by name; demotes any previous default when `isDefault=true` |
| `upsertTemplateItemsBulk(templateId, items[])` | Bulk insert/update items; ON CONFLICT updates `meal_id` |
| `getTemplateWithItems(id)` | Returns template + all items ordered by week/day/slot |
| `getDefaultTemplate()` | Returns the `is_default=true` template with items, or `undefined` |
| `listTemplates()` | Returns all templates ordered by name (no items) |
