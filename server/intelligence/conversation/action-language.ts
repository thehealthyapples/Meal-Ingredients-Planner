/**
 * Action Language — natural-language command parsing (INT20)
 * ==========================================================
 * The PURE half of INT20. Turns an imperative household utterance into a
 * SYMBOLIC {@link ActionCommand} — "which capability, which verb, which subject,
 * which day, which slot" — and nothing more.
 *
 * WHY THIS EXISTS
 * ---------------
 * COMP_ACT1 bound eight write verbs to their owning services; COMP_ACT2 surfaced
 * them as one-tap proposals built from ON-SCREEN context (`selectedPlannerDayId`,
 * `selectedMealSlot`, …). Neither gave the household a way to simply SAY what it
 * wants: `PatternIntentResolver` emits no write intent at all, and the gateway's
 * `detectWriteIntent` guard refuses every imperative before the resolver even runs.
 * This module supplies the missing step — the words — so the existing verbs become
 * reachable by speech.
 *
 * HARD BOUNDARIES (the reason this file is safe):
 *   • PURE. No storage, no platform call, no I/O, no clock. Same discipline as
 *     PatternIntentResolver, for the same reason: it must be trivially testable
 *     and incapable of side effects.
 *   • NO IDS. This module never produces a dayId, entryId, mealId or item id. It
 *     cannot — those are facts about the household, and inventing one is exactly
 *     the fabrication the platform forbids. It emits SYMBOLIC references only;
 *     `action-resolution.ts` resolves them against real household state.
 *   • NO BUSINESS LOGIC. No planner rule, no shopping rule, no nutrition fact.
 *     It knows English, not food.
 *   • NOTHING IS GUESSED. A reference it cannot read is left ABSENT, never
 *     defaulted. Absence is what makes the resolver ask one clear question
 *     instead of acting on an invention.
 *
 * The day key space (0 = Sunday … 6 = Saturday) is NOT redeclared here: it is
 * imported from `shared/time/household-time.ts`, which owns it (HT8).
 */

import { DAY_NAMES, type DayOfWeek } from "@shared/time/household-time";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** The four capabilities COMP_ACT1 made writable. No others are addressable here. */
export type ActionCapability = "planner" | "shopping" | "pantry" | "diary";

/** The write verbs COMP_ACT1 bound. Mirrors the bindings' executableIntents. */
export type ActionVerb = "add" | "move" | "replace" | "delete";

/**
 * The canonical meal slot vocabulary of THIS module.
 *
 * Deliberately ONE vocabulary, because the two owners disagree: the planner
 * accepts `snacks` (plural) and the diary accepts `snack` (singular). That
 * divergence is real and is NOT this module's to reconcile — it is mapped, per
 * capability, at the point where parameters are built (`action-resolution.ts`),
 * so neither owner is contradicted and the split cannot leak into the language.
 */
export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

/**
 * A day/slot the household NAMED, in symbolic form.
 *
 * Every field is optional and every absent field means "not said". A planner
 * slot needs a week AND a day AND a meal slot before it can be located; which of
 * those the household actually supplied is precisely what the resolver must know
 * in order to ask for the missing one.
 */
export interface SlotRef {
  /** "Week 1" … "Week 6" — an explicit slot label in the six-week rota. */
  readonly weekNumber?: number;
  /** "this week" / "next week" — CALENDAR language, resolvable only if anchored. */
  readonly weekRelation?: "this" | "next";
  /** A named weekday ("Tuesday"), in the declared key space (0 = Sunday). */
  readonly dayOfWeek?: DayOfWeek;
  /** "today" = 0, "tomorrow" = 1, "tonight" = 0 — CALENDAR language. */
  readonly dayOffset?: number;
  /** breakfast / lunch / dinner / snack. */
  readonly mealSlot?: MealSlot;
  /** True when the household used a demonstrative ("this meal", "it") for this ref. */
  readonly deictic?: boolean;
}

/** True when a SlotRef carries nothing at all — the household named no target. */
export function isEmptySlotRef(ref: SlotRef | undefined): boolean {
  if (!ref) return true;
  return (
    ref.weekNumber === undefined &&
    ref.weekRelation === undefined &&
    ref.dayOfWeek === undefined &&
    ref.dayOffset === undefined &&
    ref.mealSlot === undefined &&
    ref.deictic !== true
  );
}

