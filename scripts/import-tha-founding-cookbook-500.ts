/**
 * CBK1 — The canonical THA Founding Cookbook seeder (was: COOKBOOK3 dev-only importer)
 * ====================================================================================
 * This is the ONE mechanism that puts the 500 THA-authored founding recipes into a THA database —
 * a fresh developer database, a CI database, and (as a governed release step) production. There is
 * no second cookbook import pipeline, and there must never be one.
 *
 * Source of truth for the recipes:
 *   data/cookbook/tha_original_founding_cookbook_500/tha_original_founding_cookbook_500.json
 *
 * Reports: docs/implementation/platform/CBK1_CANONICAL_PRODUCTION_COOKBOOK_SEEDING.md
 *          docs/implementation/cookbook/COOKBOOK3_IMPORT_THA_ORIGINAL_FOUNDING_COOKBOOK.md
 *
 * WHY THIS FILE CHANGED (CBK1)
 * ----------------------------
 * It used to refuse to run whenever NODE_ENV=production, and its header called it "dev-only". That
 * made it safe and useless in equal measure: RELEASE.md states that the 500 recipes "reach
 * production as rows in the `meals` table", while the only thing capable of writing those rows
 * declined to. A fresh production database served an empty Cookbook and no sanctioned mechanism
 * could fill it (REL1, Blocker 1).
 *
 * The fix is not to delete the guard. It is to make the guard *say who may pass*. Seeding
 * production is now possible, and only ever on purpose:
 *
 *   - Writing a production database requires `--production`, typed by a human, every time.
 *   - Without it, a production target is refused exactly as before.
 *   - `--rollback` is refused against a production database ALWAYS, with no override. Deleting
 *     500 live rows is not a release step (RELEASE.md, "Production Data Rules": never wipe prod
 *     data).
 *   - `--dry-run` reports precisely what would change and writes nothing. This mirrors the
 *     existing production-data precedent in RELEASE.md Step 4 (backfill-item-resolution).
 *
 * "Production" is not just NODE_ENV. A DATABASE_URL pointing at a managed provider IS production
 * even when NODE_ENV is unset — which is the normal shape of a release command, and was the hole
 * in the old guard. Classification is owned by scripts/db/database-target.ts, shared with the
 * schema-push guard (TRUST1-O8) so that "is this host production?" has exactly one answer.
 *
 * WHAT IT WRITES
 * --------------
 *   - All 500 recipes as THA-authored SYSTEM meals (user_id=0, is_system_meal=true,
 *     acquisition_lane='tha_library', acquisition_type='authored', meal_source_type='starter'), so
 *     they appear in every user's Cookbook via storage.getSystemMeals().
 *   - The external recipe_id is preserved as the stable import_key ("tha_original:THA-###") in the
 *     existing acquisition_source_key column. That key is the recipe's canonical identity AND the
 *     idempotency key. As of CBK1 it is enforced by a partial unique index
 *     (`meals_tha_original_source_key_uniq`, server/migrations/runner.ts) — duplication of a
 *     founding recipe is now refused by the database, not merely avoided by this script.
 *
 * Write path
 *   - Inserts reuse the canonical write funnel storage.createMeal(userId, insertMeal)
 *     (THA_RECIPE_ACQUISITION_ARCHITECTURE.md §5). No raw insert, no bulk COPY, no seeding SQL.
 *   - Reconciling updates use a scoped db.update restricted to system rows (is_system_meal=true).
 *     User meals are never matched, read, or written.
 *
 * Content ownership (Cookbook owns recipe content only)
 *   - Stored on the row: name, category, ingredients, method, servings, and acquisition provenance.
 *     difficulty / prep_minutes / cook_minutes / cuisine_inspiration / why_this_works_for_tha /
 *     planner_readability_notes / slug have NO column on `meals` and are intentionally NOT written
 *     (no schema change). They remain in the source-of-truth JSON. Honest gaps, never invented
 *     columns. The Planner / Household Reasoning / Decision Engine infer adaptations later from the
 *     canonical ingredients — this seeder embeds no planner, leftover, swap or household logic.
 *
 * Categories
 *   - Resolved BY NAME from `meal_categories` at run time. They used to be hard-coded as ids 1-4,
 *     which is true of a dev database only by the accident of insertion order — on a fresh
 *     production database those ids are whatever the serial sequence produced, so the old code
 *     could have filed every breakfast under the wrong category and said nothing. It now fails
 *     closed if a required category is absent, which also enforces the correct release ordering:
 *     the app must boot once (seedReadyMeals creates the categories) before the cookbook is seeded.
 *
 * Idempotency
 *   - Matches an existing system meal by, in order: acquisition_source_key == import_key, then
 *     clean recipe_name, then legacy_recipe_name. Found → update in place; not found → insert.
 *     A second run inserts nothing.
 *
 * Usage
 *   npm run seed:cookbook                  # seed a development / CI database
 *   npm run seed:cookbook:dry-run          # report what would change; write nothing
 *   npm run seed:cookbook -- --rollback    # remove all 500 (development databases only)
 *
 *   # Production, as a governed release step (RELEASE.md Step 4):
 *   DATABASE_URL="<prod url>" npm run seed:cookbook -- --dry-run
 *   DATABASE_URL="<prod url>" npm run seed:cookbook -- --production
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { storage } from "../server/storage";
import { db, pool } from "../server/db";
import { meals, mealCategories } from "@shared/schema";
import { and, eq, like } from "drizzle-orm";
import { classifyDatabaseTarget, isProductionTarget } from "./db/database-target";

const SYSTEM_USER_ID = 0;
const PREFIX = "The Healthy Apples";
const IMPORT_KEY_PREFIX = "tha_original:";
const EXPECTED_RECIPES = 500;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.resolve(
  HERE,
  "../data/cookbook/tha_original_founding_cookbook_500/tha_original_founding_cookbook_500.json",
);

/**
 * The cookbook's five source categories, mapped to the canonical `meal_categories` NAMES that
 * `seedReadyMeals` creates at boot. No "Side" category exists in THA, so "side" maps to Lunch —
 * consistent with Batch 001's THA-010. Names, not ids: see the header.
 */
