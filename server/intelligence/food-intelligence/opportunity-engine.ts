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
// CONV1 P8 / READ-3 — the one owner of "which planner week is this household living in?".
import { resolveHouseholdPlannerWeek } from "../../lib/household-planner-week.js";
import { createStoragePlannerReadPort } from "../handlers/planner-read-port.js";
import { createStoragePantryReadPort } from "../handlers/pantry-read-port.js";
import { createStorageShoppingReadPort } from "../handlers/shopping-read-port.js";
// AFI1 — the ONE reusable "simply better" knowledge: the Uplift Rules the Food
// page's "Simply better choices" (connected-food-intelligence-assembler.ts) and the
// Meal Intelligence assembler already read. Imported here so a planned meal can be
// offered ONE evidence-backed lift. This engine adds NO new nutrition knowledge
// (Rule FI1): the rules are read verbatim, and their own `why` is the cited evidence.
import { buildRuleIndex, matchUpliftRules } from "../../lib/uplift-engine.js";
import { UPLIFT_RULES } from "../../lib/uplift-rules.js";
import type { UpliftSuggestion } from "../../lib/uplift-types.js";
// AFI4 (CBK2) — the EXISTING INT15 Meals read port, used to read the household's OWN
// cookbook (`getMeals(userId)`, user-scoped by the owner). No new port, no new owner.
// (This comment cited pantry-intelligence-assembler.ts as precedent; NUTPLAN2
// retired that file — 328 lines, zero callers, six TypeScript errors.)
import { createStorageMealsReadPort } from "../handlers/meals-read-port.js";
// AFI3 (SHOP1) — WS9 Alternatives. The curated less-processed options and their
// editorial reasons have exactly one owner (`shared/alternatives`); this engine reads
// them and copies them verbatim. It authors NO alternative and NO reason, and WS9's own
// fail-closed trust gate has already vetted every string that can reach a household.
import { alternatives, resolveAnchorKey } from "@shared/alternatives/index.js";
// The canonical food-name index type, shared with the planner explanation context —
// the one key space (canonical slug) every generator below joins on.
import type { FoodNameIndex } from "../../lib/planner-explanation-context.js";
// HNP2 — the plant classifier (M4) is the SINGLE owner of what counts as a plant and
// which of the five variety components a food falls into. This engine classifies
// nothing itself; it hands ingredient lines to the classifier and uses what comes back.
//
// NUTPLAN2 §10 R3 recorded that two plant derivations exist and are NOT interchangeable:
// `plantGroupsForIngredientLines` PARSES a line before classifying it, while
// `mealPlantGroups` (planner-explanation-context.ts) asks about the RAW line. A nutrition
// producer had to pick one and say which. THIS ONE PARSES — the same derivation the
// household already sees on the plant-diversity surfaces, so the card cannot disagree
// with the ring the household is looking at while reading it.
import {
  computeMealVariety,
  sumVarietyScores,
  plantGroupsForIngredientLines,
  EMPTY_VARIETY_SCORE,
  type VarietyScore,
} from "@shared/canonical/plant-classifier.js";
// HNP2 — the Household Nutrition core: the sole owner of the score, its dimensions,
// weights, thresholds and every sentence it composes. This engine owns NONE of that.
// It supplies facts it has already read and projects what the core returns, exactly as
// it does for the Uplift Rules and WS9 Alternatives above.
import {
  computeHouseholdNutritionScore,
  buildNutritionBalanceOpportunity,
  PLANNER_WEEK_DAYS,
  type HouseholdNutritionFacts,
} from "@shared/nutrition/household-nutrition.js";

/**
 * AFI1 — the uplift rule index, built once per process from the same canonical
 * `UPLIFT_RULES` every other consumer reads (Principle 8 — one knowledge source,
 * many readers). Mirrors the memoisation the food-page/meal assemblers already use.
 */
let _upliftRuleIndex: ReturnType<typeof buildRuleIndex> | null = null;
function upliftRuleIndex(): ReturnType<typeof buildRuleIndex> {
  if (!_upliftRuleIndex) _upliftRuleIndex = buildRuleIndex(UPLIFT_RULES);
  return _upliftRuleIndex;
}

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

/** AFI2 — "Tuesday, Wednesday and Friday" from an ordered list of names (display only).
 *  AFI3–AFI5 reuse it verbatim for food lists ("onions, garlic and rice") — same join,
 *  no second implementation. */
