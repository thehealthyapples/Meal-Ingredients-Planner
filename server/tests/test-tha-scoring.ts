/**
 * THA Scoring Regression Tests
 *
 * Guards the full THA apple-rating pipeline against regressions.
 * Each case represents a real-world product category that MUST produce
 * a stable score. Any scoring-logic change that breaks a case must be
 * a deliberate, reviewed decision.
 *
 * Scoring model — 3 buckets combined:
 *   Bucket 1 (additive signals, cap 5): DB matches + SOFT_UPF_TERMS + extracts
 *   Bucket 2 (industrial ingredients, cap 5): palm fat/oil, milk powders, etc.
 *   Bucket 3 (UPF patterns, cap 3): sugar+glucose syrup, dairy fractions, etc.
 *
 * Total (0–13) → apple rating:
 *   0   → 5 apples
 *   1   → 4 apples
 *   2–3 → 3 apples
 *   4–5 → 2 apples
 *   6+  → 1 apple
 *
 * Run with:  npm run test:scoring
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { sql } from "drizzle-orm";
import {
  analyzeProductUPF,
  SOFT_UPF_TERMS,
  EXTRACT_PATTERN,
  INDUSTRIAL_INGREDIENT_TERMS,
  UPF_PATTERN_RULES,
} from "../lib/upf-analysis-service.js";
import type { Additive } from "../../shared/schema.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// ─── Test cases ───────────────────────────────────────────────────────────────

interface RegressionCase {
  id: number;
  label: string;
  ingredients: string;
  expect: {
    /** Exact effective count (DB + soft + extracts). Omit when using min. */
    exactAdditives?: number;
    /** Minimum effective count. Use when DB coverage could vary. */
    minAdditives?: number;
    /** Exact apple rating expected. */
    exactScore?: number;
    /** Apple rating must be ≤ this value. */
    maxScore?: number;
    /** Apple rating must be ≥ this value. */
    minScore?: number;
    /** Industrial ingredients that must be detected. */
    mustDetectIndustrial?: string[];
    /** UPF patterns that must fire. */
    mustDetectPatterns?: string[];
  };
  note?: string;
}

