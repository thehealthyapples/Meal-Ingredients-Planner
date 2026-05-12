/**
 * eval-vision-comparison.ts
 *
 * EVALUATION ONLY — not production code.
 * Does NOT modify any production route, OCR service, or recipe parser.
 * No results from this script affect live behaviour.
 *
 * Compares:
 *   Path A  →  Tesseract OCR  →  gpt-4o-mini text parse   (current production)
 *   Path B  →  gpt-4o-mini vision model  →  direct extract (candidate)
 *
 * Usage:
 *   tsx server/scripts/eval-vision-comparison.ts
 *         Runs built-in text fixtures (parse accuracy + AI timing only).
 *
 *   tsx server/scripts/eval-vision-comparison.ts path/to/image.jpg [path/to/image2.png ...]
 *         Runs end-to-end comparison on supplied local images (full OCR + vision).
 *
 * WHAT IS LOGGED:
 *   - Timings in ms
 *   - Token counts from API
 *   - Result type (recipe/meal_plan/unknown) and ingredient/step counts
 *   - Confidence level
 *   - Estimated cost
 *
 * WHAT IS NOT LOGGED:
 *   - Image bytes or base64 image content
 *   - AI prompt text or full AI response text
 *   - Recipe titles or ingredient strings from real user images
 *   - Any user personal data
 */

import fs from "fs";
import path from "path";
import { extractTextFromImage } from "../services/ocr.js";
import { parseScannedText, type ScanResult } from "../services/recipeParser.js";
import OpenAI from "openai";

// ── Cost constants (OpenAI pricing as of May 2025) ───────────────────────────
const COST = {
  INPUT_PER_TOKEN:      0.150 / 1_000_000,  // $0.150 / 1M tokens
  OUTPUT_PER_TOKEN:     0.600 / 1_000_000,  // $0.600 / 1M tokens
  // Vision (low detail) adds a fixed 2833 tokens to the prompt count.
  // Vision (high detail) adds variable tokens reported by the API in usage.prompt_tokens.
  // We read actual token counts from the API response rather than estimating.
};

function estimateCost(promptTokens: number, completionTokens: number): number {
  return (promptTokens * COST.INPUT_PER_TOKEN) + (completionTokens * COST.OUTPUT_PER_TOKEN);
}

// ── Shared structured-extraction system prompt ────────────────────────────────
// Identical intent to the production prompt in recipeParser.ts, adapted for vision.
const VISION_SYSTEM_PROMPT = `You are a structured data extractor. Given an image of a recipe or meal plan, return ONLY valid JSON matching one of these shapes:

Recipe:
{"type":"recipe","title":"string","servings":number,"ingredients":["string"],"steps":["string"],"confidence":"high"|"low"}

Meal plan (if image contains day names with meals):
{"type":"meal_plan","days":[{"day":"Monday","meals":["string"]}],"confidence":"high"|"low"}

Unknown (if you cannot read the image or it is not a recipe):
{"type":"unknown","rawText":""}

Rules:
- Set confidence "low" if handwriting is unclear, lighting is poor, or the text is ambiguous.
- Do NOT invent ingredients or steps not visible in the image.
- Do NOT fill in missing values with guesses.
- Return only the JSON, no markdown fences, no explanation.`;

// ── Result shapes ─────────────────────────────────────────────────────────────

interface PathAResult {
  path: "A";
  label: string;
  ocrDurationMs: number;
  aiDurationMs: number;
  totalDurationMs: number;
  ocrTextLength: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
  result: ScanResult;
  parsedBy: string;
  error?: string;
}

interface PathBResult {
  path: "B";
  label: string;
  detail: "low" | "high";
  aiDurationMs: number;
  totalDurationMs: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
  result: ScanResult | null;
  error?: string;
}

interface TextFixtureResult {
  fixture: string;
  scenario: string;
  aiDurationMs: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
  result: ScanResult | null;
  error?: string;
}