function joinPhrase(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
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
  | "shopping-restriction-conflict"
  // AFI1 — the first Ambient Food Intelligence capability added since FI4: a
  // single evidence-backed "simply better" lift for a meal the household has
  // already planned this week (the fourth opportunity type FI4 named as its own
  // next milestone). Reuses the Uplift Rules knowledge; adds no new fact.
  | "planner-meal-uplift"
  // AFI2 — the fifth opportunity type: a calm "cook once, cover the week" observation
  // for a meal the household has planned on MULTIPLE days of this week. Pure planner
  // reasoning (ingredient reuse / leftovers, brief's own list) — reuses the planned
  // meals already resolved for the uplift generator; adds no new knowledge.
  | "planner-batch-cook"
  // AFI3 (SHOP1) — a shopping line the household ALREADY has in the pantry. Joins the
  // two reads the orchestrator already performs on the ONE canonical food identity.
  | "shopping-item-already-in-pantry"
  // AFI3 (SHOP1) — a product ALREADY matched to the household's own line that the
  // ANALYSER (SoT D19) has already rated higher. States two ratings; ranks nothing.
  | "shopping-higher-rated-product-available"
  // AFI3 (SHOP1) — a WS9-curated less-processed option for a line whose food WS9 knows.
  // WS9 owns the option and its reason; this engine copies both verbatim.
  | "shopping-less-processed-option"
  // AFI3 (PANTRY1) — a quantity the household THEMSELVES recorded as needed, absent
  // from the shopping list. Reports their own declaration back; models no consumption.
  | "pantry-need-not-on-shopping-list"
  // AFI4 (CBK2) — a cookbook recipe whose EVERY ingredient resolves and is in the
  // pantry. Never "nearly cookable": one missing or one unidentifiable ingredient
  // refuses the card outright.
  | "cookbook-recipe-cookable-now"
  // AFI4 (CBK2) — a cookbook recipe colliding with a stored household hard restriction.
  // Suggests adapting or keeping; never edits or hides a household's own recipe.
  | "cookbook-recipe-household-conflict"
  // HNP2 — the ONE surviving type of the nutrition limb MAT1 §3.3 retired. Names which
  // of the plant classifier's five variety components this week's plan does not contain.
  // Its reasoning is NOT authored here: it is composed by the Household Nutrition core
  // (`shared/nutrition/household-nutrition.ts`), which remains the sole owner of the
  // score, the weights, the thresholds and the sentence. This engine supplies facts it
  // has ALREADY read and projects what that owner returns.
  //
  // The limb's other two types (`nutrition-plant-diversity-gap`, `nutrition-planning-gap`)
  // are deliberately NOT here: MAT1 retired them as duplicates of `planner-meal-uplift`
  // and `planner-empty-day`, both of which this same engine already emits. Re-adding
  // either would ship the duplicate advice MAT1 removed — from the same module that
  // already makes the observation.
  | "nutrition-balance-gap";

// ATTN1 — attention is the one canonical vocabulary in shared/attention. The
// module-local `FoodOpportunityPriority` union this file used to declare is
// retired (Principle 8); the sort function below stays layer-independent.

/**
 * The Business Domain that owns the activity this opportunity was generated from (and
 * where its suggested action would be taken).
 *
 * AFI4/AFI5 (CBK2) — `cookbook` joins the three original domains. A domain is NOT just a
 * union member: an unregistered domain is produced, delivered, budgeted, persisted and
 * learned from, then SILENTLY DROPPED one step before the household could read it. Adding
 * one means registering it everywhere it is keyed:
 *   `DOMAIN_SURFACE`   (opportunity-delivery/framework.ts) → else routes to `floating`
 *   `DOMAIN_TO_CATEGORY` + `NoticeCategory` (conversation/notice-engine.ts) → else the
 *                                                            Companion NEVER voices it
 *   `OPPORTUNITY_DOMAIN_LABELS` (shared/attention/index.ts) → else renders as "Food"
 *   a mounted `AmbientIntelligence domains={[…]}` surface → else nothing renders it
 * All four are registered for `cookbook`.
 *
 * MAT1 (AFI_VERIFY1 §4.3) — that paragraph was a comment, and a comment cannot fail
 * a build. The union is now DERIVED from the array below rather than declared beside
 * it, so the closed set is enumerable at runtime and
 * `server/tests/test-mat1-registry-conformance.ts` can walk every member and assert
 * it is registered in all four places. Adding a domain to this array without
 * registering it now fails the pipeline instead of reaching a household mislabelled.
 * The union's members and order are unchanged.
 */
// HNP2 — `nutrition` joins the four. It is a genuine fifth ROOM, not a relabelling of
// `planner`: a planner observation is about a slot in a week ("Thursday is empty"), while
// a nutrition observation is about the week's composition ("it contains no whole grains").
// The two answer different questions from the same read, and the household acts on them
// in different places — which is exactly why `nutrition` maps to its own existing
// `ConversationSurface` below rather than borrowing the planner's.
export const FOOD_OPPORTUNITY_DOMAINS = [
  "planner",
  "pantry",
  "shopping",
  "cookbook",
  "nutrition",
] as const;

export type FoodOpportunityDomain = (typeof FOOD_OPPORTUNITY_DOMAINS)[number];

/**
 * One supporting fact for an opportunity — always a real, named read from an
 * existing owner (Rule E1: no citation, no card). DEC1 — an alias of the one
 * canonical `EvidenceCitation` (shared/attention/decision.ts); the local
 * re-declaration this used to be is retired (Principle 8).
 */
export type FoodOpportunityEvidence = EvidenceCitation;

/** The canonical entity an opportunity is ABOUT. Closed set — one per generator below. */
export type FoodOpportunitySubjectEntity =
  | "planner-day"
  | "pantry-item"
  | "shopping-item"
  // AFI1 — a specific planned meal (keyed on its own planner-entry id, or its meal id
  // for a whole-meal observation), the entity `planner-meal-uplift` (AFI1) and
  // `planner-batch-cook` (AFI2) opportunities concern.
  | "planner-meal"
  // AFI4 (CBK2) — a meal in the household's own COOKBOOK, keyed on the meal's own id.
  // Distinct from `planner-meal`: that entity is a meal in the context of a planned
  // week; this one is a recipe the household owns, with no week attached at all.
  | "meal"
  // HNP2 — the planner WEEK itself, keyed on its own row id. The nutrition balance gap
  // is about no single day and no single meal: it is a property of the week's whole
  // composition, and naming a day or a meal as its subject would point the "Why this?"
  // affordance at a record that does not explain it.
  | "planner-week";

/**
 * PHASE5E — the structured entity this opportunity concerns.
 *
 * Every generator below ALREADY holds this record: it is the row the opportunity's
 * `id` is keyed on (`${type}:${record.id}`). Until now that identity was expressed
 * only inside an opaque string and inside prose. Carrying it structurally introduces
 * NO new reasoning, no new read, and no new fact — it exposes what the generator
 * already knew.
 *
 * It exists because PHASE5D §9.1 named its absence as the blocker on explaining an
 * opportunity conversationally: without it, a "Why this?" affordance would have to
 * parse `explanation` prose to work out what the card was about — the presentation
 * layer reverse-engineering intelligence it does not own. With it, the surface passes
 * an id and the platform answers.
 *
 * `label` is the human name the generator ALREADY interpolated into its own
 * `explanation`/`suggestedAction` strings — the same string, lifted out, never a
 * second naming of the entity.
 */
export interface FoodOpportunitySubject {
  readonly entity: FoodOpportunitySubjectEntity;
  /** The owning domain's own primary key. Never a synthetic id. */
  readonly id: number;
  readonly label: string;
}

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
  /** PHASE5E — the canonical entity this opportunity is about. See {@link FoodOpportunitySubject}. */
  readonly subject: FoodOpportunitySubject;
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
 * Planner domain — a day in the household's CURRENT planner week with zero entries is
 * an actionable gap.
 *
 * CONV1 P8 / READ-3. This comment previously read: *"'Most recent week' mirrors the one
 * existing convention in this codebase for 'current week' (server/routes.ts — highest
 * `weekNumber`); planner has no calendar date field to compute this from any other way
 * (confirmed against shared/schema.ts)."*
 *
 * **Both halves stopped being true.** The "convention" was `max(weekNumber)` ≡ the constant
 * 6 — a fact about `createPlannerWeeks`, not about the household (TIME1 § 3.1; HOME3 § 4) —
 * and it is retired. And the planner HAS a calendar date field: `planner_weeks.weekStartDate`
 * (CONV1 P7 / SCH-2, 2026-07-17). Corrected in the same change that made it false (DOC-4).
 *
 * The caller now supplies the week that `resolveHouseholdPlannerWeek` resolved, or does not
 * call this at all — because a gap in a week nobody can date is not an actionable gap, it is
 * a guess about which week the household is living in (HT6).
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
      // The row this opportunity is keyed on, and the name already used above.
      subject: { entity: "planner-day" as const, id: day.id, label: dayName(day.dayOfWeek) },
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
      subject: { entity: "pantry-item", id: item.id, label },
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
      subject: { entity: "shopping-item", id: item.id, label: item.productName },
    });
  }
  return opportunities;
}

