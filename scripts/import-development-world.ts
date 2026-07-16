/**
 * DEVWORLD2 — Import: THA Development World, Foundation 50
 * =======================================================
 *
 * Dev-only, idempotent importer for the committed canonical dataset at
 *   data/development_world/development_world_foundation_50.v1.json
 *
 * See docs/implementation/DEVWORLD2_DEVELOPMENT_WORLD_IMPORT.md, and the two
 * predecessor investigations it implements:
 *   - docs/investigations/development_world/DEVWORLD1_DEVELOPMENT_WORLD_SCHEMA_DISCOVERY.md
 *   - docs/investigations/development_world/DEVWORLD2_PRE_IMPLEMENTATION_FINDINGS.md
 *
 * What it does
 *   - Imports 50 fictional development households into the DEV database through
 *     the SAME production write paths the app uses — never a parallel schema.
 *     Accounts via storage.createUser, households via createHouseholdForUser,
 *     the second adult via the real invite/accept path storage.joinHousehold,
 *     preferences/eaters/pantry/planner/diary via the ordinary storage methods,
 *     evidence via the canonical EL1 orchestrator recordOutcomeAndDetect.
 *
 *   - REFERENCES meals; never authors them. Every household points at the
 *     founding-cookbook SYSTEM meals (user_id=0, is_system_meal=true) by their
 *     stable import_key ("tha_original:THA-###", stored in
 *     meals.acquisition_source_key). Planner, diary, freezer and evidence rows
 *     carry the resolved SYSTEM meal id. No recipe body, canonical food,
 *     nutrition row, allergen row or derived shopping row is ever written here —
 *     the Cookbook owns those and the platform derives them.
 *
 *   - VALIDATES before writing. Every referenced import_key across every
 *     household is resolved against the existing system meals FIRST. If any
 *     reference does not resolve, the import aborts before the first write and
 *     lists the missing keys (mission: "Validate every recipe_id/import_key
 *     against existing system meals before writing").
 *
 * Idempotency / reset
 *   - Identity is the deterministic username, not a row id. A rerun resolves the
 *     same accounts, performs a scoped wipe of their data + the household's
 *     planner/eaters/evidence, and reseeds to canonical state — no duplicates.
 *     The wipe is scoped strictly to the accounts resolved from the file's own
 *     usernames; it can never touch another user's data, and never deletes a
 *     system meal (those are user_id=0, outside every account scope).
 *
 * Honest gaps (authored intent the platform has nowhere to store — never faked)
 *   - Cookbook segmentation (adopted / regular / discovery-queue meal refs) has
 *     no schema. System meals are globally visible to every dev account, so the
 *     cookbook reference is satisfied WITHOUT a write; the segmentation is not
 *     persisted. Validated for resolvability, then dropped.
 *   - Shopping list is a DERIVED output (planner + freezer → generate-from-meals,
 *     which also writes ingredient_sources). It is not seeded here; it
 *     regenerates on demand. `generateShoppingList` is honoured as intent only.
 *   - persona.*, qualityPurpose, eater ageYears, diary fromPlannerMeal linkage
 *     have no column and are written nowhere — a question about them yields an
 *     honest gap, not a fabrication.
 *   - nutrition / meal_allergens / learning_signals / observations /
 *     conversations / opportunity_deliveries are derived or forbidden and never
 *     authored (architectureControls.forbiddenAuthoredFields).
 *
 * Usage
 *   npx tsx scripts/import-development-world.ts                 # import/reset all 50
 *   npx tsx scripts/import-development-world.ts --household DW006
 *   npx tsx scripts/import-development-world.ts --validate-only # resolve refs, write nothing
 *   npx tsx scripts/import-development-world.ts --rollback      # wipe all 50 DEV households
 *
 * Production guard: refuses to run when NODE_ENV=production. No override.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { and, eq, inArray, like } from "drizzle-orm";

import { db, pool } from "../server/db";
import { storage } from "../server/storage";
import { hashPassword } from "../server/auth";
import { getHouseholdForUser } from "../server/lib/household";
import { evidenceLearningStore } from "../server/intelligence/evidence-learning/evidence-learning-store";
import { recordOutcomeAndDetect } from "../server/intelligence/evidence-learning/framework";
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
} from "@shared/schema";

// ---------------------------------------------------------------------------
// Environment guard — the world exists in DEV only, with no override
// ---------------------------------------------------------------------------

function assertDevelopmentWorldAllowed(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "DEVWORLD2 import is DEV-only. Refusing to touch a production environment.",
    );
  }
}

function devWorldPassword(): string {
  return process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only";
}

// ---------------------------------------------------------------------------
// The world file — parsed shape (inputs only; derived/forbidden keys ignored)
// ---------------------------------------------------------------------------

const IMPORT_KEY_PREFIX = "tha_original:";

interface MealRef {
  recipe_id: string;
  import_key: string;
  name: string;
  category?: string;
  cuisine?: string;
  difficulty?: string;
  servings?: number;
  total_minutes?: number;
}

interface Account {
  key: "owner" | "partner";
  username: string;
  displayName: string;
  firstName: string;
  dietPattern?: string | null;
  dietRestrictions?: string[];
  eatingSchedule?: string;
  subscriptionTier?: "free" | "premium" | "friends_family";
}

interface Eater {
  displayName: string;
  accountKey?: "owner" | "partner";
  ageYears?: number;
  defaultDietTypes?: string[];
  hardRestrictions?: string[];
}

interface Preferences {
  dietTypes?: string[];
  excludedIngredients?: string[];
  healthGoals?: string[];
  goalType?: string;
  budgetLevel?: string;
  activityLevel?: string;
  preferredStores?: string[];
  preferredIngredients?: string[];
  calorieTarget?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;
  adultsCount?: number;
  childrenCount?: number;
  maxTotalCookTime?: number | null;
  plannerEnableChildMeals?: boolean;
  companionPersonality?: string;
}

interface PlannerEntryFixture {
  week: number;
  dayOfWeek: number;
  mealType: string;
  mealRef: MealRef;
  eaters?: string[];
}

interface FreezerFixture {
  mealRef: MealRef;
  totalPortions?: number;
  remainingPortions?: number;
  frozenDayOffset?: number;
}

interface ShoppingExtraFixture {
  name: string;
  category?: string;
  alwaysAdd?: boolean;
}

interface DiaryEntryFixture {
  dayOffset: number;
  mealSlot: string;
  mealRef: MealRef;
  fromPlannerMealRef?: MealRef;
}

interface DiaryMetricFixture {
  dayOffset: number;
  weightKg?: number | null;
  moodApples?: number | null;
  energyApples?: number | null;
  sleepHours?: number | null;
  stuckToPlan?: boolean | null;
}

interface EvidenceFixture {
  subjectType: string;
  subjectKey: string;
  subjectId?: string;
  mealRef?: MealRef;
  outcomeType: string;
  direction: "positive" | "negative" | "neutral";
  dayOffset: number;
  sourceCapabilityId: string;
}

interface CookbookRefs {
  adoptedMealRefs?: MealRef[];
  regularMealRefs?: MealRef[];
  discoveryQueueMealRefs?: MealRef[];
}

interface HouseholdFixture {
  id: string;
  slug: string;
  archetype: string;
  householdName: string;
  summary: string;
  coldStart?: boolean;
  accounts: Account[];
  eaters: Eater[];
  preferences: Preferences;
  pantry?: { ingredient: string; category: string; displayName?: string }[];
  cookbookRefs?: CookbookRefs;
  planner?: PlannerEntryFixture[];
  freezer?: FreezerFixture[];
  shoppingExtras?: ShoppingExtraFixture[];
  generateShoppingList?: boolean;
  diaryEntries?: DiaryEntryFixture[];
  diaryMetrics?: DiaryMetricFixture[];
  evidence?: EvidenceFixture[];
  knownGaps?: string[];
}

interface WorldFile {
  world: { version: string; accountDomain: string; clock: string };
  households: HouseholdFixture[];
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.resolve(
  HERE,
  "../data/development_world/development_world_foundation_50.v1.json",
);

function loadWorld(): WorldFile {
  const raw = JSON.parse(fs.readFileSync(SOURCE, "utf8"));
  if (!raw.world || !Array.isArray(raw.households)) {
    throw new Error("Development World file is malformed: missing world/households.");
  }
  if (raw.world.clock !== "reset-relative") {
    throw new Error(`Development World clock must be "reset-relative"; got "${raw.world.clock}".`);
  }
  return raw as WorldFile;
}

// ---------------------------------------------------------------------------
// Reference validation — resolve every import_key to a SYSTEM meal FIRST
// ---------------------------------------------------------------------------

interface RefValidation {
  systemMealByKey: Map<string, number>;
  totalRefs: number;
  uniqueRefs: number;
  unresolved: string[];
}

/** Every import_key a household references, across all reference-bearing collections. */
function collectHouseholdRefs(h: HouseholdFixture): string[] {
  const keys: string[] = [];
  const push = (m?: MealRef) => { if (m?.import_key) keys.push(m.import_key); };
  (h.planner ?? []).forEach((p) => push(p.mealRef));
  (h.freezer ?? []).forEach((f) => push(f.mealRef));
  (h.diaryEntries ?? []).forEach((d) => { push(d.mealRef); push(d.fromPlannerMealRef); });
  (h.evidence ?? []).forEach((e) => push(e.mealRef));
  const cb = h.cookbookRefs;
  if (cb) {
    (cb.adoptedMealRefs ?? []).forEach(push);
    (cb.regularMealRefs ?? []).forEach(push);
    (cb.discoveryQueueMealRefs ?? []).forEach(push);
  }
  return keys;
}

