const UNIT_CONVERSIONS: Record<string, { base: string; factor: number }> = {
  kg: { base: 'g', factor: 1000 },
  kilogram: { base: 'g', factor: 1000 },
  kilograms: { base: 'g', factor: 1000 },
  g: { base: 'g', factor: 1 },
  gram: { base: 'g', factor: 1 },
  grams: { base: 'g', factor: 1 },
  mg: { base: 'g', factor: 0.001 },
  lb: { base: 'g', factor: 453.592 },
  lbs: { base: 'g', factor: 453.592 },
  pound: { base: 'g', factor: 453.592 },
  pounds: { base: 'g', factor: 453.592 },
  oz: { base: 'g', factor: 28.3495 },
  ounce: { base: 'g', factor: 28.3495 },
  ounces: { base: 'g', factor: 28.3495 },

  l: { base: 'ml', factor: 1000 },
  liter: { base: 'ml', factor: 1000 },
  liters: { base: 'ml', factor: 1000 },
  litre: { base: 'ml', factor: 1000 },
  litres: { base: 'ml', factor: 1000 },
  ml: { base: 'ml', factor: 1 },
  milliliter: { base: 'ml', factor: 1 },
  milliliters: { base: 'ml', factor: 1 },
  cup: { base: 'ml', factor: 240 },
  cups: { base: 'ml', factor: 240 },
  tbsp: { base: 'ml', factor: 15 },
  tbs: { base: 'ml', factor: 15 },
  tblsp: { base: 'ml', factor: 15 },
  tblsps: { base: 'ml', factor: 15 },
  tbls: { base: 'ml', factor: 15 },
  tablespoon: { base: 'ml', factor: 15 },
  tablespoons: { base: 'ml', factor: 15 },
  tsp: { base: 'ml', factor: 5 },
  tsps: { base: 'ml', factor: 5 },
  teaspoon: { base: 'ml', factor: 5 },
  teaspoons: { base: 'ml', factor: 5 },
  'fl oz': { base: 'ml', factor: 29.5735 },
  pint: { base: 'ml', factor: 473.176 },
  pints: { base: 'ml', factor: 473.176 },
  quart: { base: 'ml', factor: 946.353 },
  quarts: { base: 'ml', factor: 946.353 },
  gallon: { base: 'ml', factor: 3785.41 },
  gallons: { base: 'ml', factor: 3785.41 },
};

const COUNTABLE_WORDS: Record<string, string> = {
  egg: 'egg',
  eggs: 'egg',
  clove: 'clove',
  cloves: 'clove',
  piece: 'piece',
  pieces: 'piece',
  slice: 'slice',
  slices: 'slice',
  stalk: 'stalk',
  stalks: 'stalk',
  fillet: 'fillet',
  fillets: 'fillet',
  breast: 'breast',
  breasts: 'breast',
  thigh: 'thigh',
  thighs: 'thigh',
  strip: 'strip',
  strips: 'strip',
  head: 'head',
  heads: 'head',
  bunch: 'bunch',
  bunches: 'bunch',
  sprig: 'sprig',
  sprigs: 'sprig',
  can: 'can',
  cans: 'can',
  tin: 'tin',
  tins: 'tin',
  pinch: 'pinch',
  dash: 'dash',
};

const KEEP_PLURAL_COMPOUNDS = new Set([
  'bay leaves',
  'curry leaves',
  'kaffir lime leaves',
  'vine leaves',
  'grape leaves',
  'filo leaves',
  'lime leaves',
  'pandan leaves',
  'banana leaves',
  'spring onions',
  'salad leaves',
  'mixed leaves',
  'baked beans',
  'kidney beans',
  'black beans',
  'butter beans',
  'cannellini beans',
  'borlotti beans',
  'haricot beans',
  'green beans',
  'runner beans',
  'broad beans',
  'french beans',
  'mixed beans',
  'refried beans',
  'porridge oats',
  'rolled oats',
  'jumbo oats',
  'pine nuts',
  'brazil nuts',
  'mixed nuts',
  'flaked almonds',
  'ground almonds',
  'sesame seeds',
  'sunflower seeds',
  'pumpkin seeds',
  'chia seeds',
  'poppy seeds',
  'mixed seeds',
  'capers',
  'cornflakes',
]);

