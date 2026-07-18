/**
 * Diary Write Port (COMP_ACT1 — Companion Action Activation)
 * ===========================================================
 * The NARROW write delegation surface the Diary capability handler is allowed to call.
 * The single method is a 1:1 forward to an EXISTING owning-service method —
 * `storage.createFoodDiaryEntry`, the SAME call `POST /api/food-diary/:date/entries`
 * makes today. The owner resolves (or creates) the diary day for `(userId, date)` and
 * forces the row's `userId`/`dayId` itself, so the write is user-scoped by construction.
 *
 * GOVERNANCE: the Diary service (server/storage.ts, SoT D21) remains the sole owner of
 * all diary data and business rules (TIP1 Principles 2 & 7). This port adds NO diary
 * logic — it never computes nutrition, never touches wellness metrics, and never writes
 * for anyone but the caller.
 */

import type { FoodDiaryEntry, InsertFoodDiaryEntry } from "@shared/schema";

/** The write-only owning-service surface. Forwards to the existing Diary owner. */
export interface DiaryWritePort {
  /** Diary owner — log one entry on the caller's diary for `date` (user-scoped by the owner). */
  createFoodDiaryEntry(userId: number, date: string, data: InsertFoodDiaryEntry): Promise<FoodDiaryEntry>;
}

/**
 * Build the production port over the real owning service. Import is DYNAMIC so that
 * loading the Intelligence Platform module (and its tests) never opens a database
 * connection at import time — the owner is only touched on first invocation.
 */
export async function createStorageDiaryWritePort(): Promise<DiaryWritePort> {
  const { storage } = await import("../../storage.js");
  return {
    createFoodDiaryEntry: (userId, date, data) => storage.createFoodDiaryEntry(userId, date, data),
  };
}
