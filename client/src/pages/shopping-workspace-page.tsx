import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { useUser } from "@/hooks/use-user";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ShoppingBasket,
  FlaskConical, Leaf, AlertTriangle, Home,
  CheckCircle2, ClipboardList, ShoppingCart, ShoppingBag, Clock,
  RefreshCw, Scale, Search, ScanLine, Maximize2, Minimize2,
  Download, ExternalLink, Trash2, Columns2, Copy, Store, Check, Plus,
} from "lucide-react";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { formatItemDisplay, formatQuantityMetric, formatQuantityImperial, getLiquidDisplayMl } from "@/lib/unit-display";
import { deriveQuantityConfidence } from "@/lib/quantity-confidence";
import ScoreBadge from "@/components/ui/score-badge";
import { canShowScoreForItem } from "@/lib/basket-item-classifier";
import type { ShoppingListItem, IngredientSource } from "@shared/schema";
import { WorkspaceAnalyserSheet } from "@/components/WorkspaceAnalyserSheet";
import { PageHeader } from "@/components/PageHeader";
import thaAppleSrc from "@/assets/icons/tha-apple.png";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import RetailerLogo from "@/components/RetailerLogo";
import { CameraModal } from "@/components/camera-modal";
import { ShoppingListScanReview, type ShoppingListScanData } from "@/components/ShoppingListScanReview";

const SUPERMARKET_NAMES = ["Tesco", "Sainsbury's", "Asda", "Morrisons", "Aldi", "Lidl", "Waitrose", "Marks & Spencer", "Ocado"];

const SUPERMARKET_SEARCH_URLS: Record<string, string> = {
  "Tesco": "https://www.tesco.com/groceries/en-GB/search?query={query}",
  "Sainsbury's": "https://www.sainsburys.co.uk/gol-ui/SearchDisplayView?filters[keyword]={query}",
  "Asda": "https://groceries.asda.com/search/{query}",
  "Morrisons": "https://groceries.morrisons.com/search?entry={query}",
  "Waitrose": "https://www.waitrose.com/ecom/shop/search?&searchTerm={query}",
  "Ocado": "https://www.ocado.com/search?entry={query}",
  "Aldi": "https://www.aldi.co.uk/search?q={query}",
  "Lidl": "https://www.lidl.co.uk/p/q/{query}",
  "Marks & Spencer": "https://www.marksandspencer.com/l/food-and-wine?q={query}",
};

// ── Shopping unit options ─────────────────────────────────────────────────────
// UK-focused list for the inline quantity/unit editor. Reuses the canonical
// unit strings that formatQuantityMetric / formatQuantityImperial understand.
const SHOPPING_UNITS: { value: string; label: string }[] = [
  { value: "",        label: "— no unit —" },
  { value: "g",       label: "g" },
  { value: "kg",      label: "kg" },
  { value: "ml",      label: "ml" },
  { value: "L",       label: "L" },
  { value: "tsp",     label: "tsp" },
  { value: "tbsp",    label: "tbsp" },
  { value: "cup",     label: "cup" },
  { value: "oz",      label: "oz" },
  { value: "lb",      label: "lb" },
  { value: "piece",   label: "piece" },
  { value: "punnet",  label: "punnet" },
  { value: "jar",     label: "jar" },
  { value: "tin",     label: "tin" },
  { value: "can",     label: "can" },
  { value: "pack",    label: "pack" },
  { value: "bag",     label: "bag" },
  { value: "bottle",  label: "bottle" },
  { value: "bunch",   label: "bunch" },
  { value: "clove",   label: "clove" },
  { value: "slice",   label: "slice" },
  { value: "sachet",  label: "sachet" },
  { value: "handful", label: "handful" },
];

// ── Types ─────────────────────────────────────────────────────────────────────

type WorkspaceMode = "review" | "prep" | "shop";

type WorkspaceItem = ShoppingListItem & {
  addedByDisplayName?: string | null;
  sources?: Array<{
    mealId: number;
    mealName: string;
    weekNumber?: number | null;
    dayOfWeek?: number | null;
    mealSlot?: string | null;
  }>;
};

// Pantry: "adjusting" is transient (input visible); resolves to "have_enough" or "need_to_buy"
type PantryDecision = "have_enough" | "need_to_buy" | "adjusting";
type QuantityDecision = "accepted" | "editing" | "later";

type PrepItemState = {
  pantryDecision?: PantryDecision;
  quantityDecision?: QuantityDecision;
  editValue?: string;
};

type PrepAction =
  | { type: "pantry"; decision: PantryDecision }
  | { type: "quantity"; decision: QuantityDecision }
  | { type: "editValue"; value: string }
  | { type: "editConfirm" }
  | { type: "clear" };

type SourceFilter = "all" | "planned" | "extras" | "home" | "quick_list";
type SortOrder = "default" | "apple_score" | "price" | "item" | "item_category";

type PrepSummary = {
  pantryTotal: number;
  pantryReviewed: number;
  uncertainTotal: number;
  uncertainResolved: number;
  attentionTotal: number;
  allPrepDone: boolean;
};

// Shop operational states — persisted via shopStatus field
type ShopItemState = "need" | "found" | "defer" | "have";

type ShopSummary = {
  needCount: number;
  foundCount: number;
  deferCount: number;
  haveCount: number;
  total: number;
};

// ── Constants ─────────────────────────────────────────────────────────────────


const MODES: Array<{
  id: WorkspaceMode;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  helper: string;
}> = [
  { id: "review", label: "Review", Icon: ClipboardList, helper: "Check your list before you go" },
  { id: "prep", label: "Prep", Icon: Home, helper: "Check what you have at home and confirm quantities" },
  { id: "shop", label: "Shop", Icon: ShoppingCart, helper: "In-store — track what you find, skip, or already have" },
];

// The UI reasons in ShopItemState, but the API only accepts the canonical
// shop_status values validated server-side (routes.ts). These helpers translate
// in both directions so Shop actions persist instead of 400-ing on legacy aliases.
const SHOP_STATE_TO_SERVER: Record<Exclude<ShopItemState, "need">, string> = {
  found: "in_basket",
  defer: "deferred",
  have: "already_got",
};

function toServerShopStatus(state: ShopItemState | null): string | null {
  if (state == null || state === "need") return null;
  return SHOP_STATE_TO_SERVER[state];
}

function getShopState(item: WorkspaceItem): ShopItemState {
  switch (item.shopStatus) {
    case "found":
    case "in_basket":
      return "found";
    case "defer":
    case "deferred":
      return "defer";
    case "have":
    case "already_got":
      return "have";
    default:
      return "need";
  }
}

