/**
 * Action Resolution — symbolic command → executable proposal (INT20)
 * ===================================================================
 * The I/O half of INT20. Takes the symbolic {@link ActionCommand} that
 * `action-language.ts` parsed out of the household's words and resolves it into
 * a {@link CompanionActionProposalDraft} carrying EXACTLY the parameters the
 * COMP_ACT1 write handlers destructure — or into ONE clarification question when
 * something needed was not said.
 *
 * WHAT THIS FILE IS
 * -----------------
 * A parameter resolver. Nothing else. It answers three kinds of question:
 *
 *   "Week 1 Tuesday lunch"  → which `dayId`?      → planner READ
 *   "tuna spaghetti"        → which `mealId`?     → meals  READ
 *   "milk"                  → which extra `id`?   → shopping READ
 *
 * Every one of those answers comes from an EXISTING capability read, invoked
 * through the ordinary Intelligence Platform seam. This file opens no database
 * connection, calls no storage method, and adds no route.
 *
 * WHAT THIS FILE IS NOT
 * ---------------------
 *   • NOT an executor. It never calls `handle()` with `{ confirmed: true }`. It
 *     produces a PROPOSAL; the household confirms it through the existing
 *     endpoint (`POST /api/intelligence/conversation/actions/:id/confirm`),
 *     which is still the only place in THA that executes a Companion action.
 *   • NOT a second owner of any business rule. It re-states two of the handlers'
 *     own allow-lists (pantry categories, meal slots) for GATING only, exactly as
 *     `companion-actions.ts` already does and for the same stated reason: the
 *     handler remains the enforcing authority and re-validates everything.
 *   • NOT a guesser. Where a fact is missing it asks; where a name is ambiguous
 *     it asks; where the planner owns no calendar mapping it asks. It never
 *     substitutes a week, a day, a slot or an item.
 *
 * THE CALENDAR BOUNDARY (the one design decision worth reading)
 * ------------------------------------------------------------
 * The diary is calendar-shaped — it stores `YYYY-MM-DD` — so "today", "tonight"
 * and "tomorrow" resolve against the household's own `temporalAnchor` and are
 * honoured directly.
 *
 * The planner is NOT. It is a fixed six-slot rota whose `weekStartDate` is
 * written only at creation and never back-filled (HT7), so for the great majority
 * of households THA genuinely does not know which calendar week "Week 3" means.
 * Its own read handler says so in as many words: *"the Planner is organised by
 * week-number and day-of-week and owns no calendar mapping, so 'today' cannot be
 * resolved to a planner slot"* (planner-read-handler.ts). Picking a week anyway is
 * the defect `household-planner-week.ts` exists to retire — *"Do not pick a week
 * to fix it."*
 *
 * So: calendar language aimed at the PLANNER earns a clarification, not an
 * invention. A week the household NAMED ("Week 1") is used as given; a week the
 * SURFACE published (`activePlannerWeekId` — the week on screen) is used as the
 * pointer it is, exactly as COMP_ACT2 uses `selectedPlannerDayId`.
 */

import type { IntentVerb, IntelligenceContext, Intent, IntentOutcome } from "../types.js";
import type { Capability, ConfirmationTier } from "../types.js";
import { confirmationFor } from "../permissions.js";
import { intelligencePlatform } from "../intelligence-platform.js";
import type { CompanionActionProposalDraft } from "./companion-actions.js";
import {
  isEmptySlotRef,
  type ActionCommand,
  type MealSlot,
  type SlotRef,
} from "./action-language.js";
import { DAY_NAMES } from "@shared/time/household-time";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * The outcome of resolving one command.
 *
 * `unresolved` deliberately exists alongside `clarification`: it means "this is a
 * write we cannot express", and the gateway answers it with the SAME honest
 * read-only refusal it has always given. Nothing regresses for a command INT20
 * does not understand.
 */
