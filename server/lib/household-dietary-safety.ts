/**
 * household-dietary-safety.ts
 *
 * THE canonical household dietary safety resolver (SURF1B).
 *
 * One question, one owner: *what may this household not eat, and who says so?*
 *
 * ── What this module is ──────────────────────────────────────────────────────
 * A RESOLVER, not a rules engine. It owns *resolution* — which member holds which
 * requirement, and which of those requirements are hard — and it owns nothing else.
 * Every act of *matching* is delegated to the two engines THA already has:
 *
 *   - `shared/restrictions/restriction-resolver.ts`  → allergens and restrictions.
 *       The canonical library (gluten, dairy, peanut, tree_nut, sesame, soy,
 *       mustard, shellfish, eggs, coconut) with aliases, derived ingredients,
 *       hidden ingredients and excluded compounds. Reached here via
 *       `candidateHardExcluded()`, which is already the shared matcher used by
 *       Smart Suggest and the planner gate.
 *   - `shared/dietRules.ts`                          → diet patterns.
 *       Vegan / Vegetarian / Keto / Low-Carb / Paleo / Carnivore hard filters.
 *
 * This module defines NO keyword list, NO allergen, and NO second rules engine.
 * If a food is unsafe, one of those two engines said so.
 *
 * ── The defect it exists to fix (DCA1 gap #1) ────────────────────────────────
 * THA accepts seven declarable restrictions on the profile
 * (`Gluten-Free, Dairy-Free, Nuts, Eggs, Shellfish, Soy, Sesame`) and stores them on
 * `users.diet_restrictions`. Before SURF1B those values were routed only to
 * `dietRules.shouldExcludeRecipe()`, which implements exactly two of the seven —
 * so `Nuts`, `Eggs`, `Shellfish`, `Soy` and `Sesame` were accepted by the form and
 * enforced by nothing. The canonical restriction library implements all seven, but
 * was fed only from `household_eaters.hard_restrictions` — a partial mirror that is
 * empty for 10 of the 21 households that carry a live restriction, because adult
 * eater rows store `[]` by design and the profile is the authoritative source.
 *
 * Meanwhile `storage.getHouseholdDietaryContext()` — the AI-facing household
 * context — hardcoded `dietRestrictions: []`, because it read `user_preferences`,
 * which has no restrictions column at all. INT17 pins `aggregated.unionRestrictions`
 * precisely so a token budget can never outbid a household's allergens; the pins
 * were faithfully delivering an empty array.
 *
 * This resolver is the one place all of that is now read.
 *
 * ── Hard versus preference ───────────────────────────────────────────────────
 * The distinction is load-bearing and is drawn exactly where the schema draws it:
 *
 *   HARD — never overridable, unioned across the WHOLE household. An allergen
 *   belonging to any member binds every meal the household is offered.
 *     · `users.diet_restrictions`            (the profile — authoritative for adults)
 *     · `household_eaters.hard_restrictions` ("always enforced, never overridable")
 *
 *   PREFERENCE — soft, advisory, never a safety gate.
 *     · `user_preferences.diet_types`
 *     · `user_preferences.excluded_ingredients`
 *     · `household_eaters.default_diet_types` ("soft diet preferences")
 *
 *   PER-MEMBER HARD — `users.diet_pattern`. Hard for the member who declared it,
 *   but deliberately NOT unioned household-wide: a vegan and an omnivore sharing a
 *   kitchen do not make every meal vegan, and unioning patterns would change
 *   recommendation ranking far beyond what safety requires. Every member's pattern
 *   is still CARRIED into the AI context so the Companion can reason about the whole
 *   household; only the requester's pattern gates their own recommendations. A
 *   member who means "no meat, ever, in this house" declares it as a restriction —
 *   which is exactly what the live data shows them doing.
 *
 * ── Fail-safe ────────────────────────────────────────────────────────────────
 * If the safety context cannot be resolved, this module returns
 * `status: "unavailable"` — never an empty restriction list. "We know of no
 * restrictions" and "we could not find out" are different facts, and collapsing
 * them is precisely how an allergen reaches a plate. `isMealSafeForHousehold()`
 * refuses every meal under `unavailable`. Callers must fail CLOSED.
 */
