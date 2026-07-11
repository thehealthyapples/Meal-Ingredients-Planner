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
}

/** Maximum action proposals attached to one turn — avoid overwhelming the user with buttons. */
const MAX_PROPOSALS = 4;

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
    if (!entityActionKinds.has("add-to-planner") && !entityActionKinds.has("add-to-shopping")) continue;

    for (const card of discovery.entities) {
      // Only meal cards carry add-to-planner/add-to-shopping today (native-discovery.ts
      // only sets mealActions for the meal-discovery domain) — mirrored here, not
      // re-derived: a card without a "meal" ref simply has nothing to propose.
      if (card.kind !== "meal" || card.ref.type !== "meal") continue;

      if (entityActionKinds.has("add-to-planner")) {
        const proposal = buildPlannerAddProposal(card.ref.id, card.title, hints, canExecute, getCapability);
        if (proposal) proposals.push(proposal);
      }
      if (entityActionKinds.has("add-to-shopping")) {
        const proposal = buildShoppingAddProposal(card.title, canExecute, getCapability);
        if (proposal) proposals.push(proposal);
      }
      if (proposals.length >= MAX_PROPOSALS) return proposals.slice(0, MAX_PROPOSALS);
    }
  }

  return proposals;
}
