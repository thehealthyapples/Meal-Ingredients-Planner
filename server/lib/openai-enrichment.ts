/**
 * OpenAI Ingredient Enrichment Service
 *
 * SECURITY: This module runs server-side only. OPENAI_API_KEY is never
 * sent to or accessible from the client.
 *
 * USAGE RULES:
 *  - Only called when DB has no knowledge entry for a given ingredient_key
 *  - Results are validated before saving; invalid responses are discarded
 *  - Rate limited to MAX_CALLS_PER_MINUTE server-wide
 *  - Locked ('is_locked') entries are never overwritten
 *  - AI must NOT be used for identity resolution or pantry insert logic
 */

export interface EnrichedKnowledge {
  supports: string[];
  highlights?: string[];
  whyItMatters: string;
  goodToKnow?: string;
  howToChoose?: string[];
  tags: string[];
}

// ── Rate limiting (in-memory, server-wide) ────────────────────────────────────

const MAX_CALLS_PER_MINUTE = 20;
const RATE_WINDOW_MS = 60_000;
const callTimestamps: number[] = [];

function withinRateLimit(): boolean {
  const now = Date.now();
  // Slide window — drop timestamps older than 60 s
  while (callTimestamps.length > 0 && callTimestamps[0] < now - RATE_WINDOW_MS) {
    callTimestamps.shift();
  }
  if (callTimestamps.length >= MAX_CALLS_PER_MINUTE) return false;
  callTimestamps.push(now);
  return true;
}

// ── Safety validation ─────────────────────────────────────────────────────────

const BANNED = [
  /\bprevents?\b/i,
  /\bcures?\b/i,
  /\btreats?\b/i,
  /\bheals?\b/i,
  /\bfights?\s+disease\b/i,
  /\breduces?\s+risk\b/i,
  /\bprotects?\s+against\b/i,
  /\bproven\s+to\b/i,
  /\bclinical\b/i,
  /\bmedical\b/i,
  /\bdiagnos/i,
  /\btherapeutic\b/i,
  /\bsupplement\b/i,
  /\bsuperfood\b/i,
  /\b(top|best|#1|number\s*one)\b/i,
];

const MAX_HIGHLIGHT_WORDS = 8;
const NUMERIC = /\d+\s*(mg|g\b|mcg|iu|%|calories|kcal|kj)/i;
const MAX_TEXT = 160;
const MAX_SUPPORTS = 3;
const MAX_HOW_TO = 4;
const MAX_TAGS = 4;

function safeText(s: unknown): string | null {
  if (typeof s !== "string" || !s.trim()) return null;
  const t = s.trim();
  if (t.length > MAX_TEXT) return null;
  if (NUMERIC.test(t)) return null;
  if (BANNED.some(p => p.test(t))) return null;
  return t;
}

function safeArray(arr: unknown, limit: number): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(safeText)
    .filter((s): s is string => s !== null)
    .slice(0, limit);
}

function safeHighlight(s: unknown): string | null {
  if (typeof s !== "string" || !s.trim()) return null;
  const t = s.trim();
  if (t.length > MAX_TEXT) return null;
  if (t.split(/\s+/).length > MAX_HIGHLIGHT_WORDS) return null;
  if (NUMERIC.test(t)) return null;
  if (BANNED.some(p => p.test(t))) return null;
  return t;
}

function validate(raw: unknown): EnrichedKnowledge | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;

  const supports = safeArray(d.supports, MAX_SUPPORTS);
  if (supports.length === 0) return null;

  const whyItMatters = safeText(d.whyItMatters);
  if (!whyItMatters) return null;

  const highlights = Array.isArray(d.highlights)
    ? d.highlights.map(safeHighlight).filter((s): s is string => s !== null).slice(0, 3)
    : undefined;

  const goodToKnow   = safeText(d.goodToKnow)   ?? undefined;
  const howToChoose  = safeArray(d.howToChoose, MAX_HOW_TO);
  const tags         = safeArray(d.tags, MAX_TAGS).map(t => t.toLowerCase());

  return {
    supports,
    highlights: highlights && highlights.length > 0 ? highlights : undefined,
    whyItMatters,
    goodToKnow,
    howToChoose: howToChoose.length > 0 ? howToChoose : undefined,
    tags,
  };
}

// ── Prompt ────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a food knowledge assistant for The Healthy Apples, a UK family meal planning app.
Generate brief, human-readable nutritional context for a single food ingredient.

STRICT RULES — violations cause the whole response to be discarded:
- No medical claims. Never use: prevents, cures, treats, heals, fights disease, reduces risk, protects against, proven to, clinical, therapeutic.
- No numbers or units (no mg, g, %, kcal, IU, etc.).
- Maximum 15 words per sentence.
- Warm, supportive, food-first tone. UK English (aubergine not eggplant, courgette not zucchini).
- Use phrases like "can support", "often used for", "tends to", "works well in".
- Return ONLY valid JSON. No markdown, no explanation, no extra text.`;

function userPrompt(ingredientKey: string): string {
  return `Generate pantry knowledge for: "${ingredientKey}"

Return this exact JSON:
{
  "supports": ["phrase", "phrase"],
  "highlights": ["short phrase", "short phrase"] or null,
  "whyItMatters": "one sentence",
  "goodToKnow": "one sentence or null",
  "howToChoose": ["tip", "tip"] or null,
  "tags": ["tag", "tag"]
}

Fields:
- supports: 2–3 short phrases (e.g. "Healthy fats", "Plant protein")
- highlights: 1–3 standout nutritional qualities, max 8 words each (e.g. "Rich in polyphenols", "Naturally high in lycopene", "High in fibre"). Use descriptive phrases only — no rankings, no comparisons, no superlatives (never "top", "best", "#1", "superfood"). Null if nothing standout.
- whyItMatters: 1 sentence — why this ingredient is worth having
- goodToKnow: 1 practical sentence, or null if nothing notable
- howToChoose: 2–4 buying tips, or null if not applicable
- tags: 2–4 lowercase tags (e.g. "gut health", "omega-3", "whole grain")`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate enriched knowledge for an ingredient key.
 * Returns null if the key is unknown, rate limited, or the AI response fails
 * validation — callers should treat null as "no knowledge available".
 *
 * This function must only be called from server-side code.
 */
export async function enrichIngredient(
  ingredientKey: string,
): Promise<EnrichedKnowledge | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("[Enrichment] OPENAI_API_KEY not set — skipping enrichment");
    return null;
  }

  if (!withinRateLimit()) {
    console.warn(`[Enrichment] Rate limit reached — skipping "${ingredientKey}"`);
    return null;
  }

  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let raw: unknown;
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userPrompt(ingredientKey) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 400,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn(`[Enrichment] Empty response for "${ingredientKey}"`);
      return null;
    }
    raw = JSON.parse(content);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Enrichment] OpenAI call failed for "${ingredientKey}":`, msg);
    return null;
  }

  const validated = validate(raw);
  if (!validated) {
    console.warn(`[Enrichment] Validation failed for "${ingredientKey}":`, raw);
    return null;
  }

  console.log(`[Enrichment] ✓ enriched "${ingredientKey}" (${validated.supports.join(", ")})`);
  return validated;
}
