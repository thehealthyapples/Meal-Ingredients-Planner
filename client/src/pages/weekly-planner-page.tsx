import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, X, Plus, Coffee, Sun, Moon, Cookie, Search, Loader2, ChefHat, ShoppingCart, ShoppingBasket, Copy, Calendar, UtensilsCrossed, Snowflake, Settings, Baby, PersonStanding, Wine, Sparkles, LayoutGrid } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { TemplatesPanel } from "@/components/templates-panel";
import { useUser } from "@/hooks/use-user";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import type { PlannerWeek, PlannerDay, PlannerEntry, Meal, FreezerMeal, Nutrition, MealCategory } from "@shared/schema";

interface FullDay extends PlannerDay {
  entries: PlannerEntry[];
}

interface FullWeek extends PlannerWeek {
  days: FullDay[];
}

interface EntryTarget {
  dayId: number;
  mealType: string;
  audience: string;
  isDrink: boolean;
  drinkType?: string | null;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONDAY_FIRST_ORDER = [1, 2, 3, 4, 5, 6, 0];
const MEAL_TYPES = [
  { key: "breakfast", label: "Breakfast", icon: Coffee, color: "text-amber-500" },
  { key: "lunch", label: "Lunch", icon: Sun, color: "text-orange-500" },
  { key: "dinner", label: "Dinner", icon: Moon, color: "text-indigo-500" },
  { key: "snacks", label: "Snack", icon: Cookie, color: "text-green-500" },
];

function findEntry(entries: PlannerEntry[], mealType: string, audience: string, isDrink: boolean = false): PlannerEntry | undefined {
  return entries.find(e => e.mealType === mealType && e.audience === audience && e.isDrink === isDrink);
}

export default function WeeklyPlannerPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeWeek, setActiveWeek] = useState("1");
  const [renameWeekId, setRenameWeekId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [mealPickerOpen, setMealPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<EntryTarget | null>(null);
  const [mealSearch, setMealSearch] = useState("");
  const [mealFilter, setMealFilter] = useState<"all" | "recipes" | "ready">("all");
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkMeal, setBulkMeal] = useState<Meal | null>(null);
  const [bulkWeeks, setBulkWeeks] = useState<Set<number>>(new Set());
  const [bulkDays, setBulkDays] = useState<Set<number>>(new Set());
  const [bulkSlots, setBulkSlots] = useState<Set<string>>(new Set());
  const [bulkMealSearch, setBulkMealSearch] = useState("");
  const [bulkMealFilter, setBulkMealFilter] = useState<"all" | "recipes" | "ready">("all");
  const [bulkStep, setBulkStep] = useState<1 | 2>(1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const { user } = useUser();

  const { data: plannerSettings } = useQuery<{
    showCalories: boolean;
    enableBabyMeals: boolean;
    enableChildMeals: boolean;
    enableDrinks: boolean;
  }>({
    queryKey: ["/api/user/planner-settings"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Record<string, boolean>) => {
      const res = await apiRequest("PATCH", "/api/user/planner-settings", updates);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/user/planner-settings"] });
    },
    onError: () => {
      toast({ title: "Failed to update settings", variant: "destructive" });
    },
  });

  const toggleSetting = (key: string, value: boolean) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  const loadTemplateMutation = useMutation({
    mutationFn: async () => {
      const defaultRes = await fetch("/api/plan-templates/default");
      if (!defaultRes.ok) throw new Error("No default template found");
      const { id } = await defaultRes.json();
      const applyRes = await apiRequest("POST", `/api/plan-templates/${id}/apply?mode=replace`);
      if (!applyRes.ok) throw new Error("Failed to apply template");
      return applyRes.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
      toast({
        title: "Plan loaded!",
        description: `${data.createdCount + data.updatedCount} meals added to your planner.`,
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to load plan",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const { data: fullPlanner = [], isLoading } = useQuery<FullWeek[]>({
    queryKey: ["/api/planner/full"],
  });

  const { data: meals = [] } = useQuery<Meal[]>({
    queryKey: ["/api/meals"],
  });

  const { data: freezerMeals = [] } = useQuery<FreezerMeal[]>({
    queryKey: ["/api/freezer"],
  });

  const { data: categories = [] } = useQuery<MealCategory[]>({
    queryKey: ['/api/categories'],
  });

  const allMealIds = useMemo(() => {
    const ids = new Set<number>();
    fullPlanner.forEach(w => w.days.forEach(d => {
      d.entries.forEach(e => ids.add(e.mealId));
    }));
    return Array.from(ids);
  }, [fullPlanner]);

  const { data: nutritionData = [] } = useQuery<Nutrition[]>({
    queryKey: ["/api/nutrition/bulk", allMealIds],
    queryFn: async () => {
      if (allMealIds.length === 0) return [];
      const res = await apiRequest("POST", "/api/nutrition/bulk", { mealIds: allMealIds });
      return res.json();
    },
    enabled: allMealIds.length > 0 && (plannerSettings?.showCalories ?? true),
  });

  const nutritionMap = useMemo(() => {
    const map = new Map<number, number>();
    nutritionData.forEach(n => {
      const cal = parseInt(n.calories || "0", 10);
      if (!isNaN(cal) && cal > 0) map.set(n.mealId, cal);
    });
    return map;
  }, [nutritionData]);

  const renameMutation = useMutation({
    mutationFn: async ({ weekId, weekName }: { weekId: number; weekName: string }) => {
      const res = await apiRequest("PATCH", `/api/planner/weeks/${weekId}`, { weekName });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
      setRenameWeekId(null);
      setRenameValue("");
    },
    onError: () => {
      toast({ title: "Failed to rename week", variant: "destructive" });
    },
  });

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

  const addToBasketMutation = useMutation({
    mutationFn: async (mealSelections: { mealId: number; count: number }[]) => {
      const res = await apiRequest("POST", api.shoppingList.generateFromMeals.path, { mealSelections });
      return res.json();
    },
    onSuccess: (_data, mealSelections) => {
      qc.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      qc.invalidateQueries({ queryKey: [api.shoppingList.sources.path] });
      qc.invalidateQueries({ queryKey: [api.shoppingList.prices.path] });
      qc.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      const totalServings = mealSelections.reduce((sum, s) => sum + s.count, 0);
      toast({ title: "Added to basket", description: `${totalServings} meal serving${totalServings !== 1 ? 's' : ''} added to shopping list.` });
    },
    onError: (err) => {
      console.error("Add to basket error:", err);
      toast({ title: "Failed to add to basket", variant: "destructive" });
    },
  });

  const getMeal = (id: number | null): Meal | undefined => {
    if (!id) return undefined;
    return meals.find((m) => m.id === id);
  };

  const categoryIdForSlot = useMemo(() => {
    const map: Record<string, number | undefined> = {};
    for (const cat of categories) {
      const n = cat.name.toLowerCase();
      if (n === "breakfast") map["breakfast"] = cat.id;
      else if (n === "lunch") map["lunch"] = cat.id;
      else if (n === "dinner") map["dinner"] = cat.id;
      else if (n === "snack") map["snacks"] = cat.id;
    }
    return map;
  }, [categories]);

  const filteredMeals = useMemo(() => {
    let result = meals;
    if (pickerTarget) {
      if (pickerTarget.isDrink) {
        result = result.filter((m) => m.isDrink);
      } else {
        result = result.filter((m) => !m.isDrink);
        if (pickerTarget.audience === "baby") {
          result = result.filter((m) => m.audience === "baby");
        } else if (pickerTarget.audience === "child") {
          result = result.filter((m) => m.audience === "child");
        } else {
          result = result.filter((m) => m.audience !== "baby" && m.audience !== "child");
        }
      }
    }
    if (mealFilter === "recipes") {
      result = result.filter((m) => !m.isReadyMeal);
    } else if (mealFilter === "ready") {
      result = result.filter((m) => m.isReadyMeal);
    }
    if (mealSearch.trim()) {
      const q = mealSearch.toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(q));
    }
    if (!mealSearch.trim() && pickerTarget && !pickerTarget.isDrink) {
      const slotCatId = categoryIdForSlot[pickerTarget.mealType];
      if (slotCatId) {
        const matching = result.filter((m) => m.categoryId === slotCatId);
        const rest = result.filter((m) => m.categoryId !== slotCatId);
        result = [...matching, ...rest];
      }
    }
    return result.slice(0, 50);
  }, [meals, mealFilter, mealSearch, pickerTarget, categoryIdForSlot]);

  const bulkFilteredMeals = useMemo(() => {
    let result = meals;
    if (bulkMealFilter === "recipes") result = result.filter((m) => !m.isReadyMeal);
    else if (bulkMealFilter === "ready") result = result.filter((m) => m.isReadyMeal);
    if (bulkMealSearch.trim()) {
      const q = bulkMealSearch.toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(q));
    }
    return result.slice(0, 50);
  }, [meals, bulkMealFilter, bulkMealSearch]);

  const bulkAssignments = useMemo(() => {
    if (!bulkMeal || bulkWeeks.size === 0 || bulkDays.size === 0 || bulkSlots.size === 0) return [];
    const result: { weekName: string; dayName: string; slotLabel: string; dayId: number; mealType: string }[] = [];
    for (const week of fullPlanner) {
      if (!bulkWeeks.has(week.id)) continue;
      const days = week.days || [];
      for (const day of days) {
        if (!bulkDays.has(day.dayOfWeek)) continue;
        for (const slot of MEAL_TYPES) {
          if (!bulkSlots.has(slot.key)) continue;
          result.push({
            weekName: week.weekName,
            dayName: DAY_NAMES[day.dayOfWeek],
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
      toast({ title: "Meals assigned", description: `${bulkMeal!.name} added to ${bulkAssignments.length} slot${bulkAssignments.length > 1 ? 's' : ''}.` });
      resetBulkAssign();
    },
    onError: () => {
      toast({ title: "Failed to assign meals", variant: "destructive" });
    },
  });

  const resetBulkAssign = () => {
    setBulkAssignOpen(false);
    setBulkMeal(null);
    setBulkWeeks(new Set());
    setBulkDays(new Set());
    setBulkSlots(new Set());
    setBulkMealSearch("");
    setBulkStep(1);
  };

  const openPicker = (target: EntryTarget) => {
    setPickerTarget(target);
    setMealSearch("");
    setMealPickerOpen(true);
  };

  const selectMeal = (mealId: number) => {
    if (!pickerTarget) return;
    upsertEntryMutation.mutate({
      dayId: pickerTarget.dayId,
      mealType: pickerTarget.mealType,
      audience: pickerTarget.audience,
      mealId,
      isDrink: pickerTarget.isDrink,
      drinkType: pickerTarget.drinkType,
    });
    setMealPickerOpen(false);
    setPickerTarget(null);
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

  const activeWeekData = fullPlanner.find((w) => w.weekNumber === Number(activeWeek));
  const sortedDays = activeWeekData?.days?.slice().sort((a, b) => {
    const aIdx = MONDAY_FIRST_ORDER.indexOf(a.dayOfWeek);
    const bIdx = MONDAY_FIRST_ORDER.indexOf(b.dayOfWeek);
    return aIdx - bIdx;
  }) || [];

  const weekStats = useMemo(() => {
    if (!sortedDays.length) return { filled: 0, total: sortedDays.length * MEAL_TYPES.length };
    let filled = 0;
    for (const day of sortedDays) {
      for (const slot of MEAL_TYPES) {
        if (findEntry(day.entries, slot.key, "adult")) filled++;
      }
    }
    return { filled, total: sortedDays.length * MEAL_TYPES.length };
  }, [sortedDays]);

  const collectMealSelections = (days: FullDay[], mealTypeFilter?: string): { mealId: number; count: number }[] => {
    const counts = new Map<number, number>();
    for (const day of days) {
      for (const entry of day.entries) {
        if (mealTypeFilter && entry.mealType !== mealTypeFilter) continue;
        counts.set(entry.mealId, (counts.get(entry.mealId) || 0) + 1);
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

  const addSlotToBasket = (mealType: string) => {
    const selections = collectMealSelections(sortedDays, mealType);
    if (selections.length === 0) {
      toast({ title: "No meals in this slot" });
      return;
    }
    addToBasketMutation.mutate(selections);
  };

  const addAllToBasket = () => {
    const selections = collectMealSelections(sortedDays);
    if (selections.length === 0) {
      toast({ title: "No meals planned this week" });
      return;
    }
    addToBasketMutation.mutate(selections);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 max-w-screen-2xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight" data-testid="text-weekly-planner-title">
            Weekly Planner
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plan 6 weeks of meals with breakfast, lunch, dinner, and snacks
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" data-testid="badge-week-progress">
            {weekStats.filled} / {weekStats.total} meals planned
          </Badge>
          <Button
            size="sm"
            onClick={() => setTemplatesOpen(true)}
            data-testid="button-open-templates"
          >
            <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
            Templates
          </Button>
          <Button size="sm" variant="outline" onClick={() => setSettingsOpen(true)} data-testid="button-planner-settings">
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            Options
          </Button>
          <Button size="sm" variant="outline" onClick={() => setBulkAssignOpen(true)} data-testid="button-bulk-assign">
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Bulk Assign
          </Button>
          <Button size="sm" onClick={addAllToBasket} disabled={addToBasketMutation.isPending} data-testid="button-add-all-basket">
            <ShoppingBasket className="h-3.5 w-3.5 mr-1.5" />
            {addToBasketMutation.isPending ? "Adding..." : "Add All to Basket"}
          </Button>
        </div>
      </div>

      <Tabs value={activeWeek} onValueChange={setActiveWeek} className="w-full">
        <div className="flex items-center gap-2 mb-4 overflow-x-auto">
          <TabsList className="flex-shrink-0" data-testid="tabs-weeks">
            {fullPlanner
              .slice()
              .sort((a, b) => a.weekNumber - b.weekNumber)
              .map((week) => (
                <TabsTrigger
                  key={week.id}
                  value={String(week.weekNumber)}
                  className="gap-1.5"
                  data-testid={`tab-week-${week.weekNumber}`}
                >
                  {week.weekName}
                </TabsTrigger>
              ))}
          </TabsList>
        </div>

        {fullPlanner.map((week) => (
          <TabsContent key={week.id} value={String(week.weekNumber)} className="mt-0">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {renameWeekId === week.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="w-48"
                    placeholder="Week name"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && renameValue.trim()) {
                        renameMutation.mutate({ weekId: week.id, weekName: renameValue.trim() });
                      }
                      if (e.key === "Escape") {
                        setRenameWeekId(null);
                      }
                    }}
                    data-testid="input-rename-week"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (renameValue.trim()) {
                        renameMutation.mutate({ weekId: week.id, weekName: renameValue.trim() });
                      }
                    }}
                    disabled={!renameValue.trim() || renameMutation.isPending}
                    data-testid="button-save-rename"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setRenameWeekId(null)}
                    data-testid="button-cancel-rename"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRenameWeekId(week.id);
                    setRenameValue(week.weekName);
                  }}
                  className="gap-1.5 text-muted-foreground"
                  data-testid="button-rename-week"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Rename
                </Button>
              )}

              {MEAL_TYPES.map((slot) => {
                const SlotIcon = slot.icon;
                return (
                  <Button
                    key={slot.key}
                    variant="outline"
                    size="sm"
                    onClick={() => addSlotToBasket(slot.key)}
                    disabled={addToBasketMutation.isPending}
                    data-testid={`button-add-slot-${slot.key}-basket`}
                  >
                    <SlotIcon className={`h-3.5 w-3.5 mr-1 ${slot.color}`} />
                    Add all {slot.label}
                  </Button>
                );
              })}
            </div>

            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="grid grid-cols-7 gap-3" style={{ minWidth: "980px" }}>
                {sortedDays.map((day) => (
                  <DayColumn
                    key={day.id}
                    day={day}
                    getMeal={getMeal}
                    onAddMeal={openPicker}
                    onClearEntry={clearEntry}
                    onAddDayToBasket={addDayToBasket}
                    isUpdating={upsertEntryMutation.isPending}
                    isAddingToBasket={addToBasketMutation.isPending}
                    freezerMeals={freezerMeals}
                    enableBabyMeals={plannerSettings?.enableBabyMeals ?? false}
                    enableChildMeals={plannerSettings?.enableChildMeals ?? false}
                    enableDrinks={plannerSettings?.enableDrinks ?? false}
                    showCalories={plannerSettings?.showCalories ?? true}
                    nutritionMap={nutritionMap}
                  />
                ))}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={mealPickerOpen} onOpenChange={setMealPickerOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {pickerTarget?.isDrink ? "Choose a Drink" :
               pickerTarget?.audience === "baby" ? "Choose a Baby Meal" :
               pickerTarget?.audience === "child" ? "Choose a Child Meal" :
               `Choose a ${MEAL_TYPES.find(s => s.key === pickerTarget?.mealType)?.label || "Meal"}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search meals..."
                value={mealSearch}
                onChange={(e) => setMealSearch(e.target.value)}
                className="pl-9"
                data-testid="input-meal-search"
              />
            </div>
            <div className="flex gap-1">
              {(["all", "recipes", "ready"] as const).map((f) => (
                <Button
                  key={f}
                  variant={mealFilter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMealFilter(f)}
                  data-testid={`button-filter-${f}`}
                >
                  {f === "all" ? "All" : f === "recipes" ? "Recipes" : "Ready Meals"}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto mt-2 space-y-1 min-h-0">
            {filteredMeals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No meals found</p>
            ) : (
              filteredMeals.map((meal) => (
                <button
                  key={meal.id}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover-elevate text-left"
                  onClick={() => selectMeal(meal.id)}
                  data-testid={`button-select-meal-${meal.id}`}
                >
                  {meal.isReadyMeal ? (
                    <div className="h-10 w-10 rounded-md bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <UtensilsCrossed className="h-5 w-5 text-green-500/40" />
                    </div>
                  ) : meal.imageUrl ? (
                    <img
                      src={meal.imageUrl}
                      alt={meal.name}
                      className="h-10 w-10 rounded-md object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                      <ChefHat className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{meal.name}</p>
                    <div className="flex items-center gap-1.5">
                      {meal.isReadyMeal && (
                        <Badge variant="outline" className="text-xs">
                          Ready Meal
                        </Badge>
                      )}
                      {meal.audience === "baby" && (
                        <Badge variant="outline" className="text-xs border-pink-400/60 text-pink-500">
                          <Baby className="h-3 w-3 mr-0.5" /> Baby
                        </Badge>
                      )}
                      {meal.audience === "child" && (
                        <Badge variant="outline" className="text-xs border-sky-400/60 text-sky-500">
                          <PersonStanding className="h-3 w-3 mr-0.5" /> Child
                        </Badge>
                      )}
                      {meal.isDrink && (
                        <Badge variant="outline" className="text-xs border-purple-400/60 text-purple-500">
                          <Wine className="h-3 w-3 mr-0.5" /> Drink
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkAssignOpen} onOpenChange={(v) => { if (!v) resetBulkAssign(); }}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Bulk Assign Meal
            </DialogTitle>
            <p className="text-xs text-muted-foreground">Pick a meal and assign it to multiple weeks, days, and meal slots at once.</p>
          </DialogHeader>

          {bulkStep === 1 ? (
            <>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search meals..." value={bulkMealSearch} onChange={(e) => setBulkMealSearch(e.target.value)} className="pl-9" data-testid="input-bulk-meal-search" />
                </div>
                <div className="flex gap-1">
                  {(["all", "recipes", "ready"] as const).map((f) => (
                    <Button key={f} variant={bulkMealFilter === f ? "default" : "outline"} size="sm" onClick={() => setBulkMealFilter(f)} data-testid={`button-bulk-filter-${f}`}>
                      {f === "all" ? "All" : f === "recipes" ? "Recipes" : "Ready Meals"}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto mt-2 space-y-1 min-h-0">
                {bulkFilteredMeals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No meals found</p>
                ) : (
                  bulkFilteredMeals.map((meal) => (
                    <button key={meal.id} className="w-full flex items-center gap-3 p-2 rounded-md hover-elevate text-left" onClick={() => { setBulkMeal(meal); setBulkStep(2); }} data-testid={`button-bulk-select-meal-${meal.id}`}>
                      {meal.isReadyMeal ? (
                        <div className="h-10 w-10 rounded-md bg-green-500/10 flex items-center justify-center flex-shrink-0">
                          <UtensilsCrossed className="h-5 w-5 text-green-500/40" />
                        </div>
                      ) : meal.imageUrl ? (
                        <img src={meal.imageUrl} alt={meal.name} className="h-10 w-10 rounded-md object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                          <ChefHat className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{meal.name}</p>
                        {meal.isReadyMeal && (
                          <Badge variant="outline" className="text-xs">Ready Meal</Badge>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                {bulkMeal?.isReadyMeal ? (
                  <div className="h-10 w-10 rounded-md bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <UtensilsCrossed className="h-5 w-5 text-green-500/40" />
                  </div>
                ) : bulkMeal?.imageUrl ? (
                  <img src={bulkMeal.imageUrl} alt={bulkMeal.name} className="h-10 w-10 rounded-md object-cover flex-shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    <ChefHat className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{bulkMeal?.name}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setBulkStep(1)} data-testid="button-bulk-change-meal">Change</Button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Weeks</label>
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => {
                    if (bulkWeeks.size === fullPlanner.length) setBulkWeeks(new Set());
                    else setBulkWeeks(new Set(fullPlanner.map(w => w.id)));
                  }} data-testid="button-bulk-toggle-all-weeks">
                    {bulkWeeks.size === fullPlanner.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {fullPlanner.slice().sort((a, b) => a.weekNumber - b.weekNumber).map((week) => (
                    <label key={week.id} className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover-elevate" data-testid={`label-bulk-week-${week.weekNumber}`}>
                      <Checkbox checked={bulkWeeks.has(week.id)} onCheckedChange={(checked) => {
                        setBulkWeeks(prev => { const next = new Set(prev); checked ? next.add(week.id) : next.delete(week.id); return next; });
                      }} />
                      <span className="text-xs">{week.weekName}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Days</label>
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => {
                    if (bulkDays.size === 7) setBulkDays(new Set());
                    else setBulkDays(new Set(MONDAY_FIRST_ORDER));
                  }} data-testid="button-bulk-toggle-all-days">
                    {bulkDays.size === 7 ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {MONDAY_FIRST_ORDER.map((dayIdx) => (
                    <label key={dayIdx} className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover-elevate" data-testid={`label-bulk-day-${dayIdx}`}>
                      <Checkbox checked={bulkDays.has(dayIdx)} onCheckedChange={(checked) => {
                        setBulkDays(prev => { const next = new Set(prev); checked ? next.add(dayIdx) : next.delete(dayIdx); return next; });
                      }} />
                      <span className="text-xs">{DAY_SHORT[dayIdx]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Meal Slots</label>
                <div className="grid grid-cols-2 gap-2">
                  {MEAL_TYPES.map((slot) => {
                    const SlotIcon = slot.icon;
                    return (
                      <label key={slot.key} className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover-elevate" data-testid={`label-bulk-slot-${slot.key}`}>
                        <Checkbox checked={bulkSlots.has(slot.key)} onCheckedChange={(checked) => {
                          setBulkSlots(prev => { const next = new Set(prev); checked ? next.add(slot.key) : next.delete(slot.key); return next; });
                        }} />
                        <SlotIcon className={`h-3.5 w-3.5 ${slot.color}`} />
                        <span className="text-xs">{slot.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {bulkAssignments.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    {bulkAssignments.length} slot{bulkAssignments.length !== 1 ? 's' : ''} will be assigned
                  </label>
                  <div className="rounded-md border border-border max-h-32 overflow-y-auto divide-y divide-border">
                    {bulkAssignments.map((a, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-1.5 text-xs">
                        <span className="text-muted-foreground">{a.weekName}</span>
                        <span>{a.dayName} - {a.slotLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {bulkStep === 2 && (
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={resetBulkAssign}>Cancel</Button>
              <Button disabled={bulkAssignments.length === 0 || bulkAssignMutation.isPending} onClick={() => bulkAssignMutation.mutate()} data-testid="button-bulk-assign-confirm">
                {bulkAssignMutation.isPending ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Assigning...</> : `Assign to ${bulkAssignments.length} slot${bulkAssignments.length !== 1 ? 's' : ''}`}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-planner-settings">
          <DialogHeader>
            <DialogTitle>Planner Options</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-sm font-medium" data-testid="label-show-calories">Show Calories</span>
                <p className="text-xs text-muted-foreground">Display calorie information on meal cards</p>
              </div>
              <Switch
                checked={plannerSettings?.showCalories ?? true}
                onCheckedChange={(v) => toggleSetting("showCalories", v)}
                disabled={updateSettingsMutation.isPending}
                data-testid="switch-show-calories"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-sm font-medium" data-testid="label-enable-baby-meals">Baby Meals</span>
                <p className="text-xs text-muted-foreground">Enable baby meal slots in weekly planner</p>
              </div>
              <Switch
                checked={plannerSettings?.enableBabyMeals ?? false}
                onCheckedChange={(v) => toggleSetting("enableBabyMeals", v)}
                disabled={updateSettingsMutation.isPending}
                data-testid="switch-enable-baby-meals"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-sm font-medium" data-testid="label-enable-child-meals">Child Meals</span>
                <p className="text-xs text-muted-foreground">Enable child meal slots in weekly planner</p>
              </div>
              <Switch
                checked={plannerSettings?.enableChildMeals ?? false}
                onCheckedChange={(v) => toggleSetting("enableChildMeals", v)}
                disabled={updateSettingsMutation.isPending}
                data-testid="switch-enable-child-meals"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-sm font-medium" data-testid="label-enable-drinks">Drinks</span>
                <p className="text-xs text-muted-foreground">Enable drink slots in weekly planner</p>
              </div>
              <Switch
                checked={plannerSettings?.enableDrinks ?? false}
                onCheckedChange={(v) => toggleSetting("enableDrinks", v)}
                disabled={updateSettingsMutation.isPending}
                data-testid="switch-enable-drinks"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TemplatesPanel open={templatesOpen} onClose={() => setTemplatesOpen(false)} user={user} />
    </div>
  );
}

function EntrySlotRow({
  dayId,
  dayOfWeek,
  entry,
  meal,
  mealType,
  audience,
  isDrink,
  label,
  audienceIcon,
  isIndented,
  freezerMeals,
  onAddMeal,
  onClearEntry,
  isUpdating,
  calories,
}: {
  dayId: number;
  dayOfWeek: number;
  entry: PlannerEntry | undefined;
  meal: Meal | undefined;
  mealType: string;
  audience: string;
  isDrink: boolean;
  label: string;
  audienceIcon?: typeof Baby;
  isIndented?: boolean;
  freezerMeals: FreezerMeal[];
  onAddMeal: (target: EntryTarget) => void;
  onClearEntry: (target: EntryTarget) => void;
  isUpdating: boolean;
  calories?: number;
}) {
  const AudienceIcon = audienceIcon;
  const slotId = `${mealType}-${audience}${isDrink ? "-drink" : ""}`;
  const target: EntryTarget = { dayId, mealType, audience, isDrink };

  return (
    <div className={isIndented ? "ml-3 border-l-2 border-muted pl-2" : ""}>
      {AudienceIcon && (
        <div className="flex items-center gap-1 mb-0.5">
          <AudienceIcon className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
        </div>
      )}
      {meal ? (
        <div className="group relative">
          <div className="flex items-start gap-1.5 p-1.5 rounded-md bg-muted/50">
            {meal.isReadyMeal ? (
              <div className={`h-6 w-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                meal.audience === 'baby' ? 'bg-pink-500/10' :
                meal.audience === 'child' ? 'bg-sky-500/10' :
                'bg-green-500/10'
              }`}>
                {meal.audience === 'baby' ? (
                  <Baby className="h-3 w-3 text-pink-500/40" />
                ) : meal.audience === 'child' ? (
                  <PersonStanding className="h-3 w-3 text-sky-500/40" />
                ) : (
                  <UtensilsCrossed className="h-3 w-3 text-green-500/40" />
                )}
              </div>
            ) : meal.imageUrl ? (
              <img
                src={meal.imageUrl}
                alt={meal.name}
                className="h-6 w-6 rounded object-cover flex-shrink-0 mt-0.5"
              />
            ) : (
              <div className={`h-6 w-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                meal.audience === 'baby' ? 'bg-pink-500/10' :
                meal.audience === 'child' ? 'bg-sky-500/10' :
                'bg-muted'
              }`}>
                {meal.audience === 'baby' ? (
                  <Baby className="h-3 w-3 text-pink-400/60" />
                ) : meal.audience === 'child' ? (
                  <PersonStanding className="h-3 w-3 text-sky-400/60" />
                ) : (
                  <ChefHat className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="text-xs leading-tight break-words" data-testid={`text-meal-name-${slotId}-${dayOfWeek}`}>{meal.name}</span>
              {calories && calories > 0 && (
                <span className="text-[10px] text-orange-500 ml-1" data-testid={`text-calories-${slotId}-${dayOfWeek}`}>
                  {calories} kcal
                </span>
              )}
            </div>
            {freezerMeals.some(f => f.mealId === meal.id && f.remainingPortions > 0) && (
              <Snowflake className="h-3 w-3 text-blue-400 flex-shrink-0" data-testid={`icon-frozen-${slotId}-${dayOfWeek}`} />
            )}
          </div>
          <button
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center invisible group-hover:visible"
            onClick={() => onClearEntry(target)}
            data-testid={`button-clear-${slotId}-${dayOfWeek}`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          className="w-full p-1.5 rounded-md border border-dashed border-muted-foreground/30 hover-elevate flex items-center justify-center gap-1 text-xs text-muted-foreground"
          onClick={() => onAddMeal(target)}
          disabled={isUpdating}
          data-testid={`button-add-${slotId}-${dayOfWeek}`}
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      )}
    </div>
  );
}

function DayColumn({
  day,
  getMeal,
  onAddMeal,
  onClearEntry,
  onAddDayToBasket,
  isUpdating,
  isAddingToBasket,
  freezerMeals = [],
  enableBabyMeals = false,
  enableChildMeals = false,
  enableDrinks = false,
  showCalories = true,
  nutritionMap = new Map(),
}: {
  day: FullDay;
  getMeal: (id: number | null) => Meal | undefined;
  onAddMeal: (target: EntryTarget) => void;
  onClearEntry: (target: EntryTarget) => void;
  onAddDayToBasket: (day: FullDay) => void;
  isUpdating: boolean;
  isAddingToBasket: boolean;
  freezerMeals?: FreezerMeal[];
  enableBabyMeals?: boolean;
  enableChildMeals?: boolean;
  enableDrinks?: boolean;
  showCalories?: boolean;
  nutritionMap?: Map<number, number>;
}) {
  const dayCalories = useMemo(() => {
    if (!showCalories) return 0;
    let total = 0;
    for (const entry of day.entries) {
      if (entry.isDrink && !enableDrinks) continue;
      if (entry.audience === "baby" && !enableBabyMeals) continue;
      if (entry.audience === "child" && !enableChildMeals) continue;
      total += nutritionMap.get(entry.mealId) || 0;
    }
    return total;
  }, [day.entries, showCalories, nutritionMap, enableDrinks, enableBabyMeals, enableChildMeals]);

  return (
    <Card className="overflow-visible" data-testid={`card-day-${day.dayOfWeek}`}>
      <div className="px-3 py-2 border-b flex items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{DAY_NAMES[day.dayOfWeek]}</h3>
          {showCalories && dayCalories > 0 && (
            <span className="text-xs text-orange-500 font-medium" data-testid={`text-day-calories-${day.dayOfWeek}`}>
              {dayCalories} kcal
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onAddDayToBasket(day)}
          disabled={isAddingToBasket}
          data-testid={`button-add-day-basket-${day.dayOfWeek}`}
          title="Add this day's meals to basket"
        >
          <ShoppingBasket className="h-3.5 w-3.5" />
        </Button>
      </div>
      <CardContent className="p-2 space-y-2">
        {MEAL_TYPES.map((slot) => {
          const adultEntry = findEntry(day.entries, slot.key, "adult");
          const babyEntry = findEntry(day.entries, slot.key, "baby");
          const childEntry = findEntry(day.entries, slot.key, "child");
          const SlotIcon = slot.icon;

          return (
            <div key={slot.key} className="space-y-1">
              <div className="flex items-center gap-1">
                <SlotIcon className={`h-3 w-3 ${slot.color}`} />
                <span className="text-xs font-medium text-muted-foreground">{slot.label}</span>
              </div>
              <EntrySlotRow
                dayId={day.id}
                dayOfWeek={day.dayOfWeek}
                entry={adultEntry}
                meal={getMeal(adultEntry?.mealId ?? null)}
                mealType={slot.key}
                audience="adult"
                isDrink={false}
                label={slot.label}
                freezerMeals={freezerMeals}
                onAddMeal={onAddMeal}
                onClearEntry={onClearEntry}
                isUpdating={isUpdating}
                calories={showCalories && adultEntry ? nutritionMap.get(adultEntry.mealId) : undefined}
              />
              {enableBabyMeals && (
                <EntrySlotRow
                  dayId={day.id}
                  dayOfWeek={day.dayOfWeek}
                  entry={babyEntry}
                  meal={getMeal(babyEntry?.mealId ?? null)}
                  mealType={slot.key}
                  audience="baby"
                  isDrink={false}
                  label={`Baby ${slot.label}`}
                  audienceIcon={Baby}
                  isIndented
                  freezerMeals={freezerMeals}
                  onAddMeal={onAddMeal}
                  onClearEntry={onClearEntry}
                  isUpdating={isUpdating}
                  calories={showCalories && babyEntry ? nutritionMap.get(babyEntry.mealId) : undefined}
                />
              )}
              {enableChildMeals && (
                <EntrySlotRow
                  dayId={day.id}
                  dayOfWeek={day.dayOfWeek}
                  entry={childEntry}
                  meal={getMeal(childEntry?.mealId ?? null)}
                  mealType={slot.key}
                  audience="child"
                  isDrink={false}
                  label={`Child ${slot.label}`}
                  audienceIcon={PersonStanding}
                  isIndented
                  freezerMeals={freezerMeals}
                  onAddMeal={onAddMeal}
                  onClearEntry={onClearEntry}
                  isUpdating={isUpdating}
                  calories={showCalories && childEntry ? nutritionMap.get(childEntry.mealId) : undefined}
                />
              )}
            </div>
          );
        })}
        {enableDrinks && (() => {
          const drinkEntry = findEntry(day.entries, "snacks", "adult", true);
          return (
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Wine className="h-3 w-3 text-purple-400" />
                <span className="text-xs font-medium text-muted-foreground">Drinks</span>
              </div>
              <EntrySlotRow
                dayId={day.id}
                dayOfWeek={day.dayOfWeek}
                entry={drinkEntry}
                meal={getMeal(drinkEntry?.mealId ?? null)}
                mealType="snacks"
                audience="adult"
                isDrink={true}
                label="Drinks"
                freezerMeals={freezerMeals}
                onAddMeal={onAddMeal}
                onClearEntry={onClearEntry}
                isUpdating={isUpdating}
                calories={showCalories && drinkEntry ? nutritionMap.get(drinkEntry.mealId) : undefined}
              />
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}
