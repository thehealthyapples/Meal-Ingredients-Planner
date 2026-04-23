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
 */

// ── Valid categories (mirrors INGREDIENT_CATEGORIES in ingredient-utils.ts) ──

export const VALID_CATEGORIES = new Set([
  'meat', 'fish', 'dairy', 'eggs', 'produce', 'pantry', 'fruit',
  'grains', 'bakery', 'snacks', 'frozen', 'herbs', 'oils',
  'condiments', 'nuts', 'legumes', 'tinned', 'household', 'ready_meals',
]);

// ── Result type ───────────────────────────────────────────────────────────────

export interface ClassificationResult {
  canonicalName:    string;
  canonicalKey:     string;
  category:         string;
  subcategory:      string | null;
  aliases:          string[];
  confidence:       'high' | 'medium' | 'low';
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

function validateResult(raw: unknown): ClassificationResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;

  if (typeof d.canonicalName !== 'string' || !d.canonicalName.trim()) return null;
  if (typeof d.canonicalKey !== 'string' || !d.canonicalKey.trim()) return null;
  if (typeof d.category !== 'string' || !VALID_CATEGORIES.has(d.category)) return null;
  if (d.confidence !== 'high' && d.confidence !== 'medium' && d.confidence !== 'low') return null;
  if (typeof d.likelyFoodProduct !== 'boolean') return null;

  const name = d.canonicalName.trim();
  if (name.length < 2 || name.length > 80) return null;
  // Reject if canonical name is purely numeric or looks like garbage
  if (/^\d+$/.test(name) || /[<>{}]/.test(name)) return null;

  const aliases = Array.isArray(d.aliases)
    ? (d.aliases as unknown[]).filter((a): a is string => typeof a === 'string' && a.trim().length > 0)
    : [];

  return {
    canonicalName:     name,
    canonicalKey:      d.canonicalKey.trim().toLowerCase(),
    category:          d.category,
    subcategory:       typeof d.subcategory === 'string' && d.subcategory.trim() ? d.subcategory.trim() : null,
    aliases,
    confidence:        d.confidence,
    likelyFoodProduct: d.likelyFoodProduct,
    notes:             typeof d.notes === 'string' ? d.notes.trim().slice(0, 200) : '',
  };
}

// ── Prompt ────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a UK supermarket shopping-list item classifier for The Healthy Apples app.
Given an ingredient or product name, return a strict JSON classification.

HARD RULES — violations cause the entire response to be discarded:
- Only classify real, purchasable supermarket items (food, drink, household).
- Set likelyFoodProduct: false for nonsense, codes, or clearly non-food items.
- Never invent a price, brand, or specific product SKU.
- Never use category "other" — pick the closest valid category or return likelyFoodProduct: false.
- Use UK English (crisps not chips, aubergine not eggplant, courgette not zucchini).
- Return ONLY valid JSON. No markdown, no explanation.

Valid categories: meat, fish, dairy, eggs, produce, pantry, fruit, grains, bakery, snacks, frozen, herbs, oils, condiments, nuts, legumes, tinned, household`;

function buildPrompt(itemName: string): string {
  return `Classify this shopping list item: "${itemName}"

Return exactly this JSON:
{
  "canonicalName": "clean display name (e.g. 'passata', 'dark chocolate')",
  "canonicalKey": "lowercase normalised key (e.g. 'passata', 'dark chocolate')",
  "category": "one valid category from the list above",
  "subcategory": "optional finer classification or null",
  "aliases": ["array of common UK name variants"],
  "confidence": "high | medium | low",
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
 *   - AI response fails validation
 *   - Item does not look like a real food/product
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

  const validated = validateResult(raw);
  if (!validated) {
    console.warn(`[Classifier] Validation failed for "${trimmed}":`, raw);
    return null;
  }

  console.log(`[Classifier] ✓ "${trimmed}" → ${validated.category}/${validated.canonicalName} (${validated.confidence})`);
  return validated;
}
