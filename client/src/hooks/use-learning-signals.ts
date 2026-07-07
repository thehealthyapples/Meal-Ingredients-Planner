// IA2 — Dormant Capability Activation: Evidence & Learning's first real
// consumer.
//
// The ONE client-side owner of the Learning Signal read + resolve calls
// against the platform's already-registered `evidence-learning` capability
// (EL1/EL2). Every field this hook returns is a verbatim projection of what
// GET /api/intelligence/learning-signals already returned — this hook owns no
// intelligence of its own, exactly mirroring use-food-opportunities.ts's own
// stated discipline.
//
// A "signal" here is a Pattern (EL2 §3 glossary): something the platform has
// noticed from repeated, consistent household evidence — never from a single
// observation (EL1's own ET1/ET2 rules) — and never treated as understood
// until this household explicitly confirms or declines it.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface LearningSignal {
  readonly id: number;
  readonly domain: string;
  readonly subjectType: string;
  readonly subjectKey: string;
  readonly direction: "positive" | "negative" | "neutral";
  readonly evidenceCount: number;
  readonly confidence: "low" | "medium" | "high";
  readonly rationale: string;
  readonly status: "pending_confirmation" | "confirmed" | "declined";
}

export interface LearningSignalsData {
  readonly resolved: boolean;
  readonly signals: readonly LearningSignal[];
  readonly message?: string;
}

export type LearningSignalDecision = "confirm" | "decline";

const QUERY_KEY = ["/api/intelligence/learning-signals"] as const;

async function fetchLearningSignals(): Promise<LearningSignalsData> {
  const res = await fetch("/api/intelligence/learning-signals", {
    credentials: "include",
  });
  // An unauthenticated or otherwise-gapped caller is an honest empty state,
  // never a thrown error surfaced to a page that may render before auth
  // settles.
  if (res.status === 401) {
    return { resolved: false, signals: [] };
  }
  if (!res.ok) throw new Error("Failed to load learning signals");
  return res.json();
}

/** Removes one signal from an already-cached list — used after a confirmed/declined decision so the UI reflects the resolution immediately, without waiting on a second round trip. Only ever reflects a decision the server has already confirmed. */
function withoutSignal(
  data: LearningSignalsData | undefined,
  signalId: number,
): LearningSignalsData | undefined {
  if (!data) return data;
  return {
    ...data,
    signals: data.signals.filter((s) => s.id !== signalId),
  };
}

export function useLearningSignals(enabled = true) {
  const queryClient = useQueryClient();

  const query = useQuery<LearningSignalsData>({
    queryKey: QUERY_KEY,
    queryFn: fetchLearningSignals,
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const decide = useMutation({
    mutationFn: async ({
      signal,
      decision,
    }: {
      signal: LearningSignal;
      decision: LearningSignalDecision;
    }) => {
      const res = await apiRequest(
        "POST",
        `/api/intelligence/learning-signals/${signal.id}/${decision}`,
        {},
      );
      return res.json() as Promise<{ resolved: boolean }>;
    },
    onSuccess: (result, { signal }) => {
      // Both confirm and decline are terminal — either way the Pattern leaves
      // the pending list immediately once the server has confirmed it.
      if (result.resolved) {
        queryClient.setQueryData<LearningSignalsData>(QUERY_KEY, (prev) =>
          withoutSignal(prev, signal.id),
        );
      }
    },
  });

  return {
    data: query.data,
    isPending: query.isPending,
    isDeciding: decide.isPending,
    confirm: (s: LearningSignal) => decide.mutate({ signal: s, decision: "confirm" }),
    decline: (s: LearningSignal) => decide.mutate({ signal: s, decision: "decline" }),
  };
}
