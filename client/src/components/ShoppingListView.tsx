import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { normalizeIngredientKey, singularizeIngredientKey } from "@shared/normalize";
import { estimateFallbackPrice } from "@shared/price-estimates";
import { getCanonicalKey } from "@shared/ingredient-aliases";
import { Printer, X, CheckCircle2, Share2, ShoppingBag, Copy, Check, ArrowLeft, ArrowRight, Store, Pencil, Search, AlertTriangle, Plus, Minus, Trash2, Microscope } from "lucide-react";
import { rankDisplayMatches, type RankingMode } from "@/lib/analyser-choice";
import RankModeSelector from "@/components/RankModeSelector";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ShoppingListItem, IngredientSource, ProductMatch, IngredientProduct } from "@shared/schema";
import { cleanProductName } from "@/lib/unit-display";
import { isWholeFood } from "@/lib/basket-item-classifier";
import { getIngredientDef, isResolvedVariantItem } from "@/lib/ingredient-catalogue";
import WholeFoodSelector from "@/components/whole-food-selector";
import { SpellSuggestions } from "@/components/SpellSuggestions";
import { sourceLabel, sourcePriority, type SourceFilter } from "@/lib/source-helpers";
import thaAppleUrl from "@/assets/icons/tha-apple.png";

// ── Types ──────────────────────────────────────────────────────────────────

type ShopState = "need" | "in_basket" | "not_in_shop";

type SLItem = ShoppingListItem & {
  addedByDisplayName?: string | null;
  sources?: Array<{
    mealId: number;
    mealName: string;
    weekNumber?: number | null;
    dayOfWeek?: number | null;
    mealSlot?: string | null;
  }>;
};


const SUPERMARKETS = [
  "Tesco",
  "Sainsbury's",
  "Morrisons",
  "Ocado",
  "Waitrose",
  "Asda",
  "Aldi",
  "Lidl",
  "Independent shop",
];

// Unified display record used inside the shopping item row.
// Sources: curated IngredientProduct (thaPicks) or a price match.
interface ShopDisplayMatch {
  productName: string;
  thaRating: number | null;
  price: number | null;
  pricePerUnit: string | null;
  productUrl: string | null;
  /** "provider" = real provider price; "estimate" = category fallback; null = legacy row */
  priceSource?: string | null;
}

interface ShoppingListViewProps {
  items: SLItem[];
  extras: { id: number; name: string; category: string; alwaysAdd: boolean; inBasket: boolean }[];
  sourcesByItem: Map<number, IngredientSource[]>;
  pantryKeySet: Set<string>;
  measurementPref: "metric" | "imperial";
  allPriceMatches: ProductMatch[];
  onUpdateStatus?: (id: number, status: string) => void;
  onClose: () => void;
  onClearBasket?: () => void;
  /** Pre-select a supermarket when the view opens. */
  initialStore?: string;
  /** Skip to shopping phase directly. */
  initialPhase?: "cupboard_check" | "shopping";
  /** Curated THA product recommendations keyed by normalised ingredient key. */
  thaPicks?: Record<string, IngredientProduct[]>;
  /** Allow renaming/refining an item and re-triggering product lookup. */
  onRenameItem?: (id: number, newName: string) => Promise<void> | void;
  /** Remove an item from the shopping list entirely. */
  onRemoveItem?: (id: number) => void;
  /** Add a new item directly from within the view (e.g. from Check Cupboard). Persists to DB via resolver. */
  onAddItem?: (rawText: string, quantityValue?: number, basketLabel?: string | null) => Promise<void> | void;
  /** Update the needed quantity for an item (quantityValue only — does not touch cupboardQuantity). */
  onUpdateItemQty?: (id: number, quantityValue: number) => void;
  /** Trigger store-scoped product matching for the currently selected store. */
  onMatchStore?: (store: string) => void;
  /** True while a store-scoped match is in progress. */
  isMatchingPrices?: boolean;
  /** Open the product analyser for a specific item from within the shop view. */
  onAnalyse?: (item: SLItem) => void;
  /** Shared ranking mode — lifted to parent so it persists across Quick List / Check Cupboard / Shop View. */
  rankMode?: RankingMode;
  /** Called when user changes ranking mode. */
  onRankModeChange?: (mode: RankingMode) => void;
  /** Save a variant selection (type, flavour, etc.) for a catalogue item. */
  onVariantChange?: (id: number, key: string, value: string) => void;
  /** Save an attribute preference (organic, etc.) for a catalogue item. */
  onAttributeChange?: (id: number, key: string, value: boolean) => void;
  /** Active source filter — shown as tabs when provided. */
  listFilter?: SourceFilter;
  /** Called when the user switches source filter tabs. */
  onListFilterChange?: (filter: SourceFilter) => void;
  /** Clear items by source — "all" replaces the plain onClearBasket action. */
  onClearBySource?: (source: "all" | "planned" | "quick_list") => void;
  /** Persist partial cupboard quantity for an item (null = clear all underlying rows). */
  onUpdateCupboardQty?: (
    id: number,
    qty: number | null,
    ctx?: { allIds: number[]; allBasketLabels: (string | null)[]; allQuantities: (number | null)[] },
  ) => void;
}

// ── Merged row context helpers ─────────────────────────────────────────────

type MergedCtx = { allIds: number[]; allBasketLabels: (string | null)[]; allQuantities: (number | null)[] };

// Returns allocation context if the item represents multiple underlying rows.
function getMergedCtx(item: SLItem): MergedCtx | undefined {
  const allIds: number[] = (item as any)._allIds ?? [item.id];
  if (allIds.length <= 1) return undefined;
  return {
    allIds,
    allBasketLabels: (item as any)._allBasketLabels ?? [(item as any).basketLabel ?? null],
    allQuantities: (item as any)._allQuantities ?? [item.quantityValue ?? null],
  };
}

// ── State persistence ──────────────────────────────────────────────────────

const NIS_KEY = "tha-sl-not-in-shop";
interface NisEntry { id: number; name: string }

function loadNotInShop(): Set<number> {
  try {
    const raw = localStorage.getItem(NIS_KEY);
    if (!raw) return new Set();
    return new Set((JSON.parse(raw) as NisEntry[]).map((e) => e.id));
  } catch {
    return new Set();
  }
}

function saveNotInShop(ids: Set<number>, items: SLItem[]) {
  try {
    const nameMap = new Map(items.map((i) => [i.id, i.normalizedName ?? i.productName]));
    localStorage.setItem(
      NIS_KEY,
      JSON.stringify(Array.from(ids).map((id) => ({ id, name: nameMap.get(id) ?? "" }))),
    );
  } catch {}
}

// ── Shop session persistence (future notification support) ─────────────────
// When the user finishes a shopping trip, we record the session here so that
// future in-app reminder/notification logic can surface "you still need X items".

const SHOP_SESSION_KEY = "tha-sl-last-shop-session";

interface ShopSession {
  /** ISO timestamp of when the trip was marked complete */
  completedAt: string;
  /** How many items were bought at this shop */
  boughtCount: number;
  /** How many items are still outstanding after this trip */
  remainingCount: number;
  /** The outstanding items with display names and quantities */
  remainingItems: Array<{ id: number; name: string; qty: string }>;
  /**
   * Future hook: set to true when the user explicitly requests a pickup reminder.
   * In-app notification logic can poll this flag to surface an alert.
   */
  needsPickup: boolean;
}

function saveShopSession(session: ShopSession) {
  try { localStorage.setItem(SHOP_SESSION_KEY, JSON.stringify(session)); } catch {}
}

/** Read the most recent shop session — useful for future in-app reminder logic. */
export function getLastShopSession(): ShopSession | null {
  try {
    const raw = localStorage.getItem(SHOP_SESSION_KEY);
    return raw ? (JSON.parse(raw) as ShopSession) : null;
  } catch { return null; }
}

// ── THA picks key resolution ───────────────────────────────────────────────
// Resolves a normalised item key to the best canonical THA picks key via a
// four-step deterministic chain. Only affects THA picks display — price matches
// are always looked up by item ID and are unaffected.
//
// Resolution order:
//  1. Exact alias  (explicit variety→category, covers all apple variants)
//  2. ALIASES canonical phrase  (via shared ingredient-aliases, e.g. "dark chocolate"→"chocolate")
//  3. Canonical token match  (covers descriptors like "strong white flour"→"flour")
//  4. Singularized form  (e.g. "cherries"→"cherry", "grapes"→"grape")
//  5. Original key fallback
//
// If no match is found, resolveDisplayMatches falls back to thaPicks[itemKey]
// (the key the server actually returned) so nothing is ever silently dropped.

const THA_PICK_ALIASES: Record<string, string> = {
  // Apple varieties → "apples" (matches catalogue ID and server picks key)
  "granny smith":                "apples",
  "granny smith apple":          "apples",
  "granny smith apples":         "apples",
  "pink lady":                   "apples",
  "pink lady apple":             "apples",
  "pink lady apples":            "apples",
  "gala":                        "apples",
  "gala apple":                  "apples",
  "gala apples":                 "apples",
  "braeburn":                    "apples",
  "braeburn apple":              "apples",
  "braeburn apples":             "apples",
  "fuji":                        "apples",
  "fuji apple":                  "apples",
  "fuji apples":                 "apples",
  "jazz":                        "apples",
  "jazz apple":                  "apples",
  "jazz apples":                 "apples",
  "cox":                         "apples",
  "cox apple":                   "apples",
  "cox apples":                  "apples",
  "golden delicious":            "apples",
  "golden delicious apple":      "apples",
  "golden delicious apples":     "apples",
};

// Canonical token map: each entry is [canonicalKey, tokens[]].
// A token appearing as a WHOLE WORD in the singularised input triggers resolution.
// Only specific, unambiguous food-identifying words are tokens — not generic
// modifiers ("white", "strong", "dark" alone are never tokens).
// Overly broad words (cream, milk, butter) are intentionally excluded to prevent
// false positives like "ice cream" → "cream" or "buttermilk" → "butter".
const CANONICAL_TOKENS: Array<[string, string[]]> = [
  // Cheese varieties — single-word identifiers specific enough to be safe
  ["cheese",    ["cheese", "cheddar", "gruyere", "brie", "mozzarella", "parmesan",
                 "gouda", "edam", "camembert", "stilton", "ricotta", "feta"]],
  // These words are specific enough that false-positive risk is negligible
  ["flour",     ["flour"]],
  ["chocolate", ["chocolate"]],
  ["sriracha",  ["sriracha"]],
  // "bread" is safe because "breadcrumbs" is one word and won't whole-word match
  ["bread",     ["bread"]],
  ["pasta",     ["pasta", "spaghetti", "penne", "fusilli", "tagliatelle"]],
  ["rice",      ["rice", "basmati", "jasmine", "arborio"]],
  ["oil",       ["oil", "olive oil", "vegetable oil", "rapeseed oil"]],
  ["juice",     ["juice", "orange juice", "apple juice"]],
  ["beans",     ["beans", "kidney beans", "black beans", "chickpeas"]],
];

const SAFE_LAST_TOKENS = new Set(["flour", "bread", "cheese", "chocolate", "rice", "pasta"]);

function containsToken(singularKey: string, token: string): boolean {
  if (token.includes(' ')) return singularKey.includes(token);
  const words = singularKey.split(' ');
  return words.includes(token);
}

export function resolvePickKey(normalizedName: string): string {
  // 1. Exact alias
  const exact = THA_PICK_ALIASES[normalizedName];
  if (exact) return exact;

  // 2. Singularize (cherries→cherry, apples→apple, etc.) then try alias + tokens
  const singular = singularizeIngredientKey(normalizedName);

  // 3. Canonical phrase alias via shared ingredient-aliases
  //    Handles: "dark chocolate"→"chocolate", "strong white flour"→"flour", etc.
  const aliased = getCanonicalKey(singular);
  if (aliased !== singular) return aliased;
  const aliasedOrig = getCanonicalKey(normalizedName);
  if (aliasedOrig !== normalizedName) return aliasedOrig;

  // 4. Token-based canonical matching
  //    Handles: "strong white flour"→"flour", "gruyere cheese"→"cheese"
  for (const [canonical, tokens] of CANONICAL_TOKENS) {
    for (const token of tokens) {
      if (containsToken(singular, token)) return canonical;
    }
  }

  // 5. Last-word safe fallback — catches "organic pasta", "strong white flour", etc.
  const lastWord = singular.split(' ').pop()!;
  if (SAFE_LAST_TOKENS.has(lastWord)) return lastWord;

  // 6. Return singularized form if it differs (e.g. "cherries"→"cherry")
  if (singular !== normalizedName) return singular;

  // 7. Original key — resolveDisplayMatches fallback handles the rest
  return normalizedName;
}

// ── Product match resolution ───────────────────────────────────────────────
// Priority: 1. THA curated picks for this store, 2. Price matches for this item+store.

