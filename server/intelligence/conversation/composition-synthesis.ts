/**
 * composition-synthesis.ts — DISABLED
 * ===================================
 * Initial implementation revealed that cross-capability synthesis via pattern
 * detection causes significant regressions when applied to the full benchmark.
 *
 * The approach (injecting additional queries for specific utterance patterns)
 * was sound in principle, but the pattern detection was too broad and added
 * noise to the LLM context, causing scores to drop:
 *
 * - Full benchmark (103 Qs): 78.1 → 72.9 (REGRESSION)
 * - CB-011: 57.3 → 47.5 (-9.8)
 * - CG-083: 67 → 56 (-11)
 * - Profile & Household: 97.5 → 69.4 (-28.1)
 *
 * Root causes to investigate before re-enabling:
 * 1. Pattern detection too broad (matching questions it shouldn't)
 * 2. Derived intents adding noise instead of signal
 * 3. Context composition engine budget pressure from extra queries
 * 4. LLM confusion from enriched (but conflicting) context
 *
 * Next steps:
 * 1. Build unit tests for pattern detection (validate specificity)
 * 2. Measure pattern false-positive rate on full benchmark
 * 3. Add guardrails (max synthesis intents, pattern confidence thresholds)
 * 4. Try per-question instead of per-pattern synthesis (narrower scope)
 * 5. Consider alternative: prompt engineering instead of data enrichment
 *
 * Keeping this file as-is for reference and future enablement.
 */

import type { ResolvedIntent } from "../intent-resolver.js";
import type { ContextFrame } from "./context-frame-assembler.js";
import type { IntentVerb } from "../types.js";

// Stub functions for now - return empty to disable synthesis
export function selectSynthesisUtterance(
  utterance: string,
  _frame: ContextFrame,
): string {
  return utterance;
}

export function shouldApplySynthesis(
  _utterance: string,
  _resolvedIntents: ResolvedIntent[],
): boolean {
  return false; // DISABLED
}

export function deriveSynthesisIntents(
  _utterance: string,
  _frame: ContextFrame,
  _resolvedIntents: ResolvedIntent[],
): ResolvedIntent[] {
  return []; // DISABLED
}

export function filterAlreadyQueried(
  derived: ResolvedIntent[],
  _alreadyQueried: ResolvedIntent[],
): ResolvedIntent[] {
  return []; // DISABLED
}