async function validateReferences(world: WorldFile): Promise<RefValidation> {
  // Single read of the founding-cookbook system corpus; build the resolution index.
  const sys = await db
    .select({ id: meals.id, key: meals.acquisitionSourceKey })
    .from(meals)
    .where(and(eq(meals.isSystemMeal, true), like(meals.acquisitionSourceKey, `${IMPORT_KEY_PREFIX}%`)));
  const systemMealByKey = new Map<string, number>();
  for (const row of sys) if (row.key) systemMealByKey.set(row.key, row.id);

  const allRefs: string[] = [];
  for (const h of world.households) allRefs.push(...collectHouseholdRefs(h));
  const uniqueRefs = new Set(allRefs);

  const unresolved: string[] = [];
  for (const key of uniqueRefs) {
    if (!systemMealByKey.has(key)) unresolved.push(key);
  }
  unresolved.sort();

  return {
    systemMealByKey,
    totalRefs: allRefs.length,
    uniqueRefs: uniqueRefs.size,
    unresolved,
  };
}

// ---------------------------------------------------------------------------
// Account + household resolution (deterministic usernames are the registry)
// ---------------------------------------------------------------------------

async function ensureAccount(fixture: HouseholdFixture, key: "owner" | "partner"): Promise<User> {
  const account = fixture.accounts.find((a) => a.key === key);
  if (!account) throw new Error(`${fixture.id}: no "${key}" account in fixture`);

  let user = await storage.getUserByUsername(account.username);
  if (!user) {
    user = await storage.createUser({
      username: account.username,
      password: await hashPassword(devWorldPassword()),
    });
  }

  // Canonical profile + dev-world account flags. Direct column update — the
  // verified/beta flags have no storage setter (registration is closed in dev),
  // matching how the Benchmark World seeder and createDemoUser set them.
  // CONV1 P4 (OWN-1): users.diet* is retired — the fixture's account-level diet is
  // seeded onto the eater row (the canonical owner) by the eater loop below.
  const [updated] = await db.update(users).set({
    displayName: account.displayName,
    firstName: account.firstName,
    eatingSchedule: account.eatingSchedule ?? "None",
    isBetaUser: true,
    emailVerified: true,
    onboardingCompleted: !fixture.coldStart,
    starterMealsLoaded: true,
    isDemo: false,
    role: "user",
  }).where(eq(users.id, user.id)).returning();

  if (account.subscriptionTier) {
    await storage.setUserSubscriptionTier(updated.id, account.subscriptionTier);
  }
  return updated;
}

