import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useUser } from "@/hooks/use-user";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown, ChevronUp, ShoppingBasket,
  FlaskConical, Leaf, AlertTriangle, Home, UtensilsCrossed,
  CheckCircle2, ClipboardList, ShoppingCart, ShoppingBag, Clock,
} from "lucide-react";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { formatItemDisplay } from "@/lib/unit-display";
import { deriveQuantityConfidence, getQuantityConfidenceLabel } from "@/lib/quantity-confidence";
import ScoreBadge from "@/components/ui/score-badge";
import type { ShoppingListItem, IngredientSource } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { WorkspaceAnalyserSheet } from "@/components/WorkspaceAnalyserSheet";
import { PageHeader } from "@/components/PageHeader";

// ── Types ─────────────────────────────────────────────────────────────────────

type WorkspaceMode = "review" | "prep" | "shop";

type WorkspaceItem = ShoppingListItem & {
  addedByDisplayName?: string | null;
  sources?: Array<{
    mealId: number;
    mealName: string;
    weekNumber?: number | null;
    dayOfWeek?: number | null;
    mealSlot?: string | null;
  }>;
};

// Pantry: "adjusting" is transient (input visible); resolves to "have_enough" or "need_to_buy"
type PantryDecision = "have_enough" | "need_to_buy" | "adjusting";
type QuantityDecision = "accepted" | "editing" | "later";

type PrepItemState = {
  pantryDecision?: PantryDecision;
  quantityDecision?: QuantityDecision;
  editValue?: string;
};

type PrepAction =
  | { type: "pantry"; decision: PantryDecision }
  | { type: "quantity"; decision: QuantityDecision }
  | { type: "editValue"; value: string }
  | { type: "editConfirm" }
  | { type: "clear" };

type PrepSummary = {
  pantryTotal: number;
  pantryReviewed: number;
  uncertainTotal: number;
  uncertainResolved: number;
  attentionTotal: number;
  allPrepDone: boolean;
};

// Shop operational states — persisted via shopStatus field
type ShopItemState = "need" | "found" | "defer" | "have";

