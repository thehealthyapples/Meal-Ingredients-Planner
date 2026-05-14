import React, { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Loader2, Lock, Sparkles, DollarSign, HelpCircle, RefreshCw,
  ShoppingBasket, Pencil, Globe, Snowflake, Microscope, UtensilsCrossed,
  Flame, Beef, Cookie, Droplets, Droplet, Wheat,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { computeMealVariety } from "@/lib/nutrition-variety";
import { getMealNutrients } from "@/lib/nutrition-insights";
import { NutritionVarietyDots } from "@/components/nutrition-variety-chips";
import { MealNutrientTags } from "@/components/nutrition-insights-panel";
import type { Meal, Nutrition } from "@shared/schema";
import type { SmartSuggestEntry, SmartSuggestResult } from "@/lib/planner-types";

// ── UPF helpers ───────────────────────────────────────────────────────────────

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

// ── SmartMealEntryCard ────────────────────────────────────────────────────────

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
      <div className="flex items-start gap-2.5 px-3 py-2.5">
        <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted shrink-0 border flex items-center justify-center">
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

      <div className="px-3 pb-2.5 border-t">
        <div className="flex items-center gap-1 pt-1.5 flex-wrap">
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
        </div>
        {(cost != null || upfScore != null || entry.explanation) && (
          <div className="flex items-center gap-2 pt-1 pb-0.5 flex-wrap">
            {cost != null && <span className="flex items-center gap-0.5 text-xs text-muted-foreground"><DollarSign className="h-3 w-3" />£{cost.toFixed(2)}</span>}
            {upfScore != null && <span className={`text-xs ${getUPFColorFn(upfScore)}`}>UPF: {getUPFLabelFn(upfScore)}</span>}
            {entry.explanation && (
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors" onClick={onExpandExplain} data-testid={`button-explain-${key}`}>
                <HelpCircle className="h-3 w-3" />{expanded ? "Hide" : "Why?"}
              </button>
            )}
          </div>
        )}
      </div>

      {expanded && entry.explanation && (
        <div className="px-3 pb-3 text-xs text-muted-foreground space-y-0.5 bg-muted/20 border-t pt-2">
          {entry.explanation.reasons.map((r, i) => <p key={i}>• {r}</p>)}
        </div>
      )}
    </div>
  );
}

// ── SmartReviewPanelContent ───────────────────────────────────────────────────

export interface SmartReviewPanelContentProps {
  smartResult: SmartSuggestResult | null;
  smartNutritionMap: Map<number, Nutrition>;
  nutritionLoading: boolean;
  lockedEntries: Set<string>;
  expandedExplanation: string | null;
  setExpandedExplanation: (v: string | null) => void;
  applyingSmartPlan: boolean;
  smartLoading: boolean;
  mealById: Map<number, Meal>;
  activeWeek: string;
  toggleLockEntry: (key: string) => void;
  regenerateSingleEntry: (entry: SmartSuggestEntry) => void;
  applySmartSuggestion: () => void;
  runSmartSuggest: (preserveLocks?: boolean) => void;
  setNutritionFetchTick: React.Dispatch<React.SetStateAction<number>>;
  onCancel: () => void;
  restoredFromSession?: boolean;
  onDismissRestoreBanner?: () => void;
}

export function SmartReviewPanelContent({
  smartResult,
  smartNutritionMap,
  nutritionLoading,
  lockedEntries,
  expandedExplanation,
  setExpandedExplanation,
  applyingSmartPlan,
  smartLoading,
  mealById,
  activeWeek,
  toggleLockEntry,
  regenerateSingleEntry,
  applySmartSuggestion,
  runSmartSuggest,
  setNutritionFetchTick,
  onCancel,
  restoredFromSession,
  onDismissRestoreBanner,
}: SmartReviewPanelContentProps) {
  if (!smartResult) return null;

  const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const grouped: Record<number, SmartSuggestEntry[]> = {};
  for (const e of smartResult.entries) {
    if (!grouped[e.dayOfWeek]) grouped[e.dayOfWeek] = [];
    grouped[e.dayOfWeek].push(e);
  }

  return (
    <div className="space-y-4">
      {restoredFromSession && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 px-3 py-2">
          <p className="text-xs text-blue-800 dark:text-blue-200">Previous plan restored from session.</p>
          <button
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0"
            onClick={onDismissRestoreBanner}
            data-testid="button-dismiss-restore-banner"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border bg-muted/30 px-2 py-1.5 text-center">
          <p className="text-xs text-muted-foreground">Total meals</p>
          <p className="text-base font-semibold">{smartResult.stats.totalMeals}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 px-2 py-1.5 text-center">
          <p className="text-xs text-muted-foreground">Est. cost</p>
          <p className="text-base font-semibold">£{(smartResult.stats.estimatedWeeklyCost ?? 0).toFixed(0)}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 px-2 py-1.5 text-center">
          <p className="text-xs text-muted-foreground">Avg UPF</p>
          <p className={`text-base font-semibold ${getUPFColorFn(smartResult.stats.averageUPFScore)}`}>{getUPFLabelFn(smartResult.stats.averageUPFScore)}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 px-2 py-1.5 text-center">
          <p className="text-xs text-muted-foreground">Ingredient reuse</p>
          <p className="text-base font-semibold">{smartResult.stats.ingredientReuse ?? 0}</p>
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(grouped).sort(([a],[b]) => Number(a)-Number(b)).map(([dow, entries]) => (
          <div key={dow} className="rounded-lg border">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-t-lg border-b">
              <span className="text-xs font-medium">{dayNames[Number(dow)]}</span>
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
        ))}
      </div>

      {lockedEntries.size > 0 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Lock className="h-3 w-3 text-primary" />{lockedEntries.size} meal{lockedEntries.size !== 1 ? "s" : ""} locked — kept on regenerate.
        </p>
      )}

      <div className="flex flex-col gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => runSmartSuggest(true)}
          disabled={smartLoading}
          data-testid="button-smart-regenerate"
        >
          {smartLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
          Regenerate
        </Button>
        <Button
          size="sm"
          className="w-full"
          onClick={applySmartSuggestion}
          disabled={applyingSmartPlan}
          data-testid="button-smart-apply"
        >
          {applyingSmartPlan ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
          Apply to Week {activeWeek}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={onCancel}
          data-testid="button-smart-cancel"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