const PLURAL_MAP: Record<string, string> = {
  eggs: 'egg',
  tomatoes: 'tomato',
  potatoes: 'potato',
  onions: 'onion',
  carrots: 'carrot',
  peppers: 'pepper',
  cloves: 'clove',
  breasts: 'breast',
  thighs: 'thigh',
  slices: 'slice',
  pieces: 'piece',
  leaves: 'leaf',
  berries: 'berry',
  cherries: 'cherry',
  mushrooms: 'mushroom',
  bananas: 'banana',
  apples: 'apple',
  oranges: 'orange',
  lemons: 'lemon',
  limes: 'lime',
  avocados: 'avocado',
  cucumbers: 'cucumber',
  zucchinis: 'zucchini',
  stalks: 'stalk',
  strips: 'strip',
  fillets: 'fillet',
  chillies: 'chilli',
  anchovies: 'anchovy',
  olives: 'olive',
  clementines: 'clementine',
  peaches: 'peach',
  nectarines: 'nectarine',
  plums: 'plum',
  grapes: 'grape',
  strawberries: 'strawberry',
  blueberries: 'blueberry',
  raspberries: 'raspberry',
  cranberries: 'cranberry',
  almonds: 'almond',
  walnuts: 'walnut',
  cashews: 'cashew',
  peanuts: 'peanut',
};

const TRAILING_ADJECTIVES = new Set([
  'mashed', 'separated', 'beaten', 'whisked', 'scrambled', 'poached',
  'boiled', 'fried', 'baked', 'grilled', 'steamed', 'sauteed', 'sautéed',
  'blanched', 'braised', 'caramelised', 'caramelized', 'charred',
  'crumbled', 'cubed', 'deglazed', 'dissolved', 'flaked', 'julienned',
  'marinated', 'mashed', 'pureed', 'puréed', 'reduced', 'simmered',
  'soaked', 'strained', 'thawed', 'whipped', 'wilted', 'zested',
]);

const DESCRIPTOR_WORDS = new Set([
  'large', 'medium', 'small', 'big', 'fresh', 'frozen', 'dried', 'chopped',
  'diced', 'minced', 'sliced', 'grated', 'shredded', 'peeled', 'crushed',
  'ground', 'whole', 'halved', 'quartered', 'thin', 'thick', 'fine', 'coarse',
  'ripe', 'raw', 'cooked', 'boneless', 'skinless', 'organic', 'free-range', 'closed', 'cup',
  'extra', 'virgin', 'unsalted', 'salted', 'plain', 'natural', 'tinned',
  'canned', 'packed', 'loosely', 'firmly', 'roughly', 'finely', 'of',
  'to', 'taste', 'optional', 'garnish', 'serving', 'about', 'approximately',
  'handful', 'generous', 'heaped', 'level', 'rounded', 'total', 'each',
  'warm', 'cold', 'room', 'temperature', 'softened', 'melted', 'beaten',
  'sifted', 'toasted', 'roasted', 'smoked', 'trimmed', 'deseeded',
  'seeded', 'pitted', 'cored', 'washed', 'drained', 'rinsed',
  'lengthway', 'lengthways', 'lengthwise', 'crosswise', 'crossways',
  'widthwise', 'widthways', 'diagonally',
  ...Array.from(TRAILING_ADJECTIVES),
]);

const STRIP_PHRASES = [
  /\bcut\s+into\s+\w+/gi,
  /\bthumb[- ]?size\b/gi,
  /\bfinger[- ]?size\b/gi,
  /\bto\s+serve\b/gi,
  /\bfor\s+serving\b/gi,
  /\bfor\s+garnish\b/gi,
  /\bsaturates?\d*g?\w*/gi,
  /\bzest(?:ed)?\s+(?:and\s+)?(?:juice(?:d)?\s+)?(?:of\s+)?/gi,
  /\bjuice(?:d)?\s+(?:and\s+)?(?:zest(?:ed)?\s+)?(?:of\s+)?/gi,
  /\bin\s+total\b/gi,
  /\babout\b/gi,
  /\bapproximately?\b/gi,
  /\bhandful\s+of\b/gi,
  /\ba\s+handful\b/gi,
  /\b(?:plus|and)\s+extra\b/gi,
  /\bor\s+to\s+taste\b/gi,
  /\bto\s+taste\b/gi,
  /\bweighing\s+about\s+\S+/gi,
  /\bstep\s+\d+\w*/gi,
  /\bmade\s+up\s+with\s+\w+/gi,
  /\bas\s+many\s+as\s+you\s+\w+/gi,
  /[–—]\s*\d+\s*$/,
  /\bfind\s+with\s+.*$/gi,
  /\bwe\s+used\s+\w+\b/gi,
  /\bfrom\s+a\s+cube\b.*$/gi,
  /\bmake\s+it\s+.*$/gi,
  /\bsee\s+['']?try['']?\s+below\b/gi,
  /\bwhatever\s+you\s+have\b.*$/gi,
  /\bno\s+need\s+(?:to\s+)?peel\b/gi,
  /\band\s+coarsely\b/gi,
  /\bor\s+\d+\s+(?:more|less|extra|fewer|drops?)\b.*$/gi,
  /\bfor\s+sprinkling\b/gi,
  /\bplus\s+\d+\s+drop\b/gi,
  /\bwarmed\b/gi,
  /\bleaves?\s+picked\b.*$/gi,
  /\bsprigs?\b/gi,
  /\blengthway\b/gi,
  /\bthickly\b/gi,
  /\bhandfuls?\b/gi,
  /\bpinch(?:es)?\b/gi,
  /\bx\s+\d+g\b/gi,
  /(?<=\s)\d+g\b/gi,
  /\b\d+-\d+\b/gi,
  /\band\s+½\s+/gi,
  /\b½\s+and\s+½\b/gi,
  /\bfew\s+drops?\b/gi,
  /\bhot\s+(?=vegetable|chicken|beef|lamb|fish)/gi,
  /\bpack\b/gi,
  /\s+and\s*$/gi,
  /\s+or\s*$/gi,
  /\bjuiced\b/gi,
];

