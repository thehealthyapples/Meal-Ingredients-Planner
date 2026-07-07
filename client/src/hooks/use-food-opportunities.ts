// FI5 — Food Intelligence UI Activation.
//
// The ONE client-side owner of the Food Opportunity read + resolve calls
// against the platform's already-registered `opportunity-delivery` capability
// (OD1). Every consuming surface (Dashboard, Planner, Cookbook, Pantry) shares
// this hook and its query key, so TanStack Query dedupes the fetch across
// surfaces the same way PlannerIntelligenceStrip already dedupes against
// PlannerIntelligenceCompanion — no surface re-derives its own copy of the
// bundle or the resolve logic.
//
// This hook owns no intelligence: every field it returns is a verbatim
// projection of what GET /api/intelligence/food-opportunities already
// returned (which is itself a verbatim projection of OD1's own bundle).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface FoodOpportunityEvidence {
  readonly source: string;
  readonly detail: string;
}

export interface FoodOpportunity {
  readonly id: string;
  readonly capabilityId: string;
  readonly domain: string;
  readonly type: string;
  readonly priority: "high" | "medium" | "low";
  readonly explanation: string;
  readonly evidence: readonly FoodOpportunityEvidence[];
  readonly suggestedAction: string;
  readonly surface: string;
}

export interface FoodOpportunitiesData {
  readonly resolved: boolean;
  readonly opportunities: readonly FoodOpportunity[];
  readonly grouped: Readonly<Record<string, readonly FoodOpportunity[]>>;
  readonly message?: string;
}

export type FoodOpportunityResolution = "acknowledge" | "accept" | "dismiss";

const QUERY_KEY = ["/api/intelligence/food-opportunities"] as const;

async function fetchFoodOpportunities(): Promise<FoodOpportunitiesData> {
  const res = await fetch("/api/intelligence/food-opportunities", {
    credentials: "include",
  });
  // An unauthenticated or otherwise-gapped caller is an honest empty state,
  // never a thrown error surfaced to a page that may render before auth
  // settles.
  if (res.status === 401) {
    return { resolved: false, opportunities: [], grouped: {} };
  }
  if (!res.ok) throw new Error("Failed to load food opportunities");
  return res.json();
}

/**
 * Removes one opportunity from an already-cached bundle (both the flat list
 * and its domain group) — used after a successful accept/dismiss so the UI
 * reflects the resolution immediately, without waiting on a second network
 * round trip. This only ever reflects a resolution the server has already
 * confirmed (the mutation's own `onSuccess`), never an optimistic guess.
 */
function withoutOpportunity(
  data: FoodOpportunitiesData | undefined,
  opportunityId: string,
): FoodOpportunitiesData | undefined {
  if (!data) return data;
  const grouped: Record<string, readonly FoodOpportunity[]> = {};
  for (const [domain, items] of Object.entries(data.grouped)) {
    grouped[domain] = items.filter((o) => o.id !== opportunityId);
  }
  return {
    ...data,
    opportunities: data.opportunities.filter((o) => o.id !== opportunityId),
    grouped,
  };
}

export function useFoodOpportunities(enabled = true) {
  const queryClient = useQueryClient();

  const query = useQuery<FoodOpportunitiesData>({
    queryKey: QUERY_KEY,
    queryFn: fetchFoodOpportunities,
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const resolve = useMutation({
    mutationFn: async ({
      opportunity,
      action,
    }: {
      opportunity: FoodOpportunity;
      action: FoodOpportunityResolution;
    }) => {
      const res = await apiRequest(
        "POST",
        `/api/intelligence/food-opportunities/${encodeURIComponent(opportunity.id)}/${action}`,
        { domain: opportunity.domain, type: opportunity.type },
      );
      return res.json() as Promise<{ resolved: boolean }>;
    },
    onSuccess: (result, { opportunity, action }) => {
      // "Acknowledge" is non-terminal (still delivered on future reports) —
      // only accept/dismiss remove it from the visible bundle immediately.
      if (result.resolved && (action === "accept" || action === "dismiss")) {
        queryClient.setQueryData<FoodOpportunitiesData>(QUERY_KEY, (prev) =>
          withoutOpportunity(prev, opportunity.id),
        );
      }
    },
  });

  return {
    data: query.data,
    isPending: query.isPending,
    isResolving: resolve.isPending,
    acknowledge: (o: FoodOpportunity) =>
      resolve.mutate({ opportunity: o, action: "acknowledge" }),
    accept: (o: FoodOpportunity) =>
      resolve.mutate({ opportunity: o, action: "accept" }),
    dismiss: (o: FoodOpportunity) =>
      resolve.mutate({ opportunity: o, action: "dismiss" }),
  };
}
