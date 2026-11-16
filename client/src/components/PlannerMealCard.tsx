/**
 * PlannerMealCard — V3 card content component (image-on-top).
 *
 * Renders the information inside a planner meal card button: a full-width
 * photo on top, the meal name underneath it. Does NOT include the outer
 * button wrapper, the boost indicator, or the entry context menu — those
 * remain in the parent (weekly-planner-page.tsx). Frozen/in-basket status are
 * NOT shown as persistent icons on the card (COMP_UX1 — owner feedback: every
 * icon on the card should instead be a right-click/long-press menu item) —
 * the context menu's "Add to freezer"/"Send to shopping" items reflect the
 * current state there instead.
 *
 *   [ ---- photo ---- ]  ← full cell width, fixed height
 *   Meal title              "Needs recipe"/"Quick meal"/"Cooked" label
 *                           underneath the name when applicable
 *
 * Style chips and variety dots (previously shown below the title) were
 * dropped from this compact grid card on the household's own request for a
 * neater, photo-led cell — that detail still lives in the meal detail popup.
 */

import type { Meal } from "@shared/schema";
import { ThrottledMealImage } from "@/components/ThrottledMealImage";
import { Zap } from "lucide-react";

interface PlannerMealCardContentProps {
  meal: Meal;
  entryId: number;
  isPlaceholder: boolean;
  isCooked: boolean;
  /**
   * Owner request (COMP_UX1): when a slot holds more than one meal, don't
   * stack two full photos in the same cell — it re-introduces the height
   * problem the single-photo size was tuned to avoid. With 2+ entries in a
   * slot, every one of them shows name-only; the household clicks either
   * name to open its own detail/photo. Defaults true (single-entry slots
   * keep their photo).
   */
  showImage?: boolean;
}

export function PlannerMealCardContent({
  meal,
  entryId,
  isPlaceholder,
  isCooked,
  showImage = true,
}: PlannerMealCardContentProps) {
  // A quick meal is a real (non-placeholder) meal saved with no ingredient list —
  // e.g. "steak and chips" added via Build a Meal or the Companion.
  const isQuickMeal = !isPlaceholder && (meal.ingredients?.length ?? 0) === 0;

  return (
    <div className="planner-card-root flex flex-col w-full min-w-0 gap-1">
      {/* Photo — full cell width, fixed height so every cell in a row lines up
          whether or not its meal has an image. Suppressed entirely when the
          slot holds 2+ entries (showImage=false) — see prop doc above. */}
      {!isPlaceholder && showImage && (
        <div className="planner-card-photo-frame relative w-full h-11 shrink-0">
          {meal.imageUrl ? (
            <ThrottledMealImage
              src={meal.imageUrl}
              alt=""
              ariaHidden
              className="planner-card-photo w-full h-11 rounded-sm object-cover bg-muted/40"
            />
          ) : (
            <div className="planner-card-photo w-full h-11 rounded-sm bg-muted/30" />
          )}
        </div>
      )}

      {/* Meal title */}
      <span
        className={`planner-card-title text-xs sm:text-sm break-words leading-tight line-clamp-2 ${isCooked ? "line-through text-muted-foreground" : ""} ${
          isPlaceholder ? "border border-dashed border-muted-foreground/30 rounded px-1 py-0.5 text-muted-foreground/70" : ""
        }`}
      >
        {meal.name}
      </span>

      {/* Placeholder state */}
      {isPlaceholder && (
        <span
          className="text-[9px] text-muted-foreground/60 italic"
          data-testid={`label-placeholder-${entryId}`}
        >
          Needs recipe
        </span>
      )}

      {/* Quick meal label */}
      {!isPlaceholder && !isCooked && isQuickMeal && (
        <span
          className="inline-flex items-center gap-0.5 text-[9px] text-sky-600/70 dark:text-sky-400/70"
          data-testid={`label-quick-meal-${entryId}`}
        >
          <Zap className="h-2.5 w-2.5" />Quick meal
        </span>
      )}

      {/* Cooked state */}
      {isCooked && (
        <span className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70">Cooked</span>
      )}
    </div>
  );
}
