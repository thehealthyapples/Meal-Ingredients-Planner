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
import { WorkspaceHeader, pageContainerClass } from "@/components/workspace-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadError } from "@/components/ui/load-error";
import { Button } from "@/components/ui/button";
import {
  Apple,
  Leaf,
  Sparkles,
  Utensils,
  Compass,
  Loader2,
  ChefHat,
  Archive,
  Scale,
} from "lucide-react";
import {
  IntelligenceCard,
  IntelligenceChipGroup,
  SeasonalCard,
  HouseholdInsightCard,
  ConnectedFoodPanel,
  FoodPreparationList,
  type FoodPreparation,
} from "@/components/intelligence";

// ── Types (mirror the server FoodIntelligence model) ──────────────────────────

interface FoodIntelligence {
  slug: string;
  food: {
    name: string;
    category: string;
    description: string;
    // SURF1A — the practical knowledge. Published and owned since PUB1; dropped
    // by the assembler before it ever reached this page, so no type here could
    // have carried it. The assembler now composes it from the knowledge owner.
    aliases: string[];
    commonForms: string[];
    storageGuidance: string | null;
  } | null;
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
  /** SURF1A — rendered through the one preparation owner, never re-worded here. */
  preparations: FoodPreparation[];
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

  const { data, isPending: isLoading, isError, error, refetch } = useQuery<FoodIntelligence>({
    queryKey: ["/api/foods", slug, "intelligence"],
    queryFn: async () => {
      const res = await fetch(`/api/foods/${slug}/intelligence`);
      // HOUSE2: a 404 and a 500 used to throw the same error, so a failed load told
      // the household "we don't know this food" — a confident false statement about
      // their food made by a server outage. EmptyState's own contract forbids exactly
      // this conflation ("a failed load is none of these variants").
      if (res.status === 404) throw new Error("not-found");
      if (!res.ok) throw new Error("load-failed");
      return res.json();
    },
    enabled: !!slug,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // HOUSE2 (fnd-food-detail-chrome, fnd-food-detail-back): this page used to render
  // no header at all and a bespoke inline Back hardcoded to `/cookbook` — so a food
  // read as a lesser surface than a meal, and a household arriving from Pantry,
  // Shopping or Nutrition was ejected into the Cookbook regardless.
  //
  // Both are now the canonical header slot. The parent is **Nutrition**, not Cookbook,
  // because that is the realm the platform already assigns this route
  // (`FloatingAssistant.tsx:90` maps `/foods` → "nutrition"); the old Back was the
  // outlier. Back stays hierarchy-resolving rather than `window.history.back()`
  // deliberately — PX1-W4.5 settled that for every Back in the product
  // (`profile-page.tsx:281`, EXP §8 "hierarchy over history"), and a food page
  // reachable from five rooms is exactly the case that rule exists for.
  return (
    <>
    <WorkspaceHeader
      title={data?.food?.name ?? "Food"}
      realm="nutrition"
      back={{ href: "/nutrition", label: "Nutrition" }}
      titleTestId="text-food-detail-title"
    />
    <div className={`${pageContainerClass()} pb-8`}>
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
        </div>
      )}

      {!isLoading && isError && (error as Error)?.message === "load-failed" && (
        <LoadError
          what="this food"
          onRetry={() => refetch()}
          data-testid="food-load-error"
        />
      )}

      {!isLoading && !((error as Error)?.message === "load-failed") && (isError || !data?.food) && (
        <EmptyState
          variant="empty"
          icon={Apple}
          title="We don't know this food yet"
          description="There's nothing we can confidently tell you about it right now. Your Nutrition centre shows the foods your household is already eating."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/nutrition" data-testid="link-food-notfound-nutrition">
                See your Nutrition centre
              </Link>
            </Button>
          }
          data-testid="food-not-found"
        />
      )}

      {!isLoading && data?.food && (
        <FoodIntelligenceView data={data} />
      )}
    </div>
    </>
  );
}

function FoodIntelligenceView({ data }: { data: FoodIntelligence }) {
  const food = data.food!;

  const hasWhy =
    data.healthBenefits.length > 0 || data.nutritionContext.length > 0;

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
        {/* SURF1A — alternative names. Prose, not chips: these are names for the
            same food, and a household reads them, rather than taps them. */}
        {food.aliases.length > 0 && (
          <p
            className="text-xs text-muted-foreground/60 leading-relaxed pl-8 max-w-2xl"
            data-testid="food-aliases"
          >
            <span className="text-muted-foreground/45">Also known as </span>
            {food.aliases.join(", ")}
          </p>
        )}
        {/* FI20 — the way into the Food Comparison Engine (COMP1). "Is this better
            than…?" is the food page's natural question; this hands the built,
            cited engine the current food and lets the household name the other. */}
        <div className="pl-8 pt-1">
          <Link
            href={`/compare?items=${encodeURIComponent(data.slug)}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            data-testid="link-compare"
          >
            <Scale className="h-3.5 w-3.5" />
            Compare with another food
          </Link>
        </div>
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

      {/* ── Varieties (SURF1A) ── */}
      {food.commonForms.length > 0 && (
        <IntelligenceCard
          icon={<Sparkles className="h-4 w-4" />}
          eyebrow="Varieties"
          chips={
            <IntelligenceChipGroup
              items={food.commonForms}
              kind="nutrient"
              aria-label="Varieties"
            />
          }
          data-testid="food-varieties"
        />
      )}

      {/* ── How it's prepared (SURF1A) ──
          The domain is 100% published and, until now, rendered by no React
          component anywhere in the platform. The list owner below holds down the
          rule that an unreviewed preparation says nothing about nutrition — the
          section is complete without a claim, and never invents one to look so. */}
      {data.preparations.length > 0 && (
        <IntelligenceCard
          icon={<ChefHat className="h-4 w-4" />}
          eyebrow="How it's prepared"
          title={`Ways to prepare ${food.name.toLowerCase()}`}
          data-testid="food-preparations-card"
        >
          <FoodPreparationList preparations={data.preparations} />
        </IntelligenceCard>
      )}

      {/* ── Storing it (SURF1A) ── */}
      {food.storageGuidance && (
        <IntelligenceCard
          icon={<Archive className="h-4 w-4" />}
          eyebrow="Storing it"
          body={food.storageGuidance}
          data-testid="food-storage-guidance"
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

      {/* UX3 — the "simply better" swap was advice about the food, not the food.
          The Companion carries it. */}
    </div>
  );
}
