/**
 * THA Bucket Scoring — Standalone Debug & Regression Tests
 *
 * Does NOT require a database connection. Exercises calculateTHAAppleRating
 * and the bucket breakdown functions directly with zero DB additives.
 *
 * These tests are the minimal set needed to confirm:
 *   - the confectionery product scores ≤ 2 apples (1 apple expected)
 *   - whole/single-ingredient foods score 5
 *   - simple acidity-regulated products stay at 3–4 apples
 *
 * Root-cause summary (2026-03-28):
 *   dist/index.cjs was built before the 3-bucket refactor; production ran the
 *   old additive-count-only model. With E500 (1 DB hit) + glucose syrup (1 soft
 *   term), old model gave effectiveCount=2 → 3 apples. New model gives total≥8
 *   → 1 apple for the same ingredient list.
 *
 * Run with:  npx tsx server/tests/test-tha-bucket-debug.ts
 */

import {
  calculateTHAAppleRating,
  buildProcessingBreakdown,
  SOFT_UPF_TERMS,
  INDUSTRIAL_INGREDIENT_TERMS,
  UPF_PATTERN_RULES,
  EXTRACT_PATTERN,
} from "../lib/upf-analysis-service.js";

const PASS = "✅";
const FAIL = "❌";
let passed = 0;
let failed = 0;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function check(label: string, ok: boolean, detail?: string): boolean {
  console.log(`   ${ok ? PASS : FAIL} ${label}${detail ? `  (${detail})` : ""}`);
  if (!ok) failed++; else passed++;
  return ok;
}

function scoreText(ingredientsText: string, additiveCount = 0): number {
  return calculateTHAAppleRating(additiveCount, [], null, ingredientsText);
}

function breakdown(ingredientsText: string) {
  // Build a no-DB breakdown using the exported helpers directly.
  const text = ingredientsText.toLowerCase();
  EXTRACT_PATTERN.lastIndex = 0;
  const extractHits = text.match(EXTRACT_PATTERN) ?? [];
  const softHits = SOFT_UPF_TERMS.filter(t => text.includes(t));
  const industrial = INDUSTRIAL_INGREDIENT_TERMS.filter(t => text.includes(t));
  const patterns = UPF_PATTERN_RULES.filter(r => r.test(text)).map(r => r.label);
  return { softHits, extractHits, industrial, patterns };
}

// ─── Test cases ───────────────────────────────────────────────────────────────

const CONFECTIONERY =
  "sugar, glucose syrup, wheat flour (17%), palm fat, cocoa butter, skimmed milk powder, " +
  "cocoa mass, lactose, milk fat, whey powder (from milk), fat reduced cocoa, salt, " +
  "emulsifier (soya lecithin), raising agent (e500), natural vanilla extract";

const CONFECTIONERY_E_SPACE =
  "sugar, glucose syrup, wheat flour (17%), palm fat, cocoa butter, skimmed milk powder, " +
  "cocoa mass, lactose, milk fat, whey powder (from milk), fat reduced cocoa, salt, " +
  "emulsifier (soya lecithin), raising agent (E 500), natural vanilla extract";

const TOMATO_PASSATA = "tomatoes, water, salt, citric acid";
const ROLLED_OATS    = "rolled oats";
const PEANUTS        = "peanuts";
const MILK           = "milk";
const CHICKEN_DEXTROSE = "chicken breast, water, dextrose, modified starch, flavouring";

console.log("\nTHA Bucket Scoring — Debug & Regression Tests (no DB)");
console.log("═".repeat(65));

// ─── A: Confectionery — must be 1 apple ───────────────────────────────────
{
  console.log("\nCASE A: Confectionery (Twix-style) — must score ≤ 2 (expect 1)");
  const bd = breakdown(CONFECTIONERY);
  console.log("  Soft hits      :", bd.softHits.join(", ") || "none");
  console.log("  Industrial     :", bd.industrial.join(", ") || "none");
  console.log("  Patterns       :", bd.patterns.join(", ") || "none");

  const rating = scoreText(CONFECTIONERY, 0); // 0 DB additives (no DB)
  console.log(`  Score (0 DB)   : ${rating}/5`);
  const ratingWithE500 = scoreText(CONFECTIONERY, 1); // 1 = E500
  console.log(`  Score (1 DB)   : ${ratingWithE500}/5`);

  check("Soft hits include glucose syrup", bd.softHits.includes("glucose syrup"));
  check("Industrial: palm fat detected",          bd.industrial.includes("palm fat"));
  check("Industrial: skimmed milk powder detected", bd.industrial.includes("skimmed milk powder"));
  check("Industrial: whey powder detected",       bd.industrial.includes("whey powder"));
  check("Industrial: lactose detected",           bd.industrial.includes("lactose"));
  check("Pattern: sugar + glucose syrup",         bd.patterns.includes("sugar + glucose syrup"));
  check("Pattern: sugar + palm fat/oil",          bd.patterns.includes("sugar + palm fat/oil"));
  check("Pattern: multiple dairy fractions",      bd.patterns.includes("multiple dairy fractions"));
  check("Score ≤ 2 apples (0 DB additives)", rating <= 2, `got ${rating}`);
  check("Score ≤ 2 apples (1 DB additive)",  ratingWithE500 <= 2, `got ${ratingWithE500}`);
}

