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
import { resolveIngredientRestrictions } from "@shared/restrictions/restriction-resolver";
import { listSubstitutionOptions } from "@shared/substitution-rules";
import { hasCurrentHealthContextConsent } from "../../privacy/health-context-consent.js";
import { nutritionFocusLabel } from "@shared/nutrition-focus";

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

export type PlannerMealCheck =
  | { readonly kind: "safe" }
  | { readonly kind: "unavailable" }
  | {
      readonly kind: "restricted";
      readonly mealName: string;
      readonly restrictionNames: readonly string[];
      readonly restrictionIds: readonly string[];
      readonly ingredient: string | null;
      readonly alternatives: readonly string[];
      /**
       * COMP3 — other households' own stated fixes for this exact ingredient,
       * most-corroborated first. NEVER a verified fact: every caller must
       * attribute and disclaim this (see `restrictionChoiceQuestion`), never
       * present it with the confidence `alternatives` carries.
       */
      readonly communityAlternatives: readonly string[];
      readonly householdId: number | null;
      /**
       * COMP3 — the exact library phrase that matched within `ingredient`
       * (e.g. "worcestershire sauce" out of "1tbsp worcestershire sauce").
       * Lets a write swap ONLY the flagged word(s), preserving the quantity
       * and everything else on the line — never replace the whole ingredient
       * string, which would silently drop its measure.
       */
      readonly matchedTerm: string | null;
    };

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
  /** Literal follow-up text from the same conversation, never a stored recipe edit. */
  readonly dietaryCorrection?: string;
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
  return value.toLowerCase().replace(/\bbolognaise\b/g, "bolognese").replace(/[^a-z0-9]+/g, " ").trim();
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
  readonly meals: ReadonlyArray<{ readonly id: number; readonly name: string; readonly isSystemMeal: boolean }>;
}

/**
 * When the household's own saved meal and a system-library meal share the exact
 * same name, search quite correctly returns both — but asking "did you mean X or
 * X?" is unanswerable: the two options render identically. The household's own
 * copy is what they mean by that name (it is the one they can actually see and
 * cook from), so it silently wins over a same-named system entry. This is a
 * naming collision, not a real choice: it never fires when the household has
 * two of its OWN meals with the same name, or when no own meal shares the name —
 * both of those remain genuine ambiguity for the household to settle.
 */
