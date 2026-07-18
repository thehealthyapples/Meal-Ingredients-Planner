// IA2 — Dormant Capability Activation: Evidence & Learning's first real
// consumer.
//
// The ONE presentation owner for surfacing the platform's pending Patterns
// (EL1's `evidence-learning` capability, `search` verb) — mirrors
// FoodOpportunitiesPanel.tsx's own structure exactly (same hook shape, same
// progressive-enrichment discipline: nothing to show → render nothing or an
// honest, quiet empty message, never a fabricated pattern).
//
// Placement: the Household section of Profile — Patterns are household-
// scoped facts (EL1's own householdId ownership), the same home
// HouseholdEatersSection/HouseholdManagementSection already occupy.
//
// HOUSE_ACT2 — Intelligence Door 1. Profile remains the household-wide home of
// every Pattern; `domains` additionally lets a ROOM show only the Patterns
// learned from behaviour that happened in that room, so a household meets its
// own learning where the behaviour occurred rather than only by visiting
// Profile. A signal's `domain` is the opportunity's `owningDomain`
// (opportunity-delivery/framework.ts:268) — the same `planner | pantry |
// shopping | cookbook` key space the rooms already scope AmbientIntelligence by.
//
// Filtering is CLIENT-SIDE and deliberately so, mirroring AmbientIntelligence
// (:85-95): one shared query key, TanStack-deduped to a single fetch across
// every mount. A per-room server query would fragment that cache into one
// request per room for a list this hook already holds in full. `domain` is
// already on every signal, so this adds no read, no route and no capability —
// it selects from what the platform already returned.

import { useMemo } from "react";
import { useLearningSignals } from "@/hooks/use-learning-signals";
import { LearningSignalCard } from "@/components/intelligence/LearningSignalCard";

export interface LearningSignalsPanelProps {
  /**
   * Restrict to Patterns learned in these domains. Omitted = every domain,
   * which is Profile's household-wide view and the existing behaviour.
   */
  domains?: readonly string[];
  /** Max signals to show at once. */
  limit?: number;
  /** Overrides the eyebrow. Rooms name the room; Profile keeps the default. */
  eyebrow?: string;
  className?: string;
  "data-testid"?: string;
}

export default function LearningSignalsPanel({
  domains,
  limit = 3,
  eyebrow = "Something we've noticed",
  className,
  ...rest
}: LearningSignalsPanelProps) {
  const { data, isPending, isDeciding, confirm, decline } = useLearningSignals();

  const items = useMemo(() => {
    if (!data?.resolved) return [];
    const scoped = domains
      ? data.signals.filter((s) => domains.includes(s.domain))
      : data.signals;
    return scoped.slice(0, limit);
  }, [data, domains, limit]);

  // No layout shift while the first fetch is in flight, and an honestly
  // empty household (no patterns cleared the evidence bar yet) shows nothing
  // — never an empty-state placeholder implying something is missing.
  if (isPending || items.length === 0) return null;

  return (
    <div className={className} data-testid={rest["data-testid"]}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/60">
        {eyebrow}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((s) => (
          <LearningSignalCard
            key={s.id}
            signal={s}
            onConfirm={confirm}
            onDecline={decline}
            busy={isDeciding}
          />
        ))}
      </div>
    </div>
  );
}
