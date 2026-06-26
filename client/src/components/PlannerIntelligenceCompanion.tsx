// WX3 — Planner Intelligence Companion.
//
// A lightweight planning companion for the currently-viewed planner week. It
// owns nothing — it reads from /api/planner/weeks/:weekId/intelligence, which
// orchestrates existing canonical owners (Planner history, Stories, Seasonality,
// Discovery). Planning always comes first: this is a calm strip of small,
// helpful nudges, never a dashboard inside the planner.
//
// Trust & progressive enrichment: every module is independently optional. When
// no validated data exists the module — and the whole companion — disappears.
// Nothing is fabricated, estimated, or shown with invented confidence.

import { useQuery } from "@tanstack/react-query";
import { Leaf, CalendarDays, Sun } from "lucide-react";
import {
  CelebrationCard,
  OpportunityCard,
  HouseholdInsightCard,
  IntelligenceCard,
} from "@/components/intelligence";

// ── Types (mirror the server response) ────────────────────────────────────────

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

// ── Weekly progress chip strip ────────────────────────────────────────────────

function WeeklyProgressStrip({
  progress,
}: {
  progress: NonNullable<PlannerIntelligenceData["weeklyProgress"]>;
}) {
  const chips: Array<{ icon: React.ReactNode; label: string }> = [];

  if (progress.plantCount > 0) {
    chips.push({
      icon: <Leaf className="h-3 w-3" />,
      label: `${progress.plantCount} plant${progress.plantCount !== 1 ? "s" : ""} this week`,
    });
  }
  if (progress.mealsPlanned > 0) {
    chips.push({
      icon: <CalendarDays className="h-3 w-3" />,
      label: `${progress.mealsPlanned} meal${progress.mealsPlanned !== 1 ? "s" : ""} planned`,
    });
  }
  if (progress.daysWithMeals > 0) {
    chips.push({
      icon: <Sun className="h-3 w-3" />,
      label: `${progress.daysWithMeals} day${progress.daysWithMeals !== 1 ? "s" : ""} covered`,
    });
  }

  if (chips.length === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="planner-intelligence-progress"
    >
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="inline-flex items-center gap-1.5 text-[11px] text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-full px-2.5 py-1 leading-none"
        >
          <span className="text-teal-600/70 dark:text-teal-400/70">{chip.icon}</span>
          {chip.label}
        </span>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  /** Planner week id of the currently-viewed week. */
  weekId: number | null | undefined;
}

export default function PlannerIntelligenceCompanion({ weekId }: Props) {
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

  if (!data) return null;

  const hasAnyModule =
    data.weeklyProgress ||
    data.celebration ||
    data.seasonalHighlight ||
    data.opportunity ||
    data.householdInsight;

  if (!hasAnyModule) return null;

  // Cards laid out in a tight 2-column grid on desktop so the companion never
  // grows into a tall dashboard column above the planner grid.
  const hasCards =
    data.celebration ||
    data.seasonalHighlight ||
    data.opportunity ||
    data.householdInsight;

  return (
    <div
      className="mb-4 space-y-3"
      data-testid="planner-intelligence-companion"
    >
      {data.weeklyProgress && (
        <WeeklyProgressStrip progress={data.weeklyProgress} />
      )}

      {hasCards && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.celebration && (
            <CelebrationCard
              headline={data.celebration.headline}
              data-testid="planner-intelligence-celebration"
            />
          )}
          {data.opportunity && (
            <OpportunityCard
              text={data.opportunity.text}
              data-testid="planner-intelligence-opportunity"
            />
          )}
          {data.seasonalHighlight && (
            <IntelligenceCard
              icon={<Sun className="h-4 w-4" />}
              eyebrow="In season"
              body={data.seasonalHighlight.headline}
              data-testid="planner-intelligence-seasonal"
            />
          )}
          {data.householdInsight && (
            <HouseholdInsightCard
              headline={data.householdInsight.headline}
              data-testid="planner-intelligence-household-insight"
            />
          )}
        </div>
      )}
    </div>
  );
}
