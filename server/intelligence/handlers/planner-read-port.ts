/**
 * Planner Read Port (INT2)
 * ========================
 * The NARROW, read-only delegation surface the Planner capability handler is allowed
 * to call. Every method here is a 1:1 forward to an EXISTING owning-service method —
 * the planner data owner (`server/storage.ts`, SoT D14) and the household authorization
 * owner (`server/lib/household.ts`). This port adds NO planner business logic; it is a
 * typed seam so that:
 *   • the handler delegates (never re-implements) planner reads, and
 *   • tests can inject an in-memory owner to prove delegation without a live database.
 *
 * GOVERNANCE: the Planner remains the authoritative owner of all planner data and
 * business rules (TIP1 Principles 2 & 7). This port only *reads* what the owner exposes;
 * it has no write methods by construction (INT2 is read-only).
 */

import type { PlannerWeek, PlannerDay, PlannerEntry } from "@shared/schema";

/** A meal as the read binding surfaces it — name only, no recipe/business detail. */
export interface PlannerMealRef {
  readonly id: number;
  readonly name: string;
}

/**
 * The read-only owning-service surface. Each method forwards to the existing planner /
 * household owner. No method mutates anything.
 */
export interface PlannerReadPort {
  /** Household-membership owner — resolves the caller's active household (authorization). */
  getHouseholdForUser(userId: number): Promise<number>;
  /** Planner owner — all weeks for the caller (already household-scoped by the owner). */
  getPlannerWeeks(userId: number): Promise<PlannerWeek[]>;
  /** Planner owner — a single week by id (ownership is verified by the caller). */
  getPlannerWeek(id: number): Promise<PlannerWeek | undefined>;
  /** Planner owner — days of a week. */
  getPlannerDays(weekId: number): Promise<PlannerDay[]>;
  /** Planner owner — a single day by id. */
  getPlannerDay(id: number): Promise<PlannerDay | undefined>;
  /** Planner owner — entries of a day. */
  getPlannerEntriesForDay(dayId: number): Promise<PlannerEntry[]>;
  /** Planner owner — all entries of a week. */
  getPlannerEntriesForWeek(weekId: number): Promise<PlannerEntry[]>;
  /** Planner owner — a single entry by id (for explain). */
  getPlannerEntryById(id: number): Promise<PlannerEntry | undefined>;
  /** Meal owner — minimal meal reference (name) for an entry's mealId. */
  getMeal(id: number): Promise<PlannerMealRef | undefined>;
  /**
   * COMP4 — the CANONICAL planner explanation for one entry, or `null` when the
   * owner cannot produce one.
   *
   * This is a delegation, not a computation. The implementation composes the
   * EXISTING owners in the order the Planner itself uses them
   * (`convertMealToCandidate` → `scoreMeal` → `buildPlannerExplanationContext` →
   * `buildPlannerWeekState` → `generateMealExplanation`) and returns what the
   * last one returns, untouched. No sentence is authored on this path, and no
   * scoring or selection rule is re-expressed: the Companion gets the same
   * object the Planner would, because it is produced by the same function.
   *
   * `null` (rather than a thrown error) when the meal row cannot be read, so the
   * handler can state an honest gap instead of a fabricated reason.
   */
  explainPlannerEntry(entryId: number, userId: number): Promise<CanonicalPlannerExplanation | null>;
}

/**
 * The canonical explanation plus the provenance a household is owed with it.
 *
 * `asOf: "current-week"` is not decoration. A planner explanation is computed
 * against the week the meal is joining, and THA does not persist the explanation
 * it gave at suggestion time — there is no table for it, and adding one would be
 * a schema change this work is not permitted to make. So what the Companion can
 * truthfully offer is the explanation for this meal *as the plan stands now*.
 * When the week has changed since, that is a different question with a different
 * true answer, and the field says so rather than implying the answer is historic.
 *
 * `unknownTargets` names the inputs that were genuinely unavailable — the weekly
 * fish, red-meat and budget targets are SmartSuggest REQUEST settings and are
 * never persisted, so they cannot be recovered for a committed entry. The
 * explanation owner renders a dimension silent when its input is missing
 * (Principle 6: silence over invention), so these lines are absent rather than
 * guessed, and the field lets the surface say which.
 */
