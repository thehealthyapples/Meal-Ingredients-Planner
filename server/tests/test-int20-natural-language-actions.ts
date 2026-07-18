/**
 * test-int20-natural-language-actions.ts — INT20 Natural-Language Action Resolution
 * ==================================================================================
 * Coverage:
 *   §1  Language layer — the six stated household commands parse to the right
 *       capability × verb, and questions are never mistaken for commands
 *   §2  Conversational reference resolution — weekdays, Week N, meal slots,
 *       today / tomorrow / tonight, and the deixis guard
 *   §3  Parameter resolution — the EXACT parameter names each COMP_ACT1 handler
 *       destructures, resolved from real capability reads (stubbed transport)
 *   §4  Clarification behaviour — one concise question, never a guess
 *   §5  The planner calendar boundary — "today" is refused for the planner
 *       (which owns no calendar mapping) but honoured for the diary
 *   §6  Executability gating and the confirmation tiers the platform resolves
 *   §7  Non-regression — an unresolvable write still falls through to refusal
 *
 * No database, no LLM, no network. The platform is real (registry + bindings);
 * only the capability READ transport is stubbed, so every parameter name and
 * confirmation tier asserted here is the production one.
 *
 * Run: npx tsx server/tests/test-int20-natural-language-actions.ts
 */

