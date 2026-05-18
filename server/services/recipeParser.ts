// ── Destination-led scan types ───────────────────────────────────────────────

export type ScanMode = "shopping_list" | "recipe" | "planner";

export interface ScannedShoppingItem {
  rawText: string;
  normalizedName: string;
  quantity: number | null;
  unit: string | null;
  uncertain: boolean;
  normalisationApplied: boolean;
}

export interface ScannedIngredient {
  rawText: string;
  quantity: string | null;
  unit: string | null;
  name: string;
  struckThrough: boolean;
  uncertain: boolean;
}

export interface ScannedStep {
  rawText: string;
  stepNumber: number;
  uncertain: boolean;
}

export interface ScannedMealCandidate {
  label: string;
  interpretedName?: string;
  day: string | null;
  mealSlot: string | null;
  confidence: "low" | "medium" | "high";
  sourceText?: string;
  proposedType?: "scheduled" | "meal_idea" | "unknown";
  contextNote?: string;
}

export interface ScannedPlannerShoppingItem {
  label: string;
  quantity: string | null;
  confidence: "low" | "medium" | "high";
  sourceText?: string;
}

export type DestinationParsed =
  | {
      mode: "shopping_list";
      items: ScannedShoppingItem[];
    }
  | {
      mode: "recipe";
      title: string | null;
      servings: number | null;
      ingredients: ScannedIngredient[];
      steps: ScannedStep[];
      warnings: string[];
    }
  | {
      mode: "planner";
      meals: ScannedMealCandidate[];
      shoppingItems: ScannedPlannerShoppingItem[];
      warnings: string[];
    };

// ── Vision-first prompts (image → structured JSON with rawText) ───────────────

const SHOPPING_LIST_VISION_PROMPT = `Look at this image of a shopping list and extract every item visible.
Return ONLY valid JSON in this exact shape:
{"mode":"shopping_list","rawText":"all text visible in the image transcribed exactly","items":[{"rawText":"exactly what you see","normalizedName":"generic ingredient name","quantity":null,"unit":null,"uncertain":false,"normalisationApplied":false}]}

Rules:
- rawText (top level): transcribe every word you can read in the image
- rawText (per item): copy the item text EXACTLY as written
- normalizedName: generic name (e.g. "Stokes Mayo"→"mayonnaise", "Passata"→"passata")
- If normalizedName differs from rawText set normalisationApplied:true
- Tally marks IIII or //// are quantities — convert (III=3, IIII=4)
- "Passata III" → normalizedName:"passata", quantity:3
- uncertain:true if you cannot read the item clearly due to handwriting, shadow, or blur
- Do NOT invent items not visible in the image
- Do NOT add prices, store names, or product codes
- Return only JSON, no markdown`;

const RECIPE_VISION_PROMPT = `Look at this image of a recipe and extract the recipe structure.
Return ONLY valid JSON in this exact shape:
{"mode":"recipe","rawText":"all text visible in the image transcribed exactly","title":null,"servings":null,"ingredients":[{"rawText":"exactly what you see","quantity":null,"unit":null,"name":"ingredient name","struckThrough":false,"uncertain":false}],"steps":[{"rawText":"exactly what you see","stepNumber":1,"uncertain":false}],"warnings":[]}

Rules:
- rawText (top level): transcribe every word you can read in the image
- rawText (per ingredient/step): copy the text EXACTLY as it appears
- struckThrough:true if the ingredient appears struck-through or crossed out
- uncertain:true if text is unclear, partially obscured, or ambiguous
- If a quantity is missing or unclear set quantity to null and uncertain to true
- Do NOT invent ingredients or steps not visible in the image
- If the image shows steps only with no ingredient section, return ingredients:[] and add a warning
- warnings: plain-text concerns (e.g. "Some quantities appear missing", "Steps only — no ingredients found")
- Return only JSON, no markdown`;

// ── OCR-fallback text prompts (text → structured JSON, no rawText field) ──────

const SHOPPING_LIST_TEXT_PROMPT = `You are a shopping list reader. Given OCR text from a shopping list image, extract items.
Return ONLY valid JSON in this exact shape:
{"mode":"shopping_list","items":[{"rawText":"exactly what you read","normalizedName":"generic ingredient name","quantity":null,"unit":null,"uncertain":false,"normalisationApplied":false}]}

Rules:
- rawText: copy the text EXACTLY as it appears in the OCR output
- normalizedName: generic ingredient name (e.g. "Stokes Mayo"→"mayonnaise")
- If normalizedName differs from rawText set normalisationApplied:true
- Tally marks IIII or //// are quantities — convert them
- "Passata III" → normalizedName:"passata", quantity:3
- uncertain:true if the text is garbled or unclear
- Do NOT invent items
- Do NOT add prices, store names, or product codes
- Return only JSON, no markdown`;

const RECIPE_TEXT_PROMPT = `You are a recipe reader. Given OCR text from a recipe image, extract the recipe structure.
Return ONLY valid JSON in this exact shape:
{"mode":"recipe","title":null,"servings":null,"ingredients":[{"rawText":"exactly what you read","quantity":null,"unit":null,"name":"ingredient name","struckThrough":false,"uncertain":false}],"steps":[{"rawText":"exactly what you read","stepNumber":1,"uncertain":false}],"warnings":[]}

Rules:
- rawText: copy each ingredient/step EXACTLY as it appears in the OCR
- struckThrough:true if struck-through formatting is detectable in OCR
- uncertain:true if text is garbled or unclear
- If a quantity is missing set quantity to null and uncertain to true
- Do NOT invent ingredients or steps
- If there are steps only and no ingredients, return ingredients:[] and add a warning
- warnings: plain-text concerns
- Return only JSON, no markdown`;

