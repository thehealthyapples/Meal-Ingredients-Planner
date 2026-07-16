/**
 * PANTRY1 — Intelligent Pantry Evolution
 * ======================================
 * Proves the Pantry's six faces — household-aware, planner-aware, shopping-aware,
 * cookbook-aware, nutrition-aware, and reasoned — none of which is a new engine.
 *
 * PANTRY1 CREATED NO PANTRY ENGINE. The reasoning lives in the ONE explanation owner
 * (`explainability-service.ts`, beside the Planner's and the Cookbook's); the one new
 * opportunity is a generator at the extension point the opportunity engine's own type union
 * already advertised; and the composition is an assembler that owns nothing. Every card
 * therefore inherits muting, lifecycle suppression, the attention budget, household learning,
 * surface routing and the Decision→Evidence loop from the Decision Engine, with zero delivery
 * code written.
 *
 * §1 the six faces — the PURE reasoning core: no database, no platform, no I/O.
 * §2 THE TAUTOLOGY GUARD — the load-bearing test (see below).
 * §3 honest gaps — an unreadable owner is SILENT, never zero.
 * §4 the non-fabrication invariants — derived reasons, no score, no model prose.
 * §5 the shopping-aware generator, including its REFUSAL.
 * §6 the Decision Engine contract — the cards satisfy the producer shape and reach the
 *    Companion.
 *
 * THE LOAD-BEARING TEST IS §2 — the tautology guard.
 *
 * A pantry item is not a candidate (which the Planner RANKS) or a recipe (which the Cookbook
 * DESCRIBES). It is a food the household already owns. That brings a failure mode neither
 * sibling had, and it is NOT fabrication: `pantry-usage` — "you already have this" — is
 * VACUOUSLY TRUE of every pantry item, and it carries a perfect citation to a real owner.
 * Rule E1 ("no citation, no card") is a rule about SOURCING, and sourcing cannot detect
 * emptiness. The line passes every guard THA has and reaches the household as "Olive oil —
 * you have olive oil in your pantry."
 *
 * That is not a lie. It is a true sentence with no content, wearing the costume of evidence —
 * and since `reasons` is derived from `evidence`, admitting it to the trail automatically
 * promotes it to a REASON. §2 asserts, mechanically and against a maximally-aware context,
 * that no such sentence can be emitted. CBK2's trap was a claim with no basis; this is a
 * claim with a flawless basis and no content, and only a content check can catch it.
 *
 * Run: npx tsx server/tests/test-pantry1-intelligent-pantry.ts
 */

import type { ShoppingListItem, UserPantryItem } from "@shared/schema";
import {
  generatePantryExplanation,
  EMPTY_PANTRY_HOUSEHOLD_FACTS,
  type PantryHouseholdFacts,
  type PantryExplanation,
} from "../lib/explainability-service.js";
import {
  EMPTY_PLANNER_EXPLANATION_CONTEXT,
  type PlannerExplanationContext,
  type LearnedPreference,
  type PlannerOpportunitySignal,
} from "../lib/planner-explanation-context.js";
import {
  identifyPantryNeedOpportunities,
  identifyPantryUnusedOpportunities,
  prioritizeOpportunities,
  type FoodOpportunity,
} from "../intelligence/food-intelligence/opportunity-engine.js";
import { selectSurface } from "../intelligence/opportunity-delivery/framework.js";
import { noticeOpportunities } from "../intelligence/conversation/notice-engine.js";

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

let failures = 0;
let passes = 0;

function assert(condition: boolean, label: string, detail?: unknown): void {
  if (condition) {
    passes++;
    console.log(`  ✓ ${label}`);
  } else {
    failures++;
    console.error(`  ✗ ${label}${detail !== undefined ? ` — got: ${JSON.stringify(detail)}` : ""}`);
  }
}

function section(title: string): void {
  console.log(`\n${title}`);
}

