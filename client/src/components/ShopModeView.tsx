import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown, ChevronUp, Check, Home, ShoppingCart,
  RefreshCw, ExternalLink, ArrowRight, Store, SkipForward,
} from "lucide-react";
import thaAppleUrl from "@/assets/icons/tha-apple.png";
import type { ShoppingListItem, ProductMatch, IngredientProduct } from "@shared/schema";
import { normalizeIngredientKey } from "@shared/normalize";

type ShopStatus = "pending" | "already_got" | "need_to_buy" | "in_basket" | "alternate_selected" | "deferred";
type Phase = "start" | "cupboard" | "shopping";

type ShopModeItem = ShoppingListItem;

// Unified display record used inside the shopping card.
// Sources: curated IngredientProduct (from ingredient_products table)
// or a price match (from product_matches table).
interface ShopDisplayMatch {
  productName: string;
  thaRating: number | null;
  price: number | null;
  pricePerUnit: string | null;
  productUrl: string | null;
  source: "tha" | "price_match";
}

interface ShopModeViewProps {
  items: ShopModeItem[];
  allPriceMatches: ProductMatch[];
  /** Curated THA product recommendations keyed by normalised ingredient key. */
  thaPicks?: Record<string, IngredientProduct[]>;
  pantryKeySet: Set<string>;
  onUpdateStatus: (id: number, status: ShopStatus | null) => void;
}

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

function getItemKey(item: ShopModeItem): string {
  return normalizeIngredientKey(
    (item as any).ingredientName ?? (item as any).name ?? item.normalizedName ?? item.productName ?? ""
  );
}

function getDisplayName(item: ShopModeItem): string {
  return (item as any).ingredientName ?? (item as any).name ?? item.normalizedName ?? item.productName ?? "Unknown item";
}

/**
 * Build a ranked list of display matches for a shopping item at the selected store.
 *
 * Priority order:
 * 1. Curated IngredientProduct entries (thaPicks) for this store — sorted by priority desc.
 * 2. ProductMatch entries for this item+store — sorted by thaRating desc.
 *
 * Product names from thaPicks are real retailer-specific names.
 * ProductMatch names may be generic when Spoonacular is unavailable.
 */
