/**
 * world-seeder.ts — INTQ6 Benchmark Household World (seeder + reset)
 * ===================================================================
 * Turns the canonical fixtures (world-fixtures.ts) into REAL THA accounts and
 * households in the DEV database, and resets them back to canonical state on
 * demand. This is operational platform infrastructure, not a test helper.
 *
 * Guarantees:
 *   - DEV ONLY. Every entry point calls `assertBenchmarkWorldAllowed()` and
 *     refuses to run when NODE_ENV === "production". There is no override.
 *   - EXISTING WRITE PATHS ONLY for seeding: accounts via storage.createUser,
 *     households via storage.createHouseholdForUser, the partner adult via the
 *     production invite/accept path storage.joinHousehold, meals/planner/pantry/
 *     shopping/diary/preferences via the same storage methods the app uses,
 *     meal nutrition + allergens via the same autoAnalyzeMeal derivation the
 *     meals route runs, evidence via the canonical EL1 orchestrator
 *     recordOutcomeAndDetect. No parallel schema, no second identity space — a
 *     benchmark household IS an ordinary household with frozen contents
 *     (BENCHMARK_HOUSEHOLDS.md §1 discipline).
 *
 *     BENCHINT2 (2026-07-10) converged the last three of these. Before it, the
 *     seeder called storage.createMeal without production's derivation step, so
 *     every benchmark meal had no nutrition and no allergens; re-implemented
 *     evidence detection against the raw store with no time window; and attached
 *     the partner by raw membership DELETE + INSERT, orphaning their solo
 *     household. See docs/implementation/benchmarking/
 *     BENCHINT2_BENCHMARK_RUNTIME_CONVERGENCE.md.
 *   - DETERMINISTIC RESET: wipe-then-reseed is total — same fixture in, same
 *     content out, every time. Recency (diary/evidence dayOffsets) is relative
 *     to the reset instant; database row ids are not part of the contract.
 *   - SCOPED WIPE: the reset deletes ONLY rows belonging to the benchmark
 *     accounts/households resolved by their deterministic usernames. It can
 *     never touch another user's data, and never runs in production at all.
 *
 * The wipe uses direct table deletes scoped by the resolved user/household ids
 * — the same pattern storage.cleanupDemoUser already establishes for account-
 * scoped teardown — because no aggregate "delete everything for user X" write
 * path exists. Reseeding then goes through the ordinary storage methods.
 */

import { eq, and, inArray } from "drizzle-orm";
import { db } from "../db.js";
import { storage } from "../storage.js";
import { hashPassword } from "../auth.js";
import { getHouseholdForUser } from "../lib/household.js";
import {
  users, households, householdMembers, householdEaters,
  plannerWeeks, plannerDays, plannerEntries,
  shoppingList, ingredientSources, productMatches, shoppingListExtras,
  userPantryItems, basketItems, freezerMeals, productHistory,
  meals, nutrition, mealAllergens, mealDiets,
  foodDiaryDays, foodDiaryEntries, foodDiaryMetrics,
  userPreferences, userStreaks, userHealthTrends,
  savingsEvents, userItemUsage, activitySummary,
  conversations, opportunityDeliveries,
  householdEvidenceEvents, householdLearningSignals,
  mealPlans, mealPlanEntries,
  type User,
} from "../../shared/schema.js";
import {
  BENCHMARK_WORLD, BENCHMARK_WORLD_VERSION,
  benchmarkAccountPassword, getBenchmarkHouseholdFixture,
  type BenchmarkHouseholdFixture,
} from "./world-fixtures.js";
import { evidenceLearningStore } from "../intelligence/evidence-learning/evidence-learning-store.js";
import { recordOutcomeAndDetect } from "../intelligence/evidence-learning/framework.js";
// BENCHINT2 (D2) — the ONE owner of post-create meal derivation. Production's meals route calls
// exactly this after `storage.createMeal`; so does the seeder, now. Before this, benchmark meals
// carried zero nutrition rows and zero allergen rows, and the Companion Benchmark was measuring
// food reasoning against a world with no food data.
import { autoAnalyzeMeal } from "../services/meal-analysis.js";

