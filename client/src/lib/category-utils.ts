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
  "Breakfast": "text-amber-500",
  "Lunch": "text-green-500",
  "Dinner": "text-orange-500",
  "Snack": "text-pink-500",
  "Smoothie": "text-purple-500",
  "Dessert": "text-rose-500",
  "Drink": "text-blue-500",
  "Immune Boost": "text-emerald-500",
  "Supplement": "text-cyan-500",
};

export function getCategoryIcon(name: string): LucideIcon {
  return CATEGORY_ICONS[name] || UtensilsCrossed;
}

export function getCategoryColor(name: string): string {
  return CATEGORY_COLORS[name] || "text-muted-foreground";
}