import { db } from "../db";
import { eq, and, inArray } from "drizzle-orm";
import { users, userPreferences, householdMembers, householdEaters } from "@shared/schema";
import { getHouseholdForUser } from "./household";
import { candidateHardExcluded } from "./smart-suggest-service";
import { shouldExcludeRecipe, canonicaliseDietPattern } from "@shared/dietRules";
import { resolveActiveRestrictions } from "@shared/restrictions/restriction-resolver.js";
import type { RestrictionDefinition } from "@shared/restrictions/restriction-types.js";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Resolution outcome. `unavailable` is a refusal to guess, never "no restrictions". */
export type SafetyStatus = "resolved" | "unavailable";

/** One eater in the household — an account holder or a child without one. */
export interface HouseholdMemberSafety {
  /** Null for a child eater with no account. */
  userId: number | null;
  displayName: string;
  /** HARD. Declared restrictions/allergens. Unioned household-wide. */
  hardRestrictions: string[];
  /** HARD for this member only — never unioned across the household. */
  dietPattern: string | null;
  /** PREFERENCE. Soft. */
  dietTypes: string[];
  /** PREFERENCE. Soft. */
  excludedIngredients: string[];
}

export interface HouseholdSafetyContext {
  status: SafetyStatus;
  householdId: number | null;
  /** The user whose request this is. Their diet pattern gates their recommendations. */
  requesterUserId: number;
  requesterDietPattern: string | null;
  members: HouseholdMemberSafety[];
  /** HARD — union of every member's declared restrictions, as declared. */
  hardRestrictions: string[];
  /**
   * HARD — the same union resolved through the canonical restriction library.
   * "Nuts" expands to peanut + tree_nut; "coeliac" resolves to gluten; and so on.
   * Restrictions with no canonical definition are absent here but remain in
   * `hardRestrictions`, where the conservative substring fallback still catches them.
   */
  activeRestrictions: RestrictionDefinition[];
  /** HARD, per member — carried for the AI, not unioned into the meal gate. */
  dietPatterns: string[];
  /** PREFERENCE — soft, advisory, never a gate. */
  preferences: {
    dietTypes: string[];
    excludedIngredients: string[];
  };
}

export interface SafetyVerdict {
  safe: boolean;
  /** Machine-readable cause when unsafe. */
  reason?: string;
  /** The canonical restriction ids that rejected the meal, when applicable. */
  violatedRestrictions?: string[];
}

/** The meal fields the safety gate inspects. Stored meals and external candidates both fit. */
export interface SafetyCheckableMeal {
  name: string;
  ingredients?: string[] | null;
  category?: string | null;
  cuisine?: string | null;
  description?: string | null;
}

// ─── Resolution ──────────────────────────────────────────────────────────────

const dedupe = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.filter((v): v is string => !!v && v.trim().length > 0)));

/**
 * Resolve the canonical dietary safety context for the household `userId` belongs to.
 *
 * Reads every canonical owner, and re-derives nothing:
 *   adults   → `users.diet_pattern` + `users.diet_restrictions` (authoritative)
 *   children → `household_eaters.hard_restrictions` + `default_diet_types`
 *   soft     → `user_preferences.diet_types` + `excluded_ingredients`
 *
 * Adult eater rows are also unioned in, so the households whose mirror IS populated
 * lose nothing. The profile remains authoritative; the mirror can only add.
 *
 * NEVER throws. On any failure it returns `status: "unavailable"` with empty lists —
 * which every consumer must treat as "refuse", not as "unrestricted".
 */
