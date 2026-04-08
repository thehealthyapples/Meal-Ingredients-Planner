import { useState } from "react";
import { Plus, Pencil, ChefHat, Search, Globe, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEMO_MEALS } from "@/lib/demo-data";
import { useDemoWriteGuard } from "@/components/demo-readonly-modal";
import { useLocation } from "wouter";

export default function DemoMealsPage() {
  const { guard, modal } = useDemoWriteGuard();
  const [, navigate] = useLocation();
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = () => {
    const q = searchValue.trim();
    if (q) {
      navigate(`/meals?q=${encodeURIComponent(q)}`);
    } else {
      navigate("/meals");
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      {modal}

      {/* Intro: explain what the cookbook is */}
      <div className="rounded-lg bg-primary/5 border border-primary/15 p-4 flex items-start gap-3">
        <ChefHat className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Your Cookbook</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Meals are the building blocks of your planner and shopping basket. Search thousands of recipes from the web, save the ones you love, and add them to your weekly plan.
          </p>
        </div>
      </div>

      {/* Search bar → navigates to the full cookbook with the query */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes — pasta, curry, stir fry…"
            className="pl-9"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            data-testid="input-demo-search"
          />
        </div>
        <Button onClick={handleSearch} data-testid="button-demo-search-go">
          <Globe className="h-4 w-4 mr-1.5" />
          Search
        </Button>
      </div>

      {/* CTA to open the full cookbook */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold tracking-tight" data-testid="demo-meals-title">
            Example Meals
          </h2>
          <Badge data-testid="demo-meals-badge">{DEMO_MEALS.length}</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/meals")}
          data-testid="button-open-full-cookbook"
        >
          Browse all recipes
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </div>

      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        data-testid="demo-meals-grid"
      >
        {DEMO_MEALS.map((meal) => (
          <Card key={meal.id} data-testid={`card-meal-${meal.id}`}>
            <CardHeader className="pb-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm font-semibold leading-tight">
                  {meal.name}
                </CardTitle>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {meal.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              <p className="text-xs text-muted-foreground">
                {meal.ingredients.length} ingredients
              </p>
              <div className="flex flex-wrap gap-1">
                {meal.ingredients.slice(0, 3).map((ing) => (
                  <span
                    key={ing}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                  >
                    {ing}
                  </span>
                ))}
                {meal.ingredients.length > 3 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    +{meal.ingredients.length - 3} more
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