/**
 * AFI1 — the minimal planned-meal reference the uplift generator reasons over.
 * Built by the orchestrator from the planner read it ALREADY performs (the entry's
 * own id + its day + the meal name from the planner port's `getMeal`) — no new
 * query, no new owner.
 */
export interface PlannedMealRef {
  readonly entryId: number;
  readonly dayOfWeek: number;
  readonly mealName: string;
  // AFI2 — the meal owner's own id (the same meal can be planned on several days; its
  // entryId differs per day, its mealId does not). Additive; the AFI1 uplift generator
  // ignores it.
  readonly mealId: number;
}

/**
 * AFI1 — Planner domain, the fourth opportunity type. For a meal the household has
 * ALREADY planned this week, offer the single best evidence-backed "simply better"
 * lift — the same Uplift Rules knowledge the Food page's "Simply better choices"
 * shows per-food, now made AMBIENT and timely: it names a meal on THIS week's plan
 * and a lift they can make when they cook it ("how does this help my household right
 * now?"). One excellent suggestion, never a list of average ones — across the whole
 * week exactly one opportunity is emitted (lowest rule `priority` wins; ties keep
 * planner order), or an honest none.
 *
 * PURE (no I/O): reasons over already-fetched planned meals + the already-resolved
 * household restrictions, exactly like the three generators above.
 *
 * SAFETY (Rule T0, reused not re-implemented): a suggestion whose ingredient
 * conflicts with a stored household hard restriction is dropped via the SAME
 * `resolveIngredientRestrictions` matcher the shopping generator uses — the engine
 * never suggests adding something a named member cannot have.
 *
 * EVIDENCE (Rule E1): the cited `why` is the uplift rule's own approved,
 * user-facing explanation — never a phrase this engine invents.
 */
export function identifyPlannerMealUpliftOpportunities(
  plannedMeals: readonly PlannedMealRef[],
  week: PlannerWeek,
  restrictionDefs: readonly RestrictionDefinition[],
): FoodOpportunity[] {
  if (plannedMeals.length === 0) return [];

  const idx = upliftRuleIndex();
  const defs = [...restrictionDefs];

  let best:
    | { meal: PlannedMealRef; suggestion: UpliftSuggestion; rulePriority: number }
    | null = null;

  for (const meal of plannedMeals) {
    // The uplift engine matches on the meal name (and ingredients, when known);
    // the planner port gives us the name, which is enough to find a lift.
    const matches = matchUpliftRules({ mealName: meal.mealName, ingredients: [], dietTypes: [] }, idx);
    for (const match of matches) {
      const safe = match.suggestions.find(
        (s) => defs.length === 0 || resolveIngredientRestrictions(s.ingredient, defs).length === 0,
      );
      if (!safe) continue;
      // Lower rule priority = surfaced first (uplift-types.ts). Prefer one excellent.
      if (best === null || match.priority < best.rulePriority) {
        best = { meal, suggestion: safe, rulePriority: match.priority };
      }
    }
  }

  if (!best) return [];

  const { meal, suggestion } = best;
  const verb =
    suggestion.action === "swap" ? "swap in" : suggestion.action === "boost" ? "add more" : "add";

  return [
    {
      id: `planner-meal-uplift:${meal.entryId}`,
      type: "planner-meal-uplift" as const,
      owningDomain: "planner" as const,
      priority: "low",
      explanation: `"${meal.mealName}" (${dayName(meal.dayOfWeek)} in "${week.weekName}") could have a small lift — ${verb} ${suggestion.ingredient}.`,
      evidence: [
        {
          source: "planner-week",
          detail: `"${meal.mealName}" is on your plan for ${dayName(meal.dayOfWeek)} in "${week.weekName}" (Week ${week.weekNumber}).`,
        },
        // The uplift rule's own approved, user-facing reason — cited verbatim (Rule E1).
        { source: "nutrition-enhancement", detail: suggestion.why },
      ],
      suggestedAction: `When you make "${meal.mealName}", ${verb} ${suggestion.ingredient}.`,
      subject: { entity: "planner-meal" as const, id: meal.entryId, label: meal.mealName },
    },
  ];
}

/**
 * AFI2 — Planner domain, the fifth opportunity type. For a meal the household has planned
 * on MULTIPLE days of this week, offer the calm "cook once, cover the week" observation:
 * batch-cook it once and it covers every day it appears on. This is the brief's "ingredient
 * reuse / leftovers" opportunity, and it answers "how does this improve THIS week's plan?"
 * directly — less effort and less waste across days the household has ALREADY chosen.
 *
 * NO NEW KNOWLEDGE (Rule FI1): it reasons only over the household's OWN plan — the planned
 * meals already resolved for the AFI1 uplift generator (same read, no extra query). It
 * asserts nothing about nutrition, bodies or outcomes (Rule T1 — it names a meal and the
 * days it is on), and it touches no contested domain (unlike plant diversity, whose one
 * canonical owner this engine must never duplicate).
 *
 * PURE (no I/O): reasons over the already-fetched planned meals, like the generators above.
 *
 * ONE EXCELLENT, never a list: a week may repeat several meals; the ambient planner shows
 * exactly one — the meal on the MOST distinct days (the biggest cook-once win). Ties keep
 * planner order (earliest day first, stable). A meal must appear on ≥2 distinct days to
 * count — a meal planned once is not a batch-cook opportunity — so a week with no repeats
 * is an honest none.
 */
export function identifyPlannerBatchCookOpportunities(
  plannedMeals: readonly PlannedMealRef[],
  week: PlannerWeek,
): FoodOpportunity[] {
  if (plannedMeals.length === 0) return [];

  // Group this week's planned meals by the meal itself, collecting the DISTINCT days each
  // is on (the same meal twice on one day is one day of cooking, not two).
  const byMeal = new Map<number, { name: string; days: Set<number> }>();
  for (const meal of plannedMeals) {
    const acc = byMeal.get(meal.mealId);
    if (acc) acc.days.add(meal.dayOfWeek);
    else byMeal.set(meal.mealId, { name: meal.mealName, days: new Set([meal.dayOfWeek]) });
  }

  // Prefer one excellent: the meal on the most distinct days is the biggest cook-once win.
  // First-seen order (Map preserves insertion = planner/day order), so ties keep the
  // earliest-planned meal — no re-derived score, no clock, deterministic (Rule LT3).
  let best: { mealId: number; name: string; days: number[] } | null = null;
  for (const [mealId, acc] of Array.from(byMeal.entries())) {
    if (acc.days.size < 2) continue;
    if (best === null || acc.days.size > best.days.length) {
      best = { mealId, name: acc.name, days: Array.from(acc.days).sort((a, b) => a - b) };
    }
  }

  if (!best) return [];

  const dayList = joinPhrase(best.days.map(dayName));
  return [
    {
      id: `planner-batch-cook:${week.id}:${best.mealId}`,
      type: "planner-batch-cook" as const,
      owningDomain: "planner" as const,
      priority: "low",
      explanation: `You've planned "${best.name}" on ${best.days.length} days this week (${dayList}) — cook one batch and it covers them all.`,
      evidence: [
        {
          source: "planner-week",
          detail: `"${best.name}" is on your plan for ${best.days.length} of the week's days (${dayList}) in "${week.weekName}" (Week ${week.weekNumber}).`,
        },
      ],
      suggestedAction: `Batch-cook "${best.name}" once and portion it across ${dayList}.`,
      // The meal this observation is about, keyed on the meal owner's own id (not an entry
      // id — the meal recurs across several entries this week).
      subject: { entity: "planner-meal" as const, id: best.mealId, label: best.name },
    },
  ];
}

