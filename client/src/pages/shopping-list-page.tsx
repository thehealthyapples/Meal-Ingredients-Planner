import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearch, Link } from "wouter";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import thaAppleSrc from "@/assets/icons/tha-apple.png";
import RetailerLogo from "@/components/RetailerLogo";
import {
  ShoppingCart, Copy, Trash2, RefreshCw, Scale,
  Search, ExternalLink, PoundSterling, TrendingDown, Loader2,
  ArrowUpDown, ArrowUp, ArrowDown, ArrowLeft, Pencil, Check, X,
  Beef, Fish, Milk, Egg, Leaf, Apple, Wheat, Flower2,
  Droplets, FlaskConical, Nut, Bean, Croissant, Package,
  CircleDot, Plus, Minus, Info, Layers, Crown, Sprout, Tag,
  Download, UtensilsCrossed, Store, Maximize2, Minimize2,
  ChevronDown, ChevronUp, AlertTriangle, Microscope, Filter, SlidersHorizontal,
  Snowflake, Home, Columns2, Clock, ChefHat, Sparkles, ListChecks, NotepadText,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { api, buildUrl } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";
import { normalizeIngredientKey } from "@shared/normalize";
import { formatItemDisplay, cleanProductName } from "@/lib/unit-display";
import ScoreBadge from "@/components/ui/score-badge";
import AppleRating from "@/components/AppleRating";
import BadAppleWarningModal from "@/components/BadAppleWarningModal";
import type { ShoppingListItem, ProductMatch, IngredientSource, SupermarketLink, FreezerMeal, IngredientProduct } from "@shared/schema";
import { getIngredientDef } from "@/lib/ingredient-catalogue";
import { isWholeFood } from "@/lib/basket-item-classifier";
import { safeParseJsonObject, safeStringifyJsonObject } from "@/lib/json-utils";
import { resolveBestMatch, type WholeFoodIntent } from "@/lib/whole-food-matcher";
import { calcConfidence, CONFIDENCE_LABELS, type ConfidenceLevel } from "@/lib/food-confidence";
import { getWholeFoodAlternative, effortLabel, effortColor, formatTime } from "@/lib/whole-food-alternatives";
import { rankChoices, buildWhyBetter } from "@/lib/analyser-choice";
import FoodKnowledgeModal from "@/components/food-knowledge-modal";
import WholeFoodSelector from "@/components/whole-food-selector";
import ShoppingListView from "@/components/ShoppingListView";
import ShopModeView from "@/components/ShopModeView";

type ShoppingListItemExtended = ShoppingListItem & {
  addedByDisplayName?: string | null;
  sources?: Array<{ mealId: number; mealName: string; weekNumber?: number | null; dayOfWeek?: number | null; mealSlot?: string | null }>;
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getItemAttributionText(item: ShoppingListItemExtended): string | null {
  const parts: string[] = [];
  if (item.addedByDisplayName) parts.push(`Added by ${item.addedByDisplayName}`);
  const src = item.sources?.[0];
  if (src) {
    const mealPart = src.mealName ? `From ${src.mealName}` : null;
    const dayPart = src.dayOfWeek != null && src.mealSlot
      ? `Needed for ${DAY_NAMES[src.dayOfWeek]} ${src.mealSlot}`
      : src.mealSlot ? `Needed for ${src.mealSlot}` : null;
    if (dayPart) parts.push(dayPart);
    else if (mealPart) parts.push(mealPart);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function formatQty(val: number | null, unit: string | null, pref: 'metric' | 'imperial', gramsVal?: number | null): { qty: string; unitLabel: string } {
  if (gramsVal !== null && gramsVal !== undefined && gramsVal > 0 && unit !== 'unit') {
    const isLiquid = unit === 'ml' || unit === 'L' || unit === 'cups' || unit === 'tbsp' || unit === 'tsp' || unit === 'fl oz';
    if (pref === 'metric') {
      if (isLiquid) {
        if (gramsVal >= 1000) return { qty: (gramsVal / 1000).toFixed(2).replace(/\.?0+$/, ''), unitLabel: 'L' };
        return { qty: Math.round(gramsVal).toString(), unitLabel: 'ml' };
      }
      if (gramsVal >= 1000) return { qty: (gramsVal / 1000).toFixed(2).replace(/\.?0+$/, ''), unitLabel: 'kg' };
      return { qty: Math.round(gramsVal).toString(), unitLabel: 'g' };
    } else {
      if (isLiquid) {
        if (gramsVal >= 240) return { qty: (gramsVal / 240).toFixed(1).replace(/\.?0+$/, ''), unitLabel: 'cups' };
        if (gramsVal >= 15) return { qty: (gramsVal / 15).toFixed(1).replace(/\.?0+$/, ''), unitLabel: 'tbsp' };
        return { qty: (gramsVal / 5).toFixed(1).replace(/\.?0+$/, ''), unitLabel: 'tsp' };
      }
      if (gramsVal >= 453.592) return { qty: (gramsVal / 453.592).toFixed(2).replace(/\.?0+$/, ''), unitLabel: 'lb' };
      return { qty: (gramsVal / 28.3495).toFixed(1).replace(/\.?0+$/, ''), unitLabel: 'oz' };
    }
  }
  if (val === null || val === undefined || !unit) return { qty: '-', unitLabel: '-' };
  if (unit === 'unit' && val === 1) return { qty: '1', unitLabel: '' };
  if (pref === 'metric') {
    if (unit === 'g') {
      if (val >= 1000) return { qty: (val / 1000).toFixed(2).replace(/\.?0+$/, ''), unitLabel: 'kg' };
      return { qty: Math.round(val).toString(), unitLabel: 'g' };
    }
    if (unit === 'ml') {
      if (val >= 1000) return { qty: (val / 1000).toFixed(2).replace(/\.?0+$/, ''), unitLabel: 'L' };
      return { qty: Math.round(val).toString(), unitLabel: 'ml' };
    }
  } else {
    if (unit === 'g') {
      if (val >= 453.592) return { qty: (val / 453.592).toFixed(2).replace(/\.?0+$/, ''), unitLabel: 'lb' };
      return { qty: (val / 28.3495).toFixed(1).replace(/\.?0+$/, ''), unitLabel: 'oz' };
    }
    if (unit === 'ml') {
      if (val >= 240) return { qty: (val / 240).toFixed(1).replace(/\.?0+$/, ''), unitLabel: 'cups' };
      if (val >= 15) return { qty: (val / 15).toFixed(1).replace(/\.?0+$/, ''), unitLabel: 'tbsp' };
      return { qty: (val / 5).toFixed(1).replace(/\.?0+$/, ''), unitLabel: 'tsp' };
    }
  }
  if (unit === 'unit') return { qty: val % 1 === 0 ? val.toString() : val.toFixed(1), unitLabel: '' };
  return { qty: val % 1 === 0 ? val.toString() : val.toFixed(1), unitLabel: unit };
}

const CATEGORY_COLORS: Record<string, string> = {
  meat: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  fish: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  dairy: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  eggs: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  produce: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  fruit: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  grains: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  herbs: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  oils: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300',
  condiments: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  nuts: 'bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300',
  legumes: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  bakery: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  tinned: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

const CATEGORY_ICONS: Record<string, typeof Beef> = {
  meat: Beef, fish: Fish, dairy: Milk, eggs: Egg, produce: Leaf, fruit: Apple,
  grains: Wheat, herbs: Flower2, oils: Droplets, condiments: FlaskConical,
  nuts: Nut, legumes: Bean, bakery: Croissant, tinned: Package, pantry: Package, other: CircleDot,
};

const BASKET_DISPLAY_CATEGORIES = [
  'produce', 'dairy', 'eggs', 'meat', 'fish', 'bakery', 'pantry', 'other',
];

const HOUSEHOLD_SUBCATEGORIES: Array<{ key: string; label: string; keywords: string[] }> = [
  { key: 'personal_care', label: 'Personal Care', keywords: ['toothpaste', 'toothbrush', 'soap', 'shampoo', 'conditioner', 'deodorant', 'moisturiser', 'moisturizer', 'body wash', 'face wash', 'razor', 'cotton', 'tampon', 'sanitary', 'mouthwash', 'floss', 'sunscreen', 'lotion', 'shower gel', 'bubble bath', 'nail', 'lip balm', 'hand wash'] },
  { key: 'paper', label: 'Paper & Home Essentials', keywords: ['toilet roll', 'toilet paper', 'kitchen roll', 'kitchen towel', 'tissue', 'loo roll', 'paper towel', 'foil', 'cling film', 'baking paper', 'parchment', 'kitchen paper', 'bin bag', 'bin liner', 'sandwich bag', 'freezer bag'] },
  { key: 'laundry', label: 'Laundry', keywords: ['laundry', 'washing powder', 'washing liquid', 'washing tablet', 'fabric softener', 'fabric conditioner', 'stain remover', 'tumble dryer', 'dryer sheet', 'dryer ball', 'colour catcher'] },
  { key: 'cleaning', label: 'Cleaning', keywords: ['bleach', 'spray', 'wipes', 'sponge', 'cloth', 'scrubber', 'dishwasher', 'washing up', 'washing-up', 'detergent', 'duster', 'mop', 'brush', 'cleaner', 'disinfect', 'descal', 'toilet cleaner', 'flash', 'fairy', 'anti-bac', 'antibacterial'] },
  { key: 'pet_care', label: 'Pet Care', keywords: ['cat food', 'dog food', 'cat litter', 'pet food', 'dog treat', 'cat treat', 'poop bag', 'dog biscuit', 'bird seed', 'fish food', 'hamster', 'rabbit food', 'pet bed', 'flea'] },
];

const HOUSEHOLD_SUBCATEGORY_LABELS: Record<string, string> = {
  personal_care: 'Personal Care',
  paper: 'Paper & Home Essentials',
  laundry: 'Laundry',
  cleaning: 'Cleaning',
  pet_care: 'Pet Care',
  misc_household: 'Miscellaneous Household',
};

const HOUSEHOLD_SUBCAT_KEYS = ['personal_care', 'paper', 'laundry', 'cleaning', 'pet_care', 'misc_household'];

function getHouseholdSubcategory(productName: string): string {
  const lower = (productName || '').toLowerCase();
  for (const { key, keywords } of HOUSEHOLD_SUBCATEGORIES) {
    if (keywords.some(kw => lower.includes(kw))) return key;
  }
  return 'misc_household';
}

const EXTRAS_TO_BASKET_CATEGORY: Record<string, string> = {
  larder: 'pantry', fridge: 'pantry', freezer: 'pantry', pantry: 'pantry',
  produce: 'produce', dairy: 'dairy', eggs: 'eggs', meat: 'meat',
  fish: 'fish', bakery: 'bakery', other: 'other',
};

const CATEGORY_COMMON_ITEMS: Record<string, string[]> = {
  produce: ['carrots', 'onions', 'garlic', 'spinach', 'broccoli', 'tomatoes', 'potatoes', 'lemons', 'apples', 'bananas'],
  dairy: ['milk', 'butter', 'cheddar cheese', 'greek yogurt', 'cream', 'sour cream'],
  eggs: ['free-range eggs', 'organic eggs'],
  meat: ['chicken breast', 'beef mince', 'sausages', 'bacon', 'pork chops'],
  fish: ['salmon fillets', 'cod fillets', 'tuna', 'prawns', 'mackerel'],
  bakery: ['sourdough bread', 'wholemeal bread', 'wraps', 'pitta bread', 'rolls'],
  pantry: ['olive oil', 'rice', 'pasta', 'plain flour', 'tinned tomatoes', 'stock cubes', 'honey', 'soy sauce', 'passata'],
  other: [],
  household: ['toilet roll', 'kitchen roll', 'bin bags', 'dishwasher tablets', 'washing up liquid', 'toothpaste', 'shampoo', 'fabric softener'],
};

const BASKET_CATEGORY_MAP: Record<string, string> = {
  produce: 'produce',
  fruit: 'produce',
  dairy: 'dairy',
  eggs: 'eggs',
  meat: 'meat',
  fish: 'fish',
  bakery: 'bakery',
  grains: 'pantry',
  oils: 'pantry',
  condiments: 'pantry',
  nuts: 'pantry',
  legumes: 'pantry',
  tinned: 'pantry',
  spices: 'pantry',
};

const FRESH_HERB_NAMES = new Set([
  'coriander', 'basil', 'parsley', 'mint', 'dill',
]);

function getBasketCategory(item: { category?: string | null; productName: string; normalizedName?: string | null }): string {
  const raw = (item.category || 'other').toLowerCase();
  if (raw === 'herbs') {
    const name = (item.normalizedName ?? item.productName).toLowerCase();
    return FRESH_HERB_NAMES.has(name) ? 'produce' : 'pantry';
  }
  return BASKET_CATEGORY_MAP[raw] ?? 'other';
}

const PANTRY_FAMILY_MAP: Record<string, string> = {
  'flour': 'flour',
  'plain flour': 'flour',
  'all purpose flour': 'flour',
  'bread flour': 'flour',
  'self raising flour': 'flour',
  'sugar': 'sugar',
  'caster sugar': 'sugar',
  'granulated sugar': 'sugar',
  'white sugar': 'sugar',
  'brown sugar': 'sugar',
  'icing sugar': 'sugar',
  'olive oil': 'olive_oil',
  'extra virgin olive oil': 'olive_oil',
  'olive oil spray': 'olive_oil',
  'chopped tomatoes': 'chopped_tomatoes',
  'tinned chopped tomatoes': 'chopped_tomatoes',
  'can chopped tomatoes': 'chopped_tomatoes',
  'tomato puree': 'tomato_puree',
  'garlic': 'garlic',
  'garlic clove': 'garlic',
  'garlic cloves': 'garlic',
  'lemon': 'lemon',
  'lemons': 'lemon',
  'tomato': 'tomato',
  'tomatoes': 'tomato',
  'plum tomato': 'tomato',
  'plum tomatoes': 'tomato',
  'cumin': 'cumin',
  'paprika': 'paprika',
  'soy sauce': 'soy_sauce',
  'pasta': 'pasta',
  'rice': 'rice',
};

const BLOCKING_MODIFIERS = [
  'self raising', 'bread', 'icing', 'brown', 'spray', 'paste', 'puree', 'powder', 'flakes', 'extra virgin',
];

const IGNORABLE_MODIFIERS = ['can', 'tinned', 'jar', 'pack'];

type PantryMergeProfile = { family: string; blockingModifiers: string[] };

function getPantryMergeProfile(name: string): PantryMergeProfile {
  const lower = name.toLowerCase().trim();
  let stripped = lower;
  // Strip accidental leading quantity (e.g. "1 lemon" → "lemon", "2 garlic cloves" → "garlic cloves")
  stripped = stripped.replace(/^\d+(?:\.\d+)?\s+/, '');
  for (const word of IGNORABLE_MODIFIERS) {
    stripped = stripped.replace(new RegExp(`\\b${word}\\b`, 'g'), '').replace(/\s+/g, ' ').trim();
  }
  const family = PANTRY_FAMILY_MAP[stripped] ?? PANTRY_FAMILY_MAP[lower] ?? normalizeIngredientKey(stripped);
  const blockingModifiers = BLOCKING_MODIFIERS.filter(m => lower.includes(m)).sort();
  return { family, blockingModifiers };
}

type PantryDisplayRow<T> = {
  primary: T;
  combinedSources: import('@shared/schema').IngredientSource[];
  combinedQtyValue: number | null;
  mergedCount: number;
};

function computePantryMergedRows<T extends { id: number; normalizedName?: string | null; productName: string; unit?: string | null; quantityValue?: number | null }>(
  items: T[],
  sourcesByItem: Map<number, import('@shared/schema').IngredientSource[]>,
): PantryDisplayRow<T>[] {
  const groups = new Map<string, PantryDisplayRow<T>>();
  for (const item of items) {
    const { family, blockingModifiers } = getPantryMergeProfile(item.normalizedName ?? item.productName);
    const key = `${family}|${blockingModifiers.join(',')}`;
    if (!groups.has(key)) {
      groups.set(key, {
        primary: item,
        combinedSources: [...(sourcesByItem.get(item.id) ?? [])],
        combinedQtyValue: item.quantityValue ?? null,
        mergedCount: 1,
      });
    } else {
      const row = groups.get(key)!;
      row.mergedCount++;
      const seenMealIds = new Set(row.combinedSources.map(s => s.mealId));
      for (const s of sourcesByItem.get(item.id) ?? []) {
        if (!seenMealIds.has(s.mealId)) {
          row.combinedSources.push(s);
          seenMealIds.add(s.mealId);
        }
      }
      if (item.unit === row.primary.unit && item.quantityValue != null && row.combinedQtyValue != null) {
        row.combinedQtyValue = row.combinedQtyValue + item.quantityValue;
      }
    }
  }
  return Array.from(groups.values());
}

const SUPERMARKET_NAMES = ['Tesco', "Sainsbury's", 'Asda', 'Morrisons', 'Aldi', 'Lidl', 'Waitrose', 'Marks & Spencer', 'Ocado'];

const TIER_LABELS: Record<string, { label: string; icon: typeof Tag; short: string }> = {
  budget: { label: 'Budget', icon: Tag, short: 'Bdgt' },
  standard: { label: 'Standard', icon: Layers, short: 'Std' },
  premium: { label: 'Premium', icon: Crown, short: 'Prem' },
  organic: { label: 'Organic', icon: Sprout, short: 'Org' },
};

const EXTENDED_TIER_LABELS: Record<string, { label: string; short: string }> = {
  budget: { label: 'Budget', short: 'Bdgt' },
  standard: { label: 'Standard', short: 'Std' },
  premium: { label: 'Premium', short: 'Prem' },
  organic: { label: 'Organic', short: 'Org' },
  bovaer_free: { label: 'Bovaer Free', short: 'BFr' },
  grass_finished: { label: 'Grass Finished', short: 'GFn' },
  pasture_raised: { label: 'Pasture Raised', short: 'PR' },
  sourdough: { label: 'Sourdough', short: 'Sdgh' },
  free_range: { label: 'Free Range', short: 'FR' },
};

const CATEGORY_TIER_OPTIONS: Record<string, string[]> = {
  meat: ['budget', 'standard', 'premium', 'organic', 'grass_finished', 'pasture_raised'],
  fish: ['budget', 'standard', 'premium', 'organic', 'grass_finished', 'pasture_raised'],
  dairy: ['budget', 'standard', 'premium', 'organic', 'bovaer_free'],
  eggs: ['budget', 'standard', 'premium', 'organic', 'free_range'],
  bakery: ['budget', 'standard', 'premium', 'organic', 'sourdough'],
  produce: ['budget', 'standard', 'premium', 'organic'],
  fruit: ['budget', 'standard', 'premium', 'organic'],
  grains: ['budget', 'standard', 'premium', 'organic'],
  herbs: ['budget', 'standard', 'premium', 'organic'],
  oils: ['budget', 'standard', 'premium', 'organic'],
  condiments: ['budget', 'standard', 'premium', 'organic'],
  nuts: ['budget', 'standard', 'premium', 'organic'],
  legumes: ['budget', 'standard', 'premium', 'organic'],
  tinned: ['budget', 'standard', 'premium', 'organic'],
  pantry: ['budget', 'standard', 'premium', 'organic'],
  other: ['budget', 'standard', 'premium', 'organic'],
};

type SortColumn = 'ingredient' | 'product' | 'category' | 'qty' | 'unit' | 'tier' | 'price' | 'shop' | 'smp' | 'meal';
type SortDirection = 'asc' | 'desc';
type PriceTier = 'budget' | 'standard' | 'premium' | 'organic';

interface EditState {
  itemId: number;
  field: 'productName' | 'quantityValue' | 'unit' | 'category';
  value: string;
}

const OPTIMIZER_OPTIONS: Record<string, { label: string; short: string }> = {
  no_upf: { label: 'No UPF', short: 'No UPF' },
  no_acidity_reg: { label: 'No Acidity Regulator', short: 'No Acid Reg' },
  no_emulsifiers: { label: 'No Emulsifiers', short: 'No Emuls' },
  no_high_risk: { label: 'No High-Risk Additives', short: 'No Hi-Risk' },
  bovaer_free: { label: 'Bovaer Free', short: 'Bovaer Free' },
  free_range: { label: 'Free Range', short: 'Free Range' },
  organic: { label: 'Organic', short: 'Organic' },
  grass_finished: { label: 'Grass Finished', short: 'Grass Fin' },
  pasture_raised: { label: 'Pasture Raised', short: 'Past Raised' },
};

const ADDITIVE_OPTION_KEYS = ['no_upf', 'no_acidity_reg', 'no_emulsifiers', 'no_high_risk'];

const PRODUCT_FAMILY_OPTIMIZER: Record<string, string[]> = {
  tomato: ['no_upf', 'no_acidity_reg', 'no_emulsifiers', 'no_high_risk'],
  passata: ['no_upf', 'no_acidity_reg', 'no_emulsifiers', 'no_high_risk'],
  chopped_tomatoes: ['no_upf', 'no_acidity_reg', 'no_emulsifiers', 'no_high_risk'],
  tomato_puree: ['no_upf', 'no_acidity_reg', 'no_high_risk'],
  sauce: ['no_upf', 'no_acidity_reg', 'no_emulsifiers', 'no_high_risk'],
  ketchup: ['no_upf', 'no_acidity_reg', 'no_emulsifiers', 'no_high_risk'],
  mayo: ['no_upf', 'no_emulsifiers', 'no_high_risk'],
  mayonnaise: ['no_upf', 'no_emulsifiers', 'no_high_risk'],
  mustard: ['no_upf', 'no_acidity_reg', 'no_high_risk'],
  soy_sauce: ['no_upf', 'no_high_risk'],
  stock: ['no_upf', 'no_high_risk'],
  broth: ['no_upf', 'no_high_risk'],
  milk: ['bovaer_free', 'organic', 'no_upf', 'no_high_risk'],
  cheese: ['bovaer_free', 'organic', 'no_upf', 'no_high_risk'],
  yoghurt: ['bovaer_free', 'organic', 'no_upf', 'no_high_risk'],
  yogurt: ['bovaer_free', 'organic', 'no_upf', 'no_high_risk'],
  cream: ['bovaer_free', 'organic', 'no_upf', 'no_high_risk'],
  butter: ['bovaer_free', 'organic', 'no_upf', 'no_high_risk'],
  egg: ['free_range', 'organic'],
  eggs: ['free_range', 'organic'],
  beef: ['grass_finished', 'pasture_raised', 'organic'],
  mince: ['grass_finished', 'pasture_raised', 'organic'],
  steak: ['grass_finished', 'pasture_raised', 'organic'],
  lamb: ['grass_finished', 'pasture_raised', 'organic'],
  chicken: ['grass_finished', 'pasture_raised', 'organic'],
  pork: ['grass_finished', 'pasture_raised', 'organic'],
};

const CATEGORY_OPTIMIZER_FALLBACK: Record<string, string[]> = {
  dairy: ['bovaer_free', 'organic', 'no_upf', 'no_high_risk'],
  eggs: ['free_range', 'organic'],
  meat: ['grass_finished', 'pasture_raised', 'organic'],
  condiments: ['no_upf', 'no_acidity_reg', 'no_emulsifiers', 'no_high_risk'],
  tinned: ['no_upf', 'no_acidity_reg', 'no_high_risk'],
};

const PRODUCT_FAMILY_KEYS_BY_SPECIFICITY = Object.keys(PRODUCT_FAMILY_OPTIMIZER)
  .sort((a, b) => b.length - a.length);

function getOptimizerOptions(normalizedName: string, category: string): string[] {
  const lower = normalizedName.toLowerCase().trim();
  const spaced = lower.replace(/_/g, ' ');
  for (const keyword of PRODUCT_FAMILY_KEYS_BY_SPECIFICITY) {
    const kw = keyword.replace(/_/g, ' ');
    if (spaced.includes(kw) || lower.includes(keyword)) return PRODUCT_FAMILY_OPTIMIZER[keyword];
  }
  return CATEGORY_OPTIMIZER_FALLBACK[category] || [];
}

function getOptimizerTriggerLabel(selections: string[]): string {
  if (selections.length === 0) return 'Default';
  if (selections.length === 1) return OPTIMIZER_OPTIONS[selections[0]]?.short || selections[0];
  const allAdditive = selections.every(s => ADDITIVE_OPTION_KEYS.includes(s));
  if (allAdditive && selections.length >= 2) return 'No Additives';
  return `${selections.length} rules`;
}

const BOVAER_CATEGORIES = ['dairy', 'milk', 'cheese', 'yoghurt', 'yogurt', 'cream', 'butter', 'beef', 'meat', 'steak', 'mince', 'burger'];

function isBovaerRisk(product: any): boolean {
  const name = (product.product_name || '').toLowerCase();
  const cats = (product.categories_tags || []).map((c: string) => c.toLowerCase());
  const allText = [name, ...cats].join(' ');
  return BOVAER_CATEGORIES.some(kw => allText.includes(kw));
}

function getVerdict(product: any): string {
  const smp = product.upfAnalysis?.thaRating ?? 0;
  const additives = product.upfAnalysis?.additiveMatches?.length ?? 0;
  const emulsifiers = product.upfAnalysis?.additiveMatches?.filter((a: any) => a.type === 'emulsifier').length ?? 0;
  const highRisk = product.upfAnalysis?.additiveMatches?.filter((a: any) => a.riskLevel === 'high').length ?? 0;
  const isUltra = product.analysis?.isUltraProcessed;
  if (smp >= 5) return "Excellent choice. Minimal processing with whole food ingredients.";
  if (smp >= 4) return "Good quality product with limited processing. A solid everyday choice.";
  if (smp >= 3) {
    if (emulsifiers > 0) return "Moderately processed. Contains emulsifiers that may affect gut health.";
    return "Average product with moderate processing. Acceptable for occasional use.";
  }
  if (smp >= 2) {
    if (highRisk > 0) return `Below average. Contains ${highRisk} high-risk additive${highRisk > 1 ? 's' : ''}. Consider a cleaner alternative.`;
    return `Below average quality. Contains ${additives} additive${additives > 1 ? 's' : ''}. Better options exist.`;
  }
  if (isUltra) return "Highly ultra-processed with multiple concerning additives. Strongly consider switching to a cleaner alternative.";
  return "Poor quality product with significant processing. Look for a healthier option.";
}

const ITEM_CATEGORIES = [
  { value: 'produce', label: 'Produce' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'meat', label: 'Meat' },
  { value: 'fish', label: 'Fish' },
  { value: 'grains', label: 'Grains' },
  { value: 'herbs', label: 'Herbs & Spices' },
  { value: 'oils', label: 'Oils' },
  { value: 'condiments', label: 'Condiments' },
  { value: 'nuts', label: 'Nuts & Seeds' },
  { value: 'legumes', label: 'Legumes' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'tinned', label: 'Tinned / Canned' },
  { value: 'pantry', label: 'Pantry' },
  { value: 'other', label: 'Other' },
];

function EditItemModal({ item, sources, onClose }: {
  item: ShoppingListItem;
  sources: IngredientSource[];
  onClose: () => void;
}) {
  const [name, setName] = useState(item.productName);
  const [qty, setQty] = useState(item.quantityValue != null ? String(item.quantityValue) : '');
  const [unit, setUnit] = useState(item.unit || '');
  const [category, setCategory] = useState(item.category || '');
  const [updateRecipe, setUpdateRecipe] = useState(sources.length > 0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const correction = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/shopping-list/${item.id}/correct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: name.trim() || undefined,
          quantityValue: qty !== '' ? Number(qty) : undefined,
          unit: unit.trim() || undefined,
          category: category || undefined,
          updateRecipe,
        }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<{ updated: boolean; recipesUpdated: number }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopping-list'] });
      if (data.recipesUpdated > 0) {
        queryClient.invalidateQueries({ queryKey: ['/api/meals'] });
        toast({ title: "Saved", description: `Basket updated. ${data.recipesUpdated} recipe${data.recipesUpdated > 1 ? 's' : ''} also corrected.` });
      } else {
        toast({ title: "Saved", description: "Basket updated." });
      }
      onClose();
    },
    onError: () => {
      toast({ title: "Could not save", description: "Please try again.", variant: "destructive" });
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit ingredient</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label htmlFor="edit-item-name" className="text-xs font-medium">Name</Label>
            <Input
              id="edit-item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ingredient name"
              data-testid="input-edit-item-name"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="edit-item-qty" className="text-xs font-medium">Quantity</Label>
              <Input
                id="edit-item-qty"
                type="number"
                min="0"
                step="any"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="e.g. 1"
                data-testid="input-edit-item-qty"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="edit-item-unit" className="text-xs font-medium">Unit</Label>
              <Input
                id="edit-item-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. jar, g, tbsp"
                data-testid="input-edit-item-unit"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-item-category" className="text-xs font-medium">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="edit-item-category" data-testid="select-edit-item-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {ITEM_CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {sources.length > 0 && (
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5 bg-muted/30">
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-sm font-medium">Update recipe too</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {sources.map(s => s.mealName).join(', ')}
                </p>
              </div>
              <Switch checked={updateRecipe} onCheckedChange={setUpdateRecipe} data-testid="switch-edit-update-recipe" />
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} data-testid="button-edit-item-cancel">Cancel</Button>
          <Button onClick={() => correction.mutate()} disabled={correction.isPending || !name.trim()} data-testid="button-edit-item-save">
            {correction.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getCurrentProductInsight(item: ShoppingListItem): { headline: string; detail: string } {
  const rating = item.thaRating;
  const isWF = item.itemType === 'whole_food';
  const cat = item.category || 'other';

  if (isWF) {
    return {
      headline: 'Already a whole food',
      detail: 'This ingredient is a whole or minimally processed food - no additives, no unnecessary processing. About as good as it gets.',
    };
  }
  if (rating === null || rating === undefined) {
    return {
      headline: 'Not yet scored',
      detail: 'This item hasn\'t been matched to a product yet. Use the cleaner shop options below to find and score a specific product.',
    };
  }
  if (rating >= 5) {
    return {
      headline: 'Top of its class',
      detail: 'Minimal processing and a clean ingredient profile. This is a strong packaged choice.',
    };
  }
  if (rating >= 4) {
    const catNote: Record<string, string> = {
      dairy: 'Dairy products at this level typically contain few or no stabilisers.',
      grains: 'A reasonably clean grain product - fewer emulsifiers and dough improvers than lower-rated options.',
      condiments: 'A good sauce or condiment with limited additives and a shorter ingredient list.',
    };
    return {
      headline: 'A good packaged option',
      detail: catNote[cat] || 'Limited processing with a relatively short and recognisable ingredient list.',
    };
  }
  if (rating >= 3) {
    const catNote: Record<string, string> = {
      grains: 'Packaged grain products at this level commonly contain emulsifiers like E471 or E472 and dough conditioners.',
      condiments: 'Mid-range sauces and dressings often use stabilisers, modified starches, and added sugars to improve shelf life.',
      dairy: 'Processed dairy at this level may contain thickeners, modified starches, or artificial flavouring.',
      bakery: 'Most shop bread contains dough improvers, emulsifiers, and sometimes preservatives at this score.',
    };
    return {
      headline: 'Average quality',
      detail: catNote[cat] || 'Moderate processing. Worth checking the ingredient list for emulsifiers, stabilisers, or modified starches.',
    };
  }
  if (rating >= 2) {
    return {
      headline: 'Below average',
      detail: 'This product likely contains several additives and significant processing. A cleaner packaged option or a whole-food route would be a clear improvement.',
    };
  }
  return {
    headline: 'Highly processed',
    detail: 'This product scores poorly due to heavy processing and a complex additive profile. Both the cleaner shop option and the whole-food route below are worth considering.',
  };
}


function ProductAnalyseModal({ open, onOpenChange, item, preferredStore }: { open: boolean; onOpenChange: (v: boolean) => void; item: ShoppingListItem; preferredStore?: string }) {
  const [searchQuery, setSearchQuery] = useState(item.productName);
  const [products, setProducts] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [showCurrentDetail, setShowCurrentDetail] = useState(false);
  const [knowledgeSlug, setKnowledgeSlug] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [hideUltraProcessed, setHideUltraProcessed] = useState(false);
  const [hideHighRiskAdditives, setHideHighRiskAdditives] = useState(false);
  const [hideEmulsifiers, setHideEmulsifiers] = useState(false);
  const [hideAcidityRegulators, setHideAcidityRegulators] = useState(false);
  const [hideBovaer, setHideBovaer] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [badAppleProduct, setBadAppleProduct] = useState<any>(null);
  const [showWFRecipe, setShowWFRecipe] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addWFToBasket = useMutation({
    mutationFn: async (ingredients: string[]) => {
      for (const ing of ingredients) {
        await apiRequest("POST", "/api/shopping-list/extras", { name: ing, category: "other" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopping-list/extras'] });
      toast({ title: "Added to basket", description: "Wholefood recipe ingredients added to your basket." });
    },
    onError: () => {
      toast({ title: "Failed to add", description: "Could not add ingredients to basket.", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (open && item.productName) {
      setSearchQuery(item.productName);
      doSearch(item.productName);
    }
  }, [open, item.productName]);

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search-products?q=${encodeURIComponent(q.trim())}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      toast({ title: "Search failed", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectProduct = (product: any) => {
    const thaRating = product.upfAnalysis?.thaRating ?? 0;
    const additives = product.upfAnalysis?.additiveMatches?.length ?? 0;
    const nova = product.nova_group ?? null;
    if (thaRating <= 1 || (nova === 4 && additives > 5)) {
      setBadAppleProduct(product);
      return;
    }
    doSelectProduct(product);
  };

  const doSelectProduct = async (product: any) => {
    try {
      const url = buildUrl(api.shoppingList.update.path, { id: item.id });
      const productDisplayName = [product.brand, product.product_name].filter(Boolean).join(' - ');
      const storesArray: string[] = product.availableStores || [];
      const productThaRating = product.upfAnalysis?.thaRating ?? null;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productDisplayName || product.product_name || item.productName,
          matchedProductId: product.barcode || null,
          matchedStore: product.availableStores?.[0] || null,
          matchedPrice: null,
          availableStores: storesArray.length > 0 ? JSON.stringify(storesArray) : null,
          thaRating: productThaRating,
        }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update');
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.prices.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      toast({ title: "Product selected", description: `Selected "${productDisplayName || product.product_name}" for ${capitalizeWords(item.productName)}` });
      onOpenChange(false);
    } catch {
      toast({ title: "Failed to save selection", variant: "destructive" });
    }
  };

  const getNutriScoreColor = (grade: string | null) => {
    switch (grade?.toLowerCase()) {
      case 'a': return 'bg-green-600 text-white';
      case 'b': return 'bg-green-400 text-white';
      case 'c': return 'bg-yellow-400 text-black';
      case 'd': return 'bg-orange-400 text-white';
      case 'e': return 'bg-red-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getNovaColor = (nova: number | null) => {
    switch (nova) {
      case 1: return 'bg-green-600 text-white';
      case 2: return 'bg-yellow-400 text-black';
      case 3: return 'bg-orange-400 text-white';
      case 4: return 'bg-red-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (hideUltraProcessed && p.analysis?.isUltraProcessed) return false;
      if (hideHighRiskAdditives && p.upfAnalysis?.additiveMatches?.some((a: any) => a.riskLevel === 'high')) return false;
      if (hideEmulsifiers && p.upfAnalysis?.additiveMatches?.some((a: any) => a.type === 'emulsifier')) return false;
      if (hideAcidityRegulators && p.upfAnalysis?.additiveMatches?.some((a: any) => a.type === 'acidity regulator' || a.type === 'acidity_regulator')) return false;
      if (hideBovaer && isBovaerRisk(p)) return false;
      if (minRating > 0 && (p.upfAnalysis?.thaRating ?? 0) < minRating) return false;
      return true;
    });
  }, [products, hideUltraProcessed, hideHighRiskAdditives, hideEmulsifiers, hideAcidityRegulators, hideBovaer, minRating]);

  const activeFilterCount = [hideUltraProcessed, hideHighRiskAdditives, hideEmulsifiers, hideAcidityRegulators, hideBovaer, minRating > 0].filter(Boolean).length;

  const insight = getCurrentProductInsight(item);
  const rankedChoices = useMemo(
    () => rankChoices(products, item.thaRating ?? null, preferredStore).slice(0, 3),
    [products, item.thaRating, preferredStore]
  );
  const wholeFoodAlt = useMemo(() => getWholeFoodAlternative(item.productName), [item.productName]);
  const isWholeFood_ = item.itemType === 'whole_food';

  const ratingColor = (r: number | null) => {
    if (!r) return 'text-muted-foreground';
    if (r >= 4) return 'text-green-600 dark:text-green-400';
    if (r >= 3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-500 dark:text-red-400';
  };

  const SectionHeader = ({ icon: Icon, label, color }: { icon: any; label: string; color: string }) => (
    <div className={`flex items-center gap-1.5 mb-2`}>
      <Icon className={`h-3.5 w-3.5 ${color}`} />
      <span className={`text-[10px] uppercase tracking-[0.12em] ${color}`}>{label}</span>
    </div>
  );

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-1">
          {/* ── 1. Product header + score + quick verdict ─────────────── */}
          <div className="flex items-start gap-3" data-testid="section-product-header">
            <Microscope className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base leading-snug">{capitalizeWords(item.productName)}</DialogTitle>
              <p className={`text-xs font-medium mt-0.5 ${ratingColor(item.thaRating ?? null)}`}>
                {insight.headline}
              </p>
            </div>
            <ScoreBadge score={item.thaRating ?? 0} size={32} />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">

          {/* ── 2. Why this scores the way it does ─────────────────────── */}
          <div data-testid="section-why-score">
            <SectionHeader icon={Info} label="Why this scores the way it does" color="text-muted-foreground" />
            <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 space-y-2">
              <p className="text-xs leading-relaxed text-foreground/90">
                The Healthy Apples score is based on something simple that helped our family:
              </p>
              <p className="text-xs leading-relaxed text-foreground/90">
                looking at ingredients and asking - are these foods we recognise, or are they more industrial additions?
              </p>
              <p className="text-xs leading-relaxed text-foreground/90">
                The closer a product is to real, familiar ingredients, the higher it scores.
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                You can also go further - filtering out specific additives or E-numbers to match what works best for you.
              </p>
            </div>
          </div>

          {/* ── 3. Current Product ──────────────────────────────────────── */}
          <div data-testid="section-current-product">
            <SectionHeader icon={Package} label="Current product" color="text-muted-foreground" />
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm leading-snug">{capitalizeWords(item.productName)}</p>
                    <p className={`text-xs font-medium mt-0.5 ${ratingColor(item.thaRating ?? null)}`}>
                      {insight.headline}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ScoreBadge score={item.thaRating ?? 0} size={28} />
                    <button
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowCurrentDetail(v => !v)}
                      data-testid="button-toggle-current-detail"
                    >
                      {showCurrentDetail ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{insight.detail}</p>
                {showCurrentDetail && (
                  <div className="mt-3 pt-3 border-t border-border/60 space-y-1.5" data-testid="section-current-detail">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {item.category && (
                        <Badge variant="outline" className="text-[10px] capitalize">{item.category}</Badge>
                      )}
                      {isWholeFood_ && (
                        <Badge className="text-[10px] bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800 no-default-hover-elevate">
                          <Leaf className="h-2.5 w-2.5 mr-1" />Whole food
                        </Badge>
                      )}
                      {item.itemType === 'packaged' && item.thaRating !== null && item.thaRating <= 2 && (
                        <Badge className="text-[10px] bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 no-default-hover-elevate">
                          Worth reconsidering
                        </Badge>
                      )}
                    </div>
                    {item.matchedStore && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Store className="h-3 w-3" />Stocked at: {item.matchedStore}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── 4. Cleaner shop option ──────────────────────────────────── */}
          <div data-testid="section-cleaner-shop">
            <div className="flex items-center justify-between mb-2">
              <SectionHeader icon={ShoppingCart} label="Cleaner shop option" color="text-blue-500 dark:text-blue-400" />
              {preferredStore && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Store className="h-2.5 w-2.5" />{preferredStore} first
                </span>
              )}
            </div>
            {isSearching ? (
              <Card className="border-border/60">
                <CardContent className="p-4 flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                  <span className="text-xs">Searching for alternatives…</span>
                </CardContent>
              </Card>
            ) : isWholeFood_ ? (
              <Card className="border-border/60 bg-muted/30">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">This is already a whole food - any packaged version would be a step down, not up.</p>
                </CardContent>
              </Card>
            ) : rankedChoices.length > 0 ? (
              <div className="space-y-2">
                {rankedChoices.map((choice, idx) => {
                  const whyBetter = buildWhyBetter(choice, item.thaRating ?? null);
                  return (
                    <Card key={choice.barcode || idx} className="border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20" data-testid={`card-cleaner-shop-${idx}`}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm leading-snug truncate">{choice.product_name}</p>
                            {choice.brand && <p className="text-xs text-muted-foreground">{choice.brand}</p>}
                            {whyBetter.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {whyBetter.map((reason, i) => (
                                  <Badge key={i} className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 no-default-hover-elevate">
                                    <Sparkles className="h-2.5 w-2.5 mr-1" />
                                    {reason}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {choice.availableStores && choice.availableStores.length > 0 && (
                              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                <Store className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                {choice.availableStores.map((s: string) => (
                                  <Badge key={s} variant="outline" className="text-[10px] no-default-hover-elevate">{s}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <ScoreBadge score={choice.upfAnalysis?.thaRating ?? 0} size={26} />
                            <Button size="sm" className="h-7 text-xs" onClick={() => handleSelectProduct(choice)} data-testid={`button-select-cleaner-shop-${idx}`}>
                              <Check className="h-3 w-3 mr-1" />
                              Select
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : products.length > 0 ? (
              <Card className="border-border/60 bg-muted/30">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">No clearly better packaged alternative found - try refining by ingredients below.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/60 bg-muted/30">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">No search results yet.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── 5. Whole-food / from-scratch option ─────────────────────── */}
          <div data-testid="section-wholefood">
            <SectionHeader icon={ChefHat} label="Whole-food / from-scratch option" color="text-green-600 dark:text-green-400" />
            {wholeFoodAlt ? (
              <Card className="border-green-200 dark:border-green-800 bg-green-50/40 dark:bg-green-950/20" data-testid="card-wholefood-alternative">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm flex items-center gap-1.5">
                        <span>{wholeFoodAlt.emoji}</span>
                        {wholeFoodAlt.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${effortColor(wholeFoodAlt.effort)}`}>
                        {effortLabel(wholeFoodAlt.effort)}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {formatTime(wholeFoodAlt.timeMinutes)}
                      </span>
                    </div>
                  </div>
                  {showWFRecipe && (
                    <>
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Ingredients</p>
                        <ul className="space-y-0.5">
                          {wholeFoodAlt.ingredients.map((ing, i) => (
                            <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                              <span className="text-muted-foreground mt-0.5 flex-shrink-0">·</span>
                              {ing}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Method</p>
                        <p className="text-xs leading-relaxed">{wholeFoodAlt.method}</p>
                      </div>
                      {wholeFoodAlt.tip && (
                        <p className="text-xs text-muted-foreground italic leading-relaxed border-t border-green-200 dark:border-green-800 pt-2">
                          {wholeFoodAlt.tip}
                        </p>
                      )}
                    </>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs px-3 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 hover:text-green-800 dark:hover:text-green-300"
                      onClick={() => setShowWFRecipe(v => !v)}
                      data-testid="button-view-wf-recipe"
                    >
                      <ChefHat className="h-3 w-3 mr-1" />
                      {showWFRecipe ? 'Hide recipe' : 'View recipe'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs px-3 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 hover:text-green-800 dark:hover:text-green-300"
                      onClick={() => addWFToBasket.mutate(wholeFoodAlt.ingredients)}
                      disabled={addWFToBasket.isPending}
                      data-testid="button-add-wf-to-basket"
                    >
                      {addWFToBasket.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <ShoppingCart className="h-3 w-3 mr-1" />}
                      Add to basket
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/60 bg-muted/30">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">No whole-food route mapped for this item yet.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── 6. Compare your options ─────────────────────────────────── */}
          {(rankedChoices.length > 0 || wholeFoodAlt) && (
            <div data-testid="section-compare-options">
              <SectionHeader icon={Sparkles} label="Compare your options" color="text-primary" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Current */}
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2" data-testid="compare-card-current">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">Current</p>
                  <div className="flex items-center gap-2">
                    <ScoreBadge score={item.thaRating ?? 0} size={22} />
                    <span className="text-xs font-medium truncate">{capitalizeWords(item.productName)}</span>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between"><span>Effort</span><span className="font-medium text-foreground">None</span></div>
                    <div className="flex justify-between"><span>Convenience</span><span className="font-medium text-foreground">High</span></div>
                    <div className="flex justify-between"><span>Ingredients</span><span className={`font-medium ${(item.thaRating ?? 0) >= 4 ? 'text-green-600' : (item.thaRating ?? 0) >= 3 ? 'text-yellow-600' : 'text-red-500'}`}>{(item.thaRating ?? 0) >= 4 ? 'Clean' : (item.thaRating ?? 0) >= 3 ? 'Mixed' : 'Industrial'}</span></div>
                  </div>
                </div>
                {/* Cleaner shop option */}
                {rankedChoices.length > 0 && (
                  <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20 p-3 space-y-2" data-testid="compare-card-shop">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-blue-500 dark:text-blue-400">Cleaner shop option</p>
                    <div className="flex items-center gap-2">
                      <ScoreBadge score={rankedChoices[0].upfAnalysis?.thaRating ?? 0} size={22} />
                      <span className="text-xs font-medium truncate">{rankedChoices[0].product_name}</span>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between"><span>Effort</span><span className="font-medium text-foreground">Low</span></div>
                      <div className="flex justify-between"><span>Convenience</span><span className="font-medium text-foreground">High</span></div>
                      <div className="flex justify-between"><span>Ingredients</span><span className="font-medium text-green-600 dark:text-green-400">Cleaner</span></div>
                    </div>
                  </div>
                )}
                {/* Whole-food option */}
                {wholeFoodAlt && (
                  <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/20 p-3 space-y-2" data-testid="compare-card-wholefood">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-green-600 dark:text-green-400">Whole-food option</p>
                    <div className="flex items-center gap-2">
                      <ScoreBadge score={5} size={22} />
                      <span className="text-xs font-medium truncate">{wholeFoodAlt.title}</span>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between"><span>Effort</span><span className="font-medium text-foreground">{effortLabel(wholeFoodAlt.effort)}</span></div>
                      <div className="flex justify-between"><span>Convenience</span><span className="font-medium text-foreground">Low</span></div>
                      <div className="flex justify-between"><span>Ingredients</span><span className="font-medium text-green-600 dark:text-green-400">Real</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 7. Refine by ingredients ────────────────────────────────── */}
          <div data-testid="section-refine">
            <button
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-left py-1"
              onClick={() => setShowBrowse(!showBrowse)}
              data-testid="button-toggle-browse"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="font-medium">Refine by ingredients</span>
              {products.length > 0 && <span className="text-muted-foreground/70">({products.length} products found)</span>}
              {showBrowse ? <ChevronUp className="h-3.5 w-3.5 ml-auto" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto" />}
            </button>
            <AnimatePresence>
              {showBrowse && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') doSearch(searchQuery); }}
                        placeholder="Search products…"
                        className="flex-1 h-8 text-sm"
                        data-testid="input-analyse-search"
                      />
                      <Button size="sm" onClick={() => doSearch(searchQuery)} disabled={isSearching} className="h-8" data-testid="button-analyse-search">
                        {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant={showFilters ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setShowFilters(!showFilters)}
                        className="h-8 w-8 relative flex-shrink-0"
                        data-testid="button-analyse-toggle-filters"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        {activeFilterCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                            {activeFilterCount}
                          </span>
                        )}
                      </Button>
                    </div>
                    <AnimatePresence>
                      {showFilters && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <Card data-testid="card-analyse-filters">
                            <CardContent className="pt-3 pb-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="flex items-center justify-between gap-2">
                                  <Label htmlFor="analyse-hide-upf" className="text-xs cursor-pointer">Avoid industrial ingredients</Label>
                                  <Switch id="analyse-hide-upf" checked={hideUltraProcessed} onCheckedChange={setHideUltraProcessed} data-testid="switch-analyse-hide-upf" />
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <Label htmlFor="analyse-hide-additives" className="text-xs cursor-pointer">Avoid specific additives</Label>
                                  <Switch id="analyse-hide-additives" checked={hideHighRiskAdditives} onCheckedChange={setHideHighRiskAdditives} data-testid="switch-analyse-hide-additives" />
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <Label htmlFor="analyse-hide-emulsifiers" className="text-xs cursor-pointer">Avoid emulsifiers</Label>
                                  <Switch id="analyse-hide-emulsifiers" checked={hideEmulsifiers} onCheckedChange={setHideEmulsifiers} data-testid="switch-analyse-hide-emulsifiers" />
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <Label htmlFor="analyse-hide-acidity" className="text-xs cursor-pointer">Avoid acidity regulators</Label>
                                  <Switch id="analyse-hide-acidity" checked={hideAcidityRegulators} onCheckedChange={setHideAcidityRegulators} data-testid="switch-analyse-hide-acidity" />
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <Label htmlFor="analyse-hide-bovaer" className="text-xs cursor-pointer">Avoid Bovaer-risk products</Label>
                                  <Switch id="analyse-hide-bovaer" checked={hideBovaer} onCheckedChange={setHideBovaer} data-testid="switch-analyse-hide-bovaer" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Minimum THA score</Label>
                                  <div className="flex items-center gap-1">
                                    {[0, 1, 2, 3, 4, 5].map(r => (
                                      <Button key={r} size="sm" variant={minRating === r ? 'default' : 'outline'} onClick={() => setMinRating(r)} className="h-6 px-2 text-xs" data-testid={`button-analyse-min-rating-${r}`}>
                                        {r === 0 ? 'All' : r}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              {activeFilterCount > 0 && products.length > 0 && (
                                <p className="text-[10px] text-muted-foreground mt-2">
                                  Showing {filteredProducts.length} of {products.length} products
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!isSearching && filteredProducts.length === 0 && products.length > 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        <Filter className="h-6 w-6 mx-auto mb-1 opacity-30" />
                        <p className="text-xs">All products filtered out - adjust your filters</p>
                      </div>
                    )}
                    {filteredProducts.map((product, idx) => {
                      const thaRating = product.upfAnalysis?.thaRating ?? 0;
                      const additiveCount = product.upfAnalysis?.additiveMatches?.length ?? 0;
                      const emulsifierCount = product.upfAnalysis?.additiveMatches?.filter((a: any) => a.type === 'emulsifier').length ?? 0;
                      const highRiskCount = product.upfAnalysis?.additiveMatches?.filter((a: any) => a.riskLevel === 'high').length ?? 0;
                      const verdict = getVerdict(product);
                      return (
                        <Card key={`${product.barcode}-${idx}`} className="overflow-visible" data-testid={`card-analyse-product-${idx}`}>
                          <CardContent className="p-3">
                            <div className="flex gap-3">
                              {product.image_url && (
                                <img src={product.image_url} alt={product.product_name} className="w-12 h-12 rounded object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="font-medium text-xs truncate">{product.product_name}</p>
                                    {product.brand && <p className="text-[10px] text-muted-foreground">{product.brand}</p>}
                                  </div>
                                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    <ScoreBadge score={thaRating} size={22} />
                                    <Button size="sm" className="h-6 text-xs px-2" onClick={() => handleSelectProduct(product)} data-testid={`button-select-product-${idx}`}>
                                      <Check className="h-3 w-3 mr-1" />Select
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                  {product.nutriscore_grade && (
                                    <Badge className={`text-[10px] ${getNutriScoreColor(product.nutriscore_grade)} no-default-hover-elevate`}>NS {product.nutriscore_grade.toUpperCase()}</Badge>
                                  )}
                                  {product.nova_group && (
                                    <Badge className={`text-[10px] ${getNovaColor(product.nova_group)} no-default-hover-elevate`}>NOVA {product.nova_group}</Badge>
                                  )}
                                  {additiveCount > 0 && (
                                    <Badge variant="outline" className={`text-[10px] ${additiveCount > 3 ? 'text-red-500 border-red-300' : 'text-orange-500 border-orange-300'} no-default-hover-elevate`}>
                                      {additiveCount} additives
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1 italic leading-relaxed">{verdict}</p>
                                {product.upfAnalysis?.additiveMatches?.length > 0 && (
                                  <div className="mt-1.5">
                                    <Button variant="ghost" size="sm" className="text-[10px] h-5 px-1.5 text-muted-foreground" onClick={() => setExpandedProduct(expandedProduct === product.barcode ? null : product.barcode)} data-testid={`button-toggle-additives-${idx}`}>
                                      <FlaskConical className="h-2.5 w-2.5 mr-1" />
                                      {product.upfAnalysis.additiveMatches.length} additive{product.upfAnalysis.additiveMatches.length > 1 ? 's' : ''}
                                      {expandedProduct === product.barcode ? <ChevronUp className="h-2.5 w-2.5 ml-1" /> : <ChevronDown className="h-2.5 w-2.5 ml-1" />}
                                    </Button>
                                    {expandedProduct === product.barcode && (
                                      <div className="mt-1 space-y-1 pl-2 border-l-2 border-border">
                                        {product.upfAnalysis.additiveMatches.map((additive: any, aIdx: number) => (
                                          <div key={aIdx} className="text-xs flex items-center gap-1.5">
                                            <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${additive.riskLevel === 'high' ? 'bg-red-500' : additive.riskLevel === 'moderate' ? 'bg-orange-400' : additive.riskLevel === 'low' ? 'bg-yellow-400' : 'bg-green-400'}`} />
                                            <span className="font-medium">{additive.name}</span>
                                            <button
                                              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
                                              onClick={() => setKnowledgeSlug(additive.type.toLowerCase().replace(/[\s_]+/g, '-'))}
                                              data-testid={`button-fk-${additive.type}`}
                                            >
                                              <span>({additive.type})</span>
                                              <Info className="h-2.5 w-2.5" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    {badAppleProduct && (
      <BadAppleWarningModal
        open={!!badAppleProduct}
        onOpenChange={(v) => { if (!v) setBadAppleProduct(null); }}
        productName={badAppleProduct.product_name}
        riskSummary={{
          additiveCount: badAppleProduct.upfAnalysis?.additiveMatches?.length ?? 0,
          emulsifierCount: badAppleProduct.upfAnalysis?.additiveMatches?.filter((a: any) => a.type === 'emulsifier').length ?? 0,
          highRiskCount: badAppleProduct.upfAnalysis?.additiveMatches?.filter((a: any) => a.riskLevel === 'high').length ?? 0,
          novaGroup: badAppleProduct.nova_group ?? null,
          isUltraProcessed: badAppleProduct.analysis?.isUltraProcessed ?? false,
          upfScore: badAppleProduct.upfAnalysis?.upfScore ?? 0,
        }}
        onFindBetter={() => {
          setBadAppleProduct(null);
          setMinRating(3);
          setShowFilters(true);
          setShowBrowse(true);
        }}
        onAddAnyway={() => {
          doSelectProduct(badAppleProduct);
          setBadAppleProduct(null);
        }}
      />
    )}
    <FoodKnowledgeModal slug={knowledgeSlug} onClose={() => setKnowledgeSlug(null)} />
    </>
  );
}

export default function ShoppingListPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const search = useSearch();

  useEffect(() => {
    document.title = "Basket \u2013 The Healthy Apples";
    return () => { document.title = "The Healthy Apples"; };
  }, []);

  const [sortColumn, setSortColumn] = useState<SortColumn | null>('ingredient');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editState, setEditState] = useState<EditState | null>(null);
  const [comparisonItem, setComparisonItem] = useState<ShoppingListItem | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportSupermarket, setExportSupermarket] = useState<string>('Tesco');
  const [basketDialogOpen, setBasketDialogOpen] = useState(false);
  const [basketSending, setBasketSending] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [globalStore, setGlobalStore] = useState<string>(() => {
    try { return new URLSearchParams(window.location.search).get("store") || 'auto'; } catch { return 'auto'; }
  });
  const [analyseItem, setAnalyseItem] = useState<ShoppingListItem | null>(null);
  const [correctItem, setCorrectItem] = useState<ShoppingListItem | null>(null);
  const [optimizerSelections, setOptimizerSelections] = useState<Record<number, string[]>>({});
  const [splitByShop, setSplitByShop] = useState(false);

  const [selectedRetailers, setSelectedRetailers] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("tha-basket-retailers") || '["Tesco","Sainsbury\'s","Asda"]'); } catch { return ["Tesco", "Sainsbury's", "Asda"]; }
  });
  const [globalBasketTier, setGlobalBasketTier] = useState<PriceTier | "item">(() => {
    return (localStorage.getItem("tha-basket-tier") as PriceTier | "item") || "item";
  });

  const [categoryDefaults, setCategoryDefaultsState] = useState<Record<string, { supermarket: string; tier: string }>>(() => {
    try { return JSON.parse(localStorage.getItem("tha-basket-category-defaults") || '{}'); } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem("tha-basket-retailers", JSON.stringify(selectedRetailers));
  }, [selectedRetailers]);

  useEffect(() => {
    localStorage.setItem("tha-basket-tier", globalBasketTier);
  }, [globalBasketTier]);

  useEffect(() => {
    localStorage.setItem("tha-basket-category-defaults", JSON.stringify(categoryDefaults));
  }, [categoryDefaults]);

  const toggleRetailer = (name: string) => {
    setSelectedRetailers(prev => {
      if (prev.includes(name)) {
        if (prev.length <= 1) return prev;
        return prev.filter(r => r !== name);
      }
      return [...prev, name];
    });
  };

  const getCategoryDefault = useCallback((cat: string): { supermarket: string; tier: string } => {
    const saved = categoryDefaults[cat];
    const defaultTier = globalBasketTier !== "item" ? globalBasketTier : "standard";
    return {
      supermarket: saved?.supermarket ?? '',
      tier: saved?.tier ?? defaultTier,
    };
  }, [categoryDefaults, globalBasketTier]);

  const setCategoryDefault = useCallback((cat: string, field: 'supermarket' | 'tier', value: string) => {
    setCategoryDefaultsState(prev => {
      const current = prev[cat] ?? { supermarket: '', tier: globalBasketTier !== "item" ? globalBasketTier : "standard" };
      return { ...prev, [cat]: { ...current, [field]: value } };
    });
  }, [globalBasketTier]);

  const getEffectiveTier = (item: ShoppingListItem): PriceTier => {
    const catTier = getCategoryDefault(item.category || 'other').tier;
    return (item.selectedTier as PriceTier) || (catTier as PriceTier) || currentTier;
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isFullscreen]);

  const measurementPref = (user?.measurementPreference as 'metric' | 'imperial') || 'metric';
  const currentTier = (user?.preferredPriceTier as PriceTier) || 'standard';

  // Determine if we're viewing a specific quick-list basket (from ?quickList= URL param).
  // This is computed once at mount from the URL so it is stable for the component lifetime.
  const quickListLabel = useMemo(() => {
    try { return new URLSearchParams(search).get("quickList") || null; } catch { return null; }
  }, [search]);

  const { data: savedItems_raw = [], isLoading: loadingSaved } = useQuery<ShoppingListItemExtended[]>({
    queryKey: [api.shoppingList.list.path],
  });
  // In quick-list mode show only the items for that basket.
  // In normal mode exclude all quick-list items so they never contaminate the main basket.
  const savedItems = useMemo(
    () => quickListLabel
      ? savedItems_raw.filter(i => i.basketLabel === quickListLabel)
      : savedItems_raw.filter(i => !i.basketLabel?.startsWith("quick_list")),
    [savedItems_raw, quickListLabel],
  );

  const { data: householdData } = useQuery<{ id: number; name: string; members?: unknown[] }>({
    queryKey: ['/api/household'],
  });

  const { data: allPriceMatches = [] } = useQuery<ProductMatch[]>({
    queryKey: [api.shoppingList.prices.path],
  });

  const { data: ingredientSources = [] } = useQuery<IngredientSource[]>({
    queryKey: [api.shoppingList.sources.path],
  });

  const { data: freezerMeals = [] } = useQuery<FreezerMeal[]>({
    queryKey: ['/api/freezer'],
  });

  const { data: pantryItems = [] } = useQuery<{ id: number; ingredientKey: string }[]>({
    queryKey: ['/api/pantry'],
  });

  const pantryKeySet = useMemo(() => {
    return new Set(pantryItems.map(p => p.ingredientKey));
  }, [pantryItems]);

  const { data: shoppingExtras = [] } = useQuery<{ id: number; name: string; category: string; alwaysAdd: boolean; inBasket: boolean }[]>({
    queryKey: ['/api/shopping-list/extras'],
  });

  const deleteExtraMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/shopping-list/extras/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/shopping-list/extras'] }),
  });

  const addExtraMutation = useMutation({
    mutationFn: ({ name, category, alwaysAdd }: { name: string; category: string; alwaysAdd?: boolean }) =>
      apiRequest("POST", "/api/shopping-list/extras", { name, category, alwaysAdd }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/shopping-list/extras'] }),
  });

  const updateExtraMutation = useMutation({
    mutationFn: ({ id, alwaysAdd, inBasket }: { id: number; alwaysAdd?: boolean; inBasket?: boolean }) =>
      apiRequest("PATCH", `/api/shopping-list/extras/${id}`, { alwaysAdd, inBasket }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/shopping-list/extras'] }),
  });

  const [neededThisWeek, setNeededThisWeek] = useState<Set<number>>(new Set());
  const [staplesOpen, setStaplesOpen] = useState(false);
  const [thaPicks, setThaPicks] = useState<Record<string, IngredientProduct[]>>({});
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [addItemInput, setAddItemInput] = useState('');
  const [alwaysAddModal, setAlwaysAddModal] = useState<{ extraId: number; extraName: string } | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const collapsedInitRef = useRef(false);
  const [viewMode, setViewMode] = useState<"basket" | "shop">(() => {
    try { return new URLSearchParams(window.location.search).get("shopMode") === "1" ? "shop" : "basket"; } catch { return "basket"; }
  });
  // shopModeOpen kept so the inline ShopModeView section compiles until it is removed in a later step.
  const [shopModeOpen, setShopModeOpen] = useState(false);
  const prevExtrasLenRef = useRef(0);

  const toggleNeededThisWeek = (id: number) => {
    setNeededThisWeek(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const isStaple = (item: ShoppingListItem) => {
    const key = normalizeIngredientKey((item as any).ingredientName ?? (item as any).name ?? item.normalizedName ?? item.productName ?? '');
    return pantryKeySet.has(key) && !neededThisWeek.has(item.id);
  };

  const isHousehold = (item: ShoppingListItem) => (item.category || '').toLowerCase() === 'household';

  const toggleCollapsed = useCallback((cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }, []);

  const handleAddItem = useCallback(async (name: string, basketCategory: string) => {
    if (!name.trim()) return;
    const extraCategory = basketCategory === 'household' ? 'household'
      : basketCategory === 'pantry' ? 'larder'
      : basketCategory;
    await addExtraMutation.mutateAsync({ name: name.trim(), category: extraCategory });
    const pantryCategory = basketCategory === 'household' ? 'household' : 'larder';
    try {
      await apiRequest("POST", "/api/pantry", {
        ingredient: name.trim().toLowerCase(),
        displayName: name.trim(),
        category: pantryCategory,
      });
    } catch { /* silent if already exists */ }
    setAddItemInput('');
    setAddingToCategory(null);
    if (collapsedCategories.has(basketCategory)) toggleCollapsed(basketCategory);
  }, [addExtraMutation, collapsedCategories, toggleCollapsed]);

  const frozenMealIds = useMemo(() => {
    const ids = new Set<number>();
    for (const f of freezerMeals) {
      if (f.remainingPortions > 0) ids.add(f.mealId);
    }
    return ids;
  }, [freezerMeals]);

  const { data: supermarkets = [] } = useQuery<SupermarketLink[]>({
    queryKey: [api.supermarkets.list.path],
  });

  const { data: totalCostData } = useQuery<{
    totalCheapest: number;
    customTotal: number;
    supermarketTotals: { supermarket: string; total: number }[];
    currency: string;
    preferredTier: string;
    tierTotals: Record<string, number>;
  }>({
    queryKey: [api.shoppingList.totalCost.path, currentTier],
    queryFn: async () => {
      const res = await fetch(`${api.shoppingList.totalCost.path}?tier=${currentTier}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch total cost');
      return res.json();
    },
    enabled: allPriceMatches.length > 0,
  });

  useEffect(() => {
    if (savedItems.length > 0) {
      const stores = savedItems.map(i => i.selectedStore).filter(Boolean);
      if (stores.length > 0 && stores.every(s => s === stores[0])) {
        setGlobalStore(stores[0]!);
      }
    }
  }, [savedItems]);

  const autoSmpRef = useRef<{ done: boolean; running: boolean }>({ done: false, running: false });
  const itemCount = savedItems.length;
  const missingThaCount = savedItems.filter(i => i.thaRating === null || i.thaRating === undefined).length;
  useEffect(() => {
    if (loadingSaved || itemCount === 0 || missingThaCount === 0) return;
    if (autoSmpRef.current.done || autoSmpRef.current.running) return;
    autoSmpRef.current.running = true;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(api.shoppingList.autoSmp.path, { method: 'POST', credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.updated && data.updated.length > 0) {
            queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
          }
        }
      } catch {}
      autoSmpRef.current.running = false;
      autoSmpRef.current.done = true;
    }, 2000);
    return () => { clearTimeout(timer); autoSmpRef.current.running = false; };
  }, [loadingSaved, itemCount, missingThaCount, queryClient]);

  const getItemTier = useCallback((item: ShoppingListItem): PriceTier => {
    const catTier = getCategoryDefault(item.category || 'other').tier;
    return (item.selectedTier as PriceTier) || (catTier as PriceTier) || currentTier;
  }, [getCategoryDefault, currentTier]);

  const priceMatchesForItem = useCallback((itemId: number, tier: PriceTier) => {
    return allPriceMatches.filter(m => m.shoppingListItemId === itemId && m.tier === tier);
  }, [allPriceMatches]);

  const sourcesByItem = useMemo(() => {
    const map = new Map<number, IngredientSource[]>();
    for (const s of ingredientSources) {
      if (!map.has(s.shoppingListItemId)) map.set(s.shoppingListItemId, []);
      map.get(s.shoppingListItemId)!.push(s);
    }
    return map;
  }, [ingredientSources]);

  const pricesByItem = useMemo(() => {
    const map = new Map<number, Map<string, ProductMatch>>();
    for (const item of savedItems) {
      const tier = getItemTier(item);
      const matches = allPriceMatches.filter(m => m.shoppingListItemId === item.id && m.tier === tier);
      const storeMap = new Map<string, ProductMatch>();
      for (const m of matches) {
        storeMap.set(m.supermarket, m);
      }
      map.set(item.id, storeMap);
    }
    return map;
  }, [allPriceMatches, savedItems, getItemTier]);


  const togglePreference = useMutation({
    mutationFn: async () => {
      const newPref = measurementPref === 'metric' ? 'imperial' : 'metric';
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ measurementPreference: newPref }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update preference');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
  });

  const changeTier = useMutation({
    mutationFn: async (tier: PriceTier) => {
      const res = await fetch(api.priceTier.update.path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update tier');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
    },
  });

  const changeItemTier = useMutation({
    mutationFn: async ({ id, tier }: { id: number; tier: string | null }) => {
      const url = buildUrl(api.shoppingList.update.path, { id });
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedTier: tier }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update item tier');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
    },
  });


  const lookupPrices = useMutation({
    mutationFn: async (store?: string) => {
      const res = await fetch(api.shoppingList.lookupPrices.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(store ? { store } : {}),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to lookup prices');
      return res.json();
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.prices.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      toast({ title: "Products Matched", description: "Real grocery products matched and prices loaded across supermarkets." });
      try {
        const rawKeys = savedItems.map(i => normalizeIngredientKey((i as any).ingredientName ?? (i as any).name ?? i.normalizedName ?? i.productName ?? '')).filter(Boolean);
        const uniqueKeys = Array.from(new Set(rawKeys));
        if (uniqueKeys.length > 0) {
          const res = await fetch('/api/ingredient-products/lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ingredientKeys: uniqueKeys }),
            credentials: 'include',
          });
          if (res.ok) {
            const data = await res.json();
            setThaPicks(data.recommendations ?? {});
          }
        }
      } catch (e) {
        console.warn('[THA Picks] Lookup failed (non-fatal):', e);
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Could not lookup prices.", variant: "destructive" });
    },
  });

  const updateGlobalStore = useMutation({
    mutationFn: async (store: string) => {
      const storeVal = store === 'auto' ? null : store;
      const res = await fetch(api.basket.updateStore.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store: storeVal }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update global store');
      return res.json();
    },
    onSuccess: (_, store) => {
      setGlobalStore(store);
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      toast({
        title: store === 'auto' ? "Auto mode" : `${store} selected`,
        description: store === 'auto' ? "Each item uses its cheapest option." : `All items set to ${store}.`,
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not update store.", variant: "destructive" });
    },
  });

  const updateWholeFoodIntent = useMutation({
    mutationFn: async ({ id, fields }: { id: number; fields: Record<string, any> }) => {
      const url = buildUrl(api.shoppingList.update.path, { id });
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update item intent');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, fields }: { id: number; fields: Record<string, any> }) => {
      const url = buildUrl(api.shoppingList.update.path, { id });
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.prices.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      setEditState(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Could not update item.", variant: "destructive" });
    },
  });

  const removeItem = useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.shoppingList.remove.path, { id });
      const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to remove');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.prices.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.sources.path] });
    },
  });

  const clearAll = useMutation({
    mutationFn: async () => {
      const res = await fetch(api.shoppingList.clear.path, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to clear');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.prices.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.sources.path] });
      queryClient.invalidateQueries({ queryKey: ['/api/shopping-list/extras'] });
      toast({ title: "Cleared", description: "Basket has been cleared." });
    },
  });

  const recalculateScores = useMutation({
    mutationFn: async () => {
      const res = await fetch(api.shoppingList.autoSmp.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to recalculate');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      const count = data?.updated?.length ?? 0;
      toast({ title: "Scores updated", description: count > 0 ? `${count} item${count === 1 ? '' : 's'} re-scored with the latest rules.` : "All scores are already up to date." });
    },
    onError: () => {
      toast({ title: "Could not recalculate", description: "Please try again.", variant: "destructive" });
    },
  });

  const toggleChecked = useMutation({
    mutationFn: async ({ id, checked }: { id: number; checked: boolean }) => {
      const url = buildUrl(api.shoppingList.update.path, { id });
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to toggle checked');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
    },
  });


  const addItem = useMutation({
    mutationFn: async (rawText: string) => {
      const res = await fetch(api.shoppingList.add.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: rawText }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to add item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not add item.", variant: "destructive" });
    },
  });

  const copyToClipboard = () => {
    const items = savedItems.length > 0
      ? savedItems.map(i => {
          const display = formatItemDisplay(i.productName, i.quantityValue, i.unit, measurementPref);
          return `- ${display}${i.quantity > 1 ? ` (x${i.quantity})` : ''}`;
        })
      : [];
    if (items.length === 0) return;
    navigator.clipboard.writeText("Basket:\n\n" + items.join("\n"));
    toast({ title: "Copied!", description: "Basket copied to clipboard." });
  };

  const getCheapestForItem = useCallback((itemId: number): { price: number; supermarket: string } | null => {
    const itemPrices = pricesByItem.get(itemId);
    if (!itemPrices) return null;
    let cheapest: { price: number; supermarket: string } | null = null;
    SUPERMARKET_NAMES.forEach(store => {
      const match = itemPrices.get(store);
      if (match && match.price !== null && (!cheapest || match.price < cheapest.price)) {
        cheapest = { price: match.price, supermarket: store };
      }
    });
    return cheapest;
  }, [pricesByItem]);

  const getItemThaRating = useCallback((itemId: number, item?: ShoppingListItem): number => {
    if (item?.thaRating !== null && item?.thaRating !== undefined && item.thaRating > 0) {
      return item.thaRating;
    }
    const itemPrices = pricesByItem.get(itemId);
    if (!itemPrices) return 0;
    const store = item?.selectedStore || getCheapestForItem(itemId)?.supermarket;
    if (store) {
      const match = itemPrices.get(store);
      if (match?.thaRating !== null && match?.thaRating !== undefined) return match.thaRating;
    }
    let maxSmp = 0;
    itemPrices.forEach(match => {
      if (match.thaRating !== null && match.thaRating !== undefined && match.thaRating > maxSmp) {
        maxSmp = match.thaRating;
      }
    });
    return maxSmp;
  }, [pricesByItem, getCheapestForItem]);

  const hasPrices = allPriceMatches.length > 0;
  const hasItemOverrides = savedItems.some(i => i.selectedTier !== null);

  const filteredSupermarketTotals = useMemo(() => {
    if (!totalCostData) return [];
    return totalCostData.supermarketTotals.filter(st =>
      selectedRetailers.includes(st.supermarket)
    );
  }, [totalCostData, selectedRetailers]);

  const clientBestTotal = useMemo(() => {
    if (!hasPrices || savedItems.length === 0) return null;
    let total = 0;
    for (const item of savedItems) {
      const tier: PriceTier =
        (item.selectedTier as PriceTier) ||
        (getCategoryDefault(item.category || 'other').tier as PriceTier) ||
        currentTier;
      let best: number | null = null;
      for (const retailer of selectedRetailers) {
        const match = allPriceMatches.find(
          m => m.shoppingListItemId === item.id && m.supermarket === retailer && m.tier === tier
        );
        if (match?.price !== null && match?.price !== undefined) {
          if (best === null || match.price < best) best = match.price;
        }
      }
      if (best !== null) total += best;
    }
    return total;
  }, [hasPrices, savedItems, allPriceMatches, selectedRetailers, getCategoryDefault, currentTier]);

  const avgThaRating = useMemo(() => {
    const rated = savedItems.filter(i => i.thaRating !== null && i.thaRating !== undefined && (i.thaRating as number) > 0);
    if (rated.length === 0) return null;
    return rated.reduce((sum, i) => sum + (i.thaRating as number), 0) / rated.length;
  }, [savedItems]);

  const overallConfidence = useMemo((): 'high' | 'medium' | 'low' | null => {
    const wfItems = savedItems.filter(item => {
      const wfDef = getIngredientDef(item.normalizedName ?? item.productName);
      return isWholeFood(item) && !!wfDef;
    });
    if (wfItems.length === 0) return null;
    let highCount = 0, medCount = 0;
    for (const item of wfItems) {
      const wfDef = getIngredientDef(item.normalizedName ?? item.productName);
      if (!wfDef) continue;
      const rowVariantSelections = safeParseJsonObject(item.variantSelections);
      const rowAttrPreferences = safeParseJsonObject(item.attributePreferences);
      const effectiveTier = getEffectiveTier(item);
      const itemCandidates = allPriceMatches.filter(m => m.shoppingListItemId === item.id);
      const intent: WholeFoodIntent = { ingredientName: item.normalizedName ?? item.productName, variantSelections: rowVariantSelections, attributePreferences: rowAttrPreferences, tier: effectiveTier, selectedRetailers };
      const conf = calcConfidence(intent, itemCandidates, selectedRetailers);
      if (conf.level === 'exact') highCount++;
      else if (conf.level === 'close') medCount++;
    }
    const score = (highCount * 2 + medCount) / (wfItems.length * 2);
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }, [savedItems, allPriceMatches, selectedRetailers]); // eslint-disable-line react-hooks/exhaustive-deps

  const comparisonMatrix = useMemo(() => {
    if (!hasPrices || savedItems.length === 0) return {} as Record<string, Record<string, number>>;
    const tiers = ['budget', 'standard', 'premium', 'organic'];
    const result: Record<string, Record<string, number>> = {};
    for (const retailer of selectedRetailers) {
      result[retailer] = {};
      for (const tier of tiers) {
        let total = 0;
        for (const item of savedItems) {
          const match = allPriceMatches.find(m => m.shoppingListItemId === item.id && m.supermarket === retailer && m.tier === tier);
          if (match?.price !== null && match?.price !== undefined) total += match.price;
        }
        result[retailer][tier] = total;
      }
    }
    return result;
  }, [hasPrices, savedItems, allPriceMatches, selectedRetailers]);

  const currentByRetailer = useMemo(() => {
    if (!hasPrices) return {} as Record<string, number>;
    const result: Record<string, number> = {};
    for (const retailer of selectedRetailers) {
      let total = 0;
      for (const item of savedItems) {
        const itemPrices = pricesByItem.get(item.id);
        if (item.selectedStore) {
          if (item.selectedStore === retailer) {
            const price = itemPrices?.get(retailer)?.price;
            if (price !== null && price !== undefined) total += price;
          }
        } else {
          const cheapest = getCheapestForItem(item.id);
          if (cheapest?.supermarket === retailer) total += cheapest.price;
        }
      }
      result[retailer] = total;
    }
    return result;
  }, [hasPrices, savedItems, pricesByItem, selectedRetailers, getCheapestForItem]);

  const currentTotal = useMemo(() => {
    if (!hasPrices) return 0;
    let total = 0;
    for (const item of savedItems) {
      const itemPrices = pricesByItem.get(item.id);
      if (item.selectedStore) {
        const price = itemPrices?.get(item.selectedStore)?.price;
        if (price !== null && price !== undefined) total += price;
      } else {
        const cheapest = getCheapestForItem(item.id);
        if (cheapest) total += cheapest.price;
      }
    }
    return total;
  }, [hasPrices, savedItems, pricesByItem, getCheapestForItem]);

  useEffect(() => {
    if (savedItems.length === 0 || Object.keys(thaPicks).length > 0) return;
    const rawKeys = savedItems
      .map(i => normalizeIngredientKey((i as any).ingredientName ?? (i as any).name ?? i.normalizedName ?? i.productName ?? ''))
      .filter(Boolean);
    const uniqueKeys = Array.from(new Set(rawKeys));
    if (uniqueKeys.length === 0) return;
    fetch('/api/ingredient-products/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredientKeys: uniqueKeys }),
      credentials: 'include',
    })
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (data) setThaPicks(data.recommendations ?? {}); })
      .catch(e => console.warn('[THA Picks] Lookup on load failed (non-fatal):', e));
  }, [savedItems.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // When entering from List (quick-list mode), auto-trigger price matching so
  // product options are ready by the time the user reaches the shopping phase.
  const quickListPricesTriggeredRef = useRef(false);
  useEffect(() => {
    if (!quickListLabel) return;
    if (quickListPricesTriggeredRef.current) return;
    if (loadingSaved || savedItems.length === 0) return;
    quickListPricesTriggeredRef.current = true;
    // Scope to the user's selected store so only the relevant store is matched,
    // making the operation 9× faster than matching all stores at once.
    const targetStore = globalStore !== 'auto' ? globalStore : undefined;
    lookupPrices.mutate(targetStore);
  }, [quickListLabel, loadingSaved, savedItems.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rename an item and re-fetch THA picks for its new key.
  const handleRenameItem = useCallback(async (id: number, newName: string) => {
    const normalizedName = normalizeIngredientKey(newName);
    await updateItem.mutateAsync({ id, fields: { productName: newName, normalizedName } });
    // Fetch THA picks for the new key and merge into existing map so other items are unaffected.
    try {
      const res = await fetch('/api/ingredient-products/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredientKeys: [normalizedName] }),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.recommendations) {
          setThaPicks(prev => ({ ...prev, ...data.recommendations }));
        }
      }
    } catch {}
  }, [updateItem]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const sortedItems = useMemo(() => {
    const sorted = [...savedItems].sort((a, b) => {
      // When splitByShop is on, first sort by shop so items cluster by store
      if (splitByShop) {
        const aShop = a.selectedStore || getCheapestForItem(a.id)?.supermarket || 'zzz';
        const bShop = b.selectedStore || getCheapestForItem(b.id)?.supermarket || 'zzz';
        if (aShop !== bShop) return aShop.localeCompare(bShop);
      }
      if (!sortColumn) return 0;
      let cmp = 0;
      switch (sortColumn) {
        case 'ingredient':
          cmp = (a.productName || '').localeCompare(b.productName || '');
          break;
        case 'product': {
          const aMatch = pricesByItem.get(a.id)?.values().next().value;
          const bMatch = pricesByItem.get(b.id)?.values().next().value;
          cmp = ((aMatch as any)?.productName || '').localeCompare((bMatch as any)?.productName || '');
          break;
        }
        case 'category':
          cmp = (a.category || 'other').localeCompare(b.category || 'other');
          break;
        case 'qty':
          cmp = (a.quantityValue || 0) - (b.quantityValue || 0);
          break;
        case 'unit':
          cmp = (a.unit || '').localeCompare(b.unit || '');
          break;
        case 'tier':
          cmp = (getItemTier(a)).localeCompare(getItemTier(b));
          break;
        case 'meal': {
          const aSources = sourcesByItem.get(a.id) || [];
          const bSources = sourcesByItem.get(b.id) || [];
          cmp = aSources.length - bSources.length;
          break;
        }
        case 'price': {
          const aStore = a.selectedStore || getCheapestForItem(a.id)?.supermarket || '';
          const bStore = b.selectedStore || getCheapestForItem(b.id)?.supermarket || '';
          const aPrice = (aStore ? pricesByItem.get(a.id)?.get(aStore)?.price : getCheapestForItem(a.id)?.price) ?? Infinity;
          const bPrice = (bStore ? pricesByItem.get(b.id)?.get(bStore)?.price : getCheapestForItem(b.id)?.price) ?? Infinity;
          cmp = aPrice - bPrice;
          break;
        }
        case 'shop': {
          const aShop = a.selectedStore || getCheapestForItem(a.id)?.supermarket || '';
          const bShop = b.selectedStore || getCheapestForItem(b.id)?.supermarket || '';
          cmp = aShop.localeCompare(bShop);
          break;
        }
        case 'smp': {
          const aSmp = getItemThaRating(a.id, a);
          const bSmp = getItemThaRating(b.id, b);
          if (aSmp === 0 && bSmp === 0) cmp = 0;
          else if (aSmp === 0) cmp = 1;
          else if (bSmp === 0) cmp = -1;
          else cmp = aSmp - bSmp;
          break;
        }
      }
      return sortDirection === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [savedItems, sortColumn, sortDirection, pricesByItem, getCheapestForItem, getItemTier, getItemThaRating, sourcesByItem, splitByShop]);

  // Initialise collapsed-category state once data has loaded
  useEffect(() => {
    if (collapsedInitRef.current) return;
    if (loadingSaved && !shoppingExtras.length) return;
    const toCollapse = new Set<string>();
    for (const cat of BASKET_DISPLAY_CATEGORIES) {
      const catItems = sortedItems.filter(i => !isStaple(i) && !isHousehold(i) && getBasketCategory(i) === cat);
      const catAlwaysExtras = shoppingExtras.filter(e => (e.inBasket || e.alwaysAdd) && e.category !== 'household' && EXTRAS_TO_BASKET_CATEGORY[e.category] === cat);
      if (catItems.length === 0 && catAlwaysExtras.length === 0) toCollapse.add(cat);
    }
    const hhSaved = sortedItems.filter(i => !isStaple(i) && isHousehold(i));
    const hhExtras = shoppingExtras.filter(e => (e.inBasket || e.alwaysAdd) && e.category === 'household');
    if (hhSaved.length === 0 && hhExtras.length === 0) toCollapse.add('household');
    setCollapsedCategories(toCollapse);
    collapsedInitRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedItems, shoppingExtras, loadingSaved]);

  // Auto-expand a category when new extras are added to it
  useEffect(() => {
    if (!collapsedInitRef.current) return;
    if (shoppingExtras.length <= prevExtrasLenRef.current) {
      prevExtrasLenRef.current = shoppingExtras.length;
      return;
    }
    prevExtrasLenRef.current = shoppingExtras.length;
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      for (const cat of BASKET_DISPLAY_CATEGORIES) {
        if (shoppingExtras.some(e => e.category !== 'household' && EXTRAS_TO_BASKET_CATEGORY[e.category] === cat)) next.delete(cat);
      }
      if (shoppingExtras.some(e => e.category === 'household')) next.delete('household');
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shoppingExtras.length]);

  const startEdit = (itemId: number, field: EditState['field'], currentValue: string) => {
    setEditState({ itemId, field, value: currentValue });
  };

  const saveEdit = () => {
    if (!editState) return;
    const { itemId, field, value } = editState;
    const fields: Record<string, any> = {};
    if (field === 'quantityValue') {
      fields.quantityValue = parseFloat(value) || 0;
    } else {
      fields[field] = value;
    }
    updateItem.mutate({ id: itemId, fields });
  };

  const cancelEdit = () => setEditState(null);

  const comparisonMatches = useMemo(() => {
    if (!comparisonItem) return [];
    return allPriceMatches.filter(m => m.shoppingListItemId === comparisonItem.id);
  }, [comparisonItem, allPriceMatches]);

  const handleExport = (format: 'list' | 'links') => {
    if (format === 'list') {
      const lines: string[] = [];
      lines.push(`Basket - ${new Date().toLocaleDateString()}`);
      lines.push(`Supermarket: ${exportSupermarket}`);
      lines.push('');
      lines.push('Ingredient | Qty | Unit | Tier | Price');
      lines.push('--- | --- | --- | --- | ---');
      for (const item of savedItems) {
        const { qty, unitLabel } = formatQty(item.quantityValue, item.unit, measurementPref);
        const tier = getItemTier(item);
        const tierLabel = TIER_LABELS[tier]?.label || 'Standard';
        const match = pricesByItem.get(item.id)?.get(exportSupermarket);
        const price = match?.price !== null && match?.price !== undefined ? `\u00A3${match.price.toFixed(2)}` : '-';
        lines.push(`${capitalizeWords(item.productName)} | ${qty} ${unitLabel} | ${tierLabel} | ${price}`);
      }
      const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `basket-${exportSupermarket.toLowerCase().replace(/'/g, '')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exported!", description: `Basket downloaded for ${exportSupermarket}.` });
    } else {
      const selectedStore = supermarkets.find(s =>
        s.name.toLowerCase().includes(exportSupermarket.toLowerCase())
      );
      if (selectedStore?.searchUrl) {
        for (const item of savedItems.slice(0, 10)) {
          const searchUrl = selectedStore.searchUrl.replace('{query}', encodeURIComponent(item.productName));
          window.open(searchUrl, '_blank');
        }
        if (savedItems.length > 10) {
          toast({ title: "Opened first 10 items", description: `${savedItems.length - 10} more items remaining. Use the text export for the full list.` });
        }
      } else {
        toast({ title: "No search URL", description: `Cannot open search links for ${exportSupermarket}. Try the text export instead.`, variant: "destructive" });
      }
    }
    setExportDialogOpen(false);
  };

  const [basketResult, setBasketResult] = useState<{
    supermarket: string;
    itemUrls: { name: string; url: string; productId?: string }[];
    matchedCount: number;
    totalCount: number;
    estimatedTotal?: number;
    message?: string;
  } | null>(null);

  const handleSendBasket = async (supermarket: string) => {
    if (savedItems.length === 0) {
      toast({ title: "Empty Basket", description: "Add items to your basket first.", variant: "destructive" });
      return;
    }
    setBasketSending(supermarket);
    setBasketResult(null);
    try {
      const res = await fetch('/api/basket/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ supermarket }),
      });
      if (!res.ok) throw new Error('Failed to create basket');
      const result = await res.json();

      if (result.success && result.itemUrls && result.itemUrls.length > 0) {
        setBasketResult(result);
        const urlsToOpen = result.itemUrls.slice(0, 8);
        for (const item of urlsToOpen) {
          window.open(item.url, '_blank');
        }
        const opened = urlsToOpen.length;
        const remaining = result.itemUrls.length - opened;
        toast({
          title: `${result.supermarket} Basket`,
          description: remaining > 0
            ? `Opened ${opened} of ${result.itemUrls.length} items. ${result.matchedCount} matched with product links.`
            : `Opened ${opened} product pages on ${result.supermarket}.`,
        });
      } else {
        toast({ title: "Could not send", description: result.message || "Unable to create basket.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: `Failed to send basket to ${supermarket}.`, variant: "destructive" });
    } finally {
      setBasketSending(null);
    }
  };

  const { data: enhancedSupermarkets = [] } = useQuery<{
    name: string;
    key: string;
    color: string;
    hasDirectBasket: boolean;
  }[]>({
    queryKey: ['/api/basket/supermarkets-enhanced'],
  });

  const primarySupermarkets = enhancedSupermarkets.filter(s => s.hasDirectBasket);
  const otherSupermarkets = enhancedSupermarkets.filter(s => !s.hasDirectBasket);

  const SortableHeader = ({ column, label, className = '' }: { column: SortColumn; label: string; className?: string }) => (
    <th
      className={`p-3 font-medium text-muted-foreground cursor-pointer select-none whitespace-nowrap ${className}`}
      onClick={() => handleSort(column)}
      data-testid={`sort-${column}`}
    >
      <span className="inline-flex items-center">
        {label}
        {getSortIcon(column)}
      </span>
    </th>
  );

  // ── Quick-list clean mode ──────────────────────────────────────────────────
  // When entering from the List page (quickListLabel is set) with shop mode
  // active, ShoppingListView opens as a portal overlay covering the full page.
  // The view starts at cupboard_check (the default), which skips only the old
  // ShopModeView intro card while preserving the cupboard check step.
  // NOTE: viewMode is seeded from ?shopMode=1 in useState, so shop view
  // opens immediately on navigation — no early return needed here.

  return (
    <div
      className={`${isFullscreen ? 'fixed inset-0 z-50 overflow-auto flex flex-col' : 'max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}
      style={isFullscreen ? { backgroundImage: "url('/orchard-bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >

      {/* Fullscreen branding bar */}
      {isFullscreen && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/80 backdrop-blur-sm shrink-0" data-testid="fullscreen-header">
          <img src="/logo-long.png" alt="The Healthy Apples" className="h-10 w-auto" />
          <span className="text-sm text-muted-foreground font-medium">Basket</span>
        </div>
      )}

      <div className={`flex flex-col ${isFullscreen ? 'flex-1 overflow-auto p-4 sm:p-6' : ''}`}>
        {/* ── Basket view ──────────────────────────────────────────────────── */}
        <div className={viewMode === "shop" ? "hidden" : ""}>
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-6 border-b border-border">
            <div className="flex justify-between items-center gap-1 flex-wrap">
              <div className="flex items-center gap-4">
                <div>
                  <CardTitle className="text-[28px] font-semibold tracking-tight" data-testid="text-analyse-basket-title">Basket</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1" data-testid="text-items-count">
                    {savedItems.length} items to buy
                  </p>
                  {householdData && (
                    <div className="flex items-center gap-1.5 mt-1.5" data-testid="banner-household">
                      <Home className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {householdData.name} · Shared basket
                      </span>
                    </div>
                  )}
                  {householdData && (() => {
                    const sharedCount = savedItems.filter(i => i.basketLabel === 'shared').length;
                    const memberCount = savedItems.filter(i => i.basketLabel && i.basketLabel !== 'shared').length;
                    if (sharedCount === 0 && memberCount === 0) return null;
                    return (
                      <div className="mt-1.5 text-xs text-muted-foreground leading-tight space-y-0.5" data-testid="banner-basket-summary">
                        {sharedCount > 0 && (
                          <div data-testid="text-shared-count">{sharedCount} ingredient{sharedCount !== 1 ? 's' : ''} shared across all plates</div>
                        )}
                        {memberCount > 0 && (
                          <div data-testid="text-member-count">{memberCount} item{memberCount !== 1 ? 's' : ''} specific to one member</div>
                        )}
                      </div>
                    );
                  })()}
                  {quickListLabel && (
                    <div className="flex items-center gap-2 mt-2 px-2.5 py-1.5 rounded-lg bg-primary/8 border border-primary/20 text-xs" data-testid="banner-quick-list">
                      <NotepadText className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-primary font-medium">Quick List</span>
                      <span className="text-muted-foreground">· {savedItems.length} item{savedItems.length !== 1 ? "s" : ""}</span>
                      <Link href="/analyse-basket" className="ml-auto text-muted-foreground hover:text-foreground underline underline-offset-2 shrink-0">
                        Full basket
                      </Link>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-wrap justify-end">
                {/* Split by shop toggle */}
                {(savedItems.length > 0) && (
                  <div className="flex items-center gap-1.5 border border-border rounded-md px-2 py-1" data-testid="toggle-split-by-shop">
                    <Columns2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground hidden sm:inline">Split by shop</span>
                    <Switch
                      checked={splitByShop}
                      onCheckedChange={setSplitByShop}
                      className="scale-75"
                      data-testid="switch-split-by-shop"
                    />
                  </div>
                )}
                {(savedItems.length > 0 || shoppingExtras.some(e => e.inBasket || e.alwaysAdd)) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => lookupPrices.mutate()}
                    disabled={lookupPrices.isPending}
                    data-testid="button-lookup-prices"
                    className="gap-1"
                  >
                    {lookupPrices.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Search className="h-3 w-3" />
                    )}
                    <span className="hidden sm:inline">Match Products</span>
                  </Button>
                )}
                {savedItems.length > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setViewMode("shop")}
                    className="gap-1.5"
                    data-testid="button-shopping-view"
                  >
                    <ListChecks className="h-3.5 w-3.5" />
                    <span>Shop View</span>
                  </Button>
                )}
                {/* Apple overflow menu - far right */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center justify-center h-11 w-11 rounded-lg transition-colors text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                      data-testid="button-more-actions"
                    >
                      <img src={thaAppleSrc} alt="Menu" className="h-[60px] w-[60px] object-contain" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      data-testid="button-fullscreen-toggle"
                    >
                      {isFullscreen ? <Minimize2 className="h-4 w-4 mr-2" /> : <Maximize2 className="h-4 w-4 mr-2" />}
                      {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => togglePreference.mutate()}
                      disabled={togglePreference.isPending}
                      data-testid="button-toggle-units"
                    >
                      <Scale className="h-4 w-4 mr-2" />
                      {measurementPref === 'metric' ? 'Switch to Imperial' : 'Switch to Metric'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {(savedItems.length > 0 || shoppingExtras.some(e => e.inBasket || e.alwaysAdd)) && (
                      <>
                        <DropdownMenuItem onClick={() => setBasketDialogOpen(true)} data-testid="button-send-to-supermarket">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Send to Supermarket
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setExportDialogOpen(true)} data-testid="button-export-list">
                          <Download className="h-4 w-4 mr-2" />
                          Export / Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => recalculateScores.mutate()}
                          disabled={recalculateScores.isPending}
                          data-testid="button-recalculate-scores"
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${recalculateScores.isPending ? 'animate-spin' : ''}`} />
                          {recalculateScores.isPending ? 'Recalculating…' : 'Recalculate Scores'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => clearAll.mutate()}
                          disabled={clearAll.isPending}
                          className="text-destructive focus:text-destructive"
                          data-testid="button-clear-all"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear Basket
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-0">
            {loadingSaved ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div>
                {BASKET_DISPLAY_CATEGORIES.map(cat => {
                  const catItems = sortedItems.filter(i => !isStaple(i) && !isHousehold(i) && getBasketCategory(i) === cat);
                  const catExtras = shoppingExtras.filter(e => (e.inBasket || e.alwaysAdd) && e.category !== 'household' && EXTRAS_TO_BASKET_CATEGORY[e.category] === cat);
                  const hasContent = catItems.length > 0 || catExtras.length > 0;
                  const isPantry = cat === 'pantry';
                  const displayRows = computePantryMergedRows(catItems, sourcesByItem);
                  const catDefault = getCategoryDefault(cat);
                  const isMixed = catItems.some(i => i.selectedTier !== null && i.selectedTier !== catDefault.tier);
                  const CatIcon = CATEGORY_ICONS[cat] || CircleDot;
                  const tierOptions = CATEGORY_TIER_OPTIONS[cat] || CATEGORY_TIER_OPTIONS.other;

                  return (
                    <div key={cat}>
                      {/* Sticky category header */}
                      <div className="sticky top-0 z-10 flex items-center gap-3 py-1.5 px-3 bg-muted/80 border-y border-border text-xs backdrop-blur-sm" data-testid={`category-header-${cat}`}>
                        <button className="flex items-center gap-1.5 font-semibold min-w-[90px] hover:text-primary transition-colors" onClick={() => toggleCollapsed(cat)} data-testid={`button-collapse-${cat}`}>
                          {collapsedCategories.has(cat) ? <ChevronDown className="h-3 w-3 flex-shrink-0" /> : <ChevronUp className="h-3 w-3 flex-shrink-0" />}
                          <CatIcon className="h-3 w-3" />
                          <span>{capitalizeWords(cat)}</span>
                          {(catItems.length + catExtras.length) > 0 && <span className="text-muted-foreground font-normal">({catItems.length + catExtras.length})</span>}
                        </button>
                        {!collapsedCategories.has(cat) && <>
                          <select
                            className="h-6 text-xs border border-border rounded px-1.5 bg-background cursor-pointer"
                            value={catDefault.supermarket}
                            onChange={e => setCategoryDefault(cat, 'supermarket', e.target.value)}
                            data-testid={`select-cat-supermarket-${cat}`}
                          >
                            <option value="">Auto</option>
                            {SUPERMARKET_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <div className="ml-auto flex items-center gap-1.5 text-xs">
                            {isMixed && <span className="text-amber-600 dark:text-amber-400 font-medium">Mixed</span>}
                            <select
                              className="h-6 text-xs border border-border rounded px-1.5 bg-background cursor-pointer"
                              value={catDefault.tier}
                              onChange={e => setCategoryDefault(cat, 'tier', e.target.value)}
                              data-testid={`select-cat-tier-${cat}`}
                            >
                              {(CATEGORY_TIER_OPTIONS[cat] || CATEGORY_TIER_OPTIONS.other).map(key => (
                                <option key={key} value={key}>{EXTENDED_TIER_LABELS[key]?.label || key}</option>
                              ))}
                            </select>
                          </div>
                        </>}
                        {collapsedCategories.has(cat) && (
                          <button onClick={() => { toggleCollapsed(cat); setAddingToCategory(cat); }} className="ml-auto text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors" data-testid={`button-add-collapsed-${cat}`}>
                            <Plus className="h-3 w-3" />Add
                          </button>
                        )}
                      </div>

                      {!collapsedCategories.has(cat) && (
                      <><div className="overflow-x-auto">
                        <table className="w-full text-xs sm:table-fixed" data-testid={`table-category-${cat}`}>
                          <colgroup>
                            <col style={{ width: 210 }} />
                            <col style={{ width: 80 }} />
                            <col style={{ width: 150 }} />
                            <col style={{ width: 200 }} />
                            <col style={{ width: 70 }} />
                            <col style={{ width: 95 }} />
                            <col style={{ width: 110 }} />
                            <col style={{ width: 80 }} />
                            <col style={{ width: 90 }} />
                          </colgroup>
                          <thead>
                            <tr className="border-b border-border/40 bg-muted/10">
                              <th className="px-1.5 py-1 text-left font-medium text-muted-foreground whitespace-nowrap align-middle sticky left-0 z-10">Ingredient</th>
                              <th className="px-1.5 py-1 text-left font-medium text-muted-foreground whitespace-nowrap align-middle hidden sm:table-cell">Optimizer</th>
                              <th className="px-1.5 py-1 text-left font-medium text-muted-foreground whitespace-nowrap align-middle">Choice</th>
                              <th className="px-1.5 py-1 text-left font-medium text-muted-foreground whitespace-nowrap align-middle">Match</th>
                              <th className="px-1.5 py-1 text-right font-medium text-muted-foreground whitespace-nowrap align-middle">Qty</th>
                              <th className="px-1.5 py-1 text-right font-medium text-muted-foreground whitespace-nowrap align-middle">Price</th>
                              <th className="px-1.5 py-1 text-center font-medium text-muted-foreground whitespace-nowrap align-middle hidden sm:table-cell">THA Rating</th>
                              <th className="px-1.5 py-1 text-center font-medium text-muted-foreground whitespace-nowrap align-middle hidden sm:table-cell">Meal</th>
                              <th className="px-1.5 py-1 text-right font-medium text-muted-foreground whitespace-nowrap align-middle sticky right-0 z-10">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            <AnimatePresence>
                              {displayRows.map(({ primary: item, combinedSources, combinedQtyValue, mergedCount }) => {
                                const { qty, unitLabel } = formatQty(combinedQtyValue ?? item.quantityValue, item.unit, measurementPref, item.quantityInGrams);
                                const showStepper = !['g', 'kg', 'ml', 'L', 'oz', 'lb', 'cups', 'tbsp', 'tsp'].includes(unitLabel);
                                const itemPrices = pricesByItem.get(item.id);
                                const cheapest = getCheapestForItem(item.id);
                                const isEditing = editState?.itemId === item.id;
                                const sources = combinedSources;
                                const catDef = getCategoryDefault(cat);
                                const itemTier = (item.selectedTier || catDef.tier) as PriceTier;
                                const isOverridden = item.selectedTier !== null && item.selectedTier !== catDef.tier;

                                const wfDef = getIngredientDef(item.normalizedName ?? item.productName);
                                const isWF = isWholeFood(item) && !!wfDef;
                                const rowVariantSelections = isWF ? safeParseJsonObject(item.variantSelections) : {};
                                const rowAttrPreferences = isWF ? safeParseJsonObject(item.attributePreferences) : {};
                                let wfConfLabel: typeof CONFIDENCE_LABELS[keyof typeof CONFIDENCE_LABELS] | null = null;
                                let wfConfLevel: string | null = null;
                                if (isWF && wfDef) {
                                  const effectiveTier = getEffectiveTier(item);
                                  const itemCandidates = allPriceMatches.filter(m => m.shoppingListItemId === item.id);
                                  const intent: WholeFoodIntent = { ingredientName: item.normalizedName ?? item.productName, variantSelections: rowVariantSelections, attributePreferences: rowAttrPreferences, tier: effectiveTier, selectedRetailers };
                                  const conf = calcConfidence(intent, itemCandidates, selectedRetailers);
                                  wfConfLabel = CONFIDENCE_LABELS[conf.level];
                                  wfConfLevel = conf.level;
                                }
                                const handleVariantChange = (key: string, value: string) => {
                                  const next = { ...rowVariantSelections, [key]: value };
                                  if (!value) delete next[key];
                                  updateWholeFoodIntent.mutate({ id: item.id, fields: { variantSelections: JSON.stringify(next) } });
                                };
                                const handleAttrChange = (key: string, value: boolean) => {
                                  const next = { ...rowAttrPreferences, [key]: value };
                                  updateWholeFoodIntent.mutate({ id: item.id, fields: { attributePreferences: JSON.stringify(next) } });
                                };

                                const selectedStore = item.selectedStore || catDef.supermarket || cheapest?.supermarket || '';
                                const selectedMatch = selectedStore ? itemPrices?.get(selectedStore) : null;
                                const selectedPrice = selectedMatch?.price;
                                const isBestPrice = !!(cheapest && selectedStore === cheapest.supermarket);

                                const itemKey = normalizeIngredientKey((item as any).ingredientName ?? (item as any).name ?? item.normalizedName ?? item.productName ?? '');
                                const topPick = (thaPicks[itemKey] ?? [])[0];
                                const showHint = topPick && topPick.productName !== selectedMatch?.productName;

                                const availableStores = SUPERMARKET_NAMES.filter(store => itemPrices?.has(store));
                                const knownStores: string[] = (() => { try { return item.availableStores ? JSON.parse(item.availableStores) : []; } catch { return []; } })();
                                const isBranded = !!item.matchedProductId;

                                const confShortLabel: Record<string, string> = { high: 'Exact', medium: 'Close', low: 'Sub.' };
                                const variantSummary = (isWF && wfDef && Object.keys(rowVariantSelections).length > 0)
                                  ? Object.values(rowVariantSelections).filter(Boolean).join(' · ')
                                  : '-';
                                const tierShort = EXTENDED_TIER_LABELS[itemTier]?.short || itemTier;
                                const shopDisplay = item.selectedStore || catDef.supermarket || 'Auto';
                                const choiceSummary = `${variantSummary} · ${tierShort} · ${shopDisplay}`;

                                return (
                                  <motion.tr
                                    key={item.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className={`group border-b border-border/40 ${item.checked ? 'opacity-50' : ''} ${item.needsReview && !item.checked ? 'bg-amber-50/40 dark:bg-amber-950/15' : ''}`}
                                    data-testid={`shopping-item-${item.id}`}
                                  >
                                    <td className="px-1.5 py-1 sticky left-0 z-10">
                                      {isEditing && editState?.field === 'productName' ? (
                                        <div className="flex items-center gap-1">
                                          <Input value={editState.value} onChange={(e) => setEditState({ ...editState, value: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} className="h-6 text-xs" autoFocus data-testid={`input-edit-name-${item.id}`} />
                                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={saveEdit} data-testid={`button-save-edit-${item.id}`}><Check className="h-3 w-3" /></Button>
                                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEdit}><X className="h-3 w-3" /></Button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-between gap-3">
                                          <div className="flex items-center gap-1 flex-wrap min-w-0 flex-1">
                                          <span className="font-medium text-foreground cursor-pointer" onClick={() => startEdit(item.id, 'productName', item.productName)} data-testid={`text-item-name-${item.id}`}>{capitalizeWords(cleanProductName(item.productName, item.quantityValue))}</span>
                                          {item.quantity > 1 && <Badge variant="secondary" className="text-[10px]" data-testid={`badge-quantity-${item.id}`}>x{item.quantity}</Badge>}
                                          {mergedCount > 1 && <Badge variant="outline" className="text-[10px] text-blue-500 dark:text-blue-400 border-blue-300 dark:border-blue-600" data-testid={`badge-merged-${item.id}`}>×{mergedCount}</Badge>}
                                          {sources.some(s => frozenMealIds.has(s.mealId)) && (
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Badge variant="outline" className="text-[10px] text-blue-500 dark:text-blue-400 border-blue-300 dark:border-blue-600 gap-0.5" data-testid={`badge-frozen-source-${item.id}`}><Snowflake className="h-2.5 w-2.5" />Frozen</Badge>
                                              </TooltipTrigger>
                                              <TooltipContent><p className="text-xs">You have frozen portions of a meal that uses this ingredient</p></TooltipContent>
                                            </Tooltip>
                                          )}
                                          {item.needsReview && (
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Badge className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-400 dark:border-amber-600 gap-0.5 shrink-0" data-testid={`badge-review-${item.id}`}><AlertTriangle className="h-2.5 w-2.5 shrink-0" />Check item</Badge>
                                              </TooltipTrigger>
                                              <TooltipContent><p className="text-xs">{item.validationNote || 'This item may need manual review'}</p></TooltipContent>
                                            </Tooltip>
                                          )}
                                          {item.basketLabel && (() => {
                                            const BASKET_LABEL_CONFIG: Record<string, { text: string; className: string }> = {
                                              shared:            { text: "Shared ingredient",  className: "text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-600" },
                                              vegetarian_swap:   { text: "Vegetarian option",  className: "text-green-600 dark:text-green-400 border-green-300 dark:border-green-600" },
                                              vegetarian:        { text: "Vegetarian option",  className: "text-green-600 dark:text-green-400 border-green-300 dark:border-green-600" },
                                              keto_swap:         { text: "Low-carb option",    className: "text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600" },
                                              keto:              { text: "Low-carb option",    className: "text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600" },
                                              optional:          { text: "Optional topping",   className: "text-muted-foreground border-border" },
                                            };
                                            const cfg = BASKET_LABEL_CONFIG[item.basketLabel];
                                            if (!cfg) return null;
                                            return (
                                              <Badge variant="outline" className={`text-[10px] ${cfg.className}`} data-testid={`badge-basket-label-${item.id}`}>
                                                {cfg.text}
                                              </Badge>
                                            );
                                          })()}
                                          </div>
                                          {(() => {
                                            const smp = getItemThaRating(item.id, item);
                                            if (smp === 0) return null;
                                            return (
                                              <span className="sm:hidden flex-shrink-0 flex items-center gap-0.5 whitespace-nowrap" data-testid={`text-smp-mobile-${item.id}`}>
                                                <img src={thaAppleSrc} alt="" className="h-8 w-8 object-contain" />
                                                <span className="text-xs font-semibold text-foreground/70">{Math.round(smp)}</span>
                                              </span>
                                            );
                                          })()}
                                        </div>
                                      )}
                                    </td>

                                    {(() => {
                                      if (!isPantry) return <td className="px-1.5 py-1 text-muted-foreground hidden sm:table-cell" data-testid={`optimizer-cell-${item.id}`}>-</td>;
                                      const optName = item.normalizedName ?? item.productName;
                                      const optCategory = (item.category || 'other').toLowerCase();
                                      const optKeys = getOptimizerOptions(optName, optCategory);
                                      const itemSel = optimizerSelections[item.id] || [];
                                      const triggerLabel = getOptimizerTriggerLabel(itemSel);
                                      const hasSelections = itemSel.length > 0;
                                      const toggleOpt = (key: string) => {
                                        setOptimizerSelections(prev => {
                                          const current = prev[item.id] || [];
                                          const next = current.includes(key) ? current.filter(k => k !== key) : [...current, key];
                                          return { ...prev, [item.id]: next };
                                        });
                                      };
                                      if (optKeys.length === 0) {
                                        return (
                                          <td className="px-1.5 py-1 hidden sm:table-cell" data-testid={`optimizer-cell-${item.id}`}>
                                            <span className="text-[10px] text-muted-foreground">Default</span>
                                          </td>
                                        );
                                      }
                                      return (
                                        <td className="px-1.5 py-1 hidden sm:table-cell" data-testid={`optimizer-cell-${item.id}`}>
                                          <Popover>
                                            <PopoverTrigger asChild>
                                              <button
                                                className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border whitespace-nowrap cursor-pointer transition-colors ${hasSelections ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted/60 text-muted-foreground border-border'}`}
                                                data-testid={`optimizer-trigger-${item.id}`}
                                              >
                                                {triggerLabel}
                                                <ChevronDown className="h-2.5 w-2.5 ml-0.5 opacity-60" />
                                              </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-48 p-2" align="start">
                                              <div className="flex flex-wrap gap-1">
                                                {optKeys.map(key => {
                                                  const isActive = itemSel.includes(key);
                                                  return (
                                                    <button
                                                      key={key}
                                                      type="button"
                                                      onClick={() => toggleOpt(key)}
                                                      className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${isActive ? 'bg-primary/10 text-primary border-primary/20 font-medium' : 'bg-transparent text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'}`}
                                                      data-testid={`optimizer-chip-${item.id}-${key}`}
                                                    >
                                                      {OPTIMIZER_OPTIONS[key]?.label || key}
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </PopoverContent>
                                          </Popover>
                                        </td>
                                      );
                                    })()}
                                    <td className="px-1.5 py-1" data-testid={`choice-cell-${item.id}`}>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <button className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border whitespace-nowrap cursor-pointer transition-colors ${isOverridden ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-700' : 'bg-muted/60 text-muted-foreground border-border hover:text-foreground'}`} data-testid={`choice-summary-${item.id}`}>
                                            <span className="truncate max-w-[120px]">{choiceSummary}</span>
                                            <ChevronDown className="h-2.5 w-2.5 ml-0.5 flex-shrink-0 opacity-60" />
                                          </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 p-3" align="start">
                                          <div className="flex flex-col gap-2">
                                            {isWF && wfDef && (
                                              <div className="flex flex-col gap-0.5">
                                                {wfDef.selectorSchema.map((selector) => (
                                                  <div key={selector.key} className="flex flex-wrap gap-0.5">
                                                    {selector.options.map((option) => {
                                                      const isSel = rowVariantSelections[selector.key] === option;
                                                      return (
                                                        <button key={option} type="button" onClick={() => handleVariantChange(selector.key, isSel ? "" : option)} className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${isSel ? "bg-primary/10 text-primary border-primary/20 font-medium" : "bg-transparent text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"}`} data-testid={`variant-chip-${item.id}-${selector.key}-${option.replace(/\s+/g, "-").toLowerCase()}`}>{option}</button>
                                                      );
                                                    })}
                                                  </div>
                                                ))}
                                                {wfDef.relevantAttributes.length > 0 && (
                                                  <div className="flex flex-wrap gap-0.5">
                                                    {wfDef.relevantAttributes.map((attr) => {
                                                      const isActive = !!rowAttrPreferences[attr];
                                                      const alabel = attr.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                                                      return (
                                                        <button key={attr} type="button" onClick={() => handleAttrChange(attr, !isActive)} className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${isActive ? "bg-primary/10 text-primary border-primary/20 font-medium" : "bg-transparent text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"}`} data-testid={`attr-chip-${item.id}-${attr}`}>{alabel}</button>
                                                      );
                                                    })}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                            <Select value={itemTier} onValueChange={(val) => { const newTier = val === catDef.tier ? null : val; changeItemTier.mutate({ id: item.id, tier: newTier }); }}>
                                              <SelectTrigger className={`h-7 text-xs ${isOverridden ? 'border-amber-400' : ''}`} data-testid={`select-item-tier-${item.id}`}>
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {tierOptions.map(key => <SelectItem key={key} value={key}>{EXTENDED_TIER_LABELS[key]?.label || key}</SelectItem>)}
                                              </SelectContent>
                                            </Select>
                                            {hasPrices && (
                                              <div className="flex items-center gap-1" data-testid={`select-shop-${item.id}`}>
                                                <Select value={item.selectedStore || 'auto'} onValueChange={(val) => { updateItem.mutate({ id: item.id, fields: { selectedStore: val === 'auto' ? null : val } }); setGlobalStore('auto'); }}>
                                                  <SelectTrigger className={`h-6 text-xs ${item.selectedStore ? 'border-amber-400' : ''}`} data-testid={`select-store-${item.id}`}>
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="auto"><span className="flex items-center gap-1"><TrendingDown className="h-3 w-3" />{isBranded ? 'Choose' : 'Auto'}</span></SelectItem>
                                                    {availableStores.map(store => {
                                                      const storeMatch = itemPrices?.get(store);
                                                      const isKnown = knownStores.includes(store);
                                                      return (
                                                        <SelectItem key={store} value={store}>
                                                          <span className="flex items-center gap-1">
                                                            {isBranded && isKnown && <Check className="h-3 w-3 text-green-500 flex-shrink-0" />}
                                                            {store}{storeMatch?.price ? ` £${storeMatch.price.toFixed(2)}` : ''}
                                                          </span>
                                                        </SelectItem>
                                                      );
                                                    })}
                                                  </SelectContent>
                                                </Select>
                                                {isBranded && item.selectedStore && (() => {
                                                  const storeMatch = itemPrices?.get(item.selectedStore);
                                                  return storeMatch?.productUrl ? (
                                                    <a href={storeMatch.productUrl} target="_blank" rel="noopener noreferrer">
                                                      <Button variant="ghost" size="icon" className="h-6 w-6" data-testid={`button-store-link-${item.id}`}><ExternalLink className="h-3 w-3" /></Button>
                                                    </a>
                                                  ) : null;
                                                })()}
                                              </div>
                                            )}
                                          </div>
                                        </PopoverContent>
                                      </Popover>
                                    </td>

                                    <td className="px-1.5 py-1">
                                      {hasPrices ? (selectedMatch ? (
                                          <div className="flex items-start gap-1.5">
                                            {selectedMatch.imageUrl && <img src={selectedMatch.imageUrl} alt={selectedMatch.productName} className="w-7 h-7 rounded object-cover flex-shrink-0 mt-0.5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} data-testid={`img-product-${item.id}`} />}
                                            <div className="min-w-0">
                                              <div className="flex items-center gap-1.5 flex-wrap">
                                                <p className="text-xs text-foreground overflow-hidden text-ellipsis whitespace-nowrap" data-testid={`text-product-name-${item.id}`}>{selectedMatch.productName}</p>
                                                {isWF && wfConfLabel && (
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <span className={`inline-flex items-center text-[10px] font-medium px-1 py-0.5 rounded border cursor-default flex-shrink-0 ${wfConfLabel.colorClass} ${wfConfLabel.bgClass}`} data-testid={`confidence-badge-${item.id}`}>
                                                        {confShortLabel[wfConfLevel ?? ''] ?? wfConfLabel.label}
                                                      </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                      <p className="text-xs">{wfConfLabel.label}</p>
                                                    </TooltipContent>
                                                  </Tooltip>
                                                )}
                                              </div>
                                              {selectedMatch.productWeight && <p className="text-[10px] text-muted-foreground">{selectedMatch.productWeight}</p>}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-muted-foreground">-</span>
                                            {isWF && wfConfLabel && (
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <span className={`inline-flex items-center text-[10px] font-medium px-1 py-0.5 rounded border cursor-default ${wfConfLabel.colorClass} ${wfConfLabel.bgClass}`} data-testid={`confidence-badge-${item.id}`}>
                                                    {confShortLabel[wfConfLevel ?? ''] ?? wfConfLabel.label}
                                                  </span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p className="text-xs">{wfConfLabel.label}</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            )}
                                          </div>
                                        )
                                      ) : <span className="text-muted-foreground">-</span>}
                                      {hasPrices && showHint && (
                                        <div className="flex items-center gap-1 mt-0.5">
                                          <span className="text-[10px] text-amber-600 dark:text-amber-400" data-testid={`text-tha-pick-${item.id}`}>⭐ {topPick.productName}</span>
                                          <button className="text-[10px] text-primary hover:underline font-medium" onClick={() => updateItem.mutate({ id: item.id, fields: { matchedStore: topPick.retailer, matchedProductId: null, matchedPrice: null } })} data-testid={`button-use-tha-pick-${item.id}`}>[Use]</button>
                                        </div>
                                      )}
                                    </td>

                                    <td className="px-1.5 py-1 tabular-nums text-muted-foreground">
                                      {isEditing && editState?.field === 'quantityValue' ? (
                                        <div className="flex items-center gap-1 justify-end">
                                          <Input type="number" value={editState.value} onChange={(e) => setEditState({ ...editState, value: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} className="h-7 text-xs w-16 text-right" autoFocus data-testid={`input-edit-qty-${item.id}`} />
                                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={saveEdit}><Check className="h-3 w-3" /></Button>
                                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEdit}><X className="h-3 w-3" /></Button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-center gap-0.5">
                                          {showStepper && <button
                                            onClick={() => updateItem.mutate({ id: item.id, fields: { quantityValue: Math.max(0, (combinedQtyValue ?? item.quantityValue ?? 0) - 1) } })}
                                            className="h-4 w-4 flex-shrink-0 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-opacity duration-150 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                                            data-testid={`button-qty-minus-${item.id}`}
                                          ><Minus className="h-2.5 w-2.5" /></button>}
                                          <span className="cursor-pointer tabular-nums whitespace-nowrap px-0.5" onClick={() => startEdit(item.id, 'quantityValue', String(item.quantityValue || 0))} data-testid={`text-item-qty-${item.id}`}>{qty} {unitLabel}</span>
                                          {showStepper && <button
                                            onClick={() => updateItem.mutate({ id: item.id, fields: { quantityValue: (combinedQtyValue ?? item.quantityValue ?? 0) + 1 } })}
                                            className="h-4 w-4 flex-shrink-0 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-opacity duration-150 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                                            data-testid={`button-qty-plus-${item.id}`}
                                          ><Plus className="h-2.5 w-2.5" /></button>}
                                        </div>
                                      )}
                                    </td>

                                    <td className="px-1.5 py-1 text-right" data-testid={`text-price-${item.id}`}>
                                      {hasPrices ? (
                                        <div className="flex items-center gap-1 justify-end">
                                          {selectedPrice !== null && selectedPrice !== undefined ? (
                                            <span className={`tabular-nums cursor-pointer ${isBestPrice ? 'text-primary font-semibold' : 'text-foreground'}`} onClick={() => setComparisonItem(item)}>£{selectedPrice.toFixed(2)}</span>
                                          ) : (
                                            <span className="text-muted-foreground cursor-pointer" onClick={() => setComparisonItem(item)}>-</span>
                                          )}
                                          {isBestPrice && <span className="text-[10px] bg-secondary text-secondary-foreground px-1 py-0.5 rounded font-semibold">Best</span>}
                                        </div>
                                      ) : <span className="text-muted-foreground">-</span>}
                                    </td>

                                    <td className="px-1.5 py-1 text-center hidden sm:table-cell" data-testid={`text-smp-${item.id}`}>
                                      {hasPrices ? (() => {
                                        const smp = getItemThaRating(item.id, item);
                                        if (smp === 0) return <span className="text-muted-foreground">-</span>;
                                        return <AppleRating rating={smp} size="small" />;
                                      })() : <span className="text-muted-foreground">-</span>}
                                    </td>

                                    <td className="px-1.5 py-1 text-center hidden sm:table-cell" data-testid={`meal-count-${item.id}`}>
                                      {(() => {
                                        const hasPantry = isPantry;
                                        const hasRecipes = sources.length > 0;
                                        if (hasPantry && hasRecipes) {
                                          return (
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <span className="cursor-default text-xs text-muted-foreground" data-testid={`badge-meal-${item.id}`}>🏠 + 🍽 {sources.length}</span>
                                              </TooltipTrigger>
                                              <TooltipContent side="bottom" className="max-w-[220px]">
                                                <p className="text-xs font-medium mb-1">Pantry item also used in {sources.length} recipe(s):</p>
                                                {sources.map((s, idx) => <p key={idx} className="text-xs text-muted-foreground">{s.mealName}{s.quantityMultiplier > 1 ? ` (x${s.quantityMultiplier})` : ''}</p>)}
                                              </TooltipContent>
                                            </Tooltip>
                                          );
                                        }
                                        if (hasPantry && !hasRecipes) {
                                          return (
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <span className="cursor-default text-xs text-muted-foreground" data-testid={`badge-meal-${item.id}`}>🏠</span>
                                              </TooltipTrigger>
                                              <TooltipContent side="bottom">
                                                <p className="text-xs">Added from pantry</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          );
                                        }
                                        if (!hasPantry && hasRecipes) {
                                          return (
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <span className="cursor-default text-xs text-muted-foreground" data-testid={`badge-meal-${item.id}`}>🍽 {sources.length}</span>
                                              </TooltipTrigger>
                                              <TooltipContent side="bottom" className="max-w-[220px]">
                                                <p className="text-xs font-medium mb-1">Used in {sources.length} recipe(s):</p>
                                                {sources.map((s, idx) => <p key={idx} className="text-xs text-muted-foreground">{s.mealName}{s.quantityMultiplier > 1 ? ` (x${s.quantityMultiplier})` : ''}</p>)}
                                              </TooltipContent>
                                            </Tooltip>
                                          );
                                        }
                                        return <span className="text-muted-foreground">-</span>;
                                      })()}
                                    </td>

                                    <td className="px-1.5 py-1 sticky right-0 z-10">
                                      <div className={`flex items-center justify-end gap-0.5 transition-opacity duration-150 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100${item.checked ? ' md:opacity-100' : ''}`}>
                                        <Checkbox
                                          checked={item.checked || false}
                                          onCheckedChange={(checked) => toggleChecked.mutate({ id: item.id, checked: !!checked })}
                                          className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                          data-testid={`checkbox-item-${item.id}`}
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => setAnalyseItem(item)} className="text-muted-foreground h-7 w-7 hidden sm:inline-flex" data-testid={`button-analyse-${item.id}`}><Microscope className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => setCorrectItem(item)} className="text-muted-foreground h-7 w-7 hidden sm:inline-flex" data-testid={`button-edit-${item.id}`}><Pencil className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => removeItem.mutate(item.id)} className="text-muted-foreground h-7 w-7" data-testid={`button-remove-${item.id}`}><Trash2 className="h-3 w-3" /></Button>
                                      </div>
                                    </td>
                                  </motion.tr>
                                );
                              })}
                            </AnimatePresence>
                            {/* Extras rows for this category */}
                            {catExtras.map(extra => (
                              <tr key={`extra-${extra.id}`} className={`border-b border-border/30 ${extra.alwaysAdd ? 'bg-primary/3' : ''}`} data-testid={`row-extra-${extra.id}`}>
                                <td className="px-1.5 py-1.5 sticky left-0 z-10">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-medium text-foreground/80" data-testid={`text-extra-name-${extra.id}`}>{capitalizeWords(extra.name)}</span>
                                    <button
                                      className={`self-start inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border transition-colors ${extra.alwaysAdd ? 'border-primary/60 text-primary bg-primary/10 hover:bg-primary/20' : 'border-border text-muted-foreground/60 bg-transparent hover:border-primary/40 hover:text-primary/60'}`}
                                      onClick={() => extra.alwaysAdd ? setAlwaysAddModal({ extraId: extra.id, extraName: extra.name }) : updateExtraMutation.mutate({ id: extra.id, alwaysAdd: true })}
                                      data-testid={`pill-always-${extra.id}`}
                                    >Always in Basket</button>
                                  </div>
                                </td>
                                <td className="px-1.5 py-1.5 text-muted-foreground hidden sm:table-cell">-</td>
                                <td className="px-1.5 py-1.5 text-muted-foreground">-</td>
                                <td className="px-1.5 py-1.5 text-muted-foreground">-</td>
                                <td className="px-1.5 py-1.5 text-muted-foreground">-</td>
                                <td className="px-1.5 py-1.5 text-muted-foreground">-</td>
                                <td className="px-1.5 py-1.5 text-muted-foreground hidden sm:table-cell">-</td>
                                <td className="px-1.5 py-1.5 text-muted-foreground hidden sm:table-cell">-</td>
                                <td className="px-1.5 py-1.5 sticky right-0 z-10">
                                  <div className="flex items-center justify-end gap-0.5">
                                    <Checkbox checked={false} onCheckedChange={() => {}} className="border-muted" data-testid={`checkbox-extra-${extra.id}`} />
                                    <Button variant="ghost" size="icon" onClick={() => deleteExtraMutation.mutate(extra.id)} className="text-muted-foreground h-6 w-6" data-testid={`button-delete-extra-${extra.id}`}><Trash2 className="h-3 w-3" /></Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {/* Empty state row when no items at all */}
                            {!hasContent && (
                              <tr>
                                <td colSpan={9} className="px-3 py-2 text-xs text-muted-foreground/50 italic">No {capitalizeWords(cat)} items yet</td>
                              </tr>
                            )}
                            {/* Category totals row */}
                            {hasContent && (() => {
                              const catPriceTotal = hasPrices ? catItems.reduce((sum, itm) => {
                                const catDef = getCategoryDefault(cat);
                                const cheapest = getCheapestForItem(itm.id);
                                const selStore = itm.selectedStore || catDef.supermarket || cheapest?.supermarket || '';
                                const match = selStore ? pricesByItem.get(itm.id)?.get(selStore) : null;
                                return sum + (match?.price ?? 0);
                              }, 0) : null;
                              const catRatings = catItems.map(i => getItemThaRating(i.id, i)).filter(r => r > 0);
                              const catAvgRating = catRatings.length > 0 ? catRatings.reduce((a, b) => a + b, 0) / catRatings.length : null;
                              const totalCount = catItems.length + catExtras.length;
                              return (
                                <tr className="border-t border-border/60 bg-muted/20 font-medium">
                                  <td colSpan={4} className="px-1.5 py-1 text-right text-[10px] text-muted-foreground sticky left-0 z-10 bg-muted/20">
                                    {totalCount} {totalCount === 1 ? 'item' : 'items'}
                                  </td>
                                  <td className="px-1.5 py-1" />
                                  <td className="px-1.5 py-1 text-right tabular-nums text-xs">
                                    {catPriceTotal !== null && catPriceTotal > 0 ? `£${catPriceTotal.toFixed(2)}` : <span className="text-muted-foreground font-normal">-</span>}
                                  </td>
                                  <td className="px-1.5 py-1 text-center">
                                    {catAvgRating !== null ? <AppleRating rating={catAvgRating} size="small" showTooltip={false} /> : <span className="text-muted-foreground font-normal">-</span>}
                                  </td>
                                  <td colSpan={2} className="sticky right-0 z-10 bg-muted/20" />
                                </tr>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                      {/* Inline add panel for this category */}
                      {addingToCategory === cat ? (
                        <div className="flex flex-col gap-2 px-3 py-2 bg-muted/10 border-t border-border/30" data-testid={`add-panel-${cat}`}>
                          <div className="flex flex-wrap gap-1">
                            {(CATEGORY_COMMON_ITEMS[cat] || []).map(item => (
                              <button key={item} onClick={() => handleAddItem(item, cat)} className="text-[10px] px-2 py-0.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors" data-testid={`suggestion-${item.replace(/\s+/g, '-')}`}>{item}</button>
                            ))}
                          </div>
                          <div className="flex gap-1.5">
                            <Input
                              value={addItemInput}
                              onChange={e => setAddItemInput(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleAddItem(addItemInput, cat); if (e.key === 'Escape') { setAddingToCategory(null); setAddItemInput(''); } }}
                              placeholder={`Add ${cat} item…`}
                              className="h-6 text-xs flex-1"
                              autoFocus
                              data-testid={`input-add-${cat}`}
                            />
                            <Button size="sm" className="h-6 text-xs px-2" onClick={() => handleAddItem(addItemInput, cat)} data-testid={`button-confirm-add-${cat}`}>Add</Button>
                            <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => { setAddingToCategory(null); setAddItemInput(''); }}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setAddingToCategory(cat)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary px-3 py-1.5 w-full border-t border-border/20 hover:bg-muted/10 transition-colors" data-testid={`button-open-add-${cat}`}>
                          <Plus className="h-3 w-3" /> Add {capitalizeWords(cat)} item
                        </button>
                      )}
                      </>)}
                    </div>
                  );
                })}

                {/* Household section */}
                {(() => {
                  const householdSavedItems = sortedItems.filter(i => !isStaple(i) && isHousehold(i));
                  const householdExtras = shoppingExtras.filter(e => (e.inBasket || e.alwaysAdd) && e.category === 'household');
                  return (
                    <div className="border-t border-border/40">
                      {/* Household header */}
                      <div className="sticky top-0 z-10 flex items-center gap-3 py-1.5 px-3 bg-muted/80 border-y border-border text-xs backdrop-blur-sm" data-testid="category-header-household">
                        <button className="flex items-center gap-1.5 font-semibold min-w-[90px] hover:text-primary transition-colors" onClick={() => toggleCollapsed('household')} data-testid="button-collapse-household">
                          {collapsedCategories.has('household') ? <ChevronDown className="h-3 w-3 flex-shrink-0" /> : <ChevronUp className="h-3 w-3 flex-shrink-0" />}
                          <Home className="h-3 w-3" />
                          <span>Household</span>
                          {(householdSavedItems.length + householdExtras.length) > 0 && <span className="text-muted-foreground font-normal">({householdSavedItems.length + householdExtras.length})</span>}
                        </button>
                        <span className="text-[10px] text-muted-foreground/70 ml-auto italic">Not included in basket totals</span>
                      </div>
                      {!collapsedCategories.has('household') && (<>
                      {/* Subcategories */}
                      {HOUSEHOLD_SUBCAT_KEYS.map(subcat => {
                        const subcatSaved = householdSavedItems.filter(i => getHouseholdSubcategory(i.normalizedName ?? i.productName) === subcat);
                        const subcatExtras = householdExtras.filter(e => getHouseholdSubcategory(e.name) === subcat);
                        if (subcatSaved.length === 0 && subcatExtras.length === 0) return null;
                        return (
                          <div key={subcat}>
                            <div className="flex items-center gap-2 px-3 py-1 bg-muted/15 border-b border-border/30">
                              <span className="text-[10px] font-medium text-muted-foreground">{HOUSEHOLD_SUBCATEGORY_LABELS[subcat]}</span>
                              <span className="text-[10px] text-muted-foreground/50">({subcatSaved.length + subcatExtras.length})</span>
                            </div>
                            <table className="w-full text-xs table-fixed">
                              <colgroup>
                                <col style={{ width: 210 }} />
                                <col style={{ width: 80 }} />
                                <col style={{ width: 150 }} />
                                <col style={{ width: 200 }} />
                                <col style={{ width: 70 }} />
                                <col style={{ width: 95 }} />
                                <col style={{ width: 110 }} />
                                <col style={{ width: 80 }} />
                                <col style={{ width: 90 }} />
                              </colgroup>
                              <tbody>
                                {subcatSaved.map(item => {
                                  const { qty, unitLabel } = formatQty(item.quantityValue, item.unit, measurementPref, item.quantityInGrams);
                                  return (
                                    <tr key={`hh-saved-${item.id}`} className={`border-b border-border/30 ${item.checked ? 'opacity-50' : ''}`} data-testid={`row-household-${item.id}`}>
                                      <td className="px-1.5 py-1.5 sticky left-0 z-10">
                                        <span className={`font-medium ${item.checked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{capitalizeWords(item.productName)}</span>
                                        {item.quantity > 1 && <Badge variant="secondary" className="text-[10px] ml-1">x{item.quantity}</Badge>}
                                      </td>
                                      <td className="px-1.5 py-1.5 text-muted-foreground">-</td>
                                      <td className="px-1.5 py-1.5 text-muted-foreground">-</td>
                                      <td className="px-1.5 py-1.5 text-muted-foreground">-</td>
                                      <td className="px-1.5 py-1.5 text-right text-muted-foreground tabular-nums whitespace-nowrap">{qty} {unitLabel}</td>
                                      <td className="px-1.5 py-1.5 text-muted-foreground">-</td>
                                      <td className="px-1.5 py-1.5 text-muted-foreground">-</td>
                                      <td className="px-1.5 py-1.5 text-muted-foreground">-</td>
                                      <td className="px-1.5 py-1.5 sticky right-0 z-10">
                                        <div className="flex items-center justify-end gap-0.5">
                                          <Checkbox checked={item.checked || false} onCheckedChange={(checked) => toggleChecked.mutate({ id: item.id, checked: !!checked })} className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" data-testid={`checkbox-household-${item.id}`} />
                                          <Button variant="ghost" size="icon" onClick={() => removeItem.mutate(item.id)} className="text-muted-foreground h-6 w-6" data-testid={`button-remove-household-${item.id}`}><Trash2 className="h-3 w-3" /></Button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                                {subcatExtras.map(extra => (
                                  <tr key={`hh-extra-${extra.id}`} className="border-b border-border/30" data-testid={`row-hh-extra-${extra.id}`}>
                                    <td className="px-1.5 py-1.5 sticky left-0 z-10">
                                      <div className="flex flex-col gap-0.5">
                                        <span className="font-medium text-foreground/80">{capitalizeWords(extra.name)}</span>
                                        <button
                                          className={`self-start inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border transition-colors ${extra.alwaysAdd ? 'border-primary/60 text-primary bg-primary/10 hover:bg-primary/20' : 'border-border text-muted-foreground/60 bg-transparent hover:border-primary/40 hover:text-primary/60'}`}
                                          onClick={() => extra.alwaysAdd ? setAlwaysAddModal({ extraId: extra.id, extraName: extra.name }) : updateExtraMutation.mutate({ id: extra.id, alwaysAdd: true })}
                                          data-testid={`pill-always-hh-${extra.id}`}
                                        >Always in Basket</button>
                                      </div>
                                    </td>
                                    <td className="px-1.5 py-1.5 text-muted-foreground">-</td>
                                    <td className="px-1.5 py-1.5 text-muted-foreground">-</td>
                                    <td className="px-1.5 py-1.5 text-muted-foreground">-</td>
                                    <td className="px-1.5 py-1.5 text-muted-foreground">-</td>
                                    <td className="px-1.5 py-1.5 text-muted-foreground">-</td>
                                    <td className="px-1.5 py-1.5 text-muted-foreground">-</td>
                                    <td className="px-1.5 py-1.5 text-muted-foreground">-</td>
                                    <td className="px-1.5 py-1.5 sticky right-0 z-10">
                                      <div className="flex items-center justify-end gap-0.5">
                                        <Checkbox checked={false} onCheckedChange={() => {}} className="border-muted" />
                                        <Button variant="ghost" size="icon" onClick={() => deleteExtraMutation.mutate(extra.id)} className="text-muted-foreground h-6 w-6" data-testid={`button-delete-hh-extra-${extra.id}`}><Trash2 className="h-3 w-3" /></Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })}
                      {/* Household add panel */}
                      {addingToCategory === 'household' ? (
                        <div className="flex flex-col gap-2 px-3 py-2 bg-muted/10 border-t border-border/30" data-testid="add-panel-household">
                          <div className="flex flex-wrap gap-1">
                            {CATEGORY_COMMON_ITEMS.household.map(item => (
                              <button key={item} onClick={() => handleAddItem(item, 'household')} className="text-[10px] px-2 py-0.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors">{item}</button>
                            ))}
                          </div>
                          <div className="flex gap-1.5">
                            <Input value={addItemInput} onChange={e => setAddItemInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddItem(addItemInput, 'household'); if (e.key === 'Escape') { setAddingToCategory(null); setAddItemInput(''); } }} placeholder="Add household item…" className="h-6 text-xs flex-1" autoFocus data-testid="input-add-household" />
                            <Button size="sm" className="h-6 text-xs px-2" onClick={() => handleAddItem(addItemInput, 'household')} data-testid="button-confirm-add-household">Add</Button>
                            <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => { setAddingToCategory(null); setAddItemInput(''); }}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setAddingToCategory('household')} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary px-3 py-1.5 w-full border-t border-border/20 hover:bg-muted/10 transition-colors" data-testid="button-open-add-household">
                          <Plus className="h-3 w-3" /> Add household item
                        </button>
                      )}
                      </>)}
                    </div>
                  );
                })()}

                {/* Staples */}
                {sortedItems.some(i => isStaple(i)) && (
                  <div className="mt-1 border-t border-border/40">
                    <button className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground w-full text-left px-3 py-2" onClick={() => setStaplesOpen(o => !o)} data-testid="button-toggle-staples">
                      {staplesOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      Staples - usually in stock ({sortedItems.filter(i => isStaple(i)).length})
                    </button>
                    {staplesOpen && (
                      <table className="w-full text-xs">
                        <tbody>
                          {sortedItems.filter(i => isStaple(i)).map(item => {
                            const { qty, unitLabel } = formatQty(item.quantityValue, item.unit, measurementPref, item.quantityInGrams);
                            const cat = item.category || 'other';
                            const CatIcon = CATEGORY_ICONS[cat] || CircleDot;
                            const sources = sourcesByItem.get(item.id) || [];
                            return (
                              <tr key={`staple-${item.id}`} className="border-b border-border/30 bg-muted/5 opacity-60" data-testid={`row-staple-${item.id}`}>
                                <td className="px-2 py-1 w-7" />
                                <td className="px-2 py-1">
                                  <div className="flex items-center gap-1.5">
                                    <CatIcon className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground line-through">{item.productName}</span>
                                    {sources.length > 0 && <span className="text-[10px] text-muted-foreground">🍽 {sources.length}</span>}
                                    <button className="ml-2 text-[10px] text-primary hover:underline whitespace-nowrap" onClick={() => toggleNeededThisWeek(item.id)} data-testid={`button-need-this-week-${item.id}`}>Need this week ↑</button>
                                  </div>
                                </td>
                                <td className="px-2 py-1 text-right text-muted-foreground tabular-nums">{qty} {unitLabel}</td>
                                <td colSpan={99} />
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Basket Totals - integrated table footer using same grid */}
            {savedItems.length > 0 && (
              <div className="overflow-x-auto border-t-2 border-border" data-testid="section-basket-totals">
                <table className="w-full text-xs table-fixed">
                  <colgroup>
                    <col style={{ width: 210 }} />
                    <col style={{ width: 80 }} />
                    <col style={{ width: 150 }} />
                    <col style={{ width: 200 }} />
                    <col style={{ width: 70 }} />
                    <col style={{ width: 95 }} />
                    <col style={{ width: 110 }} />
                    <col style={{ width: 80 }} />
                    <col style={{ width: 90 }} />
                  </colgroup>
                  <tbody>
                    <tr className="bg-muted/30 font-semibold">
                      <td colSpan={4} className="px-1.5 py-1.5 text-right text-xs font-semibold text-muted-foreground sticky left-0 z-10 bg-muted/30">
                        Basket total · {savedItems.length} {savedItems.length === 1 ? 'item' : 'items'}
                        {overallConfidence !== null && (
                          <span className={`ml-2 font-normal ${overallConfidence === 'high' ? 'text-green-600 dark:text-green-400' : overallConfidence === 'medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500 dark:text-red-400'}`}>
                            · {overallConfidence === 'high' ? 'High' : overallConfidence === 'medium' ? 'Medium' : 'Low'} confidence
                          </span>
                        )}
                      </td>
                      <td className="px-1.5 py-1.5" />
                      <td className="px-1.5 py-1.5 text-right tabular-nums" data-testid="text-basket-total-price">
                        {clientBestTotal !== null ? `£${clientBestTotal.toFixed(2)}` : <span className="text-muted-foreground font-normal">-</span>}
                      </td>
                      <td className="px-1.5 py-1.5 text-center" data-testid="text-basket-avg-smp">
                        {avgThaRating !== null ? <AppleRating rating={avgThaRating} size="small" showTooltip={false} /> : <span className="text-muted-foreground font-normal">-</span>}
                      </td>
                      <td colSpan={2} className="sticky right-0 z-10 bg-muted/30" />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>

          {!hasPrices && savedItems.length > 0 && !lookupPrices.isPending && (
            <div className="border-t border-border p-4 bg-muted/10 text-center">
              <p className="text-sm text-muted-foreground">
                Click "Match Products" to find real grocery products and compare prices across supermarkets.
              </p>
            </div>
          )}

          {/* Comparison Strip */}
          {hasPrices && selectedRetailers.length > 0 && savedItems.length > 0 && (
            <div className="border-t border-border px-4 py-4 bg-muted/5" data-testid="section-comparison-strip">
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 mb-3">Price Comparison</p>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="text-xs" style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: '480px' }} data-testid="table-comparison-strip">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap sticky left-0 z-20 bg-muted/30 border-b border-r border-border">Shop</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground whitespace-nowrap border-b border-border">Budget</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground whitespace-nowrap border-b border-border">Standard</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground whitespace-nowrap border-b border-border">Premium</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground whitespace-nowrap border-b border-border">Organic</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground whitespace-nowrap sticky right-0 z-20 bg-muted/30 border-b border-l border-border">Current</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRetailers.map(retailer => (
                      <tr key={retailer} className="group" data-testid={`row-comparison-${retailer.replace(/[\s']/g, '-').toLowerCase()}`}>
                        <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap sticky left-0 z-10 bg-background border-b border-r border-border/50 group-hover:bg-muted/20">{retailer}</td>
                        {(['budget', 'standard', 'premium', 'organic'] as const).map(tier => {
                          const val = comparisonMatrix[retailer]?.[tier] ?? 0;
                          return <td key={tier} className="px-3 py-2 text-right tabular-nums text-foreground border-b border-border/50">{val > 0 ? `£${val.toFixed(2)}` : '-'}</td>;
                        })}
                        <td className="px-3 py-2 text-right tabular-nums font-semibold text-foreground whitespace-nowrap sticky right-0 z-10 bg-background border-b border-l border-border/50 group-hover:bg-muted/20">
                          {(currentByRetailer[retailer] ?? 0) > 0 ? `£${(currentByRetailer[retailer] ?? 0).toFixed(2)}` : '-'}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-muted/20" data-testid="row-comparison-difference">
                      <td className="px-3 py-2 font-medium text-muted-foreground whitespace-nowrap sticky left-0 z-10 bg-muted/20 border-b border-r border-border/50">vs Current</td>
                      {(['budget', 'standard', 'premium', 'organic'] as const).map(tier => {
                        const minVal = Math.min(...selectedRetailers.map(r => comparisonMatrix[r]?.[tier] ?? 0).filter(v => v > 0));
                        if (!isFinite(minVal)) return <td key={tier} className="px-3 py-2 text-right tabular-nums text-muted-foreground border-b border-border/50">-</td>;
                        const diff = minVal - currentTotal;
                        const isPositive = diff > 0;
                        return (
                          <td key={tier} className={`px-3 py-2 text-right tabular-nums font-medium border-b border-border/50 ${isPositive ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {isPositive ? '+' : ''}{diff.toFixed(2)}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-right tabular-nums font-semibold sticky right-0 z-10 bg-muted/20 border-b border-l border-border/50">
                        {currentTotal > 0 ? `£${currentTotal.toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>

        {/* Shop Mode — inline below basket */}
        {shopModeOpen && (
          <ShopModeView
            items={savedItems}
            allPriceMatches={allPriceMatches}
            thaPicks={thaPicks}
            pantryKeySet={pantryKeySet}
            initialStore={globalStore !== 'auto' ? globalStore : undefined}
            initialPhase={quickListLabel ? "cupboard" : undefined}
            onUpdateStatus={(id, status) => updateItem.mutate({ id, fields: { shopStatus: status } })}
            onRenameItem={handleRenameItem}
            onRemoveItem={id => removeItem.mutate(id)}
          />
        )}
        </div>{/* end basket view wrapper */}

        {/* ── Shop view — inline, app shell stays intact ───────────────────── */}
        {viewMode === "shop" && (
          <ShoppingListView
            items={savedItems}
            extras={shoppingExtras}
            sourcesByItem={sourcesByItem}
            pantryKeySet={pantryKeySet}
            measurementPref={measurementPref}
            allPriceMatches={allPriceMatches}
            thaPicks={thaPicks}
            initialStore={globalStore !== 'auto' ? globalStore : undefined}
            initialPhase="cupboard_check"
            onUpdateStatus={(id, status) => updateItem.mutate({ id, fields: { shopStatus: status } })}
            onRenameItem={handleRenameItem}
            onRemoveItem={id => removeItem.mutate(id)}
            onAddItem={(rawText) => addItem.mutate(rawText)}
            onMatchStore={(store) => lookupPrices.mutate(store)}
            isMatchingPrices={lookupPrices.isPending}
            onClose={() => setViewMode("basket")}
          />
        )}
      </div>


      {/* Always in Basket confirmation modal */}
      <Dialog open={!!alwaysAddModal} onOpenChange={(open) => { if (!open) setAlwaysAddModal(null); }}>
        <DialogContent className="max-w-sm" data-testid="dialog-always-add">
          <DialogHeader>
            <DialogTitle>Turn off "Always in Basket"?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{alwaysAddModal ? capitalizeWords(alwaysAddModal.extraName) : ''}</span> will no longer be added automatically to future baskets. It will stay in your current basket.
          </p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setAlwaysAddModal(null)} data-testid="button-always-no">No, keep it</Button>
            <Button
              onClick={() => {
                if (!alwaysAddModal) return;
                updateExtraMutation.mutate({ id: alwaysAddModal.extraId, alwaysAdd: false });
                setAlwaysAddModal(null);
              }}
              data-testid="button-always-yes"
            >
              Yes, turn off
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!comparisonItem} onOpenChange={(open) => { if (!open) setComparisonItem(null); }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto" data-testid="dialog-price-comparison">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Price Comparison: {comparisonItem ? capitalizeWords(comparisonItem.productName) : ''}
            </DialogTitle>
          </DialogHeader>

          {comparisonItem && (
            <div className="space-y-6">
              {SUPERMARKET_NAMES.map(store => {
                const storeMatches = comparisonMatches.filter(m => m.supermarket === store);
                if (storeMatches.length === 0) return null;
                return (
                  <div key={store}>
                    <h3 className="font-semibold text-base mb-3 border-b border-border pb-2">{store}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {storeMatches.map((match, idx) => {
                        const mTierInfo = TIER_LABELS[match.tier] || TIER_LABELS.standard;
                        const TierIcon = mTierInfo.icon;
                        const itemTier = comparisonItem ? getItemTier(comparisonItem) : currentTier;

                        return (
                          <Card key={idx} className={`${match.tier === itemTier ? 'border-primary' : ''}`}>
                            <CardContent className="p-4">
                              <div className="flex gap-3">
                                {match.imageUrl && (
                                  <img
                                    src={match.imageUrl}
                                    alt={match.productName}
                                    className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate" data-testid={`comparison-product-${idx}`}>
                                    {match.productName}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <Badge variant="outline" className="text-[10px]">
                                      <TierIcon className="h-3 w-3 mr-1" />
                                      {mTierInfo.label}
                                    </Badge>
                                    {match.productWeight && (
                                      <span className="text-xs text-muted-foreground">{match.productWeight}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className={`text-lg font-semibold tabular-nums ${match.tier === itemTier ? 'text-primary' : 'text-foreground'}`}>
                                      {match.price !== null ? `\u00A3${match.price.toFixed(2)}` : '-'}
                                    </span>
                                    {match.pricePerUnit && (
                                      <span className="text-xs text-muted-foreground">{match.pricePerUnit}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {match.productUrl && (
                                      <a
                                        href={match.productUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary inline-flex items-center gap-1"
                                      >
                                        View on {store}
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                    {match.tier !== itemTier && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs h-6 px-2"
                                        onClick={() => {
                                          changeItemTier.mutate({ id: comparisonItem.id, tier: match.tier === currentTier ? null : match.tier });
                                        }}
                                        data-testid={`button-select-tier-${match.tier}-${idx}`}
                                      >
                                        Select this tier
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={basketDialogOpen} onOpenChange={(open) => { setBasketDialogOpen(open); if (!open) setBasketResult(null); }}>
        <DialogContent className="sm:max-w-[560px]" data-testid="dialog-send-to-supermarket">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Send to Supermarket
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Send your {savedItems.length} items to a supermarket. Matched products open directly; others open as search pages.
            </p>

            {primarySupermarkets.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground/70">Direct Basket</p>
                <div className="grid grid-cols-3 gap-3">
                  {primarySupermarkets.map(store => (
                    <button
                      key={store.key}
                      className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-3.5 hover:bg-accent/40 transition-colors disabled:opacity-50"
                      disabled={basketSending !== null}
                      onClick={() => handleSendBasket(store.name)}
                      data-testid={`button-basket-${store.key}`}
                    >
                      {basketSending === store.name ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <RetailerLogo name={store.name} size="h-7" />
                      )}
                      <span className="text-xs font-medium text-foreground/70">{store.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {otherSupermarkets.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground/70">Search Pages</p>
                <div className="grid grid-cols-3 gap-2">
                  {otherSupermarkets.map(store => (
                    <button
                      key={store.key}
                      className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-2 py-2.5 hover:bg-accent/40 transition-colors disabled:opacity-50"
                      disabled={basketSending !== null}
                      onClick={() => handleSendBasket(store.name)}
                      data-testid={`button-basket-${store.key}`}
                    >
                      {basketSending === store.name ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      ) : (
                        <RetailerLogo name={store.name} size="h-5" />
                      )}
                      <span className="text-[11px] font-medium text-foreground/70 truncate w-full text-center">{store.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {basketResult && (
              <div className="border border-border rounded-md p-3 space-y-2 bg-muted/30">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{basketResult.supermarket} Basket</span>
                  {basketResult.estimatedTotal && (
                    <Badge variant="secondary" className="text-xs">
                      Est. total: {basketResult.estimatedTotal.toFixed(2)}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{basketResult.message}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{basketResult.matchedCount} product links</span>
                  <span className="text-muted-foreground">{basketResult.totalCount - basketResult.matchedCount} search pages</span>
                </div>
                {basketResult.itemUrls.length > 8 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 w-full"
                    onClick={() => {
                      const remaining = basketResult.itemUrls.slice(8);
                      for (const item of remaining) {
                        window.open(item.url, '_blank');
                      }
                      toast({ title: "Opened remaining items", description: `Opened ${remaining.length} more product pages.` });
                    }}
                    data-testid="button-open-remaining-items"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open remaining {basketResult.itemUrls.length - 8} items
                  </Button>
                )}
              </div>
            )}

            <div className="border-t border-border pt-3 flex items-center gap-2">
              <Download className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                Want a text file instead?{' '}
                <button
                  className="text-primary underline-offset-2 underline"
                  onClick={() => { setBasketDialogOpen(false); setExportDialogOpen(true); }}
                  data-testid="link-export-text-from-basket"
                >
                  Download formatted list
                </button>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-[420px]" data-testid="dialog-export-list">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Export Basket
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Choose Supermarket</label>
              <Select value={exportSupermarket} onValueChange={setExportSupermarket}>
                <SelectTrigger data-testid="select-export-supermarket">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPERMARKET_NAMES.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Export your {savedItems.length} items as a formatted text file, or open product search pages directly.
            </p>
          </div>
          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="outline" onClick={copyToClipboard} className="gap-1" data-testid="button-copy-clipboard">
              <Copy className="h-4 w-4" />
              Copy to Clipboard
            </Button>
            <Button variant="outline" onClick={() => handleExport('list')} className="gap-1" data-testid="button-export-text">
              <Download className="h-4 w-4" />
              Download List
            </Button>
            <Button onClick={() => handleExport('links')} className="gap-1" data-testid="button-export-links">
              <ExternalLink className="h-4 w-4" />
              Open Search Pages
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {correctItem && (
        <EditItemModal
          item={correctItem}
          sources={sourcesByItem.get(correctItem.id) || []}
          onClose={() => setCorrectItem(null)}
        />
      )}

      {analyseItem && (
        <ProductAnalyseModal
          open={!!analyseItem}
          onOpenChange={(v) => { if (!v) setAnalyseItem(null); }}
          item={analyseItem}
          preferredStore={globalStore !== 'auto' ? globalStore : undefined}
        />
      )}

    </div>
  );
}
