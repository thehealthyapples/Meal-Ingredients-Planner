// WX5 — Connected Food Panel.
//
// Renders the connected food ecosystem for one Food Page: the validated
// relationship web assembled by the server ConnectedFoodIntelligenceAssembler
// (/api/foods/:slug/connected). It owns NO intelligence and fabricates nothing —
// it renders only the sections the server returns, and a food chip is clickable
// only when the server marked it `linkable` (a /foods/:slug page exists). Missing
// relationships simply don't appear; an all-empty response renders nothing.

import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Network } from "lucide-react";
import { IntelligenceCard } from "./IntelligenceCard";

// ── Types (mirror the server ConnectedFoodIntelligence model) ─────────────────

interface ConnectedFoodLink {
  slug: string;
  name: string;
  reason: string;
  linkable: boolean;
}
interface ConnectedMealLink {
  mealId: number;
  name: string;
  imageUrl: string | null;
}
interface ConnectedBetterChoice {
  suggestion: string;
  why: string;
}
interface FoodSection<T> {
  type: string;
  title: string;
  items: T[];
}
interface ConnectedFoodIntelligence {
  slug: string;
  food: { name: string } | null;
  oftenEnjoyedWith: FoodSection<ConnectedFoodLink> | null;
  similarFoods: FoodSection<ConnectedFoodLink> | null;
  oftenAppearsIn: FoodSection<ConnectedMealLink> | null;
  discoverNext: FoodSection<ConnectedFoodLink> | null;
  seasonalConnections: FoodSection<ConnectedFoodLink> | null;
  householdConnections: FoodSection<ConnectedFoodLink> | null;
  simplyBetterChoices: FoodSection<ConnectedBetterChoice> | null;
}

// ── Chip renderers ─────────────────────────────────────────────────────────────

function FoodChips({ items }: { items: ConnectedFoodLink[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s) =>
        s.linkable ? (
          <Link
            key={s.slug}
            href={`/foods/${s.slug}`}
            title={s.reason}
            className="inline-flex items-center text-xs rounded-full border border-border/60 bg-primary/5 px-2.5 py-1 leading-none text-foreground/80 hover:bg-primary/10 hover:text-foreground transition-colors"
            data-testid={`connected-food-link-${s.slug}`}
          >
            {s.name}
          </Link>
        ) : (
          <span
            key={s.slug}
            title={s.reason}
            className="inline-flex items-center text-xs rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 leading-none text-muted-foreground"
            data-testid={`connected-food-chip-${s.slug}`}
          >
            {s.name}
          </span>
        ),
      )}
    </div>
  );
}

function FoodRelationshipBlock({
  section,
}: {
  section: FoodSection<ConnectedFoodLink> | null;
}) {
  if (!section || section.items.length === 0) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5">
        {section.title}
      </p>
      <FoodChips items={section.items} />
    </div>
  );
}

// ── Panel ───────────────────────────────────────────────────────────────────────

export function ConnectedFoodPanel({ slug }: { slug: string }) {
  const { data } = useQuery<ConnectedFoodIntelligence>({
    queryKey: ["/api/foods", slug, "connected"],
    queryFn: async () => {
      const res = await fetch(`/api/foods/${slug}/connected`);
      if (!res.ok) throw new Error("not-found");
      return res.json();
    },
    enabled: !!slug,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (!data?.food) return null;

  // The panel renders the lateral food→food web. Related Meals, Discover Next and
  // Simply Better Choices are already presented elsewhere on the Food Page, so we
  // do not repeat them here (Experience Rule: never spammy). They remain available
  // on the /connected endpoint for other surfaces.
  const foodSections = [
    data.oftenEnjoyedWith,
    data.similarFoods,
    data.seasonalConnections,
    data.householdConnections,
  ];
  const hasFoodWeb = foodSections.some((s) => s && s.items.length > 0);

  // Progressive enrichment: nothing validated ⇒ render nothing.
  if (!hasFoodWeb) return null;

  return (
    <IntelligenceCard
      icon={<Network className="h-4 w-4" />}
      eyebrow="Connected foods"
      title={`Explore the food web around ${data.food.name.toLowerCase()}`}
      data-testid="connected-food-panel"
    >
      <div className="space-y-3">
        {foodSections.map((section) =>
          section ? (
            <FoodRelationshipBlock key={section.type} section={section} />
          ) : null,
        )}
      </div>
    </IntelligenceCard>
  );
}
