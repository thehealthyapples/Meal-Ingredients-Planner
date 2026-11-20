/**
 * Shopping Discovery Handler (INT30)
 * =====================================
 * Routes `shopping-discovery/search` intents to the ShoppingDiscoveryPort.
 *
 * VERB CONTRACT (read-only):
 *   search  → discover items on the caller's shopping list matching the query.
 *             An empty query returns ALL items (handles "what's on my list?").
 *
 * PERMISSION: auth-required (userId must be present in context).
 * OWNERSHIP:  no data mutation — pure read.
 */

import type { CapabilityHandler, IntelligenceContext, Intent } from "../types.js";
import type {
  ShoppingDiscoveryItem,
  ShoppingDiscoveryPort,
  ShoppingDiscoverySearchResult,
} from "./shopping-discovery-port.js";
import { requireUserId, readOnlyVerbGuard } from "./_read-kit.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SHOPPING_DISCOVERY_EXECUTABLE_INTENTS = ["search"] as const;

// COMP-DET1 — same shape as shopping-read-handler.ts's list answer: full
// detail below the threshold, a category-count breakdown above it (a wall of
// 100+ item names is not a useful answer; live-caught against real data).
const SHOPPING_SEARCH_PREVIEW_THRESHOLD = 15;

// COMP-DET1 (2026-11-20) — `totalCount` is now the engine's real, uncapped
// match count (ShoppingDiscoverySearchPage), not `items.length` — fixes a
// real bug live-caught via the benchmark (SH-035): the engine caps its
// returned `items` array, so stating `items.length` as the total was
// confidently wrong once a real household's data (154 items) exceeded the
// cap (50), the same "wrong number stated as fact" failure this whole
// feature exists to eliminate. `items.length < totalCount` now means
// "sample, not everything" — no hardcoded cap constant needed here at all.
function buildShoppingSearchDeterministicAnswer(
  query: string,
  items: readonly ShoppingDiscoveryItem[],
  totalCount: number,
): string {
  const scoped = query ? ` matching "${query}"` : "";
  if (totalCount === 0) {
    return query ? `Nothing on your shopping list matches "${query}".` : "Your shopping list is empty.";
  }

  const countPhrase = `${totalCount} item${totalCount === 1 ? "" : "s"}`;

  if (items.length < totalCount) {
    // The returned sample is capped below the true total — a per-category
    // breakdown from just the sample would undercount categories near the
    // cutoff, so ground this in real example names instead of a guessed
    // breakdown. The total itself stays exact (computed before capping).
    const examples = items.slice(0, 5).map((i) => i.name).join(", ");
    return `Your shopping list has ${countPhrase}${scoped}, including ${examples} and more.`;
  }

  if (items.length <= SHOPPING_SEARCH_PREVIEW_THRESHOLD) {
    const lines = items.map((item) => {
      const qty = item.quantityValue ? ` (${item.quantityValue} ${item.unit})` : "";
      const checkedMark = item.checked ? " [checked]" : "";
      return `${item.name}${qty}${checkedMark}`;
    });
    return `Your shopping list has ${countPhrase}${scoped}: ${lines.join(", ")}.`;
  }

  const counts = new Map<string, number>();
  for (const item of items) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  const checkedCount = items.filter((i) => i.checked).length;
  const parts = Array.from(counts.entries()).map(([cat, n]) => `${cat} (${n})`);
  return `Your shopping list has ${countPhrase}${scoped} (${checkedCount} already checked off) across: ${parts.join(", ")}.`;
}

// ---------------------------------------------------------------------------
// Search sub-handler
// ---------------------------------------------------------------------------

async function handleSearch(
  intent: Intent,
  userId: number,
  port: ShoppingDiscoveryPort,
): Promise<ShoppingDiscoverySearchResult> {
  const params = intent.parameters ?? {};
  const rawQuery = typeof params.query === "string" ? params.query.trim() : "";

  const { items, totalCount } = await port.discover(rawQuery, userId);

  return {
    scope: "shopping-search",
    query: rawQuery,
    totalCount,
    results: items,
    source: "shopping-discovery",
    deterministicAnswer: buildShoppingSearchDeterministicAnswer(rawQuery, items, totalCount),
  };
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

export function createShoppingDiscoveryHandler(
  resolvePort: () => Promise<ShoppingDiscoveryPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    readOnlyVerbGuard(intent, SHOPPING_DISCOVERY_EXECUTABLE_INTENTS, "Shopping Discovery");
    const userId = requireUserId(context, "Shopping Discovery");
    const port = await resolvePort();
    return handleSearch(intent, userId, port);
  };
}
