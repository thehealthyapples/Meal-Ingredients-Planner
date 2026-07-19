/**
 * MealDiscoveryEngine (INT26 — Phase 1)
 * ======================================
 * The canonical implementation of MealDiscoveryPort. It orchestrates three
 * internal discovery sources, fans out in parallel, deduplicates, ranks, and
 * caps results. The handler delegates entirely to this engine through the port
 * interface — no handler code touches sources, storage, or deduplication logic.
 *
 * Phase 1 sources (internal only — no external API calls):
 *   PersonalLibrarySource — storage.getMeals(userId)    [always queried]
 *   SystemMealsSource     — storage.getSystemMeals()    [always queried]
 *   MealTemplatesSource   — storage.getMealTemplates()  [always queried]
 *
 * Phase 2 (external provider tier) is NOT implemented here. When Phase 2 ships,
 * the external tier is registered inside this engine's discover() method as one
 * provider block — not as individual phases. See INT26 design doc.
 *
 * OWNERSHIP: This engine does not own any data. It reads only. The storage
 * owners (meals table, meal_templates table) retain full ownership. This file
 * contains NO business logic — only match predicates and structural merging.
 *
 * HARD BOUNDARIES:
 *   • No cross-user data access: getMeals(userId) is ownership-scoped by the
 *     storage owner. System meals (isSystemMeal=true) are globally shared.
 *   • No nutrition data: nutrition is a separate table, never read here.
 *   • No fabrication: every DiscoveryItem field comes from a stored row.
 *   • Deduplication is name-normalised (personal beats system on same name).
 */

import type { Meal, MealTemplate } from "@shared/schema";
import type { DiscoveryItem, MealDiscoveryPort } from "../handlers/meal-discovery-port.js";
import { templateToDiscoveryItem } from "../handlers/meal-discovery-port.js";
import type {
  HouseholdSafetyContext,
  SafetyCheckableMeal,
} from "../../lib/household-dietary-safety.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum discovery results returned per query. Keeps grounding payload small. */
const DISCOVERY_MAX_RESULTS = 15;

// ---------------------------------------------------------------------------
// Storage surface used by this engine
// ---------------------------------------------------------------------------

/**
 * The minimal storage surface this engine reads. Typed so tests can inject
 * a fake without importing the full IStorage interface.
 */
export interface MealDiscoveryStorage {
  getMeals(userId: number): Promise<Meal[]>;
  getSystemMeals(): Promise<Meal[]>;
  getMealTemplates(): Promise<MealTemplate[]>;
}

// ---------------------------------------------------------------------------
// The safety gate (PROD3)
// ---------------------------------------------------------------------------

/**
 * The canonical safety surface this engine consumes. Injectable for the same
 * reason `MealDiscoveryStorage` is: so an engine test can drive the gate without
 * a database. Production passes the real SURF1B resolver.
 *
 * This engine defines NO restriction, NO allergen and NO matching rule. Every
 * verdict below is `isMealSafeForHousehold()`'s, which is the same gate the
 * planner, Smart Suggest and the starter cookbook already serve through.
 */
export interface MealDiscoverySafety {
  resolveHouseholdSafetyContext(userId: number): Promise<HouseholdSafetyContext>;
  isSafetyGateActive(ctx: HouseholdSafetyContext): boolean;
  isMealSafeForHousehold(
    meal: SafetyCheckableMeal,
    ctx: HouseholdSafetyContext,
  ): { safe: boolean; reason?: string };
}

/** The fields the canonical gate inspects. `meals` carries no cuisine or description. */
function mealToSafetyCheckable(m: Meal): SafetyCheckableMeal {
  return { name: m.name, ingredients: m.ingredients ?? [] };
}

/**
 * A template's ingredient evidence is its SLOTS — it has no `ingredients` column.
 *
 * This is not a second ingredient model: the slots ARE what a template says it is
 * built from, and they are the only ingredient facts the row carries. Anything not
 * in a slot is not known to be in the meal.
 */
function templateIngredientEvidence(t: MealTemplate): string[] {
  return [
    ...(t.sharedBaseComponents ?? []),
    ...(t.proteinSlots ?? []),
    ...(t.carbSlots ?? []),
    ...(t.vegSlots ?? []),
    ...(t.toppingSlots ?? []),
    ...(t.sauceSlots ?? []),
  ].filter((s): s is string => !!s && s.trim().length > 0);
}

