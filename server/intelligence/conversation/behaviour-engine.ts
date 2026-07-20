/**
 * behaviour-engine.ts — EWO2 Companion Personality Platform, Stage 2
 *                        · BEH1 Behaviour Engine Activation (decision layer)
 *                        · CP2 Companion Personalities Activation (the voices)
 * =========================================================================
 *
 * CP2 — WHAT "ACTIVATION" MEANT HERE:
 * BEH1 activated the DECISION. CP2 activates the VOICES that decision selects.
 * Three things were true before CP2 and are not now:
 *   1. `user_preferences.companionPersonality` was never declared in
 *      shared/schema.ts, so it was invisible to Drizzle and every user silently
 *      received the default voice. Five of the six personalities were dead code.
 *   2. No surface let a user choose a voice.
 *   3. Three strings the Companion says reached the user without passing
 *      through this engine (INT21 §8.4). CP2 retires all three; the engine
 *      gains `voiceEscalation`, `voiceDegradation` and `buildCompanionExperience`,
 *      and the registry gains the content they read.
 * CP2 adds no engine, no second registry, no template mechanism, and no fact.
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
  type EscalationPhraseInputs,
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
// Escalation + degradation phrasing (CP2) — the two strings that used to live
// in conversation-gateway.ts, now registry content like every other word.
// ---------------------------------------------------------------------------

/**
 * Voices the read-only write refusal. `inputs.action` is `detectWriteIntent()`'s
 * own closed-set description of the mutation the user asked for — a
 * caller-verified string, never model output and never a household fact.
 *
 * The refusal clause itself is identical in all six voices (personality-
 * registry.ts's `cannotYet`), so this transform can change how the refusal
 * sounds and can never change that it IS a refusal.
 */
export function voiceEscalation(personalityId: PersonalityId, inputs: EscalationPhraseInputs): string {
  return getPersonality(personalityId).escalationTemplate(inputs);
}