async function ensureHousehold(fixture: HouseholdFixture, owner: User): Promise<number> {
  let householdId: number;
  try {
    householdId = await getHouseholdForUser(owner.id);
  } catch {
    const hh = await storage.createHouseholdForUser(owner.id, fixture.householdName);
    householdId = hh.id;
  }
  await db.update(households).set({ name: fixture.householdName }).where(eq(households.id, householdId));

  // Attach the partner through the real invite/accept path — the ONE way a
  // second adult joins a household in the product. A raw membership INSERT would
  // orphan the partner's auto-created solo household (BENCHINT2 D11).
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
// Wipe — scoped, total, dev-only (identical policy to the Benchmark World)
// ---------------------------------------------------------------------------

async function wipeUserData(userId: number): Promise<void> {
  const items = await db.select({ id: shoppingList.id }).from(shoppingList).where(eq(shoppingList.userId, userId));
  const itemIds = items.map((i) => i.id);
  if (itemIds.length > 0) {
    await db.delete(ingredientSources).where(inArray(ingredientSources.shoppingListItemId, itemIds));
    await db.delete(productMatches).where(inArray(productMatches.shoppingListItemId, itemIds));
  }
  await db.delete(shoppingList).where(eq(shoppingList.userId, userId));
  await db.delete(shoppingListExtras).where(eq(shoppingListExtras.userId, userId));
  await db.delete(basketItems).where(eq(basketItems.userId, userId));

  await db.delete(userPantryItems).where(eq(userPantryItems.userId, userId));
  await db.delete(freezerMeals).where(eq(freezerMeals.userId, userId));
  await db.delete(productHistory).where(eq(productHistory.userId, userId));

  await db.delete(foodDiaryEntries).where(eq(foodDiaryEntries.userId, userId));
  await db.delete(foodDiaryDays).where(eq(foodDiaryDays.userId, userId));
  await db.delete(foodDiaryMetrics).where(eq(foodDiaryMetrics.userId, userId));

  // Any owner-authored meals (there are none in this world — meals are
  // referenced, not authored — but keep the teardown total and symmetric).
  // System meals (user_id=0) are outside this scope and are never touched.
  const own = await db.select({ id: meals.id }).from(meals).where(eq(meals.userId, userId));
  const mealIds = own.map((m) => m.id);
  if (mealIds.length > 0) {
    await db.delete(nutrition).where(inArray(nutrition.mealId, mealIds));
    await db.delete(mealAllergens).where(inArray(mealAllergens.mealId, mealIds));
    await db.delete(mealDiets).where(inArray(mealDiets.mealId, mealIds));
  }
  await db.delete(meals).where(eq(meals.userId, userId));

  const plans = await db.select({ id: mealPlans.id }).from(mealPlans).where(eq(mealPlans.userId, userId));
  const planIds = plans.map((p) => p.id);
  if (planIds.length > 0) {
    await db.delete(mealPlanEntries).where(inArray(mealPlanEntries.planId, planIds));
  }
  await db.delete(mealPlans).where(eq(mealPlans.userId, userId));

  await db.delete(userPreferences).where(eq(userPreferences.userId, userId));
  await db.delete(userStreaks).where(eq(userStreaks.userId, userId));
  await db.delete(userHealthTrends).where(eq(userHealthTrends.userId, userId));
  await db.delete(savingsEvents).where(eq(savingsEvents.userId, userId));
  await db.delete(userItemUsage).where(eq(userItemUsage.userId, userId));
  await db.delete(activitySummary).where(eq(activitySummary.userId, userId));

  await db.delete(conversations).where(eq(conversations.userId, userId));
  await db.delete(opportunityDeliveries).where(eq(opportunityDeliveries.userId, userId));
}

async function wipeHouseholdData(householdId: number): Promise<void> {
  const weeks = await db.select({ id: plannerWeeks.id }).from(plannerWeeks).where(eq(plannerWeeks.householdId, householdId));
  for (const week of weeks) {
    const days = await db.select({ id: plannerDays.id }).from(plannerDays).where(eq(plannerDays.weekId, week.id));
    const dayIds = days.map((d) => d.id);
    if (dayIds.length > 0) {
      // planner_entry_eaters / overrides / provisioning cascade from the entry FK.
      await db.delete(plannerEntries).where(inArray(plannerEntries.dayId, dayIds));
    }
    await db.delete(plannerDays).where(eq(plannerDays.weekId, week.id));
  }
  await db.delete(plannerWeeks).where(eq(plannerWeeks.householdId, householdId));

  await db.delete(householdEaters).where(eq(householdEaters.householdId, householdId));

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

type Counts = Record<string, number>;

async function reseedHousehold(
  fixture: HouseholdFixture,
  owner: User,
  householdId: number,
  systemMealByKey: Map<string, number>,
): Promise<Counts> {
  const counts: Counts = {
    eaters: 0, pantry: 0, plannerEntries: 0, plannerEntryEaters: 0,
    freezer: 0, shoppingExtras: 0, diaryEntries: 0, diaryMetrics: 0,
    evidenceEvents: 0, learningSignals: 0, mealRefsResolved: 0,
  };

  // The cold-start household seeds nothing beyond the account + empty household.
  if (fixture.coldStart) return counts;

  const resolveMeal = (m: MealRef | undefined): number | null => {
    if (!m?.import_key) return null;
    const id = systemMealByKey.get(m.import_key) ?? null;
    if (id !== null) counts.mealRefsResolved++;
    return id;
  };

  // 1. Preferences (owner-scoped profile the Companion reads) — companionPersonality included.
  const p = fixture.preferences ?? {};
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
    companionPersonality: p.companionPersonality ?? "companion",
  } as Parameters<typeof storage.upsertUserPreferences>[1]);

  // 2. Eaters — the reset wiped this household's eater rows above, so recreate the
  // members' rows first (CONV1 P4 / WRITE-3: creation is otherwise a membership
  // event), then adjust to fixture detail; children created.
  const activeMembers = await db.select({ userId: householdMembers.userId }).from(householdMembers)
    .where(and(eq(householdMembers.householdId, householdId), eq(householdMembers.status, "active")));
  for (const m of activeMembers) {
    await storage.ensureEaterForMember(householdId, m.userId);
  }
  const syncedEaters = await storage.getHouseholdEaters(householdId);
  for (const eater of fixture.eaters) {
    if (eater.accountKey) {
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
  // Map eater displayName → id for planner entry eaters.
  const eaterIdByName = new Map<string, number>();
  for (const e of await storage.getHouseholdEaters(householdId)) eaterIdByName.set(e.displayName, e.id);

  // 3. Pantry
  for (const item of fixture.pantry ?? []) {
    await storage.addPantryItem(owner.id, item.ingredient, item.category, undefined, item.displayName);
    counts.pantry++;
  }

  // 4. Planner — weeks via the canonical 6×7 canvas, entries reference SYSTEM meals.
  if ((fixture.planner ?? []).length > 0) {
    const weeks = await storage.createPlannerWeeks(owner.id);
    for (const entry of fixture.planner!) {
      const week = weeks.find((w) => w.weekNumber === entry.week);
      if (!week) continue;
      const days = await storage.getPlannerDays(week.id);
      const day = days.find((d) => d.dayOfWeek === entry.dayOfWeek);
      const mealId = resolveMeal(entry.mealRef);
      if (!day || mealId === null) continue;
      const created = await storage.addPlannerEntry(day.id, entry.mealType, "adult", mealId);
      counts.plannerEntries++;
      if (entry.eaters && entry.eaters.length > 0) {
        const eaterIds = entry.eaters.map((n) => eaterIdByName.get(n)).filter((x): x is number => x != null);
        if (eaterIds.length > 0) {
          await storage.setPlannerEntryEaters(created.id, eaterIds);
          counts.plannerEntryEaters += eaterIds.length;
        }
      }
    }
  }

  // 5. Freezer — references a SYSTEM meal id; portions + frozen date authored.
  for (const f of fixture.freezer ?? []) {
    const mealId = resolveMeal(f.mealRef);
    if (mealId === null) continue;
    await storage.addFreezerMeal(owner.id, {
      mealId,
      totalPortions: f.totalPortions ?? 1,
      remainingPortions: f.remainingPortions ?? f.totalPortions ?? 1,
      frozenDate: offsetDateIso(f.frozenDayOffset ?? 0),
    } as Parameters<typeof storage.addFreezerMeal>[1]);
    counts.freezer++;
  }

  // 6. Shopping EXTRAS (authored staples) — NOT the derived shopping list.
  for (const e of fixture.shoppingExtras ?? []) {
    await storage.addShoppingListExtra(owner.id, e.name, e.category ?? "household", e.alwaysAdd ?? false);
    counts.shoppingExtras++;
  }

  // 7. Diary — entries carry the referenced meal's NAME (the diary is free text);
  //    metrics are the user's self-report. Both dated relative to the reset instant.
  for (const entry of fixture.diaryEntries ?? []) {
    await storage.createFoodDiaryEntry(owner.id, offsetDateIso(entry.dayOffset), {
      mealSlot: entry.mealSlot,
      name: entry.mealRef?.name ?? "",
      sourceType: "manual",
    } as Parameters<typeof storage.createFoodDiaryEntry>[2]);
    counts.diaryEntries++;
  }
  for (const m of fixture.diaryMetrics ?? []) {
    await storage.upsertFoodDiaryMetrics(owner.id, offsetDateIso(m.dayOffset), {
      weightKg: m.weightKg ?? null,
      moodApples: m.moodApples ?? null,
      energyApples: m.energyApples ?? null,
      sleepHours: m.sleepHours ?? null,
      stuckToPlan: m.stuckToPlan ?? null,
    });
    counts.diaryMetrics++;
  }

  // 8. Evidence (EL1) — through the canonical orchestrator, once per event.
  //    A meal-subject event's subjectId is meal:<systemMealId>; a swap uses its
  //    authored subjectId. occurredAt backdates to the fixture day-offset.
  //    Signals are counted by dimension (upsertSignal is idempotent per dimension).
  const signalledDimensions = new Set<string>();
  for (const ev of fixture.evidence ?? []) {
    let subjectId: string;
    if (ev.mealRef) {
      const mealId = resolveMeal(ev.mealRef);
      subjectId = mealId !== null ? `meal:${mealId}` : ev.subjectKey;
    } else {
      subjectId = ev.subjectId ?? ev.subjectKey;
    }
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
// Per-household orchestration + stamping
// ---------------------------------------------------------------------------

const RESET_AT_KEY = (id: string) => `development_world:${id}:last_reset_at`;
const VERSION_KEY = "development_world:version";

async function resetHousehold(
  fixture: HouseholdFixture,
  world: WorldFile,
  systemMealByKey: Map<string, number>,
): Promise<Counts> {
  const owner = await ensureAccount(fixture, "owner");
  const householdId = await ensureHousehold(fixture, owner);

  await wipeHouseholdData(householdId);
  for (const account of fixture.accounts) {
    const user = await storage.getUserByUsername(account.username);
    if (user) await wipeUserData(user.id);
  }

  const counts = await reseedHousehold(fixture, owner, householdId, systemMealByKey);

  await storage.setSiteSetting(RESET_AT_KEY(fixture.id), new Date().toISOString());
  await storage.setSiteSetting(VERSION_KEY, world.world.version);
  return counts;
}

async function rollbackHousehold(fixture: HouseholdFixture): Promise<void> {
  // Resolve accounts by their deterministic usernames and wipe them, scoped.
  const owner = await storage.getUserByUsername(fixture.accounts[0].username);
  if (owner) {
    try {
      const householdId = await getHouseholdForUser(owner.id);
      await wipeHouseholdData(householdId);
    } catch { /* no household — nothing to wipe */ }
  }
  for (const account of fixture.accounts) {
    const user = await storage.getUserByUsername(account.username);
    if (user) await wipeUserData(user.id);
  }
  await storage.setSiteSetting(RESET_AT_KEY(fixture.id), "");
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function totals(all: Counts[]): Counts {
  const sum: Counts = {};
  for (const c of all) for (const [k, v] of Object.entries(c)) sum[k] = (sum[k] ?? 0) + v;
  return sum;
}

function printCounts(label: string, c: Counts): void {
  console.log(`\n──────── ${label} ────────`);
  for (const [k, v] of Object.entries(c)) console.log(`  ${k.padEnd(20)}: ${v}`);
}

async function main(): Promise<void> {
  assertDevelopmentWorldAllowed();

  const args = process.argv.slice(2);
  const validateOnly = args.includes("--validate-only");
  const rollback = args.includes("--rollback");
  const hhIdx = args.indexOf("--household");
  const onlyId = hhIdx >= 0 ? args[hhIdx + 1] : null;

  const world = loadWorld();
  let households = world.households;
  if (onlyId) {
    households = households.filter((h) => h.id === onlyId);
    if (households.length === 0) throw new Error(`Unknown household id: ${onlyId}`);
  }

  console.log(`DEVWORLD2 importer — ${SOURCE}`);
  console.log(`World version ${world.world.version} · clock ${world.world.clock} · ${world.households.length} households (${households.length} selected)`);

  // Validation ALWAYS runs before any write — this is the mission's hard gate.
  const ref = await validateReferences(world);
  console.log(`\nReference validation:`);
  console.log(`  system meals indexed : ${ref.systemMealByKey.size}`);
  console.log(`  meal references      : ${ref.totalRefs} (${ref.uniqueRefs} unique)`);
  console.log(`  unresolved           : ${ref.unresolved.length}`);
  if (ref.unresolved.length > 0) {
    console.error(`\nABORT — ${ref.unresolved.length} referenced meal(s) do not resolve to a system meal:`);
    ref.unresolved.slice(0, 25).forEach((k) => console.error(`  - ${k}`));
    if (ref.unresolved.length > 25) console.error(`  … and ${ref.unresolved.length - 25} more`);
    console.error(`\nImport the founding cookbook first: npx tsx scripts/import-tha-founding-cookbook-500.ts`);
    process.exitCode = 1;
    await pool.end();
    return;
  }
  console.log(`  ✓ every meal reference resolves to an existing system meal`);

  if (validateOnly) {
    console.log(`\n--validate-only: no rows written.`);
    await pool.end();
    return;
  }

  if (rollback) {
    for (const h of households) {
      await rollbackHousehold(h);
      console.log(`  rolled back ${h.id} (${h.householdName})`);
    }
    console.log(`\nROLLBACK complete: wiped ${households.length} DEV development-world household(s).`);
    await pool.end();
    return;
  }

  const all: Counts[] = [];
  for (const h of households) {
    const c = await resetHousehold(h, world, ref.systemMealByKey);
    all.push(c);
    console.log(`  ✓ ${h.id} ${h.householdName.padEnd(32)} planner=${c.plannerEntries} pantry=${c.pantry} diary=${c.diaryEntries} evidence=${c.evidenceEvents}`);
  }

  printCounts("IMPORT TOTALS", totals(all));
  console.log(`\nHouseholds imported : ${households.length}`);
  console.log(`Honest gaps (not written): cookbook segmentation (no schema), shopping list (derived),`);
  console.log(`  persona / qualityPurpose / eater ageYears / diary planner-linkage (no column),`);
  console.log(`  nutrition / allergens / learning signals / observations / conversations (derived or forbidden).`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