/**
 * One parsed household command. Symbolic throughout — see the hard boundaries.
 */
export interface ActionCommand {
  readonly capability: ActionCapability;
  readonly verb: ActionVerb;
  /**
   * The thing named: a meal ("tuna spaghetti"), a shopping item ("milk"), a
   * pantry item ("bananas"). Absent when the household pointed at something
   * instead of naming it ("move Friday dinner", "log tonight's dinner").
   */
  readonly subject?: string;
  /** Where the action lands (planner add/move target, diary date, pantry/shopping). */
  readonly target?: SlotRef;
  /** Where the action starts FROM — move's source entry, replace's target entry. */
  readonly source?: SlotRef;
  /** The literal phrase matched, retained for the clarification question's wording. */
  readonly utterance: string;
}

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

/** Weekday name → the declared key space. Built FROM the owner, never retyped. */
const WEEKDAY_INDEX: ReadonlyMap<string, DayOfWeek> = new Map<string, DayOfWeek>(
  DAY_NAMES.map((name, index): [string, DayOfWeek] => [name.toLowerCase(), index as DayOfWeek]),
);

/** Common abbreviations households actually type. */
const WEEKDAY_ABBREV: ReadonlyMap<string, DayOfWeek> = new Map<string, DayOfWeek>([
  ["sun", 0], ["mon", 1], ["tue", 2], ["tues", 2], ["wed", 3], ["weds", 3],
  ["thu", 4], ["thur", 4], ["thurs", 4], ["fri", 5], ["sat", 6],
]);

/**
 * Longest-first so "tues" is tried before "tue" and "thurs" before "thu" —
 * otherwise the shorter alternative wins and the trailing letters break the
 * word boundary, leaving "tuesday" unmatched.
 */
const WEEKDAY_WORDS: readonly string[] = [
  ...Array.from(WEEKDAY_INDEX.keys()),
  ...Array.from(WEEKDAY_ABBREV.keys()),
].sort((a, b) => b.length - a.length);

const WEEKDAY_RE = new RegExp(`\\b(${WEEKDAY_WORDS.join("|")})\\b`, "i");

/**
 * Slot words → canonical slot. "tea" and "supper" are British English for the
 * evening meal and are how a great many households actually speak.
 */
const SLOT_WORDS: ReadonlyArray<readonly [RegExp, MealSlot]> = [
  [/\bbreakfasts?\b|\bbrekkie\b/i, "breakfast"],
  [/\blunch(?:es|time)?\b/i, "lunch"],
  [/\bdinners?\b|\bteas?\b|\bsuppers?\b|\bevening\s+meals?\b/i, "dinner"],
  [/\bsnacks?\b/i, "snack"],
];

/**
 * Phase-of-day words that imply BOTH a day offset and a meal slot.
 * "tonight's dinner" and "tonight" alone both mean today's evening meal.
 */
const PHASE_WORDS: ReadonlyArray<readonly [RegExp, number, MealSlot | undefined]> = [
  [/\btonight\b|\bthis\s+evening\b/i, 0, "dinner"],
  [/\bthis\s+morning\b/i, 0, "breakfast"],
  [/\bthis\s+afternoon\b/i, 0, "lunch"],
  [/\blast\s+night\b/i, -1, "dinner"],
  [/\byesterday\b/i, -1, undefined],
  [/\btomorrow\b/i, 1, undefined],
  [/\btoday\b/i, 0, undefined],
];

/** Demonstratives that point at on-screen context rather than naming a thing. */
const DEICTIC_RE = /\b(?:this|that|the)\s+(?:meal|one|entry|dish)\b|\bit\b/i;

/** Destination phrases that identify which capability owns the action. */
const SHOPPING_TARGET_RE =
  /\b(?:shopping\s*list|shopping|basket|grocery\s*list|groceries|trolley)\b/i;
const PANTRY_TARGET_RE = /\b(?:pantry|cupboard|larder|store\s*cupboard)\b/i;
const PLANNER_TARGET_RE = /\b(?:planner|meal\s*plan|plan|week|schedule)\b/i;
const DIARY_TARGET_RE = /\b(?:diary|food\s*diary|log|journal)\b/i;

