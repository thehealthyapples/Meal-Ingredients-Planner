import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Leaf, Check, ChevronRight, Compass } from "lucide-react";
import { isPlantIngredient, getPlantCategory } from "@/lib/nutrition-variety";
import type { PlantCategory } from "@/lib/nutrition-variety";
import { normaliseForReuse } from "@/lib/ingredient-reuse";
import { getNutritionBenefit } from "@/lib/nutrition-benefit-library";
import { getCategoryEmoji } from "@/lib/ingredient-imagery";
import {
  COLUMN_LABELS,
  TERMINOLOGY,
  EMPTY_STATES,
  HEALTH_DISCLAIMER,
  getFoodHealthProfile,
} from "@/lib/health-benefits-model";
// WS2B — educational variety surfacing (read-only; never feeds plant counting).
import {
  buildRowVarietyDisplays,
  type CanonicalVarietyDisplay,
} from "@shared/canonical/variety";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeekMealEntry {
  mealName: string;
  dayName: string;
  ingredients: string[];
}

interface PlantRow {
  canonicalKey: string;
  displayName: string;
  category: PlantCategory;
  variants: string[];
  mealNames: string[];
  dayNames: string[];
  keyNutrients: string[];
  benefitSummary: string | null;
}

export type SortKey = "plant" | "category" | "meals";

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKLY_PLANT_TARGET = 30;

const CATEGORY_ORDER: PlantCategory[] = [
  "Vegetables",
  "Fruits",
  "Legumes",
  "Whole Grains",
  "Seeds",
  "Nuts",
  "Herbs & Spices",
  "Olive Oil",
  "Fermented Foods",
];

// Per-category completion suggestions — drawn from Nutrition Benefit Library
// ingredients where possible so nutrient data is already available.
const CATEGORY_SUGGESTIONS: Record<PlantCategory, string[]> = {
  "Vegetables":      ["Spinach", "Kale"],
  "Fruits":          ["Avocado", "Blueberries"],
  "Legumes":         ["Chickpeas", "Lentils"],
  "Whole Grains":    ["Oats", "Brown Rice"],
  "Seeds":           ["Pumpkin Seeds", "Chia Seeds"],
  "Nuts":            ["Walnuts", "Almonds"],
  "Herbs & Spices":  ["Basil", "Coriander"],
  "Olive Oil":       ["Extra Virgin Olive Oil"],
  "Fermented Foods": ["Sauerkraut", "Kimchi"],
};

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "plant", label: COLUMN_LABELS.plant },
  { key: "category", label: "Category" },
  { key: "meals", label: COLUMN_LABELS.meals },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDisplayName(key: string): string {
  return key.replace(/\b\w/g, (c) => c.toUpperCase());
}

function stripLeadingQuantity(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^\d+(\.\d+)?\s*(g|kg|ml|l|tsp|tbsp|cup|cups|oz|lb|lbs|x)?\s*/i, "")
    .replace(/^[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]\s*/, "")
    .trim();
}

// ─── Data builder ─────────────────────────────────────────────────────────────

function computePlantData(weekMeals: WeekMealEntry[]): {
  plantRows: PlantRow[];
  categoriesFound: Set<PlantCategory>;
} {
  const rowMap = new Map<
    string,
    {
      displayName: string;
      category: PlantCategory;
      rawVariants: Set<string>;
      mealNames: Set<string>;
      dayNames: Set<string>;
      keyNutrients: string[];
      benefitSummary: string | null;
    }
  >();

  for (const meal of weekMeals) {
    for (const raw of meal.ingredients) {
      if (!raw.trim()) continue;
      if (!isPlantIngredient(raw)) continue;

      const canonicalKey = normaliseForReuse(raw);
      if (!canonicalKey) continue;

      if (!rowMap.has(canonicalKey)) {
        const benefit = getNutritionBenefit(canonicalKey);
        const category = getPlantCategory(canonicalKey) ?? "Vegetables";
        rowMap.set(canonicalKey, {
          displayName: toDisplayName(canonicalKey),
          category,
          rawVariants: new Set(),
          mealNames: new Set(),
          dayNames: new Set(),
          keyNutrients: benefit?.keyNutrients ?? [],
          benefitSummary: benefit?.summary ?? null,
        });
      }

      const entry = rowMap.get(canonicalKey)!;
      entry.mealNames.add(meal.mealName);
      entry.dayNames.add(meal.dayName);

      // Record variant if the stripped raw form differs from the canonical display name
      const stripped = stripLeadingQuantity(raw);
      const variantDisplay = toDisplayName(stripped);
      if (variantDisplay.toLowerCase() !== entry.displayName.toLowerCase()) {
        entry.rawVariants.add(variantDisplay);
      }
    }
  }

  const plantRows: PlantRow[] = Array.from(rowMap.entries()).map(
    ([canonicalKey, data]) => ({
      canonicalKey,
      displayName: data.displayName,
      category: data.category,
      variants: Array.from(data.rawVariants).sort(),
      mealNames: Array.from(data.mealNames),
      dayNames: Array.from(data.dayNames),
      keyNutrients: data.keyNutrients,
      benefitSummary: data.benefitSummary,
    }),
  );

  plantRows.sort((a, b) => {
    const catA = CATEGORY_ORDER.indexOf(a.category);
    const catB = CATEGORY_ORDER.indexOf(b.category);
    if (catA !== catB) return catA - catB;
    return a.displayName.localeCompare(b.displayName);
  });

  const categoriesFound = new Set<PlantCategory>(
    plantRows.map((r) => r.category),
  );

  return { plantRows, categoriesFound };
}

