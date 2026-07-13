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

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Check, X, Loader2, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useTrackedMutation } from "@/hooks/use-tracked-mutation";
import type { MealUpliftApplication, Meal } from "@shared/schema";
import { normaliseForReuse, getReuseLabel } from "@/lib/ingredient-reuse";
import { invalidateMealLibrary } from "@/hooks/use-meals";

// ─── WS0 knowledge type (mirrors server IngredientKnowledgeSummary) ──────────

interface IngredientKnowledge {
  nutrients: string[];
  benefits: string[];
}

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

/**
 * Selects the boost suggestions shown for a meal: the reuse-aware ranking
 * (≤1 reuse slot + discovery) capped at 5. Exported so the planner card
 * indicator can show the SAME count this panel will render — the two must never
 * drift (the card previously used a raw `Math.min(count, 2)` over server matches
 * only, which is why a card said "2" while the panel showed "5"). This does NOT
 * subtract already-accepted items; the panel removes those separately via
 * provenance (see `pendingSuggestions`).
 */
export function selectVisibleBoosts(
  upliftMatches: UpliftMatchResult[],
  weeklyReuseMap: Map<string, string[]> | undefined,
  currentMealName: string | undefined,
): FlatSuggestion[] {
  const allSuggestions: FlatSuggestion[] = upliftMatches.flatMap((m) =>
    m.suggestions.map((s) => ({ ...s, ruleId: m.ruleId, ruleName: m.ruleName }))
  );
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
  return [...selectedReuse, ...selectedDiscovery];
}

// ─── Shopping list query keys — invalidated after any uplift mutation ─────────

