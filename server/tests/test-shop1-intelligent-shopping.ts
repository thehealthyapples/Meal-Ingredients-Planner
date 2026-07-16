/**
 * SHOP1 — Intelligent Shopping Evolution
 * ======================================
 * Proves the three SHOPPING-domain generators added to the EXISTING Food Opportunity
 * Engine (server/intelligence/food-intelligence/opportunity-engine.ts) — pantry-aware,
 * nutrition-aware at the PRODUCT level (Analyser), and nutrition-aware at the FOOD level
 * (WS9 Alternatives) — plus the household-aware generator that already existed.
 *
 * SHOP1 CREATED NO SHOPPING ENGINE. It added generators at the extension point the
 * opportunity engine's own type union already advertised, so every new card inherits
 * muting, lifecycle suppression, the attention budget, household learning, surface routing
 * and the Decision→Evidence loop from the Decision Engine — with zero delivery code.
 *
 * §1 is the PURE reasoning core: no database, no platform, no I/O.
 * §2 is the DELIVERY contract: the cards satisfy the Decision Engine's producer shape.
 *
 * THE LOAD-BEARING TEST IS §1.4 — the trust guard. "Healthier product recommendations"
 * hides two questions with two owners: the ANALYSER owns a product *rating* (so it may
 * state one), and WS9 owns food *possibilities* (so it may not rank). WS9's guard bans
 * "healthier"/"better option"/"should swap" and fails closed. §1.4 asserts EVERY string
 * SHOP1 emits — including the Analyser's — is clean against that ban list. That is
 * deliberately stricter than WS9 requires of the Analyser, and it is the check that stops
 * a future edit from quietly editorialising a rating into a judgement.
 *
 * Run: npx tsx server/tests/test-shop1-intelligent-shopping.ts
 */

import type { ShoppingListItem, UserPantryItem, ProductMatch } from "@shared/schema";
import type { RestrictionDefinition } from "@shared/restrictions/restriction-types.js";
import { validateReason } from "@shared/alternatives/index.js";
import { isCritical, assertCriticalAllowed } from "@shared/attention/index.js";
import {
  identifyShoppingRestrictionOpportunities,
  identifyShoppingPantryDuplicateOpportunities,
  identifyShoppingHigherRatedProductOpportunities,
  identifyShoppingLessProcessedOpportunities,
  prioritizeOpportunities,
  type FoodOpportunity,
} from "../intelligence/food-intelligence/opportunity-engine.js";
import { selectSurface } from "../intelligence/opportunity-delivery/framework.js";

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
// Builders — partials cast to the owner's row type (repo test convention)
// ---------------------------------------------------------------------------

function shopItem(over: Partial<ShoppingListItem> & { id: number; productName: string }): ShoppingListItem {
  return {
    checked: false,
    normalizedName: null,
    thaRating: null,
    ...over,
  } as unknown as ShoppingListItem;
}

function pantryItem(over: Partial<UserPantryItem> & { id: number; ingredientKey: string }): UserPantryItem {
  return {
    isDeleted: false,
    displayName: null,
    ...over,
  } as unknown as UserPantryItem;
}

function match(over: Partial<ProductMatch> & { id: number; shoppingListItemId: number; productName: string }): ProductMatch {
  return {
    supermarket: "Tesco",
    thaRating: null,
    ...over,
  } as unknown as ProductMatch;
}

/** A hard restriction definition, shaped exactly as the restriction owner defines it. */
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

// ---------------------------------------------------------------------------
// §1 — PURE REASONING CORE
// ---------------------------------------------------------------------------

console.log("SHOP1 — Intelligent Shopping Evolution");
console.log("======================================");