// ---------------------------------------------------------------------------
// AFI3 (SHOP1 + PANTRY1) — Pantry & Shopping
// AFI4 (CBK2)            — Meal & Food
//
// Six generators, all PURE, all reasoning over rows the orchestrator has already
// fetched. Together they complete the Ambient Food Intelligence surface AFI1/AFI2
// began, WITHOUT a second engine, a second pipeline, or one new nutrition fact:
// every claim below is either the household's OWN recorded data, or an existing
// owner's own words copied verbatim (the Analyser's rating, WS9's editorial reason,
// the restriction registry's match).
// ---------------------------------------------------------------------------

/**
 * The household's pantry as canonical foods (slug → the household's own display name).
 *
 * PURE. Mirrors the gate and resolution the one existing pantry-identity reader uses
 * (`readPantryFoods`, planner-explanation-context.ts) — `defaultHave` is the household's
 * own "I have this" flag, and identity comes from the ONE canonical resolver. That
 * function is private to its module and performs its own I/O, so it cannot be called
 * from a pure generator; the discipline is copied, not the knowledge, and no second
 * identity mapping is introduced.
 */
function pantryCanonicalFoods(pantryItems: readonly UserPantryItem[]): FoodNameIndex {
  const foods = new Map<string, string>();
  for (const item of pantryItems) {
    // `defaultHave` is the household's own "I have this" flag. It is NOT NULL with a
    // default of true at the owner, so only an EXPLICIT false is a household saying they
    // do not have it — an absent value is not evidence of absence.
    if (item.isDeleted || item.defaultHave === false) continue;
    const r = resolveCanonicalFood(item.ingredientKey || item.displayName || "");
    if (r.matched && r.canonicalSlug) {
      foods.set(r.canonicalSlug, item.displayName ?? r.canonicalName ?? r.canonicalSlug);
    }
  }
  return foods;
}

/** The canonical food a shopping line names, or null when THA cannot identify it. */
function shoppingCanonicalSlug(item: ShoppingListItem): string | null {
  const r = resolveCanonicalFood(item.canonicalName || item.normalizedName || item.productName || "");
  return r.matched && r.canonicalSlug ? r.canonicalSlug : null;
}

/**
 * AFI3 (SHOP1) — Shopping domain. A line on the list the household ALREADY has in the
 * pantry.
 *
 * The one observation neither room can make alone: the Pantry knows what is in the
 * cupboard, the Shopping list knows what is about to be bought, and neither can see the
 * other. This NEVER edits the list (no autonomous action, FI4 scope) — it surfaces the
 * overlap and leaves the decision where it belongs.
 *
 * NO NEW KNOWLEDGE (Rule FI1): identity is the ONE canonical resolver both rooms already
 * use. Rule T1 — it names two things the household itself recorded.
 *
 * HONEST, NOT NAGGING: a `checked` line is a decision already made and is never
 * re-raised; a deleted pantry row is not a holding; an unidentifiable name on either
 * side is a gap and is skipped rather than guessed at; and with no pantry there is no
 * claim to make at all.
 */
export function identifyShoppingPantryDuplicateOpportunities(
  shoppingItems: readonly ShoppingListItem[],
  pantryItems: readonly UserPantryItem[],
): FoodOpportunity[] {
  const pantryFoods = pantryCanonicalFoods(pantryItems);
  if (pantryFoods.size === 0) return [];

  const opportunities: FoodOpportunity[] = [];
  for (const item of shoppingItems) {
    if (item.checked) continue; // already actioned by the household — not an open opportunity
    const slug = shoppingCanonicalSlug(item);
    if (!slug) continue;
    const pantryLabel = pantryFoods.get(slug);
    if (!pantryLabel) continue;

    opportunities.push({
      id: `shopping-item-already-in-pantry:${item.id}`,
      type: "shopping-item-already-in-pantry",
      owningDomain: "shopping",
      priority: "medium",
      explanation: `"${item.productName}" is on your shopping list, and ${pantryLabel} is already in your pantry.`,
      evidence: [
        { source: "shopping-list", detail: `"${item.productName}" is on your current, unchecked shopping list.` },
        { source: "pantry-items", detail: `${pantryLabel} is recorded as being in your pantry.` },
      ],
      suggestedAction: `Check whether you still need "${item.productName}" before you shop.`,
      subject: { entity: "shopping-item", id: item.id, label: item.productName },
    });
  }
  return opportunities;
}

/**
 * AFI3 (SHOP1) — Shopping domain. A product ALREADY matched to the household's own
 * shopping line that the Analyser has ALREADY rated higher than the line itself.
 *
 * THE TRUST BOUNDARY THIS GENERATOR EXISTS TO RESPECT: "healthier product suggestions"
 * hides two questions with two different owners. The ANALYSER (SoT D19) owns a product
 * RATING, so a rating may be STATED. Nobody here owns a JUDGEMENT, so nothing is ranked
 * or editorialised. This card therefore reports both numbers and lets the household
 * draw the conclusion — it never says "better", "healthier" or "you should swap".
 *
 * NO NEW KNOWLEDGE (Rule FI1): every rating is the Analyser's own, already persisted
 * against rows the household already has. This engine computes no rating and no score.
 *
 * HONEST GAPS: an UNRATED line is a gap in the Analyser's knowledge, never a zero to be
 * beaten — it produces no card. Neither does a line already rated at or above every
 * match, nor a line with no matched products at all. THA never invents an improvement.
 */