export type ActionResolution =
  | { readonly kind: "proposal"; readonly draft: CompanionActionProposalDraft }
  | { readonly kind: "clarification"; readonly question: string }
  | { readonly kind: "unresolved" };

/** Everything the resolver may know about the household, all of it already assembled. */
export interface ActionResolutionContext {
  /** The caller's platform identity — passed straight through to every read. */
  readonly identity: IntelligenceContext;
  /** The household's civil today, `YYYY-MM-DD` (ContextFrame.temporalAnchor). */
  readonly temporalAnchor: string;
  /** The planner week currently in scope, if the surface published one. */
  readonly activePlannerWeekId?: number;
  /** On-screen pointers COMP_ACT2 already carries; used only when the words didn't say. */
  readonly selectedPlannerDayId?: number;
  readonly selectedPlannerEntryId?: number;
  readonly selectedMealSlot?: string;
  readonly selectedPantryCategory?: string;
}

/** The platform seam. Production reads through `intelligencePlatform.handle`. */
export type ReadIntentFn = (
  intent: Intent,
  context: IntelligenceContext,
) => Promise<IntentOutcome>;

export type CanExecuteFn = (capabilityId: string, verb: IntentVerb) => boolean;
export type GetCapabilityFn = (capabilityId: string) => Capability | undefined;

const defaultRead: ReadIntentFn = (intent, context) =>
  intelligencePlatform.handle(intent, context);

const defaultCanExecute: CanExecuteFn = (capabilityId, verb) =>
  intelligencePlatform.canExecute(capabilityId, verb);

const defaultGetCapability: GetCapabilityFn = (capabilityId) =>
  intelligencePlatform.getCapability(capabilityId);

// ---------------------------------------------------------------------------
// Owner allow-lists, mirrored for GATING only (the handlers re-validate)
// ---------------------------------------------------------------------------

/** `pantry-write-handler.ts`'s own six categories. */
const PANTRY_CATEGORIES: ReadonlySet<string> = new Set([
  "larder", "fridge", "freezer", "household", "fruit", "pet",
]);

/**
 * The two owners spell the snack slot differently — planner `snacks`, diary
 * `snack`. Mapped here, once, at the only place that builds parameters for both.
 */
function plannerSlot(slot: MealSlot): string {
  return slot === "snack" ? "snacks" : slot;
}

function diarySlot(slot: MealSlot): string {
  return slot; // breakfast | lunch | dinner | snack — already the diary's spelling
}

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

/**
 * Run one capability read and return its result, or null for ANY non-ok outcome.
 *
 * Honest gaps and denials both collapse to null on purpose: from the resolver's
 * point of view "the planner would not tell me" and "there is no such day" lead
 * to the same place — a question for the household, never an assumption.
 */
async function readResult(
  read: ReadIntentFn,
  identity: IntelligenceContext,
  capabilityId: string,
  verb: IntentVerb,
  parameters: Record<string, unknown>,
): Promise<unknown | null> {
  try {
    const outcome = await read({ capabilityId, verb, parameters }, identity);
    return outcome.status === "ok" && outcome.result != null ? outcome.result : null;
  } catch {
    // A genuine fault in a read must not fail the turn: the household still gets
    // an answer, it is just a question rather than a proposal.
    return null;
  }
}

/** Case/punctuation-insensitive comparison key for matching a spoken name to a stored one. */
function nameKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Choose the one record whose name the household meant.
 *
 * Exact match wins outright. Otherwise substring candidates are collected: one
 * candidate is the answer, several is an ambiguity the household must settle.
 * Zero is a miss. Nothing here ranks, scores or "best-guesses" — a wrong pick
 * writes to the household's real data.
 */