// ── Path A: run production OCR → text → AI parse ─────────────────────────────

async function runPathA(imageBuffer: Buffer, label: string): Promise<PathAResult> {
  const tTotal = Date.now();

  // Step 1: OCR
  const tOcr = Date.now();
  let ocrText: string;
  try {
    ocrText = await extractTextFromImage(imageBuffer);
  } catch (err: any) {
    return {
      path: "A", label,
      ocrDurationMs: Date.now() - tOcr,
      aiDurationMs: 0,
      totalDurationMs: Date.now() - tTotal,
      ocrTextLength: 0,
      promptTokens: 0, completionTokens: 0, estimatedCostUsd: 0,
      result: { type: "unknown", rawText: "" },
      parsedBy: "none",
      error: `OCR failed: ${err.code ?? err.message}`,
    };
  }
  const ocrDurationMs = Date.now() - tOcr;

  // Step 2: AI text parse
  const tAi = Date.now();
  const { result, parsedBy } = await parseScannedText(ocrText);
  const aiDurationMs = Date.now() - tAi;

  // Token counts are logged by parseScannedText's internal timing log;
  // we can't retrieve them here without threading them through.
  // We mark as "see server log" and use 0 for cost here.
  return {
    path: "A", label,
    ocrDurationMs,
    aiDurationMs,
    totalDurationMs: Date.now() - tTotal,
    ocrTextLength: ocrText.length,
    promptTokens: 0,   // available in [recipe-scan-timing] logs
    completionTokens: 0,
    estimatedCostUsd: 0,
    result,
    parsedBy,
  };
}

// ── Path B: direct vision call ────────────────────────────────────────────────

async function runPathB(
  imageBuffer: Buffer,
  mimeType: string,
  detail: "low" | "high",
  label: string,
): Promise<PathBResult> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      path: "B", label, detail,
      aiDurationMs: 0, totalDurationMs: 0,
      promptTokens: 0, completionTokens: 0, estimatedCostUsd: 0,
      result: null,
      error: "OPENAI_API_KEY not set",
    };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const base64 = imageBuffer.toString("base64");
  const dataUri = `data:${mimeType};base64,${base64}`;

  const tTotal = Date.now();
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: VISION_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: dataUri, detail },
            },
            {
              type: "text",
              text: "Extract the recipe or meal plan from this image.",
            },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 1500,
    });

    const aiDurationMs = Date.now() - tTotal;
    const promptTokens = response.usage?.prompt_tokens ?? 0;
    const completionTokens = response.usage?.completion_tokens ?? 0;
    const raw = response.choices[0]?.message?.content?.trim() ?? "";

    let result: ScanResult | null = null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && ["recipe", "meal_plan", "unknown"].includes(parsed.type)) {
        result = parsed as ScanResult;
      }
    } catch {
      // JSON parse failed — log raw length only, not content
    }

    return {
      path: "B", label, detail,
      aiDurationMs,
      totalDurationMs: aiDurationMs,
      promptTokens,
      completionTokens,
      estimatedCostUsd: estimateCost(promptTokens, completionTokens),
      result,
    };
  } catch (err: any) {
    return {
      path: "B", label, detail,
      aiDurationMs: Date.now() - tTotal,
      totalDurationMs: Date.now() - tTotal,
      promptTokens: 0, completionTokens: 0, estimatedCostUsd: 0,
      result: null,
      error: err.message,
    };
  }
}

// ── Path A text-only: AI parse on pre-supplied text (OCR step bypassed) ───────
// Used for text fixtures where we already have the "OCR output" text.
// This isolates AI parsing quality and timing from image quality.

