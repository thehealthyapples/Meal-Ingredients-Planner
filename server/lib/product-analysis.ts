const UPF_INDICATORS = [
  'emulsifier', 'emulsifiers',
  'stabiliser', 'stabilisers', 'stabilizer', 'stabilizers',
  'modified starch', 'modified maize starch', 'modified corn starch',
  'flavouring', 'flavourings', 'flavoring', 'flavorings',
  'artificial flavour', 'artificial flavor',
  'maltodextrin', 'dextrose',
  'colour', 'coloring', 'colouring',
  'sweetener', 'aspartame', 'sucralose', 'acesulfame', 'saccharin',
  'hydrogenated', 'partially hydrogenated',
  'preservative', 'preservatives',
  'anti-caking', 'anticaking',
  'thickener', 'thickeners',
  'gelling agent',
  'humectant', 'humectants',
  'flavour enhancer', 'flavor enhancer',
  'monosodium glutamate', 'msg',
  'high fructose corn syrup', 'hfcs',
  'palm oil',
  'sodium benzoate', 'potassium sorbate',
  'carrageenan',
  'xanthan gum',
  'soy lecithin',
  'mono and diglycerides', 'mono- and diglycerides',
  'sodium nitrite', 'sodium nitrate',
  'polysorbate',
  'bha', 'bht',
  'tbhq',
  'dimethylpolysiloxane',
  'cellulose',
  'invert sugar',
];

const E_NUMBER_PATTERN = /\bE\d{3,4}[a-z]?\b/i;

export interface ParsedIngredient {
  name: string;
  percent: number | null;
  isUPF: boolean;
  isENumber: boolean;
}

export interface ProductAnalysis {
  ingredients: ParsedIngredient[];
  novaGroup: number;
  healthScore: number;
  isUltraProcessed: boolean;
  warnings: string[];
  upfCount: number;
  totalIngredients: number;
}

export function parseProductIngredients(text: string): ParsedIngredient[] {
  if (!text || !text.trim()) return [];

  const cleaned = text
    .replace(/\n/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  const parts = splitIngredients(cleaned);

  return parts.map(part => {
    let name = part.trim();
    let percent: number | null = null;

    const percentMatch = name.match(/\(?\s*(\d+(?:\.\d+)?)\s*%\s*\)?/);
    if (percentMatch) {
      percent = parseFloat(percentMatch[1]);
      name = name.replace(percentMatch[0], '').trim();
    }

    name = name.replace(/^\(+|\)+$/g, '').trim();
    name = name.replace(/\.$/, '').trim();

    if (!name) return null;

    const lower = name.toLowerCase();
    const isENumber = E_NUMBER_PATTERN.test(name);
    const isUPF = isENumber || UPF_INDICATORS.some(indicator =>
      lower.includes(indicator)
    );

    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      percent,
      isUPF,
      isENumber,
    };
  }).filter(Boolean) as ParsedIngredient[];
}

