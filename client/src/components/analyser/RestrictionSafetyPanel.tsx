import { AlertTriangle, ShieldAlert, ShieldCheck, Info, ArrowRight } from "lucide-react";
import type { RestrictionSafetyResult } from "@shared/restrictions/restriction-safety";

// ─── Trust language constants ─────────────────────────────────────────────────

const SOURCE_LABEL: Record<string, string> = {
  alias: "by name",
  derived_ingredient: "derived ingredient",
  hidden_ingredient: "hidden source",
};

const SECTION_LABEL = "text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground/70";

// ─── Sub-components ───────────────────────────────────────────────────────────

function SafeRow() {
  return (
    <div
      className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200/60 dark:border-green-800/30"
      data-testid="restriction-safety-safe"
    >
      <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
      <p className="text-sm text-green-800 dark:text-green-300 leading-snug">
        No hard restriction conflicts detected for this product.
      </p>
    </div>
  );
}

function ResultCard({ result }: { result: RestrictionSafetyResult }) {
  const isUnsafe = result.status === 'unsafe';

  const eaterText = result.affectedEaters.length > 0
    ? result.affectedEaters.join(', ')
    : null;

  const sourceLabel = SOURCE_LABEL[result.matchedVia] ?? result.matchedVia;

  return (
    <div
      className={`rounded-lg border p-3.5 space-y-2.5 ${
        isUnsafe
          ? "border-red-300/70 dark:border-red-700/40 bg-red-50 dark:bg-red-950/20"
          : "border-amber-200/70 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20"
      }`}
      data-testid={`restriction-result-${result.restrictionId}`}
    >
      {/* Header row */}
      <div className="flex items-start gap-2.5">
        {isUnsafe
          ? <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          : <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug ${isUnsafe ? "text-red-800 dark:text-red-300" : "text-amber-800 dark:text-amber-300"}`}>
            {result.restrictionName} detected{isUnsafe ? " — needs review" : ""}
          </p>
          {eaterText && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Affects: {eaterText}
            </p>
          )}
        </div>
      </div>

      {/* Match detail */}
      <div className="pl-6.5 space-y-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground">Matched:</span>
          <span className="text-xs font-medium text-foreground">{result.matchedIngredient}</span>
          <span className="text-xs text-muted-foreground/60">({sourceLabel})</span>
        </div>

        {/* Substitution suggestion */}
        {result.selectedSubstitution && (
          <div className="flex items-start gap-1.5">
            <ArrowRight className="h-3 w-3 text-muted-foreground/60 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                Known alternative ingredient:{" "}
                <span className="font-medium text-foreground">{result.selectedSubstitution}</span>
              </p>
            </div>
          </div>
        )}

        {/* Rejected substitutions */}
        {result.rejectedSubstitutions.length > 0 && (
          <div className="flex items-start gap-1.5">
            <Info className="h-3 w-3 text-muted-foreground/60 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              {result.rejectedSubstitutions.map(s =>
                `${s.replacement} not suitable (conflicts with ${s.conflictingRestrictions.join(', ')})`
              ).join('; ')}
            </p>
          </div>
        )}

        {/* Conflict reason when all blocked */}
        {result.conflictReason && (
          <p className="text-xs text-red-700 dark:text-red-400 leading-snug">
            {result.conflictReason}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface RestrictionSafetyPanelProps {
  results: RestrictionSafetyResult[];
  /** Whether restriction data was available to compute results */
  hasRestrictionsConfigured: boolean;
}

export default function RestrictionSafetyPanel({
  results,
  hasRestrictionsConfigured,
}: RestrictionSafetyPanelProps) {
  // Nothing to show if no restrictions are configured in the household
  if (!hasRestrictionsConfigured) return null;

  return (
    <div className="space-y-3" data-testid="restriction-safety-panel">
      <p className={SECTION_LABEL}>Restriction Safety</p>

      {results.length === 0 ? (
        <SafeRow />
      ) : (
        <div className="space-y-2.5">
          {results.map((result, idx) => (
            <ResultCard
              key={`${result.restrictionId}-${idx}`}
              result={result}
            />
          ))}

          {/* Disclaimer */}
          <p className="text-[10px] text-muted-foreground/50 leading-snug pt-0.5" data-testid="restriction-safety-disclaimer">
            Detection is based on ingredient name matching. Always verify labels for allergens.
            This is not medical advice.
          </p>
        </div>
      )}
    </div>
  );
}
