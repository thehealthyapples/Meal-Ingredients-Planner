/**
 * Shopping Read Handler (INT3 — second live capability binding)
 * ============================================================
 * The SECOND execution handler bound to the THA Intelligence Platform. It makes the
 * `shopping` capability *executable* for READ-ONLY intents only, by delegating every
 * read to the existing Shopping owner through a {@link ShoppingReadPort}. It proves the
 * reusable Port → Handler → Binding pattern (first established for the Planner in INT2)
 * against a second, independent owner.
 *
 * HARD BOUNDARIES (the reason this binding is safe):
 *   • READ-ONLY. Only the "read" and "explain" verbs execute. Any other verb (add,
 *     delete, generate, …) throws an honest gap — there is NO code path here that adds
 *     an item, deletes an item, mutates a price, creates a basket, orders, or checks out.
 *   • DELEGATION ONLY. All data comes from the owning service via the port. This file
 *     contains NO shopping business rule, NO product matching, NO price lookup, NO basket
 *     assembly of its own. It projects stored reads; Shopping remains the owner (Principles 2 & 7).
 *   • PERMISSION-AWARE / OWN DATA ONLY. The caller must be an authenticated user; every
 *     read is scoped to that user's household by the owner getter. Cross-user access is
 *     impossible — the port has no method that takes another user/household id.
 *   • HONEST GAPS + THA TRUST RULES. Requests the Shopping owner holds no safe answer for
 *     return a structured gap, never a fabricated answer (Principle 6). The handler NEVER
 *     fabricates a price or a product match: it surfaces ONLY what the owner has already
 *     stored. Unresolved items stay unresolved; low-confidence matches stay reviewable;
 *     there is no silent generic-supermarket fallback.
 *
 * The handler is built by {@link createShoppingReadHandler} with a port provider, so the
 * production binding injects the real owning service and tests inject an in-memory owner.
 */

import {
  type CapabilityHandler,
  type IntelligenceContext,
  type Intent,
} from "../types.js";
import type { ShoppingReadPort } from "./shopping-read-port.js";
import { toInt, requireUserId, gap, denied, readOnlyVerbGuard } from "./_read-kit.js";
import type { ShoppingListItem, ShoppingListExtra } from "@shared/schema";

// ---------------------------------------------------------------------------
// Result shapes (read projections — owned data, surfaced honestly)
// ---------------------------------------------------------------------------

/** A shopping list line as the read binding surfaces it — stored fields only. */
export interface ShoppingItemView {
  readonly id: number;
  readonly name: string;
  readonly quantity: number;
  readonly unit: string | null;
  readonly category: string | null;
  readonly checked: boolean;
  /** Lifecycle state as the owner recorded it (raw | needs_review | resolved | matched_to_product). */
  readonly resolutionState: string | null;
  /** Guided-shop status as the owner recorded it (pending | already_got | in_basket | …). */
  readonly shopStatus: string | null;
  /** True only when the owner has flagged the item for review. */
  readonly needsReview: boolean;
  /** True only when the owner has STORED a product match for this item (never fabricated). */
  readonly hasMatch: boolean;
  /** The owner's stored matched store, or null. Never a generic fallback. */
  readonly matchedStore: string | null;
  /** The owner's stored matched price, or null. Never fabricated/estimated. */
  readonly matchedPrice: number | null;
  /** The owner's stored match confidence, or null (low-confidence matches stay reviewable). */
  readonly confidenceLevel: string | null;
  /** How much the household already has at home, when a partial-cupboard check was recorded. */
  readonly cupboardQuantity: number | null;
  /** Where this line came from: quick_list | planner | basket | null (unrecorded). */
  readonly source: string | null;
  /** THA's own stored product rating for the matched item, or null (never fabricated). */
  readonly thaRating: number | null;
}

export interface ShoppingExtraView {
  readonly id: number;
  readonly name: string;
  readonly category: string;
  readonly alwaysAdd: boolean;
  readonly inBasket: boolean;
}

export interface ShoppingListReadResult {
  readonly scope: "list";
  readonly itemCount: number;
  readonly items: readonly ShoppingItemView[];
  readonly extras: readonly ShoppingExtraView[];
  /**
   * COMP-DET1 (2026-11-20) — a full item listing is a fact code can render exactly
   * once, correctly, from the owner's own stored rows; it should never be
   * re-derived (or dropped/invented) by an LLM. When present, conversation-gateway.ts's
   * deterministic-answer short-circuit uses this text verbatim and skips full
   * generation for single-capability turns.
   */
  readonly deterministicAnswer: string;
}