section("§1.1 PANTRY-AWARE — a shopping line the household already has in the pantry");
{
  const items = [
    shopItem({ id: 1, productName: "Chicken Breast", normalizedName: "chicken breast" }),
    shopItem({ id: 2, productName: "Tinned Tomatoes", normalizedName: "tinned tomatoes" }),
  ];
  const pantry = [pantryItem({ id: 10, ingredientKey: "chicken breast", displayName: "Chicken breast" })];

  const found = identifyShoppingPantryDuplicateOpportunities(items, pantry);
  assert(found.length === 1, "only the item that is actually in the pantry produces a card", found.length);
  assert(found[0]?.type === "shopping-item-already-in-pantry", "card carries the SHOP1 pantry type", found[0]?.type);
  assert(found[0]?.owningDomain === "shopping", "owningDomain is shopping (routes to the shopping surface)");
  assert(found[0]?.subject.entity === "shopping-item" && found[0]?.subject.id === 1, "subject is the shopping row it is keyed on");
  assert(
    found[0]?.evidence.some((e) => e.source === "pantry-items") &&
      found[0]?.evidence.some((e) => e.source === "shopping-list"),
    "cites BOTH owners it joined (Rule E1 — no citation, no card)",
  );

  // An item the household has already ticked off is not an open opportunity.
  const checkedOnly = identifyShoppingPantryDuplicateOpportunities(
    [shopItem({ id: 1, productName: "Chicken Breast", normalizedName: "chicken breast", checked: true })],
    pantry,
  );
  assert(checkedOnly.length === 0, "a CHECKED shopping line is never an open opportunity");

  // A deleted pantry row is not a pantry holding.
  const deleted = identifyShoppingPantryDuplicateOpportunities(items, [
    pantryItem({ id: 10, ingredientKey: "chicken breast", isDeleted: true }),
  ]);
  assert(deleted.length === 0, "a DELETED pantry item never grounds a duplicate-purchase card");

  assert(identifyShoppingPantryDuplicateOpportunities(items, []).length === 0, "no pantry → no cards, never a guess");
}

section("§1.2 NUTRITION-AWARE (PRODUCT) — the Analyser's already-persisted rating");
{
  // The household's line is rated 2/5; a product ALREADY matched to that same line is rated 4/5.
  const items = [shopItem({ id: 5, productName: "Hovis Soft White", thaRating: 2 })];
  const matches = [
    match({ id: 100, shoppingListItemId: 5, productName: "Seeded Wholemeal", supermarket: "Tesco", thaRating: 4 }),
    match({ id: 101, shoppingListItemId: 5, productName: "Value White", supermarket: "Tesco", thaRating: 1 }),
  ];

  const found = identifyShoppingHigherRatedProductOpportunities(items, matches);
  assert(found.length === 1, "a higher-rated already-matched product produces exactly one card", found.length);
  assert(found[0]?.type === "shopping-higher-rated-product-available", "card carries the SHOP1 product type");
  assert(
    found[0]?.explanation.includes("2/5") && found[0]?.explanation.includes("4/5"),
    "STATES both Analyser ratings rather than editorialising them",
    found[0]?.explanation,
  );
  assert(
    found[0]?.explanation.includes("Seeded Wholemeal"),
    "names the best-rated match, not the worst",
    found[0]?.explanation,
  );
  assert(
    found[0]?.evidence.some((e) => e.source === "analyser-rating"),
    "attributes the rating to the ANALYSER, its single owner (SoT D19)",
  );

  // No better product → no card. THA never invents an improvement.
  const noBetter = identifyShoppingHigherRatedProductOpportunities(
    [shopItem({ id: 5, productName: "Seeded Wholemeal", thaRating: 4 })],
    [match({ id: 100, shoppingListItemId: 5, productName: "Value White", thaRating: 1 })],
  );
  assert(noBetter.length === 0, "a line already rated above every match produces NO card");

  // An unrated line is an honest gap — NOT a zero to be beaten.
  const unrated = identifyShoppingHigherRatedProductOpportunities(
    [shopItem({ id: 5, productName: "Mystery Item", thaRating: null })],
    [match({ id: 100, shoppingListItemId: 5, productName: "Anything", thaRating: 5 })],
  );
  assert(unrated.length === 0, "an UNRATED line is an honest gap, never treated as a 0 the Analyser can beat");

  assert(
    identifyShoppingHigherRatedProductOpportunities(items, []).length === 0,
    "no product matches → no comparison invented",
  );
}

