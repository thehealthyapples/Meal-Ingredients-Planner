/**
 * test-intelligence-diary-binding.ts (INT10)
 * ===========================================
 * Verifies the FIFTH live capability binding: the read-only Diary capability. It
 * proves the reusable Port → Handler → Binding pattern (shown for the Planner in INT2,
 * Shopping in INT3, Nutrition / Knowledge in INT4, Pantry in INT8) against a fifth,
 * independent owner, end-to-end —
 *
 *   intent → capability registry → permission check → diary (owner) → response
 *
 * — WITHOUT a live database, by injecting an in-memory owner (DiaryReadPort) that
 * stands in for storage. The same handler in production is injected with the real owner;
 * the contract under test is identical.
 *
 * Covered: capability lookup (five live capabilities), permission validation (auth +
 * own-data only), handler invocation, diary-owner delegation, read "day" scope,
 * explain (stored wellness metrics), no diary day → honest gap, no metrics → honest
 * gap, missing date param → honest gap, unsupported intent handling, read-only
 * enforcement (write verbs never execute), and trust rules.
 *
 * Run with: npx tsx server/tests/test-intelligence-diary-binding.ts
 */

import {
  IntelligencePlatform,
  CapabilityRegistry,
  createDiaryReadHandler,
  intelligencePlatform,
  type IntelligenceContext,
  type DiaryReadPort,
} from "../intelligence/index.js";
import type { FoodDiaryDay, FoodDiaryEntry, FoodDiaryMetrics } from "../../shared/schema.js";

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
// In-memory owner (stands in for storage). All methods are user-scoped; the
// in-memory version mimics that by returning data keyed to userId 1 only.
// ---------------------------------------------------------------------------

const DIARY_DAY: FoodDiaryDay = {
  id: 1,
  userId: 1,
  date: "2026-06-30",
  notes: "Felt good today",
  createdAt: new Date("2026-06-30T08:00:00Z"),
  updatedAt: new Date("2026-06-30T20:00:00Z"),
};

const DIARY_ENTRIES: FoodDiaryEntry[] = [
  {
    id: 10,
    dayId: 1,
    userId: 1,
    mealSlot: "breakfast",
    name: "Porridge with berries",
    notes: "Added chia seeds",
    sourceType: "manual",
    sourcePlannerEntryId: null,
    createdAt: new Date("2026-06-30T08:30:00Z"),
  },
  {
    id: 11,
    dayId: 1,
    userId: 1,
    mealSlot: "lunch",
    name: "Chicken salad",
    notes: null,
    sourceType: "planner",
    sourcePlannerEntryId: 42,
    createdAt: new Date("2026-06-30T12:30:00Z"),
  },
];

const DIARY_METRICS: FoodDiaryMetrics = {
  id: 1,
  userId: 1,
  date: "2026-06-30",
  weightKg: 72.5,
  bmi: 22.4,
  moodApples: 4,
  sleepHours: 7.5,
  energyApples: 3,
  stuckToPlan: true,
  notes: "Good energy throughout the day",
  customValues: null,
  createdAt: new Date("2026-06-30T21:00:00Z"),
};

const calls: string[] = [];

function makePort(): DiaryReadPort {
  return {
    getFoodDiaryDay: async (userId, date) => {
      calls.push(`getFoodDiaryDay(${userId},${date})`);
      if (userId !== 1) return null;
      if (date === DIARY_DAY.date) return DIARY_DAY;
      return null;
    },
    getFoodDiaryEntries: async (userId, date) => {
      calls.push(`getFoodDiaryEntries(${userId},${date})`);
      if (userId !== 1) return [];
      if (date === DIARY_DAY.date) return DIARY_ENTRIES;
      return [];
    },
    getFoodDiaryMetrics: async (userId, date) => {
      calls.push(`getFoodDiaryMetrics(${userId},${date})`);
      if (userId !== 1) return null;
      if (date === DIARY_METRICS.date) return DIARY_METRICS;
      return null;
    },
  };
}

const user: IntelligenceContext = { role: "user", userId: "1", premium: false };
const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };

function platformWithFakeDiary(): IntelligencePlatform {
  const p = new IntelligencePlatform(new CapabilityRegistry());
  p.registerHandler("diary", createDiaryReadHandler(async () => makePort()), ["read", "explain"]);
  return p;
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  section("Capability lookup — Diary is the fifth live capability");
  assert(
    intelligencePlatform.getCapability("diary")!.availability === "available",
    "canonical singleton: diary capability is 'available' (handler bound)",
    intelligencePlatform.getCapability("diary")!.availability,
  );
  const live = intelligencePlatform.listCapabilities().filter((c) => c.availability === "available");
  assert(
    live.length === 13,
    "exactly THIRTEEN capabilities are live (planner + shopping + nutrition-knowledge + pantry + diary + profile + household + partners + meals + templates + analyser + meal-discovery + nutrition-discovery) — scope lock (updated by INT27)",
    String(live.length),
  );
  assert(
    live.some((c) => c.id === "planner") &&
      live.some((c) => c.id === "shopping") &&
      live.some((c) => c.id === "nutrition-knowledge") &&
      live.some((c) => c.id === "pantry") &&
      live.some((c) => c.id === "diary") &&
      live.some((c) => c.id === "profile") &&
      live.some((c) => c.id === "household") &&
      live.some((c) => c.id === "partners") &&
      live.some((c) => c.id === "meals") &&
      live.some((c) => c.id === "templates"),
    "the ten live capabilities are planner, shopping, nutrition-knowledge, pantry, diary, profile, household, partners, meals and templates",
  );
  assert(
    intelligencePlatform.getCapability("diary")!.executableIntents.includes("read") &&
      intelligencePlatform.getCapability("diary")!.executableIntents.includes("explain"),
    "executableIntents declares read + explain (truthful registry — INT6A)",
  );
  assert(
    !intelligencePlatform.getCapability("diary")!.executableIntents.includes("add") &&
      !intelligencePlatform.getCapability("diary")!.executableIntents.includes("delete") &&
      !intelligencePlatform.getCapability("diary")!.executableIntents.includes("import"),
    "add / delete / import are NOT in executableIntents (no live code path — INT6A)",
  );

  const platform = platformWithFakeDiary();
  assert(
    platform.getCapability("diary")!.availability === "available",
    "test platform: diary bound → available",
  );

  // -------------------------------------------------------------------------
  section("Permission validation — anonymous → denied");
  const anonRead = await platform.handle(
    { verb: "read", capabilityId: "diary", parameters: { scope: "day", date: "2026-06-30" } },
    anon,
  );
  assert(anonRead.status === "denied", "anonymous read → denied (no authenticated user)", anonRead.status);
  assert(
    /authenticated user/.test(anonRead.message ?? ""),
    "denial message cites authentication requirement",
  );

  const anonExplain = await platform.handle(
    { verb: "explain", capabilityId: "diary", parameters: { date: "2026-06-30" } },
    anon,
  );
  assert(anonExplain.status === "denied", "anonymous explain → denied", anonExplain.status);

  // -------------------------------------------------------------------------
  section("Handler invocation + delegation — read scope 'day'");
  calls.length = 0;
  const dayRead = await platform.handle(
    { verb: "read", capabilityId: "diary", parameters: { scope: "day", date: "2026-06-30" } },
    user,
  );
  assert(dayRead.status === "ok", "read day → ok", dayRead.status);
  const dr = dayRead.result as any;
  assert(dr?.scope === "day", "result scope is 'day'", String(dr?.scope));
  assert(dr?.date === "2026-06-30", "date echoed correctly", String(dr?.date));
  assert(dr?.notes === "Felt good today", "notes surfaced from owner", String(dr?.notes));
  assert(dr?.entryCount === 2, "entryCount matches owner data (2 entries)", String(dr?.entryCount));
  assert(dr?.entries?.length === 2, "entries array has 2 items", String(dr?.entries?.length));
  assert(
    dr?.entries?.[0]?.id === 10 && dr?.entries?.[0]?.mealSlot === "breakfast",
    "first entry: correct id and mealSlot",
    String(dr?.entries?.[0]?.id),
  );
  assert(
    dr?.entries?.[0]?.name === "Porridge with berries",
    "first entry: name surfaced correctly",
    String(dr?.entries?.[0]?.name),
  );
  assert(
    dr?.entries?.[1]?.sourceType === "planner",
    "second entry: sourceType surfaced correctly",
    String(dr?.entries?.[1]?.sourceType),
  );
  assert(dr?.source === "food-diary", "result is attributed to food-diary source", String(dr?.source));
  assert(
    !("userId" in (dr?.entries?.[0] ?? {})) && !("dayId" in (dr?.entries?.[0] ?? {})),
    "internal ownership fields (userId, dayId) are NOT surfaced in the projection",
  );
  assert(
    calls.some((c) => c.startsWith("getFoodDiaryDay(1,")),
    "delegated to the diary owner — getFoodDiaryDay called",
  );
  assert(
    calls.some((c) => c.startsWith("getFoodDiaryEntries(1,")),
    "delegated to the diary owner — getFoodDiaryEntries called",
  );

  // -------------------------------------------------------------------------
  section("Handler invocation + delegation — explain (stored wellness metrics)");
  calls.length = 0;
  const explain = await platform.handle(
    { verb: "explain", capabilityId: "diary", parameters: { date: "2026-06-30" } },
    user,
  );
  assert(explain.status === "ok", "explain → ok", explain.status);
  const er = explain.result as any;
  assert(er?.date === "2026-06-30", "date echoed back correctly", String(er?.date));
  assert(
    er?.metrics?.source === "food-diary-metrics",
    "metrics attributed to food-diary-metrics source",
    String(er?.metrics?.source),
  );
  assert(er?.metrics?.weightKg === 72.5, "weightKg surfaced from owner", String(er?.metrics?.weightKg));
  assert(er?.metrics?.bmi === 22.4, "bmi surfaced from owner", String(er?.metrics?.bmi));
  assert(er?.metrics?.moodApples === 4, "moodApples surfaced from owner", String(er?.metrics?.moodApples));
  assert(er?.metrics?.sleepHours === 7.5, "sleepHours surfaced from owner", String(er?.metrics?.sleepHours));
  assert(er?.metrics?.energyApples === 3, "energyApples surfaced from owner", String(er?.metrics?.energyApples));
  assert(er?.metrics?.stuckToPlan === true, "stuckToPlan surfaced from owner", String(er?.metrics?.stuckToPlan));
  assert(
    er?.metrics?.notes === "Good energy throughout the day",
    "notes surfaced from owner",
    String(er?.metrics?.notes),
  );
  assert(
    !("id" in (er?.metrics ?? {})) && !("userId" in (er?.metrics ?? {})),
    "internal fields (id, userId) are NOT surfaced in the metrics projection",
  );
  assert(
    calls.some((c) => c.startsWith("getFoodDiaryMetrics(1,")),
    "delegated to the diary owner — getFoodDiaryMetrics called",
  );

  // -------------------------------------------------------------------------
  section("Honest gaps — no diary day, bad scope, missing date param");
  const noDay = await platform.handle(
    { verb: "read", capabilityId: "diary", parameters: { scope: "day", date: "2000-01-01" } },
    user,
  );
  assert(noDay.status === "gap", "read for a date with no diary day → honest gap", noDay.status);
  assert(
    /will not fabricate/.test(noDay.message ?? ""),
    "gap message refuses to fabricate diary entries",
  );

  const badScope = await platform.handle(
    { verb: "read", capabilityId: "diary", parameters: { scope: "week", date: "2026-06-30" } },
    user,
  );
  assert(badScope.status === "gap", "read with unsupported scope → honest gap", badScope.status);
  assert(
    /scope/.test(badScope.message ?? ""),
    "gap message mentions the unsupported scope",
  );

  const noDate = await platform.handle(
    { verb: "read", capabilityId: "diary", parameters: { scope: "day" } },
    user,
  );
  assert(noDate.status === "gap", "read with no date param → honest gap", noDate.status);
  assert(
    /date/.test(noDate.message ?? ""),
    "gap message mentions the missing date param",
  );

  const noDateExplain = await platform.handle(
    { verb: "explain", capabilityId: "diary", parameters: {} },
    user,
  );
  assert(noDateExplain.status === "gap", "explain with no date param → honest gap", noDateExplain.status);
  assert(
    /date/.test(noDateExplain.message ?? ""),
    "explain gap message mentions missing date param",
  );

  const noMetrics = await platform.handle(
    { verb: "explain", capabilityId: "diary", parameters: { date: "2000-01-01" } },
    user,
  );
  assert(noMetrics.status === "gap", "explain for date with no stored metrics → honest gap", noMetrics.status);
  assert(
    /will not fabricate/.test(noMetrics.message ?? ""),
    "gap message refuses to fabricate wellness metrics",
  );

  // -------------------------------------------------------------------------
  section("Unsupported intent — verbs outside the allow-list");
  const shareIntent = await platform.handle(
    { verb: "share", capabilityId: "diary", parameters: {} },
    user,
  );
  assert(shareIntent.status === "unsupported_intent", "share not in diary allow-list → unsupported_intent", shareIntent.status);

  const searchIntent = await platform.handle(
    { verb: "search", capabilityId: "diary", parameters: {} },
    user,
  );
  assert(searchIntent.status === "unsupported_intent", "search not in diary allow-list → unsupported_intent", searchIntent.status);

  // -------------------------------------------------------------------------
  section("Read-only enforcement — write verbs return honest gap");
  // 'add' and 'delete' are in the diary allow-list (capabilityClass: "write"), so the
  // engine intercepts them at the CONFIRM step before the handler runs (unconfirmed).
  const addUnconfirmed = await platform.handle(
    { verb: "add", capabilityId: "diary", parameters: { date: "2026-06-30", name: "Apple" } },
    user,
  );
  assert(
    addUnconfirmed.status === "confirmation_required",
    "add (unconfirmed) → confirmation_required (never reaches handler)",
    addUnconfirmed.status,
  );

  // When confirmed, the handler is invoked — readOnlyVerbGuard throws an honest gap.
  const addConfirmed = await platform.handle(
    { verb: "add", capabilityId: "diary", parameters: { date: "2026-06-30", name: "Apple" } },
    user,
    { confirmed: true },
  );
  assert(addConfirmed.status === "gap", "add (confirmed) → honest gap: write not bound (read-only binding)", addConfirmed.status);
  assert(
    /Diary is bound to the Intelligence Platform read-only/.test(addConfirmed.message ?? ""),
    "gap message states the binding is read-only",
  );

  const deleteConfirmed = await platform.handle(
    { verb: "delete", capabilityId: "diary", parameters: { id: 10 } },
    user,
    { confirmed: true },
  );
  assert(deleteConfirmed.status === "gap", "delete (confirmed) → honest gap (no delete path)", deleteConfirmed.status);

  const importConfirmed = await platform.handle(
    { verb: "import", capabilityId: "diary", parameters: {} },
    user,
    { confirmed: true },
  );
  assert(importConfirmed.status === "gap", "import (confirmed) → honest gap (no import path)", importConfirmed.status);

  // Read verbs must never produce a confirmation tier.
  const readOk = await platform.handle(
    { verb: "read", capabilityId: "diary", parameters: { scope: "day", date: "2026-06-30" } },
    user,
  );
  assert(
    readOk.confirmation === "none" || readOk.confirmation === undefined,
    "read-only verbs never require confirmation (no write path)",
  );

  // -------------------------------------------------------------------------
  section("Trust rules — no fabrication, delegation observed");
  // No diary day for a date → gap, never an invented record.
  const noEntries = await platform.handle(
    { verb: "read", capabilityId: "diary", parameters: { scope: "day", date: "1999-12-31" } },
    user,
  );
  assert(
    noEntries.status === "gap",
    "trust: owner returns null day → gap, never an invented diary record",
    noEntries.status,
  );

  // No metrics for a date → gap, never fabricated values.
  const noMetricsCheck = await platform.handle(
    { verb: "explain", capabilityId: "diary", parameters: { date: "1999-12-31" } },
    user,
  );
  assert(
    noMetricsCheck.status === "gap",
    "trust: owner returns null metrics → gap, never fabricated weight/mood/sleep",
    noMetricsCheck.status,
  );

  // The projection must NOT include internal ownership fields.
  const dayCheck = await platform.handle(
    { verb: "read", capabilityId: "diary", parameters: { scope: "day", date: "2026-06-30" } },
    user,
  );
  const firstEntry = (dayCheck.result as any)?.entries?.[0];
  assert(
    firstEntry && !Object.prototype.hasOwnProperty.call(firstEntry, "userId"),
    "trust: userId is never surfaced in the diary entry projection",
  );
  assert(
    firstEntry && !Object.prototype.hasOwnProperty.call(firstEntry, "dayId"),
    "trust: dayId is never surfaced in the diary entry projection",
  );

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`INT10 Diary read-only binding: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