// ---------------------------------------------------------------------------
// Field extraction
// ---------------------------------------------------------------------------

function matchWeekday(text: string): DayOfWeek | undefined {
  const m = WEEKDAY_RE.exec(text);
  if (!m) return undefined;
  const word = m[1].toLowerCase();
  return WEEKDAY_INDEX.get(word) ?? WEEKDAY_ABBREV.get(word);
}

function matchSlot(text: string): MealSlot | undefined {
  for (const [re, slot] of SLOT_WORDS) if (re.test(text)) return slot;
  return undefined;
}

/** "Week 1" / "week one" / "wk 3". Bounded to the 1–6 rota the schema declares. */
function matchWeekNumber(text: string): number | undefined {
  const digit = /\b(?:week|wk)\s*(\d)\b/i.exec(text);
  if (digit) {
    const n = Number(digit[1]);
    return n >= 1 && n <= 6 ? n : undefined;
  }
  const words = ["one", "two", "three", "four", "five", "six"];
  const worded = new RegExp(`\\b(?:week|wk)\\s+(${words.join("|")})\\b`, "i").exec(text);
  if (worded) return words.indexOf(worded[1].toLowerCase()) + 1;
  return undefined;
}

function matchWeekRelation(text: string): "this" | "next" | undefined {
  if (/\bnext\s+week\b/i.test(text)) return "next";
  if (/\bthis\s+week\b/i.test(text)) return "this";
  return undefined;
}

/** Phase words contribute a day offset and sometimes a slot. */
function matchPhase(text: string): { offset: number; slot?: MealSlot } | undefined {
  for (const [re, offset, slot] of PHASE_WORDS) {
    if (re.test(text)) return slot !== undefined ? { offset, slot } : { offset };
  }
  return undefined;
}

/**
 * Read every temporal/slot signal out of a fragment. Absent fields stay absent —
 * this function never substitutes a default for something unsaid.
 */
function readSlotRef(fragment: string): SlotRef {
  const phase = matchPhase(fragment);
  const explicitSlot = matchSlot(fragment);
  const ref: {
    weekNumber?: number;
    weekRelation?: "this" | "next";
    dayOfWeek?: DayOfWeek;
    dayOffset?: number;
    mealSlot?: MealSlot;
    deictic?: boolean;
  } = {};

  const weekNumber = matchWeekNumber(fragment);
  if (weekNumber !== undefined) ref.weekNumber = weekNumber;

  const weekRelation = matchWeekRelation(fragment);
  if (weekRelation !== undefined) ref.weekRelation = weekRelation;

  const dayOfWeek = matchWeekday(fragment);
  if (dayOfWeek !== undefined) ref.dayOfWeek = dayOfWeek;

  // A named weekday and a phase word are different ways of saying "which day".
  // The named weekday is the more specific, so it wins; the phase still supplies
  // its slot ("Tuesday evening" → Tuesday + dinner).
  if (phase && ref.dayOfWeek === undefined) ref.dayOffset = phase.offset;

  const slot = explicitSlot ?? phase?.slot;
  if (slot !== undefined) ref.mealSlot = slot;

  if (DEICTIC_RE.test(fragment)) ref.deictic = true;

  return ref;
}

/**
 * Clean a captured subject phrase down to the thing itself.
 * Strips leading articles/quantities and trailing punctuation. Returns undefined
 * when nothing nameable survives — a bare demonstrative is not a name (the same
 * deixis rule PatternIntentResolver applies).
 */
function cleanSubject(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let s = raw.trim()
    .replace(/^(?:some|a|an|the|my|our|more|extra)\s+/i, "")
    .replace(/[.,!?;:]+$/, "")
    .trim();
  if (!s) return undefined;
  if (/^(?:it|this|that|one|them|those|these)$/i.test(s)) return undefined;
  if (s.length > 80) s = s.slice(0, 80).trim();
  return s;
}

/** Decide which capability a destination phrase names. */
function destinationCapability(text: string): ActionCapability | undefined {
  if (SHOPPING_TARGET_RE.test(text)) return "shopping";
  if (PANTRY_TARGET_RE.test(text)) return "pantry";
  if (DIARY_TARGET_RE.test(text)) return "diary";
  if (PLANNER_TARGET_RE.test(text)) return "planner";
  return undefined;
}

