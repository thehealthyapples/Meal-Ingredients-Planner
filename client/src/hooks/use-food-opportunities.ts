// FI5 — Food Intelligence UI Activation.
//
// The ONE client-side owner of the Food Opportunity read
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

import { useQuery } from "@tanstack/react-query";
import type { AttentionLevel } from "@shared/attention/index";

export interface FoodOpportunityEvidence {
  readonly source: string;
  readonly detail: string;
}

/**
 * PHASE5E — the canonical entity this opportunity is about, verbatim from the producer
 * that already knew it. The presentation layer does NOT parse it, key on it, or fetch it;
 * it exists so a card can ask the Companion "explain THIS one" without reverse-engineering
 * the producer's prose to work out what "this one" is. Optional, because a future producer
 * may name none — and a card with no subject simply cannot be explained, which is an
 * honest gap rather than a defect.
 */
export interface FoodOpportunitySubject {
  readonly entity: string;
  readonly id: number;
  readonly label: string;
}

export interface FoodOpportunity {
  readonly id: string;
  readonly capabilityId: string;
  readonly domain: string;
  readonly type: string;
  readonly priority: AttentionLevel;
  readonly explanation: string;
  readonly evidence: readonly FoodOpportunityEvidence[];
  readonly suggestedAction: string;
  readonly surface: string;
  readonly subject?: FoodOpportunitySubject;
}

export interface FoodOpportunitiesData {
  readonly resolved: boolean;
  readonly opportunities: readonly FoodOpportunity[];
  readonly grouped: Readonly<Record<string, readonly FoodOpportunity[]>>;
  readonly message?: string;
}

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

// UX3 — read-only. The accept/dismiss/acknowledge resolve mutation existed for
// the ambient cards, which no longer exist: the household answers the Decision
// Engine through the Companion now. The bundle is still read, because Home still
// phrases from it.
export function useFoodOpportunities(enabled = true) {
  const query = useQuery<FoodOpportunitiesData>({
    queryKey: QUERY_KEY,
    queryFn: fetchFoodOpportunities,
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: query.data,
    isPending: query.isPending,
  };
}
