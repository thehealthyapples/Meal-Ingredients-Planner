import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, Loader2, ChefHat, UtensilsCrossed,
  Baby, PersonStanding, Wine, Package, Store, Microscope, Globe,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Meal } from "@shared/schema";
import { scoreMealSearch } from "@shared/food-synonyms";
import { usePlannerMealSearch, type WebSearchRecipe, type PlannerMealFilterMode } from "@/hooks/use-planner-meal-search";

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
  const qc = useQueryClient();
  const [mealSearch, setMealSearch] = useState("");
  const [mealFilter, setMealFilter] = useState<"all" | "cookbook" | "planner" | "ready" | "product" | "web">("all");
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<PlannerProductResult[]>([]);
  const [productSearching, setProductSearching] = useState(false);
  const [productRetailer, setProductRetailer] = useState("");

  // Web search + includeWeb session persistence managed by the shared hook.
  // filteredMeals from the hook is not used here — the component keeps its own
  // target-aware filtering pipeline below (audience, drink, category logic).
  const { webResults, webLoading, includeWeb, setIncludeWeb } = usePlannerMealSearch({
    meals,
    query: mealSearch,
    filterMode: (mealFilter === "product" || mealFilter === "web" ? "all" : mealFilter) as PlannerMealFilterMode,
    plannerMealIdSet,
    excludePlaceholders: true,
    enableWebSearch: mealFilter !== "product",
  });

  const [importingWebId, setImportingWebId] = useState<string | null>(null);

  const handleFilterClick = (f: "all" | "cookbook" | "planner" | "ready" | "product" | "web") => {
    setMealFilter(f);
    setMealSearch("");
    if (f === "web") setIncludeWeb(true);
  };

  const handleAddWebRecipe = async (recipe: WebSearchRecipe) => {
    if (importingWebId) return;
    setImportingWebId(recipe.id);
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: recipe.name,
          ingredients: recipe.ingredients ?? [],
          instructions: recipe.instructions ?? [],
          imageUrl: recipe.image || null,
          sourceUrl: recipe.url || null,
          servings: 1,
        }),
      });
      if (!res.ok) throw new Error("Failed to save recipe");
      const meal = await res.json();
      qc.invalidateQueries({ queryKey: ["/api/meals"] });
      if (!target) {
        toast({ title: "Recipe saved to cookbook", description: "Select a meal slot in the planner to add it." });
        return;
      }
      onSelect(meal.id);
    } catch {
      toast({ title: "Could not add web recipe", variant: "destructive" });
    } finally {
      setImportingWebId(null);
    }
  };

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
      const q = mealSearch.trim();
      const scored = result
        .map(m => ({ m, score: scoreMealSearch({ name: m.name, ingredients: m.ingredients }, q) }))
        .filter(({ score }) => score > 0);
      scored.sort((a, b) => b.score - a.score);
      result = scored.map(({ m }) => m);
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

  const pickerTitle = !target
    ? "Search & add recipes"
    : target.isDrink
    ? "Choose a Drink"
    : target.audience === "baby"
    ? "Choose a Baby Meal"
    : target.audience === "child"
    ? "Choose a Child Meal"
    : `Choose a ${MEAL_SLOT_LABELS[target.mealType] || "Meal"}`;

  return (
    <div className="flex flex-col gap-3" data-testid="panel-manual-content">
      <p className="text-xs font-medium text-muted-foreground">{pickerTitle}</p>
      {!target && (
        <p className="text-[11px] text-muted-foreground/60 -mt-1">
          Click a day slot in the planner to add a recipe there.
        </p>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {(["all", "cookbook", "planner", "ready", "product", "web"] as const).map((f) => (
          <Button
            key={f}
            variant={mealFilter === f ? "default" : "outline"}
            size="sm"
            className={`text-xs h-7 px-2 ${f === "product" || f === "web" ? "gap-1" : ""}`}
            onClick={() => handleFilterClick(f)}
            data-testid={`button-filter-${f}`}
          >
            {f === "product" && <Package className="h-3 w-3" />}
            {f === "web" && <Globe className="h-3 w-3" />}
            {f === "all"
              ? "All"
              : f === "cookbook"
              ? "Cookbook"
              : f === "planner"
              ? "From Planner"
              : f === "ready"
              ? "Ready Meals"
              : f === "product"
              ? "Shop-bought"
              : "Web recipes"}
          </Button>
        ))}
      </div>

      {/* Meal search (non-product tabs) + Include web pill */}
      {mealFilter !== "product" && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search meals..."
              value={mealSearch}
              onChange={e => setMealSearch(e.target.value)}
              className="pl-9 h-8 text-sm"
              data-testid="input-meal-search"
            />
          </div>
          {mealFilter !== "web" && (
            <button
              onClick={() => setIncludeWeb(!includeWeb)}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors shrink-0 whitespace-nowrap ${
                includeWeb
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
              data-testid="button-include-web"
              title={includeWeb ? "Web recipes active — click to disable" : "Search trusted web recipe sources"}
            >
              <Globe className="h-3 w-3 shrink-0" />
              {includeWeb ? "Web on" : "Web recipes"}
            </button>
          )}
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

      {/* Meals list — local/cookbook results always appear first */}
      {mealFilter !== "product" && (
        <div className="overflow-y-auto space-y-0.5" data-testid="list-meal-picker">
          {mealFilter === "web" ? (
            /* Web-first mode: web results are the primary content */
            mealSearch.trim().length < 2 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="web-empty-state">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm font-medium">Search web recipes</p>
                <p className="text-xs mt-1 opacity-70">Type at least 2 characters to search the web.</p>
              </div>
            ) : (
              <>
                {webLoading && webResults.length === 0 && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                {webResults.map(recipe => (
                  <button
                    key={recipe.id}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted/40 text-left disabled:opacity-50"
                    onClick={() => handleAddWebRecipe(recipe)}
                    disabled={!!importingWebId || addingEntry}
                    data-testid={`button-select-web-${recipe.id}`}
                  >
                    {recipe.image ? (
                      <img src={recipe.image} alt={recipe.name} className="h-9 w-9 rounded-md object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <Globe className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{recipe.name}</p>
                      <div className="flex items-center gap-1 flex-wrap mt-0.5">
                        <Badge variant="outline" className="text-[10px] px-1 border-orange-300/60 text-orange-600 dark:border-orange-600/40 dark:text-orange-400">
                          Web recipe
                        </Badge>
                        {recipe.source && (
                          <span className="text-[10px] text-muted-foreground/60">{recipe.source}</span>
                        )}
                      </div>
                    </div>
                    {importingWebId === recipe.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
                    ) : null}
                  </button>
                ))}
                {!webLoading && webResults.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-6">No web recipes found for &ldquo;{mealSearch}&rdquo;</p>
                )}
              </>
            )
          ) : (
            <>
              {filteredMeals.length === 0 && !includeWeb ? (
                mealFilter === "cookbook" && !mealSearch.trim() ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ChefHat className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-medium">Search your cookbook</p>
                    <p className="text-xs mt-1 opacity-70">Type a meal name or ingredient above</p>
                  </div>
                ) : mealSearch.trim() ? (
                  <p className="text-center text-muted-foreground text-sm py-6">No meals found for &ldquo;{mealSearch}&rdquo;</p>
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-6">No meals found</p>
                )
              ) : (
                filteredMeals.map(meal => (
                  <button
                    key={meal.id}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover-elevate text-left"
                    onClick={() => {
                      if (!target) {
                        toast({ title: "Select a meal slot", description: "Click a slot in the planner to add this recipe." });
                        return;
                      }
                      onSelect(meal.id);
                    }}
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
                        {(meal as any).isHouseholdSafeVariant ? (
                          <Badge variant="outline" className="text-[10px] px-1 border-teal-400/60 text-teal-600 dark:text-teal-400">Household-safe</Badge>
                        ) : !meal.isReadyMeal && !(meal as any).isSystemMeal ? (
                          <Badge variant="outline" className="text-[10px] px-1 border-blue-400/60 text-blue-500">Cookbook</Badge>
                        ) : null}
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

              {/* Phase 2: Web results — hydrate below cookbook results, never replace them */}
              {includeWeb && mealSearch.trim().length >= 2 && (webLoading || webResults.length > 0) && (
                <div className="mt-1" data-testid="section-web-results">
                  <div className="flex items-center gap-2 py-1.5">
                    <div className="h-px flex-1 bg-border/50" />
                    <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      From the web
                    </span>
                    {webLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/60" />}
                    <div className="h-px flex-1 bg-border/50" />
                  </div>
                  {webResults.map(recipe => (
                    <button
                      key={recipe.id}
                      className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted/40 text-left disabled:opacity-50"
                      onClick={() => handleAddWebRecipe(recipe)}
                      disabled={!!importingWebId || addingEntry}
                      data-testid={`button-select-web-${recipe.id}`}
                    >
                      {recipe.image ? (
                        <img src={recipe.image} alt={recipe.name} className="h-9 w-9 rounded-md object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                          <Globe className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{recipe.name}</p>
                        <div className="flex items-center gap-1 flex-wrap mt-0.5">
                          <Badge variant="outline" className="text-[10px] px-1 border-orange-300/60 text-orange-600 dark:border-orange-600/40 dark:text-orange-400">
                            Web recipe
                          </Badge>
                          {recipe.source && (
                            <span className="text-[10px] text-muted-foreground/60">{recipe.source}</span>
                          )}
                        </div>
                      </div>
                      {importingWebId === recipe.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
                      ) : null}
                    </button>
                  ))}
                  {!webLoading && webResults.length === 0 && mealSearch.trim().length >= 2 && (
                    <p className="text-center text-[11px] text-muted-foreground/60 py-3">No web recipes found</p>
                  )}
                </div>
              )}
              {/* Nudge: show when local results are thin and web is OFF */}
              {!includeWeb && filteredMeals.length < 3 && mealSearch.trim().length >= 2 && (
                <p className="text-center text-[11px] text-muted-foreground/60 pt-2">
                  Can't find it in your cookbook?{" "}
                  <button
                    onClick={() => setIncludeWeb(true)}
                    className="underline hover:text-foreground/70 transition-colors"
                    data-testid="button-include-web-nudge"
                  >
                    Turn on web recipes
                  </button>{" "}
                  to search trusted recipe sources.
                </p>
              )}
            </>
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