// ---------------------------------------------------------------------------
// Command patterns
// ---------------------------------------------------------------------------

type CommandMatcher = (utterance: string) => ActionCommand | null;

/**
 * ADD — "Add tuna spaghetti to Week 1 Tuesday lunch."
 *       "Add bananas to my pantry."  "Add milk to the shopping list."
 *
 * One frame, three destinations. Which capability owns it is decided by the
 * destination phrase, never by the item: "bananas" is a pantry item, a shopping
 * item or a meal depending entirely on where the household said to put it.
 */
const ADD_COMMAND: CommandMatcher = (utterance) => {
  const m =
    /^\s*(?:please\s+)?(?:can\s+you\s+|could\s+you\s+)?(?:add|put|stick|pop|throw)\s+(.+?)\s+(?:to|onto|on|into|in)\s+(.+?)\s*$/i.exec(
      utterance,
    );
  if (!m) return null;

  const subject = cleanSubject(m[1]);
  const destination = m[2];
  const capability = destinationCapability(destination);

  // A destination naming no known surface is not an add we can honour.
  if (!capability) {
    // "Add X to Tuesday lunch" — no surface word, but a planner coordinate.
    const ref = readSlotRef(destination);
    if (ref.dayOfWeek !== undefined || ref.mealSlot !== undefined || ref.dayOffset !== undefined) {
      return { capability: "planner", verb: "add", subject, target: ref, utterance };
    }
    return null;
  }
  if (capability === "diary") return null; // logging has its own frame below

  return {
    capability,
    verb: "add",
    subject,
    target: readSlotRef(destination),
    utterance,
  };
};

/**
 * REMOVE — "Remove milk from my shopping list."  "Take bananas out of the pantry."
 *
 * Planner removal is NOT matched: `planner.delete` is not a bound verb (the
 * planner binding executes add/move/replace only), so recognising it here would
 * promise something the platform cannot do.
 */
const REMOVE_COMMAND: CommandMatcher = (utterance) => {
  const m =
    /^\s*(?:please\s+)?(?:can\s+you\s+|could\s+you\s+)?(?:remove|delete|take|drop|get\s+rid\s+of)\s+(.+?)\s+(?:from|out\s+of|off)\s+(.+?)\s*$/i.exec(
      utterance,
    );
  if (!m) return null;

  const subject = cleanSubject(m[1]);
  const capability = destinationCapability(m[2]);
  if (capability !== "shopping" && capability !== "pantry") return null;

  return { capability, verb: "delete", subject, target: readSlotRef(m[2]), utterance };
};

/**
 * MOVE — "Move Friday dinner to Monday."
 *
 * Both halves are slot references: the SOURCE identifies the entry to relocate,
 * the TARGET the day (and slot) it lands in. When the target names no slot, the
 * source's slot carries over — moving "Friday dinner" to "Monday" plainly means
 * Monday DINNER, and that is a reading of the sentence, not an invented fact.
 */
const MOVE_COMMAND: CommandMatcher = (utterance) => {
  const m =
    /^\s*(?:please\s+)?(?:can\s+you\s+|could\s+you\s+)?(?:move|shift|reschedule|switch)\s+(.+?)\s+(?:to|onto|into|over\s+to)\s+(.+?)\s*$/i.exec(
      utterance,
    );
  if (!m) return null;

  const source = readSlotRef(m[1]);
  const target = readSlotRef(m[2]);

  // A move must at least point at something to move.
  if (isEmptySlotRef(source)) return null;

  const merged: SlotRef =
    target.mealSlot === undefined && source.mealSlot !== undefined
      ? { ...target, mealSlot: source.mealSlot }
      : target;

  return { capability: "planner", verb: "move", source, target: merged, utterance };
};

/**
 * REPLACE — "Replace Wednesday dinner with chilli."  "Swap Friday lunch for soup."
 *
 * The source is the entry; the subject is the replacement meal.
 */
