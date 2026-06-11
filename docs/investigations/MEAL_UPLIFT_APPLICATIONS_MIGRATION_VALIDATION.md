# MEAL_UPLIFT_APPLICATIONS — Migration Validation Report

**Date:** 2026-06-11  
**Status:** INVESTIGATION COMPLETE — NO CHANGES APPLIED  
**Classification:** RED — Database/Schema Investigation  
**Rollback tag:** `pre-uplift-migration-investigation-2026-06-11` (commit `80c5b75`)

---

## ROLLBACK POINT

Created before any work began:

```
git tag pre-uplift-migration-investigation-2026-06-11 HEAD
```

To restore working tree to this point:

```
git checkout pre-uplift-migration-investigation-2026-06-11
```

Git status at tagging: 6 tracked files modified, many untracked investigation docs. No database changes were made during this investigation.

---

## EXECUTIVE SUMMARY

**FACT:** The table `meal_uplift_applications` exists in `shared/schema.ts` but has never been migrated into the database — in either development or production.

**FACT:** Both endpoints that use this table (`POST /api/uplift/accept` and `GET /api/meals/:mealId/uplift-applications`) will 500 on any authenticated call that reaches the database layer.

**FACT:** A third endpoint (`DELETE /api/uplift/applications/:id`) is also affected.

**FACT:** No data has ever been written to this table. No backfill is required.

---

## SECTION 1 — EXACT TABLE DEFINITION

**File:** `shared/schema.ts` lines 1385–1421

```typescript
export const mealUpliftApplications = pgTable("meal_uplift_applications", {
  id: serial("id").primaryKey(),
  mealId: integer("meal_id").notNull().references(() => meals.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ruleId: text("rule_id").notNull(),
  ruleName: text("rule_name").notNull(),
  ingredient: text("ingredient").notNull(),
  action: text("action").notNull(),       // 'add' | 'swap' | 'boost'
  quantity: text("quantity"),
  explanation: text("explanation").notNull(),
  addedBy: text("added_by").notNull().default("tha_uplift"),
  plannerEntryId: integer("planner_entry_id"),
  forkedFromMealId: integer("forked_from_meal_id"),
  status: text("status").notNull().default("accepted"),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }).notNull().defaultNow(),
  removedAt: timestamp("removed_at", { withTimezone: true }),
});
```

**Columns (15 total):**

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | SERIAL | NOT NULL | — | Primary key |
| meal_id | INTEGER | NOT NULL | — | FK → meals.id ON DELETE CASCADE |
| user_id | INTEGER | NOT NULL | — | FK → users.id ON DELETE CASCADE |
| rule_id | TEXT | NOT NULL | — | Uplift rule identifier |
| rule_name | TEXT | NOT NULL | — | Human-readable rule name |
| ingredient | TEXT | NOT NULL | — | Ingredient added |
| action | TEXT | NOT NULL | — | 'add' \| 'swap' \| 'boost' |
| quantity | TEXT | NULL | — | Optional quantity string |
| explanation | TEXT | NOT NULL | — | User-facing explanation |
| added_by | TEXT | NOT NULL | 'tha_uplift' | Origin marker |
| planner_entry_id | INTEGER | NULL | — | Optional planner context |
| forked_from_meal_id | INTEGER | NULL | — | Set when system meal was forked |
| status | TEXT | NOT NULL | 'accepted' | 'accepted' \| 'removed' \| 'duplicate_skipped' |
| accepted_at | TIMESTAMPTZ | NOT NULL | NOW() | Accept timestamp |
| removed_at | TIMESTAMPTZ | NULL | — | Set when status → 'removed' |

**Foreign keys:**
- `meal_id` → `meals.id` ON DELETE CASCADE
- `user_id` → `users.id` ON DELETE CASCADE

**No explicit indexes** defined in schema.ts beyond the primary key. The ORM handles FK lookups. Query patterns in storage.ts filter on `meal_id` + `status` and look up by `id`, making indexes on `meal_id` and `user_id` advisable additions in the migration.

---

## SECTION 2 — MIGRATION AUDIT

### Migration system

This project uses a **custom migration runner** at `server/migrations/runner.ts`. It is NOT the drizzle `db push` or drizzle migration system. Key behaviour:

- Migrations are defined as a `MIGRATIONS` array of `{ id: string, statements: string[] }` objects
- At app startup, `runMigrations()` runs any entries whose `id` does not yet appear in the `schema_migrations` table
- Each migration runs inside a `BEGIN/COMMIT` transaction; failures roll back and rethrow

### Drizzle migration files (`migrations/`)

There is exactly one file: `migrations/0000_conscious_nuke.sql`.

```
grep result: "meal_uplift_applications" → NOT FOUND
```

