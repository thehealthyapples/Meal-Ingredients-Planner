/**
 * COOKBOOK3 — Import: THA Original Founding Cookbook, 500 Meal Library
 *
 * Dev-only, idempotent importer for the 500 authored recipes in
 *   data/cookbook/tha_original_founding_cookbook_500/tha_original_founding_cookbook_500.json
 *
 * See docs/implementation/cookbook/COOKBOOK3_IMPORT_THA_ORIGINAL_FOUNDING_COOKBOOK.md
 *
 * What it does
 *   - Imports all 500 recipes as THA-authored SYSTEM meals
 *     (user_id=0, is_system_meal=true, acquisition_lane='tha_library',
 *      acquisition_type='authored', meal_source_type='starter'), so they appear
 *     in every dev user's Cookbook via storage.getSystemMeals().
 *   - Preserves the external recipe_id via the stable import_key
 *     ("tha_original:THA-###") stored in the existing acquisition_source_key
 *     column — this is also the idempotency key. No schema change.
 *   - Reconciles the 10 already-imported "Batch 001" rows (currently named with
 *     the "The Healthy Apples " prefix) IN PLACE using legacy_recipe_name,
 *     renaming them to the clean 500-library names — never duplicating them.
 *
 * Write path
 *   - Inserts reuse the canonical write funnel storage.createMeal(userId,
 *     insertMeal) (THA_RECIPE_ACQUISITION_ARCHITECTURE.md §5).
 *   - Reconciling updates use a scoped db.update on the meals table, restricted
 *     to system rows (is_system_meal=true, user_id=0). User meals are never
 *     matched or written.
 *
 * Content ownership (Cookbook owns recipe content only)
 *   - Stored on the row: name, category, ingredients, method, servings, and
 *     acquisition provenance. difficulty / prep_minutes / cook_minutes /
 *     cuisine_inspiration / why_this_works_for_tha / planner_readability_notes /
 *     slug have NO column on `meals` and are intentionally NOT written (no schema
 *     change). They remain preserved in the retained source-of-truth JSON. The
 *     Planner / Household Reasoning / Decision Engine infer adaptations and
 *     opportunities later from the canonical ingredients — this importer embeds
 *     no planner, leftover, swap or household logic.
 *
 * Idempotency
 *   - Matches an existing system meal by, in order: acquisition_source_key ==
 *     import_key, then clean recipe_name, then legacy_recipe_name. Found → update
 *     in place; not found → insert. A second run inserts nothing.
 *
 * Usage
 *   npx tsx scripts/import-tha-founding-cookbook-500.ts            # import
 *   npx tsx scripts/import-tha-founding-cookbook-500.ts --rollback # remove all 500
 *
 * Production guard: refuses to run when NODE_ENV=production.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { storage } from "../server/storage";
import { db, pool } from "../server/db";
import { meals } from "@shared/schema";
import { and, eq, like } from "drizzle-orm";

const SYSTEM_USER_ID = 0;
const PREFIX = "The Healthy Apples";
const IMPORT_KEY_PREFIX = "tha_original:";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.resolve(
  HERE,
  "../data/cookbook/tha_original_founding_cookbook_500/tha_original_founding_cookbook_500.json",
);

// Dev meal_categories: 1=Breakfast 2=Lunch 3=Dinner 4=Snack. No "Side" category
// exists; "side" maps to Lunch(2) (consistent with Batch 001's THA-010).
const CATEGORY_MAP: Record<string, number> = {
  breakfast: 1,
  lunch: 2,
  dinner: 3,
  snack: 4,
  side: 2,
};

interface Recipe {
  recipe_id: string;
  recipe_name: string;
  legacy_recipe_name?: string | null;
  category: string;
  servings: number;
  ingredients: string[];
  method: string[];
  acquisition_lane: string;
  acquisition_type: string;
  meal_source_type: string;
  import_key: string;
}

function assertNotProduction() {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "REFUSING TO RUN: NODE_ENV=production. This importer is dev-only and must never write to production.",
    );
    process.exit(1);
  }
}

function loadRecipes(): Recipe[] {
  const raw = JSON.parse(fs.readFileSync(SOURCE, "utf8"));
  const recipes: Recipe[] = raw.recipes;
  if (!Array.isArray(recipes) || recipes.length !== 500) {
    throw new Error(`Expected 500 recipes, found ${recipes?.length}`);
  }
  for (const r of recipes) {
    if (!r.recipe_id || !r.recipe_name || !r.import_key) {
      throw new Error(`Recipe missing id/name/import_key: ${JSON.stringify(r).slice(0, 120)}`);
    }
    if (r.recipe_name.startsWith(PREFIX)) {
      throw new Error(`Visible recipe_name must NOT be prefixed: ${r.recipe_name}`);
    }
    if (!(r.category in CATEGORY_MAP)) {
      throw new Error(`Unknown category "${r.category}" for ${r.recipe_id}`);
    }
    if (!Array.isArray(r.ingredients) || r.ingredients.length === 0) {
      throw new Error(`Recipe ${r.recipe_id} has no ingredients`);
    }
    if (!Array.isArray(r.method) || r.method.length === 0) {
      throw new Error(`Recipe ${r.recipe_id} has no method`);
    }
    if (!r.import_key.startsWith(IMPORT_KEY_PREFIX)) {
      throw new Error(`Recipe ${r.recipe_id} has unexpected import_key ${r.import_key}`);
    }
  }
  return recipes;
}

async function runImport() {
  assertNotProduction();
  const recipes = loadRecipes();

  // Single read of the system-meal corpus; build match indices.
  const sys = await db
    .select({
      id: meals.id,
      name: meals.name,
      sourceKey: meals.acquisitionSourceKey,
      isSystem: meals.isSystemMeal,
    })
    .from(meals)
    .where(eq(meals.isSystemMeal, true));

  const bySourceKey = new Map<string, number>();
  const byName = new Map<string, number>();
  for (const row of sys) {
    if (row.sourceKey) bySourceKey.set(row.sourceKey, row.id);
    byName.set(row.name, row.id);
  }

  let inserted = 0;
  let reconciled = 0; // existing system row updated in place
  const insertedIds: string[] = [];
  const reconciledLegacy: string[] = []; // batch-001 renames

  for (const r of recipes) {
    const categoryId = CATEGORY_MAP[r.category];
    const payload = {
      name: r.recipe_name,
      ingredients: r.ingredients,
      instructions: r.method,
      servings: r.servings ?? 1,
      categoryId,
      isSystemMeal: true as const,
      mealFormat: "recipe",
      kind: "meal",
      mealSourceType: "starter",
      acquisitionLane: "tha_library",
      acquisitionType: "authored",
      acquisitionSourceKey: r.import_key,
    };

    // Resolve an existing SYSTEM row to reconcile, in priority order.
    let existingId: number | undefined = bySourceKey.get(r.import_key);
    let matchedViaLegacy = false;
    if (existingId === undefined) existingId = byName.get(r.recipe_name);
    if (existingId === undefined && r.legacy_recipe_name) {
      existingId = byName.get(r.legacy_recipe_name);
      if (existingId !== undefined) matchedViaLegacy = true;
    }

    if (existingId !== undefined) {
      await db
        .update(meals)
        .set(payload)
        .where(and(eq(meals.id, existingId), eq(meals.isSystemMeal, true)));
      reconciled++;
      if (matchedViaLegacy) reconciledLegacy.push(`${r.legacy_recipe_name} → ${r.recipe_name}`);
      // keep indices current for a same-run second match (defensive)
      bySourceKey.set(r.import_key, existingId);
    } else {
      const created = await storage.createMeal(SYSTEM_USER_ID, payload);
      inserted++;
      insertedIds.push(r.recipe_id);
      bySourceKey.set(r.import_key, created.id);
      byName.set(r.recipe_name, created.id);
    }
  }

  // Post-import verification
  const total = await db
    .select({ id: meals.id })
    .from(meals)
    .where(and(eq(meals.isSystemMeal, true), like(meals.acquisitionSourceKey, `${IMPORT_KEY_PREFIX}%`)));
  const prefixed = await db
    .select({ id: meals.id })
    .from(meals)
    .where(and(eq(meals.isSystemMeal, true), like(meals.name, `${PREFIX}%`)));

  console.log("\n──────── COOKBOOK3 IMPORT SUMMARY ────────");
  console.log(`Recipes in source      : ${recipes.length}`);
  console.log(`Inserted (new)         : ${inserted}`);
  console.log(`Reconciled (updated)   : ${reconciled}`);
  console.log(`  of which Batch-001 renames via legacy_recipe_name : ${reconciledLegacy.length}`);
  reconciledLegacy.forEach((s) => console.log(`    - ${s}`));
  console.log(`THA Original rows now   : ${total.length}  (expected 500)`);
  console.log(`Rows still name-prefixed: ${prefixed.length}  (expected 0)`);
  await pool.end();
}

async function runRollback() {
  assertNotProduction();
  const deleted = await db
    .delete(meals)
    .where(and(eq(meals.isSystemMeal, true), like(meals.acquisitionSourceKey, `${IMPORT_KEY_PREFIX}%`)))
    .returning({ id: meals.id, name: meals.name });
  console.log(`ROLLBACK: deleted ${deleted.length} THA Original system meal(s).`);
  console.log(
    "Note: this also removes the 10 reconciled Batch-001 rows. To restore the prior",
  );
  console.log(
    "Batch-001 state, re-run: npx tsx scripts/import-tha-founding-cookbook-batch-001.ts",
  );
  await pool.end();
}

const mode = process.argv.includes("--rollback") ? "rollback" : "import";
(mode === "rollback" ? runRollback() : runImport()).catch((e) => {
  console.error(e);
  process.exit(1);
});
