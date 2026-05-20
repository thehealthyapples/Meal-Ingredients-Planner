import { useState, useMemo, useRef, useEffect } from "react";
import type { Meal } from "@shared/schema";
import { scoreMealSearch } from "@shared/food-synonyms";

// ── Canonical web recipe type (superset of both panel variants) ───────────────
export interface WebSearchRecipe {
  id: string;
  name: string;
  image: string;
  url: string | null;
  category?: string | null;
  cuisine?: string | null;
  ingredients: string[];
  instructions?: string[];
  source?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SEARCH_WEB_KEY = "planner:search-web";
const PREMIUM_MARKER = "This is a premium piece of content available to subscribed users.";
const WEB_RESULT_LIMIT = 15;
const WEB_DEBOUNCE_MS = 400;
const MIN_WEB_QUERY_LENGTH = 2;

// ── sessionStorage helpers (safe in restricted environments) ──────────────────

function loadWebPref(): boolean {
  try { return sessionStorage.getItem(SEARCH_WEB_KEY) === "1"; } catch { return false; }
}

function saveWebPref(value: boolean): void {
  try { sessionStorage.setItem(SEARCH_WEB_KEY, value ? "1" : "0"); } catch {}
}

// ── Public types ──────────────────────────────────────────────────────────────

export type PlannerMealFilterMode = "all" | "cookbook" | "planner" | "ready";

export interface UsePlannerMealSearchOptions {
  /** Meal pool to filter locally. */
  meals: Meal[];
  /** Current search query string. */
  query: string;
  /** Source-type filter tab. Defaults to "all". */
  filterMode?: PlannerMealFilterMode;
  /** Required when filterMode === "planner". */
  plannerMealIdSet?: Set<number>;
  /** Exclude planner-placeholder entries from local results. Default true. */
  excludePlaceholders?: boolean;
  /** Exclude ready-meal entries from local results. Default false. */
  excludeReadyMeals?: boolean;
  /** Exclude drink entries from local results. Default false. */
  excludeDrinks?: boolean;
  /** Maximum local results returned. Default 100. */
  limit?: number;
  /** Activate the web recipe fetch path. Default false. */
  enableWebSearch?: boolean;
}

export interface UsePlannerMealSearchResult {
  /** Local cookbook results, scored with scoreMealSearch and filtered. */
  filteredMeals: Meal[];
  /** Web recipe results (empty when includeWeb is false or enableWebSearch is false). */
  webResults: WebSearchRecipe[];
  /** True while a web fetch is in-flight. */
  webLoading: boolean;
  /** Whether the user has opted into web search this session. */
  includeWeb: boolean;
  /** Toggle or set includeWeb. Persists to sessionStorage automatically. */
  setIncludeWeb: (v: boolean) => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePlannerMealSearch({
  meals,
  query,
  filterMode = "all",
  plannerMealIdSet,
  excludePlaceholders = true,
  excludeReadyMeals = false,
  excludeDrinks = false,
  limit = 100,
  enableWebSearch = false,
}: UsePlannerMealSearchOptions): UsePlannerMealSearchResult {
  // includeWeb: session-persisted, default OFF (cookbook-first, explicit opt-in)
  const [includeWeb, setIncludeWebState] = useState<boolean>(loadWebPref);
  const [webResults, setWebResults] = useState<WebSearchRecipe[]>([]);
  const [webLoading, setWebLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Persist to sessionStorage on every change
  const setIncludeWeb = (v: boolean) => {
    saveWebPref(v);
    setIncludeWebState(v);
  };

  // ── Web fetch orchestration ──────────────────────────────────────────────────
  // Aborts previous in-flight request on query/toggle change.
  // 400 ms debounce guards against fetch storms during typing.
  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    if (!enableWebSearch || !includeWeb) {
      setWebResults([]);
      setWebLoading(false);
      return;
    }
    const q = query.trim();
    if (q.length < MIN_WEB_QUERY_LENGTH) {
      setWebResults([]);
      setWebLoading(false);
      return;
    }

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let active = true;

    const timer = setTimeout(async () => {
      setWebLoading(true);
      try {
        const res = await fetch(`/api/search-recipes?q=${encodeURIComponent(q)}&page=1`, {
          signal: ctrl.signal,
          credentials: "include",
        });
        if (!res.ok || !active) return;
        const data: { recipes: WebSearchRecipe[] } = await res.json();
        const filtered = (data.recipes ?? []).filter(r => {
          const allText = [r.name, ...(r.ingredients ?? []), ...(r.instructions ?? [])].join("\0");
          return !allText.includes(PREMIUM_MARKER);
        });
        if (active) setWebResults(filtered.slice(0, WEB_RESULT_LIMIT));
      } catch (err: unknown) {
        if ((err as { name?: string })?.name === "AbortError" || !active) return;
      } finally {
        if (active) setWebLoading(false);
      }
    }, WEB_DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query, includeWeb, enableWebSearch]);

  // ── Local meal filtering ─────────────────────────────────────────────────────
  // Uses scoreMealSearch for synonym-aware ranking when a query is present.
  const filteredMeals = useMemo(() => {
    if (meals.length === 0) return [];

    let result = meals;

    if (excludePlaceholders) {
      result = result.filter(
        m => (m as { mealSourceType?: string }).mealSourceType !== "planner-placeholder",
      );
    }
    if (excludeReadyMeals) {
      result = result.filter(m => !m.isReadyMeal);
    }
    if (excludeDrinks) {
      result = result.filter(m => !m.isDrink);
    }

    if (filterMode === "cookbook") {
      result = result.filter(
        m => !m.isReadyMeal && !(m as { isSystemMeal?: boolean }).isSystemMeal,
      );
    } else if (filterMode === "planner" && plannerMealIdSet) {
      result = result.filter(m => plannerMealIdSet.has(m.id));
    } else if (filterMode === "ready") {
      result = result.filter(m => m.isReadyMeal);
    }

    if (query.trim()) {
      const scored = result
        .map(m => ({ m, score: scoreMealSearch({ name: m.name, ingredients: m.ingredients }, query.trim()) }))
        .filter(({ score }) => score > 0);
      scored.sort((a, b) => b.score - a.score);
      result = scored.map(({ m }) => m);
    } else if (filterMode === "all") {
      // Without a query, deprioritise ready meals so cookbook recipes lead
      const nonReady = result.filter(m => !m.isReadyMeal);
      const ready = result.filter(m => m.isReadyMeal);
      result = [...nonReady, ...ready];
    }

    return result.slice(0, limit);
  }, [meals, query, filterMode, plannerMealIdSet, excludePlaceholders, excludeReadyMeals, excludeDrinks, limit]);

  return { filteredMeals, webResults, webLoading, includeWeb, setIncludeWeb };
}