// ── Planner prompts and constants ────────────────────────────────────────────

const VALID_PLANNER_DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const VALID_MEAL_SLOTS = ["breakfast","lunch","dinner","snacks"];

const PLANNER_VISION_PROMPT = `Look at this image of a meal plan (weekly planner, meal schedule, or similar document). Your task is to extract every visible meal entry, combining printed row anchors with any nearby handwritten context to produce the most helpful interpretation for a household cook.

Return ONLY valid JSON in this exact shape:
{"mode":"planner","rawText":"all text visible in the image transcribed exactly","meals":[{"label":"exact text as written","interpretedName":"full interpreted meal name including contextual additions","day":null,"mealSlot":null,"proposedType":"scheduled","confidence":"high","sourceText":"the exact line it appears on","contextNote":null}],"shoppingItems":[],"warnings":[]}

CORE INTERPRETATION RULES:

1. CONTEXTUAL GROUPING
Look for handwritten text that appears near, beside, below, or adjacent to a printed row header — in the same cell, same row, or spatially close. These are likely meal modifications, side dish notes, or additions. Combine them with the printed row anchor into a richer interpretedName.
Examples:
- Printed "Fish cakes" + nearby handwritten "new pots salad" → interpretedName: "Fish cakes with new potatoes and salad"
- Printed "Chicken noodles" + nearby handwritten "stir fry veg" → interpretedName: "Chicken noodle stir fry with vegetables"
- Printed "Bean casserole" + nearby "w/ wraps" → interpretedName: "Bean casserole with wraps"
- Printed "Veg fried rice" + nearby "chick pea sw pot" → interpretedName: "Chickpea and sweet potato curry with rice"

2. SEMANTIC SHORTHAND EXPANSION
Expand common household cooking shorthand in interpretedName (never in label, which stays exact):
- "new pots" → "new potatoes"
- "sw pot", "sweet pot", or "swp" → "sweet potato"
- "pots" (standalone, clear context) → "potatoes"
- "h/m" or "hm" (before a food type) → "homemade"
- "avo" → "avocado"
- "yog" → "yogurt"
- "spag" → "spaghetti"
- "chick" (before a dish type) → "chicken"
- "veg" → "vegetables" or "vegetable" depending on context
- "chick pea" → "chickpeas"
- "w/" → "with"
- Other clear shorthand → expand to the full word

CAUTION — NEVER SUBSTITUTE UNKNOWN WORDS:
- If a word is unusual, foreign, or you are not certain of its meaning, keep it verbatim in interpretedName
- Examples of words to NEVER change: "army rice" stays "army rice", "tarte" stays "tarte", "jerk" stays "jerk", unusual regional terms stay as-is
- Only expand shorthand when you are highly confident of the intended meaning
- When uncertain about a word or expansion, keep the original and set confidence to "medium" or "low"

3. LAYOUT-AWARE INTERPRETATION
Use the table/grid structure, row alignment, cell boundaries, and spatial position to determine which handwritten notes belong to which printed meal row. Handwriting inside the same cell or immediately adjacent to a printed entry is part of that meal.

4. MEAL RECONSTRUCTION
When a printed row title plus nearby handwritten context together suggest a complete meal, reconstruct the full meal name. Aim for natural plain-English that a household cook would recognise.

5. CONFIDENCE CALIBRATION FOR INTERPRETATIONS
- "high": printed row + clearly readable nearby context; combination is unambiguous
- "medium": combination is likely correct but some handwriting is partially unclear or context is slightly ambiguous; also use "medium" when a shorthand expansion is probable but not certain
- "low": handwriting unclear, context uncertain, or interpretation is speculative — stay closer to raw text in interpretedName; also use "low" when an unusual or foreign word is kept as-is because its meaning cannot be confidently determined

6. contextNote field (optional short string, or null)
When you use contextual grouping or semantic expansion, set contextNote to a brief note explaining the interpretation basis. Examples:
- "Combined with nearby handwritten 'new pots salad'"
- "Expanded shorthand: sw pot → sweet potato"
- "Nearby note 'w/ wraps' added"
Set to null when label and interpretedName are identical or no contextual reasoning was needed.

SAFETY LIMITS — NEVER:
- Invent ingredients with no textual basis anywhere near the meal row
- Fabricate weekday names not visible in the image
- Create meals not hinted at by visible text
- Treat shopping list items (if in a separate section) as meal modifications

Other fields:
- rawText (top level): transcribe every word visible in the image
- label: copy the meal text EXACTLY as written, preserving abbreviations and typos
- day: ONLY set if clearly labelled. Use exactly one of: "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday". If the plan uses week numbers (e.g. "Week 6") instead of weekdays, set day to null.
- mealSlot: ONLY if clearly labelled: "breakfast","lunch","dinner","snacks". Otherwise null.
- proposedType: classify based on position in the image:
  - "scheduled": under a weekday header or in a day-column grid
  - "meal_idea": in a standalone list with no day assignment. CRITICAL: If you see section headings like "Lunches", "Lunch ideas", "Packed lunches", "Easy meals", "Flexible meals", "Snacks", "Meal ideas" — ALL items under that heading MUST be "meal_idea", regardless of nearby text. Handwritten lists separate from the main grid also qualify. If a "Lunches" or similar section appears anywhere in the image, extract EVERY item in that section as a separate meal entry with proposedType:"meal_idea" and day:null.
  - "unknown": cannot determine
- EXAMPLE of standalone section: if the image has a "Lunches:" heading followed by "Ham sandwich, Jacket potato, Pasta salad" — these must each be a separate meal entry with proposedType:"meal_idea" and day:null. Do NOT omit them.
- sourceText: the exact line(s) from the image where this meal appears
- shoppingItems: ONLY if the image contains a clearly separate shopping list section: {"label":"item as written","quantity":null,"confidence":"high","sourceText":"exact line"}. Use [] if no shopping section.
- NEVER add prices, store names, or product codes
- warnings: note layout ambiguities, unclear handwriting, or uncertain interpretations
- Return only JSON, no markdown`;

