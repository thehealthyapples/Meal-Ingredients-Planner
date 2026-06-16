import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";
import { type Meal, type Nutrition, type MealAllergen, type Diet, type MealDiet, type MealCategory } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, ArrowLeft, ChefHat, Pencil, Trash2, ShoppingBasket, AlertTriangle, RefreshCw, Plus, X, Save, Minus, Flame, Beef, Wheat, Droplets, Cookie, Droplet, Users, Leaf, Zap, TrendingDown, Sprout, Clock, AlarmClock, ListPlus, Wand2, Check, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { appendPendingIngredient } from "@/lib/quick-list";
import { getCategoryIcon, getCategoryColor } from "@/lib/category-utils";
import { useToast } from "@/hooks/use-toast";
import { useAdaptiveDensity } from "@/hooks/use-adaptive-density";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { scaleIngredient } from "@/lib/scaleIngredient";
import { MealTrustSummary } from "@/components/meal-detail/MealTrustSummary";
import { MealFamilyConfidence } from "@/components/meal-detail/MealFamilyConfidence";
import { HouseholdAdaptationsSummary } from "@/components/meal-detail/HouseholdAdaptationsSummary";
import { SimplyBetterChoicesPanel } from "@/components/meal-detail/SimplyBetterChoicesPanel";

type SwapGoal = "vegetarian" | "keto" | "lower-cost" | "less-processed" | "under-time" | "household";

type PartSource =
  | { type: "basic" | "fresh" | "frozen" }
  | { type: "web"; url: string; displayName: string; sourceName: string; mealId?: number }
  | { type: "my-meal"; mealId: number; displayName: string };
interface GroupedSources { __v: 1; sources: Record<string, PartSource> }

function decodeGroupedSources(instructions: string[]): GroupedSources | null {
  try {
    if (!instructions?.[0]) return null;
    const parsed = JSON.parse(instructions[0]);
    if (parsed?.__v === 1 && parsed.sources) return parsed as GroupedSources;
    return null;
  } catch { return null; }
}

interface ChangedIngredient { original: string; replacement: string; reason: string; }
interface AdaptResult {
  changedIngredients: ChangedIngredient[];
  basketChanges: string[];
  prepTimeChangeDelta: number | null;
  costChange: "lower" | "higher" | "same" | null;
  explanation: string;
}

