import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle, BookOpen, CalendarDays, Camera, ChefHat,
  CheckCircle2, ChevronDown, Lightbulb, Loader2, Pencil,
  Plus, ShoppingCart, Sparkles, X, Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlannerMealScanItem {
  label: string;
  interpretedName?: string;
  day: string | null;
  mealSlot: string | null;
  confidence: "low" | "medium" | "high";
  sourceText?: string;
  proposedType?: "scheduled" | "meal_idea" | "unknown";
  contextNote?: string;
}

export interface PlannerShoppingScanItem {
  label: string;
  quantity: string | null;
  confidence: "low" | "medium" | "high";
  sourceText?: string;
}

export interface PlannerScanData {
  mode: "planner";
  rawText: string;
  parsed: {
    mode: "planner";
    meals: PlannerMealScanItem[];
    shoppingItems: PlannerShoppingScanItem[];
    warnings: string[];
  } | null;
  parsedBy: "vision" | "ocr-fallback" | "failed";
  confidence: "high" | "medium" | "low" | "none";
  warnings: string[];
}

export interface PlannerDayEntry {
  id: number;
  dayOfWeek: number;
  dayName: string;
}

// ── Proposal model (in-memory only, never persisted directly) ─────────────────

type ProposalType = "scheduled" | "meal_idea" | "unknown";

interface PlannerScanProposal {
  id: number;
  // Layer 1 — raw extraction (immutable)
  rawText: string;
  // Layer 2 — AI interpretation (immutable)
  interpretedName: string;
  proposedType: ProposalType;
  proposedDay: string | null;
  proposedSlot: string | null;
  confidence: "low" | "medium" | "high";
  contextNote?: string;
  // Layer 3 — user working state (mutable)
  userAction: "pending" | "accepted" | "removed";
  currentName: string;
  currentType: ProposalType;
  currentDay: string;
  currentSlot: string;
}

interface EditableShoppingItem {
  id: number;
  label: string;
  quantity: string;
  confidence: "low" | "medium" | "high";
  sourceText?: string;
  include: boolean;
}

interface SavedMealForFollowUp {
  name: string;
  mealId: number | null;
  entryId: number | null;
  plannerDayId: number | null;
  day: string;
  mealSlot: string;
  confidence?: "low" | "medium" | "high";
  action: "pending" | "skipped";
}

