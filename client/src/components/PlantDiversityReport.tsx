import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Leaf, Check, ChevronRight, Compass } from "lucide-react";
import { isPlantIngredient, getPlantCategory, plantDiversityGroup } from "@shared/canonical/plant-classifier";
import type { PlantCategory } from "@shared/canonical/plant-classifier";
import { parseIngredient } from "@shared/parse-ingredient";
import { singularizeIngredientKey } from "@shared/normalize";
import { normaliseForReuse } from "@/lib/ingredient-reuse";
import { getCategoryEmoji } from "@/lib/ingredient-imagery";
import { HEALTH_DISCLAIMER } from "@/lib/health-benefits-model";
import {
  buildRowVarietyDisplays,
  type CanonicalVarietyDisplay,
} from "@shared/canonical/variety";
import { FoodReport } from "@/components/FoodReport";
import { Card } from "@/components/ui/card";

// MAT1 — imported, not redeclared. This file held its own `= 30`; so did two other
// client surfaces and the shared core, so the platform's single most user-visible
// number was declared four times. One owner, one source of truth.
// PRESENCE1: this room no longer imports WEEKLY_PLANT_TARGET. It has nothing to
// compare a household against. The constant remains the single owner of the
// target for the consumers that legitimately reason about it; the Nutrition
// room is simply no longer one of them.
// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeekMealEntry {
  mealName: string;
  dayName: string;
  ingredients: string[];
}

type ReportSection = "plant-based" | "meat" | "dairy" | "eggs" | "other";

interface IngredientRow {
  displayKey: string;
  canonicalKey: string;
  displayName: string;
  section: ReportSection;
  plantCategory: PlantCategory | null;
  reportCategory: string;
  /** dayName → sorted meal names (deduped). */
  dayMealMap: Map<string, string[]>;
  /** Sorted by week day order. */
  dayNames: string[];
  /** All unique meal names. */
  mealNames: string[];
  keyNutrients: string[];
  benefitSummary: string | null;
  /** Cut/variety labels when multiple raw forms collapse to one canonical row. */
  formsUsed: string[];
}

export type SortKey =
  | "category"
  | "ingredient"
  | "benefits"
  | "nutrients"
  | "days"
  | "meals";

export interface PlantDiversityReportProps {
  weekMeals: WeekMealEntry[];
}

// ─── Constants ────────────────────────────────────────────────────────────────


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

// PRESENCE1: CATEGORY_SUGGESTIONS and the BroadenYourWeek panel it fed are
// retired here. The panel took the categories a household had NOT eaten and
// advised them, in the room's own voice, what to add — authored advice, written
// before this household existed, that could never detect it had become wrong
// (GEA8, GEA9). Suggesting is the Companion's, which composes from the same
// facts at the moment it speaks. Retired in the same change under GEA18 rather
// than left unadopted beside its replacement.

const DAY_ORDER = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];
const DAY_RANK = new Map(DAY_ORDER.map((d, i) => [d, i]));

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "category",   label: "Category" },
  { key: "ingredient", label: "Ingredient" },
  { key: "benefits",   label: "Benefits" },
  { key: "nutrients",  label: "Key Nutrients" },
  { key: "days",       label: "Days" },
  { key: "meals",      label: "Meals" },
];

// ─── Non-plant Categorisation ─────────────────────────────────────────────────

const MEAT_KEYWORDS = [
  "chicken", "beef", "pork", "lamb", "turkey", "duck", "veal", "venison",
  "rabbit", "bacon", "ham", "sausage", "sausages", "mince", "steak",
  "fillet", "loin", "rib", "ribs", "brisket", "shank", "chop", "chops",
  "fish", "salmon", "tuna", "cod", "haddock", "mackerel", "sardine",
  "sardines", "trout", "sea bass", "seabass", "halibut", "tilapia",
  "prawn", "prawns", "shrimp", "crab", "lobster", "mussel", "mussels",
  "clam", "clams", "scallop", "scallops", "squid", "anchovy", "anchovies",
  "chorizo", "pepperoni", "salami", "bresaola", "pancetta",
] as const;

const DAIRY_KEYWORDS = [
  "milk", "cheese", "yogurt", "yoghurt", "butter", "cream",
  "cheddar", "mozzarella", "parmesan", "feta", "ricotta", "brie",
  "camembert", "gouda", "stilton", "halloumi", "gruyere", "emmental",
  "mascarpone", "quark", "fromage frais", "creme fraiche",
  "soured cream", "sour cream", "buttermilk", "ghee",
  "condensed milk", "evaporated milk", "whey",
] as const;

