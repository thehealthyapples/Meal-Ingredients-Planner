/**
 * PlannerDiscoveryEngine (INT28)
 * ================================
 * Implements PlannerDiscoveryPort: fans out across all planner weeks for a user,
 * resolves meal names, and filters entries whose meal name matches the search query.
 *
 * Fan-out strategy:
 *   1. getPlannerWeeks(userId)           — 1 call
 *   2. getPlannerEntriesForWeek(weekId)  — N calls (one per week, parallel)
 *   3. getMeal(mealId)                   — M calls (one per unique mealId, parallel)
 *
 * For a typical user (6 weeks, ~20 unique meals) this is ~27 DB calls.
 * Acceptable for a discovery capability; no schema change required.
 *
 * OWNERSHIP: This engine does not own any data. It reads only. The planner and
 * meal owners (storage.ts) retain full ownership. This file contains NO business
 * logic — only match predicates and structural merging.
 *
 * HARD BOUNDARIES:
 *   • No cross-user data access: getPlannerWeeks(userId) is ownership-scoped.
 *   • No fabrication: every field in PlannerDiscoveryItem comes from a stored row.
 *   • Empty query returns empty array (gap handled by the handler).
 */

import type { PlannerWeek, PlannerEntry } from "@shared/schema";
import type { PlannerDiscoveryItem, PlannerDiscoveryPort } from "../handlers/planner-discovery-port.js";

/** Maximum discovery results returned per query. */
const PLANNER_DISCOVERY_MAX_RESULTS = 15;

// ---------------------------------------------------------------------------
// Minimal storage surface
// ---------------------------------------------------------------------------

/**
 * The minimal storage surface this engine reads. Typed so tests can inject
 * a fake without importing the full IStorage interface.
 */
export interface PlannerDiscoveryStorage {
  getPlannerWeeks(userId: number): Promise<PlannerWeek[]>;
  getPlannerEntriesForWeek(weekId: number): Promise<PlannerEntry[]>;
  getMeal(id: number): Promise<{ id: number; name: string } | undefined>;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class PlannerDiscoveryEngine implements PlannerDiscoveryPort {
  constructor(private readonly storage: PlannerDiscoveryStorage) {}

  async discover(query: string, userId: number): Promise<PlannerDiscoveryItem[]> {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return [];

    const weeks = await this.storage.getPlannerWeeks(userId).catch(() => [] as PlannerWeek[]);
    if (weeks.length === 0) return [];

    // Fan-out: get entries for all weeks in parallel.
    const entryResults = await Promise.allSettled(
      weeks.map((w) => this.storage.getPlannerEntriesForWeek(w.id)),
    );

    // Build weekId → week map for enrichment.
    const weekMap = new Map(weeks.map((w) => [w.id, w]));

    // Collect all entries paired with their week.
    const allPairs: Array<{ entry: PlannerEntry; week: PlannerWeek }> = [];
    for (let i = 0; i < weeks.length; i++) {
      const result = entryResults[i];
      if (result.status === "fulfilled") {
        for (const entry of result.value) {
          const week = weekMap.get(weeks[i].id);
          if (week) allPairs.push({ entry, week });
        }
      }
    }

    // Collect unique mealIds to resolve names in one parallel batch.
    const uniqueMealIds = [...new Set(allPairs.map((p) => p.entry.mealId))];
    const mealNameResults = await Promise.allSettled(
      uniqueMealIds.map((id) => this.storage.getMeal(id)),
    );
    const mealNameMap = new Map<number, string>();
    for (let i = 0; i < uniqueMealIds.length; i++) {
      const result = mealNameResults[i];
      if (result.status === "fulfilled" && result.value) {
        mealNameMap.set(uniqueMealIds[i], result.value.name);
      }
    }

    // Filter by query match on meal name.
    const items: PlannerDiscoveryItem[] = [];
    for (const { entry, week } of allPairs) {
      const mealName = mealNameMap.get(entry.mealId);
      if (!mealName) continue;
      if (!mealName.toLowerCase().includes(lowerQuery)) continue;
      items.push({
        id: `planner-entry:${entry.id}`,
        mealName,
        mealId: entry.mealId,
        weekName: week.weekName ?? `Week ${week.weekNumber}`,
        weekNumber: week.weekNumber,
        mealType: entry.mealType ?? "meal",
        source: "planner-discovery",
      });
    }

    return items.slice(0, PLANNER_DISCOVERY_MAX_RESULTS);
  }
}

/** Exported so tests can assert against the capping constant without magic numbers. */
export { PLANNER_DISCOVERY_MAX_RESULTS };
