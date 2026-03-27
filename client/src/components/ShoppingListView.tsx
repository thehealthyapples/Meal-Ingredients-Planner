import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { normalizeIngredientKey } from "@shared/normalize";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ShoppingListItem, IngredientSource } from "@shared/schema";

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

interface ShoppingListViewProps {
  items: SLItem[];
  extras: { id: number; name: string; category: string; alwaysAdd: boolean; inBasket: boolean }[];
  sourcesByItem: Map<number, IngredientSource[]>;
  pantryKeySet: Set<string>;
  measurementPref: "metric" | "imperial";
  onToggleBought: (id: number, checked: boolean) => void;
  onClose: () => void;
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

const FRESH_HERBS = new Set(["coriander", "basil", "parsley", "mint", "dill"]);

function getItemCatKey(category: string | null | undefined, name: string): string {
  const raw = (category || "other").toLowerCase();
  if (raw === "household") return "household";
  if (raw === "meat" || raw === "fish") return "meat";
  if (raw === "dairy" || raw === "eggs") return "dairy";
  if (raw === "produce" || raw === "fruit") return "produce";
  if (raw === "herbs") return FRESH_HERBS.has(name.toLowerCase()) ? "produce" : "pantry";
  if (raw === "bakery") return "bakery";
  if (raw === "frozen") return "frozen";
  if (["grains", "oils", "condiments", "nuts", "legumes", "tinned", "pantry", "spices"].includes(raw))
    return "pantry";
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
  onToggleBought,
  onClose,
}: ShoppingListViewProps) {
  const [notInShop, setNotInShop] = useState<Set<number>>(() => loadNotInShop());
  const [extraStates, setExtraStates] = useState<Map<number, "in_basket" | "not_in_shop">>(new Map());
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const itemsScrollRef = useRef<HTMLDivElement>(null);
  const tabStripRef = useRef<HTMLDivElement>(null);
  const activeTabElRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.classList.add("tha-shopping-open");
    return () => document.body.classList.remove("tha-shopping-open");
  }, []);

  useEffect(() => {
    saveNotInShop(notInShop, items);
  }, [notInShop, items]);

  // ── State derivation ─────────────────────────────────────────────────────

  function getItemState(item: SLItem): ShopState {
    if (notInShop.has(item.id)) return "not_in_shop";
    if (item.checked) return "in_basket";
    return "need";
  }

  function setItemState(item: SLItem, next: ShopState) {
    if (getItemState(item) === next) return;
    if (next === "in_basket" && !item.checked) onToggleBought(item.id, true);
    else if (next !== "in_basket" && item.checked) onToggleBought(item.id, false);
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

  // ── Progress ─────────────────────────────────────────────────────────────

  const activeExtras = useMemo(() => extras.filter((e) => e.inBasket || e.alwaysAdd), [extras]);
  const totalItems = items.length + activeExtras.length;

  const inBasketCount =
    items.filter((i) => getItemState(i) === "in_basket").length +
    activeExtras.filter((e) => getExtraState(e.id) === "in_basket").length;

  const notFoundCount =
    items.filter((i) => getItemState(i) === "not_in_shop").length +
    activeExtras.filter((e) => getExtraState(e.id) === "not_in_shop").length;

  const needCount = totalItems - inBasketCount - notFoundCount;
  const allSorted = totalItems > 0 && needCount === 0;

  // ── Category grouping ─────────────────────────────────────────────────────

  const groupedCategories = useMemo(() => {
    const map = new Map<string, { savedItems: SLItem[]; extraItems: typeof extras }>();
    for (const cat of SHOPPING_CATS) map.set(cat.key, { savedItems: [], extraItems: [] });
    for (const item of items) {
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
              {capWords(item.productName)}
            </span>
            {qty && (
              <span className={`text-[11.5px] tabular-nums ${state !== "need" ? "text-muted-foreground/45" : "text-muted-foreground/70"}`}>
                {qty}
              </span>
            )}
          </div>
          {state === "need" && firstMeal && (
            <p className="tha-print-hide text-[11px] text-muted-foreground/55 leading-tight mt-0.5">
              {firstMeal}{isPantryStaple ? " · staple" : ""}
            </p>
          )}
          {state === "not_in_shop" && (
            <p className="tha-print-hide text-[11px] text-amber-600/70 dark:text-amber-500/70 leading-tight mt-0.5">
              Try next shop
            </p>
          )}
        </div>
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
      className="fixed inset-0 z-50 overflow-hidden flex flex-col"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >

      {/* ── Orchard background - screen only, full bleed, never scrolls ── */}
      <div
        aria-hidden
        className="tha-print-hide fixed inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      >
        <img
          src="/orchard-bg.png"
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
            opacity: 0.48,
          }}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SCREEN CONTENT  (flex column - nothing outside item list scrolls)
      ══════════════════════════════════════════════════════════════════ */}

      {/* ── 1. THA Branded Header ─────────────────────────────────────────
          Identical to the site TopBar: /logo-long.png, bg-card/60,
          backdrop-blur-md, border-b border-border.
      ─────────────────────────────────────────────────────────────────── */}
      <header className="tha-print-hide w-full bg-card/60 backdrop-blur-md border-b border-border py-0.5 shrink-0 relative z-30">
        <div className="flex items-center justify-center px-4">
          <img
            src="/logo-long.png"
            alt="The Healthy Apples"
            className="h-auto max-h-[72px] md:max-h-[108px] w-auto max-w-[520px] md:max-w-[900px]"
          />
        </div>
      </header>

      {/* ── 2. Shop View Toolbar ──────────────────────────────────────────
          Title + progress summary. Print + Close actions.
          No logo here - branding is handled by the header above.
      ─────────────────────────────────────────────────────────────────── */}
      <header
        className="tha-print-hide relative z-20 flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary) / 0.10) 0%, hsl(var(--background) / 0.97) 50%, hsl(var(--primary) / 0.07) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid hsl(var(--border) / 0.6)",
          boxShadow: "0 1px 12px hsl(var(--primary) / 0.07)",
        }}
      >
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-5 sm:py-3 max-w-3xl mx-auto">
          {/* Left: title + progress */}
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1
                className="font-semibold text-[18px] sm:text-[20px] leading-tight text-foreground"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.015em" }}
              >
                Shop View
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

          {/* Right: Print + Close */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
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
              className="h-8 px-2.5 text-xs"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Close</span>
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
      {groupedCategories.length > 0 && (
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

      {/* ── 4. Category Panel ─────────────────────────────────────────────
          Fills all remaining viewport height (flex-1).
          Category header is PINNED - user always knows which aisle they're in.
          ONLY the item list scrolls, via overflow-y-auto on the inner div.
          No full-page scroll - the orchard background stays fixed behind.
      ─────────────────────────────────────────────────────────────────── */}
      <div className="tha-print-hide relative z-10 flex-1 overflow-hidden flex flex-col px-3 sm:px-5 pt-3 pb-3 w-full max-w-3xl mx-auto">
        {activeCat ? (() => {
          const { total, got, allDone } = getCatProgress(activeCat);
          return (
            <div
              key={activeCat.key}
              className="flex flex-col flex-1 min-h-0 rounded-xl overflow-hidden"
              style={{
                background: "hsl(var(--card) / 0.62)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid hsl(var(--border) / 0.45)",
                borderTop: `3px solid ${activeCat.tabAccent}`,
                boxShadow: "0 6px 36px rgba(0,0,0,0.09), 0 1px 6px rgba(0,0,0,0.05)",
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
                style={{ background: "hsl(var(--card) / 0.88)" }}
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
                        ? `Almost there - ${notFoundCount} item${notFoundCount > 1 ? "s" : ""} to find next time`
                        : "All sorted! Happy shopping 🌿"}
                    </p>
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
      </div>

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
                        {capWords(item.productName)}
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

  return createPortal(content, document.body);
}
