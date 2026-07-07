/**
 * select.ts — INTQ4 question selection per benchmark mode
 * ========================================================
 * The three depths the platform supports (README / INTQ4 scope):
 *   - Quick        : one representative question per canonical domain (10) — a fast
 *                    pre-merge sanity sweep across the whole capability surface.
 *   - Full         : all 100 canonical questions — the authoritative measurement.
 *   - Certification: the full set, but executed under the STRICT preconditions
 *                    (deterministic-household seeding + pinned judge). INTQ4 ships
 *                    this as FRAMEWORK ONLY — the runner returns a framework-only
 *                    artefact describing the preconditions, never a partial score.
 *
 * Selection preserves canonical id order (EXECUTION_PROCESS §5 "Fixed order").
 */

import type { BenchmarkMode } from "./types.js";
import type { QuestionsFixture } from "./bundle.js";

export function selectQuestions(
  fixture: QuestionsFixture,
  mode: BenchmarkMode,
): QuestionsFixture["questions"] {
  const all = fixture.questions;
  if (mode === "quick") {
    // First question of each canonical domain, in canonical order.
    const seen = new Set<string>();
    const picked: QuestionsFixture["questions"] = [];
    for (const q of all) {
      if (!seen.has(q.category)) {
        seen.add(q.category);
        picked.push(q);
      }
    }
    return picked;
  }
  // full and certification both span all 100 (certification is gated elsewhere).
  return all;
}
