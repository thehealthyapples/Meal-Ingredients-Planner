import { Baby, PersonStanding, Wine, ShoppingCart, Users } from "lucide-react";

type WatermarkType = "adult" | "baby" | "child" | "drink" | "ready";

interface MealWatermarkProps {
  type: WatermarkType;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-12 w-12",
  md: "h-20 w-20",
  lg: "h-28 w-28",
};

export function MealWatermark({ type, size = "md", className = "" }: MealWatermarkProps) {
  const iconSize = sizeMap[size];
  const baseClass = `absolute pointer-events-none select-none ${className}`;

  switch (type) {
    case "baby":
      return (
        <div className={baseClass} data-testid="watermark-baby">
          <Baby className={`${iconSize} text-pink-400/[0.08]`} />
        </div>
      );
    case "child":
      return (
        <div className={baseClass} data-testid="watermark-child">
          <PersonStanding className={`${iconSize} text-sky-400/[0.08]`} />
        </div>
      );
    case "drink":
      return (
        <div className={baseClass} data-testid="watermark-drink">
          <Wine className={`${iconSize} text-purple-400/[0.08]`} />
        </div>
      );
    case "ready":
      return (
        <div className={baseClass} data-testid="watermark-ready">
          <ShoppingCart className={`${iconSize} text-green-400/[0.08]`} />
        </div>
      );
    case "adult":
      return (
        <div className={`${baseClass} flex gap-1`} data-testid="watermark-adult">
          <Users className={`${iconSize} text-green-500/[0.08]`} />
        </div>
      );
    default:
      return null;
  }
}

export function getWatermarkType(meal: {
  audience?: string;
  isDrink?: boolean;
  isReadyMeal?: boolean;
  isSystemMeal?: boolean;
}): WatermarkType | null {
  if (meal.audience === "baby") return "baby";
  if (meal.audience === "child") return "child";
  if (meal.isDrink) return "drink";
  if (meal.isReadyMeal && meal.isSystemMeal) return "ready";
  if (!meal.isSystemMeal && meal.audience !== "baby" && meal.audience !== "child") return "adult";
  return null;
}