export interface ShoppingUnresolvedItemView extends ShoppingItemView {
  /** Machine-readable reason the owner flagged it (unrecognised_item | ambiguous_term | …). */
  readonly reviewReason: string | null;
  /** The owner's stored human-readable reason for low confidence, when present. */
  readonly confidenceReason: string | null;
}

export interface ShoppingUnresolvedReadResult {
  readonly scope: "unresolved";
  readonly unresolvedCount: number;
  readonly items: readonly ShoppingUnresolvedItemView[];
}

export interface ShoppingPricedItemView {
  readonly id: number;
  readonly name: string;
  readonly matchedStore: string | null;
  readonly matchedPrice: number;
}

export interface ShoppingBasketSummaryResult {
  readonly scope: "basket";
  readonly itemCount: number;
  /** Items the owner has STORED a product match for. */
  readonly matchedItemCount: number;
  /** Items the owner has STORED a price for. */
  readonly pricedItemCount: number;
  /** Items still flagged unresolved/needs-review by the owner. */
  readonly unresolvedItemCount: number;
  /** Sum of the owner's STORED matched prices only — never an estimate, null if none priced. */
  readonly totalMatchedPrice: number;
  readonly currency: "GBP";
  /** The priced lines, with their stored store + price (may span stores — see note). */
  readonly pricedItems: readonly ShoppingPricedItemView[];
  /** Items with no stored price — surfaced honestly, never hidden behind a fabricated total. */
  readonly unpricedItems: readonly { readonly id: number; readonly name: string }[];
  readonly note: string;
}

/**
 * 2026-11-26 — the Shopping counterpart of the Planner/Journal diet-audits, reusing
 * the SAME reusable service (nutrition-diet-compatibility.ts). NAME-ONLY: a shopping
 * line has no ingredient breakdown (`item.productName` is the only food term stored),
 * so it is checked as a single food term, the same granularity Journal's audit uses.
 */
export interface ShoppingDietConflict {
  readonly itemId: number;
  readonly name: string;
  readonly explanation: string;
}

export interface ShoppingDietAuditResult {
  readonly scope: "diet-audit";
  readonly totalItems: number;
  readonly conflictCount: number;
  readonly conflicts: readonly ShoppingDietConflict[];
  readonly deterministicAnswer: string;
}

export interface ShoppingStatusExplainResult {
  readonly itemId: number;
  readonly name: string;
  readonly resolutionState: string | null;
  readonly shopStatus: string | null;
  readonly needsReview: boolean;
  readonly reviewReason: string | null;
  readonly confidenceLevel: string | null;
  readonly confidenceReason: string | null;
  readonly validationNote: string | null;
  readonly hasMatch: boolean;
  readonly matchedStore: string | null;
  readonly matchedPrice: number | null;
  readonly source: "shopping-stored-item-state";
}

// ---------------------------------------------------------------------------
// Stored-state predicates (NO business logic — pure reads of owner-stored fields)
// ---------------------------------------------------------------------------

/** Lifecycle states the owner considers settled. */
const RESOLVED_STATES: ReadonlySet<string> = new Set(["resolved", "matched_to_product"]);

/**
 * Is this item unresolved? Strictly a read of owner-STORED flags — the handler does NOT
 * decide resolution itself, it reports the owner's recorded state. An item is unresolved
 * if the owner flagged it for review OR its stored resolutionState is not a settled one.
 */
function isUnresolved(item: ShoppingListItem): boolean {
  if (item.needsReview) return true;
  const state = item.resolutionState ?? "raw";
  return !RESOLVED_STATES.has(state);
}

/** Does the owner hold a STORED product match for this item? (Never fabricated.) */
function hasStoredMatch(item: ShoppingListItem): boolean {
  return item.matchedProductId != null && item.matchedProductId !== "";
}

// ---------------------------------------------------------------------------
// Read projections (stored fields only — no fabrication)
// ---------------------------------------------------------------------------