function matchByName<T>(
  records: readonly T[],
  spoken: string,
  nameOf: (record: T) => string | null,
): { readonly hit: T } | { readonly ambiguous: readonly T[] } | { readonly miss: true } {
  const key = nameKey(spoken);
  if (!key) return { miss: true };

  const named = records.filter((r) => {
    const n = nameOf(r);
    return typeof n === "string" && n.trim().length > 0;
  });

  const exact = named.filter((r) => nameKey(nameOf(r) as string) === key);
  if (exact.length === 1) return { hit: exact[0] };
  if (exact.length > 1) return { ambiguous: exact };

  const partial = named.filter((r) => {
    const n = nameKey(nameOf(r) as string);
    return n.includes(key) || key.includes(n);
  });
  if (partial.length === 1) return { hit: partial[0] };
  if (partial.length > 1) return { ambiguous: partial };
  return { miss: true };
}

/** Render a short "did you mean" list without ever exceeding a readable length. */
function listNames(names: readonly string[]): string {
  const shown = names.slice(0, 4);
  if (shown.length === 1) return shown[0];
  return `${shown.slice(0, -1).join(", ")} or ${shown[shown.length - 1]}`;
}

// ---------------------------------------------------------------------------
// Planner day resolution
// ---------------------------------------------------------------------------

/** The read projection `planner-read-handler.ts` returns for a day. */
interface PlannerDayResult {
  readonly dayId: number;
  readonly dayOfWeek: number;
  readonly meals: ReadonlyArray<{
    readonly entryId: number;
    readonly mealType: string;
    readonly mealId: number;
    readonly mealName: string | null;
  }>;
}

type DayResolution =
  | { readonly kind: "day"; readonly day: PlannerDayResult }
  | { readonly kind: "clarification"; readonly question: string };

/**
 * Locate one planner day from what the household said.
 *
 * The week comes from: an explicitly named week number, else the week the
 * surface has in scope. Calendar language ("next week", "tomorrow") is refused
 * with a question — see the calendar boundary note at the top of this file.
 */
async function resolvePlannerDay(
  ref: SlotRef,
  ctx: ActionResolutionContext,
  read: ReadIntentFn,
): Promise<DayResolution> {
  // Calendar language the planner cannot honour.
  if (ref.dayOfWeek === undefined && (ref.dayOffset !== undefined || ref.weekRelation !== undefined)) {
    return {
      kind: "clarification",
      question:
        "Your planner is organised as six numbered weeks rather than calendar dates, so I " +
        "can't tell which slot that means. Which week and day should I use — for example " +
        "\"Week 1 Tuesday\"?",
    };
  }

  if (ref.dayOfWeek === undefined) {
    return {
      kind: "clarification",
      question: "Which day did you mean?",
    };
  }

  // "next week" alongside a named weekday is still calendar language about which
  // of the six slots is meant, and it is equally unanswerable.
  if (ref.weekRelation !== undefined && ref.weekNumber === undefined) {
    return {
      kind: "clarification",
      question:
        "Your planner uses six numbered weeks rather than calendar weeks, so I can't tell " +
        `which one "${ref.weekRelation} week" is. Which week number should I use?`,
    };
  }

  const params: Record<string, unknown> = { scope: "day", dayOfWeek: ref.dayOfWeek };
  if (ref.weekNumber !== undefined) {
    params.weekNumber = ref.weekNumber;
  } else if (ctx.activePlannerWeekId !== undefined) {
    params.weekId = ctx.activePlannerWeekId;
  } else {
    return {
      kind: "clarification",
      question: `Which planner week should I use for ${DAY_NAMES[ref.dayOfWeek]}?`,
    };
  }

  const result = (await readResult(read, ctx.identity, "planner", "read", params)) as
    | PlannerDayResult
    | null;

  if (!result || typeof result.dayId !== "number") {
    return {
      kind: "clarification",
      question:
        `I couldn't find ${DAY_NAMES[ref.dayOfWeek]} in that planner week. Which week and ` +
        "day should I use?",
    };
  }
  return { kind: "day", day: result };
}

/**
 * Find the entry the household pointed at — "Friday dinner" — inside a resolved day.
 * A day with several entries in the same slot is an ambiguity, not a coin toss.
 */
