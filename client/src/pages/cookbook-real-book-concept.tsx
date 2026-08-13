import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import type { Meal } from "@shared/schema";
import { BROWSABLE_SHELVES, SHELF_LABELS, shelfForMeal, type CookbookShelf } from "@shared/cookbook/curation";
import { useMeals } from "@/hooks/use-meals";
import { usePublishCompanionContext } from "@/components/conversation/companion-context";
import { openCompanion } from "@/components/conversation/companion-open";
import { CreateMealModal } from "@/components/create-meal-modal";
import { AddToPlannerDialog } from "@/components/cookbook/add-to-planner-dialog";
import { RealBookStage, type RealBookMobilePage } from "@/components/cookbook-real-book";
import { filterCookbookMeals, paginateCookbookMeals } from "@/lib/cookbook-real-book/collection";

const PAGE_SIZE = 6;

function RecipePage({ meal, onRead, onPlanner }: { meal: Meal | null; onRead: () => void; onPlanner: () => void }) {
  if (!meal) return <article className="rb-recipe" aria-label="Selected recipe"><h2>Select a recipe</h2><p>Your cookbook is ready for its first recipe.</p></article>;
  const shelf = shelfForMeal(meal);
  const ingredients = meal.ingredients ?? [];
  const instructions = meal.instructions ?? [];
  return (
    <article aria-label={`Recipe: ${meal.name}`} className="rb-recipe">
      <p className="rb-kicker">{SHELF_LABELS[shelf]}</p>
      <h2>{meal.name}</h2>
      {meal.imageUrl ? <img src={meal.imageUrl} alt="" className="rb-recipe-photo" /> : <p className="rb-photo-note">A family recipe · photograph not added yet</p>}
      <p className="rb-meta">Serves {meal.servings || 4}</p>
      <div className="rb-recipe-columns">
        <section><h3>Ingredients</h3><ul>{ingredients.slice(0, 8).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></section>
        <section><h3>Method</h3><ol>{instructions.slice(0, 6).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ol></section>
      </div>
      <div className="rb-ink-actions">
        <button type="button" onClick={onRead}>Read full recipe</button>
        <button type="button" onClick={onPlanner}>Add to Planner</button>
        <button type="button" onClick={() => openCompanion()}>Ask Companion about this recipe</button>
      </div>
    </article>
  );
}

export default function CookbookRealBookConcept() {
  const [, navigate] = useLocation();
  const { meals = [], isLoading, isError, refetch } = useMeals();
  const [query, setQuery] = useState("");
  const [shelf, setShelf] = useState<CookbookShelf | "all">("all");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mobilePage, setMobilePage] = useState<RealBookMobilePage>("collection");
  const [createOpen, setCreateOpen] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);

  const availableMeals = useMemo(() => filterCookbookMeals(meals, query, shelf), [meals, query, shelf]);
  const visibleMeals = useMemo(() => paginateCookbookMeals(availableMeals, page, PAGE_SIZE), [availableMeals, page]);
  const selectedMeal = useMemo(() => availableMeals.find((meal) => meal.id === selectedId) ?? visibleMeals[0] ?? null, [availableMeals, selectedId, visibleMeals]);
  usePublishCompanionContext({ selectedMealId: selectedMeal?.id });

  useEffect(() => { setPage(0); }, [query, shelf]);
  useEffect(() => { if (selectedMeal && selectedMeal.id !== selectedId) setSelectedId(selectedMeal.id); }, [selectedMeal, selectedId]);

  const selectMeal = (meal: Meal) => { setSelectedId(meal.id); setMobilePage("recipe"); };
  const pageCount = Math.max(1, Math.ceil(availableMeals.length / PAGE_SIZE));
  const collection = (
    <article aria-label="Cookbook collection" className="rb-collection">
      <header><p className="rb-kicker">My cookbook</p><h1>Our Family Favourites</h1></header>
      <div role="group" aria-label="Cookbook shelves" className="rb-shelves">
        <button type="button" aria-pressed={shelf === "all"} onClick={() => setShelf("all")}>All</button>
        {BROWSABLE_SHELVES.map((item) => <button key={item} type="button" aria-pressed={shelf === item} onClick={() => setShelf(item)}>{SHELF_LABELS[item]}</button>)}
      </div>
      {isLoading && <p>Loading recipes…</p>}
      {isError && <p role="alert">We couldn’t load the cookbook. <button type="button" onClick={() => refetch()}>Try again</button></p>}
      {!isLoading && !isError && visibleMeals.length === 0 && <p>No recipes match this shelf and search.</p>}
      <ul className="rb-recipe-grid">{visibleMeals.map((meal) => <li key={meal.id}><button type="button" aria-label={`Open recipe ${meal.name}`} aria-pressed={selectedMeal?.id === meal.id} onClick={() => selectMeal(meal)}>{meal.imageUrl ? <img src={meal.imageUrl} alt="" /> : <span className="rb-thumb-placeholder" aria-hidden="true">✦</span>}<span>{meal.name}</span></button></li>)}</ul>
      <nav aria-label="Cookbook pages" className="rb-page-nav"><button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>‹ Previous</button><span>{page + 1} / {pageCount}</span><button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage((value) => value + 1)}>Next ›</button></nav>
      <section aria-label="Create or import a recipe" className="rb-create"><strong>Create your own</strong><button type="button" onClick={() => setCreateOpen(true)}>Create recipe</button><button type="button" onClick={() => navigate("/import-recipe")}>Import recipe</button></section>
      <label className="rb-search"><span>Search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Recipe or ingredient…" aria-label="Search recipes" /></label>
    </article>
  );
  const recipe = <RecipePage meal={selectedMeal} onRead={() => selectedMeal && navigate(`/meals/${selectedMeal.id}`)} onPlanner={() => setPlannerOpen(true)} />;
  return <main aria-label="The Healthy Apples cookbook" data-realm="cookbook"><RealBookStage collectionPage={collection} recipePage={recipe} mobilePage={mobilePage} onMobilePageChange={setMobilePage} /><CreateMealModal open={createOpen} onOpenChange={setCreateOpen} /><AddToPlannerDialog mealId={selectedMeal?.id ?? 0} mealName={selectedMeal?.name ?? "recipe"} isDrink={selectedMeal?.isDrink ?? false} audience={selectedMeal?.audience ?? "adult"} open={plannerOpen && !!selectedMeal} onOpenChange={setPlannerOpen} /></main>;
}
