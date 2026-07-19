// BUS1 — the canonical registry of personal data.
//
// Governing architecture: docs/architecture/THA_TRUST_AND_COMPLIANCE_ARCHITECTURE.md
// docs/architecture/ARCHITECTURE_PRINCIPLES.md Principle 2 (one owner per fact),
// Principle 4 (runtime consumes one assembled model), Principle 6 (honest gaps).
//
// ═════════════════════════════════════════════════════════════════════════════
// THIS FILE IS THE SINGLE OWNER OF THE FACT "WHAT PERSONAL DATA DOES THA HOLD
// ABOUT A PERSON, AND WHAT HAPPENS TO IT WHEN THEY ASK FOR IT OR ASK US TO
// DELETE IT."
//
// Article 15 (access) and Article 17 (erasure) are the SAME QUESTION asked twice
// — "what do you have about me?" — with different verbs. Implementing them
// separately guarantees they drift, and the direction they drift is always the
// same and always the dangerous one: the export gets a new table because a
// developer wanted to see it, and the erasure does not, so THA quietly keeps
// data it has told a household it destroyed.
//
// So there is one registry with two verbs, and adding a personal-data table
// means adding ONE entry here. The completeness gate below then fails loudly
// if a table in shared/schema.ts holds a user_id and is not named in this file.
// ═════════════════════════════════════════════════════════════════════════════
//
// WHY EVERY ENTRY IS EXECUTABLE RATHER THAN DESCRIPTIVE:
//   The obvious design is a table of metadata — table name, column name, a
//   strategy enum — interpreted by a generic engine. It was rejected. This
//   schema is not regular enough for one: `meals` has no foreign key at all,
//   `admin_audit_log` has one that BLOCKS deletion, `household_eaters` uses SET
//   NULL, `planner_entries` is reachable only through two levels of parent with
//   no cascade at either, and the `session` table is invisible to Drizzle
//   entirely. A generic interpreter would need an escape hatch for each of those,
//   at which point it is a worse version of a function. Each entry therefore
//   carries the real query, and is readable as exactly what it does.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE STATE OF THE SCHEMA THIS REGISTRY HAD TO BE BUILT AGAINST — recorded here
// because it is the reason this file is as long as it is, and because anyone
// changing it needs to know that the database will not help them:
//
//   • ~45 tables hold data attributable to a person or their household.
//   • The CORE of a household's data — `meals`, `shopping_list`, `planner_weeks`,
//     `user_preferences`, `meal_plans`, `freezer_meals`, `basket_items`,
//     `product_history` — declares NO FOREIGN KEY to `users` at all. Deleting a
//     user leaves every one of those rows behind, silently and forever.
//   • ~10 tables DO declare a foreign key but no ON DELETE action, so Postgres
//     defaults to NO ACTION and the delete is BLOCKED. These are all operator
//     audit trails (`admin_audit_log`, the knowledge-review chain). They cannot
//     be deleted — an audit log you can erase by asking is not an audit log —
//     so the registry anonymises them instead.
//   • `household_eaters.user_id` is ON DELETE SET NULL, which means a person's
//     declared ALLERGIES — Art. 9 special category health data — survive the
//     deletion of their account as an orphaned row. This registry erases them
//     explicitly. It is the single most important line in this file.
//   • The `session` table is created by raw SQL in server/storage.ts and is not
//     in shared/schema.ts at all, so Drizzle cannot see it. Sessions of deleted
//     users would otherwise persist until natural expiry — meaning a "deleted"
//     account stays signed in on the device that deleted it.
//
// The pre-existing `storage.cleanupDemoUser` touched 13 of these ~45 tables and
// is RETIRED by this registry — see server/privacy/account-erasure-service.ts,
// which it now delegates to (Principle 8 — retire on introduction).
// ─────────────────────────────────────────────────────────────────────────────

import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import {
  activitySummary,
  adminAuditLog,
  basketItems,
  companionLearningRecommendations,
  conversations,
  foodDiaryDays,
  foodDiaryEntries,
  foodDiaryMetrics,
  freezerMeals,
  householdEaters,
  householdLearningSignals,
  householdMembers,
  households,
  ingredientProducts,
  ingredientSources,
  knowledgeReviewAudit,
  knowledgeReviewBatches,
  knowledgeReviewDecisions,
  knowledgeReleases,
  mealAllergens,
  mealDiets,
  mealItems,
  mealPairings,
  mealPlanEntries,
  mealPlanTemplateItems,
  mealPlanTemplates,
  mealPlans,
  mealUpliftApplications,
  meals,
  nutrition,
  opportunityDeliveries,
  plannerDays,
  plannerEntries,
  plannerWeeks,
  platformObservations,
  productEvents,
  productHistory,
  productMatches,
  recipeSourceAuditLog,
  savingsEvents,
  shoppingList,
  shoppingListExtras,
  supportRequests,
  userConsents,
  userHealthTrends,
  userItemUsage,
  userPantryItems,
  userPreferences,
  userStreaks,
  users,
  communities,
  communityMembers,
  communityInvitations,
} from "@shared/schema";