// ---------------------------------------------------------------------------
// Builders — partials cast to the owner's row type (repo test convention).
//
// Copied from test-shop1-intelligent-shopping.ts rather than re-invented: the whole point
// of PANTRY1 is that the Pantry, Shopping and the Cookbook resolve food through the SAME
// canonical resolver, so their fixtures must not drift into disagreeing about what a
// pantry row is. Real canonical foods are used throughout so the REAL resolver resolves them.
// ---------------------------------------------------------------------------

function pantryItem(over: Partial<UserPantryItem> & { id: number; ingredientKey: string }): UserPantryItem {
  return {
    userId: 1,
    displayName: null,
    isDeleted: false,
    defaultHave: true,
    category: "larder",
    needQuantityValue: null,
    needUnit: null,
    ...over,
  } as unknown as UserPantryItem;
}

function shopItem(over: Partial<ShoppingListItem> & { id: number; productName: string }): ShoppingListItem {
  return {
    checked: false,
    normalizedName: null,
    ...over,
  } as unknown as ShoppingListItem;
}

function context(over: Partial<PlannerExplanationContext> = {}): PlannerExplanationContext {
  return { ...EMPTY_PLANNER_EXPLANATION_CONTEXT, ...over };
}

function facts(over: Partial<PantryHouseholdFacts> = {}): PantryHouseholdFacts {
  return { ...EMPTY_PANTRY_HOUSEHOLD_FACTS, ...over };
}

const details = (e: PantryExplanation): string[] => e.evidence.map((x) => x.detail);
const dimensions = (e: PantryExplanation): string[] => e.evidence.map((x) => x.dimension);

/**
 * A maximally-aware world: every owner readable, every dimension live. This is the state in
 * which a tautology would fire, so it is the state §2 hunts in.
 */
const FULL_CONTEXT = context({
  season: "summer",
  seasonalFoods: new Map([["tomato", "Tomatoes"]]),
  familiarFoods: new Map([["tomato", 4]]),
  learnedPreferences: [
    {
      domain: "planner",
      subjectType: "primary-protein",
      subjectKey: "tomato",
      direction: "positive",
      confidence: "high",
      rationale: "Your household has kept every tomato-based meal THA suggested.",
    } as LearnedPreference,
  ],
  openOpportunities: [
    {
      id: "food-intelligence:pantry-item-unused-in-plan:7",
      type: "pantry-item-unused-in-plan",
      domain: "pantry",
      explanation: "Tomatoes are in your pantry but haven't appeared in any planned meals yet.",
      subjectFoodSlug: "tomato",
      subjectLabel: "Tomatoes",
    } as PlannerOpportunitySignal,
  ],
  seasonAware: true,
  historyAware: true,
  learningAware: true,
  opportunityAware: true,
  pantryAware: true,
});

const FULL_FACTS = facts({
  restrictionConflicts: [],
  householdAware: true,
  recipesUsingFood: ["Tomato Soup", "Shakshuka", "Pasta Arrabbiata", "Panzanella"],
  cookbookAware: true,
  onShoppingList: false,
  shoppingAware: true,
});

const TOMATOES = { name: "Tomatoes", ingredientKey: "tomato" };

