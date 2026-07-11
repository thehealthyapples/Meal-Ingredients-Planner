/**
 * Food Opportunity Engine (FI4 — Ambient Food Intelligence & Opportunity Engine)
 * ================================================================================
 * Evolves the Food Intelligence Engine (FI3, `engine.ts`) from a request-driven
 * recommender ("recommend foods for benefit X") into an AMBIENT reasoning process:
 * given a caller's own already-existing business-domain activity (their planner,
 * pantry and shopping state), continuously identify and prioritise deterministic,
 * cited, actionable Food Opportunities — reusable by any consuming surface
 * (Planner, Shopping, Cookbook, Pantry, Companion, per FI4 scope).
 *
 * GOVERNING ARCHITECTURE: docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md
 * This module remains the Domain Intelligence layer (§2, §7.1) — it owns its own
 * reasoning process (this file) and ZERO business-domain data (Rule FI1). Every
 * opportunity surfaced here is computed live, per request, from EXISTING owners
 * read through their EXISTING Intelligence Platform read ports:
 *
 *   Household context (restrictions, planner familiarity) → the same
 *     {@link resolveHouseholdSignal} the FI3 engine already uses (exported, reused
 *     verbatim — not re-derived a second time).
 *   Planner activity   → server/intelligence/handlers/planner-read-port.ts
 *                         (DB planner_weeks/planner_days/planner_entries, SoT D14)
 *   Pantry activity     → server/intelligence/handlers/pantry-read-port.ts
 *                         (DB user_pantry_items, SoT D8-11)
 *   Shopping activity   → server/intelligence/handlers/shopping-read-port.ts
 *                         (DB shopping_list, SoT D15)
 *
 * "AMBIENT" means: always freshly computed from current state on request, never a
 * background job, never a stored recommendation, never an autonomous action. No
 * external signal, no predictive/ML ranking, and no code path here writes to any
 * business domain — an Opportunity is a suggestion for a human to act on, never an
 * action taken on their behalf (explicitly out of FI4 scope).
 *
 * TRUST RULES ENFORCED HERE (same rules as engine.ts, carried forward):
 *   Rule E1 (no citation, no card) — every opportunity's `evidence` traces to a
 *     real read from a named, existing owner; there is no code path that invents
 *     an opportunity with no supporting evidence.
 *   Rule T1 (food, not bodies) — every explanation/suggestedAction string names
 *     foods, days, and list items; none makes a claim about a body or an outcome.
 *   Honest gaps — a caller with no resolvable household yields an empty,
 *     `householdAware: false` bundle, never a fabricated opportunity list. A
 *     single domain's read failing (e.g. no planner weeks yet) degrades that one
 *     generator only — it never fabricates data for a domain that has none, and it
 *     never fails the whole report for the other domains' honest opportunities.
 *
 * TESTABILITY: every `identify*Opportunities` generator is a PURE function (no
 * I/O) over already-fetched rows, so the join+prioritise+explain logic is fully
 * unit-testable without a database. {@link identifyOpportunities} is the thin
 * orchestration layer that fetches from the existing owners above and calls them.
 */

import type {
  PlannerWeek,
  PlannerDay,
  PlannerEntry,
  UserPantryItem,
  ShoppingListItem,
} from "@shared/schema";
import type { RestrictionDefinition } from "@shared/restrictions/restriction-types.js";
import { resolveIngredientRestrictions } from "@shared/restrictions/restriction-resolver.js";
import { resolveCanonicalFood } from "@shared/canonical/resolver.js";
import { type AttentionLevel } from "@shared/attention/index.js";
// DEC1 — the one canonical Decision mechanics module (shared/attention/decision.ts).
// The module-local sort + clamp pair this file used to declare is retired
// (Principle 8); ordering and budgeting now have exactly one implementation.
import {
  DELIVERY_DEFAULT_LIMIT,
  DELIVERY_MAX_LIMIT,
  orderByAttention,
  clampWithCriticalExemption,
  type EvidenceCitation,
} from "@shared/attention/decision.js";
import { resolveHouseholdSignal, type HouseholdSignal } from "./engine.js";
import { createStoragePlannerReadPort } from "../handlers/planner-read-port.js";
import { createStoragePantryReadPort } from "../handlers/pantry-read-port.js";
import { createStorageShoppingReadPort } from "../handlers/shopping-read-port.js";

