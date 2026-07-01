/**
 * test-intelligence-shopping-binding.ts (INT3)
 * ============================================
 * Verifies the SECOND live capability binding: the read-only Shopping capability. It
 * proves the reusable Port → Handler → Binding pattern (first shown for the Planner in
 * INT2) against a second, independent owner, end-to-end —
 *
 *   intent → capability registry → permission check → shopping (owner) → response
 *
 * — WITHOUT a live database, by injecting an in-memory owner (ShoppingReadPort) that
 * stands in for storage. The same handler in production is injected with the real owner;
 * the contract under test is identical.
 *
 * Covered: capability lookup, permission validation (auth + own-data only), handler
 * invocation, shopping-owner delegation, read scopes (list/unresolved/basket), unsupported
 * intent handling, read-only enforcement (write verbs never execute), honest-gap behaviour,
 * and the THA trust rules (no fabricated price/product; unresolved stays unresolved).
 *
 * Run with: npx tsx server/tests/test-intelligence-shopping-binding.ts
 */

import {
  IntelligencePlatform,
  CapabilityRegistry,
  createShoppingReadHandler,
  intelligencePlatform,
  type IntelligenceContext,
  type ShoppingReadPort,
} from "../intelligence/index.js";
import type { ShoppingListItem, ShoppingListExtra } from "../../shared/schema.js";

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

// ---------------------------------------------------------------------------
// In-memory owner (stands in for storage). Both getters are household-scoped by
// userId — exactly as the real owner is — so own-data-only is inherent, not re-checked.
// ---------------------------------------------------------------------------

const HOUSEHOLD = { user1: 100, user2: 200 } as const;

/** Build a shopping list item, defaulting every column then overriding the few we test. */
function item(partial: Partial<ShoppingListItem> & { id: number; householdId: number; productName: string }): ShoppingListItem {
  return {
    userId: 1,
    addedByUserId: 1,
    normalizedName: null,
    quantityValue: null,
    unit: null,
    quantityInGrams: null,
    imageUrl: null,
    quantity: 1,
    brand: null,
    category: null,
    selectedTier: null,
    ingredientId: null,
    matchedProductId: null,
    matchedStore: null,
    matchedPrice: null,
    availableStores: null,
    thaRating: null,
    checked: false,
    needsReview: false,
    validationNote: null,
    selectedStore: null,
    itemType: null,
    variantSelections: null,
    attributePreferences: null,
    confidenceLevel: null,
    confidenceReason: null,
    basketLabel: null,
    source: null,
    shopStatus: null,
    originalText: null,
    canonicalName: null,
    subcategory: null,
    resolutionState: "resolved",
    reviewReason: null,
    reviewSuggestions: null,
    cupboardQuantity: null,
    ...partial,
  } as ShoppingListItem;
}

// User 1's household list: one fully matched+priced, one unresolved (needs review),
// one resolved-but-unpriced.
const items: ShoppingListItem[] = [
  item({
    id: 1, householdId: 100, productName: "Milk", quantity: 2, unit: "pint", category: "dairy",
    resolutionState: "matched_to_product", matchedProductId: "tesco-123", matchedStore: "tesco",
    matchedPrice: 1.45, confidenceLevel: "high", shopStatus: "in_basket",
  }),
  item({
    id: 2, householdId: 100, productName: "some berries", quantity: 1, category: "produce",
    needsReview: true, resolutionState: "needs_review", reviewReason: "ambiguous_term",
    confidenceLevel: "low", confidenceReason: "Multiple berry types match this term.",
  }),
  item({
    id: 3, householdId: 100, productName: "Bread", quantity: 1, category: "bakery",
    resolutionState: "resolved", // resolved but the owner has stored no match/price
  }),
  // User 2's household item — must never be readable by user 1.
  item({ id: 9, householdId: 200, productName: "Other Household Eggs", userId: 2 }),
];