async function runPathATextOnly(text: string, label: string): Promise<TextFixtureResult> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      fixture: label, scenario: label,
      aiDurationMs: 0, promptTokens: 0, completionTokens: 0, estimatedCostUsd: 0,
      result: null,
      error: "OPENAI_API_KEY not set",
    };
  }

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
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0,
      max_tokens: 1500,
    });

    const aiDurationMs = Date.now() - t0;
    const promptTokens = response.usage?.prompt_tokens ?? 0;
    const completionTokens = response.usage?.completion_tokens ?? 0;
    const raw = response.choices[0]?.message?.content?.trim() ?? "";

    let result: ScanResult | null = null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && ["recipe", "meal_plan", "unknown"].includes(parsed.type)) {
        result = parsed as ScanResult;
      }
    } catch {
      // malformed response
    }

    return {
      fixture: label, scenario: label,
      aiDurationMs,
      promptTokens,
      completionTokens,
      estimatedCostUsd: estimateCost(promptTokens, completionTokens),
      result,
    };
  } catch (err: any) {
    return {
      fixture: label, scenario: label,
      aiDurationMs: Date.now() - t0,
      promptTokens: 0, completionTokens: 0, estimatedCostUsd: 0,
      result: null,
      error: err.message,
    };
  }
}

// ── Extraction quality metrics ─────────────────────────────────────────────────

function describeResult(result: ScanResult | null): string {
  if (!result) return "null";
  if (result.type === "recipe") {
    return `recipe  ingredients=${result.ingredients.length}  steps=${result.steps.length}  confidence=${result.confidence}`;
  }
  if (result.type === "meal_plan") {
    return `meal_plan  days=${result.days.length}  confidence=${result.confidence}`;
  }
  return `unknown  rawTextLen=${result.rawText?.length ?? 0}`;
}

function extractionStats(result: ScanResult | null): {
  type: string;
  ingredientCount: number;
  stepCount: number;
  confidence: string;
  hasFakeContent: string;
} {
  if (!result) return { type: "null", ingredientCount: 0, stepCount: 0, confidence: "n/a", hasFakeContent: "n/a" };
  if (result.type === "recipe") {
    return {
      type: "recipe",
      ingredientCount: result.ingredients.length,
      stepCount: result.steps.length,
      confidence: result.confidence,
      hasFakeContent: "manual-review-required",
    };
  }
  if (result.type === "meal_plan") {
    return {
      type: "meal_plan",
      ingredientCount: 0,
      stepCount: 0,
      confidence: result.confidence,
      hasFakeContent: "manual-review-required",
    };
  }
  return { type: "unknown", ingredientCount: 0, stepCount: 0, confidence: "n/a", hasFakeContent: "n/a" };
}

// ── Built-in text fixtures ─────────────────────────────────────────────────────
// These simulate what Tesseract OCR would emit for different image quality
// scenarios. They test AI parsing accuracy independent of image quality.
// Path B cannot run on these (no image to send); they are Path A parse-only tests.

