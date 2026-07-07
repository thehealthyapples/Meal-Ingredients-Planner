/**
 * behaviour-engine.ts — EWO2 Companion Personality Platform, Stage 2
 * =========================================================================
 * The reusable engine that turns a `PersonalityId` (personality-registry.ts)
 * into concrete, additive phrasing choices at each of the Companion's
 * existing output seams (conversation-gateway.ts's system prompt, the four
 * turn-fallback.ts states, companion-guidance.ts's suggestion labels, and —
 * new in this workstream — greetings, celebrations, and growth statements).
 *
 * This module contains NO business logic and makes NO decisions about WHAT
 * the Companion says — only HOW. Every function here is a pure string
 * transform over inputs the caller already computed via the platform's
 * existing, unmodified logic:
 *   - WHICH of the four fallback states fired         → turn-fallback.ts
 *   - WHICH guidance suggestions are eligible          → companion-guidance.ts
 *   - WHAT the growth numbers are                      → companion-growth.ts
 *
 * HARD INVARIANT (EWO1 §5 / EWO2 Core Principle): every function below may
 * change WORDING ONLY. None may drop a disclosure, add a claim, reorder a
 * fact out of a suggestion, or change which suggestions are eligible/target.
 * `prioritizeGuidance` reorders an already-filtered, already-capped list —
 * it must never add, remove, or replace an entry.
 *
 * Run tests: npx tsx server/tests/test-intelligence-personality-platform.ts
 */

import {
  getPersonality,
  normalizePersonalityId,
  type PersonalityId,
  type BehaviourProfile,
  type FallbackPhraseInputs,
  type GrowthPhraseInputs,
} from "./personality-registry.js";
import type { UnsuccessfulTurnState } from "./turn-fallback.js";
import type { GuidanceSuggestion } from "./companion-guidance.js";
import { toGrowthPhraseInputs, type Observation } from "./observation-engine.js";

export type { PersonalityId, BehaviourProfile } from "./personality-registry.js";
export { normalizePersonalityId, DEFAULT_PERSONALITY_ID, PERSONALITY_IDS } from "./personality-registry.js";

// ---------------------------------------------------------------------------
// Behaviour profile lookup (Stage 2)
// ---------------------------------------------------------------------------

export function getBehaviourProfile(personalityId: PersonalityId): BehaviourProfile {
  return getPersonality(personalityId).behaviour;
}

// ---------------------------------------------------------------------------
// System prompt tone fragment — additive, appended AFTER the hard rules
// (EWO1 Risk P1: never prepended, never replacing the grounding/firewall
// instructions the caller assembled).
// ---------------------------------------------------------------------------

export function systemPromptFragment(personalityId: PersonalityId): string {
  return getPersonality(personalityId).systemPromptFragment;
}

// ---------------------------------------------------------------------------
// Fallback phrasing (Stage 4) — re-wraps turn-fallback.ts's own dynamic facts
// ---------------------------------------------------------------------------

export function voiceFallback(
  state: UnsuccessfulTurnState,
  personalityId: PersonalityId,
  inputs: FallbackPhraseInputs,
): string {
  return getPersonality(personalityId).fallbackTemplates[state](inputs);
}

// ---------------------------------------------------------------------------
// Guidance suggestion voicing + priority ordering (Stage 3 + Stage 4)
// ---------------------------------------------------------------------------

/** Cosmetic label prefix only — the suggestion's domain/capability/verb/target are untouched. */
export function voiceGuidanceLabel(baseLabel: string, personalityId: PersonalityId): string {
  const prefix = getPersonality(personalityId).guidanceLabelPrefix;
  return prefix ? `${prefix}${baseLabel}` : baseLabel;
}

/**
 * Stage 3 — "each personality prioritises the same intelligence differently."
 * Reorders an ALREADY-RESOLVED, already-eligible suggestion list by how far
 * up this personality's `priorities` list each suggestion's target domain
 * appears. Never adds, drops, or replaces a suggestion — a stable sort only.
 * A domain absent from the priority list keeps its original relative order,
 * appended after every domain that IS prioritised.
 */