function resolveDisplayMatches(
  item: SLItem,
  allPriceMatches: ProductMatch[],
  thaPicks: Record<string, IngredientProduct[]>,
  store: string,
  mode: RankingMode = "quality_first",
): ShopDisplayMatch[] {
  const rawKey = normalizeIngredientKey(item.normalizedName ?? item.productName ?? "");
  const itemKey = resolvePickKey(rawKey);
  const storeNorm = store.toLowerCase();

  const thaList: ShopDisplayMatch[] = (thaPicks[itemKey] ?? thaPicks[rawKey] ?? [])
    .filter(p => p.retailer.toLowerCase() === storeNorm)
    .sort((a, b) => {
      const rA = (a.tags as any)?.thaRating ?? a.priority ?? 0;
      const rB = (b.tags as any)?.thaRating ?? b.priority ?? 0;
      return rB - rA;
    })
    .map(p => ({
      productName: p.productName,
      // tags.thaRating first; priority is the 1-5 apple rating on ingredient_products rows.
      thaRating: (p.tags as any)?.thaRating ?? (p.priority > 0 ? p.priority : null),
      price: null,
      pricePerUnit: p.size ?? null,
      productUrl: null,
    }));

  // Safety: do not show price matches for items that were never resolved (raw state)
  // unless THA picks are available to anchor the result.
  const isRaw = item.resolutionState === "raw";
  const priceList: ShopDisplayMatch[] = (!isRaw || thaList.length > 0)
    ? allPriceMatches
        .filter(m => m.shoppingListItemId === item.id && m.supermarket.toLowerCase() === storeNorm)
        .map(m => ({
          productName: m.productName,
          thaRating: m.thaRating ?? null,
          price: m.price ?? null,
          pricePerUnit: m.pricePerUnit ?? null,
          productUrl: m.productUrl ?? null,
          priceSource: (m as any).priceSource ?? null,
        }))
    : [];

  // Merge THA picks and price matches without silently losing price data.
  // For products present in BOTH: keep the price-match version (preserves live price)
  // and enrich its thaRating from the THA pick where available. This ensures
  // Quality / Balanced / Price modes can sort by real price rather than discarding
  // it because the THA-pick version (price: null) previously won deduplication.
  const thaByName = new Map(thaList.map(m => [m.productName.toLowerCase(), m]));
  const priceByName = new Map(priceList.map(m => [m.productName.toLowerCase(), m]));

  const merged: ShopDisplayMatch[] = priceList.map(pm => {
    const thav = thaByName.get(pm.productName.toLowerCase());
    return { ...pm, thaRating: thav?.thaRating ?? pm.thaRating };
  });
  for (const tm of thaList) {
    if (!priceByName.has(tm.productName.toLowerCase())) merged.push(tm);
  }

  // Track which merged products are THA picks for tha_pick mode ordering.
  const thaNames = new Set(thaList.map(m => m.productName.toLowerCase()));

  const wholeFoodItem = isWholeFood(item);

  let result: ShopDisplayMatch[];
  if (mode === "tha_pick") {
    // THA-curated products first (sorted by thaRating DESC).
    // Non-THA products follow, sorted by quality_first.
    // If no THA pick exists for this item, the entire list uses quality_first.
    const thaFirst = merged.filter(m => thaNames.has(m.productName.toLowerCase()));
    const rest = merged.filter(m => !thaNames.has(m.productName.toLowerCase()));
    thaFirst.sort((a, b) => (b.thaRating ?? 0) - (a.thaRating ?? 0));
    result = [...thaFirst, ...rankDisplayMatches(rest, "quality_first")];
  } else {
    result = rankDisplayMatches(merged, mode);
  }

  // Whole foods are always 5 apples — no processing, no additives.
  if (wholeFoodItem) return result.map(m => ({ ...m, thaRating: 5 }));
  return result;
}

// Compact apple rating: N THA apple logos inline — no text, no emoji
function CompactRating({ rating }: { rating: number }) {
  const clamped = Math.max(1, Math.min(5, Math.round(rating || 1)));
  return (
    <span className="inline-flex items-center shrink-0" aria-label={`${clamped} apple${clamped !== 1 ? "s" : ""}`}>
      {Array.from({ length: clamped }).map((_, i) => (
        <img key={i} src={thaAppleUrl} width={36} height={36} alt="" draggable={false}
          style={{ marginLeft: i === 0 ? 0 : -10 }} />
      ))}
    </span>
  );
}


// ── Category definitions ───────────────────────────────────────────────────
// tabAccent: muted earthy accent used on tabs, panel top border, and header tint.

const SHOPPING_CATS = [
  {
    key: "produce",
    label: "Produce",
    emoji: "🥦",
    tabAccent: "#4d8038",
    // Panel header background tint: very light wash of accent
    panelHeaderBg: "rgba(77,128,56,0.06)",
    panelBorderColor: "#4d803826",
    printHeaderBg: "#f0f7ed",
  },
  {
    key: "meat",
    label: "Meat & Fish",
    emoji: "🥩",
    tabAccent: "#9b3e3e",
    panelHeaderBg: "rgba(155,62,62,0.06)",
    panelBorderColor: "#9b3e3e26",
    printHeaderBg: "#fdf0f0",
  },
  {
    key: "dairy",
    label: "Dairy & Eggs",
    emoji: "🥛",
    tabAccent: "#a87c2a",
    panelHeaderBg: "rgba(168,124,42,0.06)",
    panelBorderColor: "#a87c2a26",
    printHeaderBg: "#fdf8ee",
  },
  {
    key: "bakery",
    label: "Bakery",
    emoji: "🥐",
    tabAccent: "#a06030",
    panelHeaderBg: "rgba(160,96,48,0.06)",
    panelBorderColor: "#a0603026",
    printHeaderBg: "#fdf4ee",
  },
  {
    key: "pantry",
    label: "Pantry",
    emoji: "🫙",
    tabAccent: "#7a6248",
    panelHeaderBg: "rgba(122,98,72,0.06)",
    panelBorderColor: "#7a624826",
    printHeaderBg: "#f8f5f1",
  },
  {
    key: "drinks",
    label: "Drinks",
    emoji: "🥤",
    tabAccent: "#2a7a6b",
    panelHeaderBg: "rgba(42,122,107,0.06)",
    panelBorderColor: "#2a7a6b26",
    printHeaderBg: "#eef8f6",
  },
  {
    key: "frozen",
    label: "Frozen",
    emoji: "❄️",
    tabAccent: "#3a7da0",
    panelHeaderBg: "rgba(58,125,160,0.06)",
    panelBorderColor: "#3a7da026",
    printHeaderBg: "#eef6fb",
  },
  {
    key: "household",
    label: "Household",
    emoji: "🏠",
    tabAccent: "#566878",
    panelHeaderBg: "rgba(86,104,120,0.06)",
    panelBorderColor: "#56687826",
    printHeaderBg: "#f2f4f6",
  },
  {
    key: "other",
    label: "Other",
    emoji: "📦",
    tabAccent: "#6b7280",
    panelHeaderBg: "rgba(107,114,128,0.06)",
    panelBorderColor: "#6b728026",
    printHeaderBg: "#f5f5f6",
  },
] as const;

// ── Category helpers ───────────────────────────────────────────────────────

// These keyword sets mirror server/lib/ingredient-utils.ts INGREDIENT_CATEGORIES.
// They serve as a name-based fallback for items whose DB category is null or "other"
// (e.g. items added before category detection existed, or via a path that skipped it).

const MEAT_WORDS = [
  "chicken", "beef", "pork", "lamb", "bacon", "steak", "ham", "turkey", "duck",
  "sausage", "mince", "veal", "venison", "chorizo", "salami", "prosciutto", "pancetta",
];
const FISH_WORDS = [
  "salmon", "tuna", "cod", "haddock", "mackerel", "trout", "halibut", "sardine",
  "anchovy", "prawn", "shrimp", "crab", "lobster", "mussel", "squid", "calamari", "scallop",
];
const DAIRY_WORDS = [
  "milk", "cheese", "cream", "butter", "yogurt", "yoghurt", "cheddar", "mozzarella",
  "parmesan", "ricotta", "mascarpone", "brie", "feta", "gouda", "ghee", "curd", "whey",
];
const EGG_WORDS = ["egg"];
const PRODUCE_WORDS = [
  "onion", "garlic", "tomato", "carrot", "pepper", "lettuce", "spinach", "broccoli",
  "cauliflower", "cabbage", "celery", "cucumber", "courgette", "aubergine", "mushroom",
  "leek", "beetroot", "parsnip", "sweetcorn", "asparagus", "kale", "rocket", "watercress",
];
const FRUIT_WORDS = [
  "apple", "banana", "orange", "lemon", "lime", "grape", "strawberry", "blueberry",
  "raspberry", "blackberry", "mango", "pineapple", "melon", "peach", "pear", "plum",
  "cherry", "fig", "avocado", "kiwi", "pomegranate", "cranberry",
];
const FROZEN_KEYWORDS = [
  "oven chip", "fish finger", "fish stick", "chicken nugget", "nugget",
  "ice cream", "ice lolly", "sorbet", "hash brown",
  "frozen pea", "frozen corn", "frozen spinach", "frozen bean", "frozen meal",
];
const BAKERY_WORDS = [
  "bread", "loaf", "wrap", "tortilla", "pitta", "pita", "naan",
  "bagel", "roll", "bun", "sourdough", "ciabatta", "focaccia", "croissant",
];
const SNACK_WORDS = ["crisps", "popcorn", "pretzel"];
// Known crisp/snack brand names. Checked early (before DB category) so that
// flavour-prefixed names like "Cheese & onion Hula Hoops" reach pantry before
// DAIRY_WORDS / MEAT_WORDS / FISH_WORDS intercept the flavour word.
const CRISP_BRANDS = [
  "standard crisps", "hula hoops", "pringles", "doritos", "kettle chips",
  "popchips", "tortilla chips", "lentil chips",
];
const DRINK_WORDS = [
  "beer", "lager", "ale", "stout", "porter", "cider",
  "wine", "prosecco", "champagne", "spirits",
  "whisky", "whiskey", "vodka", "rum", "gin", "bourbon", "brandy",
  "juice",
];
const FRESH_HERBS = new Set([
  "coriander", "basil", "parsley", "mint", "dill", "thyme", "rosemary", "sage", "chive",
]);

function getItemCatKey(category: string | null | undefined, name: string): string {
  const lowerName = name.toLowerCase();

  // ── Name-based overrides (run before DB category — correct regardless of stored value) ──

  // Tinned/canned → pantry (must be first: "canned tomato" shouldn't be produce)
  if (/^(can |tin |tinned |canned )/.test(lowerName)) return "pantry";

  // Peanut butter → pantry (before dairy check intercepts "butter")
  if (lowerName.includes("peanut butter")) return "pantry";

  // Pickled / fermented items → pantry (before produce check intercepts e.g. "cucumber")
  if (/^pickled |^fermented |^marinated /.test(lowerName)) return "pantry";

  // Vinegar products → pantry; exclude snack contexts (crisps, chips)
  if (/\bvinegar\b/.test(lowerName) && !/\bcrisps?\b|\bchips?\b/.test(lowerName)) return "pantry";

  // Frozen items (server had no frozen category until recently; name is authoritative)
  if (lowerName.startsWith("frozen ") || FROZEN_KEYWORDS.some(kw => lowerName.includes(kw)))
    return "frozen";
  if (lowerName === "chips" || lowerName === "oven chips") return "frozen";

  // Potatoes → pantry (ambient starch, not chilled produce); excludes sweet potato
  if (/\bpotato(es)?\b/.test(lowerName) && !lowerName.includes("sweet potato")) return "pantry";

  // Crisps brands → pantry. Must run before DB category so that flavour-prefixed
  // names like "Cheese & onion Hula Hoops" reach pantry before DAIRY_WORDS intercepts
  // "cheese", and "Beef Doritos" reaches pantry before MEAT_WORDS intercepts "beef".
  if (CRISP_BRANDS.some(b => lowerName.includes(b))) return "pantry";

  // ── DB category (fast path for correctly-categorised items) ──

  const raw = (category ?? "").toLowerCase();
  if (raw === "meat" || raw === "fish") return "meat";
  if (raw === "dairy" || raw === "eggs") return "dairy";
  if (raw === "produce" || raw === "fruit") return "produce";
  if (raw === "bakery") return "bakery";
  if (raw === "frozen") return "frozen";
  if (raw === "household") return "household";
  if (raw === "herbs") return FRESH_HERBS.has(lowerName) ? "produce" : "pantry";
  if (raw === "grains") {
    if (BAKERY_WORDS.some(w => lowerName.includes(w))) return "bakery";
    return "pantry";
  }
  if (raw === "drinks") return "drinks";
  if (["oils", "condiments", "nuts", "legumes", "tinned", "pantry", "spices", "ready_meals", "snacks"].includes(raw))
    return "pantry";

  // ── Name-based fallback (handles null/other/unknown DB category) ──
  // Items inserted before category detection existed, or via a path that skipped it,
  // will have category=null or category="other". Use the name to bin them correctly.

  if (MEAT_WORDS.some(w => lowerName.includes(w))) return "meat";
  if (FISH_WORDS.some(w => lowerName.includes(w))) return "meat"; // meat & fish tab
  if (EGG_WORDS.some(w => lowerName === w || lowerName.startsWith(w + "s") || lowerName.startsWith(w + " "))) return "dairy";
  if (DAIRY_WORDS.some(w => lowerName.includes(w))) return "dairy";
  // Chocolate, crisps and alcohol → pantry; checked before FRUIT_WORDS so that
  // e.g. "apple juice" and "cranberry cider" land in pantry, not produce.
  if (lowerName.includes("chocolate")) return "pantry";
  if (SNACK_WORDS.some(w => lowerName.includes(w))) return "pantry";
  if (DRINK_WORDS.some(w => lowerName.includes(w))) return "pantry";
  if (PRODUCE_WORDS.some(w => lowerName.includes(w))) return "produce";
  if (FRUIT_WORDS.some(w => lowerName.includes(w))) return "produce";
  if (BAKERY_WORDS.some(w => lowerName.includes(w))) return "bakery";
  if (FRESH_HERBS.has(lowerName)) return "produce";

  return "other";
}

function getExtraCatKey(category: string): string {
  if (category === "household") return "household";
  if (category === "meat" || category === "fish") return "meat";
  if (category === "dairy" || category === "eggs") return "dairy";
  if (category === "produce") return "produce";
  if (category === "bakery") return "bakery";
  if (category === "drinks") return "drinks";
  return "pantry";
}

// ── Quantity formatting ────────────────────────────────────────────────────

