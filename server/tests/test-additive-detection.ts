/**
 * THA Additive Detection — Verification Tests
 *
 * Proves that scoring works correctly across:
 *   - E-numbers in text
 *   - Real ingredient names (alias matching via DB description)
 *   - Soft UPF terms (code-based)
 *   - Herb/spice extract rules
 *
 * Run with:  npm run test:additives
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { sql } from "drizzle-orm";
import {
  detectAdditives,
  calculateTHAAppleRating,
  detectProcessingIndicators,
  SOFT_UPF_TERMS,
  EXTRACT_PATTERN as EXTRACT_PATTERN_PROD,
} from "../lib/upf-analysis-service.js";
import type { Additive } from "../../shared/schema.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// ─── Helpers ────────────────────────────────────────────────────────────────

function getSoftMatches(text: string): string[] {
  const lower = text.toLowerCase();
  return SOFT_UPF_TERMS.filter(t => lower.includes(t));
}

// Returns each matched extract phrase. Grouped phrases count once each;
// separate declarations count separately.
function getExtractMatches(text: string): string[] {
  EXTRACT_PATTERN_PROD.lastIndex = 0;
  return text.match(EXTRACT_PATTERN_PROD) ?? [];
}

const PASS = "✅";
const FAIL = "❌";
const WARN = "⚠️ ";

function check(label: string, condition: boolean, detail?: string): void {
  const icon = condition ? PASS : FAIL;
  const suffix = detail ? `  (${detail})` : "";
  console.log(`   ${icon} ${label}${suffix}`);
}

// ─── Test runner ─────────────────────────────────────────────────────────────

interface TestCase {
  id: number;
  label: string;
  ingredients: string;
  expect: {
    minApples?: number;
    maxApples?: number;
    exactApples?: number;
    mustDetect?: string[];       // E-number or common name (lowercase)
    mustDetectSoft?: string[];   // soft UPF terms
    mustDetectExtract?: boolean;
    exactExtractCount?: number;  // exact number of extract phrases expected
    noDoubleCount?: boolean;
  };
}

const CASES: TestCase[] = [
  {
    id: 1,
    label: "Clean product — 5 apples",
    ingredients: "Tomatoes (100%)",
    expect: { exactApples: 5, noDoubleCount: true },
  },
  {
    id: 2,
    label: "Single acidity regulator — 4 apples",
    ingredients: "Tomatoes, Citric Acid",
    expect: { exactApples: 4, mustDetect: ["e330"], noDoubleCount: true },
  },
  {
    id: 3,
    label: "Named additive alias — Calcium Propionate → E282",
    ingredients: "Flour, Water, Calcium Propionate",
    expect: {
      maxApples: 4,
      mustDetect: ["e282"],
      noDoubleCount: true,
    },
  },
  {
    id: 4,
    label: "Emulsifier by name — Mono- and Diglycerides → E471",
    ingredients: "Flour, Water, Emulsifier (Mono- and Diglycerides of Fatty Acids)",
    expect: {
      maxApples: 4,
      mustDetect: ["e471"],
      noDoubleCount: true,
    },
  },
  {
    id: 5,
    label: "Wrap-style — multiple additives, low apple score",
    ingredients:
      "Flour, Water, Calcium Propionate, Emulsifier (Mono- and Diglycerides), Raising Agents (E500, E450), Acidity Regulator (E341)",
    expect: {
      maxApples: 2,
      mustDetect: ["e282", "e500", "e450", "e341"],
      noDoubleCount: true,
    },
  },
  {
    id: 6,
    label: "Soft UPF terms — code-based detection (no DB required)",
    ingredients: "Chicken, Water, Natural Flavouring, Modified Starch, Dextrose",
    expect: {
      maxApples: 3,
      mustDetectSoft: ["flavour", "modified starch", "dextrose"],
      noDoubleCount: true,
    },
  },
  {
    id: 7,
    label: "Extract detection — Rosemary Extract treated as additive",
    ingredients: "Tomatoes, Salt, Rosemary Extract",
    expect: {
      maxApples: 4,
      mustDetectExtract: true,
      noDoubleCount: true,
    },
  },
  {
    id: 8,
    label: "Mixed real-world — E-numbers + aliases + soft terms",
    ingredients:
      "Water, Sugar, Citric Acid, Natural Flavouring, Colour (E150d), Preservative (Potassium Sorbate)",
    expect: {
      maxApples: 2,
      mustDetect: ["e330", "e150d", "e202"],
      mustDetectSoft: ["flavour"],
      noDoubleCount: true,
    },
  },
  {
    id: 9,
    label: "Grouped extract — 'spice and herb extracts' = exactly 1 hit",
    ingredients: "Chicken, Salt, Spice and Herb Extracts",
    expect: {
      maxApples: 4,
      mustDetectExtract: true,
      exactExtractCount: 1,
      noDoubleCount: true,
    },
  },
  {
    id: 10,
    label: "Grouped extract — 'vegetable extracts (carrot, beetroot)' = exactly 1 hit",
    ingredients: "Tomatoes, Water, Salt, Vegetable Extracts (Carrot, Beetroot)",
    expect: {
      maxApples: 4,
      mustDetectExtract: true,
      exactExtractCount: 1,
      noDoubleCount: true,
    },
  },
  {
    id: 11,
    label: "Two separate extract declarations = 2 hits",
    ingredients: "Chicken, Salt, Spice and Herb Extracts, Vegetable Extracts (Carrot, Beetroot)",
    expect: {
      maxApples: 3,
      mustDetectExtract: true,
      exactExtractCount: 2,
      noDoubleCount: true,
    },
  },
  {
    id: 12,
    label: "Single named extract = 1 hit",
    ingredients: "Tomatoes, Salt, Rosemary Extract",
    expect: {
      maxApples: 4,
      mustDetectExtract: true,
      exactExtractCount: 1,
      noDoubleCount: true,
    },
  },
  {
    id: 13,
    label: "Plain spices — NOT an additive (0 hits)",
    ingredients: "Chicken, Water, Salt, Spices",
    expect: {
      exactApples: 5,
      exactExtractCount: 0,
      noDoubleCount: true,
    },
  },
  {
    id: 14,
    label: "Pizza with salami/pepperoni — colon separators + smoke flavour",
    ingredients:
      "Wheat Flour, Tomato Passata, Water, Mozzarella Cheese (12.3%) (Cow's Milk). Ventricina Smoked Salami (5.6%) (Pork Meat, Pork Fat, Salt, Preservative: Sodium Nitrite, Spices, Dextrose, Antioxidant: Ascorbic Acid), Calabrese Spicy Salami (5.3%) (Pork Meat, Chilli, Salt, Flavourings, Dextrose, Sugar, Spices, Smoke Flavour, Antioxidant: Ascorbic Acid, Preservatives: Sodium Nitrite, Potassium Nitrate). Crumbled Pepperoni (4.5%) (Pork Meat, Pork Fat, Salt, Chilli, Spices, Sugar, Antioxidant: Ascorbic Acid, Preservative: Sodium Nitrite), Sunflower Oil, Salt, Extra Virgin Olive Oil, Roasted Garlic, Paprika, Oregano, Black Pepper, Yeast, Chilli.",
    expect: {
      maxApples: 2,
      mustDetect: ["e250", "e252", "e300"],
      mustDetectSoft: ["dextrose", "flavour"],
      noDoubleCount: true,
    },
  },
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function run() {
  // Load additive DB once
  const rows = await db.execute(
    sql`SELECT id, name, type, risk_level, description FROM additives ORDER BY name`,
  ) as any;
  const additiveDb: Additive[] = (rows.rows ?? rows).map((r: any) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    riskLevel: r.risk_level,
    description: r.description,
  }));

  console.log(`\nLoaded ${additiveDb.length} additives from DB.\n`);
  console.log("═".repeat(70));

  let passed = 0;
  let failed = 0;

  for (const tc of CASES) {
    console.log(`\nCASE ${tc.id}: ${tc.label}`);
    console.log(`  Ingredients: "${tc.ingredients}"`);

    const dbMatches = detectAdditives(tc.ingredients, additiveDb);
    const softMatches = getSoftMatches(tc.ingredients);
    const extractMatches = getExtractMatches(tc.ingredients);

    const effectiveCount = dbMatches.length + softMatches.length + extractMatches.length;
    const thaRating = calculateTHAAppleRating(
      dbMatches.length,
      detectProcessingIndicators(tc.ingredients),
      null,
      tc.ingredients,
    );

    // ── Print findings ──────────────────────────────────────────────────────
    if (dbMatches.length > 0) {
      console.log(`  DB additives (${dbMatches.length}):`);
      for (const m of dbMatches) {
        console.log(`    • ${m.additive.name}  [${m.additive.type}, ${m.additive.riskLevel}]  matched via "${m.foundIn}"`);
      }
    } else {
      console.log(`  DB additives: none`);
    }

    if (softMatches.length > 0) {
      console.log(`  Soft UPF terms (${softMatches.length}): ${softMatches.join(", ")}`);
    }

    if (extractMatches.length > 0) {
      console.log(`  Extracts (${extractMatches.length}): ${extractMatches.join(", ")}`);
    }

    console.log(`  Effective count: ${effectiveCount}  →  THA apple rating: ${thaRating}/5`);

    // ── Double-count check ──────────────────────────────────────────────────
    const seenIds = new Set<number>();
    let hasDouble = false;
    for (const m of dbMatches) {
      if (seenIds.has(m.additive.id)) { hasDouble = true; break; }
      seenIds.add(m.additive.id);
    }

    // ── Assertions ──────────────────────────────────────────────────────────
    console.log(`  Checks:`);
    let casePassed = true;

    if (tc.expect.exactApples !== undefined) {
      const ok = thaRating === tc.expect.exactApples;
      check(`Apple rating = ${tc.expect.exactApples}`, ok, `got ${thaRating}`);
      if (!ok) casePassed = false;
    }
    if (tc.expect.maxApples !== undefined) {
      const ok = thaRating <= tc.expect.maxApples;
      check(`Apple rating ≤ ${tc.expect.maxApples}`, ok, `got ${thaRating}`);
      if (!ok) casePassed = false;
    }
    if (tc.expect.minApples !== undefined) {
      const ok = thaRating >= tc.expect.minApples;
      check(`Apple rating ≥ ${tc.expect.minApples}`, ok, `got ${thaRating}`);
      if (!ok) casePassed = false;
    }

    for (const eName of (tc.expect.mustDetect ?? [])) {
      const found = dbMatches.some(
        m => m.additive.name.toLowerCase() === eName.toLowerCase() ||
             m.foundIn.toLowerCase().includes(eName.toLowerCase()),
      );
      check(`Detects ${eName.toUpperCase()}`, found);
      if (!found) casePassed = false;
    }

    for (const term of (tc.expect.mustDetectSoft ?? [])) {
      const found = softMatches.some(s => s.includes(term));
      check(`Soft term detected: "${term}"`, found);
      if (!found) casePassed = false;
    }

    if (tc.expect.mustDetectExtract) {
      const found = extractMatches.length > 0;
      check(`Extract detected`, found, extractMatches[0] ?? "none");
      if (!found) casePassed = false;
    }

    if (tc.expect.exactExtractCount !== undefined) {
      const ok = extractMatches.length === tc.expect.exactExtractCount;
      check(`Extract count = ${tc.expect.exactExtractCount}`, ok, `got ${extractMatches.length}: [${extractMatches.join(", ")}]`);
      if (!ok) casePassed = false;
    }

    if (tc.expect.noDoubleCount) {
      check(`No double-counting`, !hasDouble);
      if (hasDouble) casePassed = false;
    }

    console.log(`  → ${casePassed ? `${PASS} PASS` : `${FAIL} FAIL`}`);
    if (casePassed) passed++; else failed++;
    console.log("─".repeat(70));
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log(`\n${"═".repeat(70)}`);
  console.log(`RESULTS: ${passed}/${CASES.length} passed`);
  if (failed > 0) {
    console.log(`${FAIL} ${failed} case(s) FAILED — detection gaps need fixing.`);
  } else {
    console.log(`${PASS} All cases passed.`);
  }

  // ── Diagnostic summary ──────────────────────────────────────────────────
  console.log(`\nDiagnostic summary:`);
  const aliasCase = CASES[2];
  const aliasIngredients = aliasCase.ingredients;
  const aliasMatches = detectAdditives(aliasIngredients, additiveDb);
  console.log(`  Alias matching (Calcium Propionate → E282): ${aliasMatches.some(m => m.additive.name === "E282") ? PASS + " working" : FAIL + " NOT working"}`);

  const eNumIngredients = "Preservative (E282), Emulsifier (E471)";
  const eNumMatches = detectAdditives(eNumIngredients, additiveDb);
  console.log(`  E-number matching (E282, E471 in text): ${eNumMatches.length === 2 ? PASS + " working" : FAIL + ` only ${eNumMatches.length}/2 matched`}`);

  const softIngredients = "Natural Flavouring, Maltodextrin, Yeast Extract";
  const softResult = getSoftMatches(softIngredients);
  console.log(`  Soft UPF term detection: ${softResult.length === 3 ? PASS + " working (3/3)" : FAIL + ` only ${softResult.length}/3 matched`}`);

  const extractCases: [string, string, number][] = [
    ["Single phrase",                "Salt, Rosemary Extract",                                             1],
    ["Grouped (spice and herb)",     "Chicken, Spice and Herb Extracts",                                  1],
    ["Grouped (vegetable list)",     "Salt, Vegetable Extracts (Carrot, Beetroot)",                       1],
    ["Two separate declarations",    "Spice and Herb Extracts, Vegetable Extracts (Carrot, Beetroot)",    2],
    ["Plain spices (no extract)",    "Chicken, Spices, Salt",                                             0],
  ];
  for (const [label, ing, expected] of extractCases) {
    const got = getExtractMatches(ing).length;
    console.log(`  ${got === expected ? PASS : FAIL} Extract — ${label}: expected ${expected}, got ${got}`);
  }

  console.log("");
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error("Test script failed:", err);
  process.exit(1);
});
