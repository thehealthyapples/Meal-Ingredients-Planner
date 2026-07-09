/**
 * WS0 — Nutrition Knowledge Registry verification tests.
 *
 * Two layers:
 *   1. Pure editorial-data checks (no DB needed) — always run.
 *   2. Live retrieval-helper checks against the seeded DB — run only when
 *      DATABASE_URL is set (skipped cleanly otherwise).
 *
 * Run with:  npm run test:knowledge-registry
 */
import {
  FOOD_SEED,
  EDITORIAL_FOOD_SEED,
  GRADUATED_FOOD_SEED,
  GRADUATED_FOOD_SOURCE,
  NUTRIENT_SEED,
  HEALTH_BENEFIT_SEED,
  FOOD_NUTRIENT_SEED,
  FOOD_BENEFIT_SEED,
  NUTRIENT_BENEFIT_SEED,
  FOOD_NUTRIENTS,
  FOOD_BENEFITS,
  KNOWLEDGE_SEED_COUNTS,
  validateKnowledgeSeed,
} from "../../shared/knowledge/index.js";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
}

async function run() {
  console.log("── Editorial data integrity ──");

  const problems = validateKnowledgeSeed();
  check("referential integrity (no dangling/duplicate slugs)", problems.length === 0, problems.join("; "));

  check("≥ 50 foods seeded", FOOD_SEED.length >= 50, `got ${FOOD_SEED.length}`);
  check("≥ 30 nutrients seeded", NUTRIENT_SEED.length >= 30, `got ${NUTRIENT_SEED.length}`);
  check("≥ 15 health benefits seeded", HEALTH_BENEFIT_SEED.length >= 15, `got ${HEALTH_BENEFIT_SEED.length}`);

  const requiredCategories = ["Healthy fats", "Seeds", "Legumes", "Fermented foods", "Herbs", "Mushrooms", "Vegetables", "Fruit"];
  const presentCategories = new Set(FOOD_SEED.map((f) => f.category));
  for (const c of requiredCategories) check(`category present: ${c}`, presentCategories.has(c));

  // KNOW2 — assert the MVF bar (Rule KC5: identity + ≥1 real fact) over the
  // COMPOSED seed, not the editorial compact maps. The graduated half carries its
  // links as explicit rows with per-row confidence, which the maps cannot express;
  // reading the maps here would have silently exempted all 346 graduated foods.
  const nutrientLinked = new Set(FOOD_NUTRIENT_SEED.map((r) => r.foodSlug));
  const benefitLinked = new Set(FOOD_BENEFIT_SEED.map((r) => r.foodSlug));
  const noNutrient = FOOD_SEED.filter((f) => !nutrientLinked.has(f.slug)).map((f) => f.slug);
  const noBenefit = FOOD_SEED.filter((f) => !benefitLinked.has(f.slug)).map((f) => f.slug);
  check("every food has ≥ 1 nutrient link", noNutrient.length === 0, noNutrient.slice(0, 5).join(", "));
  check("every food has ≥ 1 benefit link", noBenefit.length === 0, noBenefit.slice(0, 5).join(", "));
  // The editorial compact maps still cover every editorial food — the graduated
  // half is additive and must never be required to appear in them.
  check("editorial foods keep their compact-map links", EDITORIAL_FOOD_SEED.every(
    (f) => (FOOD_NUTRIENTS[f.slug]?.length ?? 0) >= 1 && (FOOD_BENEFITS[f.slug]?.length ?? 0) >= 1));

  check("every relationship row carries an explicit source", [
    ...FOOD_NUTRIENT_SEED, ...FOOD_BENEFIT_SEED, ...NUTRIENT_BENEFIT_SEED,
  ].every((r: any) => typeof r.source === "string" && r.source.length > 0));
  // KNOW2 — a graduated identity must state its draft provenance explicitly.
  // Relying on the `source` column default is exactly how 346 AI-authored foods
  // came to be stamped "THA editorial" by the writer this workstream retired.
  check("every graduated food declares its draft provenance",
    GRADUATED_FOOD_SEED.every((f: any) => f.source === GRADUATED_FOOD_SOURCE),
    `expected all ${GRADUATED_FOOD_SEED.length} to be ${JSON.stringify(GRADUATED_FOOD_SOURCE)}`);
  check("no graduated food claims human editorial authorship",
    GRADUATED_FOOD_SEED.every((f: any) => f.source !== "THA editorial"));
  check("no graduated food carries a machine enum as its description",
    GRADUATED_FOOD_SEED.every((f: any) => f.description == null),
    "descriptions are honest gaps, not `whole_or_minimally_processed`");
  check("editorial entity rows omit source only when relying on the column default", [
    ...EDITORIAL_FOOD_SEED, ...NUTRIENT_SEED, ...HEALTH_BENEFIT_SEED,
  ].every((r: any) => r.source === undefined || (typeof r.source === "string" && r.source.length > 0)));

  console.log("  counts:", JSON.stringify(KNOWLEDGE_SEED_COUNTS));

  if (!process.env.DATABASE_URL) {
    console.log("\n(DATABASE_URL not set — skipping live retrieval-helper checks)");
  } else {
    console.log("\n── Live retrieval helpers (DB) ──");
    const reg = await import("../services/nutrition-knowledge-registry.js");

    const foods = await reg.listFoods();
    check("listFoods() returns seeded rows", foods.length >= 50, `got ${foods.length}`);

    const pumpkin = await reg.getFoodBySlug("pumpkin-seeds");
    check("getFoodBySlug('pumpkin-seeds') found", !!pumpkin);

    const pumpkinNutrients = await reg.getNutrientsForFood("pumpkin-seeds");
    check("pumpkin seeds → magnesium present", pumpkinNutrients.some((n) => n.nutrient.slug === "magnesium"));
    check("nutrient links ordered by ranking", pumpkinNutrients.every((n, i, arr) => i === 0 || arr[i - 1].ranking <= n.ranking));

    const display = await reg.getFoodBenefitsForDisplay("pumpkin-seeds");
    check("display benefits omit evidenceStrength", display.every((d) => !("evidenceStrength" in d)));

    const internal = await reg.getBenefitsForFood("pumpkin-seeds");
    check("internal benefits retain evidenceStrength (storage only)", internal.every((b) => typeof b.evidenceStrength === "string"));

    const foodsForMag = await reg.getFoodsForNutrient("magnesium");
    check("reverse lookup foods-for-nutrient works", foodsForMag.some((f) => f.slug === "pumpkin-seeds"));

    const { pool } = await import("../db.js");
    await pool.end();
  }

  console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => { console.error(err); process.exit(1); });
