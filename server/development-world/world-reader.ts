/**
 * world-reader.ts — DEVWORLD3 Development World (READ-ONLY reader)
 * ================================================================
 * The read-only half of the DEVWORLD2 importer / Benchmark world-seeder. It
 * displays the 50 Development World households DEVWORLD2 imported — it never
 * seeds, resets, impersonates or writes anything.
 *
 * Discipline shared with server/benchmark/world-seeder.ts and
 * scripts/import-development-world.ts (deliberately NOT duplicated logic — the
 * same patterns, read-only):
 *   - DEV ONLY. Every entry point calls assertDevelopmentWorldAllowed() and
 *     refuses to run when NODE_ENV === "production". No override.
 *   - SAME CANONICAL DATASET. Reads the exact file DEVWORLD2 imported from,
 *     data/development_world/development_world_foundation_50.v1.json, parsed
 *     once and cached in module scope.
 *   - SAME IDENTITY RESOLUTION. A household's live state is resolved by its
 *     deterministic owner username + getHouseholdForUser — no new identity space.
 *   - SAME LIVE-SNAPSHOT QUERIES. The detail snapshot counts members / eaters /
 *     pantry / planner / diary / evidence / signals with the same query shape
 *     getBenchmarkHouseholdDetail uses.
 *   - NO WRITE PATH. There is no seed / reset / impersonate here by design.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { eq, and, inArray } from "drizzle-orm";

import { db } from "../db.js";
import { storage } from "../storage.js";
import { getHouseholdForUser } from "../lib/household.js";
import {
  householdMembers, meals,
  plannerWeeks, plannerDays, plannerEntries,
  shoppingList, foodDiaryEntries, foodDiaryMetrics,
  householdEvidenceEvents, householdLearningSignals,
} from "../../shared/schema.js";

// ---------------------------------------------------------------------------
// Environment guard — the world exists in DEV only, with no override
// ---------------------------------------------------------------------------

export function developmentWorldAllowed(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function assertDevelopmentWorldAllowed(): void {
  if (!developmentWorldAllowed()) {
    throw new Error(
      "Development World admin is DEV-only. Refusing to touch a production environment.",
    );
  }
}

// ---------------------------------------------------------------------------
// The world file — parsed shape (mirrors scripts/import-development-world.ts;
// only the fields this read-only view surfaces are typed).
// ---------------------------------------------------------------------------

export interface DwMealRef {
  recipe_id?: string;
  import_key?: string;
  name: string;
  category?: string;
  cuisine?: string;
}

export interface DwAccount {
  key: "owner" | "partner";
  username: string;
  displayName: string;
  firstName?: string;
  dietPattern?: string | null;
  dietRestrictions?: string[];
  eatingSchedule?: string;
  subscriptionTier?: "free" | "premium" | "friends_family";
}

export interface DwEater {
  displayName: string;
  accountKey?: "owner" | "partner";
  ageYears?: number;
  defaultDietTypes?: string[];
  hardRestrictions?: string[];
}

export interface DwPreferences {
  dietTypes?: string[];
  excludedIngredients?: string[];
  healthGoals?: string[];
  goalType?: string;
  budgetLevel?: string;
  activityLevel?: string;
  companionPersonality?: string;
  [k: string]: unknown;
}

export interface DwCookbookRefs {
  adoptedMealRefs?: DwMealRef[];
  regularMealRefs?: DwMealRef[];
  discoveryQueueMealRefs?: DwMealRef[];
  notes?: string;
}

export interface DwHouseholdFixture {
  id: string;
  slug: string;
  archetype: string;
  householdName: string;
  summary: string;
  coldStart?: boolean;
  accounts: DwAccount[];
  eaters: DwEater[];
  preferences: DwPreferences;
  pantry?: { ingredient: string; category: string; displayName?: string }[];
  cookbookRefs?: DwCookbookRefs;
  planner?: unknown[];
  freezer?: unknown[];
  shoppingExtras?: unknown[];
  diaryEntries?: unknown[];
  diaryMetrics?: unknown[];
  evidence?: unknown[];
  knownGaps?: string[];
}

interface WorldFile {
  world: { version: string; accountDomain: string; clock: string };
  households: DwHouseholdFixture[];
}

interface ValidationManifest {
  valid: boolean;
  violations: string[];
  violationCount: number;
  validatedRecipeRefs: number;
  validatedUsernames: number;
  validatedHouseholds: number;
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(HERE, "../../data/development_world");
const SOURCE = path.join(DATA_DIR, "development_world_foundation_50.v1.json");
const VALIDATION_MANIFEST = path.join(DATA_DIR, "manifests", "validation_manifest.json");

// Parsed-once cache (module scope) — the dataset is a committed, immutable file.
// Committed under REL1 (2026-07-11); before that it was untracked, so a clean
// checkout resolved SOURCE to nothing and this reader threw a bare ENOENT.
let cachedWorld: WorldFile | null = null;
let cachedValidation: ValidationManifest | null = null;

function loadWorld(): WorldFile {
  if (cachedWorld) return cachedWorld;
  if (!fs.existsSync(SOURCE)) {
    throw new Error(
      `Development World dataset is missing at ${SOURCE}. It is a committed, dev-only ` +
        `asset (REL1) and is never read in production — a clean checkout should contain it. ` +
        `Run: npm run verify:release-packaging`,
    );
  }
  const raw = JSON.parse(fs.readFileSync(SOURCE, "utf8"));
  if (!raw.world || !Array.isArray(raw.households)) {
    throw new Error("Development World file is malformed: missing world/households.");
  }
  cachedWorld = raw as WorldFile;
  return cachedWorld;
}

function loadValidation(): ValidationManifest | null {
  if (cachedValidation) return cachedValidation;
  try {
    cachedValidation = JSON.parse(fs.readFileSync(VALIDATION_MANIFEST, "utf8")) as ValidationManifest;
  } catch {
    cachedValidation = null;
  }
  return cachedValidation;
}

export function DEVELOPMENT_WORLD_VERSION(): string {
  return loadWorld().world.version;
}

function getFixture(id: string): DwHouseholdFixture | undefined {
  return loadWorld().households.find((h) => h.id === id);
}

const RESET_AT_KEY = (id: string) => `development_world:${id}:last_reset_at`;

// ---------------------------------------------------------------------------
// Authored statistics — derived from the canonical dataset (fast, always available)
// ---------------------------------------------------------------------------

export interface DwAuthoredStats {
  readonly eaters: number;
  readonly pantryItems: number;
  readonly plannerEntries: number;
  readonly freezerMeals: number;
  readonly shoppingExtras: number;
  readonly diaryEntries: number;
  readonly diaryMetricDays: number;
  readonly evidenceEvents: number;
  readonly cookbookRefs: number;
}

function authoredStats(h: DwHouseholdFixture): DwAuthoredStats {
  const cb = h.cookbookRefs;
  const cookbookRefs =
    (cb?.adoptedMealRefs?.length ?? 0) +
    (cb?.regularMealRefs?.length ?? 0) +
    (cb?.discoveryQueueMealRefs?.length ?? 0);
  return {
    eaters: h.eaters?.length ?? 0,
    pantryItems: h.pantry?.length ?? 0,
    plannerEntries: h.planner?.length ?? 0,
    freezerMeals: h.freezer?.length ?? 0,
    shoppingExtras: h.shoppingExtras?.length ?? 0,
    diaryEntries: h.diaryEntries?.length ?? 0,
    diaryMetricDays: h.diaryMetrics?.length ?? 0,
    evidenceEvents: h.evidence?.length ?? 0,
    cookbookRefs,
  };
}

function ownerAccount(h: DwHouseholdFixture): DwAccount | undefined {
  return h.accounts.find((a) => a.key === "owner") ?? h.accounts[0];
}

function subscriptionTier(h: DwHouseholdFixture): string {
  return ownerAccount(h)?.subscriptionTier ?? "free";
}

function companionPersonality(h: DwHouseholdFixture): string {
  return h.preferences?.companionPersonality ?? "companion";
}

// ---------------------------------------------------------------------------
// List — every household: summary + authored stats + live seeded status
// ---------------------------------------------------------------------------

export interface DevelopmentWorldHouseholdState {
  readonly id: string;
  readonly slug: string;
  readonly householdName: string;
  readonly householdType: string;
  readonly summary: string;
  readonly members: number;
  readonly subscriptionTier: string;
  readonly companionPersonality: string;
  readonly coldStart: boolean;
  readonly seeded: boolean;
  readonly ownerUserId: number | null;
  readonly ownerUsername: string;
  readonly householdId: number | null;
  readonly lastResetAt: string | null;
  readonly authored: DwAuthoredStats;
}

/** Resolve a household's live seeded status (owner + household + last reset). */
async function resolveSeeded(h: DwHouseholdFixture): Promise<{
  seeded: boolean; ownerUserId: number | null; householdId: number | null; lastResetAt: string | null;
}> {
  const owner = await storage.getUserByUsername(ownerAccount(h)!.username);
  let householdId: number | null = null;
  if (owner) {
    try { householdId = await getHouseholdForUser(owner.id); } catch { /* not seeded yet */ }
  }
  const lastResetAt = await storage.getSiteSetting(RESET_AT_KEY(h.id));
  return {
    seeded: Boolean(owner && householdId && lastResetAt),
    ownerUserId: owner?.id ?? null,
    householdId,
    lastResetAt: lastResetAt || null,
  };
}

