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
import { useActiveWeek } from "@/hooks/use-week-meal-entries";
import { LoadError } from "@/components/ui/load-error";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
  IntelligenceCard,
  IntelligenceChipGroup,
  FoodQuickLook,
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
  /** NUTUI3 — true only for window === "this-year"; see Stat's `incomplete`. */
  incomplete: boolean;
}

type CentreWindow = "this-week" | "all-time" | "this-year";

const CENTRE_WINDOWS: { key: CentreWindow; label: string }[] = [
  { key: "this-week", label: "This week" },
  { key: "this-year", label: "This year" },
  { key: "all-time", label: "All time" },
];

const INCOMPLETE_REASON =
  "Some of your household's planner weeks don't have a known date yet, so this figure may be higher than shown. It becomes more complete as new weeks are planned.";

interface BenefitDetail {
  benefit: { slug: string; name: string; description: string | null };
  foods: { slug: string; name: string; category: string }[];
}

// ── Small building blocks (presentation only) ──────────────────────────────────

function Stat({
  value,
  label,
  incomplete,
}: {
  value: number;
  label: string;
  /** NUTUI3 — true when some planner weeks couldn't be placed in this window (HT7). */
  incomplete?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-numeric tabular-nums text-foreground">
        {value}
        {incomplete && (
          <span
            className="ml-1 cursor-help text-sm font-normal text-muted-foreground/60"
            title={INCOMPLETE_REASON}
            tabIndex={0}
            data-testid="stat-incomplete-marker"
          >
            ~
          </span>
        )}
      </p>
      <p className="mt-1 text-sm text-muted-foreground leading-snug">{label}</p>
    </div>
  );
}

