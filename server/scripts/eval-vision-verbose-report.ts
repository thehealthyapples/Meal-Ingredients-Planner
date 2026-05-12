/**
 * eval-vision-verbose-report.ts
 *
 * EVALUATION / REPORTING ONLY — not production code.
 * Does NOT modify any production route, OCR service, or recipe parser.
 * Produces a human-reviewable comparison report with full extracted content
 * so outputs can be manually verified against source images.
 *
 * Usage:
 *   tsx server/scripts/eval-vision-verbose-report.ts
 *   Runs against all images in server/test-assets/vision-real/
 *
 *   tsx server/scripts/eval-vision-verbose-report.ts path/to/img1.jpg path/to/img2.jpg
 *   Runs against supplied images only.
 */

import fs from "fs";
import path from "path";
import { extractTextFromImage } from "../services/ocr.js";
import { parseScannedText, type ScanResult } from "../services/recipeParser.js";
import OpenAI from "openai";

// ── Vision system prompt (same as eval-vision-comparison.ts) ─────────────────
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

// ── Ground-truth descriptions for each real image ────────────────────────────
const IMAGE_DESCRIPTIONS: Record<string, string> = {
  "printed recipe.jpeg":
    "Clean cookbook page. Title: 'Dark Chocolate Strawberry Bark'. 7 ingredients (300g dark chocolate, 1 tbsp olive oil, 2 tsp peanut butter, 1 tsp chia seeds, 70g chopped strawberries, 30g crushed pistachios, 30g coconut flakes). 7 numbered steps. 2 servings, 20 min. Slight angle, thumb in corner but very readable.",
  "printed with coloured back ground.jpeg":
    "Magazine page. Title: 'Harissa pasta & mixed nut pesto'. Dense two-column layout on coloured food-photo background. ~10 ingredients across two ingredient blocks. Method in flowing prose. Background colours likely to confuse OCR.",
  "mango 1.jpeg":
    "Printed recipe (app/website printout) with REAL blue-pen handwritten annotations: substitutions written next to originals ('fresen mongo', 'spring onions', 'coriander'), two items struck through (jalapeño, fine sea salt). 9 ingredients visible (some crossed out). Steps 1–5 partially visible.",
  "mango 2.jpeg":
    "STEPS ONLY — steps 2–5 of a separate tofu/meatball recipe. NO ingredient section visible. Water-stained, aged paper. Expected: system should NOT be able to extract a full recipe with ingredients.",
  "printer and hand written.jpeg":
    "Mixed printed title 'Jacket potatoes' (bold) + handwritten ingredients/filling list. Heavy diagonal shadow across right third. Includes strikethroughs ('Baked beans' → 'Homemade baked beans'). No steps section visible.",
  "Menu 5 hand written.jpeg":
    "Fully handwritten weekly meal plan. Title 'Menu 5'. 7 meals listed (NOT structured by weekday names — no Monday/Tuesday etc). Written on plastic sleeve page with text bleed-through from underlying pages. Shadow on right side.",
  "shopping list.jpeg":
    "6-item handwritten shopping list: Braising Steaks x900g, Yogurt, Passata III, Peanut butter, Stokes mayo, Nuts. Large hand shadow covers bottom half. NOT a recipe — no 'shopping_list' type exists in schema, correct output is 'unknown'.",
  "week3.jpeg":
    "Hybrid document: printed 7-meal plan table (Week 3) with red-pen handwritten meal replacements + massive 60+ item handwritten shopping list below in 3 columns. Meals NOT structured by weekday label in schema format.",
  "week6.jpeg":
    "Same hybrid format as week3. Week 6. 7 meals with red-pen annotation replacements. Large 3-column handwritten shopping list. Lunch notes at top. Meals NOT structured by weekday label in schema format.",
};

// ── OCR + Path A ──────────────────────────────────────────────────────────────

interface PathAData {
  ocrMs: number;
  aiMs: number;
  totalMs: number;
  ocrText: string;
  result: ScanResult;
  parsedBy: string;
  ocrError?: string;
}