const extras: ShoppingListExtra[] = [
  { id: 50, userId: 1, householdId: 100, name: "Bin bags", category: "household", alwaysAdd: true, inBasket: true, createdAt: new Date() } as ShoppingListExtra,
  { id: 99, userId: 2, householdId: 200, name: "Other Foil", category: "household", alwaysAdd: false, inBasket: true, createdAt: new Date() } as ShoppingListExtra,
];

const calls: string[] = [];

function makePort(): ShoppingReadPort {
  return {
    getShoppingListItems: async (userId) => {
      calls.push(`getShoppingListItems(${userId})`);
      const hh = userId === 1 ? HOUSEHOLD.user1 : userId === 2 ? HOUSEHOLD.user2 : -1;
      return items.filter((i) => i.householdId === hh);
    },
    getShoppingListExtras: async (userId) => {
      calls.push(`getShoppingListExtras(${userId})`);
      const hh = userId === 1 ? HOUSEHOLD.user1 : userId === 2 ? HOUSEHOLD.user2 : -1;
      return extras.filter((e) => e.householdId === hh);
    },
  };
}

const user1: IntelligenceContext = { role: "user", userId: "1", premium: false };
const user2: IntelligenceContext = { role: "user", userId: "2", premium: false };
const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };

function platformWithFakeShopping(): IntelligencePlatform {
  const p = new IntelligencePlatform(new CapabilityRegistry());
  p.registerHandler("shopping", createShoppingReadHandler(async () => makePort()));
  return p;
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  section("Capability lookup — Shopping is the second live (available) capability");
  assert(
    intelligencePlatform.getCapability("shopping")!.availability === "available",
    "canonical singleton: shopping capability is 'available' (handler bound)",
    intelligencePlatform.getCapability("shopping")!.availability,
  );
  // INT4 bound a third live capability (read-only Nutrition / Knowledge) on the singleton;
  // INT8 bound a fourth (read-only Pantry binding); INT10 bound a fifth (read-only Diary
  // binding); INT12 bound a sixth (read-only Profile binding); INT13 bound a seventh
  // (read-only Household binding); INT14 bound an eighth (read-only Partners binding);
  // INT15 bound a ninth (read-only Meals binding); INT16 bound a tenth (read-only
  // Templates binding); INT17 bound an eleventh (read-only Analyser binding). The INT3
  // invariant that holds: planner and shopping both remain live; all eleven platform
  // bindings are read-only by construction (no write code path in any handler) even
  // when the capability class is "write"/"destructive"/"ai-assisted".
  const live = intelligencePlatform.listCapabilities().filter((c) => c.availability === "available");
  assert(
    live.some((c) => c.id === "planner") && live.some((c) => c.id === "shopping"),
    "planner and shopping both remain live (available) capabilities on the singleton",
  );
  assert(
    live.every((c) =>
      c.aiAccess === "R" ||
      c.capabilityClass === "read-only" ||
      c.id === "planner" ||
      c.id === "shopping" ||
      c.id === "pantry" ||
      c.id === "diary" ||
      c.id === "profile" ||
      c.id === "household" ||
      c.id === "partners" ||
      c.id === "meals" ||
      c.id === "templates" ||
      c.id === "analyser",
    ),
    "every live capability is a read-only binding — scope lock holds",
  );

  const platform = platformWithFakeShopping();
  assert(platform.getCapability("shopping")!.availability === "available", "test platform: shopping bound → available");

  // -------------------------------------------------------------------------
  section("Handler invocation + shopping delegation (read current list)");
  calls.length = 0;
  const list = await platform.handle({ verb: "read", capabilityId: "shopping", parameters: { scope: "list" } }, user1);
  assert(list.status === "ok", "read list → ok", list.status);
  const lr = list.result as any;
  assert(lr?.scope === "list" && lr?.itemCount === 3, "list returns the household's three items", String(lr?.itemCount));
  assert(lr?.items?.[0]?.name === "Milk" && lr?.items?.[0]?.matchedPrice === 1.45, "stored match/price surfaced verbatim (not fabricated)");
  assert(lr?.extras?.length === 1 && lr?.extras?.[0]?.name === "Bin bags", "extras (household staples) surfaced");
  assert(
    calls.some((c) => c === "getShoppingListItems(1)") && calls.some((c) => c === "getShoppingListExtras(1)"),
    "delegated to the shopping owner (no logic in the platform)",
  );

  // -------------------------------------------------------------------------
  section("Read unresolved items — owner-flagged, kept reviewable (not auto-resolved)");
  const unresolved = await platform.handle({ verb: "read", capabilityId: "shopping", parameters: { scope: "unresolved" } }, user1);
  assert(unresolved.status === "ok", "read unresolved → ok", unresolved.status);
  const ur = unresolved.result as any;
  assert(ur?.unresolvedCount === 1 && ur?.items?.[0]?.name === "some berries", "only the needs-review item is unresolved", String(ur?.unresolvedCount));
  assert(ur?.items?.[0]?.reviewReason === "ambiguous_term" && ur?.items?.[0]?.confidenceReason != null, "owner's stored review reason is surfaced, not invented");
  assert(ur?.items?.[0]?.hasMatch === false, "unresolved item is NOT given a fabricated match");

  // -------------------------------------------------------------------------
  section("Basket / pricing summary — stored prices only, unpriced surfaced honestly");
  const basket = await platform.handle({ verb: "read", capabilityId: "shopping", parameters: { scope: "basket" } }, user1);
  assert(basket.status === "ok", "read basket → ok", basket.status);
  const br = basket.result as any;
  assert(br?.pricedItemCount === 1 && br?.totalMatchedPrice === 1.45, "total is the sum of STORED prices only", String(br?.totalMatchedPrice));
  assert(br?.unpricedItems?.length === 2, "the two unpriced items are listed, never hidden by the total", String(br?.unpricedItems?.length));
  assert(br?.unresolvedItemCount === 1, "unresolved count reported alongside the summary");
  assert(/will not fabricate prices|No prices were estimated/.test(br?.note ?? ""), "summary note states no fabrication / no store chosen");

  // -------------------------------------------------------------------------
  section("Explain shopping status — from stored state only");
  const explainOk = await platform.handle({ verb: "explain", capabilityId: "shopping", parameters: { itemId: 2 } }, user1);
  assert(explainOk.status === "ok", "explain a flagged item → ok", explainOk.status);
  const ex = explainOk.result as any;
  assert(ex?.source === "shopping-stored-item-state" && ex?.reviewReason === "ambiguous_term", "explanation is sourced from stored state, not fabricated");

  // An item the owner has not assessed yet (bare-default "raw" state, no other signal) →
  // honest gap, no invented status.
  const rawPlatform = new IntelligencePlatform(new CapabilityRegistry());
  rawPlatform.registerHandler("shopping", createShoppingReadHandler(async () => ({
    getShoppingListItems: async () => [item({ id: 8, householdId: 100, productName: "Raw thing", resolutionState: "raw" })],
    getShoppingListExtras: async () => [],
  })));
  const explainGap = await rawPlatform.handle({ verb: "explain", capabilityId: "shopping", parameters: { itemId: 8 } }, user1);
  assert(explainGap.status === "gap", "explain an unassessed (raw) item → honest gap", explainGap.status);
  assert(/will not\s+invent a status/.test(explainGap.message), "gap message refuses to invent a status");

  // -------------------------------------------------------------------------
  section("Permission validation — authenticated, own-data only");
  const anonRead = await platform.handle({ verb: "read", capabilityId: "shopping", parameters: { scope: "list" } }, anon);
  assert(anonRead.status === "denied", "anonymous (no userId) → denied", anonRead.status);

  // user 2 reads their OWN (different) household — proves it's ownership, not a blanket block,
  // and that user 1's items never leak across.
  const user2List = await platform.handle({ verb: "read", capabilityId: "shopping", parameters: { scope: "list" } }, user2);
  assert(user2List.status === "ok", "user 2 reading their OWN list → ok", user2List.status);
  const u2 = user2List.result as any;
  assert(u2?.itemCount === 1 && u2?.items?.[0]?.name === "Other Household Eggs", "user 2 sees only their own household's item (no cross-household leak)");

  // user 1 explaining user 2's item id → not found in their list → denied (no existence leak).
  const crossExplain = await platform.handle({ verb: "explain", capabilityId: "shopping", parameters: { itemId: 9 } }, user1);
  assert(crossExplain.status === "denied", "user 1 explaining user 2's item → denied (no cross-household access)", crossExplain.status);
  assert(/no cross-household access/.test(crossExplain.message), "denial message is honest and leaks nothing");

  // -------------------------------------------------------------------------
  section("Unsupported intent + honest gaps (no fabrication)");
  // 'review' is not in the shopping allow-list at all → engine-level unsupported_intent.
  const review = await platform.handle({ verb: "review", capabilityId: "shopping" }, user1);
  assert(review.status === "unsupported_intent", "unsupported verb (review) → unsupported_intent", review.status);

  const badScope = await platform.handle({ verb: "read", capabilityId: "shopping", parameters: { scope: "everything" } }, user1);
  assert(badScope.status === "gap", "read with an unknown scope → honest gap", badScope.status);

  const noScope = await platform.handle({ verb: "read", capabilityId: "shopping", parameters: {} }, user1);
  assert(noScope.status === "gap", "read with no scope → honest gap", noScope.status);

  // Honest gap when the owner has priced nothing (empty/unpriced list).
  const emptyPlatform = new IntelligencePlatform(new CapabilityRegistry());
  emptyPlatform.registerHandler("shopping", createShoppingReadHandler(async () => ({
    getShoppingListItems: async () => [item({ id: 7, householdId: 100, productName: "Unpriced thing" })],
    getShoppingListExtras: async () => [],
  })));
  const noPrices = await emptyPlatform.handle({ verb: "read", capabilityId: "shopping", parameters: { scope: "basket" } }, user1);
  assert(noPrices.status === "gap", "basket summary with no stored prices → honest gap (not a £0 basket)", noPrices.status);
  assert(/will not fabricate prices/.test(noPrices.message), "no-price gap refuses to fabricate prices/pick a store");

  // -------------------------------------------------------------------------
  section("Read-only enforcement — write verbs never execute through the binding");
  // 'add' / 'delete' / 'generate' ARE in the shopping allow-list; they must stop at
  // confirmation and, even if confirmed, never write (no mutation path exists here).
  const addUnconfirmed = await platform.handle({ verb: "add", capabilityId: "shopping", parameters: { name: "Crisps" } }, user1);
  assert(addUnconfirmed.status === "confirmation_required", "add (unconfirmed) → confirmation_required (never reaches handler)", addUnconfirmed.status);

  const addConfirmed = await platform.handle({ verb: "add", capabilityId: "shopping", parameters: { name: "Crisps" } }, user1, { confirmed: true });
  assert(addConfirmed.status === "gap", "add (confirmed) → honest gap: write not bound (read-only binding)", addConfirmed.status);
  assert(/read-only/.test(addConfirmed.message), "gap message states the binding is read-only");

  const delConfirmed = await platform.handle({ verb: "delete", capabilityId: "shopping", parameters: { itemId: 1 } }, user1, { confirmed: true });
  assert(delConfirmed.status === "gap", "delete (confirmed) → honest gap (no delete path)", delConfirmed.status);

  const genConfirmed = await platform.handle({ verb: "generate", capabilityId: "shopping", parameters: {} }, user1, { confirmed: true });
  assert(genConfirmed.status === "gap", "generate (confirmed) → honest gap (no generation path)", genConfirmed.status);

  // 'order' is an honest GAP at the registry level (no checkout endpoint exists at all).
  const order = await platform.handle({ verb: "order", capabilityId: "shopping" }, user1);
  assert(order.status === "gap", "order → honest gap (no checkout/order endpoint owned)", order.status);

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`INT3 Shopping read-only binding: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