export interface CanonicalPlannerExplanation {
  readonly explanation: import("../../lib/explainability-service.js").GeneratedMealExplanation;
  readonly asOf: "current-week";
  readonly unknownTargets: readonly string[];
}

/**
 * Build the production port over the real owning services. Imports are DYNAMIC so that
 * loading the Intelligence Platform module (and its tests) never opens a database
 * connection at import time — the owner is only touched on first invocation.
 */
export async function createStoragePlannerReadPort(): Promise<PlannerReadPort> {
  const { storage } = await import("../../storage.js");
  const { getHouseholdForUser } = await import("../../lib/household.js");
  return {
    getHouseholdForUser: (userId) => getHouseholdForUser(userId),
    getPlannerWeeks: (userId) => storage.getPlannerWeeks(userId),
    getPlannerWeek: (id) => storage.getPlannerWeek(id),
    getPlannerDays: (weekId) => storage.getPlannerDays(weekId),
    getPlannerDay: (id) => storage.getPlannerDay(id),
    getPlannerEntriesForDay: (dayId) => storage.getPlannerEntriesForDay(dayId),
    getPlannerEntriesForWeek: (weekId) => storage.getPlannerEntriesForWeek(weekId),
    getPlannerEntryById: (id) => storage.getPlannerEntryById(id),
    getMeal: async (id) => {
      const meal = await storage.getMeal(id);
      return meal ? { id: meal.id, name: meal.name } : undefined;
    },

    // COMP4 — delegate to the canonical explanation owner. Every import here is
    // DYNAMIC for the same reason as the ones above: the Intelligence Platform
    // must not pull the planner stack (or a DB connection) in at import time.
    explainPlannerEntry: async (entryId, userId) => {
      const entry = await storage.getPlannerEntryById(entryId);
      if (!entry) return null;
      const meal = await storage.getMeal(entry.mealId);
      if (!meal) return null;

      const [{ convertMealToCandidate, scoreMeal }, ctxMod, { generateMealExplanation }] =
        await Promise.all([
          import("../../lib/meal-scoring-service.js"),
          import("../../lib/planner-explanation-context.js"),
          import("../../lib/explainability-service.js"),
        ]);

      const prefs = (await storage.getUserPreferences(userId)) ?? null;

      // The OTHER meals in this week — "the plan this meal is joining". The
      // subject is excluded deliberately; see buildPlannerWeekState's contract.
      const day = await storage.getPlannerDay(entry.dayId);
      const siblings = day ? await storage.getPlannerEntriesForWeek(day.weekId) : [];
      const placed = [];
      for (const sib of siblings) {
        if (sib.id === entry.id) continue;
        const sibMeal = await storage.getMeal(sib.mealId);
        if (!sibMeal) continue;
        const c = convertMealToCandidate(sibMeal);
        placed.push({
          ingredients: c.ingredients,
          primaryProtein: c.primaryProtein,
          estimatedCost: c.estimatedCost,
        });
      }

      const candidate = convertMealToCandidate(meal);
      const { score, breakdown } = scoreMeal(candidate, prefs, {});
      const scored = { ...candidate, score, scoreBreakdown: breakdown };

      const context = await ctxMod.buildPlannerExplanationContext(userId);

      // These three are SmartSuggest request settings and are not persisted, so
      // they cannot be recovered for a committed entry. Passing null keeps the
      // dependent dimensions silent rather than inventing a target.
      const week = ctxMod.buildPlannerWeekState(placed, {
        fishTarget: null,
        redMeatTarget: null,
        weeklyBudget: null,
      });

      return {
        explanation: generateMealExplanation(scored, prefs, { context, week }),
        asOf: "current-week" as const,
        unknownTargets: ["fishTarget", "redMeatTarget", "weeklyBudget"],
      };
    },
  };
}
