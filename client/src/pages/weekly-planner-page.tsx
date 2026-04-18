import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, Coffee, Sun, Moon, Cookie, Search, Loader2, ChefHat, ShoppingBasket, Copy, Calendar, CalendarDays, UtensilsCrossed, Snowflake, Settings, Baby, PersonStanding, Wine, LayoutGrid, Share2, LayoutList, Flame, Pencil, ExternalLink, AlertTriangle, ShoppingCart, ChevronLeft, ChevronRight, Trash2, Sparkles, Lock, DollarSign, Shield, Fish, Beef, Salad, HelpCircle, ChevronDown, ChevronUp, RefreshCw, Microscope, Wheat, Droplets, Droplet, Globe, Utensils, Package, Store, Users, Wand2 } from "lucide-react";
import { CreateMealModal } from "@/components/create-meal-modal";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import thaAppleSrc from "@/assets/icons/tha-apple.png";
import { TemplatesPanel } from "@/components/templates-panel";
import { SharePlanDialog } from "@/components/share-plan-dialog";
import { computeMealVariety, EMPTY_VARIETY_SCORE } from "@/lib/nutrition-variety";
import { getMealNutrients } from "@/lib/nutrition-insights";
import { NutritionVarietyDots, PlannerVarietyLegend, MealVarietyNudge } from "@/components/nutrition-variety-chips";
import { MealNutrientTags } from "@/components/nutrition-insights-panel";
import { DayViewDrawer } from "@/components/day-view-drawer";
import { useUser } from "@/hooks/use-user";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FirstVisitHint } from "@/components/first-visit-hint";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import type { PlannerWeek, PlannerDay, PlannerEntry, Meal, FreezerMeal, Nutrition, MealCategory, WeekEaterOverride } from "@shared/schema";
import type { HouseholdEater, GuestEater } from "@shared/household-eater";
import type { AdaptationResult } from "@shared/meal-adaptation";
import { ONBOARDING_DIET_OPTIONS, DIET_PATTERN_OPTIONS, ALLERGY_INTOLERANCE_OPTIONS } from "@/lib/diets";

interface FullDay extends PlannerDay {
  entries: PlannerEntry[];
}

interface FullWeek extends PlannerWeek {
  days: FullDay[];
}

interface EntryTarget {
  dayId: number;
  mealType: string;
  audience: string;
  isDrink: boolean;
  drinkType?: string | null;
}

interface PlannerProductResult {
  barcode: string | null;
  product_name: string;
  brand: string | null;
  image_url: string | null;
  confirmedStores?: string[];
  inferredStores?: string[];
  availableStores?: string[];
  nutriments: { calories: string | null } | null;
}

interface MatrixRow {
  id: string;
  label: string;
  mealType: string | undefined;
  audience: string;
  isDrink: boolean;
  addMealType: string;
  icon: React.ElementType;
  iconColor: string;
}

interface SmartCandidate {
  id: string | number;
  name: string;
  image?: string | null;
  isExternal?: boolean;
  externalId?: string;
  source?: string | null;
  sourceUrl?: string | null;
  estimatedCost?: number | null;
  estimatedUPFScore?: number | null;
  scoreBreakdown?: Record<string, number>;
  category?: string | null;
  cuisine?: string | null;
  primaryProtein?: string | null;
  dietTypes?: string[];
  ingredients?: string[];
  servings?: number | null;
}
interface MealExplanation {
  title: string;
  reasons: string[];
  scoreBreakdown: { healthScore: number; upfScore: number; budgetScore: number; preferenceMatch: number };
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
    userMeals: number;
    externalMeals: number;
    estimatedWeeklyCost: number;
    averageUPFScore: number;
    uniqueIngredients: number;
    ingredientReuse: number;
    proteinDistribution: Record<string, number>;
    sharedIngredients: string[];
  };
}

interface MealDetailState {
  entry: PlannerEntry;
  meal: Meal;
  dayId: number;
  mealType: string;
  audience: string;
  isDrink: boolean;
  dayName: string;
  slotLabel: string;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONDAY_FIRST_ORDER = [1, 2, 3, 4, 5, 6, 0];
const MEAL_TYPES = [
  { key: "breakfast", label: "Breakfast", icon: Coffee, color: "text-amber-500" },
  { key: "lunch",     label: "Lunch",     icon: Sun,    color: "text-orange-500" },
  { key: "dinner",    label: "Dinner",    icon: Moon,   color: "text-indigo-500" },
  { key: "snacks",    label: "Snack",     icon: Cookie, color: "text-green-500" },
];

const BASE_MATRIX_ROWS: MatrixRow[] = [
  { id: "breakfast", label: "Breakfast", mealType: "breakfast", audience: "adult", isDrink: false, addMealType: "breakfast", icon: Coffee, iconColor: "text-amber-500" },
  { id: "lunch",     label: "Lunch",     mealType: "lunch",     audience: "adult", isDrink: false, addMealType: "lunch",      icon: Sun,    iconColor: "text-orange-500" },
  { id: "dinner",    label: "Dinner",    mealType: "dinner",    audience: "adult", isDrink: false, addMealType: "dinner",     icon: Moon,   iconColor: "text-indigo-500" },
  { id: "snacks",    label: "Snacks",    mealType: "snacks",    audience: "adult", isDrink: false, addMealType: "snacks",     icon: Cookie, iconColor: "text-green-500" },
];

function findEntry(entries: PlannerEntry[], mealType: string, audience: string, isDrink: boolean = false): PlannerEntry | undefined {
  return entries.find(e => e.mealType === mealType && e.audience === audience && e.isDrink === isDrink);
}

function getSlotEntries(entries: PlannerEntry[], mealType: string, audience: string, isDrink: boolean = false): PlannerEntry[] {
  return entries
    .filter(e => e.mealType === mealType && e.audience === audience && e.isDrink === isDrink)
    .sort((a, b) => a.position !== b.position ? a.position - b.position : a.id - b.id);
}

function getDrinkEntries(entries: PlannerEntry[]): PlannerEntry[] {
  return entries
    .filter(e => e.isDrink === true)
    .sort((a, b) => a.position !== b.position ? a.position - b.position : a.id - b.id);
}

function getCellEntries(entries: PlannerEntry[], row: MatrixRow): PlannerEntry[] {
  return entries
    .filter(e => {
      if (e.isDrink !== row.isDrink) return false;
      if (row.mealType !== undefined && e.mealType !== row.mealType) return false;
      if (e.audience !== row.audience) return false;
      return true;
    })
    .sort((a, b) => a.position !== b.position ? a.position - b.position : a.id - b.id);
}

function getUPFColorFn(score?: number) {
  if (!score) return "text-muted-foreground";
  if (score <= 20) return "text-green-600 dark:text-green-400";
  if (score <= 50) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}
function getUPFLabelFn(score?: number) {
  if (!score) return "Unknown";
  if (score <= 20) return "Minimal";
  if (score <= 50) return "Moderate";
  return "High";
}

interface SmartMealEntryCardProps {
  entry: SmartSuggestEntry;
  meal: Meal | undefined;
  nutrition: Nutrition | undefined;
  nutritionLoading: boolean;
  locked: boolean;
  expanded: boolean;
  smartLoading: boolean;
  onLock: () => void;
  onRefresh: () => void;
  onExpandExplain: () => void;
  onNutritionRefresh: () => void;
}

function SmartMealEntryCard({ entry, meal, nutrition, nutritionLoading, locked, expanded, smartLoading, onLock, onRefresh, onExpandExplain, onNutritionRefresh }: SmartMealEntryCardProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [qty, setQty] = useState(1);
  const mealId = !entry.candidate.isExternal ? Number(entry.candidate.id) : null;
  const key = `${entry.dayOfWeek}-${entry.slot}`;

  const addToListMutation = useMutation({
    mutationFn: async () => {
      if (!mealId) throw new Error('No meal id');
      const res = await apiRequest('POST', '/api/shopping-list/from-meals', { mealSelections: [{ mealId, count: qty }] });
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/shopping-list'] }); toast({ title: "Added to basket" }); },
    onError: () => toast({ title: "Failed to add", variant: "destructive" }),
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!mealId) throw new Error('No meal id');
      const res = await apiRequest('POST', '/api/analyze-meal', { mealId });
      return res.json();
    },
    onSuccess: (data: { healthScore: number }) => {
      toast({ title: "Analysis complete", description: `Health score: ${data.healthScore}/100` });
      onNutritionRefresh();
    },
    onError: () => toast({ title: "Analysis failed", variant: "destructive" }),
  });

  const mealImg = entry.candidate.image || meal?.imageUrl || null;
  const dietTypes = entry.candidate.dietTypes || meal?.dietTypes || [];
  const cuisine = entry.candidate.cuisine || null;
  const sourceName = entry.candidate.source || (entry.candidate.isExternal ? 'Web' : 'Cookbook');
  const sourceUrl = entry.candidate.sourceUrl || meal?.sourceUrl || null;
  const ingredientList = (entry.candidate.ingredients?.length ? entry.candidate.ingredients : null) || meal?.ingredients || [];
  const ingredientCount = ingredientList.length || null;
  const varietyScore = useMemo(() => computeMealVariety(ingredientList), [ingredientList]);
  const nutrientTags = useMemo(() => getMealNutrients(ingredientList), [ingredientList]);
  const servings = entry.candidate.servings || meal?.servings || null;
  const primaryProtein = entry.candidate.primaryProtein || null;
  const upfScore = entry.candidate.estimatedUPFScore ?? null;
  const cost = entry.candidate.estimatedCost ?? null;
  const isFreezerEligible = meal?.isFreezerEligible ?? false;

  const nutritionItems = nutrition ? [
    { label: 'Calories', value: nutrition.calories, Icon: Flame, color: 'text-orange-500' },
    { label: 'Protein', value: nutrition.protein, Icon: Beef, color: 'text-red-500' },
    { label: 'Carbs', value: nutrition.carbs, Icon: Wheat, color: 'text-amber-600' },
    { label: 'Fat', value: nutrition.fat, Icon: Droplets, color: 'text-yellow-500' },
    { label: 'Sugar', value: nutrition.sugar, Icon: Cookie, color: 'text-pink-500' },
    { label: 'Salt', value: nutrition.salt, Icon: Droplet, color: 'text-blue-500' },
  ].filter(i => i.value) : [];

  return (
    <div className="flex flex-col">
      <div className="flex items-start gap-3 px-3 pt-3 pb-2">
        <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0 border flex items-center justify-center">
          {mealImg
            ? <img src={mealImg} alt={entry.candidate.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : <UtensilsCrossed className="h-6 w-6 text-muted-foreground/40" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="text-xs font-medium text-muted-foreground capitalize">{entry.slot}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-xs text-muted-foreground">{sourceName}</span>
            {dietTypes.includes('vegetarian') && <Badge variant="outline" className="text-[10px] h-4 px-1 border-green-500/50 text-green-600 dark:text-green-400">Vegetarian</Badge>}
            {dietTypes.includes('vegan') && <Badge variant="outline" className="text-[10px] h-4 px-1 border-green-500/50 text-green-600 dark:text-green-400">Vegan</Badge>}
            {dietTypes.includes('gluten-free') && <Badge variant="outline" className="text-[10px] h-4 px-1 border-amber-500/50 text-amber-600 dark:text-amber-400">GF</Badge>}
          </div>
          <p className="text-sm font-semibold leading-snug mb-1">{entry.candidate.name}</p>
          <NutritionVarietyDots score={varietyScore} />
          <MealNutrientTags nutrients={nutrientTags} />
          <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
            {cuisine && <span className="capitalize">{cuisine}</span>}
            {primaryProtein && <span className="capitalize">{primaryProtein}</span>}
            {ingredientCount ? <span>{ingredientCount} ingredients</span> : null}
            {servings ? <span>{servings} servings</span> : null}
          </div>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <button onClick={onRefresh} disabled={smartLoading} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors disabled:opacity-40" title="Get a different meal for this slot" data-testid={`button-refresh-${key}`}>
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button onClick={onLock} className={`p-1.5 rounded-md transition-colors ${locked ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"}`} title={locked ? "Locked - kept on regenerate" : "Click to lock"} data-testid={`button-lock-${key}`}>
            <Lock className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {mealId && (
        <div className="px-3 pb-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">Nutrition (per serving)</p>
          {nutritionLoading && !nutritionItems.length ? (
            <div className="grid grid-cols-3 gap-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-5 rounded-md bg-muted animate-pulse" />
              ))}
            </div>
          ) : nutritionItems.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {nutritionItems.map(({ label, value, Icon, color }) => (
                <div key={label} className="flex items-center gap-1 rounded-md bg-muted/50 px-1.5 py-0.5">
                  <Icon className={`h-3 w-3 shrink-0 ${color}`} />
                  <span className="text-xs font-medium truncate">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <button
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-0.5"
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              data-testid={`button-fetch-nutrition-${key}`}
            >
              {analyzeMutation.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Microscope className="h-3.5 w-3.5" />}
              {analyzeMutation.isPending ? 'Analysing…' : 'Tap to fetch nutrition data'}
            </button>
          )}
        </div>
      )}

      <div className="px-3 pb-2.5 pt-1.5 flex items-center gap-1 border-t flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" className="text-xs font-semibold shrink-0 h-7 min-w-8 px-2" data-testid={`button-qty-${key}`}>{qty}</Button>
          </PopoverTrigger>
          <PopoverContent className="w-12 p-1" align="start" side="top">
            <div className="flex flex-col gap-0.5">
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <Button key={n} size="sm" variant={n === qty ? "default" : "ghost"} className="text-xs h-6" onClick={() => setQty(n)}>{n}</Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {servings != null && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground px-1"><UtensilsCrossed className="h-3.5 w-3.5" /><span>{servings}</span></span>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">{servings} serving{servings !== 1 ? 's' : ''}</p></TooltipContent>
          </Tooltip>
        )}

        {sourceUrl && (
          <Tooltip>
            <TooltipTrigger asChild>
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} data-testid={`link-recipe-${key}`}>
                <Button size="icon" variant="ghost" className="h-7 w-7" asChild><span><Globe className="h-4 w-4" /></span></Button>
              </a>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">View original recipe</p></TooltipContent>
          </Tooltip>
        )}

