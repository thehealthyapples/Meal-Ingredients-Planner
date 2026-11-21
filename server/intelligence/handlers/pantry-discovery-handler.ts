/**
 * Pantry Discovery Handler (INT31)
 * ====================================
 * Routes `pantry-discovery/search` intents to the PantryDiscoveryPort.
 *
 * VERB CONTRACT (read-only):
 *   search  → discover items in the caller's pantry matching the query.
 *             An empty query returns ALL items.
 *
 * PERMISSION: auth-required.
 * OWNERSHIP:  no data mutation — pure read.
 */

import type { CapabilityHandler, IntelligenceContext, Intent } from "../types.js";
import type {
  PantryDiscoveryItem,
  PantryDiscoveryPort,
  PantryDiscoverySearchResult,
} from "./pantry-discovery-port.js";
import { requireUserId, readOnlyVerbGuard } from "./_read-kit.js";

export const PANTRY_DISCOVERY_EXECUTABLE_INTENTS = ["search"] as const;

// COMP-DET1 — same shape as pantry-read-handler.ts's list answer: full detail
// below the threshold, a category-count breakdown above it (a wall of 100+
// item names is not a useful answer; live-caught against real data).
const PANTRY_SEARCH_PREVIEW_THRESHOLD = 15;

// COMP-DET1 (2026-11-20) — `totalCount` is now the engine's real, uncapped
// match count (PantryDiscoverySearchPage), not `items.length` — fixes a real
// bug live-caught via the benchmark (PA-045): the engine caps its returned
// `items` array, so stating `items.length` as the total was confidently wrong
// once a real household's data (138 items) exceeded the cap (100), the same
// "wrong number stated as fact" failure this whole feature exists to
// eliminate. `items.length < totalCount` now means "sample, not everything" —
// no hardcoded cap constant needed here at all.
function buildPantrySearchDeterministicAnswer(
  query: string,
  items: readonly PantryDiscoveryItem[],
  totalCount: number,
): string {
  const scoped = query ? ` matching "${query}"` : "";
  if (totalCount === 0) {
    return query ? `Nothing in your pantry matches "${query}".` : "Your pantry is empty — nothing logged yet.";
  }

  const countPhrase = `${totalCount} item${totalCount === 1 ? "" : "s"}`;

  if (items.length < totalCount) {
    // The returned sample is capped below the true total — a per-location
    // breakdown from just the sample would undercount locations near the
    // cutoff, so ground this in real example names instead of a guessed
    // breakdown. The total itself stays exact (computed before capping).
    //
    // 2026-11-21 (owner-reported): an unscoped browse ("what's in my pantry?") picked
    // its 5 examples by raw item order, which is insertion/id order — on a real
    // household this meant Shampoo, Sponges, Aluminium Foil, Fabric Conditioner and
    // Toilet Roll (the seeded "household" category, lowest ids) led every answer, even
    // though 115 of this household's 138 items are actual food. THA is a food app;
    // food-location examples (fridge/freezer/larder/fruit — anything but the generic
    // "household" catch-all) are what a "what's in my pantry" question means in
    // practice. Only fall back to a household item if fewer than 5 food items exist.
    const foodFirst = [...items].sort((a, b) => {
      const aHousehold = a.location === "household" ? 1 : 0;
      const bHousehold = b.location === "household" ? 1 : 0;
      return aHousehold - bHousehold;
    });
    const examples = foodFirst.slice(0, 5).map((i) => i.name).join(", ");
    return `Your pantry has ${countPhrase}${scoped}, including ${examples} and more.`;
  }

  const byLocation = new Map<string, string[]>();
  for (const item of items) {
    const list = byLocation.get(item.location) ?? [];
    list.push(item.name);
    byLocation.set(item.location, list);
  }

  if (items.length <= PANTRY_SEARCH_PREVIEW_THRESHOLD) {
    const parts = Array.from(byLocation.entries()).map(([loc, names]) => `${loc}: ${names.join(", ")}`);
    return `Your pantry has ${countPhrase}${scoped} — ${parts.join("; ")}.`;
  }

  const counts = Array.from(byLocation.entries()).map(([loc, names]) => `${loc} (${names.length})`);
  return `Your pantry has ${countPhrase}${scoped} across these locations: ${counts.join(", ")}.`;
}

async function handleSearch(
  intent: Intent,
  userId: number,
  port: PantryDiscoveryPort,
): Promise<PantryDiscoverySearchResult> {
  const params = intent.parameters ?? {};
  const rawQuery = typeof params.query === "string" ? params.query.trim() : "";

  const { items, totalCount } = await port.discover(rawQuery, userId);

  return {
    scope: "pantry-search",
    query: rawQuery,
    totalCount,
    results: items,
    source: "pantry-discovery",
    deterministicAnswer: buildPantrySearchDeterministicAnswer(rawQuery, items, totalCount),
  };
}

export function createPantryDiscoveryHandler(
  resolvePort: () => Promise<PantryDiscoveryPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    readOnlyVerbGuard(intent, PANTRY_DISCOVERY_EXECUTABLE_INTENTS, "Pantry Discovery");
    const userId = requireUserId(context, "Pantry Discovery");
    const port = await resolvePort();
    return handleSearch(intent, userId, port);
  };
}
