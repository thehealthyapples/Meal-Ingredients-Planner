/**
 * planner-composition.ts
 * =====================
 *
 * COMP4A2 — Planner Service Progressive Knowledge Composition
 *
 * When a planner query returns an honest gap (empty week, no matching meal),
 * this module progressively searches for related context:
 *
 *   1. Requested context (full week when a day is requested, full day when empty)
 *   2. Widened planner context (other weeks with similar meals)
 *   3. Cookbook context (related meals in user's saved recipes)
 *   4. Household context (explain composition and constraints)
 *   5. Return honest gap if no enrichment found
 *
 * Each step is a pure function returning EnrichedContext or null.
 * Stops at the first successful enrichment (by default).
 */

import type {
  ProgressiveSearchStep,
  ServiceCompositionContext,
  EnrichedContext,
  PlannerEntry,
  CookbookMeal,
} from "../conversation/business-service-composition-registry.js";

// ---------------------------------------------------------------------------
// Step 1: Requested Planner Context
// ---------------------------------------------------------------------------

/**
 * Step 1 — Check if there's data in the requested scope but not the specific query.
 * E.g., "what's on Monday?" when the full week has meals but Monday is empty.
 */
export const plannerCompositionStep1RequestedContext: ProgressiveSearchStep = {
  label: "Requested planner context",

  search: async (ctx: ServiceCompositionContext): Promise<EnrichedContext | null> => {
    // Only applies to planner queries with scope hints
    const intent = ctx.intent as any; // TypeScript limitation; would be PlannerIntent in real code
    if (!intent.parameters) {
      return null;
    }

    const { scope, weekId, dayOfWeek } = intent.parameters;

    // Step 1 is primarily a fallthrough - the primary query already checked this
    // This step would trigger if there's partial data (e.g., week has some meals but not all days)
    // For now, return null to let other steps try to enrich
    return null;
  },
};

// ---------------------------------------------------------------------------
// Step 2: Widened Planner Context
// ---------------------------------------------------------------------------

/**
 * Step 2 — Search other weeks for meal patterns and history.
 * Shows the user what they've planned in adjacent or recent weeks.
 */
export const plannerCompositionStep2WidenedContext: ProgressiveSearchStep = {
  label: "Widened planner context (other weeks)",

  search: async (ctx: ServiceCompositionContext): Promise<EnrichedContext | null> => {
    const intent = ctx.intent as any;
    const weekId = intent.parameters?.weekId;

    if (weekId === undefined) return null;

    // Get all weeks with any planner data
    const allWeeks = await ctx.storage.getPlannerWeeks();
    if (!allWeeks || allWeeks.length === 0) return null;

    // Get entries for current week to check if it's really empty
    const currentWeekEntries = await ctx.storage.getPlannerEntries(undefined); // Get all entries

    // Find other weeks with meals
    let otherWeeksWithMeals = 0;
    for (const week of allWeeks) {
      if ((week as any).id !== weekId) {
        const entries = await ctx.storage.getPlannerEntries((week as any).weekNumber);
        if (entries && entries.length > 0) {
          otherWeeksWithMeals++;
        }
      }
    }

    if (otherWeeksWithMeals === 0) return null;

    // Build a simple summary
    const currentWeek = allWeeks.find((w: any) => w.id === weekId);
    const weekNumber = (currentWeek as any)?.weekNumber || '(current)';

    return {
      tier: 2,
      presentationMode: "related",
      content: `You have meals planned in other weeks. Would you like to see your planner for a different week to find patterns and ideas?`,
      data: {
        requestedWeekId: weekId,
        otherWeeksCount: otherWeeksWithMeals,
      },
    };
  },
};

// ---------------------------------------------------------------------------
// Step 3: Cookbook Context
// ---------------------------------------------------------------------------

/**
 * Step 3 — Search user's cookbook for related meals.
 * Extract keywords from the original utterance and find similar recipes.
 */
