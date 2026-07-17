// WX2 — Home Intelligence Companion.
//
// Surfaces household, planner, food and discovery intelligence on the Dashboard.
// The component owns nothing — it reads from /api/home/intelligence, which
// orchestrates existing canonical owners (WS8, WS10, WS11, Planner, Meal store).
//
// Progressive enrichment: every module is independently optional. When no
// validated data exists a module is invisible, never faked. The user should
// never know something was unavailable — they simply see what the household
// has actually done.

import { useQuery } from "@tanstack/react-query";
import { householdGreeting } from "@/lib/greeting";
import { DECLARED_DEFAULT_ZONE } from "@shared/time/household-time";
import { useUser } from "@/hooks/use-user";
import { Leaf, Sparkles, Sun, Compass, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";

// ── Types ─────────────────────────────────────────────────────────────────────

interface HomeIntelligenceData {
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

// ── Greeting ──────────────────────────────────────────────────────────────────
//
// CONV1 P6 (Phase 3) — the local `getGreeting()` is RETIRED into `@/lib/greeting`
// (architecture § 14, target 3: 4 → 1). It read `new Date().getHours()` — the
// DEVICE's hour — with its own private 12/17 boundary, byte-identical to the copy
// on the dashboard. Same words, same boundary; the hour is now the household's.

// ── Sub-components ────────────────────────────────────────────────────────────

function CompanionRow({
  icon,
  text,
  testId,
}: {
  icon: React.ReactNode;
  text: string;
  testId?: string;
}) {
  return (
    <div
      className="flex items-start gap-3"
      data-testid={testId}
    >
      <div className="mt-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center text-primary/60">
        {icon}
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed">{text}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HomeIntelligenceCompanion() {
  const { user } = useUser();

  const { data, isPending: isLoading } = useQuery<HomeIntelligenceData>({
    queryKey: ["/api/home/intelligence"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // CONV1 P6 / greeting — the household's own clock (CP8: the declared default
  // resolves at read time; the row keeps its honest null).
  const { data: householdForClock } = useQuery<{ timeZone: string | null }>({
    queryKey: ["/api/household"],
    enabled: !!user,
  });
  const householdZone = householdForClock?.timeZone ?? DECLARED_DEFAULT_ZONE;

  // While loading, show just the greeting to avoid layout shift
  const displayName = user?.displayName || user?.username || null;
  const nameFragment = displayName ? `, ${displayName.split("@")[0]}` : "";
  const greeting = `${householdGreeting(new Date(), householdZone)}${nameFragment}.`;

  // Count visible modules to decide if we render the card at all
  const hasAnyModule =
    data?.weeklyProgress ||
    data?.celebration ||
    data?.seasonalHighlight ||
    data?.opportunity ||
    data?.householdInsight;

  // Build the weekly progress sentence
  function buildProgressText(p: HomeIntelligenceData["weeklyProgress"]): string | null {
    if (!p) return null;
    const parts: string[] = [];
    if (p.plantCount > 0) {
      parts.push(
        `${p.plantCount} plant${p.plantCount !== 1 ? "s" : ""} this week`
      );
    }
    if (p.mealsPlanned > 0) {
      parts.push(
        `${p.mealsPlanned} meal${p.mealsPlanned !== 1 ? "s" : ""} planned`
      );
    }
    return parts.length > 0 ? parts.join(" · ") + "." : null;
  }

  if (!isLoading && !hasAnyModule) return null;

  // PX1-W4.4 (fnd-px-nine-card-surfaces): composes the canonical Card instead of
  // declaring a rival surface.
  return (
    <Card
      className="px-5 py-4 space-y-3"
      data-testid="home-intelligence-companion"
    >
      {/* Greeting */}
      <p
        className="text-base font-medium text-foreground tracking-tight"
        data-testid="home-intelligence-greeting"
      >
        {greeting}
      </p>

      {/* Modules — only rendered when the API has returned and data exists */}
      {!isLoading && data && (
        <div className="space-y-3">
          {/* Weekly progress */}
          {(() => {
            const text = buildProgressText(data.weeklyProgress);
            return text ? (
              <CompanionRow
                icon={<Leaf className="h-4 w-4" />}
                text={text}
                testId="home-intelligence-weekly-progress"
              />
            ) : null;
          })()}

          {/* Celebration */}
          {data.celebration && (
            <CompanionRow
              icon={<Sparkles className="h-4 w-4" />}
              text={data.celebration.headline}
              testId="home-intelligence-celebration"
            />
          )}

          {/* Seasonal highlight */}
          {data.seasonalHighlight && (
            <CompanionRow
              icon={<Sun className="h-4 w-4" />}
              text={data.seasonalHighlight.headline}
              testId="home-intelligence-seasonal"
            />
          )}

          {/* Gentle opportunity */}
          {data.opportunity && (
            <CompanionRow
              icon={<Compass className="h-4 w-4" />}
              text={data.opportunity.text}
              testId="home-intelligence-opportunity"
            />
          )}

          {/* Household insight */}
          {data.householdInsight && (
            <CompanionRow
              icon={<Heart className="h-4 w-4" />}
              text={data.householdInsight.headline}
              testId="home-intelligence-household-insight"
            />
          )}
        </div>
      )}
    </Card>
  );
}
