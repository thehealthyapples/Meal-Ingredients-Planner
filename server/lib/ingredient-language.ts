/**
 * ingredient-language.ts
 *
 * Provides language-detection helpers used by all user-facing product
 * pipelines to gate out non-English and garbled/OCR-corrupted ingredient text.
 *
 * Public API
 *   isLikelyNonEnglishIngredients(text)  – detects known non-English text
 *   isUsableEnglishIngredients(text)     – high-confidence positive English check
 *   hasEnglishIngredients(product)       – the single product-level gate
 */

// ---------------------------------------------------------------------------
// Comprehensive English food / ingredient vocabulary
// Used by isUsableEnglishIngredients to positively recognise English tokens.
// Only contains tokens of 5+ characters (the check is applied to 5+ char
// alphabetic tokens extracted from ingredient text).
// ---------------------------------------------------------------------------

const ENGLISH_FOOD_VOCABULARY = new Set<string>([
  // ── Basic / Structural ────────────────────────────────────────────────────
  'water', 'salt', 'sugar', 'flour', 'starch', 'fibre', 'fiber',
  'protein', 'proteins', 'gluten', 'collagen', 'gelatin', 'gelatine',
  'albumin', 'casein',
  // ── Dairy ────────────────────────────────────────────────────────────────
  'cream', 'butter', 'cheese', 'yogurt', 'yoghurt',
  'lactose', 'lactalbumin', 'lactoglobulin', 'skimmed', 'whipping',
  // ── Grains / Cereals ──────────────────────────────────────────────────────
  'wheat', 'barley', 'maize', 'cereal', 'cereals',
  'semolina', 'polenta', 'bulgur', 'couscous', 'noodles', 'pasta',
  'bread', 'breadcrumbs', 'biscuit', 'biscuits', 'cracker', 'crackers',
  'millet', 'sorghum', 'spelt', 'emmer', 'einkorn',
  // ── Fats / Oils ───────────────────────────────────────────────────────────
  'coconut', 'sunflower', 'rapeseed', 'olive', 'illipe',
  'cocoa', 'lard', 'suet', 'tallow', 'ghee', 'shortening', 'margarine',
  'vegetable', 'vegetables',
  // ── Sweeteners ────────────────────────────────────────────────────────────
  'glucose', 'fructose', 'dextrose', 'maltose', 'sucrose', 'treacle',
  'honey', 'syrup', 'molasses', 'invert', 'sorbitol', 'xylitol',
  'maltitol', 'mannitol', 'erythritol', 'stevia', 'aspartame',
  'saccharin', 'acesulfame', 'sucralose', 'maltodextrin',
  // ── Hydrocolloids / Stabilisers ───────────────────────────────────────────
  'pectin', 'inulin', 'xanthan', 'carrageenan', 'locust',
  'tapioca', 'arrowroot', 'cellulose', 'methylcellulose',
  // ── Nuts / Seeds ──────────────────────────────────────────────────────────
  'almond', 'almonds', 'cashew', 'cashews', 'peanut', 'peanuts',
  'hazelnut', 'hazelnuts', 'walnut', 'walnuts', 'pecan', 'pecans',
  'pistachio', 'pistachios', 'sesame', 'linseed', 'flaxseed',
  'pumpkin', 'poppy',
  // ── Fruits / Vegetables ───────────────────────────────────────────────────
  'tomato', 'tomatoes', 'onion', 'onions', 'garlic', 'ginger',
  'lemon', 'orange', 'apple', 'apples', 'banana', 'cherry',
  'cherries', 'strawberry', 'raspberry', 'blueberry', 'carrot',
  'carrots', 'potato', 'potatoes', 'spinach', 'lettuce', 'beans',
  'lentils', 'chickpea', 'chickpeas', 'celery', 'peppers', 'chilli',
  'chilies', 'asparagus', 'broccoli', 'cauliflower', 'courgette',
  'aubergine', 'mushroom', 'mushrooms', 'sweetcorn',
  // ── Meat / Fish ───────────────────────────────────────────────────────────
  'chicken', 'turkey', 'venison',
  'tuna', 'salmon', 'haddock', 'shrimp', 'prawn', 'prawns',
  'lobster', 'anchovy', 'sardine', 'mackerel', 'herring',
  'tilapia', 'pollock',
  // ── Confectionery ────────────────────────────────────────────────────────
  'chocolate', 'vanilla', 'caramel', 'nougat',
  'toffee', 'fondant', 'fudge', 'marzipan', 'praline', 'liquorice',
  'licorice', 'chewy', 'wafer', 'biscuit',
  // ── Organic acids / Acidity regulators ───────────────────────────────────
  'citric', 'lactic', 'malic', 'tartaric', 'ascorbic', 'acetic',
  'sorbic', 'benzoic', 'phosphoric', 'fumaric', 'adipic', 'propionic',
  'glucono', 'delta', 'lactone',
  // ── Additives by common name ─────────────────────────────────────────────
  'lecithin', 'lecithins', 'emulsifier', 'emulsifiers', 'stabiliser',
  'stabilisers', 'stabilizer', 'stabilizers', 'preservative',
  'preservatives', 'antioxidant', 'antioxidants', 'thickener',
  'thickeners', 'sweetener', 'sweeteners', 'raising', 'agent',
  'agents', 'extract', 'extracts', 'concentrate', 'concentrates',
  'flavouring', 'flavourings', 'flavoring', 'flavorings',
  'colour', 'colours', 'color', 'colors',
  // ── Salts / Minerals used as additives ───────────────────────────────────
  'phosphate', 'phosphates', 'carbonate', 'carbonates',
  'sulphate', 'sulphates', 'sulfate', 'sulfates',
  'chloride', 'chlorides', 'hydroxide', 'oxide',
  'bicarbonate', 'ammonium', 'potassium', 'calcium', 'sodium',
  'magnesium', 'ferrous', 'ferric', 'copper',
  'selenium', 'iodine', 'chromium',
  // ── Vitamins / Minerals / Fortification ──────────────────────────────────
  'vitamin', 'vitamins', 'mineral', 'minerals',
  'niacin', 'riboflavin', 'thiamin', 'thiamine', 'folate', 'folic',
  'biotin', 'pantothenic', 'pyridoxine', 'cobalamin', 'tocopherol',
  'ascorbate', 'retinol', 'carotene', 'calciferol', 'tocopheryl',
  'cyanocobalamin', 'cholecalciferol',
  // ── Descriptors ──────────────────────────────────────────────────────────
  'whole', 'skimmed', 'reduced', 'dried',
  'desiccated', 'powder', 'powdered', 'liquid', 'modified', 'refined',
  'unrefined', 'enriched', 'fortified', 'organic', 'pasteurised',
  'pasteurized', 'homogenised', 'homogenized', 'hydrogenated',
  'partially', 'fully', 'defatted', 'roasted', 'toasted', 'smoked',
  'fermented', 'cultured', 'concentrated', 'reconstituted', 'soluble',
  'insoluble', 'natural', 'artificial',
  // ── Spices / Herbs ────────────────────────────────────────────────────────
  'pepper', 'paprika', 'cumin', 'cinnamon', 'nutmeg', 'cloves',
  'cardamom', 'turmeric', 'saffron', 'basil', 'oregano', 'thyme',
  'rosemary', 'tarragon', 'coriander', 'curcumin', 'allspice', 'fennel',
  'fenugreek', 'capers',
  // ── Common structural words in ingredient declarations ────────────────────
  'contains', 'ingredients', 'ingredient', 'allergens', 'allergen',
  'traces', 'minimum', 'percentage', 'approximate', 'including',
  'product', 'products', 'source', 'added', 'kernel', 'seeds',
  'juice', 'paste', 'puree',
  // ── Cheese types ──────────────────────────────────────────────────────────
  'cheddar', 'parmesan', 'mozzarella', 'gruyere', 'emmental',
  'ricotta', 'mascarpone', 'stilton', 'gouda',
  // ── Process words ────────────────────────────────────────────────────────
  'bleached', 'unbleached', 'sifted', 'milled', 'ground', 'crushed',
  'pressed', 'extracted', 'purified', 'treated', 'washed', 'blanched',
  'baked', 'fried', 'grilled', 'cooked', 'frozen', 'fresh',
  // ── Misc food / drink ────────────────────────────────────────────────────
  'yeast', 'vinegar', 'mustard', 'baking', 'alcohol', 'ethanol',
  'stock', 'broth', 'sauce', 'malt', 'wheat',
]);

