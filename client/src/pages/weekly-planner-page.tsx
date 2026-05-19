import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import thaAppleSrc from "@/assets/icons/tha-apple.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, Coffee, Sun, Moon, Cookie, Search, Loader2, ChefHat, ShoppingBasket, Copy, Calendar, CalendarDays, UtensilsCrossed, Snowflake, Settings, Baby, PersonStanding, Wine, LayoutGrid, Share2, LayoutList, Flame, Pencil, ExternalLink, AlertTriangle, ShoppingCart, ChevronLeft, ChevronRight, Trash2, Sparkles, Lock, DollarSign, Shield, Fish, Beef, Salad, HelpCircle, ChevronDown, ChevronUp, RefreshCw, Microscope, Wheat, Droplets, Droplet, Globe, Utensils, Package, Store, Users, Wand2, Camera, BookOpen, MoreHorizontal, Check, GripVertical } from "lucide-react";
import { CreateMealModal } from "@/components/create-meal-modal";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { usePlannerContext } from "@/contexts/PlannerContext";
import { PlannerWorkspaceContext } from "@/contexts/PlannerWorkspaceContext";
import { useSmartSuggest } from "@/hooks/use-smart-suggest";
import { usePlannerScan } from "@/hooks/use-planner-scan";
import { usePlannerOperations } from "@/hooks/use-planner-operations";
import { PlannerAssistantPanel } from "@/components/PlannerAssistantPanel";
import type { ResolveTarget, PlaceholderItem } from "@/components/PlannerAssistantPanel";
import { SmartReviewPanelContent } from "@/components/SmartReviewPanelContent";
import type { FullDay, FullWeek, SmartCandidate, MealExplanation, SmartSuggestEntry, SmartSuggestResult } from "@/lib/planner-types";
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
import { MealUpliftPanel, UpliftCardIndicator } from "@/components/MealUpliftPanel";
import type { UpliftMatchResult } from "@/components/MealUpliftPanel";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { api } from "@shared/routes";
import type { PlannerWeek, PlannerDay, PlannerEntry, Meal, FreezerMeal, Nutrition, MealCategory, WeekEaterOverride } from "@shared/schema";
import type { HouseholdEater, GuestEater } from "@shared/household-eater";
import type { AdaptationResult, HouseholdSafePreview } from "@shared/meal-adaptation";
import { ONBOARDING_DIET_OPTIONS, DIET_PATTERN_OPTIONS, ALLERGY_INTOLERANCE_OPTIONS } from "@/lib/diets";
import { PageHeader } from "@/components/PageHeader";
import { AdaptationReviewSheet } from "@/components/AdaptationReviewSheet";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  pointerWithin,
  type CollisionDetection,
  type Modifier,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { DroppablePlannerCell, SortablePlannerEntry, MobileSortableMealEntry, MobileDayDropTarget, type DragItemData, type DropZoneData } from "@/components/PlannerDragDrop";

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

// Use pointer coordinates to detect day-nav drops (so finger-over-day triggers reliably),
// then fall back to closestCenter for slot/entry targets.
const mobileFriendlyCollision: CollisionDetection = (args) => {
  const dayNavContainers = args.droppableContainers.filter(
    (c) => String(c.id).startsWith("mobile-day-nav-"),
  );
  if (dayNavContainers.length > 0 && args.pointerCoordinates) {
    const hits = pointerWithin({ ...args, droppableContainers: dayNavContainers });
    if (hits.length > 0) return hits;
  }
  return closestCenter(args);
};

// DragOverlay modifier: snap the overlay center to the initial touch/pointer position so
// the lifted card appears under the user's finger regardless of where on the card they grabbed.
// X is viewport-clamped so the overlay never slides off-screen when dragging to edge day tabs.
const snapOverlayToCursor: Modifier = ({ activatorEvent, activeNodeRect, overlayNodeRect, transform }) => {
  if (!activatorEvent || !activeNodeRect) return transform;
  let initX: number, initY: number;
  if ("changedTouches" in activatorEvent) {
    const touch = (activatorEvent as TouchEvent).changedTouches[0];
    if (!touch) return transform;
    initX = touch.clientX;
    initY = touch.clientY;
  } else {
    initX = (activatorEvent as MouseEvent).clientX;
    initY = (activatorEvent as MouseEvent).clientY;
  }
  const w = overlayNodeRect?.width ?? activeNodeRect.width;
  const h = overlayNodeRect?.height ?? activeNodeRect.height;
  // Center on finger; clamp X so overlay stays fully inside the viewport
  const rawX = transform.x + (initX - activeNodeRect.left - w / 2);
  const clampedX =
    typeof window !== "undefined"
      ? Math.max(
          -activeNodeRect.left,
          Math.min(window.innerWidth - w - activeNodeRect.left, rawX),
        )
      : rawX;
  return {
    ...transform,
    x: clampedX,
    y: transform.y + (initY - activeNodeRect.top - h / 2),
  };
};

// ── Phase B: Resolve workflow session persistence ──────────────────────────────
const RESOLVE_TARGET_KEY = "planner:resolve-target";
const RESOLUTION_CTX_KEY = "planner:resolution-context";
const ACTIVE_WEEK_KEY = "planner:active-week";

type ResolutionContext = ResolveTarget & { returnMode: "placeholder-review" | null };

function isValidResolveTarget(v: unknown): v is ResolveTarget {
  if (!v || typeof v !== "object") return false;
  const t = v as Record<string, unknown>;
  return (
    typeof t.mealName === "string" && typeof t.dayName === "string" &&
    typeof t.slotLabel === "string" && typeof t.entryId === "number" &&
    typeof t.dayId === "number" && typeof t.mealType === "string" &&
    typeof t.audience === "string" && typeof t.isDrink === "boolean" &&
    typeof t.position === "number"
  );
}

function isValidResolutionContext(v: unknown): v is ResolutionContext {
  if (!isValidResolveTarget(v)) return false;
  const obj = v as { returnMode?: unknown };
  return obj.returnMode === "placeholder-review" || obj.returnMode === null;
}

function loadFromSession<T>(key: string, validate: (v: unknown) => v is T): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (validate(parsed)) return parsed;
    sessionStorage.removeItem(key);
    return null;
  } catch { sessionStorage.removeItem(key); return null; }
}

