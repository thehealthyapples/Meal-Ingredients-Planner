import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useUser } from "@/hooks/use-user";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown, ChevronUp, ShoppingBasket, ArrowLeft,
  FlaskConical, Leaf, AlertTriangle, Home, UtensilsCrossed,
  CheckCircle2, Clock,
} from "lucide-react";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { formatItemDisplay } from "@/lib/unit-display";
import { deriveQuantityConfidence, getQuantityConfidenceLabel } from "@/lib/quantity-confidence";
import ScoreBadge from "@/components/ui/score-badge";
import type { ShoppingListItem, IngredientSource } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

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

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
  if (conf === "assumed") return { text: "Qty assumed", tone: "amber" };
  if (conf === "approximate") return { text: "Qty approximate", tone: "amber" };

  if (item.needsReview) return { text: "Needs review", tone: "amber" };

  if (sourcesForItem.length > 1) {
    return { text: `${sourcesForItem.length} meals`, tone: "muted" };
  }

  return null;
}

function WorkspaceRow({
  item,
  sources,
  pantryKeySet,
  measurementPref,
  expanded,
  onToggleExpand,
  onToggleChecked,
}: {
  item: WorkspaceItem;
  sources: IngredientSource[];
  pantryKeySet: Set<string>;
  measurementPref: "metric" | "imperial";
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleChecked: (checked: boolean) => void;
}) {
  const pantryKey = (item.normalizedName ?? item.productName).toLowerCase();
  const isPantryStocked = pantryKeySet.has(pantryKey);

  const hint = getOperationalHint(item, isPantryStocked, sources);
  const conf = deriveQuantityConfidence(item);
  const confLabel = getQuantityConfidenceLabel(conf, item);

  const displayQty = formatItemDisplay(
    item.productName,
    item.quantityValue,
    item.unit,
    measurementPref,
  );

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

              {/* Confidence */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Confidence</span>
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

              {/* Combined sources count */}
              {sources.length > 1 && mealAttribution.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Combined from {sources.length} meals
                </p>
              )}

              {/* Pantry status */}
              {isPantryStocked && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <Home className="h-3.5 w-3.5 shrink-0" />
                  <span>In your pantry — check before buying</span>
                </div>
              )}

              {/* Apple score detail */}
              {item.thaRating != null && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">THA Score</span>
                  <ScoreBadge score={item.thaRating} size={20} />
                  {item.itemType === "whole_food" && (
                    <Badge className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 no-default-hover-elevate">
                      <Leaf className="h-2.5 w-2.5 mr-1" />
                      Whole food
                    </Badge>
                  )}
                </div>
              )}

              {/* Category */}
              {item.category && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Category</span>
                  <span className="text-xs text-muted-foreground capitalize">{item.category}</span>
                </div>
              )}

              {/* Needs review flag */}
              {item.needsReview && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 rounded-md bg-amber-50/60 dark:bg-amber-950/20 px-2 py-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.validationNote || "This item may need manual review"}</span>
                </div>
              )}

              {/* Analyser access — links to existing basket */}
              <div className="flex items-center gap-2 pt-1 border-t border-border/20">
                <FlaskConical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Link
                  href="/basket"
                  className="text-xs text-primary hover:underline"
                  data-testid={`ws-analyse-link-${item.id}`}
                >
                  Analyse in Basket
                </Link>
                <span className="text-[10px] text-muted-foreground/60">
                  · Full product details, cleaner options, whole-food route
                </span>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ShoppingWorkspacePage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [expandedId, setExpandedId] = useState<number | null>(null);

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
  const unresolvedCount = useMemo(
    () => items.filter((i) => i.needsReview && !i.checked).length,
    [items],
  );
  const pantryCount = useMemo(
    () =>
      items.filter((i) => {
        const key = (i.normalizedName ?? i.productName).toLowerCase();
        return pantryKeySet.has(key) && !i.checked;
      }).length,
    [items, pantryKeySet],
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-20">

      {/* ── Beta header ───────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/basket"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
            data-testid="ws-back-to-basket"
          >
            <ArrowLeft className="h-4 w-4" />
            Basket
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <div className="flex items-center gap-2 min-w-0">
            <ShoppingBasket className="h-4 w-4 text-primary/70 shrink-0" />
            <span className="text-sm font-semibold text-foreground truncate">Shopping Workspace</span>
            <Badge
              variant="outline"
              className="text-[9px] uppercase tracking-widest border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 shrink-0"
            >
              Beta
            </Badge>
          </div>
        </div>
      </div>

      {/* ── Operational readiness summary ─────────────────────────────── */}
      <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 mb-4 space-y-1">
        <div className="flex items-center gap-4 flex-wrap text-sm">
          <span className="font-medium text-foreground">
            {uncheckedItems.length > 0
              ? `${uncheckedItems.length} item${uncheckedItems.length !== 1 ? "s" : ""} to buy`
              : "All done"}
          </span>
          {checkedItems.length > 0 && (
            <span className="text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              {checkedItems.length} checked
            </span>
          )}
          {unresolvedCount > 0 && (
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              {unresolvedCount} to review
            </span>
          )}
          {pantryCount > 0 && (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
              {pantryCount} in pantry
            </span>
          )}
        </div>
        {items.length === 0 && !isLoading && (
          <p className="text-xs text-muted-foreground">
            No items in your basket yet.{" "}
            <Link href="/basket" className="text-primary hover:underline">
              Add items in Basket
            </Link>
          </p>
        )}
      </div>

      {/* ── Shopping rows ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden mb-6">
          {uncheckedItems.length === 0 && checkedItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Your basket is empty.
            </div>
          ) : (
            <>
              {/* Active items */}
              {uncheckedItems.map((item) => (
                <WorkspaceRow
                  key={item.id}
                  item={item}
                  sources={sourcesByItem.get(item.id) ?? []}
                  pantryKeySet={pantryKeySet}
                  measurementPref={measurementPref}
                  expanded={expandedId === item.id}
                  onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  onToggleChecked={(checked) => toggleChecked.mutate({ id: item.id, checked })}
                />
              ))}

              {/* Checked items — dimmed at the bottom */}
              {checkedItems.length > 0 && (
                <>
                  <div className="px-4 py-1.5 border-t border-border/30 bg-muted/20">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                      Checked ({checkedItems.length})
                    </span>
                  </div>
                  {checkedItems.map((item) => (
                    <WorkspaceRow
                      key={item.id}
                      item={item}
                      sources={sourcesByItem.get(item.id) ?? []}
                      pantryKeySet={pantryKeySet}
                      measurementPref={measurementPref}
                      expanded={expandedId === item.id}
                      onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      onToggleChecked={(checked) => toggleChecked.mutate({ id: item.id, checked })}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Integration gap disclosure ─────────────────────────────────── */}
      <div className="rounded-xl border border-border/30 bg-muted/20 px-4 py-3 space-y-1">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          Pending integration
        </p>
        <ul className="text-xs text-muted-foreground space-y-0.5 list-none">
          <li>· Full analyser modal — use <Link href="/basket" className="text-primary hover:underline">Basket</Link> for product analysis</li>
          <li>· Inline quantity editing — use Basket for edits</li>
          <li>· Sorting and filtering — use Basket</li>
          <li>· Shop View / CYC — use Basket</li>
          <li>· Extras / household items — visible in Basket</li>
        </ul>
        <p className="text-[10px] text-muted-foreground/60 pt-1">
          All shopping data is shared — changes in Basket appear here instantly.
        </p>
      </div>

    </div>
  );
}
