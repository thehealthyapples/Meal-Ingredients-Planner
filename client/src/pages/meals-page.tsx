import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useMeals } from "@/hooks/use-meals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, X, Search, ChefHat, ImageOff, Flame, Beef, Wheat, Droplets, Activity, AlertTriangle, ArrowRight, Loader2, Sparkles, Cookie, Droplet, Leaf, LayoutGrid, List, Globe, Save, Download, ShoppingCart, Minus, ShoppingBasket, Check, Package, CalendarPlus, CalendarDays, Coffee, Sun, Moon, UtensilsCrossed, Snowflake, Microscope, Baby, PersonStanding, Wine, ExternalLink, Pencil } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertMealSchema, type InsertMeal, type Nutrition, type Diet, type MealDiet, type MealCategory, type FreezerMeal } from "@shared/schema";
import { getCategoryIcon, getCategoryColor } from "@/lib/category-utils";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { buildUrl, api } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useBasket } from "@/hooks/use-basket";
import { useLocation } from "wouter";
import { MealWatermark, getWatermarkType } from "@/components/meal-watermark";
import { default as AppleRating } from "@/components/AppleRating";

function parseIngredient(raw: string): { name: string; detail: string | null } {
  let text = raw.trim();
  const quantityPatterns = [
    /^(\d+[\d\/\s]*)\s*(cups?|tbsps?|tablespoons?|tsps?|teaspoons?|oz|ounces?|lbs?|pounds?|grams?|g|kg|ml|liters?|litres?|cloves?|slices?|pieces?|pinch(?:es)?|bunch(?:es)?|sprigs?|stalks?|cans?|packets?|heads?|handfuls?|dashes?)\s+(?:of\s+)?(.+)/i,
    /^(\d+[\d\/\s]*)\s+(.+)/,
    /^(a\s+(?:few|pinch|dash|handful)\s+(?:of\s+)?)(.+)/i,
  ];

  for (const pattern of quantityPatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match.length === 4) {
        const qty = match[1].trim();
        const unit = match[2].trim();
        let name = match[3].replace(/,\s*(chopped|diced|minced|sliced|crushed|grated|peeled|fresh|dried|ground|finely|coarsely|roughly|thinly|to taste|optional).*$/i, '').trim();
        name = name.charAt(0).toUpperCase() + name.slice(1);
        return { name, detail: `${qty} ${unit}` };
      } else if (match.length === 3) {
        let name = match[2].replace(/,\s*(chopped|diced|minced|sliced|crushed|grated|peeled|fresh|dried|ground|finely|coarsely|roughly|thinly|to taste|optional).*$/i, '').trim();
        name = name.charAt(0).toUpperCase() + name.slice(1);
        return { name, detail: match[1].trim() };
      }
    }
  }

  let name = text.replace(/,\s*(chopped|diced|minced|sliced|crushed|grated|peeled|fresh|dried|ground|finely|coarsely|roughly|thinly|to taste|optional).*$/i, '').trim();
  name = name.charAt(0).toUpperCase() + name.slice(1);
  return { name, detail: null };
}

function getDietFilterKey(name: string): string {
  const n = name.toLowerCase().replace(/[\s_]+/g, '-');
  if (n.includes('vegan')) return 'vegan';
  if (n.includes('vegetarian')) return 'vegetarian';
  if (n.includes('mediterranean')) return 'mediterranean';
  if (n.includes('dash')) return 'dash';
  if (n.includes('flexitarian')) return 'flexitarian';
  if (n.includes('mind')) return 'mind';
  if (n.includes('keto')) return 'keto';
  if (n.includes('paleo')) return 'paleo';
  if (n.includes('low-carb') || n.includes('atkins')) return 'low-carb';
  if (n.includes('intermittent')) return 'intermittent-fasting';
  if (n.includes('dairy')) return 'dairy-free';
  if (n.includes('gluten')) return 'gluten-free';
  return '';
}

const DIET_FILTER_OPTIONS = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'dash', label: 'DASH' },
  { value: 'flexitarian', label: 'Flexitarian' },
  { value: 'mind', label: 'MIND' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'low-carb', label: 'Low-Carb' },
  { value: 'gluten-free', label: 'Gluten-Free' },
  { value: 'dairy-free', label: 'Dairy-Free' },
];

function useViewPreference() {
  const [view, setView] = useState<'grid' | 'list'>(() => {
    try {
      return (localStorage.getItem('meals-view') as 'grid' | 'list') || 'grid';
    } catch {
      return 'grid';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('meals-view', view);
    } catch {}
  }, [view]);

  return [view, setView] as const;
}

interface AnalysisResult {
  nutrition: Nutrition;
  servings: number;
  allergens: string[];
  healthScore: number;
  swaps: { ingredient: string; original: string; healthier: string }[];
}

