import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { FreezerMeal, Meal } from "@shared/schema";
import { SHELF_LABELS, shelfForMeal } from "@shared/cookbook/curation";
import { useMeals, invalidateMealLibrary } from "@/hooks/use-meals";
import { usePlannerMealSearch, type WebSearchRecipe } from "@/hooks/use-planner-meal-search";
import { usePublishCompanionContext } from "@/components/conversation/companion-context";
import { openCompanion } from "@/components/conversation/companion-open";
import { CreateMealModal } from "@/components/create-meal-modal";
import { AddToPlannerDialog } from "@/components/cookbook/add-to-planner-dialog";
import { RealBookStage, type RealBookMobilePage } from "@/components/cookbook-real-book";
import {
  filterCookbookMeals,
  filterCookbookMealsBySource,
  paginateCookbookMeals,
  type CookbookSourceFilter,
} from "@/lib/cookbook-real-book/collection";
import { apiRequest } from "@/lib/queryClient";

const PAGE_SIZE = 6;
const SOURCE_FILTERS: ReadonlyArray<{ key: CookbookSourceFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "cookbook", label: "My Cookbook" },
  { key: "freezer", label: "My Freezer" },
  { key: "kitchen", label: "Healthy Apples" },
  { key: "saved-web", label: "Saved from web" },
  { key: "internet", label: "Internet" },
  { key: "packaged", label: "Packaged" },
  { key: "drinks", label: "Drinks" },
];

function RecipePage({ meal, onRead, onPlanner }: { meal: Meal | null; onRead: () => void; onPlanner: () => void }) {
  if (!meal) return <article className="rb-recipe" aria-label="Selected recipe"><h2>Select a recipe</h2><p>No saved recipe matches this search and filter.</p></article>;
  const ingredients = meal.ingredients ?? [];
  const instructions = meal.instructions ?? [];
  return <article aria-label={`Recipe: ${meal.name}`} className="rb-recipe">
    <p className="rb-kicker">{SHELF_LABELS[shelfForMeal(meal)]}</p><h2>{meal.name}</h2>
    {meal.imageUrl ? <img src={meal.imageUrl} alt="" className="rb-recipe-photo" /> : <p className="rb-photo-note">A family recipe · photograph not added yet</p>}
    <p className="rb-meta">Serves {meal.servings || 4}</p>
    <div className="rb-recipe-columns"><section><h3>Ingredients</h3><ul>{ingredients.slice(0, 8).map((item, i) => <li key={`${item}-${i}`}>{item}</li>)}</ul></section><section><h3>Method</h3><ol>{instructions.slice(0, 6).map((item, i) => <li key={`${item}-${i}`}>{item}</li>)}</ol></section></div>
    <div className="rb-ink-actions"><button type="button" onClick={onRead}>Read full recipe</button><button type="button" onClick={onPlanner}>Add to Planner</button><button type="button" onClick={() => openCompanion()}>Ask Companion about this recipe</button></div>
  </article>;
}

type PreviewDetails = { ingredients: string[]; instructions: string[]; loading: boolean; error: boolean };

