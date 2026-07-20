// WX8 — Household Nutrition Centre.
//
// The household's nutrition companion: a calm, celebratory assembly that answers
// one question — "How is our household's relationship with food evolving?" It
// sits above the weekly Plant Diversity report on /plant-diversity.
//
// It OWNS NOTHING. It reads /api/nutrition-centre, which assembles household
// intelligence purely from canonical owners (planner history, the WS0 Knowledge
// Registry, Discovery, Seasonality, Nutrition Enhancement). Every section here is
// rendered with the shared Intelligence Experience System — no Centre-specific
// card variants. Each section renders only when its canonical owner produced
// validated content. The Centre itself no longer disappears when there is nothing
// to say — it is the whole Nutrients tab, so vanishing left a blank room (HOUSE2).
//
// Celebrate first, guide second, measure third. Foods link to their Food Pages —
// the gateway into related foods, meals, benefits and the planner.

import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Activity,
  LayoutGrid,
  HeartPulse,
  Compass,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadError } from "@/components/ui/load-error";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  IntelligenceCard,
  IntelligenceChipGroup,
} from "@/components/intelligence";

// ── Server projection (mirrors server/lib/nutrition-centre-assembler.ts) ───────

interface FoodRef {
  slug: string;
  name: string;
}
interface TrendFood extends FoodRef {
  appearances: number;
}
interface DiscoverySuggestion extends FoodRef {
  reason: string;
  linkable: boolean;
}
interface CentreBenefit {
  slug: string;
  name: string;
  icon: string | null;
  householdFoodCount: number;
}
interface CategoryProgress {
  category: string;
  enjoyed: number;
  total: number;
}

interface NutritionCentre {
  available: boolean;
  overview: {
    plantDiversity: number;
    foodDiversity: number;
    mealsCooked: number;
    foodsDiscovered: number;
    seasonalFoodsEnjoyed: number;
    seasonLabel: string;
  } | null;
  journey: {
    nutrientCoverage: number;
    benefitCoverage: number;
    categoriesCovered: number;
    categoriesTotal: number;
  } | null;
  categories: CategoryProgress[];
  benefits: CentreBenefit[];
  trends: { mostFrequent: TrendFood[] } | null;
  discovery: {
    recentlyDiscovered: FoodRef[];
    notUsedRecently: FoodRef[];
    suggested: DiscoverySuggestion[];
  } | null;
}

interface BenefitDetail {
  benefit: { slug: string; name: string; description: string | null };
  foods: { slug: string; name: string; category: string }[];
}

// ── Small building blocks (presentation only) ──────────────────────────────────

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-0">
      <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground/60 leading-tight">{label}</p>
    </div>
  );
}

function FoodLink({ food }: { food: FoodRef }) {
  return (
    <Link
      href={`/foods/${food.slug}`}
      className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground/80 hover:text-foreground hover:border-border transition-colors"
      data-testid={`link-centre-food-${food.slug}`}
    >
      {food.name}
      <ChevronRight className="h-3 w-3 text-muted-foreground/40" aria-hidden="true" />
    </Link>
  );
}

function FoodLinkRow({ foods, label }: { foods: FoodRef[]; label: string }) {
  if (foods.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/50">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {foods.map((f) => (
          <FoodLink key={f.slug} food={f} />
        ))}
      </div>
    </div>
  );
}

// ── Benefit explorer (expands inline → canonical foods, each a Food Page gateway) ─

