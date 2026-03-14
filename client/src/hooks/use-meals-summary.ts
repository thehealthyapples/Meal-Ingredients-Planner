import { useQuery } from "@tanstack/react-query";
import type { MealSummary } from "@shared/schema";

export const MEALS_SUMMARY_KEY = "/api/meals/summary";

export function useMealsSummary() {
  const { data: meals, isLoading } = useQuery<MealSummary[]>({
    queryKey: [MEALS_SUMMARY_KEY],
    queryFn: async () => {
      const res = await fetch(MEALS_SUMMARY_KEY);
      if (!res.ok) throw new Error("Failed to fetch meals summary");
      return res.json();
    },
  });

  return { meals, isLoading };
}
