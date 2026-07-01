/**
 * PatternIntentResolver — regex/heuristic strategy (INT24)
 * =========================================================
 * First concrete implementation of IIntentResolver. Uses compiled regular
 * expressions to map user utterances to typed intents.
 *
 * Properties: zero external dependencies, zero latency, fully deterministic,
 * fully unit-testable. Coverage is intentionally specific to known patterns;
 * low-recall cases fall through to keyword fallbacks at lower confidence.
 *
 * Resolution pipeline per call (INT23 §10 routing table):
 *   1. Specific pattern rules  — entity extraction, confidence 0.80–0.92
 *   2. Surface-primary rule    — surface → primary capability, confidence 0.65
 *   3. Keyword fallbacks       — vocabulary scan, confidence 0.55–0.65
 *   4. Profile always-on       — confidence 0.50 (personalisation context)
 *   5. Deduplicate by capability (keep highest confidence per capability)
 *   6. Sort descending, cap at MAX_INTENTS = 4
 *
 * HARD BOUNDARIES (inherited from IIntentResolver):
 *  • No storage reads, no platform calls, no business logic.
 *  • No nutrition facts, no planner data, no food knowledge of its own.
 *  • Entity terms are extracted and normalised to slug candidates; the handler
 *    validates whether they exist and returns an honest gap when they do not.
 */

import type { IIntentResolver, IntentResolutionHints, ResolvedIntent } from "./intent-resolver.js";
import type { ConversationSurface } from "./conversation/conversation-store.js";

// Maximum intents returned per turn (INT18 per-turn latency budget).
const MAX_INTENTS = 4;

// ---------------------------------------------------------------------------
// Entity normalisation
// ---------------------------------------------------------------------------

/**
 * Normalise a free-text entity term to a slug candidate.
 * Lowercase, hyphenate spaces, strip non-alphanumeric. Best-effort — the
 * handler returns an honest gap when the resulting slug has no registry entry.
 */
