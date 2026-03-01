import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Coffee, Sun, Moon, Cookie, Wine,
  ChevronUp, ChevronDown, X, Plus, Search, Loader2, ChefHat, UtensilsCrossed,
} from "lucide-react";
import type { PlannerEntry, Meal } from "@shared/schema";

interface FullDay {
  id: number;
  dayOfWeek: number;
  weekId: number;
  entries: PlannerEntry[];
}

interface DayViewDrawerProps {
  open: boolean;
  onClose: () => void;
  day: FullDay | null;
  dayLabel: string;
  getMeal: (id: number | null) => Meal | undefined;
  onPlannerInvalidate: () => void;
}

interface SlotConfig {
  key: string;
  label: string;
  icon: typeof Coffee;
  color: string;
  isDrink: boolean;
  mealSlot: "breakfast" | "lunch" | "dinner" | "snacks";
}

const SLOT_CONFIGS: SlotConfig[] = [
  { key: "breakfast", label: "Breakfast", icon: Coffee, color: "text-amber-500", isDrink: false, mealSlot: "breakfast" },
  { key: "lunch", label: "Lunch", icon: Sun, color: "text-orange-500", isDrink: false, mealSlot: "lunch" },
  { key: "dinner", label: "Dinner", icon: Moon, color: "text-indigo-500", isDrink: false, mealSlot: "dinner" },
  { key: "snacks", label: "Snacks", icon: Cookie, color: "text-green-500", isDrink: false, mealSlot: "snacks" },
  { key: "drinks", label: "Drinks", icon: Wine, color: "text-purple-400", isDrink: true, mealSlot: "snacks" },
];

function getSlotEntries(entries: PlannerEntry[], mealType: string, audience: string, isDrink: boolean): PlannerEntry[] {
  return entries
    .filter(e => e.mealType === mealType && e.audience === audience && e.isDrink === isDrink)
    .sort((a, b) => a.position !== b.position ? a.position - b.position : a.id - b.id);
}

function getDrinkEntries(entries: PlannerEntry[]): PlannerEntry[] {
  return entries
    .filter(e => e.isDrink === true)
    .sort((a, b) => a.position !== b.position ? a.position - b.position : a.id - b.id);
}

interface SearchState {
  query: string;
  results: Meal[];
  loading: boolean;
  open: boolean;
}

