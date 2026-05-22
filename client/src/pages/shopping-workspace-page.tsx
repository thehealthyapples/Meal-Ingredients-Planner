import { useState, useMemo } from "react";
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
  { id: "shop", label: "Shop", Icon: ShoppingCart, helper: "In-store check-off" },
];

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
  // Pantry item hints — always amber until confirmed (pantry = candidate, not certainty)
  if (isPantryStocked) {
    if (prepState?.pantryDecision === "have_enough") {
      return { text: "Pantry reviewed", tone: "green" };
    }
    if (prepState?.pantryDecision === "need_to_buy") {
      return null; // now acts as a regular shopping item
    }
    return { text: "Pantry item", tone: "amber" };
  }

  // Quantity decision overrides (prep mode)
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

  // ── Pantry review workflow ────────────────────────────────────────────────
  if (isPantryStocked) {
    // Unreviewed — show action buttons
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

    // Adjusting — inline quantity input
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

    // Resolved: have enough
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

    // Resolved: need to buy (including adjusted)
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

  // ── Quantity resolution workflow ──────────────────────────────────────────
  if (hasQuantityUncertainty) {
    const estimateLabel =
      conf === "assumed" ? "Quantity estimated by AI" : "Amount roughly estimated";

    // Unresolved — show action buttons
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

    // Editing — inline quantity input
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

    // Resolved: accepted
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

    // Resolved: later
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
  prepMode,
  prepState,
  onPrepAction,
}: {
  item: WorkspaceItem;
  sources: IngredientSource[];
  pantryKeySet: Set<string>;
  measurementPref: "metric" | "imperial";
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleChecked: (checked: boolean) => void;
  shopMode: boolean;
  prepMode?: boolean;
  prepState?: PrepItemState;
  onPrepAction?: (action: PrepAction) => void;
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

  return (
    <div
      className={`border-b border-border/30 transition-colors ${
        item.checked ? "opacity-50" : ""
      } ${item.needsReview && !item.checked ? "bg-amber-50/30 dark:bg-amber-950/10" : ""}`}
      data-testid={`workspace-row-${item.id}`}
    >
      {/* ── Collapsed row ────────────────────────────────────────────── */}
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

            {!shopMode && (
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
            )}

            {shopMode && item.quantityValue != null && (
              <span className="text-xs text-muted-foreground mt-0.5 block">
                {formatItemDisplay(item.productName, item.quantityValue, item.unit, measurementPref)
                  .split(" — ")[1] ?? ""}
              </span>
            )}
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

      {/* ── Expanded detail ───────────────────────────────────────────── */}
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

              {/* ── Prep action panel (prep mode only) ───────────────── */}
              {prepMode && onPrepAction && (
                <PrepActionPanel
                  item={item}
                  isPantryStocked={isPantryStocked}
                  prepState={prepState ?? {}}
                  onPrepAction={onPrepAction}
                />
              )}

              {/* ── Pantry note (review mode) ─────────────────────────── */}
              {!prepMode && isPantryStocked && (
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
                <Link
                  href="/basket"
                  className="text-xs text-primary hover:underline"
                  data-testid={`ws-analyse-link-${item.id}`}
                >
                  Open Analyser
                </Link>
                <span className="text-[10px] text-muted-foreground/60">
                  · Product details, healthier swaps, whole-food options
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
}: {
  mode: WorkspaceMode;
  items: WorkspaceItem[];
  pantryKeySet: Set<string>;
  prepSummary?: PrepSummary;
}) {
  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);
  const attentionCount = unchecked.filter((i) => i.needsReview).length;
  const pantryCount = unchecked.filter((i) =>
    pantryKeySet.has((i.normalizedName ?? i.productName).toLowerCase()),
  ).length;

  const total = unchecked.length + checked.length;
  const pct = total > 0 ? Math.round((checked.length / total) * 100) : 0;

  if (mode === "shop") {
    return (
      <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            {unchecked.length > 0
              ? `${unchecked.length} remaining`
              : "All done — great shop"}
          </span>
          <span className="text-sm text-muted-foreground">
            {checked.length}/{total}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ShoppingWorkspacePage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [mode, setMode] = useState<WorkspaceMode>("review");
  const [prepStates, setPrepStates] = useState<Map<number, PrepItemState>>(new Map());

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
            // Pantry adjust confirmed — need to buy with custom quantity
            next.set(itemId, { ...current, pantryDecision: "need_to_buy" });
          } else {
            // Quantity edit confirmed
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

  // Prep summary for progressive header
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
        shopMode={mode === "shop"}
        prepMode={isPrepMode}
        prepState={isPrepMode ? (prepStates.get(item.id) ?? {}) : undefined}
        onPrepAction={isPrepMode ? (action) => handlePrepAction(item.id, action) : undefined}
      />
    );
  }

  const currentMode = MODES.find((m) => m.id === mode)!;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-20">

      {/* ── Workspace header ──────────────────────────────────────────── */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-2 min-w-0">
          <ShoppingBasket className="h-4 w-4 text-primary/70 shrink-0" />
          <span className="text-sm font-semibold text-foreground">
            Household Shopping
          </span>
        </div>
        <ModeSwitcher mode={mode} onChange={(m) => { setMode(m); setExpandedId(null); }} />
        <p className="text-xs text-muted-foreground">{currentMode.helper}</p>
      </div>

      {/* ── Summary bar ───────────────────────────────────────────────── */}
      {!isLoading && items.length > 0 && (
        <SummaryBar
          mode={mode}
          items={items}
          pantryKeySet={pantryKeySet}
          prepSummary={mode === "prep" ? prepSummary : undefined}
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

          {/* ── Review / Shop mode: flat list ─────────────────────── */}
          {(mode === "review" || mode === "shop") && (
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

      {/* ── Analyser access footer ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground/70 px-1">
        <FlaskConical className="h-3.5 w-3.5 shrink-0" />
        <span>
          Full product analysis, healthier swaps and scoring in{" "}
          <Link href="/basket" className="text-primary/80 hover:text-primary hover:underline">
            Basket
          </Link>
          .
        </span>
      </div>

    </div>
  );
}
