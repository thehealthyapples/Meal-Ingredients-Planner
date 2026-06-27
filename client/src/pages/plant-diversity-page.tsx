import { useState } from "react";
import { Loader2, Leaf, Lightbulb, BarChart3, Salad } from "lucide-react";
import { useWeekMealEntries } from "@/hooks/use-week-meal-entries";
import { PlantDiversityReport } from "@/components/PlantDiversityReport";
import { HouseholdNutritionCentre } from "@/components/HouseholdNutritionCentre";
import { WorkspaceHeader } from "@/components/workspace-header";
import { Link } from "wouter";

type NutritionTab = "foods" | "nutrients" | "benefits" | "suggestions";

const NUTRITION_TABS: Array<{ id: NutritionTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "foods", label: "Foods", icon: Salad },
  { id: "nutrients", label: "Nutrients", icon: BarChart3 },
  { id: "benefits", label: "Benefits", icon: Leaf },
  { id: "suggestions", label: "Suggestions", icon: Lightbulb },
];

export default function PlantDiversityPage() {
  const { weekMeals, isLoading } = useWeekMealEntries();
  const [activeTab, setActiveTab] = useState<NutritionTab>("foods");

  return (
    <>
      <WorkspaceHeader
        title="Nutrition"
        realm="nutrition"
        wide
        titleTestId="text-nutrition-report-title"
        contextBar={
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-0.5 rounded-lg bg-muted/50 p-1 border border-border/40" role="tablist">
              {NUTRITION_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={activeTab === id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium transition-all shrink-0 ${
                    activeTab === id
                      ? "shadow-sm realm-banner-btn"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`tab-nutrition-${id}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="max-w-screen-2xl 3xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">

        {activeTab === "foods" && (
          <>
            <p className="text-sm text-muted-foreground/60 leading-relaxed max-w-2xl mb-6">
              Understand what your household eats, how it supports your health, and
              discover ingredients to try next.
            </p>
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
              </div>
            ) : (
              <PlantDiversityReport weekMeals={weekMeals} />
            )}
          </>
        )}

        {activeTab === "nutrients" && (
          <>
            <p className="text-sm text-muted-foreground/60 leading-relaxed max-w-2xl mb-6">
              Track your household's nutrient intake over time and identify gaps in your diet.
            </p>
            <HouseholdNutritionCentre />
          </>
        )}

        {activeTab === "benefits" && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground/60 leading-relaxed max-w-2xl">
              Learn how the foods you eat support your health — from gut health and immunity
              to energy, sleep, and longevity.
            </p>
            <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8 max-w-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[hsl(145,22%,88%)] dark:bg-[hsl(145,14%,17%)] flex items-center justify-center shrink-0">
                  <Leaf className="h-5 w-5 text-[hsl(145,36%,28%)] dark:text-[hsl(145,26%,70%)]" />
                </div>
                <div>
                  <h2 className="font-semibold text-base">Health Benefits Explorer</h2>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We're building a benefits explorer that maps each food group to its specific
                health properties — so you can see exactly why cruciferous vegetables support
                detoxification, or why fermented foods strengthen immunity.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                In the meantime, the <strong className="font-medium text-foreground">Foods</strong> tab
                shows your plant diversity score, and the <strong className="font-medium text-foreground">Nutrients</strong> tab
                tracks your household's macro and micronutrient data.
              </p>
              <div className="pt-2">
                <Link href="/cookbook">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium realm-banner-btn transition-colors"
                  >
                    <Salad className="h-3.5 w-3.5" />
                    Explore recipes by food group
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === "suggestions" && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground/60 leading-relaxed max-w-2xl">
              Personalised ideas for what to eat more of based on your household's plant diversity and nutrient patterns.
            </p>
            <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8 max-w-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[hsl(145,22%,88%)] dark:bg-[hsl(145,14%,17%)] flex items-center justify-center shrink-0">
                  <Lightbulb className="h-5 w-5 text-[hsl(145,36%,28%)] dark:text-[hsl(145,26%,70%)]" />
                </div>
                <div>
                  <h2 className="font-semibold text-base">Personalised Suggestions</h2>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We're building personalised suggestions that look at your plant diversity gaps
                and recommend specific ingredients and meals to round out your household's diet.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                For now, your <strong className="font-medium text-foreground">Foods</strong> tab
                shows which plant families you've eaten this week — look for gaps to inspire
                what to cook next.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Link href="/planner">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium realm-banner-btn transition-colors"
                  >
                    Plan this week
                  </button>
                </Link>
                <Link href="/cookbook">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    Browse recipes
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