function preferOwnOverSystemNamesakes<T extends { readonly name: string; readonly isSystemMeal: boolean }>(
  meals: readonly T[],
): T[] {
  const ownKeysWithOneOwner = new Map<string, number>();
  for (const m of meals) {
    if (m.isSystemMeal) continue;
    const key = nameKey(m.name);
    ownKeysWithOneOwner.set(key, (ownKeysWithOneOwner.get(key) ?? 0) + 1);
  }
  return meals.filter((m) => !m.isSystemMeal || ownKeysWithOneOwner.get(nameKey(m.name)) !== 1);
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
  const result = (await readResult(read, ctx.identity, "meals", "search", { query: spoken })) as MealSearchResult | null;
  let meals = result?.meals ?? [];
  // A common spelling variant must still identify the SAME stored meal, never
  // create a new meal or let fuzzy ranking choose between several candidates.
  if (meals.length === 0 && /\bbolognaise\b/i.test(spoken)) {
    const variant = spoken.replace(/\bbolognaise\b/gi, "bolognese");
    const alternate = (await readResult(read, ctx.identity, "meals", "search", { query: variant })) as MealSearchResult | null;
    meals = alternate?.meals ?? [];
  }
  const match = matchByName(preferOwnOverSystemNamesakes(meals), spoken, (m) => m.name);

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

/**
 * Check the actual saved meal through the permission-aware Meals read binding and
 * the canonical household safety owner. No shopping choice changes this row.
 */
async function defaultCheckPlannerMeal(
  mealId: number,
  ctx: ActionResolutionContext,
  read: ReadIntentFn,
): Promise<PlannerMealCheck> {
  const {
    resolveHouseholdSafetyContext,
    isSafetyGateActive,
    isMealSafeForHousehold,
    validateAdaptationSafety,
  } = await import("../../lib/household-dietary-safety.js");
  const safety = await resolveHouseholdSafetyContext(Number(ctx.identity.userId));
  if (safety.status === "unavailable") return { kind: "unavailable" };
  if (!isSafetyGateActive(safety)) return { kind: "safe" };

  const detail = (await readResult(read, ctx.identity, "meals", "read", {
    scope: "detail", mealId,
  })) as { meal?: { name?: string; ingredients?: string[] } } | null;
  const meal = detail?.meal;
  if (!meal || typeof meal.name !== "string" || !Array.isArray(meal.ingredients) || meal.ingredients.length === 0) {
    return { kind: "unavailable" };
  }
  const verdict = isMealSafeForHousehold({ name: meal.name, ingredients: meal.ingredients }, safety);
  if (verdict.safe) return { kind: "safe" };

  const names = new Set<string>();
  const ids = new Set<string>();
  const conflictingIngredients: string[] = [];
  // The exact library phrase that matched within the FIRST conflicting
  // ingredient — e.g. "worcestershire sauce" out of "1tbsp worcestershire
  // sauce" — captured once, so a later write can swap only the flagged
  // word(s) and keep the line's quantity intact.
  let matchedTerm: string | null = null;
  for (const ingredient of meal.ingredients) {
    const matches = resolveIngredientRestrictions(ingredient, safety.activeRestrictions);
    if (matches.length === 0) continue;
    if (matchedTerm === null) matchedTerm = matches[0].sourceValue;
    conflictingIngredients.push(ingredient);
    for (const match of matches) {
      names.add(match.restriction.displayName);
      ids.add(match.restriction.id);
    }
  }
  for (const match of resolveIngredientRestrictions(meal.name, safety.activeRestrictions)) {
    names.add(match.restriction.displayName);
    ids.add(match.restriction.id);
  }
  const alternatives = listSubstitutionOptions(conflictingIngredients, safety.hardRestrictions)
    .map(option => option.replacement)
    .filter((replacement, index, all) => all.indexOf(replacement) === index)
    .filter(replacement => validateAdaptationSafety({ ingredients: [replacement] }, safety.hardRestrictions).safe)
    .slice(0, 3);

  const ingredient = conflictingIngredients[0] ?? null;
  const communityAlternatives = await listCommunityAlternatives(ingredient, [...ids], alternatives);

  return {
    kind: "restricted",
    mealName: meal.name,
    restrictionNames: [...names],
    restrictionIds: [...ids],
    ingredient,
    matchedTerm,
    alternatives,
    communityAlternatives,
    householdId: safety.householdId,
  };
}

/**
 * Other households' own stated fixes for this exact ingredient, for the
 * restrictions actually in conflict — excluding anything already offered as
 * a curated, trusted alternative. Best-effort: a lookup failure here must
 * never fail the safety check itself, so it degrades to "none found".
 */
async function listCommunityAlternatives(
  ingredient: string | null,
  restrictionIds: readonly string[],
  curatedAlternatives: readonly string[],
): Promise<readonly string[]> {
  if (!ingredient || restrictionIds.length === 0) return [];
  try {
    const { normaliseIngredientForDedupe } = await import("../../lib/uplift-persistence.js");
    const { learnedSubstitutionStore } = await import("./learned-substitution-store.js");
    const ingredientKey = normaliseIngredientForDedupe(ingredient);
    if (!ingredientKey) return [];

    const curatedKeys = new Set(curatedAlternatives.map(a => normaliseChoice(a)));
    const seen = new Set<string>();
    const merged: { replacement: string; householdCount: number }[] = [];
    for (const restrictionId of restrictionIds) {
      const observed = await learnedSubstitutionStore.listObservations(restrictionId, ingredientKey);
      for (const o of observed) {
        const key = normaliseChoice(o.statedReplacement);
        if (curatedKeys.has(key) || seen.has(key)) continue;
        seen.add(key);
        merged.push({ replacement: o.statedReplacement, householdCount: o.householdCount });
      }
    }
    return merged
      .sort((a, b) => b.householdCount - a.householdCount)
      .map(m => m.replacement)
      .slice(0, 3);
  } catch {
    return [];
  }
}

/**
 * COMP3 — when a household names its own fix and it is genuinely new (not
 * already curated, not already shared by another household), record it so a
 * later household with the same conflict may see it, equally disclaimed.
 * Best-effort: never lets a storage fault interrupt the household's turn.
 */
async function recordStatedReplacementIfNew(
  check: Extract<PlannerMealCheck, { kind: "restricted" }>,
  correction: string,
): Promise<void> {
  if (!check.ingredient || !check.householdId) return;
  const stated = extractStatedReplacement(correction, check.restrictionNames);
  if (!stated) return;
  const key = normaliseChoice(stated);
  const alreadyKnown = [...check.alternatives, ...check.communityAlternatives]
    .some(option => normaliseChoice(option.replace(/\s+\([^)]*\)$/, "")) === key);
  if (alreadyKnown) return;

  try {
    const { normaliseIngredientForDedupe } = await import("../../lib/uplift-persistence.js");
    const { learnedSubstitutionStore } = await import("./learned-substitution-store.js");
    const ingredientKey = normaliseIngredientForDedupe(check.ingredient);
    if (!ingredientKey) return;
    for (const restrictionId of check.restrictionIds) {
      await learnedSubstitutionStore.recordObservation({
        restrictionId,
        ingredientKey,
        statedReplacement: stated,
        householdId: check.householdId,
      });
    }
  } catch {
    // Best-effort — the household's turn must not fail because learning did.
  }
}

