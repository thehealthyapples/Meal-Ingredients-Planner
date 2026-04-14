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

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0,
      max_tokens: 1500,
    });

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