export async function listDevelopmentWorldHouseholdStates(): Promise<DevelopmentWorldHouseholdState[]> {
  assertDevelopmentWorldAllowed();
  const world = loadWorld();
  const states: DevelopmentWorldHouseholdState[] = [];
  for (const h of world.households) {
    const owner = ownerAccount(h)!;
    const seeded = await resolveSeeded(h);
    states.push({
      id: h.id,
      slug: h.slug,
      householdName: h.householdName,
      householdType: h.archetype,
      summary: h.summary,
      members: h.accounts.length,
      subscriptionTier: subscriptionTier(h),
      companionPersonality: companionPersonality(h),
      coldStart: h.coldStart ?? false,
      seeded: seeded.seeded,
      ownerUserId: seeded.ownerUserId,
      ownerUsername: owner.username,
      householdId: seeded.householdId,
      lastResetAt: seeded.lastResetAt,
      authored: authoredStats(h),
    });
  }
  return states;
}

// ---------------------------------------------------------------------------
// Detail — one household: full fixture spec + live DB snapshot + validation
// ---------------------------------------------------------------------------

export interface DevelopmentWorldHouseholdDetail {
  readonly state: DevelopmentWorldHouseholdState;
  readonly fixture: {
    readonly id: string;
    readonly slug: string;
    readonly householdType: string;
    readonly householdName: string;
    readonly summary: string;
    readonly coldStart: boolean;
    readonly accounts: ReadonlyArray<{ key: string; username: string; displayName: string; subscriptionTier: string | null; dietPattern: string | null }>;
    readonly eaters: ReadonlyArray<{ displayName: string; ageYears?: number; accountKey?: string; defaultDietTypes: string[]; hardRestrictions: string[] }>;
    readonly preferences: DwPreferences;
    readonly pantry: ReadonlyArray<{ ingredient: string; category: string; displayName?: string }>;
    readonly cookbook: {
      readonly adopted: ReadonlyArray<{ name: string; category?: string }>;
      readonly regular: ReadonlyArray<{ name: string; category?: string }>;
      readonly discoveryQueue: ReadonlyArray<{ name: string; category?: string }>;
      readonly notes: string | null;
    };
    readonly authored: DwAuthoredStats;
    readonly knownGaps: readonly string[];
  };
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
  readonly validation: {
    readonly worldValid: boolean;
    readonly worldViolationCount: number;
    readonly householdSeeded: boolean;
    readonly knownGaps: readonly string[];
  };
}

