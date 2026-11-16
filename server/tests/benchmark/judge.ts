/**
 * judge.ts — INTQ4 pinned judge tier (SCORING_FRAMEWORK §5) · JUDGE_LIVE1
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
 */

import type { DimensionKey } from "./types.js";
import type { CapturedTurn } from "./scorer.js";
import { DIMENSION_NAMES } from "./scorer.js";
import type { ExpectationRecord } from "./expectations.js";
import { JUDGE_PROMPT_TEMPLATE } from "./bundle.js";

export interface JudgeVerdict {
  readonly band: number;      // 0–4
  readonly rationale: string;
}

export interface JudgeClient {
  readonly enabled: boolean;
  /** Grade one judge-owned dimension of one turn, or null to defer to deterministic. */
  score(
    dimension: DimensionKey,
    exp: ExpectationRecord,
    turn: CapturedTurn,
  ): Promise<JudgeVerdict | null>;
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
  ): Promise<JudgeVerdict | null> {
    try {
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const userMessage = JSON.stringify({
        dimension: { key: dimension, name: DIMENSION_NAMES[dimension] },
        question: {
          utterance: exp.utterance,
          correctAnswerType: exp.correctAnswerType,
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
      });

      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
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
