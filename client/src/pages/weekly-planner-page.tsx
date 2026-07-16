import { Skeleton } from "@/components/ui/skeleton";
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import { X, Plus, Coffee, Sun, Moon, Cookie, Search, Loader2, ChefHat, ShoppingBasket, Copy, Calendar, CalendarDays, UtensilsCrossed, Snowflake, Baby, PersonStanding, Wine, LayoutGrid, Share2, LayoutList, Flame, Pencil, ExternalLink, AlertTriangle, ShoppingCart, ChevronLeft, ChevronRight, Trash2, Sparkles, Lock, DollarSign, Shield, Fish, Beef, Salad, HelpCircle, ChevronDown, ChevronUp, RefreshCw, Microscope, Wheat, Droplets, Droplet, Globe, Package, Store, Users, Wand2, Camera, BookOpen, MoreHorizontal, Check, GripVertical } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { usePlannerContext } from "@/contexts/PlannerContext";
import { PlannerWorkspaceContext } from "@/contexts/PlannerWorkspaceContext";
import { useSmartSuggest } from "@/hooks/use-smart-suggest";
import { usePlannerScan } from "@/hooks/use-planner-scan";
import { usePlannerOperations, type ShoppingHandoffData } from "@/hooks/use-planner-operations";
import { PlannerAssistantPanel } from "@/components/PlannerAssistantPanel";
import type { ResolveTarget, PlaceholderItem } from "@/components/PlannerAssistantPanel";
import { usePublishCompanionContext } from "@/components/conversation/companion-context";
import { SmartReviewPanelContent } from "@/components/SmartReviewPanelContent";
import type { FullDay, FullWeek, SmartCandidate, MealExplanation, SmartSuggestEntry, SmartSuggestResult } from "@/lib/planner-types";
import type { EntryTarget, PlannerProductResult } from "@/components/PlannerMealPickerPanel";
import { SharePlanDialog } from "@/components/share-plan-dialog";
import { PlannerScanReview, type PlannerScanData, type PlannerDayEntry } from "@/components/PlannerScanReview";
import { RecipeScanReview, type RecipeScanData } from "@/components/RecipeScanReview";
import { emitStageProposal } from "@/lib/planner-staging-bus";
import { computeMealVariety, EMPTY_VARIETY_SCORE } from "@shared/canonical/plant-classifier";
import { getMealNutrients } from "@/lib/nutrition-insights";
import PlannerIntelligenceStrip from "@/components/PlannerIntelligenceStrip";
import { AmbientIntelligence } from "@/components/intelligence";
import { CookbookMealIntelligenceStrip } from "@/components/CookbookMealIntelligenceStrip";
import { MealNutrientTags } from "@/components/nutrition-insights-panel";
import { useUser } from "@/hooks/use-user";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FirstVisitHint } from "@/components/first-visit-hint";
import { MealUpliftPanel, UpliftCardIndicator, SHOPPING_LIST_KEYS, selectVisibleBoosts } from "@/components/MealUpliftPanel";
import type { UpliftMatchResult } from "@/components/MealUpliftPanel";
import { buildWeeklyReuseMap } from "@/lib/ingredient-reuse";
import { useToast } from "@/hooks/use-toast";
import { useTrackedMutation } from "@/hooks/use-tracked-mutation";
import { ToastAction } from "@/components/ui/toast";
import { api } from "@shared/routes";
import type { PlannerWeek, PlannerDay, PlannerEntry, Meal, FreezerMeal, Nutrition, MealCategory, WeekEaterOverride, MealUpliftApplication } from "@shared/schema";
import type { HouseholdEater, GuestEater } from "@shared/household-eater";
import type { AdaptationResult, HouseholdSafePreview } from "@shared/meal-adaptation";
import { ONBOARDING_DIET_OPTIONS, DIET_PATTERN_OPTIONS, ALLERGY_INTOLERANCE_OPTIONS } from "@/lib/diets";
import { WorkspaceHeader, pageContainerClass } from "@/components/workspace-header";
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
import { DroppablePlannerCell, SortablePlannerEntry, MobileSortableMealEntry, MobileDayDropTarget, DroppableProvisioning, type DragItemData, type DropZoneData } from "@/components/PlannerDragDrop";
import { PlannerMealCardContent } from "@/components/PlannerMealCard";
import thaAppleSrc from "@/assets/icons/tha-apple.png";
import { invalidateMealLibrary } from "@/hooks/use-meals";

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

// ── Resolve session persistence ────────────────────────────────────────────────
const RESOLVE_SESSION_KEY = "planner:resolve-session";
const ACTIVE_WEEK_KEY = "planner:active-week";

type ResolveSession = {
  entryId: number;
  dayId: number;
  mealName: string;
  dayName: string;
  slotLabel: string;
  mealType: string;
  audience: string;
  isDrink: boolean;
  position: number;
  returnMode: "placeholder-review" | null;
  pendingRecipeLink: {
    replacementMealId: number;
    replacementMealName: string;
  } | null;
};

function isValidResolveSession(v: unknown): v is ResolveSession {
  if (!v || typeof v !== "object") return false;
  const t = v as Record<string, unknown>;
  return (
    typeof t.mealName === "string" && typeof t.dayName === "string" &&
    typeof t.slotLabel === "string" && typeof t.entryId === "number" &&
    typeof t.dayId === "number" && typeof t.mealType === "string" &&
    typeof t.audience === "string" && typeof t.isDrink === "boolean" &&
    typeof t.position === "number" &&
    (t.returnMode === "placeholder-review" || t.returnMode === null) &&
    (t.pendingRecipeLink === null || (typeof t.pendingRecipeLink === "object" && t.pendingRecipeLink !== null))
  );
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

// Active week: localStorage for cross-session continuity
function loadActiveWeek(): string {
  try {
    const raw = localStorage.getItem(ACTIVE_WEEK_KEY);
    if (!raw) return "1";
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "string" && /^[1-9]\d*$/.test(parsed)) return parsed;
    localStorage.removeItem(ACTIVE_WEEK_KEY);
    return "1";
  } catch { return "1"; }
}

