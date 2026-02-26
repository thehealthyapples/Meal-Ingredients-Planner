import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Calendar, Sparkles, Copy, Loader2, ChefHat, X, UtensilsCrossed, ShoppingCart, Leaf, Flame, Users, Search, Globe, Import, Lock, RefreshCw, DollarSign, Shield, Fish, Beef, Salad, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, buildUrl } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Meal, MealPlan, MealPlanEntry, Diet, MealCategory } from "@shared/schema";
import { getCategoryIcon, getCategoryColor } from "@/lib/category-utils";

interface ExternalRecipe {
  id: string;
  name: string;
  image: string | null;
  url: string | null;
  category: string | null;
  cuisine: string | null;
  ingredients: string[];
  source: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const SLOT_LABELS: Record<string, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
const SLOT_ICONS: Record<string, string> = { breakfast: 'sunrise', lunch: 'sun', dinner: 'moon', snack: 'cookie' };

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`;
}

interface SuggestionEntry {
  dayOfWeek: number;
  day: string;
  slot: string;
  mealId: number;
  mealName: string;
  calories?: number;
}

interface SuggestionResult {
  suggestion: SuggestionEntry[];
  stats: {
    totalMeals: number;
    uniqueIngredients: number;
    sharedIngredients: string[];
    ingredientReuse: number;
    estimatedDailyCalories?: number;
    calorieTarget?: number;
  };
}

interface SmartCandidate {
  id: string | number;
  name: string;
  ingredients: string[];
  isExternal: boolean;
  source?: string;
  cuisine?: string;
  category?: string;
  estimatedCost?: number;
  estimatedUPFScore?: number;
  primaryProtein?: string;
  score: number;
  scoreBreakdown: Record<string, number>;
  imageUrl?: string;
}

interface MealExplanation {
  title: string;
  reasons: string[];
  scoreBreakdown: {
    healthScore: number;
    upfScore: number;
    budgetScore: number;
    preferenceMatch: number;
  };
}

interface SmartSuggestEntry {
  dayOfWeek: number;
  day: string;
  slot: string;
  candidate: SmartCandidate;
  locked: boolean;
  explanation?: MealExplanation;
}

interface SmartSuggestResult {
  entries: SmartSuggestEntry[];
  stats: {
    totalMeals: number;
    externalMeals: number;
    userMeals: number;
    estimatedWeeklyCost: number;
    averageUPFScore: number;
    proteinDistribution: Record<string, number>;
    ingredientReuse: number;
    uniqueIngredients: number;
    sharedIngredients: string[];
  };
}

export default function MealPlannerPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [suggestDialogOpen, setSuggestDialogOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [dupName, setDupName] = useState("");
  const [suggestion, setSuggestion] = useState<SuggestionResult | null>(null);
  const [suggestDietId, setSuggestDietId] = useState<number | undefined>(undefined);
  const [dietFromProfile, setDietFromProfile] = useState(false);
  const dietAutoSetRef = useRef(false);
  const [calorieTarget, setCalorieTarget] = useState<string>("");
  const [peopleCount, setPeopleCount] = useState<string>("1");
  const [recipeSearchQuery, setRecipeSearchQuery] = useState("");
  const [recipeResults, setRecipeResults] = useState<ExternalRecipe[]>([]);
  const [recipeSearching, setRecipeSearching] = useState(false);
  const [, navigate] = useLocation();

  const [smartDialogOpen, setSmartDialogOpen] = useState(false);
  const [smartResult, setSmartResult] = useState<SmartSuggestResult | null>(null);
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartControlsOpen, setSmartControlsOpen] = useState(false);
  const [smartMealsPerDay, setSmartMealsPerDay] = useState("3");
  const [smartCuisine, setSmartCuisine] = useState("");
  const [smartBudget, setSmartBudget] = useState("");
  const [smartMaxUPF, setSmartMaxUPF] = useState("");
  const [smartFishPerWeek, setSmartFishPerWeek] = useState("2");
  const [smartRedMeatPerWeek, setSmartRedMeatPerWeek] = useState("3");
  const [smartVegDays, setSmartVegDays] = useState(false);
  const [smartLeftovers, setSmartLeftovers] = useState(false);
  const [lockedEntries, setLockedEntries] = useState<Set<string>>(new Set());
  const [expandedExplanation, setExpandedExplanation] = useState<string | null>(null);

  const { data: plans = [], isLoading: plansLoading } = useQuery<MealPlan[]>({
    queryKey: ['/api/meal-plans'],
  });

  const { data: meals = [] } = useQuery<Meal[]>({
    queryKey: [api.meals.list.path],
  });

  const { data: allDiets = [] } = useQuery<Diet[]>({
    queryKey: ['/api/diets'],
  });

  const { data: plannerUserPrefs } = useQuery<{ dietTypes?: string[] }>({
    queryKey: ['/api/user/preferences'],
    retry: false,
  });

  useEffect(() => {
    if (dietAutoSetRef.current) return;
    if (!plannerUserPrefs || allDiets.length === 0) return;
    const dietTypes = plannerUserPrefs.dietTypes || [];
    if (dietTypes.length > 0) {
      const firstName = dietTypes[0].toLowerCase();
      const match = allDiets.find(d => d.name.toLowerCase() === firstName || firstName.includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(firstName));
      if (match) {
        setSuggestDietId(match.id);
        setDietFromProfile(true);
      }
    }
    dietAutoSetRef.current = true;
  }, [plannerUserPrefs, allDiets]);

  const { data: allCategories = [] } = useQuery<MealCategory[]>({
    queryKey: ['/api/categories'],
  });

  const { data: entries = [], isLoading: entriesLoading } = useQuery<MealPlanEntry[]>({
    queryKey: ['/api/meal-plans', selectedPlanId, 'entries'],
    queryFn: async () => {
      if (!selectedPlanId) return [];
      const url = buildUrl(api.mealPlans.getEntries.path, { id: selectedPlanId });
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedPlanId,
  });

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const createPlanMutation = useMutation({
    mutationFn: async (data: { name: string; weekStart: string }) => {
      const res = await apiRequest('POST', api.mealPlans.create.path, data);
      return res.json() as Promise<MealPlan>;
    },
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: ['/api/meal-plans'] });
      setSelectedPlanId(plan.id);
      setCreateDialogOpen(false);
      setNewPlanName("");
      toast({ title: "Plan created", description: "Your weekly meal plan is ready to fill." });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', buildUrl(api.mealPlans.delete.path, { id }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meal-plans'] });
      setSelectedPlanId(null);
      toast({ title: "Plan deleted" });
    },
  });

  const addEntryMutation = useMutation({
    mutationFn: async (data: { planId: number; dayOfWeek: number; slot: string; mealId: number; mealTemplateId?: number | null }) => {
      const url = buildUrl(api.mealPlans.addEntry.path, { id: data.planId });
      const res = await apiRequest('POST', url, {
        dayOfWeek: data.dayOfWeek,
        slot: data.slot,
        mealId: data.mealId,
        mealTemplateId: data.mealTemplateId || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meal-plans', selectedPlanId, 'entries'] });
    },
  });

  const removeEntryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', buildUrl(api.mealPlans.removeEntry.path, { id }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meal-plans', selectedPlanId, 'entries'] });
    },
  });

  const duplicatePlanMutation = useMutation({
    mutationFn: async (data: { id: number; weekStart: string; name: string }) => {
      const url = buildUrl(api.mealPlans.duplicate.path, { id: data.id });
      const res = await apiRequest('POST', url, { weekStart: data.weekStart, name: data.name });
      return res.json() as Promise<MealPlan>;
    },
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: ['/api/meal-plans'] });
      setSelectedPlanId(plan.id);
      setDuplicateDialogOpen(false);
      setDupName("");
      toast({ title: "Plan duplicated", description: "Meals have been copied to the new week." });
    },
  });

  const suggestMutation = useMutation({
    mutationFn: async () => {
      const body: { dietId?: number; calorieTarget?: number; peopleCount?: number } = {};
      if (suggestDietId) body.dietId = suggestDietId;
      const calNum = parseInt(calorieTarget);
      if (!isNaN(calNum) && calNum > 0) body.calorieTarget = calNum;
      const pplNum = parseInt(peopleCount);
      if (!isNaN(pplNum) && pplNum > 0) body.peopleCount = pplNum;
      const res = await apiRequest('POST', api.mealPlans.suggest.path, body);
      return res.json() as Promise<SuggestionResult>;
    },
    onSuccess: (data) => {
      setSuggestion(data);
      setSuggestDialogOpen(true);
    },
    onError: (err: Error) => {
      toast({ title: "Cannot generate suggestion", description: err.message, variant: "destructive" });
    },
  });

  const generateShoppingListMutation = useMutation({
    mutationFn: async (planId: number) => {
      const res = await apiRequest('POST', api.shoppingList.generateFromPlan.path, { planId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.sources.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.prices.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      toast({ title: "Basket created", description: "Ingredients from your plan have been added to your basket." });
      navigate("/analyse-basket");
    },
    onError: () => {
      toast({ title: "Failed to generate basket", variant: "destructive" });
    },
  });

  const addMealsToShoppingListMutation = useMutation({
    mutationFn: async (mealSelections: { mealId: number; count: number }[]) => {
      const res = await apiRequest('POST', api.shoppingList.generateFromMeals.path, { mealSelections });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.sources.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.prices.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      const count = variables.length;
      toast({ title: "Added to basket", description: `${count} meal${count > 1 ? 's' : ''} added to basket.` });
    },
    onError: () => {
      toast({ title: "Failed to add to basket", variant: "destructive" });
    },
  });

  const searchExternalRecipes = async () => {
    if (!recipeSearchQuery.trim()) return;
    setRecipeSearching(true);
    try {
      let url = `/api/search-recipes?q=${encodeURIComponent(recipeSearchQuery.trim())}&page=1`;
      if (suggestDietId) {
        const selectedDiet = allDiets.find(d => d.id === suggestDietId);
        if (selectedDiet) {
          url += `&diet=${encodeURIComponent(selectedDiet.name.toLowerCase())}`;
        }
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setRecipeResults(data.recipes || []);
    } catch {
      toast({ title: "Search failed", description: "Could not search for recipes. Try again.", variant: "destructive" });
    } finally {
      setRecipeSearching(false);
    }
  };

  const importRecipeMutation = useMutation({
    mutationFn: async (recipe: ExternalRecipe) => {
      let ingredients = recipe.ingredients;
      let instructions: string[] = (recipe as any).instructions || [];
      if (ingredients.length === 0 && recipe.url) {
        const importRes = await apiRequest('POST', api.import.recipe.path, { url: recipe.url });
        const importData = await importRes.json();
        ingredients = importData.ingredients || [];
        instructions = importData.instructions || [];
      }
      const mealData: { name: string; ingredients: string[]; instructions: string[]; imageUrl?: string } = {
        name: recipe.name,
        ingredients,
        instructions,
      };
      if (recipe.image) mealData.imageUrl = recipe.image;
      const res = await apiRequest('POST', api.meals.create.path, mealData);
      return res.json() as Promise<Meal>;
    },
    onSuccess: (meal) => {
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
      toast({ title: "Recipe imported!", description: `"${meal.name}" has been added to your meals.` });
    },
    onError: (err: Error) => {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    },
  });

  const applySuggestion = async () => {
    if (!suggestion || !selectedPlanId) return;
    for (const entry of suggestion.suggestion) {
      await addEntryMutation.mutateAsync({
        planId: selectedPlanId,
        dayOfWeek: entry.dayOfWeek,
        slot: entry.slot,
        mealId: entry.mealId,
      });
    }
    setSuggestDialogOpen(false);
    setSuggestion(null);
    toast({ title: "Plan updated", description: "Suggested meals have been added to your plan." });
  };

  const runSmartSuggest = async (preserveLocks = false) => {
    setSmartLoading(true);
    try {
      const locked: { dayOfWeek: number; slot: string; candidateId: string | number; candidateName: string }[] = [];
      if (preserveLocks && smartResult) {
        for (const entry of smartResult.entries) {
          const key = `${entry.dayOfWeek}-${entry.slot}`;
          if (lockedEntries.has(key)) {
            locked.push({
              dayOfWeek: entry.dayOfWeek,
              slot: entry.slot,
              candidateId: entry.candidate.id,
              candidateName: entry.candidate.name,
            });
          }
        }
      }
      const res = await apiRequest('POST', '/api/meal-plans/smart-suggest', {
        mealsPerDay: Number(smartMealsPerDay) || 3,
        includeLeftovers: smartLeftovers,
        maxWeeklyBudget: smartBudget ? Number(smartBudget) : undefined,
        maxWeeklyUPF: smartMaxUPF ? Number(smartMaxUPF) : undefined,
        preferredCuisine: smartCuisine || undefined,
        fishPerWeek: Number(smartFishPerWeek),
        redMeatPerWeek: Number(smartRedMeatPerWeek),
        vegetarianDays: smartVegDays,
        dietId: suggestDietId,
        calorieTarget: calorieTarget ? Number(calorieTarget) : undefined,
        peopleCount: Number(peopleCount) || 1,
        lockedEntries: locked.length > 0 ? locked : undefined,
      });
      const data = await res.json() as SmartSuggestResult;
      setSmartResult(data);
      if (!preserveLocks) setLockedEntries(new Set());
      setSmartDialogOpen(true);
      setSmartControlsOpen(false);
    } catch {
      toast({ title: "Smart suggestion failed", description: "Could not generate smart meal plan. Try again.", variant: "destructive" });
    } finally {
      setSmartLoading(false);
    }
  };

  const toggleLockEntry = (key: string) => {
    setLockedEntries(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const [applyingSmartPlan, setApplyingSmartPlan] = useState(false);

  const applySmartSuggestion = async () => {
    if (!smartResult || !selectedPlanId) return;
    setApplyingSmartPlan(true);
    let importedCount = 0;
    let failedCount = 0;
    try {
      for (const entry of smartResult.entries) {
        let mealId: number | null = null;
        let mealTemplateId: number | null = null;

        if (!entry.candidate.isExternal && typeof entry.candidate.id === 'number') {
          mealId = entry.candidate.id;
        } else if (entry.candidate.isExternal) {
          try {
            const importRes = await apiRequest('POST', '/api/smart-suggest/auto-import', {
              candidate: entry.candidate,
            });
            const imported = await importRes.json();
            mealId = imported.mealId;
            mealTemplateId = imported.mealTemplateId;
            importedCount++;
          } catch {
            failedCount++;
            continue;
          }
        }

        if (mealId) {
          await addEntryMutation.mutateAsync({
            planId: selectedPlanId,
            dayOfWeek: entry.dayOfWeek,
            slot: entry.slot,
            mealId,
            mealTemplateId,
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
      queryClient.invalidateQueries({ queryKey: ['/api/meal-plans', selectedPlanId, 'entries'] });
      setSmartDialogOpen(false);
      setSmartResult(null);
      const desc = importedCount > 0
        ? `${smartResult.entries.length - failedCount} meals added. ${importedCount} recipes auto-imported.${failedCount > 0 ? ` ${failedCount} could not be imported.` : ''}`
        : "All meals have been added to your plan.";
      toast({ title: "Smart plan applied", description: desc });
    } catch {
      toast({ title: "Error applying plan", variant: "destructive" });
    } finally {
      setApplyingSmartPlan(false);
    }
  };

  const getUPFColor = (score?: number) => {
    if (!score) return "text-muted-foreground";
    if (score <= 20) return "text-green-600 dark:text-green-400";
    if (score <= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getUPFLabel = (score?: number) => {
    if (!score) return "Unknown";
    if (score <= 20) return "Minimal";
    if (score <= 50) return "Moderate";
    return "High";
  };

  const getEntryForSlot = (dayOfWeek: number, slot: string): MealPlanEntry | undefined => {
    return entries.find(e => e.dayOfWeek === dayOfWeek && e.slot === slot);
  };

  const getMealById = (id: number): Meal | undefined => {
    return meals.find(m => m.id === id);
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight" data-testid="text-planner-title">Meal Planner</h1>
          <p className="text-sm text-muted-foreground mt-1">Plan your weekly meals and rotate recipes</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-plan">
                <Plus className="mr-2 h-4 w-4" />
                New Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Weekly Plan</DialogTitle>
                <DialogDescription>Start a new meal plan for the week.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Plan name (e.g. Week 1 Healthy)"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  data-testid="input-plan-name"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                <Button
                  disabled={!newPlanName.trim() || createPlanMutation.isPending}
                  onClick={() => createPlanMutation.mutate({
                    name: newPlanName.trim(),
                    weekStart: getWeekStart(new Date()),
                  })}
                  data-testid="button-submit-plan"
                >
                  {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {selectedPlanId && (
            <>
              <Button
                variant="outline"
                onClick={() => suggestMutation.mutate()}
                disabled={suggestMutation.isPending}
                data-testid="button-suggest-plan"
              >
                {suggestMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {suggestMutation.isPending ? "Generating..." : "Suggest Meals"}
              </Button>

              <Button
                variant="outline"
                onClick={() => setSmartControlsOpen(!smartControlsOpen)}
                disabled={smartLoading}
                data-testid="button-smart-suggest"
              >
                {smartLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4 text-primary" />
                )}
                {smartLoading ? "Generating..." : "Smart Suggest Week"}
              </Button>

              <Button
                variant="outline"
                onClick={() => generateShoppingListMutation.mutate(selectedPlanId)}
                disabled={generateShoppingListMutation.isPending || entries.length === 0}
                data-testid="button-generate-shopping-list"
              >
                {generateShoppingListMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="mr-2 h-4 w-4" />
                )}
                {generateShoppingListMutation.isPending ? "Generating..." : "Analyse Basket"}
              </Button>

              <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-duplicate-plan">
                    <Copy className="mr-2 h-4 w-4" />
                    Rotate to Next Week
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Duplicate Plan to Next Week</DialogTitle>
                    <DialogDescription>Copy all meals to a new weekly plan.</DialogDescription>
                  </DialogHeader>
                  <Input
                    placeholder="New plan name"
                    value={dupName}
                    onChange={(e) => setDupName(e.target.value)}
                    data-testid="input-duplicate-name"
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>Cancel</Button>
                    <Button
                      disabled={!dupName.trim() || duplicatePlanMutation.isPending}
                      onClick={() => {
                        if (!selectedPlan) return;
                        const nextWeek = new Date(selectedPlan.weekStart + 'T00:00:00');
                        nextWeek.setDate(nextWeek.getDate() + 7);
                        duplicatePlanMutation.mutate({
                          id: selectedPlan.id,
                          weekStart: nextWeek.toISOString().split('T')[0],
                          name: dupName.trim(),
                        });
                      }}
                      data-testid="button-submit-duplicate"
                    >
                      {duplicatePlanMutation.isPending ? "Duplicating..." : "Duplicate"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {plansLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No meal plans yet</h3>
          <p className="text-muted-foreground mb-4">Create a weekly plan to start organizing your meals.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-6 flex-wrap">
            {plans.map(plan => (
              <div key={plan.id} className="flex items-center gap-1">
                <Button
                  variant={selectedPlanId === plan.id ? "default" : "outline"}
                  onClick={() => setSelectedPlanId(plan.id)}
                  data-testid={`button-select-plan-${plan.id}`}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {plan.name}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deletePlanMutation.mutate(plan.id)}
                  data-testid={`button-delete-plan-${plan.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {smartControlsOpen && selectedPlanId && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <Card className="mb-6">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Smart Suggestion Controls
                    </CardTitle>
                    <Button size="icon" variant="ghost" onClick={() => setSmartControlsOpen(false)} data-testid="button-close-smart-controls">
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Meals per day</label>
                        <Select value={smartMealsPerDay} onValueChange={setSmartMealsPerDay}>
                          <SelectTrigger data-testid="select-meals-per-day">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 meal</SelectItem>
                            <SelectItem value="2">2 meals</SelectItem>
                            <SelectItem value="3">3 meals</SelectItem>
                            <SelectItem value="4">3 meals + snack</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Cuisine preference</label>
                        <Select value={smartCuisine || "any"} onValueChange={v => setSmartCuisine(v === "any" ? "" : v)}>
                          <SelectTrigger data-testid="select-cuisine">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any cuisine</SelectItem>
                            <SelectItem value="british">British</SelectItem>
                            <SelectItem value="italian">Italian</SelectItem>
                            <SelectItem value="mexican">Mexican</SelectItem>
                            <SelectItem value="indian">Indian</SelectItem>
                            <SelectItem value="chinese">Chinese</SelectItem>
                            <SelectItem value="japanese">Japanese</SelectItem>
                            <SelectItem value="thai">Thai</SelectItem>
                            <SelectItem value="mediterranean">Mediterranean</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Weekly budget
                        </label>
                        <Input
                          type="number"
                          placeholder="No limit"
                          value={smartBudget}
                          onChange={e => setSmartBudget(e.target.value)}
                          data-testid="input-smart-budget"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Max UPF score
                        </label>
                        <Input
                          type="number"
                          placeholder="No limit"
                          value={smartMaxUPF}
                          onChange={e => setSmartMaxUPF(e.target.value)}
                          data-testid="input-smart-upf"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Fish className="h-3 w-3" />
                          Fish per week
                        </label>
                        <Select value={smartFishPerWeek} onValueChange={setSmartFishPerWeek}>
                          <SelectTrigger data-testid="select-fish-per-week">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[0,1,2,3,4,5].map(n => (
                              <SelectItem key={n} value={String(n)}>{n} times</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Beef className="h-3 w-3" />
                          Red meat per week
                        </label>
                        <Select value={smartRedMeatPerWeek} onValueChange={setSmartRedMeatPerWeek}>
                          <SelectTrigger data-testid="select-red-meat-per-week">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[0,1,2,3,4,5].map(n => (
                              <SelectItem key={n} value={String(n)}>{n} times</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          Daily calorie target
                        </label>
                        <Input
                          type="number"
                          placeholder="Optional"
                          value={calorieTarget}
                          onChange={e => setCalorieTarget(e.target.value)}
                          data-testid="input-smart-calories"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          People
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={peopleCount}
                          onChange={e => setPeopleCount(e.target.value)}
                          data-testid="input-smart-people"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-6 mb-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="smart-veg-days"
                          checked={smartVegDays}
                          onCheckedChange={(c) => setSmartVegDays(!!c)}
                          data-testid="checkbox-veg-days"
                        />
                        <label htmlFor="smart-veg-days" className="text-sm flex items-center gap-1 cursor-pointer">
                          <Salad className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                          Include vegetarian days
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="smart-leftovers"
                          checked={smartLeftovers}
                          onCheckedChange={(c) => setSmartLeftovers(!!c)}
                          data-testid="checkbox-leftovers"
                        />
                        <label htmlFor="smart-leftovers" className="text-sm cursor-pointer">
                          Plan for leftovers
                        </label>
                      </div>
                      {allDiets.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="text-sm text-muted-foreground">Diet:</label>
                          <Select
                            value={suggestDietId ? String(suggestDietId) : "none"}
                            onValueChange={v => {
                              setSuggestDietId(v === "none" ? undefined : Number(v));
                              setDietFromProfile(false);
                            }}
                          >
                            <SelectTrigger className="w-[140px]" data-testid="select-smart-diet">
                              <SelectValue placeholder="Any" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Any diet</SelectItem>
                              {allDiets.map(d => (
                                <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {dietFromProfile && suggestDietId && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-700 border-green-400 dark:text-green-400" data-testid="badge-diet-from-profile">
                              from profile
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => runSmartSuggest()}
                      disabled={smartLoading}
                      data-testid="button-run-smart-suggest"
                    >
                      {smartLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      {smartLoading ? "Generating smart plan..." : "Generate Smart Plan"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {selectedPlan && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-4 flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold tracking-tight">{selectedPlan.name}</h2>
                <Badge variant="outline" className="text-xs">
                  {formatWeekLabel(selectedPlan.weekStart)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                {DAYS.map((day, dayIdx) => (
                  <Card key={day} className="min-h-[200px]" data-testid={`card-day-${dayIdx}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-center">{day}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 p-3">
                      {SLOTS.map(slot => {
                        const entry = getEntryForSlot(dayIdx, slot);
                        const meal = entry ? getMealById(entry.mealId) : undefined;

                        return (
                          <div key={slot} className="space-y-1" data-testid={`slot-${dayIdx}-${slot}`}>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                              {SLOT_LABELS[slot]}
                            </p>
                            {entry && meal ? (
                              <div className="flex items-center gap-1 p-1.5 rounded-md bg-primary/5 border border-primary/10 group/entry">
                                {(() => {
                                  const cat = allCategories.find(c => c.id === meal.categoryId);
                                  if (cat) {
                                    const CatIcon = getCategoryIcon(cat.name);
                                    return <CatIcon className={`h-3 w-3 shrink-0 ${getCategoryColor(cat.name)}`} />;
                                  }
                                  return null;
                                })()}
                                <span className="text-xs font-medium flex-1 truncate" data-testid={`text-entry-meal-${entry.id}`}>
                                  {meal.name}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 group-hover/entry:opacity-100 transition-opacity shrink-0"
                                  onClick={() => addMealsToShoppingListMutation.mutate([{ mealId: meal.id, count: 1 }])}
                                  disabled={addMealsToShoppingListMutation.isPending}
                                  data-testid={`button-entry-to-list-${entry.id}`}
                                >
                                  <ShoppingCart className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 group-hover/entry:opacity-100 transition-opacity shrink-0"
                                  onClick={() => removeEntryMutation.mutate(entry.id)}
                                  data-testid={`button-remove-entry-${entry.id}`}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Select
                                onValueChange={(mealId) => {
                                  const selectedMeal = meals?.find((m: any) => m.id === parseInt(mealId));
                                  addEntryMutation.mutate({
                                    planId: selectedPlan.id,
                                    dayOfWeek: dayIdx,
                                    slot,
                                    mealId: parseInt(mealId),
                                    mealTemplateId: selectedMeal?.mealTemplateId || undefined,
                                  });
                                }}
                              >
                                <SelectTrigger className="h-8 text-xs" data-testid={`select-meal-${dayIdx}-${slot}`}>
                                  <SelectValue placeholder="+ Add meal" />
                                </SelectTrigger>
                                <SelectContent>
                                  {meals.map(m => (
                                    <SelectItem key={m.id} value={String(m.id)} data-testid={`option-meal-${m.id}`}>
                                      {m.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        );
                      })}
                      {(() => {
                        const dayMeals = entries
                          .filter(e => e.dayOfWeek === dayIdx)
                          .map(e => ({ mealId: e.mealId, count: 1 }));
                        if (dayMeals.length === 0) return null;
                        return (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-1 text-xs gap-1"
                            onClick={() => addMealsToShoppingListMutation.mutate(dayMeals)}
                            disabled={addMealsToShoppingListMutation.isPending}
                            data-testid={`button-day-to-list-${dayIdx}`}
                          >
                            <ShoppingCart className="h-3 w-3" />
                            Add Day
                          </Button>
                        );
                      })()}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}


      {selectedPlanId && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Find Recipes Online
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 mb-4">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1.5">
                  <Search className="h-3 w-3" /> Search BBC Good Food & MealDB
                </label>
                <Input
                  placeholder="e.g. chicken curry, pasta, vegan soup..."
                  value={recipeSearchQuery}
                  onChange={(e) => setRecipeSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') searchExternalRecipes();
                  }}
                  data-testid="input-recipe-search"
                />
              </div>
              <Button
                onClick={searchExternalRecipes}
                disabled={recipeSearching || !recipeSearchQuery.trim()}
                data-testid="button-search-recipes"
              >
                {recipeSearching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Search
              </Button>
            </div>

            {recipeResults.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                {recipeResults.map((recipe) => (
                  <Card key={recipe.id} className="overflow-hidden" data-testid={`recipe-result-${recipe.id}`}>
                    <div className="flex gap-3 p-3">
                      {recipe.image && (
                        <img
                          src={recipe.image}
                          alt={recipe.name}
                          className="w-16 h-16 rounded-md object-cover shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={recipe.name}>{recipe.name}</p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">{recipe.source}</Badge>
                          {recipe.category && <Badge variant="secondary" className="text-[10px]">{recipe.category}</Badge>}
                          {recipe.cuisine && <Badge variant="secondary" className="text-[10px]">{recipe.cuisine}</Badge>}
                        </div>
                        {recipe.ingredients.length > 0 && (
                          <p className="text-[10px] text-muted-foreground mt-1 truncate">
                            {recipe.ingredients.length} ingredients
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="px-3 pb-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-1"
                        onClick={() => importRecipeMutation.mutate(recipe)}
                        disabled={importRecipeMutation.isPending}
                        data-testid={`button-import-recipe-${recipe.id}`}
                      >
                        <Import className="h-3 w-3" />
                        Import as Meal
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {recipeResults.length === 0 && !recipeSearching && recipeSearchQuery.trim() && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recipes found. Try different search terms.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={suggestDialogOpen} onOpenChange={setSuggestDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Suggested Weekly Plan
            </DialogTitle>
            <DialogDescription>
              Optimized for ingredient reuse to reduce waste and simplify shopping
            </DialogDescription>
          </DialogHeader>

          {suggestion && (
            <div className="space-y-4">
              <div className="flex gap-3 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {suggestion.stats.totalMeals} meals
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {suggestion.stats.uniqueIngredients} unique ingredients
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {suggestion.stats.ingredientReuse} shared ingredients
                </Badge>
                {suggestion.stats.estimatedDailyCalories && (
                  <Badge variant="secondary" className="text-xs">
                    ~{suggestion.stats.estimatedDailyCalories} kcal/day
                  </Badge>
                )}
                {suggestion.stats.calorieTarget && (
                  <Badge variant="outline" className="text-xs">
                    Target: {suggestion.stats.calorieTarget} kcal/day
                  </Badge>
                )}
              </div>

              {suggestion.stats.sharedIngredients.length > 0 && (
                <div className="p-3 rounded-md bg-primary/5 border border-primary/10">
                  <p className="text-xs font-semibold text-foreground mb-1.5">Common Ingredients:</p>
                  <div className="flex flex-wrap gap-1">
                    {suggestion.stats.sharedIngredients.map((ing, i) => (
                      <Badge key={i} variant="outline" className="text-xs capitalize">
                        {ing}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((day, dayIdx) => {
                  const dayEntries = suggestion.suggestion.filter(e => e.dayOfWeek === dayIdx);
                  if (dayEntries.length === 0) return null;
                  return (
                    <div key={day} className="space-y-1">
                      <p className="text-xs font-semibold text-center text-foreground">{day.slice(0, 3)}</p>
                      {dayEntries.map((entry, i) => (
                        <div key={i} className="p-1.5 rounded-md bg-muted/50 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase">{entry.slot}</p>
                          <p className="text-xs font-medium truncate" title={entry.mealName}>{entry.mealName}</p>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSuggestDialogOpen(false)}>Dismiss</Button>
                <Button
                  onClick={applySuggestion}
                  disabled={!selectedPlanId || addEntryMutation.isPending}
                  data-testid="button-apply-suggestion"
                >
                  {addEntryMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UtensilsCrossed className="mr-2 h-4 w-4" />
                  )}
                  Apply to Current Plan
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={smartDialogOpen} onOpenChange={setSmartDialogOpen}>
        <DialogContent className="sm:max-w-[95vw] lg:max-w-[1100px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Smart Weekly Plan
            </DialogTitle>
            <DialogDescription>
              Multi-factor optimized plan with external recipe discovery, protein tracking, and budget awareness
            </DialogDescription>
          </DialogHeader>

          {smartResult && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {smartResult.stats.totalMeals} meals
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {smartResult.stats.userMeals} your recipes
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {smartResult.stats.externalMeals} discovered
                </Badge>
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  ~{smartResult.stats.estimatedWeeklyCost.toFixed(2)}/week
                </Badge>
                <Badge variant="secondary" className={`text-xs ${getUPFColor(smartResult.stats.averageUPFScore)}`}>
                  <Shield className="h-3 w-3 mr-1" />
                  UPF: {getUPFLabel(smartResult.stats.averageUPFScore)}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {smartResult.stats.uniqueIngredients} ingredients
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {smartResult.stats.ingredientReuse} shared
                </Badge>
              </div>

              {Object.keys(smartResult.stats.proteinDistribution).length > 0 && (
                <div className="p-3 rounded-md bg-muted/50">
                  <p className="text-xs font-semibold text-foreground mb-1.5">Protein Distribution:</p>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(smartResult.stats.proteinDistribution).map(([protein, count]) => (
                      <Badge key={protein} variant="outline" className="text-xs capitalize">
                        {protein}: {count}x
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {smartResult.stats.sharedIngredients.length > 0 && (
                <div className="p-3 rounded-md bg-primary/5 border border-primary/10">
                  <p className="text-xs font-semibold text-foreground mb-1.5">Shared Ingredients (buy in bulk):</p>
                  <div className="flex flex-wrap gap-1">
                    {smartResult.stats.sharedIngredients.map((ing, i) => (
                      <Badge key={i} variant="outline" className="text-xs capitalize">
                        {ing}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {DAYS.map((day, dayIdx) => {
                  const dayEntries = smartResult.entries.filter(e => e.dayOfWeek === dayIdx);
                  if (dayEntries.length === 0) return null;
                  return (
                    <div key={day} className="space-y-1.5">
                      <p className="text-xs font-semibold text-center text-foreground">{day}</p>
                      {dayEntries.map((entry, i) => {
                        const entryKey = `${dayIdx}-${entry.slot}`;
                        const isLocked = lockedEntries.has(entryKey);
                        return (
                          <div
                            key={i}
                            className={`p-2 rounded-md text-center relative group ${
                              isLocked ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/50"
                            }`}
                            data-testid={`smart-entry-${dayIdx}-${entry.slot}`}
                          >
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{entry.slot}</p>
                            <p className="text-xs font-medium leading-snug" title={entry.candidate.name}>
                              {entry.candidate.name}
                            </p>
                            <div className="flex items-center justify-center gap-1 mt-0.5 flex-wrap">
                              {entry.candidate.isExternal && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 leading-tight">
                                  {entry.candidate.source || "web"}
                                </Badge>
                              )}
                              {entry.candidate.estimatedCost && (
                                <span className="text-[10px] text-muted-foreground">
                                  {entry.candidate.estimatedCost.toFixed(2)}
                                </span>
                              )}
                            </div>
                            {entry.candidate.estimatedUPFScore !== undefined && entry.candidate.estimatedUPFScore > 0 && (
                              <div className={`text-[10px] ${getUPFColor(entry.candidate.estimatedUPFScore)}`}>
                                UPF: {entry.candidate.estimatedUPFScore}
                              </div>
                            )}
                            {entry.explanation && entry.explanation.reasons.length > 0 && (
                              <button
                                className="mt-0.5 text-[9px] text-primary/70 flex items-center justify-center gap-0.5 w-full"
                                onClick={() => setExpandedExplanation(expandedExplanation === entryKey ? null : entryKey)}
                                data-testid={`button-why-${dayIdx}-${entry.slot}`}
                              >
                                <HelpCircle className="h-2.5 w-2.5" />
                                Why?
                                {expandedExplanation === entryKey ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                              </button>
                            )}
                            {expandedExplanation === entryKey && entry.explanation && (
                              <div className="mt-1 text-left space-y-0.5 bg-background/80 rounded p-1 border border-border/50">
                                {entry.explanation.reasons.map((reason, ri) => (
                                  <p key={ri} className="text-[9px] text-muted-foreground leading-tight">
                                    {reason}
                                  </p>
                                ))}
                              </div>
                            )}
                            <div className="absolute top-0.5 right-0.5 invisible group-hover:visible flex gap-0.5">
                              <button
                                className={`p-0.5 rounded ${isLocked ? "text-primary" : "text-muted-foreground"}`}
                                onClick={() => toggleLockEntry(entryKey)}
                                title={isLocked ? "Unlock" : "Lock"}
                                data-testid={`button-lock-${dayIdx}-${entry.slot}`}
                              >
                                <Lock className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              <DialogFooter className="flex-wrap gap-2">
                <Button variant="outline" onClick={() => setSmartDialogOpen(false)}>Dismiss</Button>
                <Button
                  variant="outline"
                  onClick={() => runSmartSuggest(true)}
                  disabled={smartLoading}
                  data-testid="button-regenerate-smart"
                >
                  {smartLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Regenerate {lockedEntries.size > 0 ? `(${lockedEntries.size} locked)` : ""}
                </Button>
                <Button
                  onClick={applySmartSuggestion}
                  disabled={!selectedPlanId || applyingSmartPlan}
                  data-testid="button-apply-smart-suggestion"
                >
                  {applyingSmartPlan ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UtensilsCrossed className="mr-2 h-4 w-4" />
                  )}
                  {applyingSmartPlan ? "Importing & Applying..." : "Apply to Plan"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
