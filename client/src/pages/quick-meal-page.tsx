import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, ShoppingBasket, Loader2, ChefHat, Leaf, Save, Globe, UtensilsCrossed, Snowflake, Check, ChevronDown, ChevronUp, Utensils, ImageOff, Camera } from "lucide-react";
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
    case "my-meal": return "Cookbook";
    case "fresh": return "Fresh";
    case "frozen": return "Frozen";
    default: return "Basic";
  }
}

function sourceBadgeClass(type: PartSource["type"]): string {
  switch (type) {
    case "web": return "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400";
    case "my-meal": return "border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-400";
    case "fresh": return "border-green-300 text-green-700 dark:border-green-700 dark:text-green-400";
    case "frozen": return "border-cyan-300 text-cyan-700 dark:border-cyan-700 dark:text-cyan-400";
    default: return "border-border text-muted-foreground";
  }
}

const PAGE_SIZE = 4;

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
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoScanning, setPhotoScanning] = useState(false);

  const [expandedPartId, setExpandedPartId] = useState<string | null>(null);
  const [webResults, setWebResults] = useState<Record<string, WebSearchRecipe[]>>({});
  const [webLoading, setWebLoading] = useState<Record<string, boolean>>({});
  const [webDisplayCount, setWebDisplayCount] = useState<Record<string, number>>({});
  const [myMealResults, setMyMealResults] = useState<Record<string, Meal[]>>({});
  const [savingCardId, setSavingCardId] = useState<string | null>(null);
  const fetchedParts = useRef<Set<string>>(new Set());

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

  const searchWeb = useCallback(async (partId: string, label: string) => {
    if (fetchedParts.current.has(partId)) return;
    fetchedParts.current.add(partId);
    setWebLoading((prev) => ({ ...prev, [partId]: true }));
    try {
      const res = await fetch(`/api/search-recipes?q=${encodeURIComponent(label)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Search failed");
      const data: { recipes: WebSearchRecipe[] } = await res.json();
      setWebResults((prev) => ({ ...prev, [partId]: data.recipes }));
      setWebDisplayCount((prev) => ({ ...prev, [partId]: PAGE_SIZE }));
    } catch {
      fetchedParts.current.delete(partId);
      toast({ title: "Search failed", description: "Could not fetch recipes.", variant: "destructive" });
    } finally {
      setWebLoading((prev) => ({ ...prev, [partId]: false }));
    }
  }, [toast]);

  const selectWebRecipe = useCallback(async (partId: string, recipe: WebSearchRecipe) => {
    setSavingCardId(recipe.id);
    try {
      const res = await apiRequest("POST", api.meals.create.path, {
        name: recipe.name,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions ?? [],
        imageUrl: recipe.image || null,
        sourceUrl: recipe.url || null,
        mealSourceType: "web",
        mealFormat: "recipe",
        servings: 1,
        isReadyMeal: false,
        isDrink: false,
        isFreezerEligible: true,
        audience: "adult",
        dietTypes: [],
      });
      const saved: Meal = await res.json();
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
      updatePartSource(partId, {
        type: "web",
        mealId: saved.id,
        url: recipe.url ?? undefined,
        displayName: recipe.name,
        sourceName: recipe.source,
      });
    } catch {
      toast({ title: "Failed to save recipe", variant: "destructive" });
      updatePartSource(partId, {
        type: "web",
        url: recipe.url ?? undefined,
        displayName: recipe.name,
        sourceName: recipe.source,
      });
    } finally {
      setSavingCardId(null);
    }
  }, [toast, queryClient]);

  useEffect(() => {
    if (!expandedPartId) return;
    const part = parts.find((p) => p.id === expandedPartId);
    if (!part) return;
    searchWeb(expandedPartId, part.label);
    const q = part.label.toLowerCase();
    const matches = userMeals.filter((m) => !m.isSystemMeal && m.name.toLowerCase().includes(q)).slice(0, 5);
    setMyMealResults((prev) => ({ ...prev, [expandedPartId]: matches }));
  }, [expandedPartId]);

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

  const loadMore = (partId: string) => {
    setWebDisplayCount((prev) => ({ ...prev, [partId]: (prev[partId] ?? PAGE_SIZE) + PAGE_SIZE }));
  };

  const handlePhotoScan = async (file: File) => {
    setPhotoScanning(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch("/api/scan", { method: "POST", body: formData, credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Scan failed", description: data.message || "Could not read image." });
        return;
      }
      if (data.parsed?.type === "recipe" && Array.isArray(data.parsed.ingredients) && data.parsed.ingredients.length > 0) {
        const newParts: MealPart[] = data.parsed.ingredients.map((label: string) => ({
          id: makeId(), label, source: { type: "basic" as const },
        }));
        setParts((prev) => [...prev, ...newParts]);
        if (!mealName && data.parsed.title) setMealName(data.parsed.title);
        toast({ title: "Photo scanned", description: `${newParts.length} ingredient${newParts.length !== 1 ? "s" : ""} detected.` });
      } else {
        toast({ title: "No recipe detected", description: "Try adding meal components manually." });
      }
    } catch {
      toast({ variant: "destructive", title: "Scan failed", description: "Could not connect to server." });
    } finally {
      setPhotoScanning(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const buildInstructions = (currentParts: MealPart[]): string[] => {
    const hasSources = currentParts.some((p) => p.source.type !== "basic");
    if (!hasSources) return [];
    return [encodeGroupedSources(currentParts)];
  };

  const saveMealMutation = useMutation({
    mutationFn: async () => {
      const name = mealName.trim() || "Build a Meal";
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
      toast({ title: editId ? "Meal updated" : "Meal saved", description: `${mealName.trim() || "Build a Meal"} added to Cookbook.` });
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
          {editId ? "Edit Meal" : "Build a Meal"}
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

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                data-testid="input-photo-upload"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoScan(f); }}
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={photoScanning}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-accent/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-photo-upload"
              >
                {photoScanning ? (
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                ) : (
                  <Camera className="h-4 w-4 shrink-0" />
                )}
                <span>{photoScanning ? "Scanning photo…" : "Upload a photo of your meal"}</span>
              </button>

              {parts.length > 0 && (
                <ul className="space-y-2" data-testid="list-quick-meal-items">
                  {parts.map((part, idx) => {
                    const wf = getWholeFoodAlternative(part.label);
                    const isOpen = expandedPartId === part.id;
                    const allWebRes = webResults[part.id] ?? [];
                    const displayCount = webDisplayCount[part.id] ?? PAGE_SIZE;
                    const visibleWebRes = allWebRes.slice(0, displayCount);
                    const hasMore = allWebRes.length > displayCount;
                    const myMeals = myMealResults[part.id] ?? [];
                    const isSearching = webLoading[part.id] ?? false;

                    return (
                      <li key={part.id} className="rounded-md border border-border overflow-hidden" data-testid={`item-quick-meal-${idx}`}>
                        {/* Row */}
                        <div className="flex items-center gap-2 px-3 py-2 text-sm">
                          <span className="flex-1 font-medium">{part.label}</span>

                          {part.source.type !== "basic" && (
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 flex items-center gap-1 shrink-0 ${sourceBadgeClass(part.source.type)}`}>
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

                        {/* Source picker panel */}
                        {isOpen && (
                          <div className="border-t border-border bg-muted/30 px-3 pb-3 pt-2 space-y-3">

                            {/* Quick type buttons */}
                            <div className="flex flex-wrap gap-1.5">
                              <Button
                                size="sm"
                                variant={part.source.type === "basic" ? "default" : "outline"}
                                className="text-xs h-7 px-2"
                                onClick={() => updatePartSource(part.id, { type: "basic" })}
                                data-testid={`button-source-basic-${idx}`}
                              >
                                {part.source.type === "basic" && <Check className="h-3 w-3 mr-1" />}
                                Basic
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

                            {/* My Meals matches (compact list) */}
                            {myMeals.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                  <UtensilsCrossed className="h-3 w-3" /> Cookbook
                                </p>
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

                            {/* Web recipe image grid */}
                            <div className="space-y-2">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                <Globe className="h-3 w-3" /> Recipes
                              </p>

                              {isSearching ? (
                                <div className="flex items-center justify-center py-6">
                                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                              ) : visibleWebRes.length > 0 ? (
                                <>
                                  <div className="grid grid-cols-2 gap-2" data-testid={`grid-web-results-${idx}`}>
                                    {visibleWebRes.map((r) => {
                                      const isSelected = part.source.type === "web" && part.source.displayName === r.name;
                                      const isSaving = savingCardId === r.id;
                                      return (
                                        <button
                                          key={r.id}
                                          disabled={isSaving || !!savingCardId}
                                          className={`relative rounded-md overflow-hidden border-2 text-left transition-all disabled:opacity-60 ${isSelected ? "border-primary" : "border-border hover:border-primary/50"}`}
                                          onClick={() => selectWebRecipe(part.id, r)}
                                          data-testid={`result-web-${r.id}`}
                                        >
                                          {/* Image */}
                                          <div className="w-full aspect-square bg-muted relative">
                                            {r.image ? (
                                              <img
                                                src={r.image}
                                                alt={r.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center">
                                                <ImageOff className="h-6 w-6 text-muted-foreground/40" />
                                              </div>
                                            )}
                                            {isSaving && (
                                              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                              </div>
                                            )}
                                            {isSelected && !isSaving && (
                                              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                <div className="bg-primary rounded-full p-1">
                                                  <Check className="h-3 w-3 text-primary-foreground" />
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                          {/* Caption */}
                                          <div className="px-1.5 py-1.5 bg-background">
                                            <p className="text-[11px] font-medium leading-tight line-clamp-2">{r.name}</p>
                                            {r.source && (
                                              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{r.source}</p>
                                            )}
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {hasMore && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full text-xs h-7 mt-1"
                                      onClick={() => loadMore(part.id)}
                                      data-testid={`button-load-more-${idx}`}
                                    >
                                      Load more
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <p className="text-[11px] text-muted-foreground text-center py-3">No recipes found for "{part.label}".</p>
                              )}
                            </div>

                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {parts.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Add components above, then tap ▼ to pick a recipe source for each one.</p>
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
              {editId ? "Save Changes" : "Save to Cookbook"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
