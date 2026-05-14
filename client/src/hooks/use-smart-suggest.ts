import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Meal, Nutrition } from "@shared/schema";
import type { FullWeek, SmartSuggestEntry, SmartSuggestResult } from "@/lib/planner-types";

// ── Session persistence (mirrors scan-review pattern) ────────────────────────
const SMART_SESSION_KEY = "planner-smart-review-session";

interface SmartSessionData {
  smartResult: SmartSuggestResult;
  lockedEntries: string[];
}

function saveSmartSession(data: SmartSessionData): void {
  try { sessionStorage.setItem(SMART_SESSION_KEY, JSON.stringify(data)); } catch {}
}

function loadSmartSession(): SmartSessionData | null {
  try {
    const raw = sessionStorage.getItem(SMART_SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SmartSessionData;
    if (!data?.smartResult?.entries) return null;
    return data;
  } catch { return null; }
}

function clearSmartSession(): void {
  try { sessionStorage.removeItem(SMART_SESSION_KEY); } catch {}
}

interface UseSmartSuggestOptions {
  meals: Meal[];
  fullPlanner: FullWeek[];
  activeWeek: string;
  activeWeekData: FullWeek | undefined;
  onReviewReady?: () => void;
  onApplied?: () => void;
}

export function useSmartSuggest({
  meals,
  fullPlanner,
  activeWeek,
  activeWeekData,
  onReviewReady,
  onApplied,
}: UseSmartSuggestOptions) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [smartLoading, setSmartLoading] = useState(false);
  const [smartResult, setSmartResult] = useState<SmartSuggestResult | null>(null);
  const [smartNutritionMap, setSmartNutritionMap] = useState<Map<number, Nutrition>>(new Map());
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [nutritionFetchTick, setNutritionFetchTick] = useState(0);
  const [smartControlsOpen, setSmartControlsOpen] = useState(false);
  const [smartMealsPerDay, setSmartMealsPerDay] = useState("3");
  const [smartCuisine, setSmartCuisine] = useState("");
  const [smartBudget, setSmartBudget] = useState("");
  const [smartMaxUPF, setSmartMaxUPF] = useState("");
  const [smartFishPerWeek, setSmartFishPerWeek] = useState("2");
  const [smartRedMeatPerWeek, setSmartRedMeatPerWeek] = useState("3");
  const [smartVegDays, setSmartVegDays] = useState(false);
  const [smartLeftovers, setSmartLeftovers] = useState(false);
  const [lockedEntries, setLockedEntries] = useState<Set<string>>(new Set());
  const [expandedExplanation, setExpandedExplanation] = useState<string | null>(null);
  const [applyingSmartPlan, setApplyingSmartPlan] = useState(false);
  const [restoredFromSession, setRestoredFromSession] = useState(false);
  const sessionRestoreAttempted = useRef(false);

  useEffect(() => {
    if (!smartResult) return;
    const internalIds = smartResult.entries
      .filter(e => !e.candidate.isExternal)
      .map(e => Number(e.candidate.id))
      .filter(id => !isNaN(id));
    if (internalIds.length === 0) return;

    let cancelled = false;
    const retryDelays = [0, 5000, 10000, 20000, 35000];

    const fetchOnce = async (): Promise<boolean> => {
      const r = await apiRequest('POST', '/api/nutrition/bulk', { mealIds: internalIds });
      const data: Nutrition[] = await r.json();
      if (cancelled) return true;
      const map = new Map<number, Nutrition>();
      data.forEach(n => { if (n.mealId) map.set(n.mealId, n); });
      setSmartNutritionMap(map);
      const allLoaded = internalIds.every(id => data.some(n => n.mealId === id && n.calories));
      return allLoaded;
    };

    const runWithRetry = async () => {
      setNutritionLoading(true);
      try {
        for (let attempt = 0; attempt < retryDelays.length; attempt++) {
          if (cancelled) break;
          if (attempt > 0) {
            await new Promise(r => setTimeout(r, retryDelays[attempt]));
          }
          if (cancelled) break;
          const done = await fetchOnce();
          if (done || cancelled) break;
        }
      } catch {
        // swallow fetch errors
      } finally {
        if (!cancelled) setNutritionLoading(false);
      }
    };

    runWithRetry();
    return () => { cancelled = true; };
  }, [smartResult, nutritionFetchTick]);

  // Restore saved session on first mount (before any live result arrives)
  useEffect(() => {
    if (sessionRestoreAttempted.current) return;
    sessionRestoreAttempted.current = true;
    if (smartResult) return; // live result already present
    const session = loadSmartSession();
    if (!session) return;
    setSmartResult(session.smartResult);
    setLockedEntries(new Set(session.lockedEntries));
    setRestoredFromSession(true);
    onReviewReady?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist smart result + locks to session whenever they change
  useEffect(() => {
    if (smartResult) {
      saveSmartSession({ smartResult, lockedEntries: Array.from(lockedEntries) });
    }
  }, [smartResult, lockedEntries]);

  const runSmartSuggest = async (preserveLocks = false) => {
    setSmartLoading(true);
    try {
      const locked: { dayOfWeek: number; slot: string; candidateId: string | number; candidateName: string }[] = [];

      const mealNameById = new Map(meals.map(m => [m.id, m.name]));
      const currentWeek = fullPlanner.find(w => String(w.weekNumber) === activeWeek);
      if (currentWeek) {
        for (const day of currentWeek.days) {
          for (const entry of day.entries) {
            const slot = entry.mealType === 'snacks' ? 'snack' : entry.mealType;
            locked.push({
              dayOfWeek: day.dayOfWeek,
              slot,
              candidateId: entry.mealId,
              candidateName: mealNameById.get(entry.mealId) ?? '',
            });
          }
        }
      }

      if (preserveLocks && smartResult) {
        for (const entry of smartResult.entries) {
          const key = `${entry.dayOfWeek}-${entry.slot}`;
          if (lockedEntries.has(key)) {
            const alreadyLocked = locked.some(l => l.dayOfWeek === entry.dayOfWeek && l.slot === entry.slot);
            if (!alreadyLocked) {
              locked.push({ dayOfWeek: entry.dayOfWeek, slot: entry.slot, candidateId: entry.candidate.id, candidateName: entry.candidate.name });
            }
          }
        }
      }

      const res = await apiRequest('POST', '/api/meal-plans/smart-suggest', {
        mealsPerDay: Number(smartMealsPerDay) || 3,
        includeLeftovers: smartLeftovers,
        maxWeeklyBudget: smartBudget ? Number(smartBudget) : undefined,
        maxWeeklyUPF: smartMaxUPF ? Number(smartMaxUPF) : undefined,
        preferredCuisine: smartCuisine || undefined,
        fishPerWeek: Number(smartFishPerWeek),
        redMeatPerWeek: Number(smartRedMeatPerWeek),
        vegetarianDays: smartVegDays,
        lockedEntries: locked.length > 0 ? locked : undefined,
      });
      const data = await res.json() as SmartSuggestResult;
      setSmartResult(data);
      if (!preserveLocks) setLockedEntries(new Set());
      setSmartControlsOpen(false);
      onReviewReady?.();
    } catch {
      toast({ title: "Plan generation failed", description: "Could not propose a plan. Try again.", variant: "destructive" });
    } finally {
      setSmartLoading(false);
    }
  };

  const toggleLockEntry = (key: string) => {
    setLockedEntries(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const applySmartSuggestion = async () => {
    if (!smartResult || !activeWeekData) return;
    setApplyingSmartPlan(true);
    let importedCount = 0;
    let failedCount = 0;
    try {
      for (const entry of smartResult.entries) {
        const day = activeWeekData.days.find(d => d.dayOfWeek === entry.dayOfWeek);
        if (!day) continue;
        try {
          let mealId: number;
          if (entry.candidate.isExternal) {
            const importRes = await apiRequest('POST', '/api/smart-suggest/auto-import', { candidate: entry.candidate });
            const importData = await importRes.json();
            mealId = importData.mealId;
            importedCount++;
          } else {
            mealId = Number(entry.candidate.id);
          }
          await apiRequest('POST', `/api/planner/days/${day.id}/items`, {
            mealSlot: entry.slot,
            mealId,
            position: 0,
            audience: 'adult',
            isDrink: false,
            drinkType: null,
          });
        } catch {
          failedCount++;
        }
      }
      qc.invalidateQueries({ queryKey: ['/api/planner/full'] });
      setSmartResult(null);
      clearSmartSession();
      onApplied?.();
      const desc = failedCount === 0
        ? `${smartResult.entries.length - failedCount} meals added to Week ${activeWeek}.${importedCount > 0 ? ` ${importedCount} recipes auto-imported.` : ''}`
        : `${smartResult.entries.length - failedCount} meals added. ${failedCount} could not be added.`;
      toast({ title: "Plan applied", description: desc });
    } catch {
      toast({ title: "Failed to apply plan", variant: "destructive" });
    } finally {
      setApplyingSmartPlan(false);
    }
  };

  const regenerateSingleEntry = async (targetEntry: SmartSuggestEntry) => {
    if (!smartResult) return;
    const targetKey = `${targetEntry.dayOfWeek}-${targetEntry.slot}`;
    const locked = smartResult.entries
      .filter(e => `${e.dayOfWeek}-${e.slot}` !== targetKey)
      .map(e => ({ dayOfWeek: e.dayOfWeek, slot: e.slot, candidateId: e.candidate.id, candidateName: e.candidate.name }));
    setSmartLoading(true);
    try {
      const res = await apiRequest('POST', '/api/meal-plans/smart-suggest', {
        mealsPerDay: Number(smartMealsPerDay) || 3,
        includeLeftovers: smartLeftovers,
        maxWeeklyBudget: smartBudget ? Number(smartBudget) : undefined,
        maxWeeklyUPF: smartMaxUPF ? Number(smartMaxUPF) : undefined,
        preferredCuisine: smartCuisine || undefined,
        fishPerWeek: Number(smartFishPerWeek),
        redMeatPerWeek: Number(smartRedMeatPerWeek),
        vegetarianDays: smartVegDays,
        lockedEntries: locked,
      });
      const data = await res.json() as SmartSuggestResult;
      const newEntry = data.entries.find(e => e.dayOfWeek === targetEntry.dayOfWeek && e.slot === targetEntry.slot);
      if (newEntry) {
        setSmartResult(prev => prev ? {
          ...prev,
          entries: prev.entries.map(e =>
            e.dayOfWeek === targetEntry.dayOfWeek && e.slot === targetEntry.slot ? newEntry : e
          ),
          stats: data.stats,
        } : null);
      }
    } catch {
      toast({ title: "Could not refresh this meal", variant: "destructive" });
    } finally {
      setSmartLoading(false);
    }
  };

  const clearSmartResult = () => {
    setSmartResult(null);
    setLockedEntries(new Set());
    clearSmartSession();
    setRestoredFromSession(false);
  };

  const dismissRestoreBanner = () => setRestoredFromSession(false);

  return {
    smartLoading,
    smartResult,
    smartNutritionMap,
    nutritionLoading,
    nutritionFetchTick,
    setNutritionFetchTick,
    smartControlsOpen,
    setSmartControlsOpen,
    smartMealsPerDay,
    setSmartMealsPerDay,
    smartCuisine,
    setSmartCuisine,
    smartBudget,
    setSmartBudget,
    smartMaxUPF,
    setSmartMaxUPF,
    smartFishPerWeek,
    setSmartFishPerWeek,
    smartRedMeatPerWeek,
    setSmartRedMeatPerWeek,
    smartVegDays,
    setSmartVegDays,
    smartLeftovers,
    setSmartLeftovers,
    lockedEntries,
    expandedExplanation,
    setExpandedExplanation,
    applyingSmartPlan,
    restoredFromSession,
    dismissRestoreBanner,
    runSmartSuggest,
    toggleLockEntry,
    applySmartSuggestion,
    regenerateSingleEntry,
    clearSmartResult,
  };
}
