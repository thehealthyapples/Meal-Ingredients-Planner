/**
 * WS0 — Nutrition Knowledge Registry seed runner.
 *
 * Idempotent UPSERT by slug / by relationship pair, followed by a RECONCILE
 * sweep. The editorial datasets in shared/knowledge are the single source of
 * truth — re-running this script brings the database back in line with them.
 * Touches the knowledge_* tables exclusively.
 *
 * KNOW5 — PUBLISHING IS NO LONGER ONE-WAY.
 *
 * Before KNOW5 this script was a pure upsert: it contained no DELETE and no
 * deactivation sweep, so the database was a superset of its owner and could only
 * grow. Retiring a fact from shared/knowledge did not retire it from the DB —
 * `plant-protein` was removed from the nutrient vocabulary and still sat live in
 * `knowledge_nutrients` with 38 composition rows pointing at it. A bad import
 * could not be undone by fixing the seed and re-running it.
 *
 * It now reconciles: a row the owner no longer authors is DEACTIVATED
 * (`is_active = false`), never hard-deleted. Nothing is lost, the row keeps its
 * id and history, and re-adding it to the seed reactivates it on the next run.
 * That symmetry is what makes an import reversible.
 *
 * Usage:
 *   npm run seed:knowledge                # upsert, then reconcile
 *   npm run seed:knowledge -- --dry-run   # report what WOULD change; write nothing
 *   npm run seed:knowledge -- --no-reconcile   # upsert only (pre-KNOW5 behaviour)
 */
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, inArray, sql } from "drizzle-orm";
import pg from "pg";
import * as schema from "@shared/schema";
import {
  FOOD_SEED,
  NUTRIENT_SEED,
  HEALTH_BENEFIT_SEED,
  FOOD_NUTRIENT_SEED,
  FOOD_BENEFIT_SEED,
  NUTRIENT_BENEFIT_SEED,
  KNOWLEDGE_SEED_COUNTS,
  attachCompositionSources,
  validateKnowledgeSeed,
} from "@shared/knowledge";
import {
  PREPARATION_SEED,
  deriveFoodPreparations,
  validatePreparationSeed,
} from "@shared/knowledge/preparations";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

/** Exported so a test that imports the reconciliation helpers can close the pool. */
export { pool as seedPool, db as seedDb };

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const reconciling = !args.includes("--no-reconcile");