        {mealId && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => navigate(`/meals/${mealId}`)} data-testid={`button-edit-${key}`}>
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">View & edit recipe</p></TooltipContent>
          </Tooltip>
        )}

        {mealId && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => addToListMutation.mutate()} disabled={addToListMutation.isPending} data-testid={`button-basket-${key}`}>
                {addToListMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBasket className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">Add to basket</p></TooltipContent>
          </Tooltip>
        )}

        {mealId && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending} data-testid={`button-analyse-${key}`}>
                {analyzeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Microscope className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">Analyse nutrition</p></TooltipContent>
          </Tooltip>
        )}

        {isFreezerEligible && mealId && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-400" data-testid={`button-freeze-${key}`}>
                <Snowflake className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">Add to freezer</p></TooltipContent>
          </Tooltip>
        )}

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {cost != null && <span className="flex items-center gap-0.5 text-xs text-muted-foreground"><DollarSign className="h-3 w-3" />£{cost.toFixed(2)}</span>}
          {upfScore != null && <span className={`text-xs ${getUPFColorFn(upfScore)}`}>UPF: {getUPFLabelFn(upfScore)}</span>}
          {entry.explanation && (
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors" onClick={onExpandExplain} data-testid={`button-explain-${key}`}>
              <HelpCircle className="h-3 w-3" />{expanded ? "Hide" : "Why this?"}
            </button>
          )}
        </div>
      </div>

      {expanded && entry.explanation && (
        <div className="px-3 pb-3 text-xs text-muted-foreground space-y-0.5 bg-muted/20 border-t pt-2">
          {entry.explanation.reasons.map((r, i) => <p key={i}>• {r}</p>)}
        </div>
      )}
    </div>
  );
}