function resolveDisplayMatches(
  item: ShopModeItem,
  allPriceMatches: ProductMatch[],
  thaPicks: Record<string, IngredientProduct[]>,
  store: string,
): ShopDisplayMatch[] {
  const itemKey = getItemKey(item);
  const storeNorm = store.toLowerCase();

  // 1. Curated THA picks for this retailer
  const thaMatches: ShopDisplayMatch[] = (thaPicks[itemKey] ?? [])
    .filter(p => p.retailer.toLowerCase() === storeNorm)
    .sort((a, b) => b.priority - a.priority)
    .map(p => ({
      productName: p.productName,
      thaRating: (p.tags as any)?.thaRating ?? null,
      price: null,
      pricePerUnit: p.size ?? null,
      productUrl: null,
      source: "tha" as const,
    }));

  // 2. Price matches for this item+store
  const priceMatches: ShopDisplayMatch[] = allPriceMatches
    .filter(m => m.shoppingListItemId === item.id && m.supermarket.toLowerCase() === storeNorm)
    .sort((a, b) => (b.thaRating ?? 0) - (a.thaRating ?? 0))
    .map(m => ({
      productName: m.productName,
      thaRating: m.thaRating ?? null,
      price: m.price ?? null,
      pricePerUnit: m.pricePerUnit ?? null,
      productUrl: m.productUrl ?? null,
      source: "price_match" as const,
    }));

  const combined = [...thaMatches, ...priceMatches];

  // Deduplicate by productName (case-insensitive)
  const seen = new Set<string>();
  const deduped = combined.filter(m => {
    const key = m.productName.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Diagnostic log — remove once verified
  console.log("[ShopMode] resolveDisplayMatches", {
    item: item.productName,
    itemKey,
    store,
    thaMatchCount: thaMatches.length,
    priceMatchCount: priceMatches.length,
    totalMatches: deduped.length,
    headlineField: deduped[0]
      ? `${deduped[0].source}: "${deduped[0].productName}"`
      : "no matches → generic fallback",
  });

  return deduped;
}

// Compact apple rating: single apple + count, e.g. "4x"
function CompactRating({ rating }: { rating: number }) {
  const clamped = Math.max(1, Math.min(5, Math.round(rating || 1)));
  return (
    <span className="inline-flex items-center gap-0.5 shrink-0">
      <img src={thaAppleUrl} width={13} height={13} alt="" draggable={false} />
      <span className="text-[11px] font-semibold leading-none">{clamped}x</span>
    </span>
  );
}

// ─── Phase 1: Start ──────────────────────────────────────────────────────────

function StartPhase({ onCheckCupboards, onSkipToShop }: { onCheckCupboards: () => void; onSkipToShop: () => void }) {
  return (
    <div className="mt-6 pb-8">
      <div className="rounded-xl border border-border p-6 text-center max-w-sm mx-auto">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
          <Home className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-base font-semibold mb-1">Before you head out</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Check what you already have at home — saves time and cuts waste.
        </p>
        <Button className="w-full mb-3 gap-2" onClick={onCheckCupboards}>
          <Home className="h-4 w-4" />
          Check my cupboards
        </Button>
        <button
          onClick={onSkipToShop}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          Skip — I'm already at the shop
        </button>
      </div>
    </div>
  );
}

// ─── Phase 2: Cupboard check ─────────────────────────────────────────────────

interface CupboardItemRowProps {
  item: ShopModeItem;
  inPantry: boolean;
  isMarked: boolean;
  onMark: () => void;
  onUnmark: () => void;
}

function CupboardItemRow({ item, inPantry, isMarked, onMark, onUnmark }: CupboardItemRowProps) {
  const displayName = getDisplayName(item);
  const qty = item.quantityValue != null ? `${item.quantityValue}${item.unit ? ` ${item.unit}` : ""}` : null;

  return (
    <div
      className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
        isMarked ? "bg-muted/40 border-border opacity-70" : "bg-background border-border"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm ${isMarked ? "line-through text-muted-foreground" : "font-medium"}`}>
            {displayName}
          </span>
          {qty && <span className="text-xs text-muted-foreground">{qty}</span>}
          {inPantry && !isMarked && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-600 dark:text-amber-400">
              Likely in stock
            </Badge>
          )}
        </div>
      </div>
      {isMarked ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Check className="h-3 w-3 text-green-600" />In my cupboard
          </span>
          <button onClick={onUnmark} className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2">
            Undo
          </button>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={onMark}>
          In my cupboard
        </Button>
      )}
    </div>
  );
}

function CupboardPhase({
  items,
  pantryKeySet,
  onUpdateStatus,
  onDone,
}: {
  items: ShopModeItem[];
  pantryKeySet: Set<string>;
  onUpdateStatus: (id: number, status: ShopStatus | null) => void;
  onDone: () => void;
}) {
  const markedCount = items.filter(i => i.shopStatus === "already_got").length;

  return (
    <div className="mt-6 pb-8">
      <div className="mb-4">
        <h2 className="text-base font-semibold">Check your cupboards</h2>
        <p className="text-xs text-muted-foreground">Mark anything you already have at home.</p>
      </div>

      <div className="space-y-2 mb-6">
        {items.map(item => (
          <CupboardItemRow
            key={item.id}
            item={item}
            inPantry={pantryKeySet.has(getItemKey(item))}
            isMarked={item.shopStatus === "already_got"}
            onMark={() => onUpdateStatus(item.id, "already_got")}
            onUnmark={() => onUpdateStatus(item.id, "pending")}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-2">
        <Button className="w-full max-w-sm gap-2" onClick={onDone}>
          {markedCount > 0 ? `Done — ${markedCount} item${markedCount > 1 ? "s" : ""} at home` : "Done, nothing at home"}
          <ArrowRight className="h-4 w-4" />
        </Button>
        {markedCount === 0 && (
          <p className="text-xs text-muted-foreground">Tap "In my cupboard" for anything you don't need to buy.</p>
        )}
      </div>
    </div>
  );
}

// ─── Phase 3: Shopping ────────────────────────────────────────────────────────

interface ShoppingItemCardProps {
  item: ShopModeItem;
  matches: ShopDisplayMatch[];
  currentMatchIndex: number;
  onBasket: () => void;
  onUndo: () => void;
  onNextProduct: () => void;
  onNotInShop: () => void;
}

function ShoppingItemCard({
  item,
  matches,
  currentMatchIndex,
  onBasket,
  onUndo,
  onNextProduct,
  onNotInShop,
}: ShoppingItemCardProps) {
  const genericName = getDisplayName(item);
  const qty = item.quantityValue != null ? `${item.quantityValue}${item.unit ? ` ${item.unit}` : ""}` : null;
  const currentMatch = matches[currentMatchIndex] ?? null;
  const hasNextProduct = matches.length > currentMatchIndex + 1;
  const isInBasket = item.shopStatus === "in_basket" || item.shopStatus === "alternate_selected";
  const isNotInShop = item.shopStatus === "deferred";

  return (
    <div
      className={`rounded-xl border p-3 mb-2 transition-colors ${
        isInBasket
          ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
          : isNotInShop
          ? "bg-muted/30 border-border opacity-60"
          : "bg-background border-border"
      }`}
    >
      {/* Product info */}
      <div className="mb-2.5">
        {isNotInShop ? (
          <div>
            <span className="text-sm text-muted-foreground line-through">{genericName}</span>
            {qty && <span className="text-xs text-muted-foreground ml-2">{qty}</span>}
            <p className="text-xs text-muted-foreground mt-0.5 italic">Not available in this shop</p>
          </div>
        ) : currentMatch ? (
          <div>
            {/* Recommended product — prominent */}
            <div className="flex items-start gap-2 flex-wrap">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentMatch.productName}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="font-semibold text-sm leading-snug"
                >
                  {currentMatch.productName}
                </motion.span>
              </AnimatePresence>
              {isInBasket && (
                <Badge className="text-[10px] px-1.5 py-0 bg-green-600 text-white shrink-0">
                  <Check className="h-2.5 w-2.5 mr-1" />In basket
                </Badge>
              )}
            </div>
            {/* Rating + price row */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {currentMatch.thaRating != null && <CompactRating rating={currentMatch.thaRating} />}
              {currentMatch.price != null && (
                <span className="text-xs text-muted-foreground">£{currentMatch.price.toFixed(2)}</span>
              )}
              {currentMatch.pricePerUnit && (
                <span className="text-[10px] text-muted-foreground">{currentMatch.pricePerUnit}</span>
              )}
              {currentMatch.productUrl && (
                <a
                  href={currentMatch.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="View product"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            {/* Generic item name as context */}
            <p className="text-[11px] text-muted-foreground mt-1">
              {genericName}{qty ? ` · ${qty}` : ""}
              {matches.length > 1 && (
                <span className="ml-1 opacity-60">({currentMatchIndex + 1}/{matches.length})</span>
              )}
            </p>
          </div>
        ) : (
          <div>
            <span className="font-semibold text-sm">{genericName}</span>
            {qty && <span className="text-xs text-muted-foreground ml-2">{qty}</span>}
            <p className="text-xs text-muted-foreground mt-0.5 italic">No product data — look for {genericName}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {isInBasket ? (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs border-green-300 text-green-700 dark:text-green-400 w-full"
          onClick={onUndo}
        >
          <RefreshCw className="h-3 w-3 mr-1" />Undo
        </Button>
      ) : isNotInShop ? (
        <Button size="sm" variant="outline" className="h-7 text-xs w-full" onClick={onUndo}>
          Back
        </Button>
      ) : (
        <div className="flex gap-1.5">
          <Button
            size="sm"
            className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white flex-1"
            onClick={onBasket}
          >
            <ShoppingCart className="h-3 w-3 mr-1 shrink-0" />In my basket
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2.5"
            onClick={onNextProduct}
            disabled={!hasNextProduct && matches.length <= 1}
            title={hasNextProduct ? "Show next healthiest option" : "No more options"}
          >
            <SkipForward className="h-3 w-3 mr-1 shrink-0" />Next
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2.5 text-muted-foreground"
            onClick={onNotInShop}
          >
            Not in shop
          </Button>
        </div>
      )}
    </div>
  );
}

function ShoppingPhase({
  items,
  allPriceMatches,
  thaPicks,
  onUpdateStatus,
}: {
  items: ShopModeItem[];
  allPriceMatches: ProductMatch[];
  thaPicks: Record<string, IngredientProduct[]>;
  onUpdateStatus: (id: number, status: ShopStatus | null) => void;
}) {
  const [selectedStore, setSelectedStore] = useState<string>("Tesco");
  // Tracks which product index is currently shown per item
  const [productIndexMap, setProductIndexMap] = useState<Record<number, number>>({});
  const [homeOpen, setHomeOpen] = useState(false);

  // Diagnostic logs — remove once verified
  console.log("[ShopMode] ShoppingPhase", {
    selectedStore,
    itemCount: items.length,
    allPriceMatchCount: allPriceMatches.length,
    thaPicksKeys: Object.keys(thaPicks),
    samplePriceMatches: allPriceMatches.slice(0, 3).map(m => ({
      itemId: m.shoppingListItemId, supermarket: m.supermarket, productName: m.productName, thaRating: m.thaRating,
    })),
  });

  const toShop = items.filter(i => i.shopStatus !== "already_got");
  const atHome = items.filter(i => i.shopStatus === "already_got");
  const inBasketCount = toShop.filter(i => i.shopStatus === "in_basket" || i.shopStatus === "alternate_selected").length;
  const total = toShop.length;
  const progress = total > 0 ? Math.round((inBasketCount / total) * 100) : 100;

  function handleNextProduct(item: ShopModeItem, matches: ShopDisplayMatch[]) {
    const current = productIndexMap[item.id] ?? 0;
    const next = current + 1;
    if (next < matches.length) {
      setProductIndexMap(prev => ({ ...prev, [item.id]: next }));
    }
  }

  return (
    <div className="mt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold">At the shop</h2>
          <p className="text-xs text-muted-foreground">{inBasketCount} of {total} in basket</p>
        </div>
        <Select value={selectedStore} onValueChange={setSelectedStore}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <Store className="h-3.5 w-3.5 mr-1.5 shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPERMARKETS.map(s => (
              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mb-4">
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-green-500 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      )}

      {/* Shopping items — original basket order preserved */}
      {toShop.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">Everything accounted for.</p>
      )}

      {toShop.map(item => {
        const matches = resolveDisplayMatches(item, allPriceMatches, thaPicks, selectedStore);
        const currentMatchIndex = productIndexMap[item.id] ?? 0;
        return (
          <ShoppingItemCard
            key={item.id}
            item={item}
            matches={matches}
            currentMatchIndex={currentMatchIndex}
            onBasket={() => onUpdateStatus(item.id, "in_basket")}
            onUndo={() => onUpdateStatus(item.id, "pending")}
            onNextProduct={() => handleNextProduct(item, matches)}
            onNotInShop={() => onUpdateStatus(item.id, "deferred")}
          />
        );
      })}

      {/* Already at home — collapsible */}
      {atHome.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <button
            onClick={() => setHomeOpen(v => !v)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full text-left"
          >
            <Home className="h-4 w-4" />
            Already at home ({atHome.length})
            <span className="ml-auto">{homeOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
          </button>
          <AnimatePresence initial={false}>
            {homeOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-1">
                  {atHome.map(item => (
                    <div key={item.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-muted/30">
                      <span className="text-sm text-muted-foreground line-through">{getDisplayName(item)}</span>
                      <button
                        onClick={() => onUpdateStatus(item.id, "pending")}
                        className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 shrink-0 ml-3"
                      >
                        Move back
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function ShopModeView({ items, allPriceMatches, thaPicks = {}, pantryKeySet, onUpdateStatus }: ShopModeViewProps) {
  const [phase, setPhase] = useState<Phase>("start");

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
      >
        {phase === "start" && (
          <StartPhase
            onCheckCupboards={() => setPhase("cupboard")}
            onSkipToShop={() => setPhase("shopping")}
          />
        )}
        {phase === "cupboard" && (
          <CupboardPhase
            items={items}
            pantryKeySet={pantryKeySet}
            onUpdateStatus={onUpdateStatus}
            onDone={() => setPhase("shopping")}
          />
        )}
        {phase === "shopping" && (
          <ShoppingPhase
            items={items}
            allPriceMatches={allPriceMatches}
            thaPicks={thaPicks}
            onUpdateStatus={onUpdateStatus}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
