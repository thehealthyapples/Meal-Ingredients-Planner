import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ShoppingBasket, ListPlus, Loader2, ChevronDown, ChevronUp,
  Clock, ArrowRight, Info, CalendarDays,
} from "lucide-react";
import AppleRating from "@/components/AppleRating";
import { buildAnalyserViewModel } from "@/lib/analyser-view-model";
import type { InputProduct, PackagedSwap, WholeFoodSwap } from "@/lib/analyser-view-model";
import { effortLabel, effortColor, formatTime } from "@/lib/whole-food-alternatives";
import { rankChoices, buildWhyBetter } from "@/lib/analyser-choice";
import thaAppleSrc from "@/assets/icons/tha-apple.png";
import RestrictionSafetyPanel from "@/components/analyser/RestrictionSafetyPanel";
import { computeRestrictionSafety, parseIngredientText } from "@shared/restrictions/restriction-safety";
import type { EaterProfile } from "@shared/restrictions/restriction-safety";

type DietProfile = {
  dietPattern: string | null;
  dietRestrictions: string[];
};

interface Props {
  product: InputProduct;
  otherProducts: InputProduct[];
  onAddToBasket: () => void;
  onAddToQuickList?: () => void;
  onAddToWeek?: () => void;
  onViewProduct: (product: InputProduct) => void;
  addToBasketPending?: boolean;
  dietProfile?: DietProfile | null;
  /**
   * Household eater profiles with hard restrictions.
   * Passed from the products page after querying /api/household/eaters.
   * When absent, the restriction safety panel is not shown.
   */
  householdEaterProfiles?: EaterProfile[];
}

const RISK_TEXT: Record<string, string> = {
  high: "text-red-700 dark:text-red-400",
  moderate: "text-yellow-700 dark:text-yellow-500",
  low: "text-foreground",
};

const SECTION_LABEL = "text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground/70";

const CONCERN_CHECKS: Array<{
  id: string;
  keywords: string[];
  label: string;
  relevantFor: (p: DietProfile) => boolean;
}> = [
  {
    id: "dairy",
    keywords: ["milk", "cream", "butter", "cheese", "yogurt", "yoghurt", "whey", "casein", "lactose", "ghee"],
    label: "dairy",
    relevantFor: (p) => p.dietRestrictions.includes("Dairy-Free") || p.dietPattern === "Vegan",
  },
  {
    id: "gluten",
    keywords: ["wheat", "flour", "gluten", "barley", "rye", "spelt", "semolina"],
    label: "gluten",
    relevantFor: (p) => p.dietRestrictions.includes("Gluten-Free"),
  },
  {
    id: "meat",
    keywords: ["chicken", "beef", "pork", "lamb", "turkey", "duck", "bacon", "ham", "sausage", "mince", "venison"],
    label: "meat",
    relevantFor: (p) => p.dietPattern === "Vegan" || p.dietPattern === "Vegetarian",
  },
  {
    id: "fish",
    keywords: ["fish", "salmon", "tuna", "cod", "haddock", "prawn", "shrimp", "anchovy", "mackerel"],
    label: "fish",
    relevantFor: (p) => p.dietPattern === "Vegan" || p.dietPattern === "Vegetarian",
  },
  {
    id: "eggs",
    keywords: ["egg", "eggs", "egg yolk", "egg white", "whole egg"],
    label: "eggs",
    relevantFor: (p) => p.dietPattern === "Vegan",
  },
];

function checkDietConcerns(ingredientsText: string | null, dietProfile: DietProfile | null): string[] {
  if (!ingredientsText || !dietProfile) return [];
  const text = ingredientsText.toLowerCase();
  const concerns: string[] = [];
  for (const check of CONCERN_CHECKS) {
    if (check.relevantFor(dietProfile) && check.keywords.some(kw => text.includes(kw))) {
      concerns.push(check.label);
    }
  }
  return concerns;
}

function hasDietPreferences(dietProfile: DietProfile | null): boolean {
  if (!dietProfile) return false;
  return (dietProfile.dietRestrictions.length > 0) || (dietProfile.dietPattern !== null);
}