// ---------------------------------------------------------------------------
// isLikelyNonEnglishIngredients
// ---------------------------------------------------------------------------

/**
 * Returns true if the raw ingredient text appears to be in a language other
 * than English. Checks non-ASCII character density and known German/French
 * lexical markers.
 */
export function isLikelyNonEnglishIngredients(text: string): boolean {
  if (!text || text.length < 15) return false;

  // Non-ASCII chars typical of German/French/Spanish/Italian – rare in English
  const nonAsciiCount = (text.match(/[àáâäæãåçćèéêëîïíìłńñôöòóœøśšûüùúÿžżÄÖÜß]/g) || []).length;
  if (nonAsciiCount >= 2) return true;

  const t = text.toLowerCase();

  // German-specific ingredient terms
  const germanTerms = [
    'zucker', 'emulgator', 'weizenmehl', 'magermilch', 'vollmilch',
    'kakaobutter', 'glukosesirup', 'molkenpulver', 'pflanzenfett',
    'maisstärke', 'wasser', 'salz', 'mehl', 'milchpulver', 'sojalecithin',
    // Confectionery-specific German terms absent from the original list —
    // these appear in short ingredient declarations where the classic markers
    // (zucker, weizenmehl, etc.) may be absent.
    'aromen',        // "flavourings" in German; English always says "flavourings"/"natural flavours"
    'kakaomasse',    // "cocoa mass" in German; English says "cocoa mass"/"cocoa solids"
    'palmfett',      // "palm fat" in German; English says "palm fat"/"palm oil"
    'saccharose',    // German/French for sucrose; English labelling uses "sucrose" or "sugar"
    'laktose',       // German for lactose; English spelling is "lactose" (different token)
    'butterreinfett',// German for anhydrous milk fat; no English equivalent spelling
  ];
  if (germanTerms.filter(m => t.includes(m)).length >= 2) return true;

  // French-specific ingredient terms
  const frenchTerms = [
    'viande', 'lait ', 'fromage', 'semoule', 'pâtes', '(contient',
    'huile de', 'farine de', 'beurre', 'crème', 'blé dur',
    'eau potable', 'tomates pelées', 'sucre blanc', 'lécithine',
    'arôme', 'émulsifiant',
  ];
  if (frenchTerms.filter(m => t.includes(m)).length >= 2) return true;

  // Dutch/Flemish ingredient terms
  const dutchTerms = [
    'suiker', 'tarwebloem', 'volle melk', 'magere melk', 'plantaardig',
    'emulgator', 'zout', 'melkpoeder', 'glucosestroop',
  ];
  if (dutchTerms.filter(m => t.includes(m)).length >= 2) return true;

  return false;
}