const CATEGORY_NAMES: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  side: "Lunch",
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

type Mode = "seed" | "rollback";

class SeedRefusal extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SeedRefusal";
  }
}

/**
 * The gate. Decides whether this process may write to the database `DATABASE_URL` points at.
 *
 * Fails closed: any target that cannot be shown to be disposable is treated as production, and a
 * production target is refused unless the operator asked for it by name.
 */
function assertSeedTargetAllowed(mode: Mode, allowProduction: boolean): void {
  const target = classifyDatabaseTarget(process.env.DATABASE_URL);

  if (target.kind === "missing") {
    throw new SeedRefusal(
      "REFUSING TO RUN: DATABASE_URL is not set.\n" +
        "  There is no database to seed. Point DATABASE_URL at the database you mean.",
    );
  }

  const isProduction = isProductionTarget(target, process.env.NODE_ENV);

  if (!isProduction) return; // A disposable development / CI database. Seed or roll back freely.

  const why =
    process.env.NODE_ENV === "production"
      ? "NODE_ENV is 'production'"
      : target.kind === "managed"
        ? `DATABASE_URL points at a managed database provider (${target.marker}) — host '${target.host}'`
        : `DATABASE_URL points at '${target.host ?? "an unreadable host"}', which cannot be shown to be disposable`;

  // Destroying 500 live rows is never a release step. No flag buys this, by design.
  if (mode === "rollback") {
    throw new SeedRefusal(
      `REFUSING TO ROLL BACK: this looks like a production database.\n\n` +
        `  Reason: ${why}.\n` +
        `  Target: ${target.redacted}\n\n` +
        `  --rollback DELETES all 500 founding recipes. There is no override for this, and there\n` +
        `  will not be one: RELEASE.md's Production Data Rules say never wipe prod data. Re-running\n` +
        `  the seed repairs a bad seed in place — deleting first is never the remedy.`,
    );
  }

  if (!allowProduction) {
    throw new SeedRefusal(
      `REFUSING TO SEED: this looks like a production database, and you did not say so.\n\n` +
        `  Reason: ${why}.\n` +
        `  Target: ${target.redacted}\n\n` +
        `  Seeding production is a sanctioned release step (RELEASE.md Step 4) — but it must be\n` +
        `  deliberate. Preview it first, then say it out loud:\n\n` +
        `      npm run seed:cookbook -- --dry-run\n` +
        `      npm run seed:cookbook -- --production\n`,
    );
  }
}

