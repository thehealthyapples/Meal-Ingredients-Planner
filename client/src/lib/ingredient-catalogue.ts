export interface SelectorDef {
  key: string;
  label: string;
  options: string[];
  /** When true, user can select multiple options at once (stored as comma-separated). */
  multi?: boolean;
  /** When set, selecting "Other" reveals a free-text input stored under this variantSelections key. */
  freeTextKey?: string;
}

export interface IngredientDef {
  id: string;
  displayName: string;
  aliases?: string[];
  category: string;
  itemType: "whole_food" | "packaged";
  selectorSchema: SelectorDef[];
  relevantAttributes: string[];
  fallbackRuleHints: string[];
  /** When true, the split name appends displayName after type (e.g. "Pepperoni Thin Crust Pizza"). */
  appendDisplayNameInSplit?: boolean;
}

export const INGREDIENT_CATALOGUE: Record<string, IngredientDef> = {
  apples: {
    id: "apples",
    displayName: "Apples",
    aliases: ["apple", "apples"],
    category: "fruit",
    itemType: "whole_food",
    selectorSchema: [
      {
        key: "variety",
        label: "Variety",
        multi: true,
        options: ["Granny Smith", "Pink Lady", "Braeburn", "Gala", "Fuji", "Jazz", "Golden Delicious", "Cox"],
      },
    ],
    relevantAttributes: [],
    fallbackRuleHints: [
      "Fall back to any eating apple if specific variety unavailable",
    ],
  },
  tomatoes: {
    id: "tomatoes",
    displayName: "Tomatoes",
    aliases: ["tomato", "tomatoes"],
    category: "produce",
    itemType: "whole_food",
    selectorSchema: [
      {
        key: "type",
        label: "Type",
        options: ["Plum", "Cherry", "Vine", "Beefsteak"],
      },
    ],
    relevantAttributes: ["organic"],
    fallbackRuleHints: [
      "Prefer specified type first",
      "Fall back to vine tomatoes as neutral default",
    ],
  },
  pistachios: {
    id: "pistachios",
    displayName: "Pistachios",
    aliases: ["pistachio", "pistachios"],
    category: "nuts",
    itemType: "whole_food",
    selectorSchema: [
      {
        key: "saltState",
        label: "Salt",
        options: ["Salted", "Unsalted"],
      },
      {
        key: "shellState",
        label: "Shell",
        options: ["Shell on", "Shelled"],
      },
    ],
    relevantAttributes: ["unsalted", "shell_on"],
    fallbackRuleHints: [
      "Prefer specified salt/shell combo",
      "Fall back to roasted pistachios if salted/unsalted unavailable",
    ],
  },
  eggs: {
    id: "eggs",
    displayName: "Eggs",
    aliases: ["egg", "eggs"],
    category: "eggs",
    itemType: "whole_food",
    selectorSchema: [
      {
        key: "size",
        label: "Size",
        options: ["Medium", "Large"],
      },
    ],
    relevantAttributes: ["organic", "free_range"],
    fallbackRuleHints: [
      "Prefer organic free-range if both requested",
      "Fall back to free-range if organic unavailable",
      "Fall back to any eggs as last resort",
    ],
  },
  mushrooms: {
    id: "mushrooms",
    displayName: "Mushrooms",
    aliases: ["mushroom", "mushrooms"],
    category: "produce",
    itemType: "whole_food",
    selectorSchema: [
      {
        key: "variety",
        label: "Variety",
        multi: true,
        options: ["Chestnut", "Portobello", "Button", "Shiitake", "Oyster"],
      },
    ],
    relevantAttributes: ["organic"],
    fallbackRuleHints: [
      "Any available variety works — chestnut is the most versatile",
      "Prefer specified variety if available",
    ],
  },
  crisps: {
    id: "crisps",
    displayName: "Crisps",
    aliases: ["crisps", "crisp", "chips", "hula hoops", "tortilla chips", "popchips"],
    category: "snacks",
    itemType: "packaged",
    selectorSchema: [
      {
        key: "type",
        label: "Type",
        multi: true,
        options: ["Standard crisps", "Hula Hoops", "Doritos", "Pringles", "Kettle Chips", "Popchips", "Tortilla chips", "Lentil chips"],
      },
      {
        key: "flavour",
        label: "Flavour",
        multi: true,
        freeTextKey: "customFlavour",
        options: ["Ready salted", "Salt & vinegar", "Cheese & onion", "Pickled onion", "Sweet chilli", "BBQ", "Beef", "Steak", "Prawn cocktail", "Sour cream & onion", "Other"],
      },
    ],
    relevantAttributes: [],
    fallbackRuleHints: [
      "Match on type first (e.g. Hula Hoops, Doritos, Pringles)",
      "Match on flavour if specified; fall back to ready salted if unavailable",
    ],
  },
  pizza: {
    id: "pizza",
    displayName: "Pizza",
    aliases: ["pizza", "pizzas"],
    category: "meals",
    itemType: "packaged",
    selectorSchema: [
      {
        key: "type",
        label: "Crust",
        multi: true,
        freeTextKey: "customType",
        options: ["Thin Crust", "Stuffed Crust", "Deep Pan", "Sourdough", "Gluten-Free", "Other"],
      },
      {
        key: "flavour",
        label: "Topping",
        multi: true,
        freeTextKey: "customFlavourByTypeJson",
        options: ["Margherita", "Pepperoni", "BBQ Chicken", "Veggie", "Meat Feast", "Hawaiian", "Other"],
      },
    ],
    relevantAttributes: [],
    fallbackRuleHints: [
      "Match on topping first, then crust type",
      "Fall back to any available pizza if specific combination unavailable",
    ],
    appendDisplayNameInSplit: true,
  },

  // ── Dairy & alternatives ────────────────────────────────────────────────────

  milk: {
    id: "milk",
    displayName: "Milk",
    aliases: ["milk", "cow's milk", "cows milk", "dairy milk"],
    category: "dairy",
    itemType: "packaged",
    selectorSchema: [
      {
        key: "type",
        label: "Type",
        freeTextKey: "customType",
        options: ["Full fat", "Semi-skimmed", "Skimmed", "Other"],
      },
    ],
    relevantAttributes: ["organic"],
    fallbackRuleHints: [
      "Match on fat level first",
      "Fall back to semi-skimmed as neutral default",
    ],
  },

  plant_milk: {
    id: "plant_milk",
    displayName: "Plant Milk",
    aliases: ["plant milk", "oat milk", "almond milk", "soy milk", "soya milk", "coconut milk", "hazelnut milk", "rice milk", "oat drink", "almond drink"],
    category: "dairy",
    itemType: "packaged",
    selectorSchema: [
      {
        key: "type",
        label: "Type",
        multi: true,
        freeTextKey: "customType",
        options: ["Oat", "Almond", "Soy", "Coconut", "Hazelnut", "Rice", "Oat Barista", "Other"],
      },
    ],
    relevantAttributes: [],
    fallbackRuleHints: [
      "Match on plant base first",
      "Oat milk is the most widely available fallback",
    ],
  },

  cream: {
    id: "cream",
    displayName: "Cream",
    aliases: ["cream", "single cream", "double cream", "whipping cream", "soured cream", "clotted cream"],
    category: "dairy",
    itemType: "packaged",
    selectorSchema: [
      {
        key: "type",
        label: "Type",
        freeTextKey: "customType",
        options: ["Single", "Double", "Whipping", "Soured", "Clotted", "Other"],
      },
    ],
    relevantAttributes: [],
    fallbackRuleHints: [
      "Match on cream type — do not substitute between single and double",
    ],
  },

  cheese: {
    id: "cheese",
    displayName: "Cheese",
    aliases: ["cheese", "cheddar", "brie", "mozzarella", "parmesan", "gouda", "feta", "stilton", "camembert"],
    category: "dairy",
    itemType: "packaged",
    selectorSchema: [
      {
        key: "type",
        label: "Type",
        multi: true,
        freeTextKey: "customType",
        options: ["Cheddar", "Brie", "Mozzarella", "Parmesan", "Gouda", "Feta", "Stilton", "Camembert", "Other"],
      },
    ],
    relevantAttributes: ["organic"],
    fallbackRuleHints: [
      "Match on cheese variety — do not substitute between hard and soft cheeses",
    ],
  },

  yogurt: {
    id: "yogurt",
    displayName: "Yogurt",
    aliases: ["yogurt", "yoghurt", "greek yogurt", "greek yoghurt", "natural yogurt"],
    category: "dairy",
    itemType: "packaged",
    selectorSchema: [
      {
        key: "type",
        label: "Style",
        multi: true,
        freeTextKey: "customType",
        options: ["Greek", "Natural", "Low-fat", "Plant-based", "Skyr", "Other"],
      },
      {
        key: "flavour",
        label: "Flavour",
        multi: true,
        freeTextKey: "customFlavourByTypeJson",
        options: ["Plain", "Strawberry", "Vanilla", "Blueberry", "Mango", "Peach", "Cherry", "Other"],
      },
    ],
    relevantAttributes: ["organic"],
    fallbackRuleHints: [
      "Match on style first, then flavour",
      "Plain/natural is the safest fallback",
    ],
    appendDisplayNameInSplit: true,
  },

  // ── Frozen ──────────────────────────────────────────────────────────────────

  ice_cream: {
    id: "ice_cream",
    displayName: "Ice Cream",
    aliases: ["ice cream", "icecream", "ice-cream"],
    category: "frozen",
    itemType: "packaged",
    selectorSchema: [
      {
        key: "type",
        label: "Format",
        multi: true,
        freeTextKey: "customType",
        options: ["Tub", "Bar/Stick", "Sandwich", "Cone", "Vegan", "Other"],
      },
      {
        key: "flavour",
        label: "Flavour",
        multi: true,
        freeTextKey: "customFlavourByTypeJson",
        options: ["Vanilla", "Chocolate", "Strawberry", "Mint Choc Chip", "Salted Caramel", "Cookie Dough", "Raspberry Ripple", "Other"],
      },
    ],
    relevantAttributes: [],
    fallbackRuleHints: [
      "Match on flavour first, then format",
      "Vanilla tub is the most neutral fallback",
    ],
    appendDisplayNameInSplit: true,
  },

  // ── Snacks ──────────────────────────────────────────────────────────────────

  popcorn: {
    id: "popcorn",
    displayName: "Popcorn",
    aliases: ["popcorn", "pop corn"],
    category: "snacks",
    itemType: "packaged",
    selectorSchema: [
      {
        key: "type",
        label: "Type",
        multi: true,
        freeTextKey: "customType",
        options: ["Ready-made", "Microwave", "Other"],
      },
      {
        key: "flavour",
        label: "Flavour",
        multi: true,
        freeTextKey: "customFlavourByTypeJson",
        options: ["Sweet", "Salted", "Caramel", "Butter", "Sweet & Salt", "Cheese", "Other"],
      },
    ],
    relevantAttributes: [],
    fallbackRuleHints: [
      "Match on flavour first",
      "Fall back to sweet or salted if specific flavour unavailable",
    ],
    appendDisplayNameInSplit: true,
  },

  crackers: {
    id: "crackers",
    displayName: "Crackers",
    aliases: ["crackers", "cracker", "cream crackers", "ryvita", "oatcakes", "water biscuits"],
    category: "snacks",
    itemType: "packaged",
    selectorSchema: [
      {
        key: "type",
        label: "Type",
        freeTextKey: "customType",
        options: ["Cream crackers", "Ryvita", "Oatcakes", "Water crackers", "Rice crackers", "Other"],
      },
    ],
    relevantAttributes: [],
    fallbackRuleHints: [
      "Match on cracker type — cream crackers are the most neutral fallback",
    ],
  },

  // ── Breakfast ───────────────────────────────────────────────────────────────

  cereal: {
    id: "cereal",
    displayName: "Cereal",
    aliases: ["cereal", "breakfast cereal", "cornflakes", "muesli", "bran flakes", "weetabix", "rice krispies"],
    category: "breakfast",
    itemType: "packaged",
    selectorSchema: [
      {
        key: "type",
        label: "Type",
        freeTextKey: "customType",
        options: ["Muesli", "Granola", "Cornflakes", "Bran flakes", "Weetabix", "Rice Krispies", "Shredded Wheat", "Porridge", "Other"],
      },
    ],
    relevantAttributes: [],
    fallbackRuleHints: [
      "Match on cereal type exactly",
    ],
  },

  porridge: {
    id: "porridge",
    displayName: "Porridge",
    aliases: ["porridge", "porridge oats", "oats", "oatmeal"],
    category: "breakfast",
    itemType: "packaged",
    selectorSchema: [
      {
        key: "type",
        label: "Style",
        multi: true,
        freeTextKey: "customType",
        options: ["Rolled Oats", "Instant", "Steel Cut", "Jumbo Oats", "Other"],
      },
      {
        key: "flavour",
        label: "Flavour",
        multi: true,
        freeTextKey: "customFlavourByTypeJson",
        options: ["Plain", "Apple & Cinnamon", "Golden Syrup", "Honey", "Mixed Berry", "Other"],
      },
    ],
    relevantAttributes: [],
    fallbackRuleHints: [
      "Match on style first, then flavour",
      "Rolled oats plain is the most widely available",
    ],
    appendDisplayNameInSplit: true,
  },

  granola: {
    id: "granola",
    displayName: "Granola",
    aliases: ["granola"],
    category: "breakfast",
    itemType: "packaged",
    selectorSchema: [
      {
        key: "type",
        label: "Style",
        multi: true,
        freeTextKey: "customType",
        options: ["Standard", "Clusters", "Low sugar", "Other"],
      },
      {
        key: "flavour",
        label: "Flavour",
        multi: true,
        freeTextKey: "customFlavourByTypeJson",
        options: ["Plain", "Mixed Berry", "Honey & Oat", "Tropical", "Chocolate", "Other"],
      },
    ],
    relevantAttributes: [],
    fallbackRuleHints: [
      "Match on flavour first, then style",
    ],
    appendDisplayNameInSplit: true,
  },

  breakfast_bars: {
    id: "breakfast_bars",
    displayName: "Breakfast Bars",
    aliases: ["breakfast bars", "breakfast bar", "cereal bars", "cereal bar", "flapjack", "flapjacks", "protein bars", "protein bar"],
    category: "breakfast",
    itemType: "packaged",
    selectorSchema: [
      {
        key: "type",
        label: "Type",
        multi: true,
        freeTextKey: "customType",
        options: ["Cereal bar", "Flapjack", "Protein bar", "Oat bar", "Other"],
      },
      {
        key: "flavour",
        label: "Flavour",
        multi: true,
        freeTextKey: "customFlavourByTypeJson",
        options: ["Chocolate", "Berry", "Oat & honey", "Peanut butter", "Plain", "Other"],
      },
    ],
    relevantAttributes: [],
    fallbackRuleHints: [
      "Match on type first, then flavour",
    ],
    appendDisplayNameInSplit: true,
  },

  // ── Bakery ──────────────────────────────────────────────────────────────────

  bread: {
    id: "bread",
    displayName: "Bread",
    aliases: ["bread", "loaf", "sliced bread", "white bread", "brown bread", "wholemeal bread", "sourdough"],
    category: "bakery",
    itemType: "packaged",
    selectorSchema: [
      {
        key: "type",
        label: "Type",
        freeTextKey: "customType",
        options: ["White", "Brown", "Wholemeal", "Sourdough", "Seeded", "Granary", "Rye", "Other"],
      },
    ],
    relevantAttributes: [],
    fallbackRuleHints: [
      "Match on bread type exactly — do not substitute white for brown",
      "Fall back to medium sliced white as most widely available",
    ],
  },

  // ── Pasta & grains ──────────────────────────────────────────────────────────

  pasta: {
    id: "pasta",
    displayName: "Pasta",
    aliases: ["pasta", "spaghetti", "penne", "fusilli", "rigatoni", "tagliatelle", "linguine", "farfalle", "macaroni"],
    category: "pasta",
    itemType: "packaged",
    selectorSchema: [
      {
        key: "type",
        label: "Shape",
        freeTextKey: "customType",
        options: ["Spaghetti", "Penne", "Fusilli", "Rigatoni", "Tagliatelle", "Linguine", "Farfalle", "Macaroni", "Other"],
      },
    ],
    relevantAttributes: [],
    fallbackRuleHints: [
      "Match on pasta shape — substitute within long or short pasta families if unavailable",
    ],
  },

  // ── Protein ─────────────────────────────────────────────────────────────────

  chicken: {
    id: "chicken",
    displayName: "Chicken",
    aliases: ["chicken", "chicken breast", "chicken thighs", "chicken drumsticks", "chicken wings"],
    category: "meat",
    itemType: "packaged",
    selectorSchema: [
      {
        key: "type",
        label: "Cut",
        freeTextKey: "customType",
        options: ["Whole", "Breast", "Thighs", "Drumsticks", "Wings", "Mince", "Other"],
      },
    ],
    relevantAttributes: ["organic", "free_range"],
    fallbackRuleHints: [
      "Match on cut — do not substitute between cuts",
      "Prefer free-range if requested",
    ],
  },

  sausages: {
    id: "sausages",
    displayName: "Sausages",
    aliases: ["sausages", "sausage", "bangers", "chipolatas"],
    category: "meat",
    itemType: "packaged",
    selectorSchema: [
      {
        key: "type",
        label: "Type",
        multi: true,
        freeTextKey: "customType",
        options: ["Pork", "Chicken", "Beef", "Vegetarian", "Cumberland", "Lincolnshire", "Chipolata", "Other"],
      },
    ],
    relevantAttributes: [],
    fallbackRuleHints: [
      "Match on meat type first, then style",
      "Pork sausages are the most widely available fallback",
    ],
  },

  fish: {
    id: "fish",
    displayName: "Fish",
    aliases: ["fish", "salmon", "cod", "haddock", "tuna", "mackerel", "trout", "tilapia", "sea bass", "halibut"],
    category: "fish",
    itemType: "packaged",
    selectorSchema: [
      {
        key: "type",
        label: "Type",
        multi: true,
        freeTextKey: "customType",
        options: ["Salmon", "Cod", "Haddock", "Tuna", "Mackerel", "Trout", "Sea Bass", "Tilapia", "Other"],
      },
    ],
    relevantAttributes: [],
    fallbackRuleHints: [
      "Match on fish species exactly — do not substitute between white and oily fish",
    ],
  },

  deli_meats: {
    id: "deli_meats",
    displayName: "Deli Meats",
    aliases: ["deli meats", "deli meat", "ham", "salami", "turkey slices", "prosciutto", "chorizo", "cooked meats"],
    category: "meat",
    itemType: "packaged",
    selectorSchema: [
      {
        key: "type",
        label: "Type",
        multi: true,
        freeTextKey: "customType",
        options: ["Ham", "Salami", "Turkey", "Prosciutto", "Chorizo", "Chicken", "Pepperoni", "Other"],
      },
    ],
    relevantAttributes: [],
    fallbackRuleHints: [
      "Match on meat type exactly",
    ],
  },

  // ── Tins & pulses ───────────────────────────────────────────────────────────

  beans: {
    id: "beans",
    displayName: "Beans",
    aliases: ["beans", "kidney beans", "butter beans", "chickpeas", "lentils", "baked beans", "black beans", "edamame"],
    category: "tinned",
    itemType: "packaged",
    selectorSchema: [
      {
        key: "type",
        label: "Type",
        freeTextKey: "customType",
        options: ["Kidney", "Butter", "Chickpeas", "Lentils", "Baked", "Black", "Edamame", "Other"],
      },
    ],
    relevantAttributes: [],
    fallbackRuleHints: [
      "Match on bean type exactly — chickpeas and lentils are distinct from beans",
    ],
  },

  soup: {
    id: "soup",
    displayName: "Soup",
    aliases: ["soup", "tomato soup", "chicken soup", "vegetable soup", "lentil soup", "minestrone"],
    category: "tinned",
    itemType: "packaged",
    selectorSchema: [
      {
        key: "type",
        label: "Flavour",
        multi: true,
        freeTextKey: "customType",
        options: ["Tomato", "Chicken", "Vegetable", "Lentil", "Pea", "Minestrone", "Mushroom", "Leek & Potato", "Other"],
      },
    ],
    relevantAttributes: [],
    fallbackRuleHints: [
      "Match on soup flavour exactly",
    ],
  },
};

