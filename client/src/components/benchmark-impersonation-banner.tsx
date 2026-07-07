/**
 * benchmark-impersonation-banner.tsx — INTQ6 Benchmark Household World
 * =====================================================================
 * A fixed "you are impersonating a benchmark household" pill with a one-click
 * return to the original admin session. Mounted once at App level so it is
 * visible on every surface the impersonated benchmark user can reach
 * (including the onboarding redirect the cold-start household triggers).
 * Renders nothing unless the session carries an active benchmark
 * impersonation, so it has zero presence for ordinary users.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Loader2, Undo2, FlaskConical } from "lucide-react";

interface ImpersonationState {
  impersonating: boolean;
  benchmarkHouseholdId?: string;
}

export function BenchmarkImpersonationBanner() {
  const { data } = useQuery<ImpersonationState>({
    queryKey: ["/api/benchmark-impersonation"],
    queryFn: async () => {
      const res = await fetch("/api/benchmark-impersonation", { credentials: "include" });
      if (!res.ok) return { impersonating: false };
      return res.json();
    },
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const stopMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/benchmark-impersonation/stop"),
    onSuccess: () => {
      // Session is the admin again — reload straight back to the world page.
      window.location.href = "/admin/benchmark-households";
    },
  });

  if (!data?.impersonating) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 rounded-full border border-amber-400 bg-amber-50 dark:bg-amber-950 px-4 py-2 shadow-lg"
      data-testid="benchmark-impersonation-banner"
    >
      <FlaskConical className="h-4 w-4 text-amber-600" />
      <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
        Impersonating benchmark household {data.benchmarkHouseholdId}
      </span>
      <Button size="sm" variant="outline" onClick={() => stopMutation.mutate()} disabled={stopMutation.isPending}>
        {stopMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Undo2 className="h-3 w-3 mr-1" />}
        Return to admin
      </Button>
    </div>
  );
}
