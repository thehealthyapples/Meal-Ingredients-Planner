/**
 * Ingredient Language Gate — Verification Tests
 *
 * Verifies that hasEnglishIngredients / isUsableEnglishIngredients
 * correctly allow clean English text and exclude non-English, garbled,
 * and mixed OCR-corrupted ingredient text.
 *
 * Run with:  npx tsx server/tests/test-ingredient-language.ts
 */

import {
  isLikelyNonEnglishIngredients,
  isUsableEnglishIngredients,
  hasEnglishIngredients,
} from "../lib/ingredient-language.js";

// ---------------------------------------------------------------------------
// Tiny test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function expect(label: string, actual: boolean, expected: boolean): void {
  if (actual === expected) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    console.error(`  ✗  ${label}`);
    console.error(`       expected: ${expected}   got: ${actual}`);
    failed++;
  }
}

function section(title: string): void {
  console.log(`\n── ${title} ──`);
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

// Real UK product (Digestive biscuits) — should be allowed
const CLEAN_ENGLISH =
  "Wheat Flour (Wheat), Sugar, Vegetable Fat (Shea, Palm, Rapeseed), Cocoa Powder (7%), " +
  "Wheatgerm, Sodium Bicarbonate, Salt, Malic Acid, Ammonium Bicarbonate.";

// Real UK product with unusual additives (Pringles) — should be allowed
// Contains "disodium inosinate" and "guanylate" which are NOT in the vocabulary
const ENGLISH_UNUSUAL_ADDITIVES =
  "Dried Potatoes, Vegetable Oils (Sunflower, Corn), Corn Flour, Wheat Starch, " +
  "Maltodextrin, Emulsifiers (E471, Soya Lecithin), Salt, Dextrose, " +
  "Yeast Extract, Flavourings, Disodium Inosinate, Disodium Guanylate.";

// Real UK product with vitamins (Coco Pops) — should be allowed
const ENGLISH_VITAMINS =
  "Maize (81%), Sugar, Cocoa Powder (7%), Glucose Syrup, Wheat Starch, Salt, " +
  "Barley Malt Extract, Riboflavin (B2), Niacin, Folic Acid, Vitamin B6, Vitamin B12, Iron.";

// German ingredients (Milka) — should be excluded
const GERMAN_ONLY =
  "Zucker, Kakaobutter, Magermilchpulver, Kakaomasse, Molkenpulver, Emulgator (Sojalecithin), " +
  "Weizenmehl, Salz, Aroma. Kakaomindestgehalt: 30%.";

// French ingredients — should be excluded
const FRENCH_ONLY =
  "Sucre, beurre de cacao, lait écrémé en poudre, pâte de cacao, matière grasse de lait " +
  "anhydre, huile de noisette, émulsifiant (lécithine de soja), arôme vanilline.";

// Double Decker garbled OCR text — the bug case — should be excluded
const DOUBLE_DECKER_GARBLED =
  "PLE Red Band ski decolateath, chewy nougat (38%) and afsp, aundry cereal (95) up, " +
  "vegetable fats (palm ars. Ingredient glase rem milli), emulsifiers (6442, E471, soya lecithins),";

// Another garbled / multilingual mixed OCR example — should be excluded
const GARBLED_MIXED =
  "Mleko pełne (32%), Zucker, kakaobutter pflanzenfett, wheat glucose syrup malt extract " +
  "emulsfr (E471) lecithin soya weizenmehl salz.";

// Text too short — should be excluded
const TOO_SHORT = "Sugar, salt.";

// ---------------------------------------------------------------------------
// 1. isUsableEnglishIngredients — text-level checks
// ---------------------------------------------------------------------------

section("isUsableEnglishIngredients — allowed cases");

expect(
  "clean English digestive biscuits",
  isUsableEnglishIngredients(CLEAN_ENGLISH),
  true,
);

expect(
  "English with unusual additives (disodium inosinate / guanylate)",
  isUsableEnglishIngredients(ENGLISH_UNUSUAL_ADDITIVES),
  true,
);

expect(
  "English with vitamins (Coco Pops style)",
  isUsableEnglishIngredients(ENGLISH_VITAMINS),
  true,
);

section("isUsableEnglishIngredients — excluded cases");

expect(
  "German-only ingredients",
  isUsableEnglishIngredients(GERMAN_ONLY),
  false,
);

expect(
  "French-only ingredients",
  isUsableEnglishIngredients(FRENCH_ONLY),
  false,
);

expect(
  "Double Decker garbled OCR text",
  isUsableEnglishIngredients(DOUBLE_DECKER_GARBLED),
  false,
);

expect(
  "garbled multilingual mixed text",
  isUsableEnglishIngredients(GARBLED_MIXED),
  false,
);

expect(
  "text too short",
  isUsableEnglishIngredients(TOO_SHORT),
  false,
);

// ---------------------------------------------------------------------------
// 2. hasEnglishIngredients — product-level gate
// ---------------------------------------------------------------------------

section("hasEnglishIngredients — ingredients_text_en present (always trusted)");

expect(
  "ingredients_text_en present — allowed regardless of raw text",
  hasEnglishIngredients({
    ingredients_text_en: "Sugar, Cocoa Butter, Whole Milk Powder",
    ingredients_text: DOUBLE_DECKER_GARBLED,
  }),
  true,
);

expect(
  "ingredients_text_en present but raw text is German — still allowed",
  hasEnglishIngredients({
    ingredients_text_en: "Sugar, Cocoa Butter, Whole Milk Powder",
    ingredients_text: GERMAN_ONLY,
  }),
  true,
);

section("hasEnglishIngredients — raw text only (strict gate applies)");

expect(
  "clean English raw text — allowed",
  hasEnglishIngredients({
    ingredients_text_en: "",
    ingredients_text: CLEAN_ENGLISH,
  }),
  true,
);

expect(
  "Double Decker garbled raw text — excluded",
  hasEnglishIngredients({
    ingredients_text_en: "",
    ingredients_text: DOUBLE_DECKER_GARBLED,
  }),
  false,
);

expect(
  "German-only raw text — excluded",
  hasEnglishIngredients({
    ingredients_text_en: "",
    ingredients_text: GERMAN_ONLY,
  }),
  false,
);

expect(
  "no ingredient text at all — excluded",
  hasEnglishIngredients({}),
  false,
);

expect(
  "raw text too short — excluded",
  hasEnglishIngredients({ ingredients_text: TOO_SHORT }),
  false,
);

// ---------------------------------------------------------------------------
// 3. Consistency check — barcode / search / alternatives all use same gate
//    (simulated by running the same hasEnglishIngredients for each pipeline)
// ---------------------------------------------------------------------------

section("consistency — all pipelines use the same gate for Double Decker");

const doubleDecker = {
  code: "5000159461122",
  product_name: "Double Decker",
  ingredients_text_en: "",
  ingredients_text: DOUBLE_DECKER_GARBLED,
};

expect("barcode pipeline excludes garbled Double Decker", hasEnglishIngredients(doubleDecker), false);
expect("search pipeline excludes garbled Double Decker",  hasEnglishIngredients(doubleDecker), false);
expect("alternatives pipeline excludes garbled Double Decker", hasEnglishIngredients(doubleDecker), false);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