The drizzle snapshot `migrations/meta/0000_snapshot.json` was generated in February 2026. It does not contain `public.meal_uplift_applications`. The schema table was added to `shared/schema.ts` after that snapshot was taken, and no new drizzle migration was generated.

**The drizzle migration system is not the active migration path.** Tables added since the initial snapshot are all managed through `server/migrations/runner.ts`.

### Custom runner audit

```
grep result in server/migrations/runner.ts: "meal_uplift_applications" → NOT FOUND
```

The `MIGRATIONS` array ends at:

```javascript
{ id: "2026-05-23_add_pantry_need_quantity", ... }
// ← Add new migrations here, appended to the end
```

There is no entry for `meal_uplift_applications` anywhere in the runner.

### schema_migrations table (live database)

```sql
SELECT * FROM schema_migrations WHERE id LIKE '%uplift%';
-- Returns: 0 rows
```

**Conclusion:** No migration for `meal_uplift_applications` was ever created or applied. The gap between schema definition and migration entry is complete — not partial.

---

## SECTION 3 — DEV DATABASE VALIDATION

### Table existence

```sql
\dt meal_uplift_applications
-- Result: "Did not find any relation named meal_uplift_applications"

SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'meal_uplift_applications';
-- Returns: 0 rows
```

### Direct query attempt

```sql
SELECT * FROM meal_uplift_applications LIMIT 1;
-- ERROR:  relation "meal_uplift_applications" does not exist
-- LINE 1: SELECT * FROM meal_uplift_applications LIMIT 1;
--                       ^
```

**Row count:** N/A — table does not exist.

### All 60 tables currently in the dev database

```
activity_summary, additives, admin_audit_log, barcode_lookup_events,
basket_items, diets, food_diary_days, food_diary_entries, food_diary_metrics,
food_knowledge, freezer_meals, grocery_products, household_eaters,
household_members, households, ingredient_classifications, ingredient_products,
ingredient_sources, ingredient_swaps, meal_allergens, meal_categories,
meal_diets, meal_items, meal_pairings, meal_plan_entries,
meal_plan_template_items, meal_plan_templates, meal_plans,
meal_template_products, meal_templates, meals, normalized_ingredients,
nutrition, pantry_ingredient_knowledge, planner_days, planner_entries,
planner_entry_eaters, planner_week_eater_overrides, planner_weeks,
product_additives, product_events, product_history, product_matches,
recipe_source_audit_log, recipe_source_settings, savings_events,
schema_migrations, session, shopping_fulfilment_memory, shopping_list,
shopping_list_extras, site_settings, supermarket_links, user_health_trends,
user_item_usage, user_pantry_items, user_preferences, user_streaks,
users, week_provisioning_items
```

`meal_uplift_applications` is absent. Confirmed.

---

## SECTION 4 — PRODUCTION IMPACT ASSESSMENT

**Confidence: HIGH (≥95%)**

**Evidence source:** The migration system itself.

The custom runner (`server/migrations/runner.ts`) is the sole mechanism by which new tables reach the database. It runs at app startup in all environments. Since no entry for `meal_uplift_applications` exists in the MIGRATIONS array, and `schema_migrations` shows no uplift entry in dev, production will be in an identical state.

The most recently applied migration in dev is `2026-05-23_add_pantry_need_quantity`. If production is deployed from the same codebase, production's `schema_migrations` table will also lack any uplift entry.

**No production database was accessed. No production changes were made.**

The 5% uncertainty accounts for the theoretical possibility that a manual SQL statement was run directly on production outside the migration system, which would not be reflected here.

---

## SECTION 5 — ENDPOINT VALIDATION

### Three affected endpoints

#### `POST /api/uplift/accept` (`server/routes.ts:9835`)

Call chain:
```
POST /api/uplift/accept
  → storage.createUpliftApplication(data)       [storage.ts:3554]
    → db.insert(mealUpliftApplications).values(data).returning()
      → SQL: INSERT INTO meal_uplift_applications (...) VALUES (...) RETURNING *
        → PostgreSQL: ERROR: relation "meal_uplift_applications" does not exist
      → Exception thrown to Node.js
    → Propagates up through async call stack
  → Caught at routes.ts:9931: catch (err)
    → console.error('[Uplift] Accept error:', err)
    → return res.status(500).json({ message: 'Failed to accept uplift' })
```

**Exact PostgreSQL error:**  
`ERROR: relation "meal_uplift_applications" does not exist`  
(confirmed via direct psql query in Section 3)

#### `GET /api/meals/:mealId/uplift-applications` (`server/routes.ts:10087`)