const CASES: RegressionCase[] = [
  {
    id: 1,
    label: "Passata — near whole food, one acidity regulator after colon",
    ingredients: "Tomatoes (99%), Acidity Regulator: Citric Acid",
    expect: { exactAdditives: 1, exactScore: 4 },
    note: "Citric Acid (E330) matched via colon separator. 1 additive → 4 apples.",
  },
  {
    id: 2,
    label: "Coleslaw — three additives including colon-separated preservative",
    ingredients:
      "Cabbage, Mayonnaise (Rapeseed Oil, Water, Egg, Sugar, Acetic Acid, Xanthan Gum), Carrot, Preservative: Potassium Sorbate",
    expect: { exactAdditives: 3, exactScore: 3 },
    note: "Acetic Acid (E260) + Xanthan Gum (E415) + Potassium Sorbate (E202) = 3 → 3 apples.",
  },
  {
    id: 3,
    label: "Shortbread — fortified flour minerals + flavouring soft term",
    ingredients:
      "Wheat Flour (Calcium Carbonate, Niacin, Iron, Thiamin), Sugar, Butter, Flavouring",
    expect: { exactAdditives: 2, exactScore: 3 },
    note: "Calcium Carbonate (E170) + Flavouring (soft term) = 2 → 3 apples.",
  },
  {
    id: 4,
    label: "Mission-style wraps — heavy UPF with 6 additives + flavouring",
    ingredients:
      "Wheat Flour, Water, Palm Oil, Glycerol, Malic Acid, Mono- and Diglycerides of Fatty Acids, Sodium Carbonates, Potassium Sorbate, Calcium Propionate, Flavouring",
    expect: { minAdditives: 5, exactScore: 1 },
    note:
      "E422 + E296 + E471 + E500 + E202 + E282 (6 DB) + Flavouring (soft) ≥ 5 → 1 apple.",
  },
  {
    id: 5,
    label: "Pizza-meat filling — nitrites/nitrates + flavourings after colon",
    ingredients:
      "Pork Meat, Pork Fat, Salt, Preservative: Sodium Nitrite, Preservatives: Potassium Nitrate, Antioxidant: Ascorbic Acid, Flavourings, Dextrose",
    expect: { minAdditives: 5, maxScore: 2 },
    note:
      "E250 + E252 + E300 (colon-separated) + Flavourings (soft) + Dextrose (soft) = 5 → 1 apple.",
  },
  {
    id: 6,
    label: "Whole tomato — clean product, zero additives",
    ingredients: "Tomatoes",
    expect: { exactAdditives: 0, exactScore: 5 },
  },

  // ── New cases: 3-bucket model ─────────────────────────────────────────────

  {
    id: 7,
    label: "A — Chocolate-style confection — heavily industrial, should score 1–2",
    ingredients:
      "sugar, glucose syrup, wheat flour (17%), palm fat, cocoa butter, skimmed milk powder, " +
      "cocoa mass, lactose, milk fat, whey powder (from milk), fat reduced cocoa, salt, " +
      "emulsifier (soya lecithin), raising agent (e500), natural vanilla extract",
    expect: {
      maxScore: 2,
      // glucose syrup is in SOFT_UPF_TERMS (Bucket 1), not INDUSTRIAL_INGREDIENT_TERMS (Bucket 2)
      mustDetectIndustrial: ["palm fat", "skimmed milk powder", "lactose", "whey powder"],
      mustDetectPatterns: ["sugar + glucose syrup", "sugar + palm fat/oil", "multiple dairy fractions"],
    },
    note:
      "Bucket 1 (additive signals): glucose syrup (soft term) + E500 (DB). " +
      "Bucket 2 (industrial): palm fat, skimmed milk powder, lactose, whey powder = 4pts. " +
      "Bucket 3 (patterns): sugar+glucose, sugar+palm, dairy fractions = 3pts (capped). " +
      "Total ≥ 8 → 1 apple.",
  },
  {
    id: 8,
    label: "B — Single-ingredient whole foods — should score 5",
    ingredients: "rolled oats",
    expect: { exactScore: 5 },
    note: "No additives, no industrial ingredients, no UPF patterns.",
  },
  {
    id: 9,
    label: "B — Peanuts — should score 5",
    ingredients: "peanuts",
    expect: { exactScore: 5 },
  },
  {
    id: 10,
    label: "B — Milk — should score 5",
    ingredients: "milk",
    expect: { exactScore: 5 },
  },
  {
    id: 11,
    label: "C — Tomatoes + water + salt + citric acid — middling, not catastrophically bad",
    ingredients: "tomatoes, water, salt, citric acid",
    expect: { minScore: 3 },
    note: "Citric acid (E330) = 1 additive → 4 apples. Should not score below 3.",
  },
  {
    id: 12,
    label: "D — Chicken + water + dextrose + modified starch + flavouring — worse than plain",
    ingredients: "chicken breast, water, dextrose, modified starch, flavouring",
    expect: { maxScore: 4, minScore: 2 },
    note:
      "Soft terms: dextrose, modified starch, flavour → additive bucket = 3 → 3 apples. " +
      "Should score worse than plain chicken (5 apples) but not catastrophically.",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PASS = "✅";
const FAIL = "❌";

function check(label: string, ok: boolean, detail?: string): boolean {
  console.log(`   ${ok ? PASS : FAIL} ${label}${detail ? `  (${detail})` : ""}`);
  return ok;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  const rows = (await db.execute(
    sql`SELECT id, name, type, risk_level, description, is_regulatory FROM additives ORDER BY name`,
  )) as any;

  const additiveDb: Additive[] = (rows.rows ?? rows).map((r: any) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    riskLevel: r.risk_level,
    description: r.description,
    isRegulatory: r.is_regulatory,
  }));

  console.log(`\nLoaded ${additiveDb.length} additives from DB.`);
  console.log(`\nTHA Scoring Regression Tests`);
  console.log("═".repeat(70));

  let passed = 0;
  let failed = 0;

  for (const tc of CASES) {
    console.log(`\nCASE ${tc.id}: ${tc.label}`);
    console.log(`  Ingredients: "${tc.ingredients}"`);
    if (tc.note) console.log(`  Note: ${tc.note}`);

    const result = analyzeProductUPF(tc.ingredients, additiveDb, 0);

    // Replicate the internal effective-count breakdown for display.
    const lower = tc.ingredients.toLowerCase();
    const softMatches = SOFT_UPF_TERMS.filter(t => lower.includes(t));
    EXTRACT_PATTERN.lastIndex = 0;
    const extractMatches = tc.ingredients.match(EXTRACT_PATTERN) ?? [];
    const effectiveCount =
      result.additiveMatches.length + softMatches.length + extractMatches.length;

    const breakdown = result.thaBreakdown;

    // ── Print findings ──────────────────────────────────────────────────────
    if (result.additiveMatches.length > 0) {
      console.log(
        `  DB additives (${result.additiveMatches.length}): ` +
          result.additiveMatches
            .map(m => `${m.additive.name} [matched "${m.foundIn}"]`)
            .join(", "),
      );
    } else {
      console.log(`  DB additives: none`);
    }
    if (softMatches.length > 0) {
      console.log(`  Soft terms   (${softMatches.length}): ${softMatches.join(", ")}`);
    }
    if (extractMatches.length > 0) {
      console.log(`  Extracts     (${extractMatches.length}): ${extractMatches.join(", ")}`);
    }
    if (breakdown.industrialIngredientsFound.length > 0) {
      console.log(`  Industrial   (${breakdown.industrialIngredientsFound.length}): ${breakdown.industrialIngredientsFound.join(", ")}`);
    }
    if (breakdown.upfPatternsFound.length > 0) {
      console.log(`  Patterns     (${breakdown.upfPatternsFound.length}): ${breakdown.upfPatternsFound.join(", ")}`);
    }
    console.log(
      `  Effective count: ${effectiveCount}  |  Total penalty: ${breakdown.totalProcessingPenalty}  →  THA rating: ${result.thaRating}/5`,
    );

    // ── Assertions ──────────────────────────────────────────────────────────
    console.log(`  Checks:`);
    let casePassed = true;

    if (tc.expect.exactAdditives !== undefined) {
      if (
        !check(
          `Effective count = ${tc.expect.exactAdditives}`,
          effectiveCount === tc.expect.exactAdditives,
          `got ${effectiveCount}`,
        )
      )
        casePassed = false;
    }
    if (tc.expect.minAdditives !== undefined) {
      if (
        !check(
          `Effective count ≥ ${tc.expect.minAdditives}`,
          effectiveCount >= tc.expect.minAdditives,
          `got ${effectiveCount}`,
        )
      )
        casePassed = false;
    }
    if (tc.expect.exactScore !== undefined) {
      if (
        !check(
          `Apple rating = ${tc.expect.exactScore}`,
          result.thaRating === tc.expect.exactScore,
          `got ${result.thaRating}`,
        )
      )
        casePassed = false;
    }
    if (tc.expect.maxScore !== undefined) {
      if (
        !check(
          `Apple rating ≤ ${tc.expect.maxScore}`,
          result.thaRating <= tc.expect.maxScore,
          `got ${result.thaRating}`,
        )
      )
        casePassed = false;
    }
    if (tc.expect.minScore !== undefined) {
      if (
        !check(
          `Apple rating ≥ ${tc.expect.minScore}`,
          result.thaRating >= tc.expect.minScore,
          `got ${result.thaRating}`,
        )
      )
        casePassed = false;
    }
    for (const term of (tc.expect.mustDetectIndustrial ?? [])) {
      const found = breakdown.industrialIngredientsFound.includes(term);
      if (!check(`Industrial detected: "${term}"`, found)) casePassed = false;
    }
    for (const pattern of (tc.expect.mustDetectPatterns ?? [])) {
      const found = breakdown.upfPatternsFound.includes(pattern);
      if (!check(`Pattern detected: "${pattern}"`, found)) casePassed = false;
    }

    console.log(`  → ${casePassed ? `${PASS} PASS` : `${FAIL} FAIL`}`);
    if (casePassed) passed++;
    else failed++;
    console.log("─".repeat(70));
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${"═".repeat(70)}`);
  console.log(`RESULTS: ${passed}/${CASES.length} passed`);
  if (failed > 0) {
    console.log(`${FAIL} ${failed} case(s) FAILED — scoring regression detected.`);
    console.log(`  Re-check upf-analysis-service.ts for unintended logic changes.`);
  } else {
    console.log(`${PASS} All regression cases passed.`);
  }
  console.log("");

  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error("Regression test failed:", err);
  process.exit(1);
});