function saveToSession(key: string, value: unknown): void {
  try {
    if (value === null || value === undefined) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// Phase 1 execution lifecycle: cooked-state helpers (localStorage, no schema migration needed)
const COOKED_ENTRIES_KEY = "planner:cooked-entries";

function loadCookedEntries(): Set<number> {
  try {
    const raw = localStorage.getItem(COOKED_ENTRIES_KEY);
    if (!raw) return new Set();
    const arr: unknown = JSON.parse(raw);
    if (Array.isArray(arr)) return new Set(arr.filter((x): x is number => typeof x === "number"));
    return new Set();
  } catch { return new Set(); }
}

function saveCookedEntries(ids: Set<number>): void {
  try {
    localStorage.setItem(COOKED_ENTRIES_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

export default function WeeklyPlannerPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeWeek, setActiveWeek] = useState<string>(() => {
    const stored = loadFromSession(ACTIVE_WEEK_KEY, (v): v is string =>
      typeof v === "string" && /^[1-9]\d*$/.test(v)
    );
    return stored ?? "1";
  });
  const [renameWeekId, setRenameWeekId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [clearWeekId, setClearWeekId] = useState<number | null>(null);
  const [createMealOpen, setCreateMealOpen] = useState(false);
  const [mobileAssistantOpen, setMobileAssistantOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<EntryTarget | null>(null);
  const [sharePlanOpen, setSharePlanOpen] = useState(false);
  const [expandedDayId, setExpandedDayId] = useState<number | null>(null);
  const [expandedDayLabel, setExpandedDayLabel] = useState("");
  const [mealDetail, setMealDetail] = useState<MealDetailState | null>(null);
  const [resolveTarget, setResolveTarget] = useState<ResolveTarget | null>(
    () => loadFromSession(RESOLVE_TARGET_KEY, isValidResolveTarget)
  );
  // Phase 5E: deferred recipe-link confirmation
  type PendingRecipeLink = { entryId: number; mealId: number; targetName: string; recipeName: string; returnToReview: boolean };
  const [pendingRecipeLink, setPendingRecipeLink] = useState<PendingRecipeLink | null>(null);
  // Phase B: resolutionContext persists placeholder context across build/scan workflow transitions
  const [resolutionContext, setResolutionContext] = useState<ResolutionContext | null>(
    () => loadFromSession(RESOLUTION_CTX_KEY, isValidResolutionContext)
  );
  const [mobileDayIndex, setMobileDayIndex] = useState(0);
  const [mobileQuickAdd, setMobileQuickAdd] = useState<{ dayId: number; mealType: string } | null>(null);
  const [mobileQuickAddName, setMobileQuickAddName] = useState("");
  const [activeDrag, setActiveDrag] = useState<DragItemData | null>(null);
  // Phase A: proposal ID most recently dropped from the assistant tray onto the grid
  const [consumedProposalId, setConsumedProposalId] = useState<string | null>(null);
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
  // Long-press contextual action sheet (mobile)
  const [contextEntry, setContextEntry] = useState<{
    entry: PlannerEntry;
    meal: Meal;
    dayId: number;
    dayName: string;
    slotLabel: string;
    mealType: string;
    audience: string;
    isDrink: boolean;
  } | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressMovedRef = useRef(false);
  // Mobile cross-day drag: timer to switch day when hovering a day header during drag
  const mobileDragDayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobileDragDayTargetRef = useRef<number>(-1);
  // Preserve drag data across day-switch unmounts + track intended cross-day destination
  const activeDragDataRef = useRef<DragItemData | null>(null);
  const dragTargetDayIdRef = useRef<number | null>(null);
  // Phase B: guard so stale-target validation only runs once after planner data first loads
  const resolveTargetValidatedRef = useRef(false);
  // Active-week restore: guard so invalid-week correction only runs once after first load
  const activeWeekValidatedRef = useRef(false);
  const { user } = useUser();
  const [, navigate] = useLocation();

  // Phase 1: cooked state (localStorage-backed, reversible, no schema change)
  const [cookedEntryIds, setCookedEntryIds] = useState<Set<number>>(() => loadCookedEntries());
  // Phase 1: mobile move-to-day sheet target
  const [moveEntryTarget, setMoveEntryTarget] = useState<{
    entry: PlannerEntry;
    mealType: string;
    audience: string;
    isDrink: boolean;
  } | null>(null);

  // Track mealIds that received accepted uplift in this session (for immediate card feedback).
  const [boostedMealIds, setBoostedMealIds] = useState<Set<number>>(new Set());
  const handleUpliftAccepted = (mealId: number) =>
    setBoostedMealIds(prev => new Set(Array.from(prev).concat(mealId)));
  const handleUpliftRemoved = (mealId: number) =>
    setBoostedMealIds(prev => { const next = new Set(Array.from(prev)); next.delete(mealId); return next; });

  const dndSensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Cleanup long-press timer on unmount
  useEffect(() => {
    return () => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); };
  }, []);

  // Dismiss mobile quick-add when navigating to a different day
  useEffect(() => {
    setMobileQuickAdd(null);
    setMobileQuickAddName("");
  }, [mobileDayIndex]);

  // Phase B: Persist resolve workflow state to sessionStorage
  useEffect(() => { saveToSession(RESOLVE_TARGET_KEY, resolveTarget); }, [resolveTarget]);
  useEffect(() => { saveToSession(RESOLUTION_CTX_KEY, resolutionContext); }, [resolutionContext]);

  // Persist active week whenever it changes
  useEffect(() => { saveToSession(ACTIVE_WEEK_KEY, activeWeek); }, [activeWeek]);

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

  // Phase B: Once planner data first loads, validate any restored resolveTarget. If the
  // entry no longer exists (deleted/stale), clear both the target and the resolve mode.
  useEffect(() => {
    if (resolveTargetValidatedRef.current || !fullPlanner.length) return;
    resolveTargetValidatedRef.current = true;
    if (!resolveTarget) return;
    const liveEntryIds = new Set(
      fullPlanner.flatMap(w => w.days.flatMap(d => d.entries.map(e => e.id)))
    );
    if (!liveEntryIds.has(resolveTarget.entryId)) {
      saveToSession(RESOLVE_TARGET_KEY, null);
      setResolveTarget(null);
      if (assistantMode === "resolve") setAssistantMode(null);
    }
  }, [fullPlanner, resolveTarget, assistantMode, setAssistantMode]);

  // Once planner data first loads, validate the restored activeWeek. If the stored week
  // no longer exists (deleted or never created), clear stored state and fall back to "1".
  useEffect(() => {
    if (activeWeekValidatedRef.current || !fullPlanner.length) return;
    activeWeekValidatedRef.current = true;
    const valid = fullPlanner.find(w => w.weekNumber === Number(activeWeek));
    if (!valid) {
      saveToSession(ACTIVE_WEEK_KEY, null);
      setActiveWeek("1");
    }
  }, [fullPlanner, activeWeek]);

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

  // ── Nutrition Uplift — async, non-blocking batch fetch ────────────────────────
  // Built from planned meals after planner renders. Never delays planner hydration.
  const upliftBatchMeals = useMemo(() => {
    if (!fullPlanner.length || !meals.length) return [];
    const mealMap = new Map(meals.map(m => [m.id, m]));
    const seen = new Set<number>();
    const batch: { id: number; name: string; ingredients: string[]; mealSlot?: string }[] = [];
    for (const week of fullPlanner) {
      for (const day of week.days) {
        for (const entry of day.entries) {
          if (seen.has(entry.mealId)) continue;
          seen.add(entry.mealId);
          const meal = mealMap.get(entry.mealId);
          if (!meal || meal.mealSourceType === "planner-placeholder") continue;
          batch.push({
            id: meal.id,
            name: meal.name,
            ingredients: meal.ingredients ?? [],
            mealSlot: entry.mealType ?? undefined,
          });
        }
      }
    }
    return batch;
  }, [fullPlanner, meals]);

  const { data: upliftBatchData } = useQuery<{ results: { mealId?: number; matches: UpliftMatchResult[] }[] }>({
    queryKey: ["/api/uplift/batch", upliftBatchMeals.map(m => m.id).sort((a, b) => a - b)],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/uplift/batch", { meals: upliftBatchMeals });
      return res.json();
    },
    enabled: upliftBatchMeals.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const upliftByMealId = useMemo(() => {
    const map = new Map<number, UpliftMatchResult[]>();
    upliftBatchData?.results.forEach(r => {
      if (r.mealId != null) map.set(Number(r.mealId), r.matches);
    });
    return map;
  }, [upliftBatchData]);

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
  // "one" = user chose one household-safe version; "separate" = user chose separate adaptations; null = not yet chosen
  const [householdSafeChoice, setHouseholdSafeChoice] = useState<"one" | "separate" | null>(null);
  const [variantAccepted, setVariantAccepted] = useState(false);
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);

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
      setHouseholdSafeChoice(null);
      setVariantAccepted(false);
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

  const {
    upsertEntryMutation,
    addEntryMutation,
    deleteEntryMutation,
    replacePlaceholderMealMutation,
    movePlannerEntryMutation,
    reorderEntriesMutation,
    duplicateEntryMutation,
    clearWeekMutation,
    clearSlotMutation,
    addToBasketMutation,
    addToFreezerMutation,
    createPlannerIntent,
    handleRepeatTomorrow,
    addDayToBasket,
    addSlotToBasket,
    addAllToBasket,
  } = usePlannerOperations({
    fullPlanner,
    selectedDayId,
    onSlotCleared: () => setClearSlotConfirm(null),
    onWeekCleared: () => setClearWeekId(null),
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

  const getMeal = (id: number | null): Meal | undefined => {
    if (!id) return undefined;
    return meals.find((m) => m.id === id);
  };

  // Phase 4A: drag/drop handlers
  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragItemData | undefined;
    if (data?.type === "planner-entry" || data?.type === "proposal-card") {
      setActiveDrag(data);
      activeDragDataRef.current = data;
    }
    dragTargetDayIdRef.current = null;
  }

  // Mobile: switch day when drag hovers over a day-nav button (300ms dwell to avoid accidental switches)
  function handleDragOver(event: DragOverEvent) {
    const overData = event.over?.data.current as (DragItemData | DropZoneData) | undefined;
    if (overData?.type === "mobile-day-nav") {
      const targetIdx = overData.dayIndex;
      // Track the intended destination day so handleDragEnd can use it even after
      // setMobileDayIndex unmounts the source day's draggable component.
      dragTargetDayIdRef.current = overData.dayId;
      if (mobileDragDayTimerRef.current !== null && mobileDragDayTargetRef.current === targetIdx) return;
      if (mobileDragDayTimerRef.current !== null) clearTimeout(mobileDragDayTimerRef.current);
      mobileDragDayTargetRef.current = targetIdx;
      mobileDragDayTimerRef.current = setTimeout(() => {
        mobileDragDayTimerRef.current = null;
        mobileDragDayTargetRef.current = -1;
        setMobileDayIndex(targetIdx);
      }, 300);
    } else {
      if (mobileDragDayTimerRef.current !== null) {
        clearTimeout(mobileDragDayTimerRef.current);
        mobileDragDayTimerRef.current = null;
      }
      mobileDragDayTargetRef.current = -1;
      // Only clear the target day if we're now over a concrete droppable (slot/entry on a
      // different day) — if over nothing, keep the last known target so drop still works.
      if (overData?.type === "planner-slot" || overData?.type === "planner-entry") {
        dragTargetDayIdRef.current = null;
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    if (mobileDragDayTimerRef.current !== null) {
      clearTimeout(mobileDragDayTimerRef.current);
      mobileDragDayTimerRef.current = null;
    }
    mobileDragDayTargetRef.current = -1;
    setActiveDrag(null);

    const { active, over } = event;

    // When the user drags a mobile meal to a different day, setMobileDayIndex fires mid-drag
    // and unmounts the source day's MobileSortableMealEntry. dnd-kit then returns an empty
    // default object for active.data.current. Use activeDragDataRef as the authoritative
    // source of drag data so cross-day drops still resolve correctly.
    const dragData =
      (active.data.current as DragItemData | undefined)?.type
        ? (active.data.current as DragItemData)
        : activeDragDataRef.current ?? undefined;
    activeDragDataRef.current = null;

    // If the pointer landed over nothing but we tracked an intended day, treat it as a
    // day-nav drop so the meal still moves.
    const trackedTargetDayId = dragTargetDayIdRef.current;
    dragTargetDayIdRef.current = null;

    if (!over) {
      // No droppable under finger — use trackedTargetDayId as fallback cross-day destination.
      if (trackedTargetDayId !== null && dragData?.type === "planner-entry" && dragData.dayId !== trackedTargetDayId) {
        const allEntries = fullPlanner.flatMap((w) => w.days).flatMap((d) => d.entries);
        const targetEntries = allEntries.filter(
          (e) => e.dayId === trackedTargetDayId && e.mealType === dragData.mealType &&
                 !e.isDrink === !dragData.isDrink && e.id !== dragData.entryId,
        );
        const newPosition = targetEntries.length > 0 ? Math.max(...targetEntries.map((e) => e.position)) + 1 : 0;
        movePlannerEntryMutation.mutate({
          entryId: dragData.entryId,
          dayId: trackedTargetDayId,
          mealType: dragData.mealType,
          position: newPosition,
        });
        const targetIdx = sortedDays.findIndex((d) => d.id === trackedTargetDayId);
        if (targetIdx !== -1) setMobileDayIndex(targetIdx);
      }
      return;
    }

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
      // Phase A: remove this proposal from the persistent tray
      setConsumedProposalId(dragData.proposalId);
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
    } else if (overData.type === "mobile-day-nav") {
      // Mobile: dropped directly on a day header — move to same slot on that day
      if (dragData.type !== "planner-entry") return;
      const targetDayId = overData.dayId;
      if (dragData.dayId === targetDayId) return;
      const allEntries = fullPlanner.flatMap((w) => w.days).flatMap((d) => d.entries);
      const targetEntries = allEntries.filter(
        (e) => e.dayId === targetDayId && e.mealType === dragData.mealType &&
               !e.isDrink === !dragData.isDrink && e.id !== dragData.entryId,
      );
      const newPosition = targetEntries.length > 0 ? Math.max(...targetEntries.map((e) => e.position)) + 1 : 0;
      movePlannerEntryMutation.mutate({
        entryId: dragData.entryId,
        dayId: targetDayId,
        mealType: dragData.mealType,
        position: newPosition,
      });
      const targetIdx = sortedDays.findIndex((d) => d.id === targetDayId);
      if (targetIdx !== -1) setMobileDayIndex(targetIdx);
    }
  }

  function handleDragCancel() {
    if (mobileDragDayTimerRef.current !== null) {
      clearTimeout(mobileDragDayTimerRef.current);
      mobileDragDayTimerRef.current = null;
    }
    mobileDragDayTargetRef.current = -1;
    activeDragDataRef.current = null;
    dragTargetDayIdRef.current = null;
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

  const handleResolveAction = (action: "build" | "scan" | "later") => {
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

  const sortedDays = activeWeekData?.days?.slice().sort((a, b) => {
    const aIdx = MONDAY_FIRST_ORDER.indexOf(a.dayOfWeek);
    const bIdx = MONDAY_FIRST_ORDER.indexOf(b.dayOfWeek);
    return aIdx - bIdx;
  }) || [];

  const getNextDay = (currentDayId: number): FullDay | undefined => {
    const idx = sortedDays.findIndex((d) => d.id === currentDayId);
    if (idx < 0 || idx >= sortedDays.length - 1) return undefined;
    return sortedDays[idx + 1];
  };

  // Phase 1: all planner days sorted for the move-to-day picker
  const allPlannerDays = useMemo(() => {
    return fullPlanner
      .slice()
      .sort((a, b) => a.weekNumber - b.weekNumber)
      .flatMap(week =>
        (week.days ?? [])
          .slice()
          .sort((a, b) => MONDAY_FIRST_ORDER.indexOf(a.dayOfWeek) - MONDAY_FIRST_ORDER.indexOf(b.dayOfWeek))
          .map(day => ({ week, day }))
      );
  }, [fullPlanner]);

  // Phase 1: toggle cooked state for an entry
  const toggleCooked = (entryId: number) => {
    setCookedEntryIds(prev => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId); else next.add(entryId);
      saveCookedEntries(next);
      return next;
    });
  };

  // Phase 1: duplicate this meal into the same day-of-week slot next week
  const handleDuplicateNextWeek = (entry: PlannerEntry) => {
    const currentDay = fullPlanner.flatMap(w => w.days).find(d => d.id === entry.dayId);
    if (!currentDay) return;
    const currentWeek = fullPlanner.find(w => w.days.some(d => d.id === entry.dayId));
    if (!currentWeek) return;
    const nextWeek = fullPlanner.find(w => w.weekNumber === currentWeek.weekNumber + 1);
    if (!nextWeek) {
      toast({ title: "No next week", description: "Add another week to the planner first." });
      return;
    }
    const targetDay = nextWeek.days.find(d => d.dayOfWeek === currentDay.dayOfWeek);
    if (!targetDay) {
      toast({ title: "Day not set up in next week" });
      return;
    }
    duplicateEntryMutation.mutate({ entryId: entry.id, targetDayId: targetDay.id });
    toast({ title: "Copied to next week", description: `${DAY_NAMES[currentDay.dayOfWeek]} · ${nextWeek.weekName}` });
  };

  // Phase 1: move entry to a chosen day (reuses movePlannerEntryMutation)
  const handleMoveToDay = (entry: PlannerEntry, targetDayId: number, mealType: string) => {
    const targetDay = fullPlanner.flatMap(w => w.days).find(d => d.id === targetDayId);
    const slotEntries = (targetDay?.entries ?? []).filter(
      e => e.mealType === mealType && e.audience === entry.audience &&
           e.isDrink === entry.isDrink && e.id !== entry.id
    );
    const newPosition = slotEntries.length > 0 ? Math.max(...slotEntries.map(e => e.position)) + 1 : 0;
    movePlannerEntryMutation.mutate({ entryId: entry.id, dayId: targetDayId, mealType, position: newPosition });
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
        <div className="flex flex-wrap items-center gap-0.5 sm:gap-1">
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
              <SelectTrigger className="w-24 sm:w-28 h-8 text-sm" data-testid="tabs-weeks">
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
          {/* Mobile: Plan hub trigger — standard button styling */}
          <Button
            size="sm"
            className="px-2.5 text-xs md:hidden"
            onClick={() => setMobileAssistantOpen(true)}
            data-testid="button-mobile-assistant-hub"
          >
            <Sparkles className="mr-1 h-3 w-3" />
            Plan
          </Button>
          {/* Desktop: Smart planner trigger */}
          <Button
            size="sm"
            className="hidden md:inline-flex px-2.5 text-xs"
            onClick={() => setAssistantMode("smart")}
            disabled={smartLoading}
            data-testid="button-plan-my-week"
          >
            {smartLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
            {smartLoading ? "Planning…" : "Plan"}
          </Button>
          <Button size="sm" variant="outline" className="hidden md:inline-flex px-2.5 text-xs" onClick={() => setCreateMealOpen(true)} data-testid="button-create-meal">
            <Utensils className="h-3 w-3 mr-1" />
            Create Meal
          </Button>
          <Button size="sm" variant="outline" className="px-2.5 text-xs" onClick={() => addAllToBasket(sortedDays)} disabled={addToBasketMutation.isPending} data-testid="button-add-all-basket">
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
                className="inline-flex items-center justify-center h-8 w-8 md:w-auto md:min-h-8 md:px-2 rounded-md md:border md:border-border/60 transition-colors hover:bg-accent/60 md:hover:bg-accent/40 shrink-0"
                title="More options"
                data-testid="button-planner-overflow-menu"
              >
                <img src={thaAppleSrc} alt="" className="h-7 w-7 object-contain" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => setAssistantMode("scan")} data-testid="button-planner-scan-overflow">
                <Camera className="h-4 w-4 mr-2" />
                Scan planner
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAssistantMode("templates")} data-testid="button-open-templates">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Templates
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
        collisionDetection={mobileFriendlyCollision}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
      <div className="flex gap-3 items-start">
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
              <FirstVisitHint
                areaKey="planner-long-press"
                message="Tip: Long press a meal for quick actions — duplicate, repeat, freeze or remove."
                className="mb-3"
              />
              {/* Horizontal day row — also droppable for cross-day drag */}
              <div className="mb-3">
                <div className="flex items-center gap-1">
                  {sortedDays.map((day, idx) => (
                    <MobileDayDropTarget
                      key={day.id}
                      dayId={day.id}
                      dayIndex={idx}
                      isSelected={idx === mobileDayIndex}
                      label={DAY_NAMES[day.dayOfWeek].slice(0, 3)}
                      onClick={() => setMobileDayIndex(idx)}
                    />
                  ))}
                  {sortedDays[mobileDayIndex] && (
                    <div className="flex-shrink-0 pl-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent/40" title="Day actions" data-testid="button-mobile-day-actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => { setCopyDaySourceId(sortedDays[mobileDayIndex].id); setCopyDayTargetId(""); setCopyDayOpen(true); }}
                            data-testid="button-mobile-copy-day"
                          >
                            <Copy className="h-3.5 w-3.5 mr-2" />
                            Copy this day
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
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
                        <DroppablePlannerCell
                          key={row.id}
                          dayId={mobileDay.id}
                          mealType={row.mealType ?? row.addMealType}
                          audience={row.audience}
                          isDrink={row.isDrink}
                          idPrefix="mobile-slot"
                          className="p-3 flex flex-col gap-1.5"
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <RowIcon className={`h-3.5 w-3.5 flex-shrink-0 ${row.iconColor}`} />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{row.label}</span>
                          </div>
                          <SortableContext
                            items={cellEntries.map(e => `mobile-entry-${e.id}`)}
                            strategy={verticalListSortingStrategy}
                          >
                            {cellEntries.map((entry) => {
                              const meal = getMeal(entry.mealId);
                              if (!meal) return null;
                              const isPlaceholder = meal.mealSourceType === "planner-placeholder";
                              const isFrozen = freezerMeals.some(f => f.mealId === meal.id && f.remainingPortions > 0);
                              const isCooked = cookedEntryIds.has(entry.id);
                              return (
                                <MobileSortableMealEntry
                                  key={entry.id}
                                  entry={entry}
                                  dayId={mobileDay.id}
                                  mealType={row.mealType ?? row.addMealType}
                                  audience={row.audience}
                                  isDrink={row.isDrink}
                                >
                                  <button
                                    className={`w-full text-left text-sm transition-colors flex items-start gap-1.5 select-none ${isCooked ? "opacity-50" : ""} ${isPlaceholder ? "text-muted-foreground/70" : "text-foreground hover:text-primary"}`}
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
                                    onTouchStart={() => {
                                      longPressMovedRef.current = false;
                                      longPressTimerRef.current = setTimeout(() => {
                                        if (!longPressMovedRef.current) {
                                          setContextEntry({ entry, meal, dayId: mobileDay.id, dayName: DAY_NAMES[mobileDay.dayOfWeek], slotLabel: row.label, mealType: row.mealType ?? row.addMealType, audience: row.audience, isDrink: row.isDrink });
                                        }
                                      }, 500);
                                    }}
                                    onTouchMove={() => {
                                      longPressMovedRef.current = true;
                                      if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
                                    }}
                                    onTouchEnd={() => {
                                      if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
                                    }}
                                    data-testid={`button-mobile-meal-${row.id}-${entry.id}`}
                                  >
                                    <div className={`flex-1 min-w-0 flex flex-col gap-0.5 ${isPlaceholder ? "border border-dashed border-muted-foreground/30 rounded px-1.5 py-0.5" : ""}`}>
                                      <span className={`leading-snug ${isCooked ? "line-through" : ""}`}>{meal.name}</span>
                                      {isPlaceholder
                                        ? <span className="text-[10px] text-muted-foreground/60 italic" data-testid={`label-placeholder-mobile-${entry.id}`}>Needs recipe</span>
                                        : isCooked
                                          ? <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">Cooked</span>
                                          : <NutritionVarietyDots score={computeMealVariety(meal.ingredients ?? [])} />
                                      }
                                    </div>
                                    {isFrozen && !isCooked && <Snowflake className="h-3 w-3 text-blue-400 flex-shrink-0 mt-0.5" />}
                                    {basketMealIdSet.has(meal.id) && !isCooked && <ShoppingCart className="h-3 w-3 text-emerald-500/70 flex-shrink-0 mt-0.5" />}
                                    {isCooked && <Check className="h-3 w-3 text-emerald-500/70 flex-shrink-0 mt-0.5" />}
                                  </button>
                                </MobileSortableMealEntry>
                              );
                            })}
                          </SortableContext>
                          <div className="flex flex-col gap-1 mt-0.5">
                            <div className="flex items-center gap-2">
                              <button
                                className="text-xs text-muted-foreground/50 hover:text-primary transition-colors flex items-center gap-1"
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
                              {!row.isDrink && (
                                <>
                                  <span className="text-muted-foreground/25 text-xs select-none">·</span>
                                  <button
                                    className="text-xs text-muted-foreground/40 hover:text-primary transition-colors"
                                    onClick={() => {
                                      const isOpen = mobileQuickAdd?.dayId === mobileDay.id && mobileQuickAdd?.mealType === row.addMealType;
                                      if (isOpen) {
                                        setMobileQuickAdd(null);
                                        setMobileQuickAddName("");
                                      } else {
                                        setMobileQuickAdd({ dayId: mobileDay.id, mealType: row.addMealType });
                                        setMobileQuickAddName("");
                                      }
                                    }}
                                    data-testid={`button-mobile-name-meal-${row.id}`}
                                  >
                                    Name meal, recipe later
                                  </button>
                                </>
                              )}
                            </div>
                            {mobileQuickAdd?.dayId === mobileDay.id && mobileQuickAdd?.mealType === row.addMealType && (
                              <form
                                className="flex items-center gap-1.5"
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  const name = mobileQuickAddName.trim();
                                  if (!name) return;
                                  await createPlannerIntent(name, row.addMealType, mobileDay.id);
                                  setMobileQuickAdd(null);
                                  setMobileQuickAddName("");
                                }}
                              >
                                <Input
                                  autoFocus
                                  value={mobileQuickAddName}
                                  onChange={(e) => setMobileQuickAddName(e.target.value)}
                                  placeholder="e.g. Fish cakes"
                                  className="h-7 text-xs flex-1 min-w-0"
                                  data-testid={`input-mobile-name-meal-${row.id}`}
                                />
                                <button
                                  type="submit"
                                  disabled={!mobileQuickAddName.trim()}
                                  className="h-7 w-7 flex items-center justify-center bg-primary text-primary-foreground rounded-md disabled:opacity-40 flex-shrink-0"
                                  data-testid={`button-mobile-name-meal-submit-${row.id}`}
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setMobileQuickAdd(null); setMobileQuickAddName(""); }}
                                  className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md flex-shrink-0"
                                  data-testid={`button-mobile-name-meal-cancel-${row.id}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </form>
                            )}
                          </div>
                        </DroppablePlannerCell>
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
              <div style={{ minWidth: "900px" }}>
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
                                    onClick={() => addSlotToBasket(row.mealType!, sortedDays)}
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
                                  const isCooked = cookedEntryIds.has(entry.id);
                                  return (
                                    <SortablePlannerEntry
                                      key={entry.id}
                                      entry={entry}
                                      dayId={day.id}
                                      mealType={row.mealType ?? row.addMealType}
                                      audience={row.audience}
                                      isDrink={row.isDrink}
                                    >
                                      <div className={`relative group/entry w-full transition-opacity ${isCooked ? "opacity-50" : ""}`}>
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
                                            <span className={`break-words leading-tight pr-3 ${isCooked ? "line-through" : ""}`}>{meal.name}</span>
                                            {isPlaceholder && (
                                              <span className="text-[9px] text-muted-foreground/60 italic" data-testid={`label-placeholder-${entry.id}`}>Needs recipe</span>
                                            )}
                                            {!isPlaceholder && !isCooked && <NutritionVarietyDots score={computeMealVariety(meal.ingredients ?? [])} />}
                                            {isCooked && <span className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70">Cooked</span>}
                                          </div>
                                          {isFrozen && !isCooked && <Snowflake className="h-2.5 w-2.5 text-blue-400 flex-shrink-0 mt-0.5" />}
                                          {basketMealIdSet.has(meal.id) && !isCooked && (
                                            <ShoppingCart className="h-2.5 w-2.5 text-emerald-500/70 flex-shrink-0 mt-0.5" data-testid={`icon-in-basket-${meal.id}`} />
                                          )}
                                          {isCooked && <Check className="h-2.5 w-2.5 text-emerald-500/70 flex-shrink-0 mt-0.5" />}
                                        </button>
                                        {/* Nutrition Boost indicator — subtle, async, non-blocking */}
                                        {!isPlaceholder && (() => {
                                          const isBoosted = boostedMealIds.has(meal.id);
                                          const matches = upliftByMealId.get(meal.id) ?? [];
                                          const suggestionCount = matches.flatMap(m => m.suggestions).length;
                                          if (isBoosted) {
                                            return (
                                              <button
                                                className="flex items-center gap-0.5 text-[10px] text-emerald-600/70 leading-none mt-0.5"
                                                onClick={(e) => { e.stopPropagation(); setMealDetail({ entry, meal, dayId: day.id, mealType: row.mealType ?? row.addMealType, audience: row.audience, isDrink: row.isDrink, dayName: DAY_NAMES[day.dayOfWeek], slotLabel: row.label }); }}
                                                title="Nutrition boost applied"
                                                data-testid={`uplift-boosted-${meal.id}`}
                                              >
                                                <Check className="h-2.5 w-2.5 shrink-0" />
                                                <span>Boosted</span>
                                              </button>
                                            );
                                          }
                                          if (suggestionCount === 0) return null;
                                          return (
                                            <UpliftCardIndicator
                                              suggestionCount={Math.min(suggestionCount, 2)}
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
                                            />
                                          );
                                        })()}
                                        {/* Phase 5A + Phase 1 execution: entry operations menu */}
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
                                          <DropdownMenuContent align="end" className="w-52">
                                            {/* Phase 1A: Mark cooked */}
                                            {!isPlaceholder && (
                                              <DropdownMenuItem
                                                onClick={() => toggleCooked(entry.id)}
                                                data-testid={`mi-cooked-${entry.id}`}
                                              >
                                                <Check className={`h-3.5 w-3.5 mr-2 ${isCooked ? "text-emerald-500" : "text-muted-foreground"}`} />
                                                {isCooked ? "Unmark cooked" : "Mark as cooked"}
                                              </DropdownMenuItem>
                                            )}
                                            {!isPlaceholder && <DropdownMenuSeparator />}
                                            {!isPlaceholder && (
                                              <DropdownMenuItem onClick={() => duplicateEntryMutation.mutate({ entryId: entry.id })} data-testid={`mi-dup-${entry.id}`}>
                                                <Copy className="h-3.5 w-3.5 mr-2" />
                                                Duplicate here
                                              </DropdownMenuItem>
                                            )}
                                            {!isPlaceholder && getNextDay(day.id) && (
                                              <DropdownMenuItem onClick={() => handleRepeatTomorrow(entry, day.id, sortedDays)} data-testid={`mi-repeat-${entry.id}`}>
                                                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                                                Repeat tomorrow
                                              </DropdownMenuItem>
                                            )}
                                            {/* Phase 1C: Duplicate next week */}
                                            {!isPlaceholder && (
                                              <DropdownMenuItem onClick={() => handleDuplicateNextWeek(entry)} data-testid={`mi-next-week-${entry.id}`}>
                                                <CalendarDays className="h-3.5 w-3.5 mr-2" />
                                                Duplicate next week
                                              </DropdownMenuItem>
                                            )}
                                            {isPlaceholder && (
                                              <DropdownMenuItem onClick={() => duplicateEntryMutation.mutate({ entryId: entry.id })}>
                                                <Copy className="h-3.5 w-3.5 mr-2" />
                                                Duplicate placeholder
                                              </DropdownMenuItem>
                                            )}
                                            {/* Phase 1B: Move to another day */}
                                            <DropdownMenuSub>
                                              <DropdownMenuSubTrigger data-testid={`mi-move-day-${entry.id}`}>
                                                <Calendar className="h-3.5 w-3.5 mr-2" />
                                                Move to day
                                              </DropdownMenuSubTrigger>
                                              <DropdownMenuSubContent className="w-48 max-h-64 overflow-y-auto">
                                                {allPlannerDays
                                                  .filter(({ day: d }) => d.id !== day.id)
                                                  .map(({ week, day: d }) => (
                                                    <DropdownMenuItem
                                                      key={d.id}
                                                      onClick={() => handleMoveToDay(entry, d.id, row.mealType ?? row.addMealType)}
                                                      data-testid={`mi-move-to-${entry.id}-${d.id}`}
                                                    >
                                                      <span className="text-[10px] text-muted-foreground mr-1.5 shrink-0">{week.weekName}</span>
                                                      {DAY_NAMES[d.dayOfWeek]}
                                                    </DropdownMenuItem>
                                                  ))
                                                }
                                              </DropdownMenuSubContent>
                                            </DropdownMenuSub>
                                            <DropdownMenuSeparator />
                                            {/* Phase 1D: Send to shopping */}
                                            {!isPlaceholder && (
                                              <DropdownMenuItem
                                                onClick={() => addToBasketMutation.mutate([{ mealId: meal.id, count: 1 }])}
                                                data-testid={`mi-shopping-${entry.id}`}
                                              >
                                                <ShoppingCart className="h-3.5 w-3.5 mr-2" />
                                                Send to shopping
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
                                              onClick={() => { setExpandedDayId(day.id); setExpandedDayLabel(DAY_NAMES[day.dayOfWeek]); setAssistantMode("day"); }}
                                              data-testid={`mi-open-day-${day.dayOfWeek}`}
                                            >
                                              <LayoutList className="h-3.5 w-3.5 mr-2" />
                                              View day
                                            </DropdownMenuItem>
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
          setMobileAssistantOpen(false);
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
        onSetMode={setAssistantMode}
        onCreateIntent={createPlannerIntent}
        selectedDayLabel={selectedDay ? DAY_NAMES[selectedDay.dayOfWeek] : null}
        onBrowseRecipes={() => setAssistantMode("manual")}
        onBuildRecipe={() => setCreateMealOpen(true)}
        onScanRecipe={() => navigate("/meals?openScan=1")}
        mobileOpen={mobileAssistantOpen}
        onBackToHub={() => {
          if (plannerScanOpen) handlePlannerScanOpenChange(false);
          setResolveTarget(null);
          setAssistantMode(null);
        }}
        consumedProposalId={consumedProposalId}
      />
      </div>{/* end flex gap-3 */}
      <DragOverlay dropAnimation={null} modifiers={[snapOverlayToCursor]}>
        {activeDrag ? (
          <div className="flex items-center gap-2 w-[200px] bg-background border border-primary/70 rounded-lg px-3 py-2 text-sm font-medium shadow-lg opacity-90 cursor-grabbing pointer-events-none">
            <span className="flex-1 truncate">
              {activeDrag.type === "proposal-card"
                ? activeDrag.name
                : getMeal(activeDrag.entry.mealId)?.name ?? "Meal"}
            </span>
            <GripVertical className="h-4 w-4 text-muted-foreground/30 shrink-0" />
          </div>
        ) : null}
      </DragOverlay>
      </DndContext>

      {/* ── Mobile long-press contextual action sheet ── */}
      <Sheet open={!!contextEntry} onOpenChange={(v) => { if (!v) setContextEntry(null); }}>
        <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-8 pt-0" data-testid="sheet-mobile-entry-actions">
          {contextEntry && (() => {
            const isPlaceholder = contextEntry.meal.mealSourceType === "planner-placeholder";
            const isCooked = cookedEntryIds.has(contextEntry.entry.id);
            return (
              <>
                <div className="px-4 pt-5 pb-3 border-b border-border">
                  <p className="text-xs text-muted-foreground mb-0.5">{contextEntry.dayName} · {contextEntry.slotLabel}</p>
                  <p className="text-sm font-semibold text-foreground leading-snug">{contextEntry.meal.name}</p>
                  {isCooked && <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Cooked</p>}
                </div>
                <div className="flex flex-col py-1" role="menu">
                  {/* Phase 1A: Mark cooked */}
                  {!isPlaceholder && (
                    <button className="flex items-center gap-3 px-4 py-3.5 text-sm text-foreground active:bg-accent/60 text-left w-full" role="menuitem" data-testid="button-ctx-cooked"
                      onClick={() => { toggleCooked(contextEntry.entry.id); setContextEntry(null); }}>
                      <Check className={`h-4 w-4 shrink-0 ${isCooked ? "text-emerald-500" : "text-muted-foreground"}`} />
                      {isCooked ? "Unmark cooked" : "Mark as cooked"}
                    </button>
                  )}
                  {!isPlaceholder && (
                    <button className="flex items-center gap-3 px-4 py-3.5 text-sm text-foreground active:bg-accent/60 text-left w-full" role="menuitem" data-testid="button-ctx-duplicate"
                      onClick={() => { duplicateEntryMutation.mutate({ entryId: contextEntry.entry.id }); setContextEntry(null); }}>
                      <Copy className="h-4 w-4 text-muted-foreground shrink-0" />Duplicate here
                    </button>
                  )}
                  {isPlaceholder && (
                    <button className="flex items-center gap-3 px-4 py-3.5 text-sm text-foreground active:bg-accent/60 text-left w-full" role="menuitem" data-testid="button-ctx-duplicate-placeholder"
                      onClick={() => { duplicateEntryMutation.mutate({ entryId: contextEntry.entry.id }); setContextEntry(null); }}>
                      <Copy className="h-4 w-4 text-muted-foreground shrink-0" />Duplicate placeholder
                    </button>
                  )}
                  {!isPlaceholder && getNextDay(contextEntry.dayId) && (
                    <button className="flex items-center gap-3 px-4 py-3.5 text-sm text-foreground active:bg-accent/60 text-left w-full" role="menuitem" data-testid="button-ctx-repeat"
                      onClick={() => { handleRepeatTomorrow(contextEntry.entry, contextEntry.dayId, sortedDays); setContextEntry(null); }}>
                      <RefreshCw className="h-4 w-4 text-muted-foreground shrink-0" />Repeat tomorrow
                    </button>
                  )}
                  {/* Phase 1C: Duplicate next week */}
                  {!isPlaceholder && (
                    <button className="flex items-center gap-3 px-4 py-3.5 text-sm text-foreground active:bg-accent/60 text-left w-full" role="menuitem" data-testid="button-ctx-next-week"
                      onClick={() => { handleDuplicateNextWeek(contextEntry.entry); setContextEntry(null); }}>
                      <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />Duplicate next week
                    </button>
                  )}
                  <div className="h-px bg-border/60 mx-4 my-1" aria-hidden="true" />
                  {/* Phase 1D: Send to shopping */}
                  {!isPlaceholder && (
                    <button className="flex items-center gap-3 px-4 py-3.5 text-sm text-foreground active:bg-accent/60 text-left w-full" role="menuitem" data-testid="button-ctx-shopping"
                      onClick={() => { addToBasketMutation.mutate([{ mealId: contextEntry.meal.id, count: 1 }]); setContextEntry(null); }}>
                      <ShoppingCart className="h-4 w-4 text-muted-foreground shrink-0" />Send to shopping
                    </button>
                  )}
                  {contextEntry.meal.isFreezerEligible && !isPlaceholder && (
                    <button className="flex items-center gap-3 px-4 py-3.5 text-sm text-foreground active:bg-accent/60 text-left w-full" role="menuitem" data-testid="button-ctx-freeze"
                      onClick={() => { addToFreezerMutation.mutate(contextEntry.meal.id); setContextEntry(null); }}>
                      <Snowflake className="h-4 w-4 text-muted-foreground shrink-0" />Add to freezer
                    </button>
                  )}
                  <div className="h-px bg-border/60 mx-4 my-1" aria-hidden="true" />
                  {/* Phase 1B: Move to another day */}
                  <button className="flex items-center gap-3 px-4 py-3.5 text-sm text-foreground active:bg-accent/60 text-left w-full" role="menuitem" data-testid="button-ctx-move-day"
                    onClick={() => {
                      const e = contextEntry;
                      setContextEntry(null);
                      setMoveEntryTarget({ entry: e.entry, mealType: e.mealType, audience: e.audience, isDrink: e.isDrink });
                    }}>
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />Move to another day
                  </button>
                  <div className="h-px bg-border/60 mx-4 my-1" aria-hidden="true" />
                  <button className="flex items-center gap-3 px-4 py-3.5 text-sm text-muted-foreground active:bg-accent/60 text-left w-full" role="menuitem" data-testid="button-ctx-clear-slot"
                    onClick={() => {
                      const e = contextEntry;
                      setContextEntry(null);
                      setClearSlotConfirm({ dayId: e.dayId, mealType: e.mealType, audience: e.audience, isDrink: e.isDrink, dayName: e.dayName, slotLabel: e.slotLabel });
                    }}>
                    <Trash2 className="h-4 w-4 shrink-0" />Clear this slot
                  </button>
                  <button className="flex items-center gap-3 px-4 py-3.5 text-sm text-destructive active:bg-accent/60 text-left w-full" role="menuitem" data-testid="button-ctx-remove"
                    onClick={() => { deleteEntryMutation.mutate(contextEntry.entry.id); setContextEntry(null); }}>
                    <X className="h-4 w-4 shrink-0" />Remove meal
                  </button>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* ── Phase 1B: Mobile move-to-day picker sheet ── */}
      <Sheet open={!!moveEntryTarget} onOpenChange={(v) => { if (!v) setMoveEntryTarget(null); }}>
        <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-8 pt-0" data-testid="sheet-mobile-move-day">
          <div className="px-4 pt-5 pb-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Move to another day</p>
            <p className="text-xs text-muted-foreground mt-0.5">Same slot on the chosen day</p>
          </div>
          <div className="flex flex-col py-1 overflow-y-auto max-h-72" role="menu">
            {allPlannerDays
              .filter(({ day }) => moveEntryTarget && day.id !== moveEntryTarget.entry.dayId)
              .map(({ week, day }) => (
                <button
                  key={day.id}
                  className="flex items-center gap-3 px-4 py-3.5 text-sm text-foreground active:bg-accent/60 text-left w-full"
                  role="menuitem"
                  data-testid={`button-mobile-move-to-${day.id}`}
                  onClick={() => {
                    if (moveEntryTarget) {
                      handleMoveToDay(moveEntryTarget.entry, day.id, moveEntryTarget.mealType);
                      setMoveEntryTarget(null);
                    }
                  }}
                >
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{week.weekName} · {DAY_NAMES[day.dayOfWeek]}</span>
                </button>
              ))
            }
          </div>
        </SheetContent>
      </Sheet>

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
      <Dialog open={!!mealDetail} onOpenChange={(v) => { if (!v) { setMealDetail(null); setAdaptationOpen(false); setHouseholdSafeChoice(null); setVariantAccepted(false); setReviewSheetOpen(false); adaptMutation.reset(); setAddGuestOpen(false); setGuestName(""); setGuestDietTypes([]); setGuestRestrictions([]); } }}>
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
            const activeAdaptation = adaptMutation.data ?? (entry.adaptationResult as AdaptationResult | null);
            // Available whenever the adaptation result has a preview (for review sheet)
            const activePreview: HouseholdSafePreview | null = activeAdaptation?.householdSafePreview ?? null;
            // Legacy: only shown inline in the dialog when user explicitly chose "one version"
            const householdSafePreview: HouseholdSafePreview | null =
              householdSafeChoice === "one" ? activePreview : null;
            // Original meal name for "Variant of" display
            const originalMealNameForReview = meal.isHouseholdSafeVariant
              ? (meal.householdSafeFor?.originalMealName ?? meal.name)
              : meal.name;

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
                          {meal.isHouseholdSafeVariant ? (
                            <span className="text-[10px] font-medium text-teal-700 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30 px-1.5 py-0.5 rounded">household-safe variant active</span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/60 italic">Evaluating full household</span>
                          )}
                          {(() => {
                            const result: AdaptationResult | null | undefined =
                              adaptMutation.data ?? (entry.adaptationResult as AdaptationResult | null);
                            if (result && !adaptMutation.isPending) {
                              return (
                                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  {result.adaptations.length} checked
                                </span>
                              );
                            }
                            return null;
                          })()}
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

                      {/* Pre-tailor info — shown when no result yet */}
                      {(() => {
                        const result: AdaptationResult | null | undefined =
                          adaptMutation.data ?? (entry.adaptationResult as AdaptationResult | null);
                        if (result || adaptMutation.isPending) return null;
                        const totalEaters = householdEaters.length + entryGuests.length;
                        return (
                          <div className="px-3 py-2 border-t border-border/50 bg-background/60">
                            <p className="text-[11px] text-muted-foreground">
                              Will evaluate {householdEaters.length} household member{householdEaters.length !== 1 ? "s" : ""}
                              {entryGuests.length > 0 && ` + ${entryGuests.length} guest${entryGuests.length !== 1 ? "s" : ""}`}
                              {" "}({totalEaters} total)
                            </p>
                          </div>
                        );
                      })()}

                      {/* Result body */}
                      {(() => {
                        const result: AdaptationResult | null | undefined =
                          adaptMutation.data ?? (entry.adaptationResult as AdaptationResult | null);
                        if (!result || !adaptationOpen || adaptMutation.isPending) return null;
                        return (
                          <div className="px-3 py-3 space-y-3 border-t border-border bg-background">
                            {/* Per-eater compatibility rows */}
                            <ul className="space-y-0 divide-y divide-border/40">
                              {result.adaptations.map((a, i) => {
                                const isChild = householdEaters.find(e => e.displayName === a.eaterName)?.kind === "child";
                                const needsChange = a.changeType !== "none";
                                const noData = !!a.hasNoDietaryData;
                                return (
                                  <li key={i} className="flex items-start gap-2.5 py-2 first:pt-0 last:pb-0">
                                    {/* Status icon */}
                                    <div className="shrink-0 mt-0.5 w-4 flex justify-center">
                                      {needsChange ? (
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                      ) : noData ? (
                                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
                                      ) : (
                                        <Check className="h-3.5 w-3.5 text-green-500" />
                                      )}
                                    </div>
                                    {/* Eater details */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-sm font-medium text-foreground">{a.eaterName}</span>
                                        {isChild && (
                                          <span className="text-[10px] text-muted-foreground/70 bg-muted px-1 py-0.5 rounded">child</span>
                                        )}
                                      </div>
                                      <p className="text-xs mt-0.5">
                                        {needsChange ? (
                                          <span className="text-foreground/80">
                                            {a.note}
                                            {a.extraIngredients.length > 0 && (
                                              <span className="text-muted-foreground"> · needs: {a.extraIngredients.join(", ")}</span>
                                            )}
                                          </span>
                                        ) : noData ? (
                                          <span className="text-muted-foreground/70 italic">{a.note}</span>
                                        ) : (
                                          <span className="text-muted-foreground">as normal</span>
                                        )}
                                      </p>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                            {/* Extra ingredients summary */}
                            {result.householdExtraIngredients.length > 0 && (
                              <p className="text-xs text-muted-foreground pt-1 border-t border-border/40">
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

                            {/* ── Household-safe unified preview ── */}
                            {(() => {
                              const preview = result.householdSafePreview;
                              if (!preview) return null;
                              return (
                                <div className="mt-1 border-t border-border/40 pt-3 space-y-3">
                                  {/* Header */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Wand2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                    <span className="text-sm font-semibold text-foreground">One household-safe version</span>
                                    <span className="text-[10px] text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded italic shrink-0">AI preview</span>
                                  </div>

                                  {/* Accommodates */}
                                  {preview.accommodates.length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-foreground/80 mb-1">Adjusted to accommodate:</p>
                                      <ul className="space-y-0.5">
                                        {preview.accommodates.map((a, i) => (
                                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                            <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full bg-amber-400" />
                                            <span><span className="font-medium text-foreground/75">{a.eaterName}</span>: {a.restriction}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Ingredient changes — side-by-side comparison */}
                                  {preview.ingredientChanges.length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-foreground/80 mb-2">Ingredient changes:</p>
                                      {/* Column headers — hidden on smallest screens, shown sm+ */}
                                      <div className="hidden sm:grid sm:grid-cols-3 gap-x-3 px-2 pb-1 border-b border-border/40 mb-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">Original</span>
                                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">Household-safe</span>
                                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">Why</span>
                                      </div>
                                      <ul className="space-y-px">
                                        {preview.ingredientChanges.map((c, i) => (
                                          <li key={i} className={`rounded-sm ${i % 2 === 0 ? "bg-muted/20" : ""}`}>
                                            {/* Desktop/tablet: three-column row with wrapping */}
                                            <div className="hidden sm:grid sm:grid-cols-3 gap-x-3 px-2 py-1.5 items-start">
                                              <span className="text-xs text-muted-foreground break-words">{c.original}</span>
                                              <span className={`text-xs font-medium break-words ${c.replacement ? "text-foreground" : "text-rose-600 dark:text-rose-400"}`}>
                                                {c.replacement ?? "Removed"}
                                              </span>
                                              <span className="text-[11px] text-muted-foreground/70 break-words">{c.reason}</span>
                                            </div>
                                            {/* Mobile: stacked card */}
                                            <div className="sm:hidden px-2 py-2 space-y-0.5">
                                              <div className="flex items-center justify-between gap-2">
                                                <span className="text-[10px] uppercase tracking-wide text-muted-foreground/55 shrink-0">Original</span>
                                                <span className="text-xs text-muted-foreground text-right">{c.original}</span>
                                              </div>
                                              <div className="flex items-center justify-between gap-2">
                                                <span className="text-[10px] uppercase tracking-wide text-muted-foreground/55 shrink-0">Household-safe</span>
                                                <span className={`text-xs font-medium text-right ${c.replacement ? "text-foreground" : "text-rose-600 dark:text-rose-400"}`}>
                                                  {c.replacement ?? "Removed"}
                                                </span>
                                              </div>
                                              {c.reason && (
                                                <div className="flex items-center justify-between gap-2">
                                                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground/55 shrink-0">Why</span>
                                                  <span className="text-[11px] text-muted-foreground/70 text-right">{c.reason}</span>
                                                </div>
                                              )}
                                            </div>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Method changes */}
                                  {preview.methodChanges.length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-foreground/80 mb-1">Method changes:</p>
                                      <ul className="space-y-0.5">
                                        {preview.methodChanges.map((m, i) => (
                                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                            <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full bg-primary/40" />
                                            {m}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Trade-offs */}
                                  {preview.tradeoffs.length > 0 && (
                                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded px-2.5 py-2">
                                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Trade-offs to be aware of:</p>
                                      <ul className="space-y-0.5">
                                        {preview.tradeoffs.map((t, i) => (
                                          <li key={i} className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                                            <span className="mt-1 shrink-0">·</span>
                                            {t}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Validation failure warning */}
                                  {preview.validationFailed && (
                                    <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40 rounded px-2.5 py-2">
                                      <span className="text-rose-500 dark:text-rose-400 shrink-0 mt-0.5 text-sm font-bold">!</span>
                                      <div>
                                        <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">This adaptation needs review</p>
                                        <p className="text-[11px] text-rose-700/70 dark:text-rose-400/70 mt-0.5">
                                          The adapted method may contain instructions that don't make sense for the substituted ingredients. Re-run tailoring to generate a corrected version.
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Trust disclaimer */}
                                  <p className="text-[10px] text-muted-foreground/55 italic">
                                    AI-generated adaptation preview. Review substitutions before cooking. Not a medically guaranteed safe recipe.
                                  </p>

                                  {/* Approval actions */}
                                  <div className="space-y-2 pt-0.5">
                                    {variantAccepted ? (
                                      <div className="flex items-start gap-2 bg-green-50 dark:bg-green-950/20 border border-green-200/60 dark:border-green-800/40 rounded px-2.5 py-2">
                                        <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                                        <div>
                                          <p className="text-xs font-medium text-green-700 dark:text-green-400">Household-safe version saved</p>
                                          <p className="text-[11px] text-green-700/70 dark:text-green-400/70 mt-0.5">
                                            This planner slot now uses the adapted recipe. Shopping will use the substituted ingredients. The original recipe is unchanged.
                                          </p>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex flex-wrap gap-2">
                                          <Button
                                            variant="default"
                                            size="sm"
                                            className="h-8 text-xs"
                                            disabled={!!preview.validationFailed}
                                            onClick={() => setReviewSheetOpen(true)}
                                          >
                                            <Check className="h-3 w-3 mr-1.5" />
                                            Review &amp; approve adaptation
                                          </Button>
                                          <Button
                                            variant={householdSafeChoice === "separate" ? "default" : "outline"}
                                            size="sm"
                                            className="h-8 text-xs"
                                            onClick={() => setHouseholdSafeChoice(c => c === "separate" ? null : "separate")}
                                          >
                                            {householdSafeChoice === "separate" && <Check className="h-3 w-3 mr-1.5" />}
                                            Cook separate adaptations
                                          </Button>
                                        </div>
                                        {householdSafeChoice === "separate" && (
                                          <p className="text-[11px] text-muted-foreground/80 bg-muted/40 rounded px-2 py-1.5">
                                            Plate each person's adaptation individually at serving time. Original recipe unchanged.
                                          </p>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
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

                  {/* Nutrition Boost — async uplift panel, shown only when matches exist */}
                  {(() => {
                    const matches = upliftByMealId.get(meal.id) ?? [];
                    if (matches.length === 0) return null;
                    return (
                      <MealUpliftPanel
                        mealId={meal.id}
                        plannerEntryId={entry.id}
                        mealSlot={mealType}
                        upliftMatches={matches}
                        onMealForked={(newMealId) => {
                          // After a system meal fork, refresh planner so entry points to fork
                          qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
                          qc.invalidateQueries({ queryKey: ["/api/meals"] });
                        }}
                        onUpliftAccepted={handleUpliftAccepted}
                        onUpliftRemoved={handleUpliftRemoved}
                      />
                    );
                  })()}

                  {/* Two-column layout: Ingredients + Instructions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Ingredients */}
                    {meal.ingredients && meal.ingredients.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2 text-foreground flex items-center gap-2">
                          Ingredients
                          {householdSafePreview && (
                            <span className="text-[10px] font-normal text-primary bg-primary/10 px-1.5 py-0.5 rounded">household-safe</span>
                          )}
                        </h3>
                        <ul className="space-y-1.5">
                          {(() => {
                            const changes = householdSafePreview?.ingredientChanges ?? [];
                            const matchedIdx = new Set<number>();
                            const rows = meal.ingredients!.map((ing, idx) => {
                              const ci = changes.findIndex((c, i) =>
                                !matchedIdx.has(i) && ing.toLowerCase().includes(c.original.toLowerCase())
                              );
                              if (ci !== -1) {
                                matchedIdx.add(ci);
                                const c = changes[ci];
                                if (c.replacement === null) {
                                  return (
                                    <li key={idx} className="text-sm flex items-start gap-2 text-muted-foreground/40 line-through italic">
                                      <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-rose-300" />
                                      {ing}
                                    </li>
                                  );
                                }
                                return (
                                  <li key={idx} className="text-sm space-y-1">
                                    <div className="flex items-start gap-2 text-muted-foreground/40 line-through">
                                      <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-amber-300" />
                                      {ing}
                                    </div>
                                    <div className="flex items-start gap-2 text-foreground/80">
                                      <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                                      {c.replacement}
                                    </div>
                                  </li>
                                );
                              }
                              return (
                                <li key={idx} className="text-sm flex items-start gap-2 text-foreground/80">
                                  <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                                  {ing}
                                </li>
                              );
                            });
                            // Append any unmatched replacements (new additions not in original list)
                            changes.forEach((c, i) => {
                              if (!matchedIdx.has(i) && c.replacement !== null) {
                                rows.push(
                                  <li key={`add-${i}`} className="text-sm flex items-start gap-2 text-foreground/80">
                                    <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                                    {c.replacement}
                                  </li>
                                );
                              }
                            });
                            return rows;
                          })()}
                        </ul>
                      </div>
                    )}

                    {/* Instructions */}
                    {instructions.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2 text-foreground flex items-center gap-2">
                          Instructions
                          {householdSafePreview && householdSafePreview.methodChanges.length > 0 && (
                            <span className="text-[10px] font-normal text-primary bg-primary/10 px-1.5 py-0.5 rounded">household-safe</span>
                          )}
                        </h3>
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
                        {householdSafePreview && householdSafePreview.methodChanges.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-border/40 space-y-1.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">Household-safe notes:</p>
                            {householdSafePreview.methodChanges.map((m, i) => (
                              <p key={i} className="text-sm text-foreground/80 flex items-start gap-1.5">
                                <span className="mt-1 shrink-0 text-primary">·</span>
                                {m}
                              </p>
                            ))}
                          </div>
                        )}
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

      {/* ── Adaptation Review Sheet — mounted at page level to avoid Dialog z-index conflicts ── */}
      {mealDetail && (() => {
        const { meal, entry } = mealDetail;
        const activeAdaptation = adaptMutation.data ?? (entry.adaptationResult as AdaptationResult | null);
        const reviewPreview = activeAdaptation?.householdSafePreview;
        if (!reviewPreview) return null;
        const origName = meal.isHouseholdSafeVariant
          ? (meal.householdSafeFor?.originalMealName ?? meal.name)
          : meal.name;
        return (
          <AdaptationReviewSheet
            open={reviewSheetOpen}
            onOpenChange={open => { setReviewSheetOpen(open); }}
            entryId={entry.id}
            preview={reviewPreview}
            baseMeal={{ name: meal.name, instructions: meal.instructions }}
            originalMealName={origName}
            onAccepted={(variantMeal) => {
              setVariantAccepted(true);
              setMealDetail(prev => prev ? { ...prev, meal: variantMeal } : null);
            }}
          />
        );
      })()}
    </div>
    </>
    </PlannerWorkspaceContext.Provider>
  );
}