function fmtQty(
  value: number | null | undefined,
  unit: string | null | undefined,
  gramsVal: number | null | undefined,
  pref: "metric" | "imperial",
): string {
  if (gramsVal != null && gramsVal > 0 && unit !== "unit") {
    const liq = unit === "ml" || unit === "L" || unit === "cups" || unit === "tbsp" || unit === "tsp";
    if (pref === "metric") {
      if (liq) return gramsVal >= 1000 ? `${+(gramsVal / 1000).toFixed(1)}L` : `${Math.round(gramsVal)}ml`;
      return gramsVal >= 1000 ? `${+(gramsVal / 1000).toFixed(1)}kg` : `${Math.round(gramsVal)}g`;
    }
    if (liq) {
      if (gramsVal >= 240) return `${+(gramsVal / 240).toFixed(1)} cups`;
      if (gramsVal >= 15) return `${+(gramsVal / 15).toFixed(1)} tbsp`;
      return `${+(gramsVal / 5).toFixed(1)} tsp`;
    }
    return gramsVal >= 453 ? `${+(gramsVal / 453.592).toFixed(1)} lb` : `${+(gramsVal / 28.35).toFixed(1)} oz`;
  }
  if (value == null) return "";
  if (!unit) return String(value % 1 === 0 ? value : value.toFixed(1));
  if (unit === "unit") return value === 1 ? "1" : String(value);
  return `${value % 1 === 0 ? value : value.toFixed(1)} ${unit}`;
}

