/**
 * companion-guidance.ts — INT38 Companion Guidance & Action Framework / INT39
 * Capability Guidance Registry & Goal Completion
 * =============================================================================
 * The Companion answers a question and then offers a small, deterministic set
 * of cross-domain "Next Step" suggestions — e.g. a nutrition answer nudges
 * towards meals/planner, a planner answer nudges towards nutrition/shopping —
 * so the Companion guides the user towards completing their goal instead of
 * ending the conversation. On an UNSUCCESSFUL turn, this module also resolves
 * the most appropriate alternative/recovery actions, where the platform has
 * one to offer.
 *
 * INT39 SCOPE CHANGE — guidance is now CAPABILITY-OWNED, not Companion-owned:
 *  - This module no longer holds its own journey graph (INT38's static
 *    JOURNEY_MAP). It is a thin CONSUMER of the Capability Guidance Registry
 *    (server/intelligence/types.ts `Capability.guidance`, declared per
 *    capability in capability-registry.ts). "Guidance belongs to
 *    capabilities, not the Companion" (INT39 architecture principle).
 *  - Every suggested destination is STILL gated through
 *    intelligencePlatform.canExecute(capabilityId, verb) at resolution time —
 *    a suggestion is offered ONLY when the target capability is genuinely
 *    registered and executable today. An unavailable/gapped target is
 *    silently omitted, never fabricated (Architecture Principle 6).
 *  - No new capability, no new owner, no business logic. This module only
 *    RESOLVES which of a capability's declared guidance actions to surface
 *    this turn; navigation itself is resolved by companion-card.ts's
 *    domainLandingPath().
 *  - The current workspace/surface is never used to restrict which
 *    suggestions are considered — only to help label copy. Guidance is
 *    generated from whichever capabilities actually produced (or were
 *    attempted for) data this turn, regardless of the page the user is on.
 *
 * Run tests: npx tsx server/tests/test-intelligence-capability-guidance-goals.ts
 */

import { intelligencePlatform } from "../intelligence-platform.js";
import type { CapabilityGuidance, GuidanceAction, IntentVerb } from "../types.js";

// ---------------------------------------------------------------------------
// Public contract
// ---------------------------------------------------------------------------

/** One cross-domain guidance suggestion, offered on a turn (success or recovery). */
export interface GuidanceSuggestion {
  /** The Companion Card domain this suggestion was generated FROM. */
  readonly sourceDomain: string;
  /** The Companion Card domain this suggestion points TO. */
  readonly domain: string;
  /** Human-readable label for the suggestion chip. */
  readonly label: string;
  /** The capability this suggestion was generated from (INT39 — for goal-completion joins). */
  readonly sourceCapabilityId: string;
  /** The capability this suggestion points to (INT39 — for goal-completion joins). */
  readonly targetCapabilityId: string;
  /** The verb the target action expresses (INT39). */
  readonly verb: IntentVerb;
}

/** Maximum guidance suggestions attached to one turn — avoid overwhelming the user. */
const MAX_SUGGESTIONS = 2;

// ---------------------------------------------------------------------------
// Capability id → Companion Card domain (base + discovery capability ids)
// ---------------------------------------------------------------------------

/**
 * Every live, user-reachable capability id resolves to one of the 7 Companion
 * Card domains (native-discovery.ts's vocabulary: meal, planner, shopping,
 * pantry, diary, nutrition, household). Deliberately excludes administration/
 * developer — never reachable from an ordinary Companion turn. This is
 * presentation vocabulary (which UI domain a capability belongs to) — it is
 * NOT workflow knowledge (which capability leads to which), so it stays here
 * rather than moving into the Capability Guidance Registry.
 */
export const CAPABILITY_DOMAIN: Readonly<Record<string, string>> = {
  planner: "planner",
  "planner-discovery": "planner",
  shopping: "shopping",
  "shopping-discovery": "shopping",
  "nutrition-knowledge": "nutrition",
  "nutrition-discovery": "nutrition",
  meals: "meal",
  "meal-discovery": "meal",
  templates: "meal",
  pantry: "pantry",
  "pantry-discovery": "pantry",
  diary: "diary",
  "diary-discovery": "diary",
  household: "household",
  "household-discovery": "household",
  profile: "household",
  partners: "shopping",
  analyser: "nutrition",
};

// ---------------------------------------------------------------------------
// Guidance-action resolution — reads the Capability Guidance Registry
// ---------------------------------------------------------------------------

/** Injectable executability check — defaults to the production registry, pure/testable otherwise. */
export type CanExecuteFn = (capabilityId: string, verb: IntentVerb) => boolean;

/** Injectable guidance lookup — defaults to the production registry, pure/testable otherwise. */
export type GetGuidanceFn = (capabilityId: string) => CapabilityGuidance | undefined;