function entryInSlot(
  day: PlannerDayResult,
  slot: MealSlot,
): { readonly entryId: number; readonly mealName: string | null } | { readonly ambiguous: true } | null {
  const wanted = plannerSlot(slot);
  const matches = (day.meals ?? []).filter((m) => m.mealType === wanted);
  if (matches.length === 0) return null;
  if (matches.length > 1) return { ambiguous: true };
  return { entryId: matches[0].entryId, mealName: matches[0].mealName };
}

// ---------------------------------------------------------------------------
// Meal / item resolution
// ---------------------------------------------------------------------------

interface MealSearchResult {
  readonly meals: ReadonlyArray<{ readonly id: number; readonly name: string }>;
}

/**
 * Resolve a spoken meal name to a real `mealId` via the existing `meals` search.
 *
 * Every id that search returns is, by construction, either a system meal or the
 * caller's own (the handler merges exactly those two sets), which is the precise
 * predicate the planner write handler enforces before it writes.
 */
async function resolveMealId(
  spoken: string,
  ctx: ActionResolutionContext,
  read: ReadIntentFn,
): Promise<{ readonly mealId: number; readonly name: string } | { readonly question: string }> {
  const result = (await readResult(read, ctx.identity, "meals", "search", {
    query: spoken,
  })) as MealSearchResult | null;

  const meals = result?.meals ?? [];
  const match = matchByName(meals, spoken, (m) => m.name);

  if ("hit" in match) return { mealId: match.hit.id, name: match.hit.name };
  if ("ambiguous" in match) {
    return {
      question: `I found more than one meal like "${spoken}" — did you mean ${listNames(
        match.ambiguous.map((m) => m.name),
      )}?`,
    };
  }
  return {
    question: `I couldn't find a meal called "${spoken}" in your meals. What's it called exactly?`,
  };
}

// ---------------------------------------------------------------------------
// Draft construction
// ---------------------------------------------------------------------------

/**
 * Build a proposal, but only for a verb the platform will actually execute.
 * `canExecute` is the same registry gate `companion-actions.ts` applies — a
 * proposal for an unbound verb would be a button that cannot work.
 */
function draftFor(
  capabilityId: string,
  verb: IntentVerb,
  label: string,
  parameters: Record<string, unknown>,
  canExecute: CanExecuteFn,
  getCapability: GetCapabilityFn,
): ActionResolution {
  if (!canExecute(capabilityId, verb)) return { kind: "unresolved" };
  const capability = getCapability(capabilityId);
  if (!capability) return { kind: "unresolved" };
  const tier: ConfirmationTier = confirmationFor(capability, verb);
  return {
    kind: "proposal",
    draft: { capabilityId, verb, label, parameters, confirmationTier: tier },
  };
}

// ---------------------------------------------------------------------------
// Per-capability resolution
// ---------------------------------------------------------------------------

async function resolvePlannerAdd(
  command: ActionCommand,
  ctx: ActionResolutionContext,
  deps: Deps,
): Promise<ActionResolution> {
  const target = command.target ?? {};

  if (!command.subject) {
    return { kind: "clarification", question: "Which meal would you like me to add?" };
  }

  const slot = target.mealSlot ?? (ctx.selectedMealSlot as MealSlot | undefined);
  if (!slot) {
    return {
      kind: "clarification",
      question: `Which meal slot should "${command.subject}" go in — breakfast, lunch or dinner?`,
    };
  }

  const day = await resolvePlannerDay(target, ctx, deps.read);
  if (day.kind === "clarification") return day;

  const meal = await resolveMealId(command.subject, ctx, deps.read);
  if ("question" in meal) return { kind: "clarification", question: meal.question };

  return draftFor(
    "planner",
    "add",
    `Add ${meal.name} to ${DAY_NAMES[day.day.dayOfWeek]} ${slot}`,
    { dayId: day.day.dayId, mealId: meal.mealId, mealSlot: plannerSlot(slot) },
    deps.canExecute,
    deps.getCapability,
  );
}