function WebPreview({ recipe, details, onAdd, saving }: { recipe: WebSearchRecipe | null; details: PreviewDetails | null; onAdd: () => void; saving: boolean }) {
  if (!recipe) return <section aria-label="Recipe preview" className="rb-web-preview"><h2>Preview recipe</h2><p>Search, then choose an internet recipe to see its ingredients and method.</p></section>;
  const ingredients = details?.ingredients ?? recipe.ingredients;
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
    <div role="group" aria-label="Filter recipe sources" className="rb-source-filters">
      {SOURCE_FILTERS.map((item) => <button key={item.key} type="button" aria-pressed={sourceFilter === item.key} onClick={() => chooseSource(item.key)}>{item.label}</button>)}
    </div>
    {isLoading && <p role="status">Loading recipes…</p>}
    {isError && <p role="alert">We couldn’t load the cookbook. <button type="button" onClick={() => refetch()}>Try again</button></p>}
    {webLoading && <p role="status">Searching the internet…</p>}
    {webError && showWebResults && <p role="alert">Internet recipe search is unavailable. Local results are still shown.</p>}
    {!webLoading && !isLoading && query.trim().length > 0 && query.trim().length < 2 && includesInternet && <p>Type at least two characters to include internet recipes.</p>}
    {!webLoading && !isLoading && visibleMeals.length === 0 && visibleWebResults.length === 0 && <p>{query.trim() ? "No recipes match this search and filter." : sourceFilter === "internet" ? "Search to find recipes on the internet." : "No recipes match this filter."}</p>}
    <ul className="rb-recipe-grid">
      {visibleMeals.map((meal) => <li key={`local-${meal.id}`}><button type="button" aria-label={`Open recipe ${meal.name}`} aria-pressed={selectedKind === "local" && selectedMeal?.id === meal.id} onClick={() => { setSelectedId(meal.id); setSelectedKind("local"); setMobilePage("recipe"); }}>{meal.imageUrl ? <img src={meal.imageUrl} alt="" /> : <span className="rb-thumb-placeholder" aria-hidden="true">✦</span>}<span>{meal.name}</span></button></li>)}
      {visibleWebResults.map((recipe) => <li key={`web-${recipe.source}-${recipe.id}`}><button type="button" aria-label={`Preview internet recipe ${recipe.name}`} aria-pressed={selectedKind === "web" && selectedWeb?.id === recipe.id} onClick={() => { setSelectedWeb(recipe); setSelectedKind("web"); setMobilePage("recipe"); }}>{recipe.image ? <img src={recipe.image} alt="" /> : <span className="rb-thumb-placeholder" aria-hidden="true">↗</span>}<span>{recipe.name}<small>{recipe.source || "Internet"}</small></span></button></li>)}
    </ul>
    <nav aria-label="Recipe result pages" className="rb-page-nav"><button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>‹ Previous</button><span>Page {page + 1}</span><button type="button" disabled={!canGoNext} onClick={() => setPage((value) => value + 1)}>Next ›</button></nav>
    {saveError && <p role="alert">Couldn’t add this recipe. Try again.</p>}
    <section aria-label="Create or import a recipe" className="rb-create"><strong>Create your own</strong><button type="button" onClick={() => setCreateOpen(true)}>Create recipe</button><button type="button" onClick={() => navigate("/import-recipe")}>Import recipe</button><button type="button" onClick={() => navigate("/cookbook?openScan=1")}>Scan recipe</button></section>
    <label className="rb-search"><span>Search recipes, freezer and internet</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Recipe, ingredient or dish…" aria-label="Search recipes, freezer and internet" /></label>
  </article>;

  const selectedPreviewKey = selectedWeb ? `${selectedWeb.source || "source"}:${selectedWeb.id}` : "";
  const recipe = selectedKind === "web"
    ? <WebPreview recipe={selectedWeb} details={selectedWeb ? previewDetails[selectedPreviewKey] ?? null : null} onAdd={addExternalRecipe} saving={saving} />
    : <RecipePage meal={selectedMeal} onRead={() => selectedMeal && navigate(`/meals/${selectedMeal.id}`)} onPlanner={() => setPlannerOpen(true)} />;

  return <main aria-label="The Healthy Apples cookbook" data-realm="cookbook"><RealBookStage collectionPage={collection} recipePage={recipe} mobilePage={mobilePage} onMobilePageChange={setMobilePage} /><CreateMealModal open={createOpen} onOpenChange={setCreateOpen} /><AddToPlannerDialog mealId={selectedMeal?.id ?? 0} mealName={selectedMeal?.name ?? "recipe"} isDrink={selectedMeal?.isDrink ?? false} audience={selectedMeal?.audience ?? "adult"} open={plannerOpen && !!selectedMeal} onOpenChange={setPlannerOpen} /></main>;
}