const PLANNER_TEXT_PROMPT = `You are a meal planner reader with contextual interpretation capability. Given OCR text from a meal plan image, extract every visible meal entry. Expand abbreviations and combine related text fragments to produce human-readable meal names.

Return ONLY valid JSON in this exact shape:
{"mode":"planner","meals":[{"label":"exact text as read","interpretedName":"full interpreted meal name","day":null,"mealSlot":null,"proposedType":"scheduled","confidence":"high","sourceText":"the relevant line","contextNote":null}],"shoppingItems":[],"warnings":[]}

INTERPRETATION RULES:
- label: copy the meal text EXACTLY as it appears in the OCR, preserving abbreviations
- interpretedName: expand shorthand and combine context to produce a full meal name:
  - "new pots" → "new potatoes"
  - "sw pot", "sweet pot", or "swp" → "sweet potato"
  - "pots" (standalone, clear context) → "potatoes"
  - "h/m" or "hm" (before a food type) → "homemade"
  - "avo yog" → "avocado and yogurt"
  - "spag" → "spaghetti"
  - "chick" (before a dish type) → "chicken"
  - "veg" → "vegetables"
  - "chick pea" → "chickpeas"
  - "w/" → "with"
  - When a short note or side dish appears on the same OCR line or immediately after a meal header (separated by slash, comma, dash, or line break within the same table row), combine them: e.g. "Fish cakes / new pots salad" → "Fish cakes with new potatoes and salad"
  - If label is already a clear full meal name, use the same value in interpretedName
  - Never invent meals not hinted at by the text
  - CAUTION: if a word is unusual, foreign, or you are not certain of its meaning, keep it verbatim — do NOT substitute. Examples: "army rice" stays "army rice"; "tarte" stays "tarte". Only expand shorthand you are highly confident about. When uncertain, keep the original word and set confidence to "medium" or "low".
- contextNote: brief explanation when contextual grouping or shorthand expansion was used (e.g. "Expanded: new pots → new potatoes", "Combined side dish note"). Set to null when no interpretation was needed.
- day: ONLY set if clearly present. Use exactly: "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday". Set to null if not present.
- mealSlot: ONLY if clearly present ("breakfast","lunch","dinner","snacks"). Set to null if not clear.
- proposedType: classify based on position:
  - "scheduled": under a day heading
  - "meal_idea": standalone list with no day — IMPORTANT: items under headings like "Lunches", "Lunch ideas", "Packed lunches", "Easy meals", "Snacks", "Meal ideas" must all be "meal_idea"
  - "unknown": unclear
- confidence: "high" if interpretation is clear and obvious; "medium" if likely but some ambiguity; "low" if garbled, uncertain, or speculative
- sourceText: the relevant OCR line(s)
- NEVER invent days or meals not present in the text
- If text contains week numbers ("Week 3", "Week 6") instead of weekday names, add a warning and set day:null for all meals
- shoppingItems: extract separately if a shopping list section is clearly visible in the OCR; use [] if not
- NEVER add prices, store names, or product codes
- warnings: note any interpretation uncertainties or OCR quality issues
- Return only JSON, no markdown`;

// ── Vision extraction (image → structured result + rawText) ──────────────────

interface VisionRawResult {
  parsed: DestinationParsed | null;
  rawText: string;
  truncated?: boolean;
}