export async function resolveHouseholdSafetyContext(
  userId: number,
): Promise<HouseholdSafetyContext> {
  const unavailable: HouseholdSafetyContext = {
    status: "unavailable",
    householdId: null,
    requesterUserId: userId,
    requesterDietPattern: null,
    members: [],
    hardRestrictions: [],
    activeRestrictions: [],
    dietPatterns: [],
    preferences: { dietTypes: [], excludedIngredients: [] },
  };

  try {
    const householdId = await getHouseholdForUser(userId);

    // Active account-holding members.
    const memberRows = await db
      .select({
        userId: householdMembers.userId,
        displayName: users.displayName,
        username: users.username,
        dietPattern: users.dietPattern,
        dietRestrictions: users.dietRestrictions,
      })
      .from(householdMembers)
      .innerJoin(users, eq(householdMembers.userId, users.id))
      .where(
        and(
          eq(householdMembers.householdId, householdId),
          eq(householdMembers.status, "active"),
        ),
      );

    const memberIds = memberRows.map((m) => m.userId);

    // Soft preferences for those members.
    const prefRows = memberIds.length
      ? await db
          .select({
            userId: userPreferences.userId,
            dietTypes: userPreferences.dietTypes,
            excludedIngredients: userPreferences.excludedIngredients,
          })
          .from(userPreferences)
          .where(inArray(userPreferences.userId, memberIds))
      : [];
    const prefsByUser = new Map(prefRows.map((p) => [p.userId, p]));

    // Every eater in the household — including children with no account, whose
    // eater row IS their canonical owner.
    const eaterRows = await db
      .select({
        userId: householdEaters.userId,
        displayName: householdEaters.displayName,
        defaultDietTypes: householdEaters.defaultDietTypes,
        hardRestrictions: householdEaters.hardRestrictions,
      })
      .from(householdEaters)
      .where(eq(householdEaters.householdId, householdId));

    const eatersByUser = new Map(
      eaterRows.filter((e) => e.userId != null).map((e) => [e.userId as number, e]),
    );

    const members: HouseholdMemberSafety[] = [];

    // 1. Account holders — profile is authoritative, adult eater row may only add.
    for (const row of memberRows) {
      const prefs = prefsByUser.get(row.userId);
      const eater = eatersByUser.get(row.userId);
      members.push({
        userId: row.userId,
        displayName: row.displayName || row.username,
        hardRestrictions: dedupe([
          ...(row.dietRestrictions ?? []),
          ...(eater?.hardRestrictions ?? []),
        ]),
        // Canonicalised at the boundary: the database holds lower-cased patterns
        // that the dietRules switch would otherwise ignore entirely.
        dietPattern: canonicaliseDietPattern(row.dietPattern),
        dietTypes: dedupe(prefs?.dietTypes ?? []),
        excludedIngredients: dedupe(prefs?.excludedIngredients ?? []),
      });
    }

    // 2. Children and other eaters with no account — the eater row is the owner.
    for (const eater of eaterRows) {
      if (eater.userId != null) continue;
      members.push({
        userId: null,
        displayName: eater.displayName,
        hardRestrictions: dedupe(eater.hardRestrictions ?? []),
        dietPattern: null,
        dietTypes: dedupe(eater.defaultDietTypes ?? []),
        excludedIngredients: [],
      });
    }

    const hardRestrictions = dedupe(members.flatMap((m) => m.hardRestrictions));
    const requester = members.find((m) => m.userId === userId);

    return {
      status: "resolved",
      householdId,
      requesterUserId: userId,
      requesterDietPattern: requester?.dietPattern ?? null,
      members,
      hardRestrictions,
      activeRestrictions: resolveActiveRestrictions(hardRestrictions),
      dietPatterns: dedupe(members.map((m) => m.dietPattern)),
      preferences: {
        dietTypes: dedupe(members.flatMap((m) => m.dietTypes)),
        excludedIngredients: dedupe(members.flatMap((m) => m.excludedIngredients)),
      },
    };
  } catch (err) {
    console.error(
      `[HouseholdSafety] Could not resolve dietary safety context for user ${userId}. ` +
        `Consumers MUST fail closed — an unresolved context is not an unrestricted household.`,
      err,
    );
    return unavailable;
  }
}

