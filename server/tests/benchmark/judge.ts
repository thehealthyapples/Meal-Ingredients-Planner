/**
 * judge.ts — INTQ4 pinned judge tier (SCORING_FRAMEWORK §5) · JUDGE_LIVE1-3
 * =========================================================================
 * The judge is a GRADER, not a participant: it never talks to the Companion,
 * cannot change a deterministic gate, and is pinned (model id + frozen prompt) so
 * "the judge changed" is a MAJOR bundle bump, never invisible score drift.
 *
 * INTQ4 shipped the judge INTERFACE with a disabled default: no ANTHROPIC_API_KEY
 * ever existed in this environment, and the originally-specified `claude-opus-4-8`
 * pin predates the current model lineup — it was never a real, callable model here.
 * JUDGE_LIVE1 (2026-11-16, user-approved) wires a live judge using the ALREADY
 * CONFIGURED OpenAI credential (gpt-4o-mini — the same provider the Companion's own
 * conversational fallback uses, server/intelligence/conversation/llm-provider.ts)
 * rather than leave the judge tier dark indefinitely. This is a deliberate provider
 * substitution, not a silent default: see bundle.ts's JUDGE_MODEL/JUDGE_VERSION for
 * the MAJOR bump this required.
 *
 * JUDGE_LIVE2 rewrote the prompt with real per-dimension band definitions after
 * live-reproducing a case where gpt-4o-mini quoted the turn back as its own
 * "rationale" instead of explaining a verdict.
 *
 * JUDGE_LIVE3 (2026-11-17) threads in `groundTruth` (ground-truth.ts): verifying
 * this rewrite exposed a deeper gap — the judge was asked to grade "is this true
 * against the household's data" while being given no data, so a correct, specific
 * claim ("You are following a Keto diet pattern") was indistinguishable from a
 * fabrication and reproducibly scored 0. The household's own real data is now
 * resolved once per run and passed to every judge call so D1/D5 can actually check.
 *
 * JUDGE_LIVE4 (2026-11-17) tiers the model by question complexity, user-requested
 * after a real run showed the OPPOSITE problem: with ground truth live, PH-001
 * (a single profile field) scored a clean 4/4/4, but SH-035 — "what's on my
 * shopping list" — still scored D1/D2=0 even though the real items WERE present
 * in the data gpt-4o-mini was given, because a 60-item array is too much for that
 * model to reliably cross-reference. Rather than accept that ceiling or guess at
 * a prompt tweak, questions whose intended capability needs list/data
 * cross-referencing (anything outside `SIMPLE_CAPABILITY_FAMILIES`) now use a
 * stronger model (`COMPLEX_JUDGE_MODEL`). The split is a mechanical lookup on
 * `exp.capabilityFamily` — never a second LLM call deciding which model to use —
 * so the routing itself stays deterministic and auditable. See bundle.ts's
 * JUDGE_MODEL/JUDGE_VERSION for how this is reflected in run provenance.
 */

import type { DimensionKey } from "./types.js";
import type { CapturedTurn } from "./scorer.js";
import { DIMENSION_NAMES } from "./scorer.js";
import type { ExpectationRecord } from "./expectations.js";
import { JUDGE_PROMPT_TEMPLATE } from "./bundle.js";
import type { HouseholdGroundTruth } from "./ground-truth.js";

export interface JudgeVerdict {
  readonly band: number;      // 0–4
  readonly rationale: string;
}

export interface JudgeClient {
  readonly enabled: boolean;
  /**
   * Grade one judge-owned dimension of one turn, or null to defer to deterministic.
   * `groundTruth` (JUDGE_LIVE3) is the acting household's own real data, resolved
   * once per run — without it the judge has no way to verify a specific factual
   * claim and reproducibly misreads a correct answer as a fabrication. Optional so
   * a caller that cannot resolve a household (benchmark-world, certification) can
   * still use the judge; D1 verification is simply weaker in that case.
   */
  score(
    dimension: DimensionKey,
    exp: ExpectationRecord,
    turn: CapturedTurn,
    groundTruth?: HouseholdGroundTruth | null,
  ): Promise<JudgeVerdict | null>;
}

/**
 * JUDGE_LIVE4 — the cheap model's reliable ceiling: a single scalar/object fact
 * (a diet pattern, a household member list) it can verify fine. A list of many
 * independent items a claim must be checked against (shopping list, pantry,
 * cookbook, diary, planner) is where it reproducibly fails to find a real match.
 * Keyed by `capabilityFamily` (expectations.ts) — the SAME normalised family the
 * routing/capability scoring already uses, not a new classification.
 */
const SIMPLE_CAPABILITY_FAMILIES: ReadonlySet<string> = new Set(["profile", "household"]);

