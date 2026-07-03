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
 * Resolution pipeline per call (INT23 §10 routing table / INT33 update):
 *   0. Compound matchers    — cross-domain questions, 2–3 intents, confidence 0.80–0.88
 *   1. Specific pattern rules  — entity extraction, confidence 0.80–0.92
 *   2. Surface-primary rule    — surface → primary capability, confidence 0.65
 *   3. Keyword fallbacks       — vocabulary scan, confidence 0.55–0.65
 *   4. Profile always-on       — confidence 0.50 (personalisation context; baseline)
 *   5. Deduplicate by capability (keep highest confidence per capability)
 *   6. Sort descending, cap at MAX_INTENTS = 4
 *
 * INT35: when NO utterance-derived signal fires (steps 0, 1 and 3 all empty),
 * the always-on profile intent carries gap { kind: "unknown" } so the gateway
 * can answer "I did not understand" (with rephrase suggestions) instead of a
 * generic non-answer. Surface-primary (step 2) is context, not understanding.
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
// CompoundMatcher type (INT33)
// ---------------------------------------------------------------------------

/**
 * A compound matcher returns 2–3 ResolvedIntents when the utterance spans
 * two or more capability domains, or null when it does not.
 * Every intent in the returned array targets a DISTINCT capability.
 *
 * The gateway already executes all resolved intents via Promise.all in
 * buildGroundedResponse() (conversation-gateway.ts). Compound matchers
 * pre-populate the intent pool with the correct multi-capability list before
 * deduplication runs. No changes to the gateway, platform, engine, registry,
 * handlers, or types are required — the execution machinery is already in place.
 *
 * HARD BOUNDARIES (same as Matcher):
 *  • No storage reads, no platform calls, no business logic.
 *  • Pattern-matching on the utterance string only.
 *  • Each array member must target a distinct capability (enforced by tests).
 */
type CompoundMatcher = (
  utterance: string,
  lower: string,
  hints: IntentResolutionHints,
) => ResolvedIntent[] | null;

// ---------------------------------------------------------------------------
// Nutrient / benefit term guards (INT26)
//
// These two regexes distinguish nutrient names ("vitamin C", "iron", "omega-3")
// and health-benefit concepts ("immunity", "bone health") from generic food terms
// ("broccoli", "salmon").  They are used as guards in multiple matcher arrays
// so that "tell me about vitamin C" routes to nutrientRead rather than foodExplain,
// and "tell me about bone health" routes to benefitExplain rather than foodExplain.
// ---------------------------------------------------------------------------

const KNOWN_NUTRIENT_TERMS = /\b(?:vitamin\s+[a-z][0-9]*|vitamins?|minerals?|iron|zinc|calcium|magnesium|potassium|phosphorus|sodium|selenium|iodine|copper|manganese|chromium|molybdenum|omega[-\s]?[369]+|protein|fibre|fiber|carbohydrates?|carbs?|fat|glucose|fructose|sucrose|folate|folic\s+acid|biotin|riboflavin|niacin|thiamine?|choline|pantothenic\s+acid|cobalamin|retinol|tocopherol|antioxidants?|flavonoids?|polyphenols?|carotenoids?|lycopene|beta[\s-]?carotene|lutein|quercetin|resveratrol|curcumin|amino\s+acids?|tryptophan|leucine|isoleucine|valine|lysine|methionine|phenylalanine|threonine|histidine|electrolytes?|probiotics?|prebiotics?|enzymes?|chlorophyll|sulforaphane)\b/i;

const KNOWN_BENEFIT_TERMS = /\b(?:immunity|immune\s+system|bone\s+health|heart\s+health|brain\s+health|eye\s+health|skin\s+health|gut\s+health|digestive\s+health|digestion|sleep|energy|mood|focus|concentration|inflammation|anti[\s-]?inflammatory|weight\s+(?:management|loss)|metabolism|muscle\s+(?:health|recovery|growth)|joint\s+health|liver\s+health|kidney\s+health|blood\s+(?:pressure|sugar)|cholesterol|mental\s+health|stress|anxiety|hormonal\s+balance|fertility|pregnancy|cardiovascular|cognitive|athletic\s+performance|endurance|hydration|circulation|longevity)\b/i;

// ---------------------------------------------------------------------------
// Nutrition: food-benefit explanation (verb: explain)
// ---------------------------------------------------------------------------