const TEXT_FIXTURES: Record<string, string> = {

  "1_clean_printed": `Easy Chocolate Fudge Cake

Serves 8

Ingredients:
- 200g plain flour
- 200g caster sugar
- 100g unsalted butter, softened
- 2 large eggs
- 50g cocoa powder
- 1 tsp baking powder
- 150ml whole milk
- 1 tsp vanilla extract

Method:
1. Preheat oven to 180°C / 160°C fan.
2. Cream butter and sugar until pale and fluffy.
3. Beat in eggs one at a time.
4. Sift in flour, cocoa and baking powder. Fold gently.
5. Stir in milk and vanilla until smooth.
6. Pour into a greased 20cm tin and bake 35 minutes.
7. Cool completely before icing.`,

  "2_messy_printed": `Ezsy Choc0late Fudge Cak3

Serv3s 8

Ingr3d|ents:
-2OOg p|ain fIour
-2OOg caster sugor
- 1OOg unsa|ted butt3r sofen3d
-2 Iarge eggs
-5Og coc0a powdr
-1tsp baking pwdr
-15Om| who|e mi|k
-1tsp voni||a

M3thod:
1 Prehe4t ov3n to 18O°C
2.Cream buter + sugar untiI fluffy
3 Beat in eggs
4 S|ft drys Fo|d
5 Stir milk/vaniI|a
6 Bak3 35m 2Ocm tin
7 Coo| then ice`,

  "3_neat_handwriting": `Grandma's Chicken Soup

Serves 4-6

Ingredients:
- 1 whole free-range chicken (approx 1.5kg)
- 3 medium carrots, roughly chopped
- 2 sticks celery, sliced
- 1 large onion, quartered
- 1 small handful flat-leaf parsley
- 1 bay leaf
- salt and white pepper to taste

Method:
1. Place the chicken in a large pot and cover with cold water.
2. Bring slowly to the boil, skimming off any foam.
3. Add all the vegetables and herbs.
4. Reduce to a gentle simmer for 2 hours.
5. Lift out the chicken and shred the meat back into the broth.
6. Season and serve with crusty bread.`,

  "4_scruffy_handwriting": `chkn soup grandmas

4-6 ppl

chkn whole ~1.5kg
crts x3 chpd rough
celry 2stcks sl
onio 1 big qurtrd
prsley sm hndfll flat
bay lf
s+wp

big pot cold wtr chkn in - boil slow skim foam
all veg+herbs in - simmer 2hrs
lift chkn out shred bk in
seasn serve w bread`,

  "5_poor_lighting": `E sy Choc  late F dge C ke

 e ves 8

 ngred ents
  00g p ain f our
  00g caste  sugar
  00g bu ter
  l rge eggs
 5 g coco  p wder
  ts  b king p wder
  50m  m lk

 ethod
  re eat oven  80
  ream b tter sug r
  eat n  ggs
  ift dry  fold
  tir in m lk
  ake  5 in`,

  "6_angled_photo": `Easy Chocolate fudge Cake
                                         Serves 8

     Ingredients:
        - 200g plain flour
           - 200g caster sugar
              - 100g butter
                 - 2 eggs
                    - 50g cocoa
                       - 1 tsp baking powder
                          - 150ml milk

        Method:
  1. Preheat to 180.  2. Cream butter/sugar.  3. Eggs in.
  4. Fold dry.        5. Milk in.             6. Bake 35m.`,

  "7_high_resolution": `CLASSIC BEEF BOURGUIGNON

A rich French braised beef stew with red wine and lardons.
Serves 6

INGREDIENTS

For the beef:
- 1.5kg beef chuck, cut into 4cm cubes
- 200g smoked lardons
- 3 medium carrots, thickly sliced
- 2 medium onions, roughly chopped
- 4 garlic cloves, crushed
- 500ml good Burgundy red wine
- 300ml beef stock
- 2 tbsp plain flour
- 2 tbsp tomato purée
- 1 bouquet garni (bay, thyme, parsley)
- 2 tbsp olive oil
- Salt and black pepper

For the garnish:
- 250g button mushrooms, halved
- 200g baby pearl onions, peeled
- 2 tbsp butter

INSTRUCTIONS

1. Pat beef dry. Season generously with salt and pepper.
2. Heat oil in a large cast-iron casserole over high heat.
3. Brown the beef in batches until deep golden. Set aside.
4. Lower heat. Fry lardons until crisp. Add carrots and onion; cook 5 minutes.
5. Stir in garlic and tomato purée for 1 minute.
6. Sprinkle flour over and stir to coat.
7. Return beef to pot. Pour over wine and stock.
8. Add bouquet garni. Season. Bring to a simmer.
9. Cover and cook in oven at 160°C for 2.5 to 3 hours until beef is very tender.
10. Meanwhile sauté mushrooms and onions in butter until golden.
11. Add garnish to stew for the final 20 minutes.
12. Remove bouquet garni. Adjust seasoning. Serve with mashed potato or crusty bread.`,

  "8_compressed_downscaled": `BEEF BOURGUIGNON

Serves 6

Ingredients:
1.5kg beef chuck - cubes
200g smoked lardons
3 carrots thick slices
2 onions rough chop
4 garlic cloves
500ml red wine
300ml beef stock
2tbsp flour
2tbsp tomato puree
bouquet garni
2tbsp oil
salt pepper
250g mushrooms halved
200g pearl onions
2tbsp butter

Steps: Brown beef. Fry lardons+veg. Add garlic+puree. Flour. Return beef+wine+stock. 160c 3hrs. Saute mush+onions. Add last 20min. Serve.`,
};

