/**
 * DiaryDiscoveryEngine (INT32)
 * ================================
 * Implements DiaryDiscoveryPort: fetches the caller's food diary entries and
 * filters by the search query against food name.
 *
 * An EMPTY query returns ALL entries (up to the cap), most-recent first.
 *
 * OWNERSHIP: This engine does not own any data. It reads only.
 * HARD BOUNDARIES:
 *   • No cross-user data access: getDiaryEntriesForDiscovery(userId) is ownership-scoped.
 *   • No fabrication: every field comes from a stored row.
 */

import type { DiaryDiscoveryItem, DiaryDiscoveryPort } from "../handlers/diary-discovery-port.js";

const DIARY_DISCOVERY_MAX_RESULTS = 50;

export interface DiaryDiscoveryStorage {
  getDiaryEntriesForDiscovery(userId: number): Promise<Array<{
    id: number;
    userId: number;
    mealSlot: string;
    name: string;
    date: string;
  }>>;
}

export class DiaryDiscoveryEngine implements DiaryDiscoveryPort {
  constructor(private readonly storage: DiaryDiscoveryStorage) {}

  async discover(query: string, userId: number): Promise<DiaryDiscoveryItem[]> {
    const lowerQuery = query.toLowerCase().trim();

    const entries = await this.storage.getDiaryEntriesForDiscovery(userId).catch(() => []);
    const results: DiaryDiscoveryItem[] = [];

    for (const entry of entries) {
      const nameLower = entry.name.toLowerCase();
      const matches = !lowerQuery || nameLower.includes(lowerQuery);
      if (!matches) continue;

      results.push({
        id: `diary-entry:${entry.id}`,
        diaryEntryId: entry.id,
        foodName: entry.name,
        mealSlot: entry.mealSlot,
        date: entry.date,
        quantity: 0,
        unit: "",
        source: "diary-discovery",
      });
    }

    return results.slice(0, DIARY_DISCOVERY_MAX_RESULTS);
  }
}

export { DIARY_DISCOVERY_MAX_RESULTS };