export function identifyShoppingHigherRatedProductOpportunities(
  shoppingItems: readonly ShoppingListItem[],
  productMatches: readonly { readonly shoppingListItemId: number; readonly productName: string; readonly thaRating: number | null }[],
): FoodOpportunity[] {
  if (productMatches.length === 0) return [];

  const opportunities: FoodOpportunity[] = [];
  for (const item of shoppingItems) {
    // An unrated line is an honest gap, NOT a zero the Analyser can beat.
    if (item.thaRating == null) continue;

    let best: { productName: string; thaRating: number } | null = null;
    for (const match of productMatches) {
      if (match.shoppingListItemId !== item.id || match.thaRating == null) continue;
      if (match.thaRating <= item.thaRating) continue;
      // Strictly greater keeps ties out; first-seen wins so the order is the owner's own.
      if (best === null || match.thaRating > best.thaRating) {
        best = { productName: match.productName, thaRating: match.thaRating };
      }
    }
    if (!best) continue;

    opportunities.push({
      id: `shopping-higher-rated-product-available:${item.id}`,
      type: "shopping-higher-rated-product-available",
      owningDomain: "shopping",
      priority: "medium",
      // States both ratings; draws no conclusion between them.
      explanation: `"${item.productName}" is rated ${item.thaRating}/5. "${best.productName}", already matched to this line, is rated ${best.thaRating}/5.`,
      evidence: [
        { source: "shopping-list", detail: `"${item.productName}" is on your current shopping list.` },
        {
          source: "analyser-rating",
          detail: `The Analyser rates "${item.productName}" ${item.thaRating}/5 and "${best.productName}" ${best.thaRating}/5.`,
        },
      ],
      suggestedAction: `Compare "${item.productName}" with "${best.productName}" before you shop.`,
      subject: { entity: "shopping-item", id: item.id, label: item.productName },
    });
  }
  return opportunities;
}

/**
 * AFI3 (SHOP1) — Shopping domain. A WS9-curated, less-processed option for a line whose
 * food WS9 already knows.
 *
 * WS9 (`shared/alternatives`) owns both the option and the editorial REASON for it. This
 * generator authors NEITHER: it looks the household's own line up by canonical anchor and
 * copies WS9's option name and reason VERBATIM into the citation. WS9's own trust gate
 * (`validateReason`, fail-closed) has already vetted every string this card can carry, so
 * no ranking or judgement language can reach a household through it.
 *
 * NO NEW KNOWLEDGE (Rule FI1). Rule T1 — it names foods, never bodies or outcomes.
 *
 * A POSSIBILITY, NOT A CALL TO ACTION: `low` attention, so it can never outrank an
 * actionable card.
 *
 * HONEST GAPS: an anchor WS9 does not know is SILENT (WS9's own "empty is silent"
 * discipline — never a guessed alternative).
 *
 * SAFETY (Rule T0, reused not re-implemented): every option is checked against the
 * household's stored hard restrictions with the SAME `resolveIngredientRestrictions`
 * matcher the restriction generator uses. If every option collides, the WHOLE card is
 * dropped — the engine never offers a household something a named member cannot have.
 */
export function identifyShoppingLessProcessedOpportunities(
  shoppingItems: readonly ShoppingListItem[],
  restrictionDefs: readonly RestrictionDefinition[],
): FoodOpportunity[] {
  const defs = [...restrictionDefs];
  const opportunities: FoodOpportunity[] = [];

  for (const item of shoppingItems) {
    if (item.checked) continue;

    // WS9 resolves its own anchors (exact slug/alias). An unknown anchor is silent.
    const anchorKey = resolveAnchorKey(item.normalizedName || item.productName || "");
    if (!anchorKey) continue;

    const result = alternatives({ food: anchorKey, types: ["lower_upf"] });
    const options = result.sections.flatMap((s) => s.options);
    if (options.length === 0) continue;

    // Rule T0 — drop any option colliding with a stored hard restriction.
    const safe = options.filter(
      (o) => defs.length === 0 || resolveIngredientRestrictions(o.name, defs).length === 0,
    );
    if (safe.length === 0) continue;

    // Prefer one excellent: WS9's own first (editorial) option.
    const option = safe[0];
    const anchorName = result.anchor?.name ?? item.productName;

    opportunities.push({
      id: `shopping-less-processed-option:${item.id}`,
      type: "shopping-less-processed-option",
      owningDomain: "shopping",
      priority: "low",
      explanation: `"${item.productName}" is on your list. ${option.name} is a less processed option for ${anchorName}.`,
      evidence: [
        { source: "shopping-list", detail: `"${item.productName}" is on your current shopping list.` },
        // WS9's curated option and its editorial reason, copied character for character.
        { source: "food-alternatives", detail: `${option.name}: ${option.reason}` },
      ],
      suggestedAction: `Have a look at ${option.name} next time you shop for ${anchorName}.`,
      subject: { entity: "shopping-item", id: item.id, label: item.productName },
    });
  }
  return opportunities;
}

/**
 * AFI3 (PANTRY1) — Pantry domain. A quantity the household THEMSELVES recorded as needed,
 * which is not on the shopping list.
 *
 * THE DISCIPLINE THIS ENCODES: THA never models consumption. It does not infer that milk
 * has run low, or predict when it will. It reads back only what the household explicitly
 * declared they need (`needQuantityValue`/`needUnit`) and observes that it is missing from
 * the list they are about to shop from. A missed shop is an inconvenience, so this is
 * `medium` — never `critical`.
 *
 * NO NEW KNOWLEDGE (Rule FI1): the household's own recorded need, and their own list.
 *
 * HONEST GAPS: no recorded need, or a zero need, is not a need. A deleted row is not
 * read. An EMPTY shopping list is a read list, not an unknown one — the need still fires.
 * And a food THA cannot identify is SILENT: it is never guessed at, because a wrong match
 * here would either nag about something already on the list or stay quiet about something
 * missing from it.
 */
export function identifyPantryNeedOpportunities(
  pantryItems: readonly UserPantryItem[],
  shoppingItems: readonly ShoppingListItem[],
): FoodOpportunity[] {
  // The canonical foods the list already covers — matched on identity, not on spelling.
  const listed = new Set<string>();
  for (const item of shoppingItems) {
    const slug = shoppingCanonicalSlug(item);
    if (slug) listed.add(slug);
  }

  const opportunities: FoodOpportunity[] = [];
  for (const item of pantryItems) {
    if (item.isDeleted) continue;
    // A need is a POSITIVE quantity the household recorded. Null and zero are not needs.
    const needValue = item.needQuantityValue;
    if (needValue == null || !(needValue > 0)) continue;

    // THE REFUSAL — an unidentifiable food is silent, never guessed at.
    const r = resolveCanonicalFood(item.ingredientKey);
    if (!r.matched || !r.canonicalSlug) continue;
    if (listed.has(r.canonicalSlug)) continue;

    const label = item.displayName ?? r.canonicalName ?? item.ingredientKey;
    // `needUnit` is nullable even on a positive need — degrade to the bare number.
    const needPhrase = item.needUnit ? `${needValue} ${item.needUnit}` : `${needValue}`;

    opportunities.push({
      id: `pantry-need-not-on-shopping-list:${item.id}`,
      type: "pantry-need-not-on-shopping-list",
      owningDomain: "pantry",
      priority: "medium",
      explanation: `You've recorded that you need ${needPhrase} of ${label}, and it isn't on your shopping list.`,
      evidence: [
        { source: "pantry-items", detail: `Your pantry records a need of ${needPhrase} for ${label}.` },
        { source: "shopping-list", detail: `${label} does not appear on your current shopping list.` },
      ],
      suggestedAction: `Add ${label} to your shopping list.`,
      subject: { entity: "pantry-item", id: item.id, label },
    });
  }
  return opportunities;
}

