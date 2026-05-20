import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, ArrowLeft, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import AppleRating from "@/components/AppleRating";
import type { InputProduct } from "@/lib/analyser-view-model";
import { buildAnalyserViewModel } from "@/lib/analyser-view-model";
import { AddToWeekModal } from "@/components/AddToWeekModal";
import type { AddToWeekProduct } from "@/components/AddToWeekModal";

// ── Compact product result list ───────────────────────────────────────────────

function RatingBadge({ rating }: { rating: number }) {
  const cls =
    rating >= 4
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
      : rating >= 3
      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
      : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400";
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${cls}`}>
      {rating}/5
    </span>
  );
}

// ── Inline product analysis card ──────────────────────────────────────────────

function ProductCard({
  product,
  allProducts,
  onAddToWeek,
}: {
  product: InputProduct;
  allProducts: InputProduct[];
  onAddToWeek: () => void;
}) {
  const vm = buildAnalyserViewModel(product, allProducts);
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-card/50 p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground leading-snug">{vm.product.name}</p>
            {vm.product.brand && (
              <p className="text-xs text-muted-foreground">{vm.product.brand}</p>
            )}
          </div>
          <div className="shrink-0">
            <AppleRating rating={vm.score.rating} size="small" showTooltip={false} animate={false} />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{vm.score.verdict}</p>
        {vm.scoreDrivers.length > 0 && (
          <ul className="space-y-0.5">
            {vm.scoreDrivers.slice(0, 3).map((d, i) => (
              <li
                key={i}
                className={`text-[11px] leading-snug ${
                  d.polarity === "positive"
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-amber-700 dark:text-amber-400"
                }`}
              >
                {d.polarity === "positive" ? "✓ " : "· "}{d.text}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={onAddToWeek}
        className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 transition-colors"
        data-testid="button-analyser-add-to-week"
      >
        <CalendarDays className="h-4 w-4" />
        Add to Week
      </button>
    </div>
  );
}

// ── Main analyser panel content ───────────────────────────────────────────────

export function PlannerAnalyserContent() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<InputProduct | null>(null);
  const [addToWeekProduct, setAddToWeekProduct] = useState<AddToWeekProduct | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isFetching } = useQuery<{ products: InputProduct[] }>({
    queryKey: ["/api/search-products-analyser", debouncedQuery],
    queryFn: async () => {
      const res = await fetch(
        `/api/search-products?q=${encodeURIComponent(debouncedQuery)}`,
        { credentials: "include" }
      );
      if (!res.ok) return { products: [] };
      return res.json();
    },
    enabled: !!debouncedQuery.trim(),
    staleTime: 60_000,
  });

  const products: InputProduct[] = data?.products ?? [];

  if (selectedProduct) {
    return (
      <div className="space-y-3" data-testid="analyser-product-detail">
        <button
          onClick={() => setSelectedProduct(null)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-analyser-back"
        >
          <ArrowLeft className="h-3 w-3" /> Back to results
        </button>

        <ProductCard
          product={selectedProduct}
          allProducts={products}
          onAddToWeek={() =>
            setAddToWeekProduct({
              product_name: selectedProduct.product_name,
              brand: selectedProduct.brand ?? null,
              barcode: selectedProduct.barcode ?? null,
              image_url: selectedProduct.image_url,
            })
          }
        />

        <AddToWeekModal
          open={!!addToWeekProduct}
          onClose={() => setAddToWeekProduct(null)}
          product={addToWeekProduct ?? { product_name: "" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="analyser-search-panel">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
        <Input
          type="text"
          placeholder="e.g. bagels, greek yoghurt"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8 h-8 text-sm"
          autoFocus
          data-testid="input-analyser-search"
        />
      </div>

      {isFetching && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/50" />
        </div>
      )}

      {!isFetching && debouncedQuery && products.length === 0 && (
        <p className="text-xs text-muted-foreground/60 text-center py-3">
          No products found for "{debouncedQuery}"
        </p>
      )}

      {!isFetching && products.length > 0 && (
        <div className="space-y-1" data-testid="analyser-results-list">
          {products.slice(0, 8).map((product, i) => {
            const rating = product.upfAnalysis?.thaRating ?? null;
            return (
              <button
                key={product.barcode ?? `${product.product_name}-${i}`}
                onClick={() => setSelectedProduct(product)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md border border-border/60 bg-card/60 hover:bg-accent/40 transition-colors text-left"
                data-testid={`button-analyser-result-${i}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{product.product_name}</p>
                  {product.brand && (
                    <p className="text-[10px] text-muted-foreground/60 truncate">{product.brand}</p>
                  )}
                </div>
                {rating !== null && <RatingBadge rating={rating} />}
              </button>
            );
          })}
        </div>
      )}

      {!debouncedQuery && (
        <p className="text-[11px] text-muted-foreground/50 text-center py-2 leading-relaxed">
          Search any packaged food to see its processing score, then add it to your planner week or provisioning list.
        </p>
      )}
    </div>
  );
}