/**
 * The scope of one person's data, resolved ONCE before either verb runs.
 *
 * Resolving it up front matters for erasure specifically: the child rows of
 * `meals` and `planner_weeks` are reachable only through their parents, and
 * deleting the parents first would strand them permanently. So every id this
 * registry will need is collected while the parents still exist.
 */
export interface PersonalDataScope {
  userId: number;
  /** The household this person belongs to, or null if they are in none. */
  householdId: number | null;
  /** True when this person is the ONLY remaining member of that household. */
  isSoleHouseholdMember: boolean;
  mealIds: number[];
  plannerWeekIds: number[];
  plannerDayIds: number[];
  shoppingListItemIds: number[];
  mealPlanIds: number[];
  /** `meal_plan_templates.id` is a uuid varchar, not a serial — hence strings. */
  templateIds: string[];
}

/** What a category is for, in the household's own words. */
export type PersonalDataGroup =
  | "account"
  | "household"
  | "planning"
  | "food"
  | "companion"
  | "activity"
  | "compliance";

export interface PersonalDataEntry {
  /** Stable id. Appears as a key in the exported file — never renamed. */
  id: string;
  /** Household-facing name. Shown in Privacy Settings and used as the export key. */
  label: string;
  /** One plain line: what this is. Shown in Privacy Settings. */
  description: string;
  group: PersonalDataGroup;
  /** The physical tables this entry covers. Used by the completeness gate. */
  tables: string[];

  /**
   * Gather this data for an Article 15 export.
   * `null` means deliberately NOT exported — and `omittedBecause` must then say
   * why, in words a household would accept.
   */
  collect: ((scope: PersonalDataScope) => Promise<unknown>) | null;
  omittedBecause?: string;

  /**
   * Erase this data for an Article 17 request. Returns the number of rows
   * affected, for the erasure receipt.
   *
   * `null` means nothing to do — and `erasureNote` must then explain whether
   * that is because a cascade handles it, or because the data is lawfully
   * retained. "Nothing to do" is never left unexplained.
   */
  erase: ((scope: PersonalDataScope) => Promise<number>) | null;
  erasureNote?: string;
}

// ── Scope resolution ────────────────────────────────────────────────────────

export async function resolveScope(userId: number): Promise<PersonalDataScope> {
  const memberships = await db
    .select({ householdId: householdMembers.householdId })
    .from(householdMembers)
    .where(eq(householdMembers.userId, userId));

  const householdId = memberships[0]?.householdId ?? null;

  let isSoleHouseholdMember = false;
  if (householdId !== null) {
    const others = await db
      .select({ userId: householdMembers.userId })
      .from(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, householdId),
          sql`${householdMembers.userId} <> ${userId}`,
        ),
      );
    isSoleHouseholdMember = others.length === 0;
  }

  const mealRows = await db.select({ id: meals.id }).from(meals).where(eq(meals.userId, userId));
  const mealIds = mealRows.map((r) => r.id);

  // Planner weeks are found by BOTH user and household. The pre-existing demo
  // cleanup looked them up by household alone — and `planner_weeks.household_id`
  // is nullable, so every week created before a household existed was invisible
  // to it and survived deletion. Asking both ways is how that hole is closed.
  const weekRows = await db
    .select({ id: plannerWeeks.id })
    .from(plannerWeeks)
    .where(
      householdId === null
        ? eq(plannerWeeks.userId, userId)
        : sql`${plannerWeeks.userId} = ${userId} OR ${plannerWeeks.householdId} = ${householdId}`,
    );
  const plannerWeekIds = weekRows.map((r) => r.id);

  const dayRows = plannerWeekIds.length
    ? await db
        .select({ id: plannerDays.id })
        .from(plannerDays)
        .where(inArray(plannerDays.weekId, plannerWeekIds))
    : [];
  const plannerDayIds = dayRows.map((r) => r.id);

  const listRows = await db
    .select({ id: shoppingList.id })
    .from(shoppingList)
    .where(
      householdId === null
        ? eq(shoppingList.userId, userId)
        : sql`${shoppingList.userId} = ${userId} OR ${shoppingList.householdId} = ${householdId}`,
    );
  const shoppingListItemIds = listRows.map((r) => r.id);

  const planRows = await db
    .select({ id: mealPlans.id })
    .from(mealPlans)
    .where(eq(mealPlans.userId, userId));
  const mealPlanIds = planRows.map((r) => r.id);

  const templateRows = await db
    .select({ id: mealPlanTemplates.id })
    .from(mealPlanTemplates)
    .where(eq(mealPlanTemplates.ownerUserId, userId));
  const templateIds = templateRows.map((r) => r.id);

  return {
    userId,
    householdId,
    isSoleHouseholdMember,
    mealIds,
    plannerWeekIds,
    plannerDayIds,
    shoppingListItemIds,
    mealPlanIds,
    templateIds,
  };
}

