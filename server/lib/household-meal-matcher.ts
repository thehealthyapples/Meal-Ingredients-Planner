import { db } from "../db";
import { eq } from "drizzle-orm";
import {
  householdEaters,
  plannerWeekEaterOverrides,
  userPreferences,
  users,
  mealTemplates,
  ingredientSwaps,
} from "@shared/schema";
import type { MealTemplate, Meal } from "@shared/schema";
import { getHouseholdForUser } from "./household";
import { dbEaterToHouseholdEater, getEffectiveDietProfile } from "@shared/household-eater.js";
import { resolveActiveRestrictions, resolveIngredientRestrictions } from "@shared/restrictions/restriction-resolver.js";

const DIET_PATTERN_TO_DIET_TYPE: Record<string, string> = {
  Vegan: "vegan",
  Vegetarian: "vegetarian",
  Flexitarian: "flexitarian",
  Keto: "keto",
  "Low-Carb": "low-carb",
  Paleo: "paleo",
  Carnivore: "carnivore",
  Mediterranean: "mediterranean",
  DASH: "dash",
  MIND: "mind",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MemberProfile {
  userId: number | null;
  displayName: string;
  dietTypes: string[];
  excludedIngredients: string[];
  preferredIngredients: string[];
  maxPrepTolerance: number | null;
  upfSensitivity: string;
  healthGoals: string[];
}

export interface HouseholdSettings {
  mealMode: string;
  maxExtraPrepMinutes: number | null;
  maxTotalCookTime: number | null;
  preferLessProcessed: boolean;
  budgetLevel: string;
}

export interface MemberChange {
  userId: number | null;
  displayName: string;
  swaps: string[];
}

// Fields present on MealTemplate but absent from Meal — used to decouple scoring from template type
interface TimingCostMeta {
  estimatedTotalTime?: number | null;
  estimatedExtraTimePerVariant?: number | null;
  costBand?: string | null;
}

export interface ScoreBreakdown {
  compatibility: number;
  sharedBase: number;
  swapSimplicity: number;
  timeFit: number;
  costFit: number;
  healthAlignment: number;
  preferenceConfidence: number;
}

export interface MealMatch {
  template: MealTemplate;
  sharedIngredients: string[];
  memberChanges: MemberChange[];
  swapsNeeded: string[];
  extraPrepMinutes: number;
  fitScore: number;
  scoreBreakdown: ScoreBreakdown;
  explanation: string;
}

// Compatibility result for normal meals — identical shape to MealMatch minus template
export interface MealCompatibilityResult {
  sharedIngredients: string[];
  memberChanges: MemberChange[];
  swapsNeeded: string[];
  extraPrepMinutes: number;
  fitScore: number;
  scoreBreakdown: ScoreBreakdown;
  explanation: string;
}

// Pre-built household context — loaded once per planning run, reused per candidate
export interface HouseholdContext {
  members: MemberProfile[];
  settings: HouseholdSettings;
  swapMap: Map<string, string>;
}

// ─── Weights ──────────────────────────────────────────────────────────────────

const WEIGHTS: Record<keyof ScoreBreakdown, number> = {
  compatibility:        0.25,
  sharedBase:           0.20,
  swapSimplicity:       0.15,
  timeFit:              0.10,
  costFit:              0.10,
  healthAlignment:      0.10,
  preferenceConfidence: 0.10,
};

const COST_TIER: Record<string, number> = { budget: 0, standard: 1, premium: 2 };

// ─── Score components (each returns 0–1) ─────────────────────────────────────

function scoreCompatibility(totalDietConflicts: number, memberCount: number): number {
  if (memberCount === 0) return 1;
  return Math.max(0, 1 - totalDietConflicts / memberCount);
}

function scoreSharedBase(sharedIngredients: string[], base: string[]): number {
  if (base.length === 0) return 1;
  return sharedIngredients.length / base.length;
}

function scoreSwapSimplicity(memberChanges: MemberChange[], memberCount: number): number {
  if (memberCount === 0 || memberChanges.length === 0) return 1;
  const variantFraction = memberChanges.length / memberCount;
  const allSwaps = memberChanges.flatMap((c) => c.swaps);
  const ruleBasedFraction =
    allSwaps.length > 0
      ? allSwaps.filter((s) => s.includes("→")).length / allSwaps.length
      : 1;
  // Variant fraction penalises broadly; rule quality moderates the penalty
  return (1 - variantFraction) * 0.6 + ruleBasedFraction * 0.4;
}

function scoreTimeFit(
  meta: TimingCostMeta,
  extraPrepMinutes: number,
  settings: HouseholdSettings
): number {
  let score = 1;
  if (settings.maxTotalCookTime != null && meta.estimatedTotalTime != null) {
    if (meta.estimatedTotalTime > settings.maxTotalCookTime) {
      score *= settings.maxTotalCookTime / meta.estimatedTotalTime;
    }
  }
  if (settings.maxExtraPrepMinutes != null && extraPrepMinutes > settings.maxExtraPrepMinutes) {
    score *= 0.5;
  }
  return Math.max(0, Math.min(1, score));
}

function scoreCostFit(meta: TimingCostMeta, settings: HouseholdSettings): number {
  if (!meta.costBand) return 1;
  const templateTier = COST_TIER[meta.costBand] ?? 1;
  const budgetTier = COST_TIER[settings.budgetLevel] ?? 1;
  const diff = Math.abs(templateTier - budgetTier);
  return diff === 0 ? 1 : diff === 1 ? 0.7 : 0.3;
}

function scoreHealthAlignment(members: MemberProfile[], settings: HouseholdSettings): number {
  const base = settings.preferLessProcessed ? 0.7 : 1.0;
  const highCount = members.filter((m) => m.upfSensitivity === "high").length;
  const penalty = members.length > 0 ? (highCount / members.length) * 0.2 : 0;
  return Math.max(0, base - penalty);
}

function scorePreferenceConfidence(members: MemberProfile[]): number {
  if (members.length === 0) return 0;
  const withData = members.filter(
    (m) =>
      m.dietTypes.length > 0 ||
      m.excludedIngredients.length > 0 ||
      m.healthGoals.length > 0
  ).length;
  return 0.5 + (withData / members.length) * 0.5;
}

// ─── Weighted composite ───────────────────────────────────────────────────────

function computeFitScore(breakdown: ScoreBreakdown): number {
  const raw =
    breakdown.compatibility        * WEIGHTS.compatibility +
    breakdown.sharedBase           * WEIGHTS.sharedBase +
    breakdown.swapSimplicity       * WEIGHTS.swapSimplicity +
    breakdown.timeFit              * WEIGHTS.timeFit +
    breakdown.costFit              * WEIGHTS.costFit +
    breakdown.healthAlignment      * WEIGHTS.healthAlignment +
    breakdown.preferenceConfidence * WEIGHTS.preferenceConfidence;
  return Math.round(raw * 100);
}

// ─── Main entry point ─────────────────────────────────────────────────────────

// Loads all household context needed for compatibility scoring — members, settings,
// swapMap — without running the template loop. Returns null when the user has no
// active household, so callers degrade gracefully to no-compatibility behaviour.
export async function buildHouseholdContext(
  userId: number,
  weekId?: number,
): Promise<HouseholdContext | null> {
  let householdId: number;
  try {
    householdId = await getHouseholdForUser(userId);
  } catch {
    return null;
  }

  // Load weekly diet overrides for this planner week (optional — no-op when weekId not provided).
  let overrideMap = new Map<number, { dietTypes: string[] }>();
  if (weekId != null) {
    const overrides = await db
      .select()
      .from(plannerWeekEaterOverrides)
      .where(eq(plannerWeekEaterOverrides.weekId, weekId));
    overrideMap = new Map(overrides.map(o => [o.eaterId, { dietTypes: o.dietTypes }]));
  }

  const eaterRows = await db
    .select()
    .from(householdEaters)
    .where(eq(householdEaters.householdId, householdId))
    .orderBy(householdEaters.id);

  const members: MemberProfile[] = [];
  for (const row of eaterRows) {
    const eater = dbEaterToHouseholdEater(row);
    const profile = getEffectiveDietProfile(eater, overrideMap.get(Number(eater.id)));

    let prefs: typeof userPreferences.$inferSelect | undefined;
    let userRow: typeof users.$inferSelect | undefined;
    if (eater.userId != null) {
      [[prefs], [userRow]] = await Promise.all([
        db.select().from(userPreferences).where(eq(userPreferences.userId, eater.userId)),
        db.select().from(users).where(eq(users.id, eater.userId)),
      ]);
    }

    let dietTypes: string[];
    let excludedIngredients: string[];
    if (eater.userId != null) {
      // Adult: derive dietary data from profile, respecting week diet overrides
      const override = overrideMap.get(Number(eater.id));
      if (override) {
        dietTypes = override.dietTypes;
      } else {
        const prefDietTypes = prefs?.dietTypes ?? [];
        if (prefDietTypes.length > 0) {
          dietTypes = prefDietTypes;
        } else if (userRow?.dietPattern) {
          const mapped = DIET_PATTERN_TO_DIET_TYPE[userRow.dietPattern];
          dietTypes = mapped ? [mapped] : [userRow.dietPattern];
        } else {
          dietTypes = [];
        }
      }
      excludedIngredients = (userRow?.dietRestrictions ?? []).map(r => r.toLowerCase());
    } else {
      // Child: use stored household_eaters values via getEffectiveDietProfile
      dietTypes = profile.dietTypes;
      excludedIngredients = profile.hardRestrictions.map(r => r.toLowerCase());
    }

    members.push({
      userId: eater.userId ?? null,
      displayName: eater.displayName,
      dietTypes,
      excludedIngredients,
      preferredIngredients: prefs?.preferredIngredients ?? [],
      maxPrepTolerance: prefs?.maxPrepTolerance ?? null,
      upfSensitivity: prefs?.upfSensitivity ?? "moderate",
      healthGoals: prefs?.healthGoals ?? [],
    });
  }

  // Household-level planning settings come from the calling user's preferences
  const [callerPrefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId));

  const settings: HouseholdSettings = {
    mealMode:             callerPrefs?.mealMode            ?? "exact",
    maxExtraPrepMinutes:  callerPrefs?.maxExtraPrepMinutes ?? null,
    maxTotalCookTime:     callerPrefs?.maxTotalCookTime    ?? null,
    preferLessProcessed:  callerPrefs?.preferLessProcessed ?? false,
    budgetLevel:          callerPrefs?.budgetLevel         ?? "standard",
  };

  const swapRules = await db.select().from(ingredientSwaps);
  const swapMap = new Map<string, string>();
  for (const s of swapRules) {
    swapMap.set(s.original.toLowerCase(), s.healthier);
  }

  return { members, settings, swapMap };
}

