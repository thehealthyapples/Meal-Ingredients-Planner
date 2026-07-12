import { useQuery } from "@tanstack/react-query";
import type { MealSummary } from "@shared/schema";

export const MEALS_SUMMARY_KEY = "/api/meals/summary";

export function useMealsSummary() {
  // PX1-W0: `isError` and `refetch` are exposed because a consumer that cannot see
  // the failure has no choice but to render the absence — which is how the Dashboard
  // came to tell every household their cookbook was empty whenever this call failed.
  const { data: meals, isLoading, isError, refetch } = useQuery<MealSummary[]>({
    queryKey: [MEALS_SUMMARY_KEY],
    queryFn: async () => {
      const res = await fetch(MEALS_SUMMARY_KEY);
      if (!res.ok) throw new Error("Failed to fetch meals summary");
      return res.json();
    },
  });

  return { meals, isLoading, isError, refetch };
}