// ─── Interrogation ───────────────────────────────────────────────────────────

/**
 * True when the household has any hard dietary constraint that must gate meals.
 * False for an unrestricted household — callers may short-circuit and pay no cost.
 *
 * An `unavailable` context is NOT inactive: we do not know that it is safe, so the
 * gate must run (and refuse).
 */
export function isSafetyGateActive(ctx: HouseholdSafetyContext): boolean {
  if (ctx.status === "unavailable") return true;
  return ctx.hardRestrictions.length > 0 || !!ctx.requesterDietPattern;
}

/**
 * The single meal safety gate.
 *
 * Delegates entirely:
 *   - household hard restrictions → `candidateHardExcluded()` → canonical restriction
 *     library (word-boundary aliases, derived + hidden ingredients, excluded
 *     compounds) with a conservative substring fallback for custom strings.
 *   - the requester's diet pattern → `dietRules.shouldExcludeRecipe()`.
 *
 * Fails CLOSED: an unresolved safety context rejects every meal.
 */
export function isMealSafeForHousehold(
  meal: SafetyCheckableMeal,
  ctx: HouseholdSafetyContext,
): SafetyVerdict {
  // Fail-safe. We could not find out, so we do not serve it.
  if (ctx.status === "unavailable") {
    return { safe: false, reason: "safety-context-unavailable" };
  }

  const name = meal.name ?? "";
  const ingredients = (meal.ingredients ?? []).filter(Boolean);

  // 1. Household hard restrictions and allergens — the canonical library.
  //    Checked over name + ingredients, matching the planner gate exactly.
  if (candidateHardExcluded(name, ingredients, ctx.hardRestrictions)) {
    return {
      safe: false,
      reason: "household-hard-restriction",
      violatedRestrictions: ctx.activeRestrictions.map((r) => r.id),
    };
  }

  // 2. The requester's diet pattern — the shared dietRules engine, which since
  //    SURF1B4 resolves Vegan and Vegetarian through the same canonical library as
  //    step 1. The two steps now agree about what meat is; before, the restriction
  //    knew prosciutto and the pattern did not.
  //    `dietRestrictions` is passed too so Gluten-Free / Dairy-Free keep their
  //    existing dietRules treatment in addition to the canonical library's.
  //    Fields, not a joined blob — see `dietRules`' header.
  if (
    shouldExcludeRecipe(
      {
        name,
        category: meal.category,
        cuisine: meal.cuisine,
        description: meal.description,
        ingredients,
      },
      {
        dietPattern: ctx.requesterDietPattern,
        dietRestrictions: ctx.hardRestrictions,
      },
    )
  ) {
    return {
      safe: false,
      reason: `diet:${ctx.requesterDietPattern ?? ctx.hardRestrictions.join("/")}`,
    };
  }

  return { safe: true };
}

/**
 * The household's hard restrictions, for callers that need the list rather than a
 * verdict (the AI prompt blocks, chiefly).
 *
 * Throws on an unresolved context — a prompt builder that cannot see the household's
 * allergens must not silently emit no restriction block. That silence is the bug
 * this workstream exists to remove.
 */
export function requireHardRestrictions(ctx: HouseholdSafetyContext): string[] {
  if (ctx.status === "unavailable") {
    throw new HouseholdSafetyUnavailableError(ctx.requesterUserId);
  }
  return ctx.hardRestrictions;
}

/** Raised when safety context is required but could not be resolved. */
export class HouseholdSafetyUnavailableError extends Error {
  readonly code = "HOUSEHOLD_SAFETY_UNAVAILABLE";
  constructor(userId: number) {
    super(
      `Household dietary safety context could not be resolved for user ${userId}. ` +
        `Refusing to proceed: an unresolved context is not an unrestricted household.`,
    );
    this.name = "HouseholdSafetyUnavailableError";
  }
}
