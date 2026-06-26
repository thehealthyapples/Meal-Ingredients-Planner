// WS0X.6B — Meal Detail Food Intelligence (redesigned).
//
// Presentation redesign: intelligence is now attached to individual ingredients,
// not to the page as a standalone card.
//
// Exports:
//   useMealFoodIntelligence(mealId) — hook; returns per-ingredient lookup + discovery
//   MealDiscoveryRow               — compact "You may also enjoy" row
//
// The old MealFoodIntelligenceSection card ("Why This Meal Is Great") is removed.
// Backend service and API endpoint are unchanged.

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

// ── Types (mirror backend IngredientIntelligence) ────────────────────────────

export interface IngredientIntelligence {
  raw: string;
  nutrients: string[];
  isSeasonal: boolean;
  seasonLabel?: string;
  origin?: string;
  availabilityNote?: string;
}

interface MealFoodIntelligence {
  highlights: string[];
  nutrients: string[];
  benefits: string[];
  plantCount: number;
  seasonalIngredients: Array<{ name: string; season: string }>;
  origins: Array<{ ingredient: string; regionLabel: string }>;
  rareItems: Array<{ ingredient: string; availabilityLabel: string }>;
  discovery: Array<{ slug: string; name: string }>;
  perIngredient: IngredientIntelligence[];
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useMealFoodIntelligence(mealId: number | null) {
  const { data } = useQuery<MealFoodIntelligence>({
    queryKey: ["/api/meals", mealId, "food-intelligence"],
    queryFn: async () => {
      const res = await fetch(`/api/meals/${mealId}/food-intelligence`);
      if (!res.ok) throw new Error("Failed to load food intelligence");
      return res.json();
    },
    enabled: !!mealId,
    staleTime: 5 * 60 * 1000,
  });

  const perIngredientMap = useMemo(() => {
    const map = new Map<string, IngredientIntelligence>();
    for (const item of (data?.perIngredient ?? [])) {
      map.set(item.raw, item);
    }
    return map;
  }, [data]);

  return {
    getIntelligenceFor: (raw: string): IngredientIntelligence | undefined =>
      perIngredientMap.get(raw),
    discovery: data?.discovery ?? [],
  };
}

// ── Discovery row ─────────────────────────────────────────────────────────────

interface MealDiscoveryRowProps {
  discovery: Array<{ slug: string; name: string }>;
}

export function MealDiscoveryRow({ discovery }: MealDiscoveryRowProps) {
  if (discovery.length === 0) return null;
  return (
    <div
      className="mt-4 pt-3 border-t border-border/30"
      data-testid="food-discovery-row"
    >
      <p className="text-xs text-muted-foreground mb-1.5">You may also enjoy</p>
      <div className="flex flex-wrap gap-1.5">
        {discovery.slice(0, 4).map((d) => (
          <Badge key={d.slug} variant="outline" className="text-xs font-normal">
            {d.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}
