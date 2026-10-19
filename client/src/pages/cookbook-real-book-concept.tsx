import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { CalendarDays, ShoppingCart, Snowflake, Microscope, Minus, Plus, Loader2 } from "lucide-react";
import type { FreezerMeal, Meal } from "@shared/schema";
import { api } from "@shared/routes";
import { SHELF_LABELS, shelfForMeal } from "@shared/cookbook/curation";
import { parseIngredient } from "@shared/parse-ingredient";
import { normalizeIngredientKey } from "@shared/normalize";
import { ingredientKeyVariants, freeTextIngredientKeyVariants, resolveCanonicalFood } from "@shared/canonical/resolver";
import { useMeals, invalidateMealLibrary } from "@/hooks/use-meals";
import { usePlannerMealSearch, type WebSearchRecipe } from "@/hooks/use-planner-meal-search";
import { usePublishCompanionContext } from "@/components/conversation/companion-context";
import { CreateMealModal } from "@/components/create-meal-modal";
import { AddToPlannerDialog } from "@/components/cookbook/add-to-planner-dialog";
import { RealBookStage, type RealBookMobilePage } from "@/components/cookbook-real-book";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  filterCookbookMeals,
  filterCookbookMealsBySource,
  paginateCookbookMeals,
  type CookbookSourceFilter,
} from "@/lib/cookbook-real-book/collection";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE = 12;
const SOURCE_FILTERS: ReadonlyArray<{ key: CookbookSourceFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "cookbook", label: "My Cookbook" },
  { key: "freezer", label: "My Freezer" },
  { key: "kitchen", label: "From the THA kitchen" },
  { key: "saved-web", label: "Saved from web" },
  { key: "packaged", label: "Packaged" },
  { key: "drinks", label: "Drinks" },
];

