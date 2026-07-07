/**
 * judge.ts — INTQ4 pinned judge tier (SCORING_FRAMEWORK §5)
 * =========================================================
 * The judge is a GRADER, not a participant: it never talks to the Companion,
 * cannot change a deterministic gate, and is pinned (model id + frozen prompt) so
 * "the judge changed" is a MAJOR bundle bump, never invisible score drift.
 *
 * INTQ4 ships the judge INTERFACE and a disabled default. Wiring a live,
 * temperature-0 `claude-opus-4-8` judge is a configuration step (an Anthropic
 * client for the pinned model); until it is wired, runs execute deterministic-only
 * and are HONESTLY stamped `judge.invoked = false`. This is the framework's own
 * discipline — deterministic-first, and never silently default a judge score
 * (SCORING_FRAMEWORK §2.2).
 */

import type { DimensionKey } from "./types.js";
import type { CapturedTurn } from "./scorer.js";
import type { ExpectationRecord } from "./expectations.js";

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
 * Resolve the judge for a run. Today this always returns the disabled judge; the
 * seam exists so a future config can supply a pinned Anthropic client without
 * touching the runner. Never returns an unpinned or non-temperature-0 judge.
 */
export function resolveJudge(): JudgeClient {
  return disabledJudge;
}
