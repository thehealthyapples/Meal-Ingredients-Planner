/**
 * CBK2 — Cookbook opportunity generation and delivery contracts.
 *
 * The implemented pantry-aware recipe opportunities, household-conflict cards,
 * and Decision Engine delivery contracts remain executable below. The separate
 * Cookbook explainer requirements are kept as a deferred specification comment
 * at §1–§3; see AFI3–5 completion notes there.
 */

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

/*
 * Deferred Cookbook explainer specification (CBK2 §§1–3): a future Cookbook
 * explanation must remain week-free, derive every reason from cited evidence,
 * stay silent for unreadable household owners, and never author a score. The
 * Cookbook-specific explainer/gap/learning layer is not implemented in the
 * current source tree, so these are retained as design constraints rather than
 * tests against the Planner's different explanation owner. See
 * docs/implementation/intelligence/AFI3_5_AMBIENT_FOOD_INTELLIGENCE_COMPLETION.md.
 */
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