function saveActiveWeek(value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(ACTIVE_WEEK_KEY);
    else localStorage.setItem(ACTIVE_WEEK_KEY, JSON.stringify(value));
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

// ─── Uplift matches ───────────────────────────────────────────────────────────
// The uplift suggestions shown for a meal are exactly the ones the canonical owner
// authored and reviewed (server/lib/uplift-rules.ts, SoT Domain 17), matched by
// server/lib/uplift-engine.ts. There is nothing to merge them with, and that is
// the point.
//
// SEC4 retired a client-side fallback that ran nutrition-boosts.ts through a
// browser-authored rule identity — a rule that existed nowhere on the server, with
// a `why` string templated in the browser. It
// was shown beside the reviewed rules and was indistinguishable from them, and on
// accept it was persisted stamped as THA's own reviewed guidance. Nothing replaces
// it: an unreviewed suggestion is not one THA is entitled to make
// (ARCHITECTURE_PRINCIPLES.md Principle 6), and /api/uplift/accept now rejects it.

export default function WeeklyPlannerPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeWeek, setActiveWeek] = useState<string>(() => loadActiveWeek());
  const [renameWeekId, setRenameWeekId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [clearWeekId, setClearWeekId] = useState<number | null>(null);
  const [mobileAssistantOpen, setMobileAssistantOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<EntryTarget | null>(null);
  const [sharePlanOpen, setSharePlanOpen] = useState(false);
  const [saveWeekOpen, setSaveWeekOpen] = useState(false);
  const [saveWeekName, setSaveWeekName] = useState("");
  const [loadWeekOpen, setLoadWeekOpen] = useState(false);
  const [expandedDayId, setExpandedDayId] = useState<number | null>(null);
  const [expandedDayLabel, setExpandedDayLabel] = useState("");
  const [mealDetail, setMealDetail] = useState<MealDetailState | null>(null);
  const [resolveSession, setResolveSession] = useState<ResolveSession | null>(
    () => loadFromSession(RESOLVE_SESSION_KEY, isValidResolveSession)
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

  // Repeat-tap nav: open workspace drawer when mobile nav fires tha:open-workspace for this page
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent<{ href: string }>).detail?.href === "/planner") {
        setMobileAssistantOpen(true);
      }
    };
    window.addEventListener("tha:open-workspace", handler);
    return () => window.removeEventListener("tha:open-workspace", handler);
  }, []);

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
  const handleUpliftAccepted = (mealId: number) => {
    setBoostedMealIds(prev => new Set(Array.from(prev).concat(mealId)));
    // Fork case: if the system meal was forked, update mealDetail so the dialog
    // resolves the live meal by the new fork ID rather than the original meal ID.
    setMealDetail(prev => {
      if (!prev || prev.meal.id === mealId) return prev;
      return { ...prev, meal: { ...prev.meal, id: mealId } };
    });
  };
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

  useEffect(() => { saveToSession(RESOLVE_SESSION_KEY, resolveSession); }, [resolveSession]);
  useEffect(() => { saveActiveWeek(activeWeek); }, [activeWeek]);

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

  // PX1-W0 (fnd-px-technical-errors-to-household): the failure toast forwarded
  // err.message, which is the raw response body from queryClient.ts. Declared copy only
  // now; the underlying error is logged for us.
  const loadTemplateMutation = useTrackedMutation({
    mutationFn: async () => {
      const defaultRes = await fetch("/api/plan-templates/default");
      if (!defaultRes.ok) throw new Error("No default template found");
      const { id } = await defaultRes.json();
      const applyRes = await apiRequest("POST", `/api/plan-templates/${id}/apply?mode=replace`);
      if (!applyRes.ok) throw new Error("Failed to apply template");
      return applyRes.json();
    },
    feedback: {
      success: "Plan loaded!",
      successDescription: (data) => `${data.createdCount + data.updatedCount} meals added to your planner.`,
      failure: "Couldn't load this plan",
      failureDescription: "The plan hasn't been added. Have a look at your planner, then please try again.",
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
    },
    onError: (err) => {
      console.error("[planner:load-default-template]", err);
    },
  });

  const { data: fullPlanner = [], isPending: isLoading } = useQuery<FullWeek[]>({
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

  // ── Plant diversity: collect all ingredient arrays from meals in the active week ──
  const weekIngredients = useMemo<string[][]>(() => {
    if (!activeWeekData) return [];
    return activeWeekData.days.flatMap((d) =>
      d.entries
        .map((e) => mealById.get(e.mealId))
        .filter((m): m is Meal => !!m && !!(m.ingredients?.length))
        .map((m) => m.ingredients ?? []),
    );
  }, [activeWeekData, mealById]);

  // ── Weekly reuse map: ingredient → meal names using it this week ──────────────
  // Used by MealUpliftPanel to surface "Already used this week" labels and to
  // rank reuse suggestions (P1) above discovery suggestions (P2).
  const weeklyReuseMap = useMemo<Map<string, string[]>>(() => {
    if (!activeWeekData) return new Map();
    const mealsThisWeek: { name: string; ingredients: string[] }[] = [];
    for (const day of activeWeekData.days) {
      for (const entry of day.entries) {
        const meal = mealById.get(entry.mealId);
        if (meal?.ingredients?.length) {
          mealsThisWeek.push({ name: meal.name, ingredients: meal.ingredients });
        }
      }
    }
    return buildWeeklyReuseMap(mealsThisWeek);
  }, [activeWeekData, mealById]);

  // ── Planner context (Phase 1A + 5B: assistant panel routing + selected day) ─
  const { assistantMode, setAssistantMode, selectedDayId, setSelectedDayId } = usePlannerContext();

  // ── Shopping handoff state (Phase 3: post-generation continuity) ─────────────
  const [shoppingHandoff, setShoppingHandoff] = useState<ShoppingHandoffData | null>(null);

  // Once planner data first loads, validate restored resolveSession. If the entry no longer
  // exists (deleted/stale), clear the session and exit resolve mode.
  useEffect(() => {
    if (resolveTargetValidatedRef.current || !fullPlanner.length) return;
    resolveTargetValidatedRef.current = true;
    if (!resolveSession) return;
    const liveEntryIds = new Set(
      fullPlanner.flatMap(w => w.days.flatMap(d => d.entries.map(e => e.id)))
    );
    if (!liveEntryIds.has(resolveSession.entryId)) {
      setResolveSession(null);
      if (assistantMode === "resolve") setAssistantMode(null);
    }
  }, [fullPlanner, resolveSession, assistantMode, setAssistantMode]);

  // Once planner data first loads, validate the restored activeWeek. If the stored week
  // no longer exists (deleted or never created), clear stored state and fall back to "1".
  useEffect(() => {
    if (activeWeekValidatedRef.current || !fullPlanner.length) return;
    activeWeekValidatedRef.current = true;
    const valid = fullPlanner.find(w => w.weekNumber === Number(activeWeek));
    if (!valid) {
      saveActiveWeek(null);
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

  // Planner-native recipe scan — keeps user on the planner page instead of navigating to /meals
  const [plannerRecipeScanData, setPlannerRecipeScanData] = useState<RecipeScanData | null>(null);
  const [plannerRecipeScanLoading, setPlannerRecipeScanLoading] = useState(false);
  const [plannerRecipeScanError, setPlannerRecipeScanError] = useState<string | undefined>(undefined);
  const plannerRecipeScanFileRef = useRef<HTMLInputElement>(null);
  const plannerRecipeScanCameraRef = useRef<HTMLInputElement>(null);

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

  // ── Nutrition Boost provenance (dialog-level) ────────────────────────────────
  // Accepted uplift applications for the meal shown in the detail dialog.
  // Shares the cache key with MealUpliftPanel, so the POST-accept cache write
  // makes provenance appear immediately. mealDetail.meal.id is updated to the
  // fork id by handleUpliftAccepted, so the key always targets the effective
  // (user-owned) meal. System meals are skipped — the endpoint 403s for them
  // and they can never have application rows.
  const mealDetailMealId = mealDetail?.meal.id;
  const mealDetailMealIsSystem =
    (meals.find((m) => m.id === mealDetailMealId) ?? mealDetail?.meal)?.isSystemMeal ?? false;
  const { data: mealDetailApplications = [] } = useQuery<MealUpliftApplication[]>({
    queryKey: ["/api/meals", mealDetailMealId, "uplift-applications"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/meals/${mealDetailMealId}/uplift-applications`);
      const body = await res.json();
      return body.applications ?? [];
    },
    enabled: !!mealDetail && !mealDetailMealIsSystem,
    staleTime: 30_000,
  });

  const removeBoostFromDialogMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const res = await apiRequest("DELETE", `/api/uplift/applications/${applicationId}`);
      if (!res.ok) throw new Error("Failed to remove");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/meals", mealDetail?.meal.id, "uplift-applications"] });
      invalidateMealLibrary(qc);
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
      for (const key of SHOPPING_LIST_KEYS) {
        qc.invalidateQueries({ queryKey: key });
      }
    },
    onError: () => {
      toast({ title: "Failed to remove boost", variant: "destructive" });
    },
  });

  // ── Week eater overrides (Phase 4) ───────────────────────────────────────────
  const [weekDietsOpen, setWeekDietsOpen] = useState(false);

  const activeWeekId = fullPlanner.find((w) => w.weekNumber === Number(activeWeek))?.id;

  // ── Weekly provisioning (Phase 5) ─────────────────────────────────────────────
  const [provisioningOpen, setProvisioningOpen] = useState(false);
  const { data: provisioningItems = [] } = useQuery<{
    id: number; weekId: number; name: string; mealId: number | null; note: string | null; createdAt: string;
  }[]>({
    queryKey: ["/api/planner/weeks", activeWeekId, "provisioning"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/planner/weeks/${activeWeekId}/provisioning`);
      return res.json();
    },
    enabled: !!activeWeekId,
  });

  // Auto-open provisioning tray when it first loads with items so users see additions
  // from the Analyser without needing to manually scroll and expand.
  useEffect(() => {
    if (provisioningItems.length > 0) setProvisioningOpen(true);
  }, [provisioningItems.length]);

  const deleteProvisioningMutation = useMutation({
    mutationFn: async (itemId: number) => {
      if (!activeWeekId) throw new Error("No active week");
      const res = await apiRequest("DELETE", `/api/planner/weeks/${activeWeekId}/provisioning/${itemId}`);
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/planner/weeks", activeWeekId, "provisioning"] });
    },
    onError: () => toast({ title: "Failed to remove item", variant: "destructive" }),
  });

  const addProvisioningFromDragMutation = useMutation({
    mutationFn: async ({ weekId, name, mealId }: { weekId: number; name: string; mealId: number }) => {
      const res = await apiRequest("POST", `/api/planner/weeks/${weekId}/provisioning`, { name, mealId });
      return res.json();
    },
    onSuccess: (_, { weekId }) => {
      qc.invalidateQueries({ queryKey: ["/api/planner/weeks", weekId, "provisioning"] });
      setProvisioningOpen(true);
    },
    onError: () => toast({ title: "Could not add to provisioning", variant: "destructive" }),
  });

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

  // PX1-W0 (fnd-px-technical-errors-to-household): "Adaptation failed / 500: Internal
  // Server Error" was the household's whole explanation. Declared copy only now.
  const adaptMutation = useTrackedMutation({
    mutationFn: async (entryId: number): Promise<AdaptationResult> => {
      const res = await apiRequest("POST", `/api/planner/entries/${entryId}/adapt`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? "Failed to generate adaptation");
      }
      return res.json();
    },
    feedback: {
      failure: "Couldn't adapt this meal",
      failureDescription: "The meal is unchanged in your planner. Please try again.",
    },
    onSuccess: () => {
      // Refresh the planner so the stored result is reflected
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
      setAdaptationOpen(true);
      setHouseholdSafeChoice(null);
      setVariantAccepted(false);
    },
    onError: (err) => {
      console.error("[planner:adapt-entry]", err);
    },
  });

  // ── Entry guests (Phase 5) ────────────────────────────────────────────────────
  const [addGuestOpen, setAddGuestOpen] = useState(false);
  const [eatersOpen, setEatersOpen] = useState(false);
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

  const { data: myWeekTemplates = [] } = useQuery<any[]>({
    queryKey: ["/api/plan-templates/mine"],
    queryFn: async () => {
      const res = await fetch("/api/plan-templates/mine", { credentials: "include" });
      if (!res.ok) return [];
      const all = await res.json();
      return all.filter((t: any) => t.description === "__week_template__");
    },
  });

  const saveWeekMutation = useMutation({
    mutationFn: async ({ weekId, name }: { weekId: number; name: string }) => {
      const res = await fetch(`/api/planner/weeks/${weekId}/save-week-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
        credentials: "include",
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.message || "Failed to save week"); }
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/plan-templates/mine"] });
      toast({ title: "Week saved", description: `"${data.name}" saved with ${data.itemCount} meals` });
      setSaveWeekOpen(false);
      setSaveWeekName("");
    },
    // PX1-W0 (fnd-px-technical-errors-to-household): forwarded the raw response body.
    onError: (err: Error) => {
      console.error("[planner:save-week]", err);
      toast({ title: "Couldn't save your week", description: "Your planner is unchanged — nothing has been lost. Please try again.", variant: "destructive" });
    },
  });

  const loadWeekMutation = useMutation({
    mutationFn: async ({ templateId, weekId }: { templateId: string; weekId: number }) => {
      const res = await fetch(`/api/plan-templates/${templateId}/apply-to-week/${weekId}?mode=replace`, {
        method: "POST", credentials: "include",
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.message || "Failed to load week"); }
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
      toast({ title: "Week loaded", description: `${data.createdCount + data.updatedCount} meals added` });
      setLoadWeekOpen(false);
    },
    // PX1-W0 (fnd-px-technical-errors-to-household): forwarded the raw response body.
    onError: (err: Error) => {
      console.error("[planner:load-week]", err);
      toast({ title: "Couldn't load that week", description: "Your planner is unchanged. Please try again.", variant: "destructive" });
    },
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

  const handleShoppingHandoff = useCallback((data: ShoppingHandoffData) => {
    setShoppingHandoff(data);
    setAssistantMode("shopping-ready");
  }, [setAssistantMode]);

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
    activeWeekNumber: Number(activeWeek),
    onSlotCleared: () => setClearSlotConfirm(null),
    onWeekCleared: () => setClearWeekId(null),
    onShoppingHandoff: handleShoppingHandoff,
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
      // PX1-W0 (fnd-px-technical-errors-to-household): forwarded the raw response body.
      console.error("[planner:copy-day]", err);
      toast({ title: "Couldn't copy that day", description: "Nothing has been added to the day you were copying into. Please try again.", variant: "destructive" });
    },
  });

  const getMeal = (id: number | null): Meal | undefined => {
    if (!id) return undefined;
    return meals.find((m) => m.id === id);
  };

  // Phase 4A: drag/drop handlers
  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragItemData | undefined;
    if (data?.type === "planner-entry" || data?.type === "proposal-card" || data?.type === "search-result") {
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

    // Phase 3: search-result from Planner Assistant discovery (cookbook/freezer/packaged)
    if (dragData.type === "search-result") {
      // Drop onto weekly provisioning tray
      if (overData.type === "provisioning") {
        addProvisioningFromDragMutation.mutate({
          weekId: overData.weekId,
          name: dragData.mealName,
          mealId: dragData.mealId,
        });
        return;
      }

      let targetDayId: number;
      let targetMealType: string;
      let targetAudience: string;
      let targetIsDrink: boolean;
      if (overData.type === "planner-slot") {
        targetDayId = overData.dayId;
        targetMealType = overData.mealType;
        targetAudience = overData.audience;
        targetIsDrink = overData.isDrink;
      } else if (overData.type === "planner-entry") {
        targetDayId = overData.dayId;
        targetMealType = overData.mealType;
        targetAudience = overData.audience;
        targetIsDrink = overData.isDrink;
      } else {
        return;
      }
      const dropDay = fullPlanner.flatMap((w) => w.days).find((d) => d.id === targetDayId);
      const position = dropDay
        ? targetIsDrink
          ? getDrinkEntries(dropDay.entries).length
          : getSlotEntries(dropDay.entries, targetMealType, targetAudience, false).length
        : 0;
      addEntryMutation.mutate({
        dayId: targetDayId,
        mealType: targetMealType,
        audience: targetAudience,
        mealId: dragData.mealId,
        position,
        isDrink: targetIsDrink,
      });
      return;
    }

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
      setAssistantMode("build");
    } else if (action === "scan") {
      if (resolveSession) {
        setAssistantMode(null);
        plannerRecipeScanCameraRef.current?.click();
      } else {
        setAssistantMode("scan");
      }
    } else {
      setResolveSession(null);
      setAssistantMode(null);
    }
  };

  const handleResolveRecipe = (mealId: number) => {
    if (!resolveSession) return;
    const recipeName = getMeal(mealId)?.name ?? "this recipe";
    setResolveSession({ ...resolveSession, pendingRecipeLink: { replacementMealId: mealId, replacementMealName: recipeName } });
  };

  const handleResolveRecipeFromReview = (mealId: number, target: ResolveTarget) => {
    const recipeName = getMeal(mealId)?.name ?? "this recipe";
    setResolveSession({
      entryId: target.entryId,
      dayId: target.dayId,
      mealName: target.mealName,
      dayName: target.dayName,
      slotLabel: target.slotLabel,
      mealType: target.mealType,
      audience: target.audience,
      isDrink: target.isDrink,
      position: target.position,
      returnMode: "placeholder-review",
      pendingRecipeLink: { replacementMealId: mealId, replacementMealName: recipeName },
    });
  };

  const handleBuildFromReview = (target: ResolveTarget) => {
    setResolveSession({
      entryId: target.entryId,
      dayId: target.dayId,
      mealName: target.mealName,
      dayName: target.dayName,
      slotLabel: target.slotLabel,
      mealType: target.mealType,
      audience: target.audience,
      isDrink: target.isDrink,
      position: target.position,
      returnMode: "placeholder-review",
      pendingRecipeLink: null,
    });
    setAssistantMode("build");
  };

  const confirmRecipeLink = () => {
    if (!resolveSession?.pendingRecipeLink) return;
    const { replacementMealId, replacementMealName } = resolveSession.pendingRecipeLink;
    const returnToReview = resolveSession.returnMode === "placeholder-review";
    const entryId = resolveSession.entryId;
    const mealName = resolveSession.mealName;
    replacePlaceholderMealMutation.mutate({ entryId, mealId: replacementMealId }, {
      onSuccess: () => {
        setResolveSession(null);
        if (!returnToReview) setAssistantMode(null);
        toast({ title: "Recipe linked", description: `${mealName} has been resolved.` });
      },
      onError: () => {
        setResolveSession(prev => prev ? { ...prev, pendingRecipeLink: null } : null);
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

  const handleScanFromReview = (target: ResolveTarget) => {
    setResolveSession({
      entryId: target.entryId,
      dayId: target.dayId,
      mealName: target.mealName,
      dayName: target.dayName,
      slotLabel: target.slotLabel,
      mealType: target.mealType,
      audience: target.audience,
      isDrink: target.isDrink,
      position: target.position,
      returnMode: "placeholder-review",
      pendingRecipeLink: null,
    });
    setAssistantMode(null);
    plannerRecipeScanCameraRef.current?.click();
  };

  // Workspace Phase A: recipe scan handler — POSTs to /api/scan, stays on planner page
  const handlePlannerRecipeScanFile = async (file: File) => {
    setPlannerRecipeScanLoading(true);
    setPlannerRecipeScanError(undefined);
    setPlannerRecipeScanData(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("scanMode", "recipe");
      const res = await fetch("/api/scan", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Scan failed");
      const data: RecipeScanData = await res.json();
      setPlannerRecipeScanData(data);
    } catch (err: unknown) {
      setPlannerRecipeScanError((err as Error)?.message ?? "Scan failed");
    } finally {
      setPlannerRecipeScanLoading(false);
    }
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
        mealSourceType: "openfoodfacts",
        brand: product.brand ?? undefined,
        barcode: product.barcode ?? undefined,
      });
      const meal = await mealRes.json();
      invalidateMealLibrary(qc);
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

  // PHASE5D — Conversational Planner. Two pointers, and deliberately not a third.
  //
  //   activePlannerWeekId — the week ON SCREEN. Until now nothing published it, so
  //     the assembler fell back to `getPlannerWeeks(userId)[0]` — ordered by
  //     weekNumber, i.e. WEEK 1, FOREVER. The planner persona's own shipped quick
  //     action ("What meals do I have this week?") answered about week 1 no matter
  //     which week the household was reading. That is the bug this line closes.
  //
  //   selectedPlannerDayId — the day the household EXPLICITLY selected (the
  //     PlannerContext selection, persisted). Never `selectedDay`, which falls back
  //     to sortedDays[0] for the grid's benefit: that fallback is a fine thing to
  //     RENDER and a dangerous thing to ACT on, and "add it to that day" must never
  //     resolve to a day nobody chose (TIP3 Risk R6).
  //
  //   selectedMealSlot — NOT published, because the planner has no such state: slot
  //     is chosen per-action, never "in view". Inventing one here is exactly the
  //     guess companion-actions.ts:103 refuses to make, so the planner `add` action
  //     stays an honest gap rather than a coin-flip about someone's dinner.
  usePublishCompanionContext({
    activePlannerWeekId: activeWeekData?.id,
    selectedPlannerDayId: selectedDayId ?? undefined,
  });

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
    // PX1-W4.8 (fnd-px-loading-vocabulary): the loading branch used to replace the
    // ENTIRE page — header and week tabs included — with a lone spinner in an
    // h-[60vh] void: maximal layout shift on the heaviest surface. The header now
    // stays painted and the wait is content-shaped (Skeleton, the canonical owner).
    return (
      <>
        <WorkspaceHeader title="Planner" realm="planner" wide titleTestId="text-weekly-planner-title" />
        <div className={`${pageContainerClass(true)} pb-4 space-y-3`} data-testid="loading-planner">
          <Skeleton className="h-9 w-64" />
          <div className="hidden sm:grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
          <Skeleton className="h-64 sm:hidden" />
        </div>
      </>
    );
  }

  return (
    <PlannerWorkspaceContext.Provider value={workspaceValue}>
    <>
    <WorkspaceHeader
      title="Planner"
      realm="planner"
      wide
      titleTestId="text-weekly-planner-title"
      search={{
        placeholder: "Search meals...",
        value: "",
        onChange: () => {},
        onSubmit: () => { navigate("/cookbook"); },
      }}
      contextBar={
        <div className="flex items-center gap-1 flex-wrap overflow-x-auto scrollbar-hide w-full">
          {renameWeekId === activeWeekData?.id ? (
            <input
              value={renameValue}
              aria-label="Week name"
              onChange={(e) => setRenameValue(e.target.value)}
              className="h-7 text-sm border border-border rounded-md px-2.5 w-32 bg-background outline-none focus:ring-1 focus:ring-primary"
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
              <SelectTrigger className="w-24 sm:w-28 h-7 text-xs" aria-label="Select week" data-testid="tabs-weeks">
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
              className="hidden sm:inline-flex p-1 rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent/40 transition-colors"
              onClick={() => { setRenameWeekId(activeWeekData.id); setRenameValue(activeWeekData.weekName); }}
              title="Rename week"
              aria-label="Rename week"
              data-testid={`button-rename-week-${activeWeek}`}
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
          <div className="hidden md:block h-4 w-px bg-border mx-0.5" />
          {/* Plan + Send week to basket (desktop only; mobile access via workspace drawer) */}
          <div className="hidden md:flex items-center gap-1 rounded-md border border-[var(--realm-border)] px-1 py-0.5">
            <Button
              size="sm"
              variant="outline"
              className="border-0 hidden md:inline-flex px-2.5 text-xs realm-banner-btn"
              onClick={() => setAssistantMode("smart")}
              disabled={smartLoading}
              data-testid="button-plan-my-week"
            >
              {smartLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
              {smartLoading ? "Planning…" : "Plan"}
            </Button>
            <div className="hidden md:block w-px h-4 bg-[var(--realm-border)]" />
            <Button size="sm" variant="outline" className="border-0 hidden md:inline-flex px-2.5 text-xs realm-banner-btn" onClick={() => addAllToBasket(sortedDays)} disabled={addToBasketMutation.isPending} data-testid="button-add-all-basket">
              <ShoppingBasket className="h-3 w-3 mr-1" />
              {addToBasketMutation.isPending ? "…" : "Send week to basket"}
            </Button>
          </div>
          {placeholderItems.length > 0 && (
            <button
              onClick={() => setAssistantMode("placeholder-review")}
              className="flex items-center gap-1 h-7 px-2 text-xs rounded-md border border-amber-400/40 text-amber-600 dark:text-amber-400/80 hover:bg-amber-50/60 dark:hover:bg-amber-950/20 transition-colors shrink-0"
              data-testid="button-placeholder-review"
              title="Review unlinked meals"
              aria-label="Review unlinked meals"
            >
              <BookOpen className="h-3 w-3" />
              <span className="font-medium">{placeholderItems.length}</span>
            </button>
          )}
          <span className="hidden lg:inline text-[11px] text-muted-foreground/70 ml-auto shrink-0" data-testid="text-week-progress">
            {weekStats.filled}/{weekStats.total} meals planned
          </span>
        </div>
      }
      actions={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center justify-center h-9 w-9 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              aria-label="Planner workspace"
              data-testid="button-planner-workspace-menu"
            >
              <img src={thaAppleSrc} alt="" className="h-[34px] w-[34px] object-contain" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              onClick={() => addAllToBasket(sortedDays)}
              disabled={addToBasketMutation.isPending}
              data-testid="button-add-all-basket-overflow"
            >
              <ShoppingBasket className="h-4 w-4 mr-2" />
              Send week to basket
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setSaveWeekName(activeWeekData?.weekName || ""); setSaveWeekOpen(true); }} data-testid="button-save-week">
              <BookOpen className="h-4 w-4 mr-2" />
              Save This Week
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLoadWeekOpen(true)} data-testid="button-load-week" disabled={myWeekTemplates.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Load Saved Week
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
      }
    />
    <div className={pageContainerClass(true)} data-realm="planner">
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


        {/* ── Household diet toggle (functional control — stays always-visible) ── */}
        {householdEaters.length > 0 && activeWeekId && (
          <div className="mb-2" data-testid="section-week-diets">
            <button
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setWeekDietsOpen(o => !o)}
              data-testid="button-toggle-week-diets"
            >
              <Users className="h-3.5 w-3.5" />
              <span>This week's household diets</span>
              {weekOverrides.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">{weekOverrides.length} override{weekOverrides.length !== 1 ? "s" : ""}</Badge>
              )}
              {weekDietsOpen ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
            </button>
          </div>
        )}

        {/* Diets dropdown — expands below the combined row; variety stays above */}
        {householdEaters.length > 0 && activeWeekId && weekDietsOpen && (
          <Card className="p-4 space-y-3 mb-4" data-testid="card-week-diets">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Override a member's household adaptations for this week only. Hard restrictions are always kept.
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

        {/* WX13 — Intelligence Strip: compact summary, expands to full intelligence.
            Replaces the WeeklyPlantDiversityCounter row + PlannerIntelligenceCompanion.
            Uses the same /api/planner/weeks/:weekId/intelligence cache — no extra requests. */}
        <PlannerIntelligenceStrip
          weekId={activeWeekId}
          weekIngredients={weekIngredients}
          onNavigatePlantDiversity={() => navigate("/plant-diversity")}
        />

        {/* PHASE5C — the planner's own ambient intelligence, from the Decision
            Engine's opportunity bundle. The `planner` domain's canonical page:
            the empty day each opportunity names is on this very screen. Distinct
            from the strip above, which is the week's nutrition/diversity picture. */}
        <AmbientIntelligence
          surfaceKey="planner"
          domains={["planner"]}
          title="Gaps in your week"
          className="mt-3"
        />

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
                          <button className="p-1.5 rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent/40" title="Day actions" aria-label="Day actions" data-testid="button-mobile-day-actions">
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
                                  <>
                                    <button
                                      className={`w-full text-left text-sm transition-colors flex items-start gap-1.5 select-none ${isCooked ? "opacity-50" : ""} ${isPlaceholder ? "text-muted-foreground/70" : "text-foreground hover:text-primary"}`}
                                      onClick={() => {
                                        if (isPlaceholder) {
                                          setResolveSession({
                                            mealName: meal.name,
                                            dayName: DAY_NAMES[mobileDay.dayOfWeek],
                                            slotLabel: row.label,
                                            entryId: entry.id,
                                            dayId: mobileDay.id,
                                            mealType: row.mealType ?? row.addMealType,
                                            audience: row.audience,
                                            isDrink: row.isDrink,
                                            position: entry.position,
                                            returnMode: null,
                                            pendingRecipeLink: null,
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
                                      <PlannerMealCardContent
                                        meal={meal}
                                        entryId={entry.id}
                                        isPlaceholder={isPlaceholder}
                                        isCooked={isCooked}
                                      />
                                      {isFrozen && !isCooked && <Snowflake className="h-3 w-3 text-blue-400 flex-shrink-0 mt-0.5" />}
                                      {basketMealIdSet.has(meal.id) && !isCooked && <ShoppingCart className="h-3 w-3 text-emerald-500/70 flex-shrink-0 mt-0.5" />}
                                      {isCooked && <Check className="h-3 w-3 text-emerald-500/70 flex-shrink-0 mt-0.5" />}
                                    </button>
                                    {/* Mobile boost indicator */}
                                    {!isPlaceholder && !isCooked && (() => {
                                      const isBoosted = boostedMealIds.has(meal.id);
                                      const serverMatches = upliftByMealId.get(meal.id) ?? [];
                                                                            const suggestionCount = selectVisibleBoosts(serverMatches, weeklyReuseMap, meal.name).length;
                                      if (isBoosted) {
                                        return (
                                          <button
                                            className="flex items-center gap-0.5 text-[10px] text-emerald-600/70 leading-none mt-0.5"
                                            onClick={(e) => { e.stopPropagation(); setMealDetail({ entry, meal, dayId: mobileDay.id, mealType: row.mealType ?? row.addMealType, audience: row.audience, isDrink: row.isDrink, dayName: DAY_NAMES[mobileDay.dayOfWeek], slotLabel: row.label }); }}
                                            title="Nutrition boost applied"
                                          >
                                            <Check className="h-2.5 w-2.5 shrink-0" />
                                            <span>Boosted</span>
                                          </button>
                                        );
                                      }
                                      if (suggestionCount === 0) return null;
                                      return (
                                        <UpliftCardIndicator
                                          suggestionCount={suggestionCount}
                                          onClick={() => setMealDetail({ entry, meal, dayId: mobileDay.id, mealType: row.mealType ?? row.addMealType, audience: row.audience, isDrink: row.isDrink, dayName: DAY_NAMES[mobileDay.dayOfWeek], slotLabel: row.label })}
                                        />
                                      );
                                    })()}
                                  </>
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
                                  aria-label="Meal name"
                                  className="h-7 text-xs flex-1 min-w-0"
                                  data-testid={`input-mobile-name-meal-${row.id}`}
                                />
                                <button
                                  type="submit"
                                  disabled={!mobileQuickAddName.trim()}
                                  className="h-7 w-7 flex items-center justify-center bg-primary text-primary-foreground rounded-md disabled:opacity-40 flex-shrink-0"
                                  aria-label="Add named meal"
                                  data-testid={`button-mobile-name-meal-submit-${row.id}`}
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setMobileQuickAdd(null); setMobileQuickAddName(""); }}
                                  className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md flex-shrink-0"
                                  aria-label="Cancel naming meal"
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
                      gridTemplateColumns: "var(--ws-col-label) repeat(7, 1fr)",
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
                            className="absolute top-1 right-1 hover-reveal group-hover/day-hdr:opacity-50 hover:!opacity-100 rounded p-0.5 hover:bg-accent/60 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); setCopyDaySourceId(day.id); setCopyDayTargetId(""); setCopyDayOpen(true); }}
                            title="Copy this day"
                            aria-label="Copy this day"
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
                              <RowIcon className={`h-3.5 w-3.5 flex-shrink-0 ${row.iconColor}`} />
                              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{row.label}</span>
                            </div>
                            {row.mealType && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    className="mt-1 rounded transition-colors text-muted-foreground hover:text-foreground self-center"
                                    onClick={() => addSlotToBasket(row.mealType!, sortedDays)}
                                    disabled={addToBasketMutation.isPending}
                                    aria-label={`Add ${row.label}s to basket`}
                                    data-testid={`button-add-slot-${row.mealType}-basket`}
                                  >
                                    <ShoppingBasket className="h-4 w-4" />
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
                                className={`relative p-2 min-h-[68px] flex flex-col gap-0.5 border-l border-border ${!isLastRow ? "border-b border-border" : ""}`}
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
                                          className={`w-full text-left text-sm leading-snug transition-colors flex items-start gap-0.5 ${isPlaceholder ? "text-muted-foreground/70 hover:text-muted-foreground" : "text-foreground hover:text-primary"}`}
                                          onClick={() => {
                                            if (isPlaceholder) {
                                              setResolveSession({
                                                mealName: meal.name,
                                                dayName: DAY_NAMES[day.dayOfWeek],
                                                slotLabel: row.label,
                                                entryId: entry.id,
                                                dayId: day.id,
                                                mealType: row.mealType ?? row.addMealType,
                                                audience: row.audience,
                                                isDrink: row.isDrink,
                                                position: entry.position,
                                                returnMode: null,
                                                pendingRecipeLink: null,
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
                                          <PlannerMealCardContent
                                            meal={meal}
                                            entryId={entry.id}
                                            isPlaceholder={isPlaceholder}
                                            isCooked={isCooked}
                                          />
                                          {isFrozen && !isCooked && <Snowflake className="h-3 w-3 text-blue-400 flex-shrink-0 mt-0.5" />}
                                          {basketMealIdSet.has(meal.id) && !isCooked && (
                                            <ShoppingCart className="h-3 w-3 text-emerald-500/70 flex-shrink-0 mt-0.5" data-testid={`icon-in-basket-${meal.id}`} />
                                          )}
                                          {isCooked && <Check className="h-3 w-3 text-emerald-500/70 flex-shrink-0 mt-0.5" />}
                                        </button>
                                        {/* Nutrition Boost indicator — subtle, async, non-blocking */}
                                        {!isPlaceholder && (() => {
                                          const isBoosted = boostedMealIds.has(meal.id);
                                          const serverMatches = upliftByMealId.get(meal.id) ?? [];
                                                                                    const suggestionCount = selectVisibleBoosts(serverMatches, weeklyReuseMap, meal.name).length;
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
                                              suggestionCount={suggestionCount}
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
                                              className="absolute top-0 right-0 h-4 w-4 flex items-center justify-center rounded hover-reveal group-hover/entry:opacity-60 hover:!opacity-100 hover:bg-accent/60 transition-opacity"
                                              onClick={(e) => e.stopPropagation()}
                                              data-testid={`button-entry-ops-${entry.id}`}
                                              title="Entry actions"
                                              aria-label="Entry actions"
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
                                                Duplicate meal idea
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
                                  aria-label={`Add ${row.label}`}
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
            {/* ── Weekly Provisioning — moved here from below DndContext for better visibility ── */}
            {week.weekNumber === Number(activeWeek) && activeWeekId && (
              <DroppableProvisioning weekId={activeWeekId} className="mt-4 mb-2" data-testid="section-weekly-provisioning">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors text-left"
                  onClick={() => setProvisioningOpen(v => !v)}
                  data-testid="button-toggle-provisioning"
                >
                  <ShoppingCart className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-sm font-medium text-foreground flex-1">Weekly Provisioning</span>
                  {provisioningItems.length > 0 && (
                    <span className="text-xs text-muted-foreground/70 mr-1">{provisioningItems.length} item{provisioningItems.length !== 1 ? "s" : ""}</span>
                  )}
                  {provisioningOpen
                    ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                    : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
                </button>

                {provisioningOpen && (
                  <div className="mt-1 px-3 py-2.5 rounded-lg border border-border bg-card/50 space-y-2" data-testid="section-provisioning-items">
                    <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                      Household items needed this week — not tied to a specific day. These inform shopping and availability.
                    </p>
                    {provisioningItems.length === 0 ? (
                      <p className="text-xs text-muted-foreground/50 py-1">
                        No provisioning items yet. Use <span className="font-medium">Add to Week</span> from the Analyser to add household items here.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {provisioningItems.map(item => (
                          <div key={item.id} className="flex items-center gap-2 group" data-testid={`prov-item-${item.id}`}>
                            <ShoppingCart className="h-3 w-3 text-emerald-500/60 shrink-0" />
                            <span className="flex-1 text-sm text-foreground">{item.name}</span>
                            {item.note && (
                              <span className="text-xs text-muted-foreground/60 truncate max-w-[120px]">{item.note}</span>
                            )}
                            <button
                              className="hover-reveal group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => deleteProvisioningMutation.mutate(item.id)}
                              aria-label="Remove provisioning item"
                              data-testid={`button-remove-prov-${item.id}`}
                              disabled={deleteProvisioningMutation.isPending}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </DroppableProvisioning>
            )}

          </TabsContent>
        ))}
      </Tabs>
      </div>{/* end flex-1 min-w-0 */}
      <PlannerAssistantPanel
        mode={assistantMode}
        onClose={() => {
          if (plannerScanOpen) handlePlannerScanOpenChange(false);
          if (assistantMode === "resolve") setResolveSession(null);
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
              resolutionContext={resolveSession ? {
                entryId: resolveSession.entryId,
                mealName: resolveSession.mealName,
                returnMode: resolveSession.returnMode,
              } : null}
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
        freezerMeals={freezerMeals}
        dayViewDay={expandedDay}
        dayViewLabel={expandedDayLabel}
        getMeal={getMeal}
        onPlannerInvalidate={() => qc.invalidateQueries({ queryKey: ["/api/planner/full"] })}
        fullPlanner={fullPlanner}
        resolveTarget={resolveSession ?? undefined}
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
        onBuildRecipe={() => setAssistantMode("build")}
        onScanRecipe={() => { setResolveSession(null); plannerRecipeScanCameraRef.current?.click(); }}
        mobileOpen={mobileAssistantOpen}
        onBackToHub={() => {
          if (plannerScanOpen) handlePlannerScanOpenChange(false);
          if (assistantMode === "resolve") setResolveSession(null);
          setAssistantMode(null);
        }}
        consumedProposalId={consumedProposalId}
        onSharePlan={() => setSharePlanOpen(true)}
        shoppingHandoff={shoppingHandoff}
        basketMealsCount={basketMealIds.length}
        buildInitialTitle={resolveSession?.mealName ?? undefined}
        onBuildCreated={(mealId) => {
          invalidateMealLibrary(qc);
          if (resolveSession) {
            const ctx = resolveSession;
            setResolveSession(null);
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
      </div>{/* end flex gap-3 */}
      <DragOverlay dropAnimation={null} modifiers={[snapOverlayToCursor]}>
        {activeDrag ? (
          <div className="flex items-center gap-2 w-[200px] bg-background border border-primary/70 rounded-lg px-3 py-2 text-sm font-medium shadow-lg opacity-90 cursor-grabbing pointer-events-none">
            <span className="flex-1 truncate">
              {activeDrag.type === "proposal-card"
                ? activeDrag.name
                : activeDrag.type === "search-result"
                ? activeDrag.mealName
                : getMeal(activeDrag.entry.mealId)?.name ?? "Meal"}
            </span>
            <GripVertical className="h-4 w-4 text-muted-foreground/30 shrink-0" />
          </div>
        ) : null}
      </DragOverlay>
      </DndContext>

      {/* ── Mobile long-press contextual action sheet ── */}
      <Sheet open={!!contextEntry} onOpenChange={(v) => { if (!v) setContextEntry(null); }}>
        <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-8 pt-0" data-testid="sheet-mobile-entry-actions" data-realm="planner">
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
                      <Copy className="h-4 w-4 text-muted-foreground shrink-0" />Duplicate meal idea
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
        <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-8 pt-0" data-testid="sheet-mobile-move-day" data-realm="planner">
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

      {/* ── Recipe-link confirmation dialog ── */}
      <Dialog
        open={!!(resolveSession?.pendingRecipeLink)}
        onOpenChange={(v) => {
          if (!v) {
            setResolveSession(prev => {
              if (!prev) return null;
              // From placeholder-review: temp session — clear entirely on cancel
              if (prev.returnMode === "placeholder-review") return null;
              // From resolve mode: keep session, clear pending link only
              return { ...prev, pendingRecipeLink: null };
            });
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Link recipe to planned meal?</DialogTitle>
            <DialogDescription>
              Use <span className="font-medium text-foreground">{resolveSession?.pendingRecipeLink?.replacementMealName}</span> for{" "}
              <span className="font-medium text-foreground">{resolveSession?.mealName}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setResolveSession(prev => {
              if (!prev) return null;
              if (prev.returnMode === "placeholder-review") return null;
              return { ...prev, pendingRecipeLink: null };
            })}>
              Cancel
            </Button>
            <Button variant="default"
              onClick={confirmRecipeLink}
              disabled={replacePlaceholderMealMutation.isPending}
            >
              {replacePlaceholderMealMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Link recipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Meal Detail Modal ── */}
      <Dialog open={!!mealDetail} onOpenChange={(v) => { if (!v) { setMealDetail(null); setAdaptationOpen(false); setHouseholdSafeChoice(null); setVariantAccepted(false); setReviewSheetOpen(false); adaptMutation.reset(); setAddGuestOpen(false); setGuestName(""); setGuestDietTypes([]); setGuestRestrictions([]); } }}>
        <DialogContent
          className="max-w-[640px] max-h-[82vh] overflow-y-auto bg-[hsl(var(--background))] border-border p-0"
          style={{ backdropFilter: "none", WebkitBackdropFilter: "none" }}
          data-testid="dialog-meal-detail"
        >
          {mealDetail && (() => {
            const { meal: mealSnapshot, entry, dayId, mealType, audience, isDrink, dayName, slotLabel } = mealDetail;
            // Resolve meal from the live query so ingredient list reflects accepted boosts
            // without requiring the dialog to be closed and reopened.
            const meal = meals.find(m => m.id === mealSnapshot.id) ?? mealSnapshot;
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

                  {/* Eater selector + Guests (collapsible) */}
                  {householdEaters.length > 0 && (
                    <div>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 w-full text-left"
                        onClick={() => setEatersOpen(o => !o)}
                        aria-expanded={eatersOpen}
                      >
                        <h3 className="text-sm font-semibold text-foreground">Who's eating this?</h3>
                        <span className="text-xs text-muted-foreground/60">({householdEaters.length})</span>
                        {eatersOpen
                          ? <ChevronUp className="h-3.5 w-3.5 ml-auto text-muted-foreground/50" />
                          : <ChevronDown className="h-3.5 w-3.5 ml-auto text-muted-foreground/50" />}
                      </button>

                      {eatersOpen && (
                        <div className="mt-2 space-y-3">
                          <div className="flex flex-col gap-1.5">
                            {householdEaters.map((eater) => {
                              const checked = entryEaters.some(e => e.id === eater.id);
                              return (
                                <label
                                  key={eater.id}
                                  htmlFor={`entry-eater-${entry.id}-${eater.id}`}
                                  className="flex items-center gap-2 text-sm cursor-pointer select-none"
                                >
                                  <Checkbox
                                    id={`entry-eater-${entry.id}-${eater.id}`}
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
                                  {/* CONV1 BEH-1 — a "(child)" tag stood here, derived from
                                      `kind`, which means "has no THA account" and says nothing
                                      about age. Deleted rather than reworded: whether someone
                                      holds an account has no bearing on who is eating this meal. */}
                                </label>
                              );
                            })}
                          </div>

                          {/* ── Guest eaters (Phase 5) ── */}
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
                                  aria-label="Guest name"
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
                                  <Button variant="default"
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
                        </div>
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
                          <span className="text-sm font-medium text-foreground">Household Adaptation</span>
                          <span className="text-[10px] text-muted-foreground/60">({householdEaters.length + entryGuests.length})</span>
                          {meal.isHouseholdSafeVariant && (
                            <span className="text-[10px] font-medium text-teal-700 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30 px-1.5 py-0.5 rounded">household-safe</span>
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
                              aria-label={adaptationOpen ? "Hide adaptation details" : "Show adaptation details"}
                            >
                              {adaptationOpen
                                ? <ChevronUp className="h-3.5 w-3.5" />
                                : <ChevronDown className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                        </div>
                      </div>


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
                                // CONV1 BEH-1 — an `isChild` flag derived from `kind` tagged
                                // rows here. `kind` means "has no THA account"; it is not an
                                // age, and account backing has no bearing on whether a meal
                                // suits someone — which is the only question this list asks.
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
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs realm-banner-btn"
                                            disabled={!!preview.validationFailed}
                                            onClick={() => setReviewSheetOpen(true)}
                                          >
                                            <Check className="h-3 w-3 mr-1.5" />
                                            Review &amp; approve adaptation
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className={householdSafeChoice === "separate" ? "h-8 text-xs realm-banner-btn" : "h-8 text-xs"}
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

                  {/*
                   * MealVarietyNudge was intentionally removed from this render site.
                   *
                   * WHY IT WAS BUILT:
                   * MealVarietyNudge detects which nutrition category (fruits, vegetables,
                   * whole grains, herbs/spices, olive oil) is absent from a meal's ingredient
                   * list, then surfaces one pantry-sourced item from that missing category as
                   * a plain-text suggestion.
                   *
                   * WHY IT WAS REMOVED FROM THE MEAL DIALOG:
                   * The engine is pantry-aware and category-gap aware, but it has no knowledge
                   * of the meal type being displayed. This causes culinarily inappropriate
                   * suggestions. The canonical example:
                   *
                   *   Meal: Matambre a la Pizza
                   *   Pantry contains: oats
                   *   Nudge output: "Oats would add a whole grain element."
                   *
                   * The suggestion is nutritionally correct (pizza lacks whole grains) but
                   * culinarily wrong (oats do not belong on pizza). The engine cannot
                   * distinguish between appropriate and inappropriate pairings because it
                   * operates on category gaps alone, not on meal context.
                   *
                   * WHY IT SHOULD NOT BE AUTOMATICALLY REINTRODUCED:
                   * Reintroducing MealVarietyNudge would restore the same problem. Before
                   * bringing it back, the engine would need meal-type awareness — i.e. the
                   * ability to suppress whole-grain suggestions for pizza, curry, etc., and
                   * only fire when the suggested item is culinarily compatible.
                   *
                   * DIFFERENCE FROM MEAL ENHANCEMENTS AND NUTRITION BOOSTS:
                   * MealVarietyNudge: identifies what category is nutritionally absent.
                   *   → "What's missing?"
                   * MealUpliftPanel (Meal Enhancements): merges server uplift rules with
                   *   deterministic meal-type boosts. All visible suggestions are actionable.
                   *   → "Here is a specific addition you can add with one click."
                   *
                   * THA philosophy direction: enhancement opportunities should be relevant
                   * to the actual meal and household, not derived from category-gap analysis
                   * alone. MealUpliftPanel (with deterministic fallback) serves this goal.
                   *
                   * The component and underlying engine (nutrition-variety-chips.tsx,
                   * shared/canonical/plant-classifier.ts) are preserved for the 30 Plants
                   * This Week counter, day-level variety chips, and planner legend — none of
                   * which are affected by this removal.
                   */}

                  {/* Single Nutrition Boost panel — the uplift rules the canonical owner
                      authored and reviewed. All visible suggestions are actionable
                      (Add to meal). */}
                  {(() => {
                    const serverMatches = upliftByMealId.get(meal.id) ?? [];
                    const hasBoostedThisSession = boostedMealIds.has(meal.id);
                    if (serverMatches.length === 0 && !hasBoostedThisSession) return null;
                    return (
                      <MealUpliftPanel
                        mealId={meal.id}
                        plannerEntryId={entry.id}
                        mealSlot={mealType}
                        upliftMatches={serverMatches}
                        currentMealName={meal.name}
                        weeklyReuseMap={weeklyReuseMap}
                        onMealForked={(newMealId) => {
                          // Synchronously update planner cache so entry.mealId points to
                          // the fork — prevents close/reopen from re-targeting the original
                          qc.setQueryData<FullWeek[]>(["/api/planner/full"], (prev) => {
                            if (!prev) return prev;
                            return prev.map((week) => ({
                              ...week,
                              days: week.days.map((day) => ({
                                ...day,
                                entries: day.entries.map((e) =>
                                  e.id === entry.id ? { ...e, mealId: newMealId } : e
                                ),
                              })),
                            }));
                          });
                          qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
                          invalidateMealLibrary(qc);
                        }}
                        onUpliftAccepted={handleUpliftAccepted}
                        onUpliftRemoved={handleUpliftRemoved}
                      />
                    );
                  })()}

                  {/* WX3 — Reused Meal Intelligence (Supports / Introduces /
                      seasonal / household). Fetches only while the meal-detail
                      dialog is open (active), so there is no N+1 across cards.
                      showUplift=false: the actionable uplift is already shown by
                      MealUpliftPanel above. Hidden entirely when empty. */}
                  <CookbookMealIntelligenceStrip
                    mealId={meal.id}
                    active={!!mealDetail}
                    showUplift={false}
                  />

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
                            // Provenance: persisted accepted Nutrition Boost applications,
                            // keyed by normalised ingredient. Label/Remove render only when
                            // a matching accepted row exists — never inferred from name alone.
                            const boostByIngredient = new Map<string, MealUpliftApplication>();
                            for (const app of mealDetailApplications) {
                              if (app.status === "accepted") {
                                boostByIngredient.set(app.ingredient.toLowerCase().trim(), app);
                              }
                            }
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
                              const boostApp = boostByIngredient.get(ing.toLowerCase().trim());
                              if (boostApp) {
                                const isRemovingBoost =
                                  removeBoostFromDialogMutation.isPending &&
                                  removeBoostFromDialogMutation.variables === boostApp.id;
                                return (
                                  <li key={idx} className="text-sm flex items-start gap-2 text-foreground/80">
                                    <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="min-w-0">
                                      {ing}
                                      <span className="flex items-center gap-2 mt-0.5">
                                        <span
                                          className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70"
                                          data-testid={`ingredient-boost-label-${boostApp.id}`}
                                        >
                                          Added via Nutrition Boost
                                        </span>
                                        <button
                                          className="text-[10px] text-muted-foreground/60 hover:text-destructive underline underline-offset-2 transition-colors disabled:opacity-50"
                                          onClick={() => removeBoostFromDialogMutation.mutate(boostApp.id)}
                                          disabled={removeBoostFromDialogMutation.isPending}
                                          aria-label={`Remove ${boostApp.ingredient}`}
                                          data-testid={`ingredient-boost-remove-${boostApp.id}`}
                                        >
                                          {isRemovingBoost ? (
                                            <Loader2 className="h-2.5 w-2.5 animate-spin inline" />
                                          ) : (
                                            "Remove"
                                          )}
                                        </button>
                                      </span>
                                    </span>
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
                      className="realm-banner-btn-danger"
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
                      className="realm-banner-btn"
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
                        className="realm-banner-btn"
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
                        className="realm-banner-btn"
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
                    <Button variant="default"
                      size="sm"
                      className="realm-banner-btn"
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

      {/* ── Save Week Dialog ── */}
      <Dialog open={saveWeekOpen} onOpenChange={(v) => { if (!v) setSaveWeekOpen(false); }}>
        <DialogContent className="max-w-sm" data-testid="dialog-save-week">
          <DialogHeader>
            <DialogTitle>Save this week</DialogTitle>
            <DialogDescription>Give this week a name so you can load it into any week later.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="e.g. Family Favourites"
            aria-label="Saved week name"
            value={saveWeekName}
            onChange={(e) => setSaveWeekName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && saveWeekName.trim() && activeWeekData) saveWeekMutation.mutate({ weekId: activeWeekData.id, name: saveWeekName.trim() }); }}
            autoFocus
            data-testid="input-save-week-name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveWeekOpen(false)}>Cancel</Button>
            <Button variant="default"
              onClick={() => activeWeekData && saveWeekMutation.mutate({ weekId: activeWeekData.id, name: saveWeekName.trim() })}
              disabled={!saveWeekName.trim() || saveWeekMutation.isPending}
              data-testid="button-confirm-save-week"
            >
              {saveWeekMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Load Saved Week Dialog ── */}
      <Dialog open={loadWeekOpen} onOpenChange={(v) => { if (!v) setLoadWeekOpen(false); }}>
        <DialogContent className="max-w-sm" data-testid="dialog-load-week">
          <DialogHeader>
            <DialogTitle>Load saved week</DialogTitle>
            <DialogDescription>Choose a saved week to fill into {activeWeekData?.weekName ?? "this week"}. Existing meals will be replaced.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {myWeekTemplates.map((t: any) => (
              <button
                key={t.id}
                onClick={() => activeWeekData && loadWeekMutation.mutate({ templateId: t.id, weekId: activeWeekData.id })}
                disabled={loadWeekMutation.isPending}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border hover:bg-accent/50 transition-colors text-left"
                data-testid={`button-load-week-${t.id}`}
              >
                <span className="text-sm font-medium">{t.name}</span>
                <span className="text-xs text-muted-foreground">{t.itemCount} meals</span>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoadWeekOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <SelectTrigger aria-label="Target day" data-testid="select-copy-day-target">
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
            <Button variant="default"
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

      {/* Native camera capture for planner recipe scan */}
      <input
        ref={plannerRecipeScanCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handlePlannerRecipeScanFile(f);
          e.target.value = "";
        }}
        data-testid="input-planner-recipe-scan-camera"
      />
      <RecipeScanReview
        open={plannerRecipeScanLoading || plannerRecipeScanData !== null || plannerRecipeScanError !== undefined}
        onOpenChange={(v) => {
          if (!v) {
            setPlannerRecipeScanData(null);
            setPlannerRecipeScanError(undefined);
            setPlannerRecipeScanLoading(false);
          }
        }}
        scanData={plannerRecipeScanData}
        scanning={plannerRecipeScanLoading}
        scanError={plannerRecipeScanError}
        onSaved={() => setPlannerRecipeScanData(null)}
        onMealCreated={(mealId, mealName) => {
          invalidateMealLibrary(qc);
          const ctx = resolveSession;
          if (ctx) {
            replacePlaceholderMealMutation.mutate({ entryId: ctx.entryId, mealId }, {
              onSuccess: () => {
                setResolveSession(null);
                toast({ title: "Recipe linked", description: `${ctx.mealName} resolved with scanned recipe.` });
                if (ctx.returnMode === "placeholder-review") setAssistantMode("placeholder-review");
              },
              onError: () => {
                setResolveSession(null);
                toast({ title: "Scan saved, link failed", variant: "destructive" });
              },
            });
          } else {
            emitStageProposal(mealName, "dinner");
            toast({ title: "Recipe staged", description: `${mealName} added to your planning tray.` });
          }
        }}
      />
      <input
        ref={plannerRecipeScanFileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handlePlannerRecipeScanFile(f);
          e.target.value = "";
        }}
        data-testid="input-planner-recipe-scan-file"
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
