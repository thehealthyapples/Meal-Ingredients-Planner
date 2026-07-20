// WX7 — Pantry Intelligence Panel.
//
// The Pantry is the Household Food Library. This panel turns a stored ingredient
// into a living knowledge object by surfacing your household's RELATIONSHIP with
// the food: how it appears in your Cookbook, what it pairs with, your household
// history, what it could unlock, and where to explore next.
//
// It OWNS NOTHING. It reads /api/pantry/intelligence?name=… which resolves the
// item to a canonical food and delegates to the EXISTING Food Intelligence and
// Connected Food Intelligence assemblers (the same owners behind Food Pages,
// the Connected panel and Shopping Intelligence). The "what the food is" view
// (supports, why it matters, how to choose) is owned by the sibling Pantry
// Knowledge card — this panel deliberately does not repeat it (Experience Rule:
// never spammy).
//
// Trust & progressive enrichment: an item that does not resolve to a canonical
// food returns { resolved: false } and the whole panel disappears. Each section
// is independently optional and renders only when its canonical owner produced
// validated content. Nothing is fabricated, estimated, or shown with invented
// confidence.

import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Utensils, Sparkles, Compass, ArrowUpRight } from "lucide-react";
import {
  IntelligenceCard,
  SeasonalCard,
  HouseholdInsightCard,
} from "@/components/intelligence";

// ── Types (mirror the server projection) ──────────────────────────────────────

interface ConnectedRow {
  title: string;
  items: Array<{ slug: string; name: string; linkable: boolean }>;
}

interface PantryIntelligence {
  resolved: boolean;
  slug?: string;
  foodName?: string;
  hasAnySection?: boolean;
  seasonal?: { note: string } | null;
  mealSupport?: {
    count: number;
    atCap: boolean;
    meals: Array<{ mealId: number; name: string }>;
  } | null;
  household?: { headline: string; isNewDiscovery: boolean } | null;
  oftenEnjoyedWith?: ConnectedRow | null;
  similarFoods?: ConnectedRow | null;
  discovery?: {
    title: string;
    slug: string;
    name: string;
    reason: string;
    linkable: boolean;
  } | null;
}

interface Props {
  /** The pantry item's display name (or its canonical ingredient key). */
  name: string | null | undefined;
  "data-testid"?: string;
}

// ── A calm connected-foods chip row (reused for two relationship types) ────────

function ConnectedChips({
  row,
  testidPrefix,
}: {
  row: ConnectedRow;
  testidPrefix: string;
}) {
  return (
    <IntelligenceCard
      icon={<Sparkles className="h-4 w-4" />}
      eyebrow={row.title}
      chips={
        <div className="flex flex-wrap gap-1.5">
          {row.items.map((i) =>
            i.linkable ? (
              <Link
                key={i.slug}
                href={`/foods/${i.slug}`}
                className="inline-flex items-center text-xs rounded-full border border-border/60 bg-primary/5 px-2.5 py-1 leading-none text-foreground/80 hover:bg-primary/10 hover:text-foreground transition-colors"
                data-testid={`${testidPrefix}-${i.slug}`}
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
      data-testid={`${testidPrefix}-card`}
    />
  );
}

export default function PantryIntelligencePanel({ name, ...rest }: Props) {
  const trimmed = (name ?? "").trim();

  const { data } = useQuery<PantryIntelligence>({
    queryKey: ["/api/pantry/intelligence", trimmed],
    queryFn: async () => {
      const res = await fetch(
        `/api/pantry/intelligence?name=${encodeURIComponent(trimmed)}`,
      );
      if (!res.ok) throw new Error("Failed to load pantry intelligence");
      return res.json();
    },
    enabled: trimmed.length > 0,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Not a recognised food, or nothing validated → render nothing.
  if (!data || !data.resolved || !data.hasAnySection) return null;

  const mealCount = data.mealSupport?.count ?? 0;
  const mealLabel =
    data.mealSupport == null
      ? null
      : data.mealSupport.atCap
        ? `In ${mealCount}+ of your Cookbook meals`
        : `In ${mealCount} ${mealCount === 1 ? "meal" : "meals"} in your Cookbook`;

  return (
    <div
      className="space-y-3 pt-2.5"
      data-testid={rest["data-testid"] ?? "pantry-intelligence-panel"}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          Your household &amp; this food
        </span>
        {data.slug && (
          <Link
            href={`/foods/${data.slug}`}
            className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
            data-testid="pantry-intelligence-food-link"
          >
            Food details
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* ── Seasonal (a quiet celebration of timing) ── */}
      {data.seasonal && data.foodName && (
        <SeasonalCard
          headline={data.seasonal.note}
          items={[data.foodName]}
          data-testid="pantry-intelligence-seasonal"
        />
      )}

      {/* ── Meal connections (Meal Intelligence) ── */}
      {data.mealSupport && mealLabel && (
        <IntelligenceCard
          icon={<Utensils className="h-4 w-4" />}
          eyebrow="Meal connections"
          body={mealLabel}
          details={
            data.mealSupport.meals.length > 0 ? (
              <ul className="space-y-1">
                {data.mealSupport.meals.map((m) => (
                  <li key={m.mealId}>
                    <Link
                      href={`/meals/${m.mealId}`}
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                      data-testid={`pantry-intelligence-meal-${m.mealId}`}
                    >
                      {m.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : undefined
          }
          detailsLabel="See meals"
          data-testid="pantry-intelligence-meals"
        />
      )}

      {/* ── Household (favourite or a discovery waiting to happen) ── */}
      {data.household && (
        <HouseholdInsightCard
          headline={data.household.headline}
          data-testid="pantry-intelligence-household"
        />
      )}

      {/* ── Connected foods: often enjoyed with ── */}
      {data.oftenEnjoyedWith && data.oftenEnjoyedWith.items.length > 0 && (
        <ConnectedChips
          row={data.oftenEnjoyedWith}
          testidPrefix="pantry-intelligence-enjoyed-with"
        />
      )}

      {/* ── Connected foods: similar foods ── */}
      {data.similarFoods && data.similarFoods.items.length > 0 && (
        <ConnectedChips
          row={data.similarFoods}
          testidPrefix="pantry-intelligence-similar"
        />
      )}

      {/* UX3 — the "you could" opportunity and the "simply better" upgrade were
          advice, not shelf facts. The Companion gives them; this panel keeps what
          the household's own data says about this food. */}

      {/* ── Discovery: one thoughtful next step ── */}
      {data.discovery && (
        <IntelligenceCard
          icon={<Compass className="h-4 w-4" />}
          eyebrow="Discover next"
          body={
            data.discovery.linkable ? undefined : data.discovery.reason || undefined
          }
          chips={
            <div className="flex flex-wrap items-center gap-1.5">
              {data.discovery.linkable ? (
                <Link
                  href={`/foods/${data.discovery.slug}`}
                  title={data.discovery.reason}
                  className="inline-flex items-center text-xs rounded-full border border-border/60 bg-primary/5 px-2.5 py-1 leading-none text-foreground/80 hover:bg-primary/10 hover:text-foreground transition-colors"
                  data-testid={`pantry-intelligence-discovery-${data.discovery.slug}`}
                >
                  {data.discovery.name}
                </Link>
              ) : (
                <span
                  title={data.discovery.reason}
                  className="inline-flex items-center text-xs rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 leading-none text-muted-foreground"
                >
                  {data.discovery.name}
                </span>
              )}
            </div>
          }
          data-testid="pantry-intelligence-discovery"
        />
      )}
    </div>
  );
}