async function runPathA(buf: Buffer): Promise<PathAData> {
  const t0 = Date.now();
  let ocrText = "";
  let ocrError: string | undefined;
  const tOcr = Date.now();

  try {
    ocrText = await extractTextFromImage(buf);
  } catch (err: any) {
    ocrError = err.code ?? err.message;
  }

  const ocrMs = Date.now() - tOcr;
  const tAi = Date.now();
  const { result, parsedBy } = ocrError
    ? { result: { type: "unknown" as const, rawText: "" }, parsedBy: "none" }
    : await parseScannedText(ocrText);

  return {
    ocrMs,
    aiMs: Date.now() - tAi,
    totalMs: Date.now() - t0,
    ocrText,
    result,
    parsedBy,
    ocrError,
  };
}

// ── Path B vision ─────────────────────────────────────────────────────────────

interface PathBData {
  detail: "high";
  aiMs: number;
  promptTokens: number;
  completionTokens: number;
  result: ScanResult | null;
  rawResponse: string;
  error?: string;
}

async function runPathBHigh(buf: Buffer, mimeType: string): Promise<PathBData> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      detail: "high",
      aiMs: 0,
      promptTokens: 0,
      completionTokens: 0,
      result: null,
      rawResponse: "",
      error: "OPENAI_API_KEY not set",
    };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const base64 = buf.toString("base64");
  const dataUri = `data:${mimeType};base64,${base64}`;

  const t0 = Date.now();
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: VISION_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: dataUri, detail: "high" } },
            { type: "text", text: "Extract the recipe or meal plan from this image." },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 1500,
    });

    const aiMs = Date.now() - t0;
    const rawResponse = response.choices[0]?.message?.content?.trim() ?? "";
    let result: ScanResult | null = null;
    try {
      const parsed = JSON.parse(rawResponse);
      if (parsed && ["recipe", "meal_plan", "unknown"].includes(parsed.type)) {
        result = parsed as ScanResult;
      }
    } catch {
      // malformed JSON — rawResponse preserved for display
    }

    return {
      detail: "high",
      aiMs,
      promptTokens: response.usage?.prompt_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
      result,
      rawResponse,
    };
  } catch (err: any) {
    return {
      detail: "high",
      aiMs: Date.now() - t0,
      promptTokens: 0,
      completionTokens: 0,
      result: null,
      rawResponse: "",
      error: err.message,
    };
  }
}

// ── Formatting helpers ─────────────────────────────────────────────────────────

function classifyType(result: ScanResult | null): string {
  if (!result) return "null / error";
  if (result.type === "recipe") return "recipe";
  if (result.type === "meal_plan") return "menu/meal plan";
  return "unknown";
}

function indent(text: string, spaces = 4): string {
  return text
    .split("\n")
    .map(l => " ".repeat(spaces) + l)
    .join("\n");
}

function formatScanResult(result: ScanResult | null): string {
  if (!result) return "    (no result)";
  return indent(JSON.stringify(result, null, 2));
}