const INGREDIENT_CATEGORIES: Record<string, string[]> = {
  meat: ['chicken', 'beef', 'pork', 'lamb', 'bacon', 'steak', 'ham', 'turkey', 'duck', 'sausage', 'mince', 'veal', 'venison', 'chorizo', 'salami', 'prosciutto', 'pancetta'],
  fish: ['salmon', 'tuna', 'cod', 'haddock', 'mackerel', 'trout', 'bass', 'halibut', 'sardine', 'anchovy', 'fish', 'prawn', 'shrimp', 'crab', 'lobster', 'mussel', 'squid', 'calamari', 'scallop', 'clam', 'oyster'],
  dairy: ['milk', 'cheese', 'cream', 'butter', 'yogurt', 'yoghurt', 'cheddar', 'mozzarella', 'parmesan', 'ricotta', 'mascarpone', 'brie', 'camembert', 'feta', 'gouda', 'gruyere', 'ghee', 'curd', 'whey'],
  eggs: ['egg'],
  produce: ['onion', 'garlic', 'tomato', 'potato', 'carrot', 'pepper', 'lettuce', 'spinach', 'broccoli', 'cauliflower', 'cabbage', 'celery', 'cucumber', 'courgette', 'zucchini', 'aubergine', 'eggplant', 'mushroom', 'leek', 'beetroot', 'turnip', 'parsnip', 'radish', 'sweetcorn', 'corn', 'pea', 'bean', 'asparagus', 'artichoke', 'kale', 'chard', 'rocket', 'watercress'],
  fruit: ['apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'strawberry', 'blueberry', 'raspberry', 'blackberry', 'mango', 'pineapple', 'melon', 'watermelon', 'peach', 'pear', 'plum', 'cherry', 'fig', 'date', 'avocado', 'coconut', 'kiwi', 'pomegranate', 'passion fruit', 'cranberry'],
  grains: ['rice', 'pasta', 'noodle', 'bread', 'flour', 'oat', 'quinoa', 'couscous', 'barley', 'bulgur', 'polenta', 'cornmeal', 'semolina', 'tortilla', 'wrap', 'pitta', 'pita', 'naan', 'focaccia', 'ciabatta', 'sourdough', 'bagel', 'croissant', 'cracker', 'breadcrumb'],
  herbs: ['basil', 'oregano', 'thyme', 'rosemary', 'parsley', 'coriander', 'cilantro', 'mint', 'dill', 'sage', 'chive', 'tarragon', 'bay leaf', 'bay leaves', 'marjoram', 'cumin', 'paprika', 'turmeric', 'cinnamon', 'nutmeg', 'clove', 'cardamom', 'ginger', 'saffron', 'chilli', 'cayenne'],
  oils: ['olive oil', 'vegetable oil', 'sunflower oil', 'coconut oil', 'sesame oil', 'rapeseed oil', 'oil', 'vinegar', 'balsamic'],
  condiments: ['soy sauce', 'worcestershire', 'tabasco', 'ketchup', 'mustard', 'mayonnaise', 'honey', 'maple syrup', 'sugar', 'salt', 'pepper', 'stock', 'broth', 'bouillon', 'paste', 'sauce'],
  nuts: ['almond', 'walnut', 'cashew', 'pecan', 'pistachio', 'peanut', 'hazelnut', 'macadamia', 'pine nut', 'brazil nut', 'chestnut', 'sesame seed', 'sunflower seed', 'pumpkin seed', 'flaxseed', 'chia seed'],
  legumes: ['lentil', 'chickpea', 'kidney bean', 'black bean', 'cannellini', 'butter bean', 'haricot', 'edamame', 'tofu', 'tempeh'],
  bakery: ['cake', 'pastry', 'pie', 'tart', 'biscuit', 'cookie', 'muffin', 'scone', 'doughnut', 'brownie', 'flapjack'],
  tinned: ['tinned', 'canned', 'tin of', 'can of'],
};

export function detectIngredientCategory(name: string): string {
  const lower = name.toLowerCase();
  for (const [category, keywords] of Object.entries(INGREDIENT_CATEGORIES)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return category;
    }
  }
  return 'other';
}