function normaliseChoice(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * A short affirmative reply to a Companion-offered recipe change — "yes", "go
 * ahead", etc. Mirrors conversation-gateway.ts's own copy exactly; duplicated
 * rather than imported to avoid a circular dependency (that module already
 * imports FROM this one).
 */
const AFFIRMATIVE_REPLY_RE = /^\s*(?:yes|yeah|yep|yup|sure|please do|go ahead|do it|that works|sounds good|ok|okay)\b/i;

/**
 * COMP3 — pull a stated replacement out of a household's own words, e.g.
 * "I can just buy gluten free Worcestershire sauce" → "gluten-free
 * Worcestershire sauce". Deliberately narrow: it only recognises the
 * explicit "<restriction>-free <product>" shape, built from the restriction
 * names THIS check already found conflicting (never a fixed vocabulary of
 * product names). A correction that doesn't use that shape yields nothing —
 * a bare question like "what are some alternatives?" must never be read as
 * the household teaching the Companion a new fact.
 */
function extractStatedReplacement(correction: string, restrictionNames: readonly string[]): string | null {
  for (const name of restrictionNames) {
    const word = name.trim();
    if (!word) continue;
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}[- ]free\\s+([a-z][a-z'-]*(?:\\s+[a-z][a-z'-]*){0,4})`, "i");
    const match = re.exec(correction);
    if (!match) continue;
    const phrase = match[1].trim().replace(/\s+(?:instead|please|too|as well)$/i, "");
    if (phrase.length >= 2 && phrase.length <= 60) return `${word.toLowerCase()}-free ${phrase}`;
  }
  return null;
}

function restrictionChoiceQuestion(check: Extract<PlannerMealCheck, { kind: "restricted" }>, correction?: string): string {
  const restriction = check.restrictionNames.length > 0
    ? `your household's ${check.restrictionNames.join(" and ")} restriction${check.restrictionNames.length > 1 ? "s" : ""}`
    : "your household's dietary requirements";
  const issue = check.ingredient ? ` The recipe lists "${check.ingredient.slice(0, 100)}".` : "";
  const curated = check.alternatives.map(option => option.replace(/\s+\([^)]*\)$/, ""));
  const community = check.communityAlternatives.map(option => option.replace(/\s+\([^)]*\)$/, ""));

  const selectedCurated = correction
    ? curated.find(option => normaliseChoice(correction).includes(normaliseChoice(option)))
    : undefined;
  if (selectedCurated) {
    const others = curated.filter(option => option !== selectedCurated);
    return `You're right — ${selectedCurated} is a possible replacement.${others.length ? ` Other options are ${listNames(others)}.` : ""}${issue} ` +
      `The saved recipe still conflicts with ${restriction} until its ingredients are changed and checked. ` +
      `Save the version you choose, then ask me to add it; I'll check the whole recipe first.`;
  }

  const selectedCommunity = correction
    ? community.find(option => normaliseChoice(correction).includes(normaliseChoice(option)))
    : undefined;
  if (selectedCommunity) {
    return `Noted — other households have mentioned ${selectedCommunity} too, though I haven't verified that myself, so please check it before relying on it.${issue} ` +
      `The saved recipe still conflicts with ${restriction} until its ingredients are changed and checked. ` +
      `Save the version you choose, then ask me to add it; I'll check the whole recipe first.`;
  }

  // The household named something neither curated nor already shared by
  // another household — acknowledged here (never claimed as verified); the
  // caller records it so another household with the same conflict may see
  // it, equally disclaimed, later.
  const stated = correction ? extractStatedReplacement(correction, check.restrictionNames) : null;
  if (stated) {
    return `Thanks — I've noted ${stated} as something you're using, though I haven't verified it myself, so please double-check it.${issue} ` +
      `The saved recipe still conflicts with ${restriction} until its ingredients are changed and checked. ` +
      `Save the version you choose, then ask me to add it; I'll check the whole recipe first.`;
  }

  // Exactly one confident, curated option: offer to do the edit directly
  // rather than asking "which would you prefer" of a list with one entry.
  if (curated.length === 1) {
    return `"${check.mealName}" currently conflicts with ${restriction}.${issue} ` +
      `A possible replacement is ${curated[0]}. Do you need me to update your saved recipe to use it, so I can add it?`;
  }
  if (curated.length > 1) {
    return `"${check.mealName}" currently conflicts with ${restriction}.${issue} ` +
      `Possible replacements are ${listNames(curated)}. Which would you prefer? ` +
      `I can update your saved recipe once you choose.`;
  }
  if (community.length === 1) {
    return `"${check.mealName}" currently conflicts with ${restriction}.${issue} ` +
      `I couldn't verify a replacement myself, but other households have mentioned ${community[0]} — ` +
      `I haven't confirmed this works for your restriction, so please check it yourself before relying on it. ` +
      `Do you need me to update your saved recipe to use it anyway, so I can add it?`;
  }
  if (community.length > 1) {
    return `"${check.mealName}" currently conflicts with ${restriction}.${issue} ` +
      `I couldn't verify a replacement myself, but other households have mentioned ${listNames(community)} — ` +
      `I haven't confirmed this works for your restriction, so please check it yourself before relying on it. ` +
      `Which would you prefer? I can update your saved recipe once you choose.`;
  }
  return `"${check.mealName}" currently conflicts with ${restriction}.${issue} ` +
    `I couldn't verify a suitable replacement for that ingredient. ` +
    `The saved recipe needs to be updated and checked before I can offer to add it.`;
}

