/**
 * WS2A — Canonical Food Identity seed runner.
 *
 * Idempotent UPSERT by slug / alias_key, followed by a RECONCILE sweep. The
 * editorial datasets in shared/canonical are the single source of truth —
 * re-running brings the DB back in line with them. Touches the four canonical_* /
 * diversity_group / food_variety tables exclusively. It reads nothing from and
 * writes nothing to Pantry, Shopping, Planner, Boosts or the Analyser.
 *
 * Order matters (FK dependencies): diversity_group → canonical_food →
 * food_variety + canonical_food_alias.
 *
 * PUB1 — PUBLISHING IS NO LONGER ONE-WAY.
 *
 * Before PUB1 this script was a pure upsert: it contained no deactivation sweep,
 * so the projection was a superset of its owner and could only grow. A food
 * corrected out of CANONICAL_SEED stayed live in `canonical_food` forever, and
 * `validateCanonicalSeed()` — which reads the seed, not the database — could not
 * see that it had. CPI1 §4.3 named it; CPV1's `fi-reconcile-sweep` check fails
 * until this exists.
 *
 * It now reconciles on exactly the KNOW5 terms the knowledge registry set
 * (seed-knowledge-registry.ts): a row the owner no longer authors is RETIRED
 * (`status = 'retired'` / `is_active = false`), never hard-deleted. Nothing is
 * lost, the row keeps its id and history, and re-adding it to the seed revives it
 * on the next run. That symmetry is what makes a publication reversible — and it
 * is why `canonical_food.status` has always carried a `retired` value (schema.ts:
 * "identities are retireable, never deleted").
 *
 * WHAT THE SWEEP MAY NOT TOUCH. It retires only rows this seed PUBLISHED — the
 * active canonical tier. The `tier = 'catalogue'` / `status = 'draft'` rows are
 * the WS0.11 USDA candidate pool: Stage 1 (CANDIDATE) of the graduation pipeline
 * in PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE §1.1, authored by a different
 * writer and awaiting human promotion. They are not a stale publication and this
 * seed never authored them. KNOW5 stated the general rule and it holds here: this
 * sweep may only retire rows this seed is the author of. It is not a garbage
 * collector for the whole table.
 *
 * Usage:
 *   npm run seed:canonical                  # upsert, then reconcile
 *   npm run seed:canonical -- --dry-run     # report what WOULD change; write nothing
 *   npm run seed:canonical -- --no-reconcile   # upsert only (pre-PUB1 behaviour)
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { and, eq, inArray, sql } from "drizzle-orm";
import pg from "pg";
import * as schema from "@shared/schema";
import {
  DIVERSITY_GROUP_SEED,
  CANONICAL_FOOD_SEED,
  FOOD_VARIETY_SEED,
  CANONICAL_FOOD_ALIAS_SEED,
  CANONICAL_SEED_COUNTS,
  validateCanonicalSeed,
  canonicalSeedBindingWarnings,
  KNOWLEDGE_BINDING_COVERAGE,
} from "@shared/canonical";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const reconciling = !args.includes("--no-reconcile");

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

  // KNOW3 — bindings the audit accepted but could not verify by name equality
  // (e.g. `peas → garden-peas`). Non-fatal, and never silent: an unprinted
  // warning is an unknown, not a tracked gap.
  const bindingWarnings = canonicalSeedBindingWarnings();
  if (bindingWarnings.length > 0) {
    console.warn(`Canonical → knowledge bindings resting on editorial judgement (${bindingWarnings.length}):`);
    for (const w of bindingWarnings) console.warn("  ⚠ " + w);
  }

  if (dryRun) {
    console.log("DRY RUN — no rows will be written.\n");
    await reportReconciliation();
    await pool.end();
    return;
  }

  console.log("Seeding Canonical Food Identity (idempotent upsert)…");
  console.log("  Planned:", JSON.stringify(CANONICAL_SEED_COUNTS));
  console.log("  Knowledge bindings:", JSON.stringify(KNOWLEDGE_BINDING_COVERAGE));

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
      // NK6R — `family` is editorial identity structure; a re-seed must propagate it,
      // otherwise a food that gains a parent (stilton → blue-cheese) never receives
      // its pointer on update. Omitting it here would silently strip the hierarchy.
      family: sqlExcluded("family"),
      description: sqlExcluded("description"), knowledgeFoodSlug: sqlExcluded("knowledge_food_slug"),
      diversityGroupSlug: sqlExcluded("diversity_group_slug"), status: sqlExcluded("status"),
      source: sqlExcluded("source"),
      // WS0X.5 — food context (single owner). Idempotent: re-seeding re-aligns to the editorial seed.
      availability: sqlExcluded("availability"),
      availabilityModifiers: sqlExcluded("availability_modifiers"),
      peakSeasons: sqlExcluded("peak_seasons"),
      originRegion: sqlExcluded("origin_region"),
      // M4.5 — fermented attribute.
      fermented: sqlExcluded("fermented"),
      updatedAt: sql.raw("now()"),
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

  // ── Reconcile: retire what the owner no longer authors ────────────────────
  if (reconciling) {
    console.log("\nReconciling (retiring rows the seed no longer owns)…");
    const retired = await retireAbsentRows(db);
    const total = Object.values(retired).reduce((a, b) => a + b, 0);
    if (total === 0) console.log("  Nothing to retire — the projection matches its owner.");
    else for (const [table, count] of Object.entries(retired)) if (count > 0) console.log(`  ${table}: ${count} row(s) retired`);
  } else {
    console.log("\n--no-reconcile: skipping the retirement sweep (the projection may be a superset of its owner).");
  }

  // ── Report ────────────────────────────────────────────────────────────────
  // PUBLISHED rows only. A retired row still occupies the table (soft retirement
  // is the whole point), and the candidate pool is not a publication — so a raw
  // table count would answer a question nobody asked.
  const counts = await Promise.all([
    publishedCount(schema.diversityGroups),
    publishedCount(schema.canonicalFoods),
    publishedCount(schema.foodVarieties),
    publishedCount(schema.canonicalFoodAliases),
  ]);
  console.log("\nDone. Published (active) DB row totals:");
  console.log(`  diversity_group       : ${counts[0]}`);
  console.log(`  canonical_food        : ${counts[1]}`);
  console.log(`  food_variety          : ${counts[2]}`);
  console.log(`  canonical_food_alias  : ${counts[3]}`);

  const bound = await db.$count(
    schema.canonicalFoods,
    and(eq(schema.canonicalFoods.status, "active"), sql`${schema.canonicalFoods.knowledgeFoodSlug} is not null`),
  );
  console.log(`  └─ bound to a knowledge food : ${bound}`);

  await pool.end();
}

// ── Reconciliation (PUB1) ────────────────────────────────────────────────────
//
// SOFT ONLY. There is no DELETE in this file and there must never be one: a
// retired row keeps its id, its aliases and its history, so the operation is
// reversible by re-adding the row to the seed and re-running. This mirrors
// seed-knowledge-registry.ts (KNOW5) deliberately — one publication law, applied
// identically on both halves of the platform.
type Db = typeof db;

/** Identity keys the seed currently authors, per table. */
function ownedKeys() {
  return {
    diversity_group: new Set(DIVERSITY_GROUP_SEED.map((g) => g.slug)),
    canonical_food: new Set(CANONICAL_FOOD_SEED.map((f) => f.slug)),
    food_variety: new Set(FOOD_VARIETY_SEED.map((v) => v.slug)),
    canonical_food_alias: new Set(CANONICAL_FOOD_ALIAS_SEED.map((a) => a.aliasKey)),
  };
}