/**
 * AFI4 (CBK2) — Cookbook domain. A recipe the household could cook RIGHT NOW, entirely
 * from what is already in the pantry.
 *
 * THE LOAD-BEARING REFUSAL: this card is emitted only when EVERY ingredient in the recipe
 * both RESOLVES canonically and is present in the pantry. There is deliberately no
 * partial-coverage threshold and no "you're nearly there" — sending someone to the hob
 * without the thing they are missing is worse than staying quiet.
 *
 * And the sharper half: an ingredient THA CANNOT IDENTIFY is a gap in THA's KNOWLEDGE,
 * not evidence the household owns it. So an unresolvable ingredient BLOCKS the card
 * outright — it is never silently skipped, which is the one implementation shortcut that
 * would quietly turn this card into a lie.
 *
 * NO NEW KNOWLEDGE (Rule FI1): the household's own cookbook and own pantry, joined by the
 * ONE canonical resolver. Rule T1 — it names a recipe and foods, never a body.
 *
 * A POSSIBILITY, NOT A CALL TO ACTION: `low` attention. A meal you COULD cook is an
 * option, not an instruction.
 *
 * HONEST GAPS: no pantry, no claim. A recipe with no recorded ingredients cannot be
 * proven cookable, so an empty ingredient list never fires (no vacuous truth).
 */
export function identifyCookbookCookableNowOpportunities(
  meals: readonly { readonly id: number; readonly name: string; readonly ingredients: readonly string[] }[],
  pantryItems: readonly UserPantryItem[],
): FoodOpportunity[] {
  const pantryFoods = pantryCanonicalFoods(pantryItems);
  if (pantryFoods.size === 0) return [];

  const opportunities: FoodOpportunity[] = [];
  for (const meal of meals) {
    const name = meal.name?.trim();
    if (!name) continue;
    // A recipe with nothing recorded cannot be proven cookable.
    if (meal.ingredients.length === 0) continue;

    const have: string[] = [];
    let provable = true;
    for (const raw of meal.ingredients) {
      const r = resolveCanonicalFood(raw ?? "");
      // A knowledge gap is NOT an owned ingredient — it blocks the card.
      if (!r.matched || !r.canonicalSlug) {
        provable = false;
        break;
      }
      const label = pantryFoods.get(r.canonicalSlug);
      if (!label) {
        provable = false;
        break;
      }
      have.push(label);
    }
    if (!provable) continue;

    opportunities.push({
      id: `cookbook-recipe-cookable-now:${meal.id}`,
      type: "cookbook-recipe-cookable-now",
      owningDomain: "cookbook",
      priority: "low",
      explanation: `You have everything for "${name}" — ${joinPhrase(have)} are all in your pantry.`,
      evidence: [
        { source: "meals", detail: `"${name}" is a recipe in your cookbook.` },
        { source: "pantry-items", detail: `Every ingredient it needs is in your pantry: ${joinPhrase(have)}.` },
      ],
      suggestedAction: `Cook "${name}" from what you already have.`,
      subject: { entity: "meal", id: meal.id, label: name },
    });
  }
  return opportunities;
}

/**
 * AFI4 (CBK2) — Cookbook domain. A recipe in the household's OWN cookbook that collides
 * with a stored household hard restriction.
 *
 * WHAT THIS CARD REFUSES TO DO: it never deletes, hides, filters or auto-adapts a
 * household's own recipe. A cookbook is theirs, not THA's, and a restriction may belong to
 * one member of several. So the card names the recipe AND the ingredient that caused the
 * collision, and offers the two honest choices — adapt it, or keep it as it is.
 *
 * Reuses `resolveIngredientRestrictions` exactly as the shopping and uplift generators do
 * — no second restriction-matching implementation (Rule T0's additive face).
 *
 * `medium`, never `critical`: `shopping-restriction-conflict` is the platform's sole
 * `critical` emitter (ATTN1 invariant A2, a closed allowlist) because that is a thing
 * about to be BOUGHT. A recipe sitting in a cookbook is not.
 *
 * HONEST GAPS: no stored restrictions means no conflict cards — a restriction is never
 * inferred, defaulted or guessed.
 */
export function identifyCookbookHouseholdConflictOpportunities(
  meals: readonly { readonly id: number; readonly name: string; readonly ingredients: readonly string[] }[],
  restrictionDefs: readonly RestrictionDefinition[],
): FoodOpportunity[] {
  if (restrictionDefs.length === 0) return [];
  const defs = [...restrictionDefs];

  const opportunities: FoodOpportunity[] = [];
  for (const meal of meals) {
    const name = meal.name?.trim();
    if (!name) continue;

    // The first colliding ingredient, kept EXACTLY as the recipe spells it, so the card
    // can name the real cause rather than a re-worded one.
    let hit: { ingredient: string; restrictionNames: string } | null = null;
    for (const raw of meal.ingredients) {
      const ingredient = (raw ?? "").trim();
      if (!ingredient) continue;
      const matches = resolveIngredientRestrictions(ingredient, defs);
      if (matches.length === 0) continue;
      hit = {
        ingredient,
        restrictionNames: matches.map((m) => m.restriction.displayName).join(", "),
      };
      break;
    }
    if (!hit) continue;

    opportunities.push({
      id: `cookbook-recipe-household-conflict:${meal.id}`,
      type: "cookbook-recipe-household-conflict",
      owningDomain: "cookbook",
      priority: "medium",
      explanation: `"${name}" in your cookbook contains ${hit.ingredient}, which conflicts with a stored household restriction (${hit.restrictionNames}).`,
      evidence: [
        { source: "meals", detail: `"${name}" is a recipe in your cookbook and it contains ${hit.ingredient}.` },
        { source: "household-eaters", detail: `Your household has an active hard restriction: ${hit.restrictionNames}.` },
      ],
      suggestedAction: `Adapt "${name}" to work around ${hit.ingredient}, or keep it as it is.`,
      subject: { entity: "meal", id: meal.id, label: name },
    });
  }
  return opportunities;
}
// ---------------------------------------------------------------------------
// HNP2 — the nutrition domain
// ---------------------------------------------------------------------------

