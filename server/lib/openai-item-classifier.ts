/**
 * OpenAI Item Classification Service
 *
 * SECURITY: server-side only. OPENAI_API_KEY never reaches the client.
 *
 * RULES:
 *  - Only called when deterministic resolution returns 'other'
 *  - Results validated before use; invalid responses return null
 *  - AI must NOT assign prices, brands, or specific supermarket products
 *  - AI must NOT override high-confidence deterministic data
 *  - Rate-limited independently of the enrichment service
 *
 * CATEGORY CONSTRAINT (strict whitelist + confidence gating):
 *  - AI must return exactly one category from VALID_CATEGORIES, or "unknown"
 *  - AI returns a numeric confidence in [0, 1]
 *  - Anything below CONFIDENCE_THRESHOLD or off-whitelist is rejected → caller treats as unknown
 *  - No "best guess" / silent fallback assignment
 */

// ── Valid categories (strict whitelist; mirrors INGREDIENT_CATEGORIES in ingredient-utils.ts) ──

export const VALID_CATEGORIES = new Set([
  'meat', 'fish', 'dairy', 'eggs', 'produce', 'pantry', 'fruit',
  'grains', 'bakery', 'snacks', 'frozen', 'herbs', 'oils',
  'condiments', 'nuts', 'legumes', 'tinned', 'household', 'ready_meals',
  'drinks',
]);

export const VALID_CATEGORY_LIST = Array.from(VALID_CATEGORIES);

// Confidence threshold for accepting an AI category. Below this → unknown.
export const CONFIDENCE_THRESHOLD = 0.7;

// ── Result type ───────────────────────────────────────────────────────────────

export interface ClassificationResult {
  canonicalName:    string;
  canonicalKey:     string;
  category:         string;        // Always a member of VALID_CATEGORIES (never "unknown")
  subcategory:      string | null;
  aliases:          string[];
  confidence:       number;        // 0..1
  likelyFoodProduct: boolean;
  notes:            string;
}

// ── Rate limiting (in-memory, server-wide) ────────────────────────────────────

const MAX_CALLS_PER_MINUTE = 10;
const RATE_WINDOW_MS = 60_000;
const callTimestamps: number[] = [];

function withinRateLimit(): boolean {
  const now = Date.now();
  while (callTimestamps.length > 0 && callTimestamps[0] < now - RATE_WINDOW_MS) {
    callTimestamps.shift();
  }
  if (callTimestamps.length >= MAX_CALLS_PER_MINUTE) return false;
  callTimestamps.push(now);
  return true;
}

// ── Validation gate ───────────────────────────────────────────────────────────

interface ValidationOutcome {
  result:   ClassificationResult | null;
  reason:   'accepted' | 'unknown' | 'off_whitelist' | 'low_confidence' | 'not_food' | 'malformed';
  rawCategory?:   string;
  rawConfidence?: number;
}

function coerceConfidence(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) {
    if (v >= 0 && v <= 1) return v;
    if (v >= 0 && v <= 100) return v / 100;       // tolerate 0..100
    return null;
  }
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'high')   return 0.9;
    if (s === 'medium') return 0.6;
    if (s === 'low')    return 0.3;
    const n = parseFloat(s);
    if (Number.isFinite(n)) return coerceConfidence(n);
  }
  return null;
}

function validateResult(raw: unknown): ValidationOutcome {
  if (!raw || typeof raw !== 'object') return { result: null, reason: 'malformed' };
  const d = raw as Record<string, unknown>;

  if (typeof d.canonicalName !== 'string' || !d.canonicalName.trim()) {
    return { result: null, reason: 'malformed' };
  }
  if (typeof d.canonicalKey !== 'string' || !d.canonicalKey.trim()) {
    return { result: null, reason: 'malformed' };
  }
  if (typeof d.category !== 'string' || !d.category.trim()) {
    return { result: null, reason: 'malformed' };
  }
  if (typeof d.likelyFoodProduct !== 'boolean') {
    return { result: null, reason: 'malformed' };
  }

  const confidence = coerceConfidence(d.confidence);
  if (confidence === null) return { result: null, reason: 'malformed' };

  const rawCategory = d.category.trim().toLowerCase();

  // Explicit "unknown" from AI is accepted as a signal — caller skips persistence.
  if (rawCategory === 'unknown') {
    return { result: null, reason: 'unknown', rawCategory, rawConfidence: confidence };
  }

  if (!d.likelyFoodProduct) {
    return { result: null, reason: 'not_food', rawCategory, rawConfidence: confidence };
  }

  if (!VALID_CATEGORIES.has(rawCategory)) {
    return { result: null, reason: 'off_whitelist', rawCategory, rawConfidence: confidence };
  }

  if (confidence < CONFIDENCE_THRESHOLD) {
    return { result: null, reason: 'low_confidence', rawCategory, rawConfidence: confidence };
  }

  const name = d.canonicalName.trim();
  if (name.length < 2 || name.length > 80) return { result: null, reason: 'malformed' };
  if (/^\d+$/.test(name) || /[<>{}]/.test(name)) return { result: null, reason: 'malformed' };

  const aliases = Array.isArray(d.aliases)
    ? (d.aliases as unknown[]).filter((a): a is string => typeof a === 'string' && a.trim().length > 0)
    : [];

  return {
    result: {
      canonicalName:     name,
      canonicalKey:      d.canonicalKey.trim().toLowerCase(),
      category:          rawCategory,
      subcategory:       typeof d.subcategory === 'string' && d.subcategory.trim() ? d.subcategory.trim() : null,
      aliases,
      confidence,
      likelyFoodProduct: true,
      notes:             typeof d.notes === 'string' ? d.notes.trim().slice(0, 200) : '',
    },
    reason: 'accepted',
    rawCategory,
    rawConfidence: confidence,
  };
}

