// WX13 — Planner Intelligence Strip.
//
// Replaces the WeeklyPlantDiversityCounter row + PlannerIntelligenceCompanion
// four-card section with a single compact horizontal strip (~60px).
//
// Compact view: plant count + truncated intelligence summaries + expand toggle.
// Expanded view: full WeeklyPlantDiversityCounter, PlannerVarietyLegend,
//                and all intelligence cards (re-uses existing components).
//
// Architecture:
//   - Queries the SAME key as PlannerIntelligenceCompanion → zero extra requests
//     (TanStack Query deduplicates via shared cache).
//   - Plant count comes from the SERVER (see NUTPLAN1 note below).
//   - Expansion state persisted in sessionStorage for the session.
//   - No new API calls, no schema changes, no business logic.
//
// NUTPLAN1 — the weekly plant count has ONE owner, and it is the server.
//
// This component already received `weeklyProgress.plantCount` in its payload and
// then ignored it, recomputing locally with a rival dedup rule
// (`normaliseForReuse` on the raw line). The two rules do not agree: measured over
// one week of ordinary lines the canonical rule counts 7 and the local rule 9,
// because the local one treats "red onion"/"onion" and "red pepper"/"pepper" as
// four different plants. The server dedups by DIVERSITY GROUP — one group, one
// plant (SoT Domain 4 / CPI1 S1-2) — via the full canonical chain
// (`parseIngredientShared` → `singularizeIngredientKey` → `plantDiversityGroup`).
//
// The local rule was therefore overstating a household's progress toward the
// 30-plant target on the planner, which is the one number on that screen a
// household is asked to act on. It is retired here rather than left beside the
// owner (Principle 8), and its ironic comment — "so counts stay consistent across
// the UI" — retired with it.

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Leaf } from "lucide-react";
import {
  WeeklyPlantDiversityCounter,
  PlannerVarietyLegend,
} from "@/components/nutrition-variety-chips";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlannerIntelligenceData {
  weeklyProgress: {
    plantCount: number;
    mealsPlanned: number;
    daysWithMeals: number;
  } | null;
  celebration: { headline: string } | null;
  seasonalHighlight: { headline: string } | null;
  opportunity: { text: string } | null;
  householdInsight: { headline: string } | null;
}

export interface PlannerIntelligenceStripProps {
  weekId: number | null | undefined;
  weekIngredients: string[][];
  onNavigatePlantDiversity: () => void;
}

// ── Session state ─────────────────────────────────────────────────────────────

const STRIP_EXPANDED_KEY = "planner:intelligence-strip-expanded";

function readExpanded(): boolean {
  try {
    return sessionStorage.getItem(STRIP_EXPANDED_KEY) === "true";
  } catch {
    return false;
  }
}

function writeExpanded(v: boolean) {
  try {
    sessionStorage.setItem(STRIP_EXPANDED_KEY, String(v));
  } catch {}
}

// PRESENCE1: truncate() is retired with the pill row it served.
//
// The justification above was that the full text stayed available from the
// expanded panel — and UX3 subsequently removed the interpretation grid from
// that panel (see the note further down), which quietly made the justification
// false. What was left was a row of advisory sentences cut at 36 characters
// with no full text anywhere: "Looking ahead to autumn, you may…", "At its best
// in the UK summer — a…". A household could not finish reading advice they had
// not asked for, from a speaker the room does not have.
//
// UX3 ruled that the Companion owns the coaching; it retired this voice from the
// expanded panel and missed the compact row. PRESENCE1 finishes that change.

// ── Main component ─────────────────────────────────────────────────────────────