async function extractWithVision(
  imageBuffer: Buffer,
  mimeType: string,
  mode: ScanMode
): Promise<VisionRawResult | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const prompt = mode === "shopping_list" ? SHOPPING_LIST_VISION_PROMPT
    : mode === "planner" ? PLANNER_VISION_PROMPT
    : RECIPE_VISION_PROMPT;
  const b64 = imageBuffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${b64}`;

  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const t0 = Date.now();
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        },
      ],
      temperature: 0,
      max_tokens: mode === "planner" ? 4096 : 2000,
    });
    const usage = response.usage;
    const finishReason = response.choices[0]?.finish_reason;
    const completionTokens = usage?.completion_tokens ?? 0;
    const tokenLimit = mode === "planner" ? 4096 : 2000;
    console.log(`[scan-timing] vision-${mode} duration=${Date.now() - t0}ms promptTokens=${usage?.prompt_tokens ?? "?"} completionTokens=${completionTokens}`);
    if (process.env.NODE_ENV !== "production") {
      console.log(`[planner-scan-debug] vision-api-response mode=${mode} finish_reason=${finishReason} completionTokens=${completionTokens}/${tokenLimit} hitLimit=${completionTokens >= tokenLimit - 50}`);
    }

    if (finishReason === "length" && mode === "planner") {
      console.error(`[recipeParser] Vision truncated mode=${mode} completionTokens=${completionTokens}/${tokenLimit} — returning truncated sentinel`);
      if (process.env.NODE_ENV !== "production") {
        console.log(`[planner-scan-debug] vision-TRUNCATED mode=${mode} completionTokens=${completionTokens}/${tokenLimit}`);
      }
      return { parsed: null, rawText: "", truncated: true };
    }

    const raw = response.choices[0]?.message?.content?.trim() ?? "";
    if (process.env.NODE_ENV !== "production") {
      console.log(`[planner-scan-debug] vision-raw-response mode=${mode} rawChars=${raw.length}`);
    }
    // Strip markdown code fences if model wraps response despite instruction
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(clean);
    } catch {
      console.error(`[recipeParser] Vision JSON parse failed mode=${mode} finish_reason=${finishReason} completionTokens=${completionTokens} raw="${raw.slice(0, 200)}"`);
      if (process.env.NODE_ENV !== "production") {
        console.log(`[planner-scan-debug] vision-json-parse-FAILED mode=${mode} finish_reason=${finishReason} completionTokens=${completionTokens}`);
      }
      return null;
    }

    if (!parsed || typeof parsed !== "object") return null;

    const rawText: string = typeof parsed.rawText === "string" ? parsed.rawText : "";

    if (mode === "shopping_list" && parsed.mode === "shopping_list" && Array.isArray(parsed.items)) {
      return { parsed: parsed as DestinationParsed, rawText };
    }
    if (mode === "recipe" && parsed.mode === "recipe") {
      const result: DestinationParsed = {
        mode: "recipe",
        title: parsed.title ?? null,
        servings: typeof parsed.servings === "number" ? parsed.servings : null,
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
        steps: Array.isArray(parsed.steps) ? parsed.steps : [],
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      };
      return { parsed: result, rawText };
    }
    if (mode === "planner" && parsed.mode === "planner") {
      if (process.env.NODE_ENV !== "production") {
        const rawMealCount = Array.isArray(parsed.meals) ? parsed.meals.length : 0;
        const rawIdeaCount = Array.isArray(parsed.meals) ? parsed.meals.filter((m: any) => m.proposedType === "meal_idea").length : 0;
        const rawShopCount = Array.isArray(parsed.shoppingItems) ? parsed.shoppingItems.length : 0;
        console.log(`[planner-scan-debug] vision-pre-validation rawMeals=${rawMealCount} rawMealIdeas=${rawIdeaCount} rawShoppingItems=${rawShopCount} finish_reason=${finishReason}`);
      }
      const VALID_PROPOSAL_TYPES = ["scheduled", "meal_idea", "unknown"] as const;
      const meals: ScannedMealCandidate[] = Array.isArray(parsed.meals)
        ? parsed.meals.map((m: any) => ({
            label: typeof m.label === "string" ? m.label : String(m.label ?? ""),
            interpretedName: typeof m.interpretedName === "string" && m.interpretedName.trim() ? m.interpretedName.trim() : undefined,
            day: typeof m.day === "string" && VALID_PLANNER_DAYS.includes(m.day) ? m.day : null,
            mealSlot: typeof m.mealSlot === "string" && VALID_MEAL_SLOTS.includes(m.mealSlot) ? m.mealSlot : null,
            confidence: (["low","medium","high"] as const).includes(m.confidence) ? m.confidence : "low",
            sourceText: typeof m.sourceText === "string" ? m.sourceText : undefined,
            proposedType: VALID_PROPOSAL_TYPES.includes(m.proposedType) ? m.proposedType : undefined,
            contextNote: typeof m.contextNote === "string" && m.contextNote.trim() ? m.contextNote.trim() : undefined,
          }))
        : [];
      const shoppingItems: ScannedPlannerShoppingItem[] = Array.isArray(parsed.shoppingItems)
        ? parsed.shoppingItems.map((i: any) => ({
            label: typeof i.label === "string" ? i.label : String(i.label ?? ""),
            quantity: typeof i.quantity === "string" ? i.quantity : null,
            confidence: (["low","medium","high"] as const).includes(i.confidence) ? i.confidence : "low",
            sourceText: typeof i.sourceText === "string" ? i.sourceText : undefined,
          }))
        : [];
      if (process.env.NODE_ENV !== "production") {
        const ideaCount = meals.filter(m => m.proposedType === "meal_idea").length;
        console.log(`[planner-scan-debug] vision-post-validation validatedMeals=${meals.length} validatedMealIdeas=${ideaCount} validatedShoppingItems=${shoppingItems.length}`);
      }
      const result: DestinationParsed = {
        mode: "planner",
        meals,
        shoppingItems,
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      };
      return { parsed: result, rawText };
    }
    return null;
  } catch (err) {
    console.error(`[recipeParser] Vision extraction failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ── OCR-fallback text extraction ──────────────────────────────────────────────