const SIMPLE_JUDGE_MODEL = "gpt-6-luna";
const COMPLEX_JUDGE_MODEL = "gpt-6.1-terra";

/** Mechanical, deterministic model pick — never an LLM call. */
function selectJudgeModel(exp: ExpectationRecord): string {
  return SIMPLE_CAPABILITY_FAMILIES.has(exp.capabilityFamily) ? SIMPLE_JUDGE_MODEL : COMPLEX_JUDGE_MODEL;
}

/** The default, disabled judge — deterministic-only scoring. */
export const disabledJudge: JudgeClient = {
  enabled: false,
  async score() {
    return null;
  },
};

/**
 * JUDGE_LIVE6 cost control — which `HouseholdGroundTruth` sections are actually
 * relevant to a given capability family. Every judge call used to ship the WHOLE
 * household snapshot (cookbook + shopping + pantry + diary + planner), even when
 * grading, say, a shopping-list question's D1 — paying for pantry/diary/cookbook
 * tokens the judge never needed to check anything. Unmapped families fall back to
 * "include everything" (the old behaviour) so an unrecognised capability is never
 * silently under-scoped — this is a cost optimisation, never a correctness one.
 */
const GROUND_TRUTH_SECTIONS_BY_FAMILY: Readonly<Record<string, readonly string[]>> = {
  meals: ["cookbook"],
  "meal-discovery": ["cookbook"],
  shopping: ["shopping"],
  "shopping-discovery": ["shopping"],
  pantry: ["pantry"],
  "pantry-discovery": ["pantry"],
  diary: ["diary"],
  "diary-discovery": ["diary"],
  planner: ["planner"],
  "planner-discovery": ["planner"],
  profile: ["dietary"],
  household: ["dietary"],
  "household-discovery": ["dietary"],
};

/**
 * Trim `groundTruth` to only the sections the question's own capability family
 * (+ any compound secondary families) could plausibly need, dropping the rest.
 * D6 (Voice & Companion Tone) needs none of it — the prompt itself says voice
 * is about HOW, never WHAT, so household data never enters that grading — and
 * this returns null outright for that dimension.
 */
function scopeGroundTruth(
  dimension: DimensionKey,
  exp: ExpectationRecord,
  groundTruth: HouseholdGroundTruth | null | undefined,
): HouseholdGroundTruth | null {
  if (!groundTruth) return null;
  if (dimension === "D6") return null;

  const families = [exp.capabilityFamily, ...exp.secondaryCapabilityFamilies];
  const sections = new Set<string>();
  let anyMapped = false;
  for (const fam of families) {
    const mapped = GROUND_TRUTH_SECTIONS_BY_FAMILY[fam];
    if (mapped) {
      anyMapped = true;
      for (const s of mapped) sections.add(s);
    }
  }
  if (!anyMapped) return groundTruth; // unrecognised family — safe default, send everything

  return {
    requesterUserId: groundTruth.requesterUserId,
    todayDate: groundTruth.todayDate,
    dietary: sections.has("dietary") ? groundTruth.dietary : null,
    cookbookMealTotal: sections.has("cookbook") ? groundTruth.cookbookMealTotal : 0,
    ownCookbookMealTotal: sections.has("cookbook") ? groundTruth.ownCookbookMealTotal : 0,
    systemCookbookMealTotal: sections.has("cookbook") ? groundTruth.systemCookbookMealTotal : 0,
    cookbookMeals: sections.has("cookbook") ? groundTruth.cookbookMeals : [],
    shoppingListTotal: sections.has("shopping") ? groundTruth.shoppingListTotal : 0,
    shoppingList: sections.has("shopping") ? groundTruth.shoppingList : [],
    pantryItemTotal: sections.has("pantry") ? groundTruth.pantryItemTotal : 0,
    pantryItems: sections.has("pantry") ? groundTruth.pantryItems : [],
    recentDiaryEntryTotal: sections.has("diary") ? groundTruth.recentDiaryEntryTotal : 0,
    recentDiaryEntries: sections.has("diary") ? groundTruth.recentDiaryEntries : [],
    plannerThisWeek: sections.has("planner") ? groundTruth.plannerThisWeek : [],
  };
}

/**
 * Live judge tier backed by the OpenAI provider. Grades exactly one judge-owned
 * dimension per call, using ONLY the frozen JUDGE_PROMPT_TEMPLATE as the system
 * message (never altered per-call — that is what "pinned prompt" means) and a
 * minimal JSON user message carrying the question's expectation record and the
 * captured turn, matching the prompt's own claim of what the judge is given.
 *
 * A parse failure, a malformed band, or a provider error all return `null` —
 * deferring to the conservative deterministic band — rather than ever fabricating
 * a verdict. SCORING_FRAMEWORK §2.2 forbids silently defaulting a judge score; a
 * failed judge call is "judge tier unavailable for this question", not a 0 or a 4.
 */