const SHOP_STATE_CONFIG: Record<ShopItemState, {
  label: string;
  circleClass: string;
  labelClass: string;
  chipClass: string;
  groupClass: string;
}> = {
  need: {
    label: "Still need",
    circleClass: "border-muted-foreground/30 bg-transparent hover:border-emerald-400",
    labelClass: "text-muted-foreground",
    chipClass: "",
    groupClass: "text-foreground",
  },
  found: {
    label: "Found it",
    circleClass: "border-emerald-500 bg-emerald-500",
    labelClass: "text-emerald-600 dark:text-emerald-400",
    chipClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/50 hover:bg-emerald-500/20 active:bg-emerald-500/30",
    groupClass: "text-emerald-600 dark:text-emerald-400",
  },
  defer: {
    label: "Next shop",
    circleClass: "border-blue-400 bg-blue-400",
    labelClass: "text-blue-600 dark:text-blue-400",
    chipClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/70 dark:border-blue-800/50 hover:bg-blue-500/20 active:bg-blue-500/30",
    groupClass: "text-blue-600 dark:text-blue-400",
  },
  have: {
    label: "Already have",
    circleClass: "border-amber-500 bg-amber-500",
    labelClass: "text-amber-600 dark:text-amber-400",
    chipClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/50 hover:bg-amber-500/20 active:bg-amber-500/30",
    groupClass: "text-amber-600 dark:text-amber-400",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Store category grouping ────────────────────────────────────────────────────

const STORE_CATEGORY_ORDER = [
  "fruit_veg", "dairy_eggs", "meat", "fish", "bakery", "grains",
  "pantry", "tinned", "condiments", "herbs", "oils", "nuts",
  "legumes", "snacks", "frozen", "drinks", "ready_meals", "household", "other",
];

const STORE_CATEGORY_DISPLAY: Record<string, string> = {
  fruit_veg:  "Fruit & Vegetables",
  dairy_eggs: "Dairy & Eggs",
  meat:       "Meat & Poultry",
  fish:       "Fish & Seafood",
  bakery:     "Bakery",
  grains:     "Grains & Cereals",
  pantry:     "Pantry Staples",
  tinned:     "Tinned & Canned",
  condiments: "Condiments & Sauces",
  herbs:      "Herbs & Spices",
  oils:       "Oils & Vinegars",
  nuts:       "Nuts & Seeds",
  legumes:    "Pulses & Legumes",
  snacks:     "Snacks",
  frozen:     "Frozen",
  drinks:     "Drinks",
  ready_meals:"Ready Meals",
  household:  "Household",
  other:      "Other",
};

function getStoreCategoryKey(item: WorkspaceItem): string {
  const raw = (item.category ?? "other").toLowerCase();
  if (raw === "fruit" || raw === "produce") return "fruit_veg";
  if (raw === "dairy" || raw === "eggs" || raw === "dairy-eggs") return "dairy_eggs";
  return STORE_CATEGORY_DISPLAY[raw] ? raw : "other";
}

// Partition items into in-store category groups, ordered by STORE_CATEGORY_ORDER.
// Uncategorised items fall under "other" so they always remain visible.
function groupByStoreCategory(
  items: WorkspaceItem[],
): { key: string; label: string; items: WorkspaceItem[] }[] {
  const map = new Map<string, WorkspaceItem[]>();
  for (const item of items) {
    const key = getStoreCategoryKey(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return STORE_CATEGORY_ORDER
    .filter((key) => map.has(key))
    .map((key) => ({
      key,
      label: STORE_CATEGORY_DISPLAY[key] ?? "Other",
      items: map.get(key)!,
    }));
}

function applySortOrder(items: WorkspaceItem[], order: SortOrder): WorkspaceItem[] {
  if (order === "default") return items;
  const arr = [...items];
  if (order === "apple_score") {
    arr.sort((a, b) => {
      if (a.thaRating == null && b.thaRating == null) return 0;
      if (a.thaRating == null) return 1;
      if (b.thaRating == null) return -1;
      return b.thaRating - a.thaRating;
    });
  } else if (order === "price") {
    arr.sort((a, b) => {
      if (a.matchedPrice == null && b.matchedPrice == null) return 0;
      if (a.matchedPrice == null) return 1;
      if (b.matchedPrice == null) return -1;
      return a.matchedPrice - b.matchedPrice;
    });
  } else if (order === "item" || order === "item_category") {
    arr.sort((a, b) => a.productName.localeCompare(b.productName, undefined, { sensitivity: "base" }));
  }
  return arr;
}

const SOURCE_FILTERS: { id: SourceFilter; label: string }[] = [
  { id: "all",        label: "All" },
  { id: "planned",    label: "Planned" },
  { id: "extras",     label: "Extras" },
  { id: "home",       label: "Home" },
  { id: "quick_list", label: "Quick List" },
];

function isItemInSource(
  item: WorkspaceItem,
  filter: SourceFilter,
  pantryKeySet: Set<string>,
  sourcesByItem: Map<number, IngredientSource[]>,
): boolean {
  if (filter === "all") return true;
  const key = (item.normalizedName ?? item.productName).toLowerCase();
  const isQL = item.source === "quick_list" || !!item.basketLabel?.startsWith("quick_list_");
  if (filter === "quick_list") return isQL;
  if (isQL) return false;
  const isPlanned =
    item.source === "planner" ||
    (item.source == null && (sourcesByItem.get(item.id)?.length ?? 0) > 0);
  if (filter === "planned") return isPlanned;
  if (filter === "home") return pantryKeySet.has(key);
  // extras: manually added — not from planner, not from quick list
  return !isPlanned;
}

function getOperationalHint(
  item: WorkspaceItem,
  isPantryStocked: boolean,
  sourcesForItem: IngredientSource[],
  prepState?: PrepItemState,
): { text: string; tone: "amber" | "green" | "muted" } | null {
  if (isPantryStocked) {
    if (prepState?.pantryDecision === "have_enough") {
      return { text: "Checked at home", tone: "green" };
    }
    if (prepState?.pantryDecision === "need_to_buy") {
      return null;
    }
    return { text: "Have you run out of this?", tone: "amber" };
  }

  if (prepState?.quantityDecision === "accepted") {
    return { text: "Quantity confirmed", tone: "green" };
  }
  if (prepState?.quantityDecision === "later") {
    return { text: "Review later", tone: "muted" };
  }

  const conf = deriveQuantityConfidence(item);
  if (conf === "assumed") return { text: "Quantity estimated", tone: "amber" };
  if (conf === "approximate") return { text: "Roughly estimated", tone: "amber" };

  if (item.needsReview) {
    if (item.reviewReason === "ambiguous_term") return { text: "Which did you mean?", tone: "amber" };
    return { text: "Needs attention", tone: "amber" };
  }

  if (sourcesForItem.length > 1) {
    return { text: `${sourcesForItem.length} meals`, tone: "muted" };
  }

  return null;
}

// ── PrepActionPanel ───────────────────────────────────────────────────────────

function PrepActionPanel({
  item,
  isPantryStocked,
  prepState,
  onPrepAction,
}: {
  item: WorkspaceItem;
  isPantryStocked: boolean;
  prepState: PrepItemState;
  onPrepAction: (action: PrepAction) => void;
}) {
  const conf = deriveQuantityConfidence(item);
  const hasQuantityUncertainty = conf === "assumed" || conf === "approximate";
  const unitLabel = item.unit && item.unit !== "unit" ? item.unit : "";

  if (isPantryStocked) {
    if (!prepState.pantryDecision) {
      return (
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => onPrepAction({ type: "pantry", decision: "have_enough" })}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-500/20 active:bg-emerald-500/30 transition-colors touch-manipulation"
          >
            Have enough
          </button>
          <button
            onClick={() => onPrepAction({ type: "pantry", decision: "need_to_buy" })}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-muted/60 text-foreground border border-border/60 hover:bg-muted active:bg-muted/80 transition-colors touch-manipulation"
          >
            Need to buy
          </button>
          <button
            onClick={() => onPrepAction({ type: "pantry", decision: "adjusting" })}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-muted/60 text-foreground border border-border/60 hover:bg-muted active:bg-muted/80 transition-colors touch-manipulation"
          >
            Adjust amount
          </button>
        </div>
      );
    }

    if (prepState.pantryDecision === "adjusting") {
      return (
        <div className="rounded-lg bg-muted/30 border border-border/40 p-3 space-y-2.5">
          <p className="text-xs font-medium text-foreground">How much do you still need to buy?</p>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="number"
              min="0"
              step="any"
              value={prepState.editValue ?? (item.quantityValue?.toString() ?? "")}
              onChange={(e) => onPrepAction({ type: "editValue", value: e.target.value })}
              className="w-24 text-sm px-2.5 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
            {unitLabel && (
              <span className="text-xs text-muted-foreground">{unitLabel}</span>
            )}
            <button
              onClick={() => onPrepAction({ type: "editConfirm" })}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => onPrepAction({ type: "clear" })}
              className="px-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    if (prepState.pantryDecision === "have_enough") {
      return (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 px-3 py-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Checked at home — have enough
          </span>
          <button
            onClick={() => onPrepAction({ type: "clear" })}
            className="ml-auto text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors shrink-0"
          >
            undo
          </button>
        </div>
      );
    }

    if (prepState.pantryDecision === "need_to_buy") {
      const adjustedLabel = prepState.editValue
        ? ` — buying ${prepState.editValue}${unitLabel ? ` ${unitLabel}` : ""}`
        : "";
      return (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 px-3 py-2.5">
          <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
            Checked at home{adjustedLabel || " — buying this"}
          </span>
          <button
            onClick={() => onPrepAction({ type: "clear" })}
            className="ml-auto text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors shrink-0"
          >
            undo
          </button>
        </div>
      );
    }
  }

  if (hasQuantityUncertainty) {
    const estimateLabel =
      conf === "assumed" ? "Quantity estimated by AI" : "Amount roughly estimated";

    if (!prepState.quantityDecision) {
      return (
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => onPrepAction({ type: "quantity", decision: "accepted" })}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-500/20 active:bg-emerald-500/30 transition-colors touch-manipulation"
          >
            Accept estimate
          </button>
          <button
            onClick={() => onPrepAction({ type: "quantity", decision: "editing" })}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-muted/60 text-foreground border border-border/60 hover:bg-muted active:bg-muted/80 transition-colors touch-manipulation"
          >
            Edit quantity
          </button>
          <button
            onClick={() => onPrepAction({ type: "quantity", decision: "later" })}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-muted/60 text-muted-foreground border border-border/60 hover:bg-muted active:bg-muted/80 transition-colors touch-manipulation"
          >
            Mark for later
          </button>
        </div>
      );
    }

    if (prepState.quantityDecision === "editing") {
      return (
        <div className="rounded-lg bg-muted/30 border border-border/40 p-3 space-y-2.5">
          <p className="text-xs font-medium text-foreground">Set your quantity</p>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="number"
              min="0"
              step="any"
              value={prepState.editValue ?? (item.quantityValue?.toString() ?? "")}
              onChange={(e) => onPrepAction({ type: "editValue", value: e.target.value })}
              className="w-24 text-sm px-2.5 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
            {unitLabel && (
              <span className="text-xs text-muted-foreground">{unitLabel}</span>
            )}
            <button
              onClick={() => onPrepAction({ type: "editConfirm" })}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => onPrepAction({ type: "clear" })}
              className="px-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    if (prepState.quantityDecision === "accepted") {
      const customQty = prepState.editValue;
      const displayQty = customQty
        ? `${customQty}${unitLabel ? ` ${unitLabel}` : ""}`
        : item.quantityValue != null && unitLabel
          ? `${item.quantityValue} ${unitLabel}`
          : null;
      return (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 px-3 py-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Quantity confirmed{displayQty ? ` — ${displayQty}` : ""}
          </span>
          <button
            onClick={() => onPrepAction({ type: "clear" })}
            className="ml-auto text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors shrink-0"
          >
            undo
          </button>
        </div>
      );
    }

    if (prepState.quantityDecision === "later") {
      return (
        <div className="flex items-center gap-2 rounded-lg bg-muted/30 border border-border/30 px-3 py-2.5">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">Marked for later review</span>
          <button
            onClick={() => onPrepAction({ type: "clear" })}
            className="ml-auto text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors shrink-0"
          >
            undo
          </button>
        </div>
      );
    }
  }

  return null;
}

// ── WorkspaceRow ─────────────────────────────────────────────────────────────

function WorkspaceRow({
  item,
  sources,
  pantryKeySet,
  measurementPref,
  onToggleChecked,
  shopMode,
  shopState,
  onShopStateChange,
  prepMode,
  prepState,
  onPrepAction,
  onOpenAnalyser,
  onCorrectItem,
  onAddItem,
  onConfirmSuggestions,
  onUpdateMeasurement,
}: {
  item: WorkspaceItem;
  sources: IngredientSource[];
  pantryKeySet: Set<string>;
  measurementPref: "metric" | "imperial";
  onToggleChecked: (checked: boolean) => void;
  shopMode: boolean;
  shopState?: ShopItemState;
  onShopStateChange?: (state: ShopItemState | null) => void;
  prepMode?: boolean;
  prepState?: PrepItemState;
  onPrepAction?: (action: PrepAction) => void;
  onOpenAnalyser?: () => void;
  onCorrectItem?: (newName: string) => void;
  onAddItem?: (name: string) => void;
  onConfirmSuggestions?: (picks: string[]) => void;
  onUpdateMeasurement?: (qty: number | null, unit: string | null) => void;
}) {
  const [editVal, setEditVal] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [qtyEditMode, setQtyEditMode] = useState(false);
  const [qtyEditQty, setQtyEditQty] = useState("");
  const [qtyEditUnit, setQtyEditUnit] = useState("");

  // Parse suggestions once at component scope — used by both inline strip and expanded pane
  const isAmbiguous = item.reviewReason === "ambiguous_term";
  const suggestions: string[] = (() => {
    if (!item.needsReview || !isAmbiguous) return [];
    try {
      const raw = JSON.parse(item.reviewSuggestions ?? "[]");
      if (Array.isArray(raw)) return raw as string[];
      return ((raw as { items?: string[] })?.items ?? []) as string[];
    } catch { return []; }
  })();
  // True when inline pills should appear (Review mode, ambiguous, has suggestions, unchecked)
  const isAmbiguousReview = !shopMode && !prepMode && !item.checked && isAmbiguous && suggestions.length > 0;

  // Hoisted confirm handler shared by inline strip and expanded pane
  function confirmSuggestions() {
    const picks = Array.from(selectedSuggestions);
    if (picks.length === 0) return;
    if (onConfirmSuggestions) {
      onConfirmSuggestions(picks);
    } else {
      onCorrectItem?.(picks[0]);
      picks.slice(1).forEach((p) => onAddItem?.(p));
    }
    setSelectedSuggestions(new Set());
  }

  function activateQtyEdit() {
    if (!onUpdateMeasurement || item.checked) return;
    const rawQty = item.quantityValue;
    setQtyEditQty(rawQty != null && rawQty > 0
      ? String(rawQty % 1 === 0 ? rawQty : parseFloat(rawQty.toFixed(4)))
      : "");
    setQtyEditUnit(item.unit ?? "");
    setQtyEditMode(true);
  }

  function saveQtyEdit() {
    const num = parseFloat(qtyEditQty);
    const qty = !isNaN(num) && num > 0 ? num : null;
    const unit = qtyEditUnit.trim() || null;
    onUpdateMeasurement?.(qty, unit);
    setQtyEditMode(false);
  }

  const pantryKey = (item.normalizedName ?? item.productName).toLowerCase();
  const isPantryStocked = pantryKeySet.has(pantryKey);
  const prepConf = deriveQuantityConfidence(item);
  const hasQuantityUncertainty = prepConf === "assumed" || prepConf === "approximate";
  // PrepActionPanel returns null for attention items that are neither pantry nor qty-uncertain
  const prepPanelEmpty = prepMode && !isPantryStocked && !hasQuantityUncertainty;

  const hint = getOperationalHint(
    item,
    isPantryStocked,
    sources,
    prepMode ? (prepState ?? {}) : undefined,
  );
  const hintToneClass =
    hint?.tone === "amber"
      ? "text-amber-600 dark:text-amber-400"
      : hint?.tone === "green"
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-muted-foreground";

  const effectiveShopState = shopState ?? "need";
  const shopConfig = SHOP_STATE_CONFIG[effectiveShopState];
  const qtyLabel = (() => {
    // Primary path: structured quantity + unit → canonical formatter
    if (item.quantityValue != null && item.unit && item.unit !== "descriptive") {
      const display = formatItemDisplay(item.productName, item.quantityValue, item.unit, measurementPref);
      // split on em-dash separator; rejoin in case name contains em-dash
      const parts = display.split("—");
      return parts.length > 1 ? parts.slice(1).join("—").trim() : "";
    }
    // Gram fallback: quantityInGrams when unit is null (e.g. planner items stored as g)
    const g = item.quantityInGrams;
    if (g != null && g > 0) {
      const liquidMl = getLiquidDisplayMl(g, item.normalizedName ?? item.productName);
      if (liquidMl !== null) {
        return measurementPref === "metric"
          ? (liquidMl >= 1000 ? `${+(liquidMl / 1000).toFixed(1).replace(/\.?0+$/, "")}L` : `${Math.round(liquidMl)}ml`)
          : (liquidMl >= 240 ? `${+(liquidMl / 240).toFixed(1).replace(/\.?0+$/, "")} cups`
            : liquidMl >= 15 ? `${+(liquidMl / 15).toFixed(1).replace(/\.?0+$/, "")} tbsp`
            : `${+(liquidMl / 5).toFixed(1).replace(/\.?0+$/, "")} tsp`);
      }
      return measurementPref === "metric"
        ? formatQuantityMetric(g, "g")
        : formatQuantityImperial(g, "g");
    }
    // Bare count: quantityValue > 1 with no unit (e.g. "2" for count items)
    if (item.quantityValue != null && item.quantityValue > 1) {
      return String(item.quantityValue % 1 === 0 ? item.quantityValue : item.quantityValue.toFixed(1));
    }
    return "";
  })();

  // Row-level state styling
  const rowOpacity = shopMode
    ? effectiveShopState !== "need" ? "opacity-60" : ""
    : item.checked ? "opacity-50" : "";

  const rowBg = shopMode
    ? effectiveShopState === "found"
      ? "bg-emerald-50/15 dark:bg-emerald-950/10"
      : effectiveShopState === "defer"
        ? "bg-blue-50/10 dark:bg-blue-950/10"
        : effectiveShopState === "have"
          ? "bg-amber-50/15 dark:bg-amber-950/10"
          : ""
    : item.needsReview && !item.checked ? "bg-amber-50/30 dark:bg-amber-950/10" : "";

  return (
    <div
      className={`border-b border-border/30 transition-colors ${rowOpacity} ${rowBg}`}
      data-testid={`workspace-row-${item.id}`}
    >
      {/* ── Collapsed row — two-row on mobile, single-row flex on desktop ─── */}
      <div className="grid grid-cols-[28px_1fr] items-start gap-x-2 gap-y-1.5 px-4 pt-3 pb-2.5 sm:flex sm:items-center sm:py-3 sm:min-h-[52px]">

        {/* Indicator — 28px fixed (circle for Shop, checkbox for Review/Prep) */}
        <div className="shrink-0 w-7 flex items-center justify-center">
          {shopMode ? (
            <button
              onClick={() => onShopStateChange?.(effectiveShopState === "found" ? null : "found")}
              aria-label={effectiveShopState === "need" ? "Mark as found" : "Undo"}
              className={`h-5 w-5 rounded-full flex items-center justify-center transition-colors touch-manipulation border-2 ${shopConfig.circleClass}`}
            >
              {effectiveShopState === "found" && <CheckCircle2 className="h-3 w-3 text-white" />}
              {effectiveShopState === "defer" && <Clock className="h-3 w-3 text-white" />}
              {effectiveShopState === "have" && <Home className="h-3 w-3 text-white" />}
            </button>
          ) : (
            <Checkbox
              checked={item.checked || false}
              onCheckedChange={(v) => onToggleChecked(!!v)}
              className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              data-testid={`ws-checkbox-${item.id}`}
            />
          )}
        </div>

        {/* Item name + qty */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 min-w-0 flex-wrap">
            <span className={`text-sm font-medium leading-snug truncate ${
              shopMode
                ? effectiveShopState !== "need" ? "text-muted-foreground" : "text-foreground"
                : item.checked ? "line-through text-muted-foreground" : "text-foreground"
            }`}>
              {capitalizeWords(item.productName)}
            </span>
            {/* Qty chip — editable when unchecked; read-only when checked */}
            {/* Qty — edit controls inline when editing, chip when not */}
            {qtyEditMode && !item.checked ? (
              <>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={qtyEditQty}
                  onChange={(e) => setQtyEditQty(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveQtyEdit();
                    if (e.key === "Escape") setQtyEditMode(false);
                  }}
                  className="w-16 h-8 text-xs px-2 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 tabular-nums shrink-0"
                  autoFocus
                  placeholder="qty"
                />
                <select
                  value={qtyEditUnit}
                  onChange={(e) => setQtyEditUnit(e.target.value)}
                  className="h-8 text-xs pl-2 pr-6 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer shrink-0"
                >
                  {SHOPPING_UNITS.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={saveQtyEdit}
                  className="px-3 h-8 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors touch-manipulation shrink-0"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setQtyEditMode(false)}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation shrink-0"
                >
                  Cancel
                </button>
              </>
            ) : !item.checked && onUpdateMeasurement ? (
              <button
                type="button"
                onClick={activateQtyEdit}
                title={qtyLabel ? "Edit quantity" : "Add quantity"}
                className={`inline-flex items-center gap-0.5 text-xs tabular-nums shrink-0 whitespace-nowrap touch-manipulation transition-colors rounded-full px-2 py-0.5 border ${
                  qtyLabel
                    ? shopMode && effectiveShopState !== "need"
                      ? "border-border/30 bg-muted/20 text-muted-foreground/50"
                      : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
                    : "border-dashed border-border/60 text-muted-foreground/70 hover:border-border hover:text-muted-foreground hover:bg-muted/30"
                }`}
              >
                {qtyLabel ? qtyLabel : <><Plus className="h-3 w-3" /><span>Add qty</span></>}
              </button>
            ) : qtyLabel ? (
              <span className={`text-xs tabular-nums shrink-0 whitespace-nowrap px-2 py-0.5 rounded-full border border-border/30 bg-muted/20 ${
                item.checked ? "text-muted-foreground/50" : "text-muted-foreground"
              }`}>
                {qtyLabel}
              </span>
            ) : null}
          </div>
          {/* Hint — Review and Prep */}
          {hint && !item.checked && !shopMode && (
            <div className="flex items-center gap-0.5 mt-0.5">
              {hint.tone === "amber" && <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />}
              {hint.tone === "green" && <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />}
              <span className={`text-xs ${hintToneClass}`}>{hint.text}</span>
            </div>
          )}
        </div>

        {/* CTA slot — row 2 col 2 on mobile, inline on desktop */}
        <div className="col-start-2 row-start-2 flex items-center sm:shrink-0 sm:min-w-[200px]">
          {/* Shop: Found it / Next shop or status + undo */}
          {shopMode && effectiveShopState === "need" && (
            <div className="flex gap-1.5">
              <button
                onClick={() => onShopStateChange?.("found")}
                className="px-2.5 py-1 text-xs font-medium rounded-md border transition-colors touch-manipulation whitespace-nowrap bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/50 hover:bg-emerald-500/20 active:bg-emerald-500/30"
              >
                Found it
              </button>
              <button
                onClick={() => onShopStateChange?.("defer")}
                className="px-2.5 py-1 text-xs font-medium rounded-md border transition-colors touch-manipulation whitespace-nowrap bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/70 dark:border-blue-800/50 hover:bg-blue-500/20 active:bg-blue-500/30"
              >
                Next shop
              </button>
            </div>
          )}
          {shopMode && effectiveShopState !== "need" && (
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-medium whitespace-nowrap ${shopConfig.labelClass}`}>
                {shopConfig.label}
              </span>
              <button
                onClick={() => onShopStateChange?.(null)}
                className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors touch-manipulation"
              >
                undo
              </button>
            </div>
          )}
          {/* Prep: chips (or Analyse fallback for attention-only items) */}
          {prepMode && !item.checked && onPrepAction && (
            <PrepActionPanel
              item={item}
              isPantryStocked={isPantryStocked}
              prepState={prepState ?? {}}
              onPrepAction={onPrepAction}
            />
          )}
          {prepMode && !item.checked && prepPanelEmpty && onOpenAnalyser && (
            <button
              onClick={onOpenAnalyser}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-amber-200/70 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100/80 dark:hover:bg-amber-950/30 transition-colors touch-manipulation whitespace-nowrap"
              data-testid={`ws-analyse-btn-${item.id}`}
            >
              <FlaskConical className="h-3 w-3 shrink-0" />
              Analyse
            </button>
          )}
          {/* Review: ambiguous → pills strip handles it; non-ambiguous → Review; normal → Analyse */}
          {!shopMode && !prepMode && !item.checked && (
            item.needsReview ? (
              isAmbiguousReview ? null : (
                <button
                  onClick={() => { setEditVal(item.productName); setEditMode(true); }}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-amber-200/70 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100/60 dark:hover:bg-amber-950/30 transition-colors touch-manipulation whitespace-nowrap"
                  data-testid={`ws-resolve-btn-${item.id}`}
                >
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  Review
                </button>
              )
            ) : onOpenAnalyser ? (
              <button
                onClick={onOpenAnalyser}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-border/50 bg-muted/40 hover:bg-muted text-foreground/80 transition-colors touch-manipulation whitespace-nowrap"
                data-testid={`ws-analyse-btn-${item.id}`}
              >
                <FlaskConical className="h-3 w-3 shrink-0" />
                Analyse
              </button>
            ) : null
          )}
        </div>

        {/* Score — row 2 col 1 on mobile, pinned right on desktop */}
        <div className="col-start-1 row-start-2 flex items-center justify-center sm:shrink-0 sm:w-[78px]">
          {canShowScoreForItem(item) && item.thaRating != null && (shopMode || !item.checked) && (
            <ScoreBadge score={item.thaRating} size={22} />
          )}
        </div>

      </div>

      {/* ── Inline suggestion strip — ambiguous Review items only ─── */}
      {isAmbiguousReview && (
        <div className="flex flex-wrap items-center gap-1.5 px-4 pb-2.5 ml-9">
          {suggestions.map((s) => {
            const isSelected = selectedSuggestions.has(s);
            return (
              <button
                key={s}
                onClick={() => setSelectedSuggestions((prev) => {
                  const n = new Set(prev);
                  if (isSelected) n.delete(s); else n.add(s);
                  return n;
                })}
                className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors touch-manipulation ${
                  isSelected
                    ? "bg-primary/10 text-primary border-primary/40 dark:bg-primary/20"
                    : "bg-muted/50 text-foreground/80 border-border/50 hover:bg-muted hover:border-border hover:text-foreground"
                }`}
              >
                {s}
              </button>
            );
          })}
          {selectedSuggestions.size > 0 && (
            <button
              onClick={confirmSuggestions}
              className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors touch-manipulation"
              data-testid={`ws-confirm-suggestion-${item.id}`}
            >
              {selectedSuggestions.size === 1 ? "Confirm" : `Add ${selectedSuggestions.size} items`}
            </button>
          )}
        </div>
      )}

      {/* ── Rename correction strip — non-ambiguous Review items ─── */}
      {editMode && !isAmbiguous && item.needsReview && !shopMode && !prepMode && (
        <div className="flex items-center gap-1.5 px-4 pb-2.5 ml-9">
          <input
            type="text"
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && editVal.trim()) { onCorrectItem?.(editVal.trim()); setEditMode(false); }
              if (e.key === "Escape") setEditMode(false);
            }}
            className="flex-1 text-xs h-8 px-2.5 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
            autoFocus
            placeholder="Correct item name…"
          />
          <button
            onClick={() => { if (editVal.trim()) { onCorrectItem?.(editVal.trim()); setEditMode(false); } }}
            disabled={!editVal.trim()}
            className="px-3 h-8 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 touch-manipulation shrink-0"
          >
            Confirm
          </button>
          <button
            onClick={() => setEditMode(false)}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ── Prep-mode grouping ────────────────────────────────────────────────────────

