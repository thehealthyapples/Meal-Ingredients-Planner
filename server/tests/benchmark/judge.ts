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

const SIMPLE_JUDGE_MODEL = "gpt-4o-mini";
const COMPLEX_JUDGE_MODEL = "gpt-6-luna";

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

      const userMessage = JSON.stringify({
        dimension: { key: dimension, name: DIMENSION_NAMES[dimension] },
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
        // JUDGE_LIVE3 — the household's own real stored data, so D1/D5 can actually
        // verify a claim instead of guessing. null/absent only when it could not be
        // resolved (e.g. no live household for this run) — never fabricated.
        household: groundTruth ?? null,
      });

      const model = selectJudgeModel(exp);
      const completion = await client.chat.completions.create({
        model,
        temperature: 0,
        max_tokens: 200,
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