function hallucinationWarnings(
  filename: string,
  pathAResult: ScanResult,
  pathBResult: ScanResult | null,
  ocrText: string,
): string[] {
  const warnings: string[] = [];

  // Image-specific known checks
  if (filename === "mango 2.jpeg") {
    if (pathAResult.type === "recipe" && (pathAResult as any).ingredients?.length > 0) {
      warnings.push(
        "POTENTIAL HALLUCINATION [PATH A]: Image shows steps 2–5 ONLY — no ingredient section visible. " +
        `Path A returned ${(pathAResult as any).ingredients?.length} ingredients. These were likely inferred/invented from step text.`
      );
    }
    if (pathBResult?.type === "recipe" && (pathBResult as any).ingredients?.length > 0) {
      warnings.push(
        "POTENTIAL HALLUCINATION [PATH B]: Path B returned recipe with ingredients despite steps-only image."
      );
    }
  }

  if (filename === "shopping list.jpeg") {
    if (pathAResult.type === "recipe") {
      warnings.push(
        "POTENTIAL HALLUCINATION [PATH A]: Image is a shopping list — classified as 'recipe'. Shopping list items mapped to ingredients."
      );
    }
    if (pathBResult?.type === "recipe") {
      warnings.push(
        "POTENTIAL HALLUCINATION [PATH B]: Image is a shopping list — classified as 'recipe'. Shopping list items mapped to ingredients."
      );
    }
  }

  if (filename === "Menu 5 hand written.jpeg") {
    const bPlan = pathBResult as any;
    if (pathBResult?.type === "meal_plan" && pathBResult.confidence === "high") {
      warnings.push(
        "POTENTIAL HALLUCINATION [PATH B]: Fully handwritten meal list with bleed-through and shadow returned confidence='high'. " +
        "Days structured into a single entry — 7 distinct meals collapsed to 1 day."
      );
    }
    if (pathAResult.type === "unknown") {
      // fine — no warning for Path A correctly returning unknown
    }
  }

  if (filename === "week3.jpeg" || filename === "week6.jpeg") {
    if (pathAResult.type === "unknown" || (pathAResult.type === "meal_plan" && (pathAResult as any).days?.length < 3)) {
      warnings.push(
        "NOTE [PATH A]: Meal plan not structured by weekday names (Mon/Tue etc.) — heuristic/AI collapsed meals or returned unknown. " +
        "60+ item shopping list below the meal table was ignored."
      );
    }
    if (pathBResult?.type === "meal_plan" && (pathBResult as any).days?.length < 3) {
      warnings.push(
        "NOTE [PATH B]: 7 meals collapsed into single-day structure. Red-pen handwritten meal replacements may have been missed. " +
        "Shopping list content not captured."
      );
    }
  }

  return warnings;
}

function lostTextWarnings(
  filename: string,
  pathAResult: ScanResult,
  pathBResult: ScanResult | null,
  ocrText: string,
): string[] {
  const warnings: string[] = [];

  // Path B unknown with empty rawText
  if (pathBResult?.type === "unknown" && (pathBResult.rawText?.length ?? 0) === 0) {
    warnings.push(
      "LOST TEXT [PATH B]: Result is 'unknown' but rawText is empty string. " +
      "Production fallback UX depends on rawText being populated — this breaks it."
    );
  }

  // Path A unknown preserves text in rawText
  if (pathAResult.type === "unknown" && (pathAResult.rawText?.length ?? 0) > 0) {
    warnings.push(
      `NOTE [PATH A]: Returned 'unknown' but rawText contains ${pathAResult.rawText.length} chars — fallback UX preserved.`
    );
  }

  if (filename === "mango 2.jpeg" && pathBResult?.type === "unknown") {
    warnings.push(
      "LOST TEXT [PATH B]: Steps 2–5 were readable in the image but Path B returned unknown with no rawText. Text recovery impossible."
    );
  }

  if (filename === "mango 1.jpeg") {
    warnings.push(
      "NOTE: Image contains handwritten strikethroughs (jalapeño, fine sea salt) and handwritten substitutions. " +
      "Neither path can distinguish struck-through vs active ingredients automatically."
    );
  }

  if (filename === "printer and hand written.jpeg") {
    warnings.push(
      "NOTE: Handwritten strikethrough on 'Baked beans' → 'Homemade baked beans'. Shadow covers right third. " +
      "Neither path can confirm which version was captured."
    );
  }

  return warnings;
}

function confidenceWarnings(
  filename: string,
  pathAResult: ScanResult,
  pathBResult: ScanResult | null,
): string[] {
  const warnings: string[] = [];

  const aConf = (pathAResult as any).confidence;
  const bConf = (pathBResult as any)?.confidence;

  if (filename === "mango 2.jpeg" && pathAResult.type === "recipe" && aConf === "high") {
    warnings.push(
      "CONFIDENCE ISSUE [PATH A]: Steps-only image returned confidence='high' recipe — " +
      "confidence is wrong given no ingredient section exists."
    );
  }

  if (filename === "Menu 5 hand written.jpeg" && pathBResult?.type === "meal_plan" && bConf === "high") {
    warnings.push(
      "CONFIDENCE ISSUE [PATH B low]: Fully handwritten image with bleed-through returned confidence='high'. " +
      "Should be 'low' given image quality and structural ambiguity."
    );
  }

  if (filename === "shopping list.jpeg" && pathBResult?.type === "recipe") {
    warnings.push(
      "CONFIDENCE ISSUE [PATH B high]: Shopping list misclassified as recipe. " +
      "Even with confidence='low', the type classification is wrong."
    );
  }

  return warnings;
}