function HealthScoreRing({ score }: { score: number }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? 'text-green-500' : score >= 40 ? 'text-amber-500' : 'text-red-500';
  const strokeColor = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
          <circle cx="40" cy="40" r={radius} fill="none" stroke={strokeColor} strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${color}`} data-testid="text-health-score">{score}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground font-medium">Health Score</span>
    </div>
  );
}

function DietBadges({ mealId }: { mealId: number }) {
  const { data: mealDiets = [] } = useQuery<MealDiet[]>({
    queryKey: ['/api/meals', mealId, 'diets'],
    queryFn: async () => {
      const url = buildUrl(api.diets.getMealDiets.path, { id: mealId });
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: allDiets = [], isLoading: dietsLoading } = useQuery<Diet[]>({
    queryKey: ['/api/diets'],
  });

  if (mealDiets.length === 0 || dietsLoading || allDiets.length === 0) return null;

  const dietNames = mealDiets.map(md => {
    const diet = allDiets.find(d => d.id === md.dietId);
    return diet?.name;
  }).filter(Boolean);

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {dietNames.map(name => (
        <Badge key={name} variant="outline" className="text-xs font-normal gap-1 border-green-500/30 text-green-700 dark:text-green-400" data-testid={`badge-diet-${name}`}>
          <Leaf className="h-3 w-3" />
          {name}
        </Badge>
      ))}
    </div>
  );
}

function NutritionBadges({ mealId, nutrition }: { mealId: number; nutrition?: Nutrition | null }) {
  if (!nutrition) return null;

  const items = [
    { label: 'Calories', value: nutrition.calories, icon: Flame, color: 'text-orange-500' },
    { label: 'Protein', value: nutrition.protein, icon: Beef, color: 'text-red-500' },
    { label: 'Carbs', value: nutrition.carbs, icon: Wheat, color: 'text-amber-600' },
    { label: 'Fat', value: nutrition.fat, icon: Droplets, color: 'text-yellow-500' },
    { label: 'Sugar', value: nutrition.sugar, icon: Cookie, color: 'text-pink-500' },
    { label: 'Salt', value: nutrition.salt, icon: Droplet, color: 'text-blue-500' },
  ];

  const hasAny = items.some(i => i.value);
  if (!hasAny) return null;

  return (
    <div className="mt-3 space-y-1.5">
      <h4 className="text-xs font-semibold text-muted-foreground" data-testid={`text-nutrition-widget-header-${mealId}`}>Nutrition (per serving)</h4>
      <div className="grid grid-cols-3 gap-1.5">
        {items.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-1 rounded-md bg-muted/50 px-1.5 py-0.5" data-testid={`text-nutrition-widget-${label.toLowerCase()}-${mealId}`}>
            <Icon className={`h-3 w-3 flex-shrink-0 ${color}`} />
            <span className="text-[11px] font-medium truncate">{value || 'N/A'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisResultContent({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-6">
        <HealthScoreRing score={analysis.healthScore} />
        <div className="flex-1 space-y-3">
          <h4 className="text-sm font-semibold text-foreground" data-testid="text-per-serving-header">Nutrition (per serving)</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Calories', value: analysis.nutrition.calories, icon: Flame, color: 'text-orange-500' },
              { label: 'Protein', value: analysis.nutrition.protein, icon: Beef, color: 'text-red-500' },
              { label: 'Carbs', value: analysis.nutrition.carbs, icon: Wheat, color: 'text-amber-600' },
              { label: 'Fat', value: analysis.nutrition.fat, icon: Droplets, color: 'text-yellow-500' },
              { label: 'Sugar', value: analysis.nutrition.sugar, icon: Cookie, color: 'text-pink-500' },
              { label: 'Salt', value: analysis.nutrition.salt, icon: Droplet, color: 'text-blue-500' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                <Icon className={`h-4 w-4 ${color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium" data-testid={`text-nutrition-${label.toLowerCase()}`}>{value || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {analysis.allergens.length > 0 && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h4 className="text-sm font-semibold text-destructive" data-testid="text-allergen-warning">
              Contains: {analysis.allergens.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')}
            </h4>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {analysis.allergens.map(a => (
              <Badge key={a} variant="destructive" className="text-xs" data-testid={`badge-allergen-${a}`}>
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {analysis.swaps.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-green-500" />
            Healthier Alternatives
          </h4>
          <div className="space-y-2">
            {analysis.swaps.map((swap, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-green-500/5 border border-green-500/10" data-testid={`swap-suggestion-${i}`}>
                <Badge variant="secondary" className="text-xs">{swap.original}</Badge>
                <ArrowRight className="h-3 w-3 text-green-500 shrink-0" />
                <Badge variant="outline" className="text-xs border-green-500/30 text-green-700 dark:text-green-400">{swap.healthier}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.allergens.length === 0 && (
        <p className="text-sm text-muted-foreground flex items-center gap-2" data-testid="text-no-allergens">
          No common allergens detected in this meal.
        </p>
      )}
      {analysis.swaps.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No healthier ingredient swaps found. This meal already uses great ingredients.
        </p>
      )}
    </div>
  );
}

function IngredientBadge({ ingredient, mealId, index }: { ingredient: string; mealId: number; index: number }) {
  const parsed = parseIngredient(ingredient);
  return (
    <Badge
      variant="secondary"
      className="text-xs font-normal gap-1"
      data-testid={`badge-ingredient-${mealId}-${index}`}
    >
      <span>{parsed.name}</span>
      {parsed.detail && (
        <span className="text-muted-foreground font-normal">({parsed.detail})</span>
      )}
    </Badge>
  );
}

function CategoryBadge({ categoryId, categories }: { categoryId: number | null; categories: MealCategory[] }) {
  if (!categoryId) return null;
  const cat = categories.find(c => c.id === categoryId);
  if (!cat) return null;
  const Icon = getCategoryIcon(cat.name);
  const color = getCategoryColor(cat.name);
  return (
    <Badge variant="outline" className={`text-xs font-normal gap-1 ${color}`} data-testid={`badge-category-${cat.name}`}>
      <Icon className="h-3 w-3" />
      {cat.name}
    </Badge>
  );
}

function MealActionBar({ mealId, mealName, ingredients, isReadyMeal, isDrink, audience, isFreezerEligible, onFreezeClick, servings, sourceUrl }: {
  mealId: number;
  mealName: string;
  ingredients: string[];
  isReadyMeal: boolean;
  isDrink: boolean;
  audience: string;
  isFreezerEligible: boolean;
  onFreezeClick: () => void;
  servings?: number;
  sourceUrl?: string | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [qty, setQty] = useState(1);
  const { isMealInBasket, addToBasket } = useBasket();
  const inBasket = isMealInBasket(mealId);

  const editCopyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', buildUrl(api.meals.copy.path, { id: mealId }));
      return res.json() as Promise<{ id: number; name: string }>;
    },
    onSuccess: (newMeal) => {
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
      navigate(`/meals/${newMeal.id}`);
    },
    onError: () => {
      toast({ title: "Failed to create editable copy", variant: "destructive" });
    },
  });

  const addToListMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', api.shoppingList.generateFromMeals.path, {
        mealSelections: [{ mealId, count: qty }],
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.sources.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.prices.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      toast({ title: "Added to shopping list", description: `${qty}x ${mealName} added.` });
    },
    onError: () => {
      toast({ title: "Failed to add", description: "Could not add to shopping list.", variant: "destructive" });
    },
  });

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', api.analyze.meal.path, { mealId });
      return res.json() as Promise<AnalysisResult>;
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      setAnalysisOpen(true);
      queryClient.invalidateQueries({ queryKey: ['/api/meals', mealId, 'nutrition'] });
      toast({ title: "Analysis complete", description: "Nutrition data calculated." });
    },
    onError: () => {
      toast({ title: "Analysis failed", variant: "destructive" });
    },
  });

  const [plannerOpen, setPlannerOpen] = useState(false);

  return (
    <div className="w-full flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs font-semibold shrink-0 min-w-8"
                  data-testid={`button-qty-${mealId}`}
                >
                  {qty}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-12 p-1" align="start" side="top">
                <div className="flex flex-col gap-0.5">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <Button
                      key={n}
                      size="sm"
                      variant={n === qty ? "default" : "ghost"}
                      className="text-xs min-w-8"
                      onClick={(e) => { e.stopPropagation(); setQty(n); }}
                      data-testid={`button-qty-select-${mealId}-${n}`}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </TooltipTrigger>
          <TooltipContent><p className="text-xs">Quantity</p></TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-1 flex-1 justify-end">
          {servings != null && servings >= 1 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground px-1 shrink-0" data-testid={`text-servings-${mealId}`}>
                  <UtensilsCrossed className="h-3.5 w-3.5" />
                  <span className="font-medium">{servings}</span>
                </span>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">{servings === 1 ? '1 serving' : `${servings} servings`}</p></TooltipContent>
            </Tooltip>
          )}
          {sourceUrl && (
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`link-source-${mealId}`}
                >
                  <Button size="icon" variant="ghost" asChild>
                    <span><Globe className="h-4 w-4" /></span>
                  </Button>
                </a>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">View original recipe</p></TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  editCopyMutation.mutate();
                }}
                disabled={editCopyMutation.isPending}
                data-testid={`button-edit-recipe-${mealId}`}
              >
                {editCopyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Pencil className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">Edit recipe</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  addToBasket({ mealId, quantity: qty });
                  addToListMutation.mutate();
                }}
                disabled={addToListMutation.isPending}
                data-testid={`button-add-basket-${mealId}`}
              >
                {addToListMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingBasket className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">Add to shopping list</p></TooltipContent>
          </Tooltip>

        {!isReadyMeal && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); analyzeMutation.mutate(); }}
                disabled={analyzeMutation.isPending}
                data-testid={`button-analyze-meal-${mealId}`}
              >
                {analyzeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Microscope className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">Analyse</p></TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); setPlannerOpen(true); }}
              data-testid={`button-add-planner-${mealId}`}
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p className="text-xs">Add to planner</p></TooltipContent>
        </Tooltip>

        {isFreezerEligible && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="text-blue-400"
                onClick={(e) => { e.stopPropagation(); onFreezeClick(); }}
                data-testid={`button-freeze-${mealId}`}
              >
                <Snowflake className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">Add to freezer</p></TooltipContent>
          </Tooltip>
        )}
        </div>
      </div>

      <AddToPlannerDialog mealId={mealId} mealName={mealName} isDrink={isDrink} audience={audience} open={plannerOpen} onOpenChange={setPlannerOpen} />

      <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Meal Analysis
            </DialogTitle>
            <DialogDescription>
              Nutrition breakdown, allergen detection, and healthier suggestions
            </DialogDescription>
          </DialogHeader>
          {analysisResult && (
            <AnalysisResultContent analysis={analysisResult} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface PlannerWeekFull {
  id: number;
  userId: number;
  weekNumber: number;
  weekName: string;
  days: { id: number; weekId: number; dayOfWeek: number; entries: { id: number; mealType: string; audience: string; mealId: number; isDrink: boolean }[] }[];
}

const PLANNER_DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PLANNER_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const PLANNER_MEAL_SLOTS = [
  { key: "breakfast", label: "Breakfast", icon: Coffee },
  { key: "lunch", label: "Lunch", icon: Sun },
  { key: "dinner", label: "Dinner", icon: Moon },
  { key: "snacks", label: "Snack", icon: Cookie },
];

interface PlannerAssignment {
  weekName: string;
  dayName: string;
  slotLabel: string;
  dayId: number;
  mealType: string;
  audience: string;
  isDrink: boolean;
}

function AddToPlannerDialog({ mealId, mealName, isDrink, audience: mealAudience, open, onOpenChange }: {
  mealId: number;
  mealName: string;
  isDrink: boolean;
  audience: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [selectedWeeks, setSelectedWeeks] = useState<Set<number>>(new Set());
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: plannerWeeks = [] } = useQuery<PlannerWeekFull[]>({
    queryKey: ["/api/planner/full"],
    enabled: open,
  });

  const { data: plannerSettings } = useQuery<{
    enableBabyMeals: boolean;
    enableChildMeals: boolean;
    enableDrinks: boolean;
  }>({
    queryKey: ["/api/user/planner-settings"],
    enabled: open,
  });

  const enableBabyMeals = plannerSettings?.enableBabyMeals ?? false;
  const enableChildMeals = plannerSettings?.enableChildMeals ?? false;
  const enableDrinks = plannerSettings?.enableDrinks ?? false;

  const resolvedAudience = mealAudience === "baby" ? "baby" : mealAudience === "child" ? "child" : "adult";

  const availableSlots = useMemo(() => {
    if (isDrink) {
      return [{ key: "drinks", label: "Drinks", icon: Wine }];
    }
    return PLANNER_MEAL_SLOTS;
  }, [isDrink]);

  const assignments = useMemo(() => {
    if (selectedWeeks.size === 0 || selectedDays.size === 0 || selectedSlots.size === 0) return [];
    const result: PlannerAssignment[] = [];
    for (const week of plannerWeeks) {
      if (!selectedWeeks.has(week.id)) continue;
      for (const day of (week.days || [])) {
        if (!selectedDays.has(day.dayOfWeek)) continue;
        for (const slot of availableSlots) {
          if (!selectedSlots.has(slot.key)) continue;
          if (isDrink) {
            result.push({
              weekName: week.weekName,
              dayName: PLANNER_DAY_NAMES[day.dayOfWeek],
              slotLabel: "Drinks",
              dayId: day.id,
              mealType: "snacks",
              audience: "adult",
              isDrink: true,
            });
          } else {
            result.push({
              weekName: week.weekName,
              dayName: PLANNER_DAY_NAMES[day.dayOfWeek],
              slotLabel: slot.label,
              dayId: day.id,
              mealType: slot.key,
              audience: resolvedAudience,
              isDrink: false,
            });
          }
        }
      }
    }
    return result;
  }, [selectedWeeks, selectedDays, selectedSlots, plannerWeeks, availableSlots, isDrink, resolvedAudience]);

  const addMutation = useMutation({
    mutationFn: async () => {
      for (const a of assignments) {
        await apiRequest("PUT", `/api/planner/days/${a.dayId}/entries`, {
          mealType: a.mealType,
          audience: a.audience,
          mealId,
          isDrink: a.isDrink,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planner/full"] });
      resetState();
      toast({ title: "Added to planner", description: `"${mealName}" added to ${assignments.length} slot${assignments.length !== 1 ? 's' : ''}.` });
    },
    onError: () => {
      toast({ title: "Failed to add to planner", variant: "destructive" });
    },
  });

  const resetState = () => {
    onOpenChange(false);
    setSelectedWeeks(new Set());
    setSelectedDays(new Set());
    setSelectedSlots(new Set());
  };

  const audienceLabel = resolvedAudience === "baby" ? "Baby" : resolvedAudience === "child" ? "Child" : "";

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); else onOpenChange(v); }}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Add to Planner</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Assign <span className="font-medium text-foreground">{mealName}</span>
              {isDrink && <Badge variant="secondary" className="ml-1.5 text-[10px]"><Wine className="h-3 w-3 mr-0.5" />Drink</Badge>}
              {audienceLabel && <Badge variant="secondary" className="ml-1.5 text-[10px]">{audienceLabel}</Badge>}
              {" "}to one or more weeks, days{!isDrink && ", and meal slots"}.
            </p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4">
            {isDrink && !enableDrinks && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border border-border">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Drinks are currently disabled in your planner settings. Enable them in the planner to see drink slots.
                </p>
              </div>
            )}

            {resolvedAudience === "baby" && !enableBabyMeals && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border border-border">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Baby meal rows are currently disabled in your planner settings. Enable them in the planner to see baby slots.
                </p>
              </div>
            )}

            {resolvedAudience === "child" && !enableChildMeals && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border border-border">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Child meal rows are currently disabled in your planner settings. Enable them in the planner to see child slots.
                </p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Weeks</label>
                <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => {
                  if (selectedWeeks.size === plannerWeeks.length) setSelectedWeeks(new Set());
                  else setSelectedWeeks(new Set(plannerWeeks.map(w => w.id)));
                }} data-testid="button-toggle-all-weeks">
                  {selectedWeeks.size === plannerWeeks.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {plannerWeeks.slice().sort((a, b) => a.weekNumber - b.weekNumber).map((week) => (
                  <label key={week.id} className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover-elevate" data-testid={`label-week-${week.weekNumber}`}>
                    <Checkbox checked={selectedWeeks.has(week.id)} onCheckedChange={(checked) => {
                      setSelectedWeeks(prev => { const next = new Set(prev); checked ? next.add(week.id) : next.delete(week.id); return next; });
                    }} />
                    <span className="text-xs">{week.weekName}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Days</label>
                <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => {
                  if (selectedDays.size === 7) setSelectedDays(new Set());
                  else setSelectedDays(new Set(PLANNER_DAY_ORDER));
                }} data-testid="button-toggle-all-days">
                  {selectedDays.size === 7 ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {PLANNER_DAY_ORDER.map((dayIdx) => (
                  <label key={dayIdx} className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover-elevate" data-testid={`label-day-${dayIdx}`}>
                    <Checkbox checked={selectedDays.has(dayIdx)} onCheckedChange={(checked) => {
                      setSelectedDays(prev => { const next = new Set(prev); checked ? next.add(dayIdx) : next.delete(dayIdx); return next; });
                    }} />
                    <span className="text-xs">{PLANNER_DAY_NAMES[dayIdx].slice(0, 3)}</span>
                  </label>
                ))}
              </div>
            </div>

            {!isDrink && (
              <div>
                <label className="text-sm font-medium mb-2 block">Meal Slots</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableSlots.map((slot) => {
                    const SlotIcon = slot.icon;
                    return (
                      <label key={slot.key} className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover-elevate" data-testid={`label-slot-${slot.key}`}>
                        <Checkbox checked={selectedSlots.has(slot.key)} onCheckedChange={(checked) => {
                          setSelectedSlots(prev => { const next = new Set(prev); checked ? next.add(slot.key) : next.delete(slot.key); return next; });
                        }} />
                        <SlotIcon className="h-3.5 w-3.5" />
                        <span className="text-xs">{slot.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {isDrink && (
              <div>
                <label className="text-sm font-medium mb-2 block">Slot</label>
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover-elevate flex-1" data-testid="label-slot-drinks">
                    <Checkbox checked={selectedSlots.has("drinks")} onCheckedChange={(checked) => {
                      setSelectedSlots(checked ? new Set(["drinks"]) : new Set());
                    }} />
                    <Wine className="h-3.5 w-3.5 text-purple-400" />
                    <span className="text-xs">Drinks</span>
                  </label>
                </div>
              </div>
            )}

            {assignments.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {assignments.length} slot{assignments.length !== 1 ? 's' : ''} will be assigned
                </label>
                <div className="rounded-md border border-border max-h-32 overflow-y-auto divide-y divide-border">
                  {assignments.map((a, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5 text-xs">
                      <span className="text-muted-foreground">{a.weekName}</span>
                      <span>{a.dayName} - {a.slotLabel}{a.audience !== "adult" ? ` (${a.audience})` : ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetState}>Cancel</Button>
            <Button
              disabled={assignments.length === 0 || addMutation.isPending}
              onClick={() => addMutation.mutate()}
              data-testid="button-confirm-add-planner"
            >
              {addMutation.isPending ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Assigning...</> : `Assign to ${assignments.length} slot${assignments.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface WebSearchRecipe {
  id: string;
  name: string;
  image: string;
  url: string | null;
  category: string | null;
  cuisine: string | null;
  ingredients: string[];
  instructions?: string[];
  source?: string;
}

interface ProductSearchResult {
  barcode: string | null;
  product_name: string;
  brand: string | null;
  image_url: string | null;
  ingredients_text: string | null;
  nutriments: {
    calories: string | null;
    protein: string | null;
    carbs: string | null;
    fat: string | null;
    sugar: string | null;
    salt: string | null;
  };
  nutriscore_grade: string | null;
  nova_group: number | null;
  categories_tags: string[];
  isUK?: boolean;
  nutriments_raw: Record<string, any> | null;
  analysis: any | null;
  upfAnalysis: {
    upfScore: number;
    smpRating: number;
    hasCape: boolean;
    smpScore: number;
    additiveMatches: any[];
    processingIndicators: string[];
    ingredientCount: number;
    upfIngredientCount: number;
    riskBreakdown: any;
  } | null;
  quantity: string | null;
  servingSize: string | null;
  categories: string | null;
}

const NUTRISCORE_COLORS: Record<string, string> = {
  a: 'bg-green-600 text-white',
  b: 'bg-lime-500 text-white',
  c: 'bg-yellow-400 text-black',
  d: 'bg-orange-500 text-white',
  e: 'bg-red-600 text-white',
};

const SOURCE_STYLES: Record<string, { className: string; label: string; logo?: string }> = {
  'TheMealDB': {
    className: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300',
    label: 'TheMealDB',
    logo: 'https://www.themealdb.com/images/logo-small.png',
  },
  'BBC Good Food': {
    className: 'bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-950/30 dark:border-teal-800 dark:text-teal-300',
    label: 'BBC Good Food',
    logo: 'https://images.immediate.co.uk/production/volatile/sites/30/2024/03/cropped-GF-new-teal-1-7004649-a80b70d.png?quality=90&resize=16,16',
  },
  'AllRecipes': {
    className: 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-300',
    label: 'AllRecipes',
  },
  'Jamie Oliver': {
    className: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300',
    label: 'Jamie Oliver',
  },
  'Serious Eats': {
    className: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300',
    label: 'Serious Eats',
  },
};

function WebSourceBadge({ recipe }: { recipe: WebSearchRecipe }) {
  const style = recipe.source ? SOURCE_STYLES[recipe.source] : null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {style && (
        <Badge
          variant="outline"
          className={`text-xs gap-1 no-default-hover-elevate ${style.className}`}
          data-testid={`badge-web-source-${recipe.id}`}
        >
          {style.logo && <img src={style.logo} alt="" className="h-3 w-3 rounded-sm" />}
          {style.label}
        </Badge>
      )}
      {recipe.category && (
        <Badge variant="secondary" className="text-xs" data-testid={`badge-web-category-${recipe.id}`}>
          {recipe.category}
        </Badge>
      )}
      {recipe.cuisine && (
        <Badge variant="outline" className="text-xs" data-testid={`badge-web-cuisine-${recipe.id}`}>
          {recipe.cuisine}
        </Badge>
      )}
    </div>
  );
}

function WebPreviewActionBar({ recipe, importedMealId, importedMeal, onImport, nutritionMap }: {
  recipe: WebSearchRecipe;
  importedMealId: number | null;
  importedMeal: any;
  onImport: (recipe: WebSearchRecipe) => Promise<number | null>;
  nutritionMap: Map<number, any>;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [importing, setImporting] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [localMealId, setLocalMealId] = useState<number | null>(importedMealId);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const { isMealInBasket, addToBasket } = useBasket();

  useEffect(() => {
    if (importedMealId) setLocalMealId(importedMealId);
  }, [importedMealId]);

  const ensureImported = async (): Promise<number | null> => {
    if (localMealId) return localMealId;
    setImporting(true);
    try {
      const newId = await onImport(recipe);
      if (newId) setLocalMealId(newId);
      return newId;
    } finally {
      setImporting(false);
    }
  };

  const handleAnalyse = async () => {
    setPendingAction("analyse");
    const mealId = await ensureImported();
    if (!mealId) { setPendingAction(null); return; }
    try {
      const res = await apiRequest('POST', api.analyze.meal.path, { mealId });
      const data = await res.json() as AnalysisResult;
      setAnalysisResult(data);
      setAnalysisOpen(true);
      queryClient.invalidateQueries({ queryKey: ['/api/meals', mealId, 'nutrition'] });
      toast({ title: "Analysis complete", description: "Nutrition data calculated." });
    } catch {
      toast({ title: "Analysis failed", variant: "destructive" });
    }
    setPendingAction(null);
  };

  const handlePlanner = async () => {
    setPendingAction("planner");
    const mealId = await ensureImported();
    if (!mealId) { setPendingAction(null); return; }
    setPendingAction(null);
    setPlannerOpen(true);
  };

  const handleEdit = async () => {
    setPendingAction("edit");
    const mealId = await ensureImported();
    if (!mealId) { setPendingAction(null); return; }
    try {
      const res = await apiRequest('POST', buildUrl(api.meals.copy.path, { id: mealId }));
      const newMeal = await res.json() as { id: number; name: string };
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
      navigate(`/meals/${newMeal.id}`);
    } catch {
      toast({ title: "Failed to create editable copy", variant: "destructive" });
    }
    setPendingAction(null);
  };

  const handleBasket = async () => {
    setPendingAction("basket");
    const mealId = await ensureImported();
    if (!mealId) { setPendingAction(null); return; }
    try {
      addToBasket({ mealId, quantity: 1 });
      const res = await apiRequest('POST', api.shoppingList.generateFromMeals.path, {
        mealSelections: [{ mealId, count: 1 }],
      });
      await res.json();
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.sources.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.prices.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      toast({ title: "Added to basket", description: `"${recipe.name}" added to shopping list.` });
    } catch {
      toast({ title: "Failed to add to basket", variant: "destructive" });
    }
    setPendingAction(null);
  };

  if (localMealId && importedMeal && !plannerOpen && !analysisOpen) {
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <NutritionBadges mealId={localMealId} nutrition={nutritionMap.get(localMealId)} />
        <MealActionBar
          mealId={localMealId}
          mealName={recipe.name}
          ingredients={importedMeal.ingredients || recipe.ingredients || []}
          isReadyMeal={false}
          isDrink={!!importedMeal.isDrink}
          audience={importedMeal.audience || "adult"}
          isFreezerEligible={false}
          onFreezeClick={() => {}}
          servings={importedMeal.servings || 1}
          sourceUrl={recipe.url || null}
        />
      </div>
    );
  }

  const isDisabled = importing || !!pendingAction;

  return (
    <div className="w-full flex flex-col gap-2" onClick={(e) => e.stopPropagation()} data-testid={`web-preview-actions-${recipe.id}`}>
      <div className="flex items-center gap-1 justify-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleEdit}
              disabled={isDisabled}
              data-testid={`button-web-edit-${recipe.id}`}
            >
              {pendingAction === "edit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent><p className="text-xs">Edit recipe</p></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleBasket}
              disabled={isDisabled}
              data-testid={`button-web-basket-${recipe.id}`}
            >
              {pendingAction === "basket" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBasket className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent><p className="text-xs">Add to shopping list</p></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleAnalyse}
              disabled={isDisabled}
              data-testid={`button-web-analyse-${recipe.id}`}
            >
              {pendingAction === "analyse" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Microscope className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent><p className="text-xs">Analyse</p></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={handlePlanner}
              disabled={isDisabled}
              data-testid={`button-web-planner-${recipe.id}`}
            >
              {pendingAction === "planner" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent><p className="text-xs">Add to planner</p></TooltipContent>
        </Tooltip>
      </div>

      {localMealId && (
        <AddToPlannerDialog mealId={localMealId} mealName={recipe.name} isDrink={false} audience="adult" open={plannerOpen} onOpenChange={setPlannerOpen} />
      )}

      <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Meal Analysis
            </DialogTitle>
            <DialogDescription>
              Nutrition breakdown, allergen detection, and healthier suggestions
            </DialogDescription>
          </DialogHeader>
          {analysisResult && <AnalysisResultContent analysis={analysisResult} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MealsPage() {
  const { meals, isLoading, deleteMeal, createMeal } = useMeals();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchSource, setSearchSource] = useState<"all" | "recipes" | "products">("all");
  const [viewMode, setViewMode] = useViewPreference();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [mealTypeFilter, setMealTypeFilter] = useState<string>("all");
  const [audienceFilter, setAudienceFilter] = useState<string>("all-audience");
  const [webDietFilter, setWebDietFilter] = useState<string>("");
  const [webSearchResults, setWebSearchResults] = useState<WebSearchRecipe[]>([]);
  const [webHasMore, setWebHasMore] = useState(false);
  const [webCurrentPage, setWebCurrentPage] = useState(1);
  const [webIsSearching, setWebIsSearching] = useState(false);
  const [webSearchQuery, setWebSearchQuery] = useState("");
  const [webImportingIds, setWebImportingIds] = useState<Set<string>>(new Set());
  const [webImportCategoryMap, setWebImportCategoryMap] = useState<Record<string, number | undefined>>({});
  const [recentlyImportedIds, setRecentlyImportedIds] = useState<Set<string>>(new Set());
  const [importedMealMap, setImportedMealMap] = useState<Map<string, number>>(new Map());
  const [productResults, setProductResults] = useState<ProductSearchResult[]>([]);
  const [productHasMore, setProductHasMore] = useState(false);
  const [productCurrentPage, setProductCurrentPage] = useState(1);
  const [productIsSearching, setProductIsSearching] = useState(false);
  const [productSavingIds, setProductSavingIds] = useState<Set<string>>(new Set());
  const [productSavedIds, setProductSavedIds] = useState<Set<string>>(new Set());
  const [productSavedMealMap, setProductSavedMealMap] = useState<Map<string, number>>(new Map());
  const [productCategoryMap, setProductCategoryMap] = useState<Record<string, number | undefined>>({});
  const { data: allCategories = [] } = useQuery<MealCategory[]>({
    queryKey: ['/api/categories'],
  });
  const queryClient = useQueryClient();
  const { data: freezerMeals = [], refetch: refetchFreezer } = useQuery<FreezerMeal[]>({
    queryKey: ['/api/freezer'],
  });
  const [addToFreezerMealId, setAddToFreezerMealId] = useState<number | null>(null);
  const [expandedMealId, setExpandedMealId] = useState<number | string | null>(null);
  const [webPreviewCache, setWebPreviewCache] = useState<Record<string, { ingredients: string[]; instructions: string[]; loading?: boolean; error?: string }>>({});

  const [expandedTab, setExpandedTab] = useState<"ingredients" | "method">("ingredients");
  const [freezerPortions, setFreezerPortions] = useState(4);
  const [freezerLabel, setFreezerLabel] = useState("");
  const [freezerNotes, setFreezerNotes] = useState("");

  const allMealIds = useMemo(() => (meals || []).map(m => m.id), [meals]);
  const { data: bulkNutritionData = [] } = useQuery<Nutrition[]>({
    queryKey: ["/api/nutrition/bulk", allMealIds],
    queryFn: async () => {
      if (allMealIds.length === 0) return [];
      const res = await apiRequest("POST", "/api/nutrition/bulk", { mealIds: allMealIds });
      return res.json();
    },
    enabled: allMealIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
  const nutritionMap = useMemo(() => {
    const map = new Map<number, Nutrition>();
    bulkNutritionData.forEach((n: Nutrition) => {
      if (n.mealId) map.set(n.mealId, n);
    });
    return map;
  }, [bulkNutritionData]);

  const addToFreezerMutation = useMutation({
    mutationFn: async (data: { mealId: number; totalPortions: number; batchLabel?: string; notes?: string }) => {
      const res = await apiRequest("POST", "/api/freezer", {
        mealId: data.mealId,
        totalPortions: data.totalPortions,
        remainingPortions: data.totalPortions,
        frozenDate: new Date().toISOString().split('T')[0],
        batchLabel: data.batchLabel || null,
        notes: data.notes || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/freezer'] });
      toast({ title: "Added to freezer", description: "Meal has been frozen successfully" });
      setAddToFreezerMealId(null);
      setFreezerPortions(4);
      setFreezerLabel("");
      setFreezerNotes("");
    },
  });

  const usePortionMutation = useMutation({
    mutationFn: async (freezerId: number) => {
      const res = await apiRequest("PATCH", `/api/freezer/${freezerId}/use-portion`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/freezer'] });
      toast({ title: "Portion used", description: "One frozen portion has been used" });
    },
  });

  const deleteFreezerMutation = useMutation({
    mutationFn: async (freezerId: number) => {
      const res = await apiRequest("DELETE", `/api/freezer/${freezerId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/freezer'] });
      toast({ title: "Removed from freezer" });
    },
  });

  const toggleFreezerEligible = useMutation({
    mutationFn: async ({ mealId, eligible }: { mealId: number; eligible: boolean }) => {
      const res = await apiRequest("PATCH", `/api/meals/${mealId}/freezer-eligible`, { eligible });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meals'] });
    },
  });

  const importLibraryMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/import-global-meals", {});
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
      const total = data.results?.reduce((sum: number, r: any) => sum + r.imported, 0) || 0;
      toast({ title: "Import complete", description: `Imported ${total} meals from OpenFoodFacts.` });
    },
    onError: () => {
      toast({ title: "Import failed", description: "Could not import meals from OpenFoodFacts.", variant: "destructive" });
    },
  });

  const { data: importStatus } = useQuery<{ totalImported: number; byCategory: Record<string, number> }>({
    queryKey: ['/api/admin/import-status'],
    retry: false,
  });

  const { data: userPrefs } = useQuery<{ dietTypes?: string[] }>({
    queryKey: ['/api/user/preferences'],
    retry: false,
  });

  useEffect(() => {
    if (!userPrefs) return;
    const dietTypes = userPrefs.dietTypes || [];
    if (dietTypes.length > 0) {
      const key = getDietFilterKey(dietTypes[0]);
      if (key) setWebDietFilter(key);
    }
  }, [userPrefs]);

  const guessWebCategory = (recipe: WebSearchRecipe): number | undefined => {
    const name = (recipe.name || '').toLowerCase();
    const cat = (recipe.category || '').toLowerCase();
    const breakfastWords = ['breakfast', 'pancake', 'waffle', 'omelette', 'cereal', 'toast', 'egg', 'porridge', 'granola'];
    const dessertWords = ['dessert', 'cake', 'cookie', 'pudding', 'ice cream', 'pastry', 'brownie', 'pie', 'tart', 'sweet'];
    const drinkWords = ['drink', 'cocktail', 'smoothie', 'juice', 'shake', 'tea', 'coffee', 'lemonade'];
    const snackWords = ['snack', 'starter', 'side', 'appetizer'];
    const lunchWords = ['salad', 'sandwich', 'wrap', 'soup'];
    const matchesAny = (words: string[]) => words.some(w => name.includes(w) || cat.includes(w));
    let catName = 'Dinner';
    if (matchesAny(breakfastWords)) catName = 'Breakfast';
    else if (matchesAny(dessertWords) || cat === 'dessert') catName = 'Dessert';
    else if (matchesAny(drinkWords)) catName = 'Drink';
    else if (matchesAny(snackWords)) catName = 'Snack';
    else if (matchesAny(lunchWords)) catName = 'Lunch';
    return allCategories.find(c => c.name === catName)?.id;
  };

  const webSearchAbortRef = useRef<AbortController | null>(null);

  const performWebSearch = async (query: string, page: number, signal?: AbortSignal) => {
    if (!query) return;
    setWebIsSearching(true);
    try {
      const res = await fetch(`/api/search-recipes?q=${encodeURIComponent(query)}&page=${page}${webDietFilter ? `&diet=${encodeURIComponent(webDietFilter)}` : ''}`, { signal });
      if (!res.ok) throw new Error("Search failed");
      const data: { recipes: WebSearchRecipe[]; hasMore: boolean } = await res.json();
      if (page === 1) {
        setWebSearchResults(data.recipes);
      } else {
        setWebSearchResults(prev => [...prev, ...data.recipes]);
      }
      setWebHasMore(data.hasMore);
      setWebCurrentPage(page);
      setWebSearchQuery(query);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      toast({ title: "Search Error", description: "Could not search recipes. Please try again.", variant: "destructive" });
    } finally {
      setWebIsSearching(false);
    }
  };

  const productSearchAbortRef = useRef<AbortController | null>(null);

  const performProductSearch = async (query: string, page: number, signal?: AbortSignal) => {
    if (!query) return;
    setProductIsSearching(true);
    try {
      const res = await fetch(`/api/search-products?q=${encodeURIComponent(query)}&page=${page}`, { signal });
      if (!res.ok) throw new Error("Product search failed");
      const data: { products: ProductSearchResult[]; hasMore: boolean } = await res.json();
      if (page === 1) {
        setProductResults(data.products);
      } else {
        setProductResults(prev => [...prev, ...data.products]);
      }
      setProductHasMore(data.hasMore);
      setProductCurrentPage(page);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
    } finally {
      setProductIsSearching(false);
    }
  };

  const webSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const query = searchTerm.trim();
    if (webSearchTimerRef.current) clearTimeout(webSearchTimerRef.current);
    if (webSearchAbortRef.current) webSearchAbortRef.current.abort();
    if (productSearchAbortRef.current) productSearchAbortRef.current.abort();

    if (query.length >= 2) {
      webSearchTimerRef.current = setTimeout(() => {
        const webController = new AbortController();
        webSearchAbortRef.current = webController;
        performWebSearch(query, 1, webController.signal);

        const productController = new AbortController();
        productSearchAbortRef.current = productController;
        performProductSearch(query, 1, productController.signal);
      }, 500);
    } else {
      setWebSearchResults([]);
      setWebHasMore(false);
      setWebSearchQuery("");
      setProductResults([]);
      setProductHasMore(false);
    }
    return () => {
      if (webSearchTimerRef.current) clearTimeout(webSearchTimerRef.current);
      if (webSearchAbortRef.current) webSearchAbortRef.current.abort();
      if (productSearchAbortRef.current) productSearchAbortRef.current.abort();
    };
  }, [searchTerm, webDietFilter]);

  const handleWebLoadMore = () => {
    performWebSearch(webSearchQuery, webCurrentPage + 1);
  };

  const handleProductLoadMore = () => {
    performProductSearch(searchTerm.trim(), productCurrentPage + 1);
  };

  const handleSaveProduct = async (product: ProductSearchResult) => {
    const productKey = product.barcode || product.product_name;
    setProductSavingIds(prev => new Set(prev).add(productKey));
    try {
      const categoryId = productCategoryMap[productKey] ?? null;
      const cats = product.categories_tags || [];
      const isDrink = cats.some((c: string) => c.includes('beverages') || c.includes('drinks') || c.includes('waters') || c.includes('juices') || c.includes('sodas') || c.includes('teas') || c.includes('coffees'));
      const isBabyFood = cats.some((c: string) => c.includes('baby') || c.includes('infant'));
      const isReadyMeal = cats.some((c: string) => c.includes('meals') || c.includes('ready') || c.includes('prepared') || c.includes('frozen'));
      const res = await apiRequest('POST', api.meals.saveProduct.path, {
        barcode: product.barcode,
        name: product.product_name,
        brand: product.brand,
        imageUrl: product.image_url,
        nutrition: product.nutriments,
        nutriscoreGrade: product.nutriscore_grade,
        novaGroup: product.nova_group,
        smpRating: product.upfAnalysis?.smpRating ?? 3,
        isDrink,
        isBabyFood,
        isReadyMeal,
        quantity: product.quantity,
        categoryId,
      });
      const savedMeal = await res.json();
      setProductSavedIds(prev => new Set(prev).add(productKey));
      setProductSavedMealMap(prev => new Map(prev).set(productKey, savedMeal.id));
      queryClient.invalidateQueries({ queryKey: ['/api/meals'] });
      toast({ title: "Product saved", description: `${product.product_name} added to your meals.` });
    } catch {
      toast({ title: "Save failed", description: "Could not save product. Please try again.", variant: "destructive" });
    } finally {
      setProductSavingIds(prev => {
        const next = new Set(prev);
        next.delete(productKey);
        return next;
      });
    }
  };

  const handleWebImport = async (recipe: WebSearchRecipe): Promise<number | null> => {
    setWebImportingIds(prev => new Set(prev).add(recipe.id));
    try {
      const categoryId = webImportCategoryMap[recipe.id] ?? guessWebCategory(recipe) ?? null;
      let result: any;
      if (recipe.url && recipe.ingredients.length === 0) {
        const res = await fetch('/api/import-recipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: recipe.url }),
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Import failed');
        const imported = await res.json();
        result = await createMeal.mutateAsync({
          name: imported.name || recipe.name,
          ingredients: imported.ingredients?.length > 0 ? imported.ingredients : [recipe.name],
          instructions: imported.instructions || [],
          imageUrl: imported.imageUrl || recipe.image || null,
          categoryId,
          sourceUrl: recipe.url,
          servings: imported.servings || 1,
          nutrition: imported.nutrition || undefined,
        });
      } else {
        result = await createMeal.mutateAsync({
          name: recipe.name,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions || [],
          imageUrl: recipe.image || null,
          categoryId,
          sourceUrl: recipe.url || null,
        });
      }
      setRecentlyImportedIds(prev => new Set(prev).add(recipe.id));
      if (result?.id) {
        setImportedMealMap(prev => new Map(prev).set(recipe.id, result.id));
      }
      toast({ title: "Meal saved", description: `"${recipe.name}" has been added to your meals.` });
      return result?.id ?? null;
    } catch {
      toast({ title: "Import failed", description: "Could not import this recipe.", variant: "destructive" });
      return null;
    } finally {
      setWebImportingIds(prev => {
        const next = new Set(prev);
        next.delete(recipe.id);
        return next;
      });
    }
  };


  const filteredMeals = meals?.filter(meal => {
    const matchesSearch = meal.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || 
      (allCategories.find(c => c.name === categoryFilter)?.id === meal.categoryId);
    let matchesType = true;
    if (mealTypeFilter === "recipes") matchesType = !meal.isReadyMeal && !meal.isDrink;
    else if (mealTypeFilter === "ready-meals") matchesType = meal.isReadyMeal === true && !meal.isDrink;
    else if (mealTypeFilter === "my-meals") matchesType = !meal.isSystemMeal;
    else if (mealTypeFilter === "frozen-meals") matchesType = meal.isFreezerEligible === true && (meal.isReadyMeal === true || meal.mealSourceType === "openfoodfacts");
    let matchesAudience = true;
    if (audienceFilter === "adult") matchesAudience = meal.audience === "adult" || meal.audience === "universal";
    else if (audienceFilter === "baby") matchesAudience = meal.audience === "baby" || meal.audience === "universal";
    else if (audienceFilter === "child") matchesAudience = meal.audience === "child" || meal.audience === "universal";
    else if (audienceFilter === "drinks") matchesAudience = meal.isDrink === true;
    return matchesSearch && matchesCategory && matchesType && matchesAudience;
  })?.sort((a, b) => {
    const aReady = a.isReadyMeal ? 1 : 0;
    const bReady = b.isReadyMeal ? 1 : 0;
    return aReady - bReady;
  });

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight" data-testid="text-meals-title">My Meals</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your recipes and ingredients</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-3 items-center">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search your meals and the web..." 
              className="pl-9 pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-meals"
            />
            {(webIsSearching || productIsSearching) && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-category-filter">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {allCategories.map(cat => (
                <SelectItem key={cat.id} value={cat.name} data-testid={`option-category-${cat.name}`}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex border border-border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode('grid')}
              data-testid="button-view-grid"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-l-none border-l border-border"
              onClick={() => setViewMode('list')}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <ImportRecipeDialog />
          <CreateMealDialog />
          {(!importStatus || importStatus.totalImported === 0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => importLibraryMutation.mutate()}
              disabled={importLibraryMutation.isPending}
              data-testid="button-import-library"
            >
              {importLibraryMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-1.5" />
              )}
              {importLibraryMutation.isPending ? "Importing..." : "Import Library"}
            </Button>
          )}
        </div>
      </div>

      {searchTerm.trim().length >= 2 && (
        <div className="flex items-center gap-2 mb-4" data-testid="search-source-tabs">
          <span className="text-sm text-muted-foreground mr-1">Show:</span>
          <div className="flex border border-border rounded-md">
            {([
              { value: "all" as const, label: "All" },
              { value: "recipes" as const, label: "Recipes" },
              { value: "products" as const, label: "TheHealthyApples" },
            ]).map(({ value, label }, idx) => (
              <Button
                key={value}
                variant={searchSource === value ? "secondary" : "ghost"}
                size="sm"
                className={idx === 0 ? "rounded-r-none" : idx === 2 ? "rounded-l-none border-l border-border" : "rounded-none border-l border-border"}
                onClick={() => setSearchSource(value)}
                data-testid={`button-search-source-${value}`}
              >
                {value === "recipes" && <Globe className="h-3.5 w-3.5 mr-1.5" />}
                {value === "products" && <Leaf className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />}
                {label}
                {value === "recipes" && webSearchResults.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{webSearchResults.length}</Badge>
                )}
                {value === "products" && productResults.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{productResults.length}</Badge>
                )}
              </Button>
            ))}
          </div>
          {(webIsSearching || productIsSearching) && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-1" />
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex border border-border rounded-md">
          {([
            { value: "all", label: "All Meals", icon: null, iconColor: "" },
            { value: "recipes", label: "Recipes", icon: null, iconColor: "" },
            { value: "ready-meals", label: "Ready Meals", icon: null, iconColor: "" },
            { value: "frozen-meals", label: "Frozen Meals", icon: Snowflake, iconColor: "text-blue-400" },
            { value: "my-meals", label: "My Meals Only", icon: null, iconColor: "" },
            { value: "freezer", label: "Freezer", icon: Snowflake, iconColor: "text-blue-400" },
          ] as const).map(({ value, label, icon: Icon, iconColor }, idx) => (
            <Button
              key={value}
              variant={mealTypeFilter === value ? "secondary" : "ghost"}
              size="sm"
              className={idx > 0 ? "border-l border-border rounded-none" : "rounded-r-none"}
              onClick={() => setMealTypeFilter(value)}
              data-testid={`button-filter-${value}`}
            >
              {Icon && <Icon className={`h-3.5 w-3.5 mr-1 ${iconColor || ""}`} />}
              {label}
              {value === "freezer" && freezerMeals.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                  {freezerMeals.reduce((sum, f) => sum + f.remainingPortions, 0)}
                </Badge>
              )}
            </Button>
          ))}
        </div>
        <div className="flex border border-border rounded-md">
          {([
            { value: "all-audience", label: "All", icon: null, iconColor: "" },
            { value: "adult", label: "Adult", icon: null, iconColor: "" },
            { value: "baby", label: "Baby", icon: Baby, iconColor: "text-pink-400" },
            { value: "child", label: "Child", icon: PersonStanding, iconColor: "text-sky-400" },
            { value: "drinks", label: "Drinks", icon: Wine, iconColor: "text-purple-400" },
          ] as const).map(({ value, label, icon: Icon, iconColor }, idx) => (
            <Button
              key={value}
              variant={audienceFilter === value ? "secondary" : "ghost"}
              size="sm"
              className={idx > 0 ? "border-l border-border rounded-none" : "rounded-r-none"}
              onClick={() => setAudienceFilter(value)}
              data-testid={`button-audience-${value}`}
            >
              {Icon && <Icon className={`h-3.5 w-3.5 mr-1 ${iconColor || ""}`} />}
              {label}
            </Button>
          ))}
        </div>
      </div>

      {mealTypeFilter === "freezer" ? (
        <div className="space-y-4">
          {freezerMeals.length === 0 ? (
            <Card className="p-8">
              <div className="flex flex-col items-center gap-3 text-center">
                <Snowflake className="h-12 w-12 text-blue-300/40" />
                <h3 className="text-lg font-medium">No frozen meals yet</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Cook a batch of your favourite meals and add them to the freezer to track portions. Look for the snowflake button on any meal card.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {freezerMeals.map((frozen, index) => {
                const meal = meals?.find(m => m.id === frozen.mealId);
                const portionPercent = frozen.totalPortions > 0 ? (frozen.remainingPortions / frozen.totalPortions) * 100 : 0;
                const isExpired = frozen.expiryDate && new Date(frozen.expiryDate) < new Date();
                const daysUntilExpiry = frozen.expiryDate ? Math.ceil((new Date(frozen.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                return (
                  <motion.div
                    key={frozen.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                  >
                    <Card className={`h-full flex flex-col overflow-hidden ${isExpired ? 'border-red-400/50' : 'border-blue-400/30'}`} data-testid={`card-freezer-${frozen.id}`}>
                      <div className="relative w-full h-36 overflow-hidden rounded-t-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20">
                        {meal?.imageUrl ? (
                          <img src={meal.imageUrl} alt={meal.name} className="w-full h-full object-cover opacity-70" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Snowflake className="h-12 w-12 text-blue-300/40" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                          <Badge variant="secondary" className="bg-blue-500/90 text-white border-0 text-[10px]">
                            <Snowflake className="h-3 w-3 mr-1" />
                            {frozen.remainingPortions}/{frozen.totalPortions} portions
                          </Badge>
                        </div>
                        {isExpired && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="destructive" className="text-[10px]">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Expired
                            </Badge>
                          </div>
                        )}
                        {!isExpired && daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="outline" className="text-[10px] border-amber-400/60 text-amber-600 dark:text-amber-400 bg-background/80">
                              {daysUntilExpiry}d left
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="flex-1 p-3 space-y-2">
                        <h3 className="font-medium text-sm leading-tight">{meal?.name || `Meal #${frozen.mealId}`}</h3>
                        {frozen.batchLabel && (
                          <p className="text-xs text-muted-foreground">{frozen.batchLabel}</p>
                        )}
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${portionPercent > 50 ? 'bg-blue-400' : portionPercent > 20 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${portionPercent}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Frozen {new Date(frozen.frozenDate).toLocaleDateString()}
                          {frozen.expiryDate && ` · Expires ${new Date(frozen.expiryDate).toLocaleDateString()}`}
                        </p>
                        {frozen.notes && <p className="text-[11px] text-muted-foreground italic">{frozen.notes}</p>}
                      </CardContent>
                      <CardFooter className="p-3 pt-0 flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          disabled={frozen.remainingPortions <= 0 || usePortionMutation.isPending}
                          onClick={() => usePortionMutation.mutate(frozen.id)}
                          data-testid={`button-use-portion-${frozen.id}`}
                        >
                          <Minus className="h-3 w-3 mr-1" />
                          Use Portion
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteFreezerMutation.mutate(frozen.id)}
                          data-testid={`button-delete-freezer-${frozen.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : isLoading ? (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "flex flex-col gap-3"}>
          {[1, 2, 3].map(i => (
            <div key={i} className={`bg-muted animate-pulse rounded-md ${viewMode === 'grid' ? 'h-48' : 'h-24'}`} />
          ))}
        </div>
      ) : (
        <AnimatePresence>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMeals?.map((meal, index) => (
                <motion.div
                  key={meal.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  <Card className="h-full flex flex-col group cursor-pointer overflow-hidden hover-elevate transition-all duration-200" onClick={(e) => { e.stopPropagation(); setExpandedMealId(expandedMealId === meal.id ? null : meal.id); setExpandedTab("ingredients"); }} data-testid={`card-meal-${meal.id}`}>
                    <div className="relative w-full h-48 overflow-hidden rounded-t-md">
                      {meal.isReadyMeal && !meal.imageUrl ? (
                        <div className={`w-full h-full flex flex-col items-center justify-center gap-2 px-4 relative ${
                          meal.audience === 'baby' ? 'bg-pink-500/10 dark:bg-pink-500/15' :
                          meal.audience === 'child' ? 'bg-sky-500/10 dark:bg-sky-500/15' :
                          'bg-green-500/10 dark:bg-green-500/15'
                        }`} data-testid={`placeholder-ready-meal-${meal.id}`}>
                          {meal.audience === 'baby' ? (
                            <MealWatermark type="baby" size="lg" className="inset-0 m-auto flex items-center justify-center" />
                          ) : meal.audience === 'child' ? (
                            <MealWatermark type="child" size="lg" className="inset-0 m-auto flex items-center justify-center" />
                          ) : meal.isDrink ? (
                            <MealWatermark type="drink" size="lg" className="inset-0 m-auto flex items-center justify-center" />
                          ) : null}
                          <UtensilsCrossed className={`h-10 w-10 relative z-10 ${
                            meal.audience === 'baby' ? 'text-pink-500/30' :
                            meal.audience === 'child' ? 'text-sky-500/30' :
                            'text-green-500/30'
                          }`} />
                          <span className={`text-sm font-semibold text-center leading-tight relative z-10 ${
                            meal.audience === 'baby' ? 'text-pink-700 dark:text-pink-400' :
                            meal.audience === 'child' ? 'text-sky-700 dark:text-sky-400' :
                            'text-green-700 dark:text-green-400'
                          }`}>{meal.name}</span>
                          <span className={`text-[10px] font-bold tracking-wider uppercase relative z-10 ${
                            meal.audience === 'baby' ? 'text-pink-600/60 dark:text-pink-500/50' :
                            meal.audience === 'child' ? 'text-sky-600/60 dark:text-sky-500/50' :
                            'text-green-600/60 dark:text-green-500/50'
                          }`}>
                            {meal.isDrink ? 'Drink' : meal.audience === 'baby' ? 'Baby Meal' : meal.audience === 'child' ? 'Kids Meal' : 'Ready Meal'}
                          </span>
                        </div>
                      ) : meal.imageUrl ? (
                        <>
                          <img
                            src={meal.imageUrl}
                            alt={meal.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            data-testid={`img-meal-${meal.id}`}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          {meal.audience === 'baby' && (
                            <MealWatermark type="baby" size="md" className="bottom-2 right-2" />
                          )}
                          {meal.audience === 'child' && (
                            <MealWatermark type="child" size="md" className="bottom-2 right-2" />
                          )}
                          {!meal.isSystemMeal && meal.audience !== 'baby' && meal.audience !== 'child' && (
                            <MealWatermark type="adult" size="md" className="bottom-2 right-2" />
                          )}
                        </>
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center relative ${
                          meal.audience === 'baby' ? 'bg-gradient-to-br from-pink-100 to-pink-200/30 dark:from-pink-950/30 dark:to-pink-900/10' :
                          meal.audience === 'child' ? 'bg-gradient-to-br from-sky-100 to-sky-200/30 dark:from-sky-950/30 dark:to-sky-900/10' :
                          !meal.isSystemMeal ? 'bg-gradient-to-br from-green-100/50 to-green-200/20 dark:from-green-950/20 dark:to-green-900/10' : 'bg-gradient-to-br from-muted to-muted-foreground/10'
                        }`} data-testid={`placeholder-meal-${meal.id}`}>
                          {meal.audience === 'baby' ? (
                            <MealWatermark type="baby" size="lg" className="relative" />
                          ) : meal.audience === 'child' ? (
                            <MealWatermark type="child" size="lg" className="relative" />
                          ) : (
                            <>
                              <ChefHat className="h-12 w-12 text-muted-foreground/40" />
                              {!meal.isSystemMeal && (
                                <MealWatermark type="adult" size="lg" className="inset-0 m-auto flex items-center justify-center" />
                              )}
                              {meal.isReadyMeal && meal.isSystemMeal && (
                                <MealWatermark type="ready" size="lg" className="inset-0 m-auto flex items-center justify-center" />
                              )}
                              {meal.isDrink && (
                                <MealWatermark type="drink" size="lg" className="inset-0 m-auto flex items-center justify-center" />
                              )}
                            </>
                          )}
                        </div>
                      )}
                      {!meal.isReadyMeal && meal.imageUrl && (
                        <div className="absolute bottom-1.5 left-1.5 z-10 flex items-center gap-1.5" data-testid={`name-overlay-meal-${meal.id}`}>
                          <span className="bg-black/65 backdrop-blur-sm text-white text-[13px] font-medium px-2 py-1 rounded-md leading-tight inline-block">
                            {meal.name}
                          </span>
                        </div>
                      )}
                      {freezerMeals.some(f => f.mealId === meal.id && f.remainingPortions > 0) && (
                        <div className="absolute top-1.5 left-1.5 z-10" data-testid={`badge-frozen-${meal.id}`}>
                          <Badge variant="secondary" className="bg-blue-500/90 text-white border-0 text-[10px]">
                            <Snowflake className="h-3 w-3 mr-1" />
                            {freezerMeals.filter(f => f.mealId === meal.id).reduce((s, f) => s + f.remainingPortions, 0)} frozen
                          </Badge>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/85 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col p-3 pt-10 overflow-y-auto" data-testid={`overlay-meal-${meal.id}`}>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <CategoryBadge categoryId={meal.categoryId} categories={allCategories} />
                          {meal.mealSourceType && meal.mealSourceType !== 'scratch' && (
                            <Badge variant="outline" className="text-[10px] border-amber-400/60 text-amber-300 bg-transparent" data-testid={`badge-source-${meal.id}`}>
                              {meal.mealSourceType === 'ready_meal' ? 'Ready Meal' : meal.mealSourceType === 'openfoodfacts' ? 'OFF' : meal.mealSourceType}
                            </Badge>
                          )}
                          {meal.brand && (
                            <Badge variant="outline" className="text-[10px] border-sky-400/60 text-sky-300 bg-transparent" data-testid={`badge-brand-${meal.id}`}>
                              {meal.brand}
                            </Badge>
                          )}
                          {meal.isDrink && (
                            <Badge variant="outline" className="text-[10px] border-purple-400/60 text-purple-300 bg-transparent" data-testid={`badge-drink-${meal.id}`}>
                              Drink
                            </Badge>
                          )}
                          {meal.audience === 'baby' && (
                            <Badge variant="outline" className="text-[10px] border-pink-400/60 text-pink-300 bg-transparent" data-testid={`badge-baby-${meal.id}`}>
                              Baby
                            </Badge>
                          )}
                          {meal.audience === 'child' && (
                            <Badge variant="outline" className="text-[10px] border-sky-400/60 text-sky-300 bg-transparent" data-testid={`badge-child-${meal.id}`}>
                              Kids
                            </Badge>
                          )}
                          {!meal.isReadyMeal && <span className="text-xs text-white/70">{meal.ingredients.length} ingredients</span>}
                        </div>
                        <div className="space-y-1">
                          {meal.ingredients.map((ing, i) => {
                            const parsed = parseIngredient(ing);
                            return (
                              <div key={i} className="text-xs text-white/90 flex gap-1.5" data-testid={`overlay-ingredient-${meal.id}-${i}`}>
                                <span className="text-white/50 shrink-0">{parsed.detail || '-'}</span>
                                <span>{parsed.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {!meal.isSystemMeal && (
                        <div className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white bg-black/40 backdrop-blur-sm"
                            onClick={(e) => { e.stopPropagation(); deleteMeal.mutate(meal.id); }}
                            data-testid={`button-delete-meal-${meal.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <AnimatePresence>
                      {expandedMealId === meal.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden border-t"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`expanded-detail-${meal.id}`}
                        >
                          <div className="px-3 pt-2 pb-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex gap-1">
                                <Button
                                  variant={expandedTab === "ingredients" ? "default" : "ghost"}
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => setExpandedTab("ingredients")}
                                  data-testid={`tab-ingredients-${meal.id}`}
                                >
                                  Ingredients
                                </Button>
                                <Button
                                  variant={expandedTab === "method" ? "default" : "ghost"}
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => setExpandedTab("method")}
                                  data-testid={`tab-method-${meal.id}`}
                                >
                                  Method
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-muted-foreground"
                                onClick={() => navigate(`/meals/${meal.id}`)}
                                data-testid={`link-full-detail-${meal.id}`}
                              >
                                Full Details
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                            <div className="max-h-52 overflow-y-auto">
                              {expandedTab === "ingredients" ? (
                                <div className="space-y-1 pb-2" data-testid={`expanded-ingredients-${meal.id}`}>
                                  {meal.ingredients.length > 0 ? meal.ingredients.map((ing, i) => {
                                    const parsed = parseIngredient(ing);
                                    return (
                                      <div key={i} className="text-sm flex gap-2 py-0.5" data-testid={`expanded-ingredient-${meal.id}-${i}`}>
                                        <span className="text-muted-foreground shrink-0 w-20 text-right text-xs leading-5">{parsed.detail || ''}</span>
                                        <span className="text-foreground">{parsed.name}</span>
                                      </div>
                                    );
                                  }) : (
                                    <p className="text-sm text-muted-foreground py-4 text-center">No ingredients listed</p>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-2 pb-2" data-testid={`expanded-method-${meal.id}`}>
                                  {meal.instructions && meal.instructions.length > 0 ? meal.instructions.map((step, i) => (
                                    <div key={i} className="flex gap-2 text-sm" data-testid={`expanded-step-${meal.id}-${i}`}>
                                      <span className="text-primary font-semibold shrink-0 w-6 text-right">{i + 1}.</span>
                                      <span className="text-foreground leading-relaxed">{step}</span>
                                    </div>
                                  )) : (
                                    <p className="text-sm text-muted-foreground py-4 text-center">No method available</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <CardFooter className="py-2 px-3 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                      {!meal.isReadyMeal && (
                        <div className="flex items-center gap-1.5 flex-wrap w-full">
                          <NutritionBadges mealId={meal.id} nutrition={nutritionMap.get(meal.id)} />
                        </div>
                      )}
                      <MealActionBar
                        mealId={meal.id}
                        mealName={meal.name}
                        ingredients={meal.ingredients}
                        isReadyMeal={!!meal.isReadyMeal}
                        isDrink={!!meal.isDrink}
                        audience={meal.audience || "adult"}
                        isFreezerEligible={!!meal.isFreezerEligible}
                        onFreezeClick={() => setAddToFreezerMealId(meal.id)}
                        servings={meal.servings}
                        sourceUrl={meal.sourceUrl}
                      />
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredMeals?.map((meal, index) => (
                <motion.div
                  key={meal.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.15, delay: index * 0.02 }}
                >
                  <Card className="group cursor-pointer" onClick={() => { setExpandedMealId(expandedMealId === meal.id ? null : meal.id); setExpandedTab("ingredients"); }} data-testid={`card-meal-${meal.id}`}>
                    <div className="flex items-stretch relative">
                      {meal.isReadyMeal ? (
                        <div className={`w-28 sm:w-36 shrink-0 overflow-hidden rounded-l-md flex flex-col items-center justify-center gap-1 px-2 relative ${
                          meal.audience === 'baby' ? 'bg-pink-500/10 dark:bg-pink-500/15' :
                          meal.audience === 'child' ? 'bg-sky-500/10 dark:bg-sky-500/15' :
                          'bg-green-500/10 dark:bg-green-500/15'
                        }`}>
                          {meal.audience === 'baby' ? (
                            <MealWatermark type="baby" size="sm" className="inset-0 m-auto flex items-center justify-center" />
                          ) : meal.audience === 'child' ? (
                            <MealWatermark type="child" size="sm" className="inset-0 m-auto flex items-center justify-center" />
                          ) : meal.isDrink ? (
                            <MealWatermark type="drink" size="sm" className="inset-0 m-auto flex items-center justify-center" />
                          ) : null}
                          <UtensilsCrossed className={`h-6 w-6 relative z-10 ${
                            meal.audience === 'baby' ? 'text-pink-500/30' :
                            meal.audience === 'child' ? 'text-sky-500/30' :
                            'text-green-500/30'
                          }`} />
                          <span className={`text-[9px] font-bold tracking-wider uppercase relative z-10 ${
                            meal.audience === 'baby' ? 'text-pink-600/60 dark:text-pink-500/50' :
                            meal.audience === 'child' ? 'text-sky-600/60 dark:text-sky-500/50' :
                            'text-green-600/60 dark:text-green-500/50'
                          }`}>
                            {meal.audience === 'baby' ? 'Baby Meal' : meal.audience === 'child' ? 'Kids Meal' : 'Ready Meal'}
                          </span>
                        </div>
                      ) : meal.imageUrl ? (
                        <div className="w-28 sm:w-36 shrink-0 overflow-hidden rounded-l-md relative">
                          <img
                            src={meal.imageUrl}
                            alt={meal.name}
                            className="w-full h-full object-cover"
                            data-testid={`img-meal-${meal.id}`}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          {meal.audience === 'baby' && (
                            <MealWatermark type="baby" size="sm" className="bottom-1 right-1" />
                          )}
                          {meal.audience === 'child' && (
                            <MealWatermark type="child" size="sm" className="bottom-1 right-1" />
                          )}
                          {!meal.isSystemMeal && meal.audience !== 'baby' && meal.audience !== 'child' && (
                            <MealWatermark type="adult" size="sm" className="bottom-1 right-1" />
                          )}
                        </div>
                      ) : meal.audience === 'baby' || meal.audience === 'child' ? (
                        <div className={`w-28 sm:w-36 shrink-0 overflow-hidden rounded-l-md flex items-center justify-center ${
                          meal.audience === 'baby' ? 'bg-pink-100 dark:bg-pink-950/30' : 'bg-sky-100 dark:bg-sky-950/30'
                        }`}>
                          <MealWatermark type={meal.audience === 'baby' ? 'baby' : 'child'} size="sm" className="relative" />
                        </div>
                      ) : !meal.isSystemMeal && !meal.imageUrl ? (
                        <div className="w-28 sm:w-36 shrink-0 overflow-hidden rounded-l-md flex items-center justify-center bg-gradient-to-br from-green-100/40 to-green-200/20 dark:from-green-950/20 dark:to-green-900/10 relative">
                          <MealWatermark type="adult" size="sm" className="inset-0 m-auto flex items-center justify-center" />
                          <ChefHat className="h-8 w-8 text-green-500/30 relative z-10" />
                        </div>
                      ) : null}
                      <div className="flex-1 min-w-0 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-base font-semibold text-foreground">{meal.name}</h3>
                            <CategoryBadge categoryId={meal.categoryId} categories={allCategories} />
                            {!meal.isReadyMeal && meal.mealSourceType && meal.mealSourceType !== 'scratch' && (
                              <Badge variant="secondary" className="text-[10px]" data-testid={`badge-source-list-${meal.id}`}>
                                {meal.mealSourceType === 'ready_meal' ? 'Ready Meal' : meal.mealSourceType}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {meal.ingredients.slice(0, 6).map((ing, i) => (
                              <IngredientBadge key={i} ingredient={ing} mealId={meal.id} index={i} />
                            ))}
                            {meal.ingredients.length > 6 && (
                              <Badge variant="outline" className="text-xs font-normal">
                                +{meal.ingredients.length - 6} more
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <NutritionBadges mealId={meal.id} nutrition={nutritionMap.get(meal.id)} />
                            <DietBadges mealId={meal.id} />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0 min-w-[200px]" onClick={(e) => e.stopPropagation()}>
                          <MealActionBar
                            mealId={meal.id}
                            mealName={meal.name}
                            ingredients={meal.ingredients}
                            isReadyMeal={!!meal.isReadyMeal}
                            isDrink={!!meal.isDrink}
                            audience={meal.audience || "adult"}
                            isFreezerEligible={!!meal.isFreezerEligible}
                            onFreezeClick={() => setAddToFreezerMealId(meal.id)}
                            servings={meal.servings}
                            sourceUrl={meal.sourceUrl}
                          />
                          {!meal.isSystemMeal && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground invisible group-hover:visible self-end"
                              onClick={(e) => { e.stopPropagation(); deleteMeal.mutate(meal.id); }}
                              data-testid={`button-delete-meal-${meal.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedMealId === meal.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden border-t"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`expanded-detail-${meal.id}`}
                        >
                          <div className="px-4 py-3">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex gap-1">
                                <Button
                                  variant={expandedTab === "ingredients" ? "default" : "ghost"}
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => setExpandedTab("ingredients")}
                                  data-testid={`tab-ingredients-${meal.id}`}
                                >
                                  Ingredients
                                </Button>
                                <Button
                                  variant={expandedTab === "method" ? "default" : "ghost"}
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => setExpandedTab("method")}
                                  data-testid={`tab-method-${meal.id}`}
                                >
                                  Method
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-muted-foreground"
                                onClick={() => navigate(`/meals/${meal.id}`)}
                                data-testid={`link-full-detail-${meal.id}`}
                              >
                                Full Details
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                              {expandedTab === "ingredients" ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pb-2" data-testid={`expanded-ingredients-${meal.id}`}>
                                  {meal.ingredients.length > 0 ? meal.ingredients.map((ing, i) => {
                                    const parsed = parseIngredient(ing);
                                    return (
                                      <div key={i} className="text-sm flex gap-2 py-0.5" data-testid={`expanded-ingredient-${meal.id}-${i}`}>
                                        <span className="text-muted-foreground shrink-0 w-20 text-right text-xs leading-5">{parsed.detail || ''}</span>
                                        <span className="text-foreground">{parsed.name}</span>
                                      </div>
                                    );
                                  }) : (
                                    <p className="text-sm text-muted-foreground py-4 text-center col-span-2">No ingredients listed</p>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-2 pb-2" data-testid={`expanded-method-${meal.id}`}>
                                  {meal.instructions && meal.instructions.length > 0 ? meal.instructions.map((step, i) => (
                                    <div key={i} className="flex gap-2 text-sm" data-testid={`expanded-step-${meal.id}-${i}`}>
                                      <span className="text-primary font-semibold shrink-0 w-6 text-right">{i + 1}.</span>
                                      <span className="text-foreground leading-relaxed">{step}</span>
                                    </div>
                                  )) : (
                                    <p className="text-sm text-muted-foreground py-4 text-center">No method available</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      )}

      {!isLoading && filteredMeals?.length === 0 && !webSearchResults.length && !webIsSearching && !productResults.length && !productIsSearching && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No meals found</h3>
          <p className="text-muted-foreground">
            {searchTerm.trim().length >= 2 
              ? "No local matches. Web results will appear below if found."
              : "Try creating a new meal to get started."
            }
          </p>
        </div>
      )}

      {(webSearchResults.length > 0 || webIsSearching) && searchSource !== "products" && (
        <div className="mt-8" data-testid="section-web-results">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Globe className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">From the Web</h2>
            {webIsSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {webSearchQuery && !webIsSearching && (
              <span className="text-sm text-muted-foreground">
                Results for "{webSearchQuery}"
              </span>
            )}
            <div className="flex items-center gap-2 ml-auto">
              {webDietFilter && (
                <Badge variant="secondary" className="gap-1.5 pr-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800" data-testid="badge-web-diet-filter">
                  <Leaf className="h-3 w-3" />
                  {DIET_FILTER_OPTIONS.find(o => o.value === webDietFilter)?.label ?? webDietFilter}
                  <button
                    onClick={() => setWebDietFilter("")}
                    className="ml-0.5 rounded-full hover:bg-green-200 dark:hover:bg-green-800 p-0.5"
                    aria-label="Remove diet filter"
                    data-testid="button-clear-web-diet"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              )}
              <Select value={webDietFilter || "none"} onValueChange={v => setWebDietFilter(v === "none" ? "" : v)}>
                <SelectTrigger className="h-7 text-xs w-[130px]" data-testid="select-web-diet-filter">
                  <SelectValue placeholder="Any diet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any diet</SelectItem>
                  {DIET_FILTER_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {webSearchResults.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {webSearchResults.map((recipe) => {
                    const isImporting = webImportingIds.has(recipe.id);
                    const isImported = recentlyImportedIds.has(recipe.id);
                    const importedMealId = importedMealMap.get(recipe.id);
                    const importedMeal = importedMealId ? meals?.find(m => m.id === importedMealId) : null;
                    const webId = `web-${recipe.id}`;
                    const preview = webPreviewCache[webId];
                    const displayIngredients = importedMeal?.ingredients?.length ? importedMeal.ingredients : preview?.ingredients?.length ? preview.ingredients : recipe.ingredients || [];
                    const displayInstructions = importedMeal?.instructions?.length ? importedMeal.instructions : preview?.instructions?.length ? preview.instructions : recipe.instructions || [];
                    const isPreviewLoading = preview?.loading === true;
                    return (
                      <motion.div
                        key={recipe.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        layout
                      >
                        <Card className="overflow-hidden h-full flex flex-col cursor-pointer" onClick={() => {
                          const webId = `web-${recipe.id}`;
                          if (expandedMealId === webId) {
                            setExpandedMealId(null);
                            return;
                          }
                          setExpandedMealId(webId);
                          setExpandedTab("ingredients");
                          if (!webPreviewCache[webId] && !importedMeal && recipe.url) {
                            setWebPreviewCache(prev => ({ ...prev, [webId]: { ingredients: [], instructions: [], loading: true } }));
                            fetch('/api/preview-recipe', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ url: recipe.url }),
                            })
                              .then(r => r.json())
                              .then((data: { ingredients?: string[]; instructions?: string[]; error?: string }) => {
                                setWebPreviewCache(prev => ({
                                  ...prev,
                                  [webId]: {
                                    ingredients: data.ingredients || [],
                                    instructions: data.instructions || [],
                                    loading: false,
                                    error: data.error,
                                  },
                                }));
                              })
                              .catch(() => {
                                setWebPreviewCache(prev => ({
                                  ...prev,
                                  [webId]: { ingredients: [], instructions: [], loading: false, error: 'Failed to load recipe details' },
                                }));
                              });
                          }
                        }} data-testid={`card-web-result-${recipe.id}`}>
                          {recipe.image && (
                            <div className="w-full aspect-[4/3] overflow-hidden">
                              <img
                                src={recipe.image}
                                alt={recipe.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                data-testid={`img-web-recipe-${recipe.id}`}
                              />
                            </div>
                          )}
                          <AnimatePresence>
                            {expandedMealId === `web-${recipe.id}` && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                className="overflow-hidden border-t"
                                onClick={(e) => e.stopPropagation()}
                                data-testid={`expanded-detail-web-${recipe.id}`}
                              >
                                <div className="px-3 pt-2 pb-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex gap-1">
                                      <Button
                                        variant={expandedTab === "ingredients" ? "default" : "ghost"}
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => setExpandedTab("ingredients")}
                                        data-testid={`tab-ingredients-web-${recipe.id}`}
                                      >
                                        Ingredients
                                      </Button>
                                      <Button
                                        variant={expandedTab === "method" ? "default" : "ghost"}
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => setExpandedTab("method")}
                                        data-testid={`tab-method-web-${recipe.id}`}
                                      >
                                        Method
                                      </Button>
                                    </div>
                                    {recipe.url && (
                                      <a
                                        href={recipe.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                        data-testid={`link-source-web-${recipe.id}`}
                                      >
                                        Source
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                  </div>
                                  <div className="max-h-52 overflow-y-auto">
                                    {isPreviewLoading ? (
                                      <div className="flex items-center justify-center py-6 gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Loading recipe details...</span>
                                      </div>
                                    ) : preview?.error && displayIngredients.length === 0 ? (
                                      <p className="text-sm text-muted-foreground py-4 text-center">{preview.error}</p>
                                    ) : expandedTab === "ingredients" ? (
                                      <div className="space-y-1 pb-2" data-testid={`expanded-ingredients-web-${recipe.id}`}>
                                        {displayIngredients.length > 0 ? displayIngredients.map((ing, i) => {
                                          const parsed = parseIngredient(ing);
                                          return (
                                            <div key={i} className="text-sm flex gap-2 py-0.5" data-testid={`expanded-ingredient-web-${recipe.id}-${i}`}>
                                              <span className="text-muted-foreground shrink-0 w-20 text-right text-xs leading-5">{parsed.detail || ''}</span>
                                              <span className="text-foreground">{parsed.name}</span>
                                            </div>
                                          );
                                        }) : (
                                          <p className="text-sm text-muted-foreground py-4 text-center">No ingredients found on this page</p>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="space-y-2 pb-2" data-testid={`expanded-method-web-${recipe.id}`}>
                                        {displayInstructions.length > 0 ? displayInstructions.map((step, i) => (
                                          <div key={i} className="flex gap-2 text-sm" data-testid={`expanded-step-web-${recipe.id}-${i}`}>
                                            <span className="text-primary font-semibold shrink-0 w-6 text-right">{i + 1}.</span>
                                            <span className="text-foreground leading-relaxed">{step}</span>
                                          </div>
                                        )) : (
                                          <p className="text-sm text-muted-foreground py-4 text-center">No method found on this page</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  {!isPreviewLoading && (
                                    <div className="border-t mt-2 pt-2">
                                      <WebPreviewActionBar
                                        recipe={recipe}
                                        importedMealId={importedMealId ?? null}
                                        importedMeal={importedMeal}
                                        onImport={handleWebImport}
                                        nutritionMap={nutritionMap}
                                      />
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <CardContent className="p-4 flex-1 flex flex-col justify-between gap-3" onClick={(e) => e.stopPropagation()}>
                            <div>
                              <h3 className="font-semibold text-base leading-tight" data-testid={`text-web-recipe-name-${recipe.id}`}>
                                {recipe.name}
                              </h3>
                              <WebSourceBadge recipe={recipe} />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Select
                                  value={String(webImportCategoryMap[recipe.id] ?? guessWebCategory(recipe) ?? "")}
                                  onValueChange={(val) => setWebImportCategoryMap(prev => ({ ...prev, [recipe.id]: Number(val) }))}
                                >
                                  <SelectTrigger className="flex-1" data-testid={`select-web-import-category-${recipe.id}`}>
                                    <SelectValue placeholder="Category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {allCategories.map(cat => {
                                      const Icon = getCategoryIcon(cat.name);
                                      return (
                                        <SelectItem key={cat.id} value={String(cat.id)} data-testid={`option-web-import-category-${cat.id}`}>
                                          <span className="flex items-center gap-1.5">
                                            <Icon className={`h-3 w-3 ${getCategoryColor(cat.name)}`} />
                                            {cat.name}
                                          </span>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  variant={isImported ? "secondary" : "default"}
                                  onClick={() => handleWebImport(recipe)}
                                  disabled={isImporting || isImported}
                                  className="shrink-0 gap-1"
                                  data-testid={`button-web-import-${recipe.id}`}
                                >
                                  {isImporting ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : isImported ? (
                                    <>
                                      <Check className="h-3.5 w-3.5" />
                                      Saved
                                    </>
                                  ) : (
                                    <>
                                      <Download className="h-3.5 w-3.5" />
                                      Save
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {webHasMore && (
                <div className="text-center pt-2">
                  <Button
                    variant="outline"
                    onClick={handleWebLoadMore}
                    disabled={webIsSearching}
                    data-testid="button-web-load-more"
                  >
                    {webIsSearching ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}

          {webIsSearching && webSearchResults.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin opacity-50" />
              <p className="text-sm">Searching the web for recipes...</p>
            </div>
          )}
        </div>
      )}

      {(productResults.length > 0 || productIsSearching) && searchSource !== "recipes" && (
        <div className="mt-8" data-testid="section-product-results">
          <div className="flex items-center gap-3 mb-4">
            <Leaf className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-semibold tracking-tight">TheHealthyApples</h2>
            {productIsSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {!productIsSearching && productResults.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {productResults.length} found
              </span>
            )}
          </div>

          {productResults.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {productResults.map((product) => {
                    const productKey = product.barcode || product.product_name;
                    const isSaving = productSavingIds.has(productKey);
                    const isSaved = productSavedIds.has(productKey);
                    const cats = product.categories_tags || [];
                    const isDrink = cats.some((c: string) => c.includes('beverages') || c.includes('drinks'));
                    const isReadyMeal = cats.some((c: string) => c.includes('meals') || c.includes('ready') || c.includes('prepared'));
                    const smpRating = product.upfAnalysis?.smpRating ?? 3;
                    const hasCape = product.upfAnalysis?.hasCape ?? false;
                    return (
                      <motion.div
                        key={productKey}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        layout
                      >
                        <Card className="overflow-hidden h-full flex flex-col" data-testid={`card-product-${productKey}`}>
                          {product.image_url && (
                            <div className="w-full aspect-[4/3] overflow-hidden bg-muted flex items-center justify-center">
                              <img
                                src={product.image_url}
                                alt={product.product_name}
                                className="w-full h-full object-contain p-2"
                                loading="lazy"
                                data-testid={`img-product-${productKey}`}
                              />
                            </div>
                          )}
                          <CardContent className="p-4 flex-1 flex flex-col justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-base leading-tight" data-testid={`text-product-name-${productKey}`}>
                                {product.product_name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {product.brand && (
                                  <Badge variant="secondary" className="text-xs">
                                    {product.brand}
                                  </Badge>
                                )}
                                {product.nutriscore_grade && (
                                  <Badge className={`text-xs font-bold uppercase ${NUTRISCORE_COLORS[product.nutriscore_grade.toLowerCase()] || 'bg-muted'}`} data-testid={`badge-nutriscore-${productKey}`}>
                                    Nutri-Score {product.nutriscore_grade.toUpperCase()}
                                  </Badge>
                                )}
                                {product.nova_group && (
                                  <Badge variant="outline" className="text-xs" data-testid={`badge-nova-${productKey}`}>
                                    NOVA {product.nova_group}
                                  </Badge>
                                )}
                                {isDrink && (
                                  <Badge variant="outline" className="text-xs"><Coffee className="h-3 w-3 mr-1" />Drink</Badge>
                                )}
                                {isReadyMeal && (
                                  <Badge variant="outline" className="text-xs"><UtensilsCrossed className="h-3 w-3 mr-1" />Ready Meal</Badge>
                                )}
                              </div>
                              <div className="mt-2" data-testid={`rating-product-${productKey}`}>
                                <AppleRating rating={smpRating} hasCape={hasCape} size="small" />
                              </div>
                              {product.nutriments?.calories && (
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2" data-testid={`nutrition-product-${productKey}`}>
                                  <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange-500" />{Math.round(Number(product.nutriments.calories))} kcal</span>
                                  {product.nutriments.protein && <span className="flex items-center gap-1"><Beef className="h-3 w-3 text-red-500" />{Number(product.nutriments.protein).toFixed(1)}g</span>}
                                  {product.nutriments.carbs && <span className="flex items-center gap-1"><Wheat className="h-3 w-3 text-amber-600" />{Number(product.nutriments.carbs).toFixed(1)}g</span>}
                                  {product.nutriments.fat && <span className="flex items-center gap-1"><Droplets className="h-3 w-3 text-blue-500" />{Number(product.nutriments.fat).toFixed(1)}g</span>}
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Select
                                  value={String(productCategoryMap[productKey] ?? "")}
                                  onValueChange={(val) => setProductCategoryMap(prev => ({ ...prev, [productKey]: Number(val) }))}
                                >
                                  <SelectTrigger className="flex-1" data-testid={`select-product-category-${productKey}`}>
                                    <SelectValue placeholder="Category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {allCategories.map(cat => {
                                      const Icon = getCategoryIcon(cat.name);
                                      return (
                                        <SelectItem key={cat.id} value={String(cat.id)} data-testid={`option-product-category-${cat.id}`}>
                                          <span className="flex items-center gap-1.5">
                                            <Icon className={`h-3 w-3 ${getCategoryColor(cat.name)}`} />
                                            {cat.name}
                                          </span>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  variant={isSaved ? "secondary" : "default"}
                                  onClick={() => handleSaveProduct(product)}
                                  disabled={isSaving || isSaved}
                                  className="shrink-0 gap-1"
                                  data-testid={`button-save-product-${productKey}`}
                                >
                                  {isSaving ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : isSaved ? (
                                    <>
                                      <Check className="h-3.5 w-3.5" />
                                      Saved
                                    </>
                                  ) : (
                                    <>
                                      <Save className="h-3.5 w-3.5" />
                                      Save
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {productHasMore && (
                <div className="text-center pt-2">
                  <Button
                    variant="outline"
                    onClick={handleProductLoadMore}
                    disabled={productIsSearching}
                    data-testid="button-product-load-more"
                  >
                    {productIsSearching ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Load More Products
                  </Button>
                </div>
              )}
            </div>
          )}

          {productIsSearching && productResults.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin opacity-50" />
              <p className="text-sm">Searching products...</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={addToFreezerMealId !== null} onOpenChange={(open) => { if (!open) setAddToFreezerMealId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Snowflake className="h-5 w-5 text-blue-400" />
              Add to Freezer
            </DialogTitle>
            <DialogDescription>
              {addToFreezerMealId && meals?.find(m => m.id === addToFreezerMealId)?.name
                ? `Freeze "${meals.find(m => m.id === addToFreezerMealId)!.name}" for later`
                : "Track frozen portions of this meal"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Portions</label>
              <div className="flex items-center gap-3">
                <Button size="icon" variant="outline" onClick={() => setFreezerPortions(Math.max(1, freezerPortions - 1))} data-testid="button-portions-minus">
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-2xl font-semibold w-12 text-center" data-testid="text-portions-count">{freezerPortions}</span>
                <Button size="icon" variant="outline" onClick={() => setFreezerPortions(freezerPortions + 1)} data-testid="button-portions-plus">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Batch Label (optional)</label>
              <Input
                placeholder="e.g. Sunday batch cook"
                value={freezerLabel}
                onChange={(e) => setFreezerLabel(e.target.value)}
                data-testid="input-freezer-label"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Input
                placeholder="e.g. Extra spicy version"
                value={freezerNotes}
                onChange={(e) => setFreezerNotes(e.target.value)}
                data-testid="input-freezer-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddToFreezerMealId(null)} data-testid="button-cancel-freeze">Cancel</Button>
            <Button
              className="bg-blue-500 text-white"
              disabled={addToFreezerMutation.isPending}
              onClick={() => {
                if (addToFreezerMealId) {
                  addToFreezerMutation.mutate({
                    mealId: addToFreezerMealId,
                    totalPortions: freezerPortions,
                    batchLabel: freezerLabel || undefined,
                    notes: freezerNotes || undefined,
                  });
                }
              }}
              data-testid="button-confirm-freeze"
            >
              {addToFreezerMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Snowflake className="h-4 w-4 mr-2" />
              )}
              Freeze {freezerPortions} Portions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ImportPreview {
  title: string;
  ingredients: string[];
  instructions: string[];
  imageUrl: string | null;
  nutrition: Record<string, string>;
  servings?: number;
}

function ImportRecipeDialog() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const { createMeal } = useMeals();
  const { toast } = useToast();

  const handleImport = async () => {
    if (!url.trim()) {
      toast({ title: "Error", description: "Please enter a recipe URL.", variant: "destructive" });
      return;
    }

    setIsImporting(true);
    setPreview(null);

    try {
      const res = await fetch(api.import.recipe.path, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to import recipe");
      }

      const data = await res.json();
      setPreview(data);

      if (data.ingredients.length === 0) {
        toast({
          title: "Partial Import",
          description: "We found the recipe title but couldn't extract ingredients automatically. You can add them manually after saving.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Import Failed",
        description: err.message || "Could not fetch or parse the recipe. Try a different URL.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;

    setIsSaving(true);
    try {
      await createMeal.mutateAsync({
        name: preview.title,
        ingredients: preview.ingredients.length > 0 ? preview.ingredients : ["(no ingredients extracted)"],
        instructions: preview.instructions || [],
        imageUrl: preview.imageUrl,
        nutrition: preview.nutrition && Object.keys(preview.nutrition).length > 0 ? preview.nutrition : undefined,
        sourceUrl: url.trim() || null,
        servings: preview.servings || 1,
      });

      toast({ title: "Saved", description: `"${preview.title}" added to your meals.` });
      setPreview(null);
      setUrl("");
      setOpen(false);
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Could not save the recipe.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const removeIngredient = (index: number) => {
    if (!preview) return;
    setPreview({
      ...preview,
      ingredients: preview.ingredients.filter((_, i) => i !== index),
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setUrl("");
      setPreview(null);
      setIsImporting(false);
      setIsSaving(false);
    }
  };

  const nutritionItems = preview?.nutrition ? [
    { label: 'Calories', value: preview.nutrition.calories, icon: Flame, color: 'text-orange-500' },
    { label: 'Protein', value: preview.nutrition.protein, icon: Beef, color: 'text-red-500' },
    { label: 'Carbs', value: preview.nutrition.carbs, icon: Wheat, color: 'text-amber-600' },
    { label: 'Fat', value: preview.nutrition.fat, icon: Droplets, color: 'text-yellow-500' },
  ].filter(i => i.value) : [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-import-recipe">
          <Download className="mr-2 h-4 w-4" />
          Import Recipe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Import Recipe
          </DialogTitle>
          <DialogDescription>
            Paste a recipe URL to extract the name, ingredients, and nutrition automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-3">
            <Input
              data-testid="input-import-recipe-url"
              type="url"
              placeholder="https://example.com/recipe/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleImport()}
              disabled={isImporting}
            />
            <Button
              data-testid="button-import-fetch"
              onClick={handleImport}
              disabled={isImporting || !url.trim()}
            >
              {isImporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Import
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Works best with recipe sites that list ingredients in a structured format.
          </p>
        </div>

        {preview && (
          <div className="space-y-5 pt-2">
            {preview.imageUrl && (
              <div className="w-full max-w-sm mx-auto overflow-hidden rounded-md" data-testid="container-import-preview-image">
                <img
                  src={preview.imageUrl}
                  alt={preview.title}
                  className="w-full h-auto object-cover"
                  data-testid="img-import-preview"
                  onError={(e) => {
                    const container = (e.target as HTMLImageElement).parentElement;
                    if (container) container.style.display = 'none';
                  }}
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground">Recipe Name</label>
              <p className="text-xl font-semibold mt-1" data-testid="text-import-preview-title">{preview.title}</p>
            </div>

            {nutritionItems.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nutrition (per serving)</label>
                <div className="flex flex-wrap gap-2 mt-2" data-testid="container-import-nutrition">
                  {nutritionItems.map(({ label, value, icon: Icon, color }) => (
                    <Badge key={label} variant="outline" className="gap-1.5" data-testid={`badge-import-nutrition-${label.toLowerCase()}`}>
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                      <span className="font-medium">{label}:</span> {value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Ingredients ({preview.ingredients.length})
              </label>
              {preview.ingredients.length > 0 ? (
                <ul className="mt-2 space-y-2" data-testid="list-import-preview-ingredients">
                  {preview.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                      <span className="text-sm">{ing}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIngredient(i)}
                        data-testid={`button-import-remove-ingredient-${i}`}
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  No ingredients were automatically extracted. You can save the recipe and add ingredients manually.
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                data-testid="button-import-save"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save to My Meals
              </Button>
              <Button
                variant="outline"
                data-testid="button-import-discard"
                onClick={() => {
                  setPreview(null);
                  setUrl("");
                }}
              >
                Discard
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreateMealDialog() {
  const { createMeal } = useMeals();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedDiets, setSelectedDiets] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  
  const { data: allDiets = [] } = useQuery<Diet[]>({
    queryKey: ['/api/diets'],
  });

  const { data: categories = [] } = useQuery<MealCategory[]>({
    queryKey: ['/api/categories'],
  });

  const form = useForm<InsertMeal>({
    resolver: zodResolver(insertMealSchema),
    defaultValues: {
      name: "",
      ingredients: [""],
      servings: 1,
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredients" as any
  });

  const toggleDiet = (dietId: number) => {
    setSelectedDiets(prev =>
      prev.includes(dietId) ? prev.filter(d => d !== dietId) : [...prev, dietId]
    );
  };

  const onSubmit = async (data: InsertMeal) => {
    const catName = categories.find(c => c.id === selectedCategory)?.name?.toLowerCase() || "";
    const isDrink = catName === "drink" || catName === "smoothie";
    const audience = catName === "baby meal" ? "baby" : catName === "kids meal" ? "child" : "adult";
    const cleanData = {
      ...data,
      ingredients: data.ingredients.filter(i => i.trim() !== ""),
      categoryId: selectedCategory || null,
      audience,
      isDrink,
    };
    
    createMeal.mutate(cleanData, {
      onSuccess: async (meal: any) => {
        try {
          if (selectedDiets.length > 0) {
            const url = buildUrl(api.diets.setMealDiets.path, { id: meal.id });
            await apiRequest('POST', url, { dietIds: selectedDiets });
            queryClient.invalidateQueries({ queryKey: ['/api/meals', meal.id, 'diets'] });
          }
        } catch (err) {
          console.error("Failed to set diets:", err);
        }
        setOpen(false);
        setSelectedDiets([]);
        setSelectedCategory(undefined);
        form.reset();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-meal">
          <Plus className="mr-2 h-4 w-4" />
          Add Meal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Meal</DialogTitle>
          <DialogDescription>
            Create a meal with its required ingredients.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Spicy Chicken Pasta" {...field} data-testid="input-meal-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Category</FormLabel>
              <Select
                value={selectedCategory ? String(selectedCategory) : ""}
                onValueChange={(val) => setSelectedCategory(val ? Number(val) : undefined)}
              >
                <SelectTrigger data-testid="select-meal-category">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => {
                    const Icon = getCategoryIcon(cat.name);
                    return (
                      <SelectItem key={cat.id} value={String(cat.id)} data-testid={`option-category-${cat.id}`}>
                        <span className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${getCategoryColor(cat.name)}`} />
                          {cat.name}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <FormField
              control={form.control}
              name="servings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Servings</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      placeholder="How many servings?"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                      data-testid="input-meal-servings"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {allDiets.length > 0 && (
              <div className="space-y-3">
                <FormLabel>Diet Compatibility</FormLabel>
                <div className="flex flex-wrap gap-3">
                  {allDiets.map(diet => (
                    <label
                      key={diet.id}
                      className="flex items-center gap-2 cursor-pointer"
                      data-testid={`checkbox-diet-${diet.id}`}
                    >
                      <Checkbox
                        checked={selectedDiets.includes(diet.id)}
                        onCheckedChange={() => toggleDiet(diet.id)}
                      />
                      <span className="text-sm">{diet.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <FormLabel>Ingredients</FormLabel>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Ingredient..." {...field} data-testid={`input-ingredient-${index}`} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1 && index === 0}
                      data-testid={`button-remove-ingredient-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={() => append("")}
                data-testid="button-add-ingredient"
              >
                <Plus className="mr-2 h-3 w-3" />
                Add Ingredient
              </Button>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMeal.isPending} data-testid="button-submit-meal">
                {createMeal.isPending ? "Creating..." : "Create Meal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
