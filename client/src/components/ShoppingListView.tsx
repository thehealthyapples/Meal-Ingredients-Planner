import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { normalizeIngredientKey } from "@shared/normalize";
import { Printer, X, CheckCircle2, Share2, ShoppingBag, Copy, Check, ArrowLeft, ArrowRight, Store, SkipForward, Pencil, Search, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}

interface ShoppingListViewProps {
  items: SLItem[];
  extras: { id: number; name: string; category: string; alwaysAdd: boolean; inBasket: boolean }[];
  sourcesByItem: Map<number, IngredientSource[]>;
  pantryKeySet: Set<string>;
  measurementPref: "metric" | "imperial";
  allPriceMatches: ProductMatch[];
  /** DB-backed status update — preferred over onToggleBought. */
  onUpdateStatus?: (id: number, status: string) => void;
  /** Legacy: writes the boolean `checked` field. Used as fallback when onUpdateStatus is absent. */
  onToggleBought?: (id: number, checked: boolean) => void;
  onClose: () => void;
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
  onAddItem?: (rawText: string) => Promise<void> | void;
  /** Trigger store-scoped product matching for the currently selected store. */
  onMatchStore?: (store: string) => void;
  /** True while a store-scoped match is in progress. */
  isMatchingPrices?: boolean;
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

// ── Product match resolution ───────────────────────────────────────────────
// Priority: 1. THA curated picks for this store, 2. Price matches for this item+store.

function resolveDisplayMatches(
  item: SLItem,
  allPriceMatches: ProductMatch[],
  thaPicks: Record<string, IngredientProduct[]>,
  store: string,
): ShopDisplayMatch[] {
  const itemKey = normalizeIngredientKey(item.normalizedName ?? item.productName ?? "");
  const storeNorm = store.toLowerCase();

  const thaMatches: ShopDisplayMatch[] = (thaPicks[itemKey] ?? [])
    .filter(p => p.retailer.toLowerCase() === storeNorm)
    .sort((a, b) => {
      const rA = (a.tags as any)?.thaRating ?? a.priority ?? 0;
      const rB = (b.tags as any)?.thaRating ?? b.priority ?? 0;
      return rB - rA;
    })
    .map(p => ({
      productName: p.productName,
      // Use tags.thaRating first; fall back to the priority column which IS the 1-5 apple
      // rating stored on ingredient_products rows. Without this fallback, curated THA picks
      // showed no apple rating in shop view even when priority was set.
      thaRating: (p.tags as any)?.thaRating ?? (p.priority > 0 ? p.priority : null),
      price: null,
      pricePerUnit: p.size ?? null,
      productUrl: null,
    }));

  const priceMatches: ShopDisplayMatch[] = allPriceMatches
    .filter(m => m.shoppingListItemId === item.id && m.supermarket.toLowerCase() === storeNorm)
    .sort((a, b) => (b.thaRating ?? 0) - (a.thaRating ?? 0))
    .map(m => ({
      productName: m.productName,
      thaRating: m.thaRating ?? null,
      price: m.price ?? null,
      pricePerUnit: m.pricePerUnit ?? null,
      productUrl: m.productUrl ?? null,
    }));

  const combined = [...thaMatches, ...priceMatches];
  const seen = new Set<string>();
  const deduped = combined.filter(m => {
    const key = m.productName.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Globally sort by thaRating DESC so the highest-rated product is always shown first.
  // This is a stable sort: ties preserve the THA-picks-first insertion order from the spread above,
  // so curated picks beat price-match entries of identical rating.
  deduped.sort((a, b) => (b.thaRating ?? 0) - (a.thaRating ?? 0));

  // If this item is a whole food, any match with a null rating should show 5 apples
  // (whole foods are always 5 — no processing, no additives).
  const wholeFoodItem = isWholeFood(item);
  if (wholeFoodItem) {
    return deduped.map(m => ({ ...m, thaRating: m.thaRating ?? 5 }));
  }
  return deduped;
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

// ── Multi-select ambiguity terms ──────────────────────────────────────────────
// When a needsReview item's productName (lowercased) is in this set, the
// ambiguity suggestions are shown as checkboxes so the user can pick multiple.
// Selecting multiple creates one basket item per selection and removes the original.
// Selecting exactly one behaves identically to single-select (rename).

// ── Vague-item clarification ───────────────────────────────────────────────
// Maps a generic item name to refinement chips shown inline in shop view.
// Only items whose normalised name EXACTLY matches a key here get a prompt.
// Clear, specific items (e.g. "oven chips", "greek yoghurt") will not match.

const CLARIFICATION_OPTIONS: Record<string, { label: string; refinements: string[] }> = {
  yoghurt:  { label: "What kind?", refinements: ["Greek natural yoghurt", "Yoghurt with berries", "Kids yoghurt", "High-protein yoghurt"] },
  yogurt:   { label: "What kind?", refinements: ["Greek natural yoghurt", "Yoghurt with berries", "Kids yoghurt", "High-protein yoghurt"] },
  bread:    { label: "What kind?", refinements: ["Sourdough bread", "Wholemeal bread", "White bread", "Seeded bread"] },
  milk:     { label: "What kind?", refinements: ["Whole milk", "Semi-skimmed milk", "Skimmed milk", "Oat milk"] },
  cheese:   { label: "What kind?", refinements: ["Cheddar cheese", "Mozzarella", "Cream cheese", "Brie"] },
  juice:    { label: "What kind?", refinements: ["Orange juice", "Apple juice", "Cranberry juice", "Pineapple juice"] },
  cereal:   { label: "What kind?", refinements: ["Porridge oats", "Cornflakes", "Granola", "Muesli"] },
  butter:   { label: "What kind?", refinements: ["Salted butter", "Unsalted butter", "Plant-based butter"] },
  cream:    { label: "What kind?", refinements: ["Single cream", "Double cream", "Soured cream", "Crème fraîche"] },
  pasta:    { label: "What kind?", refinements: ["Spaghetti", "Penne pasta", "Fusilli pasta", "Tagliatelle"] },
  rice:     { label: "What kind?", refinements: ["Basmati rice", "White rice", "Brown rice", "Arborio rice"] },
  sauce:    { label: "What kind?", refinements: ["Tomato pasta sauce", "Pesto", "Curry sauce", "Stir-fry sauce"] },
  meat:     { label: "What kind?", refinements: ["Chicken breast", "Beef mince", "Pork sausages", "Lamb chops"] },
  fish:     { label: "What kind?", refinements: ["Salmon fillets", "Cod fillets", "Tuna", "Prawns"] },
  oil:      { label: "What kind?", refinements: ["Olive oil", "Vegetable oil", "Coconut oil", "Rapeseed oil"] },
  stock:    { label: "What kind?", refinements: ["Chicken stock", "Beef stock", "Vegetable stock", "Fish stock"] },
  crackers: { label: "What kind?", refinements: ["Oatcakes", "Cream crackers", "Rice cakes", "Rye crispbread"] },
};

function getVagueItemKey(item: SLItem): string | null {
  const name = (item.normalizedName ?? item.productName ?? "").toLowerCase().trim();
  // Strip any leading digit/quantity (e.g. "2 milk" → "milk")
  const stripped = name.replace(/^\d+(?:\.\d+)?\s+/, "").trim();
  return CLARIFICATION_OPTIONS[stripped] ? stripped : null;
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
const FRESH_HERBS = new Set([
  "coriander", "basil", "parsley", "mint", "dill", "thyme", "rosemary", "sage", "chive",
]);

function getItemCatKey(category: string | null | undefined, name: string): string {
  const lowerName = name.toLowerCase();

  // ── Name-based overrides (run before DB category — correct regardless of stored value) ──

  // Tinned/canned → pantry (must be first: "canned tomato" shouldn't be produce)
  if (/^(can |tin |tinned |canned )/.test(lowerName)) return "pantry";

  // Frozen items (server had no frozen category until recently; name is authoritative)
  if (lowerName.startsWith("frozen ") || FROZEN_KEYWORDS.some(kw => lowerName.includes(kw)))
    return "frozen";
  if (lowerName === "chips" || lowerName === "oven chips") return "frozen";

  // Potatoes → pantry (ambient starch, not chilled produce)
  if (lowerName.includes("potato")) return "pantry";

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
  if (["oils", "condiments", "nuts", "legumes", "tinned", "pantry", "spices"].includes(raw))
    return "pantry";

  // ── Name-based fallback (handles null/other/unknown DB category) ──
  // Items inserted before category detection existed, or via a path that skipped it,
  // will have category=null or category="other". Use the name to bin them correctly.

  if (MEAT_WORDS.some(w => lowerName.includes(w))) return "meat";
  if (FISH_WORDS.some(w => lowerName.includes(w))) return "meat"; // meat & fish tab
  if (EGG_WORDS.some(w => lowerName === w || lowerName.startsWith(w + "s") || lowerName.startsWith(w + " "))) return "dairy";
  if (DAIRY_WORDS.some(w => lowerName.includes(w))) return "dairy";
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
  if (value == null || !unit) return "";
  if (unit === "unit") return value === 1 ? "1" : String(value);
  return `${value % 1 === 0 ? value : value.toFixed(1)} ${unit}`;
}

function capWords(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── State chip control ─────────────────────────────────────────────────────

const STATE_CHIPS: Array<{ value: ShopState; label: string; activeClass: string }> = [
  { value: "need",         label: "Need",      activeClass: "bg-muted text-foreground font-semibold" },
  { value: "in_basket",    label: "Got it",    activeClass: "bg-primary text-primary-foreground font-semibold" },
  { value: "not_in_shop",  label: "Not found", activeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-semibold" },
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
    return <span style={{ fontSize: 8, color: "#166534", fontWeight: 700 }}>✓ Got it</span>;
  if (state === "not_in_shop")
    return <span style={{ fontSize: 8, color: "#92400e", fontWeight: 700 }}>✗ Not found</span>;
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
  onToggleBought,
  onClose,
  initialStore,
  initialPhase,
  thaPicks = {},
  onRenameItem,
  onRemoveItem,
  onAddItem,
  onMatchStore,
  isMatchingPrices = false,
}: ShoppingListViewProps) {
  const [notInShop, setNotInShop] = useState<Set<number>>(() => loadNotInShop());
  const [selectedSupermarket, setSelectedSupermarket] = useState<string>(initialStore ?? "Tesco");
  const [extraStates, setExtraStates] = useState<Map<number, "in_basket" | "not_in_shop">>(new Map());
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [shopSession, setShopSession] = useState<ShopSession | null>(null);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied">("idle");
  const [phase, setPhase] = useState<"cupboard_check" | "shopping">(initialPhase ?? "cupboard_check");
  const [atHomeIds, setAtHomeIds] = useState<Set<number>>(new Set());
  const [productIndexMap, setProductIndexMap] = useState<Record<number, number>>({});
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  // Track items whose vague name the user has already responded to (clarified or dismissed).
  const [clarifiedItemIds, setClarifiedItemIds] = useState<Set<number>>(new Set());
  // Cupboard-check review state: tracks which needsReview items the user has
  // explicitly kept/edited so we stop showing the review card for them.
  const [reviewDismissed, setReviewDismissed] = useState<Set<number>>(new Set());
  const [reviewEditId, setReviewEditId] = useState<number | null>(null);
  const [reviewEditVal, setReviewEditVal] = useState<string>("");
  // Multi-select state for group umbrella terms (e.g. "berries").
  // Keyed by item.id → set of selected suggestion strings.
  const [multiSelections, setMultiSelections] = useState<Map<number, Set<string>>>(new Map());
  // True while handleHeadToShop is committing pending selections — prevents double-tap.
  const [isCommitting, setIsCommitting] = useState(false);
  // Cupboard check: inline add-item input
  const [addingItem, setAddingItem] = useState(false);
  const [addItemVal, setAddItemVal] = useState("");
  const itemsScrollRef = useRef<HTMLDivElement>(null);
  const tabStripRef = useRef<HTMLDivElement>(null);
  const activeTabElRef = useRef<HTMLButtonElement>(null);


  useEffect(() => {
    saveNotInShop(notInShop, items);
  }, [notInShop, items]);

  function handleStoreChange(store: string) {
    setSelectedSupermarket(store);
    setProductIndexMap({});
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

    if (multiSelections.size > 0) {
      setIsCommitting(true);
      try {
        const existingNames = new Set(
          items.map(i => (i.productName ?? '').toLowerCase().trim())
        );
        const toRemove: number[] = [];
        const addPromises: Array<Promise<void>> = [];

        for (const [itemId, selected] of Array.from(multiSelections.entries())) {
          if (selected.size === 0) continue;
          const picks = Array.from(selected);

          if (picks.length === 1) {
            // Single pick — rename the umbrella item in place
            if (onRenameItem) {
              const r = onRenameItem(itemId, picks[0]);
              if (r instanceof Promise) addPromises.push(r);
            }
          } else if (onAddItem) {
            // Multiple picks — add each child that isn't already in the list
            for (const p of picks) {
              if (!existingNames.has(p.toLowerCase().trim())) {
                const r = onAddItem(p);
                if (r instanceof Promise) addPromises.push(r);
                existingNames.add(p.toLowerCase().trim()); // prevent double-add within same batch
              }
            }
            toRemove.push(itemId);
          } else if (onRenameItem) {
            // No add capability — rename to first pick as fallback
            const r = onRenameItem(itemId, picks[0]);
            if (r instanceof Promise) addPromises.push(r);
          }
        }

        await Promise.all(addPromises);
        toRemove.forEach(id => onRemoveItem?.(id));
        setMultiSelections(new Map());
      } finally {
        setIsCommitting(false);
      }
    }

    setPhase("shopping");
  }, [isCommitting, multiSelections, items, onAddItem, onRenameItem, onRemoveItem]);

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
    // Legacy local-state path
    if (next === "in_basket" && !item.checked) onToggleBought?.(item.id, true);
    else if (next !== "in_basket" && item.checked) onToggleBought?.(item.id, false);
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

  // ── Filtered item list (excludes at-home items once in shopping phase) ────

  const shoppingItems = useMemo(
    () => (phase === "shopping"
      ? items.filter((i) => onUpdateStatus ? i.shopStatus !== "already_got" : !atHomeIds.has(i.id))
      : items),
    [items, atHomeIds, phase, onUpdateStatus],
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
  }, [items, activeExtras]);

  // ── Active category ───────────────────────────────────────────────────────

  const activeCatKey = activeTab ?? groupedCategories[0]?.key ?? null;
  const activeCat = groupedCategories.find((c) => c.key === activeCatKey) ?? groupedCategories[0] ?? null;

  function handleTabChange(key: string) {
    setActiveTab(key);
    itemsScrollRef.current?.scrollTo({ top: 0 });
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
    const qty = fmtQty(item.quantityValue, item.unit, item.quantityInGrams, measurementPref);
    const sources = sourcesByItem.get(item.id) ?? [];
    const firstMeal = (sources[0] as any)?.mealName as string | undefined;
    const isPantryStaple = pantryKeySet.has(
      normalizeIngredientKey(item.normalizedName ?? item.productName ?? ""),
    );

    // Resolve display matches: THA picks first, then price matches
    const resolvedMatches = resolveDisplayMatches(item, allPriceMatches, thaPicks, selectedSupermarket);
    const currentMatchIndex = productIndexMap[item.id] ?? 0;
    const resolvedMatch = resolvedMatches[currentMatchIndex] ?? null;
    const isEditing = editingItemId === item.id;

    // Effective apple rating: match rating > item DB rating > whole-food inference (5).
    // This ensures whole foods always show 5 apples even when no product match exists.
    const itemIsWholeFood = isWholeFood(item);
    const effectiveRating: number | null =
      resolvedMatch?.thaRating ?? item.thaRating ?? (itemIsWholeFood ? 5 : null);

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
          </div>

          {/* Inline rename input */}
          {isEditing ? (
            <div className="tha-print-hide flex items-center gap-1.5 mt-1.5">
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
          ) : (
            <>
              {/* Product match hint with cycling — rating moved to centre column */}
              {state === "need" && resolvedMatch && (
                <div className="tha-print-hide flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-[11px] text-muted-foreground/70 truncate max-w-[160px]">
                    {resolvedMatch.productName}
                  </span>
                  {resolvedMatch.price != null && (
                    <span className="text-[11px] text-muted-foreground/70 tabular-nums">
                      £{resolvedMatch.price.toFixed(2)}
                    </span>
                  )}
                  {resolvedMatches.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleNextProduct(item.id, resolvedMatches.length); }}
                      className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/40 hover:text-foreground transition-colors"
                      title="Next product option"
                    >
                      <SkipForward className="h-2.5 w-2.5" />
                      <span>{currentMatchIndex + 1}/{resolvedMatches.length}</span>
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
                </div>
              )}
              {state === "need" && !resolvedMatch && (firstMeal || effectiveRating != null) && (
                <div className="tha-print-hide flex items-center gap-1.5 mt-0.5">
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
                  Try next shop
                </p>
              )}
              {/* Vague-item clarification chips — only when needed, not already clarified */}
              {state === "need" && !clarifiedItemIds.has(item.id) && (() => {
                const vagueKey = getVagueItemKey(item);
                if (!vagueKey) return null;
                const { label, refinements } = CLARIFICATION_OPTIONS[vagueKey];
                return (
                  <div className="tha-print-hide mt-1.5">
                    <p className="text-[10px] text-muted-foreground/55 mb-1">{label}</p>
                    <div className="flex flex-wrap gap-1">
                      {refinements.map((r) => (
                        <button
                          key={r}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRenameItem?.(item.id, r);
                            setClarifiedItemIds((prev) => { const s = new Set(prev); s.add(item.id); return s; });
                          }}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border border-border/60 bg-muted/50 hover:bg-primary/10 hover:border-primary/40 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {r}
                        </button>
                      ))}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setClarifiedItemIds((prev) => { const s = new Set(prev); s.add(item.id); return s; });
                        }}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border border-border/30 bg-transparent text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                      >
                        Keep as is
                      </button>
                    </div>
                  </div>
                );
              })()}
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
      style={{ minHeight: "calc(100vh - 9rem)" }}
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

          {/* Right: Supermarket picker + Print + Close */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {phase === "shopping" && (
              <>
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
                {onMatchStore && (() => {
                  const storeNorm = selectedSupermarket.toLowerCase();
                  const hasMatchesForStore = allPriceMatches.some(
                    m => m.supermarket.toLowerCase() === storeNorm
                  );
                  if (hasMatchesForStore || isMatchingPrices) return null;
                  return (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMatchStore(selectedSupermarket)}
                      className="h-8 px-2.5 text-xs bg-background/70 gap-1"
                      title={`Find products at ${selectedSupermarket}`}
                    >
                      <Search className="h-3 w-3" />
                      <span className="hidden sm:inline">Find</span>
                    </Button>
                  );
                })()}
              </>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 h-8 px-2.5 text-xs bg-background/70"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 px-2.5 text-xs gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to basket</span>
            </Button>
          </div>
        </div>

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
                            // Parse reviewSuggestions — supports both formats:
                            //   old: string[]  (written before the mode field was added)
                            //   new: { items: string[], mode: "single" | "multi" }
                            const { suggestions, isMultiSelectGroup } = (() => {
                              if (!isAmbiguous) return { suggestions: [] as string[], isMultiSelectGroup: false };
                              try {
                                const raw = JSON.parse((item as any).reviewSuggestions ?? '[]');
                                if (Array.isArray(raw)) {
                                  // Legacy format — default to single-select
                                  return { suggestions: raw as string[], isMultiSelectGroup: false };
                                }
                                return {
                                  suggestions: (raw?.items ?? []) as string[],
                                  isMultiSelectGroup: raw?.mode === 'multi',
                                };
                              } catch {
                                return { suggestions: [] as string[], isMultiSelectGroup: false };
                              }
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
                                {/* Ambiguity suggestion chips / checkboxes */}
                                {isAmbiguous && suggestions.length > 0 && (() => {
                                  if (isMultiSelectGroup) {
                                    // Multi-select: checkboxes + confirm button
                                    const selected = multiSelections.get(item.id) ?? new Set<string>();

                                    const toggleSelection = (s: string) => {
                                      setMultiSelections(prev => {
                                        const next = new Map(prev);
                                        const cur = new Set(next.get(item.id) ?? []);
                                        if (cur.has(s)) cur.delete(s); else cur.add(s);
                                        next.set(item.id, cur);
                                        return next;
                                      });
                                    };

                                    const confirmSelection = () => {
                                      const picks = Array.from(selected);
                                      if (picks.length === 0) return;
                                      if (picks.length === 1) {
                                        // Single pick → rename in place
                                        if (onRenameItem) onRenameItem(item.id, picks[0]);
                                      } else {
                                        // Multiple picks → add each, remove original umbrella item.
                                        // Only proceed if onAddItem is available — do not remove
                                        // the original without being able to replace it.
                                        if (onAddItem) {
                                          picks.forEach(p => onAddItem(p));
                                          if (onRemoveItem) onRemoveItem(item.id);
                                        } else if (onRenameItem) {
                                          // Fallback: rename to first pick if no add capability
                                          onRenameItem(item.id, picks[0]);
                                        }
                                      }
                                      setReviewDismissed(prev => { const s = new Set(prev); s.add(item.id); return s; });
                                      setMultiSelections(prev => { const m = new Map(prev); m.delete(item.id); return m; });
                                    };

                                    return (
                                      <div className="flex flex-col gap-2 mt-0.5">
                                        <div className="flex flex-wrap gap-1.5">
                                          {suggestions.map(s => {
                                            const checked = selected.has(s);
                                            return (
                                              <button
                                                key={s}
                                                onClick={() => toggleSelection(s)}
                                                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1.5 ${
                                                  checked
                                                    ? 'border-primary bg-primary/10 text-primary font-medium'
                                                    : 'border-primary/30 bg-primary/5 text-primary/80 hover:bg-primary/10 hover:border-primary/50'
                                                }`}
                                              >
                                                <span className={`inline-block w-3 h-3 rounded-sm border flex-shrink-0 ${checked ? 'bg-primary border-primary' : 'border-primary/40'}`}>
                                                  {checked && (
                                                    <svg viewBox="0 0 10 10" className="w-full h-full text-primary-foreground" fill="currentColor">
                                                      <path d="M1.5 5L4 7.5 8.5 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                  )}
                                                </span>
                                                {s}
                                              </button>
                                            );
                                          })}
                                          <button
                                            onClick={() => { setReviewEditVal(item.productName ?? ""); setReviewEditId(item.id); }}
                                            className="text-[11px] px-2.5 py-1 rounded-full border border-border/50 bg-background/70 text-muted-foreground hover:bg-muted/50 transition-colors"
                                          >
                                            Other…
                                          </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={confirmSelection}
                                            disabled={selected.size === 0}
                                            className="text-[11px] px-3 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                          >
                                            {selected.size === 0
                                              ? 'Select items'
                                              : selected.size === 1
                                                ? 'Confirm'
                                                : `Add ${selected.size} items`}
                                          </button>
                                          <span className="text-[10px] text-muted-foreground/60">
                                            {selected.size === 0 ? 'tap to select' : `${selected.size} selected`}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  }

                                  // Single-select: original chip tap behaviour
                                  return (
                                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                                      {suggestions.map(s => (
                                        <button
                                          key={s}
                                          onClick={() => {
                                            if (onRenameItem) onRenameItem(item.id, s);
                                            setReviewDismissed(prev => { const ns = new Set(prev); ns.add(item.id); return ns; });
                                          }}
                                          className="text-[11px] px-2.5 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary/80 hover:bg-primary/10 hover:border-primary/50 transition-colors"
                                        >
                                          {s}
                                        </button>
                                      ))}
                                      <button
                                        onClick={() => { setReviewEditVal(item.productName ?? ""); setReviewEditId(item.id); }}
                                        className="text-[11px] px-2.5 py-1 rounded-full border border-border/50 bg-background/70 text-muted-foreground hover:bg-muted/50 transition-colors"
                                      >
                                        Other…
                                      </button>
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
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors duration-100 ${isAtHome ? "bg-primary/[0.04] dark:bg-primary/[0.07]" : ""}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span
                            className={`font-medium text-[13.5px] leading-snug ${
                              isAtHome ? "line-through text-muted-foreground/70" : "text-foreground"
                            }`}
                          >
                            {displayName}
                          </span>
                          {qty && (
                            <span className="text-[11.5px] tabular-nums text-muted-foreground/70">{qty}</span>
                          )}
                          {isLikelyInStock && !isAtHome && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-700/40">
                              likely in stock
                            </span>
                          )}
                        </div>
                      </div>
                      {isAtHome ? (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[11px] text-primary/80 font-medium">✓ At home</span>
                          <button
                            onClick={() => onUpdateStatus
                              ? onUpdateStatus(item.id, "pending")
                              : setAtHomeIds((prev) => { const s = new Set(prev); s.delete(item.id); return s; })
                            }
                            className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground underline underline-offset-2"
                          >
                            undo
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onUpdateStatus
                            ? onUpdateStatus(item.id, "already_got")
                            : setAtHomeIds((prev) => { const s = new Set(prev); s.add(item.id); return s; })
                          }
                          className="inline-flex items-center text-[11px] px-3 py-1.5 rounded-lg border border-border/60 bg-background/70 text-foreground/80 hover:bg-muted/50 hover:border-border transition-colors flex-shrink-0 whitespace-nowrap"
                        >
                          In my cupboard
                        </button>
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
                            if (trimmed) { onAddItem(trimmed); setAddItemVal(""); setAddingItem(false); }
                          }
                          if (e.key === "Escape") { setAddItemVal(""); setAddingItem(false); }
                        }}
                        className="flex-1 h-8 text-[13px] px-2.5 rounded-lg border border-border bg-background/80 focus:outline-none focus:ring-1 focus:ring-primary/30"
                        placeholder="Add an item…"
                      />
                      <button
                        onClick={() => {
                          const trimmed = addItemVal.trim();
                          if (trimmed) { onAddItem(trimmed); setAddItemVal(""); setAddingItem(false); }
                        }}
                        className="h-8 px-3 text-[11px] rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => { setAddItemVal(""); setAddingItem(false); }}
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
                const atHomeCount = onUpdateStatus
                  ? items.filter(i => i.shopStatus === "already_got").length
                  : atHomeIds.size;
                return (
                  <div className="px-4 py-4">
                    <button
                      onClick={handleHeadToShop}
                      disabled={isCommitting}
                      className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 active:bg-primary/80 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isCommitting
                        ? "Saving…"
                        : atHomeCount > 0
                          ? `Done — ${atHomeCount} item${atHomeCount > 1 ? "s" : ""} at home`
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

      {/* ── 4b. Category Panel ────────────────────────────────────────────────
          Fills all remaining viewport height (flex-1).
          Category header is PINNED - user always knows which aisle they're in.
          ONLY the item list scrolls, via overflow-y-auto on the inner div.
          No full-page scroll - the orchard background stays fixed behind.
      ─────────────────────────────────────────────────────────────────── */}
      {phase === "shopping" && !shopSession && <div className="tha-print-hide relative z-10 flex-1 overflow-hidden flex flex-col px-3 sm:px-5 pt-3 pb-3 w-full max-w-3xl mx-auto">
        {activeCat ? (() => {
          const { total, got, allDone } = getCatProgress(activeCat);
          return (
            <div
              key={activeCat.key}
              className="flex flex-col flex-1 min-h-0 rounded-xl overflow-hidden"
              style={{
                background: "hsl(var(--card) / 0.30)",
                border: "1px solid hsl(var(--border) / 0.45)",
                borderTop: `3px solid ${activeCat.tabAccent}`,
              }}
            >
              {/* Category header - pinned, never scrolls */}
              <div
                className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b"
                style={{
                  background: `${activeCat.tabAccent}18`,
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
                    {got > 0 ? `${got} / ${total}` : `${total} item${total !== 1 ? "s" : ""}`}
                  </span>
                </div>
                {allDone && (
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: activeCat.tabAccent, background: `${activeCat.tabAccent}20` }}
                  >
                    All done ✓
                  </span>
                )}
              </div>

              {/* Item list - the ONLY thing that scrolls */}
              <div
                ref={itemsScrollRef}
                className="flex-1 overflow-y-auto"
                style={{ background: "hsl(var(--card) / 0.30)" }}
              >
                <div className="divide-y divide-border/25">
                  {activeCat.savedItems.map((item) => renderSavedItem(item))}
                  {activeCat.extraItems.map((extra) => renderExtraItem(extra))}
                </div>

                {activeCat.savedItems.length === 0 && activeCat.extraItems.length === 0 && (
                  <div className="flex items-center justify-center py-16 text-muted-foreground/50 text-sm">
                    Nothing here
                  </div>
                )}

                {/* All-sorted celebration - at the bottom of the scroll area */}
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
                    "Not found" items are saved for your next shop.
                  </p>
                )}
              </div>
            </div>
          );
        })() : (
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