export default function WeeklyPlannerPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeWeek, setActiveWeek] = useState("1");
  const [renameWeekId, setRenameWeekId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [clearWeekId, setClearWeekId] = useState<number | null>(null);
  const [createMealOpen, setCreateMealOpen] = useState(false);
  const [mealPickerOpen, setMealPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<EntryTarget | null>(null);
  const [mealSearch, setMealSearch] = useState("");
  const [mealFilter, setMealFilter] = useState<"all" | "cookbook" | "planner" | "ready" | "product">("all");
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkMeal, setBulkMeal] = useState<Meal | null>(null);
  const [bulkWeeks, setBulkWeeks] = useState<Set<number>>(new Set());
  const [bulkDays, setBulkDays] = useState<Set<number>>(new Set());
  const [bulkSlots, setBulkSlots] = useState<Set<string>>(new Set());
  const [bulkMealSearch, setBulkMealSearch] = useState("");
  const [bulkMealFilter, setBulkMealFilter] = useState<"all" | "cookbook" | "planner" | "ready">("all");
  const [bulkStep, setBulkStep] = useState<1 | 2>(1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [sharePlanOpen, setSharePlanOpen] = useState(false);
  const [expandedDayId, setExpandedDayId] = useState<number | null>(null);
  const [expandedDayLabel, setExpandedDayLabel] = useState("");
  const [mealDetail, setMealDetail] = useState<MealDetailState | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const [mobileDayIndex, setMobileDayIndex] = useState(0);
  const { user } = useUser();
  const [, navigate] = useLocation();

  const [smartLoading, setSmartLoading] = useState(false);
  const [smartResult, setSmartResult] = useState<SmartSuggestResult | null>(null);
  const [smartDialogOpen, setSmartDialogOpen] = useState(false);
  const [smartNutritionMap, setSmartNutritionMap] = useState<Map<number, Nutrition>>(new Map());
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [nutritionFetchTick, setNutritionFetchTick] = useState(0);
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
  const [applyingSmartPlan, setApplyingSmartPlan] = useState(false);

  // Product search within meal picker
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<PlannerProductResult[]>([]);
  const [productSearching, setProductSearching] = useState(false);
  const [productRetailer, setProductRetailer] = useState("");

  const { data: plannerSettings } = useQuery<{
    showCalories: boolean;
    enableBabyMeals: boolean;
    enableChildMeals: boolean;
    enableDrinks: boolean;
  }>({
    queryKey: ["/api/user/planner-settings"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Record<string, boolean>) => {
      const res = await apiRequest("PATCH", "/api/user/planner-settings", updates);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/user/planner-settings"] });
    },
    onError: () => {
      toast({ title: "Failed to update settings", variant: "destructive" });
    },
  });

  const toggleSetting = (key: string, value: boolean) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  const loadTemplateMutation = useMutation({
    mutationFn: async () => {
      const defaultRes = await fetch("/api/plan-templates/default");
      if (!defaultRes.ok) throw new Error("No default template found");
      const { id } = await defaultRes.json();
      const applyRes = await apiRequest("POST", `/api/plan-templates/${id}/apply?mode=replace`);
      if (!applyRes.ok) throw new Error("Failed to apply template");
      return applyRes.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
      toast({
        title: "Plan loaded!",
        description: `${data.createdCount + data.updatedCount} meals added to your planner.`,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to load plan", description: err.message, variant: "destructive" });
    },
  });

  const { data: fullPlanner = [], isLoading } = useQuery<FullWeek[]>({
    queryKey: ["/api/planner/full"],
  });

  const { data: meals = [] } = useQuery<Meal[]>({
    queryKey: ["/api/meals"],
  });

  const { data: freezerMeals = [] } = useQuery<FreezerMeal[]>({
    queryKey: ["/api/freezer"],
  });

  const { data: basketMealIds = [] } = useQuery<number[]>({
    queryKey: ["/api/planner/basket-meal-ids"],
  });
  const basketMealIdSet = useMemo(() => new Set(basketMealIds), [basketMealIds]);
  const mealById = useMemo(() => new Map(meals.map(m => [m.id, m])), [meals]);

  const { data: categories = [] } = useQuery<MealCategory[]>({
    queryKey: ['/api/categories'],
  });

  const { data: pantryItems = [] } = useQuery<{ id: number; ingredientKey: string; displayName: string | null }[]>({
    queryKey: ['/api/pantry'],
  });
  const pantryNames = useMemo(
    () => pantryItems.map(p => p.displayName ?? p.ingredientKey),
    [pantryItems],
  );

  const allMealIds = useMemo(() => {
    const ids = new Set<number>();
    fullPlanner.forEach(w => w.days.forEach(d => {
      d.entries.forEach(e => ids.add(e.mealId));
    }));
    return Array.from(ids);
  }, [fullPlanner]);

  const { data: nutritionData = [] } = useQuery<Nutrition[]>({
    queryKey: ["/api/nutrition/bulk", allMealIds],
    queryFn: async () => {
      if (allMealIds.length === 0) return [];
      const res = await apiRequest("POST", "/api/nutrition/bulk", { mealIds: allMealIds });
      return res.json();
    },
    enabled: allMealIds.length > 0,
  });

  const nutritionMap = useMemo(() => {
    const map = new Map<number, number>();
    nutritionData.forEach(n => {
      const cal = parseInt(n.calories || "0", 10);
      if (!isNaN(cal) && cal > 0) map.set(n.mealId, cal);
    });
    return map;
  }, [nutritionData]);

  // ── Household eaters (Phase 2) ────────────────────────────────────────────────
  const { data: householdEaters = [] } = useQuery<HouseholdEater[]>({
    queryKey: ["/api/household/eaters"],
  });

  const { data: entryEaters = [] } = useQuery<HouseholdEater[]>({
    queryKey: ["/api/planner/entries", mealDetail?.entry.id, "eaters"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/planner/entries/${mealDetail!.entry.id}/eaters`);
      return res.json();
    },
    enabled: !!mealDetail,
  });

  const setEntryEatersMutation = useMutation({
    mutationFn: async ({ entryId, eaterIds }: { entryId: number; eaterIds: number[] }) => {
      const res = await apiRequest("PUT", `/api/planner/entries/${entryId}/eaters`, { eaterIds });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/entries", mealDetail?.entry.id, "eaters"] });
    },
    onError: () => {
      toast({ title: "Failed to update eaters", variant: "destructive" });
    },
  });

  // ── Week eater overrides (Phase 4) ───────────────────────────────────────────
  const [weekDietsOpen, setWeekDietsOpen] = useState(false);

  const activeWeekId = fullPlanner.find((w) => w.weekNumber === Number(activeWeek))?.id;

  const { data: weekOverrides = [] } = useQuery<WeekEaterOverride[]>({
    queryKey: ["/api/planner/weeks", activeWeekId, "eater-overrides"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/planner/weeks/${activeWeekId}/eater-overrides`);
      return res.json();
    },
    enabled: !!activeWeekId && householdEaters.length > 0,
  });

  const setOverrideMutation = useMutation({
    mutationFn: async ({ eaterId, dietTypes }: { eaterId: number; dietTypes: string[] }) => {
      const res = await apiRequest("PUT", `/api/planner/weeks/${activeWeekId}/eater-overrides/${eaterId}`, { dietTypes });
      if (!res.ok) throw new Error("Failed to save override");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/planner/weeks", activeWeekId, "eater-overrides"] }),
    onError: () => toast({ title: "Failed to save diet override", variant: "destructive" }),
  });

  const deleteOverrideMutation = useMutation({
    mutationFn: async (eaterId: number) => {
      const res = await apiRequest("DELETE", `/api/planner/weeks/${activeWeekId}/eater-overrides/${eaterId}`);
      if (!res.ok) throw new Error("Failed to remove override");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/planner/weeks", activeWeekId, "eater-overrides"] }),
    onError: () => toast({ title: "Failed to remove diet override", variant: "destructive" }),
  });

  // ── Meal adaptation (Phase 3) ────────────────────────────────────────────────
  const [adaptationOpen, setAdaptationOpen] = useState(false);

  const adaptMutation = useMutation({
    mutationFn: async (entryId: number): Promise<AdaptationResult> => {
      const res = await apiRequest("POST", `/api/planner/entries/${entryId}/adapt`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? "Failed to generate adaptation");
      }
      return res.json();
    },
    onSuccess: () => {
      // Refresh the planner so the stored result is reflected
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
      setAdaptationOpen(true);
    },
    onError: (err: Error) => {
      toast({ title: "Adaptation failed", description: err.message, variant: "destructive" });
    },
  });

  // ── Entry guests (Phase 5) ────────────────────────────────────────────────────
  const [addGuestOpen, setAddGuestOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestDietTypes, setGuestDietTypes] = useState<string[]>([]);
  const [guestRestrictions, setGuestRestrictions] = useState<string[]>([]);

  const { data: entryGuests = [] } = useQuery<GuestEater[]>({
    queryKey: ["/api/planner/entries", mealDetail?.entry.id, "guests"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/planner/entries/${mealDetail!.entry.id}/guests`);
      return res.json();
    },
    enabled: !!mealDetail,
  });

  const addGuestMutation = useMutation({
    mutationFn: async (guest: GuestEater) => {
      const res = await apiRequest("POST", `/api/planner/entries/${mealDetail!.entry.id}/guests`, guest);
      if (!res.ok) throw new Error("Failed to add guest");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/entries", mealDetail?.entry.id, "guests"] });
      setGuestName("");
      setGuestDietTypes([]);
      setGuestRestrictions([]);
      setAddGuestOpen(false);
    },
    onError: () => toast({ title: "Failed to add guest", variant: "destructive" }),
  });

  const removeGuestMutation = useMutation({
    mutationFn: async (guestId: string) => {
      const res = await apiRequest("DELETE", `/api/planner/entries/${mealDetail!.entry.id}/guests/${guestId}`);
      if (!res.ok) throw new Error("Failed to remove guest");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/entries", mealDetail?.entry.id, "guests"] });
    },
    onError: () => toast({ title: "Failed to remove guest", variant: "destructive" }),
  });

  const renameMutation = useMutation({
    mutationFn: async ({ weekId, weekName }: { weekId: number; weekName: string }) => {
      const res = await apiRequest("PATCH", `/api/planner/weeks/${weekId}`, { weekName });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
      setRenameWeekId(null);
      setRenameValue("");
    },
    onError: () => {
      toast({ title: "Failed to rename week", variant: "destructive" });
    },
  });

  const clearWeekMutation = useMutation({
    mutationFn: async (weekId: number) => {
      const res = await apiRequest("DELETE", `/api/planner/weeks/${weekId}/entries`);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
      setClearWeekId(null);
      toast({ title: "Week cleared" });
    },
    onError: () => {
      toast({ title: "Failed to clear week", variant: "destructive" });
    },
  });

  const upsertEntryMutation = useMutation({
    mutationFn: async (params: { dayId: number; mealType: string; audience: string; mealId: number | null; isDrink?: boolean; drinkType?: string | null }) => {
      const res = await apiRequest("PUT", `/api/planner/days/${params.dayId}/entries`, {
        mealType: params.mealType,
        audience: params.audience,
        mealId: params.mealId,
        isDrink: params.isDrink ?? false,
        drinkType: params.drinkType ?? null,
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
    },
    onError: () => {
      toast({ title: "Failed to update meal", variant: "destructive" });
    },
  });

  const addEntryMutation = useMutation({
    mutationFn: async (params: { dayId: number; mealType: string; audience: string; mealId: number; position: number; isDrink: boolean; drinkType?: string | null }) => {
      const res = await apiRequest("POST", `/api/planner/days/${params.dayId}/items`, {
        mealSlot: params.mealType,
        mealId: params.mealId,
        position: params.position,
        audience: params.audience,
        isDrink: params.isDrink,
        drinkType: params.drinkType ?? null,
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
    },
    onError: () => {
      toast({ title: "Failed to add meal", variant: "destructive" });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: number) => {
      const res = await apiRequest("DELETE", `/api/planner/entries/${entryId}`);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
    },
    onError: () => {
      toast({ title: "Failed to remove meal", variant: "destructive" });
    },
  });

  const addToBasketMutation = useMutation({
    mutationFn: async (mealSelections: { mealId: number; count: number }[]) => {
      const res = await apiRequest("POST", api.shoppingList.generateFromMeals.path, { mealSelections });
      return res.json();
    },
    onSuccess: (_data, mealSelections) => {
      qc.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      qc.invalidateQueries({ queryKey: [api.shoppingList.sources.path] });
      qc.invalidateQueries({ queryKey: [api.shoppingList.prices.path] });
      qc.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      const totalServings = mealSelections.reduce((sum, s) => sum + s.count, 0);
      toast({ title: "Added to basket", description: `${totalServings} meal serving${totalServings !== 1 ? 's' : ''}` });
    },
    onError: (err) => {
      toast({ title: "Failed to add to basket", variant: "destructive" });
    },
  });

  const getMeal = (id: number | null): Meal | undefined => {
    if (!id) return undefined;
    return meals.find((m) => m.id === id);
  };

  // Meal IDs already placed in the active week (for "From Planner" filter)
  const plannerMealIdSet = useMemo(() => {
    const ids = new Set<number>();
    const activeWk = fullPlanner.find((w) => w.weekNumber === Number(activeWeek));
    activeWk?.days?.forEach(d => d.entries.forEach(e => ids.add(e.mealId)));
    return ids;
  }, [fullPlanner, activeWeek]);

  const categoryIdForSlot = useMemo(() => {
    const map: Record<string, number | undefined> = {};
    for (const cat of categories) {
      const n = cat.name.toLowerCase();
      if (n === "breakfast") map["breakfast"] = cat.id;
      else if (n === "lunch") map["lunch"] = cat.id;
      else if (n === "dinner") map["dinner"] = cat.id;
      else if (n === "snack") map["snacks"] = cat.id;
    }
    return map;
  }, [categories]);

  const filteredMeals = useMemo(() => {
    let result = meals;
    if (pickerTarget) {
      if (pickerTarget.isDrink) {
        result = result.filter((m) => m.isDrink);
      } else {
        result = result.filter((m) => !m.isDrink);
        if (pickerTarget.audience === "baby") {
          result = result.filter((m) => m.audience === "baby");
        } else if (pickerTarget.audience === "child") {
          result = result.filter((m) => m.audience === "child");
        } else {
          result = result.filter((m) => m.audience !== "baby" && m.audience !== "child");
        }
      }
    }
    if (mealFilter === "cookbook") {
      result = result.filter((m) => !m.isReadyMeal && !m.isSystemMeal);
    } else if (mealFilter === "planner") {
      result = result.filter((m) => plannerMealIdSet.has(m.id));
    } else if (mealFilter === "ready") {
      result = result.filter((m) => m.isReadyMeal);
    }
    if (mealSearch.trim()) {
      const q = mealSearch.toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(q));
    }
    if (!mealSearch.trim() && pickerTarget && !pickerTarget.isDrink) {
      const slotCatId = categoryIdForSlot[pickerTarget.mealType];
      if (slotCatId) {
        const matching = result.filter((m) => m.categoryId === slotCatId);
        const rest = result.filter((m) => m.categoryId !== slotCatId);
        result = [...matching, ...rest];
      }
    }
    return result.slice(0, 100);
  }, [meals, mealFilter, mealSearch, pickerTarget, categoryIdForSlot, plannerMealIdSet]);

  const bulkFilteredMeals = useMemo(() => {
    let result = meals;
    if (bulkMealFilter === "cookbook") result = result.filter((m) => !m.isReadyMeal && !m.isSystemMeal);
    else if (bulkMealFilter === "planner") result = result.filter((m) => plannerMealIdSet.has(m.id));
    else if (bulkMealFilter === "ready") result = result.filter((m) => m.isReadyMeal);
    if (bulkMealSearch.trim()) {
      const q = bulkMealSearch.toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(q));
    }
    return result.slice(0, 100);
  }, [meals, bulkMealFilter, bulkMealSearch, plannerMealIdSet]);

  const bulkAssignments = useMemo(() => {
    if (!bulkMeal || bulkWeeks.size === 0 || bulkDays.size === 0 || bulkSlots.size === 0) return [];
    const result: { weekName: string; dayName: string; slotLabel: string; dayId: number; mealType: string }[] = [];
    for (const week of fullPlanner) {
      if (!bulkWeeks.has(week.id)) continue;
      const days = week.days || [];
      for (const day of days) {
        if (!bulkDays.has(day.dayOfWeek)) continue;
        for (const slot of MEAL_TYPES) {
          if (!bulkSlots.has(slot.key)) continue;
          result.push({
            weekName: week.weekName,
            dayName: DAY_NAMES[day.dayOfWeek],
            slotLabel: slot.label,
            dayId: day.id,
            mealType: slot.key,
          });
        }
      }
    }
    return result;
  }, [bulkMeal, bulkWeeks, bulkDays, bulkSlots, fullPlanner]);

  const bulkAssignMutation = useMutation({
    mutationFn: async () => {
      for (const a of bulkAssignments) {
        await apiRequest("PUT", `/api/planner/days/${a.dayId}/entries`, {
          mealType: a.mealType,
          audience: "adult",
          mealId: bulkMeal!.id,
          isDrink: false,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
      toast({ title: "Meals assigned", description: `${bulkMeal!.name} added to ${bulkAssignments.length} slot${bulkAssignments.length > 1 ? 's' : ''}.` });
      resetBulkAssign();
    },
    onError: () => {
      toast({ title: "Failed to assign meals", variant: "destructive" });
    },
  });

  const resetBulkAssign = () => {
    setBulkAssignOpen(false);
    setBulkMeal(null);
    setBulkWeeks(new Set());
    setBulkDays(new Set());
    setBulkSlots(new Set());
    setBulkMealSearch("");
    setBulkStep(1);
  };

  const openPicker = (target: EntryTarget) => {
    setPickerTarget(target);
    setMealSearch("");
    setMealPickerOpen(true);
  };

  const selectMeal = (mealId: number) => {
    if (!pickerTarget) return;
    const day = fullPlanner.flatMap(w => w.days).find(d => d.id === pickerTarget.dayId);
    const position = day
      ? pickerTarget.isDrink
        ? getDrinkEntries(day.entries).length
        : getSlotEntries(day.entries, pickerTarget.mealType, pickerTarget.audience, false).length
      : 0;
    addEntryMutation.mutate({
      dayId: pickerTarget.dayId,
      mealType: pickerTarget.mealType,
      audience: pickerTarget.audience,
      mealId,
      position,
      isDrink: pickerTarget.isDrink ?? false,
      drinkType: pickerTarget.drinkType,
    });
    setMealPickerOpen(false);
    setPickerTarget(null);
  };

  const searchProducts = async () => {
    if (!productQuery.trim()) return;
    setProductSearching(true);
    try {
      const q = productRetailer
        ? `${productRetailer} ${productQuery.trim()}`
        : productQuery.trim();
      const res = await fetch(`/api/search-products?q=${encodeURIComponent(q)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      let products: PlannerProductResult[] = data.products || [];
      if (productRetailer) {
        const r = productRetailer.toLowerCase();
        const withStore = products.filter(p =>
          [...(p.confirmedStores ?? []), ...(p.inferredStores ?? []), ...(p.availableStores ?? [])]
            .some(s => s.toLowerCase().includes(r))
        );
        products = withStore.length > 0 ? withStore : products;
      }
      setProductResults(products.slice(0, 30));
    } catch {
      toast({ title: "Product search failed", variant: "destructive" });
    } finally {
      setProductSearching(false);
    }
  };

  const addProductToPlanner = async (product: PlannerProductResult) => {
    if (!pickerTarget) return;
    try {
      const mealRes = await apiRequest("POST", "/api/meals", {
        name: product.brand ? `${product.brand} – ${product.product_name}` : product.product_name,
        ingredients: [],
        instructions: [],
        servings: 1,
        kind: "meal",
        isReadyMeal: true,
        brand: product.brand ?? undefined,
        barcode: product.barcode ?? undefined,
      });
      const meal = await mealRes.json();
      qc.invalidateQueries({ queryKey: ["/api/meals"] });
      selectMeal(meal.id);
    } catch {
      toast({ title: "Could not add product to planner", variant: "destructive" });
    }
  };

  const clearEntry = (target: EntryTarget) => {
    upsertEntryMutation.mutate({
      dayId: target.dayId,
      mealType: target.mealType,
      audience: target.audience,
      mealId: null,
      isDrink: target.isDrink,
      drinkType: target.drinkType,
    });
  };

  const collectMealSelections = (days: FullDay[], mealTypeFilter?: string): { mealId: number; count: number }[] => {
    const counts = new Map<number, number>();
    for (const day of days) {
      for (const entry of day.entries) {
        if (mealTypeFilter && entry.mealType !== mealTypeFilter) continue;
        counts.set(entry.mealId, (counts.get(entry.mealId) || 0) + 1);
      }
    }
    return Array.from(counts.entries()).map(([mealId, count]) => ({ mealId, count }));
  };

  const addDayToBasket = (day: FullDay) => {
    const selections = collectMealSelections([day]);
    if (selections.length === 0) {
      toast({ title: "No meals to add for this day" });
      return;
    }
    addToBasketMutation.mutate(selections);
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

  useEffect(() => {
    if (!smartResult || !smartDialogOpen) return;
    const internalIds = smartResult.entries
      .filter(e => !e.candidate.isExternal)
      .map(e => Number(e.candidate.id))
      .filter(id => !isNaN(id));
    if (internalIds.length === 0) return;

    let cancelled = false;
    const retryDelays = [0, 5000, 10000, 20000, 35000];
    let attempt = 0;

    const fetchOnce = async (): Promise<boolean> => {
      const r = await apiRequest('POST', '/api/nutrition/bulk', { mealIds: internalIds });
      const data: Nutrition[] = await r.json();
      if (cancelled) return true;
      const map = new Map<number, Nutrition>();
      data.forEach(n => { if (n.mealId) map.set(n.mealId, n); });
      setSmartNutritionMap(map);
      const allLoaded = internalIds.every(id => data.some(n => n.mealId === id && n.calories));
      return allLoaded;
    };

    const runWithRetry = async () => {
      setNutritionLoading(true);
      try {
        for (attempt = 0; attempt < retryDelays.length; attempt++) {
          if (cancelled) break;
          if (attempt > 0) {
            await new Promise(r => setTimeout(r, retryDelays[attempt]));
          }
          if (cancelled) break;
          const done = await fetchOnce();
          if (done || cancelled) break;
        }
      } catch {
        // swallow fetch errors
      } finally {
        if (!cancelled) setNutritionLoading(false);
      }
    };

    runWithRetry();
    return () => { cancelled = true; };
  }, [smartResult, smartDialogOpen, nutritionFetchTick]);

  const runSmartSuggest = async (preserveLocks = false) => {
    setSmartLoading(true);
    try {
      const locked: { dayOfWeek: number; slot: string; candidateId: string | number; candidateName: string }[] = [];

      // Always include meals already planned in the current week as locked entries
      // so the AI builds around what's there rather than ignoring it.
      const mealNameById = new Map(meals.map(m => [m.id, m.name]));
      const currentWeek = fullPlanner.find(w => String(w.weekNumber) === activeWeek);
      if (currentWeek) {
        for (const day of currentWeek.days) {
          for (const entry of day.entries) {
            const slot = entry.mealType === 'snacks' ? 'snack' : entry.mealType;
            locked.push({
              dayOfWeek: day.dayOfWeek,
              slot,
              candidateId: entry.mealId,
              candidateName: mealNameById.get(entry.mealId) ?? '',
            });
          }
        }
      }

      if (preserveLocks && smartResult) {
        for (const entry of smartResult.entries) {
          const key = `${entry.dayOfWeek}-${entry.slot}`;
          if (lockedEntries.has(key)) {
            // Only add if not already present from existing planner entries
            const alreadyLocked = locked.some(l => l.dayOfWeek === entry.dayOfWeek && l.slot === entry.slot);
            if (!alreadyLocked) {
              locked.push({ dayOfWeek: entry.dayOfWeek, slot: entry.slot, candidateId: entry.candidate.id, candidateName: entry.candidate.name });
            }
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
        lockedEntries: locked.length > 0 ? locked : undefined,
      });
      const data = await res.json() as SmartSuggestResult;
      setSmartResult(data);
      if (!preserveLocks) setLockedEntries(new Set());
      setSmartDialogOpen(true);
      setSmartControlsOpen(false);
    } catch {
      toast({ title: "Plan generation failed", description: "Could not propose a plan. Try again.", variant: "destructive" });
    } finally {
      setSmartLoading(false);
    }
  };

  const toggleLockEntry = (key: string) => {
    setLockedEntries(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const applySmartSuggestion = async () => {
    if (!smartResult || !activeWeekData) return;
    setApplyingSmartPlan(true);
    let importedCount = 0;
    let failedCount = 0;
    try {
      for (const entry of smartResult.entries) {
        const day = activeWeekData.days.find(d => d.dayOfWeek === entry.dayOfWeek);
        if (!day) continue;
        try {
          let mealId: number;
          if (entry.candidate.isExternal) {
            const importRes = await apiRequest('POST', '/api/smart-suggest/auto-import', { candidate: entry.candidate });
            const importData = await importRes.json();
            mealId = importData.mealId;
            importedCount++;
          } else {
            mealId = Number(entry.candidate.id);
          }
          await apiRequest('POST', `/api/planner/days/${day.id}/items`, {
            mealSlot: entry.slot,
            mealId,
            position: 0,
            audience: 'adult',
            isDrink: false,
            drinkType: null,
          });
        } catch {
          failedCount++;
        }
      }
      qc.invalidateQueries({ queryKey: ['/api/planner/full'] });
      setSmartDialogOpen(false);
      setSmartResult(null);
      const desc = failedCount === 0
        ? `${smartResult.entries.length - failedCount} meals added to Week ${activeWeek}.${importedCount > 0 ? ` ${importedCount} recipes auto-imported.` : ''}`
        : `${smartResult.entries.length - failedCount} meals added. ${failedCount} could not be added.`;
      toast({ title: "Plan applied", description: desc });
    } catch {
      toast({ title: "Failed to apply plan", variant: "destructive" });
    } finally {
      setApplyingSmartPlan(false);
    }
  };

  const regenerateSingleEntry = async (targetEntry: SmartSuggestEntry) => {
    if (!smartResult) return;
    const targetKey = `${targetEntry.dayOfWeek}-${targetEntry.slot}`;
    const locked = smartResult.entries
      .filter(e => `${e.dayOfWeek}-${e.slot}` !== targetKey)
      .map(e => ({ dayOfWeek: e.dayOfWeek, slot: e.slot, candidateId: e.candidate.id, candidateName: e.candidate.name }));
    setSmartLoading(true);
    try {
      const res = await apiRequest('POST', '/api/meal-plans/smart-suggest', {
        mealsPerDay: Number(smartMealsPerDay) || 3,
        includeLeftovers: smartLeftovers,
        maxWeeklyBudget: smartBudget ? Number(smartBudget) : undefined,
        maxWeeklyUPF: smartMaxUPF ? Number(smartMaxUPF) : undefined,
        preferredCuisine: smartCuisine || undefined,
        fishPerWeek: Number(smartFishPerWeek),
        redMeatPerWeek: Number(smartRedMeatPerWeek),
        vegetarianDays: smartVegDays,
        lockedEntries: locked,
      });
      const data = await res.json() as SmartSuggestResult;
      const newEntry = data.entries.find(e => e.dayOfWeek === targetEntry.dayOfWeek && e.slot === targetEntry.slot);
      if (newEntry) {
        setSmartResult(prev => prev ? {
          ...prev,
          entries: prev.entries.map(e =>
            e.dayOfWeek === targetEntry.dayOfWeek && e.slot === targetEntry.slot ? newEntry : e
          ),
          stats: data.stats,
        } : null);
      }
    } catch {
      toast({ title: "Could not refresh this meal", variant: "destructive" });
    } finally {
      setSmartLoading(false);
    }
  };

  const addSlotToBasket = (mealType: string) => {
    const selections = collectMealSelections(sortedDays, mealType);
    if (selections.length === 0) {
      toast({ title: "No meals in this slot" });
      return;
    }
    addToBasketMutation.mutate(selections);
  };

  const addAllToBasket = () => {
    const selections = collectMealSelections(sortedDays);
    if (selections.length === 0) {
      toast({ title: "No meals planned this week" });
      return;
    }
    addToBasketMutation.mutate(selections);
  };

  const activeWeekData = fullPlanner.find((w) => w.weekNumber === Number(activeWeek));

  const sortedDays = activeWeekData?.days?.slice().sort((a, b) => {
    const aIdx = MONDAY_FIRST_ORDER.indexOf(a.dayOfWeek);
    const bIdx = MONDAY_FIRST_ORDER.indexOf(b.dayOfWeek);
    return aIdx - bIdx;
  }) || [];

  const expandedDay = expandedDayId != null
    ? fullPlanner.flatMap(w => w.days).find(d => d.id === expandedDayId) ?? null
    : null;

  const visibleRows = useMemo((): MatrixRow[] => {
    const rows: MatrixRow[] = [...BASE_MATRIX_ROWS];
    if (plannerSettings?.enableDrinks) {
      rows.push({ id: "drinks", label: "Drinks", mealType: undefined, audience: "adult", isDrink: true, addMealType: "snacks", icon: Wine, iconColor: "text-purple-400" });
    }
    if (plannerSettings?.enableChildMeals) {
      rows.push({ id: "child-breakfast", label: "Kids Breakfast", mealType: "breakfast", audience: "child", isDrink: false, addMealType: "breakfast", icon: PersonStanding, iconColor: "text-sky-500" });
      rows.push({ id: "child-lunch",     label: "Kids Lunch",     mealType: "lunch",     audience: "child", isDrink: false, addMealType: "lunch",     icon: PersonStanding, iconColor: "text-sky-500" });
      rows.push({ id: "child-dinner",    label: "Kids Dinner",    mealType: "dinner",    audience: "child", isDrink: false, addMealType: "dinner",    icon: PersonStanding, iconColor: "text-sky-500" });
    }
    if (plannerSettings?.enableBabyMeals) {
      rows.push({ id: "baby-breakfast", label: "Baby Breakfast", mealType: "breakfast", audience: "baby", isDrink: false, addMealType: "breakfast", icon: Baby, iconColor: "text-pink-500" });
      rows.push({ id: "baby-lunch",     label: "Baby Lunch",     mealType: "lunch",     audience: "baby", isDrink: false, addMealType: "lunch",     icon: Baby, iconColor: "text-pink-500" });
      rows.push({ id: "baby-dinner",    label: "Baby Dinner",    mealType: "dinner",    audience: "baby", isDrink: false, addMealType: "dinner",    icon: Baby, iconColor: "text-pink-500" });
    }
    return rows;
  }, [plannerSettings]);

  const weekStats = useMemo(() => {
    if (!sortedDays.length) return { filled: 0, total: sortedDays.length * MEAL_TYPES.length };
    let filled = 0;
    for (const day of sortedDays) {
      for (const slot of MEAL_TYPES) {
        if (findEntry(day.entries, slot.key, "adult")) filled++;
      }
    }
    return { filled, total: sortedDays.length * MEAL_TYPES.length };
  }, [sortedDays]);

  const selectedDay = useMemo(() => {
    if (selectedDayId) return sortedDays.find(d => d.id === selectedDayId) ?? sortedDays[0] ?? null;
    return sortedDays[0] ?? null;
  }, [selectedDayId, sortedDays]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full px-3 py-6">
      {/* ── Page Header ── */}
      <FirstVisitHint
        areaKey="planner"
        message="Plan your meals for the week ahead. Add meals to each day, use templates to get started fast, or tap Plan to get suggestions — then send the whole week to your basket."
      />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-6">
        <div className="flex-1 min-w-[160px]">
          <h1 className="text-[28px] font-semibold tracking-tight flex items-center gap-2" data-testid="text-weekly-planner-title">
            <CalendarDays className="h-6 w-6 text-primary" />
            Planner
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5" data-testid="text-week-progress">
            {weekStats.filled} meals planned out of {weekStats.total} this week
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {/* Week chooser - left of Plan My Week */}
          {renameWeekId === activeWeekData?.id ? (
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="h-8 text-sm border border-border rounded-md px-2.5 w-32 bg-background outline-none focus:ring-1 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && renameValue.trim()) {
                  renameMutation.mutate({ weekId: activeWeekData!.id, weekName: renameValue.trim() });
                }
                if (e.key === "Escape") setRenameWeekId(null);
              }}
              onBlur={() => {
                if (renameValue.trim() && renameValue.trim() !== activeWeekData?.weekName) {
                  renameMutation.mutate({ weekId: activeWeekData!.id, weekName: renameValue.trim() });
                } else {
                  setRenameWeekId(null);
                }
              }}
              data-testid="input-rename-week"
            />
          ) : (
            <Select value={activeWeek} onValueChange={setActiveWeek}>
              <SelectTrigger className="w-32 h-8 text-sm" data-testid="tabs-weeks">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fullPlanner
                  .slice()
                  .sort((a, b) => a.weekNumber - b.weekNumber)
                  .map((week) => (
                    <SelectItem key={week.id} value={String(week.weekNumber)} data-testid={`tab-week-${week.weekNumber}`}>
                      {week.weekName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
          {!renameWeekId && activeWeekData && (
            <button
              className="p-1.5 rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent/40 transition-colors"
              onClick={() => { setRenameWeekId(activeWeekData.id); setRenameValue(activeWeekData.weekName); }}
              title="Rename week"
              data-testid={`button-rename-week-${activeWeek}`}
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
          <div className="h-4 w-px bg-border" />
          <Button
            size="sm"
            className="px-2.5 text-xs"
            onClick={() => setSmartControlsOpen(!smartControlsOpen)}
            disabled={smartLoading}
            data-testid="button-plan-my-week"
          >
            {smartLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
            {smartLoading ? "Planning…" : "Plan"}
          </Button>
          <Button size="sm" variant="outline" className="px-2.5 text-xs" onClick={() => setCreateMealOpen(true)} data-testid="button-create-meal">
            <Utensils className="h-3 w-3 mr-1" />
            Create Meal
          </Button>
          <Button size="sm" className="px-2.5 text-xs" onClick={() => setTemplatesOpen(true)} data-testid="button-open-templates">
            <LayoutGrid className="h-3 w-3 mr-1" />
            Templates
          </Button>
          <Button size="sm" className="px-2.5 text-xs" onClick={addAllToBasket} disabled={addToBasketMutation.isPending} data-testid="button-add-all-basket">
            <ShoppingBasket className="h-3 w-3 mr-1" />
            {addToBasketMutation.isPending ? "…" : "+Week"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center justify-center h-11 w-11 rounded-lg transition-colors text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                title="More options"
                data-testid="button-planner-overflow-menu"
              >
                <img src={thaAppleSrc} alt="Menu" className="h-[60px] w-[60px] object-contain" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setSettingsOpen(true)} data-testid="button-planner-settings">
                <Settings className="h-4 w-4 mr-2" />
                Options
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBulkAssignOpen(true)} data-testid="button-bulk-assign">
                <Copy className="h-4 w-4 mr-2" />
                Bulk Assign
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSharePlanOpen(true)} data-testid="button-share-plan">
                <Share2 className="h-4 w-4 mr-2" />
                Share Plan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => activeWeekData && setClearWeekId(activeWeekData.id)}
                className="text-destructive focus:text-destructive"
                data-testid={`button-clear-week-${activeWeek}`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear This Week
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Week Content ── */}
      <Tabs value={activeWeek} onValueChange={setActiveWeek} className="w-full">

        <AnimatePresence>
          {smartControlsOpen && (
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
                    Plan My Week - Preferences
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
                        <SelectTrigger data-testid="select-meals-per-day"><SelectValue /></SelectTrigger>
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
                        <SelectTrigger data-testid="select-cuisine"><SelectValue placeholder="Any" /></SelectTrigger>
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
                          <SelectItem value="middle-eastern">Middle Eastern</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" />Weekly budget (£)</label>
                      <Input placeholder="e.g. 80" value={smartBudget} onChange={e => setSmartBudget(e.target.value)} data-testid="input-smart-budget" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3" />Max UPF %</label>
                      <Input placeholder="e.g. 30" value={smartMaxUPF} onChange={e => setSmartMaxUPF(e.target.value)} data-testid="input-smart-upf" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Fish className="h-3 w-3" />Fish meals/week</label>
                      <Select value={smartFishPerWeek} onValueChange={setSmartFishPerWeek}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[0,1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Beef className="h-3 w-3" />Red meat meals/week</label>
                      <Select value={smartRedMeatPerWeek} onValueChange={setSmartRedMeatPerWeek}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[0,1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                      <Switch id="smart-veg-days" checked={smartVegDays} onCheckedChange={(c) => setSmartVegDays(!!c)} data-testid="toggle-smart-veg" />
                      <label htmlFor="smart-veg-days" className="text-sm flex items-center gap-1 cursor-pointer"><Salad className="h-3.5 w-3.5 text-green-500" />Vegetarian days</label>
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                      <Switch id="smart-leftovers" checked={smartLeftovers} onCheckedChange={(c) => setSmartLeftovers(!!c)} data-testid="toggle-smart-leftovers" />
                      <label htmlFor="smart-leftovers" className="text-sm cursor-pointer">Include leftovers</label>
                    </div>
                  </div>
                  <Button onClick={() => runSmartSuggest()} disabled={smartLoading} data-testid="button-run-smart-suggest">
                    {smartLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {smartLoading ? "Planning your week..." : "Propose My Plan"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Phase 4: This week's household diet overrides ── */}
        {householdEaters.length > 0 && activeWeekId && (
          <div className="mb-4" data-testid="section-week-diets">
            <button
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
              onClick={() => setWeekDietsOpen(o => !o)}
              data-testid="button-toggle-week-diets"
            >
              <Users className="h-3.5 w-3.5" />
              <span>This week's household diets</span>
              {weekOverrides.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">{weekOverrides.length} override{weekOverrides.length !== 1 ? "s" : ""}</Badge>
              )}
              {weekDietsOpen ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
            </button>

            {weekDietsOpen && (
              <Card className="p-4 space-y-3" data-testid="card-week-diets">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Override a member's default diet for this week only. Hard restrictions are always kept.
                </p>
                {householdEaters.map(eater => {
                  const eaterId = Number(eater.id);
                  const override = weekOverrides.find(o => o.eaterId === eaterId);
                  const activeDiets: string[] = override ? override.dietTypes : eater.defaultDietTypes;
                  const isOverridden = !!override;

                  const toggle = (diet: string) => {
                    const next = activeDiets.includes(diet)
                      ? activeDiets.filter(d => d !== diet)
                      : [...activeDiets, diet];
                    setOverrideMutation.mutate({ eaterId, dietTypes: next });
                  };

                  return (
                    <div key={eater.id} className="space-y-1.5" data-testid={`row-week-diet-${eater.id}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{eater.displayName}</span>
                        {isOverridden && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-400">this week</Badge>
                        )}
                        {isOverridden && (
                          <button
                            className="text-[10px] text-muted-foreground hover:text-destructive ml-auto transition-colors"
                            onClick={() => deleteOverrideMutation.mutate(eaterId)}
                            disabled={deleteOverrideMutation.isPending}
                            data-testid={`button-reset-override-${eater.id}`}
                          >
                            Reset to default
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {ONBOARDING_DIET_OPTIONS.slice(0, 8).map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggle(opt.value)}
                            className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                              activeDiets.includes(opt.value)
                                ? isOverridden
                                  ? "bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-600"
                                  : "bg-primary/10 text-primary border-primary/40"
                                : "border-border text-muted-foreground hover:border-foreground/40"
                            }`}
                            data-testid={`chip-diet-${eater.id}-${opt.value}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </Card>
            )}
          </div>
        )}

        {fullPlanner.map((week) => (
          <TabsContent key={week.id} value={String(week.weekNumber)} className="mt-0">

            {/* ── Mobile: single-day view (hidden on sm+) ── */}
            <div className="sm:hidden mb-6">
              {/* Day navigation */}
              <div className="flex items-center justify-between mb-3">
                <button
                  className="p-1.5 rounded-md hover:bg-accent/40 disabled:opacity-30 transition-colors"
                  onClick={() => setMobileDayIndex(i => Math.max(0, i - 1))}
                  disabled={mobileDayIndex === 0}
                  data-testid="button-mobile-prev-day"
                  aria-label="Previous day"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-base font-semibold" data-testid="text-mobile-day-name">
                  {sortedDays[mobileDayIndex] ? DAY_NAMES[sortedDays[mobileDayIndex].dayOfWeek] : "-"}
                </span>
                <button
                  className="p-1.5 rounded-md hover:bg-accent/40 disabled:opacity-30 transition-colors"
                  onClick={() => setMobileDayIndex(i => Math.min(sortedDays.length - 1, i + 1))}
                  disabled={mobileDayIndex >= sortedDays.length - 1}
                  data-testid="button-mobile-next-day"
                  aria-label="Next day"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Meal rows for current mobile day */}
              {sortedDays[mobileDayIndex] && (() => {
                const mobileDay = sortedDays[mobileDayIndex];
                const isUpdating = upsertEntryMutation.isPending || addEntryMutation.isPending;
                return (
                  <Card className="overflow-hidden divide-y divide-border">
                    {visibleRows.map((row) => {
                      const RowIcon = row.icon;
                      const cellEntries = getCellEntries(mobileDay.entries, row);
                      return (
                        <div key={row.id} className="p-3 flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 mb-1">
                            <RowIcon className={`h-3.5 w-3.5 flex-shrink-0 ${row.iconColor}`} />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{row.label}</span>
                          </div>
                          {cellEntries.map((entry) => {
                            const meal = getMeal(entry.mealId);
                            if (!meal) return null;
                            const isFrozen = freezerMeals.some(f => f.mealId === meal.id && f.remainingPortions > 0);
                            return (
                              <button
                                key={entry.id}
                                className="w-full text-left text-sm text-foreground hover:text-primary transition-colors flex items-start gap-1.5"
                                onClick={() => setMealDetail({
                                  entry,
                                  meal,
                                  dayId: mobileDay.id,
                                  mealType: row.mealType ?? row.addMealType,
                                  audience: row.audience,
                                  isDrink: row.isDrink,
                                  dayName: DAY_NAMES[mobileDay.dayOfWeek],
                                  slotLabel: row.label,
                                })}
                                data-testid={`button-mobile-meal-${row.id}-${entry.id}`}
                              >
                                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                  <span className="leading-snug">{meal.name}</span>
                                  <NutritionVarietyDots score={computeMealVariety(meal.ingredients ?? [])} />
                                </div>
                                {isFrozen && <Snowflake className="h-3 w-3 text-blue-400 flex-shrink-0 mt-0.5" />}
                                {basketMealIdSet.has(meal.id) && <ShoppingCart className="h-3 w-3 text-emerald-500/70 flex-shrink-0 mt-0.5" />}
                              </button>
                            );
                          })}
                          <button
                            className="text-xs text-muted-foreground/50 hover:text-primary transition-colors flex items-center gap-1 mt-0.5"
                            onClick={() => openPicker({
                              dayId: mobileDay.id,
                              mealType: row.addMealType,
                              audience: row.audience,
                              isDrink: row.isDrink,
                            })}
                            disabled={isUpdating}
                            data-testid={`button-mobile-add-${row.id}`}
                          >
                            <Plus className="h-3 w-3" /> Add {row.label}
                          </button>
                        </div>
                      );
                    })}
                    {/* Add day to basket */}
                    <div className="p-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-8 text-xs"
                        onClick={() => addDayToBasket(mobileDay)}
                        disabled={addToBasketMutation.isPending}
                        data-testid="button-mobile-add-day-basket"
                      >
                        <ShoppingBasket className="h-3.5 w-3.5 mr-1.5" />
                        Add {DAY_NAMES[mobileDay.dayOfWeek]} to Basket
                      </Button>
                    </div>
                  </Card>
                );
              })()}
            </div>

            {/* ── Desktop Matrix Grid (hidden on mobile) ── */}
            <div className="hidden sm:block overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-6">
              <div style={{ minWidth: "960px" }}>
                <Card className="overflow-hidden">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "100px repeat(7, 1fr)",
                    }}
                  >
                    {/* ── Header row: corner + day names ── */}
                    <div className="bg-muted/40 border-b-2 border-border sticky left-0 z-20" style={{ backgroundColor: "hsl(var(--muted) / 0.4)" }} />
                    {sortedDays.map((day) => {
                      const isSelected = selectedDay?.id === day.id;
                      return (
                        <button
                          key={day.id}
                          className={`bg-muted/40 border-b-2 border-l border-border px-2 py-2.5 text-center transition-colors ${
                            isSelected ? "bg-primary/10" : "hover:bg-accent/30"
                          }`}
                          onClick={() => setSelectedDayId(day.id)}
                          data-testid={`button-day-header-${day.dayOfWeek}`}
                        >
                          <div className={`text-xs font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                            {DAY_NAMES[day.dayOfWeek]}
                          </div>
                        </button>
                      );
                    })}

                    {/* ── Meal rows ── */}
                    {visibleRows.map((row, rowIdx) => {
                      const isLastRow = rowIdx === visibleRows.length - 1;
                      const RowIcon = row.icon;
                      return (
                        <>
                          {/* Row label - sticky left */}
                          <div
                            key={row.id + "-label"}
                            className={`flex flex-col justify-center px-2 py-1.5 border-r border-border sticky left-0 z-10 group ${!isLastRow ? "border-b border-border" : ""}`}
                            style={{ backgroundColor: "hsl(var(--background))" }}
                          >
                            <div className="flex items-center gap-1">
                              <RowIcon className={`h-3 w-3 flex-shrink-0 ${row.iconColor}`} />
                              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{row.label}</span>
                            </div>
                            {row.mealType && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    className="mt-1 rounded transition-colors text-muted-foreground hover:text-foreground self-center"
                                    onClick={() => addSlotToBasket(row.mealType!)}
                                    disabled={addToBasketMutation.isPending}
                                    data-testid={`button-add-slot-${row.mealType}-basket`}
                                  >
                                    <ShoppingBasket className="h-5 w-5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="right"><p className="text-xs">Add {row.label}s to basket</p></TooltipContent>
                              </Tooltip>
                            )}
                          </div>

                          {/* Day cells for this row */}
                          {sortedDays.map((day, dayIdx) => {
                            const isLastCol = dayIdx === sortedDays.length - 1;
                            const cellEntries = getCellEntries(day.entries, row);
                            const isUpdating = upsertEntryMutation.isPending || addEntryMutation.isPending;

                            return (
                              <div
                                key={day.id + row.id}
                                className={`relative p-1.5 min-h-[56px] flex flex-col gap-0.5 border-l border-border ${!isLastRow ? "border-b border-border" : ""} ${!isLastCol ? "" : ""}`}
                                data-testid={`cell-${row.id}-${day.dayOfWeek}`}
                              >
                                {/* Meal name pills */}
                                {cellEntries.slice(0, 2).map((entry) => {
                                  const meal = getMeal(entry.mealId);
                                  if (!meal) return null;
                                  const isFrozen = freezerMeals.some(f => f.mealId === meal.id && f.remainingPortions > 0);
                                  return (
                                    <button
                                      key={entry.id}
                                      className="w-full text-left text-xs leading-snug text-foreground hover:text-primary transition-colors group flex items-start gap-0.5"
                                      onClick={() => setMealDetail({
                                        entry,
                                        meal,
                                        dayId: day.id,
                                        mealType: row.mealType ?? row.addMealType,
                                        audience: row.audience,
                                        isDrink: row.isDrink,
                                        dayName: DAY_NAMES[day.dayOfWeek],
                                        slotLabel: row.label,
                                      })}
                                      data-testid={`button-meal-${row.id}-${day.dayOfWeek}-${entry.id}`}
                                    >
                                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                        <span className="break-words leading-tight">{meal.name}</span>
                                        <NutritionVarietyDots score={computeMealVariety(meal.ingredients ?? [])} />
                                      </div>
                                      {isFrozen && <Snowflake className="h-2.5 w-2.5 text-blue-400 flex-shrink-0 mt-0.5" />}
                                      {basketMealIdSet.has(meal.id) && (
                                        <ShoppingCart className="h-2.5 w-2.5 text-emerald-500/70 flex-shrink-0 mt-0.5" data-testid={`icon-in-basket-${meal.id}`} />
                                      )}
                                    </button>
                                  );
                                })}
                                {/* Overflow indicator */}
                                {cellEntries.length > 2 && (
                                  <span className="text-[10px] text-muted-foreground">+{cellEntries.length - 2} more</span>
                                )}
                                {/* Add button */}
                                <button
                                  className="mt-auto text-muted-foreground/40 hover:text-primary transition-colors self-start leading-none"
                                  onClick={() => openPicker({
                                    dayId: day.id,
                                    mealType: row.addMealType,
                                    audience: row.audience,
                                    isDrink: row.isDrink,
                                  })}
                                  disabled={isUpdating}
                                  data-testid={`button-add-${row.id}-${day.dayOfWeek}`}
                                  title={`Add ${row.label}`}
                                >
                                  <Plus className="h-3 w-3" />
                                </button>

                                {/* Expand day button (top-right, subtle) */}
                                {row.id === "breakfast" && (
                                  <button
                                    className="absolute top-1 right-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
                                    onClick={() => { setExpandedDayId(day.id); setExpandedDayLabel(DAY_NAMES[day.dayOfWeek]); }}
                                    title="Expand day"
                                    data-testid={`button-expand-day-${day.dayOfWeek}`}
                                  >
                                    <LayoutList className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </>
                      );
                    })}

                    {/* ── Summary row - same grid, aligned under day columns ── */}
                    {sortedDays.length > 0 && (
                      <>
                        {/* Summary label cell - sticky left */}
                        <div
                          className="flex items-center gap-1.5 px-2 py-2.5 border-t-2 border-border sticky left-0 z-10"
                          style={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}
                          data-testid="weekly-summary-strip"
                        >
                          <span className="text-xs font-medium text-muted-foreground">Summary</span>
                        </div>

                        {/* Per-day summary cells */}
                        {sortedDays.map((day) => {
                          const dayCalories = day.entries.reduce(
                            (sum, e) => sum + (nutritionMap.get(e.mealId) || 0),
                            0
                          );
                          const dayMealCount = day.entries.length;
                          return (
                            <div
                              key={day.id}
                              className="bg-muted/30 border-t-2 border-l border-border px-2 py-2.5 text-center"
                              data-testid={`summary-day-${day.dayOfWeek}`}
                            >
                              {dayCalories > 0 ? (
                                <div className="flex items-center justify-center gap-0.5 mb-0.5">
                                  <Flame className="h-2.5 w-2.5 text-orange-400 flex-shrink-0" />
                                  <span
                                    className="text-xs font-medium text-foreground"
                                    data-testid={`text-summary-cal-${day.dayOfWeek}`}
                                  >
                                    {dayCalories >= 1000
                                      ? `${(dayCalories / 1000).toFixed(1)}k`
                                      : dayCalories}
                                  </span>
                                </div>
                              ) : (
                                <div className="h-4" />
                              )}
                              <p className="text-[10px] text-muted-foreground/60">
                                {dayMealCount > 0
                                  ? `${dayMealCount} meal${dayMealCount !== 1 ? 's' : ''}`
                                  : '-'}
                              </p>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </Card>
              </div>
            </div>

            <PlannerVarietyLegend />

          </TabsContent>
        ))}
      </Tabs>

      {/* ── Day View Drawer ── */}
      <DayViewDrawer
        open={!!expandedDay}
        onClose={() => setExpandedDayId(null)}
        day={expandedDay}
        dayLabel={expandedDayLabel}
        getMeal={getMeal}
        allMeals={meals}
        onPlannerInvalidate={() => qc.invalidateQueries({ queryKey: ["/api/planner/full"] })}
      />

      {/* ── Create Meal Modal (Epic 1) ── */}
      <CreateMealModal
        open={createMealOpen}
        onOpenChange={setCreateMealOpen}
        onCreated={() => qc.invalidateQueries({ queryKey: ["/api/meals"] })}
      />

      {/* ── Meal Detail Modal ── */}
      <Dialog open={!!mealDetail} onOpenChange={(v) => { if (!v) { setMealDetail(null); setAdaptationOpen(false); adaptMutation.reset(); setAddGuestOpen(false); setGuestName(""); setGuestDietTypes([]); setGuestRestrictions([]); } }}>
        <DialogContent
          className="max-w-[640px] max-h-[82vh] overflow-y-auto bg-[hsl(var(--background))] border-border p-0"
          style={{ backdropFilter: "none", WebkitBackdropFilter: "none" }}
          data-testid="dialog-meal-detail"
        >
          {mealDetail && (() => {
            const { meal, entry, dayId, mealType, audience, isDrink, dayName, slotLabel } = mealDetail;
            const calories = nutritionMap.get(meal.id);
            const isFrozen = freezerMeals.some(f => f.mealId === meal.id && f.remainingPortions > 0);
            const instructions = meal.instructions || [];

            return (
              <div className="flex flex-col">
                {/* Visually hidden title for screen readers */}
                <DialogTitle className="sr-only">{meal.name}</DialogTitle>
                {/* Image hero */}
                {meal.imageUrl ? (
                  <div className="relative w-full h-44 flex-shrink-0">
                    <img
                      src={meal.imageUrl}
                      alt={meal.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                ) : (
                  <div className="w-full h-28 bg-muted/60 flex items-center justify-center flex-shrink-0">
                    <ChefHat className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                )}

                {/* Content */}
                <div className="px-6 py-4 space-y-4">
                  {/* Context + title */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{dayName} · {slotLabel}</p>
                    <h2 className="text-xl font-semibold leading-tight text-foreground" data-testid="text-meal-detail-name">
                      {meal.name}
                    </h2>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {meal.servings > 1 && (
                      <Badge variant="outline" className="text-xs">{meal.servings} servings</Badge>
                    )}
                    {meal.isReadyMeal && (
                      <Badge variant="outline" className="text-xs">
                        <UtensilsCrossed className="h-3 w-3 mr-1" />Ready Meal
                      </Badge>
                    )}
                    {isFrozen && (
                      <Badge variant="outline" className="text-xs border-blue-400/40 text-blue-500">
                        <Snowflake className="h-3 w-3 mr-1" />In Freezer
                      </Badge>
                    )}
                    {meal.audience === "baby" && (
                      <Badge variant="outline" className="text-xs border-pink-400/60 text-pink-500">
                        <Baby className="h-3 w-3 mr-1" />Baby
                      </Badge>
                    )}
                    {meal.audience === "child" && (
                      <Badge variant="outline" className="text-xs border-sky-400/60 text-sky-500">
                        <PersonStanding className="h-3 w-3 mr-1" />Child
                      </Badge>
                    )}
                    {calories != null && calories > 0 && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Flame className="h-3 w-3 text-orange-400" />
                        {calories} kcal
                      </Badge>
                    )}
                  </div>

                  {/* Eater selector */}
                  {householdEaters.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 text-foreground">Who's eating this?</h3>
                      <div className="flex flex-col gap-1.5">
                        {householdEaters.map((eater) => {
                          const checked = entryEaters.some(e => e.id === eater.id);
                          return (
                            <label
                              key={eater.id}
                              className="flex items-center gap-2 text-sm cursor-pointer select-none"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(next) => {
                                  const currentIds = entryEaters.map(e => Number(e.id));
                                  const eaterId = Number(eater.id);
                                  const newIds = next
                                    ? [...currentIds, eaterId]
                                    : currentIds.filter(id => id !== eaterId);
                                  setEntryEatersMutation.mutate({ entryId: entry.id, eaterIds: newIds });
                                }}
                              />
                              <span className="text-foreground/90">{eater.displayName}</span>
                              {eater.kind === "child" && (
                                <span className="text-[10px] text-muted-foreground">(child)</span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Guest eaters (Phase 5) ── */}
                  {householdEaters.length > 0 && (
                    <div data-testid="section-guests">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Guests</span>
                        <button
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                          onClick={() => setAddGuestOpen(o => !o)}
                          data-testid="button-add-guest"
                        >
                          <Plus className="h-3 w-3" />
                          Add guest
                        </button>
                      </div>

                      {/* Inline add-guest form */}
                      {addGuestOpen && (
                        <div className="border border-border rounded-md p-2.5 space-y-2 mb-2 bg-muted/20" data-testid="form-add-guest">
                          <Input
                            placeholder="Guest name"
                            value={guestName}
                            onChange={e => setGuestName(e.target.value)}
                            className="h-7 text-xs"
                            data-testid="input-guest-name"
                          />
                          {/* Diet pattern chips */}
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1">Diet pattern (optional)</p>
                            <div className="flex flex-wrap gap-1">
                              {DIET_PATTERN_OPTIONS.map(opt => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setGuestDietTypes(prev => prev.includes(opt.value) ? prev.filter(d => d !== opt.value) : [...prev, opt.value])}
                                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                                    guestDietTypes.includes(opt.value)
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "border-border text-muted-foreground hover:border-foreground/40"
                                  }`}
                                  data-testid={`chip-guest-diet-${opt.value}`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          {/* Allergy & intolerance chips */}
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1">Allergies &amp; intolerances (optional)</p>
                            <div className="flex flex-wrap gap-1">
                              {ALLERGY_INTOLERANCE_OPTIONS.map(opt => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setGuestRestrictions(prev => prev.includes(opt.value) ? prev.filter(r => r !== opt.value) : [...prev, opt.value])}
                                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                                    guestRestrictions.includes(opt.value)
                                      ? "bg-destructive text-destructive-foreground border-destructive"
                                      : "border-border text-muted-foreground hover:border-foreground/40"
                                  }`}
                                  data-testid={`chip-guest-restriction-${opt.value}`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setAddGuestOpen(false); setGuestName(""); setGuestDietTypes([]); setGuestRestrictions([]); }}>
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              disabled={!guestName.trim() || addGuestMutation.isPending}
                              onClick={() => {
                                if (!guestName.trim()) return;
                                addGuestMutation.mutate({
                                  id: crypto.randomUUID(),
                                  displayName: guestName.trim(),
                                  dietTypes: guestDietTypes,
                                  hardRestrictions: guestRestrictions,
                                });
                              }}
                              data-testid="button-save-guest"
                            >
                              {addGuestMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Guest list */}
                      {entryGuests.length > 0 && (
                        <div className="space-y-1" data-testid="guest-list">
                          {entryGuests.map(guest => (
                            <div key={guest.id} className="flex items-center justify-between text-sm" data-testid={`guest-row-${guest.id}`}>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-foreground/90 truncate">{guest.displayName}</span>
                                <span className="text-[10px] text-muted-foreground shrink-0">(guest)</span>
                                {guest.hardRestrictions.length > 0 && (
                                  <span className="text-[10px] text-destructive/70 truncate">
                                    ⚠ {guest.hardRestrictions.join(", ")}
                                  </span>
                                )}
                              </div>
                              <button
                                className="text-muted-foreground hover:text-destructive ml-2 shrink-0 transition-colors"
                                onClick={() => removeGuestMutation.mutate(guest.id)}
                                disabled={removeGuestMutation.isPending}
                                data-testid={`button-remove-guest-${guest.id}`}
                                aria-label={`Remove ${guest.displayName}`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {entryGuests.length === 0 && !addGuestOpen && (
                        <p className="text-xs text-muted-foreground">No guests for this meal.</p>
                      )}
                    </div>
                  )}

                  {/* Tailor for household (Phase 3) */}
                  {(householdEaters.length > 1 || entryGuests.length > 0) && (
                    <div className="border border-border rounded-lg overflow-hidden">
                      {/* Header row — always visible */}
                      <div className="flex items-center justify-between px-3 py-2 bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">Tailor for household</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Re-run / run button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            disabled={adaptMutation.isPending}
                            onClick={() => adaptMutation.mutate(entry.id)}
                            data-testid="button-adapt"
                          >
                            {adaptMutation.isPending ? (
                              <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Tailoring…</>
                            ) : (entry.adaptationResult || adaptMutation.data) ? (
                              <><RefreshCw className="h-3 w-3 mr-1" />Re-tailor</>
                            ) : (
                              <><Wand2 className="h-3 w-3 mr-1" />Tailor</>
                            )}
                          </Button>
                          {/* Collapse toggle — shown only when result exists */}
                          {(entry.adaptationResult || adaptMutation.data) && !adaptMutation.isPending && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => setAdaptationOpen(o => !o)}
                            >
                              {adaptationOpen
                                ? <ChevronUp className="h-3.5 w-3.5" />
                                : <ChevronDown className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Result body — collapsed by default */}
                      {(() => {
                        const result: AdaptationResult | null | undefined =
                          adaptMutation.data ?? (entry.adaptationResult as AdaptationResult | null);
                        if (!result || !adaptationOpen || adaptMutation.isPending) return null;
                        return (
                          <div className="px-3 py-3 space-y-3 border-t border-border bg-background">
                            {/* Base meal note */}
                            {result.baseMealNote && (
                              <p className="text-xs text-muted-foreground italic">{result.baseMealNote}</p>
                            )}
                            {/* Per-eater adaptations */}
                            <ul className="space-y-1.5">
                              {result.adaptations.map((a, i) => (
                                <li key={i} className="text-sm flex items-start gap-2">
                                  <span className="shrink-0 font-medium text-foreground min-w-[80px]">
                                    {a.eaterName}
                                  </span>
                                  <span className="text-foreground/80">
                                    {a.changeType === "none" ? (
                                      <span className="text-muted-foreground">as normal</span>
                                    ) : (
                                      <>
                                        {a.note}
                                        {a.extraIngredients.length > 0 && (
                                          <span className="text-muted-foreground">
                                            {" "}(needs: {a.extraIngredients.join(", ")})
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </span>
                                </li>
                              ))}
                            </ul>
                            {/* Extra ingredients summary */}
                            {result.householdExtraIngredients.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Extra to buy:</span>{" "}
                                {result.householdExtraIngredients.join(", ")}
                              </p>
                            )}
                            {/* Cooking note */}
                            {result.cookingNote && (
                              <p className="text-xs text-foreground/70 bg-muted/30 rounded px-2 py-1.5">
                                {result.cookingNote}
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Variety nudge */}
                  <MealVarietyNudge
                    score={computeMealVariety(meal.ingredients ?? [])}
                    pantryItems={pantryNames}
                  />

                  {/* Two-column layout: Ingredients + Instructions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Ingredients */}
                    {meal.ingredients && meal.ingredients.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2 text-foreground">Ingredients</h3>
                        <ul className="space-y-1.5">
                          {meal.ingredients.map((ing, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2 text-foreground/80">
                              <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                              {ing}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Instructions */}
                    {instructions.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2 text-foreground">Instructions</h3>
                        <ol className="space-y-2">
                          {instructions.map((step, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2 text-foreground/80">
                              <span className="shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold flex items-center justify-center mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Source URL — only for recipe-sourced meals, not shop-bought */}
                    {meal.sourceUrl && !meal.isReadyMeal && (
                      <div className="sm:col-span-2">
                        <a
                          href={meal.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          data-testid="link-meal-source"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View original recipe
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-border flex-wrap bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => {
                        deleteEntryMutation.mutate(entry.id);
                        setMealDetail(null);
                      }}
                      disabled={deleteEntryMutation.isPending}
                      data-testid="button-meal-detail-remove"
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" />
                      Remove
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setMealDetail(null);
                        openPicker({ dayId, mealType, audience, isDrink });
                      }}
                      data-testid="button-meal-detail-replace"
                    >
                      Replace
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    {meal.isReadyMeal ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMealDetail(null);
                          const query = meal.brand
                            ? `${meal.brand} ${meal.name.replace(`${meal.brand} – `, "")}`
                            : meal.name;
                          navigate(`/products?q=${encodeURIComponent(query)}`);
                        }}
                        data-testid="button-meal-detail-analyse"
                      >
                        <Search className="h-3.5 w-3.5 mr-1.5" />
                        Analyse Product
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMealDetail(null);
                          navigate(`/meals/${meal.id}`);
                        }}
                        data-testid="button-meal-detail-edit"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Edit Recipe
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => setMealDetail(null)}
                      data-testid="button-meal-detail-close"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Meal Picker Dialog ── */}
      <Dialog
        open={mealPickerOpen}
        onOpenChange={(open) => {
          setMealPickerOpen(open);
          if (!open) {
            setProductQuery("");
            setProductResults([]);
            setProductRetailer("");
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col gap-0 overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {pickerTarget?.isDrink ? "Choose a Drink" :
               pickerTarget?.audience === "baby" ? "Choose a Baby Meal" :
               pickerTarget?.audience === "child" ? "Choose a Child Meal" :
               `Choose a ${MEAL_TYPES.find(s => s.key === pickerTarget?.mealType)?.label || "Meal"}`}
            </DialogTitle>
          </DialogHeader>

          {/* ── Filter tabs ── */}
          <div className="flex gap-1 flex-wrap pt-2 flex-shrink-0">
            {(["all", "cookbook", "planner", "ready", "product"] as const).map((f) => (
              <Button
                key={f}
                variant={mealFilter === f ? "default" : "outline"}
                size="sm"
                className={f === "product" ? "gap-1" : ""}
                onClick={() => setMealFilter(f)}
                data-testid={`button-filter-${f}`}
              >
                {f === "product" && <Package className="h-3 w-3" />}
                {f === "all" ? "All" : f === "cookbook" ? "Cookbook" : f === "planner" ? "From Planner" : f === "ready" ? "Ready Meals" : "Shop-bought"}
              </Button>
            ))}
          </div>

          {/* ── Recipe search (non-product tabs) ── */}
          {mealFilter !== "product" && (
            <div className="pt-2 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search meals..."
                  value={mealSearch}
                  onChange={(e) => setMealSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-meal-search"
                />
              </div>
            </div>
          )}

          {/* ── Product search (Shop-bought tab) ── */}
          {mealFilter === "product" && (
            <div className="pt-2 space-y-2 flex-shrink-0">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g. oven chips, tomato soup, granola…"
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchProducts()}
                    className="pl-9"
                    data-testid="input-product-query"
                  />
                </div>
                <Button
                  size="icon"
                  onClick={searchProducts}
                  disabled={productSearching || !productQuery.trim()}
                  data-testid="button-product-search"
                >
                  {productSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              {/* Retailer chips */}
              <div className="flex gap-1 flex-wrap items-center">
                <span className="text-[10px] text-muted-foreground/60 shrink-0">Shop:</span>
                {["Tesco", "Sainsbury's", "Asda", "Morrisons", "Aldi", "Lidl", "Waitrose", "M&S"].map((shop) => (
                  <button
                    key={shop}
                    onClick={() => setProductRetailer(productRetailer === shop ? "" : shop)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                      productRetailer === shop
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-muted-foreground hover:border-primary/40"
                    }`}
                    data-testid={`button-picker-retailer-${shop.toLowerCase().replace(/['\s]+/g, "-")}`}
                  >
                    {shop}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Meals list (non-product tabs) ── */}
          {mealFilter !== "product" && (
            <div className="flex-1 overflow-y-auto mt-2 space-y-1 min-h-0">
              {filteredMeals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No meals found</p>
              ) : (
                filteredMeals.map((meal) => (
                  <button
                    key={meal.id}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover-elevate text-left"
                    onClick={() => selectMeal(meal.id)}
                    data-testid={`button-select-meal-${meal.id}`}
                  >
                    {meal.isReadyMeal ? (
                      <div className="h-10 w-10 rounded-md bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <UtensilsCrossed className="h-5 w-5 text-green-500/40" />
                      </div>
                    ) : meal.imageUrl ? (
                      <img src={meal.imageUrl} alt={meal.name} className="h-10 w-10 rounded-md object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <ChefHat className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{meal.name}</p>
                      <div className="flex items-center gap-1.5">
                        {meal.isReadyMeal && <Badge variant="outline" className="text-xs">Ready Meal</Badge>}
                        {meal.audience === "baby" && (
                          <Badge variant="outline" className="text-xs border-pink-400/60 text-pink-500">
                            <Baby className="h-3 w-3 mr-0.5" /> Baby
                          </Badge>
                        )}
                        {meal.audience === "child" && (
                          <Badge variant="outline" className="text-xs border-sky-400/60 text-sky-500">
                            <PersonStanding className="h-3 w-3 mr-0.5" /> Child
                          </Badge>
                        )}
                        {meal.isDrink && (
                          <Badge variant="outline" className="text-xs border-purple-400/60 text-purple-500">
                            <Wine className="h-3 w-3 mr-0.5" /> Drink
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* ── Product results (Shop-bought tab) ── */}
          {mealFilter === "product" && (
            <div className="flex-1 overflow-y-auto mt-2 space-y-1 min-h-0">
              {!productSearching && productResults.length === 0 && !productQuery.trim() && (
                <div className="text-center py-10 text-muted-foreground">
                  <Store className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">Search for a shop-bought product</p>
                  <p className="text-xs mt-1 text-muted-foreground/70">Try: oven chips, baked beans, Greek yoghurt</p>
                </div>
              )}
              {productSearching && (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {!productSearching && productResults.length === 0 && productQuery.trim() && (
                <p className="text-center text-muted-foreground py-8 text-sm">No products found — try a different term</p>
              )}
              {!productSearching && productResults.map((product, i) => {
                const stores = [
                  ...(product.confirmedStores ?? []),
                  ...(product.inferredStores ?? []),
                ];
                const displayName = product.brand
                  ? `${product.brand} – ${product.product_name}`
                  : product.product_name;
                const analyserQuery = product.brand
                  ? `${product.brand} ${product.product_name}`
                  : product.product_name;
                const analyserUrl = `/products?q=${encodeURIComponent(analyserQuery)}${productRetailer ? `&shop=${encodeURIComponent(productRetailer)}` : ""}`;
                return (
                  <div
                    key={`${product.barcode ?? product.product_name}-${i}`}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/40 group"
                  >
                    <button
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      onClick={() => addProductToPlanner(product)}
                      data-testid={`button-select-product-${i}`}
                    >
                      {product.image_url ? (
                        <img src={product.image_url} alt={displayName} className="h-10 w-10 rounded-md object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                          <Package className="h-5 w-5 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{displayName}</p>
                        <div className="flex items-center gap-1 flex-wrap">
                          {stores.slice(0, 3).map(s => (
                            <span key={s} className="text-[10px] text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                    {/* Analyse link — opens Analyser with this product pre-searched */}
                    <a
                      href={analyserUrl}
                      onClick={(e) => { e.stopPropagation(); setMealPickerOpen(false); }}
                      className="shrink-0 p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Analyse in Analyser"
                      data-testid={`link-analyse-product-${i}`}
                    >
                      <Microscope className="h-3.5 w-3.5" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Bulk Assign Dialog ── */}
      <Dialog open={bulkAssignOpen} onOpenChange={(v) => { if (!v) resetBulkAssign(); }}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col gap-0 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Bulk Assign Meal
            </DialogTitle>
            <p className="text-xs text-muted-foreground">Pick a meal and assign it to multiple weeks, days, and meal slots at once.</p>
          </DialogHeader>

          {bulkStep === 1 ? (
            <>
              <div className="space-y-3 flex-shrink-0 pt-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search meals..." value={bulkMealSearch} onChange={(e) => setBulkMealSearch(e.target.value)} className="pl-9" data-testid="input-bulk-meal-search" />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(["all", "cookbook", "planner", "ready"] as const).map((f) => (
                    <Button key={f} variant={bulkMealFilter === f ? "default" : "outline"} size="sm" onClick={() => setBulkMealFilter(f)} data-testid={`button-bulk-filter-${f}`}>
                      {f === "all" ? "All" : f === "cookbook" ? "Cookbook" : f === "planner" ? "From Planner" : "Ready Meals"}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto mt-2 space-y-1 min-h-0">
                {bulkFilteredMeals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No meals found</p>
                ) : (
                  bulkFilteredMeals.map((meal) => (
                    <button key={meal.id} className="w-full flex items-center gap-3 p-2 rounded-md hover-elevate text-left" onClick={() => { setBulkMeal(meal); setBulkStep(2); }} data-testid={`button-bulk-select-meal-${meal.id}`}>
                      {meal.isReadyMeal ? (
                        <div className="h-10 w-10 rounded-md bg-green-500/10 flex items-center justify-center flex-shrink-0">
                          <UtensilsCrossed className="h-5 w-5 text-green-500/40" />
                        </div>
                      ) : meal.imageUrl ? (
                        <img src={meal.imageUrl} alt={meal.name} className="h-10 w-10 rounded-md object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                          <ChefHat className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{meal.name}</p>
                        {meal.isReadyMeal && <Badge variant="outline" className="text-xs">Ready Meal</Badge>}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                {bulkMeal?.imageUrl ? (
                  <img src={bulkMeal.imageUrl} alt={bulkMeal.name} className="h-10 w-10 rounded-md object-cover flex-shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    <ChefHat className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{bulkMeal?.name}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setBulkStep(1)} data-testid="button-bulk-change-meal">Change</Button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Weeks</label>
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => {
                    if (bulkWeeks.size === fullPlanner.length) setBulkWeeks(new Set());
                    else setBulkWeeks(new Set(fullPlanner.map(w => w.id)));
                  }} data-testid="button-bulk-toggle-all-weeks">
                    {bulkWeeks.size === fullPlanner.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {fullPlanner.slice().sort((a, b) => a.weekNumber - b.weekNumber).map((week) => (
                    <label key={week.id} className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover-elevate" data-testid={`label-bulk-week-${week.weekNumber}`}>
                      <Checkbox checked={bulkWeeks.has(week.id)} onCheckedChange={(checked) => {
                        setBulkWeeks(prev => { const next = new Set(prev); checked ? next.add(week.id) : next.delete(week.id); return next; });
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
                    if (bulkDays.size === 7) setBulkDays(new Set());
                    else setBulkDays(new Set(MONDAY_FIRST_ORDER));
                  }} data-testid="button-bulk-toggle-all-days">
                    {bulkDays.size === 7 ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {MONDAY_FIRST_ORDER.map((dayIdx) => (
                    <label key={dayIdx} className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover-elevate" data-testid={`label-bulk-day-${dayIdx}`}>
                      <Checkbox checked={bulkDays.has(dayIdx)} onCheckedChange={(checked) => {
                        setBulkDays(prev => { const next = new Set(prev); checked ? next.add(dayIdx) : next.delete(dayIdx); return next; });
                      }} />
                      <span className="text-xs">{DAY_SHORT[dayIdx]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Meal Slots</label>
                <div className="grid grid-cols-2 gap-2">
                  {MEAL_TYPES.map((slot) => {
                    const SlotIcon = slot.icon;
                    return (
                      <label key={slot.key} className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover-elevate" data-testid={`label-bulk-slot-${slot.key}`}>
                        <Checkbox checked={bulkSlots.has(slot.key)} onCheckedChange={(checked) => {
                          setBulkSlots(prev => { const next = new Set(prev); checked ? next.add(slot.key) : next.delete(slot.key); return next; });
                        }} />
                        <SlotIcon className={`h-3.5 w-3.5 ${slot.color}`} />
                        <span className="text-xs">{slot.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {bulkAssignments.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    {bulkAssignments.length} slot{bulkAssignments.length !== 1 ? 's' : ''} will be assigned
                  </label>
                  <div className="rounded-md border border-border max-h-32 overflow-y-auto divide-y divide-border">
                    {bulkAssignments.map((a, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-1.5 text-xs">
                        <span className="text-muted-foreground">{a.weekName}</span>
                        <span>{a.dayName} - {a.slotLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {bulkStep === 2 && (
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={resetBulkAssign}>Cancel</Button>
              <Button disabled={bulkAssignments.length === 0 || bulkAssignMutation.isPending} onClick={() => bulkAssignMutation.mutate()} data-testid="button-bulk-assign-confirm">
                {bulkAssignMutation.isPending ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Assigning...</> : `Assign to ${bulkAssignments.length} slot${bulkAssignments.length !== 1 ? 's' : ''}`}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Planner Settings Dialog ── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-planner-settings">
          <DialogHeader>
            <DialogTitle>Planner Options</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-sm font-medium" data-testid="label-enable-baby-meals">Baby Meals</span>
                <p className="text-xs text-muted-foreground">Enable baby meal row in planner</p>
              </div>
              <Switch
                checked={plannerSettings?.enableBabyMeals ?? false}
                onCheckedChange={(v) => toggleSetting("enableBabyMeals", v)}
                disabled={updateSettingsMutation.isPending}
                data-testid="switch-enable-baby-meals"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-sm font-medium" data-testid="label-enable-child-meals">Child Meals</span>
                <p className="text-xs text-muted-foreground">Enable kids meal row in planner</p>
              </div>
              <Switch
                checked={plannerSettings?.enableChildMeals ?? false}
                onCheckedChange={(v) => toggleSetting("enableChildMeals", v)}
                disabled={updateSettingsMutation.isPending}
                data-testid="switch-enable-child-meals"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-sm font-medium" data-testid="label-enable-drinks">Drinks</span>
                <p className="text-xs text-muted-foreground">Enable drinks row in planner</p>
              </div>
              <Switch
                checked={plannerSettings?.enableDrinks ?? false}
                onCheckedChange={(v) => toggleSetting("enableDrinks", v)}
                disabled={updateSettingsMutation.isPending}
                data-testid="switch-enable-drinks"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TemplatesPanel open={templatesOpen} onClose={() => setTemplatesOpen(false)} user={user} />
      <Dialog open={clearWeekId !== null} onOpenChange={(v) => { if (!v) setClearWeekId(null); }}>
        <DialogContent className="max-w-sm" data-testid="dialog-clear-week">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" />
              Clear This Week
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">All scheduled meals for this week will be removed. Recipes, templates, and other weeks are not affected.</p>
          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setClearWeekId(null)} data-testid="button-clear-week-cancel">Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={clearWeekMutation.isPending}
              onClick={() => clearWeekId !== null && clearWeekMutation.mutate(clearWeekId)}
              data-testid="button-clear-week-confirm"
            >
              {clearWeekMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
              Clear Week
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SharePlanDialog open={sharePlanOpen} onOpenChange={setSharePlanOpen} />

      <Dialog open={smartDialogOpen} onOpenChange={(v) => { if (!v) setSmartDialogOpen(false); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-smart-suggest">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Your Proposed Week Plan
            </DialogTitle>
            <DialogDescription>
              Review the proposed plan. Lock meals you like, then regenerate or apply.
            </DialogDescription>
          </DialogHeader>

          {smartResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg border bg-muted/30 px-3 py-2 text-center">
                  <p className="text-xs text-muted-foreground">Total meals</p>
                  <p className="text-lg font-semibold">{smartResult.stats.totalMeals}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 px-3 py-2 text-center">
                  <p className="text-xs text-muted-foreground">Est. cost</p>
                  <p className="text-lg font-semibold">£{(smartResult.stats.estimatedWeeklyCost ?? 0).toFixed(0)}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 px-3 py-2 text-center">
                  <p className="text-xs text-muted-foreground">Avg UPF</p>
                  <p className={`text-lg font-semibold ${getUPFColor(smartResult.stats.averageUPFScore)}`}>{getUPFLabel(smartResult.stats.averageUPFScore)}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 px-3 py-2 text-center">
                  <p className="text-xs text-muted-foreground">Ingredient reuse</p>
                  <p className="text-lg font-semibold">{smartResult.stats.ingredientReuse ?? 0}</p>
                </div>
              </div>

              <div className="space-y-2">
                {(() => {
                  const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
                  const grouped: Record<number, SmartSuggestEntry[]> = {};
                  for (const e of smartResult.entries) {
                    if (!grouped[e.dayOfWeek]) grouped[e.dayOfWeek] = [];
                    grouped[e.dayOfWeek].push(e);
                  }
                  return Object.entries(grouped).sort(([a],[b]) => Number(a)-Number(b)).map(([dow, entries]) => (
                    <div key={dow} className="rounded-lg border">
                      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-t-lg border-b">
                        <span className="text-sm font-medium">{dayNames[Number(dow)]}</span>
                      </div>
                      <div className="divide-y">
                        {entries.map((entry) => {
                          const key = `${entry.dayOfWeek}-${entry.slot}`;
                          const exKey = `${key}-expl`;
                          const internalMealId = !entry.candidate.isExternal ? Number(entry.candidate.id) : null;
                          return (
                            <SmartMealEntryCard
                              key={key}
                              entry={entry}
                              meal={internalMealId ? mealById.get(internalMealId) : undefined}
                              nutrition={internalMealId ? smartNutritionMap.get(internalMealId) : undefined}
                              nutritionLoading={nutritionLoading}
                              locked={lockedEntries.has(key)}
                              expanded={expandedExplanation === exKey}
                              smartLoading={smartLoading}
                              onLock={() => toggleLockEntry(key)}
                              onRefresh={() => regenerateSingleEntry(entry)}
                              onExpandExplain={() => setExpandedExplanation(expandedExplanation === exKey ? null : exKey)}
                              onNutritionRefresh={() => setNutritionFetchTick(t => t + 1)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {lockedEntries.size > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3 text-primary" />{lockedEntries.size} meal{lockedEntries.size !== 1 ? "s" : ""} locked - they'll be kept when you regenerate.
                </p>
              )}
            </div>
          )}

          <DialogFooter className="mt-4 flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setSmartDialogOpen(false)} data-testid="button-smart-cancel">Cancel</Button>
            <Button variant="outline" size="sm" onClick={() => runSmartSuggest(true)} disabled={smartLoading} data-testid="button-smart-regenerate">
              {smartLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
              Regenerate
            </Button>
            <Button size="sm" onClick={applySmartSuggestion} disabled={applyingSmartPlan} data-testid="button-smart-apply">
              {applyingSmartPlan ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
              Apply to Week {activeWeek}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