function foodExplain(entity: string, confidence = 0.90): ResolvedIntent | null {
  const slug = toSlug(entity);
  if (!slug) return null;
  // Nutrient-named entities (e.g. "vitamin C") fall through to NUTRITION_NUTRIENT_MATCHERS
  // to avoid routing them to explain { foodSlug } (INT26 misfire fix).
  if (KNOWN_NUTRIENT_TERMS.test(entity)) return null;
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
// Nutrition: nutrient-named queries (INT26) — verb: read { scope:"nutrient" } / search
//
// Routes queries whose entity is a KNOWN_NUTRIENT_TERMS match to the
// nutrition-knowledge handler with the correct verb+scope, fixing the INT26
// misfire where "vitamin C" was incorrectly mapped to explain { foodSlug }.
// ---------------------------------------------------------------------------

function nutrientRead(entity: string, confidence = 0.84): ResolvedIntent | null {
  const slug = toSlug(entity);
  if (!slug || !KNOWN_NUTRIENT_TERMS.test(entity)) return null;
  return {
    capability: "nutrition-knowledge",
    verb: "read",
    parameters: { scope: "nutrient", slug },
    confidence,
  };
}

function nutrientOrBenefitSearch(entity: string, confidence = 0.80): ResolvedIntent | null {
  const q = entity.trim().toLowerCase();
  if (!q) return null;
  if (!KNOWN_NUTRIENT_TERMS.test(entity) && !KNOWN_BENEFIT_TERMS.test(entity)) return null;
  return {
    capability: "nutrition-knowledge",
    verb: "search",
    parameters: { query: q },
    confidence,
  };
}

const NUTRITION_NUTRIENT_MATCHERS: Matcher[] = [
  // "tell me about vitamin C / iron / omega-3"
  (u) => {
    const m = u.match(/\btell\s+me\s+about\s+(.+?)[\?.]?\s*$/i);
    return m?.[1] ? nutrientRead(m[1]) : null;
  },

  // "what is vitamin C?" / "what are omega-3 fatty acids?" (nutrient guard)
  (u) => {
    const m = u.match(/\bwhat\s+(?:is|are)\s+(.+?)[\?.]?\s*$/i);
    if (!m?.[1]) return null;
    return nutrientRead(m[1].trim(), 0.82);
  },

  // "what does vitamin C do?" / "what does iron do for you?"
  (u) => {
    const m = u.match(/\bwhat\s+does\s+(.+?)\s+do\b/i);
    if (!m?.[1]) return null;
    return nutrientRead(m[1].trim(), 0.82);
  },

  // "explain vitamin C / omega-3 to me"
  (u) => {
    const m = u.match(/\bexplain\s+(.+?)(?:\s+to\s+me)?[\?.]?\s*$/i);
    return m?.[1] ? nutrientRead(m[1].trim(), 0.82) : null;
  },

  // "what are good sources of iron?" / "where do I get vitamin C from?"
  (u) => {
    const m = u.match(/\b(?:what\s+are\s+(?:good\s+)?sources\s+of|where\s+do\s+I\s+get)\s+(.+?)(?:\s+from)?[\?.]?\s*$/i);
    return m?.[1] ? nutrientOrBenefitSearch(m[1].trim(), 0.82) : null;
  },

  // "foods rich in / high in vitamin C" / "foods containing omega-3"
  (u) => {
    const m = u.match(/\bfoods?\s+(?:rich\s+in|high\s+in|containing|with\s+high)\s+(.+?)[\?.]?\s*$/i);
    return m?.[1] ? nutrientOrBenefitSearch(m[1].trim(), 0.80) : null;
  },

  // "what foods contain vitamin D?" / "what foods have omega-3?"
  (u) => {
    const m = u.match(/\bwhat\s+foods?\s+(?:contain|have|provide|are\s+high\s+in)\s+(.+?)[\?.]?\s*$/i);
    return m?.[1] ? nutrientOrBenefitSearch(m[1].trim(), 0.80) : null;
  },
];

// ---------------------------------------------------------------------------
// Nutrition: benefit queries (INT26) — verb: explain { benefitSlug }
//
// Routes queries whose entity is a KNOWN_BENEFIT_TERMS match to the
// nutrition-knowledge handler's explain { benefitSlug } intent.
// ---------------------------------------------------------------------------

const NUTRITION_BENEFIT_EXPLAIN_MATCHERS: Matcher[] = [
  // "tell me about immunity / bone health"
  (u) => {
    const m = u.match(/\btell\s+me\s+about\s+(.+?)[\?.]?\s*$/i);
    if (!m?.[1]) return null;
    const entity = m[1].trim();
    if (!KNOWN_BENEFIT_TERMS.test(entity) || KNOWN_NUTRIENT_TERMS.test(entity)) return null;
    const slug = toSlug(entity);
    return slug ? { capability: "nutrition-knowledge", verb: "explain", parameters: { benefitSlug: slug }, confidence: 0.84 } : null;
  },

  // "explain immunity / heart health to me"
  (u) => {
    const m = u.match(/\bexplain\s+(.+?)(?:\s+to\s+me)?[\?.]?\s*$/i);
    if (!m?.[1]) return null;
    const entity = m[1].trim();
    if (!KNOWN_BENEFIT_TERMS.test(entity) || KNOWN_NUTRIENT_TERMS.test(entity)) return null;
    const slug = toSlug(entity);
    return slug ? { capability: "nutrition-knowledge", verb: "explain", parameters: { benefitSlug: slug }, confidence: 0.82 } : null;
  },
];

// ---------------------------------------------------------------------------
// Nutrition: general food explain (INT26) — verb: explain { foodSlug }
//
// Catches "tell me about broccoli / salmon" utterances that did not match the
// nutrient or benefit guards above. Lower confidence since the entity is not
// validated against a known vocabulary.
// ---------------------------------------------------------------------------

const NUTRITION_GENERAL_EXPLAIN_MATCHERS: Matcher[] = [
  // "tell me about broccoli / quinoa" (fallthrough from nutrient + benefit matchers)
  (u) => {
    const m = u.match(/\btell\s+me\s+about\s+(.+?)[\?.]?\s*$/i);
    if (!m?.[1]) return null;
    const entity = m[1].trim();
    if (KNOWN_NUTRIENT_TERMS.test(entity) || KNOWN_BENEFIT_TERMS.test(entity)) return null;
    const slug = toSlug(entity);
    return slug ? { capability: "nutrition-knowledge", verb: "explain", parameters: { foodSlug: slug }, confidence: 0.76 } : null;
  },

  // "I want to know about / I'd like to know about oats"
  (u) => {
    const m = u.match(/\bI(?:'d)?(?:\s+would)?\s+(?:like\s+to\s+|want\s+to\s+)?know\s+about\s+(.+?)[\?.]?\s*$/i);
    if (!m?.[1]) return null;
    const slug = toSlug(m[1].trim());
    return slug ? { capability: "nutrition-knowledge", verb: "explain", parameters: { foodSlug: slug }, confidence: 0.74 } : null;
  },

  // "give me information on / about salmon"
  (u) => {
    const m = u.match(/\bgive\s+me\s+(?:information|info)\s+(?:on|about)\s+(.+?)[\?.]?\s*$/i);
    if (!m?.[1]) return null;
    const slug = toSlug(m[1].trim());
    return slug ? { capability: "nutrition-knowledge", verb: "explain", parameters: { foodSlug: slug }, confidence: 0.72 } : null;
  },
];

// ---------------------------------------------------------------------------
// Nutrition: open knowledge search (INT26) — verb: search { query }
//
// Routes open-ended nutrient/benefit searches when the entity matches a known
// vocabulary term but no more specific matcher above applies.
// ---------------------------------------------------------------------------

const NUTRITION_KNOWLEDGE_SEARCH_MATCHERS: Matcher[] = [
  // "search for vitamin C / immunity" — requires nutrient or benefit signal
  (u) => {
    const m = u.match(/\bsearch\s+(?:(?:nutrition|knowledge|food)\s+(?:knowledge\s+)?)?for\s+(.+?)[\?.]?\s*$/i);
    if (!m?.[1]) return null;
    return nutrientOrBenefitSearch(m[1].trim(), 0.75);
  },

  // "look up vitamin D / omega-3 / immunity"
  (u) => {
    const m = u.match(/\blook\s+up\s+(.+?)[\?.]?\s*$/i);
    if (!m?.[1]) return null;
    return nutrientOrBenefitSearch(m[1].trim(), 0.74);
  },

  // "find information about iron / vitamin D"
  (u) => {
    const m = u.match(/\bfind\s+(?:information|info)\s+(?:about|on)\s+(.+?)[\?.]?\s*$/i);
    if (!m?.[1]) return null;
    return nutrientOrBenefitSearch(m[1].trim(), 0.73);
  },
];

// ---------------------------------------------------------------------------
// Nutrition Discovery (INT27) — macro-filtered meal search
//
// Routes queries containing explicit macro thresholds or qualitative nutrition
// descriptors to the nutrition-discovery capability so the engine can filter
// user and system meals by calorie ceiling, protein floor, carb limit, etc.
// Patterns require a numeric quantity OR a known qualitative descriptor to fire,
// ensuring no false-positive routing on broad food queries.
// ---------------------------------------------------------------------------

const NUTRITION_DISCOVERY_MATCHERS: Matcher[] = [
  // "meals under 400 calories" / "recipes under 400 kcal"
  (u) => {
    if (!/\b(?:meals?|recipes?|dishes?|something)\s+under\s+\d+\s*(?:kcal|calories?|cals?)\b/i.test(u)) return null;
    return { capability: "nutrition-discovery", verb: "search", parameters: { query: u.trim().toLowerCase() }, confidence: 0.90 };
  },

  // "what can I have under N calories?" / "what's under 400 calories?"
  (u) => {
    if (!/\b(?:what\s+can\s+I\s+(?:eat|have|make)|what'?s?)\s+under\s+\d+\s*(?:kcal|calories?|cals?)\b/i.test(u)) return null;
    return { capability: "nutrition-discovery", verb: "search", parameters: { query: u.trim().toLowerCase() }, confidence: 0.89 };
  },

  // "high protein meals / recipes / dinner"
  (u) => {
    if (!/\bhigh[\s-]protein\b/i.test(u)) return null;
    return { capability: "nutrition-discovery", verb: "search", parameters: { query: u.trim().toLowerCase() }, confidence: 0.88 };
  },

  // "low carb meals / recipes / dinner"
  (u) => {
    if (!/\blow[\s-]carb\b/i.test(u)) return null;
    return { capability: "nutrition-discovery", verb: "search", parameters: { query: u.trim().toLowerCase() }, confidence: 0.88 };
  },

  // "low fat meals / recipes"
  (u) => {
    if (!/\blow[\s-]fat\b/i.test(u)) return null;
    return { capability: "nutrition-discovery", verb: "search", parameters: { query: u.trim().toLowerCase() }, confidence: 0.86 };
  },

  // "low sugar meals / recipes"
  (u) => {
    if (!/\blow[\s-]sugar\b/i.test(u)) return null;
    return { capability: "nutrition-discovery", verb: "search", parameters: { query: u.trim().toLowerCase() }, confidence: 0.86 };
  },

  // INT35B: "high fibre meals" / "high-fiber recipes" — uncovered by INT35 (only
  // high-protein fired for a "high-*" descriptor).
  (u) => {
    if (!/\bhigh[\s-](?:fibre|fiber)\b/i.test(u)) return null;
    return { capability: "nutrition-discovery", verb: "search", parameters: { query: u.trim().toLowerCase() }, confidence: 0.86 };
  },

  // INT35B: "low calorie meals" / "low-calorie dinners" — the qualitative form
  // ("under N calories" was covered; the descriptor phrasing was not).
  (u) => {
    if (!/\blow[\s-]cal(?:orie)?s?\b/i.test(u)) return null;
    return { capability: "nutrition-discovery", verb: "search", parameters: { query: u.trim().toLowerCase() }, confidence: 0.86 };
  },

  // INT35B: "low sodium" / "low salt" meals — uncovered by INT35.
  (u) => {
    if (!/\blow[\s-](?:sodium|salt)\b/i.test(u)) return null;
    return { capability: "nutrition-discovery", verb: "search", parameters: { query: u.trim().toLowerCase() }, confidence: 0.84 };
  },

  // "meals with less than 500 calories" / "recipes with under 30g carbs"
  (u) => {
    if (!/\b(?:meals?|recipes?|dishes?)\s+with\s+(?:less\s+than|under|fewer\s+than)\s+\d+\s*(?:g|grams?|kcal|calories?|cals?)\b/i.test(u)) return null;
    return { capability: "nutrition-discovery", verb: "search", parameters: { query: u.trim().toLowerCase() }, confidence: 0.87 };
  },

  // "at least 30g protein" / "over 25g protein" meals/recipes/dishes
  (u) => {
    if (!/\b(?:at\s+least|over|more\s+than)\s+\d+\s*g\s+protein\b/i.test(u)) return null;
    return { capability: "nutrition-discovery", verb: "search", parameters: { query: u.trim().toLowerCase() }, confidence: 0.86 };
  },
];

// ---------------------------------------------------------------------------
// Planner Discovery (INT28) — search for meals within the user's planner
// ---------------------------------------------------------------------------

const PLANNER_DISCOVERY_MATCHERS: Matcher[] = [
  // "search my plan for chicken" / "search my meal plan for pasta"
  (u) => {
    if (!/\bsearch\s+(?:my\s+)?(?:meal\s+)?plan(?:ner)?\s+for\s+\S/i.test(u)) return null;
    return { capability: "planner-discovery", verb: "search", parameters: { query: u.trim() }, confidence: 0.90 };
  },

  // "find chicken in my plan" / "find pasta in my meal planner"
  (u) => {
    if (!/\bfind\s+.+\s+in\s+(?:my\s+)?(?:meal\s+)?plan(?:ner)?\b/i.test(u)) return null;
    return { capability: "planner-discovery", verb: "search", parameters: { query: u.trim() }, confidence: 0.88 };
  },

  // "is pasta in my plan?" / "is chicken planned this week?"
  (u) => {
    if (!/\bis\s+\S.+\s+(?:in\s+(?:my\s+)?(?:meal\s+)?plan(?:ner)?|planned(?:\s+this\s+week)?)\b/i.test(u)) return null;
    return { capability: "planner-discovery", verb: "search", parameters: { query: u.trim() }, confidence: 0.86 };
  },

  // "look for X in my planner"
  (u) => {
    if (!/\blook\s+for\s+.+\s+in\s+(?:my\s+)?(?:meal\s+)?plan(?:ner)?\b/i.test(u)) return null;
    return { capability: "planner-discovery", verb: "search", parameters: { query: u.trim() }, confidence: 0.85 };
  },

  // "do I have chicken planned?" / "do I have pasta in my plan?"
  (u) => {
    if (!/\bdo\s+I\s+have\s+\S.+\s+(?:planned|in\s+(?:my\s+)?(?:meal\s+)?plan(?:ner)?)\b/i.test(u)) return null;
    return { capability: "planner-discovery", verb: "search", parameters: { query: u.trim() }, confidence: 0.85 };
  },
];

// ---------------------------------------------------------------------------
// Pantry Discovery (INT31) — search the user's pantry
// ---------------------------------------------------------------------------

const PANTRY_DISCOVERY_MATCHERS: Matcher[] = [
  // "what's in my pantry?" / "what is in my pantry?"
  (u) => {
    if (!/\bwhat(?:'s|\s+is)\s+in\s+(?:my\s+)?pantry\b/i.test(u)) return null;
    return { capability: "pantry-discovery", verb: "search", parameters: { query: "" }, confidence: 0.93 };
  },

  // "search my pantry for flour" / "find flour in my pantry"
  (u) => {
    if (!/\b(?:search|find)\s+(?:my\s+)?pantry\s+for\s+\S/i.test(u)) return null;
    return { capability: "pantry-discovery", verb: "search", parameters: { query: u.trim() }, confidence: 0.91 };
  },

  // "find flour in my pantry"
  (u) => {
    if (!/\bfind\s+.+\s+in\s+(?:my\s+)?pantry\b/i.test(u)) return null;
    return { capability: "pantry-discovery", verb: "search", parameters: { query: u.trim() }, confidence: 0.89 };
  },

  // "do I have flour in my pantry?" / "do I have oil?"
  (u) => {
    if (!/\bdo\s+I\s+have\s+\S.+\s+in\s+(?:my\s+)?pantry\b/i.test(u)) return null;
    return { capability: "pantry-discovery", verb: "search", parameters: { query: u.trim() }, confidence: 0.88 };
  },

  // "is flour in my pantry?"
  (u) => {
    if (!/\bis\s+\S.+\s+in\s+(?:my\s+)?pantry\b/i.test(u)) return null;
    return { capability: "pantry-discovery", verb: "search", parameters: { query: u.trim() }, confidence: 0.86 };
  },

  // "show me my pantry" / "list my pantry items"
  (u) => {
    if (!/\b(?:show\s+(?:me\s+)?(?:my\s+)?pantry|list\s+(?:my\s+)?pantry\s+items?)\b/i.test(u)) return null;
    return { capability: "pantry-discovery", verb: "search", parameters: { query: "" }, confidence: 0.87 };
  },
];

// ---------------------------------------------------------------------------
// Diary Discovery (INT32) — search the user's food diary
// ---------------------------------------------------------------------------

const DIARY_DISCOVERY_MATCHERS: Matcher[] = [
  // "search my diary for chicken" / "find chicken in my diary"
  (u) => {
    if (!/\b(?:search|find)\s+(?:my\s+)?(?:food\s+)?diary\s+for\s+\S/i.test(u)) return null;
    return { capability: "diary-discovery", verb: "search", parameters: { query: u.trim() }, confidence: 0.91 };
  },

  // "find chicken in my food diary"
  (u) => {
    if (!/\bfind\s+.+\s+in\s+(?:my\s+)?(?:food\s+)?diary\b/i.test(u)) return null;
    return { capability: "diary-discovery", verb: "search", parameters: { query: u.trim() }, confidence: 0.89 };
  },

  // "what have I eaten?" / "what have I logged?"
  (u) => {
    if (!/\bwhat\s+have\s+I\s+(?:eaten|logged|recorded|tracked)\b/i.test(u)) return null;
    return { capability: "diary-discovery", verb: "search", parameters: { query: "" }, confidence: 0.88 };
  },

  // "show me my diary" / "show my food diary" / "list my diary entries"
  (u) => {
    if (!/\b(?:show\s+(?:me\s+)?(?:my\s+)?(?:food\s+)?diary|list\s+(?:my\s+)?diary\s+entries?)\b/i.test(u)) return null;
    return { capability: "diary-discovery", verb: "search", parameters: { query: "" }, confidence: 0.87 };
  },

  // "have I eaten chicken?" / "have I logged pasta?"
  (u) => {
    if (!/\bhave\s+I\s+(?:eaten|logged|had|eaten\s+any)\s+\S/i.test(u)) return null;
    return { capability: "diary-discovery", verb: "search", parameters: { query: u.trim() }, confidence: 0.86 };
  },

  // "did I eat chicken yesterday?" / "did I have pasta last week?"
  (u) => {
    if (!/\bdid\s+I\s+(?:eat|have|log)\s+\S/i.test(u)) return null;
    return { capability: "diary-discovery", verb: "search", parameters: { query: u.trim() }, confidence: 0.85 };
  },
];

// ---------------------------------------------------------------------------
// Shopping Discovery (INT30) — search the user's shopping list
// ---------------------------------------------------------------------------

const SHOPPING_DISCOVERY_MATCHERS: Matcher[] = [
  // "what's on my shopping list?" / "what is on my shopping list?"
  (u) => {
    if (!/\bwhat(?:'s|\s+is)\s+on\s+(?:my\s+)?shopping\s+list\b/i.test(u)) return null;
    return { capability: "shopping-discovery", verb: "search", parameters: { query: "" }, confidence: 0.92 };
  },

  // "search my shopping list for chicken" / "find chicken on my shopping list"
  (u) => {
    if (!/\b(?:search|find)\s+(?:my\s+)?shopping\s+list\s+(?:for|for\s+\S)/i.test(u)) return null;
    return { capability: "shopping-discovery", verb: "search", parameters: { query: u.trim() }, confidence: 0.91 };
  },

  // "find chicken on my shopping list"
  (u) => {
    if (!/\bfind\s+.+\s+on\s+(?:my\s+)?shopping\s+list\b/i.test(u)) return null;
    return { capability: "shopping-discovery", verb: "search", parameters: { query: u.trim() }, confidence: 0.89 };
  },

  // "is chicken on my shopping list?" / "is pasta on my list?"
  (u) => {
    if (!/\bis\s+\S.+\s+on\s+(?:my\s+)?(?:shopping\s+)?list\b/i.test(u)) return null;
    return { capability: "shopping-discovery", verb: "search", parameters: { query: u.trim() }, confidence: 0.87 };
  },

  // "show me my shopping list" / "list my shopping items"
  (u) => {
    if (!/\b(?:show\s+(?:me\s+)?(?:my\s+)?shopping\s+list|list\s+(?:my\s+)?shopping\s+items?)\b/i.test(u)) return null;
    return { capability: "shopping-discovery", verb: "search", parameters: { query: "" }, confidence: 0.88 };
  },

  // "do I have chicken on my shopping list?"
  (u) => {
    if (!/\bdo\s+I\s+have\s+\S.+\s+on\s+(?:my\s+)?(?:shopping\s+)?list\b/i.test(u)) return null;
    return { capability: "shopping-discovery", verb: "search", parameters: { query: u.trim() }, confidence: 0.86 };
  },
];

// ---------------------------------------------------------------------------
// Household Discovery (INT29) — search members of the user's household
// ---------------------------------------------------------------------------

const HOUSEHOLD_DISCOVERY_MATCHERS: Matcher[] = [
  // "who is in my household?" / "who's in my household?"
  (u) => {
    if (!/\bwho(?:'s|\s+is)\s+in\s+(?:my\s+)?household\b/i.test(u)) return null;
    return { capability: "household-discovery", verb: "search", parameters: { query: "" }, confidence: 0.92 };
  },

  // "list my household members" / "show me my household members"
  (u) => {
    if (!/\b(?:list|show)\s+(?:me\s+)?(?:my\s+)?household\s+members\b/i.test(u)) return null;
    return { capability: "household-discovery", verb: "search", parameters: { query: "" }, confidence: 0.90 };
  },

  // "search my household for dairy allergy" / "find vegan members in my household"
  (u) => {
    if (!/\b(?:search|find)\s+(?:my\s+)?household\s+(?:for|members?\s+with)\b/i.test(u)) return null;
    return { capability: "household-discovery", verb: "search", parameters: { query: u.trim() }, confidence: 0.90 };
  },

  // "find members with gluten allergy in my household"
  (u) => {
    if (!/\bfind\s+members?\s+with\s+.+\s+in\s+(?:my\s+)?household\b/i.test(u)) return null;
    return { capability: "household-discovery", verb: "search", parameters: { query: u.trim() }, confidence: 0.88 };
  },

  // "what dietary restrictions does my household have?"
  (u) => {
    if (!/\bwhat\s+(?:dietary|diet|food)\s+(?:restrictions?|requirements?|preferences?)\s+does\s+(?:my\s+)?household\s+have\b/i.test(u)) return null;
    return { capability: "household-discovery", verb: "search", parameters: { query: "" }, confidence: 0.88 };
  },

  // "does anyone in my household have a nut allergy?"
  (u) => {
    if (!/\bdoes\s+anyone\s+in\s+(?:my\s+)?household\b/i.test(u)) return null;
    return { capability: "household-discovery", verb: "search", parameters: { query: u.trim() }, confidence: 0.86 };
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
// Meal Discovery (INT26) — cross-source recipe discovery
// Routes to "meal-discovery" so the engine can fan out across personal library,
// THA system meals, meal templates, and (Phase 2) external sources in one pass.
// ---------------------------------------------------------------------------

/**
 * INT35 (INT34 G1): temporal qualifiers that mean "something I already ate" —
 * these route meal-noun queries to diary-discovery (history) instead of
 * meal-discovery (recipes to cook).
 */
const PAST_MEAL_QUALIFIER = /\b(?:past|previous|recent|last|earlier|old)\b/i;

const MEAL_DISCOVERY_MATCHERS: Matcher[] = [
  // "find me a recipe for chicken curry"
  (u) => {
    const m = u.match(/\bfind\s+(?:me\s+)?(?:a\s+)?recipe(?:\s+for)?\s+(.+?)[\?.]?\s*$/i);
    if (!m?.[1]) return null;
    return {
      capability: "meal-discovery",
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
      capability: "meal-discovery",
      verb: "search",
      parameters: { query: m[1].trim().toLowerCase() },
      confidence: 0.82,
    };
  },

  // "find me a chicken curry recipe" / "show me a pasta recipe" / "show me pasta recipes" /
  // "I want a fish pie recipe"  — noun-last phrasing (INT25B F1: most common natural-English form)
  // INT35: plural "recipes" now matches too — "show me pasta recipes" previously fell through.
  (u) => {
    const m = u.match(/\b(?:(?:find|show|give)\s+me\s+(?:a\s+|some\s+)?|i\s+want\s+(?:a\s+)?)(.+?)\s+recipes?\b/i);
    if (!m?.[1]) return null;
    return {
      capability: "meal-discovery",
      verb: "search",
      parameters: { query: m[1].trim().toLowerCase() },
      confidence: 0.83,
    };
  },

  // INT35: "show me a past meal" / "show me my recent meals" → diary-discovery (already
  // eaten — INT34 G1: "past" implies diary history, not a recipe to discover);
  // "show me a chicken meal" → meal-discovery (terminal noun "meal" without "recipe").
  (u) => {
    const m = u.match(/\b(?:(?:find|show|give)\s+me\s+|i\s+want\s+)(?:a\s+|an\s+|some\s+|my\s+)?(.+?)\s+meals?\b/i);
    if (!m?.[1]) return null;
    const qualifier = m[1].trim();
    if (/^(?:a|an|my|the|some|any|me)$/i.test(qualifier)) return null;
    if (PAST_MEAL_QUALIFIER.test(qualifier)) {
      return {
        capability: "diary-discovery",
        verb: "search",
        parameters: { query: "" },
        confidence: 0.84,
      };
    }
    return {
      capability: "meal-discovery",
      verb: "search",
      parameters: { query: qualifier.toLowerCase() },
      confidence: 0.80,
    };
  },

  // INT35: bare noun-phrase queries — "pasta meals" / "chicken dishes" / "veggie recipes".
  // Whole-utterance anchor so longer sentences stay with their specific matchers; the
  // qualifier guard rejects articles/pronouns/question words so "my meals" etc. fall through.
  (u) => {
    const m = u.match(/^\s*(?:some\s+|any\s+)?([a-z][a-z\s-]{1,40}?)\s+(?:meals?|recipes?|dishes?)\s*[?.!]?\s*$/i);
    if (!m?.[1]) return null;
    const qualifier = m[1].trim();
    if (/\b(?:my|the|a|an|some|any|what|which|show|find|give|search|look|me)\b/i.test(qualifier)) return null;
    if (PAST_MEAL_QUALIFIER.test(qualifier)) {
      return {
        capability: "diary-discovery",
        verb: "search",
        parameters: { query: "" },
        confidence: 0.76,
      };
    }
    return {
      capability: "meal-discovery",
      verb: "search",
      parameters: { query: qualifier.toLowerCase() },
      confidence: 0.72,
    };
  },

  // "what can I cook with chickpeas?" / "what can I make with salmon?"  (INT25B F1)
  (u) => {
    const m = u.match(/\bwhat\s+can\s+i\s+(?:cook|make|do|prepare)\s+with\s+(.+?)[\?.]?\s*$/i);
    if (!m?.[1]) return null;
    return {
      capability: "meal-discovery",
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
      capability: "meal-discovery",
      verb: "search",
      parameters: { query: m[1].trim().toLowerCase() },
      confidence: 0.78,
    };
  },

  // INT35B: "meal ideas" / "dinner ideas" / "recipe ideas" / "healthy dinner ideas".
  // A very common phrasing INT35 left uncovered — "ideas" was in no matcher, so
  // these collapsed to no-route. Captures an optional leading descriptor
  // ("healthy", "vegetarian") as the search query.
  (u) => {
    if (!/\b(?:meal|dinner|lunch|breakfast|recipe|food|cooking)\s+ideas?\b/i.test(u)) return null;
    const d = u.match(/\b([a-z][a-z-]{2,30})\s+(?:meal|dinner|lunch|breakfast|recipe|food)\s+ideas?\b/i);
    const desc = d?.[1] && !/^(?:some|any|give|show|me|for|my|the|a|an|more|new|good)$/i.test(d[1]) ? d[1].toLowerCase() : "";
    return {
      capability: "meal-discovery",
      verb: "search",
      parameters: { query: desc },
      confidence: 0.80,
    };
  },

  // INT35B: "ideas for dinner" / "any ideas for lunch tonight" — the inverted form.
  (u) => {
    if (!/\bideas?\s+for\s+(?:dinner|lunch|breakfast|tea|supper|tonight|a\s+meal|meals?)\b/i.test(u)) return null;
    return {
      capability: "meal-discovery",
      verb: "search",
      parameters: { query: "" },
      confidence: 0.78,
    };
  },

  // INT35B: "what should I cook tonight?" / "what should I make for dinner?" /
  // "what can I eat?" — open recipe suggestion with no ingredient. Guarded so the
  // ingredient form ("what can I cook WITH chickpeas") and the calorie-bounded
  // form ("what can I have UNDER 400 calories", owned by nutrition-discovery) are
  // left to their existing matchers.
  (u) => {
    if (!/\bwhat\s+(?:should|can|could)\s+i\s+(?:cook|make|eat|prepare)\b/i.test(u)) return null;
    if (/\bwith\b/i.test(u)) return null;
    if (/\bunder\s+\d/i.test(u)) return null;
    return {
      capability: "meal-discovery",
      verb: "search",
      parameters: { query: "" },
      confidence: 0.79,
    };
  },
];

// ---------------------------------------------------------------------------
// Meals (personal library queries only — explicit "my meals" / "my cookbook")
// Discovery queries (no ownership qualifier) go to meal-discovery above.
// ---------------------------------------------------------------------------

const MEALS_MATCHERS: Matcher[] = [
  // "search my meals for pasta" / "search my cookbook for chicken" / "search my recipes for X"
  (u) => {
    const m = u.match(/\bsearch\s+my\s+(?:meals?|cookbook|recipes?)\s+for\s+(.+?)[\?.]?\s*$/i);
    if (!m?.[1]) return null;
    return {
      capability: "meals",
      verb: "search",
      parameters: { query: m[1].trim().toLowerCase() },
      confidence: 0.88,
    };
  },

  // "do I have any pasta meals?" / "have I got any chicken recipes?" / "do I have chicken dishes?"
  (u) => {
    const m = u.match(/\b(?:do\s+i\s+have|have\s+i\s+got)\s+(?:any\s+)?(.+?)\s+(?:meals?|recipes?|dishes?)\b/i);
    if (!m?.[1]) return null;
    return {
      capability: "meals",
      verb: "search",
      parameters: { query: m[1].trim().toLowerCase() },
      confidence: 0.87,
    };
  },

  // INT35 (INT34 G2): inverted OVS word order — "what pasta meals have I got" /
  // "which chicken recipes do I have" / "pasta meals have I got". Natural British
  // English puts the verb phrase LAST; the matcher above only covered SVO.
  // Week-scoped/planned phrasings ("what meals do I have planned this week") stay
  // with the planner matchers.
  (u) => {
    if (/\b(?:this|next|last)\s+week\b|\bplanned\b/i.test(u)) return null;
    const m = u.match(/\b(?:what|which)?\s*(.+?)\s+(?:meals?|recipes?|dishes?)\s+(?:have\s+i\s+got|do\s+i\s+have)\b/i);
    if (!m?.[1]) return null;
    const q = m[1].replace(/^(?:what|which)\s+/i, "").trim().toLowerCase();
    if (!q || /^(?:what|which|any|some|the|my)$/.test(q)) return null;
    return {
      capability: "meals",
      verb: "search",
      parameters: { query: q },
      confidence: 0.87,
    };
  },

  // INT35: unqualified "what meals have I got" / "which recipes do I have" — the whole
  // library, via the owner's lighter summary projection. Week-scoped phrasings stay
  // with the planner matcher ("what meals do I have this week").
  (u) => {
    if (!/\b(?:what|which)\s+(?:meals?|recipes?|dishes?)\s+(?:have\s+i\s+got|do\s+i\s+have)\b/i.test(u)) return null;
    if (/\b(?:this|next|last)\s+week\b|\bplanned\b/i.test(u)) return null;
    return {
      capability: "meals",
      verb: "read",
      parameters: { scope: "summary" },
      confidence: 0.86,
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
// Compound matchers (INT33) — cross-domain questions
//
// Each matcher fires only when the utterance contains clear signals from TWO
// or more capability domains. The returned intents enter the deduplication
// pool alongside single-domain matcher results; the highest-confidence intent
// per capability survives to the final list.
//
// Confidence range: 0.80–0.88 — intentionally below the top single-domain
// matchers (0.88–0.92) so a more-specific single-domain match can override
// a compound match's intent for a given capability when the question is
// actually single-domain.
//
// ALL_COMPOUND_MATCHERS is processed in resolve() step 0, before step 1.
// ---------------------------------------------------------------------------

/**
 * Extract a person name from an utterance: a capitalized word (not the first
 * word of the sentence, and not a common English word) that appears in the
 * original-case string. Returns the name in lowercase, or null if not found.
 */
const EXCLUDED_CAPITALIZED_WORDS = new Set([
  "What", "Who", "Where", "When", "How", "Why", "This", "That", "The",
  "Your", "My", "Our", "Its", "His", "Her", "Their", "Could", "Would",
  "Should", "Does", "Will", "Can", "Have", "Had", "Has", "Was", "Were",
  "Are", "Is", "Do", "Did", "Be", "Been", "Being", "Show", "Tell", "Give",
  "Find", "Search", "List", "Help", "Please", "Just", "Get", "Make", "Take",
  "Use", "Let", "Keep", "See", "Check", "Look",
]);

function extractPersonName(u: string): string | null {
  const words = u.split(/\s+/);
  for (let i = 1; i < words.length; i++) {
    const clean = words[i].replace(/[^A-Za-z]/g, "");
    if (/^[A-Z][a-z]{2,}$/.test(clean) && !EXCLUDED_CAPITALIZED_WORDS.has(clean)) {
      return clean.toLowerCase();
    }
  }
  return null;
}

/** Nutrition quality + Planner: "what high-protein meals do I have planned?" */
const NUTRITION_DISCOVERY_PLANNER_COMPOUND: CompoundMatcher = (_u, lower, _hints) => {
  const hasNutrition = /\b(?:high[\s-]protein|low[\s-]carb|low[\s-]fat|low[\s-]sugar|low[\s-]calorie|under\s+\d+\s*(?:kcal|cal(?:orie)?s?)|nutritious|healthy\s+(?:meals?|recipes?|dinners?|lunches?|breakfasts?|dishes?))\b/.test(lower);
  const hasPlanner   = /\b(?:plan(?:ned|ner)?|this\s+week|my\s+(?:meal\s+)?plan|in\s+my\s+plan|scheduled)\b/.test(lower);
  if (!hasNutrition || !hasPlanner) return null;
  return [
    { capability: "nutrition-discovery", verb: "search", parameters: { query: lower }, confidence: 0.87 },
    { capability: "planner-discovery",   verb: "search", parameters: { query: lower }, confidence: 0.85 },
  ];
};

/** Named household member + Planner: "what can Lilly eat tomorrow?" */
const HOUSEHOLD_MEMBER_PLANNER_COMPOUND: CompoundMatcher = (u, lower, _hints) => {
  // Find a proper person name (capitalized non-sentence-starting word, not a common word)
  const name = extractPersonName(u);
  if (!name) return null;
  // Require the name appears in a name-introduction context (can/for/safe for/suitable for)
  const hasIntro = new RegExp(
    `\\b(?:can|could)\\s+${name}\\b|\\bfor\\s+${name}\\b|\\b${name}\\s+(?:can|eat|have|is|was)\\b`,
    "i",
  ).test(lower);
  if (!hasIntro) return null;
  const hasMealContext = /\b(?:eat|have|dinner|lunch|breakfast|meal|food|tonight|tomorrow|this\s+week|planned|planner)\b/.test(lower);
  if (!hasMealContext) return null;
  return [
    { capability: "household-discovery", verb: "search", parameters: { query: name }, confidence: 0.86 },
    { capability: "planner-discovery",   verb: "search", parameters: { query: lower }, confidence: 0.84 },
  ];
};

/** Planner + Pantry: "do I have the ingredients for this week's meals?" */
const PLANNER_PANTRY_COMPOUND: CompoundMatcher = (_u, lower, _hints) => {
  const hasPlannerSignal      = /\b(?:plan(?:ned|ner)?|this\s+week|my\s+(?:meal\s+)?plan|in\s+my\s+plan|week'?s?\s+meals?|scheduled)\b/.test(lower);
  const hasIngredientOrPantry = /\b(?:ingredients?|stock|have\s+(?:everything|enough|what\s+i\s+need)|what\s+i\s+need|what\s+i\s+have|can\s+i\s+(?:make|cook)|pantry|fridge|freezer|larder|cupboard|at\s+home|in\s+my\s+(?:kitchen|home|house))\b/.test(lower);
  if (!hasPlannerSignal || !hasIngredientOrPantry) return null;
  return [
    { capability: "planner-discovery", verb: "search", parameters: { query: lower }, confidence: 0.84 },
    { capability: "pantry-discovery",  verb: "search", parameters: { query: "" },    confidence: 0.83 },
  ];
};

/** Nutrition + Pantry + Shopping: "what should I buy for low-carb dinners?" */
const NUTRITION_SHOPPING_PANTRY_COMPOUND: CompoundMatcher = (_u, lower, _hints) => {
  const hasBuySignal = /\b(?:buy|shop(?:ping)?|need\s+to\s+get|should\s+i\s+get|what\s+(?:do\s+i\s+need|to\s+buy|to\s+get)|missing|need\s+to\s+stock\s+up)\b/.test(lower);
  const hasNutrition = /\b(?:high[\s-]protein|low[\s-]carb|low[\s-]fat|low[\s-]sugar|healthy|nutritious|under\s+\d+\s*(?:kcal|cal(?:orie)?s?))\b/.test(lower);
  if (!hasBuySignal || !hasNutrition) return null;
  return [
    { capability: "nutrition-discovery", verb: "search", parameters: { query: lower }, confidence: 0.85 },
    { capability: "pantry-discovery",    verb: "search", parameters: { query: "" },    confidence: 0.82 },
    { capability: "shopping-discovery",  verb: "search", parameters: { query: "" },    confidence: 0.80 },
  ];
};

/** Pantry + Nutrition: "what high-protein foods do I have in my fridge?" */
const PANTRY_NUTRITION_COMPOUND: CompoundMatcher = (_u, lower, _hints) => {
  const hasPantry    = /\b(?:pantry|fridge|freezer|larder|cupboard|in\s+my\s+(?:pantry|fridge|freezer)|what\s+(?:do\s+i\s+have|have\s+i\s+got))\b/.test(lower);
  const hasNutrition = /\b(?:high[\s-]protein|low[\s-]carb|low[\s-]fat|low[\s-]sugar|healthy|nutritious|protein|carbs?|under\s+\d+\s*(?:kcal|cal(?:orie)?s?))\b/.test(lower);
  if (!hasPantry || !hasNutrition) return null;
  return [
    { capability: "pantry-discovery",    verb: "search", parameters: { query: lower }, confidence: 0.84 },
    { capability: "nutrition-discovery", verb: "search", parameters: { query: lower }, confidence: 0.82 },
  ];
};

/** Diary + Nutrition: "have I eaten enough protein today?" */
const DIARY_NUTRITION_COMPOUND: CompoundMatcher = (_u, lower, _hints) => {
  const hasDiary     = /\b(?:diary|(?:have\s+i\s+)?(?:eaten|logged|tracked|had\s+today)|what\s+(?:did|have)\s+i\s+(?:eat|log)|my\s+(?:food\s+)?diary|intake)\b/.test(lower);
  const hasNutrition = /\b(?:protein|calories?|carbs?|carbohydrates?|fat|fibre|fiber|nutrients?|enough|intake|macros?)\b/.test(lower);
  if (!hasDiary || !hasNutrition) return null;
  return [
    { capability: "diary-discovery",     verb: "search", parameters: { query: "" },    confidence: 0.84 },
    { capability: "nutrition-discovery", verb: "search", parameters: { query: lower }, confidence: 0.82 },
  ];
};

const ALL_COMPOUND_MATCHERS: CompoundMatcher[] = [
  NUTRITION_DISCOVERY_PLANNER_COMPOUND,
  HOUSEHOLD_MEMBER_PLANNER_COMPOUND,
  PLANNER_PANTRY_COMPOUND,
  NUTRITION_SHOPPING_PANTRY_COMPOUND,
  PANTRY_NUTRITION_COMPOUND,
  DIARY_NUTRITION_COMPOUND,
];

// ---------------------------------------------------------------------------
// All specific matchers in priority order
// ---------------------------------------------------------------------------

const ALL_SPECIFIC_MATCHERS: Matcher[] = [
  // Nutrition knowledge — most specific first (nutrient/benefit guards fire before foodExplain)
  ...NUTRITION_NUTRIENT_MATCHERS,          // INT26: nutrient-named queries (read/search)
  ...NUTRITION_BENEFIT_EXPLAIN_MATCHERS,   // INT26: benefit concept queries (explain {benefitSlug})
  ...NUTRITION_EXPLAIN_MATCHERS,           // existing: food-benefit explain (explain {foodSlug})
  ...NUTRITION_BENEFIT_FOODS_MATCHERS,     // existing: benefit→foods search
  ...NUTRITION_FOOD_DETAIL_MATCHERS,       // existing: food detail read (scope:food)
  ...NUTRITION_GENERAL_EXPLAIN_MATCHERS,   // INT26: generic "tell me about food" (lowest confidence)
  ...NUTRITION_KNOWLEDGE_SEARCH_MATCHERS,  // INT26: open nutrient/benefit search
  // Nutrition discovery — macro-filtered meal search (INT27)
  ...NUTRITION_DISCOVERY_MATCHERS,
  // Planner discovery — search for meals within the planner (INT28)
  ...PLANNER_DISCOVERY_MATCHERS,
  // Household discovery — search members, dietary preferences, allergens (INT29)
  ...HOUSEHOLD_DISCOVERY_MATCHERS,
  // Shopping discovery — search shopping list items by name or category (INT30)
  ...SHOPPING_DISCOVERY_MATCHERS,
  // Pantry discovery — search pantry items by name or ingredient key (INT31)
  ...PANTRY_DISCOVERY_MATCHERS,
  // Diary discovery — search food diary entries by food name (INT32)
  ...DIARY_DISCOVERY_MATCHERS,
  // All other capabilities
  ...PLANNER_MATCHERS,
  ...SHOPPING_MATCHERS,
  ...PANTRY_MATCHERS,
  ...DIARY_MATCHERS,
  ...HOUSEHOLD_MATCHERS,
  ...MEAL_DISCOVERY_MATCHERS,
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
    // INT35 (INT34 G1/G2): "meal(s)" added — it was absent from every fallback, so
    // any meal-noun query without a specific pattern match had zero capability coverage.
    // Confidence sits BELOW the profile always-on (0.50): this entry is a coverage
    // floor for otherwise-unmatched meal queries, and must never displace the
    // personalisation baseline from the MAX_INTENTS cap when specific matchers fired.
    pattern: /\b(?:recipes?|meals?|cook|dish(?:es)?|ingredients?)\b/i,
    capability: "meals",
    parameters: { scope: "summary" },
    confidence: 0.48,
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

    // INT35: true once any UTTERANCE-DERIVED signal fires (steps 0, 1, 3). The
    // surface-primary (step 2) and profile always-on (step 4) are context, not
    // understanding — when nothing utterance-derived fires, the resolution is
    // marked unrecognised so the gateway can respond "did not understand"
    // instead of a generic non-answer.
    let understood = false;

    // 0. Compound matchers (INT33) — cross-domain questions, run before single-domain.
    //    Each matcher returns 2–3 intents for distinct capabilities; all enter the pool.
    //    Deduplication (step 5) keeps the highest-confidence intent per capability, so
    //    a higher-confidence single-domain match below will override a compound match
    //    for the same capability when the question is genuinely single-domain.
    for (const matcher of ALL_COMPOUND_MATCHERS) {
      const results = matcher(utterance, lower, hints);
      if (results !== null) {
        understood = true;
        for (const r of results) collected.push(r);
      }
    }

    // 1. Specific pattern matchers (high confidence)
    for (const matcher of ALL_SPECIFIC_MATCHERS) {
      const result = matcher(utterance, lower, hints);
      if (result !== null) {
        understood = true;
        collected.push(result);
      }
    }

    // 2. Surface-based primary capability (medium confidence)
    const primaryCap = SURFACE_CAP[hints.surface];
    if (primaryCap) {
      collected.push(buildSurfacePrimary(primaryCap, hints));
    }

    // 3. Keyword fallbacks (lower confidence)
    for (const fb of KEYWORD_FALLBACKS) {
      if (fb.pattern.test(lower)) {
        understood = true;
        collected.push({
          capability: fb.capability,
          verb: "read",
          parameters: fb.parameters,
          confidence: fb.confidence,
        });
      }
    }

    // 4. Profile — always included for personalisation context. Marked baseline
    //    (INT35): it never counts as understanding the question. When NO
    //    utterance-derived matcher fired, it also carries the "unknown" gap so
    //    the gateway knows the utterance itself was not understood.
    collected.push({
      capability: "profile",
      verb: "read",
      parameters: {},
      confidence: 0.50,
      baseline: true,
      ...(understood ? {} : { gap: { kind: "unknown" as const } }),
    });

    // 5. Deduplicate (keep highest confidence per capability), sort, cap
    return dedupe(collected)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, MAX_INTENTS);
  }
}

/** Production singleton. Inject via constructor for tests. */
export const patternIntentResolver = new PatternIntentResolver();