const defaultCanExecute: CanExecuteFn = (capabilityId, verb) =>
  intelligencePlatform.canExecute(capabilityId, verb);

const defaultGetGuidance: GetGuidanceFn = (capabilityId) =>
  intelligencePlatform.getGuidance(capabilityId);

/**
 * The candidate actions for a capability, in priority order, depending on
 * whether this is a SUCCESS turn ("what to do next, having succeeded") or a
 * RECOVERY turn ("what else could you try, this didn't work"):
 *  - success:  primary → related → follow-up (go deeper into the journey)
 *  - recovery: related → primary → follow-up (try a lateral alternative first)
 */
function candidateActions(
  guidance: CapabilityGuidance | undefined,
  mode: "success" | "recovery",
): readonly GuidanceAction[] {
  if (!guidance) return [];
  const primary = guidance.primaryAction ? [guidance.primaryAction] : [];
  const related = guidance.relatedActions ?? [];
  const followUp = guidance.followUpActions ?? [];
  return mode === "success" ? [...primary, ...related, ...followUp] : [...related, ...primary, ...followUp];
}

/**
 * Shared resolver behind buildGuidanceSuggestions / buildRecoverySuggestions.
 * Deterministic, no LLM call. Filters every candidate through `canExecute` so
 * a suggestion is only ever offered for a genuinely registered+executable
 * capability (never a fabricated or gapped workflow). Never re-suggests a
 * domain already answered/attempted this turn. Caps at MAX_SUGGESTIONS.
 */
function resolveSuggestions(
  sourceCapabilityIds: readonly string[],
  mode: "success" | "recovery",
  canExecute: CanExecuteFn,
  getGuidance: GetGuidanceFn,
): GuidanceSuggestion[] {
  const seenSources = new Set<string>();
  const orderedSources = sourceCapabilityIds.filter((id) => {
    if (seenSources.has(id) || !CAPABILITY_DOMAIN[id]) return false;
    seenSources.add(id);
    return true;
  });
  if (orderedSources.length === 0) return [];

  const suggestions: GuidanceSuggestion[] = [];
  // Never re-suggest a domain already answered/attempted this turn.
  const seenTargetDomains = new Set<string>(orderedSources.map((id) => CAPABILITY_DOMAIN[id]));

  for (const sourceId of orderedSources) {
    const sourceDomain = CAPABILITY_DOMAIN[sourceId];
    const actions = candidateActions(getGuidance(sourceId), mode);
    for (const action of actions) {
      const targetDomain = CAPABILITY_DOMAIN[action.capabilityId];
      if (!targetDomain || seenTargetDomains.has(targetDomain)) continue;
      if (!canExecute(action.capabilityId, action.verb)) continue;
      seenTargetDomains.add(targetDomain);
      suggestions.push({
        sourceDomain,
        domain: targetDomain,
        label: action.label,
        sourceCapabilityId: sourceId,
        targetCapabilityId: action.capabilityId,
        verb: action.verb,
      });
      if (suggestions.length >= MAX_SUGGESTIONS) return suggestions;
    }
  }
  return suggestions;
}

// ---------------------------------------------------------------------------
// Public builders
// ---------------------------------------------------------------------------

/**
 * Build the cross-domain guidance suggestions for a SUCCESSFUL turn, given
 * the capability ids that produced real grounding data this turn (deduped,
 * resolver order). Reads each source capability's own declared guidance
 * (primary → related → follow-up) from the Capability Guidance Registry.
 */
export function buildGuidanceSuggestions(
  successCapabilityIds: readonly string[],
  canExecute: CanExecuteFn = defaultCanExecute,
  getGuidance: GetGuidanceFn = defaultGetGuidance,
): GuidanceSuggestion[] {
  return resolveSuggestions(successCapabilityIds, "success", canExecute, getGuidance);
}

/**
 * Build "you could also try" recovery suggestions for an UNSUCCESSFUL turn,
 * given the capability ids the resolver actually attempted (routed to) this
 * turn, even though none produced grounding data. Reuses the SAME Capability
 * Guidance Registry data as the success path — a capability's `relatedActions`
 * are the most natural recovery path (a lateral alternative), tried before
 * its deeper primary/follow-up actions. Returns [] when the platform has
 * nothing appropriate to offer — recovery is offered only "where possible"
 * (EWO-INT39), never fabricated.
 */
export function buildRecoverySuggestions(
  attemptedCapabilityIds: readonly string[],
  canExecute: CanExecuteFn = defaultCanExecute,
  getGuidance: GetGuidanceFn = defaultGetGuidance,
): GuidanceSuggestion[] {
  return resolveSuggestions(attemptedCapabilityIds, "recovery", canExecute, getGuidance);
}
