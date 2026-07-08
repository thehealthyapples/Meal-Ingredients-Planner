/**
 * WS0 — Nutrition Knowledge Registry seed runner.
 *
 * Idempotent UPSERT by slug / by relationship pair. The editorial datasets in
 * shared/knowledge are the single source of truth — re-running this script
 * brings the database back in line with them (edits propagate, nothing is
 * silently duplicated). Additive only: touches the knowledge_* tables exclusively.
 *
 * Usage:  npm run seed:knowledge
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
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
  validateKnowledgeSeed,
} from "@shared/knowledge";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function run() {
  // Refuse to seed inconsistent editorial data (dangling slugs / duplicates).
  const problems = validateKnowledgeSeed();
  if (problems.length > 0) {
    console.error("Knowledge seed validation failed — refusing to seed:");
    for (const p of problems) console.error("  • " + p);
    process.exit(1);
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
  await db.insert(schema.knowledgeFoodNutrients).values(FOOD_NUTRIENT_SEED).onConflictDoUpdate({
    target: [schema.knowledgeFoodNutrients.foodSlug, schema.knowledgeFoodNutrients.nutrientSlug],
    set: { amount: sqlExcluded("amount"), confidence: sqlExcluded("confidence"), ranking: sqlExcluded("ranking"), source: sqlExcluded("source"), isActive: sqlExcluded("is_active") },
  });

  await db.insert(schema.knowledgeFoodBenefits).values(FOOD_BENEFIT_SEED).onConflictDoUpdate({
    target: [schema.knowledgeFoodBenefits.foodSlug, schema.knowledgeFoodBenefits.benefitSlug],
    set: { evidenceStrength: sqlExcluded("evidence_strength"), ranking: sqlExcluded("ranking"), source: sqlExcluded("source"), isActive: sqlExcluded("is_active") },
  });

  // PKC Phase 0: source_refs is seeded (citations are editorial data);
  // reviewed_at is deliberately NOT in the SET list — sign-off is a human
  // decision recorded in the DB only (npm run knowledge:signoff), and
  // re-seeding must never grant or revoke it (Rule KC9).
  await db.insert(schema.knowledgeNutrientBenefits).values(NUTRIENT_BENEFIT_SEED).onConflictDoUpdate({
    target: [schema.knowledgeNutrientBenefits.nutrientSlug, schema.knowledgeNutrientBenefits.benefitSlug],
    set: { evidenceStrength: sqlExcluded("evidence_strength"), ranking: sqlExcluded("ranking"), source: sqlExcluded("source"), sourceRefs: sqlExcluded("source_refs"), isActive: sqlExcluded("is_active") },
  });

  // ── Report ────────────────────────────────────────────────────────────────────
  const counts = await Promise.all([
    db.$count(schema.knowledgeFoods),
    db.$count(schema.knowledgeNutrients),
    db.$count(schema.knowledgeHealthBenefits),
    db.$count(schema.knowledgeFoodNutrients),
    db.$count(schema.knowledgeFoodBenefits),
    db.$count(schema.knowledgeNutrientBenefits),
  ]);
  console.log("Done. DB row totals:");
  console.log(`  knowledge_foods             : ${counts[0]}`);
  console.log(`  knowledge_nutrients         : ${counts[1]}`);
  console.log(`  knowledge_health_benefits   : ${counts[2]}`);
  console.log(`  knowledge_food_nutrients    : ${counts[3]}`);
  console.log(`  knowledge_food_benefits     : ${counts[4]}`);
  console.log(`  knowledge_nutrient_benefits : ${counts[5]}`);

  await pool.end();
}

// Reference the row being inserted (Postgres EXCLUDED) for the UPDATE SET clause.
function sqlExcluded(column: string) {
  return sql.raw(`excluded.${column}`);
}

run().catch((err) => {
  console.error("Knowledge seed failed:", err);
  process.exit(1);
});