export const plannerCompositionStep3CookbookContext: ProgressiveSearchStep = {
  label: "Related cookbook meals",

  search: async (ctx: ServiceCompositionContext): Promise<EnrichedContext | null> => {
    // Extract search keywords from utterance
    const keywords = extractPlannerKeywords(ctx.utterance);

    // Search cookbook for related meals (search all if no keywords)
    const cookbookMeals = await ctx.storage.getCookbookMeals(
      keywords.length > 0 ? keywords.join(" ") : ""
    );
    if (!cookbookMeals || cookbookMeals.length === 0) return null;

    // Limit to top 3 most relevant
    const topMeals = cookbookMeals.slice(0, 3);
    const mealNames = topMeals.map((m: any) => m.name || '(untitled meal)').join(", ");

    return {
      tier: 2,
      presentationMode: "suggestion",
      content: `You have ${cookbookMeals.length} saved meals in your cookbook. Here are a few: ${mealNames}. Would you like to add any to your plan?`,
      data: {
        topMeals,
        searchKeywords: keywords,
      },
    };
  },
};

// ---------------------------------------------------------------------------
// Step 4: Household Context
// ---------------------------------------------------------------------------

/**
 * Step 4 — Explain household composition and planning constraints.
 * Contextualizes planner decisions with household structure.
 */
export const plannerCompositionStep4HouseholdContext: ProgressiveSearchStep = {
  label: "Household planning context",

  search: async (ctx: ServiceCompositionContext): Promise<EnrichedContext | null> => {
    const household = await ctx.storage.getHousehold();
    if (!household) return null;

    const householdData = household as any; // Would be typed Household in real code
    const eaters = householdData.eaters ?? [];
    const restrictions = eaters.flatMap((e: any) => e.dietaryRestrictions ?? []);

    if (eaters.length === 0) return null;

    // Build household context message
    const eaterPhrase =
      eaters.length === 1 ? "1 eater" : `${eaters.length} eaters`;
    let contextMsg = `You're planning for a household with ${eaterPhrase}`;

    if (restrictions.length > 0) {
      const uniqueRestrictions = Array.from(new Set(restrictions));
      contextMsg += ` with ${uniqueRestrictions.join(", ")} restrictions`;
    }

    contextMsg +=
      ". This affects which meals are compatible and how meals are adapted.";

    return {
      tier: 3,
      presentationMode: "notice",
      content: contextMsg,
      data: {
        eaterCount: eaters.length,
        eaters,
        restrictions,
      },
    };
  },
};

// ---------------------------------------------------------------------------
// Registry: Planner Composition Configuration
// ---------------------------------------------------------------------------

/**
 * The Planner service's complete progressive knowledge composition strategy.
 * Registered at startup; used by the planner capability handler when queries
 * return gaps.
 */
export const PLANNER_COMPOSITION_CONFIG = {
  capability: "planner",
  triggeredByIntents: [
    "search:planner", // "search" verb with planner results
    "read:planner",   // "read" verb with empty results
  ],
  progressiveSearchSteps: [
    plannerCompositionStep1RequestedContext,
    plannerCompositionStep2WidenedContext,
    plannerCompositionStep3CookbookContext,
    plannerCompositionStep4HouseholdContext,
  ],
};

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Extract relevant keywords from a planner question.
 * E.g., "What chicken meals can I plan?" → ["chicken", "meals"]
 */
function extractPlannerKeywords(utterance: string): string[] {
  // Stop words and common planner terms (to skip)
  const stopWords = new Set([
    "what",
    "my",
    "do",
    "i",
    "have",
    "on",
    "the",
    "a",
    "plan",
    "planner",
    "meal",
    "meals",
    "week",
    "day",
    "time",
    "week",
    "for",
    "this",
    "next",
    "can",
    "should",
    "help",
    "show",
    "tell",
  ]);

  const words = utterance
    .toLowerCase()
    .split(/[\s\-\,\.]+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  // Deduplicate and limit to first 3
  return Array.from(new Set(words)).slice(0, 3);
}

/**
 * Format a day-of-week number (0 = Monday, 6 = Sunday) as a name.
 */
function formatDay(dayOfWeek: number): string {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  return days[dayOfWeek % 7] || "that day";
}

/**
 * Get the day names that have NO meals (given a list of days with meals).
 */
function getEmptyDaysOfWeek(daysWithMeals: string[]): string[] {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const withMealsSet = new Set(
    daysWithMeals.map((d) => d.toLowerCase())
  );
  return days.filter((d) => !withMealsSet.has(d.toLowerCase()));
}
