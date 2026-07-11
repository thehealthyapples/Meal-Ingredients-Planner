/**
 * WS2A — Apply canonical-food tables (idempotent, additive DDL).
 *
 * Used in place of interactive `drizzle-kit push` for the four new tables.
 * Pure CREATE TABLE / CONSTRAINT IF NOT EXISTS — touches nothing else.
 * The DDL mirrors the Drizzle definitions in shared/schema.ts exactly.
 *
 * Usage:  tsx scripts/apply-canonical-tables.ts
 */
import pg from "pg";
import { guardAdHocDdl } from "./db/schema-push-guard.js";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

// TRUST1-O8 — ad-hoc DDL is not a reviewed migration. Refuse to run it against a
// production database. Schema changes reach production only via server/migrations/runner.ts.
guardAdHocDdl("run ad-hoc DDL (scripts/apply-canonical-tables.ts)");

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const DDL = `
CREATE TABLE IF NOT EXISTS diversity_group (
  id serial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  count_as_single_plant boolean NOT NULL DEFAULT true,
  source text NOT NULL DEFAULT 'THA editorial',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS canonical_food (
  id serial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  subcategory text,
  description text,
  knowledge_food_slug text REFERENCES knowledge_foods(slug) ON DELETE SET NULL,
  diversity_group_slug text REFERENCES diversity_group(slug) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  source text NOT NULL DEFAULT 'THA editorial',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS food_variety (
  id serial PRIMARY KEY,
  canonical_food_id integer NOT NULL REFERENCES canonical_food(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  source text NOT NULL DEFAULT 'THA editorial',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS canonical_food_alias (
  id serial PRIMARY KEY,
  canonical_food_id integer NOT NULL REFERENCES canonical_food(id) ON DELETE CASCADE,
  alias text NOT NULL,
  alias_key text NOT NULL UNIQUE,
  alias_type text NOT NULL,
  source text NOT NULL DEFAULT 'THA editorial',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
`;

async function run() {
  await pool.query(DDL);
  const { rows } = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_name IN ('diversity_group','canonical_food','food_variety','canonical_food_alias')
     ORDER BY table_name`,
  );
  console.log("Canonical tables present:", rows.map((r) => r.table_name).join(", "));
  await pool.end();
}

run().catch((err) => {
  console.error("apply-canonical-tables failed:", err);
  process.exit(1);
});
