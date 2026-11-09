// NUTUI-EXPAND1 — Food Quick Look.
//
// The in-place answer to "what's this food like?" for a food already on screen
// elsewhere in Nutrition (Foods tab rows, Nutrients tab food chips). It reads the
// same canonical owner the full Food Page reads — the Food Intelligence Assembler
// via /api/foods/:slug/intelligence — and renders health benefits, recommended
// pairings (FOODUI5 — e.g. turmeric → black pepper), and the Connected Food
// Panel's food web (oftenEnjoyedWith/similar/seasonal/household): the sections
// a household wants immediately on finding a food, not buried behind another
// click. Key nutrient NAMES are deliberately omitted here: wherever this
// mounts, the nutrient chip is already visible beside the trigger, and a Food
// Page's own FoodReport (a different canonical owner, Domain 23) already
// shows them again on Foods-tab rows — repeating them a third time would be
// the same fact shown by two voices at once, which Architecture Compliance
// forbids. Real per-100g AMOUNTS (2026-10-31) are a different fact FoodReport
// never states at all, so they render here without that conflict — the
// answer to "why can Google show 390mcg of vitamin K but THA only shows the
// name?" (the USDA record always had it; nothing before this read past 6 of
// its ~110 fields).
//
// It owns nothing and fabricates nothing: absence (a 404 slug, no validated
// benefits, no connected foods) renders as less content, never as an error or
// a placeholder. The full Food Page remains one tap away for anyone who wants
// everything — preparations, storage, seasonality, meals, household history,
// discovery — this is a look, not a replacement.

import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Leaf, ArrowRight, Link2, Sparkles } from "lucide-react";
import { IntelligenceCard } from "./IntelligenceCard";
import { IntelligenceChipGroup } from "./IntelligenceChip";
import { ConnectedFoodPanel } from "./ConnectedFoodPanel";
import { Skeleton } from "@/components/ui/skeleton";
import type { FoodIntelligence } from "@/pages/food-detail-page";

// Display order and labels for usdaSnapshot.per100g — macros first (already
// shown elsewhere as "Compare" metrics), then the vitamins/minerals that
// previously only existed as a name in Key Nutrients, never a number.
const NUTRIENT_LABELS: Array<[key: string, label: string]> = [
  ["calories", "Calories"], ["protein", "Protein"], ["carbs", "Carbs"],
  ["fat", "Fat"], ["fibre", "Fibre"], ["sugar", "Sugar"],
  ["vitaminK", "Vitamin K"], ["vitaminC", "Vitamin C"], ["vitaminA", "Vitamin A"],
  ["vitaminE", "Vitamin E"], ["vitaminB6", "Vitamin B6"], ["folate", "Folate"],
  ["calcium", "Calcium"], ["potassium", "Potassium"], ["iron", "Iron"],
  ["magnesium", "Magnesium"], ["zinc", "Zinc"], ["sodium", "Sodium"],
  ["phosphorus", "Phosphorus"], ["manganese", "Manganese"], ["copper", "Copper"],
  ["betaCarotene", "Beta-carotene"], ["luteinZeaxanthin", "Lutein + zeaxanthin"],
];

// FOODUI1 follow-up (2026-10-30) — when a consumer passes `onSelectFood`, both
// a "similar foods" chip and "View full food page" call it instead of
// navigating to /foods/:slug, so a food can be reviewed inline (e.g.
// WeekFoodExplorer's "related" column) instead of leaving the page the
// household was already on. Consumers that don't pass it keep the original
// navigating-Link behaviour, unchanged.
export function FoodQuickLook({ slug, onSelectFood }: { slug: string; onSelectFood?: (slug: string, name: string) => void }) {
  const { data, isPending, isError } = useQuery<FoodIntelligence>({
    // Same queryKey the full Food Page uses, so opening this and later opening
    // /foods/:slug for the same food shares one cache entry rather than two.
    queryKey: ["/api/foods", slug, "intelligence"],
    queryFn: async () => {
      const res = await fetch(`/api/foods/${slug}/intelligence`);
      if (!res.ok) throw new Error(res.status === 404 ? "not-found" : "load-failed");
      return res.json();
    },
    enabled: !!slug,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isPending) {
    return (
      <div className="space-y-2 py-2" aria-busy="true" aria-label="Loading" data-testid={`quicklook-loading-${slug}`}>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
    );
  }

  // Progressive enrichment: an unknown slug or a failed read disappears rather
  // than reporting an error for what is, on this surface, a secondary panel.
  if (isError || !data?.food) return null;

  const hasWhy = data.healthBenefits.length > 0 || data.nutritionContext.length > 0;

  const nutrientRows = data.usdaSnapshot
    ? NUTRIENT_LABELS.flatMap(([key, label]) => {
        const value = data.usdaSnapshot!.per100g[key];
        if (value == null) return [];
        return [{ label, value: `${value} ${data.usdaSnapshot!.units[key]}` }];
      })
    : [];

  return (
    <div className="space-y-3 py-1" data-testid={`quicklook-${slug}`}>
      {nutrientRows.length > 0 && (
        <IntelligenceCard
          icon={<Sparkles className="h-4 w-4" />}
          eyebrow="Nutrient amounts"
          title={`Per 100g, raw (USDA FoodData Central)`}
          data-testid={`quicklook-amounts-${slug}`}
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {nutrientRows.map((r) => (
              <div key={r.label} className="flex items-baseline justify-between gap-2 border-b border-border/30 py-0.5">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-medium text-foreground/85 tabular-nums">{r.value}</span>
              </div>
            ))}
          </div>
        </IntelligenceCard>
      )}

      {hasWhy && (
        <IntelligenceCard
          icon={<Leaf className="h-4 w-4" />}
          eyebrow="Why it matters"
          body={data.nutritionContext[0] ?? undefined}
          chips={
            data.healthBenefits.length > 0 ? (
              <IntelligenceChipGroup
                items={data.healthBenefits}
                kind="benefit"
                max={6}
                aria-label="Health benefits"
              />
            ) : undefined
          }
          // 2026-10-31 — only the FIRST context note ever showed here; a
          // pairing/absorption note (e.g. "pair with vitamin C for iron
          // absorption") further down the list was silently dropped in this
          // lighter view, visible only on the full food page. Matches
          // food-detail-page.tsx's own details/detailsLabel pattern exactly.
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
          data-testid={`quicklook-why-${slug}`}
        />
      )}

      {/* FOODUI5 — reviewed uplift-rule content, authored from this food's own
          side ("turmeric" names "black pepper" as its real partner). Already
          fetched on this same query; just not rendered here until now. */}
      {data.recommendedPairings.length > 0 && (
        <IntelligenceCard
          icon={<Link2 className="h-4 w-4" />}
          eyebrow="Recommended pairing"
          title={`What pairs well with ${data.food.name.toLowerCase()}`}
          data-testid={`quicklook-pairing-${slug}`}
        >
          <ul className="space-y-1 text-xs text-foreground/80">
            {data.recommendedPairings.map((pairing, i) => (
              <li key={i}>{pairing.why}</li>
            ))}
          </ul>
        </IntelligenceCard>
      )}

      <ConnectedFoodPanel slug={slug} onSelectFood={onSelectFood} />

      {onSelectFood ? (
        <button
          type="button"
          onClick={() => onSelectFood(slug, data.food!.name)}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          data-testid={`quicklook-full-page-${slug}`}
        >
          View full food page
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </button>
      ) : (
        <Link
          href={`/foods/${slug}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          data-testid={`quicklook-full-page-${slug}`}
        >
          View full food page
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
