/**
 * companion-actions.ts — INT40 Companion Task Delegation & Assisted Actions
 * ============================================================================
 * Turns a successful turn's Native Discovery Responses (INT36) into structured
 * Companion Action PROPOSALS — executable platform operations the Companion may
 * perform on the user's behalf, distinct from a Companion Card's navigate-only
 * Next Steps (docs/architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md).
 *
 * ARCHITECTURE — WHY THIS IS NOT A SECOND CARD SYSTEM:
 *   The Companion Card principle bans mutation FROM a card ("no mutation happens
 *   on a card; editing happens on the canonical page"). Companion Actions do not
 *   relax that rule — they are a DIFFERENT, additive structural type, rendered
 *   ALONGSIDE cards, never grafted onto them. companion-card.ts is untouched by
 *   this module. See docs/implementation/intelligence/INT40_COMPANION_TASK_DELEGATION_AND_ASSISTED_ACTIONS.md.
 *
 * SOURCING (a deliberate scope decision — see the INT40 implementation doc):
 *   Proposals are built ONLY from entities already surfaced this turn via
 *   discovery (the SAME `add-to-planner` / `add-to-shopping` DiscoveryAction
 *   vocabulary native-discovery.ts already emits for meal cards) — never by
 *   re-parsing free-text write utterances. This keeps detectWriteIntent() and
 *   the pattern resolver completely untouched: zero regression risk to the
 *   existing, well-tested NLU pipeline.
 *
 * HONEST GAPS — NO DAY IS EVER GUESSED:
 *   A "planner add" proposal requires BOTH `selectedPlannerDayId` and
 *   `selectedMealSlot` to already be present as explicit, client-supplied
 *   surface hints (context-frame-assembler.ts) — e.g. the user is viewing a
 *   specific day+slot in the Planner UI. This module never resolves "today" or
 *   a day name to a dayId; when the hint is absent, the planner proposal is
 *   silently NOT offered (honest gap), never fabricated.
 *
 * EXECUTABILITY GATE (mirrors companion-guidance.ts): every proposal is gated
 * through `intelligencePlatform.canExecute(capabilityId, verb)` — a proposal can
 * never point at an unregistered or not-yet-executable capability.
 *
 * NO BUSINESS LOGIC: this module computes WHICH action to propose and WHAT its
 * resolved parameters are, from data the platform already returned this turn. It
 * never calls a storage method and never invokes intelligencePlatform.handle() —
 * execution happens only when the user explicitly confirms (server/routes.ts).
 *
 * Run tests: npx tsx server/tests/test-intelligence-companion-actions.ts
 */

import { intelligencePlatform } from "../intelligence-platform.js";
import { confirmationFor } from "../permissions.js";
import type { Capability, ConfirmationTier, IntentVerb } from "../types.js";
import type { NativeDiscoveryResponse } from "./native-discovery.js";

// ---------------------------------------------------------------------------
// Public contract
// ---------------------------------------------------------------------------

/** A proposed (not yet persisted) Companion Action — the shape companion-action-store.ts persists. */
export interface CompanionActionProposalDraft {
  readonly capabilityId: string;
  readonly verb: IntentVerb;
  readonly label: string;
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly confirmationTier: ConfirmationTier;
}

/** Surface hints relevant to building action proposals — a narrow slice of ContextFrame. */
export interface ActionProposalHints {
  readonly selectedPlannerDayId?: number;
  readonly selectedMealSlot?: string;
  // ── COMP_ACT2 — pointers to what the household is working with ON SCREEN ──
  //
  // Every field below is CLIENT-SUPPLIED PASS-THROUGH, exactly like INT40's
  // selectedPlannerDayId and PHASE5E's selectedOpportunityId. This module never
  // resolves one, never infers one from a prior turn, and never falls back to a
  // stored record: an action that needs a pointer it was not given is simply not
  // proposed. That is the whole honesty model — see the per-builder gaps below.
  /** The planner entry whose sheet/detail the household has open (COMP_ACT2). */
  readonly selectedPlannerEntryId?: number;
  /** The meal currently ON that entry — used only to refuse a no-op replace. */
  readonly selectedPlannerEntryMealId?: number;
  /** The day that entry currently sits on — used only to refuse a no-op move. */
  readonly selectedPlannerEntryDayId?: number;
  /**
   * That entry's OWN meal slot. Deliberately NOT `selectedMealSlot`: reusing that
   * field would silently switch on the `planner.add` proposal in a context where
   * the Planner deliberately returns an honest gap today (weekly-planner-page.tsx
   * — "slot is chosen per-action, never in view"). COMP_ACT2 changes no existing
   * action's behaviour. An entry's own slot is a known FACT ABOUT THAT ENTRY, not
   * a guess about what the household is looking at.
   */
  readonly selectedPlannerEntrySlot?: string;
  /** The pantry category tab the household has CHOSEN (never the render default). */
  readonly selectedPantryCategory?: string;
  /** The diary day on screen (YYYY-MM-DD) — always exactly the day rendered. */
  readonly selectedDiaryDate?: string;
  /** The diary meal slot the household explicitly opened/expanded, if unambiguous. */
  readonly selectedDiarySlot?: string;
}