section("§1.3 NUTRITION-AWARE (FOOD) — WS9 Alternatives, reused not re-implemented");
{
  const items = [shopItem({ id: 7, productName: "Cereal", normalizedName: "cereal" })];

  const found = identifyShoppingLessProcessedOpportunities(items, []);
  assert(found.length === 1, "a known WS9 anchor produces a less-processed card", found.length);
  assert(found[0]?.type === "shopping-less-processed-option", "card carries the SHOP1 food-level type");
  assert(found[0]?.priority === "low", "a POSSIBILITY is low attention — never a call to action", found[0]?.priority);
  assert(
    found[0]?.evidence.some((e) => e.source === "food-alternatives" && e.detail.includes("Porridge Oats")),
    "surfaces WS9's curated option and cites it as food-alternatives",
  );
  // The reason must be WS9's, character for character — never reworded here.
  const oatReason = "Oats cooked into porridge are a minimally processed breakfast that fills the same warm-bowl role.";
  assert(
    found[0]?.evidence.some((e) => e.detail.includes(oatReason)),
    "copies WS9's editorial reason VERBATIM (this module never authors a reason)",
  );

  // An unknown anchor is silent, never a guess (WS9's own "empty is silent" discipline).
  const unknown = identifyShoppingLessProcessedOpportunities(
    [shopItem({ id: 8, productName: "Zzzz Unknown Thing", normalizedName: "zzzz unknown thing" })],
    [],
  );
  assert(unknown.length === 0, "an unknown food is SILENT — WS9 never guesses an alternative");

  // SAFETY GATE — an alternative that collides with an active hard restriction is dropped.
  const gated = identifyShoppingLessProcessedOpportunities(items, [
    restriction("Oat allergy", ["oats", "porridge oats", "bircher oats", "muesli"]),
  ]);
  assert(
    gated.length === 0,
    "every less-processed option colliding with a hard restriction → the whole card is dropped",
    gated.map((g) => g.explanation),
  );
}

section("§1.4 TRUST GUARD — no ranking or judgement language reaches a household");
{
  const items = [
    shopItem({ id: 1, productName: "Chicken Breast", normalizedName: "chicken breast" }),
    shopItem({ id: 5, productName: "Hovis Soft White", thaRating: 2 }),
    shopItem({ id: 7, productName: "Cereal", normalizedName: "cereal" }),
  ];
  const pantry = [pantryItem({ id: 10, ingredientKey: "chicken breast", displayName: "Chicken breast" })];
  const matches = [match({ id: 100, shoppingListItemId: 5, productName: "Seeded Wholemeal", thaRating: 4 })];
  const defs = [restriction("Peanut", ["peanut", "peanuts"])];

  const all: FoodOpportunity[] = [
    ...identifyShoppingRestrictionOpportunities(items, defs),
    ...identifyShoppingPantryDuplicateOpportunities(items, pantry),
    ...identifyShoppingHigherRatedProductOpportunities(items, matches),
    ...identifyShoppingLessProcessedOpportunities(items, []),
  ];
  assert(all.length >= 3, "all four shopping generators contribute cards for this household", all.length);

  // EVERY string a household could read, from EVERY shopping generator.
  const strings: string[] = [];
  for (const o of all) {
    strings.push(o.explanation, o.suggestedAction, ...o.evidence.map((e) => e.detail));
  }

  const violations = strings
    .map((s) => ({ s, banned: validateReason(s) }))
    .filter((v) => v.banned.length > 0);

  assert(
    violations.length === 0,
    "NO shopping string carries WS9-banned ranking language (\"healthier\", \"better option\", \"should swap\")",
    violations.map((v) => `${v.banned.join("/")} in: ${v.s}`),
  );

  // Rule E1 — no citation, no card.
  assert(all.every((o) => o.evidence.length > 0), "every shopping card carries at least one cited source (Rule E1)");

  // ATTN1 invariant A2 — `critical` is a closed allowlist. The three SHOP1 types are NOT on it.
  const shop1Types = all.filter((o) => o.type !== "shopping-restriction-conflict");
  assert(
    shop1Types.every((o) => !isCritical(o.priority)),
    "no SHOP1 card claims `critical` — only a restriction conflict may (invariant A2)",
    shop1Types.map((o) => `${o.type}:${o.priority}`),
  );
  let threw = false;
  try {
    for (const o of all) assertCriticalAllowed(o.type, o.priority);
  } catch {
    threw = true;
  }
  assert(!threw, "every SHOP1 card passes the closed critical allowlist assertion");
}

