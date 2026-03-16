import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, ShoppingBasket, Loader2, ChefHat, Leaf, Save, Globe, UtensilsCrossed, Snowflake, Search, Check, ChevronDown, ChevronUp, Utensils } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getWholeFoodAlternative } from "@/lib/whole-food-alternatives";
import { api } from "@shared/routes";
import type { Meal } from "@shared/schema";

interface WebSearchRecipe {
  id: string;
  name: string;
  image: string;
  url: string | null;
  ingredients: string[];
  instructions?: string[];
  source?: string;
}

export interface PartSource {
  type: "basic" | "web" | "my-meal" | "fresh" | "frozen";
  url?: string;
  displayName?: string;
  sourceName?: string;
  mealId?: number;
}

interface MealPart {
  id: string;
  label: string;
  source: PartSource;
}

export function encodeGroupedSources(parts: MealPart[]): string {
  const sources: Record<string, PartSource> = {};
  for (const p of parts) {
    sources[p.label] = p.source;
  }
  return JSON.stringify({ __v: 1, sources });
}

export function decodeGroupedSources(instructions: string[] | null | undefined): Record<string, PartSource> | null {
  if (!instructions || instructions.length === 0) return null;
  try {
    const parsed = JSON.parse(instructions[0]);
    if (parsed.__v === 1 && parsed.sources) return parsed.sources as Record<string, PartSource>;
  } catch { }
  return null;
}

function sourceLabel(source: PartSource): string {
  switch (source.type) {
    case "web": return source.sourceName || "Web";
    case "my-meal": return "My Meals";
    case "fresh": return "Fresh";
    case "frozen": return "Frozen";
    default: return "Basic";
  }
}

function sourceBadgeVariant(type: PartSource["type"]): string {
  switch (type) {
    case "web": return "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400";
    case "my-meal": return "border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-400";
    case "fresh": return "border-green-300 text-green-700 dark:border-green-700 dark:text-green-400";
    case "frozen": return "border-cyan-300 text-cyan-700 dark:border-cyan-700 dark:text-cyan-400";
    default: return "border-border text-muted-foreground";
  }
}

let partIdCounter = 0;
function makeId() { return `part-${++partIdCounter}`; }