/**
 * COMP3 — the one replacement the household has, right now, clearly asked for:
 * named it outright ("I'll use gluten-free Worcestershire sauce"), or simply
 * said yes to the one option the Companion already offered. Two or more
 * candidates with a bare "yes" and nothing named resolves to nothing here —
 * that ambiguity still has to be asked, never guessed.
 */
function resolveConfirmedReplacement(
  check: Extract<PlannerMealCheck, { kind: "restricted" }>,
  correction: string | undefined,
): string | null {
  if (!correction) return null;
  const curated = check.alternatives.map(option => option.replace(/\s+\([^)]*\)$/, ""));
  const community = check.communityAlternatives.map(option => option.replace(/\s+\([^)]*\)$/, ""));

  const named =
    curated.find(option => normaliseChoice(correction).includes(normaliseChoice(option))) ??
    community.find(option => normaliseChoice(correction).includes(normaliseChoice(option)));
  if (named) return named;

  const stated = extractStatedReplacement(correction, check.restrictionNames);
  if (stated) return stated;

  const onlyCandidate = curated.length + community.length === 1 ? (curated[0] ?? community[0]) : undefined;
  if (onlyCandidate && AFFIRMATIVE_REPLY_RE.test(correction)) return onlyCandidate;

  return null;
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

  const meal = await resolveMealId(command.subject, ctx, deps.read);
  if ("question" in meal) return { kind: "clarification", question: meal.question };

  const safety = await deps.checkPlannerMeal(meal.mealId, ctx, deps.read);
  if (safety.kind === "unavailable") {
    return { kind: "clarification", question: "I can't check this saved meal against your household's dietary requirements right now, so I can't offer to add it yet." };
  }
  if (safety.kind === "restricted") {
    if (ctx.dietaryCorrection) await recordStatedReplacementIfNew(safety, ctx.dietaryCorrection);

    // The household has clearly asked for one specific fix — named it, or
    // said yes to the single option on offer. Propose updating THEIR OWN
    // saved copy; nothing is written until they confirm the proposal itself
    // (the existing confirm-button step every other write already requires).
    const toApply = resolveConfirmedReplacement(safety, ctx.dietaryCorrection);
    if (toApply && safety.ingredient && safety.householdId !== null) {
      return draftFor(
        "meals",
        "replace",
        `Update "${safety.mealName}" to use ${toApply} instead of "${safety.ingredient}"`,
        { mealId: meal.mealId, ingredient: safety.ingredient, matchedTerm: safety.matchedTerm, replacement: toApply },
        deps.canExecute,
        deps.getCapability,
      );
    }

    return { kind: "clarification", question: restrictionChoiceQuestion(safety, ctx.dietaryCorrection) };
  }

  const day = await resolvePlannerDay(target, ctx, deps.read);
  if (day.kind === "clarification") return day;

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
  readonly checkPlannerMeal: (mealId: number, ctx: ActionResolutionContext, read: ReadIntentFn) => Promise<PlannerMealCheck>;
  readonly hasCurrentHealthContextConsent: (userId: number) => Promise<boolean>;
}