async function run() {
  // Refuse to seed inconsistent editorial data (dangling slugs / duplicates /
  // a citation that invents a claim).
  const problems = [...validateKnowledgeSeed(), ...validatePreparationSeed()];
  if (problems.length > 0) {
    console.error("Knowledge seed validation failed — refusing to seed:");
    for (const p of problems) console.error("  • " + p);
    process.exit(1);
  }

  if (dryRun) {
    console.log("DRY RUN — no rows will be written.\n");
    await reportReconciliation();
    await pool.end();
    return;
  }

  console.log("Seeding Nutrition Knowledge Registry (idempotent upsert)…");
  console.log("  Planned:", JSON.stringify(KNOWLEDGE_SEED_COUNTS));

  // ── Entities ────────────────────────────────────────────────────────────────
  await db.insert(schema.knowledgeFoods).values(FOOD_SEED).onConflictDoUpdate({
    target: schema.knowledgeFoods.slug,
    set: {
      name: sqlExcluded("name"), category: sqlExcluded("category"), subcategory: sqlExcluded("subcategory"),
      aliases: sqlExcluded("aliases"), description: sqlExcluded("description"), imageUrl: sqlExcluded("image_url"),
      commonForms: sqlExcluded("common_forms"), storageGuidance: sqlExcluded("storage_guidance"),
      seasonality: sqlExcluded("seasonality"), source: sqlExcluded("source"), displayOrder: sqlExcluded("display_order"),
      isActive: sqlExcluded("is_active"),
    },
  });

  await db.insert(schema.knowledgeNutrients).values(NUTRIENT_SEED).onConflictDoUpdate({
    target: schema.knowledgeNutrients.slug,
    set: {
      name: sqlExcluded("name"), description: sqlExcluded("description"), category: sqlExcluded("category"),
      // NK6M — `family` is editorial classification content; a re-seed must propagate
      // it onto EXISTING rows too, else an already-seeded member (e.g. beta-carotene,
      // lycopene) never receives its parent-family pointer on update. Omitting it here
      // was why only the newly-inserted carotenoids got classified.
      family: sqlExcluded("family"),
      source: sqlExcluded("source"), displayOrder: sqlExcluded("display_order"), isActive: sqlExcluded("is_active"),
    },
  });

  await db.insert(schema.knowledgeHealthBenefits).values(HEALTH_BENEFIT_SEED).onConflictDoUpdate({
    target: schema.knowledgeHealthBenefits.slug,
    set: {
      name: sqlExcluded("name"), description: sqlExcluded("description"), icon: sqlExcluded("icon"),
      source: sqlExcluded("source"), displayOrder: sqlExcluded("display_order"), isActive: sqlExcluded("is_active"),
    },
  });

  // ── Relationships ─────────────────────────────────────────────────────────────
  //
  // KNOW5: composition citations are attached HERE, at the single writer, rather
  // than inside shared/knowledge/food-relationships.ts — that module is
  // client-bundled through food-report-adapter.ts, and the browser must never
  // carry citations for claims it is forbidden to speak (KNOW4). Same rule as
  // nutrient↔benefit below: source_refs is seeded (citations are editorial data);
  // reviewed_at / reviewed_by are NOT, because sign-off is a human decision
  // recorded only in the DB (npm run knowledge:signoff). Re-seeding must never
  // grant or revoke a sign-off (Rule KC9).
  await upsertFoodNutrients(db);

  await db.insert(schema.knowledgeFoodBenefits).values(FOOD_BENEFIT_SEED).onConflictDoUpdate({
    target: [schema.knowledgeFoodBenefits.foodSlug, schema.knowledgeFoodBenefits.benefitSlug],
    set: { evidenceStrength: sqlExcluded("evidence_strength"), ranking: sqlExcluded("ranking"), source: sqlExcluded("source"), isActive: sqlExcluded("is_active") },
  });

  await db.insert(schema.knowledgeNutrientBenefits).values(NUTRIENT_BENEFIT_SEED).onConflictDoUpdate({
    target: [schema.knowledgeNutrientBenefits.nutrientSlug, schema.knowledgeNutrientBenefits.benefitSlug],
    set: { evidenceStrength: sqlExcluded("evidence_strength"), ranking: sqlExcluded("ranking"), source: sqlExcluded("source"), sourceRefs: sqlExcluded("source_refs"), isActive: sqlExcluded("is_active") },
  });

  // ── Preparation Knowledge (PHASE5A — WS5A; PKCA §7 Phase 4) ───────────────────
  //
  // EXISTENCE ONLY. The catalogue, and the food↔preparation edges projected from
  // the `commonForms` an editor already authored. Not one nutrition claim is made
  // here: an EFFECT (that a preparation measurably CHANGES something) lives in
  // knowledge_preparation_effects, needs a Layer-1 citation and a named human
  // sign-off, and is NEVER seeded — automation authors candidates, it does not
  // publish them (Rule KC9). This seeder therefore does not write that table at
  // all, and the platform renders an honest "no reviewed note" for every
  // preparation until a human signs one off (npm run knowledge:signoff).
  await db.insert(schema.knowledgePreparations).values(PREPARATION_SEED).onConflictDoUpdate({
    target: schema.knowledgePreparations.slug,
    set: {
      name: sqlExcluded("name"), prepType: sqlExcluded("prep_type"), description: sqlExcluded("description"),
      family: sqlExcluded("family"), source: sqlExcluded("source"), displayOrder: sqlExcluded("display_order"),
      isActive: sqlExcluded("is_active"),
    },
  });

  const foodPreparations = deriveFoodPreparations(FOOD_SEED);
  if (foodPreparations.length > 0) {
    await db.insert(schema.knowledgeFoodPreparations).values(foodPreparations).onConflictDoUpdate({
      target: [schema.knowledgeFoodPreparations.foodSlug, schema.knowledgeFoodPreparations.preparationSlug],
      set: { ranking: sqlExcluded("ranking"), source: sqlExcluded("source"), isActive: sqlExcluded("is_active") },
    });
  }

  // ── Reconcile: retire what the owner no longer authors ─────────────────────────
  if (reconciling) {
    console.log("\nReconciling (deactivating rows the seed no longer owns)…");
    const deactivated = await deactivateAbsentRows(db);
    const total = Object.values(deactivated).reduce((a, b) => a + b, 0);
    if (total === 0) console.log("  Nothing to retire — the database matches its owner.");
    else for (const [table, count] of Object.entries(deactivated)) if (count > 0) console.log(`  ${table}: ${count} row(s) deactivated`);
  } else {
    console.log("\n--no-reconcile: skipping the deactivation sweep (the DB may be a superset of its owner).");
  }

  // ── Report ────────────────────────────────────────────────────────────────────
  const counts = await Promise.all([
    activeCount(schema.knowledgeFoods),
    activeCount(schema.knowledgeNutrients),
    activeCount(schema.knowledgeHealthBenefits),
    activeCount(schema.knowledgeFoodNutrients),
    activeCount(schema.knowledgeFoodBenefits),
    activeCount(schema.knowledgeNutrientBenefits),
    activeCount(schema.knowledgePreparations),
    activeCount(schema.knowledgeFoodPreparations),
    activeCount(schema.knowledgePreparationEffects),
  ]);
  console.log("\nDone. Active DB row totals:");
  console.log(`  knowledge_foods               : ${counts[0]}`);
  console.log(`  knowledge_nutrients           : ${counts[1]}`);
  console.log(`  knowledge_health_benefits     : ${counts[2]}`);
  console.log(`  knowledge_food_nutrients      : ${counts[3]}`);
  console.log(`  knowledge_food_benefits       : ${counts[4]}`);
  console.log(`  knowledge_nutrient_benefits   : ${counts[5]}`);
  console.log(`  knowledge_preparations        : ${counts[6]}`);
  console.log(`  knowledge_food_preparations   : ${counts[7]}`);
  console.log(`  knowledge_preparation_effects : ${counts[8]}  (seed writes none — evidence-gated, human sign-off only)`);

  await pool.end();
}

