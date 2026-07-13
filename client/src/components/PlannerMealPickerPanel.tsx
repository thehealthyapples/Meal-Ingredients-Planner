import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, Loader2, ChefHat, UtensilsCrossed,
  Baby, PersonStanding, Wine, Package, Store, Microscope, Globe, Snowflake,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Meal, FreezerMeal } from "@shared/schema";
import { scoreMealSearch } from "@shared/food-synonyms";
import { usePlannerMealSearch, type WebSearchRecipe } from "@/hooks/use-planner-meal-search";
import { MealPreviewBubble, MealPreviewInline, useMealPreview } from "@/components/MealPreviewBubble";
import { DraggableSearchResultRow } from "@/components/PlannerDragDrop";

// PX1-W2 (fnd-px-breakpoint-six-truths): the local useIsMobile copy is retired;
// breakpoint truth has one owner.
import { useIsMobile } from "@/hooks/use-adaptive-density";
import { invalidateMealLibrary } from "@/hooks/use-meals";

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

export type PlannerSourceKey = "web" | "cookbook" | "freezer" | "packaged";

const MEAL_SLOT_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snacks: "Snack",
};

const RETAILER_LIST = ["Tesco", "Sainsbury's", "Asda", "Morrisons", "Aldi", "Lidl", "Waitrose", "M&S"];

const SOURCE_CHIPS: Array<{ key: PlannerSourceKey; label: string; Icon: React.ComponentType<{ className?: string }> }> = [
  { key: "web",      label: "Web recipes", Icon: Globe },
  { key: "cookbook", label: "My Cookbook", Icon: ChefHat },
  { key: "freezer",  label: "My Freezer",  Icon: Snowflake },
  { key: "packaged", label: "Packaged",    Icon: Package },
];

interface PlannerMealPickerPanelProps {
  target: EntryTarget | null;
  meals: Meal[];
  plannerMealIdSet: Set<number>;
  categoryIdForSlot: Record<string, number | undefined>;
  onSelect: (mealId: number) => void;
  addingEntry: boolean;
  onAddProduct: (product: PlannerProductResult) => void;
  freezerMeals?: FreezerMeal[];
}