function toItemView(item: ShoppingListItem): ShoppingItemView {
  return {
    id: item.id,
    name: item.productName,
    // BENCH4 (SH-039): `quantity` is the line-ITEM counter (integer, NOT NULL, DEFAULT 1 —
    // "how many of this list row"), not the parsed amount. `quantityValue` (a real, e.g.
    // 5 for "5 ounces spinach") is what the ingredient's actual amount is — live-confirmed
    // the Companion was reporting "1 ounce spinach" for a real 5-ounce line, a genuine
    // field-mapping bug, not an LLM error. Falls back to `quantity` only when
    // `quantityValue` was never parsed (kept at the historical default rather than null).
    quantity: item.quantityValue ?? item.quantity,
    unit: item.unit ?? null,
    category: item.category ?? null,
    checked: item.checked,
    resolutionState: item.resolutionState ?? null,
    shopStatus: item.shopStatus ?? null,
    needsReview: item.needsReview,
    hasMatch: hasStoredMatch(item),
    // Only surface store/price when a match is actually stored — never a generic fallback.
    matchedStore: hasStoredMatch(item) ? (item.matchedStore ?? null) : null,
    matchedPrice: item.matchedPrice ?? null,
    confidenceLevel: item.confidenceLevel ?? null,
    cupboardQuantity: item.cupboardQuantity ?? null,
    source: item.source ?? null,
    thaRating: item.thaRating ?? null,
  };
}

function toExtraView(extra: ShoppingListExtra): ShoppingExtraView {
  return {
    id: extra.id,
    name: extra.name,
    category: extra.category,
    alwaysAdd: extra.alwaysAdd,
    inBasket: extra.inBasket,
  };
}

async function readList(userId: number, port: ShoppingReadPort): Promise<ShoppingListReadResult> {
  const [items, extras] = await Promise.all([
    port.getShoppingListItems(userId),
    port.getShoppingListExtras(userId),
  ]);
  const views = items.map(toItemView);
  return {
    scope: "list",
    itemCount: views.length,
    items: views,
    extras: extras.map(toExtraView),
    deterministicAnswer: buildShoppingDeterministicAnswer(views),
  };
}

// COMP-DET1 — live-caught testing this against real data: real shopping lists
// in this dataset ran to 150+ lines, and naming every one produces an
// unreadable wall of text, not a useful answer. Below the threshold, name
// every item (full detail is the more useful answer when short enough to
// read). At/above it, switch to a category-count breakdown — still a
// deterministic, fully-accurate fact, just shaped for readability.
const SHOPPING_PREVIEW_THRESHOLD = 15;