async function extractWithTextAI(text: string, mode: ScanMode): Promise<DestinationParsed | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const systemPrompt = mode === "shopping_list" ? SHOPPING_LIST_TEXT_PROMPT
    : mode === "planner" ? PLANNER_TEXT_PROMPT
    : RECIPE_TEXT_PROMPT;

  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const t0 = Date.now();
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0,
      max_tokens: 2000,
    });
    const usage = response.usage;
    console.log(`[scan-timing] ocr-text-${mode} duration=${Date.now() - t0}ms promptTokens=${usage?.prompt_tokens ?? "?"} completionTokens=${usage?.completion_tokens ?? "?"}`);

    const raw = response.choices[0]?.message?.content?.trim() ?? "";
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(clean);

    if (!parsed || typeof parsed !== "object") return null;

    if (mode === "shopping_list" && parsed.mode === "shopping_list" && Array.isArray(parsed.items)) {
      return parsed as DestinationParsed;
    }
    if (mode === "recipe" && parsed.mode === "recipe") {
      return {
        mode: "recipe",
        title: parsed.title ?? null,
        servings: typeof parsed.servings === "number" ? parsed.servings : null,
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
        steps: Array.isArray(parsed.steps) ? parsed.steps : [],
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      };
    }
    if (mode === "planner" && parsed.mode === "planner") {
      const VALID_PROPOSAL_TYPES = ["scheduled", "meal_idea", "unknown"] as const;
      const meals: ScannedMealCandidate[] = Array.isArray(parsed.meals)
        ? parsed.meals.map((m: any) => ({
            label: typeof m.label === "string" ? m.label : String(m.label ?? ""),
            interpretedName: typeof m.interpretedName === "string" && m.interpretedName.trim() ? m.interpretedName.trim() : undefined,
            day: typeof m.day === "string" && VALID_PLANNER_DAYS.includes(m.day) ? m.day : null,
            mealSlot: typeof m.mealSlot === "string" && VALID_MEAL_SLOTS.includes(m.mealSlot) ? m.mealSlot : null,
            confidence: (["low","medium","high"] as const).includes(m.confidence) ? m.confidence : "low",
            sourceText: typeof m.sourceText === "string" ? m.sourceText : undefined,
            proposedType: VALID_PROPOSAL_TYPES.includes(m.proposedType) ? m.proposedType : undefined,
            contextNote: typeof m.contextNote === "string" && m.contextNote.trim() ? m.contextNote.trim() : undefined,
          }))
        : [];
      return {
        mode: "planner",
        meals,
        shoppingItems: Array.isArray(parsed.shoppingItems)
          ? parsed.shoppingItems.map((i: any) => ({
              label: typeof i.label === "string" ? i.label : String(i.label ?? ""),
              quantity: typeof i.quantity === "string" ? i.quantity : null,
              confidence: (["low","medium","high"] as const).includes(i.confidence) ? i.confidence : "low",
              sourceText: typeof i.sourceText === "string" ? i.sourceText : undefined,
            }))
          : [],
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      };
    }
    return null;
  } catch (err) {
    console.error(`[recipeParser] OCR text AI failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

function buildShoppingListHeuristic(text: string): DestinationParsed {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const items: ScannedShoppingItem[] = lines.map(line => ({
    rawText: line,
    normalizedName: line.toLowerCase().replace(/^\d+\s*[x×]\s*/i, "").trim(),
    quantity: null,
    unit: null,
    uncertain: true,
    normalisationApplied: false,
  }));
  return { mode: "shopping_list", items };
}

function buildRecipeHeuristic(text: string): DestinationParsed {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  let title: string | null = null;
  let servings: number | null = null;
  const ingredients: ScannedIngredient[] = [];
  const steps: ScannedStep[] = [];
  const warnings: string[] = [];

  const servingMatch = text.match(SERVING_PATTERN);
  if (servingMatch) servings = parseInt(servingMatch[1], 10);

  let section: "pre" | "ingredients" | "method" = "pre";
  let stepNum = 1;

  for (const line of lines) {
    if (SERVING_PATTERN.test(line)) continue;
    if (!title) { title = line; continue; }
    if (INGREDIENT_SECTION.test(line)) { section = "ingredients"; continue; }
    if (METHOD_SECTION.test(line)) { section = "method"; continue; }

    const isNumbered = /^\d+[.)]\s+/.test(line);
    const cleanLine = line.replace(/^[-•*\d+.)]\s+/, "").trim();

    if (section === "pre") {
      if (isNumbered) {
        section = "method";
        steps.push({ rawText: line, stepNumber: stepNum++, uncertain: false });
      } else {
        ingredients.push({ rawText: line, quantity: null, unit: null, name: cleanLine, struckThrough: false, uncertain: true });
      }
    } else if (section === "ingredients") {
      if (isNumbered && ingredients.length > 0) {
        section = "method";
        steps.push({ rawText: line, stepNumber: stepNum++, uncertain: false });
      } else {
        ingredients.push({ rawText: line, quantity: null, unit: null, name: cleanLine, struckThrough: false, uncertain: true });
      }
    } else {
      steps.push({ rawText: line, stepNumber: stepNum++, uncertain: false });
    }
  }

  if (ingredients.length === 0 && steps.length > 0) {
    warnings.push("No ingredients found — steps only. Please check the image contains the full recipe.");
  }

  return { mode: "recipe", title, servings, ingredients, steps, warnings };
}

function buildPlannerHeuristic(text: string): DestinationParsed {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const DAY_PATTERN_P = /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
  const SLOT_PATTERN = /^(breakfast|lunch|dinner|snacks?)\s*:?\s*/i;
  const meals: ScannedMealCandidate[] = [];
  const warnings: string[] = [];

  let currentDay: string | null = null;
  let currentSlot: string | null = null;

  for (const line of lines) {
    const dayMatch = line.match(DAY_PATTERN_P);
    if (dayMatch) {
      const matched = VALID_PLANNER_DAYS.find(d => d.toLowerCase() === dayMatch[1].toLowerCase());
      currentDay = matched ?? null;
      const rest = line.slice(dayMatch[0].length).replace(/^[\s:–\-]+/, "").trim();
      if (rest) meals.push({ label: rest, day: currentDay, mealSlot: currentSlot, confidence: "low", sourceText: line });
      continue;
    }
    const slotMatch = line.match(SLOT_PATTERN);
    if (slotMatch) {
      const rawSlot = slotMatch[1].toLowerCase();
      currentSlot = rawSlot === "snack" ? "snacks" : rawSlot;
      const rest = line.slice(slotMatch[0].length).trim();
      if (rest) meals.push({ label: rest, day: currentDay, mealSlot: currentSlot, confidence: "low", sourceText: line });
      continue;
    }
    if (line.length > 2) {
      meals.push({ label: line, day: currentDay, mealSlot: currentSlot, confidence: "low", sourceText: line });
    }
  }

  if (meals.length === 0) {
    warnings.push("No meal entries could be detected. Try a brighter, clearer photo.");
  }

  return { mode: "planner", meals, shoppingItems: [], warnings };
}

export type ExtractionMethod = "vision" | "ocr-fallback" | "failed";
export type ExtractionConfidence = "high" | "medium" | "low" | "none";

function computeConfidence(result: DestinationParsed, mode: ScanMode): ExtractionConfidence {
  if (mode === "shopping_list" && result.mode === "shopping_list") {
    if (result.items.length === 0) return "none";
    const uncertainCount = result.items.filter(i => i.uncertain).length;
    const total = result.items.length;
    if (uncertainCount === 0) return "high";
    if (uncertainCount / total < 0.4) return "medium";
    return "low";
  }
  if (mode === "recipe" && result.mode === "recipe") {
    const hasIngredients = result.ingredients.length > 0;
    const hasSteps = result.steps.length > 0;
    const uncertainCount = result.ingredients.filter(i => i.uncertain).length + result.steps.filter(s => s.uncertain).length;
    const totalItems = result.ingredients.length + result.steps.length;
    const hasWarnings = result.warnings.length > 0;
    if (!hasIngredients && !hasSteps) return "none";
    if (hasIngredients && hasSteps && uncertainCount === 0 && !hasWarnings) return "high";
    if (totalItems > 0 && uncertainCount / totalItems < 0.4 && !hasWarnings) return "medium";
    return "low";
  }
  if (mode === "planner" && result.mode === "planner") {
    if (result.meals.length === 0) return "none";
    const lowCount = result.meals.filter(m => m.confidence === "low").length;
    const total = result.meals.length;
    const hasWarnings = result.warnings.length > 0;
    if (lowCount === 0 && !hasWarnings) return "high";
    if (lowCount / total < 0.4 && !hasWarnings) return "medium";
    return "low";
  }
  return "none";
}

const OCR_FALLBACK_WARNING =
  "We had trouble reaching the AI image service. Results may be less accurate — " +
  "please check each item carefully. If this looks wrong, try retaking the photo in better light.";

const PLANNER_TRUNCATION_WARNING =
  "Detailed planner interpretation was unavailable — THA used a simpler scan result. " +
  "Try retaking the photo in good light.";

export async function extractDestination(
  imageBuffer: Buffer,
  mode: ScanMode,
  mimeType: string = "image/jpeg"
): Promise<{
  result: DestinationParsed | null;
  parsedBy: ExtractionMethod;
  confidence: ExtractionConfidence;
  warnings: string[];
  rawText: string;
}> {
  // ── 1. Vision-first path ────────────────────────────────────────────────────
  const t0 = Date.now();
  console.log(`[scan-timing] vision-attempt mode=${mode} imageBytes=${imageBuffer.length}`);

  let visionResult: VisionRawResult | null = null;
  try {
    visionResult = await extractWithVision(imageBuffer, mimeType, mode);
  } catch (err) {
    console.warn(`[scan-timing] vision-exception mode=${mode} elapsed=${Date.now() - t0}ms err=${err instanceof Error ? err.message : err}`);
  }

  if (visionResult?.truncated && mode === "planner") {
    console.error(`[recipeParser] Vision truncated even at extended budget mode=${mode} — returning failed`);
    if (process.env.NODE_ENV !== "production") {
      console.log(`[planner-scan-debug] extractDestination-vision-TRUNCATED mode=${mode} — parsedBy=failed`);
    }
    return {
      result: null,
      parsedBy: "failed",
      confidence: "none",
      warnings: [PLANNER_TRUNCATION_WARNING],
      rawText: "",
    };
  }

  if (visionResult?.parsed) {
    const confidence = computeConfidence(visionResult.parsed, mode);
    const warnings = (visionResult.parsed.mode === "recipe" || visionResult.parsed.mode === "planner")
      ? visionResult.parsed.warnings : [];
    console.log(`[scan-timing] vision-success mode=${mode} confidence=${confidence} elapsed=${Date.now() - t0}ms`);
    if (process.env.NODE_ENV !== "production" && mode === "planner" && visionResult.parsed.mode === "planner") {
      const ideaCount = visionResult.parsed.meals.filter(m => m.proposedType === "meal_idea").length;
      console.log(`[planner-scan-debug] extractDestination-vision-SUCCESS meals=${visionResult.parsed.meals.length} meal_ideas=${ideaCount} shoppingItems=${visionResult.parsed.shoppingItems.length} confidence=${confidence}`);
      console.log(`[planner-scan-debug] extractDestination-vision-returned { result:{mode:"planner",meals:${visionResult.parsed.meals.length},shoppingItems:${visionResult.parsed.shoppingItems.length},warnings:${visionResult.parsed.warnings.length}}, parsedBy:"vision", confidence:"${confidence}", rawTextChars:${visionResult.rawText?.length ?? 0} }`);
    }
    return {
      result: visionResult.parsed,
      parsedBy: "vision",
      confidence,
      warnings,
      rawText: visionResult.rawText,
    };
  }

  if (process.env.NODE_ENV !== "production" && mode === "planner") {
    console.log(`[planner-scan-debug] extractDestination-vision-NULL — vision returned null, falling to OCR`);
  }
  console.warn(`[scan-timing] vision-failed mode=${mode} elapsed=${Date.now() - t0}ms — starting OCR fallback`);

  // ── 2. OCR fallback path ────────────────────────────────────────────────────
  // Note: Tesseract.js can propagate some errors via process.nextTick for completely
  // invalid buffers, bypassing promise-level catch. Real camera images (valid JPEG/PNG)
  // will always go through the catch path correctly.
  const t_ocr = Date.now();
  let ocrText = "";
  try {
    const { extractTextFromImage } = await import("./ocr");
    const ocrPromise = extractTextFromImage(imageBuffer);
    // Wrap with a timeout so a hung Tesseract worker doesn't block the fallback chain.
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("OCR timeout")), 30_000)
    );
    ocrText = await Promise.race([ocrPromise, timeout]);
    console.log(`[scan-timing] ocr-fallback-complete mode=${mode} elapsed=${Date.now() - t_ocr}ms chars=${ocrText.length}`);
  } catch (err) {
    console.warn(`[scan-timing] ocr-fallback-failed mode=${mode} elapsed=${Date.now() - t_ocr}ms err=${err instanceof Error ? err.message : err}`);
  }

  const fallbackWarnings = [OCR_FALLBACK_WARNING];

  if (!ocrText || ocrText.trim().length < 3) {
    console.warn(`[scan-timing] extraction-failed mode=${mode} totalElapsed=${Date.now() - t0}ms`);
    return {
      result: null,
      parsedBy: "failed",
      confidence: "none",
      warnings: [...fallbackWarnings, "We couldn't read the image. Try a brighter, sharper photo."],
      rawText: ocrText,
    };
  }

  // Try AI text parse on OCR output
  const aiResult = await extractWithTextAI(ocrText, mode);
  if (aiResult) {
    const confidence = computeConfidence(aiResult, mode);
    const parsedWarnings = (aiResult.mode === "recipe" || aiResult.mode === "planner") ? aiResult.warnings : [];
    console.log(`[scan-timing] ocr-fallback-ai-success mode=${mode} confidence=${confidence} totalElapsed=${Date.now() - t0}ms`);
    if (process.env.NODE_ENV !== "production" && mode === "planner" && aiResult.mode === "planner") {
      const ideaCount = aiResult.meals.filter(m => m.proposedType === "meal_idea").length;
      console.log(`[planner-scan-debug] extractDestination-ocr-ai-SUCCESS meals=${aiResult.meals.length} meal_ideas=${ideaCount} shoppingItems=${aiResult.shoppingItems.length} confidence=${confidence}`);
      console.log(`[planner-scan-debug] extractDestination-ocr-ai-returned { result:{mode:"planner",meals:${aiResult.meals.length},shoppingItems:${aiResult.shoppingItems.length},warnings:${aiResult.warnings.length}}, parsedBy:"ocr-fallback", confidence:"${confidence}", rawTextChars:${ocrText.length} }`);
    }
    return {
      result: aiResult,
      parsedBy: "ocr-fallback",
      confidence,
      warnings: [...fallbackWarnings, ...parsedWarnings],
      rawText: ocrText,
    };
  }

  // Heuristic last resort
  console.warn(`[scan-timing] heuristic-fallback mode=${mode} totalElapsed=${Date.now() - t0}ms`);
  const heuristic = mode === "shopping_list"
    ? buildShoppingListHeuristic(ocrText)
    : mode === "planner"
      ? buildPlannerHeuristic(ocrText)
      : buildRecipeHeuristic(ocrText);
  const heuristicWarnings = (heuristic.mode === "recipe" || heuristic.mode === "planner") ? heuristic.warnings : [];
  if (process.env.NODE_ENV !== "production" && mode === "planner" && heuristic.mode === "planner") {
    const ideaCount = heuristic.meals.filter(m => m.proposedType === "meal_idea").length;
    console.log(`[planner-scan-debug] extractDestination-heuristic-FALLBACK meals=${heuristic.meals.length} meal_ideas=${ideaCount} shoppingItems=${heuristic.shoppingItems.length} confidence=low`);
    console.log(`[planner-scan-debug] extractDestination-heuristic-returned { result:{mode:"planner",meals:${heuristic.meals.length},shoppingItems:${heuristic.shoppingItems.length},warnings:${heuristic.warnings.length}}, parsedBy:"ocr-fallback", confidence:"low", rawTextChars:${ocrText.length} }`);
  }
  return {
    result: heuristic,
    parsedBy: "ocr-fallback",
    confidence: "low",
    warnings: [...fallbackWarnings, ...heuristicWarnings],
    rawText: ocrText,
  };
}

// ── Legacy (kept for backward compat) ────────────────────────────────────────
export type ScanResult =
  | {
      type: "recipe";
      title: string;
      servings: number;
      ingredients: string[];
      steps: string[];
      confidence: "high" | "low";
    }
  | {
      type: "meal_plan";
      days: { day: string; meals: string[] }[];
      confidence: "high" | "low";
    }
  | {
      type: "unknown";
      rawText: string;
    };

const DAY_MAP: Record<string, string> = {
  mon: "Monday", monday: "Monday",
  tue: "Tuesday", tuesday: "Tuesday",
  wed: "Wednesday", wednesday: "Wednesday",
  thu: "Thursday", thursday: "Thursday",
  fri: "Friday", friday: "Friday",
  sat: "Saturday", saturday: "Saturday",
  sun: "Sunday", sunday: "Sunday",
};

const DAY_PATTERN = /^(mon|monday|tue|tuesday|wed|wednesday|thu|thursday|fri|friday|sat|saturday|sun|sunday)\b/i;

const INGREDIENT_SECTION = /^(ingredients?|what you('ll)? need)\s*:?\s*$/i;
const METHOD_SECTION = /^(method|steps?|directions?|instructions?|how to make)\s*:?\s*$/i;
const SERVING_PATTERN = /(?:serves?|servings?|makes?)\s*:?\s*(\d+)/i;

function detectMealPlan(lines: string[]): { day: string; meals: string[] }[] | null {
  const days: { day: string; meals: string[] }[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(DAY_PATTERN);
    if (match) {
      const dayKey = match[1].toLowerCase();
      const dayName = DAY_MAP[dayKey];
      const rest = trimmed.slice(match[0].length).replace(/^[\s:–\-]+/, "").trim();
      const meals = rest ? rest.split(/[,|]/).map(m => m.trim()).filter(Boolean) : [];
      if (dayName) days.push({ day: dayName, meals });
    }
  }
  return days.length >= 2 ? days : null;
}

function parseRecipeHeuristic(text: string): Extract<ScanResult, { type: "recipe" }> {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  let title = "";
  let servings = 1;
  const ingredients: string[] = [];
  const steps: string[] = [];

  const servingMatch = text.match(SERVING_PATTERN);
  if (servingMatch) servings = parseInt(servingMatch[1], 10);

  let section: "pre" | "ingredients" | "method" = "pre";

  for (const line of lines) {
    if (!line) continue;

    if (SERVING_PATTERN.test(line)) continue;

    if (!title) {
      title = line.replace(/^recipe\s*:?\s*/i, "").trim();
      continue;
    }

    if (INGREDIENT_SECTION.test(line)) { section = "ingredients"; continue; }
    if (METHOD_SECTION.test(line)) { section = "method"; continue; }

    const isBullet = /^[-•*]\s+/.test(line);
    const isNumbered = /^\d+[.)]\s+/.test(line);
    const cleanLine = line.replace(/^[-•*\d+.)]\s+/, "").trim();

    if (section === "pre") {
      if (isNumbered) { section = "method"; steps.push(cleanLine); }
      else ingredients.push(cleanLine);
    } else if (section === "ingredients") {
      if (isNumbered && ingredients.length > 0) { section = "method"; steps.push(cleanLine); }
      else ingredients.push(cleanLine);
    } else {
      steps.push(cleanLine);
    }
  }

  if (!title) title = "Scanned Recipe";

  const confidence: "high" | "low" =
    title && (ingredients.length >= 2 || steps.length >= 2) ? "high" : "low";

  return { type: "recipe", title, servings, ingredients, steps, confidence };
}

async function parseWithOpenAI(text: string): Promise<ScanResult | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are a structured data extractor. Given OCR text from a recipe or meal plan image, return ONLY valid JSON matching one of these shapes:

Recipe:
{"type":"recipe","title":"string","servings":number,"ingredients":["string"],"steps":["string"],"confidence":"high"|"low"}

Meal plan (if text contains day names with meals):
{"type":"meal_plan","days":[{"day":"Monday","meals":["string"]}],"confidence":"high"|"low"}

Unknown:
{"type":"unknown","rawText":"string"}

Return only the JSON, no markdown, no explanation.`;

    const t0 = Date.now();
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0,
      max_tokens: 1500,
    });
    const usage = response.usage;
    console.log(`[recipe-scan-timing] ai-openai-call duration=${Date.now() - t0}ms model=${response.model} promptTokens=${usage?.prompt_tokens ?? "?"} completionTokens=${usage?.completion_tokens ?? "?"}`);

    const raw = response.choices[0]?.message?.content?.trim() ?? "";
    const parsed = JSON.parse(raw);

    if (
      parsed &&
      typeof parsed === "object" &&
      ["recipe", "meal_plan", "unknown"].includes(parsed.type)
    ) {
      return parsed as ScanResult;
    }
    return null;
  } catch (err) {
    console.error("[recipeParser] OpenAI parse failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export type ParsedBy = "openai" | "heuristic";

export async function parseScannedText(text: string): Promise<{ result: ScanResult; parsedBy: ParsedBy }> {
  if (!text || text.trim().length < 5) {
    return { result: { type: "unknown", rawText: text }, parsedBy: "heuristic" };
  }

  const aiResult = await parseWithOpenAI(text);
  if (aiResult) return { result: aiResult, parsedBy: "openai" };

  if (!process.env.OPENAI_API_KEY) {
    console.warn("[recipeParser] OPENAI_API_KEY not set — using heuristic parser for scan");
  }

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  const mealPlanDays = detectMealPlan(lines);
  if (mealPlanDays) {
    const confidence: "high" | "low" = mealPlanDays.length >= 3 ? "high" : "low";
    return { result: { type: "meal_plan", days: mealPlanDays, confidence }, parsedBy: "heuristic" };
  }

  const hasRecipeContent =
    INGREDIENT_SECTION.test(text) ||
    METHOD_SECTION.test(text) ||
    SERVING_PATTERN.test(text) ||
    lines.length >= 3;

  if (hasRecipeContent) {
    return { result: parseRecipeHeuristic(text), parsedBy: "heuristic" };
  }

  return { result: { type: "unknown", rawText: text }, parsedBy: "heuristic" };
}