// ─── A (E 500 with space): E-number normalisation ─────────────────────────
{
  console.log("\nCASE A2: Same product but 'E 500' (with space) — must still score ≤ 2");
  const rating = scoreText(CONFECTIONERY_E_SPACE, 0);
  const ratingWith = scoreText(CONFECTIONERY_E_SPACE, 1);
  check("Score ≤ 2 (0 DB)",  rating    <= 2, `got ${rating}`);
  check("Score ≤ 2 (1 DB)",  ratingWith <= 2, `got ${ratingWith}`);
}

// ─── B: Whole foods — must be 5 ──────────────────────────────────────────
{
  console.log("\nCASE B: Whole/single-ingredient foods — must score 5");
  for (const [label, text] of [["rolled oats", ROLLED_OATS], ["peanuts", PEANUTS], ["milk", MILK]] as const) {
    const rating = scoreText(text, 0);
    check(`${label} → 5 apples`, rating === 5, `got ${rating}`);
  }
}

// ─── C: Tomatoes + citric acid — should stay ≥ 3 ─────────────────────────
{
  console.log("\nCASE C: Tomatoes + citric acid — must not score catastrophically low");
  // Citric acid is E330, typically 1 DB match. Simulate additiveCount=1.
  const rating = scoreText(TOMATO_PASSATA, 1);
  check("Score ≥ 3 apples", rating >= 3, `got ${rating}`);
  check("Score ≤ 4 apples", rating <= 4, `got ${rating}`);
}

// ─── D: Processed chicken — worse than plain ─────────────────────────────
{
  console.log("\nCASE D: Chicken + dextrose + modified starch + flavouring");
  const rating = scoreText(CHICKEN_DEXTROSE, 0);
  const bd = breakdown(CHICKEN_DEXTROSE);
  console.log("  Soft hits:", bd.softHits.join(", ") || "none");
  check("Score ≤ 4 (worse than plain chicken at 5)", rating <= 4, `got ${rating}`);
  check("Score ≥ 2 (not catastrophically bad)",      rating >= 2, `got ${rating}`);
}

// ─── E: E 500 matching with space ─────────────────────────────────────────
{
  console.log("\nCASE E: E-number normalisation — 'E 500' vs 'E500'");
  // These two strings should produce the same bucket scores for buckets 2 and 3.
  const b2b3_nospace = (() => {
    const t = "sugar, glucose syrup, palm fat, skimmed milk powder, emulsifier (soy lecithin), raising agent (E500)".toLowerCase();
    const ind = INDUSTRIAL_INGREDIENT_TERMS.filter(x => t.includes(x));
    const pat = UPF_PATTERN_RULES.filter(r => r.test(t));
    return { ind: ind.length, pat: pat.length };
  })();
  const b2b3_space = (() => {
    const t = "sugar, glucose syrup, palm fat, skimmed milk powder, emulsifier (soy lecithin), raising agent (E 500)".toLowerCase();
    const ind = INDUSTRIAL_INGREDIENT_TERMS.filter(x => t.includes(x));
    const pat = UPF_PATTERN_RULES.filter(r => r.test(t));
    return { ind: ind.length, pat: pat.length };
  })();
  check("Bucket 2 identical for E500 vs E 500", b2b3_nospace.ind === b2b3_space.ind,
    `E500:${b2b3_nospace.ind} E 500:${b2b3_space.ind}`);
  check("Bucket 3 identical for E500 vs E 500", b2b3_nospace.pat === b2b3_space.pat,
    `E500:${b2b3_nospace.pat} E 500:${b2b3_space.pat}`);
}

// ─── F: Soya / soy normalisation ──────────────────────────────────────────
{
  console.log("\nCASE F: Soya vs soy normalisation in scoring context");
  // Both forms should produce identical scores.
  const soya = scoreText("sugar, glucose syrup, palm fat, emulsifier (soya lecithin)", 0);
  const soy  = scoreText("sugar, glucose syrup, palm fat, emulsifier (soy lecithin)",  0);
  check("Soya and soy variants produce identical scores", soya === soy,
    `soya:${soya} soy:${soy}`);
}

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${"═".repeat(65)}`);
console.log(`RESULTS: ${passed}/${passed + failed} passed`);
if (failed > 0) {
  console.log(`${FAIL} ${failed} failure(s) — scoring or detection is broken.`);
  process.exit(1);
} else {
  console.log(`${PASS} All cases passed.\n`);
}
