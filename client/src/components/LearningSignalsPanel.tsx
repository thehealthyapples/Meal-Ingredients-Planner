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
// UX3 — Profile is the ONE mount again. The per-room copies (planner, pantry,
// shopping, cookbook) each opened with an eyebrow telling the household what THA
// had noticed about them — a second voice in every room. Confirming a Pattern is
// a real capability, so the panel stays; it stays in the one place that is about
// the household rather than about the room.

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
