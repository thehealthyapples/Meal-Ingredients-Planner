import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import type { Meal } from "@shared/schema";
import { BROWSABLE_SHELVES, SHELF_LABELS, shelfForMeal, type CookbookShelf } from "@shared/cookbook/curation";
import { useMeals, invalidateMealLibrary } from "@/hooks/use-meals";
import { usePlannerMealSearch, type WebSearchRecipe } from "@/hooks/use-planner-meal-search";
import { usePublishCompanionContext } from "@/components/conversation/companion-context";
import { openCompanion } from "@/components/conversation/companion-open";
import { CreateMealModal } from "@/components/create-meal-modal";
import { AddToPlannerDialog } from "@/components/cookbook/add-to-planner-dialog";
import { RealBookStage, type RealBookMobilePage } from "@/components/cookbook-real-book";
import { filterCookbookMeals, paginateCookbookMeals } from "@/lib/cookbook-real-book/collection";
import { apiRequest } from "@/lib/queryClient";

const PAGE_SIZE = 6;

function RecipePage({ meal, onRead, onPlanner }: { meal: Meal | null; onRead: () => void; onPlanner: () => void }) {
  if (!meal) return <article className="rb-recipe" aria-label="Selected recipe"><h2>Select a recipe</h2><p>Your cookbook is ready for its first recipe.</p></article>;
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
  if (!recipe) return <section aria-label="Recipe preview" className="rb-web-preview"><h2>Preview recipe</h2><p>Select a trusted recipe to see its ingredients and method.</p></section>;
  const ingredients = details?.ingredients ?? recipe.ingredients;
  const instructions = details?.instructions ?? recipe.instructions ?? [];
  return <section aria-label={`Preview recipe: ${recipe.name}`} className="rb-web-preview"><p className="rb-kicker">{recipe.source || "Trusted recipe source"}</p><h2>{recipe.name}</h2>
    {recipe.image && <img src={recipe.image} alt="" className="rb-recipe-photo" />}
    {details?.loading && <p role="status">Loading recipe details…</p>}
    {details?.error && <p role="alert">Couldn’t load recipe details. You can still read the original source.</p>}
    {!details?.loading && <><h3>Ingredients</h3><ul>{ingredients.map((item, i) => <li key={`${item}-${i}`}>{item}</li>)}</ul><h3>Method</h3><ol>{instructions.map((item, i) => <li key={`${item}-${i}`}>{item}</li>)}</ol></>}
    {recipe.url && <p><a href={recipe.url} target="_blank" rel="noopener noreferrer">Read original recipe</a></p>}<button type="button" onClick={onAdd} disabled={saving || details?.loading || ingredients.length === 0}> {saving ? "Adding…" : "Add to my Cookbook"}</button>
  </section>;
}