export function PlannerMealPickerPanel({
  target,
  meals,
  plannerMealIdSet: _plannerMealIdSet,
  categoryIdForSlot,
  onSelect,
  addingEntry,
  onAddProduct,
  freezerMeals = [],
}: PlannerMealPickerPanelProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const isMobile = useIsMobile();
  const [mealSearch, setMealSearch] = useState("");
  const [activeSources, setActiveSources] = useState<Set<PlannerSourceKey>>(
    () => new Set<PlannerSourceKey>(["web", "cookbook", "freezer"]),
  );
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<PlannerProductResult[]>([]);
  const [productSearching, setProductSearching] = useState(false);
  const [productRetailer, setProductRetailer] = useState("");
  const [importingWebId, setImportingWebId] = useState<string | null>(null);
  // Phase 4: tracks web recipes imported this session — recipe.id → saved meal.id
  const [importedWebRecipes, setImportedWebRecipes] = useState<Map<string, number>>(new Map());
  const importedMealIdSet = useMemo(() => new Set(importedWebRecipes.values()), [importedWebRecipes]);

  const {
    previewItem,
    previewAnchor,
    mobilePreviewId,
    setMobilePreviewId,
    openPreview,
    scheduleClose,
    cancelClose,
    closePreview,
  } = useMealPreview();

  useEffect(() => {
    if (!previewItem && !mobilePreviewId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { closePreview(); setMobilePreviewId(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [previewItem, mobilePreviewId, closePreview, setMobilePreviewId]);

  const webActive = activeSources.has("web");

  // Web search delegated to shared hook. Sync its session-persisted includeWeb with our activeSources.
  const { webResults, webLoading, setIncludeWeb } = usePlannerMealSearch({
    meals,
    query: mealSearch,
    filterMode: "all",
    excludePlaceholders: true,
    enableWebSearch: webActive,
  });

  useEffect(() => { setIncludeWeb(webActive); }, [webActive, setIncludeWeb]);

  const toggleSource = (key: PlannerSourceKey) => {
    setActiveSources(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    setMealSearch("");
  };

  const freezerMealIds = useMemo(
    () => new Set(freezerMeals.filter(f => f.remainingPortions > 0).map(f => f.mealId)),
    [freezerMeals],
  );

  const filteredMeals = useMemo(() => {
    const hasCookbook = activeSources.has("cookbook");
    const hasFreezer  = activeSources.has("freezer");
    const hasPackaged = activeSources.has("packaged");

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

    if (!hasCookbook && !hasFreezer && !hasPackaged) {
      result = [];
    } else {
      result = result.filter(m => {
        const isReady  = m.isReadyMeal;
        const isFrozen = freezerMealIds.has(m.id);
        if (hasCookbook && !isReady) return true;
        if (hasFreezer  && isFrozen && !isReady) return true;
        if (hasPackaged && isReady) return true;
        return false;
      });
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
        const rest     = result.filter(m => m.categoryId !== slotCatId);
        result = [...matching, ...rest];
      }
    }

    // Deprioritise ready meals to end when mixed sources are active
    if (!mealSearch.trim() && (hasCookbook || hasFreezer) && hasPackaged) {
      const nonReady = result.filter(m => !m.isReadyMeal);
      const ready    = result.filter(m => m.isReadyMeal);
      result = [...nonReady, ...ready];
    }

    // Suppress meals that were just imported from web — they display as transitioned rows in the web section
    result = result.filter(m => !importedMealIdSet.has(m.id));

    return result.slice(0, 100);
  }, [meals, activeSources, mealSearch, target, categoryIdForSlot, freezerMealIds, importedMealIdSet]);

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
      invalidateMealLibrary(qc);
      // Phase 4: track ownership transition — row becomes draggable after this
      setImportedWebRecipes(prev => new Map(prev).set(recipe.id, meal.id));
      toast({ title: "Saved to My Cookbook", description: recipe.name });
    } catch {
      toast({ title: "Could not add web recipe", variant: "destructive" });
    } finally {
      setImportingWebId(null);
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

      {/* Compact multi-select source chips */}
      <div className="flex gap-1.5 flex-wrap" data-testid="source-filter-chips">
        {SOURCE_CHIPS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => toggleSource(key)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
              activeSources.has(key)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
            data-testid={`button-source-${key}`}
          >
            <Icon className="h-3 w-3 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* Meal search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search meals..."
          aria-label="Search meals"
          value={mealSearch}
          onChange={e => setMealSearch(e.target.value)}
          className="pl-9 h-8 text-sm"
          data-testid="input-meal-search"
        />
      </div>

      {/* Meals list */}
      <div className="overflow-y-auto space-y-0.5" data-testid="list-meal-picker">
        {filteredMeals.length === 0 && !webActive ? (
          activeSources.size === 0 || (!activeSources.has("cookbook") && !activeSources.has("freezer") && !activeSources.has("packaged")) ? (
            <p className="text-center text-muted-foreground text-sm py-6">Enable a source above to find meals</p>
          ) : mealSearch.trim() ? (
            <p className="text-center text-muted-foreground text-sm py-6">No meals found for &ldquo;{mealSearch}&rdquo;</p>
          ) : (
            <p className="text-center text-muted-foreground text-sm py-6">No meals found</p>
          )
        ) : (
          filteredMeals.map(meal => {
            const sourceOrigin = meal.isReadyMeal ? "packaged" : freezerMealIds.has(meal.id) ? "freezer" : "cookbook";
            return (
              <div key={meal.id}>
                <DraggableSearchResultRow mealId={meal.id} mealName={meal.name} sourceOrigin={sourceOrigin}>
                  <button
                    className="w-full flex items-center gap-3 p-2 rounded-md hover-elevate text-left"
                    onClick={() => {
                      if (isMobile) {
                        const pid = `meal-${meal.id}`;
                        setMobilePreviewId(mobilePreviewId === pid ? null : pid);
                        return;
                      }
                      if (!target) {
                        toast({ title: "Select a meal slot", description: "Click a slot in the planner to add this recipe." });
                        return;
                      }
                      onSelect(meal.id);
                    }}
                    onMouseEnter={(e) => !isMobile && openPreview({ kind: "meal", meal }, e.currentTarget)}
                    onMouseLeave={() => !isMobile && scheduleClose()}
                    onFocus={(e) => !isMobile && openPreview({ kind: "meal", meal }, e.currentTarget)}
                    onBlur={() => !isMobile && scheduleClose()}
                    disabled={addingEntry}
                    aria-describedby={previewItem && previewItem.kind === "meal" && previewItem.meal.id === meal.id ? `preview-meal-${meal.id}` : undefined}
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
                        {freezerMealIds.has(meal.id) && (
                          <Badge variant="outline" className="text-[10px] px-1 border-sky-300/60 text-sky-500 dark:text-sky-400">
                            <Snowflake className="h-2.5 w-2.5 mr-0.5" />Frozen
                          </Badge>
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
                </DraggableSearchResultRow>
                {isMobile && mobilePreviewId === `meal-${meal.id}` && (
                  <MealPreviewInline
                    item={{ kind: "meal", meal }}
                    onAction={() => {
                      setMobilePreviewId(null);
                      if (!target) {
                        toast({ title: "Select a meal slot", description: "Click a slot in the planner to add this recipe." });
                        return;
                      }
                      onSelect(meal.id);
                    }}
                    actionLabel={target ? "Add to planner" : "Select recipe"}
                    actionDisabled={addingEntry}
                    onDismiss={() => setMobilePreviewId(null)}
                  />
                )}
              </div>
            );
          })
        )}

        {/* Web results — always below local results, never replacing them */}
        {webActive && mealSearch.trim().length >= 2 && (webLoading || webResults.length > 0) && (
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
            {webResults.map(recipe => {
              const importedMealId = importedWebRecipes.get(recipe.id);
              const isImported = importedMealId !== undefined;

              if (isImported) {
                // Phase 4: recipe is now cookbook-owned — render as draggable cookbook row
                return (
                  <div key={recipe.id}>
                    <DraggableSearchResultRow mealId={importedMealId} mealName={recipe.name} sourceOrigin="cookbook">
                      <button
                        className="w-full flex items-center gap-3 p-2 rounded-md hover-elevate text-left"
                        onClick={() => {
                          if (isMobile) {
                            const pid = `web-${recipe.id}`;
                            setMobilePreviewId(mobilePreviewId === pid ? null : pid);
                            return;
                          }
                          if (!target) {
                            toast({ title: "Select a meal slot", description: "Click a slot in the planner to add this recipe." });
                            return;
                          }
                          onSelect(importedMealId);
                        }}
                        onMouseEnter={(e) => !isMobile && openPreview({ kind: "web", recipe }, e.currentTarget)}
                        onMouseLeave={() => !isMobile && scheduleClose()}
                        onFocus={(e) => !isMobile && openPreview({ kind: "web", recipe }, e.currentTarget)}
                        onBlur={() => !isMobile && scheduleClose()}
                        disabled={addingEntry}
                        data-testid={`button-select-web-${recipe.id}`}
                      >
                        {recipe.image ? (
                          <img src={recipe.image} alt={recipe.name} className="h-9 w-9 rounded-md object-cover flex-shrink-0" />
                        ) : (
                          <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                            <ChefHat className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{recipe.name}</p>
                          <div className="flex items-center gap-1 flex-wrap mt-0.5">
                            <Badge variant="outline" className="text-[10px] px-1 border-blue-400/60 text-blue-500">
                              <ChefHat className="h-2.5 w-2.5 mr-0.5" />Cookbook
                            </Badge>
                            {recipe.source && (
                              <span className="text-[10px] text-muted-foreground/60">{recipe.source}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    </DraggableSearchResultRow>
                    {isMobile && mobilePreviewId === `web-${recipe.id}` && (
                      <MealPreviewInline
                        item={{ kind: "web", recipe }}
                        onAction={() => {
                          setMobilePreviewId(null);
                          if (!target) {
                            toast({ title: "Select a meal slot", description: "Click a slot in the planner to add this recipe." });
                            return;
                          }
                          onSelect(importedMealId);
                        }}
                        actionLabel={target ? "Add to planner" : "Select recipe"}
                        actionDisabled={addingEntry}
                        onDismiss={() => setMobilePreviewId(null)}
                      />
                    )}
                  </div>
                );
              }

              // Not yet imported — render as external web recipe (click to import)
              return (
                <div key={recipe.id}>
                  <button
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted/40 text-left disabled:opacity-50"
                    onClick={() => {
                      if (isMobile) {
                        const pid = `web-${recipe.id}`;
                        setMobilePreviewId(mobilePreviewId === pid ? null : pid);
                        return;
                      }
                      handleAddWebRecipe(recipe);
                    }}
                    onMouseEnter={(e) => !isMobile && openPreview({ kind: "web", recipe }, e.currentTarget)}
                    onMouseLeave={() => !isMobile && scheduleClose()}
                    onFocus={(e) => !isMobile && openPreview({ kind: "web", recipe }, e.currentTarget)}
                    onBlur={() => !isMobile && scheduleClose()}
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
                  {isMobile && mobilePreviewId === `web-${recipe.id}` && (
                    <MealPreviewInline
                      item={{ kind: "web", recipe }}
                      onAction={() => {
                        setMobilePreviewId(null);
                        handleAddWebRecipe(recipe);
                      }}
                      actionLabel="Save to My Cookbook"
                      actionDisabled={!!importingWebId || addingEntry}
                      onDismiss={() => setMobilePreviewId(null)}
                    />
                  )}
                </div>
              );
            })}
            {!webLoading && webResults.length === 0 && mealSearch.trim().length >= 2 && (
              <p className="text-center text-[11px] text-muted-foreground/60 py-3">No web recipes found</p>
            )}
          </div>
        )}

        {/* Nudge: show when web is OFF and local results are thin */}
        {!webActive && filteredMeals.length < 3 && mealSearch.trim().length >= 2 && (
          <p className="text-center text-[11px] text-muted-foreground/60 pt-2">
            Can't find it in your cookbook?{" "}
            <button
              onClick={() => toggleSource("web")}
              className="underline hover:text-foreground/70 transition-colors"
              data-testid="button-include-web-nudge"
            >
              Turn on web recipes
            </button>{" "}
            to search trusted recipe sources.
          </p>
        )}
      </div>

      {/* Shop-bought product search — only when Packaged chip is active */}
      {activeSources.has("packaged") && (
        <div className="border-t border-border/40 pt-2 space-y-2" data-testid="section-product-search">
          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Package className="h-3 w-3" />
            Shop-bought products
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="e.g. oven chips, granola…"
                aria-label="Search shop-bought products"
                value={productQuery}
                onChange={e => setProductQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && searchProducts()}
                className="pl-9 h-8 text-sm"
                data-testid="input-product-query"
              />
            </div>
            <button
              className="h-8 w-8 shrink-0 flex items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-50"
              onClick={searchProducts}
              disabled={productSearching || !productQuery.trim()}
              aria-label="Search products"
              data-testid="button-product-search"
            >
              {productSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </button>
          </div>
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
          <div className="space-y-1" data-testid="list-product-picker">
            {!productSearching && productResults.length === 0 && !productQuery.trim() && (
              <div className="text-center py-4 text-muted-foreground">
                <Store className="h-6 w-6 mx-auto mb-1.5 opacity-20" />
                <p className="text-xs">Search for a shop-bought product</p>
                <p className="text-[10px] mt-0.5 opacity-70">Try: oven chips, baked beans, Greek yoghurt</p>
              </div>
            )}
            {productSearching && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!productSearching && productResults.length === 0 && productQuery.trim() && (
              <p className="text-center text-muted-foreground py-4 text-xs">No products found — try a different term</p>
            )}
            {!productSearching && productResults.map((product, i) => {
              const stores = [...(product.confirmedStores ?? []), ...(product.inferredStores ?? [])];
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
                    className="shrink-0 p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors hover-reveal group-hover:opacity-100"
                    title="Analyse in Analyser"
                    data-testid={`link-analyse-product-${i}`}
                  >
                    <Microscope className="h-3.5 w-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Desktop floating preview bubble */}
      {!isMobile && previewItem && previewAnchor && (
        <MealPreviewBubble
          item={previewItem}
          anchor={previewAnchor}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        />
      )}
    </div>
  );
}