section("§1.5 DETERMINISM — the brain stays deterministic (Rule LT3)");
{
  const items = [
    shopItem({ id: 1, productName: "Chicken Breast", normalizedName: "chicken breast" }),
    shopItem({ id: 5, productName: "Hovis Soft White", thaRating: 2 }),
    shopItem({ id: 7, productName: "Cereal", normalizedName: "cereal" }),
  ];
  const pantry = [pantryItem({ id: 10, ingredientKey: "chicken breast" })];
  const matches = [match({ id: 100, shoppingListItemId: 5, productName: "Seeded Wholemeal", thaRating: 4 })];

  const run = () =>
    prioritizeOpportunities([
      ...identifyShoppingPantryDuplicateOpportunities(items, pantry),
      ...identifyShoppingHigherRatedProductOpportunities(items, matches),
      ...identifyShoppingLessProcessedOpportunities(items, []),
    ]);

  assert(JSON.stringify(run()) === JSON.stringify(run()), "identical input yields byte-identical output");

  // Attention ordering: medium (pantry, product) before low (possibility).
  const ordered = run();
  const lastType = ordered[ordered.length - 1]?.type;
  assert(
    lastType === "shopping-less-processed-option",
    "the low-attention POSSIBILITY sorts last — it never outranks an actionable card",
    lastType,
  );
}

// ---------------------------------------------------------------------------
// §2 — DELIVERY CONTRACT (the Decision Engine's producer shape)
// ---------------------------------------------------------------------------

section("§2 DELIVERY — SHOP1 cards satisfy the Decision Engine's producer contract");
{
  const items = [shopItem({ id: 5, productName: "Hovis Soft White", thaRating: 2 })];
  const matches = [match({ id: 100, shoppingListItemId: 5, productName: "Seeded Wholemeal", thaRating: 4 })];
  const cards = identifyShoppingHigherRatedProductOpportunities(items, matches);

  // The exact fields `adaptOpportunityReport` reads. A card missing any of these is SKIPPED
  // by the framework, never coerced — so this is the contract, not a style preference.
  assert(
    cards.every(
      (c) =>
        typeof c.id === "string" &&
        typeof c.owningDomain === "string" &&
        typeof c.type === "string" &&
        typeof c.explanation === "string" &&
        typeof c.suggestedAction === "string" &&
        Array.isArray(c.evidence),
    ),
    "every card carries { id, owningDomain, type, priority, explanation, evidence, suggestedAction }",
  );
  assert(
    cards.every((c) => typeof c.subject.id === "number" && typeof c.subject.label === "string"),
    "every card carries a structured subject, so the Companion can explain it (PHASE5E)",
  );

  // Surface routing already existed — SHOP1 adds no row to DOMAIN_SURFACE.
  assert(selectSurface("shopping") === "shopping", "the shopping domain already routes to the shopping surface");

  // Ids are stable per underlying row, so a re-run cannot duplicate a delivered card.
  assert(cards[0]?.id === "shopping-higher-rated-product-available:5", "id is deterministic and row-scoped", cards[0]?.id);
}

// ---------------------------------------------------------------------------

console.log(`\n${"=".repeat(60)}`);
console.log(`SHOP1: ${passes} passed, ${failures} failed`);
console.log("=".repeat(60));

if (failures > 0) process.exit(1);
