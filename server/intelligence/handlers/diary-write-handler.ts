/**
 * Diary Write Handler (COMP_ACT1 — Companion Action Activation)
 * =============================================================
 * Makes the `add` verb on the `diary` capability executable, by delegating to the
 * existing Diary owner (`storage.createFoodDiaryEntry`) through a {@link DiaryWritePort}.
 * It is the write-side counterpart of the read-only Diary binding (INT10).
 *
 * OWNERSHIP: the owner method is user-scoped (it resolves the caller's own diary day for
 * `date` and forces the row's `userId`), so a cross-user log is impossible — exactly as
 * `POST /api/food-diary/:date/entries` relies on. The handler builds the SAME insert
 * shape that route builds (`sourceType: "manual"`, `sourcePlannerEntryId: null`).
 *
 * HARD BOUNDARIES:
 *   • ONE VERB. Only "add" (log a meal) executes here; anything else is an honest gap.
 *   • THE DATE IS NEVER GUESSED. `date` (YYYY-MM-DD) must be supplied — a missing or
 *     malformed date is an honest gap, never "today" invented by the platform.
 *   • DELEGATION ONLY. No diary business rule is re-implemented here; the handler does
 *     NOT replicate the route's secondary analytics side-effects (usage/savings events),
 *     which are not part of the core owned write.
 *   • CONFIRMATION IS ALREADY ENFORCED UPSTREAM by the Intent Engine's CONFIRM step
 *     (add → light; server-resolved in permissions.ts).
 */

import {
  type CapabilityHandler,
  type IntelligenceContext,
  type Intent,
} from "../types.js";
import type { DiaryWritePort } from "./diary-write-port.js";
import { requireUserId, gap } from "./_read-kit.js";
import type { FoodDiaryEntry } from "@shared/schema";

/** The meal slots the live `POST /api/food-diary/:date/entries` route accepts — mirrored, not relaxed. */
const VALID_DIARY_SLOTS = new Set(["breakfast", "lunch", "dinner", "snack", "drink"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** The result of a successful "add" — the stored diary entry the owner returned. */
export interface DiaryAddResult {
  readonly scope: "add";
  readonly entry: {
    readonly id: number;
    readonly name: string;
    readonly mealSlot: string;
    readonly dayId: number;
  };
}

function toResult(entry: FoodDiaryEntry): DiaryAddResult {
  return {
    scope: "add",
    entry: { id: entry.id, name: entry.name, mealSlot: entry.mealSlot, dayId: entry.dayId },
  };
}

async function handleAdd(
  intent: Intent,
  userId: number,
  port: DiaryWritePort,
): Promise<DiaryAddResult> {
  const params = intent.parameters ?? {};
  const name = typeof params.name === "string" ? params.name.trim() : "";
  const mealSlot = typeof params.mealSlot === "string" ? params.mealSlot : "";
  const date = typeof params.date === "string" ? params.date : "";

  if (!name) {
    throw gap("Logging a meal needs { name } — what was eaten.");
  }
  if (!VALID_DIARY_SLOTS.has(mealSlot)) {
    throw gap("Logging a meal needs a valid { mealSlot }. Supported: breakfast, lunch, dinner, snack, drink.");
  }
  if (!DATE_RE.test(date)) {
    throw gap(
      "Logging a meal needs { date } as YYYY-MM-DD — resolved from context the platform already has. " +
        "The Intelligence Platform never guesses which day to log against.",
    );
  }
  const notes = typeof params.notes === "string" && params.notes.trim() ? params.notes.trim() : null;

  const entry = await port.createFoodDiaryEntry(userId, date, {
    // dayId/userId are resolved and forced by the owner; passed for the insert shape only.
    dayId: 0,
    userId,
    name,
    mealSlot,
    notes,
    sourceType: "manual",
    sourcePlannerEntryId: null,
  });
  return toResult(entry);
}

/**
 * Create the diary write handler. `resolvePort` provides the owning-service surface
 * (production: real storage; tests: in-memory owner).
 */
export function createDiaryWriteHandler(
  resolvePort: () => Promise<DiaryWritePort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    if (intent.verb !== "add") {
      throw gap(
        `Diary is bound to the Intelligence Platform for write ONLY on "add": "${intent.verb}" is not executable via the platform yet.`,
      );
    }
    const userId = requireUserId(context, "Diary");
    const port = await resolvePort();
    return handleAdd(intent, userId, port);
  };
}