function toSlug(raw: string): string {
  return raw.trim().toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Surface → primary capability map  (mirrors INT18 SURFACE_CAP)
// ---------------------------------------------------------------------------

const SURFACE_CAP: Partial<Record<ConversationSurface, string>> = {
  planner:   "planner",
  shopping:  "shopping",
  nutrition: "nutrition-knowledge",
  pantry:    "pantry",
  diary:     "diary",
  household: "household",
  meals:     "meals",
  templates: "templates",
  partners:  "partners",
  analyser:  "analyser",
};

// ---------------------------------------------------------------------------
// Matcher type
// ---------------------------------------------------------------------------

type Matcher = (
  utterance: string,
  lower: string,
  hints: IntentResolutionHints,
) => ResolvedIntent | null;

// ---------------------------------------------------------------------------
// Nutrition: food-benefit explanation (verb: explain)
// ---------------------------------------------------------------------------

function foodExplain(entity: string, confidence = 0.90): ResolvedIntent | null {
  const slug = toSlug(entity);
  if (!slug) return null;
  return {
    capability: "nutrition-knowledge",
    verb: "explain",
    parameters: { foodSlug: slug },
    confidence,
  };
}

const NUTRITION_EXPLAIN_MATCHERS: Matcher[] = [
  // "what is broccoli good for?" / "what are almonds good for?"
  (u) => {
    const m = u.match(/\bwhat\s+(?:is|are)\s+(.+?)\s+(?:good|great|useful|helpful|beneficial)\s+for\b/i);
    return m?.[1] ? foodExplain(m[1]) : null;
  },

  // "what are the benefits of broccoli?" / "what are broccoli's benefits?"
  (u) => {
    const m = u.match(/\bwhat\s+(?:are\s+)?(?:the\s+)?benefits?\s+of\s+(.+?)[\?.]?\s*$/i);
    return m?.[1] ? foodExplain(m[1]) : null;
  },

  // "benefits of kale" / "health benefits of spinach"
  (u) => {
    const m = u.match(/\b(?:health\s+)?benefits?\s+of\s+(.+?)[\?.]?\s*$/i);
    return m?.[1] ? foodExplain(m[1], 0.88) : null;
  },

  // "is broccoli good for me?" / "is salmon good for you?"
  (u) => {
    const m = u.match(/\bis\s+(.+?)\s+(?:good|healthy|beneficial)\s+for\b/i);
    if (!m?.[1]) return null;
    const entity = m[1].trim();
    if (/^(?:it|that|this|which|the)$/i.test(entity)) return null;
    return foodExplain(entity, 0.86);
  },

  // "why is broccoli healthy?" / "why are oats nutritious?"
  (u) => {
    const m = u.match(/\bwhy\s+(?:is|are)\s+(.+?)\s+(?:healthy|good|beneficial|nutritious)\b/i);
    return m?.[1] ? foodExplain(m[1], 0.85) : null;
  },

  // "what does broccoli do for your body?" / "what does kale do for you?"
  (u) => {
    const m = u.match(/\bwhat\s+does\s+(.+?)\s+do\s+for\b/i);
    return m?.[1] ? foodExplain(m[1], 0.84) : null;
  },
];

// ---------------------------------------------------------------------------
// Nutrition: benefit → foods (verb: search with termQuery)
// ---------------------------------------------------------------------------

function benefitSearch(entity: string, confidence = 0.86): ResolvedIntent | null {
  const q = entity.trim().toLowerCase();
  if (!q) return null;
  return {
    capability: "nutrition-knowledge",
    verb: "search",
    parameters: { query: q },
    confidence,
    termQuery: q,
  };
}

// Guard: reject terms that are clearly not health benefit concepts.
const NOT_A_BENEFIT = /^(?:dinner|lunch|breakfast|tea|supper|snack|tonight|today|tomorrow|me|you|myself|us|them)$/i;

const NUTRITION_BENEFIT_FOODS_MATCHERS: Matcher[] = [
  // "foods that help with sleep" / "foods that help with immunity"
  (u) => {
    const m = u.match(/\bfoods?\s+(?:that\s+)?(?:help|good|great)\s+(?:with|for)\s+(.+?)[\?.,]?\s*$/i);
    if (!m?.[1] || NOT_A_BENEFIT.test(m[1].trim())) return null;
    return benefitSearch(m[1], 0.88);
  },

  // "5 foods that help with sleep" / "top 10 foods that help with digestion"
  (u) => {
    const m = u.match(/\b(?:\d+|five|ten|top)\s+foods?\s+(?:that\s+)?(?:help|support|aid|boost)\s+(?:with\s+)?(.+?)[\?.,]?\s*$/i);
    if (!m?.[1] || NOT_A_BENEFIT.test(m[1].trim())) return null;
    return benefitSearch(m[1], 0.88);
  },

  // "tell me 5 foods that help with sleep"
  (u) => {
    const m = u.match(/\btell\s+me\s+(?:\d+|five|ten|some)\s+foods?\s+(?:that\s+)?(?:help|support|aid)\s+(?:with\s+)?(.+?)[\?.,]?\s*$/i);
    if (!m?.[1] || NOT_A_BENEFIT.test(m[1].trim())) return null;
    return benefitSearch(m[1], 0.88);
  },

  // "foods good for sleep" / "foods for better immunity"
  (u) => {
    const m = u.match(/\bfoods?\s+(?:good\s+)?for\s+(?:better\s+)?(.+?)[\?.,]?\s*$/i);
    if (!m?.[1] || NOT_A_BENEFIT.test(m[1].trim())) return null;
    return benefitSearch(m[1], 0.82);
  },

  // "what helps with sleep?" / "what aids digestion?"
  (u) => {
    const m = u.match(/\bwhat\s+(?:foods?\s+)?(?:helps?|aids?|supports?)\s+(?:with\s+)?(.+?)[\?.,]?\s*$/i);
    if (!m?.[1]) return null;
    const term = m[1].trim();
    if (/^(?:me|you|this|that|it|my)$/.test(term)) return null;
    if (NOT_A_BENEFIT.test(term)) return null;
    return benefitSearch(term, 0.80);
  },
];

// ---------------------------------------------------------------------------
// Nutrition: food detail read (verb: read, scope: food)
// ---------------------------------------------------------------------------

function foodRead(entity: string, confidence = 0.80): ResolvedIntent | null {
  const slug = toSlug(entity);
  if (!slug) return null;
  return {
    capability: "nutrition-knowledge",
    verb: "read",
    parameters: { scope: "food", slug },
    confidence,
  };
}

const NUTRITION_FOOD_DETAIL_MATCHERS: Matcher[] = [
  // "what nutrients does broccoli have?" / "what nutrients are in salmon?"
  (u) => {
    const m = u.match(/\bwhat\s+nutrients?\s+(?:does\s+(.+?)\s+have|(?:are|is)\s+(?:there\s+)?in\s+(.+?))[\?.]?\s*$/i);
    const entity = m?.[1] ?? m?.[2];
    return entity ? foodRead(entity, 0.84) : null;
  },

  // "nutrients in spinach" / "tell me about the nutrients in kale"
  (u) => {
    const m = u.match(/\bnutrients?\s+in\s+(.+?)[\?.]?\s*$/i);
    return m?.[1] ? foodRead(m[1], 0.82) : null;
  },

  // "nutritional value of broccoli" / "nutrition content of oats"
  (u) => {
    const m = u.match(/\bnutritional?\s+(?:value|content|profile|breakdown)?\s*(?:of|in)\s+(.+?)[\?.]?\s*$/i);
    return m?.[1] ? foodRead(m[1], 0.82) : null;
  },

  // "what's in broccoli nutritionally?"
  (u) => {
    const m = u.match(/\bwhat'?s?\s+in\s+(.+?)\s+nutritionally\b/i);
    return m?.[1] ? foodRead(m[1], 0.82) : null;
  },
];

// ---------------------------------------------------------------------------
// Planner
// ---------------------------------------------------------------------------

const PLANNER_MATCHERS: Matcher[] = [
  // "what meals do I have this week?" / "what's on my meal plan?"
  (u, _l, hints) => {
    if (!/\b(?:what(?:'s|\s+is)\s+on\s+(?:my\s+)?(?:meal\s+)?plan|what\s+meals?\s+do\s+I\s+have)\b/i.test(u)) return null;
    return {
      capability: "planner",
      verb: "read",
      parameters: hints.activePlannerWeekId != null
        ? { scope: "week", weekId: hints.activePlannerWeekId }
        : {},
      confidence: 0.85,
    };
  },

  // "show me my plan" / "my meal plan this week"
  (u, _l, hints) => {
    if (!/\b(?:show\s+(?:me\s+)?(?:my\s+)?(?:meal\s+)?plan|my\s+(?:meal\s+)?plan(?:\s+this\s+week)?)\b/i.test(u)) return null;
    return {
      capability: "planner",
      verb: "read",
      parameters: hints.activePlannerWeekId != null
        ? { scope: "week", weekId: hints.activePlannerWeekId }
        : {},
      confidence: 0.75,
    };
  },
];

// ---------------------------------------------------------------------------
// Shopping
// ---------------------------------------------------------------------------

const SHOPPING_MATCHERS: Matcher[] = [
  // "show me my shopping list" / "what's in my basket?"
  (u) => {
    if (!/\b(?:(?:show|what'?s?\s+(?:in|on))\s+(?:my\s+)?(?:shopping\s+list|basket|groceries)|my\s+shopping\s+list)\b/i.test(u)) return null;
    return {
      capability: "shopping",
      verb: "read",
      parameters: { scope: "list" },
      confidence: 0.85,
    };
  },
];

// ---------------------------------------------------------------------------
// Pantry
// ---------------------------------------------------------------------------

const PANTRY_MATCHERS: Matcher[] = [
  // "what's in my pantry?" / "what's in my fridge?"
  (u) => {
    if (!/\bwhat'?s?\s+in\s+(?:my\s+)?(?:pantry|fridge|freezer|larder|cupboard)\b/i.test(u)) return null;
    return {
      capability: "pantry",
      verb: "read",
      parameters: { scope: "list" },
      confidence: 0.85,
    };
  },

  // "my pantry items" / "fridge contents"
  (u) => {
    if (!/\b(?:(?:my\s+)?(?:pantry|fridge|freezer|larder|cupboard)\s+(?:stock|items?|contents?))\b/i.test(u)) return null;
    return {
      capability: "pantry",
      verb: "read",
      parameters: { scope: "list" },
      confidence: 0.78,
    };
  },
];

// ---------------------------------------------------------------------------
// Diary
// ---------------------------------------------------------------------------

const DIARY_MATCHERS: Matcher[] = [
  // "what did I eat today?" / "what have I had today?"
  (u, _l, hints) => {
    if (!/\bwhat\s+(?:did\s+I\s+(?:eat|have|log|track)|have\s+I\s+(?:eaten|had))\s*(?:today|yesterday|this\s+week)?\b/i.test(u)) return null;
    return {
      capability: "diary",
      verb: "read",
      parameters: { scope: "day", date: hints.temporalAnchor },
      confidence: 0.85,
    };
  },

  // "my food diary" / "show my diary"
  (u, _l, hints) => {
    if (!/\b(?:my\s+(?:food\s+)?diary|show\s+(?:my\s+)?diary)\b/i.test(u)) return null;
    return {
      capability: "diary",
      verb: "read",
      parameters: { scope: "day", date: hints.temporalAnchor },
      confidence: 0.78,
    };
  },
];

// ---------------------------------------------------------------------------
// Household
// ---------------------------------------------------------------------------

const HOUSEHOLD_MATCHERS: Matcher[] = [
  // "who's in my household?" / "who's in my family?"
  (u) => {
    if (!/\bwho'?s?\s+in\s+(?:my\s+)?(?:household|family)\b/i.test(u)) return null;
    return {
      capability: "household",
      verb: "read",
      parameters: { scope: "household" },
      confidence: 0.85,
    };
  },
];

// ---------------------------------------------------------------------------
// Meals
// ---------------------------------------------------------------------------

const MEALS_MATCHERS: Matcher[] = [
  // "find me a recipe for chicken curry"
  (u) => {
    const m = u.match(/\bfind\s+(?:me\s+)?(?:a\s+)?recipe(?:\s+for)?\s+(.+?)[\?.]?\s*$/i);
    if (!m?.[1]) return null;
    return {
      capability: "meals",
      verb: "search",
      parameters: { query: m[1].trim().toLowerCase() },
      confidence: 0.85,
    };
  },

  // "search for a pasta recipe" / "look up chicken dishes"
  (u) => {
    const m = u.match(/\b(?:search\s+for|look\s+up)\s+(?:a\s+)?(.+?)\s+(?:recipe|dish|meal)\b/i);
    if (!m?.[1]) return null;
    return {
      capability: "meals",
      verb: "search",
      parameters: { query: m[1].trim().toLowerCase() },
      confidence: 0.82,
    };
  },

  // "find me a chicken curry recipe" / "show me a pasta recipe" / "give me a fish pie recipe" /
  // "I want a fish pie recipe"  — noun-last phrasing (INT25B F1: most common natural-English form)
  (u) => {
    const m = u.match(/\b(?:(?:find|show|give)\s+me\s+(?:a\s+)?|i\s+want\s+(?:a\s+)?)(.+?)\s+recipe\b/i);
    if (!m?.[1]) return null;
    return {
      capability: "meals",
      verb: "search",
      parameters: { query: m[1].trim().toLowerCase() },
      confidence: 0.83,
    };
  },

  // "what can I cook with chickpeas?" / "what can I make with salmon?"  (INT25B F1)
  (u) => {
    const m = u.match(/\bwhat\s+can\s+i\s+(?:cook|make|do|prepare)\s+with\s+(.+?)[\?.]?\s*$/i);
    if (!m?.[1]) return null;
    return {
      capability: "meals",
      verb: "search",
      parameters: { query: m[1].trim().toLowerCase() },
      confidence: 0.82,
    };
  },

  // "give me something with salmon" / "something with chickpeas"  (INT25B F1)
  (u) => {
    const m = u.match(/\b(?:(?:give|show)\s+me\s+)?something\s+(?:made\s+)?with\s+(.+?)[\?.]?\s*$/i);
    if (!m?.[1]) return null;
    return {
      capability: "meals",
      verb: "search",
      parameters: { query: m[1].trim().toLowerCase() },
      confidence: 0.78,
    };
  },
];

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

const TEMPLATES_MATCHERS: Matcher[] = [
  // "show my meal plan templates" / "do I have any templates?"
  (u) => {
    if (!/\b(?:(?:show\s+(?:me\s+)?(?:my\s+)?)?(?:meal\s+plan\s+)?templates?|my\s+templates?)\b/i.test(u)) return null;
    return {
      capability: "templates",
      verb: "read",
      parameters: { scope: "plan-templates" },
      confidence: 0.80,
    };
  },
];

// ---------------------------------------------------------------------------
// Analyser
// ---------------------------------------------------------------------------

const ANALYSER_MATCHERS: Matcher[] = [
  // "what additives should I watch out for?" / "what UPF classification does it have?"
  (u) => {
    if (!/\b(?:additives?|e[-. ]?numbers?|upf|ultra[-. ]?processed|nova|processing\s+level)\b/i.test(u)) return null;
    return {
      capability: "analyser",
      verb: "read",
      parameters: { scope: "additives" },
      confidence: 0.78,
    };
  },
];

// ---------------------------------------------------------------------------
// Partners
// ---------------------------------------------------------------------------

const PARTNERS_MATCHERS: Matcher[] = [
  // "which supermarkets does THA support?" / "what retailers can I export to?"
  (u) => {
    if (!/\b(?:retailers?|supermarkets?)\b/i.test(u)) return null;
    return {
      capability: "partners",
      verb: "read",
      parameters: { scope: "retailers" },
      confidence: 0.78,
    };
  },
];

// ---------------------------------------------------------------------------
// All specific matchers in priority order
// ---------------------------------------------------------------------------

const ALL_SPECIFIC_MATCHERS: Matcher[] = [
  ...NUTRITION_EXPLAIN_MATCHERS,
  ...NUTRITION_BENEFIT_FOODS_MATCHERS,
  ...NUTRITION_FOOD_DETAIL_MATCHERS,
  ...PLANNER_MATCHERS,
  ...SHOPPING_MATCHERS,
  ...PANTRY_MATCHERS,
  ...DIARY_MATCHERS,
  ...HOUSEHOLD_MATCHERS,
  ...MEALS_MATCHERS,
  ...TEMPLATES_MATCHERS,
  ...ANALYSER_MATCHERS,
  ...PARTNERS_MATCHERS,
];

// ---------------------------------------------------------------------------
// Keyword fallbacks (lower confidence, vocabulary-only signals)
// ---------------------------------------------------------------------------

interface KeywordFallback {
  readonly pattern: RegExp;
  readonly capability: string;
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly confidence: number;
}

const KEYWORD_FALLBACKS: KeywordFallback[] = [
  {
    pattern: /\b(?:planner|week(?:ly)?|(?:meal\s+)?plan|schedule)\b/i,
    capability: "planner",
    parameters: {},
    confidence: 0.60,
  },
  {
    pattern: /\b(?:shopping\s+list|basket|grocery|groceries)\b/i,
    capability: "shopping",
    parameters: { scope: "list" },
    confidence: 0.62,
  },
  {
    pattern: /\b(?:pantry|fridge|freezer|larder|cupboard|food\s+stock)\b/i,
    capability: "pantry",
    parameters: { scope: "list" },
    confidence: 0.60,
  },
  {
    pattern: /\b(?:food\s+diary|(?:my\s+)?(?:food\s+)?log|logged|tracked|food\s+mood|food\s+energy)\b/i,
    capability: "diary",
    parameters: {},
    confidence: 0.55,
  },
  {
    pattern: /\b(?:household|family\s+members?|housemates?|everyone\s+in)\b/i,
    capability: "household",
    parameters: { scope: "household" },
    confidence: 0.60,
  },
  {
    pattern: /\b(?:nutrients?|vitamins?|minerals?|nutrition(?:al)?|(?:health\s+)?benefits?)\b/i,
    capability: "nutrition-knowledge",
    parameters: { scope: "foods" },
    confidence: 0.58,
  },
  {
    pattern: /\b(?:plan\s+)?templates?\b/i,
    capability: "templates",
    parameters: { scope: "plan-templates" },
    confidence: 0.60,
  },
  {
    pattern: /\b(?:additives?|e[-. ]?number|upf|ultra[-. ]?processed|nova)\b/i,
    capability: "analyser",
    parameters: { scope: "additives" },
    confidence: 0.62,
  },
  {
    pattern: /\b(?:retailers?|supermarkets?)\b/i,
    capability: "partners",
    parameters: { scope: "retailers" },
    confidence: 0.62,
  },
  {
    pattern: /\b(?:recipe|cook|dish|ingredient)\b/i,
    capability: "meals",
    parameters: { scope: "list" },
    confidence: 0.55,
  },
];

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

function dedupe(intents: ResolvedIntent[]): ResolvedIntent[] {
  const best = new Map<string, ResolvedIntent>();
  for (const intent of intents) {
    const existing = best.get(intent.capability);
    if (!existing || intent.confidence > existing.confidence) {
      best.set(intent.capability, intent);
    }
  }
  return Array.from(best.values());
}

// ---------------------------------------------------------------------------
// Surface primary builder
// ---------------------------------------------------------------------------

function buildSurfacePrimary(
  capId: string,
  hints: IntentResolutionHints,
): ResolvedIntent {
  let params: Record<string, unknown> = {};
  switch (capId) {
    case "planner":
      params = hints.activePlannerWeekId != null
        ? { scope: "week", weekId: hints.activePlannerWeekId }
        : {};
      break;
    case "nutrition-knowledge":
      params = hints.currentFoodSlug
        ? { scope: "food", slug: hints.currentFoodSlug }
        : { scope: "foods" };
      break;
    case "pantry":    params = { scope: "list" };           break;
    case "diary":     params = { scope: "day", date: hints.temporalAnchor }; break;
    case "shopping":  params = { scope: "list" };           break;
    case "household": params = { scope: "household" };      break;
    case "partners":  params = { scope: "retailers" };      break;
    case "templates": params = { scope: "plan-templates" }; break;
    case "analyser":  params = { scope: "additives" };      break;
    case "meals":     params = { scope: "list" };           break;
  }
  return { capability: capId, verb: "read", parameters: params, confidence: 0.65 };
}

// ---------------------------------------------------------------------------
// PatternIntentResolver
// ---------------------------------------------------------------------------

/**
 * The production pattern-based implementation of IIntentResolver.
 * Exported as a singleton via `patternIntentResolver` for injection into the
 * Conversation Gateway and any future input adapter.
 */
export class PatternIntentResolver implements IIntentResolver {
  async resolve(
    utterance: string,
    hints: IntentResolutionHints,
  ): Promise<ResolvedIntent[]> {
    const lower = utterance.toLowerCase();
    const collected: ResolvedIntent[] = [];

    // 1. Specific pattern matchers (high confidence)
    for (const matcher of ALL_SPECIFIC_MATCHERS) {
      const result = matcher(utterance, lower, hints);
      if (result !== null) collected.push(result);
    }

    // 2. Surface-based primary capability (medium confidence)
    const primaryCap = SURFACE_CAP[hints.surface];
    if (primaryCap) {
      collected.push(buildSurfacePrimary(primaryCap, hints));
    }

    // 3. Keyword fallbacks (lower confidence)
    for (const fb of KEYWORD_FALLBACKS) {
      if (fb.pattern.test(lower)) {
        collected.push({
          capability: fb.capability,
          verb: "read",
          parameters: fb.parameters,
          confidence: fb.confidence,
        });
      }
    }

    // 4. Profile — always included for personalisation context
    collected.push({
      capability: "profile",
      verb: "read",
      parameters: {},
      confidence: 0.50,
    });

    // 5. Deduplicate (keep highest confidence per capability), sort, cap
    return dedupe(collected)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, MAX_INTENTS);
  }
}

/** Production singleton. Inject via constructor for tests. */
export const patternIntentResolver = new PatternIntentResolver();