// ── Reconciliation (KNOW5) ─────────────────────────────────────────────────────
//
// SOFT ONLY. There is no DELETE in this file and there must never be one: a
// deactivated row keeps its id, its citations and its sign-off history, so the
// operation is reversible by re-adding the row to the seed and re-running.
// test-know5-evidence-contract.ts asserts this file contains no delete, AND
// drives the two exported functions below through a deactivate → reactivate
// round-trip inside a rolled-back transaction. A grep is not a proof.
//
// Both take the database handle as a parameter so the test can pass a
// transaction. `Db` is a drizzle handle or a transaction — structurally the same.
type Db = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Upsert the composition edge, citations attached, sign-off untouched. */
export async function upsertFoodNutrients(dbLike: Db): Promise<void> {
  await dbLike.insert(schema.knowledgeFoodNutrients).values(attachCompositionSources(FOOD_NUTRIENT_SEED)).onConflictDoUpdate({
    target: [schema.knowledgeFoodNutrients.foodSlug, schema.knowledgeFoodNutrients.nutrientSlug],
    set: { amount: sqlExcluded("amount"), confidence: sqlExcluded("confidence"), ranking: sqlExcluded("ranking"), source: sqlExcluded("source"), sourceRefs: sqlExcluded("source_refs"), isActive: sqlExcluded("is_active") },
  });
}

/**
 * Identity keys the seed currently authors, per table.
 *
 * NOTE what is deliberately absent: `knowledge_preparation_effects`. The seed
 * does NOT author an effect and must never reconcile that table. An effect row
 * is created by the review workflow and signed off by a named human; a
 * reconciliation sweep here would deactivate every human sign-off on the next
 * re-seed, because the seed has no record of authoring any of them. The rule is
 * general and worth stating plainly: this sweep may only retire rows this seed
 * is the author of. It is not a garbage collector for the whole schema.
 */
function ownedKeys() {
  return {
    knowledge_foods: new Set(FOOD_SEED.map((f) => f.slug)),
    knowledge_nutrients: new Set(NUTRIENT_SEED.map((n) => n.slug)),
    knowledge_health_benefits: new Set(HEALTH_BENEFIT_SEED.map((b) => b.slug)),
    knowledge_food_nutrients: new Set(FOOD_NUTRIENT_SEED.map((r) => `${r.foodSlug}→${r.nutrientSlug}`)),
    knowledge_food_benefits: new Set(FOOD_BENEFIT_SEED.map((r) => `${r.foodSlug}→${r.benefitSlug}`)),
    knowledge_nutrient_benefits: new Set(NUTRIENT_BENEFIT_SEED.map((r) => `${r.nutrientSlug}→${r.benefitSlug}`)),
    knowledge_preparations: new Set(PREPARATION_SEED.map((p) => p.slug)),
    knowledge_food_preparations: new Set(
      deriveFoodPreparations(FOOD_SEED).map((r) => `${r.foodSlug}→${r.preparationSlug}`),
    ),
  };
}