function formatConcernList(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

// FOODUI2 (2026-10-29) — "a better option exists" used to mean a name and a
// rating, with nothing to hold it next to. A household deciding whether to
// swap needs to see their own product's numbers beside the alternative's,
// same shape as Analyser's own compare table (products-page.tsx) and the
// Food Comparison view (FoodComparisonView.tsx) — one side-by-side pattern,
// three surfaces, not three different ways of showing "which is better".
const SWAP_METRICS: Array<{
  key: string;
  label: string;
  value: (p: any) => number | null;
  format: (v: number) => string;
  betterWhen: "lower" | "higher";
}> = [
  { key: "tha", label: "THA score", value: (p) => p.upfAnalysis?.thaRating ?? null, format: (v) => `${v}/5`, betterWhen: "higher" },
  { key: "sugar", label: "Sugar", value: (p) => p.nutriments?.sugar ?? null, format: (v) => `${v}g`, betterWhen: "lower" },
  { key: "protein", label: "Protein", value: (p) => p.nutriments?.protein ?? null, format: (v) => `${v}g`, betterWhen: "higher" },
  { key: "additives", label: "Additives", value: (p) => p.upfAnalysis?.additiveMatches?.length ?? null, format: (v) => `${v}`, betterWhen: "lower" },
];

function SwapTable({
  current,
  options,
  onViewProduct,
}: {
  current: InputProduct;
  options: any[];
  onViewProduct: (product: any) => void;
}) {
  const columns = [current as any, ...options];
  return (
    <div className="overflow-x-auto rounded-lg border border-border/60" data-testid="swap-table">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60">
            <th className="sticky left-0 z-10 min-w-16 bg-background p-2.5" />
            {columns.map((p, i) => (
              <th key={p.barcode ?? i} className={cn("min-w-[140px] p-2.5 text-center", i === 0 && "bg-muted/40")}>
                <p className="line-clamp-2 text-xs font-semibold leading-snug" data-testid={i === 0 ? undefined : "text-shop-alt-name"}>
                  {i === 0 ? "Yours" : p.product_name}
                </p>
                {i > 0 && (
                  <button
                    className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => onViewProduct(p)}
                    data-testid="button-shop-alternative-view"
                    aria-label={`View ${p.product_name}`}
                  >
                    View <ArrowRight className="h-2.5 w-2.5" />
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SWAP_METRICS.map((metric) => {
            const values = columns.map((p) => metric.value(p));
            const knownIndices = values.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0);
            const bestIndex = knownIndices.length > 0
              ? knownIndices.reduce((best, i) => {
                  const bv = values[best] as number, iv = values[i] as number;
                  return metric.betterWhen === "lower" ? (iv < bv ? i : best) : (iv > bv ? i : best);
                }, knownIndices[0])
              : -1;
            return (
              <tr key={metric.key} className="border-b border-border/50 last:border-0">
                <th scope="row" className="sticky left-0 z-10 bg-background p-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">
                  {metric.label}
                </th>
                {columns.map((p, i) => {
                  const v = values[i];
                  return (
                    <td
                      key={i}
                      className={cn(
                        "p-2.5 text-center text-xs",
                        i === 0 && "bg-muted/40",
                        i === bestIndex && i !== 0 && "font-semibold text-green-700 dark:text-green-400",
                      )}
                    >
                      {v === null ? <span className="text-muted-foreground/50">—</span> : metric.format(v)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          <tr>
            <th scope="row" className="sticky left-0 z-10 bg-background p-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">
              Why
            </th>
            <td className="bg-muted/40 p-2.5" />
            {options.map((opt, i) => {
              const reasons = buildWhyBetter(opt, (current as any).upfAnalysis?.thaRating ?? null);
              return (
                <td key={opt.barcode ?? i} className="p-2.5 text-center text-[11px] text-muted-foreground">
                  {reasons.length > 0 ? reasons.join(" · ") : "—"}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function AnalyserDetailV2({
  product,
  otherProducts,
  onAddToBasket,
  onAddToQuickList,
  onAddToWeek,
  onViewProduct,
  addToBasketPending,
  dietProfile = null,
  householdEaterProfiles,
}: Props) {
  const vm = buildAnalyserViewModel(product, otherProducts);

  const [showRawIngredients, setShowRawIngredients] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const [showRecipeIndex, setShowRecipeIndex] = useState<number | null>(null);
  const [showMoreAlternatives, setShowMoreAlternatives] = useState(false);

  const wholeFoodSwaps = vm.swaps.filter((s): s is WholeFoodSwap => s.type === "whole-food");
  const packagedSwaps = vm.swaps.filter((s): s is PackagedSwap => s.type === "packaged");

  // ── Shop alternative ────────────────────────────────────────────────────
  const primaryStore = (product as any).availableStores?.[0] ?? null;
  const currentScore = (product as any).upfAnalysis?.thaRating ?? null;
  let topOptions: any[] = [];
  if (primaryStore) {
    const storeProducts = otherProducts.filter((p: any) =>
      p.barcode !== product.barcode &&
      (p.availableStores ?? []).includes(primaryStore)
    );
    const ranked = rankChoices(storeProducts, currentScore);
    topOptions = ranked.slice(0, 5);
  }
  const bestOption = topOptions[0] ?? null;

  const dietConcerns = checkDietConcerns(product.ingredients_text ?? null, dietProfile);
  const showDietBanner = hasDietPreferences(dietProfile);

  // ── Restriction safety (Phase 4) ─────────────────────────────────────────
  // Compute deterministically from household eater profiles + product ingredients.
  // Only runs when household eaters are passed; never runs on empty data.
  const restrictionSafetyResults = useMemo(() => {
    const profiles = householdEaterProfiles ?? [];
    const hasAnyRestrictions = profiles.some(p => (p.hardRestrictions ?? []).length > 0);
    if (!hasAnyRestrictions) return [];

    // Prefer parsed ingredient names from analysis; fall back to text parsing
    const ingredientNames: string[] = product.analysis?.ingredients.map(i => i.name) ??
      (product.ingredients_text ? parseIngredientText(product.ingredients_text) : []);

    if (!ingredientNames.length) return [];

    return computeRestrictionSafety(ingredientNames, profiles);
  }, [product.analysis, product.ingredients_text, householdEaterProfiles]);

  const hasRestrictionsConfigured = (householdEaterProfiles ?? []).some(
    p => (p.hardRestrictions ?? []).length > 0
  );

  return (
    <div className="space-y-6" data-testid="analyser-detail-v2">

      {/* ── Card 1: Product identity + THA score ─────────────────────── */}
      <Card className="border-border shadow-none" data-testid="card-header">
        <CardContent className="p-5 space-y-6">

          {/* Product image */}
          {vm.product.imageUrl && (
            <div className="w-full h-44 bg-muted/20 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={vm.product.imageUrl}
                alt={vm.product.name}
                className="h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}

          {/* Name + brand + pack size + retailers */}
          <div className="space-y-1">
            <h2 className="text-lg font-semibold leading-snug text-foreground" data-testid="text-v2-name">
              {vm.product.name}
            </h2>
            {vm.product.brand && (
              <p className="text-sm text-muted-foreground">{vm.product.brand}</p>
            )}
            {vm.product.packVariants.length > 1 ? (
              <p className="text-xs text-muted-foreground/70">Available in {vm.product.packVariants.join(' · ')}</p>
            ) : vm.product.packSize ? (
              <p className="text-xs text-muted-foreground/70">{vm.product.packSize}</p>
            ) : null}
            {vm.product.confirmedRetailers.length > 0 && (
              <p className="text-xs text-muted-foreground/70 pt-0.5">
                Available at {vm.product.confirmedRetailers.join(" · ")}
              </p>
            )}
            {vm.product.inferredRetailers.length > 0 && (
              <p className="text-xs text-muted-foreground/70 pt-0.5">
                Likely at {vm.product.inferredRetailers.slice(0, 4).join(" · ")}
              </p>
            )}
            {vm.product.confirmedRetailers.length === 0 && vm.product.inferredRetailers.length === 0 && vm.product.retailers.length > 0 && (
              <p className="text-xs text-muted-foreground/70 pt-0.5">
                {vm.product.retailers.join(" · ")}
              </p>
            )}
            {(product as any).scanConfidence === "low" && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 pt-0.5" data-testid="text-v2-limited-data">
                Limited ingredient data — score is indicative only
              </p>
            )}
          </div>

          {/* Diet / allergen banner */}
          {showDietBanner && (
            <div data-testid="diet-concern-banner">
              {dietConcerns.length > 0 ? (
                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-amber-50 dark:bg-amber-950/25 border border-amber-200/70 dark:border-amber-800/40">
                  <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-px" />
                  <p className="text-sm text-amber-800 dark:text-amber-300 leading-snug">
                    Contains {formatConcernList(dietConcerns)} - may not suit your diet
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground/60" data-testid="text-no-allergen-concerns">
                  No allergen concerns for your diet
                </p>
              )}
            </div>
          )}

          {/* Restriction Safety Panel (Phase 4) */}
          {hasRestrictionsConfigured && (
            <RestrictionSafetyPanel
              results={restrictionSafetyResults}
              hasRestrictionsConfigured={hasRestrictionsConfigured}
            />
          )}

          {/* THA score block */}
          <div className="flex items-start justify-between gap-4 pt-5 border-t border-border">
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-foreground leading-tight" data-testid="text-v2-score-label">
                {vm.score.label}
              </p>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed" data-testid="text-v2-verdict">
                {vm.score.verdict}
              </p>
            </div>
            <div className="shrink-0 pt-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-1 cursor-default select-none">
                    <img src={thaAppleSrc} alt="" className="h-12 w-12 object-contain" />
                    <span className="text-sm font-semibold realm-title tabular-nums leading-none">
                      {vm.score.rating} / 5
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">THA Score: {vm.score.rating}/5 — {vm.score.label}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {product.upfAnalysis?.scoringExcludesRegulatory && (product.upfAnalysis?.regulatoryCount ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground/60 leading-snug -mt-2" data-testid="text-regulatory-scoring-note">
              Scoring has been adjusted to exclude mandatory fortification based on your analyser settings.
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2.5">
            <div className="flex gap-2">
            <Button variant="default"
              className="flex-1 gap-2"
              onClick={onAddToBasket}
              disabled={addToBasketPending}
              data-testid="button-v2-add-to-basket"
            >
              {addToBasketPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <ShoppingBasket className="h-4 w-4" />}
              Add to Basket
            </Button>
            {onAddToQuickList && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={onAddToQuickList}
                data-testid="button-v2-add-to-quick-list"
              >
                <ListPlus className="h-4 w-4" />
                Quick List
              </Button>
            )}
            </div>
            {onAddToWeek && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={onAddToWeek}
                data-testid="button-v2-add-to-week"
              >
                <CalendarDays className="h-4 w-4" />
                Add to Week
              </Button>
            )}
            {/* RM3: "Create Meal Template" (link-to-template) retired — it wrote the
                duplicate meal_template_products representation with no live consumer.
                Adding a product to the plan flows through "Add to Week" (RM2A). */}
          </div>

        </CardContent>
      </Card>

      {/* ── Shop alternative ─────────────────────────────────────────── */}
      {bestOption && (
        <Card className="border-border shadow-none" data-testid="card-shop-alternative">
          <CardContent className="p-5 space-y-3">
            <p className={SECTION_LABEL}>Swap in {primaryStore}</p>
            <SwapTable
              current={product}
              options={showMoreAlternatives ? topOptions : topOptions.slice(0, 1)}
              onViewProduct={onViewProduct}
            />
            {topOptions.length > 1 && (
              <button
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowMoreAlternatives((v) => !v)}
                data-testid="button-view-more-alternatives"
              >
                {showMoreAlternatives ? "Fewer options" : `View ${topOptions.length - 1} more option${topOptions.length - 1 === 1 ? "" : "s"}`}
                {showMoreAlternatives
                  ? <ChevronUp className="h-3 w-3" />
                  : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Card 2: Why this score ────────────────────────────────────── */}
      {vm.scoreDrivers.length > 0 && (
        <Card className="border-border shadow-none" data-testid="card-score-drivers">
          <CardContent className="p-5 space-y-4">
            <p className={SECTION_LABEL}>Why this score</p>
            <div className="space-y-4">
              {vm.scoreDrivers.slice(0, 3).map((driver, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className={`h-1.5 w-1.5 rounded-full mt-[7px] flex-shrink-0 ${
                      driver.polarity === "positive"
                        ? "bg-green-500 dark:bg-green-400"
                        : "bg-orange-400 dark:bg-orange-400"
                    }`}
                  />
                  <p className="text-sm text-foreground leading-snug">{driver.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Card 3: THA editorial review ─────────────────────────────── */}
      <Card className="border-border shadow-none" data-testid="card-tha-review">
        <CardContent className="p-5 space-y-4">
          {/* EXP1 — the apple is retired from beside the review: identity is
              not evidence, and a mark beside a claim becomes a truth claim
              (UIA §10 corollary). The words carry the voice. */}
          <div className="flex items-baseline justify-between">
            <p className={SECTION_LABEL}>THA Review</p>
            <p className="text-[10px] text-muted-foreground/60">Computed from ingredients &amp; additives</p>
          </div>
          <p className="text-[15px] text-foreground leading-relaxed" data-testid="text-v2-review">
            {vm.thaReview}
          </p>
        </CardContent>
      </Card>

      {/* ── Card 4: Ingredients ──────────────────────────────────────── */}
      {vm.uiMeta.hasIngredients && (
        <Card className="border-border shadow-none bg-muted/10" data-testid="card-ingredients">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-baseline justify-between">
              <p className={SECTION_LABEL}>What&apos;s in it</p>
              <p className="text-[10px] text-muted-foreground/60">As listed on the pack</p>
            </div>

            {/* Additives */}
            {vm.uiMeta.hasAdditives && (
              <div className="space-y-3" data-testid="section-v2-additives">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {vm.ingredients.additives.length === 0
                      ? "No additives detected"
                      : `${vm.ingredients.additives.length} additive${vm.ingredients.additives.length !== 1 ? "s" : ""} detected`}
                  </p>
                  {(vm.score.additiveContext.regulatory ?? 0) > 0 && (
                    <p className="text-xs text-muted-foreground/70">
                      {vm.score.additiveContext.regulatory} regulatory
                    </p>
                  )}
                </div>

                {vm.ingredients.allAdditivesRegulatory && (
                  <p className="text-xs text-muted-foreground leading-snug">
                    All additives present are mandatory fortification (e.g. added iron or folic acid required in some foods), not manufacturing choices.
                  </p>
                )}

                <div className="space-y-0">
                  {vm.ingredients.additives.map((a, i) => (
                    <div
                      key={i}
                      className="py-3 border-b border-border/60 last:border-0"
                      data-testid={`v2-additive-${i}`}
                    >
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${RISK_TEXT[a.riskLevel] ?? RISK_TEXT.low}`}>
                          {a.name}
                        </span>
                        <span className="text-xs text-muted-foreground/70">{a.type}</span>
                        {a.isRegulatory && (
                          <span className="text-xs text-muted-foreground/60 italic">regulatory</span>
                        )}
                      </div>
                      {a.description && (
                        <p className="text-xs text-muted-foreground leading-snug mt-1">{a.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Processing indicators */}
            {vm.ingredients.processingIndicators.length > 0 && (
              <div className="space-y-2" data-testid="section-v2-processing-indicators">
                <p className="text-sm font-medium text-foreground">Processing indicators</p>
                <p className="text-sm text-muted-foreground leading-snug">
                  {vm.ingredients.processingIndicators.join(", ")}
                </p>
              </div>
            )}

            {/* Raw ingredient text - progressive disclosure */}
            {vm.ingredients.unavailable ? (
              <p className="text-xs text-muted-foreground/60 italic" data-testid="text-v2-ingredients-unavailable">
                Ingredient detail unavailable in English
              </p>
            ) : vm.ingredients.rawText ? (
              <div data-testid="section-v2-raw-ingredients">
                <button
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowRawIngredients((v) => !v)}
                  data-testid="button-v2-toggle-raw-ingredients"
                >
                  {showRawIngredients
                    ? <ChevronUp className="h-3.5 w-3.5" />
                    : <ChevronDown className="h-3.5 w-3.5" />}
                  {showRawIngredients ? "Hide" : "Show"} full ingredient list
                </button>
                {showRawIngredients && (
                  <p className="text-xs text-muted-foreground leading-relaxed mt-3" data-testid="text-v2-raw-ingredients">
                    {vm.ingredients.rawText}
                  </p>
                )}
              </div>
            ) : null}

          </CardContent>
        </Card>
      )}

      {/* ── Card 5: Better options ───────────────────────────────────── */}
      {vm.uiMeta.hasSwaps && (
        <Card className="border-border shadow-none" data-testid="card-swaps">
          <CardContent className="p-5 space-y-5">
            <p className={SECTION_LABEL}>A better option?</p>

            {/* Simply Made - whole food */}
            {wholeFoodSwaps.length > 0 && (
              <div className="space-y-3" data-testid="section-v2-simply-made">
                <p className="text-xs font-medium text-muted-foreground">Simply Made</p>
                {wholeFoodSwaps.map((swap, idx) => (
                  <div key={idx} className="rounded-lg bg-muted/30 p-3.5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">
                        <span className="mr-1.5">{swap.emoji}</span>
                        {swap.title}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${effortColor(swap.effort)}`}>
                          {effortLabel(swap.effort)}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {formatTime(swap.timeMinutes)}
                        </span>
                      </div>
                    </div>

                    <button
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      onClick={() => setShowRecipeIndex(showRecipeIndex === idx ? null : idx)}
                      data-testid={`button-v2-toggle-recipe-${idx}`}
                    >
                      {showRecipeIndex === idx
                        ? <ChevronUp className="h-3 w-3" />
                        : <ChevronDown className="h-3 w-3" />}
                      {showRecipeIndex === idx ? "Hide recipe" : "View recipe"}
                    </button>

                    {showRecipeIndex === idx && (
                      <div className="space-y-2.5 pt-1">
                        <ul className="space-y-1.5">
                          {swap.ingredients.map((ing, i) => (
                            <li key={i} className="text-xs text-foreground flex items-start gap-2">
                              <span className="text-muted-foreground/50 mt-0.5 flex-shrink-0">·</span>
                              {ing}
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-muted-foreground leading-relaxed">{swap.method}</p>
                        {swap.tip && (
                          <p className="text-xs text-muted-foreground/70 italic">{swap.tip}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Confidently Choose - packaged alternatives */}
            {packagedSwaps.length > 0 && (
              <div className="space-y-3" data-testid="section-v2-confidently-choose">
                <p className="text-xs font-medium text-muted-foreground">Confidently Choose</p>
                {packagedSwaps.map((swap, idx) => (
                  <div
                    key={swap.product.barcode ?? idx}
                    className="flex items-center gap-3 rounded-lg bg-muted/30 px-4 py-3"
                    data-testid={`v2-packaged-swap-${idx}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-snug truncate">
                        {swap.name}
                      </p>
                      {swap.brand && (
                        <p className="text-xs text-muted-foreground mt-0.5">{swap.brand}</p>
                      )}
                      <div className="flex items-center gap-2.5 mt-1.5">
                        <AppleRating
                          rating={swap.rating}
                          sizePx={18}
                          additiveContext={undefined}
                        />
                        {swap.whyBetter[0] && (
                          <span className="text-xs text-muted-foreground">{swap.whyBetter[0]}</span>
                        )}
                      </div>
                    </div>
                    <button
                      className="flex-shrink-0 p-2 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => onViewProduct(swap.product)}
                      data-testid={`button-v2-view-swap-${idx}`}
                      aria-label={`View ${swap.name}`}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

          </CardContent>
        </Card>
      )}

      {/* ── Card 6: Nutrition (collapsed by default) ─────────────────── */}
      {vm.uiMeta.hasNutrition && vm.nutrition && (
        <Card className="border-border shadow-none" data-testid="card-nutrition">
          <CardContent className="p-5 space-y-4">
            <button
              className="w-full flex items-center justify-between"
              onClick={() => setShowNutrition((v) => !v)}
              data-testid="button-v2-toggle-nutrition"
            >
              <p className={SECTION_LABEL}>Nutrition</p>
              {showNutrition
                ? <ChevronUp className="h-4 w-4 text-muted-foreground/50" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground/50" />}
            </button>

            {showNutrition && (
              <div className="grid grid-cols-3 gap-2" data-testid="v2-nutrition-grid">
                {[
                  { label: "Calories", value: vm.nutrition.calories },
                  { label: "Protein", value: vm.nutrition.protein },
                  { label: "Carbs", value: vm.nutrition.carbs },
                  { label: "Fat", value: vm.nutrition.fat },
                  { label: "Sugar", value: vm.nutrition.sugar },
                  { label: "Salt", value: vm.nutrition.salt },
                ]
                  .filter((item) => item.value !== null)
                  .map((item) => (
                    <div key={item.label} className="text-center py-3 px-2 bg-muted/20 rounded-lg">
                      <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">{item.value}</p>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