export default function PlannerIntelligenceStrip({
  weekId,
  weekIngredients,
  onNavigatePlantDiversity,
}: PlannerIntelligenceStripProps) {
  const [expanded, setExpanded] = useState(readExpanded);

  const { data } = useQuery<PlannerIntelligenceData>({
    queryKey: ["/api/planner/weeks", weekId, "intelligence"],
    queryFn: async () => {
      const res = await fetch(`/api/planner/weeks/${weekId}/intelligence`);
      if (!res.ok) throw new Error("Failed to load planner intelligence");
      return res.json();
    },
    enabled: !!weekId,
    staleTime: 5 * 60 * 1000,
  });

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    writeExpanded(next);
  };

  // The server's count, or nothing. `weeklyProgress` is null when the week holds
  // no meals, and `data` is undefined until the query resolves — in both cases THA
  // does not yet know the number, and says nothing rather than showing a 0 that
  // reads as a measured result (Core Principle 6).
  const plantCount = data?.weeklyProgress?.plantCount;

  // PRESENCE1: this used to open when any of the four companion fields existed —
  // but UX3 removed those from the expanded panel, so a household could press
  // "Insights" and be shown an empty drawer. The affordance now names only what
  // the panel actually contains.
  const hasExpandableContent = weekIngredients.length > 0 || plantCount !== undefined;

  return (
    <div
      className="mb-3 rounded-lg border border-border/30 bg-muted/20"
      data-testid="planner-intelligence-strip"
    >
      {/* ── Compact strip row ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 py-2.5">
        {/* Leading label */}
        <span
          className="text-[11px] font-semibold text-muted-foreground/50 shrink-0 tracking-tight"
          data-testid="strip-label"
        >
          🍎 <span className="hidden sm:inline">This Week</span>
        </span>

        <span className="text-border shrink-0 hidden sm:block">|</span>

        {/* Plant count (inline, compact) — rendered only when the server knows it. */}
        {plantCount !== undefined && (
          <button
            type="button"
            onClick={onNavigatePlantDiversity}
            className="flex items-center gap-1 shrink-0 hover:opacity-70 transition-opacity"
            data-testid="strip-plant-count"
            title={`${plantCount} different plant food${plantCount === 1 ? "" : "s"} this week`}
          >
            <Leaf className="h-3 w-3 text-emerald-500/70 flex-shrink-0" />
            <span className="text-xs">
              {/* PRESENCE1: the hardcoded "/30" denominator is gone. It was a
                  target the household never set, and — because this strip never
                  read WEEKLY_PLANT_TARGET and never clamped — it was also how
                  "39/30" reached a household as the house's opinion of them. */}
              <span className="font-semibold text-foreground/75">{plantCount}</span>
              {/* NSR1 Phase 2 (Planner): the count carried no visible unit — a bare Leaf +
                  number read as cryptic, the word "plants" living only in the title tooltip.
                  Named inline now (CRAFT1 §4 — immediately understandable). */}
              <span className="text-muted-foreground/70"> plant{plantCount === 1 ? "" : "s"}</span>
            </span>
          </button>
        )}

        {/* PRESENCE1: the advisory pill row stood here. The strip now reports the
            week's own numbers and nothing else. */}
        <div className="flex-1" />

        {/* Expand / collapse button */}
        {hasExpandableContent && (
          <button
            type="button"
            onClick={toggle}
            className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors ml-auto pl-1"
            aria-expanded={expanded}
            data-testid="button-intelligence-strip-expand"
          >
            <span className="hidden sm:inline text-[11px]">
              {expanded ? "Collapse" : "Insights"}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      {/* ── Expanded content ───────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
            data-testid="planner-intelligence-strip-expanded"
          >
            <div className="border-t border-border/30 px-3 pt-3 pb-3 space-y-3">
              {/* Full plant diversity counter + variety legend */}
              <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-2">
                {plantCount !== undefined && (
                  <WeeklyPlantDiversityCounter
                    plantCount={plantCount}
                    onExplore={onNavigatePlantDiversity}
                  />
                )}
                <PlannerVarietyLegend compact />
              </div>

              {/* UX3 — the celebration/opportunity/seasonal/insight grid was a second
                  voice interpreting the week. The week's own numbers stay above. */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