function BenefitExplorer({ benefits }: { benefits: CentreBenefit[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const { data: detail, isFetching } = useQuery<BenefitDetail>({
    queryKey: ["/api/knowledge/benefits", openSlug],
    queryFn: async () => {
      const res = await fetch(`/api/knowledge/benefits/${openSlug}`);
      if (!res.ok) throw new Error("not ok");
      return res.json();
    },
    enabled: !!openSlug,
    staleTime: 10 * 60 * 1000,
  });

  if (benefits.length === 0) return null;

  return (
    <IntelligenceCard
      icon={<HeartPulse className="h-4 w-4" />}
      eyebrow="Explore"
      title="Health benefits"
      body="Pick a benefit to see the foods that support it — each opens its food page, your gateway to meals, related foods and your planner."
      data-testid="centre-benefits"
    >
      <div className="flex flex-wrap gap-1.5">
        {benefits.map((b) => {
          const active = openSlug === b.slug;
          return (
            <button
              key={b.slug}
              type="button"
              onClick={() => setOpenSlug(active ? null : b.slug)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                active
                  ? "border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "border-border/40 bg-muted/30 text-foreground/75 hover:text-foreground"
              }`}
              data-testid={`button-centre-benefit-${b.slug}`}
            >
              {b.name}
              {b.householdFoodCount > 0 && (
                <span className="text-[10px] tabular-nums text-emerald-700/70 dark:text-emerald-400/70">
                  {b.householdFoodCount} you enjoy
                </span>
              )}
            </button>
          );
        })}
      </div>

      {openSlug && (
        <div className="mt-1 rounded-xl border border-border/40 bg-muted/20 p-3">
          {isFetching && !detail ? (
            <p className="text-xs text-muted-foreground/50">Loading foods…</p>
          ) : detail && detail.foods.length > 0 ? (
            <>
              {detail.benefit.description && (
                <p className="mb-2 text-xs text-muted-foreground/70 leading-relaxed">
                  {detail.benefit.description}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {detail.foods.map((f) => (
                  <FoodLink key={f.slug} food={f} />
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground/50">
              No foods catalogued for this benefit yet.
            </p>
          )}
        </div>
      )}
    </IntelligenceCard>
  );
}

// ── Category progress ──────────────────────────────────────────────────────────

function CategoryProgressBlock({ categories }: { categories: CategoryProgress[] }) {
  const visible = categories.filter((c) => c.total > 0);
  if (visible.length === 0) return null;
  return (
    <IntelligenceCard
      icon={<LayoutGrid className="h-4 w-4" />}
      eyebrow="Your variety"
      title="Food categories"
      data-testid="centre-categories"
    >
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {visible.map((c) => {
          const pct = Math.min((c.enjoyed / c.total) * 100, 100);
          return (
            <div key={c.category}>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-foreground/80">{c.category}</span>
                <span className="text-[11px] tabular-nums text-muted-foreground/55">
                  {c.enjoyed}/{c.total}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                <div
                  className={`h-full rounded-full transition-all ${
                    c.enjoyed > 0 ? "bg-emerald-500/80" : "bg-transparent"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </IntelligenceCard>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export function HouseholdNutritionCentre() {
  const { data, isPending, isError, refetch } = useQuery<NutritionCentre>({
    queryKey: ["/api/nutrition-centre"],
    queryFn: async () => {
      const res = await fetch("/api/nutrition-centre");
      if (!res.ok) throw new Error("not ok");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // HOUSE2: this used to `return null` on every absence — no data, still loading, and
  // failed load alike. The original note reasoned that the Centre could vanish because
  // it left "the weekly report below as the sole experience", but that report now lives
  // on the *Foods* tab; the Centre is the entire Nutrients tab. So the rule silently
  // rendered a tab that promises a feature as a blank page, with no way for a household
  // to tell empty from broken. Progressive enrichment still holds for the *sections*
  // below — each still withholds itself when unvalidated — it just cannot apply to the
  // room itself. (EXP §14 — say what happened.)
  if (isPending) {
    return (
      <div className="space-y-3" data-testid="centre-loading">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <LoadError
        what="your nutrition centre"
        onRetry={() => refetch()}
        data-testid="centre-load-error"
      />
    );
  }

  if (!data || !data.available || !data.overview) {
    return (
      <EmptyState
        variant="empty"
        icon={Sparkles}
        title="Your nutrition picture starts with a cooked meal"
        description="Once your household has cooked something, this is where the foods, plants and nutrients behind it are gathered — all-time, not just this week."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/planner" data-testid="link-centre-empty-planner">
              Plan a meal
            </Link>
          </Button>
        }
        data-testid="centre-empty"
      />
    );
  }

  const { overview, journey, categories, benefits, trends, discovery } = data;

  const headline =
    overview.plantDiversity > 0
      ? `Your household has cooked with ${overview.foodDiversity} foods — including ${overview.plantDiversity} different plants.`
      : `Your household has cooked with ${overview.foodDiversity} foods so far.`;

  return (
    <div className="space-y-4" data-testid="household-nutrition-centre">
      {/* Household overview — celebrate first */}
      <IntelligenceCard
        icon={<Sparkles className="h-4 w-4" />}
        eyebrow="Your household"
        title={headline}
        data-testid="centre-overview"
      >
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
          <Stat value={overview.plantDiversity} label="Plants enjoyed" />
          <Stat value={overview.foodDiversity} label="Foods in your kitchen" />
          <Stat value={overview.mealsCooked} label="Meals cooked" />
          <Stat value={overview.foodsDiscovered} label="Foods discovered" />
          <Stat
            value={overview.seasonalFoodsEnjoyed}
            label={`In season this ${overview.seasonLabel.toLowerCase()}`}
          />
        </div>
      </IntelligenceCard>

      {/* Nutrition journey */}
      {journey && (
        <IntelligenceCard
          icon={<Activity className="h-4 w-4" />}
          eyebrow="Your nutrition journey"
          title="What your foods bring to the table"
          data-testid="centre-journey"
        >
          <div className="grid grid-cols-3 gap-x-4">
            <Stat value={journey.nutrientCoverage} label="Nutrients covered" />
            <Stat value={journey.benefitCoverage} label="Health benefits supported" />
            <Stat value={journey.categoriesCovered} label={`of ${journey.categoriesTotal} food categories`} />
          </div>
        </IntelligenceCard>
      )}

      {/* Food categories */}
      <CategoryProgressBlock categories={categories} />

      {/* Health benefits explorer */}
      <BenefitExplorer benefits={benefits} />

      {/* Household trends — evidence only */}
      {trends && trends.mostFrequent.length > 0 && (
        <IntelligenceCard
          icon={<TrendingUp className="h-4 w-4" />}
          eyebrow="Your kitchen"
          title="Most frequently cooked"
          data-testid="centre-trends"
        >
          <div className="flex flex-wrap gap-1.5">
            {trends.mostFrequent.map((f) => (
              <FoodLink key={f.slug} food={f} />
            ))}
          </div>
        </IntelligenceCard>
      )}

      {/* Discovery journey */}
      {discovery &&
        (discovery.recentlyDiscovered.length > 0 ||
          discovery.notUsedRecently.length > 0 ||
          discovery.suggested.length > 0) && (
          <IntelligenceCard
            icon={<Compass className="h-4 w-4" />}
            eyebrow="Discovery"
            title="Your discovery journey"
            data-testid="centre-discovery"
          >
            <div className="space-y-3">
              <FoodLinkRow foods={discovery.recentlyDiscovered} label="Recently discovered" />
              <FoodLinkRow foods={discovery.notUsedRecently} label="Not cooked recently" />
              {discovery.suggested.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/50">
                    You might enjoy
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {discovery.suggested.map((s) =>
                      s.linkable ? (
                        <FoodLink key={s.slug} food={s} />
                      ) : (
                        <span
                          key={s.slug}
                          className="inline-flex items-center rounded-full border border-border/40 bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground/70"
                        >
                          {s.name}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          </IntelligenceCard>
        )}

      {/* UX3 — the "simply better" guidance is the Companion's; the Centre reports
          what the household has actually eaten. */}
    </div>
  );
}