const REPLACE_COMMAND: CommandMatcher = (utterance) => {
  const m =
    /^\s*(?:please\s+)?(?:can\s+you\s+|could\s+you\s+)?(?:replace|swap|substitute|change)\s+(.+?)\s+(?:with|for|to)\s+(.+?)\s*$/i.exec(
      utterance,
    );
  if (!m) return null;

  const source = readSlotRef(m[1]);
  const subject = cleanSubject(m[2]);
  if (isEmptySlotRef(source)) return null;

  return { capability: "planner", verb: "replace", subject, source, utterance };
};

/**
 * LOG — "Log tonight's dinner."  "Log porridge for breakfast."
 *       "Add chilli to my food diary."
 *
 * The diary is CALENDAR-shaped (it stores a YYYY-MM-DD date), which is why
 * "tonight" and "today" are honourable here while the planner must refuse them
 * unless its week is anchored. That asymmetry is the two owners' own, not ours.
 */
const LOG_COMMAND: CommandMatcher = (utterance) => {
  // "Log <something>" / "Record <something>" / "Add <something> to my diary"
  const diaryAdd =
    /^\s*(?:please\s+)?(?:can\s+you\s+|could\s+you\s+)?(?:add|put)\s+(.+?)\s+(?:to|into|in)\s+(?:my\s+|the\s+)?(?:food\s+)?(?:diary|log|journal)\s*$/i.exec(
      utterance,
    );
  if (diaryAdd) {
    const subject = cleanSubject(diaryAdd[1]);
    return {
      capability: "diary",
      verb: "add",
      subject,
      target: readSlotRef(diaryAdd[1]),
      utterance,
    };
  }

  const m =
    /^\s*(?:please\s+)?(?:can\s+you\s+|could\s+you\s+)?(?:log|record|note)\s+(.+?)\s*$/i.exec(
      utterance,
    );
  if (!m) return null;

  const body = m[1];
  const ref = readSlotRef(body);

  // "Log tonight's dinner" names no food — the meal is identified by its slot,
  // and what was actually eaten has to come from the plan or from the household.
  // "Log porridge for breakfast" names one.
  const named = /^(.+?)\s+(?:for|as|at)\s+(.+)$/i.exec(body);
  const subject = named
    ? cleanSubject(named[1])
    : cleanSubject(body.replace(/\b(?:tonight|today|yesterday|tomorrow|last\s+night|this\s+(?:morning|afternoon|evening))(?:'s)?\b/gi, "")
        .replace(/\b(?:breakfast|lunch|dinner|tea|supper|snacks?|evening\s+meals?)\b/gi, "")
        .replace(/\s+/g, " "));

  return { capability: "diary", verb: "add", subject, target: ref, utterance };
};

/**
 * Ordered most-specific-first. `move`/`replace` precede `add` because "swap X for
 * Y" also contains no add frame, and `LOG_COMMAND`'s diary-add form precedes the
 * general add so "add chilli to my diary" is a log, not a failed planner add.
 */
const COMMAND_MATCHERS: readonly CommandMatcher[] = [
  MOVE_COMMAND,
  REPLACE_COMMAND,
  LOG_COMMAND,
  REMOVE_COMMAND,
  ADD_COMMAND,
];

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Parse one utterance into a symbolic {@link ActionCommand}, or null when it is
 * not an imperative household command at all.
 *
 * Returning null is the overwhelmingly common case and is not a failure: every
 * question, statement and greeting lands here first and passes straight through
 * to the ordinary read pipeline.
 */
export function parseActionCommand(utterance: string): ActionCommand | null {
  if (typeof utterance !== "string") return null;
  const trimmed = utterance.trim();
  if (!trimmed || trimmed.length > 300) return null;

  // An ADVISORY frame is a question, not a command — the same guard the gateway's
  // detectWriteIntent applies, for the same reason: "what should I add to the
  // pantry?" wants advice and must reach the read pipeline, never a proposal.
  if (
    /\b(?:which|what|whats|what's|should\s+i|could\s+i|can\s+i|shall\s+i|would\s+it|do\s+you\s+recommend|any\s+(?:ideas|suggestions)|is\s+there|are\s+there|suggest|recommend|ideas?\s+for|how\s+do\s+i|why)\b/i.test(
      trimmed,
    )
  ) {
    return null;
  }

  for (const matcher of COMMAND_MATCHERS) {
    const command = matcher(trimmed);
    if (command !== null) return command;
  }
  return null;
}
