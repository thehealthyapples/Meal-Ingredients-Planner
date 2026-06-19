/**
 * WS2A — Canonical Food Identity seed runner.
 *
 * Idempotent UPSERT by slug / alias_key. The editorial datasets in
 * shared/canonical are the single source of truth — re-running brings the DB
 * back in line with them. ADDITIVE ONLY: touches the four canonical_* /
 * diversity_group / food_variety tables exclusively. It reads nothing from and
 * writes nothing to Plant Diversity, Pantry, Shopping, Planner, Boosts or the
 * Analyser. Running it changes NO user-facing behaviour.
 *
 * Order matters (FK dependencies): diversity_group → canonical_food →
 * food_variety + canonical_food_alias.
 *
 * Usage:  npm run seed:canonical
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import pg from "pg";
import * as schema from "@shared/schema";
import {
  DIVERSITY_GROUP_SEED,
  CANONICAL_FOOD_SEED,
  FOOD_VARIETY_SEED,
  CANONICAL_FOOD_ALIAS_SEED,
  CANONICAL_SEED_COUNTS,
  validateCanonicalSeed,
} from "@shared/canonical";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

function sqlExcluded(column: string) {
  return sql.raw(`excluded.${column}`);
}

async function run() {
  // Refuse to seed inconsistent / forked editorial data.
  const problems = validateCanonicalSeed();
  if (problems.length > 0) {
    console.error("Canonical seed validation failed — refusing to seed:");
    for (const p of problems) console.error("  • " + p);
    process.exit(1);
  }

  console.log("Seeding Canonical Food Identity (idempotent upsert)…");
  console.log("  Planned:", JSON.stringify(CANONICAL_SEED_COUNTS));

  // ── 1. Diversity groups ───────────────────────────────────────────────────
  await db.insert(schema.diversityGroups).values(DIVERSITY_GROUP_SEED).onConflictDoUpdate({
    target: schema.diversityGroups.slug,
    set: {
      displayName: sqlExcluded("display_name"), description: sqlExcluded("description"),
      countAsSinglePlant: sqlExcluded("count_as_single_plant"), source: sqlExcluded("source"),
      isActive: sqlExcluded("is_active"), updatedAt: sql.raw("now()"),
    },
  });

  // ── 2. Canonical foods ────────────────────────────────────────────────────
  await db.insert(schema.canonicalFoods).values(CANONICAL_FOOD_SEED).onConflictDoUpdate({
    target: schema.canonicalFoods.slug,
    set: {
      name: sqlExcluded("name"), category: sqlExcluded("category"), subcategory: sqlExcluded("subcategory"),
      description: sqlExcluded("description"), knowledgeFoodSlug: sqlExcluded("knowledge_food_slug"),
      diversityGroupSlug: sqlExcluded("diversity_group_slug"), status: sqlExcluded("status"),
      source: sqlExcluded("source"), updatedAt: sql.raw("now()"),
    },
  });

  // Resolve canonical slugs → ids for the child tables.
  const foods = await db.select({ id: schema.canonicalFoods.id, slug: schema.canonicalFoods.slug }).from(schema.canonicalFoods);
  const idBySlug = new Map(foods.map((f) => [f.slug, f.id]));

  // ── 3. Food varieties ─────────────────────────────────────────────────────
  const varietyRows = FOOD_VARIETY_SEED.map((v) => ({
    canonicalFoodId: idBySlug.get(v.canonicalFoodSlug)!,
    slug: v.slug, name: v.name, description: v.description, displayOrder: v.displayOrder,
  }));
  if (varietyRows.length) {
    await db.insert(schema.foodVarieties).values(varietyRows).onConflictDoUpdate({
      target: schema.foodVarieties.slug,
      set: {
        canonicalFoodId: sqlExcluded("canonical_food_id"), name: sqlExcluded("name"),
        description: sqlExcluded("description"), displayOrder: sqlExcluded("display_order"),
        status: sqlExcluded("status"), source: sqlExcluded("source"), updatedAt: sql.raw("now()"),
      },
    });
  }

  // ── 4. Aliases ────────────────────────────────────────────────────────────
  const aliasRows = CANONICAL_FOOD_ALIAS_SEED.map((a) => ({
    canonicalFoodId: idBySlug.get(a.canonicalFoodSlug)!,
    alias: a.alias, aliasKey: a.aliasKey, aliasType: a.aliasType,
  }));
  if (aliasRows.length) {
    await db.insert(schema.canonicalFoodAliases).values(aliasRows).onConflictDoUpdate({
      target: schema.canonicalFoodAliases.aliasKey,
      set: {
        canonicalFoodId: sqlExcluded("canonical_food_id"), alias: sqlExcluded("alias"),
        aliasType: sqlExcluded("alias_type"), source: sqlExcluded("source"), isActive: sqlExcluded("is_active"),
      },
    });
  }

  // ── Report ────────────────────────────────────────────────────────────────
  const counts = await Promise.all([
    db.$count(schema.diversityGroups),
    db.$count(schema.canonicalFoods),
    db.$count(schema.foodVarieties),
    db.$count(schema.canonicalFoodAliases),
  ]);
  console.log("Done. DB row totals:");
  console.log(`  diversity_group       : ${counts[0]}`);
  console.log(`  canonical_food        : ${counts[1]}`);
  console.log(`  food_variety          : ${counts[2]}`);
  console.log(`  canonical_food_alias  : ${counts[3]}`);

  await pool.end();
}

run().catch((err) => {
  console.error("Canonical seed failed:", err);
  process.exit(1);
});