async function resolvePlannerMove(
  command: ActionCommand,
  ctx: ActionResolutionContext,
  deps: Deps,
): Promise<ActionResolution> {
  const source = command.source ?? {};
  const target = command.target ?? {};

  if (!source.mealSlot) {
    return {
      kind: "clarification",
      question: "Which meal should I move — breakfast, lunch or dinner?",
    };
  }

  const sourceDay = await resolvePlannerDay(source, ctx, deps.read);
  if (sourceDay.kind === "clarification") return sourceDay;

  const entry = entryInSlot(sourceDay.day, source.mealSlot);
  if (entry === null) {
    return {
      kind: "clarification",
      question:
        `There's nothing planned for ${DAY_NAMES[sourceDay.day.dayOfWeek]} ${source.mealSlot}. ` +
        "Which meal did you want to move?",
    };
  }
  if ("ambiguous" in entry) {
    return {
      kind: "clarification",
      question:
        `There's more than one meal in ${DAY_NAMES[sourceDay.day.dayOfWeek]} ${source.mealSlot}. ` +
        "Which one should I move?",
    };
  }

  const targetSlot = target.mealSlot ?? source.mealSlot;
  const targetDay = await resolvePlannerDay(target, ctx, deps.read);
  if (targetDay.kind === "clarification") return targetDay;

  // Moving something to where it already is is not an action worth confirming.
  if (targetDay.day.dayId === sourceDay.day.dayId && targetSlot === source.mealSlot) {
    return { kind: "unresolved" };
  }

  const what = entry.mealName ?? `${DAY_NAMES[sourceDay.day.dayOfWeek]} ${source.mealSlot}`;
  return draftFor(
    "planner",
    "move",
    `Move ${what} to ${DAY_NAMES[targetDay.day.dayOfWeek]} ${targetSlot}`,
    {
      entryId: entry.entryId,
      dayId: targetDay.day.dayId,
      mealSlot: plannerSlot(targetSlot),
    },
    deps.canExecute,
    deps.getCapability,
  );
}

async function resolvePlannerReplace(
  command: ActionCommand,
  ctx: ActionResolutionContext,
  deps: Deps,
): Promise<ActionResolution> {
  const source = command.source ?? {};

  if (!command.subject) {
    return { kind: "clarification", question: "What should I replace it with?" };
  }
  if (!source.mealSlot) {
    return {
      kind: "clarification",
      question: "Which meal should I replace — breakfast, lunch or dinner?",
    };
  }

  const sourceDay = await resolvePlannerDay(source, ctx, deps.read);
  if (sourceDay.kind === "clarification") return sourceDay;

  const entry = entryInSlot(sourceDay.day, source.mealSlot);
  if (entry === null) {
    return {
      kind: "clarification",
      question:
        `There's nothing planned for ${DAY_NAMES[sourceDay.day.dayOfWeek]} ${source.mealSlot} ` +
        "to replace. Would you like me to add it instead?",
    };
  }
  if ("ambiguous" in entry) {
    return {
      kind: "clarification",
      question:
        `There's more than one meal in ${DAY_NAMES[sourceDay.day.dayOfWeek]} ${source.mealSlot}. ` +
        "Which one should I replace?",
    };
  }

  const meal = await resolveMealId(command.subject, ctx, deps.read);
  if ("question" in meal) return { kind: "clarification", question: meal.question };

  return draftFor(
    "planner",
    "replace",
    `Replace ${DAY_NAMES[sourceDay.day.dayOfWeek]} ${source.mealSlot} with ${meal.name}`,
    { entryId: entry.entryId, mealId: meal.mealId },
    deps.canExecute,
    deps.getCapability,
  );
}

interface ShoppingListResult {
  readonly extras?: ReadonlyArray<{ readonly id: number; readonly name: string }>;
}