// ---------------------------------------------------------------------------
// Match predicates (delegation-only: read stored strings, no business logic)
// ---------------------------------------------------------------------------

function matchesMeal(m: Meal, lowerQuery: string): boolean {
  if (m.name.toLowerCase().includes(lowerQuery)) return true;
  return m.ingredients.some((ing) => ing.toLowerCase().includes(lowerQuery));
}

function matchesTemplate(t: MealTemplate, lowerQuery: string): boolean {
  if ((t.title ?? t.name).toLowerCase().includes(lowerQuery)) return true;
  if (t.cuisine?.toLowerCase().includes(lowerQuery)) return true;
  if (t.description?.toLowerCase().includes(lowerQuery)) return true;
  if (t.styleTags?.some((tag) => tag.toLowerCase().includes(lowerQuery))) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Row → DiscoveryItem projections
// ---------------------------------------------------------------------------

function mealToDiscoveryItem(
  m: Meal,
  sourceType: "personal" | "system",
  sourceLabel: string,
): DiscoveryItem {
  return {
    id: `${sourceType}:${m.id}`,
    name: m.name,
    description: undefined,
    servings: m.servings,
    mealFormat: m.mealFormat,
    dietTypes: m.dietTypes,
    sourceType,
    sourceLabel,
    imageUrl: m.imageUrl ?? undefined,
    isAlreadySaved: true,
    importable: false,
    internalId: m.id,
  };
}

// ---------------------------------------------------------------------------
// Sources summary
// ---------------------------------------------------------------------------

function buildSourcesQueried(
  personalOk: boolean,
  systemOk: boolean,
  templatesOk: boolean,
): string {
  const names: string[] = [];
  if (personalOk) names.push("your cookbook");
  if (systemOk) names.push("the THA library");
  if (templatesOk) names.push("meal templates");
  if (names.length === 0) return "internal sources (temporarily unavailable)";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]}, ${names[1]}, and ${names[2]}`;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

/**
 * MealDiscoveryEngine — implements MealDiscoveryPort for Phase 1 internal sources.
 *
 * Construction: pass a MealDiscoveryStorage implementation (real storage in
 * production; in-memory fake in tests that exercise the engine directly).
 * Handler-level tests inject a fake MealDiscoveryPort instead — the engine is
 * not involved at that level.
 */
export class MealDiscoveryEngine implements MealDiscoveryPort {
  constructor(
    private readonly storage: MealDiscoveryStorage,
    private readonly safety?: MealDiscoverySafety,
  ) {}

  /**
   * Resolve the canonical safety module lazily, so importing this engine never
   * pulls in the database layer at module load (the same reason the production
   * port factory imports the engine dynamically).
   */
  private async resolveSafety(): Promise<MealDiscoverySafety> {
    if (this.safety) return this.safety;
    return await import("../../lib/household-dietary-safety.js");
  }

  async discover(query: string, userId: number): Promise<DiscoveryItem[]> {
    const lowerQuery = query.toLowerCase();

    // PROD3 — the safety gate is resolved BEFORE any candidate is admitted, and
    // it fails closed: `resolveHouseholdSafetyContext` never throws, and an
    // `unavailable` context makes `isSafetyGateActive` TRUE and every verdict
    // unsafe. So a household whose restrictions could not be read receives
    // nothing, never the unfiltered cookbook.
    const safety = await this.resolveSafety();
    const safetyCtx = await safety.resolveHouseholdSafetyContext(userId);
    const gateActive = safety.isSafetyGateActive(safetyCtx);

    const isSafe = (meal: SafetyCheckableMeal): boolean =>
      !gateActive || safety.isMealSafeForHousehold(meal, safetyCtx).safe;

    const [personalResult, systemResult, templatesResult] = await Promise.allSettled([
      this.storage.getMeals(userId),
      this.storage.getSystemMeals(),
      this.storage.getMealTemplates(),
    ]);

    const personalOk = personalResult.status === "fulfilled";
    const systemOk = systemResult.status === "fulfilled";
    const templatesOk = templatesResult.status === "fulfilled";

    const items: DiscoveryItem[] = [];
    const seenNames = new Set<string>();
    let excludedForSafety = 0;

    // 1. Personal library — always first (highest rank).
    //    A household's OWN saved meal is gated too: saving a recipe is not a
    //    declaration that everyone at the table can eat it, and the Companion
    //    recommending it is a new act, not a replay of the household's own.
    if (personalOk) {
      for (const m of personalResult.value) {
        if (matchesMeal(m, lowerQuery)) {
          if (!isSafe(mealToSafetyCheckable(m))) { excludedForSafety++; continue; }
          seenNames.add(m.name.toLowerCase().trim());
          items.push(mealToDiscoveryItem(m, "personal", "Your Cookbook"));
        }
      }
    }

    // 2. THA system meals — deduplicate by normalised name against personal.
    if (systemOk) {
      for (const m of systemResult.value) {
        const key = m.name.toLowerCase().trim();
        if (!seenNames.has(key) && matchesMeal(m, lowerQuery)) {
          if (!isSafe(mealToSafetyCheckable(m))) { excludedForSafety++; continue; }
          seenNames.add(key);
          items.push(mealToDiscoveryItem(m, "system", "THA Library"));
        }
      }
    }

    // 3. Meal templates — separate type, no name-dedup against meals.
    if (templatesOk) {
      for (const t of templatesResult.value) {
        if (!t.isActive) continue;
        if (matchesTemplate(t, lowerQuery)) {
          const evidence = templateIngredientEvidence(t);
          // A template with NO slot data carries no ingredient evidence at all.
          // While the gate is active it is withheld: "we cannot see what is in
          // this" is not "this is safe". Most templates are in exactly this
          // state, which is a cookbook-data gap, not a reason to relax the gate.
          if (gateActive && evidence.length === 0) { excludedForSafety++; continue; }
          if (!isSafe({ name: t.title ?? t.name, ingredients: evidence, cuisine: t.cuisine, description: t.description })) {
            excludedForSafety++;
            continue;
          }
          items.push(templateToDiscoveryItem(t));
        }
      }
    }

    // Attach sourcesQueried as a field on the items array so the handler can
    // build it without re-running the fulfilled checks. We use a lightweight
    // carrier object returned alongside items. But per the port contract, discover()
    // returns only DiscoveryItem[]. The handler builds the summary from the items.
    // We store it on the array as a non-enumerable property so it survives the return.
    const result = items.slice(0, DISCOVERY_MAX_RESULTS);
    // PROD3 — how many candidates the gate refused, carried the same way
    // `_sourcesQueried` is. A silent exclusion is indistinguishable from an
    // empty cookbook; this lets the handler and the tests see the difference.
    Object.defineProperty(result, "_excludedForSafety", {
      value: excludedForSafety,
      enumerable: false,
      writable: false,
    });
    Object.defineProperty(result, "_safetyStatus", {
      value: safetyCtx.status,
      enumerable: false,
      writable: false,
    });
    Object.defineProperty(result, "_sourcesQueried", {
      value: buildSourcesQueried(personalOk, systemOk, templatesOk),
      enumerable: false,
      writable: false,
    });

    return result;
  }
}

/**
 * Retrieve the sourcesQueried summary string attached by MealDiscoveryEngine.
 * Falls back to a safe default if the array was not produced by the engine
 * (e.g. a test stub that returns a plain array).
 */
export function getSourcesQueried(items: DiscoveryItem[]): string {
  const sq = (items as { _sourcesQueried?: string })._sourcesQueried;
  return typeof sq === "string" ? sq : "your cookbook, the THA library, and meal templates";
}

/**
 * How many candidates the household safety gate refused for this query, and
 * whether the safety context resolved at all (PROD3).
 *
 * `status: "unavailable"` with a non-zero exclusion count is the fail-closed
 * path: THA could not read the household's restrictions, so it withheld
 * everything. That is a very different sentence from "you have no meals", and
 * the caller must be able to tell them apart.
 */
export function getSafetyExclusion(items: DiscoveryItem[]): {
  excludedForSafety: number;
  status: "resolved" | "unavailable" | "unknown";
} {
  const carrier = items as { _excludedForSafety?: number; _safetyStatus?: string };
  return {
    excludedForSafety: typeof carrier._excludedForSafety === "number" ? carrier._excludedForSafety : 0,
    status:
      carrier._safetyStatus === "resolved" || carrier._safetyStatus === "unavailable"
        ? carrier._safetyStatus
        : "unknown",
  };
}
