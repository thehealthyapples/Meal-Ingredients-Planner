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

import { useMemo } from "react";
import { useLearningSignals } from "@/hooks/use-learning-signals";
import { LearningSignalCard } from "@/components/intelligence/LearningSignalCard";

export interface LearningSignalsPanelProps {
  /** Max signals to show at once. */
  limit?: number;
  className?: string;
  "data-testid"?: string;
}

export default function LearningSignalsPanel({
  limit = 3,
  className,
  ...rest
}: LearningSignalsPanelProps) {
  const { data, isPending, isDeciding, confirm, decline } = useLearningSignals();

  const items = useMemo(() => {
    if (!data?.resolved) return [];
    return data.signals.slice(0, limit);
  }, [data, limit]);

  // No layout shift while the first fetch is in flight, and an honestly
  // empty household (no patterns cleared the evidence bar yet) shows nothing
  // — never an empty-state placeholder implying something is missing.
  if (isPending || items.length === 0) return null;

  return (
    <div className={className} data-testid={rest["data-testid"]}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/60">
        Something we've noticed
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