// ---------------------------------------------------------------------------
// Environment guard — the world exists in DEV only
// ---------------------------------------------------------------------------

export function benchmarkWorldAllowed(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function assertBenchmarkWorldAllowed(): void {
  if (!benchmarkWorldAllowed()) {
    throw new Error(
      "Benchmark Household World is DEV-only. Refusing to touch a production environment.",
    );
  }
}

// ---------------------------------------------------------------------------
// Result shapes
// ---------------------------------------------------------------------------

export interface BenchmarkHouseholdState {
  readonly id: string;
  readonly slug: string;
  readonly archetype: string;
  readonly householdName: string;
  readonly summary: string;
  readonly seeded: boolean;
  readonly ownerUserId: number | null;
  readonly ownerUsername: string;
  readonly householdId: number | null;
  readonly lastResetAt: string | null;
  readonly accounts: number;
  readonly knownGaps: readonly string[];
  readonly coldStart: boolean;
}

export interface HouseholdResetResult {
  readonly id: string;
  readonly householdId: number;
  readonly ownerUserId: number;
  readonly counts: Record<string, number>;
  readonly resetAt: string;
}

const RESET_AT_KEY = (id: string) => `benchmark_world:${id}:last_reset_at`;

// ---------------------------------------------------------------------------
// Account + household resolution (deterministic usernames are the registry)
// ---------------------------------------------------------------------------

async function ensureAccount(
  fixture: BenchmarkHouseholdFixture,
  key: "owner" | "partner",
): Promise<User> {
  const account = fixture.accounts.find((a) => a.key === key);
  if (!account) throw new Error(`${fixture.id}: no "${key}" account in fixture`);

  let user = await storage.getUserByUsername(account.username);
  if (!user) {
    user = await storage.createUser({
      username: account.username,
      password: await hashPassword(benchmarkAccountPassword()),
    });
  }

  // Canonical profile + benchmark account flags. Direct column update — the
  // beta/verified flags have no storage setter (registration is closed in dev
  // and would send real emails), matching how createDemoUser sets them.
  // CONV1 P4 (OWN-1): users.diet* is retired — the fixture's account-level diet is
  // seeded onto the eater row (the canonical owner) by the eater loop below, which
  // writes each account eater's defaultDietTypes/hardRestrictions from the fixture.
  const [updated] = await db.update(users).set({
    displayName: account.displayName,
    firstName: account.firstName,
    isBetaUser: true,
    emailVerified: true,
    onboardingCompleted: !fixture.coldStart,
    starterMealsLoaded: true,
    isDemo: false,
    role: "user",
  }).where(eq(users.id, user.id)).returning();
  return updated;
}

async function ensureHousehold(fixture: BenchmarkHouseholdFixture, owner: User): Promise<number> {
  let householdId: number;
  try {
    householdId = await getHouseholdForUser(owner.id);
  } catch {
    const hh = await storage.createHouseholdForUser(owner.id, fixture.householdName);
    householdId = hh.id;
  }
  await db.update(households).set({ name: fixture.householdName }).where(eq(households.id, householdId));

  // Attach the partner account as an active member where the fixture has one.
  //
  // BENCHINT2 (D11) — through the production invite/accept path, `storage.joinHousehold`, which is
  // the one way a second adult joins a household in the product. It supersedes a raw
  // `DELETE householdMembers WHERE userId = …` + `INSERT`, which left the partner's auto-created
  // solo household with zero members — a state no production flow can produce. `joinHousehold`
  // instead marks the prior membership `left`, exactly as a real second adult's does.
  const partnerFixture = fixture.accounts.find((a) => a.key === "partner");
  if (partnerFixture) {
    const partner = await ensureAccount(fixture, "partner");
    const activeInTarget = await db.select().from(householdMembers).where(
      and(
        eq(householdMembers.householdId, householdId),
        eq(householdMembers.userId, partner.id),
        eq(householdMembers.status, "active"),
      ),
    );
    if (activeInTarget.length === 0) {
      const [target] = await db.select({ inviteCode: households.inviteCode })
        .from(households).where(eq(households.id, householdId));
      if (!target?.inviteCode) {
        throw new Error(`${fixture.id}: household ${householdId} has no invite code to join through`);
      }
      await storage.joinHousehold(partner.id, target.inviteCode);
    }
  }
  return householdId;
}

// ---------------------------------------------------------------------------
// Wipe — scoped, total, dev-only
// ---------------------------------------------------------------------------

async function wipeUserData(userId: number): Promise<void> {
  // Shopping list + attribution
  const items = await db.select({ id: shoppingList.id }).from(shoppingList).where(eq(shoppingList.userId, userId));
  const itemIds = items.map((i) => i.id);
  if (itemIds.length > 0) {
    await db.delete(ingredientSources).where(inArray(ingredientSources.shoppingListItemId, itemIds));
    await db.delete(productMatches).where(inArray(productMatches.shoppingListItemId, itemIds));
  }
  await db.delete(shoppingList).where(eq(shoppingList.userId, userId));
  await db.delete(shoppingListExtras).where(eq(shoppingListExtras.userId, userId));
  await db.delete(basketItems).where(eq(basketItems.userId, userId));

  // Pantry, freezer, history
  await db.delete(userPantryItems).where(eq(userPantryItems.userId, userId));
  await db.delete(freezerMeals).where(eq(freezerMeals.userId, userId));
  await db.delete(productHistory).where(eq(productHistory.userId, userId));

  // Diary (entries/metrics cascade from days only partially — delete all three)
  await db.delete(foodDiaryEntries).where(eq(foodDiaryEntries.userId, userId));
  await db.delete(foodDiaryDays).where(eq(foodDiaryDays.userId, userId));
  await db.delete(foodDiaryMetrics).where(eq(foodDiaryMetrics.userId, userId));

  // Cookbook meals (+ dependent rows without FK cascade)
  const own = await db.select({ id: meals.id }).from(meals).where(eq(meals.userId, userId));
  const mealIds = own.map((m) => m.id);
  if (mealIds.length > 0) {
    await db.delete(nutrition).where(inArray(nutrition.mealId, mealIds));
    await db.delete(mealAllergens).where(inArray(mealAllergens.mealId, mealIds));
    await db.delete(mealDiets).where(inArray(mealDiets.mealId, mealIds));
  }
  await db.delete(meals).where(eq(meals.userId, userId));

  // Legacy meal plans
  const plans = await db.select({ id: mealPlans.id }).from(mealPlans).where(eq(mealPlans.userId, userId));
  const planIds = plans.map((p) => p.id);
  if (planIds.length > 0) {
    await db.delete(mealPlanEntries).where(inArray(mealPlanEntries.planId, planIds));
  }
  await db.delete(mealPlans).where(eq(mealPlans.userId, userId));

  // Preferences, streaks, trends, savings, usage, activity
  await db.delete(userPreferences).where(eq(userPreferences.userId, userId));
  await db.delete(userStreaks).where(eq(userStreaks.userId, userId));
  await db.delete(userHealthTrends).where(eq(userHealthTrends.userId, userId));
  await db.delete(savingsEvents).where(eq(savingsEvents.userId, userId));
  await db.delete(userItemUsage).where(eq(userItemUsage.userId, userId));
  await db.delete(activitySummary).where(eq(activitySummary.userId, userId));

  // Companion state: conversations cascade threads → turns → feedback/proposals.
  await db.delete(conversations).where(eq(conversations.userId, userId));
  await db.delete(opportunityDeliveries).where(eq(opportunityDeliveries.userId, userId));
}

async function wipeHouseholdData(householdId: number): Promise<void> {
  // Planner: weeks → days → entries (entry-eaters/overrides/provisioning cascade via FK)
  const weeks = await db.select({ id: plannerWeeks.id }).from(plannerWeeks).where(eq(plannerWeeks.householdId, householdId));
  for (const week of weeks) {
    const days = await db.select({ id: plannerDays.id }).from(plannerDays).where(eq(plannerDays.weekId, week.id));
    const dayIds = days.map((d) => d.id);
    if (dayIds.length > 0) {
      await db.delete(plannerEntries).where(inArray(plannerEntries.dayId, dayIds));
    }
    await db.delete(plannerDays).where(eq(plannerDays.weekId, week.id));
  }
  await db.delete(plannerWeeks).where(eq(plannerWeeks.householdId, householdId));

  // Eaters (recreated canonically on reseed)
  await db.delete(householdEaters).where(eq(householdEaters.householdId, householdId));

  // Evidence & Learning (EL1) — reset to canonical evidence only
  await db.delete(householdLearningSignals).where(eq(householdLearningSignals.householdId, householdId));
  await db.delete(householdEvidenceEvents).where(eq(householdEvidenceEvents.householdId, householdId));
}

// ---------------------------------------------------------------------------
// Reseed — canonical content through the ordinary write paths
// ---------------------------------------------------------------------------

function offsetDateIso(dayOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}

function offsetDate(dayOffset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return d;
}

async function reseedHousehold(
  fixture: BenchmarkHouseholdFixture,
  owner: User,
  householdId: number,
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {
    meals: 0, pantry: 0, plannerEntries: 0, shopping: 0,
    diaryEntries: 0, diaryMetrics: 0, evidenceEvents: 0, learningSignals: 0, eaters: 0,
  };

  // The cold-start household seeds nothing beyond the account + empty household.
  if (fixture.coldStart) return counts;

  // 1. Preferences (owner-scoped, the profile the Companion reads)
  const p = fixture.preferences;
  await storage.upsertUserPreferences(owner.id, {
    dietTypes: [...(p.dietTypes ?? [])],
    excludedIngredients: [...(p.excludedIngredients ?? [])],
    healthGoals: [...(p.healthGoals ?? [])],
    budgetLevel: p.budgetLevel ?? "standard",
    preferredStores: [...(p.preferredStores ?? [])],
    calorieTarget: p.calorieTarget ?? null,
    goalType: p.goalType ?? "maintain",
    activityLevel: p.activityLevel ?? "moderate",
    heightCm: p.heightCm ?? null,
    weightKg: p.weightKg ?? null,
    adultsCount: p.adultsCount ?? 1,
    childrenCount: p.childrenCount ?? 0,
    maxTotalCookTime: p.maxTotalCookTime ?? null,
    preferredIngredients: [...(p.preferredIngredients ?? [])],
    plannerEnableChildMeals: p.plannerEnableChildMeals ?? false,
  });

  // 2. Eaters — adult members first (canonical write path), then fixture detail.
  // CONV1 P4 (WRITE-3): membership events create eater rows; this loop only covers a
  // reset world whose eater rows were wiped after the memberships already existed.
  const activeMembers = await db.select({ userId: householdMembers.userId }).from(householdMembers)
    .where(and(eq(householdMembers.householdId, householdId), eq(householdMembers.status, "active")));
  for (const m of activeMembers) {
    await storage.ensureEaterForMember(householdId, m.userId);
  }
  const syncedEaters = await storage.getHouseholdEaters(householdId);
  for (const eater of fixture.eaters) {
    if (eater.accountKey) {
      // Adjust the auto-synced member eater to canonical diets/restrictions.
      const account = fixture.accounts.find((a) => a.key === eater.accountKey);
      const accountUser = account ? await storage.getUserByUsername(account.username) : undefined;
      const row = syncedEaters.find((e) => e.userId === accountUser?.id);
      if (row) {
        await storage.updateHouseholdEater(row.id, {
          displayName: eater.displayName,
          defaultDietTypes: [...(eater.defaultDietTypes ?? [])],
          hardRestrictions: [...(eater.hardRestrictions ?? [])],
        });
        counts.eaters++;
      }
    } else {
      await storage.createHouseholdEater(householdId, {
        displayName: eater.displayName,
        defaultDietTypes: [...(eater.defaultDietTypes ?? [])],
        hardRestrictions: [...(eater.hardRestrictions ?? [])],
      });
      counts.eaters++;
    }
  }

  // 3. Pantry
  for (const item of fixture.pantry) {
    await storage.addPantryItem(owner.id, item.ingredient, item.category, undefined, item.displayName);
    counts.pantry++;
  }

  // 4. Cookbook meals
  //
  // BENCHINT2 (D2) — `storage.createMeal` writes the meal row and nothing else. Production's
  // `POST /api/meals` then runs `autoAnalyzeMeal`, which DERIVES the meal's `nutrition` row and its
  // `meal_allergens` rows from the ingredients. The seeder used to stop after `createMeal`, so
  // every benchmark meal had neither — and the Companion's nutrition reasoning, household nutrition
  // enrichment and Food Intelligence ranking all read exactly those two tables.
  //
  // Awaited, not fire-and-forget as the route does it, because a seeded world must be complete when
  // `resetBenchmarkHousehold` returns. Sequential awaits also keep each call under the derivation's
  // own `MAX_CONCURRENT_ANALYSES` bound, which silently skips analysis when exceeded.
  //
  // `autoAnalyzeMeal` swallows its own failures (an unreachable OpenFoodFacts leaves nutrition
  // absent rather than fabricated) and derives allergens with no network at all. An offline seed
  // therefore still produces correct allergens — an honest gap in nutrition, never a false number.
  const mealIdByName = new Map<string, number>();
  for (const meal of fixture.meals) {
    const created = await storage.createMeal(owner.id, {
      name: meal.name,
      ingredients: [...meal.ingredients],
      instructions: [],
      servings: meal.servings ?? 2,
      dietTypes: [...(meal.dietTypes ?? [])],
      mealSourceType: "scratch",
      mealFormat: "recipe",
      isReadyMeal: false,
      isSystemMeal: false,
      audience: "adult",
      kind: "meal",
    });
    await autoAnalyzeMeal(created.id);
    mealIdByName.set(meal.name, created.id);
    counts.meals++;
  }

  // 5. Planner (weeks are created through the canonical path, then entries)
  if (fixture.planner.length > 0) {
    const weeks = await storage.createPlannerWeeks(owner.id);
    for (const entry of fixture.planner) {
      const week = weeks.find((w) => w.weekNumber === entry.week);
      if (!week) continue;
      const days = await storage.getPlannerDays(week.id);
      const day = days.find((d) => d.dayOfWeek === entry.dayOfWeek);
      const mealId = mealIdByName.get(entry.mealName);
      if (!day || !mealId) continue;
      await storage.addPlannerEntry(day.id, entry.mealType, "adult", mealId);
      counts.plannerEntries++;
    }
  }

  // 6. Shopping list
  for (const item of fixture.shopping) {
    await storage.addShoppingListItem(owner.id, {
      productName: item.productName,
      normalizedName: item.normalizedName,
      category: item.category,
      quantity: item.quantity ?? 1,
      selectedTier: "standard",
      checked: item.checked ?? false,
      needsReview: false,
      matchedStore: item.matchedStore ?? null,
      matchedPrice: item.matchedPrice ?? null,
      thaRating: item.thaRating ?? null,
    });
    counts.shopping++;
  }

  // 7. Diary — entries and metrics, dated relative to the reset instant
  for (const entry of fixture.diaryEntries) {
    await storage.createFoodDiaryEntry(owner.id, offsetDateIso(entry.dayOffset), {
      mealSlot: entry.mealSlot,
      name: entry.name,
      sourceType: "manual",
    } as Parameters<typeof storage.createFoodDiaryEntry>[2]);
    counts.diaryEntries++;
  }
  for (const metrics of fixture.diaryMetrics) {
    await storage.upsertFoodDiaryMetrics(owner.id, offsetDateIso(metrics.dayOffset), {
      weightKg: metrics.weightKg ?? null,
      moodApples: metrics.moodApples ?? null,
      energyApples: metrics.energyApples ?? null,
      sleepHours: metrics.sleepHours ?? null,
      stuckToPlan: metrics.stuckToPlan ?? null,
    });
    counts.diaryMetrics++;
  }

  // 8. Evidence (EL1) — through the canonical orchestrator, once per event.
  //
  // BENCHINT2 (D7) — `recordOutcomeAndDetect` is the ONE path by which production records an
  // outcome: it appends the event and re-detects over that event's own dimension within
  // EVIDENCE_WINDOW_DAYS. The seeder used to call the low-level `recordEvent` and then re-implement
  // detection itself, with `listEvents` carrying NO window filter. The arithmetic matched — the
  // emission path and the window did not.
  //
  // `occurredAt` backdates each event to its fixture day-offset, which the orchestrator now accepts
  // explicitly rather than forcing a parallel path to exist for it.
  //
  // Signals are counted by the dimensions that produced one, not by summing per-event returns:
  // `upsertSignal` is idempotent per dimension, so N events over one dimension yield one row.
  const signalledDimensions = new Set<string>();
  for (const ev of fixture.evidence) {
    const subjectId = ev.mealName
      ? `meal:${mealIdByName.get(ev.mealName) ?? ev.mealName}`
      : (ev.subjectId ?? ev.subjectKey);
    const { signal } = await recordOutcomeAndDetect(
      {
        householdId,
        domain: "food-intelligence",
        subjectType: ev.subjectType,
        subjectId,
        subjectKey: ev.subjectKey,
        outcomeType: ev.outcomeType,
        direction: ev.direction,
        sourceCapabilityId: ev.sourceCapabilityId,
        occurredAt: offsetDate(ev.dayOffset),
      },
      evidenceLearningStore,
    );
    counts.evidenceEvents++;
    if (signal) signalledDimensions.add(`${ev.subjectType}|${ev.subjectKey}`);
  }
  counts.learningSignals = signalledDimensions.size;

  return counts;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Reset ONE household to canonical state (creates it if missing). */
export async function resetBenchmarkHousehold(id: string): Promise<HouseholdResetResult> {
  assertBenchmarkWorldAllowed();
  const fixture = getBenchmarkHouseholdFixture(id);
  if (!fixture) throw new Error(`Unknown Benchmark Household ID: ${id}`);

  const owner = await ensureAccount(fixture, "owner");
  const householdId = await ensureHousehold(fixture, owner);

  await wipeHouseholdData(householdId);
  for (const account of fixture.accounts) {
    const user = await storage.getUserByUsername(account.username);
    if (user) await wipeUserData(user.id);
  }

  const counts = await reseedHousehold(fixture, owner, householdId);

  const resetAt = new Date().toISOString();
  await storage.setSiteSetting(RESET_AT_KEY(id), resetAt);
  await storage.setSiteSetting("benchmark_world:version", BENCHMARK_WORLD_VERSION);

  return { id, householdId, ownerUserId: owner.id, counts, resetAt };
}

/** Seed (or reset) the whole world — all ten households, in canonical order. */
export async function seedBenchmarkWorld(): Promise<HouseholdResetResult[]> {
  assertBenchmarkWorldAllowed();
  const results: HouseholdResetResult[] = [];
  for (const fixture of BENCHMARK_WORLD) {
    results.push(await resetBenchmarkHousehold(fixture.id));
  }
  return results;
}

/** Current state of every benchmark household (fixture + live seeded status). */
export async function listBenchmarkHouseholdStates(): Promise<BenchmarkHouseholdState[]> {
  assertBenchmarkWorldAllowed();
  const states: BenchmarkHouseholdState[] = [];
  for (const fixture of BENCHMARK_WORLD) {
    const ownerUsername = fixture.accounts[0].username;
    const owner = await storage.getUserByUsername(ownerUsername);
    let householdId: number | null = null;
    if (owner) {
      try { householdId = await getHouseholdForUser(owner.id); } catch { /* not seeded yet */ }
    }
    const lastResetAt = await storage.getSiteSetting(RESET_AT_KEY(fixture.id));
    states.push({
      id: fixture.id,
      slug: fixture.slug,
      archetype: fixture.archetype,
      householdName: fixture.householdName,
      summary: fixture.summary,
      seeded: Boolean(owner && householdId && lastResetAt),
      ownerUserId: owner?.id ?? null,
      ownerUsername,
      householdId,
      lastResetAt,
      accounts: fixture.accounts.length,
      knownGaps: fixture.knownGaps,
      coldStart: fixture.coldStart ?? false,
    });
  }
  return states;
}

export interface BenchmarkHouseholdDetail {
  readonly state: BenchmarkHouseholdState;
  readonly fixture: BenchmarkHouseholdFixture;
  readonly live: {
    readonly members: number;
    readonly eaters: number;
    readonly meals: number;
    readonly pantryItems: number;
    readonly plannerEntries: number;
    readonly shoppingItems: number;
    readonly diaryEntries: number;
    readonly diaryMetricDays: number;
    readonly evidenceEvents: number;
    readonly learningSignals: number;
  } | null;
}

/** Fixture spec + live database snapshot counts for one household. */
export async function getBenchmarkHouseholdDetail(id: string): Promise<BenchmarkHouseholdDetail> {
  assertBenchmarkWorldAllowed();
  const fixture = getBenchmarkHouseholdFixture(id);
  if (!fixture) throw new Error(`Unknown Benchmark Household ID: ${id}`);
  const [state] = (await listBenchmarkHouseholdStates()).filter((s) => s.id === id);

  let live: BenchmarkHouseholdDetail["live"] = null;
  if (state.ownerUserId && state.householdId) {
    const ownerId = state.ownerUserId;
    const householdId = state.householdId;

    const members = await db.select({ id: householdMembers.id }).from(householdMembers)
      .where(and(eq(householdMembers.householdId, householdId), eq(householdMembers.status, "active")));
    const eaters = await storage.getHouseholdEaters(householdId);
    const ownMeals = await db.select({ id: meals.id }).from(meals).where(eq(meals.userId, ownerId));
    const pantry = await storage.getPantryItems(ownerId);
    const weeks = await db.select({ id: plannerWeeks.id }).from(plannerWeeks).where(eq(plannerWeeks.householdId, householdId));
    let plannerEntryCount = 0;
    for (const week of weeks) {
      const days = await db.select({ id: plannerDays.id }).from(plannerDays).where(eq(plannerDays.weekId, week.id));
      const dayIds = days.map((d) => d.id);
      if (dayIds.length > 0) {
        const entries = await db.select({ id: plannerEntries.id }).from(plannerEntries).where(inArray(plannerEntries.dayId, dayIds));
        plannerEntryCount += entries.length;
      }
    }
    const shopping = await db.select({ id: shoppingList.id }).from(shoppingList).where(eq(shoppingList.userId, ownerId));
    const diary = await db.select({ id: foodDiaryEntries.id }).from(foodDiaryEntries).where(eq(foodDiaryEntries.userId, ownerId));
    const metrics = await db.select({ id: foodDiaryMetrics.id }).from(foodDiaryMetrics).where(eq(foodDiaryMetrics.userId, ownerId));
    const events = await db.select({ id: householdEvidenceEvents.id }).from(householdEvidenceEvents).where(eq(householdEvidenceEvents.householdId, householdId));
    const signals = await db.select({ id: householdLearningSignals.id }).from(householdLearningSignals).where(eq(householdLearningSignals.householdId, householdId));

    live = {
      members: members.length,
      eaters: eaters.length,
      meals: ownMeals.length,
      pantryItems: pantry.length,
      plannerEntries: plannerEntryCount,
      shoppingItems: shopping.length,
      diaryEntries: diary.length,
      diaryMetricDays: metrics.length,
      evidenceEvents: events.length,
      learningSignals: signals.length,
    };
  }

  return { state, fixture, live };
}

/** Resolve the owner User row for a benchmark household (for impersonation / runs). */
export async function resolveBenchmarkOwner(id: string): Promise<User | null> {
  assertBenchmarkWorldAllowed();
  const fixture = getBenchmarkHouseholdFixture(id);
  if (!fixture) return null;
  return (await storage.getUserByUsername(fixture.accounts[0].username)) ?? null;
}