// ── Per-image report ──────────────────────────────────────────────────────────

async function reportImage(absPath: string): Promise<void> {
  const filename = path.basename(absPath);
  const buf = fs.readFileSync(absPath);
  const ext = path.extname(absPath).toLowerCase().replace(".", "");
  const mimeType =
    ext === "jpg" || ext === "jpeg" ? "image/jpeg" :
    ext === "png" ? "image/png" :
    "image/jpeg";

  const desc = IMAGE_DESCRIPTIONS[filename] ?? "(no description available)";

  process.stderr.write(`[report] Processing: ${filename}...\n`);

  const [a, b] = await Promise.all([
    runPathA(buf),
    runPathBHigh(buf, mimeType),
  ]);

  const hallucinations = hallucinationWarnings(filename, a.result, b.result, a.ocrText);
  const lostText = lostTextWarnings(filename, a.result, b.result, a.ocrText);
  const confIssues = confidenceWarnings(filename, a.result, b.result);

  const saferPath =
    hallucinations.some(w => w.includes("PATH A")) && !hallucinations.some(w => w.includes("PATH B"))
      ? "Path B"
      : hallucinations.some(w => w.includes("PATH B")) && !hallucinations.some(w => w.includes("PATH A"))
        ? "Path A"
        : hallucinations.length === 0 && lostText.filter(w => w.includes("LOST TEXT")).length === 0
          ? "Both paths acceptable"
          : "Neither path safe without fixes — see warnings";

  const divider = "=".repeat(50);

  console.log(`\n${divider}`);
  console.log(`IMAGE: ${filename}`);
  console.log(divider);
  console.log(`\nDescription: ${desc}`);

  // ── OCR PATH ──────────────────────────────────────────────────────────────
  console.log("\n--- OCR PATH (Path A: Tesseract OCR → gpt-4o-mini text parse) ---\n");
  console.log(`  timing:          OCR ${a.ocrMs}ms + AI ${a.aiMs}ms = total ${a.totalMs}ms`);
  console.log(`  classification:  ${classifyType(a.result)}`);
  console.log(`  confidence:      ${(a.result as any).confidence ?? "n/a (unknown type)"}`);
  console.log(`  parsed by:       ${a.parsedBy}`);
  if (a.ocrError) {
    console.log(`  OCR ERROR:       ${a.ocrError}`);
  }

  console.log("\n  raw text (OCR output):");
  if (a.ocrError) {
    console.log("    [OCR FAILED — no text extracted]");
  } else if (!a.ocrText) {
    console.log("    [empty]");
  } else {
    console.log("  ┌─────────────────────────────────────────────────┐");
    a.ocrText.split("\n").forEach(line => {
      console.log(`  │ ${line}`);
    });
    console.log("  └─────────────────────────────────────────────────┘");
  }

  console.log("\n  structured output (Path A JSON):");
  console.log(formatScanResult(a.result));

  // ── VISION PATH ───────────────────────────────────────────────────────────
  console.log("\n--- VISION PATH (Path B: gpt-4o-mini vision, high detail) ---\n");
  if (b.error) {
    console.log(`  ERROR: ${b.error}`);
  } else {
    console.log(`  timing:          ${b.aiMs}ms (single vision call)`);
    console.log(`  classification:  ${classifyType(b.result)}`);
    console.log(`  confidence:      ${(b.result as any)?.confidence ?? "n/a (unknown type)"}`);
    console.log(`  prompt tokens:   ${b.promptTokens}  completion tokens: ${b.completionTokens}`);
    console.log(`  est. cost:       $${((b.promptTokens * 0.150 / 1_000_000) + (b.completionTokens * 0.600 / 1_000_000)).toFixed(6)}`);

    console.log("\n  raw text (vision returned):");
    if (b.result?.type === "unknown") {
      const rt = (b.result as any).rawText ?? "";
      if (rt.length === 0) {
        console.log("    [rawText is EMPTY STRING — fallback UX broken]");
      } else {
        console.log(`    ${rt}`);
      }
    } else {
      console.log("    [N/A — structured result returned, not raw text]");
    }

    console.log("\n  structured output (Path B JSON):");
    console.log(formatScanResult(b.result));
  }

  // ── WARNINGS ──────────────────────────────────────────────────────────────
  console.log("\n--- WARNINGS ---\n");

  if (hallucinations.length === 0) {
    console.log("  hallucination risk:  none detected");
  } else {
    hallucinations.forEach(w => console.log(`  ! ${w}`));
  }
  console.log("");
  if (lostText.length === 0) {
    console.log("  lost text:  none detected");
  } else {
    lostText.forEach(w => console.log(`  ! ${w}`));
  }
  console.log("");
  if (confIssues.length === 0) {
    console.log("  confidence issues:  none detected");
  } else {
    confIssues.forEach(w => console.log(`  ! ${w}`));
  }

  // ── ASSESSMENT ────────────────────────────────────────────────────────────
  console.log("\n--- ASSESSMENT ---\n");
  console.log(`  safer path:      ${saferPath}`);

  const aType = classifyType(a.result);
  const bType = classifyType(b.result);
  const typeMatch = aType === bType ? "agree" : `DISAGREE (A: ${aType} / B: ${bType})`;
  console.log(`  type agreement:  ${typeMatch}`);

  const timingWinner =
    a.totalMs < b.aiMs ? `Path A faster by ${b.aiMs - a.totalMs}ms` :
    `Path B faster by ${a.totalMs - b.aiMs}ms`;
  console.log(`  latency:         ${timingWinner}`);

  const anyTrustFailure = hallucinations.some(w => w.startsWith("POTENTIAL HALLUCINATION"));
  const anyLostText = lostText.some(w => w.startsWith("LOST TEXT"));
  let rec = "";
  if (anyTrustFailure && anyLostText) {
    rec = "Both paths have issues on this image. Manual triage required before production use.";
  } else if (anyTrustFailure) {
    rec = "Trust failure on at least one path. Do not use that path's output for this image class without prompt fixes.";
  } else if (anyLostText) {
    rec = "Lost-text issue on Path B (rawText=''). Path A's rawText fallback safer for unknown results.";
  } else {
    rec = "No critical issues. Manually verify extracted ingredients/steps against image.";
  }
  console.log(`  recommendation:  ${rec}`);
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("HUMAN REVIEW OUTPUT REPORT: YES");
  console.log("");
  console.log("Evaluation only. No production behaviour changed.");
  console.log("Report generated: " + new Date().toISOString());
  console.log("");
  console.log("Each image is run through:");
  console.log("  Path A — Tesseract OCR → gpt-4o-mini text parse (current production)");
  console.log("  Path B — gpt-4o-mini vision high-detail (candidate)");
  console.log("");
  console.log("Full extracted content is printed for manual eyeball verification.");

  const args = process.argv.slice(2).filter(a => !a.startsWith("--"));

  let imagePaths: string[];
  if (args.length > 0) {
    imagePaths = args.map(a => path.resolve(a));
  } else {
    const dir = path.resolve("server/test-assets/vision-real");
    imagePaths = fs
      .readdirSync(dir)
      .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
      .sort()
      .map(f => path.join(dir, f));
  }

  console.log(`\nImages to process: ${imagePaths.length}`);
  imagePaths.forEach(p => console.log(`  - ${path.basename(p)}`));

  for (const imgPath of imagePaths) {
    await reportImage(imgPath);
  }

  console.log("\n" + "=".repeat(50));
  console.log("END OF REPORT");
  console.log("=".repeat(50));
}

main().catch(err => {
  console.error("[report] Fatal:", err);
  process.exit(1);
});
