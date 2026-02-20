import axios from "axios";

export interface PriceResult {
  supermarket: string;
  productName: string;
  price: number | null;
  pricePerUnit: string | null;
  productUrl: string | null;
  imageUrl: string | null;
  currency: string;
  productWeight: string | null;
  tier: string;
}

interface SpoonacularProduct {
  id: number;
  title: string;
  image: string;
  imageType: string;
  price?: number;
  likes?: number;
  badges?: string[];
  importantBadges?: string[];
  nutrition?: {
    nutrients: { name: string; amount: number; unit: string }[];
    caloricBreakdown?: { percentProtein: number; percentFat: number; percentCarbs: number };
  };
  servings?: { number: number; size: number; unit: string };
  spoonacularScore?: number;
  brand?: string;
  generatedText?: string;
  ingredientList?: string;
  aisle?: string;
}

const SPOONACULAR_BASE = "https://api.spoonacular.com";

const TIER_MULTIPLIERS: Record<string, number> = {
  budget: 0.75,
  standard: 1.0,
  premium: 1.45,
  organic: 1.60,
};

const PREMIUM_KEYWORDS = [
  'finest', 'taste the difference', 'extra special', 'luxury', 'premium',
  'selected', 'free range', 'hand picked', 'artisan', 'aged', 'reserve',
];

const ORGANIC_KEYWORDS = [
  'organic', 'bio', 'biologique', 'organico',
];

const BUDGET_KEYWORDS = [
  'value', 'basics', 'everyday', 'smart price', 'farm stores',
  'just essentials', 'stockwell', 'grower\'s harvest', 'hearty food co',
];

function classifyProductTier(product: SpoonacularProduct): string {
  const text = `${product.title} ${product.brand || ''}`.toLowerCase();
  const badges = (product.badges || []).map(b => b.toLowerCase());
  const importantBadges = (product.importantBadges || []).map(b => b.toLowerCase());

  if (badges.includes('organic') || importantBadges.includes('organic') ||
      ORGANIC_KEYWORDS.some(kw => text.includes(kw))) return 'organic';
  if (PREMIUM_KEYWORDS.some(kw => text.includes(kw))) return 'premium';
  if (BUDGET_KEYWORDS.some(kw => text.includes(kw))) return 'budget';
  return 'standard';
}

const CATEGORY_PRICE_ESTIMATES: Record<string, { perKg: number; perUnit: number; perLitre: number }> = {
  meat: { perKg: 8.00, perUnit: 3.50, perLitre: 0 },
  fish: { perKg: 12.00, perUnit: 4.00, perLitre: 0 },
  dairy: { perKg: 3.50, perUnit: 1.50, perLitre: 1.20 },
  eggs: { perKg: 0, perUnit: 0.25, perLitre: 0 },
  produce: { perKg: 2.00, perUnit: 0.50, perLitre: 0 },
  fruit: { perKg: 3.00, perUnit: 0.40, perLitre: 0 },
  grains: { perKg: 1.50, perUnit: 1.00, perLitre: 0 },
  herbs: { perKg: 15.00, perUnit: 0.80, perLitre: 0 },
  oils: { perKg: 0, perUnit: 3.00, perLitre: 4.00 },
  condiments: { perKg: 5.00, perUnit: 2.00, perLitre: 3.00 },
  nuts: { perKg: 10.00, perUnit: 2.50, perLitre: 0 },
  legumes: { perKg: 2.50, perUnit: 1.00, perLitre: 0 },
  bakery: { perKg: 4.00, perUnit: 1.50, perLitre: 0 },
  tinned: { perKg: 2.00, perUnit: 1.00, perLitre: 0 },
  other: { perKg: 3.00, perUnit: 1.50, perLitre: 2.00 },
};

