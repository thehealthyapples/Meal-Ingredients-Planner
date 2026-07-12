// WX4 — Food Intelligence Page (route: /foods/:slug).
//
// A calm, food-loving page that surfaces everything The Healthy Apples safely
// knows about one food. It owns NOTHING — it reads /api/foods/:slug/intelligence
// (the FoodIntelligenceAssembler) and renders only validated sections with the
// WX2.5 Intelligence Experience System.
//
// Trust & progressive enrichment: every section is independently optional. Absent
// data disappears. Nothing is fabricated, estimated, or shown with invented
// confidence. An unknown slug shows a calm not-found state.

import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { usePublishCompanionContext } from "@/components/conversation/companion-context";
import {
  ArrowLeft,
  Apple,
  Leaf,
  Sparkles,
  Utensils,
  Compass,
  Loader2,
} from "lucide-react";
import {
  IntelligenceCard,
  IntelligenceChipGroup,
  SeasonalCard,
  HouseholdInsightCard,
  SimplyBetterChoiceCard,
  ConnectedFoodPanel,
} from "@/components/intelligence";

// ── Types (mirror the server FoodIntelligence model) ──────────────────────────

interface FoodIntelligence {
  slug: string;
  food: { name: string; category: string; description: string } | null;
  healthBenefits: string[];
  keyNutrients: string[];
  nutritionContext: string[];
  seasonality: { season: string; seasonLabel: string; note: string } | null;
  meals: Array<{ mealId: number; name: string; imageUrl: string | null }>;
  household: {
    plannerAppearanceCount: number;
    lastPlannerWeekNumber: number | null;
    firstPlannerWeekNumber: number | null;
    mostCommonMeal: { mealId: number; name: string; count: number } | null;
  } | null;
  discovery: {
    sections: Array<{
      type: string;
      title: string;
      suggestions: Array<{
        slug: string;
        name: string;
        reason: string;
        linkable: boolean;
      }>;
    }>;
  } | null;
  nutritionEnhancement: {
    matches: Array<{
      ruleName: string;
      suggestions: Array<{ ingredient: string; action: string; why: string }>;
    }>;
  } | null;
}

// ── Section: household history (careful language) ──────────────────────────────

function householdHeadline(
  household: NonNullable<FoodIntelligence["household"]>,
  foodName: string
): string {
  const n = household.plannerAppearanceCount;
  const times = `${n} ${n === 1 ? "time" : "times"}`;
  if (household.mostCommonMeal) {
    return `${foodName} has featured in your plans ${times}, most often in ${household.mostCommonMeal.name}.`;
  }
  return `${foodName} has featured in your plans ${times}.`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FoodDetailPage() {
  const [, params] = useRoute("/foods/:slug");
  const slug = params?.slug ?? null;

  // PHASE5D — the Nutrition persona's deixis. With the slug published, "is it good
  // for sleep?" on this page resolves to THIS food; without it the question arrived
  // with nothing to point at. The answer stays source-gated and EFSA-firewalled —
  // the pointer changes what is being asked about, never what may be claimed.
  usePublishCompanionContext({ currentFoodSlug: slug ?? undefined });

  const { data, isPending: isLoading, isError } = useQuery<FoodIntelligence>({
    queryKey: ["/api/foods", slug, "intelligence"],
    queryFn: async () => {
      const res = await fetch(`/api/foods/${slug}/intelligence`);
      if (!res.ok) throw new Error("not-found");
      return res.json();
    },
    enabled: !!slug,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <Link
        href="/cookbook"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70 hover:text-foreground transition-colors mb-5"
        data-testid="link-back"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>

      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
        </div>
      )}

      {!isLoading && (isError || !data?.food) && (
        <div className="py-16 text-center" data-testid="food-not-found">
          <Apple className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
          <h1 className="text-lg font-semibold mb-1">We don't know this food yet</h1>
          <p className="text-sm text-muted-foreground/70 max-w-md mx-auto">
            There's nothing we can confidently tell you about it right now.
          </p>
        </div>
      )}

      {!isLoading && data?.food && (
        <FoodIntelligenceView data={data} />
      )}
    </div>
  );
}