/** Active DB rows whose identity the seed no longer authors, per table. */
async function orphanedRows(): Promise<Record<string, string[]>> {
  const owned = ownedKeys();
  const [foods, nutrients, benefits, fn, fb, nb, preps, fp] = await Promise.all([
    db.select({ k: schema.knowledgeFoods.slug }).from(schema.knowledgeFoods).where(eq(schema.knowledgeFoods.isActive, true)),
    db.select({ k: schema.knowledgeNutrients.slug }).from(schema.knowledgeNutrients).where(eq(schema.knowledgeNutrients.isActive, true)),
    db.select({ k: schema.knowledgeHealthBenefits.slug }).from(schema.knowledgeHealthBenefits).where(eq(schema.knowledgeHealthBenefits.isActive, true)),
    db.select({ a: schema.knowledgeFoodNutrients.foodSlug, b: schema.knowledgeFoodNutrients.nutrientSlug }).from(schema.knowledgeFoodNutrients).where(eq(schema.knowledgeFoodNutrients.isActive, true)),
    db.select({ a: schema.knowledgeFoodBenefits.foodSlug, b: schema.knowledgeFoodBenefits.benefitSlug }).from(schema.knowledgeFoodBenefits).where(eq(schema.knowledgeFoodBenefits.isActive, true)),
    db.select({ a: schema.knowledgeNutrientBenefits.nutrientSlug, b: schema.knowledgeNutrientBenefits.benefitSlug }).from(schema.knowledgeNutrientBenefits).where(eq(schema.knowledgeNutrientBenefits.isActive, true)),
    db.select({ k: schema.knowledgePreparations.slug }).from(schema.knowledgePreparations).where(eq(schema.knowledgePreparations.isActive, true)),
    db.select({ a: schema.knowledgeFoodPreparations.foodSlug, b: schema.knowledgeFoodPreparations.preparationSlug }).from(schema.knowledgeFoodPreparations).where(eq(schema.knowledgeFoodPreparations.isActive, true)),
  ]);
  const pairKeys = (rows: { a: string; b: string }[]) => rows.map((r) => `${r.a}→${r.b}`);
  return {
    knowledge_foods: foods.map((r) => r.k).filter((k) => !owned.knowledge_foods.has(k)),
    knowledge_nutrients: nutrients.map((r) => r.k).filter((k) => !owned.knowledge_nutrients.has(k)),
    knowledge_health_benefits: benefits.map((r) => r.k).filter((k) => !owned.knowledge_health_benefits.has(k)),
    knowledge_food_nutrients: pairKeys(fn).filter((k) => !owned.knowledge_food_nutrients.has(k)),
    knowledge_food_benefits: pairKeys(fb).filter((k) => !owned.knowledge_food_benefits.has(k)),
    knowledge_nutrient_benefits: pairKeys(nb).filter((k) => !owned.knowledge_nutrient_benefits.has(k)),
    knowledge_preparations: preps.map((r) => r.k).filter((k) => !owned.knowledge_preparations.has(k)),
    knowledge_food_preparations: pairKeys(fp).filter((k) => !owned.knowledge_food_preparations.has(k)),
  };
}

async function reportReconciliation() {
  const orphans = await orphanedRows();
  const total = Object.values(orphans).reduce((a, r) => a + r.length, 0);
  console.log(`Reconciliation would deactivate ${total} row(s) the seed no longer owns:\n`);
  for (const [table, keys] of Object.entries(orphans)) {
    if (keys.length === 0) continue;
    console.log(`  ${table}: ${keys.length}`);
    for (const k of keys.slice(0, 10)) console.log(`    • ${k}`);
    if (keys.length > 10) console.log(`    … and ${keys.length - 10} more`);
  }
  if (total === 0) console.log("  Nothing — the database matches its owner.");
  console.log("\nNo hard deletes: these rows would be set is_active = false and remain restorable by re-seeding.");
}