/** Maximum action proposals attached to one turn — avoid overwhelming the user with buttons. */
const MAX_PROPOSALS = 4;

/**
 * The pantry categories `pantry-write-handler.ts` accepts. Mirrored here so a
 * proposal can never be built for a category the handler would reject as a gap —
 * this is a re-statement of the handler's OWN allow-list for proposal gating, not
 * a second rule: the handler remains the enforcing authority and re-validates.
 */
const PANTRY_CATEGORIES: ReadonlySet<string> = new Set([
  "larder", "fridge", "freezer", "household", "fruit", "pet",
]);

/** The diary meal slots `diary-write-handler.ts` accepts (note: `snack`, singular). */
const DIARY_SLOTS: ReadonlySet<string> = new Set([
  "breakfast", "lunch", "dinner", "snack", "drink",
]);

/** A diary date must be an exact civil date — the platform never guesses which day to log against. */
const DIARY_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------
// Injectable platform seams (defaults to production, pure/testable otherwise)
// ---------------------------------------------------------------------------

export type CanExecuteFn = (capabilityId: string, verb: IntentVerb) => boolean;
export type GetCapabilityFn = (capabilityId: string) => Capability | undefined;

const defaultCanExecute: CanExecuteFn = (capabilityId, verb) =>
  intelligencePlatform.canExecute(capabilityId, verb);

const defaultGetCapability: GetCapabilityFn = (capabilityId) =>
  intelligencePlatform.getCapability(capabilityId);

// ---------------------------------------------------------------------------
// Per-DiscoveryAction proposal builders
// ---------------------------------------------------------------------------

function tierFor(capabilityId: string, verb: IntentVerb, getCapability: GetCapabilityFn): ConfirmationTier | null {
  const capability = getCapability(capabilityId);
  if (!capability) return null;
  return confirmationFor(capability, verb);
}

function buildPlannerAddProposal(
  mealId: number,
  title: string,
  hints: ActionProposalHints,
  canExecute: CanExecuteFn,
  getCapability: GetCapabilityFn,
): CompanionActionProposalDraft | null {
  // Honest gap — never guess which day. Only propose when the client already told
  // us exactly which day+slot is in view.
  if (hints.selectedPlannerDayId == null || !hints.selectedMealSlot) return null;
  if (!canExecute("planner", "add")) return null;
  const tier = tierFor("planner", "add", getCapability);
  if (!tier) return null;
  return {
    capabilityId: "planner",
    verb: "add",
    label: `Add "${title}" to your planner`,
    parameters: {
      mealId,
      dayId: hints.selectedPlannerDayId,
      mealSlot: hints.selectedMealSlot,
    },
    confirmationTier: tier,
  };
}

function buildShoppingAddProposal(
  title: string,
  canExecute: CanExecuteFn,
  getCapability: GetCapabilityFn,
): CompanionActionProposalDraft | null {
  if (!canExecute("shopping", "add")) return null;
  const tier = tierFor("shopping", "add", getCapability);
  if (!tier) return null;
  return {
    capabilityId: "shopping",
    verb: "add",
    label: `Add "${title}" to your shopping list`,
    parameters: { name: title },
    confirmationTier: tier,
  };
}

// ---------------------------------------------------------------------------
// COMP_ACT2 — proposals for the write verbs COMP_ACT1 bound
// ---------------------------------------------------------------------------
//
// Each builder answers one question: "does the household have enough on screen
// for this action to be REAL?" — and returns null when it does not. None of them
// computes a business outcome; they name a target the household is already
// looking at and hand it to the capability that owns the write.

/** Shopping Delete — the target is a shopping row discovery ALREADY surfaced this turn. */
function buildShoppingDeleteProposal(
  itemId: number,
  title: string,
  canExecute: CanExecuteFn,
  getCapability: GetCapabilityFn,
): CompanionActionProposalDraft | null {
  if (!canExecute("shopping", "delete")) return null;
  const tier = tierFor("shopping", "delete", getCapability);
  if (!tier) return null;
  return {
    capabilityId: "shopping",
    verb: "delete",
    label: `Remove "${title}" from your shopping list`,
    parameters: { id: itemId },
    confirmationTier: tier,
  };
}

