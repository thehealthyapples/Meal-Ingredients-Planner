import { useState } from "react";
import { AlertTriangle, ShieldAlert, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import type { RestrictionSafetyResult, RestrictionSafetyStatus } from "@shared/restrictions/restriction-safety";

const SECTION_LABEL = "text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground/70";

// ─── Grouping ─────────────────────────────────────────────────────────────────
//
// The underlying computation emits one result per (restriction × matched ingredient)
// pair. We collapse these into one entry per (eater × restriction) so the panel
// shows: one section per person, one bullet per restriction type.

interface EaterGroup {
  eaterName: string;
  /** Worst status across all restrictions for this eater. */
  overallStatus: RestrictionSafetyStatus;
  restrictions: RestrictionEntry[];
}

interface RestrictionEntry {
  restrictionId: string;
  restrictionName: string;
  status: RestrictionSafetyStatus;
  /** All ingredient strings that triggered this restriction for this eater. */
  matchedIngredients: string[];
}

function groupByEater(results: RestrictionSafetyResult[]): EaterGroup[] {
  // eaterName → restrictionId → RestrictionEntry
  const eaterMap = new Map<string, Map<string, RestrictionEntry>>();

  for (const result of results) {
    for (const eater of result.affectedEaters) {
      if (!eaterMap.has(eater)) eaterMap.set(eater, new Map());
      const restrMap = eaterMap.get(eater)!;

      if (!restrMap.has(result.restrictionId)) {
        restrMap.set(result.restrictionId, {
          restrictionId: result.restrictionId,
          restrictionName: result.restrictionName,
          status: result.status,
          matchedIngredients: [],
        });
      }

      const entry = restrMap.get(result.restrictionId)!;
      if (!entry.matchedIngredients.includes(result.matchedIngredient)) {
        entry.matchedIngredients.push(result.matchedIngredient);
      }
      // Escalate: unsafe beats warning
      if (result.status === "unsafe") entry.status = "unsafe";
    }
  }

  return Array.from(eaterMap.entries()).map(([eaterName, restrMap]) => {
    const restrictions = Array.from(restrMap.values());
    const overallStatus: RestrictionSafetyStatus = restrictions.some(r => r.status === "unsafe")
      ? "unsafe"
      : "warning";
    return { eaterName, overallStatus, restrictions };
  });
}

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

function EaterCard({
  group,
  expanded,
  onToggle,
}: {
  group: EaterGroup;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isUnsafe = group.overallStatus === "unsafe";

  return (
    <div
      className={`rounded-lg border ${
        isUnsafe
          ? "border-red-300/70 dark:border-red-700/40 bg-red-50 dark:bg-red-950/20"
          : "border-amber-200/70 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20"
      }`}
      data-testid={`restriction-eater-${group.eaterName.toLowerCase().replace(/\s+/g, "-")}`}
    >
      {/* ── Header row: eater name + restriction names + expand toggle ── */}
      <div className="flex items-start justify-between gap-2 px-3.5 pt-3 pb-2.5">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          {isUnsafe
            ? <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            : <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />}
          <div className="min-w-0">
            <p className={`text-sm font-semibold leading-snug ${
              isUnsafe ? "text-red-800 dark:text-red-300" : "text-amber-800 dark:text-amber-300"
            }`}>
              {group.eaterName}
            </p>
            <ul className="mt-1 space-y-0.5">
              {group.restrictions.map(r => (
                <li
                  key={r.restrictionId}
                  className={`text-xs flex items-center gap-1.5 ${
                    r.status === "unsafe"
                      ? "text-red-700 dark:text-red-400"
                      : "text-amber-700 dark:text-amber-400"
                  }`}
                >
                  <span className="opacity-50 shrink-0">·</span>
                  {r.restrictionName}
                  {r.status === "unsafe" && (
                    <span className="text-[10px] text-red-600/70 dark:text-red-400/60 font-medium">needs review</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Expand toggle — shows matched ingredient evidence */}
        <button
          onClick={onToggle}
          className="shrink-0 mt-0.5 p-0.5 rounded text-muted-foreground/60 hover:text-muted-foreground transition-colors touch-manipulation"
          aria-label={expanded ? "Hide matched ingredients" : "Show matched ingredients"}
          data-testid={`restriction-eater-toggle-${group.eaterName.toLowerCase().replace(/\s+/g, "-")}`}
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* ── Expanded: matched ingredient detail per restriction ── */}
      {expanded && (
        <div
          className={`px-3.5 pb-3 space-y-2 border-t ${
            isUnsafe ? "border-red-200/50 dark:border-red-800/30" : "border-amber-200/50 dark:border-amber-800/30"
          }`}
          data-testid={`restriction-eater-detail-${group.eaterName.toLowerCase().replace(/\s+/g, "-")}`}
        >
          {group.restrictions.map(r => (
            <div key={r.restrictionId} className="pt-2">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                {r.restrictionName} — detected
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Matched: {r.matchedIngredients.join(", ")}
              </p>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground/50 leading-snug pt-1">
            Detection is based on ingredient name matching. Always verify labels for allergens.
            This is not medical advice.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface RestrictionSafetyPanelProps {
  results: RestrictionSafetyResult[];
  hasRestrictionsConfigured: boolean;
}

export default function RestrictionSafetyPanel({
  results,
  hasRestrictionsConfigured,
}: RestrictionSafetyPanelProps) {
  const [expandedEaters, setExpandedEaters] = useState<Set<string>>(new Set());

  if (!hasRestrictionsConfigured) return null;

  const groups = groupByEater(results);

  function toggleEater(name: string) {
    setExpandedEaters(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <div className="space-y-3" data-testid="restriction-safety-panel">
      <p className={SECTION_LABEL}>Restriction Safety</p>

      {groups.length === 0 ? (
        <SafeRow />
      ) : (
        <div className="space-y-2.5">
          {groups.map(group => (
            <EaterCard
              key={group.eaterName}
              group={group}
              expanded={expandedEaters.has(group.eaterName)}
              onToggle={() => toggleEater(group.eaterName)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