// NUTUI-EXPAND1 — this used to be a wouter Link straight to /foods/:slug: tapping
// a food the household was already looking at here left the room for a separate
// 433-line page that fetched everything again from scratch (fnd-food-detail-
// disjointed). It is now a disclosure trigger: the same food, opened in place.
// `className="contents"` on the Collapsible root keeps the trigger a normal
// chip-sized flex item inside the wrapping flex-wrap row; the content, when
// open, is a `w-full` sibling that wraps onto its own line below the chips.
function FoodLink({ food }: { food: FoodRef }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="contents">
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-auto min-h-0 inline-flex items-center gap-1 rounded-full border border-border/40 bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground/80 hover:text-foreground hover:border-border"
          aria-expanded={open}
          data-testid={`link-centre-food-${food.slug}`}
        >
          {food.name}
          <ChevronRight
            className={`h-3 w-3 text-muted-foreground/40 transition-transform duration-150 ${open ? "rotate-90" : ""}`}
            aria-hidden="true"
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="w-full">
        <FoodQuickLook slug={food.slug} />
      </CollapsibleContent>
    </Collapsible>
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
      {/* NSR1 Phase 2 (Nutrition): this was a progress bar per category — an emerald fill
          toward `enjoyed/total`, i.e. a bar filling toward a total the household never set.
          GEA13 forbids exactly this ("progress bars toward a target the household did not
          set"), and PRESENCE1 already removed it from the Foods tab next door; it survived
          here. The count is the fact; the `/total` denominator and the fill were the
          judgement. The room now reports how many kinds in each category the household has
          had, and grades nothing. */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {visible.map((c) => (
          <div key={c.category} className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium text-foreground/80">{c.category}</span>
            <span className="text-[11px] tabular-nums text-muted-foreground/70">
              {c.enjoyed} {c.enjoyed === 1 ? "kind" : "kinds"}
            </span>
          </div>
        ))}
      </div>
    </IntelligenceCard>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export function HouseholdNutritionCentre({ week }: { week?: string } = {}) {
  const [period, setPeriod] = useState<CentreWindow>("this-week");
  // FOODUI6 — the same "active week" the Food page's Foods tab already shows,
  // so "Foods this week" and "Nutrition this week" are never two different
  // weeks on the same page. FNDFIX9 (2026-11-03) — this only ever needed
  // activeWeek; useWeekMealEntries also fired /api/planner/full and
  // /api/meals (needed for weekMeals, which this component never read).
  // useActiveWeek is the same resolution logic, same queryKey, narrowed to
  // just that.
  const { activeWeek } = useActiveWeek(week);

  const { data, isPending, isError, refetch } = useQuery<NutritionCentre>({
    queryKey: ["/api/nutrition-centre", period, period === "this-week" ? activeWeek : null],
    queryFn: async () => {
      const url =
        period === "this-week"
          ? `/api/nutrition-centre?window=${period}&week=${activeWeek}`
          : `/api/nutrition-centre?window=${period}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("not ok");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // NUTUI3 — the time-window control. Rendered above every state (loading,
  // error, empty, populated) so switching windows never requires the Centre
  // to already have data.
  const periodToggle = (
    <div className="flex items-center gap-0.5 self-start rounded-lg border border-border/40 bg-muted/50 p-1" role="tablist" aria-label="Time window">
      {CENTRE_WINDOWS.map(({ key, label }) => (
        <button
          key={key}
          role="tab"
          aria-selected={period === key}
          onClick={() => setPeriod(key)}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-all ${
            period === key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          data-testid={`button-centre-window-${key}`}
        >
          {label}
        </button>
      ))}
    </div>
  );

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
        {periodToggle}
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3">
        {periodToggle}
        <LoadError
          what="your nutrition centre"
          onRetry={() => refetch()}
          data-testid="centre-load-error"
        />
      </div>
    );
  }

  if (!data || !data.available || !data.overview) {
    // NUTUI5 — "This year" can be empty for two different reasons, and showing
    // the same "you've never cooked anything" message for both is dishonest
    // when the real reason is HT7: planner weeks created before the dated
    // calendar existed have no weekStartDate, so this-year filtering can't
    // place them in or out of the target year and excludes them either way.
    // `incomplete` (set server-side, NUTUI3) is the signal that distinguishes
    // "nothing cooked" from "cooked, but not dated" — surface it here instead
    // of only on individual stats, which never render in this branch.
    const dateless = data?.incomplete === true;
    // FOODUI6 — "This week" can be empty for a reason that has nothing to do
    // with whether the household has ever cooked anything: this specific
    // planner week just has nothing in it yet. Reusing the all-time "start
    // with a cooked meal" message here would be false whenever the household
    // has real history elsewhere, so this gets its own honest branch.
    const thisWeekEmpty = period === "this-week" && !dateless;
    return (
      <div className="space-y-3">
        {periodToggle}
        <EmptyState
          variant="empty"
          icon={Sparkles}
          title={
            thisWeekEmpty
              ? "Nothing planned for this week yet"
              : dateless
                ? "This year can't be shown yet"
                : "Your nutrition picture starts with a cooked meal"
          }
          description={
            thisWeekEmpty
              ? "This planner week doesn't have any meals in it yet. Switch to All time to see your household's full nutrition picture, or plan something for this week."
              : dateless
                ? "Some of your planner weeks were created before weeks had a known date, so they can't be placed in a specific year. Nothing is missing — switch to All time to see it, and newly planned weeks will show up here."
                : "Once your household has cooked something, this is where the foods, plants and nutrients behind it are gathered — all-time, not just this week."
          }
          action={
            thisWeekEmpty ? (
              <Button variant="outline" size="sm" onClick={() => setPeriod("all-time")} data-testid="button-centre-empty-all-time">
                Show all time
              </Button>
            ) : dateless ? (
              <Button variant="outline" size="sm" onClick={() => setPeriod("all-time")} data-testid="button-centre-empty-all-time">
                Show all time
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href="/planner" data-testid="link-centre-empty-planner">
                  Plan a meal
                </Link>
              </Button>
            )
          }
          data-testid="centre-empty"
        />
      </div>
    );
  }

  const { overview, journey, categories, benefits, trends, discovery, incomplete } = data;

  return (
    <div className="space-y-4" data-testid="household-nutrition-centre">
      {periodToggle}

      {/* Household overview. NSR1 Phase 2 (Nutrition): appraisal framing neutralised — a
          room reports facts, it does not "celebrate" them or narrate a "journey" (GEA21;
          CRAFT1 §5 — a count is reported, never celebrated). */}
      <IntelligenceCard
        icon={<Sparkles className="h-4 w-4" />}
        eyebrow="Your household"
        title="Food history"
        data-testid="centre-overview"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="sm:min-w-40">
            <p className="text-numeric tabular-nums text-foreground">
              {overview.foodDiversity}
              {incomplete && (
                <span
                  className="ml-1 cursor-help text-sm font-normal text-muted-foreground/60"
                  title={INCOMPLETE_REASON}
                  tabIndex={0}
                  data-testid="stat-incomplete-marker"
                >
                  ~
                </span>
              )}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">foods in Planner history</p>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-4 border-t border-border/50 pt-4 sm:grid-cols-2 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0 lg:grid-cols-4">
            <Stat value={overview.plantDiversity} label="Different plants" incomplete={incomplete} />
            <Stat value={overview.mealsCooked} label="Meals cooked" incomplete={incomplete} />
            <Stat value={overview.foodsDiscovered} label="Foods discovered" incomplete={incomplete} />
            <Stat
              value={overview.seasonalFoodsEnjoyed}
              label={`In season this ${overview.seasonLabel.toLowerCase()}`}
              incomplete={incomplete}
            />
          </div>
        </div>
      </IntelligenceCard>

      {/* Nutrition journey */}
      {journey && (
        <IntelligenceCard
          icon={<Activity className="h-4 w-4" />}
          eyebrow="Nutrients"
          title="What your foods bring to the table"
          data-testid="centre-journey"
        >
          <div className="grid grid-cols-3 gap-x-4">
            <Stat value={journey.nutrientCoverage} label="Nutrients linked to foods" incomplete={incomplete} />
            <Stat value={journey.benefitCoverage} label="Benefits linked to foods" incomplete={incomplete} />
            <Stat value={journey.categoriesCovered} label={`of ${journey.categoriesTotal} food categories`} incomplete={incomplete} />
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

      {/* Discovery — evidence only. NSR1 Phase 2 (Nutrition): the "You might enjoy"
          suggestions block is removed — suggesting a food is the Companion's, not the
          room's (GEA8/22; UIOWN1 §8 — the room reports variety, it never recommends).
          What remains is truthful reporting: what the household recently cooked, and what
          they have not cooked lately. */}
      {discovery &&
        (discovery.recentlyDiscovered.length > 0 ||
          discovery.notUsedRecently.length > 0) && (
          <IntelligenceCard
            icon={<Compass className="h-4 w-4" />}
            eyebrow="Discovery"
            title="Recently in your kitchen"
            data-testid="centre-discovery"
          >
            <div className="space-y-3">
              <FoodLinkRow foods={discovery.recentlyDiscovered} label="Recently discovered" />
              <FoodLinkRow foods={discovery.notUsedRecently} label="Not cooked recently" />
            </div>
          </IntelligenceCard>
        )}

      {/* UX3 — the "simply better" guidance is the Companion's; the Centre reports
          what the household has actually eaten. */}
    </div>
  );
}
