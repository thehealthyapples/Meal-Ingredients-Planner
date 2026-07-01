/**
 * Diary Read Handler (INT10 — fifth live capability binding)
 * ==========================================================
 * The FIFTH execution handler bound to the THA Intelligence Platform. It makes the
 * `diary` capability *executable* for READ-ONLY intents only, by delegating every
 * read to the existing Diary owner (storage) through a {@link DiaryReadPort}. It
 * proves the reusable Port → Handler → Binding pattern (first established for the
 * Planner in INT2) against a fifth, independent owner.
 *
 * HARD BOUNDARIES (the reason this binding is safe):
 *   • READ-ONLY. Only the "read" and "explain" verbs execute. Any other verb (add,
 *     delete, import) throws an honest gap — there is NO code path here that adds,
 *     deletes, or mutates any diary record or wellness metric.
 *   • DELEGATION ONLY. All data comes from the owning service via the port. This file
 *     contains NO diary business rule, NO nutrition calculation, NO sorting beyond
 *     projecting the owner's stored values. The Diary service remains the owner
 *     (Principles 2 & 7).
 *   • PERMISSION-AWARE / OWN DATA ONLY. The caller must be an authenticated user; every
 *     read is scoped to that user's rows by the owner getters. Cross-user reads are
 *     impossible by construction.
 *   • HONEST GAPS + THA TRUST RULES. Requests the Diary owner holds no safe answer for
 *     return a structured gap, never a fabricated answer (Principle 6). The handler NEVER
 *     invents diary entries, wellness metrics, or nutritional values: it surfaces ONLY
 *     what the owner has already stored. A date with no logged entries or no stored
 *     metrics returns a gap, never invented data.
 *
 * The handler is built by {@link createDiaryReadHandler} with a port provider, so the
 * production binding injects the real owning service and tests inject an in-memory owner.
 */

import type { CapabilityHandler, IntelligenceContext, Intent } from "../types.js";
import type { DiaryReadPort } from "./diary-read-port.js";
import { requireUserId, gap, readOnlyVerbGuard } from "./_read-kit.js";
import type { FoodDiaryEntry, FoodDiaryMetrics } from "@shared/schema";

// ---------------------------------------------------------------------------
// Result shapes (read projections — owned data, surfaced honestly)
// ---------------------------------------------------------------------------

/** A diary entry as the read binding surfaces it — display-safe stored fields only. */
export interface DiaryEntryView {
  readonly id: number;
  readonly mealSlot: string;
  readonly name: string;
  readonly notes: string | null;
  readonly sourceType: string;
}

export interface DiaryDayReadResult {
  readonly scope: "day";
  readonly date: string;
  readonly notes: string | null;
  readonly entryCount: number;
  readonly entries: readonly DiaryEntryView[];
  readonly source: "food-diary";
}

/** Stored wellness metrics as the read binding surfaces them — display-safe fields only. */
export interface DiaryMetricsView {
  readonly date: string;
  readonly weightKg: number | null;
  readonly bmi: number | null;
  readonly moodApples: number | null;
  readonly sleepHours: number | null;
  readonly energyApples: number | null;
  readonly stuckToPlan: boolean | null;
  readonly notes: string | null;
  readonly source: "food-diary-metrics";
}

export interface DiaryExplainResult {
  readonly date: string;
  readonly metrics: DiaryMetricsView;
}

// ---------------------------------------------------------------------------
// Read projections (stored fields only — no fabrication)
// ---------------------------------------------------------------------------

function toEntryView(entry: FoodDiaryEntry): DiaryEntryView {
  return {
    id: entry.id,
    mealSlot: entry.mealSlot,
    name: entry.name,
    notes: entry.notes ?? null,
    sourceType: entry.sourceType,
  };
}

function toMetricsView(m: FoodDiaryMetrics): DiaryMetricsView {
  return {
    date: m.date,
    weightKg: m.weightKg ?? null,
    bmi: m.bmi ?? null,
    moodApples: m.moodApples ?? null,
    sleepHours: m.sleepHours ?? null,
    energyApples: m.energyApples ?? null,
    stuckToPlan: m.stuckToPlan ?? null,
    notes: m.notes ?? null,
    source: "food-diary-metrics",
  };
}

// ---------------------------------------------------------------------------
// Verb implementations
// ---------------------------------------------------------------------------

/**
 * Read a diary day: the day header (notes + date) plus all logged entries for that
 * date. Requires a `date` parameter (YYYY-MM-DD). Gap if no diary day has been
 * logged for the requested date — never a fabricated empty record.
 */
async function handleRead(intent: Intent, userId: number, port: DiaryReadPort): Promise<DiaryDayReadResult> {
  const params = intent.parameters ?? {};
  const scope = params.scope as string | undefined;
  const date = typeof params.date === "string" ? params.date.trim() : "";

  if (!date) {
    throw gap(
      'Reading a diary day requires a { date } parameter (format: "YYYY-MM-DD").',
    );
  }

  if (scope !== "day") {
    throw gap(
      `Unsupported diary read scope ${JSON.stringify(scope)}. ` +
        'Supported scope: "day" (diary day header + all logged entries for a date).',
    );
  }

  const day = await port.getFoodDiaryDay(userId, date);
  if (!day) {
    throw gap(
      `No diary day logged for ${JSON.stringify(date)}. ` +
        "The Diary owner has no stored record for this date — the Intelligence Platform will not fabricate entries.",
    );
  }

  const entries = await port.getFoodDiaryEntries(userId, date);
  return {
    scope: "day",
    date: day.date,
    notes: day.notes ?? null,
    entryCount: entries.length,
    entries: entries.map(toEntryView),
    source: "food-diary",
  };
}

/**
 * Explain the stored wellness metrics logged for a given date. Requires a `date`
 * parameter. Gap if no metrics have been stored for that date — the handler NEVER
 * fabricates weight, mood, sleep, or energy values.
 */
async function handleExplain(
  intent: Intent,
  userId: number,
  port: DiaryReadPort,
): Promise<DiaryExplainResult> {
  const params = intent.parameters ?? {};
  const date = typeof params.date === "string" ? params.date.trim() : "";

  if (!date) {
    throw gap(
      'Explaining diary wellness data requires a { date } parameter (format: "YYYY-MM-DD").',
    );
  }

  const metrics = await port.getFoodDiaryMetrics(userId, date);
  if (!metrics) {
    throw gap(
      `Honest gap: the Diary owner has no stored wellness metrics for ${JSON.stringify(date)}. ` +
        "The Intelligence Platform will not fabricate weight, mood, sleep, or energy values.",
    );
  }

  return {
    date,
    metrics: toMetricsView(metrics),
  };
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

/**
 * Create the diary read-only handler. `resolvePort` provides the owning-service surface
 * (production: real storage; tests: in-memory owner). The returned handler is what the
 * Capability Registry binds to the `diary` capability (INT10).
 */
export function createDiaryReadHandler(
  resolvePort: () => Promise<DiaryReadPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    // Read-only binding: only "read" and "explain" execute. Every other verb (add,
    // delete, import — all in the diary allow-list but all out of scope for this
    // read-only binding) is an honest gap. There is no code path here that adds,
    // deletes, or imports any diary record; the Diary service remains the sole owner
    // of every diary mutation.
    readOnlyVerbGuard(intent, ["read", "explain"], "Diary");

    const userId = requireUserId(context, "Diary");
    const port = await resolvePort();

    if (intent.verb === "read") return handleRead(intent, userId, port);
    return handleExplain(intent, userId, port);
  };
}
