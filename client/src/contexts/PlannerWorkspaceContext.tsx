import { createContext, useContext } from "react";

export interface PlannerWorkspaceContextValue {
  // Smart suggest controls
  smartMealsPerDay: string;
  setSmartMealsPerDay: (v: string) => void;
  smartCuisine: string;
  setSmartCuisine: (v: string) => void;
  smartBudget: string;
  setSmartBudget: (v: string) => void;
  smartMaxUPF: string;
  setSmartMaxUPF: (v: string) => void;
  smartFishPerWeek: string | null;
  setSmartFishPerWeek: (v: string | null) => void;
  smartRedMeatPerWeek: string | null;
  setSmartRedMeatPerWeek: (v: string | null) => void;
  smartVegDays: string | null;
  setSmartVegDays: (v: string | null) => void;
  smartLeftovers: boolean;
  setSmartLeftovers: (v: boolean) => void;
  smartLoading: boolean;
  onRunSmartSuggest: () => void;
  // Planner settings
  plannerSettings: {
    showCalories: boolean;
    enableBabyMeals: boolean;
    enableChildMeals: boolean;
    enableDrinks: boolean;
  } | undefined;
  toggleSetting: (key: string, value: boolean) => void;
  settingsUpdating: boolean;
}

const PlannerWorkspaceContext = createContext<PlannerWorkspaceContextValue | null>(null);

export { PlannerWorkspaceContext };

export function usePlannerWorkspaceContext() {
  const ctx = useContext(PlannerWorkspaceContext);
  if (!ctx) throw new Error("usePlannerWorkspaceContext must be used within PlannerWorkspaceContext.Provider");
  return ctx;
}
