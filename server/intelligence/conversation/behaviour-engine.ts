/**
 * behaviour-engine.ts — EWO2 Companion Personality Platform, Stage 2
 *                        · BEH1 Behaviour Engine Activation (decision layer)
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
 * BEH1 — THE DECISION LAYER (§ "The behaviour decision"):
 * Before BEH1 the engine's one decision ("given this already-produced content
 * and this user's chosen voice, what are the exact words?") existed only as a
 * bare `PersonalityId` threaded through the gateway and applied at three
 * seams. BEH1 makes it a first-class, sealed value: `resolveBehaviour()`
 * decides the voice once per interaction (recording its provenance and the
 * fail-safe default when it fires), and `sealBehaviourDecision()` closes it
 * with the outcome, the surfaces the transform actually touched, and a
 * deterministic reasoning trail. Nothing else may decide the Companion's
 * voice; nothing here decides anything else.
 *
 * What the decision layer STILL does not do (INT21 §3, unchanged):
 *  - It performs no I/O. The caller reads `user_preferences.companionPersonality`
 *    and passes the raw value in; the engine reads no store and calls nothing.
 *  - It records NO observation. Telemetry is the Observation Engine's, captured
 *    by the gateway (Observation Engine §4 rule 4: pure modules never record).
 *  - It persists nothing, and holds no reference to the Intent Engine or the
 *    Capability Registry — every routing/permission/confirmation decision is
 *    made upstream and is untouchable from here.
 *  - `confidence` is voice PROVENANCE, never a model score or a quality score,
 *    and no component may read it back to make a decision.
 *
 * Run tests: npx tsx server/tests/test-intelligence-personality-platform.ts
 *            npx tsx server/tests/test-intelligence-behaviour-decision.ts
 */

import {
  getPersonality,
  isPersonalityId,
  normalizePersonalityId,
  PERSONALITY_IDS,
  DEFAULT_PERSONALITY_ID,
  type PersonalityId,
  type BehaviourProfile,
  type FallbackPhraseInputs,
  type GrowthPhraseInputs,
} from "./personality-registry.js";
import type { UnsuccessfulTurnState } from "./turn-fallback.js";
import type { GuidanceSuggestion } from "./companion-guidance.js";
import { toGrowthPhraseInputs, type Notice } from "./notice-engine.js";

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
// Notice phrasing (EWX1 Stage 3 — Behaviour Integration) — the SAME
// underlying notice, voiced differently per personality, by dispatching
// to the EXISTING per-personality templates above. No new template content is
// added by this function: a "friend" notices a streak differently from a
// "coach" because `buildCelebration`/`growthTemplate`/`guidanceLabelPrefix`
// already differ per personality (EWO2) — this function only routes each
// Notice's fact shape to the right existing builder. Content produced by
// an existing capability (the "opportunity" fact kind, from OD1/FI4) is never
// reworded — only its already-honest suggestedAction is optionally prefixed,
// exactly like voiceGuidanceLabel does for guidance suggestions.
// ---------------------------------------------------------------------------

export function phraseNotice(notice: Notice, personalityId: PersonalityId): string {
  const { fact } = notice;
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
      // Reuses the SAME generic prefix mechanism opportunity notices
      // already use — no new per-personality template content is added for
      // seasonal phrasing (IA2).
      return voiceGuidanceLabel(fact.headline, personalityId);
  }
}

// ===========================================================================
// BEH1 — THE BEHAVIOUR DECISION
// ===========================================================================
// One decision per interaction, produced once, in one place: which voice was
// applied, where it came from, which seams it actually touched, what it
// produced, and — deterministically — why. Every field below describes the
// ENGINE'S OWN TRANSFORM. Not one of them describes the household's data, the
// user's utterance, the truth of a gap, or the eligibility of a suggestion:
// those belong to their owners upstream and cross this layer verbatim.
// ---------------------------------------------------------------------------

/**
 * The seams a behaviour decision may touch. Closed, and closed to what is
 * genuinely LIVE — a surface is listed here only once the engine actually
 * transforms output at it. `phraseGrowth`, `phraseNotice`, `buildGreeting`
 * and `buildCelebration` remain dormant (INT21 §8.2), so they name no surface
 * yet; BEH-P1/BEH-P2 add theirs when their routes are wired.
 */
export const BEHAVIOUR_SURFACES = [
  /** The additive tone paragraph appended AFTER the gateway's five hard rules. */
  "system-prompt-fragment",
  /** A `turn-fallback.ts` state's disclosure, re-wrapped in the chosen register. */
  "fallback-voicing",
  /** An already-eligible guidance set, stably reordered and cosmetically relabelled. */
  "guidance-voicing",
] as const;

export type BehaviourSurface = (typeof BEHAVIOUR_SURFACES)[number];

