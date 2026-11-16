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
 *   §5  Dated planner weekdays resolve; unavailable dates clarify
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
import { detectWriteIntent, recentPlannerDietaryCorrection, recentPlannerSlotAnswer, recentPlannerMealNameAnswer } from "../intelligence/conversation/conversation-gateway.js";
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
    4: { dayId: 224, dayOfWeek: 4, meals: [] as unknown[] },
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
    { id: 81, name: "Spaghetti Bolognese" },
    // Same name as id 81, but the system-library stub — a household member who
    // saved their own copy of a common recipe collides with this by construction.
    { id: 82, name: "Spaghetti Bolognese", isSystemMeal: true },
    // COMP3 — a "quick meal": created via meals.add (or by hand on the
    // Build-a-Meal page) with no parts at all.
    { id: 83, name: "Steak And Chips", ingredientCount: 0 },
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
    if (typeof p.weekStartDate === "string") {
      const day = WORLD.days[dow];
      if (!day) return { status: "gap", capabilityId: "planner", verb: "read", message: "no dated week/day" };
      return { status: "ok", capabilityId: "planner", verb: "read", message: "ok", result: day };
    }
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
    checkPlannerMeal: async () => ({ kind: "safe" }),
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
  assert(parseActionCommand("Add chilli to next Wednesday dinner.")?.target?.weekRelation === "next", "\"next Wednesday\" marks next calendar week");
  assert(parseActionCommand("Add chilli to this Thursday dinner.")?.target?.weekRelation === "this", "\"this Thursday\" marks this calendar week");

  const bolognese = parseActionCommand("Can you add a spaghetti bolognaise as Thursdays dinner next week");
  assert(bolognese?.capability === "planner" && bolognese.verb === "add", "as Thursday's dinner is a planner add");
  assert(bolognese?.subject === "spaghetti bolognaise" && bolognese.target?.dayOfWeek === 4 &&
    bolognese.target.mealSlot === "dinner" && bolognese.target.weekRelation === "next",
  "reported wording retains meal, Thursday dinner, and next week without guessing a week number");
  assert(recentPlannerDietaryCorrection("I can buy gluten free pasta", [
    { role: "user", utterance: "Can you add a spaghetti bolognaise as Thursdays dinner next week" },
    { role: "assistant", utterance: "That saved meal contains gluten." },
  ])?.subject === "spaghetti bolognaise", "gluten-free correction continues the immediately prior planner request");
  assert(recentPlannerDietaryCorrection("I can buy gluten free pasta", [
    { role: "user", utterance: "What is on my shopping list?" },
    { role: "assistant", utterance: "Milk." },
  ]) === null, "unrelated conversation does not inherit a planner action");

  // COMP3 — a multi-step chain: slot asked → answered with a bare slot word →
  // meal not found → "yes" to create it as a quick meal. The affirmative's
  // immediately PRIOR user turn is just "dinner", which parses as no command
  // at all — the anchor is two steps back, not one, and must still be found.
  assert(
    recentPlannerDietaryCorrection("yes", [
      { role: "user", utterance: "Add steak and chips to Wednesday." },
      { role: "assistant", utterance: "Which meal slot should \"steak and chips\" go in — breakfast, lunch or dinner?" },
      { role: "user", utterance: "dinner" },
      { role: "assistant", utterance: "I don't have a saved recipe called \"steak and chips\" in your meals. Would you like me to add it as a quick meal so I can plan it in, or tell me the correct name?" },
    ])?.subject === "steak and chips",
    "\"yes\" after a slot-answer hop still finds the ORIGINAL add request, not the bare slot word in between",
  );
  // The search must stop dead at a turn that named some OTHER real command —
  // never walk past it to adopt an even-older, unrelated planner action.
  assert(
    recentPlannerDietaryCorrection("yes", [
      { role: "user", utterance: "Add steak and chips to Wednesday dinner." },
      { role: "assistant", utterance: "Add steak and chips to Wednesday dinner? Confirm below and I'll do it." },
      { role: "user", utterance: "Remove milk from my shopping list." },
      { role: "assistant", utterance: "Removed milk from your shopping list." },
    ]) === null,
    "the search stops at an unrelated real command (even a parseable one of the wrong type) — it never reaches further back past it",
  );

  // COMP3 — a bare slot-word reply answers the slot clarification, merging
  // into the prior planner.add, never falling through to the generic fallback.
  const slotAnswer = recentPlannerSlotAnswer("dinner", [
    { role: "user", utterance: "Add steak and chips to Tuesday." },
    { role: "assistant", utterance: "Which meal slot should \"steak and chips\" go in — breakfast, lunch or dinner?" },
  ]);
  assert(
    slotAnswer?.subject === "steak and chips" && slotAnswer.target?.dayOfWeek === 2 && slotAnswer.target.mealSlot === "dinner",
    "a bare \"dinner\" reply merges into the prior add — same meal, same day, now with a slot",
  );
  assert(
    recentPlannerSlotAnswer("for lunch please", [
      { role: "user", utterance: "Add steak and chips to Tuesday." },
      { role: "assistant", utterance: "Which meal slot?" },
    ])?.target?.mealSlot === "lunch",
    "\"for lunch please\" still resolves to a plain slot word among short filler",
  );
  assert(
    recentPlannerSlotAnswer("Add tuna spaghetti to Tuesday lunch.", [
      { role: "user", utterance: "Add steak and chips to Tuesday." },
      { role: "assistant", utterance: "Which meal slot?" },
    ]) === null,
    "a longer, independently-parseable command mentioning \"lunch\" is never mistaken for a bare slot answer",
  );
  assert(
    recentPlannerSlotAnswer("dinner", [
      { role: "user", utterance: "What is on my shopping list?" },
      { role: "assistant", utterance: "Milk." },
    ]) === null,
    "a bare slot word after an unrelated prior turn inherits nothing",
  );
  assert(
    recentPlannerSlotAnswer("dinner", [
      { role: "user", utterance: "Add steak and chips to Tuesday dinner." },
      { role: "assistant", utterance: "Add steak and chips to Tuesday dinner? Confirm below and I'll do it." },
    ]) === null,
    "a slot word is never merged in when the prior command ALREADY named a slot",
  );

  // "move" and "replace" ask the SAME bare slot question, but about the
  // SOURCE entry, not the target — the merge must land on the right side.
  const moveSlotAnswer = recentPlannerSlotAnswer("dinner", [
    { role: "user", utterance: "Move Thursday to Friday." },
    { role: "assistant", utterance: "Which meal should I move — breakfast, lunch or dinner?" },
  ]);
  assert(
    moveSlotAnswer?.verb === "move" && moveSlotAnswer.source?.mealSlot === "dinner" &&
      moveSlotAnswer.source.dayOfWeek === 4 && moveSlotAnswer.target?.dayOfWeek === 5,
    "a bare slot reply to a MOVE clarification merges into the SOURCE, not the target",
  );
  const replaceSlotAnswer = recentPlannerSlotAnswer("lunch", [
    { role: "user", utterance: "Replace Wednesday with chilli." },
    { role: "assistant", utterance: "Which meal should I replace — breakfast, lunch or dinner?" },
  ]);
  assert(
    replaceSlotAnswer?.verb === "replace" && replaceSlotAnswer.source?.mealSlot === "lunch" && replaceSlotAnswer.subject === "chilli",
    "a bare slot reply to a REPLACE clarification merges into the source and keeps the named replacement",
  );
  assert(
    recentPlannerSlotAnswer("dinner", [
      { role: "user", utterance: "Move Thursday dinner to Friday." },
      { role: "assistant", utterance: "Which day should Thursday dinner move to?" },
    ]) === null,
    "a slot word is never merged into a MOVE whose source slot is already named",
  );

  // COMP3 — naming one of the offered candidates outright resolves the
  // ambiguity directly: "Chicken Pasta Bake" replaces the ambiguous "pasta
  // bake" subject, never left to fall through to the generic fallback.
  const nameAnswer = recentPlannerMealNameAnswer("Chicken Pasta Bake", [
    { role: "user", utterance: "Add pasta bake to Monday." },
    { role: "assistant", utterance: "Which meal slot should \"pasta bake\" go in — breakfast, lunch or dinner?" },
    { role: "user", utterance: "Dinner" },
    { role: "assistant", utterance: "I found more than one meal like \"pasta bake\" — did you mean Chicken Pasta Bake, Kids Pasta Bake or Tuna Pasta Bake?" },
  ]);
  assert(
    nameAnswer?.subject === "Chicken Pasta Bake" && nameAnswer.target?.dayOfWeek === 1 && nameAnswer.target.mealSlot === "dinner",
    "naming a candidate outright resolves to that EXACT name, with the slot answered earlier in the SAME chain still applied",
  );
  // Only an EXACT match to an offered candidate counts — never a fuzzy guess.
  assert(
    recentPlannerMealNameAnswer("Some Other Meal", [
      { role: "user", utterance: "Add pasta bake to Monday dinner." },
      { role: "assistant", utterance: "I found more than one meal like \"pasta bake\" — did you mean Chicken Pasta Bake, Kids Pasta Bake or Tuna Pasta Bake?" },
    ]) === null,
    "a reply that doesn't exactly name an offered candidate resolves to nothing — never a fuzzy guess",
  );
  // The prior assistant turn must actually be the ambiguous-name question —
  // a name-shaped reply to some OTHER question is never adopted.
  assert(
    recentPlannerMealNameAnswer("Chicken Pasta Bake", [
      { role: "user", utterance: "Add chicken pasta bake to Monday dinner." },
      { role: "assistant", utterance: "Add Chicken Pasta Bake to Monday dinner? Confirm below and I'll do it." },
    ]) === null,
    "a name-shaped reply is only adopted after the specific \"did you mean\" question, never any other assistant turn",
  );

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
  assert(
    add?.kind === "proposal" && !/quick meal/i.test(add.draft.label),
    "a real recipe's confirmation never claims it has no recipe",
  );

  // COMP3 — a quick meal (zero ingredients, e.g. created via meals.add) must
  // say so in the very sentence that asks the household to confirm, not be
  // indistinguishable from a real recipe until they open the day later.
  const addQuickMeal = await resolve("Add steak and chips to Tuesday lunch.");
  assert(
    addQuickMeal?.kind === "proposal" && /no recipe saved/i.test(addQuickMeal.draft.label) &&
      /quick meal/i.test(addQuickMeal.draft.label),
    "adding a quick meal (no ingredients) flags that plainly in the confirmation itself",
  );
  assert(
    addQuickMeal?.kind === "proposal" &&
      JSON.stringify(params(addQuickMeal)) === JSON.stringify({ dayId: 220, mealId: 83, mealSlot: "lunch" }),
    "the no-recipe caveat changes only the label, never the actual write parameters",
  );

  readLog.length = 0;
  const datedThursday = await resolve("Add chilli to Thursday dinner.", ctx({ temporalAnchor: "2026-11-14" }));
  const datedThursdayRead = readLog.find((i) => i.capabilityId === "planner");
  assert(
    datedThursday?.kind === "proposal" && datedThursdayRead?.parameters?.weekStartDate === "2026-11-16" &&
      datedThursdayRead.parameters?.weekNumber === undefined && datedThursdayRead.parameters?.weekId === undefined,
    "bare Thursday after the 12th resolves to its next occurrence (19 Nov, week starting 2026-11-16), never the active ordinal week",
  );

  readLog.length = 0;
  const nextWednesday = await resolve("Add chilli to next Wednesday dinner.", ctx({ temporalAnchor: "2026-11-14" }));
  const nextWednesdayRead = readLog.find((i) => i.capabilityId === "planner");
  assert(
    nextWednesday?.kind === "proposal" && nextWednesdayRead?.parameters?.weekStartDate === "2026-11-16",
    "next Wednesday resolves against the next calendar week's dated anchor",
  );

  readLog.length = 0;
  const explicitWeek = await resolve("Add chilli to Week 1 Thursday dinner.", ctx({ temporalAnchor: "2026-11-14" }));
  const explicitWeekRead = readLog.find((i) => i.capabilityId === "planner");
  assert(
    explicitWeek?.kind === "proposal" && explicitWeekRead?.parameters?.weekNumber === 1 &&
      explicitWeekRead.parameters?.weekStartDate === undefined,
    "explicit Week 1 remains ordinal-based and is not remapped to a calendar week",
  );

  const undatedReadLog: Intent[] = [];
  const undated = await resolveActionCommand(parseActionCommand("Add chilli to Thursday dinner.")!, ctx({
    temporalAnchor: "2026-11-14",
    activePlannerWeekId: 55,
  }), {
    read: async (intent) => {
      undatedReadLog.push(intent);
      if (intent.capabilityId === "meals") {
        return { status: "ok", capabilityId: "meals", verb: "search", message: "ok", result: { meals: [{ id: 78, name: "Chilli" }] } };
      }
      return { status: "gap", capabilityId: "planner", verb: "read", message: "no dated week" };
    },
    checkPlannerMeal: async () => ({ kind: "safe" }),
    canExecute: (c, v) => platform.canExecute(c, v),
    getCapability: (c) => platform.getCapability(c),
  });
  const undatedPlannerRead = undatedReadLog.find((intent) => intent.capabilityId === "planner");
  assert(
    undated.kind === "clarification" && undatedPlannerRead?.parameters?.weekStartDate === "2026-11-16" &&
      undatedPlannerRead?.parameters?.weekId === undefined,
    "when the next occurrence has no dated week, asks rather than falling back to an active undated week",
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
  assert(
    noSlot?.kind === "clarification" &&
      JSON.stringify(noSlot.suggestedReplies) === JSON.stringify(["Breakfast", "Lunch", "Dinner"]),
    "…and as tappable quick-reply chips, not free text only",
  );

  const unknownMeal = await resolve("Add lasagne to Tuesday lunch.");
  assert(
    unknownMeal?.kind === "clarification" && /don't have a saved recipe/i.test(unknownMeal.question) &&
      /quick meal/i.test(unknownMeal.question),
    "an unknown meal name → clarification offering a quick meal, never an invented mealId",
  );
  assert(
    unknownMeal?.kind === "clarification" && JSON.stringify(unknownMeal.suggestedReplies) === JSON.stringify(["Yes", "No"]),
    "…offered as tappable Yes/No chips",
  );

  // COMP3 — confirming the quick-meal offer is a WRITE proposal (meals.add),
  // never a silent creation and never confused with the dietary-fix "yes".
  const quickMealConfirmed = await resolve(
    "Add lasagne to Tuesday lunch.",
    ctx({ dietaryCorrection: "yes please" }),
  );
  assert(
    quickMealConfirmed?.kind === "proposal" && quickMealConfirmed.draft.capabilityId === "meals" &&
      quickMealConfirmed.draft.verb === "add",
    "confirming the quick-meal offer → a meals.add proposal, not a silent creation",
  );
  assert(
    quickMealConfirmed?.kind === "proposal" &&
      (quickMealConfirmed.draft.parameters as { name?: string }).name === "lasagne" &&
      quickMealConfirmed.draft.confirmationTier === "light",
    "the proposal carries the exact spoken name and the same light tier as a planner add",
  );
  // The household never asked for a quick meal in isolation — the ORIGINAL
  // command named a day and slot too. A bare "yes" to the quick-meal offer
  // must carry that day/slot through so the single confirmed write creates
  // AND places the meal, rather than leaving it orphaned in Cookbook/Meals.
  assert(
    quickMealConfirmed?.kind === "proposal" &&
      typeof (quickMealConfirmed.draft.parameters as { dayId?: unknown }).dayId === "number" &&
      (quickMealConfirmed.draft.parameters as { mealSlot?: string }).mealSlot === "lunch",
    "the quick-meal proposal also carries the resolved dayId + mealSlot from the original command",
  );
  assert(
    quickMealConfirmed?.kind === "proposal" && /tuesday lunch/i.test(quickMealConfirmed.draft.label),
    "the confirmation label itself names the day/slot it will land in, not just \"as a quick meal\"",
  );

  // A reply that ISN'T affirmative must never be read as confirming the offer.
  const quickMealDeclined = await resolve(
    "Add lasagne to Tuesday lunch.",
    ctx({ dietaryCorrection: "what do you mean by quick meal?" }),
  );
  assert(
    quickMealDeclined?.kind === "clarification" && /quick meal/i.test(quickMealDeclined.question),
    "a non-affirmative reply still just re-offers the quick meal, never creates one",
  );

  // An AMBIGUOUS match (not a miss) must never offer to create a new meal —
  // the issue there is an unclear name among EXISTING meals, not a missing one.
  const ambiguousNeverOffersQuickMeal = await resolve(
    "Add chicken to Tuesday lunch.",
    ctx({ dietaryCorrection: "yes please" }),
  );
  assert(
    ambiguousNeverOffersQuickMeal?.kind === "clarification" && !/quick meal/i.test(ambiguousNeverOffersQuickMeal.question),
    "an ambiguous match is never offered as a quick-meal candidate, even on a bare \"yes\"",
  );

  const ambiguousMeal = await resolve("Add chicken to Tuesday lunch.");
  assert(
    ambiguousMeal?.kind === "clarification" && /more than one meal/i.test(ambiguousMeal.question),
    "two matching meals → asked which, never a silent pick",
  );
  assert(
    ambiguousMeal?.kind === "clarification" &&
      JSON.stringify([...ambiguousMeal.suggestedReplies ?? []].sort()) === JSON.stringify(["Chicken Curry", "Chicken Soup"].sort()),
    "…offered as tappable chips naming the actual candidates, not a generic Yes/No",
  );

  // A household's own saved meal and a system-library meal sharing the exact
  // same name is a naming collision, not a real choice — "did you mean X or X"
  // is unanswerable. The household's own copy must win silently.
  const ownBeatsSystemNamesake = await resolve("Add spaghetti bolognese to Tuesday lunch.");
  assert(
    ownBeatsSystemNamesake?.kind === "proposal",
    "own meal + same-named system meal → resolved silently to the household's own, never a duplicate-name question",
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
  section("§5 Calendar language: dated planner weekdays resolve; unavailable dates clarify");

  const plannerToday = await resolve("Add chilli to today's dinner.");
  assert(
    plannerToday?.kind === "clarification" && /six numbered weeks|which week/i.test(plannerToday.question),
    "\"today\" for the PLANNER without a weekday → clarification (no dated day was specified)",
  );

  readLog.length = 0;
  const plannerNextWeek = await resolve("Add chilli to next week Monday dinner.");
  assert(
    plannerNextWeek?.kind === "proposal" && readLog.some((intent) => intent.capabilityId === "planner" &&
      intent.parameters?.weekStartDate === "2026-07-20"),
    "\"next week\" with Monday uses the next dated planner week",
  );

  const reportedCommand = parseActionCommand("Can you add a spaghetti bolognaise as Thursdays dinner next week")!;
  const restricted = await resolveActionCommand(reportedCommand, ctx(), {
    read: stubRead,
    checkPlannerMeal: async () => ({
      kind: "restricted", mealName: "Spaghetti Bolognese", restrictionNames: ["Gluten"], restrictionIds: ["gluten"],
      ingredient: "200g spaghetti", matchedTerm: "pasta",
      alternatives: ["gluten-free pasta (rice or corn-based)", "rice noodles", "courgette noodles"],
      communityAlternatives: [], householdId: null,
    }),
  });
  assert(restricted.kind === "clarification" && /Gluten restriction/.test(restricted.question) &&
    /gluten-free pasta/.test(restricted.question) && /rice noodles/.test(restricted.question) &&
    /courgette noodles/.test(restricted.question), "unsafe saved meal flags restriction and offers three grounded choices, no proposal");
  assert(
    restricted.kind === "clarification" &&
      JSON.stringify(restricted.suggestedReplies) === JSON.stringify(["gluten-free pasta", "rice noodles", "courgette noodles"]),
    "…offered as tappable chips naming the actual curated options, not a generic Yes/No",
  );

  // Exactly ONE curated option: offered as a Yes/No tap, not a pick-one list.
  const singleOption = await resolveActionCommand(reportedCommand, ctx(), {
    read: stubRead,
    checkPlannerMeal: async () => ({
      kind: "restricted", mealName: "Spaghetti Bolognese", restrictionNames: ["Gluten"], restrictionIds: ["gluten"],
      ingredient: "1tbsp worcestershire sauce", matchedTerm: "worcestershire sauce",
      alternatives: ["gluten-free Worcestershire sauce"], communityAlternatives: [], householdId: null,
    }),
  });
  assert(
    singleOption.kind === "clarification" && JSON.stringify(singleOption.suggestedReplies) === JSON.stringify(["Yes", "No"]),
    "exactly one curated option is offered as a tappable Yes/No, not a pick-one list of one",
  );
  const corrected = await resolveActionCommand(reportedCommand, ctx({ dietaryCorrection: "I can buy gluten free pasta" }), {
    read: stubRead,
    checkPlannerMeal: async () => ({
      kind: "restricted", mealName: "Spaghetti Bolognese", restrictionNames: ["Gluten"], restrictionIds: ["gluten"],
      ingredient: "200g spaghetti", matchedTerm: "pasta",
      alternatives: ["gluten-free pasta (rice or corn-based)", "rice noodles", "courgette noodles"],
      communityAlternatives: [], householdId: null,
    }),
  });
  assert(corrected.kind === "clarification" && /You're right/.test(corrected.question) &&
    /rice noodles/.test(corrected.question) && /saved recipe still conflicts/.test(corrected.question),
  "follow-up acknowledges gluten-free pasta and other choices without claiming the recipe changed");

  // COMP3 — nothing curated exists, but another household has already said
  // something for this exact ingredient: offered, clearly unverified.
  const communitySuggested = await resolveActionCommand(reportedCommand, ctx(), {
    read: stubRead,
    checkPlannerMeal: async () => ({
      kind: "restricted", mealName: "Spaghetti Bolognese", restrictionNames: ["Gluten"], restrictionIds: ["gluten"],
      ingredient: "1tbsp worcestershire sauce", matchedTerm: "worcestershire sauce", alternatives: [],
      communityAlternatives: ["gluten-free worcestershire sauce"], householdId: null,
    }),
  });
  assert(communitySuggested.kind === "clarification" &&
    /other households have mentioned/i.test(communitySuggested.question) &&
    /gluten-free worcestershire sauce/i.test(communitySuggested.question) &&
    /haven't confirmed/i.test(communitySuggested.question),
  "no curated replacement, but a community one exists → offered, explicitly unverified, never claimed as fact");

  // COMP3 — the household teaches the Companion something new: acknowledged
  // (never claimed as verified), never silently treated as "no correction".
  const taughtSomethingNew = await resolveActionCommand(
    reportedCommand,
    ctx({ dietaryCorrection: "I can just buy gluten free Worcestershire sauce" }),
    {
      read: stubRead,
      checkPlannerMeal: async () => ({
        kind: "restricted", mealName: "Spaghetti Bolognese", restrictionNames: ["Gluten"], restrictionIds: ["gluten"],
        ingredient: "1tbsp worcestershire sauce", matchedTerm: "worcestershire sauce",
        alternatives: [], communityAlternatives: [], householdId: null,
      }),
    },
  );
  assert(taughtSomethingNew.kind === "clarification" &&
    /I've noted gluten-free worcestershire sauce/i.test(taughtSomethingNew.question) &&
    /haven't verified it myself/i.test(taughtSomethingNew.question),
  "a self-declared fix with no curated/community match yet is acknowledged, not silently dropped");

  // A correction that is just a QUESTION, not a stated fix, must never be
  // read as the household teaching the Companion a new fact.
  const askingNotStating = await resolveActionCommand(
    reportedCommand,
    ctx({ dietaryCorrection: "what are some alternatives?" }),
    {
      read: stubRead,
      checkPlannerMeal: async () => ({
        kind: "restricted", mealName: "Spaghetti Bolognese", restrictionNames: ["Gluten"], restrictionIds: ["gluten"],
        ingredient: "1tbsp worcestershire sauce", matchedTerm: "worcestershire sauce",
        alternatives: [], communityAlternatives: [], householdId: null,
      }),
    },
  );
  assert(askingNotStating.kind === "clarification" && !/I've noted/i.test(askingNotStating.question),
  "a bare question about alternatives is never mistaken for a stated fix");

  // COMP3 — the household names the fix outright: a WRITE proposal, never a
  // "go save it yourself" clarification, and never applied without the
  // household confirming the proposal itself.
  const namedFixProposed = await resolveActionCommand(
    reportedCommand,
    ctx({ dietaryCorrection: "I can just buy gluten free Worcestershire sauce" }),
    {
      read: stubRead,
      checkPlannerMeal: async () => ({
        kind: "restricted", mealName: "Spaghetti Bolognese", restrictionNames: ["Gluten"], restrictionIds: ["gluten"],
        ingredient: "1tbsp worcestershire sauce", matchedTerm: "worcestershire sauce",
        alternatives: [], communityAlternatives: [], householdId: 221,
      }),
    },
  );
  assert(namedFixProposed.kind === "proposal" && namedFixProposed.draft.capabilityId === "meals" &&
    namedFixProposed.draft.verb === "replace",
  "naming the fix outright → a meals.replace proposal, not a clarification");
  assert(
    (params(namedFixProposed) as { mealId?: number; ingredient?: string; matchedTerm?: string; replacement?: string }).ingredient === "1tbsp worcestershire sauce" &&
    (params(namedFixProposed) as { matchedTerm?: string }).matchedTerm === "worcestershire sauce" &&
    (params(namedFixProposed) as { replacement?: string }).replacement === "gluten-free Worcestershire sauce",
    "the proposal carries the exact ingredient line, the exact matched term, and the exact replacement named",
  );
  assert(namedFixProposed.kind === "proposal" && namedFixProposed.draft.confirmationTier === "required",
  "editing a saved recipe requires explicit confirmation, same as any other non-trivial write");

  // COMP3 — a bare "yes" resolves cleanly when there is exactly ONE candidate
  // on the table (curated here), with no need to re-name it.
  const yesToOnlyOption = await resolveActionCommand(
    reportedCommand,
    ctx({ dietaryCorrection: "yes please" }),
    {
      read: stubRead,
      checkPlannerMeal: async () => ({
        kind: "restricted", mealName: "Spaghetti Bolognese", restrictionNames: ["Gluten"], restrictionIds: ["gluten"],
        ingredient: "1tbsp worcestershire sauce", matchedTerm: "worcestershire sauce",
        alternatives: ["gluten-free Worcestershire sauce"],
        communityAlternatives: [], householdId: 221,
      }),
    },
  );
  assert(yesToOnlyOption.kind === "proposal" && yesToOnlyOption.draft.verb === "replace" &&
    (params(yesToOnlyOption) as { replacement?: string }).replacement === "gluten-free Worcestershire sauce",
  "a bare \"yes\" to the single curated option → the same write proposal, nothing named again");

  // COMP3 — a bare "yes" with MULTIPLE candidates is still ambiguous: asked,
  // never guessed which of several the household meant.
  const yesToSeveralOptions = await resolveActionCommand(
    reportedCommand,
    ctx({ dietaryCorrection: "yes" }),
    {
      read: stubRead,
      checkPlannerMeal: async () => ({
        kind: "restricted", mealName: "Spaghetti Bolognese", restrictionNames: ["Gluten"], restrictionIds: ["gluten"],
        ingredient: "200g spaghetti", matchedTerm: "pasta",
        alternatives: ["gluten-free pasta (rice or corn-based)", "rice noodles", "courgette noodles"],
        communityAlternatives: [], householdId: 221,
      }),
    },
  );
  assert(yesToSeveralOptions.kind === "clarification" && /which would you prefer/i.test(yesToSeveralOptions.question),
  "a bare \"yes\" with several candidates on the table still asks which, never guesses");

  const diaryToday = await resolve("Log porridge for breakfast today.");
  assert(
    diaryToday?.kind === "proposal" &&
      (params(diaryToday) as { date?: string }).date === "2026-07-18",
    "…while the DIARY, which is calendar-shaped, honours \"today\" directly",
  );

  const invalidAnchor = await resolve(
    "Add tuna spaghetti to Tuesday lunch.",
    ctx({ activePlannerWeekId: undefined, temporalAnchor: "not-a-date" }),
  );
  assert(
    invalidAnchor?.kind === "clarification" && /which planner week/i.test(invalidAnchor.question),
    "without a usable household calendar anchor, asks which week rather than guessing",
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
      checkPlannerMeal: async () => ({ kind: "safe" }),
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