async function main(): Promise<void> {
  // =========================================================================
  section("§1 — THE SIX FACES (pure reasoning core, no I/O)");
  // =========================================================================
  {
    const e = generatePantryExplanation(TOMATOES, FULL_CONTEXT, FULL_FACTS);
    const dims = dimensions(e);

    assert(dims.includes("recipe-support"), "§1.1 COOKBOOK-aware — cites the household's own recipes", dims);
    assert(
      details(e).some((d) => d.includes("4 recipes") && d.includes("Tomato Soup")),
      "§1.1 the recipe count is real and the recipes are named",
      details(e),
    );

    assert(dims.includes("household-history"), "§1.2 PLANNER-aware — cites planner history", dims);
    assert(
      details(e).some((d) => d.includes("planned with Tomatoes 4 times")),
      "§1.2 the planner appearance count is cited, not guessed",
      details(e),
    );

    // NUTRITION-aware, and the ONLY nutrition claim this service may make about a food:
    // a structural fact from the canonical plant classifier. See §4.4 for what it refuses.
    assert(dims.includes("plant-diversity"), "§1.3 NUTRITION-aware — cites the plant diversity group", dims);

    assert(dims.includes("seasonal-suitability"), "§1.4 SEASON-aware — cites UK peak season", dims);
    assert(dims.includes("open-opportunity"), "§1.5 OPPORTUNITY-aware — cites an open opportunity", dims);
    assert(dims.includes("learned-preference"), "§1.6 LEARNING-aware — cites LEARN1", dims);

    // The producer's and LEARN1's own words, verbatim (Rule ET6) — never paraphrased.
    assert(
      details(e).some((d) => d.includes("haven't appeared in any planned meals yet")),
      "§1.5 the opportunity producer's own explanation is cited VERBATIM",
      details(e),
    );
    assert(
      details(e).some((d) => d === "Your household has kept every tomato-based meal THA suggested."),
      "§1.6 LEARN1's own rationale is cited VERBATIM",
      details(e),
    );

    // The household's OWN word for the food ("Tomatoes"), not THA's canonical key ("Tomato").
    assert(
      e.title === "What Tomatoes means for your household",
      "§1.7 the title names the food in the HOUSEHOLD's own words, not THA's canonical key",
      e.title,
    );
  }

  {
    // HOUSEHOLD-aware — a restriction conflict, stated as a fact about the FOOD.
    const e = generatePantryExplanation(
      { name: "Bread", ingredientKey: "bread" },
      FULL_CONTEXT,
      facts({ householdAware: true, restrictionConflicts: ["Coeliac / Gluten-free"] }),
    );
    assert(
      dimensions(e).includes("household-suitability"),
      "§1.8 HOUSEHOLD-aware — cites a stored household restriction",
      dimensions(e),
    );
    assert(
      details(e).some((d) => d.includes("Coeliac / Gluten-free")),
      "§1.8 the restriction is named",
      details(e),
    );
    // Rule T1 — food, not people. No member is named: attributing the restriction to a
    // person turns an ingredient note into a disclosure about a household member.
    assert(
      details(e).every((d) => !/\b(member|person|someone|eater)\b/i.test(d)),
      "§1.8 Rule T1 — the restriction is the HOUSEHOLD's; no member is named",
      details(e),
    );
  }

  {
    // SHOPPING-aware — the household's own recorded need, checked against their own list.
    const needsMilk = { name: "Milk", ingredientKey: "milk", needQuantityValue: 2, needUnit: "litres" };
    const unlisted = generatePantryExplanation(needsMilk, FULL_CONTEXT, facts({ shoppingAware: true }));
    assert(
      details(unlisted).some((d) => d.includes("need 2 litres") && d.includes("isn't on your shopping list")),
      "§1.9 SHOPPING-aware — a recorded need that never reached the list is cited",
      details(unlisted),
    );

    const listed = generatePantryExplanation(
      needsMilk,
      FULL_CONTEXT,
      facts({ shoppingAware: true, onShoppingList: true }),
    );
    assert(
      details(listed).some((d) => d === "Already on your shopping list"),
      "§1.9 SHOPPING-aware — an item already on the list says so instead",
      details(listed),
    );
  }

  // =========================================================================
  section("§2 — THE TAUTOLOGY GUARD (the load-bearing test)");
  // =========================================================================
  {
    // The dimension whose entire content is "you already have this". It is excluded from
    // `PantryExplanationDimension` BY CONSTRUCTION (an Extract<> narrowing), so this is not
    // a check that a reviewer remembered — it is a check that the type did its job.
    const e = generatePantryExplanation(TOMATOES, FULL_CONTEXT, FULL_FACTS);
    assert(
      !dimensions(e).includes("pantry-usage"),
      "§2.1 `pantry-usage` is UNREACHABLE — a pantry item is in the pantry; saying so is vacuous",
      dimensions(e),
    );

    // The content check Rule E1 cannot make. Every one of these sentences would be TRUE of
    // every pantry item ever recorded, and every one would carry a perfect citation.
    //
    // SCOPE — this scans the sentences the PANTRY EXPLAINER ITSELF AUTHORS. Two dimensions
    // (`open-opportunity`, `learned-preference`) carry ANOTHER owner's sentence verbatim,
    // which Rule ET6 forbids rewording; their non-vacuity is that owner's own Rule E1
    // responsibility. Scanning them here would fail on the producer's perfectly informative
    // "Tomatoes are in your pantry BUT haven't appeared in any planned meals yet" — where
    // "in your pantry" is the subject clause and the claim is everything after the "but".
    // Banning a substring inside a quotation would force the Pantry to either reword another
    // owner's words or drop the citation. Both are worse than what is being guarded against,
    // and the boundary is the point: the Pantry is answerable for what it WRITES.
    const VERBATIM_FROM_OTHER_OWNERS = new Set(["open-opportunity", "learned-preference"]);
    const authored = e.evidence
      .filter((x) => !VERBATIM_FROM_OTHER_OWNERS.has(x.dimension))
      .map((x) => x.detail);
    // The guard below must not pass by scanning an empty list. Four PANTRY-AUTHORED lines
    // are live in this fixture: recipe-support, plant-diversity, seasonal-suitability and
    // household-history. (`shopping-impact` is correctly silent here — no need is recorded
    // and the food is not listed, which is the resting tautology §2.3 hunts.)
    assert(
      authored.length >= 4,
      "§2.2 the guard below is scanning a real, populated evidence trail (not vacuously passing)",
      authored.length,
    );

    const VACUOUS = [
      "in your pantry",
      "you already have",
      "you have it",
      "in your cupboard",
      "is a current pantry item",
      "you own this",
    ];
    const emitted = [...authored, e.title].map((s) => s.toLowerCase());
    for (const phrase of VACUOUS) {
      assert(
        emitted.every((s) => !s.includes(phrase)),
        `§2.2 no PANTRY-AUTHORED sentence contains the vacuous phrase "${phrase}"`,
        emitted.filter((s) => s.includes(phrase)),
      );
    }

    // The resting state of almost every pantry item: no need recorded, not on the list.
    // "You do not need this and it is not on your list" is TRUE, and is exactly the
    // tautology that must not become a reason.
    const resting = generatePantryExplanation(
      { name: "Salt", ingredientKey: "salt" },
      context({ pantryAware: true }),
      facts({ shoppingAware: true, householdAware: true, cookbookAware: true }),
    );
    assert(
      !dimensions(resting).includes("shopping-impact"),
      "§2.3 an item with no recorded need and no listing emits NO shopping line (the resting tautology)",
      dimensions(resting),
    );
    assert(
      resting.reasons.length === 0,
      "§2.4 a pantry item THA knows nothing notable about produces ZERO reasons, not filler",
      resting.reasons,
    );

    // The week-relative dimensions CBK2 named — still unreachable, for the same reason.
    const weekRelative = ["week-opportunity", "planner-balance", "overall-balance", "diet-match", "processing-level"];
    for (const dim of weekRelative) {
      assert(
        !dimensions(e).includes(dim),
        `§2.5 \`${dim}\` is unreachable — there is no week, no recipe and no product behind a pantry item`,
        dimensions(e),
      );
    }
  }

  // =========================================================================
  section("§3 — HONEST GAPS (an unreadable owner is SILENT, never zero)");
  // =========================================================================
  {
    // Every owner unreadable. This must be silence, not "your cookbook uses this in no
    // recipes" and not "you have never planned with this" — a database outage must never
    // read as a fact about the household.
    const dark = generatePantryExplanation(TOMATOES, EMPTY_PLANNER_EXPLANATION_CONTEXT, EMPTY_PANTRY_HOUSEHOLD_FACTS);
    const zeroClaims = ["no recipes", "never", "0 ", "none of", "you don't", "you do not"];
    const darkText = [...details(dark), ...dark.reasons].map((s) => s.toLowerCase());
    for (const phrase of zeroClaims) {
      assert(
        darkText.every((s) => !s.includes(phrase)),
        `§3.1 an unreadable world never emits the zero-claim "${phrase}"`,
        darkText.filter((s) => s.includes(phrase)),
      );
    }
    assert(
      Object.values(dark.awareness).every((v) => v === false),
      "§3.2 every awareness flag is false when no owner was readable",
      dark.awareness,
    );

    // AWARE-BUT-EMPTY is a different fact from UNAWARE, and both are honest silences.
    // A household with a readable but empty cookbook is aware; the dimension is still silent.
    const emptyCookbook = generatePantryExplanation(
      TOMATOES,
      context({}),
      facts({ cookbookAware: true, recipesUsingFood: [] }),
    );
    assert(
      emptyCookbook.awareness.cookbook === true && !dimensions(emptyCookbook).includes("recipe-support"),
      "§3.3 a readable but empty cookbook is AWARE and SILENT — not a zero, not a gap",
      emptyCookbook.awareness,
    );

    // The plant-diversity dimension is a STANDING property of the food and needs no owner —
    // so it survives a total blackout. It must still never claim anything about a week.
    assert(
      details(dark).every((d) => !/\bweek\b/i.test(d)),
      "§3.4 no sentence mentions a week — there is no week here (the CBK2 fabrication)",
      details(dark),
    );
  }

  // =========================================================================
  section("§4 — THE NON-FABRICATION INVARIANTS");
  // =========================================================================
  {
    const e = generatePantryExplanation(TOMATOES, FULL_CONTEXT, FULL_FACTS);

    // reasons is DERIVED from evidence. An unsourced reason is unreachable, not discouraged.
    assert(
      e.reasons.every((r) => details(e).includes(r)),
      "§4.1 every reason is derived from a cited piece of evidence",
      e.reasons,
    );
    assert(
      e.evidence.every((x) => x.source.length > 0 && x.detail.length > 0),
      "§4.2 Rule E1 — every piece of evidence names the owner it was read from",
      e.evidence,
    );

    // NO SCORE, by type. The household already owns this food and already chose it; marking
    // it out of 100 would be a judgement nobody asked for.
    assert(
      !("score" in e) && !("scoreBreakdown" in e),
      "§4.3 the Pantry authors NO score — it describes, it does not rank",
      Object.keys(e),
    );

    // AN UNGATED HEALTH CLAIM CANNOT REACH THE EVIDENCE TRAIL — BY CONSTRUCTION.
    //
    // The Pantry's own `pantry_ingredient_knowledge.supports` column is right there, is 92%
    // human-written, and contains "Gut health", "Anti-inflammatory compounds", "Digestive
    // comfort" and "Antioxidants". Citing any of them here would make the ONE explanation
    // owner speak an ungated health claim in THA's voice, with a real citation attached —
    // which is worse than an uncited one, because a household can see an uncited claim
    // coming. Health claims are gated behind `getEvidenceBackedFoodReport` and belong to
    // the Food Report.
    //
    // The guard is the TYPE: `PantryHouseholdFacts` has no channel for that column, so the
    // dimension is unreachable rather than merely unused. This asserts the channel stays shut.
    assert(
      !("curatedSupports" in EMPTY_PANTRY_HOUSEHOLD_FACTS) &&
        !("supports" in EMPTY_PANTRY_HOUSEHOLD_FACTS),
      "§4.4 `PantryHouseholdFacts` carries NO channel for the ungated `supports` column",
      Object.keys(EMPTY_PANTRY_HOUSEHOLD_FACTS),
    );
    assert(
      !dimensions(e).includes("nutrition-goals"),
      "§4.4 `nutrition-goals` is unreachable — the Pantry speaks no ungated health claim",
      dimensions(e),
    );
    const HEALTH_CLAIMS = ["gut health", "anti-inflammatory", "digestive comfort", "antioxidant"];
    const said = [...details(e), e.title].map((x) => x.toLowerCase());
    for (const claim of HEALTH_CLAIMS) {
      assert(
        said.every((x) => !x.includes(claim)),
        `§4.4 no sentence repeats the ungated health claim "${claim}"`,
        said.filter((x) => x.includes(claim)),
      );
    }

    // A negative learned preference silently re-weights and is NEVER announced (Rule T1).
    const negative = generatePantryExplanation(
      { name: "Lamb", ingredientKey: "lamb" },
      context({
        learningAware: true,
        learnedPreferences: [
          {
            domain: "planner",
            subjectType: "primary-protein",
            subjectKey: "lamb",
            direction: "negative",
            confidence: "high",
            rationale: "Your household has rejected every lamb meal THA suggested.",
          } as LearnedPreference,
        ],
      }),
      facts(),
    );
    assert(
      !dimensions(negative).includes("learned-preference"),
      "§4.5 a NEGATIVE learned preference is never spoken — that is a judgement about the household",
      dimensions(negative),
    );
  }

  // =========================================================================
  section("§4b — THE WRONG-SUBJECT GUARD (found by a live run, not by inspection)");
  // =========================================================================
  {
    // A pantry is a place where ONE FOOD IS MANY ITEMS. A real household's pantry held
    // "Gala apple", "Braeburn apple" and "Granny Smith apple" — three rows, three separate
    // opportunities, and ONE canonical slug (`apple`) shared between them.
    //
    // Matching an open opportunity on the slug alone therefore attached Gala's opportunity
    // to Braeburn's card. Every word of it was true, and it carried a perfect citation to a
    // real producer — it was simply a fact about the WRONG SUBJECT. No sourcing rule can
    // catch that, and neither can a tautology check: the sentence is informative, it is
    // just not about the thing the household is looking at.
    //
    // The slug identifies the FOOD. The producer's `subjectLabel` identifies the ITEM.
    const appleOpportunity = (label: string): PlannerOpportunitySignal =>
      ({
        id: `food-intelligence:pantry-item-unused-in-plan:${label}`,
        type: "pantry-item-unused-in-plan",
        domain: "pantry",
        explanation: `${label} is in your pantry but hasn't appeared in any planned meals yet.`,
        subjectFoodSlug: "apple",
        subjectLabel: label,
      }) as PlannerOpportunitySignal;

    const threeApples = context({
      opportunityAware: true,
      openOpportunities: [
        appleOpportunity("Gala apple"),
        appleOpportunity("Braeburn apple"),
        appleOpportunity("Granny Smith apple"),
      ],
    });

    const braeburn = generatePantryExplanation(
      { name: "Braeburn apple", ingredientKey: "braeburn apple" },
      threeApples,
      facts(),
    );
    const cited = details(braeburn).filter((d) => d.includes("hasn't appeared"));
    assert(
      cited.length === 1,
      "§4b.1 an item cites exactly ONE opportunity — its own — though three share its slug",
      cited,
    );
    // Case-insensitive: the producer's sentence is cited VERBATIM, capital and all — the
    // Pantry does not lower its first letter (see the explainer's `open-opportunity` note).
    const citedLower = (cited[0] ?? "").toLowerCase();
    assert(
      citedLower.includes("braeburn apple") &&
        !citedLower.includes("gala") &&
        !citedLower.includes("granny"),
      "§4b.2 the cited opportunity is about THIS row, not a sibling that resolves to the same food",
      cited,
    );
    assert(
      cited[0]?.includes("Braeburn apple") === true,
      "§4b.2 the producer's sentence is cited VERBATIM — its capital is not edited away (ET6)",
      cited,
    );

    // Each sibling gets its own, and only its own.
    for (const label of ["Gala apple", "Granny Smith apple"]) {
      const e = generatePantryExplanation({ name: label, ingredientKey: label.toLowerCase() }, threeApples, facts());
      const own = details(e).filter((d) => d.includes("hasn't appeared"));
      assert(
        own.length === 1 && own[0]!.toLowerCase().includes(label.toLowerCase()),
        `§4b.3 "${label}" cites its own opportunity and no sibling's`,
        own,
      );
    }
  }

  // =========================================================================
  section("§4c — THE PLURAL GUARD (also found by a live run)");
  // =========================================================================
  {
    // A household names their own pantry rows, and names them plurally as often as not.
    // A naive seasonal sentence produced "Strawberries IS at UK summer peak right now" —
    // true, cited, and visibly written by a machine. THA's care is felt precisely where it
    // is invisible; a broken copula is where it stops being felt.
    const e = generatePantryExplanation(
      { name: "Strawberries", ingredientKey: "strawberries" },
      context({ season: "summer", seasonAware: true, seasonalFoods: new Map([["strawberry", "Strawberry"]]) }),
      facts(),
    );
    const seasonal = details(e).filter((d) => d.includes("peak"));
    assert(seasonal.length === 1, "§4c.1 a seasonal food is still cited", seasonal);
    assert(
      seasonal.every((d) => !/\b(Strawberries|Blueberries|Tomatoes)\s+is\b/i.test(d)),
      "§4c.2 no plural-name sentence disagrees with its verb",
      seasonal,
    );
    // The whole trail, for any name and any dimension.
    assert(
      details(e).every((d) => !/\b\w+(?:es|ies|oes)\s+is\b/i.test(d)),
      "§4c.3 no PANTRY-authored sentence pairs a plural subject with a singular copula",
      details(e),
    );
  }

  // =========================================================================
  section("§5 — SHOPPING-AWARE PANTRY (the one new generator)");
  // =========================================================================
  {
    const needsMilk = pantryItem({
      id: 10,
      ingredientKey: "milk",
      displayName: "Milk",
      needQuantityValue: 2,
      needUnit: "litres",
    });

    const fired = identifyPantryNeedOpportunities([needsMilk], []);
    assert(fired.length === 1, "§5.1 a recorded need absent from the shopping list fires ONE card", fired.length);

    const card = fired[0]!;
    assert(card.type === "pantry-need-not-on-shopping-list", "§5.2 the card carries the new type", card.type);
    assert(card.owningDomain === "pantry", "§5.2 the card is owned by the PANTRY domain", card.owningDomain);
    assert(card.priority === "medium", "§5.2 a missed shop is an inconvenience, never `critical`", card.priority);
    assert(card.id === "pantry-need-not-on-shopping-list:10", "§5.3 the id is deterministic and row-keyed", card.id);
    assert(
      card.subject.entity === "pantry-item" && card.subject.id === 10 && card.subject.label === "Milk",
      "§5.3 the subject is the structured pantry row (PHASE5E)",
      card.subject,
    );
    assert(card.evidence.length === 2, "§5.4 Rule E1 — the claim cites BOTH owners it joined", card.evidence);
    assert(
      card.evidence.some((x) => x.source === "pantry-items") &&
        card.evidence.some((x) => x.source === "shopping-list"),
      "§5.4 the two owners are the pantry row and the shopping list",
      card.evidence.map((x) => x.source),
    );
    assert(
      card.explanation.includes("2 litres") && card.explanation.includes("Milk"),
      "§5.5 the card reports back what the household THEMSELVES declared",
      card.explanation,
    );

    // An EMPTY shopping list is a READ shopping list — the card must fire (this is precisely
    // the household the card is for). Contrast §5.9.
    assert(
      identifyPantryNeedOpportunities([needsMilk], []).length === 1,
      "§5.6 an EMPTY list is a read list — the need still fires",
    );

    // Already on the list → nothing to say. Matched on the canonical slug, so "Milk" the
    // pantry row and "milk" the shopping line are one food.
    const listed = identifyPantryNeedOpportunities(
      [needsMilk],
      [shopItem({ id: 1, productName: "Milk", normalizedName: "milk" })],
    );
    assert(listed.length === 0, "§5.7 a need already on the shopping list is SILENT", listed);

    // No declared need → no card. This generator never infers that a household is running
    // low; it only reports back what they typed.
    assert(
      identifyPantryNeedOpportunities([pantryItem({ id: 11, ingredientKey: "milk" })], []).length === 0,
      "§5.8 an item with no recorded need fires nothing — consumption is never modelled",
    );
    assert(
      identifyPantryNeedOpportunities(
        [pantryItem({ id: 12, ingredientKey: "milk", needQuantityValue: 0 })],
        [],
      ).length === 0,
      "§5.8 a zero need is not a need",
    );
    assert(
      identifyPantryNeedOpportunities(
        [pantryItem({ id: 13, ingredientKey: "milk", needQuantityValue: 2, isDeleted: true })],
        [],
      ).length === 0,
      "§5.8 a deleted pantry row is not read",
    );

    // THE REFUSAL. An unidentifiable food cannot be PROVEN absent from the shopping list, so
    // the generator is silent rather than falling back to a raw string comparison. Telling a
    // household to buy something they may already have listed is the exact failure this card
    // exists to prevent.
    const unresolvable = identifyPantryNeedOpportunities(
      [
        pantryItem({
          id: 14,
          ingredientKey: "zzz-not-a-real-food-xyz",
          displayName: "Grandma's Secret Spice Blend",
          needQuantityValue: 1,
          needUnit: "jar",
        }),
      ],
      [],
    );
    assert(
      unresolvable.length === 0,
      "§5.9 THE REFUSAL — an unidentifiable food is SILENT, never guessed at",
      unresolvable,
    );
  }

  // =========================================================================
  section("§6 — THE DECISION ENGINE CONTRACT (inherited, not rebuilt)");
  // =========================================================================
  {
    // Zero lines of routing were written: `pantry` was already enrolled.
    assert(selectSurface("pantry") === "pantry", "§6.1 the pantry domain routes to the pantry surface");

    const card: FoodOpportunity = identifyPantryNeedOpportunities(
      [pantryItem({ id: 10, ingredientKey: "milk", displayName: "Milk", needQuantityValue: 2, needUnit: "litres" })],
      [],
    )[0]!;

    // THE SILENT-DROP GUARD. `noticeOpportunities` drops an opportunity whose domain it
    // cannot map. Without the `pantry` → `pantry-opportunity` row, every card here would be
    // produced, delivered, budgeted, persisted and learned from — then dropped ONE STEP
    // before the household could read it. The row already exists; this asserts it.
    const notices = noticeOpportunities([
      {
        id: card.id,
        domain: card.owningDomain,
        priority: card.priority,
        explanation: card.explanation,
        suggestedAction: card.suggestedAction,
        evidence: card.evidence.map((e) => ({ source: e.source, detail: e.detail })),
      },
    ]);
    assert(
      notices.length === 1 && notices[0]?.category === "pantry-opportunity",
      "§6.2 a pantry card reaches the Companion as a `pantry-opportunity` notice",
      notices,
    );

    // Rule E1 at the boundary: no citation, no card.
    const uncited = noticeOpportunities([
      {
        id: card.id,
        domain: card.owningDomain,
        priority: card.priority,
        explanation: card.explanation,
        suggestedAction: card.suggestedAction,
        evidence: [],
      },
    ]);
    assert(uncited.length === 0, "§6.3 an UNCITED pantry card is DROPPED at the notice boundary (Rule E1)", uncited);

    // The canonical attention mechanics order the two pantry cards. PANTRY1 wrote no sort.
    const unused = identifyPantryUnusedOpportunities(
      [pantryItem({ id: 20, ingredientKey: "tomato", displayName: "Tomatoes" })],
      new Set<string>(),
    );
    const ordered = prioritizeOpportunities([...unused, card], 10);
    assert(
      ordered[0]?.priority === "medium" && ordered[ordered.length - 1]?.priority === "low",
      "§6.4 pantry cards are ordered by the canonical attention mechanics (medium before low)",
      ordered.map((o) => o.priority),
    );

    // ATTN1 invariant A2 — only `shopping-restriction-conflict` may be critical.
    assert(
      [...unused, card].every((o) => o.priority !== "critical"),
      "§6.5 no pantry card claims `critical` (ATTN1 invariant A2)",
    );
  }

  // -------------------------------------------------------------------------
  console.log(`\n${"─".repeat(60)}`);
  console.log(`PANTRY1: ${passes} passed, ${failures} failed`);
  console.log(`${"─".repeat(60)}\n`);
  if (failures > 0) process.exit(1);
}

void main();
