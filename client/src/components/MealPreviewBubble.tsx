import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/badge";
import { Globe, ChefHat, UtensilsCrossed } from "lucide-react";
import type { Meal } from "@shared/schema";
import type { WebSearchRecipe } from "@/hooks/use-planner-meal-search";

// ── Public types ──────────────────────────────────────────────────────────────

export type PreviewItem =
  | { kind: "meal"; meal: Meal }
  | { kind: "web"; recipe: WebSearchRecipe };

interface PreviewAnchor {
  top: number;
  left: number;
}

const BUBBLE_WIDTH = 220;
const BUBBLE_MAX_HEIGHT = 360;
const OPEN_DELAY_MS = 150;
const CLOSE_DELAY_MS = 200;

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useMealPreview() {
  const [previewItem, setPreviewItem] = useState<PreviewItem | null>(null);
  const [previewAnchor, setPreviewAnchor] = useState<PreviewAnchor | null>(null);
  const [mobilePreviewId, setMobilePreviewId] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openPreview = (item: PreviewItem, el: HTMLElement) => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const left = Math.max(8, rect.left - BUBBLE_WIDTH - 8);
      const top = Math.max(10, Math.min(rect.top - 20, window.innerHeight - BUBBLE_MAX_HEIGHT - 10));
      setPreviewItem(item);
      setPreviewAnchor({ top, left });
    }, OPEN_DELAY_MS);
  };

  const scheduleClose = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    closeTimer.current = setTimeout(() => {
      setPreviewItem(null);
      setPreviewAnchor(null);
    }, CLOSE_DELAY_MS);
  };

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const closePreview = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setPreviewItem(null);
    setPreviewAnchor(null);
  };

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (openTimer.current) clearTimeout(openTimer.current);
    };
  }, []);

  return {
    previewItem,
    previewAnchor,
    mobilePreviewId,
    setMobilePreviewId,
    openPreview,
    scheduleClose,
    cancelClose,
    closePreview,
  };
}

// ── Shared preview content ────────────────────────────────────────────────────

function PreviewCardContent({ item, showAllIngredients = false }: { item: PreviewItem; showAllIngredients?: boolean }) {
  const name = item.kind === "meal" ? item.meal.name : item.recipe.name;
  const image = item.kind === "meal" ? (item.meal.imageUrl ?? null) : item.recipe.image;
  const ingredients = item.kind === "meal" ? item.meal.ingredients : item.recipe.ingredients;
  const dietTypes = item.kind === "meal" ? (item.meal.dietTypes ?? []) : [];

  return (
    <div>
      {image ? (
        <img src={image} alt={name} className="w-full h-28 object-cover" />
      ) : (
        <div className="w-full h-14 bg-muted flex items-center justify-center">
          {item.kind === "web" ? (
            <Globe className="h-5 w-5 text-muted-foreground/30" />
          ) : item.meal.isReadyMeal ? (
            <UtensilsCrossed className="h-5 w-5 text-muted-foreground/30" />
          ) : (
            <ChefHat className="h-5 w-5 text-muted-foreground/30" />
          )}
        </div>
      )}

      <div className="p-2.5 space-y-1.5">
        <p className="text-sm font-semibold leading-snug line-clamp-2">{name}</p>

        <div className="flex flex-wrap gap-1">
          {item.kind === "web" ? (
            <>
              <Badge
                variant="outline"
                className="text-[10px] px-1 border-orange-300/60 text-orange-600 dark:border-orange-600/40 dark:text-orange-400"
              >
                Web recipe
              </Badge>
              {item.recipe.source && (
                <span className="text-[10px] text-muted-foreground/60 self-center">
                  {item.recipe.source}
                </span>
              )}
            </>
          ) : item.meal.isReadyMeal ? (
            <Badge variant="outline" className="text-[10px] px-1">
              Ready Meal
            </Badge>
          ) : !(item.meal as { isSystemMeal?: boolean }).isSystemMeal ? (
            <Badge variant="outline" className="text-[10px] px-1 border-blue-400/60 text-blue-500">
              Cookbook
            </Badge>
          ) : null}
          {dietTypes.slice(0, 3).map((d) => (
            <Badge key={d} variant="outline" className="text-[10px] px-1 capitalize">
              {d}
            </Badge>
          ))}
        </div>

        {ingredients.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
              Ingredients
            </p>
            {showAllIngredients ? (
              <ul className="max-h-36 overflow-y-auto space-y-0.5">
                {ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-1 text-[11px] text-muted-foreground leading-snug">
                    <span className="shrink-0 mt-px text-muted-foreground/40">·</span>
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                {ingredients.slice(0, 6).join(", ")}
                {ingredients.length > 6 ? "…" : ""}
              </p>
            )}
          </div>
        )}

        {item.kind === "meal" && item.meal.servings > 1 && (
          <p className="text-[10px] text-muted-foreground">{item.meal.servings} servings</p>
        )}
      </div>
    </div>
  );
}

// ── Desktop floating bubble (portal) ─────────────────────────────────────────

interface MealPreviewBubbleProps {
  item: PreviewItem;
  anchor: { top: number; left: number };
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  showAllIngredients?: boolean;
}

export function MealPreviewBubble({
  item,
  anchor,
  onMouseEnter,
  onMouseLeave,
  showAllIngredients,
}: MealPreviewBubbleProps) {
  return createPortal(
    <div
      className="fixed z-50 rounded-xl border border-border bg-popover shadow-xl overflow-hidden animate-in fade-in-0 duration-150"
      style={{
        left: anchor.left,
        top: anchor.top,
        width: BUBBLE_WIDTH,
        maxHeight: BUBBLE_MAX_HEIGHT,
        overflowY: "auto",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="tooltip"
      aria-label={`Meal preview: ${item.kind === "meal" ? item.meal.name : item.recipe.name}`}
    >
      <PreviewCardContent item={item} showAllIngredients={showAllIngredients} />
    </div>,
    document.body,
  );
}

// ── Mobile inline card ────────────────────────────────────────────────────────

interface MealPreviewInlineProps {
  item: PreviewItem;
  onAction?: () => void;
  actionLabel?: string;
  actionDisabled?: boolean;
  onDismiss: () => void;
  showAllIngredients?: boolean;
}

export function MealPreviewInline({
  item,
  onAction,
  actionLabel,
  actionDisabled,
  onDismiss,
  showAllIngredients,
}: MealPreviewInlineProps) {
  return (
    <div
      className="mx-1 mb-1 rounded-lg border border-border bg-card shadow-sm overflow-hidden animate-in fade-in-0 duration-150"
      role="region"
      aria-label={`Preview: ${item.kind === "meal" ? item.meal.name : item.recipe.name}`}
    >
      <PreviewCardContent item={item} showAllIngredients={showAllIngredients} />
      <div className="flex gap-2 px-2.5 pb-2.5 pt-1 border-t border-border/40">
        {onAction && actionLabel && (
          <button
            onClick={onAction}
            disabled={actionDisabled}
            className="flex-1 text-xs font-medium py-1.5 px-3 bg-primary text-primary-foreground rounded-md disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {actionLabel}
          </button>
        )}
        <button
          onClick={onDismiss}
          className="flex-1 text-xs py-1.5 px-3 border border-border rounded-md text-muted-foreground hover:text-foreground transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
