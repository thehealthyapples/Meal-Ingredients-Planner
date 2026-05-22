import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useUser } from "@/hooks/use-user";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown, ChevronUp, ShoppingBasket,
  FlaskConical, Leaf, AlertTriangle, Home, UtensilsCrossed,
  CheckCircle2, ClipboardList, ShoppingCart,
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

// ── Constants ─────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const MODES: Array<{
  id: WorkspaceMode;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  helper: string;
}> = [
  { id: "review", label: "Review", Icon: ClipboardList, helper: "Check your list before you go" },
  { id: "prep", label: "Prep", Icon: Home, helper: "Pantry, quantities and uncertainties" },
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
): { text: string; tone: "amber" | "green" | "muted" } | null {
  if (isPantryStocked) return { text: "In pantry", tone: "green" };

  const conf = deriveQuantityConfidence(item);
  if (conf === "assumed") return { text: "Quantity estimated", tone: "amber" };
  if (conf === "approximate") return { text: "Roughly estimated", tone: "amber" };

  if (item.needsReview) return { text: "Needs attention", tone: "amber" };

  if (sourcesForItem.length > 1) {
    return { text: `${sourcesForItem.length} meals`, tone: "muted" };
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
}: {
  item: WorkspaceItem;
  sources: IngredientSource[];
  pantryKeySet: Set<string>;
  measurementPref: "metric" | "imperial";
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleChecked: (checked: boolean) => void;
  shopMode: boolean;
}) {
  const pantryKey = (item.normalizedName ?? item.productName).toLowerCase();
  const isPantryStocked = pantryKeySet.has(pantryKey);

  const hint = getOperationalHint(item, isPantryStocked, sources);
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
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/20 ml-9">

              {/* Pantry status */}
              {isPantryStocked && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <Home className="h-3.5 w-3.5 shrink-0" />
                  <span>In your pantry — check before buying</span>
                </div>
              )}

              {/* Quantity confidence */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Quantity</span>
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
}: {
  mode: WorkspaceMode;
  items: WorkspaceItem[];
  pantryKeySet: Set<string>;
}) {
  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);
  const attentionCount = unchecked.filter((i) => i.needsReview).length;
  const pantryCount = unchecked.filter((i) =>
    pantryKeySet.has((i.normalizedName ?? i.productName).toLowerCase()),
  ).length;
  const uncertainCount = unchecked.filter((i) => {
    const conf = deriveQuantityConfidence(i);
    return conf === "assumed" || conf === "approximate";
  }).length;

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

  if (mode === "prep") {
    return (
      <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 mb-4 space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Pre-shop checklist
        </p>
        <div className="flex items-center gap-4 flex-wrap text-sm">
          {pantryCount > 0 && (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
              {pantryCount} in your pantry
            </span>
          )}
          {uncertainCount > 0 && (
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              {uncertainCount} quantities to confirm
            </span>
          )}
          {attentionCount > 0 && (
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              {attentionCount} need a closer look
            </span>
          )}
          {pantryCount === 0 && uncertainCount === 0 && attentionCount === 0 && (
            <span className="text-muted-foreground flex items-center gap-1">
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
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Home className="h-3.5 w-3.5" />
            {pantryCount} in pantry
          </span>
        )}
      </div>
    </div>
  );
}

// ── Prep group header ─────────────────────────────────────────────────────────

function PrepGroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="px-4 py-1.5 border-t border-border/30 bg-muted/20 flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </span>
      <span className="text-[10px] text-muted-foreground/60">{count}</span>
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

  function handleToggleExpand(itemId: number) {
    setExpandedId((prev) => (prev === itemId ? null : itemId));
  }

  function renderRow(item: WorkspaceItem) {
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
        <SummaryBar mode={mode} items={items} pantryKeySet={pantryKeySet} />
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
                  <PrepGroupHeader label="Using cupboard stock" count={prepGroups.pantry.length} />
                  {prepGroups.pantry.map(renderRow)}
                </>
              )}
              {prepGroups.uncertain.length > 0 && (
                <>
                  <PrepGroupHeader label="Quantities to confirm" count={prepGroups.uncertain.length} />
                  {prepGroups.uncertain.map(renderRow)}
                </>
              )}
              {prepGroups.attention.length > 0 && (
                <>
                  <PrepGroupHeader label="Needs a closer look" count={prepGroups.attention.length} />
                  {prepGroups.attention.map(renderRow)}
                </>
              )}
              {prepGroups.ready.length > 0 && (
                <>
                  <PrepGroupHeader label="Ready to buy" count={prepGroups.ready.length} />
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
