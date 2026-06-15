/**
 * PlannerMealCard — V2 card content component.
 *
 * Renders the information rows inside a planner meal card button.
 * Does NOT include the outer button wrapper, status icons (frozen/basket/cooked),
 * the boost indicator, or the dropdown menu — those remain in the parent.
 *
 * Layout (desktop):
 *   Line 1 — Meal title
 *   Line 2 — Meal intelligence chips (max 2, then +N)
 *   Line 3 — Nutrition contribution text (max 3 categories, then +N)
 *   Optional — "Suitable for: Slot • Slot" (shell meals with >1 slot only)
 *
 * Layout (mobile):
 *   Line 1 — Meal title
 *   Line 2 — Single chip (first-priority only)
 *   (Nutrition and suitable lines hidden)
 *
 * Boost indicator (↳ N boost ideas / Boosted) is rendered by the parent as a
 * sibling button below the card content, exactly as before.
 */

import type { Meal } from "@shared/schema";
import { getStyleTagDisplayLabel } from "@shared/style-tags";
import { getPlantCategory } from "@/lib/nutrition-variety";
import type { PlantCategory } from "@/lib/nutrition-variety";

// ── Chip priority: lower index → shown first ──────────────────────────────────
const CHIP_PRIORITY_ORDER = [
  "shared-meal",
  "adaptable",
  "family-pleaser",
  "comfort",
  "quick",
  "fresh",
  "indulgent",
  "buffet",
  "bar",
  "one-pot",
] as const;

// ── Chip colours — calm, subtle, consistent with dietary pills ────────────────
const CHIP_COLOR: Record<string, string> = {
  "shared-meal":
    "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60",
  adaptable:
    "bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800/60",
  "family-pleaser":
    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/60",
  comfort:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60",
  quick:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60",
  fresh:
    "bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800/60",
  indulgent:
    "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60",
  buffet:
    "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700/60",
  bar: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700/60",
  "one-pot":
    "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-800/60",
};

// ── Nutrition category short labels ──────────────────────────────────────────
const CATEGORY_LABEL: Partial<Record<PlantCategory, string>> = {
  Vegetables: "Veg",
  Fruits: "Fruit",
  Legumes: "Protein",
  "Whole Grains": "Whole grains",
  "Herbs & Spices": "Herbs",
  Seeds: "Seeds",
  Nuts: "Nuts",
  "Olive Oil": "Healthy fats",
  "Fermented Foods": "Fermented",
};

// Priority order for nutrition categories in the display line.
const CATEGORY_PRIORITY: PlantCategory[] = [
  "Vegetables",
  "Fruits",
  "Legumes",
  "Whole Grains",
  "Herbs & Spices",
  "Seeds",
  "Nuts",
  "Olive Oil",
  "Fermented Foods",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildChips(styleTags: string[]): Array<{ slug: string; label: string; color: string }> {
  return CHIP_PRIORITY_ORDER.filter((slug) => styleTags.includes(slug)).map((slug) => ({
    slug,
    label: getStyleTagDisplayLabel(slug),
    color: CHIP_COLOR[slug] ?? "bg-muted text-muted-foreground border-border",
  }));
}

function buildNutritionCategories(ingredients: string[]): string[] {
  const found = new Set<PlantCategory>();
  for (const ing of ingredients) {
    const cat = getPlantCategory(ing);
    if (cat) found.add(cat);
  }
  return CATEGORY_PRIORITY.filter((cat) => found.has(cat)).map(
    (cat) => CATEGORY_LABEL[cat] ?? cat,
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface PlannerMealCardContentProps {
  meal: Meal;
  entryId: number;
  isPlaceholder: boolean;
  isCooked: boolean;
}

export function PlannerMealCardContent({
  meal,
  entryId,
  isPlaceholder,
  isCooked,
}: PlannerMealCardContentProps) {
  const chips = buildChips(meal.styleTags ?? []);
  const chipOverflow = Math.max(0, chips.length - 2);

  const nutritionCategories =
    isPlaceholder || isCooked ? [] : buildNutritionCategories(meal.ingredients ?? []);
  const nutritionOverflow = Math.max(0, nutritionCategories.length - 3);

  // Suitable-for line: only for shell meals with more than one eligible slot.
  const isShell = (meal.styleTags ?? []).includes("shared-meal");
  const suitableSlots = meal.suitableSlots ?? [];
  const showSuitable = isShell && !isPlaceholder && !isCooked && suitableSlots.length > 1;
  const suitableLabel = suitableSlots
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" • ");

  return (
    <div
      className={`flex-1 min-w-0 flex flex-col gap-0.5 ${
        isPlaceholder ? "border border-dashed border-muted-foreground/30 rounded px-1 py-0.5" : ""
      }`}
    >
      {/* Line 1: Meal title */}
      <span className={`break-words leading-tight pr-3 ${isCooked ? "line-through" : ""}`}>
        {meal.name}
      </span>

      {/* Intelligence rows — only for real, un-cooked meals */}
      {!isPlaceholder && !isCooked && (
        <>
          {/* Line 2: Meal intelligence chips */}
          {chips.length > 0 && (
            <div className="flex items-center gap-0.5">
              {/* Mobile: single highest-priority chip */}
              <span
                className={`sm:hidden inline-flex items-center px-1.5 rounded-full text-[10px] font-medium border leading-none h-[18px] ${chips[0].color}`}
              >
                {chips[0].label}
              </span>

              {/* Desktop: up to 2 chips */}
              <span
                className={`hidden sm:inline-flex items-center px-1.5 rounded-full text-[10px] font-medium border leading-none h-[18px] ${chips[0].color}`}
              >
                {chips[0].label}
              </span>
              {chips[1] && (
                <span
                  className={`hidden sm:inline-flex items-center px-1.5 rounded-full text-[10px] font-medium border leading-none h-[18px] ${chips[1].color}`}
                >
                  {chips[1].label}
                </span>
              )}
              {chipOverflow > 0 && (
                <span className="hidden sm:inline text-[9px] text-muted-foreground/40">
                  +{chipOverflow}
                </span>
              )}
            </div>
          )}

          {/* Line 3: Nutrition contribution (desktop only) */}
          {nutritionCategories.length > 0 && (
            <div className="hidden sm:flex items-center text-[11px] text-muted-foreground/50 leading-none">
              {nutritionCategories.slice(0, 3).join(" • ")}
              {nutritionOverflow > 0 && (
                <span className="ml-0.5 text-[9px] text-muted-foreground/35">
                  +{nutritionOverflow}
                </span>
              )}
            </div>
          )}

          {/* Optional: Suitable-for line (desktop only, shell meals >1 slot) */}
          {showSuitable && (
            <div
              className="hidden sm:flex items-center text-[10px] text-muted-foreground/35 leading-none"
              data-testid={`suitable-slots-${entryId}`}
            >
              {suitableLabel}
            </div>
          )}
        </>
      )}

      {/* Placeholder state */}
      {isPlaceholder && (
        <span
          className="text-[9px] text-muted-foreground/60 italic"
          data-testid={`label-placeholder-${entryId}`}
        >
          Needs recipe
        </span>
      )}

      {/* Cooked state */}
      {isCooked && (
        <span className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70">Cooked</span>
      )}
    </div>
  );
}
