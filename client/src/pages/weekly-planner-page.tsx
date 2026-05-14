import React, { useState, useMemo, useRef } from "react";
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
import { X, Plus, Coffee, Sun, Moon, Cookie, Search, Loader2, ChefHat, ShoppingBasket, Copy, Calendar, CalendarDays, UtensilsCrossed, Snowflake, Settings, Baby, PersonStanding, Wine, LayoutGrid, Share2, LayoutList, Flame, Pencil, ExternalLink, AlertTriangle, ShoppingCart, ChevronLeft, ChevronRight, Trash2, Sparkles, Lock, DollarSign, Shield, Fish, Beef, Salad, HelpCircle, ChevronDown, ChevronUp, RefreshCw, Microscope, Wheat, Droplets, Droplet, Globe, Utensils, Package, Store, Users, Wand2, Camera, BookOpen, MoreHorizontal } from "lucide-react";
import { CreateMealModal } from "@/components/create-meal-modal";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePlannerContext } from "@/contexts/PlannerContext";
import { PlannerWorkspaceContext } from "@/contexts/PlannerWorkspaceContext";
import { useSmartSuggest } from "@/hooks/use-smart-suggest";
import { usePlannerScan } from "@/hooks/use-planner-scan";
import { PlannerAssistantPanel } from "@/components/PlannerAssistantPanel";
import type { ResolveTarget, PlaceholderItem } from "@/components/PlannerAssistantPanel";
import { SmartReviewPanelContent } from "@/components/SmartReviewPanelContent";
import type { FullDay, FullWeek, SmartCandidate, MealExplanation, SmartSuggestEntry, SmartSuggestResult } from "@/lib/planner-types";
import thaAppleSrc from "@/assets/icons/tha-apple.png";
import type { EntryTarget, PlannerProductResult } from "@/components/PlannerMealPickerPanel";
import { SharePlanDialog } from "@/components/share-plan-dialog";
import { PlannerScanReview, type PlannerScanData, type PlannerDayEntry } from "@/components/PlannerScanReview";
import { computeMealVariety, EMPTY_VARIETY_SCORE } from "@/lib/nutrition-variety";
import { getMealNutrients } from "@/lib/nutrition-insights";
import { NutritionVarietyDots, PlannerVarietyLegend, MealVarietyNudge } from "@/components/nutrition-variety-chips";
import { MealNutrientTags } from "@/components/nutrition-insights-panel";
import { DayViewDrawer } from "@/components/day-view-drawer";
import { useUser } from "@/hooks/use-user";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FirstVisitHint } from "@/components/first-visit-hint";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { api } from "@shared/routes";
import type { PlannerWeek, PlannerDay, PlannerEntry, Meal, FreezerMeal, Nutrition, MealCategory, WeekEaterOverride } from "@shared/schema";
import type { HouseholdEater, GuestEater } from "@shared/household-eater";
import type { AdaptationResult } from "@shared/meal-adaptation";
import { ONBOARDING_DIET_OPTIONS, DIET_PATTERN_OPTIONS, ALLERGY_INTOLERANCE_OPTIONS } from "@/lib/diets";
import { PageHeader } from "@/components/PageHeader";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { DroppablePlannerCell, SortablePlannerEntry, type DragItemData, type DropZoneData } from "@/components/PlannerDragDrop";

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


