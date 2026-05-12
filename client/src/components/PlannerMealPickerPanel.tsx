import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, Loader2, ChefHat, UtensilsCrossed,
  Baby, PersonStanding, Wine, Package, Store, Microscope,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Meal } from "@shared/schema";

export interface EntryTarget {
  dayId: number;
  mealType: string;
  audience: string;
  isDrink: boolean;
  drinkType?: string | null;
}

export interface PlannerProductResult {
  barcode: string | null;
  product_name: string;
  brand: string | null;
  image_url: string | null;
  confirmedStores?: string[];
  inferredStores?: string[];
  availableStores?: string[];
  nutriments: { calories: string | null } | null;
}

const MEAL_SLOT_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snacks: "Snack",
};

const RETAILER_LIST = ["Tesco", "Sainsbury's", "Asda", "Morrisons", "Aldi", "Lidl", "Waitrose", "M&S"];

interface PlannerMealPickerPanelProps {
  target: EntryTarget | null;
  meals: Meal[];
  plannerMealIdSet: Set<number>;
  categoryIdForSlot: Record<string, number | undefined>;
  onSelect: (mealId: number) => void;
  addingEntry: boolean;
  onAddProduct: (product: PlannerProductResult) => void;
}

export function PlannerMealPickerPanel({
  target,
  meals,
  plannerMealIdSet,
  categoryIdForSlot,
  onSelect,
  addingEntry,
  onAddProduct,
}: PlannerMealPickerPanelProps) {
  const { toast } = useToast();
  const [mealSearch, setMealSearch] = useState("");
  const [mealFilter, setMealFilter] = useState<"all" | "cookbook" | "planner" | "ready" | "product">("all");
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<PlannerProductResult[]>([]);
  const [productSearching, setProductSearching] = useState(false);
  const [productRetailer, setProductRetailer] = useState("");

  const filteredMeals = useMemo(() => {
    let result = meals.filter(m => (m as any).mealSourceType !== "planner-placeholder");
    if (target) {
      if (target.isDrink) {
        result = result.filter(m => m.isDrink);
      } else {
        result = result.filter(m => !m.isDrink);
        if (target.audience === "baby") {
          result = result.filter(m => m.audience === "baby");
        } else if (target.audience === "child") {
          result = result.filter(m => m.audience === "child");
        } else {
          result = result.filter(m => m.audience !== "baby" && m.audience !== "child");
        }
      }
    }
    if (mealFilter === "cookbook") {
      result = result.filter(m => !m.isReadyMeal && !(m as any).isSystemMeal);
    } else if (mealFilter === "planner") {
      result = result.filter(m => plannerMealIdSet.has(m.id));
    } else if (mealFilter === "ready") {
      result = result.filter(m => m.isReadyMeal);
    }
    if (mealSearch.trim()) {
      const q = mealSearch.toLowerCase();
      result = result.filter(m => m.name.toLowerCase().includes(q));
    }
    if (!mealSearch.trim() && target && !target.isDrink) {
      const slotCatId = categoryIdForSlot[target.mealType];
      if (slotCatId) {
        const matching = result.filter(m => m.categoryId === slotCatId);
        const rest = result.filter(m => m.categoryId !== slotCatId);
        result = [...matching, ...rest];
      }
    }
    if (mealFilter === "all") {
      const nonReady = result.filter(m => !m.isReadyMeal);
      const ready = result.filter(m => m.isReadyMeal);
      result = [...nonReady, ...ready];
    }
    return result.slice(0, 100);
  }, [meals, mealFilter, mealSearch, target, categoryIdForSlot, plannerMealIdSet]);

  const searchProducts = async () => {
    if (!productQuery.trim()) return;
    setProductSearching(true);
    try {
      const q = productRetailer
        ? `${productRetailer} ${productQuery.trim()}`
        : productQuery.trim();
      const res = await fetch(`/api/search-products?q=${encodeURIComponent(q)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      let products: PlannerProductResult[] = data.products || [];
      if (productRetailer) {
        const r = productRetailer.toLowerCase();
        const withStore = products.filter(p =>
          [...(p.confirmedStores ?? []), ...(p.inferredStores ?? []), ...(p.availableStores ?? [])]
            .some(s => s.toLowerCase().includes(r))
        );
        products = withStore.length > 0 ? withStore : products;
      }
      setProductResults(products.slice(0, 30));
    } catch {
      toast({ title: "Product search failed", variant: "destructive" });
    } finally {
      setProductSearching(false);
    }
  };

  const pickerTitle = target?.isDrink
    ? "Choose a Drink"
    : target?.audience === "baby"
    ? "Choose a Baby Meal"
    : target?.audience === "child"
    ? "Choose a Child Meal"
    : `Choose a ${MEAL_SLOT_LABELS[target?.mealType ?? ""] || "Meal"}`;

  return (
    <div className="flex flex-col gap-3" data-testid="panel-manual-content">
      <p className="text-xs font-medium text-muted-foreground">{pickerTitle}</p>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {(["all", "cookbook", "planner", "ready", "product"] as const).map((f) => (
          <Button
            key={f}
            variant={mealFilter === f ? "default" : "outline"}
            size="sm"
            className={`text-xs h-7 px-2 ${f === "product" ? "gap-1" : ""}`}
            onClick={() => setMealFilter(f)}
            data-testid={`button-filter-${f}`}
          >
            {f === "product" && <Package className="h-3 w-3" />}
            {f === "all"
              ? "All"
              : f === "cookbook"
              ? "Cookbook"
              : f === "planner"
              ? "From Planner"
              : f === "ready"
              ? "Ready Meals"
              : "Shop-bought"}
          </Button>
        ))}
      </div>

      {/* Meal search (non-product tabs) */}
      {mealFilter !== "product" && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meals..."
            value={mealSearch}
            onChange={e => setMealSearch(e.target.value)}
            className="pl-9 h-8 text-sm"
            data-testid="input-meal-search"
          />
        </div>
      )}

      {/* Product search (Shop-bought tab) */}
      {mealFilter === "product" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="e.g. oven chips, granola…"
                value={productQuery}
                onChange={e => setProductQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && searchProducts()}
                className="pl-9 h-8 text-sm"
                data-testid="input-product-query"
              />
            </div>
            <Button
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={searchProducts}
              disabled={productSearching || !productQuery.trim()}
              data-testid="button-product-search"
            >
              {productSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          {/* Retailer chips */}
          <div className="flex gap-1 flex-wrap items-center">
            <span className="text-[10px] text-muted-foreground/60 shrink-0">Shop:</span>
            {RETAILER_LIST.map(shop => (
              <button
                key={shop}
                onClick={() => setProductRetailer(productRetailer === shop ? "" : shop)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                  productRetailer === shop
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground hover:border-primary/40"
                }`}
                data-testid={`button-picker-retailer-${shop.toLowerCase().replace(/['\s]+/g, "-")}`}
              >
                {shop}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Meals list */}
      {mealFilter !== "product" && (
        <div className="overflow-y-auto space-y-0.5" data-testid="list-meal-picker">
          {filteredMeals.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">No meals found</p>
          ) : (
            filteredMeals.map(meal => (
              <button
                key={meal.id}
                className="w-full flex items-center gap-3 p-2 rounded-md hover-elevate text-left"
                onClick={() => onSelect(meal.id)}
                disabled={addingEntry}
                data-testid={`button-select-meal-${meal.id}`}
              >
                {meal.isReadyMeal ? (
                  <div className="h-9 w-9 rounded-md bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <UtensilsCrossed className="h-4 w-4 text-green-500/40" />
                  </div>
                ) : meal.imageUrl ? (
                  <img src={meal.imageUrl} alt={meal.name} className="h-9 w-9 rounded-md object-cover flex-shrink-0" />
                ) : (
                  <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    <ChefHat className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{meal.name}</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    {!meal.isReadyMeal && !(meal as any).isSystemMeal && (
                      <Badge variant="outline" className="text-[10px] px-1 border-blue-400/60 text-blue-500">Cookbook</Badge>
                    )}
                    {meal.isReadyMeal && (
                      <Badge variant="outline" className="text-[10px] px-1">Ready Meal</Badge>
                    )}
                    {meal.audience === "baby" && (
                      <Badge variant="outline" className="text-[10px] px-1 border-pink-400/60 text-pink-500">
                        <Baby className="h-2.5 w-2.5 mr-0.5" />Baby
                      </Badge>
                    )}
                    {meal.audience === "child" && (
                      <Badge variant="outline" className="text-[10px] px-1 border-sky-400/60 text-sky-500">
                        <PersonStanding className="h-2.5 w-2.5 mr-0.5" />Child
                      </Badge>
                    )}
                    {meal.isDrink && (
                      <Badge variant="outline" className="text-[10px] px-1 border-purple-400/60 text-purple-500">
                        <Wine className="h-2.5 w-2.5 mr-0.5" />Drink
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Product results */}
      {mealFilter === "product" && (
        <div className="overflow-y-auto space-y-1" data-testid="list-product-picker">
          {!productSearching && productResults.length === 0 && !productQuery.trim() && (
            <div className="text-center py-8 text-muted-foreground">
              <Store className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm font-medium">Search for a shop-bought product</p>
              <p className="text-xs mt-1 opacity-70">Try: oven chips, baked beans, Greek yoghurt</p>
            </div>
          )}
          {productSearching && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!productSearching && productResults.length === 0 && productQuery.trim() && (
            <p className="text-center text-muted-foreground py-6 text-sm">No products found — try a different term</p>
          )}
          {!productSearching && productResults.map((product, i) => {
            const stores = [
              ...(product.confirmedStores ?? []),
              ...(product.inferredStores ?? []),
            ];
            const displayName = product.brand
              ? `${product.brand} – ${product.product_name}`
              : product.product_name;
            const analyserQuery = product.brand
              ? `${product.brand} ${product.product_name}`
              : product.product_name;
            const analyserUrl = `/analyser?q=${encodeURIComponent(analyserQuery)}${productRetailer ? `&shop=${encodeURIComponent(productRetailer)}` : ""}`;
            return (
              <div
                key={`${product.barcode ?? product.product_name}-${i}`}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/40 group"
              >
                <button
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  onClick={() => onAddProduct(product)}
                  disabled={addingEntry}
                  data-testid={`button-select-product-${i}`}
                >
                  {product.image_url ? (
                    <img src={product.image_url} alt={displayName} className="h-9 w-9 rounded-md object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                      <Package className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{displayName}</p>
                    <div className="flex items-center gap-1 flex-wrap">
                      {stores.slice(0, 3).map(s => (
                        <span key={s} className="text-[10px] text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
                <a
                  href={analyserUrl}
                  className="shrink-0 p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
                  title="Analyse in Analyser"
                  data-testid={`link-analyse-product-${i}`}
                >
                  <Microscope className="h-3.5 w-3.5" />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