export async function matchMealsForHousehold(
  userId: number,
  weekId?: number,
  context?: HouseholdContext,
): Promise<MealMatch[]> {
  const ctx = context ?? await buildHouseholdContext(userId, weekId);
  if (ctx == null) return [];

  const { members, settings: householdSettings, swapMap } = ctx;

  const templates = await db
    .select()
    .from(mealTemplates)
    .where(eq(mealTemplates.isActive, true));

  const results: MealMatch[] = [];
  for (const template of templates) {
    const match = scoreTemplate(template, members, householdSettings, swapMap);
    if (match) results.push(match);
  }

  results.sort((a, b) => b.fitScore - a.fitScore);
  return results;
}

// ─── Shared compatibility engine ──────────────────────────────────────────────
//
// Single source of truth for all household compatibility scoring.
// Both scoreTemplate() (shell meals) and scoreMealCompatibility() (normal meals)
// delegate here after assembling their respective ingredient lists.

function computeIngredientCompatibility(
  ingredientList: string[],
  compatibleDiets: string[],
  base: string[],
  meta: TimingCostMeta,
  members: MemberProfile[],
  settings: HouseholdSettings,
  swapMap: Map<string, string>
): MealCompatibilityResult {
  const memberChanges: MemberChange[] = [];
  let membersNeedingVariant = 0;
  let totalDietConflicts = 0;
  const resolvedMemberDefs: Array<ReturnType<typeof resolveActiveRestrictions>> = [];

  for (const member of members) {
    const swaps: string[] = [];

    // Path A: diet type check
    if (compatibleDiets.length > 0 && member.dietTypes.length > 0) {
      for (const diet of member.dietTypes) {
        if (!compatibleDiets.includes(diet)) {
          totalDietConflicts++;
          swaps.push(`${diet} diet not covered`);
        }
      }
    }

    // Path B: ingredient exclusion check via canonical restriction resolver
    const memberDefs = resolveActiveRestrictions(member.excludedIngredients);
    resolvedMemberDefs.push(memberDefs);
    for (const ingredient of ingredientList) {
      if (resolveIngredientRestrictions(ingredient, memberDefs).length > 0) {
        const key = ingredient.toLowerCase();
        const healthier = swapMap.get(key);
        swaps.push(healthier ? `${ingredient} → ${healthier}` : `remove ${ingredient}`);
      }
    }

    if (swaps.length > 0) {
      membersNeedingVariant++;
      memberChanges.push({ userId: member.userId, displayName: member.displayName, swaps });
    }
  }

  const allActiveDefs = Array.from(
    new Map(resolvedMemberDefs.flat().map(def => [def.id, def])).values()
  );
  const sharedIngredients = base.filter((ing) =>
    resolveIngredientRestrictions(ing, allActiveDefs).length === 0
  );

  const swapsNeeded = Array.from(
    new Set(memberChanges.flatMap((c) => c.swaps).filter((s) => s.includes("→")))
  );

  const extraPrepMinutes = (meta.estimatedExtraTimePerVariant ?? 0) * membersNeedingVariant;

  const breakdown: ScoreBreakdown = {
    compatibility:        scoreCompatibility(totalDietConflicts, members.length),
    sharedBase:           scoreSharedBase(sharedIngredients, base),
    swapSimplicity:       scoreSwapSimplicity(memberChanges, members.length),
    timeFit:              scoreTimeFit(meta, extraPrepMinutes, settings),
    costFit:              scoreCostFit(meta, settings),
    healthAlignment:      scoreHealthAlignment(members, settings),
    preferenceConfidence: scorePreferenceConfidence(members),
  };

  return {
    sharedIngredients,
    memberChanges,
    swapsNeeded,
    extraPrepMinutes,
    fitScore: computeFitScore(breakdown),
    scoreBreakdown: breakdown,
    explanation: buildExplanation(
      members,
      memberChanges,
      sharedIngredients,
      base,
      swapsNeeded,
      extraPrepMinutes,
      breakdown,
      settings
    ),
  };
}

