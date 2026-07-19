/**
 * test-intelligence-planner-binding.ts (INT2)
 * ===========================================
 * Verifies the FIRST live capability binding: the read-only Planner. It proves the full
 * orchestration pipeline end-to-end —
 *
 *   intent → capability registry → permission check → planner (owner) → response
 *
 * — WITHOUT a live database, by injecting an in-memory owner (PlannerReadPort) that
 * stands in for storage + household. The same handler in production is injected with the
 * real owner; the contract under test is identical.
 *
 * Covered: capability lookup, permission validation (auth + cross-household), handler
 * invocation, planner delegation, read scopes (week/day), unsupported-intent handling,
 * read-only enforcement (write verbs blocked), and honest-gap behaviour (today / unknown
 * scope / missing rationale).
 *
 * Run with: npx tsx server/tests/test-intelligence-planner-binding.ts
 */

import {
  IntelligencePlatform,
  CapabilityRegistry,
  createPlannerReadHandler,
  intelligencePlatform,
  type IntelligenceContext,
  type PlannerReadPort,
  type PlannerMealRef,
} from "../intelligence/index.js";
import type { PlannerWeek, PlannerDay, PlannerEntry } from "../../shared/schema.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

// ---------------------------------------------------------------------------
// In-memory owner (stands in for storage + household). Records delegation calls.
// ---------------------------------------------------------------------------

const HOUSEHOLD = { user1: 100, user2: 200 } as const;

// `weekStartDate: null` is the honest fixture, not a placeholder: these stand for
// weeks that already existed, and an existing week's anchor is never back-filled
// (HT7; CONV1 P7 / SCH-2). This suite is about who may READ a week, not when it is —
// so the unanchored floor is exactly the right state to assert ownership against.
const weeks: PlannerWeek[] = [
  { id: 10, userId: 1, householdId: 100, weekNumber: 1, weekName: "Week 1", weekStartDate: null },
  { id: 11, userId: 1, householdId: 100, weekNumber: 2, weekName: "Week 2", weekStartDate: null },
  // Another household's week — must never be readable by user 1.
  { id: 20, userId: 2, householdId: 200, weekNumber: 1, weekName: "Other Week 1", weekStartDate: null },
];

const days: PlannerDay[] = [
  { id: 1000, weekId: 10, dayOfWeek: 0 },
  { id: 1001, weekId: 10, dayOfWeek: 1 },
  { id: 2000, weekId: 20, dayOfWeek: 0 },
];

const entries: PlannerEntry[] = [
  {
    id: 5000, dayId: 1000, mealType: "breakfast", audience: "adult", mealId: 9000,
    calories: 0, isDrink: false, drinkType: null, position: 0,
    adaptationResult: null, guestEaters: null, originalMealIdBeforeVariant: null,
  } as PlannerEntry,
  {
    id: 5001, dayId: 1000, mealType: "dinner", audience: "adult", mealId: 9001,
    calories: 0, isDrink: false, drinkType: null, position: 1,
    // This entry carries existing planner intelligence (household adaptation reasoning).
    adaptationResult: { summary: "Swapped to a nut-free variant for the household." } as any,
    guestEaters: null, originalMealIdBeforeVariant: null,
  } as PlannerEntry,
  {
    // COMP4 — an entry whose meal row cannot be read, so NEITHER owner can speak.
    // This is the case that must still gap honestly.
    id: 5002, dayId: 1001, mealType: "lunch", audience: "adult", mealId: 9404,
    calories: 0, isDrink: false, drinkType: null, position: 2,
    adaptationResult: null, guestEaters: null, originalMealIdBeforeVariant: null,
  } as PlannerEntry,
];

const meals: Record<number, PlannerMealRef> = {
  9000: { id: 9000, name: "Porridge" },
  9001: { id: 9001, name: "Veggie Curry" },
};

const calls: string[] = [];

/**
 * COMP4 — the canonical explanation, as the in-memory owner would return it.
 * Shaped exactly like `generateMealExplanation`'s output so the handler is
 * exercised against the real contract; the production port delegates to the real
 * owner (see planner-read-port.ts).
 */