function FoodIntelligenceView({ data }: { data: FoodIntelligence }) {
  const food = data.food!;

  const hasWhy =
    data.healthBenefits.length > 0 || data.nutritionContext.length > 0;
  const upliftMatch = data.nutritionEnhancement?.matches[0] ?? null;
  const upliftSuggestion = upliftMatch?.suggestions[0] ?? null;

  // WX5: the lateral `similar` and `cook_with` relationships are now presented as
  // first-class, labelled sections in the Connected Food Panel below. Drop them
  // here so the same chips never appear twice (Experience Rule: never spammy).
  const discoverySections = (data.discovery?.sections ?? []).filter(
    (s) => s.type !== "similar" && s.type !== "cook_with"
  );

  return (
    <div className="space-y-5" data-testid="food-intelligence">
      {/* ── Hero ── */}
      <header className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <Apple className="h-5 w-5 text-emerald-600/70 dark:text-emerald-400/70 flex-shrink-0" />
          <h1
            className="text-2xl font-bold tracking-tight"
            data-testid="food-name"
          >
            {food.name}
          </h1>
        </div>
        {food.category && (
          <p className="text-xs uppercase tracking-wider text-muted-foreground/60 pl-8">
            {food.category}
          </p>
        )}
        {food.description && (
          <p className="text-sm text-muted-foreground/80 leading-relaxed pl-8 max-w-2xl">
            {food.description}
          </p>
        )}
      </header>

      {/* ── Why it matters ── */}
      {hasWhy && (
        <IntelligenceCard
          icon={<Leaf className="h-4 w-4" />}
          eyebrow="Why it matters"
          title={`What ${food.name.toLowerCase()} brings to the table`}
          body={data.nutritionContext[0] ?? undefined}
          chips={
            data.healthBenefits.length > 0 ? (
              <IntelligenceChipGroup
                items={data.healthBenefits}
                kind="benefit"
                max={8}
                aria-label="Health benefits"
              />
            ) : undefined
          }
          details={
            data.nutritionContext.length > 1 ? (
              <ul className="list-disc pl-4 space-y-1">
                {data.nutritionContext.slice(1).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : undefined
          }
          detailsLabel="More about this food"
          data-testid="food-why"
        />
      )}

      {/* ── Key nutrients ── */}
      {data.keyNutrients.length > 0 && (
        <IntelligenceCard
          icon={<Sparkles className="h-4 w-4" />}
          eyebrow="Key nutrients"
          chips={
            <IntelligenceChipGroup
              items={data.keyNutrients}
              kind="nutrient"
              aria-label="Key nutrients"
            />
          }
          data-testid="food-nutrients"
        />
      )}

      {/* ── Seasonality ── */}
      {data.seasonality && (
        <SeasonalCard
          headline={data.seasonality.note}
          items={[food.name]}
          data-testid="food-seasonality"
        />
      )}

      {/* ── Meals using this food ── */}
      {data.meals.length > 0 && (
        <IntelligenceCard
          icon={<Utensils className="h-4 w-4" />}
          eyebrow="In the cookbook"
          title={`Meals with ${food.name.toLowerCase()}`}
          data-testid="food-meals"
        >
          <ul className="space-y-1.5">
            {data.meals.map((m) => (
              <li key={m.mealId}>
                <Link
                  href={`/meals/${m.mealId}`}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                  data-testid={`food-meal-link-${m.mealId}`}
                >
                  {m.name}
                </Link>
              </li>
            ))}
          </ul>
        </IntelligenceCard>
      )}

      {/* ── Household history (careful language) ── */}
      {data.household && (
        <HouseholdInsightCard
          headline={householdHeadline(data.household, food.name)}
          data-testid="food-household"
        />
      )}

      {/* ── Connected food web (WX5) ── */}
      <ConnectedFoodPanel slug={data.slug} />

      {/* ── Discovery ── */}
      {discoverySections.length > 0 && (
        <IntelligenceCard
          icon={<Compass className="h-4 w-4" />}
          eyebrow="Discover"
          title="Foods to explore next"
          data-testid="food-discovery"
        >
          <div className="space-y-3">
            {discoverySections.map((section) => (
              <div key={section.type}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5">
                  {section.title}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {section.suggestions.map((s) =>
                    s.linkable ? (
                      <Link
                        key={s.slug}
                        href={`/foods/${s.slug}`}
                        title={s.reason}
                        className="inline-flex items-center text-xs rounded-full border border-border/60 bg-primary/5 px-2.5 py-1 leading-none text-foreground/80 hover:bg-primary/10 hover:text-foreground transition-colors"
                        data-testid={`food-discovery-link-${s.slug}`}
                      >
                        {s.name}
                      </Link>
                    ) : (
                      <span
                        key={s.slug}
                        title={s.reason}
                        className="inline-flex items-center text-xs rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 leading-none text-muted-foreground"
                      >
                        {s.name}
                      </span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </IntelligenceCard>
      )}

      {/* ── Simply Better Choices ── */}
      {upliftSuggestion && (
        <SimplyBetterChoiceCard
          suggestion={
            upliftSuggestion.action === "swap"
              ? `Swap in ${upliftSuggestion.ingredient}`
              : upliftSuggestion.action === "boost"
                ? `Add more ${upliftSuggestion.ingredient}`
                : `Add ${upliftSuggestion.ingredient}`
          }
          why={upliftSuggestion.why}
          data-testid="food-simply-better"
        />
      )}
    </div>
  );
}
