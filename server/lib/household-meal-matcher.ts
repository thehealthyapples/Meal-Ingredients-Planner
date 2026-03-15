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

interface MemberChange {
  userId: number;
  displayName: string;
  swaps: string[];
}

export interface MealMatch {
  template: MealTemplate;
  sharedIngredients: string[];
  memberChanges: MemberChange[];
  swapsNeeded: string[];
  extraPrepMinutes: number;
  fitScore: number;
  explanation: string;
}

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
    const match = scoreTemplate(template, members, swapMap);
    if (match) results.push(match);
  }

  results.sort((a, b) => b.fitScore - a.fitScore);
  return results;
}

function scoreTemplate(
  template: MealTemplate,
  members: MemberProfile[],
  swapMap: Map<string, string>
): MealMatch | null {
  const allSlotIngredients = [
    ...(template.sharedBaseComponents ?? []),
    ...(template.proteinSlots ?? []),
    ...(template.carbSlots ?? []),
    ...(template.vegSlots ?? []),
    ...(template.toppingSlots ?? []),
    ...(template.sauceSlots ?? []),
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
      const isExcluded = excluded.some(
        (ex) => key.includes(ex) || ex.includes(key)
      );
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

  const allExclusions = new Set(
    members.flatMap((m) => m.excludedIngredients.map((e) => e.toLowerCase()))
  );
  const allExclusionsArr = Array.from(allExclusions);
  const sharedIngredients = base.filter((ing) => {
    const key = ing.toLowerCase();
    return !allExclusionsArr.some((ex) => key.includes(ex) || ex.includes(key));
  });

  const swapsNeeded = Array.from(
    new Set(
      memberChanges
        .flatMap((c) => c.swaps)
        .filter((s) => s.includes("→"))
    )
  );

  const extraPrepMinutes =
    (template.estimatedExtraTimePerVariant ?? 0) * membersNeedingVariant;

  let score = 100;
  if (members.length > 0) {
    score -= (totalDietConflicts / members.length) * 40;
    score -= (membersNeedingVariant / members.length) * 30;
  }

  const allPreferred = members.flatMap((m) =>
    m.preferredIngredients.map((p) => p.toLowerCase())
  );
  if (allPreferred.length > 0 && allSlotIngredients.length > 0) {
    const matches = allSlotIngredients.filter((ing) =>
      allPreferred.some(
        (p) =>
          ing.toLowerCase().includes(p) || p.includes(ing.toLowerCase())
      )
    ).length;
    score += Math.min(20, (matches / allSlotIngredients.length) * 20);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    template,
    sharedIngredients,
    memberChanges,
    swapsNeeded,
    extraPrepMinutes,
    fitScore: score,
    explanation: buildExplanation(template, members, memberChanges, sharedIngredients),
  };
}

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
