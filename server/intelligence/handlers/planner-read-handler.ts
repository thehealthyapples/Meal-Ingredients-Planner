/**
 * Planner Read Handler (INT2 — first live capability binding)
 * ==========================================================
 * The FIRST execution handler bound to the THA Intelligence Platform. It makes the
 * `planner` capability *executable* for READ-ONLY intents only, by delegating every
 * read to the existing Planner owner through a {@link PlannerReadPort}.
 *
 * HARD BOUNDARIES (the reason this binding is safe):
 *   • READ-ONLY. Only the "read" and "explain" verbs execute. Any other verb (add,
 *     move, replace, delete, generate, import, share) throws an honest gap — there is
 *     no code path here that writes, plans, generates, or edits anything.
 *   • DELEGATION ONLY. All data comes from the owning service via the port. This file
 *     contains NO planner business rule, NO meal generation, NO selection reasoning of
 *     its own. It orchestrates reads; the Planner remains the owner (TIP1 Principles 2 & 7).
 *   • PERMISSION-AWARE / OWN DATA ONLY. The caller must be an authenticated user, and
 *     every read is scoped to that user's household. Cross-household reads are denied.
 *   • HONEST GAPS. Requests the planner does not own an answer for (e.g. "today's
 *     meals" — the planner has no calendar mapping; a meal with no recorded selection
 *     rationale) return a structured gap, never a fabricated answer (Principle 6).
 *
 * The handler is built by {@link createPlannerReadHandler} with a port provider, so the
 * production binding injects the real owning services and tests inject an in-memory owner.
 */

import {
  type CapabilityHandler,
  type IntelligenceContext,
  type Intent,
} from "../types.js";
import type {
  PlannerReadPort,
  PlannerMealRef,
  CanonicalPlannerExplanation,
} from "./planner-read-port.js";
import { toInt, requireUserId, gap, denied, readOnlyVerbGuard } from "./_read-kit.js";
import type { PlannerWeek } from "@shared/schema";

// ---------------------------------------------------------------------------
// Result shapes (read projections — owned data, surfaced honestly)
// ---------------------------------------------------------------------------

export interface PlannerMealView {
  readonly entryId: number;
  readonly mealType: string;
  readonly audience: string;
  readonly mealId: number;
  /** Resolved from the Meal owner; null if the meal row could not be read. */
  readonly mealName: string | null;
  readonly isDrink: boolean;
}

export interface PlannerDayView {
  readonly dayId: number;
  readonly dayOfWeek: number;
  readonly meals: readonly PlannerMealView[];
}

export interface PlannerWeekReadResult {
  readonly scope: "week";
  readonly weekId: number;
  readonly weekNumber: number;
  readonly weekName: string;
  readonly days: readonly PlannerDayView[];
}

export interface PlannerDayReadResult {
  readonly scope: "day";
  readonly weekId: number;
  readonly weekNumber: number;
  readonly dayId: number;
  readonly dayOfWeek: number;
  readonly meals: readonly PlannerMealView[];
}

export interface PlannerExplainResult {
  readonly entryId: number;
  readonly mealId: number;
  readonly mealName: string | null;
  /**
   * COMP4 — the CANONICAL planner explanation, produced by
   * `explainability-service.ts`, the same owner the Planner UI reads. The
   * sentences here are byte-identical to the ones the Planner would show for
   * this meal against this week, because they come from the same function call.
   * Null when the owner could not produce one.
   */
  readonly explanation: CanonicalPlannerExplanation["explanation"] | null;
  /** Provenance for `explanation` — see CanonicalPlannerExplanation. */
  readonly asOf: "current-week" | null;
  /** Inputs that were genuinely unavailable, so their dimensions stayed silent. */
  readonly unknownTargets: readonly string[];
  /**
   * The household-adaptation reasoning, when the user tailored this meal. This
   * is a DIFFERENT fact from `explanation` — it is what changed for the
   * household, not why the meal was selected — so it is reported beside the
   * explanation under its own name rather than being blended into it.
   */
  readonly rationale: unknown;
  /**
   * Which owners actually spoke. Named per fact so a reader can never mistake
   * an adaptation note for a selection explanation.
   */
  readonly sources: readonly ("planner-explanation-service" | "planner-household-adaptation")[];
}

// ---------------------------------------------------------------------------
// Ownership resolution (delegated authorization — own household only)
// ---------------------------------------------------------------------------

/**
 * Resolve a week the caller is allowed to read, by id or by week-number, scoped to the
 * caller's household. Any week outside the caller's household is reported as not-found
 * (denied) — no cross-household read, and no existence leak.
 */