const EGG_KEYWORDS = ["egg", "eggs"] as const;

function containsKeyword(text: string, word: string): boolean {
  const t = text.toLowerCase();
  const w = word.toLowerCase();
  return (
    t === w ||
    t.startsWith(w + " ") ||
    t.endsWith(" " + w) ||
    t.includes(" " + w + " ")
  );
}

function matchesKeywords(text: string, keywords: readonly string[]): boolean {
  return keywords.some((w) => containsKeyword(text, w));
}

/**
 * NUT_VERIFY1 — a raw recipe line reduced to the canonical ingredient slug.
 *
 * This is the EXACT chain the server already uses (`server/routes.ts` — the
 * 30-plants counter converged by PUB1): parse off quantity/unit/prep notes,
 * then singularise. It introduces no rule and owns no classification; it only
 * hands `shared/canonical/*` the key shape those owners can actually resolve.
 *
 * It exists because `resolveCanonicalFood` is EXACT-KEY, never substring
 * (`shared/canonical/resolver.ts:10-11`). Passing it a whole recipe line —
 * "400g tin chickpeas, drained" — cannot match, and returns UNRESOLVED, which
 * every caller downstream reads as "not a plant". Bare "chickpeas" resolves.
 */
function canonicalIngredientSlug(raw: string): string {
  return singularizeIngredientKey(parseIngredient(raw).normalizedName);
}

function getSectionForIngredient(raw: string): ReportSection {
  // NUT_VERIFY1 — was `isPlantIngredient(raw)`, on the unparsed line. Every
  // quantity-prefixed plant fell through to "other", which is why the Plant
  // Based section contained only "Black Pepper" — the one ingredient
  // conventionally written with no quantity.
  if (isPlantIngredient(canonicalIngredientSlug(raw))) return "plant-based";
  const lower = raw.toLowerCase();
  if (matchesKeywords(lower, MEAT_KEYWORDS)) return "meat";
  if (matchesKeywords(lower, DAIRY_KEYWORDS)) return "dairy";
  if (matchesKeywords(lower, EGG_KEYWORDS)) return "eggs";
  return "other";
}

function getReportCategory(
  section: ReportSection,
  plantCategory: PlantCategory | null,
): string {
  if (section === "plant-based" && plantCategory) {
    return `Plant based → ${plantCategory}`;
  }
  switch (section) {
    case "meat":  return "Meat & Fish";
    case "dairy": return "Dairy";
    case "eggs":  return "Eggs";
    default:      return "Other";
  }
}

function getSectionEmoji(section: ReportSection): string {
  switch (section) {
    case "plant-based": return "🌱";
    case "meat":        return "🥩";
    case "dairy":       return "🧀";
    case "eggs":        return "🥚";
    default:            return "🧂";
  }
}

function getSectionLabel(section: ReportSection): string {
  switch (section) {
    case "plant-based": return "Plant Based";
    case "meat":        return "Meat & Fish";
    case "dairy":       return "Dairy";
    case "eggs":        return "Eggs";
    default:            return "Other Ingredients";
  }
}

// ─── Display key helper (Stage 4 — display-only, never touches plant count) ──

// Strips full-word unit labels that normaliseForReuse's regex doesn't cover.
// "tablespoon olive oil" → pre-stripped → "olive oil" → normaliseForReuse → "olive oil"
// This groups display rows only. Production plant counting is untouched.
const EXTRA_UNIT_RE =
  /\b(tablespoon|tablespoons|teaspoon|teaspoons|can|cans|tin|tins|jar|jars|bunch|bunches|sprig|sprigs|stalk|stalks|slice|slices|piece|pieces|head|heads|small|medium|large|big)\b/gi;