/** Voices the provider-unavailable degradation. Takes no facts — see `notConfigured`. */
export function voiceDegradation(personalityId: PersonalityId): string {
  return getPersonality(personalityId).degradationTemplate();
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

/**
 * A plain celebration line, with `{detail}` replaced by a caller-supplied,
 * already-verified string (never fabricated).
 *
 * PRESENCE2 — THIS FUNCTION NOW HAS NO PRODUCTION CALLER, deliberately and
 * visibly. Its only two were `phraseNotice`'s `streak` and `diversity` arms, both
 * retired under GEA13 ("THA never scores, ranks, streaks, or rewards a
 * household" — and "celebration effects for ordinary use" is named in the same
 * sentence). It is kept rather than deleted for the reason PRESENCE1 kept
 * `ThaAppleIcon.tsx`: retiring a Personality Registry primitive, and with it the
 * `celebrations` field on all six voices, is an owner's call and not an
 * implementation's. It is recorded as an owner decision, not hidden as an
 * exemption.
 *
 * If it is ever wired again, the thing to check first is what it would be
 * celebrating. A household reaching a number is not an occasion. A household
 * telling THA something about themselves might be.
 */
export function buildCelebration(personalityId: PersonalityId, detail: string, seed = 0): string {
  const template = stablePick(getPersonality(personalityId).experience.celebrations, seed);
  return template.replace("{detail}", detail);
}

/** The one-line invitation shown beneath the greeting. States what may be ASKED — never what is known. */
export function buildInvitation(personalityId: PersonalityId): string {
  return getPersonality(personalityId).experience.invitation;
}

/**
 * PRESENCE2 — the Companion's introduction of itself, in the household's chosen
 * voice. Static by construction: it says why the Companion exists and claims
 * nothing about this household (see `ExperienceProfile.introduction`).
 *
 * Unlike `buildGreeting` it takes no seed and does not rotate. An introduction
 * that varied between showings would not be an introduction.
 */
export function buildIntroduction(personalityId: PersonalityId): string {
  return getPersonality(personalityId).experience.introduction;
}

/**
 * CP2 — the Companion panel's empty-state text, in the user's voice.
 *
 * Every string here already exists somewhere above; this composes them into
 * the one payload the client renders, so the client holds no copy of its own.
 * `transportError` deliberately REUSES the `internal-error` fallback template
 * rather than adding a seventh disclosure: a request that never reached the
 * server is, from the user's side, exactly the failure that template exists to
 * disclose honestly. No new registry content, no second phrasing of one fact.
 */
export interface CompanionExperience {
  readonly personalityId: PersonalityId;
  readonly personalityName: string;
  readonly greeting: string;
  readonly invitation: string;
  /**
   * PRESENCE2 — shown INSTEAD of the greeting on a first meeting (the panel is
   * open and this household has never spoken to the Companion). The client
   * chooses which of the two to render from state it already has; both are sent
   * because which one applies is a question about the conversation, and the
   * conversation is not this route's fact.
   */
  readonly introduction: string;
  readonly transportError: string;
}

export function buildCompanionExperience(personalityId: PersonalityId, seed = 0): CompanionExperience {
  const p = getPersonality(personalityId);
  return {
    personalityId: p.id,
    personalityName: p.displayName,
    greeting: buildGreeting(personalityId, seed),
    invitation: buildInvitation(personalityId),
    introduction: buildIntroduction(personalityId),
    transportError: voiceFallback("internal-error", personalityId, { suggestionExamples: "" }),
  };
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
    // PRESENCE2 — an observation about the household's own eating, VERBATIM.
    //
    // This is the one notice kind that takes NO prefix, and the omission is the
    // point. `voiceGuidanceLabel` exists to mark a sentence as a suggestion; a
    // story headline is not a suggestion, and wrapping it in one would convert
    // "Lentils quietly appeared in more and more meals." into a recommendation
    // the household never asked for and the Story Engine never made. The
    // Companion favours observations over recommendations, and decides only
    // AFTER noticing whether anything further is appropriate — so the noticing
    // itself must arrive unadorned.
    //
    // It also means the voice cannot vary this sentence at all, which is correct:
    // the personality may change how THA sounds, never what it claims is true
    // (CPA1 §0). A headline that six voices could each re-word is a headline six
    // voices could each get wrong.
    case "story":
      return fact.headline;
    case "opportunity":
      return voiceGuidanceLabel(fact.suggestedAction, personalityId);
    case "seasonal":
      // Reuses the SAME generic prefix mechanism opportunity notices
      // already use — no new per-personality template content is added for
      // seasonal phrasing (IA2).
      return voiceGuidanceLabel(fact.headline, personalityId);
    case "learning":
      // PHASE5E (NTC-P4) — the SAME generic prefix mechanism again. `rationale` is
      // EL1's own sentence, written to explain itself (ET6), and it crosses this seam
      // VERBATIM: the voice may prefix it, and may never reword it. THA must not
      // paraphrase what it claims to have learned about a household — the paraphrase
      // is where "you tend to skip fish on weeknights" quietly becomes "you don't like
      // fish", which is a different and unearned claim.
      return voiceGuidanceLabel(fact.rationale, personalityId);
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
 * transforms output at it.
 *
 * CP2 added the three surfaces it wired (`escalation-voicing`,
 * `degradation-voicing`, `greeting-voicing`) and no others, and recorded that
 * `phraseGrowth`, `phraseNotice` and `buildCelebration` were still code-complete
 * and dormant — "their route belongs to NTC-P1, not to this workstream" — so they
 * named NO surface.
 *
 * PHASE5E IS NTC-P1. `notice-voicing` is added here because the transform now
 * genuinely runs: `GET /api/intelligence/companion/notices` calls `phraseNotice`
 * on every notice it returns, and Home renders the voiced sentence. Before this
 * workstream that route returned raw `Notice` objects — a fact with no sentence —
 * and the client hook fetched a URL that did not exist, so nothing was ever
 * voiced and nothing was ever read.
 *
 * A surface here is a promise that a transform ran. This one now does.
 */
export const BEHAVIOUR_SURFACES = [
  /** The additive tone paragraph appended AFTER the gateway's five hard rules. */
  "system-prompt-fragment",
  /** A `turn-fallback.ts` state's disclosure, re-wrapped in the chosen register. */
  "fallback-voicing",
  /** An already-eligible guidance set, stably reordered and cosmetically relabelled. */
  "guidance-voicing",
  /** CP2 — the read-only write refusal, voiced from the registry (was gateway copy). */
  "escalation-voicing",
  /** CP2 — the provider-unavailable degradation, voiced from the registry (was gateway copy). */
  "degradation-voicing",
  /** CP2 — the Companion panel's empty-state greeting + invitation (was hardcoded in the client). */
  "greeting-voicing",
  /**
   * PHASE5E (NTC-P1) — an ambient Notice, voiced by `phraseNotice`. The Silence Rules
   * choose WHICH notices and HOW MANY (at most two); this seam chooses only how the
   * chosen ones SOUND. Selection is never influenced by voice, and voice never
   * introduces a fact: every notice's content crosses this seam verbatim.
   */
  "notice-voicing",
] as const;

export type BehaviourSurface = (typeof BEHAVIOUR_SURFACES)[number];

/**
 * What the behaviour decision produced for this interaction. Each value names a
 * DIFFERENT thing the Companion said, because an operator who sees only
 * "voiced" cannot tell an answer from a refusal.
 *
 *  - `voiced`             — the turn was answered and the voice shaped it.
 *  - `voiced-fallback`    — an honest gap fired; the voice phrased the SAME
 *                           disclosure `turn-fallback.ts` classified.
 *  - `voiced-error`       — generation failed; the voice phrased the
 *                           `internal-error` disclosure.
 *  - `voiced-escalation`  — CP2. The user asked for a write; the voice phrased
 *                           the platform's `not_executable` refusal. The
 *                           refusal clause is identical in every voice.
 *  - `voiced-degradation` — CP2. No LLM provider is configured; the voice
 *                           phrased that fact.
 *  - `voiced-experience`  — CP2. A non-turn Companion surface (the panel's
 *                           empty-state greeting + invitation) was voiced.
 *  - `not-voiced`         — no Behaviour Engine transform ran for this
 *                           interaction. Recorded honestly rather than implied:
 *                           the interaction still produced words, but they were
 *                           platform-owned copy, not registry content.
 *
 * `not-voiced` is RETAINED although CP2 leaves no gateway path that emits it.
 * It is the mechanism by which INT21 §10's "any voiced surface presented as
 * voiced when no transform ran — stop" stays enforceable: a future surface that
 * speaks without the engine must say so. Its count falling to zero is the
 * measurement that CP2 closed the debt — deleting the value would have hidden
 * the debt rather than paid it.
 */
export const BEHAVIOUR_OUTCOMES = [
  "voiced",
  "voiced-fallback",
  "voiced-error",
  "voiced-escalation",
  "voiced-degradation",
  "voiced-experience",
  "not-voiced",
] as const;

export type BehaviourOutcome = (typeof BEHAVIOUR_OUTCOMES)[number];

/**
 * Why the applied voice differs from the requested one — i.e. why the engine's
 * fail-safe default (INT21 §4.1: "there is no error state at the voice seam")
 * fired.
 *
 * CP2 CORRECTION: this comment used to claim `none` was "the overwhelmingly
 * common case" because `companionPersonality` is a `notNull` column defaulting
 * to `'companion'`. The COLUMN was — but it was never declared in
 * `shared/schema.ts`, so Drizzle omitted it from every SELECT and the gateway
 * read `undefined` on every turn. Until CP2, `no-stored-preference` fired for
 * 100% of interactions and `confidence` was 0 for 100% of interactions. With
 * the column declared and a Settings selector shipped, `none` is now genuinely
 * the common case — which is exactly what the recorded telemetry should show.
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
  if (surfaces.includes("escalation-voicing")) {
    reasoning.push(
      "Voiced the read-only write refusal in this personality's register. " +
        "That the utterance was a write, and that the platform refuses it, remain conversation-gateway.ts's " +
        "detectWriteIntent — unchanged; the refusal clause itself is identical in all six voices.",
    );
  }
  if (surfaces.includes("degradation-voicing")) {
    reasoning.push(
      "Voiced the provider-unavailable degradation in this personality's register. " +
        "Whether a provider is configured is llm-provider.ts's; this engine only phrased the answer.",
    );
  }
  if (surfaces.includes("greeting-voicing")) {
    reasoning.push(
      "Voiced the Companion panel's empty-state greeting and invitation from the Personality Registry. " +
        "Day-seeded template choice only — no fact about the household was read, inserted, or implied.",
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
  /** CP2 — the now-live experience surface, so the Workbench shows a voice as the user meets it. */
  readonly invitation: string;
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
      invitation: p.experience.invitation,
    };
  });
}