function SlotSection({
  slot,
  dayId,
  entries,
  getMeal,
  onPlannerInvalidate,
  allMeals,
}: {
  slot: SlotConfig;
  dayId: number;
  entries: PlannerEntry[];
  getMeal: (id: number | null) => Meal | undefined;
  onPlannerInvalidate: () => void;
  allMeals: Meal[];
}) {
  const { toast } = useToast();
  const [search, setSearch] = useState<SearchState>({ query: "", results: [], loading: false, open: false });
  const [swapping, setSwapping] = useState(false);

  const filteredResults = search.query.trim()
    ? allMeals.filter(m => {
        if (slot.isDrink) return m.isDrink && m.name.toLowerCase().includes(search.query.toLowerCase());
        return !m.isDrink && m.name.toLowerCase().includes(search.query.toLowerCase());
      }).slice(0, 8)
    : [];

  const addMutation = useMutation({
    mutationFn: async (mealId: number) => {
      const res = await apiRequest("POST", `/api/planner/days/${dayId}/items`, {
        mealSlot: slot.mealSlot,
        mealId,
        position: entries.length,
        isDrink: slot.isDrink,
        drinkType: slot.isDrink ? "soft" : null,
      });
      return res.json();
    },
    onSuccess: () => {
      setSearch({ query: "", results: [], loading: false, open: false });
      onPlannerInvalidate();
    },
    onError: () => {
      toast({ title: "Failed to add meal", variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (entryId: number) => {
      await apiRequest("DELETE", `/api/planner/entries/${entryId}`);
    },
    onSuccess: () => {
      onPlannerInvalidate();
    },
    onError: () => {
      toast({ title: "Failed to remove meal", variant: "destructive" });
    },
  });

  const swapPositions = useCallback(async (entryA: PlannerEntry, entryB: PlannerEntry) => {
    setSwapping(true);
    try {
      const posA = entryA.position;
      const posB = entryB.position;
      await apiRequest("PATCH", `/api/planner/entries/${entryA.id}`, { position: -1 });
      await apiRequest("PATCH", `/api/planner/entries/${entryB.id}`, { position: posA });
      await apiRequest("PATCH", `/api/planner/entries/${entryA.id}`, { position: posB });
      onPlannerInvalidate();
    } catch {
      toast({ title: "Failed to reorder meals", variant: "destructive" });
    } finally {
      setSwapping(false);
    }
  }, [onPlannerInvalidate, toast]);

  const SlotIcon = slot.icon;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <SlotIcon className={`h-4 w-4 ${slot.color}`} />
        <h3 className="text-sm font-semibold">{slot.label}</h3>
        <span className="text-xs text-muted-foreground ml-auto">{entries.length} meal{entries.length !== 1 ? "s" : ""}</span>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground px-2 py-1">No meals added yet</p>
      ) : (
        <div className="space-y-1">
          {entries.map((entry, idx) => {
            const meal = getMeal(entry.mealId);
            return (
              <div
                key={entry.id}
                className="flex items-center gap-2 p-2 rounded-md bg-muted/50 group"
                data-testid={`card-day-entry-${entry.id}`}
              >
                {meal?.imageUrl ? (
                  <img src={meal.imageUrl} alt={meal.name} className="h-6 w-6 rounded object-cover flex-shrink-0" />
                ) : meal?.isReadyMeal ? (
                  <div className="h-6 w-6 rounded bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <UtensilsCrossed className="h-3 w-3 text-green-500/40" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <ChefHat className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
                <span className="flex-1 text-xs truncate" title={meal?.name}>{meal?.name ?? "Unknown meal"}</span>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => idx > 0 && swapPositions(entries[idx - 1], entry)}
                    disabled={idx === 0 || swapping}
                    className="h-5 w-5 rounded hover:bg-muted flex items-center justify-center disabled:opacity-30"
                    data-testid={`button-move-up-${entry.id}`}
                    title="Move up"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => idx < entries.length - 1 && swapPositions(entry, entries[idx + 1])}
                    disabled={idx === entries.length - 1 || swapping}
                    className="h-5 w-5 rounded hover:bg-muted flex items-center justify-center disabled:opacity-30"
                    data-testid={`button-move-down-${entry.id}`}
                    title="Move down"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => removeMutation.mutate(entry.id)}
                    disabled={removeMutation.isPending}
                    className="h-5 w-5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center"
                    data-testid={`button-remove-entry-${entry.id}`}
                    title="Remove"
                  >
                    {removeMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-1">
        {!search.open ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground w-full justify-start"
            onClick={() => setSearch(s => ({ ...s, open: true }))}
            data-testid={`button-add-slot-${slot.key}`}
          >
            <Plus className="h-3 w-3" />
            {slot.isDrink ? "Add drink" : "Add recipe"}
          </Button>
        ) : (
          <div className="space-y-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                autoFocus
                placeholder={slot.isDrink ? "Search drinks…" : "Search recipes…"}
                value={search.query}
                onChange={e => setSearch(s => ({ ...s, query: e.target.value }))}
                className="pl-7 h-7 text-xs"
                data-testid={`input-search-slot-${slot.key}`}
                onKeyDown={e => e.key === "Escape" && setSearch({ query: "", results: [], loading: false, open: false })}
              />
            </div>
            {filteredResults.length > 0 && (
              <div className="border rounded-md bg-background shadow-sm max-h-40 overflow-y-auto">
                {filteredResults.map(meal => (
                  <button
                    key={meal.id}
                    onClick={() => addMutation.mutate(meal.id)}
                    disabled={addMutation.isPending}
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted flex items-center gap-2"
                    data-testid={`option-meal-${meal.id}`}
                  >
                    {meal.imageUrl ? (
                      <img src={meal.imageUrl} alt={meal.name} className="h-4 w-4 rounded object-cover flex-shrink-0" />
                    ) : (
                      <ChefHat className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="truncate">{meal.name}</span>
                  </button>
                ))}
              </div>
            )}
            {search.query.trim() && filteredResults.length === 0 && (
              <p className="text-xs text-muted-foreground px-2">No {slot.isDrink ? "drinks" : "recipes"} found</p>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground"
              onClick={() => setSearch({ query: "", results: [], loading: false, open: false })}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function DayViewDrawer({
  open,
  onClose,
  day,
  dayLabel,
  getMeal,
  onPlannerInvalidate,
  allMeals = [],
}: DayViewDrawerProps & { allMeals?: Meal[] }) {
  const entries = day?.entries ?? [];

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="text-base" data-testid="text-day-view-label">{dayLabel}</SheetTitle>
        </SheetHeader>

        <div className="py-4 space-y-6">
          {!day ? (
            <p className="text-sm text-muted-foreground">No day selected</p>
          ) : (
            SLOT_CONFIGS.map(slot => {
              const slotEntries = slot.isDrink
                ? getDrinkEntries(entries)
                : getSlotEntries(entries, slot.mealSlot, "adult", false);

              return (
                <div key={slot.key} className="space-y-2">
                  <SlotSection
                    slot={slot}
                    dayId={day.id}
                    entries={slotEntries}
                    getMeal={getMeal}
                    onPlannerInvalidate={onPlannerInvalidate}
                    allMeals={allMeals}
                  />
                  <div className="border-b" />
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