/** Pantry Remove — same shape: the pantry row is already on screen. */
function buildPantryRemoveProposal(
  itemId: number,
  title: string,
  canExecute: CanExecuteFn,
  getCapability: GetCapabilityFn,
): CompanionActionProposalDraft | null {
  if (!canExecute("pantry", "delete")) return null;
  const tier = tierFor("pantry", "delete", getCapability);
  if (!tier) return null;
  return {
    capabilityId: "pantry",
    verb: "delete",
    label: `Remove "${title}" from your pantry`,
    parameters: { id: itemId },
    confirmationTier: tier,
  };
}

/**
 * Pantry Add — needs a category, and the handler requires a REAL one.
 * Honest gap: nothing on screen tells us where a food belongs, so this is only
 * proposed when the household has itself chosen a pantry category tab. Inventing
 * one (or defaulting to "larder") would file someone's shopping into a cupboard
 * they never picked.
 */
function buildPantryAddProposal(
  title: string,
  hints: ActionProposalHints,
  canExecute: CanExecuteFn,
  getCapability: GetCapabilityFn,
): CompanionActionProposalDraft | null {
  const category = hints.selectedPantryCategory;
  if (!category || !PANTRY_CATEGORIES.has(category)) return null;
  if (!canExecute("pantry", "add")) return null;
  const tier = tierFor("pantry", "add", getCapability);
  if (!tier) return null;
  return {
    capabilityId: "pantry",
    verb: "add",
    label: `Add "${title}" to your ${category}`,
    parameters: { ingredient: title, category },
    confirmationTier: tier,
  };
}

/**
 * Diary Log — needs BOTH a day and a slot, and guesses neither.
 * The date is the day the diary is actually showing (never "today" resolved here);
 * the slot is one the household explicitly opened. Without both, no proposal —
 * the same refusal diary-write-handler.ts makes ("never guesses which day").
 */
function buildDiaryLogProposal(
  title: string,
  hints: ActionProposalHints,
  canExecute: CanExecuteFn,
  getCapability: GetCapabilityFn,
): CompanionActionProposalDraft | null {
  const date = hints.selectedDiaryDate;
  const mealSlot = hints.selectedDiarySlot;
  if (!date || !DIARY_DATE_RE.test(date)) return null;
  if (!mealSlot || !DIARY_SLOTS.has(mealSlot)) return null;
  if (!canExecute("diary", "add")) return null;
  const tier = tierFor("diary", "add", getCapability);
  if (!tier) return null;
  return {
    capabilityId: "diary",
    verb: "add",
    label: `Log "${title}" to ${mealSlot}`,
    parameters: { name: title, mealSlot, date },
    confirmationTier: tier,
  };
}

/**
 * Planner Move — the entry comes from the sheet the household has open; the
 * TARGET day is the day they explicitly selected; the slot is the entry's own.
 *
 * Two refusals: no entry or no target day → nothing to move (honest gap), and a
 * target day equal to the entry's current day → a no-op dressed as a suggestion,
 * which is worse than silence.
 */
function buildPlannerMoveProposal(
  hints: ActionProposalHints,
  canExecute: CanExecuteFn,
  getCapability: GetCapabilityFn,
): CompanionActionProposalDraft | null {
  const entryId = hints.selectedPlannerEntryId;
  const dayId = hints.selectedPlannerDayId;
  const mealSlot = hints.selectedPlannerEntrySlot;
  if (entryId == null || dayId == null || !mealSlot) return null;
  if (hints.selectedPlannerEntryDayId === dayId) return null;
  if (!canExecute("planner", "move")) return null;
  const tier = tierFor("planner", "move", getCapability);
  if (!tier) return null;
  return {
    capabilityId: "planner",
    verb: "move",
    // The surface sends pointers, not business rows (context-frame-assembler.ts
    // pointer discipline), so this module holds an entry id and no meal title —
    // and it names the entry the household has open rather than fabricating one
    // or reading storage to look it up.
    label: `Move the meal you've opened to the day you've selected`,
    parameters: { entryId, dayId, mealSlot },
    confirmationTier: tier,
  };
}

/**
 * Planner Replace — swap the meal on the open entry for one discovered this turn.
 * Refuses a replace of a meal with itself (a no-op the household would have to
 * read, think about and dismiss).
 */
