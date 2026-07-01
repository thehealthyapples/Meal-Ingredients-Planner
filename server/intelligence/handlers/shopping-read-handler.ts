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
    quantity: item.quantity,
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
  return {
    scope: "list",
    itemCount: items.length,
    items: items.map(toItemView),
    extras: extras.map(toExtraView),
  };
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
type ReadScope = "list" | "unresolved" | "basket";

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
    default:
      throw gap(
        `Unsupported shopping read scope ${JSON.stringify(scope)}. Supported read scopes: ` +
          '"list" (current shopping list + extras), "unresolved" (items the owner has ' +
          'flagged for review), and "basket" (pricing summary from stored prices only).',
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
