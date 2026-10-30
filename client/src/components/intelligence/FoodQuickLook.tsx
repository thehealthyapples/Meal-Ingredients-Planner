// NUTUI-EXPAND1 — Food Quick Look.
//
// The in-place answer to "what's this food like?" for a food already on screen
// elsewhere in Nutrition (Foods tab rows, Nutrients tab food chips). It reads the
// same canonical owner the full Food Page reads — the Food Intelligence Assembler
// via /api/foods/:slug/intelligence — and renders only the two sections that
// previously required leaving the page to see: health benefits, and the
// Connected Food Panel's food web (oftenEnjoyedWith/similar/seasonal/household).
// Key nutrients are deliberately omitted here: wherever this mounts, the
// nutrient chip is already visible beside the trigger, and a Food Page's own
// FoodReport (a different canonical owner, Domain 23) already shows them again
// on Foods-tab rows — repeating them a third time would be the same fact shown
// by two voices at once, which Architecture Compliance forbids.
//
// It owns nothing and fabricates nothing: absence (a 404 slug, no validated
// benefits, no connected foods) renders as less content, never as an error or
// a placeholder. The full Food Page remains one tap away for anyone who wants
// everything — preparations, storage, seasonality, meals, household history,
// discovery — this is a look, not a replacement.

import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Leaf, ArrowRight } from "lucide-react";
import { IntelligenceCard } from "./IntelligenceCard";
import { IntelligenceChipGroup } from "./IntelligenceChip";
import { ConnectedFoodPanel } from "./ConnectedFoodPanel";
import { Skeleton } from "@/components/ui/skeleton";
import type { FoodIntelligence } from "@/pages/food-detail-page";

export function FoodQuickLook({ slug }: { slug: string }) {
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

  return (
    <div className="space-y-3 py-1" data-testid={`quicklook-${slug}`}>
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
          data-testid={`quicklook-why-${slug}`}
        />
      )}

      <ConnectedFoodPanel slug={slug} />

      <Link
        href={`/foods/${slug}`}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        data-testid={`quicklook-full-page-${slug}`}
      >
        View full food page
        <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </Link>
    </div>
  );
}