function buildPlannerReplaceProposal(
  mealId: number,
  title: string,
  hints: ActionProposalHints,
  canExecute: CanExecuteFn,
  getCapability: GetCapabilityFn,
): CompanionActionProposalDraft | null {
  const entryId = hints.selectedPlannerEntryId;
  if (entryId == null) return null;
  if (hints.selectedPlannerEntryMealId === mealId) return null;
  if (!canExecute("planner", "replace")) return null;
  const tier = tierFor("planner", "replace", getCapability);
  if (!tier) return null;
  return {
    capabilityId: "planner",
    verb: "replace",
    label: `Replace the meal you've opened with "${title}"`,
    parameters: { entryId, mealId },
    confirmationTier: tier,
  };
}

// ---------------------------------------------------------------------------
// Public builder
// ---------------------------------------------------------------------------

/**
 * Build the Companion Action proposals for one turn's discovery responses.
 * Deterministic, no LLM call, no storage write. Returns [] when nothing this
 * turn maps to a currently-executable capability — never fabricates an action.
 */
export function buildActionProposals(
  discoveries: readonly NativeDiscoveryResponse[],
  hints: ActionProposalHints,
  canExecute: CanExecuteFn = defaultCanExecute,
  getCapability: GetCapabilityFn = defaultGetCapability,
): CompanionActionProposalDraft[] {
  const proposals: CompanionActionProposalDraft[] = [];

  for (const discovery of discoveries) {
    const entityActionKinds = new Set(
      discovery.actions.filter((a) => a.appliesTo === "entity").map((a) => a.kind),
    );

    for (const card of discovery.entities) {
      // ── INT40 — add-to-planner / add-to-shopping, from meal cards only ─────
      //
      // Only meal cards carry add-to-planner/add-to-shopping today (native-discovery.ts
      // only sets mealActions for the meal-discovery domain) — mirrored here, not
      // re-derived: a card without a "meal" ref simply has nothing to propose.
      if (card.kind === "meal" && card.ref.type === "meal") {
        if (entityActionKinds.has("add-to-planner")) {
          const proposal = buildPlannerAddProposal(card.ref.id, card.title, hints, canExecute, getCapability);
          if (proposal) proposals.push(proposal);
        }
        if (entityActionKinds.has("add-to-shopping")) {
          const proposal = buildShoppingAddProposal(card.title, canExecute, getCapability);
          if (proposal) proposals.push(proposal);
        }
      }

      // ── COMP_ACT2 — the write verbs COMP_ACT1 bound ───────────────────────
      //
      // Keyed on the card's REF TYPE, not on a DiscoveryAction kind: these six
      // verbs have no add-to-* vocabulary in native-discovery, and inventing one
      // would mean editing a discovery engine to carry a button it does not own.
      // The ref type is the honest signal — a `shopping_item` ref IS a row of the
      // household's own list, and that is the whole precondition for offering to
      // remove it.
      switch (card.ref.type) {
        case "shopping_item": {
          const proposal = buildShoppingDeleteProposal(card.ref.id, card.title, canExecute, getCapability);
          if (proposal) proposals.push(proposal);
          break;
        }
        case "pantry_item": {
          const proposal = buildPantryRemoveProposal(card.ref.id, card.title, canExecute, getCapability);
          if (proposal) proposals.push(proposal);
          break;
        }
        case "food":
        case "meal": {
          // A food or meal in view is something the household could stock or log.
          // Both are gaps unless the surface supplied the pointer they need.
          const pantryAdd = buildPantryAddProposal(card.title, hints, canExecute, getCapability);
          if (pantryAdd) proposals.push(pantryAdd);
          const diaryLog = buildDiaryLogProposal(card.title, hints, canExecute, getCapability);
          if (diaryLog) proposals.push(diaryLog);
          if (card.ref.type === "meal") {
            const replace = buildPlannerReplaceProposal(card.ref.id, card.title, hints, canExecute, getCapability);
            if (replace) proposals.push(replace);
          }
          break;
        }
        default:
          break;
      }

      if (proposals.length >= MAX_PROPOSALS) return proposals.slice(0, MAX_PROPOSALS);
    }
  }

  // ── COMP_ACT2 — Planner Move ────────────────────────────────────────────
  //
  // The only proposal that needs NO discovery card: its target is the entry the
  // household already has open and the day they already selected, both of which
  // are true whatever this turn happened to be about. Built once per turn, after
  // the card loop, so it can never be emitted twice.
  const move = buildPlannerMoveProposal(hints, canExecute, getCapability);
  if (move) proposals.push(move);

  return proposals.slice(0, MAX_PROPOSALS);
}