class OpenAiJudge implements JudgeClient {
  readonly enabled = true;

  async score(
    dimension: DimensionKey,
    exp: ExpectationRecord,
    turn: CapturedTurn,
    groundTruth?: HouseholdGroundTruth | null,
  ): Promise<JudgeVerdict | null> {
    try {
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // JUDGE_LIVE6 — household/question/turn come FIRST and are byte-identical across
      // the ~3 judge-owned-dimension calls (D1/D2/D5) made for this same question; only
      // `dimension` (last) varies between them. That ordering lets the provider's
      // automatic prompt-caching match the shared prefix instead of re-charging full
      // price for the same household data on every one of a question's dimension calls.
      const userMessage = JSON.stringify({
        // JUDGE_LIVE3 — the household's own real stored data, so D1/D5 can actually
        // verify a claim instead of guessing. null/absent only when it could not be
        // resolved (e.g. no live household for this run) — never fabricated.
        // JUDGE_LIVE6 — trimmed to only the sections this question's own capability
        // family could need (cost control; see scopeGroundTruth's own doc).
        household: scopeGroundTruth(dimension, exp, groundTruth),
        question: {
          utterance: exp.utterance,
          // JUDGE_LIVE3 — "unknown" is the deterministic classifier's OWN "could not
          // categorise this" value (93 of 100 real questions carry it) — a limitation
          // of the classifier, not a claim that the household's fact is unknown. Omit
          // it entirely rather than hand the model a field literally named
          // "correctAnswerType" with the value "unknown" next to a specific factual
          // claim: live-tested, that combination reliably reads as "the turn invented
          // a fact that should have been a gap" even when the turn was correct.
          ...(exp.correctAnswerType !== "unknown" ? { expectedAnswerShape: exp.correctAnswerType } : {}),
          evidenceExpected: exp.evidenceExpected,
          trustConcern: exp.trustConcern,
          isSafetyBoundary: exp.isSafetyBoundary,
        },
        turn: {
          text: turn.text,
          entityRefCount: turn.entityRefCount,
          outcomeStatus: turn.outcomeStatus,
          reachedCapability: turn.reachedCapability,
          fallbackState: turn.fallbackState,
          error: turn.error,
        },
        dimension: { key: dimension, name: DIMENSION_NAMES[dimension] },
      });

      const model = selectJudgeModel(exp);
      // JUDGE_LIVE6 — live-caught on gpt-6.1-terra: it rejected BOTH `max_tokens`
      // ("Unsupported parameter... Use 'max_completion_tokens' instead") AND
      // `temperature: 0` ("does not support 0 with this model. Only the default
      // (1) value is supported") — the exact same two quirks previously assumed to
      // be Luna-specific. Both are now sent unconditionally for every model, since
      // this whole model generation (the gpt-5.6/6.x family in bundle.ts's
      // pricing-derived lineup) appears to share both requirements, not just Luna.
      const completion = await client.chat.completions.create({
        model,
        temperature: 1,
        // Live-caught across two full-suite runs: terra truncated 3-4 times at 300
        // ("max_tokens or model output limit was reached") — it shares Luna's hidden
        // reasoning-token overhead, just less often. Matching Luna's 400 outright:
        // the cost difference is trivial (a few hundred tokens at terra's per-token
        // rate) against the reliability cost of a failed judge call defaulting to
        // the conservative deterministic band.
        max_completion_tokens: 400,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: JUDGE_PROMPT_TEMPLATE },
          { role: "user", content: userMessage },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) return null;

      const parsed = JSON.parse(raw) as { band?: unknown; rationale?: unknown };
      const band = Number(parsed.band);
      if (!Number.isInteger(band) || band < 0 || band > 4) return null;

      return {
        band,
        rationale: typeof parsed.rationale === "string" ? parsed.rationale : "",
      };
    } catch (err) {
      console.error(`[benchmark judge] score() failed for ${dimension} on "${exp.id}":`, err);
      return null;
    }
  }
}

const openAiJudge: JudgeClient = new OpenAiJudge();

/**
 * Resolve the judge for a run. Returns the live OpenAI-backed judge when
 * OPENAI_API_KEY is configured, otherwise the disabled judge — a run never
 * silently claims a judge tier it cannot actually reach.
 */
export function resolveJudge(): JudgeClient {
  if (process.env.OPENAI_API_KEY) {
    return openAiJudge;
  }
  return disabledJudge;
}