// Phase 3G: planner resolution context passed in from the host page
export interface ScanResolutionContext {
  entryId: number;
  mealName: string;
  returnMode: "placeholder-review" | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanData: PlannerScanData | null;
  scanning?: boolean;
  scanError?: string;
  plannerDays: PlannerDayEntry[];
  onSaved?: () => void;
  inline?: boolean;
  /** Phase 3G: when set, scan recipe follow-up URLs carry resolution context */
  resolutionContext?: ScanResolutionContext | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const WEEKDAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"] as const;
const MEAL_SLOTS = ["breakfast","lunch","dinner","snacks"] as const;
const SLOT_LABELS: Record<string, string> = {
  breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snacks: "Snacks",
};

const SCAN_LOADING_MESSAGES = [
  "Reading meal plan...",
  "Identifying meals and days...",
  "Preparing review...",
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function toProposal(m: PlannerMealScanItem, id: number): PlannerScanProposal {
  const rawText = m.sourceText || m.label;
  const interpretedName = m.interpretedName?.trim() || m.label;
  const proposedType: ProposalType =
    m.proposedType === "scheduled" || m.proposedType === "meal_idea"
      ? m.proposedType
      : m.day ? "scheduled" : "unknown";
  const proposedDay = m.day && (WEEKDAYS as readonly string[]).includes(m.day) ? m.day : null;
  const proposedSlot = m.mealSlot && (MEAL_SLOTS as readonly string[]).includes(m.mealSlot) ? m.mealSlot : null;

  return {
    id,
    rawText,
    interpretedName,
    proposedType,
    proposedDay,
    proposedSlot,
    confidence: m.confidence,
    contextNote: m.contextNote,
    userAction: "pending",
    currentName: interpretedName,
    currentType: proposedType,
    currentDay: proposedDay ?? "Unassigned",
    currentSlot: proposedSlot ?? "unspecified",
  };
}

function toEditableShoppingItem(i: PlannerShoppingScanItem, id: number): EditableShoppingItem {
  return { id, label: i.label, quantity: i.quantity ?? "", confidence: i.confidence, sourceText: i.sourceText, include: false };
}

// ── Confidence indicator ──────────────────────────────────────────────────────

function ConfidenceDots({ level }: { level: "low" | "medium" | "high" }) {
  const filled = level === "high" ? 3 : level === "medium" ? 2 : 1;
  const color = level === "high" ? "bg-emerald-500" : level === "medium" ? "bg-amber-400" : "bg-red-400";
  const label = level === "high" ? "High confidence" : level === "medium" ? "Medium confidence" : "Low confidence — review needed";
  return (
    <div className="flex items-center gap-0.5 shrink-0" title={label}>
      {[1, 2, 3].map(i => (
        <div key={i} className={`h-2 w-2 rounded-full ${i <= filled ? color : "bg-muted-foreground/20"}`} />
      ))}
    </div>
  );
}

// ── Warning translation ────────────────────────────────────────────────────────

const TECHNICAL_TERMS_RE = /\b(OCR|AI image service|vision (service|pipeline|api)|backend)\b/gi;

function translateWarning(w: string): string {
  const lower = w.toLowerCase();
  // Week-based planner (any variant: "Week 6", "week headings", "week numbers", etc.)
  if (
    lower.includes("week") &&
    (lower.includes("heading") || lower.includes("number") || lower.includes("format") ||
     lower.includes("detected") || /week\s*\d/.test(lower))
  ) {
    return "Week-based planner detected — days could not be assigned";
  }
  return w.replace(TECHNICAL_TERMS_RE, "scan service").trim();
}

// ── Session persistence ────────────────────────────────────────────────────────

const SCAN_SESSION_KEY = "planner-scan-review-session";

interface ScanSessionData {
  proposals: PlannerScanProposal[];
  shoppingItems: EditableShoppingItem[];
  scanData: PlannerScanData;
}

function saveSession(data: ScanSessionData): void {
  try { sessionStorage.setItem(SCAN_SESSION_KEY, JSON.stringify(data)); } catch {}
}

function loadSession(): ScanSessionData | null {
  try {
    const raw = sessionStorage.getItem(SCAN_SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as ScanSessionData;
    if (!data?.proposals || !data?.scanData) return null;
    return data;
  } catch { return null; }
}

function clearSession(): void {
  try { sessionStorage.removeItem(SCAN_SESSION_KEY); } catch {}
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PlannerScanReview({ open, onOpenChange, scanData, scanning = false, scanError, plannerDays, onSaved, inline = false, resolutionContext = null }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [rawOpen, setRawOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [step, setStep] = useState<"review" | "recipe-followup">("review");
  const [savedMealsFollowUp, setSavedMealsFollowUp] = useState<SavedMealForFollowUp[]>([]);

  // ── Edit state (one proposal can be edited at a time) ──────────────────────
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<ProposalType>("scheduled");
  const [editDay, setEditDay] = useState("Unassigned");
  const [editSlot, setEditSlot] = useState("unspecified");

  const [restoredScanData, setRestoredScanData] = useState<PlannerScanData | null>(null);
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const [closeConfirmVisible, setCloseConfirmVisible] = useState(false);

  useEffect(() => {
    if (!scanning) { setLoadingMsgIdx(0); return; }
    setLoadingMsgIdx(0);
    const t1 = setTimeout(() => setLoadingMsgIdx(1), 4000);
    const t2 = setTimeout(() => setLoadingMsgIdx(2), 9000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [scanning]);

  const initProposals = (): PlannerScanProposal[] =>
    (scanData?.parsed?.meals ?? []).map((m, i) => toProposal(m, i));
  const initShoppingItems = (): EditableShoppingItem[] =>
    (scanData?.parsed?.shoppingItems ?? []).map((i, idx) => toEditableShoppingItem(i, idx));

  const [proposals, setProposals] = useState<PlannerScanProposal[]>(initProposals);
  const [shoppingItems, setShoppingItems] = useState<EditableShoppingItem[]>(initShoppingItems);

  const [lastScanData, setLastScanData] = useState<PlannerScanData | null>(null);
  if (scanData !== lastScanData) {
    setLastScanData(scanData);
    setProposals(initProposals());
    setShoppingItems(initShoppingItems());
    setRawOpen(false);
    setStep("review");
    setSavedMealsFollowUp([]);
    setEditingId(null);
    if (scanData !== null) {
      setRestoredScanData(null);
      setShowRestoreBanner(false);
      setCloseConfirmVisible(false);
    }
  }

  const effectiveScanData = scanData ?? restoredScanData;

  // Restore previous session when dialog opens with no live scan data
  useEffect(() => {
    if (!open || scanData) return;
    const session = loadSession();
    if (!session) return;
    setRestoredScanData(session.scanData);
    setProposals(session.proposals);
    setShoppingItems(session.shoppingItems);
    setShowRestoreBanner(true);
  }, [open, scanData]);

  // Auto-save session whenever review state changes
  useEffect(() => {
    if (!open || step !== "review") return;
    const esd = scanData ?? restoredScanData;
    if (!esd || proposals.length === 0) return;
    saveSession({ proposals, shoppingItems, scanData: esd });
  }, [open, step, proposals, shoppingItems, scanData, restoredScanData]);

  const handleClose = () => {
    if (step === "review" && acceptedProposals.length > 0 && !saving) {
      setCloseConfirmVisible(true);
      return;
    }
    clearSession();
    setRestoredScanData(null);
    setShowRestoreBanner(false);
    setCloseConfirmVisible(false);
    onOpenChange(false);
  };

  // ── Proposal handlers ──────────────────────────────────────────────────────

  const acceptProposal = (id: number) =>
    setProposals(prev => prev.map(p => p.id === id ? { ...p, userAction: "accepted" } : p));

  const removeProposal = (id: number) =>
    setProposals(prev => prev.map(p => p.id === id ? { ...p, userAction: "removed" } : p));

  const undoProposal = (id: number) =>
    setProposals(prev => prev.map(p => p.id === id ? { ...p, userAction: "pending" } : p));

  const startEdit = (p: PlannerScanProposal) => {
    setEditingId(p.id);
    setEditName(p.currentName);
    setEditType(p.currentType);
    setEditDay(p.currentDay);
    setEditSlot(p.currentSlot);
  };

  const saveEdit = () => {
    if (editingId === null) return;
    setProposals(prev => prev.map(p => p.id === editingId ? {
      ...p,
      userAction: "accepted",
      currentName: editName.trim() || p.interpretedName,
      currentType: editType,
      currentDay: editType === "meal_idea" ? "Unassigned" : editDay,
      currentSlot: editType === "meal_idea" ? "unspecified" : editSlot,
    } : p));
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const addManualProposalOfType = (type: ProposalType = "scheduled") => {
    const nextId = Math.max(...proposals.map(p => p.id), -1) + 1;
    const newP: PlannerScanProposal = {
      id: nextId,
      rawText: "",
      interpretedName: "",
      proposedType: type,
      proposedDay: null,
      proposedSlot: null,
      confidence: "high",
      userAction: "pending",
      currentName: "",
      currentType: type,
      currentDay: "Unassigned",
      currentSlot: "unspecified",
    };
    setProposals(prev => [...prev, newP]);
    setEditingId(nextId);
    setEditName("");
    setEditType(type);
    setEditDay("Unassigned");
    setEditSlot("unspecified");
  };
  const addManualProposal = () => addManualProposalOfType("scheduled");

  const updateShoppingItem = (id: number, field: keyof EditableShoppingItem, value: unknown) =>
    setShoppingItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));

  // ── Derived state ──────────────────────────────────────────────────────────

  const isFailedParse = !effectiveScanData?.parsed || effectiveScanData.parsedBy === "failed";
  const visibleProposals = proposals.filter(p => p.userAction !== "removed");
  const acceptedProposals = proposals.filter(p => p.userAction === "accepted");
  const actionedCount = proposals.filter(p => p.userAction !== "pending").length;
  const totalCount = proposals.length;
  const progressPct = totalCount > 0 ? Math.round((actionedCount / totalCount) * 100) : 0;
  const hasPendingLow = proposals.some(p => p.confidence === "low" && p.userAction === "pending");
  const canConfirm = acceptedProposals.length > 0 && acceptedProposals.every(p => p.currentName.trim().length > 0);
  const selectedShoppingItems = shoppingItems.filter(i => i.include);

  const allWarnings = [
    ...(effectiveScanData?.warnings ?? []),
    ...(effectiveScanData?.parsed?.warnings ?? []),
  ];

  // ── Compact review notes (deduplicated, human-centred) ─────────────────────
  const reviewNotes: string[] = (() => {
    if (!effectiveScanData || isFailedParse) return [];
    const notes: string[] = [];
    const seen = new Set<string>();

    const add = (text: string) => {
      if (!seen.has(text)) { seen.add(text); notes.push(text); }
    };

    if (effectiveScanData.parsedBy === "ocr-fallback") {
      add("Scan confidence reduced — suggestions may need additional review");
    } else if (effectiveScanData.confidence === "low") {
      add("Low scan confidence — review all suggestions carefully");
    }

    for (const w of allWarnings) {
      if (w.includes("AI image service") || w.includes("AI had trouble") || w.includes("trouble reaching")) continue;
      add(translateWarning(w));
    }

    return notes;
  })();

  // ── Grouped review sections ────────────────────────────────────────────────
  const plannedProposals = visibleProposals.filter(p => p.currentType !== "meal_idea");
  const ideaProposals   = visibleProposals.filter(p => p.currentType === "meal_idea");

  const acceptAllHighConfidenceInGroup = (ids: number[]) =>
    setProposals(prev =>
      prev.map(p =>
        ids.includes(p.id) && p.confidence !== "low" && p.userAction === "pending"
          ? { ...p, userAction: "accepted" } : p
      )
    );

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    setSaving(true);
    let mealsAssigned = 0;
    let itemsAdded = 0;
    const followUpMeals: SavedMealForFollowUp[] = [];

    try {
      for (const p of acceptedProposals) {
        const name = p.currentName.trim() || "Scanned Meal";
        const effectiveDay = p.currentType === "meal_idea" ? "Unassigned" : p.currentDay;

        if (effectiveDay && effectiveDay !== "Unassigned") {
          const mealRes = await apiRequest("POST", "/api/meals", {
            name,
            ingredients: [],
            instructions: [],
            servings: 1,
            audience: "adult",
            isDrink: false,
            mealSourceType: "planner-placeholder",
          });
          const mealData = await mealRes.json();
          const mealId: number = mealData.id;

          const plannerDay = plannerDays.find(d => d.dayName === effectiveDay);
          if (plannerDay) {
            const slot = p.currentSlot !== "unspecified" ? p.currentSlot : "dinner";
            const entryRes = await apiRequest("POST", `/api/planner/days/${plannerDay.id}/items`, {
              mealSlot: slot,
              mealId,
              position: 0,
              audience: "adult",
              isDrink: false,
              drinkType: null,
            });
            const entryData = await entryRes.json();
            mealsAssigned++;
            followUpMeals.push({
              name, mealId, entryId: entryData.id ?? null,
              plannerDayId: plannerDay.id,
              day: effectiveDay,
              mealSlot: slot,
              confidence: p.confidence,
              action: "pending",
            });
          } else {
            followUpMeals.push({
              name, mealId, entryId: null, plannerDayId: null,
              day: effectiveDay, mealSlot: p.currentSlot,
              confidence: p.confidence,
              action: "pending",
            });
          }
        } else {
          followUpMeals.push({
            name, mealId: null, entryId: null, plannerDayId: null,
            day: "Unassigned",
            mealSlot: p.currentSlot !== "unspecified" ? p.currentSlot : "unspecified",
            confidence: p.confidence,
            action: "pending",
          });
        }
      }

      for (const item of selectedShoppingItems) {
        const label = item.label.trim();
        if (!label) continue;
        const body: Record<string, unknown> = { productName: label };
        const qty = parseFloat(item.quantity);
        if (!isNaN(qty) && qty > 0) body.quantityValue = qty;
        await fetch(api.shoppingList.add.path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "include",
        });
        itemsAdded++;
      }

      queryClient.invalidateQueries({ queryKey: ["/api/planner/full"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      if (itemsAdded > 0) queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      if (itemsAdded > 0) toast({ title: `${itemsAdded} shopping item${itemsAdded !== 1 ? "s" : ""} added` });

      onSaved?.();
      clearSession();
      setSavedMealsFollowUp(followUpMeals);
      setStep("recipe-followup");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Could not save", description: err?.message || "Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const skipFollowUpMeal = (idx: number) =>
    setSavedMealsFollowUp(prev => prev.map((m, i) => i === idx ? { ...m, action: "skipped" } : m));

  const buildPlannerImportUrl = (meal: SavedMealForFollowUp, mode: "import" | "scan" | "manual") => {
    const params = new URLSearchParams({
      plannerImport: "1",
      mealName: meal.name,
      day: meal.day,
      slot: meal.mealSlot,
    });
    if (meal.plannerDayId) params.set("dayId", String(meal.plannerDayId));
    if (meal.entryId) params.set("entryId", String(meal.entryId));
    if (mode === "scan") params.set("openScan", "1");
    // Phase 3G: preserve planner resolution context through the import flow
    if (resolutionContext) {
      params.set("plannerResolve", "1");
      if (resolutionContext.returnMode) params.set("returnMode", resolutionContext.returnMode);
    }
    return `/meals?${params.toString()}`;
  };

  const FOLLOWUP_SLOT_LABELS: Record<string, string> = {
    breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snacks: "Snacks",
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const dialogTitle = scanning
    ? "Scanning meal plan…"
    : step === "recipe-followup"
    ? "Meals added to planner"
    : "Review THA's suggestions";

  const dialogDescription = scanning
    ? "AI meal plan scans can take 5–15 seconds depending on image quality."
    : step === "recipe-followup"
    ? "Do you have a recipe for any of these meals?"
    : "THA has interpreted your scan — accept, edit, or remove each suggestion.";

  const handleDialogClose = (newOpen: boolean) => {
    if (!newOpen && scanning) return;
    if (!newOpen && step === "review" && acceptedProposals.length > 0 && !saving) {
      setCloseConfirmVisible(true);
      return;
    }
    if (!newOpen) {
      clearSession();
      setRestoredScanData(null);
      setShowRestoreBanner(false);
      setCloseConfirmVisible(false);
    }
    onOpenChange(newOpen);
  };

  const bodyContent = (
        <div className="space-y-4">

          {/* ── Loading state ── */}
          {scanning && (
            <div className="flex flex-col items-center justify-center gap-4 py-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">{SCAN_LOADING_MESSAGES[loadingMsgIdx]}</p>
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                AI meal plan scans can take 5–15 seconds depending on image quality.
              </p>
              <Button variant="outline" size="sm" onClick={handleClose} className="mt-2">Cancel scan</Button>
            </div>
          )}

          {/* ── Error state ── */}
          {!scanning && scanError && !scanData && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{scanError}</span>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={handleClose}>Close</Button>
              </div>
            </div>
          )}

          {/* ── Recipe follow-up step ── */}
          {!scanning && step === "recipe-followup" && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-sm text-emerald-800 dark:text-emerald-300">
                  {savedMealsFollowUp.filter(m => m.day !== "Unassigned").length > 0
                    ? `${savedMealsFollowUp.filter(m => m.day !== "Unassigned").length} meal${savedMealsFollowUp.filter(m => m.day !== "Unassigned").length !== 1 ? "s" : ""} added to your planner.`
                    : "Meals noted for recipe action below."}
                  {savedMealsFollowUp.filter(m => m.day === "Unassigned").length > 0 && (
                    <span className="text-emerald-700 dark:text-emerald-400">
                      {" "}{savedMealsFollowUp.filter(m => m.day === "Unassigned").length} meal idea{savedMealsFollowUp.filter(m => m.day === "Unassigned").length !== 1 ? "s" : ""} saved (no planner entry).
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Add a recipe now so your planner can generate a shopping list. You can skip any meal and come back later.
              </p>

              <div className="space-y-3">
                {savedMealsFollowUp.map((meal, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border p-3 space-y-2.5 transition-opacity ${meal.action === "skipped" ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium truncate">{meal.name}</p>
                          {meal.confidence === "low" && (
                            <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-700 dark:text-yellow-400 gap-1 shrink-0">
                              <AlertTriangle className="h-3 w-3" />
                              Check name
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {meal.day === "Unassigned"
                            ? "Meal idea — no planner entry created"
                            : `${meal.day}${meal.mealSlot && meal.mealSlot !== "unspecified" ? ` · ${FOLLOWUP_SLOT_LABELS[meal.mealSlot] ?? meal.mealSlot}` : ""}`}
                        </p>
                      </div>
                      {meal.action === "skipped" && (
                        <Badge variant="outline" className="text-xs shrink-0">Skipped</Badge>
                      )}
                    </div>

                    {meal.action === "pending" && (
                      <div className="flex gap-1.5 flex-wrap">
                        <Button
                          variant="outline" size="sm" className="gap-1.5 h-8 text-xs"
                          onClick={() => { handleClose(); navigate(buildPlannerImportUrl(meal, "import")); }}
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          Import recipe
                        </Button>
                        <Button
                          variant="outline" size="sm" className="gap-1.5 h-8 text-xs"
                          onClick={() => { handleClose(); navigate(buildPlannerImportUrl(meal, "scan")); }}
                        >
                          <Camera className="h-3.5 w-3.5" />
                          Scan recipe
                        </Button>
                        <Button
                          variant="outline" size="sm" className="gap-1.5 h-8 text-xs"
                          onClick={() => { handleClose(); navigate(buildPlannerImportUrl(meal, "manual")); }}
                        >
                          <ChefHat className="h-3.5 w-3.5" />
                          Build manually
                        </Button>
                        <Button
                          variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground"
                          onClick={() => skipFollowUpMeal(idx)}
                        >
                          Skip for now
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Separator />
              <div className="flex justify-end">
                <Button onClick={handleClose}>Done</Button>
              </div>
            </div>
          )}

          {/* ── Review step ── */}
          {!scanning && !(scanError && !scanData) && step === "review" && (<>

            {/* ── Restore banner ── */}
            {showRestoreBanner && (
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/10 px-3 py-2 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-400">Previous review restored</p>
                  <p className="text-xs text-muted-foreground">We found an unfinished review session — your progress has been restored.</p>
                </div>
                <Button size="sm" variant="ghost" className="h-6 text-xs px-2 text-muted-foreground shrink-0" onClick={() => {
                  clearSession();
                  setRestoredScanData(null);
                  setProposals([]);
                  setShoppingItems([]);
                  setShowRestoreBanner(false);
                }}>Discard</Button>
              </div>
            )}

            {/* ── Compact review notes (replaces stacked warning banners) ── */}
            {reviewNotes.length > 0 && (
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/10 px-3 py-2 space-y-0.5">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  Review notes
                </p>
                {reviewNotes.map((note, i) => (
                  <p key={i} className="text-xs text-amber-700 dark:text-amber-300 pl-[18px]">{note}</p>
                ))}
              </div>
            )}

            {isFailedParse ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  We couldn't extract a meal plan from this image. Check the raw text below or try a clearer photo.
                </p>
                {effectiveScanData?.rawText && (
                  <pre className="rounded-md bg-muted px-3 py-2 text-xs whitespace-pre-wrap text-muted-foreground max-h-48 overflow-y-auto">
                    {effectiveScanData.rawText}
                  </pre>
                )}
              </div>
            ) : (<>

              {/* Progress indicator */}
              {totalCount > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {actionedCount} of {totalCount} reviewed
                      {acceptedProposals.length > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 ml-1.5">· {acceptedProposals.length} accepted</span>
                      )}
                    </span>
                    {hasPendingLow && (
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Low-confidence items need review
                      </span>
                    )}
                  </div>
                  <Progress value={progressPct} className="h-1.5" />
                </div>
              )}

              {/* ── Grouped compact review ── */}
              <div className="space-y-4">

                {/* ── Planned meals section ── */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      Planned meals
                      {plannedProposals.length > 0 && (
                        <Badge variant="secondary" className="text-xs">{plannedProposals.length}</Badge>
                      )}
                    </label>
                    <div className="flex items-center gap-1">
                      {plannedProposals.some(p => p.confidence !== "low" && p.userAction === "pending") && (
                        <Button
                          type="button" variant="ghost" size="sm"
                          className="text-xs h-6 px-2 text-emerald-700 dark:text-emerald-400"
                          onClick={() => acceptAllHighConfidenceInGroup(plannedProposals.map(p => p.id))}
                        >
                          Accept all
                        </Button>
                      )}
                      <Button
                        type="button" variant="ghost" size="sm" className="h-6 w-6 p-0"
                        onClick={() => addManualProposalOfType("scheduled")}
                        title="Add planned meal"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {plannedProposals.length > 0 ? (
                    <div className="rounded-lg border divide-y overflow-hidden">
                      {plannedProposals.map(p => {
                        const isEditing = editingId === p.id;
                        const isLow = p.confidence === "low";
                        const placement = p.currentDay !== "Unassigned"
                          ? `${p.currentDay}${p.currentSlot !== "unspecified" ? ` · ${SLOT_LABELS[p.currentSlot] ?? p.currentSlot}` : ""}`
                          : "Unassigned";

                        if (isEditing) {
                          return (
                            <div key={p.id} className="px-3 py-2.5 bg-primary/5 space-y-2">
                              <Input
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="h-7 text-sm"
                                placeholder="Meal name"
                                autoFocus
                                onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                              />
                              <div className="flex gap-1.5 flex-wrap items-center">
                                <button type="button" onClick={() => setEditType("scheduled")}
                                  className={`text-xs py-0.5 px-2 rounded border transition-colors flex items-center gap-1 ${editType === "scheduled" ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-accent"}`}>
                                  <CalendarDays className="h-2.5 w-2.5" />Scheduled
                                </button>
                                <button type="button" onClick={() => setEditType("meal_idea")}
                                  className={`text-xs py-0.5 px-2 rounded border transition-colors flex items-center gap-1 ${editType === "meal_idea" ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-accent"}`}>
                                  <Lightbulb className="h-2.5 w-2.5" />Idea
                                </button>
                                {editType === "scheduled" && (<>
                                  <Select value={editDay} onValueChange={setEditDay}>
                                    <SelectTrigger className="h-6 text-xs w-28"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Unassigned">Unassigned</SelectItem>
                                      {WEEKDAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                  <Select value={editSlot} onValueChange={setEditSlot}>
                                    <SelectTrigger className="h-6 text-xs w-24"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="unspecified">Unspecified</SelectItem>
                                      {MEAL_SLOTS.map(s => <SelectItem key={s} value={s}>{SLOT_LABELS[s]}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </>)}
                              </div>
                              {p.rawText && (
                                <p className="text-xs text-muted-foreground">From scan: <em>"{p.rawText}"</em></p>
                              )}
                              <div className="flex gap-1.5">
                                <Button size="sm" className="h-6 text-xs gap-1 px-2" onClick={saveEdit}
                                  disabled={!editName.trim() && !p.interpretedName}>
                                  <Check className="h-2.5 w-2.5" />Save
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={cancelEdit}>Cancel</Button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={p.id} className={`flex items-start gap-2 px-3 py-2 ${
                            p.userAction === "accepted" ? "bg-emerald-50/40 dark:bg-emerald-950/10" :
                            isLow ? "bg-amber-50/30 dark:bg-amber-950/10" : ""
                          }`}>
                            <button
                              className={`mt-0.5 shrink-0 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                                p.userAction === "accepted"
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "border-muted-foreground/30 hover:border-emerald-500"
                              }`}
                              onClick={() => p.userAction === "accepted" ? undoProposal(p.id) : acceptProposal(p.id)}
                              title={p.userAction === "accepted" ? "Accepted — click to undo" : "Accept"}
                            >
                              {p.userAction === "accepted" && <Check className="h-2.5 w-2.5" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm break-words leading-snug">
                                {p.currentName || <span className="text-muted-foreground italic">Unnamed meal</span>}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">{placement}</p>
                              {p.rawText && p.rawText !== p.currentName && (
                                <p className="text-xs text-muted-foreground break-words">↳ <em>{p.rawText}</em></p>
                              )}
                              {p.contextNote && (
                                <p className="text-xs text-muted-foreground/60 italic break-words">
                                  <Sparkles className="h-2.5 w-2.5 inline mr-0.5 text-primary/40" />{p.contextNote}
                                </p>
                              )}
                              {isLow && p.userAction === "pending" && (
                                <p className="text-xs text-amber-600 dark:text-amber-400">Review needed</p>
                              )}
                            </div>
                            <div className="self-center shrink-0"><ConfidenceDots level={p.confidence} /></div>
                            <div className="flex items-center gap-0.5 shrink-0 self-start">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => startEdit(p)} title="Edit">
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => removeProposal(p.id)} title="Remove">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-3 rounded-lg border border-dashed">
                      No planned meals detected — tap + to add
                    </p>
                  )}
                </div>

                {/* ── Lunch ideas section (shown when ideas exist) ── */}
                {ideaProposals.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium flex items-center gap-1.5">
                        <Lightbulb className="h-4 w-4 text-muted-foreground" />
                        Lunch ideas
                        <Badge variant="secondary" className="text-xs">{ideaProposals.length}</Badge>
                      </label>
                      <div className="flex items-center gap-1">
                        {ideaProposals.some(p => p.confidence !== "low" && p.userAction === "pending") && (
                          <Button
                            type="button" variant="ghost" size="sm"
                            className="text-xs h-6 px-2 text-emerald-700 dark:text-emerald-400"
                            onClick={() => acceptAllHighConfidenceInGroup(ideaProposals.map(p => p.id))}
                          >
                            Accept all
                          </Button>
                        )}
                        <Button
                          type="button" variant="ghost" size="sm" className="h-6 w-6 p-0"
                          onClick={() => addManualProposalOfType("meal_idea")}
                          title="Add lunch idea"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Flexible ideas — not added to planner. Edit to schedule a day.</p>
                    <div className="rounded-lg border divide-y overflow-hidden">
                      {ideaProposals.map(p => {
                        const isEditing = editingId === p.id;
                        const isLow = p.confidence === "low";

                        if (isEditing) {
                          return (
                            <div key={p.id} className="px-3 py-2.5 bg-primary/5 space-y-2">
                              <Input
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="h-7 text-sm"
                                placeholder="Meal name"
                                autoFocus
                                onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                              />
                              <div className="flex gap-1.5 flex-wrap items-center">
                                <button type="button" onClick={() => setEditType("meal_idea")}
                                  className={`text-xs py-0.5 px-2 rounded border transition-colors flex items-center gap-1 ${editType === "meal_idea" ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-accent"}`}>
                                  <Lightbulb className="h-2.5 w-2.5" />Idea
                                </button>
                                <button type="button" onClick={() => setEditType("scheduled")}
                                  className={`text-xs py-0.5 px-2 rounded border transition-colors flex items-center gap-1 ${editType === "scheduled" ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-accent"}`}>
                                  <CalendarDays className="h-2.5 w-2.5" />Schedule
                                </button>
                                {editType === "scheduled" && (<>
                                  <Select value={editDay} onValueChange={setEditDay}>
                                    <SelectTrigger className="h-6 text-xs w-28"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Unassigned">Unassigned</SelectItem>
                                      {WEEKDAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                  <Select value={editSlot} onValueChange={setEditSlot}>
                                    <SelectTrigger className="h-6 text-xs w-24"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="unspecified">Unspecified</SelectItem>
                                      {MEAL_SLOTS.map(s => <SelectItem key={s} value={s}>{SLOT_LABELS[s]}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </>)}
                              </div>
                              {p.rawText && (
                                <p className="text-xs text-muted-foreground">From scan: <em>"{p.rawText}"</em></p>
                              )}
                              <div className="flex gap-1.5">
                                <Button size="sm" className="h-6 text-xs gap-1 px-2" onClick={saveEdit}
                                  disabled={!editName.trim() && !p.interpretedName}>
                                  <Check className="h-2.5 w-2.5" />Save
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={cancelEdit}>Cancel</Button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={p.id} className={`flex items-start gap-2 px-3 py-2 ${
                            p.userAction === "accepted" ? "bg-emerald-50/40 dark:bg-emerald-950/10" :
                            isLow ? "bg-amber-50/30 dark:bg-amber-950/10" : ""
                          }`}>
                            <button
                              className={`mt-0.5 shrink-0 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                                p.userAction === "accepted"
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "border-muted-foreground/30 hover:border-emerald-500"
                              }`}
                              onClick={() => p.userAction === "accepted" ? undoProposal(p.id) : acceptProposal(p.id)}
                              title={p.userAction === "accepted" ? "Accepted — click to undo" : "Accept"}
                            >
                              {p.userAction === "accepted" && <Check className="h-2.5 w-2.5" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm break-words leading-snug">
                                {p.currentName || <span className="text-muted-foreground italic">Unnamed</span>}
                              </p>
                              {p.rawText && p.rawText !== p.currentName && (
                                <p className="text-xs text-muted-foreground break-words">↳ <em>{p.rawText}</em></p>
                              )}
                              {p.contextNote && (
                                <p className="text-xs text-muted-foreground/60 italic break-words">
                                  <Sparkles className="h-2.5 w-2.5 inline mr-0.5 text-primary/40" />{p.contextNote}
                                </p>
                              )}
                              {isLow && p.userAction === "pending" && (
                                <p className="text-xs text-amber-600 dark:text-amber-400">Review needed</p>
                              )}
                            </div>
                            <div className="self-center shrink-0"><ConfidenceDots level={p.confidence} /></div>
                            <div className="flex items-center gap-0.5 shrink-0 self-start">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => startEdit(p)} title="Edit">
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => removeProposal(p.id)} title="Remove">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Global empty state ── */}
                {visibleProposals.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4 rounded-lg border border-dashed">
                    No meals detected — tap + to add manually, or try a clearer photo.
                  </p>
                )}

              </div>

              {/* Shopping items (opt-in) */}
              {shoppingItems.length > 0 && (<>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Shopping list items also found</p>
                    {selectedShoppingItems.length > 0 && (
                      <Badge variant="secondary" className="text-xs">{selectedShoppingItems.length} selected</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select items below to add them to your shopping list.
                  </p>
                  <div className="space-y-2">
                    {shoppingItems.map(item => (
                      <div key={item.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-opacity ${!item.include ? "opacity-60" : ""}`}>
                        <Checkbox
                          checked={item.include}
                          onCheckedChange={v => updateShoppingItem(item.id, "include", !!v)}
                          aria-label={`Include ${item.label}`}
                        />
                        <div className="flex-1 min-w-0">
                          <Input
                            value={item.label}
                            onChange={e => updateShoppingItem(item.id, "label", e.target.value)}
                            placeholder="Item name"
                            disabled={!item.include}
                            className="h-7 text-xs"
                          />
                        </div>
                        {item.confidence === "low" && (
                          <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-700 dark:text-yellow-400 shrink-0">Check</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>)}

              {/* Raw scan text (collapsible) */}
              {effectiveScanData?.rawText && (
                <Collapsible open={rawOpen} onOpenChange={setRawOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground w-full justify-between">
                      View full scan text
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${rawOpen ? "rotate-180" : ""}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <pre className="mt-2 rounded-md bg-muted px-3 py-2 text-xs whitespace-pre-wrap text-muted-foreground max-h-40 overflow-y-auto">
                      {effectiveScanData.rawText}
                    </pre>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </>)}

            {/* ── Close confirmation ── */}
            {closeConfirmVisible && (
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20 px-3 py-2.5 space-y-2">
                <p className="text-sm font-medium">Discard review progress?</p>
                <p className="text-xs text-muted-foreground">
                  You have {acceptedProposals.length} accepted suggestion{acceptedProposals.length !== 1 ? "s" : ""} — closing will discard them.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => {
                    clearSession();
                    setRestoredScanData(null);
                    setShowRestoreBanner(false);
                    setCloseConfirmVisible(false);
                    onOpenChange(false);
                  }}>Discard & close</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setCloseConfirmVisible(false)}>Keep reviewing</Button>
                </div>
              </div>
            )}

            <Separator />

            {/* Low-confidence pending warning */}
            {hasPendingLow && canConfirm && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                Some low-confidence suggestions haven't been reviewed yet — accept, edit, or remove them before confirming to ensure accuracy.
              </p>
            )}

            {/* Gate hint */}
            {!isFailedParse && !canConfirm && visibleProposals.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {acceptedProposals.length === 0
                  ? "Accept at least one suggestion to save it to your planner."
                  : "All accepted meals need a name before saving."}
              </p>
            )}

            {/* Confirm button area */}
            <div className="flex gap-2 justify-end flex-wrap">
              <Button variant="outline" onClick={handleClose} disabled={saving}>Cancel</Button>
              {!isFailedParse && (
                <Button
                  onClick={handleConfirm}
                  disabled={saving || !canConfirm}
                  title={!canConfirm ? "Accept at least one suggestion with a name" : undefined}
                >
                  {saving
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Saving…</>
                    : acceptedProposals.filter(p => p.currentType !== "meal_idea" && p.currentDay !== "Unassigned").length > 0
                    ? `Add ${acceptedProposals.filter(p => p.currentType !== "meal_idea" && p.currentDay !== "Unassigned").length} meal${acceptedProposals.filter(p => p.currentType !== "meal_idea" && p.currentDay !== "Unassigned").length !== 1 ? "s" : ""} to Planner`
                    : `Confirm ${acceptedProposals.length} meal${acceptedProposals.length !== 1 ? "s" : ""}`}
                </Button>
              )}
            </div>
          </>)}
        </div>
  );

  if (inline) {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium flex items-center gap-1.5">
            <Camera className="h-4 w-4 text-primary" />
            {dialogTitle}
            <Badge variant="secondary" className="text-xs ml-1">Planner</Badge>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{dialogDescription}</p>
        </div>
        {bodyContent}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            {dialogTitle}
            <Badge variant="secondary" className="text-xs ml-1">Planner</Badge>
          </DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        {bodyContent}
      </DialogContent>
    </Dialog>
  );
}
