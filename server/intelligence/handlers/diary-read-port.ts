/**
 * Diary Read Port (INT10)
 * =======================
 * The NARROW, read-only delegation surface the Diary capability handler is allowed
 * to call. Every method here is a 1:1 forward to an EXISTING owning-service method —
 * the Diary data owner (`server/storage.ts`, SoT D21: food_diary_days,
 * food_diary_entries, food_diary_metrics tables). This port adds NO diary business
 * logic; it is a typed seam so that:
 *   • the handler delegates (never re-implements) diary reads, and
 *   • tests can inject an in-memory owner to prove delegation without a live database.
 *
 * OWN-DATA ONLY BY CONSTRUCTION: every method takes `userId` as its access key and
 * the owner's queries are scoped to that user's rows. There is no method here that
 * can read another user's diary data.
 *
 * GOVERNANCE: the Diary service (storage) remains the authoritative owner of all
 * diary data and business rules (TIP1 Principles 2 & 7). This port only *reads*
 * what the owner exposes; it has NO write methods by construction (INT10 is read-only).
 */

import type { FoodDiaryDay, FoodDiaryEntry, FoodDiaryMetrics } from "@shared/schema";

/**
 * The read-only owning-service surface. Each method forwards to the existing Diary
 * owner. All methods are user-scoped (userId is the access boundary; cross-user
 * access is structurally impossible via this port).
 */
export interface DiaryReadPort {
  /** Diary owner — the day header record for a user on a given date, or null if none logged. */
  getFoodDiaryDay(userId: number, date: string): Promise<FoodDiaryDay | null>;
  /** Diary owner — all diary entries for a user on a given date (empty if no day exists). */
  getFoodDiaryEntries(userId: number, date: string): Promise<FoodDiaryEntry[]>;
  /** Diary owner — stored wellness metrics for a user on a given date, or null if not recorded. */
  getFoodDiaryMetrics(userId: number, date: string): Promise<FoodDiaryMetrics | null>;
}

/**
 * Build the production port over the real owning service. Imports are DYNAMIC so that
 * loading the Intelligence Platform module (and its tests) never opens a database
 * connection at import time — the owner is only touched on first invocation.
 */
export async function createStorageDiaryReadPort(): Promise<DiaryReadPort> {
  const { storage } = await import("../../storage.js");
  return {
    getFoodDiaryDay: (userId, date) => storage.getFoodDiaryDay(userId, date),
    getFoodDiaryEntries: (userId, date) => storage.getFoodDiaryEntries(userId, date),
    getFoodDiaryMetrics: (userId, date) => storage.getFoodDiaryMetrics(userId, date),
  };
}