function getDisplayKey(raw: string): string {
  const preStripped = raw.replace(EXTRA_UNIT_RE, "").replace(/\s+/g, " ").trim();
  return normaliseForReuse(preStripped);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDisplayName(key: string): string {
  return key.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Extracts the "form" label when a raw ingredient has been aliased to a
 * canonical display key. Returns null when no alias was applied.
 *
 * Examples:
 *   "Chicken Breasts" + canonical "chicken" → "Breasts"
 *   "Chicken Legs"    + canonical "chicken" → "Legs"
 *   "Braeburn Apple"  + canonical "apple"   → "Braeburn"
 *   "Pink Lady Apple" + canonical "apple"   → "Pink Lady"
 */
function computeFormLabel(raw: string, canonicalKey: string): string | null {
  const preAlias = raw.replace(EXTRA_UNIT_RE, "").replace(/\s+/g, " ").trim();
  const preAliasLower = preAlias.toLowerCase();
  if (preAliasLower === canonicalKey) return null;

  // Prefix: "Chicken Breasts" → canonical "chicken" → "Breasts"
  if (preAliasLower.startsWith(canonicalKey + " ")) {
    const form = preAlias.slice(canonicalKey.length + 1).trim();
    return form || null;
  }

  // Suffix: "Braeburn Apple" → canonical "apple" → "Braeburn"
  if (preAliasLower.endsWith(" " + canonicalKey)) {
    const form = preAlias.slice(0, preAlias.length - canonicalKey.length - 1).trim();
    return form || null;
  }

  return null;
}

// ─── WS0 knowledge type (mirrors server IngredientKnowledgeSummary) ───────────

interface IngredientKnowledge {
  nutrients: string[];
  benefits: string[];
}

// ─── Data Builder ─────────────────────────────────────────────────────────────

function computeAllRows(
  weekMeals: WeekMealEntry[],
  knowledgeMap: Record<string, IngredientKnowledge>,
): {
  plantRows: IngredientRow[];
  meatRows: IngredientRow[];
  dairyRows: IngredientRow[];
  eggRows: IngredientRow[];
  otherRows: IngredientRow[];
  plantCount: number;
  totalIngredients: number;
  categoriesFound: Set<PlantCategory>;
} {
  // Pass 1 — plant count.
  //
  // NUT_VERIFY1 fixed TWO defects here, both of which LAUNCH1 § "Plant
  // diversity" had already named and which pushed the number in OPPOSITE
  // directions, so the figure on screen had no bounded error:
  //
  //   1. UNDER-COUNT — the predicate ran on the RAW recipe line. The canonical
  //      resolver is exact-key (`resolver.ts:10-11`), so "400g tin chickpeas,
  //      drained" never resolved and read as "not a plant". Measured against 14
  //      real founding-cookbook recipes (147 ingredient lines): 1 plant counted.
  //
  //   2. OVER-COUNT — it deduped on the INGREDIENT key. The Source of Truth
  //      Register, Domain 4, is explicit: "One diversity group = one plant …
  //      A counter that dedupes on the ingredient slug over-counts and is a
  //      defect (CPI1 S1-2)." Kale and cavolo nero are one plant; every tomato
  //      variety is one plant.
  //
  // Both are fixed by adopting the chain the server counter already used —
  // parse → singularise → `plantDiversityGroup()` → dedupe on the GROUP. This
  // file now owns no counting rule of its own; `plantDiversityGroup()` remains
  // the sole owner of "does this count as a plant, and which one". Same 14
  // recipes after the fix: 31 plants.
  const plantGroups = new Set<string>();
  for (const meal of weekMeals) {
    for (const raw of meal.ingredients) {
      if (!raw.trim()) continue;
      const group = plantDiversityGroup(canonicalIngredientSlug(raw));
      if (group) plantGroups.add(group);
    }
  }
  const plantCount = plantGroups.size;

  // Pass 2 — display rows, grouped by getDisplayKey (measurement-stripped).
  type RowAcc = {
    canonicalKey: string;
    displayName: string;
    section: ReportSection;
    plantCategory: PlantCategory | null;
    reportCategory: string;
    dayMealAcc: Map<string, Set<string>>;
    keyNutrients: string[];
    benefitSummary: string | null;
    formsUsed: Set<string>;
  };

  const rowMap = new Map<string, RowAcc>();

  for (const meal of weekMeals) {
    for (const raw of meal.ingredients) {
      if (!raw.trim()) continue;
      const displayKey = getDisplayKey(raw);
      if (!displayKey) continue;

      const section = getSectionForIngredient(raw);

      if (!rowMap.has(displayKey)) {
        // UX_REFINE1 (R2) — the CATEGORY now comes from the canonical chain, the
        // same one the count and the section already use.
        //
        // It was fed `displayKey`, which comes from `getDisplayKey` — a private
        // normalisation that strips a different set of words and produces keys
        // like "cucumber or finely". Those do not resolve, so the category fell
        // through to the `?? "Vegetables"` default: chickpeas and lentils were
        // counted as plants while **Legumes** stayed unticked, and anything the
        // seed did not classify was silently filed as a vegetable.
        //
        // The `?? "Vegetables"` fallback is removed with it. A category THA does
        // not know is now absent rather than guessed — `plantCategory` is
        // already `PlantCategory | null` and every consumer handles null, so an
        // unknown category simply is not claimed (Core Principle 6).
        const plantCategory =
          section === "plant-based"
            ? getPlantCategory(canonicalIngredientSlug(raw))
            : null;
        const knowledge = knowledgeMap[displayKey];
        rowMap.set(displayKey, {
          canonicalKey: displayKey,
          displayName: toDisplayName(displayKey),
          section,
          plantCategory,
          reportCategory: getReportCategory(section, plantCategory),
          dayMealAcc: new Map(),
          keyNutrients: knowledge?.nutrients ?? [],
          benefitSummary: knowledge?.benefits?.slice(0, 2).join(" · ") ?? null,
          formsUsed: new Set(),
        });
      }

      const entry = rowMap.get(displayKey)!;
      if (!entry.dayMealAcc.has(meal.dayName)) {
        entry.dayMealAcc.set(meal.dayName, new Set());
      }
      entry.dayMealAcc.get(meal.dayName)!.add(meal.mealName);

      // Track the cut/variety form when aliasing collapsed this ingredient
      const formLabel = computeFormLabel(raw, displayKey);
      if (formLabel) entry.formsUsed.add(formLabel);
    }
  }

  // Materialise rows
  const allRows: IngredientRow[] = Array.from(rowMap.values()).map((acc) => {
    const dayMealMap = new Map<string, string[]>();
    Array.from(acc.dayMealAcc.entries()).forEach(([day, meals]) => {
      dayMealMap.set(day, Array.from(meals as Set<string>).sort());
    });
    const dayNames = Array.from(acc.dayMealAcc.keys()).sort(
      (a, b) => (DAY_RANK.get(a) ?? 99) - (DAY_RANK.get(b) ?? 99),
    );
    const allMeals = new Set<string>();
    Array.from(acc.dayMealAcc.values()).forEach((meals) => {
      Array.from(meals as Set<string>).forEach((m) => allMeals.add(m));
    });
    return {
      displayKey: acc.canonicalKey,
      canonicalKey: acc.canonicalKey,
      displayName: acc.displayName,
      section: acc.section,
      plantCategory: acc.plantCategory,
      formsUsed: Array.from(acc.formsUsed).sort(),
      reportCategory: acc.reportCategory,
      dayMealMap,
      dayNames,
      mealNames: Array.from(allMeals).sort(),
      keyNutrients: acc.keyNutrients,
      benefitSummary: acc.benefitSummary,
    };
  });

  const bySection = (s: ReportSection) =>
    allRows
      .filter((r) => r.section === s)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

  const plantRows = allRows
    .filter((r) => r.section === "plant-based")
    .sort((a, b) => {
      const catA = CATEGORY_ORDER.indexOf(a.plantCategory ?? "Vegetables");
      const catB = CATEGORY_ORDER.indexOf(b.plantCategory ?? "Vegetables");
      if (catA !== catB) return catA - catB;
      return a.displayName.localeCompare(b.displayName);
    });

  const categoriesFound = new Set<PlantCategory>(
    plantRows
      .map((r) => r.plantCategory)
      .filter((c): c is PlantCategory => c !== null),
  );

  return {
    plantRows,
    meatRows:  bySection("meat"),
    dairyRows: bySection("dairy"),
    eggRows:   bySection("eggs"),
    otherRows: bySection("other"),
    plantCount,
    totalIngredients: allRows.length,
    categoriesFound,
  };
}

// ─── Sort ─────────────────────────────────────────────────────────────────────

function sortRows(rows: IngredientRow[], sortKey: SortKey): IngredientRow[] {
  const sorted = [...rows];
  switch (sortKey) {
    case "ingredient":
      sorted.sort((a, b) => a.displayName.localeCompare(b.displayName));
      break;
    case "category":
      sorted.sort((a, b) => {
        const catA = CATEGORY_ORDER.indexOf(a.plantCategory ?? "Vegetables");
        const catB = CATEGORY_ORDER.indexOf(b.plantCategory ?? "Vegetables");
        if (catA !== catB) return catA - catB;
        return a.displayName.localeCompare(b.displayName);
      });
      break;
    case "benefits":
      sorted.sort((a, b) => {
        const aHas = a.benefitSummary ? 1 : 0;
        const bHas = b.benefitSummary ? 1 : 0;
        if (aHas !== bHas) return bHas - aHas;
        return a.displayName.localeCompare(b.displayName);
      });
      break;
    case "nutrients":
      sorted.sort((a, b) => {
        if (a.keyNutrients.length !== b.keyNutrients.length)
          return b.keyNutrients.length - a.keyNutrients.length;
        return (a.keyNutrients[0] ?? "").localeCompare(b.keyNutrients[0] ?? "")
          || a.displayName.localeCompare(b.displayName);
      });
      break;
    case "days":
      // Single-day rows first (sorted Mon→Sun), multi-day rows last
      sorted.sort((a, b) => {
        const aMulti = a.dayNames.length > 1;
        const bMulti = b.dayNames.length > 1;
        if (aMulti !== bMulti) return aMulti ? 1 : -1;
        if (!aMulti) {
          const rankA = DAY_RANK.get(a.dayNames[0] ?? "") ?? 99;
          const rankB = DAY_RANK.get(b.dayNames[0] ?? "") ?? 99;
          if (rankA !== rankB) return rankA - rankB;
        }
        return a.displayName.localeCompare(b.displayName);
      });
      break;
    case "meals":
      sorted.sort(
        (a, b) =>
          b.mealNames.length - a.mealNames.length ||
          a.displayName.localeCompare(b.displayName),
      );
      break;
  }
  return sorted;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// PRESENCE1: this was a nine-row coverage checklist — ticks against what the
// household ate and empty circles against what they did not. The empty circles
// were the deficit: they named, every week, exactly what a family had failed to
// put on the table, and a checklist with unticked rows is a score with the
// number removed. GEA13's test settles it — three unticked circles labelled
// Seeds, Nuts and Fermented Foods do not measure food, they grade a week.
//
// What the household is shown now is what their week actually contained. The
// absent categories are still known to the platform and still reach the
// household — through the Companion, which may notice and suggest, because it
// is the one voice permitted to (GEA8).
function CategoryGrid({ categoriesFound }: { categoriesFound: Set<PlantCategory> }) {
  const present = CATEGORY_ORDER.filter((cat) => categoriesFound.has(cat));
  if (present.length === 0) return null;

  return (
    <div className="px-5 py-4 border-b border-border/50">
      <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wide mb-3">
        In Your Week
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
        {present.map((cat) => (
          <div key={cat} className="flex items-center gap-2 text-xs text-foreground/80">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/15 flex-shrink-0">
              <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
            </span>
            {cat}
          </div>
        ))}
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

// ─── Row ──────────────────────────────────────────────────────────────────────

function DaysCell({ row }: { row: IngredientRow }) {
  if (row.dayNames.length === 0)
    return <span className="text-[11px] text-muted-foreground/30">—</span>;
  if (row.dayNames.length === 1)
    return <span className="text-xs text-foreground/70">{row.dayNames[0]}</span>;
  return (
    <span className="text-xs font-medium text-muted-foreground/70">Multi</span>
  );
}

function MealsCell({ row }: { row: IngredientRow }) {
  const count = row.mealNames.length;
  if (count === 0)
    return <span className="text-[11px] text-muted-foreground/30">—</span>;
  if (count === 1)
    return (
      <span className="text-xs text-foreground/70 block max-w-[140px] truncate">
        {row.mealNames[0]}
      </span>
    );
  return (
    <span className="text-xs text-muted-foreground/70 whitespace-nowrap tabular-nums">
      {count} meals
    </span>
  );
}

function ExpandedDayMealList({ row }: { row: IngredientRow }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide mb-2">
        Meals
      </p>
      <div className="space-y-2">
        {row.dayNames.map((day) => {
          const meals = row.dayMealMap.get(day) ?? [];
          return (
            <div key={day}>
              <p className="text-[11px] font-medium text-foreground/60 mb-0.5">{day}</p>
              <ul className="space-y-0.5 pl-2">
                {meals.map((meal) => (
                  <li key={meal} className="flex items-start gap-1.5">
                    <span className="text-muted-foreground/40 text-xs leading-tight mt-px">•</span>
                    <span className="text-xs text-foreground/70">{meal}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReportRow({
  row,
  variety,
  expanded,
  onToggle,
}: {
  row: IngredientRow;
  variety?: CanonicalVarietyDisplay;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasBenefitSummary = !!row.benefitSummary;
  const hasNutrients = row.keyNutrients.length > 0;

  return (
    <>
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
        data-testid={`row-ingredient-${row.displayKey}`}
      >
        {/* Ingredient — always visible */}
        <td className="px-4 py-2.5 align-middle">
          <div className="flex items-center gap-2 min-w-0">
            <ChevronRight
              className={`h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0 transition-transform duration-150 ${
                expanded ? "rotate-90" : ""
              }`}
              aria-hidden="true"
            />
            <span className="text-base leading-none flex-shrink-0" aria-hidden="true">
              {getCategoryEmoji(row.plantCategory ?? undefined)}
            </span>
            <div className="min-w-0">
              {/* PX1-W2: the mobile stacked summary is retired — it compensated
                  for the hidden Category/Meals columns, which now always render. */}
              <span className="block text-sm font-medium text-foreground/90 truncate">
                {row.displayName}
              </span>
            </div>
          </div>
        </td>

        {/* Category */}
        <td className="px-3 py-2.5 align-middle">
          <span className="text-[11px] text-foreground/65 whitespace-nowrap">
            {row.reportCategory}
          </span>
        </td>

        {/* Supports / Benefits */}
        <td className="px-3 py-2.5 align-middle">
          {hasBenefitSummary ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-muted/50 text-foreground/70 border border-border/40 truncate max-w-[160px]">
              {row.benefitSummary}
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground/30">—</span>
          )}
        </td>

        {/* Key Nutrients */}
        <td className="px-3 py-2.5 align-middle">
          {hasNutrients ? (
            <span className="text-[11px] text-emerald-700/60 dark:text-emerald-400/60 font-medium whitespace-nowrap">
              {row.keyNutrients.slice(0, 2).join(" · ")}
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground/30">—</span>
          )}
        </td>

        {/* Days */}
        <td className="px-3 py-2.5 align-middle">
          <DaysCell row={row} />
        </td>

        {/* Meals */}
        <td className="px-4 py-2.5 align-middle text-right">
          <div className="flex items-center justify-end gap-1">
            <MealsCell row={row} />
            <ChevronRight
              className={`h-3 w-3 text-muted-foreground/40 flex-shrink-0 transition-transform duration-150 ${
                expanded ? "rotate-90" : ""
              }`}
              aria-hidden="true"
            />
          </div>
        </td>
      </tr>

      {/* Expanded row */}
      {expanded && (
        <tr className="bg-muted/10 border-b border-border/20">
          <td colSpan={6} className="px-5 pb-4 pt-2">
            <div className="space-y-4">
              {/* WS2G — FoodReport (plant-based rows only) */}
              {row.section === "plant-based" && (
                <FoodReport
                  canonicalSlug={variety?.canonicalSlug ?? row.canonicalKey}
                  eatenVarietyLabels={variety?.yourVarieties}
                />
              )}

              {/* Forms used this week (non-plant rows with aliased cuts/varieties) */}
              {row.section !== "plant-based" && row.formsUsed.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide mb-1.5">
                    Forms used this week
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {row.formsUsed.map((form) => (
                      <span
                        key={form}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-muted/50 text-foreground/70 border border-border/40"
                      >
                        {form}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Day → Meal mapping (all rows) */}
              <ExpandedDayMealList row={row} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function ReportTable({
  rows,
  varietyByRowKey,
  expandedKeys,
  onToggle,
}: {
  rows: IngredientRow[];
  varietyByRowKey: Map<string, CanonicalVarietyDisplay>;
  expandedKeys: Set<string>;
  onToggle: (key: string) => void;
}) {
  if (rows.length === 0) return null;

  return (
    // PX1-W2 (fnd-px-plant-columns-unreachable): five of six columns were
    // `hidden md:table-cell` inside an overflow-hidden card — display:none with
    // no scroller to recover them, so on a phone the entire "why this plant
    // matters" payload was invisible. The columns now always render and the
    // table scrolls horizontally where it does not fit.
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left border-collapse">
        <thead>
          <tr className="bg-muted/20 border-b border-border/50">
            <th className="px-4 py-2 text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide">
              Ingredient
            </th>
            <th className="px-3 py-2 text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide">
              Category
            </th>
            <th className="px-3 py-2 text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide whitespace-nowrap">
              Supports
            </th>
            <th className="px-3 py-2 text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide whitespace-nowrap">
              Key Nutrients
            </th>
            <th className="px-3 py-2 text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide">
              Days
            </th>
            <th className="px-4 py-2 text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide text-right">
              Meals
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <ReportRow
              key={row.displayKey}
              row={row}
              variety={varietyByRowKey.get(row.displayKey)}
              expanded={expandedKeys.has(row.displayKey)}
              onToggle={() => onToggle(row.displayKey)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Section block ────────────────────────────────────────────────────────────

function SectionBlock({
  section,
  sortedRows,
  varietyByRowKey,
  expandedKeys,
  onToggle,
  children,
}: {
  section: ReportSection;
  sortedRows: IngredientRow[];
  varietyByRowKey: Map<string, CanonicalVarietyDisplay>;
  expandedKeys: Set<string>;
  onToggle: (key: string) => void;
  children?: React.ReactNode;
}) {
  if (sortedRows.length === 0 && !children) return null;

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">
            {getSectionEmoji(section)}
          </span>
          <h2 className="text-base font-semibold">{getSectionLabel(section)}</h2>
          {sortedRows.length > 0 && (
            <span className="ml-auto text-[11px] text-muted-foreground/45 tabular-nums">
              {sortedRows.length} ingredient{sortedRows.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Optional extra content (e.g. 30 Plants tracker, category grid) */}
      {children}

      {sortedRows.length > 0 ? (
        <ReportTable
          rows={sortedRows}
          varietyByRowKey={varietyByRowKey}
          expandedKeys={expandedKeys}
          onToggle={onToggle}
        />
      ) : (
        <div className="px-5 py-8 text-center text-sm text-muted-foreground/45">
          No {getSectionLabel(section).toLowerCase()} ingredients this week.
        </div>
      )}
    </Card>
  );
}

// ─── 30 Plants tracker ────────────────────────────────────────────────────────

function ThirtyPlantsTracker({
  plantCount,
  categoriesFound,
}: {
  plantCount: number;
  categoriesFound: Set<PlantCategory>;
}) {
  // PRESENCE1: this was a target (30) the household never set, a progress bar
  // toward it, a colour ramp grading how close they were, and a sentence that
  // either praised them or told them what they were short of. All four are
  // forbidden by GEA13, and the sentence additionally spoke in a voice no room
  // owns (GEA8). What remains is the count itself, which is the only part the
  // household actually asked for.
  return (
    <>
      {/* Plants in this week — a count, not a score */}
      <div className="px-5 pt-4 pb-3 border-b border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <Leaf className="h-3.5 w-3.5 text-emerald-600/70 dark:text-emerald-400/70 flex-shrink-0" />
          <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wide">
            Different Plants This Week
          </p>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-3xl font-bold tabular-nums text-foreground"
            data-testid="text-plant-count"
          >
            {plantCount}
          </span>
          <span className="text-sm text-muted-foreground/50 ml-1">
            plant{plantCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* The plants the week actually contained */}
      <CategoryGrid categoriesFound={categoriesFound} />
    </>
  );
}

// ─── Compact summary (Stage 1) ────────────────────────────────────────────────

function ReportSummary({
  plantCount,
  totalIngredients,
  categoriesFound,
}: {
  plantCount: number;
  totalIngredients: number;
  categoriesFound: Set<PlantCategory>;
}) {
  // PRESENCE1: three counts, stated plainly. No denominator, no bar, no colour
  // that grades the number. A household asked what is in their week; this
  // answers that and stops (GEA13 — the permitted case is "reporting a quantity
  // a household asked for"; GEA8 — the room reports, it does not appraise).
  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 grid grid-cols-3 divide-x divide-border/40">
        <div className="pr-4">
          <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide mb-1">
            Plants
          </p>
          <p className="text-xl font-bold tabular-nums text-foreground">{plantCount}</p>
          <p className="text-[11px] text-muted-foreground/45 mt-1">this week</p>
        </div>
        <div className="px-4">
          <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide mb-1">
            Ingredients
          </p>
          <p className="text-xl font-bold tabular-nums">{totalIngredients}</p>
          <p className="text-[11px] text-muted-foreground/45 mt-1">this week</p>
        </div>
        <div className="pl-4">
          <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide mb-1">
            Plant Categories
          </p>
          <p className="text-xl font-bold tabular-nums">{categoriesFound.size}</p>
          <p className="text-[11px] text-muted-foreground/45 mt-1">this week</p>
        </div>
      </div>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PlantDiversityReport({ weekMeals }: PlantDiversityReportProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("category");

  // Collect all ingredient keys: week-meal rows + static suggestion names.
  // Single deduplicated set fed to the WS0 batch lookup.
  const allLookupKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const meal of weekMeals) {
      for (const raw of meal.ingredients) {
        if (!raw.trim()) continue;
        const key = getDisplayKey(raw);
        if (key) keys.add(key);
      }
    }
    return Array.from(keys).sort();
  }, [weekMeals]);

  // Batch-fetch WS0 nutrients + benefits for all ingredient keys.
  // Returns {} on error / while loading — all rows gracefully show "—".
  const { data: ingredientKnowledge = {} } = useQuery<Record<string, IngredientKnowledge>>({
    queryKey: ["/api/knowledge/ingredient-lookup", allLookupKeys.join(",")],
    queryFn: async () => {
      if (allLookupKeys.length === 0) return {};
      const res = await fetch("/api/knowledge/ingredient-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: allLookupKeys }),
      });
      if (!res.ok) return {};
      return res.json() as Promise<Record<string, IngredientKnowledge>>;
    },
    enabled: allLookupKeys.length > 0,
    staleTime: 10 * 60 * 1000,
  });

  const {
    plantRows,
    meatRows,
    dairyRows,
    eggRows,
    otherRows,
    plantCount,
    totalIngredients,
    categoriesFound,
  } = useMemo(() => computeAllRows(weekMeals, ingredientKnowledge), [weekMeals, ingredientKnowledge]);

  // Sort within each section independently
  const sortedPlantRows  = useMemo(() => sortRows(plantRows,  sortKey), [plantRows,  sortKey]);
  const sortedMeatRows   = useMemo(() => sortRows(meatRows,   sortKey), [meatRows,   sortKey]);
  const sortedDairyRows  = useMemo(() => sortRows(dairyRows,  sortKey), [dairyRows,  sortKey]);
  const sortedEggRows    = useMemo(() => sortRows(eggRows,    sortKey), [eggRows,    sortKey]);
  const sortedOtherRows  = useMemo(() => sortRows(otherRows,  sortKey), [otherRows,  sortKey]);

  // WS2B variety surfacing — plant rows only (read-only, never feeds count)
  const varietyByRowKey = useMemo(() => {
    const allIngredients = weekMeals.flatMap((m) => m.ingredients);
    const rowInputs = plantRows.map((r) => ({
      key: r.displayKey,
      representative: r.canonicalKey,
    }));
    return buildRowVarietyDisplays(allIngredients, rowInputs);
  }, [weekMeals, plantRows]);

  // Empty variety map for non-plant sections (no FoodReport shown)
  const emptyVarietyMap = useMemo(() => new Map<string, CanonicalVarietyDisplay>(), []);

  function toggleRow(key: string) {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const hasAnyIngredients = totalIngredients > 0;

  if (!hasAnyIngredients) {
    return (
      <Card className="overflow-hidden">
        <div className="px-5 py-16 text-center">
          <p className="text-sm text-muted-foreground/50">
            Your Nutrition Report will appear here once meals are added to your week.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact summary (Stage 1) */}
      <ReportSummary
        plantCount={plantCount}
        totalIngredients={totalIngredients}
        categoriesFound={categoriesFound}
      />

      {/* Sort controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-[11px] text-muted-foreground/45">
          {totalIngredients} ingredient{totalIngredients !== 1 ? "s" : ""} across all sections
        </p>
        <SortControl sortKey={sortKey} onChange={setSortKey} />
      </div>

      {/* Section 1 — Plant Based */}
      <SectionBlock
        section="plant-based"
        sortedRows={sortedPlantRows}
        varietyByRowKey={varietyByRowKey}
        expandedKeys={expandedKeys}
        onToggle={toggleRow}
      >
        <ThirtyPlantsTracker
          plantCount={plantCount}
          categoriesFound={categoriesFound}
        />
        {sortedPlantRows.length === 0 && (
          <div className="px-5 py-6 text-center text-sm text-muted-foreground/45 border-b border-border/30">
            No plant-based ingredients found this week.
          </div>
        )}
      </SectionBlock>

      {/* Section 2 — Meat & Fish */}
      {meatRows.length > 0 && (
        <SectionBlock
          section="meat"
          sortedRows={sortedMeatRows}
          varietyByRowKey={emptyVarietyMap}
          expandedKeys={expandedKeys}
          onToggle={toggleRow}
        />
      )}

      {/* Section 3 — Dairy */}
      {dairyRows.length > 0 && (
        <SectionBlock
          section="dairy"
          sortedRows={sortedDairyRows}
          varietyByRowKey={emptyVarietyMap}
          expandedKeys={expandedKeys}
          onToggle={toggleRow}
        />
      )}

      {/* Section 4 — Eggs */}
      {eggRows.length > 0 && (
        <SectionBlock
          section="eggs"
          sortedRows={sortedEggRows}
          varietyByRowKey={emptyVarietyMap}
          expandedKeys={expandedKeys}
          onToggle={toggleRow}
        />
      )}

      {/* Section 5 — Other Ingredients */}
      {otherRows.length > 0 && (
        <SectionBlock
          section="other"
          sortedRows={sortedOtherRows}
          varietyByRowKey={emptyVarietyMap}
          expandedKeys={expandedKeys}
          onToggle={toggleRow}
        />
      )}

      {/* Broaden Your Week — at the end (Stage 7) */}

      {/* Cross-link to Pantry */}
      <Card className="px-5 py-4">
        <Link
          href="/pantry?mode=explore"
          className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
          data-testid="link-explore-pantry"
        >
          <Compass className="h-3.5 w-3.5" />
          Explore health benefits, nutrients and foods in your Pantry
        </Link>
      </Card>

      {/* Disclaimer */}
      <div className="px-1 space-y-1">
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
