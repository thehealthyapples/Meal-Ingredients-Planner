// WX6 — Shopping Intelligence Panel.
//
// One reusable, calm panel that surfaces what The Healthy Apples already knows
// about a food, at the moment a purchasing decision is made (viewing a shopping
// item, an analysed product, or food details within shopping).
//
// It OWNS NOTHING. It reads /api/shopping/intelligence?name=… which resolves the
// item to a canonical food and delegates to the existing Food Intelligence and
// Connected Food Intelligence assemblers. The Analyser (Apple Score, additives,
// healthier alternatives) is shown elsewhere in the shopping UI and is reused
// there, never duplicated here.
//
// Trust & progressive enrichment: when the item does not resolve to a canonical
// food the whole panel disappears. Each section is independently optional and
// renders only when its canonical owner produced validated content. Nothing is
// fabricated. Shopping stays the primary task — this is a quiet supporting layer.

import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Utensils, Sparkles, ArrowUpRight } from "lucide-react";
import {
  IntelligenceCard,
  SeasonalCard,
  HouseholdInsightCard,
  SimplyBetterChoiceCard,
} from "@/components/intelligence";

// ── Types (mirror the server projection) ──────────────────────────────────────

interface ShoppingIntelligence {
  resolved: boolean;
  slug?: string;
  foodName?: string;
  seasonal?: { note: string } | null;
  mealSupport?: {
    count: number;
    atCap: boolean;
    meals: Array<{ mealId: number; name: string }>;
  } | null;
  household?: { headline: string; isNewDiscovery: boolean } | null;
  simplyBetter?: { suggestion: string; why: string } | null;
  connectedFoods?: {
    title: string;
    items: Array<{ slug: string; name: string; linkable: boolean }>;
  } | null;
}

interface Props {
  /** The shopping item's resolved canonical name, or its product name. */
  name: string | null | undefined;
  "data-testid"?: string;
}

export default function ShoppingIntelligencePanel({ name, ...rest }: Props) {
  const trimmed = (name ?? "").trim();

  const { data } = useQuery<ShoppingIntelligence>({
    queryKey: ["/api/shopping/intelligence", trimmed],
    queryFn: async () => {
      const res = await fetch(
        `/api/shopping/intelligence?name=${encodeURIComponent(trimmed)}`,
      );
      if (!res.ok) throw new Error("Failed to load shopping intelligence");
      return res.json();
    },
    enabled: trimmed.length > 0,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Not a recognised food, or nothing validated → render nothing.
  if (!data || !data.resolved) return null;

  const mealCount = data.mealSupport?.count ?? 0;
  const mealLabel =
    data.mealSupport == null
      ? null
      : data.mealSupport.atCap
        ? `Appears in ${mealCount}+ of your Cookbook meals`
        : `Appears in ${mealCount} ${mealCount === 1 ? "meal" : "meals"} in your Cookbook`;

  const hasAnySection =
    data.seasonal ||
    data.mealSupport ||
    data.household ||
    data.simplyBetter ||
    data.connectedFoods;

  if (!hasAnySection) return null;

  return (
    <div
      className="space-y-3"
      data-testid={rest["data-testid"] ?? "shopping-intelligence-panel"}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          More about this food
        </span>
        {data.slug && (
          <Link
            href={`/foods/${data.slug}`}
            className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
            data-testid="shopping-intelligence-food-link"
          >
            Food details
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* ── Seasonal (a quiet celebration) ── */}
      {data.seasonal && data.foodName && (
        <SeasonalCard
          headline={data.seasonal.note}
          items={[data.foodName]}
          data-testid="shopping-intelligence-seasonal"
        />
      )}

      {/* ── Meal support ── */}
      {data.mealSupport && mealLabel && (
        <IntelligenceCard
          icon={<Utensils className="h-4 w-4" />}
          eyebrow="Meal support"
          body={mealLabel}
          details={
            data.mealSupport.meals.length > 0 ? (
              <ul className="space-y-1">
                {data.mealSupport.meals.map((m) => (
                  <li key={m.mealId}>
                    <Link
                      href={`/meals/${m.mealId}`}
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                      data-testid={`shopping-intelligence-meal-${m.mealId}`}
                    >
                      {m.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : undefined
          }
          detailsLabel="See meals"
          data-testid="shopping-intelligence-meals"
        />
      )}

      {/* ── Household (favourite or new discovery — evidence-gated) ── */}
      {data.household && (
        <HouseholdInsightCard
          headline={data.household.headline}
          data-testid="shopping-intelligence-household"
        />
      )}

      {/* ── Connected foods: often enjoyed with ── */}
      {data.connectedFoods && data.connectedFoods.items.length > 0 && (
        <IntelligenceCard
          icon={<Sparkles className="h-4 w-4" />}
          eyebrow={data.connectedFoods.title}
          chips={
            <div className="flex flex-wrap gap-1.5">
              {data.connectedFoods.items.map((i) =>
                i.linkable ? (
                  <Link
                    key={i.slug}
                    href={`/foods/${i.slug}`}
                    className="inline-flex items-center text-xs rounded-full border border-border/60 bg-primary/5 px-2.5 py-1 leading-none text-foreground/80 hover:bg-primary/10 hover:text-foreground transition-colors"
                    data-testid={`shopping-intelligence-connected-${i.slug}`}
                  >
                    {i.name}
                  </Link>
                ) : (
                  <span
                    key={i.slug}
                    className="inline-flex items-center text-xs rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 leading-none text-muted-foreground"
                  >
                    {i.name}
                  </span>
                ),
              )}
            </div>
          }
          data-testid="shopping-intelligence-connected"
        />
      )}

      {/* ── Simply Better (the one opportunity) ── */}
      {data.simplyBetter && (
        <SimplyBetterChoiceCard
          suggestion={data.simplyBetter.suggestion}
          why={data.simplyBetter.why}
          data-testid="shopping-intelligence-simply-better"
        />
      )}
    </div>
  );
}