// ── Prompt ────────────────────────────────────────────────────────────────────

const CATEGORY_LIST_STR = VALID_CATEGORY_LIST.join(', ');

const SYSTEM_PROMPT = `You are a UK supermarket shopping-list item classifier for The Healthy Apples app.
Given an ingredient or product name, return a strict JSON classification.

HARD RULES — violations cause the entire response to be discarded:
- You MUST assign exactly ONE category from this whitelist:
  [${CATEGORY_LIST_STR}]
- If you are not confident the item belongs to one of these categories, return "unknown".
- Do NOT invent new categories. Do NOT use "other".
- Do NOT guess. If unsure → "unknown".
- Only classify real, purchasable supermarket items (food, drink, household).
- Set likelyFoodProduct: false for nonsense, codes, or clearly non-food items.
- Never invent a price, brand, or specific product SKU.
- Use UK English (crisps not chips, aubergine not eggplant, courgette not zucchini).
- Return ONLY valid JSON. No markdown, no explanation.

Confidence is a number between 0 and 1 reflecting how sure you are of the category.`;

function buildPrompt(itemName: string): string {
  return `Classify this shopping list item: "${itemName}"

Allowed categories: [${CATEGORY_LIST_STR}]
If unsure, set "category": "unknown".

Return exactly this JSON:
{
  "canonicalName": "clean display name (e.g. 'passata', 'dark chocolate')",
  "canonicalKey": "lowercase normalised key (e.g. 'passata', 'dark chocolate')",
  "category": "one of the allowed categories, or 'unknown'",
  "subcategory": "optional finer classification or null",
  "aliases": ["array of common UK name variants"],
  "confidence": 0.0,
  "likelyFoodProduct": true or false,
  "notes": "one-line reason or empty string"
}`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Classify a single item name using OpenAI.
 * Returns null if:
 *   - OPENAI_API_KEY is not set
 *   - Rate limit reached
 *   - AI response fails validation (off-whitelist, low-confidence, "unknown", or malformed)
 *   - Item does not look like a real food/product
 *
 * In all rejection paths the caller should treat the item as unknown
 * (i.e. leave it in needs_review). No silent fallback / best-guess category.
 */
export async function classifyItem(itemName: string): Promise<ClassificationResult | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[Classifier] OPENAI_API_KEY not set — skipping');
    return null;
  }

  const trimmed = itemName.trim();
  if (trimmed.length < 2 || trimmed.length > 120) return null;

  if (!withinRateLimit()) {
    console.warn(`[Classifier] Rate limit reached — skipping "${trimmed}"`);
    return null;
  }

  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let raw: unknown;
  try {
    const response = await client.chat.completions.create({
      model:           'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: buildPrompt(trimmed) },
      ],
      response_format: { type: 'json_object' },
      temperature:     0.1,
      max_tokens:      300,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn(`[Classifier] Empty response for "${trimmed}"`);
      return null;
    }
    raw = JSON.parse(content);
  } catch (err) {
    console.error(`[Classifier] OpenAI call failed for "${trimmed}":`, err instanceof Error ? err.message : err);
    return null;
  }

  const outcome = validateResult(raw);

  // Lightweight, structured logging: input → category → confidence → accepted/rejected
  const cat  = outcome.rawCategory   ?? '(none)';
  const conf = outcome.rawConfidence !== undefined ? outcome.rawConfidence.toFixed(2) : 'n/a';
  if (outcome.reason === 'accepted' && outcome.result) {
    console.log(`[Classifier] input="${trimmed}" category=${cat} confidence=${conf} → ACCEPTED`);
    return outcome.result;
  }

  console.log(`[Classifier] input="${trimmed}" category=${cat} confidence=${conf} → REJECTED (${outcome.reason})`);
  if (outcome.reason === 'malformed') {
    console.warn(`[Classifier] Malformed AI response:`, raw);
  }
  return null;
}