async function resolveOwnedWeek(
  params: Readonly<Record<string, unknown>>,
  userId: number,
  port: PlannerReadPort,
): Promise<PlannerWeek> {
  const householdId = await port.getHouseholdForUser(userId);

  const weekId = toInt(params.weekId);
  const weekNumber = toInt(params.weekNumber);

  let week: PlannerWeek | undefined;
  if (weekId !== undefined) {
    week = await port.getPlannerWeek(weekId);
  } else if (weekNumber !== undefined) {
    // getPlannerWeeks is already household-scoped by the owner.
    const weeks = await port.getPlannerWeeks(userId);
    week = weeks.find((w) => w.weekNumber === weekNumber);
  } else {
    throw gap(
      'Reading a planner week needs an identifier: pass { scope: "week", weekId } or ' +
        '{ scope: "week", weekNumber }.',
    );
  }

  if (!week || week.householdId !== householdId) {
    throw denied("Planner week not found in your planner (no cross-household access).");
  }
  return week;
}

// ---------------------------------------------------------------------------
// Read projections
// ---------------------------------------------------------------------------

async function mealViewsForDay(
  dayId: number,
  port: PlannerReadPort,
): Promise<PlannerMealView[]> {
  const entries = await port.getPlannerEntriesForDay(dayId);
  const meals = await Promise.all(
    entries.map(async (e): Promise<PlannerMealView> => {
      let mealRef: PlannerMealRef | undefined;
      try {
        mealRef = await port.getMeal(e.mealId);
      } catch {
        mealRef = undefined;
      }
      return {
        entryId: e.id,
        mealType: e.mealType,
        audience: e.audience,
        mealId: e.mealId,
        mealName: mealRef?.name ?? null,
        isDrink: e.isDrink,
      };
    }),
  );
  return meals;
}

async function readWeek(
  params: Readonly<Record<string, unknown>>,
  userId: number,
  port: PlannerReadPort,
): Promise<PlannerWeekReadResult> {
  const week = await resolveOwnedWeek(params, userId, port);
  const days = await port.getPlannerDays(week.id);
  const dayViews = await Promise.all(
    days.map(async (d): Promise<PlannerDayView> => ({
      dayId: d.id,
      dayOfWeek: d.dayOfWeek,
      meals: await mealViewsForDay(d.id, port),
    })),
  );
  return {
    scope: "week",
    weekId: week.id,
    weekNumber: week.weekNumber,
    weekName: week.weekName,
    days: dayViews,
  };
}

async function readDay(
  params: Readonly<Record<string, unknown>>,
  userId: number,
  port: PlannerReadPort,
): Promise<PlannerDayReadResult> {
  const householdId = await port.getHouseholdForUser(userId);
  const dayId = toInt(params.dayId);
  const dayOfWeek = toInt(params.dayOfWeek);

  let day = dayId !== undefined ? await port.getPlannerDay(dayId) : undefined;

  if (!day) {
    // Resolve via week + dayOfWeek when no direct dayId was given.
    if (dayOfWeek === undefined) {
      throw gap(
        'Reading a planner day needs { scope: "day", dayId } or ' +
          '{ scope: "day", weekId|weekNumber, dayOfWeek }.',
      );
    }
    const week = await resolveOwnedWeek(params, userId, port);
    const days = await port.getPlannerDays(week.id);
    day = days.find((d) => d.dayOfWeek === dayOfWeek);
    if (!day) throw denied("Planner day not found in your planner.");
  }

  // Verify ownership of the resolved day via its week → household.
  const week = await port.getPlannerWeek(day.weekId);
  if (!week || week.householdId !== householdId) {
    throw denied("Planner day not found in your planner (no cross-household access).");
  }

  return {
    scope: "day",
    weekId: week.id,
    weekNumber: week.weekNumber,
    dayId: day.id,
    dayOfWeek: day.dayOfWeek,
    meals: await mealViewsForDay(day.id, port),
  };
}

/**
 * Explain why a meal was selected — using EXISTING planner intelligence only.
 *
 * COMP4. Before this, the only per-entry reasoning reachable here was the
 * household-adaptation result, recorded solely when a user tapped "Tailor for
 * household". Every ordinarily-planned meal therefore gapped, while the
 * Planner's own screen had a full cited evidence trail from
 * `explainability-service.ts` that no conversational path could reach — so the
 * Companion answered "why this meal?" from the language model instead, reasoning
 * over the plan's CONTENTS. That is precisely the fabrication the honest-gap
 * machinery exists to prevent, and it was being reached around.
 *
 * This now asks the canonical owner first, through the port, and reports the
 * adaptation note BESIDE it as the separate fact it is. Nothing is authored
 * here: this function chooses which owners to ask and states honestly when none
 * of them can answer. It contains no planner rule of its own, exactly as the
 * file header requires.
 */