function RecipePage({ meal, onPlanner }: { meal: Meal | null; onPlanner: () => void }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [panel, setPanel] = useState<"ingredients" | "method" | "nutrition">("ingredients");
  const [freezerOpen, setFreezerOpen] = useState(false);
  const [freezerPortions, setFreezerPortions] = useState(4);
  const [freezerLabel, setFreezerLabel] = useState("");
  const [freezerNotes, setFreezerNotes] = useState("");
  const freezerMutation = useMutation({ mutationFn: async () => apiRequest("POST", "/api/freezer", { mealId: meal!.id, totalPortions: freezerPortions, batchLabel: freezerLabel || undefined, notes: freezerNotes || undefined }), onSuccess: () => setFreezerOpen(false) });
  const { toast } = useToast();
  const shoppingMutation = useMutation({ mutationFn: async () => { const ingredientsToAdd = [...new Set((meal!.ingredients ?? []).map((ingredient) => String(ingredient ?? "").trim()).filter(Boolean))]; let added = 0; for (const ingredient of ingredientsToAdd) { try { await apiRequest("POST", api.shoppingList.add.path, { productName: ingredient, quantity: 1 }); added += 1; } catch { /* continue so one duplicate does not cancel the meal */ } } return { count: added, total: ingredientsToAdd.length }; }, onSuccess: ({ count, total }) => { queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] }); queryClient.invalidateQueries({ queryKey: [api.shoppingList.sources.path] }); queryClient.invalidateQueries({ queryKey: [api.shoppingList.prices.path] }); queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] }); toast({ title: `Added ${count} of ${total} ingredients to your shopping list`, description: meal!.name }); }, onError: () => toast({ title: "Couldn't add ingredients to your shopping list", description: "Please try again.", variant: "destructive" }) });
  const nutritionQuery = useQuery<Record<string, unknown> | null>({
    queryKey: ["/api/meals", meal?.id, "nutrition"],
    enabled: Boolean(meal?.id),
    queryFn: async () => {
      const response = await fetch(`/api/meals/${meal?.id}/nutrition`, { credentials: "include" });
      if (!response.ok) return null;
      return response.json();
    },
  });
  useEffect(() => { setPanel("ingredients"); }, [meal?.id]);
  if (!meal) return <article className="rb-recipe" aria-label="Selected recipe"><h2>Select a recipe</h2><p>No saved recipe matches this search and filter.</p></article>;
  const ingredients = meal.ingredients ?? [];
  const instructions = meal.instructions ?? [];
  const ingredientTerms = ingredients.flatMap((item) => {
    const parsed = parseIngredient(item);
    const parsedKey = normalizeIngredientKey(parsed.productName);
    const resolution = resolveCanonicalFood(parsed.productName);
    const canonicalKeys = resolution.canonicalName ? [normalizeIngredientKey(resolution.canonicalName)] : [];
    return [...freeTextIngredientKeyVariants(parsedKey), ...canonicalKeys].flatMap((key) => ingredientKeyVariants(key));
  }).filter((term, index, all) => term.length > 2 && all.indexOf(term) === index).sort((a, b) => b.length - a.length);
  const ingredientPattern = ingredientTerms.length ? new RegExp(`\\b(${ingredientTerms.map((term) => term.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")).join("|")})\\b`, "ig") : null;
  const dragCanonicalIngredient = (event: React.DragEvent<HTMLElement>, text: string) => {
    const parsed = parseIngredient(text);
    const resolution = resolveCanonicalFood(parsed.productName);
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("text/plain", parsed.productName);
    event.dataTransfer.setData("application/x-tha-canonical-food", JSON.stringify({ input: text, ingredient: parsed.productName, canonicalName: resolution.canonicalName, canonicalSlug: resolution.canonicalSlug }));
  };
  const highlightIngredients = (text: string) => {
    if (!ingredientPattern) return text;
    return text.split(ingredientPattern).map((part, index) => ingredientTerms.includes(normalizeIngredientKey(part)) ? <strong draggable="true" onDragStart={(event) => dragCanonicalIngredient(event, part)} key={`${part}-${index}`} className="rb-method-ingredient">{part}</strong> : part);
  };
  return <article aria-label={`Recipe: ${meal.name}`} className="rb-recipe">
    <p className="rb-kicker">{SHELF_LABELS[shelfForMeal(meal)]}</p><h2>{meal.name}</h2>
    {meal.imageUrl ? <img src={meal.imageUrl} alt="" className="rb-recipe-photo" /> : <p className="rb-photo-note">A family recipe · photograph not added yet</p>}
    <p className="rb-meta">Serves {meal.servings || 4}</p>
    {shelfForMeal(meal) === "web" && meal.sourceUrl && <p className="rb-recipe-reference"><a href={meal.sourceUrl} target="_blank" rel="noopener noreferrer">Reference</a></p>}
    <div className="rb-recipe-tabs" role="tablist" aria-label="Recipe details">
      {(["ingredients", "method", "nutrition"] as const).map((key) => <button key={key} type="button" role="tab" aria-selected={panel === key} className={panel === key ? "is-active" : ""} onClick={() => setPanel(key)}>{key[0].toUpperCase() + key.slice(1)}</button>)}
    </div>
    <div className="rb-recipe-panel" role="tabpanel">
      {panel === "ingredients" && <><ul className="rb-ingredients-panel">{ingredients.map((item, i) => <li draggable="true" onDragStart={(event) => { const parsed = parseIngredient(item); const resolution = resolveCanonicalFood(parsed.productName); event.dataTransfer.effectAllowed = "copy"; event.dataTransfer.setData("text/plain", parsed.productName); event.dataTransfer.setData("application/x-tha-canonical-food", JSON.stringify({ input: item, ingredient: parsed.productName, canonicalName: resolution.canonicalName, canonicalSlug: resolution.canonicalSlug })); }} className={`rb-print-line rb-print-line--${(i % 8) + 1}`} key={`${item}-${i}`}>{item}</li>)}</ul></>}
      {panel === "method" && <><ol className="rb-method-panel">{instructions.map((item, i) => <li className={`rb-print-line rb-print-line--${(i % 8) + 1}`} key={`${item}-${i}`}>{highlightIngredients(item)}</li>)}</ol></>}
      {panel === "nutrition" && <section className="rb-nutrition-panel" aria-label="Nutrition per serving">{nutritionQuery.isPending ? <dl>{["calories", "protein", "carbs", "fat", "sugar", "salt"].map((key) => <div key={key}><dt>{key}</dt><dd><Skeleton className="h-4 w-10 inline-block" /></dd></div>)}</dl> : nutritionQuery.data ? <dl>{["calories", "protein", "carbs", "fat", "sugar", "salt"].map((key) => <div key={key}><dt>{key}</dt><dd>{String(nutritionQuery.data?.[key] ?? "—")}</dd></div>)}</dl> : <p>Nutrition has not been calculated for this recipe yet.</p>}</section>}
    </div>
    <div className="rb-ink-actions rb-ink-actions--curved"><div className="rb-recipe-action-dock" aria-label="Recipe actions"><span className="rb-recipe-action-prompt">Would you like to add this to…</span><button type="button" className="rb-recipe-action-item" onClick={onPlanner} aria-label="Add to Planner" title="Add to Planner"><CalendarDays aria-hidden="true" size={18} /><span className="rb-recipe-action-label">Planner</span></button><button type="button" className="rb-recipe-action-item" onClick={() => shoppingMutation.mutate()} disabled={shoppingMutation.isPending} aria-label="Add ingredients to Shopping" title="Add ingredients to Shopping"><ShoppingCart aria-hidden="true" size={18} /><span className="rb-recipe-action-label">Shopping</span></button><button type="button" className="rb-recipe-action-item" onClick={() => setFreezerOpen(true)} aria-label="Add to My Freezer" title="Add to My Freezer"><Snowflake aria-hidden="true" size={18} /><span className="rb-recipe-action-label">Freezer</span></button><button type="button" className="rb-recipe-action-item" onClick={() => navigate("/analyser")} aria-label="Send to Analyser" title="Send to Analyser"><Microscope aria-hidden="true" size={18} /><span className="rb-recipe-action-label">Analyser</span></button></div></div>
    {freezerOpen && <div className="rb-freezer-backdrop" role="presentation" onClick={() => setFreezerOpen(false)}><section className="rb-freezer-widget" role="dialog" aria-modal="true" aria-labelledby="rb-freezer-title" onClick={(event) => event.stopPropagation()}><h3 id="rb-freezer-title"><Snowflake size={18} /> Add to My Freezer</h3><p>Freeze “{meal.name}” for later</p><label>Number of Portions<div className="rb-freezer-stepper"><button type="button" aria-label="Decrease portions" onClick={() => setFreezerPortions(Math.max(1, freezerPortions - 1))}><Minus size={16} /></button><strong>{freezerPortions}</strong><button type="button" aria-label="Increase portions" onClick={() => setFreezerPortions(freezerPortions + 1)}><Plus size={16} /></button></div></label><label>Batch Label (optional)<textarea value={freezerLabel} onChange={(event) => setFreezerLabel(event.target.value)} /></label><label>Notes (optional)<textarea value={freezerNotes} onChange={(event) => setFreezerNotes(event.target.value)} /></label><div className="rb-freezer-actions"><button type="button" onClick={() => setFreezerOpen(false)}>Cancel</button><button type="button" disabled={freezerMutation.isPending} onClick={() => freezerMutation.mutate()}>{freezerMutation.isPending ? <Loader2 size={16} /> : <Snowflake size={16} />} Freeze {freezerPortions} Portions</button></div></section></div>}
   </article>;
}