export default function WeeklyPlannerPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeWeek, setActiveWeek] = useState("1");
  const [renameWeekId, setRenameWeekId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [clearWeekId, setClearWeekId] = useState<number | null>(null);
  const [createMealOpen, setCreateMealOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<EntryTarget | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sharePlanOpen, setSharePlanOpen] = useState(false);
  const [expandedDayId, setExpandedDayId] = useState<number | null>(null);
  const [expandedDayLabel, setExpandedDayLabel] = useState("");
  const [mealDetail, setMealDetail] = useState<MealDetailState | null>(null);
  const [resolveTarget, setResolveTarget] = useState<ResolveTarget | null>(null);
  // Phase 5E: deferred recipe-link confirmation
  type PendingRecipeLink = { entryId: number; mealId: number; targetName: string; recipeName: string; returnToReview: boolean };
  const [pendingRecipeLink, setPendingRecipeLink] = useState<PendingRecipeLink | null>(null);
  // Phase 3F: persists placeholder context across build/scan workflow transitions
  type ResolutionContext = ResolveTarget & { returnMode: "placeholder-review" | null };
  const [resolutionContext, setResolutionContext] = useState<ResolutionContext | null>(null);
  const [mobileDayIndex, setMobileDayIndex] = useState(0);
  const [activeDrag, setActiveDrag] = useState<DragItemData | null>(null);
  // Phase 5A: planner operations state
  const [clearSlotConfirm, setClearSlotConfirm] = useState<{
    dayId: number;
    mealType: string | undefined;
    audience: string;
    isDrink: boolean;
    dayName: string;
    slotLabel: string;
  } | null>(null);
  const [copyDayOpen, setCopyDayOpen] = useState(false);
  const [copyDaySourceId, setCopyDaySourceId] = useState<number | null>(null);
  const [copyDayTargetId, setCopyDayTargetId] = useState<string>("");
  const { user } = useUser();
  const [, navigate] = useLocation();

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  // ── Active week data (needed by domain hooks before other queries) ─────────
  const activeWeekData = fullPlanner.find((w) => w.weekNumber === Number(activeWeek));

  // ── Planner context (Phase 1A + 5B: assistant panel routing + selected day) ─
  const { assistantMode, setAssistantMode, selectedDayId, setSelectedDayId } = usePlannerContext();

  // ── Smart Suggest domain ──────────────────────────────────────────────────
  const {
    smartLoading, smartResult,
    smartNutritionMap, nutritionLoading,
    nutritionFetchTick, setNutritionFetchTick,
    smartControlsOpen, setSmartControlsOpen,
    smartMealsPerDay, setSmartMealsPerDay,
    smartCuisine, setSmartCuisine,
    smartBudget, setSmartBudget,
    smartMaxUPF, setSmartMaxUPF,
    smartFishPerWeek, setSmartFishPerWeek,
    smartRedMeatPerWeek, setSmartRedMeatPerWeek,
    smartVegDays, setSmartVegDays,
    smartLeftovers, setSmartLeftovers,
    lockedEntries, expandedExplanation, setExpandedExplanation,
    applyingSmartPlan,
    restoredFromSession, dismissRestoreBanner,
    runSmartSuggest, toggleLockEntry, applySmartSuggestion, regenerateSingleEntry,
    clearSmartResult,
  } = useSmartSuggest({
    meals, fullPlanner, activeWeek, activeWeekData,
    onReviewReady: () => setAssistantMode("smart-review"),
    onApplied: () => setAssistantMode(null),
  });

  // ── Planner scan domain ───────────────────────────────────────────────────
  const {
    plannerScanOpen,
    plannerScanData, plannerScanLoading, plannerScanError,
    plannerDays,
    handlePlannerScanFile, handlePlannerScanOpenChange,
  } = usePlannerScan({
    activeWeekData,
    onScanReady: () => setAssistantMode("scan-review"),
  });

  const pageUploadRef = useRef<HTMLInputElement>(null);

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

  // Phase 3E: atomic placeholder swap — replaces delete-then-add with a single PATCH
  const replacePlaceholderMealMutation = useMutation({
    mutationFn: async (params: { entryId: number; mealId: number }) => {
      const res = await apiRequest("PATCH", `/api/planner/entries/${params.entryId}/meal`, { mealId: params.mealId });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
    },
    onError: () => {
      toast({ title: "Failed to link recipe", variant: "destructive" });
    },
  });

  // Phase 4A: drag/drop reassignment — moves an entry to a new day+slot atomically
  const movePlannerEntryMutation = useMutation({
    mutationFn: async (params: { entryId: number; dayId: number; mealType: string; position: number }) => {
      const res = await apiRequest("PATCH", `/api/planner/entries/${params.entryId}`, {
        dayId: params.dayId,
        mealType: params.mealType,
        position: params.position,
      });
      return res.json();
    },
    onMutate: async (params) => {
      await qc.cancelQueries({ queryKey: ["/api/planner/full"] });
      const previousData = qc.getQueryData<FullWeek[]>(["/api/planner/full"]);
      qc.setQueryData<FullWeek[]>(["/api/planner/full"], (old) => {
        if (!old) return old;
        return old.map((week) => ({
          ...week,
          days: week.days.map((day) => {
            // Remove entry from its current day
            if (day.entries.some((e) => e.id === params.entryId) && day.id !== params.dayId) {
              return { ...day, entries: day.entries.filter((e) => e.id !== params.entryId) };
            }
            // Move entry within same day (update mealType + position) or add to target day
            if (day.id === params.dayId) {
              const filtered = day.entries.filter((e) => e.id !== params.entryId);
              const moved = day.entries.find((e) => e.id === params.entryId)
                ?? old.flatMap((w) => w.days).flatMap((d) => d.entries).find((e) => e.id === params.entryId);
              if (!moved) return day;
              return {
                ...day,
                entries: [...filtered, { ...moved, dayId: params.dayId, mealType: params.mealType, position: params.position }],
              };
            }
            return day;
          }),
        }));
      });
      return { previousData };
    },
    onError: (_err, _params, context) => {
      if (context?.previousData) {
        qc.setQueryData(["/api/planner/full"], context.previousData);
      }
      toast({ title: "Failed to move meal", description: "Planner restored to previous state", variant: "destructive" });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
    },
  });

  // Phase 4B: batch reorder of entries within the same slot
  const reorderEntriesMutation = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      const res = await apiRequest("PATCH", "/api/planner/entries/reorder", { orderedIds });
      return res.json();
    },
    onMutate: async (orderedIds) => {
      await qc.cancelQueries({ queryKey: ["/api/planner/full"] });
      const previousData = qc.getQueryData<FullWeek[]>(["/api/planner/full"]);
      qc.setQueryData<FullWeek[]>(["/api/planner/full"], (old) => {
        if (!old) return old;
        const positionMap = new Map(orderedIds.map((id, i) => [id, i]));
        return old.map((week) => ({
          ...week,
          days: week.days.map((day) => ({
            ...day,
            entries: day.entries.map((entry) => {
              const newPos = positionMap.get(entry.id);
              return newPos !== undefined ? { ...entry, position: newPos } : entry;
            }),
          })),
        }));
      });
      return { previousData };
    },
    onError: (_err, _ids, context) => {
      if (context?.previousData) {
        qc.setQueryData(["/api/planner/full"], context.previousData);
      }
      toast({ title: "Failed to reorder meals", description: "Planner restored to previous state", variant: "destructive" });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
    },
  });

  // Phase 5A: duplicate a planner entry (same slot, or to a different day)
  const duplicateEntryMutation = useMutation({
    mutationFn: async (params: { entryId: number; targetDayId?: number }) => {
      const body: Record<string, number> = {};
      if (params.targetDayId !== undefined) body.targetDayId = params.targetDayId;
      const res = await apiRequest("POST", `/api/planner/entries/${params.entryId}/duplicate`, body);
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.message ?? "Failed to duplicate");
      }
      return res.json();
    },
    onSuccess: (_data, params) => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
      toast({ title: params.targetDayId ? "Copied to tomorrow" : "Duplicated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to duplicate", description: err.message, variant: "destructive" });
    },
  });

  // Phase 5A: copy all entries from one day to another
  const copyDayMutation = useMutation({
    mutationFn: async (params: { sourceDayId: number; targetDayId: number }) => {
      const res = await apiRequest("POST", `/api/planner/days/${params.sourceDayId}/copy`, {
        targetDayId: params.targetDayId,
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.message ?? "Failed to copy day");
      }
      return res.json() as Promise<{ created: number }>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
      setCopyDayOpen(false);
      setCopyDaySourceId(null);
      setCopyDayTargetId("");
      toast({ title: `Day copied`, description: `${data.created} meal${data.created !== 1 ? "s" : ""} added` });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to copy day", description: err.message, variant: "destructive" });
    },
  });

  // Phase 5A: clear all entries in a specific day+slot
  const clearSlotMutation = useMutation({
    mutationFn: async (params: { dayId: number; mealType: string | undefined; audience: string; isDrink: boolean }) => {
      const body: Record<string, unknown> = { audience: params.audience, isDrink: params.isDrink };
      if (params.mealType !== undefined) body.mealType = params.mealType;
      const res = await apiRequest("DELETE", `/api/planner/days/${params.dayId}/slot`, body);
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.message ?? "Failed to clear slot");
      }
      return res.json() as Promise<{ deleted: number }>;
    },
    onMutate: async (params) => {
      await qc.cancelQueries({ queryKey: ["/api/planner/full"] });
      const previousData = qc.getQueryData<FullWeek[]>(["/api/planner/full"]);
      qc.setQueryData<FullWeek[]>(["/api/planner/full"], (old) => {
        if (!old) return old;
        return old.map((week) => ({
          ...week,
          days: week.days.map((day) => {
            if (day.id !== params.dayId) return day;
            return {
              ...day,
              entries: day.entries.filter((e) => {
                if (e.isDrink !== params.isDrink) return true;
                if (params.mealType !== undefined && e.mealType !== params.mealType) return true;
                if (e.audience !== params.audience) return true;
                return false;
              }),
            };
          }),
        }));
      });
      return { previousData };
    },
    onError: (_err, _params, context) => {
      if (context?.previousData) qc.setQueryData(["/api/planner/full"], context.previousData);
      toast({ title: "Failed to clear slot", description: "Planner restored", variant: "destructive" });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
      setClearSlotConfirm(null);
    },
  });

  // Phase 5A: add a planner meal to the freezer (only if meal is freezer-eligible)
  const addToFreezerMutation = useMutation({
    mutationFn: async (mealId: number) => {
      const today = new Date().toISOString().split("T")[0];
      const res = await apiRequest("POST", "/api/freezer", { mealId, totalPortions: 1, remainingPortions: 1, frozenDate: today });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.message ?? "Failed to add to freezer");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/freezer"] });
      toast({ title: "Added to freezer" });
    },
    onError: (err: Error) => {
      toast({ title: "Could not add to freezer", description: err.message, variant: "destructive" });
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

  // Phase 4A: drag/drop handlers
  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragItemData | undefined;
    if (data?.type === "planner-entry" || data?.type === "proposal-card") setActiveDrag(data);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;
    const dragData = active.data.current as DragItemData | undefined;
    if (!dragData) return;
    const overData = over.data.current as (DragItemData | DropZoneData) | undefined;
    if (!overData) return;

    // Phase 5D: proposal-card from assistant panel dropped onto the planner grid
    if (dragData.type === "proposal-card") {
      let targetDayId: number;
      let targetMealType: string;
      if (overData.type === "planner-slot") {
        targetDayId = overData.dayId;
        targetMealType = overData.mealType;
      } else if (overData.type === "planner-entry") {
        targetDayId = overData.dayId;
        targetMealType = overData.mealType;
      } else {
        return;
      }
      createPlannerIntent(dragData.name, targetMealType, targetDayId);
      return;
    }

    if (dragData.type !== "planner-entry") return;

    if (overData.type === "planner-entry") {
      // Dropped over another sortable entry
      const overEntry = overData;
      if (overEntry.type !== "planner-entry") return;
      if (dragData.entryId === overEntry.entryId) return;

      const sameSlot =
        dragData.dayId === overEntry.dayId &&
        dragData.mealType === overEntry.mealType &&
        dragData.audience === overEntry.audience &&
        dragData.isDrink === overEntry.isDrink;

      if (sameSlot) {
        // Phase 4B: within-slot reorder
        const day = fullPlanner.flatMap((w) => w.days).find((d) => d.id === dragData.dayId);
        if (!day) return;
        const slotEntries = getSlotEntries(day.entries, dragData.mealType, dragData.audience, dragData.isDrink);
        const oldIdx = slotEntries.findIndex((e) => e.id === dragData.entryId);
        const newIdx = slotEntries.findIndex((e) => e.id === overEntry.entryId);
        if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;
        const reordered = arrayMove(slotEntries, oldIdx, newIdx);
        reorderEntriesMutation.mutate(reordered.map((e) => e.id));
      } else {
        // Phase 4A: cross-slot move, insert after existing entries in target slot
        const allEntries = fullPlanner.flatMap((w) => w.days).flatMap((d) => d.entries);
        const targetEntries = allEntries.filter(
          (e) => e.dayId === overEntry.dayId && e.mealType === overEntry.mealType &&
                 !e.isDrink === !overEntry.isDrink && e.id !== dragData.entryId,
        );
        const newPosition = targetEntries.length > 0 ? Math.max(...targetEntries.map((e) => e.position)) + 1 : 0;
        movePlannerEntryMutation.mutate({
          entryId: dragData.entryId,
          dayId: overEntry.dayId,
          mealType: overEntry.mealType,
          position: newPosition,
        });
      }
    } else if (overData.type === "planner-slot") {
      // Dropped on empty cell area (Phase 4A: DroppablePlannerCell)
      const dropSlot = overData;
      const sameSlot =
        dragData.dayId === dropSlot.dayId &&
        dragData.mealType === dropSlot.mealType &&
        dragData.audience === dropSlot.audience &&
        dragData.isDrink === dropSlot.isDrink;
      if (sameSlot) return;

      const allEntries = fullPlanner.flatMap((w) => w.days).flatMap((d) => d.entries);
      const targetEntries = allEntries.filter(
        (e) => e.dayId === dropSlot.dayId && e.mealType === dropSlot.mealType &&
               !e.isDrink === !dropSlot.isDrink && e.id !== dragData.entryId,
      );
      const newPosition = targetEntries.length > 0 ? Math.max(...targetEntries.map((e) => e.position)) + 1 : 0;
      movePlannerEntryMutation.mutate({
        entryId: dragData.entryId,
        dayId: dropSlot.dayId,
        mealType: dropSlot.mealType,
        position: newPosition,
      });
    }
  }

  function handleDragCancel() {
    setActiveDrag(null);
  }

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



  // Phase 3G: restore placeholder-review mode after returning from scan/import flow
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("returnMode") === "placeholder-review") {
      setAssistantMode("placeholder-review");
      navigate("/planner", { replace: true } as any);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openPicker = (target: EntryTarget) => {
    setPickerTarget(target);
    setAssistantMode("manual");
  };

  const handleResolveAction = (action: "build" | "scan" | "later" | "import") => {
    if (action === "build") {
      // Phase 3F: capture context before clearing resolveTarget
      if (resolveTarget) setResolutionContext({ ...resolveTarget, returnMode: null });
      setResolveTarget(null);
      setAssistantMode(null);
      setCreateMealOpen(true);
    } else if (action === "scan") {
      if (resolveTarget) {
        // Phase 3G: navigate directly to recipe scan with resolution context
        const params = new URLSearchParams({
          plannerImport: "1",
          mealName: resolveTarget.mealName,
          day: resolveTarget.dayName,
          slot: resolveTarget.mealType,
          plannerResolve: "1",
          openScan: "1",
        });
        params.set("dayId", String(resolveTarget.dayId));
        params.set("entryId", String(resolveTarget.entryId));
        setResolveTarget(null);
        setAssistantMode(null);
        navigate(`/meals?${params.toString()}`);
      } else {
        setAssistantMode("scan");
      }
    } else if (action === "import") {
      // Phase 5E: navigate to /meals with full planner context
      if (resolveTarget) {
        const params = new URLSearchParams({
          plannerImport: "1",
          mealName: resolveTarget.mealName,
          day: resolveTarget.dayName,
          slot: resolveTarget.mealType,
          plannerResolve: "1",
        });
        params.set("dayId", String(resolveTarget.dayId));
        params.set("entryId", String(resolveTarget.entryId));
        setResolveTarget(null);
        setAssistantMode(null);
        navigate(`/meals?${params.toString()}`);
      }
    } else {
      setResolutionContext(null);
      setResolveTarget(null);
      setAssistantMode(null);
    }
  };

  // Phase 5E: show confirmation before linking (was immediate in Phase 3E)
  const handleResolveRecipe = (mealId: number) => {
    if (!resolveTarget) return;
    const recipeName = getMeal(mealId)?.name ?? "this recipe";
    setPendingRecipeLink({ entryId: resolveTarget.entryId, mealId, targetName: resolveTarget.mealName, recipeName, returnToReview: false });
  };

  // Phase 5E: show confirmation before linking (was immediate in Phase 3E)
  const handleResolveRecipeFromReview = (mealId: number, target: ResolveTarget) => {
    const recipeName = getMeal(mealId)?.name ?? "this recipe";
    setPendingRecipeLink({ entryId: target.entryId, mealId, targetName: target.mealName, recipeName, returnToReview: true });
  };

  // Phase 3F: build from placeholder-review carries item context
  const handleBuildFromReview = (target: ResolveTarget) => {
    setResolutionContext({ ...target, returnMode: "placeholder-review" });
    setAssistantMode(null);
    setCreateMealOpen(true);
  };

  // Phase 5E: confirm and execute the deferred recipe-link
  const confirmRecipeLink = () => {
    if (!pendingRecipeLink) return;
    const { entryId, mealId, targetName, returnToReview } = pendingRecipeLink;
    replacePlaceholderMealMutation.mutate({ entryId, mealId }, {
      onSuccess: () => {
        setPendingRecipeLink(null);
        setResolveTarget(null);
        setResolutionContext(null);
        if (!returnToReview) setAssistantMode(null);
        toast({ title: "Recipe linked", description: `${targetName} has been resolved.` });
      },
      onError: () => {
        setPendingRecipeLink(null);
        toast({ title: "Failed to link recipe", variant: "destructive" });
      },
    });
  };

  // Phase 5E: navigate to /meals with full planner context from placeholder-review
  const handleImportFromReview = (target: ResolveTarget) => {
    const params = new URLSearchParams({
      plannerImport: "1",
      mealName: target.mealName,
      day: target.dayName,
      slot: target.mealType,
      plannerResolve: "1",
      returnMode: "placeholder-review",
    });
    params.set("dayId", String(target.dayId));
    params.set("entryId", String(target.entryId));
    setAssistantMode(null);
    navigate(`/meals?${params.toString()}`);
  };

  // Phase 3G: scan from placeholder-review navigates directly to recipe scan with full context
  const handleScanFromReview = (target: ResolveTarget) => {
    const params = new URLSearchParams({
      plannerImport: "1",
      mealName: target.mealName,
      day: target.dayName,
      slot: target.mealType,
      plannerResolve: "1",
      returnMode: "placeholder-review",
      openScan: "1",
    });
    params.set("dayId", String(target.dayId));
    params.set("entryId", String(target.entryId));
    setAssistantMode(null);
    navigate(`/meals?${params.toString()}`);
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
    setAssistantMode(null);
    setPickerTarget(null);
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

  // Phase 5B + 5D: inline planner intent creation (dayIdOverride used by drag-drop in Phase 5D)
  const createPlannerIntent = async (name: string, mealType: string, dayIdOverride?: number): Promise<void> => {
    const targetDayId = dayIdOverride ?? selectedDayId;
    if (!targetDayId) {
      toast({ title: "Select a day first", description: "Click a day header in the planner grid to select it.", variant: "destructive" });
      return;
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast({ title: "Enter a meal name", variant: "destructive" });
      return;
    }
    try {
      const mealRes = await apiRequest("POST", "/api/meals", {
        name: trimmedName,
        ingredients: [],
        instructions: [],
        servings: 1,
        audience: "adult",
        isDrink: false,
        mealSourceType: "planner-placeholder",
      });
      if (!mealRes.ok) throw new Error("Failed to create meal");
      const meal = await mealRes.json();

      const day = fullPlanner.flatMap(w => w.days).find(d => d.id === targetDayId);
      const position = day ? getSlotEntries(day.entries, mealType, "adult", false).length : 0;

      const entryRes = await apiRequest("POST", `/api/planner/days/${targetDayId}/items`, {
        mealSlot: mealType,
        mealId: meal.id,
        position,
        audience: "adult",
        isDrink: false,
        drinkType: null,
      });
      if (!entryRes.ok) {
        await apiRequest("DELETE", `/api/meals/${meal.id}`).catch(() => {});
        throw new Error("Failed to add to planner");
      }

      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
      qc.invalidateQueries({ queryKey: ["/api/meals"] });
      toast({ title: `"${trimmedName}" added`, description: "Appears as unresolved — link a recipe when ready." });
    } catch (err: any) {
      toast({ title: "Failed to add meal idea", description: err?.message ?? "Please try again.", variant: "destructive" });
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

  const sortedDays = activeWeekData?.days?.slice().sort((a, b) => {
    const aIdx = MONDAY_FIRST_ORDER.indexOf(a.dayOfWeek);
    const bIdx = MONDAY_FIRST_ORDER.indexOf(b.dayOfWeek);
    return aIdx - bIdx;
  }) || [];

  // Phase 5A: find the next day in sorted week order
  const getNextDay = (currentDayId: number): FullDay | undefined => {
    const idx = sortedDays.findIndex((d) => d.id === currentDayId);
    if (idx < 0 || idx >= sortedDays.length - 1) return undefined;
    return sortedDays[idx + 1];
  };

  const handleRepeatTomorrow = (entry: PlannerEntry, currentDayId: number) => {
    const nextDay = getNextDay(currentDayId);
    if (!nextDay) {
      toast({ title: "No next day in this week" });
      return;
    }
    duplicateEntryMutation.mutate({ entryId: entry.id, targetDayId: nextDay.id });
  };

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

  const placeholderItems = useMemo((): PlaceholderItem[] => {
    const items: PlaceholderItem[] = [];
    for (const day of sortedDays) {
      for (const row of visibleRows) {
        const cellEntries = getCellEntries(day.entries, row);
        for (const entry of cellEntries) {
          const meal = meals.find(m => m.id === entry.mealId);
          if (meal?.mealSourceType === "planner-placeholder") {
            items.push({
              entryId: entry.id,
              mealId: entry.mealId,
              mealName: meal.name,
              dayName: DAY_NAMES[day.dayOfWeek],
              slotLabel: row.label,
              dayId: day.id,
              mealType: row.mealType ?? row.addMealType,
              audience: row.audience,
              isDrink: row.isDrink,
              position: entry.position,
            });
          }
        }
      }
    }
    return items;
  }, [sortedDays, visibleRows, meals]);


  const workspaceValue = useMemo(() => ({
    smartMealsPerDay, setSmartMealsPerDay,
    smartCuisine, setSmartCuisine,
    smartBudget, setSmartBudget,
    smartMaxUPF, setSmartMaxUPF,
    smartFishPerWeek, setSmartFishPerWeek,
    smartRedMeatPerWeek, setSmartRedMeatPerWeek,
    smartVegDays, setSmartVegDays,
    smartLeftovers, setSmartLeftovers,
    smartLoading,
    onRunSmartSuggest: () => runSmartSuggest(),
    plannerSettings,
    toggleSetting,
    settingsUpdating: updateSettingsMutation.isPending,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [
    smartMealsPerDay, smartCuisine, smartBudget, smartMaxUPF,
    smartFishPerWeek, smartRedMeatPerWeek, smartVegDays, smartLeftovers,
    smartLoading, plannerSettings, updateSettingsMutation.isPending,
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PlannerWorkspaceContext.Provider value={workspaceValue}>
    <>
    <PageHeader
      title="Planner"
      icon={<CalendarDays className="h-5 w-5" />}
      realm="planner"
      titleTestId="text-weekly-planner-title"
      context={<span data-testid="text-week-progress">{weekStats.filled} meals planned out of {weekStats.total} this week</span>}
      actions={
        <div className="flex flex-wrap items-center gap-1">
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
            variant="outline"
            className="px-2.5 text-xs"
            onClick={() => setAssistantMode("scan")}
            data-testid="button-planner-scan-primary"
            title="Photograph your paper planner"
          >
            <Camera className="h-3 w-3 mr-1" />
            Scan
          </Button>
          <Button
            size="sm"
            className="px-2.5 text-xs"
            onClick={() => setAssistantMode("smart")}
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
          <Button size="sm" className="px-2.5 text-xs" onClick={() => setAssistantMode("templates")} data-testid="button-open-templates">
            <LayoutGrid className="h-3 w-3 mr-1" />
            Templates
          </Button>
          <Button size="sm" className="px-2.5 text-xs" onClick={addAllToBasket} disabled={addToBasketMutation.isPending} data-testid="button-add-all-basket">
            <ShoppingBasket className="h-3 w-3 mr-1" />
            {addToBasketMutation.isPending ? "…" : "+Week"}
          </Button>
          {placeholderItems.length > 0 && (
            <button
              onClick={() => setAssistantMode("placeholder-review")}
              className="flex items-center gap-1 h-8 px-2 text-xs rounded-md border border-amber-400/40 text-amber-600 dark:text-amber-400/80 hover:bg-amber-50/60 dark:hover:bg-amber-950/20 transition-colors shrink-0"
              data-testid="button-placeholder-review"
              title="Review unlinked meals"
            >
              <BookOpen className="h-3 w-3" />
              <span className="font-medium">{placeholderItems.length}</span>
            </button>
          )}
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
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => setAssistantMode("settings")} data-testid="button-planner-settings">
                <Settings className="h-4 w-4 mr-2" />
                Options
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAssistantMode("bulk")} data-testid="button-bulk-assign">
                <Copy className="h-4 w-4 mr-2" />
                Bulk Assign
              </DropdownMenuItem>
              {placeholderItems.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setAssistantMode("placeholder-review")}
                    data-testid="button-review-unlinked"
                  >
                    <BookOpen className="h-4 w-4 mr-2 text-amber-500" />
                    <span>Review unlinked</span>
                    <span className="ml-auto text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-full">
                      {placeholderItems.length}
                    </span>
                  </DropdownMenuItem>
                </>
              )}
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
      }
    />
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
      <DndContext
        sensors={dndSensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
      <div className="flex gap-4 items-start">
      <div className="flex-1 min-w-0">
      <FirstVisitHint
        areaKey="planner"
        message="Plan your meals for the week ahead. Add meals to each day, use templates to get started fast, or tap Plan to get suggestions - then send the whole week to your basket."
      />

      {/* ── Week Content ── */}
      <Tabs value={activeWeek} onValueChange={setActiveWeek} className="w-full">


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
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-semibold" data-testid="text-mobile-day-name">
                    {sortedDays[mobileDayIndex] ? DAY_NAMES[sortedDays[mobileDayIndex].dayOfWeek] : "-"}
                  </span>
                  {sortedDays[mobileDayIndex] && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent/40" title="Day actions" data-testid="button-mobile-day-actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center">
                        <DropdownMenuItem
                          onClick={() => { setCopyDaySourceId(sortedDays[mobileDayIndex].id); setCopyDayTargetId(""); setCopyDayOpen(true); }}
                          data-testid="button-mobile-copy-day"
                        >
                          <Copy className="h-3.5 w-3.5 mr-2" />
                          Copy this day
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
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
                            const isPlaceholder = meal.mealSourceType === "planner-placeholder";
                            const isFrozen = freezerMeals.some(f => f.mealId === meal.id && f.remainingPortions > 0);
                            return (
                              <div key={entry.id} className="flex items-start gap-1">
                                <button
                                  className={`flex-1 min-w-0 text-left text-sm transition-colors flex items-start gap-1.5 ${isPlaceholder ? "text-muted-foreground/70 hover:text-muted-foreground" : "text-foreground hover:text-primary"}`}
                                  onClick={() => {
                                    if (isPlaceholder) {
                                      setResolveTarget({
                                        mealName: meal.name,
                                        dayName: DAY_NAMES[mobileDay.dayOfWeek],
                                        slotLabel: row.label,
                                        entryId: entry.id,
                                        dayId: mobileDay.id,
                                        mealType: row.mealType ?? row.addMealType,
                                        audience: row.audience,
                                        isDrink: row.isDrink,
                                        position: entry.position,
                                      });
                                      setAssistantMode("resolve");
                                    } else {
                                      setMealDetail({
                                        entry,
                                        meal,
                                        dayId: mobileDay.id,
                                        mealType: row.mealType ?? row.addMealType,
                                        audience: row.audience,
                                        isDrink: row.isDrink,
                                        dayName: DAY_NAMES[mobileDay.dayOfWeek],
                                        slotLabel: row.label,
                                      });
                                    }
                                  }}
                                  data-testid={`button-mobile-meal-${row.id}-${entry.id}`}
                                >
                                  <div className={`flex-1 min-w-0 flex flex-col gap-0.5 ${isPlaceholder ? "border border-dashed border-muted-foreground/30 rounded px-1.5 py-0.5" : ""}`}>
                                    <span className="leading-snug">{meal.name}</span>
                                    {isPlaceholder
                                      ? <span className="text-[10px] text-muted-foreground/60 italic" data-testid={`label-placeholder-mobile-${entry.id}`}>Needs recipe</span>
                                      : <NutritionVarietyDots score={computeMealVariety(meal.ingredients ?? [])} />
                                    }
                                  </div>
                                  {isFrozen && <Snowflake className="h-3 w-3 text-blue-400 flex-shrink-0 mt-0.5" />}
                                  {basketMealIdSet.has(meal.id) && <ShoppingCart className="h-3 w-3 text-emerald-500/70 flex-shrink-0 mt-0.5" />}
                                </button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      className="p-0.5 text-muted-foreground/30 hover:text-muted-foreground rounded flex-shrink-0 mt-0.5"
                                      onClick={(e) => e.stopPropagation()}
                                      data-testid={`button-mobile-entry-ops-${entry.id}`}
                                      title="Entry actions"
                                    >
                                      <MoreHorizontal className="h-3.5 w-3.5" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    {!isPlaceholder && (
                                      <DropdownMenuItem onClick={() => duplicateEntryMutation.mutate({ entryId: entry.id })} data-testid={`mi-duplicate-${entry.id}`}>
                                        <Copy className="h-3.5 w-3.5 mr-2" />
                                        Duplicate here
                                      </DropdownMenuItem>
                                    )}
                                    {!isPlaceholder && getNextDay(mobileDay.id) && (
                                      <DropdownMenuItem onClick={() => handleRepeatTomorrow(entry, mobileDay.id)} data-testid={`mi-repeat-tomorrow-${entry.id}`}>
                                        <RefreshCw className="h-3.5 w-3.5 mr-2" />
                                        Repeat tomorrow
                                      </DropdownMenuItem>
                                    )}
                                    {isPlaceholder && (
                                      <DropdownMenuItem onClick={() => duplicateEntryMutation.mutate({ entryId: entry.id })}>
                                        <Copy className="h-3.5 w-3.5 mr-2" />
                                        Duplicate placeholder
                                      </DropdownMenuItem>
                                    )}
                                    {meal.isFreezerEligible && !isPlaceholder && (
                                      <DropdownMenuItem onClick={() => addToFreezerMutation.mutate(meal.id)} data-testid={`mi-freeze-${entry.id}`}>
                                        <Snowflake className="h-3.5 w-3.5 mr-2" />
                                        Add to freezer
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-muted-foreground focus:text-foreground"
                                      onClick={() => setClearSlotConfirm({ dayId: mobileDay.id, mealType: row.mealType, audience: row.audience, isDrink: row.isDrink, dayName: DAY_NAMES[mobileDay.dayOfWeek], slotLabel: row.label })}
                                      data-testid={`mi-clear-slot-${row.id}`}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                                      Clear this slot
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => deleteEntryMutation.mutate(entry.id)}
                                      data-testid={`mi-remove-${entry.id}`}
                                    >
                                      <X className="h-3.5 w-3.5 mr-2" />
                                      Remove
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
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
                        <div
                          key={day.id}
                          className={`relative bg-muted/40 border-b-2 border-l border-border px-2 py-2.5 text-center transition-colors group/day-hdr ${
                            isSelected ? "bg-primary/10" : "hover:bg-accent/30"
                          }`}
                        >
                          <button
                            className="w-full"
                            onClick={() => setSelectedDayId(day.id)}
                            data-testid={`button-day-header-${day.dayOfWeek}`}
                          >
                            <div className={`text-xs font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                              {DAY_NAMES[day.dayOfWeek]}
                            </div>
                          </button>
                          <button
                            className="absolute top-1 right-1 opacity-0 group-hover/day-hdr:opacity-50 hover:!opacity-100 rounded p-0.5 hover:bg-accent/60 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); setCopyDaySourceId(day.id); setCopyDayTargetId(""); setCopyDayOpen(true); }}
                            title="Copy this day"
                            data-testid={`button-copy-day-${day.dayOfWeek}`}
                          >
                            <Copy className="h-2.5 w-2.5" />
                          </button>
                        </div>
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
                              <DroppablePlannerCell
                                key={day.id + row.id}
                                dayId={day.id}
                                mealType={row.mealType ?? row.addMealType}
                                audience={row.audience}
                                isDrink={row.isDrink}
                                className={`relative p-1.5 min-h-[56px] flex flex-col gap-0.5 border-l border-border ${!isLastRow ? "border-b border-border" : ""}`}
                                data-testid={`cell-${row.id}-${day.dayOfWeek}`}
                              >
                                {/* Meal name pills — each slot is its own sortable context for within-slot reorder */}
                                <SortableContext
                                  items={cellEntries.slice(0, 2).map((e) => `entry-${e.id}`)}
                                  strategy={verticalListSortingStrategy}
                                >
                                {cellEntries.slice(0, 2).map((entry) => {
                                  const meal = getMeal(entry.mealId);
                                  if (!meal) return null;
                                  const isPlaceholder = meal.mealSourceType === "planner-placeholder";
                                  const isFrozen = freezerMeals.some(f => f.mealId === meal.id && f.remainingPortions > 0);
                                  return (
                                    <SortablePlannerEntry
                                      key={entry.id}
                                      entry={entry}
                                      dayId={day.id}
                                      mealType={row.mealType ?? row.addMealType}
                                      audience={row.audience}
                                      isDrink={row.isDrink}
                                    >
                                      <div className="relative group/entry w-full">
                                        <button
                                          className={`w-full text-left text-xs leading-snug transition-colors flex items-start gap-0.5 ${isPlaceholder ? "text-muted-foreground/70 hover:text-muted-foreground" : "text-foreground hover:text-primary"}`}
                                          onClick={() => {
                                            if (isPlaceholder) {
                                              setResolveTarget({
                                                mealName: meal.name,
                                                dayName: DAY_NAMES[day.dayOfWeek],
                                                slotLabel: row.label,
                                                entryId: entry.id,
                                                dayId: day.id,
                                                mealType: row.mealType ?? row.addMealType,
                                                audience: row.audience,
                                                isDrink: row.isDrink,
                                                position: entry.position,
                                              });
                                              setAssistantMode("resolve");
                                            } else {
                                              setMealDetail({
                                                entry,
                                                meal,
                                                dayId: day.id,
                                                mealType: row.mealType ?? row.addMealType,
                                                audience: row.audience,
                                                isDrink: row.isDrink,
                                                dayName: DAY_NAMES[day.dayOfWeek],
                                                slotLabel: row.label,
                                              });
                                            }
                                          }}
                                          data-testid={`button-meal-${row.id}-${day.dayOfWeek}-${entry.id}`}
                                        >
                                          <div className={`flex-1 min-w-0 flex flex-col gap-0.5 ${isPlaceholder ? "border border-dashed border-muted-foreground/30 rounded px-1 py-0.5" : ""}`}>
                                            <span className="break-words leading-tight pr-3">{meal.name}</span>
                                            {isPlaceholder && (
                                              <span className="text-[9px] text-muted-foreground/60 italic" data-testid={`label-placeholder-${entry.id}`}>Needs recipe</span>
                                            )}
                                            {!isPlaceholder && <NutritionVarietyDots score={computeMealVariety(meal.ingredients ?? [])} />}
                                          </div>
                                          {isFrozen && <Snowflake className="h-2.5 w-2.5 text-blue-400 flex-shrink-0 mt-0.5" />}
                                          {basketMealIdSet.has(meal.id) && (
                                            <ShoppingCart className="h-2.5 w-2.5 text-emerald-500/70 flex-shrink-0 mt-0.5" data-testid={`icon-in-basket-${meal.id}`} />
                                          )}
                                        </button>
                                        {/* Phase 5A: entry operations menu */}
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <button
                                              className="absolute top-0 right-0 h-4 w-4 flex items-center justify-center rounded opacity-0 group-hover/entry:opacity-60 hover:!opacity-100 hover:bg-accent/60 transition-opacity"
                                              onClick={(e) => e.stopPropagation()}
                                              data-testid={`button-entry-ops-${entry.id}`}
                                              title="Entry actions"
                                            >
                                              <MoreHorizontal className="h-2.5 w-2.5" />
                                            </button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="w-48">
                                            {!isPlaceholder && (
                                              <DropdownMenuItem onClick={() => duplicateEntryMutation.mutate({ entryId: entry.id })} data-testid={`mi-dup-${entry.id}`}>
                                                <Copy className="h-3.5 w-3.5 mr-2" />
                                                Duplicate here
                                              </DropdownMenuItem>
                                            )}
                                            {!isPlaceholder && getNextDay(day.id) && (
                                              <DropdownMenuItem onClick={() => handleRepeatTomorrow(entry, day.id)} data-testid={`mi-repeat-${entry.id}`}>
                                                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                                                Repeat tomorrow
                                              </DropdownMenuItem>
                                            )}
                                            {isPlaceholder && (
                                              <DropdownMenuItem onClick={() => duplicateEntryMutation.mutate({ entryId: entry.id })}>
                                                <Copy className="h-3.5 w-3.5 mr-2" />
                                                Duplicate placeholder
                                              </DropdownMenuItem>
                                            )}
                                            {meal.isFreezerEligible && !isPlaceholder && (
                                              <DropdownMenuItem onClick={() => addToFreezerMutation.mutate(meal.id)} data-testid={`mi-freeze-${entry.id}`}>
                                                <Snowflake className="h-3.5 w-3.5 mr-2" />
                                                Add to freezer
                                              </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              className="text-muted-foreground focus:text-foreground"
                                              onClick={() => setClearSlotConfirm({ dayId: day.id, mealType: row.mealType, audience: row.audience, isDrink: row.isDrink, dayName: DAY_NAMES[day.dayOfWeek], slotLabel: row.label })}
                                              data-testid={`mi-clear-slot-${row.id}-${day.dayOfWeek}`}
                                            >
                                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                                              Clear this slot
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              className="text-destructive focus:text-destructive"
                                              onClick={() => deleteEntryMutation.mutate(entry.id)}
                                              data-testid={`mi-remove-${entry.id}`}
                                            >
                                              <X className="h-3.5 w-3.5 mr-2" />
                                              Remove
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </SortablePlannerEntry>
                                  );
                                })}
                                </SortableContext>
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
                                    onClick={() => { setExpandedDayId(day.id); setExpandedDayLabel(DAY_NAMES[day.dayOfWeek]); setAssistantMode("day"); }}
                                    title="Expand day"
                                    data-testid={`button-expand-day-${day.dayOfWeek}`}
                                  >
                                    <LayoutList className="h-3 w-3" />
                                  </button>
                                )}
                              </DroppablePlannerCell>
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
      </div>{/* end flex-1 min-w-0 */}
      <PlannerAssistantPanel
        mode={assistantMode}
        onClose={() => {
          if (plannerScanOpen) handlePlannerScanOpenChange(false);
          setResolveTarget(null);
          setAssistantMode(null);
        }}
        reviewContent={
          assistantMode === "smart-review" ? (
            <SmartReviewPanelContent
              smartResult={smartResult}
              smartNutritionMap={smartNutritionMap}
              nutritionLoading={nutritionLoading}
              lockedEntries={lockedEntries}
              expandedExplanation={expandedExplanation}
              setExpandedExplanation={setExpandedExplanation}
              applyingSmartPlan={applyingSmartPlan}
              smartLoading={smartLoading}
              mealById={mealById}
              activeWeek={activeWeek}
              toggleLockEntry={toggleLockEntry}
              regenerateSingleEntry={regenerateSingleEntry}
              applySmartSuggestion={applySmartSuggestion}
              runSmartSuggest={runSmartSuggest}
              setNutritionFetchTick={setNutritionFetchTick}
              onCancel={() => { clearSmartResult(); setAssistantMode(null); }}
              restoredFromSession={restoredFromSession}
              onDismissRestoreBanner={dismissRestoreBanner}
            />
          ) : assistantMode === "scan-review" ? (
            <PlannerScanReview
              inline
              open={true}
              onOpenChange={(v) => {
                if (!v) { handlePlannerScanOpenChange(false); setAssistantMode(null); }
              }}
              scanData={plannerScanData}
              scanning={plannerScanLoading}
              scanError={plannerScanError ?? undefined}
              plannerDays={plannerDays}
              onSaved={() => qc.invalidateQueries({ queryKey: ["/api/planner/full"] })}
              resolutionContext={resolutionContext}
            />
          ) : undefined
        }
        onScanFile={handlePlannerScanFile}
        onUploadClick={() => pageUploadRef.current?.click()}
        scanLoading={plannerScanLoading}
        user={user}
        pickerTarget={pickerTarget}
        meals={meals}
        plannerMealIdSet={plannerMealIdSet}
        categoryIdForSlot={categoryIdForSlot}
        onPickerSelect={selectMeal}
        addingEntry={addEntryMutation.isPending}
        onAddProduct={addProductToPlanner}
        dayViewDay={expandedDay}
        dayViewLabel={expandedDayLabel}
        getMeal={getMeal}
        onPlannerInvalidate={() => qc.invalidateQueries({ queryKey: ["/api/planner/full"] })}
        fullPlanner={fullPlanner}
        resolveTarget={resolveTarget ?? undefined}
        onResolveAction={handleResolveAction}
        onResolveRecipe={handleResolveRecipe}
        isResolving={replacePlaceholderMealMutation.isPending}
        placeholderItems={placeholderItems}
        onResolveRecipeFromReview={handleResolveRecipeFromReview}
        onBuildFromReview={handleBuildFromReview}
        onScanFromReview={handleScanFromReview}
        onImportFromReview={handleImportFromReview}
        onSetMode={setAssistantMode}
        onCreateIntent={createPlannerIntent}
        selectedDayLabel={selectedDay ? DAY_NAMES[selectedDay.dayOfWeek] : null}
        onBrowseRecipes={() => navigate("/meals")}
        onBuildRecipe={() => setCreateMealOpen(true)}
        onScanRecipe={() => navigate("/meals?openScan=1")}
      />
      </div>{/* end flex gap-4 */}
      <DragOverlay dropAnimation={null}>
        {activeDrag ? (
          <div className="bg-background border border-primary rounded px-2 py-1 text-xs shadow-lg opacity-95 max-w-[140px] truncate cursor-grabbing pointer-events-none">
            {activeDrag.type === "proposal-card"
              ? activeDrag.name
              : getMeal(activeDrag.entry.mealId)?.name ?? "Meal"}
          </div>
        ) : null}
      </DragOverlay>
      </DndContext>

      {/* ── Phase 5E: Recipe-link confirmation dialog ── */}
      <Dialog open={!!pendingRecipeLink} onOpenChange={(v) => { if (!v) setPendingRecipeLink(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Link recipe to planned meal?</DialogTitle>
            <DialogDescription>
              Use <span className="font-medium text-foreground">{pendingRecipeLink?.recipeName}</span> for{" "}
              <span className="font-medium text-foreground">{pendingRecipeLink?.targetName}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setPendingRecipeLink(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirmRecipeLink}
              disabled={replacePlaceholderMealMutation.isPending}
            >
              {replacePlaceholderMealMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Link recipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Meal Modal (Epic 1) ── */}
      <CreateMealModal
        open={createMealOpen}
        onOpenChange={(v) => {
          setCreateMealOpen(v);
          // Phase 3F: clear context if modal dismissed without creating
          if (!v) setResolutionContext(null);
        }}
        initialTitle={resolutionContext?.mealName}
        onCreated={(mealId) => {
          qc.invalidateQueries({ queryKey: ["/api/meals"] });
          // Phase 3F: offer to link newly created recipe to originating placeholder
          if (resolutionContext) {
            const ctx = resolutionContext;
            setResolutionContext(null);
            toast({
              title: "Recipe created",
              description: `Link "${ctx.mealName}" to your planner?`,
              action: (
                <ToastAction
                  altText="Link to planner"
                  onClick={() => {
                    replacePlaceholderMealMutation.mutate({ entryId: ctx.entryId, mealId }, {
                      onSuccess: () => {
                        if (ctx.returnMode) setAssistantMode(ctx.returnMode);
                        toast({ title: "Linked to planner", description: `${ctx.mealName} resolved.` });
                      },
                      onError: () => {
                        toast({ title: "Failed to link recipe", variant: "destructive" });
                      },
                    });
                  }}
                >
                  Link
                </ToastAction>
              ),
            });
          }
        }}
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
                      {/* Header row - always visible */}
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
                          {/* Collapse toggle - shown only when result exists */}
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

                      {/* Result body - collapsed by default */}
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

                    {/* Source URL - only for recipe-sourced meals, not shop-bought */}
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
                          navigate(`/analyser?q=${encodeURIComponent(query)}`);
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

      {/* ── Phase 5A: Copy Day Dialog ── */}
      <Dialog open={copyDayOpen} onOpenChange={(v) => { if (!v) { setCopyDayOpen(false); setCopyDaySourceId(null); setCopyDayTargetId(""); } }}>
        <DialogContent className="max-w-sm" data-testid="dialog-copy-day">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Copy Day
            </DialogTitle>
            <DialogDescription>
              Copy all meals from {copyDaySourceId ? DAY_NAMES[sortedDays.find((d) => d.id === copyDaySourceId)?.dayOfWeek ?? 0] : "this day"} to another day.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Select value={copyDayTargetId} onValueChange={setCopyDayTargetId}>
              <SelectTrigger data-testid="select-copy-day-target">
                <SelectValue placeholder="Select target day" />
              </SelectTrigger>
              <SelectContent>
                {sortedDays
                  .filter((d) => d.id !== copyDaySourceId)
                  .map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {DAY_NAMES[d.dayOfWeek]}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setCopyDayOpen(false); setCopyDaySourceId(null); setCopyDayTargetId(""); }}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!copyDayTargetId || copyDayMutation.isPending}
              onClick={() => {
                if (copyDaySourceId && copyDayTargetId) {
                  copyDayMutation.mutate({ sourceDayId: copyDaySourceId, targetDayId: Number(copyDayTargetId) });
                }
              }}
              data-testid="button-copy-day-confirm"
            >
              {copyDayMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
              Copy Day
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Phase 5A: Clear Slot Confirmation Dialog ── */}
      <Dialog open={clearSlotConfirm !== null} onOpenChange={(v) => { if (!v) setClearSlotConfirm(null); }}>
        <DialogContent className="max-w-sm" data-testid="dialog-clear-slot">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" />
              Clear Slot
            </DialogTitle>
            <DialogDescription>
              Remove all meals from {clearSlotConfirm?.dayName} {clearSlotConfirm?.slotLabel}? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button variant="outline" size="sm" onClick={() => setClearSlotConfirm(null)} data-testid="button-clear-slot-cancel">
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={clearSlotMutation.isPending}
              onClick={() => { if (clearSlotConfirm) clearSlotMutation.mutate(clearSlotConfirm); }}
              data-testid="button-clear-slot-confirm"
            >
              {clearSlotMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
              Clear Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scan review dialog: only shown when not routed to the panel */}
      <PlannerScanReview
        open={plannerScanOpen && assistantMode === null}
        onOpenChange={handlePlannerScanOpenChange}
        scanData={plannerScanData}
        scanning={plannerScanLoading}
        scanError={plannerScanError ?? undefined}
        plannerDays={plannerDays}
        onSaved={() => qc.invalidateQueries({ queryKey: ["/api/planner/full"] })}
      />

      {/* Page-level file input for scan upload — must live outside all panels/portals */}
      <input
        ref={pageUploadRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handlePlannerScanFile(f);
          e.target.value = "";
        }}
        data-testid="input-planner-scan-file"
      />
    </div>
    </>
    </PlannerWorkspaceContext.Provider>
  );
}