/**
 * What the behaviour decision produced for this interaction.
 *
 *  - `voiced`          — the turn was answered and the voice shaped it.
 *  - `voiced-fallback` — an honest gap fired; the voice phrased the SAME
 *                        disclosure `turn-fallback.ts` classified.
 *  - `voiced-error`    — generation failed; the voice phrased the
 *                        `internal-error` disclosure.
 *  - `not-voiced`      — no Behaviour Engine transform ran for this
 *                        interaction. Recorded honestly rather than implied:
 *                        the interaction still produced words, but they were
 *                        platform-owned copy, not registry content. This is
 *                        the grandfathered debt INT21 §8/§10 names, made
 *                        visible instead of silent.
 */
export const BEHAVIOUR_OUTCOMES = ["voiced", "voiced-fallback", "voiced-error", "not-voiced"] as const;

export type BehaviourOutcome = (typeof BEHAVIOUR_OUTCOMES)[number];

/**
 * Why the applied voice differs from the requested one — i.e. why the engine's
 * fail-safe default (INT21 §4.1: "there is no error state at the voice seam")
 * fired. `none` is the overwhelmingly common case: `companionPersonality` is a
 * `notNull` column defaulting to `'companion'`, so a stored preference is
 * normally present and recognised.
 */
export const BEHAVIOUR_OVERRIDE_REASONS = [
  "none",
  /** No preference row / null / blank — the platform default voice was applied. */
  "no-stored-preference",
  /** A stored value that is not a registered PersonalityId — normalised to the default. */
  "unrecognised-preference",
] as const;

export type BehaviourOverrideReason = (typeof BEHAVIOUR_OVERRIDE_REASONS)[number];

/** How the engine knows the applied voice is the one the user chose. */
export type BehaviourConfidenceBasis = "stored-preference" | "platform-default";

/**
 * The voice, resolved. Produced once per interaction, before any seam is
 * touched, from the raw `user_preferences.companionPersonality` value the
 * caller read fresh this turn (never cached — EWO1 §6).
 */
export interface BehaviourResolution {
  /** The raw stored value, trimmed; null when absent or blank. Never a fact about the user. */
  readonly requestedPersonality: string | null;
  /** The voice actually applied. Always a registered id — the default when resolution failed. */
  readonly personalityId: PersonalityId;
  readonly overrideApplied: boolean;
  readonly overrideReason: BehaviourOverrideReason;
  /**
   * PROVENANCE confidence, not quality and not a model score: 1 when the
   * applied voice is the user's explicit, recognised choice; 0 when the
   * platform default was applied because no recognised choice existed.
   * There is no middle value — the engine either knows the user's voice or
   * it does not, and it says which. Nothing reads this back (Observation
   * Engine §7: telemetry is never an input to behaviour).
   */
  readonly confidence: 0 | 1;
  readonly confidenceBasis: BehaviourConfidenceBasis;
}

/** What the caller observed the transform do, closed by `sealBehaviourDecision`. */
export interface BehaviourDecisionInput {
  readonly resolution: BehaviourResolution;
  readonly outcome: BehaviourOutcome;
  /** The seams the transform genuinely touched this interaction — never a guess. */
  readonly surfaces: readonly BehaviourSurface[];
  /** The `turn-fallback.ts` state voiced, when the outcome was a fallback. */
  readonly fallbackState?: UnsuccessfulTurnState | null;
  /** How many already-eligible suggestions were reordered/relabelled. */
  readonly guidanceCount?: number;
  /** Required when `outcome === "not-voiced"`: a short, closed code naming why. */
  readonly notVoicedReason?: string;
}

/** The sealed decision — the canonical record of the Companion's voice for one interaction. */
export interface BehaviourDecision extends BehaviourResolution {
  /** The applied personality's display name, from the one registry. */
  readonly personalityName: string;
  readonly outcome: BehaviourOutcome;
  readonly surfaces: BehaviourSurface[];
  readonly fallbackState: UnsuccessfulTurnState | null;
  readonly guidanceCount: number;
  readonly notVoicedReason: string | null;
  /**
   * A deterministic, operator-facing explanation of this decision — never
   * shown to the user, never a Companion voice surface, and never carrying a
   * fact about the household. Same inputs, same sentences, every time.
   */
  readonly reasoning: string[];
}

/**
 * Resolve the Companion's voice from the raw stored preference.
 * Pure and total: every input resolves to a registered voice, and the engine
 * says honestly whether that voice was chosen or defaulted.
 */
export function resolveBehaviour(storedPreference: unknown): BehaviourResolution {
  const raw = typeof storedPreference === "string" ? storedPreference.trim() : "";
  const requestedPersonality = raw.length > 0 ? raw : null;

  if (requestedPersonality !== null && isPersonalityId(requestedPersonality)) {
    return {
      requestedPersonality,
      personalityId: requestedPersonality,
      overrideApplied: false,
      overrideReason: "none",
      confidence: 1,
      confidenceBasis: "stored-preference",
    };
  }

  return {
    requestedPersonality,
    // normalizePersonalityId is the one normalisation rule — never re-implemented here.
    personalityId: normalizePersonalityId(requestedPersonality),
    overrideApplied: true,
    overrideReason: requestedPersonality === null ? "no-stored-preference" : "unrecognised-preference",
    confidence: 0,
    confidenceBasis: "platform-default",
  };
}

