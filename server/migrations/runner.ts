/**
 * Migration Runner
 * ================
 * Applies ordered SQL migrations at server startup and tracks them in
 * the `schema_migrations` table so each migration runs exactly once.
 *
 * HOW TO ADD A NEW MIGRATION
 * ---------------------------
 * 1. Add a new entry to the MIGRATIONS array below (append to the END).
 * 2. Choose a unique id in the format:  YYYY-MM-DD_short_description
 *    Example: "2026-03-15_add_user_goals_column"
 * 3. Put all SQL for that migration in the `statements` array.
 *    Each string is executed as a separate statement inside a transaction.
 * 4. Use safe, idempotent SQL — prefer IF NOT EXISTS / IF EXISTS so the
 *    migration can be re-run safely if the transaction was partially applied.
 * 5. Commit and deploy — the runner applies it once and records it.
 * ---------------------------
 */

import { pool } from "../db";

interface Migration {
  id: string;
  statements: string[];
}

// ─── ORDERED MIGRATION LIST ──────────────────────────────────────────────────
// IMPORTANT: Never remove or reorder entries. Only append new ones at the end.
// ─────────────────────────────────────────────────────────────────────────────
const MIGRATIONS: Migration[] = [
  {
    id: "2026-02-27_add_user_diet_fields",
    statements: [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS diet_pattern TEXT",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS diet_restrictions TEXT[]",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS eating_schedule TEXT",
    ],
  },

  {
    id: "2026-02-27_backfill_user_diet_fields",
    statements: [
      `UPDATE users u
       SET
         diet_pattern = CASE
           WHEN up.diet_types && ARRAY['vegan']                THEN 'Vegan'
           WHEN up.diet_types && ARRAY['vegetarian']           THEN 'Vegetarian'
           WHEN up.diet_types && ARRAY['mediterranean']        THEN 'Mediterranean'
           WHEN up.diet_types && ARRAY['dash']                 THEN 'DASH'
           WHEN up.diet_types && ARRAY['mind']                 THEN 'MIND'
           WHEN up.diet_types && ARRAY['flexitarian']          THEN 'Flexitarian'
           WHEN up.diet_types && ARRAY['keto']                 THEN 'Keto'
           WHEN up.diet_types && ARRAY['paleo']                THEN 'Paleo'
           WHEN up.diet_types && ARRAY['low-carb', 'atkins']  THEN 'Low-Carb'
           WHEN up.diet_types && ARRAY['carnivore']            THEN 'Carnivore'
           ELSE NULL
         END,
         diet_restrictions = ARRAY_REMOVE(
           ARRAY[
             CASE WHEN up.diet_types && ARRAY['gluten-free'] THEN 'Gluten-Free'::TEXT END,
             CASE WHEN up.diet_types && ARRAY['dairy-free']  THEN 'Dairy-Free'::TEXT END
           ],
           NULL
         )
       FROM user_preferences up
       WHERE up.user_id = u.id`,
    ],
  },

  {
    id: "2026-02-27_password_reset_tokens",
    statements: [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token TEXT",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ",
    ],
  },

  {
    id: "2026-02-27_meal_plan_templates",
    statements: [
      `CREATE TABLE IF NOT EXISTS meal_plan_templates (
         id          VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
         name        TEXT NOT NULL,
         description TEXT,
         is_default  BOOLEAN NOT NULL DEFAULT FALSE,
         is_premium  BOOLEAN NOT NULL DEFAULT FALSE,
         created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`,
      `CREATE TABLE IF NOT EXISTS meal_plan_template_items (
         id           VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
         template_id  VARCHAR NOT NULL REFERENCES meal_plan_templates(id) ON DELETE CASCADE,
         week_number  INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 6),
         day_of_week  INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
         meal_slot    TEXT NOT NULL CHECK (meal_slot IN ('breakfast','lunch','dinner')),
         meal_id      INTEGER NOT NULL REFERENCES meals(id) ON DELETE RESTRICT,
         created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         UNIQUE (template_id, week_number, day_of_week, meal_slot)
       )`,
    ],
  },

  {
    id: "2026-02-27_add_meals_created_at",
    statements: [
      "ALTER TABLE meals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
    ],
  },

  {
    id: "2026-02-28_add_roles_and_subscriptions",
    statements: [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free'",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
      "ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check",
      "ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user','admin'))",
      "ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_tier_check",
      "ALTER TABLE users ADD CONSTRAINT users_subscription_tier_check CHECK (subscription_tier IN ('free','premium','friends_family'))",
    ],
  },

  {
    id: "2026-03-01_seed_admin_users",
    statements: [
      "UPDATE users SET role = 'admin' WHERE username IN ('colinclapson@hotmail.co.uk', 'lindsayclapson@outlook.com')",
    ],
  },

  {
    id: "2026-03-01_create_admin_audit_log",
    statements: [
      `CREATE TABLE IF NOT EXISTS admin_audit_log (
         id              SERIAL PRIMARY KEY,
         admin_user_id   INTEGER NOT NULL REFERENCES users(id),
         action          TEXT NOT NULL,
         target_user_id  INTEGER REFERENCES users(id),
         metadata        JSONB,
         created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`,
    ],
  },

  {
    id: "2026-03-01_extend_meal_plan_templates",
    statements: [
      "ALTER TABLE meal_plan_templates ADD COLUMN IF NOT EXISTS owner_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE",
      "ALTER TABLE meal_plan_templates ADD COLUMN IF NOT EXISTS season TEXT",
      "ALTER TABLE meal_plan_templates ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'",
      "ALTER TABLE meal_plan_templates ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id)",
      "ALTER TABLE meal_plan_templates ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ",
      "CREATE INDEX IF NOT EXISTS meal_plan_templates_owner_idx ON meal_plan_templates (owner_user_id)",
      "CREATE INDEX IF NOT EXISTS meal_plan_templates_status_idx ON meal_plan_templates (status)",
    ],
  },

  {
    id: "2026-03-01_add_template_sharing",
    statements: [
      "ALTER TABLE meal_plan_templates ADD COLUMN IF NOT EXISTS share_token TEXT",
      "ALTER TABLE meal_plan_templates ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private'",
      "CREATE UNIQUE INDEX IF NOT EXISTS meal_plan_templates_share_token_idx ON meal_plan_templates (share_token) WHERE share_token IS NOT NULL",
      "ALTER TABLE meal_plan_templates DROP CONSTRAINT IF EXISTS meal_plan_templates_visibility_check",
      "ALTER TABLE meal_plan_templates ADD CONSTRAINT meal_plan_templates_visibility_check CHECK (visibility IN ('private','shared'))",
    ],
  },

  {
    id: "2026-03-01_add_planner_entry_position",
    statements: [
      "ALTER TABLE planner_entries ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0",
    ],
  },

  {
    id: "2026-03-01_add_meals_kind",
    statements: [
      "ALTER TABLE meals ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'meal'",
    ],
  },

  {
    id: "2026-03-01_user_pantry_items",
    statements: [
      `CREATE TABLE IF NOT EXISTS user_pantry_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ingredient_key TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'larder' CHECK (category IN ('larder','fridge','freezer')),
        default_have BOOLEAN NOT NULL DEFAULT TRUE,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, ingredient_key)
      )`,
      "CREATE INDEX IF NOT EXISTS user_pantry_items_user_id_idx ON user_pantry_items(user_id)",
    ],
  },

  {
    id: "2026-03-01_meal_pairings",
    statements: [
      `CREATE TABLE IF NOT EXISTS meal_pairings (
        id SERIAL PRIMARY KEY,
        base_meal_id INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
        suggested_meal_id INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
        note TEXT,
        priority INTEGER NOT NULL DEFAULT 0,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(base_meal_id, suggested_meal_id)
      )`,
      "CREATE INDEX IF NOT EXISTS meal_pairings_base_meal_idx ON meal_pairings(base_meal_id, priority DESC)",
    ],
  },

  {
    id: "2026-03-01_ingredient_products",
    statements: [
      `CREATE TABLE IF NOT EXISTS ingredient_products (
        id SERIAL PRIMARY KEY,
        ingredient_key TEXT NOT NULL,
        product_name TEXT NOT NULL,
        retailer TEXT NOT NULL,
        size TEXT,
        notes TEXT,
        tags JSONB,
        priority INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_by INT REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,
      "CREATE INDEX IF NOT EXISTS idx_ingredient_products_key ON ingredient_products(ingredient_key)",
      "CREATE INDEX IF NOT EXISTS idx_ingredient_products_active ON ingredient_products(is_active)",
      "CREATE UNIQUE INDEX IF NOT EXISTS uniq_ingredient_products_key_name_retailer ON ingredient_products(ingredient_key, product_name, retailer)",
    ],
  },

  {
    id: "2026-03-04_recipe_source_settings",
    statements: [
      `CREATE TABLE IF NOT EXISTS recipe_source_settings (
        id SERIAL PRIMARY KEY,
        source_key TEXT NOT NULL UNIQUE,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        source_type TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        admin_updated_at TIMESTAMPTZ
      )`,
      `CREATE TABLE IF NOT EXISTS recipe_source_audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action TEXT NOT NULL,
        source_name TEXT NOT NULL,
        url_or_query TEXT,
        reason TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    ],
  },

  {
    id: "2026-03-04_households",
    statements: [
      `CREATE TABLE IF NOT EXISTS households (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        invite_code TEXT NOT NULL UNIQUE,
        created_by_user_id INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS household_members (
        id SERIAL PRIMARY KEY,
        household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'member',
        status TEXT NOT NULL DEFAULT 'active',
        joined_at TIMESTAMPTZ,
        invited_by_user_id INTEGER,
        left_at TIMESTAMPTZ,
        CONSTRAINT household_members_household_user_unique UNIQUE (household_id, user_id)
      )`,
    ],
  },

  {
    id: "2026-03-04_household_id_columns",
    statements: [
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS household_id INTEGER",
      "ALTER TABLE planner_weeks ADD COLUMN IF NOT EXISTS household_id INTEGER",
      "ALTER TABLE freezer_meals ADD COLUMN IF NOT EXISTS household_id INTEGER",
      "ALTER TABLE user_pantry_items ADD COLUMN IF NOT EXISTS household_id INTEGER",
      "ALTER TABLE shopping_list_extras ADD COLUMN IF NOT EXISTS household_id INTEGER",
    ],
  },

  {
    id: "2026-03-04_backfill_households",
    statements: [
      `INSERT INTO households (name, invite_code, created_by_user_id, created_at, updated_at)
       SELECT
         username || '''s Household',
         upper(substr(md5(random()::text), 1, 8)),
         id,
         NOW(),
         NOW()
       FROM users
       WHERE id NOT IN (
         SELECT created_by_user_id FROM households WHERE created_by_user_id IS NOT NULL
       )
       ON CONFLICT DO NOTHING`,
      `INSERT INTO household_members (household_id, user_id, role, status, joined_at)
       SELECT h.id, u.id, 'owner', 'active', NOW()
       FROM users u
       JOIN households h ON h.created_by_user_id = u.id
       ON CONFLICT ON CONSTRAINT household_members_household_user_unique DO NOTHING`,
      `UPDATE shopping_list sl
       SET household_id = h.id
       FROM households h
       WHERE h.created_by_user_id = sl.user_id AND sl.household_id IS NULL`,
      `UPDATE planner_weeks pw
       SET household_id = h.id
       FROM households h
       WHERE h.created_by_user_id = pw.user_id AND pw.household_id IS NULL`,
      `UPDATE freezer_meals fm
       SET household_id = h.id
       FROM households h
       WHERE h.created_by_user_id = fm.user_id AND fm.household_id IS NULL`,
      `UPDATE user_pantry_items upi
       SET household_id = h.id
       FROM households h
       WHERE h.created_by_user_id = upi.user_id AND upi.household_id IS NULL`,
      `UPDATE shopping_list_extras sle
       SET household_id = h.id
       FROM households h
       WHERE h.created_by_user_id = sle.user_id AND sle.household_id IS NULL`,
    ],
  },

  {
    id: "2026-03-08_basket_attribution_columns",
    statements: [
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS added_by_user_id INTEGER",
      "ALTER TABLE ingredient_sources ADD COLUMN IF NOT EXISTS week_number INTEGER",
      "ALTER TABLE ingredient_sources ADD COLUMN IF NOT EXISTS day_of_week INTEGER",
      "ALTER TABLE ingredient_sources ADD COLUMN IF NOT EXISTS meal_slot TEXT",
    ],
  },

  {
    id: "2026-03-08_food_diary_tables",
    statements: [
      `CREATE TABLE IF NOT EXISTS food_diary_days (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT food_diary_days_user_date_unique UNIQUE (user_id, date)
      )`,
      `CREATE TABLE IF NOT EXISTS food_diary_entries (
        id SERIAL PRIMARY KEY,
        day_id INTEGER NOT NULL REFERENCES food_diary_days(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        meal_slot TEXT NOT NULL,
        name TEXT NOT NULL,
        notes TEXT,
        source_type TEXT NOT NULL DEFAULT 'manual',
        source_planner_entry_id INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS food_diary_metrics (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        weight_kg REAL,
        bmi REAL,
        mood_apples INTEGER,
        sleep_hours REAL,
        energy_apples INTEGER,
        notes TEXT,
        stuck_to_plan BOOLEAN,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT food_diary_metrics_user_date_unique UNIQUE (user_id, date)
      )`,
    ],
  },

  {
    id: "2026-03-12_add_always_add_to_extras",
    statements: [
      "ALTER TABLE shopping_list_extras ADD COLUMN IF NOT EXISTS always_add boolean NOT NULL DEFAULT false",
    ],
  },

  {
    id: "2026-03-12_add_in_basket_to_extras",
    statements: [
      "ALTER TABLE shopping_list_extras ADD COLUMN IF NOT EXISTS in_basket boolean NOT NULL DEFAULT false",
      "ALTER TABLE shopping_list_extras ALTER COLUMN in_basket SET DEFAULT true",
    ],
  },

  {
    id: "2026-03-13_pantry_columns_fix",
    statements: [
      // Add columns that were added to the Drizzle schema without a migration
      "ALTER TABLE user_pantry_items ADD COLUMN IF NOT EXISTS display_name TEXT",
      "ALTER TABLE user_pantry_items ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE",
      "ALTER TABLE user_pantry_items ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE",
      "ALTER TABLE user_pantry_items ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0",
      // Backfill display_name from ingredient_key for any pre-existing rows
      "UPDATE user_pantry_items SET display_name = ingredient_key WHERE display_name IS NULL",
      // Widen the category CHECK to include 'household' and 'fruit'.
      // 'fruit' rows were seeded before this migration ran (the original inline
      // constraint was dropped by a drizzle-kit push), so we must include it here
      // or the ADD CONSTRAINT fails on existing rows.  A later migration
      // (2026-04-02_add_fruit_pantry_category) already adds 'fruit' to the same
      // list, so including it now is safe and makes that migration a clean no-op.
      "ALTER TABLE user_pantry_items DROP CONSTRAINT IF EXISTS user_pantry_items_category_check",
      "ALTER TABLE user_pantry_items ADD CONSTRAINT user_pantry_items_category_check CHECK (category IN ('larder','fridge','freezer','household','fruit'))",
    ],
  },

  {
    id: "2026-03-13_fix_pantry_null_household_id",
    statements: [
      // Patch any pantry rows that were inserted without a household_id.
      // This backfills the correct household by joining to the user's active
      // household membership. Safe: only touches rows where household_id IS NULL.
      `UPDATE user_pantry_items upi
       SET household_id = hm.household_id
       FROM household_members hm
       WHERE hm.user_id = upi.user_id
         AND hm.status = 'active'
         AND upi.household_id IS NULL`,
    ],
  },

  {
    id: "2026-03-13_shopping_list_columns_fix",
    statements: [
      // These columns were added to the Drizzle schema incrementally without migrations.
      // All use IF NOT EXISTS so they are safe to run even if a column already exists.
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS needs_review BOOLEAN NOT NULL DEFAULT FALSE",
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS validation_note TEXT",
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS selected_store TEXT",
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS item_type TEXT",
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS variant_selections TEXT",
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS attribute_preferences TEXT",
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS confidence_level TEXT",
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS confidence_reason TEXT",
    ],
  },

  {
    id: "2026-03-13_backfill_missing_households",
    statements: [
      // Some users created after the original backfill (2026-03-04) have no household.
      // This migration is idempotent and safe to run any number of times.

      // Step 1: Create a household for any user who still has none
      `INSERT INTO households (name, invite_code, created_by_user_id, created_at, updated_at)
       SELECT
         username || '''s Household',
         upper(substr(md5(random()::text), 1, 8)),
         id,
         NOW(),
         NOW()
       FROM users
       WHERE id NOT IN (
         SELECT created_by_user_id FROM households WHERE created_by_user_id IS NOT NULL
       )
       ON CONFLICT DO NOTHING`,

      // Step 2: Insert an owner membership for those users
      `INSERT INTO household_members (household_id, user_id, role, status, joined_at)
       SELECT h.id, u.id, 'owner', 'active', NOW()
       FROM users u
       JOIN households h ON h.created_by_user_id = u.id
       ON CONFLICT ON CONSTRAINT household_members_household_user_unique DO NOTHING`,

      // Step 3: Backfill household_id on planner_weeks rows that are still NULL
      `UPDATE planner_weeks pw
       SET household_id = hm.household_id
       FROM household_members hm
       WHERE hm.user_id = pw.user_id
         AND hm.status = 'active'
         AND pw.household_id IS NULL`,
    ],
  },

  {
    id: "2026-03-13_add_demo_user_fields",
    statements: [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMPTZ",
    ],
  },

  {
    id: "2026-03-13_add_demo_claimed_email",
    statements: [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS demo_claimed_email TEXT",
    ],
  },

  {
    id: "2026-03-14_add_first_name",
    statements: [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT",
    ],
  },

  {
    id: "2026-03-14_create_food_knowledge",
    statements: [
      `CREATE TABLE IF NOT EXISTS food_knowledge (
        id                    SERIAL PRIMARY KEY,
        slug                  TEXT NOT NULL UNIQUE,
        type                  TEXT NOT NULL,
        title                 TEXT NOT NULL,
        short_summary         TEXT,
        why_tha_highlights_this TEXT,
        what_to_know          TEXT,
        who_it_matters_to     TEXT,
        simpler_alternatives  TEXT,
        tags                  TEXT[],
        source                TEXT,
        is_active             BOOLEAN NOT NULL DEFAULT TRUE
      )`,
    ],
  },

  {
    id: "2026-03-15_extend_meal_templates",
    statements: [
      `ALTER TABLE meal_templates
        ADD COLUMN IF NOT EXISTS title TEXT,
        ADD COLUMN IF NOT EXISTS cuisine TEXT,
        ADD COLUMN IF NOT EXISTS shared_base_components TEXT[],
        ADD COLUMN IF NOT EXISTS protein_slots TEXT[],
        ADD COLUMN IF NOT EXISTS carb_slots TEXT[],
        ADD COLUMN IF NOT EXISTS veg_slots TEXT[],
        ADD COLUMN IF NOT EXISTS topping_slots TEXT[],
        ADD COLUMN IF NOT EXISTS sauce_slots TEXT[],
        ADD COLUMN IF NOT EXISTS compatible_diets TEXT[],
        ADD COLUMN IF NOT EXISTS estimated_total_time INTEGER,
        ADD COLUMN IF NOT EXISTS estimated_extra_time_per_variant INTEGER,
        ADD COLUMN IF NOT EXISTS cost_band TEXT,
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE`,
    ],
  },

  {
    id: "2026-03-15_meals_meal_template_fk",
    statements: [
      `ALTER TABLE meals
        ADD CONSTRAINT meals_meal_template_id_fkey
        FOREIGN KEY (meal_template_id)
        REFERENCES meal_templates(id)
        ON DELETE SET NULL`,
    ],
  },

  {
    id: "2026-03-15_user_preferences_meal_matching",
    statements: [
      `ALTER TABLE user_preferences
        ADD COLUMN IF NOT EXISTS preferred_ingredients TEXT[] NOT NULL DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS max_prep_tolerance INTEGER`,
    ],
  },

  {
    id: "2026-03-15_household_meal_mode_settings",
    statements: [
      `ALTER TABLE user_preferences
        ADD COLUMN IF NOT EXISTS meal_mode TEXT NOT NULL DEFAULT 'exact',
        ADD COLUMN IF NOT EXISTS max_extra_prep_minutes INTEGER,
        ADD COLUMN IF NOT EXISTS max_total_cook_time INTEGER,
        ADD COLUMN IF NOT EXISTS prefer_less_processed BOOLEAN NOT NULL DEFAULT FALSE`,
    ],
  },

  {
    id: "2026-03-15_shopping_list_basket_label",
    statements: [
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS basket_label TEXT",
    ],
  },

  {
    id: "2026-03-20_add_user_login_tracking",
    statements: [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ",
    ],
  },

  {
    id: "2026-03-20_add_site_settings",
    statements: [
      `CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `INSERT INTO site_settings (key, value)
       VALUES ('banner', '{"enabled":false,"text":""}')
       ON CONFLICT (key) DO NOTHING`,
    ],
  },

  {
    id: "2026-03-30_add_include_regulatory_additives_in_scoring",
    statements: [
      `ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS include_regulatory_additives_in_scoring BOOLEAN NOT NULL DEFAULT TRUE`,
    ],
  },

  {
    id: "2026-04-02_add_barcode_lookup_events",
    statements: [
      `CREATE TABLE IF NOT EXISTS barcode_lookup_events (
        id              SERIAL PRIMARY KEY,
        user_id         INTEGER,
        barcode         TEXT NOT NULL,
        lookup_source   TEXT NOT NULL DEFAULT 'off',
        status          TEXT NOT NULL,
        http_status     INTEGER NOT NULL,
        off_product_code  TEXT,
        off_product_name  TEXT,
        failure_reason  TEXT,
        request_url     TEXT,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_barcode_lookup_events_barcode ON barcode_lookup_events (barcode)`,
      `CREATE INDEX IF NOT EXISTS idx_barcode_lookup_events_user_id ON barcode_lookup_events (user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_barcode_lookup_events_status ON barcode_lookup_events (status)`,
    ],
  },

  {
    id: "2026-04-02_add_additives_aliases",
    statements: [
      "ALTER TABLE additives ADD COLUMN IF NOT EXISTS aliases TEXT[]",
    ],
  },

  {
    id: "2026-04-02_add_fruit_pantry_category",
    statements: [
      "ALTER TABLE user_pantry_items DROP CONSTRAINT IF EXISTS user_pantry_items_category_check",
      "ALTER TABLE user_pantry_items ADD CONSTRAINT user_pantry_items_category_check CHECK (category IN ('larder','fridge','freezer','household','fruit'))",
    ],
  },

  {
    id: "2026-04-02_meal_items_and_usage",
    statements: [
      `CREATE TABLE IF NOT EXISTS meal_items (
        id           SERIAL PRIMARY KEY,
        meal_id      INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
        type         TEXT NOT NULL CHECK (type IN ('recipe','product','manual')),
        reference_id INTEGER,
        name         TEXT NOT NULL,
        quantity     TEXT,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id ON meal_items (meal_id)`,
      `CREATE TABLE IF NOT EXISTS user_item_usage (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_type    TEXT NOT NULL,
        item_id      INTEGER,
        item_name    TEXT NOT NULL,
        last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        use_count    INTEGER NOT NULL DEFAULT 1,
        CONSTRAINT user_item_usage_unique UNIQUE (user_id, item_name, item_type)
      )`,
      `CREATE INDEX IF NOT EXISTS idx_user_item_usage_user_id ON user_item_usage (user_id)`,
    ],
  },

  {
    id: "2026-04-02_add_shop_status_to_shopping_list",
    statements: [
      // Tracks guided shop mode state per item.
      // Values: pending | already_got | need_to_buy | in_basket | alternate_selected | deferred
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS shop_status TEXT",
    ],
  },

  {
    id: "2026-04-04_custom_diary_metrics",
    statements: [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_metric_defs JSONB NOT NULL DEFAULT '[]'",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS diary_extra_metrics JSONB NOT NULL DEFAULT '[]'",
      "ALTER TABLE food_diary_metrics ADD COLUMN IF NOT EXISTS custom_values JSONB NOT NULL DEFAULT '{}'",
    ],
  },

  {
    id: "2026-04-05_savings_events",
    statements: [
      `CREATE TABLE IF NOT EXISTS savings_events (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date        TEXT NOT NULL,
        type        TEXT NOT NULL CHECK (type IN ('takeaway_avoided','pantry_used','smart_swap')),
        amount      REAL NOT NULL,
        source_id   INTEGER,
        source_type TEXT,
        note        TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_savings_events_user_id ON savings_events (user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_savings_events_user_date ON savings_events (user_id, date)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_savings_events_source ON savings_events (user_id, source_type, source_id) WHERE source_id IS NOT NULL AND source_type IS NOT NULL`,
    ],
  },

  {
    id: "2026-04-12_item_resolution_layer",
    statements: [
      // original_text: raw user input before any normalisation
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS original_text TEXT",
      // canonical_name: authoritative resolved name (e.g. "toilet roll" not "bog roll")
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS canonical_name TEXT",
      // subcategory: finer classification within a category (e.g. category=produce, subcategory=root_vegetable)
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS subcategory TEXT",
      // resolution_state: lifecycle of the item from raw input to resolved
      // Values: raw | needs_review | resolved | matched_to_product
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS resolution_state TEXT NOT NULL DEFAULT 'raw'",
      // review_reason: machine-readable reason why the item needs review
      // Values: unrecognised_item | ambiguous_term | low_confidence | category_conflict
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS review_reason TEXT",
      // review_suggestions: JSON array of suggested specific variants for ambiguous umbrella terms
      // e.g. ["strawberries","blueberries","raspberries","mixed berries"] for "berries"
      "ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS review_suggestions TEXT",
    ],
  },

  {
    id: "2026-04-16_add_guest_eaters_to_planner_entries",
    statements: [
      "ALTER TABLE planner_entries ADD COLUMN IF NOT EXISTS guest_eaters JSONB",
    ],
  },

  {
    id: "2026-04-16_ingredient_sources_meal_context",
    statements: [
      "ALTER TABLE ingredient_sources ADD COLUMN IF NOT EXISTS eater_ids INTEGER[]",
      "ALTER TABLE ingredient_sources ADD COLUMN IF NOT EXISTS guest_eaters JSONB",
    ],
  },

  {
    id: "2026-04-16_add_household_eaters_tables",
    statements: [
      `CREATE TABLE IF NOT EXISTS household_eaters (
        id SERIAL PRIMARY KEY,
        household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
        display_name TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        default_diet_types TEXT[],
        hard_restrictions TEXT[]
      )`,
      `CREATE TABLE IF NOT EXISTS planner_entry_eaters (
        id SERIAL PRIMARY KEY,
        entry_id INTEGER NOT NULL REFERENCES planner_entries(id) ON DELETE CASCADE,
        household_eater_id INTEGER NOT NULL REFERENCES household_eaters(id) ON DELETE CASCADE,
        CONSTRAINT planner_entry_eaters_entry_member_unique UNIQUE (entry_id, household_eater_id)
      )`,
      `CREATE TABLE IF NOT EXISTS planner_week_eater_overrides (
        id SERIAL PRIMARY KEY,
        week_id INTEGER NOT NULL REFERENCES planner_weeks(id) ON DELETE CASCADE,
        eater_id INTEGER NOT NULL REFERENCES household_eaters(id) ON DELETE CASCADE,
        diet_types TEXT[] NOT NULL DEFAULT '{}',
        CONSTRAINT pweo_week_eater_unique UNIQUE (week_id, eater_id)
      )`,
    ],
  },

  {
    id: "2026-04-18_fix_pantry_uniqueness",
    statements: [
      // ── Step 1: Remove active household-level duplicates ─────────────────────
      // The old constraint was UNIQUE(user_id, ingredient_key), so two users in
      // the same household could both insert the same ingredient_key. Pantry items
      // are fetched by household_id, so these duplicates are always visible.
      //
      // Keep the best row per (household_id, ingredient_key):
      //   • prefer user-added items (is_default=false) over seeded defaults
      //   • then prefer the oldest record (lowest id) — most likely the original
      //
      // Only touches active (is_deleted=false) rows. Soft-deleted rows are left
      // alone — they are hidden from all queries and represent intentional removals.
      `DELETE FROM user_pantry_items
       WHERE id IN (
         SELECT id FROM (
           SELECT id,
                  ROW_NUMBER() OVER (
                    PARTITION BY household_id, ingredient_key
                    ORDER BY is_default ASC, id ASC
                  ) AS rn
           FROM user_pantry_items
           WHERE household_id IS NOT NULL
             AND is_deleted = FALSE
         ) ranked
         WHERE rn > 1
       )`,

      // ── Step 2: Drop the old user-scoped unique constraint ───────────────────
      // This constraint was UNIQUE(user_id, ingredient_key). It only prevented a
      // single user from adding the same key twice — not two household members.
      "ALTER TABLE user_pantry_items DROP CONSTRAINT IF EXISTS user_pantry_items_user_id_ingredient_key_key",

      // ── Step 3: Add the correct household-scoped partial unique index ─────────
      // A partial index on active rows only, so:
      //   • soft-deleted defaults do not block re-adding the same ingredient
      //   • rows with a null household_id (legacy, should be none) are excluded
      //     and still protected by the now-dropped user-level constraint
      //
      // Two users in the same household can no longer create duplicate entries.
      // Concurrent seeding is also safe: the second seed's inserts will conflict
      // on this index and be silently skipped via ON CONFLICT DO NOTHING.
      `CREATE UNIQUE INDEX IF NOT EXISTS user_pantry_items_household_ingredient_active_unique
       ON user_pantry_items (household_id, ingredient_key)
       WHERE is_deleted = FALSE AND household_id IS NOT NULL`,
    ],
  },

  {
    id: "2026-04-18_pantry_ingredient_knowledge",
    statements: [
      `CREATE TABLE IF NOT EXISTS pantry_ingredient_knowledge (
        id                 SERIAL PRIMARY KEY,
        ingredient_key     TEXT NOT NULL UNIQUE,
        supports           TEXT[] NOT NULL DEFAULT '{}',
        why_it_matters     TEXT,
        good_to_know       TEXT,
        how_to_choose      TEXT[],
        tags               TEXT[] NOT NULL DEFAULT '{}',
        last_enriched_at   TIMESTAMPTZ,
        enrichment_source  TEXT NOT NULL DEFAULT 'manual',
        enrichment_version INTEGER NOT NULL DEFAULT 1,
        is_locked          BOOLEAN NOT NULL DEFAULT FALSE,
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    ],
  },

  {
    id: "2026-04-18_pantry_knowledge_highlights",
    statements: [
      `ALTER TABLE pantry_ingredient_knowledge ADD COLUMN IF NOT EXISTS highlights TEXT[]`,
    ],
  },

  {
    // RELEASE-HARDENING: Final sweep for planner_weeks rows whose household_id
    // was never backfilled. Earlier backfills (2026-03-04 and 2026-03-13) only
    // joined through households.created_by_user_id, missing users who became
    // household members after those migrations ran. This join goes through
    // household_members directly, matching every active membership.
    // Safe: only touches rows where household_id IS NULL. Idempotent.
    id: "2026-04-19_backfill_planner_weeks_household_id_final",
    statements: [
      `UPDATE planner_weeks pw
       SET household_id = hm.household_id
       FROM household_members hm
       WHERE hm.user_id = pw.user_id
         AND hm.status = 'active'
         AND pw.household_id IS NULL`,
    ],
  },

  {
    // RELEASE-HARDENING: Ensure no shopping_list rows have a NULL
    // resolution_state. The column was added with DEFAULT 'raw' on
    // 2026-04-12, but any row inserted via a raw SQL path that bypassed
    // the ORM default could still be NULL. Setting to 'raw' is the safe
    // starting point — it marks items as unprocessed without losing data.
    // Idempotent; safe to run multiple times.
    id: "2026-04-19_backfill_shopping_list_null_resolution_state",
    statements: [
      `UPDATE shopping_list
       SET resolution_state = 'raw'
       WHERE resolution_state IS NULL`,
    ],
  },

  {
    id: "2026-04-19_ingredient_classifications_table",
    statements: [
      `CREATE TABLE IF NOT EXISTS ingredient_classifications (
         id              SERIAL PRIMARY KEY,
         normalized_key  TEXT NOT NULL UNIQUE,
         canonical_name  TEXT NOT NULL,
         canonical_key   TEXT NOT NULL,
         category        TEXT NOT NULL,
         subcategory     TEXT,
         aliases         TEXT,
         source          TEXT NOT NULL DEFAULT 'ai',
         ai_confidence   TEXT,
         ai_model        TEXT,
         review_status   TEXT NOT NULL DEFAULT 'pending',
         notes           TEXT,
         created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`,
      `CREATE INDEX IF NOT EXISTS idx_ic_normalized_key
         ON ingredient_classifications(normalized_key)`,
      `CREATE INDEX IF NOT EXISTS idx_ic_review_status
         ON ingredient_classifications(review_status)`,
    ],
  },

  // ← Add new migrations here, appended to the end
];

export interface MigrationResult {
  lastAppliedId: string | null;
  newlyApplied: number;
}

export async function runMigrations(): Promise<MigrationResult> {
  const client = await pool.connect();
  try {
    // Ensure the tracking table exists (safe to run every boot)
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id         TEXT PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("[Migrations] schema_migrations table ready");

    // Load which migrations are already applied
    const { rows: applied } = await client.query<{ id: string }>(
      "SELECT id FROM schema_migrations"
    );
    const appliedIds = new Set(applied.map(r => r.id));

    const pending = MIGRATIONS.filter(m => !appliedIds.has(m.id));

    if (pending.length === 0) {
      console.log("[Migrations] Up to date — no pending migrations");
    } else {
      console.log(`[Migrations] ${pending.length} pending migration(s) to apply`);
    }

    for (const migration of pending) {
      console.log(`[Migrations] Applying "${migration.id}" …`);
      try {
        await client.query("BEGIN");

        for (const sql of migration.statements) {
          await client.query(sql);
        }

        await client.query(
          "INSERT INTO schema_migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING",
          [migration.id]
        );

        await client.query("COMMIT");
        console.log(`[Migrations] ✓ Applied "${migration.id}"`);
      } catch (err: any) {
        await client.query("ROLLBACK").catch(() => {});

        const isPermission =
          err?.code === "42501" || (err?.message ?? "").includes("permission denied");

        if (isPermission) {
          console.error(
            `[Migrations] ✗ PERMISSION DENIED on "${migration.id}". ` +
              "Your database user may lack ALTER TABLE privileges. " +
              "Run these statements manually on the production database:\n" +
              migration.statements.map(s => `  ${s};`).join("\n")
          );
        } else {
          console.error(
            `[Migrations] ✗ Failed on "${migration.id}":`,
            err?.message ?? err
          );
        }
        throw err; // Caller decides whether to fail fast or continue
      }
    }

    // Retrieve the most recently applied migration for health reporting
    const { rows: latest } = await client.query<{ id: string }>(
      "SELECT id FROM schema_migrations ORDER BY applied_at DESC, id DESC LIMIT 1"
    );

    const lastAppliedId = latest[0]?.id ?? null;

    // Log parity summary: confirms the migration state matches the code expectations
    const expectedHead = MIGRATIONS[MIGRATIONS.length - 1]?.id ?? null;
    if (lastAppliedId && lastAppliedId === expectedHead) {
      console.log(`[Migrations] Schema at head: ${lastAppliedId}`);
    } else if (lastAppliedId) {
      console.warn(`[Migrations] Schema head mismatch — DB at "${lastAppliedId}", expected "${expectedHead}"`);
    }

    return {
      lastAppliedId,
      newlyApplied: pending.length,
    };
  } finally {
    client.release();
  }
}
