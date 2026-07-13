import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Loader2, ArrowLeft, BookmarkCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import AppleRating from "@/components/AppleRating";
import type { InputProduct } from "@/lib/analyser-view-model";
import { buildAnalyserViewModel } from "@/lib/analyser-view-model";
import { DraggableSearchResultRow } from "@/components/PlannerDragDrop";
import { useToast } from "@/hooks/use-toast";
import { invalidateMealLibrary } from "@/hooks/use-meals";

// ── Inline product analysis card ──────────────────────────────────────────────

function ProductCard({
  product,
  allProducts,
  savedMealId,
  onSave,
  saving,
}: {
  product: InputProduct;
  allProducts: InputProduct[];
  savedMealId?: number;
  onSave: () => void;
  saving?: boolean;
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

      {savedMealId !== undefined ? (
        <p className="text-[11px] text-muted-foreground/60 text-center py-0.5">
          Saved — drag the handle to add to a day slot or provisioning
        </p>
      ) : (
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 transition-colors disabled:opacity-50"
          data-testid="button-analyser-save-to-cookbook"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkCheck className="h-4 w-4" />}
          Save to Cookbook
        </button>
      )}
    </div>
  );
}

// ── Main analyser panel content ───────────────────────────────────────────────

export function PlannerAnalyserContent() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<InputProduct | null>(null);
  const [savedProducts, setSavedProducts] = useState<Map<string, number>>(new Map());
  const [savingKey, setSavingKey] = useState<string | null>(null);

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

  async function handleSaveProduct(product: InputProduct) {
    const key = product.barcode ?? product.product_name;
    if (savingKey || savedProducts.has(key)) return;
    setSavingKey(key);
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: product.brand ? `${product.brand} – ${product.product_name}` : product.product_name,
          ingredients: [],
          instructions: [],
          servings: 1,
          isReadyMeal: true,
          mealSourceType: "openfoodfacts",
          brand: product.brand ?? undefined,
          barcode: product.barcode ?? undefined,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const meal = await res.json();
      invalidateMealLibrary(qc);
      setSavedProducts(prev => new Map(prev).set(key, meal.id));
      toast({ title: "Saved to My Cookbook", description: product.product_name });
    } catch {
      toast({ title: "Could not save product", variant: "destructive" });
    } finally {
      setSavingKey(null);
    }
  }

  if (selectedProduct) {
    const productKey = selectedProduct.barcode ?? selectedProduct.product_name;
    const savedMealId = savedProducts.get(productKey);
    const isSaving = savingKey === productKey;

    const card = (
      <ProductCard
        product={selectedProduct}
        allProducts={products}
        savedMealId={savedMealId}
        onSave={() => handleSaveProduct(selectedProduct)}
        saving={isSaving}
      />
    );

    return (
      <div className="space-y-3" data-testid="analyser-product-detail">
        <button
          onClick={() => setSelectedProduct(null)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-analyser-back"
        >
          <ArrowLeft className="h-3 w-3" /> Back to results
        </button>

        {savedMealId !== undefined ? (
          <DraggableSearchResultRow
            mealId={savedMealId}
            mealName={selectedProduct.product_name}
            sourceOrigin="packaged"
          >
            {card}
          </DraggableSearchResultRow>
        ) : card}
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
          <p className="text-[10px] text-muted-foreground/50 px-0.5 pb-0.5">
            {products.length} result{products.length !== 1 ? "s" : ""} — showing highest-rated first
          </p>
          {[...products]
            .sort((a, b) => (b.upfAnalysis?.thaRating ?? 0) - (a.upfAnalysis?.thaRating ?? 0))
            .slice(0, 8)
            .map((product, i) => {
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
                  {rating !== null && (
                    <AppleRating rating={rating} sizePx={22} showTooltip animate={false} />
                  )}
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
