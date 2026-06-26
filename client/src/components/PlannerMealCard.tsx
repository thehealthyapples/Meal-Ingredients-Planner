/**
 * PlannerMealCard — V2 card content component (compact refinement).
 *
 * Renders the information rows inside a planner meal card button.
 * Does NOT include the outer button wrapper, status icons (frozen/basket/cooked),
 * the boost indicator, or the dropdown menu — those remain in the parent.
 *
 * Design goal: a calm, low-text repurpose of the original planner card. The card
 * leads with compact variety dots (matching the planner's top legend) and pairs
 * them with at most two short nutrition labels only when there is room. It is
 * deliberately NOT a heavy multi-line text layout.
 *
 *   Meal title
 *   [Family Table] [Comfort]          ← max 2 chips
 *   ● ● ●  Veg • Herbs                ← max 3 dots + up to 2 short labels
 *
 * Responsive (single compact line for dots+labels; height never grows):
 *   Mobile  — title, 1 chip, dots only
 *   Tablet  — title, up to 2 chips, dots + 1 short label
 *   Desktop — title, 2 chips, dots + 2 short labels
 *
 * The suitable-for line is intentionally hidden for now (kept off to avoid extra
 * card height). The boost indicator (↳ N boost ideas / Boosted) is rendered by
 * the parent as a sibling below this content, exactly as before.
 */

import type { Meal } from "@shared/schema";
import { getStyleTagDisplayLabel } from "@shared/style-tags";
import { computeMealVariety } from "@shared/canonical/plant-classifier";
import type { VarietyScore } from "@shared/canonical/plant-classifier";

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

// ── Variety dots — colours + short labels mirror the planner top legend ───────
// (nutrition-variety-chips.tsx CATEGORIES). Same five-category VarietyScore model
// so a dot on a card maps directly to the legend above the grid. Short labels are
// kept terse on purpose ("Fats" not "Healthy fats") to avoid card text wrapping.
type VarietyKey = keyof Omit<VarietyScore, "total">;

const VARIETY_DOTS: Array<{ key: VarietyKey; short: string; dot: string }> = [
  { key: "fruits", short: "Fruit", dot: "bg-rose-400" },
  { key: "vegetables", short: "Veg", dot: "bg-green-500" },
  { key: "wholeGrains", short: "Grains", dot: "bg-amber-500" },
  { key: "herbsSpices", short: "Herbs", dot: "bg-violet-400" },
  { key: "oliveOil", short: "Fats", dot: "bg-teal-400" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildChips(styleTags: string[]): Array<{ slug: string; label: string; color: string }> {
  return CHIP_PRIORITY_ORDER.filter((slug) => styleTags.includes(slug)).map((slug) => ({
    slug,
    label: getStyleTagDisplayLabel(slug),
    color: CHIP_COLOR[slug] ?? "bg-muted text-muted-foreground border-border",
  }));
}

// Present variety categories (legend order), each with its dot colour + short
// label. Used to render up to 3 dots and up to 2 labels on the compact line.
function buildVarietyCategories(
  ingredients: string[],
): Array<{ key: VarietyKey; short: string; dot: string }> {
  const score = computeMealVariety(ingredients);
  if (score.total === 0) return [];
  return VARIETY_DOTS.filter((c) => score[c.key] > 0);
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

  // Compact variety line: max 3 dots, max 2 short labels. Dots match the legend.
  const varietyCategories =
    isPlaceholder || isCooked ? [] : buildVarietyCategories(meal.ingredients ?? []);
  const dots = varietyCategories.slice(0, 3);
  const labels = varietyCategories.slice(0, 2);

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
          {/* Line 2: Meal intelligence chips — 1 on mobile, up to 2 from tablet up */}
          {chips.length > 0 && (
            <div className="flex items-center gap-0.5">
              <span
                className={`inline-flex items-center px-1.5 rounded-full text-[10px] font-medium border leading-none h-[18px] ${chips[0].color}`}
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

          {/* Line 3: variety dots + short labels (single calm line, fixed height).
              Mobile: dots only · Tablet: dots + 1 label · Desktop: dots + 2 labels */}
          {dots.length > 0 && (
            <div
              className="flex items-center gap-1 leading-none"
              data-testid={`variety-dots-${entryId}`}
            >
              <span className="flex items-center gap-0.5 shrink-0">
                {dots.map((c) => (
                  <span
                    key={c.key}
                    className={`w-1.5 h-1.5 rounded-full ${c.dot} opacity-70`}
                  />
                ))}
              </span>
              {labels[0] && (
                <span className="hidden sm:inline text-[10px] text-muted-foreground/50 truncate">
                  {labels[0].short}
                </span>
              )}
              {labels[1] && (
                <span className="hidden lg:inline text-[10px] text-muted-foreground/50 truncate">
                  • {labels[1].short}
                </span>
              )}
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