/**
 * HNP2 — the `nutrition` domain. One opportunity per week at most.
 *
 * This generator is deliberately THIN, and it is the whole of HNP2's convergence: it
 * turns facts the orchestrator has ALREADY read into the Household Nutrition core's own
 * input shape, asks that core for its score and its opportunity, and projects the result.
 * It computes no score, chooses no threshold, sets no weight and writes no sentence —
 * a source-scan in `test-hnp2-nutrition-balance-opportunity.ts` asserts exactly that.
 *
 * WHY THE FACTS ARE PARTIAL, AND WHY THAT IS HONEST. The core scores four dimensions;
 * this engine can supply three. It does NOT read `user_health_trends` (the Apple Rating
 * owner) and it does NOT read the Nutrition Centre's all-time diversity — so both are
 * passed as `null`, which is that core's own contract for "this owner had nothing to
 * say". The dimension is then EXCLUDED from the score rather than counted as zero, and
 * `dimensionsCounted` records that the score rests on three of four.
 *
 * Reading those two owners here would have meant a second reader of each — the exact
 * duplicate ownership HNP2 exists to remove — for a figure the ONE opportunity this
 * generator emits does not use. `null` is the truthful answer, not a shortcut.
 */
export function identifyNutritionBalanceOpportunities(
  week: PlannerWeek,
  weekVariety: VarietyScore,
  weeklyPlantSlugs: readonly string[],
  mealsPlanned: number,
  daysWithMeals: number,
): FoodOpportunity[] {
  const facts: HouseholdNutritionFacts = {
    weeklyPlantSlugs,
    weeklyVariety: weekVariety,
    mealsPlanned,
    daysWithMeals,
    // Not read by this engine — an honest gap, never a zero. See the note above.
    averageAppleRating: null,
    appleRatingSampleCount: 0,
    categoriesCovered: 0,
    categoriesTotal: 0,
    allTimePlantDiversity: null,
    weekNumber: week.weekNumber,
  };

  const score = computeHouseholdNutritionScore(facts);
  const opportunity = buildNutritionBalanceOpportunity(facts, score);
  if (!opportunity) return [];

  return [
    {
      // The core keys its own id on the week NUMBER (stable in its own vocabulary);
      // the engine's key space is `${type}:${record.id}`, so the id is re-keyed onto
      // the week ROW here — the same discipline every other generator follows, and
      // what keeps two households' weeks from ever colliding on one id.
      id: `${opportunity.type}:${week.id}`,
      type: "nutrition-balance-gap",
      owningDomain: "nutrition",
      priority: opportunity.priority,
      explanation: opportunity.explanation,
      evidence: opportunity.evidence,
      suggestedAction: opportunity.suggestedAction,
      subject: {
        entity: "planner-week",
        id: week.id,
        label: `Week ${week.weekNumber}`,
      },
    },
  ];
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

  // AFI3–AFI5 — the pantry is read ONCE and shared by every generator that needs it
  // (the pantry generator below, and the three cross-room observations). Read up front,
  // independently guarded: an unreadable pantry degrades those observations to an honest
  // silence and never blocks the planner or shopping domains.
  let pantryItems: UserPantryItem[] = [];
  let pantryRead = false;
  try {
    const pantryPort = await createStoragePantryReadPort();
    pantryItems = await pantryPort.getPantryItems(request.userId);
    pantryRead = true;
  } catch {
    // Honest degrade — this household has no readable pantry activity yet.
  }

  // HNP2 — the household's own meals are now read ONCE, up here, for the same reason the
  // pantry was hoisted before them: TWO domains need them. The cookbook generators need
  // every recipe the household owns; the nutrition generator needs the INGREDIENTS of the
  // recipes on this week's plan, which the planner's own `getMeal` reference does not
  // carry (it returns `{id, name}` only).
  //
  // Hoisting is what keeps this a convergence rather than an addition: without it the
  // nutrition domain would have had to open a second read of the same owner, which is the
  // duplicate ownership HNP2 exists to remove. There is no new query here — the read that
  // already happened for the cookbook simply happens earlier and is shared.
  let meals: { id: number; name: string; ingredients: readonly string[] }[] = [];
  let mealsRead = false;
  try {
    const mealsPort = await createStorageMealsReadPort();
    // `ingredients` is nullable on the row; normalised ONCE here so neither consumer
    // repeats the coalesce (this is the shape the cookbook block already built for itself).
    meals = (await mealsPort.getMeals(request.userId)).map((m) => ({
      id: m.id,
      name: m.name,
      ingredients: m.ingredients ?? [],
    }));
    mealsRead = true;
  } catch {
    // Honest degrade — this household has no readable cookbook yet. The planner and
    // nutrition observations below simply go quiet; nothing else is affected.
  }
  const mealsById = new Map(meals.map((m) => [m.id, m]));

  try {
    const plannerPort = await createStoragePlannerReadPort();
    const weeks = await plannerPort.getPlannerWeeks(request.userId);
    // CONV1 P8 / READ-3 — rival #2 of five, retired. Was:
    //   weeks.reduce((latest, week) => week.weekNumber > latest.weekNumber ? week : latest)
    // ≡ the constant 6. It aimed every planner gap opportunity at a week the household
    // was not looking at.
    //
    // When the household has no anchor there is NO FALLBACK and NO planner opportunity:
    // "Thursday in Week 6 has no meals planned" is only actionable if Week 6 is a week
    // this household is actually living in, and for an unanchored household nobody knows
    // that. Guessing would put a fabricated premise into DEC1's governed output and,
    // through it, into what the Companion says. Silence stays first-class (HT6/HT14) —
    // and this is the honest degrade this block ALREADY practised for an unreadable
    // planner, now extended to an undatable one.
    const plannerWeek = await resolveHouseholdPlannerWeek(request.userId, weeks);
    if (plannerWeek.anchored) {
      const currentWeek = plannerWeek.week;
      const [days, entries] = await Promise.all([
        plannerPort.getPlannerDays(currentWeek.id),
        plannerPort.getPlannerEntriesForWeek(currentWeek.id),
      ]);
      opportunities.push(...identifyPlannerGapOpportunities(currentWeek, days, entries));

      // AFI1 — resolve each planned entry's meal NAME via the planner port's own
      // meal reference (no new query, no new owner), so the uplift generator can
      // offer ONE evidence-backed lift for a meal already on this week's plan.
      const dayOfWeekById = new Map(days.map((d) => [d.id, d.dayOfWeek]));
      const plannedMeals = (
        await Promise.all(
          entries.map(async (entry): Promise<PlannedMealRef | null> => {
            const meal = await plannerPort.getMeal(entry.mealId);
            const name = meal?.name?.trim();
            if (!name) return null;
            return {
              entryId: entry.id,
              dayOfWeek: dayOfWeekById.get(entry.dayId) ?? 0,
              mealName: name,
              mealId: entry.mealId,
            } satisfies PlannedMealRef;
          }),
        )
      ).filter((m): m is PlannedMealRef => m !== null);
      opportunities.push(
        ...identifyPlannerMealUpliftOpportunities(plannedMeals, currentWeek, household.restrictionDefs),
      );

      // AFI2 — the "cook once, cover the week" observation for a meal planned on several
      // days of this week. Reuses the SAME `plannedMeals` resolved just above — no extra
      // read, no new knowledge, no contested domain.
      opportunities.push(...identifyPlannerBatchCookOpportunities(plannedMeals, currentWeek));

      // HNP2 — the nutrition domain. Joins the planned meals resolved above to the meals
      // read ONCE at the top, so the week's composition costs no additional query.
      //
      // Gated on `mealsRead`: an UNREADABLE cookbook and a cookbook of recipes with no
      // recorded ingredients are different claims, and only the second is a week that
      // honestly contains no components. Without this gate a failed read would render as
      // "your week is missing all five components" — an accusation from a broken query.
      if (mealsRead) {
        const plannedIngredients: string[] = [];
        const varietyScores: VarietyScore[] = [];
        for (const planned of plannedMeals) {
          const meal = mealsById.get(planned.mealId);
          if (!meal || meal.ingredients.length === 0) continue;
          const lines = meal.ingredients.filter((line): line is string => typeof line === "string");
          plannedIngredients.push(...lines);
          varietyScores.push(computeMealVariety([...lines]));
        }

        // A meal planned on three days contributes its plants ONCE: this is a claim about
        // the week's VARIETY, not its volume, and `Set`/`sumVarietyScores` are the
        // classifier's own way of saying so.
        const weekVariety =
          varietyScores.length > 0 ? sumVarietyScores(varietyScores) : EMPTY_VARIETY_SCORE;
        const weeklyPlantSlugs = [...plantGroupsForIngredientLines(plannedIngredients)];

        // The exact distinct-day count, from the rows already read — never a proxy.
        // (HNP1 §4.1 measured an approximation here disagreeing with reality in 8% of
        // real planner weeks, in BOTH directions.)
        const daysWithMeals = Math.min(
          new Set(entries.map((entry) => entry.dayId)).size,
          PLANNER_WEEK_DAYS,
        );

        opportunities.push(
          ...identifyNutritionBalanceOpportunities(
            currentWeek,
            weekVariety,
            weeklyPlantSlugs,
            plannedMeals.length,
            daysWithMeals,
          ),
        );
        sources.add("plant-classifier");
      }

      sources.add("planner");
    }
  } catch {
    // Honest degrade: this household has no readable planner activity yet —
    // never fabricated, and it does not block the other domains below.
  }

  // AFI3 (SHOP1) — the pantry read is HOISTED above: it is now used by three domains
  // (pantry, shopping and cookbook) and is fetched exactly once.
  if (pantryItems.length > 0) {
    opportunities.push(...identifyPantryUnusedOpportunities(pantryItems, new Set(household.familiarAppearances.keys())));
    sources.add("pantry");
  }

  try {
    const shoppingPort = await createStorageShoppingReadPort();
    const shoppingItems = await shoppingPort.getShoppingListItems(request.userId);
    if (shoppingItems.length > 0) {
      opportunities.push(...identifyShoppingRestrictionOpportunities(shoppingItems, household.restrictionDefs));

      // AFI3 (SHOP1) — a line the household already has in the cupboard. Joins the two
      // reads already performed — no third read, no new owner.
      if (pantryRead) {
        opportunities.push(...identifyShoppingPantryDuplicateOpportunities(shoppingItems, pantryItems));
      }

      // AFI3 (SHOP1) — WS9's curated less-processed option for a line whose food it knows.
      opportunities.push(
        ...identifyShoppingLessProcessedOpportunities(shoppingItems, household.restrictionDefs),
      );

      // AFI3 (SHOP1) — the Analyser's already-persisted product ratings. INDEPENDENTLY
      // OPTIONAL: a household with no matched products simply contributes no comparison,
      // and it never blocks the shopping cards above.
      try {
        const productMatches = await shoppingPort.getProductMatchesForUser(request.userId);
        if (productMatches.length > 0) {
          opportunities.push(
            ...identifyShoppingHigherRatedProductOpportunities(shoppingItems, productMatches),
          );
          sources.add("analyser-rating");
        }
      } catch {
        // Honest degrade — no matches read, so no comparison is invented.
      }

      // AFI3 (PANTRY1) — a need the household recorded that the list does not cover.
      // Needs BOTH owners, so it lives here where both have been read.
      if (pantryRead) {
        opportunities.push(...identifyPantryNeedOpportunities(pantryItems, shoppingItems));
      }

      sources.add("shopping");
    } else if (pantryRead) {
      // An EMPTY shopping list is a READ list, not an unknown one — a recorded need is
      // still missing from it, so the pantry-need observation still stands.
      opportunities.push(...identifyPantryNeedOpportunities(pantryItems, []));
    }
  } catch {
    // Honest degrade — see planner comment above.
  }

  // AFI4 (CBK2) — the Cookbook domain. Reads the caller's OWN meals through the EXISTING
  // INT15 meals read port (user-scoped by the owner). Independently optional, like every
  // other domain: a household with no cookbook contributes nothing and blocks nothing.
  //
  // HNP2 — the read itself moved to the top of this function (it is now shared with the
  // nutrition domain); this block keeps its own gate and its own honest-degrade
  // behaviour unchanged. `mealsRead` replaces the try/catch that used to wrap the read:
  // the failure it caught now happens, and is absorbed, at the hoisted read.
  if ((pantryRead || household.restrictionDefs.length > 0) && mealsRead) {
    const cookbook = meals;
    if (cookbook.length > 0) {
      opportunities.push(...identifyCookbookCookableNowOpportunities(cookbook, pantryItems));
      opportunities.push(
        ...identifyCookbookHouseholdConflictOpportunities(cookbook, household.restrictionDefs),
      );
      sources.add("meals");
    }
  }

  return {
    opportunities: prioritizeOpportunities(opportunities, request.limit ?? DELIVERY_DEFAULT_LIMIT),
    trust: { householdAware: true },
    metadata: { assembledAt: now.toISOString(), sources: Array.from(sources) },
  };
}