function sortPlantRows(rows: PlantRow[], sortKey: SortKey): PlantRow[] {
  const sorted = [...rows];
  switch (sortKey) {
    case "plant":
      sorted.sort((a, b) => a.displayName.localeCompare(b.displayName));
      break;
    case "meals":
      sorted.sort(
        (a, b) =>
          b.mealNames.length - a.mealNames.length ||
          a.displayName.localeCompare(b.displayName),
      );
      break;
    case "category":
    default:
      sorted.sort((a, b) => {
        const catA = CATEGORY_ORDER.indexOf(a.category);
        const catB = CATEGORY_ORDER.indexOf(b.category);
        if (catA !== catB) return catA - catB;
        return a.displayName.localeCompare(b.displayName);
      });
  }
  return sorted;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryGrid({
  categoriesFound,
}: {
  categoriesFound: Set<PlantCategory>;
}) {
  return (
    <div className="px-5 py-4 border-b border-border/50">
      <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wide mb-3">
        Categories Covered
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
        {CATEGORY_ORDER.map((cat) => {
          const covered = categoriesFound.has(cat);
          return (
            <div
              key={cat}
              className={`flex items-center gap-2 text-xs ${
                covered ? "text-foreground/80" : "text-muted-foreground/35"
              }`}
            >
              {covered ? (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/15 flex-shrink-0">
                  <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                </span>
              ) : (
                <span className="h-4 w-4 rounded-full border border-muted-foreground/20 flex-shrink-0" />
              )}
              {cat}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryCompletionSuggestions({
  categoriesFound,
}: {
  categoriesFound: Set<PlantCategory>;
}) {
  const missingCategories = CATEGORY_ORDER.filter(
    (cat) => !categoriesFound.has(cat),
  );

  if (missingCategories.length === 0) return null;

  return (
    <div className="px-5 py-4 border-b border-border/50">
      <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wide mb-3">
        Easy additions to broaden your week
      </p>
      <div className="space-y-3">
        {missingCategories.map((cat) => {
          const suggestions = CATEGORY_SUGGESTIONS[cat];
          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-medium text-muted-foreground/50">
                  {cat}
                </p>
                {/* Cross-link: explore this missing category in the Pantry hub */}
                <Link
                  href="/pantry?mode=explore"
                  className="text-[10px] font-medium text-emerald-700/70 dark:text-emerald-400/70 hover:underline"
                  data-testid={`link-explore-category-${cat}`}
                >
                  Explore in Pantry →
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((name) => {
                  const benefit = getNutritionBenefit(normaliseForReuse(name));
                  return (
                    <div
                      key={name}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/40"
                    >
                      <span className="text-xs font-medium text-foreground/80">
                        {name}
                      </span>
                      {benefit && benefit.keyNutrients.length > 0 && (
                        <span className="text-[11px] text-emerald-700/60 dark:text-emerald-400/60 font-medium">
                          {benefit.keyNutrients.slice(0, 2).join(" · ")}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SortControl({
  sortKey,
  onChange,
}: {
  sortKey: SortKey;
  onChange: (key: SortKey) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[10px] font-medium text-muted-foreground/45 uppercase tracking-wide mr-1">
        Sort by
      </span>
      {SORT_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          aria-pressed={sortKey === opt.key}
          className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
            sortKey === opt.key
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40 font-medium"
              : "bg-muted/30 text-muted-foreground/60 border-border/40 hover:text-foreground/80"
          }`}
          data-testid={`button-sort-${opt.key}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Report table ─────────────────────────────────────────────────────────────
// Visible structure: Plant | Health Benefits | Key Nutrients | Meals.
// Semantic <table> enforces consistent column widths across rows so it reads as
// a report. Secondary columns collapse on narrow widths; the plant cell carries
// a stacked summary line instead.

// WS2B — "Your Variety" (eaten) + "Broaden Your Variety" (defined-but-not-eaten),
// surfaced ONLY from canonical varieties WS2A already defined. Read-only and
// fully decoupled from plant counting. Renders nothing when there is no canonical
// variety data — no empty cards, no placeholder copy.
function CanonicalVarietySections({ variety }: { variety: CanonicalVarietyDisplay }) {
  const hasYours = variety.yourVarieties.length > 0;
  const hasBroaden = variety.broadenVarieties.length > 0;
  if (!hasYours && !hasBroaden) return null;

  return (
    <>
      {hasYours && (
        <div data-testid={`variety-yours-${variety.canonicalSlug}`}>
          <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide mb-1.5">
            {TERMINOLOGY.yourVariety}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {variety.yourVarieties.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
              >
                <Check className="h-2.5 w-2.5" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {hasBroaden && (
        <div data-testid={`variety-broaden-${variety.canonicalSlug}`}>
          <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide mb-1.5">
            {TERMINOLOGY.broadenYourVariety}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {variety.broadenVarieties.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-muted/50 text-foreground/60 border border-border/40"
              >
                <span
                  className="h-2 w-2 rounded-full border border-muted-foreground/40"
                  aria-hidden="true"
                />
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function PlantReportRow({
  row,
  variety,
  expanded,
  onToggle,
}: {
  row: PlantRow;
  variety?: CanonicalVarietyDisplay;
  expanded: boolean;
  onToggle: () => void;
}) {
  // Shared display model. healthBenefits is empty until the benefit registry is
  // populated, so the Health Benefits column shows a safe empty state today.
  const profile = getFoodHealthProfile(row.canonicalKey, {
    displayName: row.displayName,
    category: row.category,
  });
  const healthBenefits = profile?.healthBenefits ?? [];
  const hasBenefits = healthBenefits.length > 0;
  const mealCount = row.mealNames.length;

  return (
    <>
      {/* ── Collapsed row ─────────────────────────────────────── */}
      <tr
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        tabIndex={0}
        aria-expanded={expanded}
        className="border-b border-border/30 hover:bg-muted/20 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-1 focus-visible:ring-ring"
        data-testid={`row-plant-${row.canonicalKey}`}
      >
        {/* Plant — always visible */}
        <td className="px-5 py-2.5 align-middle">
          <div className="flex items-center gap-2 min-w-0">
            <ChevronRight
              className={`h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0 transition-transform duration-150 ${
                expanded ? "rotate-90" : ""
              }`}
              aria-hidden="true"
            />
            <span className="text-base leading-none flex-shrink-0" aria-hidden="true">
              {getCategoryEmoji(row.category)}
            </span>
            <div className="min-w-0">
              <span className="block text-sm font-medium text-foreground/90 truncate">
                {row.displayName}
              </span>
              {/* Mobile: nutrients + meal count stacked (columns hidden on mobile) */}
              <span className="md:hidden block text-[11px] text-muted-foreground/55 mt-0.5">
                {row.keyNutrients.length > 0 && (
                  <span className="text-emerald-700/60 dark:text-emerald-400/60 font-medium">
                    {row.keyNutrients.slice(0, 2).join(" · ")}
                  </span>
                )}
                {row.keyNutrients.length > 0 && " · "}
                {mealCount} {mealCount === 1 ? "meal" : "meals"}
              </span>
            </div>
          </div>
        </td>

        {/* Health Benefits — desktop only (empty state until data populated) */}
        <td className="hidden md:table-cell px-4 py-2.5 align-middle">
          {hasBenefits ? (
            <span className="text-xs text-foreground/80">
              {healthBenefits[0]?.emoji ? `${healthBenefits[0].emoji} ` : ""}
              {healthBenefits[0]?.name}
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground/35 italic">
              {EMPTY_STATES.healthBenefitsComingSoon}
            </span>
          )}
        </td>

        {/* Key Nutrients — desktop only (real curated data) */}
        <td className="hidden md:table-cell px-4 py-2.5 align-middle">
          {row.keyNutrients.length > 0 ? (
            <span className="text-[11px] text-emerald-700/60 dark:text-emerald-400/60 font-medium">
              {row.keyNutrients.slice(0, 2).join(" · ")}
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground/30">—</span>
          )}
        </td>

        {/* Meals — desktop only: count, not a long inline list */}
        <td className="hidden md:table-cell px-5 py-2.5 align-middle text-right">
          <span className="text-xs text-muted-foreground/70 whitespace-nowrap tabular-nums">
            {mealCount} {mealCount === 1 ? "meal" : "meals"}
            <ChevronRight
              className={`inline h-3 w-3 ml-0.5 text-muted-foreground/40 transition-transform duration-150 ${
                expanded ? "rotate-90" : ""
              }`}
              aria-hidden="true"
            />
          </span>
        </td>
      </tr>

      {/* ── Expanded row ──────────────────────────────────────── */}
      {expanded && (
        <tr className="bg-muted/10 border-b border-border/20">
          <td colSpan={4} className="px-5 pb-4 pt-2">
            <div className="space-y-4">
              {/* More Health Benefits — empty state until benefit registry exists */}
              <div>
                <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide mb-1.5">
                  {TERMINOLOGY.moreHealthBenefits}
                </p>
                {hasBenefits ? (
                  <div className="flex flex-wrap gap-1.5">
                    {healthBenefits.map((b) => (
                      <span
                        key={b.name}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-muted/50 text-foreground/70 border border-border/40"
                      >
                        {b.emoji ? `${b.emoji} ` : ""}
                        {b.name}
                        {b.nutrient ? (
                          <span className="text-muted-foreground/45">
                            · {b.nutrient}
                          </span>
                        ) : null}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/45 italic">
                    {EMPTY_STATES.noHealthBenefits}
                  </p>
                )}
                {row.benefitSummary && (
                  <p className="text-xs text-foreground/65 leading-relaxed mt-2">
                    {row.benefitSummary}
                  </p>
                )}
              </div>

              {/* Key Nutrients */}
              {row.keyNutrients.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide mb-1.5">
                    {TERMINOLOGY.keyNutrients}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {row.keyNutrients.map((n) => (
                      <span
                        key={n}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Used In — meal + day evidence, expanded (not inline on the row) */}
              <div>
                <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide mb-1.5">
                  Used In
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {row.mealNames.map((name, i) => (
                    <span key={name} className="text-xs text-foreground/70">
                      {name}
                      {row.dayNames[i] ? (
                        <span className="text-muted-foreground/40 ml-1">
                          · {row.dayNames[i]}
                        </span>
                      ) : null}
                    </span>
                  ))}
                </div>
              </div>

              {/* WS2B — Your Variety / Broaden Your Variety (canonical, educational).
                  Read-only; surfaced only when WS2A defines varieties for this
                  food. Supersedes the former raw-form variant list. */}
              {variety && <CanonicalVarietySections variety={variety} />}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function PlantReportTable({
  plantRows,
  varietyByRowKey,
  expandedKeys,
  onToggle,
}: {
  plantRows: PlantRow[];
  varietyByRowKey: Map<string, CanonicalVarietyDisplay>;
  expandedKeys: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-muted/20 border-b border-border/50">
          <th className="px-5 py-2 text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide">
            {COLUMN_LABELS.plant}
          </th>
          <th className="hidden md:table-cell px-4 py-2 text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide whitespace-nowrap">
            {COLUMN_LABELS.healthBenefits}
          </th>
          <th className="hidden md:table-cell px-4 py-2 text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide whitespace-nowrap">
            {COLUMN_LABELS.keyNutrients}
          </th>
          <th className="hidden md:table-cell px-5 py-2 text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide text-right whitespace-nowrap">
            {COLUMN_LABELS.meals}
          </th>
        </tr>
      </thead>
      <tbody>
        {plantRows.map((row) => (
          <PlantReportRow
            key={row.canonicalKey}
            row={row}
            variety={varietyByRowKey.get(row.canonicalKey)}
            expanded={expandedKeys.has(row.canonicalKey)}
            onToggle={() => onToggle(row.canonicalKey)}
          />
        ))}
      </tbody>
    </table>
  );
}

// ─── Main report body ─────────────────────────────────────────────────────────
// Container-agnostic page body. The host page provides the page chrome and
// back navigation. No Dialog shell — this is the page conversion of the former
// PlantDiversityExplorer modal.

export interface PlantDiversityReportProps {
  weekMeals: WeekMealEntry[];
}

export function PlantDiversityReport({ weekMeals }: PlantDiversityReportProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("category");

  const { plantRows, categoriesFound } = useMemo(
    () => computePlantData(weekMeals),
    [weekMeals],
  );

  const sortedRows = useMemo(
    () => sortPlantRows(plantRows, sortKey),
    [plantRows, sortKey],
  );

  // WS2B — educational variety surfacing. Computed in a SEPARATE pass that never
  // feeds plantRows / plantCount; sort order doesn't affect ownership. Keyed by
  // row canonicalKey so each row can render its food's Your/Broaden sections.
  const varietyByRowKey = useMemo(() => {
    const allIngredients = weekMeals.flatMap((m) => m.ingredients);
    const rowInputs = plantRows.map((r) => ({ key: r.canonicalKey, representative: r.canonicalKey }));
    return buildRowVarietyDisplays(allIngredients, rowInputs);
  }, [weekMeals, plantRows]);

  const plantCount = plantRows.length;
  const pct = Math.min((plantCount / WEEKLY_PLANT_TARGET) * 100, 100);
  const isComplete = plantCount >= WEEKLY_PLANT_TARGET;
  const isOnTrack = plantCount >= Math.round(WEEKLY_PLANT_TARGET * 0.6);

  const barColor = isComplete
    ? "bg-emerald-500"
    : isOnTrack
      ? "bg-teal-500"
      : "bg-amber-400";

  function toggleRow(key: string) {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const statusMessage = isComplete
    ? "You've hit 30 plants this week — brilliant variety."
    : isOnTrack
      ? `${WEEKLY_PLANT_TARGET - plantCount} more plants to reach 30 this week.`
      : `${WEEKLY_PLANT_TARGET - plantCount} plants still to go. Every meal is a chance to add more.`;

  return (
    <div className="rounded-2xl border border-border/50 bg-background overflow-hidden">
      {/* ── Header / score ─────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Leaf className="h-4 w-4 text-emerald-600/70 dark:text-emerald-400/70 flex-shrink-0" />
          <h2 className="text-base font-semibold">30 Plants This Week</h2>
        </div>
        <p className="text-xs text-muted-foreground/55 mt-0.5">
          How your meals contributed to this week's plant nutrition.
        </p>

        <div className="mt-3 space-y-2">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-3xl font-bold tabular-nums ${
                isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
              }`}
              data-testid="text-plant-count"
            >
              {plantCount}
            </span>
            <span className="text-lg text-muted-foreground/60 font-medium">
              / {WEEKLY_PLANT_TARGET}
            </span>
            <span className="text-sm text-muted-foreground/50 ml-1">plants</span>
          </div>

          <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={plantCount}
              aria-valuemax={WEEKLY_PLANT_TARGET}
            />
          </div>

          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            {statusMessage}
          </p>
        </div>
      </div>

      {/* ── Categories covered ─────────────────────────────────────────── */}
      <CategoryGrid categoriesFound={categoriesFound} />

      {/* ── Suggestions for missing categories ─────────────────────────── */}
      <CategoryCompletionSuggestions categoriesFound={categoriesFound} />

      {/* ── Plant report ───────────────────────────────────────────────── */}
      {plantRows.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground/50">
          Your plant nutrition report will appear here once meals are added to your week.
        </div>
      ) : (
        <div>
          <div className="px-5 py-3 border-b border-border/50 bg-muted/10 flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wide">
                Plant Nutrition Report
              </p>
              <p className="text-[11px] text-muted-foreground/45 mt-0.5 leading-relaxed">
                What each plant contributes to your week's nutrition.
              </p>
            </div>
            <SortControl sortKey={sortKey} onChange={setSortKey} />
          </div>
          <PlantReportTable
            plantRows={sortedRows}
            varietyByRowKey={varietyByRowKey}
            expandedKeys={expandedKeys}
            onToggle={toggleRow}
          />
        </div>
      )}

      {/* ── Cross-link to evergreen Pantry Explore hub ─────────────────── */}
      <div className="px-5 py-4 border-t border-border/30">
        <Link
          href="/pantry?mode=explore"
          className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
          data-testid="link-explore-pantry"
        >
          <Compass className="h-3.5 w-3.5" />
          Explore health benefits, nutrients and foods in your Pantry
        </Link>
      </div>

      {/* ── Footer note + disclaimer ───────────────────────────────────── */}
      <div className="px-5 py-4 border-t border-border/30 space-y-1.5">
        <p className="text-[11px] text-muted-foreground/40 leading-relaxed">
          Plant count is an approximation based on ingredient names. Fruit, veg,
          legumes, seeds, nuts, whole grains, herbs, spices, and olive oil all count.
        </p>
        <p className="text-[11px] text-muted-foreground/40 leading-relaxed">
          {HEALTH_DISCLAIMER}
        </p>
      </div>
    </div>
  );
}
