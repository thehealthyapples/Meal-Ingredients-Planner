/**
 * CBK1 — Cookbook seed verification gate
 * ======================================
 * Asks one question of a live database, mechanically: **is the THA Founding Cookbook correctly
 * seeded here?**
 *
 * It is the single owner of that question. `scripts/import-tha-founding-cookbook-500.ts` writes the
 * cookbook; this verifies it, and it is the check RELEASE.md points at after a production seed. It
 * is READ-ONLY — it opens a connection, runs SELECTs, and writes nothing. It is therefore safe to
 * run against production, which is the whole point: the seed does not get to mark its own homework.
 *
 * What it checks
 *   1. Source integrity      — the committed JSON still holds exactly 500 recipes with unique keys.
 *   2. Presence              — all 500 founding recipes exist as rows.
 *   3. No duplicates         — no import_key appears twice (the property a re-run must preserve).
 *   4. Canonical identity    — every seeded row's key matches a recipe in the source, and every
 *                              recipe in the source has a row. Set equality, not just a count.
 *   5. Canonical provenance  — every row carries tha_library / authored / system / user_id=0.
 *   6. Content integrity     — no row has empty ingredients or method.
 *   7. Legacy names retired  — no row still carries the "The Healthy Apples " prefix.
 *   8. Category integrity    — every row points at a meal_categories row that exists.
 *
 * Usage
 *   npm run verify:cookbook-seed                          # against DATABASE_URL
 *   DATABASE_URL="<prod url>" npm run verify:cookbook-seed # against production (read-only)
 *
 * Exit 0 = the cookbook is correctly seeded. Exit 1 = it is not, and the reason is printed.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { classifyDatabaseTarget } from "../db/database-target";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.resolve(
  HERE,
  "../../data/cookbook/tha_original_founding_cookbook_500/tha_original_founding_cookbook_500.json",
);

const EXPECTED_RECIPES = 500;
const IMPORT_KEY_PREFIX = "tha_original:";
const LEGACY_PREFIX = "The Healthy Apples";

interface Check {
  name: string;
  status: "PASS" | "FAIL";
  detail: string;
}

interface SeededRow {
  id: number;
  name: string;
  user_id: number;
  acquisition_source_key: string;
  acquisition_lane: string | null;
  acquisition_type: string | null;
  is_system_meal: boolean;
  category_id: number | null;
  ingredient_count: number;
  method_count: number;
  category_exists: boolean;
}

/**
 * The verification itself, against an open pool. Exported so a test can drive it without
 * re-implementing a single assertion — there is one owner of what "correctly seeded" means.
 */
