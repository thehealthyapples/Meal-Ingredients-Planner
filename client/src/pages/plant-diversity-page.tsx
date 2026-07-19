import { useState, useEffect } from "react";
import { BarChart3, Salad, X } from "lucide-react";
import { useWeekMealEntries } from "@/hooks/use-week-meal-entries";
import { PlantDiversityReport } from "@/components/PlantDiversityReport";
import { HouseholdNutritionCentre } from "@/components/HouseholdNutritionCentre";
import { WorkspaceHeader, pageContainerClass } from "@/components/workspace-header";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * PROD2: the "Benefits" and "Suggestions" tabs were withdrawn.
 *
 * Both rendered a "Coming soon" card and nothing else, so half of this room's
 * doors opened onto a description of unbuilt work. A tab is a promise that
 * there is something behind it; two of these four had nothing, which is the
 * incomplete-experience-presented-as-a-destination this programme removes.
 *
 * This is a withdrawal, not a deletion of intent: the Health Benefits Explorer
 * and Personalised Suggestions remain unbuilt product ideas, and their absence
 * is now silent rather than advertised. When either is built, it returns here
 * as a tab with a room behind it.
 */
type NutritionTab = "foods" | "nutrients";

const NUTRITION_TABS: Array<{ id: NutritionTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "foods", label: "Foods", icon: Salad },
  { id: "nutrients", label: "Nutrients", icon: BarChart3 },
];

export default function PlantDiversityPage() {
  const { weekMeals, isLoading } = useWeekMealEntries();
  const [activeTab, setActiveTab] = useState<NutritionTab>("foods");
  const [mobileWorkspaceOpen, setMobileWorkspaceOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent<{ href: string }>).detail?.href === "/nutrition") {
        setMobileWorkspaceOpen(true);
      }
    };
    window.addEventListener("tha:open-workspace", handler);
    return () => window.removeEventListener("tha:open-workspace", handler);
  }, []);

  return (
    <>
      <WorkspaceHeader
        title="Nutrition"
        realm="nutrition"
        wide
        titleTestId="text-nutrition-report-title"
        contextBar={
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
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

      {/* PX1-W2 (fnd-px-plant-columns-unreachable): `w-full min-w-0` — as a flex
          item of <main>, this container's min-width:auto let the report table
          grow it past the viewport, where overflow-x-hidden clipped the columns
          instead of letting the table's own scroller work. */}
      <div className={`min-w-0 ${pageContainerClass(true)} pb-4 sm:pb-5`}>

        {activeTab === "foods" && (
          <>
            <p className="text-sm text-muted-foreground/60 leading-relaxed max-w-2xl mb-6">
              Understand what your household eats, how it supports your health, and
              discover ingredients to try next.
            </p>
            {isLoading ? (
              /* PROD2: adopts the canonical loading owner (UIA §17) in place of a
                 centred spinner. A skeleton that mirrors the report's own shape
                 tells the household what is arriving; a spinner only says "wait". */
              <div className="space-y-3" aria-busy="true" aria-label="Loading your plant diversity report">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-24 w-full rounded-lg" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
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

      </div>

      {/* ── Mobile Nutrition Workspace Drawer ─────────────────────────────── */}
      <Drawer open={mobileWorkspaceOpen} onOpenChange={setMobileWorkspaceOpen} shouldScaleBackground={false}>
        <DrawerContent
          className="flex flex-col max-h-[60vh]"
          data-testid="drawer-nutrition-workspace"
          data-realm="nutrition"
        >
          <div className="flex items-center justify-between px-4 pt-1 pb-3 shrink-0 realm-header-bg">
            <DrawerTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" style={{ color: "var(--realm-accent)" }} />
              Nutrition
            </DrawerTitle>
            <button
              onClick={() => setMobileWorkspaceOpen(false)}
              className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground transition-colors"
              aria-label="Close workspace"
              data-testid="button-nutrition-workspace-close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="w-full h-px shrink-0 bg-[var(--realm-border)]" />
          <div
            className="flex-1 overflow-y-auto min-h-0 px-4 pt-3"
            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))" }}
          >
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider py-2">View</p>
            <div className="grid grid-cols-2 gap-2 pb-3">
              {NUTRITION_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  className={`flex flex-col items-center gap-1.5 rounded-md border px-1.5 py-3 transition-colors ${
                    activeTab === id
                      ? "border-primary/40 realm-banner-btn"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                  onClick={() => { setActiveTab(id); setMobileWorkspaceOpen(false); }}
                  data-testid={`button-ws-nutrition-${id}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[11px] font-medium leading-none">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
