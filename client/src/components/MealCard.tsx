// PX1-W4.3 — the canonical meal presentation (fnd-px-no-meal-card-owner).
//
// PX1 found 16 render sites for "a meal" with thumbnails at SEVEN distinct sizes,
// three corner radii and three fallback icons — the product's core noun was a
// different object on every screen, and only one render site was a real component
// (the planner cell's `PlannerMealCardContent`, which owns the planner-grid face
// and stays where it is: it renders no thumbnail and lives inside a grid cell).
//
// This module owns the thumbnail-bearing faces:
//
//   `MealThumbnail` — ONE image treatment: one radius, one fallback icon, one
//   size scale, lazy loading. Anywhere a meal shows its picture, it is this.
//
//   `MealCard` — the two most-duplicated arrangements:
//     variant="tile" — image-top card for grids (Dashboard, Cookbook grids)
//     variant="row"  — thumbnail + name + meta line for lists
//
// Render sites migrate here as they are touched; new meal renders MUST compose
// this. The full 16-site migration is tracked in PX1W4 §6.

import type { ReactNode } from "react";
import { Link } from "wouter";
import { UtensilsCrossed } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface MealCardMeal {
  id: number | string;
  name: string;
  imageUrl?: string | null;
}

const THUMB_SIZE = {
  xs: "w-7 h-7",
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-16 h-16",
} as const;

const THUMB_ICON = {
  xs: "h-3.5 w-3.5",
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-6 w-6",
} as const;

export function MealThumbnail({
  meal,
  size = "md",
  className,
}: {
  meal: Pick<MealCardMeal, "name" | "imageUrl">;
  size?: keyof typeof THUMB_SIZE;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center",
        THUMB_SIZE[size],
        className,
      )}
    >
      {meal.imageUrl ? (
        <img
          src={meal.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <UtensilsCrossed className={cn("text-muted-foreground/40", THUMB_ICON[size])} aria-hidden="true" />
      )}
    </div>
  );
}

interface MealCardProps {
  meal: MealCardMeal;
  variant: "tile" | "row";
  /** Secondary line: ingredient count, meal type, prep time — the caller's facts. */
  meta?: ReactNode;
  /** When set, the whole card links to this page (EXP Principle 6: the entity's
   *  canonical page). Defaults to the meal's own page. Pass null for no link. */
  href?: string | null;
  thumbnailSize?: keyof typeof THUMB_SIZE;
  className?: string;
  "data-testid"?: string;
}

export function MealCard({
  meal,
  variant,
  meta,
  href = undefined,
  thumbnailSize,
  className,
  "data-testid": testId,
}: MealCardProps) {
  const target = href === undefined ? `/meals/${meal.id}` : href;

  const body =
    variant === "tile" ? (
      <Card
        className={cn(
          "group overflow-hidden transition-all duration-200",
          target && "cursor-pointer hover-elevate",
          className,
        )}
        data-testid={testId}
      >
        <div className="w-full aspect-[4/3] overflow-hidden bg-muted flex items-center justify-center">
          {meal.imageUrl ? (
            <img
              src={meal.imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <UtensilsCrossed className="h-8 w-8 text-muted-foreground/40" aria-hidden="true" />
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="title-card truncate">{meal.name}</h3>
          {meta && <p className="text-xs text-muted-foreground mt-0.5">{meta}</p>}
        </CardContent>
      </Card>
    ) : (
      <div
        className={cn("flex items-center gap-2.5 min-w-0", className)}
        data-testid={testId}
      >
        <MealThumbnail meal={meal} size={thumbnailSize ?? "sm"} />
        <span className="text-sm truncate">{meal.name}</span>
        {meta && (
          <span className="text-[11px] text-muted-foreground/70 shrink-0 ml-auto">{meta}</span>
        )}
      </div>
    );

  return target ? <Link href={target}>{body}</Link> : body;
}