type ShopSummary = {
  needCount: number;
  foundCount: number;
  deferCount: number;
  haveCount: number;
  total: number;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const MODES: Array<{
  id: WorkspaceMode;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  helper: string;
}> = [
  { id: "review", label: "Review", Icon: ClipboardList, helper: "Check your list before you go" },
  { id: "prep", label: "Prep", Icon: Home, helper: "Review pantry items and confirm quantities" },
  { id: "shop", label: "Shop", Icon: ShoppingCart, helper: "In-store — track what you find, skip, or already have" },
];

function getShopState(item: WorkspaceItem): ShopItemState {
  const s = item.shopStatus;
  if (s === "found" || s === "defer" || s === "have") return s;
  return "need";
}

const SHOP_STATE_CONFIG: Record<ShopItemState, {
  label: string;
  circleClass: string;
  labelClass: string;
  chipClass: string;
  groupClass: string;
}> = {
  need: {
    label: "Still need",
    circleClass: "border-muted-foreground/30 bg-transparent hover:border-emerald-400",
    labelClass: "text-muted-foreground",
    chipClass: "",
    groupClass: "text-foreground",
  },
  found: {
    label: "Found in store",
    circleClass: "border-emerald-500 bg-emerald-500",
    labelClass: "text-emerald-600 dark:text-emerald-400",
    chipClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/50 hover:bg-emerald-500/20 active:bg-emerald-500/30",
    groupClass: "text-emerald-600 dark:text-emerald-400",
  },
  defer: {
    label: "Buy next shop",
    circleClass: "border-blue-400 bg-blue-400",
    labelClass: "text-blue-600 dark:text-blue-400",
    chipClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/70 dark:border-blue-800/50 hover:bg-blue-500/20 active:bg-blue-500/30",
    groupClass: "text-blue-600 dark:text-blue-400",
  },
  have: {
    label: "Already have",
    circleClass: "border-amber-500 bg-amber-500",
    labelClass: "text-amber-600 dark:text-amber-400",
    chipClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/50 hover:bg-amber-500/20 active:bg-amber-500/30",
    groupClass: "text-amber-600 dark:text-amber-400",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function getOperationalHint(
  item: WorkspaceItem,
  isPantryStocked: boolean,
  sourcesForItem: IngredientSource[],
  prepState?: PrepItemState,
): { text: string; tone: "amber" | "green" | "muted" } | null {
  if (isPantryStocked) {
    if (prepState?.pantryDecision === "have_enough") {
      return { text: "Pantry reviewed", tone: "green" };
    }
    if (prepState?.pantryDecision === "need_to_buy") {
      return null;
    }
    return { text: "Pantry item", tone: "amber" };
  }

  if (prepState?.quantityDecision === "accepted") {
    return { text: "Quantity confirmed", tone: "green" };
  }
  if (prepState?.quantityDecision === "later") {
    return { text: "Review later", tone: "muted" };
  }

  const conf = deriveQuantityConfidence(item);
  if (conf === "assumed") return { text: "Quantity estimated", tone: "amber" };
  if (conf === "approximate") return { text: "Roughly estimated", tone: "amber" };

  if (item.needsReview) return { text: "Needs attention", tone: "amber" };

  if (sourcesForItem.length > 1) {
    return { text: `${sourcesForItem.length} meals`, tone: "muted" };
  }

  return null;
}

// ── PrepActionPanel ───────────────────────────────────────────────────────────

function PrepActionPanel({
  item,
  isPantryStocked,
  prepState,
  onPrepAction,
}: {
  item: WorkspaceItem;
  isPantryStocked: boolean;
  prepState: PrepItemState;
  onPrepAction: (action: PrepAction) => void;
}) {
  const conf = deriveQuantityConfidence(item);
  const hasQuantityUncertainty = conf === "assumed" || conf === "approximate";
  const unitLabel = item.unit && item.unit !== "unit" ? item.unit : "";

  if (isPantryStocked) {
    if (!prepState.pantryDecision) {
      return (
        <div className="rounded-lg bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 p-3 space-y-2.5">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <Home className="h-3.5 w-3.5 shrink-0" />
            Pantry item — do you have enough at home?
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => onPrepAction({ type: "pantry", decision: "have_enough" })}
              className="flex-1 min-w-[90px] px-3 py-2.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-500/20 active:bg-emerald-500/30 transition-colors"
            >
              Have enough
            </button>
            <button
              onClick={() => onPrepAction({ type: "pantry", decision: "need_to_buy" })}
              className="flex-1 min-w-[90px] px-3 py-2.5 text-xs font-medium rounded-lg bg-muted/60 text-foreground border border-border/60 hover:bg-muted active:bg-muted/80 transition-colors"
            >
              Need to buy
            </button>
            <button
              onClick={() => onPrepAction({ type: "pantry", decision: "adjusting" })}
              className="flex-1 min-w-[90px] px-3 py-2.5 text-xs font-medium rounded-lg bg-muted/60 text-foreground border border-border/60 hover:bg-muted active:bg-muted/80 transition-colors"
            >
              Adjust amount
            </button>
          </div>
        </div>
      );
    }

    if (prepState.pantryDecision === "adjusting") {
      return (
        <div className="rounded-lg bg-muted/30 border border-border/40 p-3 space-y-2.5">
          <p className="text-xs font-medium text-foreground">How much do you still need to buy?</p>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="number"
              min="0"
              step="any"
              value={prepState.editValue ?? (item.quantityValue?.toString() ?? "")}
              onChange={(e) => onPrepAction({ type: "editValue", value: e.target.value })}
              className="w-24 text-sm px-2.5 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
            {unitLabel && (
              <span className="text-xs text-muted-foreground">{unitLabel}</span>
            )}
            <button
              onClick={() => onPrepAction({ type: "editConfirm" })}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => onPrepAction({ type: "clear" })}
              className="px-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    if (prepState.pantryDecision === "have_enough") {
      return (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 px-3 py-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Pantry reviewed — have enough
          </span>
          <button
            onClick={() => onPrepAction({ type: "clear" })}
            className="ml-auto text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors shrink-0"
          >
            undo
          </button>
        </div>
      );
    }

    if (prepState.pantryDecision === "need_to_buy") {
      const adjustedLabel = prepState.editValue
        ? ` — buying ${prepState.editValue}${unitLabel ? ` ${unitLabel}` : ""}`
        : "";
      return (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 px-3 py-2.5">
          <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
            Pantry reviewed{adjustedLabel || " — buying this"}
          </span>
          <button
            onClick={() => onPrepAction({ type: "clear" })}
            className="ml-auto text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors shrink-0"
          >
            undo
          </button>
        </div>
      );
    }
  }

  if (hasQuantityUncertainty) {
    const estimateLabel =
      conf === "assumed" ? "Quantity estimated by AI" : "Amount roughly estimated";

    if (!prepState.quantityDecision) {
      return (
        <div className="rounded-lg bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 p-3 space-y-2.5">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {estimateLabel} — confirm before shopping
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => onPrepAction({ type: "quantity", decision: "accepted" })}
              className="flex-1 min-w-[100px] px-3 py-2.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-500/20 active:bg-emerald-500/30 transition-colors"
            >
              Accept estimate
            </button>
            <button
              onClick={() => onPrepAction({ type: "quantity", decision: "editing" })}
              className="flex-1 min-w-[100px] px-3 py-2.5 text-xs font-medium rounded-lg bg-muted/60 text-foreground border border-border/60 hover:bg-muted active:bg-muted/80 transition-colors"
            >
              Edit quantity
            </button>
            <button
              onClick={() => onPrepAction({ type: "quantity", decision: "later" })}
              className="flex-1 min-w-[100px] px-3 py-2.5 text-xs font-medium rounded-lg bg-muted/60 text-muted-foreground border border-border/60 hover:bg-muted active:bg-muted/80 transition-colors"
            >
              Mark for later
            </button>
          </div>
        </div>
      );
    }

    if (prepState.quantityDecision === "editing") {
      return (
        <div className="rounded-lg bg-muted/30 border border-border/40 p-3 space-y-2.5">
          <p className="text-xs font-medium text-foreground">Set your quantity</p>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="number"
              min="0"
              step="any"
              value={prepState.editValue ?? (item.quantityValue?.toString() ?? "")}
              onChange={(e) => onPrepAction({ type: "editValue", value: e.target.value })}
              className="w-24 text-sm px-2.5 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
            {unitLabel && (
              <span className="text-xs text-muted-foreground">{unitLabel}</span>
            )}
            <button
              onClick={() => onPrepAction({ type: "editConfirm" })}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => onPrepAction({ type: "clear" })}
              className="px-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    if (prepState.quantityDecision === "accepted") {
      const customQty = prepState.editValue;
      const displayQty = customQty
        ? `${customQty}${unitLabel ? ` ${unitLabel}` : ""}`
        : item.quantityValue != null && unitLabel
          ? `${item.quantityValue} ${unitLabel}`
          : null;
      return (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 px-3 py-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Quantity confirmed{displayQty ? ` — ${displayQty}` : ""}
          </span>
          <button
            onClick={() => onPrepAction({ type: "clear" })}
            className="ml-auto text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors shrink-0"
          >
            undo
          </button>
        </div>
      );
    }

    if (prepState.quantityDecision === "later") {
      return (
        <div className="flex items-center gap-2 rounded-lg bg-muted/30 border border-border/30 px-3 py-2.5">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">Marked for later review</span>
          <button
            onClick={() => onPrepAction({ type: "clear" })}
            className="ml-auto text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors shrink-0"
          >
            undo
          </button>
        </div>
      );
    }
  }

  return null;
}

// ── ShopActionPanel ───────────────────────────────────────────────────────────

function ShopActionPanel({
  shopState,
  onShopStateChange,
}: {
  shopState: ShopItemState;
  onShopStateChange: (state: ShopItemState | null) => void;
}) {
  const options: Array<{
    state: ShopItemState;
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    activeClass: string;
    inactiveClass: string;
  }> = [
    {
      state: "found",
      label: "Found in store",
      Icon: CheckCircle2,
      activeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700",
      inactiveClass: "bg-muted/40 text-foreground border-border/50 hover:bg-muted active:bg-muted/80",
    },
    {
      state: "defer",
      label: "Buy next shop",
      Icon: Clock,
      activeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700",
      inactiveClass: "bg-muted/40 text-foreground border-border/50 hover:bg-muted active:bg-muted/80",
    },
    {
      state: "have",
      label: "Already have at home",
      Icon: Home,
      activeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700",
      inactiveClass: "bg-muted/40 text-foreground border-border/50 hover:bg-muted active:bg-muted/80",
    },
    {
      state: "need",
      label: "Still need",
      Icon: ShoppingCart,
      activeClass: "bg-primary/10 text-primary border-primary/30",
      inactiveClass: "bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted active:bg-muted/80",
    },
  ];

  return (
    <div className="rounded-lg bg-muted/20 border border-border/30 p-3 space-y-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Shopping status
      </p>
      <div className="grid grid-cols-2 gap-2">
        {options.map(({ state, label, Icon, activeClass, inactiveClass }) => (
          <button
            key={state}
            onClick={() => onShopStateChange(state === "need" ? null : state)}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium rounded-lg border transition-colors touch-manipulation ${
              shopState === state ? activeClass : inactiveClass
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {label}
          </button>
        ))}
      </div>
      {/* Future: Scan & swap entrypoint — place inline scan button here */}
    </div>
  );
}

// ── WorkspaceRow ─────────────────────────────────────────────────────────────

function WorkspaceRow({
  item,
  sources,
  pantryKeySet,
  measurementPref,
  expanded,
  onToggleExpand,
  onToggleChecked,
  shopMode,
  shopState,
  onShopStateChange,
  prepMode,
  prepState,
  onPrepAction,
  onOpenAnalyser,
}: {
  item: WorkspaceItem;
  sources: IngredientSource[];
  pantryKeySet: Set<string>;
  measurementPref: "metric" | "imperial";
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleChecked: (checked: boolean) => void;
  shopMode: boolean;
  shopState?: ShopItemState;
  onShopStateChange?: (state: ShopItemState | null) => void;
  prepMode?: boolean;
  prepState?: PrepItemState;
  onPrepAction?: (action: PrepAction) => void;
  onOpenAnalyser?: () => void;
}) {
  const pantryKey = (item.normalizedName ?? item.productName).toLowerCase();
  const isPantryStocked = pantryKeySet.has(pantryKey);

  const hint = getOperationalHint(
    item,
    isPantryStocked,
    sources,
    prepMode ? (prepState ?? {}) : undefined,
  );
  const conf = deriveQuantityConfidence(item);
  const confLabel = getQuantityConfidenceLabel(conf, item);

  const mealSources = item.sources ?? [];
  const mealAttribution = mealSources
    .map((s) => {
      if (s.dayOfWeek != null && s.mealSlot) return `${DAY_NAMES[s.dayOfWeek]} ${s.mealSlot}`;
      if (s.mealName) return s.mealName;
      return null;
    })
    .filter(Boolean);

  const hintToneClass =
    hint?.tone === "amber"
      ? "text-amber-600 dark:text-amber-400"
      : hint?.tone === "green"
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-muted-foreground";

  const effectiveShopState = shopState ?? "need";
  const shopConfig = SHOP_STATE_CONFIG[effectiveShopState];
  const qtyLabel = item.quantityValue != null
    ? (formatItemDisplay(item.productName, item.quantityValue, item.unit, measurementPref).split(" — ")[1] ?? "")
    : "";

  // Row-level state styling
  const rowOpacity = shopMode
    ? effectiveShopState !== "need" ? "opacity-60" : ""
    : item.checked ? "opacity-50" : "";

  const rowBg = shopMode
    ? effectiveShopState === "found"
      ? "bg-emerald-50/15 dark:bg-emerald-950/10"
      : effectiveShopState === "defer"
        ? "bg-blue-50/10 dark:bg-blue-950/10"
        : effectiveShopState === "have"
          ? "bg-amber-50/15 dark:bg-amber-950/10"
          : ""
    : item.needsReview && !item.checked ? "bg-amber-50/30 dark:bg-amber-950/10" : "";

  return (
    <div
      className={`border-b border-border/30 transition-colors ${rowOpacity} ${rowBg}`}
      data-testid={`workspace-row-${item.id}`}
    >
      {/* ── Shop mode collapsed row ───────────────────────────────── */}
      {shopMode && (
        <div className="grid grid-cols-[20px_5rem_1fr_auto_2.75rem] items-center gap-x-2 px-4 py-3 overflow-hidden">

          {/* Col 1 — state circle, centred in its cell */}
          <button
            onClick={() =>
              onShopStateChange?.(effectiveShopState === "found" ? null : "found")
            }
            aria-label={effectiveShopState === "need" ? "Mark as found" : "Undo"}
            className={`place-self-center h-5 w-5 rounded-full flex items-center justify-center transition-colors touch-manipulation border-2 ${shopConfig.circleClass}`}
          >
            {effectiveShopState === "found" && <CheckCircle2 className="h-3 w-3 text-white" />}
            {effectiveShopState === "defer" && <Clock className="h-3 w-3 text-white" />}
            {effectiveShopState === "have" && <Home className="h-3 w-3 text-white" />}
          </button>

          {/* Col 2 — qty (fixed 5rem, always same position) */}
          <button onClick={onToggleExpand} className="text-left">
            {qtyLabel && (
              <span className={`font-semibold text-[15px] tabular-nums leading-tight ${
                effectiveShopState !== "need"
                  ? "text-muted-foreground/40"
                  : "text-foreground/80"
              }`}>
                {qtyLabel}
              </span>
            )}
          </button>

          {/* Col 3 — name (1fr, wraps for long names) */}
          <button
            onClick={onToggleExpand}
            data-testid={`ws-row-expand-${item.id}`}
            className="text-left min-w-0"
          >
            <span className={`font-medium text-[14px] leading-snug ${
              effectiveShopState !== "need"
                ? "text-muted-foreground"
                : "text-foreground"
            }`}>
              {capitalizeWords(item.productName)}
            </span>
          </button>

          {/* Col 4 — action chips (auto, same content = same width across all need rows) */}
          <div>
            {effectiveShopState === "need" ? (
              <div className="flex gap-1">
                <button
                  onClick={() => onShopStateChange?.("found")}
                  className="px-2 py-0.5 text-xs font-medium rounded border transition-colors touch-manipulation bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/50 hover:bg-emerald-500/20 active:bg-emerald-500/30"
                >
                  Found
                </button>
                <button
                  onClick={() => onShopStateChange?.("defer")}
                  className="px-2 py-0.5 text-xs font-medium rounded border transition-colors touch-manipulation bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/70 dark:border-blue-800/50 hover:bg-blue-500/20 active:bg-blue-500/30"
                >
                  Skip today
                </button>
                <button
                  onClick={() => onShopStateChange?.("have")}
                  className="px-2 py-0.5 text-xs font-medium rounded border transition-colors touch-manipulation bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/50 hover:bg-amber-500/20 active:bg-amber-500/30"
                >
                  Have it
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-medium ${shopConfig.labelClass}`}>
                  {shopConfig.label}
                </span>
                <button
                  onClick={() => onShopStateChange?.(null)}
                  className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors touch-manipulation"
                >
                  undo
                </button>
              </div>
            )}
          </div>

          {/* Col 5 — apple score + chevron (auto, pinned right) */}
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-1.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            {item.thaRating != null && <ScoreBadge score={item.thaRating} size={22} />}
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

        </div>
      )}

      {/* ── Review / Prep mode collapsed row ─────────────────────── */}
      {!shopMode && (
        <div className="flex items-center gap-3 px-4 py-3 min-h-[52px]">
          <Checkbox
            checked={item.checked || false}
            onCheckedChange={(v) => onToggleChecked(!!v)}
            className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground shrink-0"
            data-testid={`ws-checkbox-${item.id}`}
          />

          <button
            className="flex-1 min-w-0 flex items-center gap-2 text-left group"
            onClick={onToggleExpand}
            data-testid={`ws-row-expand-${item.id}`}
          >
            <div className="flex-1 min-w-0">
              <span
                className={`text-sm font-medium leading-snug block truncate ${
                  item.checked ? "line-through text-muted-foreground" : "text-foreground"
                }`}
              >
                {capitalizeWords(item.productName)}
              </span>

              <div className="flex items-center gap-2 mt-0.5">
                {item.quantityValue != null && (
                  <span className="text-xs text-muted-foreground">
                    {formatItemDisplay(item.productName, item.quantityValue, item.unit, measurementPref)
                      .split(" — ")[1] ?? ""}
                  </span>
                )}
                {hint && !item.checked && (
                  <span className={`text-xs ${hintToneClass} flex items-center gap-0.5`}>
                    {hint.tone === "amber" && <AlertTriangle className="h-3 w-3 shrink-0" />}
                    {hint.tone === "green" && <CheckCircle2 className="h-3 w-3 shrink-0" />}
                    {hint.text}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {item.thaRating != null && !item.checked && (
                <ScoreBadge score={item.thaRating} size={22} />
              )}
              <span className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ── Expanded detail ───────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 space-y-3 border-t border-border/20 ml-9">

              {/* ── Shop action panel (shop mode only) ───────────── */}
              {shopMode && onShopStateChange && (
                <ShopActionPanel
                  shopState={effectiveShopState}
                  onShopStateChange={onShopStateChange}
                />
              )}

              {/* ── Prep action panel (prep mode only) ───────────── */}
              {prepMode && onPrepAction && (
                <PrepActionPanel
                  item={item}
                  isPantryStocked={isPantryStocked}
                  prepState={prepState ?? {}}
                  onPrepAction={onPrepAction}
                />
              )}

              {/* ── Pantry note (review mode) ─────────────────────── */}
              {!prepMode && !shopMode && isPantryStocked && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <Home className="h-3.5 w-3.5 shrink-0" />
                  <span>Pantry item — check at home before buying</span>
                </div>
              )}

              {/* Quantity confidence */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Quantity</span>
                {confLabel && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      conf === "exact"
                        ? "border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400"
                        : conf === "estimated"
                          ? "border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400"
                          : conf === "approximate"
                            ? "border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                            : "border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400"
                    }`}
                  >
                    {confLabel}
                  </Badge>
                )}
                {item.quantityValue != null && item.unit && item.unit !== "unit" && (
                  <span className="text-xs text-muted-foreground">
                    {item.quantityValue} {item.unit}
                    {item.quantityInGrams != null && item.unit !== "g" && (
                      <span className="text-muted-foreground/50"> · {Math.round(item.quantityInGrams)}g</span>
                    )}
                  </span>
                )}
              </div>

              {/* Meal attribution */}
              {mealAttribution.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium block mb-1">
                    Needed for
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {mealAttribution.map((attr, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-[10px] flex items-center gap-1"
                      >
                        <UtensilsCrossed className="h-2.5 w-2.5" />
                        {attr}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {sources.length > 1 && mealAttribution.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Combined from {sources.length} meals
                </p>
              )}

              {/* THA score */}
              {item.thaRating != null && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Health score</span>
                  <ScoreBadge score={item.thaRating} size={20} />
                  {item.itemType === "whole_food" && (
                    <Badge className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 no-default-hover-elevate">
                      <Leaf className="h-2.5 w-2.5 mr-1" />
                      Whole food
                    </Badge>
                  )}
                </div>
              )}

              {/* Needs attention flag */}
              {item.needsReview && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 rounded-md bg-amber-50/60 dark:bg-amber-950/20 px-2 py-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.validationNote || "This item may need a closer look"}</span>
                </div>
              )}

              {/* Analyser access */}
              <div className="flex items-center gap-2 pt-1 border-t border-border/20">
                <FlaskConical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <button
                  onClick={onOpenAnalyser}
                  className="text-xs text-primary hover:underline touch-manipulation"
                  data-testid={`ws-analyse-btn-${item.id}`}
                >
                  Analyse
                </button>
                <span className="text-[10px] text-muted-foreground/60">
                  · THA score, cleaner options, whole-food route
                </span>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Prep-mode grouping ────────────────────────────────────────────────────────

function getPrepGroup(
  item: WorkspaceItem,
  isPantryStocked: boolean,
): "pantry" | "uncertain" | "attention" | "ready" {
  if (isPantryStocked) return "pantry";
  const conf = deriveQuantityConfidence(item);
  if (conf === "assumed" || conf === "approximate") return "uncertain";
  if (item.needsReview) return "attention";
  return "ready";
}

// ── Mode switcher ─────────────────────────────────────────────────────────────

function ModeSwitcher({
  mode,
  onChange,
}: {
  mode: WorkspaceMode;
  onChange: (m: WorkspaceMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1" role="tablist">
      {MODES.map(({ id, label, Icon }) => (
        <button
          key={id}
          role="tab"
          aria-selected={mode === id}
          onClick={() => onChange(id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            mode === id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          data-testid={`ws-mode-${id}`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Summary bar ───────────────────────────────────────────────────────────────

function SummaryBar({
  mode,
  items,
  pantryKeySet,
  prepSummary,
  shopSummary,
}: {
  mode: WorkspaceMode;
  items: WorkspaceItem[];
  pantryKeySet: Set<string>;
  prepSummary?: PrepSummary;
  shopSummary?: ShopSummary;
}) {
  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);
  const attentionCount = unchecked.filter((i) => i.needsReview).length;
  const pantryCount = unchecked.filter((i) =>
    pantryKeySet.has((i.normalizedName ?? i.productName).toLowerCase()),
  ).length;

  if (mode === "shop" && shopSummary) {
    const { needCount, foundCount, deferCount, haveCount, total } = shopSummary;
    const resolved = foundCount + haveCount;
    const pct = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return (
      <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 mb-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {needCount === 0 && total > 0
              ? "All items accounted for"
              : needCount === total
                ? `${total} item${total !== 1 ? "s" : ""} to find`
                : `${needCount} still needed`}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {resolved}/{total}
          </span>
        </div>

        <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>

        {(foundCount > 0 || deferCount > 0 || haveCount > 0) && (
          <div className="flex items-center gap-3 flex-wrap pt-0.5">
            {foundCount > 0 && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 shrink-0" />
                {foundCount} found
              </span>
            )}
            {deferCount > 0 && (
              <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Clock className="h-3 w-3 shrink-0" />
                {deferCount} next shop
              </span>
            )}
            {haveCount > 0 && (
              <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Home className="h-3 w-3 shrink-0" />
                {haveCount} have it
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  if (mode === "prep" && prepSummary) {
    const { pantryTotal, pantryReviewed, uncertainTotal, uncertainResolved, attentionTotal, allPrepDone } = prepSummary;
    const hasAnything = pantryTotal + uncertainTotal + attentionTotal > 0;

    return (
      <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 mb-4 space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          Prep progress
        </p>
        <div className="space-y-1.5">
          {pantryTotal > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Home className="h-3.5 w-3.5" />
                Pantry items
              </span>
              <span
                className={`text-xs font-medium tabular-nums ${
                  pantryReviewed === pantryTotal
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-foreground"
                }`}
              >
                {pantryReviewed}/{pantryTotal} reviewed
              </span>
            </div>
          )}
          {uncertainTotal > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Quantities
              </span>
              <span
                className={`text-xs font-medium tabular-nums ${
                  uncertainResolved === uncertainTotal
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-foreground"
                }`}
              >
                {uncertainResolved}/{uncertainTotal} confirmed
              </span>
            </div>
          )}
          {attentionTotal > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Need attention
              </span>
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 tabular-nums">
                {attentionTotal}
              </span>
            </div>
          )}
          {allPrepDone && (
            <div className="flex items-center gap-1.5 pt-0.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                All prep done — ready to shop
              </span>
            </div>
          )}
          {!hasAnything && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              List looks ready
            </span>
          )}
        </div>
      </div>
    );
  }

  // Review mode
  const total = unchecked.length + checked.length;
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 mb-4 space-y-1">
      <div className="flex items-center gap-4 flex-wrap text-sm">
        <span className="font-medium text-foreground">
          {unchecked.length > 0
            ? `${unchecked.length} item${unchecked.length !== 1 ? "s" : ""} to buy`
            : "All done"}
        </span>
        {checked.length > 0 && (
          <span className="text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            {checked.length} checked
          </span>
        )}
        {attentionCount > 0 && (
          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            {attentionCount} need attention
          </span>
        )}
        {pantryCount > 0 && (
          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Home className="h-3.5 w-3.5" />
            {pantryCount} pantry items
          </span>
        )}
      </div>
    </div>
  );
}

// ── Prep group header ─────────────────────────────────────────────────────────

function PrepGroupHeader({
  label,
  count,
  resolvedCount,
}: {
  label: string;
  count: number;
  resolvedCount?: number;
}) {
  const isComplete = resolvedCount !== undefined && resolvedCount === count;
  return (
    <div className="px-4 py-1.5 border-t border-border/30 bg-muted/20 flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1.5">
        {isComplete && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
        {label}
      </span>
      <span
        className={`text-[10px] font-medium tabular-nums ${
          isComplete
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-muted-foreground/60"
        }`}
      >
        {resolvedCount !== undefined ? `${resolvedCount}/${count}` : count}
      </span>
    </div>
  );
}

// ── Shop group header ─────────────────────────────────────────────────────────

function ShopGroupHeader({
  label,
  count,
  variant = "need",
}: {
  label: string;
  count: number;
  variant?: ShopItemState;
}) {
  const colorClass = SHOP_STATE_CONFIG[variant].groupClass;
  return (
    <div className="px-4 py-1.5 border-t border-border/30 bg-muted/20 flex items-center justify-between">
      <span className={`text-[10px] uppercase tracking-wide font-medium ${colorClass}`}>
        {label}
      </span>
      <span className={`text-[10px] font-medium tabular-nums ${colorClass}`}>
        {count}
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ShoppingWorkspacePage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [mode, setMode] = useState<WorkspaceMode>("review");
  const [prepStates, setPrepStates] = useState<Map<number, PrepItemState>>(new Map());
  const [analyserItem, setAnalyserItem] = useState<WorkspaceItem | null>(null);

  useEffect(() => {
    document.title = "Shopping Workspace – The Healthy Apples";
    return () => { document.title = "The Healthy Apples"; };
  }, []);

  const measurementPref: "metric" | "imperial" =
    (user?.measurementPreference as "metric" | "imperial") || "metric";

  const { data: items = [], isLoading } = useQuery<WorkspaceItem[]>({
    queryKey: [api.shoppingList.list.path],
  });

  const { data: ingredientSources = [] } = useQuery<IngredientSource[]>({
    queryKey: [api.shoppingList.sources.path],
  });

  const { data: pantryItems = [] } = useQuery<{ id: number; ingredientKey: string }[]>({
    queryKey: ["/api/pantry"],
  });

  const pantryKeySet = useMemo(
    () => new Set(pantryItems.map((p) => p.ingredientKey)),
    [pantryItems],
  );

  const sourcesByItem = useMemo(() => {
    const map = new Map<number, IngredientSource[]>();
    for (const s of ingredientSources) {
      if (!map.has(s.shoppingListItemId)) map.set(s.shoppingListItemId, []);
      map.get(s.shoppingListItemId)!.push(s);
    }
    return map;
  }, [ingredientSources]);

  const toggleChecked = useMutation({
    mutationFn: async ({ id, checked }: { id: number; checked: boolean }) => {
      const url = buildUrl(api.shoppingList.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checked }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onMutate: async ({ id, checked }) => {
      await queryClient.cancelQueries({ queryKey: [api.shoppingList.list.path] });
      const snapshot = queryClient.getQueryData<WorkspaceItem[]>([api.shoppingList.list.path]);
      queryClient.setQueryData<WorkspaceItem[]>([api.shoppingList.list.path], (old) =>
        old ? old.map((item) => (item.id === id ? { ...item, checked } : item)) : old,
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot !== undefined) {
        queryClient.setQueryData([api.shoppingList.list.path], ctx.snapshot);
      }
      toast({ title: "Couldn't update item", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
    },
  });

  // Shop status is persisted via shopStatus field on the item
  const updateShopStatus = useMutation({
    mutationFn: async ({ id, shopStatus }: { id: number; shopStatus: string | null }) => {
      const url = buildUrl(api.shoppingList.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopStatus }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onMutate: async ({ id, shopStatus }) => {
      await queryClient.cancelQueries({ queryKey: [api.shoppingList.list.path] });
      const snapshot = queryClient.getQueryData<WorkspaceItem[]>([api.shoppingList.list.path]);
      queryClient.setQueryData<WorkspaceItem[]>([api.shoppingList.list.path], (old) =>
        old ? old.map((item) => (item.id === id ? { ...item, shopStatus } : item)) : old,
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot !== undefined) {
        queryClient.setQueryData([api.shoppingList.list.path], ctx.snapshot);
      }
      toast({ title: "Couldn't update item", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
    },
  });

  function handleShopStateChange(itemId: number, state: ShopItemState | null) {
    updateShopStatus.mutate({ id: itemId, shopStatus: state });
  }

  function handlePrepAction(itemId: number, action: PrepAction) {
    setPrepStates((prev) => {
      const next = new Map(prev);
      const current = next.get(itemId) ?? {};

      switch (action.type) {
        case "pantry":
          next.set(itemId, { ...current, pantryDecision: action.decision, editValue: undefined });
          break;
        case "quantity":
          next.set(itemId, { ...current, quantityDecision: action.decision, editValue: undefined });
          break;
        case "editValue":
          next.set(itemId, { ...current, editValue: action.value });
          break;
        case "editConfirm":
          if (current.pantryDecision === "adjusting") {
            next.set(itemId, { ...current, pantryDecision: "need_to_buy" });
          } else {
            next.set(itemId, { ...current, quantityDecision: "accepted" });
          }
          break;
        case "clear":
          next.delete(itemId);
          break;
      }

      return next;
    });
  }

  const uncheckedItems = useMemo(() => items.filter((i) => !i.checked), [items]);
  const checkedItems = useMemo(() => items.filter((i) => i.checked), [items]);

  // Shop mode groups — all items, partitioned by shopStatus
  const shopGroups = useMemo(() => {
    const need: WorkspaceItem[] = [];
    const found: WorkspaceItem[] = [];
    const defer: WorkspaceItem[] = [];
    const have: WorkspaceItem[] = [];
    for (const item of items) {
      const state = getShopState(item);
      if (state === "found") found.push(item);
      else if (state === "defer") defer.push(item);
      else if (state === "have") have.push(item);
      else need.push(item);
    }
    return { need, found, defer, have };
  }, [items]);

  const shopSummary = useMemo((): ShopSummary => ({
    needCount: shopGroups.need.length,
    foundCount: shopGroups.found.length,
    deferCount: shopGroups.defer.length,
    haveCount: shopGroups.have.length,
    total: items.length,
  }), [shopGroups, items]);

  // Prep mode grouping
  const prepGroups = useMemo(() => {
    const pantry: WorkspaceItem[] = [];
    const uncertain: WorkspaceItem[] = [];
    const attention: WorkspaceItem[] = [];
    const ready: WorkspaceItem[] = [];
    for (const item of uncheckedItems) {
      const key = (item.normalizedName ?? item.productName).toLowerCase();
      const group = getPrepGroup(item, pantryKeySet.has(key));
      if (group === "pantry") pantry.push(item);
      else if (group === "uncertain") uncertain.push(item);
      else if (group === "attention") attention.push(item);
      else ready.push(item);
    }
    return { pantry, uncertain, attention, ready };
  }, [uncheckedItems, pantryKeySet]);

  const prepSummary = useMemo((): PrepSummary => {
    const pantryTotal = prepGroups.pantry.length;
    const pantryReviewed = prepGroups.pantry.filter((i) => {
      const s = prepStates.get(i.id);
      return s?.pantryDecision === "have_enough" || s?.pantryDecision === "need_to_buy";
    }).length;
    const uncertainTotal = prepGroups.uncertain.length;
    const uncertainResolved = prepGroups.uncertain.filter((i) => {
      const s = prepStates.get(i.id);
      return s?.quantityDecision === "accepted" || s?.quantityDecision === "later";
    }).length;
    const attentionTotal = prepGroups.attention.length;
    const allPrepDone =
      (pantryTotal === 0 || pantryReviewed === pantryTotal) &&
      (uncertainTotal === 0 || uncertainResolved === uncertainTotal) &&
      attentionTotal === 0 &&
      pantryTotal + uncertainTotal > 0;

    return { pantryTotal, pantryReviewed, uncertainTotal, uncertainResolved, attentionTotal, allPrepDone };
  }, [prepGroups, prepStates]);

  function handleToggleExpand(itemId: number) {
    setExpandedId((prev) => (prev === itemId ? null : itemId));
  }

  function renderRow(item: WorkspaceItem) {
    const isPrepMode = mode === "prep";
    const isShopMode = mode === "shop";
    return (
      <WorkspaceRow
        key={item.id}
        item={item}
        sources={sourcesByItem.get(item.id) ?? []}
        pantryKeySet={pantryKeySet}
        measurementPref={measurementPref}
        expanded={expandedId === item.id}
        onToggleExpand={() => handleToggleExpand(item.id)}
        onToggleChecked={(checked) => toggleChecked.mutate({ id: item.id, checked })}
        shopMode={isShopMode}
        shopState={isShopMode ? getShopState(item) : undefined}
        onShopStateChange={isShopMode ? (state) => handleShopStateChange(item.id, state) : undefined}
        prepMode={isPrepMode}
        prepState={isPrepMode ? (prepStates.get(item.id) ?? {}) : undefined}
        onPrepAction={isPrepMode ? (action) => handlePrepAction(item.id, action) : undefined}
        onOpenAnalyser={() => setAnalyserItem(item)}
      />
    );
  }

  const currentMode = MODES.find((m) => m.id === mode)!;

  return (
    <>
      <PageHeader
        title="Shopping Workspace"
        icon={<ShoppingBasket className="h-5 w-5" />}
        realm="basket"
        center={<ModeSwitcher mode={mode} onChange={(m) => { setMode(m); setExpandedId(null); }} />}
        meta={<span>{currentMode.helper}</span>}
      />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-20">

      {/* ── Summary bar ───────────────────────────────────────────────── */}
      {!isLoading && items.length > 0 && (
        <SummaryBar
          mode={mode}
          items={items}
          pantryKeySet={pantryKeySet}
          prepSummary={mode === "prep" ? prepSummary : undefined}
          shopSummary={mode === "shop" ? shopSummary : undefined}
        />
      )}

      {/* ── Shopping rows ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-8 text-center">
          <ShoppingBasket className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Your shopping list is empty.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Generate a list from your{" "}
            <Link href="/planner" className="text-primary hover:underline">
              weekly plan
            </Link>{" "}
            to get started.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden mb-6">

          {/* ── Review mode: flat list ─────────────────────────────── */}
          {mode === "review" && (
            <>
              {uncheckedItems.length === 0 && checkedItems.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Your basket is empty.
                </div>
              ) : (
                <>
                  {uncheckedItems.map(renderRow)}
                  {checkedItems.length > 0 && (
                    <>
                      <div className="px-4 py-1.5 border-t border-border/30 bg-muted/20">
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                          Checked ({checkedItems.length})
                        </span>
                      </div>
                      {checkedItems.map(renderRow)}
                    </>
                  )}
                </>
              )}
            </>
          )}

          {/* ── Shop mode: operational groups ─────────────────────── */}
          {mode === "shop" && (
            <>
              {items.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Your shopping list is empty.
                </div>
              ) : (
                <>
                  {/* Still need */}
                  {shopGroups.need.length > 0 && (
                    <>
                      {(shopGroups.found.length > 0 || shopGroups.defer.length > 0 || shopGroups.have.length > 0) && (
                        <ShopGroupHeader
                          label="Still need"
                          count={shopGroups.need.length}
                          variant="need"
                        />
                      )}
                      {shopGroups.need.map(renderRow)}
                    </>
                  )}

                  {/* Found in store */}
                  {shopGroups.found.length > 0 && (
                    <>
                      <ShopGroupHeader
                        label="Found in store"
                        count={shopGroups.found.length}
                        variant="found"
                      />
                      {shopGroups.found.map(renderRow)}
                    </>
                  )}

                  {/* Buy next shop */}
                  {shopGroups.defer.length > 0 && (
                    <>
                      <ShopGroupHeader
                        label="Buy next shop"
                        count={shopGroups.defer.length}
                        variant="defer"
                      />
                      {shopGroups.defer.map(renderRow)}
                    </>
                  )}

                  {/* Already have */}
                  {shopGroups.have.length > 0 && (
                    <>
                      <ShopGroupHeader
                        label="Already have"
                        count={shopGroups.have.length}
                        variant="have"
                      />
                      {shopGroups.have.map(renderRow)}
                    </>
                  )}

                  {/* All accounted for */}
                  {shopGroups.need.length === 0 && items.length > 0 && (
                    <div className="px-4 py-4 text-center">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1.5" />
                      <p className="text-sm font-medium text-foreground">
                        All items accounted for
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Great shop — nothing left to find
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── Prep mode: grouped list ────────────────────────────── */}
          {mode === "prep" && (
            <>
              {prepGroups.pantry.length > 0 && (
                <>
                  <PrepGroupHeader
                    label="Pantry items — check at home"
                    count={prepGroups.pantry.length}
                    resolvedCount={prepSummary.pantryReviewed}
                  />
                  {prepGroups.pantry.map(renderRow)}
                </>
              )}
              {prepGroups.uncertain.length > 0 && (
                <>
                  <PrepGroupHeader
                    label="Quantities to confirm"
                    count={prepGroups.uncertain.length}
                    resolvedCount={prepSummary.uncertainResolved}
                  />
                  {prepGroups.uncertain.map(renderRow)}
                </>
              )}
              {prepGroups.attention.length > 0 && (
                <>
                  <PrepGroupHeader
                    label="Needs a closer look"
                    count={prepGroups.attention.length}
                  />
                  {prepGroups.attention.map(renderRow)}
                </>
              )}
              {prepGroups.ready.length > 0 && (
                <>
                  <PrepGroupHeader
                    label="Ready to buy"
                    count={prepGroups.ready.length}
                  />
                  {prepGroups.ready.map(renderRow)}
                </>
              )}
              {checkedItems.length > 0 && (
                <>
                  <div className="px-4 py-1.5 border-t border-border/30 bg-muted/20">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                      Checked ({checkedItems.length})
                    </span>
                  </div>
                  {checkedItems.map(renderRow)}
                </>
              )}
            </>
          )}

        </div>
      )}

      {/* ── Fallback footer ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground/50 px-1">
        <FlaskConical className="h-3.5 w-3.5 shrink-0" />
        <span>
          Full product database also available in{" "}
          <Link href="/basket" className="hover:text-muted-foreground hover:underline">
            Basket
          </Link>
          .
        </span>
      </div>

      {/* ── In-workspace analyser sheet ─────────────────────────────────── */}
      <WorkspaceAnalyserSheet
        open={analyserItem !== null}
        onOpenChange={(v) => { if (!v) setAnalyserItem(null); }}
        item={analyserItem}
      />

      </div>
    </>
  );
}
