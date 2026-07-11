/**
 * WS2F — Food Report Foundation: FoodReportKnowledgeAdapter verification tests.
 *
 * Proves the six approved sections of the Food Report foundation:
 *   Overview · Key Nutrients · Health Benefits · Nutrition Context ·
 *   Variety Knowledge (shared + optional variety-specific additional facts)
 *
 * KNOW4 — the adapter no longer speaks health benefits. A benefit link is a
 * claim, and this module is seed-only: it cannot read `reviewedAt` and so
 * cannot evaluate the Layer-2 evidence gate. `healthBenefits` is therefore
 * always empty here, and the gated composer (server/lib/food-report-evidence.ts)
 * is the one mouth for benefit claims. The assertions below say so directly.
 *
 * Also validates:
 *   • WS2A identity authority preserved (validateCanonicalSeed → 0 problems)
 *   • WS0 knowledge authority preserved (validateKnowledgeSeed → 0 problems)
 *   • Resolver still produces 0 conflicts, 0 dangling FKs
 *   • Preparations are NEVER foods (preparation guard)
 *   • Multi-food containers are NEVER foods
 *   • Variety knowledge deduplicates against parent (no repeated facts)
 *   • NUTRITION_CONTEXT keys all point to real canonical foods
 *
 * Run with: npm run test:food-report
 */

