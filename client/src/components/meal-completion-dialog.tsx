import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  CalendarDays,
  ShoppingBasket,
  Loader2,
  AlertTriangle,
  Wine,
  Coffee,
  Sun,
  Moon,
  Cookie,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBasket } from "@/hooks/use-basket";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";

// ---------------------------------------------------------------------------
// Planner constants (mirrors meals-page.tsx – kept local to avoid circular dep)
// ---------------------------------------------------------------------------

const PLANNER_DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];
const PLANNER_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const PLANNER_MEAL_SLOTS = [
  { key: "breakfast", label: "Breakfast", icon: Coffee },
  { key: "lunch",     label: "Lunch",     icon: Sun   },
  { key: "dinner",    label: "Dinner",    icon: Moon  },
  { key: "snacks",    label: "Snack",     icon: Cookie },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlannerDay  { id: number; dayOfWeek: number }
interface PlannerWeek { id: number; weekNumber: number; weekName: string; days: PlannerDay[] }

interface PlannerSettings {
  enableBabyMeals:  boolean;
  enableChildMeals: boolean;
  enableDrinks:     boolean;
}

export interface CompletionMeal {
  id:       number;
  name:     string;
  isDrink:  boolean;
  audience: string;
}

interface MealCompletionDialogProps {
  open:         boolean;
  onClose:      () => void;
  meal:         CompletionMeal;
}

type Step = "choice" | "planner";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MealCompletionDialog({ open, onClose, meal }: MealCompletionDialogProps) {
  const [step, setStep]               = useState<Step>("choice");
  const [selectedWeeks, setSelectedWeeks] = useState<Set<number>>(new Set());
  const [selectedDays,  setSelectedDays]  = useState<Set<number>>(new Set());
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [basketPending, setBasketPending] = useState(false);

  const { toast }       = useToast();
  const queryClient     = useQueryClient();
  const { addToBasket } = useBasket();

  // Reset internal state whenever the dialog closes
  useEffect(() => {
    if (!open) {
      setStep("choice");
      setSelectedWeeks(new Set());
      setSelectedDays(new Set());
      setSelectedSlots(new Set());
      setBasketPending(false);
    }
  }, [open]);

  // ------------------------------------------------------------------
  // Planner data (lazy – only fetched when user opens planner step)
  // ------------------------------------------------------------------

  const plannerEnabled = open && step === "planner";

  const { data: plannerWeeks = [] } = useQuery<PlannerWeek[]>({
    queryKey: ["/api/planner/full"],
    enabled:  plannerEnabled,
    select:   (raw: any[]) =>
      raw.map((w) => ({
        id:          w.id,
        weekNumber:  w.weekNumber,
        weekName:    w.weekName,
        days: (w.days ?? []).map((d: any) => ({ id: d.id, dayOfWeek: d.dayOfWeek })),
      })),
  });

  const { data: plannerSettings } = useQuery<PlannerSettings>({
    queryKey: ["/api/user/planner-settings"],
    enabled:  plannerEnabled,
  });

  const enableDrinks    = plannerSettings?.enableDrinks    ?? false;
  const enableBabyMeals = plannerSettings?.enableBabyMeals ?? false;
  const enableChildMeals= plannerSettings?.enableChildMeals ?? false;

  // ------------------------------------------------------------------
  // Planner slot options
  // ------------------------------------------------------------------

  const availableSlots = meal.isDrink
    ? [{ key: "snacks", label: "Drinks", icon: Wine }]
    : PLANNER_MEAL_SLOTS;

  // ------------------------------------------------------------------
  // Planner assignments derivation
  // ------------------------------------------------------------------

  const assignments = useMemo(() => {
    if (selectedWeeks.size === 0 || selectedDays.size === 0 || selectedSlots.size === 0) return [];
    const result: { dayId: number; mealType: string; audience: string; isDrink: boolean; weekName: string; dayName: string; slotLabel: string }[] = [];
    const resolvedAudience = meal.audience === "baby" ? "baby" : meal.audience === "child" ? "child" : "adult";
    for (const week of plannerWeeks) {
      if (!selectedWeeks.has(week.id)) continue;
      for (const day of week.days) {
        if (!selectedDays.has(day.dayOfWeek)) continue;
        for (const slot of availableSlots) {
          if (!selectedSlots.has(slot.key)) continue;
          result.push({
            dayId:     day.id,
            mealType:  slot.key,
            audience:  resolvedAudience,
            isDrink:   meal.isDrink,
            weekName:  week.weekName,
            dayName:   PLANNER_DAY_NAMES[day.dayOfWeek],
            slotLabel: slot.label,
          });
        }
      }
    }
    return result;
  }, [selectedWeeks, selectedDays, selectedSlots, plannerWeeks, availableSlots, meal]);

  // ------------------------------------------------------------------
  // Planner mutation
  // ------------------------------------------------------------------

  const plannerMutation = useMutation({
    mutationFn: async () => {
      for (const a of assignments) {
        await apiRequest("POST", `/api/planner/days/${a.dayId}/items`, {
          mealSlot:  a.mealType,
          audience:  a.audience,
          mealId:    meal.id,
          isDrink:   a.isDrink,
          position:  0,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planner/full"] });
      toast({
        title:       "Added to planner",
        description: `"${meal.name}" added to ${assignments.length} slot${assignments.length !== 1 ? "s" : ""}.`,
      });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to add to planner", variant: "destructive" });
    },
  });

  // ------------------------------------------------------------------
  // Basket handler
  // ------------------------------------------------------------------

  const handleAddToBasket = async () => {
    setBasketPending(true);
    try {
      addToBasket({ mealId: meal.id, quantity: 1 });
      await apiRequest("POST", api.shoppingList.generateFromMeals.path, {
        mealSelections: [{ mealId: meal.id, count: 1 }],
      });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.sources.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.prices.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      toast({
        title:       "Added to basket",
        description: `${meal.name} added to your basket and shopping list.`,
      });
      onClose();
    } catch {
      toast({ title: "Failed to add to basket", variant: "destructive" });
    } finally {
      setBasketPending(false);
    }
  };

  // ------------------------------------------------------------------
  // Render helpers
  // ------------------------------------------------------------------

  const audienceLabel =
    meal.audience === "baby"  ? "Baby"  :
    meal.audience === "child" ? "Child" : "";

  // ------------------------------------------------------------------
  // JSX
  // ------------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col" data-testid="dialog-meal-completion">

        {/* ── Step: choice ── */}
        {step === "choice" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Saved to Cookbook
              </DialogTitle>
              <DialogDescription>
                <span className="font-medium text-foreground">{meal.name}</span>
                {audienceLabel && (
                  <Badge variant="secondary" className="ml-1.5 text-[10px]">{audienceLabel}</Badge>
                )}
                {meal.isDrink && (
                  <Badge variant="secondary" className="ml-1.5 text-[10px]">
                    <Wine className="h-3 w-3 mr-0.5" />Drink
                  </Badge>
                )}
                {" "}has been saved. What would you like to do next?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 pt-1">
              <Button
                className="w-full justify-start gap-3"
                onClick={() => setStep("planner")}
                data-testid="button-completion-planner"
              >
                <CalendarDays className="h-4 w-4 shrink-0" />
                Add to Planner
              </Button>

              <Button
                variant="secondary"
                className="w-full justify-start gap-3"
                onClick={handleAddToBasket}
                disabled={basketPending}
                data-testid="button-completion-basket"
              >
                {basketPending ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <ShoppingBasket className="h-4 w-4 shrink-0" />
                )}
                Add to Basket &amp; Shopping List
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={onClose}
                data-testid="button-completion-done"
              >
                Done
              </Button>
            </div>
          </>
        )}

        {/* ── Step: planner ── */}
        {step === "planner" && (
          <>
            <DialogHeader>
              <DialogTitle>Add to Planner</DialogTitle>
              <DialogDescription>
                Assign <span className="font-medium text-foreground">{meal.name}</span>
                {" "}to weeks, days{!meal.isDrink && ", and meal slots"}.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 py-1">

              {/* Drinks/baby/child warning banners */}
              {meal.isDrink && !enableDrinks && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border border-border">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Drinks are currently disabled in your planner settings.
                  </p>
                </div>
              )}
              {meal.audience === "baby" && !enableBabyMeals && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border border-border">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Baby meal rows are currently disabled in your planner settings.
                  </p>
                </div>
              )}
              {meal.audience === "child" && !enableChildMeals && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border border-border">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Child meal rows are currently disabled in your planner settings.
                  </p>
                </div>
              )}

              {/* Weeks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Weeks</label>
                  <Button
                    variant="ghost" size="sm" className="text-xs h-6"
                    onClick={() => setSelectedWeeks(
                      selectedWeeks.size === plannerWeeks.length
                        ? new Set()
                        : new Set(plannerWeeks.map((w) => w.id))
                    )}
                    data-testid="button-completion-toggle-all-weeks"
                  >
                    {selectedWeeks.size === plannerWeeks.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {plannerWeeks
                    .slice()
                    .sort((a, b) => a.weekNumber - b.weekNumber)
                    .map((week) => (
                      <label
                        key={week.id}
                        className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover:bg-accent/50 transition-colors"
                        data-testid={`label-completion-week-${week.weekNumber}`}
                      >
                        <Checkbox
                          checked={selectedWeeks.has(week.id)}
                          onCheckedChange={(checked) =>
                            setSelectedWeeks((prev) => {
                              const next = new Set(prev);
                              checked ? next.add(week.id) : next.delete(week.id);
                              return next;
                            })
                          }
                        />
                        <span className="text-xs">{week.weekName}</span>
                      </label>
                    ))}
                </div>
              </div>

              {/* Days */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Days</label>
                  <Button
                    variant="ghost" size="sm" className="text-xs h-6"
                    onClick={() => setSelectedDays(
                      selectedDays.size === 7
                        ? new Set()
                        : new Set(PLANNER_DAY_ORDER)
                    )}
                    data-testid="button-completion-toggle-all-days"
                  >
                    {selectedDays.size === 7 ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {PLANNER_DAY_ORDER.map((dayIdx) => (
                    <label
                      key={dayIdx}
                      className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover:bg-accent/50 transition-colors"
                      data-testid={`label-completion-day-${dayIdx}`}
                    >
                      <Checkbox
                        checked={selectedDays.has(dayIdx)}
                        onCheckedChange={(checked) =>
                          setSelectedDays((prev) => {
                            const next = new Set(prev);
                            checked ? next.add(dayIdx) : next.delete(dayIdx);
                            return next;
                          })
                        }
                      />
                      <span className="text-xs">{PLANNER_DAY_NAMES[dayIdx].slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Meal slots */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {meal.isDrink ? "Slot" : "Meal Slots"}
                </label>
                <div className={`grid gap-2 ${meal.isDrink ? "grid-cols-1" : "grid-cols-2"}`}>
                  {availableSlots.map((slot) => {
                    const SlotIcon = slot.icon;
                    return (
                      <label
                        key={slot.key}
                        className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover:bg-accent/50 transition-colors"
                        data-testid={`label-completion-slot-${slot.key}`}
                      >
                        <Checkbox
                          checked={selectedSlots.has(slot.key)}
                          onCheckedChange={(checked) =>
                            setSelectedSlots((prev) => {
                              const next = new Set(prev);
                              checked ? next.add(slot.key) : next.delete(slot.key);
                              return next;
                            })
                          }
                        />
                        <SlotIcon className="h-3.5 w-3.5" />
                        <span className="text-xs">{slot.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Assignment summary */}
              {assignments.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    {assignments.length} slot{assignments.length !== 1 ? "s" : ""} will be assigned
                  </label>
                  <div className="rounded-md border border-border max-h-32 overflow-y-auto divide-y divide-border">
                    {assignments.map((a, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-1.5 text-xs">
                        <span className="text-muted-foreground">{a.weekName}</span>
                        <span>{a.dayName} – {a.slotLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("choice")} data-testid="button-completion-back">
                Back
              </Button>
              <Button
                disabled={assignments.length === 0 || plannerMutation.isPending}
                onClick={() => plannerMutation.mutate()}
                data-testid="button-completion-confirm-planner"
              >
                {plannerMutation.isPending ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Assigning…</>
                ) : (
                  `Assign to ${assignments.length} slot${assignments.length !== 1 ? "s" : ""}`
                )}
              </Button>
            </DialogFooter>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
}