function loadRecipes(): Recipe[] {
  if (!fs.existsSync(SOURCE)) {
    throw new SeedRefusal(
      `REFUSING TO RUN: the cookbook source is missing.\n` +
        `  Expected: ${SOURCE}\n\n` +
        `  This file is committed (REL1). If it is absent, the checkout is incomplete — seeding\n` +
        `  from a partial source would write a partial cookbook and call it done.`,
    );
  }

  const raw = JSON.parse(fs.readFileSync(SOURCE, "utf8"));
  const recipes: Recipe[] = raw.recipes;
  if (!Array.isArray(recipes) || recipes.length !== EXPECTED_RECIPES) {
    throw new SeedRefusal(
      `REFUSING TO RUN: expected ${EXPECTED_RECIPES} recipes in the source, found ${recipes?.length ?? 0}.`,
    );
  }

  const seenKeys = new Set<string>();
  for (const r of recipes) {
    if (!r.recipe_id || !r.recipe_name || !r.import_key) {
      throw new SeedRefusal(`Recipe missing id/name/import_key: ${JSON.stringify(r).slice(0, 120)}`);
    }
    if (r.recipe_name.startsWith(PREFIX)) {
      throw new SeedRefusal(`Visible recipe_name must NOT be prefixed: ${r.recipe_name}`);
    }
    if (!(r.category in CATEGORY_NAMES)) {
      throw new SeedRefusal(`Unknown category "${r.category}" for ${r.recipe_id}`);
    }
    if (!Array.isArray(r.ingredients) || r.ingredients.length === 0) {
      throw new SeedRefusal(`Recipe ${r.recipe_id} has no ingredients`);
    }
    if (!Array.isArray(r.method) || r.method.length === 0) {
      throw new SeedRefusal(`Recipe ${r.recipe_id} has no method`);
    }
    if (!r.import_key.startsWith(IMPORT_KEY_PREFIX)) {
      throw new SeedRefusal(`Recipe ${r.recipe_id} has unexpected import_key ${r.import_key}`);
    }
    // The import_key is the canonical identity. Two recipes sharing one is a corrupt source, and
    // the database would now refuse it anyway — catch it here, where the message can say why.
    if (seenKeys.has(r.import_key)) {
      throw new SeedRefusal(
        `Duplicate import_key "${r.import_key}" in the source — it is the canonical identity of a founding recipe and must be unique.`,
      );
    }
    seenKeys.add(r.import_key);
  }
  return recipes;
}

/**
 * Resolve the `meal_categories` ids this seeder needs, BY NAME. Fails closed when a category is
 * absent — which on a fresh database means the app has not booted yet.
 */
async function resolveCategoryIds(): Promise<Map<string, number>> {
  const rows = await db.select().from(mealCategories);
  const byName = new Map(rows.map(c => [c.name, c.id]));

  const required = [...new Set(Object.values(CATEGORY_NAMES))];
  const missing = required.filter(name => !byName.has(name));

  if (missing.length > 0) {
    throw new SeedRefusal(
      `REFUSING TO SEED: required meal categories are missing: ${missing.join(", ")}.\n\n` +
        `  Categories are owned by seedReadyMeals() (server/lib/seed-ready-meals.ts), which runs at\n` +
        `  server boot. Seeding the cookbook into a database that has never booted the app would\n` +
        `  file every recipe under a category id that does not exist.\n\n` +
        `  Deploy and start the app once, then seed the cookbook. (RELEASE.md Step 3 precedes Step 4.)`,
    );
  }

  const resolved = new Map<string, number>();
  for (const [sourceCategory, canonicalName] of Object.entries(CATEGORY_NAMES)) {
    resolved.set(sourceCategory, byName.get(canonicalName)!);
  }
  return resolved;
}