function mapRefs(refs?: DwMealRef[]): Array<{ name: string; category?: string }> {
  return (refs ?? []).map((r) => ({ name: r.name, category: r.category }));
}

export async function getDevelopmentWorldHouseholdDetail(id: string): Promise<DevelopmentWorldHouseholdDetail> {
  assertDevelopmentWorldAllowed();
  const h = getFixture(id);
  if (!h) throw new Error(`Unknown Development World household ID: ${id}`);

  const [state] = (await listDevelopmentWorldHouseholdStates()).filter((s) => s.id === id);
  const manifest = loadValidation();

  // Live DB snapshot — same query shape as getBenchmarkHouseholdDetail, read-only.
  let live: DevelopmentWorldHouseholdDetail["live"] = null;
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

  return {
    state,
    fixture: {
      id: h.id,
      slug: h.slug,
      householdType: h.archetype,
      householdName: h.householdName,
      summary: h.summary,
      coldStart: h.coldStart ?? false,
      accounts: h.accounts.map((a) => ({
        key: a.key,
        username: a.username,
        displayName: a.displayName,
        subscriptionTier: a.subscriptionTier ?? null,
        dietPattern: a.dietPattern ?? null,
      })),
      eaters: (h.eaters ?? []).map((e) => ({
        displayName: e.displayName,
        ageYears: e.ageYears,
        accountKey: e.accountKey,
        defaultDietTypes: [...(e.defaultDietTypes ?? [])],
        hardRestrictions: [...(e.hardRestrictions ?? [])],
      })),
      preferences: h.preferences ?? {},
      pantry: (h.pantry ?? []).map((p) => ({ ingredient: p.ingredient, category: p.category, displayName: p.displayName })),
      cookbook: {
        adopted: mapRefs(h.cookbookRefs?.adoptedMealRefs),
        regular: mapRefs(h.cookbookRefs?.regularMealRefs),
        discoveryQueue: mapRefs(h.cookbookRefs?.discoveryQueueMealRefs),
        notes: h.cookbookRefs?.notes ?? null,
      },
      authored: authoredStats(h),
      knownGaps: h.knownGaps ?? [],
    },
    live,
    validation: {
      worldValid: manifest?.valid ?? false,
      worldViolationCount: manifest?.violationCount ?? 0,
      householdSeeded: state.seeded,
      knownGaps: h.knownGaps ?? [],
    },
  };
}

/** World-level validation manifest (for the list page header). */
export function developmentWorldValidation(): {
  valid: boolean; violationCount: number; validatedHouseholds: number; validatedRecipeRefs: number;
} {
  const m = loadValidation();
  return {
    valid: m?.valid ?? false,
    violationCount: m?.violationCount ?? 0,
    validatedHouseholds: m?.validatedHouseholds ?? 0,
    validatedRecipeRefs: m?.validatedRecipeRefs ?? 0,
  };
}
