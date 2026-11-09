/**
 * test-comp1-food-comparison.ts (COMP1 — Food Comparison Intelligence)
 * =====================================================================
 * Verifies the Food Comparison Engine and its binding as the `compare` verb on
 * the EXISTING food-intelligence capability:
 *
 *   §1  buildComparison (pure core) — deterministic, cited comparison over
 *       already-fetched subject facts: whole-food identity, stored product
 *       scores, honest gaps for every unstored dimension, and the ordered
 *       recommendation ladder (safety → apple score → processing → honest tie).
 *   §2  Trust rules — knowledge-documentation dimensions (nutrients, benefits)
 *       NEVER contribute to the recommendation (documentation coverage is not
 *       food quality); ties are honest; restriction conflicts are decisive;
 *       unverifiable products carry a check-the-label caveat.
 *   §3  Handler — the `compare` verb delegates through the port, gaps honestly
 *       for missing/short item lists and ungrounded comparisons, and write
 *       verbs remain non-executable.
 *   §4  Resolver — named-item comparison utterances route to
 *       food-intelligence:compare; the analyser's demonstrative form and the
 *       INT33 cross-domain compounds keep their existing routes.
 *   §5  Registry truthfulness — `compare` is executable AND supported.
 *
 * Run: npx tsx server/tests/test-comp1-food-comparison.ts
 */

import type { ProductHistory } from "@shared/schema";
import type { FoodReportKnowledge } from "@shared/canonical/food-report-adapter";
import { resolveActiveRestrictions } from "@shared/restrictions/restriction-resolver.js";
import {
  buildComparison,
  COMPARISON_DIMENSION_KEYS,
  type SubjectFacts,
} from "../intelligence/food-intelligence/comparison-engine.js";
import { NO_HOUSEHOLD_SIGNAL, type HouseholdSignal } from "../intelligence/food-intelligence/engine.js";
import { createFoodIntelligenceReadHandler, type FoodComparisonResult } from "../intelligence/handlers/food-intelligence-read-handler.js";
import type { FoodIntelligenceReadPort } from "../intelligence/handlers/food-intelligence-read-port.js";
import { FOOD_INTELLIGENCE_EXECUTABLE_INTENTS } from "../intelligence/bindings/food-intelligence.js";
import { CapabilityRegistry } from "../intelligence/capability-registry.js";
import { PatternIntentResolver } from "../intelligence/pattern-intent-resolver.js";
import type { IntentResolutionHints, ResolvedIntent } from "../intelligence/intent-resolver.js";
import { CapabilityExecutionError, type Intent, type IntelligenceContext } from "../intelligence/types.js";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

// ---------------------------------------------------------------------------
// Fixtures (pure core inputs — no database)
// ---------------------------------------------------------------------------

function foodReport(name: string, category: string, nutrients: string[], benefits: string[]): FoodReportKnowledge {
  return {
    canonicalSlug: name.toLowerCase(),
    overview: { name, category, description: `${name} description` },
    keyNutrients: nutrients,
    healthBenefits: benefits,
    cautions: [],
    nutritionContext: [],
    varieties: [],
  };
}

function canonicalSubject(
  name: string,
  category: string,
  nutrients: string[] = [],
  benefits: string[] = [],
): SubjectFacts {
  return {
    query: name.toLowerCase(),
    kind: "canonical-food",
    slug: name.toLowerCase(),
    name,
    category,
    report: foodReport(name, category, nutrients, benefits),
    product: null,
    usdaSnapshot: null,
    liveProduct: null,
  };
}

function productSubject(
  name: string,
  fields: Partial<Pick<ProductHistory, "thaRating" | "upfScore" | "novaGroup" | "nutriscoreGrade" | "brand">>,
): SubjectFacts {
  const product: ProductHistory = {
    id: 1,
    userId: 7,
    barcode: "5000000000001",
    productName: name,
    brand: fields.brand ?? null,
    imageUrl: null,
    novaGroup: fields.novaGroup ?? null,
    nutriscoreGrade: fields.nutriscoreGrade ?? null,
    thaRating: fields.thaRating ?? null,
    upfScore: fields.upfScore ?? null,
    healthScore: null,
    scannedAt: "2026-07-01T10:00:00Z",
    source: "scan",
  };
  return {
    query: name.toLowerCase(),
    kind: "scanned-product",
    slug: product.barcode,
    name,
    category: fields.brand ?? null,
    report: null,
    product,
    usdaSnapshot: null,
    liveProduct: null,
  };
}

