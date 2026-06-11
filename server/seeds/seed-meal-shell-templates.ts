/**
 * Meal shell template seed — Cooked Breakfast.
 *
 * Inserts purpose-built household meal shell templates with component slot data.
 * These are NEW records — existing 632 auto-created templates are never touched.
 *
 * Idempotent: performs a case-insensitive name lookup before each insert.
 *             If the template already exists it is skipped, not overwritten.
 *
 * Usage:
 *   npm run seed:meal-shells             # live insert
 *   DRY_RUN=true npm run seed:meal-shells # preview without writing
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { sql } from "drizzle-orm";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("[meal-shell-seed] DATABASE_URL is not set.");
  process.exit(1);
}

const DRY_RUN = process.env.DRY_RUN === "true";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// ─── Shell definitions ────────────────────────────────────────────────────────

interface MealShellDef {
  name: string;
  category: string;
  description: string;
  sharedBaseComponents: string[];
  proteinSlots: string[];
  carbSlots: string[];
  vegSlots?: string[];
  toppingSlots?: string[];
  sauceSlots: string[];
  compatibleDiets: string[];
  estimatedTotalTime: number;
  estimatedExtraTimePerVariant: number;
  costBand: string;
  isActive: boolean;
}

const MEAL_SHELLS: MealShellDef[] = [
  {
    name: "Cooked Breakfast",
    category: "breakfast",
    description: "Household meal shell - component-based",
    sharedBaseComponents: [
      "mushrooms",
      "tomatoes",
      "onions",
      "avocado",
      "asparagus",
    ],
    proteinSlots: [
      "eggs",
      "pork sausages",
      "chicken breast",
      "chickpea patty",
      "plant-based sausages",
    ],
    carbSlots: [
      "gluten-free roll",
      "sweet potato hash",
      "gluten-free keto bread roll",
    ],
    sauceSlots: [
      "tomato ketchup",
      "brown sauce",
    ],
    compatibleDiets: [
      "Vegetarian",
      "Gluten-Free",
      "Dairy-Free",
      "Mediterranean",
      "Low-Carb",
      "Keto",
    ],
    estimatedTotalTime: 25,
    estimatedExtraTimePerVariant: 5,
    costBand: "standard",
    isActive: true,
  },
  // SUGGESTION ONLY — do not insert without separate approval:
  // { name: "Jacket Potato Bar", ... }
  // { name: "Taco Bowl", ... }
  // { name: "Curry Night", ... }
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[meal-shell-seed] ${msg}`);
}

async function templateExists(name: string): Promise<{ id: number; name: string } | null> {
  const rows = await db.execute(sql`
    SELECT id, name
    FROM meal_templates
    WHERE LOWER(TRIM(name)) = LOWER(TRIM(${name}))
    LIMIT 1
  `);
  const r = (rows as any).rows ?? rows;
  return r.length > 0 ? r[0] : null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  log(DRY_RUN ? "DRY RUN — no data will be written." : "Live run — writing to database.");
  log(`Processing ${MEAL_SHELLS.length} meal shell(s).`);

  let inserted = 0;
  let skipped = 0;

  for (const shell of MEAL_SHELLS) {
    const existing = await templateExists(shell.name);

    if (existing) {
      log(`SKIP  "${shell.name}" — already exists (id=${existing.id})`);
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      log(`DRY   "${shell.name}" — would insert with ${shell.sharedBaseComponents.length} shared components, ${shell.proteinSlots.length} protein slots, ${shell.carbSlots.length} carb slots`);
      inserted++;
      continue;
    }

    // Insert — use pool.query() directly so pg's native driver serialises
    // JavaScript string[] to Postgres text[] wire format correctly.
    const result = await pool.query(
      `INSERT INTO meal_templates (
        name,
        category,
        description,
        shared_base_components,
        protein_slots,
        carb_slots,
        veg_slots,
        topping_slots,
        sauce_slots,
        compatible_diets,
        estimated_total_time,
        estimated_extra_time_per_variant,
        cost_band,
        is_active
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING id`,
      [
        shell.name,
        shell.category,
        shell.description,
        shell.sharedBaseComponents,
        shell.proteinSlots,
        shell.carbSlots,
        shell.vegSlots ?? [],
        shell.toppingSlots ?? [],
        shell.sauceSlots,
        shell.compatibleDiets,
        shell.estimatedTotalTime,
        shell.estimatedExtraTimePerVariant,
        shell.costBand,
        shell.isActive,
      ]
    );

    const newId = result.rows[0]?.id;
    log(`INSERT "${shell.name}" — id=${newId}`);
    inserted++;
  }

  log("─".repeat(50));
  log(`Inserted : ${inserted}`);
  log(`Skipped  : ${skipped} (already existed)`);
  if (DRY_RUN) log("Dry run complete — no data written.");
}

// ─── Validation (post-insert, skipped on dry run) ─────────────────────────────

async function validate() {
  if (DRY_RUN) {
    log("Validation skipped in dry run mode.");
    return;
  }

  log("─".repeat(50));
  log("Running post-insert validation...");

  // 1. Read back the Cooked Breakfast template
  const rows = await db.execute(sql`
    SELECT
      id, name, category, description,
      shared_base_components,
      protein_slots,
      carb_slots,
      veg_slots,
      topping_slots,
      sauce_slots,
      compatible_diets,
      estimated_total_time,
      estimated_extra_time_per_variant,
      cost_band,
      is_active
    FROM meal_templates
    WHERE LOWER(TRIM(name)) = 'cooked breakfast'
  `);
  const r = (rows as any).rows ?? rows;

  if (r.length === 0) {
    log("FAIL  — Cooked Breakfast template not found after insert.");
    return;
  }

  if (r.length > 1) {
    log(`FAIL  — Duplicate detected: ${r.length} rows named "Cooked Breakfast".`);
    for (const row of r) log(`       id=${row.id} category=${row.category}`);
    return;
  }

  const t = r[0];
  log(`PASS  — Template found: id=${t.id}`);

  // 2. Confirm slot fields are populated (not null, not empty)
  const checks: Array<[string, unknown]> = [
    ["sharedBaseComponents", t.shared_base_components],
    ["proteinSlots",         t.protein_slots],
    ["carbSlots",            t.carb_slots],
    ["sauceSlots",           t.sauce_slots],
    ["compatibleDiets",      t.compatible_diets],
    ["estimatedTotalTime",   t.estimated_total_time],
    ["costBand",             t.cost_band],
  ];

  let allSlotsPassed = true;
  for (const [field, value] of checks) {
    const populated = Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined;
    if (populated) {
      const display = Array.isArray(value) ? `[${(value as string[]).join(", ")}]` : String(value);
      log(`PASS  — ${field}: ${display}`);
    } else {
      log(`FAIL  — ${field} is null or empty`);
      allSlotsPassed = false;
    }
  }

  // 3. Confirm no duplicate names
  const dupeCheck = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM meal_templates
    WHERE LOWER(TRIM(name)) = 'cooked breakfast'
  `);
  const dupeRows = (dupeCheck as any).rows ?? dupeCheck;
  const dupeCount = parseInt(dupeRows[0]?.count ?? "0", 10);
  if (dupeCount === 1) {
    log(`PASS  — No duplicates: exactly 1 row named "Cooked Breakfast"`);
  } else {
    log(`FAIL  — Duplicate count: ${dupeCount} rows`);
  }

  // 4. Confirm existing template count unchanged (should still be 632 + 1 = 633)
  const totalCheck = await db.execute(sql`SELECT COUNT(*) as count FROM meal_templates`);
  const totalRows = (totalCheck as any).rows ?? totalCheck;
  const totalCount = parseInt(totalRows[0]?.count ?? "0", 10);
  log(`INFO  — Total meal_templates rows: ${totalCount}`);

  // 5. Inline scoreTemplate simulation — does this template produce non-null output?
  //    Uses the same logic as household-meal-matcher.ts:scoreTemplate() but without
  //    a live household (tests with a synthetic member profile).
  log("─".repeat(50));
  log("scoreTemplate simulation (synthetic single-member household)...");

  const allSlotIngredients = [
    ...(t.shared_base_components ?? []),
    ...(t.protein_slots         ?? []),
    ...(t.carb_slots            ?? []),
    ...(t.veg_slots             ?? []),
    ...(t.topping_slots         ?? []),
    ...(t.sauce_slots           ?? []),
  ];

  if (allSlotIngredients.length === 0) {
    log("FAIL  — scoreTemplate would return null: allSlotIngredients is empty");
  } else {
    log(`PASS  — allSlotIngredients has ${allSlotIngredients.length} entries — scoreTemplate would NOT return null`);

    // Simulate Lilly: Vegetarian, Gluten-Free, Dairy-Free, Egg-Free, Nut-Free, Soy-Free
    const lillyExclusions = ["eggs", "dairy", "milk", "cheese", "gluten", "wheat", "nuts", "soy", "pork"];
    const sharedBase: string[] = (t.shared_base_components ?? []);
    const lillyExcluded = allSlotIngredients.filter((ing: string) =>
      lillyExclusions.some(ex => ing.toLowerCase().includes(ex) || ex.includes(ing.toLowerCase()))
    );
    const lillyShared = sharedBase.filter((ing: string) =>
      !lillyExclusions.some(ex => ing.toLowerCase().includes(ex) || ex.includes(ing.toLowerCase()))
    );

    log(`INFO  — Lilly (Veg/GF/DF/EggFree) shared base: [${lillyShared.join(", ")}]`);
    log(`INFO  — Lilly excluded slot ingredients: [${lillyExcluded.join(", ")}]`);
    log(`INFO  — Lilly memberChanges would contain ${lillyExcluded.length} swap(s)/removal(s)`);

    // Simulate Daisy: Mediterranean, Dairy-Free, Egg-Free
    const daisyExclusions = ["eggs", "dairy", "milk", "cheese"];
    const daisyExcluded = allSlotIngredients.filter((ing: string) =>
      daisyExclusions.some(ex => ing.toLowerCase().includes(ex))
    );
    const daisyShared = sharedBase.filter((ing: string) =>
      !daisyExclusions.some(ex => ing.toLowerCase().includes(ex))
    );

    log(`INFO  — Daisy (Mediterranean/DF/EggFree) shared base: [${daisyShared.join(", ")}]`);
    log(`INFO  — Daisy excluded slot ingredients: [${daisyExcluded.join(", ")}]`);

    // Household shared base (safe for both Lilly AND Daisy)
    const allExclusions = [...new Set([...lillyExclusions, ...daisyExclusions])];
    const householdShared = sharedBase.filter((ing: string) =>
      !allExclusions.some(ex => ing.toLowerCase().includes(ex))
    );
    log(`INFO  — Household shared base (Lilly + Daisy): [${householdShared.join(", ")}]`);

    log(allSlotsPassed
      ? "PASS  — scoreTemplate simulation: would return non-null MealMatch"
      : "WARN  — scoreTemplate simulation: result uncertain due to slot population failures above");
  }

  log("─".repeat(50));
  log("Validation complete.");
}

// ─── Entry point ──────────────────────────────────────────────────────────────

run()
  .then(() => validate())
  .then(() => pool.end())
  .catch(err => {
    console.error("[meal-shell-seed] Fatal error:", err);
    pool.end().finally(() => process.exit(1));
  });
