/**
 * KNOW4 — Graduated knowledge in Food Reports.
 *
 * Two claims, each asserted rather than assumed:
 *
 *   1. The seed-backed adapter reads the UNIFIED food knowledge seed, so the
 *      seven canonical foods KNOW3 bound to *graduated* knowledge surface their
 *      nutrients. Before KNOW4 all seven returned empty arrays.
 *
 *   2. The adapter speaks no benefit claim at all, and the evidence gate is the
 *      only mouth that does. This is what stops KNOW4 from turning 667 AI-drafted
 *      benefit links into rendered health claims.
 *
 * The DB-backed half runs only when DATABASE_URL is set (skipped cleanly).
 *
 * Run with: npm run test:know4-graduated-food-reports
 */
import { buildFoodReport, isCanonicalFood } from "../../shared/canonical/food-report-adapter.js";
import { CANONICAL_SEED } from "../../shared/canonical/foods.js";
import {
  FOOD_NUTRIENT_LINKS,
  FOOD_BENEFIT_LINKS,
  FOOD_NUTRIENT_SEED as SEED_FROM_OWNER,
} from "../../shared/knowledge/food-relationships.js";
import { FOOD_NUTRIENT_SEED as SEED_FROM_INDEX } from "../../shared/knowledge/index.js";
import { GRADUATED_FOOD_NUTRIENTS } from "../../shared/knowledge/graduated-relationships.js";
import { FOOD_NUTRIENTS } from "../../shared/knowledge/relationships.js";
import { NUTRIENT_SEED } from "../../shared/knowledge/nutrients.js";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
}

/** The seven canonical→knowledge bindings KNOW3 landed. Each name is equal on
 *  both sides, so canonical slug === knowledge slug for all seven. */
const KNOW3_BINDINGS = [
  "grapefruit", "semi-skimmed-milk", "plain-wheat-flour", "pearl-couscous",
  "wholewheat-pasta", "cacao-powder", "kombucha",
] as const;

/** Foods described by BOTH seed halves — the only place ordering can go wrong. */
const OVERLAP_FOODS = ["spinach", "broccoli", "blueberries"] as const;

const displayName = new Map(NUTRIENT_SEED.map((n) => [n.slug, n.name]));

