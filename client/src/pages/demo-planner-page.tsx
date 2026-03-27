import { Lock, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEMO_PLANNER, DEMO_MEALS, getMealById } from "@/lib/demo-data";
import { useDemoWriteGuard } from "@/components/demo-readonly-modal";

const SLOTS = ["breakfast", "lunch", "dinner"] as const;
const SLOT_LABELS: Record<typeof SLOTS[number], string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

export default function DemoPlannerPage() {
  const { guard, modal } = useDemoWriteGuard();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {modal}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight" data-testid="demo-planner-title">
          Demo Planner - Week 1
        </h1>
        <Lock className="h-4 w-4 text-muted-foreground" />
        <Badge variant="secondary" className="text-xs">Read-only</Badge>
      </div>

      {/* Desktop grid - columns = days, rows = meal slots */}
      <div
        className="overflow-x-auto rounded-xl border border-border bg-card/60 backdrop-blur-sm"
        data-testid="demo-planner-grid"
      >
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="w-[90px] py-3 px-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                Slot
              </th>
              {DEMO_PLANNER.map((day) => (
                <th key={day.day} className="py-3 px-3 text-center font-semibold text-xs uppercase tracking-wide">
                  {day.day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((slot) => (
              <tr key={slot} className="border-b border-border last:border-0">
                <td className="py-3 px-3 font-medium text-muted-foreground text-xs">
                  {SLOT_LABELS[slot]}
                </td>
                {DEMO_PLANNER.map((day) => {
                  const mealId = day.slots[slot];
                  const meal = mealId ? getMealById(mealId) : undefined;
                  return (
                    <td
                      key={day.day}
                      className="py-2 px-2 text-center"
                      data-testid={`planner-cell-${day.day.toLowerCase()}-${slot}`}
                    >
                      {meal ? (
                        <button
                          onClick={guard}
                          className="w-full text-xs rounded-lg bg-primary/8 hover:bg-primary/15 text-foreground px-2 py-1.5 transition-colors text-left leading-snug border border-primary/15"
                          data-testid={`planner-meal-${day.day.toLowerCase()}-${slot}`}
                        >
                          {meal.name}
                        </button>
                      ) : (
                        <button
                          onClick={guard}
                          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 flex items-center justify-center gap-1"
                          data-testid={`planner-empty-${day.day.toLowerCase()}-${slot}`}
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add</span>
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={guard} data-testid="button-demo-add-meal">
          <Plus className="h-4 w-4 mr-1" />
          Add Meal
        </Button>
        <Button variant="outline" size="sm" onClick={guard} data-testid="button-demo-edit-plan">
          Edit Plan
        </Button>
      </div>
    </div>
  );
}