// 2026-11-02 — fixture for the new live-search resolution tier (server/lib/
// live-product-search.ts). Deliberately NOT a ProductHistory: a live-product
// subject must never be constructible as if it were the caller's own stored
// scan, which is exactly the distinction this fix exists to preserve.
function liveProductSubject(
  name: string,
  fields: Partial<{ thaRating: number; upfScore: number; novaGroup: number; brand: string; ingredientsText: string; additiveCount: number }>,
): SubjectFacts {
  return {
    query: name.toLowerCase(),
    kind: "live-product",
    slug: null,
    name,
    category: fields.brand ?? null,
    report: null,
    product: null,
    usdaSnapshot: null,
    liveProduct: {
      barcode: null,
      name,
      brand: fields.brand ?? null,
      ingredientsText: fields.ingredientsText ?? null,
      novaGroup: fields.novaGroup ?? null,
      thaRating: fields.thaRating ?? null,
      upfScore: fields.upfScore ?? null,
      additiveCount: fields.additiveCount ?? 0,
    },
  };
}

function unresolvedSubject(query: string): SubjectFacts {
  return { query, kind: "unresolved", slug: null, name: null, category: null, report: null, product: null, usdaSnapshot: null, liveProduct: null };
}

const HOUSEHOLD_NUT_FREE: HouseholdSignal = {
  resolved: true,
  restrictionDefs: resolveActiveRestrictions(["peanut"]),
  familiarAppearances: new Map([["broccoli", 3]]),
  householdId: 42,
};