function getPrepGroup(
  item: WorkspaceItem,
  isPantryStocked: boolean,
): "pantry" | "uncertain" | "attention" | "ready" {
  if (isPantryStocked) return "pantry";
  const conf = deriveQuantityConfidence(item);
  if (conf === "assumed" || conf === "approximate") return "uncertain";
  if (item.needsReview) return "attention";
  return "ready";
}

// ── Mode switcher ─────────────────────────────────────────────────────────────

function ModeSwitcher({
  mode,
  onChange,
}: {
  mode: WorkspaceMode;
  onChange: (m: WorkspaceMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1" role="tablist">
      {MODES.map(({ id, label, Icon }) => (
        <button
          key={id}
          role="tab"
          aria-selected={mode === id}
          onClick={() => onChange(id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            mode === id
              ? "shadow-sm realm-banner-btn"
              : "text-muted-foreground hover:text-foreground"
          }`}
          data-testid={`ws-mode-${id}`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Prep group header ─────────────────────────────────────────────────────────

function PrepGroupHeader({
  label,
  count,
  resolvedCount,
}: {
  label: string;
  count: number;
  resolvedCount?: number;
}) {
  const isComplete = resolvedCount !== undefined && resolvedCount === count;
  return (
    <div className="px-4 py-1.5 border-t border-border/30 bg-[hsl(26,15%,96%)] dark:bg-[hsl(26,8%,15%)] flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1.5">
        {isComplete && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
        {label}
      </span>
      <span
        className={`text-[10px] font-medium tabular-nums ${
          isComplete
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-muted-foreground/60"
        }`}
      >
        {resolvedCount !== undefined ? `${resolvedCount}/${count}` : count}
      </span>
    </div>
  );
}

// ── Shop group header ─────────────────────────────────────────────────────────

function ShopGroupHeader({
  label,
  count,
  variant = "need",
}: {
  label: string;
  count: number;
  variant?: ShopItemState;
}) {
  const colorClass = SHOP_STATE_CONFIG[variant].groupClass;
  return (
    <div className="px-4 py-1.5 border-t border-border/30 bg-[hsl(26,15%,96%)] dark:bg-[hsl(26,8%,15%)] flex items-center justify-between">
      <span className={`text-[10px] uppercase tracking-wide font-medium ${colorClass}`}>
        {label}
      </span>
      <span className={`text-[10px] font-medium tabular-nums ${colorClass}`}>
        {count}
      </span>
    </div>
  );
}

// ── Shop category header ──────────────────────────────────────────────────────

function ShopCategoryHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="px-4 py-1.5 border-t border-border/30 bg-[hsl(26,12%,97%)] dark:bg-[hsl(26,5%,13%)] flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground/80">
        {label}
      </span>
      <span className="text-[10px] font-medium tabular-nums text-muted-foreground/60">
        {count}
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ShoppingWorkspacePage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const search = useSearch();

  const [mode, setMode] = useState<WorkspaceMode>(() => {
    const params = new URLSearchParams(search);
    const stage = params.get("stage");
    if (stage === "review" || stage === "prep" || stage === "shop") return stage;
    return "review";
  });
  const [prepStates, setPrepStates] = useState<Map<number, PrepItemState>>(new Map());
  const [analyserItem, setAnalyserItem] = useState<WorkspaceItem | null>(null);

  // ── Parity features (ported from old Basket page) ──────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [splitByShop, setSplitByShop] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportSupermarket, setExportSupermarket] = useState("Tesco");
  const [basketDialogOpen, setBasketDialogOpen] = useState(false);
  const [basketSending, setBasketSending] = useState<string | null>(null);
  const [basketResult, setBasketResult] = useState<{
    supermarket: string;
    itemUrls: { name: string; url: string }[];
    matchedCount: number;
    totalCount: number;
    estimatedTotal?: number;
    message?: string;
  } | null>(null);
  const [slScanLoading, setSlScanLoading] = useState(false);
  const [slScanData, setSlScanData] = useState<ShoppingListScanData | null>(null);
  const [slReviewOpen, setSlReviewOpen] = useState(false);
  const [slCameraOpen, setSlCameraOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const slFileRef = useRef<HTMLInputElement>(null);

  const [sourceFilter, setSourceFilter] = useState<SourceFilter>(() => {
    const params = new URLSearchParams(search);
    if (params.get("source") === "quick-list") return "quick_list";
    if (params.get("source") === "planned") return "planned";
    return "all";
  });
  const [sortOrder, setSortOrder] = useState<SortOrder>("default");

  useEffect(() => {
    document.title = "Shopping – The Healthy Apples";
    return () => { document.title = "The Healthy Apples"; };
  }, []);

  // Sync mode when URL search param changes (e.g. clicking Shop nav while workspace is already open)
  useEffect(() => {
    const params = new URLSearchParams(search);
    const stage = params.get("stage");
    if (stage === "review" || stage === "prep" || stage === "shop") {
      setMode(stage);
    }
    if (params.get("source") === "quick-list") setSourceFilter("quick_list");
    if (params.get("source") === "planned") setSourceFilter("planned");
  }, [search]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && isFullscreen) setIsFullscreen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isFullscreen]);

  const measurementPref: "metric" | "imperial" =
    (user?.measurementPreference as "metric" | "imperial") || "metric";

  const { data: items = [], isLoading } = useQuery<WorkspaceItem[]>({
    queryKey: [api.shoppingList.list.path],
  });

  const { data: ingredientSources = [] } = useQuery<IngredientSource[]>({
    queryKey: [api.shoppingList.sources.path],
  });

  const { data: pantryItems = [] } = useQuery<{ id: number; ingredientKey: string }[]>({
    queryKey: ["/api/pantry"],
  });

  const pantryKeySet = useMemo(
    () => new Set(pantryItems.map((p) => p.ingredientKey)),
    [pantryItems],
  );

  const sourcesByItem = useMemo(() => {
    const map = new Map<number, IngredientSource[]>();
    for (const s of ingredientSources) {
      if (!map.has(s.shoppingListItemId)) map.set(s.shoppingListItemId, []);
      map.get(s.shoppingListItemId)!.push(s);
    }
    return map;
  }, [ingredientSources]);

  const toggleChecked = useMutation({
    mutationFn: async ({ id, checked }: { id: number; checked: boolean }) => {
      const url = buildUrl(api.shoppingList.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checked }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onMutate: async ({ id, checked }) => {
      await queryClient.cancelQueries({ queryKey: [api.shoppingList.list.path] });
      const snapshot = queryClient.getQueryData<WorkspaceItem[]>([api.shoppingList.list.path]);
      queryClient.setQueryData<WorkspaceItem[]>([api.shoppingList.list.path], (old) =>
        old ? old.map((item) => (item.id === id ? { ...item, checked } : item)) : old,
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot !== undefined) {
        queryClient.setQueryData([api.shoppingList.list.path], ctx.snapshot);
      }
      toast({ title: "Couldn't update item", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
    },
  });

  // Shop status is persisted via shopStatus field on the item
  const updateShopStatus = useMutation({
    mutationFn: async ({ id, shopStatus }: { id: number; shopStatus: string | null }) => {
      const url = buildUrl(api.shoppingList.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopStatus }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onMutate: async ({ id, shopStatus }) => {
      await queryClient.cancelQueries({ queryKey: [api.shoppingList.list.path] });
      const snapshot = queryClient.getQueryData<WorkspaceItem[]>([api.shoppingList.list.path]);
      queryClient.setQueryData<WorkspaceItem[]>([api.shoppingList.list.path], (old) =>
        old ? old.map((item) => (item.id === id ? { ...item, shopStatus } : item)) : old,
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot !== undefined) {
        queryClient.setQueryData([api.shoppingList.list.path], ctx.snapshot);
      }
      toast({ title: "Couldn't update item", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
    },
  });

  const recalculateScores = useMutation({
    mutationFn: async () => {
      const res = await fetch(api.shoppingList.autoSmp.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to recalculate");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      const count = data?.updated?.length ?? 0;
      toast({
        title: "Scores updated",
        description: count > 0
          ? `${count} item${count === 1 ? "" : "s"} re-scored with the latest rules.`
          : "All scores are already up to date.",
      });
    },
    onError: () => {
      toast({ title: "Could not recalculate", description: "Please try again.", variant: "destructive" });
    },
  });

  const togglePreference = useMutation({
    mutationFn: async () => {
      const newPref = measurementPref === "metric" ? "imperial" : "metric";
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ measurementPreference: newPref }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update preference");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });

  const lookupPrices = useMutation({
    mutationFn: async () => {
      const res = await fetch(api.shoppingList.lookupPrices.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to match");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      toast({ title: "Products Matched", description: "Real grocery products matched across supermarkets." });
    },
    onError: () => toast({ title: "Could not match products", variant: "destructive" }),
  });

  const clearAll = useMutation({
    mutationFn: async () => {
      const res = await fetch(api.shoppingList.clear.path, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to clear");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      toast({ title: "Shopping list cleared" });
      setClearDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to clear list", variant: "destructive" }),
  });

  const updateMeasurement = useMutation({
    mutationFn: async ({ id, qty, unit }: { id: number; qty: number | null; unit: string | null }) => {
      const url = buildUrl(api.shoppingList.update.path, { id });
      const body: Record<string, unknown> = {};
      if (qty !== null) body.quantityValue = qty;
      body.unit = unit ?? "";
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update measurement");
      return res.json() as Promise<ShoppingListItem>;
    },
    onMutate: async ({ id, qty, unit }) => {
      const snapshot = queryClient.getQueryData<WorkspaceItem[]>([api.shoppingList.list.path]);
      // Optimistic update — apply immediately so the row reflects the new qty/unit
      queryClient.setQueryData<WorkspaceItem[]>([api.shoppingList.list.path], (old) =>
        old ? old.map((it) =>
          it.id === id
            ? { ...it, ...(qty !== null && { quantityValue: qty }), unit: unit ?? "" }
            : it
        ) : old,
      );
      await queryClient.cancelQueries({ queryKey: [api.shoppingList.list.path] });
      return { snapshot };
    },
    onSuccess: (data, { id }) => {
      // Apply server response (has derived quantityInGrams etc.)
      queryClient.setQueryData<WorkspaceItem[]>([api.shoppingList.list.path], (old) =>
        old ? old.map((it) => it.id === id ? { ...it, ...data } : it) : old,
      );
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot !== undefined) {
        queryClient.setQueryData([api.shoppingList.list.path], ctx.snapshot);
      }
      toast({ title: "Couldn't update measurement", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
    },
  });

  const correctItem = useMutation({
    mutationFn: async ({ id, productName }: { id: number; productName: string }) => {
      const res = await fetch(`/api/shopping-list/${id}/correct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to correct item");
      return res.json() as Promise<{ updated: boolean; recipesUpdated: number; item: ShoppingListItem | null }>;
    },
    onMutate: async ({ id, productName }) => {
      // Snapshot BEFORE setQueryData so rollback restores original state
      const snapshot = queryClient.getQueryData<WorkspaceItem[]>([api.shoppingList.list.path]);
      // Apply optimistic update SYNCHRONOUSLY (before any await) so pills disappear
      // in the same React render batch as the user's Confirm click.
      queryClient.setQueryData<WorkspaceItem[]>([api.shoppingList.list.path], (old) =>
        old ? old.map((it) =>
          it.id === id
            ? {
                ...it,
                productName,
                normalizedName: productName.toLowerCase(),
                needsReview: false,
                reviewReason: null,
                reviewSuggestions: null,
                resolutionState: "resolved" as const,
                thaRating: null,
              }
            : it
        ) : old,
      );
      // Cancel in-flight queries AFTER the optimistic update to prevent them
      // from overwriting our update before the real server response arrives.
      await queryClient.cancelQueries({ queryKey: [api.shoppingList.list.path] });
      return { snapshot };
    },
    onSuccess: (data, { id }) => {
      // Apply the full server-resolved item (including correct category) so the
      // item moves to the right category group without waiting for a full refetch.
      if (data.item) {
        queryClient.setQueryData<WorkspaceItem[]>([api.shoppingList.list.path], (old) =>
          old ? old.map((it) =>
            it.id === id
              ? {
                  ...it,           // preserve addedByDisplayName, sources
                  ...data.item!,   // apply server-resolved fields (category, review state, etc.)
                }
              : it
          ) : old,
        );
      }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot !== undefined) {
        queryClient.setQueryData([api.shoppingList.list.path], ctx.snapshot);
      }
      toast({ title: "Couldn't update item", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
    },
  });

  const addShoppingItem = useMutation({
    mutationFn: async ({
      productName,
      source,
      basketLabel,
      quantityValue,
      unit,
    }: {
      productName: string;
      source?: string | null;
      basketLabel?: string | null;
      quantityValue?: number | null;
      unit?: string | null;
    }) => {
      const body: Record<string, unknown> = { productName };
      if (source) body.source = source;
      if (basketLabel) body.basketLabel = basketLabel;
      if (quantityValue != null) body.quantityValue = quantityValue;
      if (unit) body.unit = unit;
      const res = await fetch(api.shoppingList.add.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add item");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
    },
    onError: () => toast({ title: "Couldn't add item", variant: "destructive" }),
  });

  const { data: enhancedSupermarkets = [] } = useQuery<{
    name: string; key: string; hasDirectBasket: boolean;
  }[]>({
    queryKey: ["/api/basket/supermarkets-enhanced"],
  });
  const primarySupermarkets = enhancedSupermarkets.filter((s) => s.hasDirectBasket);
  const otherSupermarkets = enhancedSupermarkets.filter((s) => !s.hasDirectBasket);

  const handleShoppingListScan = async (file: File) => {
    setSlScanLoading(true);
    const scanId = Math.random().toString(36).slice(2, 10);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("mode", "shopping_list");
    try {
      const res = await fetch("/api/scan", {
        method: "POST", body: formData, credentials: "include",
        headers: { "X-Scan-Id": scanId },
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Scan failed", description: data.message || "Could not read image." });
        return;
      }
      setSlScanData(data as ShoppingListScanData);
      setSlReviewOpen(true);
    } catch {
      toast({ variant: "destructive", title: "Scan failed", description: "Could not connect. Please try again." });
    } finally {
      setSlScanLoading(false);
      if (slFileRef.current) slFileRef.current.value = "";
    }
  };

  const handleExport = (format: "list" | "links" | "copy") => {
    const lines: string[] = [];
    lines.push(`Shopping List — ${new Date().toLocaleDateString()}`);
    lines.push(`Supermarket: ${exportSupermarket}`);
    lines.push("");
    for (const item of items) {
      const display = formatItemDisplay(item.productName, item.quantityValue, item.unit, measurementPref);
      const parts = display.split(" — ");
      const qty = parts[1] ?? "";
      lines.push(`${capitalizeWords(item.productName)}${qty ? ` | ${qty}` : ""}`);
    }
    const text = lines.join("\n");
    if (format === "copy") {
      navigator.clipboard.writeText(text).then(
        () => toast({ title: "Copied to clipboard" }),
        () => toast({ title: "Copy failed", variant: "destructive" }),
      );
    } else if (format === "list") {
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shopping-list-${exportSupermarket.toLowerCase().replace(/[^a-z0-9]/g, "-")}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Downloaded", description: `List saved for ${exportSupermarket}.` });
    } else {
      const searchBase = SUPERMARKET_SEARCH_URLS[exportSupermarket];
      if (!searchBase) {
        toast({ title: "No search URL", description: "Try Download List instead.", variant: "destructive" });
        return;
      }
      items.slice(0, 10).forEach((item) => {
        window.open(searchBase.replace("{query}", encodeURIComponent(item.productName)), "_blank");
      });
      if (items.length > 10) {
        toast({ title: "Opened first 10 items", description: `${items.length - 10} more — use Download List for the full list.` });
      }
    }
    setExportDialogOpen(false);
  };

  const handleSendBasket = async (supermarket: string) => {
    if (items.length === 0) {
      toast({ title: "Empty list", description: "Add items first.", variant: "destructive" });
      return;
    }
    setBasketSending(supermarket);
    setBasketResult(null);
    try {
      const res = await fetch("/api/basket/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ supermarket }),
      });
      if (!res.ok) throw new Error("Failed");
      const result = await res.json();
      if (result.success && result.itemUrls?.length > 0) {
        setBasketResult(result);
        result.itemUrls.slice(0, 8).forEach((item: { url: string }) => window.open(item.url, "_blank"));
        const opened = Math.min(result.itemUrls.length, 8);
        const remaining = result.itemUrls.length - opened;
        toast({
          title: `${result.supermarket} Basket`,
          description: remaining > 0
            ? `Opened ${opened} of ${result.itemUrls.length} items.`
            : `Opened ${opened} product pages.`,
        });
      } else {
        toast({ title: "Could not send", description: result.message || "Unable to create basket.", variant: "destructive" });
      }
    } catch {
      toast({ title: `Couldn't send to ${supermarket}`, variant: "destructive" });
    } finally {
      setBasketSending(null);
    }
  };

  function handleShopStateChange(itemId: number, state: ShopItemState | null) {
    updateShopStatus.mutate({ id: itemId, shopStatus: toServerShopStatus(state) });
  }

  function handlePrepAction(itemId: number, action: PrepAction) {
    setPrepStates((prev) => {
      const next = new Map(prev);
      const current = next.get(itemId) ?? {};

      switch (action.type) {
        case "pantry":
          next.set(itemId, { ...current, pantryDecision: action.decision, editValue: undefined });
          break;
        case "quantity":
          next.set(itemId, { ...current, quantityDecision: action.decision, editValue: undefined });
          break;
        case "editValue":
          next.set(itemId, { ...current, editValue: action.value });
          break;
        case "editConfirm":
          if (current.pantryDecision === "adjusting") {
            next.set(itemId, { ...current, pantryDecision: "need_to_buy" });
          } else {
            next.set(itemId, { ...current, quantityDecision: "accepted" });
          }
          break;
        case "clear":
          next.delete(itemId);
          break;
      }

      return next;
    });
  }

  const uncheckedItems = useMemo(() => items.filter((i) => !i.checked), [items]);
  const checkedItems = useMemo(() => items.filter((i) => i.checked), [items]);

  const hasMatchedPrices = useMemo(() => items.some((i) => i.matchedPrice != null), [items]);

  const filterCounts = useMemo((): Record<SourceFilter, number> => ({
    all:        uncheckedItems.length,
    planned:    uncheckedItems.filter((item) => isItemInSource(item, "planned",    pantryKeySet, sourcesByItem)).length,
    extras:     uncheckedItems.filter((item) => isItemInSource(item, "extras",     pantryKeySet, sourcesByItem)).length,
    home:       uncheckedItems.filter((item) => isItemInSource(item, "home",       pantryKeySet, sourcesByItem)).length,
    quick_list: uncheckedItems.filter((item) => isItemInSource(item, "quick_list", pantryKeySet, sourcesByItem)).length,
  }), [uncheckedItems, pantryKeySet, sourcesByItem]);

  // All items (checked + unchecked) filtered by source — drives Shop groups and checked sections
  const filteredItems = useMemo(
    () => sourceFilter === "all"
      ? items
      : items.filter((item) => isItemInSource(item, sourceFilter, pantryKeySet, sourcesByItem)),
    [items, sourceFilter, pantryKeySet, sourcesByItem],
  );

  const filteredUncheckedItems = useMemo(
    () => filteredItems.filter((i) => !i.checked),
    [filteredItems],
  );

  const filteredCheckedItems = useMemo(
    () => filteredItems.filter((i) => i.checked),
    [filteredItems],
  );

  const sortedFilteredItems = useMemo(
    () => applySortOrder(filteredUncheckedItems, sortOrder),
    [filteredUncheckedItems, sortOrder],
  );

  // Shop mode groups — source-filtered items sorted then partitioned by shopStatus
  const shopGroups = useMemo(() => {
    const sorted = applySortOrder(filteredItems, sortOrder);
    const need: WorkspaceItem[] = [];
    const found: WorkspaceItem[] = [];
    const defer: WorkspaceItem[] = [];
    const have: WorkspaceItem[] = [];
    for (const item of sorted) {
      const state = getShopState(item);
      if (state === "found") found.push(item);
      else if (state === "defer") defer.push(item);
      else if (state === "have") have.push(item);
      else need.push(item);
    }
    return { need, found, defer, have };
  }, [filteredItems, sortOrder]);

  // Shop "need" items grouped by in-store category — memoized for performance
  const shopNeedByCategory = useMemo(
    () => groupByStoreCategory(shopGroups.need),
    [shopGroups.need],
  );

  // Review unchecked items: grouped by in-store category (default) or flat A–Z when splitByShop is on
  const reviewUncheckedByCategory = useMemo(
    () => groupByStoreCategory(sortedFilteredItems),
    [sortedFilteredItems],
  );
  const reviewUncheckedAlpha = useMemo(
    () => [...filteredUncheckedItems].sort((a, b) => a.productName.localeCompare(b.productName)),
    [filteredUncheckedItems],
  );

  const shopSummary = useMemo((): ShopSummary => ({
    needCount: shopGroups.need.length,
    foundCount: shopGroups.found.length,
    deferCount: shopGroups.defer.length,
    haveCount: shopGroups.have.length,
    total: filteredItems.length,
  }), [shopGroups, filteredItems]);

  // Prep mode grouping — source-filtered unchecked items
  const prepGroups = useMemo(() => {
    const pantry: WorkspaceItem[] = [];
    const uncertain: WorkspaceItem[] = [];
    const attention: WorkspaceItem[] = [];
    const ready: WorkspaceItem[] = [];
    for (const item of sortedFilteredItems) {
      const key = (item.normalizedName ?? item.productName).toLowerCase();
      const group = getPrepGroup(item, pantryKeySet.has(key));
      if (group === "pantry") pantry.push(item);
      else if (group === "uncertain") uncertain.push(item);
      else if (group === "attention") attention.push(item);
      else ready.push(item);
    }
    return { pantry, uncertain, attention, ready };
  }, [sortedFilteredItems, pantryKeySet]);

  const prepSummary = useMemo((): PrepSummary => {
    const pantryTotal = prepGroups.pantry.length;
    const pantryReviewed = prepGroups.pantry.filter((i) => {
      const s = prepStates.get(i.id);
      return s?.pantryDecision === "have_enough" || s?.pantryDecision === "need_to_buy";
    }).length;
    const uncertainTotal = prepGroups.uncertain.length;
    const uncertainResolved = prepGroups.uncertain.filter((i) => {
      const s = prepStates.get(i.id);
      return s?.quantityDecision === "accepted" || s?.quantityDecision === "later";
    }).length;
    const attentionTotal = prepGroups.attention.length;
    const allPrepDone =
      (pantryTotal === 0 || pantryReviewed === pantryTotal) &&
      (uncertainTotal === 0 || uncertainResolved === uncertainTotal) &&
      attentionTotal === 0 &&
      pantryTotal + uncertainTotal > 0;

    return { pantryTotal, pantryReviewed, uncertainTotal, uncertainResolved, attentionTotal, allPrepDone };
  }, [prepGroups, prepStates]);

  function renderRow(item: WorkspaceItem) {
    const isPrepMode = mode === "prep";
    const isShopMode = mode === "shop";
    return (
      <WorkspaceRow
        key={item.id}
        item={item}
        sources={sourcesByItem.get(item.id) ?? []}
        pantryKeySet={pantryKeySet}
        measurementPref={measurementPref}
        onToggleChecked={(checked) => toggleChecked.mutate({ id: item.id, checked })}
        shopMode={isShopMode}
        shopState={isShopMode ? getShopState(item) : undefined}
        onShopStateChange={isShopMode ? (state) => handleShopStateChange(item.id, state) : undefined}
        prepMode={isPrepMode}
        prepState={isPrepMode ? (prepStates.get(item.id) ?? {}) : undefined}
        onPrepAction={isPrepMode ? (action) => handlePrepAction(item.id, action) : undefined}
        onOpenAnalyser={() => setAnalyserItem(item)}
        onCorrectItem={!isShopMode && !isPrepMode ? (newName) => correctItem.mutate({ id: item.id, productName: newName }) : undefined}
        onAddItem={!isShopMode && !isPrepMode ? (name) => addShoppingItem.mutate({ productName: name }) : undefined}
        onUpdateMeasurement={!item.checked ? (qty, unit) => updateMeasurement.mutate({ id: item.id, qty, unit }) : undefined}
        onConfirmSuggestions={!isShopMode && !isPrepMode ? async (picks) => {
          if (picks.length === 0) return;
          // Carry qty/unit from the parent ambiguous item to all derived items
          const inheritedQty = item.quantityValue ?? undefined;
          const inheritedUnit = item.unit ?? undefined;
          try {
            await correctItem.mutateAsync({ id: item.id, productName: picks[0] });
            // Apply inherited qty/unit to the corrected item if one was set
            if (inheritedQty != null || inheritedUnit) {
              updateMeasurement.mutate({ id: item.id, qty: inheritedQty ?? null, unit: inheritedUnit ?? null });
            }
            if (picks.length > 1) {
              await Promise.all(
                picks.slice(1).map((name) =>
                  addShoppingItem.mutateAsync({
                    productName: name,
                    source: item.source ?? undefined,
                    basketLabel: item.basketLabel ?? undefined,
                    quantityValue: inheritedQty,
                    unit: inheritedUnit,
                  })
                )
              );
            }
          } catch {
            // individual mutations surface their own error toasts
          } finally {
            queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
          }
        } : undefined}
      />
    );
  }

  const menuDropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center justify-center p-1 rounded-md transition-colors hover:bg-accent/40"
          data-testid="button-workspace-menu"
        >
          <img src={thaAppleSrc} alt="Menu" className="h-9 w-9 object-contain" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() => lookupPrices.mutate()}
          disabled={lookupPrices.isPending || items.length === 0}
          data-testid="button-lookup-prices"
        >
          {lookupPrices.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
          {lookupPrices.isPending ? "Matching products…" : "Match Products"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSplitByShop((v) => !v)} data-testid="toggle-split-by-shop">
          <Columns2 className="h-4 w-4 mr-2" />
          Split by shop
          {splitByShop && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setSlCameraOpen(true)}
          disabled={slScanLoading}
          data-testid="button-scan-shopping-list"
        >
          {slScanLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <ScanLine className="h-4 w-4 mr-2" />}
          {slScanLoading ? "Scanning…" : "Scan list"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setIsFullscreen((v) => !v)} data-testid="button-fullscreen-toggle">
          {isFullscreen ? <Minimize2 className="h-4 w-4 mr-2" /> : <Maximize2 className="h-4 w-4 mr-2" />}
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => togglePreference.mutate()}
          disabled={togglePreference.isPending}
          data-testid="button-toggle-units"
        >
          <Scale className="h-4 w-4 mr-2" />
          {measurementPref === "metric" ? "Switch to Imperial" : "Switch to Metric"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setBasketDialogOpen(true)}
          disabled={items.length === 0}
          data-testid="button-send-to-supermarket"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Send to Supermarket
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setExportDialogOpen(true)}
          disabled={items.length === 0}
          data-testid="button-export-list"
        >
          <Download className="h-4 w-4 mr-2" />
          Export / Download
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => recalculateScores.mutate()}
          disabled={recalculateScores.isPending}
          data-testid="button-recalculate-scores"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${recalculateScores.isPending ? "animate-spin" : ""}`} />
          {recalculateScores.isPending ? "Recalculating…" : "Recalculate Scores"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <Link href="/shopping" asChild>
          <DropdownMenuItem data-testid="button-open-basket">
            <ShoppingBasket className="h-4 w-4 mr-2 text-primary/70" />
            <span className="flex-1">Basket</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setClearDialogOpen(true)}
          disabled={items.length === 0}
          className="text-destructive focus:text-destructive"
          data-testid="button-clear-all"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear List…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // ── Compact header status text ─────────────────────────────────────────────
  let headerStatusText: string | null = null;
  if (items.length > 0 && !isLoading) {
    if (mode === "shop" && shopSummary) {
      const { needCount, total, foundCount, haveCount } = shopSummary;
      const resolved = foundCount + haveCount;
      if (total > 0) headerStatusText = needCount === 0 ? "All found" : `${needCount} to find`;
    } else if (mode === "prep" && prepSummary) {
      const { allPrepDone, pantryTotal, pantryReviewed, uncertainTotal, uncertainResolved } = prepSummary;
      if (allPrepDone) {
        headerStatusText = "Ready to shop";
      } else {
        const parts: string[] = [];
        if (pantryTotal > 0) parts.push(`${pantryReviewed}/${pantryTotal} pantry`);
        if (uncertainTotal > 0) parts.push(`${uncertainResolved}/${uncertainTotal} qty`);
        headerStatusText = parts.join(" · ") || null;
      }
    } else {
      const n = filteredUncheckedItems.length;
      const c = filteredCheckedItems.length;
      if (n === 0 && c > 0) headerStatusText = "All done";
      else if (n > 0) headerStatusText = c > 0 ? `${n} to buy · ${c} ✓` : `${n} to buy`;
    }
  }

  // ── Workspace control bar (filters + status + sort) ────────────────────────
  const workspaceControlBar = items.length > 0 && !isLoading ? (
    <div className="flex items-center gap-2 min-w-0">
      {/* Source filter pills — horizontally scrollable */}
      <div className="flex items-center gap-1 min-w-0 flex-1 overflow-x-auto no-scrollbar">
        {SOURCE_FILTERS.map(({ id, label }) => {
          const count = filterCounts[id];
          if (id !== "all" && count === 0) return null;
          return (
            <button
              key={id}
              onClick={() => setSourceFilter(id)}
              className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border transition-all ${
                sourceFilter === id
                  ? "bg-primary/10 text-primary border-primary/40 dark:bg-primary/20"
                  : "bg-transparent text-muted-foreground border-border/50 hover:border-border hover:text-foreground"
              }`}
            >
              {label}
              {id !== "all" && (
                <span className={`tabular-nums ${sourceFilter === id ? "opacity-70" : "opacity-50"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {/* Compact status — hidden on xs to preserve space */}
      {headerStatusText && (
        <span className="hidden sm:block shrink-0 text-[10px] text-muted-foreground/60 whitespace-nowrap tabular-nums border-l border-border/30 pl-2">
          {headerStatusText}
        </span>
      )}
      {/* Sort dropdown */}
      <div className="shrink-0 border-l border-border/30 pl-2">
        <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
          <SelectTrigger className="h-6 text-[11px] w-[120px] border-border/50 bg-transparent px-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="apple_score">Apple Score</SelectItem>
            {hasMatchedPrices && <SelectItem value="price">Price</SelectItem>}
            <SelectItem value="item">By Item</SelectItem>
            <SelectItem value="item_category">By Category + Item</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ) : undefined;

  return (
    <>
      {!isFullscreen && (
        <PageHeader
          title="Shopping"
          icon={<ShoppingBasket className="h-5 w-5" />}
          realm="basket"
          center={<ModeSwitcher mode={mode} onChange={(m) => { setMode(m); }} />}
          controlBar={workspaceControlBar}
          actions={menuDropdown}
        />
      )}
      <div className={isFullscreen
        ? "fixed inset-0 z-50 bg-background overflow-auto flex flex-col"
        : "max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-20"}
      >
      {isFullscreen && (
        <div className="border-b border-border/50 bg-background shrink-0">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-2">
              <ShoppingBasket className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Shopping</span>
            </div>
            <div className="flex items-center gap-2">
              <ModeSwitcher mode={mode} onChange={(m) => { setMode(m); }} />
              {menuDropdown}
            </div>
          </div>
          {workspaceControlBar && (
            <div className="px-4 sm:px-6 pb-2.5">
              {workspaceControlBar}
            </div>
          )}
        </div>
      )}
      <div className={isFullscreen ? "flex-1 overflow-auto px-4 py-4 sm:px-6 sm:py-6" : ""}>

      {/* ── Shopping rows ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-8 text-center">
          <ShoppingBasket className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Your shopping list is empty.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Generate a list from your{" "}
            <Link href="/planner" className="text-primary hover:underline">
              weekly plan
            </Link>{" "}
            to get started.
          </p>
        </div>
      ) : (
        <>

        <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden mb-6">

          {/* ── Review mode: flat list ─────────────────────────────── */}
          {mode === "review" && (
            <>
              {uncheckedItems.length === 0 && checkedItems.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Your basket is empty.
                </div>
              ) : (
                <>
                  {sortedFilteredItems.length === 0 && sourceFilter !== "all" ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No items match this filter.
                    </div>
                  ) : sortOrder === "item"
                    ? sortedFilteredItems.map(renderRow)
                    : sortOrder === "item_category" || !splitByShop
                      ? reviewUncheckedByCategory.length >= 1
                        ? reviewUncheckedByCategory.map(({ key, label, items: catItems }) => (
                            <div key={key}>
                              <ShopCategoryHeader label={label} count={catItems.length} />
                              {catItems.map(renderRow)}
                            </div>
                          ))
                        : sortedFilteredItems.map(renderRow)
                      : reviewUncheckedAlpha.map(renderRow)
                  }
                  {filteredCheckedItems.length > 0 && (
                    <>
                      <div className="px-4 py-1.5 border-t border-border/30 bg-[hsl(26,15%,96%)] dark:bg-[hsl(26,8%,15%)]">
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                          Checked ({filteredCheckedItems.length})
                        </span>
                      </div>
                      {filteredCheckedItems.map(renderRow)}
                    </>
                  )}
                </>
              )}
            </>
          )}

          {/* ── Shop mode: category groups + status groups ────────── */}
          {mode === "shop" && (
            <>
              {items.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Your shopping list is empty.
                </div>
              ) : filteredItems.length === 0 && sourceFilter !== "all" ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No items match this filter.
                </div>
              ) : (
                <>
                  {/* Still need — grouped by in-store category */}
                  {shopGroups.need.length > 0 && (
                    <>
                      {(shopGroups.found.length > 0 || shopGroups.defer.length > 0 || shopGroups.have.length > 0) && (
                        <ShopGroupHeader
                          label="Still need"
                          count={shopGroups.need.length}
                          variant="need"
                        />
                      )}
                      {sortOrder === "item"
                        ? shopGroups.need.map(renderRow)
                        : shopNeedByCategory.length >= 1
                          ? shopNeedByCategory.map(({ key, label, items: catItems }) => (
                              <div key={key}>
                                <ShopCategoryHeader label={label} count={catItems.length} />
                                {catItems.map(renderRow)}
                              </div>
                            ))
                          : shopGroups.need.map(renderRow)
                      }
                    </>
                  )}

                  {/* Found it */}
                  {shopGroups.found.length > 0 && (
                    <>
                      <ShopGroupHeader
                        label="Found it"
                        count={shopGroups.found.length}
                        variant="found"
                      />
                      {shopGroups.found.map(renderRow)}
                    </>
                  )}

                  {/* Next shop */}
                  {shopGroups.defer.length > 0 && (
                    <>
                      <ShopGroupHeader
                        label="Next shop"
                        count={shopGroups.defer.length}
                        variant="defer"
                      />
                      {shopGroups.defer.map(renderRow)}
                    </>
                  )}

                  {/* Already have (set via Prep stage) */}
                  {shopGroups.have.length > 0 && (
                    <>
                      <ShopGroupHeader
                        label="Already have"
                        count={shopGroups.have.length}
                        variant="have"
                      />
                      {shopGroups.have.map(renderRow)}
                    </>
                  )}

                  {/* All accounted for */}
                  {shopGroups.need.length === 0 && filteredItems.length > 0 && (
                    <div className="px-4 py-4 text-center">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1.5" />
                      <p className="text-sm font-medium text-foreground">
                        All items accounted for
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Great shop — nothing left to find
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── Prep mode: grouped list ────────────────────────────── */}
          {mode === "prep" && (
            <>
              {filteredUncheckedItems.length === 0 && filteredCheckedItems.length === 0 && sourceFilter !== "all" && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No items match this filter.
                </div>
              )}
              {prepGroups.pantry.length > 0 && (
                <>
                  <PrepGroupHeader
                    label="Check at home first"
                    count={prepGroups.pantry.length}
                    resolvedCount={prepSummary.pantryReviewed}
                  />
                  {prepGroups.pantry.map(renderRow)}
                </>
              )}
              {prepGroups.uncertain.length > 0 && (
                <>
                  <PrepGroupHeader
                    label="Quantities to confirm"
                    count={prepGroups.uncertain.length}
                    resolvedCount={prepSummary.uncertainResolved}
                  />
                  {prepGroups.uncertain.map(renderRow)}
                </>
              )}
              {prepGroups.attention.length > 0 && (
                <>
                  <PrepGroupHeader
                    label="Needs a closer look"
                    count={prepGroups.attention.length}
                  />
                  {prepGroups.attention.map(renderRow)}
                </>
              )}
              {prepGroups.ready.length > 0 && (
                <>
                  <PrepGroupHeader
                    label="Ready to buy"
                    count={prepGroups.ready.length}
                  />
                  {prepGroups.ready.map(renderRow)}
                </>
              )}
              {filteredCheckedItems.length > 0 && (
                <>
                  <div className="px-4 py-1.5 border-t border-border/30 bg-muted/20">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                      Checked ({filteredCheckedItems.length})
                    </span>
                  </div>
                  {filteredCheckedItems.map(renderRow)}
                </>
              )}
            </>
          )}

        </div>
        </>
      )}

      {/* ── Fallback footer ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground/50 px-1">
        <FlaskConical className="h-3.5 w-3.5 shrink-0" />
        <span>
          Full product database also available in{" "}
          <Link href="/basket" className="hover:text-muted-foreground hover:underline">
            Basket
          </Link>
          .
        </span>
      </div>

      {/* ── In-workspace analyser sheet ─────────────────────────────────── */}
      <WorkspaceAnalyserSheet
        open={analyserItem !== null}
        onOpenChange={(v) => { if (!v) setAnalyserItem(null); }}
        item={analyserItem}
      />

      </div>{/* /inner content div */}
      </div>{/* /outer fullscreen-or-page div */}

      {/* ── Export dialog ──────────────────────────────────────────── */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-[420px]" data-testid="dialog-export-list">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Export List
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
                  {SUPERMARKET_NAMES.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Export your {items.length} items as a text file, copy to clipboard, or open search pages.
            </p>
          </div>
          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="outline" onClick={() => handleExport("copy")} className="gap-1" data-testid="button-copy-clipboard">
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            <Button variant="outline" onClick={() => handleExport("list")} className="gap-1" data-testid="button-export-text">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button onClick={() => handleExport("links")} className="gap-1" data-testid="button-export-links">
              <ExternalLink className="h-4 w-4" />
              Search Pages
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Send to Supermarket dialog ─────────────────────────────── */}
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
              Send your {items.length} items to a supermarket. Matched products open directly; others open as search pages.
            </p>
            {primarySupermarkets.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground/70">Direct Basket</p>
                <div className="grid grid-cols-3 gap-3">
                  {primarySupermarkets.map((store) => (
                    <button
                      key={store.key}
                      className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-3.5 hover:bg-accent/40 transition-colors disabled:opacity-50"
                      disabled={basketSending !== null}
                      onClick={() => handleSendBasket(store.name)}
                      data-testid={`button-basket-${store.key}`}
                    >
                      {basketSending === store.name
                        ? <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                        : <RetailerLogo name={store.name} size="h-7" />}
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
                  {otherSupermarkets.map((store) => (
                    <button
                      key={store.key}
                      className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-2 py-2.5 hover:bg-accent/40 transition-colors disabled:opacity-50"
                      disabled={basketSending !== null}
                      onClick={() => handleSendBasket(store.name)}
                      data-testid={`button-basket-${store.key}`}
                    >
                      {basketSending === store.name
                        ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        : <RetailerLogo name={store.name} size="h-5" />}
                      <span className="text-[11px] font-medium text-foreground/70 truncate w-full text-center">{store.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {enhancedSupermarkets.length === 0 && (
              <div className="grid grid-cols-3 gap-2">
                {SUPERMARKET_NAMES.map((name) => (
                  <button
                    key={name}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-2 py-2.5 hover:bg-accent/40 transition-colors disabled:opacity-50"
                    disabled={basketSending !== null}
                    onClick={() => handleSendBasket(name)}
                    data-testid={`button-basket-${name.toLowerCase().replace(/[^a-z]/g, "")}`}
                  >
                    {basketSending === name
                      ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      : <RetailerLogo name={name} size="h-5" />}
                    <span className="text-[11px] font-medium text-foreground/70 truncate w-full text-center">{name}</span>
                  </button>
                ))}
              </div>
            )}
            {basketResult && (
              <div className="border border-border rounded-md p-3 space-y-2 bg-muted/30">
                <span className="text-sm font-medium">{basketResult.supermarket} Basket</span>
                {basketResult.message && <p className="text-xs text-muted-foreground">{basketResult.message}</p>}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{basketResult.matchedCount} product links</span>
                  <span>{basketResult.totalCount - basketResult.matchedCount} search pages</span>
                </div>
                {basketResult.itemUrls.length > 8 && (
                  <Button
                    variant="outline" size="sm" className="gap-1 w-full"
                    onClick={() => {
                      const remaining = basketResult.itemUrls.slice(8);
                      remaining.forEach((item) => window.open(item.url, "_blank"));
                      toast({ title: `Opened ${remaining.length} more items` });
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
                Want a text file instead?{" "}
                <button
                  className="text-primary underline underline-offset-2"
                  onClick={() => { setBasketDialogOpen(false); setExportDialogOpen(true); }}
                >
                  Download formatted list
                </button>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Clear confirmation dialog ──────────────────────────────── */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent className="sm:max-w-[360px]" data-testid="dialog-clear-list">
          <DialogHeader>
            <DialogTitle>Clear shopping list?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            This will remove all {items.length} item{items.length !== 1 ? "s" : ""} from your shopping list. This cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => clearAll.mutate()}
              disabled={clearAll.isPending}
              data-testid="button-confirm-clear"
            >
              {clearAll.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Clear List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Hidden file input for scan fallback ───────────────────── */}
      <input
        ref={slFileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleShoppingListScan(f); }}
      />
      <CameraModal
        open={slCameraOpen}
        onOpenChange={setSlCameraOpen}
        onCapture={handleShoppingListScan}
        onUploadInstead={() => slFileRef.current?.click()}
      />
      <ShoppingListScanReview
        open={slReviewOpen}
        onOpenChange={setSlReviewOpen}
        scanData={slScanData}
      />
    </>
  );
}