// ---------------------------------------------------------------------------
// isUsableEnglishIngredients  (strict positive English gate)
// ---------------------------------------------------------------------------

/**
 * Returns true only when the ingredient text is high-confidence English.
 *
 * The check is intentionally strict: we would rather exclude a genuine
 * English product whose text we cannot verify than allow garbled / mixed-
 * language text that would degrade analysis quality.
 *
 * Gates applied in order:
 *  1. Minimum useful length (20 chars)
 *  2. Non-ASCII foreign character density (≥ 2 → reject)
 *  3. Known non-English lexical patterns (German / French / Dutch)
 *  4. Positive gate: must have at least 2 recognised English food tokens
 *  5. Garbage density gate: number of unrecognised long tokens must not
 *     exceed max(3, floor(totalLongTokens × 0.30))
 *     This scales with list length so unusual-but-legitimate chemical names
 *     in a long list don't cause false rejections.
 *  6. Recognition-rate gate (lists with ≥ 8 long tokens): rate must be ≥ 50%
 */
export function isUsableEnglishIngredients(text: string): boolean {
  if (!text || text.trim().length < 20) return false;

  // Gate 1 – non-ASCII foreign character density
  const nonAsciiCount = (text.match(/[àáâäæãåçćèéêëîïíìłńñôöòóœøśšûüùúÿžżÄÖÜß]/g) || []).length;
  if (nonAsciiCount >= 2) return false;

  // Gate 2 – known non-English lexical patterns
  if (isLikelyNonEnglishIngredients(text)) return false;

  // Extract all 5+ character purely-alphabetic tokens
  const longTokens = (text.toLowerCase().match(/[a-z]{5,}/g) || []);

  // Gate 3 – positive English signal: must have at least 2 recognised food words
  const unrecognised = longTokens.filter(t => !ENGLISH_FOOD_VOCABULARY.has(t));
  const recognisedCount = longTokens.length - unrecognised.length;
  if (recognisedCount < 2) return false;

  // Gate 4 – garbage density gate (scales with list length)
  // Allows up to max(3, 30% of total tokens) unrecognised tokens.
  // 4 unrecognised tokens in an 11-token list (36%) → exceeds 30% → reject.
  // 4 unrecognised tokens in a 20-token list (20%) → within 30% → allow.
  const maxUnrecognised = Math.max(3, Math.floor(longTokens.length * 0.30));
  if (unrecognised.length > maxUnrecognised) return false;

  // Gate 5 – recognition-rate gate (only applied when list is large enough)
  if (longTokens.length >= 8) {
    const recognitionRate = recognisedCount / longTokens.length;
    if (recognitionRate < 0.50) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// hasEnglishIngredients  (single product-level gate)
// ---------------------------------------------------------------------------

/**
 * Returns true only when a product has usable English ingredient text.
 *
 * Priority:
 *  1. ingredients_text_en present and non-empty → always eligible
 *     (explicit English translation provided by OFF contributor – trusted)
 *  2. ingredients_text present → eligible only if it passes the strict
 *     isUsableEnglishIngredients check
 *  3. No ingredient text → ineligible
 */
export function hasEnglishIngredients(p: any): boolean {
  if (p.ingredients_text_en && p.ingredients_text_en.trim().length > 0) {
    return isUsableEnglishIngredients(p.ingredients_text_en);
  }
  if (!p.ingredients_text || p.ingredients_text.trim().length < 20) return false;
  return isUsableEnglishIngredients(p.ingredients_text);
}