function estimateFallbackPrice(category: string, quantity: number, unit: string): number {
  const rates = CATEGORY_PRICE_ESTIMATES[category] || CATEGORY_PRICE_ESTIMATES['other'];
  if (unit === 'g') {
    const packKg = quantity >= 1000 ? Math.ceil(quantity / 1000) : 1;
    return Math.round(packKg * rates.perKg * 100) / 100;
  }
  if (unit === 'ml') {
    const packL = quantity >= 1000 ? Math.ceil(quantity / 1000) : 1;
    const price = Math.round(packL * rates.perLitre * 100) / 100;
    return price > 0 ? price : Math.round(rates.perUnit * 100) / 100;
  }
  return Math.round(rates.perUnit * 100) / 100;
}

const SUPERMARKET_VARIANCE: Record<string, number> = {
  'Tesco': 1.0,
  "Sainsbury's": 1.05,
  'Asda': 0.95,
  'Morrisons': 0.98,
  'Aldi': 0.82,
  'Lidl': 0.83,
  'Waitrose': 1.12,
  'Marks & Spencer': 1.15,
  'Ocado': 1.08,
};

function getStoreSearchUrl(storeName: string, query: string): string | null {
  const q = encodeURIComponent(query);
  if (storeName === 'Tesco') return `https://www.tesco.com/groceries/en-GB/search?query=${q}`;
  if (storeName === "Sainsbury's") return `https://www.sainsburys.co.uk/gol-ui/SearchResults/${q}`;
  if (storeName === 'Asda') return `https://groceries.asda.com/search/${q}`;
  if (storeName === 'Morrisons') return `https://groceries.morrisons.com/search?entry=${q}`;
  if (storeName === 'Aldi') return `https://groceries.aldi.co.uk/en-GB/Search?keywords=${q}`;
  if (storeName === 'Lidl') return `https://www.lidl.co.uk/q/search?q=${q}`;
  if (storeName === 'Waitrose') return `https://www.waitrose.com/ecom/shop/search?searchTerm=${q}`;
  if (storeName === 'Marks & Spencer') return `https://www.ocado.com/search?entry=${q}&dnr=y&bof=marksandspencer`;
  if (storeName === 'Ocado') return `https://www.ocado.com/search?entry=${q}`;
  return null;
}

function getStoreTierProductName(storeName: string, baseName: string, tier: string): string {
  if (tier === 'premium') {
    if (storeName === 'Tesco') return `Tesco Finest ${baseName}`;
    if (storeName === "Sainsbury's") return `Taste the Difference ${baseName}`;
    if (storeName === 'Asda') return `Extra Special ${baseName}`;
    if (storeName === 'Morrisons') return `The Best ${baseName}`;
    if (storeName === 'Aldi') return `Specially Selected ${baseName}`;
    if (storeName === 'Lidl') return `Deluxe ${baseName}`;
    if (storeName === 'Waitrose') return `Waitrose No.1 ${baseName}`;
    if (storeName === 'Marks & Spencer') return `M&S Collection ${baseName}`;
    if (storeName === 'Ocado') return `Ocado Gold ${baseName}`;
  } else if (tier === 'organic') {
    return `Organic ${baseName}`;
  } else if (tier === 'budget') {
    if (storeName === 'Tesco') return `Tesco Value ${baseName}`;
    if (storeName === "Sainsbury's") return `Sainsbury's Basics ${baseName}`;
    if (storeName === 'Asda') return `Just Essentials ${baseName}`;
    if (storeName === 'Morrisons') return `Savers ${baseName}`;
    if (storeName === 'Aldi') return baseName;
    if (storeName === 'Lidl') return baseName;
    if (storeName === 'Waitrose') return `Essential Waitrose ${baseName}`;
    if (storeName === 'Marks & Spencer') return baseName;
    if (storeName === 'Ocado') return baseName;
  }
  return baseName;
}

const GROCERY_SEARCH_HINTS: Record<string, string> = {
  'bay leaf': 'dried bay leaves herbs',
  'bay leaves': 'dried bay leaves herbs',
  'mint': 'fresh mint herbs',
  'sage': 'fresh sage herbs',
  'thyme': 'fresh thyme herbs',
  'rosemary': 'fresh rosemary herbs',
  'basil': 'fresh basil herbs',
  'dill': 'fresh dill herbs',
  'coriander': 'fresh coriander herbs',
  'parsley': 'fresh parsley herbs',
  'chive': 'fresh chives herbs',
  'chives': 'fresh chives herbs',
  'tarragon': 'fresh tarragon herbs',
  'oregano': 'dried oregano herbs',
  'ginger': 'fresh ginger root',
  'vanilla': 'vanilla extract',
  'stock': 'stock cubes cooking',
  'cream': 'double cream dairy',
};

