/**
 * CBK2 — Intelligent Cookbook Evolution
 * =====================================
 * Proves the six faces of the intelligent Cookbook, and — more importantly — proves the
 * TWO THINGS CBK2 REFUSES TO DO, because those are what a future edit is most likely to
 * undo without understanding why they were refused:
 *
 *   §1 The recipe explainer is WEEK-FREE (the load-bearing decision).
 *      It must never emit a week-relative claim, because the Cookbook has no week. §1.5
 *      is the guard: every string the explainer can emit is asserted clean against the
 *      vocabulary of a week ("this week", "new to your week", "your plan", …). Passing
 *      the Planner's explainer an empty week would silence three of its dimensions and
 *      make TWO OF THEM LIE — every plant would read as "new to your week". That is the
 *      bug this whole suite exists to make unrepeatable.
 *
 *   §2 The Cookbook authors NO SCORE.
 *      `RecipeExplanation` carries no score and no scoreBreakdown, by type and by
 *      assertion. The Planner ranks because it must choose; the Cookbook describes.
 *
 * §3 covers the two cookbook opportunity generators (pantry-aware cooking,
 * household-aware recipes) and their honest gaps. §4 covers the Decision Engine
 * producer/delivery contract the Cookbook now enrols in.
 *
 * Every generator and the explainer are PURE, so all of this runs with no database.
 */

import {
  generateRecipeExplanation,
  type RecipeExplanation,
} from "../lib/explainability-service.js";
import {
  EMPTY_PLANNER_EXPLANATION_CONTEXT,
  type PlannerExplanationContext,
  type PlannerOpportunitySignal,
} from "../lib/planner-explanation-context.js";
import type { MealCompatibilityResult } from "../lib/household-meal-matcher.js";
import {
  identifyCookbookCookableNowOpportunities,
  identifyCookbookHouseholdConflictOpportunities,
  prioritizeOpportunities,
  type FoodOpportunity,
} from "../intelligence/food-intelligence/opportunity-engine.js";
import { selectSurface } from "../intelligence/opportunity-delivery/framework.js";
import { noticeOpportunities } from "../intelligence/conversation/notice-engine.js";
import type { UserPantryItem } from "@shared/schema";
import type { RestrictionDefinition } from "@shared/restrictions/restriction-types.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string, detail = ""): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}${detail ? ` — ${detail}` : ""}`);
  }
}

// ---------------------------------------------------------------------------
// Fixtures — real canonical foods, so the canonical resolver actually resolves them.
// ---------------------------------------------------------------------------

function pantryItem(id: number, ingredientKey: string, displayName?: string): UserPantryItem {
  return {
    id,
    userId: 1,
    ingredientKey,
    displayName: displayName ?? ingredientKey,
    isDeleted: false,
    defaultHave: true,
  } as unknown as UserPantryItem;
}

/**
 * A hard restriction definition, shaped exactly as the restriction OWNER defines it.
 * Copied from `test-shop1-intelligent-shopping.ts` rather than re-invented — the whole
 * point of CBK2 is that Shopping and the Cookbook go through the SAME resolver, so
 * their fixtures must not drift into disagreeing about what a restriction is.
 */
function restriction(displayName: string, aliases: string[]): RestrictionDefinition {
  return {
    id: displayName.toLowerCase().replace(/\s+/g, "_"),
    displayName,
    tier: "major",
    aliases,
    derivedIngredients: [],
    hiddenIngredients: [],
    substitutions: [],
    prohibitedPhrases: [],
  } as unknown as RestrictionDefinition;
}

const VEGETARIAN_RESTRICTION = restriction("Vegetarian", [
  "chicken",
  "beef",
  "pork",
  "lamb",
  "bacon",
]);

/** A context in which every owner was readable — the "fully aware" case. */
function awareContext(overrides: Partial<PlannerExplanationContext> = {}): PlannerExplanationContext {
  return {
    ...EMPTY_PLANNER_EXPLANATION_CONTEXT,
    season: "summer",
    seasonalFoods: new Map([["tomato", "Tomato"]]),
    pantryFoods: new Map([
      ["tomato", "Tomato"],
      ["onion", "Onion"],
    ]),
    familiarFoods: new Map([["tomato", 4]]),
    seasonAware: true,
    pantryAware: true,
    historyAware: true,
    learningAware: true,
    opportunityAware: true,
    ...overrides,
  };
}