async function resolveReportedHealthContext(
  command: ActionCommand,
  ctx: ActionResolutionContext,
  deps: Deps,
): Promise<ActionResolution> {
  const fact = command.subject?.trim();
  if (!fact) return { kind: "clarification", question: "What exact health information would you like me to remember as reported?" };
  const userId = Number(ctx.identity.userId);
  if (!Number.isInteger(userId) || !(await deps.hasCurrentHealthContextConsent(userId))) {
    return {
      kind: "clarification",
      question: "Before I can save health information, review and grant the current health-data consent in Privacy Settings, then tell me again. You can open Privacy Settings from your Profile.",
    };
  }
  if (command.capability === "profile") {
    return draftFor("profile", "add", `Save “${fact}” as reported in your profile`, {
      scope: "reported-health-context", reportedFact: fact,
    }, deps.canExecute, deps.getCapability);
  }

  const result = (await readResult(deps.read, ctx.identity, "household", "read", { scope: "eaters" })) as
    | { readonly eaters?: ReadonlyArray<{ readonly id: string; readonly displayName: string; readonly kind: string }> }
    | null;
  const children = (result?.eaters ?? []).filter((eater) => eater.kind === "no-account");
  let selected: (typeof children)[number] | undefined;
  if (command.personName) {
    const match = matchByName(children, command.personName, (eater) => eater.displayName);
    if ("ambiguous" in match) return { kind: "clarification", question: `Which child did you mean — ${listNames(match.ambiguous.map((eater) => eater.displayName))}?` };
    if ("miss" in match) return { kind: "clarification", question: `I couldn't match “${command.personName}” to a child in this household. Which child's profile should I update?` };
    selected = match.hit;
  } else if (children.length === 1) {
    selected = children[0];
  } else if (children.length > 1) {
    return { kind: "clarification", question: `Which child should I update — ${listNames(children.map((eater) => eater.displayName))}?` };
  }
  if (!selected) return { kind: "clarification", question: "I couldn't find a dependent child record in this household. Add the child in Household first, then tell me what to save." };
  return draftFor("household", "add", `Save “${fact}” as reported for ${selected.displayName}`, {
    scope: "reported-health-context", eaterId: selected.id, reportedFact: fact,
  }, deps.canExecute, deps.getCapability);
}