const CANONICAL_EXPLANATIONS: Record<number, unknown> = {
  9000: {
    title: "Porridge",
    reasons: ["Matches your vegetarian diet preference"],
    evidence: [
      {
        dimension: "diet-match",
        source: "user_preferences.dietTypes",
        detail: "Matches your vegetarian diet preference",
      },
    ],
    scoreBreakdown: { healthScore: 70, upfScore: 80, budgetScore: 60, preferenceMatch: 90 },
  },
  9001: {
    title: "Veggie Curry",
    reasons: ["Adds 3 new plants to your week"],
    evidence: [
      {
        dimension: "plant-diversity",
        source: "planner-explanation-context (canonical plants)",
        detail: "Adds 3 new plants to your week",
      },
    ],
    scoreBreakdown: { healthScore: 75, upfScore: 85, budgetScore: 65, preferenceMatch: 80 },
  },
};

function makePort(): PlannerReadPort {
  return {
    explainPlannerEntry: async (entryId) => {
      calls.push(`explainPlannerEntry(${entryId})`);
      const entry = entries.find((e) => e.id === entryId);
      if (!entry) return null;
      const explanation = CANONICAL_EXPLANATIONS[entry.mealId];
      if (!explanation) return null;
      return {
        explanation: explanation as never,
        asOf: "current-week" as const,
        unknownTargets: ["fishTarget", "redMeatTarget", "weeklyBudget"],
      };
    },
    getHouseholdForUser: async (userId) => {
      calls.push(`getHouseholdForUser(${userId})`);
      if (userId === 1) return HOUSEHOLD.user1;
      if (userId === 2) return HOUSEHOLD.user2;
      throw new Error(`no household for user ${userId}`);
    },
    getPlannerWeeks: async (userId) => {
      calls.push(`getPlannerWeeks(${userId})`);
      const hh = userId === 1 ? HOUSEHOLD.user1 : HOUSEHOLD.user2;
      return weeks.filter((w) => w.householdId === hh);
    },
    getPlannerWeek: async (id) => {
      calls.push(`getPlannerWeek(${id})`);
      return weeks.find((w) => w.id === id);
    },
    getPlannerDays: async (weekId) => {
      calls.push(`getPlannerDays(${weekId})`);
      return days.filter((d) => d.weekId === weekId);
    },
    getPlannerDay: async (id) => {
      calls.push(`getPlannerDay(${id})`);
      return days.find((d) => d.id === id);
    },
    getPlannerEntriesForDay: async (dayId) => {
      calls.push(`getPlannerEntriesForDay(${dayId})`);
      return entries.filter((e) => e.dayId === dayId);
    },
    getPlannerEntriesForWeek: async (weekId) => {
      calls.push(`getPlannerEntriesForWeek(${weekId})`);
      const dayIds = days.filter((d) => d.weekId === weekId).map((d) => d.id);
      return entries.filter((e) => dayIds.includes(e.dayId));
    },
    getPlannerEntryById: async (id) => {
      calls.push(`getPlannerEntryById(${id})`);
      return entries.find((e) => e.id === id);
    },
    getMeal: async (id) => {
      calls.push(`getMeal(${id})`);
      return meals[id];
    },
  };
}

const user1: IntelligenceContext = { role: "user", userId: "1", premium: false };
const user2: IntelligenceContext = { role: "user", userId: "2", premium: false };
const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };

function platformWithFakePlanner(): IntelligencePlatform {
  const p = new IntelligencePlatform(new CapabilityRegistry());
  p.registerHandler("planner", createPlannerReadHandler(async () => makePort()));
  return p;
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  section("Capability lookup — Planner is the first live (available) capability");
  // The canonical singleton has the real binding applied (metadata only; no invoke → no DB).
  assert(
    intelligencePlatform.getCapability("planner")!.availability === "available",
    "canonical singleton: planner capability is 'available' (handler bound)",
    intelligencePlatform.getCapability("planner")!.availability,
  );
  // INT3 bound a second live capability (read-only Shopping) on the singleton, so the
  // planner is no longer the ONLY live one. The INT2 invariant that still holds is that
  // the planner itself remains available; every live capability must be a read-only binding.
  assert(
    intelligencePlatform.listCapabilities().some((c) => c.id === "planner" && c.availability === "available"),
    "planner remains a live (available) capability on the singleton",
  );

  const platform = platformWithFakePlanner();
  assert(platform.getCapability("planner")!.availability === "available", "test platform: planner bound → available");

  // -------------------------------------------------------------------------
  section("Handler invocation + planner delegation (read a specified week)");
  calls.length = 0;
  const week = await platform.handle({ verb: "read", capabilityId: "planner", parameters: { scope: "week", weekId: 10 } }, user1);
  assert(week.status === "ok", "read week → ok", week.status);
  const wr = week.result as any;
  assert(wr?.scope === "week" && wr?.weekId === 10 && wr?.weekNumber === 1, "result is the owned week");
  assert(wr?.days?.length === 2, "week has its two days", String(wr?.days?.length));
  assert(wr?.days?.[0]?.meals?.[0]?.mealName === "Porridge", "meal name resolved via the owner");
  assert(calls.some((c) => c.startsWith("getPlannerWeek(")) && calls.some((c) => c.startsWith("getMeal(")), "delegated to the planner/meal owner (no logic in the platform)");

  // Read a week by weekNumber (delegates via household-scoped getPlannerWeeks).
  const byNumber = await platform.handle({ verb: "read", capabilityId: "planner", parameters: { scope: "week", weekNumber: 2 } }, user1);
  assert(byNumber.status === "ok" && (byNumber.result as any)?.weekId === 11, "read week by weekNumber resolves correctly", byNumber.status);

  // -------------------------------------------------------------------------
  section("Read a specified day");
  const day = await platform.handle({ verb: "read", capabilityId: "planner", parameters: { scope: "day", dayId: 1000 } }, user1);
  assert(day.status === "ok", "read day by dayId → ok", day.status);
  assert((day.result as any)?.meals?.length === 2, "day returns its two meals");

  const dayByWeekDow = await platform.handle({ verb: "read", capabilityId: "planner", parameters: { scope: "day", weekNumber: 1, dayOfWeek: 1 } }, user1);
  assert(dayByWeekDow.status === "ok" && (dayByWeekDow.result as any)?.dayId === 1001, "read day by weekNumber + dayOfWeek resolves", dayByWeekDow.status);

  // -------------------------------------------------------------------------
  section("Permission validation — authenticated, own-data only");
  const anonRead = await platform.handle({ verb: "read", capabilityId: "planner", parameters: { scope: "week", weekId: 10 } }, anon);
  assert(anonRead.status === "denied", "anonymous (no userId) → denied", anonRead.status);

  const crossWeek = await platform.handle({ verb: "read", capabilityId: "planner", parameters: { scope: "week", weekId: 20 } }, user1);
  assert(crossWeek.status === "denied", "user 1 reading user 2's week → denied (no cross-household access)", crossWeek.status);
  assert(/no cross-household access/.test(crossWeek.message), "denial message is honest and leaks nothing");

  const crossDay = await platform.handle({ verb: "read", capabilityId: "planner", parameters: { scope: "day", dayId: 2000 } }, user1);
  assert(crossDay.status === "denied", "user 1 reading user 2's day → denied", crossDay.status);

  // user 2 CAN read their own week (proves it's ownership, not a blanket block).
  const ownerOk = await platform.handle({ verb: "read", capabilityId: "planner", parameters: { scope: "week", weekId: 20 } }, user2);
  assert(ownerOk.status === "ok", "user 2 reading their OWN week → ok", ownerOk.status);

  // -------------------------------------------------------------------------
  section("Explain why a meal was selected (existing planner intelligence only)");
  const explainOk = await platform.handle({ verb: "explain", capabilityId: "planner", parameters: { entryId: 5001 } }, user1);
  assert(explainOk.status === "ok", "explain entry with adaptation rationale → ok", explainOk.status);
  // COMP4 — this entry has BOTH facts, and they are reported side by side under
  // their own names. Blending them would let an adaptation note ("swapped to a
  // nut-free variant") be read as the reason the meal was chosen.
  assert(
    ((explainOk.result as any)?.sources ?? []).includes("planner-household-adaptation") &&
      ((explainOk.result as any)?.sources ?? []).includes("planner-explanation-service"),
    "both owners are named separately when both have something to say",
    JSON.stringify((explainOk.result as any)?.sources),
  );
  assert(
    (explainOk.result as any)?.explanation?.reasons?.[0] === "Adds 3 new plants to your week",
    "the canonical explanation is returned verbatim from the explanation owner",
  );

  // COMP4 — this assertion INVERTED, and the old one was asserting a falsehood.
  // Entry 5000 has no adaptation note, so this used to gap with "the Planner
  // records no selection rationale for this meal". That was not true: the
  // Planner had a full cited explanation for it, on its own screen, produced by
  // explainability-service.ts — the conversation layer simply had no way to
  // reach it. The gap was reporting the platform's own wiring as an absence of
  // knowledge, which is exactly the kind of statement an honest gap must not be.
  const explainCanonical = await platform.handle({ verb: "explain", capabilityId: "planner", parameters: { entryId: 5000 } }, user1);
  assert(explainCanonical.status === "ok", "explain an ordinarily-planned entry → the canonical explanation, not a gap", explainCanonical.status);
  assert(
    ((explainCanonical.result as any)?.sources ?? []).join() === "planner-explanation-service",
    "…sourced from the explanation owner alone, with no adaptation note invented",
    JSON.stringify((explainCanonical.result as any)?.sources),
  );
  assert(
    (explainCanonical.result as any)?.asOf === "current-week",
    "…and it says WHICH week it is explaining against, rather than implying it is historic",
  );

  // The honest gap survives where it is actually true: neither owner can speak.
  const explainGap = await platform.handle({ verb: "explain", capabilityId: "planner", parameters: { entryId: 5002 } }, user1);
  assert(explainGap.status === "gap", "explain entry no owner can speak for → honest gap", explainGap.status);
  assert(/will not fabricate/.test(explainGap.message), "gap message refuses to fabricate a reason");

  const explainCross = await platform.handle({ verb: "explain", capabilityId: "planner", parameters: { entryId: 9999 } }, user1);
  assert(explainCross.status === "denied", "explain a non-existent/foreign entry → denied", explainCross.status);

  // -------------------------------------------------------------------------
  section("Honest gaps (no fabrication)");
  const today = await platform.handle({ verb: "read", capabilityId: "planner", parameters: { scope: "today" } }, user1);
  assert(today.status === "gap", "read 'today' → honest gap (planner owns no calendar mapping)", today.status);
  assert(/no calendar mapping/.test(today.message), "today gap message explains why honestly");

  const noScope = await platform.handle({ verb: "read", capabilityId: "planner", parameters: {} }, user1);
  assert(noScope.status === "gap", "read with no scope → honest gap", noScope.status);

  const weekNoId = await platform.handle({ verb: "read", capabilityId: "planner", parameters: { scope: "week" } }, user1);
  assert(weekNoId.status === "gap", "read week with no identifier → honest gap", weekNoId.status);

  // -------------------------------------------------------------------------
  section("Read-only enforcement — write verbs never execute through the binding");
  // 'order' is not in the planner allow-list at all → engine-level unsupported_intent.
  const order = await platform.handle({ verb: "order", capabilityId: "planner" }, user1);
  assert(order.status === "unsupported_intent", "unsupported verb (order) → unsupported_intent", order.status);

  // 'delete' IS in the planner allow-list; it must stop at confirmation, never write.
  const delUnconfirmed = await platform.handle({ verb: "delete", capabilityId: "planner", parameters: { weekId: 10 } }, user1);
  assert(delUnconfirmed.status === "confirmation_required", "delete (unconfirmed) → confirmation_required (never reaches handler)", delUnconfirmed.status);

  // Even if confirmation is asserted, the read-only binding refuses to execute a write.
  const delConfirmed = await platform.handle({ verb: "delete", capabilityId: "planner", parameters: { weekId: 10 } }, user1, { confirmed: true });
  assert(delConfirmed.status === "gap", "delete (confirmed) → honest gap: write not bound (read-only binding)", delConfirmed.status);
  assert(/read-only/.test(delConfirmed.message), "gap message states the binding is read-only");

  // 'add' likewise: confirmed → honest gap, no mutation path exists.
  const addConfirmed = await platform.handle({ verb: "add", capabilityId: "planner", parameters: {} }, user1, { confirmed: true });
  assert(addConfirmed.status === "gap", "add (confirmed) → honest gap (no write path)", addConfirmed.status);

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`INT2 Planner read-only binding: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