export default function CookbookRealBookConcept() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { meals = [], isLoading, isError, refetch } = useMeals();
  const [query, setQuery] = useState("");
  const [shelf, setShelf] = useState<CookbookShelf | "all">("all");
  const [page, setPage] = useState(0);
  const [webPage, setWebPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedWeb, setSelectedWeb] = useState<WebSearchRecipe | null>(null);
  const [previewDetails, setPreviewDetails] = useState<Record<string, PreviewDetails>>({});
  const [mode, setMode] = useState<"saved" | "trusted">("saved");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [mobilePage, setMobilePage] = useState<RealBookMobilePage>("collection");
  const [createOpen, setCreateOpen] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const { filteredMeals, webResults, webLoading, webError, webHasMore, setIncludeWeb } = usePlannerMealSearch({ meals, query, filterMode: "all", enableWebSearch: true, webPage });
  const availableMeals = useMemo(() => filterCookbookMeals(filteredMeals, "", shelf), [filteredMeals, shelf]);
  const visibleMeals = useMemo(() => paginateCookbookMeals(availableMeals, page, PAGE_SIZE), [availableMeals, page]);
  const selectedMeal = useMemo(() => availableMeals.find((meal) => meal.id === selectedId) ?? visibleMeals[0] ?? null, [availableMeals, selectedId, visibleMeals]);
  usePublishCompanionContext({ selectedMealId: selectedMeal?.id });

  useEffect(() => { setPage(0); setWebPage(1); setSelectedWeb(null); }, [query, shelf, mode]);
  useEffect(() => { setIncludeWeb(mode === "trusted"); }, [mode]);
  useEffect(() => { if (selectedMeal && selectedMeal.id !== selectedId) setSelectedId(selectedMeal.id); }, [selectedMeal, selectedId]);
  useEffect(() => { setSelectedWeb(webResults[0] ?? null); }, [webResults]);
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

  const selectMode = (next: "saved" | "trusted") => { setMode(next); setIncludeWeb(next === "trusted"); };
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
      invalidateMealLibrary(queryClient); await refetch(); setSelectedId(saved.id); setMode("saved"); setIncludeWeb(false); setMobilePage("recipe");
    } catch { setSaveError(true); } finally { setSaving(false); }
  };
  const pageCount = Math.max(1, Math.ceil(availableMeals.length / PAGE_SIZE));
  const collection = <article aria-label="Cookbook collection" className="rb-collection"><header><p className="rb-kicker">My cookbook</p><h1>Our Family Favourites</h1></header>
    <div role="group" aria-label="Recipe search scope" className="rb-search-modes"><button type="button" aria-pressed={mode === "saved"} onClick={() => selectMode("saved")}>My Cookbook</button><button type="button" aria-pressed={mode === "trusted"} onClick={() => selectMode("trusted")}>Trusted recipe sources</button></div>
    {mode === "saved" && <><div role="group" aria-label="Cookbook shelves" className="rb-shelves"><button type="button" aria-pressed={shelf === "all"} onClick={() => setShelf("all")}>All</button>{BROWSABLE_SHELVES.map((item) => <button key={item} type="button" aria-pressed={shelf === item} onClick={() => setShelf(item)}>{SHELF_LABELS[item]}</button>)}</div>{isLoading && <p role="status">Loading recipes…</p>}{isError && <p role="alert">We couldn’t load the cookbook. <button type="button" onClick={() => refetch()}>Try again</button></p>}{!isLoading && !isError && visibleMeals.length === 0 && <p>No recipes match this shelf and search.</p>}<ul className="rb-recipe-grid">{visibleMeals.map((meal) => <li key={meal.id}><button type="button" aria-label={`Open recipe ${meal.name}`} aria-pressed={selectedMeal?.id === meal.id} onClick={() => { setSelectedId(meal.id); setMobilePage("recipe"); }}>{meal.imageUrl ? <img src={meal.imageUrl} alt="" /> : <span className="rb-thumb-placeholder" aria-hidden="true">✦</span>}<span>{meal.name}</span></button></li>)}</ul><nav aria-label="Cookbook pages" className="rb-page-nav"><button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>‹ Previous</button><span>{page + 1} / {pageCount}</span><button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage((value) => value + 1)}>Next ›</button></nav></>}
    {mode === "trusted" && <section aria-label="Trusted recipe results" className="rb-web-results">{webLoading && <p role="status">Searching trusted recipe sources…</p>}{webError && <p role="alert">Trusted recipe search is unavailable. Try again.</p>}{!webLoading && !webError && query.trim().length < 2 && <p>Type at least two characters to search trusted sources.</p>}{!webLoading && !webError && query.trim().length >= 2 && webResults.length === 0 && <p>No trusted recipes found.</p>}<ul>{webResults.map((recipe) => <li key={`${recipe.source}-${recipe.id}`}><button type="button" aria-label={`Preview recipe ${recipe.name}`} aria-pressed={selectedWeb?.id === recipe.id} onClick={() => { setSelectedWeb(recipe); setMobilePage("recipe"); }}><span>{recipe.name}</span><small>{recipe.source || "Trusted source"}</small></button></li>)}</ul><nav aria-label="Trusted recipe pages"><button type="button" disabled={webPage === 1} onClick={() => setWebPage((value) => value - 1)}>‹ Previous</button><span>Page {webPage}</span><button type="button" disabled={!webHasMore} onClick={() => setWebPage((value) => value + 1)}>Next ›</button></nav>{saveError && <p role="alert">Couldn’t add this recipe. Try again.</p>}</section>}
    <section aria-label="Create or import a recipe" className="rb-create"><strong>Create your own</strong><button type="button" onClick={() => setCreateOpen(true)}>Create recipe</button><button type="button" onClick={() => navigate("/import-recipe")}>Import recipe</button><button type="button" onClick={() => navigate("/cookbook?openScan=1")}>Scan recipe</button></section>
    <label className="rb-search"><span>Search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Recipe or ingredient…" aria-label="Search recipes" /></label>
  </article>;
  const selectedPreviewKey = selectedWeb ? `${selectedWeb.source || "source"}:${selectedWeb.id}` : "";
  const recipe = mode === "trusted" ? <WebPreview recipe={selectedWeb} details={selectedWeb ? previewDetails[selectedPreviewKey] ?? null : null} onAdd={addExternalRecipe} saving={saving} /> : <RecipePage meal={selectedMeal} onRead={() => selectedMeal && navigate(`/meals/${selectedMeal.id}`)} onPlanner={() => setPlannerOpen(true)} />;
  return <main aria-label="The Healthy Apples cookbook" data-realm="cookbook"><RealBookStage collectionPage={collection} recipePage={recipe} mobilePage={mobilePage} onMobilePageChange={setMobilePage} /><CreateMealModal open={createOpen} onOpenChange={setCreateOpen} /><AddToPlannerDialog mealId={selectedMeal?.id ?? 0} mealName={selectedMeal?.name ?? "recipe"} isDrink={selectedMeal?.isDrink ?? false} audience={selectedMeal?.audience ?? "adult"} open={plannerOpen && !!selectedMeal} onOpenChange={setPlannerOpen} /></main>;
}
