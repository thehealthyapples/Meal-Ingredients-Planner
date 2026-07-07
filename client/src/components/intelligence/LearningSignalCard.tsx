// IA2 — Dormant Capability Activation: Learning Signal card.
//
// Renders ONE pending Pattern from the `evidence-learning` capability
// (EL1/EL2) using the same visual language as every other card in this
// system. Owns no intelligence — `rationale` is rendered verbatim, never
// rephrased or re-derived, per EL1's ET6 explainability rule.
//
// Copy follows EL2's own canonical user-facing glossary (§3): a pending
// signal is "something we've noticed"; confirming is "yes, that's right";
// declining is "no, that's not right". The two buttons are the Pattern's
// own confirmation resolution (EL1's approve/delete verbs) — never an
// autonomous action, and never a change to any household preference itself
// (that remains a separate, human-triggered write elsewhere, per EL1's own
// hard boundary).

import { Check, Lightbulb, X } from "lucide-react";
import { IntelligenceCard } from "./IntelligenceCard";
import { subtleText } from "./intelligence-tokens";
import type { LearningSignal } from "@/hooks/use-learning-signals";

const CONFIDENCE_LABEL: Record<LearningSignal["confidence"], string> = {
  low: "Just noticed",
  medium: "Fairly sure",
  high: "Confident",
};

interface LearningSignalCardProps {
  signal: LearningSignal;
  onConfirm?: (signal: LearningSignal) => void;
  onDecline?: (signal: LearningSignal) => void;
  busy?: boolean;
  className?: string;
  "data-testid"?: string;
}

export function LearningSignalCard({
  signal,
  onConfirm,
  onDecline,
  busy,
  className,
  ...rest
}: LearningSignalCardProps) {
  // Nothing to explain → say nothing. Never invent a pattern's rationale.
  if (!signal?.rationale) return null;

  const testId = rest["data-testid"] ?? "learning-signal-card";

  return (
    <IntelligenceCard
      icon={<Lightbulb className="h-4 w-4" />}
      eyebrow={CONFIDENCE_LABEL[signal.confidence] ?? "Something we've noticed"}
      body={signal.rationale}
      className={className}
      data-testid={testId}
    >
      <p className={subtleText} data-testid={`${testId}-evidence-count`}>
        Based on the last {signal.evidenceCount} times.
      </p>

      {(onConfirm || onDecline) && (
        <div className="flex items-center gap-3 pt-0.5">
          {onConfirm && (
            <button
              type="button"
              onClick={() => onConfirm(signal)}
              disabled={busy}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
              data-testid={`${testId}-confirm`}
            >
              <Check className="h-3 w-3" /> Yes, that's right
            </button>
          )}
          {onDecline && (
            <button
              type="button"
              onClick={() => onDecline(signal)}
              disabled={busy}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
              data-testid={`${testId}-decline`}
            >
              <X className="h-3 w-3" /> No, that's not right
            </button>
          )}
        </div>
      )}
    </IntelligenceCard>
  );
}
