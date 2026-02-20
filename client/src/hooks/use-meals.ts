import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { InsertMeal, Meal } from "@shared/schema";

export function useMeals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: meals, isLoading } = useQuery<Meal[]>({
    queryKey: [api.meals.list.path],
    queryFn: async () => {
      const res = await fetch(api.meals.list.path);
      if (!res.ok) throw new Error("Failed to fetch meals");
      return res.json();
    },
  });

  const createMeal = useMutation({
    mutationFn: async (meal: InsertMeal & { nutrition?: Record<string, string | null | undefined> }) => {
      const res = await fetch(api.meals.create.path, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meal),
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          throw new Error("Invalid meal data");
        }
        throw new Error("Failed to create meal");
      }
      return res.json() as Promise<Meal>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
      toast({ title: "Success", description: "Meal added to your collection." });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const deleteMeal = useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.meals.delete.path, { id });
      const res = await fetch(url, { 
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error("Failed to delete meal");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
      toast({ title: "Deleted", description: "Meal removed successfully." });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  return {
    meals,
    isLoading,
    createMeal,
    deleteMeal,
  };
}
