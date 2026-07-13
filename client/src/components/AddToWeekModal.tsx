import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Coffee, Sun, Moon, Cookie, Loader2, CalendarDays, ShoppingCart,
  Check, ChevronLeft,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { invalidateMealLibrary } from "@/hooks/use-meals";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AddToWeekProduct {
  product_name: string;
  brand?: string | null;
  barcode?: string | null;
  image_url?: string | null;
}

interface PlannerWeekFull {
  id: number;
  weekNumber: number;
  weekName: string;
  days: { id: number; dayOfWeek: number }[];
}

type Pathway = "daily" | "provisioning" | null;

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const DAILY_SLOTS = [
  { key: "breakfast", label: "Breakfast", icon: Coffee },
  { key: "lunch",     label: "Lunch",     icon: Sun },
  { key: "dinner",    label: "Dinner",    icon: Moon },
  { key: "snacks",    label: "Snack",     icon: Cookie },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  product: AddToWeekProduct;
}

export function AddToWeekModal({ open, onClose, product }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [pathway, setPathway] = useState<Pathway>(null);
  const [selectedWeeks, setSelectedWeeks] = useState<Set<number>>(new Set());
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const { data: plannerWeeks = [] } = useQuery<PlannerWeekFull[]>({
    queryKey: ["/api/planner/full"],
    enabled: open,
    select: (data) => data.map(w => ({
      id: w.id,
      weekNumber: (w as any).weekNumber,
      weekName: (w as any).weekName,
      days: (w as any).days ?? [],
    })),
  });

  // When the provisioning pathway is chosen, pre-select whichever week is currently
  // active in the planner (stored in localStorage). Without this, the modal always
  // defaults to week 1, causing a mismatch when the planner is showing a different week.
  useEffect(() => {
    if (pathway !== "provisioning" || plannerWeeks.length === 0) return;
    try {
      const raw = localStorage.getItem("planner:active-week");
      const weekNum = raw ? Number(JSON.parse(raw)) : 1;
      const target = plannerWeeks.find(w => w.weekNumber === weekNum) ?? plannerWeeks[0];
      if (target) setSelectedWeeks(new Set([target.id]));
    } catch {
      if (plannerWeeks[0]) setSelectedWeeks(new Set([plannerWeeks[0].id]));
    }
  }, [pathway, plannerWeeks]);

  function reset() {
    setPathway(null);
    setSelectedWeeks(new Set());
    setSelectedDays(new Set());
    setSelectedSlots(new Set());
    setSaving(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  // Derive assignment list for the daily pathway confirmation summary
  const dailyAssignmentCount = useMemo(() => {
    if (pathway !== "daily") return 0;
    let count = 0;
    for (const week of plannerWeeks) {
      if (!selectedWeeks.has(week.id)) continue;
      for (const day of week.days) {
        if (!selectedDays.has(day.dayOfWeek)) continue;
        count += selectedSlots.size;
      }
    }
    return count;
  }, [pathway, selectedWeeks, selectedDays, selectedSlots, plannerWeeks]);

  // First week with at least one day selected (for provisioning display)
  const provisioningWeekName = useMemo(() => {
    if (selectedWeeks.size === 0) return plannerWeeks[0]?.weekName ?? "Week 1";
    const firstSelected = plannerWeeks.find(w => selectedWeeks.has(w.id));
    return firstSelected?.weekName ?? plannerWeeks[0]?.weekName ?? "Week 1";
  }, [selectedWeeks, plannerWeeks]);

  async function handleConfirm() {
    setSaving(true);
    try {
      // Step 1: create owned cookbook entry for the product
      const mealRes = await apiRequest("POST", "/api/meals", {
        name: product.brand ? `${product.brand} – ${product.product_name}` : product.product_name,
        ingredients: [],
        instructions: [],
        servings: 1,
        kind: "meal",
        isReadyMeal: true,
        mealSourceType: "openfoodfacts",
        brand: product.brand ?? undefined,
        barcode: product.barcode ?? undefined,
      });
      const meal = await mealRes.json();
      const mealId: number = meal.id;
      invalidateMealLibrary(qc);

      if (pathway === "daily") {
        // Step 2a: add to planner day slots
        const assignments: { dayId: number; mealType: string }[] = [];
        for (const week of plannerWeeks) {
          if (!selectedWeeks.has(week.id)) continue;
          for (const day of week.days) {
            if (!selectedDays.has(day.dayOfWeek)) continue;
            for (const slot of DAILY_SLOTS) {
              if (!selectedSlots.has(slot.key)) continue;
              assignments.push({ dayId: day.id, mealType: slot.key });
            }
          }
        }
        for (const a of assignments) {
          await apiRequest("POST", `/api/planner/days/${a.dayId}/items`, {
            mealSlot: a.mealType,
            audience: "adult",
            mealId,
            isDrink: false,
            position: 0,
          });
        }
        qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
        toast({
          title: "Added to planner",
          description: `"${product.product_name}" saved to cookbook and added to ${assignments.length} slot${assignments.length !== 1 ? "s" : ""}.`,
        });
      } else {
        // Step 2b: add to weekly provisioning
        const targetWeeks = selectedWeeks.size > 0
          ? plannerWeeks.filter(w => selectedWeeks.has(w.id))
          : plannerWeeks.slice(0, 1);
        for (const week of targetWeeks) {
          await apiRequest("POST", `/api/planner/weeks/${week.id}/provisioning`, {
            name: product.product_name,
            mealId,
          });
          qc.invalidateQueries({ queryKey: ["/api/planner/weeks", week.id, "provisioning"] });
        }
        toast({
          title: "Added to weekly provisioning",
          description: `"${product.product_name}" saved to cookbook and added to ${provisioningWeekName}.`,
        });
      }

      handleClose();
    } catch {
      toast({ title: "Failed to add to week", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const canConfirmDaily = pathway === "daily" && selectedWeeks.size > 0 && selectedDays.size > 0 && selectedSlots.size > 0;
  const canConfirmProvisioning = pathway === "provisioning";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col" data-testid="dialog-add-to-week">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-4.5 w-4.5" />
            Add to Week
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{product.product_name}</span>
            {product.brand && <span className="text-muted-foreground/70"> · {product.brand}</span>}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">

          {/* ── Step 1: choose pathway ── */}
          {pathway === null && (
            <div className="space-y-3" data-testid="section-pathway-choice">
              <p className="text-xs text-muted-foreground/70 uppercase tracking-wide font-medium">Where should it go?</p>

              <button
                className="w-full flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                onClick={() => setPathway("daily")}
                data-testid="button-pathway-daily"
              >
                <CalendarDays className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Daily meal slot</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Place in Breakfast, Lunch, Dinner, or Snack on specific days
                  </p>
                </div>
              </button>

              <button
                className="w-full flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                onClick={() => setPathway("provisioning")}
                data-testid="button-pathway-provisioning"
              >
                <ShoppingCart className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Weekly provisioning</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add to the household's weekly list — not tied to a specific day
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {["Snacks", "Condiments", "Drinks", "Household extras"].map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </button>

              <p className="text-[11px] text-muted-foreground/60 leading-relaxed px-1">
                Saving will create a cookbook entry for this item first, then assign it to your chosen destination.
              </p>
            </div>
          )}

          {/* ── Daily pathway: week + day + slot selection ── */}
          {pathway === "daily" && (
            <div className="space-y-4" data-testid="section-daily-selection">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Weeks</p>
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => {
                    if (selectedWeeks.size === plannerWeeks.length) setSelectedWeeks(new Set());
                    else setSelectedWeeks(new Set(plannerWeeks.map(w => w.id)));
                  }}>
                    {selectedWeeks.size === plannerWeeks.length ? "Deselect all" : "Select all"}
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {plannerWeeks.slice().sort((a, b) => a.weekNumber - b.weekNumber).map(week => (
                    <label key={week.id} className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover:bg-muted/40" data-testid={`label-week-${week.weekNumber}`}>
                      <Checkbox checked={selectedWeeks.has(week.id)} onCheckedChange={(checked) => {
                        setSelectedWeeks(prev => { const n = new Set(prev); checked ? n.add(week.id) : n.delete(week.id); return n; });
                      }} />
                      <span className="text-xs">{week.weekName}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Days</p>
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => {
                    if (selectedDays.size === 7) setSelectedDays(new Set());
                    else setSelectedDays(new Set(DAY_ORDER));
                  }}>
                    {selectedDays.size === 7 ? "Deselect all" : "Select all"}
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {DAY_ORDER.map(dayIdx => (
                    <label key={dayIdx} className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover:bg-muted/40">
                      <Checkbox checked={selectedDays.has(dayIdx)} onCheckedChange={(checked) => {
                        setSelectedDays(prev => { const n = new Set(prev); checked ? n.add(dayIdx) : n.delete(dayIdx); return n; });
                      }} />
                      <span className="text-xs">{DAY_NAMES[dayIdx].slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Meal slot</p>
                <div className="grid grid-cols-2 gap-2">
                  {DAILY_SLOTS.map(slot => {
                    const Icon = slot.icon;
                    const on = selectedSlots.has(slot.key);
                    return (
                      <label key={slot.key} className={`flex items-center gap-2 p-2.5 rounded-md border cursor-pointer transition-colors ${on ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`} data-testid={`label-slot-${slot.key}`}>
                        <Checkbox checked={on} onCheckedChange={(checked) => {
                          setSelectedSlots(prev => { const n = new Set(prev); checked ? n.add(slot.key) : n.delete(slot.key); return n; });
                        }} />
                        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm">{slot.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {canConfirmDaily && (
                <p className="text-xs text-muted-foreground/70 px-1">
                  Will add to {dailyAssignmentCount} slot{dailyAssignmentCount !== 1 ? "s" : ""} — saving to cookbook first.
                </p>
              )}
            </div>
          )}

          {/* ── Provisioning pathway ── */}
          {pathway === "provisioning" && (
            <div className="space-y-4" data-testid="section-provisioning-selection">
              {plannerWeeks.length > 1 && (
                <div>
                  <p className="text-sm font-medium mb-2">Add to which week?</p>
                  <div className="grid grid-cols-3 gap-2">
                    {plannerWeeks.slice().sort((a, b) => a.weekNumber - b.weekNumber).map(week => (
                      <label key={week.id} className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${selectedWeeks.has(week.id) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`} data-testid={`label-prov-week-${week.weekNumber}`}>
                        <Checkbox checked={selectedWeeks.has(week.id)} onCheckedChange={(checked) => {
                          setSelectedWeeks(prev => { const n = new Set(prev); checked ? n.add(week.id) : n.delete(week.id); return n; });
                        }} />
                        <span className="text-xs">{week.weekName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/30 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Weekly provisioning</p>
                </div>
                <p className="text-xs text-emerald-700/80 dark:text-emerald-300/70 leading-relaxed">
                  <span className="font-medium">{product.product_name}</span> will be added to your household's weekly list for {plannerWeeks.length > 1 && selectedWeeks.size > 0 ? provisioningWeekName : (plannerWeeks[0]?.weekName ?? "this week")}.
                  It will appear in the Weekly Provisioning section of your planner.
                </p>
                <p className="text-[11px] text-emerald-600/60 dark:text-emerald-400/50">
                  Not assigned to a specific day — available whenever needed this week.
                </p>
              </div>

              <p className="text-[11px] text-muted-foreground/60 leading-relaxed px-1">
                A cookbook entry will be created for this item first.
              </p>
            </div>
          )}

        </div>

        <DialogFooter className="gap-2 flex-wrap">
          {pathway !== null && (
            <Button variant="ghost" size="sm" onClick={() => setPathway(null)} disabled={saving} data-testid="button-back-pathway">
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />Back
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          {(pathway === "daily" || pathway === "provisioning") && (
            <Button variant="default"
              size="sm"
              onClick={handleConfirm}
              disabled={saving || (pathway === "daily" ? !canConfirmDaily : false)}
              data-testid="button-confirm-add-to-week"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
              {pathway === "daily" ? "Add to Planner" : "Add to Provisioning"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