// ── Report helpers ─────────────────────────────────────────────────────────────

function separator(char = "─", width = 80): string {
  return char.repeat(width);
}

function printRow(label: string, value: string | number): void {
  const paddedLabel = label.padEnd(32, " ");
  console.log(`  ${paddedLabel} ${value}`);
}

// ── Main comparison run for a single image ────────────────────────────────────

async function runImageComparison(
  imagePath: string,
): Promise<void> {
  const absPath = path.resolve(imagePath);
  const exists = fs.existsSync(absPath);
  if (!exists) {
    console.error(`\n[eval] Image not found: ${absPath}`);
    return;
  }

  const imageBuffer = fs.readFileSync(absPath);
  const ext = path.extname(absPath).toLowerCase().replace(".", "");
  const mimeType =
    ext === "jpg" || ext === "jpeg" ? "image/jpeg" :
    ext === "png" ? "image/png" :
    ext === "webp" ? "image/webp" :
    "image/jpeg";

  const label = path.basename(absPath);
  const imageSizeKB = (imageBuffer.length / 1024).toFixed(1);

  console.log(`\n${separator("═")}`);
  console.log(`IMAGE: ${label}  (${imageSizeKB} KB  ${mimeType})`);
  console.log(separator("═"));

  // Run Path A
  console.log("\n[eval] Running Path A (OCR → AI text parse)...");
  const a = await runPathA(imageBuffer, label);

  // Run Path B low detail
  console.log("[eval] Running Path B low-detail (vision direct)...");
  const bLow = await runPathB(imageBuffer, mimeType, "low", label);

  // Run Path B high detail
  console.log("[eval] Running Path B high-detail (vision direct)...");
  const bHigh = await runPathB(imageBuffer, mimeType, "high", label);

  // Print comparison table
  console.log(`\n${separator()}`);
  console.log("  TIMING (ms)");
  console.log(separator());
  printRow("OCR (Tesseract)",            a.error ? `FAILED: ${a.error}` : `${a.ocrDurationMs} ms`);
  printRow("AI parse — Path A",          a.aiDurationMs > 0 ? `${a.aiDurationMs} ms` : "see [recipe-scan-timing] logs");
  printRow("TOTAL — Path A",             `${a.totalDurationMs} ms`);
  printRow("Vision (low) — Path B",      bLow.error  ? `FAILED: ${bLow.error}`  : `${bLow.aiDurationMs} ms`);
  printRow("Vision (high) — Path B",     bHigh.error ? `FAILED: ${bHigh.error}` : `${bHigh.aiDurationMs} ms`);

  console.log(`\n${separator()}`);
  console.log("  TOKENS & ESTIMATED COST (gpt-4o-mini)");
  console.log(separator());
  console.log("  Path A: token counts available in [recipe-scan-timing] server logs");
  printRow("Path B low  — prompt tokens",      bLow.promptTokens);
  printRow("Path B low  — completion tokens",  bLow.completionTokens);
  printRow("Path B low  — est. cost",          `$${bLow.estimatedCostUsd.toFixed(6)}`);
  printRow("Path B high — prompt tokens",      bHigh.promptTokens);
  printRow("Path B high — completion tokens",  bHigh.completionTokens);
  printRow("Path B high — est. cost",          `$${bHigh.estimatedCostUsd.toFixed(6)}`);

  console.log(`\n${separator()}`);
  console.log("  EXTRACTION RESULTS");
  console.log(separator());
  if (a.error) {
    console.log(`  Path A ERROR: ${a.error}`);
  } else {
    console.log(`  Path A (parsedBy=${a.parsedBy}): ${describeResult(a.result)}`);
    console.log(`         OCR text length: ${a.ocrTextLength} chars`);
  }

  if (bLow.error) {
    console.log(`  Path B low  ERROR: ${bLow.error}`);
  } else {
    console.log(`  Path B low :  ${describeResult(bLow.result)}`);
  }

  if (bHigh.error) {
    console.log(`  Path B high ERROR: ${bHigh.error}`);
  } else {
    console.log(`  Path B high:  ${describeResult(bHigh.result)}`);
  }

  // Latency delta
  if (!a.error && !bHigh.error) {
    const delta = a.totalDurationMs - bHigh.totalDurationMs;
    const faster = delta > 0 ? `Path B high is ${delta}ms FASTER` : `Path A is ${Math.abs(delta)}ms FASTER`;
    console.log(`\n  Latency delta: ${faster}`);
  }

  // Hallucination risk note
  console.log("\n  NOTE: Ingredient/step accuracy requires manual review.");
  console.log("        Verify extracted items match visible image content.");
  console.log("        'hasFakeContent' cannot be determined automatically.");
}