// ─── Score normal meals ───────────────────────────────────────────────────────

export function scoreMealCompatibility(
  meal: Meal,
  members: MemberProfile[],
  settings: HouseholdSettings,
  swapMap: Map<string, string>
): MealCompatibilityResult | null {
  if (!meal.ingredients || meal.ingredients.length === 0) return null;

  return computeIngredientCompatibility(
    meal.ingredients,
    meal.dietTypes ?? [],
    meal.ingredients,  // whole recipe is the shared base for a normal meal
    {},                // no time/cost metadata — timeFit and costFit default to 1.0
    members,
    settings,
    swapMap
  );
}

// ─── Per-template logic ───────────────────────────────────────────────────────

function scoreTemplate(
  template: MealTemplate,
  members: MemberProfile[],
  settings: HouseholdSettings,
  swapMap: Map<string, string>
): MealMatch | null {
  const allSlotIngredients = [
    ...(template.sharedBaseComponents ?? []),
    ...(template.proteinSlots        ?? []),
    ...(template.carbSlots           ?? []),
    ...(template.vegSlots            ?? []),
    ...(template.toppingSlots        ?? []),
    ...(template.sauceSlots          ?? []),
  ];

  if (allSlotIngredients.length === 0) return null;

  const base = template.sharedBaseComponents ?? [];

  const meta: TimingCostMeta = {
    estimatedTotalTime:           template.estimatedTotalTime,
    estimatedExtraTimePerVariant: template.estimatedExtraTimePerVariant,
    costBand:                     template.costBand,
  };

  return {
    template,
    ...computeIngredientCompatibility(
      allSlotIngredients,
      template.compatibleDiets ?? [],
      base,
      meta,
      members,
      settings,
      swapMap
    ),
  };
}

