import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTrackedMutation } from "@/hooks/use-tracked-mutation";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import type { FullWeek, FullDay } from "@/lib/planner-types";
import type { PlannerEntry } from "@shared/schema";
import type { EntryTarget } from "@/components/PlannerMealPickerPanel";
import { invalidateMealLibrary } from "@/hooks/use-meals";

export interface FreezerDeduction {
  mealId: number;
  mealName: string;
  portionsRequested: number;
  portionsDeducted: number;
}

export interface ShoppingHandoffData {
  itemCount: number;
  needsReviewCount: number;
  freezerDeductions: FreezerDeduction[];
}

// Minimal duplicates of page-level slot helpers — kept local to avoid a shared-utils file
function getSlotEntries(entries: PlannerEntry[], mealType: string, audience: string, isDrink = false): PlannerEntry[] {
  return entries
    .filter(e => e.mealType === mealType && e.audience === audience && e.isDrink === isDrink)
    .sort((a, b) => a.position !== b.position ? a.position - b.position : a.id - b.id);
}

interface UsePlannerOperationsOptions {
  fullPlanner: FullWeek[];
  selectedDayId: number | null;
  activeWeekNumber: number;
  onSlotCleared?: () => void;
  onWeekCleared?: () => void;
  onShoppingHandoff?: (data: ShoppingHandoffData) => void;
}