type PreviewDetails = { ingredients: string[]; instructions: string[]; loading: boolean; error: boolean };

function WebPreview({ recipe, details, onAdd, saving }: { recipe: WebSearchRecipe | null; details: PreviewDetails | null; onAdd: () => void; saving: boolean }) {
  if (!recipe) return <section aria-label="Recipe preview" className="rb-web-preview"><h2>Preview recipe</h2><p>Search, then choose an internet recipe to see its ingredients and method.</p></section>;  const ingredients = details?.ingredients ?? recipe.ingredients;
  const instructions = details?.instructions ?? recipe.instructions ?? [];
  return <section aria-label={`Preview recipe: ${recipe.name}`} className="rb-web-preview"><p className="rb-kicker">{recipe.source || "Trusted recipe source"}</p><h2>{recipe.name}</h2>
    {recipe.image && <img src={recipe.image} alt="" className="rb-recipe-photo" />}
    {details?.loading && <p role="status">Loading recipe details…</p>}
    {details?.error && <p role="alert">Couldn’t load recipe details. You can still read the original source.</p>}
    {!details?.loading && <><h3>Ingredients</h3><ul>{ingredients.map((item, i) => <li key={`${item}-${i}`}>{item}</li>)}</ul><h3>Method</h3><ol>{instructions.map((item, i) => <li key={`${item}-${i}`}>{item}</li>)}</ol></>}
    {recipe.url && <p><a href={recipe.url} target="_blank" rel="noopener noreferrer">Read original recipe</a></p>}<button type="button" onClick={onAdd} disabled={saving || details?.loading || ingredients.length === 0}>{saving ? "Adding…" : "Add to my Cookbook"}</button>
  </section>;
}