async function resolveShoppingAdd(
  command: ActionCommand,
  ctx: ActionResolutionContext,
  deps: Deps,
): Promise<ActionResolution> {
  if (!command.subject) {
    return { kind: "clarification", question: "What should I add to your shopping list?" };
  }
  return draftFor(
    "shopping",
    "add",
    `Add ${command.subject} to your shopping list`,
    { name: command.subject },
    deps.canExecute,
    deps.getCapability,
  );
}

async function resolveShoppingDelete(
  command: ActionCommand,
  ctx: ActionResolutionContext,
  deps: Deps,
): Promise<ActionResolution> {
  if (!command.subject) {
    return { kind: "clarification", question: "What should I remove from your shopping list?" };
  }

  // `shopping.delete` removes a shopping-list EXTRA. The same read also returns
  // `items` (generated from the plan, a different table) — matching a name there
  // and passing its id would silently delete nothing, so only extras are searched.
  const result = (await readResult(deps.read, ctx.identity, "shopping", "read", {
    scope: "list",
  })) as ShoppingListResult | null;

  const extras = result?.extras ?? [];
  const match = matchByName(extras, command.subject, (e) => e.name);

  if ("ambiguous" in match) {
    return {
      kind: "clarification",
      question: `Your list has more than one match for "${command.subject}" — did you mean ${listNames(
        match.ambiguous.map((e) => e.name),
      )}?`,
    };
  }
  if ("miss" in match) {
    return {
      kind: "clarification",
      question: `I couldn't find "${command.subject}" on your shopping list. What's it listed as?`,
    };
  }

  return draftFor(
    "shopping",
    "delete",
    `Remove ${match.hit.name} from your shopping list`,
    { id: match.hit.id },
    deps.canExecute,
    deps.getCapability,
  );
}

interface PantryListResult {
  readonly items?: ReadonlyArray<{
    readonly id: number;
    readonly ingredientKey: string;
    readonly displayName: string | null;
  }>;
}

async function resolvePantryAdd(
  command: ActionCommand,
  ctx: ActionResolutionContext,
  deps: Deps,
): Promise<ActionResolution> {
  if (!command.subject) {
    return { kind: "clarification", question: "What should I add to your pantry?" };
  }

  // The handler REQUIRES a category from its six, and the words almost never
  // carry one. The surface may (the pantry page publishes the open section);
  // otherwise this is exactly the missing fact worth one question.
  const category = ctx.selectedPantryCategory;
  if (!category || !PANTRY_CATEGORIES.has(category)) {
    return {
      kind: "clarification",
      question:
        `Where should "${command.subject}" go — larder, fridge, freezer, fruit, household or pet?`,
    };
  }

  return draftFor(
    "pantry",
    "add",
    `Add ${command.subject} to your ${category}`,
    { ingredient: command.subject, category },
    deps.canExecute,
    deps.getCapability,
  );
}

async function resolvePantryDelete(
  command: ActionCommand,
  ctx: ActionResolutionContext,
  deps: Deps,
): Promise<ActionResolution> {
  if (!command.subject) {
    return { kind: "clarification", question: "What should I remove from your pantry?" };
  }

  const result = (await readResult(deps.read, ctx.identity, "pantry", "read", {
    scope: "list",
  })) as PantryListResult | null;

  const items = result?.items ?? [];
  const match = matchByName(items, command.subject, (i) => i.displayName ?? i.ingredientKey);

  if ("ambiguous" in match) {
    return {
      kind: "clarification",
      question: `Your pantry has more than one match for "${command.subject}" — did you mean ${listNames(
        match.ambiguous.map((i) => i.displayName ?? i.ingredientKey),
      )}?`,
    };
  }
  if ("miss" in match) {
    return {
      kind: "clarification",
      question: `I couldn't find "${command.subject}" in your pantry. What's it listed as?`,
    };
  }

  const shown = match.hit.displayName ?? match.hit.ingredientKey;
  return draftFor(
    "pantry",
    "delete",
    `Remove ${shown} from your pantry`,
    { id: match.hit.id },
    deps.canExecute,
    deps.getCapability,
  );
}