async function runSeed(opts: { dryRun: boolean; allowProduction: boolean }) {
  assertSeedTargetAllowed("seed", opts.allowProduction);

  const target = classifyDatabaseTarget(process.env.DATABASE_URL);
  const recipes = loadRecipes();
  const categoryIds = await resolveCategoryIds();

  console.log("\n──────── CBK1 COOKBOOK SEED ────────");
  console.log(`Target      : ${target.redacted}  [${target.kind}]`);
  console.log(`Mode        : ${opts.dryRun ? "DRY RUN — nothing will be written" : "WRITE"}`);
  console.log(`Source      : ${recipes.length} recipes\n`);

  // Single read of the system-meal corpus; build match indices.
  const sys = await db
    .select({
      id: meals.id,
      name: meals.name,
      sourceKey: meals.acquisitionSourceKey,
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
  const reconciledLegacy: string[] = []; // batch-001 renames

  for (const r of recipes) {
    const payload = {
      name: r.recipe_name,
      ingredients: r.ingredients,
      instructions: r.method,
      servings: r.servings ?? 1,
      categoryId: categoryIds.get(r.category)!,
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
      if (!opts.dryRun) {
        await db
          .update(meals)
          .set(payload)
          .where(and(eq(meals.id, existingId), eq(meals.isSystemMeal, true)));
      }
      reconciled++;
      if (matchedViaLegacy) reconciledLegacy.push(`${r.legacy_recipe_name} → ${r.recipe_name}`);
      bySourceKey.set(r.import_key, existingId);
    } else {
      if (!opts.dryRun) {
        const created = await storage.createMeal(SYSTEM_USER_ID, payload);
        bySourceKey.set(r.import_key, created.id);
        byName.set(r.recipe_name, created.id);
      }
      inserted++;
    }
  }

  const verb = opts.dryRun ? "Would insert   " : "Inserted       ";
  const verb2 = opts.dryRun ? "Would reconcile" : "Reconciled     ";
  console.log(`${verb} (new)    : ${inserted}`);
  console.log(`${verb2} (update) : ${reconciled}`);
  if (reconciledLegacy.length > 0) {
    console.log(`  of which Batch-001 renames via legacy_recipe_name : ${reconciledLegacy.length}`);
    reconciledLegacy.forEach(s => console.log(`    - ${s}`));
  }

  if (opts.dryRun) {
    console.log("\nDRY RUN — no rows were written.\n");
    return;
  }

  // Post-seed verification. The seed does not get to declare itself successful.
  const total = await db
    .select({ id: meals.id })
    .from(meals)
    .where(
      and(eq(meals.isSystemMeal, true), like(meals.acquisitionSourceKey, `${IMPORT_KEY_PREFIX}%`)),
    );
  const prefixed = await db
    .select({ id: meals.id })
    .from(meals)
    .where(and(eq(meals.isSystemMeal, true), like(meals.name, `${PREFIX}%`)));

  console.log(`\nTHA founding recipes now : ${total.length}  (expected ${EXPECTED_RECIPES})`);
  console.log(`Rows still name-prefixed : ${prefixed.length}  (expected 0)`);

  if (total.length !== EXPECTED_RECIPES || prefixed.length !== 0) {
    throw new Error(
      `SEED FAILED VERIFICATION: expected ${EXPECTED_RECIPES} founding recipes and 0 prefixed rows, ` +
        `found ${total.length} and ${prefixed.length}. Run: npm run verify:cookbook-seed`,
    );
  }

  console.log("\nRESULT: PASS — the founding cookbook is seeded.\n");
}

async function runRollback() {
  assertSeedTargetAllowed("rollback", false);

  const deleted = await db
    .delete(meals)
    .where(
      and(eq(meals.isSystemMeal, true), like(meals.acquisitionSourceKey, `${IMPORT_KEY_PREFIX}%`)),
    )
    .returning({ id: meals.id });

  console.log(`ROLLBACK: deleted ${deleted.length} THA founding recipe(s).`);
  console.log("Note: this also removes the 10 reconciled Batch-001 rows. To restore the prior");
  console.log("Batch-001 state, re-run: npx tsx scripts/import-tha-founding-cookbook-batch-001.ts");
}

const args = process.argv.slice(2);
const mode: Mode = args.includes("--rollback") ? "rollback" : "seed";
const dryRun = args.includes("--dry-run");
const allowProduction = args.includes("--production");

(mode === "rollback" ? runRollback() : runSeed({ dryRun, allowProduction }))
  .then(async () => {
    await pool.end();
  })
  .catch(async (e: unknown) => {
    // A refusal is the guard working — print the reason, not a stack trace.
    if (e instanceof SeedRefusal) {
      console.error(`\n${e.message}\n`);
    } else {
      console.error(e);
    }
    await pool.end().catch(() => {});
    process.exit(1);
  });