/**
 * Returns true when an item name already encodes a resolved selector option
 * (e.g. "Granny Smith apples", "Pepperoni Thin Crust Pizza").
 * Used in CYC to suppress variety/type/flavour selectors for already-specific items.
 *
 * Two guards prevent false positives:
 *   Guard 1 — token coverage: every word in the item name must be a known base token
 *     (displayName/aliases) or a known option token. Rejects noise words like "juice",
 *     "sauce", "blend" that appear in compound product names.
 *   Guard 2 — option presence: at least one option's full set of tokens must appear
 *     as whole tokens in the item name (no partial substring matches).
 */
export function isResolvedVariantItem(itemName: string, def: IngredientDef): boolean {
  function tokenize(s: string): string[] {
    return s.toLowerCase().replace(/[^\w\s]/g, " ").trim().split(/\s+/).filter(Boolean);
  }

  const itemTokens = tokenize(itemName);
  if (itemTokens.length === 0) return false;
  const itemSet = new Set(itemTokens);

  // Pool every option token from all selectors
  const allOptionTokens = new Set<string>();
  for (const selector of def.selectorSchema) {
    for (const option of selector.options) {
      if (option === "Other") continue;
      for (const t of tokenize(option)) allOptionTokens.add(t);
    }
  }

  // Pool every base token from displayName and all aliases
  const allBaseTokens = new Set<string>();
  for (const t of tokenize(def.displayName)) allBaseTokens.add(t);
  for (const alias of def.aliases ?? []) {
    for (const t of tokenize(alias)) allBaseTokens.add(t);
  }

  // Guard 1: reject item names containing words that belong to neither the base
  // nor any option (e.g. "juice" in "apple juice (Granny Smith blend)").
  const allKnownTokens = new Set(Array.from(allBaseTokens).concat(Array.from(allOptionTokens)));
  if (!itemTokens.every(t => allKnownTokens.has(t))) return false;

  // Guard 2: require that at least one option is fully present as whole tokens.
  for (const selector of def.selectorSchema) {
    for (const option of selector.options) {
      if (option === "Other") continue;
      const optTokens = tokenize(option);
      if (optTokens.length > 0 && optTokens.every(t => itemSet.has(t))) return true;
    }
  }

  return false;
}

export function getIngredientDef(normalizedName: string): IngredientDef | undefined {
  if (!normalizedName) return undefined;
  const lower = normalizedName.toLowerCase().trim();

  if (INGREDIENT_CATALOGUE[lower]) return INGREDIENT_CATALOGUE[lower];

  for (const def of Object.values(INGREDIENT_CATALOGUE)) {
    if (def.aliases?.some((a) => a.toLowerCase() === lower)) return def;
  }

  for (const def of Object.values(INGREDIENT_CATALOGUE)) {
    const name = def.displayName.toLowerCase();
    if (lower.includes(name) || name.includes(lower)) return def;
    if (def.aliases?.some((a) => lower.includes(a.toLowerCase()) || a.toLowerCase().includes(lower))) {
      return def;
    }
  }

  return undefined;
}