// ── Small helpers ───────────────────────────────────────────────────────────

/** Rows affected by a Drizzle delete, normalised across driver shapes. */
function affected(result: unknown): number {
  const count = (result as { rowCount?: number | null } | undefined)?.rowCount;
  return typeof count === "number" ? count : 0;
}

/**
 * A delete keyed on a list of ids; a no-op (and no query) when the list is
 * empty. Generic over the id type because `meal_plan_templates` is keyed by a
 * uuid varchar while everything else uses a serial integer.
 */
async function deleteByIds<Id extends number | string, T>(
  run: (ids: Id[]) => Promise<T>,
  ids: Id[],
): Promise<number> {
  if (ids.length === 0) return 0;
  return affected(await run(ids));
}

// ═══════════════════════════════════════════════════════════════════════════
// THE REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

export const PERSONAL_DATA_REGISTRY: readonly PersonalDataEntry[] = [
  // ── Account ───────────────────────────────────────────────────────────────
  {
    id: "account",
    label: "Your account",
    description: "Your email address, your display name, and when you last signed in.",
    group: "account",
    tables: ["users"],
    collect: async (s) => {
      const [row] = await db.select().from(users).where(eq(users.id, s.userId));
      if (!row) return null;
      // Secrets are never exported. They are not "your data" in any useful
      // sense — the hash is not your password, and the tokens are live
      // credentials that would turn a downloaded file into a way in.
      const {
        password: _password,
        emailVerificationToken: _evt,
        passwordResetToken: _prt,
        ...safe
      } = row;
      return safe;
    },
    erase: async (s) => affected(await db.delete(users).where(eq(users.id, s.userId))),
    erasureNote:
      "Deleted last, after every reference to it has been removed or anonymised.",
  },
  {
    id: "preferences",
    label: "Your preferences",
    description: "How you like the product set up — units, portions, and your food preferences.",
    group: "account",
    tables: ["user_preferences"],
    collect: async (s) =>
      db.select().from(userPreferences).where(eq(userPreferences.userId, s.userId)),
    erase: async (s) =>
      affected(await db.delete(userPreferences).where(eq(userPreferences.userId, s.userId))),
  },

  // ── Household ─────────────────────────────────────────────────────────────
  {
    id: "household-membership",
    label: "Your household membership",
    description: "Which household you belong to and your role in it.",
    group: "household",
    tables: ["household_members"],
    collect: async (s) =>
      db.select().from(householdMembers).where(eq(householdMembers.userId, s.userId)),
    erase: async (s) =>
      affected(await db.delete(householdMembers).where(eq(householdMembers.userId, s.userId))),
    erasureNote:
      "Only YOUR membership. The household and the other people in it are untouched.",
  },
  {
    id: "eater-profile",
    label: "Your dietary needs",
    description:
      "The allergies, dietary restrictions and diet types recorded for you as a person in the household.",
    group: "household",
    tables: ["household_eaters"],
    collect: async (s) =>
      db.select().from(householdEaters).where(eq(householdEaters.userId, s.userId)),
    // ─────────────────────────────────────────────────────────────────────
    // THE MOST IMPORTANT ERASURE IN THIS FILE.
    //
    // `household_eaters.user_id` is ON DELETE SET NULL. Left to the database,
    // deleting the account would NULL the link and leave the row — so a
    // person's declared ALLERGIES, which are Article 9 special category health
    // data, would survive their erasure as an orphan inside the household,
    // still carrying their display name.
    //
    // A cascade would have been wrong too: an eater row may legitimately
    // outlive an account when a household member is a child or has no login.
    // The right answer is neither the database's default nor a blanket
    // cascade, which is exactly why it is written out here.
    // ─────────────────────────────────────────────────────────────────────
    erase: async (s) =>
      affected(await db.delete(householdEaters).where(eq(householdEaters.userId, s.userId))),
    erasureNote:
      "Erased explicitly. Health data must not outlive the account, and the database's own rule would have let it.",
  },
  {
    id: "household",
    label: "Your household",
    description: "The household itself — its name, settings and time zone.",
    group: "household",
    tables: ["households"],
    collect: async (s) =>
      s.householdId === null
        ? null
        : db.select().from(households).where(eq(households.id, s.householdId)),
    // Only erased when this person is the last one in it. Deleting a shared
    // household because one member left would destroy other people's data —
    // and their right to erasure is not engaged by yours.
    erase: async (s) => {
      if (s.householdId === null || !s.isSoleHouseholdMember) return 0;
      return affected(await db.delete(households).where(eq(households.id, s.householdId)));
    },
    erasureNote:
      "Erased only if you were the last member. Otherwise the household continues for the people still in it, and its shared data is theirs.",
  },

  // ── Planning ──────────────────────────────────────────────────────────────
  {
    id: "planner",
    label: "Your meal plans",
    description: "Your planner weeks, the days in them, and what you planned to eat.",
    group: "planning",
    tables: ["planner_weeks", "planner_days", "planner_entries"],
    collect: async (s) => ({
      weeks: s.plannerWeekIds.length
        ? await db.select().from(plannerWeeks).where(inArray(plannerWeeks.id, s.plannerWeekIds))
        : [],
      days: s.plannerDayIds.length
        ? await db.select().from(plannerDays).where(inArray(plannerDays.id, s.plannerDayIds))
        : [],
      entries: s.plannerDayIds.length
        ? await db.select().from(plannerEntries).where(inArray(plannerEntries.dayId, s.plannerDayIds))
        : [],
    }),
    // Deleted deepest-first. None of these three declares a foreign key, so
    // nothing cascades and the order is load-bearing: delete a week first and
    // its days and entries are unreachable forever.
    erase: async (s) => {
      let n = 0;
      n += await deleteByIds(
        (ids) => db.delete(plannerEntries).where(inArray(plannerEntries.dayId, ids)),
        s.plannerDayIds,
      );
      n += await deleteByIds(
        (ids) => db.delete(plannerDays).where(inArray(plannerDays.weekId, ids)),
        s.plannerWeekIds,
      );
      n += await deleteByIds(
        (ids) => db.delete(plannerWeeks).where(inArray(plannerWeeks.id, ids)),
        s.plannerWeekIds,
      );
      return n;
    },
  },
  {
    id: "meal-plans",
    label: "Your saved plans",
    description: "Older-style meal plans and the entries in them.",
    group: "planning",
    tables: ["meal_plans", "meal_plan_entries"],
    collect: async (s) => ({
      plans: s.mealPlanIds.length
        ? await db.select().from(mealPlans).where(inArray(mealPlans.id, s.mealPlanIds))
        : [],
      entries: s.mealPlanIds.length
        ? await db.select().from(mealPlanEntries).where(inArray(mealPlanEntries.planId, s.mealPlanIds))
        : [],
    }),
    erase: async (s) => {
      let n = 0;
      n += await deleteByIds(
        (ids) => db.delete(mealPlanEntries).where(inArray(mealPlanEntries.planId, ids)),
        s.mealPlanIds,
      );
      n += await deleteByIds(
        (ids) => db.delete(mealPlans).where(inArray(mealPlans.id, ids)),
        s.mealPlanIds,
      );
      return n;
    },
  },
  {
    id: "plan-templates",
    label: "Your plan templates",
    description: "Reusable week templates you created.",
    group: "planning",
    tables: ["meal_plan_templates", "meal_plan_template_items"],
    collect: async (s) =>
      s.templateIds.length
        ? db.select().from(mealPlanTemplates).where(inArray(mealPlanTemplates.id, s.templateIds))
        : [],
    erase: async (s) => {
      let n = 0;
      n += await deleteByIds(
        (ids) => db.delete(mealPlanTemplateItems).where(inArray(mealPlanTemplateItems.templateId, ids)),
        s.templateIds,
      );
      n += await deleteByIds(
        (ids) => db.delete(mealPlanTemplates).where(inArray(mealPlanTemplates.id, ids)),
        s.templateIds,
      );
      return n;
    },
  },

  // ── Food ──────────────────────────────────────────────────────────────────
  {
    id: "meals",
    label: "Your recipes",
    description: "The meals and recipes you saved, with their ingredients and nutrition.",
    group: "food",
    tables: ["meals", "nutrition", "meal_allergens", "meal_diets", "meal_items"],
    collect: async (s) =>
      s.mealIds.length
        ? {
            meals: await db.select().from(meals).where(inArray(meals.id, s.mealIds)),
            nutrition: await db.select().from(nutrition).where(inArray(nutrition.mealId, s.mealIds)),
            ingredients: await db.select().from(mealItems).where(inArray(mealItems.mealId, s.mealIds)),
            allergens: await db.select().from(mealAllergens).where(inArray(mealAllergens.mealId, s.mealIds)),
          }
        : { meals: [], nutrition: [], ingredients: [], allergens: [] },
    erase: async (s) => {
      let n = 0;
      // `meal_items` cascades from `meals`; the other three do not (no FK).
      for (const step of [
        (ids: number[]) => db.delete(nutrition).where(inArray(nutrition.mealId, ids)),
        (ids: number[]) => db.delete(mealAllergens).where(inArray(mealAllergens.mealId, ids)),
        (ids: number[]) => db.delete(mealDiets).where(inArray(mealDiets.mealId, ids)),
        (ids: number[]) => db.delete(ingredientSources).where(inArray(ingredientSources.mealId, ids)),
        (ids: number[]) => db.delete(mealUpliftApplications).where(inArray(mealUpliftApplications.mealId, ids)),
      ]) {
        n += await deleteByIds(step, s.mealIds);
      }
      n += await deleteByIds((ids) => db.delete(meals).where(inArray(meals.id, ids)), s.mealIds);
      return n;
    },
  },
  {
    id: "shopping",
    label: "Your shopping lists",
    description: "What was on your lists, the products matched to them, and anything you added by hand.",
    group: "food",
    tables: ["shopping_list", "shopping_list_extras", "product_matches", "ingredient_sources"],
    collect: async (s) => ({
      items: s.shoppingListItemIds.length
        ? await db.select().from(shoppingList).where(inArray(shoppingList.id, s.shoppingListItemIds))
        : [],
      extras: await db.select().from(shoppingListExtras).where(eq(shoppingListExtras.userId, s.userId)),
    }),
    erase: async (s) => {
      let n = 0;
      n += await deleteByIds(
        (ids) => db.delete(productMatches).where(inArray(productMatches.shoppingListItemId, ids)),
        s.shoppingListItemIds,
      );
      n += await deleteByIds(
        (ids) => db.delete(ingredientSources).where(inArray(ingredientSources.shoppingListItemId, ids)),
        s.shoppingListItemIds,
      );
      n += await deleteByIds(
        (ids) => db.delete(shoppingList).where(inArray(shoppingList.id, ids)),
        s.shoppingListItemIds,
      );
      // shopping_list_extras cascades from users, but is deleted explicitly so
      // the receipt reports a real number rather than a silent zero.
      n += affected(await db.delete(shoppingListExtras).where(eq(shoppingListExtras.userId, s.userId)));
      return n;
    },
  },
  {
    id: "pantry",
    label: "Your pantry and freezer",
    description: "What you told us is in the house, and what is in your freezer.",
    group: "food",
    tables: ["user_pantry_items", "freezer_meals", "basket_items"],
    collect: async (s) => ({
      pantry: await db.select().from(userPantryItems).where(eq(userPantryItems.userId, s.userId)),
      freezer: await db.select().from(freezerMeals).where(eq(freezerMeals.userId, s.userId)),
      basket: await db.select().from(basketItems).where(eq(basketItems.userId, s.userId)),
    }),
    erase: async (s) => {
      let n = 0;
      n += affected(await db.delete(userPantryItems).where(eq(userPantryItems.userId, s.userId)));
      n += affected(await db.delete(freezerMeals).where(eq(freezerMeals.userId, s.userId)));
      n += affected(await db.delete(basketItems).where(eq(basketItems.userId, s.userId)));
      return n;
    },
  },
  {
    id: "food-diary",
    label: "Your food diary",
    description: "What you recorded eating, and any measurements you chose to track.",
    group: "food",
    tables: ["food_diary_days", "food_diary_entries", "food_diary_metrics"],
    collect: async (s) => ({
      days: await db.select().from(foodDiaryDays).where(eq(foodDiaryDays.userId, s.userId)),
      entries: await db.select().from(foodDiaryEntries).where(eq(foodDiaryEntries.userId, s.userId)),
      metrics: await db.select().from(foodDiaryMetrics).where(eq(foodDiaryMetrics.userId, s.userId)),
    }),
    erase: async (s) => {
      let n = 0;
      n += affected(await db.delete(foodDiaryEntries).where(eq(foodDiaryEntries.userId, s.userId)));
      n += affected(await db.delete(foodDiaryDays).where(eq(foodDiaryDays.userId, s.userId)));
      n += affected(await db.delete(foodDiaryMetrics).where(eq(foodDiaryMetrics.userId, s.userId)));
      return n;
    },
  },
  {
    id: "product-history",
    label: "Products you looked at",
    description: "Products you scanned, compared or analysed.",
    group: "food",
    tables: ["product_history", "product_events"],
    collect: async (s) => ({
      history: await db.select().from(productHistory).where(eq(productHistory.userId, s.userId)),
      events: await db.select().from(productEvents).where(eq(productEvents.userId, s.userId)),
    }),
    erase: async (s) => {
      let n = 0;
      n += affected(await db.delete(productHistory).where(eq(productHistory.userId, s.userId)));
      n += affected(await db.delete(productEvents).where(eq(productEvents.userId, s.userId)));
      return n;
    },
  },

  // ── Companion ─────────────────────────────────────────────────────────────
  {
    id: "companion",
    label: "Your conversations with the Companion",
    description: "What you asked the Companion and what it replied.",
    group: "companion",
    tables: [
      "conversations",
      "conversation_threads",
      "conversation_turns",
      "companion_response_feedback",
      "companion_guidance_events",
      "companion_action_proposals",
    ],
    collect: async (s) => {
      // Exported through the conversation spine rather than table by table,
      // because a transcript is what a person actually asked for.
      const convos = await db.select().from(conversations).where(eq(conversations.userId, s.userId));
      return convos;
    },
    // This is the one fully-cascading chain in the schema: deleting the
    // `conversations` row removes threads, turns, feedback, guidance events and
    // action proposals with it. Deleted explicitly at the root so the count is
    // real rather than invisible.
    erase: async (s) =>
      affected(await db.delete(conversations).where(eq(conversations.userId, s.userId))),
    erasureNote: "Deleting the conversation removes every thread, turn and reply beneath it.",
  },

  // ── Activity ──────────────────────────────────────────────────────────────
  {
    id: "activity",
    label: "How you used the product",
    description: "Streaks, savings, activity summaries and health trends.",
    group: "activity",
    tables: [
      "user_streaks",
      "user_health_trends",
      "savings_events",
      "user_item_usage",
      "activity_summary",
      "opportunity_deliveries",
      "meal_uplift_applications",
    ],
    collect: async (s) => ({
      streaks: await db.select().from(userStreaks).where(eq(userStreaks.userId, s.userId)),
      healthTrends: await db.select().from(userHealthTrends).where(eq(userHealthTrends.userId, s.userId)),
      savings: await db.select().from(savingsEvents).where(eq(savingsEvents.userId, s.userId)),
      itemUsage: await db.select().from(userItemUsage).where(eq(userItemUsage.userId, s.userId)),
      summary: await db.select().from(activitySummary).where(eq(activitySummary.userId, s.userId)),
    }),
    erase: async (s) => {
      let n = 0;
      n += affected(await db.delete(userStreaks).where(eq(userStreaks.userId, s.userId)));
      n += affected(await db.delete(userHealthTrends).where(eq(userHealthTrends.userId, s.userId)));
      n += affected(await db.delete(savingsEvents).where(eq(savingsEvents.userId, s.userId)));
      n += affected(await db.delete(userItemUsage).where(eq(userItemUsage.userId, s.userId)));
      n += affected(await db.delete(activitySummary).where(eq(activitySummary.userId, s.userId)));
      n += affected(await db.delete(opportunityDeliveries).where(eq(opportunityDeliveries.userId, s.userId)));
      n += affected(await db.delete(mealUpliftApplications).where(eq(mealUpliftApplications.userId, s.userId)));
      return n;
    },
  },
  {
    id: "observations",
    label: "Diagnostic records",
    description: "Technical records of how the product behaved for you, used to find faults.",
    group: "activity",
    tables: ["platform_observations"],
    collect: async (s) =>
      db.select().from(platformObservations).where(eq(platformObservations.userId, s.userId)),
    erase: async (s) =>
      affected(await db.delete(platformObservations).where(eq(platformObservations.userId, s.userId))),
  },
  {
    id: "sessions",
    label: "Your signed-in sessions",
    description: "The devices currently signed in to your account.",
    group: "account",
    tables: ["session"],
    collect: null,
    omittedBecause:
      "A session is a live credential, not information about you. Exporting it would put a working key to the account into a downloaded file.",
    // The `session` table is created by raw SQL in server/storage.ts and is
    // absent from shared/schema.ts, so Drizzle cannot address it. Without this
    // step a "deleted" account stays signed in on the very device that deleted
    // it, until the session expires by itself.
    erase: async (s) => {
      const result = await db.execute(
        sql`DELETE FROM session WHERE (sess -> 'passport' ->> 'user')::int = ${s.userId}`,
      );
      return affected(result);
    },
    erasureNote: "Destroyed, so you are signed out everywhere immediately.",
  },

  // ── Compliance records ────────────────────────────────────────────────────
  {
    id: "consents",
    label: "What you agreed to",
    description: "Which version of our policies you agreed to, and when.",
    group: "compliance",
    tables: ["user_consents"],
    collect: async (s) => db.select().from(userConsents).where(eq(userConsents.userId, s.userId)),
    // Retained, but stripped of everything that identifies you. THA may still
    // have to demonstrate that consent was obtained for processing that already
    // happened (Art. 7(1)); it does not need to know whose it was.
    erase: async (s) => {
      const result = await db
        .update(userConsents)
        .set({ userId: null, recordedIp: null, recordedUserAgent: null })
        .where(eq(userConsents.userId, s.userId));
      return affected(result);
    },
    erasureNote:
      "Kept as an anonymous record, with the link to you and the device details removed. Required by law; identifies nobody.",
  },
  {
    id: "support-requests",
    label: "Messages you sent us",
    description: "Questions, issue reports, ideas and correction requests you sent.",
    group: "compliance",
    tables: ["support_requests"],
    collect: async (s) => db.select().from(supportRequests).where(eq(supportRequests.userId, s.userId)),
    erase: async (s) => {
      const result = await db
        .update(supportRequests)
        .set({
          userId: null,
          contactEmail: null,
          subject: "[redacted — account deleted]",
          body: "[redacted — account deleted]",
        })
        .where(eq(supportRequests.userId, s.userId));
      return affected(result);
    },
    erasureNote:
      "The text you wrote is redacted and the link to you removed. Only the fact that a request was made and answered remains.",
  },

  // ── Operator audit trails ─────────────────────────────────────────────────
  //
  // These exist only for accounts that used admin tools. They declare a real
  // foreign key with NO ON DELETE action, so Postgres BLOCKS the deletion —
  // meaning without this entry, erasing an operator's account fails outright
  // with a foreign key violation partway through.
  //
  // They are anonymised rather than deleted, and that is the correct outcome
  // rather than a compromise: an audit log that a person can erase by asking is
  // not an audit log, and the record of who approved a knowledge release is
  // needed to show the platform's food claims were reviewed. Art. 17(3)(b)
  // permits retention where processing is necessary for compliance with a legal
  // obligation. What is erased is the LINK to a person.
  {
    id: "operator-audit",
    label: "Operator records",
    description:
      "If you used the platform's operator tools, records of decisions you approved. Only applies to staff accounts.",
    group: "compliance",
    tables: [
      "admin_audit_log",
      "recipe_source_audit_log",
      "ingredient_products",
      "meal_pairings",
      "companion_learning_recommendations",
      "knowledge_review_batches",
      "knowledge_review_decisions",
      "knowledge_releases",
      "knowledge_review_audit",
      "household_learning_signals",
    ],
    collect: async (s) => {
      const rows = await db.select().from(adminAuditLog).where(eq(adminAuditLog.adminUserId, s.userId));
      return rows.length ? rows : null;
    },
    erase: async (s) => {
      let n = 0;
      const u = s.userId;
      // Every column below is a foreign key to users.id with no ON DELETE
      // action. Each must be nulled before the users row can be removed.
      n += affected(await db.update(adminAuditLog).set({ adminUserId: null }).where(eq(adminAuditLog.adminUserId, u)));
      n += affected(await db.update(adminAuditLog).set({ targetUserId: null }).where(eq(adminAuditLog.targetUserId, u)));
      n += affected(await db.update(recipeSourceAuditLog).set({ userId: null }).where(eq(recipeSourceAuditLog.userId, u)));
      n += affected(await db.update(ingredientProducts).set({ createdBy: null }).where(eq(ingredientProducts.createdBy, u)));
      n += affected(await db.update(mealPairings).set({ createdBy: null }).where(eq(mealPairings.createdBy, u)));
      n += affected(await db.update(companionLearningRecommendations).set({ reviewedBy: null }).where(eq(companionLearningRecommendations.reviewedBy, u)));
      n += affected(await db.update(knowledgeReviewBatches).set({ createdByUserId: null }).where(eq(knowledgeReviewBatches.createdByUserId, u)));
      n += affected(await db.update(knowledgeReviewDecisions).set({ approvedByUserId: null }).where(eq(knowledgeReviewDecisions.approvedByUserId, u)));
      n += affected(await db.update(knowledgeReleases).set({ approvedByUserId: null }).where(eq(knowledgeReleases.approvedByUserId, u)));
      n += affected(await db.update(knowledgeReleases).set({ publishedByUserId: null }).where(eq(knowledgeReleases.publishedByUserId, u)));
      n += affected(await db.update(knowledgeReleases).set({ rolledBackByUserId: null }).where(eq(knowledgeReleases.rolledBackByUserId, u)));
      n += affected(await db.update(knowledgeReviewAudit).set({ actorUserId: null }).where(eq(knowledgeReviewAudit.actorUserId, u)));
      n += affected(await db.update(householdLearningSignals).set({ confirmedByUserId: null }).where(eq(householdLearningSignals.confirmedByUserId, u)));
      return n;
    },
    erasureNote:
      "The decisions stay, so the platform can still show its food knowledge was reviewed. Your name is removed from them.",
  },
  {
    id: "security-records",
    label: "Security records",
    description: "Records of sign-in attempts, held in a form that cannot be read back.",
    group: "compliance",
    tables: ["auth_rate_limits"],
    collect: null,
    omittedBecause:
      "These are stored as one-way cryptographic hashes, so there is nothing to export — we cannot read them back either.",
    erase: null,
    erasureNote:
      "Nothing to erase. The records are hashed, cannot be linked back to you, and expire by themselves within days.",
  },
  {
    // ── COMM1 — Community Foundation (SoT D37) ──────────────────────────
    //
    // THE ERASURE STORY IS THE INTERESTING PART, and it follows from the
    // membership grain. A community membership belongs to the HOUSEHOLD, not
    // to the person. So:
    //
    //   • If this person is NOT the last member of their household, the
    //     household continues and so do its community memberships. Erasing the
    //     person must NOT remove the household from its neighbourhood — that
    //     would be one member silently withdrawing everyone else.
    //   • If this person IS the last member, the household itself is erased by
    //     the `household` entry above, and `community_members.household_id` is
    //     ON DELETE CASCADE, so the memberships and any invitations addressed
    //     to that household go with it.
    //
    // Both paths are therefore handled without a delete of our own, which is
    // why `erase` is null here — and the note says which cascade does it, as
    // the registry contract requires.
    id: "community-membership",
    label: "Your household's communities",
    description:
      "Which neighbourhoods and communities your household belongs to, and any invitations addressed to it.",
    group: "household",
    tables: ["communities", "community_members", "community_invitations"],
    collect: async (s) =>
      s.householdId === null
        ? null
        : {
            memberships: await db
              .select({
                communityId: communityMembers.communityId,
                role: communityMembers.role,
                status: communityMembers.status,
                joinedAt: communityMembers.joinedAt,
                leftAt: communityMembers.leftAt,
              })
              .from(communityMembers)
              .where(eq(communityMembers.householdId, s.householdId)),
            communities: await db
              .select({ id: communities.id, name: communities.name, kind: communities.kind })
              .from(communities)
              .innerJoin(communityMembers, eq(communityMembers.communityId, communities.id))
              .where(eq(communityMembers.householdId, s.householdId)),
            // Tokens are DELIBERATELY excluded. An export is a document a
            // household may store or forward; a live bearer token inside it
            // would be a standing grant to join a community, sitting in a file.
            invitations: await db
              .select({
                id: communityInvitations.id,
                communityId: communityInvitations.communityId,
                status: communityInvitations.status,
                expiresAt: communityInvitations.expiresAt,
                createdAt: communityInvitations.createdAt,
              })
              .from(communityInvitations)
              .where(eq(communityInvitations.invitedHouseholdId, s.householdId)),
          },
    erase: null,
    erasureNote:
      "Your household's community memberships belong to the household, not to you alone — erasing your account does not withdraw the rest of your household from a neighbourhood. If you are the last person in your household, the household is erased and its memberships and invitations are removed with it.",
  },
] as const;

/**
 * The physical tables this registry knows about — used by the completeness gate
 * in server/tests, which fails when a table in shared/schema.ts carries a
 * user_id and is not named by any entry above.
 *
 * A gate rather than a comment, because the failure this guards against is
 * silent by nature: the platform keeps working perfectly while quietly retaining
 * data it has told a household it destroyed.
 */
export function registeredTables(): Set<string> {
  const set = new Set<string>();
  for (const entry of PERSONAL_DATA_REGISTRY) {
    for (const t of entry.tables) set.add(t);
  }
  return set;
}

/**
 * Tables deliberately outside the registry because they hold no personal data:
 * reference knowledge, catalogue content, and platform configuration.
 * Named explicitly so the gate can tell "reviewed and excluded" from "forgotten".
 */
export const NON_PERSONAL_TABLES: readonly string[] = [
  "barcode_lookup_events",
  "privacy_activity_log",
];