/**
 * Deactivate (never delete) every active row the seed no longer authors.
 *
 * Orphan identification happens in JS against the ids read back from the DB,
 * then a single UPDATE … WHERE id IN (…) per table. The relationship tables are
 * keyed on a pair, which `notInArray` cannot express, and hand-rolled SQL row
 * comparison against a VALUES list leaves the parameters untyped. Both tables
 * are small enough (thousands of rows) that resolving ownership in memory is
 * both cheaper to reason about and impossible to get subtly wrong.
 */
export async function deactivateAbsentRows(dbLike: Db): Promise<Record<string, number>> {
  const owned = ownedKeys();
  const t = schema;

  return {
    knowledge_foods: await deactivateOrphans(dbLike, t.knowledgeFoods, owned.knowledge_foods,
      { id: t.knowledgeFoods.id, a: t.knowledgeFoods.slug }),
    knowledge_nutrients: await deactivateOrphans(dbLike, t.knowledgeNutrients, owned.knowledge_nutrients,
      { id: t.knowledgeNutrients.id, a: t.knowledgeNutrients.slug }),
    knowledge_health_benefits: await deactivateOrphans(dbLike, t.knowledgeHealthBenefits, owned.knowledge_health_benefits,
      { id: t.knowledgeHealthBenefits.id, a: t.knowledgeHealthBenefits.slug }),
    knowledge_food_nutrients: await deactivateOrphans(dbLike, t.knowledgeFoodNutrients, owned.knowledge_food_nutrients,
      { id: t.knowledgeFoodNutrients.id, a: t.knowledgeFoodNutrients.foodSlug, b: t.knowledgeFoodNutrients.nutrientSlug }),
    knowledge_food_benefits: await deactivateOrphans(dbLike, t.knowledgeFoodBenefits, owned.knowledge_food_benefits,
      { id: t.knowledgeFoodBenefits.id, a: t.knowledgeFoodBenefits.foodSlug, b: t.knowledgeFoodBenefits.benefitSlug }),
    knowledge_nutrient_benefits: await deactivateOrphans(dbLike, t.knowledgeNutrientBenefits, owned.knowledge_nutrient_benefits,
      { id: t.knowledgeNutrientBenefits.id, a: t.knowledgeNutrientBenefits.nutrientSlug, b: t.knowledgeNutrientBenefits.benefitSlug }),
    knowledge_preparations: await deactivateOrphans(dbLike, t.knowledgePreparations, owned.knowledge_preparations,
      { id: t.knowledgePreparations.id, a: t.knowledgePreparations.slug }),
    knowledge_food_preparations: await deactivateOrphans(dbLike, t.knowledgeFoodPreparations, owned.knowledge_food_preparations,
      { id: t.knowledgeFoodPreparations.id, a: t.knowledgeFoodPreparations.foodSlug, b: t.knowledgeFoodPreparations.preparationSlug }),
    // knowledge_preparation_effects is INTENTIONALLY not reconciled — see ownedKeys().
  };
}

async function deactivateOrphans(
  dbLike: Db, table: any, owned: ReadonlySet<string>, cols: { id: any; a: any; b?: any },
): Promise<number> {
  const select: Record<string, any> = { id: cols.id, a: cols.a };
  if (cols.b) select.b = cols.b;
  const rows = await dbLike.select(select).from(table).where(eq(table.isActive, true));

  const orphanIds = rows
    .filter((r: any) => !owned.has(cols.b ? `${r.a}→${r.b}` : r.a))
    .map((r: any) => r.id);
  if (orphanIds.length === 0) return 0;

  // is_active = false. There is no DELETE here, by design (KNOW5 rule: no hard deletes).
  await dbLike.update(table).set({ isActive: false }).where(inArray(cols.id, orphanIds));
  return orphanIds.length;
}

async function activeCount(table: any): Promise<number> {
  const rows: any = await db.select({ n: sql<number>`count(*)::int` }).from(table).where(eq(table.isActive, true));
  return rows[0].n;
}

// Reference the row being inserted (Postgres EXCLUDED) for the UPDATE SET clause.
function sqlExcluded(column: string) {
  return sql.raw(`excluded.${column}`);
}

// Only seed when executed directly. The reconciliation helpers above are
// exported so test-know5-evidence-contract.ts can drive them through a real
// deactivate → reactivate round-trip inside a rolled-back transaction; importing
// this module must never seed the database as a side effect.
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  run().catch((err) => {
    console.error("Knowledge seed failed:", err);
    process.exit(1);
  });
}
