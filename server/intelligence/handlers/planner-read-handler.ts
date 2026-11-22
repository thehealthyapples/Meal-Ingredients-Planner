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
 *   • HONEST GAPS. Calendar reads need an exact dated week anchor; old null-dated
 *     weeks cannot be assigned calendar meaning. Requests without a usable anchor
 *     (or a meal with no recorded selection rationale) return a structured gap,
 *     never a fabricated answer (Principle 6).
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
import { parseCivilDate, addCivilDays, formatCivilDate, DAY_NAMES, householdDayOfWeek } from "@shared/time/household-time";
import { analyzePlannerIngredient, type PlannerIngredientAnalysis } from "./planner-ingredient-analysis.js";

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
  /**
   * 2026-11-06 (owner) — the meal's own ingredient lines (e.g. "1.2 kg
   * Chicken"), straight from the Meal owner, empty if the row couldn't be
   * read. See PlannerMealRef's doc comment (planner-read-port.ts) for why
   * this exists: without it, a question like "how much chicken is on my
   * planner this week?" had no real data to answer from at all.
   */
  readonly ingredients: readonly string[];
  /** The entry's own stored calorie figure (planner_entries.calories), null if never set. */
  readonly calories: number | null;
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
  /**
   * 2026-11-06 (owner) — the Monday this week means (`planner_weeks.week_start_date`),
   * or null for a legacy week THA was never told a date for (HT7). Without this,
   * "what's on my planner last/next week?" could resolve the *correct* week but never
   * SAY which calendar week it read — a household asking about "next week" has no way
   * to confirm the answer matches what they meant.
   */
  readonly weekStartDate: string | null;
  readonly days: readonly PlannerDayView[];
  /** Present only for an utterance-scoped ingredient quantity request. */
  readonly ingredientAnalysis?: PlannerIngredientAnalysis;
  /**
   * Absent when `ingredientAnalysis` is present — an ingredient-quantity question ("how
   * much chicken is on my planner this week?") needs THAT answer, not a day-by-day meal
   * listing; the conversation gateway's short-circuit would otherwise speak whichever
   * field it finds first and ignore the one the caller actually asked about.
   *
   * COMP-DET3 (2026-11-21) — PL-023 ("What's on my meal plan this week?") live-caught a
   * real generation failure: the LLM was handed the complete, correct week data (every
   * day, including a day with a planned dinner) and still only reported one day's meal,
   * claiming it "can't see the meals for other days" — a model-synthesis miss, not a data
   * or truncation bug (verified: the full JSON was well under the per-capability context
   * budget). The week's day/meal list is fully enumerable and already source-gated by the
   * owner, so — same as meals/pantry/shopping/profile before it — build the answer in code
   * and let the conversation gateway's short-circuit speak it verbatim instead of trusting
   * the model to enumerate a short list correctly.
   */
  readonly deterministicAnswer?: string;
}

/**
 * COMP-DET3 — `PlannerDayView.dayOfWeek` is WEEK-RELATIVE (0 = the week's own first day,
 * per `WEEK_STARTS_ON` = Monday in household-time.ts), NOT an absolute Sun=0..Sat=6
 * calendar index. Live-caught by the judge on the very first run of this feature: with
 * `weekStartDate` a Monday, `dayOfWeek: 0` is that Monday and `dayOfWeek: 1` is Tuesday —
 * indexing `DAY_NAMES` directly by the raw `dayOfWeek` (treating 0 as Sunday) mislabelled
 * every single day. Anchor to the real calendar date instead: `weekStartDate` IS day 0,
 * so `addCivilDays(weekStartDate, dayOfWeek)` gives the day's true date, and ONLY that
 * date's `householdDayOfWeek()` may index `DAY_NAMES`. Undated (legacy) weeks have no
 * real date to anchor to, so they get an honest ordinal ("Day 1", "Day 2"...) instead of
 * a guessed calendar name.
 */