function buildShoppingDeterministicAnswer(items: readonly ShoppingItemView[]): string {
  if (items.length === 0) return "Your shopping list is empty.";

  if (items.length <= SHOPPING_PREVIEW_THRESHOLD) {
    const lines = items.map((item) => {
      const qty = item.quantity && item.unit
        ? ` (${item.quantity} ${item.unit})`
        : item.quantity
          ? ` (${item.quantity})`
          : "";
      const checkedMark = item.checked ? " [checked]" : "";
      return `${item.name}${qty}${checkedMark}`;
    });
    return `Your shopping list has ${items.length} item${items.length === 1 ? "" : "s"}: ${lines.join(", ")}.`;
  }

  const counts = new Map<string, number>();
  for (const item of items) {
    const cat = item.category ?? "uncategorised";
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  const checkedCount = items.filter((i) => i.checked).length;
  const parts = Array.from(counts.entries()).map(([cat, n]) => `${cat} (${n})`);
  return `Your shopping list has ${items.length} items (${checkedCount} already checked off) across: ${parts.join(", ")}.`;
}

async function readUnresolved(
  userId: number,
  port: ShoppingReadPort,
): Promise<ShoppingUnresolvedReadResult> {
  const items = await port.getShoppingListItems(userId);
  const unresolved = items.filter(isUnresolved).map((item): ShoppingUnresolvedItemView => ({
    ...toItemView(item),
    reviewReason: item.reviewReason ?? null,
    confidenceReason: item.confidenceReason ?? null,
  }));
  return { scope: "unresolved", unresolvedCount: unresolved.length, items: unresolved };
}

/**
 * Basket / pricing summary — derived STRICTLY from the owner's stored per-item match
 * fields. The handler does NOT fetch live prices, does NOT match products, and does NOT
 * pick a supermarket. The total is the sum of prices the owner already stored; unpriced
 * and unresolved items are reported explicitly so a fabricated total can never hide them.
 * If the owner has priced nothing, that is an honest gap rather than a £0 / invented basket.
 */
async function readBasketSummary(
  userId: number,
  port: ShoppingReadPort,
): Promise<ShoppingBasketSummaryResult> {
  const items = await port.getShoppingListItems(userId);

  const priced: ShoppingPricedItemView[] = [];
  const unpriced: { id: number; name: string }[] = [];
  let matchedItemCount = 0;
  let unresolvedItemCount = 0;

  for (const item of items) {
    if (hasStoredMatch(item)) matchedItemCount++;
    if (isUnresolved(item)) unresolvedItemCount++;
    if (item.matchedPrice != null) {
      priced.push({
        id: item.id,
        name: item.productName,
        matchedStore: hasStoredMatch(item) ? (item.matchedStore ?? null) : null,
        matchedPrice: item.matchedPrice,
      });
    } else {
      unpriced.push({ id: item.id, name: item.productName });
    }
  }

  if (priced.length === 0) {
    throw gap(
      "Honest gap: the Shopping owner has no stored prices for your list yet, so there is " +
        "no basket/pricing summary to report. The Intelligence Platform will not fabricate " +
        "prices or pick a supermarket — pricing is owned by the Shopping service.",
    );
  }

  const totalMatchedPrice = priced.reduce((sum, p) => sum + p.matchedPrice, 0);

  return {
    scope: "basket",
    itemCount: items.length,
    matchedItemCount,
    pricedItemCount: priced.length,
    unresolvedItemCount,
    totalMatchedPrice,
    currency: "GBP",
    pricedItems: priced,
    unpricedItems: unpriced,
    note:
      "Total is the sum of prices the Shopping owner has already stored per item and may " +
      "span more than one store. Unpriced and unresolved items are listed separately and " +
      "are NOT included in the total. No prices were estimated and no store was chosen here.",
  };
}

/**
 * Check every item on the shopping list against the household's diet patterns and
 * hard restrictions — the Shopping counterpart of the Planner/Journal diet-audits,
 * reusing the SAME service (nutrition-diet-compatibility.ts). Resolves the household
 * context ONCE, not per item (the household doesn't change between items in one audit).
 * An empty list is a clean (zero-conflict) answer, not a gap.
 */
async function auditShoppingListDiet(
  userId: number,
  port: ShoppingReadPort,
): Promise<ShoppingDietAuditResult> {
  const items = await port.getShoppingListItems(userId);

  const { resolveHouseholdDietContext, checkFoodCompatibilityWithContext } =
    await import("./nutrition-diet-compatibility.js");
  const dietContext = await resolveHouseholdDietContext(userId);

  const conflicts: ShoppingDietConflict[] = [];
  for (const item of items) {
    const compat = checkFoodCompatibilityWithContext(item.productName, dietContext);
    if (compat.compatible) continue;
    conflicts.push({
      itemId: item.id,
      name: item.productName,
      explanation: compat.explanation,
    });
  }

  // 2026-11-26 — cap the SPOKEN sentence at a readable length, same as the Planner
  // audit's SPOKEN_CONFLICT_LIMIT: a real shopping list ran to 54 conflicts, and
  // naming every one produces an unreadable wall of text, not a useful answer.
  // `conflicts` (the full structured list) is unaffected — a UI that wants every
  // item still gets all of them.
  const SPOKEN_CONFLICT_LIMIT = 5;
  const shown = conflicts.slice(0, SPOKEN_CONFLICT_LIMIT);
  const remaining = conflicts.length - shown.length;
  const deterministicAnswer =
    conflicts.length === 0
      ? `No dietary conflicts found on your shopping list — all ${items.length} item${items.length === 1 ? "" : "s"} fit your household's declared diets and restrictions.`
      : `${conflicts.length} item${conflicts.length === 1 ? "" : "s"} on your shopping list may conflict with your household's dietary requirements. ` +
        shown.map((c) => `${c.name}: ${c.explanation}`).join(" ") +
        (remaining > 0 ? ` …and ${remaining} more item${remaining === 1 ? "" : "s"}.` : "");

  return {
    scope: "diet-audit",
    totalItems: items.length,
    conflictCount: conflicts.length,
    conflicts,
    deterministicAnswer,
  };
}

// ---------------------------------------------------------------------------
// Explain (existing stored/derived shopping state only)
// ---------------------------------------------------------------------------

/**
 * Explain an item's shopping status — using EXISTING stored state only. Ownership is
 * delegated to the owner getter: the item must appear in the caller's own (household-
 * scoped) list, otherwise it is reported as not-found with no existence leak. When the
 * owner records no status signal at all for the item, that is an honest gap rather than
 * an invented explanation.
 */
async function explainStatus(
  intent: Intent,
  userId: number,
  port: ShoppingReadPort,
): Promise<ShoppingStatusExplainResult> {
  const params = intent.parameters ?? {};
  const itemId = toInt(params.itemId);
  if (itemId === undefined) {
    throw gap('Explaining shopping status needs { itemId } — the shopping list item to explain.');
  }

  // Own-data only: resolve via the household-scoped owner getter; an item outside the
  // caller's list simply is not present (no cross-household read, no existence leak).
  const items = await port.getShoppingListItems(userId);
  const item = items.find((i) => i.id === itemId);
  if (!item) {
    throw denied("Shopping list item not found in your list (no cross-household access).");
  }

  // A bare-default resolutionState ("raw" / null) is not a meaningful explanation — the
  // owner has simply not assessed the item yet. We require a real stored signal before
  // claiming we can "explain" the status, otherwise it is an honest gap.
  const meaningfulResolution =
    item.resolutionState != null && item.resolutionState !== "raw";
  const hasAnyStatus =
    meaningfulResolution ||
    item.shopStatus != null ||
    item.needsReview ||
    item.reviewReason != null ||
    item.confidenceReason != null ||
    item.validationNote != null ||
    hasStoredMatch(item);

  if (!hasAnyStatus) {
    throw gap(
      "Honest gap: the Shopping owner records no status, review reason or match state for " +
        "this item, so there is nothing to explain. The Intelligence Platform will not " +
        "invent a status.",
    );
  }

  return {
    itemId: item.id,
    name: item.productName,
    resolutionState: item.resolutionState ?? null,
    shopStatus: item.shopStatus ?? null,
    needsReview: item.needsReview,
    reviewReason: item.reviewReason ?? null,
    confidenceLevel: item.confidenceLevel ?? null,
    confidenceReason: item.confidenceReason ?? null,
    validationNote: item.validationNote ?? null,
    hasMatch: hasStoredMatch(item),
    matchedStore: hasStoredMatch(item) ? (item.matchedStore ?? null) : null,
    matchedPrice: item.matchedPrice ?? null,
    source: "shopping-stored-item-state",
  };
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

/** The read scopes the shopping read binding understands. */
type ReadScope = "list" | "unresolved" | "basket" | "diet-audit";

async function handleRead(
  intent: Intent,
  userId: number,
  port: ShoppingReadPort,
): Promise<unknown> {
  const params = intent.parameters ?? {};
  const scope = params.scope as ReadScope | undefined;

  switch (scope) {
    case "list":
      return readList(userId, port);
    case "unresolved":
      return readUnresolved(userId, port);
    case "basket":
      return readBasketSummary(userId, port);
    case "diet-audit":
      return auditShoppingListDiet(userId, port);
    default:
      throw gap(
        `Unsupported shopping read scope ${JSON.stringify(scope)}. Supported read scopes: ` +
          '"list" (current shopping list + extras), "unresolved" (items the owner has ' +
          'flagged for review), "basket" (pricing summary from stored prices only), and ' +
          '"diet-audit" (list items checked against household diet).',
      );
  }
}

/**
 * Create the shopping read-only handler. `resolvePort` provides the owning-service surface
 * (production: real storage; tests: in-memory owner). The returned handler is what the
 * Capability Registry binds to the `shopping` capability (INT3).
 */
export function createShoppingReadHandler(
  resolvePort: () => Promise<ShoppingReadPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    // Read-only binding: only "read" and "explain" execute. Every other verb (add, delete,
    // generate — all in the shopping allow-list but all WRITES) is an honest gap. There is
    // no code path here that adds, deletes, prices, baskets, orders or checks out; the
    // Shopping service remains the sole owner of every shopping mutation.
    readOnlyVerbGuard(intent, ["read", "explain"], "Shopping");

    const userId = requireUserId(context, "Shopping");
    const port = await resolvePort();

    if (intent.verb === "read") return handleRead(intent, userId, port);
    return explainStatus(intent, userId, port);
  };
}
