import { createContext, useContext, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

export type AssistantMode = "scan" | "smart" | "templates" | "manual" | "bulk" | "day" | null;

interface PlannerContextValue {
  assistantMode: AssistantMode;
  setAssistantMode: (mode: AssistantMode) => void;
  plannerRefresh: () => void;
}

const PlannerContext = createContext<PlannerContextValue | null>(null);

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [assistantMode, setAssistantMode] = useState<AssistantMode>(null);

  const plannerRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
  }, [qc]);

  return (
    <PlannerContext.Provider value={{ assistantMode, setAssistantMode, plannerRefresh }}>
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlannerContext() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlannerContext must be used within PlannerProvider");
  return ctx;
}