function plannerDayLabel(weekStartDate: string | null, dayOfWeek: number): string {
  if (weekStartDate == null) return `Day ${dayOfWeek + 1}`;
  const anchor = parseCivilDate(weekStartDate);
  if (anchor == null) return `Day ${dayOfWeek + 1}`;
  const realDate = addCivilDays(anchor, dayOfWeek);
  return DAY_NAMES[householdDayOfWeek(realDate)] ?? `Day ${dayOfWeek + 1}`;
}

/** COMP-DET3 — every day with at least one meal, in order; days with none are omitted
 *  rather than listed as "nothing planned" (keeps the answer to what's actually there). */
function buildPlannerWeekDeterministicAnswer(week: {
  weekName: string;
  weekStartDate: string | null;
  days: readonly PlannerDayView[];
}): string {
  const weekLabel = week.weekStartDate ? `${week.weekName} (starting ${week.weekStartDate})` : week.weekName;
  const daysWithMeals = week.days.filter((d) => d.meals.length > 0);

  if (daysWithMeals.length === 0) {
    return `${weekLabel} has no meals planned yet.`;
  }

  const dayLines = daysWithMeals.map((d) => {
    const dayName = plannerDayLabel(week.weekStartDate, d.dayOfWeek);
    const meals = d.meals
      .map((m) => `${m.mealType}${m.mealName ? ` – ${m.mealName}` : " (unnamed meal)"}`)
      .join(", ");
    return `${dayName}: ${meals}`;
  });

  const plannedCount = daysWithMeals.length;
  const totalDays = week.days.length;
  const coverageNote =
    plannedCount < totalDays
      ? ` No meals are planned for the other ${totalDays - plannedCount} day${totalDays - plannedCount === 1 ? "" : "s"} this week.`
      : "";

  return `For ${weekLabel}: ${dayLines.join("; ")}.${coverageNote}`;
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
/**
 * 2026-11-06 (owner) — "previous"/"next" step the ANCHOR week (`weekId`, normally the
 * week on screen) by seven calendar days and look up the week that lands on, exactly
 * mirroring the Planner UI's own `goToAdjacentWeek` (weekly-planner-page.tsx): dated
 * navigation steps `weekStartDate`, never `weekNumber` — weekNumber is "a stable,
 * unbounded, per-household ORDINAL — NOT a time coordinate" (shared/schema.ts), so
 * `weekNumber + 1` is not necessarily the following calendar week. Unlike the UI, this
 * read-only binding never CREATES the target week — a missing one is an honest gap.
 */
async function resolveAdjacentWeek(
  weekId: number,
  direction: "previous" | "next",
  householdId: number,
  userId: number,
  port: PlannerReadPort,
): Promise<PlannerWeek> {
  const anchor = await port.getPlannerWeek(weekId);
  if (!anchor || anchor.householdId !== householdId) {
    throw denied("Planner week not found in your planner (no cross-household access).");
  }
  const anchorDate = parseCivilDate(anchor.weekStartDate);
  if (!anchorDate) {
    throw gap(
      `Honest gap: "${anchor.weekName}" has no calendar date recorded, so THA cannot step to the ` +
        `${direction === "previous" ? "week before" : "week after"} it — open the Planner and ` +
        "navigate there directly instead.",
    );
  }
  const targetDate = formatCivilDate(addCivilDays(anchorDate, direction === "previous" ? -7 : 7));
  const weeks = await port.getPlannerWeeks(userId);
  const week = weeks.find((w) => w.weekStartDate === targetDate);
  if (!week) {
    throw gap(
      `Honest gap: no planner week is recorded for the week starting ${targetDate}. ` +
        "THA will not fabricate one — open the Planner and navigate there to create it.",
    );
  }
  return week;
}

async function resolveOwnedWeek(
  params: Readonly<Record<string, unknown>>,
  userId: number,
  port: PlannerReadPort,
): Promise<PlannerWeek> {
  const householdId = await port.getHouseholdForUser(userId);

  const weekId = toInt(params.weekId);
  const weekNumber = toInt(params.weekNumber);
  const requestedWeekStartDate = parseCivilDate(params.weekStartDate);
  const direction = params.direction === "previous" || params.direction === "next" ? params.direction : undefined;

  if (direction) {
    if (weekId === undefined) {
      throw gap(
        `Reading the ${direction === "previous" ? "previous" : "next"} week needs an active planner ` +
          "week to step from — open the Planner so THA knows which week is on screen, then ask again.",
      );
    }
    return resolveAdjacentWeek(weekId, direction, householdId, userId, port);
  }

  let week: PlannerWeek | undefined;
  if (weekId !== undefined) {
    week = await port.getPlannerWeek(weekId);
  } else if (weekNumber !== undefined) {
    // getPlannerWeeks is already household-scoped by the owner.
    const weeks = await port.getPlannerWeeks(userId);
    week = weeks.find((w) => w.weekNumber === weekNumber);
  } else if (requestedWeekStartDate) {
    const requestedDate = formatCivilDate(requestedWeekStartDate);
    const weeks = await port.getPlannerWeeks(userId);
    const matches = weeks.filter((candidate) => candidate.weekStartDate === requestedDate);
    if (matches.length !== 1) {
      throw gap(
        `Honest gap: expected one dated planner week starting ${requestedDate}, found ${matches.length}. ` +
          "THA will not select an undated or ambiguous week.",
      );
    }
    week = matches[0];
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
        ingredients: mealRef?.ingredients ?? [],
        calories: e.calories ?? null,
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
  const ingredientQuery = typeof params.ingredientQuery === "string"
    ? params.ingredientQuery.trim()
    : "";
  return {
    scope: "week",
    weekId: week.id,
    weekNumber: week.weekNumber,
    weekName: week.weekName,
    weekStartDate: week.weekStartDate ?? null,
    days: dayViews,
    ...(ingredientQuery
      ? { ingredientAnalysis: analyzePlannerIngredient(dayViews, ingredientQuery) }
      : {
          deterministicAnswer: buildPlannerWeekDeterministicAnswer({
            weekName: week.weekName,
            weekStartDate: week.weekStartDate ?? null,
            days: dayViews,
          }),
        }),
  };
}

/**
 * 2026-11-22 — `resolveOwnedWeek` requires an explicit identifier (weekId,
 * weekNumber, weekStartDate, or a direction to step from an anchor) and gaps
 * honestly when given none — correct for every OTHER read scope, which always
 * carries one (surface hints supply `activePlannerWeekId` when a Planner
 * screen is open). The diet audit is the first scope a household can
 * reasonably ask about with NO identifier at all ("is there anything on this
 * week's planner that conflicts with our diet?" from the floating Companion,
 * no Planner screen open). Falls back to the ONE canonical "which week is
 * 'this week'?" resolver (household-planner-week.ts, CONV1 P8 / HT1) rather
 * than guessing a week itself — an unanchored household still gets an honest
 * gap, never a fabricated "current" week (HT6).
 */
async function resolveWeekForAuditDiet(
  params: Readonly<Record<string, unknown>>,
  userId: number,
  port: PlannerReadPort,
): Promise<PlannerWeek> {
  const hasExplicitIdentifier =
    toInt(params.weekId) !== undefined ||
    toInt(params.weekNumber) !== undefined ||
    parseCivilDate(params.weekStartDate) != null ||
    params.direction === "previous" ||
    params.direction === "next";

  if (hasExplicitIdentifier) {
    return resolveOwnedWeek(params, userId, port);
  }

  const weeks = await port.getPlannerWeeks(userId);
  const { resolveHouseholdPlannerWeek } = await import("../../lib/household-planner-week.js");
  const resolution = await resolveHouseholdPlannerWeek(userId, weeks);
  if (!resolution.anchored) {
    throw gap(
      `Honest gap: THA cannot tell which planner week is "this week" for your household yet ` +
        `(reason: ${resolution.reason}). Open the Planner and ask about a specific week, or ask ` +
        'again with { scope: "diet-audit", weekNumber } once you know which one you mean.',
    );
  }
  return resolution.week;
}

export interface PlannerDietConflictItem {
  /** The meal name OR a single ingredient line that conflicted. */
  readonly item: string;
  readonly explanation: string;
}

export interface PlannerDietConflict {
  readonly dayOfWeek: number;
  readonly dayLabel: string;
  readonly mealType: string;
  readonly mealId: number;
  readonly mealName: string | null;
  /** Every conflicting item (meal name and/or individual ingredients), each
   *  with its own full explanation — for a UI that wants the detail. */
  readonly conflicts: readonly PlannerDietConflictItem[];
  /** 2026-11-22 — ONE sentence for this meal, aggregated across every
   *  conflicting item rather than repeating the same "conflicts with Colin's
   *  Vegetarian diet" sentence once per ingredient (live-caught: a 7-
   *  ingredient meal produced 7 near-duplicate sentences, unreadable as a
   *  spoken answer). This is what `deterministicAnswer` is built from. */
  readonly summary: string;
}

export interface PlannerDietAuditResult {
  readonly scope: "diet-audit";
  readonly weekId: number;
  readonly weekNumber: number;
  readonly weekName: string;
  readonly weekStartDate: string | null;
  readonly totalMeals: number;
  readonly conflictCount: number;
  readonly conflicts: readonly PlannerDietConflict[];
  readonly deterministicAnswer: string;
}

/**
 * Check every meal (name + ingredients) in a planner week against the
 * household's declared diet patterns and hard restrictions — the Planner
 * counterpart of nutrition-knowledge's "can I eat X" check, reusing the SAME
 * reusable service (`nutrition-diet-compatibility.ts`) rather than a second
 * implementation. Drinks are skipped: a drink's "ingredients" are a drink
 * type, not a food composition this check can reason about.
 *
 * Resolves the household dietary context ONCE (not per meal/ingredient) —
 * see nutrition-diet-compatibility.ts's file header for why.
 */
async function auditWeekDiet(
  params: Readonly<Record<string, unknown>>,
  userId: number,
  port: PlannerReadPort,
): Promise<PlannerDietAuditResult> {
  const week = await resolveWeekForAuditDiet(params, userId, port);
  const days = await port.getPlannerDays(week.id);
  const dayOfWeekById = new Map(days.map((d) => [d.id, d.dayOfWeek]));

  const entries = await port.getPlannerEntriesForWeek(week.id);

  const { resolveHouseholdDietContext, checkFoodCompatibilityWithContext } =
    await import("./nutrition-diet-compatibility.js");
  const dietContext = await resolveHouseholdDietContext(userId);

  const conflicts: PlannerDietConflict[] = [];
  // See the grouping step below `conflicts.push(...)` for why this is keyed
  // by name + reason rather than reusing `conflicts` or `mealId` directly.
  const spokenGroupKeys: { key: string; mealName: string | null; dayLabel: string; mealType: string; reasonTail: string; culpritNote: string }[] = [];
  let totalMeals = 0;

  for (const entry of entries) {
    if (entry.isDrink) continue;
    totalMeals++;

    let mealRef: PlannerMealRef | undefined;
    try {
      mealRef = await port.getMeal(entry.mealId);
    } catch {
      mealRef = undefined;
    }
    // Honest gap per-item: a meal row that cannot be read is silently excluded
    // from the audit rather than reported as either conflicting or clear —
    // neither would be true.
    if (!mealRef) continue;

    const seen = new Set<string>();
    const conflictItems: PlannerDietConflictItem[] = [];
    // Aggregated across every conflicting item in this meal, so the meal gets
    // ONE summary sentence rather than one near-duplicate per ingredient.
    const patternsByMember = new Map<string, Set<string>>();
    const restrictionNames = new Set<string>();
    const culprits: string[] = [];

    for (const item of [mealRef.name, ...mealRef.ingredients]) {
      const key = item?.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const compat = checkFoodCompatibilityWithContext(item, dietContext);
      if (compat.compatible) continue;

      conflictItems.push({ item, explanation: compat.explanation });
      culprits.push(item);
      for (const r of compat.conflictingRestrictions) restrictionNames.add(r);
      for (const m of compat.members) {
        if (m.conflictingDietPatterns.length === 0) continue;
        const patterns = patternsByMember.get(m.displayName) ?? new Set<string>();
        for (const p of m.conflictingDietPatterns) patterns.add(p);
        patternsByMember.set(m.displayName, patterns);
      }
    }

    if (conflictItems.length > 0) {
      const dayOfWeek = dayOfWeekById.get(entry.dayId) ?? -1;
      const dayLabel = plannerDayLabel(week.weekStartDate ?? null, dayOfWeek);
      const dayMeal = `${dayLabel} ${entry.mealType}${mealRef.name ? ` (${mealRef.name})` : ""}`;

      const clauses: string[] = [];
      if (restrictionNames.size > 0) {
        clauses.push(`your household's ${Array.from(restrictionNames).join(", ")} requirements`);
      }
      const memberClauses = Array.from(patternsByMember.entries()).map(
        ([name, patterns]) => `${name}'s ${Array.from(patterns).join(", ")} diet`,
      );
      if (memberClauses.length > 0) clauses.push(memberClauses.join(" and "));
      const reasonTail = clauses.join(" and ");

      const culpritNote =
        culprits.length > 0 ? ` (${culprits.slice(0, 3).join(", ")}${culprits.length > 3 ? ", …" : ""})` : "";
      const summary = `${dayMeal} conflicts with ${reasonTail}${culpritNote}.`;

      conflicts.push({
        dayOfWeek,
        dayLabel,
        mealType: entry.mealType,
        mealId: entry.mealId,
        mealName: mealRef.name,
        conflicts: conflictItems,
        summary,
      });
      // Grouping key for the SPOKEN answer only — see below. A different planner
      // entry pointing at a DIFFERENT mealId (a duplicated copy of the same
      // recipe, live-caught: "My Big Fat Greek Salad" planned five separate
      // times, five different mealIds) still reads as "the same meal" to a
      // household asking this question; `mealId` alone under-merged it.
      spokenGroupKeys.push({
        key: `${mealRef.name ?? ""}\0${reasonTail}`,
        mealName: mealRef.name,
        dayLabel,
        mealType: entry.mealType,
        reasonTail,
        culpritNote,
      });
    }
  }

  const weekLabel = week.weekStartDate ? `${week.weekName} (starting ${week.weekStartDate})` : week.weekName;
  // 2026-11-22 (owner-reported, twice) — a meal planned on more than one day
  // produced one near-identical summary sentence per OCCURRENCE. First fix
  // grouped by `mealId`, which under-merges duplicated planner entries (same
  // recipe, re-added as a new row each time rather than reusing one entry) —
  // "My Big Fat Greek Salad" planned on five different days stayed five
  // separate sentences because each had its own mealId. Grouping by NAME +
  // the reason it conflicts (what a household actually perceives as "the same
  // thing", not an internal foreign key) merges both cases correctly: the same
  // mealId reused across days, AND the same recipe duplicated as separate rows.
  // `conflicts` (the structured, per-day list) is unaffected either way — this
  // only changes the SPOKEN sentence.
  const bySpokenMeal = new Map<
    string,
    { mealName: string | null; occurrences: { dayLabel: string; mealType: string }[]; reasonTail: string; culpritNote: string }
  >();
  for (const g of spokenGroupKeys) {
    const existing = bySpokenMeal.get(g.key);
    if (existing) {
      existing.occurrences.push({ dayLabel: g.dayLabel, mealType: g.mealType });
    } else {
      bySpokenMeal.set(g.key, {
        mealName: g.mealName,
        occurrences: [{ dayLabel: g.dayLabel, mealType: g.mealType }],
        reasonTail: g.reasonTail,
        culpritNote: g.culpritNote,
      });
    }
  }
  // 2026-11-22 (owner-reported) — "every day this week" (7 occurrences) still
  // enumerated "Monday lunch and Tuesday lunch and Wednesday lunch and…" —
  // technically one sentence per the fix above, but unreadable at that length.
  // Past a small count, collapse to a frequency phrase instead of listing each
  // occurrence; naming every single day only helps when there are few of them.
  const OCCURRENCE_LIST_LIMIT = 3;
  const groupedSummaries = Array.from(bySpokenMeal.values()).map((g) => {
    let when: string;
    if (g.occurrences.length <= OCCURRENCE_LIST_LIMIT) {
      when = g.occurrences.map((o) => `${o.dayLabel} ${o.mealType}`).join(" and ");
    } else {
      const mealTypes = new Set(g.occurrences.map((o) => o.mealType));
      when =
        mealTypes.size === 1
          ? `${[...mealTypes][0]} on ${g.occurrences.length} days this week`
          : `${g.occurrences.length} times this week`;
    }
    return `${when}${g.mealName ? ` (${g.mealName})` : ""} conflicts with ${g.reasonTail}${g.culpritNote}.`;
  });

  // Cap the SPOKEN sentence at a readable length; `conflicts` (the full structured
  // list) is unaffected — a UI that wants every meal still gets all of them.
  const SPOKEN_CONFLICT_LIMIT = 5;
  const shown = groupedSummaries.slice(0, SPOKEN_CONFLICT_LIMIT);
  const remaining = groupedSummaries.length - shown.length;
  const deterministicAnswer =
    conflicts.length === 0
      ? `No dietary conflicts found on ${weekLabel}'s planner — all ${totalMeals} meal${totalMeals === 1 ? "" : "s"} fit your household's declared diets and restrictions.`
      : `${groupedSummaries.length} meal${groupedSummaries.length === 1 ? "" : "s"} on ${weekLabel} may conflict with your household's dietary requirements. ` +
        shown.join(" ") +
        (remaining > 0 ? ` …and ${remaining} more meal${remaining === 1 ? "" : "s"} this week.` : "");

  return {
    scope: "diet-audit",
    weekId: week.id,
    weekNumber: week.weekNumber,
    weekName: week.weekName,
    weekStartDate: week.weekStartDate ?? null,
    totalMeals,
    conflictCount: conflicts.length,
    conflicts,
    deterministicAnswer,
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
          '{ scope: "day", weekId|weekNumber|weekStartDate, dayOfWeek }.',
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
type ReadScope = "today" | "week" | "day" | "diet-audit";

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
    case "diet-audit":
      return auditWeekDiet(params, userId, port);
    case "today":
      // A raw "today" intent has no verified dated Planner week attached. Callers with
      // an authoritative civil date may use scope "day" + weekStartDate; this scope
      // remains an honest gap instead of inferring an ordinal week.
      throw gap(
        'Honest gap: no dated Planner week was supplied, so "today" cannot be resolved ' +
          'to a planner slot. Read an ' +
          'explicit week or day instead: { scope: "week", weekNumber|weekId } or ' +
          '{ scope: "day", weekId|weekNumber|weekStartDate, dayOfWeek }.',
      );
    default:
      throw gap(
        `Unsupported planner read scope ${JSON.stringify(scope)}. Supported read scopes: ` +
          '"week" (weekId|weekNumber) and "day" (dayId, or weekId|weekNumber|weekStartDate + dayOfWeek), ' +
          '"diet-audit" (optional weekId|weekNumber; defaults to "this week" when resolvable). ' +
          '"today" requires a dated weekStartDate in a "day" read; no ordinal fallback is made.',
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