export async function verifyCookbookSeed(pool: Pool): Promise<Check[]> {
  const checks: Check[] = [];
  const pass = (name: string, detail: string) => checks.push({ name, status: "PASS", detail });
  const fail = (name: string, detail: string) => checks.push({ name, status: "FAIL", detail });

  // ── 1. Source integrity ────────────────────────────────────────────────────
  if (!fs.existsSync(SOURCE)) {
    fail("Cookbook source present", `Missing: ${SOURCE} — the checkout is incomplete`);
    return checks; // Nothing else can be verified without the source to verify against.
  }

  const source = JSON.parse(fs.readFileSync(SOURCE, "utf8"));
  const recipes: Array<{ import_key: string; recipe_name: string }> = source.recipes ?? [];
  const sourceKeys = new Set(recipes.map(r => r.import_key));

  if (recipes.length === EXPECTED_RECIPES && sourceKeys.size === EXPECTED_RECIPES) {
    pass("Cookbook source integrity", `${EXPECTED_RECIPES} recipes, ${sourceKeys.size} unique keys`);
  } else {
    fail(
      "Cookbook source integrity",
      `Expected ${EXPECTED_RECIPES} recipes with unique keys, found ${recipes.length} recipes / ${sourceKeys.size} unique keys`,
    );
    return checks;
  }

  // ── Read every seeded row once ─────────────────────────────────────────────
  const { rows } = await pool.query<SeededRow>(
    `SELECT m.id,
            m.name,
            m.user_id,
            m.acquisition_source_key,
            m.acquisition_lane,
            m.acquisition_type,
            m.is_system_meal,
            m.category_id,
            COALESCE(array_length(m.ingredients, 1), 0)  AS ingredient_count,
            COALESCE(array_length(m.instructions, 1), 0) AS method_count,
            (c.id IS NOT NULL)                           AS category_exists
       FROM meals m
       LEFT JOIN meal_categories c ON c.id = m.category_id
      WHERE m.is_system_meal = true
        AND m.acquisition_source_key LIKE $1`,
    [`${IMPORT_KEY_PREFIX}%`],
  );

  // ── 2. Presence ────────────────────────────────────────────────────────────
  if (rows.length === EXPECTED_RECIPES) {
    pass("All founding recipes present", `${rows.length} rows`);
  } else if (rows.length === 0) {
    fail(
      "All founding recipes present",
      `0 rows — the Cookbook is EMPTY on this database. Seed it: npm run seed:cookbook`,
    );
  } else {
    fail(
      "All founding recipes present",
      `Expected ${EXPECTED_RECIPES} rows, found ${rows.length} — the seed is incomplete. Re-run: npm run seed:cookbook`,
    );
  }

  // ── 3. No duplicates ───────────────────────────────────────────────────────
  const keyCounts = new Map<string, number>();
  for (const r of rows) {
    keyCounts.set(r.acquisition_source_key, (keyCounts.get(r.acquisition_source_key) ?? 0) + 1);
  }
  const duplicates = Array.from(keyCounts.entries()).filter(([, n]) => n > 1);
  if (duplicates.length === 0) {
    pass("No duplicate recipes", `${keyCounts.size} distinct import keys, none repeated`);
  } else {
    fail(
      "No duplicate recipes",
      `${duplicates.length} import key(s) appear more than once: ` +
        duplicates
          .slice(0, 5)
          .map(([k, n]) => `${k} ×${n}`)
          .join(", "),
    );
  }

  // ── 4. Canonical identity — set equality against the source ────────────────
  const seededKeys = new Set(rows.map(r => r.acquisition_source_key));
  const missing = Array.from(sourceKeys).filter(k => !seededKeys.has(k));
  const unknown = Array.from(seededKeys).filter(k => !sourceKeys.has(k));
  if (missing.length === 0 && unknown.length === 0) {
    pass("Recipe identities canonical", "Every seeded key matches the source, and vice versa");
  } else {
    fail(
      "Recipe identities canonical",
      `${missing.length} recipe(s) in the source are not seeded${missing.length ? ` (e.g. ${missing.slice(0, 3).join(", ")})` : ""}; ` +
        `${unknown.length} seeded row(s) match no source recipe${unknown.length ? ` (e.g. ${unknown.slice(0, 3).join(", ")})` : ""}`,
    );
  }

  // ── 5. Canonical provenance (THA_RECIPE_ACQUISITION_ARCHITECTURE.md §3 Rule 4) ──
  const badProvenance = rows.filter(
    r =>
      r.acquisition_lane !== "tha_library" ||
      r.acquisition_type !== "authored" ||
      r.is_system_meal !== true ||
      r.user_id !== 0,
  );
  if (badProvenance.length === 0) {
    pass("Provenance canonical", "All rows: tha_library / authored / system meal / user_id=0");
  } else {
    fail(
      "Provenance canonical",
      `${badProvenance.length} row(s) carry wrong provenance or ownership (e.g. id ${badProvenance[0].id} — ` +
        `lane=${badProvenance[0].acquisition_lane}, type=${badProvenance[0].acquisition_type}, user_id=${badProvenance[0].user_id})`,
    );
  }

  // ── 6. Content integrity ───────────────────────────────────────────────────
  const empty = rows.filter(r => r.ingredient_count === 0 || r.method_count === 0);
  if (empty.length === 0) {
    pass("Recipe content intact", "Every row has ingredients and a method");
  } else {
    fail(
      "Recipe content intact",
      `${empty.length} row(s) have no ingredients or no method (e.g. "${empty[0].name}")`,
    );
  }

  // ── 7. Legacy names retired ────────────────────────────────────────────────
  const prefixed = rows.filter(r => r.name.startsWith(LEGACY_PREFIX));
  if (prefixed.length === 0) {
    pass("Legacy names retired", `No row carries the "${LEGACY_PREFIX} " prefix`);
  } else {
    fail(
      "Legacy names retired",
      `${prefixed.length} row(s) still carry the legacy prefix (e.g. "${prefixed[0].name}")`,
    );
  }

  // ── 8. Category integrity ──────────────────────────────────────────────────
  const badCategory = rows.filter(r => !r.category_exists);
  if (badCategory.length === 0) {
    pass("Categories resolve", "Every row points at a meal_categories row that exists");
  } else {
    fail(
      "Categories resolve",
      `${badCategory.length} row(s) point at a category_id with no matching meal_categories row ` +
        `(e.g. "${badCategory[0].name}" → category_id ${badCategory[0].category_id})`,
    );
  }

  return checks;
}

// ── CLI ──────────────────────────────────────────────────────────────────────
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("ERROR: DATABASE_URL is required");
    process.exit(1);
  }

  const target = classifyDatabaseTarget(url);
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

  console.log("\n=== CBK1 — Cookbook Seed Verification ===\n");
  console.log(`  Target: ${target.redacted}  [${target.kind}]  (read-only)\n`);

  verifyCookbookSeed(pool)
    .then(async checks => {
      await pool.end();

      for (const c of checks) {
        console.log(`  ${c.status === "PASS" ? "✓" : "✗"} [${c.status}] ${c.name}`);
        console.log(`         ${c.detail}`);
      }

      const failed = checks.filter(c => c.status === "FAIL").length;
      console.log(`\n  Total: ${checks.length - failed} passed, ${failed} failed\n`);

      if (failed > 0) {
        console.error("RESULT: FAIL — the founding cookbook is not correctly seeded on this database.\n");
        process.exit(1);
      }
      console.log("RESULT: PASS — the founding cookbook is correctly seeded.\n");
    })
    .catch(async err => {
      await pool.end().catch(() => {});
      console.error("Verification fatal error:", err);
      process.exit(1);
    });
}
