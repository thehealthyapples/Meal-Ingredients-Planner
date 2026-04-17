import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InsertMeal, Meal } from "@shared/schema";

export function useMeals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: meals, isLoading } = useQuery<Meal[]>({
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
      queryClient.refetchQueries({ queryKey: [api.meals.list.path] });
      toast({ title: "Recipe added" });
    },
    onError: () => {
      toast({ title: "Couldn't add recipe", description: "Something went wrong — try again", variant: "destructive" });
    },
  });

  const deleteMeal = useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.meals.delete.path, { id });
      await apiRequest("DELETE", url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
      toast({ title: "Recipe removed" });
    },
    onError: () => {
      toast({ title: "Couldn't remove recipe", description: "Something went wrong — try again", variant: "destructive" });
    },
  });

  return {
    meals,
    isLoading,
    createMeal,
    deleteMeal,
  };
}