export default function CookbookRealBookConcept() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { meals = [], isLoading, isError, refetch } = useMeals();
  const { data: freezerMeals = [] } = useQuery<FreezerMeal[]>({ queryKey: ["/api/freezer"] });
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<CookbookSourceFilter>("all");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedWeb, setSelectedWeb] = useState<WebSearchRecipe | null>(null);
  const [selectedKind, setSelectedKind] = useState<"local" | "web">("local");
  const [previewDetails, setPreviewDetails] = useState<Record<string, PreviewDetails>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [mobilePage, setMobilePage] = useState<RealBookMobilePage>("collection");
  const [createOpen, setCreateOpen] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);

  const webPage = page + 1;
  const { filteredMeals, webResults, webLoading, webError, webHasMore, setIncludeWeb } = usePlannerMealSearch({
    meals,
    query,
    filterMode: "all",
    enableWebSearch: true,
    webPage,
  });
  const activeFreezerMealIds = useMemo(
    () => new Set(freezerMeals.filter((item) => item.remainingPortions > 0).map((item) => item.mealId)),
    [freezerMeals],
  );
  const searchableLocalMeals = useMemo(
    () => filterCookbookMeals(filteredMeals, "", "all"),
    [filteredMeals],
  );
  const availableMeals = useMemo(
    () => filterCookbookMealsBySource(searchableLocalMeals, sourceFilter, activeFreezerMealIds),
    [searchableLocalMeals, sourceFilter, activeFreezerMealIds],
  );
  const includesInternet = sourceFilter === "all" || sourceFilter === "internet";
  const hasSearchQuery = query.trim().length >= 2;
  const showWebResults = includesInternet && hasSearchQuery;
  const localPageSize = sourceFilter === "all" && showWebResults ? 3 : PAGE_SIZE;
  const visibleMeals = useMemo(
    () => paginateCookbookMeals(availableMeals, page, localPageSize),
    [availableMeals, page, localPageSize],
  );
  const visibleWebResults = showWebResults
    ? webResults.slice(0, sourceFilter === "all" ? 3 : PAGE_SIZE)
    : [];
  const selectedMeal = useMemo(
    () => availableMeals.find((meal) => meal.id === selectedId) ?? visibleMeals[0] ?? null,
    [availableMeals, selectedId, visibleMeals],
  );
  const localPageCount = Math.max(1, Math.ceil(availableMeals.length / localPageSize));
  const canGoNext = sourceFilter === "internet"
    ? webHasMore
    : showWebResults
      ? page + 1 < localPageCount || webHasMore
      : page + 1 < localPageCount;

  usePublishCompanionContext({ selectedMealId: selectedKind === "local" ? selectedMeal?.id : undefined });

  useEffect(() => { setPage(0); setSelectedWeb(null); }, [query, sourceFilter]);
  useEffect(() => { setIncludeWeb(sourceFilter === "all" || sourceFilter === "internet"); }, [sourceFilter]);
  useEffect(() => {
    if (selectedMeal && selectedMeal.id !== selectedId) setSelectedId(selectedMeal.id);
  }, [selectedMeal, selectedId]);
  useEffect(() => {
    setSelectedWeb(webResults[0] ?? null);
    if (sourceFilter === "internet") setSelectedKind("web");
  }, [webResults, sourceFilter]);
  useEffect(() => {
    if (!selectedWeb?.url || (selectedWeb.ingredients.length > 0 && (selectedWeb.instructions?.length ?? 0) > 0)) return;
    const key = `${selectedWeb.source || "source"}:${selectedWeb.id}`;
    if (previewDetails[key]) return;
    let active = true;
    setPreviewDetails((current) => ({ ...current, [key]: { ingredients: selectedWeb.ingredients, instructions: selectedWeb.instructions ?? [], loading: true, error: false } }));
    fetch("/api/preview-recipe", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ url: selectedWeb.url }) })
      .then(async (response) => {
        if (!response.ok) throw new Error("preview unavailable");
        return response.json() as Promise<{ ingredients?: string[]; instructions?: string[]; error?: string }>;
      })
      .then((data) => {
        if (!active) return;
        setPreviewDetails((current) => ({ ...current, [key]: { ingredients: data.ingredients ?? [], instructions: data.instructions ?? [], loading: false, error: !!data.error } }));
      })
      .catch(() => {
        if (!active) return;
        setPreviewDetails((current) => ({ ...current, [key]: { ingredients: [], instructions: [], loading: false, error: true } }));
      });
    return () => { active = false; };
  }, [selectedWeb]);

  const chooseSource = (next: CookbookSourceFilter) => {
    setSourceFilter(next);
    setSelectedKind(next === "internet" ? "web" : "local");
  };

  const addExternalRecipe = async () => {
    if (!selectedWeb) return;
    const previewKey = `${selectedWeb.source || "source"}:${selectedWeb.id}`;
    const resolvedDetails = previewDetails[previewKey];
    const ingredients = resolvedDetails?.ingredients.length ? resolvedDetails.ingredients : selectedWeb.ingredients;
    const instructions = resolvedDetails?.instructions.length ? resolvedDetails.instructions : selectedWeb.instructions ?? [];
    setSaving(true); setSaveError(false);
    try {
      const response = await apiRequest("POST", "/api/meals", { name: selectedWeb.name, ingredients, instructions, servings: 4, imageUrl: selectedWeb.image || null, sourceUrl: selectedWeb.url, mealSourceType: "imported_website", acquisitionLane: "licensed_discovery", acquisitionType: "licensed_import", acquisitionSourceKey: selectedWeb.source || "trusted_recipe_source" });
      const saved = await response.json() as Meal;
      invalidateMealLibrary(queryClient);
      await refetch();
      setSelectedId(saved.id);
      setSourceFilter("cookbook");
      setSelectedKind("local");
      setIncludeWeb(false);
      setMobilePage("recipe");
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const collection = <article aria-label="Cookbook collection" className="rb-collection">
    <header><p className="rb-kicker">My cookbook</p><h1>Our Family Favourites</h1></header>
    <div role="group" aria-label="Cookbook shelves" className="rb-source-filters">
      {SOURCE_FILTERS.map((item) => <button key={item.key} type="button" aria-pressed={sourceFilter === item.key} onClick={() => chooseSource(item.key)}>{item.label}</button>)}
    </div>
    <section aria-label="Create or import a recipe" className="rb-create"><strong>Do you have inspiration for a new recipe?</strong><span className="rb-create-line">New recipe: Create Import Scan</span><button type="button" onClick={() => setCreateOpen(true)}>Create</button><button type="button" onClick={() => navigate("/import-recipe")}>Import</button><button type="button" onClick={() => navigate("/cookbook/grid?openScan=1")}>Scan</button></section>
    <label className="rb-search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search recipes, freezer and internet" aria-label="Search recipes, freezer and internet" /></label>
    {isLoading && <ul className="rb-recipe-grid" role="status" aria-label="Loading recipes" aria-busy="true">{[1, 2, 3, 4].map((i) => <li key={`recipe-skeleton-${i}`}><Skeleton className="aspect-square rounded-md" /></li>)}</ul>}
    {isError && <p role="alert">We couldn’t load the cookbook. <button type="button" onClick={() => refetch()}>Try again</button></p>}
    {webLoading && <p role="status">Searching the internet…</p>}
    {webError && showWebResults && <p role="alert">Internet recipe search is unavailable. Local results are still shown.</p>}
    {!webLoading && !isLoading && query.trim().length > 0 && query.trim().length < 2 && includesInternet && <p>Type at least two characters to include internet recipes.</p>}
    {!webLoading && !isLoading && visibleMeals.length === 0 && visibleWebResults.length === 0 && <EmptyState variant="filtered" title={query.trim() ? "No recipes match this search and filter." : sourceFilter === "internet" ? "Search to find recipes on the internet." : "No recipes match this filter."} />}
    <ul className="rb-recipe-grid">
      {visibleMeals.map((meal) => <li key={`local-${meal.id}`}><button type="button" draggable="true" onDragStart={(event) => { event.dataTransfer.effectAllowed = "copy"; event.dataTransfer.setData("text/plain", meal.name); event.dataTransfer.setData("application/x-tha-recipe", JSON.stringify({ mealId: meal.id, name: meal.name })); }} aria-label={`Open recipe ${meal.name}`} aria-pressed={selectedKind === "local" && selectedMeal?.id === meal.id} onClick={() => { setSelectedId(meal.id); setSelectedKind("local"); setMobilePage("recipe"); }}>{meal.imageUrl ? <img src={meal.imageUrl} alt="" /> : <span className="rb-thumb-placeholder" aria-hidden="true">✦</span>}<span>{meal.name}</span></button></li>)}
      {visibleWebResults.map((recipe) => <li key={`web-${recipe.source}-${recipe.id}`}><button type="button" aria-label={`Preview internet recipe ${recipe.name}`} aria-pressed={selectedKind === "web" && selectedWeb?.id === recipe.id} onClick={() => { setSelectedWeb(recipe); setSelectedKind("web"); setMobilePage("recipe"); }}>{recipe.image ? <img src={recipe.image} alt="" /> : <span className="rb-thumb-placeholder" aria-hidden="true">↗</span>}<span>{recipe.name}<small>{recipe.source || "Internet"}</small></span></button></li>)}
    </ul>
    {saveError && <p role="alert">Couldn’t add this recipe. Try again.</p>}
    <nav aria-label="Recipe result pages" className="rb-page-nav"><button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>‹ Previous</button><span>Page {page + 1}</span><button type="button" disabled={!canGoNext} onClick={() => setPage((value) => value + 1)}>Next ›</button></nav>
  </article>;

  const selectedPreviewKey = selectedWeb ? `${selectedWeb.source || "source"}:${selectedWeb.id}` : "";
  const recipe = selectedKind === "web"
    ? <WebPreview recipe={selectedWeb} details={selectedWeb ? previewDetails[selectedPreviewKey] ?? null : null} onAdd={addExternalRecipe} saving={saving} />
    : <RecipePage meal={selectedMeal} onPlanner={() => setPlannerOpen(true)} />;

  return <main aria-label="The Healthy Apples cookbook" data-realm="cookbook"><RealBookStage collectionPage={collection} recipePage={recipe} mobilePage={mobilePage} onMobilePageChange={setMobilePage} /><CreateMealModal open={createOpen} onOpenChange={setCreateOpen} /><AddToPlannerDialog mealId={selectedMeal?.id ?? 0} mealName={selectedMeal?.name ?? "recipe"} isDrink={selectedMeal?.isDrink ?? false} audience={selectedMeal?.audience ?? "adult"} open={plannerOpen && !!selectedMeal} onOpenChange={setPlannerOpen} /></main>;
}