import {
  buildFoodReport,
  isCanonicalFood,
} from "../../shared/canonical/food-report-adapter.js";
import {
  validateCanonicalSeed,
  CANONICAL_FOOD_SEED,
  CANONICAL_SEED,
} from "../../shared/canonical/index.js";
import { buildCanonicalIndex } from "../../shared/canonical/resolver.js";
import { validateKnowledgeSeed, FOOD_SEED } from "../../shared/knowledge/index.js";
import { NUTRITION_CONTEXT } from "../../shared/canonical/nutrition-context.js";

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`);
  }
}

function contains(arr: string[], value: string): boolean {
  return arr.some((v) => v.toLowerCase() === value.toLowerCase());
}

function run() {
  // ── 0. Prerequisite: WS2A identity authority unchanged ─────────────────────
  console.log("── WS2A integrity (prerequisite) ──");
  const canonicalProblems = validateCanonicalSeed();
  check(
    "validateCanonicalSeed → 0 problems (identity authority preserved)",
    canonicalProblems.length === 0,
    canonicalProblems.join("; "),
  );

  const { conflicts } = buildCanonicalIndex();
  check(
    "resolver → 0 conflicts (one food one meaning)",
    conflicts.length === 0,
    conflicts.map((c) => c.key).join(", "),
  );

  // ── 0b. Prerequisite: WS0 knowledge authority unchanged ────────────────────
  console.log("\n── WS0 integrity (prerequisite) ──");
  const knowledgeProblems = validateKnowledgeSeed();
  check(
    "validateKnowledgeSeed → 0 problems (knowledge authority preserved)",
    knowledgeProblems.length === 0,
    knowledgeProblems.join("; "),
  );

  // ── 1. Tomato ────────────────────────────────────────────────────────────────
  console.log("\n── Manual test: Tomato ──");
  const tomato = buildFoodReport("tomato");
  check("tomato: report exists", tomato !== null);
  if (tomato) {
    check("tomato: overview.name = Tomato", tomato.overview.name === "Tomato");
    check("tomato: overview.category = Vegetables", tomato.overview.category === "Vegetables");
    check("tomato: overview.description non-empty", tomato.overview.description.length > 0);
    check("tomato: keyNutrients ≥ 1", tomato.keyNutrients.length >= 1);
    check("tomato: has Lycopene", contains(tomato.keyNutrients, "Lycopene"));
    check("tomato: has Vitamin C", contains(tomato.keyNutrients, "Vitamin C"));
    check("tomato: keyNutrients max 5", tomato.keyNutrients.length <= 5);
    // KNOW4: an ungated claim never leaves this adapter (see header).
    check("tomato: healthBenefits empty (claims need the evidence gate)", tomato.healthBenefits.length === 0);
    check("tomato: nutritionContext non-empty", tomato.nutritionContext.length >= 1);
    check("tomato: 3 varieties", tomato.varieties.length === 3);
    const cherry = tomato.varieties.find((v) => v.slug === "cherry-tomato");
    check("tomato: cherry-tomato variety present", cherry !== undefined);
    check("tomato: cherry label = Cherry", cherry?.label === "Cherry");
    // Tomato varieties have no knowledgeFoodSlug → no additional knowledge
    check(
      "tomato: varieties have no additional nutrients (knowledgeFoodSlug null)",
      tomato.varieties.every((v) => v.additionalNutrients.length === 0),
    );
  }

  // ── 2. Spinach ───────────────────────────────────────────────────────────────
  console.log("\n── Manual test: Spinach ──");
  const spinach = buildFoodReport("spinach");
  check("spinach: report exists", spinach !== null);
  if (spinach) {
    check("spinach: overview.name = Spinach", spinach.overview.name === "Spinach");
    check("spinach: overview.category = Vegetables", spinach.overview.category === "Vegetables");
    check("spinach: overview.description non-empty", spinach.overview.description.length > 0);
    check("spinach: has Folate", contains(spinach.keyNutrients, "Folate"));
    check("spinach: has Iron", contains(spinach.keyNutrients, "Iron"));
    check("spinach: has Vitamin K", contains(spinach.keyNutrients, "Vitamin K"));
    // KNOW4: spinach is described by BOTH seed halves — editorial (folate, iron,
    // vitamin-k, beta-carotene) and graduated (magnesium). The unified read
    // surfaces the graduated link too, appended after the editorial ones.
    check("spinach: has Magnesium (graduated link, unified seed)", contains(spinach.keyNutrients, "Magnesium"));
    check(
      "spinach: editorial nutrients precede graduated ones",
      spinach.keyNutrients.indexOf("Folate") < spinach.keyNutrients.indexOf("Magnesium"),
    );
    check("spinach: healthBenefits empty (claims need the evidence gate)", spinach.healthBenefits.length === 0);
    check("spinach: nutritionContext non-empty (iron absorption)", spinach.nutritionContext.length >= 1);
    // WS2F Amendment: spinach uses the variety model (baby + mature).
    check("spinach: 2 varieties (baby-spinach, mature-spinach)", spinach.varieties.length === 2);
    const baby = spinach.varieties.find((v) => v.slug === "baby-spinach");
    const mature = spinach.varieties.find((v) => v.slug === "mature-spinach");
    check("spinach: baby-spinach variety present", baby !== undefined);
    check("spinach: baby label = Baby", baby?.label === "Baby");
    check("spinach: mature-spinach variety present", mature !== undefined);
    check("spinach: mature label = Mature", mature?.label === "Mature");
    // No knowledgeFoodSlug on varieties → no additional facts fabricated
    check(
      "spinach: varieties have no additional nutrients (no WS0 link)",
      spinach.varieties.every((v) => v.additionalNutrients.length === 0),
    );
  }

  // ── 3. Mushroom (shared knowledge + variety knowledge) ──────────────────────
  console.log("\n── Manual test: Mushroom (shared + variety knowledge) ──");
  const mushroom = buildFoodReport("mushroom");
  check("mushroom: report exists", mushroom !== null);
  if (mushroom) {
    check("mushroom: overview.name = Mushroom", mushroom.overview.name === "Mushroom");
    check("mushroom: overview.category = Mushrooms", mushroom.overview.category === "Mushrooms");
    // Parent mushroom has knowledgeFoodSlug = null → empty shared nutrients/benefits
    check("mushroom: keyNutrients empty (knowledgeFoodSlug null)", mushroom.keyNutrients.length === 0);
    check("mushroom: healthBenefits empty (knowledgeFoodSlug null)", mushroom.healthBenefits.length === 0);
    check("mushroom: nutritionContext non-empty (vitamin D context)", mushroom.nutritionContext.length >= 1);
    check("mushroom: 4 varieties", mushroom.varieties.length === 4);

    const chestnut = mushroom.varieties.find((v) => v.slug === "chestnut-mushroom");
    check("mushroom: chestnut variety present", chestnut !== undefined);
    check("mushroom: chestnut label = Chestnut", chestnut?.label === "Chestnut");
    // chestnut-mushrooms WS0: nutrients include copper → should appear as additional
    check(
      "mushroom: chestnut has additional nutrients (wired to chestnut-mushrooms)",
      (chestnut?.additionalNutrients.length ?? 0) >= 1,
    );
    check(
      "mushroom: chestnut additionalNutrients includes Copper",
      contains(chestnut?.additionalNutrients ?? [], "Copper"),
    );

    const shiitake = mushroom.varieties.find((v) => v.slug === "shiitake-mushroom");
    check("mushroom: shiitake label = Shiitake", shiitake?.label === "Shiitake");
    check(
      "mushroom: shiitake has additional nutrients (wired to shiitake-mushrooms)",
      (shiitake?.additionalNutrients.length ?? 0) >= 1,
    );

    // All variety nutrients are "additional" because parent has none
    const allVarietyNutrients = mushroom.varieties.flatMap((v) => v.additionalNutrients);
    check("mushroom: varieties surface additional nutrients (not empty)", allVarietyNutrients.length >= 4);
  }

  // ── 4. Lentils (canonical food with varieties) ───────────────────────────────
  console.log("\n── Manual test: Lentils (canonical food + varieties) ──");
  const lentils = buildFoodReport("lentils");
  check("lentils: report exists", lentils !== null);
  if (lentils) {
    check("lentils: overview.name = Lentils", lentils.overview.name === "Lentils");
    check("lentils: overview.category = Legumes", lentils.overview.category === "Legumes");
    // Lentils parent knowledgeFoodSlug = null → no generic lentil conflation
    check("lentils: keyNutrients empty (no conflation with red-lentils)", lentils.keyNutrients.length === 0);
    check("lentils: 4 varieties (Red, Green, Puy, Beluga)", lentils.varieties.length === 4);

    const varietyNames = lentils.varieties.map((v) => v.label);
    check("lentils: has Red variety", contains(varietyNames, "Red"));
    check("lentils: has Green variety", contains(varietyNames, "Green"));
    check("lentils: has Puy variety", contains(varietyNames, "Puy"));
    check("lentils: has Beluga variety", contains(varietyNames, "Beluga"));

    const redLentil = lentils.varieties.find((v) => v.slug === "red-lentil");
    check("lentils: Red Lentil wired to WS0 (has additionalNutrients)", (redLentil?.additionalNutrients.length ?? 0) >= 1);
    check("lentils: Red has Plant Protein", contains(redLentil?.additionalNutrients ?? [], "Plant Protein"));
    check("lentils: Red has Fibre", contains(redLentil?.additionalNutrients ?? [], "Fibre"));

    const greenLentil = lentils.varieties.find((v) => v.slug === "green-lentil");
    // Green lentil has no knowledgeFoodSlug → no additional knowledge
    check("lentils: Green has no additionalNutrients (not yet in WS0)", greenLentil?.additionalNutrients.length === 0);

    check("lentils: nutritionContext non-empty", lentils.nutritionContext.length >= 1);
  }

  // ── 5. Preparation guard — "Grilled Tomatoes" must return null ───────────────
  console.log("\n── Preparation guard ──");
  check(
    '"grilled-tomatoes" → null (preparation not a food)',
    buildFoodReport("grilled-tomatoes") === null,
  );
  check(
    '"grilled tomatoes" input returns null via isCanonicalFood',
    !isCanonicalFood("grilled-tomatoes"),
  );
  check(
    '"roasted-peppers" → null (preparation not a food)',
    buildFoodReport("roasted-peppers") === null,
  );

  // ── 6. Container guard — "Mixed Beans" must return null ─────────────────────
  console.log("\n── Container guard ──");
  check(
    '"mixed-beans" → null (multi-food container not a food)',
    buildFoodReport("mixed-beans") === null,
  );
  check(
    '"mixed-mushrooms" → null',
    buildFoodReport("mixed-mushrooms") === null,
  );

  // ── 7. Unknown slug → null ──────────────────────────────────────────────────
  console.log("\n── Unknown input guard ──");
  check('"" → null', buildFoodReport("") === null);
  check('"unknown-food" → null', buildFoodReport("unknown-food") === null);

  // ── 8. Variety deduplication — variety facts never duplicate parent ──────────
  console.log("\n── Variety deduplication ──");
  // Tomato: parent has Lycopene, Vitamin C, Potassium; varieties have null knowledgeFoodSlug.
  const tomato2 = buildFoodReport("tomato")!;
  if (tomato2) {
    const parentSet = new Set(tomato2.keyNutrients);
    for (const variety of tomato2.varieties) {
      for (const n of variety.additionalNutrients) {
        check(
          `tomato variety ${variety.label}: additionalNutrient "${n}" not in parent`,
          !parentSet.has(n),
          `"${n}" appears in both parent and variety — should be deduplicated`,
        );
      }
    }
  }

  // ── 9. NUTRITION_CONTEXT referential integrity ───────────────────────────────
  console.log("\n── NUTRITION_CONTEXT referential integrity ──");
  const canonicalSlugs = new Set(CANONICAL_FOOD_SEED.map((f) => f.slug));
  const ws0Slugs = new Set(FOOD_SEED.map((f) => f.slug));
  for (const slug of Object.keys(NUTRITION_CONTEXT)) {
    check(
      `NUTRITION_CONTEXT["${slug}"] → real canonical food`,
      canonicalSlugs.has(slug),
      `"${slug}" is not in CANONICAL_SEED`,
    );
  }

  // ── 10. Variety knowledgeFoodSlug FK integrity ──────────────────────────────
  console.log("\n── Variety knowledgeFoodSlug FK integrity ──");
  for (const entry of CANONICAL_SEED) {
    for (const v of entry.varieties ?? []) {
      if (v.knowledgeFoodSlug) {
        check(
          `variety "${v.slug}" knowledgeFoodSlug "${v.knowledgeFoodSlug}" exists in WS0`,
          ws0Slugs.has(v.knowledgeFoodSlug),
          `"${v.knowledgeFoodSlug}" not found in FOOD_SEED`,
        );
      }
    }
  }

  // ── 11. Core foods have reports ─────────────────────────────────────────────
  console.log("\n── Core foods have reports ──");
  for (const slug of [
    "tomato", "spinach", "mushroom", "lentils",
    "chickpeas", "extra-virgin-olive-oil", "walnuts", "almonds",
    "avocado", "basil", "parsley",
  ]) {
    check(`buildFoodReport("${slug}") returns a report`, buildFoodReport(slug) !== null);
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log(`\n── Summary: ${passed} passed, ${failed} failed ──`);
  if (failed > 0) process.exit(1);
}

run();
