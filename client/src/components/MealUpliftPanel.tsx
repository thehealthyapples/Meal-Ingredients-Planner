/**
 * MealUpliftPanel.tsx
 * ===================
 * Inline expandable Nutrition Boost section for the meal detail dialog.
 *
 * Design principles:
 * - Calm, supportive, non-preachy language
 * - Max 2 suggestions shown initially (spec: anti-clutter)
 * - Fully reversible (add → remove)
 * - Async provenance loading — never blocks planner
 * - Mobile-safe: no overflow, adequate touch targets
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Check, X, Loader2, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import type { MealUpliftApplication } from "@shared/schema";
import { normaliseForReuse, getReuseLabel } from "@/lib/ingredient-reuse";
import { getNutritionBenefit } from "@/lib/nutrition-benefit-library";

// ─── Client-side type mirrors (server/lib/uplift-types.ts) ───────────────────

export interface UpliftSuggestion {
  ingredient: string;
  action: "add" | "swap" | "boost";
  quantity?: string;
  why: string;
}

export interface UpliftMatchResult {
  ruleId: string;
  ruleName: string;
  suggestions: UpliftSuggestion[];
  nutritionTags: string[];
  confidence: "high" | "medium" | "low";
  priority: number;
}

// ─── Flat suggestion with provenance ─────────────────────────────────────────

interface FlatSuggestion extends UpliftSuggestion {
  ruleId: string;
  ruleName: string;
}

// ─── Shopping list query keys — invalidated after any uplift mutation ─────────

const SHOPPING_LIST_KEYS = [
  ["/api/shopping-list"],
  ["/api/shopping-list/sources"],
  ["/api/shopping-list/prices"],
  ["/api/shopping-list/total-cost"],
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface MealUpliftPanelProps {
  mealId: number;
  plannerEntryId: number;
  mealSlot?: string;
  upliftMatches: UpliftMatchResult[];
  /** Name of the meal being enhanced — used to filter self-references in reuse labels */
  currentMealName?: string;
  /** Ingredient → meal names map for the active planner week, built by weekly-planner-page */
  weeklyReuseMap?: Map<string, string[]>;
  /** Called when a system meal was forked — provides the new mealId to parent */
  onMealForked?: (newMealId: number) => void;
  /** Called when uplift is successfully accepted — provides effective mealId */
  onUpliftAccepted?: (mealId: number) => void;
  /** Called when uplift is successfully removed — provides effective mealId */
  onUpliftRemoved?: (mealId: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MealUpliftPanel({
  mealId,
  plannerEntryId,
  upliftMatches,
  currentMealName,
  weeklyReuseMap,
  onMealForked,
  onUpliftAccepted,
  onUpliftRemoved,
}: MealUpliftPanelProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expandedIngredient, setExpandedIngredient] = useState<string | null>(null);
  const [effectiveMealId, setEffectiveMealId] = useState(mealId);
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set());

  // Flatten suggestions across all matches
  const allSuggestions: FlatSuggestion[] = upliftMatches.flatMap((m) =>
    m.suggestions.map((s) => ({ ...s, ruleId: m.ruleId, ruleName: m.ruleName }))
  );

  // Reuse-aware ranking:
  //   P1 (reuse) — already used elsewhere this week, max 1 slot
  //   P2 (discovery) — not yet used this week, fills remaining slots
  // Priority order: Safety → Meal Fit (already enforced by uplift engine) →
  //   Weekly Reuse → Nutrition Value → Discovery / Variety
  const reuseSuggestions = weeklyReuseMap && currentMealName
    ? allSuggestions.filter((s) => {
        const mealNames = weeklyReuseMap.get(normaliseForReuse(s.ingredient))?.filter(n => n !== currentMealName);
        return !!mealNames?.length;
      })
    : [];
  const discoverySuggestions = weeklyReuseMap && currentMealName
    ? allSuggestions.filter((s) => {
        const mealNames = weeklyReuseMap.get(normaliseForReuse(s.ingredient))?.filter(n => n !== currentMealName);
        return !mealNames?.length;
      })
    : allSuggestions;
  const selectedReuse = reuseSuggestions.slice(0, 1);
  const selectedDiscovery = discoverySuggestions.slice(0, 5 - selectedReuse.length);
  const visibleSuggestions = [...selectedReuse, ...selectedDiscovery];

  // Load provenance (accepted uplift applications for this meal)
  const { data: applications = [] } = useQuery<MealUpliftApplication[]>({
    queryKey: ["/api/meals", effectiveMealId, "uplift-applications"],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/meals/${effectiveMealId}/uplift-applications`
      );
      const body = await res.json();
      return body.applications ?? [];
    },
    enabled: open,
    staleTime: 30_000,
  });

  // Active (non-removed) applications
  const activeApplications = applications.filter((a) => a.status !== "removed");

  // Accept a single suggestion
  const acceptMutation = useMutation({
    mutationFn: async (suggestion: FlatSuggestion) => {
      const res = await apiRequest("POST", "/api/uplift/accept", {
        mealId: effectiveMealId,
        plannerEntryId,
        suggestions: [
          {
            ruleId: suggestion.ruleId,
            ruleName: suggestion.ruleName,
            ingredient: suggestion.ingredient,
            action: suggestion.action,
            quantity: suggestion.quantity,
            explanation: suggestion.why,
          },
        ],
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? "Failed to add to meal");
      }
      return res.json() as Promise<{
        mealId: number;
        forkedFromMealId: number | null;
        added: string[];
      }>;
    },
    onSuccess: (data, suggestion) => {
      // Handle system meal fork — update effective mealId
      if (data.forkedFromMealId && data.mealId !== effectiveMealId) {
        setEffectiveMealId(data.mealId);
        onMealForked?.(data.mealId);
      }

      setJustAdded((prev) => {
        const next = new Set(prev);
        next.add(suggestion.ingredient);
        return next;
      });

      // Refresh meals + provenance
      qc.invalidateQueries({ queryKey: ["/api/meals"] });
      qc.invalidateQueries({
        queryKey: ["/api/meals", data.mealId, "uplift-applications"],
      });
      // Immediately reflect ingredient change in shopping list
      for (const key of SHOPPING_LIST_KEYS) {
        qc.invalidateQueries({ queryKey: key });
      }
      onUpliftAccepted?.(data.mealId);
    },
  });

  // Remove an accepted application
  const removeMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const res = await apiRequest(
        "DELETE",
        `/api/uplift/applications/${applicationId}`
      );
      if (!res.ok) throw new Error("Failed to remove");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["/api/meals", effectiveMealId, "uplift-applications"],
      });
      qc.invalidateQueries({ queryKey: ["/api/meals"] });
      // Immediately reflect ingredient removal in shopping list
      for (const key of SHOPPING_LIST_KEYS) {
        qc.invalidateQueries({ queryKey: key });
      }
      onUpliftRemoved?.(effectiveMealId);
    },
  });

  // Don't render if uplift has no data at all (parent already guards matches.length > 0)
  if (upliftMatches.length === 0) return null;

  // Hide suggestions already persisted in provenance
  const acceptedIngredientKeys = new Set(
    activeApplications.map((a) => a.ingredient.toLowerCase().trim())
  );
  const pendingSuggestions = visibleSuggestions.filter(
    (s) => !acceptedIngredientKeys.has(s.ingredient.toLowerCase().trim())
  );

  return (
    <div
      className="border border-border/60 rounded-lg overflow-hidden"
      data-testid="uplift-panel"
    >
      {/* Header — always visible */}
      <button
        className="w-full flex items-center justify-between px-3 py-2 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
        onClick={() => setOpen((o) => !o)}
        data-testid="uplift-panel-toggle"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <Leaf className="h-3.5 w-3.5 text-emerald-600/70 shrink-0" />
          <span className="text-sm font-medium text-foreground">
            Nutrition Boost
          </span>
          {pendingSuggestions.length > 0 && (
            <span className="text-xs text-muted-foreground">
              · {pendingSuggestions.length} idea
              {pendingSuggestions.length !== 1 ? "s" : ""}
            </span>
          )}
          {activeApplications.length > 0 && !open && (
            <span className="text-xs text-emerald-600/60">
              · {activeApplications.length} added
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {open && (
        <div className="divide-y divide-border/40">
          {/* Pending suggestions — accordion: one row expanded at a time */}
          {pendingSuggestions.map((suggestion) => {
            const isExpanded = expandedIngredient === suggestion.ingredient;
            const isAdding =
              acceptMutation.isPending &&
              acceptMutation.variables?.ingredient === suggestion.ingredient;
            const wasJustAdded = justAdded.has(suggestion.ingredient);
            const benefit = getNutritionBenefit(suggestion.ingredient);

            return (
              <div
                key={suggestion.ingredient}
                data-testid={`uplift-suggestion-${suggestion.ingredient}`}
              >
                {/* Collapsed row — always visible */}
                <button
                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted/20 transition-colors"
                  onClick={() =>
                    setExpandedIngredient((prev) =>
                      prev === suggestion.ingredient ? null : suggestion.ingredient
                    )
                  }
                  aria-expanded={isExpanded}
                >
                  <span className="text-sm font-medium text-foreground leading-snug">
                    {suggestion.action === "swap" ? "Swap to " : ""}
                    {suggestion.ingredient}
                    {suggestion.quantity && (
                      <span className="text-muted-foreground font-normal">
                        {" "}— {suggestion.quantity}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {wasJustAdded && (
                      <div
                        className="flex items-center gap-1 text-xs text-emerald-600 font-medium"
                        data-testid={`uplift-added-${suggestion.ingredient}`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Added
                      </div>
                    )}
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-muted-foreground transition-transform${isExpanded ? " rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2 border-t border-border/30">
                    {benefit ? (
                      <>
                        <p className="text-[10px] text-emerald-700/60 dark:text-emerald-400/60 leading-snug mt-1.5 font-medium tracking-wide">
                          {benefit.keyNutrients.join(" · ")}
                        </p>
                        <p className="text-xs text-muted-foreground leading-snug">
                          {benefit.summary}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground leading-snug mt-1.5">
                        {suggestion.why}
                      </p>
                    )}

                    {weeklyReuseMap && currentMealName && (() => {
                      const label = getReuseLabel(suggestion.ingredient, weeklyReuseMap, currentMealName);
                      if (!label) return null;
                      return (
                        <p className="text-[10px] text-emerald-600/55 dark:text-emerald-400/55 leading-snug">
                          Already used this week: {label}
                        </p>
                      );
                    })()}

                    {!wasJustAdded && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2.5 border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-600/50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                        onClick={() => acceptMutation.mutate(suggestion)}
                        disabled={isAdding || acceptMutation.isPending}
                        data-testid={`uplift-add-${suggestion.ingredient}`}
                      >
                        {isAdding ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : null}
                        Add to meal
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Accepted uplift items (provenance) */}
          {activeApplications.length > 0 && (
            <div className="px-3 py-2 space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                Added via THA Boost
              </p>
              {activeApplications.map((app) => {
                const isRemoving =
                  removeMutation.isPending &&
                  removeMutation.variables === app.id;
                return (
                  <div
                    key={app.id}
                    className="flex items-center justify-between gap-2"
                    data-testid={`uplift-applied-${app.id}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Check className="h-3 w-3 text-emerald-500/70 shrink-0" />
                      <span className="text-xs text-foreground/80 truncate">
                        {app.ingredient}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 shrink-0">
                        · THA Boost
                      </span>
                    </div>
                    <button
                      className="text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0 p-0.5 rounded min-h-[28px] min-w-[28px] flex items-center justify-center"
                      onClick={() => removeMutation.mutate(app.id)}
                      disabled={isRemoving}
                      aria-label={`Remove ${app.ingredient}`}
                      data-testid={`uplift-remove-${app.id}`}
                    >
                      {isRemoving ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state — no suggestions, none accepted yet */}
          {pendingSuggestions.length === 0 && activeApplications.length === 0 && (
            <div className="px-3 py-2.5">
              <p className="text-xs text-muted-foreground">
                No boost ideas for this meal right now.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Matrix card indicator (tiny entry point) ─────────────────────────────────

interface UpliftCardIndicatorProps {
  suggestionCount: number;
  onClick: () => void;
}

export function UpliftCardIndicator({
  suggestionCount,
  onClick,
}: UpliftCardIndicatorProps) {
  if (suggestionCount === 0) return null;
  return (
    <button
      className="flex items-center gap-0.5 text-[10px] text-emerald-600/50 hover:text-emerald-600/80 transition-colors leading-none mt-0.5 group/boost"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title="Nutrition Boost ideas available"
      data-testid="uplift-card-indicator"
    >
      <Leaf className="h-2.5 w-2.5 shrink-0" />
      <span>
        {suggestionCount} boost idea{suggestionCount !== 1 ? "s" : ""}
      </span>
    </button>
  );
}