// ---------------------------------------------------------------------------
// Limits — DEC1: the delivery budget pair lives once, in shared/attention/decision.ts
// (previously declared here byte-for-byte identically to OD1's copy).
// ---------------------------------------------------------------------------

/** `dayOfWeek: 0 = Monday` — the existing planner convention (server/storage.ts:3222, server/routes.ts:10842), reused for display only, not redefined. */
const PLANNER_DAY_NAMES: readonly string[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function dayName(dayOfWeek: number): string {
  return PLANNER_DAY_NAMES[((dayOfWeek % 7) + 7) % 7];
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * The closed set of opportunity types this engine identifies. Extending this
 * union (Rule 8 — evolution over replacement) is how a future workstream adds a
 * new opportunity generator without replacing any existing one.
 */
export type FoodOpportunityType =
  | "planner-empty-day"
  | "pantry-item-unused-in-plan"
  | "shopping-restriction-conflict";

// ATTN1 — attention is the one canonical vocabulary in shared/attention. The
// module-local `FoodOpportunityPriority` union this file used to declare is
// retired (Principle 8); the sort function below stays layer-independent.

/** The Business Domain that owns the activity this opportunity was generated from (and where its suggested action would be taken). */
export type FoodOpportunityDomain = "planner" | "pantry" | "shopping";

/**
 * One supporting fact for an opportunity — always a real, named read from an
 * existing owner (Rule E1: no citation, no card). DEC1 — an alias of the one
 * canonical `EvidenceCitation` (shared/attention/decision.ts); the local
 * re-declaration this used to be is retired (Principle 8).
 */
export type FoodOpportunityEvidence = EvidenceCitation;

export interface FoodOpportunity {
  /** Deterministic, stable per underlying record — never regenerated differently for the same activity. */
  readonly id: string;
  readonly type: FoodOpportunityType;
  readonly owningDomain: FoodOpportunityDomain;
  readonly priority: AttentionLevel;
  /** Plain-language explanation of why this is an opportunity (Rule T1 — food, not bodies). */
  readonly explanation: string;
  readonly evidence: readonly FoodOpportunityEvidence[];
  /** A suggestion for the human to act on — never executed automatically (no autonomous actions, FI4 scope). */
  readonly suggestedAction: string;
}

export interface FoodOpportunityTrust {
  /** True only when the caller's own household resolved and contributed the activity this report reads. */
  readonly householdAware: boolean;
}

export interface FoodOpportunityBundle {
  readonly opportunities: readonly FoodOpportunity[];
  readonly trust: FoodOpportunityTrust;
  readonly metadata: { readonly assembledAt: string; readonly sources: readonly string[] };
}

export interface FoodOpportunityRequest {
  /** The caller's own authenticated user id — never a client-supplied household id (mirrors engine.ts's own discipline). */
  readonly userId?: number;
  readonly limit?: number;
}

// ---------------------------------------------------------------------------
// Pure reasoning core — one generator per Business Domain read
// ---------------------------------------------------------------------------

/**
 * Planner domain — a day in the household's own most-recent planner week with
 * zero entries is an actionable gap. "Most recent week" mirrors the one existing
 * convention in this codebase for "current week" (server/routes.ts:10972-10977 —
 * highest `weekNumber`); planner has no calendar date field to compute this from
 * any other way (confirmed against shared/schema.ts).
 */
export function identifyPlannerGapOpportunities(
  week: PlannerWeek,
  days: readonly PlannerDay[],
  entries: readonly PlannerEntry[],
): FoodOpportunity[] {
  if (days.length === 0) return [];

  const entryCountByDayId = new Map<number, number>();
  for (const day of days) entryCountByDayId.set(day.id, 0);
  for (const entry of entries) {
    entryCountByDayId.set(entry.dayId, (entryCountByDayId.get(entry.dayId) ?? 0) + 1);
  }

  const emptyDays = days.filter((d) => (entryCountByDayId.get(d.id) ?? 0) === 0);
  if (emptyDays.length === 0) return [];

  // Deterministic, evidence-based priority: half or more of the week unplanned
  // is a bigger gap than a single stray day.
  const priority: AttentionLevel = emptyDays.length / days.length >= 0.5 ? "high" : "medium";

  return emptyDays
    .slice()
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map((day) => ({
      id: `planner-empty-day:${day.id}`,
      type: "planner-empty-day" as const,
      owningDomain: "planner" as const,
      priority,
      explanation: `${dayName(day.dayOfWeek)} in "${week.weekName}" (Week ${week.weekNumber}) has no meals planned yet.`,
      evidence: [
        {
          source: "planner-week",
          detail: `Week ${week.weekNumber} ("${week.weekName}") has ${emptyDays.length} of ${days.length} day(s) with zero planner entries.`,
        },
      ],
      suggestedAction: `Add a meal to ${dayName(day.dayOfWeek)} in "${week.weekName}".`,
    }));
}

/**
 * Pantry domain — a pantry item that has never appeared in any planned meal is a
 * "cook from what you have" opportunity. Identity resolution reuses the one
 * canonical food resolver (`resolveCanonicalFood`, shared/canonical/resolver.ts —
 * the same resolver food-intelligence-assembler.ts already uses to build planner
 * familiarity) — no second identity mapping is introduced.
 */
export function identifyPantryUnusedOpportunities(
  pantryItems: readonly UserPantryItem[],
  familiarSlugs: ReadonlySet<string>,
): FoodOpportunity[] {
  const opportunities: FoodOpportunity[] = [];
  for (const item of pantryItems) {
    if (item.isDeleted) continue;
    const resolution = resolveCanonicalFood(item.ingredientKey);
    if (!resolution.canonicalSlug || familiarSlugs.has(resolution.canonicalSlug)) continue;

    const label = item.displayName ?? item.ingredientKey;
    opportunities.push({
      id: `pantry-item-unused-in-plan:${item.id}`,
      type: "pantry-item-unused-in-plan",
      owningDomain: "pantry",
      priority: "low",
      explanation: `${label} is in your pantry but hasn't appeared in any of your planned meals yet.`,
      evidence: [
        {
          source: "pantry-items",
          detail: `${label} is a current pantry item with no matching entry in your household's planner history.`,
        },
      ],
      suggestedAction: `Plan a meal that uses ${label} from your pantry.`,
    });
  }
  return opportunities;
}

/**
 * Shopping domain — a shopping list item whose name matches an active household
 * hard restriction is a safety-relevant opportunity to review before buying it.
 * Reuses `resolveIngredientRestrictions` exactly as engine.ts's Rule T0 safety
 * exclusion already does — no second restriction-matching implementation. Unlike
 * Rule T0 (which excludes a recommendation outright), this NEVER removes or
 * modifies the caller's own shopping list item — it only surfaces the conflict
 * as a suggestion for the human to review (no autonomous action, FI4 scope).
 *
 * ATTN1 — this is T0's ADDITIVE face, and the platform's one `critical`
 * emitter: never fail to surface an unsafe thing the household already has.
 * `shopping-restriction-conflict` is the sole member of the closed
 * CRITICAL_TYPES allowlist (shared/attention — invariant A2).
 */
export function identifyShoppingRestrictionOpportunities(
  shoppingItems: readonly ShoppingListItem[],
  restrictionDefs: readonly RestrictionDefinition[],
): FoodOpportunity[] {
  if (restrictionDefs.length === 0) return [];

  const opportunities: FoodOpportunity[] = [];
  for (const item of shoppingItems) {
    if (item.checked) continue; // already actioned by the household — not an open opportunity
    const matches = resolveIngredientRestrictions(item.productName, [...restrictionDefs]);
    if (matches.length === 0) continue;

    const restrictionNames = matches.map((m) => m.restriction.displayName).join(", ");
    opportunities.push({
      id: `shopping-restriction-conflict:${item.id}`,
      type: "shopping-restriction-conflict",
      owningDomain: "shopping",
      priority: "critical",
      explanation: `"${item.productName}" on your shopping list conflicts with a stored household restriction (${restrictionNames}).`,
      evidence: [
        { source: "shopping-list", detail: `"${item.productName}" is on your current, unchecked shopping list.` },
        { source: "household-eaters", detail: `Your household has an active hard restriction: ${restrictionNames}.` },
      ],
      suggestedAction: `Review "${item.productName}" on your shopping list before buying it.`,
    });
  }
  return opportunities;
}

// ---------------------------------------------------------------------------
// Prioritisation — pure, deterministic, no re-derived score
// ---------------------------------------------------------------------------

/**
 * Stable-sort opportunities by attention (critical → high → medium → low),
 * preserving each generator's own internal order within a tier, then clamp to
 * `limit`. PURE — no I/O, no randomness, no clock reads (Rule LT3 — the brain
 * stays deterministic).
 *
 * DEC1 — both steps are the canonical shared mechanics
 * (shared/attention/decision.ts): the local sort and clamp this function used
 * to carry are retired, and behaviour is golden-identity tested to be
 * byte-identical (test-dec1-decision-engine.ts). ATTN1 invariant A3 is
 * unchanged — `critical` is exempt from the clamp, so a safety signal can
 * never be silently dropped by a cap (bounded by design: a household has few
 * active hard restrictions, and ids are item-scoped).
 */
export function prioritizeOpportunities(
  opportunities: readonly FoodOpportunity[],
  limit: number = DELIVERY_DEFAULT_LIMIT,
): FoodOpportunity[] {
  return clampWithCriticalExemption(orderByAttention(opportunities), limit, DELIVERY_MAX_LIMIT);
}

// ---------------------------------------------------------------------------
// I/O orchestration — fetches from existing owners, then calls the pure core
// ---------------------------------------------------------------------------

function emptyBundle(now: Date, householdAware: boolean, sources: readonly string[] = []): FoodOpportunityBundle {
  return {
    opportunities: [],
    trust: { householdAware },
    metadata: { assembledAt: now.toISOString(), sources },
  };
}

/**
 * Assemble a deterministic, cited, prioritised Food Opportunity bundle from the
 * caller's OWN already-existing planner, pantry and shopping activity. Always
 * returns a complete bundle — never throws. A caller with no resolvable
 * household yields an honest empty bundle (`householdAware: false`) — Food
 * Opportunities require real business-domain activity to read; there is no
 * fabricated household and no fabricated activity.
 *
 * Each domain read is independently optional (progressive-enrichment discipline,
 * Architecture Principle 3): a household that has never used the Planner, Pantry,
 * or Shopping surface simply contributes no opportunities from that domain — it
 * never blocks the other domains' honest opportunities.
 */
export async function identifyOpportunities(request: FoodOpportunityRequest): Promise<FoodOpportunityBundle> {
  const now = new Date();

  if (request.userId == null) return emptyBundle(now, false);

  const household: HouseholdSignal = await resolveHouseholdSignal(request.userId);
  if (!household.resolved) return emptyBundle(now, false);

  const opportunities: FoodOpportunity[] = [];
  const sources = new Set<string>(["household-eaters"]);

  try {
    const plannerPort = await createStoragePlannerReadPort();
    const weeks = await plannerPort.getPlannerWeeks(request.userId);
    if (weeks.length > 0) {
      const currentWeek = weeks.reduce((latest, week) => (week.weekNumber > latest.weekNumber ? week : latest));
      const [days, entries] = await Promise.all([
        plannerPort.getPlannerDays(currentWeek.id),
        plannerPort.getPlannerEntriesForWeek(currentWeek.id),
      ]);
      opportunities.push(...identifyPlannerGapOpportunities(currentWeek, days, entries));
      sources.add("planner");
    }
  } catch {
    // Honest degrade: this household has no readable planner activity yet —
    // never fabricated, and it does not block the other domains below.
  }

  try {
    const pantryPort = await createStoragePantryReadPort();
    const pantryItems = await pantryPort.getPantryItems(request.userId);
    if (pantryItems.length > 0) {
      opportunities.push(...identifyPantryUnusedOpportunities(pantryItems, new Set(household.familiarAppearances.keys())));
      sources.add("pantry");
    }
  } catch {
    // Honest degrade — see planner comment above.
  }

  try {
    const shoppingPort = await createStorageShoppingReadPort();
    const shoppingItems = await shoppingPort.getShoppingListItems(request.userId);
    if (shoppingItems.length > 0) {
      opportunities.push(...identifyShoppingRestrictionOpportunities(shoppingItems, household.restrictionDefs));
      sources.add("shopping");
    }
  } catch {
    // Honest degrade — see planner comment above.
  }

  return {
    opportunities: prioritizeOpportunities(opportunities, request.limit ?? DELIVERY_DEFAULT_LIMIT),
    trust: { householdAware: true },
    metadata: { assembledAt: now.toISOString(), sources: Array.from(sources) },
  };
}
