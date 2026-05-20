import { useState, useMemo } from "react";
import { usePlannerMealSearch, type PlannerMealFilterMode } from "@/hooks/use-planner-meal-search";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Loader2, ChefHat, UtensilsCrossed, Coffee, Sun, Moon, Cookie } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Meal } from "@shared/schema";
import type { FullWeek } from "@/lib/planner-types";

const BULK_MEAL_TYPES = [
  { key: "breakfast", label: "Breakfast", icon: Coffee, color: "text-amber-500" },
  { key: "lunch",     label: "Lunch",     icon: Sun,    color: "text-orange-500" },
  { key: "dinner",    label: "Dinner",    icon: Moon,   color: "text-indigo-500" },
  { key: "snacks",    label: "Snack",     icon: Cookie, color: "text-green-500" },
];

const BULK_DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const BULK_DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const BULK_MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0];

interface PlannerBulkAssignPanelProps {
  fullPlanner: FullWeek[];
  meals: Meal[];
  plannerMealIdSet: Set<number>;
  onClose: () => void;
}

export function PlannerBulkAssignPanel({
  fullPlanner,
  meals,
  plannerMealIdSet,
  onClose,
}: PlannerBulkAssignPanelProps) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [bulkMeal, setBulkMeal] = useState<Meal | null>(null);
  const [bulkWeeks, setBulkWeeks] = useState<Set<number>>(new Set());
  const [bulkDays, setBulkDays] = useState<Set<number>>(new Set());
  const [bulkSlots, setBulkSlots] = useState<Set<string>>(new Set());
  const [bulkMealSearch, setBulkMealSearch] = useState("");
  const [bulkMealFilter, setBulkMealFilter] = useState<"all" | "cookbook" | "planner" | "ready">("all");
  const [bulkStep, setBulkStep] = useState<1 | 2>(1);

  // Shared hook: provides scoreMealSearch-ranked filteredMeals. No web search for bulk assign.
  const { filteredMeals } = usePlannerMealSearch({
    meals,
    query: bulkMealSearch,
    filterMode: bulkMealFilter as PlannerMealFilterMode,
    plannerMealIdSet,
    excludePlaceholders: true,
    enableWebSearch: false,
  });

  const bulkAssignments = useMemo(() => {
    if (!bulkMeal || bulkWeeks.size === 0 || bulkDays.size === 0 || bulkSlots.size === 0) return [];
    const result: { weekName: string; dayName: string; slotLabel: string; dayId: number; mealType: string }[] = [];
    for (const week of fullPlanner) {
      if (!bulkWeeks.has(week.id)) continue;
      for (const day of week.days || []) {
        if (!bulkDays.has(day.dayOfWeek)) continue;
        for (const slot of BULK_MEAL_TYPES) {
          if (!bulkSlots.has(slot.key)) continue;
          result.push({
            weekName: week.weekName,
            dayName: BULK_DAY_NAMES[day.dayOfWeek],
            slotLabel: slot.label,
            dayId: day.id,
            mealType: slot.key,
          });
        }
      }
    }
    return result;
  }, [bulkMeal, bulkWeeks, bulkDays, bulkSlots, fullPlanner]);

  const bulkAssignMutation = useMutation({
    mutationFn: async () => {
      for (const a of bulkAssignments) {
        await apiRequest("PUT", `/api/planner/days/${a.dayId}/entries`, {
          mealType: a.mealType,
          audience: "adult",
          mealId: bulkMeal!.id,
          isDrink: false,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
      toast({
        title: "Meals assigned",
        description: `${bulkMeal!.name} added to ${bulkAssignments.length} slot${bulkAssignments.length > 1 ? "s" : ""}.`,
      });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to assign meals", variant: "destructive" });
    },
  });

  return (
    <div className="flex flex-col gap-4" data-testid="panel-bulk-assign">
      <p className="text-xs text-muted-foreground">
        Pick a meal and assign it to multiple weeks, days, and meal slots at once.
      </p>

      {bulkStep === 1 ? (
        <>
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search meals..."
                value={bulkMealSearch}
                onChange={e => setBulkMealSearch(e.target.value)}
                className="pl-9 h-8 text-sm"
                data-testid="input-bulk-meal-search"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {(["all", "cookbook", "planner", "ready"] as const).map(f => (
                <Button
                  key={f}
                  variant={bulkMealFilter === f ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => setBulkMealFilter(f)}
                  data-testid={`button-bulk-filter-${f}`}
                >
                  {f === "all" ? "All" : f === "cookbook" ? "Cookbook" : f === "planner" ? "From Planner" : "Ready Meals"}
                </Button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto space-y-0.5 max-h-[48vh]">
            {filteredMeals.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">No meals found</p>
            ) : (
              filteredMeals.map(meal => (
                <button
                  key={meal.id}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover-elevate text-left"
                  onClick={() => { setBulkMeal(meal); setBulkStep(2); }}
                  data-testid={`button-bulk-select-meal-${meal.id}`}
                >
                  {meal.isReadyMeal ? (
                    <div className="h-9 w-9 rounded-md bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <UtensilsCrossed className="h-4 w-4 text-green-500/40" />
                    </div>
                  ) : meal.imageUrl ? (
                    <img src={meal.imageUrl} alt={meal.name} className="h-9 w-9 rounded-md object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                      <ChefHat className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{meal.name}</p>
                    {meal.isReadyMeal && (
                      <Badge variant="outline" className="text-[10px] px-1">Ready Meal</Badge>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
            {bulkMeal?.imageUrl ? (
              <img src={bulkMeal.imageUrl} alt={bulkMeal.name} className="h-9 w-9 rounded-md object-cover flex-shrink-0" />
            ) : (
              <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                <ChefHat className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <p className="text-sm font-medium truncate flex-1">{bulkMeal?.name}</p>
            <Button
              variant="ghost" size="sm" className="text-xs h-7 shrink-0"
              onClick={() => setBulkStep(1)}
              data-testid="button-bulk-change-meal"
            >
              Change
            </Button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Weeks</label>
              <Button
                variant="ghost" size="sm" className="text-xs h-6"
                onClick={() => bulkWeeks.size === fullPlanner.length
                  ? setBulkWeeks(new Set())
                  : setBulkWeeks(new Set(fullPlanner.map(w => w.id)))
                }
                data-testid="button-bulk-toggle-all-weeks"
              >
                {bulkWeeks.size === fullPlanner.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {fullPlanner.slice().sort((a, b) => a.weekNumber - b.weekNumber).map(week => (
                <label
                  key={week.id}
                  className="flex items-center gap-1.5 p-1.5 rounded-md border border-border cursor-pointer hover-elevate"
                  data-testid={`label-bulk-week-${week.weekNumber}`}
                >
                  <Checkbox
                    checked={bulkWeeks.has(week.id)}
                    onCheckedChange={checked => setBulkWeeks(prev => {
                      const next = new Set(prev);
                      checked ? next.add(week.id) : next.delete(week.id);
                      return next;
                    })}
                  />
                  <span className="text-xs truncate">{week.weekName}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Days</label>
              <Button
                variant="ghost" size="sm" className="text-xs h-6"
                onClick={() => bulkDays.size === 7
                  ? setBulkDays(new Set())
                  : setBulkDays(new Set(BULK_MONDAY_FIRST))
                }
                data-testid="button-bulk-toggle-all-days"
              >
                {bulkDays.size === 7 ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {BULK_MONDAY_FIRST.map(dayIdx => (
                <label
                  key={dayIdx}
                  className="flex items-center gap-1.5 p-1.5 rounded-md border border-border cursor-pointer hover-elevate"
                  data-testid={`label-bulk-day-${dayIdx}`}
                >
                  <Checkbox
                    checked={bulkDays.has(dayIdx)}
                    onCheckedChange={checked => setBulkDays(prev => {
                      const next = new Set(prev);
                      checked ? next.add(dayIdx) : next.delete(dayIdx);
                      return next;
                    })}
                  />
                  <span className="text-xs">{BULK_DAY_SHORT[dayIdx]}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Meal Slots</label>
            <div className="grid grid-cols-2 gap-1.5">
              {BULK_MEAL_TYPES.map(slot => {
                const SlotIcon = slot.icon;
                return (
                  <label
                    key={slot.key}
                    className="flex items-center gap-1.5 p-1.5 rounded-md border border-border cursor-pointer hover-elevate"
                    data-testid={`label-bulk-slot-${slot.key}`}
                  >
                    <Checkbox
                      checked={bulkSlots.has(slot.key)}
                      onCheckedChange={checked => setBulkSlots(prev => {
                        const next = new Set(prev);
                        checked ? next.add(slot.key) : next.delete(slot.key);
                        return next;
                      })}
                    />
                    <SlotIcon className={`h-3.5 w-3.5 ${slot.color}`} />
                    <span className="text-xs">{slot.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {bulkAssignments.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                {bulkAssignments.length} slot{bulkAssignments.length !== 1 ? "s" : ""} will be assigned
              </p>
              <div className="rounded-md border border-border max-h-28 overflow-y-auto divide-y divide-border">
                {bulkAssignments.map((a, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-1.5 text-xs">
                    <span className="text-muted-foreground">{a.weekName}</span>
                    <span>{a.dayName} – {a.slotLabel}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1"
              disabled={bulkAssignments.length === 0 || bulkAssignMutation.isPending}
              onClick={() => bulkAssignMutation.mutate()}
              data-testid="button-bulk-assign-confirm"
            >
              {bulkAssignMutation.isPending
                ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Assigning…</>
                : `Assign to ${bulkAssignments.length} slot${bulkAssignments.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