// ── Main text-fixture run ─────────────────────────────────────────────────────

async function runTextFixtures(): Promise<void> {
  console.log(`\n${separator("═")}`);
  console.log("TEXT FIXTURE TESTS  (Path A AI-parse step only — no image available for Path B)");
  console.log("Simulates OCR output quality across 8 scenarios.");
  console.log(separator("═"));

  const results: Array<{
    label: string;
    scenario: string;
    res: TextFixtureResult;
  }> = [];

  for (const [key, text] of Object.entries(TEXT_FIXTURES)) {
    const scenarioLabel = key.replace(/_/g, " ").replace(/^\d+ /, "");
    process.stdout.write(`\n[eval] Fixture "${key}"...`);
    const res = await runPathATextOnly(text, key);
    process.stdout.write(` done (${res.aiDurationMs}ms)\n`);
    results.push({ label: key, scenario: scenarioLabel, res });
  }

  console.log(`\n${separator()}`);
  console.log(
    "  SCENARIO".padEnd(30) +
    "  RESULT".padEnd(16) +
    "  INGREDIENTS".padEnd(16) +
    "  STEPS".padEnd(10) +
    "  CONFIDENCE".padEnd(14) +
    "  AI-ms".padEnd(10) +
    "  TOKENS(in/out)".padEnd(18) +
    "  COST"
  );
  console.log(separator());

  let totalMs = 0, totalCost = 0, totalPrompt = 0, totalCompletion = 0;

  for (const { label, scenario, res } of results) {
    const stats = extractionStats(res.result);
    const col1 = scenario.padEnd(28);
    const col2 = (res.error ? "ERROR" : stats.type).padEnd(14);
    const col3 = String(stats.ingredientCount).padEnd(14);
    const col4 = String(stats.stepCount).padEnd(8);
    const col5 = stats.confidence.padEnd(12);
    const col6 = String(res.aiDurationMs).padEnd(8);
    const col7 = `${res.promptTokens}/${res.completionTokens}`.padEnd(16);
    const col8 = `$${res.estimatedCostUsd.toFixed(5)}`;
    console.log(`  ${col1}  ${col2}  ${col3}  ${col4}  ${col5}  ${col6}  ${col7}  ${col8}`);
    if (res.error) console.log(`    ERROR: ${res.error}`);
    totalMs += res.aiDurationMs;
    totalCost += res.estimatedCostUsd;
    totalPrompt += res.promptTokens;
    totalCompletion += res.completionTokens;
  }

  console.log(separator());
  console.log(`  ${"TOTALS".padEnd(28)}  ${"".padEnd(14)}  ${"".padEnd(14)}  ${"".padEnd(8)}  ${"".padEnd(12)}  ${String(totalMs).padEnd(8)}  ${`${totalPrompt}/${totalCompletion}`.padEnd(16)}  $${totalCost.toFixed(5)}`);

  console.log("\n  Context: these timings isolate the AI-parse step only.");
  console.log("  Full Path A time = OCR time (measured separately) + AI-parse time above.");
  console.log("  Path B vision time replaces BOTH OCR + AI-parse with a single call.");
}

