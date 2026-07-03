/**
 * FS3 — Apply Recipe Acquisition provenance columns to `meals` and backfill
 * them for existing rows (idempotent, additive DDL + deterministic backfill).
 *
 * Used in place of interactive `drizzle-kit push` for the new nullable
 * columns (drizzle-kit prompts create-vs-rename ambiguity, unsupported in
 * this environment — see scripts/apply-companion-goal-columns.ts for the
 * established precedent). Pure ADD COLUMN IF NOT EXISTS; the backfill only
 * fills NULL acquisition columns and never rewrites a non-null value, so
 * re-running is safe and rows written honestly by FS3 code are untouched.
 *
 * The backfill mirrors deriveAcquisitionFromLegacy() in
 * shared/recipe-acquisition.ts exactly (mapping per FS2 §4.3):
 *
 *   starter                      → tha_library / authored
 *   ready_meal                   → tha_library / product
 *   openfoodfacts                → (system? tha_library : personal_cookbook) / product
 *   web, imported_*              → personal_cookbook / user_import
 *   smart_import                 → licensed_discovery / licensed_import
 *   household-safe-variant,
 *   planner-placeholder          → personal_cookbook / derived
 *   scratch WITH source_url      → personal_cookbook / user_import   (FS2 C2-a laundered rows)
 *   scratch without source_url   → personal_cookbook / authored
 *
 * Laundered rows (scratch + source_url) additionally recover their
 * acquisition_source_key from the source_url domain where it maps to a
 * register source.
 *
 * Usage:  tsx scripts/apply-recipe-acquisition-columns.ts
 */
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const DDL = `
ALTER TABLE meals
  ADD COLUMN IF NOT EXISTS acquisition_lane text,
  ADD COLUMN IF NOT EXISTS acquisition_type text,
  ADD COLUMN IF NOT EXISTS acquisition_source_key text,
  ADD COLUMN IF NOT EXISTS licence_ref text,
  ADD COLUMN IF NOT EXISTS attribution_text text;
`;

const BACKFILL = `
UPDATE meals SET
  acquisition_lane = CASE
    WHEN meal_source_type = 'starter' THEN 'tha_library'
    WHEN meal_source_type = 'ready_meal' THEN 'tha_library'
    WHEN meal_source_type = 'openfoodfacts' AND is_system_meal THEN 'tha_library'
    WHEN meal_source_type = 'openfoodfacts' THEN 'personal_cookbook'
    WHEN meal_source_type = 'smart_import' THEN 'licensed_discovery'
    ELSE 'personal_cookbook'
  END,
  acquisition_type = CASE
    WHEN meal_source_type = 'starter' THEN 'authored'
    WHEN meal_source_type IN ('ready_meal', 'openfoodfacts') THEN 'product'
    WHEN meal_source_type IN ('web', 'imported_website', 'imported_instagram', 'imported_tiktok') THEN 'user_import'
    WHEN meal_source_type = 'smart_import' THEN 'licensed_import'
    WHEN meal_source_type IN ('household-safe-variant', 'planner-placeholder') THEN 'derived'
    WHEN meal_source_type = 'scratch' AND source_url IS NOT NULL THEN 'user_import'
    ELSE 'authored'
  END
WHERE acquisition_lane IS NULL;

-- Laundered auto-imports (FS2 C2-a): recover the source key from the URL domain.
UPDATE meals SET acquisition_source_key = CASE
    WHEN source_url LIKE '%themealdb.com%'   THEN 'themealdb'
    WHEN source_url LIKE '%bbcgoodfood.com%' THEN 'bbcgoodfood'
    WHEN source_url LIKE '%allrecipes.com%'  THEN 'allrecipes'
    WHEN source_url LIKE '%jamieoliver.com%' THEN 'jamieoliver'
    WHEN source_url LIKE '%seriouseats.com%' THEN 'seriouseats'
    ELSE NULL
  END
WHERE acquisition_source_key IS NULL
  AND source_url IS NOT NULL
  AND acquisition_type IN ('user_import', 'licensed_import');
`;

async function run() {
  await pool.query(DDL);
  console.log("DDL applied: 5 acquisition columns present on meals.");

  await pool.query("BEGIN");
  try {
    await pool.query(BACKFILL);
    await pool.query("COMMIT");
  } catch (e) {
    await pool.query("ROLLBACK");
    throw e;
  }

  const { rows } = await pool.query(`
    SELECT acquisition_lane, acquisition_type, count(*)::int AS n
    FROM meals GROUP BY 1, 2 ORDER BY n DESC`);
  console.log("Backfill result (lane / type / rows):");
  for (const r of rows) console.log(`  ${r.acquisition_lane} / ${r.acquisition_type}: ${r.n}`);

  const { rows: nulls } = await pool.query(
    `SELECT count(*)::int AS n FROM meals WHERE acquisition_lane IS NULL`);
  console.log(`Rows with NULL acquisition_lane after backfill: ${nulls[0].n} (expected 0)`);

  await pool.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
