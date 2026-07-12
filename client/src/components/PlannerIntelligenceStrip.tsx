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
//   - Plant count computed locally from weekIngredients (no API).
//   - Expansion state persisted in sessionStorage for the session.
//   - No new API calls, no schema changes, no business logic.

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Leaf, Sun } from "lucide-react";
import { isPlantIngredient } from "@shared/canonical/plant-classifier";
import { normaliseForReuse } from "@/lib/ingredient-reuse";
import {
  WeeklyPlantDiversityCounter,
  PlannerVarietyLegend,
} from "@/components/nutrition-variety-chips";
import {
  CelebrationCard,
  OpportunityCard,
  HouseholdInsightCard,
  IntelligenceCard,
} from "@/components/intelligence";

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

// ── Plant count helper ────────────────────────────────────────────────────────
// Same logic as WeeklyPlantDiversityCounter — counts unique plant foods using
// the canonical plant classifier so counts stay consistent across the UI.

function computePlantCount(weekIngredients: string[][]): number {
  const seen = new Set<string>();
  for (const ingredients of weekIngredients) {
    for (const raw of ingredients) {
      if (!raw.trim()) continue;
      if (isPlantIngredient(raw)) seen.add(normaliseForReuse(raw));
    }
  }
  return seen.size;
}

// ── Compact intelligence pill row ─────────────────────────────────────────────
// Clips each item to keep the strip tight and scannable.

function truncate(str: string, max = 36): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

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

  const plantCount = computePlantCount(weekIngredients);

  // Build compact pill items from intelligence data (only show what exists)
  const pills: string[] = [];
  if (data?.celebration?.headline) {
    pills.push(truncate(data.celebration.headline));
  }
  if (data?.seasonalHighlight?.headline) {
    pills.push(truncate(data.seasonalHighlight.headline));
  }
  if (data?.householdInsight?.headline) {
    pills.push(truncate(data.householdInsight.headline));
  }
  if (data?.opportunity?.text) {
    pills.push(truncate(data.opportunity.text));
  }

  const hasExpandableContent =
    weekIngredients.length > 0 ||
    !!(
      data?.celebration ||
      data?.seasonalHighlight ||
      data?.opportunity ||
      data?.householdInsight
    );

  const hasCards =
    data?.celebration ||
    data?.seasonalHighlight ||
    data?.opportunity ||
    data?.householdInsight;

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

        {/* Plant count (inline, compact) */}
        <button
          type="button"
          onClick={onNavigatePlantDiversity}
          className="flex items-center gap-1 shrink-0 hover:opacity-70 transition-opacity"
          data-testid="strip-plant-count"
          title={`${plantCount} of 30 plant foods this week`}
        >
          <Leaf className="h-3 w-3 text-emerald-500/70 flex-shrink-0" />
          <span className="text-xs">
            <span className="font-semibold text-foreground/75">{plantCount}</span>
            <span className="text-muted-foreground/45">/30</span>
          </span>
        </button>

        {/* Intelligence pills — horizontal scroll, no scrollbar */}
        {pills.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1 min-w-0">
            {pills.map((pill, i) => (
              <span key={i} className="flex items-center gap-1.5 shrink-0">
                <span className="text-muted-foreground/25">·</span>
                <span className="text-xs text-muted-foreground/65 whitespace-nowrap">
                  {pill}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* Spacer when no pills */}
        {pills.length === 0 && <div className="flex-1" />}

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
                <WeeklyPlantDiversityCounter
                  weekIngredients={weekIngredients}
                  onExplore={onNavigatePlantDiversity}
                />
                <PlannerVarietyLegend compact />
              </div>

              {/* Intelligence cards */}
              {hasCards && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data?.celebration && (
                    <CelebrationCard
                      headline={data.celebration.headline}
                      data-testid="planner-intelligence-celebration"
                    />
                  )}
                  {data?.opportunity && (
                    <OpportunityCard
                      text={data.opportunity.text}
                      data-testid="planner-intelligence-opportunity"
                    />
                  )}
                  {data?.seasonalHighlight && (
                    <IntelligenceCard
                      icon={<Sun className="h-4 w-4" />}
                      eyebrow="In season"
                      body={data.seasonalHighlight.headline}
                      data-testid="planner-intelligence-seasonal"
                    />
                  )}
                  {data?.householdInsight && (
                    <HouseholdInsightCard
                      headline={data.householdInsight.headline}
                      data-testid="planner-intelligence-household-insight"
                    />
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