/**
 * Explain a decision. Every sentence states something the engine itself did,
 * and every sentence names the owner of whatever it did NOT do — because the
 * value of this trail to an operator is precisely that it distinguishes "the
 * voice changed the words" from "the platform changed the answer".
 */
function explainBehaviourDecision(input: BehaviourDecisionInput): string[] {
  const { resolution, outcome, surfaces } = input;
  const name = getPersonality(resolution.personalityId).displayName;
  const reasoning: string[] = [];

  switch (resolution.overrideReason) {
    case "none":
      reasoning.push(
        `Voice '${name}' applied from the user's stored companionPersonality preference (read fresh this turn, never cached).`,
      );
      break;
    case "no-stored-preference":
      reasoning.push(
        `No stored companionPersonality preference — the platform default voice '${name}' was applied by the engine's fail-safe default.`,
      );
      break;
    case "unrecognised-preference":
      reasoning.push(
        `Stored companionPersonality '${resolution.requestedPersonality}' is not a registered personality — ` +
          `normalised to the platform default voice '${name}'. No error was surfaced to the user.`,
      );
      break;
  }

  if (surfaces.includes("system-prompt-fragment")) {
    reasoning.push(
      "Appended this personality's tone paragraph after the system prompt's five hard rules; " +
        "the hard rules, and the CONTEXT DATA block composed by the Context Composition Engine, were not modified.",
    );
  }
  if (surfaces.includes("fallback-voicing")) {
    reasoning.push(
      `Voiced the '${input.fallbackState ?? "unspecified"}' honest gap in this personality's register; ` +
        "which state fired, and what it discloses, remain turn-fallback.ts's — unchanged.",
    );
  }
  if (surfaces.includes("guidance-voicing")) {
    const n = input.guidanceCount ?? 0;
    reasoning.push(
      `Stably reordered and cosmetically relabelled ${n} already-eligible guidance suggestion${n === 1 ? "" : "s"}; ` +
        "none added, dropped, retargeted, or made eligible by this engine (companion-guidance.ts owns eligibility).",
    );
  }

  if (outcome === "not-voiced") {
    reasoning.push(
      `No Behaviour Engine transform ran for this interaction (${input.notVoicedReason ?? "reason not recorded"}). ` +
        "The words the user read are platform-owned copy, not Personality Registry content — known debt, recorded rather than implied.",
    );
  } else if (surfaces.length === 0) {
    // Defensive: an outcome that claims voicing must name the seam that voiced it.
    reasoning.push("Outcome reports voiced output but no surface was recorded — treat as an incomplete capture, not as a voiced turn.");
  }

  return reasoning;
}

/**
 * Close the decision for this interaction. Pure: the same inputs always seal
 * to the same decision, including the same reasoning sentences in the same
 * order — so the Execution Timeline is reproducible and diffable.
 */
export function sealBehaviourDecision(input: BehaviourDecisionInput): BehaviourDecision {
  // Deduplicate + canonicalise surface order so two turns that touched the same
  // seams compare equal regardless of the order the caller appended them.
  const surfaces = BEHAVIOUR_SURFACES.filter((s) => input.surfaces.includes(s));

  return {
    ...input.resolution,
    personalityName: getPersonality(input.resolution.personalityId).displayName,
    outcome: input.outcome,
    surfaces,
    fallbackState: input.fallbackState ?? null,
    guidanceCount: input.guidanceCount ?? 0,
    notVoicedReason: input.outcome === "not-voiced" ? (input.notVoicedReason ?? null) : null,
    reasoning: explainBehaviourDecision({ ...input, surfaces }),
  };
}

// ---------------------------------------------------------------------------
// The registry, described — voice metadata for the Behaviour Admin Workbench.
// ---------------------------------------------------------------------------

export interface PersonalityDescription {
  readonly id: PersonalityId;
  readonly displayName: string;
  readonly description: string;
  readonly isDefault: boolean;
  readonly behaviour: BehaviourProfile;
  readonly priorities: string[];
  readonly guidanceLabelPrefix: string;
  readonly systemPromptFragment: string;
}

/**
 * A read-only projection of the one Personality Registry, for the Workbench's
 * "personality applied" panel. This is REGISTRY DATA, not telemetry: it is
 * read from the registry per request and never persisted into an observation,
 * so the Workbench shows the voice as it is defined today rather than a stale
 * copy captured at record time. Registry stays the single owner of voice
 * content (INT21 §2.2); the Observation Engine stays the single owner of
 * runtime rows. The two are joined for display only, never merged.
 */
export function describeBehaviourRegistry(): PersonalityDescription[] {
  return PERSONALITY_IDS.map((id) => {
    const p = getPersonality(id);
    return {
      id: p.id,
      displayName: p.displayName,
      description: p.description,
      isDefault: p.id === DEFAULT_PERSONALITY_ID,
      behaviour: p.behaviour,
      priorities: [...p.priorities],
      guidanceLabelPrefix: p.guidanceLabelPrefix,
      systemPromptFragment: p.systemPromptFragment,
    };
  });
}