export function prioritizeGuidance(
  suggestions: readonly GuidanceSuggestion[],
  personalityId: PersonalityId,
): GuidanceSuggestion[] {
  const priorities = getPersonality(personalityId).priorities;
  const rank = (domain: string): number => {
    const idx = priorities.indexOf(domain);
    return idx === -1 ? priorities.length : idx;
  };
  return suggestions
    .map((s, originalIndex) => ({ s, originalIndex }))
    .sort((a, b) => rank(a.s.domain) - rank(b.s.domain) || a.originalIndex - b.originalIndex)
    .map(({ s }) => s);
}

/** Applies voiceGuidanceLabel across a suggestion list without touching any other field. */
export function voiceGuidanceSuggestions(
  suggestions: readonly GuidanceSuggestion[],
  personalityId: PersonalityId,
): GuidanceSuggestion[] {
  return prioritizeGuidance(suggestions, personalityId).map((s) => ({
    ...s,
    label: voiceGuidanceLabel(s.label, personalityId),
  }));
}

// ---------------------------------------------------------------------------
// Experience Framework consumption (Stage 6) — greetings & celebrations
// ---------------------------------------------------------------------------

/** Deterministic (not random) pick — same personality + same day picks the same greeting, avoiding jarring re-renders. */
function stablePick(list: readonly string[], seed: number): string {
  if (list.length === 0) return "";
  return list[seed % list.length];
}

/** A plain greeting line for this personality. `seed` (e.g. day-of-year) varies which template is picked; no fact is ever inserted. */
export function buildGreeting(personalityId: PersonalityId, seed = 0): string {
  return stablePick(getPersonality(personalityId).experience.greetings, seed);
}

/** A plain celebration line, with `{detail}` replaced by a caller-supplied, already-verified string (never fabricated). */
export function buildCelebration(personalityId: PersonalityId, detail: string, seed = 0): string {
  const template = stablePick(getPersonality(personalityId).experience.celebrations, seed);
  return template.replace("{detail}", detail);
}

// ---------------------------------------------------------------------------
// Growth Model phrasing (Stage 7) — voices real, precomputed numbers only
// ---------------------------------------------------------------------------

export function phraseGrowth(inputs: GrowthPhraseInputs, personalityId: PersonalityId): string {
  return getPersonality(personalityId).growthTemplate(inputs);
}

// ---------------------------------------------------------------------------
// Observation phrasing (EWX1 Stage 3 — Behaviour Integration) — the SAME
// underlying observation, voiced differently per personality, by dispatching
// to the EXISTING per-personality templates above. No new template content is
// added by this function: a "friend" notices a streak differently from a
// "coach" because `buildCelebration`/`growthTemplate`/`guidanceLabelPrefix`
// already differ per personality (EWO2) — this function only routes each
// Observation's fact shape to the right existing builder. Content produced by
// an existing capability (the "opportunity" fact kind, from OD1/FI4) is never
// reworded — only its already-honest suggestedAction is optionally prefixed,
// exactly like voiceGuidanceLabel does for guidance suggestions.
// ---------------------------------------------------------------------------

export function phraseObservation(observation: Observation, personalityId: PersonalityId): string {
  const { fact } = observation;
  switch (fact.kind) {
    case "growth":
      return phraseGrowth(toGrowthPhraseInputs(fact.signal), personalityId);
    case "streak":
      return buildCelebration(personalityId, `a ${fact.currentStreak}-day elite streak`);
    case "diversity":
      return buildCelebration(personalityId, `${fact.plantCount} different plants tried`);
    case "opportunity":
      return voiceGuidanceLabel(fact.suggestedAction, personalityId);
    case "seasonal":
      // Reuses the SAME generic prefix mechanism opportunity observations
      // already use — no new per-personality template content is added for
      // seasonal phrasing (IA2).
      return voiceGuidanceLabel(fact.headline, personalityId);
  }
}
