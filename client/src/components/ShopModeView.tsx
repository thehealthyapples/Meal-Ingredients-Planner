import { useState, useMemo } from "react";
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
  RefreshCw, ExternalLink, ArrowRight, Store,
} from "lucide-react";
import AppleRating from "@/components/AppleRating";
import type { ShoppingListItem, ProductMatch } from "@shared/schema";
import { normalizeIngredientKey } from "@shared/normalize";

type ShopStatus = "pending" | "already_got" | "need_to_buy" | "in_basket" | "alternate_selected" | "deferred";
type Phase = "start" | "cupboard" | "shopping";

type ShopModeItem = ShoppingListItem;

interface ShopModeViewProps {
  items: ShopModeItem[];
  allPriceMatches: ProductMatch[];
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

function getMatchesForItem(item: ShopModeItem, allPriceMatches: ProductMatch[], store: string): ProductMatch[] {
  return allPriceMatches
    .filter(m => m.shoppingListItemId === item.id && m.supermarket.toLowerCase() === store.toLowerCase())
    .sort((a, b) => (b.thaRating ?? 0) - (a.thaRating ?? 0));
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
  matches: ProductMatch[];
  onBasket: () => void;
  onUndo: () => void;
  onNotFound: () => void;
  onSelectAlternate: (match: ProductMatch) => void;
  onDefer: () => void;
  isNotFoundOpen: boolean;
  onToggleNotFound: () => void;
}

function ShoppingItemCard({
  item,
  matches,
  onBasket,
  onUndo,
  onNotFound,
  onSelectAlternate,
  onDefer,
  isNotFoundOpen,
  onToggleNotFound,
}: ShoppingItemCardProps) {
  const displayName = getDisplayName(item);
  const qty = item.quantityValue != null ? `${item.quantityValue}${item.unit ? ` ${item.unit}` : ""}` : null;
  const topMatch = matches[0];
  const alternates = matches.slice(1);
  const isInBasket = item.shopStatus === "in_basket" || item.shopStatus === "alternate_selected";
  const isDeferred = item.shopStatus === "deferred";

  return (
    <div
      className={`rounded-xl border p-3 mb-2 transition-colors ${
        isInBasket
          ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
          : isDeferred
          ? "bg-muted/30 border-border opacity-60"
          : "bg-background border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Left: item + product info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm leading-tight">{displayName}</span>
            {qty && <span className="text-xs text-muted-foreground">{qty}</span>}
            {isInBasket && (
              <Badge className="text-[10px] px-1.5 py-0 bg-green-600 text-white">
                <Check className="h-2.5 w-2.5 mr-1" />In basket
              </Badge>
            )}
            {isDeferred && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                Skipped
              </Badge>
            )}
          </div>

          {/* Product suggestion */}
          {topMatch && !isDeferred && (
            <div className="mt-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-foreground/80 font-medium truncate max-w-[200px]">{topMatch.productName}</span>
                {topMatch.thaRating != null && <AppleRating rating={topMatch.thaRating} size="small" />}
                {topMatch.price != null && (
                  <span className="text-xs text-muted-foreground">£{topMatch.price.toFixed(2)}</span>
                )}
                {topMatch.productUrl && (
                  <a
                    href={topMatch.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="View product"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              {topMatch.pricePerUnit && (
                <p className="text-[10px] text-muted-foreground mt-0.5">{topMatch.pricePerUnit}</p>
              )}
            </div>
          )}

          {/* No product match */}
          {!topMatch && !isDeferred && (
            <p className="text-xs text-muted-foreground mt-1 italic">Look for {displayName}</p>
          )}

          {/* Not found — alternate picker */}
          <AnimatePresence>
            {isNotFoundOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-xs font-medium mb-2">Try an alternative:</p>
                  {alternates.length > 0 ? (
                    <div className="space-y-2">
                      {alternates.map(alt => (
                        <div key={alt.id} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-xs truncate">{alt.productName}</span>
                            {alt.thaRating != null && <AppleRating rating={alt.thaRating} size="small" />}
                            {alt.price != null && (
                              <span className="text-xs text-muted-foreground shrink-0">£{alt.price.toFixed(2)}</span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[11px] shrink-0"
                            onClick={() => onSelectAlternate(alt)}
                          >
                            Use this
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic mb-2">No specific alternatives on file.</p>
                  )}
                  <button
                    onClick={onDefer}
                    className="mt-2 text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    Skip this item for now
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: actions */}
        <div className="flex flex-col gap-1.5 shrink-0">
          {isInBasket ? (
            <Button size="sm" variant="outline" className="h-7 text-xs border-green-300 text-green-700 dark:text-green-400" onClick={onUndo}>
              <RefreshCw className="h-3 w-3 mr-1" />Undo
            </Button>
          ) : isDeferred ? (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onUndo}>
              Add back
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
                onClick={onBasket}
              >
                <ShoppingCart className="h-3 w-3 mr-1" />In shop basket
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={onToggleNotFound}
              >
                Not found
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ShoppingPhase({
  items,
  allPriceMatches,
  onUpdateStatus,
}: {
  items: ShopModeItem[];
  allPriceMatches: ProductMatch[];
  onUpdateStatus: (id: number, status: ShopStatus | null) => void;
}) {
  const [selectedStore, setSelectedStore] = useState<string>("Tesco");
  const [notFoundOpenId, setNotFoundOpenId] = useState<number | null>(null);

  const toShop = items.filter(i => i.shopStatus !== "already_got");
  const atHome = items.filter(i => i.shopStatus === "already_got");
  const inBasketCount = toShop.filter(i => i.shopStatus === "in_basket" || i.shopStatus === "alternate_selected").length;
  const total = toShop.length;
  const progress = total > 0 ? Math.round((inBasketCount / total) * 100) : 100;
  const [homeOpen, setHomeOpen] = useState(false);

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
        const matches = getMatchesForItem(item, allPriceMatches, selectedStore);
        return (
          <ShoppingItemCard
            key={item.id}
            item={item}
            matches={matches}
            onBasket={() => onUpdateStatus(item.id, "in_basket")}
            onUndo={() => onUpdateStatus(item.id, "pending")}
            onNotFound={() => {}}
            onSelectAlternate={() => onUpdateStatus(item.id, "alternate_selected")}
            onDefer={() => { onUpdateStatus(item.id, "deferred"); setNotFoundOpenId(null); }}
            isNotFoundOpen={notFoundOpenId === item.id}
            onToggleNotFound={() => setNotFoundOpenId(id => id === item.id ? null : item.id)}
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

export default function ShopModeView({ items, allPriceMatches, pantryKeySet, onUpdateStatus }: ShopModeViewProps) {
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
            onUpdateStatus={onUpdateStatus}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
