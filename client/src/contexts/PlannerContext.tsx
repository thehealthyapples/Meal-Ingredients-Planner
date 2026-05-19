import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export type AssistantMode = "scan" | "smart" | "templates" | "manual" | "bulk" | "day" | "smart-review" | "scan-review" | "settings" | "resolve" | "placeholder-review" | null;

// ── Phase 5C: session persistence ─────────────────────────────────────────────
const WORKSPACE_MODE_KEY = "planner-workspace-mode";
const WORKSPACE_DAY_KEY = "planner-selected-day";

// Only self-contained modes with no external payload requirement are restorable.
// Excluded: smart-review (needs smartResult), scan-review (needs scan data),
//           manual (needs pickerTarget), day (needs day context).
// resolve is restorable since Phase B persists resolveTarget to sessionStorage.
const RESTORABLE_MODES = new Set<string>(["smart", "templates", "settings", "placeholder-review", "bulk", "resolve"]);

function saveWorkspaceMode(mode: AssistantMode): void {
  try {
    if (mode && RESTORABLE_MODES.has(mode)) {
      sessionStorage.setItem(WORKSPACE_MODE_KEY, mode);
    } else {
      sessionStorage.removeItem(WORKSPACE_MODE_KEY);
    }
  } catch {}
}

function loadWorkspaceMode(): AssistantMode {
  try {
    const raw = sessionStorage.getItem(WORKSPACE_MODE_KEY);
    if (!raw) return null;
    if (RESTORABLE_MODES.has(raw)) return raw as AssistantMode;
    sessionStorage.removeItem(WORKSPACE_MODE_KEY);
    return null;
  } catch { return null; }
}

function saveSelectedDay(id: number | null): void {
  try {
    if (id !== null) {
      sessionStorage.setItem(WORKSPACE_DAY_KEY, String(id));
    } else {
      sessionStorage.removeItem(WORKSPACE_DAY_KEY);
    }
  } catch {}
}

function loadSelectedDay(): number | null {
  try {
    const raw = sessionStorage.getItem(WORKSPACE_DAY_KEY);
    if (!raw) return null;
    const id = parseInt(raw, 10);
    return isNaN(id) ? null : id;
  } catch { return null; }
}

// ── Context interface ──────────────────────────────────────────────────────────

interface PlannerContextValue {
  assistantMode: AssistantMode;
  setAssistantMode: (mode: AssistantMode) => void;
  plannerRefresh: () => void;
  selectedDayId: number | null;
  setSelectedDayId: (id: number | null) => void;
}

const PlannerContext = createContext<PlannerContextValue | null>(null);

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();

  // Restore from sessionStorage on mount (lazy initializer runs once).
  // assistantMode restoration is desktop-only: on mobile the panel renders as a
  // bottom sheet, so auto-restoring an open mode would cause it to appear on load.
  const [assistantMode, setAssistantMode] = useState<AssistantMode>(() => {
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
    return isDesktop ? loadWorkspaceMode() : null;
  });

  const [selectedDayId, setSelectedDayId] = useState<number | null>(() => loadSelectedDay());

  // Persist to sessionStorage whenever state changes.
  useEffect(() => { saveWorkspaceMode(assistantMode); }, [assistantMode]);
  useEffect(() => { saveSelectedDay(selectedDayId); }, [selectedDayId]);

  const plannerRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
  }, [qc]);

  return (
    <PlannerContext.Provider value={{ assistantMode, setAssistantMode, plannerRefresh, selectedDayId, setSelectedDayId }}>
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlannerContext() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlannerContext must be used within PlannerProvider");
  return ctx;
}