function capWords(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Returns a sensible CYC step size derived from the item's stored unit. */
function cycStepSize(unit: string | null | undefined): number {
  if (unit === "ml") return 100;
  if (unit === "g") return 50;
  return 1;
}

// ── State chip control ─────────────────────────────────────────────────────

const STATE_CHIPS: Array<{ value: ShopState; label: string; activeClass: string }> = [
  { value: "need",         label: "To get",       activeClass: "bg-muted text-foreground font-semibold" },
  { value: "in_basket",    label: "In my basket", activeClass: "bg-primary text-primary-foreground font-semibold" },
  { value: "not_in_shop",  label: "Get next time", activeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-semibold" },
];

function StateChips({
  state,
  onChange,
  testIdPrefix,
}: {
  state: ShopState;
  onChange: (s: ShopState) => void;
  testIdPrefix?: string;
}) {
  return (
    <div className="inline-flex items-stretch rounded-lg border border-border/60 bg-background overflow-hidden text-[10px] flex-shrink-0">
      {STATE_CHIPS.map((chip, i) => (
        <button
          key={chip.value}
          onClick={() => onChange(state === chip.value ? "need" : chip.value)}
          className={`px-2.5 py-1.5 transition-all duration-100 whitespace-nowrap leading-tight ${
            i > 0 ? "border-l border-border/40" : ""
          } ${state === chip.value ? chip.activeClass : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/40"}`}
          data-testid={testIdPrefix ? `${testIdPrefix}-${chip.value}` : undefined}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

// ── Print state badge ──────────────────────────────────────────────────────

function PrintStateBadge({ state }: { state: ShopState }) {
  if (state === "in_basket")
    return <span style={{ fontSize: 8, color: "#166534", fontWeight: 700 }}>✓ In my basket</span>;
  if (state === "not_in_shop")
    return <span style={{ fontSize: 8, color: "#92400e", fontWeight: 700 }}>✗ Get next time</span>;
  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        border: "1.5px solid #9ca3af",
        borderRadius: 2,
        flexShrink: 0,
      }}
    />
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ShoppingListView({
  items,
  extras,
  sourcesByItem,
  pantryKeySet,
  measurementPref,
  allPriceMatches,
  onUpdateStatus,
  onClose,
  onClearBasket,
  initialStore,
  initialPhase,
  thaPicks = {},
  onRenameItem,
  onRemoveItem,
  onAddItem,
  onMatchStore,
  isMatchingPrices = false,
  rankMode: rankModeProp,
  onRankModeChange,
  onAnalyse,
  onVariantChange,
  onAttributeChange,
  listFilter,
  onListFilterChange,
  onClearBySource,
  onUpdateCupboardQty,
  onUpdateItemQty,
}: ShoppingListViewProps) {
  const [notInShop, setNotInShop] = useState<Set<number>>(() => loadNotInShop());
  const [selectedSupermarket, setSelectedSupermarket] = useState<string>(initialStore ?? "Tesco");
  const [extraStates, setExtraStates] = useState<Map<number, "in_basket" | "not_in_shop">>(new Map());
  const [activeTab, setActiveTab] = useState<string | null>(() => {
    try { return localStorage.getItem("tha-sl-shop-active-cat") ?? null; } catch { return null; }
  });
  const [shopSession, setShopSession] = useState<ShopSession | null>(null);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied">("idle");
  const [phase, setPhase] = useState<"cupboard_check" | "shopping">(() => {
    if (initialPhase) return initialPhase;
    try {
      const savedPhase = localStorage.getItem("tha-sl-shop-phase") as "cupboard_check" | "shopping" | null;
      if (savedPhase === "shopping") return "shopping";
    } catch {}
    return "cupboard_check";
  });
  const [atHomeIds, setAtHomeIds] = useState<Set<number>>(new Set());
  const [productIndexMap, setProductIndexMap] = useState<Record<number, number>>({});
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  // Cupboard-check review state: tracks which needsReview items the user has
  // explicitly kept/edited so we stop showing the review card for them.
  const [reviewDismissed, setReviewDismissed] = useState<Set<number>>(new Set());
  const [reviewEditId, setReviewEditId] = useState<number | null>(null);
  const [reviewEditVal, setReviewEditVal] = useState<string>("");
  // Cupboard partial-quantity state — lives at display layer, no DB writes for partials.
  const [cupboardQty, setCupboardQty] = useState<Map<number, number>>(new Map());
  // Remaining-quantity overrides for shopping phase, computed at "head to shop".
  const [qtyOverrides, setQtyOverrides] = useState<Map<number, number>>(new Map());
  // Multi-select state for group umbrella terms (e.g. "berries").
  // Keyed by item.id → set of selected suggestion strings.
  const [multiSelections, setMultiSelections] = useState<Map<number, Set<string>>>(new Map());
  // True while handleHeadToShop is committing pending selections — prevents double-tap.
  const [isCommitting, setIsCommitting] = useState(false);
  // Cupboard check: inline add-item input
  const [addingItem, setAddingItem] = useState(false);
  const [addItemVal, setAddItemVal] = useState("");
  const [addItemQty, setAddItemQty] = useState(1);
  // CYC quantity editing: draft values while user is typing (keyed by item id)
  const [cycQtyDraft, setCycQtyDraft] = useState<Map<number, string>>(new Map());
  // rankMode is lifted to the parent page so it is shared across Quick List,
  // Check Cupboard and Shop View. Fall back to sessionStorage if parent doesn't pass it.
  const [localRankMode, setLocalRankMode] = useState<RankingMode>(() => {
    try { return (sessionStorage.getItem("tha-sl-rank-mode") as RankingMode) || "quality_first"; } catch { return "quality_first"; }
  });
  const rankMode = rankModeProp ?? localRankMode;
  // Which item's "Change choice" panel is currently open (at most one at a time).
  const [choiceOpenId, setChoiceOpenId] = useState<number | null>(null);
  const [exportCopied, setExportCopied] = useState(false);
  const itemsScrollRef = useRef<HTMLDivElement>(null);
  const tabStripRef = useRef<HTMLDivElement>(null);
  const activeTabElRef = useRef<HTMLButtonElement>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  /** Prevents scroll-handler from overwriting activeTab during programmatic scrolls. */
  const isScrollingToRef = useRef(false);
  /** Debounce timer for saving scroll position to localStorage. */
  const scrollSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Ensures scroll is restored at most once per mount. */
  const scrollRestoredRef = useRef(false);
  /** Latest items array — used in phase-save effect without making items a dependency. */
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  useEffect(() => {
    saveNotInShop(notInShop, items);
  }, [notInShop, items]);

  useEffect(() => {
    try { localStorage.setItem("tha-sl-shop-phase", phase); } catch {}
  }, [phase]);

  // Sync cupboardQty from DB-persisted values when items change.
  // Incremental: only initialises IDs not already in local state, so user-entered
  // values are preserved during in-flight writes and filter switches get correct
  // DB-backed values for newly visible rows.
  useEffect(() => {
    if (items.length === 0) return;
    setCupboardQty(prev => {
      let changed = false;
      const map = new Map(prev);
      for (const item of items) {
        if (map.has(item.id)) continue;
        // For merged rows, sum all underlying cupboard quantities.
        const allCupboardQtys: (number | null)[] =
          (item as any)._allCupboardQuantities ?? [(item as any).cupboardQuantity];
        const total = allCupboardQtys.reduce((sum: number, q: number | null) => sum + (q ?? 0), 0);
        if (total > 0) { map.set(item.id, total); changed = true; }
      }
      return changed ? map : prev;
    });
  }, [items]);

  // Recompute qtyOverrides whenever the shopping phase is active and cupboardQty
  // changes — handles both the fresh transition and the page-refresh restore path.
  useEffect(() => {
    if (phase !== "shopping") return;
    const newOverrides = new Map<number, number>();
    for (const [id, qty] of Array.from(cupboardQty.entries())) {
      const it = items.find(i => i.id === id);
      if (it?.quantityValue == null) continue;
      const remaining = Math.max(0, it.quantityValue - qty);
      if (remaining > 0) newOverrides.set(id, remaining);
    }
    setQtyOverrides(newOverrides);
  }, [phase, cupboardQty, items]);

  function handleStoreChange(store: string) {
    setSelectedSupermarket(store);
    setProductIndexMap({});
  }

  function handleRankModeChange(mode: RankingMode) {
    if (onRankModeChange) {
      onRankModeChange(mode);
    } else {
      setLocalRankMode(mode);
      try { sessionStorage.setItem("tha-sl-rank-mode", mode); } catch {}
    }
    setProductIndexMap({});
    setChoiceOpenId(null);
  }

  function handleNextProduct(itemId: number, total: number) {
    setProductIndexMap(prev => {
      const next = (prev[itemId] ?? 0) + 1;
      return next < total ? { ...prev, [itemId]: next } : prev;
    });
  }

  // Commit any pending multi-select ambiguity expansions, then transition to
  // shopping phase.  Called by both "Head to the shop" and "Skip".
  //
  // For each umbrella item that has ≥1 checkbox selection:
  //   • 1 pick  → rename the original item in place (preserves ID, re-resolves)
  //   • 2+ picks → add each child item (skip if already in list), then remove umbrella
  //
  // The function awaits all add-mutations before transitioning so that the shop
  // view renders with the correct items the first time it mounts.
  const handleHeadToShop = useCallback(async () => {
    if (isCommitting) return;

    const hasMulti = multiSelections.size > 0;

    // Items using the type→flavour pattern (crisps, pizza, …) with ≥1 type selected
    // need splitting into separate basket items — one per type with its flavour resolved.
    const typeFlavourSplitItems = items.filter(item => {
      const catDef = getIngredientDef(item.normalizedName ?? item.productName ?? "");
      if (!catDef) return false;
      if (!catDef.selectorSchema.some(s => s.key === "type") || !catDef.selectorSchema.some(s => s.key === "flavour")) return false;
      const v = (() => { try { return JSON.parse(item.variantSelections ?? "{}") as Record<string, string>; } catch { return {} as Record<string, string>; } })();
      return (v["type"] ?? "").split(",").map((s: string) => s.trim()).filter(Boolean).length > 0;
    });
    const hasTypeFlavourSplit = typeFlavourSplitItems.length > 0;

    // Pure-variety items (apples, mushrooms, …) with >1 variety selected need splitting
    // into individual rows. Items using the type→flavour pattern are handled above.
    const multiVarietySplitItems = items.filter(item => {
      const catDef = getIngredientDef(item.normalizedName ?? item.productName ?? "");
      if (!catDef) return false;
      if (catDef.selectorSchema.some(s => s.key === "type") && catDef.selectorSchema.some(s => s.key === "flavour")) return false;
      if (multiSelections.has(item.id)) return false;
      const v = (() => { try { return JSON.parse(item.variantSelections ?? "{}") as Record<string, string>; } catch { return {} as Record<string, string>; } })();
      return catDef.selectorSchema.some(sel => {
        if (!sel.multi) return false;
        return (v[sel.key] ?? "").split(",").map((s: string) => s.trim()).filter(Boolean).length > 1;
      });
    });
    const hasMultiVarietySplit = multiVarietySplitItems.length > 0;

    if (hasMulti || hasTypeFlavourSplit || hasMultiVarietySplit) {
      setIsCommitting(true);
      try {
        const existingNames = new Set(
          items.map(i => (i.productName ?? '').toLowerCase().trim())
        );
        const toRemove: number[] = [];
        const addPromises: Array<Promise<void>> = [];

        // Collect all item IDs that have any pending selection
        const allItemIds = new Set([...Array.from(multiSelections.keys())]);

        for (const itemId of Array.from(allItemIds)) {
          const picks = Array.from(multiSelections.get(itemId) ?? new Set<string>());
          if (picks.length === 0) continue;

          if (picks.length === 1) {
            if (onRenameItem) {
              const r = onRenameItem(itemId, picks[0]);
              if (r instanceof Promise) addPromises.push(r);
            }
          } else if (onAddItem) {
            for (const p of picks) {
              if (!existingNames.has(p.toLowerCase().trim())) {
                const r = onAddItem(p);
                if (r instanceof Promise) addPromises.push(r);
                existingNames.add(p.toLowerCase().trim());
              }
            }
            toRemove.push(itemId);
          } else if (onRenameItem) {
            const r = onRenameItem(itemId, picks[0]);
            if (r instanceof Promise) addPromises.push(r);
          }
        }

        // Type-flavour split: one basket item per selected type, with flavour resolved per type.
        //   flavourByType[t]       = chosen flavour option ("Pepperoni" or "Other")
        //   customFlavourByType[t] = free text when flavour is "Other"
        //   customType             = free text when type slot is "Other"
        //   appendDisplayNameInSplit adds the catalogue displayName as a suffix (e.g. "Pizza")
        //   Falls back to a global single flavour for items saved before per-type pairing.
        for (const item of typeFlavourSplitItems) {
          if (toRemove.includes(item.id)) continue;
          const catDef = getIngredientDef(item.normalizedName ?? item.productName ?? "");
          if (!catDef) continue;
          const v = (() => { try { return JSON.parse(item.variantSelections ?? "{}") as Record<string, string>; } catch { return {} as Record<string, string>; } })();
          const types = (v["type"] ?? "").split(",").map((s: string) => s.trim()).filter(Boolean);
          const flavourByType = (() => { try { return JSON.parse(v["flavourByType"] ?? "{}") as Record<string, string>; } catch { return {} as Record<string, string>; } })();
          const customFlavourByType = (() => { try { return JSON.parse(v["customFlavourByType"] ?? "{}") as Record<string, string>; } catch { return {} as Record<string, string>; } })();
          const globalFlavours = (v["flavour"] ?? "").split(",").map((s: string) => s.trim()).filter(Boolean);
          const globalSingleFlavour = globalFlavours.length === 1 && !globalFlavours.includes("Other") ? globalFlavours[0] : null;

          const resolveType = (t: string): string =>
            t === "Other" ? (v["customType"] || "Other") : t;

          const resolveFlavour = (t: string): string | null => {
            const f = flavourByType[t];
            if (!f) return globalSingleFlavour;
            if (f === "Other") return customFlavourByType[t] || null;
            return f;
          };

          const suffix = catDef.appendDisplayNameInSplit ? ` ${catDef.displayName}` : "";

          if (types.length === 1) {
            const resolvedT = resolveType(types[0]);
            const flavour = resolveFlavour(types[0]);
            const name = flavour ? `${flavour} ${resolvedT}${suffix}` : `${resolvedT}${suffix}`;
            const r = onRenameItem?.(item.id, name);
            if (r instanceof Promise) addPromises.push(r);
          } else {
            for (const t of types) {
              const resolvedT = resolveType(t);
              const flavour = resolveFlavour(t);
              const name = flavour ? `${flavour} ${resolvedT}${suffix}` : `${resolvedT}${suffix}`;
              if (!existingNames.has(name.toLowerCase().trim())) {
                const r = onAddItem?.(name);
                if (r instanceof Promise) addPromises.push(r);
                existingNames.add(name.toLowerCase().trim());
              }
            }
            toRemove.push(item.id);
          }
        }

        // Multi-variety split: one row per selected variety for apples, mushrooms, etc.
        // Each new row uses the persisted variantQuantities (set inline in CYC) or defaults to 1.
        for (const item of multiVarietySplitItems) {
          if (toRemove.includes(item.id)) continue;
          const catDef = getIngredientDef(item.normalizedName ?? item.productName ?? "");
          if (!catDef) continue;
          const v = (() => { try { return JSON.parse(item.variantSelections ?? "{}") as Record<string, string>; } catch { return {} as Record<string, string>; } })();
          const persistedVarQties: Record<string, number> = (() => { try { return JSON.parse(v["variantQuantities"] ?? "{}") as Record<string, number>; } catch { return {}; } })();
          const itemBasketLabel = (item as any).basketLabel as string | null ?? null;
          for (const sel of catDef.selectorSchema) {
            if (!sel.multi) continue;
            const varieties = (v[sel.key] ?? "").split(",").map((s: string) => s.trim()).filter(Boolean);
            if (varieties.length <= 1) continue;
            const displayName = catDef.displayName.toLowerCase();
            for (const variety of varieties) {
              const name = `${variety} ${displayName}`;
              if (!existingNames.has(name.toLowerCase().trim())) {
                const variantQty = persistedVarQties[variety] ?? 1;
                const r = onAddItem?.(name, variantQty, itemBasketLabel);
                if (r instanceof Promise) addPromises.push(r);
                existingNames.add(name.toLowerCase().trim());
              }
            }
            toRemove.push(item.id);
            break;
          }
        }

        await Promise.all(addPromises);
        toRemove.forEach(id => onRemoveItem?.(id));
        setMultiSelections(new Map());
      } finally {
        setIsCommitting(false);
      }
    }

    // Build display-layer quantity overrides for partially covered items.
    const newOverrides = new Map<number, number>();
    for (const [id, qty] of Array.from(cupboardQty.entries())) {
      const it = items.find(i => i.id === id);
      if (it?.quantityValue == null) continue;
      const remaining = Math.max(0, it.quantityValue - qty);
      if (remaining > 0) newOverrides.set(id, remaining);
    }
    setQtyOverrides(newOverrides);

    setPhase("shopping");
  }, [isCommitting, multiSelections, items, onAddItem, onRenameItem, onRemoveItem, cupboardQty]);

  // ── State derivation ─────────────────────────────────────────────────────

  function getItemState(item: SLItem): ShopState {
    if (onUpdateStatus) {
      // DB-backed path: derive state from shopStatus field
      const s = item.shopStatus;
      if (s === "deferred") return "not_in_shop";
      if (s === "in_basket" || s === "alternate_selected") return "in_basket";
      return "need";
    }
    // Legacy local-state path
    if (notInShop.has(item.id)) return "not_in_shop";
    if (item.checked) return "in_basket";
    return "need";
  }

  function setItemState(item: SLItem, next: ShopState) {
    if (getItemState(item) === next) return;
    if (onUpdateStatus) {
      const dbStatus =
        next === "in_basket" ? "in_basket" :
        next === "not_in_shop" ? "deferred" :
        "pending";
      onUpdateStatus(item.id, dbStatus);
      return;
    }
    setNotInShop((prev) => {
      const s = new Set(prev);
      if (next === "not_in_shop") s.add(item.id);
      else s.delete(item.id);
      return s;
    });
  }

  function getExtraState(id: number): ShopState {
    return extraStates.get(id) ?? "need";
  }

  const setExtraState = useCallback((id: number, next: ShopState) => {
    setExtraStates((prev) => {
      const m = new Map(prev);
      if (next === "need") m.delete(id);
      else m.set(id, next as "in_basket" | "not_in_shop");
      return m;
    });
  }, []);

  // ── Cupboard partial-quantity helpers ─────────────────────────────────────

  // ── Filtered item list (excludes at-home items once in shopping phase) ────

  const shoppingItems = useMemo(
    () => (phase === "shopping"
      ? items.filter((i) => {
          const isGot = onUpdateStatus ? i.shopStatus === "already_got" : atHomeIds.has(i.id);
          if (isGot) return false;
          // Also hide items fully covered by cupboard quantity (remaining = 0).
          const covered = cupboardQty.get(i.id);
          if (covered !== undefined && i.quantityValue != null && i.quantityValue > 0 && covered >= i.quantityValue) return false;
          return true;
        })
      : items),
    [items, atHomeIds, phase, onUpdateStatus, cupboardQty],
  );

  // ── Progress ─────────────────────────────────────────────────────────────

  const activeExtras = useMemo(() => extras.filter((e) => e.inBasket || e.alwaysAdd), [extras]);
  const totalItems = shoppingItems.length + activeExtras.length;

  const inBasketCount =
    shoppingItems.filter((i) => getItemState(i) === "in_basket").length +
    activeExtras.filter((e) => getExtraState(e.id) === "in_basket").length;

  const notFoundCount =
    shoppingItems.filter((i) => getItemState(i) === "not_in_shop").length +
    activeExtras.filter((e) => getExtraState(e.id) === "not_in_shop").length;

  const needCount = totalItems - inBasketCount - notFoundCount;
  const allSorted = totalItems > 0 && needCount === 0;

  // Legend visibility: true when ANY visible item is showing an estimated
  // (~£X.XX) price.  An item shows an estimate only when it has no real
  // matched product but does have a recognised category.
  const hasAnyEstimate = useMemo(() => {
    for (const i of shoppingItems) {
      if (getItemState(i) !== "need") continue;
      const matches = resolveDisplayMatches(i, allPriceMatches, thaPicks, selectedSupermarket, rankMode);
      if (matches.length > 0) continue;
      if (estimateFallbackPrice(i.category, i.quantityValue, i.unit) != null) return true;
    }
    return false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shoppingItems, allPriceMatches, thaPicks, selectedSupermarket, rankMode]);

  // ── Shopping trip completion ──────────────────────────────────────────────

  function handleFinishShop() {
    const remainingListItems = shoppingItems.filter((i) => getItemState(i) !== "in_basket");
    const remainingExtras = activeExtras.filter((e) => getExtraState(e.id) !== "in_basket");

    const remainingItems: ShopSession["remainingItems"] = [
      ...remainingListItems.map((i) => ({
        id: i.id,
        name: capWords(i.productName),
        qty: fmtQty(i.quantityValue, i.unit, i.quantityInGrams, measurementPref),
      })),
      ...remainingExtras.map((e) => ({ id: e.id, name: capWords(e.name), qty: "" })),
    ];

    const session: ShopSession = {
      completedAt: new Date().toISOString(),
      boughtCount: inBasketCount,
      remainingCount: remainingItems.length,
      remainingItems,
      needsPickup: remainingItems.length > 0,
    };

    saveShopSession(session);
    setShopSession(session);
  }

  async function handleShareRemaining() {
    if (!shopSession || shopSession.remainingCount === 0) return;
    const lines = shopSession.remainingItems.map((i) =>
      i.qty ? `- ${i.name} (${i.qty})` : `- ${i.name}`,
    );
    const text = `Still needed from the shopping list:\n${lines.join("\n")}\n\nCan you pick these up if you're out?`;

    if (typeof navigator.share === "function") {
      try { await navigator.share({ title: "Still needed – shopping list", text }); } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setShareStatus("copied");
        setTimeout(() => setShareStatus("idle"), 2200);
      } catch { /* clipboard unavailable */ }
    }
  }

  function handleExportList() {
    const lines: string[] = [
      "The Healthy Apples – Shopping List",
      `Store: ${selectedSupermarket}`,
      "",
    ];

    for (const cat of groupedCategories) {
      lines.push(cat.label.toUpperCase());
      for (const item of cat.savedItems) {
        const state = getItemState(item);
        const stateLabel =
          state === "in_basket" ? "In my basket" :
          state === "not_in_shop" ? "Get next time" : "To get";
        const matches = resolveDisplayMatches(item, allPriceMatches, thaPicks, selectedSupermarket, rankMode);
        const match = matches[0] ?? null;
        let pricingPart: string;
        if (match) {
          if (match.priceSource === "estimate" && match.price != null) {
            pricingPart = `~£${match.price.toFixed(2)}`;
          } else if (match.price != null) {
            pricingPart = `${match.productName} £${match.price.toFixed(2)}`;
          } else {
            pricingPart = match.productName;
          }
        } else {
          const est = estimateFallbackPrice(item.category, item.quantityValue, item.unit);
          pricingPart = est != null ? `~£${est.toFixed(2)}` : "No price yet";
        }
        lines.push(`- ${capWords(item.productName)} — ${pricingPart} — ${stateLabel}`);
      }
      for (const extra of cat.extraItems) {
        const state = getExtraState(extra.id);
        const stateLabel =
          state === "in_basket" ? "In my basket" :
          state === "not_in_shop" ? "Get next time" : "To get";
        lines.push(`- ${capWords(extra.name)} — ${stateLabel}`);
      }
      lines.push("");
    }

    const text = lines.join("\n").trimEnd();
    navigator.clipboard.writeText(text).then(() => {
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 2200);
    }).catch(() => {});
  }

  // ── Category grouping ─────────────────────────────────────────────────────

  const groupedCategories = useMemo(() => {
    const map = new Map<string, { savedItems: SLItem[]; extraItems: typeof extras }>();
    for (const cat of SHOPPING_CATS) map.set(cat.key, { savedItems: [], extraItems: [] });
    for (const item of shoppingItems) {
      const key = getItemCatKey(item.category, item.normalizedName ?? item.productName);
      (map.get(key) ?? map.get("other")!).savedItems.push(item);
    }
    for (const extra of activeExtras) {
      const key = getExtraCatKey(extra.category);
      (map.get(key) ?? map.get("other")!).extraItems.push(extra);
    }
    return SHOPPING_CATS.map((cat) => ({ ...cat, ...map.get(cat.key)! })).filter(
      (cat) => cat.savedItems.length > 0 || cat.extraItems.length > 0,
    );
  }, [shoppingItems, activeExtras]);

  // ── Active category ───────────────────────────────────────────────────────

  const activeCatKey = activeTab ?? groupedCategories[0]?.key ?? null;
  const activeCat = groupedCategories.find((c) => c.key === activeCatKey) ?? groupedCategories[0] ?? null;

  // Restore scroll position and active category once the shopping list is ready.
  useEffect(() => {
    if (phase !== "shopping" || groupedCategories.length === 0) return;
    if (scrollRestoredRef.current) return;
    scrollRestoredRef.current = true;
    // Double rAF: first fires after layout commit, second after paint — ensures
    // DOM is ready before we attempt scrolling.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          const savedCat = localStorage.getItem("tha-sl-shop-active-cat");
          if (savedCat && groupedCategories.some((c) => c.key === savedCat)) {
            setActiveTab(savedCat);
            const section = sectionRefs.current.get(savedCat);
            const container = itemsScrollRef.current;
            // Use direct scrollTop (instant) so the user doesn't see a scroll animation on load
            if (section && container) {
              container.scrollTop = section.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
            }
          }
        } catch {}
      });
    });
  }, [phase, groupedCategories]);

  function handleTabChange(key: string) {
    setActiveTab(key);
    try { localStorage.setItem("tha-sl-shop-active-cat", key); } catch {}
    const container = itemsScrollRef.current;
    const section = sectionRefs.current.get(key);
    isScrollingToRef.current = true;
    setTimeout(() => { isScrollingToRef.current = false; }, 650);
    if (section && container) {
      // Direct scrollTo gives pixel-precise control independent of scroll-padding-top.
      const top = section.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
      container.scrollTo({ top, behavior: "smooth" });
    } else if (container) {
      container.scrollTo({ top: 0 });
    }
  }

  // Scroll the active tab button into view within the tab strip
  useEffect(() => {
    const btn = activeTabElRef.current;
    const strip = tabStripRef.current;
    if (!btn || !strip) return;
    const btnLeft = btn.offsetLeft;
    const btnRight = btnLeft + btn.offsetWidth;
    const stripLeft = strip.scrollLeft;
    const stripRight = stripLeft + strip.clientWidth;
    if (btnLeft < stripLeft + 8) strip.scrollLeft = btnLeft - 8;
    else if (btnRight > stripRight - 8) strip.scrollLeft = btnRight - strip.clientWidth + 8;
  }, [activeCatKey]);

  // Update active tab as user scrolls; also debounce-save active category.
  // Listens on BOTH the inner container and window so active-tab tracking works
  // regardless of whether itemsScrollRef or the page <main> is the scroll host.
  useEffect(() => {
    const container = itemsScrollRef.current;
    if (!container || groupedCategories.length === 0) return;
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (!isScrollingToRef.current) {
          const containerTop = container.getBoundingClientRect().top;
          let activeKey: string | null = null;
          for (const cat of groupedCategories) {
            const el = sectionRefs.current.get(cat.key);
            if (!el) continue;
            // elTop: section's offset from container's visible top (negative = scrolled above)
            // Use a tight threshold so the active category only advances when the next
            // section's ref element is genuinely at or within 8px of the scroll top.
            const elTop = el.getBoundingClientRect().top - containerTop;
            if (Math.round(elTop) <= 8) activeKey = cat.key;
          }
          if (activeKey) setActiveTab(activeKey);

          if (scrollSaveTimerRef.current) clearTimeout(scrollSaveTimerRef.current);
          scrollSaveTimerRef.current = setTimeout(() => {
            try {
              if (activeKey) localStorage.setItem("tha-sl-shop-active-cat", activeKey);
            } catch {}
          }, 300);
        }
        ticking = false;
      });
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll);
      if (scrollSaveTimerRef.current) {
        clearTimeout(scrollSaveTimerRef.current);
        scrollSaveTimerRef.current = null;
      }
    };
  }, [groupedCategories]);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ── Per-category progress ─────────────────────────────────────────────────

  function getCatProgress(cat: (typeof groupedCategories)[number]) {
    const total = cat.savedItems.length + cat.extraItems.length;
    const got = cat.savedItems.filter((i) => getItemState(i) === "in_basket").length
      + cat.extraItems.filter((e) => getExtraState(e.id) === "in_basket").length;
    return { total, got, allDone: total > 0 && got === total };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────────────────────────────────

  function renderSavedItem(item: SLItem) {
    const state = getItemState(item);
    // Apply partial cupboard override: show remaining quantity instead of total.
    const qtyOverride = qtyOverrides.get(item.id);
    const qty = fmtQty(
      qtyOverride !== undefined ? qtyOverride : item.quantityValue,
      item.unit,
      qtyOverride !== undefined ? null : item.quantityInGrams,
      measurementPref,
    );
    const sources = sourcesByItem.get(item.id) ?? [];
    const firstMeal = (sources[0] as any)?.mealName as string | undefined;
    const isPantryStaple = pantryKeySet.has(
      normalizeIngredientKey(item.normalizedName ?? item.productName ?? ""),
    );

    // Resolve display matches using the user's chosen ranking mode.
    const resolvedMatches = resolveDisplayMatches(item, allPriceMatches, thaPicks, selectedSupermarket, rankMode);
    const currentMatchIndex = productIndexMap[item.id] ?? 0;
    const resolvedMatch = resolvedMatches[currentMatchIndex] ?? null;
    const isEditing = editingItemId === item.id;

    // Trust-layer estimate: only computed when there is NO real match and the
    // item has a recognised category.  Renders as "~£X.XX" with a legend at
    // the bottom of the list.  Never attaches a product or supermarket link.
    const itemEstimate: number | null = resolvedMatch
      ? null
      : estimateFallbackPrice(item.category, item.quantityValue, item.unit);

    // Alternatives for "Change choice" panel.
    // betterMatch: higher-rated option than currently shown (if any).
    // cheaperMatch: cheaper option than currently shown (if any, and not the same as betterMatch).
    const betterMatch = resolvedMatch
      ? (resolvedMatches.find(
          (m, i) => i !== currentMatchIndex && (m.thaRating ?? 0) > (resolvedMatch.thaRating ?? 0)
        ) ?? null)
      : null;
    const cheaperMatch = resolvedMatch
      ? (resolvedMatches.find(
          (m, i) =>
            i !== currentMatchIndex &&
            m !== betterMatch &&
            m.price !== null &&
            (resolvedMatch.price === null || m.price < resolvedMatch.price)
        ) ?? null)
      : null;

    // Whole foods are always 5 apples — the whole-food rule takes absolute priority.
    // Raw counts, product-match ratings, or DB values must never leak into this number.
    const itemIsWholeFood = isWholeFood(item);
    const effectiveRating: number | null = itemIsWholeFood
      ? 5
      : (resolvedMatch?.thaRating ?? item.thaRating ?? null);

    const rowBg =
      state === "in_basket"   ? "bg-primary/[0.04] dark:bg-primary/[0.07]"
      : state === "not_in_shop" ? "bg-amber-50/60 dark:bg-amber-950/20"
      : "";

    const nameCls =
      state === "in_basket"   ? "line-through text-muted-foreground/70"
      : state === "not_in_shop" ? "text-amber-700 dark:text-amber-400"
      : "text-foreground";

    return (
      <div
        key={item.id}
        className={`flex items-center gap-3 px-4 py-3 transition-colors duration-100 ${rowBg}`}
        data-print-item
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={`font-medium text-[13.5px] leading-snug ${nameCls}`}>
              {capWords(cleanProductName(item.productName, item.quantityValue))}
            </span>
            {qty && (
              <span className={`text-[11.5px] tabular-nums ${state !== "need" ? "text-muted-foreground/45" : "text-muted-foreground/70"}`}>
                {qty}
              </span>
            )}
            {/* Match-status signal: surfaced whenever an active item has no real
                ProductMatch attached (covers both unmatched and estimate-only).
                Purely visual, non-blocking, no tooltip. Distinct from the
                parser-driven `item.needsReview` "Check item" badge. */}
            {state === "need" && !resolvedMatch && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditValue(item.productName ?? "");
                  setEditingItemId(item.id);
                }}
                className="inline-flex items-center gap-0.5 text-[10.5px] font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline cursor-pointer rounded px-0.5 -mx-0.5 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                data-testid={`signal-review-${item.id}`}
                aria-label={`Review ${item.productName}`}
              >
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                Review
              </button>
            )}
            {(() => {
              const text = sourceLabel(item as any);
              if (!text) return null;
              return (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full border text-violet-600 dark:text-violet-400 border-violet-300 dark:border-violet-600" data-testid={`shop-badge-source-${item.id}`}>
                  {text}
                </span>
              );
            })()}
          </div>

          {/* Variant selections summary */}
          {!isEditing && (() => {
            const variantsRaw = (() => { try { return JSON.parse(item.variantSelections ?? "{}") as Record<string, string>; } catch { return {} as Record<string, string>; } })();
            const catDef = getIngredientDef(item.normalizedName ?? item.productName ?? "");
            if (!catDef?.selectorSchema.length) return null;
            const parts = catDef.selectorSchema
              .filter(sel => !!variantsRaw[sel.key])
              .map(sel => {
                const raw = variantsRaw[sel.key];
                const vals = raw.split(",").map((v: string) => v.trim()).filter(Boolean);
                const customVal = sel.freeTextKey ? (variantsRaw[sel.freeTextKey] ?? "") : "";
                const displayVals = vals.includes("Other") && customVal
                  ? [...vals.filter((v: string) => v !== "Other"), customVal]
                  : vals;
                return `${sel.label}: ${displayVals.join(", ")}`;
              });
            if (!parts.length) return null;
            return (
              <p className="text-[10.5px] text-muted-foreground/60 leading-tight mt-0.5">
                {parts.join(" · ")}
              </p>
            );
          })()}

          {/* Inline rename input */}
          {isEditing ? (
            <div className="tha-print-hide flex flex-col gap-1 mt-1.5">
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      const trimmed = editValue.trim();
                      if (trimmed && onRenameItem) onRenameItem(item.id, trimmed);
                      setEditingItemId(null);
                    }
                    if (e.key === "Escape") setEditingItemId(null);
                  }}
                  className="flex-1 h-6 text-[11px] rounded-md border border-primary/40 bg-background px-2 focus:outline-none focus:ring-1 focus:ring-primary/40"
                  placeholder="Refine item name…"
                />
                <button
                  onClick={() => {
                    const trimmed = editValue.trim();
                    if (trimmed && onRenameItem) onRenameItem(item.id, trimmed);
                    setEditingItemId(null);
                  }}
                  className="h-6 w-6 flex items-center justify-center rounded bg-primary text-primary-foreground"
                >
                  <Check className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setEditingItemId(null)}
                  className="h-6 w-6 flex items-center justify-center rounded border border-border text-muted-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <SpellSuggestions
                term={editValue}
                onPick={(word) => setEditValue(word)}
                testIdPrefix={`edit-item-${item.id}`}
              />
            </div>
          ) : (
            <>
              {/* Product match hint with Change choice panel */}
              {state === "need" && resolvedMatch && (
                <>
                <div key={rankMode} className="tha-print-hide flex items-center gap-1.5 mt-0.5 flex-wrap animate-in fade-in duration-200">
                  {resolvedMatch.priceSource === "estimate" ? (
                    resolvedMatch.price != null && (
                      <span className="text-[11px] text-muted-foreground/55 italic tabular-nums">
                        Estimated ~£{resolvedMatch.price.toFixed(2)}
                      </span>
                    )
                  ) : (
                    <>
                      <span className="text-[11px] text-muted-foreground/70 truncate max-w-[160px]">
                        {resolvedMatch.productName}
                      </span>
                      {resolvedMatch.price != null && (
                        <span className="text-[11px] text-muted-foreground/70 tabular-nums">
                          £{resolvedMatch.price.toFixed(2)}
                        </span>
                      )}
                    </>
                  )}
                  {(resolvedMatches.length > 1 || betterMatch || cheaperMatch) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setChoiceOpenId(prev => prev === item.id ? null : item.id); }}
                      className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/40 hover:text-primary/70 transition-colors"
                      title="Change product choice"
                    >
                      <span>Change</span>
                    </button>
                  )}
                  {onRenameItem && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditValue(item.productName ?? ""); setEditingItemId(item.id); }}
                      className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/40 hover:text-foreground transition-colors"
                      title="Refine item name"
                    >
                      <Pencil className="h-2.5 w-2.5" />
                    </button>
                  )}
                  {onAnalyse && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onAnalyse(item); }}
                      className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/40 hover:text-foreground transition-colors"
                      title="Analyse product"
                    >
                      <Microscope className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
                {/* Change choice panel — shows current match + better-rated + cheaper alternatives */}
                {choiceOpenId === item.id && (
                  <div className="tha-print-hide mt-1.5 space-y-1">
                    {/* Current match */}
                    <div
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md border"
                      style={{ background: "hsl(var(--primary) / 0.08)", borderColor: "hsl(var(--primary) / 0.2)" }}
                    >
                      <span className="text-[10px] font-medium text-foreground/80 truncate flex-1">{resolvedMatch.productName}</span>
                      {resolvedMatch.price != null && (
                        <span className="text-[10px] tabular-nums text-muted-foreground flex-shrink-0">£{resolvedMatch.price.toFixed(2)}</span>
                      )}
                      <span className="text-[9px] text-primary/60 flex-shrink-0">Current</span>
                    </div>
                    {/* Better-rated alternative */}
                    {betterMatch && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductIndexMap(prev => ({ ...prev, [item.id]: resolvedMatches.indexOf(betterMatch) }));
                          setChoiceOpenId(null);
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border/60 hover:bg-primary/5 hover:border-primary/30 w-full text-left transition-colors"
                      >
                        <span className="text-[10px] font-medium truncate flex-1">{betterMatch.productName}</span>
                        {betterMatch.price != null && (
                          <span className="text-[10px] tabular-nums text-muted-foreground flex-shrink-0">£{betterMatch.price.toFixed(2)}</span>
                        )}
                        <span className="text-[9px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-1 py-0.5 rounded flex-shrink-0">Higher THA</span>
                      </button>
                    )}
                    {/* Cheaper alternative (different from betterMatch) */}
                    {cheaperMatch && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductIndexMap(prev => ({ ...prev, [item.id]: resolvedMatches.indexOf(cheaperMatch) }));
                          setChoiceOpenId(null);
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border/60 hover:bg-primary/5 hover:border-primary/30 w-full text-left transition-colors"
                      >
                        <span className="text-[10px] font-medium truncate flex-1">{cheaperMatch.productName}</span>
                        {cheaperMatch.price != null && (
                          <span className="text-[10px] tabular-nums text-muted-foreground flex-shrink-0">£{cheaperMatch.price.toFixed(2)}</span>
                        )}
                        <span className="text-[9px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-1 py-0.5 rounded flex-shrink-0">Cheaper</span>
                      </button>
                    )}
                    <div className="flex items-center gap-3">
                      {onClose && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onClose(); }}
                          className="text-[9px] text-primary/50 hover:text-primary transition-colors"
                        >
                          Open in Basket →
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setChoiceOpenId(null); }}
                        className="text-[9px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
                </>
              )}
              {state === "need" && !resolvedMatch && (
                <div className="tha-print-hide flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {itemEstimate != null ? (
                    <span
                      className="text-[11px] text-muted-foreground/55 italic tabular-nums"
                      data-testid={`text-estimate-${item.id}`}
                      title="Estimated price — no real product matched"
                    >
                      ~£{itemEstimate.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/40 italic">No price yet</span>
                  )}
                  {firstMeal && (
                    <p className="text-[11px] text-muted-foreground/55 leading-tight">
                      {firstMeal}{isPantryStaple ? " · staple" : ""}
                    </p>
                  )}
                  {onRenameItem && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditValue(item.productName ?? ""); setEditingItemId(item.id); }}
                      className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/40 hover:text-foreground transition-colors"
                      title="Refine item name"
                    >
                      <Pencil className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              )}
              {state === "not_in_shop" && (
                <p className="tha-print-hide text-[11px] text-amber-600/70 dark:text-amber-500/70 leading-tight mt-0.5">
                  Saved for next shop
                </p>
              )}
            </>
          )}
        </div>
        {/* Centre column: apple rating — prominent, vertically centred, separate from product text */}
        {state === "need" && effectiveRating != null && (
          <div className="tha-print-hide flex-shrink-0 flex items-center justify-center">
            <CompactRating rating={effectiveRating} />
          </div>
        )}
        <div className="tha-print-hide flex-shrink-0">
          <StateChips
            state={state}
            onChange={(s) => setItemState(item, s)}
            testIdPrefix={`shopping-view-item-${item.id}`}
          />
        </div>
        <div className="tha-print-show hidden flex-shrink-0 items-center">
          <PrintStateBadge state={state} />
        </div>
      </div>
    );
  }

  function renderExtraItem(extra: (typeof activeExtras)[number]) {
    const state = getExtraState(extra.id);
    const rowBg =
      state === "in_basket"   ? "bg-primary/[0.04] dark:bg-primary/[0.07]"
      : state === "not_in_shop" ? "bg-amber-50/60 dark:bg-amber-950/20"
      : "";
    const nameCls =
      state === "in_basket"   ? "line-through text-muted-foreground/70"
      : state === "not_in_shop" ? "text-amber-700 dark:text-amber-400"
      : "text-foreground";

    return (
      <div
        key={`extra-${extra.id}`}
        className={`flex items-center gap-3 px-4 py-3 transition-colors duration-100 ${rowBg}`}
        data-print-item
      >
        <div className="flex-1 min-w-0">
          <span className={`font-medium text-[13.5px] leading-snug ${nameCls}`}>
            {capWords(extra.name)}
          </span>
          {extra.alwaysAdd && (
            <span className="tha-print-hide ml-2 text-[11px] text-muted-foreground/45">regular</span>
          )}
        </div>
        <div className="tha-print-hide flex-shrink-0">
          <StateChips
            state={state}
            onChange={(s) => setExtraState(extra.id, s)}
            testIdPrefix={`shopping-view-extra-${extra.id}`}
          />
        </div>
        <div className="tha-print-show hidden flex-shrink-0 items-center">
          <PrintStateBadge state={state} />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const content = (
    <div
      id="tha-shopping-print-area"
      className="relative flex flex-col overflow-hidden rounded-xl border border-border bg-card/82 backdrop-blur-md"
      style={{ height: "calc(100vh - 9rem)" }}
    >


      {/* ══════════════════════════════════════════════════════════════════
          SCREEN CONTENT  (flex column - nothing outside item list scrolls)
      ══════════════════════════════════════════════════════════════════ */}

      {/* ── Shop View Toolbar ─────────────────────────────────────────────
          Title + progress summary. Print + Close actions.
          No logo here - branding is handled by the header above.
      ─────────────────────────────────────────────────────────────────── */}
      <header
        className="tha-print-hide relative z-20 flex-shrink-0 border-b border-border"
      >
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-5 sm:py-3 max-w-3xl mx-auto">
          {/* Left: title + progress */}
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1
                className="font-semibold text-[18px] sm:text-[20px] leading-tight text-foreground"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.015em" }}
              >
                {phase === "cupboard_check" ? "Check your cupboards" : "Shop View"}
              </h1>
              {totalItems > 0 && (
                <span
                  className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}
                >
                  <span
                    className="inline-block rounded-full bg-primary"
                    style={{ width: 5, height: 5, opacity: 0.7 }}
                  />
                  {inBasketCount}/{totalItems}
                  {allSorted && " · All sorted ✓"}
                </span>
              )}
            </div>
            <p className="sm:hidden text-[11px] text-muted-foreground leading-tight">
              {inBasketCount > 0 && `${inBasketCount} in basket`}
              {inBasketCount > 0 && notFoundCount > 0 && " · "}
              {notFoundCount > 0 && <span className="text-amber-600">{notFoundCount} not found</span>}
              {inBasketCount === 0 && notFoundCount === 0 && `${totalItems} items`}
            </p>
          </div>

          {/* Right: Supermarket picker + Rank mode + Print + Close */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <RankModeSelector rankMode={rankMode} onChange={handleRankModeChange} />
            {phase === "shopping" && (
              <Select value={selectedSupermarket} onValueChange={handleStoreChange}>
                <SelectTrigger className="h-8 text-xs bg-background/70 gap-1 pr-2" style={{ minWidth: 0, width: "auto" }}>
                  <Store className="h-3.5 w-3.5 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPERMARKETS.map(s => (
                    <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {inBasketCount > 0 && !shopSession && (
              <Button
                size="sm"
                onClick={handleFinishShop}
                className="gap-1.5 h-8 px-2.5 text-xs"
                data-testid="button-done-at-shop"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Done here</span>
              </Button>
            )}
            <div className="flex flex-col items-end justify-center gap-0.5 px-1">
              <button
                onClick={onClose}
                className="flex items-center gap-1 text-xs font-medium text-foreground/80 hover:text-foreground transition-colors leading-none"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Back to basket</span>
              </button>
              {phase === "shopping" && (
                <button
                  onClick={() => {
                    try { localStorage.setItem("tha-sl-shop-phase", "cupboard_check"); } catch {}
                    setPhase("cupboard_check");
                  }}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground/60 transition-colors leading-none"
                >
                  <ArrowLeft className="h-2.5 w-2.5" />
                  <span className="hidden sm:inline">Check your cupboards</span>
                </button>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center h-8 w-8 rounded-md transition-colors text-muted-foreground hover:bg-accent/60 hover:text-foreground">
                  <img src={thaAppleUrl} alt="Menu" className="h-[32px] w-[32px] object-contain" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onMatchStore && phase === "shopping" && (
                  <DropdownMenuItem
                    onClick={() => onMatchStore(selectedSupermarket)}
                    disabled={isMatchingPrices}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {isMatchingPrices ? "Finding prices…" : "Find prices"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={handleExportList}
                  disabled={groupedCategories.length === 0}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {exportCopied ? "Copied!" : "Export list"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {onClearBySource ? (
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        try {
                          localStorage.removeItem("tha-sl-shop-phase");
                          localStorage.removeItem("tha-sl-shop-basket-sig");
                          localStorage.removeItem("tha-sl-shop-scroll");
                          localStorage.removeItem("tha-sl-shop-active-cat");
                        } catch {}
                        onClearBySource("planned");
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear planned
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        try {
                          localStorage.removeItem("tha-sl-shop-phase");
                          localStorage.removeItem("tha-sl-shop-basket-sig");
                          localStorage.removeItem("tha-sl-shop-scroll");
                          localStorage.removeItem("tha-sl-shop-active-cat");
                        } catch {}
                        onClearBySource("quick_list");
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear quick list
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        try {
                          localStorage.removeItem("tha-sl-shop-phase");
                          localStorage.removeItem("tha-sl-shop-basket-sig");
                          localStorage.removeItem("tha-sl-shop-scroll");
                          localStorage.removeItem("tha-sl-shop-active-cat");
                        } catch {}
                        onClearBySource("all");
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear all
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    onClick={() => {
                      try {
                        localStorage.removeItem("tha-sl-shop-phase");
                        localStorage.removeItem("tha-sl-shop-basket-sig");
                        localStorage.removeItem("tha-sl-shop-scroll");
                        localStorage.removeItem("tha-sl-shop-active-cat");
                      } catch {}
                      onClearBasket?.();
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Basket
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {onListFilterChange && listFilter && (
          <div className="flex items-center gap-1 px-3 pb-2 sm:px-5 max-w-3xl mx-auto" data-testid="shop-source-filter-tabs">
            {(["all", "planned", "extras", "home"] as const).map(f => (
              <button
                key={f}
                onClick={() => onListFilterChange(f)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  listFilter === f
                    ? "bg-primary/10 text-primary border-primary/30 font-medium"
                    : "text-muted-foreground border-border hover:border-primary/20 hover:text-foreground"
                }`}
                data-testid={`shop-filter-tab-${f}`}
              >
                {f === "all" ? "All" : f === "planned" ? "Planned" : f === "extras" ? "Extras" : "Home"}
              </button>
            ))}
          </div>
        )}
        {totalItems > 0 && (
          <div className="h-0.5 w-full" style={{ background: "hsl(var(--border) / 0.35)" }}>
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${Math.round((inBasketCount / Math.max(totalItems, 1)) * 100)}%` }}
            />
          </div>
        )}
      </header>

      {/* ── 3. Folder Tab Strip ───────────────────────────────────────────
          Tabs: rounded top corners, flat bottom, 2px accent top bar.
          Active tab connects seamlessly to the panel below.
      ─────────────────────────────────────────────────────────────────── */}
      {phase === "shopping" && groupedCategories.length > 0 && (
        <div
          className="tha-print-hide relative z-10 flex-shrink-0"
          style={{
            background: "hsl(var(--background) / 0.88)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: "1px solid hsl(var(--border) / 0.65)",
          }}
        >
          <div
            ref={tabStripRef}
            className="flex items-end gap-0.5 overflow-x-auto scrollbar-hide px-3 sm:px-5 pt-2"
            style={{ maxWidth: "672px", margin: "0 auto" }}
          >
            {groupedCategories.map((cat) => {
              const isActive = cat.key === activeCatKey;
              const { total, got, allDone } = getCatProgress(cat);

              return (
                <button
                  key={cat.key}
                  ref={isActive ? activeTabElRef : null}
                  onClick={() => handleTabChange(cat.key)}
                  style={{
                    flexShrink: 0,
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    paddingTop: isActive ? 6 : 5,
                    paddingRight: isActive ? 12 : 10,
                    paddingBottom: isActive ? 9 : 6,
                    paddingLeft: isActive ? 12 : 10,
                    borderRadius: "6px 6px 0 0",
                    borderTopWidth: 2,
                    borderTopStyle: "solid",
                    borderTopColor: isActive ? cat.tabAccent : `${cat.tabAccent}75`,
                    borderRightWidth: 1,
                    borderRightStyle: "solid",
                    borderRightColor: isActive ? "hsl(var(--border) / 0.75)" : "hsl(var(--border) / 0.35)",
                    borderBottomWidth: isActive ? 0 : 1,
                    borderBottomStyle: "solid",
                    borderBottomColor: "hsl(var(--border) / 0.35)",
                    borderLeftWidth: 1,
                    borderLeftStyle: "solid",
                    borderLeftColor: isActive ? "hsl(var(--border) / 0.75)" : "hsl(var(--border) / 0.35)",
                    background: isActive ? "hsl(var(--card))" : "hsl(var(--muted) / 0.40)",
                    marginBottom: isActive ? -1 : 0,
                    zIndex: isActive ? 3 : 1,
                    fontSize: 11.5,
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    outline: "none",
                    transition: "color 0.1s, background 0.1s",
                  }}
                >
                  <span style={{ fontSize: 13, lineHeight: 1 }} aria-hidden>{cat.emoji}</span>
                  <span>{cat.label}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 400,
                      color: isActive ? "hsl(var(--muted-foreground))" : "hsl(var(--muted-foreground) / 0.5)",
                      marginLeft: 1,
                    }}
                  >
                    {total}
                  </span>
                  {allDone && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: cat.tabAccent, marginLeft: 1, lineHeight: 1 }}>
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4a. Cupboard check ───────────────────────────────────────────────── */}
      {phase === "cupboard_check" && !shopSession && (
        <div className="tha-print-hide relative z-10 flex-1 overflow-hidden flex flex-col px-3 sm:px-5 pt-3 pb-3 w-full max-w-3xl mx-auto">
          <div
            className="flex flex-col flex-1 min-h-0 rounded-xl overflow-hidden border border-border bg-card/82 backdrop-blur-md"
          >
            {/* Panel header */}
            <div
              className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b"
              style={{ background: "hsl(var(--primary) / 0.06)", borderColor: "hsl(var(--primary) / 0.15)" }}
            >
              <div>
                <p className="font-semibold text-[14px] text-foreground">Check your cupboards</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">Mark anything you already have at home.</p>
              </div>
              <button
                onClick={handleHeadToShop}
                className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground underline underline-offset-2 flex-shrink-0"
              >
                Skip
              </button>
            </div>

            {/* Item list */}
            <div className="flex-1 overflow-y-auto" style={{ background: "hsl(var(--card) / 0.30)" }}>
              <div className="divide-y divide-border/25">
                {items.map((item) => {
                  const isAtHome = onUpdateStatus
                    ? item.shopStatus === "already_got"
                    : atHomeIds.has(item.id);
                  const isLikelyInStock = pantryKeySet.has(
                    normalizeIngredientKey(item.normalizedName ?? item.productName ?? ""),
                  );
                  const qty = fmtQty(item.quantityValue, item.unit, item.quantityInGrams, measurementPref);
                  const displayName = capWords(cleanProductName(item.productName, item.quantityValue));

                  // ── Unrecognised-item review card ──────────────────────────
                  if (item.needsReview && !reviewDismissed.has(item.id)) {
                    return (
                      <div
                        key={item.id}
                        className="px-4 py-3 border-l-4 border-amber-500 bg-amber-50/70 dark:bg-amber-950/25"
                      >
                        {reviewEditId === item.id ? (
                          // Inline edit mode
                          <div className="flex flex-col gap-2">
                            <span className="text-[11px] text-muted-foreground/70">What is this item?</span>
                            <div className="flex items-center gap-2">
                              <input
                                autoFocus
                                value={reviewEditVal}
                                onChange={e => setReviewEditVal(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === "Enter") {
                                    const trimmed = reviewEditVal.trim();
                                    if (trimmed) {
                                      if (onRenameItem) onRenameItem(item.id, trimmed);
                                      setReviewDismissed(prev => { const s = new Set(prev); s.add(item.id); return s; });
                                    }
                                    setReviewEditId(null);
                                  }
                                  if (e.key === "Escape") setReviewEditId(null);
                                }}
                                className="flex-1 h-7 text-[13px] px-2 rounded-md border border-border bg-background/80 focus:outline-none focus:ring-1 focus:ring-primary/30"
                                placeholder="e.g. Broccoli"
                              />
                              <button
                                onClick={() => {
                                  const trimmed = reviewEditVal.trim();
                                  if (trimmed) {
                                    if (onRenameItem) onRenameItem(item.id, trimmed);
                                    setReviewDismissed(prev => { const s = new Set(prev); s.add(item.id); return s; });
                                  }
                                  setReviewEditId(null);
                                }}
                                className="h-7 px-3 text-[11px] rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setReviewEditId(null)}
                                className="h-7 px-2 text-[11px] rounded-md border border-border/60 text-muted-foreground hover:bg-muted/50 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Review prompt
                          (() => {
                            const isAmbiguous = (item as any).reviewReason === 'ambiguous_term';
                            const suggestions: string[] = (() => {
                              if (!isAmbiguous) return [];
                              try {
                                const raw = JSON.parse((item as any).reviewSuggestions ?? '[]');
                                if (Array.isArray(raw)) return raw as string[];
                                return (raw?.items ?? []) as string[];
                              } catch { return []; }
                            })();
                            return (
                              <div className="flex flex-col gap-2">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2 flex-wrap">
                                      <span className="font-medium text-[13.5px] text-foreground/80">{displayName}</span>
                                      {qty && <span className="text-[11.5px] tabular-nums text-muted-foreground/60">{qty}</span>}
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                                      <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                        Check item —{" "}
                                        {isAmbiguous ? "which type did you mean?" : "couldn't be confidently recognised"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                                    {!isAmbiguous && (
                                      <button
                                        onClick={() => { setReviewEditVal(item.productName ?? ""); setReviewEditId(item.id); }}
                                        className="text-[11px] px-2.5 py-1 rounded-lg border border-border/60 bg-background/70 text-foreground/70 hover:bg-muted/50 hover:border-border transition-colors"
                                      >
                                        Edit
                                      </button>
                                    )}
                                    <button
                                      onClick={() => setReviewDismissed(prev => { const s = new Set(prev); s.add(item.id); return s; })}
                                      className="text-[11px] px-2.5 py-1 rounded-lg border border-border/60 bg-background/70 text-foreground/70 hover:bg-muted/50 hover:border-border transition-colors"
                                    >
                                      Keep
                                    </button>
                                    {onRemoveItem && (
                                      <button
                                        onClick={() => onRemoveItem(item.id)}
                                        className="text-[11px] px-2.5 py-1 rounded-lg border border-rose-200/60 dark:border-rose-800/40 bg-background/70 text-rose-500/80 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors"
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {/* Universal ambiguity picker — dropdown + removable tags + confirm */}
                                {isAmbiguous && suggestions.length > 0 && (() => {
                                  const selected = multiSelections.get(item.id) ?? new Set<string>();
                                  const available = suggestions.filter(s => !selected.has(s));

                                  const addPick = (val: string) => setMultiSelections(prev => {
                                    const next = new Map(prev);
                                    const cur = new Set(next.get(item.id) ?? []);
                                    cur.add(val);
                                    next.set(item.id, cur);
                                    return next;
                                  });

                                  const removePick = (val: string) => setMultiSelections(prev => {
                                    const next = new Map(prev);
                                    const cur = new Set(next.get(item.id) ?? []);
                                    cur.delete(val);
                                    if (cur.size === 0) { next.delete(item.id); } else { next.set(item.id, cur); }
                                    return next;
                                  });

                                  const confirmPicks = () => {
                                    const picks = Array.from(selected);
                                    if (picks.length === 0) return;
                                    if (picks.length === 1) {
                                      if (onRenameItem) onRenameItem(item.id, picks[0]);
                                    } else {
                                      if (onAddItem) {
                                        picks.forEach(p => onAddItem(p));
                                        if (onRemoveItem) onRemoveItem(item.id);
                                      } else if (onRenameItem) {
                                        onRenameItem(item.id, picks[0]);
                                      }
                                    }
                                    setReviewDismissed(prev => { const s = new Set(prev); s.add(item.id); return s; });
                                    setMultiSelections(prev => { const m = new Map(prev); m.delete(item.id); return m; });
                                  };

                                  return (
                                    <div className="flex flex-col gap-1.5 mt-1">
                                      {selected.size > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {Array.from(selected).map(s => (
                                            <span
                                              key={s}
                                              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-primary/40 bg-primary/[0.08] text-primary"
                                            >
                                              {s}
                                              <button
                                                onClick={() => removePick(s)}
                                                aria-label={`Remove ${s}`}
                                                className="flex items-center text-primary/60 hover:text-primary transition-colors"
                                              >
                                                <X className="h-2.5 w-2.5" />
                                              </button>
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      {available.length > 0 && (
                                        <select
                                          key={`${item.id}-${selected.size}`}
                                          defaultValue=""
                                          onChange={e => { const v = e.target.value; if (v) addPick(v); }}
                                          className="text-[11px] h-7 pl-2 pr-6 rounded-lg border border-primary/40 bg-background/80 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer self-start"
                                        >
                                          <option value="" disabled>
                                            {selected.size === 0 ? 'Select type…' : '+ Add another type'}
                                          </option>
                                          {available.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                          ))}
                                        </select>
                                      )}
                                      {selected.size > 0 && (
                                        <button
                                          onClick={confirmPicks}
                                          className="text-[11px] px-3 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors self-start"
                                        >
                                          {selected.size === 1 ? 'Confirm' : `Add ${selected.size} items`}
                                        </button>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            );
                          })()
                        )}
                      </div>
                    );
                  }

                  // ── Normal recognised item ─────────────────────────────────
                  const cupboardCatDef = onVariantChange
                    ? getIngredientDef(item.normalizedName ?? item.productName ?? "")
                    : undefined;
                  // Resolved items (e.g. "Granny Smith apples", "Pepperoni Thin Crust Pizza")
                  // already encode a specific variety — suppress selectors for them.
                  const isResolvedVariant = !!(cupboardCatDef && isResolvedVariantItem(
                    item.productName ?? item.normalizedName ?? "",
                    cupboardCatDef,
                  ));
                  const hasCupboardSelector = !isResolvedVariant && !!(cupboardCatDef && (cupboardCatDef.selectorSchema.length > 0 || cupboardCatDef.relevantAttributes.length > 0));
                  const cupboardVariantSelections: Record<string, string> = hasCupboardSelector
                    ? (() => { try { return JSON.parse(item.variantSelections ?? "{}") as Record<string, string>; } catch { return {}; } })()
                    : {};
                  const cupboardAttrPreferences: Record<string, boolean> = hasCupboardSelector
                    ? (() => { try { return JSON.parse(item.attributePreferences ?? "{}") as Record<string, boolean>; } catch { return {}; } })()
                    : {};

                  // Detect variant-mode: a multi selector with >1 value selected.
                  // Excluded: type-flavour pattern items (crisps, pizza) — those use
                  // the type→flavour split path, not the per-variety row path.
                  const isTypeFlavourItem = !!(cupboardCatDef &&
                    cupboardCatDef.selectorSchema.some(s => s.key === "type") &&
                    cupboardCatDef.selectorSchema.some(s => s.key === "flavour"));
                  const variantEntries: Array<{ variety: string; displayLabel: string }> = [];
                  if (cupboardCatDef && !isTypeFlavourItem && !isResolvedVariant) {
                    for (const sel of cupboardCatDef.selectorSchema) {
                      if (!sel.multi) continue;
                      const vals = (cupboardVariantSelections[sel.key] ?? "")
                        .split(",").map((s: string) => s.trim()).filter(Boolean);
                      if (vals.length > 1) {
                        const catDisplayLower = cupboardCatDef.displayName.toLowerCase();
                        for (const v of vals) {
                          variantEntries.push({ variety: v, displayLabel: `${v} ${catDisplayLower}` });
                        }
                        break;
                      }
                    }
                  }
                  const isVariantMode = variantEntries.length > 1;

                  return (
                    <div
                      key={item.id}
                      className={`px-4 py-2.5 transition-colors duration-100 ${isAtHome ? "bg-primary/[0.04] dark:bg-primary/[0.07]" : ""}`}
                    >
                      {/* Row 1: name (left, flex-1) · qty stepper (right, suppressed in variant-mode) */}
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span
                          className={`flex-1 min-w-0 font-medium text-[13.5px] leading-snug truncate ${
                            isAtHome ? "line-through text-muted-foreground/70" : "text-foreground"
                          }`}
                        >
                          {displayName}
                        </span>

                        {/* Quantity stepper — suppressed in variant-mode (qty lives inline per variety) */}
                        {!isVariantMode && (
                          <div className="flex items-center gap-0.5 flex-shrink-0" data-testid={`cyc-qty-stepper-${item.id}`}>
                            {!isAtHome && onUpdateItemQty ? (
                              <>
                                <button
                                  onClick={() => {
                                    const step = cycStepSize(item.unit);
                                    const next = Math.max(step, (item.quantityValue ?? step) - step);
                                    setCycQtyDraft(m => { const n = new Map(m); n.delete(item.id); return n; });
                                    onUpdateItemQty(item.id, next);
                                  }}
                                  className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                  aria-label="Decrease quantity"
                                  data-testid={`cyc-qty-minus-${item.id}`}
                                >
                                  <Minus className="h-2.5 w-2.5" />
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  value={cycQtyDraft.get(item.id) ?? String(item.quantityValue ?? 1)}
                                  onChange={e => {
                                    const raw = e.target.value;
                                    setCycQtyDraft(m => { const n = new Map(m); n.set(item.id, raw); return n; });
                                  }}
                                  onBlur={e => {
                                    const parsed = parseFloat(e.target.value);
                                    const clamped = Math.max(1, isNaN(parsed) ? 1 : parsed);
                                    setCycQtyDraft(m => { const n = new Map(m); n.delete(item.id); return n; });
                                    if (clamped !== (item.quantityValue ?? 1)) onUpdateItemQty(item.id, clamped);
                                  }}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                    if (e.key === "Escape") {
                                      setCycQtyDraft(m => { const n = new Map(m); n.delete(item.id); return n; });
                                      (e.target as HTMLInputElement).blur();
                                    }
                                  }}
                                  className="h-5 w-10 text-[11.5px] tabular-nums text-center rounded border border-border/60 bg-background/80 focus:outline-none focus:ring-1 focus:ring-primary/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  data-testid={`cyc-qty-input-${item.id}`}
                                />
                                {item.unit && item.unit !== "unit" && (
                                  <span className="text-[10px] text-muted-foreground/60">{item.unit}</span>
                                )}
                                <button
                                  onClick={() => {
                                    const step = cycStepSize(item.unit);
                                    const next = (item.quantityValue ?? step) + step;
                                    setCycQtyDraft(m => { const n = new Map(m); n.delete(item.id); return n; });
                                    onUpdateItemQty(item.id, next);
                                  }}
                                  className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                  aria-label="Increase quantity"
                                  data-testid={`cyc-qty-plus-${item.id}`}
                                >
                                  <Plus className="h-2.5 w-2.5" />
                                </button>
                              </>
                            ) : qty ? (
                              <span className="text-[11.5px] tabular-nums text-muted-foreground/70">{qty}</span>
                            ) : null}
                          </div>
                        )}
                      </div>

                      {/* Detail line: variety selectors + inline qty inputs (no child rows) */}
                      {hasCupboardSelector && cupboardCatDef && !isAtHome && (
                        <WholeFoodSelector
                          item={item}
                          catalogueDef={cupboardCatDef}
                          variantSelections={cupboardVariantSelections}
                          attributePreferences={cupboardAttrPreferences}
                          onVariantChange={(key, value) => onVariantChange!(item.id, key, value)}
                          onAttributeChange={(key, value) => onAttributeChange?.(item.id, key, value)}
                          showVariantQty={isVariantMode}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add item row — persists to DB via onAddItem → resolver */}
              {onAddItem && (
                <div className="border-t border-border/25 px-4 py-3">
                  {addingItem ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={addItemVal}
                        onChange={e => setAddItemVal(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            const trimmed = addItemVal.trim();
                            if (trimmed) { onAddItem(trimmed, addItemQty > 1 ? addItemQty : undefined); setAddItemVal(""); setAddItemQty(1); setAddingItem(false); }
                          }
                          if (e.key === "Escape") { setAddItemVal(""); setAddItemQty(1); setAddingItem(false); }
                        }}
                        className="flex-1 h-8 text-[13px] px-2.5 rounded-lg border border-border bg-background/80 focus:outline-none focus:ring-1 focus:ring-primary/30"
                        placeholder="Add an item…"
                      />
                      <input
                        type="number"
                        min={1}
                        value={addItemQty}
                        onChange={e => setAddItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-14 h-8 text-[13px] px-2 rounded-lg border border-border bg-background/80 focus:outline-none focus:ring-1 focus:ring-primary/30 tabular-nums text-center"
                        aria-label="Quantity"
                      />
                      <button
                        onClick={() => {
                          const trimmed = addItemVal.trim();
                          if (trimmed) { onAddItem(trimmed, addItemQty > 1 ? addItemQty : undefined); setAddItemVal(""); setAddItemQty(1); setAddingItem(false); }
                        }}
                        className="h-8 px-3 text-[11px] rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => { setAddItemVal(""); setAddItemQty(1); setAddingItem(false); }}
                        className="h-8 px-2 text-[11px] rounded-lg border border-border/60 text-muted-foreground hover:bg-muted/50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingItem(true)}
                      className="flex items-center gap-1.5 text-[12px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add an item
                    </button>
                  )}
                </div>
              )}

              {/* CTA */}
              {(() => {
                const fullCount = onUpdateStatus
                  ? items.filter(i => i.shopStatus === "already_got").length
                  : atHomeIds.size;
                const partialCount = cupboardQty.size;
                const checkedCount = fullCount + partialCount;
                return (
                  <div className="px-4 py-4">
                    <button
                      onClick={handleHeadToShop}
                      disabled={isCommitting}
                      className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 active:bg-primary/80 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isCommitting
                        ? "Saving…"
                        : checkedCount > 0
                          ? `Done — ${checkedCount} item${checkedCount > 1 ? "s" : ""} checked`
                          : "Head to the shop"}
                      {!isCommitting && <ArrowRight className="h-4 w-4" />}
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── 4b. Shopping trip summary (shown after "Done here") ──────────── */}
      {shopSession && (
        <div className="tha-print-hide relative z-10 flex-1 overflow-y-auto px-3 sm:px-5 pt-4 pb-6 w-full max-w-3xl mx-auto">
          {/* Header card */}
          <div
            className="rounded-xl p-5 mb-4"
            style={{
              background: "hsl(var(--card) / 0.75)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid hsl(var(--border) / 0.45)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
              <div>
                <h2 className="font-semibold text-[17px] leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                  Shopping done at this shop
                </h2>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  {new Date(shopSession.completedAt).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-lg px-4 py-3"
                style={{ background: "hsl(var(--primary) / 0.07)", border: "1px solid hsl(var(--primary) / 0.15)" }}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <ShoppingBag className="h-3.5 w-3.5 text-primary/70" />
                  <span className="text-[11px] text-muted-foreground/70 font-medium uppercase tracking-wide">Bought</span>
                </div>
                <p className="text-[22px] font-bold text-primary leading-none">{shopSession.boughtCount}</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">item{shopSession.boughtCount !== 1 ? "s" : ""} ✓</p>
              </div>
              <div
                className="rounded-lg px-4 py-3"
                style={{
                  background: shopSession.remainingCount > 0 ? "hsl(var(--amber-50, 45 100% 97%) / 0.8)" : "hsl(var(--primary) / 0.04)",
                  border: shopSession.remainingCount > 0 ? "1px solid rgba(217,119,6,0.2)" : "1px solid hsl(var(--border) / 0.3)",
                }}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[13px] leading-none">📋</span>
                  <span className="text-[11px] text-muted-foreground/70 font-medium uppercase tracking-wide">Still needed</span>
                </div>
                <p className={`text-[22px] font-bold leading-none ${shopSession.remainingCount > 0 ? "text-amber-600" : "text-primary"}`}>
                  {shopSession.remainingCount}
                </p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  {shopSession.remainingCount === 0 ? "all done!" : `item${shopSession.remainingCount !== 1 ? "s" : ""} remaining`}
                </p>
              </div>
            </div>
          </div>

          {/* Remaining items list */}
          {shopSession.remainingCount > 0 && (
            <div
              className="rounded-xl overflow-hidden mb-4"
              style={{
                background: "hsl(var(--card) / 0.72)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid hsl(var(--border) / 0.45)",
                boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
              }}
            >
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/30"
                style={{ background: "rgba(217,119,6,0.06)" }}
              >
                <span className="text-[12px] font-semibold text-amber-700 dark:text-amber-400">
                  Still needed — on your list for next time
                </span>
              </div>
              <div className="divide-y divide-border/20">
                {shopSession.remainingItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-amber-500/70 text-[11px] flex-shrink-0">○</span>
                    <span className="text-[13.5px] font-medium text-foreground flex-1 min-w-0">{item.name}</span>
                    {item.qty && (
                      <span className="text-[11.5px] text-muted-foreground/60 tabular-nums flex-shrink-0">{item.qty}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Share + navigation actions */}
          <div className="flex flex-col gap-2.5">
            {shopSession.remainingCount > 0 && (
              <Button
                size="default"
                className="w-full gap-2 h-11"
                onClick={handleShareRemaining}
                data-testid="button-share-remaining"
              >
                {shareStatus === "copied" ? (
                  <><Check className="h-4 w-4" /><span>Copied to clipboard!</span></>
                ) : (
                  <>{typeof navigator.share === "function" ? <Share2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>Send remaining items</span></>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="default"
              className="w-full gap-2 h-10"
              onClick={() => setShopSession(null)}
              data-testid="button-continue-shopping"
            >
              <span>Continue shopping</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground/70 text-xs h-8"
              onClick={onClose}
            >
              Close shopping view
            </Button>
          </div>
        </div>
      )}

      {/* ── 4b. Category Scroll View ──────────────────────────────────────────
          All categories rendered in one scrollable list.
          Tabs jump to the corresponding section; sticky headers keep context.
      ─────────────────────────────────────────────────────────────────── */}
      {phase === "shopping" && !shopSession && <div className="tha-print-hide relative z-10 flex-1 overflow-hidden flex flex-col px-3 sm:px-5 pt-3 pb-3 w-full max-w-3xl mx-auto">
        {groupedCategories.length > 0 ? (
          <div
            className="flex-1 flex flex-col min-h-0 rounded-xl overflow-hidden"
            style={{ border: "1px solid hsl(var(--border) / 0.45)" }}
          >
            {/* Pinned category header — lives outside the scroll container so items can never pass under it */}
            {activeCat && (() => {
              const { total: hTotal, got: hGot, allDone: hDone } = getCatProgress(activeCat);
              return (
                <div
                  className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 border-b"
                  style={{
                    background: `${activeCat.tabAccent}18`,
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    borderColor: activeCat.panelBorderColor,
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[18px] leading-none" aria-hidden>{activeCat.emoji}</span>
                    <span
                      className="font-semibold text-[15px]"
                      style={{ color: activeCat.tabAccent, fontFamily: "var(--font-display)" }}
                    >
                      {activeCat.label}
                    </span>
                    <span className="text-[12px] text-muted-foreground/60">
                      {hGot > 0 ? `${hGot} / ${hTotal}` : `${hTotal} item${hTotal !== 1 ? "s" : ""}`}
                    </span>
                  </div>
                  {hDone && (
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: activeCat.tabAccent, background: `${activeCat.tabAccent}20` }}
                    >
                      All done ✓
                    </span>
                  )}
                </div>
              );
            })()}

            {/* Scrollable items — sections flow in normal document order, no sticky inside */}
            <div
              ref={itemsScrollRef}
              className="flex-1 min-h-0 overflow-y-auto"
              style={{ background: "hsl(var(--card) / 0.30)" }}
            >
              {groupedCategories.map((cat, catIndex) => {
                const { total, got, allDone } = getCatProgress(cat);
                return (
                  <div
                    key={cat.key}
                    id={`cat-section-${cat.key}`}
                    ref={(el) => {
                      if (el) sectionRefs.current.set(cat.key, el);
                      else sectionRefs.current.delete(cat.key);
                    }}
                  >
                    {/* Items in this category — soft-grouped by source priority */}
                    <div className="divide-y divide-border/25">
                      {[...cat.savedItems]
                        .sort((a, b) => sourcePriority(a as any) - sourcePriority(b as any))
                        .map((item) => renderSavedItem(item))}
                      {cat.extraItems.map((extra) => renderExtraItem(extra))}
                    </div>
                  </div>
                );
              })}

              {/* Estimated-price legend — only shown when at least one visible
                  item is currently displaying a "~£X.XX" estimated price. */}
              {hasAnyEstimate && (
                <div
                  className="tha-print-hide flex items-center justify-center gap-1.5 px-4 py-2 mt-1 border-t border-border/30"
                  data-testid="legend-estimated-price"
                >
                  <span className="text-[11px] text-muted-foreground/60 italic tabular-nums">~</span>
                  <span className="text-[11px] text-muted-foreground/60 italic">Estimated price</span>
                </div>
              )}

              {/* All-sorted celebration */}
              {allSorted && (
                <div
                  className="mx-3 my-3 text-center py-4 rounded-xl border border-primary/15"
                  style={{ background: "hsl(var(--primary) / 0.04)" }}
                >
                  <p className="font-medium text-sm text-primary" style={{ fontFamily: "var(--font-display)" }}>
                    {notFoundCount > 0
                      ? `Almost there — ${notFoundCount} item${notFoundCount > 1 ? "s" : ""} not found`
                      : "All sorted! Happy shopping 🌿"}
                  </p>
                  {!shopSession && (
                    <button
                      onClick={handleFinishShop}
                      className="mt-2 text-[11px] text-primary/70 underline underline-offset-2"
                    >
                      Tap "Done here" to finish this trip
                    </button>
                  )}
                </div>
              )}
              {notFoundCount > 0 && (
                <p className="my-2 text-center text-[11px] text-muted-foreground/50">
                  "Get next time" items are saved for your next shop.
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Empty basket state */
          <div
            className="flex-1 rounded-xl flex flex-col items-center justify-center py-20 text-center"
            style={{
              background: "hsl(var(--card) / 0.72)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid hsl(var(--border) / 0.4)",
            }}
          >
            <img src="/apple-logo.png" alt="" style={{ height: 40, width: "auto", opacity: 0.3, marginBottom: 16 }} />
            <p className="font-medium text-base text-foreground/60 mb-1">Your basket is empty</p>
            <p className="text-sm text-muted-foreground/50">Add items to your basket first.</p>
          </div>
        )}
      </div>}

      {/* ══════════════════════════════════════════════════════════════════
          PRINT CONTENT - hidden on screen, shown via CSS in @media print
          Uses existing CSS hooks: data-print-grid, data-print-cat, etc.
      ══════════════════════════════════════════════════════════════════ */}

      {/* Print header */}
      <div className="tha-print-show tha-print-header-block hidden items-center gap-4 px-0 pt-0 pb-0">
        <img
          src="/logo-long.png"
          alt="The Healthy Apples"
          style={{ height: 32, width: "auto" }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/apple-logo.png";
            (e.target as HTMLImageElement).style.height = "26px";
          }}
        />
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
            Shop View
          </h1>
          <p style={{ fontSize: 10, color: "#9ca3af", margin: "2px 0 0" }}>{today}</p>
        </div>
      </div>

      {/* Print: all categories in 2-column grid */}
      <div className="tha-print-show hidden" data-print-grid>
        {groupedCategories.map((cat) => (
          <div key={cat.key} data-print-cat>
            <div
              data-print-cat-header
              className="flex items-center gap-1.5"
              style={{ borderLeft: `3px solid ${cat.tabAccent}` }}
            >
              <span aria-hidden>{cat.emoji}</span>
              <span>{cat.label}</span>
            </div>
            <div data-print-items>
              {cat.savedItems.map((item) => {
                const state = getItemState(item);
                const qty = fmtQty(item.quantityValue, item.unit, item.quantityInGrams, measurementPref);
                return (
                  <div key={item.id} data-print-item className="flex items-center gap-1.5">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: state === "in_basket" ? 400 : 500, textDecoration: state === "in_basket" ? "line-through" : "none", color: state === "in_basket" ? "#6b7280" : "inherit" }}>
                        {capWords(cleanProductName(item.productName, item.quantityValue))}
                      </span>
                      {qty && <span style={{ marginLeft: 4, color: "#9ca3af" }}>{qty}</span>}
                    </div>
                    <PrintStateBadge state={state} />
                  </div>
                );
              })}
              {cat.extraItems.map((extra) => {
                const state = getExtraState(extra.id);
                return (
                  <div key={`extra-${extra.id}`} data-print-item className="flex items-center gap-1.5">
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: state === "in_basket" ? 400 : 500, textDecoration: state === "in_basket" ? "line-through" : "none", color: state === "in_basket" ? "#6b7280" : "inherit" }}>
                        {capWords(extra.name)}
                      </span>
                    </div>
                    <PrintStateBadge state={state} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Print footer */}
      <div className="tha-print-show tha-print-footer hidden flex-col items-center gap-1.5 mt-8 pt-4 border-t-2 border-gray-200 px-0 pb-0">
        <img src="/apple-logo.png" alt="The Healthy Apples" style={{ height: 22, width: "auto" }} />
        <p style={{ fontSize: 9, color: "#9ca3af", margin: 0 }}>Happy shopping! - The Healthy Apples</p>
      </div>

    </div>
  );

  return content;
}