function splitIngredients(text: string): string[] {
  const results: string[] = [];
  let current = '';
  let depth = 0;

  for (const char of text) {
    if (char === '(' || char === '[') {
      depth++;
      current += char;
    } else if (char === ')' || char === ']') {
      depth = Math.max(0, depth - 1);
      current += char;
    } else if (char === ',' && depth === 0) {
      if (current.trim()) results.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) results.push(current.trim());
  return results;
}

export function detectUPF(ingredients: ParsedIngredient[]): boolean {
  return ingredients.some(i => i.isUPF);
}

export function calculateProductHealthScore(
  ingredients: ParsedIngredient[],
  nutriments: Record<string, any> | null,
  novaGroup: number | null
): number {
  let score = 100;

  const upfIngredients = ingredients.filter(i => i.isUPF);
  score -= upfIngredients.length * 8;

  const hasArtificialSweetener = ingredients.some(i => {
    const lower = i.name.toLowerCase();
    return ['aspartame', 'sucralose', 'acesulfame', 'saccharin'].some(s => lower.includes(s));
  });
  if (hasArtificialSweetener) score -= 15;

  const hasPreservative = ingredients.some(i => {
    const lower = i.name.toLowerCase();
    return lower.includes('preservative') || lower.includes('sodium benzoate') ||
           lower.includes('potassium sorbate') || lower.includes('sodium nitrite') ||
           lower.includes('bha') || lower.includes('bht');
  });
  if (hasPreservative) score -= 10;

  if (nutriments) {
    const sugar = nutriments['sugars_100g'] || nutriments['sugars'];
    const satFat = nutriments['saturated-fat_100g'] || nutriments['saturated_fat_100g'];
    const salt = nutriments['salt_100g'] || nutriments['salt'];
    const protein = nutriments['proteins_100g'] || nutriments['proteins'];
    const fiber = nutriments['fiber_100g'] || nutriments['fibre_100g'];

    if (typeof sugar === 'number' && sugar > 15) score -= 10;
    else if (typeof sugar === 'number' && sugar > 10) score -= 5;

    if (typeof satFat === 'number' && satFat > 5) score -= 10;
    else if (typeof satFat === 'number' && satFat > 3) score -= 5;

    if (typeof salt === 'number' && salt > 1.5) score -= 10;
    else if (typeof salt === 'number' && salt > 1) score -= 5;

    if (typeof protein === 'number' && protein > 10) score += 5;
    if (typeof fiber === 'number' && fiber > 3) score += 5;
  }

  if (novaGroup === 4) score -= 15;
  else if (novaGroup === 3) score -= 5;
  else if (novaGroup === 1) score += 10;

  const wholeIngredients = ingredients.filter(i => !i.isUPF && !i.isENumber);
  if (wholeIngredients.length > 5) score += 5;

  const hasOrganic = ingredients.some(i => i.name.toLowerCase().includes('organic'));
  if (hasOrganic) score += 5;

  return Math.max(0, Math.min(100, score));
}

export function generateWarnings(ingredients: ParsedIngredient[], nutriments: Record<string, any> | null): string[] {
  const warnings: string[] = [];

  const upfNames = ingredients.filter(i => i.isUPF).map(i => i.name);
  if (upfNames.length > 0) {
    const types = new Set<string>();
    for (const name of upfNames) {
      const lower = name.toLowerCase();
      if (lower.includes('emulsifier')) types.add('emulsifiers');
      else if (lower.includes('stabiliser') || lower.includes('stabilizer')) types.add('stabilisers');
      else if (lower.includes('flavouring') || lower.includes('flavoring')) types.add('flavourings');
      else if (lower.includes('preservative') || lower.includes('benzoate') || lower.includes('sorbate')) types.add('preservatives');
      else if (lower.includes('colour') || lower.includes('coloring')) types.add('colourings');
      else if (lower.includes('sweetener') || lower.includes('aspartame') || lower.includes('sucralose')) types.add('artificial sweeteners');
      else if (lower.includes('modified starch')) types.add('modified starch');
      else if (lower.includes('hydrogenated')) types.add('hydrogenated oils');
      else if (lower.includes('maltodextrin') || lower.includes('dextrose')) types.add('processed sugars');
      else if (E_NUMBER_PATTERN.test(name)) types.add('E-numbers');
      else types.add(name);
    }
    Array.from(types).forEach(type => {
      warnings.push(`Contains ${type}`);
    });
  }

  if (nutriments) {
    const sugar = nutriments['sugars_100g'];
    const satFat = nutriments['saturated-fat_100g'] || nutriments['saturated_fat_100g'];
    const salt = nutriments['salt_100g'];

    if (typeof sugar === 'number' && sugar > 15) warnings.push('High sugar content');
    if (typeof satFat === 'number' && satFat > 5) warnings.push('High saturated fat');
    if (typeof salt === 'number' && salt > 1.5) warnings.push('High salt content');
  }

  return warnings;
}

export function analyzeProduct(
  ingredientsText: string,
  nutriments: Record<string, any> | null,
  apiNovaGroup: number | null
): ProductAnalysis {
  const ingredients = parseProductIngredients(ingredientsText);
  const isUltraProcessed = detectUPF(ingredients);
  const upfCount = ingredients.filter(i => i.isUPF).length;

  let novaGroup = apiNovaGroup || 1;
  if (!apiNovaGroup) {
    if (isUltraProcessed || upfCount >= 2) novaGroup = 4;
    else if (upfCount === 1) novaGroup = 3;
    else if (ingredients.length > 5) novaGroup = 2;
    else novaGroup = 1;
  }

  const healthScore = calculateProductHealthScore(ingredients, nutriments, novaGroup);
  const warnings = generateWarnings(ingredients, nutriments);

  return {
    ingredients,
    novaGroup,
    healthScore,
    isUltraProcessed,
    warnings,
    upfCount,
    totalIngredients: ingredients.length,
  };
}
