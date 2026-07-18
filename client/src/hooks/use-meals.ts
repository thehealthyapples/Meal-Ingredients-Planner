import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MEALS_SUMMARY_KEY } from "@/hooks/use-meals-summary";
import type { InsertMeal, Meal } from "@shared/schema";

/**
 * PX1-W3 (fnd-px-meals-invalidation-storm) — the ONE way to say "the meal
 * library changed".
 *
 * The library lives in two caches: the full rows (`/api/meals` — ingredients
 * and instructions included, needed by the Cookbook's search and the Planner)
 * and the slim summary (`/api/meals/summary` — what Home and the Dashboard
 * render). Before this owner existed, 30+ call sites invalidated the full key
 * only, so the summary caches were never told the library had changed — and
 * every surface reading them showed stale meal names until a hard reload.
 *
 * Call sites must not invalidate either key directly; they call this.
 */
export function invalidateMealLibrary(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: [api.meals.list.path] });
  qc.invalidateQueries({ queryKey: [MEALS_SUMMARY_KEY] });
  // RM4: newly saved products appear in the Planner's ready-meal library
  qc.invalidateQueries({ queryKey: ["/api/planner/ready-meal-library"] });
}

export function useMeals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // PROD1 — `isError`/`refetch` surfaced to consumers. Without them the Cookbook
  // renders NOTHING on a failed load: `meals` stays undefined, every downstream
  // guard is written `filteredMeals?.length`, and the grid, the "show more" and
  // the empty state all fail their optional-chain together — leaving white space
  // under the header that is indistinguishable from a slow load. The household is
  // given no message, no retry, and no way to tell the two apart.
  const { data: meals, isPending: isLoading, isError, refetch } = useQuery<Meal[]>({
    queryKey: [api.meals.list.path],
  });

  const createMeal = useMutation({
    mutationFn: async (meal: InsertMeal & { nutrition?: Record<string, string | null | undefined> }) => {
      const res = await apiRequest("POST", api.meals.create.path, meal);
      return res.json() as Promise<Meal>;
    },
    onSuccess: (newMeal) => {
      // Immediately insert the new meal into the cached list so it appears
      // in the UI without waiting for the background refetch to complete.
      queryClient.setQueryData<Meal[]>([api.meals.list.path], (prev) =>
        prev ? [...prev, newMeal] : [newMeal]
      );
      // Force an immediate server refetch to ensure the list is fully up-to-date.
      invalidateMealLibrary(queryClient);
      toast({ title: "Recipe added" });
    },
    onError: () => {
      toast({ title: "Couldn't add recipe", description: "Something went wrong - try again", variant: "destructive" });
    },
  });

  const deleteMeal = useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.meals.delete.path, { id });
      await apiRequest("DELETE", url);
    },
    onSuccess: () => {
      invalidateMealLibrary(queryClient);
      toast({ title: "Recipe removed" });
    },
    onError: () => {
      toast({ title: "Couldn't remove recipe", description: "Something went wrong - try again", variant: "destructive" });
    },
  });

  return {
    meals,
    isLoading,
    isError,
    refetch,
    createMeal,
    deleteMeal,
  };
}
