// IA1 (Platform Intelligence Activation, Wave 1).
//
// The ONE client-side owner of the Companion Greeting read. Every field
// returned here is a verbatim projection of what
// GET /api/intelligence/companion/greeting already computed (a thin wrapper
// over server/intelligence/conversation/behaviour-engine.ts's buildGreeting —
// itself fully built by EWO2 but, until this hook, never called from any
// client surface). This hook performs no selection or rewording of its own.

import { useQuery } from "@tanstack/react-query";

export interface CompanionGreetingData {
  readonly text: string;
}

const QUERY_KEY = ["/api/intelligence/companion/greeting"] as const;

async function fetchCompanionGreeting(): Promise<CompanionGreetingData> {
  const res = await fetch("/api/intelligence/companion/greeting", {
    credentials: "include",
  });
  // An unauthenticated caller is an honest empty state, never a thrown error
  // surfaced to a component that may render before auth settles.
  if (res.status === 401) return { text: "" };
  if (!res.ok) throw new Error("Failed to load companion greeting");
  return res.json();
}

export function useCompanionGreeting(enabled = true) {
  return useQuery<CompanionGreetingData>({
    queryKey: QUERY_KEY,
    queryFn: fetchCompanionGreeting,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