async function main(): Promise<void> {
  // =========================================================================
  section("§1 buildComparison — pure core");

  // Two whole foods, no household — grounded, whole-food dimensions, honest tie.
  const twoFoods = buildComparison(
    [
      canonicalSubject("Broccoli", "vegetables", ["Vitamin C", "Fibre"], ["Immune function"]),
      canonicalSubject("Spinach", "vegetables", ["Iron", "Vitamin K"], []),
    ],
    NO_HOUSEHOLD_SIGNAL,
  );
  assert(twoFoods.trust.isGrounded, "two canonical foods → grounded");
  assert(!twoFoods.trust.householdAware, "no household signal → not household-aware");
  assert(twoFoods.subjects.length === 2, "two subjects returned");
  assert(
    twoFoods.subjects.every((s) => COMPARISON_DIMENSION_KEYS.every((k) => s.dimensions[k] != null)),
    "every subject carries every dimension entry",
  );
  assert(
    twoFoods.subjects[0].dimensions.processing.status === "evidence",
    "whole food processing dimension is owner evidence (canonical identity)",
  );
  assert(
    twoFoods.subjects[0].dimensions.appleScore.status === "evidence" &&
      (twoFoods.subjects[0].dimensions.appleScore.summary ?? "").includes("5/5"),
    "whole food Apple Score is a real 5/5 by classification (2026-11-02 — matches WholeFoodAnalysisCard's existing rule), not a gap",
  );
  assert(
    twoFoods.subjects[0].dimensions.valueForMoney.status === "gap" &&
      twoFoods.subjects[1].dimensions.valueForMoney.status === "gap",
    "value for money is an honest gap (THA stores no canonical prices)",
  );
  assert(
    twoFoods.subjects[1].dimensions.healthBenefits.status === "gap",
    "no evidence-gated benefit documented → honest gap, not an invented benefit",
  );
  assert(twoFoods.recommendation === null, "two whole foods tie on processing → NO recommendation");
  assert(
    (twoFoods.recommendationGap ?? "").includes("tie"),
    "honest-tie recommendation gap explains the tie",
    twoFoods.recommendationGap ?? "(null)",
  );

  // 2026-11-02 (owner) — "cheese and cucumber so much wrong here": a
  // canonical-food subject in an inherently-prepared category (Dairy,
  // Dairy alternatives, Fermented foods, Beverages) must NOT get the
  // "whole food, unprocessed, single ingredient, no additives" claim —
  // that was true for cucumber and false for cheese. Regression coverage
  // for the fix, not just the original (correct) vegetable case above.
  const wholeVsPrepared = buildComparison(
    [
      canonicalSubject("Cucumber", "Vegetables", ["Vitamin K"], []),
      canonicalSubject("Cheese", "Dairy", [], []),
    ],
    NO_HOUSEHOLD_SIGNAL,
  );
  assert(
    wholeVsPrepared.subjects[0].dimensions.processing.status === "evidence",
    "raw whole-food category (Vegetables) still gets the whole-food processing claim",
  );
  assert(
    wholeVsPrepared.subjects[0].dimensions.appleScore.status === "evidence" &&
      wholeVsPrepared.subjects[1].dimensions.appleScore.status === "gap",
    "whole-food category gets a real 5/5 Apple Score; the Dairy category does not get a false one",
  );
  assert(
    wholeVsPrepared.subjects[1].dimensions.processing.status === "gap",
    "inherently-prepared category (Dairy) does NOT get a false whole-food processing claim",
  );
  assert(
    wholeVsPrepared.subjects[1].dimensions.ingredientQuality.status === "gap" &&
      wholeVsPrepared.subjects[1].dimensions.additives.status === "gap",
    "Dairy subject's ingredient quality and additives are honest gaps, not a false 'single whole ingredient' claim",
  );
  assert(
    !(wholeVsPrepared.subjects[1].dimensions.processing.gapReason ?? "").toLowerCase().includes("unprocessed by definition"),
    "the Dairy gap text does not carry over the whole-food category's 'unprocessed by definition' claim",
  );
  // The old bug also corrupted the recommendation ladder: a Dairy subject
  // used to rank as "least processed" (rank 1) purely by canonical
  // identity, same as a true whole food — so it could win or tie a
  // comparison on a processing claim that was never actually true.
  assert(
    wholeVsPrepared.recommendationGap !== null &&
      !(wholeVsPrepared.recommendation?.basis ?? []).some((b) => b.includes("Least processed")),
    "an inherently-prepared canonical food is never ranked via the whole-food processing rung",
    JSON.stringify({ recommendation: wholeVsPrepared.recommendation, gap: wholeVsPrepared.recommendationGap }),
  );

  // Whole food vs NOVA-4 product — processing rung decides, cited.
  const foodVsProduct = buildComparison(
    [
      canonicalSubject("Broccoli", "vegetables", ["Vitamin C"], []),
      productSubject("Choco Puffs Cereal", { thaRating: 2, upfScore: 78, novaGroup: 4, nutriscoreGrade: "d" }),
    ],
    NO_HOUSEHOLD_SIGNAL,
  );
  assert(
    foodVsProduct.recommendation?.name === "Broccoli",
    "whole food vs NOVA-4 product → whole food recommended",
    JSON.stringify(foodVsProduct.recommendation),
  );
  assert(
    (foodVsProduct.recommendation?.basis ?? []).some((b) => b.includes("Least processed")),
    "recommendation basis cites the processing evidence",
  );
  assert(
    foodVsProduct.subjects[1].dimensions.appleScore.status === "evidence" &&
      foodVsProduct.subjects[1].dimensions.appleScore.summary!.includes("2/5"),
    "product Apple Score surfaces the STORED rating verbatim",
  );
  assert(
    foodVsProduct.subjects[1].dimensions.additives.status === "gap",
    "product additives are an honest gap (matches not stored in scan history)",
  );
  // 2026-11-02 (owner) — "everything should have an apple score": Broccoli
  // (a real whole food) now scores 5/5 by classification same as the
  // product's own stored rating, so this dimension is comparable now — it
  // used to be an honest gap only because the whole food side had none.
  const appleOutcome = foodVsProduct.dimensions.find((d) => d.dimension === "appleScore")!;
  assert(
    appleOutcome.comparable &&
      (appleOutcome.outcome ?? "").includes("5/5") &&
      (appleOutcome.outcome ?? "").includes("2/5"),
    "apple-score dimension is now comparable: whole food's classification score vs the product's stored rating",
    appleOutcome.outcome ?? "(null)",
  );

  // Two products, both with stored ratings — apple-score rung decides.
  const twoProducts = buildComparison(
    [
      productSubject("Oaty Bars", { thaRating: 4, novaGroup: 3 }),
      productSubject("Choco Bars", { thaRating: 2, novaGroup: 3 }),
    ],
    NO_HOUSEHOLD_SIGNAL,
  );
  assert(twoProducts.recommendation?.name === "Oaty Bars", "two rated products → higher stored Apple Score wins");
  assert(
    (twoProducts.recommendation?.basis ?? []).some((b) => b.includes("4/5") && b.includes("2/5")),
    "apple-score basis shows both stored ratings",
  );

  // One product missing a rating — apple rung skipped, NOVA decides.
  const novaDecides = buildComparison(
    [
      productSubject("Plain Yoghurt Pot", { novaGroup: 1 }),
      productSubject("Dessert Yoghurt Pot", { thaRating: 3, novaGroup: 4 }),
    ],
    NO_HOUSEHOLD_SIGNAL,
  );
  assert(
    novaDecides.recommendation?.name === "Plain Yoghurt Pot",
    "missing rating → ladder falls through to recorded NOVA groups",
    JSON.stringify(novaDecides.recommendation),
  );

  // No evidence to decide at all — honest "no recommendation".
  const noEvidence = buildComparison(
    [
      productSubject("Mystery Snack A", {}),
      productSubject("Mystery Snack B", {}),
    ],
    NO_HOUSEHOLD_SIGNAL,
  );
  assert(noEvidence.recommendation === null, "no stored scores anywhere → no recommendation");
  assert(
    (noEvidence.recommendationGap ?? "").includes("don't have full evidence for every compared item"),
    "recommendation gap says exactly why",
  );

  // Unresolved items — honest per-subject gaps; <2 resolved → ungrounded.
  const ungrounded = buildComparison(
    [canonicalSubject("Broccoli", "vegetables"), unresolvedSubject("xyzzy wonder food")],
    NO_HOUSEHOLD_SIGNAL,
  );
  assert(!ungrounded.trust.isGrounded, "one resolved + one unresolved → not grounded");
  assert(ungrounded.recommendation === null, "ungrounded comparison → no recommendation");
  assert(
    ungrounded.subjects[1].dimensions.processing.status === "gap",
    "unresolved subject: every dimension is a gap",
  );
  assert(
    ungrounded.trust.gaps.some((g) => g.includes("xyzzy wonder food")),
    "trust.gaps names the unresolved item",
  );

  // Determinism (Rule LT3) — byte-identical output for identical input.
  const again = buildComparison(
    [
      canonicalSubject("Broccoli", "vegetables", ["Vitamin C", "Fibre"], ["Immune function"]),
      canonicalSubject("Spinach", "vegetables", ["Iron", "Vitamin K"], []),
    ],
    NO_HOUSEHOLD_SIGNAL,
  );
  assert(JSON.stringify(again) === JSON.stringify(twoFoods), "pure core is deterministic (byte-identical)");

  // =========================================================================
  section("§1b Live-product subjects — 2026-11-02, owner: \"compare in foods should show both foods from analyser and THA's own library\"");

  // A live-searched product (never scanned by this caller) carries real
  // evidence, same as a stored scan — but must never be mislabelled as one.
  const liveProduct = liveProductSubject("Mystery Crisps", {
    thaRating: 3,
    upfScore: 55,
    novaGroup: 4,
    brand: "Snackco",
    ingredientsText: "potato, sunflower oil, salt, flavouring, E621",
    additiveCount: 2,
  });
  const liveDims = buildComparison([liveProduct, canonicalSubject("Broccoli", "Vegetables", [], [])], NO_HOUSEHOLD_SIGNAL)
    .subjects[0].dimensions;
  assert(
    liveDims.appleScore.status === "evidence" && liveDims.appleScore.rating === 3,
    "live-product Apple Score is real evidence with the structured rating, not a gap",
  );
  assert(
    liveDims.processing.status === "evidence" && (liveDims.processing.summary ?? "").includes("NOVA group 4"),
    "live-product processing dimension cites its real NOVA group",
  );
  assert(
    liveDims.ingredientQuality.status === "evidence" && liveDims.additives.status === "evidence",
    "live-product ingredient quality and additives are real evidence (the live search returned ingredient text), not a gap",
  );
  assert(
    liveDims.appleScore.evidence.every((e) => e.owner.includes("live product search")) &&
      liveDims.appleScore.evidence.every((e) => !e.owner.includes("your scan history")),
    "live-product evidence is owned by the live-search citation, never mislabelled as the caller's own scan history",
  );

  // A product with NO scan history and NO live match at all stays an honest
  // gap — the fallback never fabricates a match.
  const noMatch = buildComparison(
    [canonicalSubject("Broccoli", "Vegetables", [], []), unresolvedSubject("xyzzy not a real product")],
    NO_HOUSEHOLD_SIGNAL,
  );
  assert(noMatch.subjects[1].kind === "unresolved", "no canonical, scan-history, or live match → still an honest unresolved subject");

  // The recommendation ladder treats a live-product's real score the same
  // way it treats a scanned product's — but names the provenance honestly.
  const liveVsScanned = buildComparison(
    [
      liveProductSubject("Mystery Crisps", { thaRating: 2, novaGroup: 4 }),
      productSubject("Known Snack", { thaRating: 4, novaGroup: 4 }),
    ],
    NO_HOUSEHOLD_SIGNAL,
  );
  assert(
    liveVsScanned.recommendation?.name === "Known Snack",
    "apple-score rung decides between a live-searched product and a scanned one by the higher real rating",
    JSON.stringify(liveVsScanned.recommendation),
  );
  assert(
    (liveVsScanned.recommendation?.basis ?? []).some((b) => b.includes("live search") && b.includes("your scan history")),
    "the basis names each subject's real provenance (live search vs your scan history), never blurring the two",
    JSON.stringify(liveVsScanned.recommendation?.basis),
  );

  // =========================================================================
  section("§2 Trust rules — documentation is never ranked; safety decides");

  // Nutrient/benefit documentation NEVER contributes to the verdict: a food
  // with MORE documented facts must not beat a food with fewer on that basis.
  const docsDontRank = buildComparison(
    [
      canonicalSubject("Broccoli", "vegetables", ["Vitamin C", "Fibre", "Folate"], ["Immune function", "Digestion"]),
      canonicalSubject("Kohlrabi", "vegetables", [], []),
    ],
    NO_HOUSEHOLD_SIGNAL,
  );
  assert(
    docsDontRank.recommendation === null,
    "richly-documented food does NOT beat a sparsely-documented food (documentation ≠ quality)",
    JSON.stringify(docsDontRank.recommendation),
  );
  assert(
    (docsDontRank.recommendationGap ?? "").includes("Documented nutrients and benefits aren't ranked"),
    "the tie explanation states the documentation-honesty rule",
  );

  // Safety (Rule T0): a restriction-conflicting food is never recommended.
  assert(HOUSEHOLD_NUT_FREE.restrictionDefs.length > 0, "fixture: 'peanut' resolves to an active restriction");
  const safety = buildComparison(
    [canonicalSubject("Peanuts", "nuts"), canonicalSubject("Broccoli", "vegetables")],
    HOUSEHOLD_NUT_FREE,
  );
  assert(safety.trust.householdAware, "household signal resolved → household-aware");
  assert(
    safety.recommendation?.name === "Broccoli",
    "restriction-conflicting food loses on the safety rung",
    JSON.stringify(safety.recommendation),
  );
  assert(
    (safety.recommendation?.basis ?? []).some((b) => b.includes("household restriction")),
    "safety basis names the restriction conflict",
  );
  assert(
    safety.subjects[0].dimensions.householdSuitability.status === "evidence" &&
      safety.subjects[0].dimensions.householdSuitability.summary!.includes("Conflicts"),
    "suitability dimension states the conflict as owner evidence",
  );
  assert(
    safety.subjects[1].dimensions.householdSuitability.summary!.includes("3 planner appearance"),
    "familiar food's suitability carries planner familiarity evidence",
  );

  // Products cannot be verified against restrictions from stored data — the
  // recommendation must carry a check-the-label caveat when restrictions exist.
  const caveat = buildComparison(
    [
      productSubject("Oaty Bars", { thaRating: 4 }),
      productSubject("Choco Bars", { thaRating: 2 }),
    ],
    HOUSEHOLD_NUT_FREE,
  );
  assert(
    caveat.subjects[0].dimensions.householdSuitability.status === "gap",
    "product suitability is an honest gap (ingredients not stored)",
  );
  assert(
    (caveat.recommendation?.basis ?? []).some((b) => b.includes("check the label")),
    "recommendation over unverifiable products carries the check-the-label caveat",
  );

  // =========================================================================
  section("§3 Handler — compare verb, delegation, honest gaps");

  const cannedBundle = {
    ...buildComparison(
      [canonicalSubject("Broccoli", "vegetables"), productSubject("Choco Puffs Cereal", { thaRating: 2, novaGroup: 4 })],
      NO_HOUSEHOLD_SIGNAL,
    ),
    metadata: { assembledAt: "2026-07-09T00:00:00Z", sources: ["canonical-food-seed", "product-history"] },
  };
  let comparePortCalls: unknown[] = [];
  const inMemoryPort: FoodIntelligenceReadPort = {
    assembleFoodIntelligence: async () => {
      throw new Error("not under test");
    },
    identifyOpportunities: async () => {
      throw new Error("not under test");
    },
    assembleFoodComparison: async (request) => {
      comparePortCalls.push(request);
      return cannedBundle;
    },
  };
  const handler = createFoodIntelligenceReadHandler(async () => inMemoryPort);
  const context: IntelligenceContext = { role: "user", userId: "7", premium: false };
  const compareIntent = (parameters: Record<string, unknown>): Intent => ({
    verb: "compare",
    capabilityId: "food-intelligence",
    parameters,
  });

  const ok = (await handler(compareIntent({ items: ["broccoli", "choco puffs cereal"] }), context)) as FoodComparisonResult;
  assert(ok.source === "food-comparison-engine", "compare returns the comparison-engine result");
  assert(ok.subjects.length === 2 && ok.recommendation?.name === "Broccoli", "handler projects the engine bundle verbatim");
  assert(
    comparePortCalls.length === 1 && JSON.stringify((comparePortCalls[0] as { items: string[] }).items) === JSON.stringify(["broccoli", "choco puffs cereal"]),
    "handler DELEGATES to the port with the caller's items",
  );
  assert(
    (comparePortCalls[0] as { userId?: number }).userId === 7,
    "handler passes the caller's OWN authenticated user id",
  );

  async function expectGap(intent: Intent, label: string, mustInclude: string): Promise<void> {
    try {
      await handler(intent, context);
      assert(false, label, "expected a gap, got a result");
    } catch (err) {
      const isGap = err instanceof CapabilityExecutionError && err.failureStatus === "gap";
      assert(isGap && String((err as Error).message).includes(mustInclude), label, String((err as Error).message));
    }
  }

  await expectGap(compareIntent({}), "missing items → honest gap", "at least two");
  await expectGap(compareIntent({ items: ["broccoli"] }), "single item → honest gap", "at least two");
  await expectGap(compareIntent({ items: [1, 2] as unknown as string[] }), "non-string items → honest gap", "at least two");

  const ungroundedPort: FoodIntelligenceReadPort = {
    ...inMemoryPort,
    assembleFoodComparison: async () => ({
      ...buildComparison([unresolvedSubject("xyzzy"), unresolvedSubject("plugh")], NO_HOUSEHOLD_SIGNAL),
      metadata: { assembledAt: "2026-07-09T00:00:00Z", sources: [] },
    }),
  };
  const ungroundedHandler = createFoodIntelligenceReadHandler(async () => ungroundedPort);
  try {
    await ungroundedHandler(compareIntent({ items: ["xyzzy", "plugh"] }), context);
    assert(false, "ungrounded comparison → honest gap");
  } catch (err) {
    const isGap = err instanceof CapabilityExecutionError && err.failureStatus === "gap";
    assert(
      isGap && String((err as Error).message).includes("will not fabricate"),
      "ungrounded comparison → honest gap, never a one-sided comparison",
      String((err as Error).message),
    );
  }

  try {
    await handler({ verb: "add", capabilityId: "food-intelligence", parameters: {} }, context);
    assert(false, "write verb still gaps (read-only binding unchanged)");
  } catch (err) {
    assert(
      err instanceof CapabilityExecutionError && err.failureStatus === "gap",
      "write verb still gaps (read-only binding unchanged)",
    );
  }

  // =========================================================================
  section("§4 Resolver — comparison utterances route; neighbours keep theirs");

  const resolver = new PatternIntentResolver();
  const hints: IntentResolutionHints = { surface: "floating", temporalAnchor: "2026-07-09" };
  const resolve = (u: string): Promise<ResolvedIntent[]> => resolver.resolve(u, hints);
  const compareOf = (rs: ResolvedIntent[]): ResolvedIntent | undefined =>
    rs.find((r) => r.capability === "food-intelligence" && r.verb === "compare");

  const r1 = compareOf(await resolve("compare cheddar and brie"));
  assert(
    JSON.stringify(r1?.parameters?.items) === JSON.stringify(["cheddar", "brie"]),
    '"compare cheddar and brie" → food-intelligence:compare {items}',
    JSON.stringify(r1),
  );

  const r2 = compareOf(await resolve("which is healthier, butter or margarine?"));
  assert(
    JSON.stringify(r2?.parameters?.items) === JSON.stringify(["butter", "margarine"]),
    '"which is healthier, butter or margarine?" → compare',
    JSON.stringify(r2),
  );

  const r3 = compareOf(await resolve("is greek yoghurt healthier than regular yoghurt?"));
  assert(
    JSON.stringify(r3?.parameters?.items) === JSON.stringify(["greek yoghurt", "regular yoghurt"]),
    '"is greek yoghurt healthier than regular yoghurt?" → compare',
    JSON.stringify(r3),
  );

  const r4 = compareOf(await resolve("salmon vs mackerel"));
  assert(
    JSON.stringify(r4?.parameters?.items) === JSON.stringify(["salmon", "mackerel"]),
    '"salmon vs mackerel" → compare',
    JSON.stringify(r4),
  );

  const analyserForm = await resolve("compare these two products and tell me which is better.");
  assert(compareOf(analyserForm) === undefined, "analyser's demonstrative form does NOT route to compare");
  assert(
    analyserForm.some((r) => r.capability === "analyser"),
    "…and the analyser keeps its PR-067 route",
  );

  const crossDomain = await resolve("compare my shopping list to my pantry");
  assert(compareOf(crossDomain) === undefined, "cross-domain compare keeps its INT33 route (no poach)");

  const trailer = compareOf(await resolve("compare butter and margarine, and tell me which is better"));
  assert(
    JSON.stringify(trailer?.parameters?.items) === JSON.stringify(["butter", "margarine"]),
    "trailing 'which is better' clause is stripped before item capture",
    JSON.stringify(trailer),
  );

  // =========================================================================
  section("§5 Registry truthfulness");

  assert(
    FOOD_INTELLIGENCE_EXECUTABLE_INTENTS.includes("compare"),
    "compare is declared executable (INT6A truthfulness)",
  );
  const seed = new CapabilityRegistry().get("food-intelligence");
  assert(seed != null, "food-intelligence capability is registered");
  assert(
    (seed?.supportedIntents ?? []).includes("compare"),
    "compare is in supportedIntents (VALIDATE gate admits it)",
  );
  assert(
    FOOD_INTELLIGENCE_EXECUTABLE_INTENTS.every((v) => (seed?.supportedIntents ?? []).includes(v)),
    "executableIntents ⊆ supportedIntents",
  );

  // =========================================================================
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(`\nFailures:\n${failures.map((f) => `  - ${f}`).join("\n")}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test run crashed:", err);
  process.exit(1);
});
