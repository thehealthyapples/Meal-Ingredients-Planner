/**
 * Intent Spellcheck (COMP_SC1) — deterministic, pre-AI typo correction for the
 * words the pattern resolver's own regexes depend on (verbs like "boost", and
 * health-benefit/nutrient vocabulary like "immune", "digestion", "sleep").
 *
 * WHY THIS EXISTS: a single mistyped word ("boot" for "boost") can make every
 * regex in pattern-intent-resolver.ts miss an utterance entirely, and because
 * a LOWER-confidence matcher often still fires with a malformed parameter, the
 * resolver reports a "routed" (not "unknown") result — which means the bounded
 * LLM fallback (hybrid-intent-resolver.ts) never gets a chance to help either.
 * Patching each typo into a regex one at a time doesn't scale. This is the
 * same fix MS Word / classic spellcheckers used for decades: edit-distance
 * against a known, bounded vocabulary — cheap, offline, no model call.
 *
 * THIS IS NOT THE FOOD SPELLCHECKER. `shared/food-synonyms.ts` already does
 * exactly this for ingredient names (`conservativeSpellCorrectWith`), tuned
 * and proven against FOOD_TERM_DICTIONARY. Reusing it here would mean either
 * loosening its threshold (risking a wrong food substituted into a recipe
 * elsewhere) or leaving it too strict to catch common verb typos. This module
 * is a sibling with its OWN small vocabulary and its OWN, slightly more
 * permissive threshold — mis-firing here costs nothing worse than "the
 * sentence reads a little differently before pattern-matching runs"; the
 * existing matchers and fallbacks are the safety net either way.
 *
 * HARD BOUNDARIES:
 *   - Deterministic only. No AI/LLM call, no network.
 *   - Whole-word correction only, never partial/substring rewriting.
 *   - Same-first-letter + unique-best-match guards (mirrors the food
 *     corrector's own anti-false-positive rules) — ambiguous or weak matches
 *     are left exactly as typed.
 *   - Vocabulary is SMALL and SPECIFIC (intent verbs + the real benefit/
 *     nutrient names this app ships), not a general English dictionary — the
 *     risk of "correcting" an unrelated real word stays low by construction.
 */

import { levenshtein } from "@shared/food-synonyms";
import { HEALTH_BENEFIT_SEED } from "@shared/knowledge/health-benefits";
import { NUTRIENT_SEED } from "@shared/knowledge/nutrients";

// Verbs the benefit/nutrition matchers key off ("that will BOOST my...",
// "foods that HELP with...", "a meal to SUPPORT..."). Typos here are exactly
// what silently breaks a whole regex family (e.g. "boot" for "boost").
const INTENT_VERB_TERMS: readonly string[] = [
  "boost", "boosts", "boosting",
  "help", "helps", "helping",
  "support", "supports", "supporting",
  "strengthen", "strengthens",
  "improve", "improves", "improving",
  "aid", "aids",
  "increase", "increases",
  "immunity", "immune",
];

const MIN_CORRECT_LEN = 4;
const THRESHOLD = 0.8;
const TIE_EPSILON = 0.05;

function wordsFrom(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length >= MIN_CORRECT_LEN);
}

/** Intent-relevant vocabulary: the verbs above, plus every real benefit/nutrient name this app ships. */
const VOCABULARY: readonly string[] = Array.from(
  new Set<string>([
    ...INTENT_VERB_TERMS,
    ...HEALTH_BENEFIT_SEED.flatMap((b) => wordsFrom(b.name)),
    ...NUTRIENT_SEED.flatMap((n) => wordsFrom(n.name)),
  ]),
);

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/** Correct a single lowercase word against VOCABULARY, or return it unchanged. */
function correctWord(lowerWord: string): string {
  if (lowerWord.length < MIN_CORRECT_LEN) return lowerWord;
  if (VOCABULARY.includes(lowerWord)) return lowerWord;

  let best: string | null = null;
  let bestSim = 0;
  let runnerSim = 0;

  for (const candidate of VOCABULARY) {
    if (Math.abs(candidate.length - lowerWord.length) > 2) continue; // cheap prune
    const s = similarity(lowerWord, candidate);
    if (s > bestSim) {
      runnerSim = bestSim;
      bestSim = s;
      best = candidate;
    } else if (s > runnerSim) {
      runnerSim = s;
    }
  }

  if (!best || bestSim < THRESHOLD) return lowerWord;
  if (runnerSim >= THRESHOLD && bestSim - runnerSim < TIE_EPSILON) return lowerWord; // ambiguous
  if (lowerWord[0] !== best[0]) return lowerWord; // cheap false-positive guard

  return best;
}

/**
 * Correct typos in an utterance's intent-relevant words BEFORE pattern
 * matching runs. Preserves everything else (casing of unmatched words,
 * punctuation, spacing) — only a confidently, uniquely corrected word is
 * ever replaced, and always with its own lowercase vocabulary form (the
 * matchers downstream lowercase anyway).
 */
export function correctUtteranceForIntentMatching(utterance: string): string {
  return utterance.replace(/[A-Za-z]+/g, (word) => {
    const corrected = correctWord(word.toLowerCase());
    return corrected === word.toLowerCase() ? word : corrected;
  });
}
