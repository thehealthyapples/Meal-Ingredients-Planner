import { Plus, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_MEALS } from "@/lib/demo-data";
import { useDemoWriteGuard } from "@/components/demo-readonly-modal";

export default function DemoMealsPage() {
  const { guard, modal } = useDemoWriteGuard();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {modal}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="demo-meals-title">
            Demo Meals
          </h1>
          <Badge data-testid="demo-meals-badge">{DEMO_MEALS.length}</Badge>
        </div>
        <Button size="sm" onClick={guard} data-testid="button-demo-add-meal-new">
          <Plus className="h-4 w-4 mr-1" />
          Add Meal
        </Button>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        data-testid="demo-meals-grid"
      >
        {DEMO_MEALS.map((meal) => (
          <Card key={meal.id} data-testid={`card-meal-${meal.id}`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base font-semibold leading-tight">
                  {meal.name}
                </CardTitle>
                <Badge variant="outline" className="text-xs shrink-0">
                  {meal.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {meal.ingredients.length} ingredients
              </p>
              <div className="flex flex-wrap gap-1">
                {meal.ingredients.slice(0, 4).map((ing) => (
                  <span
                    key={ing}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                  >
                    {ing}
                  </span>
                ))}
                {meal.ingredients.length > 4 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    +{meal.ingredients.length - 4} more
                  </span>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={guard}
                  data-testid={`button-add-to-planner-${meal.id}`}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add to Planner
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={guard}
                  data-testid={`button-edit-meal-${meal.id}`}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