async function resolveNutritionFocus(
  command: ActionCommand,
  ctx: ActionResolutionContext,
  deps: Deps,
): Promise<ActionResolution> {
  const focusId = command.nutritionFocus;
  const label = focusId ? nutritionFocusLabel(focusId) : undefined;
  if (!focusId || !label) return { kind: "unresolved" };
  const userId = Number(ctx.identity.userId);
  if (!Number.isInteger(userId) || !(await deps.hasCurrentHealthContextConsent(userId))) {
    return {
      kind: "clarification",
      question: "Before I can save a nutrition focus, review and grant the current health-data consent in Privacy Settings, then tell me again. You can open Privacy Settings from your Profile.",
    };
  }
  if (command.capability === "profile") {
    return draftFor("profile", "add", `Save “${label}” as a nutrition focus in your profile`, {
      scope: "nutrition-focus", focus: focusId,
    }, deps.canExecute, deps.getCapability);
  }

  const result = (await readResult(deps.read, ctx.identity, "household", "read", { scope: "eaters" })) as
    | { readonly eaters?: ReadonlyArray<{ readonly id: string; readonly displayName: string; readonly kind: string }> }
    | null;
  const dependents = (result?.eaters ?? []).filter((eater) => eater.kind === "no-account");
  let selected: (typeof dependents)[number] | undefined;
  if (command.personName) {
    const match = matchByName(dependents, command.personName, (eater) => eater.displayName);
    if ("ambiguous" in match) return { kind: "clarification", question: `Which dependent did you mean — ${listNames(match.ambiguous.map((eater) => eater.displayName))}?` };
    if ("miss" in match) return { kind: "clarification", question: `I couldn't match “${command.personName}” to a dependent profile in this household. Which profile should I update?` };
    selected = match.hit;
  } else if (dependents.length === 1) {
    selected = dependents[0];
  } else if (dependents.length > 1) {
    return { kind: "clarification", question: `Which dependent should I update — ${listNames(dependents.map((eater) => eater.displayName))}?` };
  }
  if (!selected) return { kind: "clarification", question: "I couldn't find a dependent profile in this household. Add them in Profile first, then tell me what food focus to save." };
  return draftFor("household", "add", `Save “${label}” as a nutrition focus for ${selected.displayName}`, {
    scope: "nutrition-focus", eaterId: selected.id, focus: focusId,
  }, deps.canExecute, deps.getCapability);
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
    checkPlannerMeal: overrides.checkPlannerMeal ?? defaultCheckPlannerMeal,
    hasCurrentHealthContextConsent: overrides.hasCurrentHealthContextConsent ?? hasCurrentHealthContextConsent,
  };

  // A command with no identity cannot be scoped to a household, and an unscoped
  // write proposal is not something to offer.
  if (!ctx.identity?.userId) return { kind: "unresolved" };

  switch (`${command.capability}.${command.verb}`) {
    case "profile.add":
    case "household.add":  return command.nutritionFocus
      ? resolveNutritionFocus(command, ctx, deps)
      : resolveReportedHealthContext(command, ctx, deps);
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
