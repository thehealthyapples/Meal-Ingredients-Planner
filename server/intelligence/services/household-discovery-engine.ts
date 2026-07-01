/**
 * HouseholdDiscoveryEngine (INT29)
 * =================================
 * Implements HouseholdDiscoveryPort: resolves the caller's household and its
 * members, then filters them by the search query (name, diet type, or allergen).
 *
 * An EMPTY query returns ALL members — this handles "who's in my household?"
 * without requiring a gap response.
 *
 * Query matching strategy:
 *   - Member's displayName contains the query (case-insensitive)
 *   - OR any dietType contains the query
 *   - OR any hardRestriction contains the query
 *
 * OWNERSHIP: This engine does not own any data. It reads only. The household
 * storage owner (storage.ts) retains full ownership. This file contains NO
 * business logic — only match predicates and structural merging.
 *
 * HARD BOUNDARIES:
 *   • No cross-user data access: getHouseholdByUser(userId) is ownership-scoped.
 *   • No fabrication: every field in HouseholdDiscoveryItem comes from a stored row.
 *   • Returns empty array + empty householdName when user has no household.
 */

import type {
  HouseholdDiscoveryItem,
  HouseholdDiscoveryPort,
} from "../handlers/household-discovery-port.js";

/** Maximum discovery results returned per query. */
const HOUSEHOLD_DISCOVERY_MAX_RESULTS = 50;

// ---------------------------------------------------------------------------
// Minimal storage surface
// ---------------------------------------------------------------------------

export interface HouseholdDiscoveryStorage {
  getHouseholdByUser(userId: number): Promise<{
    household: { id: number; name: string };
    members: Array<{ userId: number; role: string }>;
  } | null>;
  getHouseholdEaters(householdId: number): Promise<Array<{
    id: number;
    userId?: number | null;
    displayName: string;
    defaultDietTypes?: string[] | null;
    hardRestrictions?: string[] | null;
  }>>;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class HouseholdDiscoveryEngine implements HouseholdDiscoveryPort {
  constructor(private readonly storage: HouseholdDiscoveryStorage) {}

  async discover(
    query: string,
    userId: number,
  ): Promise<{ items: HouseholdDiscoveryItem[]; householdName: string }> {
    const lowerQuery = query.toLowerCase().trim();

    const result = await this.storage.getHouseholdByUser(userId).catch(() => null);
    if (!result) return { items: [], householdName: "" };

    const { household, members } = result;

    const eaters = await this.storage.getHouseholdEaters(household.id).catch(() => []);

    // Build a role map: userId → role
    const roleMap = new Map(members.map((m) => [m.userId, m.role]));

    const items: HouseholdDiscoveryItem[] = [];

    for (const eater of eaters) {
      const dietTypes = (eater.defaultDietTypes ?? []).map((d) => d.toLowerCase());
      const restrictions = (eater.hardRestrictions ?? []).map((r) => r.toLowerCase());
      const nameLower = eater.displayName.toLowerCase();

      // Empty query → include all; otherwise filter
      const matches =
        !lowerQuery ||
        nameLower.includes(lowerQuery) ||
        dietTypes.some((d) => d.includes(lowerQuery)) ||
        restrictions.some((r) => r.includes(lowerQuery));

      if (!matches) continue;

      const uid = eater.userId ?? 0;
      items.push({
        id: `household-member:${uid || eater.id}`,
        displayName: eater.displayName,
        userId: uid,
        role: uid ? (roleMap.get(uid) ?? "member") : "guest",
        dietTypes: eater.defaultDietTypes ?? [],
        hardRestrictions: eater.hardRestrictions ?? [],
        source: "household-discovery",
      });
    }

    return {
      items: items.slice(0, HOUSEHOLD_DISCOVERY_MAX_RESULTS),
      householdName: household.name,
    };
  }
}

/** Exported so tests can assert against the capping constant without magic numbers. */
export { HOUSEHOLD_DISCOVERY_MAX_RESULTS };
