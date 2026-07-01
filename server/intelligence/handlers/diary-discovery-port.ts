/**
 * Diary Discovery Port (INT32)
 * ==============================
 * Types and production port factory for the `diary-discovery` capability.
 *
 * The port exposes a single method — `discover(query, userId)` — that searches
 * the caller's food diary entries by food name. An empty query returns recent
 * entries (up to the engine's cap).
 *
 * GOVERNANCE: No data is owned here. The diary storage owner retains full
 * ownership. This port is the typed seam that keeps the handler testable
 * without a live database.
 */

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface DiaryDiscoveryItem {
  readonly id: string;
  readonly diaryEntryId: number;
  readonly foodName: string;
  readonly mealSlot: string;
  readonly date: string;
  readonly quantity: number;
  readonly unit: string;
  readonly source: "diary-discovery";
}

export interface DiaryDiscoverySearchResult {
  readonly scope: "diary-search";
  readonly query: string;
  readonly totalCount: number;
  readonly results: readonly DiaryDiscoveryItem[];
  readonly source: "diary-discovery";
}

// ---------------------------------------------------------------------------
// Port interface
// ---------------------------------------------------------------------------

export interface DiaryDiscoveryPort {
  discover(query: string, userId: number): Promise<DiaryDiscoveryItem[]>;
}

// ---------------------------------------------------------------------------
// Production port factory
// ---------------------------------------------------------------------------

export async function createProductionDiaryDiscoveryPort(): Promise<DiaryDiscoveryPort> {
  const { DiaryDiscoveryEngine } = await import("../services/diary-discovery-engine.js");
  const { storage } = await import("../../storage.js");
  return new DiaryDiscoveryEngine(storage);
}
