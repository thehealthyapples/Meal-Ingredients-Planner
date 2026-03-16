import { useState, useRef, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, ShoppingBasket, Loader2, ChefHat, Leaf, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getWholeFoodAlternative } from "@/lib/whole-food-alternatives";
import { api } from "@shared/routes";
import type { Meal } from "@shared/schema";

export default function QuickMealPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const editId = new URLSearchParams(search).get("edit");

  const [mealName, setMealName] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: existingMeal, isLoading: isLoadingMeal } = useQuery<Meal>({
    queryKey: [api.meals.list.path, editId],
    queryFn: async () => {
      const res = await fetch(`/api/meals/${editId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load meal");
      return res.json();
    },
    enabled: !!editId,
  });

  useEffect(() => {
    if (existingMeal) {
      setMealName(existingMeal.name);
      setItems(existingMeal.ingredients ?? []);
    }
  }, [existingMeal]);

  const addItem = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setItems((prev) => [...prev, trimmed]);
    setInputValue("");
    inputRef.current?.focus();
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const saveMealMutation = useMutation({
    mutationFn: async () => {
      const name = mealName.trim() || "Quick Meal";
      if (editId) {
        const res = await apiRequest("PUT", `/api/meals/${editId}`, {
          name,
          ingredients: items,
        });
        return res.json() as Promise<Meal>;
      } else {
        const res = await apiRequest("POST", api.meals.create.path, {
          name,
          ingredients: items,
          instructions: [],
          mealFormat: "grouped",
          mealSourceType: "scratch",
          servings: 1,
          isReadyMeal: false,
          isDrink: false,
          isFreezerEligible: true,
          audience: "adult",
          dietTypes: [],
        });
        return res.json() as Promise<Meal>;
      }
    },
  });

  const createBasketMutation = useMutation({
    mutationFn: async () => {
      await saveMealMutation.mutateAsync();
      for (const item of items) {
        await apiRequest("POST", "/api/shopping-list/extras", { name: item, category: "other" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
      toast({
        title: "Basket list created",
        description: `${items.length} item${items.length === 1 ? "" : "s"} added to your basket.`,
      });
      navigate("/analyse-basket");
    },
    onError: () => {
      toast({ title: "Failed to create basket list", variant: "destructive" });
    },
  });

  const saveToMealsMutation = useMutation({
    mutationFn: async () => {
      return saveMealMutation.mutateAsync();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
      toast({ title: editId ? "Meal updated" : "Meal saved", description: `${mealName.trim() || "Quick Meal"} added to My Meals.` });
      navigate("/meals");
    },
    onError: () => {
      toast({ title: "Failed to save meal", variant: "destructive" });
    },
  });

  const isWorking = createBasketMutation.isPending || saveToMealsMutation.isPending || isLoadingMeal;

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <ChefHat className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight">
          {editId ? "Edit Quick Meal" : "Quick Meal"}
        </h1>
      </div>

      {isLoadingMeal ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Meal name (optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="e.g. Sunday roast dinner"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                data-testid="input-quick-meal-name"
              />
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Add components</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="e.g. chicken, roast potatoes, gravy…"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
                  data-testid="input-quick-meal-item"
                />
                <Button size="sm" onClick={addItem} disabled={!inputValue.trim()} data-testid="button-add-quick-meal-item">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {items.length > 0 && (
                <ul className="space-y-1.5" data-testid="list-quick-meal-items">
                  {items.map((item, idx) => {
                    const wf = getWholeFoodAlternative(item);
                    return (
                      <li key={idx} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm" data-testid={`item-quick-meal-${idx}`}>
                        <span className="flex-1">{item}</span>
                        {wf && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-green-300 text-green-700 dark:border-green-700 dark:text-green-400 flex items-center gap-1 shrink-0">
                            <Leaf className="h-2.5 w-2.5" />
                            wholefood tip
                          </Badge>
                        )}
                        <button
                          onClick={() => removeItem(idx)}
                          className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          data-testid={`button-remove-quick-meal-item-${idx}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {items.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Add components above, then create a basket list or save to My Meals.</p>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              disabled={items.length === 0 || isWorking}
              onClick={() => createBasketMutation.mutate()}
              data-testid="button-create-basket-list"
            >
              {createBasketMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShoppingBasket className="h-4 w-4 mr-2" />
              )}
              {editId ? "Update & Add to Basket" : "Create Basket List"}
              {items.length > 0 && ` (${items.length} item${items.length === 1 ? "" : "s"})`}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              disabled={items.length === 0 || isWorking}
              onClick={() => saveToMealsMutation.mutate()}
              data-testid="button-save-to-meals"
            >
              {saveToMealsMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {editId ? "Save Changes" : "Save to My Meals"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