function minsToTimeStr(totalMins: number): string {
  const normalized = ((totalMins % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  const period = h >= 12 ? "pm" : "am";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")}${period}`;
}

function generateSchedule(
  sources: Record<string, PartSource>,
  durations: Record<string, number>,
  serveTime: string
): Array<{ label: string; startTime: string; duration: number }> {
  const [hh, mm] = serveTime.split(":").map(Number);
  const serveMins = hh * 60 + (mm || 0);
  const webKeys = Object.keys(sources);
  return webKeys
    .map(label => ({ label, duration: durations[label] ?? 30, startMins: serveMins - (durations[label] ?? 30) }))
    .sort((a, b) => a.startMins - b.startMins)
    .map(e => ({ label: e.label, startTime: minsToTimeStr(e.startMins), duration: e.duration }));
}

type AdaptGoalResult = { goal: SwapGoal; result: AdaptResult };

const ADAPT_ACTIONS: { goal: SwapGoal; icon: JSX.Element; label: string }[] = [
  { goal: "household",    icon: <Users      className="h-3.5 w-3.5" />, label: "Adapt for my household"   },
  { goal: "vegetarian",  icon: <Leaf       className="h-3.5 w-3.5" />, label: "Make this vegetarian"     },
  { goal: "keto",        icon: <Zap        className="h-3.5 w-3.5" />, label: "Make this keto"           },
  { goal: "lower-cost",  icon: <TrendingDown className="h-3.5 w-3.5" />, label: "Lower the cost"         },
  { goal: "less-processed", icon: <Sprout  className="h-3.5 w-3.5" />, label: "Make this less processed" },
  { goal: "under-time",  icon: <Clock      className="h-3.5 w-3.5" />, label: "Keep under 30 mins"       },
];

export default function MealDetailPage() {
  const [, params] = useRoute("/meals/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { density } = useAdaptiveDensity();
  const queryClient = useQueryClient();
  const mealId = params?.id ? Number(params.id) : null;
  const [reimportOpen, setReimportOpen] = useState(false);
  const [reimportUrl, setReimportUrl] = useState("");
  const [adaptResults, setAdaptResults] = useState<AdaptGoalResult[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<Set<SwapGoal>>(new Set());
  const [adaptOpen, setAdaptOpen] = useState(false);
  const adaptOpenTimeRef = useRef<number>(0);
  const [adaptBusy, setAdaptBusy] = useState(false);

  // Edit mode: false by default; auto-enabled when URL contains ?edit=1 (set on copy creation).
  // Exiting edit mode (after save) hides inline controls until the user clicks Edit again.
  const [isEditing, setIsEditing] = useState(false);
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const saveMenuTimeRef = useRef<number>(0);

  const [editName, setEditName] = useState("");
  const [editIngredients, setEditIngredients] = useState<string[]>([]);
  const [editInstructions, setEditInstructions] = useState<string[]>([]);
  const [editServings, setEditServings] = useState(1);
  const [hasChanges, setHasChanges] = useState(false);
  // View-mode serving override: lets users preview scaled ingredient quantities without saving.
  const [viewServings, setViewServings] = useState(1);
  const [viewServingsRaw, setViewServingsRaw] = useState("1");
  const [methodView, setMethodView] = useState<"component" | "full" | "timing">("component");
  const [activeComponent, setActiveComponent] = useState<string | null>(null);
  const [componentDurations, setComponentDurations] = useState<Record<string, number>>({});
  const [serveTime, setServeTime] = useState("17:00");

  const { data: meal, isLoading: mealLoading } = useQuery<Meal>({
    queryKey: [api.meals.list.path, mealId],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.meals.get.path, { id: mealId! }));
      if (!res.ok) throw new Error("Failed to load meal");
      return res.json();
    },
    enabled: !!mealId,
  });

  const isEditedCopy = !!meal?.originalMealId;

  const initEditState = useCallback((m: Meal) => {
    setEditName(m.name);
    setEditIngredients([...m.ingredients]);
    setEditInstructions([...(m.instructions || [])]);
    setEditServings(m.servings || 1);
    setHasChanges(false);
  }, []);

  useEffect(() => {
    if (meal && isEditedCopy) {
      initEditState(meal);
    }
  }, [meal, isEditedCopy, initEditState]);

  useEffect(() => {
    if (meal) {
      const s = meal.servings || 1;
      setViewServings(s);
      setViewServingsRaw(String(s));
    }
  }, [meal?.id, isEditedCopy]);

  // Auto-enter edit mode when navigated here via the "Edit" copy flow (?edit=1).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('edit') === '1') {
      setIsEditing(true);
    }
  }, []);

  const { data: nutritionData } = useQuery<Nutrition | null>({
    queryKey: [api.nutrition.get.path, mealId],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.nutrition.get.path, { id: mealId! }));
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!mealId,
    // Poll every 4 s while nutrition is absent so the UI updates automatically
    // once the background analysis completes after a servings/ingredient change.
    refetchInterval: (query) => {
      const d = query.state.data as Nutrition | null | undefined;
      return (!d || !d.calories) ? 4000 : false;
    },
  });

  const { data: allergens = [] } = useQuery<MealAllergen[]>({
    queryKey: [api.allergens.get.path, mealId],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.allergens.get.path, { id: mealId! }));
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!mealId,
  });

  const { data: allCategories = [] } = useQuery<MealCategory[]>({
    queryKey: [api.categories.list.path],
  });

  const { data: allDiets = [] } = useQuery<Diet[]>({
    queryKey: [api.diets.list.path],
  });

  const { data: mealDiets = [] } = useQuery<MealDiet[]>({
    queryKey: [api.diets.getMealDiets.path, mealId],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.diets.getMealDiets.path, { id: mealId! }));
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!mealId,
  });

  const { data: allMeals = [] } = useQuery<Meal[]>({
    queryKey: [api.meals.list.path],
    queryFn: async () => {
      const res = await fetch(api.meals.list.path);
      if (!res.ok) throw new Error("Failed to fetch meals");
      return res.json();
    },
    enabled: meal?.mealFormat === "grouped",
  });

  useEffect(() => {
    if (!meal || meal.mealFormat !== "grouped" || allMeals.length === 0) return;
    let gs: GroupedSources | null = null;
    try { gs = decodeGroupedSources(meal.instructions || []); } catch { return; }
    if (!gs) return;
    for (const src of Object.values(gs.sources)) {
      if (src.type !== "web") continue;
      if (!src.mealId || !src.url) continue;
      const componentMeal = allMeals.find(m => m.id === src.mealId);
      if (!componentMeal) continue;
      if (componentMeal.instructions && componentMeal.instructions.length > 0) continue;
      apiRequest('PATCH', buildUrl(api.meals.reimportInstructions.path, { id: src.mealId }), { url: src.url })
        .then(() => { queryClient.invalidateQueries({ queryKey: [api.meals.list.path] }); })
        .catch(() => {});
    }
  }, [meal, allMeals]);

  useEffect(() => {
    if (!meal || meal.mealFormat !== "grouped") return;
    let gs: GroupedSources | null = null;
    try { gs = decodeGroupedSources(meal.instructions || []); } catch { return; }
    if (!gs) return;
    const allKeys = Object.keys(gs.sources);
    const webOnlyKeys = allKeys.filter(k => {
      const s = gs.sources[k];
      return s.type !== "basic" && s.type !== "fresh" && s.type !== "frozen";
    });
    if (webOnlyKeys.length > 0) setActiveComponent(prev => prev ?? webOnlyKeys[0]);
    setComponentDurations(prev => {
      const next = { ...prev };
      for (const k of allKeys) { if (!(k in next)) next[k] = 30; }
      return next;
    });
  }, [meal?.id]);

  const copyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', buildUrl(api.meals.copy.path, { id: mealId! }));
      return res.json() as Promise<Meal>;
    },
    onSuccess: (newMeal) => {
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
      toast({ title: "Editable copy created", description: newMeal.name });
      navigate(`/meals/${newMeal.id}?edit=1`);
    },
    onError: () => {
      toast({ title: "Failed to create copy", variant: "destructive" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PUT', buildUrl(api.meals.update.path, { id: mealId! }), {
        name: editName,
        ingredients: editIngredients.filter(i => i.trim() !== ""),
        instructions: editInstructions.filter(i => i.trim() !== ""),
        servings: editServings,
      });
      return res.json() as Promise<Meal>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path, mealId] });
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.nutrition.get.path, mealId] });
      setHasChanges(false);
      setIsEditing(false);
      toast({ title: "Recipe saved" });
    },
    onError: () => {
      toast({ title: "Failed to save", variant: "destructive" });
    },
  });

  const saveAsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', api.meals.list.path, {
        name: editName,
        ingredients: editIngredients.filter(i => i.trim() !== ""),
        instructions: editInstructions.filter(i => i.trim() !== ""),
        servings: editServings,
      });
      return res.json() as Promise<Meal>;
    },
    onSuccess: (newMeal) => {
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
      toast({ title: "Saved as new recipe", description: newMeal.name });
      navigate(`/meals/${newMeal.id}`);
    },
    onError: () => {
      toast({ title: "Failed to save as new recipe", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', buildUrl(api.meals.delete.path, { id: mealId! }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
      toast({ title: "Meal deleted" });
      navigate("/cookbook");
    },
    onError: () => {
      toast({ title: "Failed to delete meal", variant: "destructive" });
    },
  });

  const addToListMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', api.shoppingList.generateFromMeals.path, {
        mealSelections: [{ mealId: mealId!, count: 1 }],
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.sources.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.prices.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      toast({ title: "Added to basket" });
    },
    onError: () => {
      toast({ title: "Failed to add to basket", variant: "destructive" });
    },
  });

  const addProductToBasketMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', api.shoppingList.add.path, {
        productName: meal!.name,
        quantity: 1,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      toast({ title: "Added to basket", description: meal!.name });
    },
    onError: () => {
      toast({ title: "Couldn't add to basket", description: "Something went wrong - try again", variant: "destructive" });
    },
  });

  const reimportMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await apiRequest('PATCH', buildUrl(api.meals.reimportInstructions.path, { id: mealId! }), { url });
      return res.json() as Promise<Meal>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path, mealId] });
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
      toast({ title: "Instructions imported" });
      setReimportOpen(false);
      setReimportUrl("");
    },
    onError: () => {
      toast({ title: "Failed to import instructions", description: "Could not find instructions on that page. Please check the URL.", variant: "destructive" });
    },
  });

  const applyAdaptations = async () => {
    if (selectedGoals.size === 0 || adaptBusy) return;
    setAdaptBusy(true);
    setAdaptResults([]);
    setAdaptOpen(false);
    const goals = Array.from(selectedGoals) as SwapGoal[];
    const settled = await Promise.allSettled(
      goals.map(goal =>
        apiRequest("POST", `/api/meals/${mealId}/adapt`, { goal })
          .then(r => r.json() as Promise<AdaptResult>)
          .then(result => ({ goal, result }))
      )
    );
    const results = settled
      .filter((s): s is PromiseFulfilledResult<AdaptGoalResult> => s.status === "fulfilled")
      .map(s => s.value);
    const failed = settled.filter(s => s.status === "rejected").length;
    if (failed > 0) toast({ title: `${failed} adaptation${failed > 1 ? "s" : ""} failed`, variant: "destructive" });
    setAdaptResults(results);
    setAdaptBusy(false);
  };

  const markChanged = useCallback(() => setHasChanges(true), []);

  const updateIngredient = (index: number, value: string) => {
    const updated = [...editIngredients];
    updated[index] = value;
    setEditIngredients(updated);
    markChanged();
  };

  const removeIngredient = (index: number) => {
    setEditIngredients(editIngredients.filter((_, i) => i !== index));
    markChanged();
  };

  const addIngredient = () => {
    setEditIngredients([...editIngredients, ""]);
    markChanged();
  };

  const updateInstruction = (index: number, value: string) => {
    const updated = [...editInstructions];
    updated[index] = value;
    setEditInstructions(updated);
    markChanged();
  };

  const removeInstruction = (index: number) => {
    setEditInstructions(editInstructions.filter((_, i) => i !== index));
    markChanged();
  };

  const addInstruction = () => {
    setEditInstructions([...editInstructions, ""]);
    markChanged();
  };

  // Derives display ingredients scaled to viewServings. Always computed from canonical meal.ingredients
  // so changing servings multiple times never compounds.
  const displayIngredients = useMemo(() => {
    if (!meal) return [];
    const base = meal.servings || 1;
    if (viewServings === base) return meal.ingredients;
    return meal.ingredients.map(ing => scaleIngredient(ing, base, viewServings));
  }, [meal, viewServings]);

  if (mealLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="meal-not-found">
        <p className="text-muted-foreground text-center">Meal not found.</p>
        <Button variant="outline" className="mx-auto mt-4 block" onClick={() => navigate("/cookbook")} data-testid="button-back-to-meals">
          Back to Meals
        </Button>
      </div>
    );
  }

  const isPackagedProduct = meal.mealSourceType === 'openfoodfacts';

  const category = allCategories.find(c => c.id === meal.categoryId);
  const CatIcon = category ? getCategoryIcon(category.name) : null;
  const dietNames = mealDiets
    .map(md => allDiets.find(d => d.id === md.dietId)?.name)
    .filter(Boolean);
  const instructions = meal.instructions || [];
  const hasNoInstructions = instructions.length === 0;
  const isGrouped = meal.mealFormat === "grouped";
  const groupedSources = isGrouped ? decodeGroupedSources(instructions) : null;

  return (
    <>
    <PageHeader
      realm="cookbook"
      title={isEditedCopy && isEditing ? editName : meal.name}
      icon={<ChefHat className="h-5 w-5" />}
      fullCollapseOnMobile
      collapseDisabled={adaptOpen}
      context={[
        category?.name ?? null,
        meal.servings != null && meal.servings >= 1 ? `Serves ${meal.servings}` : null,
        !isPackagedProduct && meal.ingredients.length > 0
          ? `${meal.ingredients.length} ingredient${meal.ingredients.length !== 1 ? 's' : ''}`
          : null,
      ].filter(Boolean).join(' · ') || (isPackagedProduct ? 'Ready meal' : 'Recipe')}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => navigate("/cookbook")} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Cookbook
          </Button>
          <div className="h-4 w-px bg-[var(--realm-border)]" />
          <div className="flex items-center gap-1 rounded-md border border-[var(--realm-border)] px-1 py-0.5">
            {/* Save split button: shown only when editing a copy */}
            {isEditedCopy && isEditing && (
              <div className="flex items-center">
                <Button size="sm" variant="outline" className="border-0 pl-2.5 pr-1.5 text-xs realm-banner-btn rounded-r-none border-r border-[var(--realm-border)]" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || saveAsMutation.isPending || !hasChanges} data-testid="button-save-recipe">
                  {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                  Save
                </Button>
                <Popover open={saveMenuOpen} onOpenChange={(open) => { if (open) saveMenuTimeRef.current = Date.now(); setSaveMenuOpen(open); }}>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="outline" className="border-0 px-1.5 text-xs realm-banner-btn rounded-l-none" disabled={saveMutation.isPending || saveAsMutation.isPending} data-testid="button-save-menu-trigger">
                      <ChevronDown className="h-3 w-3 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-44 p-1" align="end" data-testid="popover-save-menu"
                    onPointerDownOutside={(e) => { if (Date.now() - saveMenuTimeRef.current < 300) e.preventDefault(); }}
                    onFocusOutside={(e) => { if (Date.now() - saveMenuTimeRef.current < 300) e.preventDefault(); }}
                  >
                    <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors text-left" onClick={() => { setSaveMenuOpen(false); saveMutation.mutate(); }} data-testid="button-save-overwrite" disabled={!hasChanges}>
                      <Save className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      Save
                    </button>
                    <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors text-left" onClick={() => { setSaveMenuOpen(false); saveAsMutation.mutate(); }} data-testid="button-save-as" disabled={saveAsMutation.isPending}>
                      {saveAsMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" /> : <Save className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                      Save as new recipe
                    </button>
                  </PopoverContent>
                </Popover>
              </div>
            )}
            {/* Edit button: shown on a saved copy in view mode */}
            {isEditedCopy && !isEditing && (
              <Button size="sm" variant="outline" className="border-0 px-2.5 text-xs realm-banner-btn" onClick={() => setIsEditing(true)} data-testid="button-enter-edit">
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            )}
            <Button size="sm" variant="outline" className="border-0 px-2.5 text-xs realm-banner-btn" onClick={() => isPackagedProduct ? addProductToBasketMutation.mutate() : addToListMutation.mutate()} disabled={isPackagedProduct ? addProductToBasketMutation.isPending : addToListMutation.isPending} data-testid="button-add-to-list">
              {(isPackagedProduct ? addProductToBasketMutation.isPending : addToListMutation.isPending) ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <ShoppingBasket className="h-3.5 w-3.5 mr-1" />}
              Add to basket
            </Button>
            {isPackagedProduct && (
              <Button size="sm" variant="outline" className="border-0 px-2.5 text-xs realm-banner-btn" onClick={() => { appendPendingIngredient(meal.name); toast({ title: "Added to quick list", description: meal.name }); }} data-testid="button-add-to-quick-list">
                <ListPlus className="h-3.5 w-3.5 mr-1" />
                Quick List
              </Button>
            )}
            {!isEditedCopy && (
              <Button size="sm" variant="outline" className="border-0 px-2.5 text-xs realm-banner-btn" onClick={() => copyMutation.mutate()} disabled={copyMutation.isPending} data-testid="button-edit-copy">
                {copyMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Pencil className="h-3.5 w-3.5 mr-1" />}
                Edit
              </Button>
            )}
            <Popover
              open={adaptOpen}
              onOpenChange={(open) => {
                if (open) adaptOpenTimeRef.current = Date.now();
                setAdaptOpen(open);
              }}
            >
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" className="border-0 px-2.5 text-xs realm-banner-btn" disabled={adaptBusy} data-testid="button-adapt-trigger">
                  {adaptBusy ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Wand2 className="h-3.5 w-3.5 mr-1" />}
                  Adapt{selectedGoals.size > 0 ? ` (${selectedGoals.size})` : ""}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-56 p-2"
                align="end"
                data-testid="popover-adapt"
                onPointerDownOutside={(e) => {
                  // iOS generates a synthetic pointerdown+click on document.body within
                  // ~300ms of tapping inside a position:sticky element. The Radix
                  // DismissableLayer converts this into an outside-click dismiss.
                  // Guard 300ms after open to absorb all synthetic events.
                  if (Date.now() - adaptOpenTimeRef.current < 300) e.preventDefault();
                }}
                onFocusOutside={(e) => {
                  // Guard the same window for focus-outside (second Radix dismiss path).
                  if (Date.now() - adaptOpenTimeRef.current < 300) e.preventDefault();
                }}
              >
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1.5">Adapt recipe</p>
                <div className="space-y-0.5">
                  {ADAPT_ACTIONS.map(({ goal, icon, label }) => {
                    const checked = selectedGoals.has(goal);
                    return (
                      <button
                        key={goal}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${checked ? "bg-accent" : "hover:bg-accent/60"}`}
                        onClick={() => setSelectedGoals(prev => { const n = new Set(prev); checked ? n.delete(goal) : n.add(goal); return n; })}
                        data-testid={`adapt-option-${goal}`}
                      >
                        <div className={`flex items-center justify-center h-4 w-4 rounded border shrink-0 ${checked ? "bg-primary border-primary" : "border-input"}`}>
                          {checked && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                        </div>
                        <span className="text-muted-foreground shrink-0">{icon}</span>
                        <span className="text-xs">{label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 pt-2 border-t border-border/50">
                  <Button size="sm" className="w-full text-xs" disabled={selectedGoals.size === 0} onClick={applyAdaptations} data-testid="button-adapt-apply">
                    <Wand2 className="h-3.5 w-3.5 mr-1" />
                    Apply{selectedGoals.size > 1 ? ` (${selectedGoals.size})` : ""}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <div className="w-px h-4 bg-[var(--realm-border)]" />
            <Button size="sm" variant="outline" className="border-0 px-2.5 text-xs realm-banner-btn-danger" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} data-testid="button-delete-meal">
              {deleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
              Delete
            </Button>
          </div>
        </div>
      }
    />
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 main-safe"
    >
      {isEditedCopy && isEditing && (
        <div className="mb-4 flex items-center gap-2">
          <Input
            value={editName}
            onChange={(e) => { setEditName(e.target.value); markChanged(); }}
            className="text-2xl font-semibold tracking-tight flex-1 border-dashed"
            data-testid="input-edit-name"
          />
          <Badge variant="secondary" className="text-xs shrink-0" data-testid="badge-edited-copy">
            <Pencil className="h-3 w-3 mr-1" />
            Edited copy
          </Badge>
        </div>
      )}

      {adaptResults.length > 0 && (
        <div className="space-y-3 mb-5" data-testid="section-adapt-results">
          {adaptResults.map(({ goal, result }) => {
            const action = ADAPT_ACTIONS.find(a => a.goal === goal);
            return (
              <Card key={goal} className="border-muted" data-testid={`card-adapt-result-${goal}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground shrink-0">{action?.icon}</span>
                      <p className="text-sm font-medium">{result.explanation}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 -mt-0.5" onClick={() => setAdaptResults(r => r.filter(x => x.goal !== goal))}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {(result.costChange || result.prepTimeChangeDelta != null) && (
                    <div className="flex gap-3 mb-3 text-xs text-muted-foreground">
                      {result.costChange && result.costChange !== "same" && (
                        <span>Cost: <span className={result.costChange === "lower" ? "text-green-600" : "text-amber-600"}>{result.costChange === "lower" ? "likely lower" : "likely higher"}</span></span>
                      )}
                      {result.prepTimeChangeDelta != null && result.prepTimeChangeDelta !== 0 && (
                        <span>Time: <span className="text-green-600">~{Math.abs(result.prepTimeChangeDelta)} min saved</span></span>
                      )}
                    </div>
                  )}
                  {result.changedIngredients.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No ingredient changes needed.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {result.changedIngredients.map((c, i) => (
                        <div key={i} className="text-xs">
                          <span className="line-through text-muted-foreground">{c.original}</span>
                          <span className="mx-1.5 text-muted-foreground">→</span>
                          <span className="font-medium">{c.replacement}</span>
                          <span className="ml-1.5 text-muted-foreground">({c.reason})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Trust Screen Sections - Phase 1 */}
      <div className={`${density === "compact" ? "space-y-3" : density === "comfortable" ? "space-y-4" : "space-y-6"} mb-8`}>
        <MealTrustSummary
          meal={meal}
          mealDiets={mealDiets}
          allDiets={allDiets}
          allergens={allergens}
          density={density}
        />
        <MealFamilyConfidence
          householdCompatibilityPercent={undefined}
          substitutionCount={undefined}
          weeklyReuseFourWeeks={undefined}
          density={density}
        />
        <HouseholdAdaptationsSummary
          meal={meal}
          adaptations={undefined}
          density={density}
        />
        <SimplyBetterChoicesPanel
          mealName={meal.name}
          upliftMatches={[]}
          density={density}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-1">
          {meal.imageUrl ? (
            <img
              src={meal.imageUrl}
              alt={meal.name}
              className="w-full rounded-md object-cover aspect-square"
              data-testid="img-meal"
            />
          ) : (
            <div className="w-full rounded-md bg-muted flex items-center justify-center aspect-square" data-testid="img-meal-placeholder">
              <ChefHat className="h-16 w-16 text-muted-foreground" />
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            {category && (
              <Badge variant="secondary" data-testid="badge-category">
                {CatIcon && <CatIcon className={`h-3 w-3 mr-1 ${getCategoryColor(category.name)}`} />}
                {category.name}
              </Badge>
            )}
            {isEditedCopy && isEditing ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" data-testid="badge-servings-edit" className="gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-4 w-4"
                    onClick={() => { setEditServings(Math.max(1, editServings - 1)); markChanged(); }}
                    data-testid="button-servings-minus"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span>{editServings} serving{editServings > 1 ? 's' : ''}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-4 w-4"
                    onClick={() => { setEditServings(editServings + 1); markChanged(); }}
                    data-testid="button-servings-plus"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </Badge>
              </div>
            ) : (
              meal.servings && (
                <div className="flex items-center gap-0.5 border rounded-full px-1.5 py-0.5 text-xs" data-testid="control-view-servings">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5"
                    onClick={() => { const n = Math.max(1, viewServings - 1); setViewServings(n); setViewServingsRaw(String(n)); }}
                    data-testid="button-view-servings-minus"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={viewServingsRaw}
                    onChange={e => setViewServingsRaw(e.target.value)}
                    onBlur={() => {
                      const n = parseInt(viewServingsRaw, 10);
                      const safe = !isNaN(n) && n >= 1 && n <= 100 ? n : viewServings;
                      setViewServings(safe);
                      setViewServingsRaw(String(safe));
                    }}
                    className="w-7 text-center bg-transparent border-none outline-none text-xs font-medium"
                    data-testid="input-view-servings"
                  />
                  <span className="text-muted-foreground pr-1">serving{viewServings !== 1 ? 's' : ''}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5"
                    onClick={() => { const n = Math.min(100, viewServings + 1); setViewServings(n); setViewServingsRaw(String(n)); }}
                    data-testid="button-view-servings-plus"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              )
            )}
            {dietNames.map((name) => (
              <Badge key={name} variant="outline" data-testid={`badge-diet-${name}`}>
                {name}
              </Badge>
            ))}
          </div>

          {allergens.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Allergens
              </p>
              <div className="flex flex-wrap gap-1">
                {allergens.map((a) => (
                  <Badge key={a.id} variant="destructive" className="text-xs" data-testid={`badge-allergen-${a.allergen}`}>
                    {a.allergen}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {nutritionData && (nutritionData.calories || nutritionData.protein) && (
            <Card className="mt-4">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold" data-testid="text-nutrition-header">Nutrition (per serving)</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Calories', value: nutritionData.calories, icon: Flame, color: 'text-orange-500', testId: 'text-nutrition-calories' },
                    { label: 'Protein', value: nutritionData.protein, icon: Beef, color: 'text-red-500', testId: 'text-nutrition-protein' },
                    { label: 'Carbs', value: nutritionData.carbs, icon: Wheat, color: 'text-amber-600', testId: 'text-nutrition-carbs' },
                    { label: 'Fat', value: nutritionData.fat, icon: Droplets, color: 'text-yellow-500', testId: 'text-nutrition-fat' },
                    { label: 'Sugar', value: nutritionData.sugar, icon: Cookie, color: 'text-pink-500', testId: 'text-nutrition-sugar' },
                    { label: 'Salt', value: nutritionData.salt, icon: Droplet, color: 'text-blue-500', testId: 'text-nutrition-salt' },
                  ].map(({ label, value, icon: Icon, color, testId }) => (
                    <div key={label} className="flex items-center gap-2 p-2 rounded-md bg-muted/50" data-testid={testId}>
                      <Icon className={`h-4 w-4 ${color} shrink-0`} />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm font-medium">{value || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {(nutritionData.source === 'openfoodfacts_estimated' || nutritionData.source === 'openfoodfacts_quantities') && (
                  <p className="text-[11px] text-muted-foreground/60 leading-snug" data-testid="text-nutrition-estimated-note">
                    Estimated from available ingredient quantities
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-lg font-semibold" data-testid="text-ingredients-heading">Ingredients</h2>
                {isEditedCopy && isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addIngredient}
                    data-testid="button-add-ingredient"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add
                  </Button>
                )}
              </div>
              {isEditedCopy && isEditing ? (
                <div className="space-y-2">
                  {editIngredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center gap-2" data-testid={`edit-ingredient-${idx}`}>
                      <span className="text-primary shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                      <Input
                        value={ing}
                        onChange={(e) => updateIngredient(idx, e.target.value)}
                        className="flex-1 text-sm border-dashed"
                        data-testid={`input-ingredient-${idx}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="shrink-0 text-muted-foreground"
                        onClick={() => removeIngredient(idx)}
                        data-testid={`button-remove-ingredient-${idx}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : isGrouped && groupedSources ? (
                <div className="space-y-4" data-testid="section-grouped-ingredients">
                  {Object.entries(groupedSources.sources).map(([label, src]) => {
                    const componentMeal = (src.type === "web" || src.type === "my-meal") && src.mealId
                      ? allMeals.find(m => m.id === src.mealId)
                      : null;
                    return (
                      <div key={label} data-testid={`group-ingredients-${label}`}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{label}</p>
                        {componentMeal && componentMeal.ingredients.length > 0 ? (
                          <ul className="space-y-1 pl-1">
                            {componentMeal.ingredients.map((ing, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <span className="text-primary mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                                <span>{ing}</span>
                              </li>
                            ))}
                          </ul>
                        ) : src.type === "basic" || src.type === "fresh" || src.type === "frozen" ? (
                          <ul className="space-y-1 pl-1">
                            <li className="text-sm flex items-start gap-2">
                              <span className="text-primary mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                              <span>{label}</span>
                            </li>
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground italic pl-1">No ingredients saved</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <ul className="space-y-2">
                  {displayIngredients.map((ing, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2" data-testid={`text-ingredient-${idx}`}>
                      <span className="text-primary mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-lg font-semibold" data-testid="text-instructions-heading">Instructions</h2>
                <div className="flex items-center gap-1">
                  {isEditedCopy && isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={addInstruction}
                      data-testid="button-add-instruction"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add
                    </Button>
                  )}
                  {!isGrouped && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setReimportUrl(meal.sourceUrl || ""); setReimportOpen(true); }}
                      data-testid="button-reimport-instructions"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      {hasNoInstructions && !(isEditedCopy && isEditing) ? "Import" : "Re-import"}
                    </Button>
                  )}
                </div>
              </div>
              {isEditedCopy && isEditing ? (
                editInstructions.length > 0 ? (
                  <div className="space-y-3">
                    {editInstructions.map((step, idx) => (
                      <div key={idx} className="flex gap-2 items-start" data-testid={`edit-instruction-${idx}`}>
                        <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center mt-2">
                          {idx + 1}
                        </span>
                        <Textarea
                          value={step}
                          onChange={(e) => updateInstruction(idx, e.target.value)}
                          className="flex-1 text-sm border-dashed min-h-[60px] resize-none"
                          data-testid={`input-instruction-${idx}`}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="shrink-0 text-muted-foreground mt-2"
                          onClick={() => removeInstruction(idx)}
                          data-testid={`button-remove-instruction-${idx}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2" data-testid="text-no-instructions">No instructions yet.</p>
                    <Button variant="outline" size="sm" onClick={addInstruction} data-testid="button-add-first-instruction">
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add a step
                    </Button>
                  </div>
                )
              ) : isGrouped && groupedSources ? (
                <div data-testid="section-grouped-method">
                  {(() => {
                    const webEntries = Object.entries(groupedSources.sources).filter(([, s]) =>
                      s.type !== "basic" && s.type !== "fresh" && s.type !== "frozen"
                    );
                    if (webEntries.length === 0) {
                      return <p className="text-sm text-muted-foreground">No method steps - all components are fresh/frozen ingredients.</p>;
                    }
                    const schedule = generateSchedule(groupedSources.sources, componentDurations, serveTime);
                    const serveLabel = minsToTimeStr((() => { const [h,m] = serveTime.split(":").map(Number); return h*60+(m||0); })());
                    return (
                      <>
                        <div className="flex gap-1 mb-4 border-b pb-3">
                          <button
                            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${methodView === "component" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                            onClick={() => setMethodView("component")}
                            data-testid="button-view-component"
                          >
                            By component
                          </button>
                          <button
                            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${methodView === "full" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                            onClick={() => setMethodView("full")}
                            data-testid="button-view-full"
                          >
                            Full method
                          </button>
                          <button
                            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors flex items-center gap-1 ${methodView === "timing" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                            onClick={() => setMethodView("timing")}
                            data-testid="button-view-timing"
                          >
                            <AlarmClock className="h-3 w-3" />
                            Timing
                          </button>
                        </div>

                        {methodView === "component" && (
                          <div>
                            <div className="flex gap-1 flex-wrap mb-4">
                              {webEntries.map(([label]) => (
                                <button
                                  key={label}
                                  onClick={() => setActiveComponent(label)}
                                  data-testid={`tab-component-${label}`}
                                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${activeComponent === label ? "bg-primary/10 border-primary text-primary font-semibold" : "border-border text-muted-foreground hover:border-primary/40"}`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                            {webEntries.filter(([label]) => label === activeComponent).map(([label, src]) => {
                              const componentMeal = (src.type === "web" || src.type === "my-meal") && src.mealId
                                ? allMeals.find(m => m.id === src.mealId) : null;
                              return (
                                <div key={label}>
                                  {componentMeal && componentMeal.instructions && componentMeal.instructions.length > 0 ? (
                                    <ol className="space-y-2">
                                      {componentMeal.instructions.map((step, i) => (
                                        <li key={i} className="text-sm flex gap-3">
                                          <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                                          <span className="flex-1 leading-relaxed">{step}</span>
                                        </li>
                                      ))}
                                    </ol>
                                  ) : (
                                    <p className="text-sm text-muted-foreground italic">No method saved for {label}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {methodView === "full" && (
                          <div className="space-y-5">
                            {webEntries.map(([label, src]) => {
                              const componentMeal = (src.type === "web" || src.type === "my-meal") && src.mealId
                                ? allMeals.find(m => m.id === src.mealId) : null;
                              return (
                                <div key={label} data-testid={`group-method-${label}`}>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{label}</p>
                                  {componentMeal && componentMeal.instructions && componentMeal.instructions.length > 0 ? (
                                    <ol className="space-y-2">
                                      {componentMeal.instructions.map((step, i) => (
                                        <li key={i} className="text-sm flex gap-3">
                                          <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                                          <span className="flex-1 leading-relaxed">{step}</span>
                                        </li>
                                      ))}
                                    </ol>
                                  ) : (
                                    <p className="text-sm text-muted-foreground italic">No method saved</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {methodView === "timing" && (
                          <div className="space-y-5">
                            <div className="flex items-center gap-3">
                              <label className="text-sm font-medium shrink-0">Serve time</label>
                              <input
                                type="time"
                                value={serveTime}
                                onChange={e => setServeTime(e.target.value)}
                                className="border border-border rounded-md px-2 py-1 text-sm bg-background"
                                data-testid="input-serve-time"
                              />
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">How long does each part take?</p>
                              {Object.entries(groupedSources.sources).map(([label, src]) => (
                                <div key={label} className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xs text-muted-foreground shrink-0">
                                      {src.type === "fresh" ? "🥦" : src.type === "frozen" ? "❄️" : src.type === "basic" ? "🧂" : "📖"}
                                    </span>
                                    <span className="text-sm truncate">{label}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <input
                                      type="number"
                                      min={1}
                                      max={480}
                                      value={componentDurations[label] ?? 30}
                                      onChange={e => setComponentDurations(prev => ({ ...prev, [label]: Math.max(1, parseInt(e.target.value) || 30) }))}
                                      className="w-16 border border-border rounded-md px-2 py-1 text-sm bg-background text-right"
                                      data-testid={`input-duration-${label}`}
                                    />
                                    <span className="text-xs text-muted-foreground">min</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="border rounded-lg overflow-hidden" data-testid="section-schedule">
                              <div className="bg-muted/40 px-3 py-2 border-b">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cooking schedule</p>
                              </div>
                              <div className="divide-y">
                                {schedule.map((entry, i) => (
                                  <div key={i} className="flex items-center justify-between px-3 py-2.5" data-testid={`schedule-entry-${i}`}>
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                      <span className="text-sm font-medium tabular-nums">{entry.startTime}</span>
                                    </div>
                                    <span className="text-sm flex-1 mx-3">Start {entry.label}</span>
                                    <span className="text-xs text-muted-foreground shrink-0">{entry.duration} min</span>
                                  </div>
                                ))}
                                <div className="flex items-center gap-2 px-3 py-2.5 bg-primary/5">
                                  <AlarmClock className="h-3.5 w-3.5 text-primary shrink-0" />
                                  <span className="text-sm font-semibold tabular-nums text-primary">{serveLabel}</span>
                                  <span className="text-sm font-semibold text-primary flex-1 mx-1">Serve!</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                instructions.length > 0 ? (
                  <ol className="space-y-3">
                    {instructions.map((step, idx) => (
                      <li key={idx} className="text-sm flex gap-3" data-testid={`text-instruction-${idx}`}>
                        <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="flex-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground" data-testid="text-no-instructions">No instructions available. Use the Import button above to fetch them from the recipe URL.</p>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {isEditedCopy && isEditing && hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="shadow-lg"
            data-testid="button-save-floating"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save Changes
          </Button>
        </div>
      )}

      <Dialog open={reimportOpen} onOpenChange={setReimportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{hasNoInstructions ? "Import Instructions" : "Re-import Instructions"}</DialogTitle>
            <DialogDescription>
              Paste the original recipe URL to fetch the method/instructions for this meal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="https://www.bbcgoodfood.com/recipes/..."
              value={reimportUrl}
              onChange={(e) => setReimportUrl(e.target.value)}
              data-testid="input-reimport-url"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReimportOpen(false)} data-testid="button-reimport-cancel">
                Cancel
              </Button>
              <Button
                onClick={() => reimportMutation.mutate(reimportUrl)}
                disabled={!reimportUrl.trim() || reimportMutation.isPending}
                data-testid="button-reimport-submit"
              >
                {reimportMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {hasNoInstructions ? "Import Instructions" : "Re-import Instructions"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
    </>
  );
}
