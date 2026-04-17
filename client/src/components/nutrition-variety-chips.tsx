import type { VarietyScore } from "@/lib/nutrition-variety";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface CategoryDef {
  key: keyof Omit<VarietyScore, "total">;
  chipLabel: string;   // label shown in DayVarietySummary chips
  dotTitle: string;    // tooltip text when count === 1
  dotTitleRich: string; // tooltip text when count > 1
  dotColor: string;
  chipStyle: string;
}

const CATEGORIES: CategoryDef[] = [
  {
    key: "fruits",
    chipLabel: "Fruit",
    dotTitle: "Includes fruit",
    dotTitleRich: "A good mix of fruit",
    dotColor: "bg-rose-400",
    chipStyle:
      "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60",
  },
  {
    key: "vegetables",
    chipLabel: "Vegetables",
    dotTitle: "Includes vegetables",
    dotTitleRich: "Rich in vegetables",
    dotColor: "bg-green-500",
    chipStyle:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800/60",
  },
  {
    key: "wholeGrains",
    chipLabel: "Whole grains",
    dotTitle: "Includes whole grains",
    dotTitleRich: "Includes whole grains",
    dotColor: "bg-amber-500",
    chipStyle:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60",
  },
  {
    key: "herbsSpices",
    chipLabel: "Herbs & spices",
    dotTitle: "Includes herbs & spices",
    dotTitleRich: "Includes herbs & spices",
    dotColor: "bg-violet-400",
    chipStyle:
      "bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800/60",
  },
  {
    key: "oliveOil",
    chipLabel: "Olive oil",
    dotTitle: "Includes olive oil",
    dotTitleRich: "Includes olive oil",
    dotColor: "bg-teal-400",
    chipStyle:
      "bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-950/40 dark:text-teal-600 dark:border-teal-800/60",
  },
];

// ── Tiny dot row — used inside compact planner meal entries ──────────────────

export function NutritionVarietyDots({ score }: { score: VarietyScore }) {
  if (score.total === 0) return null;
  const present = CATEGORIES.filter((c) => score[c.key] > 0);
  return (
    <div className="flex items-center gap-0.5 mt-0.5" aria-label="Variety">
      {present.map((cat) => (
        <span
          key={cat.key}
          className="flex items-center"
          title={score[cat.key] > 1 ? cat.dotTitleRich : cat.dotTitle}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${cat.dotColor} opacity-70`}
          />
        </span>
      ))}
    </div>
  );
}

// ── Day-level variety summary — category chips with soft secondary context ────

export function DayVarietySummary({
  score,
  className,
}: {
  score: VarietyScore;
  className?: string;
}) {
  if (score.total === 0) return null;

  const present = CATEGORIES.filter((c) => score[c.key] > 0);

  return (
    <div
      className={`flex items-center gap-1 flex-wrap ${className ?? ""}`}
      data-testid="day-variety-summary"
    >
      <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/50 font-medium shrink-0">
        Variety
      </span>

      {present.map((cat) => (
        <span
          key={cat.key}
          className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${cat.chipStyle}`}
          data-testid={`variety-chip-${cat.key}`}
        >
          {cat.chipLabel}
        </span>
      ))}

      <span
        className="text-[10px] text-muted-foreground/40 font-normal"
        data-testid="variety-total"
      >
        Includes {score.total} different plant foods
      </span>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            aria-label="About variety"
          >
            <HelpCircle className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-xs leading-relaxed">
          <p className="font-medium mb-1">About variety</p>
          <p className="text-muted-foreground">
            We recognise fruit, vegetables, whole grains, herbs &amp; spices,
            and olive oil across your meals.
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