Call chain:
```
GET /api/meals/:mealId/uplift-applications
  → storage.getMealUpliftApplications(mealId)   [storage.ts:3559]
    → db.select().from(mealUpliftApplications).where(...)
      → SQL: SELECT * FROM meal_uplift_applications WHERE meal_id = ? AND status = 'accepted'
        → PostgreSQL: ERROR: relation "meal_uplift_applications" does not exist
      → Exception thrown
  → Caught at routes.ts:10100: catch (err)
    → console.error('[Uplift] Provenance error:', err)
    → return res.status(500).json({ message: 'Failed to fetch uplift applications' })
```

#### `DELETE /api/uplift/applications/:id` (`server/routes.ts:9941`)

Call chain:
```
DELETE /api/uplift/applications/:id
  → storage.getUpliftApplication(id)            [storage.ts:3571]
    → db.select().from(mealUpliftApplications).where(eq(mealUpliftApplications.id, id))
      → SQL: SELECT * FROM meal_uplift_applications WHERE id = ?
        → PostgreSQL: ERROR: relation "meal_uplift_applications" does not exist
      → Exception thrown
  → Caught at routes.ts:9973: catch (err)
    → console.error('[Uplift] Remove error:', err)
    → return res.status(500).json({ message: 'Failed to remove uplift' })
```

**All three endpoints fail at the first database call.** No partial writes occur. The `catch` blocks in all three routes correctly suppress the raw error from the client response.

---

## SECTION 6 — DATA USAGE AUDIT

### What is stored

`meal_uplift_applications` is a **provenance/audit log**. One row per accepted uplift suggestion. It records:
- Which meal was uplifted
- Which user accepted the suggestion
- Which uplift rule generated the suggestion (`rule_id`, `rule_name`)
- What ingredient was added (`ingredient`, `action`, `quantity`)
- The explanation shown to the user
- Whether the meal was forked from a system meal (`forked_from_meal_id`)
- Lifecycle: `accepted` → `removed`

### Dependency map

| Feature | Depends on meal_uplift_applications? | Status |
|---|---|---|
| Uplift suggestion generation (`GET /api/meals/:id/uplift`) | NO | Working |
| Uplift batch matching (`POST /api/uplift/match`) | NO | Working |
| Accepting uplift suggestions (`POST /api/uplift/accept`) | YES — INSERT | 500 |
| Viewing accepted uplifts (`GET /api/meals/:id/uplift-applications`) | YES — SELECT | 500 |
| Removing an accepted uplift (`DELETE /api/uplift/applications/:id`) | YES — SELECT + UPDATE | 500 |
| Ingredient dedup logic (`uplift-persistence.ts`) | NO — pure functions | Working |
| Meal forking on accept | NO — uses `meals` table | Would work if table existed |
| Shopping list | NO — reads `meals.ingredients` | Working |

**Nutrition Boost features that generate suggestions continue to work.** The failure is limited to the persistence layer for accepted suggestions.

### Existing data

**No data exists to migrate.** The table has never been created. There is no orphaned data in other tables that needs to be reconciled.

**Backfill required:** NO

---

## SECTION 7 — PROPOSED MIGRATION PLAN

**Status: PROPOSED ONLY. Not executed. Awaiting approval.**

### Migration name

```
2026-06-11_add_meal_uplift_applications
```

### Migration entry for `server/migrations/runner.ts`

To be appended to the `MIGRATIONS` array before the closing comment `// ← Add new migrations here`:

```javascript
{
  id: "2026-06-11_add_meal_uplift_applications",
  statements: [
    `CREATE TABLE IF NOT EXISTS meal_uplift_applications (
      id SERIAL PRIMARY KEY,
      meal_id INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rule_id TEXT NOT NULL,
      rule_name TEXT NOT NULL,
      ingredient TEXT NOT NULL,
      action TEXT NOT NULL,
      quantity TEXT,
      explanation TEXT NOT NULL,
      added_by TEXT NOT NULL DEFAULT 'tha_uplift',
      planner_entry_id INTEGER,
      forked_from_meal_id INTEGER,
      status TEXT NOT NULL DEFAULT 'accepted',
      accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      removed_at TIMESTAMP WITH TIME ZONE
    )`,
    `CREATE INDEX IF NOT EXISTS mua_meal_id_idx ON meal_uplift_applications (meal_id)`,
    `CREATE INDEX IF NOT EXISTS mua_user_id_idx ON meal_uplift_applications (user_id)`,
    `CREATE INDEX IF NOT EXISTS mua_meal_status_idx ON meal_uplift_applications (meal_id, status)`,
  ],
},
```

**Note on indexes:** The schema.ts definition does not define named indexes, but the query in `getMealUpliftApplications` filters on `(meal_id, status)` and the GET route will be called per-meal. A composite index on `(meal_id, status)` covers this. Indexes on `meal_id` and `user_id` individually support FK constraint checks.

### Expected schema outcome