async function resolveDiaryAdd(
  command: ActionCommand,
  ctx: ActionResolutionContext,
  deps: Deps,
): Promise<ActionResolution> {
  const target = command.target ?? {};

  const slot = target.mealSlot;
  if (!slot) {
    return {
      kind: "clarification",
      question: "Which meal should I log — breakfast, lunch, dinner or a snack?",
    };
  }

  // The diary IS calendar-shaped, so a day offset resolves directly against the
  // household's own today. An offset the anchor cannot carry is refused below.
  const date = shiftIsoDate(ctx.temporalAnchor, target.dayOffset ?? 0);
  if (!date) {
    return {
      kind: "clarification",
      question: "Which date should I log that against?",
    };
  }

  // "Log tonight's dinner" names the slot but not the food. THA will not read
  // the plan and assert the household actually ate it — that is an inference
  // about the world, not a fact it holds.
  if (!command.subject) {
    return {
      kind: "clarification",
      question: `What did you have for ${slot}?`,
    };
  }

  return draftFor(
    "diary",
    "add",
    `Log ${command.subject} as ${slot}`,
    { name: command.subject, mealSlot: diarySlot(slot), date },
    deps.canExecute,
    deps.getCapability,
  );
}

/**
 * Shift a `YYYY-MM-DD` civil date by whole days.
 *
 * Uses a UTC-noon proxy for the same reason `shared/time/household-time.ts` does:
 * a civil date carries no zone, and midnight arithmetic lands on the previous day
 * under a negative offset. Returns null for anything that is not a civil date —
 * absence is an answer.
 */
function shiftIsoDate(anchor: string, days: number): string | null {
  if (typeof anchor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(anchor)) return null;
  const [y, m, d] = anchor.split("-").map(Number);
  const proxy = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
  if (Number.isNaN(proxy.getTime())) return null;
  proxy.setUTCDate(proxy.getUTCDate() + days);
  const yy = String(proxy.getUTCFullYear()).padStart(4, "0");
  const mm = String(proxy.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(proxy.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

interface Deps {
  readonly read: ReadIntentFn;
  readonly canExecute: CanExecuteFn;
  readonly getCapability: GetCapabilityFn;
}

/**
 * Resolve one parsed command into a proposal or a single question.
 *
 * Injectable throughout so the whole layer is testable without a database: pass
 * a stub `read` that returns canned capability results and the resolution logic
 * runs identically to production.
 */
export async function resolveActionCommand(
  command: ActionCommand,
  ctx: ActionResolutionContext,
  overrides: Partial<Deps> = {},
): Promise<ActionResolution> {
  const deps: Deps = {
    read: overrides.read ?? defaultRead,
    canExecute: overrides.canExecute ?? defaultCanExecute,
    getCapability: overrides.getCapability ?? defaultGetCapability,
  };

  // A command with no identity cannot be scoped to a household, and an unscoped
  // write proposal is not something to offer.
  if (!ctx.identity?.userId) return { kind: "unresolved" };

  switch (`${command.capability}.${command.verb}`) {
    case "planner.add":      return resolvePlannerAdd(command, ctx, deps);
    case "planner.move":     return resolvePlannerMove(command, ctx, deps);
    case "planner.replace":  return resolvePlannerReplace(command, ctx, deps);
    case "shopping.add":     return resolveShoppingAdd(command, ctx, deps);
    case "shopping.delete":  return resolveShoppingDelete(command, ctx, deps);
    case "pantry.add":       return resolvePantryAdd(command, ctx, deps);
    case "pantry.delete":    return resolvePantryDelete(command, ctx, deps);
    case "diary.add":        return resolveDiaryAdd(command, ctx, deps);
    default:                 return { kind: "unresolved" };
  }
}

/** Re-exported so callers need only this module to work with parsed commands. */
export { isEmptySlotRef };