function getGrocerySearchTerm(ingredientName: string): string {
  const lower = ingredientName.toLowerCase().trim();
  if (GROCERY_SEARCH_HINTS[lower]) return GROCERY_SEARCH_HINTS[lower];
  return ingredientName;
}

const TIERS = ['budget', 'standard', 'premium', 'organic'] as const;

async function searchSpoonacular(query: string): Promise<SpoonacularProduct | null> {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await axios.get(`${SPOONACULAR_BASE}/food/products/search`, {
      params: {
        query,
        apiKey,
        number: 5,
        addProductInformation: true,
      },
      timeout: 10000,
    });

    const products: SpoonacularProduct[] = response.data?.products || [];
    if (products.length === 0) return null;

    const NON_GROCERY_KEYWORDS = ['plant', 'seed packet', 'seeds for planting', 'garden', 'potted', 'seedling', 'sapling', 'live plant', 'starter plant', 'growing kit'];
    const isNonGrocery = (p: SpoonacularProduct) => {
      const text = `${p.title || ''} ${p.aisle || ''} ${p.generatedText || ''}`.toLowerCase();
      return NON_GROCERY_KEYWORDS.some(kw => text.includes(kw));
    };

    const groceryProducts = products.filter(p => !isNonGrocery(p));
    const candidates = groceryProducts.length > 0 ? groceryProducts : products;

    const withPrice = candidates.find(p => p.price && p.price > 0);
    return withPrice || candidates[0];
  } catch (err: any) {
    if (err.response?.status === 402) {
      console.warn('Spoonacular API quota exceeded');
    } else {
      console.warn('Spoonacular API error:', err.message);
    }
    return null;
  }
}

function getProductImage(product: SpoonacularProduct): string | null {
  if (!product.image) return null;
  if (product.image.startsWith('http')) return product.image;
  return `https://img.spoonacular.com/products/${product.id}-312x231.${product.imageType || 'jpg'}`;
}

function getProductWeight(product: SpoonacularProduct): string | null {
  if (product.servings) {
    const { number: count, size, unit } = product.servings;
    if (size && unit) return `${count} x ${size}${unit}`;
    if (size) return `${size}`;
  }
  return null;
}

function convertUsdToGbp(usdPrice: number): number {
  return Math.round(usdPrice * 0.79 * 100) / 100;
}

function sanitizeProductTitle(title: string): string {
  let cleaned = title;
  cleaned = cleaned.replace(/(?:Serving Size|Servings Per Container|Amount Per Serving|% Daily Value).*$/i, '');
  cleaned = cleaned.replace(/(?:Total Fat|Saturated Fat|Trans Fat|Cholesterol|Sodium|Total Carbohydrate|Dietary Fiber|Sugars|Added Sugars|Protein|Vitamin [A-Z]|Calcium|Iron|Potassium|Calories)\s*[\d.]+\s*%?\s*[a-z]*(?:\s*(?:low|medium|high|free))?/gi, '');
  cleaned = cleaned.replace(/\b\d+\s*(?:calories|kcal|cal)\b/gi, '');
  cleaned = cleaned.replace(/\b(?:Sugars|Protein|Carbs?|Fats?|Fiber|Sodium|Cholesterol)\d+(?:\.\d+)?g?\s*(?:low|medium|high|free)?/gi, '');
  cleaned = cleaned.replace(/\b\d+(?:\.\d+)?(?:g|mg|mcg|µg|iu)(?:low|medium|high|free)\b/gi, '');
  cleaned = cleaned.replace(/Nutrition Facts\s*/gi, '');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  cleaned = cleaned.trim();
  if (!cleaned) return title.trim();
  return cleaned;
}

