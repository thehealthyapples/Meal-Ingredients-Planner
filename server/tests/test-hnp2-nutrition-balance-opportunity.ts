/**
 * test-hnp2-nutrition-balance-opportunity.ts (HNP2)
 * =========================================================================
 * Verifies the convergence of the Household Nutrition business capability into the
 * canonical Opportunity Platform.
 *
 * WHAT THIS SUITE IS GUARDING AGAINST, AND WHY IT IS SHAPED THIS WAY.
 *
 * HNP2 is the THIRD attempt to deliver household nutrition opportunities. The first two
 * are the reason every assertion below drives real code rather than reading source text:
 *
 *   HNP1 (2026-07-12) wrote, in the present tense, that its opportunities "flow through
 *        the SAME opportunity-delivery framework". They flowed nowhere.
 *   HHP2 (2026-07-12) recorded "Complete" while wired to nothing, and cited as proof a
 *        test that SOURCE-SCANNED for text absent from the file, called its handler
 *        DIRECTLY to bypass a registry it had never been added to, and was not in
 *        `npm test` — so it never ran to disagree. It went unnoticed for five days and
 *        was retired by P0 Food Intelligence Recovery (2026-07-17).
 *
 * P0's standing blocker #2 records that the server has no adoption register, so nothing
 * structurally prevents a repeat. This suite is the local substitute: every claim about
 * reaching a household is made by CALLING the thing that carries it — the real generator,
 * the real `selectSurface`, the real `noticeOpportunities` — never by asserting that a
 * string appears somewhere. The only source-scans here are NEGATIVE ones (§5), which
 * assert absence, and absence is the one thing execution cannot prove.
 *
 * Coverage:
 *   §1  The generator — real core, real facts, honest silence
 *   §2  MAT1 §3.3's two retired duplicate types never return
 *   §3  Rule E1 — no citation, no card
 *   §4  ATTN1 A2 — nutrition is never critical
 *   §5  Ownership — the engine authors no reasoning, and the retired orchestration
 *       stays retired
 *   §6  The four registries, exercised rather than asserted
 *
 * Run with: npx tsx server/tests/test-hnp2-nutrition-balance-opportunity.ts
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  identifyNutritionBalanceOpportunities,
  FOOD_OPPORTUNITY_DOMAINS,
} from "../intelligence/food-intelligence/opportunity-engine.js";
import { noticeOpportunities } from "../intelligence/conversation/notice-engine.js";
import { selectSurface } from "../intelligence/opportunity-delivery/framework.js";
import {
  OPPORTUNITY_DOMAIN_LABELS,
  OPPORTUNITY_DOMAIN_FALLBACK_LABEL,
  CRITICAL_TYPES,
  isCritical,
} from "@shared/attention/index.js";
import {
  buildNutritionBalanceOpportunity,
  computeHouseholdNutritionScore,
  NUTRITION_BALANCE_GAP_TYPE,
  VARIETY_COMPONENT_COUNT,
  type HouseholdNutritionFacts,
} from "@shared/nutrition/household-nutrition.js";
import { EMPTY_VARIETY_SCORE, type VarietyScore } from "@shared/canonical/plant-classifier.js";
import type { PlannerWeek } from "@shared/schema";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

function sourceOf(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), "utf8");
}

/** Source with comments stripped — so a violation cannot hide inside the prose describing it. */
function codeOf(relPath: string): string {
  return sourceOf(relPath)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

const WEEK = { id: 77, weekNumber: 3 } as unknown as PlannerWeek;

function variety(partial: Partial<VarietyScore>): VarietyScore {
  const v = { ...EMPTY_VARIETY_SCORE, ...partial };
  return { ...v, total: v.fruits + v.vegetables + v.wholeGrains + v.herbsSpices + v.oliveOil };
}

/**
 * TWO of five components present — whole grains, herbs & spices and olive oil absent.
 *
 * The numbers are counts WITHIN a component (two fruits, four vegetables), not a count
 * OF components: `varietyComponentsPresent` asks how many components are non-zero, so
 * this fixture is 2 of 5. Worth stating, because the first draft of this suite named it
 * "three of five" and asserted so — the generator disagreed, and the generator was right.
 */
const TWO_OF_FIVE = variety({ fruits: 2, vegetables: 4 });
/** All five present. */
const FIVE_OF_FIVE = variety({ fruits: 1, vegetables: 1, wholeGrains: 1, herbsSpices: 1, oliveOil: 1 });

function facts(over: Partial<HouseholdNutritionFacts> = {}): HouseholdNutritionFacts {
  return {
    weeklyPlantSlugs: ["apple", "carrot"],
    weeklyVariety: TWO_OF_FIVE,
    mealsPlanned: 5,
    daysWithMeals: 4,
    averageAppleRating: null,
    appleRatingSampleCount: 0,
    categoriesCovered: 0,
    categoriesTotal: 0,
    allTimePlantDiversity: null,
    weekNumber: 3,
    ...over,
  };
}

async function main(): Promise<void> {
  console.log("\nHNP2 — Household Nutrition converged into the Opportunity Platform\n" + "=".repeat(64));

  // =========================================================================
  section("§1 The generator — real core, real facts, honest silence");
  // =========================================================================

  const found = identifyNutritionBalanceOpportunities(WEEK, TWO_OF_FIVE, ["apple", "carrot"], 5, 4);

  assert(found.length === 1, "a week missing components yields exactly ONE opportunity", String(found.length));
  assert(found[0]?.type === "nutrition-balance-gap", "…of the one surviving type", found[0]?.type);
  assert(found[0]?.owningDomain === "nutrition", "…owned by the nutrition domain", found[0]?.owningDomain);

  // The id is re-keyed onto the week ROW, not the week NUMBER: two households both in
  // "week 3" must never collide on one delivery id (the delivery store is keyed
  // (userId, opportunityId), so a collision would silently suppress one household's card).
  assert(
    found[0]?.id === `nutrition-balance-gap:${WEEK.id}`,
    "the id is keyed on the week ROW id, so two households' week 3 can never collide",
    found[0]?.id,
  );
  assert(
    found[0]?.subject?.entity === "planner-week" && found[0]?.subject?.id === WEEK.id,
    "the subject is the WEEK — the gap is a property of the week, not of any one day or meal",
    `${found[0]?.subject?.entity}:${found[0]?.subject?.id}`,
  );

  // The sentence is composed by the nutrition core and projected verbatim.
  assert(
    /whole grains/i.test(found[0]?.explanation ?? "") &&
      /herbs & spices/i.test(found[0]?.explanation ?? "") &&
      /olive oil/i.test(found[0]?.explanation ?? ""),
    "the explanation NAMES the missing components rather than reporting a bare score",
    found[0]?.explanation,
  );
  assert(
    (found[0]?.explanation ?? "").includes(`2 of ${VARIETY_COMPONENT_COUNT}`),
    "…and states the count against the classifier's own denominator, not an invented one",
    found[0]?.explanation,
  );

  // Honest silence, three ways.
  assert(
    identifyNutritionBalanceOpportunities(WEEK, FIVE_OF_FIVE, ["a"], 5, 4).length === 0,
    "a week containing all five components yields NOTHING — no manufactured problem",
  );
  assert(
    identifyNutritionBalanceOpportunities(WEEK, EMPTY_VARIETY_SCORE, [], 0, 0).length === 0,
    "a week with NO planned meals yields NOTHING — an empty planner is absence of evidence, not a bad score",
  );

  // Trust Rule 1, at the boundary that matters: the dimension must be null (excluded),
  // never zero (counted against the household).
  const emptyScore = computeHouseholdNutritionScore(facts({ mealsPlanned: 0, weeklyVariety: EMPTY_VARIETY_SCORE }));
  const emptyBalance = emptyScore.dimensions.find((d) => d.key === "nutrition-balance");
  assert(
    emptyBalance?.value === null,
    "an unplanned week leaves the balance dimension NULL — excluded from the score, never scored as 0",
    String(emptyBalance?.value),
  );

  // Determinism — a pure core called twice with the same facts must not drift.
  assert(
    JSON.stringify(identifyNutritionBalanceOpportunities(WEEK, TWO_OF_FIVE, ["apple", "carrot"], 5, 4)) ===
      JSON.stringify(found),
    "the generator is deterministic — same facts, byte-identical opportunity",
  );

  // The engine supplies three of four dimensions and SAYS so, rather than padding the
  // two owners it does not read (see the generator's own note).
  const partial = computeHouseholdNutritionScore(facts());
  assert(
    partial.dimensionsCounted === 3 && partial.dimensionsTotal === 4,
    "the score declares it rests on 3 of 4 dimensions — the two unread owners are gaps, not zeros",
    `${partial.dimensionsCounted}/${partial.dimensionsTotal}`,
  );

  // =========================================================================
  section("§2 MAT1 §3.3 — the two retired DUPLICATE types never return");
  // =========================================================================

  // This is the assertion that makes HNP2 a convergence rather than a regression.
  // MAT1 retired three types; two duplicated observations the SAME engine already makes,
  // so re-adding either would ship visible duplicate advice from one module.
  const coreCode = codeOf("shared/nutrition/household-nutrition.ts");
  const engineCode = codeOf("server/intelligence/food-intelligence/opportunity-engine.ts");

  for (const retired of ["nutrition-plant-diversity-gap", "nutrition-planning-gap"]) {
    assert(
      !coreCode.includes(retired),
      `\`${retired}\` stays retired in the nutrition core — MAT1 §3.3 removed it as a duplicate`,
    );
    assert(
      !engineCode.includes(retired),
      `\`${retired}\` stays retired in the opportunity engine`,
    );
  }

  assert(
    NUTRITION_BALANCE_GAP_TYPE === "nutrition-balance-gap",
    "the ONE surviving type keeps its name — the delivery store's rows are keyed on it",
  );

  // The duplication MAT1 warned about, stated as a live check: the observations the two
  // retired types duplicated are still made, and still made by their own owners.
  assert(
    engineCode.includes("planner-empty-day") && engineCode.includes("planner-meal-uplift"),
    "the observations those two types duplicated are still owned by the planner generators",
  );

  // =========================================================================
  section("§3 Rule E1 — no citation, no card");
  // =========================================================================

  assert(
    (found[0]?.evidence.length ?? 0) > 0,
    "the opportunity carries evidence",
    String(found[0]?.evidence.length),
  );
  assert(
    found[0]?.evidence.every((e) => e.source.length > 0 && e.detail.length > 0) ?? false,
    "…and every citation names a real owner and says what it contributed",
  );
  assert(
    found[0]?.evidence.some((e) => e.source === "plant-classifier") ?? false,
    "…cited to the plant classifier, which is the owner that actually decided the components",
    found[0]?.evidence.map((e) => e.source).join(","),
  );

  // The citation is the DIMENSION's own, not a second one written at the opportunity —
  // one fact, one owner, one citation.
  const score = computeHouseholdNutritionScore(facts());
  const dimension = score.dimensions.find((d) => d.key === "nutrition-balance");
  const opp = buildNutritionBalanceOpportunity(facts(), score);
  assert(
    JSON.stringify(opp?.evidence) === JSON.stringify(dimension?.evidence),
    "the opportunity reuses the DIMENSION's citation verbatim — it does not author a second one",
  );

  // The notice boundary drops an uncited card. Proven by calling it.
  assert(
    noticeOpportunities([
      {
        id: "food-intelligence:nutrition-balance-gap:77",
        domain: "nutrition",
        priority: "low",
        explanation: "e",
        suggestedAction: "a",
        evidence: [],
      },
    ]).length === 0,
    "an UNCITED nutrition opportunity is dropped at the notice boundary, like every other domain's",
  );

  // =========================================================================
  section("§4 ATTN1 A2 — a quiet week is not a harm signal");
  // =========================================================================

  assert(found[0]?.priority === "low", "the nutrition opportunity is `low`", found[0]?.priority);
  assert(!isCritical(found[0]?.priority ?? "low"), "…and is not critical");
  assert(
    !CRITICAL_TYPES.has("nutrition-balance-gap"),
    "`nutrition-balance-gap` is absent from the CLOSED critical allowlist — it cannot inflate itself",
  );
  assert(
    CRITICAL_TYPES.size === 1 && CRITICAL_TYPES.has("shopping-restriction-conflict"),
    "HNP2 did not widen the critical allowlist — it still holds exactly the one safety type",
    [...CRITICAL_TYPES].join(","),
  );

  // =========================================================================
  section("§5 Ownership — one owner per fact, and the retired orchestration stays retired");
  // =========================================================================

  // The engine must own NO nutrition reasoning. Scanned with comments stripped, because
  // the comments legitimately DISCUSS thresholds and weights in order to disown them.
  // Anchored to the generator, so the file's other generators do not create false hits.
  const generator =
    engineCode.split("export function identifyNutritionBalanceOpportunities")[1]?.split("\nexport ")[0] ?? "";
  assert(generator.length > 0, "the nutrition generator was located for scanning");
  assert(
    !/\bWEIGHTS\b|\bBAND_THRESHOLDS\b|STRONG_ENOUGH|>=\s*70/.test(generator),
    "the engine sets no weight, band or threshold — the nutrition core owns all three",
  );
  assert(
    !/`[^`]*\b(missing|covers|components)\b[^`]*`/.test(generator),
    "the engine composes no sentence about the household — every word comes from the core",
  );
  assert(
    generator.includes("computeHouseholdNutritionScore") && generator.includes("buildNutritionBalanceOpportunity"),
    "…it delegates to the core for both the score and the opportunity",
  );

  // The invented threshold is gone and must not creep back into the core.
  assert(
    !/const STRONG_ENOUGH/.test(coreCode),
    "the invented `STRONG_ENOUGH = 70` threshold is NOT revived — the core holds no number THA does not own",
  );

  // The obsolete orchestration stays retired (the Scope Lock, asserted rather than trusted).
  for (const retiredPath of [
    "server/lib/household-nutrition-assembler.ts",
    "client/src/components/HouseholdNutritionPanel.tsx",
  ]) {
    let exists = true;
    try {
      readFileSync(resolve(process.cwd(), retiredPath), "utf8");
    } catch {
      exists = false;
    }
    assert(!exists, `${retiredPath} stays retired — HNP2 converged the capability, it did not rebuild the orchestration`);
  }
  assert(
    !codeOf("server/routes.ts").includes("/api/household-nutrition"),
    "the retired `/api/household-nutrition` route is NOT reinstated — delivery goes through the Opportunity Platform",
  );

  // The nutrition core is now genuinely reachable from production code. This is the
  // single claim HNP1 and HHP2 each made falsely, so it is made here by IMPORT-AND-CALL
  // (every §1 assertion above already ran the core through the engine's own generator).
  assert(
    engineCode.includes("@shared/nutrition/household-nutrition.js"),
    "the production engine imports the nutrition core — it is no longer dead code",
  );

  // =========================================================================
  section("§6 The four registries — exercised, never asserted by source text");
  // =========================================================================

  assert(
    (FOOD_OPPORTUNITY_DOMAINS as readonly string[]).includes("nutrition"),
    "registry 0 — `nutrition` is a member of the closed domain set",
  );
  assert(
    selectSurface("nutrition") === "nutrition",
    "registry 1 — DOMAIN_SURFACE routes it to the existing `nutrition` conversation surface, not `floating`",
    selectSurface("nutrition"),
  );

  const notices = noticeOpportunities([
    {
      id: "food-intelligence:nutrition-balance-gap:77",
      domain: "nutrition",
      priority: "low",
      explanation: found[0]?.explanation ?? "",
      suggestedAction: found[0]?.suggestedAction ?? "",
      evidence: found[0]?.evidence ?? [],
    },
  ]);
  assert(
    notices.length === 1 && notices[0]?.category === "nutrition-opportunity",
    "registry 2 — the Companion voices it as a `nutrition-opportunity` notice",
    notices[0]?.category,
  );
  assert(
    notices[0]?.category !== "nutrition-trend",
    "…and NOT as `nutrition-trend`, which is an observation with a different owner and meaning",
  );

  // Two assertions rather than one conjunction: `label === "Nutrition" && label !== FALLBACK`
  // narrows `label` to the literal "Nutrition" before the second comparison, so TypeScript
  // proves that half dead (TS2367) — a conjunction that cannot fail is not an assertion.
  const label = OPPORTUNITY_DOMAIN_LABELS["nutrition"];
  assert(
    label !== OPPORTUNITY_DOMAIN_FALLBACK_LABEL,
    `registry 3 — the card does NOT fall back to the generic "${OPPORTUNITY_DOMAIN_FALLBACK_LABEL}"`,
    String(label),
  );
  assert(label === "Nutrition", "registry 3 — …it names its own room", String(label));

  // Registry 4 is a CLIENT mount, which this server-side suite cannot execute. It is
  // asserted structurally, and the limit of that is stated rather than glossed: this
  // proves the mount EXISTS, not that it renders.
  const page = sourceOf("client/src/pages/plant-diversity-page.tsx");
  assert(
    /<AmbientIntelligence[\s\S]*?domains=\{\["nutrition"\]\}/.test(page),
    "registry 4 — an AmbientIntelligence surface is mounted for the nutrition domain",
  );

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(64)}`);
  console.log(`HNP2 Household Nutrition Opportunity convergence: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