After applying this migration:
- Table `meal_uplift_applications` exists with 15 columns
- 3 indexes created: `mua_meal_id_idx`, `mua_user_id_idx`, `mua_meal_status_idx`
- `schema_migrations` gains one row: `2026-06-11_add_meal_uplift_applications`
- Row count: 0 (new table, no data yet)

### Endpoints restored

- `POST /api/uplift/accept` → 201 on success
- `GET /api/meals/:mealId/uplift-applications` → 200 with `{ mealId, applications: [] }` initially
- `DELETE /api/uplift/applications/:id` → functional

---

## SECTION 8 — ROLLBACK PLAN

If migration is approved and applied, then a rollback is required:

### Steps

1. **Remove table** (no foreign keys point TO this table from other tables):
   ```sql
   DROP TABLE IF EXISTS meal_uplift_applications;
   ```

2. **Remove migration record:**
   ```sql
   DELETE FROM schema_migrations WHERE id = '2026-06-11_add_meal_uplift_applications';
   ```

3. **Remove migration entry** from `server/migrations/runner.ts` MIGRATIONS array.

4. **Restart app** — runner will see the entry is gone (code removed) and take no action.

### Affected tables on rollback

| Table | Change |
|---|---|
| `meal_uplift_applications` | DROPPED |
| `schema_migrations` | 1 row removed |

### Data loss on rollback

- Any uplift acceptance records written after migration would be lost
- Meal ingredient mutations (forks, ingredient additions) are written to `meals` table and are NOT rolled back — they persist independently
- Users would lose the audit trail of accepted suggestions, but meals would retain the added ingredients

### Affected endpoints on rollback

All three uplift persistence endpoints return to 500 state.

### Backfill required on rollback

NO.

---

## SECTION 9 — DATA IMPACT DECLARATION

| Category | Status |
|---|---|
| Reads existing data | NO — table does not exist |
| Writes existing data | NO |
| Changes meaning of existing data | NO |
| Requires backfill | NO |
| Schema changes | NOT YET APPLIED |
| Migration executed | NO |

---

## FACTS / ASSUMPTIONS / RECOMMENDATIONS

### FACTS (proven by evidence)

1. `meal_uplift_applications` is defined in `shared/schema.ts` at line 1389. (Read)
2. The table does not appear in `migrations/0000_conscious_nuke.sql`. (grep: no output)
3. The table does not appear in `server/migrations/runner.ts`. (grep: no output)
4. The table does not exist in the dev database. (`\dt` and `information_schema.tables` query: 0 rows)
5. Direct SQL query `SELECT * FROM meal_uplift_applications` returns `ERROR: relation "meal_uplift_applications" does not exist`.
6. `schema_migrations` contains no row matching `%uplift%`. (query: 0 rows)
7. `POST /api/uplift/accept` calls `storage.createUpliftApplication()` which calls `db.insert(mealUpliftApplications)`. (Read: routes.ts:9907, storage.ts:3555)
8. `GET /api/meals/:mealId/uplift-applications` calls `storage.getMealUpliftApplications()` which calls `db.select().from(mealUpliftApplications)`. (Read: routes.ts:10098, storage.ts:3560)
9. `DELETE /api/uplift/applications/:id` calls `storage.getUpliftApplication()` which calls `db.select().from(mealUpliftApplications)`. (Read: routes.ts:9948, storage.ts:3572)
10. Both errors are caught and converted to 500 responses.

### ASSUMPTIONS

1. Production database is in the same state as dev (no uplift migration exists). This is **very likely** (confidence ≥95%) but was not directly verified — production database was not accessed.

2. No manual SQL was run outside the migration system to create this table in production.

### RECOMMENDATIONS

**This is not a suggestion to act — it is a finding to be reviewed.**

The migration in Section 7 is a straightforward `CREATE TABLE IF NOT EXISTS` with no dependencies on other migrations, no data transformation, and no risk of data loss. It is idempotent due to `IF NOT EXISTS`.

Suggested sequence if approved:
1. Apply migration to **dev** first, verify endpoints return 200
2. Verify `schema_migrations` shows the new entry
3. Apply to **production** via standard deployment
4. Monitor server logs for `[Uplift]` prefix errors

---

## DEFINITION OF DONE — VERIFICATION

| Criterion | Status |
|---|---|
| Table existence proven | ✓ PROVEN — does not exist |
| Migration history audited | ✓ COMPLETE — no entry anywhere |
| Endpoint failure proven | ✓ PROVEN — PostgreSQL error confirmed |
| Production impact assessed | ✓ HIGH CONFIDENCE — same migration system |
| Migration plan prepared | ✓ COMPLETE — ready for approval |
| No schema changes applied | ✓ CONFIRMED |
| No database changes made | ✓ CONFIRMED |