export function cleanIngredientText(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/[\u2044\u2215]/g, '/');
  cleaned = cleaned.replace(/(?<!\d)\/(\d+)/g, '1/$1');
  for (const pattern of STRIP_PHRASES) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

export function isAlphanumericGarbage(text: string): boolean {
  const t = text.trim();
  if (/^[A-Za-z0-9]+$/.test(t) && !/^[A-Za-z]+$/.test(t) && t.length > 1) {
    return true;
  }
  if (/^[A-Za-z0-9.]+$/.test(t) && !/^[A-Za-z.]+$/.test(t) && /\d/.test(t) && t.length > 1) {
    return true;
  }
  if (/^[A-Z0-9]{3,}$/.test(t)) {
    return true;
  }
  if (/^\d+[A-Za-z]\d+/.test(t) || /^[A-Za-z]\d+[A-Za-z]/.test(t)) {
    return true;
  }
  return false;
}

export function removeTrailingAdjectives(name: string): string {
  const words = name.split(' ');
  while (words.length > 1) {
    const last = words[words.length - 1].toLowerCase();
    if (TRAILING_ADJECTIVES.has(last) || DESCRIPTOR_WORDS.has(last)) {
      words.pop();
    } else {
      break;
    }
  }
  return words.join(' ');
}

export interface ParsedIngredient {
  originalText: string;
  name: string;
  normalizedName: string;
  quantity: number;
  unit: string;
}

const FRACTION_MAP: Record<string, number> = {
  '\u00BD': 0.5, '\u2153': 0.333, '\u2154': 0.667, '\u00BC': 0.25, '\u00BE': 0.75,
  '\u2155': 0.2, '\u2156': 0.4, '\u2157': 0.6, '\u2158': 0.8, '\u2159': 0.167,
  '\u215A': 0.833, '\u215B': 0.125, '\u215C': 0.375, '\u215D': 0.625, '\u215E': 0.875,
};

function parseFraction(s: string): number | null {
  if (FRACTION_MAP[s]) return FRACTION_MAP[s];
  const slashMatch = s.match(/^(\d+)\/(\d+)$/);
  if (slashMatch) {
    const num = parseInt(slashMatch[1]);
    const den = parseInt(slashMatch[2]);
    if (den !== 0) return num / den;
  }
  return null;
}