// ── OCR baseline timing (standalone, no AI) ───────────────────────────────────

async function runOcrBaseline(imagePath: string): Promise<void> {
  const absPath = path.resolve(imagePath);
  const imageBuffer = fs.readFileSync(absPath);
  console.log(`\n[eval] OCR baseline on ${path.basename(absPath)}...`);
  const t0 = Date.now();
  try {
    const text = await extractTextFromImage(imageBuffer);
    console.log(`  OCR baseline: ${Date.now() - t0}ms  textLength=${text.length}chars`);
  } catch (err: any) {
    console.log(`  OCR baseline: ${Date.now() - t0}ms  FAILED: ${err.code ?? err.message}`);
  }
}

// ── Recommendation summary (printed at end) ───────────────────────────────────

function printRecommendationNote(): void {
  console.log(`\n${separator("═")}`);
  console.log("  RECOMMENDATION NOTE (evaluation output — not a production change)");
  console.log(separator("═"));
  console.log(`
  Decision criteria per the evaluation brief:
    Replace OCR only if ALL of:
      ✓  accuracy same or better
      ✓  latency materially better
      ✓  handwriting recognition acceptable
      ✓  trust/safety maintained (low-confidence kept explicit)

  What to look for in the results above:
    - If Path B high-detail total < Path A total by >1s: latency criterion met
    - If ingredient counts match between A and B: accuracy criterion likely met
    - Fixture 3/4 (handwriting) show whether AI text-parse handles informal text —
      but Path B vision handwriting can only be confirmed with real handwritten images
    - If Path B returns confidence="low" on fixtures 2/4/5: trust criterion met
    - Fixtures 5/6 (poor lighting, angled): if Path B falls back to "unknown" cleanly
      rather than hallucinating, that is the safer failure mode

  IMPORTANT — what this script cannot confirm automatically:
    - Whether Path B invented ingredients not in the image
    - Whether Path B misread quantities (100g vs 200g)
    - Handwriting on real photos (requires supplying actual handwritten images)

  DO NOT replace OCR based on timing alone.
  Verify ingredient accuracy manually on 2-3 real recipe photos before deciding.
`);
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(separator("═"));
  console.log("  VISION COMPARISON EVALUATION  —  eval-vision-comparison.ts");
  console.log("  EVALUATION ONLY. No production behaviour is changed.");
  console.log(separator("═"));

  if (!process.env.OPENAI_API_KEY) {
    console.warn("\n  WARNING: OPENAI_API_KEY not set.");
    console.warn("  Path B (vision) will not run. Path A AI step will fall back to heuristic.\n");
  }

  const args = process.argv.slice(2).filter(a => !a.startsWith("--"));

  if (args.length > 0) {
    // Image mode: user supplied image file paths
    console.log(`\nMode: end-to-end image comparison (${args.length} image(s))`);
    for (const imgPath of args) {
      await runImageComparison(imgPath);
    }
  } else {
    // Default: text fixture tests
    console.log("\nMode: text fixture comparison (AI parse step only)");
    console.log("Tip: pass image paths as arguments for full end-to-end comparison.");
    await runTextFixtures();
  }

  printRecommendationNote();

  console.log(`\n${separator("═")}`);
  console.log("  Evaluation complete.");
  console.log(separator("═"));
}

main().catch(err => {
  console.error("\n[eval] Fatal error:", err);
  process.exit(1);
});
