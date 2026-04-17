import { useState } from "react";
import { X } from "lucide-react";
import type { NutrientTag, NutrientGoal } from "@/lib/nutrition-insights";
import { NUTRIENT_GOALS } from "@/lib/nutrition-insights";

// ── Per-meal display — used inside compact planner slot entries ───────────────

export function MealNutrientTags({ nutrients }: { nutrients: NutrientTag[] }) {
  if (nutrients.length === 0) return null;
  return (
    <p
      className="text-[9px] text-muted-foreground/40 leading-tight mt-0.5 truncate"
      data-testid="meal-nutrient-tags"
    >
      {nutrients.slice(0, 3).join(" · ")}
    </p>
  );
}

// ── Day-level nutrient summary — rendered below DayVarietySummary in diary ────

export function DayNutrientSummary({ nutrients }: { nutrients: NutrientTag[] }) {
  if (nutrients.length === 0) return null;
  const shown = nutrients.slice(0, 5);
  return (
    <div
      className="flex items-baseline gap-1.5 flex-wrap"
      data-testid="day-nutrient-summary"
    >
      <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/50 font-medium shrink-0">
        Supports
      </span>
      <span className="text-[10px] text-muted-foreground/60">
        {shown.join(" · ")}
      </span>
      {nutrients.length >= 2 && (
        <span className="w-full text-[9px] text-muted-foreground/35 -mt-0.5">
          A good range of nutrients today
        </span>
      )}
    </div>
  );
}

// ── "I want to support…" widget — optional, dismissible ──────────────────────

export function NutrientSupportWidget() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<NutrientGoal | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[10px] text-muted-foreground/35 hover:text-muted-foreground/55 transition-colors"
        data-testid="button-want-to-support"
      >
        I want to support…
      </button>
    );
  }

  const dismiss = () => {
    setOpen(false);
    setSelected(null);
  };

  if (selected) {
    return (
      <div
        className="space-y-1.5"
        data-testid="nutrient-support-detail"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground/60 font-medium">
            {selected.label} — try adding
          </span>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="ml-auto text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            aria-label="Back"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {selected.suggestions.map((s) => (
            <span
              key={s}
              className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground/60 border border-border/40"
            >
              {s}
            </span>
          ))}
        </div>
        <p className="text-[9px] text-muted-foreground/30">
          These are suggestions only — not a plan or recommendation.
        </p>
      </div>
    );
  }

  return (
    <div
      className="space-y-1.5"
      data-testid="nutrient-support-goals"
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground/50 font-medium">
          I want to support…
        </span>
        <button
          type="button"
          onClick={dismiss}
          className="ml-auto text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
          aria-label="Close"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {NUTRIENT_GOALS.map((goal) => (
          <button
            key={goal.id}
            type="button"
            onClick={() => setSelected(goal)}
            className="text-[10px] px-1.5 py-0.5 rounded-full border border-border/50 text-muted-foreground/55 hover:border-primary/40 hover:text-primary/70 transition-colors"
            data-testid={`button-goal-${goal.id}`}
          >
            {goal.label}
          </button>
        ))}
      </div>
    </div>
  );
}