export function parseIngredient(text: string): ParsedIngredient {
  let preCleanText = text.trim();
  let extractedQty: number | null = null;
  let extractedUnit: string | null = null;

  if (!/^\d/.test(preCleanText)) {
    const trailingMatch = preCleanText.match(/^(.+?)\s+(\d+\.?\d*)\s*(grams?|kilograms?|kg|mg|ml|milliliters?|liters?|litres?|oz|ounces?|lbs?|pounds?|g|l)\b\s*(.*)$/i);
    if (trailingMatch) {
      const possibleUnit = trailingMatch[3].toLowerCase();
      if (UNIT_CONVERSIONS[possibleUnit]) {
        const conv = UNIT_CONVERSIONS[possibleUnit];
        extractedQty = parseFloat(trailingMatch[2]) * conv.factor;
        extractedUnit = conv.base;
        preCleanText = trailingMatch[1].trim() + (trailingMatch[4] ? ' ' + trailingMatch[4].trim() : '');
      }
    }
  }

  let remaining = cleanIngredientText(preCleanText);
  let quantity = 0;
  let unit = 'unit';

  const quantityMatch = remaining.match(/^(\d+\.?\d*)\s*/);
  if (quantityMatch) {
    quantity = parseFloat(quantityMatch[1]);
    remaining = remaining.slice(quantityMatch[0].length);

    for (const [fracChar, fracVal] of Object.entries(FRACTION_MAP)) {
      if (remaining.startsWith(fracChar)) {
        quantity += fracVal;
        remaining = remaining.slice(fracChar.length).trim();
        break;
      }
    }

    const nextFractionMatch = remaining.match(/^(\d+\/\d+)\s*/);
    if (nextFractionMatch) {
      const frac = parseFraction(nextFractionMatch[1]);
      if (frac !== null) {
        quantity += frac;
        remaining = remaining.slice(nextFractionMatch[0].length);
      }
    } else {
      const denomMatch = remaining.match(/^\/(\d+)\s*/);
      if (denomMatch) {
        const denom = parseInt(denomMatch[1]);
        if (denom > 0 && denom <= 16) {
          const wholePart = Math.floor(quantity);
          const numerator = wholePart > 0 ? wholePart : 1;
          quantity = numerator / denom;
          remaining = remaining.slice(denomMatch[0].length);
        }
      }
    }
  } else {
    for (const [fracChar, fracVal] of Object.entries(FRACTION_MAP)) {
      if (remaining.startsWith(fracChar)) {
        quantity = fracVal;
        remaining = remaining.slice(fracChar.length).trim();
        break;
      }
    }
    if (quantity === 0) {
      const fracMatch = remaining.match(/^(\d+\/\d+)\s*/);
      if (fracMatch) {
        const frac = parseFraction(fracMatch[1]);
        if (frac !== null) {
          quantity = frac;
          remaining = remaining.slice(fracMatch[0].length);
        }
      }
    }
  }

  if (quantity === 0) quantity = 1;

  const unitMatchAttached = remaining.match(/^(grams?|kilograms?|kg|mg|ml|milliliters?|liters?|litres?|oz|ounces?|lbs?|pounds?|g|l)\b\s*/i);
  if (unitMatchAttached) {
    const possibleUnit = unitMatchAttached[1].toLowerCase();
    if (UNIT_CONVERSIONS[possibleUnit]) {
      const conv = UNIT_CONVERSIONS[possibleUnit];
      quantity = quantity * conv.factor;
      unit = conv.base;
      remaining = remaining.slice(unitMatchAttached[0].length);
    }
  } else {
    const unitMatch = remaining.match(/^(fl\s*oz|[a-zA-Z]+)\s*/i);
    if (unitMatch) {
      const possibleUnit = unitMatch[1].toLowerCase().replace(/\s+/g, ' ');
      if (UNIT_CONVERSIONS[possibleUnit]) {
        const conv = UNIT_CONVERSIONS[possibleUnit];
        quantity = quantity * conv.factor;
        unit = conv.base;
        remaining = remaining.slice(unitMatch[0].length);
      } else if (COUNTABLE_WORDS[possibleUnit]) {
        const afterUnit = remaining.slice(unitMatch[0].length).trim();
        if (afterUnit.length > 0) {
          remaining = afterUnit;
        } else {
          remaining = COUNTABLE_WORDS[possibleUnit];
        }
      }
    }
  }

  remaining = remaining.replace(/^of\s+/i, '');

  if (unit === 'unit') {
    const orSplit = remaining.match(/^(.+?)\s+or\s+\d+\s+\w+/i);
    if (orSplit && orSplit[1].trim().length > 1) {
      remaining = orSplit[1].trim();
    }
  }

  if (unit === 'unit' && extractedQty !== null && extractedUnit !== null) {
    quantity = extractedQty;
    unit = extractedUnit;
  }

  const name = remaining.trim();
  const normalizedName = normalizeName(name || text.trim());

  return {
    originalText: text.trim(),
    name: name || text.trim(),
    normalizedName,
    quantity,
    unit,
  };
}

