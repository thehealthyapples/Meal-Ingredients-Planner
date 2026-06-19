/**
 * WS2A — Canonical Food Identity verification tests.
 *
 * Two layers:
 *   1. Pure checks (no DB) — seed integrity, resolver behaviour, trust checks,
 *      shadow-mode parity. Always run.
 *   2. Live DB checks against the seeded tables — run only when DATABASE_URL is
 *      set (skipped cleanly otherwise).
 *
 * Run with:  npm run test:canonical-food
 */
import {
  DIVERSITY_GROUP_SEED,
  CANONICAL_FOOD_SEED,
  FOOD_VARIETY_SEED,
  CANONICAL_FOOD_ALIAS_SEED,
  CANONICAL_SEED_COUNTS,
  validateCanonicalSeed,
  resolveCanonicalFood,
} from "../../shared/canonical/index.js";
import {
  runShadowComparison,
  countCanonicalPlants,
  countExistingPlants,
} from "../../shared/canonical/shadow.js";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
}

async function run() {
  // ── 1. Seed integrity ───────────────────────────────────────────────────────
  console.log("── Seed integrity ──");
  const problems = validateCanonicalSeed();
  check("referential integrity (no dangling / dup / forked keys)", problems.length === 0, problems.join("; "));
  check("≥ 8 diversity groups", DIVERSITY_GROUP_SEED.length >= 8, `got ${DIVERSITY_GROUP_SEED.length}`);
  check("≥ 20 canonical foods", CANONICAL_FOOD_SEED.length >= 20, `got ${CANONICAL_FOOD_SEED.length}`);
  check("varieties seeded", FOOD_VARIETY_SEED.length >= 8, `got ${FOOD_VARIETY_SEED.length}`);
  check("aliases seeded", CANONICAL_FOOD_ALIAS_SEED.length >= 30, `got ${CANONICAL_FOOD_ALIAS_SEED.length}`);
  const cats = new Set(CANONICAL_FOOD_SEED.map((f) => f.category));
  for (const c of ["Vegetables", "Mushrooms", "Herbs", "Spices", "Fruit", "Legumes", "Seeds", "Nuts", "Healthy fats"]) {
    check(`category present: ${c}`, cats.has(c));
  }
  console.log("  counts:", JSON.stringify(CANONICAL_SEED_COUNTS));

  // ── 2. Resolver — the brief's worked examples ───────────────────────────────
  console.log("\n── Resolver: brief examples ──");
  const tomatoes = resolveCanonicalFood("tomatoes");
  check('"tomatoes" → canonical tomato', tomatoes.canonicalSlug === "tomato");
  check('"tomatoes" → alias (plural), NO variety', tomatoes.matchType === "alias" && tomatoes.aliasType === "plural" && tomatoes.varietySlug === null);

  const cherry = resolveCanonicalFood("cherry tomatoes");
  check('"cherry tomatoes" → canonical tomato', cherry.canonicalSlug === "tomato");
  check('"cherry tomatoes" → variety cherry-tomato', cherry.matchType === "variety" && cherry.varietySlug === "cherry-tomato");
  check('"cherry tomatoes" → diversity group tomato', cherry.diversityGroupSlug === "tomato");

  const basil = resolveCanonicalFood("fresh basil");
  check('"fresh basil" → canonical basil', basil.canonicalSlug === "basil");
  check('"fresh basil" → alias (form)', basil.matchType === "alias" && basil.aliasType === "form");

  const shiitake = resolveCanonicalFood("shiitake mushrooms");
  check('"shiitake mushrooms" → canonical mushroom', shiitake.canonicalSlug === "mushroom");
  check('"shiitake mushrooms" → variety shiitake-mushroom', shiitake.matchType === "variety" && shiitake.varietySlug === "shiitake-mushroom");

  // ── 3. Aliases work ─────────────────────────────────────────────────────────
  console.log("\n── Aliases ──");
  check('"pepitas" → pumpkin-seeds', resolveCanonicalFood("pepitas").canonicalSlug === "pumpkin-seeds");
  check('"garbanzo beans" → chickpeas', resolveCanonicalFood("garbanzo beans").canonicalSlug === "chickpeas");
  check('"cilantro" → coriander', resolveCanonicalFood("cilantro").canonicalSlug === "coriander");
  check('"EVOO" → extra-virgin-olive-oil', resolveCanonicalFood("EVOO").canonicalSlug === "extra-virgin-olive-oil");
  check('"linseed" → flaxseed', resolveCanonicalFood("linseed").canonicalSlug === "flaxseed");
  check('"tumeric" (misspelling) → turmeric', resolveCanonicalFood("tumeric").canonicalSlug === "turmeric");

  // ── 4. Varieties & diversity groups ─────────────────────────────────────────
  console.log("\n── Varieties & diversity groups ──");
  const gala = resolveCanonicalFood("gala apple");
  check('"gala apple" → apple / variety gala-apple', gala.canonicalSlug === "apple" && gala.varietySlug === "gala-apple");
  check("orange & clementine share the citrus group", countCanonicalPlants(["orange", "clementine"]) === 1);
  check("orange & clementine are distinct canonical foods",
    resolveCanonicalFood("orange").canonicalSlug !== resolveCanonicalFood("clementine").canonicalSlug);

  // ── 5. Unknown handling ─────────────────────────────────────────────────────
  console.log("\n── Unknown handling ──");
  const unknown = resolveCanonicalFood("bog roll");
  check('"bog roll" → unknown (no invented identity)', !unknown.matched && unknown.matchType === "unknown" && unknown.canonicalSlug === null);

  // ── 6. TRUST CHECKS (must be impossible) ────────────────────────────────────
  console.log("\n── TRUST CHECKS ──");
  // Could "Tomatoes" become "Tomato + Cherry Tomato" and DOUBLE COUNT? Must not.
  const tomatoSet = ["tomatoes", "cherry tomatoes", "plum tomatoes", "heirloom tomatoes"];
  check("tomato + its varieties = 1 plant (no double count)", countCanonicalPlants(tomatoSet) === 1,
    `got ${countCanonicalPlants(tomatoSet)}`);
  check('"tomatoes" never resolves to a variety', resolveCanonicalFood("tomatoes").varietySlug === null);

  // Could Fresh Basil and Dried Basil count SEPARATELY? Must not.
  check("fresh + dried + plain basil = 1 plant", countCanonicalPlants(["fresh basil", "dried basil", "basil"]) === 1,
    `got ${countCanonicalPlants(["fresh basil", "dried basil", "basil"])}`);

  // Could Mushroom varieties INFLATE Plant Diversity? Must not.
  const mushroomSet = ["button mushrooms", "chestnut mushrooms", "shiitake mushrooms", "oyster mushrooms", "mushrooms"];
  check("all mushroom varieties = 1 plant (no inflation)", countCanonicalPlants(mushroomSet) === 1,
    `got ${countCanonicalPlants(mushroomSet)}`);

  // ── 7. Shadow mode ──────────────────────────────────────────────────────────
  console.log("\n── Shadow mode ──");
  // Cases where canonical and the live counter already AGREE (parity proof).
  const paritySet = [
    "tomatoes", "cherry tomatoes", "plum tomatoes",   // existing aliases → tomatoes; canonical → tomato group
    "fresh basil", "dried basil",                      // existing → basil; canonical → basil group
    "chickpeas", "garbanzo beans",                     // existing → chickpeas; canonical → chickpeas group
    "walnuts", "almonds", "ground almonds",
  ];
  const parityReport = runShadowComparison(paritySet);
  check("shadow parity set: existing plant count == canonical plant count",
    parityReport.existingDistinctPlants === parityReport.canonicalDistinctPlants,
    `existing=${parityReport.existingDistinctPlants} canonical=${parityReport.canonicalDistinctPlants}`);
  check("shadow parity set: 100% grouping parity", parityReport.parityPct === 100, `got ${parityReport.parityPct}%`);
  check("shadow report exposes the four diagnostics buckets",
    ["matched", "mismatch", "unknown", "ambiguous"].every((k) => k in parityReport.diagnostics));

  // Mushroom kinds: canonical IMPROVES on the live counter (collapses to 1).
  // This is an EXPECTED, surfaced divergence — not a regression.
  const mushroomReport = runShadowComparison(["shiitake mushrooms", "oyster mushrooms"]);
  check("shadow surfaces mushroom collapse as a mismatch (canonical fix)",
    mushroomReport.diagnostics.mismatch >= 1 && mushroomReport.canonicalDistinctPlants === 1,
    `mismatch=${mushroomReport.diagnostics.mismatch} canonicalPlants=${mushroomReport.canonicalDistinctPlants}`);
  check("shadow never lets canonical INFLATE above existing on this set",
    mushroomReport.canonicalDistinctPlants <= mushroomReport.existingDistinctPlants,
    `canonical=${mushroomReport.canonicalDistinctPlants} existing=${mushroomReport.existingDistinctPlants}`);

  console.log("\n  Sample shadow report (parity set):");
  console.log("   ", JSON.stringify({
    total: parityReport.total, diagnostics: parityReport.diagnostics,
    existingDistinctPlants: parityReport.existingDistinctPlants,
    canonicalDistinctPlants: parityReport.canonicalDistinctPlants,
    parityPct: parityReport.parityPct,
  }));

  // ── 8. Live DB checks ───────────────────────────────────────────────────────
  if (!process.env.DATABASE_URL) {
    console.log("\n(DATABASE_URL not set — skipping live DB checks)");
  } else {
    console.log("\n── Live DB ──");
    const pg = (await import("pg")).default;
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const schema = await import("@shared/schema");
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });
    try {
      const [g, f, v, a] = await Promise.all([
        db.$count(schema.diversityGroups),
        db.$count(schema.canonicalFoods),
        db.$count(schema.foodVarieties),
        db.$count(schema.canonicalFoodAliases),
      ]);
      check("DB diversity_group count ≥ seed", g >= DIVERSITY_GROUP_SEED.length, `db=${g} seed=${DIVERSITY_GROUP_SEED.length}`);
      check("DB canonical_food count ≥ seed", f >= CANONICAL_FOOD_SEED.length, `db=${f} seed=${CANONICAL_FOOD_SEED.length}`);
      check("DB food_variety count ≥ seed", v >= FOOD_VARIETY_SEED.length, `db=${v} seed=${FOOD_VARIETY_SEED.length}`);
      check("DB canonical_food_alias count ≥ seed", a >= CANONICAL_FOOD_ALIAS_SEED.length, `db=${a} seed=${CANONICAL_FOOD_ALIAS_SEED.length}`);
    } catch (e: any) {
      check("live DB query", false, e?.message ?? String(e));
    } finally {
      await pool.end();
    }
  }

  console.log(`\n${failed === 0 ? "✓" : "✗"} canonical-food tests — ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error("Test run failed:", err);
  process.exit(1);
});
