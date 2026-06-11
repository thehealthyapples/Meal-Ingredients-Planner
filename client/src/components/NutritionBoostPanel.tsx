/**
 * NutritionBoostPanel.tsx
 * ========================
 * Inline nutrition boost suggestions for the meal detail dialog.
 *
 * Design principles:
 * - Suggestions are opportunities, not requirements
 * - Non-intrusive: compact, collapsible when desired
 * - Deterministic: no AI, no external calls
 * - Planner remains fully usable without interacting with boosts
 */

import React from "react";
import { Leaf } from "lucide-react";
import { getMealBoosts, type NutritionBoostSuggestion, type BoostCategory } from "@/lib/nutrition-boosts";
import type { HouseholdEater } from "@shared/household-eater";
import { computeRestrictionSafety, type EaterProfile } from "@shared/restrictions/restriction-safety";
import { shouldExcludeRecipe } from "@/lib/dietRules";

// ─── Category display config ──────────────────────────────────────────────────

const CATEGORY_LABELS: Record<BoostCategory, string> = {
  legumes: "legume",
  seeds: "seed",
  nuts: "nut",
  herbs: "herb",
  mushrooms: "mushroom",
  fermented: "fermented food",
  "healthy-fats": "healthy fat",
  "extra-veg": "extra veg",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface NutritionBoostPanelProps {
  mealName: string;
  ingredients: string[];
  householdEaters?: HouseholdEater[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NutritionBoostPanel({ mealName, ingredients, householdEaters = [] }: NutritionBoostPanelProps) {
  const candidates = getMealBoosts(mealName, ingredients);

  // Build eater profiles for hard restriction checking
  const eaterProfiles: EaterProfile[] = householdEaters.map((e) => ({
    displayName: e.displayName,
    hardRestrictions: e.hardRestrictions,
  }));

  // Collect all soft diet preferences across the household
  const allDietTypes = householdEaters.flatMap((e) => e.defaultDietTypes);

  // Filter 1: hard restrictions (nut_free, tree_nut, sesame, soy, etc.)
  // Filter 2: diet patterns (Keto legumes, Paleo legumes, etc.)
  // Hard restrictions take priority; a single unsafe result removes the boost.
  const boosts = candidates.filter((boost) => {
    if (eaterProfiles.length > 0) {
      const safety = computeRestrictionSafety([boost.name], eaterProfiles);
      if (safety.some((r) => r.status === "unsafe" || r.status === "warning")) return false;
    }
    for (const diet of allDietTypes) {
      if (shouldExcludeRecipe(boost.name, { dietPattern: diet, dietRestrictions: [] })) return false;
    }
    return true;
  });

  if (boosts.length === 0) return null;

  return (
    <div className="space-y-1.5" data-testid="nutrition-boost-panel">
      <div className="flex items-center gap-1.5">
        <Leaf className="h-3.5 w-3.5 text-emerald-600/70 dark:text-emerald-400/70 flex-shrink-0" />
        <span className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground/50 font-medium">
          Nutrition Boosts
        </span>
      </div>
      <ul className="space-y-1" data-testid="nutrition-boost-list">
        {boosts.map((boost) => (
          <BoostRow key={boost.name} boost={boost} />
        ))}
      </ul>
      <p className="text-[10px] text-muted-foreground/40 italic leading-relaxed">
        Optional additions — stir in, serve alongside, or sprinkle over.
      </p>
    </div>
  );
}

// ─── Single boost row ─────────────────────────────────────────────────────────

function BoostRow({ boost }: { boost: NutritionBoostSuggestion }) {
  return (
    <li
      className="flex items-center gap-2 text-xs text-muted-foreground/70"
      data-testid={`boost-row-${boost.name.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <span className="text-emerald-600/60 dark:text-emerald-400/60 font-medium select-none">+</span>
      <span>{boost.name}</span>
      <span className="text-[10px] text-muted-foreground/35">
        ({CATEGORY_LABELS[boost.category]})
      </span>
    </li>
  );
}
