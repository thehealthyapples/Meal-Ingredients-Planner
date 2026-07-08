/**
 * INT17 — Intent Relevance
 * ========================
 *
 * Deterministic, lexical, capability-agnostic scoring of evidence against the
 * user's intent. Pure functions, no I/O, no LLM, no business knowledge.
 *
 * WHAT THIS KNOWS, AND WHAT IT MUST NEVER KNOW
 * --------------------------------------------
 * It knows three things, all of them already computed by an owner upstream:
 *
 *   1. Which capability the Intent Resolver chose, and with what confidence.
 *   2. Whether that capability was routed FROM THE UTTERANCE, or injected as a
 *      surface `baseline` read the user never asked for.
 *   3. Which of the utterance's content words appear in a field's name or value.
 *
 * It does NOT know that "keto" is a diet, that "vitamin K" is a nutrient, or that
 * an empty planner day is an opportunity. Every such judgement stays with the
 * capability that owns it. This module can only ORDER evidence the capability
 * already produced and already ranked; the capability's own order is the
 * tiebreak, so its judgement survives whenever relevance cannot separate two
 * items.
 *
 * WHY LEXICAL AND NOT SEMANTIC
 * ----------------------------
 * An embedding would be a second, non-deterministic, network-bound reasoning
 * engine sitting between the platform and the model — exactly the thing the
 * Intelligence Platform's non-negotiables forbid. Relevance here is a *budget
 * allocation rule*, not an answer. When it is wrong, the cost is that a less
 * useful field wins a few tokens; the constraint fields are pinned and cannot be
 * outbid, and every omission is declared to the model.
 */

/**
 * Words that carry no intent. Kept deliberately small: an over-eager stoplist
 * silently deletes the signal ("what DIET am I following" → "diet" must survive).
 */
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "of", "at", "by", "for", "with",
  "about", "into", "to", "from", "in", "on", "is", "are", "was", "were", "be",
  "been", "being", "do", "does", "did", "have", "has", "had", "can", "could",
  "should", "would", "will", "shall", "may", "might", "must", "i", "me", "my",
  "mine", "we", "us", "our", "you", "your", "it", "its", "this", "that", "these",
  "those", "there", "here", "what", "which", "who", "whom", "how", "when",
  "where", "why", "any", "some", "all", "no", "not", "so", "than", "then",
  "too", "very", "just", "now", "get", "got", "make", "made", "help", "show",
  "tell", "give", "want", "need", "like", "please", "am", "s", "t",
]);

/**
 * Fold a word to a crude stem so `meals` matches `meal` and `boosts` matches
 * `boost`. Deliberately NOT a real stemmer: a real one is a dependency, a
 * language assumption, and a source of surprising collisions. This handles the
 * only inflection English content words reliably carry in a search phrase.
 */
function stem(word: string): string {
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && word.endsWith("es") && !word.endsWith("ses")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

/** Lowercase content-word stems, deduplicated, order-independent. */
export function contentTokens(text: string): Set<string> {
  const out = new Set<string>();
  for (const raw of text.toLowerCase().split(/[^a-z0-9]+/)) {
    if (raw.length < 3) continue;
    if (STOPWORDS.has(raw)) continue;
    out.add(stem(raw));
  }
  return out;
}

/** `dietPattern` → `diet pattern`; `preferences.dietTypes` → `preferences diet types`. */
export function fieldNameTokens(path: string): Set<string> {
  const spaced = path.replace(/[._]/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return contentTokens(spaced);
}

function overlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let n = 0;
  // `Array.from` rather than `for…of` over the Set: this tree targets pre-ES2015
  // iteration (`--downlevelIteration` is off), and the rest of the platform does
  // the same (`conversation-gateway.ts`, `knowledge-assembly.ts`).
  for (const t of Array.from(a)) if (b.has(t)) n++;
  return n;
}

// ---------------------------------------------------------------------------
// Weights
// ---------------------------------------------------------------------------

/**
 * A capability the RESOLVER matched from the utterance outranks every surface
 * `baseline` read, regardless of lexical accident. This is the single most
 * load-bearing weight in the engine: 85 of the benchmark's 100 prompts carry a
 * baseline `profile:read` the user never asked for, and it is 50.4% of all
 * CONTEXT DATA bytes the platform emits.
 *
 * It does not delete the baseline. It outranks it — the baseline's pinned
 * constraint fields still reach the model, and the balance guarantee still gives
 * it a seat.
 */
const ROUTED_TIER = 10;

/** A field whose NAME the user spoke ("what DIET…" → `dietPattern`). The strongest field signal. */
const NAME_MATCH = 3;
/** A field whose VALUE the user spoke ("am I on KETO?" → `dietPattern: "Keto"`). */
const VALUE_MATCH = 2;

/** Score of the capability itself, before any field or item is considered. */
export function capabilityRelevance(confidence: number, baseline: boolean): number {
  const tier = baseline ? 0 : ROUTED_TIER;
  const conf = Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0;
  return tier + conf;
}

/**
 * Score one leaf field against the utterance.
 *
 * A value match is worth less than a name match because values are long and
 * collide by accident; a field NAMED for what was asked is almost always the
 * field that answers it.
 */
export function fieldRelevance(path: string, value: unknown, utterance: Set<string>): number {
  const name = overlap(fieldNameTokens(path), utterance);
  const valueScore = overlap(contentTokens(stringContent(value)), utterance);
  return name * NAME_MATCH + Math.min(valueScore, 3) * VALUE_MATCH;
}

/**
 * Every string reachable in a value, to a bounded depth.
 *
 * Bounded rather than exhaustive because a leaf here can be an array of objects —
 * `profile.customMetricDefs` is `[{ name: "Sun salutations", unit: "count" }]`, and
 * a question about sun salutations must be able to find it. Depth 4 reaches that
 * without walking a 611-food registry for every field.
 */
function stringContent(value: unknown, depth = 0): string {
  if (depth > 4) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(v => stringContent(v, depth + 1)).join(" ");
  if (value !== null && typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map(v => stringContent(v, depth + 1)).join(" ");
  }
  return "";
}

/** Score one piece of evidence against the utterance, over all its string content. */
export function evidenceRelevance(text: string, utterance: Set<string>): number {
  return Math.min(overlap(contentTokens(text), utterance), 4) * VALUE_MATCH;
}
