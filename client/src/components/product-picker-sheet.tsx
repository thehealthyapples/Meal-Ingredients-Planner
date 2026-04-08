import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2, Package, X, Store, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import ScoreBadge from "@/components/ui/score-badge";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PickerProduct {
  barcode: string | null;
  product_name: string;
  brand: string | null;
  image_url: string | null;
  nova_group: number | null;
  upfAnalysis: { thaRating: number; upfScore: number } | null;
  confirmedStores?: string[];
  inferredStores?: string[];
  ingredients_text?: string | null;
}

interface ProductPickerSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Pre-filled search term — the component name the user just typed */
  initialQuery: string;
  /** Called when user taps "Add" on a result */
  onSelect: (product: PickerProduct) => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const RETAILERS = [
  "Tesco", "Sainsbury's", "Asda", "Morrisons",
  "Aldi", "Lidl", "Waitrose", "M&S", "Co-op",
];

// ── Component ────────────────────────────────────────────────────────────────

export function ProductPickerSheet({
  open,
  onOpenChange,
  initialQuery,
  onSelect,
}: ProductPickerSheetProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<PickerProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [retailerFilter, setRetailerFilter] = useState("");
  const [selectedBarcode, setSelectedBarcode] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Sync query when sheet opens with a new term
  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      setResults([]);
      setHasSearched(false);
      setSelectedBarcode(null);
      setRetailerFilter("");
      // Auto-search if there's a term
      if (initialQuery.trim().length >= 2) {
        runSearch(initialQuery.trim());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialQuery]);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setIsSearching(true);
    setHasSearched(false);
    try {
      const res = await fetch(
        `/api/search-products?q=${encodeURIComponent(q.trim())}&includeRegulatoryInScoring=true`,
        { credentials: "include", signal: ctrl.signal }
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data.products || []);
      setHasSearched(true);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setResults([]);
        setHasSearched(true);
      }
    } finally {
      if (!ctrl.signal.aborted) setIsSearching(false);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runSearch(query);
    }
  };

  // Deduplicate by barcode then product name+brand
  const deduped = results.filter((p, i, arr) => {
    if (p.barcode) return arr.findIndex(x => x.barcode === p.barcode) === i;
    const k = `${p.product_name.toLowerCase()}|${(p.brand || "").toLowerCase()}`;
    return arr.findIndex(x => `${x.product_name.toLowerCase()}|${(x.brand || "").toLowerCase()}` === k) === i;
  });

  const filtered = retailerFilter
    ? deduped.filter(p => {
        const all = [
          ...(p.confirmedStores || []),
          ...(p.inferredStores || []),
        ].map(s => s.toLowerCase());
        return all.includes(retailerFilter.toLowerCase());
      })
    : deduped;

  const handleSelect = (product: PickerProduct) => {
    setSelectedBarcode(product.barcode);
    onSelect(product);
    setTimeout(() => onOpenChange(false), 200);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="p-0 max-h-[92dvh] h-[92dvh] flex flex-col rounded-t-xl"
        data-testid="sheet-product-picker"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <SheetHeader className="px-4 pt-4 pb-0 shrink-0">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-primary shrink-0" />
            <SheetTitle className="text-base">Find Shop Product</SheetTitle>
          </div>
        </SheetHeader>

        {/* ── Search bar ─────────────────────────────────────────────────── */}
        <div className="px-4 pt-3 pb-2 shrink-0 border-b border-border">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. oven chips, yoghurt, cereal…"
                className="pl-9 pr-9"
                autoComplete="off"
                data-testid="input-picker-search"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); setResults([]); setHasSearched(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  data-testid="button-picker-clear"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => runSearch(query)}
              disabled={!query.trim() || isSearching}
              data-testid="button-picker-search"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {/* Retailer chips */}
          <div className="flex gap-1.5 mt-2.5 overflow-x-auto pb-0.5 scrollbar-none" data-testid="row-retailer-filter">
            {RETAILERS.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRetailerFilter(prev => prev === r ? "" : r)}
                className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors whitespace-nowrap ${
                  retailerFilter === r
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground hover:border-primary/40"
                }`}
                data-testid={`button-picker-retailer-${r.toLowerCase().replace(/['\s]+/g, "-")}`}
              >
                {r}
              </button>
            ))}
            {retailerFilter && (
              <button
                type="button"
                onClick={() => setRetailerFilter("")}
                className="shrink-0 px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                data-testid="button-picker-retailer-clear"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Results ────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" data-testid="list-picker-results">

          {isSearching && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isSearching && hasSearched && filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
              {retailerFilter && deduped.length > 0 ? (
                <>
                  <p className="text-sm">No {retailerFilter} products in results.</p>
                  <button
                    type="button"
                    className="text-xs text-primary mt-1 underline"
                    onClick={() => setRetailerFilter("")}
                  >
                    Show all {deduped.length} results
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm">No products found for "{query}"</p>
                  <p className="text-xs mt-1">Try a shorter or different term</p>
                </>
              )}
            </div>
          )}

          {!isSearching && !hasSearched && !query.trim() && (
            <div className="text-center py-12 text-muted-foreground">
              <Store className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Search for a shop-bought product</p>
              <p className="text-xs mt-1">Type a name above and tap Search</p>
            </div>
          )}

          {filtered.map((product, idx) => {
            const isSelected = selectedBarcode !== null && product.barcode === selectedBarcode;
            const stores = [
              ...(product.confirmedStores || []),
              ...(product.inferredStores || []),
            ].slice(0, 3);

            return (
              <div
                key={product.barcode || `${product.product_name}-${idx}`}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  isSelected ? "border-primary bg-primary/5" : "border-border bg-background"
                }`}
                data-testid={`picker-result-${product.barcode || idx}`}
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.product_name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground/40" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight line-clamp-2" data-testid={`picker-name-${idx}`}>
                    {product.product_name}
                  </p>
                  {product.brand && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{product.brand}</p>
                  )}
                  {stores.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Store className="h-2.5 w-2.5 shrink-0" />
                      {stores.join(" · ")}
                    </p>
                  )}
                  {product.nova_group && (
                    <Badge
                      variant="outline"
                      className={`mt-1 text-[10px] px-1.5 py-0 ${
                        product.nova_group === 1 ? "border-green-300 text-green-700 dark:text-green-400" :
                        product.nova_group === 2 ? "border-yellow-300 text-yellow-700 dark:text-yellow-400" :
                        product.nova_group === 3 ? "border-orange-300 text-orange-700 dark:text-orange-400" :
                        "border-red-300 text-red-700 dark:text-red-400"
                      }`}
                    >
                      NOVA {product.nova_group}
                    </Badge>
                  )}
                </div>

                {/* Score + Add */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  {product.upfAnalysis && (
                    <ScoreBadge score={product.upfAnalysis.thaRating} size={32} />
                  )}
                  <Button
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    className="h-7 px-2.5 text-xs"
                    onClick={() => handleSelect(product)}
                    data-testid={`button-picker-add-${idx}`}
                  >
                    {isSelected ? (
                      <><Check className="h-3 w-3 mr-1" />Added</>
                    ) : (
                      "Add"
                    )}
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Count */}
          {!isSearching && filtered.length > 0 && (
            <p className="text-center text-[11px] text-muted-foreground py-2">
              {filtered.length} product{filtered.length !== 1 ? "s" : ""}
              {retailerFilter ? ` at ${retailerFilter}` : ""}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