function householdFit(compatible: number, total: number, swaps: string[]): MealCompatibilityResult {
  const memberChanges = Array.from({ length: total }, (_, i) => ({
    userId: i + 1,
    displayName: `Member ${i + 1}`,
    swaps: i < total - compatible ? swaps : [],
  }));
  return {
    sharedIngredients: [],
    memberChanges,
    swapsNeeded: swaps,
    extraPrepMinutes: 0,
    fitScore: 0.8,
    scoreBreakdown: {} as MealCompatibilityResult["scoreBreakdown"],
    explanation: "",
  };
}

const allDetails = (e: RecipeExplanation): string => e.evidence.map((x) => x.detail).join(" | ");

// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n§1 — RECIPE REASONING: the explainer is WEEK-FREE (the load-bearing decision)");
// ═══════════════════════════════════════════════════════════════════════════════

{
  const explanation = generateRecipeExplanation(
    { name: "Tomato Pasta", ingredients: ["tomato", "onion", "pasta"], dietTypes: ["vegetarian"] },
    null,
    awareContext(),
    householdFit(3, 3, []),
  );

  // §1.1 — every face the brief asked for is reachable and cited.
  const dims = explanation.evidence.map((e) => e.dimension);
  assert(dims.includes("household-suitability"), "§1.1 household-aware — household fit is cited");
  assert(dims.includes("pantry-usage"), "§1.1 pantry-aware — pantry coverage is cited");
  assert(dims.includes("plant-diversity"), "§1.1 nutrition-aware — plant diversity is cited");
  assert(dims.includes("seasonal-suitability"), "§1.1 seasonality is cited");
  assert(dims.includes("household-history"), "§1.1 household history is cited");

  // §1.2 — Rule E1: no citation, no reason. `reasons` is DERIVED from `evidence`.
  assert(
    explanation.reasons.length > 0 && explanation.reasons.length <= explanation.evidence.length,
    "§1.2 every reason is derived from evidence (Rule E1 — no citation, no card)",
  );
  assert(
    explanation.reasons.every((r) => explanation.evidence.some((e) => e.detail === r)),
    "§1.2 no reason exists that is not verbatim a piece of cited evidence",
  );
  assert(
    explanation.evidence.every((e) => e.source.length > 0),
    "§1.2 every evidence entry names the owner it was read from",
  );

  // §1.3 — THE GUARD. The Cookbook has no week. No emitted string may claim one.
  //
  // These are the exact phrases the Planner's explainer emits from its week-relative
  // dimensions. If a future edit "simplifies" CBK2 by calling generateMealExplanation
  // with EMPTY_PLANNER_WEEK_STATE, this assertion is what fails.
  const WEEK_VOCABULARY = [
    "this week",
    "your week",
    "new plant",       // "Adds N new plants to your week"
    "your plan",       // "already on your plan N times this week"
    "so far",          // "£X of £Y planned so far"
    "on budget",
    "keeps you within",
    "moves you toward",
  ];
  const emitted = allDetails(explanation).toLowerCase();
  for (const phrase of WEEK_VOCABULARY) {
    assert(
      !emitted.includes(phrase),
      `§1.3 WEEK GUARD — the explainer never says "${phrase}" (there is no week in a cookbook)`,
      emitted,
    );
  }

  // §1.4 — the plant-diversity line is a STANDING fact, not a week-relative one.
  const plant = explanation.evidence.find((e) => e.dimension === "plant-diversity");
  assert(
    plant != null && /brings \d+ distinct plant/i.test(plant.detail),
    "§1.4 plant diversity is stated as a standing property (\"brings N distinct plants\")",
    plant?.detail,
  );

  // §1.5 — NO SCORE. The Cookbook describes; it does not rank.
  assert(
    !("scoreBreakdown" in explanation) && !("score" in explanation),
    "§1.5 NO SCORE — RecipeExplanation carries no score and no scoreBreakdown",
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n§2 — RECIPE REASONING: honest gaps (an unreadable owner is SILENT, never zero)");
// ═══════════════════════════════════════════════════════════════════════════════

{
  // A brand-new household: nothing readable at all.
  const empty = generateRecipeExplanation(
    { name: "Tomato Pasta", ingredients: ["tomato", "onion"] },
    null,
    EMPTY_PLANNER_EXPLANATION_CONTEXT,
    null,
  );
  const dims = empty.evidence.map((e) => e.dimension);

  assert(!dims.includes("pantry-usage"), "§2.1 unreadable pantry ⇒ SILENT (not \"you have 0 of 2\")");
  assert(!dims.includes("household-suitability"), "§2.1 no household ⇒ SILENT (not \"suits 0 people\")");
  assert(!dims.includes("seasonal-suitability"), "§2.1 no seasonality ⇒ SILENT");
  assert(!dims.includes("household-history"), "§2.1 no planner history ⇒ SILENT");
  assert(
    empty.awareness.pantry === false && empty.awareness.household === false,
    "§2.2 awareness flags report the gaps honestly rather than hiding them",
  );
  // Plant diversity is derived purely from the recipe's own ingredients — it needs no
  // household owner, so it legitimately survives an entirely empty context.
  assert(
    dims.includes("plant-diversity"),
    "§2.3 plant diversity still fires — it is a property of the RECIPE, needing no owner",
  );

  // §2.4 — the Planner tells a household a candidate "introduces N new foods" (novelty is
  // a reason to CHOOSE). Said about a recipe they already own, that reads as a reproach.
  const noHistory = generateRecipeExplanation(
    { name: "Exotic Dish", ingredients: ["tomato"] },
    null,
    awareContext({ familiarFoods: new Map(), historyAware: true }),
    null,
  );
  assert(
    !allDetails(noHistory).toLowerCase().includes("hasn't planned before"),
    "§2.4 never says a recipe the household OWNS \"introduces foods you haven't planned before\"",
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n§3 — OPPORTUNITY-AWARE + LEARNED PREFERENCE (cited verbatim, never reworded)");
// ═══════════════════════════════════════════════════════════════════════════════

{
  const opportunity: PlannerOpportunitySignal = {
    id: "pantry-item-unused-in-plan:9",
    type: "pantry-item-unused-in-plan",
    domain: "pantry",
    explanation: "Onion is in your pantry but hasn't appeared in any of your planned meals yet.",
    subjectFoodSlug: "onion",
    subjectLabel: "Onion",
  };

  const explanation = generateRecipeExplanation(
    { name: "Onion Soup", ingredients: ["onion"], cuisine: "french" },
    null,
    awareContext({
      openOpportunities: [opportunity],
      opportunityAware: true,
      learnedPreferences: [
        {
          domain: "planner",
          subjectType: "cuisine",
          subjectKey: "french",
          direction: "positive",
          confidence: "high",
          rationale: "Your household has chosen French meals 6 times.",
        },
      ],
    }),
    null,
  );

  const opp = explanation.evidence.find((e) => e.dimension === "open-opportunity");
  assert(opp != null, "§3.1 opportunity-aware — a recipe advancing an OPEN opportunity is cited");
  assert(
    opp != null && opp.detail.includes("hasn't appeared in any of your planned meals yet"),
    "§3.2 the producer's OWN explanation is carried verbatim — never reworded by the Cookbook",
    opp?.detail,
  );

  const learned = explanation.evidence.find((e) => e.dimension === "learned-preference");
  assert(
    learned != null && learned.detail === "Your household has chosen French meals 6 times.",
    "§3.3 LEARN1's own rationale is cited VERBATIM (ET6)",
    learned?.detail,
  );

  // A NEGATIVE understanding re-weights silently in the Planner and must stay silent here:
  // "we ranked this lower because you keep rejecting lamb" is a judgement about the
  // household, not a fact about the food (Rule T1).
  const negative = generateRecipeExplanation(
    { name: "Lamb Stew", ingredients: ["onion"], primaryProtein: "lamb" },
    null,
    awareContext({
      learnedPreferences: [
        {
          domain: "planner",
          subjectType: "primary-protein",
          subjectKey: "lamb",
          direction: "negative",
          confidence: "high",
          rationale: "Your household has rejected lamb 5 times.",
        },
      ],
    }),
    null,
  );
  assert(
    !allDetails(negative).includes("rejected lamb"),
    "§3.4 a NEGATIVE learned preference is never spoken back at the household",
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n§4 — PANTRY-AWARE COOKING (cookbook-recipe-cookable-now)");
// ═══════════════════════════════════════════════════════════════════════════════

{
  const pantry = [pantryItem(1, "tomato", "Tomatoes"), pantryItem(2, "onion", "Onions")];

  const cookable = identifyCookbookCookableNowOpportunities(
    [{ id: 10, name: "Tomato & Onion Salad", ingredients: ["tomato", "onion"] }],
    pantry,
  );
  assert(cookable.length === 1, "§4.1 a recipe whose every ingredient is in the pantry produces a card");
  assert(
    cookable[0]?.owningDomain === "cookbook" && cookable[0]?.subject.entity === "meal",
    "§4.1 the card is owned by the COOKBOOK domain and is about a MEAL",
  );
  assert(
    cookable[0]?.id === "cookbook-recipe-cookable-now:10",
    "§4.2 the id is deterministic and keyed on the meal's own primary key",
  );
  assert(
    (cookable[0]?.evidence.length ?? 0) >= 2,
    "§4.3 Rule E1 — the card cites BOTH owners it joined (meals + pantry-items)",
  );
  assert(cookable[0]?.priority === "low", "§4.4 a meal you could cook is a possibility, not a call to action");

  // §4.5 — THE HONEST-GAP RULE. A missing ingredient means NO card. Never "close enough".
  const missing = identifyCookbookCookableNowOpportunities(
    [{ id: 11, name: "Tomato & Beef Stew", ingredients: ["tomato", "onion", "beef"] }],
    pantry,
  );
  assert(missing.length === 0, "§4.5 a recipe missing ONE ingredient produces NO card (never \"nearly cookable\")");

  // §4.6 — the sharpest one. An ingredient THA cannot resolve is a GAP IN THA'S KNOWLEDGE,
  // not an ingredient the household is known to own. Silently skipping it and declaring
  // the meal cookable would send someone to the hob without the thing they are missing.
  const unresolvable = identifyCookbookCookableNowOpportunities(
    [{ id: 12, name: "Mystery Dish", ingredients: ["tomato", "onion", "xyzzy-not-a-food-42"] }],
    pantry,
  );
  assert(
    unresolvable.length === 0,
    "§4.6 an UNIDENTIFIABLE ingredient blocks the card — a knowledge gap is never treated as \"owned\"",
  );

  // §4.7 — no pantry, no claim.
  assert(
    identifyCookbookCookableNowOpportunities(
      [{ id: 13, name: "Tomato Salad", ingredients: ["tomato"] }],
      [],
    ).length === 0,
    "§4.7 an empty pantry produces no cookable-now card",
  );

  // §4.8 — deterministic.
  const a = identifyCookbookCookableNowOpportunities(
    [{ id: 10, name: "Tomato & Onion Salad", ingredients: ["tomato", "onion"] }],
    pantry,
  );
  assert(
    JSON.stringify(a) === JSON.stringify(cookable),
    "§4.8 the same data always yields the same card (deterministic — Rule LT3)",
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n§5 — HOUSEHOLD-AWARE RECIPES (cookbook-recipe-household-conflict)");
// ═══════════════════════════════════════════════════════════════════════════════

{
  const conflicts = identifyCookbookHouseholdConflictOpportunities(
    [
      { id: 20, name: "Chicken Curry", ingredients: ["chicken", "onion"] },
      { id: 21, name: "Tomato Pasta", ingredients: ["tomato", "pasta"] },
    ],
    [VEGETARIAN_RESTRICTION],
  );

  assert(conflicts.length === 1, "§5.1 only the recipe that actually conflicts produces a card");
  assert(conflicts[0]?.subject.id === 20, "§5.1 the card names the conflicting recipe");
  assert(
    conflicts[0]?.evidence.some((e) => e.source === "household-eaters"),
    "§5.2 Rule E1 — the restriction is cited to household-eaters",
  );
  assert(
    conflicts[0]?.evidence.some((e) => e.detail.includes("chicken")),
    "§5.3 the card names the INGREDIENT that caused the conflict, not just the recipe",
  );

  // §5.4 — attention is spent where the risk is. A recipe sitting in a cookbook harms
  // nobody until it is cooked; food about to be BOUGHT AND EATEN is the critical case.
  // ATTN1 invariant A2 also reserves `critical` to a closed allowlist.
  assert(
    conflicts[0]?.priority === "medium",
    "§5.4 a cookbook conflict is `medium` — only shopping-restriction-conflict may be `critical`",
    conflicts[0]?.priority,
  );

  // §5.5 — it SURFACES, it never acts. No recipe is deleted, hidden or rewritten.
  assert(
    /adapt|keep it as it is/i.test(conflicts[0]?.suggestedAction ?? ""),
    "§5.5 the action is a SUGGESTION to adapt or keep — CBK2 never edits a household's recipe",
    conflicts[0]?.suggestedAction,
  );

  assert(
    identifyCookbookHouseholdConflictOpportunities(
      [{ id: 20, name: "Chicken Curry", ingredients: ["chicken"] }],
      [],
    ).length === 0,
    "§5.6 no restrictions ⇒ no conflict cards (never a guessed restriction)",
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n§6 — DECISION ENGINE: the Cookbook enrols, and inherits everything");
// ═══════════════════════════════════════════════════════════════════════════════

{
  // §6.1 — surface routing. `cookbook` is the Business Domain; `meals` is the Companion
  // surface that already existed for it. Without the DOMAIN_SURFACE row this falls back
  // to "floating" — an honest gap where an exact answer exists.
  assert(
    selectSurface("cookbook") === "meals",
    "§6.1 the cookbook domain routes to the EXISTING `meals` conversation surface",
    selectSurface("cookbook"),
  );

  // §6.2 — THE SILENT-DROP GUARD. An unmapped domain is silently dropped by the Notice
  // Engine, one step before the household could ever read it. This asserts the Cookbook
  // is not that domain.
  const notices = noticeOpportunities([
    {
      id: "food-intelligence:cookbook-recipe-cookable-now:10",
      domain: "cookbook",
      priority: "low",
      explanation: "You have everything for \"Tomato Salad\".",
      suggestedAction: "Cook it from what you already have.",
      evidence: [{ source: "meals", detail: "It is in your cookbook." }],
    },
  ]);
  assert(
    notices.length === 1 && notices[0]?.category === "cookbook-opportunity",
    "§6.2 a cookbook opportunity reaches the Companion as a `cookbook-opportunity` notice",
  );

  // §6.3 — Rule E1 is enforced at the delivery boundary too: no citation, no notice.
  assert(
    noticeOpportunities([
      {
        id: "x",
        domain: "cookbook",
        priority: "low",
        explanation: "e",
        suggestedAction: "a",
        evidence: [],
      },
    ]).length === 0,
    "§6.3 an uncited cookbook opportunity is DROPPED at the notice boundary (Rule E1)",
  );

  // §6.4 — the Cookbook inherits ordering/budgeting from the ONE Decision Engine. It
  // writes no suppression, ranking, budgeting or lifecycle code of its own.
  const mixed: FoodOpportunity[] = [
    ...identifyCookbookCookableNowOpportunities(
      [{ id: 10, name: "Tomato Salad", ingredients: ["tomato"] }],
      [pantryItem(1, "tomato", "Tomatoes")],
    ),
    ...identifyCookbookHouseholdConflictOpportunities(
      [{ id: 20, name: "Chicken Curry", ingredients: ["chicken"] }],
      [VEGETARIAN_RESTRICTION],
    ),
  ];
  const ordered = prioritizeOpportunities(mixed, 10);
  assert(
    ordered[0]?.priority === "medium" && ordered[ordered.length - 1]?.priority === "low",
    "§6.4 cookbook cards are ordered by the canonical attention mechanics (medium before low)",
  );
}

// ---------------------------------------------------------------------------

console.log(`\n${"─".repeat(60)}`);
console.log(`CBK2: ${passed} passed, ${failed} failed`);
console.log(`${"─".repeat(60)}\n`);

if (failed > 0) process.exit(1);
