import { useState, useEffect, useMemo, useRef, useCallback, useDeferredValue, Fragment } from "react";
// CONV1 P6 (Phase 3) — the freezer consumes the one owner of household time
// instead of hand-rolling a private clock (HT1). shared/ is importable by both
// sides precisely so the rule has one implementation, not two.
import {
  DECLARED_DEFAULT_ZONE,
  civilDaysBetween,
  compareCivilDates,
  householdToday,
  parseCivilDate,
} from "@shared/time/household-time";
import { Skeleton } from "@/components/ui/skeleton";
import { AppleStencil } from "@/components/icons/apple-stencil";
import { useMeals, invalidateMealLibrary } from "@/hooks/use-meals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, X, Search, ChefHat, ImageOff, Flame, Beef, Wheat, Droplets, Activity, AlertTriangle, ArrowRight, Loader2, Sparkles, Cookie, Droplet, Leaf, Globe, Save, Download, Minus, ShoppingBasket, Check, Package, CalendarPlus, CalendarDays, Coffee, Sun, Moon, UtensilsCrossed, Snowflake, Microscope, Baby, PersonStanding, Wine, ExternalLink, Pencil, Camera, Mic, Share2, Zap, Layers, ScanLine, ListPlus, Info, ClipboardList, Image as ImageIcon, Wand2, ChevronDown, Users, UserPlus, Shield, Eye, EyeOff, Sliders, MoreVertical } from "lucide-react";
// PROD1 — adopt the canonical state owners (PX1-W4.8 / PX1-W0). PX1 built these
// and rolled them out to Home/Dashboard/Profile; the six bottom-nav rooms never
// adopted them. They are adopted here as a PAIR: EmptyState alone would make the
// "you have nothing" lie more confident on a failed load, not less.
import { EmptyState } from "@/components/ui/empty-state";
import { LoadError } from "@/components/ui/load-error";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CreateMealModal, type ImportedRecipeDraft } from "@/components/create-meal-modal";
import { RecipeScanReview, type RecipeScanData } from "@/components/RecipeScanReview";
import { MealImageWidget } from "@/components/MealImageWidget";
import BarcodeScanner from "@/components/BarcodeScanner";
import { MealCompletionDialog, type CompletionMeal } from "@/components/meal-completion-dialog";
import { IngredientRow, buildIngredientString, parseIngredientString } from "@/components/ingredient-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
import AppleRating from "@/components/AppleRating";
import { Switch } from "@/components/ui/switch";
import { shouldExcludeRecipe, type RecipeFields } from "@shared/dietRules";
import { useUser } from "@/hooks/use-user";
import { scoreMealSearch } from "@shared/food-synonyms";
// COOKBOOK1 — the Cookbook no longer decides for itself what belongs on its
// shelf. `shared/cookbook/curation.ts` is the single owner of that question
// (GEA17: the presentation layer owns no fact), and it retired this page's
// private `getMealDisplayCategory` / `SECTION_LABELS` / `MEAL_CATEGORY_ORDER`
// in the same change (GEA18: the successor retires the predecessor).
import {
  shelfForMeal,
  SHELF_ORDER,
  SHELF_LABELS,
  type CookbookShelf,
} from "@shared/cookbook/curation";
import { writePendingIngredients, appendPendingIngredient } from "@/lib/quick-list";
import { WorkspaceHeader, pageContainerClass } from "@/components/workspace-header";
import { CookbookWorkspacePanel, type CookbookWorkspaceMode } from "@/components/CookbookWorkspacePanel";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { compressImage, inferMimeFromFilename } from "@/lib/image-utils";

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
  /** When set, fires after "Who's eating?" dialog confirm instead of addToListMutation - routes to quick list. */
  onAddToQuickList?: (ingredients: string[]) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [qty, setQty] = useState(1);
  const { isMealInBasket, addToBasketAsync } = useBasket();
  const inBasket = isMealInBasket(mealId);

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
      toast({ title: "Added to basket", description: qty > 1 ? `${qty} × ${mealName}` : mealName });
    },
    onError: () => {
      toast({ title: "Couldn't add that to your basket", description: "Try again in a moment.", variant: "destructive" });
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

  const addProductToBasketMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', api.shoppingList.add.path, {
        productName: mealName,
        quantity: 1,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      toast({ title: "Added to basket", description: mealName });
    },
    onError: () => {
      toast({ title: "Couldn't add that product", description: "Try again in a moment.", variant: "destructive" });
    },
  });

  const [plannerOpen, setPlannerOpen] = useState(false);
  const [listContextOpen, setListContextOpen] = useState(false);
  const [listDialogMode, setListDialogMode] = useState<'basket' | 'quicklist'>('basket');

  return (
    <div className="w-full flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
      {/* Single action row: Qty | Quick List | Freeze | Planner | Analyse | Basket */}
      {/* Serving metadata moved to image overlay badge — see badge-serves-* testid */}
      <div className="grid grid-cols-6 gap-1">
        <div className="flex items-center justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-[11px] font-semibold realm-banner-btn"
                    aria-label={`How many to cook: currently ${qty}. Change`}
                    data-testid={`button-qty-${mealId}`}
                  >
                    {qty}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-12 p-1" align="center" side="top">
                  <div className="flex flex-col gap-0.5">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <Button
                        key={n}
                        size="sm"
                        variant="ghost"
                        className={n === qty ? "text-xs min-w-8 realm-banner-btn" : "text-xs min-w-8"}
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
            <TooltipContent><p className="text-xs">How many servings</p></TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center justify-center">
          {(onAddToList || (showListButton && onAddToQuickList)) ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-primary realm-banner-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onAddToList) {
                      onAddToList(ingredients);
                    } else if (isReadyMeal) {
                      appendPendingIngredient(mealName);
                      toast({ title: "Added to quick list", description: mealName });
                    } else {
                      setListDialogMode('quicklist');
                      setListContextOpen(true);
                    }
                  }}
                  aria-label="Add to quick list"
                  data-testid={`button-add-to-list-${mealId}`}
                >
                  <ListPlus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">Add to quick list</p></TooltipContent>
            </Tooltip>
          ) : null}
        </div>

        <div className="flex items-center justify-center">
          {isFreezerEligible ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-blue-400 realm-banner-btn"
                  onClick={(e) => { e.stopPropagation(); onFreezeClick(); }}
                  aria-label="Add to freezer"
                  data-testid={`button-freeze-${mealId}`}
                >
                  <Snowflake className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">Add to freezer</p></TooltipContent>
            </Tooltip>
          ) : null}
        </div>

        <div className="flex items-center justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 realm-banner-btn"
                onClick={(e) => { e.stopPropagation(); setPlannerOpen(true); }}
                aria-label="Add to planner"
                data-testid={`button-add-planner-${mealId}`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">Add to planner</p></TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center justify-center">
          {!isReadyMeal ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 realm-banner-btn"
                  onClick={(e) => { e.stopPropagation(); analyzeMutation.mutate(); }}
                  disabled={analyzeMutation.isPending}
                  aria-label="Analyse meal"
                  data-testid={`button-analyze-meal-${mealId}`}
                >
                  {analyzeMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Microscope className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">Analyse</p></TooltipContent>
            </Tooltip>
          ) : null}
        </div>

        <div className="flex items-center justify-center">
          {!hideBasket ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 realm-banner-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isReadyMeal) {
                      addProductToBasketMutation.mutate();
                    } else {
                      setListDialogMode('basket');
                      setListContextOpen(true);
                    }
                  }}
                  disabled={isReadyMeal ? addProductToBasketMutation.isPending : addToListMutation.isPending}
                  aria-label="Add to basket"
                  data-testid={`button-add-basket-${mealId}`}
                >
                  {(isReadyMeal ? addProductToBasketMutation.isPending : addToListMutation.isPending) ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShoppingBasket className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">Add to basket</p></TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>

      <AddToPlannerDialog mealId={mealId} mealName={mealName} isDrink={isDrink} audience={audience} open={plannerOpen} onOpenChange={setPlannerOpen} />

      <AddToShoppingListDialog
        mealName={mealName}
        open={listContextOpen}
        onOpenChange={setListContextOpen}
        onAdd={async (ctx) => {
          setListContextOpen(false);
          if (listDialogMode === 'quicklist') {
            onAddToQuickList!(ingredients);
            return;
          }
          // PX1-W0: the basket write is awaited, and the shopping-list write only
          // follows if it landed. Previously this fired the basket write into the
          // void and let the LIST call's success toast say "Added to basket".
          try {
            await addToBasketAsync({ mealId, quantity: qty });
          } catch {
            return; // useBasket has already said what went wrong.
          }
          addToListMutation.mutate(ctx);
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

// ── Mobile long-press action sheet for cookbook cards ────────────────────────
// Triggered by long-press on mobile; single-tap still navigates to meal detail.

// Desktop-only compact dropdown menu for cookbook grid cards.
// Mobile uses MobileMealActionSheet (bottom drawer) instead.
function CardActionsMenu({
  meal,
  onFreezeClick,
  onDelete,
  onImageChange,
  onMobileClick,
}: {
  meal: Meal;
  onFreezeClick: () => void;
  onDelete: () => void;
  onImageChange: (mealId: number, url: string | null) => void;
  onMobileClick: () => void;
}) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { addToBasketAsync } = useBasket();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [plannerOpen, setPlannerOpen] = useState(false);
  const [basketOpen, setBasketOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [imageLoading, setImageLoading] = useState<"upload" | "generate" | "remove" | null>(null);

  const addToListMutation = useMutation({
    mutationFn: async (ctx?: { eaterIds?: number[]; guestEaters?: GuestEater[] }) => {
      const res = await apiRequest('POST', api.shoppingList.generateFromMeals.path, {
        mealSelections: [{ mealId: meal.id, count: 1, ...(ctx?.eaterIds?.length ? { eaterIds: ctx.eaterIds } : {}), ...(ctx?.guestEaters?.length ? { guestEaters: ctx.guestEaters } : {}) }],
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.sources.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.prices.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      toast({ title: "Added to shopping", description: meal.name });
    },
    onError: () => toast({ title: "Couldn't add that to your basket", description: "Try again in a moment.", variant: "destructive" }),
  });

  const addProductMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', api.shoppingList.add.path, { productName: meal.name, quantity: 1 });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      toast({ title: "Added to shopping", description: meal.name });
    },
    onError: () => toast({ title: "Couldn't add product", variant: "destructive" }),
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', api.analyze.meal.path, { mealId: meal.id });
      return res.json() as Promise<AnalysisResult>;
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      setAnalysisOpen(true);
      queryClient.invalidateQueries({ queryKey: ['/api/meals', meal.id, 'nutrition'] });
      toast({ title: "Analysis complete", description: "Nutrition data calculated." });
    },
    onError: () => toast({ title: "Analysis failed", variant: "destructive" }),
  });

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", ""]);
    if (!allowed.has(file.type)) {
      toast({ variant: "destructive", title: "Invalid file type", description: "Please upload a JPEG, PNG, or WebP image." });
      return;
    }
    setImageLoading("upload");
    try {
      let uploadFile: File;
      try {
        const blob = await compressImage(file, 800, 0.85);
        uploadFile = new File([blob], "meal-photo.jpg", { type: "image/jpeg" });
      } catch {
        const effectiveType = file.type || inferMimeFromFilename(file.name) || "image/jpeg";
        uploadFile = new File([file], file.name || "upload.jpg", { type: effectiveType });
      }
      const fd = new FormData();
      fd.append("image", uploadFile);
      const uploadRes = await fetch("/api/media/upload", { method: "POST", body: fd, credentials: "include" });
      if (!uploadRes.ok) { const e = await uploadRes.json().catch(() => ({})); throw new Error((e as any).message || "Upload failed"); }
      const { url } = await uploadRes.json();
      const patchRes = await fetch(buildUrl(api.meals.updateImage.path, { id: meal.id }), {
        method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ imageUrl: url }),
      });
      if (!patchRes.ok) throw new Error("Could not save image to recipe.");
      const updated = await patchRes.json();
      onImageChange(meal.id, updated.imageUrl ?? url);
      toast({ title: "Photo saved" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err?.message || "Please try again." });
    } finally {
      setImageLoading(null);
    }
  };

  const handleGenerate = async () => {
    setImageLoading("generate");
    try {
      const res = await fetch(buildUrl(api.meals.generateImage.path, { id: meal.id }), { method: "POST", credentials: "include" });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as any).message || "Generation failed"); }
      const updated = await res.json();
      onImageChange(meal.id, updated.imageUrl ?? null);
      toast({ title: "Illustration added" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Image generation failed", description: err?.message || "Please try again." });
    } finally {
      setImageLoading(null);
    }
  };

  const handleRemove = async () => {
    setImageLoading("remove");
    try {
      const res = await fetch(buildUrl(api.meals.updateImage.path, { id: meal.id }), {
        method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ imageUrl: null }),
      });
      if (!res.ok) throw new Error("Could not remove image.");
      onImageChange(meal.id, null);
      toast({ title: "Image removed" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Remove failed", description: err?.message || "Please try again." });
    } finally {
      setImageLoading(null);
    }
  };

  const btnClass = "h-7 w-7 bg-black/45 hover:bg-black/70 rounded-md flex items-center justify-center text-white transition-colors";

  return (
    <>
      {/* Mobile: bottom action sheet */}
      <button
        className={`sm:hidden absolute bottom-1.5 right-1.5 z-20 ${btnClass}`}
        onClick={(e) => { e.stopPropagation(); onMobileClick(); }}
        aria-label="Recipe actions"
        data-testid={`button-card-actions-${meal.id}`}
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </button>

      {/* Desktop: compact anchored dropdown */}
      <div className="hidden sm:block absolute bottom-1.5 right-1.5 z-20" onClick={(e) => e.stopPropagation()}>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/*" className="hidden" onChange={handleFileSelected} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={btnClass} aria-label="Recipe actions" data-testid={`button-card-actions-${meal.id}`}>
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-52">
            <DropdownMenuItem onSelect={() => navigate(`/meals/${meal.id}`)}>
              <Eye className="h-4 w-4 shrink-0" />
              Open recipe
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setPlannerOpen(true)}>
              <CalendarDays className="h-4 w-4 shrink-0" />
              Add to planner
            </DropdownMenuItem>
            {meal.isReadyMeal ? (
              <DropdownMenuItem onSelect={() => addProductMutation.mutate()} disabled={addProductMutation.isPending}>
                <ShoppingBasket className="h-4 w-4 shrink-0" />
                Add to shopping
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => setBasketOpen(true)}>
                <ShoppingBasket className="h-4 w-4 shrink-0" />
                Add to shopping
              </DropdownMenuItem>
            )}
            {!meal.isReadyMeal && (
              <DropdownMenuItem onSelect={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}>
                <Microscope className="h-4 w-4 shrink-0" />
                Analyse nutrition
              </DropdownMenuItem>
            )}
            {!!meal.isFreezerEligible && (
              <DropdownMenuItem onSelect={onFreezeClick}>
                <Snowflake className="h-4 w-4 shrink-0" />
                Add to freezer
              </DropdownMenuItem>
            )}
            {!meal.isSystemMeal && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setTimeout(() => fileInputRef.current?.click(), 50)} disabled={imageLoading !== null}>
                  <Camera className="h-4 w-4 shrink-0" />
                  {meal.imageUrl ? "Replace photo" : "Add photo"}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleGenerate} disabled={imageLoading !== null}>
                  <Wand2 className="h-4 w-4 shrink-0" />
                  {meal.imageUrl ? "Illustrate it again" : "Illustrate this recipe"}
                </DropdownMenuItem>
                {meal.imageUrl && (
                  <DropdownMenuItem onSelect={handleRemove} disabled={imageLoading !== null} className="text-destructive focus:text-destructive">
                    <ImageOff className="h-4 w-4 shrink-0" />
                    Remove photo
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 shrink-0" />
                  Delete recipe
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AddToPlannerDialog
        mealId={meal.id}
        mealName={meal.name}
        isDrink={!!meal.isDrink}
        audience={meal.audience || "adult"}
        open={plannerOpen}
        onOpenChange={setPlannerOpen}
      />
      <AddToShoppingListDialog
        mealName={meal.name}
        open={basketOpen}
        onOpenChange={setBasketOpen}
        onAdd={async (ctx) => {
          setBasketOpen(false);
          try {
            await addToBasketAsync({ mealId: meal.id, quantity: 1 });
          } catch {
            return; // useBasket has already said what went wrong.
          }
          addToListMutation.mutate(ctx);
        }}
      />
      <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{meal.name} – Nutrition Analysis</DialogTitle>
          </DialogHeader>
          {analysisResult && <AnalysisResultContent analysis={analysisResult} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function MobileMealActionSheet({
  meal,
  open,
  onClose,
  onAddToFreezer,
  isSystemMeal,
  onImageChange,
  onDelete,
  onAddToQuickList,
}: {
  meal: Meal | null;
  open: boolean;
  onClose: () => void;
  onAddToFreezer: (mealId: number) => void;
  isSystemMeal?: boolean;
  onImageChange?: (mealId: number, url: string | null) => void;
  onDelete?: () => void;
  onAddToQuickList?: (ingredients: string[]) => void;
}) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { addToBasketAsync } = useBasket();
  const [qty, setQty] = useState(1);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [basketOpen, setBasketOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const [imageLoading, setImageLoading] = useState<"upload" | "generate" | "remove" | null>(null);

  const addToListMutation = useMutation({
    mutationFn: async (ctx?: { eaterIds?: number[]; guestEaters?: GuestEater[] }) => {
      const res = await apiRequest('POST', api.shoppingList.generateFromMeals.path, {
        mealSelections: [{ mealId: meal!.id, count: qty, ...(ctx?.eaterIds?.length ? { eaterIds: ctx.eaterIds } : {}), ...(ctx?.guestEaters?.length ? { guestEaters: ctx.guestEaters } : {}) }],
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.sources.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.prices.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      toast({ title: "Added to shopping", description: qty > 1 ? `${qty} × ${meal?.name}` : meal?.name });
      onClose();
    },
    onError: () => toast({ title: "Couldn't add that to your basket", description: "Try again in a moment.", variant: "destructive" }),
  });

  const addProductMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', api.shoppingList.add.path, { productName: meal!.name, quantity: qty });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      toast({ title: "Added to shopping", description: meal?.name });
      onClose();
    },
    onError: () => toast({ title: "Couldn't add product", variant: "destructive" }),
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', api.analyze.meal.path, { mealId: meal!.id });
      return res.json() as Promise<AnalysisResult>;
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      setAnalysisOpen(true);
      queryClient.invalidateQueries({ queryKey: ['/api/meals', meal!.id, 'nutrition'] });
    },
    onError: () => toast({ title: "Analysis failed", variant: "destructive" }),
  });

  const CLIENT_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", ""]);

  const handleSheetFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!meal || !onImageChange) return;
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!CLIENT_PHOTO_TYPES.has(file.type)) {
      toast({ variant: "destructive", title: "Invalid file type", description: "Please upload a JPEG, PNG, or WebP image." });
      return;
    }
    setImageLoading("upload");
    try {
      let uploadFile: File;
      try {
        const blob = await compressImage(file, 800, 0.85);
        uploadFile = new File([blob], "meal-photo.jpg", { type: "image/jpeg" });
      } catch {
        const effectiveType = file.type || inferMimeFromFilename(file.name) || "image/jpeg";
        uploadFile = new File([file], file.name || "upload.jpg", { type: effectiveType });
      }
      const fd = new FormData();
      fd.append("image", uploadFile);
      const uploadRes = await fetch("/api/media/upload", { method: "POST", body: fd, credentials: "include" });
      if (!uploadRes.ok) { const e = await uploadRes.json().catch(() => ({})); throw new Error((e as any).message || "Upload failed"); }
      const { url } = await uploadRes.json();
      const patchRes = await fetch(buildUrl(api.meals.updateImage.path, { id: meal.id }), {
        method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ imageUrl: url }),
      });
      if (!patchRes.ok) throw new Error("Could not save image to recipe.");
      const updated = await patchRes.json();
      onImageChange(meal.id, updated.imageUrl ?? url);
      toast({ title: "Photo saved" });
      onClose();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err?.message || "Please try again." });
    } finally {
      setImageLoading(null);
    }
  };

  const handleSheetGenerate = async () => {
    if (!meal || !onImageChange) return;
    setImageLoading("generate");
    try {
      const res = await fetch(buildUrl(api.meals.generateImage.path, { id: meal.id }), { method: "POST", credentials: "include" });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as any).message || "Generation failed"); }
      const updated = await res.json();
      onImageChange(meal.id, updated.imageUrl ?? null);
      toast({ title: "Illustration added" });
      onClose();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Image generation failed", description: err?.message || "Please try again." });
    } finally {
      setImageLoading(null);
    }
  };

  const handleSheetRemove = async () => {
    if (!meal || !onImageChange) return;
    setImageLoading("remove");
    try {
      const res = await fetch(buildUrl(api.meals.updateImage.path, { id: meal.id }), {
        method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ imageUrl: null }),
      });
      if (!res.ok) throw new Error("Could not remove image.");
      onImageChange(meal.id, null);
      toast({ title: "Image removed" });
      onClose();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Remove failed", description: err?.message || "Please try again." });
    } finally {
      setImageLoading(null);
    }
  };

  const handleQuickList = () => {
    if (!meal) return;
    if (meal.isReadyMeal) {
      appendPendingIngredient(meal.name);
      toast({ title: "Added to quick list", description: meal.name });
    } else {
      onAddToQuickList?.(meal.ingredients);
    }
    onClose();
  };

  if (!meal) return null;

  const metaParts: string[] = [];
  if (meal.servings != null && meal.servings >= 1) metaParts.push(`Serves ${meal.servings}`);
  if (!meal.isReadyMeal && meal.ingredients.length > 0) metaParts.push(`${meal.ingredients.length} ingredients`);

  return (
    <>
      <Drawer open={open} onOpenChange={(v) => !v && onClose()} shouldScaleBackground={false}>
        <DrawerContent className="flex flex-col max-h-[85vh]" data-testid="drawer-meal-action-sheet" data-realm="cookbook">

          {/* ── Recipe context header ── */}
          <div className="flex items-center gap-3 px-4 pt-1 pb-3 shrink-0 realm-header-bg">
            {meal.imageUrl ? (
              <img src={meal.imageUrl} alt={meal.name} className="h-14 w-14 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <ChefHat className="h-6 w-6 text-muted-foreground/40" />
              </div>
            )}
            <div className="min-w-0">
              <DrawerTitle className="text-sm font-semibold leading-snug">{meal.name}</DrawerTitle>
              {metaParts.length > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">{metaParts.join(" · ")}</p>
              )}
            </div>
          </div>
          <div className="w-full h-px shrink-0 bg-[var(--realm-border)]" />

          {/* ── Scrollable workspace body ── */}
          <div
            className="flex-1 overflow-y-auto px-3 pt-3 pb-2 space-y-4"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
          >

            {/* ── Quantity ── */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-1 mb-2">Quantity</p>
              <div className="flex items-center gap-3 px-1">
                <button
                  className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 active:bg-muted/60 transition-colors disabled:opacity-40"
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  data-testid="workspace-qty-minus"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-base font-semibold w-6 text-center tabular-nums" data-testid="workspace-qty-value">{qty}</span>
                <button
                  className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 active:bg-muted/60 transition-colors"
                  onClick={() => setQty(q => Math.min(10, q + 1))}
                  disabled={qty >= 10}
                  data-testid="workspace-qty-plus"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* ── Quick Actions ── */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-1 mb-2">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 rounded-xl bg-muted/40 hover:bg-muted/60 active:bg-muted/80 transition-colors"
                  onClick={() => setPlannerOpen(true)}
                  data-testid={`sheet-action-planner-${meal.id}`}
                >
                  <CalendarDays className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-xs font-medium text-center leading-tight">Add to Planner</span>
                </button>

                <button
                  className="flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 rounded-xl bg-muted/40 hover:bg-muted/60 active:bg-muted/80 transition-colors disabled:opacity-50"
                  onClick={() => meal.isReadyMeal ? addProductMutation.mutate() : setBasketOpen(true)}
                  disabled={meal.isReadyMeal ? addProductMutation.isPending : addToListMutation.isPending}
                  data-testid={`sheet-action-shopping-${meal.id}`}
                >
                  {(meal.isReadyMeal ? addProductMutation.isPending : addToListMutation.isPending)
                    ? <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                    : <ShoppingBasket className="h-5 w-5 text-primary shrink-0" />}
                  <span className="text-xs font-medium text-center leading-tight">Add to Shopping</span>
                </button>

                {onAddToQuickList && (
                  <button
                    className="flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 rounded-xl bg-muted/40 hover:bg-muted/60 active:bg-muted/80 transition-colors"
                    onClick={handleQuickList}
                    data-testid={`sheet-action-quicklist-${meal.id}`}
                  >
                    <ListPlus className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-xs font-medium text-center leading-tight">Quick List</span>
                  </button>
                )}

                {meal.isFreezerEligible && (
                  <button
                    className="flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 rounded-xl bg-muted/40 hover:bg-muted/60 active:bg-muted/80 transition-colors"
                    onClick={() => { onClose(); onAddToFreezer(meal.id); }}
                    data-testid={`sheet-action-freeze-${meal.id}`}
                  >
                    <Snowflake className="h-5 w-5 text-blue-400 shrink-0" />
                    <span className="text-xs font-medium text-center leading-tight">Add to Freezer</span>
                  </button>
                )}
              </div>
            </div>

            {/* ── Tools ── */}
            {!meal.isReadyMeal && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-1 mb-1">Tools</p>
                <button
                  className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-accent/50 active:bg-accent/70 transition-colors text-left disabled:opacity-50"
                  onClick={() => analyzeMutation.mutate()}
                  disabled={analyzeMutation.isPending}
                  data-testid={`sheet-action-analyse-${meal.id}`}
                >
                  {analyzeMutation.isPending
                    ? <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                    : <Microscope className="h-5 w-5 text-muted-foreground shrink-0" />}
                  <span className="text-sm font-medium">Analyse Nutrition</span>
                </button>
              </div>
            )}

            {/* ── Recipe ── */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-1 mb-1">Recipe</p>
              <button
                className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-accent/50 active:bg-accent/70 transition-colors text-left"
                onClick={() => { onClose(); navigate(`/meals/${meal.id}`); }}
                data-testid={`sheet-action-view-${meal.id}`}
              >
                <Eye className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium">Open Full Recipe</span>
              </button>
            </div>

            {/* ── Manage Recipe ── */}
            {!isSystemMeal && onImageChange && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-1 mb-1">Manage Recipe</p>
                <input ref={imageFileRef} type="file" accept="image/*" className="hidden" onChange={handleSheetFileSelected} />
                <button
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-accent/50 active:bg-accent/70 transition-colors text-left disabled:opacity-50"
                  onClick={() => { setTimeout(() => imageFileRef.current?.click(), 50); }}
                  disabled={!!imageLoading}
                  data-testid={`sheet-action-photo-replace-${meal.id}`}
                >
                  {imageLoading === "upload" ? <Loader2 className="h-4 w-4 animate-spin shrink-0 text-muted-foreground" /> : <Camera className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <span className="text-sm text-muted-foreground">{meal.imageUrl ? "Replace Photo" : "Add Photo"}</span>
                </button>
                <button
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-accent/50 active:bg-accent/70 transition-colors text-left disabled:opacity-50"
                  onClick={handleSheetGenerate}
                  disabled={!!imageLoading}
                  data-testid={`sheet-action-photo-generate-${meal.id}`}
                >
                  {imageLoading === "generate" ? <Loader2 className="h-4 w-4 animate-spin shrink-0 text-muted-foreground" /> : <Wand2 className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <span className="text-sm text-muted-foreground">{meal.imageUrl ? "Illustrate it again" : "Illustrate this recipe"}</span>
                </button>
                {meal.imageUrl && (
                  <button
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-accent/50 active:bg-accent/70 transition-colors text-left disabled:opacity-50"
                    onClick={handleSheetRemove}
                    disabled={!!imageLoading}
                    data-testid={`sheet-action-photo-remove-${meal.id}`}
                  >
                    {imageLoading === "remove" ? <Loader2 className="h-4 w-4 animate-spin shrink-0 text-muted-foreground" /> : <ImageOff className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className="text-sm text-muted-foreground">Remove Photo</span>
                  </button>
                )}
              </div>
            )}

            {/* ── Delete ── */}
            {!isSystemMeal && onDelete && (
              <>
                <div className="w-full h-px bg-[var(--realm-border)]" />
                <div>
                  <button
                    className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-destructive/10 active:bg-destructive/20 transition-colors text-left text-destructive"
                    onClick={onDelete}
                    data-testid={`sheet-action-delete-${meal.id}`}
                  >
                    <Trash2 className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">Delete Recipe</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <AddToPlannerDialog
        mealId={meal.id}
        mealName={meal.name}
        isDrink={!!meal.isDrink}
        audience={meal.audience || "adult"}
        open={plannerOpen}
        onOpenChange={(v) => { setPlannerOpen(v); if (!v) onClose(); }}
      />

      <AddToShoppingListDialog
        mealName={meal.name}
        open={basketOpen}
        onOpenChange={setBasketOpen}
        onAdd={async (ctx) => {
          setBasketOpen(false);
          try {
            await addToBasketAsync({ mealId: meal.id, quantity: qty });
          } catch {
            return; // useBasket has already said what went wrong.
          }
          addToListMutation.mutate(ctx);
        }}
      />

      <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Meal Analysis
            </DialogTitle>
            <DialogDescription>Nutrition breakdown, allergen detection, and healthier suggestions</DialogDescription>
          </DialogHeader>
          {analysisResult && <AnalysisResultContent analysis={analysisResult} />}
        </DialogContent>
      </Dialog>
    </>
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
      toast({ title: "Couldn't add that to your planner", description: "Try again in a moment.", variant: "destructive" });
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
              <p className="text-sm text-muted-foreground">Optional - skip to add without context.</p>
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
                      aria-label="Guest name"
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
                      <Button variant="default" size="sm" className="h-7 text-xs" onClick={addPendingGuest} disabled={!newGuestName.trim()}>Add</Button>
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
                        <button onClick={() => setPendingGuests(prev => prev.filter(x => x.id !== g.id))} aria-label="Remove guest" className="text-muted-foreground hover:text-foreground shrink-0">
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
                <Button variant="default"
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
                <Button variant="default"
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
            Optional - skip to add <span className="font-medium text-foreground">{mealName}</span> without context.
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
                  aria-label="Guest name"
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
                  <Button variant="default" size="sm" className="h-7 text-xs" onClick={addPendingGuest} disabled={!newGuestName.trim()}>Add</Button>
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
                    <button onClick={() => setPendingGuests(prev => prev.filter(x => x.id !== g.id))} aria-label="Remove guest" className="text-muted-foreground hover:text-foreground shrink-0">
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
          <Button variant="default"
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
  const [listDialogMode, setListDialogMode] = useState<'basket' | 'quicklist'>('basket');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const { isMealInBasket, addToBasketAsync } = useBasket();

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
      invalidateMealLibrary(queryClient);
      navigate(`/meals/${newMeal.id}`);
    } catch {
      toast({ title: "Couldn't create an editable copy", description: "Your original recipe is untouched — try again.", variant: "destructive" });
    }
    setPendingAction(null);
  };

  const handleBasket = () => {
    setListDialogMode('basket');
    setListContextOpen(true);
  };

  const doAddToList = async (ctx?: { eaterIds?: number[]; guestEaters?: GuestEater[] }) => {
    setPendingAction("basket");
    const mealId = await ensureImported();
    if (!mealId) { setPendingAction(null); return; }
    // PX1-W0: the basket write is awaited FIRST. It used to be fired unawaited, and
    // the shopping-list POST below was the one whose success was toasted as
    // "Added to basket" — so a basket that never took the meal said it had.
    try {
      await addToBasketAsync({ mealId, quantity: 1 });
    } catch {
      setPendingAction(null);
      return; // useBasket has already said what went wrong.
    }
    try {
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
      toast({ title: "Added to basket", description: recipe.name });
    } catch {
      // The basket DID take the meal — only its ingredients did not reach the list.
      // Saying "failed to add to basket" here would be the same lie in reverse.
      toast({
        title: "Couldn't add the ingredients to your shopping list",
        description: `${recipe.name} is in your basket. Please try adding it to the list again.`,
        variant: "destructive",
      });
    }
    setPendingAction(null);
  };

  const handleAddToList = async () => {
    if (showListButton && onAddToQuickList) {
      setListDialogMode('quicklist');
      setListContextOpen(true);
      return;
    }
    if (!onAddToList) return;
    setPendingAction("list");
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
              className="realm-banner-btn"
              onClick={handleEdit}
              disabled={isDisabled}
              aria-label="Edit recipe"
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
              className="realm-banner-btn"
              onClick={handleBasket}
              disabled={isDisabled}
              aria-label="Add to basket"
              data-testid={`button-web-basket-${recipe.id}`}
            >
              {pendingAction === "basket" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBasket className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent><p className="text-xs">Add to basket</p></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="realm-banner-btn"
              onClick={handleAnalyse}
              disabled={isDisabled}
              aria-label="Analyse recipe"
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
              className="realm-banner-btn"
              onClick={handlePlanner}
              disabled={isDisabled}
              aria-label="Add to planner"
              data-testid={`button-web-planner-${recipe.id}`}
            >
              {pendingAction === "planner" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent><p className="text-xs">Add to planner</p></TooltipContent>
        </Tooltip>
        {(onAddToList || (showListButton && onAddToQuickList)) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="text-primary realm-banner-btn"
                onClick={handleAddToList}
                disabled={isDisabled}
                aria-label="Add to quick list"
                data-testid={`button-web-add-to-list-${recipe.id}`}
              >
                {pendingAction === "list" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListPlus className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">Add to quick list</p></TooltipContent>
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
          if (listDialogMode === 'quicklist') {
            const ingredients = importedMeal?.ingredients || recipe.ingredients || [];
            onAddToQuickList!(ingredients);
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

/**
 * COOKBOOK1 — RETIRED: `MEAL_CATEGORY_ORDER` and `SECTION_LABELS`.
 *
 * Both were private to this page, which meant the Cookbook was the owner of
 * "what kind of recipe is this?" — a fact about a meal, owned by a component
 * that renders it. Their successor is `@shared/cookbook/curation`
 * (`SHELF_ORDER`, `SHELF_LABELS`, `shelfForMeal`), imported at the top of this
 * file. Nothing here decides shelving any more.
 *
 * The label "Wholefood Suggestions" died with them. It sat above five hundred
 * template-generated recipes and was wrong twice over: a room does not suggest
 * (GEA21), and what sat beneath it was a library, not a set of suggestions.
 */
const CATEGORY_DROPDOWN_ORDER = ["Drink", "Smoothie", "Baby Meal", "Kids Meal", "Frozen Meal"];

/**
 * Render a stored civil date (`YYYY-MM-DD` text) in the viewer's locale.
 *
 * CONV1 P6 / BEH-6. The retired shape was `new Date(frozen.frozenDate)
 * .toLocaleDateString()`, which parses a bare date as UTC midnight and then
 * renders it in the *local* zone — so a stored 17 July displays as 16 July for
 * every household west of Greenwich. Building the Date from civil PARTS gives it
 * no zone to convert through, so what is stored is what is shown.
 *
 * This is a display formatter, not a derivation: the civil date is parsed by the
 * owner (`shared/time/household-time.ts`); only the locale rendering is local to
 * this page, which is the UI's concern and not Household Time's (HT13).
 */
function displayCivilDate(text: string | null): string {
  const date = parseCivilDate(text);
  if (date === null) return text ?? "";
  return new Date(date.year, date.month - 1, date.day).toLocaleDateString();
}

/**
 * COOKBOOK1 — RETIRED: `getMealDisplayCategory`.
 *
 * Replaced by `shelfForMeal` from `@shared/cookbook/curation`. The old function
 * could not tell an authored THA recipe from a template-generated one — it
 * returned `"tha_meals"` for all five hundred — which is precisely why the room
 * presented a generator's output as a cookbook.
 */

export default function MealsPage() {
  const { meals, isLoading, isError: mealsError, refetch: refetchMeals, deleteMeal, createMeal } = useMeals();
  const { user } = useUser();
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState(() => {
    const params = new URLSearchParams(searchStr);
    return params.get("q") || "";
  });
  // PX1-W3 (fnd-px-cookbook-search-jank / -refetch): the input renders from
  // searchTerm immediately; the expensive work — filtering and fuzzy-scoring
  // 884+ meals, and the visible-set nutrition fetch keyed off the result — runs
  // against this deferred value, so typing never waits for it and intermediate
  // keystrokes never reach the network.
  const deferredSearchTerm = useDeferredValue(searchTerm);
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
  const [webDietPattern, setWebDietPattern] = useState<string>("");
  const [webDietRestrictions, setWebDietRestrictions] = useState<string[]>([]);
  const [webSearchResults, setWebSearchResults] = useState<WebSearchRecipe[]>([]);
  const [webHasMore, setWebHasMore] = useState(false);
  const [webCurrentPage, setWebCurrentPage] = useState(1);
  const [webIsSearching, setWebIsSearching] = useState(false);
  const [webSearchQuery, setWebSearchQuery] = useState("");
  const [cookbookMode, setCookbookMode] = useState<CookbookWorkspaceMode>(null);
  const [mobileCookbookOpen, setMobileCookbookOpen] = useState(false);
  // PX1-W2 (fnd-px-invisible-destructive-controls): every recipe-delete path fired
  // deleteMeal.mutate immediately — a whole recipe gone with no ask. The canonical
  // AlertDialog asks first; all three delete paths route through it.
  const [confirmDeleteMeal, setConfirmDeleteMeal] = useState<{ id: number; name: string } | null>(null);
  const [cookbookAddRecipeOpen, setCookbookAddRecipeOpen] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [scanData, setScanData] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const scanFileRef = useRef<HTMLInputElement>(null);
  const scanCancelledRef = useRef(false);
  const [visibleCount, setVisibleCount] = useState(48);
  /**
   * COOKBOOK1 — the wider library is opened, never scrolled into.
   *
   * The 490 template-generated recipes of the founding import are not deleted,
   * not hidden from search, and not withheld from the planner. They are simply
   * not part of what a household *browses*, because browsing 490 permutations
   * of three vegetables is the experience EXPREVIEW1 § 6 identified as the one
   * that stops a household believing the house. A household who wants them asks
   * once, and then has them.
   */
  const [libraryOpen, setLibraryOpen] = useState(false);
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

  // ── Planner import context ────────────────────────────────────────────────────
  interface PlannerImportCtx {
    mealName: string;
    day: string;
    slot: string;
    plannerDayId: number | null;
    plannerEntryId: number | null;
    openScan: boolean;
    /** Phase 3G: true when arriving from a placeholder resolve scan flow */
    plannerResolve: boolean;
    /** Phase 3G: where to return after linking ("placeholder-review" or null) */
    returnMode: string | null;
  }
  const [plannerImportCtx, setPlannerImportCtx] = useState<PlannerImportCtx | null>(null);
  const [plannerImportDialogOpen, setPlannerImportDialogOpen] = useState(false);
  const [plannerLinkOpen, setPlannerLinkOpen] = useState(false);
  const [plannerLinkData, setPlannerLinkData] = useState<{ mealId: number; mealName: string } | null>(null);

  const { data: allCategories = [] } = useQuery<MealCategory[]>({
    queryKey: ['/api/categories'],
  });
  const queryClient = useQueryClient();

  const cookbookVisibilityMutation = useMutation({
    mutationFn: async ({ mealId, show }: { mealId: number; show: boolean }) => {
      const res = await apiRequest("PATCH", `/api/meals/${mealId}/cookbook-visibility`, { show });
      if (!res.ok) throw new Error("Failed to update visibility");
      return res.json() as Promise<Meal>;
    },
    onSuccess: () => {
      invalidateMealLibrary(queryClient);
    },
    onError: () => {
      toast({ title: "Could not update cookbook visibility", variant: "destructive" });
    },
  });

  const { data: freezerMeals = [], refetch: refetchFreezer } = useQuery<FreezerMeal[]>({
    queryKey: ['/api/freezer'],
  });
  // CONV1 P6 / BEH-6 — the household's own clock, so the freezer can compare a
  // stored civil date against the household's today rather than against UTC.
  // `timeZone` is null until the household tells THA where it lives; the DECLARED
  // default resolves here, at read time, and is never written to the row (CP8).
  const { data: householdForClock } = useQuery<{ timeZone: string | null }>({
    queryKey: ['/api/household'],
  });
  const householdZone = householdForClock?.timeZone ?? DECLARED_DEFAULT_ZONE;
  const [addToFreezerMealId, setAddToFreezerMealId] = useState<number | null>(null);
  const [expandedMealId, setExpandedMealId] = useState<number | string | null>(null);
  /**
   * COOKBOOK1 — RETIRED: `cardInfoTabs`.
   *
   * Per-card Ingredients / Nutrition / "Why Good" tab state, for a tab strip
   * that no longer exists. `CookbookMealIntelligenceStrip` itself is untouched
   * and still owned by the planner (weekly-planner-page.tsx) — only the
   * Cookbook's copy of it came down.
   */

  // Three-dot action sheet state (mobile cookbook cards)
  const [actionSheetMeal, setActionSheetMeal] = useState<Meal | null>(null);
  const [webPreviewCache, setWebPreviewCache] = useState<Record<string, { ingredients: string[]; instructions: string[]; loading?: boolean; error?: string }>>({});

  const [expandedTab, setExpandedTab] = useState<"ingredients" | "method">("ingredients");
  const [freezerPortions, setFreezerPortions] = useState(4);
  const [freezerLabel, setFreezerLabel] = useState("");
  const [freezerNotes, setFreezerNotes] = useState("");

  const isFromList = useMemo(() => new URLSearchParams(searchStr).get("from") === "list", [searchStr]);

  // Called by MealImageWidget when any image operation completes (upload/generate/remove).
  const handleMealImageChange = useCallback((mealId: number, newImageUrl: string | null) => {
    queryClient.setQueryData<Meal[]>([api.meals.list.path], (prev) =>
      prev ? prev.map(m => m.id === mealId ? { ...m, imageUrl: newImageUrl } : m) : prev
    );
  }, [queryClient]);

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
        // Parse endpoint failed - fall back to raw strings (version 1)
        payload = ingredients;
      }
      writePendingIngredients(payload as Parameters<typeof writePendingIngredients>[0]);
    } catch {}
    if (isFromList) {
      navigate("/shopping-workspace");
    } else {
      toast({ title: "Added to Shopping", description: "Open Shopping to review your list." });
    }
  }, [navigate, isFromList, toast]);

  useEffect(() => {
    const params = new URLSearchParams(searchStr);
    const q = params.get("q") || "";
    if (q) setSearchTerm(q);
  }, [searchStr]);

  // Repeat-tap nav: open workspace drawer when mobile nav fires tha:open-workspace for this page
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent<{ href: string }>).detail?.href === "/cookbook") {
        setMobileCookbookOpen(true);
      }
    };
    window.addEventListener("tha:open-workspace", handler);
    return () => window.removeEventListener("tha:open-workspace", handler);
  }, []);

  // Detect planner import context from URL params (fires once on mount)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("plannerImport") !== "1") return;
    const ctx: PlannerImportCtx = {
      mealName: params.get("mealName") || "",
      day: params.get("day") || "Unassigned",
      slot: params.get("slot") || "dinner",
      plannerDayId: params.get("dayId") ? parseInt(params.get("dayId")!, 10) : null,
      plannerEntryId: params.get("entryId") ? parseInt(params.get("entryId")!, 10) : null,
      openScan: params.get("openScan") === "1",
      plannerResolve: params.get("plannerResolve") === "1",   // Phase 3G
      returnMode: params.get("returnMode") || null,            // Phase 3G
    };
    setPlannerImportCtx(ctx);
    if (ctx.openScan) {
      scanFileRef.current?.click();
    } else {
      setPlannerImportDialogOpen(true);
    }
    // Replace URL to remove params without page reload
    navigate("/meals", { replace: true } as any);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setVisibleCount(48);
    // PX1-W3: keyed on the deferred term so the pagination reset lands with the
    // filtered results it belongs to, not ahead of them.
  }, [deferredSearchTerm, categoryFilter, activeGroups, activeAudiences, mealsDietPattern, mealsDietRestrictions, mealsUpfFilter]);

  // Called when a recipe is created while in planner import context
  const handlePlannerImportMealCreated = useCallback(async (meal: Meal, hasSourceUrl: boolean) => {
    setActiveGroups(prev => { const n = new Set(prev); n.add(hasSourceUrl ? "recipes" : "cookbook"); return n; });
    if (plannerImportCtx?.plannerDayId) {
      setPlannerImportDialogOpen(false);
      setPlannerLinkData({ mealId: meal.id, mealName: meal.name });
      setPlannerLinkOpen(true);
    }
  }, [plannerImportCtx]);

  // Called when a scanned recipe is created while in planner import context
  const handlePlannerImportScanMealCreated = useCallback((mealId: number, mealName: string) => {
    if (plannerImportCtx?.plannerDayId) {
      setScanDialogOpen(false);
      setPlannerLinkData({ mealId, mealName });
      setPlannerLinkOpen(true);
    }
  }, [plannerImportCtx]);

  const handlePlannerLink = async () => {
    if (!plannerLinkData || !plannerImportCtx) return;
    if (!plannerImportCtx.plannerEntryId && !plannerImportCtx.plannerDayId) return;
    try {
      if (plannerImportCtx.plannerEntryId) {
        // Phase 3H: atomic swap — preserves entry identity (day, slot, position, audience)
        // If this fails the original placeholder remains intact, no orphaned state
        const res = await apiRequest(
          "PATCH",
          `/api/planner/entries/${plannerImportCtx.plannerEntryId}/meal`,
          { mealId: plannerLinkData.mealId },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Failed to link recipe");
        }
        queryClient.invalidateQueries({ queryKey: ["/api/planner/full"] });
      } else {
        // Normal add flow — no placeholder to replace
        const slot = plannerImportCtx.slot && plannerImportCtx.slot !== "unspecified"
          ? plannerImportCtx.slot : "dinner";
        await apiRequest("POST", `/api/planner/days/${plannerImportCtx.plannerDayId}/items`, {
          mealSlot: slot,
          mealId: plannerLinkData.mealId,
          position: 0,
          audience: "adult",
          isDrink: false,
          drinkType: null,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/planner/full"] });
        invalidateMealLibrary(queryClient);
      }
      toast({
        title: "Linked to planner",
        description: `${plannerLinkData.mealName} added to ${plannerImportCtx.day}`,
      });
      setPlannerLinkOpen(false);
      const returnMode = plannerImportCtx.returnMode;
      setPlannerImportCtx(null);
      // Phase 3G: return to placeholder-review mode when that's where the flow originated
      if (returnMode === "placeholder-review") {
        navigate("/planner?returnMode=placeholder-review");
      } else {
        navigate("/planner");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Could not link to planner", description: err?.message || "Please try again." });
    }
  };

  const addToFreezerMutation = useMutation({
    mutationFn: async (data: { mealId: number; totalPortions: number; batchLabel?: string; notes?: string }) => {
      // CONV1 P6 / BEH-6: `frozenDate` is NOT sent. The server stamps the
      // household's own civil day (HT12 — the device may supply the instant, it
      // may never decide the day). This line used to be
      // `new Date().toISOString().split('T')[0]` — the device's UTC day, which
      // recorded a 20:00 freeze in New York as tomorrow.
      const res = await apiRequest("POST", "/api/freezer", {
        mealId: data.mealId,
        totalPortions: data.totalPortions,
        remainingPortions: data.totalPortions,
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
      invalidateMealLibrary(queryClient);
    },
  });

  const importLibraryMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/import-global-meals", {});
      return res.json();
    },
    onSuccess: (data: any) => {
      invalidateMealLibrary(queryClient);
      const total = data.results?.reduce((sum: number, r: any) => sum + r.imported, 0) || 0;
      toast({ title: "Import complete", description: `Imported ${total} meals from OpenFoodFacts.` });
    },
    onError: () => {
      toast({ title: "Couldn't import those meals", description: "Try again in a moment.", variant: "destructive" });
    },
  });

  const handleScanFile = async (file: File) => {
    // Open the modal immediately so users see loading state rather than nothing.
    scanCancelledRef.current = false;
    setScanData(null);
    setScanError(null);
    setScanLoading(true);
    setScanDialogOpen(true);

    const scanId = Math.random().toString(36).slice(2, 10);
    const t0 = performance.now();
    console.log(`[recipe-scan-timing] upload-start scanId=${scanId} fileSize=${file.size}bytes mimeType=${file.type}`);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("mode", "recipe");
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: { "X-Scan-Id": scanId },
      });
      if (scanCancelledRef.current) return;
      const networkMs = Math.round(performance.now() - t0);
      const data = await res.json();
      if (scanCancelledRef.current) return;
      const parseMs = Math.round(performance.now() - t0);
      if (!res.ok) {
        console.log(`[recipe-scan-timing] upload-error scanId=${scanId} status=${res.status} elapsed=${parseMs}ms`);
        setScanError(data.message || "Could not read image. Please try again.");
        return;
      }
      console.log(`[recipe-scan-timing] upload-complete scanId=${scanId} network=${networkMs}ms total=${parseMs}ms parsedBy=${data.parsedBy} mode=${data.mode}`);
      setScanData(data);
      console.log(`[recipe-scan-timing] ui-rendered scanId=${scanId} elapsed=${Math.round(performance.now() - t0)}ms`);
    } catch {
      if (scanCancelledRef.current) return;
      console.log(`[recipe-scan-timing] upload-exception scanId=${scanId} elapsed=${Math.round(performance.now() - t0)}ms`);
      setScanError("Could not connect to server. Please try again.");
    } finally {
      if (!scanCancelledRef.current) setScanLoading(false);
      if (scanFileRef.current) scanFileRef.current.value = "";
    }
  };

  const handleScanDialogChange = (v: boolean) => {
    if (!v && scanLoading) {
      // User explicitly cancelled during scan - stop waiting for result.
      scanCancelledRef.current = true;
      setScanLoading(false);
    }
    setScanDialogOpen(v);
    if (!v) {
      setScanData(null);
      setScanError(null);
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
        thaRating: product.upfAnalysis?.thaRating ?? null,
        isDrink,
        isBabyFood,
        isReadyMeal,
        quantity: product.quantity,
        categoryId,
      });
      const savedMeal = await res.json();
      setProductSavedIds(prev => new Set(prev).add(productKey));
      setProductSavedMealMap(prev => new Map(prev).set(productKey, savedMeal.id));
      invalidateMealLibrary(queryClient);
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

  const addProductToBasketMutation = useMutation({
    mutationFn: async (product: ProductSearchResult) => {
      const res = await apiRequest('POST', api.shoppingList.add.path, {
        productName: product.product_name,
        imageUrl: product.image_url,
        quantity: 1,
        brand: product.brand,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      toast({ title: "Added to basket" });
    },
    onError: () => {
      toast({ title: "Couldn't add that product", description: "Try again in a moment.", variant: "destructive" });
    },
  });

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
          toast({ title: "Couldn't read that barcode", description: "Give it another scan in a moment.", variant: "destructive" });
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
      toast({ title: "Couldn't read that barcode", description: "Give it another scan in a moment.", variant: "destructive" });
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
        thaRating: barcodeProduct.upfAnalysis?.thaRating ?? null,
        isDrink,
        isBabyFood,
        isReadyMeal,
        quantity: barcodeProduct.quantity,
        categoryId: null,
      });
      invalidateMealLibrary(queryClient);
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
          throw new Error(errData?.message || "We couldn't import this recipe.");
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
      toast({ title: "Couldn't import this recipe", description: err?.message || "Try again in a moment.", variant: "destructive" });
      return null;
    } finally {
      setWebImportingIds(prev => {
        const next = new Set(prev);
        next.delete(recipe.id);
        return next;
      });
    }
  };


  // ── Household Variants section ────────────────────────────────────────────────
  const householdVariants = useMemo(
    () => (meals ?? []).filter(m => m.variantKind === "household_safe" && m.showInCookbook),
    [meals],
  );
  // All household-safe variants (for "hidden" count indicator)
  const allHouseholdVariants = useMemo(
    () => (meals ?? []).filter(m => m.variantKind === "household_safe"),
    [meals],
  );

  // PX1-W3 (fnd-px-cookbook-search-jank): the lowercased "name + ingredients"
  // string used by the diet filter was rebuilt for every meal on every
  // keystroke — a multi-hundred-char allocation × 884 meals. Built once per
  // library load instead (the scoreCache below is the same pattern).
  const mealSearchText = useMemo(() => {
    const map = new Map<number, RecipeFields>();
    for (const meal of meals ?? []) {
      map.set(meal.id, { name: meal.name, ingredients: meal.ingredients ?? [] });
    }
    return map;
  }, [meals]);

  const filteredMeals = useMemo(() => {
    const activeSearch = deferredSearchTerm.trim().length >= 2;
    const q = deferredSearchTerm.trim();

    const filtered = meals?.filter(meal => {
      // Hide planner-import placeholders from cookbook view
      if (meal.mealSourceType === "planner-placeholder") return false;
      // Household-safe variants are shown only in the dedicated Household Variants section
      if (meal.variantKind === "household_safe") return false;
      // Demo mode: never show drinks
      if (user?.isDemo && (meal.isDrink || meal.mealFormat === "drink")) return false;
      // "Recipes" source: hide user-created meals so only web/system meals show
      if (activeSearch && searchSource === "recipes" && shelfForMeal(meal) === "household") return false;
      // COOKBOOK1 — the wider library is reachable, but never browsed into. A
      // household meets it when they search for something in it, or when they
      // have asked for it by name. It is never part of the default shelf.
      if (shelfForMeal(meal) === "library" && !activeSearch && !libraryOpen) return false;
      // Fuzzy + synonym search
      const matchesSearch = !activeSearch || scoreMealSearch({ name: meal.name, ingredients: meal.ingredients }, q) > 0;
      const matchesCategory = categoryFilter === "all" ||
        (allCategories.find(c => c.name === categoryFilter)?.id === meal.categoryId);
      const shelf = shelfForMeal(meal);
      let matchesGroup = true;
      if (shelf === "household") matchesGroup = activeGroups.has("cookbook");
      // user-imported web recipes are part of the user's cookbook AND show under "Recipes"
      else if (shelf === "web") matchesGroup = activeGroups.has("cookbook") || activeGroups.has("recipes");
      else if (shelf === "kitchen" || shelf === "library") matchesGroup = activeGroups.has("recipes");
      else if (shelf === "packaged") matchesGroup = activeGroups.has("packaged");
      else if (shelf === "drinks") matchesGroup = activeGroups.has("cookbook") || activeGroups.has("recipes");
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
      const mealText = mealSearchText.get(meal.id) ?? { name: meal.name };
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
      const shelfA = shelfForMeal(a);
      const shelfB = shelfForMeal(b);
      const idxA = SHELF_ORDER.indexOf(shelfA);
      const idxB = SHELF_ORDER.indexOf(shelfB);
      const orderA = idxA === -1 ? SHELF_ORDER.length : idxA;
      const orderB = idxB === -1 ? SHELF_ORDER.length : idxB;
      if (shelfA === "packaged" && shelfB === "packaged") {
        const ingA = a.ingredients?.length ?? 999;
        const ingB = b.ingredients?.length ?? 999;
        return ingA - ingB || a.name.localeCompare(b.name);
      }
      const shelfOrder = orderA - orderB;
      if (shelfOrder !== 0) return shelfOrder;
      // COOKBOOK1 — RETIRED: the images-first tiebreak.
      //
      // It sorted photographed meals above unphotographed ones within each
      // shelf, which split every shelf into a photographed top and an icon-wall
      // bottom — the room visibly degrading as you scrolled. That is a room
      // reorganising itself around its content, which is a page's behaviour and
      // not a room's (GEA7). A shelf now reads in one order, alphabetically,
      // whether or not the food has had its picture taken.
      return a.name.localeCompare(b.name);
    });
  }, [meals, mealSearchText, deferredSearchTerm, categoryFilter, allCategories, activeGroups, activeAudiences, mealsDietPattern, mealsDietRestrictions, mealsUpfFilter, searchSource, user]);

  const visibleMeals = useMemo(() => filteredMeals?.slice(0, visibleCount), [filteredMeals, visibleCount]);

  /**
   * COOKBOOK1 — RETIRED: `sectionCounts`.
   *
   * It rendered "· 500" beside "Wholefood Suggestions" and a count beside every
   * other section header. A count above a shelf tells a household nothing they
   * can use and one thing they cannot un-see: that this was produced in bulk.
   * EXPREVIEW1 § 6 quotes the header verbatim as the moment the room announces
   * itself as machine output, and § 8: *"it trades a large number for a small
   * one, and 500 looks like more product than 20. It is not."*
   *
   * A shelf in a family cookbook is not labelled with its inventory.
   */

  /** How many recipes sit in the wider library behind the current filters. */
  const libraryCount = useMemo(
    () => (meals ?? []).filter(m => shelfForMeal(m) === "library").length,
    [meals],
  );

  const showSectionHeaders = useMemo(() => {
    if (!filteredMeals?.length) return false;
    const shelves = new Set(filteredMeals.map(shelfForMeal));
    return shelves.size > 1;
  }, [filteredMeals]);

  const allMealIds = useMemo(() => (visibleMeals || []).map(m => m.id), [visibleMeals]);
  const { data: bulkNutritionData = [] } = useQuery<Nutrition[]>({
    // PX1-W3 (fnd-px-cookbook-search-refetch): this key derives from the search
    // term, so it used to mint a new cache entry and POST per keystroke. The
    // pipeline above now runs on the deferred term (intermediate keystrokes
    // never reach here), and placeholderData holds the previous nutrition on
    // screen while the new visible set loads instead of blanking every badge.
    queryKey: ["/api/nutrition/bulk", allMealIds],
    queryFn: async () => {
      if (allMealIds.length === 0) return [];
      const res = await apiRequest("POST", "/api/nutrition/bulk", { mealIds: allMealIds });
      return res.json();
    },
    enabled: allMealIds.length > 0,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
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
    (audienceChanged ? 1 : 0) +
    (categoryFilter !== "all" ? 1 : 0);

  return (
    <>
    <WorkspaceHeader
      title="Cookbook"
      realm="cookbook"
      wide
      titleTestId="text-meals-title"
      search={{
        placeholder: "Search recipes...",
        value: searchTerm,
        onChange: setSearchTerm,
        onSubmit: () => {},
      }}
      contextBar={
        <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1 border border-border/40 overflow-x-auto scrollbar-hide" role="tablist">
          {([
            { id: "cookbook", label: "My Cookbook", Icon: ChefHat },
            { id: "recipes", label: "Recipes", Icon: Globe },
            { id: "freezer", label: "My Freezer", Icon: Snowflake },
            { id: "packaged", label: "Packaged", Icon: Package },
          ] as const).map(({ id, label, Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeGroups.has(id)}
              onClick={() => toggleGroup(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                activeGroups.has(id)
                  ? "shadow-sm realm-banner-btn"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`button-filter-${id}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {id === "freezer" && freezerMeals.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
                  {freezerMeals.reduce((sum, f) => sum + f.remainingPortions, 0)}
                </Badge>
              )}
            </button>
          ))}
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <input
            ref={scanFileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            data-testid="input-scan-file"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleScanFile(f); }}
          />
          {/* Add Recipe: primary CTA; externalOpen allows workspace panel shortcut to trigger it */}
          <CreateMealDialog
            onScan={() => scanFileRef.current?.click()}
            onMealCreated={(_, hasSourceUrl) => {
              setActiveGroups(prev => { const n = new Set(prev); n.add(hasSourceUrl ? "recipes" : "cookbook"); return n; });
            }}
            externalOpen={cookbookAddRecipeOpen}
            onExternalOpenChange={setCookbookAddRecipeOpen}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center justify-center h-9 w-9 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                aria-label="Cookbook workspace"
                data-testid="button-cookbook-workspace-menu"
              >
                {/* EXP1 — the coloured apple is retired here and NOT replaced
                    by the stencil: a menu trigger is a tool, and the apple
                    never carries a second meaning (GEA12). A tool gets a
                    tool's glyph. */}
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => scanFileRef.current?.click()} data-testid="button-cookbook-ws-scan">
                <Camera className="h-4 w-4 mr-2" />
                Scan Recipe
              </DropdownMenuItem>
              {!importStatusLoading && (!importStatus || importStatus.totalImported === 0) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => importLibraryMutation.mutate()}
                    disabled={importLibraryMutation.isPending}
                    data-testid="button-import-library"
                  >
                    {importLibraryMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    {importLibraryMutation.isPending ? "Importing..." : "Import Library"}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    />
    <div className={`${pageContainerClass(true)} overflow-x-clip`} data-realm="cookbook">
      {/* Planner import context banner */}
      {plannerImportCtx && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 mb-4">
          <CalendarDays className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 text-sm">
            <span className="font-medium">Adding recipe for: {plannerImportCtx.mealName}</span>
            {plannerImportCtx.day !== "Unassigned" && (
              <span className="text-muted-foreground ml-2">
                · {plannerImportCtx.day}
                {plannerImportCtx.slot && plannerImportCtx.slot !== "unspecified" ? ` (${plannerImportCtx.slot})` : ""}
              </span>
            )}
          </div>
          <button
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            onClick={() => { setPlannerImportCtx(null); setPlannerImportDialogOpen(false); }}
            aria-label="Clear planner context"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* "from list" mode banner */}
      {isFromList && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 mb-4" data-testid="banner-add-to-list-mode">
          <ListPlus className="h-4 w-4 text-primary shrink-0" />
          <p className="flex-1 text-sm text-foreground/80">
            Tap <ListPlus className="inline h-3.5 w-3.5 text-primary mx-0.5" /> on any meal to add its ingredients to your quick list.
          </p>
          <button
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            onClick={() => navigate("/shopping-workspace")}
            aria-label="Back to shopping"
            data-testid="button-back-to-list"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Workspace layout: content (flex-1) + persistent panel (desktop only) ── */}
      <div className="flex gap-3 items-start">
      <div className="flex-1 min-w-0">

      {/* UX3 — the ambient strip and the noticed-patterns panel both spoke about
          the household rather than about the cookbook. The Companion carries them
          now; this room stays a room of recipes. */}

      {user?.isDemo && !searchTerm.trim() && (
        <div className="mb-3 p-3 rounded-lg bg-primary/5 border border-primary/15 flex items-start gap-3" data-testid="demo-cookbook-intro">
          <ChefHat className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Find recipes from across the web</p>
            <p className="text-xs text-muted-foreground mt-0.5">Type a meal name above to search thousands of recipes - pasta, chicken curry, stir fry, anything you're craving.</p>
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
                className={`${idx === 0 ? "rounded-r-none" : idx === 2 ? "rounded-l-none border-l border-border" : "rounded-none border-l border-border"} px-2 sm:px-3 realm-banner-btn`}
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

      {/* Web results appear FIRST when searching - most relevant content for new/demo users */}
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
                <SelectTrigger className="h-7 text-xs w-[140px]" aria-label="Diet pattern" data-testid="select-web-diet-pattern">
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
                className="h-7 text-xs realm-banner-btn"
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
                className="h-7 text-xs realm-banner-btn"
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
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
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
                        <Card className="overflow-hidden h-full flex flex-col cursor-pointer" role="button" tabIndex={0} onKeyDown={(e) => { if (e.target !== e.currentTarget) return; if (e.key === "Enter" || e.key === " ") { if (e.key === " ") e.preventDefault(); e.currentTarget.click(); } }} onClick={() => {
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
                                        variant="ghost"
                                        size="sm"
                                        className={expandedTab === "ingredients" ? "h-7 text-xs realm-banner-btn" : "h-7 text-xs"}
                                        onClick={() => setExpandedTab("ingredients")}
                                        data-testid={`tab-ingredients-web-${recipe.id}`}
                                      >
                                        Ingredients
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className={expandedTab === "method" ? "h-7 text-xs realm-banner-btn" : "h-7 text-xs"}
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
                                        onAddToQuickList={handleAddToListFromCookbook}
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
                                  <SelectTrigger className="flex-1" aria-label="Recipe category" data-testid={`select-web-import-category-${recipe.id}`}>
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
                                  className="shrink-0 gap-1 realm-banner-btn"
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
                    className="realm-banner-btn"
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
        <div className={viewMode === 'grid' ? "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2" : "flex flex-col gap-2"}>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className={viewMode === 'grid' ? 'h-28' : 'h-16'} />
          ))}
        </div>
      ) : (
        <AnimatePresence>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {visibleMeals?.map((meal, index) => {
                const shelf = shelfForMeal(meal);
                const prevShelf = index > 0 ? shelfForMeal(visibleMeals[index - 1]) : null;
                const isNewSection = showSectionHeaders && shelf !== prevShelf;
                return (
                  <Fragment key={meal.id}>
                    {isNewSection && (
                      <div
                        className={`col-span-full flex items-baseline gap-2 ${index > 0 ? "mt-8 pt-5" : ""}`}
                        data-testid={`section-header-${shelf}`}
                      >
                        {/* COOKBOOK1 — a shelf is named, not counted, and not ruled
                            off. The border-top and the "· N" both came down: air
                            separates shelves now (GEA11). */}
                        <span className="title-section text-foreground/80">{SHELF_LABELS[shelf]}</span>
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                    >
                  <Card
                    className="h-full flex flex-col group cursor-pointer overflow-hidden hover-elevate transition-all duration-200"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.target !== e.currentTarget) return; if (e.key === "Enter" || e.key === " ") { if (e.key === " ") e.preventDefault(); navigate(`/meals/${meal.id}`); } }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/meals/${meal.id}`);
                    }}
                    data-testid={`card-meal-${meal.id}`}
                  >
                    {/* COOKBOOK1 — the food is the hero.
                        The image was a 96–128px letterbox carrying a black
                        name-pill, a serves badge and a frozen badge on top of it.
                        It is now a 4:3 plate with nothing written across it: the
                        recipe's name sits beneath the photograph, in the house's
                        own card type, where a name belongs. EXPREVIEW1 § 8:
                        "You cannot pick up a card that has no face." */}
                    <div className="relative w-full aspect-[4/3] overflow-hidden">
                      {meal.isReadyMeal && !meal.imageUrl ? (
                        <div className="w-full h-full flex items-center justify-center relative bg-accent/30" data-testid={`placeholder-ready-meal-${meal.id}`}>
                          {meal.audience === 'baby' ? (
                            <MealWatermark type="baby" size="lg" className="inset-0 m-auto flex items-center justify-center" />
                          ) : meal.audience === 'child' ? (
                            <MealWatermark type="child" size="lg" className="inset-0 m-auto flex items-center justify-center" />
                          ) : meal.isDrink ? (
                            <MealWatermark type="drink" size="lg" className="inset-0 m-auto flex items-center justify-center" />
                          ) : null}
                          <AppleStencil className="h-16 w-16 relative z-10 text-primary/20" />
                        </div>
                      ) : meal.mealFormat === "grouped" && !meal.imageUrl ? (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5 relative" data-testid={`placeholder-grouped-${meal.id}`}>
                          <AppleStencil className="h-20 w-20 text-primary/30" />
                        </div>
                      ) : (
                        <MealImageWidget
                          mealId={meal.id}
                          imageUrl={meal.imageUrl}
                          mealName={meal.name}
                          audience={meal.audience}
                          isSystemMeal={!!meal.isSystemMeal}
                          canEdit={false}
                          showNameInPlaceholder={false}
                          onImageChange={handleMealImageChange}
                        />
                      )}
                      {/* The freezer portion count stays: it is a fact about the
                          household's own freezer, not a property of the recipe,
                          and it is the one thing that changes what they cook
                          tonight. The serves badge came down — it is recipe
                          metadata, and it lives on the recipe. */}
                      {freezerMeals.some(f => f.mealId === meal.id && f.remainingPortions > 0) && (
                        <div className="absolute top-1.5 left-1.5 z-10" data-testid={`badge-frozen-${meal.id}`}>
                          <Badge variant="secondary" className="bg-primary/90 text-white border-0 text-[10px]">
                            <Snowflake className="h-3 w-3 mr-1" />
                            {freezerMeals.filter(f => f.mealId === meal.id).reduce((s, f) => s + f.remainingPortions, 0)} frozen
                          </Badge>
                        </div>
                      )}
                      {/* Recipe actions: desktop → compact dropdown, mobile → bottom sheet */}
                      <CardActionsMenu
                        meal={meal}
                        onFreezeClick={() => setAddToFreezerMealId(meal.id)}
                        onDelete={() => setConfirmDeleteMeal({ id: meal.id, name: meal.name })}
                        onImageChange={handleMealImageChange}
                        onMobileClick={() => setActionSheetMeal(meal)}
                      />
                    </div>
                    {/* COOKBOOK1 — RETIRED: the in-card tab strip and the
                        six-icon action bar.

                        The strip put Ingredients / Nutrition / "Why Good" tabs
                        INSIDE every card, and the footer put six unlabelled icon
                        buttons beneath them — Qty, Quick List, Freeze, Planner,
                        Analyse, Basket. EXPREVIEW1 § 6 counted the cost exactly:
                        "six unlabelled icon buttons... Multiply by twelve and the
                        room contains seventy-two unlabelled controls."

                        Every one of those six actions already existed in
                        `CardActionsMenu` on the image above — View recipe, Add to
                        planner, Add to basket, Analyse, Freeze — so the bar was a
                        duplicate owner of the card's actions, not a second way to
                        reach them (GEA18). Removing it costs no capability at all.

                        Ingredients and nutrition belong to the recipe, and the
                        recipe is one tap away. A shelf shows you the food and its
                        name; you pick a book up to read it. */}
                    <div className="px-3 py-2.5">
                      <span className="title-card text-foreground line-clamp-2" data-testid={`text-meal-name-${meal.id}`}>
                        {meal.name}
                      </span>
                    </div>
                  </Card>
                </motion.div>
                  </Fragment>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {visibleMeals?.map((meal, index) => {
                const shelf = shelfForMeal(meal);
                const prevShelf = index > 0 ? shelfForMeal(visibleMeals[index - 1]) : null;
                const isNewSection = showSectionHeaders && shelf !== prevShelf;
                return (
                  <Fragment key={meal.id}>
                    {isNewSection && (
                      <div
                        className={`flex items-baseline gap-2 ${index > 0 ? "mt-8 pt-5" : ""}`}
                        data-testid={`section-header-list-${shelf}`}
                      >
                        <span className="title-section text-foreground/80">{SHELF_LABELS[shelf]}</span>
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.15, delay: index * 0.02 }}
                    >
                  <Card
                    className="group cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.target !== e.currentTarget) return; if (e.key === "Enter" || e.key === " ") { if (e.key === " ") e.preventDefault(); navigate(`/meals/${meal.id}`); } }}
                    onClick={() => navigate(`/meals/${meal.id}`)}
                    data-testid={`card-meal-${meal.id}`}
                  >
                    <div className="flex items-stretch relative">
                      {meal.isReadyMeal ? (
                        <div className="w-24 sm:w-28 shrink-0 overflow-hidden rounded-l-md flex flex-col items-center justify-center gap-1 px-2 relative bg-accent/30">
                          {meal.audience === 'baby' ? (
                            <MealWatermark type="baby" size="sm" className="inset-0 m-auto flex items-center justify-center" />
                          ) : meal.audience === 'child' ? (
                            <MealWatermark type="child" size="sm" className="inset-0 m-auto flex items-center justify-center" />
                          ) : meal.isDrink ? (
                            <MealWatermark type="drink" size="sm" className="inset-0 m-auto flex items-center justify-center" />
                          ) : null}
                          <AppleStencil className="h-12 w-12 relative z-10 text-primary/20" />
                          <span className="text-[10px] uppercase tracking-[0.12em] relative z-10 text-muted-foreground/70">
                            {meal.audience === 'baby' ? 'Baby Meal' : meal.audience === 'child' ? 'Kids Meal' : 'Ready Meal'}
                          </span>
                        </div>
                      ) : meal.audience === 'baby' || meal.audience === 'child' ? (
                        <div className="w-24 sm:w-28 shrink-0 overflow-hidden rounded-l-md flex items-center justify-center bg-accent/30">
                          <MealWatermark type={meal.audience === 'baby' ? 'baby' : 'child'} size="sm" className="relative" />
                        </div>
                      ) : meal.mealFormat === "grouped" && !meal.imageUrl ? (
                        <div className="w-24 sm:w-28 shrink-0 overflow-hidden rounded-l-md flex flex-col items-center justify-center bg-primary/5" data-testid={`placeholder-grouped-list-${meal.id}`}>
                          <AppleStencil className="h-20 w-20 text-primary/30" />
                        </div>
                      ) : (
                        <div className="w-24 sm:w-28 shrink-0 overflow-hidden rounded-l-md relative">
                          <MealImageWidget
                            mealId={meal.id}
                            imageUrl={meal.imageUrl}
                            mealName={meal.name}
                            audience={meal.audience}
                            isSystemMeal={!!meal.isSystemMeal}
                            canEdit={!meal.isSystemMeal}
                            onImageChange={handleMealImageChange}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <h3 className="text-sm font-semibold text-foreground">{meal.name}</h3>
                            <CategoryBadge categoryId={meal.categoryId} categories={allCategories} />
                            {!meal.isReadyMeal && meal.mealSourceType && meal.mealSourceType !== 'scratch' && (
                              <Badge variant="secondary" className="text-[10px]" data-testid={`badge-source-list-${meal.id}`}>
                                {meal.mealSourceType === 'ready_meal' ? 'Ready Meal' : meal.mealSourceType}
                              </Badge>
                            )}
                          </div>
                          {/* Ingredient badges: desktop only — avoid clutter on mobile */}
                          <div className="hidden sm:flex flex-wrap gap-1">
                            {meal.ingredients.slice(0, 4).map((ing, i) => (
                              <IngredientBadge key={i} ingredient={ing} mealId={meal.id} index={i} />
                            ))}
                            {meal.ingredients.length > 4 && (
                              <Badge variant="outline" className="text-xs font-normal">
                                +{meal.ingredients.length - 4} more
                              </Badge>
                            )}
                          </div>
                          <div className="hidden group-hover:flex items-center gap-2 flex-wrap">
                            <NutritionBadges mealId={meal.id} nutrition={nutritionMap.get(meal.id)} />
                            <DietBadges mealId={meal.id} />
                          </div>
                        </div>
                        {/* Action bar: desktop only */}
                        <div className="hidden sm:flex flex-col gap-2 shrink-0 min-w-[180px]" onClick={(e) => e.stopPropagation()}>
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
                            onAddToQuickList={handleAddToListFromCookbook}
                          />
                          {!meal.isSystemMeal && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover-reveal group-hover:opacity-100 transition-opacity self-end"
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteMeal({ id: meal.id, name: meal.name }); }}
                              aria-label={`Delete ${meal.name}`}
                              data-testid={`button-delete-meal-${meal.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {/* Mobile: three-dot button — opens action sheet */}
                        <button
                          className="sm:hidden absolute top-2 right-2 z-10 h-7 w-7 bg-muted/80 rounded-md flex items-center justify-center text-muted-foreground"
                          onClick={(e) => { e.stopPropagation(); setActionSheetMeal(meal); }}
                          aria-label="Recipe actions"
                          data-testid={`button-card-actions-${meal.id}`}
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
                  </Fragment>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      )}

      {/* ── Household Variants section ─────────────────────────────────────────── */}
      {allHouseholdVariants.length > 0 && (
        <div className="space-y-4 mt-6" data-testid="section-household-variants">
          <div className="flex items-center gap-2 pb-1 border-b border-border/50">
            <Shield className="h-4 w-4 text-teal-500" />
            <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">Household Variants</span>
            {householdVariants.length > 0 && (
              <span className="text-xs text-muted-foreground/35">· {householdVariants.length}</span>
            )}
            <span className="ml-auto text-[10px] text-muted-foreground/50">Saved household-safe recipes</span>
          </div>

          {householdVariants.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                You have {allHouseholdVariants.length} household-safe {allHouseholdVariants.length === 1 ? "variant" : "variants"} saved.
                Toggle &ldquo;Show in Cookbook&rdquo; on a variant to display it here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {householdVariants.map(variant => {
                const originalName = variant.householdSafeFor?.originalMealName ?? null;
                return (
                  <Card key={variant.id} className="flex flex-col overflow-hidden" data-testid={`card-variant-${variant.id}`}>
                    {/* Image / placeholder */}
                    <div className="relative w-full h-28 bg-teal-50 dark:bg-teal-950/30 flex flex-col items-center justify-center gap-1">
                      {variant.imageUrl ? (
                        <img src={variant.imageUrl} alt={variant.name} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Shield className="h-8 w-8 text-teal-400/60" />
                          <span className="text-xs font-medium text-center px-2 leading-tight text-foreground">{variant.name}</span>
                        </>
                      )}
                      <div className="absolute top-1.5 left-1.5">
                        <Badge variant="outline" className="text-[10px] border-teal-400/60 text-teal-700 dark:text-teal-300 bg-white/80 dark:bg-teal-950/80">
                          <Shield className="h-2.5 w-2.5 mr-0.5" />
                          Household-Safe
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-3 flex-1 space-y-1.5">
                      <p className="text-sm font-medium leading-snug">{variant.name}</p>
                      {originalName && (
                        <p className="text-[11px] text-muted-foreground/70">Variant of: {originalName}</p>
                      )}
                      {/* Diet badges */}
                      {variant.dietTypes && variant.dietTypes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {variant.dietTypes.slice(0, 3).map(d => (
                            <Badge key={d} variant="outline" className="text-[10px] border-primary/30 text-primary px-1.5">
                              {d}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="p-3 pt-0 gap-1.5 flex-wrap">
                      {/* Add to Planner */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs flex-1"
                        onClick={() => setPlannerLinkData({ mealId: variant.id, mealName: variant.name })}
                        data-testid={`button-variant-add-planner-${variant.id}`}
                      >
                        <CalendarDays className="h-3 w-3 mr-1" />
                        Add to Plan
                      </Button>
                      {/* Toggle cookbook visibility */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        disabled={cookbookVisibilityMutation.isPending}
                        onClick={() => cookbookVisibilityMutation.mutate({ mealId: variant.id, show: false })}
                        data-testid={`button-variant-hide-${variant.id}`}
                      >
                        <EyeOff className="h-3 w-3 mr-1" />
                        Hide
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Hidden variants indicator with reveal controls */}
          {allHouseholdVariants.filter(v => !v.showInCookbook).length > 0 && (
            <div className="rounded-lg bg-muted/30 border border-border/40 p-3 space-y-2">
              <p className="text-xs text-muted-foreground/70">
                {allHouseholdVariants.filter(v => !v.showInCookbook).length} household-safe {allHouseholdVariants.filter(v => !v.showInCookbook).length === 1 ? "variant is" : "variants are"} hidden from the cookbook.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allHouseholdVariants.filter(v => !v.showInCookbook).map(v => (
                  <Button
                    key={v.id}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs realm-banner-btn"
                    disabled={cookbookVisibilityMutation.isPending}
                    onClick={() => cookbookVisibilityMutation.mutate({ mealId: v.id, show: true })}
                    data-testid={`button-variant-show-${v.id}`}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Show &ldquo;{v.name}&rdquo;
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
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
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {freezerMeals.map((frozen, index) => {
                const meal = meals?.find(m => m.id === frozen.mealId);
                const portionPercent = frozen.totalPortions > 0 ? (frozen.remainingPortions / frozen.totalPortions) * 100 : 0;
                // CONV1 P6 / BEH-6 + SCH-4 — "fix the comparison before the column type;
                // the comparison is what harms". Both lines below compared a stored civil
                // date against an instant:
                //   new Date(frozen.expiryDate) < new Date()
                // parsed the bare date as UTC MIDNIGHT and compared it to a LOCAL instant,
                // so the badge flipped at 01:00 BST and a UK household lost the whole final
                // day; and Math.ceil over epoch-ms turned a 23/25-hour DST day into a whole
                // day, letting "expires in 1 day" and "expired" both be true at once.
                // Civil dates have no frame to mix and no hours to lose. Expiry day itself
                // is NOT expired — the household keeps their last day.
                const expiryOn = parseCivilDate(frozen.expiryDate);
                const todayForHousehold = householdToday(new Date(), householdZone);
                const isExpired = expiryOn !== null && compareCivilDates(expiryOn, todayForHousehold) < 0;
                const daysUntilExpiry = expiryOn !== null ? civilDaysBetween(todayForHousehold, expiryOn) : null;
                return (
                  <motion.div
                    key={frozen.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                  >
                    <Card className={`h-full flex flex-col overflow-hidden ${isExpired ? 'border-red-400/50' : 'border-border'}`} data-testid={`card-freezer-${frozen.id}`}>
                      <div className="relative w-full h-28 overflow-hidden rounded-t-md bg-accent/30">
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
                          Frozen {displayCivilDate(frozen.frozenDate)}
                          {frozen.expiryDate && ` · Expires ${displayCivilDate(frozen.expiryDate)}`}
                        </p>
                        {frozen.notes && <p className="text-xs text-muted-foreground italic">{frozen.notes}</p>}
                        <NutritionBadges mealId={frozen.mealId} nutrition={nutritionMap.get(frozen.mealId)} />
                      </CardContent>
                      <CardFooter className="p-3 pt-0 flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs realm-banner-btn"
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
                              aria-label="Remove from freezer"
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
                              aria-label="Remove from freezer"
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

      {/* COOKBOOK1 — "Show more (836 remaining)" is gone.
          A number that large, attached to a button, is the room telling a
          household how much machine output is stacked behind the part they can
          see. The button now says what it does and nothing else. */}
      {!isLoading && filteredMeals && visibleCount < filteredMeals.length && (
        <div className="flex flex-col items-center gap-1 py-6">
          <Button
            variant="outline"
            className="realm-banner-btn"
            onClick={() => setVisibleCount(c => c + 48)}
            data-testid="button-load-more-meals"
          >
            More recipes
          </Button>
        </div>
      )}

      {/* COOKBOOK1 — the door to the wider library.
          Shown only when a household is browsing (not searching — a search
          already reaches into the library), only when there is a library to
          open, and only while it is still shut. It states a fact and offers a
          choice; it does not recommend, and it does not decide (GEA21, GEA23). */}
      {!isLoading && !mealsError && !libraryOpen && libraryCount > 0 && deferredSearchTerm.trim().length < 2 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-sm text-muted-foreground max-w-md">
            There is a wider library of recipe variations behind the cookbook.
            Searching already looks inside it.
          </p>
          <Button
            variant="ghost"
            className="realm-banner-btn"
            onClick={() => setLibraryOpen(true)}
            data-testid="button-open-wider-library"
          >
            Open the wider library
          </Button>
        </div>
      )}

      {/* PROD1 — the Cookbook's failed load. It rendered NOTHING before this
          branch existed: `meals` is undefined on error, so `filteredMeals` is
          undefined too, and every guard below is written `filteredMeals?.length`
          — the grid, the "show more" and the empty state all fell through their
          optional chain together, leaving blank space under the header. */}
      {!isLoading && mealsError && (
        <LoadError
          what="your cookbook"
          onRetry={() => refetchMeals()}
          description="Nothing has been lost — your meals are safe. This is a problem at our end."
          data-testid="error-cookbook"
        />
      )}

      {!isLoading && !mealsError && filteredMeals?.length === 0 && !webSearchResults.length && !webIsSearching && !productResults.length && !productIsSearching && (
        // PROD1 — two different absences, told apart. A search that matched nothing
        // is `filtered` (the cookbook still has meals); a cookbook with no meals at
        // all is `empty` — and that one now carries the action it always lacked.
        // An empty cookbook whose only words were "try creating a new meal", with
        // no button to do it, was a dead end on a household's very first visit.
        searchTerm.trim().length >= 2 ? (
          <EmptyState
            variant="filtered"
            icon={ChefHat}
            title="No meals found"
            description="No local matches. Web results will appear below if found."
            data-testid="empty-cookbook-filtered"
          />
        ) : (
          <EmptyState
            variant="empty"
            icon={ChefHat}
            title="Your cookbook is empty"
            description="Add the meals your household already cooks, and THA will plan, shop and check against them."
            action={
              // Reuses the SAME control the header's "Add Recipe" primary CTA already
              // drives (`CreateMealDialog`'s `externalOpen`) — one way to add a meal,
              // reached from two places. It does not open a second dialog of its own.
              <Button variant="default" onClick={() => setCookbookAddRecipeOpen(true)} data-testid="button-empty-create-meal">
                <Plus className="w-4 h-4 mr-1.5" aria-hidden="true" />
                Add your first meal
              </Button>
            }
            data-testid="empty-cookbook"
          />
        )
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
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                <AnimatePresence mode="popLayout">
                  {productResults.map((product) => {
                    const productKey = product.barcode || product.product_name;
                    const isSaving = productSavingIds.has(productKey);
                    const isSaved = productSavedIds.has(productKey);
                    const cats = product.categories_tags || [];
                    const isDrink = cats.some((c: string) => c.includes('beverages') || c.includes('drinks'));
                    const isReadyMeal = cats.some((c: string) => c.includes('meals') || c.includes('ready') || c.includes('prepared'));
                    const thaRating = product.upfAnalysis?.thaRating ?? null;
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
                              {thaRating != null && (
                                <div className="mt-2" data-testid={`rating-product-${productKey}`}>
                                  <AppleRating rating={thaRating} sizePx={20} showTooltip={false} animate={false} />
                                </div>
                              )}
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
                                  <SelectTrigger className="flex-1" aria-label="Product category" data-testid={`select-product-category-${productKey}`}>
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
                                  className="shrink-0 gap-1 realm-banner-btn"
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
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 gap-1.5 realm-banner-btn"
                                  onClick={() => addProductToBasketMutation.mutate(product)}
                                  disabled={addProductToBasketMutation.isPending}
                                  data-testid={`button-add-to-basket-${productKey}`}
                                >
                                  {addProductToBasketMutation.isPending
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <ShoppingBasket className="h-3.5 w-3.5" />}
                                  Basket
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 gap-1.5 realm-banner-btn"
                                  onClick={() => { appendPendingIngredient(product.product_name + (product.brand ? ` (${product.brand})` : "")); toast({ title: "Added to quick list" }); }}
                                  data-testid={`button-quicklist-product-${productKey}`}
                                >
                                  <ListPlus className="h-3.5 w-3.5" />
                                  Quick List
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
                    className="realm-banner-btn"
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
                <SelectTrigger className="h-7 text-xs w-[140px]" aria-label="Diet pattern" data-testid="select-web-diet-pattern">
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
                className="h-7 text-xs realm-banner-btn"
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
                className="h-7 text-xs realm-banner-btn"
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
                        <Card className="overflow-hidden h-full flex flex-col cursor-pointer" role="button" tabIndex={0} onKeyDown={(e) => { if (e.target !== e.currentTarget) return; if (e.key === "Enter" || e.key === " ") { if (e.key === " ") e.preventDefault(); e.currentTarget.click(); } }} onClick={() => {
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
                                        variant="ghost"
                                        size="sm"
                                        className={expandedTab === "ingredients" ? "h-7 text-xs realm-banner-btn" : "h-7 text-xs"}
                                        onClick={() => setExpandedTab("ingredients")}
                                        data-testid={`tab-ingredients-web-${recipe.id}`}
                                      >
                                        Ingredients
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className={expandedTab === "method" ? "h-7 text-xs realm-banner-btn" : "h-7 text-xs"}
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
                                        onAddToQuickList={handleAddToListFromCookbook}
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
                                  <SelectTrigger className="flex-1" aria-label="Recipe category" data-testid={`select-web-import-category-${recipe.id}`}>
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
                                  className="shrink-0 gap-1 realm-banner-btn"
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
                    className="realm-banner-btn"
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
                <Button size="icon" variant="outline" aria-label="Decrease portions" onClick={() => setFreezerPortions(Math.max(1, freezerPortions - 1))} data-testid="button-portions-minus">
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-2xl font-semibold w-12 text-center" data-testid="text-portions-count">{freezerPortions}</span>
                <Button size="icon" variant="outline" aria-label="Increase portions" onClick={() => setFreezerPortions(freezerPortions + 1)} data-testid="button-portions-plus">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="freezer-batch-label" className="text-sm font-medium">Batch Label (optional)</label>
              <Input
                id="freezer-batch-label"
                placeholder="e.g. Sunday batch cook"
                value={freezerLabel}
                onChange={(e) => setFreezerLabel(e.target.value)}
                data-testid="input-freezer-label"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="freezer-notes" className="text-sm font-medium">Notes (optional)</label>
              <Input
                id="freezer-notes"
                placeholder="e.g. Extra spicy version"
                value={freezerNotes}
                onChange={(e) => setFreezerNotes(e.target.value)}
                data-testid="input-freezer-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddToFreezerMealId(null)} data-testid="button-cancel-freeze">Cancel</Button>
            <Button variant="default"
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

      </div>{/* end flex-1 min-w-0 */}

      {/* ── Cookbook Workspace Panel — desktop sidebar + mobile drawer ── */}
      <CookbookWorkspacePanel
        mode={cookbookMode}
        onSetMode={setCookbookMode}
        mobileOpen={mobileCookbookOpen}
        onMobileClose={() => setMobileCookbookOpen(false)}
        onCameraClick={() => scanFileRef.current?.click()}
        onScanFile={handleScanFile}
        scanLoading={scanLoading}
        onBuildCreated={(mealId) => {
          setActiveGroups(prev => { const n = new Set(prev); n.add("cookbook"); return n; });
        }}
        onAddRecipe={() => setCookbookAddRecipeOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filterCount={advancedFilterCount}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isSearching={webIsSearching || productIsSearching}
        activeGroups={activeGroups}
        onToggleGroup={toggleGroup}
          filterContent={
            <div className="space-y-3">
              {/* Category */}
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Category</span>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 text-xs w-full mt-1.5" aria-label="Filter by category" data-testid="select-category-filter">
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

              <div className="w-full h-px bg-border/50" />

              {/* Audience */}
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Who is this for?</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
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
                      className="h-7 text-xs"
                      onClick={() => toggleAudience(id)}
                      data-testid={`button-audience-${id}`}
                    >
                      {Icon && <Icon className="h-3 w-3 mr-1 text-muted-foreground" />}
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="w-full h-px bg-border/50" />

              {/* Diet */}
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Diet</span>
                <div className="mt-1.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={matchMyProfile}
                      onCheckedChange={setMatchMyProfile}
                      aria-label="Match my profile"
                      data-testid="toggle-match-profile"
                    />
                    <span className="text-xs font-medium">Match my profile</span>
                  </div>
                  <Select
                    value={mealsDietPattern || "none"}
                    onValueChange={v => { setMatchMyProfile(false); const p = v === "none" ? "" : v; setMealsDietPattern(p); setWebDietPattern(p); }}
                  >
                    <SelectTrigger className="h-7 text-xs w-full" aria-label="Diet pattern" data-testid="select-meals-diet-pattern">
                      <SelectValue placeholder="Any diet pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Any diet pattern</SelectItem>
                      {["Mediterranean", "DASH", "MIND", "Flexitarian", "Vegetarian", "Vegan", "Keto", "Low-Carb", "Paleo", "Carnivore"].map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      variant={mealsDietRestrictions.includes("Gluten-Free") ? "secondary" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => { setMatchMyProfile(false); setMealsDietRestrictions(prev => { const next = prev.includes("Gluten-Free") ? prev.filter(r => r !== "Gluten-Free") : [...prev, "Gluten-Free"]; setWebDietRestrictions(next); return next; }); }}
                      data-testid="toggle-meals-restriction-gluten"
                    >
                      <Wheat className="h-3 w-3 mr-1" />
                      Gluten-Free
                    </Button>
                    <Button
                      variant={mealsDietRestrictions.includes("Dairy-Free") ? "secondary" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => { setMatchMyProfile(false); setMealsDietRestrictions(prev => { const next = prev.includes("Dairy-Free") ? prev.filter(r => r !== "Dairy-Free") : [...prev, "Dairy-Free"]; setWebDietRestrictions(next); return next; }); }}
                      data-testid="toggle-meals-restriction-dairy"
                    >
                      <Droplet className="h-3 w-3 mr-1" />
                      Dairy-Free
                    </Button>
                    <Button
                      variant={mealsUpfFilter ? "secondary" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => { setMatchMyProfile(false); setMealsUpfFilter(prev => !prev); }}
                      data-testid="toggle-meals-upf-filter"
                    >
                      <Leaf className={`h-3 w-3 mr-1 ${mealsUpfFilter ? "text-primary" : ""}`} />
                      Hide High-UPF
                    </Button>
                  </div>
                </div>
              </div>

              {(mealsDietPattern || mealsDietRestrictions.length > 0 || mealsUpfFilter || matchMyProfile || categoryFilter !== "all") && (
                <>
                  <div className="w-full h-px bg-border/50" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground w-full"
                    onClick={() => { setMatchMyProfile(false); setMealsDietPattern(""); setMealsDietRestrictions([]); setMealsUpfFilter(false); setWebDietPattern(""); setWebDietRestrictions([]); setCategoryFilter("all"); }}
                    data-testid="button-clear-diet-filters"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear all filters
                  </Button>
                </>
              )}
            </div>
          }
        />

      </div>{/* end flex gap-3 */}

      <RecipeScanReview
        open={scanDialogOpen}
        onOpenChange={handleScanDialogChange}
        scanData={scanData as RecipeScanData | null}
        scanning={scanLoading}
        scanError={scanError ?? undefined}
        onMealCreated={plannerImportCtx ? handlePlannerImportScanMealCreated : undefined}
      />

      {/* Planner import: externally-controlled CreateMealDialog with prefilled name */}
      {plannerImportCtx && !plannerImportCtx.openScan && (
        <CreateMealDialog
          externalOpen={plannerImportDialogOpen}
          onExternalOpenChange={(open) => {
            setPlannerImportDialogOpen(open);
            if (!open) setPlannerImportCtx(null);
          }}
          initialName={plannerImportCtx.mealName}
          onScan={() => { setPlannerImportDialogOpen(false); scanFileRef.current?.click(); }}
          onMealCreated={handlePlannerImportMealCreated}
        />
      )}

      {/* Planner link confirmation dialog */}
      {plannerImportCtx && plannerLinkData && (
        <Dialog open={plannerLinkOpen} onOpenChange={setPlannerLinkOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                {plannerImportCtx.plannerResolve
                  ? "Use scanned recipe for planned meal?"
                  : "Link recipe to planner?"}
              </DialogTitle>
              <DialogDescription>
                {plannerImportCtx.plannerResolve
                  ? `This will resolve "${plannerImportCtx.mealName}"${plannerImportCtx.day !== "Unassigned" ? ` on ${plannerImportCtx.day}` : ""} with the scanned recipe.`
                  : `Add this recipe to your planner${plannerImportCtx.day !== "Unassigned" ? ` for ${plannerImportCtx.day}` : ""}.${plannerImportCtx.plannerEntryId ? " The placeholder entry will be replaced." : ""}`
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-1">
              <div className="rounded-lg border bg-muted/40 px-3 py-2.5">
                <p className="text-sm font-medium">{plannerLinkData.mealName}</p>
                {plannerImportCtx.day !== "Unassigned" && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {plannerImportCtx.day}
                    {plannerImportCtx.slot && plannerImportCtx.slot !== "unspecified"
                      ? ` · ${plannerImportCtx.slot.charAt(0).toUpperCase() + plannerImportCtx.slot.slice(1)}`
                      : ""}
                  </p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => { setPlannerLinkOpen(false); setPlannerImportCtx(null); }}
                >
                  Skip
                </Button>
                <Button variant="default" onClick={handlePlannerLink}>
                  <CalendarDays className="h-4 w-4 mr-1.5" />
                  {plannerImportCtx.plannerResolve ? "Use this recipe" : "Add to planner"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

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
                  <AppleRating rating={barcodeProduct.upfAnalysis.thaRating} sizePx={20} showTooltip={false} animate={false} />
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
            <Button variant="default"
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

    <MobileMealActionSheet
      meal={actionSheetMeal}
      open={!!actionSheetMeal}
      onClose={() => setActionSheetMeal(null)}
      onAddToFreezer={(mealId) => setAddToFreezerMealId(mealId)}
      isSystemMeal={!!actionSheetMeal?.isSystemMeal}
      onImageChange={handleMealImageChange}
      onDelete={actionSheetMeal && !actionSheetMeal.isSystemMeal ? () => { const m = actionSheetMeal; setActionSheetMeal(null); setConfirmDeleteMeal({ id: m.id, name: m.name }); } : undefined}
      onAddToQuickList={handleAddToListFromCookbook}
    />

    <AlertDialog open={confirmDeleteMeal !== null} onOpenChange={(open) => { if (!open) setConfirmDeleteMeal(null); }}>
      <AlertDialogContent data-testid="dialog-delete-meal">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {confirmDeleteMeal?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            The recipe and its ingredients will be removed from your cookbook. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-delete-meal-cancel">Keep it</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => { if (confirmDeleteMeal) deleteMeal.mutate(confirmDeleteMeal.id); setConfirmDeleteMeal(null); }}
            data-testid="button-delete-meal-confirm"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </div>
    </>
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
  /** Raw text scraped from the page - present when scraping succeeded but
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
              aria-label="Meal name"
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
                aria-label={listening ? "Stop listening" : "Start speaking"}
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
          <Button variant="default" onClick={handleConfirm} disabled={!transcript.trim()} data-testid="button-voice-confirm">
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
          <Button variant="default" title="Add Recipe" className="px-2 sm:px-4 realm-banner-btn" data-testid="button-add-meal">
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
        // Don't clear the textarea - leave it so the user can edit and retry
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
                  aria-label="Recipe link"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setFailureMsg(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleImportUrl()}
                  disabled={isImporting}
                  className="flex-1"
                />
                <Button variant="default"
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
                aria-label="Recipe text"
                placeholder={"Paste recipe text here - from a TikTok caption, blog, or anywhere else.\n\nE.g.:\nEasy Pasta\nIngredients: 200g pasta, 2 cloves garlic...\nMethod: Boil pasta, fry garlic..."}
                value={pastedText}
                onChange={(e) => { setPastedText(e.target.value); setFailureMsg(null); }}
                disabled={isImporting}
                className="min-h-[140px] text-sm resize-none"
              />
              <Button variant="default"
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
                  The title, ingredients and steps are read off the page. You review them before anything is saved.
                </p>
              )}
            </TabsContent>
          </Tabs>

          {/* Inline failure message - shown below either tab */}
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

      {/* Review modal - opens after a successful high/partial import */}
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
  interface SmartMealResult { id: number; name: string; score: number; primaryMatches: string[]; stapleMatches: string[]; }
  const [suggestions, setSuggestions] = useState<IngredientSuggestion[] | null>(null);
  const [ingredientSource, setIngredientSource] = useState("");
  const [ingredientDecision, setIngredientDecision] = useState(false);
  const [smartMealResults, setSmartMealResults] = useState<SmartMealResult[] | null>(null);
  // NUTPLAN1 — what the safety gate withheld, in the household's own words.
  // A shortened list must never be presented as if it were the whole answer.
  const [smartMealWithheldNote, setSmartMealWithheldNote] = useState<string | null>(null);
  const [isFindingMeals, setIsFindingMeals] = useState(false);

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
    setIngredientDecision(false);
    setSmartMealResults(null);
    setSmartMealWithheldNote(null);
    setIsFindingMeals(false);
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
        // Ingredient list detected - show decision step
        setIngredientSource(val);
        setIngredientDecision(true);
        return;
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

  const handleFindMeals = async () => {
    const ingredients = ingredientSource.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
    setIngredientDecision(false);
    setIsFindingMeals(true);
    setImportFailureMsg(null);
    try {
      const res = await fetch('/api/meals/smart-create-from-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setImportFailureMsg((err as any).message || "Could not find meals.");
        return;
      }
      // NUTPLAN1 — the route now returns `{ meals, withheldForSafety?, withheldNote? }`
      // because it passes every candidate through the canonical household dietary
      // safety gate before answering.
      const data: { meals: SmartMealResult[]; withheldNote?: string } = await res.json();
      setSmartMealResults(data.meals ?? []);
      setSmartMealWithheldNote(data.withheldNote ?? null);
    } catch {
      setImportFailureMsg("Could not reach the server. Check your connection and try again.");
    } finally {
      setIsFindingMeals(false);
    }
  };

  const handleCreateRecipe = async () => {
    setIngredientDecision(false);
    setIsImporting(true);
    setImportFailureMsg(null);
    try {
      const res = await fetch('/api/suggest-from-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: ingredientSource }),
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setImportFailureMsg((err as any).message || "Could not generate suggestions.");
        return;
      }
      const data = await res.json();
      if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setSuggestions(data.suggestions.slice(0, 3));
      } else {
        setImportFailureMsg("Couldn't generate suggestions. Try pasting fuller recipe text instead.");
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
    // Use browser default language - specifying en-GB can silently fail for non-UK users
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

  // Detect the moment listening stops - snapshot the ref and queue voice import
  useEffect(() => {
    if (wasListeningRef.current && !listening) {
      const captured = speechTranscriptRef.current.trim();
      speechTranscriptRef.current = "";
      if (captured) {
        setPendingVoiceImport(captured);
      } else {
        // Recording stopped with no captured text - let the user know
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
          <Button variant="default" title="Add Recipe" className="px-2 sm:px-4 realm-banner-btn" data-testid="button-add-meal">
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
                    aria-label="Recipe URL or text"
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
                      aria-label={listening ? "Stop recording" : "Speak recipe"}
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
                        aria-label="Scan image"
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
                      aria-label="Import recipe"
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
                    ? (importBanner.isVoice ? "Partial voice import - please review and complete." : "Partial import - some fields may be incomplete.")
                    : importBanner.isVoice
                    ? "Voice recipe structured - please review before saving."
                    : "Imported - please validate before saving."}
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
                  placeholder={"Paste the full recipe text here - e.g. from the post caption, comments, or the recipe website."}
                  aria-label="Recipe text"
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

            {/* ── DECISION STEP ───────────────────────────────────────────── */}
            {ingredientDecision && (
              <div className="space-y-3">
                <p className="text-sm font-medium">What would you like to do?</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleFindMeals}
                    data-testid="button-decision-find-meals"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Find meals
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleCreateRecipe}
                    data-testid="button-decision-create-recipe"
                  >
                    <ChefHat className="h-4 w-4 mr-2" />
                    Create recipe
                  </Button>
                </div>
              </div>
            )}

            {/* ── SMART MEAL RESULTS ──────────────────────────────────────── */}
            {isFindingMeals && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">Finding meals…</span>
              </div>
            )}
            {smartMealResults && !isFindingMeals && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {smartMealResults.length > 0
                    ? "Meals you can make with these ingredients:"
                    : "No matching meals found. Try creating a new recipe instead."}
                </p>
                {/* NUTPLAN1 — say plainly that the list was shortened for safety,
                    rather than letting a filtered list read as the whole answer. */}
                {smartMealWithheldNote && (
                  <p
                    className="text-xs text-muted-foreground"
                    data-testid="smart-meal-withheld-note"
                  >
                    {smartMealWithheldNote}
                  </p>
                )}
                {smartMealResults.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5"
                    data-testid={`smart-meal-result-${r.id}`}
                  >
                    <span className="text-sm font-medium">{r.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {r.primaryMatches.length} match{r.primaryMatches.length !== 1 ? "es" : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ── ACCORDION SECTIONS ──────────────────────────────────────── */}
            {!suggestions && !ingredientDecision && !smartMealResults && !isFindingMeals && (() => {
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
                            <SelectTrigger aria-label="Category" data-testid="select-meal-category">
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
                                  <SelectTrigger aria-label="Type" data-testid="select-meal-kind">
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
                          aria-label="Method / Instructions"
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
              <Button variant="default" type="submit" disabled={createMeal.isPending} data-testid="button-submit-meal">
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