import { IntelligencePlatform, CapabilityRegistry } from "../intelligence/index.js";
import { bindPlannerReadCapability } from "../intelligence/bindings/planner.js";
import { bindShoppingReadCapability } from "../intelligence/bindings/shopping.js";
import { bindPantryReadCapability } from "../intelligence/bindings/pantry.js";
import { bindDiaryReadCapability } from "../intelligence/bindings/diary.js";
import { bindMealsReadCapability } from "../intelligence/bindings/meals.js";
import { parseActionCommand } from "../intelligence/conversation/action-language.js";
import {
  resolveActionCommand,
  type ActionResolution,
  type ActionResolutionContext,
  type ReadIntentFn,
} from "../intelligence/conversation/action-resolution.js";
import { detectWriteIntent } from "../intelligence/conversation/conversation-gateway.js";
import type { Intent, IntelligenceContext } from "../intelligence/types.js";

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.error(`  ✗ ${label}`);
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──────────────────────────────────────────`);
}

// ---------------------------------------------------------------------------
// A real platform with every write-bound capability registered.
//
// The ports throw: this suite never invokes a handler (it stubs the read
// transport), so a port call would be a test bug and should be loud.
// ---------------------------------------------------------------------------

const unusedPort = () => Promise.reject(new Error("port must not be called in INT20 tests"));

function buildPlatform(): IntelligencePlatform {
  const platform = new IntelligencePlatform(new CapabilityRegistry());
  bindPlannerReadCapability(platform, unusedPort as never, unusedPort as never);
  bindShoppingReadCapability(platform, unusedPort as never, unusedPort as never);
  bindPantryReadCapability(platform, unusedPort as never, unusedPort as never);
  bindDiaryReadCapability(platform, unusedPort as never, unusedPort as never);
  bindMealsReadCapability(platform, unusedPort as never);
  return platform;
}

const platform = buildPlatform();

const identity: IntelligenceContext = { role: "user", userId: "7" };

function ctx(overrides: Partial<ActionResolutionContext> = {}): ActionResolutionContext {
  return {
    identity,
    temporalAnchor: "2026-07-18", // a Saturday
    activePlannerWeekId: 55,
    ...overrides,
  };
}

/**
 * The household's world, as the stubbed capability reads report it.
 * Week 55 · dayOfWeek 2 (Tuesday) = dayId 220, 5 (Friday) = dayId 223.
 */
const WORLD = {
  days: {
    2: { dayId: 220, dayOfWeek: 2, meals: [] as unknown[] },
    3: {
      dayId: 221,
      dayOfWeek: 3,
      meals: [{ entryId: 900, mealType: "dinner", mealId: 41, mealName: "Fish Pie" }],
    },
    5: {
      dayId: 223,
      dayOfWeek: 5,
      meals: [{ entryId: 901, mealType: "dinner", mealId: 42, mealName: "Roast Chicken" }],
    },
    1: { dayId: 219, dayOfWeek: 1, meals: [] as unknown[] },
  } as Record<number, unknown>,
  meals: [
    { id: 77, name: "Tuna Spaghetti" },
    { id: 78, name: "Chilli" },
    { id: 79, name: "Chicken Curry" },
    { id: 80, name: "Chicken Soup" },
  ],
  shoppingExtras: [
    { id: 501, name: "Milk" },
    { id: 502, name: "Bread" },
  ],
  pantryItems: [
    { id: 601, ingredientKey: "bananas", displayName: "Bananas" },
    { id: 602, ingredientKey: "rice", displayName: null },
  ],
};

/** Records every capability read the resolver performs, for assertion. */
const readLog: Intent[] = [];

const stubRead: ReadIntentFn = async (intent) => {
  readLog.push(intent);
  const p = (intent.parameters ?? {}) as Record<string, unknown>;

  if (intent.capabilityId === "planner" && intent.verb === "read") {
    const dow = Number(p.dayOfWeek);
    const day = WORLD.days[dow];
    if (!day) return { status: "gap", capabilityId: "planner", verb: "read", message: "no day" };
    return { status: "ok", capabilityId: "planner", verb: "read", message: "ok", result: day };
  }
  if (intent.capabilityId === "meals" && intent.verb === "search") {
    const q = String(p.query ?? "").toLowerCase();
    const meals = WORLD.meals.filter((m) => m.name.toLowerCase().includes(q) || q.includes(m.name.toLowerCase()));
    return { status: "ok", capabilityId: "meals", verb: "search", message: "ok", result: { meals } };
  }
  if (intent.capabilityId === "shopping" && intent.verb === "read") {
    return {
      status: "ok", capabilityId: "shopping", verb: "read", message: "ok",
      result: { scope: "list", items: [{ id: 999, name: "Milk" }], extras: WORLD.shoppingExtras },
    };
  }
  if (intent.capabilityId === "pantry" && intent.verb === "read") {
    return {
      status: "ok", capabilityId: "pantry", verb: "read", message: "ok",
      result: { scope: "list", items: WORLD.pantryItems },
    };
  }
  return { status: "gap", capabilityId: intent.capabilityId, verb: intent.verb, message: "unstubbed" };
};

async function resolve(
  utterance: string,
  context: ActionResolutionContext = ctx(),
): Promise<ActionResolution | null> {
  const command = parseActionCommand(utterance);
  if (!command) return null;
  return resolveActionCommand(command, context, {
    read: stubRead,
    canExecute: (c, v) => platform.canExecute(c, v),
    getCapability: (c) => platform.getCapability(c),
  });
}

function params(r: ActionResolution | null): Record<string, unknown> {
  return r && r.kind === "proposal" ? (r.draft.parameters as Record<string, unknown>) : {};
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("\n════ INT20 — Natural-Language Action Resolution ════");

  // ── §1 Language layer ────────────────────────────────────────────────────
  section("§1 The six stated commands parse to the right capability × verb");

  const SIX: ReadonlyArray<readonly [string, string, string]> = [
    ["Add tuna spaghetti to Week 1 Tuesday lunch.", "planner", "add"],
    ["Move Friday dinner to Monday.", "planner", "move"],
    ["Replace Wednesday dinner with chilli.", "planner", "replace"],
    ["Remove milk from my shopping list.", "shopping", "delete"],
    ["Add bananas to my pantry.", "pantry", "add"],
    ["Log tonight's dinner.", "diary", "add"],
  ];

  for (const [utterance, capability, verb] of SIX) {
    const c = parseActionCommand(utterance);
    assert(
      c !== null && c.capability === capability && c.verb === verb,
      `"${utterance}" → ${capability}.${verb} (got ${c ? `${c.capability}.${c.verb}` : "null"})`,
    );
  }

  assert(
    parseActionCommand("Add milk to my shopping list.")?.capability === "shopping",
    "the destination decides the capability — the same verb and item route by where it goes",
  );

  section("§1b Questions are not commands (advisory guard preserved)");

  for (const question of [
    "What should I add to the pantry?",
    "Which items could I swap for cheaper alternatives?",
    "Can I add tuna to Tuesday?",
    "Why is Friday dinner empty?",
    "How do I add a meal?",
  ]) {
    assert(parseActionCommand(question) === null, `"${question}" is not parsed as a command`);
  }

  // ── §2 Reference resolution ──────────────────────────────────────────────
  section("§2 Conversational references");

  const tuesday = parseActionCommand("Add tuna spaghetti to Week 1 Tuesday lunch.");
  assert(tuesday?.target?.dayOfWeek === 2, "\"Tuesday\" → dayOfWeek 2 (declared key space, 0 = Sunday)");
  assert(tuesday?.target?.weekNumber === 1, "\"Week 1\" → weekNumber 1");
  assert(tuesday?.target?.mealSlot === "lunch", "\"lunch\" → mealSlot lunch");
  assert(tuesday?.subject === "tuna spaghetti", "the subject is captured without the destination");

  const tonight = parseActionCommand("Log tonight's dinner.");
  assert(tonight?.target?.dayOffset === 0, "\"tonight\" → today (offset 0)");
  assert(tonight?.target?.mealSlot === "dinner", "\"tonight\" also carries the dinner slot");

  const tomorrow = parseActionCommand("Add chilli to tomorrow's dinner.");
  assert(tomorrow?.target?.dayOffset === 1, "\"tomorrow\" → offset 1");

  const nextWeek = parseActionCommand("Add chilli to next week Monday dinner.");
  assert(nextWeek?.target?.weekRelation === "next", "\"next week\" → weekRelation next");
  assert(nextWeek?.target?.dayOfWeek === 1, "…alongside the named weekday");

  const tea = parseActionCommand("Replace Wednesday tea with chilli.");
  assert(tea?.source?.mealSlot === "dinner", "\"tea\" is the evening meal (British usage)");

  const abbrev = parseActionCommand("Move Fri dinner to Mon.");
  assert(
    abbrev?.source?.dayOfWeek === 5 && abbrev?.target?.dayOfWeek === 1,
    "abbreviated weekdays resolve (Fri → 5, Mon → 1)",
  );

  const deictic = parseActionCommand("Add it to my shopping list.");
  assert(
    deictic !== null && deictic.subject === undefined,
    "a bare demonstrative is not a name — the subject is left absent, not slugified",
  );

  // ── §3 Parameter resolution ──────────────────────────────────────────────
  section("§3 Resolved parameters match each handler's exact contract");

  readLog.length = 0;
  const add = await resolve("Add tuna spaghetti to Tuesday lunch.");
  assert(add?.kind === "proposal", "planner add resolves to a proposal");
  assert(
    JSON.stringify(params(add)) === JSON.stringify({ dayId: 220, mealId: 77, mealSlot: "lunch" }),
    `planner.add → { dayId, mealId, mealSlot } exactly (got ${JSON.stringify(params(add))})`,
  );
  assert(
    readLog.some((i) => i.capabilityId === "planner" && i.verb === "read") &&
      readLog.some((i) => i.capabilityId === "meals" && i.verb === "search"),
    "…resolved via EXISTING planner and meals reads, not storage",
  );

  const move = await resolve("Move Friday dinner to Monday.");
  assert(
    JSON.stringify(params(move)) === JSON.stringify({ entryId: 901, dayId: 219, mealSlot: "dinner" }),
    `planner.move → { entryId, dayId, mealSlot } exactly (got ${JSON.stringify(params(move))})`,
  );
  assert(
    move?.kind === "proposal" && move.draft.label.includes("Roast Chicken"),
    "…and the label names the meal actually being moved, read from the plan",
  );

  const replace = await resolve("Replace Wednesday dinner with chilli.");
  assert(
    JSON.stringify(params(replace)) === JSON.stringify({ entryId: 900, mealId: 78 }),
    `planner.replace → { entryId, mealId } exactly (got ${JSON.stringify(params(replace))})`,
  );

  const del = await resolve("Remove milk from my shopping list.");
  assert(
    JSON.stringify(params(del)) === JSON.stringify({ id: 501 }),
    `shopping.delete → { id } from the EXTRA, not the generated item (got ${JSON.stringify(params(del))})`,
  );

  const pantryAdd = await resolve("Add bananas to my pantry.", ctx({ selectedPantryCategory: "fruit" }));
  assert(
    JSON.stringify(params(pantryAdd)) === JSON.stringify({ ingredient: "bananas", category: "fruit" }),
    `pantry.add → { ingredient, category } — note "ingredient", not "name" (got ${JSON.stringify(params(pantryAdd))})`,
  );

  const pantryDel = await resolve("Remove bananas from my pantry.");
  assert(
    JSON.stringify(params(pantryDel)) === JSON.stringify({ id: 601 }),
    `pantry.delete → { id } (got ${JSON.stringify(params(pantryDel))})`,
  );

  const log = await resolve("Log porridge for breakfast.");
  assert(
    JSON.stringify(params(log)) === JSON.stringify({
      name: "porridge", mealSlot: "breakfast", date: "2026-07-18",
    }),
    `diary.add → { name, mealSlot, date } against the household's own anchor (got ${JSON.stringify(params(log))})`,
  );

  const snackPlanner = await resolve("Add chilli to Tuesday snacks.");
  assert(
    (params(snackPlanner) as { mealSlot?: string }).mealSlot === "snacks",
    "planner receives \"snacks\" (plural) — its own spelling",
  );
  const snackDiary = await resolve("Log crisps for a snack.");
  assert(
    (params(snackDiary) as { mealSlot?: string }).mealSlot === "snack",
    "diary receives \"snack\" (singular) — its own spelling; the divergence never leaks",
  );

  const yesterday = await resolve("Log soup for lunch yesterday.");
  assert(
    (params(yesterday) as { date?: string }).date === "2026-07-17",
    "\"yesterday\" shifts the civil date correctly (no zone drift)",
  );

  // ── §4 Clarification behaviour ───────────────────────────────────────────
  section("§4 Missing information earns ONE question, never a guess");

  const noSlot = await resolve("Add tuna spaghetti to Tuesday.");
  assert(noSlot?.kind === "clarification", "no meal slot → clarification");
  assert(
    noSlot?.kind === "clarification" && /breakfast, lunch or dinner/i.test(noSlot.question),
    "…naming the options concretely",
  );

  const unknownMeal = await resolve("Add lasagne to Tuesday lunch.");
  assert(
    unknownMeal?.kind === "clarification" && /couldn't find a meal/i.test(unknownMeal.question),
    "an unknown meal name → clarification, never an invented mealId",
  );

  const ambiguousMeal = await resolve("Add chicken to Tuesday lunch.");
  assert(
    ambiguousMeal?.kind === "clarification" && /more than one meal/i.test(ambiguousMeal.question),
    "two matching meals → asked which, never a silent pick",
  );

  const missingItem = await resolve("Remove quinoa from my shopping list.");
  assert(
    missingItem?.kind === "clarification" && /couldn't find/i.test(missingItem.question),
    "an item not on the list → clarification, never a fabricated id",
  );

  const emptySlot = await resolve("Move Tuesday dinner to Monday.");
  assert(
    emptySlot?.kind === "clarification" && /nothing planned/i.test(emptySlot.question),
    "moving from an empty slot → clarification",
  );

  const noCategory = await resolve("Add bananas to my pantry.");
  assert(
    noCategory?.kind === "clarification" && /larder, fridge, freezer/i.test(noCategory.question),
    "pantry add with no category → asked which section (the handler requires one)",
  );

  const noFood = await resolve("Log tonight's dinner.");
  assert(
    noFood?.kind === "clarification" && /What did you have for dinner/i.test(noFood.question),
    "\"Log tonight's dinner\" names no food → asked what was eaten, never assumed from the plan",
  );

  // ── §5 The planner calendar boundary ─────────────────────────────────────
  section("§5 Calendar language: refused for the planner, honoured for the diary");

  const plannerToday = await resolve("Add chilli to today's dinner.");
  assert(
    plannerToday?.kind === "clarification" && /six numbered weeks|which week/i.test(plannerToday.question),
    "\"today\" for the PLANNER → clarification (the planner owns no calendar mapping)",
  );

  const plannerNextWeek = await resolve("Add chilli to next week Monday dinner.");
  assert(
    plannerNextWeek?.kind === "clarification",
    "\"next week\" for the planner → clarification, never a picked week",
  );

  const diaryToday = await resolve("Log porridge for breakfast today.");
  assert(
    diaryToday?.kind === "proposal" &&
      (params(diaryToday) as { date?: string }).date === "2026-07-18",
    "…while the DIARY, which is calendar-shaped, honours \"today\" directly",
  );

  const noWeekPointer = await resolve(
    "Add tuna spaghetti to Tuesday lunch.",
    ctx({ activePlannerWeekId: undefined }),
  );
  assert(
    noWeekPointer?.kind === "clarification" && /which planner week/i.test(noWeekPointer.question),
    "no named week and no week on screen → asked which week, never defaulted to one",
  );

  // ── §6 Executability + confirmation tiers ────────────────────────────────
  section("§6 Gated by real executability; tiers resolved by the platform");

  assert(
    add?.kind === "proposal" && add.draft.confirmationTier === "light",
    "planner.add → light confirmation (permissions.ts, unchanged)",
  );
  assert(
    move?.kind === "proposal" && move.draft.confirmationTier === "required",
    "planner.move → required confirmation",
  );
  assert(
    del?.kind === "proposal" && del.draft.confirmationTier === "strong",
    "shopping.delete → strong confirmation",
  );
  assert(
    add?.kind === "proposal" && add.draft.capabilityId === "planner" && add.draft.verb === "add",
    "the proposal targets the registered capability id and canonical verb",
  );

  const unbound = new IntelligencePlatform(new CapabilityRegistry());
  const ungated = await (async () => {
    const c = parseActionCommand("Add tuna spaghetti to Tuesday lunch.");
    return resolveActionCommand(c!, ctx(), {
      read: stubRead,
      canExecute: (cap, v) => unbound.canExecute(cap, v),
      getCapability: (cap) => unbound.getCapability(cap),
    });
  })();
  assert(
    ungated.kind === "unresolved",
    "with no handler bound, no proposal is offered — a button that cannot work is never shown",
  );

  const anonymous = await resolve(
    "Add tuna spaghetti to Tuesday lunch.",
    ctx({ identity: { role: "user" } as IntelligenceContext }),
  );
  assert(anonymous?.kind === "unresolved", "an unscoped caller yields no write proposal");

  // ── §7 Non-regression ────────────────────────────────────────────────────
  section("§7 The existing refusal still covers what INT20 cannot express");

  for (const utterance of [
    "Generate a meal plan for next week.",
    "Create a shopping list.",
    "Update my profile name.",
  ]) {
    assert(
      detectWriteIntent(utterance) !== null && parseActionCommand(utterance) === null,
      `"${utterance}" is still detected as a write and still falls through to the refusal`,
    );
  }

  // REGRESSION GUARD for the defect end-to-end verification exposed.
  //
  // INT20 was first written INSIDE the `if (detectWriteIntent(...))` branch. That
  // guard is a coarse refusal trigger, not an enumeration of household commands,
  // and it does NOT match most of the canonical six — so five of them silently
  // never reached the resolver and fell through to the ordinary read pipeline.
  // Resolution therefore has to run BEFORE the guard. These assertions fail if
  // anyone ever nests it back inside.
  const GUARD_MISSES: readonly string[] = [
    "Remove milk from my shopping list.", // remove pattern wants meal/entry/item, not "list"
    "Log porridge for breakfast.",        // the guard has no log pattern at all
    "Add tuna spaghetti to Tuesday lunch.", // add pattern wants planner/list/pantry
  ];
  for (const utterance of GUARD_MISSES) {
    assert(
      detectWriteIntent(utterance) === null && parseActionCommand(utterance) !== null,
      `"${utterance}" is invisible to the write guard but IS a command — so INT20 must run first`,
    );
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════");
  console.log("INT20 — Natural-Language Action Resolution");
  console.log(`Passed: ${passed}  Failed: ${failed}`);
  if (failed > 0) {
    console.error("\nFailed assertions:");
    failures.forEach((f) => console.error(`  ✗ ${f}`));
    process.exit(1);
  }
  console.log("All tests passed ✓");
}

main().catch((err) => {
  console.error("[test-int20-natural-language-actions] Unexpected error:", err);
  process.exit(1);
});