export async function lookupPricesForIngredient(
  ingredientName: string,
  category: string,
  quantity: number,
  unit: string
): Promise<PriceResult[]> {
  const results: PriceResult[] = [];

  const searchTerm = getGrocerySearchTerm(ingredientName);
  const product = await searchSpoonacular(searchTerm);

  let basePrice: number;
  let productLabel: string;
  let productImage: string | null;
  let productWeight: string | null;
  let detectedTier: string;
  let pricePerUnitStr: string | null = null;

  const MAX_REASONABLE_PRICE: Record<string, number> = {
    herbs: 4.00,
    condiments: 6.00,
    produce: 5.00,
    fruit: 6.00,
    eggs: 5.00,
    grains: 5.00,
    oils: 8.00,
  };

  if (product) {
    const rawPrice = product.price && product.price > 0 ? product.price : null;
    let convertedPrice = rawPrice ? convertUsdToGbp(rawPrice / 100) : null;
    const maxPrice = MAX_REASONABLE_PRICE[category];
    if (convertedPrice && maxPrice && convertedPrice > maxPrice) {
      convertedPrice = null;
    }
    basePrice = convertedPrice || estimateFallbackPrice(category, quantity, unit);
    productLabel = sanitizeProductTitle(product.title || ingredientName);
    productImage = getProductImage(product);
    productWeight = getProductWeight(product);
    detectedTier = classifyProductTier(product);

    if (convertedPrice && product.servings?.size && product.servings?.unit) {
      const servingUnit = product.servings.unit.toLowerCase();
      if (servingUnit.includes('oz') || servingUnit.includes('g') || servingUnit.includes('ml')) {
        const totalSize = product.servings.number * product.servings.size;
        if (totalSize > 0) {
          const pricePerOz = basePrice / totalSize;
          pricePerUnitStr = `\u00A3${pricePerOz.toFixed(2)}/${servingUnit}`;
        }
      }
    }
  } else {
    basePrice = estimateFallbackPrice(category, quantity, unit);
    productLabel = ingredientName;
    productImage = null;
    productWeight = null;
    detectedTier = 'standard';
  }

  if (!pricePerUnitStr) {
    const rates = CATEGORY_PRICE_ESTIMATES[category] || CATEGORY_PRICE_ESTIMATES['other'];
    if (unit === 'g' && rates.perKg > 0) {
      pricePerUnitStr = `\u00A3${rates.perKg.toFixed(2)}/kg`;
    } else if (unit === 'ml' && rates.perLitre > 0) {
      pricePerUnitStr = `\u00A3${rates.perLitre.toFixed(2)}/L`;
    }
  }

  const standardPrice = detectedTier === 'standard'
    ? basePrice
    : basePrice / (TIER_MULTIPLIERS[detectedTier] || 1.0);

  for (const [storeName, variance] of Object.entries(SUPERMARKET_VARIANCE)) {
    const searchUrl = getStoreSearchUrl(storeName, ingredientName);

    for (const tier of TIERS) {
      const tierMult = TIER_MULTIPLIERS[tier];
      const adjusted = Math.round(standardPrice * variance * tierMult * 100) / 100;

      results.push({
        supermarket: storeName,
        productName: getStoreTierProductName(storeName, productLabel, tier),
        price: adjusted > 0 ? adjusted : null,
        pricePerUnit: pricePerUnitStr,
        productUrl: searchUrl,
        imageUrl: productImage,
        currency: 'GBP',
        productWeight: productWeight || (unit === 'g' ? `${quantity}g` : unit === 'ml' ? `${quantity}ml` : 'each'),
        tier,
      });
    }
  }

  return results;
}

export function generateCheckoutUrls(
  items: { name: string; quantity: number; unit: string }[],
  supermarket: string
): string[] {
  return items.slice(0, 10).map(item => {
    const url = getStoreSearchUrl(supermarket, item.name);
    return url || `https://www.google.com/search?q=${encodeURIComponent(item.name + ' ' + supermarket)}`;
  });
}