/**
 * Retire (never delete) every published row the seed no longer authors.
 *
 * `canonical_food` and `food_variety` retire by `status`; `diversity_group` and
 * `canonical_food_alias` by `is_active` — each table's existing retirement axis,
 * no new column and no new vocabulary.
 *
 * The canonical_food sweep is scoped to `status = 'active'`, which is what keeps
 * it off the 309 draft catalogue candidates. See the header: the sweep retires
 * publications, not candidates.
 */
export async function retireAbsentRows(dbLike: Db): Promise<Record<string, number>> {
  const owned = ownedKeys();
  const t = schema;
  return {
    canonical_food: await retireOrphans(dbLike, t.canonicalFoods, owned.canonical_food, t.canonicalFoods.id, t.canonicalFoods.slug,
      eq(t.canonicalFoods.status, "active"), { status: "retired" }),
    food_variety: await retireOrphans(dbLike, t.foodVarieties, owned.food_variety, t.foodVarieties.id, t.foodVarieties.slug,
      eq(t.foodVarieties.status, "active"), { status: "retired" }),
    diversity_group: await retireOrphans(dbLike, t.diversityGroups, owned.diversity_group, t.diversityGroups.id, t.diversityGroups.slug,
      eq(t.diversityGroups.isActive, true), { isActive: false }),
    canonical_food_alias: await retireOrphans(dbLike, t.canonicalFoodAliases, owned.canonical_food_alias, t.canonicalFoodAliases.id, t.canonicalFoodAliases.aliasKey,
      eq(t.canonicalFoodAliases.isActive, true), { isActive: false }),
  };
}