export default function QuickMealPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const editId = new URLSearchParams(search).get("edit");

  const [mealName, setMealName] = useState("");
  const [parts, setParts] = useState<MealPart[]>([]);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [expandedPartId, setExpandedPartId] = useState<string | null>(null);
  const [webResults, setWebResults] = useState<Record<string, WebSearchRecipe[]>>({});
  const [webLoading, setWebLoading] = useState<Record<string, boolean>>({});
  const [myMealResults, setMyMealResults] = useState<Record<string, Meal[]>>({});

  const { data: userMeals = [] } = useQuery<Meal[]>({
    queryKey: [api.meals.list.path],
  });

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
      const savedSources = decodeGroupedSources(existingMeal.instructions);
      setParts(
        (existingMeal.ingredients ?? []).map((label) => ({
          id: makeId(),
          label,
          source: savedSources?.[label] ?? { type: "basic" },
        }))
      );
    }
  }, [existingMeal]);

  const addItem = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setParts((prev) => [...prev, { id: makeId(), label: trimmed, source: { type: "basic" } }]);
    setInputValue("");
    inputRef.current?.focus();
  };

  const removePart = (id: string) => {
    setParts((prev) => prev.filter((p) => p.id !== id));
    setExpandedPartId((prev) => prev === id ? null : prev);
  };

  const updatePartSource = (id: string, source: PartSource) => {
    setParts((prev) => prev.map((p) => p.id === id ? { ...p, source } : p));
    setExpandedPartId(null);
  };

  const toggleExpanded = (id: string) => {
    setExpandedPartId((prev) => prev === id ? null : id);
  };

  const searchWeb = useCallback(async (partId: string, label: string) => {
    setWebLoading((prev) => ({ ...prev, [partId]: true }));
    try {
      const res = await fetch(`/api/search-recipes?q=${encodeURIComponent(label)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Search failed");
      const data: { recipes: WebSearchRecipe[] } = await res.json();
      setWebResults((prev) => ({ ...prev, [partId]: data.recipes.slice(0, 5) }));
    } catch {
      toast({ title: "Search failed", description: "Could not fetch recipes.", variant: "destructive" });
    } finally {
      setWebLoading((prev) => ({ ...prev, [partId]: false }));
    }
  }, [toast]);

  const searchMyMeals = useCallback((partId: string, label: string) => {
    const q = label.toLowerCase();
    const matches = userMeals
      .filter((m) => !m.isSystemMeal && m.name.toLowerCase().includes(q))
      .slice(0, 5);
    setMyMealResults((prev) => ({ ...prev, [partId]: matches }));
  }, [userMeals]);

  const buildInstructions = (currentParts: MealPart[]): string[] => {
    const hasSources = currentParts.some((p) => p.source.type !== "basic");
    if (!hasSources) return [];
    return [encodeGroupedSources(currentParts)];
  };

  const saveMealMutation = useMutation({
    mutationFn: async () => {
      const name = mealName.trim() || "Quick Meal";
      const ingredients = parts.map((p) => p.label);
      const instructions = buildInstructions(parts);
      if (editId) {
        const res = await apiRequest("PUT", `/api/meals/${editId}`, { name, ingredients, instructions });
        return res.json() as Promise<Meal>;
      } else {
        const res = await apiRequest("POST", api.meals.create.path, {
          name,
          ingredients,
          instructions,
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
      for (const part of parts) {
        await apiRequest("POST", "/api/shopping-list/extras", { name: part.label, category: "other" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
      toast({ title: "Basket list created", description: `${parts.length} item${parts.length === 1 ? "" : "s"} added to your basket.` });
      navigate("/analyse-basket");
    },
    onError: () => {
      toast({ title: "Failed to create basket list", variant: "destructive" });
    },
  });

  const saveToMealsMutation = useMutation({
    mutationFn: async () => saveMealMutation.mutateAsync(),
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

              {parts.length > 0 && (
                <ul className="space-y-2" data-testid="list-quick-meal-items">
                  {parts.map((part, idx) => {
                    const wf = getWholeFoodAlternative(part.label);
                    const isOpen = expandedPartId === part.id;
                    const webRes = webResults[part.id] ?? [];
                    const myMeals = myMealResults[part.id] ?? [];
                    const isSearchingWeb = webLoading[part.id] ?? false;

                    return (
                      <li key={part.id} className="rounded-md border border-border overflow-hidden" data-testid={`item-quick-meal-${idx}`}>
                        <div className="flex items-center gap-2 px-3 py-2 text-sm">
                          <span className="flex-1 font-medium">{part.label}</span>

                          {part.source.type !== "basic" && (
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 flex items-center gap-1 shrink-0 ${sourceBadgeVariant(part.source.type)}`}>
                              {part.source.type === "web" && <Globe className="h-2.5 w-2.5" />}
                              {part.source.type === "my-meal" && <Utensils className="h-2.5 w-2.5" />}
                              {part.source.type === "fresh" && <Leaf className="h-2.5 w-2.5" />}
                              {part.source.type === "frozen" && <Snowflake className="h-2.5 w-2.5" />}
                              {sourceLabel(part.source)}
                            </Badge>
                          )}

                          {wf && part.source.type === "basic" && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-green-300 text-green-700 dark:border-green-700 dark:text-green-400 flex items-center gap-1 shrink-0">
                              <Leaf className="h-2.5 w-2.5" />
                              wholefood
                            </Badge>
                          )}

                          <button
                            onClick={() => toggleExpanded(part.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            data-testid={`button-source-picker-${idx}`}
                            title="Resolve source"
                          >
                            {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>

                          <button
                            onClick={() => removePart(part.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                            data-testid={`button-remove-quick-meal-item-${idx}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {isOpen && (
                          <div className="border-t border-border bg-muted/30 px-3 pb-3 pt-2 space-y-2">
                            <p className="text-xs text-muted-foreground font-medium mb-2">Resolve "{part.label}" from:</p>

                            <div className="flex flex-wrap gap-1.5">
                              <Button
                                size="sm"
                                variant={part.source.type === "basic" ? "default" : "outline"}
                                className="text-xs h-7 px-2"
                                onClick={() => updatePartSource(part.id, { type: "basic" })}
                                data-testid={`button-source-basic-${idx}`}
                              >
                                {part.source.type === "basic" && <Check className="h-3 w-3 mr-1" />}
                                Basic item
                              </Button>
                              <Button
                                size="sm"
                                variant={part.source.type === "fresh" ? "default" : "outline"}
                                className="text-xs h-7 px-2"
                                onClick={() => updatePartSource(part.id, { type: "fresh" })}
                                data-testid={`button-source-fresh-${idx}`}
                              >
                                {part.source.type === "fresh" && <Check className="h-3 w-3 mr-1" />}
                                <Leaf className="h-3 w-3 mr-1" />
                                Fresh
                              </Button>
                              <Button
                                size="sm"
                                variant={part.source.type === "frozen" ? "default" : "outline"}
                                className="text-xs h-7 px-2"
                                onClick={() => updatePartSource(part.id, { type: "frozen" })}
                                data-testid={`button-source-frozen-${idx}`}
                              >
                                {part.source.type === "frozen" && <Check className="h-3 w-3 mr-1" />}
                                <Snowflake className="h-3 w-3 mr-1" />
                                Frozen
                              </Button>
                            </div>

                            <div className="flex gap-1.5 mt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 px-2 flex-1"
                                onClick={() => searchMyMeals(part.id, part.label)}
                                data-testid={`button-source-mymeals-${idx}`}
                              >
                                <UtensilsCrossed className="h-3 w-3 mr-1" />
                                My Meals
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 px-2 flex-1"
                                onClick={() => searchWeb(part.id, part.label)}
                                disabled={isSearchingWeb}
                                data-testid={`button-source-web-${idx}`}
                              >
                                {isSearchingWeb ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Search className="h-3 w-3 mr-1" />}
                                Search web
                              </Button>
                            </div>

                            {myMeals.length > 0 && (
                              <div className="space-y-1 mt-1">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">My Meals matches</p>
                                {myMeals.map((m) => (
                                  <button
                                    key={m.id}
                                    className="w-full text-left text-xs rounded border border-border px-2 py-1.5 hover:bg-accent transition-colors flex items-center justify-between gap-2"
                                    onClick={() => updatePartSource(part.id, { type: "my-meal", mealId: m.id, displayName: m.name })}
                                    data-testid={`result-my-meal-${m.id}`}
                                  >
                                    <span className="font-medium truncate">{m.name}</span>
                                    {part.source.type === "my-meal" && part.source.mealId === m.id && (
                                      <Check className="h-3 w-3 text-primary shrink-0" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}

                            {webRes.length > 0 && (
                              <div className="space-y-1 mt-1">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Web results</p>
                                {webRes.map((r) => (
                                  <button
                                    key={r.id}
                                    className="w-full text-left text-xs rounded border border-border px-2 py-1.5 hover:bg-accent transition-colors"
                                    onClick={() => updatePartSource(part.id, {
                                      type: "web",
                                      url: r.url ?? undefined,
                                      displayName: r.name,
                                      sourceName: r.source,
                                    })}
                                    data-testid={`result-web-${r.id}`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-medium truncate">{r.name}</span>
                                      <div className="flex items-center gap-1 shrink-0">
                                        {r.source && <span className="text-[10px] text-muted-foreground">{r.source}</span>}
                                        {part.source.type === "web" && part.source.displayName === r.name && (
                                          <Check className="h-3 w-3 text-primary" />
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            {webRes.length === 0 && myMeals.length === 0 && !isSearchingWeb && (
                              <p className="text-[11px] text-muted-foreground text-center py-1">Click "My Meals" or "Search web" to find a recipe for this part.</p>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {parts.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Add components above, then optionally resolve each one from a recipe source.</p>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              disabled={parts.length === 0 || isWorking}
              onClick={() => createBasketMutation.mutate()}
              data-testid="button-create-basket-list"
            >
              {createBasketMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShoppingBasket className="h-4 w-4 mr-2" />
              )}
              {editId ? "Update & Add to Basket" : "Create Basket List"}
              {parts.length > 0 && ` (${parts.length} item${parts.length === 1 ? "" : "s"})`}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              disabled={parts.length === 0 || isWorking}
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