// ─── Explanation ──────────────────────────────────────────────────────────────

function buildExplanation(
  members: MemberProfile[],
  memberChanges: MemberChange[],
  sharedIngredients: string[],
  base: string[],
  swapsNeeded: string[],
  extraPrepMinutes: number,
  breakdown: ScoreBreakdown,
  settings: HouseholdSettings
): string {
  const phrases: string[] = [];

  // 1. Profile fit
  const variantCount = memberChanges.length;
  if (variantCount === 0) {
    phrases.push(`Fits all ${members.length} profile${members.length !== 1 ? "s" : ""}`);
  } else {
    const ok = members.length - variantCount;
    phrases.push(`Fits ${ok} of ${members.length} profiles`);
  }

  // 2. Swaps
  const allSwapLines = memberChanges.flatMap((c) => c.swaps);
  const ruleSwaps = swapsNeeded.length;
  const removals = allSwapLines.filter((s) => s.startsWith("remove ")).length;
  if (ruleSwaps > 0) {
    const dietSwaps = allSwapLines.filter((s) => s.includes("diet not covered"));
    const dietLabel = dietSwaps.length > 0 ? " diet" : "";
    phrases.push(`${ruleSwaps === 1 ? "One" : ruleSwaps} easy${dietLabel} swap${ruleSwaps !== 1 ? "s" : ""}`);
  }
  if (removals > 0) {
    phrases.push(`${removals} ingredient removal${removals !== 1 ? "s" : ""}`);
  }

  // 3. Extra prep
  if (extraPrepMinutes > 0) {
    phrases.push(`Extra prep only ${extraPrepMinutes} min`);
  }

  // 4. Base overlap
  if (base.length > 0) {
    const overlapRatio = sharedIngredients.length / base.length;
    if (overlapRatio >= 0.8) {
      phrases.push("High ingredient overlap");
    } else if (overlapRatio >= 0.4) {
      phrases.push("Good base ingredient overlap");
    }
  }

  // 5. UPF / health preference
  if (settings.preferLessProcessed && breakdown.healthAlignment >= 0.6) {
    phrases.push("Matches your lower-UPF preference");
  }

  // 6. Budget
  if (breakdown.costFit === 1 && settings.budgetLevel) {
    phrases.push("Fits your budget");
  }

  // 7. Time
  if (
    breakdown.timeFit === 1 &&
    (settings.maxTotalCookTime != null || settings.maxExtraPrepMinutes != null)
  ) {
    phrases.push("Within your time limit");
  }

  return phrases.join(" · ");
}