async function retireOrphans(
  dbLike: Db, table: any, owned: ReadonlySet<string>, idCol: any, keyCol: any,
  publishedOnly: any, retirement: Record<string, unknown>,
): Promise<number> {
  const rows = await dbLike.select({ id: idCol, k: keyCol }).from(table).where(publishedOnly);
  const orphanIds = rows.filter((r: any) => !owned.has(r.k)).map((r: any) => r.id);
  if (orphanIds.length === 0) return 0;

  // Soft retirement. There is no DELETE here, by design.
  await dbLike.update(table).set(retirement).where(inArray(idCol, orphanIds));
  return orphanIds.length;
}

/** Published rows the seed no longer authors, per table — the dry-run view. */
async function reportReconciliation() {
  const owned = ownedKeys();
  const t = schema;
  const scan = async (label: string, table: any, keyCol: any, publishedOnly: any, ownedSet: ReadonlySet<string>) => {
    const rows = await db.select({ k: keyCol }).from(table).where(publishedOnly);
    const orphans = rows.map((r: any) => String(r.k)).filter((k) => !ownedSet.has(k));
    const live = new Set(rows.map((r: any) => String(r.k)));
    const unpublished = Array.from(ownedSet).filter((k) => !live.has(k));
    console.log(`${label}`);
    console.log(`  owner declares ${ownedSet.size}; ${rows.length} published — ${unpublished.length} not yet published, ${orphans.length} to retire`);
    for (const k of orphans.slice(0, 10)) console.log(`    • retire: ${k}`);
    if (orphans.length > 10) console.log(`    … and ${orphans.length - 10} more`);
  };
  await scan("diversity_group", t.diversityGroups, t.diversityGroups.slug, eq(t.diversityGroups.isActive, true), owned.diversity_group);
  await scan("canonical_food", t.canonicalFoods, t.canonicalFoods.slug, eq(t.canonicalFoods.status, "active"), owned.canonical_food);
  await scan("food_variety", t.foodVarieties, t.foodVarieties.slug, eq(t.foodVarieties.status, "active"), owned.food_variety);
  await scan("canonical_food_alias", t.canonicalFoodAliases, t.canonicalFoodAliases.aliasKey, eq(t.canonicalFoodAliases.isActive, true), owned.canonical_food_alias);

  const candidates = await db.$count(schema.canonicalFoods, eq(schema.canonicalFoods.status, "draft"));
  console.log(`\ncandidate pool (status='draft'): ${candidates} row(s) — NOT touched by the sweep (Stage 1, awaiting human promotion).`);
  console.log("\nNo hard deletes: retired rows keep their id and history, and are revived by re-adding them to the seed.");
}

async function publishedCount(table: any): Promise<number> {
  const col = table === schema.canonicalFoods || table === schema.foodVarieties
    ? eq(table.status, "active")
    : eq(table.isActive, true);
  return db.$count(table, col);
}

run().catch((err) => {
  console.error("Canonical seed failed:", err);
  process.exit(1);
});
