// EWX1 — Living Companion Experience, Stage 1/7.
//
// The ONE client-side owner of the Companion Observation read. Every field
// returned here is a verbatim projection of what
// GET /api/intelligence/companion/observations already computed (which is
// itself a thin, read-only wrapper over existing platform intelligence —
// see server/intelligence/conversation/observation-engine.ts). This hook
// performs no filtering, ranking or rewording of its own — Silence Rules and
// personality voicing are both already applied server-side.

import { useQuery } from "@tanstack/react-query";
import type { InteractionKind } from "@shared/companion-interaction";

export interface CompanionObservation {
  readonly category: string;
  readonly interactionKind: InteractionKind;
  readonly priority: "high" | "medium" | "low";
  readonly text: string;
}

export interface CompanionObservationsData {
  readonly observations: readonly CompanionObservation[];
}

const QUERY_KEY = ["/api/intelligence/companion/observations"] as const;

async function fetchCompanionObservations(): Promise<CompanionObservationsData> {
  const res = await fetch("/api/intelligence/companion/observations", {
    credentials: "include",
  });
  // An unauthenticated caller is an honest empty state, never a thrown error
  // surfaced to a component that may render before auth settles.
  if (res.status === 401) return { observations: [] };
  if (!res.ok) throw new Error("Failed to load companion observations");
  return res.json();
}

export function useCompanionObservations(enabled = true) {
  return useQuery<CompanionObservationsData>({
    queryKey: QUERY_KEY,
    queryFn: fetchCompanionObservations,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