async function run() {
  // ── 1. One owner: the composition exists exactly once ──────────────────────
  console.log("── The unified seed has one owner ──");
  check(
    "shared/knowledge/index.ts re-exports the composition, it does not rebuild it",
    SEED_FROM_INDEX === SEED_FROM_OWNER,
    "index.ts holds a second FOOD_NUTRIENT_SEED array — that is a duplicate composition",
  );
  check(
    "FOOD_NUTRIENT_LINKS covers every food in the unified seed",
    new Set(SEED_FROM_OWNER.map((r) => r.foodSlug)).size === FOOD_NUTRIENT_LINKS.size,
  );

  // ── 2. The seven KNOW3 bindings now surface ────────────────────────────────
  console.log("\n── The seven KNOW3 bindings surface graduated nutrients ──");
  let totalNutrientLinks = 0;
  for (const slug of KNOW3_BINDINGS) {
    const report = buildFoodReport(slug);
    check(`${slug}: report exists`, report !== null);
    if (!report) continue;

    // Every one of the seven is described ONLY by the graduated half. If it
    // ever gains an editorial link this assertion tells us, rather than
    // silently blending two authorship origins.
    check(
      `${slug}: has no editorial nutrient links (graduated-only food)`,
      FOOD_NUTRIENTS[slug] === undefined,
    );

    const expected = GRADUATED_FOOD_NUTRIENTS
      .filter((r) => r.foodSlug === slug)
      .map((r) => displayName.get(r.nutrientSlug) ?? r.nutrientSlug);

    check(`${slug}: surfaces ${expected.length} nutrients`, report.keyNutrients.length === expected.length,
      `got ${JSON.stringify(report.keyNutrients)}`);
    check(
      `${slug}: nutrients are exactly the graduated links, in seed order`,
      JSON.stringify(report.keyNutrients) === JSON.stringify(expected),
      `got ${JSON.stringify(report.keyNutrients)} expected ${JSON.stringify(expected)}`,
    );
    check(`${slug}: surfaces at least one nutrient (was 0 before KNOW4)`, report.keyNutrients.length > 0);
    totalNutrientLinks += report.keyNutrients.length;
  }
  check(
    "the seven reach 22 nutrient links in total (KNOW3's count)",
    totalNutrientLinks === 22,
    `got ${totalNutrientLinks}`,
  );

  // ── 3. Ordering: `ranking` is never compared across authorship halves ──────
  console.log("\n── Editorial links precede graduated links (never re-sorted by ranking) ──");
  for (const slug of OVERLAP_FOODS) {
    const editorial = (FOOD_NUTRIENTS[slug] ?? []).map((s) => displayName.get(s) ?? s);
    const graduated = GRADUATED_FOOD_NUTRIENTS
      .filter((r) => r.foodSlug === slug)
      .map((r) => displayName.get(r.nutrientSlug) ?? r.nutrientSlug);
    check(`${slug}: is described by both halves (test premise)`, editorial.length > 0 && graduated.length > 0);

    const canonical = CANONICAL_SEED.find((e) => e.food.knowledgeFoodSlug === slug);
    if (!canonical) { check(`${slug}: reachable from a canonical food`, false); continue; }
    const got = buildFoodReport(canonical.food.slug)!.keyNutrients;

    // Every editorial nutrient that survived the top-5 cut must precede every
    // graduated one. broccoli is the load-bearing case: its graduated
    // `vitamin-k` carries ranking 1, ahead of editorial `folate`(2)/`fibre`(3).
    // A `ranking`-sorted merge would hoist the AI-drafted link above two
    // human-authored ones. Array order is the only honest order.
    const lastEditorial = Math.max(...editorial.map((n) => got.indexOf(n)).filter((i) => i >= 0));
    const firstGraduated = Math.min(...graduated.map((n) => got.indexOf(n)).filter((i) => i >= 0));
    if (Number.isFinite(firstGraduated)) {
      check(
        `${slug}: every editorial nutrient precedes every graduated one`,
        lastEditorial < firstGraduated,
        `order=${JSON.stringify(got)}`,
      );
    }
  }
  {
    const broccoli = buildFoodReport("broccoli")!.keyNutrients;
    check(
      "broccoli: editorial Fibre (rank 3) still precedes graduated Vitamin K (rank 1)",
      broccoli.indexOf("Fibre") < broccoli.indexOf("Vitamin K"),
      `order=${JSON.stringify(broccoli)}`,
    );
  }

  // ── 4. The adapter never speaks a benefit claim ────────────────────────────
  console.log("\n── No ungated benefit claim leaves the adapter (any food, any variety) ──");
  const leakedFoods: string[] = [];
  const leakedVarieties: string[] = [];
  let over5 = 0;
  for (const entry of CANONICAL_SEED) {
    const report = buildFoodReport(entry.food.slug);
    if (!report) continue;
    if (report.healthBenefits.length > 0) leakedFoods.push(entry.food.slug);
    if (report.keyNutrients.length > 5) over5++;
    for (const v of report.varieties) {
      if (v.additionalBenefits.length > 0) leakedVarieties.push(v.slug);
    }
  }
  check(`no food leaks a benefit claim (${CANONICAL_SEED.length} checked)`, leakedFoods.length === 0, leakedFoods.join(", "));
  check("no variety leaks a benefit claim", leakedVarieties.length === 0, leakedVarieties.join(", "));
  check("keyNutrients never exceeds 5", over5 === 0);
  check(
    "the benefit links still exist in the seed — they are withheld, not deleted",
    FOOD_BENEFIT_LINKS.size > 0 && (FOOD_BENEFIT_LINKS.get("tomatoes")?.length ?? 0) > 0,
  );

  // ── 5. Honest gaps ─────────────────────────────────────────────────────────
  console.log("\n── Honest gaps: absent knowledge stays absent ──");
  const unbound = CANONICAL_SEED.filter((e) => !e.food.knowledgeFoodSlug);
  const unboundWithNutrients = unbound.filter((e) => (buildFoodReport(e.food.slug)?.keyNutrients.length ?? 0) > 0);
  check(
    `all ${unbound.length} canonical foods without a knowledge binding surface 0 nutrients`,
    unboundWithNutrients.length === 0,
    unboundWithNutrients.map((e) => e.food.slug).join(", "),
  );
  check("mushroom: keyNutrients empty (knowledgeFoodSlug null)", buildFoodReport("mushroom")!.keyNutrients.length === 0);
  check("lentils: keyNutrients empty (KNOW3 deferral, not a binding)", buildFoodReport("lentils")!.keyNutrients.length === 0);
  check("pasta: keyNutrients empty (KNOW3 deferral, not a binding)", buildFoodReport("pasta")!.keyNutrients.length === 0);

  // ── 6. Guards unchanged ────────────────────────────────────────────────────
  console.log("\n── Preparation / container / unknown guards unchanged ──");
  check('"grilled-tomatoes" → null', buildFoodReport("grilled-tomatoes") === null);
  check('"mixed-beans" → null', buildFoodReport("mixed-beans") === null);
  check('"" → null', buildFoodReport("") === null);
  check('"unknown-food" → null', buildFoodReport("unknown-food") === null);
  check("isCanonicalFood('grilled-tomatoes') === false", !isCanonicalFood("grilled-tomatoes"));

  // ── 7. The evidence gate — live DB ─────────────────────────────────────────
  if (!process.env.DATABASE_URL) {
    console.log("\n(DATABASE_URL not set — skipping evidence-gate checks)");
  } else {
    console.log("\n── The evidence gate is the one mouth for benefit claims ──");
    const { getEvidenceBackedFoodReport } = await import("../lib/food-report-evidence.js");
    const { getFoodBenefitsForDisplay, getNutrientsForFood } = await import("../services/nutrition-knowledge-registry.js");
    const { getFoodIntelligence } = await import("../lib/food-intelligence-assembler.js");
    const { isValidSourceRef, isEvidenceBackedClaim } = await import("../../shared/knowledge/evidence.js");

    /** Does this food have at least one cited + signed-off composition premise? */
    const hasBackedPremise = async (slug: string) =>
      (await getNutrientsForFood(slug)).some((n) => isEvidenceBackedClaim({ sourceRefs: n.sourceRefs, reviewedAt: n.reviewedAt }));
    const getNutrientsForFoodEarly = getNutrientsForFood;

    // 7a. The seven surface gated benefits — the graduated knowledge is visible
    //     through the gate, which is the only way it is allowed to be visible.
    //
    //     KNOW5 REVISED THIS BLOCK, AND THE REVISION IS THE POINT.
    //
    //     As written at KNOW4 this asserted `plain-wheat-flour` surfaces ≥1
    //     evidence-backed benefit, and that the seven reach 13 such claims. Both
    //     were true and both were wrong: the citation backing each chip attested
    //     that (say) fibre supports gut health, while the food-specific premise
    //     — "plain white flour is a notable fibre source" — was an unreviewed AI
    //     draft, and false. KNOW5 gated the composition edge, so a chip requires
    //     BOTH edges to be evidence-backed.
    //
    //     None of the seven has a cited composition premise (shared/knowledge/
    //     composition-sources.ts deliberately cites no flour, starch or oil), so
    //     all seven now correctly render zero benefits. What this block asserts
    //     is therefore inverted: the graduated NUTRIENTS still surface, the
    //     benefit CLAIMS are withheld, and nothing that does render is uncited.
    let gatedTotal = 0;
    for (const slug of KNOW3_BINDINGS) {
      const composed = await getEvidenceBackedFoodReport(slug);
      check(`${slug}: gated report exists`, composed !== null);
      if (!composed) continue;
      gatedTotal += composed.healthBenefits.length;

      // Whatever renders must be fully cited. Zero chips satisfies this honestly;
      // a chip on an uncited premise does not.
      const display = await getFoodBenefitsForDisplay(slug);
      check(
        `${slug}: every rendered benefit carries ≥1 valid SourceRef`,
        display.every((d) => d.sourceRefs.some((r) => isValidSourceRef(r))),
      );
      check(
        `${slug}: no benefit renders on an uncited composition premise (KNOW5 full-chain gate)`,
        display.length === 0 || (await hasBackedPremise(slug)),
      );

      // A gated benefit may only ever be one the seed already declared for this
      // food. The gate filters; it must never introduce.
      const declared = new Set(FOOD_BENEFIT_LINKS.get(slug) ?? []);
      const introduced = display.map((d) => d.benefit.slug).filter((s) => !declared.has(s));
      check(`${slug}: the gate introduced no benefit the seed never declared`, introduced.length === 0, introduced.join(", "));
    }
    check(
      "the seven surface 0 benefit claims — none has a cited composition premise (was 13 pre-KNOW5, on an uncited premise)",
      gatedTotal === 0,
      `got ${gatedTotal}`,
    );
    check(
      "plain-wheat-flour surfaces no benefit — the defect KNOW5 was opened to fix",
      ((await getEvidenceBackedFoodReport("plain-wheat-flour"))?.healthBenefits.length ?? 0) === 0,
    );

    // 7b. The gate REFUSES. Without this, everything above passes vacuously on a
    //     platform that happens to sign off every claim.
    const tomato = await getEvidenceBackedFoodReport("tomato");
    const tomatoDeclared = FOOD_BENEFIT_LINKS.get("tomatoes") ?? [];
    check("tomato: the seed declares ≥3 benefit links (test premise)", tomatoDeclared.length >= 3);
    check("tomato: renders strictly fewer benefits than the seed declares", (tomato?.healthBenefits.length ?? 0) < tomatoDeclared.length);
    check(
      "tomato: 'Skin Health' is declared by the seed but withheld by the gate",
      tomatoDeclared.includes("skin-health") && !(tomato?.healthBenefits ?? []).includes("Skin Health"),
    );
    // The seven still carry their graduated nutrients: composition is not a
    // health claim, and hiding it would be a gap without a reason.
    check(
      "the seven still surface their graduated nutrients (only CLAIMS are gated, not composition)",
      (await getNutrientsForFoodEarly("plain-wheat-flour")).length > 0,
    );

    // 7c. End-to-end: the route-level assembler users actually hit is gated.
    //     This is the assertion that would have caught the PKC2 gap at HEAD.
    for (const slug of ["tomato", "grapefruit", "kombucha"]) {
      const intel = await getFoodIntelligence(slug);
      const expected = (await getFoodBenefitsForDisplay(
        CANONICAL_SEED.find((e) => e.food.slug === slug)!.food.knowledgeFoodSlug!,
      )).map((b) => b.benefit.name);
      check(
        `getFoodIntelligence("${slug}").healthBenefits === the evidence-gated registry`,
        JSON.stringify(intel.healthBenefits) === JSON.stringify(expected),
        `got ${JSON.stringify(intel.healthBenefits)} expected ${JSON.stringify(expected)}`,
      );
    }

    // 7d. Nutrients: the seed-backed adapter and the DB-backed registry agree.
    //     KNOW2 made the seed describe every live row; this proves it still does
    //     for the foods KNOW4 newly exposes.
    for (const slug of KNOW3_BINDINGS) {
      const fromDb = new Set((await getNutrientsForFood(slug)).map((n) => n.nutrient.name));
      const fromSeed = new Set(buildFoodReport(slug)!.keyNutrients);
      check(
        `${slug}: seed nutrients === DB nutrients (one owner, two readers)`,
        fromDb.size === fromSeed.size && Array.from(fromSeed).every((n) => fromDb.has(n)),
        `db=${JSON.stringify(Array.from(fromDb))} seed=${JSON.stringify(Array.from(fromSeed))}`,
      );
    }

    const { pool } = await import("../db.js");
    await pool.end();
  }

  console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => { console.error(err); process.exit(1); });