export function normalizeName(name: string): string {
  let cleaned = name.toLowerCase().trim();

  cleaned = cleaned.replace(/[,()]/g, ' ');
  cleaned = cleaned.replace(/\d+\/\d+/g, ' ');
  cleaned = cleaned.replace(/\/\d+/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  const words = cleaned.split(' ').filter(w => !DESCRIPTOR_WORDS.has(w));
  cleaned = words.join(' ') || cleaned;

  cleaned = removeTrailingAdjectives(cleaned);

  if (!KEEP_PLURAL_COMPOUNDS.has(cleaned)) {
    for (const [plural, singular] of Object.entries(PLURAL_MAP)) {
      if (cleaned === plural) {
        cleaned = singular;
        break;
      }
      const parts = cleaned.split(' ');
      const lastIdx = parts.length - 1;
      if (parts[lastIdx] === plural) {
        const candidate = [...parts.slice(0, lastIdx), singular].join(' ');
        if (KEEP_PLURAL_COMPOUNDS.has(cleaned)) break;
        parts[lastIdx] = singular;
        cleaned = parts.join(' ');
        break;
      }
    }

    if (!KEEP_PLURAL_COMPOUNDS.has(cleaned)) {
      const lastWord = cleaned.split(' ').pop() || cleaned;
      if (lastWord.endsWith('ies') && lastWord.length > 4) {
        const stem = lastWord.slice(0, -3) + 'y';
        cleaned = cleaned.slice(0, cleaned.length - lastWord.length) + stem;
      } else if (lastWord.endsWith('ves') && lastWord.length > 4) {
        const stem = lastWord.slice(0, -3) + 'f';
        const candidate = cleaned.slice(0, cleaned.length - lastWord.length) + stem;
        if (!KEEP_PLURAL_COMPOUNDS.has(cleaned)) {
          cleaned = candidate;
        }
      } else if (lastWord.endsWith('es') && !PLURAL_MAP[lastWord] && lastWord.length > 3) {
        const withoutEs = lastWord.slice(0, -2);
        const withoutS = lastWord.slice(0, -1);
        if (['sh', 'ch', 'ss', 'x'].some(suf => withoutEs.endsWith(suf))) {
          cleaned = cleaned.slice(0, cleaned.length - lastWord.length) + withoutEs;
        } else {
          cleaned = cleaned.slice(0, cleaned.length - lastWord.length) + withoutS;
        }
      } else if (lastWord.endsWith('s') && !lastWord.endsWith('ss') && lastWord.length > 3) {
        cleaned = cleaned.slice(0, cleaned.length - lastWord.length) + lastWord.slice(0, -1);
      }
    }
  }

  return cleaned.trim();
}

export interface ConsolidatedItem {
  normalizedName: string;
  displayName: string;
  quantity: number;
  unit: string;
  category: string;
  needsReview?: boolean;
  validationNote?: string;
}

const GARBAGE_PATTERNS = [
  /^saturates?\d/i,
  /^step\s*\d/i,
  /^measuring\s/i,
  /^chopping\s*board/i,
  /^sharp\s*knife/i,
  /^wooden\s*spoon/i,
  /^saucepan/i,
  /^vegetable\s*peeler/i,
];

const NUTRITION_LABEL_PATTERN = /^(?:sugars?|fibre|fiber|protein|fat|carbs?|carbohydrates?|calories|energy|cholesterol|sodium|salt|saturates?|total fat|saturated fat|trans fat|dietary fib(?:re|er)|added sugars?|vitamin\s*[a-z]|calcium|iron|potassium)\s*\d/i;
const NUTRITION_VALUE_PATTERN = /\d+(?:\.\d+)?\s*(?:g|mg|mcg|µg|kcal|kj|iu)\s*(?:low|medium|high|free|trace)?$/i;

export function isGarbageIngredient(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (t.length < 2) return true;
  if (NUTRITION_LABEL_PATTERN.test(t)) return true;
  if (NUTRITION_VALUE_PATTERN.test(t) && !/\s/.test(t)) return true;
  if (/^step\s*\d/i.test(t)) return true;
  if (isAlphanumericGarbage(text.trim())) return true;
  if (/^\d+$/.test(t)) return true;
  if (/^\/\d+$/.test(t)) return true;
  if (/^\d+\/\d+$/.test(t)) return true;
  for (const pat of GARBAGE_PATTERNS) {
    if (pat.test(t)) return true;
  }
  return false;
}

const ML_TO_G_DENSITY: Record<string, number> = {
  'olive oil': 0.92,
  'vegetable oil': 0.92,
  'sunflower oil': 0.92,
  'coconut oil': 0.92,
  'sesame oil': 0.92,
  'rapeseed oil': 0.92,
  'oil': 0.92,
  'butter': 0.91,
  'ghee': 0.91,
  'honey': 1.42,
  'maple syrup': 1.32,
  'golden syrup': 1.4,
  'cream': 1.01,
  'milk': 1.03,
  'yogurt': 1.03,
  'yoghurt': 1.03,
  'soy sauce': 1.1,
  'vinegar': 1.01,
  'balsamic': 1.05,
  'water': 1.0,
  'stock': 1.0,
  'broth': 1.0,
  'wine': 1.0,
  'lemon juice': 1.03,
  'lime juice': 1.03,
  'orange juice': 1.04,
  'tomato paste': 1.1,
  'passata': 1.04,
  'coconut milk': 0.97,
  'peanut butter': 1.09,
  'tahini': 1.07,
};

const UNIT_AVERAGE_WEIGHT_G: Record<string, number> = {
  'egg': 60,
  'onion': 150,
  'red onion': 150,
  'white onion': 150,
  'spring onion': 15,
  'carrot': 80,
  'potato': 180,
  'sweet potato': 200,
  'tomato': 125,
  'cherry tomato': 15,
  'plum tomato': 60,
  'garlic': 5,
  'garlic clove': 5,
  'lemon': 60,
  'lime': 45,
  'orange': 180,
  'apple': 180,
  'banana': 120,
  'avocado': 170,
  'pepper': 160,
  'red pepper': 160,
  'green pepper': 160,
  'yellow pepper': 160,
  'bell pepper': 160,
  'chilli': 10,
  'red chilli': 10,
  'green chilli': 10,
  'courgette': 200,
  'zucchini': 200,
  'aubergine': 300,
  'cucumber': 300,
  'celery': 40,
  'mushroom': 15,
  'black olive': 4,
  'olive': 4,
  'chicken breast': 200,
  'chicken thigh': 150,
  'sausage': 70,
  'beetroot': 100,
  'leek': 200,
  'parsnip': 120,
  'shallot': 30,
  'pear': 170,
  'peach': 150,
  'plum': 70,
  'apricot': 35,
  'fig': 40,
  'mango': 200,
  'kiwi': 75,
  'nectarine': 140,
  'clementine': 75,
  'bay leaf': 0.5,
  'bay leaves': 0.5,
  'tortilla': 50,
  'pitta': 60,
  'bread roll': 60,
  'bread': 35,
  'english mustard powder': 3,
  'coriander': 2,
  'mint': 0.5,
  'ginger': 15,
  'salt': 6,
  'vanilla extract': 5,
  'porridge oat': 40,
};

const KEEP_AS_QUANTITY = new Set([
  'egg',
  'onion', 'red onion', 'white onion', 'spring onion',
  'carrot', 'potato', 'sweet potato',
  'tomato', 'cherry tomato', 'plum tomato',
  'lemon', 'lime', 'orange', 'apple', 'banana',
  'avocado', 'pear', 'peach', 'plum', 'apricot', 'fig', 'mango', 'kiwi',
  'nectarine', 'clementine',
  'pepper', 'red pepper', 'green pepper', 'yellow pepper', 'bell pepper',
  'chilli', 'red chilli', 'green chilli',
  'courgette', 'zucchini', 'aubergine', 'cucumber',
  'leek', 'parsnip', 'beetroot', 'shallot',
  'chicken breast', 'chicken thigh', 'sausage',
  'tortilla', 'pitta', 'bread roll',
  'bay leaf', 'bay leaves',
]);

function shouldKeepAsQuantity(name: string): boolean {
  const lower = name.toLowerCase();
  if (KEEP_AS_QUANTITY.has(lower)) return true;
  for (const item of Array.from(KEEP_AS_QUANTITY)) {
    if (lower.endsWith(' ' + item)) return true;
  }
  return false;
}

function getAverageWeightG(name: string): number | null {
  const lower = name.toLowerCase();
  if (UNIT_AVERAGE_WEIGHT_G[lower] !== undefined) return UNIT_AVERAGE_WEIGHT_G[lower];
  for (const [key, weight] of Object.entries(UNIT_AVERAGE_WEIGHT_G)) {
    if (lower.endsWith(' ' + key)) return weight;
  }
  return null;
}

function getDensity(name: string): number | null {
  const lower = name.toLowerCase();
  for (const [key, density] of Object.entries(ML_TO_G_DENSITY)) {
    if (lower === key || lower.endsWith(' ' + key)) return density;
  }
  return null;
}

function convertMlToG(quantityMl: number, ingredientName: string): number | null {
  const density = getDensity(ingredientName);
  if (density === null) return null;
  return quantityMl * density;
}

export function consolidateIngredients(ingredients: string[]): ConsolidatedItem[] {
  const consolidated = new Map<string, ConsolidatedItem>();

  for (const ing of ingredients) {
    if (isGarbageIngredient(ing)) continue;
    const parsed = parseIngredient(ing);
    if (isGarbageIngredient(parsed.name) || isGarbageIngredient(parsed.normalizedName)) continue;

    let normalizedName = parsed.normalizedName;
    let needsReview = false;
    let validationNote: string | undefined;

    if (normalizedName.length < 2 || /^\s*$/.test(normalizedName)) {
      needsReview = true;
      validationNote = `Could not extract ingredient from: "${ing}"`;
      normalizedName = ing.trim().substring(0, 50);
    }

    if (isAlphanumericGarbage(normalizedName)) {
      continue;
    }

    const key = `${normalizedName}|${parsed.unit}`;

    if (consolidated.has(key)) {
      const existing = consolidated.get(key)!;
      existing.quantity += parsed.quantity;
    } else {
      consolidated.set(key, {
        normalizedName,
        displayName: normalizedName,
        quantity: parsed.quantity,
        unit: parsed.unit,
        category: detectIngredientCategory(normalizedName),
        needsReview,
        validationNote,
      });
    }
  }

  const merged = new Map<string, ConsolidatedItem>();

  const nameSet = new Set<string>();
  Array.from(consolidated.values()).forEach(item => nameSet.add(item.normalizedName));

  Array.from(nameSet).forEach(name => {
    const gKey = `${name}|g`;
    const mlKey = `${name}|ml`;
    const unitKey = `${name}|unit`;
    const gItem = consolidated.get(gKey);
    const mlItem = consolidated.get(mlKey);
    const unitItem = consolidated.get(unitKey);

    let totalG: number | null = null;

    if (gItem) {
      totalG = gItem.quantity;
    }

    if (mlItem) {
      const convertedMl = convertMlToG(mlItem.quantity, name);
      if (convertedMl !== null && totalG !== null) {
        totalG += convertedMl;
      } else if (convertedMl !== null && totalG === null) {
        totalG = convertedMl;
      } else {
        merged.set(mlKey, { ...mlItem });
      }
    }

    if (unitItem) {
      const avgWeight = getAverageWeightG(name);
      const keepQty = shouldKeepAsQuantity(name);
      if (avgWeight !== null && totalG !== null && !keepQty) {
        const convertedG = unitItem.quantity * avgWeight;
        totalG += convertedG;
      } else if (avgWeight !== null && !keepQty && !gItem && !mlItem) {
        const convertedG = unitItem.quantity * avgWeight;
        totalG = convertedG;
      } else {
        merged.set(unitKey, { ...unitItem });
      }
    }

    if (totalG !== null) {
      const baseItem = gItem || mlItem || unitItem!;
      merged.set(gKey, {
        ...baseItem,
        quantity: totalG,
        unit: 'g',
      });
    }

    Array.from(consolidated.entries()).forEach(([key, item]) => {
      if (key.startsWith(`${name}|`) && !merged.has(key)) {
        const unit = key.split('|')[1];
        if (unit !== 'g' && unit !== 'ml' && unit !== 'unit') {
          merged.set(key, { ...item });
        }
      }
    });
  });

  return Array.from(merged.values());
}

export function formatQuantityMetric(quantity: number, unit: string): string {
  if (unit === 'g') {
    if (quantity >= 1000) return `${(quantity / 1000).toFixed(2).replace(/\.?0+$/, '')} kg`;
    return `${Math.round(quantity)} g`;
  }
  if (unit === 'ml') {
    if (quantity >= 1000) return `${(quantity / 1000).toFixed(2).replace(/\.?0+$/, '')} L`;
    return `${Math.round(quantity)} ml`;
  }
  if (quantity === 1) return '';
  return `${quantity % 1 === 0 ? quantity : quantity.toFixed(1)}`;
}

export function formatQuantityImperial(quantity: number, unit: string): string {
  if (unit === 'g') {
    if (quantity >= 453.592) {
      const lbs = quantity / 453.592;
      return `${lbs.toFixed(2).replace(/\.?0+$/, '')} lb`;
    }
    const oz = quantity / 28.3495;
    return `${oz.toFixed(1).replace(/\.?0+$/, '')} oz`;
  }
  if (unit === 'ml') {
    if (quantity >= 240) {
      const cups = quantity / 240;
      return `${cups.toFixed(1).replace(/\.?0+$/, '')} cups`;
    }
    if (quantity >= 15) {
      const tbsp = quantity / 15;
      return `${tbsp.toFixed(1).replace(/\.?0+$/, '')} tbsp`;
    }
    const tsp = quantity / 5;
    return `${tsp.toFixed(1).replace(/\.?0+$/, '')} tsp`;
  }
  if (quantity === 1) return '';
  return `${quantity % 1 === 0 ? quantity : quantity.toFixed(1)}`;
}
