import { useState, useEffect, useMemo, useRef, useCallback, Fragment } from "react";
import thaAppleLogo from "@/assets/icons/tha-apple.png";
import { useMeals } from "@/hooks/use-meals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, X, Search, ChefHat, ImageOff, Flame, Beef, Wheat, Droplets, Activity, AlertTriangle, ArrowRight, Loader2, Sparkles, Cookie, Droplet, Leaf, LayoutGrid, List, Globe, Save, Download, ShoppingCart, Minus, ShoppingBasket, Check, Package, CalendarPlus, CalendarDays, Coffee, Sun, Moon, UtensilsCrossed, Snowflake, Microscope, Baby, PersonStanding, Wine, ExternalLink, Pencil, Sliders, Camera, Mic, Share2, Zap, Layers, ScanLine, ListPlus, Info, ClipboardList, Image as ImageIcon, Wand2, ChevronDown, Users, UserPlus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CreateMealModal, type ImportedRecipeDraft } from "@/components/create-meal-modal";
import { ScanConfirmDialog } from "@/components/scan-confirm-dialog";
import BarcodeScanner from "@/components/BarcodeScanner";
import { MealCompletionDialog, type CompletionMeal } from "@/components/meal-completion-dialog";
import { IngredientRow, buildIngredientString, parseIngredientString } from "@/components/ingredient-input";
import { CameraModal } from "@/components/camera-modal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertMealSchema, type InsertMeal, type Nutrition, type Diet, type MealDiet, type MealCategory, type FreezerMeal, type Meal } from "@shared/schema";
import type { GuestEater, HouseholdEater } from "@shared/household-eater";
import { DIET_PATTERN_OPTIONS, ALLERGY_INTOLERANCE_OPTIONS } from "@/lib/diets";
import { getCategoryIcon, getCategoryColor } from "@/lib/category-utils";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { buildUrl, api } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useBasket } from "@/hooks/use-basket";
import { useLocation, useSearch } from "wouter";
import { MealWatermark, getWatermarkType } from "@/components/meal-watermark";
import ScoreBadge from "@/components/ui/score-badge";
import { Switch } from "@/components/ui/switch";
import { shouldExcludeRecipe } from "@/lib/dietRules";
import { useUser } from "@/hooks/use-user";
import { scoreMealSearch } from "@shared/food-synonyms";

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
          <span className={`text-lg font-semibold ${color}`} data-testid="text-health-score">{score}</span>
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
        <Badge key={name} variant="outline" className="text-xs font-normal gap-1 border-primary/30 text-primary" data-testid={`badge-diet-${name}`}>
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
            <span className="text-xs font-medium truncate">{value || 'N/A'}</span>
          </div>
        ))}
      </div>
      {(nutrition.source === 'openfoodfacts_estimated' || nutrition.source === 'openfoodfacts_quantities') && (
        <p className="text-[10px] text-muted-foreground/50 leading-snug">Estimated from available ingredient quantities</p>
      )}
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
            <ArrowRight className="h-4 w-4 text-primary" />
            Healthier Alternatives
          </h4>
          <div className="space-y-2">
            {analysis.swaps.map((swap, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-accent/20 border border-border" data-testid={`swap-suggestion-${i}`}>
                <Badge variant="secondary" className="text-xs">{swap.original}</Badge>
                <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">{swap.healthier}</Badge>
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

interface GroupedPartSource {
  type: "basic" | "web" | "my-meal" | "fresh" | "frozen";
  url?: string;
  displayName?: string;
  sourceName?: string;
  mealId?: number;
}

function parseGroupedSources(instructions: string[] | null | undefined): Record<string, GroupedPartSource> | null {
  if (!instructions || instructions.length === 0) return null;
  try {
    const parsed = JSON.parse(instructions[0]);
    if (parsed.__v === 1 && parsed.sources) return parsed.sources as Record<string, GroupedPartSource>;
  } catch { }
  return null;
}

function GroupedMealDetail({ meal, allMeals, tab, mealId }: {
  meal: Meal;
  allMeals: Meal[];
  tab: "ingredients" | "method";
  mealId: number;
}) {
  const sources = parseGroupedSources(meal.instructions);
  // Labels come from the sources JSON, NOT from meal.ingredients
  const components = sources
    ? Object.entries(sources).map(([label, src]) => {
        const componentMeal = src?.mealId ? allMeals.find((m) => m.id === src.mealId) ?? null : null;
        return { label, src, componentMeal };
      })
    : [];

  if (tab === "ingredients") {
    return (
      <div className="space-y-3 pb-2" data-testid={`expanded-ingredients-${mealId}`}>
        {components.map(({ label, src, componentMeal }) => (
          <div key={label}>
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 mb-1">{label}</p>
            {componentMeal && (componentMeal.ingredients ?? []).length > 0 ? (
              <div className="space-y-0.5 pl-2">
                {componentMeal.ingredients!.map((ing, i) => {
                  const parsed = parseIngredient(ing);
                  return (
                    <div key={i} className="text-sm flex gap-2 py-0.5">
                      <span className="text-muted-foreground shrink-0 w-20 text-right text-xs leading-5">{parsed.detail || ''}</span>
                      <span className="text-foreground">{parsed.name}</span>
                    </div>
                  );
                })}
              </div>
            ) : src?.type === "fresh" || src?.type === "frozen" || src?.type === "basic" ? (
              <div className="pl-2 text-sm text-foreground py-0.5">{label}</div>
            ) : (
              <p className="text-xs text-muted-foreground pl-2">No ingredients saved</p>
            )}
          </div>
        ))}
        {components.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">No components found</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-2" data-testid={`expanded-method-${mealId}`}>
      {components.map(({ label, componentMeal }) => (
        <div key={label}>
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 mb-1">{label}</p>
          {componentMeal && (componentMeal.instructions ?? []).length > 0 ? (
            <div className="space-y-1 pl-2">
              {componentMeal.instructions!.map((step, i) => (
                <div key={i} className="flex gap-2 text-sm">
                  <span className="text-primary font-semibold shrink-0 w-5 text-right">{i + 1}.</span>
                  <span className="text-foreground leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground pl-2">No method saved</p>
          )}
        </div>
      ))}
    </div>
  );
}

function MealActionBar({ mealId, mealName, ingredients, isReadyMeal, isDrink, audience, isFreezerEligible, onFreezeClick, servings, sourceUrl, mealFormat, instructions, hideEdit, hideBasket, onAddToList, showListButton, onAddToQuickList }: {
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
  mealFormat?: string | null;
  instructions?: string[] | null;
  hideEdit?: boolean;
  hideBasket?: boolean;
  onAddToList?: (ingredients: string[]) => void;
  showListButton?: boolean;
  /** When set, fires after "Who's eating?" dialog confirm instead of addToListMutation — routes to quick list. */
  onAddToQuickList?: (ingredients: string[]) => void;
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
    mutationFn: async (ctx?: { eaterIds?: number[]; guestEaters?: GuestEater[] }) => {
      const res = await apiRequest('POST', api.shoppingList.generateFromMeals.path, {
        mealSelections: [{
          mealId,
          count: qty,
          ...(ctx?.eaterIds?.length ? { eaterIds: ctx.eaterIds } : {}),
          ...(ctx?.guestEaters?.length ? { guestEaters: ctx.guestEaters } : {}),
        }],
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.sources.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.prices.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      toast({ title: "Added to shopping list", description: qty > 1 ? `${qty} × ${mealName}` : mealName });
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
  const [listContextOpen, setListContextOpen] = useState(false);

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

        <div className="flex items-center gap-1 flex-1 justify-end flex-wrap">
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
          {mealFormat === "grouped" ? (() => {
            const groupedSources = parseGroupedSources(instructions);
            const webParts = groupedSources
              ? Object.entries(groupedSources).filter(([, s]) => s.type === "web" && s.url)
              : [];
            if (webParts.length === 0) return null;
            return (
              <Tooltip>
                <Popover>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`button-grouped-sources-${mealId}`}
                      >
                        <Globe className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <PopoverContent className="w-64 p-2" align="end" side="top" onClick={(e) => e.stopPropagation()}>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Recipe sources</p>
                    <div className="space-y-1">
                      {webParts.map(([label, source]) => (
                        <a
                          key={label}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-2 text-xs rounded px-2 py-1.5 hover:bg-accent transition-colors"
                          data-testid={`link-grouped-source-${mealId}-${label}`}
                        >
                          <span className="font-medium truncate">{label}</span>
                          <span className="text-muted-foreground shrink-0 flex items-center gap-1">
                            {source.sourceName && <span className="text-[10px]">{source.sourceName}</span>}
                            <ExternalLink className="h-2.5 w-2.5" />
                          </span>
                        </a>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <TooltipContent><p className="text-xs">Recipe sources</p></TooltipContent>
              </Tooltip>
            );
          })() : sourceUrl && (
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
          {!hideEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (mealFormat === "grouped") {
                      navigate(`/meals/${mealId}`);
                    } else {
                      editCopyMutation.mutate();
                    }
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
          )}
          {!hideEdit && mealFormat === "grouped" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/quick-meal?edit=${mealId}`);
                  }}
                  data-testid={`button-build-meal-${mealId}`}
                >
                  <Layers className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">Edit in Build a Meal</p></TooltipContent>
            </Tooltip>
          )}
          {!hideBasket && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setListContextOpen(true);
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
          )}

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

        {onAddToList && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="text-primary"
                onClick={(e) => { e.stopPropagation(); onAddToList(ingredients); }}
                data-testid={`button-add-to-list-${mealId}`}
              >
                <ListPlus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">Add to quick list</p></TooltipContent>
          </Tooltip>
        )}

        {showListButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="text-primary"
                onClick={(e) => { e.stopPropagation(); setListContextOpen(true); }}
                data-testid={`button-add-to-list-${mealId}`}
              >
                <ListPlus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">Add to list</p></TooltipContent>
          </Tooltip>
        )}
        </div>
      </div>

      <AddToPlannerDialog mealId={mealId} mealName={mealName} isDrink={isDrink} audience={audience} open={plannerOpen} onOpenChange={setPlannerOpen} />

      <AddToShoppingListDialog
        mealName={mealName}
        open={listContextOpen}
        onOpenChange={setListContextOpen}
        onAdd={(ctx) => {
          addToBasket({ mealId, quantity: qty });
          if (onAddToQuickList) {
            onAddToQuickList(ingredients);
          } else {
            addToListMutation.mutate(ctx);
          }
          setListContextOpen(false);
        }}
      />

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
  // Step 1: where to add | Step 2: who's eating
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedWeeks, setSelectedWeeks] = useState<Set<number>>(new Set());
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());

  // Phase 6 context state
  const [selectedEaterIds, setSelectedEaterIds] = useState<Set<number>>(new Set());
  const [pendingGuests, setPendingGuests] = useState<GuestEater[]>([]);
  const [guestFormOpen, setGuestFormOpen] = useState(false);
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestDietTypes, setNewGuestDietTypes] = useState<Set<string>>(new Set());
  const [newGuestAllergyTypes, setNewGuestAllergyTypes] = useState<Set<string>>(new Set());

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

  const { data: householdEaters = [] } = useQuery<HouseholdEater[]>({
    queryKey: ["/api/household/eaters"],
    enabled: open,
  });

  // If the query resolves after the user has already reached step 2, seed the default selection.
  useEffect(() => {
    if (step === 2 && selectedEaterIds.size === 0 && householdEaters.length > 0) {
      setSelectedEaterIds(new Set(householdEaters.map(e => Number(e.id))));
    }
  }, [step, householdEaters]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const doAdd = async (withContext: boolean) => {
    const eaterIds = withContext && selectedEaterIds.size > 0 ? Array.from(selectedEaterIds) : undefined;
    const guests = withContext && pendingGuests.length > 0 ? pendingGuests : undefined;
    for (const a of assignments) {
      await apiRequest("POST", `/api/planner/days/${a.dayId}/items`, {
        mealSlot: a.mealType,
        audience: a.audience,
        mealId,
        isDrink: a.isDrink,
        position: 0,
        ...(eaterIds ? { eaterIds } : {}),
        ...(guests ? { guestEaters: guests } : {}),
      });
    }
  };

  const addMutation = useMutation({
    mutationFn: (withContext: boolean) => doAdd(withContext),
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
    setStep(1);
    setSelectedWeeks(new Set());
    setSelectedDays(new Set());
    setSelectedSlots(new Set());
    setSelectedEaterIds(new Set());
    setPendingGuests([]);
    setGuestFormOpen(false);
    setNewGuestName("");
    setNewGuestDietTypes(new Set());
    setNewGuestAllergyTypes(new Set());
  };

  const addPendingGuest = () => {
    const name = newGuestName.trim();
    if (!name) return;
    const guest: GuestEater = {
      id: crypto.randomUUID(),
      displayName: name,
      dietTypes: Array.from(newGuestDietTypes),
      hardRestrictions: Array.from(newGuestAllergyTypes),
    };
    setPendingGuests(prev => [...prev, guest]);
    setNewGuestName("");
    setNewGuestDietTypes(new Set());
    setNewGuestAllergyTypes(new Set());
    setGuestFormOpen(false);
  };

  const audienceLabel = resolvedAudience === "baby" ? "Baby" : resolvedAudience === "child" ? "Child" : "";

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); else onOpenChange(v); }}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{step === 1 ? "Add to Planner" : "Who's eating this meal?"}</DialogTitle>
            {step === 1 && (
              <p className="text-sm text-muted-foreground">
                Assign <span className="font-medium text-foreground">{mealName}</span>
                {isDrink && <Badge variant="secondary" className="ml-1.5 text-[10px]"><Wine className="h-3 w-3 mr-0.5" />Drink</Badge>}
                {audienceLabel && <Badge variant="secondary" className="ml-1.5 text-[10px]">{audienceLabel}</Badge>}
                {" "}to one or more weeks, days{!isDrink && ", and meal slots"}.
              </p>
            )}
            {step === 2 && (
              <p className="text-sm text-muted-foreground">Optional — skip to add without context.</p>
            )}
          </DialogHeader>

          {/* ── Step 1: where ── */}
          {step === 1 && (
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
          )}

          {/* ── Step 2: who's eating ── */}
          {step === 2 && (
            <div className="flex-1 overflow-y-auto space-y-5">
              {/* Household eaters */}
              {householdEaters.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Household</label>
                  <div className="space-y-1.5">
                    {householdEaters.map(eater => {
                      const eaterId = Number(eater.id);
                      const checked = selectedEaterIds.has(eaterId);
                      return (
                        <label
                          key={eater.id}
                          className="flex items-center gap-2.5 p-2 rounded-md border border-border cursor-pointer hover-elevate"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                              setSelectedEaterIds(prev => {
                                const next = new Set(prev);
                                v ? next.add(eaterId) : next.delete(eaterId);
                                return next;
                              });
                            }}
                          />
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{eater.displayName}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Guests */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Guests</label>
                  {!guestFormOpen && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => setGuestFormOpen(true)}
                    >
                      <UserPlus className="h-3 w-3 mr-1" />Add guest
                    </Button>
                  )}
                </div>

                {guestFormOpen && (
                  <div className="space-y-2 p-3 rounded-md border border-border">
                    <input
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                      placeholder="Guest name"
                      value={newGuestName}
                      onChange={e => setNewGuestName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addPendingGuest(); } }}
                      autoFocus
                    />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Diet pattern (optional)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {DIET_PATTERN_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setNewGuestDietTypes(prev => {
                              const next = new Set(prev);
                              next.has(opt.value) ? next.delete(opt.value) : next.add(opt.value);
                              return next;
                            })}
                            className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${newGuestDietTypes.has(opt.value) ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background"}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Allergies &amp; intolerances (optional)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ALLERGY_INTOLERANCE_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setNewGuestAllergyTypes(prev => {
                              const next = new Set(prev);
                              next.has(opt.value) ? next.delete(opt.value) : next.add(opt.value);
                              return next;
                            })}
                            className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${newGuestAllergyTypes.has(opt.value) ? "bg-destructive text-destructive-foreground border-destructive" : "border-border bg-background"}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs" onClick={addPendingGuest} disabled={!newGuestName.trim()}>Add</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setGuestFormOpen(false); setNewGuestName(""); setNewGuestDietTypes(new Set()); setNewGuestAllergyTypes(new Set()); }}>Cancel</Button>
                    </div>
                  </div>
                )}

                {pendingGuests.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {pendingGuests.map(g => (
                      <div key={g.id} className="flex items-center justify-between px-2 py-1.5 rounded-md border border-border text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span>{g.displayName}</span>
                          {g.dietTypes.length > 0 && (
                            <span className="text-xs text-muted-foreground truncate">{g.dietTypes.join(", ")}</span>
                          )}
                          {g.hardRestrictions.length > 0 && (
                            <span className="text-xs text-destructive/70 truncate">⚠ {g.hardRestrictions.join(", ")}</span>
                          )}
                        </div>
                        <button onClick={() => setPendingGuests(prev => prev.filter(x => x.id !== g.id))} className="text-muted-foreground hover:text-foreground shrink-0">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {pendingGuests.length === 0 && !guestFormOpen && (
                  <p className="text-xs text-muted-foreground">No guests added.</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            {step === 1 && (
              <>
                <Button variant="outline" onClick={resetState}>Cancel</Button>
                <Button
                  disabled={assignments.length === 0 || addMutation.isPending}
                  onClick={() => {
                    setSelectedEaterIds(new Set(householdEaters.map(e => Number(e.id))));
                    setStep(2);
                  }}
                  data-testid="button-confirm-add-planner"
                >
                  Next <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </>
            )}
            {step === 2 && (
              <>
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button
                  variant="ghost"
                  disabled={addMutation.isPending}
                  onClick={() => addMutation.mutate(false)}
                  data-testid="button-skip-context"
                >
                  Skip
                </Button>
                <Button
                  disabled={addMutation.isPending}
                  onClick={() => addMutation.mutate(true)}
                  data-testid="button-assign-with-context"
                >
                  {addMutation.isPending ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Assigning...</> : `Assign`}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AddToShoppingListDialog({ mealName, open, onOpenChange, onAdd }: {
  mealName: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (ctx?: { eaterIds?: number[]; guestEaters?: GuestEater[] }) => void;
}) {
  const [selectedEaterIds, setSelectedEaterIds] = useState<Set<number>>(new Set());
  const [pendingGuests, setPendingGuests] = useState<GuestEater[]>([]);
  const [guestFormOpen, setGuestFormOpen] = useState(false);
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestDietTypes, setNewGuestDietTypes] = useState<Set<string>>(new Set());
  const [newGuestAllergyTypes, setNewGuestAllergyTypes] = useState<Set<string>>(new Set());

  const { data: householdEaters = [] } = useQuery<HouseholdEater[]>({
    queryKey: ["/api/household/eaters"],
    enabled: open,
  });

  // Pre-select all household eaters when dialog opens (or query resolves)
  useEffect(() => {
    if (open && householdEaters.length > 0 && selectedEaterIds.size === 0) {
      setSelectedEaterIds(new Set(householdEaters.map(e => Number(e.id))));
    }
  }, [open, householdEaters]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    setSelectedEaterIds(new Set());
    setPendingGuests([]);
    setGuestFormOpen(false);
    setNewGuestName("");
    setNewGuestDietTypes(new Set());
    setNewGuestAllergyTypes(new Set());
  };

  const addPendingGuest = () => {
    const name = newGuestName.trim();
    if (!name) return;
    const guest: GuestEater = {
      id: crypto.randomUUID(),
      displayName: name,
      dietTypes: Array.from(newGuestDietTypes),
      hardRestrictions: Array.from(newGuestAllergyTypes),
    };
    setPendingGuests(prev => [...prev, guest]);
    setNewGuestName("");
    setNewGuestDietTypes(new Set());
    setNewGuestAllergyTypes(new Set());
    setGuestFormOpen(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Who's eating this meal?</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Optional — skip to add <span className="font-medium text-foreground">{mealName}</span> without context.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5">
          {/* Household eaters */}
          {householdEaters.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Household</label>
              <div className="space-y-1.5">
                {householdEaters.map(eater => {
                  const eaterId = Number(eater.id);
                  const checked = selectedEaterIds.has(eaterId);
                  return (
                    <label
                      key={eater.id}
                      className="flex items-center gap-2.5 p-2 rounded-md border border-border cursor-pointer hover-elevate"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          setSelectedEaterIds(prev => {
                            const next = new Set(prev);
                            v ? next.add(eaterId) : next.delete(eaterId);
                            return next;
                          });
                        }}
                      />
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{eater.displayName}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Guests */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Guests</label>
              {!guestFormOpen && (
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setGuestFormOpen(true)}>
                  <UserPlus className="h-3 w-3 mr-1" />Add guest
                </Button>
              )}
            </div>

            {guestFormOpen && (
              <div className="space-y-2 p-3 rounded-md border border-border">
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Guest name"
                  value={newGuestName}
                  onChange={e => setNewGuestName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addPendingGuest(); } }}
                  autoFocus
                />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Diet pattern (optional)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DIET_PATTERN_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNewGuestDietTypes(prev => {
                          const next = new Set(prev);
                          next.has(opt.value) ? next.delete(opt.value) : next.add(opt.value);
                          return next;
                        })}
                        className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${newGuestDietTypes.has(opt.value) ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Allergies &amp; intolerances (optional)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ALLERGY_INTOLERANCE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNewGuestAllergyTypes(prev => {
                          const next = new Set(prev);
                          next.has(opt.value) ? next.delete(opt.value) : next.add(opt.value);
                          return next;
                        })}
                        className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${newGuestAllergyTypes.has(opt.value) ? "bg-destructive text-destructive-foreground border-destructive" : "border-border bg-background"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs" onClick={addPendingGuest} disabled={!newGuestName.trim()}>Add</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setGuestFormOpen(false); setNewGuestName(""); setNewGuestDietTypes(new Set()); setNewGuestAllergyTypes(new Set()); }}>Cancel</Button>
                </div>
              </div>
            )}

            {pendingGuests.length > 0 && (
              <div className="mt-2 space-y-1">
                {pendingGuests.map(g => (
                  <div key={g.id} className="flex items-center justify-between px-2 py-1.5 rounded-md border border-border text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span>{g.displayName}</span>
                      {g.dietTypes.length > 0 && (
                        <span className="text-xs text-muted-foreground truncate">{g.dietTypes.join(", ")}</span>
                      )}
                      {g.hardRestrictions.length > 0 && (
                        <span className="text-xs text-destructive/70 truncate">⚠ {g.hardRestrictions.join(", ")}</span>
                      )}
                    </div>
                    <button onClick={() => setPendingGuests(prev => prev.filter(x => x.id !== g.id))} className="text-muted-foreground hover:text-foreground shrink-0">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {pendingGuests.length === 0 && !guestFormOpen && (
              <p className="text-xs text-muted-foreground">No guests added.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button
            variant="ghost"
            onClick={() => { reset(); onAdd(undefined); }}
          >
            Skip
          </Button>
          <Button
            onClick={() => {
              const ctx = {
                eaterIds: selectedEaterIds.size > 0 ? Array.from(selectedEaterIds) : undefined,
                guestEaters: pendingGuests.length > 0 ? pendingGuests : undefined,
              };
              reset();
              onAdd(ctx);
            }}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    thaRating: number;
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

function WebPreviewActionBar({ recipe, importedMealId, importedMeal, onImport, nutritionMap, onFreezeClick, onAddToList, showListButton, onAddToQuickList }: {
  recipe: WebSearchRecipe;
  importedMealId: number | null;
  importedMeal: any;
  onImport: (recipe: WebSearchRecipe) => Promise<number | null>;
  nutritionMap: Map<number, any>;
  onFreezeClick?: () => void;
  onAddToList?: (ingredients: string[]) => void;
  showListButton?: boolean;
  onAddToQuickList?: (ingredients: string[]) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [importing, setImporting] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [localMealId, setLocalMealId] = useState<number | null>(importedMealId);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [listContextOpen, setListContextOpen] = useState(false);
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

  const handleBasket = () => {
    setListContextOpen(true);
  };

  const doAddToList = async (ctx?: { eaterIds?: number[]; guestEaters?: GuestEater[] }) => {
    setPendingAction("basket");
    const mealId = await ensureImported();
    if (!mealId) { setPendingAction(null); return; }
    try {
      addToBasket({ mealId, quantity: 1 });
      const res = await apiRequest('POST', api.shoppingList.generateFromMeals.path, {
        mealSelections: [{
          mealId,
          count: 1,
          ...(ctx?.eaterIds?.length ? { eaterIds: ctx.eaterIds } : {}),
          ...(ctx?.guestEaters?.length ? { guestEaters: ctx.guestEaters } : {}),
        }],
      });
      await res.json();
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.sources.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.prices.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      toast({ title: "Added to shopping list", description: recipe.name });
    } catch {
      toast({ title: "Failed to add to basket", variant: "destructive" });
    }
    setPendingAction(null);
  };

  const handleAddToList = async () => {
    if (!onAddToList && !showListButton) return;
    if (showListButton) {
      setListContextOpen(true);
      return;
    }
    setPendingAction("list");
    // Import the meal to cookbook first (no-op if already imported)
    const mealId = await ensureImported();
    if (!mealId) { setPendingAction(null); return; }
    const ingredients = importedMeal?.ingredients || recipe.ingredients || [];
    onAddToList!(ingredients);
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
          isFreezerEligible={!!importedMeal.isFreezerEligible}
          onFreezeClick={onFreezeClick ?? (() => {})}
          servings={importedMeal.servings || 1}
          sourceUrl={recipe.url || null}
          onAddToList={onAddToList}
          showListButton={showListButton}
          onAddToQuickList={onAddToQuickList}
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
        {(onAddToList || showListButton) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="text-primary"
                onClick={handleAddToList}
                disabled={isDisabled}
                data-testid={`button-web-add-to-list-${recipe.id}`}
              >
                {pendingAction === "list" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListPlus className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">Add to list</p></TooltipContent>
          </Tooltip>
        )}
      </div>

      {localMealId && (
        <AddToPlannerDialog mealId={localMealId} mealName={recipe.name} isDrink={false} audience="adult" open={plannerOpen} onOpenChange={setPlannerOpen} />
      )}

      <AddToShoppingListDialog
        mealName={recipe.name}
        open={listContextOpen}
        onOpenChange={setListContextOpen}
        onAdd={(ctx) => {
          setListContextOpen(false);
          if (onAddToQuickList) {
            const ingredients = importedMeal?.ingredients || recipe.ingredients || [];
            onAddToQuickList(ingredients);
          } else {
            doAddToList(ctx);
          }
        }}
      />

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

const MEAL_CATEGORY_ORDER = ["user_meals", "from_web", "tha_meals", "drinks", "ready_meals"] as const;
const SECTION_LABELS: Record<string, string> = {
  user_meals: "My Recipes",
  from_web: "Recipes from the Web",
  tha_meals: "Wholefood Suggestions",
  ready_meals: "Packaged & Processed",
  drinks: "Drinks",
};
const CATEGORY_DROPDOWN_ORDER = ["Drink", "Smoothie", "Baby Meal", "Kids Meal", "Frozen Meal"];

function getMealDisplayCategory(meal: Meal): string {
  if (meal.isDrink || meal.mealFormat === "drink") return "drinks";
  if (meal.isReadyMeal || meal.mealFormat === "ready-meal") return "ready_meals";
  if (meal.mealSourceType === "openfoodfacts") return "ready_meals";
  if (meal.isSystemMeal) return "tha_meals";
  if (meal.sourceUrl) return "from_web";
  return "user_meals";
}

export default function MealsPage() {
  const { meals, isLoading, deleteMeal, createMeal } = useMeals();
  const { user } = useUser();
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState(() => {
    const params = new URLSearchParams(searchStr);
    return params.get("q") || "";
  });
  const [searchSource, setSearchSource] = useState<"all" | "recipes" | "products">("all");
  const [viewMode, setViewMode] = useViewPreference();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeGroups, setActiveGroups] = useState<Set<string>>(() => new Set(["cookbook", "recipes", "freezer"]));
  const toggleGroup = (group: string) => setActiveGroups(prev => { const n = new Set(prev); n.has(group) ? n.delete(group) : n.add(group); return n; });
  const [activeAudiences, setActiveAudiences] = useState<Set<string>>(() => new Set(["adult", "drinks"]));
  const toggleAudience = (a: string) => setActiveAudiences(prev => {
    const n = new Set(prev);
    n.has(a) ? n.delete(a) : n.add(a);
    return n.size === 0 ? new Set(["adult"]) : n; // fallback: never empty
  });
  const [matchMyProfile, setMatchMyProfile] = useState<boolean>(false);
  const [mealsDietPattern, setMealsDietPattern] = useState<string>("");
  const [mealsDietRestrictions, setMealsDietRestrictions] = useState<string[]>([]);
  const [mealsUpfFilter, setMealsUpfFilter] = useState<boolean>(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [webDietPattern, setWebDietPattern] = useState<string>("");
  const [webDietRestrictions, setWebDietRestrictions] = useState<string[]>([]);
  const [webSearchResults, setWebSearchResults] = useState<WebSearchRecipe[]>([]);
  const [webHasMore, setWebHasMore] = useState(false);
  const [webCurrentPage, setWebCurrentPage] = useState(1);
  const [webIsSearching, setWebIsSearching] = useState(false);
  const [webSearchQuery, setWebSearchQuery] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [scanData, setScanData] = useState<{ rawText: string; parsed: any } | null>(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const scanFileRef = useRef<HTMLInputElement>(null);
  const [visibleCount, setVisibleCount] = useState(48);
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
  const [barcodeScanOpen, setBarcodeScanOpen] = useState(false);
  const [barcodeFetching, setBarcodeFetching] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState<ProductSearchResult | null>(null);
  const [barcodeProductOpen, setBarcodeProductOpen] = useState(false);
  const [barcodeSaving, setBarcodeSaving] = useState(false);
  const { data: allCategories = [] } = useQuery<MealCategory[]>({
    queryKey: ['/api/categories'],
  });
  const queryClient = useQueryClient();
  const { data: freezerMeals = [], refetch: refetchFreezer } = useQuery<FreezerMeal[]>({
    queryKey: ['/api/freezer'],
  });
  const [addToFreezerMealId, setAddToFreezerMealId] = useState<number | null>(null);
  const [expandedMealId, setExpandedMealId] = useState<number | string | null>(null);
  const [generatingImageFor, setGeneratingImageFor] = useState<number | null>(null);
  const [webPreviewCache, setWebPreviewCache] = useState<Record<string, { ingredients: string[]; instructions: string[]; loading?: boolean; error?: string }>>({});

  const [expandedTab, setExpandedTab] = useState<"ingredients" | "method">("ingredients");
  const [freezerPortions, setFreezerPortions] = useState(4);
  const [freezerLabel, setFreezerLabel] = useState("");
  const [freezerNotes, setFreezerNotes] = useState("");

  const isFromList = useMemo(() => new URLSearchParams(searchStr).get("from") === "list", [searchStr]);

  const handleGenerateMealImage = useCallback(async (meal: Meal) => {
    setGeneratingImageFor(meal.id);
    try {
      const res = await apiRequest("POST", buildUrl(api.meals.generateImage.path, { id: meal.id }));
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Image generation failed", description: (err as any).message || "We couldn't generate an image right now. Try again.", variant: "destructive" });
        return;
      }
      const updated: Meal = await res.json();
      // Update the meal in the query cache immediately
      queryClient.setQueryData<Meal[]>([api.meals.list.path], (prev) =>
        prev ? prev.map(m => m.id === updated.id ? updated : m) : prev
      );
      toast({ title: "Image generated", description: `Photo added to "${updated.name}".` });
    } catch {
      toast({ title: "Image generation failed", description: "We couldn't generate an image right now. Try again.", variant: "destructive" });
    } finally {
      setGeneratingImageFor(null);
    }
  }, [queryClient, toast]);

  const handleAddToListFromCookbook = useCallback(async (ingredients: string[]) => {
    try {
      let payload: unknown;
      try {
        const parseRes = await apiRequest("POST", api.import.parse.path, {
          source: "ingredients",
          rawText: ingredients.join("\n"),
          hint: "recipe",
        });
        const { items } = (await parseRes.json()) as { items: unknown[] };
        payload = { version: 2, items };
      } catch {
        // Parse endpoint failed — fall back to raw strings (version 1)
        payload = ingredients;
      }
      localStorage.setItem("tha-pending-list-ingredients", JSON.stringify(payload));
    } catch {}
    if (isFromList) {
      navigate("/list");
    } else {
      toast({ title: "Added to your list", description: "Open List to see and edit your quick list." });
    }
  }, [navigate, isFromList, toast]);

  useEffect(() => {
    const params = new URLSearchParams(searchStr);
    const q = params.get("q") || "";
    if (q) setSearchTerm(q);
  }, [searchStr]);

  useEffect(() => {
    setVisibleCount(48);
  }, [searchTerm, categoryFilter, activeGroups, activeAudiences, mealsDietPattern, mealsDietRestrictions, mealsUpfFilter]);

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
      toast({ title: "Added to freezer" });
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
      toast({ title: "Portion used" });
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

  const handleScanFile = async (file: File) => {
    setScanLoading(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch("/api/scan", { method: "POST", body: formData, credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Scan failed", description: data.message || "Could not read image." });
        return;
      }
      setScanData(data);
      setScanDialogOpen(true);
    } catch {
      toast({ variant: "destructive", title: "Scan failed", description: "Could not connect to server. Please try again." });
    } finally {
      setScanLoading(false);
      if (scanFileRef.current) scanFileRef.current.value = "";
    }
  };

  const { data: importStatus, isLoading: importStatusLoading } = useQuery<{ totalImported: number; byCategory: Record<string, number> }>({
    queryKey: ['/api/admin/import-status'],
    retry: false,
    staleTime: Infinity,
  });

  const { data: userProfile } = useQuery<any>({
    queryKey: ['/api/profile'],
    retry: false,
  });

  useEffect(() => {
    if (!matchMyProfile || !userProfile) return;
    const pattern = userProfile.dietPattern ?? "";
    const restrictions: string[] = userProfile.dietRestrictions ?? [];
    const upfSens = userProfile.upfSensitivity ?? "flexible";
    const upfOn = upfSens === "strict" || upfSens === "moderate";
    setMealsDietPattern(pattern);
    setMealsDietRestrictions(restrictions);
    setMealsUpfFilter(upfOn);
    setWebDietPattern(pattern);
    setWebDietRestrictions(restrictions);
  }, [matchMyProfile, userProfile]);

  useEffect(() => {
    if (!matchMyProfile) {
      setMealsDietPattern("");
      setMealsDietRestrictions([]);
      setMealsUpfFilter(false);
      setWebDietPattern("");
      setWebDietRestrictions([]);
    }
  }, [matchMyProfile]);

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
      const patternParam = webDietPattern ? `&dietPattern=${encodeURIComponent(webDietPattern)}` : '';
      const restrictionsParam = webDietRestrictions.length
        ? `&dietRestrictions=${encodeURIComponent(webDietRestrictions.join(','))}`
        : '';
      const dietParam = patternParam + restrictionsParam;
      const res = await fetch(`/api/search-recipes?q=${encodeURIComponent(query)}&page=${page}${dietParam}`, { signal });
      if (!res.ok) throw new Error("Search failed");
      const data: { recipes: WebSearchRecipe[]; hasMore: boolean } = await res.json();
      const PREMIUM_MARKER = "This is a premium piece of content available to subscribed users.";
      const filtered = data.recipes.filter(r => {
        const allText = [r.name, r.category, r.cuisine, ...(r.ingredients || []), ...(r.instructions || [])].filter(Boolean).join("\0");
        return !allText.includes(PREMIUM_MARKER);
      });
      if (page === 1) {
        setWebSearchResults(filtered);
      } else {
        setWebSearchResults(prev => [...prev, ...filtered]);
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
      }, 200);
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
  }, [searchTerm, webDietPattern, webDietRestrictions]);

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
        thaRating: product.upfAnalysis?.thaRating ?? 3,
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

  const handleCookbookBarcodeScan = async (barcode: string) => {
    setBarcodeScanOpen(false);
    setBarcodeFetching(true);
    try {
      const res = await fetch(`/api/products/barcode/${barcode}`, { credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const scanStatus = body.scanStatus as string | undefined;
        if (scanStatus === 'timeout' || res.status === 504) {
          toast({ title: "Timeout", description: "The lookup timed out. Please try again.", variant: "destructive" });
        } else if (res.status === 404) {
          toast({ title: "Not found", description: "This barcode wasn't found in Open Food Facts.", variant: "destructive" });
        } else {
          toast({ title: "Scan error", description: "Something went wrong during barcode lookup.", variant: "destructive" });
        }
        return;
      }
      const data = await res.json();
      if (data.product) {
        setBarcodeProduct(data.product);
        setBarcodeProductOpen(true);
      } else {
        toast({ title: "Not found", description: "This barcode wasn't found in Open Food Facts.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Scan error", description: "Something went wrong during barcode lookup.", variant: "destructive" });
    } finally {
      setBarcodeFetching(false);
    }
  };

  const handleSaveBarcodeProduct = async () => {
    if (!barcodeProduct) return;
    setBarcodeSaving(true);
    try {
      const cats = barcodeProduct.categories_tags || [];
      const isDrink = cats.some((c: string) => c.includes('beverages') || c.includes('drinks') || c.includes('waters') || c.includes('juices') || c.includes('sodas') || c.includes('teas') || c.includes('coffees'));
      const isBabyFood = cats.some((c: string) => c.includes('baby') || c.includes('infant'));
      const isReadyMeal = cats.some((c: string) => c.includes('meals') || c.includes('ready') || c.includes('prepared') || c.includes('frozen'));
      await apiRequest('POST', api.meals.saveProduct.path, {
        barcode: barcodeProduct.barcode,
        name: barcodeProduct.product_name,
        brand: barcodeProduct.brand,
        imageUrl: barcodeProduct.image_url,
        nutrition: barcodeProduct.nutriments,
        nutriscoreGrade: barcodeProduct.nutriscore_grade,
        novaGroup: barcodeProduct.nova_group,
        thaRating: barcodeProduct.upfAnalysis?.thaRating ?? 3,
        isDrink,
        isBabyFood,
        isReadyMeal,
        quantity: barcodeProduct.quantity,
        categoryId: null,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/meals'] });
      setActiveGroups(prev => { const n = new Set(prev); n.add("packaged"); return n; });
      toast({ title: "Product saved", description: `${barcodeProduct.product_name} added to your Cookbook.` });
      setBarcodeProductOpen(false);
      setBarcodeProduct(null);
    } catch {
      toast({ title: "Save failed", description: "Could not save product. Please try again.", variant: "destructive" });
    } finally {
      setBarcodeSaving(false);
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
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.message || 'Import failed');
        }
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
      toast({ title: "Recipe saved", description: recipe.name });
      return result?.id ?? null;
    } catch (err: any) {
      toast({ title: "Import failed", description: err?.message || "Could not import this recipe.", variant: "destructive" });
      return null;
    } finally {
      setWebImportingIds(prev => {
        const next = new Set(prev);
        next.delete(recipe.id);
        return next;
      });
    }
  };


  const filteredMeals = useMemo(() => {
    const activeSearch = searchTerm.trim().length >= 2;
    const q = searchTerm.trim();

    const filtered = meals?.filter(meal => {
      // Demo mode: never show drinks
      if (user?.isDemo && (meal.isDrink || meal.mealFormat === "drink")) return false;
      // "Recipes" source: hide user-created meals so only web/system meals show
      if (activeSearch && searchSource === "recipes" && getMealDisplayCategory(meal) === "user_meals") return false;
      // Fuzzy + synonym search
      const matchesSearch = !activeSearch || scoreMealSearch({ name: meal.name, ingredients: meal.ingredients }, q) > 0;
      const matchesCategory = categoryFilter === "all" ||
        (allCategories.find(c => c.name === categoryFilter)?.id === meal.categoryId);
      const cat = getMealDisplayCategory(meal);
      let matchesGroup = true;
      if (cat === "user_meals") matchesGroup = activeGroups.has("cookbook");
      // user-imported web recipes are part of the user's cookbook AND show under "Recipes"
      else if (cat === "from_web") matchesGroup = activeGroups.has("cookbook") || activeGroups.has("recipes");
      else if (cat === "tha_meals") matchesGroup = activeGroups.has("recipes");
      else if (cat === "ready_meals") matchesGroup = activeGroups.has("packaged");
      else if (cat === "drinks") matchesGroup = activeGroups.has("cookbook") || activeGroups.has("recipes");
      const eff = activeAudiences.size === 0 ? new Set(["adult"]) : activeAudiences;
      let matchesAudience = false;
      if (meal.isDrink) {
        matchesAudience = eff.has("drinks");
      } else if (meal.audience === "adult") {
        matchesAudience = eff.has("adult");
      } else if (meal.audience === "baby") {
        matchesAudience = eff.has("baby");
      } else if (meal.audience === "child") {
        matchesAudience = eff.has("child");
      } else {
        matchesAudience = eff.has("adult") || eff.has("baby") || eff.has("child");
      }
      const effectivePattern = mealsDietPattern.trim() || null;
      const ctx = { dietPattern: effectivePattern, dietRestrictions: mealsDietRestrictions };
      const mealText = [meal.name, ...(meal.ingredients ?? [])].join(' ').toLowerCase();
      const matchesDiet = !shouldExcludeRecipe(mealText, ctx);
      const matchesUpf = !mealsUpfFilter || meal.isReadyMeal !== true;
      return matchesSearch && matchesCategory && matchesGroup && matchesAudience && matchesDiet && matchesUpf;
    });

    if (!filtered) return filtered;

    // Pre-compute relevance scores once (avoids repeated calls inside the comparator)
    const scoreCache = new Map<number, number>();
    if (activeSearch) {
      filtered.forEach(m => {
        scoreCache.set(m.id, scoreMealSearch({ name: m.name, ingredients: m.ingredients }, q));
      });
    }

    return filtered.sort((a, b) => {
      // When searching: rank by relevance first
      if (activeSearch) {
        const diff = (scoreCache.get(b.id) ?? 0) - (scoreCache.get(a.id) ?? 0);
        if (diff !== 0) return diff;
      }
      const catA = getMealDisplayCategory(a);
      const catB = getMealDisplayCategory(b);
      const idxA = MEAL_CATEGORY_ORDER.indexOf(catA as typeof MEAL_CATEGORY_ORDER[number]);
      const idxB = MEAL_CATEGORY_ORDER.indexOf(catB as typeof MEAL_CATEGORY_ORDER[number]);
      const orderA = idxA === -1 ? MEAL_CATEGORY_ORDER.length : idxA;
      const orderB = idxB === -1 ? MEAL_CATEGORY_ORDER.length : idxB;
      if (catA === "ready_meals" && catB === "ready_meals") {
        const ingA = a.ingredients?.length ?? 999;
        const ingB = b.ingredients?.length ?? 999;
        return ingA - ingB || a.name.localeCompare(b.name);
      }
      const catOrder = orderA - orderB;
      if (catOrder !== 0) return catOrder;
      // No active search: within the same category, meals with images come first
      if (!activeSearch) {
        const imgA = a.imageUrl ? 0 : 1;
        const imgB = b.imageUrl ? 0 : 1;
        if (imgA !== imgB) return imgA - imgB;
      }
      return a.name.localeCompare(b.name);
    });
  }, [meals, searchTerm, categoryFilter, allCategories, activeGroups, activeAudiences, mealsDietPattern, mealsDietRestrictions, mealsUpfFilter, searchSource, user]);

  const visibleMeals = useMemo(() => filteredMeals?.slice(0, visibleCount), [filteredMeals, visibleCount]);

  const sectionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    filteredMeals?.forEach(m => {
      const cat = getMealDisplayCategory(m);
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    });
    return counts;
  }, [filteredMeals]);

  const showSectionHeaders = useMemo(() => {
    if (!filteredMeals?.length) return false;
    const cats = new Set(filteredMeals.map(getMealDisplayCategory));
    return cats.size > 1;
  }, [filteredMeals]);

  const allMealIds = useMemo(() => (visibleMeals || []).map(m => m.id), [visibleMeals]);
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

  const audienceChanged = !["adult", "drinks"].every(a => activeAudiences.has(a)) || activeAudiences.size !== 2;
  const advancedFilterCount =
    (matchMyProfile ? 1 : 0) +
    (mealsDietPattern ? 1 : 0) +
    mealsDietRestrictions.length +
    (mealsUpfFilter ? 1 : 0) +
    (audienceChanged ? 1 : 0);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden">
      {/* "from list" mode banner */}
      {isFromList && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 mb-4" data-testid="banner-add-to-list-mode">
          <ListPlus className="h-4 w-4 text-primary shrink-0" />
          <p className="flex-1 text-sm text-foreground/80">
            Tap <ListPlus className="inline h-3.5 w-3.5 text-primary mx-0.5" /> on any meal to add its ingredients to your quick list.
          </p>
          <button
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            onClick={() => navigate("/list")}
            aria-label="Back to list"
            data-testid="button-back-to-list"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Row A: compact title + action buttons */}
      <div className="flex justify-between items-center gap-4 mb-3">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2" data-testid="text-meals-title">
          <ChefHat className="h-5 w-5 text-primary" />
          Cookbook
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <input
            ref={scanFileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            data-testid="input-scan-file"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleScanFile(f); }}
          />
          <Button
            variant="outline"
            size="sm"
            title="Build a Meal"
            className="px-2 sm:px-3"
            onClick={() => navigate("/quick-meal")}
            data-testid="button-quick-meal"
          >
            <Zap className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Build a Meal</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            title="Scan Product"
            className="px-2 sm:px-3"
            onClick={() => setBarcodeScanOpen(true)}
            disabled={barcodeFetching}
            data-testid="button-scan-product"
          >
            {barcodeFetching ? (
              <Loader2 className="h-4 w-4 sm:mr-1.5 animate-spin" />
            ) : (
              <ScanLine className="h-4 w-4 sm:mr-1.5" />
            )}
            <span className="hidden sm:inline">Scan Product</span>
          </Button>
          <CreateMealDialog onScan={() => setCameraModalOpen(true)} onMealCreated={(_, hasSourceUrl) => { setActiveGroups(prev => { const n = new Set(prev); n.add(hasSourceUrl ? "recipes" : "cookbook"); return n; }); }} />
          {!importStatusLoading && (!importStatus || importStatus.totalImported === 0) && (
            <Button
              variant="outline"
              size="sm"
              title="Import Library"
              className="px-2 sm:px-3"
              onClick={() => importLibraryMutation.mutate()}
              disabled={importLibraryMutation.isPending}
              data-testid="button-import-library"
            >
              {importLibraryMutation.isPending ? (
                <Loader2 className="h-4 w-4 sm:mr-1.5 animate-spin" />
              ) : (
                <Download className="h-4 w-4 sm:mr-1.5" />
              )}
              <span className="hidden sm:inline">{importLibraryMutation.isPending ? "Importing..." : "Import Library"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Row B: search + category */}
      <div className="flex w-full gap-3 items-center mb-3">
        <div className="relative flex-1">
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
          <SelectTrigger className="w-[130px] shrink-0" data-testid="select-category-filter">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {[...allCategories].sort((a, b) => {
              const ia = CATEGORY_DROPDOWN_ORDER.indexOf(a.name);
              const ib = CATEGORY_DROPDOWN_ORDER.indexOf(b.name);
              return (ia === -1 ? CATEGORY_DROPDOWN_ORDER.length : ia) - (ib === -1 ? CATEGORY_DROPDOWN_ORDER.length : ib);
            }).map(cat => (
              <SelectItem key={cat.id} value={cat.name} data-testid={`option-category-${cat.name}`}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {user?.isDemo && !searchTerm.trim() && (
        <div className="mb-3 p-3 rounded-lg bg-primary/5 border border-primary/15 flex items-start gap-3" data-testid="demo-cookbook-intro">
          <ChefHat className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Find recipes from across the web</p>
            <p className="text-xs text-muted-foreground mt-0.5">Type a meal name above to search thousands of recipes — pasta, chicken curry, stir fry, anything you're craving.</p>
          </div>
        </div>
      )}

      {searchTerm.trim().length >= 2 && (
        <div className="flex items-center gap-2 mb-4 min-w-0" data-testid="search-source-tabs">
          <span className="text-sm text-muted-foreground mr-1 hidden sm:inline shrink-0">Show:</span>
          <div className="flex border border-border rounded-md shrink-0">
            {([
              { value: "all" as const, label: "All", Icon: Layers },
              { value: "recipes" as const, label: "Recipes", Icon: Globe },
              { value: "products" as const, label: "Packaged", Icon: Leaf },
            ]).map(({ value, label, Icon }, idx) => (
              <Button
                key={value}
                variant={searchSource === value ? "secondary" : "ghost"}
                size="sm"
                title={label}
                className={`${idx === 0 ? "rounded-r-none" : idx === 2 ? "rounded-l-none border-l border-border" : "rounded-none border-l border-border"} px-2 sm:px-3`}
                onClick={() => setSearchSource(value)}
                data-testid={`button-search-source-${value}`}
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${value === "products" ? "text-primary" : ""} sm:mr-1.5`} />
                <span className="hidden sm:inline">{label}</span>
                {value === "recipes" && webSearchResults.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">{webSearchResults.length}</Badge>
                )}
                {value === "products" && productResults.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">{productResults.length}</Badge>
                )}
              </Button>
            ))}
          </div>
          {(webIsSearching || productIsSearching) && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
          )}
        </div>
      )}

      {/* Row C: filters + view toggle */}
      <div className="flex items-center gap-2 mb-4 min-w-0">
        <div className="flex border border-border rounded-md shrink-0">
          {([
            { id: "cookbook", label: "My Cookbook", Icon: ChefHat },
            { id: "recipes", label: "Recipes", Icon: Globe },
            { id: "freezer", label: "My Freezer", Icon: Snowflake },
            { id: "packaged", label: "Packaged", Icon: Package },
          ] as const).map(({ id, label, Icon }, idx) => (
            <Button
              key={id}
              variant={activeGroups.has(id) ? "secondary" : "ghost"}
              size="sm"
              title={label}
              className={`${idx > 0 ? "border-l border-border rounded-none" : "rounded-r-none"} px-2 sm:px-3`}
              onClick={() => toggleGroup(id)}
              data-testid={`button-filter-${id}`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 sm:mr-1.5" />
              <span className="hidden sm:inline">{label}</span>
              {id === "freezer" && freezerMeals.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
                  {freezerMeals.reduce((sum, f) => sum + f.remainingPortions, 0)}
                </Badge>
              )}
            </Button>
          ))}
        </div>
        <Button
          variant={showAdvancedFilters ? "secondary" : "outline"}
          size="sm"
          title="Filters"
          className="h-8 gap-1.5 shrink-0 px-2 sm:px-3"
          onClick={() => setShowAdvancedFilters(v => !v)}
          data-testid="button-toggle-advanced-filters"
        >
          <Sliders className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Filters</span>
          {advancedFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">{advancedFilterCount}</Badge>
          )}
        </Button>
        <div className="flex border border-border rounded-md ml-auto shrink-0">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="rounded-r-none h-8 w-8"
            onClick={() => setViewMode('grid')}
            title="Grid view"
            data-testid="button-view-grid"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="rounded-l-none border-l border-border h-8 w-8"
            onClick={() => setViewMode('list')}
            title="List view"
            data-testid="button-view-list"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-lg border border-border bg-card">
          {/* Audience section */}
          <div className="flex items-center gap-1.5 w-full mb-1">
            <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">Who is this for?</span>
          </div>
          {([
            { id: "adult", label: "Adult", icon: null },
            { id: "drinks", label: "Drinks", icon: Wine },
            { id: "baby", label: "Baby", icon: Baby },
            { id: "child", label: "Child", icon: PersonStanding },
          ] as const).map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={activeAudiences.has(id) ? "secondary" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => toggleAudience(id)}
              data-testid={`button-audience-${id}`}
            >
              {Icon && <Icon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />}
              {label}
            </Button>
          ))}
          <div className="w-full border-t border-border/50 my-1" />
          <div className="flex items-center gap-2 mr-1">
            <Switch
              checked={matchMyProfile}
              onCheckedChange={setMatchMyProfile}
              data-testid="toggle-match-profile"
            />
            <span className="text-sm font-medium">Match my profile</span>
          </div>
          <Select
            value={mealsDietPattern || "none"}
            onValueChange={v => { setMatchMyProfile(false); const p = v === "none" ? "" : v; setMealsDietPattern(p); setWebDietPattern(p); }}
          >
            <SelectTrigger className="h-8 text-xs w-[150px]" data-testid="select-meals-diet-pattern">
              <SelectValue placeholder="Any diet pattern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Any diet pattern</SelectItem>
              {["Mediterranean", "DASH", "MIND", "Flexitarian", "Vegetarian", "Vegan", "Keto", "Low-Carb", "Paleo", "Carnivore"].map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={mealsDietRestrictions.includes("Gluten-Free") ? "secondary" : "outline"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              setMatchMyProfile(false);
              setMealsDietRestrictions(prev => {
                const next = prev.includes("Gluten-Free") ? prev.filter(r => r !== "Gluten-Free") : [...prev, "Gluten-Free"];
                setWebDietRestrictions(next);
                return next;
              });
            }}
            data-testid="toggle-meals-restriction-gluten"
          >
            <Wheat className="h-3.5 w-3.5 mr-1.5" />
            Gluten-Free
          </Button>
          <Button
            variant={mealsDietRestrictions.includes("Dairy-Free") ? "secondary" : "outline"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              setMatchMyProfile(false);
              setMealsDietRestrictions(prev => {
                const next = prev.includes("Dairy-Free") ? prev.filter(r => r !== "Dairy-Free") : [...prev, "Dairy-Free"];
                setWebDietRestrictions(next);
                return next;
              });
            }}
            data-testid="toggle-meals-restriction-dairy"
          >
            <Droplet className="h-3.5 w-3.5 mr-1.5" />
            Dairy-Free
          </Button>
          <Button
            variant={mealsUpfFilter ? "secondary" : "outline"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => { setMatchMyProfile(false); setMealsUpfFilter(prev => !prev); }}
            data-testid="toggle-meals-upf-filter"
          >
            <Leaf className={`h-3.5 w-3.5 mr-1.5 ${mealsUpfFilter ? "text-primary" : ""}`} />
            Hide High-UPF
          </Button>
          {(mealsDietPattern || mealsDietRestrictions.length > 0 || mealsUpfFilter || matchMyProfile) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => {
                setMatchMyProfile(false);
                setMealsDietPattern("");
                setMealsDietRestrictions([]);
                setMealsUpfFilter(false);
                setWebDietPattern("");
                setWebDietRestrictions([]);
              }}
              data-testid="button-clear-diet-filters"
            >
              <X className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* Web results appear FIRST when searching — most relevant content for new/demo users */}
      {(webSearchResults.length > 0 || webIsSearching) && searchSource !== "products" && (
        <div className="mb-6" data-testid="section-web-results">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Globe className="h-5 w-5 text-primary" />
            <h2 className="text-base font-medium">From the Web</h2>
            {webIsSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {webSearchQuery && !webIsSearching && (
              <span className="text-sm text-muted-foreground">
                Results for "{webSearchQuery}"
              </span>
            )}
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <Select
                value={webDietPattern || "none"}
                onValueChange={v => { setMatchMyProfile(false); setWebDietPattern(v === "none" ? "" : v); }}
              >
                <SelectTrigger className="h-7 text-xs w-[140px]" data-testid="select-web-diet-pattern">
                  <SelectValue placeholder="Any pattern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any pattern</SelectItem>
                  {["Mediterranean", "DASH", "MIND", "Flexitarian", "Vegetarian", "Vegan", "Keto", "Low-Carb", "Paleo", "Carnivore"].map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={webDietRestrictions.includes("Gluten-Free") ? "secondary" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setMatchMyProfile(false);
                  setWebDietRestrictions(prev =>
                    prev.includes("Gluten-Free") ? prev.filter(r => r !== "Gluten-Free") : [...prev, "Gluten-Free"]
                  );
                }}
                data-testid="toggle-web-restriction-gluten"
              >
                Gluten-Free
              </Button>
              <Button
                variant={webDietRestrictions.includes("Dairy-Free") ? "secondary" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setMatchMyProfile(false);
                  setWebDietRestrictions(prev =>
                    prev.includes("Dairy-Free") ? prev.filter(r => r !== "Dairy-Free") : [...prev, "Dairy-Free"]
                  );
                }}
                data-testid="toggle-web-restriction-dairy"
              >
                Dairy-Free
              </Button>
            </div>
          </div>

          {webSearchResults.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
                                        onFreezeClick={importedMealId ? () => setAddToFreezerMealId(importedMealId) : undefined}
                                        showListButton
                                        onAddToQuickList={isFromList ? handleAddToListFromCookbook : undefined}
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

      {isLoading ? (
        <div className={viewMode === 'grid' ? "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3" : "flex flex-col gap-3"}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`bg-muted animate-pulse rounded-md ${viewMode === 'grid' ? 'h-36' : 'h-20'}`} />
          ))}
        </div>
      ) : (
        <AnimatePresence>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {visibleMeals?.map((meal, index) => {
                const cat = getMealDisplayCategory(meal);
                const prevCat = index > 0 ? getMealDisplayCategory(visibleMeals[index - 1]) : null;
                const isNewSection = showSectionHeaders && cat !== prevCat;
                return (
                  <Fragment key={meal.id}>
                    {isNewSection && (
                      <div
                        className={`col-span-full flex items-center gap-2 ${index > 0 ? "mt-4 pt-4 border-t border-border/50" : ""}`}
                        data-testid={`section-header-${cat}`}
                      >
                        <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">{SECTION_LABELS[cat]}</span>
                        {cat === "ready_meals" && <span className="text-xs text-muted-foreground/40 italic">Convenience options</span>}
                        <span className="text-xs text-muted-foreground/35">· {sectionCounts.get(cat) ?? 0}</span>
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                    >
                  <Card className="h-full flex flex-col group cursor-pointer overflow-hidden hover-elevate transition-all duration-200" onClick={(e) => { e.stopPropagation(); setExpandedMealId(expandedMealId === meal.id ? null : meal.id); setExpandedTab("ingredients"); }} data-testid={`card-meal-${meal.id}`}>
                    <div className="relative w-full h-32 sm:h-44 overflow-hidden rounded-t-md">
                      {meal.isReadyMeal && !meal.imageUrl ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-4 relative bg-accent/30" data-testid={`placeholder-ready-meal-${meal.id}`}>
                          {meal.audience === 'baby' ? (
                            <MealWatermark type="baby" size="lg" className="inset-0 m-auto flex items-center justify-center" />
                          ) : meal.audience === 'child' ? (
                            <MealWatermark type="child" size="lg" className="inset-0 m-auto flex items-center justify-center" />
                          ) : meal.isDrink ? (
                            <MealWatermark type="drink" size="lg" className="inset-0 m-auto flex items-center justify-center" />
                          ) : null}
                          <UtensilsCrossed className="h-10 w-10 relative z-10 text-muted-foreground/40" />
                          <span className="text-sm font-semibold text-center leading-tight relative z-10 text-foreground">{meal.name}</span>
                          <span className="text-[10px] uppercase tracking-[0.12em] relative z-10 text-muted-foreground/70">
                            {meal.isDrink ? 'Drink' : meal.audience === 'baby' ? 'Baby Meal' : meal.audience === 'child' ? 'Kids Meal' : 'Ready Meal'}
                          </span>
                        </div>
                      ) : meal.mealFormat === "grouped" && !meal.imageUrl ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-primary/5 relative" data-testid={`placeholder-grouped-${meal.id}`}>
                          <img src={thaAppleLogo} alt="THA" className="h-40 w-40 object-contain" />
                          <span className="text-sm font-semibold text-center px-3 mt-1 leading-tight text-foreground">{meal.name}</span>
                          <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 mt-0.5">Grouped Meal</span>
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
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-3 relative bg-accent/30" data-testid={`placeholder-meal-${meal.id}`}>
                          {meal.audience === 'baby' ? (
                            <MealWatermark type="baby" size="lg" className="relative" />
                          ) : meal.audience === 'child' ? (
                            <MealWatermark type="child" size="lg" className="relative" />
                          ) : (
                            <>
                              <ChefHat className="h-10 w-10 text-muted-foreground/40 relative z-10" />
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
                          <span className="text-sm font-semibold text-center leading-tight relative z-10 text-foreground line-clamp-2 px-1">{meal.name}</span>
                        </div>
                      )}
                      {!meal.isReadyMeal && meal.imageUrl && (
                        <div className="absolute bottom-1.5 left-1.5 z-10 flex items-center gap-1.5" data-testid={`name-overlay-meal-${meal.id}`}>
                          <span className="bg-black/65 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-md leading-tight inline-block">
                            {meal.name}
                          </span>
                        </div>
                      )}
                      {freezerMeals.some(f => f.mealId === meal.id && f.remainingPortions > 0) && (
                        <div className="absolute top-1.5 left-1.5 z-10" data-testid={`badge-frozen-${meal.id}`}>
                          <Badge variant="secondary" className="bg-primary/90 text-white border-0 text-[10px]">
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
                              {meal.mealFormat === "grouped" ? (
                                <GroupedMealDetail meal={meal} allMeals={meals ?? []} tab={expandedTab} mealId={meal.id} />
                              ) : expandedTab === "ingredients" ? (
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
                        mealFormat={meal.mealFormat}
                        instructions={meal.instructions}
                        showListButton
                        onAddToQuickList={isFromList ? handleAddToListFromCookbook : undefined}
                      />
                      {!meal.imageUrl && !meal.isReadyMeal && !meal.isSystemMeal && meal.mealFormat !== "grouped" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                          disabled={generatingImageFor === meal.id}
                          onClick={() => handleGenerateMealImage(meal)}
                          data-testid={`button-generate-image-${meal.id}`}
                        >
                          {generatingImageFor === meal.id
                            ? <><Loader2 className="h-3 w-3 animate-spin" />Generating image…</>
                            : <><Wand2 className="h-3 w-3" />Generate image with THA AI</>}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
                  </Fragment>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {visibleMeals?.map((meal, index) => {
                const cat = getMealDisplayCategory(meal);
                const prevCat = index > 0 ? getMealDisplayCategory(visibleMeals[index - 1]) : null;
                const isNewSection = showSectionHeaders && cat !== prevCat;
                return (
                  <Fragment key={meal.id}>
                    {isNewSection && (
                      <div
                        className={`flex items-center gap-2 ${index > 0 ? "mt-4 pt-4 border-t border-border/50" : ""}`}
                        data-testid={`section-header-list-${cat}`}
                      >
                        <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">{SECTION_LABELS[cat]}</span>
                        {cat === "ready_meals" && <span className="text-xs text-muted-foreground/40 italic">Convenience options</span>}
                        <span className="text-xs text-muted-foreground/35">· {sectionCounts.get(cat) ?? 0}</span>
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.15, delay: index * 0.02 }}
                    >
                  <Card className="group cursor-pointer" onClick={() => { setExpandedMealId(expandedMealId === meal.id ? null : meal.id); setExpandedTab("ingredients"); }} data-testid={`card-meal-${meal.id}`}>
                    <div className="flex items-stretch relative">
                      {meal.isReadyMeal ? (
                        <div className="w-28 sm:w-36 shrink-0 overflow-hidden rounded-l-md flex flex-col items-center justify-center gap-1 px-2 relative bg-accent/30">
                          {meal.audience === 'baby' ? (
                            <MealWatermark type="baby" size="sm" className="inset-0 m-auto flex items-center justify-center" />
                          ) : meal.audience === 'child' ? (
                            <MealWatermark type="child" size="sm" className="inset-0 m-auto flex items-center justify-center" />
                          ) : meal.isDrink ? (
                            <MealWatermark type="drink" size="sm" className="inset-0 m-auto flex items-center justify-center" />
                          ) : null}
                          <UtensilsCrossed className="h-6 w-6 relative z-10 text-muted-foreground/40" />
                          <span className="text-[10px] uppercase tracking-[0.12em] relative z-10 text-muted-foreground/70">
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
                        <div className="w-28 sm:w-36 shrink-0 overflow-hidden rounded-l-md flex items-center justify-center bg-accent/30">
                          <MealWatermark type={meal.audience === 'baby' ? 'baby' : 'child'} size="sm" className="relative" />
                        </div>
                      ) : meal.mealFormat === "grouped" && !meal.imageUrl ? (
                        <div className="w-28 sm:w-36 shrink-0 overflow-hidden rounded-l-md flex flex-col items-center justify-center bg-primary/5" data-testid={`placeholder-grouped-list-${meal.id}`}>
                          <img src={thaAppleLogo} alt="THA" className="h-24 w-24 object-contain" />
                        </div>
                      ) : !meal.isSystemMeal && !meal.imageUrl ? (
                        <div className="w-28 sm:w-36 shrink-0 overflow-hidden rounded-l-md flex items-center justify-center bg-accent/30 relative">
                          <MealWatermark type="adult" size="sm" className="inset-0 m-auto flex items-center justify-center" />
                          <ChefHat className="h-8 w-8 text-muted-foreground/30 relative z-10" />
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
                            mealFormat={meal.mealFormat}
                            instructions={meal.instructions}
                            showListButton
                            onAddToQuickList={isFromList ? handleAddToListFromCookbook : undefined}
                          />
                          {!meal.imageUrl && !meal.isReadyMeal && !meal.isSystemMeal && meal.mealFormat !== "grouped" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1.5 text-muted-foreground"
                              disabled={generatingImageFor === meal.id}
                              onClick={(e) => { e.stopPropagation(); handleGenerateMealImage(meal); }}
                              data-testid={`button-generate-image-${meal.id}`}
                            >
                              {generatingImageFor === meal.id
                                ? <><Loader2 className="h-3 w-3 animate-spin" />Generating…</>
                                : <><Wand2 className="h-3 w-3" />Generate image</>}
                            </Button>
                          )}
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
                              {meal.mealFormat === "grouped" ? (
                                <GroupedMealDetail meal={meal} allMeals={meals ?? []} tab={expandedTab} mealId={meal.id} />
                              ) : expandedTab === "ingredients" ? (
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
                  </Fragment>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      )}

      {/* My Freezer section - appears after My Cookbook + Recipes, before Packaged & Processed */}
      {activeGroups.has("freezer") && (
        <div className="space-y-4 mt-6">
          <div className="flex items-center gap-2 pb-1 border-b border-border/50">
            <Snowflake className="h-4 w-4 text-blue-400" />
            <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">My Freezer</span>
            {freezerMeals.length > 0 && (
              <span className="text-xs text-muted-foreground/35">· {freezerMeals.reduce((s, f) => s + f.remainingPortions, 0)} portions</span>
            )}
          </div>
          {freezerMeals.length === 0 ? (
            <Card className="p-8">
              <div className="flex flex-col items-center gap-3 text-center">
                <Snowflake className="h-12 w-12 text-muted-foreground/40" />
                <h3 className="text-lg font-medium">No frozen meals yet</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Cook a batch of your favourite meals and add them to the freezer to track portions. Look for the snowflake button on any meal card.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
                    <Card className={`h-full flex flex-col overflow-hidden ${isExpired ? 'border-red-400/50' : 'border-border'}`} data-testid={`card-freezer-${frozen.id}`}>
                      <div className="relative w-full h-36 overflow-hidden rounded-t-md bg-accent/30">
                        {meal?.imageUrl ? (
                          <img src={meal.imageUrl} alt={meal.name} className="w-full h-full object-cover opacity-70" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Snowflake className="h-12 w-12 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                          <Badge variant="secondary" className="bg-primary/90 text-white border-0 text-[10px]">
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
                        {meal?.servings != null && meal.servings >= 1 && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground" data-testid={`text-freezer-servings-${frozen.id}`}>
                            <UtensilsCrossed className="h-3 w-3" />
                            {meal.servings} {meal.servings === 1 ? 'serving' : 'servings'} per batch
                          </p>
                        )}
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${portionPercent > 50 ? 'bg-blue-400' : portionPercent > 20 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${portionPercent}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Frozen {new Date(frozen.frozenDate).toLocaleDateString()}
                          {frozen.expiryDate && ` · Expires ${new Date(frozen.expiryDate).toLocaleDateString()}`}
                        </p>
                        {frozen.notes && <p className="text-xs text-muted-foreground italic">{frozen.notes}</p>}
                        <NutritionBadges mealId={frozen.mealId} nutrition={nutritionMap.get(frozen.mealId)} />
                      </CardContent>
                      <CardFooter className="p-3 pt-0 flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                          disabled={frozen.remainingPortions <= 0 || usePortionMutation.isPending}
                          onClick={() => usePortionMutation.mutate(frozen.id)}
                          data-testid={`button-use-portion-${frozen.id}`}
                        >
                          <Minus className="h-3 w-3 mr-1" />
                          Use Portion
                        </Button>
                        {meal && (
                          <div className="flex items-center w-full">
                            <div className="flex-1">
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
                                mealFormat={meal.mealFormat}
                                instructions={meal.instructions}
                                hideEdit
                                hideBasket
                                onAddToList={handleAddToListFromCookbook}
                              />
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive shrink-0"
                              onClick={() => deleteFreezerMutation.mutate(frozen.id)}
                              data-testid={`button-delete-freezer-${frozen.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        {!meal && (
                          <div className="flex justify-end">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => deleteFreezerMutation.mutate(frozen.id)}
                              data-testid={`button-delete-freezer-${frozen.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!isLoading && filteredMeals && visibleCount < filteredMeals.length && (
        <div className="flex flex-col items-center gap-1 py-6">
          <Button
            variant="outline"
            onClick={() => setVisibleCount(c => c + 48)}
            data-testid="button-load-more-meals"
          >
            Show more ({filteredMeals.length - visibleCount} remaining)
          </Button>
        </div>
      )}

      {!isLoading && filteredMeals?.length === 0 && !webSearchResults.length && !webIsSearching && !productResults.length && !productIsSearching && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium mb-2">No meals found</h3>
          <p className="text-muted-foreground">
            {searchTerm.trim().length >= 2 
              ? "No local matches. Web results will appear below if found."
              : "Try creating a new meal to get started."
            }
          </p>
        </div>
      )}

      {(productResults.length > 0 || productIsSearching) && searchSource !== "recipes" && (
        <div className="mt-8" data-testid="section-product-results">
          <div className="flex items-center gap-3 mb-4">
            <Leaf className="h-5 w-5 text-primary" />
            <h2 className="text-base font-medium">Packaged & Processed</h2>
            {productIsSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {!productIsSearching && productResults.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {productResults.length} found
              </span>
            )}
          </div>

          {productResults.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                <AnimatePresence mode="popLayout">
                  {productResults.map((product) => {
                    const productKey = product.barcode || product.product_name;
                    const isSaving = productSavingIds.has(productKey);
                    const isSaved = productSavedIds.has(productKey);
                    const cats = product.categories_tags || [];
                    const isDrink = cats.some((c: string) => c.includes('beverages') || c.includes('drinks'));
                    const isReadyMeal = cats.some((c: string) => c.includes('meals') || c.includes('ready') || c.includes('prepared'));
                    const thaRating = product.upfAnalysis?.thaRating ?? 3;
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
                                  <Badge className={`text-xs font-semibold uppercase ${NUTRISCORE_COLORS[product.nutriscore_grade.toLowerCase()] || 'bg-muted'}`} data-testid={`badge-nutriscore-${productKey}`}>
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
                                <ScoreBadge score={thaRating} size={20} />
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


      {(webSearchResults.length > 0 || webIsSearching) && searchSource !== "products" && false && (
        <div className="mt-8" data-testid="section-web-results-legacy">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Globe className="h-5 w-5 text-primary" />
            <h2 className="text-base font-medium">From the Web</h2>
            {webIsSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {webSearchQuery && !webIsSearching && (
              <span className="text-sm text-muted-foreground">
                Results for "{webSearchQuery}"
              </span>
            )}
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <Select
                value={webDietPattern || "none"}
                onValueChange={v => { setMatchMyProfile(false); setWebDietPattern(v === "none" ? "" : v); }}
              >
                <SelectTrigger className="h-7 text-xs w-[140px]" data-testid="select-web-diet-pattern">
                  <SelectValue placeholder="Any pattern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any pattern</SelectItem>
                  {["Mediterranean", "DASH", "MIND", "Flexitarian", "Vegetarian", "Vegan", "Keto", "Low-Carb", "Paleo", "Carnivore"].map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={webDietRestrictions.includes("Gluten-Free") ? "secondary" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setMatchMyProfile(false);
                  setWebDietRestrictions(prev =>
                    prev.includes("Gluten-Free") ? prev.filter(r => r !== "Gluten-Free") : [...prev, "Gluten-Free"]
                  );
                }}
                data-testid="toggle-web-restriction-gluten"
              >
                Gluten-Free
              </Button>
              <Button
                variant={webDietRestrictions.includes("Dairy-Free") ? "secondary" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setMatchMyProfile(false);
                  setWebDietRestrictions(prev =>
                    prev.includes("Dairy-Free") ? prev.filter(r => r !== "Dairy-Free") : [...prev, "Dairy-Free"]
                  );
                }}
                data-testid="toggle-web-restriction-dairy"
              >
                Dairy-Free
              </Button>
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
                                        onFreezeClick={importedMealId ? () => setAddToFreezerMealId(importedMealId) : undefined}
                                        showListButton
                                        onAddToQuickList={isFromList ? handleAddToListFromCookbook : undefined}
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

      <Dialog open={addToFreezerMealId !== null} onOpenChange={(open) => { if (!open) setAddToFreezerMealId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Snowflake className="h-5 w-5 text-muted-foreground" />
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
              className="bg-primary text-primary-foreground"
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

      <CameraModal
        open={cameraModalOpen}
        onOpenChange={setCameraModalOpen}
        onCapture={handleScanFile}
        onUploadInstead={() => scanFileRef.current?.click()}
      />

      <ScanConfirmDialog
        open={scanDialogOpen}
        onOpenChange={setScanDialogOpen}
        scanData={scanData}
      />

      <BarcodeScanner
        isOpen={barcodeScanOpen}
        onScan={handleCookbookBarcodeScan}
        onClose={() => setBarcodeScanOpen(false)}
      />

      <Dialog open={barcodeProductOpen} onOpenChange={(v) => { setBarcodeProductOpen(v); if (!v) setBarcodeProduct(null); }}>
        <DialogContent className="sm:max-w-sm" data-testid="dialog-barcode-product">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Save to Cookbook
            </DialogTitle>
            <DialogDescription>
              Review this product before saving it to your Packaged &amp; Processed list.
            </DialogDescription>
          </DialogHeader>
          {barcodeProduct && (
            <div className="space-y-3 py-1">
              {barcodeProduct.image_url && (
                <div className="flex justify-center">
                  <img
                    src={barcodeProduct.image_url}
                    alt={barcodeProduct.product_name}
                    className="h-28 w-auto object-contain rounded-md"
                  />
                </div>
              )}
              <div>
                <p className="font-semibold text-base leading-tight" data-testid="text-barcode-product-name">{barcodeProduct.product_name}</p>
                {barcodeProduct.brand && (
                  <p className="text-sm text-muted-foreground">{barcodeProduct.brand}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {barcodeProduct.nutriscore_grade && (
                  <Badge className={`text-xs font-semibold uppercase ${NUTRISCORE_COLORS[barcodeProduct.nutriscore_grade.toLowerCase()] || 'bg-muted'}`}>
                    Nutri-Score {barcodeProduct.nutriscore_grade.toUpperCase()}
                  </Badge>
                )}
                {barcodeProduct.nova_group && (
                  <Badge variant="outline" className="text-xs">NOVA {barcodeProduct.nova_group}</Badge>
                )}
                {barcodeProduct.upfAnalysis?.thaRating && (
                  <ScoreBadge score={barcodeProduct.upfAnalysis.thaRating} size={20} />
                )}
              </div>
              {barcodeProduct.nutriments?.calories && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange-500" />{Math.round(Number(barcodeProduct.nutriments.calories))} kcal</span>
                  {barcodeProduct.nutriments.protein && <span className="flex items-center gap-1"><Beef className="h-3 w-3 text-red-500" />{Number(barcodeProduct.nutriments.protein).toFixed(1)}g protein</span>}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setBarcodeProductOpen(false); setBarcodeProduct(null); }} data-testid="button-barcode-cancel">
              Cancel
            </Button>
            <Button
              onClick={handleSaveBarcodeProduct}
              disabled={barcodeSaving}
              data-testid="button-barcode-save"
            >
              {barcodeSaving ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1.5" />
              )}
              Save to Cookbook
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
  confidence?: 'high' | 'partial' | 'failed';
  sourcePlatform?: 'instagram' | 'tiktok' | 'website' | 'manual';
  failureReason?: string | null;
  /** Raw text scraped from the page — present when scraping succeeded but
   *  recipe extraction failed.  Surfaced so the user can paste it into the
   *  text tab to retry without re-typing everything. */
  extractedText?: string | null;
}

function VoiceMealDialog({ open, onOpenChange, onTranscript }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onTranscript: (text: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const SpeechRecognition = typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;
  const supported = !!SpeechRecognition;

  const startListening = () => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-GB";
    recognition.onresult = (event: any) => {
      const t = Array.from(event.results).map((r: any) => r[0].transcript).join("");
      setTranscript(t);
    };
    recognition.onerror = () => {
      setError("Couldn't hear you. Please try again.");
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setError(null);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const handleConfirm = () => {
    onTranscript(transcript.trim());
    onOpenChange(false);
    setTranscript("");
    setListening(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      recognitionRef.current?.stop();
      setListening(false);
      setTranscript("");
      setError(null);
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Speak your recipe
          </DialogTitle>
          <DialogDescription>
            Say the recipe name or describe what you'd like to add.
          </DialogDescription>
        </DialogHeader>
        {!supported ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Voice input isn't supported in this browser. Type your meal below instead.
            </p>
            <Input
              placeholder="e.g. Spaghetti Bolognese"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              autoFocus
              data-testid="input-voice-fallback"
            />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={listening ? stopListening : startListening}
                className={`h-16 w-16 rounded-full flex items-center justify-center transition-all ${
                  listening
                    ? "bg-destructive hover:bg-destructive/90 animate-pulse"
                    : "bg-primary hover:bg-primary/90"
                }`}
                data-testid="button-voice-mic"
              >
                <Mic className="h-7 w-7 text-white" />
              </button>
              <p className="text-sm text-muted-foreground">
                {listening ? "Listening… tap to stop" : "Tap to start speaking"}
              </p>
            </div>
            {transcript && (
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-sm" data-testid="text-voice-transcript">{transcript}</p>
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!transcript.trim()} data-testid="button-voice-confirm">
            Use this
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddMealGatewayDialog({ onScan }: { onScan: () => void }) {
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [speakOpen, setSpeakOpen] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");

  const handleOption = (option: "import" | "scan" | "manual" | "speak" | "social") => {
    setOpen(false);
    if (option === "import") setImportOpen(true);
    else if (option === "scan") setTimeout(() => onScan(), 100);
    else if (option === "manual") setCreateOpen(true);
    else if (option === "speak") setTimeout(() => setSpeakOpen(true), 100);
    else if (option === "social") setSocialOpen(true);
  };

  const handleVoiceTranscript = (text: string) => {
    setVoiceTranscript(text);
    setCreateOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button title="Add Recipe" className="px-2 sm:px-4" data-testid="button-add-meal">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Recipe</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add a Recipe</DialogTitle>
            <DialogDescription>Choose how you'd like to add your recipe.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pt-1">
            <button
              onClick={() => handleOption("import")}
              className="w-full flex items-center gap-4 rounded-lg border border-border p-4 text-left hover:bg-accent transition-colors"
              data-testid="button-gateway-import"
            >
              <Globe className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">Import from URL</p>
                <p className="text-xs text-muted-foreground">Paste a recipe link to import automatically</p>
              </div>
            </button>
            <button
              onClick={() => handleOption("social")}
              className="w-full flex items-center gap-4 rounded-lg border border-border p-4 text-left hover:bg-accent transition-colors"
              data-testid="button-gateway-social"
            >
              <Share2 className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">From social media</p>
                <p className="text-xs text-muted-foreground">Import from Instagram, TikTok, YouTube and more</p>
              </div>
            </button>
            <button
              onClick={() => handleOption("scan")}
              className="w-full flex items-center gap-4 rounded-lg border border-border p-4 text-left hover:bg-accent transition-colors"
              data-testid="button-gateway-scan"
            >
              <Camera className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">Scan Image</p>
                <p className="text-xs text-muted-foreground">Photograph or upload a recipe or meal plan</p>
              </div>
            </button>
            <button
              onClick={() => handleOption("speak")}
              className="w-full flex items-center gap-4 rounded-lg border border-border p-4 text-left hover:bg-accent transition-colors"
              data-testid="button-gateway-speak"
            >
              <Mic className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">Speak to input recipe</p>
                <p className="text-xs text-muted-foreground">Describe your recipe by voice to fill the form</p>
              </div>
            </button>
            <button
              onClick={() => handleOption("manual")}
              className="w-full flex items-center gap-4 rounded-lg border border-border p-4 text-left hover:bg-accent transition-colors"
              data-testid="button-gateway-manual"
            >
              <Pencil className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">Add new recipe</p>
                <p className="text-xs text-muted-foreground">Type in a recipe from scratch</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <ImportRecipeDialog externalOpen={importOpen} onExternalOpenChange={setImportOpen} />
      <ImportRecipeDialog externalOpen={socialOpen} onExternalOpenChange={setSocialOpen} socialMode />
      <VoiceMealDialog open={speakOpen} onOpenChange={setSpeakOpen} onTranscript={handleVoiceTranscript} />
      <CreateMealDialog externalOpen={createOpen} onExternalOpenChange={setCreateOpen} initialName={voiceTranscript} />
    </>
  );
}

function ImportRecipeDialog({ externalOpen, onExternalOpenChange }: { externalOpen?: boolean; onExternalOpenChange?: (v: boolean) => void; socialMode?: boolean } = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    onExternalOpenChange?.(v);
  };
  const [tab, setTab] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [failureMsg, setFailureMsg] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalPrefill, setCreateModalPrefill] = useState<ImportedRecipeDraft | undefined>(undefined);

  const openModal = (data: ImportPreview, sourceUrl: string) => {
    setCreateModalPrefill({
      title: data.title || 'Imported Recipe',
      ingredients: data.ingredients ?? [],
      instructions: data.instructions ?? [],
      servings: data.servings ?? 1,
      imageUrl: data.imageUrl ?? null,
      sourceUrl,
      sourcePlatform: data.sourcePlatform ?? 'website',
    });
    setOpen(false);
    setUrl("");
    setPastedText("");
    setFailureMsg(null);
    setCreateModalOpen(true);
  };

  const handleImportUrl = async () => {
    if (!url.trim()) return;
    setIsImporting(true);
    setFailureMsg(null);
    try {
      const res = await fetch(api.import.recipe.path, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        setFailureMsg(err.message || "Could not import this URL.");
        return;
      }
      const data: ImportPreview = await res.json();
      if (data.confidence === 'failed') {
        // Switch to the text tab so the user can paste the recipe manually.
        // Pre-populate the textarea with any text the server was able to scrape.
        setTab('text');
        if (data.extractedText) {
          setPastedText(data.extractedText);
        }
        const platform = data.sourcePlatform === 'instagram' ? 'Instagram'
          : data.sourcePlatform === 'tiktok' ? 'TikTok'
          : null;
        setFailureMsg(
          data.failureReason ||
          (platform
            ? `We couldn't extract a recipe from this ${platform} link. Paste the caption or recipe text below and we'll try again.`
            : "We couldn't extract a recipe from this link. Paste the recipe text below and we'll try again.")
        );
        return;
      }
      openModal(data, url.trim());
    } catch (err: any) {
      setFailureMsg("Could not fetch or parse the recipe. Try a different URL or paste the recipe text instead.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportText = async () => {
    if (!pastedText.trim()) return;
    setIsImporting(true);
    setFailureMsg(null);
    try {
      const res = await fetch(api.import.recipeFromText.path, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pastedText.trim() }),
      });
      // Guard against non-JSON responses (e.g. server not yet reloaded, HTML fallback)
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        setFailureMsg("The server is not responding correctly. Try restarting the dev server, then try again.");
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setFailureMsg(json.message || "Could not extract a recipe from this text.");
        return;
      }
      const data: ImportPreview = json;
      if (data.confidence === 'failed') {
        setFailureMsg(
          data.failureReason ||
          "We couldn't find a recipe in this text. Make sure it includes ingredients and steps, then try again."
        );
        // Don't clear the textarea — leave it so the user can edit and retry
        return;
      }
      openModal(data, '');
    } catch (err: any) {
      setFailureMsg("Could not reach the server. Check your connection and try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setUrl("");
      setPastedText("");
      setFailureMsg(null);
      setIsImporting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {externalOpen === undefined && (
          <DialogTrigger asChild>
            <Button variant="outline" data-testid="button-import-recipe">
              <Download className="mr-2 h-4 w-4" />
              Import Recipe
            </Button>
          </DialogTrigger>
        )}
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Import Recipe
            </DialogTitle>
            <DialogDescription>
              Paste a link from any recipe site, or paste the recipe text directly.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={tab} onValueChange={(v) => { setTab(v as 'url' | 'text'); setFailureMsg(null); }}>
            <TabsList className="w-full">
              <TabsTrigger value="url" className="flex-1 gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                Paste a link
              </TabsTrigger>
              <TabsTrigger value="text" className="flex-1 gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" />
                Paste text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-3 mt-3">
              <div className="flex gap-2">
                <Input
                  data-testid="input-import-recipe-url"
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setFailureMsg(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleImportUrl()}
                  disabled={isImporting}
                  className="flex-1"
                />
                <Button
                  data-testid="button-import-fetch"
                  onClick={handleImportUrl}
                  disabled={isImporting || !url.trim()}
                >
                  {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  <span className="ml-1.5">Import</span>
                </Button>
              </div>
              {!failureMsg && (
                <p className="text-xs text-muted-foreground">
                  Works with BBC Good Food, AllRecipes, Instagram, TikTok, and most recipe sites.
                </p>
              )}
            </TabsContent>

            <TabsContent value="text" className="space-y-3 mt-3">
              <Textarea
                data-testid="input-import-recipe-text"
                placeholder={"Paste recipe text here — from a TikTok caption, blog, or anywhere else.\n\nE.g.:\nEasy Pasta\nIngredients: 200g pasta, 2 cloves garlic...\nMethod: Boil pasta, fry garlic..."}
                value={pastedText}
                onChange={(e) => { setPastedText(e.target.value); setFailureMsg(null); }}
                disabled={isImporting}
                className="min-h-[140px] text-sm resize-none"
              />
              <Button
                data-testid="button-import-text"
                onClick={handleImportText}
                disabled={isImporting || !pastedText.trim()}
                className="w-full"
              >
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span className="ml-1.5">Extract Recipe</span>
              </Button>
              {!failureMsg && (
                <p className="text-xs text-muted-foreground">
                  AI will extract the title, ingredients, and steps. You review before saving.
                </p>
              )}
            </TabsContent>
          </Tabs>

          {/* Inline failure message — shown below either tab */}
          {failureMsg && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200/70 dark:border-amber-700/40 bg-amber-50/60 dark:bg-amber-950/20 px-3 py-2.5 mt-1">
              <Info className="h-4 w-4 text-amber-600/80 dark:text-amber-400/70 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[12.5px] text-amber-700/90 dark:text-amber-300/80 leading-snug">{failureMsg}</p>
                {tab === 'text' && pastedText.trim() && (
                  <p className="text-[11.5px] text-amber-600/70 dark:text-amber-400/60 mt-1">
                    Edit the text above and try extracting again.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review modal — opens after a successful high/partial import */}
      <CreateMealModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        prefill={createModalPrefill}
      />
    </>
  );
}

function CreateMealDialog({ externalOpen, onExternalOpenChange, initialName, onScan, onMealCreated }: { externalOpen?: boolean; onExternalOpenChange?: (v: boolean) => void; initialName?: string; onScan?: () => void; onMealCreated?: (meal: Meal, hasSourceUrl: boolean) => void } = {}) {
  const { createMeal } = useMeals();
  const queryClient = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const [selectedDiets, setSelectedDiets] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [completionMeal, setCompletionMeal] = useState<CompletionMeal | null>(null);
  const { user } = useUser();

  // Unified import bar state
  const [unifiedInput, setUnifiedInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importBanner, setImportBanner] = useState<{ partial: boolean; sourceUrl: string; isVoice?: boolean } | null>(null);
  const [importFailureMsg, setImportFailureMsg] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  // Ref to capture speech transcript outside React state batching
  const speechTranscriptRef = useRef("");
  // Signals that a voice capture has finished and needs AI structuring
  const [pendingVoiceImport, setPendingVoiceImport] = useState<string | null>(null);
  const [instructionsText, setInstructionsText] = useState("");
  // Paste-text helper state (shown for partial imports with missing fields)
  const [pasteHelperText, setPasteHelperText] = useState("");
  const [isPasteImporting, setIsPasteImporting] = useState(false);
  const [pasteHelperMsg, setPasteHelperMsg] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<'basics' | 'ingredients' | 'method' | 'optional' | ''>('basics');
  const toggleSection = (s: typeof openSection) => setOpenSection(prev => prev === s ? '' : s);

  interface IngredientSuggestion { title: string; description: string; extraIngredients: string[]; effort: 'easy' | 'medium' | 'involved'; }
  const [suggestions, setSuggestions] = useState<IngredientSuggestion[] | null>(null);
  const [ingredientSource, setIngredientSource] = useState("");

  const isIngredientList = (text: string): boolean => {
    if (/^https?:\/\//i.test(text)) return false;
    const items = text.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
    if (items.length < 2) return false;
    return items.every(s => s.length <= 80 && !s.includes('. ') && !/^\d+[\.\)]\s/.test(s));
  };

  const { data: allDiets = [] } = useQuery<Diet[]>({
    queryKey: ['/api/diets'],
  });

  const { data: categories = [] } = useQuery<MealCategory[]>({
    queryKey: ['/api/categories'],
  });

  const createMealFormSchema = insertMealSchema.extend({
    ingredients: z.array(z.object({ amount: z.string(), unit: z.string(), name: z.string() })),
  });
  type CreateMealFormValues = z.infer<typeof createMealFormSchema>;

  const form = useForm<CreateMealFormValues>({
    resolver: zodResolver(createMealFormSchema),
    defaultValues: {
      name: initialName ?? "",
      ingredients: [{ amount: "", unit: "", name: "" }],
      servings: 1,
      kind: "meal",
    }
  });

  useEffect(() => {
    if (open && initialName) {
      form.setValue("name", initialName);
    }
  }, [open, initialName]);

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  const toggleDiet = (dietId: number) => {
    setSelectedDiets(prev =>
      prev.includes(dietId) ? prev.filter(d => d !== dietId) : [...prev, dietId]
    );
  };

  const resetImportState = () => {
    setUnifiedInput("");
    setIsImporting(false);
    setImportBanner(null);
    setImportFailureMsg(null);
    setListening(false);
    setInstructionsText("");
    setPasteHelperText("");
    setPasteHelperMsg(null);
    setPendingVoiceImport(null);
    setSuggestions(null);
    setIngredientSource("");
    speechTranscriptRef.current = "";
    // Reset before stopping so onend doesn't falsely trigger "no speech captured"
    wasListeningRef.current = false;
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} }
  };

  const handleDialogOpenChange = (v: boolean) => {
    if (!v) {
      resetImportState();
      setSelectedDiets([]);
      setSelectedCategory(undefined);
      setOpenSection('basics');
      form.reset();
    }
    setInternalOpen(v);
    onExternalOpenChange?.(v);
  };

  const prefillFromImport = (data: ImportPreview, sourceUrl: string) => {
    form.setValue("name", data.title || "");
    form.setValue("servings", data.servings ?? 1);
    if (data.imageUrl) form.setValue("imageUrl", data.imageUrl);
    const parsed = (data.ingredients || []).map(parseIngredientString);
    replace(parsed.length > 0 ? parsed : [{ amount: "", unit: "", name: "" }]);
    setInstructionsText((data.instructions || []).join("\n"));
    const partial = data.confidence === 'partial' || !data.ingredients?.length;
    setImportBanner({ partial, sourceUrl });
    setImportFailureMsg(null);
    setUnifiedInput("");
    setOpenSection('basics');
  };

  const handlePasteImprove = async () => {
    const text = pasteHelperText.trim();
    if (!text || isPasteImporting) return;
    setIsPasteImporting(true);
    setPasteHelperMsg(null);
    try {
      const res = await fetch('/api/import-recipe-from-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        credentials: 'include',
      });
      const ct = res.headers.get('content-type') ?? '';
      if (!ct.includes('application/json')) {
        setPasteHelperMsg("Server error. Please try again.");
        return;
      }
      const data: ImportPreview = await res.json();
      if (!res.ok || data.confidence === 'failed') {
        setPasteHelperMsg(data.failureReason || "Couldn't extract a recipe from this text. Try pasting more of the recipe content.");
        return;
      }

      // Merge: only fill in fields that are currently empty / default
      const currentName = form.getValues("name").trim();
      const newTitle = data.title?.trim();
      if (newTitle && (!currentName || currentName === 'Imported Recipe')) {
        form.setValue("name", newTitle);
      }

      const currentServings = form.getValues("servings");
      if (data.servings && data.servings > 1 && (!currentServings || currentServings === 1)) {
        form.setValue("servings", data.servings);
      }

      const currentIngredientsEmpty = fields.every(f => !f.name.trim());
      if (currentIngredientsEmpty && data.ingredients?.length) {
        replace(data.ingredients.map(parseIngredientString));
      }

      const currentInstructionsEmpty = !instructionsText.trim();
      if (currentInstructionsEmpty && data.instructions?.length) {
        setInstructionsText(data.instructions.join("\n"));
      }

      // Re-evaluate partial state after merge
      const stillMissingIngredients = currentIngredientsEmpty && !data.ingredients?.length;
      const stillMissingInstructions = currentInstructionsEmpty && !data.instructions?.length;
      setImportBanner(prev => prev
        ? { ...prev, partial: stillMissingIngredients || stillMissingInstructions }
        : null
      );
      setPasteHelperText("");
    } catch {
      setPasteHelperMsg("Could not reach the server. Check your connection and try again.");
    } finally {
      setIsPasteImporting(false);
    }
  };

  const handleSelectSuggestion = async (s: IngredientSuggestion) => {
    setIsImporting(true);
    setSuggestions(null);
    setImportFailureMsg(null);
    try {
      const res = await fetch('/api/generate-recipe-from-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: ingredientSource, title: s.title, description: s.description }),
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setImportFailureMsg((err as any).message || "Could not generate this recipe.");
        return;
      }
      const data: ImportPreview = await res.json();
      prefillFromImport(data, '');
    } catch {
      setImportFailureMsg("Could not reach the server. Check your connection and try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleUnifiedSubmit = async () => {
    const val = unifiedInput.trim();
    if (!val || isImporting) return;
    const isUrl = /^https?:\/\//i.test(val);
    setIsImporting(true);
    setImportFailureMsg(null);
    setSuggestions(null);
    try {
      if (!isUrl && isIngredientList(val)) {
        // Ingredient list detected — fetch 3 meal suggestions
        const res = await fetch('/api/suggest-from-ingredients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ingredients: val }),
          credentials: 'include',
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setImportFailureMsg((err as any).message || "Could not generate suggestions.");
          return;
        }
        const data = await res.json();
        if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          setIngredientSource(val);
          setSuggestions(data.suggestions.slice(0, 3));
        } else {
          setImportFailureMsg("Couldn't generate suggestions. Try pasting fuller recipe text instead.");
        }
      } else if (isUrl) {
        const res = await fetch('/api/import-recipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: val }),
          credentials: 'include',
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setImportFailureMsg((err as any).message || "Could not import this URL.");
          return;
        }
        const data: ImportPreview = await res.json();
        if (data.confidence === 'failed') {
          setImportFailureMsg(data.failureReason || "No recipe content found at this URL.");
          return;
        }
        prefillFromImport(data, val);
      } else {
        const res = await fetch('/api/import-recipe-from-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: val }),
          credentials: 'include',
        });
        const ct = res.headers.get('content-type') ?? '';
        if (!ct.includes('application/json')) {
          setImportFailureMsg("Server error. Please try restarting the dev server.");
          return;
        }
        const data: ImportPreview = await res.json();
        if (!res.ok || data.confidence === 'failed') {
          setImportFailureMsg(data.failureReason || "Couldn't extract a recipe from this text. Please edit and try again.");
          return;
        }
        prefillFromImport(data, '');
      }
    } catch {
      setImportFailureMsg("Could not reach the server. Check your connection and try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const SpeechRecognition = typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

  // Track the previous listening state so we can detect the true→false transition
  const wasListeningRef = useRef(false);

  const startListening = () => {
    if (!SpeechRecognition) return;
    speechTranscriptRef.current = "";
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    // Use browser default language — specifying en-GB can silently fail for non-UK users
    recognition.onresult = (event: any) => {
      // Accumulate all results (both interim and final) into a single transcript
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      speechTranscriptRef.current = transcript;
      setUnifiedInput(transcript);
    };
    recognition.onerror = (event: any) => {
      speechTranscriptRef.current = "";
      setListening(false);
      // Show an error so the user knows something went wrong, not just silence
      const code = event?.error ?? "unknown";
      if (code !== "aborted" && code !== "no-speech") {
        setImportFailureMsg(
          code === "not-allowed"
            ? "Microphone access was denied. Please allow microphone permissions and try again."
            : "Voice recognition error. Please try again."
        );
      }
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setImportFailureMsg(null);
  };

  const stopListening = () => {
    try { recognitionRef.current?.stop(); } catch {}
    setListening(false);
  };

  // Detect the moment listening stops — snapshot the ref and queue voice import
  useEffect(() => {
    if (wasListeningRef.current && !listening) {
      const captured = speechTranscriptRef.current.trim();
      speechTranscriptRef.current = "";
      if (captured) {
        setPendingVoiceImport(captured);
      } else {
        // Recording stopped with no captured text — let the user know
        setImportFailureMsg("No speech was captured. Please try again and speak clearly.");
      }
    }
    wasListeningRef.current = listening;
  }, [listening]);

  // When speech recognition ends with a transcript, route it through AI structuring
  useEffect(() => {
    if (!pendingVoiceImport) return;
    const text = pendingVoiceImport;
    setPendingVoiceImport(null);
    setIsImporting(true);
    setImportFailureMsg(null);
    fetch('/api/import-recipe-from-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      credentials: 'include',
    })
      .then(async res => {
        const ct = res.headers.get('content-type') ?? '';
        if (!ct.includes('application/json')) {
          setImportFailureMsg("Server error. Please try again.");
          return;
        }
        const data: ImportPreview = await res.json();
        if (!res.ok || data.confidence === 'failed') {
          setImportFailureMsg(
            data.failureReason ||
            "We couldn't confidently structure this voice input. Please edit the text and try again."
          );
          return;
        }
        // Prefill the form with structured data
        form.setValue("name", data.title || "");
        form.setValue("servings", data.servings ?? 1);
        if (data.imageUrl) form.setValue("imageUrl", data.imageUrl);
        const parsed = (data.ingredients || []).map(parseIngredientString);
        replace(parsed.length > 0 ? parsed : [{ amount: "", unit: "", name: "" }]);
        setInstructionsText((data.instructions || []).join("\n"));
        const partial = data.confidence === 'partial' || !data.ingredients?.length;
        setImportBanner({ partial, sourceUrl: '', isVoice: true });
        setUnifiedInput("");
      })
      .catch(() => {
        setImportFailureMsg("Could not reach the server. Check your connection and try again.");
      })
      .finally(() => {
        setIsImporting(false);
      });
  }, [pendingVoiceImport]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: CreateMealFormValues) => {
    const catName = categories.find(c => c.id === selectedCategory)?.name?.toLowerCase() || "";
    const isDrink = catName === "drink" || catName === "smoothie";
    const audience = catName === "baby meal" ? "baby" : catName === "kids meal" ? "child" : "adult";
    const cleanData = {
      ...data,
      ingredients: data.ingredients.map(i => buildIngredientString(i.amount, i.unit, i.name)).filter(v => v.trim() !== ""),
      instructions: instructionsText.split('\n').map(s => s.trim()).filter(Boolean),
      categoryId: selectedCategory || null,
      audience,
      isDrink,
      ...(importBanner?.sourceUrl ? { sourceUrl: importBanner.sourceUrl, mealSourceType: 'imported_website' } : {}),
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
        const hadSourceUrl = !!(cleanData as any).sourceUrl;
        handleDialogOpenChange(false);
        setCompletionMeal({ id: meal.id, name: meal.name, isDrink: isDrink, audience });
        onMealCreated?.(meal, hadSourceUrl);
      }
    });
  };

  // Show paste-text helper when we have a partial import AND at least one key field is still empty
  const ingredientsAreEmpty = fields.every(f => !f.name.trim());
  const instructionsAreEmpty = !instructionsText.trim();
  const titleIsEmpty = !form.watch("name").trim();
  const showPasteHelper = !!(importBanner?.partial && (ingredientsAreEmpty || instructionsAreEmpty || titleIsEmpty));

  return (
    <>
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      {externalOpen === undefined && (
        <DialogTrigger asChild>
          <Button title="Add Recipe" className="px-2 sm:px-4" data-testid="button-add-meal">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Recipe</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Recipe</DialogTitle>
          <DialogDescription>
            Paste a link, recipe text, or the ingredients you have, and THA will create a recipe card for you - or fill it in manually.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto space-y-5 pr-1 -mr-1 py-1">

            {/* ── UNIFIED INPUT BAR ───────────────────────────────────────── */}
            <div className="space-y-2 pb-3 border-b border-border">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder={listening ? "Listening… speak your recipe" : "Paste a URL or recipe text to import…"}
                    value={unifiedInput}
                    onChange={e => { setUnifiedInput(e.target.value); setImportFailureMsg(null); }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleUnifiedSubmit(); } }}
                    disabled={isImporting || listening}
                    className="pr-[88px] text-sm"
                    data-testid="input-unified-import"
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className={`h-7 w-7 ${listening ? 'text-destructive animate-pulse' : 'text-muted-foreground hover:text-foreground'}`}
                      onClick={listening ? stopListening : startListening}
                      title={listening ? "Stop recording" : "Speak recipe"}
                      data-testid="button-mic-input"
                    >
                      <Mic className="h-3.5 w-3.5" />
                    </Button>
                    {onScan && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => { handleDialogOpenChange(false); onScan(); }}
                        title="Scan image"
                        data-testid="button-camera-input"
                      >
                        <Camera className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={handleUnifiedSubmit}
                      disabled={isImporting || !unifiedInput.trim()}
                      title="Import recipe"
                      data-testid="button-unified-import"
                    >
                      {isImporting
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Sparkles className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
              {!importFailureMsg && !isImporting && (
                <p className="text-xs text-muted-foreground">
                  Works with BBC Good Food, AllRecipes, Instagram, TikTok, and most recipe sites.
                </p>
              )}
              {isImporting && (
                <p className="text-xs text-muted-foreground animate-pulse">Importing recipe…</p>
              )}
              {importFailureMsg && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200/70 dark:border-amber-700/40 bg-amber-50/60 dark:bg-amber-950/20 px-3 py-2">
                  <Info className="h-3.5 w-3.5 text-amber-600/80 dark:text-amber-400/70 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700/90 dark:text-amber-300/80">{importFailureMsg}</p>
                </div>
              )}
            </div>

            {/* ── IMPORT BANNER (compact single-line after AI import) ───────── */}
            {importBanner && (
              <div className={`flex items-center gap-2 rounded-md border px-3 py-2 ${importBanner.partial ? "border-amber-300/80 dark:border-amber-600/50 bg-amber-50/80 dark:bg-amber-950/30" : "border-amber-200/70 dark:border-amber-700/40 bg-amber-50/60 dark:bg-amber-950/20"}`}>
                {importBanner.partial
                  ? <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  : importBanner.isVoice
                  ? <Mic className="h-3.5 w-3.5 text-amber-600/80 dark:text-amber-400/70 shrink-0" />
                  : <ExternalLink className="h-3.5 w-3.5 text-amber-600/80 dark:text-amber-400/70 shrink-0" />}
                <p className="text-[12px] text-amber-700/90 dark:text-amber-300/80 flex-1 min-w-0 leading-none truncate">
                  {importBanner.partial
                    ? (importBanner.isVoice ? "Partial voice import — please review and complete." : "Partial import — some fields may be incomplete.")
                    : importBanner.isVoice
                    ? "Voice recipe structured — please review before saving."
                    : "Imported — please validate before saving."}
                  {importBanner.sourceUrl && !importBanner.isVoice && (
                    <a href={importBanner.sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-1.5 underline underline-offset-2 text-amber-600/70 dark:text-amber-400/60">
                      {importBanner.sourceUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                    </a>
                  )}
                </p>
              </div>
            )}

            {/* ── PASTE-TEXT HELPER (partial import with missing fields) ────── */}
            {showPasteHelper && (
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-3 space-y-2">
                <p className="text-xs text-muted-foreground leading-snug">
                  We couldn't extract all of this recipe from the source. Paste the recipe text here to improve the import.
                </p>
                <Textarea
                  placeholder={"Paste the full recipe text here — e.g. from the post caption, comments, or the recipe website."}
                  value={pasteHelperText}
                  onChange={e => { setPasteHelperText(e.target.value); setPasteHelperMsg(null); }}
                  className="min-h-[100px] text-sm resize-none"
                  disabled={isPasteImporting}
                  data-testid="textarea-paste-helper"
                />
                {pasteHelperMsg && (
                  <p className="text-xs text-amber-700 dark:text-amber-300">{pasteHelperMsg}</p>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handlePasteImprove}
                  disabled={isPasteImporting || !pasteHelperText.trim()}
                  className="w-full"
                  data-testid="button-paste-improve"
                >
                  {isPasteImporting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                  {isPasteImporting ? "Importing…" : "Improve import"}
                </Button>
              </div>
            )}

            {/* ── INGREDIENT SUGGESTIONS ──────────────────────────────────── */}
            {suggestions && (
              <div className="space-y-2.5">
                <p className="text-xs text-muted-foreground">
                  THA can turn these ingredients into a meal. Pick a recipe idea to continue.
                </p>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    className="w-full text-left rounded-lg border border-border bg-card hover:bg-muted/50 hover:border-primary/40 transition-colors px-3 py-2.5 space-y-1 disabled:opacity-50 disabled:pointer-events-none"
                    onClick={() => handleSelectSuggestion(s)}
                    disabled={isImporting}
                    data-testid={`suggestion-card-${i}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium leading-snug">{s.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 mt-0.5 ${
                        s.effort === 'easy'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                          : s.effort === 'medium'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                      }`}>
                        {s.effort === 'easy' ? 'Easy' : s.effort === 'medium' ? 'Medium' : 'Involved'}
                      </span>
                    </div>
                    {s.description && (
                      <p className="text-xs text-muted-foreground leading-snug">{s.description}</p>
                    )}
                    {s.extraIngredients?.length > 0 && (
                      <p className="text-[11px] text-muted-foreground/70">
                        Also needs: {s.extraIngredients.join(', ')}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* ── ACCORDION SECTIONS ──────────────────────────────────────── */}
            {!suggestions && (() => {
              const recipeName = form.watch("name");
              const ingredientCount = fields.filter(f => f.name?.trim()).length;
              const instructionStepCount = instructionsText.split('\n').filter(s => s.trim()).length;
              const dietCount = selectedDiets.length;
              const currentImageUrl = form.watch("imageUrl");

              const sectionHeader = (id: typeof openSection, label: string, summary: string) => (
                <button
                  type="button"
                  className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                  onClick={() => toggleSection(id)}
                  data-testid={`section-toggle-${id}`}
                >
                  <span>{label}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {openSection !== id && summary && (
                      <span className="text-xs text-muted-foreground font-normal max-w-[160px] truncate">{summary}</span>
                    )}
                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${openSection === id ? 'rotate-180' : ''}`} />
                  </div>
                </button>
              );

              return (
                <div className="space-y-2">

                  {/* BASICS */}
                  <div className="border border-border rounded-lg overflow-hidden">
                    {sectionHeader('basics', 'Basics', recipeName || 'Name, category, servings')}
                    {openSection === 'basics' && (
                      <div className="p-3 space-y-3 border-t border-border">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Recipe Name</FormLabel>
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
                        {user?.role === 'admin' && (
                          <FormField
                            control={form.control}
                            name="kind"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select value={field.value ?? "meal"} onValueChange={field.onChange}>
                                  <SelectTrigger data-testid="select-meal-kind">
                                    <SelectValue placeholder="Select type..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="meal">Meal</SelectItem>
                                    <SelectItem value="component">Component</SelectItem>
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">Components are reusable building blocks (e.g. Bone Broth, Pepper Sauce).</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
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
                      </div>
                    )}
                  </div>

                  {/* INGREDIENTS */}
                  <div className="border border-border rounded-lg overflow-hidden">
                    {sectionHeader('ingredients', 'Ingredients', ingredientCount > 0 ? `${ingredientCount} item${ingredientCount === 1 ? '' : 's'}` : 'Empty')}
                    {openSection === 'ingredients' && (
                      <div className="p-3 space-y-2 border-t border-border">
                        <div className="text-xs text-muted-foreground flex gap-2">
                          <span className="w-14 shrink-0 text-center">Qty</span>
                          <span className="w-[72px] shrink-0">Unit</span>
                          <span className="flex-1">Ingredient</span>
                        </div>
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {fields.map((field, index) => (
                            <FormField
                              key={field.id}
                              control={form.control}
                              name={`ingredients.${index}.name`}
                              render={() => (
                                <FormItem>
                                  <FormControl>
                                    <IngredientRow
                                      index={index}
                                      amount={form.watch(`ingredients.${index}.amount`)}
                                      unit={form.watch(`ingredients.${index}.unit`)}
                                      name={form.watch(`ingredients.${index}.name`)}
                                      onAmountChange={v => form.setValue(`ingredients.${index}.amount`, v)}
                                      onUnitChange={v => form.setValue(`ingredients.${index}.unit`, v)}
                                      onNameChange={v => form.setValue(`ingredients.${index}.name`, v)}
                                      onRemove={() => remove(index)}
                                      showRemove={!(fields.length === 1 && index === 0)}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full border-dashed"
                          onClick={() => append({ amount: "", unit: "", name: "" })}
                          data-testid="button-add-ingredient"
                        >
                          <Plus className="mr-2 h-3 w-3" />
                          Add Ingredient
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* METHOD / INSTRUCTIONS */}
                  <div className="border border-border rounded-lg overflow-hidden">
                    {sectionHeader('method', 'Method / Instructions', instructionStepCount > 0 ? `${instructionStepCount} step${instructionStepCount === 1 ? '' : 's'}` : 'Empty')}
                    {openSection === 'method' && (
                      <div className="p-3 border-t border-border space-y-1.5">
                        <Textarea
                          placeholder={"Enter the steps, one per line.\n\nE.g.:\nHeat oil in a pan over medium heat.\nAdd onion and cook for 5 minutes.\nStir in remaining ingredients and simmer."}
                          value={instructionsText}
                          onChange={e => setInstructionsText(e.target.value)}
                          className="min-h-[120px] text-sm resize-none"
                          data-testid="textarea-instructions"
                        />
                        <p className="text-[11px] text-muted-foreground">One step per line. Optional but recommended.</p>
                      </div>
                    )}
                  </div>

                  {/* OPTIONAL DETAILS */}
                  <div className="border border-border rounded-lg overflow-hidden">
                    {sectionHeader('optional', 'Optional details', dietCount > 0 ? `${dietCount} diet${dietCount === 1 ? '' : 's'}` : 'Diets, photo')}
                    {openSection === 'optional' && (
                      <div className="p-3 space-y-3 border-t border-border">
                        {allDiets.length > 0 && (
                          <div className="space-y-2">
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
                        {importBanner && (
                          currentImageUrl ? (
                            <div className="flex items-center gap-3">
                              <img
                                src={currentImageUrl}
                                alt="Recipe photo"
                                className="w-14 h-14 object-cover rounded-md border border-border shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground mb-1">Photo imported</p>
                                <button type="button" className="text-xs text-destructive hover:underline" onClick={() => form.setValue("imageUrl", null as any)}>Remove</button>
                              </div>
                            </div>
                          ) : (
                            <FormField
                              control={form.control}
                              name="imageUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-1.5 text-muted-foreground font-normal">
                                    <ImageIcon className="h-3.5 w-3.5" />
                                    Photo URL <span className="text-[11px] text-muted-foreground/60">(optional)</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="https://example.com/photo.jpg"
                                      {...field}
                                      value={field.value ?? ""}
                                      onChange={e => field.onChange(e.target.value || null)}
                                      data-testid="input-image-url"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          )
                        )}
                      </div>
                    )}
                  </div>

                </div>
              );
            })()}

            </div>
            <DialogFooter className="pt-3 shrink-0 border-t border-border">
              <Button type="button" variant="outline" onClick={() => handleDialogOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createMeal.isPending} data-testid="button-submit-meal">
                {createMeal.isPending ? "Creating..." : "Create Recipe"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {completionMeal && (
      <MealCompletionDialog
        open={true}
        onClose={() => setCompletionMeal(null)}
        meal={completionMeal}
      />
    )}
    </>
  );
}