export const SHOPPING_LIST_KEYS = [
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
  const [expandedIngredients, setExpandedIngredients] = useState<Set<string>>(new Set());
  const [effectiveMealId, setEffectiveMealId] = useState(mealId);
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set());

  // Reuse-aware ranking + 5-item cap. Shared with the planner card indicator
  // via selectVisibleBoosts so the card's count always matches what renders here.
  // Priority order: Safety → Meal Fit (already enforced by uplift engine) →
  //   Weekly Reuse → Nutrition Value → Discovery / Variety
  const visibleSuggestions = selectVisibleBoosts(upliftMatches, weeklyReuseMap, currentMealName);

  // Batch-fetch WS0 nutrients + benefits for visible suggestion ingredients.
  // Returns {} while loading — expanded rows fall back to suggestion.why.
  const suggestionKeys = useMemo(
    () => visibleSuggestions.map((s) => s.ingredient).sort(),
    [visibleSuggestions],
  );
  const { data: suggestionKnowledge = {} } = useQuery<Record<string, IngredientKnowledge>>({
    queryKey: ["/api/knowledge/ingredient-lookup", "uplift", suggestionKeys.join(",")],
    queryFn: async () => {
      if (suggestionKeys.length === 0) return {};
      const res = await fetch("/api/knowledge/ingredient-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: suggestionKeys }),
      });
      if (!res.ok) return {};
      return res.json() as Promise<Record<string, IngredientKnowledge>>;
    },
    enabled: suggestionKeys.length > 0,
    staleTime: 10 * 60 * 1000,
  });

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
    enabled: true,
    staleTime: 30_000,
  });

  // Active (non-removed) applications
  const activeApplications = applications.filter((a) => a.status !== "removed");

  // PROOF STEP 7 — log activeApplications whenever they change
  React.useEffect(() => {
    console.log("[BOOST-PROOF] STEP7 activeApplications changed:", {
      effectiveMealId,
      open,
      applicationsCount: applications.length,
      activeCount: activeApplications.length,
      activeIngredients: activeApplications.map(a => a.ingredient),
    });
  }, [activeApplications.length, effectiveMealId, open]);

  // Accept a single suggestion.
  //
  // PX1-W0 (fnd-px-silent-mutations): this had no `onError` at all. A boost that
  // failed to apply left the household looking at an unchanged recipe with no word
  // that anything had gone wrong — and the ONLY record of the failure was the
  // `[BOOST-PROOF]` console logging below, which is observability for us, not an
  // answer for them. (Retiring those logs is PX1-W4b.6 and is deliberately not done
  // here: the user-facing failure surface they were standing in for is, and that is
  // the part the household can feel.)
  const acceptMutation = useTrackedMutation({
    mutationFn: async (suggestion: FlatSuggestion) => {
      // PROOF STEP 1 — request payload
      console.log("[BOOST-PROOF] STEP1 request:", {
        mealId: effectiveMealId,
        plannerEntryId,
        ingredient: suggestion.ingredient,
      });
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
        applications: MealUpliftApplication[];
      }>;
    },
    onSuccess: (data, suggestion) => {
      // PROOF STEP 2 — server response
      console.log("[BOOST-PROOF] STEP2 response:", {
        mealId: data.mealId,
        forkedFromMealId: data.forkedFromMealId,
        added: data.added,
        effectiveMealIdBeforeUpdate: effectiveMealId,
      });

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

      // Synchronously update meals cache for fork case — prevents close/reopen race
      // where the modal would reopen against the original system meal instead of the fork
      if (data.forkedFromMealId) {
        qc.setQueryData<Meal[]>(["/api/meals"], (prev) => {
          if (!prev) {
            console.log("[BOOST-PROOF] STEP3 setQueryData: prev is null/undefined — fork NOT added");
            return prev;
          }
          const forkExists = prev.some((m) => m.id === data.mealId);
          if (forkExists) {
            console.log("[BOOST-PROOF] STEP3 setQueryData: fork already exists, updating ingredients");
            return prev.map((m) => {
              if (m.id !== data.mealId) return m;
              const existing = m.ingredients ?? [];
              return {
                ...m,
                ingredients: [
                  ...existing,
                  ...data.added.filter((i) => !existing.includes(i)),
                ],
              };
            });
          }
          const original = prev.find((m) => m.id === data.forkedFromMealId!);
          if (!original) {
            console.log("[BOOST-PROOF] STEP3 setQueryData: original meal NOT found in meals cache — fork NOT added. forkedFromMealId:", data.forkedFromMealId, "meals count:", prev.length, "meal ids:", prev.slice(0, 10).map(m => m.id));
            return prev;
          }
          console.log("[BOOST-PROOF] STEP3 setQueryData: adding fork to meals cache. forkId:", data.mealId, "originalId:", data.forkedFromMealId, "added:", data.added);
          return [
            ...prev,
            {
              ...original,
              id: data.mealId,
              isSystemMeal: false,
              ingredients: [...(original.ingredients ?? []), ...data.added],
            },
          ];
        });
      } else {
        console.log("[BOOST-PROOF] STEP3 setQueryData: skipped (no fork — user meal update, async refetch will carry ingredient)");
      }

      // PROOF STEP 3 — meals cache after setQueryData
      const mealsAfter = qc.getQueryData<Meal[]>(["/api/meals"]);
      const forkInCache = mealsAfter?.find(m => m.id === data.mealId);
      console.log("[BOOST-PROOF] STEP3 meals cache AFTER setQueryData:", {
        forkId: data.mealId,
        forkFoundInCache: !!forkInCache,
        forkIngredients: forkInCache?.ingredients ?? "NOT IN CACHE",
      });

      // Immediately seed the applications cache from the POST response so
      // provenance renders without waiting for the GET round-trip. Only
      // 'accepted' rows are written — the GET endpoint returns accepted only,
      // so the cache must keep the same shape.
      const acceptedApplications = (data.applications ?? []).filter(
        (a) => a.status === "accepted"
      );
      if (acceptedApplications.length) {
        qc.setQueryData<MealUpliftApplication[]>(
          ["/api/meals", data.mealId, "uplift-applications"],
          (old = []) => [
            ...old.filter(
              (a) => !acceptedApplications.some((n) => n.id === a.id)
            ),
            ...acceptedApplications,
          ]
        );
      }

      // Refresh meals + provenance
      invalidateMealLibrary(qc);
      qc.invalidateQueries({
        queryKey: ["/api/meals", data.mealId, "uplift-applications"],
      });
      // Immediately reflect ingredient change in shopping list
      for (const key of SHOPPING_LIST_KEYS) {
        qc.invalidateQueries({ queryKey: key });
      }
      onUpliftAccepted?.(data.mealId);
    },
    feedback: {
      // No success title: the ingredient appears in the recipe and the boost moves to
      // "applied" — the panel is its own confirmation.
      failure: "Couldn't apply that boost",
      failureDescription: "Your recipe is unchanged. Please try again.",
    },
  });

  // Remove an accepted application.
  // PX1-W0 (fnd-px-silent-mutations): likewise had no failure path — the boost simply
  // stayed on the recipe, and THA said nothing about why.
  const removeMutation = useTrackedMutation({
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
      invalidateMealLibrary(qc);
      // Immediately reflect ingredient removal in shopping list
      for (const key of SHOPPING_LIST_KEYS) {
        qc.invalidateQueries({ queryKey: key });
      }
      onUpliftRemoved?.(effectiveMealId);
    },
    feedback: {
      // No success title: the boost visibly leaves the recipe.
      failure: "Couldn't remove that boost",
      failureDescription: "It's still applied to your recipe. Please try again.",
    },
  });

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
          {/* Pending suggestions — compact rows, multi-expand, Add always visible */}
          {pendingSuggestions.map((suggestion) => {
            const isExpanded = expandedIngredients.has(suggestion.ingredient);
            const isAdding =
              acceptMutation.isPending &&
              acceptMutation.variables?.ingredient === suggestion.ingredient;
            const wasJustAdded = justAdded.has(suggestion.ingredient);
            const knowledge = suggestionKnowledge[suggestion.ingredient];

            return (
              <div
                key={suggestion.ingredient}
                data-testid={`uplift-suggestion-${suggestion.ingredient}`}
              >
                {/* Row header — expand toggle on left, Add action on right */}
                <div className="flex items-center">
                  <button
                    className="flex-1 flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/20 transition-colors min-w-0"
                    onClick={() =>
                      setExpandedIngredients((prev) => {
                        const next = new Set(prev);
                        if (next.has(suggestion.ingredient)) next.delete(suggestion.ingredient);
                        else next.add(suggestion.ingredient);
                        return next;
                      })
                    }
                    aria-expanded={isExpanded}
                  >
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform${isExpanded ? " rotate-180" : ""}`}
                    />
                    <span className="text-sm font-medium text-foreground truncate">
                      {suggestion.action === "swap" ? "Swap to " : ""}
                      {suggestion.ingredient}
                      {suggestion.quantity && (
                        <span className="text-muted-foreground font-normal">
                          {" "}— {suggestion.quantity}
                        </span>
                      )}
                    </span>
                  </button>

                  <div className="px-2 shrink-0">
                    {wasJustAdded ? (
                      <div
                        className="flex items-center gap-1 text-xs text-emerald-600 font-medium"
                        data-testid={`uplift-added-${suggestion.ingredient}`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Added
                      </div>
                    ) : (
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
                        Add
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded content — nutrients, benefits, reuse label */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-1.5 border-t border-border/30">
                    {knowledge ? (
                      <>
                        {knowledge.nutrients.length > 0 && (
                          <p className="text-[10px] text-emerald-700/60 dark:text-emerald-400/60 leading-snug mt-1.5 font-medium tracking-wide">
                            {knowledge.nutrients.join(" · ")}
                          </p>
                        )}
                        {knowledge.benefits.length > 0 ? (
                          <p className="text-xs text-muted-foreground leading-snug">
                            {knowledge.benefits.slice(0, 2).join(" · ")}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground leading-snug">
                            {suggestion.why}
                          </p>
                        )}
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
                        <p className="text-[10px] text-emerald-600/55 dark:text-emerald-400/55 leading-snug mt-0.5">
                          Already used this week: {label}
                        </p>
                      );
                    })()}
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