export function usePlannerOperations({
  fullPlanner,
  selectedDayId,
  activeWeekNumber,
  onSlotCleared,
  onWeekCleared,
  onShoppingHandoff,
}: UsePlannerOperationsOptions) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const upsertEntryMutation = useMutation({
    mutationFn: async (params: { dayId: number; mealType: string; audience: string; mealId: number | null; isDrink?: boolean; drinkType?: string | null }) => {
      const res = await apiRequest("PUT", `/api/planner/days/${params.dayId}/entries`, {
        mealType: params.mealType,
        audience: params.audience,
        mealId: params.mealId,
        isDrink: params.isDrink ?? false,
        drinkType: params.drinkType ?? null,
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
    },
    onError: () => {
      toast({ title: "Failed to update meal", variant: "destructive" });
    },
  });

  const addEntryMutation = useMutation({
    mutationFn: async (params: { dayId: number; mealType: string; audience: string; mealId: number; position: number; isDrink: boolean; drinkType?: string | null }) => {
      const res = await apiRequest("POST", `/api/planner/days/${params.dayId}/items`, {
        mealSlot: params.mealType,
        mealId: params.mealId,
        position: params.position,
        audience: params.audience,
        isDrink: params.isDrink,
        drinkType: params.drinkType ?? null,
      });
      return res.json();
    },
    onMutate: async (params) => {
      await qc.cancelQueries({ queryKey: ["/api/planner/full"] });
      const previousData = qc.getQueryData<FullWeek[]>(["/api/planner/full"]);
      const tempEntry: PlannerEntry = {
        id: -Date.now(),
        dayId: params.dayId,
        mealType: params.mealType,
        audience: params.audience,
        mealId: params.mealId,
        calories: 0,
        isDrink: params.isDrink,
        drinkType: params.drinkType ?? null,
        position: params.position,
        adaptationResult: null,
        guestEaters: null,
        originalMealIdBeforeVariant: null,
      };
      qc.setQueryData<FullWeek[]>(["/api/planner/full"], (old) => {
        if (!old) return old;
        return old.map((week) => ({
          ...week,
          days: week.days.map((day) => {
            if (day.id !== params.dayId) return day;
            return { ...day, entries: [...day.entries, tempEntry] };
          }),
        }));
      });
      return { previousData };
    },
    onError: (_err, _params, context) => {
      if (context?.previousData) qc.setQueryData(["/api/planner/full"], context.previousData);
      toast({ title: "Failed to add meal", description: "Planner restored to previous state", variant: "destructive" });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
      // RM4: recency/frequency ordering of the ready-meal library follows planning
      qc.invalidateQueries({ queryKey: ["/api/planner/ready-meal-library"] });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: number) => {
      const res = await apiRequest("DELETE", `/api/planner/entries/${entryId}`);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
    },
    onError: () => {
      toast({ title: "Failed to remove meal", variant: "destructive" });
    },
  });

  const replacePlaceholderMealMutation = useMutation({
    mutationFn: async (params: { entryId: number; mealId: number }) => {
      const res = await apiRequest("PATCH", `/api/planner/entries/${params.entryId}/meal`, { mealId: params.mealId });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
    },
    onError: () => {
      toast({ title: "Failed to link recipe", variant: "destructive" });
    },
  });

  const movePlannerEntryMutation = useMutation({
    mutationFn: async (params: { entryId: number; dayId: number; mealType: string; position: number }) => {
      const res = await apiRequest("PATCH", `/api/planner/entries/${params.entryId}`, {
        dayId: params.dayId,
        mealType: params.mealType,
        position: params.position,
      });
      return res.json();
    },
    onMutate: async (params) => {
      await qc.cancelQueries({ queryKey: ["/api/planner/full"] });
      const previousData = qc.getQueryData<FullWeek[]>(["/api/planner/full"]);
      qc.setQueryData<FullWeek[]>(["/api/planner/full"], (old) => {
        if (!old) return old;
        return old.map((week) => ({
          ...week,
          days: week.days.map((day) => {
            if (day.entries.some((e) => e.id === params.entryId) && day.id !== params.dayId) {
              return { ...day, entries: day.entries.filter((e) => e.id !== params.entryId) };
            }
            if (day.id === params.dayId) {
              const filtered = day.entries.filter((e) => e.id !== params.entryId);
              const moved =
                day.entries.find((e) => e.id === params.entryId) ??
                old.flatMap((w) => w.days).flatMap((d) => d.entries).find((e) => e.id === params.entryId);
              if (!moved) return day;
              return {
                ...day,
                entries: [...filtered, { ...moved, dayId: params.dayId, mealType: params.mealType, position: params.position }],
              };
            }
            return day;
          }),
        }));
      });
      return { previousData };
    },
    onError: (_err, _params, context) => {
      if (context?.previousData) qc.setQueryData(["/api/planner/full"], context.previousData);
      toast({ title: "Failed to move meal", description: "Planner restored to previous state", variant: "destructive" });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
    },
  });

  const reorderEntriesMutation = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      const res = await apiRequest("PATCH", "/api/planner/entries/reorder", { orderedIds });
      return res.json();
    },
    onMutate: async (orderedIds) => {
      await qc.cancelQueries({ queryKey: ["/api/planner/full"] });
      const previousData = qc.getQueryData<FullWeek[]>(["/api/planner/full"]);
      qc.setQueryData<FullWeek[]>(["/api/planner/full"], (old) => {
        if (!old) return old;
        const positionMap = new Map(orderedIds.map((id, i) => [id, i]));
        return old.map((week) => ({
          ...week,
          days: week.days.map((day) => ({
            ...day,
            entries: day.entries.map((entry) => {
              const newPos = positionMap.get(entry.id);
              return newPos !== undefined ? { ...entry, position: newPos } : entry;
            }),
          })),
        }));
      });
      return { previousData };
    },
    onError: (_err, _ids, context) => {
      if (context?.previousData) qc.setQueryData(["/api/planner/full"], context.previousData);
      toast({ title: "Failed to reorder meals", description: "Planner restored to previous state", variant: "destructive" });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
    },
  });

  // PX1-W0 (fnd-px-technical-errors-to-household): this toast forwarded err.message,
  // which queryClient.ts throws as `${status}: ${rawBody}` — the household read
  // "500: Internal Server Error". Feedback now belongs to the mutation (declared copy
  // only), and the technical detail goes to the console for us.
  const duplicateEntryMutation = useTrackedMutation({
    mutationFn: async (params: { entryId: number; targetDayId?: number }) => {
      const body: Record<string, number> = {};
      if (params.targetDayId !== undefined) body.targetDayId = params.targetDayId;
      const res = await apiRequest("POST", `/api/planner/entries/${params.entryId}/duplicate`, body);
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.message ?? "Failed to duplicate");
      }
      return res.json();
    },
    feedback: {
      success: (_data, params) => (params.targetDayId ? "Meal copied" : "Duplicated"),
      failure: "Couldn't copy that meal",
      failureDescription: "Your planner hasn't changed — the meal is still only where it was. Please try again.",
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
    },
    onError: (err) => {
      console.error("[planner:duplicate-entry]", err);
    },
  });

  const clearWeekMutation = useMutation({
    mutationFn: async (weekId: number) => {
      const res = await apiRequest("DELETE", `/api/planner/weeks/${weekId}/entries`);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
      onWeekCleared?.();
      toast({ title: "Week cleared" });
    },
    onError: () => {
      toast({ title: "Failed to clear week", variant: "destructive" });
    },
  });

  const clearSlotMutation = useMutation({
    mutationFn: async (params: { dayId: number; mealType: string | undefined; audience: string; isDrink: boolean }) => {
      const body: Record<string, unknown> = { audience: params.audience, isDrink: params.isDrink };
      if (params.mealType !== undefined) body.mealType = params.mealType;
      const res = await apiRequest("DELETE", `/api/planner/days/${params.dayId}/slot`, body);
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.message ?? "Failed to clear slot");
      }
      return res.json() as Promise<{ deleted: number }>;
    },
    onMutate: async (params) => {
      await qc.cancelQueries({ queryKey: ["/api/planner/full"] });
      const previousData = qc.getQueryData<FullWeek[]>(["/api/planner/full"]);
      qc.setQueryData<FullWeek[]>(["/api/planner/full"], (old) => {
        if (!old) return old;
        return old.map((week) => ({
          ...week,
          days: week.days.map((day) => {
            if (day.id !== params.dayId) return day;
            return {
              ...day,
              entries: day.entries.filter((e) => {
                if (e.isDrink !== params.isDrink) return true;
                if (params.mealType !== undefined && e.mealType !== params.mealType) return true;
                if (e.audience !== params.audience) return true;
                return false;
              }),
            };
          }),
        }));
      });
      return { previousData };
    },
    onError: (_err, _params, context) => {
      if (context?.previousData) qc.setQueryData(["/api/planner/full"], context.previousData);
      toast({ title: "Failed to clear slot", description: "Planner restored", variant: "destructive" });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
      onSlotCleared?.();
    },
  });

  const addToBasketMutation = useMutation({
    mutationFn: async (mealSelections: { mealId: number; count: number }[]) => {
      const res = await apiRequest("POST", api.shoppingList.generateFromMeals.path, { mealSelections });
      return res.json();
    },
    onSuccess: (data, mealSelections) => {
      qc.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      qc.invalidateQueries({ queryKey: [api.shoppingList.sources.path] });
      qc.invalidateQueries({ queryKey: [api.shoppingList.prices.path] });
      qc.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      qc.invalidateQueries({ queryKey: ["/api/planner/basket-meal-ids"] });

      // Parse structured response (server returns { items, freezerDeductions })
      const items: { needsReview?: boolean }[] = Array.isArray(data) ? data : (data?.items ?? []);
      const deductions: FreezerDeduction[] = Array.isArray(data) ? [] : (data?.freezerDeductions ?? []);
      const needsReviewCount = items.filter(i => i.needsReview).length;

      if (onShoppingHandoff && items.length > 0) {
        onShoppingHandoff({ itemCount: items.length, needsReviewCount, freezerDeductions: deductions });
      } else {
        const totalServings = mealSelections.reduce((sum, s) => sum + s.count, 0);
        toast({ title: "Added to basket", description: `${totalServings} meal serving${totalServings !== 1 ? "s" : ""}` });
      }
    },
    onError: () => {
      toast({ title: "Failed to add to basket", variant: "destructive" });
    },
  });

  // PX1-W0 (fnd-px-technical-errors-to-household): was printing the raw response body
  // ("500: Internal Server Error") into the freezer toast. Declared copy only now.
  const addToFreezerMutation = useTrackedMutation({
    mutationFn: async (mealId: number) => {
      const today = new Date().toISOString().split("T")[0];
      const res = await apiRequest("POST", "/api/freezer", { mealId, totalPortions: 1, remainingPortions: 1, frozenDate: today });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.message ?? "Failed to add to freezer");
      }
      return res.json();
    },
    feedback: {
      success: "Added to freezer",
      failure: "Couldn't add that to the freezer",
      failureDescription: "Nothing has been added — your freezer is as it was. Please try again.",
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/freezer"] });
    },
    onError: (err) => {
      console.error("[planner:add-to-freezer]", err);
    },
  });

  const createPlannerIntent = async (name: string, mealType: string, dayIdOverride?: number): Promise<void> => {
    // Compute the visually-selected day so saves land on the displayed week even when
    // selectedDayId is null (user never clicked a cell) or stale (from a previous week).
    const activeWeekDays = (fullPlanner.find(w => w.weekNumber === activeWeekNumber)?.days ?? [])
      .slice()
      .sort((a, b) => [1, 2, 3, 4, 5, 6, 0].indexOf(a.dayOfWeek) - [1, 2, 3, 4, 5, 6, 0].indexOf(b.dayOfWeek));
    const selectedDay = selectedDayId
      ? activeWeekDays.find(d => d.id === selectedDayId) ?? activeWeekDays[0] ?? null
      : activeWeekDays[0] ?? null;
    const targetDayId = dayIdOverride ?? selectedDay?.id ?? null;
    if (!targetDayId) {
      toast({ title: "Select a day first", description: "Click a day header in the planner grid to select it.", variant: "destructive" });
      return;
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast({ title: "Enter a meal name", variant: "destructive" });
      return;
    }
    try {
      const mealRes = await apiRequest("POST", "/api/meals", {
        name: trimmedName,
        ingredients: [],
        instructions: [],
        servings: 1,
        audience: "adult",
        isDrink: false,
        mealSourceType: "planner-placeholder",
      });
      if (!mealRes.ok) throw new Error("Failed to create meal");
      const meal = await mealRes.json();

      const day = fullPlanner.flatMap(w => w.days).find(d => d.id === targetDayId);
      const position = day ? getSlotEntries(day.entries, mealType, "adult", false).length : 0;

      const entryRes = await apiRequest("POST", `/api/planner/days/${targetDayId}/items`, {
        mealSlot: mealType,
        mealId: meal.id,
        position,
        audience: "adult",
        isDrink: false,
        drinkType: null,
      });
      if (!entryRes.ok) {
        await apiRequest("DELETE", `/api/meals/${meal.id}`).catch(() => {});
        throw new Error("Failed to add to planner");
      }

      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
      invalidateMealLibrary(qc);
      toast({ title: `"${trimmedName}" added`, description: "Appears as unresolved — link a recipe when ready." });
    } catch (err: unknown) {
      // PX1-W0 (fnd-px-technical-errors-to-household): err.message here is whatever the
      // server returned verbatim (apiRequest throws `${status}: ${body}`). The meal is
      // rolled back above when the planner write fails, so the household can be told
      // plainly that nothing was added. Detail stays in the console, for us.
      console.error("[planner:create-planner-intent]", err);
      toast({ title: "Couldn't add that meal idea", description: "Nothing has been added to your planner. Please try again.", variant: "destructive" });
    }
  };

  const clearEntry = (target: EntryTarget) => {
    upsertEntryMutation.mutate({
      dayId: target.dayId,
      mealType: target.mealType,
      audience: target.audience,
      mealId: null,
      isDrink: target.isDrink,
      drinkType: target.drinkType,
    });
  };

  const handleRepeatTomorrow = (entry: PlannerEntry, currentDayId: number, sortedDays: FullDay[]) => {
    const idx = sortedDays.findIndex((d) => d.id === currentDayId);
    if (idx < 0 || idx >= sortedDays.length - 1) {
      toast({ title: "No next day in this week" });
      return;
    }
    duplicateEntryMutation.mutate({ entryId: entry.id, targetDayId: sortedDays[idx + 1].id });
  };

  const collectMealSelections = (days: FullDay[], mealTypeFilter?: string): { mealId: number; count: number }[] => {
    const counts = new Map<number, number>();
    for (const day of days) {
      for (const entry of day.entries) {
        if (mealTypeFilter && entry.mealType !== mealTypeFilter) continue;
        counts.set(entry.mealId, (counts.get(entry.mealId) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries()).map(([mealId, count]) => ({ mealId, count }));
  };

  const addDayToBasket = (day: FullDay) => {
    const selections = collectMealSelections([day]);
    if (selections.length === 0) {
      toast({ title: "No meals to add for this day" });
      return;
    }
    addToBasketMutation.mutate(selections);
  };

  const addSlotToBasket = (mealType: string, sortedDays: FullDay[]) => {
    const selections = collectMealSelections(sortedDays, mealType);
    if (selections.length === 0) {
      toast({ title: "No meals in this slot" });
      return;
    }
    addToBasketMutation.mutate(selections);
  };

  const addAllToBasket = (sortedDays: FullDay[]) => {
    const selections = collectMealSelections(sortedDays);
    if (selections.length === 0) {
      toast({ title: "No meals planned this week" });
      return;
    }
    addToBasketMutation.mutate(selections);
  };

  return {
    upsertEntryMutation,
    addEntryMutation,
    deleteEntryMutation,
    replacePlaceholderMealMutation,
    movePlannerEntryMutation,
    reorderEntriesMutation,
    duplicateEntryMutation,
    clearWeekMutation,
    clearSlotMutation,
    addToBasketMutation,
    addToFreezerMutation,
    createPlannerIntent,
    clearEntry,
    handleRepeatTomorrow,
    collectMealSelections,
    addDayToBasket,
    addSlotToBasket,
    addAllToBasket,
  };
}
