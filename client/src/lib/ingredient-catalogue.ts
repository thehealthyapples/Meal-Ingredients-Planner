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
};

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
