import { Coffee, Salad, UtensilsCrossed, Apple, GlassWater, Cake, Wine, Shield, Pill } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Breakfast": Coffee,
  "Lunch": Salad,
  "Dinner": UtensilsCrossed,
  "Snack": Apple,
  "Smoothie": GlassWater,
  "Dessert": Cake,
  "Drink": Wine,
  "Immune Boost": Shield,
  "Supplement": Pill,
};

export const CATEGORY_COLORS: Record<string, string> = {
  "Breakfast":    "text-muted-foreground",
  "Lunch":        "text-muted-foreground",
  "Dinner":       "text-muted-foreground",
  "Snack":        "text-muted-foreground",
  "Smoothie":     "text-muted-foreground",
  "Dessert":      "text-muted-foreground",
  "Drink":        "text-muted-foreground",
  "Immune Boost": "text-muted-foreground",
  "Supplement":   "text-muted-foreground",
};

export function getCategoryIcon(name: string): LucideIcon {
  return CATEGORY_ICONS[name] || UtensilsCrossed;
}

export function getCategoryColor(name: string): string {
  return CATEGORY_COLORS[name] || "text-muted-foreground";
}
