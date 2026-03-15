import { db } from "../db";
import { eq, and } from "drizzle-orm";
import {
  householdMembers,
  users,
  userPreferences,
  mealTemplates,
  ingredientSwaps,
} from "@shared/schema";
import type { MealTemplate } from "@shared/schema";
import { getHouseholdForUser } from "./household";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemberProfile {
  userId: number;
  displayName: string;
  dietTypes: string[];
  excludedIngredients: string[];
  preferredIngredients: string[];
  maxPrepTolerance: number | null;
  upfSensitivity: string;
  healthGoals: string[];
}

interface HouseholdSettings {
  mealMode: string;
  maxExtraPrepMinutes: number | null;
  maxTotalCookTime: number | null;
  preferLessProcessed: boolean;
  budgetLevel: string;
}

interface MemberChange {
  userId: number;
  displayName: string;
  swaps: string[];
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
  template: MealTemplate,
  extraPrepMinutes: number,
  settings: HouseholdSettings
): number {
  let score = 1;
  if (settings.maxTotalCookTime != null && template.estimatedTotalTime != null) {
    if (template.estimatedTotalTime > settings.maxTotalCookTime) {
      score *= settings.maxTotalCookTime / template.estimatedTotalTime;
    }
  }
  if (settings.maxExtraPrepMinutes != null && extraPrepMinutes > settings.maxExtraPrepMinutes) {
    score *= 0.5;
  }
  return Math.max(0, Math.min(1, score));
}

function scoreCostFit(template: MealTemplate, settings: HouseholdSettings): number {
  if (!template.costBand) return 1;
  const templateTier = COST_TIER[template.costBand] ?? 1;
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

export async function matchMealsForHousehold(userId: number): Promise<MealMatch[]> {
  const householdId = await getHouseholdForUser(userId);

  const memberRows = await db
    .select({
      member: householdMembers,
      user: { id: users.id, displayName: users.displayName, username: users.username },
    })
    .from(householdMembers)
    .innerJoin(users, eq(householdMembers.userId, users.id))
    .where(
      and(
        eq(householdMembers.householdId, householdId),
        eq(householdMembers.status, "active")
      )
    );

  const members: MemberProfile[] = [];
  for (const { member, user } of memberRows) {
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, member.userId));
    members.push({
      userId: member.userId,
      displayName: user.displayName || user.username,
      dietTypes: prefs?.dietTypes ?? [],
      excludedIngredients: prefs?.excludedIngredients ?? [],
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

  const householdSettings: HouseholdSettings = {
    mealMode:             callerPrefs?.mealMode            ?? "exact",
    maxExtraPrepMinutes:  callerPrefs?.maxExtraPrepMinutes ?? null,
    maxTotalCookTime:     callerPrefs?.maxTotalCookTime    ?? null,
    preferLessProcessed:  callerPrefs?.preferLessProcessed ?? false,
    budgetLevel:          callerPrefs?.budgetLevel         ?? "standard",
  };

  const templates = await db
    .select()
    .from(mealTemplates)
    .where(eq(mealTemplates.isActive, true));

  const swapRules = await db.select().from(ingredientSwaps);
  const swapMap = new Map<string, string>();
  for (const s of swapRules) {
    swapMap.set(s.original.toLowerCase(), s.healthier);
  }

  const results: MealMatch[] = [];
  for (const template of templates) {
    const match = scoreTemplate(template, members, householdSettings, swapMap);
    if (match) results.push(match);
  }

  results.sort((a, b) => b.fitScore - a.fitScore);
  return results;
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

  const memberChanges: MemberChange[] = [];
  let membersNeedingVariant = 0;
  let totalDietConflicts = 0;

  for (const member of members) {
    const swaps: string[] = [];

    const templateDiets = template.compatibleDiets ?? [];
    if (templateDiets.length > 0 && member.dietTypes.length > 0) {
      for (const diet of member.dietTypes) {
        if (!templateDiets.includes(diet)) {
          totalDietConflicts++;
          swaps.push(`${diet} diet not covered`);
        }
      }
    }

    const excluded = member.excludedIngredients.map((e) => e.toLowerCase());
    for (const ingredient of allSlotIngredients) {
      const key = ingredient.toLowerCase();
      const isExcluded = excluded.some((ex) => key.includes(ex) || ex.includes(key));
      if (isExcluded) {
        const healthier = swapMap.get(key);
        swaps.push(healthier ? `${ingredient} → ${healthier}` : `remove ${ingredient}`);
      }
    }

    if (swaps.length > 0) {
      membersNeedingVariant++;
      memberChanges.push({ userId: member.userId, displayName: member.displayName, swaps });
    }
  }

  const allExclusionsArr = Array.from(
    new Set(members.flatMap((m) => m.excludedIngredients.map((e) => e.toLowerCase())))
  );
  const sharedIngredients = base.filter((ing) => {
    const key = ing.toLowerCase();
    return !allExclusionsArr.some((ex) => key.includes(ex) || ex.includes(key));
  });

  const swapsNeeded = Array.from(
    new Set(memberChanges.flatMap((c) => c.swaps).filter((s) => s.includes("→")))
  );

  const extraPrepMinutes = (template.estimatedExtraTimePerVariant ?? 0) * membersNeedingVariant;

  const breakdown: ScoreBreakdown = {
    compatibility:        scoreCompatibility(totalDietConflicts, members.length),
    sharedBase:           scoreSharedBase(sharedIngredients, base),
    swapSimplicity:       scoreSwapSimplicity(memberChanges, members.length),
    timeFit:              scoreTimeFit(template, extraPrepMinutes, settings),
    costFit:              scoreCostFit(template, settings),
    healthAlignment:      scoreHealthAlignment(members, settings),
    preferenceConfidence: scorePreferenceConfidence(members),
  };

  return {
    template,
    sharedIngredients,
    memberChanges,
    swapsNeeded,
    extraPrepMinutes,
    fitScore: computeFitScore(breakdown),
    scoreBreakdown: breakdown,
    explanation: buildExplanation(template, members, memberChanges, sharedIngredients),
  };
}

// ─── Explanation ──────────────────────────────────────────────────────────────

function buildExplanation(
  template: MealTemplate,
  members: MemberProfile[],
  memberChanges: MemberChange[],
  sharedIngredients: string[]
): string {
  const name = template.title ?? template.name;
  const n = memberChanges.length;

  if (n === 0) {
    return `${name} works for the whole household with no changes needed.`;
  }

  const sharedPart =
    sharedIngredients.length > 0
      ? ` Shared base: ${sharedIngredients.slice(0, 3).join(", ")}${sharedIngredients.length > 3 ? "…" : "."}`
      : "";

  return `${name} fits ${members.length - n} of ${members.length} members as-is.${sharedPart} ${n} member${n > 1 ? "s" : ""} need${n === 1 ? "s" : ""} adjustments.`;
}
