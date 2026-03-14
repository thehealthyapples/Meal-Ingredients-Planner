import {
  Heart, ShieldAlert, PiggyBank, Dumbbell, TrendingDown, TrendingUp,
  Shield, Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface GoalOption {
  id: string;
  label: string;
  icon: LucideIcon;
  desc: string;
}

export const GOAL_OPTIONS: GoalOption[] = [
  { id: "put-on-weight",  label: "Put on weight",              icon: TrendingUp,   desc: "Fuel your body to gain healthy weight" },
  { id: "build-muscle",   label: "Build muscle",               icon: Dumbbell,     desc: "Meals that support strength and recovery" },
  { id: "improve-health", label: "Improve health",             icon: Heart,        desc: "Better nutrition every day" },
  { id: "lose-weight",    label: "Lose weight",                icon: TrendingDown, desc: "Balanced, calorie-conscious plans" },
  { id: "save-money",     label: "Save money",                 icon: PiggyBank,    desc: "Smart choices that fit your budget" },
  { id: "avoid-upf",      label: "Avoid ultra-processed foods",icon: ShieldAlert,  desc: "Choose simpler, cleaner ingredients" },
];

export interface StoreOption {
  id: string;
  label: string;
}

export const STORE_OPTIONS: StoreOption[] = [
  { id: "tesco",      label: "Tesco" },
  { id: "sainsburys", label: "Sainsbury's" },
  { id: "waitrose",   label: "Waitrose" },
  { id: "ocado",      label: "Ocado" },
  { id: "aldi",       label: "Aldi" },
  { id: "lidl",       label: "Lidl" },
  { id: "asda",       label: "Asda" },
  { id: "local",      label: "Local shops" },
];

export interface UPFOption {
  id: string;
  label: string;
  icon: LucideIcon;
  desc: string;
}

export const UPF_OPTIONS: UPFOption[] = [
  { id: "strict",   label: "Mostly whole foods",   icon: Shield,     desc: "Lean as natural and minimally processed as possible" },
  { id: "moderate", label: "A balanced approach",  icon: ShieldAlert,desc: "Prefer simpler ingredients, but convenience still matters" },
  { id: "flexible", label: "Flexible",             icon: Sparkles,   desc: "Happy with a mix of fresh and convenient options" },
];

export interface BudgetOption {
  id: string;
  label: string;
  desc: string;
}

export const BUDGET_OPTIONS: BudgetOption[] = [
  { id: "budget",         label: "Best value",                               desc: "Great nutrition without overspending" },
  { id: "standard",       label: "Balanced",                                 desc: "A good mix of quality and value" },
  { id: "premium",        label: "Higher quality",                           desc: "Better brands and better ingredients" },
  { id: "organic",        label: "Organic when possible",                    desc: "Certified organic products where available" },
  { id: "grass-finished", label: "Pasture-raised / grass-fed where it matters", desc: "Premium sourced meat and dairy" },
];

export function deriveGoalType(healthGoals: string[]): string {
  if (healthGoals.includes("lose-weight"))   return "lose";
  if (healthGoals.includes("build-muscle") || healthGoals.includes("put-on-weight")) return "build";
  if (healthGoals.includes("improve-health")) return "health";
  return "maintain";
}