async function explainSelection(
  intent: Intent,
  userId: number,
  port: PlannerReadPort,
): Promise<PlannerExplainResult> {
  const params = intent.parameters ?? {};
  const entryId = toInt(params.entryId);
  if (entryId === undefined) {
    throw gap('Explaining a meal needs { entryId } — the planner entry to explain.');
  }

  const householdId = await port.getHouseholdForUser(userId);
  const entry = await port.getPlannerEntryById(entryId);
  if (!entry) throw denied("Planner entry not found in your planner.");

  // Ownership: entry → day → week → household.
  const day = await port.getPlannerDay(entry.dayId);
  const week = day ? await port.getPlannerWeek(day.weekId) : undefined;
  if (!week || week.householdId !== householdId) {
    throw denied("Planner entry not found in your planner (no cross-household access).");
  }

  const rationale = (entry as { adaptationResult?: unknown }).adaptationResult ?? null;

  // Ask the canonical explanation owner. A failure here must not be dressed up
  // as "no reasoning exists" — that would be a different, false statement — so
  // it degrades to null and is reported as an honest gap below.
  let canonical: CanonicalPlannerExplanation | null = null;
  try {
    canonical = await port.explainPlannerEntry(entry.id, userId);
  } catch {
    canonical = null;
  }

  if (canonical === null && rationale === null) {
    throw gap(
      "Honest gap: the Planner cannot produce reasoning for this meal right now — its " +
        "meal record could not be read, and no household-adaptation note was recorded " +
        "for it. The Intelligence Platform will not fabricate one.",
    );
  }

  let mealRef: PlannerMealRef | undefined;
  try {
    mealRef = await port.getMeal(entry.mealId);
  } catch {
    mealRef = undefined;
  }

  const sources: PlannerExplainResult["sources"] = [
    ...(canonical !== null ? (["planner-explanation-service"] as const) : []),
    ...(rationale !== null ? (["planner-household-adaptation"] as const) : []),
  ];

  return {
    entryId: entry.id,
    mealId: entry.mealId,
    mealName: mealRef?.name ?? null,
    explanation: canonical?.explanation ?? null,
    asOf: canonical?.asOf ?? null,
    unknownTargets: canonical?.unknownTargets ?? [],
    rationale,
    sources,
  };
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

/** The read scopes the planner read binding understands. */
type ReadScope = "today" | "week" | "day";

async function handleRead(
  intent: Intent,
  userId: number,
  port: PlannerReadPort,
): Promise<unknown> {
  const params = intent.parameters ?? {};
  const scope = params.scope as ReadScope | undefined;

  switch (scope) {
    case "week":
      return readWeek(params, userId, port);
    case "day":
      return readDay(params, userId, port);
    case "today":
      // The planner is organised by week-number × day-of-week and owns NO calendar
      // mapping, so "today" cannot be resolved to a planner slot. Honest gap (Principle 6).
      throw gap(
        'Honest gap: the Planner is organised by week-number and day-of-week and owns no ' +
          'calendar mapping, so "today" cannot be resolved to a planner slot. Read an ' +
          'explicit week or day instead: { scope: "week", weekNumber|weekId } or ' +
          '{ scope: "day", weekId|weekNumber, dayOfWeek }.',
      );
    default:
      throw gap(
        `Unsupported planner read scope ${JSON.stringify(scope)}. Supported read scopes: ` +
          '"week" (weekId|weekNumber) and "day" (dayId, or weekId|weekNumber + dayOfWeek). ' +
          '"today" is an honest gap (the planner owns no calendar mapping).',
      );
  }
}

/**
 * Create the planner read-only handler. `resolvePort` provides the owning-service surface
 * (production: real storage/household; tests: in-memory owner). The returned handler is
 * what the Capability Registry binds to the `planner` capability (INT2).
 */
export function createPlannerReadHandler(
  resolvePort: () => Promise<PlannerReadPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    // Read-only binding: only "read" and "explain" execute. Everything else is an
    // honest gap — the Planner remains the owner of all write/plan/generate operations,
    // none of which are bound to the platform in INT2.
    readOnlyVerbGuard(intent, ["read", "explain"], "Planner");

    const userId = requireUserId(context, "Planner");
    const port = await resolvePort();

    if (intent.verb === "read") return handleRead(intent, userId, port);
    return explainSelection(intent, userId, port);
  };
}
